"""M7 module 3: reading order, confidence attribution, layout guards.

Pure data operations on `Panel` lists — the shared normalization layer used by
detection (module 2), correction (module 5) and the API (module 6). No image
bytes, no I/O. Mirrors the `panel-model` philosophy: frozen data, pure
functions, loud failures (`ManhwaError` for any invalid layout).
"""

from __future__ import annotations

import math
from dataclasses import replace

from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.panels import Panel

_CERTAIN = 1.0


def order_panels(panels: list[Panel]) -> list[Panel]:
    """Sort into natural top→bottom reading order and renumber `order` 1..n.

    Sort key is (y, x) ascending (single-column strips sort on y; a future
    multi-column layout reads left-to-right within a band). Boxes, ids,
    confidence and `user_corrected` are untouched — never a silent edit.
    """
    ordered = sorted(panels, key=lambda p: (p.y, p.x))
    return [replace(p, order=i + 1) for i, p in enumerate(ordered)]


def attribute_confidence(panels: list[Panel], boundary_confidences: list[float | None]) -> list[Panel]:
    """Attach each panel a confidence equal to its two bounding boundaries' min.

    `boundary_confidences` must have exactly `len(panels) + 1` entries:
    index 0 = source top edge, index n = source bottom edge, index i (1..n-1)
    = the cut separating panel i-1 from panel i. `None` means a certain
    boundary (source edge) → 1.0. Returns new Panels with confidence replaced.
    """
    if len(boundary_confidences) != len(panels) + 1:
        raise ValueError(
            f"boundary_confidences must have len(panels)+1={len(panels) + 1} entries, "
            f"got {len(boundary_confidences)}"
        )
    bounds = [_certain_confidence(b) for b in boundary_confidences]
    return [
        replace(panel, confidence=min(bounds[i], bounds[i + 1]))
        for i, panel in enumerate(panels)
    ]


def guard_layout(panels: list[Panel]) -> list[Panel]:
    """Validate a layout: non-empty, unique ids, no positive-area box overlap.

    Touching edges (adjacent tiling) are fine; identical or nested boxes are
    overlaps. Returns the normalized (ordered, renumbered) list — idempotent.
    """
    if not panels:
        raise ManhwaError("panel list must not be empty")
    ids = [p.id for p in panels]
    if len(ids) != len(set(ids)):
        raise ManhwaError("panel ids must be unique")
    for i, a in enumerate(panels):
        for b in panels[i + 1 :]:
            if _boxes_overlap(a, b):
                raise ManhwaError(f"panels {a.id!r} and {b.id!r} overlap")
    return order_panels(panels)


def _boxes_overlap(a: Panel, b: Panel) -> bool:
    """Positive-area intersection of two axis-aligned boxes (touching = no)."""
    return (
        a.x < b.x + b.w
        and b.x < a.x + a.w
        and a.y < b.y + b.h
        and b.y < a.y + a.h
    )


def _certain_confidence(value: float | None) -> float:
    if value is None:
        return _CERTAIN
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("boundary confidence must be a number or None")
    if math.isnan(value):
        raise ValueError("boundary confidence must not be NaN")
    return float(value)