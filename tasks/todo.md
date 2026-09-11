# Task list

## M1 completion: project save/load + timeline drag/trim UX (closed 2026-09-12)
- [x] Task 1: project serialization (`editor/project.ts`) — 9 tests green
- [x] Task 2: `loadProject` store action + tests — 2 tests green
- [x] Task 3: Save/Open UI (topbar + `services/projectIO.ts`) — build/lint green
- [x] Task 4: clip drag-move UX — one undo step, live preview
- [x] Task 5: clip drag-trim UX — left/right handles, clamped
- [x] Task 6: CSS + full verification + docs (D-009, Session 4) + graphify + commits

## M2 Voice analysis — first slice (active) — SPEC-voice-analysis, tasks/plan.md
- [ ] Slice 1: `pause-segmentation` — pure word-gap pause/segment logic + unit tests
- [ ] Slice 2: `transcribe-api` — Transcriber interface + fake, `POST /api/transcribe` contract + tests
- [ ] Slice 3: faster-whisper adapter — CPU int8, project-local model cache, real-path smoke
- [ ] Slice 4: `transcript-state` — frontend client + store slice + project `transcripts` key + tests
- [ ] Slice 5: `transcript-ui` — InspectorPanel Analyze/transcript/word-seek/word-edit + states + CSS
- [ ] Slice 6: docs (ROADMAP/FEATURES/DECISIONS D-010+D-011/ARCHITECTURE/SESSION_LOG 5) + graphify + review + push

Checkpoints:
- [ ] After Slice 3: backend pytest green + real-model smoke
- [ ] After Slice 4: frontend tests + build green
- [ ] After Slice 5: manual browser check (analyze/edit/seek/states)
- [ ] After Slice 6: full suites + docs + code-review + push