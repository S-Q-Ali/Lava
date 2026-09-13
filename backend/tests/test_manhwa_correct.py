"""M7 module 5: correction ops — pure list edits over frozen Panels."""

from __future__ import annotations

import pytest

from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.correct import (
    add_panel,
    adjust_panel,
    delete_panel,
    merge_panels,
    redetect,
    reorder_panels,
    split_panel,
)
from lava_backend.manhwa.order import guard_layout, normalize_layout, validate_layout
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


class TestValidateLayout:
    def test_empty_raises(self) -> None:
        with pytest.raises(ManhwaError):
            validate_layout([])

    def test_duplicate_ids_raise(self) -> None:
        with pytest.raises(ManhwaError):
            validate_layout([_panel(0, 240, pid="p1"), _panel(240, 240, pid="p1")])

    def test_overlap_raises(self) -> None:
        with pytest.raises(ManhwaError):
            validate_layout([_panel(0, 300, pid="p1"), _panel(200, 300, pid="p2")])

    def test_touching_passes_and_preserves_input(self) -> None:
        panels = [_panel(0, 240, pid="p1"), _panel(240, 240, pid="p2")]
        assert validate_layout(panels) == panels


class TestNormalizeLayout:
    def test_preserves_given_sequence(self) -> None:
        lower = _panel(360, 240, pid="p2", order=2)
        upper = _panel(0, 240, pid="p1", order=1)
        out = normalize_layout([lower, upper])  # user wants lower first
        assert [p.id for p in out] == ["p2", "p1"]
        assert [p.order for p in out] == [1, 2]

    def test_renumbers_in_place(self) -> None:
        panels = [_panel(0, 720, pid="p1", order=9)]
        (out,) = normalize_layout(panels)
        assert out.order == 1 and out.id == "p1"

    def test_idempotent(self) -> None:
        panels = [_panel(0, 240, pid="p1"), _panel(240, 480, pid="p2")]
        first = normalize_layout(panels)
        assert normalize_layout(first) == first

    def test_empty_allowed_for_correction(self) -> None:
        assert normalize_layout([]) == []

    def test_overlap_still_rejected(self) -> None:
        with pytest.raises(ManhwaError):
            normalize_layout([_panel(0, 300, pid="p1"), _panel(200, 300, pid="p2")])

    def test_fields_preserved(self) -> None:
        panels = [_panel(0, 240, pid="p1", order=4, confidence=0.35, user_corrected=True)]
        (out,) = normalize_layout(panels)
        assert out.confidence == pytest.approx(0.35)
        assert out.user_corrected
        assert (out.x, out.y, out.w, out.h) == (0, 0, 360, 240)


class TestGuardStillSorts:
    def test_guard_unchanged_contract(self) -> None:
        b = _panel(240, 240, pid="p2", order=1)
        a = _panel(0, 240, pid="p1", order=2)
        out = guard_layout([b, a])
        assert [p.id for p in out] == ["p1", "p2"]  # (y,x) spatial sort kept


class TestSplitPanel:
    def test_split_geometry_and_ids(self) -> None:
        panels = [_panel(0, 720, pid="p1", order=1)]
        out = split_panel(panels, "p1", y_split=300)
        assert [p.id for p in out] == ["p1", "p2"]
        assert (out[0].y, out[0].h) == (0, 300)
        assert (out[1].y, out[1].h) == (300, 420)
        assert out[0].x == out[1].x == 0 and out[0].w == out[1].w == 360
        assert [p.order for p in out] == [1, 2]

    def test_split_both_halves_marked_user_corrected(self) -> None:
        panels = [_panel(0, 400, pid="p1", user_corrected=False)]
        out = split_panel(panels, "p1", y_split=100)
        assert out[0].user_corrected and out[1].user_corrected

    def test_split_inherits_confidence(self) -> None:
        panels = [_panel(0, 400, pid="p1", confidence=0.35)]
        out = split_panel(panels, "p1", y_split=100)
        assert out[0].confidence == pytest.approx(0.35)
        assert out[1].confidence == pytest.approx(0.35)

    def test_split_fresh_id_reuses_gap(self) -> None:
        panels = [_panel(0, 240, pid="p2", order=1), _panel(240, 480, pid="p1", order=2)]
        out = split_panel(panels, "p1", y_split=400)
        ids = [p.id for p in out]
        assert set(ids) == {"p1", "p2", "p3"}  # gap reuse keeps ids low

    def test_split_at_boundary_rejected(self) -> None:
        panels = [_panel(0, 400, pid="p1")]
        for bad in (0, 400, -1, 401):
            with pytest.raises(ManhwaError):
                split_panel(panels, "p1", y_split=bad)

    def test_split_missing_panel_rejected(self) -> None:
        with pytest.raises(ManhwaError):
            split_panel([_panel(0, 400, pid="p1")], "p9", y_split=100)


