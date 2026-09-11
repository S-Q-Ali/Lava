"""FFmpeg/FFprobe subprocess helpers for the sidecar."""

from __future__ import annotations

import json
import subprocess
import uuid
from dataclasses import dataclass
from pathlib import Path

from .config import Config
from .errors import ApiError


@dataclass(frozen=True)
class RenderClip:
    file_index: int
    start: float
    duration: float


@dataclass
class RenderSettings:
    width: int = 1280
    height: int = 720
    fps: int = 30


@dataclass
class RenderResult:
    jobId: str
    outputPath: str
    duration: float
    width: int
    height: int
    fps: int
    sizeBytes: int | None = None


IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}


@dataclass
class ProbeStream:
    codecType: str
    codecName: str | None
    width: int | None
    height: int | None


@dataclass
class ProbeResult:
    path: str
    duration: float | None
    sizeBytes: int | None
    formatName: str | None
    streams: list[ProbeStream]


def _run(command: list[str], timeout: int = 120) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise ApiError(500, "TOOL_TIMEOUT", "FFmpeg process timed out") from exc
    except OSError as exc:
        raise ApiError(500, "TOOL_ERROR", f"Failed to run FFmpeg tool: {exc}") from exc
    return proc.returncode, proc.stdout, proc.stderr


def check_binary(config: Config, tool: str) -> Path:
    binary = getattr(config, f"{tool}_bin")
    if not binary.exists() or not binary.is_file():
        raise ApiError(503, "FFMPEG_UNAVAILABLE", f"{binary} not found")
    return binary


# --- Probe ---


def probe(config: Config, path: str) -> ProbeResult:
    media_path = Path(path).expanduser()
    if not media_path.exists() or not media_path.is_file():
        raise ApiError(400, "PATH_MISSING", f"No such media file: {path}")

    ffprobe = check_binary(config, "ffprobe")
    command = [
        str(ffprobe),
        "-v", "error",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(media_path),
    ]
    returncode, stdout, _ = _run(command)
    if returncode != 0:
        raise ApiError(422, "PROBE_FAILED", f"ffprobe could not read {path}")

    try:
        raw = json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise ApiError(500, "PROBE_PARSE", "ffprobe returned malformed output") from exc

    fmt = raw.get("format", {})
    streams = []
    for stream in raw.get("streams", []):
        streams.append(
            ProbeStream(
                codecType=stream.get("codec_type", "unknown"),
                codecName=stream.get("codec_name"),
                width=stream.get("width"),
                height=stream.get("height"),
            )
        )
    return ProbeResult(
        path=str(media_path),
        duration=_float(fmt.get("duration")),
        sizeBytes=_int(fmt.get("size")),
        formatName=fmt.get("format_name"),
        streams=streams,
    )


# --- Render ---


def _filter_complex(clips: list[RenderClip], settings: RenderSettings) -> str:
    parts: list[str] = []
    for i, clip in enumerate(clips):
        # fps+scale+pad+trim+setpts for both image and video inputs
        # For video inputs the -ss/-t before -i already trims; setpts normalises pts.
        parts.append(
            f"[{i}:v]fps={settings.fps},"
            f"scale={settings.width}:{settings.height}:"
            f"force_original_aspect_ratio=decrease,"
            f"pad={settings.width}:{settings.height}:(ow-iw)/2:(oh-ih)/2,"
            f"setsar=1,"
            f"trim=duration={clip.duration},"
            f"setpts=PTS-STARTPTS[v{i}]"
        )
    concat = "".join(f"[v{i}]" for i in range(len(clips)))
    concat += f"concat=n={len(clips)}:v=1:a=0[vout]"
    parts.append(concat)
    return ";".join(parts)


def render(
    config: Config,
    files: list[Path],
    clips: list[RenderClip],
    settings: RenderSettings,
) -> RenderResult:
    if not clips:
        raise ApiError(422, "NO_CLIPS", "Render requires at least one clip")

    ffmpeg = check_binary(config, "ffmpeg")
    job_id = uuid.uuid4().hex
    config.renders_dir.mkdir(parents=True, exist_ok=True)
    config.uploads_dir.mkdir(parents=True, exist_ok=True)
    out_path = config.renders_dir / f"{job_id}.mp4"

    cmd = [str(ffmpeg), "-y", "-hide_banner", "-loglevel", "error"]
    for i, (clip, inp) in enumerate(zip(clips, files)):
        suffix = inp.suffix.lower()
        is_image = suffix in IMAGE_SUFFIXES
        if is_image:
            cmd += ["-loop", "1", "-framerate", str(settings.fps), "-t", str(clip.duration), "-i", str(inp)]
        else:
            cmd += ["-ss", str(clip.start), "-i", str(inp), "-t", str(clip.duration)]

    filter_complex = _filter_complex(clips, settings)
    cmd += [
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-r", str(settings.fps),
        "-pix_fmt", "yuv420p",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-movflags", "+faststart",
        str(out_path),
    ]

    returncode, _, stderr = _run(cmd)
    if returncode != 0:
        raise ApiError(500, "RENDER_FAILED", f"ffmpeg failed: {stderr}")

    probe_result = probe(config, str(out_path))
    size = out_path.stat().st_size if out_path.exists() else None
    return RenderResult(
        jobId=job_id,
        outputPath=str(out_path),
        duration=probe_result.duration or settings.fps * sum(c.duration for c in clips) / settings.fps,
        width=settings.width,
        height=settings.height,
        fps=settings.fps,
        sizeBytes=size,
    )


# --- Helpers ---


def _float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _int(value) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None