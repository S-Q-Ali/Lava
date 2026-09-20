"""AI Voiceover module using edge-tts (170+ Microsoft voices, free)."""

from .tts import generate_voiceover, list_voices, VoiceoverConfig

__all__ = ["generate_voiceover", "list_voices", "VoiceoverConfig"]
