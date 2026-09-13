# SPEC — M7 module 4: `panel-export`

## Objective

Turn the registry's source-space panel boxes into **full-resolution export
files**: PNG (lossless default) or JPG, cropped from the original strip only,
plus a manifest of what was produced — using the unified `panel_###` naming
from module 1 and the normalization rules from module 3. Pure generation (no
I/O, no network); the HTTP endpoint is wired later in `manhwa-api` (module 6).

Detection already eager-crops to `cache/manhwa/<source_id>/panel_*.png`; export
regenerates from the original so JPG quality and re-exports after correction
stay correct regardless of the cache.

## Commands

```
Test:       uv run pytest tests/test_manhwa_export.py -q
Regression: uv run pytest
```

## Functions (`manhwa/export.py`)

```
crop_panel(source: Image.Image, panel: Panel) -> Image.Image
    original-resolution crop box (x, y, w, h); boxes already clamped at
    construction (module 1), so crop is safe.

encode_panel(image: Image.Image, *, fmt: Literal["png", "jpg"], quality: int = 92) -> bytes
    PNG = lossless (quality ignored); JPG quality must be 1..100 → ValueError
    otherwise. Repeated encode is deterministic for the same input pixels.

manifest_rows(panels, *, fmt) -> list[dict]
    one entry per panel (in reading order): file, id, order, x, y, w, h,
    width, height, confidence. file = asset_name(order, total) + suffix.

materialize_export(source: Image.Image, panels, *, fmt="png", quality=92) -> ExportBundle
    normalizes via order_panels/guard_layout (module 3), crops + encodes each
    panel, and returns an ExportBundle(fmt, manifest, files=[(name, bytes)]).
    Panels may arrive out of order; the manifest/files are always 1..n in
    reading order.
```

`ExportBundle`: frozen dataclass `{fmt, manifest: list[dict], files: list[
ExportFile(name: str, data: bytes)]}`.

Defaults/knobs: `JPG_QUALITY_DEFAULT = 92`, `EXPORT_PNG`/`EXPORT_JPG`
suffixes reuse `asset_name`.

## Wire precedence

- `panel-export` owns the materialization logic; `manhwa-api` (module 6)
  adds `export (png/jpg)` HTTP + zip. No endpoint here.
- Guard/normalize always runs at export so a corrected registry exports in a
  clean 1..n reading order (D-029 payoff).

## Testing (TDD)

- `crop_panel`: crop == source.sx-identical region; id-different from source
  (new image); box fields carried through.
- `encode_panel`: PNG round-trips losslessly (decode == crop); JPG decodes to
  a valid same-size image; quality 0/101 → ValueError; quality 1..100 passes.
- `manifest_rows`: names `panel_001.png…` zero-padded by total; sorting by
  order; geometry matches panels; confidence echoed.
- `materialize_export`: shuffled panels → ordered manifest + ordered file
  names; PNG files == crop bytes (lossless equality via re-decode); JPG switch
  changes suffix and keeps manifest consistent; empty panels → ManhwaError;
  overlapping/garbage layout → ManhwaError (guard).
- Real strip: `AVAILABLE["clean_white"]` → materialize PNG at original res;
  each file decodes to that panel's width/height; last panel reaches source
  height.

## Boundaries

- Always: crop original resolution only; never resample panel content;
  deterministic; pure functions.
- Ask first: zip/archive formats, streaming endpoints, per-panel metadata
  sidecars (module 6), EXIF handling.
- Never: mutate the source image; resize panels; write files.