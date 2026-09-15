# AI Video Studio — Roadmap

> **How to read this doc** — WHAT: the milestones and each line of work. WHY: milestones bottom-up — infrastructure (M0), then the two differentiator pipelines (voice→images first because it is the core product promise, Manhwa extraction second), then everything they share (captions, templates, timeline polish). HOW: each milestone is a horizontal slice with its own DoD; see the Definition of done below, `DECISIONS.md` for the "why" of specific choices, and `SESSION_LOG.md` for what has actually shipped.
>
> Persistent companion docs: `DECISIONS.md` (decisions + rationale), `SESSION_LOG.md` (session-by-session record).

Definition of done for ANY milestone installments within it: implementation exists, UI path exists where applicable, error states exist, manual override exists where required, tests exist and pass, performance is acceptable for baseline hardware (or the limitation is documented), documentation is updated, no unrelated regressions, and Graphify/project knowledge is updated when the architecture changes.

## Milestone 0 — Repository bootstrap
- [x] OpenCode project configuration
- [x] AGENTS.md
- [x] Skill discovery/loading
- [x] Graphify integration
- [x] Project-local environments/cache strategy

## Milestone 1 — Media foundation
- [x] Asset import (web importer: images, video, audio + metadata)
- [x] Project model (editor store with undo/redo)
- [x] FFmpeg provider (web HTTP → `backend/` sidecar renders images/videos to `mp4`)
- [x] Preview (image/video/audio at playhead; render button produces a real output video)
- [x] Timeline skeleton (7 tracks, clips, playhead, split/delete/select)
- [x] Timeline editing UX — drag-move and edge-trim on clips (one undo step per gesture)
- [x] FFmpeg probe/render via local media sidecar (`backend/`, FastAPI + project-local FFmpeg)
- [x] Project save/load to disk (versioned `lava-studio` JSON via topbar Save/Open)
- [x] Ripple editing — moving a clip shifts following clips on the same track (`moveClipRipple`, M8)
- [x] Cross-track clip drag — vertical drag past a lane height moves the clip to the adjacent track (`moveClipToTrack`, M8)
- [x] Audio mixing in render — voice/music/SFX mixed into output via `amix` (`audio_files` on `/api/render`, M8)

## Milestone 2 — Voice analysis
- [x] ASR engine (faster-whisper, CPU int8, project-local model cache)
- [x] Word timestamps
- [x] Pause detection (threshold 0.3s default)
- [x] Segment-level transcript (whisper segments)
- [x] Editable transcript (word-text edits, undoable, persisted in project file)
- [ ] Timing-edit / re-segmentation from edits (deferred to M3)
- [ ] Semantic visual-beat matching over transcript (M3)

## Milestone 3 — Semantic image matching
- [x] CLIP ViT-B/32 ONNX embeddings (project-local `models/clip/`, fp32 default)
- [x] `POST /api/match` — beat→image assignment with confidence + top-3 alternatives, repetition penalty
- [x] Beat segmentation from transcript (sentence ends + pauses ≥ 0.4s)
- [x] Auto-place image track in one undoable step (`clip.beatId`/`confidence` persist, version stays 1)
- [x] MatchPanel UI (auto-match, per-clip confidence, alternatives replace) — M3 first slice complete
- [x] Manual trim/reorder of matched clips — re-matches preserve user timing edits (override-first, `kept` count); baseline trim/move/split already editable
- [x] Timing fit/automatic duration from narration pacing — edge-only floor (`MIN_AUTO_DURATION` 0.5s) + tail hold (0.3s) bounded by narration-audio horizon; interior beats never extended (sync-first)
- [x] Mixed-language (Urdu/Roman-Urdu) matching quality pass (multilingual model)

## Milestone 4 — Transition/animation engine
- [x] Clean cuts — the default; no transition object in the model means cut (transitions-core)
- [x] Transition model + persistence — typed between/edge transitions, top-level `transitions` key, version stays 1
- [x] Contextual suggestion heuristics — continuity → match cut, matched-beat gap ≥ 0.5s → dissolve; everything else stays cut; never suggests wipe/zoom
- [x] Editable transition decisions — manual override/remove are pure ops, persist, never overwritten
- [x] Transitions in the renderer — `xfade` (dissolve→fade, between fade→fadeblack), edge `fade` filters, match/cut = plain concat; offsets = Σdur−ΣD; wipe/zoom → 422 (`transitions-render` complete)
- [x] Transition timeline UI — chips on the cut boundary/edges, click-select, inspector pane with rationale + type/duration override + remove + invalid-resolve (`transitions-ui` complete)
- [x] Image motion (ken-burns) — `image-motion` module complete: per-clip pan/zoom presets + strength, inspector + marker, zoompan prep, composes with xfade fold, parity preserved
- [ ] Retention-oriented heuristics (measurable only, no viral claims)

