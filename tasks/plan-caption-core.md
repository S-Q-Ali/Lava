# Plan: M5 Module 1 — caption-core

> Spec: `docs/SPEC-caption-core.md` · Map: `docs/SPEC-m5-capability-map.md`
> TDD per slice; each slice committed atomically; full regression at closure.

## Slices

1. **caption-model** — `frontend/src/editor/captions.ts`: `CaptionWord`,
   `CaptionSource`, `CaptionItem`, `CAPTION_TRACK_ID`, `DEFAULT_CAPTION_STYLE_ID`,
   `MIN_CAPTION_DURATION`, `CAPTION_PAUSE_SPLIT_THRESHOLD`, `makeCaption`,
   `clampCaptionDuration`, `isCaption`. Tests: shape, clamps, guard.
2. **caption-generation** — `segmentCaptions(transcript, options?)`: per-segment
   captions split on pause ≥ threshold, word reuse, sorted, auto/normal. Tests:
   one-per-segment, pause split, word containment, empty transcript, fallback text.
3. **caption-ops** — `updateCaptionText` (manual + drops words),
   `updateCaptionTiming` (clamps + manual), `removeCaption`, `validateCaptions`
   (duplicate id, bad duration, negative start, overlap). Tests per rule.
4. **model-roundtrip** — `types.ts` `TimelineModel.captions?`;
   `project.ts` `parseCaptions` + round-trip test; malformed → ProjectError.
5. **caption-store** — `editorStore`: `captions` state, `generateCaptions(assetId)`
   (override-first: manual survive, one undo step), `updateCaptionText`,
   `updateCaptionTiming`, `removeCaption`, `loadProject`/`reset`/partialize/equality.
   Tests: generate, manual-survives, undo restores, load hydrates.
6. **docs-closure** — D-020, ROADMAP M5 caption-core tick, FEATURES, todo/plan
   ticks, SESSION_LOG 13 (module-level), `graphify update .`, full regression.

## Risks

- Type-only circular import `types.ts ⇄ captions.ts` — acceptable (same as
  transitions pattern); verify with `tsc -b`.
- Overlap validation must tolerate float drift (epsilon).