class TestMergePanels:
    def test_merge_adjacent_tiles(self) -> None:
        panels = [_panel(0, 240, pid="p1", order=1, confidence=0.95),
                  _panel(240, 240, pid="p2", order=2, confidence=0.35)]
        out = merge_panels(panels, "p2", "p1")
        assert [p.id for p in out] == ["p2"]  # keeps a_id = first arg
        (merged,) = out
        assert (merged.y, merged.h) == (0, 480)
        assert merged.confidence == pytest.approx(0.35)
        assert merged.user_corrected

    def test_merge_union_across_gap(self) -> None:
        panels = [_panel(0, 200, pid="p1"), _panel(300, 200, pid="p2")]
        (merged,) = merge_panels(panels, "p1", "p2")
        assert (merged.y, merged.h) == (0, 500)

    def test_merge_overlapping_third_rejected(self) -> None:
        a = _panel(0, 240, pid="p1")
        b = _panel(240, 240, pid="p2")
        c = _panel(120, 120, pid="p3")  # inside a ∪ b
        with pytest.raises(ManhwaError):
            merge_panels([a, b, c], "p1", "p2")

    def test_merge_missing_id_rejected(self) -> None:
        with pytest.raises(ManhwaError):
            merge_panels([_panel(0, 240, pid="p1")], "p1", "p2")


class TestDeletePanel:
    def test_delete_renumbers_remaining(self) -> None:
        panels = [_panel(0, 240, pid="p1", order=1),
                  _panel(240, 240, pid="p2", order=2),
                  _panel(480, 240, pid="p3", order=3)]
        out = delete_panel(panels, "p2")
        assert [p.id for p in out] == ["p1", "p3"]
        assert [p.order for p in out] == [1, 2]

    def test_delete_last_panel_yields_empty(self) -> None:
        assert delete_panel([_panel(0, 720, pid="p1")], "p1") == []

    def test_delete_missing_id_rejected(self) -> None:
        with pytest.raises(ManhwaError):
            delete_panel([_panel(0, 240, pid="p1")], "p9")


class TestAdjustPanel:
    def test_bounds_replaced_and_marked(self) -> None:
        panels = [_panel(0, 400, pid="p1", user_corrected=False)]
        (out,) = adjust_panel(panels, "p1", x=0, y=50, w=360, h=300, source_w=360, source_h=720)
        assert (out.y, out.h) == (50, 300)
        assert out.user_corrected

    def test_within_source_but_over_neighbor_rejected(self) -> None:
        panels = [_panel(0, 240, pid="p1"), _panel(240, 240, pid="p2")]
        with pytest.raises(ManhwaError):
            adjust_panel(panels, "p2", x=0, y=200, w=360, h=240, source_w=360, source_h=720)

    def test_out_of_bounds_rejected(self) -> None:
        panels = [_panel(0, 240, pid="p1")]
        with pytest.raises(ValueError):
            adjust_panel(panels, "p1", x=0, y=700, w=360, h=100, source_w=360, source_h=720)
        with pytest.raises(ValueError):
            adjust_panel(panels, "p1", x=0, y=0, w=0, h=100, source_w=360, source_h=720)

    def test_missing_id_rejected(self) -> None:
        with pytest.raises(ManhwaError):
            adjust_panel([_panel(0, 240, pid="p1")], "p9", x=0, y=0, w=10, h=10, source_w=360, source_h=720)


class TestAddPanel:
    def test_add_with_fresh_id_and_confidence(self) -> None:
        panels = [_panel(0, 360, pid="p1"), _panel(360, 360, pid="p2")]
        out = add_panel(panels, x=0, y=720, w=360, h=100, source_w=360, source_h=820)
        added = [p for p in out if p.id == "p3"]
        assert len(added) == 1 and added[0].confidence == pytest.approx(1.0)
        assert added[0].user_corrected and added[0].order == 3

    def test_add_after_position(self) -> None:
        panels = [_panel(0, 360, pid="p1"), _panel(360, 360, pid="p2")]
        out = add_panel(panels, x=0, y=720, w=360, h=1, source_w=360, source_h=720 + 1, after_id="p1")
        assert [p.id for p in out] == ["p1", "p3", "p2"]
        assert [p.order for p in out] == [1, 2, 3]

    def test_add_overlapping_rejected(self) -> None:
        panels = [_panel(0, 360, pid="p1"), _panel(360, 360, pid="p2")]
        with pytest.raises(ManhwaError):
            add_panel(panels, x=0, y=100, w=360, h=100, source_w=360, source_h=720)


class TestReorderPanels:
    def test_reorder_sequence(self) -> None:
        panels = [_panel(0, 240, pid="p1"), _panel(240, 240, pid="p2"), _panel(480, 240, pid="p3")]
        out = reorder_panels(panels, ["p3", "p1", "p2"])
        assert [p.id for p in out] == ["p3", "p1", "p2"]
        assert [p.order for p in out] == [1, 2, 3]
        assert all(p.user_corrected for p in out)

    def test_non_permutation_rejected(self) -> None:
        panels = [_panel(0, 240, pid="p1"), _panel(240, 240, pid="p2")]
        with pytest.raises(ValueError):
            reorder_panels(panels, ["p1"])
        with pytest.raises(ValueError):
            reorder_panels(panels, ["p1", "p1"])
        with pytest.raises(ValueError):
            reorder_panels(panels, ["p1", "p2", "p9"])


class TestRedetect:
    def test_redetect_returns_guarded_reading_order(self) -> None:
        from manhwa_strips import AVAILABLE

        fixture = AVAILABLE["clean_white"]()
        panels = redetect(fixture.image, source_id="s-red")
        assert panels
        assert [p.order for p in panels] == list(range(1, len(panels) + 1))
        guarded = guard_layout(panels)
        assert [p.id for p in guarded] == [p.id for p in panels]