## Milestone 5 — Caption engine
- [x] Multilingual ASR (already shipped in M2/M3: faster-whisper + multilingual beat text)
- [x] Word timestamps (M2 transcript words reused onto caption items)
- [x] Caption renderer — libass `.ass` burn-in via `/api/render` optional `captions` field; karaoke `\k`, `{\rtl}` RTL, parity when absent, `CAPTION_INVALID` validation (`caption-render` complete)
- [x] All requested preset families — 15 original presets: normal, word-highlight, karaoke, important-word pop, punctuation, hook, manga/anime, cinematic, meme, storytelling, urdu (RTL), roman-urdu, english, mixed, emoji-optional (`caption-styles` complete)
- [x] Editable caption track — `CaptionItem` on `TimelineModel.captions` (version 1), transcript generation (pause-split, word timings), override-first re-generation (manual survives), CaptionPanel text/duration/style/remove, timeline caption blocks, render wire-up (`caption-core` + `caption-ui` complete)

## Milestone 6 — Template/font system
- [x] Font import — backend `/api/fonts` upload/list/file/delete, hand-rolled SFNT validation + family extraction, license metadata (`{type, source, embeddingAllowed}`), registry `fonts/licenses.json`; `ass=:fontsdir=` burn-in with byte-parity when no captions (`font-system` module complete)
- [x] Preset registry — `Preset` extends `CaptionStyle` with `category` (13 constants) + `presetVersion/tags/licenseRef`; 15 built-ins category-mapped; `presets/registry.json`; read-only `GET /api/presets`; PresetPanel with category pills + cards + one-undo-step Apply; Trending updateable by JSON edit (`preset-registry` module complete)
- [x] Custom import — `lava-preset` envelope or bare dict import (ids forced `custom-`, category forced `Custom`, duplicate → 422 `PRESET_INVALID`, font `licenseRef` cross-checked), `POST/DELETE /api/presets` + `GET /api/presets/{id}/file` export; PresetPanel Import JSON button + custom Export/Remove (`preset-import` module complete)
- [x] License metadata — font-side shipped with `font-system`; preset/render tracking now closes M6: pure `licensing.py` resolver matches caption `fontFamily` → registry by family and returns a used-font manifest or {`FONT_LICENSE_NOT_EMBEDDABLE`, `FONT_MISSING`} violations; `POST /api/render` aborts on violations (422 `FONT_LICENSE`, actionable detail — no silent fallback) and returns `fonts: [{family, fontId, license}]` on success; frontend mirrors `RenderResult.fonts` + PresetPanel badge shows bound family + embedding status (`license-tracking` module complete — all M6 rows closed)
- [x] Template editor — immutable `PresetDraft` model (`draftFromPreset`/`updateDraft`/`finalizeDraft`, size clamped 8–240) with `customIdForLabel` slug ids; `PUT /api/presets/{id}` custom overwrite (built-in → 403, id-bound, full import validation incl. licenseRef); `presetStore.savePreset` POST/PUT; `TemplateEditorPanel` in Inspector (base select, font/size/colors/outline/alignment, 8 M5 flag toggles, live preview, Save-as-new + Overwrite); render path now resolves preset-applied caption styles instead of falling back to `normal` (`template-editor` module complete)
- [x] Animated captions — five named treatments as text-level libass recipes in the pure ASS generator (`kinetic` word-by-word alpha+scale reveal on `words[]` timing, `manga` impact punch, `cinematic` fade+scale, `meme` punch/wobble, `storytelling` gentle fade+scale); `animation` enum on style/preset/draft/render-wire, M5 `manga`/`cinematic`/`meme`/`storytelling` presets annotated, TemplateEditorPanel Animation control; karaoke keeps precedence (`animated-captions` module complete). Pixel-space frame effects (speed lines, letterbox bars, motion preview) deferred to M8 preview overlay.

