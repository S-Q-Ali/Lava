"""Tests for disk cache GC: proxy purge + /api/gc endpoint."""
from __future__ import annotations

import dataclasses
import shutil
import time
from pathlib import Path

from fastapi.testclient import TestClient

from lava_backend.config import get_config
from lava_backend.gc import GcReport, purge_stale_proxies
from lava_backend.main import app


def _cfg(tmp_path: Path):
    cfg = get_config()
    proxy = tmp_path / "proxy"
    proxy.mkdir()
    return dataclasses.replace(cfg, proxy_dir=proxy, proxy_ttl_days=7)


def _img(hash16: str) -> str:
    return hash16 + ".webp"


def _vid(hash16: str) -> str:
    return hash16 + "_proxy.mp4"


def _touch(path: Path, content: bytes = b"ok", *, stale: bool = False) -> None:
    path.write_bytes(content)
    if stale:
        import os

        old_time = time.time() - 14 * 86400
        os.utime(path, (old_time, old_time))


class TestPurgeStaleProxies:
    def test_removes_only_stale_proxy_files(self, tmp_path) -> None:
        cfg = _cfg(tmp_path)
        _touch(cfg.proxy_dir / _img("a" * 16), b"img", stale=True)
        _touch(cfg.proxy_dir / _vid("b" * 16), b"vid", stale=True)
        _touch(cfg.proxy_dir / _img("c" * 16), b"fresh")
        _touch(cfg.proxy_dir / "not_a_proxy.txt", b"stray")
        report = purge_stale_proxies(cfg)
        assert report.purged == 2
        assert report.remaining == 1
        assert report.freedBytes > 0
        assert (cfg.proxy_dir / "not_a_proxy.txt").exists()
        assert list(cfg.proxy_dir.glob("a*.webp")) == []
        assert (cfg.proxy_dir / _img("c" * 16)).exists()

    def test_dry_run_deletes_nothing(self, tmp_path) -> None:
        cfg = _cfg(tmp_path)
        _touch(cfg.proxy_dir / _img("a" * 16), stale=True)
        report = purge_stale_proxies(cfg, dry_run=True)
        assert report.purged == 1
        assert list(cfg.proxy_dir.iterdir())  # still present

    def test_custom_ttl(self, tmp_path) -> None:
        cfg = dataclasses.replace(_cfg(tmp_path), proxy_ttl_days=1)
        _touch(cfg.proxy_dir / _img("a" * 16), stale=True)
        _touch(cfg.proxy_dir / _img("b" * 16), stale=False)
        old = time.time() - 2 * 86400
        import os
        os.utime(cfg.proxy_dir / _img("b" * 16), (old, old))
        report = purge_stale_proxies(cfg)
        assert report.purged == 2
        assert report.remaining == 0


class TestGCProxyEndpoint:
    def test_gc_purge_returns_report(self, tmp_path, monkeypatch) -> None:
        cfg = _cfg(tmp_path)
        import lava_backend.main as _main

        monkeypatch.setattr(_main, "get_config", lambda: cfg)
        _touch(cfg.proxy_dir / _img("a" * 16), b"img", stale=True)
        resp = TestClient(app).post("/api/gc")
        assert resp.status_code == 200
        body = resp.json()
        assert body["purged"] == 1
        assert body["freedBytes"] > 0
        assert body["remaining"] == 0
        assert body["scope"] == "proxy"

    def test_gc_invalid_ttl_returns_422(self) -> None:
        resp = TestClient(app).post("/api/gc", json={"ttlDays": 0})
        assert resp.status_code == 422

    def test_gc_dry_run_does_not_delete(self, tmp_path, monkeypatch) -> None:
        cfg = _cfg(tmp_path)
        import lava_backend.main as _main

        monkeypatch.setattr(_main, "get_config", lambda: cfg)
        _touch(cfg.proxy_dir / _img("a" * 16), b"img", stale=True)
        resp = TestClient(app).post("/api/gc", json={"dryRun": True})
        assert resp.status_code == 200
        assert resp.json()["purged"] == 1
        assert list(cfg.proxy_dir.iterdir())  # not deleted

    def test_gc_no_ttl_uses_config_default(self, tmp_path, monkeypatch) -> None:
        cfg = dataclasses.replace(_cfg(tmp_path), proxy_ttl_days=30)
        import lava_backend.main as _main

        monkeypatch.setattr(_main, "get_config", lambda: cfg)
        _touch(cfg.proxy_dir / _img("a" * 16), stale=True)  # 14 days old < 30
        resp = TestClient(app).post("/api/gc")
        assert resp.json()["purged"] == 0