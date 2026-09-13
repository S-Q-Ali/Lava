"""M7 module 2 slice 3: cut → source mapping, panel building, strip detection."""

from __future__ import annotations

from io import BytesIO

import pytest
from PIL import Image

from manhwa_strips import AVAILABLE, StripFixture

from lava_backend.manhwa.detect import (
    CLEAN_CUT_CONF,
    RESCUE_CUT_CONF,
    Cut,
    RowFeatures,
    build_panels,
    detect_cuts,
    detect_strip,
    load_analysis_image,
    merge_slivers,
    row_features,
)
from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.order import guard_layout
from lava_backend.manhwa.panels import (
    StripRegistry,
    analysis_scale,
    asset_name,
    map_cut_to_source,
    panel_to_dict,
)

TOL = 2  # analysis px


def _expected_analysis_cuts(fixture: StripFixture) -> tuple[int, ...]:
    _, ana_h, _ = analysis_scale(fixture.src_w, fixture.src_h, max_width=512)
    return tuple(int(round(c * ana_h / fixture.src_h)) for c in fixture.src_cuts)


@pytest.fixture(params=["clean_white", "clean_black", "clean_colored"])
def clean_fixture(request) -> StripFixture:
    return AVAILABLE[request.param]()


class TestLoadAnalysisImage:
    def test_returns_analysis_dims(self) -> None:
        fixture = AVAILABLE["clean_white"]()
        gray, ana_w, ana_h, factor = load_analysis_image(fixture.image)
        exp_w, exp_h, exp_factor = analysis_scale(fixture.src_w, fixture.src_h, max_width=512)
        assert ana_w == exp_w == 512
        assert ana_h == exp_h
        assert factor == pytest.approx(exp_factor)
        assert gray.shape == (ana_h, ana_w)

    def test_identity_for_small_strip(self) -> None:
        fixture = AVAILABLE["small_strip"]()
        gray, ana_w, ana_h, factor = load_analysis_image(fixture.image)
        assert (ana_w, ana_h) == (fixture.src_w, fixture.src_h)
        assert factor == 1.0
        assert gray.shape == (ana_h, ana_w)


class TestRowFeatures:
    def test_panel_row_full_content_gutter_row_flat_empty(self) -> None:
        gray, ana_w, ana_h, _ = load_analysis_image(AVAILABLE["clean_white"]().image)
        feat = row_features(gray)
        assert isinstance(feat, RowFeatures)
        assert feat.content.shape == (ana_h,)
        assert feat.uniform.shape == (ana_h,)
        assert feat.edge.shape == (ana_h,)
        # inside the first panel: high content
        assert feat.content[50] > 0.9
        # the first detected clean cut anchors a flat empty band
        first = detect_cuts(feat, ana_h)[0]
        assert feat.content[first.y - 2 : first.y + 3].mean() < 0.03
        assert feat.uniform[first.y - 2 : first.y + 3].mean() > 0.97


class TestCleanCutDetection:
    def test_clean_fixtures_cut_exactly(self, clean_fixture) -> None:
        gray, _, ana_h, _ = load_analysis_image(clean_fixture.image)
        cuts = detect_cuts(row_features(gray), ana_h)
        expected = _expected_analysis_cuts(clean_fixture)
        assert len(cuts) == len(expected)
        for cut, want in zip(cuts, expected):
            assert abs(cut.y - want) <= TOL, (cut, want, clean_fixture.name)
            assert cut.kind == "clean"
            assert cut.confidence == pytest.approx(CLEAN_CUT_CONF)

    def test_very_tall_keeps_panel_count(self) -> None:
        fixture = AVAILABLE["very_tall"]()
        gray, _, ana_h, _ = load_analysis_image(fixture.image)
        cuts = detect_cuts(row_features(gray), ana_h)
        assert len(cuts) == len(fixture.src_cuts)

    def test_small_strip_at_identity(self) -> None:
        fixture = AVAILABLE["small_strip"]()
        gray, _, ana_h, _ = load_analysis_image(fixture.image)
        cuts = detect_cuts(row_features(gray), ana_h)
        expected = _expected_analysis_cuts(fixture)
        assert [c.y for c in cuts] == list(expected)

    def test_last_cut_is_interior_not_bottom_edge(self) -> None:
        fixture = AVAILABLE["clean_white"]()
        gray, _, ana_h, _ = load_analysis_image(fixture.image)
        cuts = detect_cuts(row_features(gray), ana_h)
        assert cuts[-1].y + TOL * 2 < ana_h


class TestFalseBoundary:
    def test_interior_band_is_not_cut(self) -> None:
        gray, _, ana_h, _ = load_analysis_image(AVAILABLE["false_boundary"]().image)
        assert detect_cuts(row_features(gray), ana_h) == []


def _cuts(fixture: StripFixture, tol: int = 3):
    gray, _, ana_h, _ = load_analysis_image(fixture.image)
    detected = detect_cuts(row_features(gray), ana_h)
    expected = _expected_analysis_cuts(fixture)
    assert len(detected) == len(expected), (detected, expected, fixture.name)
    for cut, want in zip(detected, expected):
        assert abs(cut.y - want) <= tol, (cut, want, fixture.name)
    return detected


