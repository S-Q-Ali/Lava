# Plan — M7 module 5: panel-correction (pure list ops)

Four TDD slices; each ends backend-green and committed.

## Slice 1 — order-preserving normalization (order.py)
- Add `validate_layout` + `normalize_layout` to `order.py`; `guard_layout`
  becomes `order_panels(validate_layout(...))` (public behavior unchanged).
- Tests: normalize preserves sequence, renumbers, idempotent, [] allowed,
  dup/overlap → ManhwaError; guard regression intact.

## Slice 2 — structural edits (correct.py I)
- `split_panel`, `merge_panels`, `delete_panel` (+ `_require_id`,
  `_fresh_id`). Tests: geometry/ids/confidence/user_corrected per spec;
  delete-to-empty; merge-overlap → ManhwaError.

## Slice 3 — bounds + add + reorder + redetect (correct.py II)
- `adjust_panel`, `add_panel`, `reorder_panels`, `redetect`.
- Tests: bounds/overlap guards, after_id insertion, permutation errors,
  redetect returns guarded reading order.

## Slice 4 — export sequencing + docs
- `materialize_export` re-sequences by `panel.order` (module-4 change).
- D-031 (sequence authority), ROADMAP (module 5 ✅), FEATURES §7 block,
  SESSION_LOG 24, CONSTRAINTS row bump, SPEC cross-ref; `graphify update .`;
  `uv sync --extra dev && uv run pytest`; push on go-ahead.