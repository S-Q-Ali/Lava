"""Model Manager — one-click download and integration for all AI models.

Provides status, download, and progress tracking for:
- Whisper (local) — faster-whisper tiny/small/medium
- CLIP (local) — image matching
- CLIP Multilingual — multilingual image matching
- XTTS-v2 — voice cloning (~1.5GB)
"""
from __future__ import annotations

import asyncio
import json
import os
import shutil
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from .config import get_config

router = APIRouter(prefix="/models", tags=["model-manager"])

# ── Model Registry ──────────────────────────────────────────────────

@dataclass
class ModelInfo:
    id: str
    name: str
    description: str
    directory: str  # relative to repo root
    size_mb: int
    download_source: str  # "huggingface" | "pip" | "manual" | "builtin"
    download_url: str = ""
    download_command: str = ""
    required: bool = False
    installed: bool = False
    size_on_disk: int = 0

def _scan_models() -> list[ModelInfo]:
    config = get_config()
    root = config.root

    models = [
        ModelInfo(
            id="whisper-tiny",
            name="Whisper Tiny",
            description="Fastest local transcription (~75MB). Good for real-time on low-end hardware.",
            directory="models/whisper",
            size_mb=75,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-tiny-en",
            name="Whisper Tiny (English)",
            description="English-only tiny model (~75MB). Faster than multilingual for English content.",
            directory="models/whisper",
            size_mb=75,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-base",
            name="Whisper Base",
            description="Base model (~150MB). Decent accuracy with reasonable speed.",
            directory="models/whisper",
            size_mb=150,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-base-en",
            name="Whisper Base (English)",
            description="English-only base model (~150MB). Best for English-only workflows.",
            directory="models/whisper",
            size_mb=150,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-small",
            name="Whisper Small",
            description="Balanced model (~500MB). Good accuracy, works well on most hardware.",
            directory="models/whisper",
            size_mb=500,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-small-en",
            name="Whisper Small (English)",
            description="English-only small (~500MB). Best English accuracy at this size.",
            directory="models/whisper",
            size_mb=500,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-medium",
            name="Whisper Medium",
            description="High accuracy (~1.5GB). Best quality/speed tradeoff for most use cases.",
            directory="models/whisper",
            size_mb=1500,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-medium-en",
            name="Whisper Medium (English)",
            description="English-only medium (~1.5GB). Excellent English accuracy.",
            directory="models/whisper",
            size_mb=1500,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-large-v1",
            name="Whisper Large v1",
            description="Original large model (~3GB). Highest multilingual accuracy.",
            directory="models/whisper",
            size_mb=3000,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-large-v2",
            name="Whisper Large v2",
            description="Improved large model (~3GB). Better accuracy than v1.",
            directory="models/whisper",
            size_mb=3000,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-large-v3",
            name="Whisper Large v3",
            description="Latest large model (~3GB). Best overall accuracy, recommended for final output.",
            directory="models/whisper",
            size_mb=3000,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-large-v3-turbo",
            name="Whisper Large v3 Turbo",
            description="Optimized large v3 (~3GB). Same accuracy as v3, faster inference.",
            directory="models/whisper",
            size_mb=3000,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-distil-tiny",
            name="Whisper Distil Tiny",
            description="Distilled tiny (~75MB). Near tiny accuracy, ~4x faster inference.",
            directory="models/whisper",
            size_mb=75,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-distil-small",
            name="Whisper Distil Small",
            description="Distilled small (~250MB). Near small accuracy, ~3x faster inference.",
            directory="models/whisper",
            size_mb=250,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-distil-medium",
            name="Whisper Distil Medium",
            description="Distilled medium (~500MB). Near medium accuracy, ~2x faster inference.",
            directory="models/whisper",
            size_mb=500,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-distil-large-v2",
            name="Whisper Distil Large v2",
            description="Distilled large v2 (~800MB). Near large-v2 accuracy, ~3x faster.",
            directory="models/whisper",
            size_mb=800,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="whisper-distil-large-v3",
            name="Whisper Distil Large v3",
            description="Distilled large v3 (~800MB). Near large-v3 accuracy, ~3x faster. Best distil model.",
            directory="models/whisper",
            size_mb=800,
            download_source="pip",
            download_command="Auto-downloads on first use via faster-whisper",
        ),
        ModelInfo(
            id="clip",
            name="CLIP (English)",
            description="Image matching model for AI Match feature (~350MB).",
            directory="models/clip",
            size_mb=350,
            download_source="huggingface",
            download_url="openai/clip-vit-base-patch32",
            download_command="Auto-downloads via huggingface_hub",
        ),
        ModelInfo(
            id="clip-multilingual",
            name="CLIP Multilingual",
            description="Multilingual image matching (~550MB). Supports non-English queries.",
            directory="models/clip-multilingual",
            size_mb=550,
            download_source="huggingface",
            download_url="pcuenq/clip-vit-b32-multilingual",
            download_command="Auto-downloads via huggingface_hub",
        ),
        ModelInfo(
            id="xtts-v2",
            name="XTTS-v2 (Voice Cloning)",
            description="Coqui XTTS voice cloning model (~1.5GB). Clone any voice from 6s sample.",
            directory="models/xtts-v2",
            size_mb=1500,
            download_source="huggingface",
            download_url="coqui/XTTS-v2",
            download_command="Auto-downloads via huggingface_hub",
        ),
        ModelInfo(
            id="manhwa-panel-nano",
            name="Manhwa Panel Detector (Nano)",
            description="Fast ML panel detection (~3MB). YOLO26-nano, detects panels + text regions. CPU-friendly.",
            directory="models/manhwa-nano",
            size_mb=3,
            download_source="huggingface",
            download_url="leoxs22/manga-panel-detector-yolo26n",
            download_command="Auto-downloads via huggingface_hub",
        ),
        ModelInfo(
            id="manhwa-panel-seg",
            name="Manhwa Panel Segmentation",
            description="Pixel-level panel masks for irregular layouts (~23MB). YOLO26s-seg with balloon detection.",
            directory="models/manhwa-seg",
            size_mb=23,
            download_source="huggingface",
            download_url="ShadowB/Manga109-panel-balloon-text-yolov26-segmentation",
            download_command="Auto-downloads via huggingface_hub",
        ),
    ]

    # Check installation status — require actual model files, not just directory
    _MODEL_EXTENSIONS = {".pt", ".bin", ".onnx", ".safetensors", ".keras", ".h5"}
    for m in models:
        model_dir = root / m.directory
        if model_dir.exists() and model_dir.is_dir():
            model_files = [f for f in model_dir.rglob("*") if f.is_file() and f.suffix in _MODEL_EXTENSIONS]
            if model_files:
                m.installed = True
                m.size_on_disk = sum(f.stat().st_size for f in model_files)
        elif model_dir.exists() and model_dir.is_file():
            m.installed = True
            m.size_on_disk = model_dir.stat().st_size

    return models


