"""Deterministic synthetic manhwa strip fixtures (M7 module 2).

Realistic webtoons: background color fills outer margins AND gutters, panels
carry deterministic texture (busy art, so no single flat color dominates the
gray histogram and the background stays the image mode). No randomness:
Pillow/OpenCV geometry only. Source-space images + ground-truth cut positions
(middle of each gutter) in SOURCE coordinates (margins included).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image

MARGIN = 3


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


def _darken(color: tuple[int, int, int], f: float = 0.72) -> tuple[int, int, int]:
    return tuple(int(round(c * f)) for c in color)


def _texture(arr: np.ndarray, y0: int, y1: int, color: tuple[int, int, int]) -> None:
    """Deterministic vertical hatch — busy panels, no flat color dominates."""
    alt = _darken(color)
    for x in range(0, arr.shape[1], 8):
        arr[y0:y1, x:x + 2, :] = alt


def _wrap(arr: np.ndarray, bg: tuple[int, int, int], cuts: list[int]) -> tuple[np.ndarray, int, int, list[int]]:
    """Pad with a background margin; return (padded, w, h, shifted cuts)."""
    h, w, _ = arr.shape
    out = np.zeros((h + 2 * MARGIN, w + 2 * MARGIN, 3), dtype=np.uint8)
    out[:] = bg
    out[MARGIN : MARGIN + h, MARGIN : MARGIN + w, :] = arr
    return out, w + 2 * MARGIN, h + 2 * MARGIN, [c + MARGIN for c in cuts]


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
        _texture(arr, y, y + content_h, panels[i])
        y += content_h
        if i < n - 1:
            cuts.append(y + gutter_h // 2)
            y += gutter_h
    arr, w, h, cuts = _wrap(arr, bg, cuts)
    return StripFixture(name=name, image=Image.fromarray(arr), src_cuts=tuple(cuts), src_w=w, src_h=h)


def make_clean_white() -> StripFixture:
    """White gutters, textured panels, 4 panels + trailing bottom bg."""
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
    """Black gutters, light textured panels (inverted strip)."""
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
    """20 panels, tall strip."""
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

    The band is a different uniform color (95) inside the panel fill (120) on
    white margins: it is content (differs from bg), so no empty band exists and
    no cut may be emitted.
    """
    arr = _image(800, 1600, (245, 245, 245))
    _rect(arr, 0, 1600, (120, 120, 120))
    _texture(arr, 0, 1600, (120, 120, 120))
    _rect(arr, 700, 740, (95, 95, 95))
    arr, w, h, cuts = _wrap(arr, (245, 245, 245), [])
    return StripFixture(name="false_boundary", image=Image.fromarray(arr), src_cuts=(), src_w=w, src_h=h)


