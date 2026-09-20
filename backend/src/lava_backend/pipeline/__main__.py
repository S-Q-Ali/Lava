"""Lava Auto-Clipping Pipeline CLI.

Usage:
    python -m lava_backend.pipeline run <video_path> --output-dir ./clips --preset ishowspeed
    python -m lava_backend.pipeline analyze <video_path> --output-dir ./analysis
"""
from __future__ import annotations
import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any
from .models.config import PipelineConfig
from .stages.ingest import ingest
from .stages.transcribe import transcribe
from .stages.scene_detect import detect_scenes
from .stages.audio_analysis import analyze_audio
from .analysis.moment_scorer import score_moments
from .stages.renderer import render_clip
from .stages.qc import run_qc
from .providers.factory import create_provider


def main(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(prog="lava-pipeline", description="Lava Auto-Clipping AI Pipeline")
    sub = parser.add_subparsers(dest="command", required=True)
    run_p = sub.add_parser("run", help="Run full pipeline on a video")
    run_p.add_argument("video", help="Path to source video file")
    run_p.add_argument("-o", "--output-dir", default="./clips")
    run_p.add_argument("-p", "--preset", default="default")
    run_p.add_argument("--provider", default="auto")
    run_p.add_argument("--api-key", default="")
    run_p.add_argument("--max-clips", type=int, default=10)
    run_p.add_argument("--min-score", type=float, default=0.6)
    run_p.add_argument("--width", type=int, default=1080)
    run_p.add_argument("--height", type=int, default=1920)
    run_p.add_argument("--no-captions", action="store_true")
    run_p.add_argument("--no-zoom", action="store_true")
    run_p.add_argument("--resume", default=None)
    analyze_p = sub.add_parser("analyze", help="Analyze video without rendering")
    analyze_p.add_argument("video")
    analyze_p.add_argument("-o", "--output-dir", default="./analysis")
    analyze_p.add_argument("--provider", default="auto")
    analyze_p.add_argument("--api-key", default="")
    analyze_p.add_argument("--max-clips", type=int, default=10)
    sub.add_parser("version", help="Show version")
    args = parser.parse_args(argv)
    if args.command == "version":
        from . import __version__
        print(f"lava-pipeline v{__version__}")
        return
    if args.command == "run":
        _run_pipeline(args)
    elif args.command == "analyze":
        _run_analyze(args)


def _run_pipeline(args):
    start_time = time.time()
    video_path = Path(args.video).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"{'='*50}\nLava Auto-Clipping Pipeline\n{'='*50}")
    print(f"Source: {video_path}\nOutput: {output_dir}\n")
    config = PipelineConfig(input_path=str(video_path), output_dir=str(output_dir), preset=args.preset, provider=args.provider, api_key=args.api_key, max_clips=args.max_clips, min_score=args.min_score, output_width=args.width, output_height=args.height, captions_enabled=not args.no_captions, zoom_enabled=not args.no_zoom)
    resume = args.resume
    if not resume or resume == "ingest":
        print("[1/7] Ingesting...")
        info = ingest(str(video_path))
        print(f"  {info.width}x{info.height}, {info.duration:.1f}s, {info.fps:.1f} fps")
        _save_json(output_dir / "video_info.json", info.to_dict())
    if not resume or resume == "transcribe":
        print("[2/7] Transcribing...")
        segments = transcribe(str(video_path))
        _save_json(output_dir / "transcript.json", segments)
    if not resume or resume == "scenes":
        print("[3/7] Detecting scenes...")
        scenes = detect_scenes(str(video_path))
        _save_json(output_dir / "scenes.json", scenes)
    if not resume or resume == "audio":
        print("[4/7] Analyzing audio...")
        audio_info = analyze_audio(str(video_path))
        _save_json(output_dir / "audio_analysis.json", audio_info)
    if not resume or resume == "score":
        print("[5/7] Scoring moments...")
        segments = _load_json(output_dir / "transcript.json", [])
        info = ingest(str(video_path))
        provider = create_provider(provider=config.provider, api_key=config.api_key)
        clips = score_moments(provider=provider, transcript=segments, duration=info.duration, max_clips=config.max_clips)
        _save_json(output_dir / "clip_plans.json", [c.model_dump() for c in clips])
        print(f"  Identified {len(clips)} clips")
    if not resume or resume == "render":
        print("[6/7] Rendering clips...")
        clip_plans = _load_json(output_dir / "clip_plans.json", [])
        rendered = []
        for cd in clip_plans:
            if cd.get("score", 0) < config.min_score:
                continue
            try:
                from .models.clip_plan import ClipPlan, ZoomEvent, SpeedRamp
                clip = ClipPlan(id=cd["id"], start=cd["start"], end=cd["end"], score=cd["score"], reason=cd.get("reason", ""), zoom_events=[ZoomEvent(**z) for z in cd.get("zoom_events", [])], speed_ramps=[SpeedRamp(**s) for s in cd.get("speed_ramps", [])], flash_frames=cd.get("flash_frames", []), caption_emphasis=cd.get("caption_emphasis", []))
                out = render_clip(clip, str(video_path), config)
                rendered.append({**cd, "path": out})
            except Exception as e:
                print(f"  FAIL {cd['id']}: {e}")
        _save_json(output_dir / "rendered.json", rendered)
    if not resume or resume == "qc":
        print("[7/7] Quality checks...")
        rendered = _load_json(output_dir / "rendered.json", [])
        report = run_qc(rendered, str(video_path), config)
        _save_json(output_dir / "qc_report.json", report.model_dump())
    elapsed = time.time() - start_time
    print(f"\n{'='*50}\nDone in {elapsed:.1f}s\nOutput: {output_dir}\n{'='*50}")


def _run_analyze(args):
    video_path = Path(args.video).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Analyzing: {video_path}")
    info = ingest(str(video_path))
    _save_json(output_dir / "video_info.json", info.to_dict())
    segments = transcribe(str(video_path))
    _save_json(output_dir / "transcript.json", segments)
    scenes = detect_scenes(str(video_path))
    _save_json(output_dir / "scenes.json", scenes)
    audio_info = analyze_audio(str(video_path))
    _save_json(output_dir / "audio_analysis.json", audio_info)
    provider = create_provider(provider=args.provider, api_key=args.api_key)
    clips = score_moments(provider=provider, transcript=segments, duration=info.duration, max_clips=args.max_clips)
    _save_json(output_dir / "clip_plans.json", [c.model_dump() for c in clips])
    print(f"Clips: {len(clips)} identified -> {output_dir}")


def _save_json(path: Path, data: Any):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


def _load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default if default is not None else {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    main()
