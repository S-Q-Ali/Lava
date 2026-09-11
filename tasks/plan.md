# Implementation Plan: M1 completion — project save/load + timeline drag/trim UX

## Overview
Finish Milestone 1 (media foundation). The editor model, undo/redo, import and rendering already
ship. This slice adds: (1) versioned project files that serialize/restore the whole timeline model,
with Save/Open in the topbar; (2) direct manipulation on clips — drag to move, edge handles to
trim — each drag committing as one undo step (zundo `pause`/`resume`).

## Architecture Decisions
- Project file is JSON (`projectVersion: 1`, `app: 'lava-studio'`), encoding `TimelineModel`
  (tracks, assets, clips, playhead, selection). Media bytes are session-scoped in a browser
  (blob URLs) — the file persists structure + metadata; assets whose files are absent on load
  become available offline stubs. This is the honest M1 web scope; Tauri will persist real paths.
- Serialization/deserialization is pure logic in `frontend/src/editor/project.ts` (validates,
  throws `ProjectError` with a message) → unit-testable with vitest, matching the existing suite
  style (pure logic tests; no component test harness installed).
- `loadProject` hydrates the whole base state and clears undo history (like `reset`, but with data).
- Drag/trim use pointer capture in `ClipBlock`, live-update preview, and zundo
  `pause()` → drag → `resume()` so one gesture = one undo step (keep On page limits: min 0s start,
  min duration 0.1s; trim capped at the source asset duration when known).

## Task List

### Task 1: Project serialization (`editor/project.ts`) — S
- [x] `serializeProject(model)` → `ProjectFile`; `toProjectJson` stringify; `parseProjectJson` round-trip
- [ ] round-trip preserves tracks/assets/clips/playhead/selection
- [ ] rejects invalid JSON, unknown `projectVersion`, wrong `app`, malformed clip shapes with clear messages
- [ ] tests pass: `npx vitest run src/editor/project.test.ts`

### Task 2: `loadProject` store action — S
- [ ] hydrates base state and clears undo history (undo after load does nothing)
- [ ] tests pass: `npx vitest run src/store/editorStore.test.ts`

### Task 3: Save/Open UI (topbar + `services/projectIO.ts`) — M
- [ ] Save downloads `<lava-project-<ts>.lava.json>`; Open picks a file, parses, loads
- [ ] invalid/corrupt project shows an alert, does not clobber current project
- [ ] build + lint pass

### Task 4: Clip drag-move UX — M
- [ ] dragging a clip horizontally moves it live; one undo step per gesture
- [ ] clip stays on its track; negative start clamped
- [ ] build + lint pass

### Task 5: Clip drag-trim UX (edge handles) — M
- [ ] right handle extends/shortens duration; left handle moves start and adjusts duration
- [ ] clamped to 0.1s minimum and to source duration when known
- [ ] one undo step per gesture

### Task 6: CSS + verification + docs — S
- [ ] handles styled (visible on the active clip), grab/resize cursors
- [ ] `npm run build`, `npm run lint`, `npx vitest run` all green
- [ ] manual smoke in browser via `npm run dev`
- [ ] SESSION_LOG entry (Session 4), ROADMAP checkboxes, FEATURES media-foundation status
- [ ] `graphify update .` + atomic commits + push

## Checkpoints
- After Task 2: vitest green in the touched suites.
- After Task 3: build + lint + tests green; Save/Open works by hand, corrupt file does not clobber.
- After Task 5: manual drag/trim test; after Task 6 full suite + docs + graph + commits.

## Risks and Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Blob/media URLs don't survive reload | High | Document honestly; structure persists, media bytes are a known browser limit; Tauri path later |
| zundo history flooding during drag | Med | `pause`/`resume` around each gesture |
| Drag vs. existing lane pointerdown (playhead seek) | Med | `stopPropagation` on clip pointerdown (already done) |
| Trim beyond source media | Med | clamp duration to `asset.meta.duration` when present |

## Open Questions
- None blocking. Cross-track drag and click-to-seek vs drag-start ambiguity deferred to next slice.