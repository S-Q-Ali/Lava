# Task list

> Living status file — mirrors `docs/ROADMAP.md`. Plan files: `tasks/plan-*.md` (per-module,
> closed when their module closes). Pushed = commit listed; authoritative status is ROADMAP/SESSION_LOG.

## M1 — Media foundation (closed, pushed)
- [x] Slice 1: project serialization (`editor/project.ts`) — 9 tests
- [x] Slice 2: `loadProject` store action + tests — 2 tests
- [x] Slice 3: Save/Open UI (topbar + `services/projectIO.ts`)
- [x] Slice 4: clip drag-move UX — one undo step, live preview
- [x] Slice 5: clip drag-trim UX — left/right handles, clamped
- [x] Slice 6: CSS + verification + docs (D-009, Session 4) + graphify + commits
- Open M1 follow-ups (not in this list): ripple editing, cross-track drag, audio mixing in render.

## M2 — Voice analysis (closed, pushed @ `e864f18`)
- [x] Slice 1: `pause-segmentation` pure word-gap pause/segment logic (12 tests)
- [x] Slice 2: `transcribe-api` contract + fake + tests (4 tests)
- [x] Slice 3: faster-whisper adapter — CPU int8, project-local model cache, real smoke
- [x] Slice 4: `transcript-state` — frontend client + store slice + project `transcripts` key
- [x] Slice 5: `transcript-ui` — InspectorPanel Analyze/transcript/word-seek/word-edit
- [x] Slice 6: docs (D-010/D-011) + graphify + review + push

## M3 — Semantic image matching (closed, pushed @ `79b2fb2`; timing set closed @ `ca1dd23`)
- [x] Slice 1: `embedding-core` — CLIP ONNX loader + Pillow preprocess + text encode + scoring
- [x] Slice 2: `match-api` — `POST /api/match` repetition-aware assignment/confidence/alternatives
- [x] Slice 3: `beat-segmentation` — transcript → visual beats (pure TS)
- [x] Slice 4: `semantic-matching` — match client + store autoMatch (one undo) + `clip.beatId`
- [x] Slice 5: `matching-ui` — MatchPanel Auto-match + confidence + alternatives replace
- [x] Slice 6: docs (D-012/D-013, SESSION_LOG 6) + graphify + review + push
- [x] Slice-set B (timing fit + manual override): `timing-core` (`0bace75`) + `store-override` (`ca7f02b`) + `panel-note` (`3e52173`) + docs (D-014, SESSION_LOG 7, `ca1dd23`)
- [x] Multilingual pass: spec+plan (`d0ce01b`) → multi-session embedder + auto-select (`79b2fb2`); D-015, SESSION_LOG 8

## M4 — Transition/animation engine (closed, pushed @ `0234747`)
### Module 1 — transitions-core (closed, pushed)
- [x] Slice 1: model + constants + clamps (`transitions.ts`)
- [x] Slice 2: heuristics `evaluateTransitions` (continuity→match, gap≥0.5→dissolve, default cut, no wipe/zoom)
- [x] Slice 3: `validateTransitions` + `overrideTransition`/`removeTransition` ops
- [x] Slice 4: `TimelineModel.transitions` + project round-trip (version 1)
- [x] Slice 5: docs (D-016, SESSION_LOG 9) + graphify + regression + push — `0141a89` → `7a6d51d`

### Module 2 — transitions-render (closed, pushed)
- [x] Slice 1: pure graph builder (BetweenSpec/EdgeSpec, xfade map, offsets, fold)
- [x] Slice 2: render() integration (parity when empty, real dissolve render)
- [x] Slice 3: /api/render optional `transitions` field + error codes
- [x] Slice 4: docs (D-017, SESSION_LOG 10) + regression + push — `e876a34` → `b304ce7`

### Module 3 — transitions-ui (closed, pushed)
- [x] Task 1: store state + actions + loadProject + partialize/equality — `9e7255a`
- [x] Task 2: TransitionsPanel (suggest/rationale/type+duration/remove/invalid-resolve) — `eca2384`
- [x] Task 3: TransitionOverlay chips per lane (between + edge, click-select) — `ae7e69b`
- [x] Task 4: docs D-018/ROADMAP/FEATURES/UI_SPEC/SESSION_LOG 11 + graphify + regression — `d263222`
- [x] (was-fix) React 19 `useShallow` getSnapshot fix + App mount regression guard — `28a078f`

### Module 4 — image-motion (closed, pushed @ `0234747`) — final M4 module
- [x] Task 1 (slice 1): MotionSpec, `RenderClip.motion`, `_motion_filters` (zoompan), `_prep_chain`, parity, MOTION_INVALID
- [x] Task 2 (slice 2): /api/render optional `motion` parse + validate (image-only) + pass-through
- [x] Task 3 (slice 3): `MotionSpec`/`MotionType` types, `Clip.motion?`, `setClipMotion`, round-trip
- [x] Task 4 (slice 4): InspectorPanel `MotionPanel` (type + strength) + ClipBlock marker + CSS
- [x] Task 5 (slice 5): docs D-019/ROADMAP M4 done/FEATURES/UI_SPEC/SESSION_LOG 12 + graphify + regression + push
- 5 commits: `60895b9` (spec) · `4008923` (slices 1-2) · `28c68cc` (slice 3) · `d31a92b` (slice 4) · `250e9f7`/`0234747` (docs/graph)

