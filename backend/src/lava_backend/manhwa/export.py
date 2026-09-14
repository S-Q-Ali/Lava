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
from typing import Iterator, Literal

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


def normalize_panels(panels: list[Panel]) -> list[Panel]:
    """Validate + order panels into the export reading sequence.

    Empty/duplicate/overlapping layouts raise ``ManhwaError``; the **`order`
    field is the sequencing authority**, so the result is always in 1..n
    order-field sequence (module 5 corrections reorder by it).
    """
    if not panels:
        raise ManhwaError("panel list must not be empty")
    sequence = sorted(panels, key=lambda p: (p.order, p.y, p.x))
    return normalize_layout(sequence)


def _iter_files(
    source: Image.Image,
    ordered: list[Panel],
    *,
    fmt: Format,
    quality: int,
) -> Iterator[tuple[str, bytes]]:
    """Lazily crop + encode one export file pair (name, bytes) at a time.

    Only one panel's payload exists in memory at any instant, so large exports
    never accumulate the full collection before zip/pack generation.
    """
    total = len(ordered)
    for panel in ordered:
        yield (
            _export_name(panel.order, total, fmt),
            encode_panel(crop_panel(source, panel), fmt=fmt, quality=quality),
        )


def iter_export_files(
    source: Image.Image,
    panels: list[Panel],
    *,
    fmt: Format = "png",
    quality: int = JPG_QUALITY_DEFAULT,
) -> Iterator[tuple[str, bytes]]:
    """Lazy (name, bytes) stream over the whole export; order is normalized."""
    yield from _iter_files(source, normalize_panels(panels), fmt=fmt, quality=quality)


def materialize_export(
    source: Image.Image,
    panels: list[Panel],
    *,
    fmt: Format = "png",
    quality: int = JPG_QUALITY_DEFAULT,
) -> ExportBundle:
    """Crop + encode all panels into an ordered bundle with its manifest.

    Materializes every file in memory (equivalent to ``list(iter_export_files)
    ``); prefer the iterator when exporting to disk or a stream.
    """
    ordered = normalize_panels(panels)
    return ExportBundle(
        fmt=fmt,
        manifest=manifest_rows(ordered, fmt=fmt),
        files=[
            ExportFile(name=name, data=data)
            for name, data in _iter_files(source, ordered, fmt=fmt, quality=quality)
        ],
    )