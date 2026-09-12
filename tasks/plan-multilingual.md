# Implementation Plan: M3 final — multilingual image matching

Spec: `docs/SPEC-multilingual-matching.md`. Slices, each committed:

### Slice 1 — multilingual core (backend, TDD)
- [ ] `clip.py`: `tokenize_multilingual(tokenizer, texts, max_length)` (WordPiece batch, pad, mask);
      `_pick_by_names(outputs, session, names)` (exact-name preference, fallback last).
- [ ] `MultilingualClipEmbedder(base, model_dir)` — lazy text session/tokenizer;
      `embed_images` → base; `text_embed` → tokenize → run → `sentence_embedding` → L2.
- [ ] Tests (fake tokenizer/session, no model): token shapes/pad/mask; pick by name; fallback; prefix beam.
- [ ] Verify: `cd backend && uv run pytest tests/test_clip.py` green; full suite.

### Slice 2 — wiring (auto-select)
- [ ] `config.py` `clip_multilingual_dir`; `main.py` builds base ClipEmbedder + multilingual wrapper when
      `models/clip-multilingual/model.onnx` exists (else unchanged bilingual fallback).
- [ ] Verify: existing `test_matching.py` (injected fake embedder) green; full backend suite.

### Slice 3 — real-model smoke (manual, non-committed)
- [ ] Urdu + English + Roman-Urdu beats vs real images through the full Matcher; document scores.
- [ ] Verify: automatic placement quality vs English-only baseline; record in SESSION_LOG.

### Slice 4 — docs, review, commit, push
- [ ] D-015, ROADMAP M3 last tick, FEATURES §3, TEST_PLAN §5.3, SESSION_LOG 8, graphify, regression, push (user go-ahead).

## Checkpoints

- [ ] Slice 1: unit suite green (no model files touched)
- [ ] Slice 2: full backend green with/without multilingual folder
- [ ] Slice 3: real smoke documents Urdu-script alignment
- [ ] Slice 4: docs + regression + push pending

## Risks / mitigation

| Risk | Mitigation |
|---|---|
| Roman-Urdu transliteration quality remains weak | Accepted; documented (scripted-tokenizer limitation); Urdu-script works |
| Fused-graph image output requires full feeds | Reuse existing `_zeros_image_feed` pattern |
| Multilingual folder absent on other machines | Auto-fallback keeps English parity |