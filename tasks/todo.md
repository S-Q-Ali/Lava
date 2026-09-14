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
- [x] Task 1 (slice 1): backend ASS animation (CaptionStyleSpec.animation + kinetic/manga/cinematic/meme/storytelling recipes) — RED captions tests
- [x] Task 2 (slice 2): backend Preset.animation + enum validation + import/export passthrough
- [x] Task 3 (slice 3): frontend CaptionAnimation + M5 preset annotations + parsePreset/captionStyleFromPreset/captionToWire passthrough
- [x] Task 4 (slice 4): PresetDraft.animation + TemplateEditorPanel Animation select + tests
- [x] Task 5 (slice 5): docs D-025/ROADMAP/FEATURES/SESSION_LOG 18 + graphify + regression + push go-ahead

## M6 — Module 6: license-tracking (SPEC-license-tracking.md, tasks/plan-license-tracking.md)
- [x] Task 1 (slice 1): backend licensing.py resolver (used-font descriptors + violations) — RED unit tests
- [x] Task 2 (slice 2): render endpoint guard (422 FONT_LICENSE) + RenderResult.fonts — RED API tests
- [x] Task 3 (slice 3): frontend RenderResult.fonts + RenderCaptionStyle.animation + PresetPanel badge title
- [x] Task 4 (slice 4): docs D-026/ROADMAP M6 complete/FEATURES/SESSION_LOG 19 + graphify + regression + push go-ahead

## M7 — Manhwa extractor (capability map SPEC-m7-capability-map.md)
Build order: panel-model → panel-detection → panel-order → panel-export → panel-correction → manhwa-api → panel-ui

### Module 1: panel-model (SPEC-panel-model.md, tasks/plan-panel-model.md)
- [x] Task 1 (slice 1): Panel model + bounds math + analysis↔source scaling + zero-padded asset naming + StripRegistry (atomic save/load/reset, corrupt → ManhwaError) — RED unit tests → 38 green, backend 283

### Module 2: panel-detection (SPEC-panel-detection.md, tasks/plan-panel-detection.md)
- [x] Task 1 (slice 1): fixtures + load_analysis_image + row_features + gutter-band cuts (clean fixtures pass exactly)
- [x] Task 2 (slice 2): rescue pass + MIN_PANEL_H merge + borderless/connected/decorative/bubbles/dense-text fixtures (backend 312)
- [x] Task 3 (slice 3): build_panels + detect_strip registry integration + error paths
- [x] Task 4 (slice 4): docs D-028/ROADMAP/FEATURES/SESSION_LOG 21 + graphify + regression + push go-ahead

### Module 3: panel-order (SPEC-panel-order.md, tasks/plan-panel-order.md)
- [x] Task 1 (slice 1): order_panels + attribute_confidence + guard_layout (+ _boxes_overlap) — pure RED→GREEN
- [x] Task 2 (slice 2): detect.build_panels delegates (single source of truth) + identity tests
- [x] Task 3 (slice 3): docs D-029/ROADMAP/FEATURES/SESSION_LOG 22 + graphify + regression + push go-ahead

### Module 4: panel-export (SPEC-panel-export.md, tasks/plan-panel-export.md)
- [x] Task 1 (slice 1): crop_panel + encode_panel (PNG lossless / JPG quality) — pure RED→GREEN
- [x] Task 2 (slice 2): manifest_rows + materialize_export (guard integration, ordered 1..n)
- [x] Task 3 (slice 3): docs D-030/ROADMAP/FEATURES/SESSION_LOG 23 + graphify + regression + push go-ahead

### Module 5: panel-correction (SPEC-panel-correction.md, tasks/plan-panel-correction.md)
- [x] Task 1 (slice 1): validate_layout + normalize_layout (order-preserving) + guard refactor
- [x] Task 2 (slice 2): split_panel / merge_panels / delete_panel
- [x] Task 3 (slice 3): adjust_panel / add_panel / reorder_panels / redetect
- [x] Task 4 (slice 4): export honors panel.order + docs D-031/ROADMAP/FEATURES/SESSION_LOG 24 + graphify + regression + push go-ahead

