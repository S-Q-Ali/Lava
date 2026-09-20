"""Stage 2: Transcribe — whisper base.en for word-level timestamps."""
from __future__ import annotations
from pathlib import Path
from typing import Any


def transcribe(video_path: str, model_size: str = "base.en", language: str = "en") -> list[dict[str, Any]]:
    try:
        import whisper
    except ImportError:
        raise ImportError("pip install openai-whisper")
    path = Path(video_path)
    if not path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")
    print(f"Loading whisper model '{model_size}'...")
    model = whisper.load_model(model_size)
    print(f"Transcribing {path.name}...")
    result = model.transcribe(str(path), language=language, word_timestamps=True, verbose=False)
    segments = []
    for seg in result.get("segments", []):
        words = [{"word": w.get("word", "").strip(), "start": float(w.get("start", 0)), "end": float(w.get("end", 0))} for w in seg.get("words", [])]
        segments.append({"start": float(seg.get("start", 0)), "end": float(seg.get("end", 0)), "text": seg.get("text", "").strip(), "words": words})
    print(f"Transcribed {len(segments)} segments")
    return segments
