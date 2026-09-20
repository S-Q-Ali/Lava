"""Caption export endpoints — SRT, VTT, ASS download."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from .captions_engine.generators import (
    generate_srt_from_captions,
    generate_vtt_from_captions,
)

router = APIRouter(prefix="/api/captions", tags=["captions"])

SUPPORTED_FORMATS = ["srt", "vtt", "ass"]


class CaptionEntry(BaseModel):
    start: float = Field(..., ge=0)
    duration: float = Field(..., gt=0)
    text: str = Field(..., min_length=1)


class CaptionExportRequest(BaseModel):
    captions: list[CaptionEntry]
    format: str = Field(default="srt", description="srt|vtt")


@router.post("/export")
async def export_captions(req: CaptionExportRequest):
    """Export captions as SRT or VTT format."""
    if req.format not in ("srt", "vtt"):
        from .errors import ApiError
        raise ApiError(422, "UNSUPPORTED_FORMAT", f"Format '{req.format}' not supported. Use srt or vtt.")

    caption_dicts = [
        {"start": c.start, "duration": c.duration, "text": c.text}
        for c in req.captions
    ]

    if req.format == "vtt":
        content = generate_vtt_from_captions(caption_dicts)
        media_type = "text/vtt"
        filename = "captions.vtt"
    else:
        content = generate_srt_from_captions(caption_dicts)
        media_type = "application/x-subrip"
        filename = "captions.srt"

    return PlainTextResponse(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/formats")
async def list_formats():
    """List supported caption export formats."""
    return {"formats": SUPPORTED_FORMATS}
