# Plan — M7 module 2: panel-detection (OpenCV hybrid signals)

Four TDD slices; each slice ends backend-green and committed.

## Slice 1 — analysis image + row features + clean-gutter cuts (RED first)
- `backend/tests/fixtures/manhwa_strips.py` (new): deterministic synthetic
  strips builder (Pillow/OpenCV, no randomness) with ground-truth cuts in
  analysis space: `clean_white`, `clean_black` (inverted), `clean_colored`,
  `very_tall` (10), `small_strip` (3), `false_boundary`.
- `manhwa/detect.py` (new): `load_analysis_image` (decode RGB, analysis_scale,
  gray, bg-estimate), `row_features` (content/uniform/edge), `find_gutter_bands`,
  `detect_cuts` (clean bands only, confidence).
- Tests: clean fixtures cut == ground truth; confidence high; interior-only.

## Slice 2 — rescue pass + edge cases
- `detect_cuts` rescue pass: flat empty seam runs (1..SEAM_MAX_H) that pass the
  same bordered-by-content test → low-confidence (0.35) cuts; `merge_slivers`
  drops lower-confidence cuts creating sub-MIN_PANEL_H panels. Delivered: bg
  estimate anchored on the 1px outer ring (margins) with a global-mode fallback.
- Fixtures: `borderless`, `connected_looking`, `decorative`, `bubbles`,
  `dense_text`, `close_gutters`, `false_boundary`.
- Tests: rescue cuts within tolerance, confidence < clean; min-height merge
  drops slivers; bubbles/decorative/dense text never earn spurious cuts.

## Slice 3 — build_panels + registry integration
- `build_panels` (boundary-anchored mapping → source Panel list, order,
  confidence = min of bounding cuts, seam-free tiling) + `detect_strip`
  (metadata + optional original-resolution crops + registry save).
- Tests: detect_strip → StripRegistry.load round-trip, original-res crops,
  idempotent rerun, last panel reaches source height, unreadable image /
  non-vertical source → ManhwaError.

## Slice 4 — docs + graphify + regression + push gate
- D-028 in DECISIONS.md, ROADMAP module-2 done, FEATURES module-7 block,
  SESSION_LOG 21, todo tick; `graphify update .`; full regression
  (`uv sync --extra dev && uv run pytest`); push on go-ahead.