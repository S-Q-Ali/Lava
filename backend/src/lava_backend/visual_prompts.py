"""Visual prompt generator — AI image prompts from transcript text."""
from __future__ import annotations

import json
import os
from enum import Enum
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from .pipeline.providers.factory import create_provider

router = APIRouter(prefix="/api/visual-prompts", tags=["visual-prompts"])


class VisualStyle(str, Enum):
    CINEMATIC = "cinematic"
    ANIME = "anime"
    REALISTIC = "realistic"
    WATERCOLOR = "watercolor"
    CYBERPUNK = "cyberpunk"
    FANTASY = "fantasy"
    MINIMALIST = "minimalist"
    COMIC = "comic"
    VINTAGE = "vintage"
    DARK_MOODY = "dark_moody"
    BRIGHT_VIVID = "bright_vivid"


STYLE_DESCRIPTIONS = {
    VisualStyle.CINEMATIC: "Cinematic film look, dramatic lighting, shallow depth of field, film grain, color grading",
    VisualStyle.ANIME: "Japanese anime style, vibrant colors, expressive eyes, clean linework, Studio Ghibli inspired",
    VisualStyle.REALISTIC: "Photorealistic, high detail, natural lighting, 8K quality, professional photography",
    VisualStyle.WATERCOLOR: "Soft watercolor painting, flowing colors, paper texture, artistic and dreamy",
    VisualStyle.CYBERPUNK: "Neon-lit cyberpunk cityscape, futuristic, holographic, dark with vivid neon accents",
    VisualStyle.FANTASY: "Epic fantasy art, magical atmosphere, ethereal lighting, mythical creatures, enchanted landscapes",
    VisualStyle.MINIMALIST: "Clean minimalist design, simple shapes, negative space, modern aesthetic, flat colors",
    VisualStyle.COMIC: "Bold comic book style, halftone dots, dynamic composition, vivid colors, strong outlines",
    VisualStyle.VINTAGE: "Retro vintage aesthetic, faded warm tones, film texture, nostalgic atmosphere",
    VisualStyle.DARK_MOODY: "Dark moody atmosphere, dramatic shadows, chiaroscuro, mysterious, intense",
    VisualStyle.BRIGHT_VIVID: "Bright vivid colors, high saturation, energetic, pop art inspired, eye-catching",
}


class VisualPromptRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Transcript text or scene description")
    style: VisualStyle = Field(default=VisualStyle.CINEMATIC, description="Art style for the image")
    count: int = Field(default=1, ge=1, le=5, description="Number of prompt variations")
    language: str = Field(default="en", description="Language of the input text")
    provider: str = Field(default="groq", description="LLM provider (groq|cerebras|mistral)")
    api_key: Optional[str] = Field(default=None, description="API key (or use env var)")


class VisualPromptResponse(BaseModel):
    success: bool
    prompts: list[str] = []
    style: str = ""
    error: Optional[str] = None


_SYSTEM_PROMPT = """You are an expert AI image prompt engineer. You create detailed, vivid prompts for AI image generators like DALL-E, Midjourney, and Stable Diffusion.

Rules:
- Each prompt must be a single paragraph (50-150 words)
- Include specific visual details: lighting, composition, color palette, mood
- Reference the scene's emotional tone and key visual elements
- Use descriptive adjectives and sensory language
- Match the requested art style precisely
- Never include text, words, or letters in the image description
- Never include people's names or real identities
- Output ONLY the prompt text, nothing else"""


@router.post("/generate", response_model=VisualPromptResponse)
async def generate_visual_prompts(req: VisualPromptRequest):
    """Generate visual image prompts from text using AI."""
    api_key = req.api_key or os.environ.get("GROQ_API_KEY")
    if not api_key:
        return VisualPromptResponse(
            success=False,
            error="No API key provided. Set GROQ_API_KEY env var or pass api_key.",
        )

    style_desc = STYLE_DESCRIPTIONS.get(req.style, "")

    user_prompt = f"""Scene text: {req.text}

Art style: {req.style.value}
Style details: {style_desc}

Generate {req.count} unique image prompt{"s" if req.count > 1 else ""} for this scene."""

    try:
        provider = create_provider(req.provider, api_key=api_key)
        raw = provider.chat(
            prompt=user_prompt,
            system=_SYSTEM_PROMPT,
            temperature=0.8,
            max_tokens=2048,
        )

        # Parse prompts from response
        prompts = []
        lines = raw.strip().split("\n")
        current = []
        for line in lines:
            line = line.strip()
            if not line:
                if current:
                    prompts.append(" ".join(current))
                    current = []
                continue
            # Skip numbered list markers, bullet points
            if line and line[0] in "1234567890.-*":
                if current:
                    prompts.append(" ".join(current))
                    current = []
                # Extract text after the marker
                cleaned = line.lstrip("1234567890.-*").strip()
                if cleaned:
                    current = [cleaned]
            else:
                current.append(line)
        if current:
            prompts.append(" ".join(current))

        # Trim to requested count
        prompts = prompts[:req.count]

        # Fallback if parsing failed
        if not prompts:
            prompts = [raw.strip()]

        return VisualPromptResponse(
            success=True,
            prompts=prompts,
            style=req.style.value,
        )
    except Exception as e:
        return VisualPromptResponse(
            success=False,
            error="Prompt generation failed. Check your API key and try again.",
        )


@router.get("/styles")
async def list_styles():
    """List available visual styles."""
    return {
        "styles": [
            {"id": s.value, "name": s.name.replace("_", " ").title(), "description": STYLE_DESCRIPTIONS[s]}
            for s in VisualStyle
        ]
    }
