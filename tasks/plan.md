# Implementation Plan: M2 Voice analysis (first slice)

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
- [ ] `transcribe_core.py`: word-gap → `pauses` list; segments from whisper segments; confidence passthrough
- [ ] Tests: gap math, threshold boundary (≥0.3s), no-audio/empty, single word, identical timestamps
- [ ] Verify: `uv run pytest backend/tests/test_transcribe_core.py` green

### Slice 2 — transcribe-api contract
- [ ] `Transcriber` interface + fake; `POST /api/transcribe` route + response/error shape (`TRANSCRIBE_FAILED`, bad request 400)
- [ ] Tests: fake transcriber integration (http 200 shape), missing file, corrupt audio
- [ ] Verify: focused pytest green; `curl` smoke with generated audio optional

### Slice 3 — faster-whisper adapter
- [ ] `transcribers.py`: faster-whisper CPU int8, model from config (`models/` cache), downloads on first use
- [ ] Wire into route; keep fake for tests; manual smoke with real synthetic narration
- [ ] Verify: sidecar runs; `/api/transcribe` real path returns lyrics-timed transcript

### Slice 4 — transcript-state (frontend)
- [ ] `services/voice.ts` client + types; `transcriptStore` slice (per assetId: transcript/status/error)
- [ ] project.ts optional `transcripts` key (backward-compatible, D-009 extension); save/load round-trip
- [ ] Verify: vitest green; build+lint green

### Slice 5 — transcript-ui
- [ ] `TranscriptPanel` in InspectorPanel: Analyze button, pending/error/empty/success states, word-click seek, inline word-text edit, low-confidence flag; CSS
- [ ] Verify: build+lint+tests green; manual dev smoke

### Slice 6 — docs, review, push
- [ ] ROADMAP M2 checkboxes, FEATURES §2 status, DECISIONS D-010 (faster-whisper) + D-011 (transcript persistence), ARCHITECTURE §4 note, SESSION_LOG Session 5
- [ ] graphify update; code-review-and-quality pass; push

## Checkpoints
- After Slice 3: backend pytest green + one real-model smoke
- After Slice 4: frontend tests + build green
- After Slice 5: manual browser check of analyze/edit/seek
- After Slice 6: full suites + docs + review + push

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| faster-whisper deps/model heavy on baseline laptop | High | CPU int8 tiny default; model cached project-local; interface keeps fake for tests |
| First-run model download slow/flaky | Med | Document; configurable model size; local-first cache in `models/` |
| Probabilistic transcript (not deterministic) | Med | Confidence exposed; word edits persist; real-model smoke is manual, not unit |
| Project-file change could break old files | Low | Optional `transcripts` key — version stays 1 (verified by existing parse tests) |

## Open Questions
- None. Model size tuning deferred to baseline-hardware test.