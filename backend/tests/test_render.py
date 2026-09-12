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
