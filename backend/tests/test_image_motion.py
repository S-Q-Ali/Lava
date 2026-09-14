import subprocess
from pathlib import Path

import pytest

from lava_backend import config as config_module
from lava_backend.errors import ApiError
from lava_backend.media import (
    MotionSpec,
    RenderClip,
    RenderSettings,
    _filter_complex,
    _motion_filters,
    _prep_chain,
    build_transition_graph,
    render,
)

W, H = 640, 360


def clip(motion=None, duration=2.0):
    return RenderClip(file_index=0, start=0, duration=duration, motion=motion)


def test_prep_chain_without_motion_matches_plain_chain():
    plain = _prep_chain(clip(), 0, RenderSettings(width=W, height=H, fps=10))
    with_motion_none = clip(motion=None)
    assert _prep_chain(with_motion_none, 0, RenderSettings(width=W, height=H, fps=10)) == plain
    assert "crop=" not in plain


def test_motion_filters_pan_right_uses_strength_scaled_drift():
    m = MotionSpec(type="pan-right", strength=1.0)
    filters = _motion_filters(m, RenderSettings(width=W, height=H, fps=10), 2.0)
    assert filters == [
        "scale=iw*3:ih*3:flags=bicubic",
        "zoompan=d=1:s=640x360:fps=10:z='1.15':x='(iw-iw/1.15)*on/19':y='(ih-ih/1.15)/2'",
    ]


def test_motion_filters_pan_left_reverses_the_drift():
    m = MotionSpec(type="pan-left", strength=0.5)
    filters = _motion_filters(m, RenderSettings(width=W, height=H, fps=10), 2.0)
    assert filters[1] == "zoompan=d=1:s=640x360:fps=10:z='1.075':x='(iw-iw/1.075)*(1-on/19)':y='(ih-ih/1.075)/2'"


def test_motion_filters_zoom_in_animates_z_down_to_one():
    m = MotionSpec(type="zoom-in", strength=1.0)
    filters = _motion_filters(m, RenderSettings(width=W, height=H, fps=10), 2.0)
    assert len(filters) == 2
    assert "z='1.15-(1.15-1)*on/19'" in filters[1]
    assert "(iw-iw/1.15)/2" in filters[1]
    assert "s=640x360" in filters[1]


def test_motion_filters_zoom_out_grows_z_over_time():
    m = MotionSpec(type="zoom-out", strength=0.5)
    filters = _motion_filters(m, RenderSettings(width=W, height=H, fps=10), 2.0)
    assert "z='1+(1.075-1)*on/19'" in filters[1]


def test_motion_filters_strength_zero_means_static():
    assert _motion_filters(MotionSpec(type="pan-right", strength=0.0), RenderSettings(width=W, height=H, fps=10), 2.0) == []


@pytest.mark.parametrize(
    "mtype",
    ["pan-right", "pan-left", "pan-up", "pan-down", "zoom-in", "zoom-out"],
)
def test_prep_chain_embeds_motion_for_every_preset(mtype):
    m = MotionSpec(type=mtype, strength=0.6)
    chain = _prep_chain(clip(m), 0, RenderSettings(width=W, height=H, fps=10))
    assert "scale=iw*3:ih*3:flags=bicubic" in chain
    assert "zoompan=" in chain
    assert "1.09" in chain
    assert chain.startswith(f"[0:v]fps=10,")
    assert chain.endswith("setpts=PTS-STARTPTS[v0]")


def test_build_transition_graph_with_motion_keeps_parity_when_absent():
    clips = [
        RenderClip(file_index=0, start=0, duration=2.0),
        RenderClip(file_index=1, start=2.0, duration=2.0),
    ]
    graph, total = build_transition_graph(clips, [], RenderSettings(width=W, height=H, fps=10))
    assert total == 4.0
    assert graph == _filter_complex(clips, RenderSettings(width=W, height=H, fps=10))


