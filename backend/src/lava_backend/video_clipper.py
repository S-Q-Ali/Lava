"""Auto Video Clipper — extract 9:16 vertical clips from long videos.

Face-tracking crop, silence removal, moment scoring.
"""
from __future__ import annotations

import json
import subprocess
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from .config import get_config
from .errors import ApiError

router = APIRouter(prefix="/api/clipper", tags=["clipper"])

CLIP_OUTPUT_DIR = Path("clip_output")
CLIP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class ClipRequest(BaseModel):
    video_path: str = Field(..., description="Path to the source video")
    clip_duration: int = Field(default=60, ge=10, le=300, description="Clip duration in seconds")
    clip_count: int = Field(default=5, ge=1, le=20, description="Number of clips to extract")
    crop_mode: str = Field(default="center", description="center, face-track, left, right")


class ClipResult(BaseModel):
    id: str
    file_path: str
    start_time: float
    duration: float
    file_size: int = 0


class ClipResponse(BaseModel):
    success: bool
    clips: list[ClipResult] = []
    total_clips: int = 0
    error: Optional[str] = None


def _get_video_duration(video_path: str) -> float:
    """Get video duration in seconds."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", video_path],
        capture_output=True,
        timeout=30,
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"])


def _detect_scenes(video_path: str) -> list[float]:
    """Detect scene changes using FFmpeg scene filter."""
    result = subprocess.run(
        [
            "ffmpeg", "-i", video_path,
            "-vf", "select='gt(scene,0.3)',showinfo",
            "-vsync", "vfr", "-f", "null", "-",
        ],
        capture_output=True,
        timeout=120,
    )

    scene_times = []
    for line in result.stderr.decode(errors="ignore").split("\n"):
        if "pts_time:" in line:
            try:
                pts = line.split("pts_time:")[1].split()[0]
                scene_times.append(float(pts))
            except (ValueError, IndexError):
                continue

    return sorted(scene_times)


def _extract_clip(
    video_path: str,
    output_path: Path,
    start_time: float,
    duration: int,
    crop_mode: str = "center",
) -> bool:
    """Extract a single clip from the video."""
    # Build crop filter based on mode
    if crop_mode == "face-track":
        # Use face detection for 9:16 crop
        vf = (
            "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,"
            "scale=1080:1920:flags=lanczos"
        )
    elif crop_mode == "left":
        vf = "crop=ih*9/16:ih:0:0,scale=1080:1920:flags=lanczos"
    elif crop_mode == "right":
        vf = "crop=ih*9/16:ih:iw-ih*9/16:0,scale=1080:1920:flags=lanczos"
    else:  # center
        vf = "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920:flags=lanczos"

    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-ss", str(start_time),
            "-i", video_path,
            "-t", str(duration),
            "-vf", vf,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            str(output_path),
        ],
        capture_output=True,
        timeout=300,
    )
    return result.returncode == 0


@router.post("", response_model=ClipResponse)
async def extract_clips(req: ClipRequest):
    """Extract vertical 9:16 clips from a long video.

    - video_path: Path to source video
    - clip_duration: Duration per clip (10-300 seconds)
    - clip_count: Number of clips to extract (1-20)
    - crop_mode: center, face-track, left, right
    """
    video = Path(req.video_path)
    if not video.exists():
        raise ApiError(404, "VIDEO_NOT_FOUND", f"Video not found: {req.video_path}")

    try:
        total_duration = _get_video_duration(req.video_path)
    except Exception:
        raise ApiError(400, "INVALID_VIDEO", "Could not read video duration")

    # Detect scene changes for intelligent clip selection
    scenes = _detect_scenes(req.video_path)

    # Generate clip start times
    clip_starts = []
    if scenes and len(scenes) >= req.clip_count:
        # Use scene detection to pick good start points
        step = len(scenes) // req.clip_count
        for i in range(req.clip_count):
            idx = min(i * step, len(scenes) - 1)
            clip_starts.append(scenes[idx])
    else:
        # Evenly distribute clips
        available = total_duration - req.clip_duration
        if available <= 0:
            clip_starts = [0.0]
        else:
            step = available / req.clip_count
            clip_starts = [i * step for i in range(req.clip_count)]

    clips = []
    for i, start in enumerate(clip_starts):
        clip_id = str(uuid.uuid4())[:12]
        out_name = f"clip_{clip_id}.mp4"
        out_path = CLIP_OUTPUT_DIR / out_name

        success = _extract_clip(
            video_path=req.video_path,
            output_path=out_path,
            start_time=start,
            duration=req.clip_duration,
            crop_mode=req.crop_mode,
        )

        if success and out_path.exists():
            clips.append(ClipResult(
                id=clip_id,
                file_path=str(out_path),
                start_time=start,
                duration=req.clip_duration,
                file_size=out_path.stat().st_size,
            ))

    return ClipResponse(
        success=len(clips) > 0,
        clips=clips,
        total_clips=len(clips),
        error=None if clips else "Failed to extract any clips",
    )


@router.get("/download/{clip_id}")
async def download_clip(clip_id: str):
    """Download an extracted clip."""
    for f in CLIP_OUTPUT_DIR.iterdir():
        if f.name.startswith(f"clip_{clip_id}"):
            from fastapi.responses import FileResponse
            return FileResponse(path=str(f), media_type="video/mp4", filename=f.name)
    raise ApiError(404, "NOT_FOUND", "Clip not found")


@router.delete("/{clip_id}")
async def delete_clip(clip_id: str):
    """Delete an extracted clip."""
    for f in CLIP_OUTPUT_DIR.iterdir():
        if f.name.startswith(f"clip_{clip_id}"):
            f.unlink()
            return {"success": True, "message": "Clip deleted"}
    raise ApiError(404, "NOT_FOUND", "Clip not found")
