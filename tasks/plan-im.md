# Implementation Plan: image-motion (M4 module 4)

## Overview

Add restrained pan/zoom motion to still-image clips: model (`Clip.motion?`), per-clip
inspector controls, and renderer support via an animated-crop prep chain that composes with
the existing transitions fold. Motion is user-only (never auto-suggested), optional
everywhere, version stays 1.

## Architecture Decisions

- **`Clip.motion?`** rides on the clip object so project round-trip needs no schema work
  (clips pass through serialize/parse as raw records; `isClip` stays permissive).
- **`_prep_chain` refactor**: one per-stream chain builder used by both `_filter_complex`
  and `build_transition_graph`; `motion: None` reproduces today's string byte-for-byte
  (parity tests guard this), motion inserts `scale=F → crop(animate) → [scale=W:H for zoom]`.
- **Animation via `t`**: after `fps`, per-stream timeline starts at 0, so crop expressions
  using `t` are relative to clip time — no global-tracking needed; slides bounded by
  `(iw−W)·strength` etc.
- **Preset mapping** (fixed amplitudes, no curves):
  - pan-right: `x = (iw-W)*s*t/d`, `y=(ih-H)/2*s`
  - pan-left:  `x = (iw-W)*s*(1 - t/d)`
  - pan-down:  `y = (ih-H)*s*t/d`, `x=(iw-W)/2*s`
  - pan-up:    `y = (ih-H)*s*(1 - t/d)`
  - zoom-in:   window shrinks `W*F→W` (centered) then `scale=W:H`
  - zoom-out:  window grows `W→W*F` (centered) then `scale=W:H`
  where `F = 1+0.15·strength`, `s = strength`.

## Task List

### Phase 1: Backend motion filters (slice 1)
- [x] Task 1: `MotionSpec`, `RenderClip.motion`, `_motion_filters`,
      `_prep_chain` refactor (both paths), validation (`MOTION_INVALID`).
  - Acceptance: criteria 5–6, 8 (parity) pass as pure + smoke tests.
  - Verify: `uv run pytest tests/test_image_motion.py` (RED first) then full backend suite.
  - Files: `backend/src/lava_backend/media.py`, `backend/tests/test_image_motion.py` (new).

### Phase 2: API contract (slice 2)
- [x] Task 2: `/api/render` optional `motion` per clip (parse + validate + pass through).
  - Acceptance: criteria 6–7; real-ffmpeg HTTP smoke.
  - Verify: `uv run pytest tests/test_render.py`.
  - Files: `backend/src/lava_backend/main.py`, `backend/tests/test_render.py`.

### Checkpoint: 1–2
- [x] Backend suite green (85 + n), filter parity preserved.

### Phase 3: Frontend model + store (slice 3)
- [x] Task 3: `MotionType`/`MotionSpec` in `editor/types.ts`, `Clip.motion?`,
      `setClipMotion` action, round-trip test.
  - Acceptance: criteria 1–2.
  - Verify: `npx vitest run src/store/...` (RED first) then full frontend suite.
  - Files: `frontend/src/editor/types.ts`, `frontend/src/store/editorStore.ts`,
      `frontend/src/store/...test.ts`.

### Phase 4: Inspector controls + clip marker (slice 4)
- [x] Task 4: `MotionControls` in `InspectorPanel` (type select + strength range), motion
      marker in `ClipBlock`, CSS.
  - Acceptance: criteria 3–4; `App.test.tsx` mount stays green.
  - Verify: component tests + full frontend suite (122 + n), build, lint.
  - Files: `frontend/src/components/InspectorPanel.tsx`, `frontend/src/components/ClipBlock.tsx`,
      frontend tests, `App.css`.

### Checkpoint: full
- [x] All 8 criteria pass; frontend suite + build + lint, backend suite all green.

### Phase 5: Docs (slice 5)
- [x] Task 5: D-019 in `DECISIONS.md`, FEATURES §4, ROADMAP M4 complete,
      SESSION_LOG 12, UI_SPEC §8 note, plan/todo ticks, `graphify update .`, regression.
  - Files: `docs/*.md`, `tasks/*`. Commit + push on go-ahead.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| crop expressions integer/floor edge artifacts | Med | trailing `scale=W:H` normalisation; smoke test renders real output |
| Motion changes filter string → parity test breaks | High | `_prep_chain` returns identical string when motion None; parity test is contiguous |
| `t` origin differs after xfade/trim | Med | motion lives in per-stream prep before concat/xfade; smoke test with transition |
| Project round-trip drops motion | Med | clips pass as raw records; round-trip test asserts motion survives |

## Open Questions

- None.