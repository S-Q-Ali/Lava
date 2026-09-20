"""Bulk image generation — Gemini Imagen 3 + custom upload.

Uses Google Gemini API (free tier: 1500 req/day).
Also supports uploading custom images for the timeline.
"""
from __future__ import annotations

import asyncio
import base64
import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .config import get_config
from .errors import ApiError

router = APIRouter(prefix="/image-gen", tags=["image-gen"])

IMAGE_OUTPUT_DIR = Path("image_gen_output")
IMAGE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class ImageGenRequest(BaseModel):
    prompts: list[str] = Field(..., min_length=1, max_length=20)
    style: str = Field(default="cinematic", description="Art style for generation")
    aspect_ratio: str = Field(default="9:16", description="1:1, 16:9, 9:16, 4:3, 3:4")
    api_key: Optional[str] = Field(default=None)


class GeneratedImage(BaseModel):
    id: str
    prompt: str
    file_path: str
    file_size: int = 0
    width: int = 0
    height: int = 0


class ImageGenResponse(BaseModel):
    success: bool
    images: list[GeneratedImage] = []
    error: Optional[str] = None


async def _generate_with_gemini(
    prompt: str,
    api_key: str,
    aspect_ratio: str = "9:16",
) -> dict:
    """Generate image using Google Gemini Imagen 3 API."""
    import httpx

    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict"

    # Map aspect ratio to Imagen dimensions
    ratio_map = {
        "1:1": (1024, 1024),
        "16:9": (1536, 768),
        "9:16": (768, 1536),
        "4:3": (1280, 960),
        "3:4": (960, 1280),
    }
    width, height = ratio_map.get(aspect_ratio, (768, 1536))

    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": aspect_ratio,
            "safetyFilterLevel": "block_some",
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(url, json=payload, headers={"Authorization": f"Bearer {api_key}"})
        if resp.status_code != 200:
            error_body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            error_msg = error_body.get("error", {}).get("message", f"HTTP {resp.status_code}")
            raise RuntimeError(f"Gemini API error: {error_msg}")

        data = resp.json()
        predictions = data.get("predictions", [])
        if not predictions:
            raise RuntimeError("No images returned from Gemini API")

        image_data = predictions[0].get("bytesBase64Encoded", "")
        if not image_data:
            raise RuntimeError("Empty image data from Gemini API")

        return {
            "image_bytes": base64.b64decode(image_data),
            "width": width,
            "height": height,
        }


async def _generate_with_gemini_native(
    prompt: str,
    api_key: str,
    aspect_ratio: str = "9:16",
) -> dict:
    """Generate image using Gemini native image generation (newer API)."""
    import httpx

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

    payload = {
        "contents": [{"parts": [{"text": f"Generate an image: {prompt}"}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(url, json=payload, headers={"Authorization": f"Bearer {api_key}"})
        if resp.status_code != 200:
            error_body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            error_msg = error_body.get("error", {}).get("message", f"HTTP {resp.status_code}")
            raise RuntimeError(f"Gemini API error: {error_msg}")

        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("No candidates returned from Gemini API")

        parts = candidates[0].get("content", {}).get("parts", [])
        for part in parts:
            if "inlineData" in part:
                image_data = part["inlineData"]["data"]
                return {
                    "image_bytes": base64.b64decode(image_data),
                    "width": 768,
                    "height": 1344,
                }

        raise RuntimeError("No image found in Gemini response")


@router.post("/batch", response_model=ImageGenResponse)
async def generate_batch(
    prompts: str = Form(...),
    style: str = Form(default="cinematic"),
    aspect_ratio: str = Form(default="9:16"),
    api_key: str = Form(default=""),
):
    """Generate multiple images from prompts using Gemini API.

    - prompts: JSON array of prompt strings
    - style: Art style (cinematic, anime, realistic, etc.)
    - aspect_ratio: 1:1, 16:9, 9:16, 4:3, 3:4
    """
    import json

    key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
    if not key:
        raise ApiError(
            422,
            "NO_GEMINI_API_KEY",
            "No Gemini API key. Set GEMINI_API_KEY env var or pass api_key.",
        )

    try:
        prompt_list = json.loads(prompts)
    except json.JSONDecodeError:
        raise ApiError(422, "INVALID_PROMPTS", "prompts must be a JSON array of strings")

    if not isinstance(prompt_list, list) or len(prompt_list) == 0:
        raise ApiError(422, "INVALID_PROMPTS", "prompts must be a non-empty array")

    if len(prompt_list) > 20:
        raise ApiError(422, "TOO_MANY", "Maximum 20 prompts per batch")

    generated = []
    for prompt_text in prompt_list:
        try:
            file_id = str(uuid.uuid4())[:12]
            out_name = f"gen_{file_id}.png"
            out_path = IMAGE_OUTPUT_DIR / out_name

            # Try native first, fallback to Imagen
            try:
                result = await _generate_with_gemini_native(prompt_text, key, aspect_ratio)
            except Exception:
                result = await _generate_with_gemini(prompt_text, key, aspect_ratio)

            out_path.write_bytes(result["image_bytes"])
            file_size = out_path.stat().st_size

            generated.append(GeneratedImage(
                id=file_id,
                prompt=prompt_text,
                file_path=str(out_path),
                file_size=file_size,
                width=result["width"],
                height=result["height"],
            ))
        except Exception as exc:
            # Skip failed images, continue with others
            continue

    if not generated:
        raise ApiError(502, "GENERATION_FAILED", "All image generations failed. Check API key and prompts.")

    return ImageGenResponse(success=True, images=generated)


@router.post("/upload")
async def upload_custom_image(
    file: UploadFile = File(...),
    prompt: str = Form(default=""),
):
    """Upload a custom image for use in the timeline."""
    if not file.filename:
        raise ApiError(400, "NO_FILE", "No file provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}:
        raise ApiError(422, "UNSUPPORTED_FORMAT", f"Unsupported image format: {ext}")

    file_id = str(uuid.uuid4())[:12]
    out_name = f"custom_{file_id}{ext}"
    out_path = IMAGE_OUTPUT_DIR / out_name

    content = await file.read()
    if not content:
        raise ApiError(400, "EMPTY_FILE", "Uploaded file is empty")

    out_path.write_bytes(content)

    return {
        "success": True,
        "id": file_id,
        "file_path": str(out_path),
        "file_size": len(content),
        "prompt": prompt,
        "filename": file.filename,
    }


@router.get("/download/{image_id}")
async def download_image(image_id: str):
    """Download a generated or uploaded image."""
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', image_id):
        raise ApiError(400, "INVALID_ID", "Invalid image ID")
    for f in IMAGE_OUTPUT_DIR.iterdir():
        if f.name.startswith(f"gen_{image_id}") or f.name.startswith(f"custom_{image_id}"):
            media_type = "image/png" if f.suffix == ".png" else "image/jpeg"
            return FileResponse(path=str(f), media_type=media_type, filename=f.name)
    raise ApiError(404, "NOT_FOUND", "Image not found")


@router.delete("/{image_id}")
async def delete_image(image_id: str):
    """Delete a generated image."""
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', image_id):
        raise ApiError(400, "INVALID_ID", "Invalid image ID")
    for f in IMAGE_OUTPUT_DIR.iterdir():
        if f.name.startswith(f"gen_{image_id}") or f.name.startswith(f"custom_{image_id}"):
            f.unlink()
            return {"success": True, "message": "Image deleted"}
    raise ApiError(404, "NOT_FOUND", "Image not found")
