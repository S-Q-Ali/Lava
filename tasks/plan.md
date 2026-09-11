# Implementation Plan: M2 Voice analysis (first slice)

**Status: COMPLETE** (closed 2026-09-12, commits `8abcd42` → `e864f18`, pushed to origin/main).

## Overview
Build the front half of the voice-over differentiator: narration audio → timed, editable
transcript with word timestamps and pause boundaries. Per [SPEC-voice-analysis.md](../docs/SPEC-voice-analysis.md),
capability build order: `pause-segmentation` → `transcribe-api` → `transcript-state` → `transcript-ui`.

## Skills workflow (per AGENTS.md, applied per phase)
Load before each phase: spec-driven-development (done — spec committed) · planning (done) ·
test-driven-development · api-and-interface-design (before transcribe contract) ·
incremental-implementation (all slices) · frontend-ui-engineering (transcript-ui) ·
documentation-and-adrs (docs slice) · git-workflow-and-versioning (commits) ·
code-review-and-quality (final review). References: definition-of-done, testing-patterns.

## Task List (vertical slices, each committed atomically)

### Slice 1 — pause-segmentation (backend, pure, TDD)
- [x] `transcribe_core.py`: word-gap → `pauses` list; segments from whisper segments; confidence passthrough
- [x] Tests: gap math, threshold boundary (≥0.3s), no-audio/empty, single word, identical timestamps
- [x] Verify: `uv run pytest backend/tests/test_transcribe_core.py` green

### Slice 2 — transcribe-api contract
- [x] `Transcriber` interface + fake; `POST /api/transcribe` route + response/error shape (`TRANSCRIBE_FAILED`, bad request 400)
- [x] Tests: fake transcriber integration (http 200 shape), missing file, corrupt audio
- [x] Verify: focused pytest green; `curl` smoke with generated audio optional

### Slice 3 — faster-whisper adapter
- [x] `transcribers.py`: faster-whisper CPU int8, model from config (`models/` cache), downloads on first use
- [x] Wire into route; keep fake for tests; manual smoke with real synthetic narration
- [x] Verify: sidecar runs; `/api/transcribe` real path returns lyrics-timed transcript

### Slice 4 — transcript-state (frontend)
- [x] `services/voice.ts` client + types; `transcriptStore` slice (per assetId: transcript/status/error)
- [x] project.ts optional `transcripts` key (backward-compatible, D-009 extension); save/load round-trip
- [x] Verify: vitest green; build+lint green

### Slice 5 — transcript-ui
- [x] `TranscriptPanel` in InspectorPanel: Analyze button, pending/error/empty/success states, word-click seek, inline word-text edit, low-confidence flag; CSS
- [x] Verify: build+lint+tests green; manual dev smoke

### Slice 6 — docs, review, push
- [x] ROADMAP M2 checkboxes, FEATURES §2 status, DECISIONS D-010 (faster-whisper) + D-011 (transcript persistence), ARCHITECTURE §4 note, SESSION_LOG Session 5
- [x] graphify update; code-review-and-quality pass; push

## Checkpoints
- [x] After Slice 3: backend pytest green (28) + real-model narration smoke (HTTP 200, words+pauses)
- [x] After Slice 4: frontend tests (47) + build + lint green
- [x] After Slice 5: dev-server transform smoke — all transcript modules serve 200 (see below); human browser pass on analyze/edit/seek still outstanding
- [x] After Slice 6: full suites (backend 28, frontend 47) + docs + code-review + push (origin/main @ e864f18)

### Verification summary (recorded in SESSION_LOG Session 5)
- Backend: 28 pytest passed. Live e2e via `say`-generated narration → 200, 16 words, confidence 0.13–0.99, pause detected.
- Frontend: 47 vitest passed, `tsc -b` build ok, oxlint 0 warnings.
- Dev smoke command: `npm run dev` in `frontend/`, then fetch `/`, `/src/components/TranscriptPanel.tsx`, `/src/store/transcriptStore.ts`, `/src/services/voice.ts` — all HTTP 200 (Vite transform success).

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| faster-whisper deps/model heavy on baseline laptop | High | CPU int8 tiny default; model cached project-local; interface keeps fake for tests |
| First-run model download slow/flaky | Med | Document; configurable model size; local-first cache in `models/` |
| Probabilistic transcript (not deterministic) | Med | Confidence exposed; word edits persist; real-model smoke is manual, not unit |
| Project-file change could break old files | Low | Optional `transcripts` key — version stays 1 (verified by existing parse tests) |

## Open Questions
- None. Model size tuning deferred to baseline-hardware test.