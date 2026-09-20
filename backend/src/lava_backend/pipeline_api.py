"""Lava Studio Pipeline API — two pipelines:
1. Auto-clipping pipeline (existing — ingest → transcribe → scenes → render)
2. Script-to-Video pipeline (new — script → TTS → images → sync → render)
"""
from __future__ import annotations

import asyncio
import json
import shutil
import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

# Global state for running pipeline jobs
_jobs: dict[str, dict[str, Any]] = {}

# ── Script-to-Video pipeline models ─────────────────────────────────────────

class ScriptPipelineRequest(BaseModel):
    script: str = Field(..., min_length=10, description="Full script text")
    voice: str = Field(default="en-US-GuyNeural", description="edge-tts voice name")
    speed: str = Field(default="+0%", description="TTS speed adjustment")
    style: str = Field(default="cinematic", description="Image generation style")
    gemini_key: str = Field(default="", description="Google Gemini API key (optional)")


class ScriptPipelineStatus(BaseModel):
    job_id: str
    stage: str
    progress: float
    message: str
    error: str | None = None
    scenes: list[dict] = []
    output_path: str = ""
    total_duration_ms: int = 0


class PipelineRequest(BaseModel):
    video_path: str
    output_dir: str = ""
    preset: str = "default"
    provider: str = "auto"
    api_key: str = ""
    max_clips: int = 10
    min_score: float = 0.6
    width: int = 1080
    height: int = 1920
    no_captions: bool = False
    no_zoom: bool = False


class PipelineStatus(BaseModel):
    job_id: str
    stage: str
    progress: float
    message: str
    error: str | None = None
    clips: list[dict[str, Any]] = []


def _run_pipeline_job(job_id: str, config: dict):
    """Run pipeline in background thread."""
    from .pipeline.models.config import PipelineConfig
    from .pipeline.stages.ingest import ingest
    from .pipeline.stages.transcribe import transcribe
    from .pipeline.stages.scene_detect import detect_scenes
    from .pipeline.stages.audio_analysis import analyze_audio
    from .pipeline.analysis.moment_scorer import score_moments
    from .pipeline.stages.renderer import render_clip
    from .pipeline.stages.qc import run_qc
    from .pipeline.providers.factory import create_provider

    job = _jobs[job_id]
    video_path = config["video_path"]
    output_dir = config.get("output_dir") or str(Path(video_path).parent / "lava_clips")
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    pipeline_config = PipelineConfig(
        input_path=video_path, output_dir=output_dir, preset=config.get("preset", "default"),
        provider=config.get("provider", "auto"), api_key=config.get("api_key", ""),
        max_clips=config.get("max_clips", 10), min_score=config.get("min_score", 0.6),
        output_width=config.get("width", 1080), output_height=config.get("height", 1920),
        captions_enabled=not config.get("no_captions", False),
        zoom_enabled=not config.get("no_zoom", False),
    )

    stages = ["ingest", "transcribe", "scenes", "audio", "score", "render", "qc"]
    try:
        for i, stage in enumerate(stages):
            job["stage"] = stage
            job["progress"] = (i + 1) / len(stages)
            job["message"] = f"Running {stage}..."

            if stage == "ingest":
                info = ingest(video_path)
                job["message"] = f"Video: {info.width}x{info.height}, {info.duration:.1f}s"
            elif stage == "transcribe":
                segments = transcribe(video_path)
                Path(output_dir, "transcript.json").write_text(json.dumps(segments, indent=2), encoding="utf-8")
            elif stage == "scenes":
                scenes = detect_scenes(video_path)
                Path(output_dir, "scenes.json").write_text(json.dumps(scenes, indent=2), encoding="utf-8")
            elif stage == "audio":
                audio_info = analyze_audio(video_path)
                Path(output_dir, "audio_analysis.json").write_text(json.dumps(audio_info, indent=2), encoding="utf-8")
            elif stage == "score":
                transcript_path = Path(output_dir, "transcript.json")
                segments = json.loads(transcript_path.read_text(encoding="utf-8")) if transcript_path.exists() else []
                info = ingest(video_path)
                provider = create_provider(provider=pipeline_config.provider, api_key=pipeline_config.api_key)
                clips = score_moments(provider=provider, transcript=segments, duration=info.duration, max_clips=pipeline_config.max_clips)
                clips_data = [c.model_dump() for c in clips]
                Path(output_dir, "clip_plans.json").write_text(json.dumps(clips_data, indent=2), encoding="utf-8")
                job["clips"] = clips_data
            elif stage == "render":
                clip_plans_path = Path(output_dir, "clip_plans.json")
                clip_plans = json.loads(clip_plans_path.read_text(encoding="utf-8")) if clip_plans_path.exists() else []
                rendered = []
                for cd in clip_plans:
                    if cd.get("score", 0) < pipeline_config.min_score:
                        continue
                    try:
                        from .pipeline.models.clip_plan import ClipPlan, ZoomEvent, SpeedRamp
                        clip = ClipPlan(id=cd["id"], start=cd["start"], end=cd["end"], score=cd["score"], reason=cd.get("reason", ""), zoom_events=[ZoomEvent(**z) for z in cd.get("zoom_events", [])], speed_ramps=[SpeedRamp(**s) for s in cd.get("speed_ramps", [])], flash_frames=cd.get("flash_frames", []), caption_emphasis=cd.get("caption_emphasis", []))
                        out = render_clip(clip, video_path, pipeline_config)
                        rendered.append({**cd, "path": out})
                    except Exception as e:
                        job["message"] = f"Render error: {e}"
                Path(output_dir, "rendered.json").write_text(json.dumps(rendered, indent=2), encoding="utf-8")
            elif stage == "qc":
                rendered_path = Path(output_dir, "rendered.json")
                rendered = json.loads(rendered_path.read_text(encoding="utf-8")) if rendered_path.exists() else []
                report = run_qc(rendered, video_path, pipeline_config)
                Path(output_dir, "qc_report.json").write_text(json.dumps(report.model_dump(), indent=2), encoding="utf-8")
                job["message"] = report.summary()

        job["stage"] = "done"
        job["progress"] = 1.0
        job["message"] = "Pipeline complete!"

    except Exception as e:
        job["stage"] = "error"
        job["error"] = str(e)
        job["message"] = f"Error: {e}"


