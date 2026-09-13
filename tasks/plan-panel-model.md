# Plan — M7 module 1: panel-model

Single pure-data slice, TDD (RED → GREEN → refactor), committed after full
backend regression.

## Task 1 (slice 1) — Panel model + math + registry
- `backend/src/lava_backend/manhwa/panels.py`:
  - `Panel` frozen dataclass + `validate_panel`/`make_panel` (span/bounds/
    confidence/order/id checks).
  - `analysis_scale`, `map_bounds_to_source` (deterministic floor rounding,
    clamp to bounds), `source_rect`.
  - `asset_name`/`id_for_asset`/`asset_for_id` (zero-padded naming).
  - `StripRegistry` (`save` atomic temp+rename, `load` validated, `reset`
    preserves sourceFile, corrupt/unknown-version → `ManhwaError`).
  - `ManhwaError` in `backend/src/lava_backend/errors.py` (or manhwa/errors.py).
- `backend/tests/test_manhwa_panels.py` — RED first:
  - Panel construction valid/invalid matrix.
  - `analysis_scale`/`map_bounds_to_source` rounding + clamping round-trips.
  - `asset_name` padding 1/9/10/100 + id↔asset inversion.
  - `StripRegistry` save/load round-trip, atomic write, corrupt/unknown-version
    → `ManhwaError`, reset preserves sourceFile.
- Verify: `uv run pytest tests/test_manhwa_panels.py` green → full
  `uv run pytest` green (245 + new).
- Commit (e.g. "m7 panel-model: Panel + scaling + registry (backend N)", etc).