## Milestone 7 — Manhwa extractor
- ✅ Module 1 — `panel-model` (Panel model, boundary-anchored scaling, asset naming, git-clean StripRegistry)
- ✅ Module 2 — `panel-detection` (OpenCV hybrid signals → analysis-space cuts → source-space panels + registry)
- ✅ Module 3 — `panel-order` (reading order, per-boundary confidence, overlap guard)
- ✅ Module 4 — `panel-export` (PNG default, JPG, original-res crops)
- ✅ Module 5 — `panel-correction` (Split/Merge/Adjust/Delete/Add/Reorder/Redetect/Reset)
- ✅ Module 6 — `manhwa-api` (upload+detect, list/detail, correction ops, export, asset serving) — **M7 backend done**
- ✅ Module 7 — `panel-ui` (long-strip drop, detection review, correction actions, export download) — **M7 complete**

## Milestone 8 — Integrated editor
- [x] Combine all systems (media, voice, matching, transitions, captions, templates, manhwa all live in the editor)
- [x] Polish timeline — ripple editing (following clips shift on move; `moveClipRipple`)
- [x] Audio mixing in render — voice/music/SFX tracks mixed into output via `amix` (`audio_files` on `/api/render`)
- [x] Caption live preview overlay — styled caption renders at the playhead in the preview stage
- [x] Pixel-space animations — manga speed lines + cinematic letterbox bars as ASS drawing payloads
- [x] Animation motion preview — CSS approximations of the five treatments loop in the template editor
- [x] Manhwa drag reorder — HTML5 drag-and-drop on panel rows applies the reorder correction op
- [x] Cross-track clip drag — vertical drag moves clips between the 7 tracks
- [x] Project save/load + undo/redo (shipped M1; regression-verified through M7)
- [ ] Performance work (proxy previews, memory tuning — M9 hardware validation)

## Milestone 9 — Hardware validation
- [x] Proxy preview — deterministic SHA-prefix proxy service (`POST/GET /api/proxy`): WebP images (max 480×960) / MP4 video (height ≤480, 15fps, ≤120s), cache under `cache/backend/proxy`, frontend lazy resolve + memoized PreviewPanel render; render path untouched. Backend 404 → 428, frontend 284 → 297 (D-033)
- [x] Runtime optimization — lazy model factories (matcher/transcriber built on first use, startup touches no model bytes), all blocking FFmpeg/ONNX/whisper work offloaded to threads (`asyncio.to_thread`) so health answers during render, configurable render timeout (`render.timeoutSeconds` default 600 → `renderTimeoutMs` on health, 600s client abort). Backend → 437, bundle baseline 91.8 kB gzip (≤500 kB gate) (D-034)
- [x] Memory/performance optimization — manhwa JPEG draft decode at analysis resolution (full strip never fully decoded unless crops are saved), export zips streamed from a spooled temp file (lazy panel encode, 64 KiB chunks out), `POST /api/gc` proxy cache GC (`gc.proxyTtlDays`, dry-run support), `motion.upscaleFactor` config knob (default 3). Backend → 457 (D-035)
- [x] Measurement — `docs/M9-MEASUREMENT.md` (7-item checklist, memory snapshot methodology, `tools/m9-macro-bench.py` machine-agnostic). Mac row logged as the M9 validation pass. Backend → 457 (D-036, D-037)
- [x] Machine-agnostic validation — the gate runs on whatever machine is available; Mac row passes (2.47 s full render, bound ≤ 120 s). Low-end targets (HP Pavilion 15) remain representative but optional (D-037)
- [x] CPU fallback — design floor retained (no GPU-only models, CLIP/whisper on CPUExecutionProvider), validated on the logged machine; weak-hardware confirmation optional (D-037)

## Milestone 9.5 — Beta impression

Beta = feature-complete, every authored CI gate green, awaiting hands-on testing
(D-038). Final = beta + M10 release hardening. The tag `v0.1.0-beta.0` is the
beta cut; hands-on testers run from source on whatever machine they have and
log into `docs/M9-MEASUREMENT.md` + `docs/M10-measurement.md` (optional rows).

- [x] Beta meaning + phase — D-038 locked; beta/final split documented; versions → `0.1.0-beta.0` (backend + frontend), git tag `v0.1.0-beta.0` on the beta cut
- [x] Hands-on validation slice — M9 macro bench is runnable on any machine; Mac row closes the authored-side gate; extra machine rows optional (D-036/D-037 mandate)

