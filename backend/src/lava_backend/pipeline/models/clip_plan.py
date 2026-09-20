"""Clip plan model — output of LLM moment scoring."""
from __future__ import annotations
from pydantic import BaseModel, Field


class ZoomEvent(BaseModel):
    start: float = Field(description="Start time in seconds")
    end: float = Field(description="End time in seconds")
    zoom: float = Field(default=1.10, ge=1.0, le=2.0)
    ramp_sec: float = Field(default=0.08, ge=0.0, le=0.5)


class SpeedRamp(BaseModel):
    start: float = Field(description="Start time in seconds")
    end: float = Field(description="End time in seconds")
    speed: float = Field(default=1.5, ge=0.25, le=4.0)


class ClipPlan(BaseModel):
    id: str = Field(description="Unique clip identifier")
    start: float = Field(description="Start time in source video (seconds)")
    end: float = Field(description="End time in source video (seconds)")
    score: float = Field(ge=0.0, le=1.0, description="Engagement score 0-1")
    reason: str = Field(default="")
    zoom_events: list[ZoomEvent] = Field(default_factory=list)
    speed_ramps: list[SpeedRamp] = Field(default_factory=list)
    flash_frames: list[float] = Field(default_factory=list)
    caption_emphasis: list[str] = Field(default_factory=list)
    reframe_mode: str = Field(default="face-track")
    audio_boost_db: float = Field(default=0.0)

    @property
    def duration(self) -> float:
        return self.end - self.start
