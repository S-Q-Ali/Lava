"""Proxy generation for preview surfaces (low-res, preview-only).

Proxies are preview-only: the render path never sees them, and the original
source is always preserved. Image proxies are WebP thumbnails (quality 80)
capped to a max width; video proxies are low-res MP4s capped in height, fps
and duration. Everything is deterministic by content hash so re-uploading the
same file reuses the cached proxy.
"""

from __future__ import annotations

import hashlib
import subprocess
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

from .config import Config

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}

DEFAULT_MAX_WIDTH = 480
DEFAULT_MAX_HEIGHT = 960
DEFAULT_MAX_VIDEO_WIDTH = 480
DEFAULT_MAX_DURATION = 120.0
DEFAULT_PROXY_FPS = 15
JPEG_QUALITY = 80
IMAGE_MIME = "image/webp"
VIDEO_MIME = "video/mp4"


class ProxyError(Exception):
    """Raised for proxy-specific failures (missing source, unreadable input)."""


@dataclass(frozen=True)
class ProxyResult:
    kind: str  # "image" | "video"
    path: Path
    width: int
    height: int
    mimeType: str
    sizeBytes: int


def file_hash(data: bytes) -> str:
    """Deterministic stable id for a file's content (16 hex chars)."""
    return hashlib.sha256(data).hexdigest()[:16]


def generate_image_proxy(
    src_path: Path | str,
    dest_dir: Path,
    max_width: int = DEFAULT_MAX_WIDTH,
    max_height: int = DEFAULT_MAX_HEIGHT,
) -> ProxyResult:
    """Create a WebP thumbnail of an image, preserving aspect ratio."""
    src = Path(src_path)
    if not src.exists() or not src.is_file():
        raise ProxyError(f"source image not found: {src}")

    dest_dir.mkdir(parents=True, exist_ok=True)
    out_path = dest_dir / f"{src.stem}.webp"

    try:
        image = Image.open(src)
        image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        image.save(out_path, format="WEBP", quality=JPEG_QUALITY)
        width, height = image.size
    except OSError as exc:
        raise ProxyError(f"could not create image proxy for {src}: {exc}") from exc

    return ProxyResult(
        kind="image",
        path=out_path,
        width=width,
        height=height,
        mimeType=IMAGE_MIME,
        sizeBytes=out_path.stat().st_size,
    )


def generate_video_proxy(
    src_path: Path | str,
    dest_dir: Path,
    config: Config | None = None,
    max_height: int = DEFAULT_MAX_VIDEO_WIDTH,
    max_duration: float = DEFAULT_MAX_DURATION,
    fps: int = DEFAULT_PROXY_FPS,
) -> ProxyResult:
    """Create a low-res MP4 proxy of a video (height cap + fps cap + duration cap)."""
    src = Path(src_path)
    if not src.exists() or not src.is_file():
        raise ProxyError(f"source video not found: {src}")

    cfg = config or Config.load()
    dest_dir.mkdir(parents=True, exist_ok=True)
    out_path = dest_dir / f"{src.stem}_proxy.mp4"

    ffmpeg = cfg.ffmpeg_bin
    if not ffmpeg.exists() or not ffmpeg.is_file():
        raise ProxyError(f"ffmpeg not found at {ffmpeg}")

    # Scale only down (never upscale), keep aspect, then read actual dims
    # with ffprobe after the fact.
    cmd = [
        str(ffmpeg),
        "-y",
        "-hide_banner",
        "-loglevel", "error",
        "-i", str(src),
        "-vf", f"scale=-2:min(ih\\,{max_height}):flags=fast_bilinear",
        "-r", str(fps),
        "-t", f"{max_duration:g}",
        "-an",
        "-pix_fmt", "yuv420p",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "28",
        "-movflags", "+faststart",
        str(out_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise ProxyError(f"could not create video proxy for {src}: {proc.stderr}")

    width, height = _probe_dims(cfg, out_path)

    return ProxyResult(
        kind="video",
        path=out_path,
        width=width,
        height=height,
        mimeType=VIDEO_MIME,
        sizeBytes=out_path.stat().st_size,
    )


def _probe_dims(config: Config, path: Path) -> tuple[int, int]:
    """Return (width, height) of a video via ffprobe, defaulting to (0, 0)."""
    ffprobe = config.ffprobe_bin
    try:
        proc = subprocess.run(
            [
                str(ffprobe),
                "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height",
                "-of", "csv=s=x:p=0",
                str(path),
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if proc.returncode != 0 or not proc.stdout.strip():
            return 0, 0
        w, h = proc.stdout.strip().split("x", 1)
        return int(w), int(h)
    except Exception:
        return 0, 0