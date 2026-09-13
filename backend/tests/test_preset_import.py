import pytest

from lava_backend.preset_import import (
    PresetImportError,
    import_preset_payload,
    preset_to_export_dict,
)
from lava_backend.preset_registry import Preset, validate_preset

MINIMAL = {
    "id": "custom-1",
    "label": "My preset",
    "description": "desc",
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

KNOWN_FONTS = {"font-abc123"}


def _envelope(preset: dict) -> dict:
    return {"kind": "lava-preset", "version": 1, "preset": preset}


def test_import_valid_envelope():
    preset = import_preset_payload(_envelope(MINIMAL), KNOWN_FONTS)
    assert preset.id == "custom-1"
    assert preset.category == "Custom"
    assert isinstance(preset, Preset)


def test_import_bare_preset_without_envelope():
    preset = import_preset_payload(MINIMAL, KNOWN_FONTS)
    assert preset.id == "custom-1"


def test_import_forces_custom_category():
    sent = {**MINIMAL, "category": "Meme"}
    preset = import_preset_payload(_envelope(sent), KNOWN_FONTS)
    assert preset.category == "Custom"


def test_import_requires_custom_prefix():
    bad = {**MINIMAL, "id": "normal"}
    with pytest.raises(PresetImportError):
        import_preset_payload(bad, KNOWN_FONTS)


def test_import_rejects_near_miss_prefix():
    bad = {**MINIMAL, "id": "customx-1"}
    with pytest.raises(PresetImportError):
        import_preset_payload(bad, KNOWN_FONTS)


def test_import_accepts_multipart_custom_id():
    sent = {**MINIMAL, "id": "custom-urdu-cinema-v1"}
    preset = import_preset_payload(sent, KNOWN_FONTS)
    assert preset.id == "custom-urdu-cinema-v1"


def test_import_rejects_unknown_license_ref():
    bad = {**MINIMAL, "licenseRef": "font-unknown"}
    with pytest.raises(PresetImportError) as exc_info:
        import_preset_payload(bad, KNOWN_FONTS)
    assert "font" in str(exc_info.value).lower()


def test_import_accepts_known_license_ref():
    sent = {**MINIMAL, "licenseRef": "font-abc123"}
    preset = import_preset_payload(sent, KNOWN_FONTS)
    assert preset.licenseRef == "font-abc123"


def test_import_rejects_garbage():
    for bad in (None, "x", 42, [], {"kind": "lava-preset", "preset": None}):
        with pytest.raises(PresetImportError):
            import_preset_payload(bad, KNOWN_FONTS)


def test_import_preserves_style_flags():
    sent = {**MINIMAL, "rtl": True, "karaoke": True, "tags": ["a", "b"], "presetVersion": "0.1.0"}
    preset = import_preset_payload(sent, KNOWN_FONTS)
    assert preset.rtl is True
    assert preset.karaoke is True
    assert preset.tags == ["a", "b"]
    assert preset.presetVersion == "0.1.0"


def test_export_has_envelope():
    preset = validate_preset(MINIMAL)
    data = preset_to_export_dict(preset)
    assert data["kind"] == "lava-preset"
    assert data["version"] == 1
    assert data["preset"]["id"] == "custom-1"


def test_export_round_trips_through_import():
    preset = validate_preset({**MINIMAL, "licenseRef": "font-abc123", "rtl": True})
    exported = preset_to_export_dict(preset)
    again = import_preset_payload(exported, KNOWN_FONTS)
    assert again.id == preset.id
    assert again.rtl is True
    assert again.licenseRef == "font-abc123"

# --- API (slice 2) ---

import json
from dataclasses import replace

from lava_backend import config as config_module
from lava_backend.main import app as _app
from fastapi.testclient import TestClient


@pytest.fixture
def import_client(tmp_path, monkeypatch):
    cfg = config_module.Config.load()
    cfg = replace(cfg, presets_dir=tmp_path / "presets", fonts_dir=tmp_path / "fonts", cache_dir=tmp_path / "cache")
    monkeypatch.setattr("lava_backend.main.get_config", lambda: cfg)
    return TestClient(_app), cfg


def test_post_creates_custom_preset(import_client):
    client, cfg = import_client
    resp = client.post("/api/presets", json=_envelope(MINIMAL))
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] == "custom-1"
    assert body["category"] == "Custom"
    listed = client.get("/api/presets").json()
    assert any(p["id"] == "custom-1" for p in listed)


def test_post_forces_custom_category(import_client):
    client, cfg = import_client
    sent = {**MINIMAL, "category": "Meme"}
    body = client.post("/api/presets", json=_envelope(sent)).json()
    assert body["category"] == "Custom"


def test_post_rejects_duplicate_id(import_client):
    client, cfg = import_client
    assert client.post("/api/presets", json=MINIMAL).status_code == 201
    dup = client.post("/api/presets", json=MINIMAL)
    assert dup.status_code == 422
    assert dup.json()["error"]["code"] == "PRESET_INVALID"


def test_post_rejects_without_custom_prefix(import_client):
    client, cfg = import_client
    resp = client.post("/api/presets", json={**MINIMAL, "id": "normal"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "PRESET_INVALID"


def test_post_rejects_unknown_license_ref(import_client):
    client, cfg = import_client
    resp = client.post("/api/presets", json={**MINIMAL, "licenseRef": "font-nope"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "PRESET_INVALID"


def test_post_accepts_known_font_ref_and_cross_checks(import_client):
    client, cfg = import_client
    from pathlib import Path
    arial = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
    if arial.exists():
        uploaded = client.post(
            "/api/fonts",
            files=[("file", ("Arial.ttf", arial.read_bytes(), "application/octet-stream"))],
        )
        assert uploaded.status_code == 201
        font_id = uploaded.json()["id"]
        resp = client.post("/api/presets", json={**MINIMAL, "licenseRef": font_id})
        assert resp.status_code == 201
        assert resp.json()["licenseRef"] == font_id


def test_post_rejects_malformed_json(import_client):
    client, cfg = import_client
    resp = client.post(
        "/api/presets",
        content="{broken",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "PRESET_INVALID"


def test_get_file_serves_preset_json(import_client):
    client, cfg = import_client
    client.post("/api/presets", json=MINIMAL)
    file_resp = client.get("/api/presets/custom-1/file")
    assert file_resp.status_code == 200
    assert file_resp.json()["kind"] == "lava-preset"


def test_get_file_missing_404(import_client):
    client, cfg = import_client
    assert client.get("/api/presets/nope/file").status_code == 404


def test_delete_custom_preset(import_client):
    client, cfg = import_client
    client.post("/api/presets", json=MINIMAL)
    resp = client.delete("/api/presets/custom-1")
    assert resp.status_code == 204
    listed = client.get("/api/presets").json()
    assert all(p["id"] != "custom-1" for p in listed)


def test_delete_builtin_is_forbidden(import_client):
    client, cfg = import_client
    resp = client.delete("/api/presets/karaoke")
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "BUILTIN_PRESET"


def test_delete_missing_404(import_client):
    client, cfg = import_client
    assert client.delete("/api/presets/custom-zzz").status_code == 404


def test_registry_persists_after_write(import_client):
    client, cfg = import_client
    client.post("/api/presets", json=MINIMAL)
    listed = client.get("/api/presets").json()
    assert any(p["id"] == "custom-1" for p in listed)
    # A second GET must still show it (persisted to registry file).
    assert any(p["id"] == "custom-1" for p in client.get("/api/presets").json())
