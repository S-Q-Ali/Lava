"""Style profile model — extracted from reference video analysis."""
from __future__ import annotations
from pydantic import BaseModel, Field


class CaptionStyle(BaseModel):
    font: str = Field(default="Impact")
    size: int = Field(default=64, ge=24, le=200)
    color: str = Field(default="#FFFFFF")
    outline_color: str = Field(default="#000000")
    outline_width: int = Field(default=3)
    emphasis_color: str = Field(default="#FFD700")
    animation: str = Field(default="word-by-word")
    position: str = Field(default="center-bottom")
    words_per_group: int = Field(default=1, ge=1, le=6)


class ZoomPattern(BaseModel):
    enabled: bool = Field(default=True)
    pattern: str = Field(default="punch-per-sentence")
    factor: float = Field(default=1.10, ge=1.0, le=2.0)
    ramp_sec: float = Field(default=0.08, ge=0.0, le=0.5)
    hold_sec: float = Field(default=1.5, ge=0.5, le=5.0)


class CutPattern(BaseModel):
    avg_interval_sec: float = Field(default=2.5, ge=0.5, le=10.0)
    cut_on: str = Field(default="word-boundary")
    type: str = Field(default="hard-cut")


class EffectPattern(BaseModel):
    flash_on_punchline: bool = Field(default=True)
    flash_duration_sec: float = Field(default=0.05)
    speed_ramps: bool = Field(default=True)
    speed_buildup: float = Field(default=1.5)
    speed_payoff: float = Field(default=1.0)
    shake_on_impact: bool = Field(default=False)


class SFXConfig(BaseModel):
    transition: str = Field(default="whooshes/cinematic_fast.wav")
    punchline: str = Field(default="dings/pop_ding.wav")
    buildup: str = Field(default="risers/tension_riser.wav")
    impact: str = Field(default="impacts/heavy_hit.wav")


class AudioMix(BaseModel):
    voice_db: float = Field(default=-6.0)
    music_db: float = Field(default=-24.0)
    sfx_db: float = Field(default=-12.0)
    master_lufs: float = Field(default=-14.0)


class StyleProfile(BaseModel):
    name: str = Field(description="Profile name")
    source: str = Field(default="")
    caption: CaptionStyle = Field(default_factory=CaptionStyle)
    zoom: ZoomPattern = Field(default_factory=ZoomPattern)
    cuts: CutPattern = Field(default_factory=CutPattern)
    effects: EffectPattern = Field(default_factory=EffectPattern)
    sfx: SFXConfig = Field(default_factory=SFXConfig)
    audio: AudioMix = Field(default_factory=AudioMix)
    pacing: str = Field(default="fast-hook -> escalation -> fast-payoff")
