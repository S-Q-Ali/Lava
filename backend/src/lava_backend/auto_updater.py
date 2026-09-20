"""Auto-Update — check GitHub releases for new versions.

Compares current version against latest GitHub release.
Provides download URL and changelog.
"""
from __future__ import annotations

import os
from typing import Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from .errors import ApiError

router = APIRouter(prefix="/update", tags=["update"])

CURRENT_VERSION = os.environ.get("LAVA_VERSION", "1.0.0-beta")

# Set this to your GitHub repo
GITHUB_REPO = os.environ.get("LAVA_GITHUB_REPO", "anomalyco/lava")


class UpdateInfo(BaseModel):
    current_version: str
    latest_version: str
    update_available: bool
    download_url: str = ""
    changelog: str = ""
    published_at: str = ""
    error: Optional[str] = None


@router.get("/check", response_model=UpdateInfo)
async def check_for_updates():
    """Check GitHub releases for a new version.

    Returns current vs latest version, download URL, and changelog.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest",
                headers={"Accept": "application/vnd.github.v3+json"},
            )

            if resp.status_code == 404:
                return UpdateInfo(
                    current_version=CURRENT_VERSION,
                    latest_version=CURRENT_VERSION,
                    update_available=False,
                    error="No releases found. Using development version.",
                )

            if resp.status_code != 200:
                return UpdateInfo(
                    current_version=CURRENT_VERSION,
                    latest_version=CURRENT_VERSION,
                    update_available=False,
                    error=f"GitHub API error: HTTP {resp.status_code}",
                )

            data = resp.json()
            latest = data.get("tag_name", "").lstrip("v")
            changelog = data.get("body", "")
            published = data.get("published_at", "")

            # Find download asset (exe or zip)
            download_url = ""
            for asset in data.get("assets", []):
                name = asset.get("name", "")
                if name.endswith(".exe") or name.endswith(".zip"):
                    download_url = asset.get("browser_download_url", "")
                    break

            # Compare versions
            update_available = _version_compare(latest, CURRENT_VERSION) > 0

            return UpdateInfo(
                current_version=CURRENT_VERSION,
                latest_version=latest or CURRENT_VERSION,
                update_available=update_available,
                download_url=download_url,
                changelog=changelog,
                published_at=published,
            )

    except httpx.RequestError:
        return UpdateInfo(
            current_version=CURRENT_VERSION,
            latest_version=CURRENT_VERSION,
            update_available=False,
            error="Network error. Check your internet connection.",
        )
    except Exception as exc:
        return UpdateInfo(
            current_version=CURRENT_VERSION,
            latest_version=CURRENT_VERSION,
            update_available=False,
            error=f"Update check failed: {exc}",
        )


def _version_compare(v1: str, v2: str) -> int:
    """Compare semver strings. Returns >0 if v1 > v2, <0 if v1 < v2, 0 if equal."""
    def parse(v: str) -> list[int]:
        parts = v.replace("-", ".").split(".")
        result = []
        for p in parts:
            try:
                result.append(int(p))
            except ValueError:
                result.append(0)
        return result

    a = parse(v1)
    b = parse(v2)

    for i in range(max(len(a), len(b))):
        ai = a[i] if i < len(a) else 0
        bi = b[i] if i < len(b) else 0
        if ai > bi:
            return 1
        if ai < bi:
            return -1
    return 0
