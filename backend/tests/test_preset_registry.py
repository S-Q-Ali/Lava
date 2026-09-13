import pytest

from lava_backend.errors import ApiError
from lava_backend.preset_registry import (
    BUILTIN_CATEGORIES,
    BUILTIN_PRESETS,
    PresetError,
    load_registry,
    save_registry,
    validate_preset,
)

BUILTIN_IDS = [p.id for p in BUILTIN_PRESETS]


def test_builtin_count():
    assert len(BUILTIN_PRESETS) == 15


def test_builtin_categories_count():
    assert len(BUILTIN_CATEGORIES) == 13


def test_all_builtins_have_valid_category():
    for preset in BUILTIN_PRESETS:
        assert preset.category in BUILTIN_CATEGORIES, f"{preset.id} has bad category"


def test_builtin_ids_unique():
    assert len(set(BUILTIN_IDS)) == len(BUILTIN_IDS)


def test_validate_accepts_valid_preset():
    valid = {
        "id": "test-1",
        "label": "Test",
        "description": "A test",
        "category": "Meme",
        "fontFamily": "Arial",
        "fontSize": 40,
        "primaryColor": "#FFFFFF",
        "highlightColor": "#000000",
        "outlineColor": "#111111",
        "outlineWidth": 1,
        "bold": False,
        "uppercase": False,
        "alignment": "bottom",
    }
    preset = validate_preset(valid)
    assert preset.id == "test-1"
    assert preset.category == "Meme"


def test_validate_rejects_invalid_category():
    bad = {
        "id": "x",
        "label": "X",
        "description": "x",
        "category": "viral",
        "fontFamily": "Arial",
        "fontSize": 40,
        "primaryColor": "#FFFFFF",
        "highlightColor": "#000000",
        "outlineColor": "#111111",
        "outlineWidth": 1,
        "bold": False,
        "uppercase": False,
        "alignment": "bottom",
    }
    with pytest.raises(PresetError):
        validate_preset(bad)


def test_validate_rejects_missing_required_fields():
    with pytest.raises(PresetError):
        validate_preset({"id": "x"})
    with pytest.raises(PresetError):
        validate_preset({"label": "x", "category": "Meme"})
    with pytest.raises(PresetError):
        validate_preset({"id": "x", "label": "x", "category": "Meme"})


def test_validate_rejects_non_object():
    with pytest.raises(PresetError):
        validate_preset(None)
    with pytest.raises(PresetError):
        validate_preset("string")


def test_validate_defaults_optional_fields():
    valid = {
        "id": "minimal",
        "label": "Minimal",
        "description": "min",
        "category": "Custom",
        "fontFamily": "Arial",
        "fontSize": 40,
        "primaryColor": "#FFFFFF",
        "highlightColor": "#000000",
        "outlineColor": "#111111",
        "outlineWidth": 1,
        "bold": False,
        "uppercase": False,
        "alignment": "bottom",
    }
    preset = validate_preset(valid)
    assert preset.rtl is False
    assert preset.tags == []
    assert preset.licenseRef is None
    assert preset.presetVersion is None
    assert preset.animation == "none"


def test_validate_accepts_valid_animation():
    valid = {
        "id": "test-1",
        "label": "Test",
        "description": "A test",
        "category": "Meme",
        "fontFamily": "Arial",
        "fontSize": 40,
        "primaryColor": "#FFFFFF",
        "highlightColor": "#000000",
        "outlineColor": "#111111",
        "outlineWidth": 1,
        "bold": False,
        "uppercase": False,
        "alignment": "bottom",
        "animation": "cinematic",
    }
    preset = validate_preset(valid)
    assert preset.animation == "cinematic"


def test_validate_rejects_invalid_animation():
    bad = {
        "id": "x",
        "label": "X",
        "description": "x",
        "category": "Custom",
        "fontFamily": "Arial",
        "fontSize": 40,
        "primaryColor": "#FFFFFF",
        "highlightColor": "#000000",
        "outlineColor": "#111111",
        "outlineWidth": 1,
        "bold": False,
        "uppercase": False,
        "alignment": "bottom",
        "animation": "fly-in",
    }
    with pytest.raises(PresetError):
        validate_preset(bad)


def test_registry_round_trip(tmp_path):
    registry = tmp_path / "registry.json"
    save_registry(registry, BUILTIN_PRESETS)
    loaded = load_registry(registry)
    assert len(loaded) == len(BUILTIN_PRESETS)
    assert [p.id for p in loaded] == BUILTIN_IDS


def test_load_missing_returns_builtins():
    loaded = load_registry("/tmp/nonexistent-preset-registry.json")
    assert len(loaded) == len(BUILTIN_PRESETS)


def test_load_corrupt_returns_builtins(tmp_path):
    registry = tmp_path / "corrupt.json"
    registry.write_text("not json")
    loaded = load_registry(registry)
    assert len(loaded) == len(BUILTIN_PRESETS)


# --- API (slice 2) ---

def test_api_lists_all_presets(client):
    resp = client.get("/api/presets")
    assert resp.status_code == 200
    presets = resp.json()
    assert len(presets) == 15
    ids = [p["id"] for p in presets]
    assert "normal" in ids and "karaoke" in ids and "urdu" in ids
    for preset in presets:
        assert preset["category"] in BUILTIN_CATEGORIES
        assert preset["fontSize"] > 0