def _identity_strip(
    *,
    name: str,
    seams: list[tuple[int, int]],  # (content_h, seam_h) repeated; seams drawn by _seam hook
    bg: tuple[int, int, int],
    panel_fills: list[tuple[int, int, int]],
    seam_draw=None,
) -> StripFixture:
    """Small (≤512 wide) strips analyzed at identity scale — thin seams exact."""
    width = 360
    height = sum(c for c, _ in seams) + sum(s for _, s in seams[:-1])
    arr = _image(width, height, bg)
    cuts: list[int] = []
    y = 0
    for i, (content_h, seam_h) in enumerate(seams):
        _rect(arr, y, y + content_h, panel_fills[i])
        _texture(arr, y, y + content_h, panel_fills[i])
        y += content_h
        if i < len(seams) - 1:
            if seam_draw is not None:
                seam_draw(arr, y, seam_h)
            cuts.append(y + seam_h // 2)
            y += seam_h
    arr, w, h, cuts = _wrap(arr, bg, cuts)
    return StripFixture(name=name, image=Image.fromarray(arr), src_cuts=tuple(cuts), src_w=w, src_h=h)


def make_borderless() -> StripFixture:
    """Panels touching with only a 2px white gap — rescue cut at gap center."""
    return _identity_strip(
        name="borderless",
        seams=[(176, 2), (176, 2), (176, 0)],
        bg=(245, 245, 245),
        panel_fills=[(110, 110, 110), (150, 150, 150), (80, 80, 80)],
    )


def make_connected_looking() -> StripFixture:
    """2px white + 3px black hairline between panels — cut at the line."""

    def hairline(arr, y, seam_h):
        _rect(arr, y, y + 2, (245, 245, 245))
        _rect(arr, y + 2, y + seam_h, (5, 5, 5))

    return _identity_strip(
        name="connected_looking",
        seams=[(176, 5), (176, 5), (176, 0)],
        bg=(245, 245, 245),
        panel_fills=[(120, 120, 120), (160, 160, 160), (90, 90, 90)],
        seam_draw=hairline,
    )


def make_decorative() -> StripFixture:
    """Full-bleed art with a horizontal striped fill — no gutters, no cuts."""
    width, height = 360, 700
    arr = _image(width, height, (245, 245, 245))
    bands = np.linspace(50, 180, height).astype(np.uint8)
    for ridx in range(height):
        arr[ridx, :, :] = (int(bands[ridx]), 60, 60)
    arr, w, h, _ = _wrap(arr, (245, 245, 245), [])
    return StripFixture(name="decorative", image=Image.fromarray(arr), src_cuts=(), src_w=w, src_h=h)


def make_bubbles() -> StripFixture:
    """Big bg-colored speech bubble with dark outline centered in each gutter.

    No bordered flat seam survives (every run borders empty bubble interior on
    one side), so the strip stays merged — no wrong cut through a bubble.
    Padding other than the bubble rim is vertical white; the bubble interior is
    bg → its rows never reach SEAM_NEIGHBOR content on both sides.
    """

    def seam_draw(arr, y, seam_h):
        _rect(arr, y, y + seam_h, (245, 245, 245))
        radius = 7
        gcenter = y + seam_h // 2
        xc = arr.shape[1] // 2
        for yy in range(y - radius, y + seam_h + radius):
            if yy < 0 or yy >= arr.shape[0]:
                continue
            dy = abs(yy - gcenter)
            inside = radius * radius - dy * dy
            if inside <= 0:
                continue
            half = int(round(inside ** 0.5))
            arr[yy, (xc - half) : (xc + half), :] = (245, 245, 245)
            arr[yy, xc - half, :] = (30, 30, 30)
            arr[yy, xc + half, :] = (30, 30, 30)

    return _identity_strip(
        name="bubbles",
        seams=[(176, 24), (176, 24), (176, 0)],
        bg=(245, 245, 245),
        panel_fills=[(105, 105, 105), (140, 140, 140), (75, 75, 75)],
        seam_draw=seam_draw,
    )


def make_dense_text() -> StripFixture:
    """Text-heavy panels (~25% coverage) separated by 16px clean gutters."""

    def text_block(arr, y0, y1):
        for y in range(y0, y1):
            for x in range(0, 360, 4):
                arr[y, x, :] = (30, 30, 30)

    def seam_draw(arr, y, seam_h):
        _rect(arr, y, y + seam_h, (245, 245, 245))

    fixture = _identity_strip(
        name="dense_text",
        seams=[(176, 16), (176, 16), (176, 0)],
        bg=(245, 245, 245),
        panel_fills=[(70, 70, 70), (70, 70, 70), (70, 70, 70)],
        seam_draw=seam_draw,
    )
    arr = np.asarray(fixture.image).copy()
    for y0, y1 in [(MARGIN, MARGIN + 176), (MARGIN + 192, MARGIN + 368), (MARGIN + 384, MARGIN + 560)]:
        text_block(arr, y0, y1)
    return StripFixture(
        name=fixture.name,
        image=Image.fromarray(arr),
        src_cuts=fixture.src_cuts,
        src_w=fixture.src_w,
        src_h=fixture.src_h,
    )


def make_close_gutters() -> StripFixture:
    """176 content rows − gutter − 6 content rows − gutter − 176 content rows.

    The 6-row middle panel is a sliver (cut-to-cut gap 22 < MIN_PANEL_H) → the
    two clean cuts collapse into one.
    """
    width, height = 360, 176 + 16 + 6 + 16 + 176
    arr = _image(width, height, (245, 245, 245))
    for y0, y1, color in [
        (0, 176, (110, 110, 110)),
        (192, 198, (150, 150, 150)),
        (214, height, (80, 80, 80)),
    ]:
        _rect(arr, y0, y1, color)
        _texture(arr, y0, y1, color)
    arr, w, h, _ = _wrap(arr, (245, 245, 245), [])
    return StripFixture(name="close_gutters", image=Image.fromarray(arr), src_cuts=(), src_w=w, src_h=h)


AVAILABLE = {
    "clean_white": make_clean_white,
    "clean_black": make_clean_black,
    "clean_colored": make_clean_colored,
    "very_tall": make_very_tall,
    "small_strip": make_small_strip,
    "false_boundary": make_false_boundary,
    "borderless": make_borderless,
    "connected_looking": make_connected_looking,
    "decorative": make_decorative,
    "bubbles": make_bubbles,
    "dense_text": make_dense_text,
    "close_gutters": make_close_gutters,
}