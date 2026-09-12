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
- [x] After Slice 5: dev-server transform smoke (200s on all new modules); HUMAN BROWSER PASS still outstanding
- [x] After Slice 6: full suites + docs + code-review + push

## M3 Semantic image matching — first slice (active) — SPEC-image-matching.md, tasks/plan.md
- [ ] Slice 1: `embedding-core` — CLIP ONNX lazy loader + Pillow preprocess + text encode + scoring helpers (backend, TDD)
- [ ] Slice 2: `match-api` — `POST /api/match` repetition-aware assignments/confidence/alternatives/timings (backend, TDD)
- [ ] Slice 3: `beat-segmentation` — transcript → visual beats (pure TS, TDD)
- [ ] Slice 4: `semantic-matching` — match client + store autoMatch (one undo step) + clip.beatId persistence (frontend)
- [ ] Slice 5: `matching-ui` — MatchPanel Auto-match + confidence + alternatives replace + states + CSS

## M3 remainder: timing fit + manual timing override (slice-set B, closed 2026-09-12) — SPEC-timing-pacing.md, tasks/plan-timing.md
- [x] Slice 1: `timing-core` — pure timing math (`editor/timing.ts`) + 11 tests — `0bace75`
- [x] Slice 2: `store-override` — re-match preserves manual timing, `kept` count, one undo step — `ca7f02b`
- [x] Slice 3: `panel-note` — kept-overrides line + narration-duration horizon in MatchPanel — `3e52173`
- [ ] Slice 4: docs (D-014, ROADMAP, SESSION_LOG 7) + graphify + regression + **push (user go-ahead)**
- [ ] Slice 6: docs (D-012/D-013, ROADMAP M3, SESSION_LOG 6) + graphify + review + push

Checkpoints:
- [ ] After Slice 1: real-model Embedder smoke on this machine (onnxruntime 1.17.3 opset)
- [ ] After Slice 2-3: backend + frontend focused suites green
- [ ] After Slice 4: undo-restore test + persistence round-trip green
- [ ] After Slice 5: dev transform smoke; human browser pass documented
- [ ] After Slice 6: full suites + docs + review + push
## M4 transitions-core (active) — SPEC-m4-capability-map.md, SPEC-transitions-core.md, tasks/plan-tc.md
- [x] Slice 1: model + constants + clamps (`transitions.ts`)
- [x] Slice 2: heuristics `evaluateTransitions` (continuity→match, gap≥0.5→dissolve, default cut, no wipe/zoom)
- [x] Slice 3: `validateTransitions` + `overrideTransition`/`removeTransition` ops
- [x] Slice 4: `TimelineModel.transitions` + project round-trip (version 1)
- [x] Slice 5: docs (D-016, ROADMAP, FEATURES, SESSION_LOG 9) + graphify + regression + push (go-ahead)

Checkpoints:
- [x] After Slice 4: frontend vitest + build + lint green
- [ ] After Slice 5: full regression + docs + push

## M4 transitions-render (active) — SPEC-transitions-render.md, tasks/plan-tr.md
- [x] Slice 1: pure graph builder (BetweenSpec/EdgeSpec, xfade map, offsets, fold) — TDD
- [x] Slice 2: render() integration (parity when empty, real dissolve render)
- [x] Slice 3: /api/render optional `transitions` field + error codes
- [ ] Slice 4: docs (D-017) + regression + push (go-ahead)

## M4 module 3 — transitions-ui (SPEC-transitions-ui.md)

### Phase 1: Store
- [ ] Task 1: Store state + actions (`transitions`, `selectedTransitionId`, `suggestTransitions`, `overrideTransition`, `removeTransition`, `resolveInvalidTransitions`, `setSelectedTransitionId`), initialState, loadProject, partialize/equality.
  - Checkpoint: vitest green, build clean.

### Phase 2: Inspector pane
- [ ] Task 2: `TransitionsPanel` + CSS; mount in `InspectorPanel`.

### Phase 3: Timeline chips
- [ ] Task 3: `TransitionOverlay` per lane (between + edge chips, click-to-select) + CSS; mount in `TrackRow`.
  - Checkpoint: all spec criteria pass; vitest ≥104, build, lint.

### Phase 4: Docs
- [ ] Task 4: D-018, FEATURES, UI_SPEC, SESSION_LOG 11, ROADMAP tick, plan/todo ticks, graphify, regression; commit+push on go-ahead.
