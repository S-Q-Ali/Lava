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
                     bg_estimate = mode of gray (light or dark background)
      uniform[y]   = 1 − row std / σ_max  (0..1, 1 = flat)
      edge[y]      = normalized Canny projection
  → gutter_bands: rows where content < eps (near-empty), merged contiguous;
      band qualifies as a separator only if:
        (height ≥ GUTTER_MIN_H)                     — clean white/black/colored gutter
        OR (height ≥ 2 AND uniform AND neighbors have content)
      bands clipped at image top/bottom are boundaries, not cuts
  → cuts: midpoint of each qualifying separator band (interior only, 0<y<H)
  → confidence_cut: clean (empty, uniform, tall) → high; thin → lower
  → rescue pass (borderless / connected-looking / decorative / bubbles):
      for each inter-gutter region not yet separated, score the interior rows
      by color discontinuity + edge trough + low-local-content; a strong trough
      widest at its deepest point emits a LOW-confidence cut
  → build_panels:
      cuts (analysis) → map_cut_to_source → boxes_from_cuts → Panel(
        x=left(0), w=source_w, order=1..n, confidence=per-panel,
        user_corrected=False)
      MIN_PANEL_H guard: merge under-height panels into the next one
  → StripRegistry(...).save()   (optional save=False for tests/api reuse)
```

Height clamping: panels tile the strip exactly (first starts at 0, last ends
at source height) — no seams, no double-covered pixels.

## Signals & thresholds (module constants, not per-image tuning)

| Knob | Default | Meaning |
|------|---------|---------|
| `DEFAULT_MAX_WIDTH` | 512 | analysis width |
| `CONTENT_EPS` | 0.03 | row is "empty" if foreground coverage < 3% |
| `GUTTER_MIN_H` | 8 | analysis px a clean empty band must be to separate |
| `MIN_PANEL_H` | 24 | analysis px; smaller panels merge into next |
| `RESCUE_TROUGH_RATIO` | 0.6 | interior-score must drop to 60% of local max to cut |
| `CLEAN_CUT_CONF` | 0.95 | clean empty+uniform+wide band |
| `THIN_CUT_CONF` | 0.6 | thin band |
| `RESCUE_CUT_CONF` | 0.35 | rescue trough |

Confidence = product/weight of the signals that fired; rescue cuts can never
outrank clean cuts. Every cut is a `Cut(y_analysis, confidence, kind)`.

## Fixtures (deterministic, synthetic — TEST_PLAN §2)

Generated at test time with Pillow/OpenCV (no randomness): `clean_white`,
`clean_black` (inverted), `clean_colored` (colored gutters), `very_tall`
(10 panels), `small_strip` (3 panels), `borderless` (panels touching, thin
gap only), `connected_looking` (2 px dark separator), `decorative` (art spans
across a panel boundary), `bubbles` (speech bubbles spill into the gutter),
`dense_text`, `false_boundary` (one long panel with an internal flat horizon
band — must NOT be cut).

Each fixture carries its ground-truth cut list in analysis space. Tests assert
detected cuts ==/⊆ ground truth (± tolerance) and confidence ordering.

## Function surface (`manhwa/detect.py`)

```
load_analysis_image(path, max_width=512) → (gray, ana_w, ana_h, factor)
row_features(gray) → RowFeatures (content, uniform, edge, std)
find_gutter_bands(features) → list[GutterBand(start, end, kind, height)]
detect_cuts(features) → list[Cut(y, confidence, kind)]   # bands + rescue pass
build_panels(cuts_ana, *, source_w, source_h, ana_h, source_id) → list[Panel]
detect_strip(source_path, *, source_id, save=True, cache_dir) → StripRegistry
```

Errors: unreadable/missing image → `ManhwaError`; source not vertical enough
(width ≥ height) → `ManhwaError` (horizontal strips deferred to M8 map note).
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

- Fixtures must be deterministic; ground truth expressed in analysis space;
  tolerance ±2 analysis px for clean cuts.
- Matrix per signal: clean (white/black/colored) pass exactly; rescue fixtures
  cut within tolerance at low confidence; `false_boundary` yields no spurious
  cut; min-height merge drops slivers; very tall keeps panel count; small strip
  works at identity scale.
- Registry integration: `detect_strip` round-trips via `StripRegistry.load`
  and tiles the strip (`last.y + last.h == source_h`).

## Success criteria

- `uv run pytest` backend green (283 + new).
- Clean fixtures: cuts == ground truth. Rescue fixtures: cuts ⊇ ground truth
  within tolerance, confidence < clean confidence. `false_boundary`: no cut.
- Registry written atomically; every panel in source coords; seam-free tiling.

## Open questions

None — the M7 map fixed scope (single-column, horizontal cuts, OpenCV,
eager crops moved to module 4, multi-column/ML deferred).