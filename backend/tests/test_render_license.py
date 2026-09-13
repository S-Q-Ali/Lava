"""Render-time font license guard + render font manifest (module 6, slice 2)."""

import json
import subprocess
from dataclasses import replace
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from lava_backend import config as config_module
from lava_backend.fonts import save_registry
from lava_backend.main import app as _app


@pytest.fixture
def license_client(tmp_path, monkeypatch):
    cfg = config_module.Config.load()
    cfg = replace(
        cfg,
        presets_dir=tmp_path / "presets",
        fonts_dir=tmp_path / "fonts",
        cache_dir=tmp_path / "cache",
    )
    monkeypatch.setattr("lava_backend.main.get_config", lambda: cfg)
    return TestClient(_app), cfg


def make_image(tmp_path: Path, name: str = "img.png") -> Path:
    cfg = config_module.Config.load()
    out = tmp_path / name
    subprocess.run(
        [
            str(cfg.ffmpeg_bin), "-y",
            "-f", "lavfi",
            "-i", "color=c=blue:s=32x24:rate=1",
            "-frames:v", "1",
            str(out),
        ],
        check=True,
        capture_output=True,
    )
    assert out.exists()
    return out


CAPTION_STYLE = {
    "fontFamily": "Arial",
    "fontSize": 42,
    "primaryColor": "#FFFFFF",
    "highlightColor": "#FFD54A",
    "outlineColor": "#000000",
    "outlineWidth": 2,
    "bold": False,
    "uppercase": False,
    "alignment": "bottom",
}


def register_fonts(cfg, *entries) -> None:
    cfg.fonts_dir.mkdir(parents=True, exist_ok=True)
    save_registry(cfg.fonts_dir / "licenses.json", list(entries))


def font_entry(
    font_id: str,
    family: str,
    ext: str = "ttf",
    embedding: bool = True,
    source: str = "https://example.com/license",
) -> dict:
    return {
        "id": font_id,
        "family": family,
        "fileName": f"{family}.{ext}",
        "ext": ext,
        "license": {"type": "open", "source": source, "embeddingAllowed": embedding},
        "addedAt": "2026-01-01T00:00:00Z",
    }


def render_captions(client, cfg, tmp_path, captions, font_family="Arial"):
    img = make_image(tmp_path)
    style = {**CAPTION_STYLE, "fontFamily": font_family}
    return client.post(
        "/api/render",
        data={
            "clips": json.dumps([{"fileName": "img.png", "duration": 1.0}]),
            "settings": json.dumps({"width": 32, "height": 24, "fps": 10}),
            "captions": json.dumps(
                captions
                if captions
                else [{"start": 0.0, "duration": 1.0, "text": "Hello", "style": style}]
            ),
        },
        files=[("files", ("img.png", img.read_bytes(), "image/png"))],
    )


def test_render_without_captions_exposes_empty_fonts(license_client, tmp_path):
    client, cfg = license_client
    img = make_image(tmp_path)
    resp = client.post(
        "/api/render",
        data={
            "clips": json.dumps([{"fileName": "img.png", "duration": 1.0}]),
            "settings": json.dumps({"width": 32, "height": 24, "fps": 10}),
        },
        files=[("files", ("img.png", img.read_bytes(), "image/png"))],
    )
    assert resp.status_code == 201
    assert resp.json()["fonts"] == []


def test_render_system_stack_caption_is_201_with_empty_fonts(license_client, tmp_path):
    client, cfg = license_client
    resp = render_captions(client, cfg, tmp_path, None, font_family="Arial")
    assert resp.status_code == 201
    assert resp.json()["fonts"] == []


def test_render_embedding_restricted_import_is_422(license_client, tmp_path):
    client, cfg = license_client
    register_fonts(cfg, font_entry("font-aaa", "Brand Font", embedding=False))
    (cfg.fonts_dir / "font-aaa.ttf").write_bytes(b"\0" * 12)
    resp = render_captions(client, cfg, tmp_path, None, font_family="Brand Font")
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "FONT_LICENSE"
    assert "embedding" in resp.json()["error"]["message"].lower()


def test_render_registered_font_missing_file_is_422(license_client, tmp_path):
    client, cfg = license_client
    register_fonts(cfg, font_entry("font-aaa", "Brand Font"))
    resp = render_captions(client, cfg, tmp_path, None, font_family="Brand Font")
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "FONT_LICENSE"
    assert "missing" in resp.json()["error"]["message"].lower()


def test_render_allowed_import_lists_font_descriptor(license_client, tmp_path):
    client, cfg = license_client
    register_fonts(
        cfg,
        font_entry(
            "font-aaa",
            "Brand Font",
            embedding=True,
            source="https://vendor.example/eula",
        ),
    )
    (cfg.fonts_dir / "font-aaa.ttf").write_bytes(b"\0" * 12)
    resp = render_captions(client, cfg, tmp_path, None, font_family="Brand Font")
    assert resp.status_code == 201
    fonts = resp.json()["fonts"]
    assert fonts == [
        {
            "family": "Brand Font",
            "fontId": "font-aaa",
            "license": {
                "type": "open",
                "source": "https://vendor.example/eula",
                "embeddingAllowed": True,
            },
        }
    ]


def test_render_mixed_system_and_allowed_import(license_client, tmp_path):
    client, cfg = license_client
    register_fonts(cfg, font_entry("font-aaa", "Brand Font"))
    (cfg.fonts_dir / "font-aaa.ttf").write_bytes(b"\0" * 12)
    captions = [
        {
            "start": 0.0,
            "duration": 0.4,
            "text": "One",
            "style": {**CAPTION_STYLE, "fontFamily": "Arial"},
        },
        {
            "start": 0.6,
            "duration": 0.4,
            "text": "Two",
            "style": {**CAPTION_STYLE, "fontFamily": "Brand Font"},
        },
    ]
    resp = render_captions(client, cfg, tmp_path, captions)
    assert resp.status_code == 201
    assert [f["fontId"] for f in resp.json()["fonts"]] == ["font-aaa"]