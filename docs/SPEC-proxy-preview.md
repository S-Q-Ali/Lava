# Spec: M9 Module 1 — proxy-preview

## Objective

PreviewPanel currently renders raw full-resolution assets on every 100ms
playback tick. On the baseline HP Pavilion this causes lag on large images and
slow scrubbing on high-res video. This module ships:

1. **Backend proxy generator** — given a source image/video, produce a small
   proxy file (WebP thumbnail for images, low-res capped-fps MP4 for video)
   stored under `cache/backend/proxy/`.
2. **API surface** — `POST /api/proxy` to generate + store a proxy for an
   uploaded file; `GET /api/proxy/{proxyId}` to serve the cached proxy.
3. **Frontend preview wiring** — PreviewPanel uses the proxy URL for display
   (images, scrub playback) while render continues to use the raw `File` bytes
   via the existing `getAssetFile()` path — completely untouched.
4. **PreviewPanel memoization** — `useMemo` + `React.memo` on the parts that
   re-render every tick, eliminating unnecessary React reconciliation during
   playback.

The render path (`POST /api/render`) is **not changed** by this module. Proxies
are preview-only.

## Assumptions

1. Assets arrive as browser `File` objects via the existing importer
   (`importer.ts`). The proxy URL must be resolved *per asset* and stored
   alongside it; the `Asset` model gains an optional `proxyUrl` field.
2. Backend proxy generation is **on demand** (not at import time) — the user
   sees a full-res preview immediately; proxy generation happens when the
   panel first requests it, or is triggered by a button / auto on first clip
   assignment. Exact trigger is implementation detail.
3. Image proxy: max 480px wide, WebP format, JPEG fallback for browser compat;
   quality 80. Video proxy: scale to 480p, cap at 15fps, max 2 minutes source
   duration clip for proxy (longer sources proxy only the first 2 minutes).
   These are baseline-appropriate defaults.
4. Proxies are cached by content hash (source file SHA-256 prefix) — re-upload
   of the same file does not regenerate; expired/orphaned proxies are cleaned
   by module 3 (memory-tuning cache GC).
5. `studio.config.json` gains an optional `proxy.maxImageWidth` (default 480)
   and `proxy.maxVideoHeight` (default 480) for baseline tuning.

## API Contract

### POST /api/proxy

Request: multipart form, single `file` field.

Response 200:
```json
{
  "proxyId": "abc123def456",
  "kind": "image",
  "width": 480,
  "height": 320,
  "mimeType": "image/webp",
  "sizeBytes": 18432
}
```

Errors:
- `422 PROXY_UNSUPPORTED` — file type not supported (e.g. audio)
- `422 PROXY_GENERATION_FAILED` — FFmpeg / Pillow error during generation

The `proxyId` is deterministic from `sha256(file_bytes)[:16]` + extension, so
repeated calls for the same content return the same id without re-generating.

### GET /api/proxy/{proxyId}

Serves the cached proxy file. Errors: `404 NOT_FOUND`.

## Implementation Notes

### Backend (`media.py` + `main.py`)

- `proxy_dir` added to `Config` (under `cache/backend/proxy/`).
- `generate_image_proxy(src_path, dest_dir, max_width)` — Pillow open →
  `Image.thumbnail((max_width, MAX_H), LANCZOS)` → save as WebP (quality 80).
- `generate_video_proxy(src_path, dest_dir, max_height, max_duration)` — FFmpeg
  call: `-vf scale=-2:{max_height}:flags=fast_bilinear -r 15 -t {max_duration}
  -c:v libx264 -preset veryfast -crf 28 -an` → MP4.
- `_file_hash(data: bytes) -> str` — `sha256(data)[:16]` for deterministic id.
- Route wiring: `app.state.proxy_dir` set at startup from `config.proxy_dir`;
  `POST /api/proxy` reads file bytes, computes hash, checks cache, generates
  if missing, returns metadata. `GET /api/proxy/{proxyId}` serves from
  `proxy_dir`.

### Frontend (`types.ts` + `importer.ts` + `services/proxy.ts` + `PreviewPanel.tsx`)

- `Asset` gains `proxyUrl?: string`.
- `services/proxy.ts`: `requestProxy(file: File): Promise<string | null>` —
  POST to `/api/proxy`, cache the returned `proxyId` → blob URL via the file
  bytes. If the backend is unavailable, return `null` (graceful fallback to
  full-res).
- `importer.ts`: after `importFiles`, optionally call `requestProxy` for each
  image/video asset and patch `proxyUrl` onto the asset. This can be done
  eagerly at import or lazily on first preview; implementation decides.
- `PreviewPanel.tsx`: use `activeAsset.proxyUrl ?? activeAsset.url` for `<img>`
  and `<video>` `src`. Add `useMemo` on the resolved URL; wrap the image/video
  elements in `React.memo` to avoid re-renders when props haven't changed.
  The playhead-tick `requestAnimationFrame` loop should not cause the
  `<img>`/`<video>` to re-render when `activeAsset` hasn't changed.

## Testing Strategy

- **Backend unit**: proxy hash determinism, image proxy produces valid WebP at
  correct max width, video proxy produces valid MP4 at correct height/fps/cap,
  cache hit (second call returns same id, no re-generation), unsupported type
  error, empty file error.
- **Backend API**: `POST /api/proxy` → 200 + metadata shape; re-POST → 200 same
  id; `GET /api/proxy/{id}` → 200 + correct `Content-Type`; missing → 404.
- **Frontend unit**: `requestProxy` returns proxy URL on success, falls back to
  null on backend unavailable; `Asset.proxyUrl` resolution logic.
- **Frontend component**: PreviewPanel renders proxy URL when `proxyUrl` is set,
  falls back to `url` when not; `useMemo` correctness (no re-render on
  playhead-only change).
- **Parity**: render path unchanged — existing 404+284 test suite green.

## Boundaries

- **Always**: proxy is preview-only; render path uses raw `File` bytes;
  no proxy ever replaces or overwrites the source; existing tests pass.
- **Ask first**: changing the proxy dimensions/quality defaults; any
  proxy-related change to the render endpoint; persisting proxy URLs in
  the project file (project version stays 1 — proxies are derived, not
  authored data).
- **Never**: serving the original via the proxy endpoint; deleting originals
  when a proxy exists; blocking the import path on proxy generation.

## Success Criteria

- `uv run pytest` ≥ 404 (no drop; proxy adds ~15 backend tests).
- `npx vitest run` ≥ 284 (no drop; proxy adds ~10 frontend tests).
- `npm run build` clean, `npm run lint` 0 errors.
- PreviewPanel shows a WebP thumbnail for a 4000×6000 Manhwa image (proxy)
  instead of the full 12MB original.
- Render path produces byte-identical output when proxies exist vs when they
  don't (parity test).
- DEV server: 200 on all new/proxy-related modules.

## Open Questions

1. Proxy generation timing: generate eagerly at import, or lazily on first
   PreviewPanel render? (Lazy is lower-latency-at-import; eager is simpler.)
   → Implementation choice: **lazy on first preview render** (avoids slowing
   the import path, matches baseline's slow-import concern).
