"""Stage 1: Ingest — extract video metadata via ffprobe."""
from __future__ import annotations
import json
import subprocess
from pathlib import Path
from typing import Any


class VideoInfo:
    def __init__(self, data: dict[str, Any]):
        self.path = data.get("path", "")
        self.width = int(data.get("width", 0))
        self.height = int(data.get("height", 0))
        self.duration = float(data.get("duration", 0.0))
        self.fps = self._parse_fps(data.get("fps", "30/1"))
        self.codec = data.get("codec", "unknown")
        self.audio_codec = data.get("audio_codec", "none")
        self.audio_sample_rate = int(data.get("audio_sample_rate", 0))
        self.file_size = int(data.get("file_size", 0))
        self.bitrate = int(data.get("bitrate", 0))
        self.pix_fmt = data.get("pix_fmt", "yuv420p")
        self.has_audio = data.get("has_audio", False)

    @staticmethod
    def _parse_fps(fps_str: str) -> float:
        try:
            if "/" in fps_str:
                num, den = fps_str.split("/")
                return float(num) / float(den) if float(den) > 0 else 30.0
            return float(fps_str)
        except (ValueError, ZeroDivisionError):
            return 30.0

    @property
    def aspect_ratio(self) -> float:
        return self.width / self.height if self.height > 0 else 0.0

    @property
    def is_vertical(self) -> bool:
        return self.height > self.width

    def to_dict(self) -> dict[str, Any]:
        return {
            "path": self.path, "width": self.width, "height": self.height,
            "duration": self.duration, "fps": self.fps, "codec": self.codec,
            "audio_codec": self.audio_codec, "audio_sample_rate": self.audio_sample_rate,
            "file_size": self.file_size, "bitrate": self.bitrate,
            "pix_fmt": self.pix_fmt, "has_audio": self.has_audio,
        }


def ingest(video_path: str) -> VideoInfo:
    path = Path(video_path)
    if not path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")
    cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(path)]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr}")
    data = json.loads(result.stdout)
    video_stream = audio_stream = None
    for stream in data.get("streams", []):
        if stream.get("codec_type") == "video" and video_stream is None:
            video_stream = stream
        elif stream.get("codec_type") == "audio" and audio_stream is None:
            audio_stream = stream
    if video_stream is None:
        raise ValueError(f"No video stream found in: {video_path}")
    fmt = data.get("format", {})
    return VideoInfo({
        "path": str(path.resolve()),
        "width": int(video_stream.get("width", 0)),
        "height": int(video_stream.get("height", 0)),
        "duration": float(fmt.get("duration", 0.0)),
        "fps": video_stream.get("r_frame_rate", "30/1"),
        "codec": video_stream.get("codec_name", "unknown"),
        "audio_codec": audio_stream.get("codec_name", "none") if audio_stream else "none",
        "audio_sample_rate": int(audio_stream.get("sample_rate", 0)) if audio_stream else 0,
        "file_size": int(fmt.get("size", 0)),
        "bitrate": int(fmt.get("bit_rate", 0)),
        "pix_fmt": video_stream.get("pix_fmt", "yuv420p"),
        "has_audio": audio_stream is not None,
    })
