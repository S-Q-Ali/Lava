"""M7 module 4 slices 1–2: original-res crops, PNG/JPG encode, manifest bundle."""

from __future__ import annotations

from io import BytesIO

import pytest
from PIL import Image

from manhwa_strips import AVAILABLE

from lava_backend.manhwa.detect import (
    build_panels,
    detect_cuts,
    load_analysis_image,
    row_features,
)
from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.export import (
    JPG_QUALITY_DEFAULT,
    ExportBundle,
    crop_panel,
    encode_panel,
    manifest_rows,
    materialize_export,
)
from lava_backend.manhwa.panels import make_panel


def _panel(y: int, h: int, *, order: int, pid: str, w: int = 360, confidence: float = 1.0) -> object:
    return make_panel(
        id=pid,
        source_id="s1",
        x=0,
        y=y,
        w=w,
        h=h,
        order=order,
        source_w=360,
        source_h=720,
        confidence=confidence,
    )


class TestCropPanel:
    def test_crop_matches_source_region_exactly(self) -> None:
        source = Image.new("RGB", (300, 500), (10, 200, 30))
        panel = _panel(100, 200, order=1, pid="p1", w=300)
        crop = crop_panel(source, panel)
        assert crop.size == (300, 200)
        assert list(crop.getdata())[:1] == [(10, 200, 30)]
        assert crop is not source

    def test_crop_box_with_offset(self) -> None:
        source = Image.new("RGB", (400, 600), (5, 5, 5))
        panel = make_panel(
            id="px", source_id="s1", x=50, y=60, w=100, h=120, order=1,
            source_w=400, source_h=600,
        )
        crop = crop_panel(source, panel)
        assert crop.size == (100, 120)


class TestEncodePanel:
    def test_png_is_lossless_round_trip(self) -> None:
        image = Image.new("RGB", (120, 80), (200, 90, 40))
        data = encode_panel(image, fmt="png")
        decoded = Image.open(BytesIO(data)).convert("RGB")
        assert list(decoded.getdata()) == list(image.getdata())

    def test_jpg_encodes_valid_image(self) -> None:
        image = Image.new("RGB", (120, 80), (200, 90, 40))
        data = encode_panel(image, fmt="jpg")
        decoded = Image.open(BytesIO(data)).convert("RGB")
        assert decoded.size == (120, 80)

    def test_jpg_quality_validated(self) -> None:
        image = Image.new("RGB", (10, 10), (1, 2, 3))
        with pytest.raises(ValueError):
            encode_panel(image, fmt="jpg", quality=0)
        with pytest.raises(ValueError):
            encode_panel(image, fmt="jpg", quality=101)
        assert encode_panel(image, fmt="jpg", quality=1)
        assert encode_panel(image, fmt="jpg", quality=100)
        assert JPG_QUALITY_DEFAULT == 92

    def test_unknown_format_rejected(self) -> None:
        with pytest.raises(ValueError):
            encode_panel(Image.new("RGB", (4, 4)), fmt="gif")


class TestManifestRows:
    def test_names_zero_padded_and_ordered(self) -> None:
        panels = [_panel(0, 180, order=1, pid="p1"), _panel(180, 180, order=2, pid="p2")]
        rows = manifest_rows(panels, fmt="png")
        assert [r["file"] for r in rows] == ["panel_1.png", "panel_2.png"]
        assert [r["order"] for r in rows] == [1, 2]

    def test_geometry_and_confidence_echoed(self) -> None:
        panel = _panel(40, 260, order=1, pid="p3", confidence=0.35)
        (row,) = manifest_rows([panel], fmt="jpg")
        assert row["id"] == "p3"
        assert row["file"] == "panel_1.jpg"
        assert row["x"] == 0 and row["y"] == 40
        assert row["w"] == 360 and row["h"] == 260
        assert row["width"] == 360 and row["height"] == 260
        assert row["confidence"] == 0.35


