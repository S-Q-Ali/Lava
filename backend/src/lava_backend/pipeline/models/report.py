"""QC report model — quality check results."""
from __future__ import annotations
from pydantic import BaseModel, Field


class ClipResult(BaseModel):
    clip_id: str
    path: str
    duration: float
    file_size_bytes: int
    width: int
    height: int
    fps: float
    has_audio: bool
    score: float
    passed_qc: bool
    qc_errors: list[str] = Field(default_factory=list)


class QCReport(BaseModel):
    source_path: str
    total_duration: float
    clips_attempted: int
    clips_passed: int
    clips_failed: int
    results: list[ClipResult] = Field(default_factory=list)

    @property
    def success_rate(self) -> float:
        if self.clips_attempted == 0:
            return 0.0
        return self.clips_passed / self.clips_attempted

    def summary(self) -> str:
        return f"QC Report: {self.clips_passed}/{self.clips_attempted} clips passed ({self.success_rate:.0%})"
