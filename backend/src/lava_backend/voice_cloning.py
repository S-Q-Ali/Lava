"""Voice cloning — XTTS-v2 text-to-speech with voice reference.

⚠️ HEAVY DOWNLOAD: The XTTS-v2 model (~1.5GB) must be downloaded manually.
The API will return instructions if the model is not found.

Model location: models/xtts-v2/
Download instructions are returned by the /status endpoint.
"""
from __future__ import annotations

import asyncio
import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .config import get_config
from .errors import ApiError

router = APIRouter(prefix="/voiceover", tags=["voice-cloning"])

CLONE_OUTPUT_DIR = Path("voiceover_output")
CLONE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class CloneStatusResponse(BaseModel):
    available: bool
    model_path: str
    model_exists: bool
    message: str
    download_instructions: str = ""


class CloneResult(BaseModel):
    success: bool
    file_id: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[float] = None
    error: Optional[str] = None


def _get_model_path() -> Path:
    return get_config().root / "models" / "xtts-v2"


def _is_model_available() -> bool:
    model_path = _get_model_path()
    if not model_path.exists():
        return False
    # Check for key XTTS-v2 files
    config_file = model_path / "config.json"
    model_file = model_path / "model.pth"
    return config_file.exists() and model_file.exists()


async def _clone_voice_simple(
    text: str,
    reference_audio_path: str,
    output_path: str,
    language: str = "en",
) -> dict:
    """Simplified voice cloning using TTS API."""
    try:
        from TTS.api import TTS as TTSModel
    except ImportError:
        raise RuntimeError(
            "Coqui TTS not installed. Run: pip install TTS"
        )

    tts = TTSModel(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
    tts.tts_to_file(
        text=text,
        speaker_wav=reference_audio_path,
        language=language,
        file_path=output_path,
    )

    import subprocess
    config = get_config()
    probe_cmd = [
        str(config.ffprobe_bin),
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        output_path,
    ]
    probe = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
    duration = float(probe.stdout.strip()) if probe.stdout.strip() else 0.0

    return {"duration": duration}


@router.get("/clone/status", response_model=CloneStatusResponse)
async def clone_status():
    """Check if voice cloning model is available."""
    model_path = _get_model_path()
    available = _is_model_available()
    return CloneStatusResponse(
        available=available,
        model_path=str(model_path),
        model_exists=model_path.exists(),
        message=(
            "Voice cloning is ready."
            if available
            else "XTTS-v2 model not found. Download it manually to models/xtts-v2/"
        ),
        download_instructions=(
            "Option 1 (Recommended): Download from https://huggingface.co/coqui/XTTS-v2\n"
            "Option 2: pip install TTS && tts --model_name tts_models/multilingual/multi-dataset/xtts_v2\n"
            "Option 3: Place model files in models/xtts-v2/ (config.json, model.pth, etc.)"
            if not available
            else ""
        ),
    )


@router.post("/clone", response_model=CloneResult)
async def clone_voice(
    text: str = Form(..., min_length=1, max_length=5000),
    language: str = Form(default="en"),
    reference: UploadFile = File(...),
):
    """Clone a voice from a reference audio sample.

    - text: Text to speak in the cloned voice
    - language: Language code (en, es, fr, de, it, pt, pl, tr, ru, nl, cs, ar, zh-cn, ja, ko, hu, hi)
    - reference: Reference audio file (5-30 seconds recommended)
    """
    if not _is_model_available():
        raise ApiError(
            422,
            "MODEL_NOT_FOUND",
            "XTTS-v2 model not found. Download it manually to models/xtts-v2/. "
            "GET /api/voiceover/clone/status for download instructions.",
        )

    file_id = str(uuid.uuid4())[:12]
    ref_path = None
    out_path = None

    try:
        # Save reference audio
        ref_dir = get_config().cache_dir / "tmp" / file_id
        ref_dir.mkdir(parents=True, exist_ok=True)
        ref_name = reference.filename or "reference.wav"
        ref_path = ref_dir / Path(ref_name).name
        content = await reference.read()
        if not content:
            raise ApiError(400, "EMPTY_FILE", "Reference audio is empty.")
        ref_path.write_bytes(content)

        # Generate output
        out_name = f"clone_{file_id}.wav"
        out_path = CLONE_OUTPUT_DIR / out_name

        result = await asyncio.to_thread(
            _clone_voice_simple, text, str(ref_path), str(out_path), language
        )

        file_size = os.path.getsize(out_path)
        return CloneResult(
            success=True,
            file_id=file_id,
            file_path=str(out_path),
            file_size=file_size,
            duration=result["duration"],
        )
    except ApiError:
        raise
    except Exception as exc:
        raise ApiError(500, "CLONE_FAILED", f"Voice cloning failed: {exc}")
    finally:
        if ref_path:
            ref_path.unlink(missing_ok=True)
            ref_path.parent.rmdir()


@router.post("/clone/download/{file_id}")
async def download_clone(file_id: str):
    """Download a cloned voice file."""
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', file_id):
        raise ApiError(400, "INVALID_ID", "Invalid file ID")
    for f in CLONE_OUTPUT_DIR.iterdir():
        if f.name.startswith(f"clone_{file_id}"):
            return FileResponse(
                path=str(f),
                media_type="audio/wav",
                filename=f.name,
            )
    raise ApiError(404, "NOT_FOUND", "Cloned file not found")
