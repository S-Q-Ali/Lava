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
- *Remaining M6*: preset registry, preset import, template editor, animated caption treatments — all shipped in modules 2–6 below.

**Shipped (M6 module 2 `preset-registry`):**
- **Preset model** — `Preset` extends `CaptionStyle` with `category` (13 constants: Trending, New, Shorts, Reels, YouTube, Anime, Manhwa, Storytelling, Cinematic, Motivation, Meme, Documentary, Custom), optional `presetVersion`, `tags[]`, and `licenseRef` (bind to an imported font). Captions/panel/renderer still consume the unchanged `CaptionStyle` sub-type.
- **Registry** — `presets/registry.json` seeded from the 15 built-in presets with an explicit category mapping; load/save with built-in fallback on corrupt/missing; `GET /api/presets` serves it (read-only until import lands). Trending is updateable by editing the registry JSON — no live fetch, no hard-coded claims.
- **PresetPanel** — inspector panel with "All" + 13 category pills, preset cards (name, category badge, font binding "imported font"/"system stack", RTL flag, description), and an Apply button that restyles the project captions in **one undo step** and marks them manual (override-first).
- *Remaining M6*: preset import, template editor, animated caption treatments — all shipped in modules 3–6 below.

**Shipped (M6 module 3 `preset-import`):**
- **Import** — accepts a `lava-preset` envelope (`{kind, version: 1, preset}`) or a bare preset dict via an Import JSON button (file picker → JSON → `POST /api/presets`). Imported presets are validated against the full Preset schema: ids forced to `custom-` (duplicate → 422 `PRESET_INVALID`), category forced to `Custom`, and a `licenseRef` (when present) must reference an imported font — actionable errors, no silent overwrite.
- **Export / Delete** — custom preset cards get an Export button (downloads `<id>.lava-preset.json` via the same envelope) and a Remove button; built-ins are undeletable (`403 BUILTIN_PRESET`). Backend also serves `GET /api/presets/{id}/file` for parity/tests.
- **Custom registry** — imports persist into `presets/registry.json` (single file, built-ins stay code baseline), load/save falls back to built-ins on corrupt writes; `removePreset`/`importPreset` mirror the server state in the store.
- *Remaining M6*: template editor, animated caption treatments — all shipped in modules 4–6 below.

