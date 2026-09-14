# Plan: M9 Hardware Validation

> Per SPEC-m9-capability-map.md (approved). Build order: proxy-preview →
> runtime-optimization → memory-tuning → baseline-validation.

## Module 1 — proxy-preview (D-033)

Spec: `docs/SPEC-proxy-preview.md`

### Slice 1: proxy-core (backend pure helpers)
- `_file_hash(data: bytes) -> str` — sha256[:16], deterministic
- `generate_image_proxy(src_path, dest_dir, max_width=480) -> ProxyResult`
  — Pillow thumbnail → WebP (quality 80); returns `{path, width, height, mime, size}`
- `generate_video_proxy(src_path, dest_dir, max_height=480, max_duration=120) -> ProxyResult`
  — FFmpeg `-vf scale=-2:{h}:flags=fast_bilinear -r 15 -t {max} -c:v libx264 -preset veryfast -crf 28 -an` → MP4
- `ProxyResult` dataclass, `ProxyError` exception
- `Config.proxy_dir` field (cache/backend/proxy/)
- RED tests: hash determinism, image proxy width cap + WebP, video proxy height + fps, cache hit (idempotent), empty file error, unsupported type error
- Commit: `proxy-core` + tests

### Slice 2: proxy-api (FastAPI routes)
- `POST /api/proxy` — multipart `file`, hash-check cache, generate if missing, return `{proxyId, kind, width, height, mimeType, sizeBytes}`
- `GET /api/proxy/{proxyId}` — serve from proxy_dir; 404 if missing
- `ProxyId` regex gate (path-traversal safe)
- Tests: POST 200 + shape, re-POST idempotent, GET 200 + content-type, GET 404, bad type 422 `PROXY_UNSUPPORTED`, empty file 422
- Commit: `proxy-api` + tests, backend count increases

### Slice 3: frontend proxy services + PreviewPanel wiring
- `services/proxy.ts`: `requestProxy(file) -> Promise<string|null>`, graceful offline fallback
- `types.ts`: `Asset` gains `proxyUrl?: string`
- `importer.ts`: after import, eagerly request proxy for image/video assets, patch `proxyUrl`
- `PreviewPanel.tsx`: use `activeAsset.proxyUrl ?? activeAsset.url`; `useMemo` on resolved URL; `React.memo` on the image/video elements
- Tests: requestProxy success/null fallback, proxyUrl resolution logic, PreviewPanel renders proxy when set
- Commit: `proxy-frontend` + tests, frontend count increases

### Slice 4: docs
- D-033, ROADMAP M9 proxy-preview tick, FEATURES §10 block, SESSION_LOG 28, graphify
- Full regression: backend ≥ 404 + new, frontend ≥ 284 + new, build ok, lint 0
- Commit: docs

## Module 2 — runtime-optimization (D-034)

### Slice 1: lazy model factory
- Replace `main.py` eager `_embedder = ClipEmbedder(...)` + multilingual with
  `_get_embedder() -> ClipEmbedder` (lazy singleton, first call triggers load)
- Same pattern for `WhisperTranscriber` (already lazy `_ensure_model`; move init to `_get_transcriber()`)
- Tests: startup does not load models (mock assert no call); first use loads; second use reuses
- Commit: `lazy-models` + tests

### Slice 2: async render offload
- `render_endpoint` currently calls `render()` synchronously → wraps in
  `await asyncio.get_event_loop().run_in_executor(None, render, ...)`
  so the FastAPI event loop stays free during FFmpeg
- Tests: endpoint still returns correct shape; health endpoint responds during render (mock slow render)
- Commit: `async-render` + tests

### Slice 3: configurable timeout
- `studio.config.json` gains `render.timeoutSeconds` (default 600)
- `Config` reads it; `_run()` uses it as default; frontend `ffmpeg.ts` reads a
  `/api/health` `renderTimeoutMs` field or uses a matching constant
- Tests: custom timeout respected, missing config uses default
- Commit: `configurable-timeout` + tests

