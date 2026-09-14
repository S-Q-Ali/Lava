"""Memory-tuning tests: JPEG draft decode and lazy open path."""
from __future__ import annotations

import pytest
from PIL import Image
from PIL.JpegImagePlugin import JpegImageFile

from lava_backend.manhwa.detect import (
    detect_strip,
    load_analysis_image,
)

pytestmark = pytest.mark.manhwa


def _tall_jpeg(tmp_path, width=800, height=6000, panels=3):
    """Create a wide tall JPEG strip that must downscale for the analysis path.

    Width > 512 px so ``analysis_scale`` downsamples and a JPEG draft decode is
    the only memory-efficient path.
    """
    img = Image.new("RGB", (width, height), (30, 30, 30))
    px = img.load()
    h_each = height // (panels * 2 + 1)
    colors = [(200, 40, 40), (40, 200, 40), (40, 40, 200)]
    for i in range(panels):
        y_top = h_each + i * h_each * 2
        for x in range(width):
            for y in range(y_top, y_top + h_each):
                px[x, y] = colors[i % len(colors)]
    path = tmp_path / "strip.jpg"
    img.save(path, format="JPEG", quality=85)
    return path, width, height


def test_jpeg_draft_decode_is_used(tmp_path, monkeypatch):
    path, src_w, src_h = _tall_jpeg(tmp_path)
    called = []

    orig = JpegImageFile.draft

    def spy(self, mode, size):
        called.append((mode, size))
        return orig(self, mode, size)

    monkeypatch.setattr(JpegImageFile, "draft", spy)
    result = detect_strip(path, source_id="j1", save=False, cache_dir=tmp_path)
    assert called, "draft should have been invoked for the JPEG analysis path"
    mode, (w, h) = called[0]
    assert mode.upper() == "RGB"
    assert w < src_w and h < src_h
    assert len(result["panels"]) >= 1


def test_non_jpeg_skips_draft(tmp_path, monkeypatch):
    path = tmp_path / "strip.png"
    img = Image.new("RGB", (800, 6000), (50, 50, 50))
    img.save(path, format="PNG")
    draft_calls = []

    orig_draft = JpegImageFile.draft

    def spy(self, mode, size):
        draft_calls.append(True)
        return orig_draft(self, mode, size)

    monkeypatch.setattr(JpegImageFile, "draft", spy)
    detect_strip(path, source_id="p1", save=False, cache_dir=tmp_path)
    assert len(draft_calls) == 0, "PNG should not use draft decode"


def test_save_false_does_not_write_crops(tmp_path):
    path, _, _ = _tall_jpeg(tmp_path)
    result = detect_strip(path, source_id="j2", save=False, cache_dir=tmp_path)
    assert result["saved"] is False
    assert result["cachePath"] is None
    assert not (tmp_path / "manhwa" / "j2").exists()


def test_jpeg_crop_preserves_original_resolution(tmp_path):
    path, _, _ = _tall_jpeg(tmp_path)
    result = detect_strip(path, source_id="j3", save=True, cache_dir=tmp_path)
    base = tmp_path / "manhwa" / "j3"
    for p in result["panels"]:
        crop = Image.open(base / f"panel_{p['order']}.png")
        assert crop.size == (p["w"], p["h"]), f"panel {p['order']}"


def test_parity_jpeg_vs_draft_disabled(tmp_path, monkeypatch):
    """Draft decode must not change the panel layout vs a full decode."""
    path, _, _ = _tall_jpeg(tmp_path)
    reference = detect_strip(path, source_id="ref", save=False, cache_dir=tmp_path)
    result = detect_strip(path, source_id="j4", save=False, cache_dir=tmp_path)
    reference_panels = reference["panels"]
    assert len(result["panels"]) == len(reference_panels)
    for got, want in zip(result["panels"], reference_panels):
        assert got["order"] == want["order"]
        assert abs(got["y"] - want["y"]) <= 2, f"panel {got['order']} y differs"
        assert abs(got["h"] - want["h"]) <= 2, f"panel {got['order']} h differs"


def test_draw_image_input_bypasses_draft(tmp_path, monkeypatch):
    """In-memory Image (no fp) falls back to full convert, never attempts draft."""
    tall = Image.new("RGB", (800, 4000), (50, 50, 50))
    px = tall.load()
    for x in range(100):
        for y in range(500, 3500):
            px[x, y] = (200, 200, 200)
    draft_calls = []

    orig_draft = JpegImageFile.draft

    def spy(self, mode, size):
        draft_calls.append(True)
        return orig_draft(self, mode, size)

    monkeypatch.setattr(JpegImageFile, "draft", spy)
    load_analysis_image(tall)
    assert len(draft_calls) == 0, "In-memory image should bypass draft"