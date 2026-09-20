"""Stage 4: Audio analysis — RMS, peaks, silence detection via FFmpeg."""
from __future__ import annotations
import json
import subprocess
from typing import Any


def analyze_audio(video_path: str) -> dict[str, Any]:
    info = {"loudness": _get_loudness(video_path), "segments": [], "silences": _get_silences(video_path)}
    if info["segments"]:
        active = sum(s.get("duration", 0) for s in info["segments"] if s.get("rms_db", -100) > -30)
        total = info["segments"][-1].get("end", 1) if info["segments"] else 1
        info["speech_ratio"] = active / total if total > 0 else 0.0
    else:
        info["speech_ratio"] = 0.0
    return info


def _get_loudness(video_path: str) -> dict[str, float]:
    cmd = ["ffmpeg", "-i", video_path, "-af", "loudnorm=print_format=json", "-f", "null", "-"]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    try:
        start = result.stderr.rfind("{")
        end = result.stderr.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(result.stderr[start:end])
            return {"integrated": float(data.get("input_i", -14.0)), "peak": float(data.get("input_tp", -1.0)), "lra": float(data.get("input_lra", 7.0))}
    except (json.JSONDecodeError, ValueError):
        pass
    return {"integrated": -14.0, "peak": -1.0, "lra": 7.0}


def _get_silences(video_path: str, silence_thresh: float = -35.0, min_silence: float = 0.3) -> list[dict[str, Any]]:
    cmd = ["ffmpeg", "-i", video_path, "-af", f"silencedetect=noise={silence_thresh}dB:d={min_silence}", "-f", "null", "-"]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    silences = []
    lines = result.stderr.split("\n")
    for i, line in enumerate(lines):
        if "silence_start" in line:
            try:
                start = float(line.split("silence_start:")[1].split()[0])
                for j in range(i + 1, min(i + 5, len(lines))):
                    if "silence_end" in lines[j]:
                        end = float(lines[j].split("silence_end:")[1].split()[0])
                        silences.append({"start": start, "end": end, "duration": end - start})
                        break
            except (ValueError, IndexError):
                pass
    return silences
