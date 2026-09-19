"""Bulk TTS — batch text-to-speech generation with ZIP download.

Import TXT file (one script per line), generate all, download as ZIP.
"""
from __future__ import annotations

import asyncio
import io
import os
import zipfile
from pathlib import Path
from typing import Optional

import edge_tts
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .errors import ApiError

router = APIRouter(prefix="/api/bulk-tts", tags=["bulk-tts"])

TTS_semaphore = asyncio.Semaphore(3)


class BulkTTSRequest(BaseModel):
    lines: list[str] = Field(..., min_length=1, max_length=50)
    voice: str = Field(default="en-US-GuyNeural")
    speed: str = Field(default="+0%")


class BulkTTSResult(BaseModel):
    index: int
    text: str
    filename: str
    file_size: int = 0
    duration_ms: int = 0


class BulkTTSResponse(BaseModel):
    success: bool
    results: list[BulkTTSResult] = []
    total: int = 0
    error: Optional[str] = None


async def _generate_one(line: str, voice: str, speed: str, index: int) -> BulkTTSResult:
    """Generate a single TTS audio file."""
    async with TTS_semaphore:
        filename = f"tts_{index:03d}.mp3"
        out_path = Path("bulk_tts_output") / filename
        out_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            communicate = edge_tts.Communicate(line.strip(), voice, rate=speed)
            await communicate.save(str(out_path))
            file_size = out_path.stat().st_size

            return BulkTTSResult(
                index=index,
                text=line.strip(),
                filename=filename,
                file_size=file_size,
            )
        except Exception as exc:
            return BulkTTSResult(
                index=index,
                text=line.strip(),
                filename=filename,
                file_size=0,
            )


@router.post("/generate", response_model=BulkTTSResponse)
async def generate_bulk(req: BulkTTSRequest):
    """Generate TTS for multiple lines.

    - lines: Array of text strings
    - voice: edge-tts voice name
    - speed: TTS speed (e.g. "+0%", "+20%", "-10%")
    """
    if not req.lines:
        raise ApiError(422, "NO_LINES", "No text lines provided")

    tasks = [_generate_one(line, req.voice, req.speed, i) for i, line in enumerate(req.lines)]
    results = await asyncio.gather(*tasks)

    return BulkTTSResponse(
        success=True,
        results=list(results),
        total=len(results),
    )


@router.post("/upload-and-generate", response_model=BulkTTSResponse)
async def upload_and_generate(
    file: UploadFile = File(...),
    voice: str = Form(default="en-US-GuyNeural"),
    speed: str = Form(default="+0%"),
):
    """Upload a TXT file (one script per line) and generate TTS for all lines."""
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    if not lines:
        raise ApiError(422, "EMPTY_FILE", "Uploaded file contains no text lines")

    if len(lines) > 50:
        raise ApiError(422, "TOO_MANY_LINES", f"Maximum 50 lines, got {len(lines)}")

    req = BulkTTSRequest(lines=lines, voice=voice, speed=speed)
    return await generate_bulk(req)


@router.post("/download-zip")
async def download_zip(
    lines: str = Form(...),
    voice: str = Form(default="en-US-GuyNeural"),
    speed: str = Form(default="+0%"),
):
    """Generate all TTS lines and download as a ZIP file."""
    import json as _json

    line_list = _json.loads(lines)
    if not line_list:
        raise ApiError(422, "NO_LINES", "No text lines provided")

    req = BulkTTSRequest(lines=line_list, voice=voice, speed=speed)
    result = await generate_bulk(req)

    # Create ZIP
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for r in result.results:
            if r.file_size > 0:
                file_path = Path("bulk_tts_output") / r.filename
                if file_path.exists():
                    zf.writestr(r.filename, file_path.read_bytes())

    zip_buffer.seek(0)

    return StreamingResponse(
        io.BytesIO(zip_buffer.read()),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=bulk_tts_output.zip"},
    )
