# SPEC — M7 module 3: `panel-order`

## Objective

Pure-data normalization shared by every later consumer (correction, API, UI):
given a `Panel` list, guarantee (a) natural **top→bottom reading order** with
renumbered `order`, (b) **confidence attribution** from per-boundary evidence,
(c) a **duplicate/overlap guard** on the resulting layout. No image bytes, no
I/O — mirrors the module-1 `panel-model` philosophy.

Module 2's `build_panels` already emits ordered, faithfully-tiled panels; this
module formalizes those invariants into single-source helpers so module 5
(correction ops) and module 6 (API persistence) normalize exactly the same way
after every manual edit.

## Commands

```
Test:       uv run pytest tests/test_manhwa_order.py -q
Regression: uv run pytest
```

## Functions (`manhwa/order.py`)

```
order_panels(panels: list[Panel]) -> list[Panel]
    sort ascending by (y, x), renumber order = 1..n. Boxes, ids, confidence
    and user_corrected are untouched (never a silent edit).

attribute_confidence(panels, boundary_confidences) -> list[Panel]
    panels must already be in reading order. boundary_confidences has
    len(panels) + 1 entries: index 0 = source top edge, index n = source
    bottom edge; entry i (1..n-1) = confidence of the cut separating panel
    i-1 from panel i. None means "certain boundary" → 1.0. Panel i confidence
    = min(boundaries[i], boundaries[i+1]).
    Returns new Panels with confidence replaced (frozen dataclass).

guard_layout(panels) -> list[Panel]
    raise ManhwaError on: empty list, duplicate ids, any two panels with a
    positive-area box intersection, or interleaved vertical regions.
    Touching edges (adjacent tiling) are fine. Returns the normalized
    (ordered, renumbered) list — idempotent.
```

Internal helpers: `_boxes_overlap(a, b) -> bool`, `_renumber(panels)`.

Errors: `ManhwaError` (data-level contract, consistent with D-027/D-028); no
`ValueError` divergence for layout violations.

## Wire-in (slice 2)

`detect.build_panels` delegates: build raw incident panels from mapped cut
lines (as today), then return `attribute_confidence(order_panels(raw),
boundaries)`. Boundary confidences derived from the same mapped lines (source
edges = 1.0). Output must stay byte-identical for the current fixtures —
existing `test_manhwa_detect.py` suites stay green untouched.

## Testing (TDD)

- `order_panels`: shuffled input → reading order with renumbered order; boxes
  and flags preserved; ties broken by x; already-ordered input is identity
  (stable); `user_corrected` preserved.
- `attribute_confidence`: all-edge boundaries → 1.0; all clean (0.95); rescue
  (0.35) between clean bounds the middle panel at 0.35, outer panels at 0.95;
  None mixed with numbers; len mismatch → `ValueError`.
- `guard_layout`: empty → `ManhwaError`; duplicate id → `ManhwaError`;
  overlapping boxes (positive area) → `ManhwaError`; interleaved regions →
  `ManhwaError`; adjacent (touching) tiling passes; valid layout normalizes to
  ordered 1..n; idempotent on already-valid input.
- Detect identity: `build_panels` output unchanged for all 12 fixtures;
  `detect_strip` panels equal previous behavior.

## Boundaries

- Always: pure functions, frozen data, deterministic; `user_corrected` never
  flipped.
- Ask first: introducing x-ordering heuristics for multi-column pages (M8),
  gap-filling or coverage enforcement (correction may legitimately leave
  gaps).
- Never: touch panel boxes during ordering; silently drop panels; write
  registry state.

## Success criteria

- Backend suite green (312 + new order tests).
- All order tests RED→GREEN committed per slice.
- `build_panels` delegated without behavioral drift.