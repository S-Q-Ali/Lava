"""M7 module 2: hybrid panel detection (OpenCV + numpy).

Operates on a downscaled analysis image (width ≤ 512). Every cut is scored by
multiple signals — never one threshold.

- Clean path: flat, empty (content < eps), wide (≥ GUTTER_MIN_H) runs that are
  bordered by strong content on BOTH immediate sides → confidence 0.95. Thick
  empty dead zones (flat 0-bands with empty neighbors, e.g. bubble interior)
  are rejected: a gutter must sit between painted rows, not inside one.
- Rescue pass: narrower flat empty seams (1..SEAM_MAX_H) with the same
  bordered-by-content test → confidence 0.35. Bubbles and dense text fail the
  bordered test (their neighboring rows are empty or sparse), so they never
  earn a cut — those strips merge into a single low-confidence panel the user
  can Split, per PRODUCT_SPEC §9.
- Sliver pass: cuts closer than MIN_PANEL_H drop the lower-confidence one
  (also consolidates bubble-split gutters where the clean path fired twice).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image

from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.models import ManhwaDetector, DetectionResult
from lava_backend.manhwa.order import attribute_confidence, order_panels
from lava_backend.manhwa.panels import (
    Panel,
    StripRegistry,
    analysis_scale,
    asset_name,
    boxes_from_cuts,
    make_panel,
    map_cut_to_source,
    panel_to_dict,
    validate_panels,
)

DEFAULT_MAX_WIDTH = 512
CONTENT_EPS = 0.01          # row "empty" if foreground coverage < 1% (lowered for color manhwa)
GUTTER_MIN_H = 4            # analysis px a clean empty band needs to separate (lowered for manhwa)
UNIFORM_FLAT = 0.97         # row must be this flat to count as a clean gutter
BG_TOL = 8                  # |gray − bg| above this marks a pixel as content (lowered for color pages)
STD_DENOM = 40.0            # normalizer for row std → uniform score
CLEAN_CUT_CONF = 0.95
RESCUE_CUT_CONF = 0.35
SEAM_NEIGHBOR = 0.05        # content rows immediately beside a seam must reach (lowered for manhwa)
SEAM_MAX_H = 24             # a seam is narrow; anything bigger is a clean band or dead zone
NEIGHBOR_BAND = 3           # rows sampled immediately above/below a run
MIN_PANEL_H = 24            # analysis px; thinner panels are slivers → merged


@dataclass(frozen=True)
class Cut:
    y: int            # analysis-space cut position
    confidence: float  # ∈ [0, 1]
    kind: str         # "clean" | "rescue"


@dataclass(frozen=True)
class RowFeatures:
    content: np.ndarray  # (H,) foreground coverage per row
    uniform: np.ndarray  # (H,) 1 = perfectly flat row
    edge: np.ndarray     # (H,) 1 = Canny edge activity in that row


@dataclass(frozen=True)
class GutterBand:
    start: int
    end: int
    height: int
    kind: str
    confidence: float


def load_analysis_image(image: Image.Image, max_width: int = DEFAULT_MAX_WIDTH):
    """Convert to gray float analysis image; returns (gray, ana_w, ana_h, factor).

    Peak memory guard: for JPEG strips the pixels are decoded straight to the
    analysis size via ``Image.draft`` (Pillow then reads only a decimated
    subset), so a tall full-resolution strip never materialises in RAM just to
    be downscaled. Non-JPEG (or already-decoded) images fall back to a normal
    convert+resize.
    """
    src_w, src_h = image.size
    ana_w, ana_h, factor = analysis_scale(src_w, src_h, max_width)
    arr = _analysis_array(image, (ana_w, ana_h))
    gray = arr[..., 0] * 0.299 + arr[..., 1] * 0.587 + arr[..., 2] * 0.114
    return gray, ana_w, ana_h, factor


def _analysis_array(image: Image.Image, size: tuple[int, int]) -> np.ndarray:
    """Decode ``image`` to a float32 RGB array at ``size`` (draft when possible)."""
    decoded = image
    fp = getattr(image, "fp", None)
    if getattr(image, "format", None) == "JPEG" and fp is not None and tuple(size) != image.size:
        try:
            fp.seek(0)
            draft = Image.open(fp)
            draft.draft("RGB", size)
            decoded = draft
        except Exception:
            decoded = image
    rgb = decoded.convert("RGB")
    arr = np.asarray(rgb, dtype=np.float32)
    if tuple(rgb.size) != tuple(size):
        arr = cv2.resize(arr, tuple(size), interpolation=cv2.INTER_AREA)
    return arr


def _bg_estimate(gray: np.ndarray) -> int:
    """Background color = mode of the 1px outer ring (comic margins).

    Panels carry flat fills, so the global gray mode is a panel color, not the
    background. Comic strips expose the background in outer margins, so the
    border ring is the reliable estimator; a clear majority there is required,
    otherwise fall back to the global mode (full-bleed art flush to the edge).
    """
    ring = np.concatenate([gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]])
    rounded = np.clip(np.round(ring), 0, 255).astype(np.int64)
    counts = np.bincount(rounded, minlength=256)
    bg = int(np.argmax(counts))
    if counts[bg] >= 0.5 * ring.size:
        return bg
    global_counts = np.bincount(np.clip(np.round(gray), 0, 255).astype(np.int64).ravel(), minlength=256)
    return int(np.argmax(global_counts))


def row_features(gray: np.ndarray) -> RowFeatures:
    bg = _bg_estimate(gray)
    diff = np.abs(gray - bg)
    content = (diff > BG_TOL).mean(axis=1)
    std = gray.std(axis=1)
    uniform = 1.0 - np.minimum(1.0, std / STD_DENOM)
    edges = cv2.Canny(gray.astype(np.uint8), 50, 150)
    edge = edges.any(axis=1).astype(np.float32)
    return RowFeatures(content=content, uniform=uniform, edge=edge)


def _bordered_by_content(features: RowFeatures, start: int, end: int, h: int) -> bool:
    """Both immediate sides of the [start, end) run must be strong content."""
    above = features.content[max(0, start - NEIGHBOR_BAND):start]
    below = features.content[end:min(h, end + NEIGHBOR_BAND)]
    if above.size == 0 or below.size == 0:
        return False  # touching an image edge is not a panel boundary
    return above.mean() >= SEAM_NEIGHBOR and below.mean() >= SEAM_NEIGHBOR


def find_gutter_bands(features: RowFeatures, h: int) -> list[GutterBand]:
    empty = features.content < CONTENT_EPS
    bands: list[GutterBand] = []
    i = 0
    while i < h:
        if not empty[i]:
            i += 1
            continue
        j = i
        while j < h and empty[j]:
            j += 1
        start, end = i, j
        if start > 0 and end < h:  # interior only; clipped boundary bands are not cuts
            height = end - start
            # robust flatness: median survives 1-2 half-blended transition rows
            flat = float(np.median(features.uniform[start:end])) > UNIFORM_FLAT
            if height >= GUTTER_MIN_H and flat and _bordered_by_content(features, start, end, h):
                bands.append(GutterBand(start, end, height, "clean", CLEAN_CUT_CONF))
        i = j
    return bands


def _rescue_cuts(features: RowFeatures, spans: list[tuple[int, int]], h: int) -> list[Cut]:
    """1..SEAM_MAX_H flat empty runs between clean bands, bordered by content."""
    empty = features.content < CONTENT_EPS
    flat_band = features.uniform > UNIFORM_FLAT
    out: list[Cut] = []
    for lo, hi in spans:
        i = lo
        while i < hi:
            if not (empty[i] and flat_band[i]):
                i += 1
                continue
            j = i
            while j < hi and empty[j] and flat_band[j]:
                j += 1
            height = j - i
            if 1 <= height <= SEAM_MAX_H and _bordered_by_content(features, i, j, h):
                out.append(Cut(y=(i + j) // 2, confidence=RESCUE_CUT_CONF, kind="rescue"))
            i = j
    return out


def merge_slivers(cuts: list[Cut], h: int) -> list[Cut]:
    """Drop lower-confidence cuts that create sub-MIN_PANEL_H interior panels."""
    _ = h
    cuts = sorted(cuts, key=lambda c: c.y)
    while len(cuts) > 1:
        improved = False
        for a, b in zip(cuts, cuts[1:]):
            if b.y - a.y < MIN_PANEL_H:
                lower = a if a.confidence <= b.confidence else b
                cuts.remove(lower)
                improved = True
                break
        if not improved:
            break
    return cuts


def detect_cuts(features: RowFeatures, h: int) -> list[Cut]:
    bands = find_gutter_bands(features, h)
    cuts: list[Cut] = []
    spans = [(0, bands[0].start)] if bands else [(0, h)]
    for idx in range(len(bands)):
        end_bound = bands[idx + 1].start if idx + 1 < len(bands) else h
        spans.append((bands[idx].end, end_bound))
    rescue = _rescue_cuts(features, spans, h)
    for band in bands:
        cuts.append(Cut(y=(band.start + band.end) // 2, confidence=band.confidence, kind=band.kind))
    cuts.extend(rescue)
    return merge_slivers(cuts, h)


def build_panels(
    cuts: list[Cut],
    *,
    source_id: str,
    src_w: int,
    src_h: int,
    ana_w: int,
    ana_h: int,
) -> list[Panel]:
    """Convert analysis-space cuts into seam-free source-space incident panels.

    Cut lines are mapped once through `map_cut_to_source`; `boxes_from_cuts`
    derives each raw panel box from consecutive mapped lines, so boxes tile
    without gaps or overlap (regardless of rounding). Reading order and panel
    confidence then come from the panel-order module (single source of truth):
    `order_panels` normalizes, `attribute_confidence` sets each panel to the
    worst of its two bounding cut confidences (source edges count as certain).
    """
    lines = [(0, 1.0)]
    lines += sorted((map_cut_to_source(c.y, src_h=src_h, ana_h=ana_h), c.confidence) for c in cuts)
    lines += [(src_h, 1.0)]
    raw: list[Panel] = []
    boundaries: list[float] = []
    last_conf = 1.0
    for (top, top_conf), (bottom, bottom_conf) in zip(lines, lines[1:]):
        if bottom <= top:  # rounding collapsed adjacent cuts
            continue
        x, y, w, h = boxes_from_cuts(top, bottom, left=0, right=src_w)
        raw.append(
            make_panel(
                id=f"p{len(raw) + 1}",
                source_id=source_id,
                x=x,
                y=y,
                w=w,
                h=h,
                order=1,
                source_w=src_w,
                source_h=src_h,
                confidence=1.0,
            )
        )
        boundaries.append(top_conf)
        last_conf = bottom_conf
    boundaries.append(last_conf)
    panels = attribute_confidence(order_panels(raw), boundaries)
    validate_panels(panels)
    return panels


def _ml_detections_to_panels(
    detection: DetectionResult,
    *,
    source_id: str,
) -> list[Panel]:
    """Convert ML bounding box detections to Panel objects.

    Filters to panel-class detections only, sorts top-to-bottom,
    and assigns reading order.
    """
    panel_dets = [d for d in detection.panels if d.class_name in ("panel", "frame")]
    if not panel_dets:
        panel_dets = detection.panels
    panel_dets = sorted(panel_dets, key=lambda d: d.y)

    panels: list[Panel] = []
    for i, det in enumerate(panel_dets):
        panels.append(make_panel(
            id=f"p{i + 1}",
            source_id=source_id,
            x=det.x,
            y=det.y,
            w=det.w,
            h=det.h,
            order=i + 1,
            source_w=detection.image_width,
            source_h=detection.image_height,
            confidence=det.confidence,
        ))
    return order_panels(panels)


def detect_strip(
    source: str | Path | Image.Image,
    *,
    source_id: str,
    save: bool = True,
    cache_dir: str | Path | None = None,
) -> dict[str, Any]:
    """Detect panels in a vertical strip; optionally persist crops + registry.

    Detection strategy:
    1. Try ML detection (YOLO nano → seg) if models are available
    2. Fall back to classical CV pipeline if ML unavailable or fails

    The strip must be single-column (taller than wide) for CV detection.
    ML detection works on any aspect ratio. Analysis runs at ≤ 512 px for CV;
    ML uses the model's native input size.
    """
    image, mime, source_file = _open_source(source)
    src_w, src_h = image.size

    ml_result = None
    detection_method = "cv"
    cuts: list[Cut] = []

    ml_path = _source_path_for_ml(source)
    if ml_path is not None:
        ml_result = ManhwaDetector.detect_auto(
            image_path=ml_path,
            confidence=0.10,
        )
    if ml_result and len(ml_result.panels) > 0:
        detection_method = ml_result.method
        panels = _ml_detections_to_panels(ml_result, source_id=source_id)
    else:
        gray, ana_w, ana_h, factor = load_analysis_image(image)
        if src_w > src_h:
            # Landscape pages: return whole page as one panel (no cuts attempted)
            cuts = []
        else:
            cuts = detect_cuts(row_features(gray), ana_h)
        panels = build_panels(
            cuts,
            source_id=source_id,
            src_w=src_w,
            src_h=src_h,
            ana_w=ana_w,
            ana_h=ana_h,
        )

    result: dict[str, Any] = {
        "sourceId": source_id,
        "sourceFile": source_file,
        "width": src_w,
        "height": src_h,
        "mime": mime,
        "detectionMethod": detection_method,
        "analysis": {
            "cuts": [
                {"y": c.y, "confidence": c.confidence, "kind": c.kind}
                for c in cuts
            ],
        },
        "panels": [panel_to_dict(p) for p in panels],
        "saved": bool(save),
        "cachePath": None,
    }
    if save:
        if cache_dir is None:
            raise ValueError("cache_dir is required when save=True")
        base = Path(cache_dir) / "manhwa" / source_id
        base.mkdir(parents=True, exist_ok=True)
        for panel in panels:
            crop = image.crop((panel.x, panel.y, panel.x + panel.w, panel.y + panel.h)).convert("RGB")
            crop.save(base / asset_name(panel.order, len(panels)), format="PNG")
        StripRegistry(
            path=base / "registry.json",
            source_id=source_id,
            source_file=source_file,
            width=src_w,
            height=src_h,
            mime=mime,
            panels=panels,
        ).save()
        result["cachePath"] = str(base)
    return result


def _source_path_for_ml(source: str | Path | Image.Image) -> str | Path | None:
    """Extract a file path suitable for ML inference from the source input.

    Returns None if the source is an in-memory Image without a file path,
    so callers can fall back to classical CV.
    """
    if isinstance(source, Image.Image):
        fp = getattr(source, "fp", None)
        if fp is not None:
            return fp
        filename = getattr(source, "filename", None)
        if filename:
            return filename
        return None
    return source


def _open_source(source: str | Path | Image.Image) -> tuple[Image.Image, str, str]:
    """Return (image, mime, source file name); unreadable → ManhwaError.

    For path inputs the image is returned **lazy** (PIL headers only, no pixels
    decoded) so callers can choose when to incur the decode cost.  The first
    consumer that needs pixel data (``convert``, ``crop``, ``save``) will
    trigger a full load; the analysis path avoids this via JPEG draft decoding.
    """
    if isinstance(source, Image.Image):
        image = source.convert("RGB") if source.mode != "RGB" else source
        return image, (source.format or "png").lower(), str(getattr(source, "filename", "") or "image")
    path = Path(source)
    try:
        with Image.open(path) as probe:
            probe.verify()
        image = Image.open(path)
    except (OSError, ValueError) as exc:
        raise ManhwaError(f"can't read image {path}: {exc}") from exc
    mime = (image.format or path.suffix.lstrip(".").lower()).lower()
    return image, mime, path.name