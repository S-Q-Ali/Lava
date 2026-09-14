# M9 — Hardware Validation Measurement Log (D-036)

Final proof gate for M9 hardware validation. Records the measurement checklist
and results per machine. The two machines are the **baseline target** (HP
Pavilion 15, the machine Lava Studio is tuned for) and the **reference machine**
(the dev Mac where the suite is authored).

Measurement mandate (PRODUCT_SPEC section 15 / TEST_PLAN section 6): demo
workflows must run acceptably on the baseline. If a row fails its bound (set in
Slice 3 / CONSTRAINTS.md), the fix is recorded in SESSION_LOG and the row is
re-measured before M9 is declared complete.

## How to reproduce any row

```bash
# identical on both machines, from the repo root
backend/.venv/bin/python tools/m9-macro-bench.py
```

The script (`tools/m9-macro-bench.py`) drives the real backend modules —
Pillow proxies and FFmpeg renders via the sidecar's own `lava_backend.proxy`
and `lava_backend.media`. Render passes use 1280x720 at 10 fps to keep a single
benchmark pass under about two minutes even on the weak baseline.

## Checklist

1. Sidecar cold import (no model bytes post-D-034).
2. Image proxy generation, 4000x6000 manhwa strip -> WebP.
3. Video proxy generation from a 1080p source (12 s clip here; the proxy is
   capped at 120 s / 480 px height / 15 fps by design).
4. Preview render: 5 image clips, 3 s each, 1280x720@10fps, no transitions.
5. Full render: 10 clips, 2 s each, dissolve transitions + captions + motion,
   1280x720@10fps.
6. Memory peak during each phase (see below).
7. Frontend LCP (Lighthouse when feasible, else manual timing).

## Memory peak — how to snapshot

- Backend phases: watch the `backend/.venv/bin/python` process (or the
  `ffmpeg` child while Item 5 is etching) in Activity Monitor (Mac) / Task
  Manager (Windows) and record the peak resident set. Note the background
  baseline: idle sidecar holds only the Cache that models have created so far.
- Frontend: open the DevTools Performance panel, run one preview render, record
  the JS heap peak and LCP marker.

## Reference machine results — dev Mac

Logged 2026-09-14, `tools/m9-macro-bench.py` head, macOS-26.6.2 x86_64,
16 threads, Node 22 (frontend numbers: 1.9 s script parse, heap < 120 MB on a
30-clip project — informal).

| item | time |
|------|------|
| Sidecar cold import (no models post-D-034) | 0.50 s |
| Image proxy 4000x6000 (-> 480x720 WebP) | 0.11 s |
| Video proxy 1080p source -> 593 KB MP4 | 0.44 s |
| Preview render 5 x 3 s frames 1280x720@10fps | 1.11 s |
| Full render 10 clips + dissolve + captions + motion | 2.47 s |

Memory peak during full render: ~600 MB driver RSS (rehosted from the
benchmark process) — dominated by the 1280x720*10fps encode buffers, flat per
phase; no phase materialises the full source in RAM (proxy/export slicing from
D-035).

## Baseline target results — HP Pavilion 15

Pending. Run the same block above on the HP (`HP Pavilion 15, Intel i7-10th,
16 GB RAM, NVIDIA MX250 2 GB`). If any row is out of bounds (see CONSTRAINTS
"Declared, tools pending" / measured gates), STOP — record the failing row here,
fix in a follow-up slice, re-measure, then mark M9 complete.

| item | time |
|------|------|
| Sidecar cold import (no models post-D-034) | TBD |
| Image proxy 4000x6000 (-> 480x720 WebP) | TBD |
| Video proxy 1080p source | TBD |
| Preview render 5 x 3 s frames 1280x720@10fps | TBD |
| Full render 10 clips + dissolve + captions + motion | TBD |