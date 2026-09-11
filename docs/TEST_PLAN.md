# AI Video Studio — Test Plan

> **How to read this doc** — WHAT: the test layers and fixture families every feature must satisfy. WHY: acceptance is reproducible behavior across real fixture sets, not "it worked once" — AI features are probabilistic, so confidence, overrides and regression fixtures are the only trustworthy proof. HOW: unit → integration → fixtures → failure/edge → performance sanity, run per change; see [SESSION_LOG.md](SESSION_LOG.md) for what has actually been verified so far.

Every feature requires:
1. Unit tests
2. Integration tests
3. Representative real-world fixture tests
4. Failure/edge-case tests
5. Performance sanity test on baseline hardware

Acceptance is NOT “it worked once”. It is reproducible behavior across the fixture set.

## 1. Voice/Image Fixtures

- Short narration
- Long narration
- Pauses
- Mixed language
- Multiple visual ideas per sentence
- Poor audio
- Duplicate images
- Irrelevant images
- Low-confidence matching

Behavioral acceptance checks:
- One sentence can produce multiple visual segments (e.g. “Ali jungle mein gaya, wahan usne ek purana castle dekha.” → jungle + castle).
- Pauses influence timing.
- Every matching decision is editable and reversible.
- Confidence is exposed for uncertain matches.

## 2. Manhwa Fixtures

- Clean gutters
- Black gutters
- Colored backgrounds
- Borderless panels
- Very tall panels
- Small panels
- Connected-looking panels
- Decorative elements
- Speech bubbles
- Dense text
- False boundaries

Behavioral acceptance checks:
- Detection uses multiple signals, not one contour threshold.
- Top-to-bottom default ordering.
- Original-resolution exports without unnecessary resampling.
- All correction operations (split/merge/crop/delete/add/reorder/re-detect/reset) work.
- Confidence is exposed; user can reset detection.

## 3. Editor / Timeline Tests

- Split, trim, move, delete, duplicate, replace asset.
- Re-time and reorder.
- Transition edit and caption edit.
- Undo/redo across operation chains.
- Preview reflects current timeline.
- Export matches timeline output.
- AI-generated edits remain editable after generation (no lock-in).

## 4. Templates / Fonts Tests

- Built-in preset applies correctly.
- Custom preset import/export round-trips.
- Font import (`.ttf`/`.otf`) and license metadata persisted.
- Urdu/mixed-language text renders correctly with the active font.
- “Trending” category is data-driven/updateable, not hard-coded.

## 5. Persistence / Data Integrity

- Project save/load round-trip.
- User overrides survive background AI passes (never silently overwritten).
- Panel metadata (id, source id, x/y/w/h, confidence, order, corrected flag) persists.

## 6. Performance Sanity (Baseline Hardware)

Target: HP Pavilion 15 · Intel i7 10th Gen · 16 GB RAM · MX250 2 GB.

- CPU fallback path works end-to-end.
- Preview uses proxies/lower resolution; final render uses full assets offline.
- A representative project renders within documented time/memory bounds on the baseline machine.
- Any performance limitation found is documented, not hidden.

## 7. Regression Policy

- After any change, run the full relevant suite.
- New fixtures are added for newly discovered failure modes.
- No feature is marked done without passing tests and documented performance limits.