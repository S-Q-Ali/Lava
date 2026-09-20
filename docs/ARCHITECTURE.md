# AI Video Studio — Architecture

> **How to read this doc** — WHAT: the repository layout and where each concern lives. WHY: every structural choice serves the local-first + CPU-fallback + editable-AI product rules (see §2 and `DECISIONS.md` D-001…D-007). HOW: module boundaries, tech table and processing graphs define how the pieces connect.

## 1. Repository Layout

```
Lava/  (AI-VIDEO-STUDIO)
├── AGENTS.md
├── README.md
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   ├── UI_SPEC.md
│   ├── TEST_PLAN.md
│   └── ROADMAP.md
├── apps/
├── frontend/
├── backend/
├── audio/
├── vision/
├── manhwa/
├── captions/
├── timeline/
├── media/
├── models/
├── tools/
│   └── ffmpeg/
├── scripts/
├── tests/
├── projects/
├── cache/
├── temp/
└── graphify-out/
```

## 2. Design Principles

- **Local-first**: Python environments, Node dependencies, models, caches, FFmpeg binaries and project data live inside the project directory wherever technically possible. Cache/model download paths are configurable and can be redirected into the project folder.
- **CPU fallback**: baseline hardware is HP Pavilion 15 (i7 10th Gen, 16 GB RAM, MX250 2 GB). No GPU-only models required; lightweight model packs are the default.
- **Proxy previews**: preview uses lower-resolution/proxy media; final render uses full-resolution assets offline.
- **Editable AI output**: every AI-generated edit is stored as editable timeline data. User overrides are respected; background AI never silently rewrites user edits.
- **Confidence everywhere**: AI predictions expose confidence when errors are possible and remain reversible.

## 3. Core Technology

| Concern | Technology |
| --- | --- |
| Media encoding/muxing | FFmpeg (via the local media sidecar — `backend/`, HTTP) |
| Computer vision / image processing | OpenCV (not described as an AI model) |
| Frontend shell | Vite + React (web-first; Tauri/native shell planned at Milestone 10) |
| Media sidecar API | FastAPI (probe + render over HTTP, project-local `cache/backend/`) |
| Voice analysis | Speech-to-text with word/sentence timestamps (multilingual) |
| Semantic matching | Embeddings/features + scoring heuristics |
| Knowledge graph | Graphify (project-scoped) |

## 4. Voice-over → Images Processing Graph

```
Voice-over audio ──► Audio decode/analyze
                         │
                         ▼
              Speech-to-text (word/sentence timestamps)
                         │
                         ▼
              Pause detection / timing boundaries
                         │
                         ▼
              Semantic visual beat segmentation
                         │
                         ▼
              Beat ←→ image matching (embeddings + scoring)
                         │
                         ▼
              Timing determination + transition/animation suggestions
                         │
                         ▼
              Editable timeline ──► Preview ──► FFmpeg render
```

Scoring inputs: semantic relevance, visual quality, composition, continuity, repetition penalty, timing fit.

Image pool analysis: visual semantics, composition, usable subject matter.

## 5. Manhwa / Webtoon Extraction Processing Graph

```
Long vertical image ──► Full-resolution load
                         │
                         ▼
              Analysis-scale representation (speed)
                         │
                         ▼
              Gutter/whitespace/structural boundary detection
                         │
                         ▼
              Candidate panel detection (multiple signals)
                         │
                         ▼
              Border/color/texture/edge/region continuity evaluation
                         │
                         ▼
              Borderless + connected-panel reasoning, merge/split
                         │
                         ▼
              False-positive filtering (bubbles, text, characters, decor)
                         │
                         ▼
              Top→bottom sorting ──► map to original resolution
                         │
                         ▼
              Panel assets + metadata ──► correction UI ──► PNG/JPG export
```

Detection must not rely on a single contour threshold.

## 6. Caption Processing Graph

```
ASR ──► word/sentence timestamps ──► segmentation
         ──► style renderer ──► editable caption track on the timeline
```

## 7. System Boundaries

- `apps/` — application shell(s), packaging, installer paths.
- `frontend/` — editor UI: preview, timeline, inspector, media/navigation.
- `backend/` — local service layer coordinating pipelines.
- `audio/` — audio decoding, ASR, pause detection, segmentation.
- `vision/` — image analysis, embeddings, semantic matching, scoring.
- `manhwa/` — panel detection, ordering, correction, export.
- `captions/` — caption pipeline and renderers.
- `timeline/` — editor model, project state, undo/redo, timeline operations.
- `media/` — asset import, storage, proxies, original preservation.
- `models/` — project-local model downloads and caches.
- `tools/ffmpeg/` — project-local FFmpeg binary (where practical).
- `scripts/` — helper/dev scripts.
- `tests/` — unit, integration and fixture tests.
- `projects/` — user project data.
- `cache/` + `temp/` — disposable data.
- `graphify-out/` — generated codebase knowledge artifacts.

## 8. Design Decisions (WHY)

Rationale and alternatives for the locked choices live in [DECISIONS.md](DECISIONS.md):

