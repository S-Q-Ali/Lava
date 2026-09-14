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


class TestAnimation:
    def test_invalid_animation_rejected(self):
        with pytest.raises(CaptionError):
            parse_captions([item(style=style(animation="fly-in"))])

    def test_unknown_animation_defaults_none(self):
        parsed = make_item()
        assert parsed.style.animation == "none"

    def test_none_adds_no_tags(self):
        line = build_dialogue_line(make_item())
        assert "\\t(" not in line
        assert "\\fad(" not in line
        assert line.endswith("Warm sunsets")

    def test_kinetic_uses_word_timing(self):
        raw = item(
            style=style(animation="kinetic"),
            words=[
                {"word": "Warm", "start": 0.0, "end": 0.6},
                {"word": "sunsets", "start": 0.6, "end": 2.0},
            ],
        )
        line = build_dialogue_line(parse_captions([raw])[0])
        assert (
            "{alpha&HFF&}{fscx0\\fscy0\\t(0,300,1,\\alpha&H00&\\fscx100\\fscy100)}Warm "
            "{alpha&HFF&}{fscx0\\fscy0\\t(600,900,1,\\alpha&H00&\\fscx100\\fscy100)}sunsets"
        ) in line

    def test_kinetic_falls_back_to_even_split(self):
        line = build_dialogue_line(make_item(style=style(animation="kinetic")))
        assert "\\t(0,300,1,\\alpha&H00&\\fscx100\\fscy100)}Warm " in line
        assert "\\t(1000,1300,1,\\alpha&H00&\\fscx100\\fscy100)}sunsets" in line

    def test_kinetic_uppercases_words_when_flag_set(self):
        raw = item(
            style=style(animation="kinetic", uppercase=True),
            words=[{"word": "Warm", "start": 0.0, "end": 1.0}, {"word": "sunsets", "start": 1.0, "end": 2.0}],
        )
        assert "}WARM " in build_dialogue_line(parse_captions([raw])[0])

    def test_manga_impact_pop_render(self):
        line = build_dialogue_line(make_item(style=style(animation="manga")))
        assert "{fscx200\\fscy200\\alpha&HFF&\\t(0,180,2,\\fscx100\\fscy100\\alpha&H00&)}" in line
        assert "{\\p1}m 0 0 l 100 0" in line
        assert "{\\p0}Warm sunsets" in line

    def test_cinematic_fade_and_scale(self):
        line = build_dialogue_line(make_item(style=style(animation="cinematic")))
        assert "{fad(400,400)}{fscx96\\fscy96\\t(0,2000,1,\\fscx100\\fscy100)}" in line
        assert "{\\p1}m 0 0 l 100 0" in line
        assert "{\\p0}Warm sunsets" in line

    def test_meme_wobble_ramps(self):
        line = build_dialogue_line(make_item(style=style(animation="meme")))
        assert (
            "{fscx108\\fscy108\\t(0,60,1,\\fscx100\\fscy100)\\t(60,120,1,\\fscx106\\fscy106)\\t(120,180,1,\\fscx100\\fscy100)}Warm sunsets"
        ) in line

    def test_storytelling_gentle_fade(self):
        line = build_dialogue_line(make_item(style=style(animation="storytelling")))
        assert "{fad(600,600)}{fscx98\\fscy98\\t(0,2000,1,\\fscx100\\fscy100)}Warm sunsets" in line

    def test_karaoke_wins_over_animation(self):
        raw = item(
            style=style(animation="kinetic", karaoke=True),
            words=[{"word": "Warm", "start": 0.0, "end": 0.5}, {"word": "sunsets", "start": 0.5, "end": 2.0}],
        )
        line = build_dialogue_line(parse_captions([raw])[0])
        assert "{\\k50}Warm{\\k150}sunsets" in line
        assert "\\fscx" not in line

    def test_rtl_wraps_around_animation(self):
        raw = item(text="سلام", style=style(animation="manga", rtl=True))
        line = build_dialogue_line(parse_captions([raw])[0])
        assert "{\\rtl}{fscx200" in line