## Milestone 10 — Release hardening
- Packaging
- Installer/local app workflow
- Crash/error reporting
- Docs
- Regression suite

## Status legend

- ⬜ Not started (documentation-only phase)
- 🔄 In progress
- ✅ Done

Current status: Milestones 0–4 done. Milestone 5 (caption engine) done — transcript-generated editable captions with 15 original style presets and libass burn-in; animated treatments deferred to M6, live preview overlay to M8. **Milestone 6 (template/font system) complete** — module 1 `font-system`, module 2 `preset-registry` (13 categories, browsable, one-click apply), module 3 `preset-import` (import/export/delete, Custom writes, font licenseRef gate), module 4 `template-editor` (draft model, PUT overwrite, TemplateEditorPanel, preset-applied caption styles render resolved), module 5 `animated-captions` (five ASS treatments + `animation` on style/preset/draft/wire) and module 6 `license-tracking` (render-time guard — embedding-restricted or missing registry fonts abort with actionable 422, `fonts` manifest on success — closes the final M6 row). M6 pixel-space animation gaps (manga speed lines, cinematic letterbox, motion preview) recorded for M8 preview overlay. **Milestone 7 (Manhwa extractor)** — module 1 `panel-model` (frozen Panel model + boundary-anchored coordinate mapping + git-clean StripRegistry, backend 245 → 283), module 2 `panel-detection` (hybrid OpenCV pipeline: clean-gutter cuts at 0.95 + bordered rescue seams at 0.35 + sliver merge, bg anchored on the outer margin ring, ~12 deterministic fixtures, `build_panels` boundary-anchored source mapping, `detect_strip` original-res crops + idempotent registry, backend → 312, D-028), module 3 `panel-order` (pure normalization layer — `order_panels` reading order, `attribute_confidence` min-of-bounding-boundaries, `guard_layout` overlap/duplicate guards raising `ManhwaError`; detection delegates its ordering+confidence step to it; backend → 330, D-029) and module 4 `panel-export` (full-resolution PNG lossless default / JPG quality crops + `panel_###` manifest, asset-stable naming, `panel.order` is the sequencing authority; backend → 344, D-030) and module 5 `panel-correction` (pure ops — Split (id-stable, both halves user-corrected, confidence inherited), Merge (union, min confidence), Adjust bounds, Delete (may empty), Add (fresh id, 1.0 confidence), Reorder (exact permutation → `user_corrected`), Re-detect, Reset; `normalize_layout` validates like the guard but preserves the user's sequence so edits and reorders survive export; backend → 379, D-031) and module 6 `manhwa-api` (one router at `/api/manhwa` — upload+detect storing source + eager crops + registry under `cache/backend/manhwa`, list/detail metadata, correction ops persisted to the registry, panel PNG regenerated from the original, source serving, re-detect, strip delete, pg/JPG zip export with manifest; backend → 404, D-032) shipped. Module 7 `panel-ui` (frontend — `services/manhwa.ts` typed client with defensive parsers + `ManhwaError`, `store/manhwaStore.ts` status state machine with refresh/select/upload/apply/redetect/remove, `components/ManhwaPanel.tsx` read/review + correction actions + export, `App.tsx` left-rail Media|Manhwa tabs defaulting to Media, `.manhwa-*` CSS on existing tokens; frontend 253 → 284) shipped. **Milestone 7 complete.** **Milestone 8 (Integrated editor) nearly complete** — slice 1 timeline polish (ripple editing via `moveClipRipple`; audio mixing via `audio_files` + `amix` on `/api/render`), slice 2 caption live preview overlay (styled caption at the playhead in the preview stage), slice 3 pixel-space animations (manga speed lines + cinematic letterbox as ASS `{\p}` drawing payloads, escaped-brace `.format()` compatible) + animation motion previews (CSS keyframe approximations loop in the template editor), slice 4 manhwa drag reorder (HTML5 drag-and-drop on panel rows → exact permutation → reorder correction op), slice 5 cross-track clip drag (vertical drag past a lane height relocates the clip via `moveClipToTrack`). **M8 complete except performance work** (deferred to M9 hardware validation). Open follow-ups: M4 retention heuristics. Next milestone: M9 hardware validation.
