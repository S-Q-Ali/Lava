from __future__ import annotations

import numpy as np
from PIL import Image

CLIP_SIZE = 224
CLIP_MAX_SEQ = 77
CLIP_BOS_ID = 49406
CLIP_EOT_ID = 49407
CLIP_MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
CLIP_STD = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)

_FILES = {
    "tokenizer.json": "tokenizer.json",
    "preprocessor_config.json": "preprocessor_config.json",
    "model.onnx": "onnx/model.onnx",
}


def preprocess_image(image: Image.Image, size: int = CLIP_SIZE) -> np.ndarray:
    if image.mode != "RGB":
        raise ValueError("CLIP preprocessing requires RGB images.")
    width, height = image.size
    shorter = min(width, height)
    scale = size / shorter
    resized = image.resize(
        (max(1, round(width * scale)), max(1, round(height * scale))),
        Image.Resampling.BICUBIC,
    )
    left = (resized.width - size) // 2
    top = (resized.height - size) // 2
    cropped = resized.crop((left, top, left + size, top + size))
    array = np.asarray(cropped, dtype=np.float32) / 255.0
    array = (array - CLIP_MEAN) / CLIP_STD
    return np.ascontiguousarray(np.transpose(array, (2, 0, 1)), dtype=np.float32)


def tokenize_text(tokenizer, text: str, max_length: int = CLIP_MAX_SEQ) -> tuple[np.ndarray, np.ndarray]:
    ids = list(tokenizer.encode(text).ids)
    reserved = max_length - 2
    if len(ids) > reserved:
        ids = ids[:reserved]
    sequence = [CLIP_BOS_ID, *ids, CLIP_EOT_ID]
    effective = len(sequence)
    padded = sequence + [CLIP_EOT_ID] * (max_length - effective)
    ids_array = np.asarray(padded[:max_length], dtype=np.int64)
    mask = np.zeros(max_length, dtype=np.int64)
    mask[:effective] = 1
    return ids_array[None, ...], mask[None, ...]


