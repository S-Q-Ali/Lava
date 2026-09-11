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
- [x] FFmpeg probe/render via local media sidecar (`backend/`, FastAPI + project-local FFmpeg)
- [ ] Timeline editing UX (drag-move, drag-trim, ripple)
- [ ] Project save/load to disk
- [ ] Audio mixing in render (voice/music/SFX tracks; currently image/video tracks render)

## Milestone 2 — Voice analysis
- ASR
- Timestamps
- Pauses
- Segmentation
- Editable transcript

## Milestone 3 — Semantic image matching
- Image analysis
- Embeddings/features
- Scoring
- Confidence
- Automatic timing
- Manual override

## Milestone 4 — Transition/animation engine
- Clean cuts
- Contextual transitions
- Image motion
- Retention-oriented heuristics
- Editable transition decisions

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

Current status: Milestone 0 done. Milestone 1 mostly done — image/video rendering now works through the local media sidecar; remaining: timeline drag/trim UX, project save/load, and audio-track mixing in render.