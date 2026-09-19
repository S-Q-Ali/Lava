"""SRT and ASS caption generators with style support."""
from __future__ import annotations
from .styles import (
    CaptionWord, CaptionSegment, CaptionConfig, CaptionStyle, TextDirection,
)


def detect_direction(text: str) -> TextDirection:
    for char in text:
        cp = ord(char)
        if 0x0590 <= cp <= 0x08FF:
            return TextDirection.RTL
        if 0xFB1D <= cp <= 0xFDFD:
            return TextDirection.RTL
        if 0xFE70 <= cp <= 0xFEFF:
            return TextDirection.RTL
        if cp > 0x007F:
            continue
        break
    return TextDirection.LTR


def _format_time_srt(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _format_time_ass(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int((seconds % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def _color_to_ass(hex_color: str) -> str:
    h = hex_color.lstrip("#")
    if len(h) != 6:
        return "&H00FFFFFF"
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H00{b}{g}{r}".upper()


def _wrap_words(words: list, max_per_line: int) -> list:
    lines = []
    for i in range(0, len(words), max_per_line):
        lines.append(words[i:i + max_per_line])
    return lines


def _is_important(word: str, important_words: list) -> bool:
    w = word.lower().strip(".,!?;:\"'()-")
    return w in [iw.lower() for iw in important_words]


def generate_srt(segments: list, output_path: str) -> str:
    lines = []
    idx = 1
    for seg in segments:
        if not seg.words:
            continue
        wrapped = _wrap_words(seg.words, 4)
        for line_words in wrapped:
            start = line_words[0].start
            end = line_words[-1].end
            text = " ".join(w.text for w in line_words)
            if seg.direction == TextDirection.RTL:
                text = f"\u200f{text}"
            lines.append(str(idx))
            lines.append(f"{_format_time_srt(start)} --> {_format_time_srt(end)}")
            lines.append(text)
            lines.append("")
            idx += 1
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return output_path


def _format_time_vtt(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def generate_vtt(segments: list, output_path: str) -> str:
    """Generate WebVTT subtitle file."""
    lines = ["WEBVTT", ""]
    idx = 1
    for seg in segments:
        if not seg.words:
            continue
        wrapped = _wrap_words(seg.words, 4)
        for line_words in wrapped:
            start = line_words[0].start
            end = line_words[-1].end
            text = " ".join(w.text for w in line_words)
            if seg.direction == TextDirection.RTL:
                text = f"\u200f{text}"
            lines.append(str(idx))
            lines.append(f"{_format_time_vtt(start)} --> {_format_time_vtt(end)}")
            lines.append(text)
            lines.append("")
            idx += 1
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return output_path


def generate_vtt_from_captions(captions: list[dict]) -> str:
    """Generate VTT content from caption dicts (start, duration, text)."""
    lines = ["WEBVTT", ""]
    for i, cap in enumerate(captions, 1):
        start = cap.get("start", 0)
        duration = cap.get("duration", 1)
        text = cap.get("text", "")
        end = start + duration
        lines.append(str(i))
        lines.append(f"{_format_time_vtt(start)} --> {_format_time_vtt(end)}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


def generate_srt_from_captions(captions: list[dict]) -> str:
    """Generate SRT content from caption dicts (start, duration, text)."""
    lines = []
    for i, cap in enumerate(captions, 1):
        start = cap.get("start", 0)
        duration = cap.get("duration", 1)
        text = cap.get("text", "")
        end = start + duration
        lines.append(str(i))
        lines.append(f"{_format_time_srt(start)} --> {_format_time_srt(end)}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


def _make_ass_header(config, vw, vh):
    alignment = {"center-bottom": 2, "center": 5, "top": 8}.get(config.position, 2)
    mv = vh // 8 if alignment == 2 else 20
    p = _color_to_ass(config.primary_color)
    s = _color_to_ass(config.secondary_color)
    o = _color_to_ass(config.outline_color)
    hl = _color_to_ass(config.karaoke_highlight_color)
    return (
        "[Script Info]\nTitle: Lava Studio Captions\nScriptType: v4.00+\n"
        f"PlayResX: {vw}\nPlayResY: {vh}\nWrapStyle: 0\n\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
        "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Default,{config.font},{config.font_size}"
        f",{p},{s},{o},&H80000000,"
        f"-1,0,0,0,100,100,0,0,1,{config.outline_width},{config.shadow},"
        f"{alignment},20,20,{mv},1\n"
        f"Style: Emphasis,{config.font},{config.font_size}"
        f",{hl},{s},{o},&H80000000,"
        f"-1,0,0,0,100,100,0,0,1,{config.outline_width},{config.shadow},"
        f"{alignment},20,20,{mv},1\n\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )


def _fmt_dialogue(start, end, text, style="Default"):
    return f"Dialogue: 0,{_format_time_ass(start)},{_format_time_ass(end)},,,0,0,0,,{text}"


def _karaoke_events(seg, config, prefix):
    events = []
    for w in seg.words:
        dur_cs = int((w.end - w.start) * 100)
        if dur_cs <= 0:
            continue
        escaped = w.text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")
        text = f"{{\\kf{dur_cs}}}{prefix}{escaped}"
        events.append(_fmt_dialogue(w.start, w.end, text, "Default"))
    return events


def _kinetic_events(seg, config, prefix):
    events = []
    for i, w in enumerate(seg.words):
        escaped = w.text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")
        scale = int(100 + (config.kinetic_max_scale - 1.0) * 100) if i % 2 == 0 else 100
        text = f"{{\\fscx{scale}\\fscy{scale}\\fad(100,100)}}{prefix}{escaped}"
        events.append(_fmt_dialogue(w.start, w.end, text, "Default"))
    return events


def _meme_events(seg, config, prefix):
    words = seg.words
    wrapped = _wrap_words(words, config.max_words_per_line)
    events = []
    for line_words in wrapped:
        start = line_words[0].start
        end = line_words[-1].end
        text = " ".join(w.text for w in line_words)
        if config.meme_all_caps:
            text = text.upper()
        escaped = text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")
        escaped = f"{prefix}{escaped}"
        events.append(_fmt_dialogue(start, end, escaped, "Default"))
    return events


def _important_events(seg, config, prefix):
    events = []
    for w in seg.words:
        escaped = w.text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")
        if _is_important(w.text, config.important_words):
            ic = _color_to_ass(config.important_color)
            text = f"{{\\c{ic}\\b1}}{prefix}{escaped}"
            events.append(_fmt_dialogue(w.start, w.end, text, "Emphasis"))
        else:
            events.append(_fmt_dialogue(w.start, w.end, f"{prefix}{escaped}", "Default"))
    return events


def _normal_events(seg, config, prefix):
    words = seg.words
    wrapped = _wrap_words(words, config.max_words_per_line)
    events = []
    for line_words in wrapped:
        start = line_words[0].start
        end = line_words[-1].end
        text = " ".join(w.text for w in line_words)
        escaped = text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")
        events.append(_fmt_dialogue(start, end, f"{prefix}{escaped}", "Default"))
    return events


def _storytelling_events(seg, config, prefix):
    events = []
    for i, w in enumerate(seg.words):
        escaped = w.text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")
        fade_in = 150 if i == 0 else 50
        text = f"{{\\fad({fade_in},50)}}{prefix}{escaped}"
        events.append(_fmt_dialogue(w.start, w.end, text, "Default"))
    return events


def generate_ass(
    segments: list,
    output_path: str,
    config: CaptionConfig,
    video_width: int = 1920,
    video_height: int = 1080,
) -> str:
    header = _make_ass_header(config, video_width, video_height)
    events = []
    for seg in segments:
        if not seg.words:
            continue
        prefix = "\\RTL" if seg.direction == TextDirection.RTL else ""
        if config.style == CaptionStyle.KARAOKE:
            events.extend(_karaoke_events(seg, config, prefix))
        elif config.style == CaptionStyle.KINETIC:
            events.extend(_kinetic_events(seg, config, prefix))
        elif config.style == CaptionStyle.MEME:
            events.extend(_meme_events(seg, config, prefix))
        elif config.style == CaptionStyle.IMPORTANT_WORD:
            events.extend(_important_events(seg, config, prefix))
        elif config.style == CaptionStyle.STORYTELLING:
            events.extend(_storytelling_events(seg, config, prefix))
        else:
            events.extend(_normal_events(seg, config, prefix))
    with open(output_path, "w", encoding="utf-8-sig") as f:
        f.write(header)
        for e in events:
            f.write(e + "\n")
    return output_path
