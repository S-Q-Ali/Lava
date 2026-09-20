"""Sound FX — hybrid SFX system.

ZzFX procedural generator + Wikimedia Commons search + Internet Archive search.
No API key required for core functionality.
"""
from __future__ import annotations

import asyncio
import io
import json
import math
import struct
import uuid
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .errors import ApiError

router = APIRouter(prefix="/sfx", tags=["sfx"])

SFX_CACHE_DIR = Path("sfx_cache")
SFX_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# ZzFX sound parameter presets
SFX_PRESETS = {
    "whoosh": {"frequency": 600, "attack": 0, "sustain": 0.2, "decay": 0.3, "volume": 0.3},
    "impact": {"frequency": 200, "attack": 0.01, "sustain": 0.1, "decay": 0.4, "volume": 0.5},
    "click": {"frequency": 1200, "attack": 0.001, "sustain": 0.02, "decay": 0.05, "volume": 0.3},
    "ding": {"frequency": 880, "attack": 0.001, "sustain": 0.3, "decay": 0.5, "volume": 0.3},
    "buzz": {"frequency": 150, "attack": 0.01, "sustain": 0.5, "decay": 0.3, "volume": 0.2},
    "pop": {"frequency": 400, "attack": 0.001, "sustain": 0.05, "decay": 0.1, "volume": 0.4},
    "swoosh": {"frequency": 500, "attack": 0.05, "sustain": 0.3, "decay": 0.2, "volume": 0.25},
    "alert": {"frequency": 1000, "attack": 0.001, "sustain": 0.1, "decay": 0.2, "volume": 0.4},
    "notification": {"frequency": 660, "attack": 0.001, "sustain": 0.15, "decay": 0.3, "volume": 0.3},
    "glitch": {"frequency": 300, "attack": 0.001, "sustain": 0.05, "decay": 0.08, "volume": 0.35},
    "rumble": {"frequency": 80, "attack": 0.1, "sustain": 0.5, "decay": 0.8, "volume": 0.3},
    "sparkle": {"frequency": 1500, "attack": 0.001, "sustain": 0.1, "decay": 0.15, "volume": 0.2},
}


class SFXSearchResult(BaseModel):
    id: str
    title: str
    source: str
    duration: float = 0.0
    download_url: str = ""
    preview_url: str = ""


class SFXSearchResponse(BaseModel):
    results: list[SFXSearchResult]
    total: int
    source: str


class ZzFXRequest(BaseModel):
    preset: str = Field(default="whoosh", description="Sound preset name")
    frequency: float = Field(default=440, ge=20, le=2000)
    attack: float = Field(default=0.01, ge=0, le=2)
    sustain: float = Field(default=0.1, ge=0, le=2)
    decay: float = Field(default=0.3, ge=0, le=2)
    volume: float = Field(default=0.3, ge=0, le=1)
    slide: float = Field(default=0, ge=-1, le=1)
    noise: float = Field(default=0, ge=0, le=1)
    modulation: float = Field(default=0, ge=0, le=1)


def _zzfx_generate(
    frequency: float = 440,
    attack: float = 0.01,
    sustain: float = 0.1,
    decay: float = 0.3,
    volume: float = 0.3,
    slide: float = 0,
    noise: float = 0,
    sample_rate: int = 44100,
) -> bytes:
    """Generate a sound using ZzFX-style synthesis."""
    total_time = attack + sustain + decay
    num_samples = int(sample_rate * total_time)
    samples = []

    for i in range(num_samples):
        t = i / sample_rate
        progress = i / num_samples

        # Envelope
        if t < attack:
            env = t / attack if attack > 0 else 1
        elif t < attack + sustain:
            env = 1.0
        else:
            remaining = (t - attack - sustain) / decay if decay > 0 else 1
            env = max(0, 1 - remaining)

        # Frequency modulation
        freq = frequency * (1 + slide * t)

        # Waveform (mixture of sine and square)
        phase = (t * freq * 2 * math.pi) % (2 * math.pi)
        wave = math.sin(phase)
        if noise > 0:
            import random
            wave = wave * (1 - noise) + (random.random() * 2 - 1) * noise

        sample = wave * env * volume * 0.8
        samples.append(max(-1, min(1, sample)))

    # Convert to 16-bit PCM WAV
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align

    wav = io.BytesIO()
    # WAV header
    wav.write(b"RIFF")
    wav.write(struct.pack("<I", 36 + data_size))
    wav.write(b"WAVE")
    wav.write(b"fmt ")
    wav.write(struct.pack("<I", 16))
    wav.write(struct.pack("<HHIIHH", 1, num_channels, sample_rate, byte_rate, block_align, bits_per_sample))
    wav.write(b"data")
    wav.write(struct.pack("<I", data_size))

    # PCM data
    for s in samples:
        wav.write(struct.pack("<h", int(s * 32767)))

    return wav.getvalue()


