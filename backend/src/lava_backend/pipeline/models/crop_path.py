"""Crop path model — face tracking output."""
from __future__ import annotations
from pydantic import BaseModel, Field


class CropFrame(BaseModel):
    t: float = Field(description="Timestamp in seconds")
    x: float = Field(description="Crop X in source pixels")
    y: float = Field(description="Crop Y in source pixels")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    width: float = Field(default=0.0)
    height: float = Field(default=0.0)


class CropPath(BaseModel):
    frames: list[CropFrame] = Field(default_factory=list)
    source_width: int
    source_height: int
    target_width: int = Field(default=1080)
    target_height: int = Field(default=1920)
    smoothed: bool = Field(default=False)
    fallback_mode: str = Field(default="center-crop")

    def get_position_at(self, t: float) -> tuple[float, float]:
        if not self.frames:
            return self._center_crop()
        prev = self.frames[0]
        for frame in self.frames:
            if frame.t > t:
                break
            prev = frame
        if prev.width == 0 or prev.height == 0:
            if self.fallback_mode == "last-known" and prev.x != 0:
                return (prev.x, prev.y)
            return self._center_crop()
        return (prev.x, prev.y)

    def _center_crop(self) -> tuple[float, float]:
        crop_w = int(self.source_height * self.target_width / self.target_height)
        x = (self.source_width - crop_w) / 2
        return (x, 0.0)
