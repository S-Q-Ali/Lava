"""Caption-preset registry (M6 module 2).

A preset is a shipped-or-user caption style plus category/tags/version/license
bindings on top of the M5 caption style model. Built-ins ship from code; the
registry file (presets/registry.json) may add user presets (module 3 import)
and allow category edits (e.g. updateable Trending) without code changes.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

BUILTIN_CATEGORIES: list[str] = [
    "Trending",
    "New",
    "Shorts",
    "Reels",
    "YouTube",
    "Anime",
    "Manhwa",
    "Storytelling",
    "Cinematic",
    "Motivation",
    "Meme",
    "Documentary",
    "Custom",
]

_CATEGORY_SET = set(BUILTIN_CATEGORIES)
_ALLOWED_ALIGNMENTS = ("bottom", "middle", "top")
_ANIMATION_SET = ("none", "kinetic", "manga", "cinematic", "meme", "storytelling")
_REQUIRED_STYLE_FIELDS = (
    "label",
    "description",
    "fontFamily",
    "fontSize",
    "primaryColor",
    "highlightColor",
    "outlineColor",
    "outlineWidth",
    "bold",
    "uppercase",
    "alignment",
)


class PresetError(ValueError):
    """Raised when a preset record is malformed."""


@dataclass(frozen=True)
class Preset:
    id: str
    label: str
    description: str
    category: str
    fontFamily: str
    fontSize: float
    primaryColor: str
    highlightColor: str
    outlineColor: str
    outlineWidth: float
    bold: bool
    uppercase: bool
    alignment: str
    rtl: bool = False
    emoji: bool = False
    karaoke: bool = False
    wordHighlight: bool = False
    importantWordPop: bool = False
    punctuation: bool = False
    animation: str = "none"
    presetVersion: str | None = None
    tags: list[str] = field(default_factory=list)
    licenseRef: str | None = None


def _require_string(record: dict, key: str) -> str:
    value = record.get(key)
    if not isinstance(value, str) or not value.strip():
        raise PresetError(f"Preset field '{key}' must be a non-empty string")
    return value.strip()


def _require_number(record: dict, key: str) -> float:
    value = record.get(key)
    if not isinstance(value, (int, float)):
        raise PresetError(f"Preset field '{key}' must be a number")
    return float(value)


def _require_bool(record: dict, key: str) -> bool:
    value = record.get(key)
    if not isinstance(value, bool):
        raise PresetError(f"Preset field '{key}' must be a boolean")
    return value


def validate_preset(raw: object) -> Preset:
    if not isinstance(raw, dict):
        raise PresetError("Preset must be a JSON object")
    for field_name in _REQUIRED_STYLE_FIELDS:
        if field_name not in raw:
            raise PresetError(f"Preset is missing required field '{field_name}'")

    id_value = _require_string(raw, "id")
    category = _require_string(raw, "category")
    if category not in _CATEGORY_SET:
        raise PresetError(f"Preset category must be one of: {', '.join(BUILTIN_CATEGORIES)}")
    alignment = _require_string(raw, "alignment")
    if alignment not in _ALLOWED_ALIGNMENTS:
        raise PresetError("Preset alignment must be bottom, middle or top")
    animation = raw.get("animation", "none")
    if animation not in _ANIMATION_SET:
        raise PresetError(
            "Preset animation must be one of: " + ", ".join(_ANIMATION_SET) + "."
        )

    tags = raw.get("tags", [])
    if not isinstance(tags, list) or not all(isinstance(t, str) for t in tags):
        raise PresetError("Preset tags must be an array of strings")
    license_ref = raw.get("licenseRef")
    if license_ref is not None and not isinstance(license_ref, str):
        raise PresetError("Preset licenseRef must be a string or null")
    version = raw.get("presetVersion")
    if version is not None and not isinstance(version, str):
        raise PresetError("Preset presetVersion must be a string or null")

    return Preset(
        id=id_value,
        label=_require_string(raw, "label"),
        description=_require_string(raw, "description"),
        category=category,
        fontFamily=_require_string(raw, "fontFamily"),
        fontSize=_require_number(raw, "fontSize"),
        primaryColor=_require_string(raw, "primaryColor"),
        highlightColor=_require_string(raw, "highlightColor"),
        outlineColor=_require_string(raw, "outlineColor"),
        outlineWidth=_require_number(raw, "outlineWidth"),
        bold=_require_bool(raw, "bold"),
        uppercase=_require_bool(raw, "uppercase"),
        alignment=alignment,
        rtl=bool(raw.get("rtl", False)),
        emoji=bool(raw.get("emoji", False)),
        karaoke=bool(raw.get("karaoke", False)),
        wordHighlight=bool(raw.get("wordHighlight", False)),
        importantWordPop=bool(raw.get("importantWordPop", False)),
        punctuation=bool(raw.get("punctuation", False)),
        animation=animation,
        presetVersion=version,
        tags=list(tags),
        licenseRef=license_ref,
    )


# --- Built-ins (the 15 originals, assigned categories per SPEC-preset-registry) ---

_SANS = "'Helvetica Neue', Arial, sans-serif"
_SERIF = "Georgia, 'Times New Roman', serif"
_IMPACT = "Impact, Haettenschweiler, Arial Black, sans-serif"
_URDU = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', serif"


def _preset(
    id: str,
    label: str,
    description: str,
    category: str,
    fontFamily: str,
    fontSize: float,
    primaryColor: str,
    highlightColor: str,
    outlineColor: str,
    outlineWidth: float,
    bold: bool = False,
    uppercase: bool = False,
    alignment: str = "bottom",
    **flags: bool,
) -> Preset:
    return Preset(
        id=id,
        label=label,
        description=description,
        category=category,
        fontFamily=fontFamily,
        fontSize=fontSize,
        primaryColor=primaryColor,
        highlightColor=highlightColor,
        outlineColor=outlineColor,
        outlineWidth=outlineWidth,
        bold=bold,
        uppercase=uppercase,
        alignment=alignment,
        **{k: bool(v) for k, v in flags.items()},
    )


BUILTIN_PRESETS: list[Preset] = [
    _preset("normal", "Normal subtitles", "Clean readable subtitles at the bottom — the default.", "Custom", _SANS, 42, "#FFFFFF", "#FFD54A", "#000000", 2),
    _preset("word-highlight", "Word highlight", "The spoken word is tinted as narration progresses.", "YouTube", _SANS, 44, "#FFFFFF", "#FFD54A", "#000000", 2, bold=True, wordHighlight=True),
    _preset("karaoke", "Karaoke", "Classic karaoke sweep across the line in time with speech.", "Shorts", _SANS, 44, "#FFFFFF", "#39D98A", "#000000", 2, bold=True, karaoke=True),
    _preset("important-word-pop", "Important-word pop", "Key words pop in the accent color; the rest stays calm.", "Reels", _SANS, 46, "#FFFFFF", "#FF5A5F", "#000000", 2, bold=True, importantWordPop=True),
    _preset("punctuation", "Punctuation emphasis", "Punctuation kept visible and emphasized for read-along pacing.", "Custom", _SANS, 42, "#FFFFFF", "#8AB4FF", "#000000", 2, punctuation=True),
    _preset("hook", "Hook", "Big top-centered opener for the first seconds of a video.", "YouTube", _IMPACT, 58, "#FFFFFF", "#FFD54A", "#000000", 3, bold=True, uppercase=True, alignment="top"),
    _preset("manga", "Manga / anime", "Sharp outlined comic-style line, middle-centered.", "Anime", _IMPACT, 48, "#FFFFFF", "#FF5A5F", "#1A1A1A", 3, bold=True, alignment="middle"),
    _preset("cinematic", "Cinematic", "Serif, letterboxed feel for calm narrative footage.", "Cinematic", _SERIF, 40, "#F5F1E6", "#D9B36C", "#000000", 1, alignment="bottom"),
    _preset("meme", "Meme", "Classic white-on-black meme caption, uppercase.", "Meme", _IMPACT, 54, "#FFFFFF", "#FFFFFF", "#000000", 3, bold=True, uppercase=True, alignment="bottom"),
    _preset("storytelling", "Storytelling", "Warm serif line for voice-over storytelling.", "Storytelling", _SERIF, 42, "#FFF6E5", "#E8A87C", "#2B1D0E", 2, alignment="bottom"),
    _preset("urdu", "Urdu", "Right-to-left Nastaliq line for Urdu narration.", "Custom", _URDU, 46, "#FFFFFF", "#FFD54A", "#000000", 2, rtl=True),
    _preset("roman-urdu", "Roman Urdu", "Left-to-right line tuned for Roman Urdu phrasing.", "Custom", _SANS, 42, "#FFFFFF", "#FFD54A", "#000000", 2),
    _preset("english", "English", "Neutral English subtitle preset.", "Custom", _SANS, 42, "#FFFFFF", "#8AB4FF", "#000000", 2),
    _preset("mixed", "Mixed language", "One line, any script — safe stack covers mixed narration.", "Custom", _SANS, 42, "#FFFFFF", "#FFD54A", "#000000", 2),
    _preset("emoji", "Emoji optional", "Subtitle preset that allows emoji when the transcript has them.", "Shorts", _SANS, 44, "#FFFFFF", "#FFD54A", "#000000", 2, emoji=True),
]

_BUILTIN_BY_ID = {p.id: p for p in BUILTIN_PRESETS}


def build_registry_entries(presets: list[Preset]) -> list[dict]:
    return [asdict(p) for p in presets]


def load_registry(path: Path | str) -> list[Preset]:
    """Load presets from the registry file; fall back to built-ins on any issue."""
    path = Path(path)
    if not path.exists():
        return list(BUILTIN_PRESETS)
    try:
        with path.open(encoding="utf-8") as fh:
            payload = json.load(fh)
        records = payload.get("presets") if isinstance(payload, dict) else payload
        if not isinstance(records, list):
            return list(BUILTIN_PRESETS)
        return [validate_preset(record) for record in records if isinstance(record, dict)]
    except (json.JSONDecodeError, OSError, PresetError):
        return list(BUILTIN_PRESETS)


def save_registry(path: Path | str, presets: list[Preset]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump({"version": 1, "presets": build_registry_entries(presets)}, fh, ensure_ascii=False, indent=2)


def merge_preset_layers(builtin: list[Preset], custom_files: list[list[Preset]]) -> list[Preset]:
    """Built-ins first (canonical ids), then custom records — custom wins on id collision."""
    merged: dict[str, Preset] = {p.id: p for p in builtin}
    for layer in custom_files:
        for preset in layer:
            merged[preset.id] = preset
    return list(merged.values())