_MOTION_TYPES = ["pan-right", "pan-left", "pan-up", "pan-down", "zoom-in", "zoom-out"]


@pytest.mark.parametrize("mtype", _MOTION_TYPES)
def test_unknown_or_offrange_motion_rejected(mtype):
    bad_type = MotionSpec(type="spiral", strength=0.5)
    with pytest.raises(ApiError) as exc:
        _prep_chain(clip(bad_type), 0, RenderSettings(width=W, height=H, fps=10))
    assert exc.value.code == "MOTION_INVALID"

    bad_strength = MotionSpec(type=mtype, strength=1.5)
    with pytest.raises(ApiError) as exc:
        _prep_chain(clip(bad_strength), 0, RenderSettings(width=W, height=H, fps=10))
    assert exc.value.code == "MOTION_INVALID"

    negative = MotionSpec(type=mtype, strength=-0.1)
    with pytest.raises(ApiError) as exc:
        _prep_chain(clip(negative), 0, RenderSettings(width=W, height=H, fps=10))
    assert exc.value.code == "MOTION_INVALID"


def test_custom_upscale_factor_replaces_default_three():
    m = MotionSpec(type="zoom-in", strength=1.0)
    filters = _motion_filters(m, RenderSettings(width=W, height=H, fps=10, upscale_factor=2), 2.0)
    assert "scale=iw*2:ih*2:flags=bicubic" in filters[0]
    zoompan_scale = "s=640x360"
    assert zoompan_scale in filters[1]


def test_upscale_factor_out_of_range_rejected():
    m = MotionSpec(type="zoom-in", strength=1.0)
    for bad in (0, 9):
        with pytest.raises(ApiError) as exc:
            _motion_filters(m, RenderSettings(width=W, height=H, fps=10, upscale_factor=bad), 2.0)
        assert exc.value.code == "MOTION_INVALID"


def test_upscale_factor_default_is_three():
    m = MotionSpec(type="zoom-in", strength=1.0)
    filters = _motion_filters(m, RenderSettings(width=W, height=H, fps=10), 2.0)
    assert "scale=iw*3:ih*3:flags=bicubic" in filters[0]


def test_render_motion_clip_keeps_duration(tmp_path):
    cfg = config_module.Config.load()
    img = tmp_path / "a.png"
    subprocess.run(
        [str(cfg.ffmpeg_bin), "-y", "-f", "lavfi", "-i", "color=c=red:s=64x48:rate=1", "-frames:v", "1", str(img)],
        check=True,
        capture_output=True,
    )
    result = render(
        cfg,
        [img],
        [RenderClip(file_index=0, start=0, duration=2.0, motion=MotionSpec(type="zoom-in", strength=1.0))],
        RenderSettings(width=64, height=48, fps=10),
    )
    assert result.duration == pytest.approx(2.0, abs=0.15)


def test_render_motion_with_dissolve_keeps_duration_math(tmp_path):
    cfg = config_module.Config.load()
    imgs = [tmp_path / "a.png", tmp_path / "b.png"]
    for i, name in enumerate(["a.png", "b.png"]):
        subprocess.run(
            [str(cfg.ffmpeg_bin), "-y", "-f", "lavfi", "-i", f"color=c={['red', 'blue'][i]}:s=64x48:rate=1", "-frames:v", "1", str(imgs[i])],
            check=True,
            capture_output=True,
        )
    clips = [
        RenderClip(file_index=0, start=0, duration=2.0, motion=MotionSpec(type="pan-right", strength=1.0)),
        RenderClip(file_index=1, start=2.0, duration=2.0),
    ]
    from lava_backend.media import BetweenSpec
    result = render(
        cfg,
        imgs,
        clips,
        RenderSettings(width=64, height=48, fps=10),
        transitions=[BetweenSpec(first=0, second=1, type="dissolve", duration=0.5)],
    )
    assert result.duration == pytest.approx(3.5, abs=0.2)