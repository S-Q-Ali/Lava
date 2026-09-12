# Spec: transitions-ui (M4 module 3)

Module id: `transitions-ui`. Depends on: `transitions-core` (done), `transitions-render` (done).

## Objective

Give the editor real, editable transition controls that honour the product rules:

- Transitions are **never spam**: the UI proposes them only from justified signal
  (same image continuing, or a passage gap between matched narration beats).
- Every automatic transition is **editable**: change type, change duration, or remove.
- **No silent overwrites**: suggested transitions replace only other `auto` suggestions;
  a user's manual override survives re-suggestion. Clip edits that invalidate a transition
  surface a visible error with an explicit resolve action instead of silent auto-deletion.
- There is **no manual "add transition" button** — creation stays suggestion-only, keeping
  the bias toward clean cuts (per PRODUCT_SPEC). Manual energy goes into *changing or
  removing* what the tool suggested.

## Scope

- `editorStore` gains `transitions: Transition[]` state + `selectedTransitionId` (same
  transient-selection pattern as `selectedClipId`), hydrated by `loadProject` and persisted
  by Save/partialize round-trip (project version stays `1`, `transitions` optional).
- Store actions: `suggestTransitions()` (compute via `evaluateTransitions`, replace only
  `auto` entries), `overrideTransition(id, type, duration?)` (flips source → `manual`,
  clamps via existing helpers), `removeTransition(id)`, `resolveInvalidTransitions()`
  (remove only entries that `validateTransitions` flags).
- Components:
  - `TransitionsPanel` (rendered last inside `InspectorPanel`): auto-suggest button,
    rationale text per transition, type `<select>` + duration `<input>`, Remove, and an
    invalid-transition banner with per-entry resolve.
  - `TransitionChip` overlay entries inside each `TrackRow` lane: a `between` chip centred
    on the cut boundary, width = `clamp(duration, MIN, MAX) × pxPerSecond`, minimum visual
    width enforced; edge chips at the first/last track clip. Click → `selectedTransitionId`.
- Purely presentational, no new dependencies. Types come from `editor/transitions.ts`.

## Out of scope

- Renderer behaviour (done), template runners for `wipe`/`zoom` (they stay suggestion-locked;
  changing them to `wipe`/`zoom` records the manual override even though the renderer is 422).
- Any transition creation button, any transition "intensity" magic, any virality claims.

## Commands

```
Test:      npx vitest run            (frontend dir)
Lint:      npm run lint
Build:     npm run build
Backend:   unchanged this module
```

## Project structure (touched)

```
frontend/src/store/editorStore.ts          → transitions state + actions
frontend/src/store/transitions.test.ts     → store action tests (new)
frontend/src/components/TransitionsPanel.tsx → inspector pane (new)
frontend/src/components/timeline/TransitionOverlay.tsx → per-lane chips (new)
frontend/src/components/App.test.tsx        → ok as-is (regression guard)
frontend/src/components/**/*.test.tsx       → component tests (new, jsdom pragma)
frontend/src/components/App.css             → chip + panel styles (no new layout system)
frontend/src/App.tsx                        → InspectorPanel gains <TransitionsPanel />
frontend/src/components/InspectorPanel.tsx  → mount TransitionsPanel
frontend/src/components/timeline/TrackRow.tsx → mount TransitionOverlay per lane
```

## Code style

Follow existing conventions: pure helpers in `editor/transitions.ts` (already locked), store
actions as plain `set` updaters, `useEditorStore((s) => s.x)` scalar selectors (object-literal
selectors MUST be wrapped in `useShallow` inside the component — React 19 rule), components
default-exported, `aria-label` on interactive controls, no comments.

## Testing strategy

- Vitest, jsdom via `// @vitest-environment jsdom` per file (config global env stays `node`).
- Store tests: `reset()` in `beforeEach`, drive the real singleton store, assert full slices.
- Component tests: `createRoot` + `act` (React 19) like `App.test.tsx`.
- Coverage expectation: every acceptance criterion below has at least one test; existing
  suites keep passing (104 frontend / 85 backend).

## Boundaries

- Always: run `npx vitest run`, `npm run build`, `npm run lint`; `useShallow` for
  object-literal selectors; keep `transitions` optional in the project file.
- Ask first: new dependencies, schema/version bump, changing `editor/transitions.ts` API.
- Never: silently drop or overwrite manual/auto transitions without an explicit user action;
  add a manual-add button; promise virality.

## Success criteria (each testable)

1. Empty editor: `TransitionsPanel` shows guidance "Suggest transitions appears once clips
   are placed on a track" and Suggest is disabled with no clips.
2. After `applyMatch` creates clips on the video track, `suggestTransitions()` stores a
   `match` suggestion (same asset) with rationale "Same image continues across the cut…" and
   a `dissolve` suggestion (beatId both + gap ≥ 0.5s) with rationale "Between matched
   narration beats…".
3. `overrideTransition` on a suggestion flips `source` to `manual`; a later
   `suggestTransitions()` call leaves the manual entry untouched and re-suggests only the
   still-auto entries.
4. `removeTransition(id)` removes exactly the targeted transition.
5. A transition whose clip was `removeClip`-ed remains in the list, is flagged invalid by
   `validateTransitions`, and `resolveInvalidTransitions()` removes exactly those entries.
6. `loadProject` with `transitions` hydrates the store; Save/partialize writes them back;
   round-trip with `transitions` absent still loads (`[]`).
7. `TransitionsPanel` renders type `<select>` + duration `<input>` + Remove for each
   between/edge transition; changing type calls the manual override action.
8. Timeline `TransitionOverlay`: between-chip is centred on its cut boundary, width scales
   with duration up to `MAX_DURATION` with a minimum visual width; edge chips render at the
   track's first-clip start and last-clip end; clicking a chip selects it.
9. Invalid banner appears only when `validateTransitions` returns errors.

## Open questions

- None blocking. Edge-fade chip width uses the same clamp; chip overlap with clip blocks is
  resolved by `z-index` (chips above).