"""Lava Studio local media sidecar."""

from __future__ import annotations

import asyncio
import json
import re
import shutil
import uuid
from pathlib import Path

from .fs import rmtree_safe

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from .captions import CaptionError, parse_captions
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
from .licensing import resolve_render_font_licenses, violation_message
from .preset_import import PresetImportError, import_preset_payload, preset_to_export_dict
from .preset_registry import load_registry as load_preset_registry
from .matching import router as matching_router
from .manhwa.api import router as manhwa_router
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
from .proxy import ProxyError, file_hash, generate_image_proxy, generate_video_proxy
from .transcribe import router as transcribe_router
from .groq_transcribe import router as groq_transcribe_router
from .captions_export import router as captions_export_router
from .visual_prompts import router as visual_prompts_router
from .voice_blending import router as voice_blending_router
from .voice_cloning import router as voice_cloning_router
from .model_manager import router as model_manager_router
from .image_gen import router as image_gen_router
from .podcast_maker import router as podcast_maker_router
from .voice_library import router as voice_library_router
from .sound_fx import router as sound_fx_router
from .bulk_tts import router as bulk_tts_router
from .timeline_sync import router as timeline_sync_router
from .video_clipper import router as video_clipper_router
from .hardware_analyzer import router as hardware_router
from .auto_updater import router as update_router

app = FastAPI(title="Lava Studio Media Sidecar", version="0.1.0-beta.0")

app.state.tmp_dir = get_config().cache_dir / "tmp"
app.state.tmp_dir.mkdir(parents=True, exist_ok=True)
# Models are never constructed at import time: the matcher and transcriber are
# built lazily on first use (see matching._get_matcher / transcribe._get_transcriber)
# so the sidecar starts fast and touches no model bytes until a real request.
app.state.transcriber = None
app.state.matcher = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api"
app.include_router(transcribe_router, prefix=f"{API_V1}")
app.include_router(groq_transcribe_router, prefix=f"{API_V1}")
app.include_router(captions_export_router, prefix=f"{API_V1}")
app.include_router(visual_prompts_router, prefix=f"{API_V1}")
app.include_router(voice_blending_router, prefix=f"{API_V1}")
app.include_router(voice_cloning_router, prefix=f"{API_V1}")
app.include_router(model_manager_router, prefix=f"{API_V1}")
app.include_router(image_gen_router, prefix=f"{API_V1}")
app.include_router(podcast_maker_router, prefix=f"{API_V1}")
app.include_router(voice_library_router, prefix=f"{API_V1}")
app.include_router(sound_fx_router, prefix=f"{API_V1}")
app.include_router(bulk_tts_router, prefix=f"{API_V1}")
app.include_router(timeline_sync_router, prefix=f"{API_V1}")
app.include_router(video_clipper_router, prefix=f"{API_V1}")
app.include_router(hardware_router, prefix=f"{API_V1}")
app.include_router(update_router, prefix=f"{API_V1}")
app.include_router(matching_router, prefix=f"{API_V1}")
app.include_router(manhwa_router, prefix=f"{API_V1}/manhwa")

# Pipeline API (auto-clipping)
try:
    from .pipeline_api import router as pipeline_router
    app.include_router(pipeline_router)
except ImportError:
    pass  # Pipeline deps not installed

# Voiceover API (edge-tts, 170+ voices)
try:
    from .voiceover_api import router as voiceover_router
    app.include_router(voiceover_router)
except ImportError:
    pass  # edge-tts not installed

# AI Script Writer (Groq/Cerebras/Mistral)
try:
    from .scriptwriter_api import router as scriptwriter_router
    app.include_router(scriptwriter_router)
except ImportError:
    pass  # LLM deps not installed


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
        "renderTimeoutMs": config.render_timeout_seconds * 1000,
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
    audio_files: list[UploadFile] = File(default=[]),
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

    render_fonts: list[dict] = []
    if caption_specs:
        used_fonts, violations = resolve_render_font_licenses(
            caption_specs, _list_font_entries(config), config.fonts_dir
        )
        if violations:
            raise ApiError(422, "FONT_LICENSE", violation_message(violations[0]))
        render_fonts = [
            {"family": f.family, "fontId": f.font_id, "license": f.license}
            for f in used_fonts
        ]

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

    # Save audio files
    audio_paths: list[Path] = []
    for upload in audio_files:
        if upload and upload.filename:
            name = Path(upload.filename).name
            dest = upload_root / f"audio_{name}"
            with dest.open("wb") as out:
                shutil.copyfileobj(upload.file, out)
            audio_paths.append(dest)

    try:
        render_clips = []
        for i, c in enumerate(clips_model):
            motion = None
            if c.motion is not None:
                motion = MotionSpec(type=c.motion.type, strength=c.motion.strength)
            render_clips.append(
                RenderClip(file_index=i, start=c.start, duration=c.duration, motion=motion)
            )
        result = await asyncio.to_thread(
            render,
            config,
            paths,
            render_clips,
            RenderSettings(
                width=settings_model.width,
                height=settings_model.height,
                fps=settings_model.fps,
                upscale_factor=config.motion_upscale_factor,
            ),
            transitions=transition_specs,
            captions=caption_specs,
            fonts=render_fonts,
            audio_files=audio_paths if audio_paths else None,
        )
    except Exception:
        rmtree_safe(upload_root, ignore_errors=True)
        raise
    return {
        "jobId": result.jobId,
        "outputPath": result.outputPath,
        "duration": result.duration,
        "width": result.width,
        "height": result.height,
        "fps": result.fps,
        "sizeBytes": result.sizeBytes,
        "fonts": result.fonts,
    }


