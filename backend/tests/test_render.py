import json
import subprocess
from pathlib import Path

import pytest

from lava_backend import config as config_module


def make_image(tmp_path: Path, name: str = "img.png") -> Path:
    cfg = config_module.Config.load()
    out = tmp_path / name
    subprocess.run(
        [
            str(cfg.ffmpeg_bin), "-y",
            "-f", "lavfi",
            "-i", "color=c=blue:s=32x24:rate=1",
            "-frames:v", "1",
            str(out),
        ],
        check=True,
        capture_output=True,
    )
    assert out.exists()
    return out


def render_multipart(client, tmp_path, clips, settings, file_pairs):
    return client.post(
        "/api/render",
        data={
            "clips": json.dumps(clips),
            "settings": json.dumps(settings),
        },
        files=[("files", (name, data, mime)) for name, data, mime in file_pairs],
    )


def test_render_single_image(client, tmp_path):
    img = make_image(tmp_path, "a.png")
    resp = render_multipart(
        client,
        tmp_path,
        clips=[{"fileName": "a.png", "duration": 2.0}],
        settings={"width": 64, "height": 48, "fps": 10},
        file_pairs=[("a.png", img.read_bytes(), "image/png")],
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["width"] == 64
    assert body["height"] == 48
    assert body["fps"] == 10
    assert body["sizeBytes"] and body["sizeBytes"] > 0
    assert Path(body["outputPath"]).exists()
    assert body["duration"] is not None and abs(body["duration"] - 2.0) <= 0.2
    assert len(body["jobId"]) == 32


def test_render_two_images_concat(client, tmp_path):
    img_a = make_image(tmp_path, "a.png")
    img_b = make_image(tmp_path, "b.png")
    resp = render_multipart(
        client,
        tmp_path,
        clips=[
            {"fileName": "a.png", "duration": 3.0},
            {"fileName": "b.png", "duration": 2.0},
        ],
        settings={"width": 32, "height": 24, "fps": 10},
        file_pairs=[
            ("a.png", img_a.read_bytes(), "image/png"),
            ("b.png", img_b.read_bytes(), "image/png"),
        ],
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["duration"] is not None and abs(body["duration"] - 5.0) <= 0.2


def test_render_serve_endpoint(client, tmp_path):
    img = make_image(tmp_path, "x.png")
    resp = render_multipart(
        client,
        tmp_path,
        clips=[{"fileName": "x.png", "duration": 1.0}],
        settings={"width": 32, "height": 24, "fps": 10},
        file_pairs=[("x.png", img.read_bytes(), "image/png")],
    )
    job_id = resp.json()["jobId"]
    file_resp = client.get(f"/api/files/{job_id}")
    assert file_resp.status_code == 200
    assert "video/mp4" in file_resp.headers["content-type"]


def test_render_missing_job_404(client):
    resp = client.get("/api/files/" + "0" * 32)
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_render_file_clip_count_mismatch_is_400(client, tmp_path):
    img = make_image(tmp_path, "a.png")
    resp = render_multipart(
        client,
        tmp_path,
        clips=[{"fileName": "a.png", "duration": 1.0}, {"fileName": "a.png", "duration": 1.0}],
        settings={"width": 32, "height": 24, "fps": 10},
        file_pairs=[("a.png", img.read_bytes(), "image/png")],
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "FILE_COUNT_MISMATCH"


def test_render_invalid_duration_is_422(client, tmp_path):
    img = make_image(tmp_path, "a.png")
    resp = render_multipart(
        client,
        tmp_path,
        clips=[{"fileName": "a.png", "duration": 0}],
        settings={"width": 32, "height": 24, "fps": 10},
        file_pairs=[("a.png", img.read_bytes(), "image/png")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "INVALID_DURATION"

def render_multipart_with_transitions(client, tmp_path, clips, settings, transitions, file_pairs):
    data = {"clips": json.dumps(clips), "settings": json.dumps(settings)}
    if transitions is not None:
        data["transitions"] = json.dumps(transitions)
    return client.post(
        "/api/render",
        data=data,
        files=[("files", (name, data2, mime)) for name, data2, mime in file_pairs],
    )


def test_render_dissolve_via_http(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    b = make_image(tmp_path, "b.png")
    resp = render_multipart_with_transitions(
        client,
        tmp_path,
        clips=[{"fileName": "a.png", "duration": 2.0}, {"fileName": "b.png", "duration": 2.0}],
        settings={"width": 64, "height": 48, "fps": 10},
        transitions=[
            {"kind": "between", "first": 0, "second": 1, "type": "dissolve", "duration": 0.5}
        ],
        file_pairs=[("a.png", a.read_bytes(), "image/png"), ("b.png", b.read_bytes(), "image/png")],
    )
    assert resp.status_code == 201
    assert resp.json()["duration"] == pytest.approx(3.5, abs=0.2)


def test_render_wipe_via_http_is_unsupported(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    b = make_image(tmp_path, "b.png")
    resp = render_multipart_with_transitions(
        client,
        tmp_path,
        clips=[{"fileName": "a.png", "duration": 2.0}, {"fileName": "b.png", "duration": 2.0}],
        settings={"width": 64, "height": 48, "fps": 10},
        transitions=[{"kind": "between", "first": 0, "second": 1, "type": "wipe", "duration": 0.5}],
        file_pairs=[("a.png", a.read_bytes(), "image/png"), ("b.png", b.read_bytes(), "image/png")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "TRANSITION_UNSUPPORTED"


def test_render_bad_transition_index_via_http_is_422(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    b = make_image(tmp_path, "b.png")
    resp = render_multipart_with_transitions(
        client,
        tmp_path,
        clips=[{"fileName": "a.png", "duration": 2.0}, {"fileName": "b.png", "duration": 2.0}],
        settings={"width": 64, "height": 48, "fps": 10},
        transitions=[{"kind": "between", "first": 0, "second": 2, "type": "dissolve", "duration": 0.5}],
        file_pairs=[("a.png", a.read_bytes(), "image/png"), ("b.png", b.read_bytes(), "image/png")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "TRANSITION_INVALID"


def test_render_malformed_transitions_body_is_422(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    resp = render_multipart_with_transitions(
        client,
        tmp_path,
        clips=[{"fileName": "a.png", "duration": 2.0}],
        settings={"width": 64, "height": 48, "fps": 10},
        transitions=[{"kind": "nope"}],
        file_pairs=[("a.png", a.read_bytes(), "image/png")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "INVALID_BODY"


def render_multipart_motion(client, tmp_path, clips, settings, transitions, file_pairs):
    data = {
        "clips": json.dumps(clips),
        "settings": json.dumps(settings),
    }
    if transitions is not None:
        data["transitions"] = json.dumps(transitions)
    return client.post(
        "/api/render",
        data=data,
        files=[("files", (name, data_f, mime)) for name, data_f, mime in file_pairs],
    )


def test_render_motion_via_http(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    data = a.read_bytes()
    clips = [
        {"fileName": "a.png", "start": 0, "duration": 2.0, "motion": {"type": "zoom-in", "strength": 1.0}}
    ]
    resp = render_multipart_motion(
        client, tmp_path, clips, {"width": 32, "height": 24, "fps": 10}, None,
        [("a.png", data, "image/png")],
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["duration"] == pytest.approx(2.0, abs=0.15)


def test_render_motion_with_transition_via_http(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    b = make_image(tmp_path, "b.png")
    da, db = a.read_bytes(), b.read_bytes()
    clips = [
        {"fileName": "a.png", "start": 0, "duration": 2.0, "motion": {"type": "pan-right", "strength": 1.0}},
        {"fileName": "b.png", "start": 2.0, "duration": 2.0},
    ]
    transitions = [{"kind": "between", "first": 0, "second": 1, "type": "dissolve", "duration": 0.5}]
    resp = render_multipart_motion(
        client, tmp_path, clips, {"width": 32, "height": 24, "fps": 10}, transitions,
        [("a.png", da, "image/png"), ("b.png", db, "image/png")],
    )
    assert resp.status_code == 201
    assert resp.json()["duration"] == pytest.approx(3.5, abs=0.2)


def test_render_motion_unknown_type_via_http_is_422(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    clips = [
        {"fileName": "a.png", "start": 0, "duration": 2.0, "motion": {"type": "spiral", "strength": 0.5}}
    ]
    resp = render_multipart_motion(
        client, tmp_path, clips, {"width": 32, "height": 24, "fps": 10}, None,
        [("a.png", a.read_bytes(), "image/png")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "MOTION_INVALID"


def test_render_motion_strength_out_of_range_via_http_is_422(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    clips = [
        {"fileName": "a.png", "start": 0, "duration": 2.0, "motion": {"type": "zoom-in", "strength": 1.5}}
    ]
    resp = render_multipart_motion(
        client, tmp_path, clips, {"width": 32, "height": 24, "fps": 10}, None,
        [("a.png", a.read_bytes(), "image/png")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "MOTION_INVALID"


def test_render_motion_on_video_clip_is_422(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    b = make_image(tmp_path, "b.png")
    clips = [
        {"fileName": "a.png", "start": 0, "duration": 2.0},
        {"fileName": "b.mov", "start": 2.0, "duration": 2.0, "motion": {"type": "zoom-in", "strength": 0.5}},
    ]
    resp = render_multipart_motion(
        client, tmp_path, clips, {"width": 32, "height": 24, "fps": 10}, None,
        [("a.png", a.read_bytes(), "image/png"), ("b.mov", b.read_bytes(), "video/quicktime")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "MOTION_INVALID"


CAPTION_STYLE = {
    "fontFamily": "Arial",
    "fontSize": 42,
    "primaryColor": "#FFFFFF",
    "highlightColor": "#FFD54A",
    "outlineColor": "#000000",
    "outlineWidth": 2,
    "bold": False,
    "uppercase": False,
    "alignment": "bottom",
}


def render_multipart_captions(client, tmp_path, clips, settings, captions, file_pairs):
    data = {
        "clips": json.dumps(clips),
        "settings": json.dumps(settings),
    }
    if captions is not None:
        data["captions"] = json.dumps(captions)
    return client.post(
        "/api/render",
        data=data,
        files=[("files", (name, data_f, mime)) for name, data_f, mime in file_pairs],
    )


def test_render_with_captions_via_http(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    captions = [
        {
            "start": 0.0,
            "duration": 2.0,
            "text": "Warm sunsets",
            "style": CAPTION_STYLE,
        }
    ]
    resp = render_multipart_captions(
        client, tmp_path,
        clips=[{"fileName": "a.png", "duration": 2.0}],
        settings={"width": 128, "height": 96, "fps": 10},
        captions=captions,
        file_pairs=[("a.png", a.read_bytes(), "image/png")],
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["duration"] == pytest.approx(2.0, abs=0.2)
    assert Path(body["outputPath"]).exists()


def test_render_empty_captions_stay_parity(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    resp = render_multipart_captions(
        client, tmp_path,
        clips=[{"fileName": "a.png", "duration": 1.0}],
        settings={"width": 32, "height": 24, "fps": 10},
        captions=[],
        file_pairs=[("a.png", a.read_bytes(), "image/png")],
    )
    assert resp.status_code == 201


def test_render_captions_invalid_style_is_422(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    bad_style = dict(CAPTION_STYLE, fontSize=0)
    resp = render_multipart_captions(
        client, tmp_path,
        clips=[{"fileName": "a.png", "duration": 1.0}],
        settings={"width": 32, "height": 24, "fps": 10},
        captions=[{"start": 0, "duration": 1, "text": "x", "style": bad_style}],
        file_pairs=[("a.png", a.read_bytes(), "image/png")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "CAPTION_INVALID"


def test_render_captions_missing_text_is_422(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    resp = render_multipart_captions(
        client, tmp_path,
        clips=[{"fileName": "a.png", "duration": 1.0}],
        settings={"width": 32, "height": 24, "fps": 10},
        captions=[{"start": 0, "duration": 1}],
        file_pairs=[("a.png", a.read_bytes(), "image/png")],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "CAPTION_INVALID"


def test_render_captions_malformed_json_is_422(client, tmp_path):
    a = make_image(tmp_path, "a.png")
    resp = client.post(
        "/api/render",
        data={
            "clips": json.dumps([{"fileName": "a.png", "duration": 1.0}]),
            "settings": json.dumps({"width": 32, "height": 24, "fps": 10}),
            "captions": "{not json",
        },
        files=[("files", ("a.png", a.read_bytes(), "image/png"))],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "INVALID_BODY"


def test_render_captions_burn_pixels_change(client, tmp_path):
    """Real-ffmpeg smoke: the burned caption visibly changes a bottom-strip frame."""
    cfg = config_module.Config.load()
    a = make_image(tmp_path, "a.png")
    clips = [{"fileName": "a.png", "duration": 1.0}]
    settings = {"width": 160, "height": 120, "fps": 10}
    pairs = [("a.png", a.read_bytes(), "image/png")]

    plain = render_multipart_captions(client, tmp_path, clips, settings, None, pairs)
    burned = render_multipart_captions(
        client, tmp_path, clips, settings,
        [{"start": 0.0, "duration": 1.0, "text": "TEST", "style": CAPTION_STYLE}],
        pairs,
    )
    assert plain.status_code == 201 and burned.status_code == 201

    def bottom_strip(mp4: Path) -> bytes:
        frame = tmp_path / (mp4.stem + "-frame.png")
        subprocess.run(
            [
                str(cfg.ffmpeg_bin), "-y", "-ss", "0.5", "-i", str(mp4),
                "-frames:v", "1", "-vf", "crop=160:40:0:80", str(frame),
            ],
            check=True, capture_output=True,
        )
        return frame.read_bytes()

    strip_plain = bottom_strip(Path(plain.json()["outputPath"]))
    strip_burned = bottom_strip(Path(burned.json()["outputPath"]))
    assert strip_plain != strip_burned
