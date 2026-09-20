"""SFX mixer — layer sound effects via FFmpeg."""
from __future__ import annotations
import subprocess
from pathlib import Path
from typing import Any

SFX_DIR = Path(__file__).parent.parent.parent.parent / "sfx"


def mix_sfx(audio_path: str, clip_start: float, clip_end: float, events: list[dict[str, Any]], sfx_dir: str | None = None, output_path: str | None = None) -> str:
    sfx_path = Path(sfx_dir) if sfx_dir else SFX_DIR
    if not output_path:
        output_path = str(Path(audio_path).with_suffix(".sfx.wav"))
    inputs = ["-i", audio_path]
    filters = []
    for i, event in enumerate(events):
        sfx_file = _find_sfx(sfx_path, event.get("type", "whoosh"))
        if not sfx_file:
            continue
        t = event.get("time", 0) - clip_start
        vol = event.get("volume_db", -12)
        if t < 0:
            continue
        inputs.extend(["-i", str(sfx_file)])
        filters.append(f"[{i+1}:a]adelay={int(t*1000)}|{int(t*1000)},volume={vol}dB[sfx{i}]")
    if not filters:
        return audio_path
    mix = "[0:a]" + "".join(f"[sfx{i}]" for i in range(len(filters)))
    filters.append(f"{mix}amix=inputs={len(filters)+1}:duration=first:dropout_transition=2")
    cmd = ["ffmpeg", "-y"] + inputs + ["-filter_complex", ";".join(filters), "-c:a", "pcm_s16le", output_path]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"SFX mix failed: {result.stderr[-300:]}")
    return output_path


def _find_sfx(sfx_dir: Path, sfx_type: str) -> Path | None:
    type_map = {"whoosh": "whooshes/*.wav", "transition": "whooshes/*.wav", "impact": "impacts/*.wav", "hit": "impacts/*.wav", "ding": "dings/*.wav", "punchline": "dings/*.wav", "riser": "risers/*.wav", "buildup": "risers/*.wav"}
    pattern = type_map.get(sfx_type, f"**/{sfx_type}*.wav")
    matches = list(sfx_dir.glob(pattern))
    return matches[0] if matches else None
