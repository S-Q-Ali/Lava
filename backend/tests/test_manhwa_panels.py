"""M7 module 1: panel model, coordinate mapping, asset naming, StripRegistry."""

from __future__ import annotations

import json
import math
from pathlib import Path

import pytest

from lava_backend.manhwa.panels import (
    Panel,
    StripRegistry,
    analysis_scale,
    asset_for_id,
    asset_name,
    boxes_from_cuts,
    id_for_asset,
    make_panel,
    map_bounds_to_source,
    map_cut_to_source,
)
from lava_backend.manhwa.errors import ManhwaError


def _panel(**overrides) -> dict:
    base = dict(
        id="p1",
        source_id="mh-abc",
        x=0,
        y=0,
        w=100,
        h=200,
        confidence=0.9,
        order=1,
    )
    base.update(overrides)
    return base


class TestPanel:
    def test_valid_panel_builds(self) -> None:
        p = make_panel(source_w=1000, source_h=3000, **_panel())
        assert p == Panel(
            id="p1", source_id="mh-abc", x=0, y=0, w=100, h=200,
            confidence=0.9, order=1, user_corrected=False,
        )
        assert p.user_corrected is False

    def test_frozen(self) -> None:
        p = make_panel(source_w=1000, source_h=3000, **_panel())
        with pytest.raises(Exception):
            p.x = 5  # type: ignore[misc]

    def test_rejects_zero_span(self) -> None:
        for field in ("w", "h"):
            with pytest.raises(ValueError):
                make_panel(source_w=1000, source_h=3000, **_panel(**{field: 0}))

    def test_rejects_negative_span(self) -> None:
        with pytest.raises(ValueError):
            make_panel(source_w=1000, source_h=3000, **_panel(h=-5))

    def test_rejects_negative_offset(self) -> None:
        with pytest.raises(ValueError):
            make_panel(source_w=1000, source_h=3000, **_panel(x=-1))

    def test_rejects_out_of_bounds_right(self) -> None:
        with pytest.raises(ValueError):
            make_panel(source_w=1000, source_h=3000, **_panel(x=950, w=60))

    def test_rejects_out_of_bounds_bottom(self) -> None:
        with pytest.raises(ValueError):
            make_panel(source_w=1000, source_h=3000, **_panel(y=2950, h=100))

    def test_rejects_nan_confidence(self) -> None:
        with pytest.raises(ValueError):
            make_panel(source_w=1000, source_h=3000, **_panel(confidence=math.nan))

    def test_clamps_confidence_to_unit(self) -> None:
        assert make_panel(source_w=1000, source_h=3000, **_panel(confidence=1.4)).confidence == 1.0
        assert make_panel(source_w=1000, source_h=3000, **_panel(confidence=-0.2)).confidence == 0.0

    def test_rejects_empty_id(self) -> None:
        with pytest.raises(ValueError):
            make_panel(source_w=1000, source_h=3000, **_panel(id=""))

    def test_rejects_order_zero(self) -> None:
        with pytest.raises(ValueError):
            make_panel(source_w=1000, source_h=3000, **_panel(order=0))


class TestAnalysisScale:
    def test_tall_strip_scaled_to_max_width(self) -> None:
        ana_w, ana_h, factor = analysis_scale(1000, 3000, max_width=512)
        assert ana_w == 512
        assert ana_h == 1536  # floor(3000 * 512 / 1000)
        assert factor == pytest.approx(3000 / 1536)

    def test_wide_strip(self) -> None:
        ana_w, ana_h, factor = analysis_scale(2000, 1000, max_width=512)
        assert (ana_w, ana_h) == (512, 256)
        assert factor == pytest.approx(1000 / 256)

    def test_exact_aspect_round_trip(self) -> None:
        ana_w, ana_h, factor = analysis_scale(1024, 3072, max_width=512)
        assert (ana_w, ana_h) == (512, 1536)
        assert factor == pytest.approx(2.0)

    def test_smaller_than_max_is_identity(self) -> None:
        assert analysis_scale(400, 600, max_width=512) == (400, 600, 1.0)

    def test_always_positive_height(self) -> None:
        ana_w, ana_h, _ = analysis_scale(10_000, 5, max_width=512)
        assert ana_w > 0 and ana_h >= 1


class TestMapping:
    def test_map_bounds_exact_factor(self) -> None:
        # factor 2.0: analysis -> source is exact doubling
        x, y, w, h = map_bounds_to_source(10, 100, 32, 64, src_w=1024, ana_w=512, src_h=3072, ana_h=1536)
        assert (x, y, w, h) == (20, 200, 64, 128)

    def test_map_bounds_bilinear_anchor(self) -> None:
        # factor 3000/1536: y=768 -> round(768*3000/1536)=1500
        x, y, w, h = map_bounds_to_source(0, 768, 512, 768, src_w=1000, ana_w=512, src_h=3000, ana_h=1536)
        assert y == 1500
        assert h == 1500  # anchored: y2 = round((768+768)*3000/1536)=3000

    def test_map_bounds_clamps_to_source(self) -> None:
        x, y, w, h = map_bounds_to_source(0, 1510, 512, 100, src_w=1000, ana_w=512, src_h=3000, ana_h=1536)
        assert y + h <= 3000

    def test_cut_maps_all_the_way(self) -> None:
        assert map_cut_to_source(0, src_h=3000, ana_h=1536) == 0
        assert map_cut_to_source(1536, src_h=3000, ana_h=1536) == 3000

    def test_boxes_from_cuts_are_seamless(self) -> None:
        src_h, ana_h = 3000, 1536
        cuts = [map_cut_to_source(c, src_h=src_h, ana_h=ana_h) for c in (0, 512, 1024, 1536)]
        assert cuts == [0, 1000, 2000, 3000]
        boxes = [boxes_from_cuts(cuts[i], cuts[i + 1], left=0, right=1000) for i in range(3)]
        assert [b[0] for b in boxes] == [0, 0, 0]
        assert [b[2] for b in boxes] == [1000, 1000, 1000]
        assert boxes[0][1] + boxes[0][3] == boxes[1][1]  # seam-free adjacency
        assert boxes[1][1] + boxes[1][3] == boxes[2][1]
        assert boxes[-1][1] + boxes[-1][3] == src_h  # last panel reaches the bottom edge

    def test_cut_clamps(self) -> None:
        assert map_cut_to_source(-10, src_h=100, ana_h=50) == 0
        assert map_cut_to_source(9999, src_h=100, ana_h=50) == 100


