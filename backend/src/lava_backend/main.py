"""Lava Studio local media sidecar."""

from __future__ import annotations

import json
import re
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from .captions import CaptionError, parse_captions
from .clip import ClipEmbedder, MultilingualClipEmbedder
from .config import get_config, tool_versions
from .errors import ApiError, error_response
from .fonts import (
    FONT_ID_RE,
    FontError,
    extract_family_name,
    font_license_from_payload,
    is_allowed_font_name,
    load_registry,
    make_font_metadata,
    save_registry,
    validate_font_bytes,
)
from .preset_registry import load_registry as load_preset_registry
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
    captions: str | None = Form(None),
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

    caption_specs = []
    if captions is not None and captions.strip():
        try:
            parsed_captions = json.loads(captions)
            caption_specs = parse_captions(parsed_captions)
        except json.JSONDecodeError as exc:
            raise ApiError(422, "INVALID_BODY", "captions must be valid JSON") from exc
        except CaptionError as exc:
            raise ApiError(422, "CAPTION_INVALID", str(exc)) from exc

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
            captions=caption_specs,
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


def _font_registry_path(config) -> Path:
    return Path(config.fonts_dir) / "licenses.json"


def _list_font_entries(config) -> list[dict]:
    return load_registry(_font_registry_path(config))


def _font_file(config, entry: dict) -> Path:
    return Path(config.fonts_dir) / f"{entry['id']}.{entry['ext']}"


@app.post(f"{API_V1}/fonts", status_code=201)
async def upload_font(
    file: UploadFile = File(...),
    license: str | None = Form(None),
):
    config = get_config()
    filename = (file.filename or "font.ttf").strip()
    if not is_allowed_font_name(filename) or filename.startswith("."):
        raise ApiError(422, "FONT_INVALID", "Only .ttf and .otf files can be imported as fonts")
    data = await file.read()
    if len(data) == 0:
        raise ApiError(422, "FONT_INVALID", "Font file is empty")
    try:
        validate_font_bytes(data)
    except FontError as exc:
        raise ApiError(422, "FONT_INVALID", str(exc)) from exc

    license_payload = {"type": "unknown", "source": None, "embeddingAllowed": True}
    if license is not None and license.strip():
        try:
            raw_license = json.loads(license)
        except json.JSONDecodeError as exc:
            raise ApiError(422, "INVALID_BODY", "license must be valid JSON") from exc
        try:
            license_payload = font_license_from_payload(raw_license)
        except FontError as exc:
            raise ApiError(422, "FONT_INVALID", str(exc)) from exc

    family = extract_family_name(data)
    if not family:
        family = Path(filename).stem
    font_id = f"font-{uuid.uuid4().hex}"
    try:
        entry = make_font_metadata(font_id, family, filename, license_payload, _now_iso())
    except FontError as exc:
        raise ApiError(422, "FONT_INVALID", str(exc)) from exc

    stored = config.fonts_dir / f"{font_id}.{entry['ext']}"
    config.fonts_dir.mkdir(parents=True, exist_ok=True)
    stored.write_bytes(data)
    entries = _list_font_entries(config)
    entries.append(entry)
    save_registry(_font_registry_path(config), entries)
    return entry


def _now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


@app.get(f"{API_V1}/fonts")
def list_fonts():
    return _list_font_entries(get_config())


@app.get(f"{API_V1}/fonts/{{font_id}}/file")
def serve_font_file(font_id: str):
    config = get_config()
    if not FONT_ID_RE.fullmatch(font_id):
        raise ApiError(404, "NOT_FOUND", "no such font")
    entry = next((e for e in _list_font_entries(config) if e["id"] == font_id), None)
    if entry is None:
        raise ApiError(404, "NOT_FOUND", "no such font")
    stored = _font_file(config, entry)
    if not stored.exists():
        raise ApiError(404, "NOT_FOUND", "no such font")
    return FileResponse(stored, media_type="font/ttf", filename=entry["fileName"])


@app.delete(f"{API_V1}/fonts/{{font_id}}", status_code=204)
def delete_font(font_id: str):
    config = get_config()
    if not FONT_ID_RE.fullmatch(font_id):
        raise ApiError(404, "NOT_FOUND", "no such font")
    entries = _list_font_entries(config)
    entry = next((e for e in entries if e["id"] == font_id), None)
    if entry is None:
        raise ApiError(404, "NOT_FOUND", "no such font")
    stored = _font_file(config, entry)
    stored.unlink(missing_ok=True)
    remaining = [e for e in entries if e["id"] != font_id]
    if remaining:
        save_registry(_font_registry_path(config), remaining)
    else:
        _font_registry_path(config).unlink(missing_ok=True)
    return Response(status_code=204)


@app.get(f"{API_V1}/presets")
def list_presets():
    config = get_config()
    path = Path(config.presets_dir) / "registry.json"
    return [p.__dict__ for p in load_preset_registry(path)]