class TestRescueCutDetection:
    def test_borderless_thin_gap_rescued(self) -> None:
        cuts = _cuts(AVAILABLE["borderless"]())
        assert all(c.kind == "rescue" for c in cuts)
        assert all(c.confidence == pytest.approx(RESCUE_CUT_CONF) for c in cuts)

    def test_connected_looking_hairline_rescued(self) -> None:
        cuts = _cuts(AVAILABLE["connected_looking"]())
        assert all(c.kind == "rescue" for c in cuts)
        assert all(c.confidence == pytest.approx(RESCUE_CUT_CONF) for c in cuts)
        assert cuts[0].confidence < CLEAN_CUT_CONF

    def test_decorative_full_bleed_never_cut(self) -> None:
        gray, _, ana_h, _ = load_analysis_image(AVAILABLE["decorative"]().image)
        assert detect_cuts(row_features(gray), ana_h) == []

    def test_bubbles_never_cut_through_bubble(self) -> None:
        gray, _, ana_h, _ = load_analysis_image(AVAILABLE["bubbles"]().image)
        assert detect_cuts(row_features(gray), ana_h) == []

    def test_dense_text_keeps_only_real_gutters(self) -> None:
        cuts = _cuts(AVAILABLE["dense_text"]())
        assert all(c.kind == "clean" for c in cuts)


class TestSliverMerge:
    def test_merge_slivers_keeps_higher_confidence(self) -> None:
        cuts = [Cut(y=100, confidence=0.95, kind="clean"), Cut(y=115, confidence=0.35, kind="rescue")]
        merged = merge_slivers(cuts, h=200)
        assert [(c.y, c.kind) for c in merged] == [(100, "clean")]

    def test_close_clean_gutters_collapse_to_one(self) -> None:
        fixture = AVAILABLE["close_gutters"]()
        gray, _, ana_h, _ = load_analysis_image(fixture.image)
        cuts = detect_cuts(row_features(gray), ana_h)
        assert len(cuts) == 1
        assert cuts[0].kind == "clean"
        assert cuts[0].y in (187, 209)


class TestBuildPanels:
    def test_build_panels_output_is_guarded_and_reading_ordered(self) -> None:
        fixture = AVAILABLE["borderless"]()
        gray, ana_w, ana_h, _ = load_analysis_image(fixture.image)
        cuts = detect_cuts(row_features(gray), ana_h)
        assert any(c.kind == "rescue" for c in cuts)
        panels = build_panels(cuts, source_id="s1", src_w=fixture.src_w, src_h=fixture.src_h, ana_w=ana_w, ana_h=ana_h)
        normalized = guard_layout(panels)  # must pass without raising
        assert normalized == panels  # already ordered/guarded
        assert [p.order for p in panels] == list(range(1, len(panels) + 1))
        assert [p.y for p in panels] == sorted(p.y for p in panels)

    def test_no_cuts_single_full_panel(self) -> None:
        panels = build_panels(
            [],
            source_id="s1",
            src_w=360,
            src_h=720,
            ana_w=360,
            ana_h=720,
        )
        assert len(panels) == 1
        assert panels[0].id == "p1"
        assert panels[0].x == 0 and panels[0].y == 0
        assert (panels[0].w, panels[0].h) == (360, 720)
        assert panels[0].confidence == 1.0
        assert panels[0].order == 1
        assert not panels[0].user_corrected

    def test_identity_cuts_seam_free_ordered(self) -> None:
        cuts = [Cut(y=180, confidence=0.95, kind="clean"), Cut(y=360, confidence=0.95, kind="clean")]
        panels = build_panels(cuts, source_id="s1", src_w=360, src_h=720, ana_w=360, ana_h=720)
        assert [(p.x, p.y, p.w, p.h) for p in panels] == [
            (0, 0, 360, 180),
            (0, 180, 360, 180),
            (0, 360, 360, 360),
        ]
        assert [p.id for p in panels] == ["p1", "p2", "p3"]
        assert [p.order for p in panels] == [1, 2, 3]
        assert all(not p.user_corrected for p in panels)
        for a, b in zip(panels, panels[1:]):
            assert a.y + a.h == b.y  # seam-free tiling

    def test_scaled_cuts_map_via_bilinear_anchor(self) -> None:
        src_w, src_h = 806, 774
        ana_w, ana_h, _ = analysis_scale(src_w, src_h, max_width=512)
        cuts = [Cut(y=122, confidence=0.95, kind="clean"), Cut(y=246, confidence=0.95, kind="clean")]
        panels = build_panels(cuts, source_id="s1", src_w=src_w, src_h=src_h, ana_w=ana_w, ana_h=ana_h)
        expected = [0] + [map_cut_to_source(c.y, src_h=src_h, ana_h=ana_h) for c in cuts]
        assert [p.y for p in panels] == expected
        assert panels[-1].y + panels[-1].h == src_h
        assert sum(p.h for p in panels) == src_h
        assert all(p.w == src_w for p in panels)

    def test_confidence_takes_min_of_bounding_cuts(self) -> None:
        cuts = [
            Cut(y=180, confidence=0.95, kind="clean"),
            Cut(y=360, confidence=0.35, kind="rescue"),
        ]
        panels = build_panels(cuts, source_id="s1", src_w=360, src_h=720, ana_w=360, ana_h=720)
        assert [p.confidence for p in panels] == [pytest.approx(0.95), pytest.approx(0.35), pytest.approx(0.35)]

    def test_out_of_order_cuts_are_sorted(self) -> None:
        cuts = [Cut(y=360, confidence=0.95, kind="clean"), Cut(y=180, confidence=0.95, kind="clean")]
        panels = build_panels(cuts, source_id="s1", src_w=360, src_h=720, ana_w=360, ana_h=720)
        assert [p.y for p in panels] == [0, 180, 360]
        assert [p.order for p in panels] == [1, 2, 3]

    def test_duplicate_mapped_lines_are_skipped(self) -> None:
        cuts = [Cut(y=0, confidence=0.95, kind="clean"), Cut(y=1, confidence=0.35, kind="rescue")]
        panels = build_panels(cuts, source_id="s1", src_w=360, src_h=720, ana_w=360, ana_h=720)
        assert [p.order for p in panels] == sorted(p.order for p in panels)
        assert all(p.h > 0 for p in panels)


