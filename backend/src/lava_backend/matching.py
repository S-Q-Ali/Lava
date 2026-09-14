from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass

import numpy as np
from fastapi import APIRouter, File, Form, Request, UploadFile

from lava_backend.clip import cosine_similarity, preprocess_image, softmax
from lava_backend.errors import ApiError

router = APIRouter()

TOP_ALTERNATIVES = 3
REPETITION_PENALTY = 0.05


@dataclass(frozen=True)
class Beat:
    id: str
    text: str
    start: float
    end: float


class EmbedFailure(Exception):
    """Embedding/model step failed; distinguishes embed errors from assignment errors."""


def _get_matcher(state):
    """Return the app matcher, building it lazily on first use.

    A pre-injected ``state.matcher`` (tests) is reused as-is. Otherwise the
    real embedder is constructed only when a match request first needs it, so
    startup touches no model bytes.
    """
    matcher = getattr(state, "matcher", None)
    if matcher is not None:
        return matcher
    from .clip import ClipEmbedder, MultilingualClipEmbedder
    from .config import get_config

    config = get_config()
    embedder = ClipEmbedder(model_dir=config.clip_dir)
    if (config.clip_multilingual_dir / "model.onnx").exists():
        embedder = MultilingualClipEmbedder(base=embedder, model_dir=config.clip_multilingual_dir)
    state.matcher = Matcher(embedder)
    return state.matcher


class Matcher:
    """Repetition-aware greedy assignment of CLIP embeddings to narration beats.

    ``embedder`` is injectable so tests never touch a model: any object with
    ``embed_images(batch) -> np.ndarray`` and ``text_embed(text) -> np.ndarray``
    works (see the real :class:`lava_backend.clip.ClipEmbedder`).
    """

    def __init__(
        self,
        embedder,
        penalty: float = REPETITION_PENALTY,
        top_alternatives: int = TOP_ALTERNATIVES,
    ) -> None:
        self.embedder = embedder
        self.penalty = penalty
        self.top_alternatives = top_alternatives

    def assign(self, beats: list[Beat], images: list, keys: list[str]) -> dict:
        try:
            image_embeds = self.embedder.embed_images(
                np.stack([preprocess_image(image) for image in images], axis=0)
            )
        except EmbedFailure:
            raise
        except Exception as exc:
            raise EmbedFailure from exc
        used = np.zeros(image_embeds.shape[0], dtype=np.float64)
        results = []
        for beat in beats:
            try:
                text_embed = self.embedder.text_embed(beat.text)
            except Exception as exc:
                raise EmbedFailure from exc
            scores = cosine_similarity(image_embeds, text_embed)[:, 0]
            adjusted = scores - self.penalty * used
            best = int(np.argmax(adjusted))
            used[best] += 1

            distribution = softmax(scores[np.newaxis, :])[0]
            confidence = float(distribution[best])
            ranked = np.argsort(scores)[::-1]
            alternatives = [
                {
                    "imageKey": keys[rank],
                    "confidence": float(distribution[rank]),
                }
                for rank in ranked
                if rank != best
            ][: self.top_alternatives]

            results.append(
                {
                    "beatId": beat.id,
                    "imageKey": keys[best],
                    "confidence": confidence,
                    "start": beat.start,
                    "end": beat.end,
                    "alternatives": alternatives,
                }
            )
        return {"beats": results}


def _parse_beats(raw: str) -> list[Beat]:
    try:
        payload = json.loads(raw)
        beats = [
            Beat(
                id=item["id"],
                text=item["text"],
                start=float(item["start"]),
                end=float(item["end"]),
            )
            for item in payload
        ]
    except (json.JSONDecodeError, TypeError, KeyError, ValueError):
        raise ApiError(400, "NO_BEATS", "beats must be a JSON array of {id, text, start, end}.")
    if not beats:
        raise ApiError(400, "NO_BEATS", "beats must be a JSON array of {id, text, start, end}.")
    return beats


@router.post("/match", status_code=200)
async def match(
    request: Request,
    beats: str = Form(...),
    images: list[UploadFile] = File(default=[]),
) -> dict:
    if not images:
        raise ApiError(400, "NO_IMAGES", "Add at least one image to match.")

    beat_models = _parse_beats(beats)

    decoded = []
    keys = []
    for upload in images:
        name = upload.filename or "image"
        content = await upload.read()
        if not content:
            raise ApiError(422, "EMBED_FAILED", "One of the selected images is empty.")
        try:
            import io

            from PIL import Image as PILImage

            decoded.append(PILImage.open(io.BytesIO(content)).convert("RGB"))
            keys.append(name)
        except Exception:
            raise ApiError(422, "EMBED_FAILED", "One of the selected images could not be read.")

    matcher = _get_matcher(request.app.state)
    try:
        result = await asyncio.to_thread(matcher.assign, beat_models, decoded, keys)
    except ApiError:
        raise
    except EmbedFailure:
        raise ApiError(422, "EMBED_FAILED", "Image analysis failed. The selected images may be unsupported.")
    except Exception:
        raise ApiError(
            422,
            "MATCH_FAILED",
            "Image matching failed. The selected images may be unsupported.",
        )
    return result