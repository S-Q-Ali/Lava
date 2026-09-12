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
- [x] Timeline editing UX — drag-move and edge-trim on clips (one undo step per gesture); ripple-edit still open
- [x] FFmpeg probe/render via local media sidecar (`backend/`, FastAPI + project-local FFmpeg)
- [x] Project save/load to disk (versioned `lava-studio` JSON via topbar Save/Open)
- [ ] Ripple editing + cross-track clip drag
- [ ] Audio mixing in render (voice/music/SFX tracks; currently image/video tracks render)

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
- [ ] Transitions in the renderer (xfade/dissolve/fade) — `transitions-render` module
- [ ] Transition timeline UI (chips, select/override/explain) — `transitions-ui` module
- [ ] Image motion (ken-burns) — `image-motion` module
- [ ] Retention-oriented heuristics (measurable only, no viral claims)

## Milestone 5 — Caption engine
- Multilingual ASR
- Word timestamps
- Caption renderer
- All requested preset families
- Editable caption track

## Milestone 6 — Template/font system
- Preset registry
- Custom import
- Font import
- License metadata
- Template editor

## Milestone 7 — Manhwa extractor
- Detection pipeline
- Ordering
- Confidence
- Split/merge/manual correction
- Exports (PNG default, JPG)

## Milestone 8 — Integrated editor
- Combine all systems
- Polish timeline
- Project save/load
- Undo/redo
- Performance work

## Milestone 9 — Hardware validation
- Test on baseline HP Pavilion 15
- Proxy preview
- CPU fallback
- Memory/performance optimization

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

Current status: Milestone 0 done. Milestone 1 done — web editor imports media, edits clips (drag/trim/split/delete, undo/redo), saves/loads project files, and renders image/video tracks to `mp4` through the local media sidecar. Open M1 follow-ups: ripple editing, cross-track drag, audio mixing in render.