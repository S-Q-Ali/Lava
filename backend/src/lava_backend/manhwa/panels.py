"""Manhwa data model, coordinate mapping and strip registry.

M7 module 1 (`panel-model`): pure data + math, no image processing.
Analysis coordinates from `panel-detection` are always mapped back to source
resolution by this module before storage.
"""

from __future__ import annotations

import json
import math
import os
import tempfile
from dataclasses import dataclass, fields
from pathlib import Path
from typing import Any

from lava_backend.manhwa.errors import ManhwaError

REGISTRY_VERSION = 1
DEFAULT_MAX_WIDTH = 512


@dataclass(frozen=True)
class Panel:
    id: str
    source_id: str
    x: int
    y: int
    w: int
    h: int
    confidence: float
    order: int
    user_corrected: bool


def make_panel(
    *,
    id: str,
    source_id: str,
    x: int,
    y: int,
    w: int,
    h: int,
    order: int,
    source_w: int,
    source_h: int,
    confidence: float = 1.0,
    user_corrected: bool = False,
) -> Panel:
    if not id:
        raise ValueError("panel id must be non-empty")
    if not source_id:
        raise ValueError("source id must be non-empty")
    if not isinstance(confidence, (int, float)) or isinstance(confidence, bool):
        raise ValueError("confidence must be a number")
    if math.isnan(confidence):
        raise ValueError("confidence must not be NaN")
    if w <= 0 or h <= 0:
        raise ValueError("panel span w/h must be > 0")
    if x < 0 or y < 0:
        raise ValueError("panel offset x/y must be >= 0")
    if x + w > source_w or y + h > source_h:
        raise ValueError("panel bounds must stay inside the source image")
    if int(order) != order or order < 1:
        raise ValueError("order must be an integer >= 1")
    return Panel(
        id=id,
        source_id=source_id,
        x=x,
        y=y,
        w=w,
        h=h,
        confidence=max(0.0, min(1.0, float(confidence))),
        order=int(order),
        user_corrected=bool(user_corrected),
    )


def panel_to_dict(panel: Panel) -> dict[str, Any]:
    return {
        "id": panel.id,
        "sourceId": panel.source_id,
        "x": panel.x,
        "y": panel.y,
        "w": panel.w,
        "h": panel.h,
        "confidence": panel.confidence,
        "order": panel.order,
        "userCorrected": panel.user_corrected,
    }


def panel_from_dict(record: dict[str, Any], *, source_w: int, source_h: int) -> Panel:
    if not isinstance(record, dict):
        raise ValueError("panel record must be a dict")
    return make_panel(
        id=_expect_str(record, "id"),
        source_id=_expect_str(record, "sourceId"),
        x=_expect_int(record, "x"),
        y=_expect_int(record, "y"),
        w=_expect_int(record, "w"),
        h=_expect_int(record, "h"),
        confidence=_expect_float(record, "confidence"),
        order=_expect_int(record, "order"),
        user_corrected=bool(record.get("userCorrected", False)),
        source_w=source_w,
        source_h=source_h,
    )


def _expect_str(record: dict[str, Any], key: str) -> str:
    value = record.get(key)
    if not isinstance(value, str):
        raise ValueError(f"panel field {key!r} must be a string")
    return value


def _expect_int(record: dict[str, Any], key: str) -> int:
    value = record.get(key)
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"panel field {key!r} must be an integer")
    return value


def _expect_float(record: dict[str, Any], key: str) -> float:
    value = record.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"panel field {key!r} must be a number")
    return float(value)


def validate_panels(panels: list[Panel]) -> None:
    ids = [p.id for p in panels]
    if len(ids) != len(set(ids)):
        raise ValueError("panel ids must be unique within a strip")
    if panels:
        if [p.order for p in panels] != sorted(p.order for p in panels):
            raise ValueError("panel order must be strictly increasing")


def analysis_scale(source_w: int, source_h: int, max_width: int = DEFAULT_MAX_WIDTH) -> tuple[int, int, float]:
    """Downscale factor for the detection analysis image.

    Returns `(ana_w, ana_h, factor)` where factor = source_h / ana_h (source px
    per analysis px). Identity when the source is already ≤ max_width.
    Deterministic: ana_h is floored.
    """
    if source_w <= 0 or source_h <= 0 or max_width <= 0:
        raise ValueError("analysis_scale needs positive widths/heights")
    if source_w <= max_width:
        return source_w, source_h, 1.0
    ana_w = max_width
    ana_h = max(1, math.floor(source_h * max_width / source_w))
    return ana_w, ana_h, source_h / ana_h


def map_cut_to_source(cut: int, *, src_h: int, ana_h: int) -> int:
    """Map one analysis-space cut/side to source-space, bilinear anchor, clamped."""
    return _map_line(cut, src_h, ana_h)


