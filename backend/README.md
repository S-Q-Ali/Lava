# Lava Studio — Backend (media sidecar)

Local-first media service: FFmpeg probe/render + narration transcription (faster-whisper) + semantic
image matching (CLIP) over HTTP.
The frontend's `HttpFFmpegProvider` talks to this service when it is running; otherwise the editor keeps
working but rendering/analysis are unavailable.

## Run

```bash
./scripts/sidecar.sh          # starts on 127.0.0.1:7860
PORT=9000 ./scripts/sidecar.sh
```

Requires the project-local FFmpeg at `tools/ffmpeg/bin/` (`scripts/fetch-ffmpeg.mjs` installs it).
The Python env is pinned to **3.12** (`uv python pin 3.12` — onnxruntime publishes macOS x86_64 wheels
only up to `cp312`). The Whisper model downloads lazily on first transcribe into `models/whisper/`
(gitignored).

## API

- `GET  /api/health` — sidecar + FFmpeg/FFprobe versions.
- `POST /api/probe` — `{ "path": "/abs/media.mp4" }` → media metadata.
- `POST /api/render` — multipart: `files` (media files), `clips` (JSON: `[{ fileName, start, duration }]`),
  `settings` (JSON: `{ width, height, fps }`) → `{ jobId, outputPath, duration, width, height, fps, sizeBytes }`.
- `GET  /api/files/{jobId}` — the rendered `mp4` for playback.
- `POST /api/transcribe` — multipart: `file` (audio) + optional `language` →
  `{ text, language, segments: [{ id, text, start, end, avgLogprob, confidence, words: [{ word, start, end, confidence }] }], pauses: [{ start, end, gap }] }`.
  Model size/device/compute are configurable on `WhisperTranscriber` (default `tiny`, CPU, int8).
- `POST /api/match` — multipart: `images` (files, named by assetId) + `beats` (JSON: `[{ id, text, start, end }]`) →
  `{ beats: [{ beatId, imageKey, confidence, start, end, alternatives: [{ imageKey, confidence }] }] }`.
  Uses the CLIP ViT-B/32 ONNX model (fp32, lazy-downloaded into `models/clip/`; quantized export is broken on 1.17.3 — see D-012). Errors: `NO_IMAGES`/`NO_BEATS` (400), `EMBED_FAILED`/`MATCH_FAILED` (422).

Error responses always use `{ "error": { "code", "message" } }`.

## Tests

```bash
cd backend && uv run pytest
```

## Layout

- `src/lava_backend/main.py` — FastAPI app and routes (wires `app.state.transcriber`, `matcher`, `tmp_dir`).
- `src/lava_backend/media.py` — ffprobe/ffmpeg subprocess helpers and the render filter graph.
- `src/lava_backend/transcribe.py` — `POST /api/transcribe` route + response serialization.
- `src/lava_backend/transcribers.py` — `Transcriber`, `WhisperTranscriber`, `FakeTranscriber`.
- `src/lava_backend/transcribe_core.py` — pure pause-detection + logprob→confidence→percentage math.
- `src/lava_backend/clip.py` — CLIP embeddings (`ClipEmbedder`: lazy ONNX session + tokenizer, Pillow preprocess, scoring helpers; `model_key` selects export, fp32 default).
- `src/lava_backend/matching.py` — `POST /api/match` route + repetition-aware `Matcher` over an injectable `Embedder`.
- `src/lava_backend/config.py` — resolves `studio.config.json` (local-first paths, ffmpeg bin, host/port, models dir).
- `tests/` — pytest suite (health, probe, render, file serving, error contract, transcribe API/units, clip units, matching contract).

Uploaded/rendered files live under project-local `cache/backend/` (gitignored).