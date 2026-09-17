# Implementation Plan: Responsive Professional Editor UX

## Overview

Make the React frontend usable as a responsive, editor-first Windows desktop
application across common desktop resolutions and narrow/resized desktop
windows. Every visible editor surface must have a
real interaction path, explicit empty/loading/error/success states, and tests
for the behavior it owns. The implementation preserves the product rules:
clean cuts by default, editable AI output, confidence and manual override,
local-first processing, proxy previews, and no silent data loss.

This plan is separate from the existing `tasks/plan.md`, which tracks an older
semantic-matching slice and must not be overwritten.

## Skills and references loaded

- `frontend-ui-engineering`: responsive layout, accessibility, focused
  components, meaningful states, and avoidance of generic AI UI.
- `spec-driven-development`: capability map, gated specification, measurable
  success criteria.
- `planning-and-task-breakdown`: dependency-first vertical slices and
  checkpoints.
- `test-driven-development`: regression tests before behavior changes and
  state-based assertions.
- Repository references: `AGENTS.md`, `CONSTRAINTS.md`,
  `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/UI_SPEC.md`,
  `docs/FEATURES.md`, `docs/TEST_PLAN.md`, and `docs/ROADMAP.md`.

## Capability map

| Module | Responsibility | Depends on |
| --- | --- | --- |
| editor-shell | Responsive zones, panel navigation, breakpoints, resize behavior | — |
| preview-transport | Preview playback, seeking, media states, render feedback | editor-shell, editor store |
| timeline-editing | Selection, split, delete, move, trim, ripple/cross-track behavior, zoom and seek | editor-shell, editor store |
| asset-workflows | Import, media browser, project save/open, proxy/error states | editor-shell, services |
| ai-workflows | Voice analysis, matching, captions, transitions, manhwa correction | asset-workflows, backend APIs |
| inspector-tools | Selection-aware inspector, motion, captions, presets/fonts, export | editor-shell, editor store |
| verification-hardening | Accessibility, responsive browser checks, performance and regression gates | all modules |

Build order: `editor-shell` → `preview-transport` and `timeline-editing` →
`asset-workflows` → `inspector-tools` and `ai-workflows` → verification.

## Success criteria

- Desktop layout keeps the four editor zones: navigation/media, preview,
  inspector/AI tools, and timeline/assets.
- At narrow desktop window widths, no content is clipped or made unreachable;
  side panels become collapsible/dockable regions and timeline remains
  horizontally scrollable with usable controls.
- Mouse and keyboard are the primary input methods; controls retain precise
  hit targets and keyboard access rather than mobile-specific UI.
- Preview play/pause, seek, volume/mute, display mode, fullscreen and render
  report real state changes and actionable errors.
- Timeline selection, seek, split, delete, move, trim, zoom, transition and
  caption interactions update the store, preview and inspector consistently;
  undo/redo remains correct.
- Media import, project save/open, proxy generation, voice analysis, image
  matching, captions, transitions, manhwa correction, templates/fonts and
  export expose working loading, empty, error and success states.
- AI-generated changes remain editable and never overwrite manual edits.
- Existing frontend/backend tests remain green; new behavior has focused tests.
- `npm run build` and `npm run lint` pass; frontend bundle remains under the
  repository's 500 kB gzip limit.
- Keyboard/accessibility checks and a real browser responsive smoke pass are
  recorded before the feature is marked complete.

## Phases and tasks

### Phase 0: Baseline and interaction inventory

- [ ] Record current build, lint, Vitest count, and known runtime failures.
- [ ] Map every button, select, input, drag target and navigation item to its
      handler/store/API path.
- [ ] Identify placeholder surfaces and dead controls; do not replace them with
      fake success states.
- [ ] Add a responsive test fixture/matrix for common desktop resolutions and
      narrow resized windows.

### Phase 1: Responsive editor shell

- [ ] Define layout tokens and breakpoints in `App.css`/shared styles.
- [ ] Implement desktop grid sizing with safe min/max columns and resizable or
      collapsible side regions where practical.
- [ ] Implement narrow-window collapse/drawer behavior for left and right
      workspaces.
- [ ] Keep preview, inspector and horizontally scrollable timeline/assets usable
      without body overflow in a resized desktop window.
- [ ] Add visible panel labels, close/back controls, focus handling and ARIA
      relationships for drawers.
- [ ] Verify all existing components fit their containers at every breakpoint.

### Checkpoint A: shell