def map_bounds_to_source(
    x: int,
    y: int,
    w: int,
    h: int,
    *,
    src_w: int,
    ana_w: int,
    src_h: int,
    ana_h: int,
) -> tuple[int, int, int, int]:
    """Map an analysis-space box to source space (bilinear anchor, clamped)."""
    x1 = _map_line(x, src_w, ana_w)
    x2 = _map_line(x + w, src_w, ana_w)
    y1 = _map_line(y, src_h, ana_h)
    y2 = _map_line(y + h, src_h, ana_h)
    return x1, y1, max(0, x2 - x1), max(0, y2 - y1)


def boxes_from_cuts(top: int, bottom: int, *, left: int, right: int) -> tuple[int, int, int, int]:
    """Derive a source-space box from already-mapped cut lines (seam-free)."""
    if bottom < top:
        raise ValueError("bottom cut must be >= top cut")
    if right < left:
        raise ValueError("right cut must be >= left cut")
    return left, top, right - left, bottom - top


def _map_line(coord: int, src: int, ana: int) -> int:
    """Bilinear-anchor a single coordinate: round, then clamp to [0, src]."""
    if ana <= 0:
        raise ValueError("analysis dimension must be > 0")
    mapped = int(round(coord * src / ana))
    return max(0, min(src, mapped))


def asset_name(order: int, total: int) -> str:
    """Zero-padded asset file name, e.g. `panel_001.png`. Width = len(str(total))."""
    if order < 1 or total < 1 or order > total:
        raise ValueError("order/total must satisfy 1 <= order <= total")
    width = len(str(total))
    return f"panel_{order:0{width}d}.png"


def id_for_asset(asset: str) -> str:
    """Default id ↔ asset mapping: `panel_003.png` → `p3`. Ids are stable; asset
    file names may be renumbered at export, so this inversion is a default only."""
    stem = asset
    if stem.endswith(".png"):
        stem = stem[: -len(".png")]
    prefix = "panel_"
    if stem.startswith(prefix) and stem[len(prefix):].isdigit():
        return "p" + str(int(stem[len(prefix):]))
    return stem


def asset_for_id(panel_id: str, total: int) -> str:
    if not panel_id.startswith("p") or not panel_id[1:].isdigit():
        raise ValueError(f"can't derive asset name from id {panel_id!r}")
    return asset_name(int(panel_id[1:]), total)


class StripRegistry:
    """Git-clean on-disk registry for one source strip (`cache/manhwa/<id>/`)."""

    def __init__(
        self,
        *,
        path: Path | str,
        source_id: str,
        source_file: str,
        width: int,
        height: int,
        mime: str,
        panels: list[Panel],
    ) -> None:
        self.path = Path(path)
        self.source_id = source_id
        self.source_file = source_file
        self.width = width
        self.height = height
        self.mime = mime
        self.panels = list(panels)

    # -- write ---------------------------------------------------------------

    def save(self) -> None:
        payload = {
            "version": REGISTRY_VERSION,
            "sourceId": self.source_id,
            "sourceFile": self.source_file,
            "width": self.width,
            "height": self.height,
            "mime": self.mime,
            "panels": [panel_to_dict(p) for p in self.panels],
        }
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=self.path.parent, suffix=".tmp", prefix="registry-")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(payload, fh, ensure_ascii=False, indent=2)
            os.replace(tmp, self.path)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)

    def reset_panels(self) -> None:
        self.panels = []

    # -- read ----------------------------------------------------------------

    @classmethod
    def load(cls, path: Path | str) -> "StripRegistry":
        path = Path(path)
        if not path.exists():
            raise ManhwaError(f"registry not found at {path}")
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            raise ManhwaError(f"registry {path} is corrupt ({exc})") from exc
        if not isinstance(payload, dict) or payload.get("version") != REGISTRY_VERSION:
            raise ManhwaError(
                f"registry {path} has unsupported version "
                f"{payload.get('version') if isinstance(payload, dict) else '?'} (need {REGISTRY_VERSION})"
            )
        try:
            source_w = _expect_int(payload, "width")
            source_h = _expect_int(payload, "height")
            panels = [
                panel_from_dict(record, source_w=source_w, source_h=source_h)
                for record in payload.get("panels", [])
            ]
            validate_panels(panels)
            return cls(
                path=path,
                source_id=_expect_str(payload, "sourceId"),
                source_file=_expect_str(payload, "sourceFile"),
                width=source_w,
                height=source_h,
                mime=_expect_str(payload, "mime"),
                panels=panels,
            )
        except ValueError as exc:
            raise ManhwaError(f"registry {path} failed validation: {exc}") from exc

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, StripRegistry):
            return NotImplemented
        for f in fields(StripRegistry):
            if getattr(self, f.name) != getattr(other, f.name):
                return False
        return True