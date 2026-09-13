"""M7 module 2 slice 1: analysis image, row features, clean-gutter cuts."""

from __future__ import annotations

import pytest

from manhwa_strips import AVAILABLE, StripFixture

from lava_backend.manhwa.detect import (
    CLEAN_CUT_CONF,
    RESCUE_CUT_CONF,
    RowFeatures,
    Cut,
    detect_cuts,
    load_analysis_image,
    merge_slivers,
    row_features,
)
from lava_backend.manhwa.panels import analysis_scale

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