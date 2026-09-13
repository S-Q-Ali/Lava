# Capability Map: M7 Manhwa / Webtoon Extractor

## Objective

Drop one very tall Manhwa/Webtoon strip and get ordered, confidence-rated, full-resolution
panel assets you can correct and export — without shelling out to CV vocabulary. Pipeline:
full-res load → analysis-scale → multi-signal boundary detection (never one contour threshold)
→ borderless + connected-panel reasoning → false-positive filtering → top→bottom order →
map to original resolution → panel assets + metadata → correction UI → PNG/JPG export.
The original long image stays in the project, untouched.

## Assumptions

1. Detection runs **on CPU in the local sidecar** (consistent with `backend/`), using only the
   already-pinned `numpy<2` + `pillow>=12.3.0`. **No OpenCV, no new heavy deps** — matches the
   lean-dep precedent (hand-rolled SFNT validator, no fontTools). Hybrid signals are built from
   row statistics + gradients + region stats; "multiple signals, not one threshold" is satisfied
   by combining several independent row features and requiring agreement.
2. Target input class = **long vertical single-column webtoon/manhwa strip**. Panels are
   axis-aligned rectangles stacked vertically; we detect **horizontal cuts between panels** and a
   **content x-extent (margins)**. True multi-column print-manhwa layouts are explicitly deferred.
3. **Analysis scale**: reduce to width ≤ 512 (aspect kept) for feature extraction; every
   detected y maps back to original coordinates linearly (source_y = analysis_y · H_src / H_ana).
   Crops are taken from the **original full-res image only** — no resampling of panel content.
4. **Eager crops**: detection writes `panel_001.png …` as files under `cache/manhwa/<source_id>/`
   plus a JSON registry (git-clean, like `fonts/licenses.json`); export re-uses them. Original
   image stored under `cache/manhwa/<source_id>/source.ext` and listed in the registry.
5. **Pure correction ops**: split/merge/bounds/delete/add/reorder/reset are pure functions on the
   panel list; the backend persists the corrected registry; `userCorrected: true` is set on any
   manual change and never overwritten by re-detect.
6. "Combined panels" must appear as one item the user splits — **no CV terminology in the UI**
   (PRODUCT_SPEC §8): actions are Split, Merge with next/previous, Adjust bounds, Delete, Add,
   Reorder, Re-detect, Reset; uncertainty surfaces via panel number + confidence + preview.
7. **Confidence ∈ [0,1]** per panel, aggregated from the boundary signals that defined it; shown
   whenever uncertainty is non-trivial.

## Modules

| Module id | Responsibility | Depends on | Ships |
|---|---|---|---|
| panel-model | `Panel` data model (`{id, sourceId, x, y, w, h, confidence, order, userCorrected}`), bounds math (validity, overlap, merge/split geometry), analysis↔source coordinate mapping, strip registry load/save. | — | 1 |
| panel-detection | Hybrid CV pipeline on analysis scale: row features (uniformity, color-discontinuity vs neighbors, edge energy, white/black-gutter darkness), signal fusion + hysteresis boundary bands, borderless-candidate handling, connected-look split hypotheses, false-positive filtering (bubbles/text/decor/empty via signal checks) → candidate `Panel[]`. | panel-model | 2 |
| panel-order | Natural top→bottom ordering; per-panel confidence aggregation; duplicate/overlap guard. | panel-detection | 3 |
| panel-export | Full-resolution PNG (lossless default) and JPG crops from the original; manifest + `panel_###.png` naming; export endpoint materialization. | panel-model | 4 |
| panel-correction | Pure ops: Split, Merge with next/previous, Adjust bounds (crop), Delete, Add, Reorder, Re-detect, Reset; sets `userCorrected`; never touches the original. | panel-model, panel-detection (re-detect), panel-order | 5 |
| manhwa-api | Backend endpoints: upload+detect, list/metadata, apply correction op, export (png/jpg), re-detect/reset; storage + asset serving. | all above | 6 |
| panel-ui | Frontend: long-strip drop, detection review (preview + number + confidence), correction actions, drag reorder, export downloads; original preserved in project. | manhwa-api | 7 |

## Build order

panel-model → panel-detection → panel-order → panel-export → panel-correction → manhwa-api → panel-ui

## What is NOT in M7 (explicit deferrals)

- Multi-column / print-page manhwa grid detection (single-column strip is the input class; a
  `panel-grid` module could extend later).
- Learned/ML segmentation of bubbles, text, characters (filtering stays classical
  signal-based).
- Live canvas preview overlay / on-strip drag-crop handles (editor polish M8); M7 correction
  uses list + preview thumbnails.
- Batch / multi-strip import, auto-crop inward margins beyond content-extent, per-strip EXIF
  orientation beyond a plain upright assumption.

## Gate

Map approved → per-module Spec → Plan → Todo → slices (TDD) → docs (D-0xx, ROADMAP M7,
FEATURES, UI_SPEC, SESSION_LOG) → graphify → regression → commit → push on go-ahead.
Fixtures: deterministic Pillow-drawn strips covering TEST_PLAN §2 (clean/black/colored gutters,
borderless, very tall, small, connected-looking, decorative, bubbles, dense text, false
boundaries).