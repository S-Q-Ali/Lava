# Task List: Responsive Professional Editor UX

This checklist belongs to `tasks/plan-responsive-pro-editor.md`. Existing
`tasks/todo.md` remains unchanged because it tracks earlier work.

## Phase 0 — Baseline

- [x] Capture current frontend build/lint/test baseline
- [x] Inventory all interactive controls and placeholder surfaces
- [x] Add desktop-resolution and narrow-window test matrix

## Phase 1 — Responsive shell

- [x] Add layout tokens and breakpoints
- [x] Implement desktop grid constraints
- [x] Implement narrow-window side-panel collapse/drawers
- [x] Implement desktop navigation, preview, inspector and timeline access at narrow widths
- [x] Add focus management and accessible drawer controls

## Checkpoint A

- [ ] No body overflow at target viewports
- [ ] All editor zones reachable
- [ ] Focus and Escape behavior verified
- [ ] Build/lint/tests pass

## Phase 2 — Preview and transport

- [x] Test and fix playback/seek/media states
- [x] Fix active clip/playhead synchronization
- [x] Add audio playback and still-image playhead progression
- [x] Test volume, mute, display mode and fullscreen
- [ ] Test render availability, progress, success and failure

## Phase 3 — Timeline editing

- [x] Test and fix seek/selection/split/delete
- [x] Test and fix move/trim/ripple/cross-track
- [x] Make lanes/ruler scrolling consistent
- [x] Verify transition/caption selection and inspector sync
- [x] Verify undo/redo chains

## Checkpoint B

- [ ] Import → edit → preview → undo/redo flow passes
- [ ] Manual overrides remain intact
- [ ] Timeline/preview focused tests pass

## Phase 4 — Assets and projects

- [ ] Verify import edge cases
- [ ] Responsive asset browser
- [ ] Save/open round-trip and malformed file errors
- [ ] Proxy/original asset behavior

## Phase 5 — Inspector and AI workflows

- [x] Responsive inspector surfaces
- [ ] Voice/transcript/matching flow
- [ ] Caption flow
- [ ] Transition flow
- [ ] Manhwa correction/export flow
- [ ] Template/font/export flow
- [ ] Remove or explicitly disable remaining inert controls

## Phase 6 — Final verification

- [ ] Full frontend tests
- [ ] Frontend build and lint
- [ ] Relevant backend tests
- [ ] Browser desktop-resolution and narrow-window accessibility smoke
- [ ] Bundle/performance checks
- [ ] Diff review, docs update and Graphify update
