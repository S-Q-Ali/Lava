"""AI Script Writer for short-form video scripts using Groq LLM.

Generates scripts for YouTube Shorts, TikTok, Instagram Reels.
Supports English, Urdu, Hindi, and mixed-language narration.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from ..pipeline.providers.factory import create_provider


class ScriptStyle(str, Enum):
    SHORTS = "shorts"          # YouTube Shorts (30-60s)
    STORYTELLING = "storytelling"  # Narrative with hook
    EDUCATIONAL = "educational"    # Tutorial / explainer
    ENTERTAINMENT = "entertainment"  # Comedy, reactions
    PODCAST_CLIP = "podcast_clip"  # Extracted highlight
    URDU_NARRATION = "urdu_narration"  # Urdu/Hindi voiceover
    NEWS = "news"              # News/breaking update
    MOTIVATIONAL = "motivational"  # Inspiring/motivational
    REVIEW = "review"          # Product/movie review


@dataclass
class ScriptRequest:
    topic: str
    style: ScriptStyle = ScriptStyle.SHORTS
    language: str = "en"  # en, ur, hi, mixed
    duration_seconds: int = 45
    hooks: bool = True
    captions_notes: str = ""
    extra_instructions: str = ""


@dataclass
class ScriptSegment:
    text: str
    duration_hint: float  # seconds
    visual_note: str = ""
    caption_style: str = "normal"


@dataclass
class ScriptResult:
    title: str
    hook: str
    segments: list[ScriptSegment]
    full_text: str
    estimated_duration: float
    language: str


_SYSTEM_PROMPT = """You are a professional short-form video scriptwriter.
You write engaging, concise scripts optimized for vertical video (9:16).
Your scripts are designed for AI-assisted editing with automatic caption generation.

Rules:
- Keep sentences short (5-10 words) for caption readability
- Front-load the hook in the first 2-3 seconds
- Use power words and emotional triggers
- Include visual direction notes in [brackets]
- Match the requested language and style
- Never use profanity or harmful content

Output format: JSON with these fields:
{
  "title": "Video title",
  "hook": "Opening line (first 2-3 seconds)",
  "segments": [
    {
      "text": "Spoken text",
      "duration_hint": 3.0,
      "visual_note": "Visual direction",
      "caption_style": "normal|karaoke|important_word"
    }
  ],
  "full_text": "Complete narration text"
}"""

_STYLE_INSTRUCTIONS = {
    ScriptStyle.SHORTS: "Write a YouTube Shorts script (30-60s). Start with a powerful hook. Use 3-5 short segments. End with a call to action.",
    ScriptStyle.STORYTELLING: "Write a storytelling script. Build tension, use descriptive language, create emotional arc. 4-6 segments.",
    ScriptStyle.EDUCATIONAL: "Write an educational/explainer script. Clear, step-by-step. Use analogies. 4-6 segments.",
    ScriptStyle.ENTERTAINMENT: "Write an entertainment/comedy script. Punchy, surprising, shareable. 3-5 segments.",
    ScriptStyle.PODCAST_CLIP: "Write a podcast clip highlight script. Conversational, insightful, quotable. 3-4 segments.",
    ScriptStyle.URDU_NARRATION: "اردو میں ایک شارٹ ویڈیو اسکرپٹ لکھیں۔ سادہ اور واضح اردو استعمال کریں۔ 3-5 حصے۔ شروع میں مضامین ہو۔",
    ScriptStyle.NEWS: "Write a news/breaking update script. Factual, concise, authoritative. Lead with the headline. 3-4 segments.",
    ScriptStyle.MOTIVATIONAL: "Write a motivational/inspiring script. Use powerful language, personal growth themes, emotional resonance. 4-5 segments.",
    ScriptStyle.REVIEW: "Write a product/movie review script. Balanced, opinionated, quotable. Pros and cons. 3-5 segments.",
}


def generate_script(
    request: ScriptRequest,
    api_key: Optional[str] = None,
    provider_name: str = "groq",
) -> ScriptResult:
    """Generate a video script using AI.

    Args:
        request: Script generation request.
        api_key: LLM API key. If None, reads from env.
        provider_name: LLM provider (groq, cerebras, mistral).

    Returns:
        ScriptResult with generated segments.
    """
    provider = create_provider(provider_name, api_key=api_key or "")

    style_instruction = _STYLE_INSTRUCTIONS.get(request.style, "")
    lang_note = {
        "en": "Write in English.",
        "ur": "اردو میں لکھیں۔",
        "hi": "हिंदी में लिखें।",
        "mixed": "Write in mixed English and Urdu/Hindi (Roman Urdu).",
    }.get(request.language, "Write in English.")

    user_prompt = f"""Topic: {request.topic}
Style: {request.style.value}
Language: {lang_note}
Duration: ~{request.duration_seconds} seconds
{style_instruction}
{('Include strong hooks at the start.' if request.hooks else '')}
{('Additional notes: ' + request.captions_notes if request.captions_notes else '')}
{request.extra_instructions}

Generate the script as JSON."""

    raw = provider.chat(
        prompt=user_prompt,
        system=_SYSTEM_PROMPT,
        temperature=0.7,
        max_tokens=2048,
    )

    # Parse JSON response
    try:
        # Extract JSON from response (may be wrapped in markdown code block)
        json_str = raw
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        data = json.loads(json_str.strip())
    except (json.JSONDecodeError, IndexError):
        # Fallback: treat entire response as script text
        segments = []
        words = raw.split()
        chunk_size = max(1, len(words) // 5)
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            segments.append(ScriptSegment(
                text=chunk,
                duration_hint=request.duration_seconds / max(1, len(words) // chunk_size),
            ))
        return ScriptResult(
            title=request.topic,
            hook=segments[0].text if segments else "",
            segments=segments,
            full_text=raw,
            estimated_duration=float(request.duration_seconds),
            language=request.language,
        )

    segments = []
    total_dur = 0.0
    for seg in data.get("segments", []):
        s = ScriptSegment(
            text=seg.get("text", ""),
            duration_hint=float(seg.get("duration_hint", 3.0)),
            visual_note=seg.get("visual_note", ""),
            caption_style=seg.get("caption_style", "normal"),
        )
        segments.append(s)
        total_dur += s.duration_hint

    return ScriptResult(
        title=data.get("title", request.topic),
        hook=data.get("hook", ""),
        segments=segments,
        full_text=data.get("full_text", " ".join(s.text for s in segments)),
        estimated_duration=total_dur,
        language=request.language,
    )
