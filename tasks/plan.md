# Implementation Plan: M3 — Semantic image matching (first slice)

## Overview

Narration transcript + candidate images → auto-placed, timed, editable image track, using CLIP embeddings
(ONNX, project-local) per the human decisions (spec: `docs/SPEC-image-matching.md`). Build order:
`embedding-core` → `match-api` → `beat-segmentation` → `semantic-matching` → `match-ui` → docs/review/push.

## Architecture decisions

- CLIP ViT-B/32 ONNX (Xenova export) lazy-downloaded to `models/clip/`; `Embedder` interface keeps tests
  deterministic (`FakeEmbedder`, same pattern as `FakeTranscriber`). **fp32 default** (quantized export has
  degenerate text embeddings — D-012); `model_key` override.
- One round trip: `POST /api/match` (multipart images + JSON beats) returns `{ beats: [{ beatId, imageKey,
  confidence, start, end, alternatives[] }] }`.
- Beats are computed **frontend-side** in pure TS from the M2 transcript (sentence/segment ends + pause ≥0.4s).
- Auto-match applies clips through the editor store wrapped in zundo `pause()/resume()` → **one undo step**.
- Match meta persists as optional `clip.beatId` + existing `clip.confidence` (version stays 1, D-011/D-013 pattern).
- New backend dependency: `Pillow` (cp312, ratified by CLIP decision).

## Task list (vertical slices, each committed atomically)

### Slice 1 — embedding-core (backend, TDD)
- [x] `clip.py`: lazy ONNX `Embedder` (load `models/clip/` files), Pillow preprocess (resize/center-crop/normalize),
      CLIP text encode (HF tokenizer.json via `tokenizers`), cosine + softmax helpers
- [x] Tests: preprocess shape, text truncation, cosine/softmax edge cases (real model NOT in unit tests)
- [x] Real-model smoke (manual): tiny image + text through `Embedder` on this machine (onnxruntime 1.17.3 opset check; quantized→fp32)
- [x] Verify: `uv run pytest backend/tests/test_clip.py`, `uv add Pillow` (12.3.0), model download under root `models/` (gitignored)
      — commit `5d71c5e`

### Slice 2 — match-api (backend, TDD)
- [x] `matching.py`: `POST /api/match` — multipart images + JSON `{ beats: [{id,text,start,end}] }` →
      per-beat best image + confidence + top-3 alternatives + beat timings; repetition penalty (reuse-aware greedy)
- [x] Injectable `Embedder`; error codes `NO_IMAGES`/`NO_BEATS`/`EMBED_FAILED`/`MATCH_FAILED` via `ApiError`
- [x] Tests: contract shape, repetition penalty, empty beats, corrupt image → 4xx, deterministic fake embeddings
- [x] Verify: `uv run pytest backend/tests/test_matching.py` green; full backend suite; real e2e ordering — commit `6fa73ef`

### Slice 3 — beat-segmentation (frontend, pure, TDD)
- [x] `editor/beats.ts`: transcript → beats (group segments; boundary at sentence end or pause ≥ 0.4s; merge tiny segs)
- [x] Tests: sentence boundaries, pause threshold, single-segment, mixed-language fallthrough
- [x] Verify: `cd frontend && npx vitest run src/editor/beats.test.ts` — commit `5491de1`

### Slice 4 — semantic-matching (frontend)
- [x] `services/match.ts`: client (`FormData` images + JSON beats), parse/validate result, error mapping (`MatchError`)
- [x] `store/matchingStore.ts`: transient status per project; action `match()` — gather image Files + beats →
      POST → build Clip patches → apply image-track clips in one undo step + set `clip.beatId`/`confidence`
- [x] `editor/types.ts` Clip gains optional `beatId`; `project.ts` passthrough (backward compatible, version stays 1)
- [x] Tests: autoMatch single-undo-step, undo restores exact prior timeline, persistence round-trip, apply respects existing user clips on the image track
- [x] Verify: vitest (70) + build + oxlint green — commit `9711416`

### Slice 5 — matching-ui
- [x] `MatchPanel` (Inspector): Auto-match button (needs in-session image+voice Files), idle/analyzing/error/success states,
      re-import hint, per-clip confidence badge + alternatives dropdown (replace existing clip)
- [x] CSS `.match-*` block (tokens), keyboard access (native button/select)
- [x] Verify: build + lint + tests green; dev-server transform smoke 200; real-CLIP HTTP e2e — commit `a992b0b`

### Slice 6 — docs, review, push
- [x] ROADMAP M3 checkboxes, FEATURES §3 status, DECISIONS D-012/D-013, ARCHITECTURE §9 endpoint, TEST_PLAN §5.2, SESSION_LOG Session 6, backend README
- [x] graphify update; full regression (backend 56, frontend 70)
- [x] code-review pass noted; push 7 commits — **on user go-ahead**

## Checkpoints

- [x] After Slice 1: real-model Embedder smoke passes (opset compat proven; quantized→fp32 course-corrected)
- [x] After Slice 2-3: backend + frontend focused suites green
- [x] After Slice 4: undo-restores-timeline test green; persistence round-trip green
- [x] After Slice 5: dev transform smoke; real-CLIP HTTP e2e documented
- [x] After Slice 6: full suites + docs + review + push (push pending user go-ahead)

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| ONNX clip graph (INT8) incompatible/degenerate with onnxruntime 1.17.3 on mac x86_64 | High | Resolved in Slice 1 smoke: quantized export yields degenerate text embeddings → **fp32 default**, documented (D-012) |
| Model download ~600MB+ slow/fails first run | Med | Lazy, project-local, logged; single fetch, no resume needed |
| Urdu/roman-urdu beat text → weak embeddings | Med | Accepted (decision 3); English/keyword labels dominate; multilingual model flagged for tuning pass |
| Auto-match clashes with user-placed image clips | Med | Replace only clips from the *last* match (`lastMatchClipIds`); never overwrite manual edits |
| Blob URLs not visible to backend (files re-upload) | Low | In-session Files required (D-009 limitation); re-import note in UI |
| Repetition penalty constant is a guess | Low | Exposed constant; calibration deferred to M4/hardware pass |

## Open questions

- Resolved: Pillow (12.3.0) ratified; quantized-vs-fp32 resolved to fp32 (D-012); penalty/threshold calibration
  deferred to M4; multilingual matching quality = tuning pass after slice pushes.