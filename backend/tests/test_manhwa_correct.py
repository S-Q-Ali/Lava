"""M7 module 5: correction ops — pure list edits over frozen Panels."""

from __future__ import annotations

import pytest

from lava_backend.manhwa.errors import ManhwaError
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