# SPEC — M7 module 2: `panel-detection`

## Objective

Turn one long vertical manhwa/webtoon strip into panel cuts, using a
**hybrid, multi-signal CV pipeline** on a downscaled *analysis image* (width ≤
512, via `analysis_scale` from module 1), then persist a git-clean
`StripRegistry` at `cache/manhwa/<source_id>/registry.json`. **Never** a single
contour threshold (ARCHITECTURE §5, TEST_PLAN §2): gutters, darkness, color
discontinuity, edge energy and connectivity all vote.

Input class (from the M7 map): single-column strip; panels are axis-aligned
rectangles; only horizontal cuts are inferred. Analysis bounding boxes are
mapped to source resolution with the **boundary-anchored** cut mapping from
module 1 (no per-panel drift).

## Commands

```
Install:  uv sync --extra dev                  (backend/)
Test:     uv run pytest tests/test_manhwa_detect.py
Regression: uv run pytest
```

## Pipeline

```
source image (PIL)
  → decode RGB (matching.py convention)
  → analysis_scale(source_w, source_h, max_width=512)  → gray H×W float
  → row_features(gray):
      content[y]   = foreground coverage  (|gray − bg_estimate| > τ / row)
                     bg_estimate = mode of the 1px outer ring (comic margins),
                     falling back to the global gray mode for full-bleed art
      uniform[y]   = 1 − row std / σ_max  (0..1, 1 = flat)
      edge[y]      = normalized Canny projection
  → gutter_bands: rows where content < eps (near-empty), merged contiguous;
      a band is a candidate separator only if interior (0<start, end<H) and
      bordered by content on BOTH immediate sides (NEIGHBOR_BAND rows ≥
      SEAM_NEIGHBOR). It is then either:
        clean  = height ≥ GUTTER_MIN_H AND median(uniform) > UNIFORM_FLAT
                 → confidence 0.95 (white/black/colored gutter)
        rescue = 1 ≤ height ≤ SEAM_MAX_H, every row empty + flat
                 → confidence 0.35 (borderless/connected-looking seam)
      bands clipped at image top/bottom are boundaries, not cuts; thick flat
      dead zones (bubble interior, flat horizons) fail the bordered test
  → cuts: midpoint of each qualifying separator band
  → merge_slivers: while two adjacent cuts enclose < MIN_PANEL_H of interior,
      drop the lower-confidence cut (close gutters, bubble-split gutters)
  → rescue scan runs over spans between clean bands (or the whole strip when
      no clean band exists) — never across a clean band
  → build_panels:
      cuts (analysis) → map_cut_to_source once → lines sorted → boxes_from_cuts
      → Panel(x=0, w=source_w, order=1..n, confidence = min of the two
        bounding cut confidences, user_corrected=False); box tiling is
        seam-free by construction (consecutive mapped lines, no double cover)
  → StripRegistry(...).save()   (optional save=False for tests/api reuse)
```

Height clamping: panels tile the strip exactly (first starts at 0, last ends
at source height) — no seams, no double-covered pixels.

## Signals & thresholds (module constants, not per-image tuning)

| Knob | Default | Meaning |
|------|---------|---------|
| `DEFAULT_MAX_WIDTH` | 512 | analysis width |
| `CONTENT_EPS` | 0.03 | row is "empty" if foreground coverage < 3% |
| `UNIFORM_FLAT` | 0.97 | median uniformity needed for a clean band |
| `BG_TOL` | 12 | |gray − bg| above this marks a pixel as content |
| `STD_DENOM` | 40.0 | normalizer for row std → uniform score |
| `GUTTER_MIN_H` | 8 | analysis px a clean empty band must be to separate |
| `SEAM_MAX_H` | 24 | a rescue seam is at most this tall; beyond = clean/dead zone |
| `SEAM_NEIGHBOR` | 0.15 | boundary rows must average at least this content |
| `NEIGHBOR_BAND` | 3 | rows sampled immediately above/below a run |
| `MIN_PANEL_H` | 24 | analysis px; closer cuts drop the lower-confidence one |
| `CLEAN_CUT_CONF` | 0.95 | clean empty+uniform+wide band |
| `RESCUE_CUT_CONF` | 0.35 | rescue seam |

