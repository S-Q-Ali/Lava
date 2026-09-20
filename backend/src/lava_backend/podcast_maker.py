"""Podcast Maker — multi-turn dialogue generation.

LLM generates multi-speaker dialogue from topic, then edge-tts synthesizes each turn.
"""
from __future__ import annotations

import asyncio
import json
import os
import uuid
from pathlib import Path
from typing import Optional

import edge_tts
from fastapi import APIRouter
from pydantic import BaseModel, Field

from .config import get_config
from .errors import ApiError

router = APIRouter(prefix="/podcast", tags=["podcast"])

PODCAST_OUTPUT_DIR = Path("podcast_output")
PODCAST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Default speakers with different voices
DEFAULT_SPEAKERS = [
    {"name": "Host", "voice": "en-US-GuyNeural"},
    {"name": "Guest", "voice": "en-US-JennyNeural"},
]

TTS_semaphore = asyncio.Semaphore(3)


class PodcastTurn(BaseModel):
    speaker: str
    voice: str
    text: str


class PodcastRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=500)
    num_turns: int = Field(default=6, ge=2, le=20)
    speakers: list[dict] = Field(default=None)
    speed: str = Field(default="+0%")
    api_key: Optional[str] = None


class PodcastResponse(BaseModel):
    success: bool
    audio_path: Optional[str] = None
    turns: list[dict] = []
    duration_ms: int = 0
    error: Optional[str] = None


async def _generate_dialogue(topic: str, num_turns: int, api_key: str | None = None) -> list[dict]:
    """Generate multi-speaker dialogue using LLM."""
    key = api_key or os.environ.get("GROQ_API_KEY") or os.environ.get("CEREBRAS_API_KEY", "")

    if not key:
        # Fallback: generate simple dialogue without LLM
        turns = []
        for i in range(num_turns):
            speaker = DEFAULT_SPEAKERS[i % len(DEFAULT_SPEAKERS)]
            turns.append({
                "speaker": speaker["name"],
                "voice": speaker["voice"],
                "text": f"[Turn {i + 1}] This is a point about {topic}.",
            })
        return turns

    try:
        from groq import Groq

        client = Groq(api_key=key)
        prompt = f"""Generate a {num_turns}-turn podcast dialogue about: {topic}

Return a JSON array of objects, each with "speaker", "voice", and "text" fields.
Use exactly 2 speakers with these voices:
- "Host" using voice "en-US-GuyNeural"
- "Guest" using voice "en-US-JennyNeural"

Make it engaging, conversational, and informative. Each turn should be 1-3 sentences.
Return ONLY valid JSON, no markdown."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000,
        )

        content = response.choices[0].message.content.strip()
        # Try to extract JSON from response
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        return json.loads(content)

    except Exception:
        # Fallback
        turns = []
        for i in range(num_turns):
            speaker = DEFAULT_SPEAKERS[i % len(DEFAULT_SPEAKERS)]
            turns.append({
                "speaker": speaker["name"],
                "voice": speaker["voice"],
                "text": f"[Turn {i + 1}] This is a point about {topic}.",
            })
        return turns


async def _synthesize_turn(
    text: str,
    voice: str,
    speed: str,
    output_path: Path,
) -> int:
    """Synthesize a single turn with edge-tts."""
    async with TTS_semaphore:
        communicate = edge_tts.Communicate(text, voice, rate=speed)
        await communicate.save(str(output_path))
        return output_path.stat().st_size


@router.post("/generate", response_model=PodcastResponse)
async def generate_podcast(req: PodcastRequest):
    """Generate a full podcast episode from a topic.

    - topic: Podcast topic
    - num_turns: Number of dialogue turns (2-20)
    - speakers: Custom speaker config (optional)
    - speed: TTS speed adjustment
    """
    if not req.topic.strip():
        raise ApiError(422, "EMPTY_TOPIC", "Topic cannot be empty")

    if req.num_turns < 2:
        raise ApiError(422, "TOO_FEW_TURNS", "Minimum 2 turns")

    # Generate dialogue
    dialogue = await _generate_dialogue(req.topic, req.num_turns, req.api_key)

    # Synthesize each turn
    audio_files = []
    for i, turn in enumerate(dialogue):
        turn_id = str(uuid.uuid4())[:8]
        audio_path = PODCAST_OUTPUT_DIR / f"podcast_turn_{turn_id}.mp3"

        try:
            await _synthesize_turn(
                text=turn["text"],
                voice=turn["voice"],
                speed=req.speed,
                output_path=audio_path,
            )
            audio_files.append(audio_path)
        except Exception:
            continue

    if not audio_files:
        raise ApiError(502, "SYNTH_FAILED", "Failed to synthesize any podcast turns")

    # Concatenate with FFmpeg
    output_id = str(uuid.uuid4())[:12]
    final_path = PODCAST_OUTPUT_DIR / f"podcast_{output_id}.mp3"

    if len(audio_files) == 1:
        audio_files[0].rename(final_path)
    else:
        import subprocess

        list_file = PODCAST_OUTPUT_DIR / f"concat_{output_id}.txt"
        list_file.write_text("\n".join(f"file '{f}'" for f in audio_files), encoding="utf-8")

        result = subprocess.run(
            [
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", str(list_file), "-c", "copy", str(final_path),
            ],
            capture_output=True,
            timeout=120,
        )
        list_file.unlink(missing_ok=True)

        if result.returncode != 0:
            # Fallback: use filter_complex
            inputs = []
            for f in audio_files:
                inputs.extend(["-i", str(f)])
            n = len(audio_files)
            filter_str = "".join(f"[{i}:a]" for i in range(n)) + f"concat=n={n}:v=0:a=1[out]"
            result2 = subprocess.run(
                ["ffmpeg", "-y"] + inputs + ["-filter_complex", filter_str, "-map", "[out]", str(final_path)],
                capture_output=True,
                timeout=120,
            )
            if result2.returncode != 0:
                raise ApiError(502, "CONCAT_FAILED", "Failed to concatenate podcast audio")

    # Get duration
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", str(final_path)],
        capture_output=True,
        timeout=30,
    )
    duration_ms = 0
    try:
        probe_data = json.loads(probe.stdout)
        duration_ms = int(float(probe_data["format"]["duration"]) * 1000)
    except Exception:
        pass

    # Cleanup turn files
    for f in audio_files:
        f.unlink(missing_ok=True)

    return PodcastResponse(
        success=True,
        audio_path=str(final_path),
        turns=dialogue,
        duration_ms=duration_ms,
    )
