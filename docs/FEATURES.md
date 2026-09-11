# AI Video Studio — Features

> **How to read this doc** — WHAT: the definitive feature inventory. WHY: each pillar exists to serve the two differentiators (voice-over → matched images; long Manhwa strips → panel assets) inside the "real editor, AI-assisted" philosophy — see the pillar intents below and [PRODUCT_SPEC.md](PRODUCT_SPEC.md). HOW: features are shipped as milestones; status lives in [ROADMAP.md](ROADMAP.md), shipped history in [SESSION_LOG.md](SESSION_LOG.md).

**Pillar intents (WHY):**
- *Media foundation* — everything else depends on a working editor plane (assets, model, timeline, FFmpeg).
- *Voice / audio* — the first differentiator's front half: turn narration into timed, segmented content.
- *Semantic image matching* — the first differentiator's back half: pair beats with the best image, with confidence and manual override.
- *Transitions / animation* — serve clarity and rhythm; clean-cuts by default, never "viral" promises.
- *Captions* — the widest surface of user-visible value, with strict editability.
- *Templates / fonts* — original presets + user imports, license-metadata tracked.
- *Manhwa extractor* — the second differentiator: borderless/connected panels handled, corrected visually, exported losslessly.
- *Editor / timeline, AI control, hardware awareness* — the guarantees the whole product rests on.

This document is the definitive feature inventory. Nothing is complete until it passes the [test plan](TEST_PLAN.md) and the [definition of done](ROADMAP.md).

## 1. Media Foundation

- Asset import (images, audio, video) — web importer ships.
- Project model and save/load — model + undo/redo ships; disk save/load pending.
- Original media preservation (Manhwa source image kept intact).
- Proxy/preview generation for performance on baseline hardware.
- FFmpeg wrapper — ships as a provider abstraction; the local media sidecar (`backend/`, FastAPI) renders image/video tracks to `mp4`. Audio mixing and full muxing pending.

## 2. Voice / Audio

- Audio decode and analysis.
- Multilingual speech-to-text (English, Urdu, Roman Urdu, mixed-language).
- Word and sentence timestamps.
- Pause detection and timing boundaries.
- Narration segmentation into semantic visual beats.
- Editable transcript.

## 3. Semantic Image Matching

- Image analysis for visual semantics, composition and usable subject matter.
- Embeddings/features generation.
- Beat-to-image matching with candidate scoring:
  - semantic relevance
  - visual quality
  - composition
  - continuity
  - repetition penalty
  - timing fit
- Confidence display for low-confidence decisions.
- Automatic image duration from narration timing and pacing rules.
- Manual replacement, trim, reorder and timing override.

## 4. Transitions / Animation

- Clean cut as the default.
- Contextual transitions driven by pacing, continuity and narrative/emotional intent.
- Match/continuity cut, short dissolve, fade, wipe/graphic, zoom/whip/glitch where justified.
- Image motion/ken-burns style animation.
- Retention-oriented heuristics (no “viral score” claims).
- Every transition decision editable and overridable.

## 5. Captions

Caption modes:
- Normal subtitles
- Word-by-word highlighting
- Karaoke
- Kinetic typography
- Important-word pop
- Auto punctuation
- Hook text
- Manga/anime
- Cinematic
- Meme
- Storytelling
- Urdu
- Roman Urdu
- English
- Mixed-language
- Auto emoji (optional style, never mandatory)

Pipeline: ASR → timestamps → sentence/phrase segmentation → word timestamps → style renderer → editable caption track.

## 6. Templates / Styles / Fonts

- Built-in original preset library.
- User-importable custom presets.
- Caption-only presets and complete video-treatment presets.
- Preset may define: aspect ratio, caption style, font, font weight, position, word highlight, image animation, transition strategy, timing strategy, text animation, color rules, safe areas.
- Categories: Trending (updateable), New, Shorts, Reels, YouTube, Anime, Manhwa, Storytelling, Cinematic, Motivation, Meme, Documentary, Custom.
- Licensed/open fonts bundled; user `.ttf`/`.otf` import; license/source metadata tracked; mobile readability priority; multilingual/Urdu support where licensed.

## 7. Manhwa / Webtoon Extractor

- Full-resolution load + analysis-scale representation.
- Multi-signal panel detection (never one contour threshold).
- Gutter/whitespace/boundary detection.
- Borderless panel handling.
- Connected/combined panel merge/split reasoning.
- False-positive filtering (bubbles, text, characters, decorative lines, empty regions).
- Natural top-to-bottom ordering.
- Coordinate mapping back to original resolution.
- Confidence display.
- Manual correction UI: split, merge (next/previous), crop/adjust bounds, delete, add, reorder, re-detect, reset.
- Panel assets `panel_001.png ...` with metadata (id, source id, x/y/w/h, confidence, order, user-corrected flag).
- PNG (lossless default) and JPG export at original resolution.

## 8. Editor / Timeline

Tracks: Video, Image, Voice, Music, SFX, Captions, Text/Overlay.

Operations: split, trim, move, delete, duplicate, replace asset, re-time, reorder, transition edit, caption edit, undo/redo, preview, export.

## 9. AI Control & Editing Integrity

- AI does the first pass quickly; user inspects and overrides.
- User changes preserved; never silently rewritten by background AI.
- Confidence indicators and reversible operations everywhere.

## 10. Hardware-Aware Operation

- CPU fallback is mandatory.
- Lightweight models and optional model packs.
- Proxy previews; full-resolution offline render.
- Configurable local-first directories (`.venv/`, `node_modules/`, `models/`, `cache/`, `temp/`, `projects/`, `tools/ffmpeg/`).
- Performance sanity checks on the baseline HP Pavilion 15.