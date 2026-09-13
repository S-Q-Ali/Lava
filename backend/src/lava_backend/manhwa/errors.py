"""M7 Manhwa extractor — shared error type."""

from __future__ import annotations


class ManhwaError(Exception):
    """Actionable error for the manhwa/panel pipeline (model, registry, detection)."""