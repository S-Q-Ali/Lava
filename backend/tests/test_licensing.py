"""Render-time font license resolution (module 6)."""

import json

import pytest

from lava_backend.captions import CaptionItemSpec
from lava_backend.licensing import (
    ResolvedRenderFont,
    resolve_render_font_licenses,
    violation_message,
)


def _caption(font_family: str) -> CaptionItemSpec:
    return CaptionItemSpec.from_wire({
        "start": 0.0,
        "duration": 1.0,
        "text": "Hello",
        "style": {"fontFamily": font_family, "fontSize": 42},
    })


def _caption_items(*families: str) -> list[object]:
    return [_caption(family) for family in families]


def _font_entry(
    font_id: str,
    family: str,
    ext: str = "ttf",
    license_type: str = "open",
    embedding: bool = True,
    source: str | None = "https://example.com/license",
) -> dict:
    return {
        "id": font_id,
        "family": family,
        "fileName": f"{family}.{ext}",
        "ext": ext,
        "license": {"type": license_type, "source": source, "embeddingAllowed": embedding},
        "addedAt": "2026-01-01T00:00:00Z",
    }


@pytest.fixture
def fonts_dir(tmp_path):
    return tmp_path


class TestResolveRenderFontLicenses:
    def test_empty_captions_yields_no_fonts_and_no_violations(self, fonts_dir):
        fonts, violations = resolve_render_font_licenses([], [], fonts_dir)
        assert fonts == []
        assert violations == []

    def test_system_stack_pass_family_not_in_registry(self, fonts_dir):
        fonts, violations = resolve_render_font_licenses(
            _caption_items("Arial", "Georgia"), [], fonts_dir
        )
        assert fonts == []
        assert violations == []

    def test_embedding_allowed_import_is_listed_as_descriptor(self, fonts_dir):
        (fonts_dir / "font-aaa.otf").write_bytes(b"\0" * 12)
        entries = [
            _font_entry("font-aaa", "Brand Font", ext="otf", license_type="commercial")
        ]
        fonts, violations = resolve_render_font_licenses(
            _caption_items("Brand Font"), entries, fonts_dir
        )
        assert violations == []
        assert fonts == [
            ResolvedRenderFont(
                family="Brand Font",
                font_id="font-aaa",
                license={"type": "commercial", "source": "https://example.com/license", "embeddingAllowed": True},
            )
        ]

    def test_embedding_restricted_import_is_a_violation(self, fonts_dir):
        entries = [
            _font_entry("font-aaa", "NoEmbed Font", license_type="personal", embedding=False)
        ]
        fonts, violations = resolve_render_font_licenses(
            _caption_items("NoEmbed Font"), entries, fonts_dir
        )
        assert fonts == []
        assert len(violations) == 1
        assert violations[0]["code"] == "FONT_LICENSE_NOT_EMBEDDABLE"
        assert violations[0]["family"] == "NoEmbed Font"
        assert "embed" in violation_message(violations[0]).lower()

    def test_registered_font_with_missing_file_is_a_violation(self, fonts_dir):
        entries = [_font_entry("font-aaa", "Ghost Font")]
        assert not (fonts_dir / "font-aaa.ttf").exists()
        fonts, violations = resolve_render_font_licenses(
            _caption_items("Ghost Font"), entries, fonts_dir
        )
        assert fonts == []
        assert len(violations) == 1
        assert violations[0]["code"] == "FONT_MISSING"
        assert violations[0]["family"] == "Ghost Font"
        assert "missing" in violation_message(violations[0])

    def test_present_file_avoids_missing_violation(self, fonts_dir):
        (fonts_dir / "font-aaa.ttf").write_bytes(b"\0" * 12)
        entries = [_font_entry("font-aaa", "Present Font")]
        fonts, violations = resolve_render_font_licenses(
            _caption_items("Present Font"), entries, fonts_dir
        )
        assert violations == []
        assert [f.family for f in fonts] == ["Present Font"]

    def test_dedups_family_across_captions(self, fonts_dir):
        (fonts_dir / "font-aaa.ttf").write_bytes(b"\0" * 12)
        entries = [_font_entry("font-aaa", "Brand Font")]
        fonts, violations = resolve_render_font_licenses(
            _caption_items("Brand Font", "Brand Font"), entries, fonts_dir
        )
        assert violations == []
        assert len(fonts) == 1
        assert fonts[0].font_id == "font-aaa"

    def test_mixed_system_and_import_fonts(self, fonts_dir):
        (fonts_dir / "font-aaa.ttf").write_bytes(b"\0" * 12)
        entries = [_font_entry("font-aaa", "Brand Font")]
        fonts, violations = resolve_render_font_licenses(
            _caption_items("Arial", "Brand Font"), entries, fonts_dir
        )
        assert violations == []
        assert [f.font_id for f in fonts] == ["font-aaa"]

    def test_first_family_match_wins(self, fonts_dir):
        (fonts_dir / "font-aaa.ttf").write_bytes(b"\0" * 12)
        (fonts_dir / "font-bbb.ttf").write_bytes(b"\0" * 12)
        entries = [_font_entry("font-aaa", "Dup Family"), _font_entry("font-bbb", "Dup Family")]
        fonts, violations = resolve_render_font_licenses(
            _caption_items("Dup Family"), entries, fonts_dir
        )
        assert violations == []
        assert [f.font_id for f in fonts] == ["font-aaa"]

    def test_empty_fonts_dir_reports_missing_file(self, fonts_dir):
        entries = [_font_entry("font-aaa", "Ghost Font")]
        _, violations = resolve_render_font_licenses(
            _caption_items("Ghost Font"), entries, fonts_dir
        )
        assert violations[0]["code"] == "FONT_MISSING"

    def test_missing_directory_path_does_not_crash(self, tmp_path):
        missing_dir = tmp_path / "does-not-exist"
        entries = [_font_entry("font-aaa", "Ghost Font")]
        _, violations = resolve_render_font_licenses(
            _caption_items("Ghost Font"), entries, missing_dir
        )
        assert violations[0]["code"] == "FONT_MISSING"


class TestLicenseDescriptorShape:
    def test_descriptor_is_json_serializable(self, fonts_dir):
        (fonts_dir / "font-aaa.ttf").write_bytes(b"\0" * 12)
        entries = [
            _font_entry(
                "font-aaa",
                "Brand Font",
                license_type="commercial",
                embedding=True,
                source="https://vendor.example/eula",
            )
        ]
        fonts, violations = resolve_render_font_licenses(
            _caption_items("Brand Font"), entries, fonts_dir
        )
        assert violations == []
        payload = {
            "fonts": [
                {"family": f.family, "fontId": f.font_id, "license": f.license}
                for f in fonts
            ]
        }
        encoded = json.dumps(payload)
        decoded = json.loads(encoded)
        assert decoded["fonts"][0] == {
            "family": "Brand Font",
            "fontId": "font-aaa",
            "license": {
                "type": "commercial",
                "source": "https://vendor.example/eula",
                "embeddingAllowed": True,
            },
        }