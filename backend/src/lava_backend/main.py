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

from .config import get_config, tool_versions
from .errors import ApiError, error_response
from .media import RenderClip, RenderSettings, probe, render

app = FastAPI(title="Lava Studio Media Sidecar", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api"


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


class RenderSettingsModel(BaseModel):
    width: int = 1280
    height: int = 720
    fps: int = 30


@app.post(f"{API_V1}/render", status_code=201)
async def render_endpoint(
    clips: str = Form(...),
    settings: str = Form(...),
    files: list[UploadFile] = File(...),
):
    try:
        clips_model = [
            ClipMetadata(**item) for item in json.loads(clips)
        ]
        settings_model = RenderSettingsModel(**json.loads(settings))
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise ApiError(422, "INVALID_BODY", f"clips/settings must be valid JSON") from exc

    if not clips_model:
        raise ApiError(422, "NO_CLIPS", "Render requires at least one clip")
    if len(files) != len(clips_model):
        raise ApiError(400, "FILE_COUNT_MISMATCH", "files and clips must have the same length")
    for clip in clips_model:
        if clip.duration <= 0:
            raise ApiError(422, "INVALID_DURATION", "clip duration must be positive")
        if not SAFE_FILENAME.match(clip.fileName) or clip.fileName.startswith("."):
            raise ApiError(422, "INVALID_FILENAME", f"invalid clip file name: {clip.fileName}")

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
        result = render(
            config,
            paths,
            [RenderClip(file_index=i, start=c.start, duration=c.duration) for i, c in enumerate(clips_model)],
            RenderSettings(
                width=settings_model.width,
                height=settings_model.height,
                fps=settings_model.fps,
            ),
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