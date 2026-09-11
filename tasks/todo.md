# Task list

## M1 completion: project save/load + timeline drag/trim UX (closed 2026-09-12)
- [x] Task 1: project serialization (`editor/project.ts`) — 9 tests green
- [x] Task 2: `loadProject` store action + tests — 2 tests green
- [x] Task 3: Save/Open UI (topbar + `services/projectIO.ts`) — build/lint green
- [x] Task 4: clip drag-move UX — one undo step, live preview
- [x] Task 5: clip drag-trim UX — left/right handles, clamped
- [x] Task 6: CSS + full verification + docs (D-009, Session 4) + graphify + commits

## M2 Voice analysis — first slice (closed 2026-09-12, pushed @ e864f18)
- [x] Slice 1: `pause-segmentation` — pure word-gap pause/segment logic + unit tests (12 green)
- [x] Slice 2: `transcribe-api` — Transcriber interface + fake, `POST /api/transcribe` contract + tests (4 green)
- [x] Slice 3: faster-whisper adapter — CPU int8, project-local model cache, real-narration smoke (HTTP 200)
- [x] Slice 4: `transcript-state` — frontend client + store slice + project `transcripts` key + tests
- [x] Slice 5: `transcript-ui` — InspectorPanel Analyze/transcript/word-seek/word-edit + states + CSS
- [x] Slice 6: docs (D-010/D-011, ROADMAP, SESSION_LOG 5) + graphify + review + push

Checkpoints:
- [x] After Slice 3: backend pytest green (28) + real-model smoke
- [x] After Slice 4: frontend tests (47) + build + lint green
- [x] After Slice 5: dev-server transform smoke (200s on all new modules); HUMAN BROWSER PASS still outstanding (analyse/edit/seek feel)
- [x] After Slice 6: full suites + docs + code-review + push

## M3 Semantic image matching (planned next — SPEC-voice-analysis + SPEC-image-matching, tasks/plan.md)
- [ ] Planning: capability map + spec + plan (spec-driven-development) — IN PROGRESS
- [ ] Implementation slices: TBD after plan approval