# Capability Map: M5 Caption Engine

## Objective

Editable captions end-to-end: generate caption items from an analyzed transcript, style them
with original presets covering the product's supported modes, render them burned into the
output video, and let the user edit everything on the timeline/inspector. Local-first, CPU-safe,
AI generations always editable, project version stays 1.

## Modules

| Module id | Responsibility | Depends on | Ships |
|---|---|---|---|
| caption-core | Caption model: typed `CaptionItem` on `TimelineModel.captions` (top-level optional key, like `transitions`); word-level data reuse; pure generation from transcript (sentence/phrase segmentation, word timestamps); pure edit ops (text/duration/style) with validation; project round-trip (version 1). | M2 transcripts | 1 |
| caption-styles | `CaptionStyle` type + original preset catalog covering the supported paragraphs (normal, word-highlight, karaoke, important-word pop, punctuation, hook, manga/anime, cinematic, meme, storytelling, urdu, roman-urdu, english, mixed, emoji-optional). Presets are original static definitions (no trending claims, no proprietary fonts); fonts = safe stacks in M5, user font import deferred to M6. Default + inspectable fields only. | — | 2 |
| caption-render | Backend burn-in: generate a libass `.ass` track from caption items + style, overlay on the rendered video inside the existing per-stream fold (parity preserved when no captions). Modes: normal subtitles, word-highlight, karaoke (`\k`), important-word pop, punctuation/emoji styling, mixed-language / RTL Urdu lines. Real-ffmpeg smoke. Kinetic/manga/meme/cinematic/storytelling are template animation — encoded in M5 only as static styled lines; animated treatments ship with M6 templates. | caption-core (format), v0 note: simple ASS generator accepts core+styles types | 3 |
| caption-ui | Inspector `CaptionPanel` + timeline: Analyze/Generate from an analyzed transcript, per-caption style/select, text + duration edit (kept on re-generate/never overwritten), caption track clips click-to-edit, empty/error states. Re-generate preserves manual text edits (override-first pattern). | caption-core, caption-styles | 4 |

## Boundaries / decisions

- Captions are a **separate `captions` array** keyed to `track-captions`, not text payloads on
  media `Clip`s — media clips and caption paragraphs have different edit axes; a caption item
  carries `{ id, trackId, start, duration, text, styleId, words? }`.
- Edition + preview of **burn-in belongs to render**: no live preview overlay in M5 (preview
  overlay is part of editor polish in M8); M5 can reuse the captured transcript words for word
  timings.
- **Version stays 1**; all new fields optional (`CAPTION_VERSION_EXT` guard not needed).
- `caption-styles` may be co-implemented inside `caption-core` if the catalog stays small — the
  module boundary exists so the preset catalog and the item model can be reviewed separately;
  the plan may merge them as one physical slice if dependency/coupling is trivial.
- Fonts (user import + license metadata) → M6; trending claims → none, ever.
- Emoji is an optional per-style flag, never mandatory (PRODUCT_SPEC §10).

## Build order

caption-core → caption-styles → caption-render → caption-ui
(styles can start once core's item shape is approved; render needs core+styles' contract;
ui needs all three.)

## What is NOT in M5 (explicit deferrals)

- User font import / license tracking / template "complete video treatment" presets (M6 templates/fonts).
- Animated kinetic/manga/meme/cinematic treatments beyond static styled lines (M6 templates).
- Manhwa-caption interplay (M7).
- Live preview overlay, caption search, multi-line manual re-flow UX polish (M8).
- Retention metrics (M4 open bullet; dimensions defined in M5 planning only).

## Gate

Map approved → per-module Spec → Plan → Todo → slices (TDD) → docs (D-0xx, ROADMAP M5,
FEATURES, UI_SPEC, SESSION_LOG) → graphify → regression → commit → push on go-ahead.