@router.post("/run")
async def run_pipeline(request: PipelineRequest, background_tasks: BackgroundTasks):
    import uuid
    job_id = str(uuid.uuid4())[:8]
    _jobs[job_id] = {"job_id": job_id, "stage": "starting", "progress": 0.0, "message": "Initializing...", "error": None, "clips": []}
    background_tasks.add_task(_run_pipeline_job, job_id, request.model_dump())
    return {"job_id": job_id, "status": "started"}


@router.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return _jobs[job_id]


@router.get("/presets")
async def list_presets():
    presets_dir = Path(__file__).parent / "pipeline" / "presets"
    presets = []
    if presets_dir.exists():
        for f in presets_dir.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                presets.append({"id": f.stem, "name": data.get("name", f.stem)})
            except Exception:
                pass
    return presets


@router.get("/download/{job_id}/{clip_id}")
async def download_clip(job_id: str, clip_id: str):
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    for clip in _jobs[job_id].get("clips", []):
        if clip.get("id") == clip_id and clip.get("path"):
            path = Path(clip["path"])
            if path.exists():
                return FileResponse(path, filename=path.name, media_type="video/mp4")
    raise HTTPException(status_code=404, detail="Clip not found")


# ── Script-to-Video Pipeline ────────────────────────────────────────────────

async def _run_script_pipeline(job_id: str, config: dict):
    """Run script-to-video pipeline in background."""
    from .pipeline_engine import run_pipeline

    job = _jobs[job_id]

    def on_progress(stage: str, pct: float, msg: str):
        job["stage"] = stage
        job["progress"] = pct
        job["message"] = msg

    try:
        state = await run_pipeline(
            script=config["script"],
            voice=config.get("voice", "en-US-GuyNeural"),
            speed=config.get("speed", "+0%"),
            style=config.get("style", "cinematic"),
            gemini_key=config.get("gemini_key", ""),
            on_progress=on_progress,
        )

        job["stage"] = "done"
        job["progress"] = 1.0
        job["message"] = "Pipeline complete!"
        job["output_path"] = state.output_path
        job["total_duration_ms"] = state.total_duration_ms
        job["scenes"] = [
            {
                "index": s.index,
                "text": s.text,
                "audio_path": s.audio_path,
                "image_path": s.image_path,
                "duration_ms": s.duration_ms,
                "start_ms": s.start_ms,
            }
            for s in state.scenes
        ]
        if state.error:
            job["error"] = state.error
        if state.stage_errors:
            job["stage_errors"] = state.stage_errors

    except Exception as e:
        job["stage"] = "error"
        job["error"] = str(e)
        job["message"] = f"Error: {e}"


@router.post("/run-script")
async def run_script_pipeline(request: ScriptPipelineRequest, background_tasks: BackgroundTasks):
    """Run script-to-video pipeline.

    Stages: Split Script → TTS → Images → Timeline Sync → Captions → Render
    Each stage progresses independently; failures are graceful.
    """
    import uuid
    job_id = str(uuid.uuid4())[:12]
    _jobs[job_id] = {
        "job_id": job_id,
        "stage": "starting",
        "progress": 0.0,
        "message": "Initializing pipeline...",
        "error": None,
        "scenes": [],
        "output_path": "",
        "total_duration_ms": 0,
    }
    background_tasks.add_task(_run_script_pipeline, job_id, request.model_dump())
    return {"job_id": job_id, "status": "started"}


@router.get("/script-status/{job_id}", response_model=ScriptPipelineStatus)
async def get_script_status(job_id: str):
    """Get script-to-video pipeline status."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return _jobs[job_id]


@router.get("/script-download/{job_id}")
async def download_script_output(job_id: str):
    """Download the rendered video from script pipeline."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = _jobs[job_id]
    output_path = job.get("output_path", "")

    if not output_path or not Path(output_path).exists():
        raise HTTPException(status_code=404, detail="Video not ready yet")

    return FileResponse(
        path=output_path,
        filename=f"pipeline_{job_id}.mp4",
        media_type="video/mp4",
    )
