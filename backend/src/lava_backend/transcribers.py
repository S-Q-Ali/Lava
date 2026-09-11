from dataclasses import dataclass
from pathlib import Path

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


class WhisperTranscriber(Transcriber):
    def __init__(
        self,
        model_size: str = "tiny",
        device: str = "cpu",
        compute_type: str = "int8",
        download_root: Path | None = None,
    ) -> None:
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.download_root = download_root
        self._model = None

    def _ensure_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel

            self._model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                download_root=str(self.download_root) if self.download_root else None,
            )
        return self._model

    def transcribe(self, path: str, language: str | None = None) -> Transcription:
        model = self._ensure_model()
        segment_iter, info = model.transcribe(
            path,
            language=language,
            word_timestamps=True,
        )
        segments: list[Segment] = []
        for index, segment in enumerate(segment_iter):
            words: list[dict] = []
            for word in segment.words or []:
                words.append(
                    {
                        "word": word.word,
                        "start": word.start,
                        "end": word.end,
                        "confidence": float(getattr(word, "probability", 1.0)),
                    }
                )
            segments.append(
                Segment(
                    id=index,
                    text=segment.text,
                    start=segment.start,
                    end=segment.end,
                    avg_logprob=segment.avg_logprob,
                    words=words,
                )
            )
        return Transcription(language=str(info.language), segments=segments)


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