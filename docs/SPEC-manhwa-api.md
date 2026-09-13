# SPEC — M7 module 6: `manhwa-api`

## Objective

The HTTP surface for the M7 pipeline. Multipart upload + auto-detect, list /
metadata for all strips, per-strip detail, panel correction ops (module 5),
PNG/JPG export bundles (module 4), asset serving, strip delete and reset. All
storage stays project-local under `cache/backend/manhwa/<source_id>/`
(original `source.<ext>`, `registry.json`, eager `panel_*.png` crops written by
`detect_strip`). ApiError semantics match the rest of the sidecar.

## Commands

```
Test:       uv run pytest tests/test_manhwa_api.py -q
Regression: uv run pytest
```

## Routes (mounted at `/api/manhwa`)

| Method | Path | Body/Query | Returns |
|---|---|---|---|
| POST | `/strips` | multipart `file` | detection result (sourceId, analysis, panels, saved) — 201 |
| GET | `/strips` | — | list of strip metadata (sourceId, sourceFile, width, height, mime, panelCount, correctedCount) |
| GET | `/strips/{sourceId}` | — | full registry payload (panels incl. confidence/order/userCorrected) |
| PATCH | `/strips/{sourceId}/panels` | JSON op (see below) | updated registry payload |
| GET | `/strips/{sourceId}/panels/{panelId}` | — | single panel PNG (regenerated from the original at full res) |
| GET | `/strips/{sourceId}/source` | — | original image file |
| GET | `/strips/{sourceId}/export` | `format=png\|jpg`, `quality` | zip: `manifest.json` + `panel_*.png/jpg` |
| DELETE | `/strips/{sourceId}` | — | deletes the whole strip (204) |
| POST | `/strips/{sourceId}/redetect` | — | re-runs detection on the stored source, regenerates crops + registry |

`id` sending is deterministic per environment for tests only via a
`source_id` generator hook (see storage helpers).

## Correction ops (PATCH `/panels`)

Body `{ "op": "...", ... }`; each op maps to the module-5 function and
persists the returned list; `reset` clears the registry's panels. Errors:
unknown op / missing id / bad geometry → `ManhwaError` wrapped as 422
`CORRECTION_FAILED`; `ValueError` → 422 `CORRECTION_INVALID`.

```
{"op":"split","panelId":"p1","y":300}
{"op":"merge","ids":["p1","p2"]}
{"op":"adjust","panelId":"p1","x":0,"y":0,"w":360,"h":200}
{"op":"delete","panelId":"p1"}
{"op":"add","x":0,"y":0,"w":360,"h":200,"afterId":"p2"}           # w/h/… required
{"op":"reorder","ids":["p3","p1","p2"]}
{"op":"reset"}
```

## Storage helpers (`manhwa/api.py`)

```
SOURCE_ID_RE = ^[A-Za-z0-9_-]+$         # path-segment safety
manhwa_dir(config)                      # cache_dir / "manhwa"
strip_dir(config, source_id)            # ... / <source_id>; raises 404-style ApiError if missing
load_registry(config, source_id)        # StripRegistry.load + ManhwaError→ApiError
save_registry_registry(registry)        # registry.save(), ManhwaError→ApiError
save_source(image_bytes, mime, config, source_id) -> Path   # source.<ext>
```

Upload: `source_id = new_source_id()` (`s` + hex12); write `source.<ext>`
(ext from content-type: png/jpg/jpeg/webp), then
`detect_strip(path, source_id=..., save=True, cache_dir=config.cache_dir)`.
ManhwaError (not vertical, unreadable) → 422 `MANHWA_DETECT_FAILED`.

Asset serving (`/panels/{panelId}`) regenerates from the original (never
serves stale eager crops): registry panel → `crop_panel` + `encode_panel(png)`
→ `Response(png)`.

Export: `materialize_export(source_image, panels, fmt, quality)` →
`zipfile` in-memory with `manifest.json` (JSON bytes) + one entry per
`ExportFile`; `Response(zip, media_type="application/zip")`.

## Wire precedence

- Pure layers (modules 1–5) hold all logic; this router is ~thick storage +
  HTTP glue and error translation only.
- `redetect` reuses `detect_strip(save=True)` — one pipeline, regenerated
  registry and crops atomically on disk.
- `panels/{panelId}` and `/export` never resample; both crop the original.

## Testing (TDD, isolated in tmp dirs)

- Storage: source_id path guard; strip_dir 404 when absent; list/count
  helpers against a written registry.
- Upload: valid vertical PNG → 201 + panels + source cache file + registry;
  non-image bytes → 422; landscape image → 422.
- List/detail/source: metadata counts match; detail echoes panels; source
  serves decodable bytes with the right content type.
- Panel serve: returns the panel's region byte-identical to a crop; unknown id
  → 404.
- Correction: each op round-trips through a registry on disk (apply → reload →
  apply); split/merge/reorder persist; reset empties (registry valid-looking);
  bad op / missing field → 422; unknown id → 422.
- Redetect: after a correction, POST redetect replaces panels (fresh p-ids,
  crops regenerated).
- Export: zip streams, contains manifest.json + N panel files whose names
  match the manifest, and files decode to panel dims at original res.

## Boundaries

- Always: project-local storage only; original file never mutated; no
  resampling; ApiError shape `{error:{code,message}}`; registry is the single
  source of truth.
- Ask first: auth, S3/external storage, thumbnails/previews at reduced scale,
  video support.
- Never: overwrite the original; serve stale crops; resize panels; ship empty
  exports (guard → 422).