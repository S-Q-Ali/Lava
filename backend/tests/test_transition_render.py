import pytest

from lava_backend.errors import ApiError
from lava_backend.media import (
    BetweenSpec,
    EdgeSpec,
    RenderSettings,
    _filter_complex,
    build_transition_graph,
)
from lava_backend.media import RenderClip

SETTINGS = RenderSettings(width=1280, height=720, fps=30)


def clip(duration: float) -> RenderClip:
    return RenderClip(file_index=0, start=0.0, duration=duration)


def test_parity_with_empty_transitions():
    clips = [clip(2.0), clip(2.0), clip(2.0)]
    graph, duration = build_transition_graph(clips, [])
    assert graph == _filter_complex(clips, SETTINGS)
    assert duration == 6.0


def test_match_transitions_are_invisible_cuts():
    clips = [clip(2.0), clip(2.0)]
    graph, duration = build_transition_graph(
        clips, [BetweenSpec(first=0, second=1, type="match", duration=0.3)]
    )
    assert graph == _filter_complex(clips, SETTINGS)
    assert duration == 4.0


def test_single_dissolve_offset_and_duration():
    clips = [clip(2.0), clip(2.0)]
    graph, duration = build_transition_graph(
        clips, [BetweenSpec(first=0, second=1, type="dissolve", duration=0.5)]
    )
    assert "xfade=transition=fade:duration=0.5:offset=1.5" in graph
    assert duration == 3.5


def test_chained_dissolves_accumulate_offsets():
    clips = [clip(2.0), clip(2.0), clip(2.0)]
    graph, duration = build_transition_graph(
        clips,
        [
            BetweenSpec(first=0, second=1, type="dissolve", duration=0.5),
            BetweenSpec(first=1, second=2, type="fade", duration=0.4),
        ],
    )
    assert "xfade=transition=fade:duration=0.5:offset=1.5" in graph
    assert "xfade=transition=fadeblack:duration=0.4:offset=3.1" in graph
    assert duration == 6.0 - 0.9


def test_edge_start_fade_applied_to_first_stream():
    clips = [clip(3.0), clip(2.0)]
    graph, duration = build_transition_graph(
        clips, [EdgeSpec(at="start", index=0, duration=0.4)]
    )
    assert "[v0]fade=t=in:st=0:d=0.4[v0e]" in graph
    assert duration == 5.0


def test_edge_end_fade_applied_to_last_stream_with_st():
    clips = [clip(2.0), clip(2.0)]
    graph, _ = build_transition_graph(
        clips, [EdgeSpec(at="end", index=1, duration=0.3)]
    )
    assert "[v1]fade=t=out:st=1.7:d=0.3[v1e]" in graph


def test_mixed_pair_folds_with_nested_concat():
    clips = [clip(2.0), clip(2.0), clip(2.0)]
    graph, duration = build_transition_graph(
        clips, [BetweenSpec(first=1, second=2, type="dissolve", duration=0.5)]
    )
    assert "concat=n=2:v=1:a=0[tmp1]" in graph
    assert "xfade=transition=fade:duration=0.5:offset=" in graph
    assert duration == 5.5


@pytest.mark.parametrize(
    "transitions,expected",
    [
        ([BetweenSpec(first=0, second=2, type="dissolve", duration=0.5)], "TRANSITION_INVALID"),
        ([BetweenSpec(first=0, second=3, type="dissolve", duration=0.5)], "TRANSITION_INVALID"),
        ([BetweenSpec(first=0, second=1, type="dissolve", duration=3.0)], "TRANSITION_INVALID"),
        ([BetweenSpec(first=0, second=1, type="dissolve", duration=0.05)], "TRANSITION_INVALID"),
        ([EdgeSpec(at="start", index=1, duration=0.5)], "TRANSITION_INVALID"),
        ([EdgeSpec(at="end", index=0, duration=0.5)], "TRANSITION_INVALID"),
    ],
)
def test_invalid_transitions_raise(transitions, expected):
    clips = [clip(2.0), clip(2.0), clip(2.0)]
    with pytest.raises(ApiError) as excinfo:
        build_transition_graph(clips, transitions)
    assert excinfo.value.code == expected


@pytest.mark.parametrize(
    "transition",
    [
        BetweenSpec(first=0, second=1, type="wipe", duration=0.5),
        BetweenSpec(first=0, second=1, type="zoom", duration=0.5),
    ],
)
def test_wipe_and_zoom_are_unsupported(transition):
    clips = [clip(2.0), clip(2.0)]
    with pytest.raises(ApiError) as excinfo:
        build_transition_graph(clips, [transition])
    assert excinfo.value.code == "TRANSITION_UNSUPPORTED"
import subprocess
from pathlib import Path

from lava_backend import config as config_module
from lava_backend.media import RenderClip, render


def _make_image(tmp_path: Path, name: str) -> Path:
    cfg = config_module.Config.load()
    out = tmp_path / name
    subprocess.run(
        [str(cfg.ffmpeg_bin), "-y", "-f", "lavfi", "-i", "color=c=blue:s=32x24:rate=1", "-frames:v", "1", str(out)],
        check=True,
        capture_output=True,
    )
    return out


def test_render_dissolve_shortens_output_duration(tmp_path):
    cfg = config_module.Config.load()
    files = [_make_image(tmp_path, "a.png"), _make_image(tmp_path, "b.png")]
    clips = [RenderClip(file_index=0, start=0, duration=2.0), RenderClip(file_index=1, start=2.0, duration=2.0)]
    result = render(
        cfg,
        files,
        clips,
        RenderSettings(width=64, height=48, fps=10),
        transitions=[BetweenSpec(first=0, second=1, type="dissolve", duration=0.5)],
    )
    assert result.duration == pytest.approx(3.5, abs=0.15)


def test_render_edge_fade_keeps_full_duration(tmp_path):
    cfg = config_module.Config.load()
    files = [_make_image(tmp_path, "a.png")]
    clips = [RenderClip(file_index=0, start=0, duration=2.0)]
    result = render(
        cfg,
        files,
        clips,
        RenderSettings(width=64, height=48, fps=10),
        transitions=[EdgeSpec(at="start", index=0, duration=0.4)],
    )
    assert result.duration == pytest.approx(2.0, abs=0.15)


def test_render_wipe_raises_unsupported(tmp_path):
    cfg = config_module.Config.load()
    files = [_make_image(tmp_path, "a.png"), _make_image(tmp_path, "b.png")]
    clips = [RenderClip(file_index=0, start=0, duration=2.0), RenderClip(file_index=1, start=2.0, duration=2.0)]
    with pytest.raises(ApiError) as excinfo:
        render(
            cfg,
            files,
            clips,
            RenderSettings(width=64, height=48, fps=10),
            transitions=[BetweenSpec(first=0, second=1, type="wipe", duration=0.5)],
        )
    assert excinfo.value.code == "TRANSITION_UNSUPPORTED"