@app.get(f"{API_V1}/files/{{job_id}}")
def serve_render(job_id: str):
    if not JOB_ID.fullmatch(job_id):
        raise ApiError(404, "NOT_FOUND", "no such render")
    out_path = get_config().renders_dir / f"{job_id}.mp4"
    if not out_path.exists():
        raise ApiError(404, "NOT_FOUND", "no such render")
    return FileResponse(out_path, media_type="video/mp4", filename=f"{job_id}.mp4")


# --- Proxy ---

_PROXY_ID = re.compile(r"^[0-9a-f]{16}$")


def _proxy_dest(config, proxy_id: str, ext: str) -> Path:
    return config.proxy_dir / f"{proxy_id}{ext}"


def _proxy_dest_video(config, proxy_id: str) -> Path:
    return config.proxy_dir / f"{proxy_id}_proxy.mp4"


@app.post(f"{API_V1}/proxy")
async def create_proxy(file: UploadFile = File(...)):
    config = get_config()
    filename = (file.filename or "upload").strip()
    ext = Path(filename).suffix.lower()

    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif",
                    ".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}:
        raise ApiError(422, "PROXY_UNSUPPORTED", f"cannot generate proxy for file type: {ext or '(none)'}")

    data = await file.read()
    if len(data) == 0:
        raise ApiError(422, "PROXY_FAILED", "uploaded file is empty")

    proxy_id = file_hash(data)
    config.proxy_dir.mkdir(parents=True, exist_ok=True)

    is_video = ext in {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}
    is_image = ext in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}

    # If already cached, skip regeneration and return stored metadata.
    if is_image:
        dest = _proxy_dest(config, proxy_id, ".webp")
        if dest.exists():
            from PIL import Image

            with Image.open(dest) as thumb:
                width, height = thumb.size
            return {
                "proxyId": proxy_id,
                "kind": "image",
                "width": width,
                "height": height,
                "mimeType": "image/webp",
                "sizeBytes": dest.stat().st_size,
            }

    if is_video:
        dest = _proxy_dest_video(config, proxy_id)
        if dest.exists():
            from .proxy import _probe_dims
            w, h = _probe_dims(config, dest)
            return {
                "proxyId": proxy_id,
                "kind": "video",
                "width": w,
                "height": h,
                "mimeType": "video/mp4",
                "sizeBytes": dest.stat().st_size,
            }

    # Write uploaded bytes to a temp file so the proxy helpers can read it.
    tmp_dir = config.cache_dir / "tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_src = tmp_dir / f"{proxy_id}{ext}"
    tmp_src.write_bytes(data)

    try:
        if is_image:
            result = await asyncio.to_thread(generate_image_proxy, tmp_src, config.proxy_dir)
            return {
                "proxyId": proxy_id,
                "kind": "image",
                "width": result.width,
                "height": result.height,
                "mimeType": result.mimeType,
                "sizeBytes": result.sizeBytes,
            }
        else:
            result = await asyncio.to_thread(
                generate_video_proxy, tmp_src, config.proxy_dir, config
            )
            return {
                "proxyId": proxy_id,
                "kind": "video",
                "width": result.width,
                "height": result.height,
                "mimeType": result.mimeType,
                "sizeBytes": result.sizeBytes,
            }
    except ProxyError as exc:
        raise ApiError(422, "PROXY_FAILED", str(exc)) from exc
    finally:
        tmp_src.unlink(missing_ok=True)


@app.get(f"{API_V1}/proxy/{{proxy_id}}")
def serve_proxy(proxy_id: str):
    config = get_config()
    proxy_dir = config.proxy_dir
    if not _PROXY_ID.fullmatch(proxy_id):
        raise ApiError(404, "NOT_FOUND", "no such proxy")
    # Try image first (webp), then video (mp4)
    img_path = proxy_dir / f"{proxy_id}.webp"
    if img_path.exists():
        return FileResponse(img_path, media_type="image/webp", filename=f"{proxy_id}.webp")
    vid_path = proxy_dir / f"{proxy_id}_proxy.mp4"
    if vid_path.exists():
        return FileResponse(vid_path, media_type="video/mp4", filename=f"{proxy_id}_proxy.mp4")
    raise ApiError(404, "NOT_FOUND", "no such proxy")


