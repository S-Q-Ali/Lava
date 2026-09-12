"""Lava Studio local media sidecar."""

from __future__ import annotations

import json
import re
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .clip import ClipEmbedder, MultilingualClipEmbedder
from .config import get_config, tool_versions
from .errors import ApiError, error_response
from .matching import Matcher, router as matching_router
from .media import (
    IMAGE_SUFFIXES,
    BetweenSpec,
    EdgeSpec,
    MotionSpec,
    RenderClip,
    RenderSettings,
    probe,
    render,
)
from .transcribe import router as transcribe_router
from .transcribers import WhisperTranscriber

app = FastAPI(title="Lava Studio Media Sidecar", version="0.1.0")

app.state.tmp_dir = get_config().cache_dir / "tmp"
app.state.tmp_dir.mkdir(parents=True, exist_ok=True)
app.state.transcriber = WhisperTranscriber(download_root=get_config().models_dir)
_config = get_config()
_embedder = ClipEmbedder(model_dir=_config.clip_dir)
if (_config.clip_multilingual_dir / "model.onnx").exists():
    _embedder = MultilingualClipEmbedder(base=_embedder, model_dir=_config.clip_multilingual_dir)
app.state.matcher = Matcher(_embedder)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api"
app.include_router(transcribe_router, prefix=f"{API_V1}")
app.include_router(matching_router, prefix=f"{API_V1}")


@app.exception_handler(ApiError)
async def api_error_handler(_: Request, exc: ApiError):
    return error_response(exc.status, exc.code, exc.message)


@app.get(f"{API_V1}/health")
def health():
    config = get_config()
    versions = tool_versions(config)
    if versions.error:
        return error_response(503, "FFMPEG_UNAVAILABLE", versions.error)
    return {
        "ok": True,
        "name": "lava-backend",
        "ffmpegVersion": versions.ffmpeg,
        "ffprobeVersion": versions.ffprobe,
    }


class ProbeRequest(BaseModel):
    path: str


@app.post(f"{API_V1}/probe")
def probe_endpoint(body: ProbeRequest):
    result = probe(get_config(), body.path)
    return {
        "path": result.path,
        "duration": result.duration,
        "sizeBytes": result.sizeBytes,
        "formatName": result.formatName,
        "streams": [
            {
                "codecType": s.codecType,
                "codecName": s.codecName,
                "width": s.width,
                "height": s.height,
            }
            for s in result.streams
        ],
    }


SAFE_FILENAME = re.compile(r"^[\w.\- ]+$")
JOB_ID = re.compile(r"^[a-f0-9]{32}$")


class ClipMetadata(BaseModel):
    fileName: str
    start: float = 0.0
    duration: float
    motion: MotionModel | None = None


class MotionModel(BaseModel):
    type: str
    strength: float


class RenderSettingsModel(BaseModel):
    width: int = 1280
    height: int = 720
    fps: int = 30


@app.post(f"{API_V1}/render", status_code=201)
async def render_endpoint(
    clips: str = Form(...),
    settings: str = Form(...),
    transitions: str | None = Form(None),
    files: list[UploadFile] = File(...),
):
    try:
        clips_model = [
            ClipMetadata(**item) for item in json.loads(clips)
        ]
        settings_model = RenderSettingsModel(**json.loads(settings))
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise ApiError(422, "INVALID_BODY", f"clips/settings must be valid JSON") from exc

    transition_specs: list = []
    if transitions is not None and transitions.strip():
        try:
            parsed_transitions = json.loads(transitions)
        except json.JSONDecodeError as exc:
            raise ApiError(422, "INVALID_BODY", "transitions must be valid JSON") from exc
        if not isinstance(parsed_transitions, list):
            raise ApiError(422, "INVALID_BODY", "transitions must be a JSON array")
        try:
            for item in parsed_transitions:
                if item.get("kind") == "between":
                    transition_specs.append(
                        BetweenSpec(
                            first=int(item["first"]),
                            second=int(item["second"]),
                            type=str(item["type"]),
                            duration=float(item["duration"]),
                        )
                    )
                elif item.get("kind") == "edge":
                    transition_specs.append(
                        EdgeSpec(
                            at=str(item["at"]),
                            index=int(item["index"]),
                            duration=float(item["duration"]),
                        )
                    )
                else:
                    raise ApiError(422, "INVALID_BODY", "transition entry must have kind between|edge")
        except (KeyError, TypeError, ValueError) as exc:
            raise ApiError(422, "INVALID_BODY", f"malformed transition entry: {exc}") from exc

    if not clips_model:
        raise ApiError(422, "NO_CLIPS", "Render requires at least one clip")
    if len(files) != len(clips_model):
        raise ApiError(400, "FILE_COUNT_MISMATCH", "files and clips must have the same length")
    for clip in clips_model:
        if clip.duration <= 0:
            raise ApiError(422, "INVALID_DURATION", "clip duration must be positive")
        if not SAFE_FILENAME.match(clip.fileName) or clip.fileName.startswith("."):
            raise ApiError(422, "INVALID_FILENAME", f"invalid clip file name: {clip.fileName}")
        if clip.motion is not None and Path(clip.fileName).suffix.lower() not in IMAGE_SUFFIXES:
            raise ApiError(422, "MOTION_INVALID", "motion is only supported on image clips")

    config = get_config()
    job_id = uuid.uuid4().hex
    upload_root = config.uploads_dir / job_id
    upload_root.mkdir(parents=True, exist_ok=True)

    file_map: dict[str, Path] = {}
    paths: list[Path] = []
    for idx, (upload, clip) in enumerate(zip(files, clips_model)):
        name = Path(upload.filename or clip.fileName).name
        dest = upload_root / name
        with dest.open("wb") as out:
            shutil.copyfileobj(upload.file, out)
        file_map[clip.fileName] = dest
        paths.append(dest)

    missing = [c.fileName for c in clips_model if c.fileName not in file_map]
    if missing:
        raise ApiError(400, "CLIP_FILE_MISSING", f"no uploaded file for clip(s): {sorted(set(missing))}")

    try:
        render_clips = []
        for i, c in enumerate(clips_model):
            motion = None
            if c.motion is not None:
                motion = MotionSpec(type=c.motion.type, strength=c.motion.strength)
            render_clips.append(
                RenderClip(file_index=i, start=c.start, duration=c.duration, motion=motion)
            )
        result = render(
            config,
            paths,
            render_clips,
            RenderSettings(
                width=settings_model.width,
                height=settings_model.height,
                fps=settings_model.fps,
            ),
            transitions=transition_specs,
        )
    except Exception:
        shutil.rmtree(upload_root, ignore_errors=True)
        raise
    return {
        "jobId": result.jobId,
        "outputPath": result.outputPath,
        "duration": result.duration,
        "width": result.width,
        "height": result.height,
        "fps": result.fps,
        "sizeBytes": result.sizeBytes,
    }


@app.get(f"{API_V1}/files/{{job_id}}")
def serve_render(job_id: str):
    if not JOB_ID.fullmatch(job_id):
        raise ApiError(404, "NOT_FOUND", "no such render")
    out_path = get_config().renders_dir / f"{job_id}.mp4"
    if not out_path.exists():
        raise ApiError(404, "NOT_FOUND", "no such render")
    return FileResponse(out_path, media_type="video/mp4", filename=f"{job_id}.mp4")