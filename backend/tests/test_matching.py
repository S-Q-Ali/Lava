import io
import json

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from lava_backend.main import app
from lava_backend.matching import Beat, Matcher


def png_bytes(color=(120, 60, 30), size=(24, 24)):
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format="PNG")
    return buffer.getvalue()


class FakeEmbedder:
    def __init__(self, image_vectors, text_vectors):
        self.image_vectors = np.asarray(image_vectors, dtype=np.float64)
        self.text_vectors = {k: np.asarray(v, dtype=np.float64) for k, v in text_vectors.items()}

    def embed_images(self, batch):
        return self.image_vectors[: batch.shape[0]]

    def text_embed(self, text):
        return self.text_vectors[text][None, :]


E_SUN = (1.0, 0.0)
E_CAT = (0.0, 1.0)
E_CLOSE = (0.984807753, 0.173648178)


def make_image(color=(120, 60, 30)):
    return Image.new("RGB", (24, 24), color)


def make_route_client(matcher):
    app.state.matcher = matcher
    return TestClient(app)


def post(client, beats, filenames=("a.png", "b.png")):
    files = [
        ("images", (name, io.BytesIO(png_bytes()), "image/png"))
        for name in filenames
    ]
    return client.post("/api/match", files=files, data={"beats": json.dumps(beats)})


class TestMatcherAlgorithm:
    def test_assigns_each_beat_to_its_best_image(self):
        matcher = Matcher(
            FakeEmbedder([E_SUN, E_CAT], {"sun": E_SUN, "cat": E_CAT}),
            penalty=0.05,
        )
        result = matcher.assign(
            [
                Beat(id="b1", text="sun", start=0.0, end=2.0),
                Beat(id="b2", text="cat", start=2.0, end=4.0),
            ],
            images=[make_image(), make_image()],
            keys=["sun.png", "cat.png"],
        )
        assert [b["imageKey"] for b in result["beats"]] == ["sun.png", "cat.png"]
        assert [b["beatId"] for b in result["beats"]] == ["b1", "b2"]

    def test_returns_confidence_in_unit_range(self):
        matcher = Matcher(FakeEmbedder([E_SUN, E_CAT], {"sun": E_SUN}))
        result = matcher.assign([Beat(id="b1", text="sun", start=0.0, end=1.0)], [make_image()], ["a.png"])
        confidence = result["beats"][0]["confidence"]
        assert 0.0 < confidence <= 1.0

    def test_timing_passthrough(self):
        matcher = Matcher(FakeEmbedder([E_SUN], {"sun": E_SUN}))
        result = matcher.assign([Beat(id="b1", text="sun", start=1.5, end=3.7)], [make_image()], ["a.png"])
        beat = result["beats"][0]
        assert beat["start"] == 1.5 and beat["end"] == 3.7

    def test_alternatives_exclude_the_chosen_image(self):
        vectors = [E_SUN, E_CAT, E_CLOSE]
        matcher = Matcher(FakeEmbedder(vectors, {"sun": E_SUN}))
        result = matcher.assign([Beat(id="b1", text="sun", start=0.0, end=1.0)], [make_image()] * 3, ["a", "b", "c"])
        alternatives = result["beats"][0]["alternatives"]
        keys = [a["imageKey"] for a in alternatives]
        assert keys == ["c", "b"]
        assert all(0.0 <= a["confidence"] <= 1.0 for a in alternatives)

    def test_repeated_text_avoids_reusing_the_same_image(self):
        matcher = Matcher(
            FakeEmbedder([E_SUN, E_CLOSE], {"sun": E_SUN}),
            penalty=0.05,
        )
        result = matcher.assign(
            [
                Beat(id="b1", text="sun", start=0.0, end=1.0),
                Beat(id="b2", text="sun", start=1.0, end=2.0),
            ],
            [make_image(), make_image()],
            ["a.png", "b.png"],
        )
        picks = [b["imageKey"] for b in result["beats"]]
        assert picks == ["a.png", "b.png"]

    def test_does_not_over_penalize_distinct_candidates(self):
        matcher = Matcher(
            FakeEmbedder([E_SUN, E_CAT], {"sun": E_SUN, "cat": E_CAT}),
            penalty=0.05,
        )
        result = matcher.assign(
            [
                Beat(id="b1", text="sun", start=0.0, end=1.0),
                Beat(id="b2", text="cat", start=1.0, end=2.0),
            ],
            [make_image(), make_image()],
            ["a", "b"],
        )
        assert [b["imageKey"] for b in result["beats"]] == ["a", "b"]


