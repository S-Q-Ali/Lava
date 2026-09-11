# Spec: Voice Analysis (M2 first slice)

> Module id: `voice-analysis`. Source of truth for this feature; the master spec lives in
> [PRODUCT_SPEC.md](PRODUCT_SPEC.md) §5 and [FEATURES.md](FEATURES.md) §2.

## Capability Map

| Module id | Responsibility | Depends on |
|---|---|---|
| `transcribe-api` | Backend `POST /api/transcribe`: multipart audio → timed transcript | `media-sidecar` (config, error contract) |
| `pause-segmentation` | Pure word-gap → pause/segment detection, confidence | — |
| `transcript-state` | Frontend per-asset transcript store slice + project persistence | `transcribe-api` |
| `transcript-ui` | InspectorPanel analyze/transcript/word-seek/word-edit UI + CSS | `transcript-state` |

Build order: `pause-segmentation` → `transcribe-api` → `transcript-state` → `transcript-ui`.

## Objective

Let a user select a narration/voice-over asset, run "Analyze narration", and get an editable,
timed transcript with word timestamps and detected pauses — the front half of the voice-over
differentiator (PRODUCT_SPEC §5 steps 1–4). Success: a voice asset becomes a transcript the user
can read, scrub (word click → playhead), and correct (word text edit), with honest
loading/error/empty/confidence states (UI_SPEC §7).

## Tech Stack

- Backend: FastAPI + faster-whisper (CPU, `int8`, model default `tiny`), project-local model cache under `models/` (local-first).
- Abstraction: `Transcriber` interface → production (faster-whisper) + fake (deterministic, for tests).
- Frontend: React + Zustand (existing patterns), fetch client to sidecar.

## Commands

```
# backend
cd backend && uv sync --extra dev        # install (adds faster-whisper)
cd backend && uv run pytest              # run all backend tests
./scripts/sidecar.sh                     # run sidecar (transcribe endpoint included)

# frontend
cd frontend && npx vitest run            # unit tests
cd frontend && npm run build             # tsc -b && vite build
cd frontend && npm run lint              # oxlint
cd frontend && npm run dev               # dev server
```

## Project Structure

```
backend/src/lava_backend/transcribe.py   → API route + request/response models
backend/src/lava_backend/transcribe_core.py → pure pause/segment detection (no heavy deps)
backend/src/lava_backend/transcribers.py → Transcriber interface + faster-whisper + fake
backend/tests/test_transcribe_core.py    → pure logic unit tests
backend/tests/test_transcribe_api.py     → API integration (fake transcriber)
frontend/src/services/voice.ts           → typed client + Transcript types
frontend/src/store/transcriptStore.ts    → per-asset transcript slice
frontend/src/components/TranscriptPanel.tsx → transcript UI (used in InspectorPanel)
frontend/src/editor/project.ts           → optional `transcripts` key (backward-compatible)
```

## Code Style

Follow existing conventions: no comments unless asked; noun everything precisely; pure helpers in
`_core`/`scope` modules are unit-tested; frontend uses `import type`, no enums/param properties
(verbatimModuleSyntax). Example backend error shape (already the contract):

```python
{"error": {"code": "TRANSCRIBE_FAILED", "message": "..."}}
```

## Testing Strategy

- Backend: pytest — pure `pause-segmentation` unit tests (gap math, boundary, empty audio) +
  API integration with injected fake transcriber (request/response shape, error contract).
- Frontend: vitest — transcript store slice actions/state, parse/word-seek helpers.
- Real model = manual smoke (TEST_PLAN §1 voice fixtures: short, pauses, mixed language) —
  faster-whisper model downloads on first use into project-local `models/`.
- Per AGENTS DoD: implementation + UI + error states + tests + verification + docs.

## Boundaries

- Always: run focused tests per slice; keep `Transcriber` injectable; word-text edits never
  silently overwrite; expose confidence; errors non-technical and actionable.
- Ask first: adding faster-whisper dependency; default model size; changing `PAUSE_THRESHOLD` default.
- Never: commit model binaries into the repo (cached under gitignored `models/`); ship without
  loading/error states; delete transcript data on failed analysis.

## Success Criteria

- `POST /api/transcribe` returns `{ text, language, segments: [{id,text,start,end,words:[{word,start,end}],confidence?}], pauses: [{start,end,gap}] }`; bad requests → error contract.
- Pause detection: inter-word gaps ≥ `PAUSE_THRESHOLD` (0.3s default) become `pauses`; segments respect pause boundaries.
- Frontend: voice/audio clip → Analyze → transcript with pending/error/success states; word click scrubs playhead; word text edits persist via store and round-trip through project Save/Load; low-confidence words flagged.
- All tests green; build+lint green; docs recorded (SESSION_LOG 5, ROADMAP M2, FEATURES §2, DECISIONS D-010/D-011).

## Open Questions

- None blocking. Deliberately deferred (documented in plan): semantic visual-beat segmentation (M3), timing-edit re-segmentation, model-size tuning on the baseline laptop.