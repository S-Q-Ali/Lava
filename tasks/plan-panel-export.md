# Plan — M7 module 4: panel-export (full-res PNG/JPG + manifest)

Three TDD slices; each ends backend-green and committed.

## Slice 1 — crop + encode (pure image ops)
- `backend/src/lava_backend/manhwa/export.py` (new): `crop_panel`,
  `encode_panel` (PNG lossless / JPG quality 1..100).
- `backend/tests/test_manhwa_export.py` (new): crop == source region
  losslessly; PNG round-trip; JPG valid + quality guards.

## Slice 2 — manifest + materialize (guard integration)
- `manifest_rows`, `ExportBundle`, `materialize_export` (normalizes via
  panel-order; ordered files 1..n).
- Tests: shuffled input → ordered manifest/files; empty/overlapping →
  `ManhwaError`; real clean fixture → original-res crops tile the strip;
  JPG suffix switch.

## Slice 3 — docs + graphify + regression + push gate
- D-030 in DECISIONS.md, ROADMAP module-4 done, FEATURES §7 shipped block,
  SESSION_LOG 23, todo tick; `graphify update .`; `uv sync --extra dev &&
  uv run pytest`; push on go-ahead.