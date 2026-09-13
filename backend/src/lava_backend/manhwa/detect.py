"""M7 module 2: hybrid panel detection (OpenCV + numpy).

Operates on a downscaled analysis image (width ≤ 512). Every cut is scored by
multiple signals — never one threshold. Clean gutters must be both empty and
flat; everything else is deferred to the rescue pass (slice 2) or the user's
manual correction tools.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image

from lava_backend.manhwa.panels import analysis_scale

DEFAULT_MAX_WIDTH = 512
CONTENT_EPS = 0.03          # row "empty" if foreground coverage < 3%
GUTTER_MIN_H = 8            # analysis px a clean empty band needs to separate
UNIFORM_FLAT = 0.97         # row must be this flat to count as a clean gutter
BG_TOL = 12                 # |gray − bg| above this marks a pixel as content
STD_DENOM = 40.0            # normalizer for row std → uniform score
CLEAN_CUT_CONF = 0.95
THIN_CUT_CONF = 0.6


@dataclass(frozen=True)
class Cut:
    y: int            # analysis-space cut position
    confidence: float  # ∈ [0, 1]
    kind: str         # "clean" | "thin" | (later) "rescue"


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
    """Convert to gray float analysis image; returns (gray, ana_w, ana_h, factor)."""
    rgb = image.convert("RGB")
    src_w, src_h = rgb.size
    arr = np.asarray(rgb, dtype=np.float32)
    ana_w, ana_h, factor = analysis_scale(src_w, src_h, max_width)
    if (ana_w, ana_h) != (src_w, src_h):
        arr = cv2.resize(arr, (ana_w, ana_h), interpolation=cv2.INTER_AREA)
    gray = arr[..., 0] * 0.299 + arr[..., 1] * 0.587 + arr[..., 2] * 0.114
    return gray, ana_w, ana_h, factor


def _bg_estimate(gray: np.ndarray) -> int:
    """Most common gray level (light or dark background both work)."""
    rounded = np.clip(np.round(gray), 0, 255).astype(np.int64)
    counts = np.bincount(rounded.ravel(), minlength=256)
    return int(np.argmax(counts))


def row_features(gray: np.ndarray) -> RowFeatures:
    bg = _bg_estimate(gray)
    diff = np.abs(gray - bg)
    content = (diff > BG_TOL).mean(axis=1)
    std = gray.std(axis=1)
    uniform = 1.0 - np.minimum(1.0, std / STD_DENOM)
    edges = cv2.Canny(gray.astype(np.uint8), 50, 150)
    edge = edges.any(axis=1).astype(np.float32)
    return RowFeatures(content=content, uniform=uniform, edge=edge)


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
            flat = features.uniform[start:end].mean() > UNIFORM_FLAT
            if height >= GUTTER_MIN_H:
                bands.append(GutterBand(start, end, height, "clean", CLEAN_CUT_CONF))
            elif height >= 2 and flat:
                bands.append(GutterBand(start, end, height, "thin", THIN_CUT_CONF))
        i = j
    return bands


def detect_cuts(features: RowFeatures, h: int) -> list[Cut]:
    """Clean-gutter cuts only (slice 1). Rescue pass arrives in slice 2."""
    cuts: list[Cut] = []
    for band in find_gutter_bands(features, h):
        mid = (band.start + band.end) // 2
        cuts.append(Cut(y=mid, confidence=band.confidence, kind=band.kind))
    return cuts