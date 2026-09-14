"""M9 baseline macro-benchmark.

Runs the M9-MEASUREMENT.md checklist items on THIS machine via the real
backend modules (Pillow proxies + ffmpeg renders). Designed to be run
identically on any machine (D-037) — dev Mac, baseline HP Pavilion 15, or
anything else in between:

    ./.venv/bin/python tools/m9-macro-bench.py

Output is a compact Markdown block meant to be pasted into
docs/M9-MEASUREMENT.md under the machine's row. Rendering is kept light
(fps=10, short clips) so a single pass stays well under two minutes even
on the weak baseline; except startup, phases run in subprocesses so the
driver process memory stays flat.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BACKEND = REPO / "backend"
if str(BACKEND / "src") not in sys.path:
    sys.path.insert(0, str(BACKEND / "src"))


def _seconds(fn):
    start = time.perf_counter()
    result = fn()
    return result, time.perf_counter() - start


def _fmt(sec: float) -> str:
    return f"{sec:.2f}s" if sec < 60 else f"{sec / 60:.1f}m"


def startup() -> float:
    """Cold import of the sidecar app (no model construction post-D-034)."""
    code = (
        "import time; t=time.perf_counter(); "
        "from lava_backend.main import app; "
        "print(f'{time.perf_counter()-t:.3f}')"
    )
    out = subprocess.run(
        [sys.executable, "-c", code],
        capture_output=True, text=True, check=True, env={k: v for k, v in os.environ.items()},
    ).stdout.strip()
    return float(out)


def image_proxy(tmp: Path) -> tuple[float, int, int]:
    from PIL import Image
    from lava_backend.proxy import generate_image_proxy

    src = tmp / "manhwa-4000x6000.jpg"
    img = Image.new("RGB", (4000, 6000), (200, 210, 220))
    img.save(src, format="JPEG", quality=85)
    _, sec = _seconds(lambda: generate_image_proxy(src, tmp / "proxy"))
    out = tmp / "proxy" / "manhwa-4000x6000.webp"
    with Image.open(out) as thumb:
        w, h = thumb.size
    return sec, w, h


def video_proxy(tmp: Path) -> tuple[float, str]:
    from lava_backend.proxy import generate_video_proxy

    cfg = json.loads((REPO / "studio.config.json").read_text())
    ffmpeg = REPO / cfg["ffmpeg"]["bin"] / "ffmpeg"
    src = tmp / "source-1080p.mp4"
    subprocess.run(
        [str(ffmpeg), "-y", "-hide_banner", "-loglevel", "error",
         "-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=25", "-t", "12",
         "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", str(src)],
        check=True,
    )
    from lava_backend.config import Config
    cfg_obj = Config.load()
    _, sec = _seconds(lambda: generate_video_proxy(src, tmp / "proxy-v", cfg_obj))
    return sec, (tmp / "proxy-v" / "source-1080p_proxy.mp4").stat().st_size


def render_pass(tmp: Path, *, clips: int, duration: float, full: bool) -> tuple[float, int]:
    from PIL import Image
    from lava_backend.media import (
        BetweenSpec, MotionSpec, RenderClip, RenderSettings, render,
    )
    from lava_backend.config import Config

    cfg_obj = Config.load()
    files = []
    for i in range(clips):
        path = tmp / f"clip-{i}.png"
        Image.new("RGB", (1920, 1080), (40 + i * 22, 30, 30)).save(path, format="PNG")
        files.append(path)

    clip_specs = []
    for i in range(clips):
        motion = None
        if full and i == 0:
            motion = MotionSpec(type="zoom-in", strength=0.8)
        clip_specs.append(
            RenderClip(file_index=i, start=i * duration, duration=duration, motion=motion)
        )

    transitions = None
    captions = None
    if full:
        transitions = [
            BetweenSpec(first=i, second=i + 1, type="dissolve", duration=0.4)
            for i in range(clips - 1)
        ]
        from lava_backend.captions import CaptionItemSpec, CaptionStyleSpec
        captions = [
            CaptionItemSpec(
                text="Lava Studio macro benchmark",
                start=0.0, duration=clips * duration,
                style=CaptionStyleSpec(font_size=48, primary_color="#ffffff"),
            )
        ]

    start = time.perf_counter()
    result = render(
        cfg_obj, files, clip_specs,
        RenderSettings(width=1280, height=720, fps=10, upscale_factor=3),
        transitions=transitions, captions=captions,
    )
    elapsed = time.perf_counter() - start
    return elapsed, result.jobId


def main() -> None:
    tmp = Path(tempfile.mkdtemp(prefix="m9-bench-"))
    try:
        rows: list[tuple[str, str]] = []
        boot_sec = startup()
        rows.append(("Sidecar cold import (no models post-D-034)", _fmt(boot_sec)))
        im_sec, w, h = image_proxy(tmp)
        rows.append(("Image proxy 4000x6000 (-> %dx%d WebP)" % (w, h), _fmt(im_sec)))
        vp_sec, vp_bytes = video_proxy(tmp)
        rows.append(("Video proxy 1080p source -> %d bytes" % vp_bytes, _fmt(vp_sec)))
        render_sec, _ = render_pass(tmp, clips=5, duration=3.0, full=False)
        rows.append(("Preview render 5x3s frames 1280x720@10fps", _fmt(render_sec)))
        full_sec, _ = render_pass(tmp, clips=10, duration=2.0, full=True)
        rows.append(("Full render 10 clips + dissolve + captions + motion", _fmt(full_sec)))
        import platform
        print(f"machine: {sys.platform} / {os.cpu_count()} cpus / {platform.platform()}")
        print("| item | time |")
        print("|------|------|")
        for name, value in rows:
            print(f"| {name} | {value} |")
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()