"""FastAPI routes for AI voiceover generation.

Provides endpoints for generating speech from text using edge-tts.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .voiceover.tts import (
    VoiceoverConfig,
    generate_voiceover_async,
    list_voices,
    VOICE_PRESETS,
)

router = APIRouter(prefix="/api/voiceover", tags=["voiceover"])

# Temp directory for generated audio
OUTPUT_DIR = Path(os.environ.get("LAVA_VOICEOVER_DIR", "voiceover_output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class VoiceoverRequest(BaseModel):
    """Request body for voiceover generation."""
    text: str = Field(..., min_length=1, max_length=10000, description="Text to convert to speech")
    voice: str = Field(default="en-US-AriaNeural", description="Voice name (e.g., en-US-AriaNeural)")
    rate: str = Field(default="+0%", description="Speech rate adjustment (e.g., +20%, -10%)")
    pitch: str = Field(default="+0Hz", description="Pitch adjustment (e.g., +10Hz, -5Hz)")
    volume: str = Field(default="+0%", description="Volume adjustment (e.g., +10%, -10%)")
    format: str = Field(default="mp3", description="Output format: mp3 or wav")


class VoiceoverResponse(BaseModel):
    """Response for voiceover generation."""
    success: bool
    file_id: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    voice: str = ""
    error: Optional[str] = None


class VoiceInfoResponse(BaseModel):
    """Response for voice listing."""
    name: str
    gender: str
    locale: str
    language: str


class PresetInfo(BaseModel):
    """Voice preset info."""
    name: str
    voice: str


@router.post("/generate", response_model=VoiceoverResponse)
async def generate(req: VoiceoverRequest):
    """Generate voiceover audio from text.

    Uses edge-tts (Microsoft Edge TTS) — 170+ voices, no API key needed.
    """
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())[:12]
        suffix = f".{req.format}"
        out_name = f"voiceover_{file_id}{suffix}"
        out_path = str(OUTPUT_DIR / out_name)

        config = VoiceoverConfig(
            text=req.text,
            voice=req.voice,
            rate=req.rate,
            pitch=req.pitch,
            volume=req.volume,
            output_path=out_path,
            output_format=req.format,
        )

        result_path = await generate_voiceover_async(config)
        file_size = os.path.getsize(result_path)

        return VoiceoverResponse(
            success=True,
            file_id=file_id,
            file_path=result_path,
            file_size=file_size,
            voice=req.voice,
        )
    except Exception as e:
        return VoiceoverResponse(
            success=False,
            error=str(e),
            voice=req.voice,
        )


@router.get("/download/{file_id}")
async def download(file_id: str, format: str = "mp3"):
    """Download a generated voiceover file."""
    # Find file by ID prefix
    for f in OUTPUT_DIR.iterdir():
        if f.name.startswith(f"voiceover_{file_id}"):
            media_type = "audio/mpeg" if format == "mp3" else "audio/wav"
            return FileResponse(
                path=str(f),
                media_type=media_type,
                filename=f.name,
            )
    raise HTTPException(status_code=404, detail="Voiceover file not found")


@router.get("/voices", response_model=list[VoiceInfoResponse])
async def get_voices(language: Optional[str] = None):
    """List available TTS voices.

    Optionally filter by language code (e.g., 'en', 'ur', 'hi').
    """
    voices = await list_voices(language)
    return [
        VoiceInfoResponse(
            name=v.name,
            gender=v.gender,
            locale=v.locale,
            language=v.language,
        )
        for v in voices
    ]


@router.get("/presets", response_model=list[PresetInfo])
async def get_presets():
    """List available voice presets."""
    return [
        PresetInfo(name=name, voice=voice)
        for name, voice in VOICE_PRESETS.items()
    ]
