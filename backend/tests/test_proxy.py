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


# --- Config.proxy_dir ---


class TestConfigProxyDir:
    def test_proxy_dir_is_set(self):
        cfg = config_module.Config.load()
        assert "proxy" in str(cfg.proxy_dir)
        assert cfg.proxy_dir.name == "proxy"