class TestDetectStrip:
    def _save_fixture(self, name: str, tmp_path) -> tuple[Image.Image, StripFixture, str]:
        fixture = AVAILABLE[name]()
        path = tmp_path / f"{name}.png"
        fixture.image.save(path)
        return fixture.image, fixture, str(path)

    def test_detects_and_saves_full_strip(self, tmp_path) -> None:
        image, fixture, path = self._save_fixture("clean_white", tmp_path)
        result = detect_strip(path, source_id="src_white", save=True, cache_dir=tmp_path)
        assert result["saved"] is True
        assert result["sourceId"] == "src_white"
        assert result["width"] == fixture.src_w
        assert result["height"] == fixture.src_h
        assert result["mime"] == "png"
        panels = result["panels"]
        assert len(panels) == len(fixture.src_cuts) + 1
        assert panels[0]["y"] == 0
        sum_h = sum(p["h"] for p in panels)
        assert sum_h == fixture.src_h
        assert all(p["x"] == 0 and p["w"] == fixture.src_w for p in panels)
        assert [p["order"] for p in panels] == list(range(1, len(panels) + 1))
        assert all(p["confidence"] == pytest.approx(CLEAN_CUT_CONF) for p in panels)
        base = tmp_path / "manhwa" / "src_white"
        registry_path = base / "registry.json"
        registry = StripRegistry.load(registry_path)
        assert registry.source_id == "src_white"
        assert [(p.x, p.y, p.w, p.h) for p in registry.panels] == [
            (p["x"], p["y"], p["w"], p["h"]) for p in panels
        ]
        for p in panels:
            crop_name = asset_name(p["order"], len(panels))
            crop = Image.open(base / crop_name)
            assert crop.size == (p["w"], p["h"]), crop.size
        assert result["cachePath"] == str(base)

    def test_rerun_is_idempotent(self, tmp_path) -> None:
        _, fixture, path = self._save_fixture("clean_white", tmp_path)
        first = detect_strip(path, source_id="src_white", save=True, cache_dir=tmp_path)
        second = detect_strip(path, source_id="src_white", save=True, cache_dir=tmp_path)
        assert first["panels"] == second["panels"]

    def test_save_false_writes_nothing(self, tmp_path) -> None:
        _, fixture, path = self._save_fixture("clean_white", tmp_path)
        result = detect_strip(path, source_id="src_white", save=False, cache_dir=tmp_path)
        assert result["saved"] is False
        assert not (tmp_path / "manhwa").exists()
        assert len(result["panels"]) == 4

    def test_non_vertical_strip_rejected(self, tmp_path) -> None:
        source = Image.new("RGB", (400, 200), (60, 60, 60))
        path = tmp_path / "landscape.png"
        source.save(path)
        with pytest.raises(ManhwaError, match="vertical"):
            detect_strip(path, source_id="s1", save=False, cache_dir=tmp_path)

    def test_unreadable_file_raises_manhwa_error(self, tmp_path) -> None:
        path = tmp_path / "trash.png"
        path.write_bytes(b"not an image at all" * 4)
        with pytest.raises(ManhwaError, match="read image"):
            detect_strip(path, source_id="s1", save=False, cache_dir=tmp_path)

    def test_missing_file_raises_manhwa_error(self, tmp_path) -> None:
        with pytest.raises(ManhwaError, match="read image"):
            detect_strip(tmp_path / "nope.png", source_id="s1", save=False, cache_dir=tmp_path)