# Lava — AI Video Studio

Local-first professional AI Video Studio. A real editing tool that happens to have excellent AI automation — not an AI landing page.

## Differentiators

1. **Voice-over → semantic image matching → automatic timing/sync → transitions → editable timeline.**
   Speak or upload narration, feed in your image pool, and the studio builds an editable timeline with confidence-aware matching. Every AI decision stays editable.

2. **Manhwa/Webtoon long-strip → panel extraction → ordering → individual panel assets → manual correction → export.**
   Drop one very tall webtoon image and get detected panels at original resolution with split/merge/reorder/crop and PNG/JPG export.

## Current status

**Milestone 9.5 (beta) complete.** All core features shipped:

- V2 frontend layout: topbar, 64px nav rail, left workspace, center preview, right panels (AI Match + Auto Captions + Inspector), bottom assets, timeline.
- Voice analysis: faster-whisper ASR, word timestamps, pause detection, editable transcript, re-segmentation.
- Semantic image matching: CLIP ViT-B/32 ONNX embeddings, repetition-aware greedy assignment, confidence + alternatives.
- Transition engine: clean cuts, contextual suggestions, xfade renderer, ken-burns motion.
- Caption engine: 15 original presets, karaoke/kinetic/manga/cinematic/meme/storytelling animations, libass burn-in.
- Template/font system: preset registry, import/export, template editor, license tracking.
- Manhwa extractor: hybrid CV panel detection, ordering, split/merge/reorder, PNG/JPG export.
- Hardware validation: proxy previews, lazy model loading, CPU fallback, streaming exports.

## Getting started

### Frontend
```bash
cd frontend && npm install && npm run dev
```

### Backend (sidecar)
```bash
./scripts/sidecar.sh
```

The sidecar starts on `http://localhost:8000`. The frontend connects automatically.

## Documentation

Canonical references live in `docs/`:

- [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — mission, non-negotiable rules, locked product behavior, pipelines
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — repository layout and system design
- [FEATURES.md](docs/FEATURES.md) — feature scope across all systems (voice/images, manhwa, captions, templates)
- [UI_SPEC.md](docs/UI_SPEC.md) — editor layout and UI/UX direction
- [TEST_PLAN.md](docs/TEST_PLAN.md) — testing strategy and fixture sets
- [ROADMAP.md](docs/ROADMAP.md) — milestone plan (0–10)
- [SESSION_LOG.md](docs/SESSION_LOG.md) — session-by-session record (WHAT/HOW/WHY), the cross-session continuity file
- [DECISIONS.md](docs/DECISIONS.md) — architecture decision log (WHAT/WHY/HOW/Alternatives/Status)

Original single-file specs are kept at the repository root:
- `AI_VIDEO_STUDIO_MASTER_SPEC.md`
- `AI_VIDEO_STUDIO_MASTER_DOCUMENTATION.docx` (same content, Word format)

## How to work on this project

Read [AGENTS.md](AGENTS.md) first. It defines the mandatory workflow (inspect → Graphify → skills → plan → implement → verify → review → report).

## Baseline target hardware

HP Pavilion 15 · Intel Core i7 10th Gen · 16 GB RAM · NVIDIA MX250 2 GB · Intel integrated graphics.
Design requires CPU fallback, lightweight models and proxy previews.