class GcOptions(BaseModel):
    ttlDays: int | None = None
    dryRun: bool = False


@app.post(f"{API_V1}/gc")
async def run_gc(options: GcOptions | None = None):
    """Purge stale, regenerable cache artifacts (proxy files only)."""
    from .gc import purge_stale_proxies

    config = get_config()
    ttl = options.ttlDays if options is not None else None
    dry_run = options.dryRun if options is not None else False
    if ttl is not None and (isinstance(ttl, bool) or ttl < 1):
        raise ApiError(422, "GC_INVALID", "ttlDays must be a positive integer")

    report = await asyncio.to_thread(
        purge_stale_proxies, config, ttl_days=ttl, dry_run=dry_run
    )
    return {
        "purged": report.purged,
        "freedBytes": report.freedBytes,
        "remaining": report.remaining,
        "scope": report.scope,
    }


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
    return [p.__dict__ for p in load_preset_registry(_preset_registry_path(config))]


def _preset_registry_path(config) -> Path:
    return Path(config.presets_dir) / "registry.json"


def _all_presets(config) -> list:
    return load_preset_registry(_preset_registry_path(config))


@app.post(f"{API_V1}/presets", status_code=201)
async def create_preset(request: Request):
    config = get_config()
    try:
        raw = await request.json()
    except (json.JSONDecodeError, ValueError) as exc:
        raise ApiError(422, "PRESET_INVALID", "Preset body must be valid JSON") from exc

    known_font_ids = {e["id"] for e in _list_font_entries(config)}
    try:
        preset = import_preset_payload(raw, known_font_ids)
    except PresetImportError as exc:
        raise ApiError(422, "PRESET_INVALID", str(exc)) from exc

    current = _all_presets(config)
    if any(p.id == preset.id for p in current):
        raise ApiError(422, "PRESET_INVALID", f"Preset id '{preset.id}' already exists")
    save_registry_presets(config, [*current, preset])
    return preset.__dict__


def save_registry_presets(config, presets) -> None:
    path = _preset_registry_path(config)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump({"version": 1, "presets": [p.__dict__ for p in presets]}, fh, ensure_ascii=False, indent=2)


def _builtin_by_id() -> dict:
    from .preset_registry import BUILTIN_PRESETS

    return {p.id: p for p in BUILTIN_PRESETS}


@app.get(f"{API_V1}/presets/{{preset_id}}/file")
def export_preset(preset_id: str):
    config = get_config()
    preset = next((p for p in _all_presets(config) if p.id == preset_id), None)
    if preset is None:
        raise ApiError(404, "NOT_FOUND", "no such preset")
    return preset_to_export_dict(preset)


@app.put(f"{API_V1}/presets/{{preset_id}}")
async def update_preset(preset_id: str, request: Request):
    config = get_config()
    if preset_id in _builtin_by_id():
        raise ApiError(403, "BUILTIN_PRESET", "built-in presets cannot be overwritten")
    current = _all_presets(config)
    if not any(p.id == preset_id for p in current):
        raise ApiError(404, "NOT_FOUND", "no such preset")

    try:
        raw = await request.json()
    except (json.JSONDecodeError, ValueError) as exc:
        raise ApiError(422, "PRESET_INVALID", "Preset body must be valid JSON") from exc

    known_font_ids = {e["id"] for e in _list_font_entries(config)}
    try:
        preset = import_preset_payload(raw, known_font_ids)
    except PresetImportError as exc:
        raise ApiError(422, "PRESET_INVALID", str(exc)) from exc
    if preset.id != preset_id:
        raise ApiError(
            422,
            "PRESET_INVALID",
            f"Preset id in the body ('{preset.id}') must match the path id ('{preset_id}')",
        )
    save_registry_presets(config, [p if p.id != preset_id else preset for p in current])
    return preset.__dict__


@app.delete(f"{API_V1}/presets/{{preset_id}}", status_code=204)
def delete_preset(preset_id: str):
    config = get_config()
    if preset_id in _builtin_by_id():
        raise ApiError(403, "BUILTIN_PRESET", "built-in presets cannot be deleted")
    current = _all_presets(config)
    remaining = [p for p in current if p.id != preset_id]
    if len(remaining) == len(current):
        raise ApiError(404, "NOT_FOUND", "no such preset")
    save_registry_presets(config, remaining)
    return Response(status_code=204)