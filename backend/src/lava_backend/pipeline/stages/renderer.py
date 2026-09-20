"""Stage 9: Renderer — FFmpeg encode with captions and effects."""
from __future__ import annotations
import subprocess
from pathlib import Path
from ..models.clip_plan import ClipPlan
from ..models.config import PipelineConfig
from .render_plan import build_render_plan


def render_clip(clip: ClipPlan, video_path: str, config: PipelineConfig, crop_path: Any | None = None, ass_path: str | None = None) -> str:
    output_path = config.output_path_for_clip(clip.id)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plan = build_render_plan(clip, crop_path, config)
    cmd = ["ffmpeg", "-y"] + plan["input_args"] + ["-i", video_path]
    if plan["filter_complex"]:
        cmd.extend(["-vf", plan["filter_complex"]])
    cmd.extend(plan["output_args"] + [output_path])
    print(f"  Rendering {clip.id} ({clip.duration:.1f}s, score={clip.score:.2f})...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed for {clip.id}: {result.stderr[-500:]}")
    out = Path(output_path)
    if out.exists():
        size_mb = out.stat().st_size / (1024 * 1024)
        print(f"  OK {clip.id}: {size_mb:.1f} MB")
    else:
        raise RuntimeError(f"Output file not created: {output_path}")
    return output_path
