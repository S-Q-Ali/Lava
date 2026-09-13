"""Render-time font license resolution.

Closes the M6 license-metadata row: fonts imported through the font-system
module carry {type, source, embeddingAllowed} and presets bind them via
licenseRef. Before caption burn-in, the renderer resolves every caption
style's font family against the fonts registry and refuses registry-backed
fonts whose license forbids embedding or whose file has gone missing —
no silent fallback from the render path. System (unregistered) font stacks
are outside the registry and always allowed.
"""

from dataclasses import dataclass
from pathlib import Path

from .captions import CaptionItemSpec

FONT_LICENSE_NOT_EMBEDDABLE = "FONT_LICENSE_NOT_EMBEDDABLE"
FONT_MISSING = "FONT_MISSING"


@dataclass(frozen=True)
class ResolvedRenderFont:
    """A registry-backed font the renderer is going to burn in."""

    family: str
    font_id: str
    license: dict


def resolve_render_font_licenses(
    caption_items: list[CaptionItemSpec],
    font_entries: list[dict],
    fonts_dir: Path,
) -> tuple[list[ResolvedRenderFont], list[dict]]:
    """Resolve caption styles against the fonts registry.

    Returns ``(used_fonts, violations)``. ``used_fonts`` lists each distinct
    registry-backed family used by the captions together with its license;
    ``violations`` lists blocking problems found for those fonts:
    ``FONT_LICENSE_NOT_EMBEDDABLE`` (the declared license forbids embedding)
    or ``FONT_MISSING`` (registered, but ``{id}.{ext}`` is absent from
    ``fonts_dir``). A family absent from the registry is a system stack and
    is allowed, silently — it carries no tracked license.
    """
    used_fonts: list[ResolvedRenderFont] = []
    violations: list[dict] = []

    seen_ids: set[str] = set()
    for item in caption_items:
        family = item.style.font_name
        entry = _match_registry(family, font_entries)
        if entry is None or entry["id"] in seen_ids:
            continue
        seen_ids.add(entry["id"])

        violation_code = _registry_violation(entry, fonts_dir)
        if violation_code is not None:
            violations.append(
                {
                    "code": violation_code,
                    "family": family,
                    "fontId": entry["id"],
                }
            )
            continue

        used_fonts.append(
            ResolvedRenderFont(
                family=family,
                font_id=entry["id"],
                license=entry["license"],
            )
        )

    return used_fonts, violations


def violation_message(violation: dict) -> str:
    """Human-readable, actionable message for a resolver violation."""
    family = violation.get("family", "?")
    code = violation.get("code")
    if code == FONT_LICENSE_NOT_EMBEDDABLE:
        return (
            f'Font "{family}" is licensed without embedding permission; '
            "re-import it with embedding allowed or switch the style to another font."
        )
    if code == FONT_MISSING:
        font_id = violation.get("fontId", "?")
        return (
            f'Font "{family}" ({font_id}) was imported but its file is missing; '
            "re-import the font or switch the style to another font."
        )
    return f'Font "{family}" cannot be used: {code}.'


def _match_registry(family: str, font_entries: list[dict]) -> dict | None:
    for entry in font_entries:
        if entry.get("family") == family:
            return entry
    return None


def _registry_violation(entry: dict, fonts_dir: Path) -> str | None:
    license_ = entry.get("license") or {}
    if license_.get("embeddingAllowed") is False:
        return FONT_LICENSE_NOT_EMBEDDABLE
    if not (fonts_dir / f"{entry.get('id')}.{entry.get('ext')}").is_file():
        return FONT_MISSING
    return None