## M4 open
- [ ] Retention-oriented heuristics (measurable only, no viral claims) — dimensions to be defined in M5+ planning

## M5 — Caption engine (closed, pushed)
- [x] Capability map approved + committed (`9851231`)
### Module 1 — caption-core (closed)
- [x] Slice 1: caption model + constants + clamps + `isCaption`
- [x] Slice 2: `segmentCaptions` generation from transcript
- [x] Slice 3: edit ops (text/timing/remove/validate)
- [x] Slices 1-3 committed — `94b606d` (17 tests)
- [x] Slice 4: `TimelineModel.captions` + project round-trip — `cf7d9df`
- [x] Slice 5: store state + actions (override-first generate, one undo) — `0e69e50` (8 tests)
### Module 2 — caption-styles (closed)
- [x] Preset catalog (15 families, safe stacks) + 7 tests — `5557f2a`
### Module 3 — caption-render (closed)
- [x] Spec (`docs/SPEC-caption-render.md`) + `captions.py` ASS generator + `/api/render` burn-in + parity + `CAPTION_INVALID` + real-ffmpeg pixel smoke — `9b97b2b` (backend 140 tests)
### Module 4 — caption-ui (closed)
- [x] CaptionPanel + timeline caption blocks + render wire-up + CSS — `83f2cc0` (frontend 174 tests)
- [x] Docs closure: D-020, ROADMAP M5 done, FEATURES §5, UI_SPEC, SESSION_LOG 13 + graphify + regression

## Milestones 6–10 (not started)
- M6 Template/font system · M7 Manhwa extractor · M8 Integrated editor · M9 Hardware validation · M10 Release hardening
## M6 — Module 1: font-system (SPEC-font-system.md, tasks/plan-font.md)
- [ ] Task 1 (slice 1): backend fonts.py (validation/SFNT name/registry) + config fonts_dir/presets_dir — RED tests
- [ ] Task 2 (slice 2): /api/fonts routes + GET file + DELETE + ass=:fontsdir= render wire — parity + real smoke
- [ ] Task 3 (slice 3): frontend editor/fonts.ts + services/fonts.ts + store/fontStore.ts + tests
- [ ] Task 4 (slice 4): FontPanel (list/import+license/@font-face preview/remove) + App regression
- [x] Task 5 (slice 5): docs D-021/ROADMAP M6/FEATURES/SESSION_LOG 14 + graphify + regression + push go-ahead

## M6 — Module 2: preset-registry (SPEC-preset-registry.md, tasks/plan-presets.md)
- [ ] Task 1 (slice 1): backend preset_registry.py (Preset/BUILTIN_PRESETS/13 categories/validate/load-save) — RED tests
- [ ] Task 2 (slice 2): GET /api/presets + registry smoke
- [ ] Task 3 (slice 3): frontend editor/presets.ts + store/presetStore.ts (load/byCategory/applyPresetToCaptions) + tests
- [x] Task 4 (slice 4): PresetPanel (category tabs + cards + apply) + InspectorPanel mount + App regression
- [x] Task 5 (slice 5): docs D-022/ROADMAP M6/FEATURES/SESSION_LOG 15 + graphify + regression + push go-ahead

## M6 — Module 3: preset-import (SPEC-preset-import.md, tasks/plan-preset-import.md)
- [x] Task 1 (slice 1): backend preset_import.py (custom- prefix/Custom force/licenseRef cross-check/export dict) — RED tests
- [x] Task 2 (slice 2): POST/DELETE /api/presets + GET /api/presets/{id}/file + registry write
- [x] Task 3 (slice 3): frontend services importPreset/deletePreset/exportPreset + presetStore import/remove + tests
- [x] Task 4 (slice 4): PresetPanel Import JSON + export/download + Remove (Custom) + error surfaces
- [x] Task 5 (slice 5): docs D-023/ROADMAP/FEATURES/SESSION_LOG 16 + graphify + regression + push go-ahead

## M6 — Module 4: template-editor (SPEC-template-editor.md, tasks/plan-template-editor.md)
- [x] Task 1 (slice 1): frontend templateEditor.ts (draft/updateDraft/customIdForLabel/finalizeDraft/resolveCaptionStyle) — RED units
- [x] Task 2 (slice 2): backend PUT /api/presets/{id} (200/403/404/422) + tests
- [x] Task 3 (slice 3): updatePreset service + presetStore.savePreset + CaptionPanel preset-style resolution
- [x] Task 4 (slice 4): TemplateEditorPanel (base select, controls, live preview, Save-as-new/Overwrite) + mount + CSS
- [x] Task 5 (slice 5): docs D-024/ROADMAP/FEATURES/SESSION_LOG 17 + graphify + regression + push go-ahead

## M6 — Module 5: animated-captions (SPEC-animated-captions.md, tasks/plan-animated-captions.md)
- [ ] Task 1 (slice 1): backend ASS animation (CaptionStyleSpec.animation + kinetic/manga/cinematic/meme/storytelling recipes) — RED captions tests
- [ ] Task 2 (slice 2): backend Preset.animation + enum validation + import/export passthrough
- [ ] Task 3 (slice 3): frontend CaptionAnimation + M5 preset annotations + parsePreset/captionStyleFromPreset/captionToWire passthrough
- [ ] Task 4 (slice 4): PresetDraft.animation + TemplateEditorPanel Animation select + tests
- [ ] Task 5 (slice 5): docs D-025/ROADMAP/FEATURES/SESSION_LOG 18 + graphify + regression + push go-ahead
