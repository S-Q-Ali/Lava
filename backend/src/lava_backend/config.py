"""Resolve Lava Studio project-local configuration and paths."""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

_EXE = ".exe" if sys.platform == "win32" else ""


def _find_repo_root(start: Path) -> Path:
    """Walk up from *start* to find the repo root (has .git directory)."""
    for parent in [start, *start.parents]:
        if (parent / ".git").is_dir():
            return parent
    # Fallback: original assumption (4 levels up from config.py)
    return start.parents[3]


REPO_ROOT = _find_repo_root(Path(__file__).resolve().parent)
CONFIG_PATH = REPO_ROOT / "studio.config.json"


def _payload() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    with CONFIG_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


def _resolve_binary(root: Path, rel_dir: str, name: str) -> Path:
    """Resolve a binary path, trying .exe suffix on Windows."""
    base = root / rel_dir
    # Try exact name first (works on Unix, and on Windows if no .exe)
    candidate = base / name
    if candidate.exists():
        return candidate
    # Try with .exe (Windows)
    if _EXE:
        candidate = base / (name + _EXE)
        if candidate.exists():
            return candidate
    # Return default (will fail gracefully later)
    return base / (name + _EXE)


@dataclass(frozen=True)
class Config:
    root: Path
    backend_dir: Path
    ffmpeg_bin: Path
    ffprobe_bin: Path
    host: str
    port: int
    cache_dir: Path
    uploads_dir: Path
    renders_dir: Path
    proxy_dir: Path
    models_dir: Path
    clip_dir: Path
    clip_multilingual_dir: Path
    fonts_dir: Path
    presets_dir: Path
    max_renders: int = 12
    render_timeout_seconds: int = 600
    proxy_ttl_days: int = 7
    motion_upscale_factor: int = 3

    @classmethod
    def load(cls) -> "Config":
        payload = _payload()
        root = REPO_ROOT

        ffmpeg_rel = payload.get("ffmpeg", {}).get("bin", "tools/ffmpeg/bin")
        backend = payload.get("backend", {})
        host = backend.get("host", "127.0.0.1")
        port = int(backend.get("port", 7860))
        render = payload.get("render", {})
        render_timeout_seconds = int(render.get("timeoutSeconds", 600))
        gc = payload.get("gc", {})
        proxy_ttl_days = int(gc.get("proxyTtlDays", 7))
        motion = payload.get("motion", {})
        motion_upscale_factor = int(motion.get("upscaleFactor", 3))
        if not (1 <= motion_upscale_factor <= 8):
            raise ValueError("motion.upscaleFactor must be an integer in 1..8")

        cache = root / "cache" / "backend"
        return cls(
            root=root,
            backend_dir=root / "backend",
            ffmpeg_bin=_resolve_binary(root, ffmpeg_rel, "ffmpeg"),
            ffprobe_bin=_resolve_binary(root, ffmpeg_rel, "ffprobe"),
            host=host,
            port=port,
            cache_dir=cache,
            uploads_dir=cache / "uploads",
            renders_dir=cache / "renders",
            proxy_dir=cache / "proxy",
            models_dir=root / "models" / "whisper",
            clip_dir=root / "models" / "clip",
            clip_multilingual_dir=root / "models" / "clip-multilingual",
            fonts_dir=root / "fonts",
            presets_dir=root / "presets",
            render_timeout_seconds=render_timeout_seconds,
            proxy_ttl_days=proxy_ttl_days,
            motion_upscale_factor=motion_upscale_factor,
        )


_config: Config | None = None


def get_config() -> Config:
    global _config
    if _config is None:
        _config = Config.load()
    return _config


def reset_config() -> None:
    global _config
    _config = None


@dataclass
class ToolVersions:
    ffmpeg: str | None = None
    ffprobe: str | None = None
    error: str | None = None


def tool_versions(config: Config) -> ToolVersions:
    result = ToolVersions()
    for attr in ("ffmpeg", "ffprobe"):
        binary = getattr(config, f"{attr}_bin")
        if not binary.exists() or not binary.is_file():
            result.error = f"{binary} not found"
            return result
        try:
            import subprocess

            raw = subprocess.run(
                [str(binary), "-version"],
                capture_output=True,
                text=True,
                timeout=10,
            ).stdout
            result.__setattr__(attr, raw.splitlines()[0].split(" ")[2].lstrip("v"))
        except Exception as exc:  # pragma: no cover - defensive
            result.error = f"{attr} failed: {exc}"
            return result
    return result
