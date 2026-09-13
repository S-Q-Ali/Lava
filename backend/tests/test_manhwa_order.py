"""M7 module 3 slice 1: reading order, confidence attribution, layout guards."""

from __future__ import annotations

import pytest

from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.order import attribute_confidence, guard_layout, order_panels
from lava_backend.manhwa.panels import make_panel


def _panel(
    y: int,
    h: int,
    *,
    x: int = 0,
    w: int = 360,
    pid: str | None = None,
    order: int = 1,
    confidence: float = 1.0,
    user_corrected: bool = False,
) -> object:
    return make_panel(
        id=pid or f"p{order}",
        source_id="s1",
        x=x,
        y=y,
        w=w,
        h=h,
        order=order,
        source_w=360,
        source_h=720,
        confidence=confidence,
        user_corrected=user_corrected,
    )


class TestOrderPanels:
    def test_shuffled_input_sorted_and_renumbered(self) -> None:
        p1 = _panel(360, 180, pid="p1", order=3)
        p2 = _panel(180, 180, pid="p2", order=1)
        p3 = _panel(0, 180, pid="p3", order=2)
        ordered = order_panels([p1, p2, p3])
        assert [p.y for p in ordered] == [0, 180, 360]
        assert [p.id for p in ordered] == ["p3", "p2", "p1"]
        assert [p.order for p in ordered] == [1, 2, 3]
        for p in ordered:  # boxes untouched
            assert (p.x, p.w) == (0, 360)
            assert p.h == 180

    def test_boxes_and_flags_preserved(self) -> None:
        original = _panel(0, 300, pid="p1", order=1, confidence=0.7, user_corrected=True)
        (ordered,) = order_panels([original])
        assert ordered == original  # no-op for a single already-ordered panel

    def test_tie_breaks_by_x(self) -> None:
        a = _panel(0, 60, x=0, w=200, pid="pa")
        b = _panel(0, 60, x=200, w=160, pid="pb")
        ordered = order_panels([b, a])
        assert [p.id for p in ordered] == ["pa", "pb"]

    def test_already_ordered_is_stable_identity(self) -> None:
        panels = [_panel(0, 240, pid="p1", order=1), _panel(240, 480, pid="p2", order=2)]
        assert order_panels(panels) == panels


class TestAttributeConfidence:
    def test_all_edge_boundaries_are_certain(self) -> None:
        panels = [_panel(0, 240), _panel(240, 480)]
        out = attribute_confidence(panels, [None, None, None])
        assert [p.confidence for p in out] == [pytest.approx(1.0)] * 2

    def test_clean_cuts_throughout(self) -> None:
        panels = [_panel(0, 240), _panel(240, 240), _panel(480, 240)]
        out = attribute_confidence(panels, [1.0, 0.95, 0.95, 1.0])
        assert [p.confidence for p in out] == [pytest.approx(0.95)] * 3

    def test_rescue_cut_bounds_only_middle_panel(self) -> None:
        panels = [_panel(0, 240), _panel(240, 240), _panel(480, 240)]
        out = attribute_confidence(panels, [1.0, 0.95, 0.35, 1.0])
        assert [p.confidence for p in out] == [
            pytest.approx(0.95),
            pytest.approx(0.35),
            pytest.approx(0.35),
        ]

    def test_none_mixed_with_numbers(self) -> None:
        panels = [_panel(0, 240), _panel(240, 240)]
        out = attribute_confidence(panels, [None, 0.5, None])
        assert [p.confidence for p in out] == [pytest.approx(0.5), pytest.approx(0.5)]

    def test_panels_confidence_and_other_fields_untouched(self) -> None:
        panels = [_panel(0, 240, pid="pz", order=9, user_corrected=True)]
        out = attribute_confidence(panels, [0.4, 0.8])
        assert out[0].confidence == pytest.approx(0.4)
        assert out[0].id == "pz" and out[0].order == 9 and out[0].user_corrected
        assert (out[0].x, out[0].y, out[0].w, out[0].h) == (0, 0, 360, 240)

    def test_boundary_length_mismatch_raises(self) -> None:
        panels = [_panel(0, 240), _panel(240, 480)]
        with pytest.raises(ValueError):
            attribute_confidence(panels, [1.0, 0.95])  # need n+1 = 3


class TestGuardLayout:
    def test_empty_raises(self) -> None:
        with pytest.raises(ManhwaError):
            guard_layout([])

    def test_duplicate_ids_raise(self) -> None:
        a = _panel(0, 240, pid="p1")
        b = _panel(240, 480, pid="p1")
        with pytest.raises(ManhwaError):
            guard_layout([a, b])

    def test_positive_area_overlap_raises(self) -> None:
        a = _panel(0, 300, pid="p1")
        b = _panel(200, 300, pid="p2")  # y ranges 0..300 and 200..500 overlap
        with pytest.raises(ManhwaError):
            guard_layout([a, b])

    def test_interleaved_regions_raise(self) -> None:
        a = _panel(0, 500, pid="p1")
        b = _panel(400, 200, pid="p2")  # starts inside a's span
        with pytest.raises(ManhwaError):
            guard_layout([a, b])

    def test_touching_adjacent_tiling_passes(self) -> None:
        a = _panel(0, 240, pid="p1")
        b = _panel(240, 480, pid="p2")
        out = guard_layout([b, a])  # shuffled
        assert [p.y for p in out] == [0, 240]
        assert [p.order for p in out] == [1, 2]

    def test_x_decorated_layout_passes_when_disjoint(self) -> None:
        a = _panel(0, 240, x=0, w=200, pid="pa")
        b = _panel(0, 240, x=200, w=160, pid="pb")  # same top, disjoint x
        out = guard_layout([b, a])
        assert [p.id for p in out] == ["pa", "pb"]

    def test_idempotent_on_valid_input(self) -> None:
        panels = [_panel(0, 400, pid="p1"), _panel(400, 320, pid="p2")]
        first = guard_layout(panels)
        assert guard_layout(first) == first