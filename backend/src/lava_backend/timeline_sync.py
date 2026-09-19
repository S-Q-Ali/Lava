"""Timeline Auto-Sync — sync timecoded images to voiceover audio.

Detects timecodes from filenames or prompt timing, generates timeline plan.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel, Field

from .errors import ApiError

router = APIRouter(prefix="/api/timeline-sync", tags=["timeline-sync"])


class TimelineClip(BaseModel):
    index: int
    start_ms: int
    end_ms: int
    duration_ms: int
    image_path: str = ""
    prompt: str = ""


class TimelinePlan(BaseModel):
    success: bool
    clips: list[TimelineClip] = []
    total_duration_ms: int = 0
    clip_count: int = 0
    error: Optional[str] = None


def _parse_timecode_from_filename(filename: str) -> int | None:
    """Extract timecode from filename like '0-00.png', '0-03.png', 'scene_1_45s.png'."""
    # Pattern: MM-SS or M-SS (e.g., "0-00", "1-30", "0-03")
    m = re.search(r'(\d+)-(\d{2})', filename)
    if m:
        minutes = int(m.group(1))
        seconds = int(m.group(2))
        return (minutes * 60 + seconds) * 1000

    # Pattern: Xs (e.g., "scene_45s.png")
    m = re.search(r'(\d+)s', filename)
    if m:
        return int(m.group(1)) * 1000

    # Pattern: Xms (e.g., "scene_5000ms.png")
    m = re.search(r'(\d+)ms', filename)
    if m:
        return int(m.group(1))

    return None


async def _get_audio_duration(audio_path: str) -> int:
    """Get audio duration in ms using ffprobe."""
    import subprocess

    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "json", audio_path],
            capture_output=True,
            timeout=30,
        )
        data = json.loads(result.stdout)
        return int(float(data["format"]["duration"]) * 1000)
    except Exception:
        return 60000  # Default 60s


@router.post("", response_model=TimelinePlan)
async def sync_timeline(
    audio_file: str = Form(...),
    image_files: str = Form(...),
):
    """Sync images to voiceover audio timeline.

    - audio_file: Path to voiceover audio file
    - image_files: JSON array of image file paths
    """
    try:
        images = json.loads(image_files)
    except json.JSONDecodeError:
        raise ApiError(422, "INVALID_IMAGES", "image_files must be a JSON array")

    if not images:
        raise ApiError(422, "NO_IMAGES", "At least one image is required")

    # Get audio duration
    total_duration = await _get_audio_duration(audio_file)

    # Parse timecodes from filenames
    timecoded_images: list[tuple[int | None, str]] = []
    for img_path in images:
        filename = Path(img_path).name
        tc = _parse_timecode_from_filename(filename)
        timecoded_images.append((tc, img_path))

    # Sort: timecoded first (by time), then untimed
    timed = sorted([(tc, img) for tc, img in timecoded_images if tc is not None], key=lambda x: x[0])
    untimed = [img for tc, img in timecoded_images if tc is None]

    # Build clips
    clips = []
    clip_index = 0

    if timed:
        for i, (tc, img) in enumerate(timed):
            # End time is next timecode or total duration
            if i + 1 < len(timed):
                end_ms = timed[i + 1][0]
            elif untimed:
                end_ms = total_duration
            else:
                end_ms = total_duration

            clips.append(TimelineClip(
                index=clip_index,
                start_ms=tc,
                end_ms=end_ms,
                duration_ms=end_ms - tc,
                image_path=img,
            ))
            clip_index += 1

    # Untimed images: distribute evenly across remaining time
    if untimed:
        if timed:
            start_offset = timed[-1][0] if timed else 0
        else:
            start_offset = 0
        remaining = total_duration - start_offset
        per_clip = remaining // len(untimed) if untimed else remaining

        for i, img in enumerate(untimed):
            clip_start = start_offset + i * per_clip
            clip_end = start_offset + (i + 1) * per_clip if i < len(untimed) - 1 else total_duration
            clips.append(TimelineClip(
                index=clip_index,
                start_ms=clip_start,
                end_ms=clip_end,
                duration_ms=clip_end - clip_start,
                image_path=img,
            ))
            clip_index += 1

    return TimelinePlan(
        success=True,
        clips=clips,
        total_duration_ms=total_duration,
        clip_count=len(clips),
    )
