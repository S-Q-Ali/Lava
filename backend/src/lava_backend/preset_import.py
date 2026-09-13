"""Preset import/export (M6 module 3).

Import accepts the `lava-preset` envelope (`{kind, version, preset}`) or a bare
preset dict. Imported presets are forced into the Custom category, ids must be
prefixed `custom-`, and an optional `licenseRef` must reference an existing
imported font (strict validation gate — D-022 deferred the check here).
Export emits the envelope so preset files are self-describing.
"""

from __future__ import annotations

import re
import uuid

from .preset_registry import Preset, PresetError, validate_preset

CUSTOM_ID_RE = re.compile(r"^custom-[0-9a-z\-]+$")


class PresetImportError(ValueError):
    """Raised when an imported preset fails validation."""


def _payload_to_preset_dict(raw: object) -> dict:
    if not isinstance(raw, dict):
        raise PresetImportError("Preset payload must be a JSON object.")
    if raw.get("kind") == "lava-preset":
        inner = raw.get("preset")
        if not isinstance(inner, dict):
            raise PresetImportError("lava-preset envelope must contain a 'preset' object.")
        return dict(inner)
    return dict(raw)


def import_preset_payload(raw: object, known_font_ids: set[str]) -> Preset:
    """Validate + normalise an imported preset payload.

    Forces category to Custom and enforces the custom- id prefix. `licenseRef`,
    when present, must name an id known to the font registry.
    """
    record = _payload_to_preset_dict(raw)
    try:
        record["category"] = "Custom"
        preset = validate_preset(record)
    except PresetError as exc:
        raise PresetImportError(str(exc)) from exc

    if not CUSTOM_ID_RE.fullmatch(preset.id):
        raise PresetImportError(
            "Imported preset ids must start with 'custom-' (lowercase, dashes allowed)."
        )
    if preset.licenseRef is not None and preset.licenseRef not in known_font_ids:
        raise PresetImportError(
            f"Preset references font '{preset.licenseRef}' which is not imported."
        )
    return preset


def preset_to_export_dict(preset: Preset) -> dict:
    return {"kind": "lava-preset", "version": 1, "preset": preset.__dict__}


def suggested_custom_id(label: str) -> str:
    """Deterministic-ish, unique-ish id from a label (import UI convenience)."""
    slug = re.sub(r"[^0-9a-z]+", "-", label.strip().lower()).strip("-")[:40]
    suffix = slug or str(uuid.uuid4().hex[:8])
    return f"custom-{suffix}"