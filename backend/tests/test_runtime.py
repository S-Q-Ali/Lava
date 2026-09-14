import json
import threading

import pytest
from fastapi.testclient import TestClient

from lava_backend.config import Config, get_config
from lava_backend.errors import ApiError
from lava_backend.main import app
from lava_backend.matching import _get_matcher
from lava_backend.transcribe import _get_transcriber


@pytest.fixture(autouse=True)
def _reset_model_state():
    app.state.transcriber = None
    app.state.matcher = None
    yield


# --- Slice 1: lazy model factory ---


def test_startup_constructs_no_models():
    with TestClient(app) as client:
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["ok"] is True
        assert app.state.transcriber is None
        assert app.state.matcher is None


def test_lazy_matcher_built_once_and_reused(monkeypatch):
    calls = {"count": 0}

    class FakeEmbedder:
        def embed_images(self, batch):
            raise AssertionError("not used")

        def text_embed(self, text):
            raise AssertionError("not used")

    def fake_clip(*args, **kwargs):
        calls["count"] += 1
        return FakeEmbedder()

    monkeypatch.setattr("lava_backend.clip.ClipEmbedder", fake_clip)
    m1 = _get_matcher(app.state)
    m2 = _get_matcher(app.state)
    assert m1 is m2
    assert calls["count"] == 1
    assert isinstance(m1.embedder, FakeEmbedder)


def test_lazy_transcriber_built_once_and_reused(monkeypatch):
    calls = {"count": 0}

    def fake_transcriber(*args, **kwargs):
        calls["count"] += 1
        return object()

    monkeypatch.setattr("lava_backend.transcribers.WhisperTranscriber", fake_transcriber)
    t1 = _get_transcriber(app.state)
    t2 = _get_transcriber(app.state)
    assert t1 is t2
    assert calls["count"] == 1


def test_lazy_factories_respect_injected_fakes():
    app.state.matcher = "sentinel-matcher"
    app.state.transcriber = "sentinel-transcriber"
    assert _get_matcher(app.state) == "sentinel-matcher"
    assert _get_transcriber(app.state) == "sentinel-transcriber"


# --- Slice 2: async render offload ---


def test_health_responds_during_render(client, monkeypatch):
    entered = threading.Event()
    release = threading.Event()

    def slow_render(config, *args, **kwargs):
        entered.set()
        release.wait(5)
        raise ApiError(422, "RENDER_FAILED", "intentional")

    monkeypatch.setattr("lava_backend.main.render", slow_render)
    render_errors = []

    def post_render():
        try:
            client.post(
                "/api/render",
                data={
                    "clips": json.dumps([{"fileName": "a.png", "start": 0, "duration": 1}]),
                    "settings": json.dumps({"width": 64, "height": 48, "fps": 10}),
                },
                files={"files": ("a.png", b"png", "image/png")},
            )
        except Exception as exc:  # pragma: no cover - defensive
            render_errors.append(exc)

    render_thread = threading.Thread(target=post_render)
    render_thread.start()
    assert entered.wait(5), "render did not start"

    health = {}
    health_thread = threading.Thread(target=lambda: health.setdefault("res", client.get("/api/health")))
    health_thread.start()
    health_thread.join(3)
    assert not health_thread.is_alive(), "health blocked while render was in flight"
    assert health["res"].status_code == 200

    release.set()
    render_thread.join(5)
    assert not render_thread.is_alive(), "render thread stuck"
    assert not render_errors


# --- Slice 3: configurable render timeout ---


def test_config_reads_render_timeout_seconds():
    assert get_config().render_timeout_seconds == 600


def test_config_defaults_render_timeout_when_missing(monkeypatch):
    monkeypatch.setattr("lava_backend.config._payload", lambda: {})
    assert Config.load().render_timeout_seconds == 600


def test_config_defaults_motion_upscale_factor_when_missing(monkeypatch):
    monkeypatch.setattr("lava_backend.config._payload", lambda: {})
    assert Config.load().motion_upscale_factor == 3


def test_health_reports_render_timeout_ms(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["renderTimeoutMs"] == 600_000


def test_run_reports_configured_timeout(monkeypatch):
    import subprocess

    from lava_backend import media

    def blow_up_command(command, **kwargs):
        assert kwargs["timeout"] == 600
        raise subprocess.TimeoutExpired(cmd=command, timeout=kwargs["timeout"])

    monkeypatch.setattr(media.subprocess, "run", blow_up_command)
    with pytest.raises(ApiError) as exc_info:
        media._run(["ffmpeg", "-i", "x"], timeout=600)
    assert "after 600s" in exc_info.value.message