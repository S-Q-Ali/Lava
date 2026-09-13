# SPEC — M7 module 1: `panel-model`

## Objective

Single source of truth for a Manhwa panel collection: a validated `Panel` data
model matching PRODUCT_SPEC §9 (`{panel id, source image id, x, y, width,
height, confidence, order, user-corrected flag}`), deterministic
analysis-scale ↔ source-resolution mapping, panel asset naming
(`panel_001.png …`, original preserved), and a git-clean on-disk registry the
whole pipeline shares. No image processing — pure data + math only.

## Commands

```
Install:  uv sync --extra dev            (backend/)
Test:     uv run pytest tests/test_manhwa_panels.py
Regression: uv run pytest                 (backend, full suite)
```

## Project structure

```
backend/src/lava_backend/manhwa/
├── __init__.py
└── panels.py          → Panel, bounds helpers, scaling, asset naming, registry
backend/tests/test_manhwa_panels.py
```

## Data model

```python
@dataclass(frozen=True)
class Panel:
    id: str               # "p1", "p2", ... (stable, source-local)
    source_id: str        # "mh-<hex>"
    x: int                # source-resolution pixel bounds
    y: int
    w: int
    h: int
    confidence: float     # 0..1
    order: int            # 1-based reading order (top→bottom)
    user_corrected: bool  # True once touched by a correction op
```

Constraints (enforced on construction via `make_panel`/`validate_panel`):
- `w > 0`, `h > 0`, `x >= 0`, `y >= 0`, `x + w <= source_w`, `y + h <= source_h`.
- `confidence` clamped to `[0, 1]`.
- `order >= 1`.
- Rejects: negative/zero spans, out-of-image bounds, NaN confidence, empty/dup ids.

## StripRegistry

```python
class StripRegistry:
    path: Path            # cache/manhwa/<source_id>/registry.json
    source_id: str
    source_file: str      # original image file name (source.ext)
    width: int            # original image dimensions
    height: int
    mime: str
    panels: list[Panel]
```

- JSON layout `{version: 1, sourceId, sourceFile, width, height, mime, ...,
  panels: [...]}`; `save()`/`load()`.
- Corrupt/missing/unknown-version files raise `ManhwaError` with an actionable
  message (mirrors `fonts.load_registry` steal-behavior for corrupt only-in-dev
  — load returns errors rather than silently rewriting user data; no silent
  overwrite).
- `reset_panels()` strips the panel list back to empty without touching
  `sourceFile`.

## Coordinate mapping (analysis ↔ source)

- `analysis_scale(source_w, source_h, max_width=512)` → `(ana_w, ana_h,
  factor)` keeping aspect, factor = `source_h / ana_h` (source px per analysis
   px, rounded; deterministic floor).
- `map_bounds_to_source(x, y, w, h, src_h, ana_h)` → source rect via
  `int(round(y * src_h / ana_h))` etc., clamped to image bounds.
- Guarantee: analysis coordinates from `panel-detection` are always mapped
  back by this module before storage.
- Boundary-anchored contract: mapping anchors each **cut line** (a single
  analysis y-coordinate) and maps it to the source with the deterministic
  bilinear anchor; each panel's box is then derived from the two mapped cuts
  above/below it (plus x-extent cuts). Individual panel boxes are never rounded
  independently — that would let adjacent panels drift apart by ±factor px and
  leave seams. This module exposes `map_cut_to_source` and
  `boxes_from_cuts(top, bottom, ...)`; `map_bounds_to_source` stays for forward
  compatibility but the detector uses the anchored form.

## Asset naming

- `asset_name(order, total)` → `panel_001.png …` zero-padded by `len(total)`.
- `id_for_asset` / `asset_for_id` invert the mapping (ids survive renames after
  correction — ids are stable; asset file names may be renumbered at export).

## Boundaries

- Always: pure functions, frozen data, `validate_panel` on every entry/exit,
  registry writes are atomic (temp + rename).
- Ask first: shape changes to the registry JSON layout, adding non-manhwa
  fields to the record.
- Never: touch image bytes, read `cache/manhwa` outside this module, mutate a
  registry that failed validation.

## Testing strategy

Deterministic unit tests (no images needed) in `tests/test_manhwa_panels.py`:
- `Panel` construction valid/invalid matrix (negative spans, out-of-bounds,
  NaN confidence, duplicate ids).
- `analysis_scale` rounding at exact/aspect ratios (512-max, tall/short/wide).
- `map_bounds_to_source` round-trips (bilinear anchor) and clamps;
  `map_cut_to_source` + `boxes_from_cuts` produce seamless adjacent boxes.
- `StripRegistry` save/load round-trip, atomic write (temp+rename observable),
  corrupt/unknown-version errors, `reset_panels` preserves sourceFile.
- `asset_name` zero-padding at 1/9/10/100 panels; id↔asset inversion.

## Success criteria

- `make_panel`/`validate_panel` reject every invalid case in the matrix.
- Registry round-trips byte-identically; corrupt file → `ManhwaError`, no data
  loss, no silent rewrite.
- Mapping functions are deterministic and clamp outside-bounds inputs.
- Backend suite stays green (245 + new).

## Open questions

None — boundaries decided in the M7 map (structure mirrors
`fonts/licenses.json` + `presets/registry.json` precedents).