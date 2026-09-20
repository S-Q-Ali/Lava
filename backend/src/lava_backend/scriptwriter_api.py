"""FastAPI routes for AI Script Writer."""
from __future__ import annotations
import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from . import (
    ScriptRequest, ScriptStyle, generate_script,
)

router = APIRouter(prefix="/api/scriptwriter", tags=["scriptwriter"])


class ScriptGenRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    style: str = Field(default="shorts", description="shorts|storytelling|educational|entertainment|podcast_clip|urdu_narration")
    language: str = Field(default="en", description="en|ur|hi|mixed")
    duration_seconds: int = Field(default=45, ge=10, le=300)
    hooks: bool = Field(default=True)
    captions_notes: str = Field(default="")
    extra_instructions: str = Field(default="")
    provider: str = Field(default="groq", description="groq|cerebras|mistral")
    api_key: Optional[str] = Field(default=None, description="API key (or use env var)")


class ScriptSegmentResponse(BaseModel):
    text: str
    duration_hint: float
    visual_note: str
    caption_style: str


class ScriptResponse(BaseModel):
    success: bool
    title: str = ""
    hook: str = ""
    segments: list[ScriptSegmentResponse] = []
    full_text: str = ""
    estimated_duration: float = 0.0
    language: str = ""
    error: Optional[str] = None


@router.post("/generate", response_model=ScriptResponse)
async def generate(req: ScriptGenRequest):
    """Generate a video script using AI."""
    try:
        style = ScriptStyle(req.style)
    except ValueError:
        return ScriptResponse(
            success=False,
            error=f"Invalid style '{req.style}'. Use: shorts, storytelling, educational, entertainment, podcast_clip, urdu_narration",
        )

    api_key = req.api_key or os.environ.get("GROQ_API_KEY")
    if not api_key:
        return ScriptResponse(
            success=False,
            error="No API key provided. Set GROQ_API_KEY env var or pass api_key.",
        )

    try:
        script_req = ScriptRequest(
            topic=req.topic,
            style=style,
            language=req.language,
            duration_seconds=req.duration_seconds,
            hooks=req.hooks,
            captions_notes=req.captions_notes,
            extra_instructions=req.extra_instructions,
        )
        result = generate_script(script_req, api_key=api_key, provider_name=req.provider)

        return ScriptResponse(
            success=True,
            title=result.title,
            hook=result.hook,
            segments=[
                ScriptSegmentResponse(
                    text=s.text,
                    duration_hint=s.duration_hint,
                    visual_note=s.visual_note,
                    caption_style=s.caption_style,
                )
                for s in result.segments
            ],
            full_text=result.full_text,
            estimated_duration=result.estimated_duration,
            language=result.language,
        )
    except Exception as e:
        return ScriptResponse(success=False, error=str(e))


@router.get("/styles")
async def list_styles():
    """List available script styles."""
    return [
        {"id": s.value, "name": s.name}
        for s in ScriptStyle
    ]
