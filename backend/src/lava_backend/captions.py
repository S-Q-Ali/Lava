"""Pure ASS subtitle generation for caption burn-in (M5 caption-render).

The generator is intentionally side-effect free: it maps caption items (with a
resolved style) onto libass `.ass` document text. `media.py` writes the file and
appends the `ass` filter; only the wire validation lives in `main.py`.
"""

from __future__ import annotations

import html
from dataclasses import dataclass, field
from typing import Any


class CaptionError(ValueError):
    """Raised when caption items or their style are malformed."""


@dataclass(frozen=True)
class CaptionStyleSpec:
    font_name: str = "Arial"
    font_size: int = 42
    primary_color: str = "#FFFFFF"
    highlight_color: str = "#FFD54A"
    outline_color: str = "#000000"
    outline_width: float = 2
    bold: bool = False
    uppercase: bool = False
    alignment: str = "bottom"
    rtl: bool = False
    karaoke: bool = False

    @staticmethod
    def from_wire(raw: Any) -> "CaptionStyleSpec":
        if not isinstance(raw, dict):
            raise CaptionError("Caption style must be an object.")
        font_size = raw.get("fontSize")
        if not isinstance(font_size, (int, float)) or font_size <= 0:
            raise CaptionError("Caption style fontSize must be a positive number.")
        alignment = raw.get("alignment", "bottom")
        if alignment not in ("bottom", "middle", "top"):
            raise CaptionError("Caption style alignment must be bottom, middle or top.")
        outline_width = raw.get("outlineWidth", 2)
        if not isinstance(outline_width, (int, float)) or outline_width < 0:
            raise CaptionError("Caption style outlineWidth must be a non-negative number.")

        def color(value: Any, name: str) -> str:
            if not isinstance(value, str) or len(value) != 7 or not value.startswith("#"):
                raise CaptionError(f"Caption style {name} must be a #RRGGBB color.")
            return value

        return CaptionStyleSpec(
            font_name=str(raw.get("fontFamily", "Arial")),
            font_size=int(font_size),
            primary_color=color(raw.get("primaryColor", "#FFFFFF"), "primaryColor"),
            highlight_color=color(raw.get("highlightColor", "#FFD54A"), "highlightColor"),
            outline_color=color(raw.get("outlineColor", "#000000"), "outlineColor"),
            outline_width=float(outline_width),
            bold=bool(raw.get("bold", False)),
            uppercase=bool(raw.get("uppercase", False)),
            alignment=alignment,
            rtl=bool(raw.get("rtl", False)),
            karaoke=bool(raw.get("karaoke", False)),
        )


@dataclass(frozen=True)
class CaptionWordSpec:
    word: str
    start: float
    end: float


@dataclass(frozen=True)
class CaptionItemSpec:
    start: float
    duration: float
    text: str
    style: CaptionStyleSpec = field(default_factory=CaptionStyleSpec)
    words: tuple[CaptionWordSpec, ...] = ()

    @staticmethod
    def from_wire(raw: Any) -> "CaptionItemSpec":
        if not isinstance(raw, dict):
            raise CaptionError("Caption item must be an object.")
        start = raw.get("start")
        duration = raw.get("duration")
        text = raw.get("text")
        if not isinstance(start, (int, float)) or start < 0:
            raise CaptionError("Caption start must be a non-negative number.")
        if not isinstance(duration, (int, float)) or duration <= 0:
            raise CaptionError("Caption duration must be a positive number.")
        if not isinstance(text, str) or not text:
            raise CaptionError("Caption text must be a non-empty string.")
        style = CaptionStyleSpec.from_wire(raw.get("style", {}))
        words_raw = raw.get("words") or ()
        words: list[CaptionWordSpec] = []
        for word_raw in words_raw:
            if (
                not isinstance(word_raw, dict)
                or not isinstance(word_raw.get("word"), str)
                or not isinstance(word_raw.get("start"), (int, float))
                or not isinstance(word_raw.get("end"), (int, float))
            ):
                raise CaptionError("Caption words must carry word/start/end.")
            words.append(
                CaptionWordSpec(
                    word=str(word_raw["word"]),
                    start=float(word_raw["start"]),
                    end=float(word_raw["end"]),
                )
            )
        return CaptionItemSpec(
            start=float(start),
            duration=float(duration),
            text=text,
            style=style,
            words=tuple(words),
        )


_ALIGNMENT_BY_NAME = {"bottom": 2, "middle": 5, "top": 8}


def ass_time(seconds: float) -> str:
    """ASS timestamps: H:MM:SS.CS (centiseconds)."""
    total = max(0.0, seconds)
    hours = int(total // 3600)
    minutes = int((total % 3600) // 60)
    secs = int(total % 60)
    centis = int(round((total - int(total)) * 100))
    if centis == 100:
        centis = 99
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"


def ass_color(hex_color: str) -> str:
    """#RRGGBB → &HAABBGGRR with alpha 00 (opaque)."""
    red = int(hex_color[1:3], 16)
    green = int(hex_color[3:5], 16)
    blue = int(hex_color[5:7], 16)
    return f"&H00{blue:02X}{green:02X}{red:02X}"


def build_style_line(style: CaptionStyleSpec) -> str:
    return (
        "Style: Cap,{font},{size},{primary},{primary},{outline},{outline},"
        "0,0,0,0,100,100,0,0,{bold},{rtl},{align},2,10,10,10,1"
    ).format(
        font=style.font_name,
        size=style.font_size,
        primary=ass_color(style.primary_color),
        outline=ass_color(style.outline_color),
        bold=-1 if style.bold else 0,
        rtl=-1 if style.rtl else 0,
        align=_ALIGNMENT_BY_NAME[style.alignment],
    )


def _karaoke_text(item: CaptionItemSpec) -> str:
    parts: list[str] = []
    for word in item.words:
        centis = int(round(max(0.0, word.end - word.start) * 100))
        parts.append(f"{{\\k{max(1, centis)}}}{word.word}")
    return "".join(parts)


def _escape_text(text: str) -> str:
    return html.escape(text, quote=False).replace("\n", "\\N")


def build_dialogue_line(item: CaptionItemSpec) -> str:
    style = item.style
    text = item.text.upper() if style.uppercase else item.text
    if style.karaoke and item.words:
        text = _karaoke_text(item)
    text = _escape_text(text)
    if style.rtl:
        text = "{\\rtl}" + text
    start = ass_time(item.start)
    end = ass_time(item.start + item.duration)
    return f"Dialogue: 0,{start},{end},Cap,,0,0,0,,{text}"


def build_ass_document(items: list[CaptionItemSpec], width: int, height: int) -> str:
    if not items:
        raise CaptionError("Cannot build an ASS document without captions.")
    style = items[0].style
    header = (
        "[Script Info]\n"
        "; Generated by Lava\n"
        "ScriptType: v4.00+\n"
        f"PlayResX: {width}\n"
        f"PlayResY: {height}\n"
        "WrapStyle: 0\n"
        "\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
        "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"{build_style_line(style)},10,10,10,1\n"
        "\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    lines = [build_dialogue_line(item) for item in items]
    return header + "\n".join(lines) + "\n"


def parse_captions(raw: Any) -> list[CaptionItemSpec]:
    if not isinstance(raw, list):
        raise CaptionError("Captions must be an array.")
    items: list[CaptionItemSpec] = []
    for entry in raw:
        items.append(CaptionItemSpec.from_wire(entry))
    return items