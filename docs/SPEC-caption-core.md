# Spec: M5 Module 1 — caption-core

> Module 1 of 4 per `docs/SPEC-m5-capability-map.md` (caption-core → caption-styles →
> caption-render → caption-ui). This spec locks the caption item model, generation from
> M2 transcripts, and pure edit ops. Styles catalog, backend burn-in and UI are separate
> modules.

## WHAT

Captions are typed items on an optional top-level `TimelineModel.captions` key (same
pattern as `transitions`; project version stays 1). A clean timeline has no captions —
absence is the empty state.

### Model (`frontend/src/editor/captions.ts`)

```ts
interface CaptionWord { word: string; start: number; end: number }
type CaptionSource = 'auto' | 'manual'

interface CaptionItem {
  id: string            // `cap-<uuid>`
  trackId: string       // CAPTION_TRACK_ID = 'track-captions'
  start: number         // seconds, >= 0
  duration: number      // seconds, clamped to MIN_CAPTION_DURATION (0.2)
  text: string
  styleId: string       // default 'normal' (catalog lands in caption-styles)
  words?: CaptionWord[] // word timings reused from the transcript (karaoke later)
  source: CaptionSource
}
```

### Generation — `segmentCaptions(transcript, options?)`

Pure function from an M2 `Transcript` to `CaptionItem[]`:

- One caption per transcript segment, split further on intra-segment pauses with
  `gap >= CAPTION_PAUSE_SPLIT_THRESHOLD` (0.4s default — same rule as beat
  segmentation, so captions and matched image beats stay aligned).
- Each caption's `words` are the transcript words inside its time range (same
  epsilon containment as `beats.ts`); `text` is the words joined, falling back to
  the segment text when a part has no words.
- All generated items are `source: 'auto'`, `styleId: 'normal'`, on
  `track-captions`, sorted by start.

### Edit ops (pure)

- `updateCaptionText(caption, text)` → sets `text`, `source: 'manual'`, drops
  `words` (word timings are invalid once the text no longer matches them).
- `updateCaptionTiming(caption, patch)` → clamps `duration >= MIN_CAPTION_DURATION`,
  `start >= 0`; any timing edit marks `source: 'manual'` so re-generation preserves it.
- `removeCaption(captions, id)` → filter.
- `validateCaptions(captions)` → error strings for: duplicate ids, non-positive
  duration, negative start, overlapping captions on the same track.
- `isCaption(value)` → type guard for project round-trip.

### Store (`editorStore`)

- `captions: CaptionItem[]` in base state; temporal (undoable) via partialize/equality.
- `generateCaptions(assetId)` — reads `transcripts[assetId]`, runs `segmentCaptions`,
  replaces only `source: 'auto'` captions; `manual` captions always survive
  (override-first, same rule as D-018 transitions). One `set` = one undo step.
- `updateCaptionText(id, text)`, `updateCaptionTiming(id, patch)`, `removeCaption(id)`.
- `loadProject` hydrates `model.captions ?? []`; `reset` clears.

### Project round-trip (`project.ts`)

- Optional `model.captions` array validated with `isCaption`; malformed →
  `ProjectError`. Version stays 1; absent key = no captions (backward compatible).

## WHY

- Separate `captions` array (not payloads on media clips): caption paragraphs have
  different edit axes (text/style/words) than media clips (asset/motion) — per
  capability-map boundary decision.
- Override-first re-generation honours the locked product rule "do not silently
  overwrite user edits".
- Word timings ride on the item from day one so karaoke/word-highlight rendering
  (caption-render) needs no schema change.

## Boundaries / non-goals

- No style catalog here (caption-styles), no rendering (caption-render), no UI
  (caption-ui). `styleId` is an opaque string in this module.
- No live preview overlay (M8); no animated treatments (M6).

## Verify

TDD slices, each committed atomically: model/constants → generation → edit ops →
model+round-trip → store. Full regression after: backend pytest 111, frontend vitest
(133 + new), build, lint. Docs: D-020, ROADMAP M5 tick, FEATURES, SESSION_LOG 13,
todo/plan ticks, `graphify update .`.