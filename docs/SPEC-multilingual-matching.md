# Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass)

## Objective

M3's last open item: improve matching of non-English narration (Urdu script + Roman-Urdu) to images.
The English-only `Xenova/clip-vit-base-patch32` misreads Urdu beats. We adopt a multilingual CLIP text
tower without disturbing the existing ONNX-only, CPU, project-local stack.

## Key finding (validated on the downloaded model)

`sentence-transformers/clip-ViT-B-32-multilingual-v1` (ONNX export `yashvardhan7/clip-ViT-B-32-multilingual-v1-onnx`):
- **`onnx/model.onnx` is a TEXT-ONLY tower** — inputs `input_ids`/`attention_mask`, outputs
  `token_embeddings`/`sentence_embedding` (N, 512, already the projected CLIP-aligned space).
- Its **image tower is the standard OpenAI CLIP ViT-B/32** — exactly the image side of our existing
  `models/clip/model.onnx` (Xenova fp32). So the multilingual CLIP space is image-compatible by construction.
- Text tokenizer = multilingual DistilBERT wordpiece (vocab 119547, pad 0, cls 101); loads via `tokenizers`.
- Real inference: Urdu-script "گھنا سبز جنگل کی تصویر" aligns with English "green forest" strongly
  (cos 0.944); both map sensibly to a green-forest image embedding; Roman-Urdu transliteration separates
  poorly from random Roman-Urdu (0.74 vs 0.73) — a known limitation of scripted-tokenizer models.

## Design

Compose two sessions inside one embedder that keeps the `Matcher` interface
(`embed_images(batch)`, `text_embed(text)`):

- **Images:** reuse `ClipEmbedder` (Xenova fp32) exactly as today.
- **Text:** new `MultilingualClipEmbedder` in `clip.py`:
  - lazy `onnx/model.onnx` + `tokenizer.json` session from `models/clip-multilingual/`;
  - `text_embed`: WordPiece batch tokenize (max 77, pad, mask) → run → pick `sentence_embedding` → L2.
  - `embed_images`: delegate to the base `ClipEmbedder`.
- **Selection (auto):** if `models/clip-multilingual/model.onnx` exists → wire multilingual embedder;
  otherwise fall back to English-only `ClipEmbedder` (unchanged behaviour). New config field
  `clip_multilingual_dir`.

## Behaviour / acceptance

1. English behaviour unchanged when the multilingual folder is absent (default parity).
2. With the folder present, `/api/match` uses the multilingual text tower; Urdu-script beats score
   correctly against images (validated by a real-model smoke on a green-forest vs sunset pair).
3. Contract, error codes, confidence/alternatives — untouched.
4. No frontend change (beats stay in the user's language; the model handles them).

## Commands

- Backend: `cd backend && uv run pytest`
- Real smoke (manual): scratch script against real sessions (no committed test touches models/).

## Structure

- `backend/src/lava_backend/clip.py` — `tokenize_multilingual`, `_pick_by_names`, `MultilingualClipEmbedder`.
- `backend/src/lava_backend/config.py` — `clip_multilingual_dir`.
- `backend/src/lava_backend/main.py` — embedder selection at startup.
- `backend/tests/test_clip.py` — pure tests with fake tokenizer/session (no model files).
- `models/clip-multilingual/` — user-downloaded (gitignored).

## Testing strategy

- Unit (no model): multilingual tokenize shapes/mask/pad; output pick by exact name; composable fallback.
- Real-model smoke (manual, non-committed): Urdu + English + Roman-Urdu text vs forest/sunset images;
  document scores in SESSION_LOG.
- Existing suite must stay green (backend 56 → 58+).

## Boundaries

- Always: TDD; keep model files out of tests; docs (D-015, ROADMAP, SESSION_LOG) on completion.
- Ask first: adding deps (none needed), changing defaults.
- Never: put model paths in frontend, change the `/api/match` contract, require the multilingual folder.

## Success criteria

- `MultilingualClipEmbedder` unit tests green; full backend suite green; real smoke shows Urdu-script
  beats matching the right image; docs/decision committed.