# ── Download tracking ──────────────────────────────────────────────

_download_progress: dict[str, dict] = {}
_download_lock = threading.Lock()


def _set_progress(model_id: str, status: str, progress: float = 0, message: str = ""):
    with _download_lock:
        _download_progress[model_id] = {
            "status": status,
            "progress": progress,
            "message": message,
            "timestamp": time.time(),
        }


def _get_progress(model_id: str) -> dict:
    with _download_lock:
        return _download_progress.get(model_id, {"status": "idle", "progress": 0, "message": ""})


# ── Download progress via tqdm interception ─────────────────────────

class _DownloadProgressTqdm:
    """Custom tqdm that tracks bytes downloaded from snapshot_download."""
    _bytes = 0
    _total = 0
    _lock = threading.Lock()

    def __init__(self, *args, **kwargs):
        self.n = 0
        self.total = kwargs.get("total") or (args[1] if len(args) > 1 else None)
        self.disable = kwargs.get("disable", False)
        self.desc = kwargs.get("desc", "")
        self.unit = kwargs.get("unit", "")
        self.unit_scale = kwargs.get("unit_scale", False)
        self.bar_format = kwargs.get("bar_format", "")
        self.name = kwargs.get("name", "")
        self.log_level = kwargs.get("log_level", None)
        self.initial = kwargs.get("initial", 0)
        self.postfix: dict = {}

    def update(self, n=1):
        self.n += n
        with _DownloadProgressTqdm._lock:
            _DownloadProgressTqdm._bytes = self.n
            if self.total and self.total > _DownloadProgressTqdm._total:
                _DownloadProgressTqdm._total = self.total

    def close(self):
        pass

    def refresh(self):
        pass

    def set_description(self, *args, **kwargs):
        pass

    def set_postfix(self, *args, **kwargs):
        pass

    def set_postfix_str(self, *args, **kwargs):
        pass

    def set_transfer_postfix_str(self, *args, **kwargs):
        pass

    def set_description_str(self, *args, **kwargs):
        pass

    @property
    def format_dict(self):
        return {"n": self.n, "total": self.total, "rate": None}

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