class TestMaterializeExport:
    def test_shuffled_panels_export_in_reading_order(self) -> None:
        source = Image.new("RGB", (360, 720), (60, 60, 60))
        shuffled = [_panel(360, 360, order=3, pid="p3"), _panel(0, 180, order=1, pid="p1")]
        bundle = materialize_export(source, shuffled, fmt="png")
        assert isinstance(bundle, ExportBundle)
        assert bundle.fmt == "png"
        assert [f.name for f in bundle.files] == ["panel_1.png", "panel_2.png"]
        assert [m["order"] for m in bundle.manifest] == [1, 2]
        for file, manifest in zip(bundle.files, bundle.manifest):
            assert file.name == manifest["file"]

    def test_png_files_losslessly_match_crops(self) -> None:
        source = Image.new("RGB", (200, 400), (12, 34, 56))
        panels = [_panel(0, 200, order=1, pid="p1", w=200), _panel(200, 200, order=2, pid="p2", w=200)]
        bundle = materialize_export(source, panels, fmt="png")
        for file, panel in zip(bundle.files, panels):
            decoded = Image.open(BytesIO(file.data)).convert("RGB")
            assert list(decoded.getdata()) == list(crop_panel(source, panel).getdata())

    def test_jpg_switch_changes_suffix_and_manifest(self) -> None:
        source = Image.new("RGB", (200, 400), (12, 34, 56))
        panels = [_panel(0, 400, order=1, pid="p1", w=200)]
        bundle = materialize_export(source, panels, fmt="jpg", quality=80)
        assert bundle.fmt == "jpg"
        assert bundle.files[0].name == "panel_1.jpg"
        assert bundle.manifest[0]["file"] == "panel_1.jpg"

    def test_order_field_is_sequencing_authority(self) -> None:
        source = Image.new("RGB", (360, 720), (60, 60, 60))
        lower = make_panel(id="p1", source_id="s1", x=0, y=360, w=360, h=360, order=1, source_w=360, source_h=720)
        upper = make_panel(id="p2", source_id="s1", x=0, y=0, w=360, h=360, order=2, source_w=360, source_h=720)
        bundle = materialize_export(source, [lower, upper], fmt="png")
        assert [m["order"] for m in bundle.manifest] == [1, 2]
        assert [m["id"] for m in bundle.manifest] == ["p1", "p2"]

    def test_empty_panels_raise(self) -> None:
        with pytest.raises(ManhwaError):
            materialize_export(Image.new("RGB", (10, 10)), [], fmt="png")

    def test_overlapping_layout_raises(self) -> None:
        source = Image.new("RGB", (360, 720), (60, 60, 60))
        overlapping = [_panel(0, 300, order=1, pid="p1"), _panel(200, 300, order=2, pid="p2")]
        with pytest.raises(ManhwaError):
            materialize_export(source, overlapping, fmt="png")


class TestRealStripExport:
    def test_clean_strip_exports_original_resolution_tiling(self) -> None:
        fixture = AVAILABLE["clean_white"]()
        gray, ana_w, ana_h, _ = load_analysis_image(fixture.image)
        cuts = detect_cuts(row_features(gray), ana_h)
        panels = build_panels(cuts, source_id="s1", src_w=fixture.src_w, src_h=fixture.src_h, ana_w=ana_w, ana_h=ana_h)
        bundle = materialize_export(fixture.image, panels, fmt="png")
        assert len(bundle.files) == len(panels)
        for file, panel in zip(bundle.files, panels):
            decoded = Image.open(BytesIO(file.data)).convert("RGB")
            assert decoded.size == (panel.w, panel.h)
        assert panels[-1].y + panels[-1].h == fixture.src_h
        # file names continue sequentially through the full collection
        assert [f.name for f in bundle.files] == [
            f"panel_{i}.png" for i in range(1, len(bundle.files) + 1)
        ]