def l2_normalize(rows: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(rows, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return rows / norms


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return l2_normalize(a) @ l2_normalize(b).T


def softmax(scores: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    scaled = np.asarray(scores, dtype=np.float64) / temperature
    shifted = scaled - scaled.max(axis=-1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=-1, keepdims=True)


def _zeros_text_feed(ids: np.ndarray, mask: np.ndarray) -> np.ndarray:
    feed = {"pixel_values": np.zeros((1, 3, CLIP_SIZE, CLIP_SIZE), dtype=np.float32)}
    feed["input_ids"], feed["attention_mask"] = ids, mask
    return feed


def _zeros_image_feed(pixel_values: np.ndarray) -> np.ndarray:
    zeros = np.zeros((pixel_values.shape[0], CLIP_MAX_SEQ), dtype=np.int64)
    return {
        "pixel_values": pixel_values,
        "input_ids": zeros,
        "attention_mask": zeros,
    }


def _output_names(session):
    if hasattr(session, "get_outputs"):
        try:
            return [o.name for o in session.get_outputs()]
        except Exception:
            return None
    return getattr(session, "output_names", None)


def tokenize_multilingual(tokenizer, texts, max_length: int = CLIP_MAX_SEQ) -> tuple[np.ndarray, np.ndarray]:
    """WordPiece batch tokenization for the multilingual text tower.

    ``sentence-transformers/clip-ViT-B-32-multilingual-v1`` uses a multilingual
    DistilBERT tokenizer whose own specials apply (via ``encode_batch``). Pads
    with the tokenizer's PAD id and builds an alignment mask, both 77-wide.
    """
    encodings = tokenizer.encode_batch(list(texts))
    pad = int(tokenizer.token_to_id("[PAD]") or 0)
    ids, masks = [], []
    for enc in encodings:
        raw = enc.ids[:max_length]
        effective = len(raw)
        ids.append(raw + [pad] * (max_length - effective))
        masks.append([1] * effective + [0] * (max_length - effective))
    return np.asarray(ids, dtype=np.int64), np.asarray(masks, dtype=np.int64)


def _pick_by_names(outputs: list, session, names: list[str]) -> np.ndarray:
    """Return the output matching one of ``names`` (case-insensitive, exact).

    Falls back to the last output so fused graphs whose names differ keep
    working. Reshapes to (rows, emb_dim) like :func:`_pick`.
    """
    actual = _output_names(session) or []
    wanted = {n.lower() for n in names}
    for name, output in zip(actual, outputs):
        if name.lower() in wanted:
            return np.asarray(output, dtype=np.float64).reshape(output.shape[0], -1)
    output = outputs[-1]
    return np.asarray(output, dtype=np.float64).reshape(output.shape[0], -1)


def _pick(outputs: list, session, wants: str) -> np.ndarray:
    names = _output_names(session)
    if names:
        for name, output in zip(names, outputs):
            if wants in str(name).lower():
                return np.asarray(output, dtype=np.float64).reshape(output.shape[0], -1)
    index = len(outputs) - 1 if wants == "image_embeds" else len(outputs) - 2
    output = outputs[max(index, 0)]
    return np.asarray(output, dtype=np.float64).reshape(output.shape[0], -1)


class ClipEmbedder:
    """CLIP ViT-B/32 embeddings through a fused ONNX session (Xenova export).

    Model and tokenizer are downloaded into ``model_dir`` on first use unless a
    session/tokenizer are injected (tests). Real work happens lazily so no
    model bytes are touched at import time.
    """

    def __init__(
        self,
        model_dir=None,
        session=None,
        tokenizer=None,
        repo_id: str = "Xenova/clip-vit-base-patch32",
        model_key: str = "onnx/model.onnx",
    ) -> None:
        self.model_dir = model_dir
        self.repo_id = repo_id
        self.model_key = model_key
        self._session = session
        self._tokenizer = tokenizer

    @property
    def session(self):
        return self._session

    @property
    def tokenizer(self):
        return self._tokenizer

    def _ensure(self):
        if self._session is not None and self._tokenizer is not None:
            return
        if self.model_dir is None:
            raise RuntimeError("clip model_dir is required when no session/tokenizer are injected.")
        from huggingface_hub import hf_hub_download
        import shutil

        self.model_dir.mkdir(parents=True, exist_ok=True)
        target = self.model_dir / "model.onnx"
        if not target.exists():
            cached = hf_hub_download(self.repo_id, self.model_key, cache_dir=str(self.model_dir))
            shutil.copyfile(cached, target)
        for cached_name, hub_path in _FILES.items():
            if cached_name == "model.onnx":
                continue
            cached = self.model_dir / cached_name
            if not cached.exists():
                hf_hub_download(self.repo_id, hub_path, local_dir=self.model_dir)
        if self._session is None:
            import onnxruntime as ort

            self._session = ort.InferenceSession(
                str(self.model_dir / "model.onnx"),
                providers=["CPUExecutionProvider"],
            )
        if self._tokenizer is None:
            from tokenizers import Tokenizer

            self._tokenizer = Tokenizer.from_file(str(self.model_dir / "tokenizer.json"))

    def image_embed(self, pixel_values: np.ndarray) -> np.ndarray:
        self._ensure()
        outputs = self._session.run(None, _zeros_image_feed(pixel_values))
        embedding = _pick(outputs, self._session, "image_embeds")
        return l2_normalize(embedding)

    def text_embed(self, text: str) -> np.ndarray:
        self._ensure()
        ids, mask = tokenize_text(self._tokenizer, text)
        outputs = self._session.run(None, _zeros_text_feed(ids, mask))
        embedding = _pick(outputs, self._session, "text_embeds")
        return l2_normalize(embedding)

    def embed_images(self, batch: np.ndarray) -> np.ndarray:
        return self.image_embed(batch)

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        return np.concatenate([self.text_embed(text) for text in texts], axis=0)

class MultilingualClipEmbedder:
    """Composed multilingual CLIP: images from a base ClipEmbedder, text from
    the sentence-transformers multilingual text tower (DistilBERT-backed).

    Keeps the ``Matcher`` interface (``embed_images``/``text_embed``) and stays
    ONNX-only/CPU. Sessions and tokenizers are injectable for tests; otherwise
    they load from ``model_dir`` (already-downloaded files only, no hub fetch).
    """

    def __init__(
        self,
        base,
        model_dir=None,
        session=None,
        tokenizer=None,
        max_length: int = CLIP_MAX_SEQ,
    ) -> None:
        self._base = base
        self.model_dir = model_dir
        self._session = session
        self._tokenizer = tokenizer
        self._max_length = max_length

    @property
    def base(self):
        return self._base

    @property
    def session(self):
        return self._session

    def _ensure(self):
        if self._session is not None and self._tokenizer is not None:
            return
        if self.model_dir is None:
            raise RuntimeError("multilingual clip model_dir is required when no session/tokenizer are injected.")
        onnx_file = self.model_dir / "model.onnx"
        if not onnx_file.exists():
            nested = self.model_dir / "onnx" / "model.onnx"
            if nested.exists():
                onnx_file = nested
        tokenizer_file = self.model_dir / "tokenizer.json"
        missing = [p.name for p in (onnx_file, tokenizer_file) if not p.exists()]
        if missing:
            raise RuntimeError(
                "Multilingual model files missing in the project folder "
                f"({self.model_dir}): {missing}. Download "
                "yashvardhan7/clip-ViT-B-32-multilingual-v1-onnx and place its "
                "onnx/model.onnx + tokenizer.json here."
            )
        import onnxruntime as ort

        self._session = ort.InferenceSession(str(onnx_file), providers=["CPUExecutionProvider"])
        from tokenizers import Tokenizer

        self._tokenizer = Tokenizer.from_file(str(tokenizer_file))

    def embed_images(self, batch: np.ndarray) -> np.ndarray:
        return self._base.embed_images(batch)

    def text_embed(self, text: str) -> np.ndarray:
        self._ensure()
        ids, mask = tokenize_multilingual(self._tokenizer, [text], max_length=self._max_length)
        outputs = self._session.run(None, {"input_ids": ids, "attention_mask": mask})
        embedding = _pick_by_names(outputs, self._session, ["sentence_embedding"])
        return l2_normalize(embedding)
