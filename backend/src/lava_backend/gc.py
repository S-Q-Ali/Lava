"""Garbage collection for regenerable disk caches.

Only artifacts that are derived and reproducible are ever removed: content-hash
proxy files (``hash16.webp`` / ``hash16_proxy.mp4``). User uploads, manhwa
registries and renders are ground truth and are never touched by purge.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass
from pathlib import Path

from .config import Config

_PROXY_IMAGE_RE = re.compile(r"^[0-9a-f]{16}\.webp$")
_PROXY_VIDEO_RE = re.compile(r"^[0-9a-f]{16}_proxy\.mp4$")


@dataclass(frozen=True)
class GcReport:
    purged: int
    freedBytes: int
    remaining: int
    scope: str = "proxy"


def _proxy_files(proxy_dir: Path) -> list[Path]:
    """Proxy-labelled files only; stray files in the dir are never collected."""
    if not proxy_dir.is_dir():
        return []
    return [
        p
        for p in proxy_dir.iterdir()
        if p.is_file()
        and (_PROXY_IMAGE_RE.match(p.name) or _PROXY_VIDEO_RE.match(p.name))
    ]


def purge_stale_proxies(
    config: Config,
    *,
    ttl_days: int | None = None,
    dry_run: bool = False,
) -> GcReport:
    """Delete proxy files not accessed within `ttl_days` (default: config).

    Names not matching the content-hash proxy pattern are ignored. `dry_run`
    returns the report without removing anything.
    """
    ttl = config.proxy_ttl_days if ttl_days is None else ttl_days
    files = _proxy_files(config.proxy_dir)
    cutoff = time.time() - max(ttl, 0) * 86400
    stale = [p for p in files if p.stat().st_mtime < cutoff]
    freed = sum(p.stat().st_size for p in stale)
    if not dry_run:
        for path in stale:
            path.unlink()
    return GcReport(
        purged=len(stale),
        freedBytes=freed,
        remaining=len(files) - len(stale),
    )