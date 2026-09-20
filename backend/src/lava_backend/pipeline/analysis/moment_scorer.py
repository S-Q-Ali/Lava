"""Moment scoring — LLM-based clip identification from transcript."""
from __future__ import annotations
from typing import Any
from ..models.clip_plan import ClipPlan, ZoomEvent, SpeedRamp
from ..providers.base import LLMProvider


SYSTEM_PROMPT = """You are an expert short-form video editor for TikTok, YouTube Shorts, and Instagram Reels.
Identify the BEST moments from a long-form video transcript that will go viral as short clips.
Each clip must be self-contained, score on hook strength/emotional intensity/quotability/narrative completeness.
Target 15-60 seconds per clip. Output valid JSON only."""

SCORING_PROMPT = """Given this transcript with timestamps, identify the top {max_clips} clip moments.

SOURCE: Duration {duration:.1f}s, Title: {title}

TRANSCRIPT:
{transcript}

{style_context}

OUTPUT (strict JSON):
{{"clips": [{{"id": "clip-001", "start": 0.0, "end": 30.0, "score": 0.85, "reason": "Strong hook", "zoom_events": [{{"start": 14.5, "end": 16.5, "zoom": 1.10, "ramp_sec": 0.08}}], "speed_ramps": [], "flash_frames": [15.0], "caption_emphasis": ["keyword"], "reframe_mode": "face-track", "audio_boost_db": 0.0}}]}}
Be selective. Only include genuinely compelling moments."""


def score_moments(provider: LLMProvider, transcript: list[dict[str, Any]], duration: float, title: str = "", max_clips: int = 10, style_context: str = "", temperature: float = 0.3) -> list[ClipPlan]:
    transcript_text = "\n".join(f"[{int(s.get('start',0))//60:02d}:{int(s.get('start',0))%60:02d}] {s.get('text','')}" for s in transcript if s.get("text"))
    if not style_context:
        style_context = "STYLE: Fast-paced, punchy editing with zoom punch-ins, word-by-word captions, hard cuts, flash on punchlines."
    prompt = SCORING_PROMPT.format(max_clips=max_clips, duration=duration, title=title or "Unknown", transcript=transcript_text[:4000], style_context=style_context)
    response = provider.chat_json(prompt, system=SYSTEM_PROMPT, temperature=temperature)
    clips = []
    for c in response.get("clips", []):
        try:
            clip = ClipPlan(
                id=c["id"], start=float(c["start"]), end=float(c["end"]), score=float(c["score"]),
                reason=c.get("reason", ""),
                zoom_events=[ZoomEvent(**z) for z in c.get("zoom_events", [])],
                speed_ramps=[SpeedRamp(**s) for s in c.get("speed_ramps", [])],
                flash_frames=[float(f) for f in c.get("flash_frames", [])],
                caption_emphasis=c.get("caption_emphasis", []),
                reframe_mode=c.get("reframe_mode", "face-track"),
                audio_boost_db=float(c.get("audio_boost_db", 0.0)),
            )
            if clip.start < clip.end and clip.duration >= 5.0:
                clips.append(clip)
        except (KeyError, ValueError, TypeError):
            continue
    clips.sort(key=lambda c: c.score, reverse=True)
    return clips[:max_clips]
