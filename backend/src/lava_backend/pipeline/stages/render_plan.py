"""Stage 8: Render plan — assemble FFmpeg filter chains."""
from __future__ import annotations
from typing import Any
from ..models.clip_plan import ClipPlan
from ..models.crop_path import CropPath
from ..models.config import PipelineConfig


def build_render_plan(clip: ClipPlan, crop_path: CropPath | None, config: PipelineConfig) -> dict[str, Any]:
    input_args = ["-ss", f"{clip.start:.3f}", "-t", f"{clip.duration:.3f}"]
    filters = []
    filters.append(f"crop=min(iw\\,ih*{config.output_width}/{config.output_height}):min(ih\\,iw*{config.output_height}/{config.output_width})")
    filters.append(f"scale={config.output_width}:{config.output_height}:flags=lanczos")
    filters.append(f"fps={config.target_fps}")
    for z in clip.zoom_events:
        zoom_frames = int(z.ramp_sec * config.target_fps)
        filters.append(f"zoompan=z='min({z.zoom},1+on/{zoom_frames}*({z.zoom}-1))':d=1:s={config.output_width}x{config.output_height}:fps={config.target_fps}")
    filters.append("format=yuv420p")
    filter_complex = ",".join(f for f in filters if f)
    output_args = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-b:v", config.target_bitrate, "-movflags", "+faststart"]
    return {"input_args": input_args, "filter_complex": filter_complex, "output_args": output_args}
