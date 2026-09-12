# Implementation Plan: transitions-ui (M4 module 3)

## Overview

Wire the `transitions-core` model into the live editor: store state + actions, an inspector
pane with rationale/override/remove, and timeline chips. No renderer changes (done), no new
deps, project version stays `1`.

## Architecture Decisions

- **Transitions live in `editorStore`** (not a separate store): they are model data like
  `clips`, round-trip through `loadProject`/Save, and undo via the existing `temporal`
  middleware (partialize + equality gain `transitions`).
- **Selection is transient store state** (`selectedTransitionId`) mirroring `selectedClipId`;
  persist is unaffected (`partialize` excludes it).
- **Suggestions replace auto-only**: `suggestTransitions()` builds the auto list from current
  clips and keeps every `source === 'manual'` entry. This is the "no silent overwrite"
  guarantee and lives at the store boundary, not in the component.
- **No auto-prune**: clip edits that orphan a transition leave it in the model; the pane
  surfaces `validateTransitions` errors with an explicit resolve action.
- **No manual add**: creation stays suggestion-only.

## Task List

### Phase 1: Store (slice 1)
- [x] Task 1: Store state + actions (`transitions`, `selectedTransitionId`,
      `suggestTransitions`, `overrideTransition`, `removeTransition`,
      `resolveInvalidTransitions`, `setSelectedTransitionId`), `initialState`,
      `loadProject`, partialize/equality.
  - Acceptance: state round-trips; `reset()` zeroes it; suggest keeps manual;
    override flips source; remove is targeted; resolve clears only invalid.
  - Verify: `npx vitest run src/store/transitions.test.ts` (RED first), then full suite.
  - Files: `frontend/src/store/editorStore.ts`, `frontend/src/store/transitions.test.ts` (new).

### Checkpoint: 1–2
- [x] `npx vitest run` green, `npm run build` clean.

### Phase 2: Inspector pane (slice 2)
- [x] Task 2: `TransitionsPanel` component (+ empty guidance, Suggest button, rationale,
      type select, duration input, Remove, invalid banner + resolve) and CSS; mount in
      `InspectorPanel`.
  - Acceptance: criteria 1–2, 7, 9 from spec pass as component/store tests.
  - Verify: component tests (jsdom) + manual check in browser.
  - Files: `frontend/src/components/TransitionsPanel.tsx` (new),
      `frontend/src/components/InspectorPanel.tsx`, `App.css`.

### Checkpoint: 2
- [x] Panel shows suggestion rationales; editing type flips to manual; resolve cleans invalid.

### Phase 3: Timeline chips (slice 3)
- [x] Task 3: `TransitionOverlay` per lane (between chip at boundary, edge chips at track
      ends, click-to-select, z-index over blocks) + CSS; mount in `TrackRow`.
  - Acceptance: criterion 8 passes; existing `App.test.tsx` mount stays green.
  - Verify: component tests + browser check.
  - Files: `frontend/src/components/timeline/TransitionOverlay.tsx` (new),
      `frontend/src/components/timeline/TrackRow.tsx`, `App.css`.

### Checkpoint: full
- [x] All spec criteria pass; `npx vitest run` (≥104), `npm run build`, `npm run lint`.

### Phase 4: Docs (slice 4)
- [x] Task 4: D-018 in `DECISIONS.md`, FEATURES §4, UI_SPEC editor notes, SESSION_LOG 11,
      ROADMAP M4 module tick, plan/todo ticks, `graphify update .`, backend regression check.
  - Files: `docs/*.md`, `tasks/*`.
  - Commit + push on user go-ahead.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| React 19 loop from object selectors in new components | High | `useShallow` for any object/select-multiple selector; jsdom mount test catches it |
| Manual overrides lost on suggest | High | store-level preserve-manual merge, unit-tested (criterion 3) |
| Stale `transitions` in future project versions | Med | keep optional; treat missing as `[]`; validation surfaces bad entries |
| Chip overlap/readability in timeline | Low | min visual width + z-index + click target; browser check |

## Open Questions

- None. (Edge chip duration freely editable in panel; between chips editable in panel too.)