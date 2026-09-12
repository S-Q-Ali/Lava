# Spec: image-motion (M4 module 4)

Module id: `image-motion`. Depends on: `transitions-core`, `transitions-render`, `transitions-ui`.

## Objective

Give still image clips restrained, explainable motion (pan/zoom "Ken Burns") so matched
stills feel alive without violating the product's no-gimmick rules. Motion is:

- **A property of a clip** (`Clip.motion?`), inherited by the project file automatically
  (clips pass through serialization untouched; `version` stays `1`, field optional).
- **Editable**: per-clip type `<select>` + strength slider in the inspector; off by default
  (`none`); removing motion restores a static clip.
- **Explainable + cheap**: presets have fixed, boring amplitudes scaled by `strength`; no
  "viral" camera work. Suggested by the user only — Auto-match never invents motion.
- **Rendered in the same per-stream prep** as transitions (animated `crop` over an upscaled
  frame), so it composes with the xfade fold and transitions unchanged.

## Scope

- Backend:
  - `MotionSpec { type: str, strength: float }` (frozen dataclass); `RenderClip.motion:
    MotionSpec | None = None`.
  - `_motion_filters(motion, settings) -> list[str]` producing the animated-crop chain for
    `zoom-in`, `zoom-out`, `pan-left`, `pan-right`, `pan-up`, `pan-down` at a base zoom
    factor `F = 1 + 0.15 * strength`; window slide uses `t` over the clip duration.
  - `_prep_chain(clip, settings)` refactor shared by `_filter_complex` and
    `build_transition_graph`: when `clip.motion` is set the chain becomes
    `fps → scale/pad → scale=F → crop(animated) → setsar → trim → setpts` (pan types fixed
    window, zoom types `scale=W:H` after animated window) — **byte-identical** to today's
    chain when `motion is None` (parity preserved).
  - Validation: `MOTION_INVALID` (422) — unknown type or `strength ∉ [0,1]`; motion on
    non-image clips rejected by the endpoint (image files only).
  - `/api/render` clips entries gain optional `motion`.
- Frontend:
  - `MotionType` + `MotionSpec` in `editor/types.ts`; `Clip.motion?`.
  - Store action `setClipMotion(id, motion | undefined)` (flips `none`⇄preset; `none` clears).
  - `MotionControls` in `InspectorPanel` for the selected image clip: type `<select>` (none +
  6 presets) and a `strength` range input (0.1–1). Off → controls hidden/hint.
  - Small `motion` marker on clip blocks with motion (presentational only).
- Strictly out of scope: motion on video clips, multi-keyframe (position/time) curves,
  aut-`suggested` motion, pan for manhwa page crops (separate manhwa pipeline owns that).

## Commands

```
Frontend: npx vitest run ; npm run build ; npm run lint   (frontend dir)
Backend:  uv run pytest tests/                            (backend dir)
```

## Project structure (touched)

```
backend/src/lava_backend/media.py              → MotionSpec, _motion_filters, _prep_chain, RenderClip.motion
backend/tests/test_image_motion.py            → pure filter tests (new) + real-ffmpeg smoke
backend/tests/test_render.py                  → HTTP motion cases (extend)
backend/src/lava_backend/main.py               → parse optional motion in /api/render
frontend/src/editor/types.ts                   → MotionType, MotionSpec, Clip.motion?
frontend/src/store/editorStore.ts              → setClipMotion action
frontend/src/components/InspectorPanel.tsx     → MotionControls for selected image clip
frontend/src/components/ClipBlock.tsx          → motion marker
frontend/src/**/*.test.ts(x)                   → store + component tests (new)
frontend/src/App.css                           → slider/select/marker styles (no new layout)
```

## Code style

Same as existing: pure helpers separated, scalar store selectors (object-literal selectors
wrapped in `useShallow`), `aria-label` on controls, no comments, no new dependencies.
Backend: frozen dataclasses, pure filter-string helpers returning `list[str]`, existing
`ApiError` conventions.

## Testing strategy

- Vitest (frontend), pytest (backend). Every acceptance criterion below gets a test.
- Backend pure tests assert exact filter-string shapes (expressions present, bounded ranges,
  `F` math from `strength`, parity with the no-motion chain). One real-ffmpeg smoke: a
  motion clip renders (duration intact) and one motion+transition render keeps the same
  duration math.
- Frontend: store action tests (set/clear round-trip through loadProject/save), component
  tests (controls appear for image clip, update `motion`, marker on clip block), project
  round-trip already covered — new test asserts `motion` survives save/load.

## Boundaries

- Always: run backend + frontend suites and builds; `useShallow` for object selectors; motion
  stays optional everywhere.
- Ask first: new dependencies, changing `editor/types.ts` Clip in breaking ways, dropping the
  pattern of `_prep_chain` parity.
- Never: auto-suggest motion without user action; apply motion to non-image clips; promise
  virality; change project version.

## Success criteria (each testable)

1. Frontend: `Clip.motion` is typed `MotionSpec | undefined`; `none` clears it.
2. Frontend: `setClipMotion` updates and later `loadProject`/Save round-trips `motion`
   (project `version` unchanged).
3. Frontend: `MotionControls` renders for a selected image clip (type select + strength
   slider); changing type/strength updates store state; a non-image clip shows no controls.
4. Frontend: clip block with motion shows a small motion marker; without motion, none.
5. Backend: `_motion_filters` emits a `crop` with animated `x`/`y`/`w`/`h` expressions
   bounded by the upscale factor `F = 1 + 0.15*strength`; each of the 6 presets differs as
   documented; strength 0 → static chain (no motion filters).
6. Backend: `render` with a motion clip on an image renders (201 / valid job), output
   duration unchanged; a motion clip + a dissolve between clips renders at the same
   `Σdur − ΣD` as without motion.
7. Backend: unknown motion type or `strength` out of [0,1] → 422 `MOTION_INVALID`.
8. Regression: with no motion anywhere, the generated `filter_complex` is byte-identical to
   today's output (existing parity tests keep passing).

## Open questions

- None blocking. Zoom amplitude is baked as `F = 1 + 0.15·strength`; the strength slider maps
  linearly to `F`, and duration-based `t` drives drift. Sub-frame floored crop widths are
  normalised by a trailing `scale=W:H` for zoom presets.