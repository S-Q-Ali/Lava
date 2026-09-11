# Spec: M3 — Semantic image matching (first slice)

## Objective

Complete the voice-over differentiator's second half: turn a timed narration transcript plus a set of
candidate images into an automatically placed, timed, *editable* image track.

User story: the editor imports narration + images, clicks **Auto-match**, and the image track is filled
with best-fit images whose durations follow the narration's beats. Every choice is a normal timeline
edit — undoable, replaceable, reorderable — and shows a confidence figure.

Decisions locked by the human (2026-09-12):
1. Image understanding = **CLIP embeddings (ONNX)** — model downloaded into the project-local `models/clip/`.
2. **Auto-timing/placement** — beats' time range sizes the image clips automatically (single undo step, editable).
3. **Urdu/Roman-Urdu quality is degraded** in this slice; multilingual embeddings are a later tuning pass.

## Capability map

| Module id | Responsibility | Depends on |
|---|---|---|
| `embedding-core` | CLIP ONNX session (lazy, `models/clip/`), Pillow image preprocessing, text encode, cosine/softmax scoring | M0/M2 backend + deps |
| `match-api` | `POST /api/match` — multipart images + JSON beats → assignments + alternatives + timings (repetition-aware) | `embedding-core` |
| `beat-segmentation` | Frontend pure TS: transcript → ordered visual beats (time ranges + text labels) | M2 transcript |
| `semantic-matching` | Frontend orchestration + state: upload → apply auto-placed clips (one undo step), persist match meta | `match-api`, `beat-segmentation` |
| `match-ui` | Inspector: Auto-match button, per-clip confidence, alternatives dropdown (replace), status states | `semantic-matching` |

Build order: `embedding-core` → `match-api` → `beat-segmentation` → `semantic-matching` → `match-ui`.

## Tech stack

- Backend (Python 3.12, FastAPI): `onnxruntime==1.17.3` (already pinned for macOS x86_64), `tokenizers` (already present via faster-whisper), **new: `Pillow`** (image decode/resize → required by CLIP preprocessing; small pure wheel — Ask-first, flagged below).
- Model: `openai/clip-vit-base-patch32` ONNX (Xenova export) — text tokenizer + **fp32 model (default)**, lazy-downloaded to `models/clip/`. `model_key` param allows switching variants. *Update after Slice 1 smoke:* the Xenova **quantized** export produces degenerate text embeddings (different prompts → cosine 1.0), so fp32 `model.onnx` (605.8 MB) is the default; opset verified on onnxruntime 1.17.3.
- Frontend: existing zustand + zundo stacks, existing clip/`confidence` model field.

## Commands

- Backend tests: `cd backend && uv run pytest`
- Frontend tests: `cd frontend && npx vitest run`
- Build: `cd frontend && npm run build` (tsc -b + vite)
- Lint: `cd frontend && npx oxlint src`
- Sidecar: `./scripts/sidecar.sh` (127.0.0.1:7860)
- Real-model smoke: generated test image vs narration mp4 via the match endpoint (manual, manual fixtures per TEST_PLAN §1)

## Project structure

- `backend/src/lava_backend/clip.py` — session loader, preprocess/text-encode/scoring helpers (pure, fake-able).
- `backend/src/lava_backend/matching.py` — `POST /api/match` route + assignment algorithm (injectable `Embedder`).
- `backend/tests/test_clip.py`, `backend/tests/test_matching.py`.
- `frontend/src/editor/beats.ts` — pure TS beat segmentation + tests.
- `frontend/src/services/match.ts` — match client + result types.
- `frontend/src/store/matchingStore.ts` — transient status; applies clips via editor store (one undo step).
- `frontend/src/components/MatchPanel.tsx` — UI (component path precedent: `TranscriptPanel`).

## Code style

Repo convention (no editorconfig; `.prettierrc.json` in `frontend/`: singleQuote, semi:false, printWidth 100, trailingComma all):
TS like existing store/services code (type-safe selectors, `getState()` actions, no `any`), CSS via design
tokens (`--panel`, `--border`, `--text-dim`, `--accent`, `--track-image`) in `App.css` blocks. Python like
existing `transcribers.py`/`transcribe.py` (frozen dataclasses, injectable classes, `ApiError` mappings).

## Testing strategy

- Pure logic → TDD unit tests (`beat-segmentation`, `embedding-core` math, assignment/repetition algorithm).
- API contract → `FakeEmbedder` (pattern: `FakeTranscriber`) — multipart+JSON shape, error codes (`NO_IMAGES`, `NO_BEATS`, `NO_TRANSCRIPT`, `EMBED_FAILED`, `MATCH_FAILED`).
- Real model → manual smoke only (deterministic fakes in CI), fixtures per TEST_PLAN §1.
- Store/undo → vitest (auto-match = one undo step; assignment redo; persistence round-trip).
- Regression: full backend + frontend suites after each slice; build + oxlint green.

## Boundaries

- **Always:** tests before commit; lazy model download; project-local `models/clip/`; assignments always undoable; never overwrite user edits (re-match prompts or respects user-placed clips); expose confidence.
- **Ask first:** adding `Pillow` dependency; changing the match endpoint contract; any new model download; touching `projectVersion`.
- **Never:** commit model binaries/embeddings; hard-code model paths outside config; promise model accuracy on Urdu; overwrite a timeline without an undo step.

## Success criteria

- `POST /api/match` returns per-beat best image + confidence + top-3 alternatives + beat timings; repeated images penalized (repetition-aware); deterministic under `FakeEmbedder`.
- Auto-match adds one image clip per beat on the image track, sized to beat timing, as a **single undo step**; undo restores the previous timeline exactly.
- Beat boundaries come from the M2 transcript (sentence/segment end + pause ≥ 0.4s) and are pure TS, unit-tested.
- Match metadata (`clip.confidence`, `clip.beatId`) persists in the project file; old files without it still load (version stays 1 — pattern from D-011).
- Inspector shows an Auto-match action with idle/analyzing/error/success states and per-clip confidence + alternatives replace; keyboard accessible.
- Real-model smoke: a sample project gets plausible assignments with visible confidence spread.

## Open questions

- Pillow 12.3.0 added (cp312 wheel; ratified by CLIP decision #1).
- ONNX opset verified; the Xenova **quantized** model graph runs on `onnxruntime 1.17.3` but yields degenerate text embeddings (cos 1.0 across unrelated prompts) → **fp32 default** (`model_key` override). Recorded in DECISIONS D-012.
- Repetition penalty constant and pause threshold (0.4s) are initial guesses; calibration is a M4/hardware pass, not this slice.