# Implementation Plan: M3 — Semantic image matching (first slice)

## Overview

Narration transcript + candidate images → auto-placed, timed, editable image track, using CLIP embeddings
(ONNX, project-local) per the human decisions (spec: `docs/SPEC-image-matching.md`). Build order:
`embedding-core` → `match-api` → `beat-segmentation` → `semantic-matching` → `match-ui`.

## Architecture decisions

- CLIP ViT-B/32 ONNX (Xenova export) lazy-downloaded to `models/clip/`; `Embedder` interface keeps tests
  deterministic (`FakeEmbedder`, same pattern as `FakeTranscriber`).
- One round trip: `POST /api/match` (multipart images + JSON beats) returns `{ assignments, alternatives, timings }`.
- Beats are computed **frontend-side** in pure TS from the M2 transcript (sentence/segment ends + pause ≥0.4s).
- Auto-match applies clips through the editor store wrapped in zundo `pause()/resume()` → **one undo step**.
- Match meta persists as optional `clip.beatId` + existing `clip.confidence` (version stays 1, D-011 pattern).
- New backend dependency: `Pillow` (Ask-first, required by CLIP preprocessing; user approved CLIP approach).

## Task list (vertical slices, each committed atomically)

### Slice 1 — embedding-core (backend, TDD)
- [ ] `clip.py`: lazy ONNX `Embedder` (load `models/clip/` files), Pillow preprocess (resize/center-crop/normalize),
      CLIP text encode (HF tokenizer.json via `tokenizers`), cosine + softmax helpers
- [ ] Tests: preprocess shape, text truncation, cosine/softmax edge cases (real model NOT in unit tests)
- [ ] Real-model smoke (manual): tiny image + text through `Embedder` on this machine (onnxruntime 1.17.3 opset check)
- [ ] Verify: `uv run pytest backend/tests/test_clip.py`, `uv add Pillow`, model download path gitignored

### Slice 2 — match-api (backend, TDD)
- [ ] `matching.py`: `POST /api/match` — multipart images + JSON `{ beats: [{id,text,start,end}] }` →
      per-beat best image + confidence + top-3 alternatives + beat timings; repetition penalty (reuse-aware greedy)
- [ ] Injectable `Embedder`; error codes `NO_IMAGES`/`NO_BEATS`/`EMBED_FAILED`/`MATCH_FAILED` via `ApiError`
- [ ] Tests: contract shape, repetition penalty, empty beats, corrupt image → 4xx, deterministic fake embeddings
- [ ] Verify: `uv run pytest backend/tests/test_matching.py` green; full backend suite

### Slice 3 — beat-segmentation (frontend, pure, TDD)
- [ ] `editor/beats.ts`: transcript → beats (group segments; boundary at sentence end or pause ≥ 0.4s; merge tiny segs)
- [ ] Tests: sentence boundaries, pause threshold, single-segment, mixed-language fallthrough
- [ ] Verify: `cd frontend && npx vitest run src/editor/beats.test.ts`

### Slice 4 — semantic-matching (frontend)
- [ ] `services/match.ts`: client (`FormData` images + JSON beats), parse/validate result, error mapping (`VoiceError`-style `MatchError`)
- [ ] `store/matchingStore.ts`: transient status per project; action `autoMatch()` — gather image Files + transcript →
      POST → build Clip patches → apply image-track clips in one undo step + set `clip.beatId`/`confidence`
- [ ] `editor/types.ts` Clip gains optional `beatId`; `project.ts` passthrough (backward compatible, version stays 1)
- [ ] Tests: autoMatch single-undo-step, undo restores exact prior timeline, persistence round-trip, apply respects existing user clips on the image track
- [ ] Verify: vitest + build + oxlint green

### Slice 5 — matching-ui
- [ ] `MatchPanel` (Inspector): Auto-match button (needs in-session image+voice Files), idle/analyzing/error/success states,
      no-fit message (repetition/all-used), per-clip confidence badge + alternatives dropdown (replace existing clip)
- [ ] CSS `.match-*` block (tokens), keyboard access, existing `clip-actions` reuse
- [ ] Verify: build + lint + tests green; dev-server transform smoke

### Slice 6 — docs, review, push
- [ ] ROADMAP M3 partial checkboxes, FEATURES §3 status, DECISIONS D-012 (CLIP) + D-013 (match persistence), ARCHITECTURE §9 endpoint, SESSION_LOG Session 6
- [ ] graphify update; code-review-and-quality pass (real `clip.py` + undo path scrutiny); push

## Checkpoints

- [ ] After Slice 1: real-model Embedder smoke passes on this machine (opset/onnxruntime compat proven)
- [ ] After Slice 2-3: backend + frontend focused suites green
- [ ] After Slice 4: undo-restores-timeline test green; persistence round-trip green
- [ ] After Slice 5: dev transform smoke; human browser pass (auto-match feel) documented
- [ ] After Slice 6: full suites + docs + review + push

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| ONNX clip graph (INT8) incompatible with onnxruntime 1.17.3 on mac x86_64 | High | Slice 1 real-model smoke first; fallback fp32 model (larger download), documented |
| Model download ~100–350MB slow/fails first run | Med | Lazy, project-local, logged; size stated in UI hint; resume not needed (single fetch) |
| Urdu/roman-urdu beat text → weak embeddings | Med | Accepted (decision 3); English/keyword labels dominate; multilingual model flagged for tuning pass |
| Auto-match clashes with user-placed image clips | Med | Apply only to empty/short image stretches; skip occupied beats → report skipped; never overwrite |
| Blob URLs not visible to backend (files re-upload) | Low | In-session Files required (same D-009 limitation); re-import note in UI |
| Repetition penalty constant is a guess | Low | Exposed constant; calibration deferred to M4/hardware pass |

## Open questions

- None until Slice 1 smoke results. Pillow ratified by CLIP decision; penalty/threshold calibration deferred.