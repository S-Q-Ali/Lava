"""Deterministic synthetic manhwa strip fixtures (M7 module 2).

Source-space images + ground-truth cut positions (middle of each gutter) in
SOURCE coordinates. No randomness: Pillow/OpenCV geometry only.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class StripFixture:
    name: str
    image: Image.Image
    src_cuts: tuple[int, ...]  # source-space cut y positions (gutter midpoints)
    src_w: int
    src_h: int


def _image(width: int, height: int, bg: tuple[int, int, int]) -> np.ndarray:
    arr = np.zeros((height, width, 3), dtype=np.uint8)
    arr[:] = bg
    return arr


def _rect(arr: np.ndarray, y0: int, y1: int, color: tuple[int, int, int]) -> None:
    arr[y0:y1, :, :] = color


def _gutter_strip(
    *,
    name: str,
    width: int,
    height: int,
    bg: tuple[int, int, int],
    panels: list[tuple[int, int, int]],
    content_h: int,
    gutter_h: int,
) -> StripFixture:
    arr = _image(width, height, bg)
    cuts: list[int] = []
    n = len(panels)
    y = 0
    for i in range(n):
        _rect(arr, y, y + content_h, panels[i])
        y += content_h
        if i < n - 1:
            cuts.append(y + gutter_h // 2)
            y += gutter_h
    return StripFixture(
        name=name,
        image=Image.fromarray(arr),
        src_cuts=tuple(cuts),
        src_w=width,
        src_h=height,
    )


def make_clean_white() -> StripFixture:
    """White gutters, solid-gray panels, 4 panels + trailing empty bottom."""
    return _gutter_strip(
        name="clean_white",
        width=800,
        height=2400,
        bg=(245, 245, 245),
        panels=[(96, 96, 96), (140, 140, 140), (80, 80, 80), (170, 170, 170)],
        content_h=180,
        gutter_h=16,
    )


def make_clean_black() -> StripFixture:
    """Black gutters, light panels (inverted strip)."""
    return _gutter_strip(
        name="clean_black",
        width=800,
        height=2400,
        bg=(10, 10, 10),
        panels=[(220, 220, 220), (200, 205, 210), (215, 210, 205), (225, 220, 215)],
        content_h=180,
        gutter_h=16,
    )


def make_clean_colored() -> StripFixture:
    """Colored gutters, distinct panel colors."""
    return _gutter_strip(
        name="clean_colored",
        width=800,
        height=2400,
        bg=(40, 80, 160),
        panels=[(200, 60, 60), (60, 200, 60), (180, 50, 220), (230, 180, 40)],
        content_h=180,
        gutter_h=16,
    )


def make_very_tall() -> StripFixture:
    """20 panels, tall strip (ana_h≈2560)."""
    n = 20
    palette = [
        (96 + (i * 11) % 90, (i * 17) % 120 + 60, (i * 23) % 160 + 40)
        for i in range(n)
    ]
    return _gutter_strip(
        name="very_tall",
        width=800,
        height=4000,
        bg=(250, 250, 250),
        panels=palette,
        content_h=180,
        gutter_h=16,
    )


def make_small_strip() -> StripFixture:
    """3 panels at identity scale (width 300 ≤ 512)."""
    return _gutter_strip(
        name="small_strip",
        width=300,
        height=900,
        bg=(240, 240, 240),
        panels=[(100, 100, 100), (150, 150, 150), (70, 70, 70)],
        content_h=180,
        gutter_h=16,
    )


def make_false_boundary() -> StripFixture:
    """One long panel with an interior solid-color band (sky) — must NOT cut.

    The band is a different uniform color (95) inside the panel fill (120) on a
    white background: flat, uniform, but it is content (differs from bg), so no
    empty band exists and no cut may be emitted — color discontinuity alone is
    not enough (rescue requires a low-content trough, slice 2).
    """
    arr = _image(800, 1600, (245, 245, 245))
    _rect(arr, 0, 1600, (120, 120, 120))
    _rect(arr, 700, 740, (95, 95, 95))
    return StripFixture(
        name="false_boundary",
        image=Image.fromarray(arr),
        src_cuts=(),
        src_w=800,
        src_h=1600,
    )


AVAILABLE = {
    "clean_white": make_clean_white,
    "clean_black": make_clean_black,
    "clean_colored": make_clean_colored,
    "very_tall": make_very_tall,
    "small_strip": make_small_strip,
    "false_boundary": make_false_boundary,
}