"""Tests for backend proxy generation (proxy-core slice)."""

from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

import pytest
from PIL import Image

from lava_backend import config as config_module
from lava_backend.proxy import (
    ProxyError,
    ProxyResult,
    generate_image_proxy,
    generate_video_proxy,
    file_hash,
)


# --- helpers ---


def _make_image(path: Path, width: int = 200, height: int = 300) -> Path:
    """Create a small test PNG image."""
    img = Image.new("RGB", (width, height), color=(128, 64, 32))
    img.save(path, format="PNG")
    return path


def _make_video(path: Path, duration: float = 1.0, size: int = 64) -> Path:
    """Create a tiny test video via FFmpeg lavfi."""
    cfg = config_module.Config.load()
    subprocess.run(
        [
            str(cfg.ffmpeg_bin),
            "-y",
            "-f", "lavfi",
            "-i", f"testsrc=duration={duration}:size={size}x{size}:rate=10",
            "-pix_fmt", "yuv420p",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            str(path),
        ],
        check=True,
        capture_output=True,
    )
    return path


# --- file_hash tests ---


class TestFileHash:
    def test_deterministic(self):
        data = b"hello world proxy"
        assert file_hash(data) == file_hash(data)

    def test_length_is_16_hex_chars(self):
        h = file_hash(b"anything")
        assert len(h) == 16
        assert all(c in "0123456789abcdef" for c in h)

    def test_different_inputs_produce_different_hashes(self):
        assert file_hash(b"alpha") != file_hash(b"bravo")

    def test_empty_bytes(self):
        h = file_hash(b"")
        assert len(h) == 16


# --- ProxyResult dataclass ---


class TestProxyResult:
    def test_fields(self, tmp_path):
        img = _make_image(tmp_path / "in.png")
        result = generate_image_proxy(img, tmp_path / "out")
        assert isinstance(result, ProxyResult)
        assert result.width <= 480
        assert result.height > 0
        assert result.sizeBytes > 0
        assert result.mimeType == "image/webp"
        assert result.path.exists()


# --- generate_image_proxy tests ---


class TestGenerateImageProxy:
    def test_basic_proxy(self, tmp_path):
        img = _make_image(tmp_path / "source.png", width=800, height=600)
        dest = tmp_path / "proxies"
        dest.mkdir()
        result = generate_image_proxy(img, dest)
        assert result.width <= 480
        assert result.path.suffix == ".webp"
        assert result.path.exists()
        assert result.path.parent == dest

    def test_width_cap_default(self, tmp_path):
        img = _make_image(tmp_path / "wide.png", width=2000, height=1000)
        dest = tmp_path / "proxies"
        dest.mkdir()
        result = generate_image_proxy(img, dest, max_width=480)
        assert result.width == 480
        assert result.height == 240  # aspect preserved: 1000/2000*480 = 240

    def test_small_image_not_upscaled(self, tmp_path):
        img = _make_image(tmp_path / "tiny.png", width=100, height=150)
        dest = tmp_path / "proxies"
        dest.mkdir()
        result = generate_image_proxy(img, dest, max_width=480)
        assert result.width == 100
        assert result.height == 150

    def test_custom_max_width(self, tmp_path):
        img = _make_image(tmp_path / "src.png", width=1200, height=800)
        dest = tmp_path / "proxies"
        dest.mkdir()
        result = generate_image_proxy(img, dest, max_width=320)
        assert result.width == 320

    def test_output_is_webp(self, tmp_path):
        img = _make_image(tmp_path / "src.png", width=400, height=300)
        dest = tmp_path / "proxies"
        dest.mkdir()
        result = generate_image_proxy(img, dest)
        assert result.mimeType == "image/webp"
        # verify the file can be opened as WebP
        opened = Image.open(result.path)
        assert opened.format == "WEBP"

    def test_nonexistent_source_raises(self, tmp_path):
        dest = tmp_path / "proxies"
        dest.mkdir()
        with pytest.raises(ProxyError, match="not found"):
            generate_image_proxy(tmp_path / "nope.png", dest)


# --- generate_video_proxy tests ---