| Decision | Why (short) |
| --- | --- |
| D-001 Web-first editor (Vite + React) | Fast dev loop, no native toolchain yet, CPU-fallback friendly; native shell later |
| D-002 Zustand + Zundo | Small store + built-in undo/redo the spec requires; partialized history |
| D-003 Project-local FFmpeg | Local-first; pinned, re-fetchable binary; path configurable |
| D-004 FFmpeg provider abstraction | Browsers lack FFmpeg; swap-in sidecar/Tauri provider without UI changes |
| D-005 Curated skills in-repo, vendor clones gitignored | Version control the operating surface, not 18 MB of re-clonable repos |
| D-006 Commit graphify-out, code-only pass | Durable codebase map for cold sessions; semantic pass needs an LLM key |
| D-007 Session log + decisions log | Compaction/fresh sessions resume from written records, not chat memory |
| D-008 Media sidecar HTTP API (FastAPI) | Browsers cannot run FFmpeg; a localhost HTTP contract keeps the web shell honest |

## 9. Media Sidecar API

The `backend/` service exposes the FFmpeg capability the browser lacks. Contract (all errors are `{ "error": { "code", "message" } }`):

- `GET /api/health` — sidecar + FFmpeg/FFprobe versions.
- `POST /api/probe` — `{ "path" }` → media metadata (duration, streams, size).
- `POST /api/render` — multipart upload (`files` + JSON `clips` `[{ fileName, start, duration }]` + JSON `settings` `{ width, height, fps }`) → `mp4` in `cache/backend/renders/`.
- `GET /api/files/{jobId}` — serves the rendered `mp4` for playback.
- `POST /api/transcribe` — multipart `file` (+ optional `language`) → narration analysis:
  `{ text, language, segments: [{ id, text, start, end, avgLogprob, confidence, words: [{ word, start, end, confidence }] }], pauses: [{ start, end, gap }] }`.
  Engine is the `Transcriber` interface (`app.state.transcriber`) — `WhisperTranscriber` (faster-whisper, CPU int8, `tiny`, lazy model download into `models/whisper/`) in production, `FakeTranscriber` in tests. New error codes: `NO_FILE` (400), `TRANSCRIBE_FAILED` (422).
- `POST /api/match` — multipart `images` (files named by assetId) + JSON `beats` `[{ id, text, start, end }]` → beat→image assignment:
  `{ beats: [{ beatId, imageKey, confidence, start, end, alternatives: [{ imageKey, confidence }] }] }`.
  Engine is the `Matcher` (`app.state.matcher`) over an injectable `Embedder` — production uses CLIP ViT-B/32 ONNX fp32 from `models/clip/` (Pillow preprocessing), tests use `FakeEmbedder`. Repetition-aware greedy assignment (penalty 0.05). Error codes: `NO_IMAGES`/`NO_BEATS` (400), `EMBED_FAILED`/`MATCH_FAILED` (422).

Uploads/renders live under project-local `cache/backend/` (gitignored). Whisper models live under project-local `models/whisper/` (gitignored); CLIP model under `models/clip/` (gitignored). The frontend's `HttpFFmpegProvider` (`frontend/src/services/ffmpeg.ts`) auto-detects the sidecar via `GET /api/health` and falls back to the unavailable provider when it is not running.

Current gaps (honest state): `backend/` hosts media + ASR + CLIP matching only — transitions, caption and Manhwa pipelines are not implemented; match *duration pacing* is implemented only at the edges (floor + tail hold within the narration-audio horizon) and timing overrides are preserved across re-matches but beat ids remain positional (stable ids reserved); transcript timing edits/re-segmentation are deferred.

## 7. M11/M12 Backend Modules

| Module | File | Endpoint | Purpose |
|--------|------|----------|---------|
| Groq Transcription | `groq_transcribe.py` | `POST /api/transcribe-groq` | Cloud Whisper via Groq API |
| Captions Export | `captions_export.py` | `POST /api/captions/export` | SRT/VTT subtitle download |
| Visual Prompts | `visual_prompts.py` | `POST /api/visual-prompts/generate` | LLM-powered image prompt generation |
| Voice Blending | `voice_blending.py` | `POST /api/voiceover/blend` | FFmpeg amix multi-voice blending |
| Voice Cloning | `voice_cloning.py` | `POST /api/voiceover/clone` | XTTS-v2 voice cloning |
| Model Manager | `model_manager.py` | `GET/POST/DELETE /api/models/*` | Model status, download, delete |
| Image Generation | `image_gen.py` | `POST /api/image-gen/batch` | Gemini Imagen 3 batch generation |
| Podcast Maker | `podcast_maker.py` | `POST /api/podcast/generate` | Multi-turn dialogue synthesis |
| Voice Library | `voice_library.py` | `GET /api/voices` | Browse 322+ TTS voices |
| Sound FX | `sound_fx.py` | `POST /api/sfx/generate` | ZzFX procedural + web search |
| Bulk TTS | `bulk_tts.py` | `POST /api/bulk-tts/generate` | Batch TTS + ZIP download |
| Timeline Sync | `timeline_sync.py` | `POST /api/timeline-sync` | Image-audio alignment |
| Video Clipper | `video_clipper.py` | `POST /api/clipper` | 9:16 vertical clip extraction |
| Hardware Analyzer | `hardware_analyzer.py` | `GET /api/hardware/analyze` | Pre-download system assessment |
| Auto-Update | `auto_updater.py` | `GET /api/update/check` | GitHub releases version check |
| Pipeline Engine | `pipeline_engine.py` | (internal) | Script-to-video orchestrator |
| Pipeline API | `pipeline_api.py` | `POST /api/pipeline/run-script` | End-to-end pipeline endpoint |