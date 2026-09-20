"""Stage 10: QC — validate rendered clips."""
from __future__ import annotations
import json
import subprocess
from pathlib import Path
from ..models.report import QCReport, ClipResult
from ..models.config import PipelineConfig


def run_qc(clips: list[dict], video_path: str, config: PipelineConfig) -> QCReport:
    results = []
    source_duration = 0.0
    try:
        cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", video_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        data = json.loads(result.stdout)
        source_duration = float(data.get("format", {}).get("duration", 0.0))
    except Exception:
        pass
    for clip_data in clips:
        results.append(_check_clip(clip_data.get("id", "unknown"), clip_data.get("path", ""), clip_data.get("score", 0.0), config))
    passed = sum(1 for r in results if r.passed_qc)
    report = QCReport(source_path=video_path, total_duration=source_duration, clips_attempted=len(results), clips_passed=passed, clips_failed=len(results) - passed, results=results)
    print(f"\n{report.summary()}")
    return report


def _check_clip(clip_id: str, clip_path: str, score: float, config: PipelineConfig) -> ClipResult:
    errors = []
    path = Path(clip_path)
    if not path.exists():
        return ClipResult(clip_id=clip_id, path=clip_path, duration=0, file_size_bytes=0, width=0, height=0, fps=0, has_audio=False, score=score, passed_qc=False, qc_errors=["File not found"])
    info = _probe_clip(clip_path)
    if info["duration"] < 5.0:
        errors.append(f"Too short: {info['duration']:.1f}s")
    if info["width"] < config.output_width * 0.9:
        errors.append(f"Width too low: {info['width']}")
    file_size = path.stat().st_size
    if file_size < 100_000:
        errors.append(f"File too small: {file_size / 1024:.0f} KB")
    if not info["has_audio"]:
        errors.append("No audio track")
    return ClipResult(clip_id=clip_id, path=clip_path, duration=info["duration"], file_size_bytes=file_size, width=info["width"], height=info["height"], fps=info["fps"], has_audio=info["has_audio"], score=score, passed_qc=len(errors) == 0, qc_errors=errors)


def _probe_clip(path: str) -> dict:
    try:
        cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        data = json.loads(result.stdout)
        video = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
        audio = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
        fps_str = video.get("r_frame_rate", "30/1")
        fps = 30.0
        try:
            if "/" in fps_str:
                n, d = fps_str.split("/")
                fps = float(n) / float(d)
            else:
                fps = float(fps_str)
        except (ValueError, ZeroDivisionError):
            pass
        return {"duration": float(data.get("format", {}).get("duration", 0.0)), "width": int(video.get("width", 0)), "height": int(video.get("height", 0)), "fps": fps, "has_audio": audio is not None}
    except Exception:
        return {"duration": 0.0, "width": 0, "height": 0, "fps": 0.0, "has_audio": False}
