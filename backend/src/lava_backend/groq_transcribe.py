"""Groq Whisper transcription — cloud-based, fast, free tier."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, File, Form, Request, UploadFile

from lava_backend.errors import ApiError
from lava_backend.transcribe_core import confidence_from_logprob, detect_pauses
from lava_backend.transcribers import Segment, Transcription

router = APIRouter()

PAUSE_THRESHOLD_DEFAULT = 0.3

SUPPORTED_MODELS = [
    "whisper-large-v3",
    "whisper-large-v3-turbo",
    "whisper-medium",
    "whisper-small",
    "whisper-base",
    "whisper-tiny",
]


def _get_api_key(requested_key: str | None = None) -> str:
    key = requested_key or os.environ.get("GROQ_API_KEY", "")
    if not key:
        raise ApiError(
            422,
            "NO_GROQ_API_KEY",
            "No Groq API key. Set GROQ_API_KEY env var or pass api_key.",
        )
    return key


def _parse_groq_response(data: dict, language: str | None) -> Transcription:
    """Parse Groq Whisper API response into our Transcription model."""
    segments: list[Segment] = []
    for index, seg in enumerate(data.get("segments", [])):
        words: list[dict] = []
        for w in seg.get("words", []):
            words.append({
                "word": w.get("word", ""),
                "start": w.get("start", seg.get("start", 0)),
                "end": w.get("end", seg.get("end", 0)),
                "confidence": w.get("probability", 1.0),
            })
        segments.append(
            Segment(
                id=index,
                text=seg.get("text", ""),
                start=seg.get("start", 0),
                end=seg.get("end", 0),
                avg_logprob=seg.get("avg_logprob", -1.0),
                words=words,
            )
        )

    detected_lang = data.get("language") or language or "en"
    return Transcription(language=detected_lang, segments=segments)


def _call_groq_transcribe(
    api_key: str,
    file_path: str,
    model: str = "whisper-large-v3",
    language: str | None = None,
) -> dict:
    """Call Groq Whisper API via the groq SDK."""
    from groq import Groq

    client = Groq(api_key=api_key)

    with open(file_path, "rb") as audio_file:
        result = client.audio.transcriptions.create(
            file=(Path(file_path).name, audio_file),
            model=model,
            language=language if language else None,
            response_format="verbose_json",
            timestamp_granularities=["word", "segment"],
        )

    return result.model_dump() if hasattr(result, "model_dump") else dict(result)


@router.post("/transcribe-groq", status_code=200)
async def transcribe_groq(
    request: Request,
    file: UploadFile | None = File(default=None),
    language: str | None = Form(default=None),
    model: str | None = Form(default=None),
    api_key: str | None = Form(default=None),
) -> dict:
    """Transcribe audio using Groq Whisper API (cloud, fast, free tier)."""
    if file is None:
        raise ApiError(400, "NO_FILE", "Add an audio file to analyze.")

    name = file.filename or "upload"
    path = request.app.state.tmp_dir / Path(name).name
    try:
        content = await file.read()
        if not content:
            raise ApiError(400, "NO_FILE", "The selected audio file is empty.")
        path.write_bytes(content)
    except ApiError:
        raise
    except Exception:
        raise ApiError(400, "NO_FILE", "The selected audio file could not be read.")

    api_key = _get_api_key(api_key)
    chosen_model = model or "whisper-large-v3"

    if chosen_model not in SUPPORTED_MODELS:
        path.unlink(missing_ok=True)
        raise ApiError(
            422,
            "INVALID_MODEL",
            f"Model '{chosen_model}' not supported. Use one of: {', '.join(SUPPORTED_MODELS)}",
        )

    try:
        groq_response = _call_groq_transcribe(
            api_key=api_key,
            file_path=str(path),
            model=chosen_model,
            language=language if language and language != "auto" else None,
        )
        result = _parse_groq_response(groq_response, language)
    except ApiError:
        raise
    except Exception as exc:
        raise ApiError(
            502,
            "TRANSCRIBE_FAILED",
            f"Groq transcription failed: {exc}",
        )
    finally:
        path.unlink(missing_ok=True)

    return {
        "text": result.text,
        "language": result.language,
        "provider": "groq",
        "model": chosen_model,
        "segments": [
            {
                "id": segment.id,
                "text": segment.text,
                "start": segment.start,
                "end": segment.end,
                "avgLogprob": segment.avg_logprob,
                "confidence": confidence_from_logprob(segment.avg_logprob),
                "words": [
                    {
                        "word": w.get("word", ""),
                        "start": w.get("start", segment.start),
                        "end": w.get("end", segment.end),
                        "confidence": w.get("confidence", 1.0),
                    }
                    for w in segment.words
                ],
            }
            for segment in result.segments
        ],
        "pauses": [
            {"start": pause.start, "end": pause.end, "gap": pause.gap}
            for pause in detect_pauses(
                result.words,
                pause_threshold=PAUSE_THRESHOLD_DEFAULT,
            )
        ],
    }


@router.get("/transcribe-groq/models")
async def list_models():
    """List supported Groq Whisper models."""
    return {"models": SUPPORTED_MODELS}
