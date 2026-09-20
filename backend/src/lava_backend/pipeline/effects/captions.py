"""ASS subtitle generation for word-by-word captions."""
from __future__ import annotations
from typing import Any
from ..models.config import PipelineConfig

ASS_HEADER = """[Script Info]
Title: Lava Pipeline Captions
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{size}&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,{outline},2,{alignment},20,20,{margin_v},1
Style: Emphasis,{font},{size}&H00{emphasis_hex},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,{outline},2,{alignment},20,20,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def generate_ass(segments: list[dict[str, Any]], output_path: str, config: PipelineConfig, clip_start: float = 0.0) -> str:
    width, height = config.output_width, config.output_height
    alignment = {"center-bottom": 2, "center": 5, "top": 8}.get(config.caption_position, 2)
    margin_v = height // 8 if alignment == 2 else 20
    emphasis_hex = _color_to_ass(config.caption_emphasis_color)
    header = ASS_HEADER.format(width=width, height=height, font=config.caption_font, size=config.caption_size, emphasis_hex=emphasis_hex, alignment=alignment, margin_v=margin_v, outline=config.caption_outline_width)
    events = []
    for seg in segments:
        words = seg.get("words", [])
        if words:
            groups = [words[i:i+4] for i in range(0, len(words), 4)]
            for group in groups:
                gs = group[0]["start"] - clip_start
                ge = group[-1]["end"] - clip_start
                text = " ".join(w["word"] for w in group)
                if text and gs >= 0:
                    events.append(_fmt(gs, ge, text.strip(), "Default"))
        else:
            start = seg.get("start", 0) - clip_start
            end = seg.get("end", 0) - clip_start
            text = seg.get("text", "")
            if text and start >= 0:
                events.append(_fmt(start, end, text, "Default"))
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header)
        for e in events:
            f.write(e + "\n")
    return output_path


def _fmt(start: float, end: float, text: str, style: str) -> str:
    s, e = max(0, start), max(0, end)
    h1, m1 = divmod(int(s), 3600), int(s % 3600 // 60)
    h2, m2 = divmod(int(e), 3600), int(e % 3600 // 60)
    t1 = f"{h1//3600}:{m1//60:02d}:{int(s%60):02d}.{int((s%1)*100):02d}"
    t2 = f"{h2//3600}:{m2//60:02d}:{int(e%60):02d}.{int((e%1)*100):02d}"
    return f"Dialogue: 0,{t1},{t2},{style},,0,0,0,,{text}"


def _color_to_ass(hex_color: str) -> str:
    h = hex_color.lstrip("#")
    if len(h) != 6:
        return "00FFFFFF"
    return f"00{h[4:6]}{h[2:4]}{h[0:2]}".upper()