class TestAssetNaming:
    @pytest.mark.parametrize(
        ("order", "total", "expected"),
        [
            # width == len(str(total)): consistent padding within a strip
            (1, 9, "panel_1.png"),
            (9, 9, "panel_9.png"),
            (1, 10, "panel_01.png"),
            (10, 10, "panel_10.png"),
            (1, 100, "panel_001.png"),
            (100, 100, "panel_100.png"),
            (1, 1, "panel_1.png"),
        ],
    )
    def test_zero_padding(self, order: int, total: int, expected: str) -> None:
        assert asset_name(order, total) == expected

    def test_id_asset_inversion(self) -> None:
        assert id_for_asset("panel_001.png") == "p1"
        assert id_for_asset("panel_010.png") == "p10"
        assert asset_for_id("p1", 9) == "panel_1.png"
        assert asset_for_id("p10", 100) == "panel_010.png"


def _registry(tmp_path: Path, **overrides) -> StripRegistry:
    return StripRegistry(
        path=tmp_path / "registry.json",
        source_id="mh-abc",
        source_file="strip.png",
        width=1000,
        height=3000,
        mime="image/png",
        panels=[
            make_panel(source_w=1000, source_h=3000, **_panel()),
            make_panel(source_w=1000, source_h=3000, **_panel(id="p2", y=200, order=2)),
        ],
        **overrides,
    )


class TestStripRegistry:
    def test_save_load_round_trip(self, tmp_path: Path) -> None:
        reg = _registry(tmp_path)
        reg.save()
        loaded = StripRegistry.load(tmp_path / "registry.json")
        assert loaded.source_id == "mh-abc"
        assert loaded.source_file == "strip.png"
        assert loaded.width == 1000 and loaded.height == 3000
        assert loaded.mime == "image/png"
        assert len(loaded.panels) == 2
        assert loaded.panels[0] == reg.panels[0]

    def test_atomic_write_leaves_no_temp(self, tmp_path: Path) -> None:
        reg = _registry(tmp_path)
        reg.save()
        assert not list(tmp_path.glob("*.tmp*"))
        assert list(tmp_path.glob("registry.json"))

    def test_missing_file_raises(self, tmp_path: Path) -> None:
        with pytest.raises(ManhwaError):
            StripRegistry.load(tmp_path / "nope.json")

    def test_corrupt_json_raises(self, tmp_path: Path) -> None:
        p = tmp_path / "registry.json"
        p.write_text("{nope", encoding="utf-8")
        with pytest.raises(ManhwaError):
            StripRegistry.load(p)

    def test_unknown_version_raises(self, tmp_path: Path) -> None:
        p = tmp_path / "registry.json"
        p.write_text(json.dumps({"version": 99}), encoding="utf-8")
        with pytest.raises(ManhwaError):
            StripRegistry.load(p)

    def test_duplicate_panel_ids_rejected_on_load(self, tmp_path: Path) -> None:
        p = tmp_path / "registry.json"
        p.write_text(
            json.dumps(
                {
                    "version": 1,
                    "sourceId": "mh-abc",
                    "sourceFile": "strip.png",
                    "width": 1000,
                    "height": 3000,
                    "mime": "image/png",
                    "panels": [
                        {"id": "p1", "sourceId": "mh-abc", "x": 0, "y": 0, "w": 100, "h": 200,
                         "confidence": 0.9, "order": 1, "userCorrected": False},
                        {"id": "p1", "sourceId": "mh-abc", "x": 0, "y": 300, "w": 100, "h": 200,
                         "confidence": 0.8, "order": 2, "userCorrected": False},
                    ],
                }
            ),
            encoding="utf-8",
        )
        with pytest.raises(ManhwaError):
            StripRegistry.load(p)

    def test_invalid_panel_on_load_raises(self, tmp_path: Path) -> None:
        p = tmp_path / "registry.json"
        p.write_text(
            json.dumps(
                {
                    "version": 1,
                    "sourceId": "mh-abc",
                    "sourceFile": "strip.png",
                    "width": 1000,
                    "height": 3000,
                    "mime": "image/png",
                    "panels": [
                        {"id": "p1", "sourceId": "mh-abc", "x": 0, "y": 0, "w": 0, "h": 200,
                         "confidence": 0.9, "order": 1, "userCorrected": False},
                    ],
                }
            ),
            encoding="utf-8",
        )
        with pytest.raises(ManhwaError):
            StripRegistry.load(p)

    def test_reset_panels_preserves_source(self, tmp_path: Path) -> None:
        reg = _registry(tmp_path)
        reg.reset_panels()
        assert reg.panels == []
        assert reg.source_file == "strip.png"
        assert reg.width == 1000