def _poll_download_progress(model_id: str, stop_event: threading.Event):
    """Poll tqdm progress every 0.5s and update _download_progress."""
    while not stop_event.is_set():
        with _DownloadProgressTqdm._lock:
            n = _DownloadProgressTqdm._bytes
            total = _DownloadProgressTqdm._total
        if total > 0:
            pct = min(n / total * 100, 99)
            mb_done = n / (1024 * 1024)
            mb_total = total / (1024 * 1024)
            _set_progress(model_id, "downloading", pct,
                          f"{mb_done:.1f} MB / {mb_total:.1f} MB")
        stop_event.wait(0.5)


def _download_model(model: ModelInfo):
    """Download model in background thread."""
    config = get_config()
    root = config.root
    target_dir = root / model.directory

    _set_progress(model.id, "downloading", 0, f"Starting download of {model.name}...")

    try:
        if model.download_source == "pip":
            _set_progress(model.id, "ready", 100, "Model auto-downloads on first transcription")
            return

        if model.download_source == "huggingface":
            # Reset progress tracker
            with _DownloadProgressTqdm._lock:
                _DownloadProgressTqdm._bytes = 0
                _DownloadProgressTqdm._total = 0

            # Start polling thread (updates every 0.5s)
            stop = threading.Event()
            poller = threading.Thread(
                target=_poll_download_progress,
                args=(model.id, stop),
                daemon=True,
            )
            poller.start()

            # Download (blocking — tqdm captures bytes)
            from huggingface_hub import snapshot_download
            snapshot_download(
                model.download_url,
                local_dir=str(target_dir),
                tqdm_class=_DownloadProgressTqdm,
            )

            stop.set()
            poller.join(timeout=2)

            # Show verifying state
            _set_progress(model.id, "installing", 95, "Verifying installation...")
            time.sleep(1.5)

            # Verify actual model files were downloaded
            _MODEL_EXTENSIONS = {".pt", ".bin", ".onnx", ".safetensors", ".keras", ".h5"}
            if target_dir.exists():
                model_files = [f for f in target_dir.rglob("*") if f.is_file() and f.suffix in _MODEL_EXTENSIONS]
                if not model_files:
                    _set_progress(model.id, "error", 0, "Download completed but no model files found")
                    return

            _set_progress(model.id, "ready", 100, f"{model.name} installed successfully")
            return

        _set_progress(model.id, "manual", 0, f"Manual download required: {model.download_url}")

    except Exception as exc:
        _set_progress(model.id, "error", 0, f"Download failed: {exc}")


# ── API Endpoints ──────────────────────────────────────────────────

class ModelStatusResponse(BaseModel):
    id: str
    name: str
    description: str
    directory: str
    size_mb: int
    download_source: str
    download_url: str
    download_command: str
    required: bool
    installed: bool
    size_on_disk: int
    download_status: str = "idle"
    download_progress: float = 0
    download_message: str = ""


@router.get("/status")
async def model_status():
    """Get status of all models."""
    models = _scan_models()
    result = []
    for m in models:
        progress = _get_progress(m.id)
        result.append(ModelStatusResponse(
            id=m.id,
            name=m.name,
            description=m.description,
            directory=m.directory,
            size_mb=m.size_mb,
            download_source=m.download_source,
            download_url=m.download_url,
            download_command=m.download_command,
            required=m.required,
            installed=m.installed,
            size_on_disk=m.size_on_disk,
            download_status=progress["status"],
            download_progress=progress["progress"],
            download_message=progress["message"],
        ))
    return {"models": [r.model_dump() for r in result]}


@router.post("/download/{model_id}")
async def download_model(model_id: str):
    """Start downloading a model (background)."""
    models = _scan_models()
    model = next((m for m in models if m.id == model_id), None)
    if not model:
        return {"success": False, "error": f"Model '{model_id}' not found"}

    if model.installed:
        return {"success": True, "message": f"{model.name} is already installed"}

    progress = _get_progress(model_id)
    if progress["status"] == "downloading":
        return {"success": True, "message": "Download already in progress"}

    # Start background download
    thread = threading.Thread(target=_download_model, args=(model,), daemon=True)
    thread.start()

    return {"success": True, "message": f"Download started for {model.name}"}


@router.get("/progress/{model_id}")
async def download_progress(model_id: str):
    """Get download progress for a specific model."""
    progress = _get_progress(model_id)
    return progress


@router.delete("/{model_id}")
async def delete_model(model_id: str):
    """Delete a downloaded model to free space."""
    config = get_config()
    models = _scan_models()
    model = next((m for m in models if m.id == model_id), None)
    if not model:
        return {"success": False, "error": f"Model '{model_id}' not found"}

    if not model.installed:
        return {"success": False, "error": f"{model.name} is not installed"}

    target_dir = config.root / model.directory
    if target_dir.exists():
        shutil.rmtree(target_dir)
        return {"success": True, "message": f"{model.name} deleted"}

    return {"success": False, "error": "Directory not found"}