@router.get("/presets")
async def list_presets():
    """List available ZzFX sound presets."""
    return {"presets": list(SFX_PRESETS.keys())}


@router.post("/generate")
async def generate_sfx(req: ZzFXRequest):
    """Generate a procedural sound effect using ZzFX synthesis.

    Returns a WAV audio file.
    """
    preset = SFX_PRESETS.get(req.preset, SFX_PRESETS["whoosh"])

    audio_data = _zzfx_generate(
        frequency=req.frequency or preset["frequency"],
        attack=req.attack if req.attack > 0 else preset["attack"],
        sustain=req.sustain if req.sustain > 0 else preset["sustain"],
        decay=req.decay if req.decay > 0 else preset["decay"],
        volume=req.volume if req.volume > 0 else preset["volume"],
        slide=req.slide,
        noise=req.noise,
    )

    return StreamingResponse(
        io.BytesIO(audio_data),
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename=sfx_{req.preset}.wav"},
    )


@router.get("/search/wikimedia")
async def search_wikimedia(query: str = "", limit: int = 10):
    """Search Wikimedia Commons for free sound effects."""
    if not query:
        raise ApiError(400, "NO_QUERY", "Search query is required")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": f"{query} filetype:ogg",
                    "srnamespace": "6",
                    "srlimit": str(min(limit, 50)),
                    "format": "json",
                },
            )
            data = resp.json()
            results = []
            for item in data.get("query", {}).get("search", []):
                results.append(SFXSearchResult(
                    id=str(item.get("pageid", "")),
                    title=item.get("title", "").replace("File:", ""),
                    source="Wikimedia Commons",
                    download_url=f"https://commons.wikimedia.org/wiki/Special:FilePath/{item.get('title', '').replace(' ', '_')}",
                ))

            return SFXSearchResponse(results=results, total=len(results), source="Wikimedia Commons")
    except Exception:
        return SFXSearchResponse(results=[], total=0, source="Wikimedia Commons")


@router.get("/search/archive")
async def search_archive(query: str = "", limit: int = 10):
    """Search Internet Archive for free sound effects."""
    if not query:
        raise ApiError(400, "NO_QUERY", "Search query is required")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://archive.org/advancedsearch.php",
                params={
                    "q": f"({query}) AND mediatype:(audio) AND collection:(audio)",
                    "fl[]": "identifier,title,description",
                    "rows": str(min(limit, 50)),
                    "output": "json",
                },
            )
            data = resp.json()
            results = []
            for doc in data.get("response", {}).get("docs", []):
                identifier = doc.get("identifier", "")
                results.append(SFXSearchResult(
                    id=identifier,
                    title=doc.get("title", ""),
                    source="Internet Archive",
                    download_url=f"https://archive.org/download/{identifier}",
                ))

            return SFXSearchResponse(results=results, total=len(results), source="Internet Archive")
    except Exception:
        return SFXSearchResponse(results=[], total=0, source="Internet Archive")


@router.get("/download")
async def download_sfx(url: str):
    """Download an SFX file from a URL and cache it.

    Only allows downloads from known safe domains to prevent SSRF.
    """
    if not url:
        raise ApiError(400, "NO_URL", "Download URL is required")

    # SSRF protection: allowlist of safe domains
    from urllib.parse import urlparse
    parsed = urlparse(url)
    ALLOWED_HOSTS = {
        "commons.wikimedia.org",
        "upload.wikimedia.org",
        "archive.org",
        "ia600504.us.archive.org",
        "ia800504.us.archive.org",
        "ia601200.us.archive.org",
        "ia801200.us.archive.org",
    }
    if parsed.hostname not in ALLOWED_HOSTS:
        raise ApiError(403, "FORBIDDEN", f"Downloads not allowed from: {parsed.hostname}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise ApiError(502, "DOWNLOAD_FAILED", f"Failed to download: HTTP {resp.status_code}")

            # Limit file size to 10MB
            if len(resp.content) > 10 * 1024 * 1024:
                raise ApiError(413, "TOO_LARGE", "File too large (max 10MB)")

            file_id = str(uuid.uuid4())[:12]
            content_type = resp.headers.get("content-type", "audio/ogg")
            ext = ".ogg" if "ogg" in content_type else ".mp3" if "mpeg" in content_type else ".wav"
            out_path = SFX_CACHE_DIR / f"sfx_{file_id}{ext}"
            out_path.write_bytes(resp.content)

            from fastapi.responses import FileResponse
            return FileResponse(
                path=str(out_path),
                media_type=content_type,
                filename=f"sfx_{file_id}{ext}",
            )
    except ApiError:
        raise
    except Exception as exc:
        raise ApiError(502, "DOWNLOAD_FAILED", "Download failed")
