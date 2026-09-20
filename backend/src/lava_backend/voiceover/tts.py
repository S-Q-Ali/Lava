"""Edge-TTS wrapper for AI voiceover generation.

Uses Microsoft Edge's free TTS API — 170+ voices, no API key needed.
Supports English, Urdu, Hindi, and 45+ other languages.
"""

from __future__ import annotations

import asyncio
import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import edge_tts


@dataclass
class VoiceoverConfig:
    """Configuration for voiceover generation."""
    text: str
    voice: str = "en-US-AriaNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"
    volume: str = "+0%"
    output_path: Optional[str] = None
    output_format: str = "mp3"  # mp3 or wav


@dataclass
class VoiceInfo:
    """Metadata for a single TTS voice."""
    name: str
    gender: str
    locale: str
    language: str = ""
    preview_url: str = ""


# Curated voice presets for common use cases
VOICE_PRESETS = {
    "narrator_male": "en-US-AndrewNeural",
    "narrator_female": "en-US-AvaMultilingualNeural",
    "energetic_male": "en-US-BrianNeural",
    "energetic_female": "en-US-EmmaNeural",
    "calm_male": "en-US-ChristopherNeural",
    "calm_female": "en-US-JennyNeural",
    "deep_male": "en-US-GuyNeural",
    "young_female": "en-US-AnaNeural",
    "newsreader_male": "en-GB-RyanNeural",
    "newsreader_female": "en-GB-SoniaNeural",
    "indian_male": "en-IN-PrabhatNeural",
    "indian_female": "en-IN-NeerjaNeural",
    "pakistani_male": "ur-PK-AsadNeural",
    "pakistani_female": "ur-PK-UzmaNeural",
    "hindi_male": "hi-IN-MadhurNeural",
    "hindi_female": "hi-IN-SwaraNeural",
    "urdu_male": "ur-IN-SalmanNeural",
    "urdu_female": "ur-IN-GulNeural",
}


def _normalize_rate(rate: str | float) -> str:
    """Normalize rate to edge-tts format like '+20%' or '-10%'."""
    if isinstance(rate, str):
        rate = rate.replace("%", "").replace("+", "").strip()
    num = int(round(float(rate)))
    if num == 0:
        return "+0%"
    return f"+{num}%" if num > 0 else f"{num}%"


def _normalize_pitch(pitch: str | float) -> str:
    """Normalize pitch to edge-tts format like '+10Hz' or '-5Hz'."""
    if isinstance(pitch, str):
        pitch = pitch.replace("Hz", "").replace("+", "").strip()
    num = int(round(float(pitch)))
    if num == 0:
        return "+0Hz"
    return f"+{num}Hz" if num > 0 else f"{num}Hz"


def _normalize_volume(volume: str | float) -> str:
    """Normalize volume to edge-tts format like '+10%' or '-10%'."""
    if isinstance(volume, str):
        volume = volume.replace("%", "").replace("+", "").strip()
    num = int(round(float(volume)))
    if num == 0:
        return "+0%"
    return f"+{num}%" if num > 0 else f"{num}%"


async def _generate_async(config: VoiceoverConfig) -> str:
    """Generate voiceover audio asynchronously."""
    # Determine output path
    if config.output_path:
        out_path = config.output_path
    else:
        suffix = f".{config.output_format}"
        fd, out_path = tempfile.mkstemp(suffix=suffix, prefix="lava_voiceover_")
        os.close(fd)

    # Ensure output directory exists
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)

    # Normalize parameters
    rate = _normalize_rate(config.rate)
    pitch = _normalize_pitch(config.pitch)
    volume = _normalize_volume(config.volume)

    # Generate audio
    communicate = edge_tts.Communicate(
        text=config.text,
        voice=config.voice,
        rate=rate,
        pitch=pitch,
        volume=volume,
    )

    await communicate.save(out_path)

    # Verify file was created
    if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
        raise RuntimeError(f"Failed to generate voiceover at {out_path}")

    return out_path


async def _list_voices_async(language: Optional[str] = None) -> list[VoiceInfo]:
    """List available TTS voices, optionally filtered by language code.

    Language filter matches the locale prefix (e.g. 'en' matches en-US, en-GB;
    'ur' matches ur-PK, ur-IN; 'hi' matches hi-IN).
    """
    raw_voices = await edge_tts.list_voices()
    voices = []
    for v in raw_voices:
        voice = VoiceInfo(
            name=v["ShortName"],
            gender=v["Gender"],
            locale=v["Locale"],
            language=v.get("LocaleName", v["Locale"]),
        )
        if language:
            lang_lower = language.lower()
            locale_lower = v["Locale"].lower()
            # Match language prefix: "en" matches "en-US", "ur" matches "ur-PK"
            if locale_lower.startswith(lang_lower + "-") or locale_lower == lang_lower:
                voices.append(voice)
        else:
            voices.append(voice)
    return voices


def generate_voiceover(config: VoiceoverConfig) -> str:
    """Generate voiceover audio (sync wrapper).

    Args:
        config: Voiceover configuration with text, voice, rate, pitch, etc.

    Returns:
        Path to the generated audio file.

    Raises:
        RuntimeError: If generation fails.
    """
    return asyncio.run(_generate_async(config))


async def generate_voiceover_async(config: VoiceoverConfig) -> str:
    """Generate voiceover audio (async version for FastAPI)."""
    return await _generate_async(config)


async def list_voices(language: Optional[str] = None) -> list[VoiceInfo]:
    """List available TTS voices.

    Args:
        language: Optional language filter (e.g., 'en', 'ur', 'hi').

    Returns:
        List of VoiceInfo objects.
    """
    return await _list_voices_async(language)


def get_preset_voice(preset_name: str) -> str:
    """Get voice name from a preset.

    Args:
        preset_name: Name of the preset (e.g., 'narrator_male').

    Returns:
        Voice name string.

    Raises:
        KeyError: If preset not found.
    """
    if preset_name not in VOICE_PRESETS:
        available = ", ".join(VOICE_PRESETS.keys())
        raise KeyError(f"Preset '{preset_name}' not found. Available: {available}")
    return VOICE_PRESETS[preset_name]
