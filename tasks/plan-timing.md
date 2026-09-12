# Implementation Plan: M3 remainder — timing fit + manual timing override

## Overview

Spec: `docs/SPEC-timing-pacing.md`. Two behaviours: (1) reruns preserve manual timing on matched clips,
(2) pacing refinements (floor + tail settle) applied at edges only. Pure TS first, then store, then UI.
Vertical slices:

`timing-core` → `store-override` → `panel-note` → docs/review.

## Task list

### Slice 1 — timing-core (pure TS, TDD)
- [x] `editor/timing.ts`: `TIMING_EPSILON`, `MIN_AUTO_DURATION`, `TAIL_HOLD`; `hasTimingOverride(actual, recorded)` (start/duration vs recorded, epsilon); `pacedEnd(beat, { isFinal, horizon, minDuration, tailHold })` → extends only the final beat, capped by horizon airtime.
- [x] Tests: no-change → false; start drift → true; duration drift → true; epsilon tolerance; floor extension capped by airtime; tail settle on final beat; interior beat untouched; no-airtime and past-horizon unchanged; custom opts. **Design fix mid-slice:** `regionEnd`-inferred finality was ambiguous → explicit `isFinal` + `horizon` (caller = store/panel passes narration-audio duration).
- [x] Verify: `npx vitest run src/editor/timing.test.ts` (11 green) — commit `0bace75`

### Slice 2 — store-override (matchingStore, TDD)
- [x] `match()` computes overrides from `results` (recorded beat timings) + `lastMatchClipIds`: any last-match clip whose timing differs (epsilon) → captured `{start,duration}` by beatId; `inputsFrom` applies override first (else pacing via `isFinal` + horizon).
- [x] Success status gains `kept: number` (overrides actually applied); flow stays one zundo step.
- [x] Tests (added + existing updated for `kept`): trim→rerun preserves start+duration; move→rerun preserves; untouched→refitted; kept count; undo restores exact pre-rerun timeline — commit `ca7f02b`
- [x] Verify: matchingStore 9 green; full frontend 85; build + oxlint clean

### Slice 3 — panel-note
- [x] `MatchPanel.tsx`: success line includes kept count ("N timing override(s) kept"); passes `{ horizon: narration audio duration }` from selected asset meta — commit `3e52173`
- [x] Verify: full suite 85 + build + lint + dev-server transform smoke 200 (3 modules)

### Slice 4 — docs, review, commit
- [x] ROADMAP M3 ticks; FEATURES §3 timing/override; DECISIONS D-014; ARCHITECTURE gaps; tasks/todo.md; SPEC-timing-pacing notes; SESSION_LOG Session 7; graphify update; full regression (backend 56 unchanged, frontend 85)
- [ ] push commit-set — **on user go-ahead**

## Checkpoints

- [x] After Slice 1: pure timing suite green
- [x] After Slice 2: rerun-preserves + undo-restores tests green
- [x] After Slice 3: full frontend suite + build + lint + dev smoke
- [ ] After Slice 4: docs + regression + push pending user go-ahead

## Risks / mitigations

| Risk | Mitigation |
|---|---|
| Positional beat ids mis-map overrides after transcript edits | Accepted (documented open question); stable id pass later |
| Override detection false-positives (e.g. tiny float drift) | `TIMING_EPSILON` 0.01 + pure test coverage |
| Pacing floor breaks sync | Edges-only rule + tests proving interior beats untouched |
| Rerun on changed image set re-picks assets fine | Server contract untouched |

## Open questions

- None blocking.