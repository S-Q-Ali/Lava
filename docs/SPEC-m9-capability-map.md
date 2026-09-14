# Capability Map: M9 Hardware Validation

## Objective

Prove (and fix where needed) that Lava Studio runs acceptably on the baseline hardware:
HP Pavilion 15 · Intel i7 10th Gen · 16 GB RAM · NVIDIA MX250 2 GB.
This closes the open performance gap (DEFERRED M8 row) and the unmeasured
CONSTRAINTS rows. Four modules, each independently shippable; build order follows
dependency, not severity.

## Assumptions

1. **Baseline hardware is the HP Pavilion 15** (PRODUCT_SPEC §15). A second Mac
   dev machine exists; the HP is the performance-sanity gate.
2. **CPU-only path is the only path tested here.** MX250 VRAM is not consumed by
   any model today (CLIP/Whisper run on CPUExecutionProvider); GPU acceleration
   is out of scope.
3. **Proxy = low-res preview, not a different asset.** Full-resolution originals
   are always preserved; proxies are generated on demand and served for
   the preview stage only; render uses originals.
4. **Documented limitation is an acceptable outcome.** The DoD says "performance
   is acceptable for baseline hardware OR the limitation is documented" —
   module 4 gates on this.
5. **Existing test counts (backend 404, frontend 284) are the ratchet.** No
   regressions during any module.

## Modules

| Module id | Responsibility | Depends on | D-0xx |
|---|---|---|---|
| proxy-preview | Backend proxy generation (image thumbnail + video low-res proxy) served via API; frontend PreviewPanel uses proxies for display and raw originals only for render; React memoization on the 100ms playback tick. | — | D-033 |
| runtime-optimization | Lazy-load CLIP models (replace eager startup with first-use factory); offload FFmpeg render from the event loop (`run_in_threadpool`); configurable render timeouts; measure and gate the frontend bundle size baseline. | — | D-034 |
| memory-tuning | Manhwa strip streaming/lazy decode (avoid full `image.load()` on tall strips before analysis); export bundle disk-streamed zip (not in-memory); cache/backend GC policy; motion `scale*3` documented and/or configurable. | — | D-035 |
| baseline-validation | Run TEST_PLAN §6 on the real HP Pavilion: CPU fallback e2e, proxy preview, representative render time/memory bounds; enforce measured CONSTRAINTS rows; ROADMAP M9 complete + FEATURES block. | modules 1–3 | D-036 |

## Build order

proxy-preview → runtime-optimization → memory-tuning → baseline-validation

Modules 1–3 are independent and could be built in parallel; the build order
above is the one chosen for implementation coherence (proxy-preview touches the
most user-visible surface; runtime-optimization fixes a startup correctness
risk; memory-tuning addresses worst-case paths; validation is the final gate).

## What is NOT in M9 (explicit deferrals)

- **Proxy video transcode quality tuning** (low-res MP4 is sufficient for
  baseline preview; fine-tuning is M10 polish).
- **Web Worker offload for ASR/CLIP** (lazy-load + CPU fallback is sufficient
  for baseline; web-worker sharding is a future optimization).
- **Chunked/streaming render** (the single-shot FFmpeg pipeline is acceptable
  at baseline project sizes; streaming is an M10 architecture concern).
- **GPU acceleration paths** (out of scope — CPU fallback is the product rule).
- **Responsive/resolution-adaptive UI layout** (the fixed layout is baseline-
  appropriate; responsive breakpoints are an M10 UI concern).

## Gate

Map approved → per-module SPEC → PLAN → TODO → slices (TDD) → docs (D-0xx,
ROADMAP M9, FEATURES §10, SESSION_LOG, graphify) → regression → commit on
go-ahead → push. Module 4 is the final gate: run on real HP, document bounds,
enforce CONSTRAINTS rows.
