"""M7 module 4: full-resolution panel export (PNG lossless default, JPG).

Pure generation from the original strip: crop each source-space panel box at
original resolution (never resampled), encode PNG (lossless) or JPG, and pair
them with a manifest in reading order. Normalization is delegated to the
panel-order module (D-029) so every export is a clean 1..n collection no
matter how the panel list arrived. HTTP wiring lands in `manhwa-api` (module 6).
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Literal

from PIL import Image

from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.order import normalize_layout
from lava_backend.manhwa.panels import Panel, asset_name

Format = Literal["png", "jpg"]
JPG_QUALITY_DEFAULT = 92
_SUFFIX = {"png": ".png", "jpg": ".jpg"}


def _export_name(order: int, total: int, fmt: Format) -> str:
    """Asset-stable file name for an export: `panel_###` + format suffix."""
    return asset_name(order, total).replace(".png", _SUFFIX[fmt])


@dataclass(frozen=True)
class ExportFile:
    name: str
    data: bytes


@dataclass(frozen=True)
class ExportBundle:
    fmt: str
    manifest: list[dict]
    files: list[ExportFile]


def crop_panel(source: Image.Image, panel: Panel) -> Image.Image:
    """Original-resolution crop for one panel (box already clamped to source)."""
    return source.crop((panel.x, panel.y, panel.x + panel.w, panel.y + panel.h))


def encode_panel(
    image: Image.Image,
    *,
    fmt: Format,
    quality: int = JPG_QUALITY_DEFAULT,
) -> bytes:
    """Encode one panel image: PNG lossless, or JPEG at `quality` (1..100)."""
    if fmt == "png":
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()
    if fmt == "jpg":
        if isinstance(quality, bool) or not isinstance(quality, int) or not (1 <= quality <= 100):
            raise ValueError("jpg quality must be an integer in 1..100")
        frame = image.convert("RGB") if image.mode != "RGB" else image
        buffer = BytesIO()
        frame.save(buffer, format="JPEG", quality=quality)
        return buffer.getvalue()
    raise ValueError(f"unsupported export format {fmt!r} (png|jpg)")


def manifest_rows(panels: list[Panel], *, fmt: Format) -> list[dict]:
    """One manifest entry per panel (already in reading order)."""
    total = len(panels)
    return [
        {
            "file": _export_name(panel.order, total, fmt),
            "id": panel.id,
            "order": panel.order,
            "x": panel.x,
            "y": panel.y,
            "w": panel.w,
            "h": panel.h,
            "width": panel.w,
            "height": panel.h,
            "confidence": panel.confidence,
        }
        for panel in panels
    ]


def materialize_export(
    source: Image.Image,
    panels: list[Panel],
    *,
    fmt: Format = "png",
    quality: int = JPG_QUALITY_DEFAULT,
) -> ExportBundle:
    """Crop + encode all panels into an ordered bundle with its manifest.

    Panels are normalized through `normalize_layout`: empty/duplicate/overlapping
    layouts raise `ManhwaError`; the **`order` field is the sequencing
    authority** (module 5 corrections reorder by it), so the returned files
    and manifest are always in 1..n order-field sequence.
    """
    if not panels:
        raise ManhwaError("panel list must not be empty")
    sequence = sorted(panels, key=lambda p: (p.order, p.y, p.x))
    ordered = normalize_layout(sequence)
    total = len(ordered)
    files = [
        ExportFile(
            name=_export_name(panel.order, total, fmt),
            data=encode_panel(crop_panel(source, panel), fmt=fmt, quality=quality),
        )
        for panel in ordered
    ]
    return ExportBundle(fmt=fmt, manifest=manifest_rows(ordered, fmt=fmt), files=files)