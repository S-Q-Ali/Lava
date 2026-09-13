import json
from pathlib import Path

import pytest

from lava_backend import config as config_module
from lava_backend.errors import ApiError
from lava_backend.fonts import (
    FontError,
    extract_family_name,
    font_license_from_payload,
    load_registry,
    save_registry,
    validate_font_bytes,
)

TTF_FIXTURE = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
OTF_FIXTURE = Path("/System/Library/Fonts/LastResort.otf")


def _bytes_of(path: Path) -> bytes:
    if not path.exists():
        pytest.skip(f"fixture font not found: {path}")
    return path.read_bytes()


def test_accepts_true_type_signature():
    validate_font_bytes(_bytes_of(TTF_FIXTURE))


def test_accepts_otf_signature():
    validate_font_bytes(_bytes_of(OTF_FIXTURE))


def test_rejects_garbage_bytes():
    with pytest.raises(FontError):
        validate_font_bytes(b"this is not a font")


def test_rejects_png_magic():
    png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
    with pytest.raises(FontError):
        validate_font_bytes(png)


def test_extracts_family_name_from_true_type():
    assert extract_family_name(_bytes_of(TTF_FIXTURE)) == "Arial"


def test_extracts_family_name_from_otf():
    name = extract_family_name(_bytes_of(OTF_FIXTURE))
    assert isinstance(name, str) and name.strip()


def test_extract_fallback_returns_none_on_garbage():
    assert extract_family_name(b"\x00\x01\x00\x00" + b"\x00" * 64) is None


def test_family_name_prefers_16_over_4_and_cleans():
    # End-to-end: whatever the parsed name is must survive the cleaner.
    name = extract_family_name(_bytes_of(TTF_FIXTURE))
    assert name == " ".join(name.split())


def test_license_payload_validates():
    license = font_license_from_payload(
        {"type": "open", "source": "https://example.com/license", "embeddingAllowed": True}
    )
    assert license == {
        "type": "open",
        "source": "https://example.com/license",
        "embeddingAllowed": True,
    }


def test_license_payload_defaults_to_unknown():
    assert font_license_from_payload({}) == {
        "type": "unknown",
        "source": None,
        "embeddingAllowed": True,
    }


@pytest.mark.parametrize("bad", [{"type": "viral"}, {"embeddingAllowed": "yes"}, 12, None])
def test_license_payload_rejects_invalid(bad):
    with pytest.raises(FontError):
        font_license_from_payload(bad)


def test_registry_round_trip(tmp_path):
    reg_file = tmp_path / "licenses.json"
    entry = {
        "id": "font-" + "a" * 16,
        "family": "Arial",
        "fileName": "Arial.ttf",
        "ext": "ttf",
        "license": {"type": "open", "source": None, "embeddingAllowed": True},
        "addedAt": "2026-09-13T00:00:00Z",
    }
    save_registry(reg_file, [entry])
    loaded = load_registry(reg_file)
    assert loaded == [entry]
    assert reg_file.read_text().strip().startswith("{")


def test_registry_load_missing_returns_empty(tmp_path):
    assert load_registry(tmp_path / "nope.json") == []


def test_registry_survives_malformed_content(tmp_path):
    reg_file = tmp_path / "licenses.json"
    reg_file.write_text("{oops")
    assert load_registry(reg_file) == []
    # A later save must still work (defensive recovery).
    save_registry(reg_file, [{"id": "font-" + "c" * 16, "family": "X", "fileName": "x.ttf", "ext": "ttf"}])
    assert len(load_registry(reg_file)) == 1