**Shipped (M6 module 4 `template-editor`):**
- **Draft model** — `frontend/src/editor/templateEditor.ts`: `PresetDraft`, `draftFromPreset` (from a preset or an M5 style), immutable `updateDraft` (font size clamped 8–240, outline ≥ 0), `customIdForLabel` — slug ids that mirror the backend `custom-` contract, and `finalizeDraft` producing a full Custom `Preset` payload.
- **Overwrite API** — `PUT /api/presets/{id}` updates a preset in place: custom-only (built-in → `403 BUILTIN_PRESET`), missing → 404, payload id must equal the path id (else 422 `PRESET_INVALID`), full import validation (incl. the font `licenseRef` gate). `presetStore.savePreset` POSTs when a preset id is unknown and PUTs when it exists.
- **TemplateEditorPanel** — Inspector section: base preset select (default `normal`), label/description, font family text + imported-font picker, size / colors / outline / alignment, the eight M5 flag toggles (bold, uppercase, RTL, emoji, karaoke, word highlight, important-word pop, punctuation), a live CSS preview, Save-as-new (label-gated) and Overwrite (custom bases only).
- **Render-path fix** — caption→wire/`captionsRenderPayload` now resolve a caption's preset `styleId` through the preset store before burn-in (previously fell back to `normal`), and the CaptionPanel style select lists custom presets with the M5 styles first.
- *Remaining M6*: license metadata, animated caption treatments.
- **Shipped (M6 module 5 `animated-captions`):**
- **Treatments** — five named animations generated as deterministic libass inline tags in the pure backend ASS generator: `kinetic` (per-word alpha+scale reveal riding the voice pipeline's `words[]` timing, even-split fallback), `manga` (impact punch: 200%→100% scale + alpha fade over ~180 ms), `cinematic` (`{\fad(400,400)}` + slow scale), `meme` (three ~180 ms scale ramps for a punch/wobble) and `storytelling` (`{\fad(600,600)}` + gentle scale).
- **Contract** — `animation` (enum: `none|kinetic|manga|cinematic|meme|storytelling`) flows through the caption style, the `Preset` schema (backend enum validation + import/export round-trip), the `PresetDraft` editor model, and the render wire. The four M5 presets named after the families carry their matching treatment; everything else defaults to `none`. Karaoke keeps precedence; RTL wraps outside the animation.
- **Editor** — TemplateEditorPanel gains an Animation control (None + the five treatments). Motion preview of animations is M8 (preview overlay); true manga speed-lines and cinematic letterbox bars are recorded as M8 follow-ups since they need pixel-space drawing the text ASS generator can't measure.
- *Remaining M6*: license metadata (module 6 `license-tracking` — shipped below).

**Shipped (M6 module 6 `license-tracking` — closes M6):**
- **Render guard** — the pure `licensing.py` resolver matches every caption style's `fontFamily` against the fonts registry by family and returns a used-font manifest or blocking violations: `FONT_LICENSE_NOT_EMBEDDABLE` (declared license forbids embedding) and `FONT_MISSING` (registered, but the font file is gone from `fonts_dir`). `POST /api/render` aborts any violation with an actionable 422 `FONT_LICENSE` — no silent fallback from the render path. System stacks (unregistered families) are outside the registry and always allowed.
- **Font manifest** — successful renders return `fonts: [{family, fontId, license}]` describing exactly which registry-backed fonts the export burned in; `RenderResult` and the frontend `FFmpegProvider.render` mirror it.
- **Badge** — PresetPanel's "imported font" badge title now shows the bound font's family and embedding status resolved from `fontStore`.
- *Remaining M6*: none — all six M6 rows closed.

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

**Shipped (M7 modules 1–2 `panel-model` + `panel-detection`):**
- **Panel model** — frozen `Panel` (`{id, sourceId, x, y, w, h, confidence, order, userCorrected}`) built through a single validated constructor; git-clean `StripRegistry` (`cache/manhwa/<source_id>/registry.json`, atomic temp+rename writes, corrupt/missing/unknown-version → `ManhwaError`); zero-padded asset naming; stable panel ids.
- **Coordinate mapping** — boundary-anchored: analysis cut lines are mapped once to source resolution and panel boxes are derived from consecutive mapped lines, so panel tiling is seam-free by construction and never double-covers source pixels.
- **Hybrid detection** — per-row signals (foreground content vs a margin-ring background estimate, uniformity, Canny edge energy) vote, never one contour threshold: clean gutters (empty + flat + wide + bordered by content, conf 0.95), bordered rescue seams for borderless/linked panels (conf 0.35), and a sliver-merge pass. Bubbles, dense text, decorative full-bleed art and flat dead zones are filtered out (adjacent-side content test) so they never earn a spurious cut.
- **detect_strip** — single-column vertical strips only (landscape/unreadable → `ManhwaError`); runs at ≤512 px analysis; persists original-resolution crops plus the registry; reruns are idempotent.

**Shipped (M7 module 3 `panel-order`):**
- **Reading order** — `order_panels` sorts panels naturally (y then x) and renumbers `order` 1..n without touching boxes, ids, confidence or `userCorrected`.
- **Confidence attribution** — `attribute_confidence` sets each panel to the worst of its two bounding boundary confidences (source edges certain); detection, correction and the API all share this one rule.
- **Layout guard** — `guard_layout` rejects empty lists, duplicate ids, positive-area overlaps and interleaved regions (`ManhwaError`), normalizing to a valid ordered list; touching/adjacent tiling is fine, gaps after Delete are legal.

**Shipped (M7 module 4 `panel-export`):**
- **Original-resolution export** — full ROI crops straight from the source strip (never resampled); PNG lossless by default, JPEG at configurable quality 1..100.
- **Manifest** — every export carries rows of `{file, id, order, x/y/w/h, width/height, confidence}` in 1..n reading order; `panel_###` naming is asset-stable (module 1), suffix swaps with format.
- **Guard-normalized bundles** — the panel list is passed through `guard_layout` before export, so corrected/salvaged registries export cleanly; empty/overlapping layouts fail loudly rather than emitting garbage files.

**Shipped (M7 module 5 `panel-correction`):**
- **Pure correction ops** — Split (top half keeps id, fresh `pN` bottom id, both inherit confidence and are marked user-corrected), Merge with next/previous (union box keeps first id, confidence = min), Adjust bounds (must stay in source and stay disjoint), Delete (renumbers; may produce an empty registry), Add (fresh id, confidence 1.0, insert after a chosen panel), Reorder (exact id permutation reshapes the sequence), Re-detect and Reset.
- **User intent is the final word** — every op leaves the original image untouched, keeps ids stable, sets `user_corrected=True` on what changed, and normalizes through `normalize_layout` (same validity rules as the detection guard, but sequence-preserving). Export now sorts on the `order` field, so a reorder/insert actually changes output.

**Shipped (M7 module 6 `manhwa-api`):**
- **REST surface** at `/api/manhwa` — multipart upload+auto-detect (stores the original + eager crops + registry project-locally), strip list/detail (confidence, order, userCorrected), correction ops via PATCH (split/merge/adjust/delete/add/reorder/reset, each persisted to the registry), re-detect, strip delete, and PNG/JPG zip export with a `manifest.json`.
- **Always the original** — panel PNGs are regenerated from the original at full resolution (never a stale cache crop); exports refuse empty layouts; every failure maps to the sidecar's `{error:{code,message}}` contract.

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
- Lazy model loading and non-blocking jobs (D-034): matcher/transcriber are
  built on first use (startup touches no model bytes); FFmpeg render, proxy
  generation, ONNX matching and whisper transcription run off the event loop
  (`asyncio.to_thread`) so health and proxy requests answer during a render.
  The render timeout is configurable (`render.timeoutSeconds`, default 600,
  reported as `renderTimeoutMs` on `/api/health`).
- Memory tuning (D-035): manhwa analysis decodes a JPEG strip straight to the
  ≤512 px analysis size via `Image.draft`, so full-resolution pixels never
  materialise in RAM unless crops are saved; export zips stream from a spooled
  temp file one panel at a time (64 KiB chunks); `POST /api/gc` sweeps proxy
  cache files older than `gc.proxyTtlDays` (default 7, `dryRun` supported);
  `motion.upscaleFactor` (default 3, validated 1..8) tunes the zoom/pan
  headroom scale in the render filter chain.
- M9 measurement log (D-036): `docs/M9-MEASUREMENT.md` — 7-item benchmark
  checklist plus `tools/m9-macro-bench.py`, identical on the dev Mac and the
  HP Pavilion 15 baseline. Reference row logged; the HP row is filled on the
  physical machine before M9 closes.
- Proxy previews; full-resolution offline render. Implemented (D-033): deterministic SHA-prefix proxy service `POST/GET /api/proxy` — image proxies are WebP (quality 80, max width 480, max height 960, no upscale), video proxies are MP4 (height ≤480, 15 fps, max 120 s, audio stripped), cached under `cache/backend/proxy`; the preview panel lazily requests a proxy per asset and renders the memoized `<img>`/`<video>` from it, falling back to the original blob URL when the sidecar is offline. Renders always use original assets.
- Configurable local-first directories (`.venv/`, `node_modules/`, `models/`, `cache/`, `temp/`, `projects/`, `tools/ffmpeg/`).
- Performance sanity checks on the baseline HP Pavilion 15.