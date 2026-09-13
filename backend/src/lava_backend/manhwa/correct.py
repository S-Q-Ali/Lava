"""M7 module 5: pure panel correction ops (module 5 slice 2).

Split / Merge / Delete, each returning a normalized sequence (1..n `order`)
whose list order is the user's intent. Edit ops mark the touched panels
`user_corrected=True`, keep ids stable across edits, and never touch the
original image. Validation/renumbering delegates to the panel-order module;
everything stays a pure `list[Panel] -> list[Panel]` here.
"""

from __future__ import annotations

from dataclasses import replace

from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.order import normalize_layout
from lava_backend.manhwa.panels import Panel, make_panel, panel_from_dict


def _require(panels: list[Panel], panel_id: str) -> Panel:
    for panel in panels:
        if panel.id == panel_id:
            return panel
    raise ManhwaError(f"panel {panel_id!r} not found")


def _fresh_id(panels: list[Panel]) -> str:
    taken = {int(p.id[1:]) for p in panels if p.id.startswith("p") and p.id[1:].isdigit()}
    n = 1
    while n in taken:
        n += 1
    return f"p{n}"


def split_panel(panels: list[Panel], panel_id: str, y_split: int) -> list[Panel]:
    """Split one panel horizontally at `y_split` into two stacked panels.

    The top half keeps the panel's id; the bottom half gets a fresh `pN` id.
    Both inherit the parent confidence and are marked `user_corrected`.
    `y_split` must lie strictly inside the panel's vertical extent; any
    out-of-range value or a missing id raises `ManhwaError`.
    """
    panel = _require(panels, panel_id)
    if not (panel.y < y_split < panel.y + panel.h):
        raise ManhwaError(
            f"split y {y_split} must be strictly inside panel {panel_id!r} "
            f"vertical extent [{panel.y}, {panel.y + panel.h})"
        )
    top = replace(panel, h=y_split - panel.y, user_corrected=True)
    bottom = replace(
        panel,
        id=_fresh_id(panels),
        y=y_split,
        h=panel.y + panel.h - y_split,
        user_corrected=True,
    )
    sequence: list[Panel] = []
    for p in panels:
        sequence.append(top if p.id == panel_id else p)
        if p.id == panel_id:
            sequence.append(bottom)
    return normalize_layout(sequence)


def merge_panels(panels: list[Panel], a_id: str, b_id: str) -> list[Panel]:
    """Merge two panels into one (their union box), keeping `a_id`.

    Confidence becomes min of the two; the merged panel is `user_corrected`.
    Raises `ManhwaError` if either id is missing or the union overlaps a
    remaining panel.
    """
    a = _require(panels, a_id)
    b = _require(panels, b_id)
    if a_id == b_id:
        raise ManhwaError("merge needs two distinct panels")
    x = min(a.x, b.x)
    y = min(a.y, b.y)
    right = max(a.x + a.w, b.x + b.w)
    bottom = max(a.y + a.h, b.y + b.h)
    merged = replace(
        a,
        x=x,
        y=y,
        w=right - x,
        h=bottom - y,
        confidence=min(a.confidence, b.confidence),
        user_corrected=True,
    )
    sequence = [p for p in panels if p.id not in (a_id, b_id)] + [merged]
    return normalize_layout(sequence)


def delete_panel(panels: list[Panel], panel_id: str) -> list[Panel]:
    """Delete one panel; remaining panels are renumbered 1..n.

    Deleting the last panel returns an empty list (a valid correction state;
    export still refuses empty layouts).
    """
    _require(panels, panel_id)
    remaining = [p for p in panels if p.id != panel_id]
    return normalize_layout(remaining)


def adjust_panel(
    panels: list[Panel],
    panel_id: str,
    *,
    x: int,
    y: int,
    w: int,
    h: int,
    source_w: int,
    source_h: int,
) -> list[Panel]:
    """Replace one panel's bounds (crop/expand within the source).

    The new box must stay inside `source_w` x `source_h` with positive area
    (`ValueError` otherwise) and not overlap a neighbor (`ManhwaError`).
    """
    panel = _require(panels, panel_id)
    adjusted = make_panel(
        id=panel.id,
        source_id=panel.source_id,
        x=x,
        y=y,
        w=w,
        h=h,
        order=panel.order,
        source_w=source_w,
        source_h=source_h,
        confidence=panel.confidence,
        user_corrected=True,
    )
    return normalize_layout([adjusted if p.id == panel_id else p for p in panels])


def add_panel(
    panels: list[Panel],
    *,
    x: int,
    y: int,
    w: int,
    h: int,
    source_w: int,
    source_h: int,
    after_id: str | None = None,
) -> list[Panel]:
    """Insert a user-defined panel (near-certain: confidence 1.0).

    The new panel gets a fresh `pN` id and `user_corrected=True`; it is placed
    after `after_id` (default: end of the sequence). Its box must fit the
    source (`ValueError`) and not overlap any existing panel (`ManhwaError`).
    """
    added = make_panel(
        id=_fresh_id(panels),
        source_id=panels[0].source_id if panels else "s1",
        x=x,
        y=y,
        w=w,
        h=h,
        order=1,
        source_w=source_w,
        source_h=source_h,
        confidence=1.0,
        user_corrected=True,
    )
    sequence: list[Panel] = []
    for p in panels:
        sequence.append(p)
        if after_id is None:
            continue
        if p.id == after_id:
            sequence.append(added)
    if after_id is None:
        sequence.append(added)
    return normalize_layout(sequence)


def reorder_panels(panels: list[Panel], ordered_ids: list[str]) -> list[Panel]:
    """Apply an explicit reading sequence: ids must be an exact permutation.

    Every panel is re-sequenced in `ordered_ids` order and marked
    `user_corrected` (the whole order is now user-curated). A non-permutation
    (missing, repeated or unknown id) raises `ValueError`.
    """
    by_id = {p.id: p for p in panels}
    if len(ordered_ids) != len(panels) or len(set(ordered_ids)) != len(ordered_ids):
        raise ValueError("reorder ids must be a permutation (same unique count as panels)")
    if not set(ordered_ids) == set(by_id):
        missing = set(by_id) - set(ordered_ids)
        extra = set(ordered_ids) - set(by_id)
        raise ValueError(f"reorder ids mismatch; missing {sorted(missing)}, unknown {sorted(extra)}")
    curated = [replace(by_id[pid], user_corrected=True) for pid in ordered_ids]
    return normalize_layout(curated)


def redetect(source, *, source_id: str) -> list[Panel]:
    """Re-run detection (module 2) and return the fresh, guarded panel list.

    `save=False` — correction decides whether to persist; the API (module 6)
    wires this to the registry. Returns a pure `list[Panel]` in reading order.
    """
    from lava_backend.manhwa.detect import detect_strip

    result = detect_strip(source, source_id=source_id, save=False)
    return [
        panel_from_dict(record, source_w=result["width"], source_h=result["height"])
        for record in result["panels"]
    ]