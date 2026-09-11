def test_health_reports_ffmpeg_versions(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["name"] == "lava-backend"
    assert isinstance(body["ffmpegVersion"], str) and body["ffmpegVersion"]
    assert isinstance(body["ffprobeVersion"], str) and body["ffprobeVersion"]


def test_health_fails_without_ffmpeg_binary(client, monkeypatch):
    from dataclasses import replace

    from lava_backend import config

    cfg = config.Config.load()
    broken = replace(
        cfg,
        ffmpeg_bin=cfg.root / "tools" / "ffmpeg" / "bin" / "no-such-binary",
    )
    monkeypatch.setattr(config, "_config", broken)

    response = client.get("/api/health")
    assert response.status_code == 503
    body = response.json()
    assert body["error"]["code"] == "FFMPEG_UNAVAILABLE"
    assert "not found" in body["error"]["message"]