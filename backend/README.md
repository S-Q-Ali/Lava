# Lava Studio — Backend (media sidecar)

Local-first media service: FFmpeg probe and render over HTTP. The frontend's `HttpFFmpegProvider`
talks to this service when it is running; otherwise the editor keeps working but rendering is
unavailable.

## Run

```bash
./scripts/sidecar.sh          # starts on 127.0.0.1:7860
PORT=9000 ./scripts/sidecar.sh
```

Requires the project-local FFmpeg at `tools/ffmpeg/bin/` (`scripts/fetch-ffmpeg.mjs` installs it).

## API

- `GET  /api/health` — sidecar + FFmpeg/FFprobe versions.
- `POST /api/probe` — `{ "path": "/abs/media.mp4" }` → media metadata.
- `POST /api/render` — multipart: `files` (media files), `clips` (JSON: `[{ fileName, start, duration }]`),
  `settings` (JSON: `{ width, height, fps }`) → `{ jobId, outputPath, duration, width, height, fps, sizeBytes }`.
- `GET  /api/files/{jobId}` — the rendered `mp4` for playback.

Error responses always use `{ "error": { "code", "message" } }`.

## Tests

```bash
cd backend && uv run pytest
```

## Layout

- `src/lava_backend/main.py` — FastAPI app and routes.
- `src/lava_backend/media.py` — ffprobe/ffmpeg subprocess helpers and the render filter graph.
- `src/lava_backend/config.py` — resolves `studio.config.json` (local-first paths, ffmpeg bin, host/port).
- `tests/` — pytest suite (health, probe, render, file serving, error contract).

Uploaded/rendered files live under project-local `cache/backend/` (gitignored).