"""M7 module 2 slice 1: analysis image, row features, clean-gutter cuts."""

from __future__ import annotations

import pytest

from manhwa_strips import AVAILABLE, StripFixture

from lava_backend.manhwa.detect import (
    CLEAN_CUT_CONF,
    RowFeatures,
    detect_cuts,
    load_analysis_image,
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
        gray, ana_w, ana_h, factor = load_analysis_image(AVAILABLE["clean_white"]().image)
        assert ana_w == 512
        assert ana_h == 1536
        assert factor == pytest.approx(2400 / 1536)
        assert gray.shape == (ana_h, ana_w)

    def test_identity_for_small_strip(self) -> None:
        gray, ana_w, ana_h, factor = load_analysis_image(AVAILABLE["small_strip"]().image)
        assert (ana_w, ana_h) == (300, 900)
        assert factor == 1.0
        assert gray.shape == (900, 300)


class TestRowFeatures:
    def test_panel_row_full_content_gutter_row_flat_empty(self) -> None:
        gray, ana_w, ana_h, _ = load_analysis_image(AVAILABLE["clean_white"]().image)
        feat = row_features(gray)
        assert isinstance(feat, RowFeatures)
        assert feat.content.shape == (ana_h,)
        assert feat.uniform.shape == (ana_h,)
        assert feat.edge.shape == (ana_h,)
        # inside the first source panel (analysis y≈0..115): full content
        assert feat.content[50] == pytest.approx(1.0)
        # first gutter maps to analysis cut 120 → empty flat band ≈ rows 116..125
        assert feat.content[116:125].mean() < 0.03
        assert feat.uniform[116:125].mean() > 0.97


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