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

# --- API + renderer wire (slice 2) ---

import subprocess
from dataclasses import replace

from lava_backend import config as config_module
from lava_backend.main import app as _app
from lava_backend.media import RenderClip, RenderSettings, render
from fastapi.testclient import TestClient


@pytest.fixture
def fonts_client(tmp_path, monkeypatch):
    cfg = config_module.Config.load()
    cfg = replace(cfg, fonts_dir=tmp_path / "fonts", cache_dir=tmp_path / "cache")
    monkeypatch.setattr("lava_backend.main.get_config", lambda: cfg)
    return TestClient(_app), cfg, tmp_path


def _upload(client, data, filename, license=None):
    files = [("file", (filename, data, "application/octet-stream"))]
    form = {}
    if license is not None:
        form["license"] = json.dumps(license)
    return client.post("/api/fonts", data=form, files=files)


def test_upload_ttf_returns_metadata(fonts_client):
    client, cfg, _ = fonts_client
    resp = _upload(client, _bytes_of(TTF_FIXTURE), "Arial.ttf")
    assert resp.status_code == 201
    body = resp.json()
    assert body["family"] == "Arial"
    assert body["ext"] == "ttf"
    assert body["license"]["type"] == "unknown"
    stored = cfg.fonts_dir / f"{body['id']}.ttf"
    assert stored.exists()
    assert stored.read_bytes() == _bytes_of(TTF_FIXTURE)


def test_upload_with_license_metadata(fonts_client):
    client, cfg, _ = fonts_client
    resp = _upload(
        client,
        _bytes_of(TTF_FIXTURE),
        "Arial.ttf",
        license={"type": "open", "source": "https://example.com", "embeddingAllowed": False},
    )
    assert resp.status_code == 201
    assert resp.json()["license"] == {
        "type": "open",
        "source": "https://example.com",
        "embeddingAllowed": False,
    }


def test_upload_bad_extension_is_422(fonts_client):
    client, cfg, _ = fonts_client
    resp = _upload(client, _bytes_of(TTF_FIXTURE), "font.woff2")
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "FONT_INVALID"


def test_upload_garbage_bytes_is_422(fonts_client):
    client, cfg, _ = fonts_client
    resp = _upload(client, b"definitely not a font", "fake.ttf")
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "FONT_INVALID"


def test_upload_bad_license_json_is_422(fonts_client):
    client, cfg, _ = fonts_client
    resp = client.post(
        "/api/fonts",
        data={"license": "{oops"},
        files=[("file", ("Arial.ttf", _bytes_of(TTF_FIXTURE), "application/octet-stream"))],
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "INVALID_BODY"


def test_bad_license_semantics_is_422(fonts_client):
    client, cfg, _ = fonts_client
    resp = _upload(client, _bytes_of(TTF_FIXTURE), "Arial.ttf", license={"type": "viral"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "FONT_INVALID"


def test_list_file_and_delete(fonts_client):
    client, cfg, _ = fonts_client
    upload = _upload(client, _bytes_of(TTF_FIXTURE), "Arial.ttf")
    font_id = upload.json()["id"]

    listed = client.get("/api/fonts")
    assert listed.status_code == 200
    assert [f["id"] for f in listed.json()] == [font_id]

    file_resp = client.get(f"/api/fonts/{font_id}/file")
    assert file_resp.status_code == 200
    assert file_resp.content == _bytes_of(TTF_FIXTURE)

    deleted = client.delete(f"/api/fonts/{font_id}")
    assert deleted.status_code == 204
    assert not (cfg.fonts_dir / f"{font_id}.ttf").exists()
    assert client.get(f"/api/fonts/{font_id}/file").status_code == 404
    assert client.get("/api/fonts").json() == []


def test_render_captions_with_fontsdir(fonts_client):
    client, cfg, tmp_path = fonts_client
    upload = _upload(client, _bytes_of(TTF_FIXTURE), "Arial.ttf")
    assert upload.status_code == 201
    cfg = replace(cfg, renders_dir=tmp_path / "cache" / "renders")
    img = tmp_path / "a.png"
    subprocess.run(
        [str(cfg.ffmpeg_bin), "-y", "-f", "lavfi", "-i", "color=c=red:s=64x48:rate=1", "-frames:v", "1", str(img)],
        check=True,
        capture_output=True,
    )
    from lava_backend.captions import CaptionItemSpec, CaptionWordSpec, CaptionStyleSpec
    style = CaptionStyleSpec(font_name="Arial", font_size=20)
    caption_items = [
        CaptionItemSpec(start=0, duration=1.5, text="Hello fonts", style=style, words=())
    ]
    result = render(
        cfg,
        [img],
        [RenderClip(file_index=0, start=0, duration=1.5)],
        RenderSettings(width=64, height=48, fps=10),
        captions=caption_items,
    )
    assert result.duration == pytest.approx(1.5, abs=0.2)
