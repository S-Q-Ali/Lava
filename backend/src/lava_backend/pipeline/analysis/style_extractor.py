"""Style extraction — analyze reference video to build StyleProfile."""
from __future__ import annotations
import json
from typing import Any
from ..models.style_profile import StyleProfile, CaptionStyle, ZoomPattern, CutPattern, EffectPattern, AudioMix
from ..providers.base import LLMProvider


def extract_style(provider: LLMProvider, video_info: dict[str, Any], transcript: list[dict[str, Any]], scenes: list[dict[str, Any]], audio_analysis: dict[str, Any]) -> StyleProfile:
    duration = video_info.get("duration", 0.0)
    transcript_text = " ".join(s.get("text", "") for s in transcript)[:2000]
    avg_scene = sum(s.get("duration", 0) for s in scenes) / len(scenes) if scenes else 2.0
    prompt = f"""Analyze this video's editing style and output a JSON StyleProfile.
Duration: {duration:.1f}s, Scenes: {len(scenes)}, Avg scene: {avg_scene:.1f}s
Transcript preview: {transcript_text}
Output: {{"name":"profile","caption":{{"font":"Impact","size":64,"animation":"word-by-word"}},"zoom":{{"enabled":true,"factor":1.10}},"cuts":{{"avg_interval_sec":{avg_scene:.1f},"cut_on":"word-boundary"}},"effects":{{"flash_on_punchline":true,"speed_ramps":true}},"audio":{{"voice_db":-6.0,"master_lufs":-14.0}}}}"""
    response = provider.chat_json(prompt, system="Extract editing style from video metadata. Output valid JSON only.", temperature=0.2)
    try:
        return StyleProfile(name=response.get("name", "extracted"), caption=CaptionStyle(**response.get("caption", {})), zoom=ZoomPattern(**response.get("zoom", {})), cuts=CutPattern(**response.get("cuts", {})), effects=EffectPattern(**response.get("effects", {})), audio=AudioMix(**response.get("audio", {})))
    except Exception:
        return StyleProfile(name="fallback")