### Slice 4: frontend bundle baseline
- `npm run build -- --stats` or `rollup-plugin-visualizer` to measure
- Record main bundle size in CONSTRAINTS.md `measured` table
- Gate: main bundle ≤ 500KB gzipped (baseline-appropriate; current React+Zustand
  app should be well under)
- Commit: `bundle-baseline` + CONSTRAINTS update

### Slice 5: docs
- D-034, ROADMAP M9 runtime-optimization tick, SESSION_LOG 29, graphify
- Commit: docs

## Module 3 — memory-tuning (D-035)

### Slice 1: manhwa streaming decode
- `detect.py`: instead of `image.load()` (full decode), use `Image.draft("L", (ana_w, ana_h))` after `Image.open()`
  to hint Pillow to decode at lower resolution for the analysis path
- `detect_strip` signature unchanged; internal optimization only
- Tests: existing detect suite passes unchanged; new test confirms peak
  memory (or proxy via mock) is lower for a tall fixture
- Commit: `manhwa-decode` + tests

### Slice 2: export bundle streaming
- `materialize_export` currently holds all panel `bytes` in memory
- Refactor to stream panels to temp files, then zip from disk
  (`zipfile.ZipFile` with `allowZip64`)
- `ExportBundle.files` changes from `list[ExportFile]` to a generator/context
  or direct zip path returned
- Tests: existing export tests pass; new test confirms zip is valid on disk
- Commit: `export-stream` + tests

### Slice 3: cache GC
- New `backend/src/lava_backend/gc.py`: `gc_cache(cache_dir, max_renders=12, max_age_days=7)`
  — removes oldest renders, orphaned proxy files older than max_age_days
- Wire into startup or a new `POST /api/gc` endpoint (manual trigger, not automatic)
- Tests: old renders removed, proxy orphans removed, recent files kept
- Commit: `cache-gc` + tests

### Slice 4: motion upscale documentation
- `media.py:96` `scale=iw*3:ih*3` — document in docstring the memory
  tradeoff (9x pixel count at 3x dimensions) and why 3x is the minimum
  for zoom-out headroom
- Add `motion.upscaleFactor` to config (default 3, range 2–4) with tests
  that parity is preserved at 2x and 3x
- Commit: `motion-config` + tests

### Slice 5: docs
- D-035, ROADMAP M9 memory-tuning tick, SESSION_LOG 30, graphify
- Commit: docs

## Module 4 — baseline-validation (D-036)

This module is the final proof gate — it runs on real hardware and documents
the results.

### Slice 1: HP Pavilion measurement checklist
- Create `docs/M9-MEASUREMENT.md` with a structured checklist:
  1. App startup time (cold start with models)
  2. Image proxy generation time (4000×6000 manhwa)
  3. Video proxy generation time (5 min 1080p source)
  4. Preview render (5 image clips, no transitions)
  5. Full render (10 clips + transitions + captions + motion)
  6. Memory peak during each (Activity Monitor / Task Manager snapshot)
  7. Frontend LCP via Lighthouse (if feasible) or manual timing

### Slice 2: Mac reference measurement
- Run the same checklist on this Mac as a reference baseline
- Record times in `M9-MEASUREMENT.md`

### Slice 3: CONSTRAINTS enforcement
- Update `CONSTRAINTS.md` measured rows with actual numbers
- Render time bound: documented (e.g. "10-clip render ≤ X min on baseline")
- Bundle size bound: filled in from Slice 4 of module 2
- ROADMAP M9 all ticks, FEATURES §10 block, SESSION_LOG 31

### Slice 4: docs + graphify
- D-036, ROADMAP M9 complete, SESSION_LOG, graphify, regression
- Final commit + push on go-ahead

---

## Verification checkpoint (all modules)

- `uv run pytest` ≥ 404 (current) + new tests per module
- `npx vitest run` ≥ 284 (current) + new tests per module
- `npm run build` clean, `npm run lint` 0 errors
- No `@ts-ignore`, `eslint-disable`, `# noqa` additions
- `graphify update .` after each module
- Session log + DECISIONS updated at each module boundary
