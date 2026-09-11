import numpy as np
import pytest
from PIL import Image

from lava_backend.clip import (
    ClipEmbedder,
    cosine_similarity,
    l2_normalize,
    preprocess_image,
    softmax,
    tokenize_text,
)


class FakeTokenizer:
    def __init__(self, ids_by_text):
        self.ids_by_text = ids_by_text

    class Encoding:
        def __init__(self, ids):
            self.ids = ids

    def encode(self, text):
        return self.Encoding(self.ids_by_text[text])


class StubSession:
    output_names = ("text_embeds", "image_embeds")

    def __init__(self):
        self.last_feed = None

    def get_outputs(self):
        return [type("N", (), {"name": n}) for n in self.output_names]

    def run(self, output_names, feed):
        self.last_feed = feed
        text_rows = int(feed["input_ids"].shape[0])
        image_rows = int(feed["pixel_values"].shape[0])
        text = np.eye(512)[:text_rows]
        image = np.eye(512)[:image_rows]
        return [text, image]


def make_embedder():
    tokenizer = FakeTokenizer(
        {"Ali jungle mein gaya": [101, 102], "Wahan sher tha": [202, 203]}
    )
    return ClipEmbedder(model_dir=None, session=StubSession(), tokenizer=tokenizer)


def stub_feed(embedder):
    return embedder.session.last_feed


def test_preprocess_image_returns_normalized_chw_batch():
    image = Image.new("RGB", (32, 64), (128, 128, 128))
    tensor = preprocess_image(image)
    assert tensor.shape == (1, 3, 224, 224)
    assert tensor.dtype == np.float32
    assert tensor[0].shape[0] == 3


def test_preprocess_center_crops_long_short_edge_is_square():
    image = Image.new("RGB", (64, 224), (255, 0, 0))
    tensor = preprocess_image(image)
    assert tensor.shape[2] == 224 and tensor.shape[3] == 224


def test_preprocess_normalizes_pixel_range():
    image = Image.new("RGB", (224, 224), (0, 0, 0))
    tensor = preprocess_image(image)
    assert float(tensor.min()) < 0.0


def test_cosine_similarity_orthogonal_is_zero():
    a = np.array([[1.0, 0.0]])
    b = np.array([[0.0, 1.0]])
    assert abs(cosine_similarity(a, b)[0, 0]) < 1e-6


def test_cosine_similarity_identical_is_one():
    a = np.array([[1.0, 2.0]])
    assert abs(cosine_similarity(a, a)[0, 0] - 1.0) < 1e-6


def test_l2_normalize_makes_unit_vectors():
    rows = np.array([[3.0, 4.0], [0.1, 0.2]])
    normed = l2_normalize(rows)
    assert np.allclose(np.linalg.norm(normed, axis=1), 1.0)


def test_softmax_sums_to_one_and_temperature_sharpens():
    scores = np.array([0.1, 0.2, 0.3])
    flat = softmax(scores, temperature=1.0)
    assert np.isclose(flat.sum(), 1.0)
    sharp = softmax(scores, temperature=0.3)
    assert sharp.argmax() == 2
    assert sharp[2] > flat[2]


def test_clip_embedder_image_embed_uses_single_image_feed():
    embedder = make_embedder()
    result = embedder.image_embed(np.zeros((1, 3, 224, 224), dtype=np.float32))
    assert result.shape == (1, 512)
    assert np.isclose(np.linalg.norm(result), 1.0)
    assert "pixel_values" in stub_feed(embedder)


def test_clip_embedder_text_embed_bos_eot_pads_to_77():
    embedder = make_embedder()
    result = embedder.text_embed("Ali jungle mein gaya")
    assert result.shape == (1, 512)
    feed = stub_feed(embedder)
    ids = feed["input_ids"][0]
    mask = feed["attention_mask"][0]
    assert len(ids) == 77
    assert int(ids[0]) == 49406
    assert int(ids[1]) == 101
    assert int(ids[2]) == 102
    assert int(ids[3]) == 49407
    assert int(mask[0]) == 1
    assert int(mask[3]) == 1
    assert int(mask[76]) == 0


def test_clip_embedder_text_embed_truncates_long_input():
    tokenizer = FakeTokenizer({"word " * 100: list(range(100))})
    embedder = ClipEmbedder(
        model_dir=None,
        session=StubSession(),
        tokenizer=tokenizer,
    )
    embedder.text_embed("word " * 100)
    ids = stub_feed(embedder)["input_ids"][0]
    assert len(ids) == 77


def test_clip_embedder_embeds_text_batch():
    embedder = make_embedder()
    results = embedder.embed_texts(["Ali jungle mein gaya", "Wahan sher tha"])
    assert results.shape == (2, 512)


def test_clip_embedder_embeds_image_batch():
    embedder = make_embedder()
    batch = np.zeros((2, 3, 224, 224), dtype=np.float32)
    assert embedder.embed_images(batch).shape == (2, 512)


def test_tokenize_text_requires_bos_eot_roundtrip():
    tokenizer = FakeTokenizer({"hi": [1, 2, 3]})
    ids, mask = tokenize_text(tokenizer, "hi", max_length=8)
    assert ids.shape == (1, 8)
    assert int(ids[0, 0]) == 49406
    assert int(ids[0, 4]) == 49407
    assert int(mask[0, 4]) == 1
    assert int(mask[0, 7]) == 0


def test_preprocess_rejects_non_rgb():
    gray = Image.new("L", (50, 50), 128)
    with pytest.raises(ValueError):
        preprocess_image(gray)