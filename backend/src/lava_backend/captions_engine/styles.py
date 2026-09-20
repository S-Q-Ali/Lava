"""Caption data models and configuration."""
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum


class CaptionStyle(str, Enum):
    NORMAL = "normal"
    KARAOKE = "karaoke"
    KINETIC = "kinetic"
    MEME = "meme"
    STORYTELLING = "storytelling"
    IMPORTANT_WORD = "important_word"


class TextDirection(str, Enum):
    LTR = "ltr"
    RTL = "rtl"


@dataclass
class CaptionWord:
    text: str
    start: float
    end: float
    confidence: float = 1.0


@dataclass
class CaptionSegment:
    words: list[CaptionWord] = field(default_factory=list)
    text: str = ""
    direction: TextDirection = TextDirection.LTR

    def __post_init__(self):
        if not self.text and self.words:
            self.text = " ".join(w.text for w in self.words)

    @property
    def start(self) -> float:
        return self.words[0].start if self.words else 0.0

    @property
    def end(self) -> float:
        return self.words[-1].end if self.words else 0.0


@dataclass
class CaptionConfig:
    style: CaptionStyle = CaptionStyle.NORMAL
    font: str = "Arial"
    font_size: int = 48
    primary_color: str = "#FFFFFF"
    secondary_color: str = "#5b8def"
    outline_color: str = "#000000"
    outline_width: int = 2
    shadow: int = 1
    position: str = "center-bottom"
    max_words_per_line: int = 4
    direction: TextDirection = TextDirection.LTR
    karaoke_pop_scale: float = 1.3
    karaoke_highlight_color: str = "#5b8def"
    kinetic_max_scale: float = 1.5
    meme_font: str = "Impact"
    meme_all_caps: bool = True
    important_words: list[str] = field(default_factory=list)
    important_color: str = "#ff4444"
