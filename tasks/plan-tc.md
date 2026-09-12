# Implementation Plan: `transitions-core` (M4 module 1)

Spec: `docs/SPEC-transitions-core.md`. Pure frontend, TDD per slice, each slice committed.

### Slice 1 — model + constants + clamps
- `transitions.ts` first pass: `TRANSITION_TYPES`, `Transition`/`Between`/`Edge` types, `MIN_DURATION`,
  `MAX_DURATION`, default durations (dissolve 0.5, match 0.3, fade 0.5), `clampTransitionDuration`,
  id generator (uuid via crypto? — use simple counter-free `crypto.randomUUID` like existing code? Check
  existing id pattern in ops.ts/beats.ts).
- Tests: clamp bounds, defaults, kinds.
- Verify: `npx vitest run` green.

### Slice 2 — heuristics
- `evaluateTransitions(clips, opts)` — suggestion matrix per spec (continuity→match, gap≥0.5 with
  beatId→dissolve, else none); no wipe/zoom; exact rationale strings; `source:'auto'`.
- Tests: matrix + strictness (no spam) + rationale equality.
- Verify: vitest green.

### Slice 3 — validation + ops
- `validateTransitions(clips, transitions)` → error strings (cross-track, missing clips, over-long,
  non-contiguous, unknown type/kind); `overrideTransition`, `removeTransition` pure.
- Tests: each error class, purity (no mutation), override flips source→manual and keeps rationale reason.
- Verify: vitest green.

### Slice 4 — persistence
- `types.ts`: `TimelineModel.transitions?: Transition[]` (import type ring-safe).
- `project.ts`: read/write optional key (keep version 1); malformed transition → ProjectError.
- Tests: round-trip with transitions, absent key → undefined, malformed → error, legacy file still loads.
- Verify: vitest green + `npm run build` + lint.

### Slice 5 — docs + regression + commit + push
- D-016 decision, ROADMAP M4 ticks, FEATURES §4, SPEC impl note, tasks/todo ticks, SESSION_LOG 9,
  graphify update, full `npx vitest run` regression, commit, push on go-ahead.

## Checkpoints
- [x] Spec approved by human (`SPEC-transitions-core.md`)
- [x] After Slice 4: full frontend suite green + build + lint clean
- [x] After Slice 5: docs + graphify + commit; push pending user go-ahead

## Risks
| Risk | Mitigation |
|---|---|
| Heuristic over-suggests | Matrix is all-strict; cut = no object; tests enforce zero suggestion on ordinary seq |
| Serialization coupling | Optional top-level key only; version stays 1; malformed → clear ProjectError |
| Reason strings drift from spec | Tests assert exact rationale equality |