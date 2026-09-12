# Spec: `transitions-core` — transition model, heuristics, persistence

Module of M4 (map: `docs/SPEC-m4-capability-map.md`, build order first). Scope: data model,
explainable suggestion heuristics, validation and project persistence. **No** ffmpeg (that is
`transitions-render`), **no** timeline DOM (`transitions-ui`).

## Objective

Introduce an editable, explainable, default-clean transition layer so the video is "clean cuts unless
there is a reason" (PRODUCT_SPEC §Transitions). By the end of this module a project can carry typed
transitions with durations between adjacent clips, they survive save/load, suggestions are pure,
deterministic, rationale-backed, and never spam.

## Data model

```ts
export const TRANSITION_TYPES = ['match', 'dissolve', 'fade', 'wipe', 'zoom'] as const
export type TransitionType = (typeof TRANSITION_TYPES)[number]

export type TransitionSource = 'auto' | 'manual'
export type TransitionReason = 'continuity' | 'passage' | 'template' | 'manual'

export interface BetweenTransition {
  kind: 'between'
  id: string
  clipAId: string            // outgoing clip on the same track
  clipBId: string            // incoming clip
  type: TransitionType
  duration: number           // seconds, clamped [0.1, 2] (cross-duration)
  source: TransitionSource
  reason?: TransitionReason
  rationale?: string         // explainable, human-readable
}

export interface EdgeTransition {
  kind: 'edge'
  id: string
  at: 'start' | 'end'
  clipId: string
  type: 'fade'
  duration: number           // clamped [0.1, 2]
  source: TransitionSource
  reason?: 'break' | 'manual'
  rationale?: string
}

export type Transition = BetweenTransition | EdgeTransition
```

Cut is the *absence* of a Transition object — never materialised.

## Semantics

- A `between` transition anchors to two consecutive clips on the **same track**; validation requires
  `clipA.end ≈ clipB.start` (tolerance 80ms) and `duration ≤ min(clipA.duration, clipB.duration) - 80ms`.
- Rendering will crop into both clips to fit `duration` (decode offset adjusted) — contract only here;
  math lives in `transitions-render`.
- `remove` = delete the object (reverts to clean cut). `override` = set type/duration/source=manual.
- Auto suggestions are `source:'auto'`, user overrides flip to `:'manual'` and are never overwritten.

## Suggestion heuristic (pure)

`evaluateTransitions(clips, { matchContinuity }, opts) -> Suggestion[]` — deterministic, no I/O.

| Signal | Cut | Dissolve | Match |
|---|---|---|---|
| Same `assetId` consecutive (reused visual = continuity) | ✗ | — | ✓ `reason:'continuity'` |
| Gap ≥ 0.5s between consecutive matched clips (`beatId` set) | ✗ | ✓ `reason:'passage'` | — |
| Different assets, tight gap | ✓ (default, no object) | — | — |
| First/last clip of a reel | ✓ default; no auto edge fade | — | — |

Defaults from the product rule "avoid transition spam": nothing is auto-materialised unless the signal
column matches. `wipe`/`zoom` are **never** suggested in this module (template-only, no templates yet).

`rationale`: short sentence, e.g. "Same image continues across the cut — match cut keeps continuity."
`duration` defaults: dissolve 0.5s, match 0.3s. Clamped `[0.1, 2]`.

## Persistence

- `TimelineModel.transitions?: Transition[]` (top-level, optional) and the same optional key in the
  project file. **Schema version stays 1** (D-009/D-011/D-013 pattern — optional fields only).
- Save/load round-trip full fidelity; unknown/legacy values tolerated (extra fields ignored).
- `validateTransitions(clips, transitions) -> string[]` errors — used by store-triggered validation and
  UI warnings in the next module.

## Behaviour / acceptance

1. Project with transitions round-trips save/load unchanged (version 1).
2. `evaluateTransitions` returns cut-default (no objects) on ordinary sequences; continuity → match cut,
   passage gap → dissolve; never wipe/zoom.
3. Exactly the rationale strings in the spec table — explainable.
4. `validateTransitions` flags cross-track anchors, missing clips, over-long durations.
5. Manual override and remove are pure list operations; validation holds after them.

## Commands

- Test: `cd backend && uv run pytest`… **no** — this module is frontend-pure: `cd frontend && npx vitest run`
- Build: `cd frontend && npm run build`
- Lint: `cd frontend && npm run lint`

## Project structure / files

- `frontend/src/editor/transitions.ts` — types, constants, `evaluateTransitions`, `validateTransitions`,
  `clampTransitionDuration`, `overrideTransition`, `removeTransition` (pure).
- `frontend/src/editor/transitions.test.ts` — TDD suite.
- `frontend/src/editor/types.ts` — add `transitions?: Transition[]` to `TimelineModel` (export ring
  stays in transitions.ts to avoid a cycle).
- `frontend/src/editor/project.ts` (+ `project.test.ts`) — serialization of the optional key.

## Code style

Follow `timing.ts`/`timing.test.ts` exactly: nanosecond-free float seconds, pure functions, no classes,
no comments beyond docstrings, file-local epsilons with names.

## Testing strategy

- Unit: suggestion matrix (same-asset → match; gap ≥ 0.5 → dissolve; tight different-asset → nothing),
  no-wipe/zoom guarantee, duration clamps, validateTransitions error cases, project round-trip,
  manual override/remove purity. ~backend test count: n/a (frontend only); target 12–16 tests green.

## Boundaries

- Always: TDD red-green; rationale strings exact; default = no transition object; version stays 1.
- Ask first: adding transition types beyond the 5, changing the (0.1, 2) clamp, editing PRODUCT_SPEC.
- Never: any ffmpeg/xfade code, DOM changes, auto-suggesting wipe/zoom, a per-clip transition field
  instead of the top-level list.

## Success criteria

- `npx vitest run` green; `npm run build` + lint clean; persistence round-trip test proves version 1
  with optional `transitions`; suggestion suite proves default-clean + no spam; docs (D-016, ROADMAP,
  FEATURES §4, SESSION_LOG) updated; committed and pushed on go-ahead.