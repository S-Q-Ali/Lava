"""Cross-platform file system helpers."""

from __future__ import annotations

import os
import shutil
import stat
import time
from pathlib import Path


def rmtree_safe(path: Path, ignore_errors: bool = True) -> None:
    """Remove a directory tree, with Windows-friendly retry logic.

    On Windows, files may still be held open briefly after their handles are
    closed (e.g. by FFmpeg subprocesses).  This wrapper retries ``shutil.rmtree``
    a few times with short sleeps when ``PermissionError`` is raised.
    """
    for attempt in range(4):
        try:
            shutil.rmtree(path, ignore_errors=ignore_errors)
            return
        except PermissionError:
            if attempt < 3:
                time.sleep(0.1 * (attempt + 1))
            elif ignore_errors:
                return
            else:
                raise
