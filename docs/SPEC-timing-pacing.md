# Spec: Timing fit + manual timing override (M3 remainder, slice-set B)

## Objective

Difference between a demo and the differentiator: matched images currently use **exact beat timing forever**,
and a re-run silently resets any trim/move the user applied to a matched clip. Two problems, one slice-set:

1. **Never silently overwrite user edits** (product rule): if a user trimmed, moved, or re-duration'd a
   matched clip, the next Auto-match must keep their timing, only swapping the image as needed.
2. **Pacing rules are absent** (pipeline step 10 "image duration from narration timing and pacing rules"):
   ultra-short beats can produce unreadable flashes, and nothing settles the final image after the narration
   ends. Pacing must respect **sync-first** (differentiator #1) and **clean adjacency** (transition rules).

Scope excludes: multilingual matching quality (separate pass, needs a different model), UI for locking,
overlap resolution across user-placed clips, and duration knobs in the transport/export surface.

## Concepts

- **Beat timing**: the `{ start, end }` the match response returned for a beat; equals the narration
  time-span of that beat. Auto-placed clips are sized to it.
- **Manual timing override**: a matched clip whose `start` or `duration` differs from its recorded beat
  timing by more than `TIMING_EPSILON` (0.01s). Detected from the previous match response, no new UI flag.
- **Pacing refinements** (edges only, so sync/clean-adjacency are preserved):
  - `MIN_AUTO_DURATION = 0.5s` floor: a final-image clip shorter than the floor is extended only into
    trailing airtime (after the last beat), never into a neighbour's narration slot.
  - `TAIL_HOLD = 0.3s` settle: after the last beat, the final image lingers up to 0.3s (or until airtime
    runs out) instead of cutting hard at narration end.
  - Interior beats are untouched — extending them would desync speech from visuals.

## Behaviour (acceptance criteria)

1. **Rerun preserves manual timing**: user trims/moves a matched clip, reruns Auto-match →
   the new clip for that beat keeps the user's `start`/`duration`; the image may change. One undo step.
2. **Rerun refits untouched clips**: a matched clip left alone follows the new beat timing/response.
3. **Kept-override count**: success status reports how many timing overrides were preserved; MatchPanel
   shows "N timing override(s) kept — undo anytime".
4. **Floor + tail settle**: auto-placement applies `MIN_AUTO_DURATION` and `TAIL_HOLD` only where trail
   airtime exists (purely compute-able from the beat list + region end). Interior beat clips never extend.
5. **Single undo step unchanged**: whole match including preserved timings is one zundo step.

## Commands

- Backend untouched (`cd backend && uv run pytest` — expect 56, unchanged).
- Frontend: `cd frontend && npx vitest run && npm run build && npx oxlint src`
- Dev smoke: `npm run dev` → `curl 127.0.0.1` fails, use `localhost:5173`; kill via `lsof -ti :5173 | xargs kill`.

## Project structure

- `frontend/src/editor/timing.ts` (new, pure) — `TIMING_EPSILON`, `MIN_AUTO_DURATION`, `TAIL_HOLD`,
  `hasTimingOverride(clientBeats)`, `applyPacing(beat, regionEnd)`, and a helper to compare recorded vs actual.
- `frontend/src/editor/timing.test.ts` (new) — pure tests, no store.
- `frontend/src/store/matchingStore.ts` — capture overrides from previous response before apply; pass into
  input building; success status gains `kept`.
- `frontend/src/store/matchingStore.test.ts` — rerun-preserves-trim/move, refit-untouched, kept count, one undo step.
- `frontend/src/components/MatchPanel.tsx` — kept-overrides note (mirror existing `transcript-hint`).

## Code style

Same as `beats.ts`/`matchingStore.ts`: typed pure helpers first, getState() actions, no `any`, single-quote,
semi:false, printWidth 100, prettier on new files. CSS via existing tokens.

## Testing strategy

- Pure timing math → unit (`timing.test.ts`).
- Store behaviour → zustand test with fake match fetch (existing pattern): trim→rerun keeps start/duration;
  move→rerun keeps; untouched→refitted; `kept` count; whole flow = one undo step (reuse existing helpers).
- Real-server smoke unchanged (matching behaviour untouched server-side).

## Boundaries

- Always: run vitest/build/lint before commit; commit atomically per slice.
- Ask first: changing `MIN_AUTO_DURATION`/`TAIL_HOLD` defaults on device, adding deps, backend changes.
- Never: apply pacing to interior beats (breaks sync), remove/replace user-placed (non-last-match) clips,
  persist override state into the project file (transient derivation only).

## Success criteria

- Trimmed/moved matched clips survive a rerun with identical `start`/`duration` (test, single undo step).
- Untouched matched clips follow the new response timings.
- MatchPanel surfaces the kept count; status typing covers `kept`.
- `npx vitest run` / `npm run build` / `npx oxlint src` green; backend suite untouched at 56.

## Open questions

- None blocking. Beat ids are positional (`b0…bn`); after a transcript edit, a preserved override may carry
  onto a different beat position — documented limitation, fixed properly by stable beat ids in a later pass.