- [ ] No horizontal page overflow at target widths.
- [ ] All four editor zones are reachable.
- [ ] Keyboard focus order is logical and Escape closes transient drawers.
- [ ] Existing component tests, build and lint pass.

### Phase 2: Preview and transport vertical slice

- [ ] Add tests for play/pause, seek, clip boundary changes, media load/error
      and empty project behavior.
- [ ] Make preview use the active clip at the playhead consistently rather than
      only the selected clip when selection is stale.
- [ ] Harden image/video/audio preview states, metadata duration, volume/mute,
      display mode and fullscreen error handling.
- [ ] Surface backend health/render availability before render and show progress,
      success download/playback, and recoverable errors.
- [ ] Verify preview on normal and narrow desktop layouts.

### Phase 3: Timeline editing vertical slice

- [ ] Add tests for click-to-seek, selection, split/delete, move, trim,
      ripple/cross-track behavior, transitions, captions, undo and redo.
- [ ] Make the ruler and lanes share one scroll coordinate system.
- [ ] Add touch/pointer-safe drag and trim affordances while preserving precise
      mouse editing.
- [ ] Ensure selected clip/transition/caption is reflected in the inspector and
      preview.
- [ ] Add empty timeline guidance and invalid/orphaned transition messaging.
- [ ] Verify timeline at short, long and zero-asset projects.

### Checkpoint B: editor core

- [ ] Core edit sequence works: import → place → select → trim/move → split →
      undo/redo → preview.
- [ ] No edit silently changes a user override.
- [ ] Focused timeline and preview tests pass.

### Phase 4: Assets and project workflows

- [ ] Verify import for image/video/audio, duplicate names, unsupported files,
      cancel and large files.
- [ ] Make asset browser responsive with usable thumbnails, selection, search or
      filtering where already supported, and clear empty/error states.
- [ ] Verify project save/open round-trip, malformed file errors and recovery.
- [ ] Verify proxy loading/failure and original asset preservation.
- [ ] Ensure bottom assets area is reachable on narrow screens without covering
      timeline controls.

### Phase 5: Inspector and AI workflow completion

- [ ] Make inspector selection-aware and responsive for motion, captions,
      transitions, presets, fonts, matching, transcript and export.
- [ ] Verify voice upload → analysis → editable transcript → visual beats →
      match → confidence/alternatives → editable timeline.
- [ ] Verify caption generation/edit/style/duration/removal and manual override
      preservation.
- [ ] Verify transition suggestion/edit/remove/invalid resolution and clean-cut
      default.
- [ ] Verify manhwa upload → detection → confidence → split/merge/crop/delete/
      add/reorder/reset → original-resolution export.
- [ ] Replace any remaining “Coming soon” or inert controls with either a real
      implementation or a clearly documented disabled state with a reason.

### Phase 6: Verification and release-quality pass

- [ ] Run focused frontend tests after every vertical slice.
- [ ] Run full `npx vitest run`, `npm run build`, and `npm run lint`.
- [ ] Run backend pytest for touched API contracts.
- [ ] Run browser smoke tests at common desktop resolutions and narrow resized
      desktop dimensions.
- [ ] Run accessibility checks for critical editor surfaces.
- [ ] Check bundle size, render responsiveness and baseline hardware behavior.
- [ ] Review diff, update Graphify, `docs/UI_SPEC.md`, `docs/FEATURES.md`,
      `docs/ROADMAP.md`, `docs/SESSION_LOG.md`, and `docs/DECISIONS.md` when
      behavior or architecture changes.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Responsive CSS hides editor controls | High | Drawer/tab navigation with explicit focus and close behavior; browser matrix |
| Timeline interactions diverge from store state | High | Test operations and store outcomes before visual refactors |
| Browser media APIs fail for local files | High | Preserve sidecar/provider abstraction and actionable health/error states |
| Large AI/model operations appear frozen | Medium | Progress/indeterminate states, lazy loading, cancellation where supported |
| Scope becomes too large for one pass | High | Ship vertical slices at checkpoints; do not mark later modules complete early |
| Low-end baseline becomes sluggish | Medium | Proxy previews, bounded rendering, measured performance checks |

## Open decisions for implementation

- Exact breakpoint values and whether desktop sidebars should be user-resizable
  or only collapsible.
- Whether mobile editing is full editing parity or a focused review/edit subset;
  this plan assumes all core edits remain available, with drawers and scrolling.
- Which currently inert navigation destinations should become real project
  management surfaces in this pass versus remain explicitly disabled.