class TestGenerateVideoProxy:
    def test_basic_proxy(self, tmp_path):
        vid = _make_video(tmp_path / "source.mp4", duration=1.0, size=128)
        dest = tmp_path / "proxies"
        dest.mkdir()
        result = generate_video_proxy(vid, dest)
        assert result.path.exists()
        assert result.path.suffix == ".mp4"
        assert result.mimeType == "video/mp4"
        assert result.width <= 480

    def test_height_cap(self, tmp_path):
        vid = _make_video(tmp_path / "tall.mp4", duration=1.0, size=256)
        dest = tmp_path / "proxies"
        dest.mkdir()
        result = generate_video_proxy(vid, dest, max_height=480)
        assert result.height <= 480

    def test_duration_cap(self, tmp_path):
        vid = _make_video(tmp_path / "long.mp4", duration=5.0, size=64)
        dest = tmp_path / "proxies"
        dest.mkdir()
        result = generate_video_proxy(vid, dest, max_duration=1.0)
        # proxy should be ~1s, much smaller than source
        assert result.path.stat().st_size < vid.stat().st_size

    def test_nonexistent_source_raises(self, tmp_path):
        dest = tmp_path / "proxies"
        dest.mkdir()
        with pytest.raises(ProxyError, match="not found"):
            generate_video_proxy(tmp_path / "nope.mp4", dest)


# --- API route tests ---


class TestProxyAPI:
    """Tests for POST /api/proxy and GET /api/proxy/{proxyId}."""

    def test_post_image_proxy(self, client, tmp_path):
        img = _make_image(tmp_path / "photo.png", width=800, height=600)
        with open(img, "rb") as f:
            resp = client.post("/api/proxy", files={"file": ("photo.png", f, "image/png")})
        assert resp.status_code == 200
        body = resp.json()
        assert "proxyId" in body
        assert body["kind"] == "image"
        assert body["width"] <= 480
        assert body["height"] > 0
        assert body["mimeType"] == "image/webp"
        assert body["sizeBytes"] > 0

    def test_post_video_proxy(self, client, tmp_path):
        vid = _make_video(tmp_path / "clip.mp4", duration=0.5, size=64)
        with open(vid, "rb") as f:
            resp = client.post("/api/proxy", files={"file": ("clip.mp4", f, "video/mp4")})
        assert resp.status_code == 200
        body = resp.json()
        assert body["kind"] == "video"
        assert body["mimeType"] == "video/mp4"

    def test_post_idempotent_same_content(self, client, tmp_path):
        img = _make_image(tmp_path / "idem.png", width=200, height=200)
        with open(img, "rb") as f:
            resp1 = client.post("/api/proxy", files={"file": ("a.png", f, "image/png")})
        with open(img, "rb") as f:
            resp2 = client.post("/api/proxy", files={"file": ("b.png", f, "image/png")})
        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["proxyId"] == resp2.json()["proxyId"]

    def test_get_serves_proxy(self, client, tmp_path):
        img = _make_image(tmp_path / "serve.png", width=200, height=200)
        with open(img, "rb") as f:
            resp = client.post("/api/proxy", files={"file": ("serve.png", f, "image/png")})
        proxy_id = resp.json()["proxyId"]
        get_resp = client.get(f"/api/proxy/{proxy_id}")
        assert get_resp.status_code == 200
        assert get_resp.headers["content-type"] == "image/webp"

    def test_get_video_serves_proxy(self, client, tmp_path):
        vid = _make_video(tmp_path / "vid.mp4", duration=0.5, size=64)
        with open(vid, "rb") as f:
            resp = client.post("/api/proxy", files={"file": ("vid.mp4", f, "video/mp4")})
        proxy_id = resp.json()["proxyId"]
        get_resp = client.get(f"/api/proxy/{proxy_id}")
        assert get_resp.status_code == 200
        assert get_resp.headers["content-type"] == "video/mp4"

    def test_get_404_unknown_id(self, client):
        resp = client.get("/api/proxy/0000000000000000")
        assert resp.status_code == 404
        assert resp.json()["error"]["code"] == "NOT_FOUND"

    def test_post_unsupported_type(self, client, tmp_path):
        txt = tmp_path / "notes.txt"
        txt.write_text("not media", encoding="utf-8")
        with open(txt, "rb") as f:
            resp = client.post("/api/proxy", files={"file": ("notes.txt", f, "text/plain")})
        assert resp.status_code == 422
        assert resp.json()["error"]["code"] == "PROXY_UNSUPPORTED"

    def test_post_empty_file(self, client, tmp_path):
        empty = tmp_path / "empty.png"
        empty.write_bytes(b"")
        with open(empty, "rb") as f:
            resp = client.post("/api/proxy", files={"file": ("empty.png", f, "image/png")})
        assert resp.status_code == 422
        assert resp.json()["error"]["code"] in ("PROXY_UNSUPPORTED", "PROXY_FAILED")


# --- Config.proxy_dir ---


class TestConfigProxyDir:
    def test_proxy_dir_is_set(self):
        cfg = config_module.Config.load()
        assert "proxy" in str(cfg.proxy_dir)
        assert cfg.proxy_dir.name == "proxy"
