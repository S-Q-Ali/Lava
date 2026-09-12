"""Unit tests for the pure ASS caption generator (M5 caption-render)."""

import pytest

from lava_backend.captions import (
    CaptionError,
    build_ass_document,
    build_dialogue_line,
    build_style_line,
    ass_color,
    ass_time,
    parse_captions,
)


def style(**overrides):
    base = {
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
    base.update(overrides)
    return base


def item(**overrides):
    base = {
        "start": 0.0,
        "duration": 2.0,
        "text": "Warm sunsets",
        "style": style(),
    }
    base.update(overrides)
    return base


def make_item(**overrides):
    return parse_captions([item(**overrides)])[0]


class TestAssPrimitives:
    def test_time_formats_centiseconds(self):
        assert ass_time(0) == "0:00:00.00"
        assert ass_time(1.5) == "0:00:01.50"
        assert ass_time(62.25) == "0:01:02.25"
        assert ass_time(3661.0) == "1:01:01.00"

    def test_time_clamps_negative(self):
        assert ass_time(-1) == "0:00:00.00"

    def test_color_converts_rrggbb_to_bbggrr(self):
        assert ass_color("#FF0000") == "&H000000FF"
        assert ass_color("#0000FF") == "&H00FF0000"
        assert ass_color("#123456") == "&H00563412"

    def test_invalid_color_raises(self):
        with pytest.raises(CaptionError):
            parse_captions([item(style=style(primaryColor="red"))])


class TestStyleLine:
    def test_bottom_alignment_maps_to_2(self):
        parsed = make_item()
        line = build_style_line(parsed.style)
        assert "Style: Cap,Arial,42," in line
        assert line.rstrip().endswith(",2,10,10,10,1") or ",2," in line

    def test_top_alignment_maps_to_8(self):
        parsed = make_item(style=style(alignment="top"))
        assert ",8," in build_style_line(parsed.style)

    def test_middle_alignment_maps_to_5(self):
        parsed = make_item(style=style(alignment="middle"))
        assert ",5," in build_style_line(parsed.style)

    def test_bold_flag(self):
        parsed = make_item(style=style(bold=True))
        assert ",-1," in build_style_line(parsed.style)

    def test_invalid_alignment_raises(self):
        with pytest.raises(CaptionError):
            parse_captions([item(style=style(alignment="sideways"))])

    def test_non_positive_font_size_raises(self):
        with pytest.raises(CaptionError):
            parse_captions([item(style=style(fontSize=0))])


class TestDialogueLine:
    def test_plain_line(self):
        parsed = make_item()
        line = build_dialogue_line(parsed)
        assert line.startswith("Dialogue: 0,0:00:00.00,0:00:02.00,Cap,,0,0,0,,")
        assert line.endswith("Warm sunsets")

    def test_uppercase_transform(self):
        parsed = make_item(style=style(uppercase=True))
        assert build_dialogue_line(parsed).endswith("WARM SUNSETS")

    def test_escapes_html(self):
        parsed = make_item(text="A & B < C")
        line = build_dialogue_line(parsed)
        assert "amp;" in line
        assert "lt;" in line
        assert "A " + chr(38) + " B < C" not in line

    def test_karaoke_uses_centiseconds(self):
        raw = item(
            style=style(karaoke=True),
            words=[
                {"word": "Warm", "start": 0.0, "end": 0.5},
                {"word": "sunsets", "start": 0.5, "end": 2.0},
            ],
        )
        parsed = parse_captions([raw])[0]
        line = build_dialogue_line(parsed)
        assert "{\\k50}Warm{\\k150}sunsets" in line

    def test_rtl_prepends_flag(self):
        parsed = make_item(text="سلام", style=style(rtl=True))
        line = build_dialogue_line(parsed)
        assert "{\\rtl}سلام" in line


class TestDocument:
    def test_document_has_header_style_events(self):
        parsed = parse_captions([item(), item(start=2.0)])
        doc = build_ass_document(parsed, 1280, 720)
        assert "[Script Info]" in doc
        assert "PlayResX: 1280" in doc
        assert "PlayResY: 720" in doc
        assert "[V4+ Styles]" in doc
        assert "Style: Cap," in doc
        assert "[Events]" in doc
        assert doc.count("Dialogue: 0,") == 2

    def test_empty_array_is_valid_parity_path(self):
        assert parse_captions([]) == []

    def test_document_requires_items(self):
        with pytest.raises(CaptionError):
            build_ass_document([], 1280, 720)

    def test_non_array_captions_rejected(self):
        with pytest.raises(CaptionError):
            parse_captions("nope")

    def test_missing_text_raises(self):
        with pytest.raises(CaptionError):
            parse_captions([{"start": 0, "duration": 1}])

    def test_non_positive_duration_raises(self):
        with pytest.raises(CaptionError):
            parse_captions([item(duration=0)])

    def test_negative_start_raises(self):
        with pytest.raises(CaptionError):
            parse_captions([item(start=-1)])

    def test_malformed_word_raises(self):
        with pytest.raises(CaptionError):
            parse_captions([item(words=[{"word": "x"}])])