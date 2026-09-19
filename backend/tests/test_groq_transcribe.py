import io
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from lava_backend.main import app
from lava_backend.groq_transcribe import SUPPORTED_MODELS, _parse_groq_response


def make_client():
    return TestClient(app)


def _make_groq_response(**overrides):
    """Build a mock Groq API response dict."""
    data = {
        "language": "en",
        "segments": [
            {
                "text": "Hello world",
                "start": 0.0,
                "end": 1.5,
                "avg_logprob": -0.3,
                "words": [
                    {"word": "Hello", "start": 0.0, "end": 0.5, "probability": 0.95},
                    {"word": "world", "start": 0.6, "end": 1.5, "probability": 0.92},
                ],
            }
        ],
    }
    data.update(overrides)
    return data


class TestParseGroqResponse:
    def test_parses_segments_and_words(self):
        data = _make_groq_response()
        result = _parse_groq_response(data, None)
        assert result.language == "en"
        assert len(result.segments) == 1
        assert result.segments[0].text == "Hello world"
        assert len(result.segments[0].words) == 2
        assert result.segments[0].words[0]["word"] == "Hello"

    def test_falls_back_to_provided_language(self):
        data = _make_groq_response(language=None)
        result = _parse_groq_response(data, "ur")
        assert result.language == "ur"

    def test_empty_segments(self):
        data = _make_groq_response(segments=[])
        result = _parse_groq_response(data, None)
        assert result.segments == []
        assert result.text == ""


class TestGroqTranscribeEndpoint:
    def test_requires_audio_file(self):
        client = make_client()
        response = client.post("/api/transcribe-groq")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "NO_FILE"

    def test_requires_api_key(self):
        client = make_client()
        with patch.dict("os.environ", {}, clear=True):
            response = client.post(
                "/api/transcribe-groq",
                files={"file": ("test.mp3", io.BytesIO(b"audio"), "audio/mpeg")},
            )
            assert response.status_code == 422
            assert response.json()["error"]["code"] == "NO_GROQ_API_KEY"

    def test_rejects_invalid_model(self):
        client = make_client()
        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}):
            response = client.post(
                "/api/transcribe-groq",
                files={"file": ("test.mp3", io.BytesIO(b"audio"), "audio/mpeg")},
                data={"model": "invalid-model"},
            )
            assert response.status_code == 422
            assert response.json()["error"]["code"] == "INVALID_MODEL"

    @patch("lava_backend.groq_transcribe._call_groq_transcribe")
    def test_successful_transcription(self, mock_call):
        mock_call.return_value = _make_groq_response()
        client = make_client()

        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}):
            response = client.post(
                "/api/transcribe-groq",
                files={"file": ("test.mp3", io.BytesIO(b"audio"), "audio/mpeg")},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["provider"] == "groq"
        assert body["model"] == "whisper-large-v3"
        assert body["language"] == "en"
        assert body["text"] == "Hello world"
        assert len(body["segments"]) == 1
        assert body["segments"][0]["confidence"] > 0
        assert len(body["pauses"]) == 0

    @patch("lava_backend.groq_transcribe._call_groq_transcribe")
    def test_transcription_with_pauses(self, mock_call):
        mock_call.return_value = _make_groq_response(
            segments=[
                {
                    "text": "Hello",
                    "start": 0.0,
                    "end": 0.5,
                    "avg_logprob": -0.2,
                    "words": [{"word": "Hello", "start": 0.0, "end": 0.5, "probability": 0.95}],
                },
                {
                    "text": "world",
                    "start": 1.5,
                    "end": 2.0,
                    "avg_logprob": -0.3,
                    "words": [{"word": "world", "start": 1.5, "end": 2.0, "probability": 0.92}],
                },
            ]
        )
        client = make_client()

        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}):
            response = client.post(
                "/api/transcribe-groq",
                files={"file": ("test.mp3", io.BytesIO(b"audio"), "audio/mpeg")},
            )

        assert response.status_code == 200
        body = response.json()
        assert len(body["pauses"]) == 1
        assert body["pauses"][0]["gap"] == 1.0

    @patch("lava_backend.groq_transcribe._call_groq_transcribe")
    def test_groq_api_error_maps_to_502(self, mock_call):
        mock_call.side_effect = Exception("API rate limit")
        client = make_client()

        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}):
            response = client.post(
                "/api/transcribe-groq",
                files={"file": ("test.mp3", io.BytesIO(b"audio"), "audio/mpeg")},
            )

        assert response.status_code == 502
        assert response.json()["error"]["code"] == "TRANSCRIBE_FAILED"

    def test_empty_file_rejected(self):
        client = make_client()
        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}):
            response = client.post(
                "/api/transcribe-groq",
                files={"file": ("empty.mp3", io.BytesIO(b""), "audio/mpeg")},
            )
            assert response.status_code == 400
            assert response.json()["error"]["code"] == "NO_FILE"

    def test_list_models(self):
        client = make_client()
        response = client.get("/api/transcribe-groq/models")
        assert response.status_code == 200
        body = response.json()
        assert "models" in body
        assert "whisper-large-v3" in body["models"]
        assert len(body["models"]) == len(SUPPORTED_MODELS)
