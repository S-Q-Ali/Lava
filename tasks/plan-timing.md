# Implementation Plan: M3 remainder — timing fit + manual timing override

## Overview

Spec: `docs/SPEC-timing-pacing.md`. Two behaviours: (1) reruns preserve manual timing on matched clips,
(2) pacing refinements (floor + tail settle) applied at edges only. Pure TS first, then store, then UI.
Vertical slices:

`timing-core` → `store-override` → `panel-note` → docs/review.

## Task list

### Slice 1 — timing-core (pure TS, TDD)
- [ ] `editor/timing.ts`: `TIMING_EPSILON`, `MIN_AUTO_DURATION`, `TAIL_HOLD`; `hasTimingOverride(actual, recorded)` (start/duration vs recorded, epsilon); `pacedEnd(beat, regionEnd, { minDuration, tailHold })` → returns extended end only when trailing airtime exists and duration < minDuration, or final beat tail-hold; interior beats never extended.
- [ ] Tests: no-change → false; start drift → true; duration drift → true; epsilon tolerance; floor extension capped by airtime; tail settle on final beat; interior beat untouched; beat exactly at regionEnd.
- [ ] Verify: `npx vitest run src/editor/timing.test.ts`

### Slice 2 — store-override (matchingStore, TDD)
- [ ] Store track of previous response beat timings (transient `results` already holds `{beatId,start,end}`); in `match()`, before building inputs, compute overrides: for each `lastMatchClipIds` clip whose actual timing differs (epsilon) from recorded beat timing → capture `{start, duration}` by beatId.
- [ ] `inputsFrom` applies captured override (override wins) else pacing (`applyPacing` via region end = max(new response beats' end)).
- [ ] Success status gains `kept: number`; flow stays one zundo step.
- [ ] Tests: trim→rerun preserves start+duration (image may change); move→rerun preserves; untouched→refitted to new timing; kept count; undo restores pre-match timeline exactly.
- [ ] Verify: `npx vitest run src/store/matchingStore.test.ts src/store/editorStore.test.ts`

### Slice 3 — panel-note
- [ ] `MatchPanel.tsx`: success line includes kept count (mirror `transcript-hint` style); status type covers `kept`.
- [ ] Verify: build + vitest full + oxlint; dev-server transform smoke (`localhost:5173`).

### Slice 4 — docs, review, commit
- [ ] ROADMAP M3: tick manual timing override; FEATURES §3 note; DECISIONS D-014 (override preservation, transient derivation); tasks/todo.md M3B block; SESSION_LOG Session 7 append; graphify update; full regression (backend 56, frontend 70+); commit + push on user go-ahead.

## Checkpoints

- [ ] After Slice 1: pure timing suite green
- [ ] After Slice 2: rerun-preserves + undo-restores tests green
- [ ] After Slice 3: full frontend suite + build + lint + dev smoke
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