import subprocess

import pytest

from lava_backend import config as config_module


def make_clip(tmp_path) -> str:
    cfg = config_module.Config.load()
    out = tmp_path / "clip.mp4"
    subprocess.run(
        [
            str(cfg.ffmpeg_bin),
            "-y",
            "-f", "lavfi",
            "-i", "testsrc=duration=0.5:size=64x64:rate=10",
            "-pix_fmt", "yuv420p",
            "-c:v", "libx264",
            str(out),
        ],
        check=True,
        capture_output=True,
    )
    return str(out)


def test_probe_reports_media_metadata(client, tmp_path):
    path = make_clip(tmp_path)
    response = client.post("/api/probe", json={"path": path})
    assert response.status_code == 200
    body = response.json()
    assert body["path"] == path
    assert body["duration"] is not None and abs(body["duration"] - 0.5) < 0.1
    assert body["sizeBytes"] and body["sizeBytes"] > 0
    video = next(s for s in body["streams"] if s["codecType"] == "video")
    assert video["width"] == 64 and video["height"] == 64


def test_probe_missing_path_is_400(client):
    response = client.post("/api/probe", json={"path": "/no/such/file.mp4"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "PATH_MISSING"


def test_probe_non_media_file_is_422(client, tmp_path):
    txt = tmp_path / "notes.txt"
    txt.write_text("this is not media", encoding="utf-8")
    response = client.post("/api/probe", json={"path": str(txt)})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "PROBE_FAILED"


def test_probe_error_shape_consistent(client):
    response = client.post("/api/probe", json={"path": "/no/such/file.mp4"})
    assert set(response.json().keys()) == {"error"}
    assert set(response.json()["error"].keys()) == {"code", "message"}