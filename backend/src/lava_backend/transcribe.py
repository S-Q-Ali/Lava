from pathlib import Path

from fastapi import APIRouter, File, Form, Request, UploadFile

from lava_backend.errors import ApiError
from lava_backend.transcribe_core import confidence_from_logprob, detect_pauses
from lava_backend.transcribers import Segment, Transcription

router = APIRouter()

PAUSE_THRESHOLD_DEFAULT = 0.3


def serialize_segment(segment: Segment) -> dict:
    words = [
        {
            "word": word.get("word", ""),
            "start": word.get("start", segment.start),
            "end": word.get("end", segment.end),
            "confidence": word.get("confidence") or confidence_from_logprob(segment.avg_logprob),
        }
        for word in segment.words
    ]
    return {
        "id": segment.id,
        "text": segment.text,
        "start": segment.start,
        "end": segment.end,
        "avgLogprob": segment.avg_logprob,
        "confidence": confidence_from_logprob(segment.avg_logprob),
        "words": words,
    }


def serialize(transcription: Transcription) -> dict:
    return {
        "text": transcription.text,
        "language": transcription.language,
        "segments": [serialize_segment(segment) for segment in transcription.segments],
        "pauses": [
            {"start": pause.start, "end": pause.end, "gap": pause.gap}
            for pause in detect_pauses(
                transcription.words,
                pause_threshold=PAUSE_THRESHOLD_DEFAULT,
            )
        ],
    }


@router.post("/transcribe", status_code=200)
async def transcribe(
    request: Request,
    file: UploadFile | None = File(default=None),
    language: str | None = Form(default=None),
) -> dict:
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

    transcriber = request.app.state.transcriber
    try:
        result = transcriber.transcribe(str(path), language=language)
    except Exception:
        raise ApiError(
            422,
            "TRANSCRIBE_FAILED",
            "Narration analysis failed. The file may be corrupted or unsupported.",
        )
    finally:
        path.unlink(missing_ok=True)

    return serialize(result)