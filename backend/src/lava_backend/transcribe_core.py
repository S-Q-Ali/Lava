from dataclasses import dataclass

PAUSE_THRESHOLD_DEFAULT = 0.3


@dataclass(frozen=True)
class Word:
    word: str
    start: float
    end: float
    confidence: float = 1.0


@dataclass(frozen=True)
class Pause:
    start: float
    end: float
    gap: float


def detect_pauses(words: list[Word], pause_threshold: float = PAUSE_THRESHOLD_DEFAULT) -> list[Pause]:
    ordered = sorted(words, key=lambda w: w.start)
    pauses: list[Pause] = []
    for previous, current in zip(ordered, ordered[1:]):
        gap = current.start - previous.end
        if gap >= pause_threshold:
            pauses.append(Pause(start=previous.end, end=current.start, gap=round(gap, 6)))
    return pauses


def confidence_from_logprob(logprob: float) -> float:
    return max(0.0, min(1.0, 1.0 + logprob / 3.0))