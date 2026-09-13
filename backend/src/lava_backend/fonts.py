"""Pure font handling for the M6 font-system module (no external deps).

Responsible for: binary validation (extension + SFNT magic are checked by the
view layer too, but signature checks here), extracting the real family name from
a font's name table (best-effort; falls back through nameID 16 → 1 → 4), and the
JSON license/registry format stored under fonts/.

Everything is side-effect free except load/save of the registry file.
"""

from __future__ import annotations

import json
import re
import struct
from pathlib import Path

SFNT_SIGNATURES = {b"\x00\x01\x00\x00", b"OTTO", b"true", b"ttcf"}
_ALLOWED_EXTENSIONS = {".ttf", ".otf"}
_NAME_ID_ORDER = (16, 1, 4)
FONT_FAMILY_RE = re.compile(r"[^\w \-]+")
FONT_ID_RE = re.compile(r"^font-[0-9a-f]{32}$")


class FontError(ValueError):
    """Raised when a font file or its metadata is invalid."""


def has_font_signature(data: bytes) -> bool:
    return len(data) >= 4 and data[:4] in SFNT_SIGNATURES


def validate_font_bytes(data: bytes) -> None:
    if not has_font_signature(data):
        raise FontError("Not a valid TTF/OTF font (SFNT signature missing).")
    if len(data) < 12:
        raise FontError("Font file is too small to be valid.")


def is_allowed_font_name(filename: str) -> bool:
    low = filename.lower()
    return low.endswith(tuple(_ALLOWED_EXTENSIONS))


def _u16(data: bytes, offset: int) -> int:
    value = struct.unpack_from(">H", data, offset)[0]
    return value


def _u32(data: bytes, offset: int) -> int:
    return struct.unpack_from(">I", data, offset)[0]


def _candidate_names(data: bytes) -> list[tuple[int, str]]:
    """Collect (nameID, decoded string) candidates from the name table."""
    if len(data) < 12:
        return []
    num_tables = _u16(data, 4)
    # SFNT table directory: 16 bytes per record starting at offset 12.
    for idx in range(num_tables):
        rec_off = 12 + idx * 16
        if rec_off + 16 > len(data):
            break
        tag = data[rec_off : rec_off + 4]
        if tag != b"name":
            continue
        table_off = _u32(data, rec_off + 8)
        table_len = _u32(data, rec_off + 12)
        if table_off + table_len > len(data):
            continue
        return _read_name_records(data[table_off : table_off + table_len])
    return []


def _read_name_records(table: bytes) -> list[tuple[int, str]]:
    if len(table) < 6:
        return []
    count = _u16(table, 2)
    str_off = _u16(table, 4)
    results: list[tuple[int, str]] = []
    for idx in range(count):
        rec = 6 + idx * 12
        if rec + 12 > len(table):
            break
        platform = _u16(table, rec)
        encoding = _u16(table, rec + 2)
        language = _u16(table, rec + 4)
        name_id = _u16(table, rec + 6)
        length = _u16(table, rec + 8)
        offset = _u16(table, rec + 10)
        start = str_off + offset
        if start + length > len(table):
            continue
        raw = table[start : start + length]
        decoded = _decode_name(raw, platform, encoding, language)
        if decoded and name_id in _NAME_ID_ORDER:
            results.append((name_id, decoded))
    return results


def _decode_name(raw: bytes, platform: int, encoding: int, language: int) -> str:
    """Decode a name-table string to Unicode with a platform-aware best effort."""
    try:
        if platform == 3 and encoding in (0, 1):
            text = raw.decode("utf-16-be")
        elif platform == 0 and encoding in (0, 3):
            text = raw.decode("utf-16-be")
        elif platform == 1 and language == 0:
            text = raw.decode("mac_roman")
        elif platform == 3 or platform == 0:
            text = raw.decode("utf-16-be")
        else:
            text = raw.decode("latin-1")
    except (UnicodeDecodeError, ValueError):
        text = raw.decode("latin-1", errors="replace")
    return text.strip("\x00 \t\r\n").strip()


def clean_family_name(name: str) -> str:
    cleaned = FONT_FAMILY_RE.sub(" ", name)
    collapsed = " ".join(cleaned.split())
    return collapsed[:100]


def extract_family_name(data: bytes) -> str | None:
    """Best-effort family name from the SFNT name table.

    Prefers typographic family name (16), then family (1), then full name (4),
    and among duplicates the Windows/Unicode English entries. Requires a valid
    SFNT signature up front so garbage input still returns None.
    """
    if not has_font_signature(data) or len(data) < 12:
        return None
    candidates = _candidate_names(data)
    for name_id in _NAME_ID_ORDER:
        for candidate_id, text in candidates:
            if candidate_id == name_id and text:
                return clean_family_name(text)
    return None


_LICENSE_TYPES = ("open", "commercial", "personal", "unknown")


def font_license_from_payload(raw: object) -> dict:
    """Normalise the wire license fields; raises FontError when malformed."""
    if not isinstance(raw, dict):
        raise FontError("Font license must be an object.")
    license_type = raw.get("type", "unknown")
    if license_type not in _LICENSE_TYPES:
        raise FontError(f"Font license type must be one of: {', '.join(_LICENSE_TYPES)}")
    source = raw.get("source")
    if source is not None and not isinstance(source, str):
        raise FontError("Font license source must be a string.")
    embedding = raw.get("embeddingAllowed", True)
    if not isinstance(embedding, bool):
        raise FontError("Font embeddingAllowed must be a boolean.")
    return {
        "type": license_type,
        "source": source,
        "embeddingAllowed": embedding,
    }


def make_font_metadata(
    font_id: str,
    family: str,
    filename: str,
    license_payload: dict,
    added_at: str,
) -> dict:
    ext = Path(filename).suffix.lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise FontError("Only .ttf and .otf fonts can be imported.")
    return {
        "id": font_id,
        "family": clean_family_name(family),
        "fileName": filename,
        "ext": ext,
        "license": font_license_from_payload(license_payload),
        "addedAt": added_at,
    }


def save_registry(path: Path, fonts: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump({"version": 1, "fonts": fonts}, fh, ensure_ascii=False, indent=2)


def load_registry(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        with path.open(encoding="utf-8") as fh:
            payload = json.load(fh)
        fonts = payload.get("fonts")
        if isinstance(fonts, list):
            return fonts
    except (json.JSONDecodeError, OSError, AttributeError):
        return []
    return []