class TestMatchEndpoint:
    def test_contract_with_multipart_images_and_beats(self):
        client = make_route_client(
            Matcher(FakeEmbedder([E_SUN, E_CAT], {"sun": E_SUN, "cat": E_CAT}))
        )
        response = post(
            client,
            [
                {"id": "b1", "text": "sun", "start": 0.0, "end": 2.0},
                {"id": "b2", "text": "cat", "start": 2.0, "end": 3.5},
            ],
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body["beats"]) == 2
        first = body["beats"][0]
        assert set(first) == {"beatId", "imageKey", "confidence", "start", "end", "alternatives"}
        assert first["imageKey"] == "a.png"
        assert len(first["alternatives"]) == 1

    def test_requires_at_least_one_image(self):
        client = make_route_client(Matcher(FakeEmbedder([E_SUN], {"sun": E_SUN})))
        response = client.post(
            "/api/match",
            data={"beats": json.dumps([{"id": "b1", "text": "sun", "start": 0.0, "end": 1.0}])},
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "NO_IMAGES"

    def test_beats_must_be_valid_json(self):
        client = make_route_client(Matcher(FakeEmbedder([E_SUN], {"sun": E_SUN})))
        response = client.post(
            "/api/match",
            files=[("images", ("a.png", io.BytesIO(png_bytes()), "image/png"))],
            data={"beats": "not-json"},
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "NO_BEATS"

    def test_beats_must_not_be_empty(self):
        client = make_route_client(Matcher(FakeEmbedder([E_SUN], {"sun": E_SUN})))
        response = client.post(
            "/api/match",
            files=[("images", ("a.png", io.BytesIO(png_bytes()), "image/png"))],
            data={"beats": json.dumps([])},
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "NO_BEATS"

    def test_beats_missing_required_fields(self):
        client = make_route_client(Matcher(FakeEmbedder([E_SUN], {"sun": E_SUN})))
        response = client.post(
            "/api/match",
            files=[("images", ("a.png", io.BytesIO(png_bytes()), "image/png"))],
            data={"beats": json.dumps([{"id": "b1", "text": "sun"}])},
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "NO_BEATS"

    def test_undecodable_image_maps_to_embed_failed(self):
        client = make_route_client(Matcher(FakeEmbedder([E_SUN], {"sun": E_SUN})))
        response = client.post(
            "/api/match",
            files=[("images", ("bad.png", io.BytesIO(b"not-an-image"), "image/png"))],
            data={"beats": json.dumps([{"id": "b1", "text": "sun", "start": 0.0, "end": 1.0}])},
        )
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "EMBED_FAILED"

    def test_embedder_exception_maps_to_embed_failed(self):
        class BrokenEmbedder(FakeEmbedder):
            def text_embed(self, text):
                raise RuntimeError("model blew up")

        client = make_route_client(Matcher(BrokenEmbedder([E_SUN], {"sun": E_SUN})))
        response = post(client, [{"id": "b1", "text": "sun", "start": 0.0, "end": 1.0}])
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "EMBED_FAILED"

    def test_assignment_collapse_maps_to_match_failed(self):
        class MismatchedEmbedder(FakeEmbedder):
            def text_embed(self, text):
                return self.text_vectors[text][None, :3]

        matcher = Matcher(MismatchedEmbedder([E_SUN], {"sun": (1.0, 0.0, 0.0)}))
        client = make_route_client(matcher)
        response = post(client, [{"id": "b1", "text": "sun", "start": 0.0, "end": 1.0}])
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "MATCH_FAILED"