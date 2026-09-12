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


@dataclass(frozen=True)
class BetweenSpec:
    first: int
    second: int
    type: str
    duration: float


@dataclass(frozen=True)
class EdgeSpec:
    at: str
    index: int
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

MIN_TRANSITION_DURATION = 0.1
MAX_TRANSITION_DURATION = 2.0

_XFADE_BY_TYPE = {
    "dissolve": "fade",
    "fade": "fadeblack",
    "match": None,
}

_UNSUPPORTED_TYPES = {"wipe", "zoom"}


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


def xfade_name(transition_type: str) -> str | None:
    return _XFADE_BY_TYPE.get(transition_type)


def build_transition_graph(
    clips: list[RenderClip],
    transitions: list[BetweenSpec] | list[EdgeSpec],
    settings: RenderSettings = RenderSettings(),
) -> tuple[str, float]:
    """Return (filter_complex, total_duration) for a clip fold with transitions.

    Pure — no ffmpeg. Between transitions overlap adjacent clips via xfade;
    edge transitions wrap the first/last streams with a fade filter; 'match'
    and absent transitions are plain cuts (no duration cost). Wipe/zoom are
    template-only and rejected here by design.
    """
    between = [t for t in transitions if isinstance(t, BetweenSpec)]
    edges = [t for t in transitions if isinstance(t, EdgeSpec)]
    count = len(clips)

    def _invalid(message: str) -> ApiError:
        return ApiError(422, "TRANSITION_INVALID", message)

    for t in between:
        if not (0 <= t.first < count and 0 <= t.second < count):
            raise _invalid(
                f"between transition references clip index ({t.first}, {t.second}) out of range"
            )
        if t.second != t.first + 1:
            raise _invalid("between transition must reference consecutive clips")
        if not (MIN_TRANSITION_DURATION <= t.duration <= MAX_TRANSITION_DURATION):
            raise _invalid("transition duration must be between 0.1s and 2s")
        if t.duration > min(clips[t.first].duration, clips[t.second].duration):
            raise _invalid("transition duration exceeds the shorter clip")
        if t.type in _UNSUPPORTED_TYPES:
            raise ApiError(
                422,
                "TRANSITION_UNSUPPORTED",
                f"{t.type} transitions are template-only and not supported by the renderer yet.",
            )
        if t.type not in _XFADE_BY_TYPE:
            raise _invalid(f"unknown transition type: {t.type}")

    for e in edges:
        if not (0 <= e.index < count and ((e.at == "start" and e.index == 0) or (e.at == "end" and e.index == count - 1))):
            raise _invalid(f"edge transition must anchor to the first/last clip (index 0 or {count - 1})")
        if not (MIN_TRANSITION_DURATION <= e.duration <= MAX_TRANSITION_DURATION):
            raise _invalid("transition duration must be between 0.1s and 2s")
        if e.duration > clips[e.index].duration:
            raise _invalid("edge transition duration exceeds its clip")

    if not edges and not any(xfade_name(t.type) for t in between):
        return (
            _filter_complex(clips, settings),
            sum(clip.duration for clip in clips),
        )

    parts = []
    for i, clip in enumerate(clips):
        parts.append(
            f"[{i}:v]fps={settings.fps},"
            f"scale={settings.width}:{settings.height}:"
            f"force_original_aspect_ratio=decrease,"
            f"pad={settings.width}:{settings.height}:(ow-iw)/2:(oh-ih)/2,"
            f"setsar=1,"
            f"trim=duration={clip.duration},"
            f"setpts=PTS-STARTPTS[v{i}]"
        )

    edge_at = {e.index: e for e in edges}
    for e in edges:
        if e.at == "start":
            wrap = f"[v{e.index}]fade=t=in:st=0:d={e.duration}"
        else:
            st = clips[e.index].duration - e.duration
            wrap = f"[v{e.index}]fade=t=out:st={st:.6g}:d={e.duration}"
        parts.append(f"{wrap}[v{e.index}e]")

    pair_map: dict[tuple[int, int], BetweenSpec] = {
        (t.first, t.second): t for t in between
    }

    def stream_label(index: int) -> str:
        return f"[v{index}e]" if index in edge_at else f"[v{index}]"

    prev_label = stream_label(0)
    total = clips[0].duration
    for k in range(1, count):
        t = pair_map.get((k - 1, k))
        xfade = xfade_name(t.type) if t else None
        next_in = stream_label(k)
        if xfade:
            offset = total - t.duration
            parts.append(
                f"{prev_label}{next_in}xfade=transition={xfade}:duration={t.duration}:offset={offset:.6g}[x{k}]"
            )
            prev_label = f"[x{k}]"
            total += clips[k].duration - t.duration
        else:
            parts.append(f"{prev_label}{next_in}concat=n=2:v=1:a=0[tmp{k}]")
            prev_label = f"[tmp{k}]"
            total += clips[k].duration

    parts.append(f"{prev_label}null[vout]")
    return ";".join(parts), total


def render(
    config: Config,
    files: list[Path],
    clips: list[RenderClip],
    settings: RenderSettings,
    transitions: list = (),
) -> RenderResult:
    if not clips:
        raise ApiError(422, "NO_CLIPS", "Render requires at least one clip")

    filter_complex, expected_duration = build_transition_graph(clips, list(transitions), settings)
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
        duration=probe_result.duration or expected_duration,
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