from dataclasses import dataclass

from lava_backend.transcribe_core import Word


@dataclass(frozen=True)
class Segment:
    id: int
    text: str
    start: float
    end: float
    avg_logprob: float
    words: list[dict]


@dataclass(frozen=True)
class Transcription:
    language: str
    segments: list[Segment]

    @property
    def text(self) -> str:
        return "\n".join(segment.text for segment in self.segments)

    @property
    def words(self) -> list[Word]:
        return [
            Word(**plain_word)
            for segment in self.segments
            for plain_word in segment.words
        ]


class Transcriber:
    def transcribe(self, path: str, language: str | None = None) -> Transcription:
        raise NotImplementedError


class FakeTranscriber(Transcriber):
    def __init__(
        self,
        language: str = "en",
        segments: list[Segment] | None = None,
    ) -> None:
        self.language = language
        self._segments: list[Segment] = segments or []

    def transcribe(self, path: str, language: str | None = None) -> Transcription:
        return Transcription(language=language or self.language, segments=self._segments)