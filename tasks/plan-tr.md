# Implementation Plan: `transitions-render` (M4 module 2)

Spec: `docs/SPEC-transitions-render.md`. Backend-only, slices each verified + committed.

### Slice 1 — pure graph builder (media.py, TDD)
- `BetweenSpec`/`EdgeSpec` dataclasses; `xfade_name(type)` mapping (dissolve→fade, fade→fadeblack,
  match→None, wipe/zoom→None + unsupported flag); `build_transition_graph(clips, transitions) ->
  (filter_complex, total_duration)` — fold over adjacent pairs: no-transition/match → nested concat
  label; dissolve/fade → xfade with offset; edges wrap first/last streams with `fade` filter; duration =
  Σdur − ΣD.
- RED first: parity string when empty/all-match equals today's `_filter_complex`; one + two chained
  xfade offsets; edge fade `st`/`d`; mixed pair fold; duration arithmetic; validation errors.
- Verify: `uv run pytest tests/` (new + existing test_render) green.

### Slice 2 — render integration
- `render(..., transitions=())` accepts specs, uses transition graph when present, keeps parity path.
- Tests: two-image dissolve via project-local ffmpeg → duration ≈ d0+d1−D; wipe-between → error.
- Verify: full backend suite green.

### Slice 3 — API contract
- `/api/render` optional `transitions` form field (between/edge JSON); parse + validate → specs;
  `TRANSITION_INVALID` / `TRANSITION_UNSUPPORTED` / `INVALID_BODY` codes.
- Tests (HTTP, real ffmpeg): valid dissolve render 200 + probe duration; wipe 422; bad index 422;
  malformed JSON 422.
- Verify: `uv run pytest tests/test_render.py` green.

### Slice 4 — docs + regression + commit + push
- D-017, ROADMAP M4 tick, FEATURES §4, SESSION_LOG 10, tasks/plan-tr.md + todo ticks, graphify update,
  backend full regression, commit; push on go-ahead.

## Checkpoints
- [x] Spec approved
- [x] After Slice 3: HTTP e2e involves a real dissolve render; full backend green (~78 tests)
- [x] After Slice 4: docs + graph + commit; push pending go-ahead

## Risks
| Risk | Mitigation |
|---|---|
| Nested concat+xfade graph invalid for ffmpeg | Integration test renders a real mixed graph before committing |
| xfade offset drift with multiple transitions | Pure unit tests assert exact formula; integration probes final duration |
| Render tests are slow (real ffmpeg) | Graph math stays pure; only 2-3 integration cases hit ffmpeg |