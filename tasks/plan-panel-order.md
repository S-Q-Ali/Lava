# Plan — M7 module 3: panel-order (pure normalization layer)

Three TDD slices; each ends backend-green and committed.

## Slice 1 — order_panels + attribute_confidence + guard_layout (pure)
- `backend/src/lava_backend/manhwa/order.py` (new): `order_panels`,
  `attribute_confidence`, `guard_layout`, `_boxes_overlap`.
- `backend/tests/test_manhwa_order.py` (new): reading order/renumbering,
  confidence via min-of-boundaries, overlap/duplicate/interleave guards.
- Errors: `ManhwaError` for layout violations (agreeing with D-027), list
  mismatches for confidence attribution.

## Slice 2 — detect wiring (single source of truth)
- `detect.build_panels` delegates to `attribute_confidence(order_panels(raw),
  boundaries)`; slice-2 detect tests stay green untouched; add a wiring test
  asserting delegated output matches the previous behavior for the fixtures.
- Full regression (312 + new).

## Slice 3 — docs + graphify + regression + push gate
- D-029 in DECISIONS.md, ROADMAP module-3 done, FEATURES §7 shipped block,
  SESSION_LOG 22, todo tick; reconcile SPEC-panel-model/SPEC-panel-detection
  notes that referenced ordering; `graphify update .`; `uv sync --extra dev &&
  uv run pytest`; push on go-ahead.