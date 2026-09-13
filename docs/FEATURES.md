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
- Project model and save/load — model + undo/redo ships; versioned project files (`lava-studio` JSON) Save/Open from the topbar. Media bytes stay session-scoped in a browser; the file stores structure + asset metadata (Tauri will persist real paths).
- Original media preservation (Manhwa source image kept intact).
- Proxy/preview generation for performance on baseline hardware.
- Timeline editing — clips split/delete/select, drag-move and edge-trim gestures (one undo step each); ripple editing and cross-track drag are open.
- FFmpeg wrapper — ships as a provider abstraction; the local media sidecar (`backend/`, FastAPI) renders image/video tracks to `mp4`. Audio mixing and full muxing pending.

## 2. Voice / Audio

- Audio decode and analysis.
- Multilingual speech-to-text via local faster-whisper (CPU, int8 quantized, `tiny` default;
  models cached inside the project's `models/` folder). Engine runs in the media sidecar.
- Word and sentence timestamps (word-level timestamps enabled).
- Pause detection with a default 0.3s gap threshold; pauses exposed as `{start, end, gap}`.
- Narrator-agnostic segment grouping (whisper segments); per-word + per-segment confidence.
- Editable transcript — word-text edits in the editor are undoable and persisted in the project file
  (optional `model.transcripts` key, project version unchanged).
- Narration segmentation into semantic visual beats — pure-TS segmentation over the transcript (`editor/beats.ts`: one beat per segment, split on pauses ≥ 0.4s, word-based labels). *(beats landed in this slice; timing-edit re-segmentation still deferred)*

## 3. Semantic Image Matching

- Image analysis for visual semantics — CLIP ViT-B/32 embeddings via ONNX, project-local `models/clip/` (fp32 default; `model_key` override), preprocessing with Pillow (resize/center-crop/normalize).
- Beat-to-image matching via `POST /api/match` (multipart images + JSON beats):
  - semantic relevance (cosine on image/text embeddings)
  - repetition penalty prevention (re-use-aware greedy assignment)
  - per-beat confidence + top-3 alternatives returned
  - injected `Embedder` keeps tests deterministic (`FakeEmbedder`), same pattern as `FakeTranscriber`.
- Confidence display per match and per alternative in the Inspector.
- Automatic image placement — `MatchPanel` auto-match applies the image track in a single undoable step, tagging clips with `beatId` (persisted; project version unchanged) and reusing existing `confidence`.
- Manual replacement — alternatives dropdown replaces the matched image per beat; manual edits are never overwritten by re-runs (only clips from the *last* auto-match are replaced).
- **Timing fit / pacing rules** — auto-placed clips use narration beat timing, refined at the edges only: `MIN_AUTO_DURATION` 0.5s floor + `TAIL_HOLD` 0.3s settle for the final image, bounded by the narration-audio duration; interior beats are never extended (sync-first, clean adjacency).
- **Timing overrides survive re-matches** — trimmed/moved matched clips keep their timing across re-runs (override-first, transient derivation); success status reports how many were kept.
- **Multilingual matching (auto-select)** — when `models/clip-multilingual/` is present, beat text runs through the sentence-transformers multilingual CLIP text tower (DistilBERT wordpiece; `sentence_embedding` projected into the same CLIP space) while images reuse the existing ViT-B/32 image tower (`MultilingualClipEmbedder` composes both ONNX sessions, CPU-only). Urdu-script beats match their images correctly (validated real-model). Roman-Urdu transliteration still separates weakly (scripted-tokenizer limitation). Absent the folder, matching falls back to English-only CLIP unchanged.
- *(Not in this slice)* visual-quality & composition scoring, continuity beyond repetition, automatic image duration from pacing rules anywhere outside narration airtime.

## 4. Transitions / Animation

- Clean cut as the default — a cut needs no model entry (no transition object = cut).
- Transition model + persistence: typed `between`/`edge` transitions with duration, source (`auto`/`manual`), reason and explainable rationale; stored on the top-level `transitions` key, project version stays 1; legacy files load unchanged.
- Explainable, deterministic suggestions (`evaluateTransitions`): same-asset continuity → match cut; ≥ 0.5s gap between matched narration beats → short dissolve; everything else stays cut; `wipe`/`zoom` are never auto-suggested (template-only).
- Editable decisions: `overrideTransition` / `removeTransition` are pure ops; manual overrides flip `source` to `manual` and survive save/load and any future re-suggestions.
- **Renderer support** (`POST /api/render` optional `transitions` field): `dissolve` → `xfade=fade`, between `fade` → `xfade=fadeblack`, `match`/cut → plain concat, edge fades → `fade=t=in|out` on the first/last stream; offsets = Σ clip durations − Σ transition durations; `wipe`/`zoom` rejected with `TRANSITION_UNSUPPORTED` (template-only).
- **Editable timeline UI (M4 `transitions-ui` complete)**: transitions render as chips centred on the cut boundary (width ∝ duration, clamped 36px–64px) and on track first/last-clip edges; clicking a chip selects it in the inspector. The inspector pane lists every transition with its human rationale, a type `<select>` and duration input (manual edits flip `source` to `manual`, clamps 0.1–2s), a Remove action, and an explicit invalid-transition banner (orphaned by clip edits — resolved only on request, never silently deleted). Suggest button is disabled without clips on a track. No manual "add" button — creation stays suggestion-only to preserve the clean-cut bias.
- Contextual transitions driven by pacing, continuity and narrative/emotional intent.
- Match/continuity cut, short dissolve, fade, wipe/graphic, zoom/whip/glitch where justified.
- Image motion/ken-burns style animation.
- **Restrained still-clip motion (M4 `image-motion` complete)**: per-clip optional `motion` (`zoom-in/zoom-out/pan-left/pan-right/pan-up/pan-down` + `strength` 0–1, default off). User-set only — auto-match never invents motion. Editable in the inspector (`MotionPanel`: type select + strength slider) and visible as a marker on timeline blocks; `none` clears. Persists in project files (version stays 1). Renders through the shared per-stream prep (`scale=iw*3:ih*3` headroom → `zoompan` with `F = 1 + 0.15·strength`) so motion composes with the xfade transition fold and the no-motion graph stays byte-identical. Non-image clips reject motion with `MOTION_INVALID` (422).
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

**Shipped (M5 caption engine complete):**
- **Caption model** — typed `CaptionItem` on the top-level `captions` key (project version stays 1): `{ id, trackId: 'track-captions', start, duration, text, styleId, words?, source: 'auto'|'manual' }`. Word timings from the transcript ride on every generated item (karaoke/word-highlight ready).
- **Transcript generation** — `segmentCaptions` produces one caption per segment, split on pauses ≥ 0.4s (same rule as beat segmentation, so captions stay aligned with matched image beats); text falls back to the segment text when a part has no words.
- **Editable caption track** — inspector `CaptionPanel`: Generate buttons per analyzed voice asset (analyze-first empty state otherwise), per-caption text edit, duration edit (clamped ≥ 0.2s), style select, Remove, and an auto/manual source badge. Timeline shows caption blocks on the captions lane (click seeks; dashed border = manual). Re-generation replaces only `auto` captions — **manual edits always survive**.
- **Style presets** — 15 original static presets covering the mode list above: normal, word-highlight, karaoke, important-word pop, punctuation, hook, manga/anime, cinematic, meme, storytelling, urdu (RTL), roman-urdu, english, mixed, emoji-optional. Safe font stacks only; no trending claims; user font import + license metadata arrive with M6.
- **Burn-in renderer** — `/api/render` accepts an optional `captions` field; the sidecar generates a libass `.ass` document (PlayRes-relative sizes, `#RRGGBB`→ASS colors, bottom/middle/top alignment, `{\k}` karaoke centiseconds from word timings, `{\rtl}` for RTL lines, HTML escaping, uppercase) and overlays it on the output. Absent/empty captions keep the filter graph byte-identical (parity); malformed captions → `CAPTION_INVALID` (422). Validated with a real-ffmpeg pixel-diff smoke (burned caption visibly changes the frame).
- *(Deferred by design)*: animated kinetic/manga/meme treatments and complete-video template presets → M6; live preview overlay → M8; user fonts + license metadata → M6.

## 6. Templates / Styles / Fonts

- Built-in original preset library.
- User-importable custom presets.
- Caption-only presets and complete video-treatment presets.
- Preset may define: aspect ratio, caption style, font, font weight, position, word highlight, image animation, transition strategy, timing strategy, text animation, color rules, safe areas.
- Categories: Trending (updateable), New, Shorts, Reels, YouTube, Anime, Manhwa, Storytelling, Cinematic, Motivation, Meme, Documentary, Custom.
- Licensed/open fonts bundled; user `.ttf`/`.otf` import; license/source metadata tracked; mobile readability priority; multilingual/Urdu support where licensed.

**Shipped (M6 module 1 `font-system`):**
- **Font import + registry** — inspector `FontPanel`: pick a `.ttf`/`.otf`, choose license type (`unknown`/`open`/`commercial`/`personal`), optional source URL/note, embedding-allowed flag; imports to the sidecar `fonts/` dir with a hand-rolled SFNT validator + real family-name extractor (nameID 16→1→4, Windows/Unicode entries), no fontTools dependency. Registry `fonts/licenses.json` (git-clean) is the source of truth.
- **Font API** — `POST /api/fonts` (201 metadata), `GET /api/fonts`, `GET /api/fonts/{id}/file`, `DELETE /api/fonts/{id}` (204). `FONT_INVALID` (422) for bad extensions/magic/license semantics; `INVALID_BODY` (422) for malformed license JSON; 404 for unknown ids.
- **Preview** — each listed font gets a preview link to its served file and an auto-registered `@font-face` (keyed per id+base URL) so imported families appear in browser UI.
- **Render burn-in** — captions reference families by string; when fonts are imported the `ass=` filter appends `:fontsdir='…/fonts'`, so libass resolves uploaded families. No-captions graph stays byte-identical (parity). Font fallback to system scan path remains intact.
- *Remaining M6*: preset registry, preset import, template editor, animated caption treatments.

**Shipped (M6 module 2 `preset-registry`):**
- **Preset model** — `Preset` extends `CaptionStyle` with `category` (13 constants: Trending, New, Shorts, Reels, YouTube, Anime, Manhwa, Storytelling, Cinematic, Motivation, Meme, Documentary, Custom), optional `presetVersion`, `tags[]`, and `licenseRef` (bind to an imported font). Captions/panel/renderer still consume the unchanged `CaptionStyle` sub-type.
- **Registry** — `presets/registry.json` seeded from the 15 built-in presets with an explicit category mapping; load/save with built-in fallback on corrupt/missing; `GET /api/presets` serves it (read-only until import lands). Trending is updateable by editing the registry JSON — no live fetch, no hard-coded claims.
- **PresetPanel** — inspector panel with "All" + 13 category pills, preset cards (name, category badge, font binding "imported font"/"system stack", RTL flag, description), and an Apply button that restyles the project captions in **one undo step** and marks them manual (override-first).

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