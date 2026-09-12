# Spec: `transitions-render` — transitions in the FFmpeg render pipeline

M4 module 2 (map: `docs/SPEC-m4-capability-map.md`, after `transitions-core`). Scope: **backend only** —
take validated transition objects from the render request and produce an FFmpeg `filter_complex` graph
(dissolve/fade-between = `xfade`, edge fades = `fade` filter, match/cut = plain concat) with correct
offsets/duration. The **frontend client** changes that send transitions live in `transitions-ui`; the
API contract is defined here.

## Objective

A project containing transitions renders them: between-transitions overlap the two adjacent clips, edge
fades ease the very start/end of the video, and everything else stays a clean cut — rendering cost stays
CPU-lights and the output matches the `transitions-core` semantics (duration = Σ clip durations − Σ
between-transition durations; edges cost no extra duration).

## Data contract (backend)

```py
@dataclass(frozen=True)
class BetweenSpec:
    first: int        # index into the ordered clip list of the outgoing clip
    second: int       # must equal first + 1 (consecutive inputs)
    type: str         # 'match' | 'dissolve' | 'fade' | 'wipe' | 'zoom'  (validated)
    duration: float   # seconds, 0.1–2, ≤ min(clip[first].duration, clip[second].duration)

@dataclass(frozen=True)
class EdgeSpec:
    at: str           # 'start' | 'end'
    index: int        # 0 for 'start', len(clips)-1 for 'end'
    duration: float   # seconds, 0.1–2, ≤ clip[index].duration
```

Rendered result: for a raw timeline of N clips with between-transitions, the output is a single stream
built by folding over adjacent pairs. Input stream `[i:v]` is prepared exactly as today
(fps/scale/pad/trim/setpts) plus optional edge-fade filters, then:

- pair with **no between-transition** (or `match`): concat the two accumulated streams → labelled temp;
- pair with `dissolve` → `xfade=transition=fade:duration=D:offset=O`;
- pair with `fade` → `xfade=transition=fadeblack:duration=D:offset=O`;
- `wipe`/`zoom` between → render error `TRANSITION_UNSUPPORTED` (template-only, no template renderer yet);
- edge `start` → append `fade=t=in:st=0:d=D` to stream 0; edge `end` → `fade=t=out:st=(dur-D):d=D` to the last stream.

`xfade` offsets (pure): `offset_k = Σ_{i<k} dur_i − Σ_{j<k} D_j` for the k-th between-transition (1-indexed),
with `k` counting *between-transitions only*; matches fold order. Final duration = `Σ dur_i − Σ D_j`.
`match` consumes no duration and adds no filter.

## Behaviour / acceptance

1. No transitions → byte-identical filter string and behaviour to today (regression parity).
2. `dissolve`/`fade` between consecutive clips → correct `xfade` transition name, offset formula verified
   for one and multiple chained transitions; total duration reduces by ΣD_j.
3. Edge fades applied only at stream 0 (in) and last stream (out) with correct `fade` `st`/`d`.
4. Mixed graph (transitioned pair + plain pair) folds correctly via nested concat labels.
5. `wipe`/`zoom` → 422 `TRANSITION_UNSUPPORTED`; non-consecutive indices / out-of-range duration / index
   off the allowed edge → 422 `TRANSITION_INVALID` with a clear message; malformed JSON body → 422
   `INVALID_BODY`.
6. `POST /api/render` accepts an optional `transitions` form field (JSON list) alongside `clips`/`settings`.

## Commands

- Test: `cd backend && uv run pytest tests/test_render.py -q` (and full `uv run pytest`)
- Real smoke: unit-tested graph via project-local ffmpeg (`tools/ffmpeg`) — two-image dissolve, probe the
  rendered duration ≈ `d0 + d1 − D`.

## Structure / files

- `backend/src/lava_backend/media.py` — `BetweenSpec`/`EdgeSpec`, `xfade_name`, pure
  `build_transition_graph(clips, transitions) -> (filter_complex, total_duration)` (feature-flag-free,
  mirrors the existing `_filter_complex` shape tests can assert on), `render(..., transitions=())`.
- `backend/src/lava_backend/main.py` — optional `transitions` form field, parse + validate into specs,
  pass to `render`.
- `backend/tests/test_render.py` (+ pure tests file for the graph builder if it grows).
- Docs: D-017, ROADMAP M4 tick, FEATURES §4, SESSION_LOG 10.

## Code style

Follow `media.py` (frozen dataclasses, f-string filter strings, `ApiError` raised not returned, no
mutation of inputs). Filter names/offsets are the only magic numbers — named constants.

## Testing strategy

- Unit (no ffmpeg): graph strings — parity with today's concat when empty/all-match; xfade names +
  offsets (1 and 2 chained); edge fade `st`/`d`; mixed nested concat+xfade; duration arithmetic;
  validation errors (indexes, duration bounds).
- Integration (project-local ffmpeg): render two images with a dissolve over HTTP → 200, output probes
  `duration ≈ 4.5` for two 2.5s clips with 0.5s dissolve; wipe → 422 `TRANSITION_UNSUPPORTED`.
- Full regression: backend stays green (−not run unless changed) 63 → ~78.

## Boundaries

- Always: TDD red-green; parity string when no transitions; exact error codes; no new deps (FFmpeg is
  already project-local); duration math must equal `Σ dur_i − Σ D_j`.
- Ask first: new transition visual modes beyond the mapping table, edge fade limits beyond stream 0/last,
  changing the render HTTP contract shape.
- Never: transitions that reduce visual duration below clip semantics (no negative overlap beyond
  validation), auto-inventing transitions backend-side (frontend sends only validated specs), touching
  `transitions-core` from here (indices summary only).

## Success criteria

- Pure graph builder + integration tests green; full backend suite green; `/api/render` with a dissolve
  HTTP e2e produces a playable mp4 of correct duration; unsupported/illegal cases return the exact codes;
  docs committed; pushed on go-ahead.