Cut confidence is fixed per kind (0.95 clean / 0.35 rescue); a panel's
confidence is the min of its two bounding cuts (source edges count as 1.0), so
rescue-bounded panels can never outrank clean-bounded ones. Every cut is a
`Cut(y_analysis, confidence, kind)`.

## Fixtures (deterministic, synthetic — TEST_PLAN §2)

Generated at test time with Pillow/OpenCV (no randomness): `clean_white`,
`clean_black` (inverted), `clean_colored` (colored gutters), `very_tall`
(10 panels), `small_strip` (3 panels), `borderless` (panels touching, thin
gap only), `connected_looking` (2 px dark separator), `decorative` (art spans
across a panel boundary), `bubbles` (speech bubbles spill into the gutter),
`dense_text`, `close_gutters` (two gutters separated by a sliver → merges to
one cut), `false_boundary` (one long panel with an internal flat horizon band
— must NOT be cut).

Fixtures carry a 3 px background margin (so the ring bg-estimate is anchored
in tests too) plus deterministic vertical texture, keeping the mode honest;
ground-truth cut positions are in SOURCE coordinates (margins included) and
mapped to analysis space by `analysis_scale` in the tests. Cut assertions use
±2 analysis px for clean cuts, ±3 source px for rescue cuts.

## Function surface (`manhwa/detect.py`)

```
load_analysis_image(image, max_width=512) → (gray, ana_w, ana_h, factor)
row_features(gray) → RowFeatures (content, uniform, edge)
find_gutter_bands(features, h) → list[GutterBand(start, end, height, kind, confidence)]
_rescue_cuts(features, spans, h) → list[Cut]            # interior seam scans
merge_slivers(cuts, h) → list[Cut]                      # drop lower-conf slivers
detect_cuts(features, h) → list[Cut(y, confidence, kind)]  # clean + rescue + merge
build_panels(cuts, *, source_id, src_w, src_h, ana_w, ana_h) → list[Panel]
detect_strip(source, *, source_id, save=True, cache_dir) → dict  # + crops/registry
```

Errors: unreadable/missing image → `ManhwaError`; source not vertical
(width > height) → `ManhwaError` (horizontal strips deferred to M8 map note).
No network, no model download; OpenCV + numpy only.

## Boundaries

- Always: deterministic (no randomness), garbage-safe (Pillow RGB convert),
  analysis-only math, registry save atomic (module 1).
- Ask first: adding per-image tuning above the module-constant table, region
  proposals beyond horizontal cuts (multi-column), ML segmentation.
- Never: cut on one threshold alone; report panel pixels in analysis space
  (source storage only); mutate the original image; emit confidence 0 (keep
  degenerate strips to a single full-width panel at low confidence — the UI
  then offers Split, per PRODUCT_SPEC §9).

## Testing strategy

- Fixtures must be deterministic; ground truth expressed in source coords and
  mapped to analysis via `analysis_scale`; tolerance ±2 analysis px for clean
  cuts.
- Matrix per signal: clean (white/black/colored) pass exactly; rescue fixtures
  cut within tolerance at low confidence; `false_boundary` yields no spurious
  cut; sliver merge collapses close gutters; very tall keeps panel count; small
  strip works at identity scale.
- Registry integration: `detect_strip` round-trips via `StripRegistry.load`,
  saves original-resolution crops, is idempotent on rerun, and tiles the strip
  (`last.y + last.h == source_h`).

## Success criteria

- `uv run pytest` backend green (312).
- Clean fixtures: cuts == ground truth. Rescue fixtures: cuts ⊇ ground truth
  within tolerance, confidence < clean confidence. `false_boundary`: no cut.
- Registry written atomically; every panel in source coords; seam-free tiling.

## Open questions

None — the M7 map fixed scope (single-column, horizontal cuts, OpenCV,
eager crops moved to module 4, multi-column/ML deferred).