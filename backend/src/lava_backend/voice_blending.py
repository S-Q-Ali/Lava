"""Voice blending — mix multiple audio files with FFmpeg amix.

NO heavy downloads required. Uses bundled FFmpeg.
"""
from __future__ import annotations

import asyncio
import os
import subprocess
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .config import get_config
from .errors import ApiError

router = APIRouter(prefix="/api/voiceover", tags=["voice-blending"])

BLEND_OUTPUT_DIR = Path("voiceover_output")
BLEND_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class BlendResult(BaseModel):
    success: bool
    file_id: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[float] = None
    error: Optional[str] = None


def _get_ffmpeg() -> str:
    config = get_config()
    ffmpeg = config.ffmpeg_bin
    if not ffmpeg.exists():
        raise ApiError(503, "FFMPEG_UNAVAILABLE", f"FFmpeg not found at {ffmpeg}")
    return str(ffmpeg)


def _blend_audio(
    input_paths: list[str],
    volumes: list[float],
    output_path: str,
    crossfade: float = 0.0,
) -> dict:
    """Mix multiple audio files with volume weights using FFmpeg amix."""
    ffmpeg = _get_ffmpeg()

    if len(input_paths) < 2:
        raise ValueError("Need at least 2 audio files to blend")

    if len(input_paths) != len(volumes):
        raise ValueError("volumes length must match input_paths length")

    # Build filter complex for amix
    inputs = []
    for path in input_paths:
        inputs.extend(["-i", path])

    # Build volume filters + amix
    filter_parts = []
    for i, vol in enumerate(volumes):
        clamped = max(0.0, min(2.0, vol))
        filter_parts.append(f"[{i}:a]volume={clamped}[a{i}]")

    mix_inputs = "".join(f"[a{i}]" for i in range(len(input_paths)))
    filter_parts.append(
        f"{mix_inputs}amix=inputs={len(input_paths)}:duration=longest:dropout_transition=0[out]"
    )
    filter_complex = ";".join(filter_parts)

    cmd = [
        ffmpeg,
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-acodec", "libmp3lame",
        "-q:a", "2",
        "-y",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg blend failed: {result.stderr[:500]}")

    # Get duration
    probe_cmd = [
        str(get_config().ffprobe_bin),
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        output_path,
    ]
    probe = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
    duration = float(probe.stdout.strip()) if probe.stdout.strip() else 0.0

    return {"duration": duration}


@router.post("/blend", response_model=BlendResult)
async def blend_audio(
    files: list[UploadFile] = File(...),
    volumes: str = Form(default=""),
    output_format: str = Form(default="mp3"),
):
    """Blend (mix) multiple audio files with volume weights.

    - files: 2+ audio files to mix
    - volumes: comma-separated volume weights (e.g. "0.8,1.0,0.6")
               Defaults to equal weights (1.0 each)
    """
    if len(files) < 2:
        raise ApiError(400, "BLEND_NEED_FILES", "Blend requires at least 2 audio files.")

    file_id = str(uuid.uuid4())[:12]
    suffix = f".{output_format}"
    out_name = f"blend_{file_id}{suffix}"
    out_path = str(BLEND_OUTPUT_DIR / out_name)

    # Save uploaded files
    input_paths = []
    upload_dir = get_config().cache_dir / "tmp" / file_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    try:
        for i, upload in enumerate(files):
            name = upload.filename or f"input_{i}.mp3"
            dest = upload_dir / Path(name).name
            content = await upload.read()
            if not content:
                raise ApiError(400, "EMPTY_FILE", f"Audio file {i+1} is empty.")
            dest.write_bytes(content)
            input_paths.append(str(dest))

        # Parse volumes
        if volumes.strip():
            vol_list = [float(v.strip()) for v in volumes.split(",")]
        else:
            vol_list = [1.0] * len(input_paths)

        if len(vol_list) != len(input_paths):
            raise ApiError(
                422,
                "VOLUME_COUNT",
                f"Expected {len(input_paths)} volume values, got {len(vol_list)}.",
            )

        result = await asyncio.to_thread(
            _blend_audio, input_paths, vol_list, out_path
        )

        file_size = os.path.getsize(out_path)
        return BlendResult(
            success=True,
            file_id=file_id,
            file_path=out_path,
            file_size=file_size,
            duration=result["duration"],
        )
    except ApiError:
        raise
    except Exception as exc:
        raise ApiError(500, "BLEND_FAILED", f"Audio blending failed: {exc}")
    finally:
        # Clean up temp files
        for p in input_paths:
            Path(p).unlink(missing_ok=True)
        upload_dir.rmdir()


@router.post("/blend/download/{file_id}")
async def download_blend(file_id: str):
    """Download a blended audio file."""
    for f in BLEND_OUTPUT_DIR.iterdir():
        if f.name.startswith(f"blend_{file_id}"):
            return FileResponse(
                path=str(f),
                media_type="audio/mpeg",
                filename=f.name,
            )
    raise ApiError(404, "NOT_FOUND", "Blended file not found")
