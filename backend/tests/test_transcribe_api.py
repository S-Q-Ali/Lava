import io

from fastapi.testclient import TestClient

from lava_backend.main import app
from lava_backend.transcribers import FakeTranscriber, Segment, Transcription


def make_client(transcriber):
    app.state.transcriber = transcriber
    return TestClient(app)


class TestTranscribeEndpoint:
    def test_transcribes_audio_with_pauses(self):
        fake = FakeTranscriber(
            language="en",
            segments=[
                Segment(
                    id=0,
                    text="Ali jungle mein gaya",
                    start=0.0,
                    end=3.6,
                    avg_logprob=-0.2,
                    words=[
                        {"word": "Ali", "start": 0.0, "end": 0.4, "confidence": 1.0},
                        {"word": "jungle", "start": 1.6, "end": 2.2, "confidence": 1.0},
                        {"word": "mein", "start": 2.3, "end": 3.1, "confidence": 1.0},
                        {"word": "gaya", "start": 3.2, "end": 3.6, "confidence": 1.0},
                    ],
                )
            ],
        )
        client = make_client(fake)

        response = client.post(
            "/api/transcribe",
            files={"file": ("narration.mp3", io.BytesIO(b"audio"), "audio/mpeg")},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["language"] == "en"
        assert body["text"].startswith("Ali")
        assert body["segments"][0]["confidence"] > 0
        assert body["pauses"] == [{"start": 0.4, "end": 1.6, "gap": 1.2}]

    def test_multiple_pauses_across_segments(self):
        fake = FakeTranscriber(
            language="ur",
            segments=[
                Segment(
                    id=0,
                    text="a b",
                    start=0.0,
                    end=3.5,
                    avg_logprob=-1.0,
                    words=[
                        {"word": "a", "start": 0.0, "end": 0.2},
                        {"word": "b", "start": 0.5, "end": 1.0},
                    ],
                ),
                Segment(
                    id=1,
                    text="c",
                    start=2.5,
                    end=3.5,
                    avg_logprob=-1.0,
                    words=[{"word": "c", "start": 3.0, "end": 3.5}],
                ),
            ],
        )
        client = make_client(fake)

        response = client.post(
            "/api/transcribe",
            files={"file": ("ur.mp3", io.BytesIO(b"x"), "audio/mpeg")},
        )

        assert response.status_code == 200
        pauses = response.json()["pauses"]
        assert pauses == [
            {"start": 0.2, "end": 0.5, "gap": 0.3},
            {"start": 1.0, "end": 3.0, "gap": 2.0},
        ]

    def test_requires_an_audio_file(self):
        client = make_client(FakeTranscriber())
        response = client.post("/api/transcribe")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "NO_FILE"

    def test_transcriber_failure_maps_to_422(self):
        class BrokenTranscriber:
            def transcribe(self, path, language=None):
                raise RuntimeError("model blew up")

        client = make_client(BrokenTranscriber())
        response = client.post(
            "/api/transcribe",
            files={"file": ("bad.mp3", io.BytesIO(b"garbage"), "audio/mpeg")},
        )
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "TRANSCRIBE_FAILED"