### Module 6: manhwa-api (SPEC-manhwa-api.md, tasks/plan-manhwa-api.md)
- [x] Task 1 (slice 1): storage helpers + GET strips / detail / source
- [x] Task 2 (slice 2): POST upload+detect / panel serve / DELETE / redetect / reset
- [x] Task 3 (slice 3): PATCH correction ops + GET export (zip)
- [x] Task 4 (slice 4): docs D-032/ROADMAP M7 backend done/FEATURES/SESSION_LOG 25 + graphify + regression + push go-ahead

### Module 7: panel-ui (SPEC-m7-panel-ui.md, tasks/plan-manhwa-ui.md)
- [ ] Task 1 (slice 1): services/manhwa.ts + tests
- [ ] Task 2 (slice 2): store/manhwaStore.ts + tests
- [ ] Task 3 (slice 3): ManhwaPanel review (drop/list/detail/previews/confidence)
- [ ] Task 4 (slice 4): ManhwaPanel actions (split/merge/crop/delete/add/reorder/redetect/reset/export)
- [ ] Task 5 (slice 5): App left-rail tabs + CSS
- [ ] Task 6 (slice 6): docs D-033/ROADMAP M7 complete/SESSION_LOG 26 + graphify + regression + push go-ahead

## M9 — Hardware validation (capability map SPEC-m9-capability-map.md)
Build order: proxy-preview → runtime-optimization → memory-tuning → baseline-validation

### Module 1: proxy-preview (SPEC-proxy-preview.md, tasks/plan-m9.md) ✓ DONE
- [x] Slice 1: proxy-core — `_file_hash`, `generate_image_proxy`, `generate_video_proxy`, `ProxyResult`, `Config.proxy_dir` + RED unit tests
- [x] Slice 2: proxy-api — `POST /api/proxy`, `GET /api/proxy/{proxyId}`, ProxyId gate + API tests
- [x] Slice 3: frontend — `services/proxy.ts`, `Asset.proxyUrl`, importer wiring, PreviewPanel memoization + tests
- [x] Slice 4: docs D-033/ROADMAP/FEATURES/SESSION_LOG 28 + graphify + regression + push

### Module 2: runtime-optimization ✓ DONE
- [x] Slice 1: lazy model factory — `_get_matcher()`, `_get_transcriber()` + tests
- [x] Slice 2: async render offload — `asyncio.to_thread` in render/proxy/match/transcribe + health concurrency test
- [x] Slice 3: configurable timeout — `render.timeoutSeconds` config + `renderTimeoutMs` health + `RENDER_TIMEOUT_MS` frontend + tests
- [x] Slice 4: frontend bundle baseline — 91.8 kB gzip / 307.2 kB raw ≤ 500 kB gate; CONSTRAINTS row filled
- [x] Slice 5: docs D-034/ROADMAP/SESSION_LOG 29 + graphify + regression

### Module 3: memory-tuning ✓ DONE
- [x] Slice 1: manhwa streaming decode — `Image.draft()` in detect + tests
- [x] Slice 2: export bundle streaming — disk-streamed zip + tests
- [x] Slice 3: cache GC — `gc.py` + `POST /api/gc` + tests
- [x] Slice 4: motion upscale config — `motion.upscaleFactor` + parity tests
- [x] Slice 5: docs D-035/ROADMAP/SESSION_LOG 30 + graphify + regression + push go-ahead

### Module 4: baseline-validation ✓ M9 CLOSED (D-036, D-037 — machine-agnostic, Mac row logged)
- [x] Slice 1: measurement checklist (`M9-MEASUREMENT.md`)
- [x] Slice 2: Mac reference measurement → M9 validation pass
- [x] Slice 3: CONSTRAINTS enforcement + ROADMAP M9 complete
- [x] Slice 4: docs D-036/D-037, SESSION_LOG 31+32, graphify, final push
- [x] D-037 reframe: validation machine-agnostic (optional per-machine rows incl. low-end)
