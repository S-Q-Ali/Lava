# Plan — M7 module 6: manhwa-api (thick storage/HTTP glue)

Four TDD slices; each ends backend-green and committed.

## Slice 1 — storage helpers + read endpoints
- `backend/src/lava_backend/manhwa/api.py` (new): `SOURCE_ID_RE`, `manhwa_dir`,
  `strip_dir`, `load_registry`, `save_source`, `new_source_id`, router with
  `GET /strips`, `GET /strips/{id}`, `GET /strips/{id}/source`.
- Tests: 404s, path guard, registry round-trips, list metadata + detail
  payload shape.

## Slice 2 — upload + asset serving + delete + redetect + reset
- `POST /strips` (multipart upload → save source → detect_strip save=True,
  201 + detection result); `GET /strips/{id}/panels/{panelId}` (regenerate
  from original); `DELETE /strips/{id}` (204); `POST /strips/{id}/redetect`;
  PATCH op `reset`.
- Tests: valid/landscape/binary uploads; panel bytes == crop; missing id 404;
  delete removes dir; redetect regenerates.

## Slice 3 — correction ops + export
- `PATCH /strips/{id}/panels` (all module-5 ops persisted to the registry —
  split/merge/adjust/delete/add/reorder/reset); `GET /strips/{id}/export`.
- Tests: op round-trips through disk state; 422 on bad op / unknown id /
  overlap; zip contains manifest.json + correct files.

## Slice 4 — docs
- D-032, ROADMAP module 6 ✅ (M7 backend done), FEATURES §7 shipped block,
  SESSION_LOG 25, CONSTRAINTS row bump, todo ticks; `graphify update .`;
  `uv sync --extra dev && uv run pytest`; push on go-ahead.