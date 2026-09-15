# AI Video Studio — Session Log

This file is the durable, cross-session record of what was done, how it was done, and why. It is the continuity mechanism for compacted or fresh sessions: when previous context is gone, this log — together with `DECISIONS.md`, `ROADMAP.md` and `graphify-out/` — tells the next session where things stand.

Rules:
- Append a new entry at the end of every substantial working session. Never rewrite old entries.
- Update the "Next step" of the previous entry if done, but keep the historical record intact.
- Keep entries factual and specific enough that a cold session can resume without the chat history.

---

## Template

```
## Session YYYY-MM-DD — <short title>
### Purpose (WHY)
<why this session ran>
### WHAT
- <files created/changed + behavior implemented>
### HOW
- <approaches, libraries, tooling, gotchas>
### Decisions
- <decisions + one-line why, full detail in DECISIONS.md>
### Verify
- Tests: <n> pass / <n> fail · Build: ok/fail · Lint: ok/fail
### Limitations
- <known gaps>
### Next step
- <where to resume>
```

---

## Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation

### Purpose (WHY)
The repo was documentation-first (original code removed from the Lava clone). This session turned it into a running project: bootstrapped the tooling required to build ("Milestone 0"), then shipped the first usable slice of a real editor — the media foundation ("Milestone 1 first slice") — so subsequent milestones have a working base to build on.

### WHAT
- **Repo restructure** — created module directories per `docs/ARCHITECTURE.md` (`audio/`, `backend/`, `captions/`, `manhwa/`, `media/`, `models/`, `timeline/`, `tools/ffmpeg/`, `scripts/`, `tests/`, `projects/`, `cache/`, `temp/`, `graphify-out/`) with `.gitkeep` placeholders; rewrote `.gitignore` (runtime data ignored, `.gitkeep` kept, `graphify-out` committed except `cost.json`).
- **Docs** — created `docs/` (PRODUCT_SPEC, ARCHITECTURE, FEATURES, UI_SPEC, TEST_PLAN, ROADMAP); master specs kept at repo root.
- **AGENTS.md** — documentation index, agent-skills intent→skill mapping, Graphify rules.
- **Config** — `studio.config.json` (local-first dirs, FFmpeg bin path, preview proxy, backend host/port); `.graphifyignore`.
- **Skills** — cloned `tools/agent-skills/` + `tools/anthropic-skills/` (reference packs); curated 12 skills into `.opencode/skills/` + shared checklists into `.opencode/references/`.
- **Graphify** — installed uv + graphifyy; `graphify install --project --platform opencode` (skill + plugin + AGENTS.md section + `.opencode/opencode.json`); built code-only graph (203 nodes, 314 edges, 13 communities) → `graphify-out/` (GRAPH_REPORT.md + graph.html).
- **FFmpeg** — `scripts/fetch-ffmpeg.mjs` (darwin/win32/linux static builds) bundles FFmpeg 9.0.1 (+ ffprobe) into `tools/ffmpeg/bin/`.
- **Frontend** — scaffolded `frontend/` (Vite 8 + React 19 + TS ~6, oxlint, Zustand 5, Zundo 2.3, Vitest 5). Implemented:
  - `src/editor/types.ts` + `ops.ts` — timeline model + pure operations (add/remove/move/trim/split/duplicate/replace/clipsAtTime/projectDuration).
  - `src/store/editorStore.ts` — Zustand store with Zundo temporal undo/redo (limit 100, partializes tracks/assets/clips).
  - Timeline UI `src/components/timeline/` — `scale.ts`, `TimelinePanel`, `TrackRow`, `ClipBlock`; 7 spec tracks, playhead, split/delete/select.
  - `src/media/importer.ts` — web importer (image/video/audio + metadata) that drops the imported asset onto the timeline.
  - `src/components/PreviewPanel.tsx` — preview at playhead with play/rewind.
  - `src/components/MediaPanel.tsx`, `InspectorPanel.tsx`, `App`, `index.css`, `App.css`, `index.html` ("Lava — AI Video Studio").
  - `src/services/ffmpeg.ts` — provider abstraction with an `UnavailableFFmpegProvider` web stub (real render needs a native sidecar).
- **Tests** — `src/editor/ops.test.ts` (12) + `src/store/editorStore.test.ts` (5), all 17 passing.
- **Verify/fixes** — fixed build errors: relative import paths in TimelinePanel, missing `ClipBlock` import in TrackRow, `ops.Clip` namespace type error, Zundo undo/redo implicit-any, removed unused `useRef`/`dragRef` in ClipBlock; removed leftover Vite demo assets (react.svg, hero.png, vite.svg, icons.svg).
- **Graph check** — `graphify extract --code-only .` + `graphify cluster-only` after code landed.

### HOW
- Scaffolded with `create-vite` (target dir must be empty — removed placeholder dir first), then added Zustand/Zundo/Vitest deps.
- Zundo `partialize` + custom `equality` so playhead/selection changes don't pollute history (object-identity compare on clips/assets/tracks).
- FFmpeg download via Node web streams — must use `Readable.fromWeb(res.body)` and read the stream once.
- Graphify built code-only because no LLM API key was configured for the docs semantic pass; deferred.
- Node/browser runtime has no FFmpeg, so the FFmpeg wrapper is a swap-in provider abstraction; sidecar pending.

### Decisions
- Web-first Vite+React editor (no Tauri yet — no Rust toolchain; spec's CPU-fallback plan favors a web shell + local backend). [D-001]
- Zustand + Zundo for state + undo/redo. [D-002]
- Project-local FFmpeg binary. [D-003]
- FFmpeg provider abstraction (web stub now, sidecar later). [D-004]
- Skill vendor clones kept locally but gitignored; curated copies live in `.opencode/skills/`. [D-005]
- `graphify-out/` committed (cross-session continuity); semantic doc pass deferred until an API key exists. [D-006]
- Session log + decisions log created for compaction survival. [D-007]

### Verify
- Tests: 17 passed / 0 failed · Build: ok (tsc + vite) · Lint: ok (oxlint 0/0) · Preview server: HTTP 200.

### Limitations
- FFmpeg wrapper is a stub in the web build — probe/render needs the `backend/` sidecar (not started).
- Timeline drag-move/drag-trim UX not implemented; only split/delete/select.
- Project save/load to disk not implemented.
- ASR, matching, transitions, captions, Manhwa pipelines not started; `backend/` empty.
- Graphify semantic (docs/LLM) pass not run — no API key.

### Next step
- Choose next milestone slice: **(a)** `backend/` sidecar — FFmpeg probe/render over a local service (unblocks render, probe, project save/load), or **(b)** Milestone 2 voice analysis (ASR + timestamps + pauses + segmentation). Either continues from the working editor shell.
- Ongoing: keep this log + DECISIONS.md updated; commit per increment; run `graphify update .` after code changes.

---

## Session 2026-09-12 — Session 2: continuity system + commit discipline

### Purpose (WHY)
User asked for a durable session-history file tracking WHAT/HOW/WHY, the same factors baked into the project documentation, and maximized small commits. This session built the cross-session continuity system and turned the working tree into 9 atomic commits.

### WHAT
- **`docs/SESSION_LOG.md`** — created append-only session log with a template and the full entry for Session 1; this entry documents Session 2.
- **`docs/DECISIONS.md`** — created lightweight ADR log (WHAT/WHY/HOW/Alternatives/Status) with decisions D-001…D-007 + index table.
- **WHAT/WHY/HOW orientation** — added a "How to read this doc" block to PRODUCT_SPEC, ARCHITECTURE, FEATURES, UI_SPEC, TEST_PLAN, ROADMAP, plus missing rationale (ARCHITECTURE §8 design-decisions table referencing DECISIONS.md; FEATURES pillar intents; tech table corrected: frontend = Vite + React web-first, Tauri at M10).
- **`AGENTS.md`** — added SESSION_LOG + DECISIONS to the docs index and a "Session continuity" policy (append to SESSION_LOG at end of every session; commit small and often; Graphify tracks code state, the log tracks intent/history).
- **`README.md`** — docs list now includes SESSION_LOG and DECISIONS.
- **`.gitignore`** — ignored `.opencode/node_modules`, `graphify-out/cache/`, and fixed embedded-repo handling for `tools/agent-skills/`/`tools/anthropic-skills/` (whole-dir ignore prevents gitlink accidents).
- **Git identity** — repo-local `S-Q-Ali <syedqasim963@gmail.com>`.
- **9 atomic commits** (see `git log`): docs specs → module skeleton → opencode skills/plugin → graphify graph → ffmpeg fetch script → frontend feat → frontend test → vendor-dir ignore → graph refresh.

### HOW
- Skeleton commits preserve `.gitkeep` placeholders (git tracks files, not dirs).
- Vendor skill directories are embedded git repos — a `dir/*` ignore still lets git add them as gitlinks on explicit `git add <dir>`; the whole-directory `tools/agent-skills/` ignore is the correct pattern.
- Kept frontend implementation and test files in separate commits for auditability.

### Decisions
- No new architecture decisions; D-007 (session + decision logs) confirmed as active policy.

### Verify
- `git status` clean · 9 commits on `main` · frontend build ok · oxlint 0/0 · tests 17/17 pass · `graphify update .` refreshed the graph.

### Limitations
- SESSION_LOG lives at `docs/` — future sessions find it via AGENTS.md, not auto-loaded.
- Semantic Graphify pass for docs still deferred (no LLM API key).

### Next step
- Resume M1: `backend/` FFmpeg sidecar (probe/render, project save/load) or M2 voice analysis. Both build on the committed editor shell; see Session 1 above, `DECISIONS.md`, and `graphify query` for context.

---

## Session 2026-09-12 — Session 3: media sidecar (real rendering)

### Purpose (WHY)
M1 was the obvious next slice: the editor had the provider abstraction but no actual encode path. This session built `backend/` (FastAPI sidecar) so the web editor can genuinely render image/video clips to `mp4` with the project-local FFmpeg — the honest first step of "a real editor with rendering", reusing the abstraction from D-004.

### WHAT
- **`backend/`** — new FastAPI sidecar:
  - `pyproject.toml` (fastapi/uvicorn/pydantic/python-multipart; pytest+httpx dev; hatchling build backend).
  - `src/lava_backend/config.py` — resolves `studio.config.json` → local-first dirs + FFmpeg bin + host/port.
  - `src/lava_backend/errors.py` — single error shape `{ "error": { "code", "message" } }`.
  - `src/lava_backend/media.py` — ffprobe/ffmpeg subprocess helpers; render builds a filter graph (fps→scale→pad→setpts) + concat.
  - `src/lava_backend/main.py` — routes `GET /api/health`, `POST /api/probe`, `POST /api/render` (multipart upload → `mp4` in `cache/backend/renders/`), `GET /api/files/{jobId}`.
  - `tests/` — health (2), probe (4), render (6): single image, concat, serving, file-count mismatch, invalid duration, missing job.
- **`frontend/`** — `src/services/ffmpeg.ts` rewritten: typed `RenderInput`/`RenderResult`, `HttpFFmpegProvider` (FormData + JSON), auto-detection via `getFFmpegProvider()` with unavailable fallback, `resetFFmpegProvider()` for tests. Importer keeps a `File` registry (`registerAssetFile`/`getAssetFile`) so render can upload the original bytes. `PreviewPanel` gained a working **Render** button (busy/error/success video states).
- **Scripts** — `scripts/sidecar.sh` runs the sidecar (`PORT` overridable); `backend/README.md` documents run + API.
- **Docs** — ARCHITECTURE (tech table, §8 D-008, new §9 sidecar API), FEATURES (media foundation status), ROADMAP (M1 checkboxes + status line), DECISIONS (D-008 ADR), README status.

### HOW
- FastAPI TestClient for integration tests; real FFmpeg binaries exercised against lavfi-generated test images.
- Multipart render: browser has no file paths, so clips reference uploaded file names; render pairs files↔clips positionally; `src/` layout needed a hatchling `[build-system]` or uv couldn't editable-install the package.
- Errors surfaced to the UI with actionable copy; undetermined state avoided.

### Decisions
- D-008 — Media sidecar HTTP API (FastAPI) locked. Renders write under project-local `cache/backend/` (gitignored); single error contract everywhere.

### Verify
- Backend pytest: 12 passed / 0 failed · Frontend vitest: 24 passed / 0 failed · frontend build ok · oxlint 0/0 · Live smoke test: sidecar health + multipart render → valid MP4 (`file` = ISO Media/MP4) served with HTTP 200 · 13 commits on `main` since session 1.

### Limitations
- Render covers image/video tracks only — no audio mixing (voice/music/SFX) yet.
- No project save/load to disk; timeline drag/trim UX pending.
- Sidecar must be running for `Render`; detection auto-falls back to an explanatory message otherwise.
- Uploads accumulate in `cache/backend/` (no cleanup/GC yet).

### Next step
- M1 completion: project save/load to disk (project JSON + asset paths) and timeline drag/trim UX; then decide M2 (voice analysis) vs early audio mixing in render. Start the sidecar with `./scripts/sidecar.sh` for manual checks.

---

## Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)

### Purpose (WHY)
Milestone 1 (media foundation) needed to reach "done": the model and rendering were shipped, but the two remaining gaps — persisting a project and direct clip editing — are what make it feel like an editor rather than a demo. This session closed both, which also de-risks M2 (voice analysis) because projects are now durable.

### WHAT
- **Project files** — `editor/project.ts`: versioned envelope (`app: 'lava-studio'`, `projectVersion: 1`, `savedAt`, full `TimelineModel`); `serializeProject`/`toProjectJson`/`parseProjectJson` validate shape and throw `ProjectError` with clear messages. `services/projectIO.ts`: Blob download + `FileReader` helpers. Topbar got **Save** (downloads `lava-project-<ts>.lava.json`) and **Open** (hidden input + parse + load; corrupt files alert and never clobber the open project).
- **loadProject** — new store action hydrates tracks/assets/clips/playhead/selection and clears undo history. Fixed a latent zundo bug: `clear()` then `set()` records the pre-load state as an undo target, so `reset`/`loadProject` now wrap the set in `pause()`/`resume()` (`install` helper).
- **Clip editing gestures** — `ClipBlock` gained drag-move (grab body) and edge-trim (left/right handles on the selected clip). Gestures live-update while dragging and commit as exactly one undo step via the same zundo `pause`/`resume` pattern. Trims clamp to a 0.1 s minimum and to the source asset duration when known (asset meta wiring through `TimelinePanel` → `TrackRow` → `ClipBlock`).
- **CSS** — handles styled, `ew-resize` cursor, `dragging` visual state; the dragging flag moved from a ref to `useState` (oxlint: refs must not be read during render).

### HOW
- TDD for `project.ts` (9 tests) and `loadProject` (2 tests): wrote tests first, tripped on two real design bugs — the zundo clear-then-set history leak, and an error message that didn't match the exact `lava-studio` token grep expected.
- Gesture math uses the gesture-start snapshot (`baseStart`/`baseDuration`) plus live pointer delta so repeated `set`s don't accumulate drift; when paused, intermediate sets update state but never pollute history.
- Vite dev-server smoke: booted server, fetched `index` + all five touched modules (200 = successful transform).

### Decisions
- D-009 — Versioned `lava-studio` JSON project format, locked. Documented honest web limitation: media bytes are session-scoped (blob URLs); the file persists structure + metadata; Tauri will persist real paths.

### Verify
- Frontend: 35 tests pass (24 prior + 9 project + 2 loadProject) · build ok · oxlint 0/0 · Vite transform smoke 200s.
- Commits on `main`: `9f9c65e` (serialization) · `fb0c04a` (loadProject) · `7bbcfb2` (save/open UI) · `d1695a9` (drag-move + trim gestures) — plus this session's docs/graph commit to follow.

### Limitations
- Drag gestures are visual-editing only, no ripple: moving/trimming a clip leaves following clips in place; cross-track drag not implemented (horizontal move within one track only).
- Project files do not embed media bytes in this web build — reopening a project in a fresh session restores structure but not the audio/video/images (documented in D-009).
- Pointer-drag needs a human in-browser pass to confirm feel (logic is unit-covered; no component test harness installed).

### Next step
- M1 done → pick M2 (voice-over analysis: import narration audio, detect pauses, word timestamps) or M2-adjacent: audio mixing in render so voice/music/SFX actually reach the output. Candidates also include ripple-edit (M1 follow-up) when editing groups become annoying. Start sidecar (`./scripts/sidecar.sh`) for render/audio pre-checks.
## Session 2026-09-12 — Session 5: M2 voice analysis (first slice)

### Purpose (WHY)
First differentiator's front half — turn narration audio into timed, segmented, editable content. The user picked faster-whisper for ASR and scoped the slice to text-edit-only transcripts (timing edits deferred). Plan-of-record lives in `docs/SPEC-voice-analysis.md`; capability map: pause-segmentation → transcribe-api → transcript-state → transcript-ui.

### WHAT
- **Slice 1 (transcribe_core)** — `Word`/`Pause` dataclasses, pause threshold 0.3s default, gap rounding, logprob→confidence. 12 unit tests.
- **Slice 2 (transcribe-api)** — `POST /api/transcribe` (multipart `file` + optional `language`) via injectable `Transcriber`; `FakeTranscriber` for tests; response `{ text, language, segments[words], pauses }`; new errors `NO_FILE`/`TRANSCRIBE_FAILED`; tmp-file upload wire-up in `main.py` + `cache_dir` in config. 4 API tests. One real bug found: a test helper restored `app.state.transcriber` in a `finally` that ran *before* any request — dropped the restore; each test now sets its own transcriber.
- **Slice 3 (real engine)** — Python env pinned to **3.12** (onnxruntime ships macOS x86_64 wheels only ≤ `cp312`), `numpy<2` (onnxruntime 1.17.3 ABI), `faster-whisper`. `WhisperTranscriber`: CPU, int8, model `tiny`, lazy `WhisperModel` with `download_root` → `models/whisper/` (gitignored), word timestamps on. Live e2e on generated audio: model downloaded, endpoint returned 200 with correct shape; real narration e2e (`say`-generated m4a) → 200, 16 words, confidence 0.13–0.99, one 0.3s pause.
- **Slice 4 (state)** — `editor/types.ts` `Transcript*`; `editorStore` gains `transcripts: Record<assetId, Transcript>` (temporal — undoable), `setTranscript`, `updateTranscriptWord` (recomputes segment+full text); `services/voice.ts` client (`parseTranscript` normalizer + fetch); transient analysis status/errors in separate non-temporal `transcriptStore`; `project.ts` validates/persists optional `model.transcripts` (backward compatible, version stays 1).
- **Slice 5 (UI)** — `TranscriptPanel` in the Inspector for audio clips: Analyze button (only when the in-session File exists), analyzing/error/empty states, inline word inputs (click-word seeks playhead), ⏸ pause chips, low-confidence dashed underscore, per-segment time+confidence meta. CSS in a new `.transcript-*` block using existing design tokens.

### HOW
- per-slice TDD: core math → API contract → real adapter → store → UI; each slice committed atomically (`c94a881`, `2299ab6`, `9ac6aab`, `26c7b3f`, slice-5 commit). Skills loaded at their slots: spec-driven-development, test-driven-development, api-and-interface-design, frontend-ui-engineering.
- Two derived test fixes: shared module-level `model` was mutated by an earlier "malformed assets" test (fresh fixtures in new tests); a word-count mismatch in a transcript fixture (words now match text so recompute assertions hold).

### Decisions
- D-010 — faster-whisper (CPU int8, tiny default, project-local models), Python 3.12 + numpy<2 + onnxruntime pins. Locked.
- D-011 — transcripts persist inside `model.transcripts`, project version stays 1. Locked.

### Verify
- Backend: 28 pytest pass. Frontend: 47 vitest pass, `tsc -b` build ok, oxlint 0 warnings. Live sidecar + faster-whisper e2e (synthetic + narration) verified.
- Commits: `8abcd42` (spec+plan) · `c94a881` (core) · `2299ab6` (api) · `9ac6aab` (whisper) · `26c7b3f` (state) · slice-5 commit (UI) — docs/graph commit follows.

### Limitations
- `tiny` model quality is low for Urdu/Roman-Urdu narration (live test garbled text) — model-size knob exists; tuning is a documented open issue.
- Transcript editing is text-only: no word moves/timing edits, no automatic re-segmentation/beat-splitting after an edit (deferred to M3).
- Analyze needs the original File in-session (imported this session); reopening a saved project without media files can't re-analyze (nothing to upload). Same web limitation as D-009.
- Tests skip the real model (deterministic fakes); a human in-browser pass over the word-click/seek and low-confidence styling still pending.

### Next step
- Review the full M2 diff (code-review-and-quality), then push; M3 starts semantic beat segmentation (split narration into visual beats with timing), then image matching. Also on the radar: model-size tuning (base) for Urdu quality.

## Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)

### Purpose (WHY)
Deliver differentiator #1's front half: turn a narration transcript + image library into an auto-placed, timed, editable image track using CLIP embeddings, honouring the locked M3 decisions (project-local ONNX model, one-undo auto-place, no silently overwriting manual edits). Plan-of-record: `docs/SPEC-image-matching.md`, `tasks/plan.md` (slices 1–6, each committed atomically).

### WHAT
- **Slice 1 (embedding-core, `5d71c5e`)** — `backend/src/lava_backend/clip.py`: lazy `ClipEmbedder` (onnxruntime session + `tokenizers`, download into root `models/clip/`), Pillow 12.3.0 preprocess → (3,224,224), `tokenize_text` (bos/eot/pad, max 77), `l2_normalize`/`cosine_similarity`/`softmax`/`_pick` (outputs resolved via `session.get_outputs()` — ORT has no `.output_names`). 14 unit tests.
- **Slice 2 (match-api, `6fa73ef`)** — `matching.py`: `Beat` dataclass, `Matcher` (reuse-aware greedy, penalty 0.05, top-3 alternatives, `EmbedFailure` distinguishes embed vs assign), `POST /api/match` (multipart images + JSON beats; `File(default=[])` so a missing field hits `NO_IMAGES`), wiring `app.state.matcher` in `main.py` + `clip_dir` in `config.py`. 14 tests; real e2e: b1→sunset.png 0.342, b2→forest.png 0.353.
- **Slice 3 (beat-segmentation, `5491de1`)** — `frontend/src/editor/beats.ts`: `Beat`, `segmentBeats` (one beat per segment, split on intra-segment pause ≥ 0.4s, word labels, sorted by start). 8 tests.
- **Slice 4 (semantic-matching, `9711416`)** — `ClipInput.beatId`; `ops.ts` `addClips`/`replaceClips`; `services/match.ts` client (files named by assetId → `imageKey`==assetId); `matchingStore.ts` (status, `lastMatchClipIds`, `clear`); `editorStore.applyMatch(inputs, removeIds)` inside one zundo step. Fixed stale-snapshot bug (re-read `getState()` after apply). 5+15+5+15 tests; 70 frontend total.
- **Slice 5 (match-ui, `a992b0b`)** — `components/MatchPanel.tsx` (mirrors TranscriptPanel): Auto-match button, status lines (analyze-first / re-import / error), per-clip confidence %, alternatives `<select>` → `replaceClipAsset` single-undo; `InspectorPanel` + `.match-*` CSS tokens. Live HTTP e2e with real CLIP verified (warm-sunset→solar, green-forest→forest). Dev-server transform smoke 200s.
- **Slice 6 (docs+review, this commit)** — ROADMAP/FEATURES/ARCHITECTURE/DECISIONS(D-012,D-013)/TEST_PLAN/SESSION_LOG; graph refresh; full regression; prettier formatting of three test files.

### HOW
Per-slice TDD, each slice committed then re-verified (`56 passed` backend, `70 passed` frontend, build + oxlint clean). Real-model smoke drove two course corrections: (1) Xenova **quantized** export → degenerate text embeddings (cos 1.0) → **fp32 default** (`model_key` override); (2) model download location `backend/models` was NOT gitignored → moved to root `models/clip/`. Prettier (repo convention) applied to new test files.

### Decisions
- D-012 — CLIP ViT-B/32 ONNX fp32 default (quantized broken); project-local `models/`. Locked.
- D-013 — match meta persists as `clip.beatId` (+confidence); auto-match is one undoable step; re-runs replace only last-match clips. Locked.

### Verify
- Backend `uv run pytest`: 56 passed. Frontend: `npx vitest run` 70 passed, `npm run build` ok, `npx oxlint src` 0 warnings. Dev-server transforms 200. Real-CLIP HTTP e2e (server round-trip, correct causal picks, confidence spread) verified.
- Commits: `5d71c5e` (1) · `6fa73ef` (2) · `5491de1` (3) · `9711416` (4) · `a992b0b` (5) — this docs/graph commit closes the slice.

### Limitations
- Urdu/Roman-Urdu beat text → weak embeddings (decision 3 accepted; multilingual model flagged for a tuning pass). `tiny`-whisper quality persists from M2.
- Automatic duration/pacing rules not yet implemented (clips use beat timing; manual trims never overwritten by re-runs).
- Auto-match needs in-session image+voice Files (D-009 limitation) — re-import hint is in the panel.
- Repetition penalty (0.05) and pause threshold (0.4s) are initial guesses; calibration deferred to M4/hardware pass.
- English-only human in-browser pass on Auto-match/alternatives UI still pending.

### Next step
- Push M3 first slice (7 commits ahead of origin/main) once the user gives the go-ahead; then M3 remainder — timing/pacing rules, multilingual matching pass, manual-trim integration, and M4 transitions. Also on the radar: whisper model-size tuning (base) for Urdu.

## Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override

### Purpose (WHY)
Fix a product-rule violation and land pipeline step 10. After the M3 first slice, a re-run silently reset any
trim/move on matched clips ("Do not silently overwrite user edits" was broken), and image durations were exact
beat timing only — no pacing refinements existed. Spec + plan committed first (`0843a45`), user approved scope.

### WHAT
- **Slice 1 (timing-core, `0bace75`)** — `frontend/src/editor/timing.ts`: `TIMING_EPSILON` 0.01,
  `MIN_AUTO_DURATION` 0.5, `TAIL_HOLD` 0.3; `hasTimingOverride(clip, recorded)` (start/duration drift);
  `pacedEnd(beat, { isFinal, horizon, minDuration, tailHold })` — only the final beat extends, capped by
  horizon airtime. 11 tests. **Design correction mid-slice:** the planned regionEnd-inferred finality failed
  RED (interior vs final ambiguity) → explicit `isFinal` + `horizon`.
- **Slice 2 (store-override, `ca7f02b`)** — `matchingStore.match(assetIds, beats, { horizon })` captures
  overrides from `results`/`lastMatchClipIds` before `applyMatch`; `inputsFrom` applies override first else
  pacing; success status gains `kept: number`. Tests: trim→rerun preserves, move→rerun preserves,
  untouched→refits, kept count, undo restores exact pre-rerun timeline. Frontend 85 tests.
- **Slice 3 (panel-note, `3e52173`)** — MatchPanel success line reports kept overrides ("N timing
  override(s) kept — undo anytime"); passes `{ horizon: narration audio duration }` from asset
  `meta.duration`. Dev-server transform smoke 200 on all three new/touched modules.
- **Slice 4 (docs, this commit)** — D-014, ROADMAP M3 ticks, FEATURES §3, ARCHITECTURE gaps, plan/todo ticks,
  SPEC implementation notes, graph refresh.

### HOW
Red-Green per slice on the pure layer first (RED exposed the finality design flaw), then the store (tests
updated for the new `kept` field), then wiring — the same vertical pattern as M2/M3. All undos still one
zundo step because `applyMatch` keeps its `pause()/resume()` wrapper.

### Decisions
- D-014 — timing overrides survive re-matches via *transient derivation* (previous response + epsilon);
  no project/schema change; pacing floor/hold edges-only within narration airtime. Locked.

### Verify
- Frontend: `npx vitest run` 85 passed (70 → 85: +11 timing, +4 store), `npm run build` ok, oxlint 0 warnings.
- Backend: `uv run pytest` 56 passed — untouched this slice-set.
- Dev-server transforms: `MatchPanel.tsx`, `matchingStore.ts`, `timing.ts` all 200.
- Commits: `0843a45` (spec+plan) · `0bace75` (timing-core) · `ca7f02b` (store-override) · `3e52173` (panel-note) — docs/graph commit closes.

### Limitations
- Beat ids are positional — a transcript edit can carry a preserved override onto a different beat position
  (stable beat ids = open, later pass).
- Edge pacing only: a short beat *in the middle* of narration never gets a floor (correct for sync/clean
  adjacency, but the visual-hold trade-off is deliberately conservative).
- Horizon falls back to beat end when the audio asset has no `meta.duration` (no extension then).
- English-only in-browser feel check of the kept-note still pending; multilingual match quality untouched.

### Next step
- Push this slice-set (4 new commits) on user go-ahead; then M3 remainder — multilingual matching quality
  pass (needs a multilingual model decision), then M4 transitions. Stable beat ids + whisper base tuning stay
  on the radar.

---

## Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)

### WHAT
English-only CLIP misread non-English beats. The user manually downloaded the multilingual ONNX text
tower (`yashvardhan7/clip-ViT-B-32-multilingual-v1-onnx` → `models/clip-multilingual/`). I verified the
downloaded graph, then shipped an auto-selected **composed embedder**: images keep the existing fp32 CLIP
ViT-B/32 session, text swaps to the sentence-transformers multilingual DistilBERT tower
(`sentence_embedding` is already projected in the 512-d CLIP space). Wired at startup when the model dir
exists; otherwise behaviour is byte-identical to before. This closes the ROADMAP M3 checkbox.

### HOW
Spec+plan committed first (`d0ce01b`). TDD slice 1 (RED): `tokenize_multilingual` (WordPiece batch,
77-wide, PAD+mask), `_pick_by_names` (exact-name preference, falls back to last output), and
`MultilingualClipEmbedder(base, model_dir, session, tokenizer)` — lazy sessions, `text_embed` →
`input_ids`/`attention_mask` → `sentence_embedding` → L2. 7 new fakes-only unit tests; two layouts handled
for the module (`model.onnx` flat or `onnx/model.onnx` — the download's real layout caught this). Slice 2
wiring: `config.clip_multilingual_dir` + `main.py` auto-select. Slice 3 real smoke: UR script forest
0.284>0.222, EN 0.275>0.201, Roman-Urdu 0.241>0.228, UR noise tie — plus live `POST /api/match` 200 with
the Urdu beat resolving to forest.png.

### WHY
Mixed-language narration is a product requirement; alternatives were all worse (M-CLIP needs torch;
other exports missing preproc/bloated). Composing two ONNX sessions keeps the CPU/ONNX/local-first stack,
changes no API, and images stay untouched since both towers share the OpenAI CLIP image space.

### Decisions
- D-015 — composed two-session multilingual embedder; auto-select by folder presence; English fallback
  when absent. Locked.

### Verify
- Backend: `uv run pytest` 63 passed (56 → 63: +7 multilingual unit tests), no model files touched.
- Real-model smoke + live `/api/match` both green (scores above). Frontend untouched (85 tests remain).
- Commits: `d0ce01b` (spec+plan) · this doc/graph commit closes the slice.

### Limitations
- Roman-Urdu transliteration separates weakly from noise (scripted-tokenizer limitation; verified
  numerically, accepted — not a regression). Urdu-script works well.
- The multilingual folder is user-downloaded; machines without it get English-only parity (intended).
- `preprocessor_config.json` is NOT needed for the text-only tower (image preproc unchanged); no copy made.

### Next step
- Push this slice (spec+plan + this closing commit) on user go-ahead. Remaining radar: stable beat ids,
  whisper `base` tuning for Urdu ASR, in-browser feel-check of kept-note, M4 transitions.

---

## Session 2026-09-12 — Session 9: M4 module 1 — transitions-core

### WHAT
Started M4 via the spec-driven Phase 0 map (`docs/SPEC-m4-capability-map.md` — transitions-core →
transitions-render → transitions-ui → image-motion, approved). Then wrote + approved the first module's
spec (`docs/SPEC-transitions-core.md`). Shipped the model + heuristics + persistence: transitions are
typed objects (between/edge, 5 types, duration 0.1–2s, source, reason, rationale) on an optional
top-level `transitions` key (version still 1); a clean cut is the *absence* of a transition object.
Deterministic suggestions: same-asset continuity → match cut; ≥ 0.5s gap between matched beats →
dissolve; everything else stays cut; wipe/zoom never auto-suggested. Manual override/remove are pure ops.

### HOW
TDD per slice (4 commits): slice 1 model/constants/clamps (8 tests), slice 2 `evaluateTransitions`
heuristics, slice 3 `validateTransitions`/override/remove, slice 4 `TimelineModel.transitions` +
project round-trip + `isTransition` guard. One design fix mid-slice: validation edge logic was inverted
(start-edge = no sibling starts before; end-edge = no sibling ends after). Discovered a latent fixture
bug in existing tests (a test mutates the shared `model` via `serializeProject`'s reference), worked
around it with fresh fixtures.

### WHY
PRODUCT_SPEC §Transitions: favor clean cuts, explainable + editable decisions. Cut-as-absence keeps the
model honest; rationale strings make suggestions explainable in the UI module.

### Decisions
- D-016 — transitions as optional top-level list; cut = absence; default-clean heuristics; lock for M4.

### Verify
- Frontend: `npx vitest run` 118 passed (85 → 118), `npm run build` ok, oxlint 0/0. Backend untouched.
- Commits: `7d88051` (capability map) · `0141a89` (spec+plan+todo) · `8a7ab40` (slices 1-2) ·
  `0da2ad3` (slice 3) · `cae96cb` (slice 4) — this docs/graph commit closes.

### Limitations
- Heuristics are deliberately conservative — no dissolve/match on unlabeled sequences; image-motion and
  renderer transitions are separate modules, not yet built.
- Transition `rationale` strings are English only for now (UI module can localize later).
- Mixing between+edge transitions on the same boundary isn't collision-checked yet (validation covers
  duplicates and edge validity; cross-boundary checks are a `transitions-ui` concern).

### Next step
- Push on go-ahead; then `transitions-render` module (FFmpeg xfade/dissolve/fade with transition-aware
  clip offsets) — needs a fresh spec review. `transitions-ui` and `image-motion` follow.

---

## Session 2026-09-12 — Session 10: M4 module 2 — transitions-render

### WHAT
Render pipeline now produces actual transition effects via FFmpeg. `POST /api/render` accepts an optional
`transitions` JSON form field (between/edge specs by clip index). Between-transitions fold the ordered
clip list: `dissolve` → `xfade=fade`, `fade` → `xfade=fadeblack`; edges wrap the first/last stream with
`fade=t=in|out`; `match`/cut = plain concat (no duration cost); `wipe`/`zoom` rejected with
`TRANSITION_UNSUPPORTED`. Offset formula: `offset_k = Σdur(prev) − ΣD(prev)`; result duration =
`Σdur − ΣD`. The existing parity path is preserved when no renderable transitions exist.

### HOW
Pure graph builder (`build_transition_graph`) validated with 15 unit tests (offsets, parity,
validation errors, edge fold). Real-ffmpeg integration (3 tests): two-image dissolve → 3.5s,
edge fade keeps full duration, wipe → 422. HTTP tests (4): dissolve 201 + duration, wipe 422
`TRANSITION_UNSUPPORTED`, bad index → 422 `TRANSITION_INVALID`, malformed transitions → 422
`INVALID_BODY`. A mixed concat + xfade nested graph was verified as a real render (not just
assertion) — intermediate `concat=n=2` labels fed into a subsequent `xfade`.

### WHY
PRODUCT_SPEC §Transitions: "transition decisions must be explainable, editable and user-overridable."
Making them *actually render* completes the model's promise while keeping the "avoid transition spam"
rule (the renderer only filters what the frontend sends).

### Decisions
- D-017 — renderer fold; wipe/zoom template-only; 422 codes; locked.

### Verify
- Backend: `uv run pytest` 85 passed (63 → 85). `uv run pytest tests/test_render.py` shows the HTTP
  dissolve render e2e (duration ≈ 3.5s, wipe → 422). Project-local FFmpeg validated.
- Commits: `e876a34` (spec+plan) · `94bba9a` (slices 1-3 + docs) — this log/graph commit closes.

### Limitations
- `wipe`/`zoom` need a template renderer before they render (currently 422).
- Edge fades currently only valid at timeline first/last clip (index 0 / index n−1); multi-track edge
  cases handled by `transitions-ui` in the next module.
- Transition duration resolution beyond 1/30s (`settings.fps`) is not snap-quantised; small probe
  drift is expected and accepted (± 0.1s).

### Next step
- `transitions-ui` (timeline chips + explainable override UI) — fresh spec review, then TDD. Push
  `transitions-render` commits on user go-ahead.

---

## Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui

### WHAT
Transitions are now a live, editable part of the editor. `editorStore` carries
`transitions` + `selectedTransitionId`. `suggestTransitions()` reconciles the auto list
(replaces only `auto` entries; `manual` overrides always survive). `overrideTransition`
flips `source → manual` with clamped durations (also for edge fades), `removeTransition`
and `resolveInvalidTransitions` are targeted. UI: `TransitionsPanel` in the inspector
(rationale per suggestion, type `<select>`, duration input, Remove, and an invalid banner
that resolves orphans only when asked), plus `TransitionOverlay` chips in each timeline lane
(between chips centred on the cut boundary, edge fades at track first/last clip, click to
select, width ∝ duration clamped 36–64px). No manual "add" button — creation stays
suggestion-only. Recommend zero new dependencies except devDep `jsdom` (from the App mount
regression guard).

### HOW
All model ops reused lock-step from `transitions-core`; the store is the pair-key (`A→B`)
merge point so future suggestion sources cannot overwrite manual edits. jdom-gated component
tests render panels/overlay, drive selects/inputs/number-inputs via native value setters +
React 19 events, and assert store effect (type→manual, duration clamp, remove, resolve-only-
invalid). One real-integration fix: lane ids are `track-*`; matched clips arrive with full
track id, so the overlay keys off the already-lane-scoped `clips` prop instead of re-filtering
(which would have silently matched nothing).

### WHY
Completes the transitions promise from PRODUCT_SPEC: suggestions explainable, editable,
overridable, removable; never silently overwritten; clean-cuts remain the default. The UI
layer is the last gap before the full Auto-image → matched clips → transitions → render loop
is vertex in-browser.

### Decisions
- D-018 — suggestion auto-only replacement, manual wins, invalids resolved on request.

### Verify
- `npx vitest run`: 122 passed (104 → 122). `npm run build` clean. `npm run lint` 0.
  Browser regression guard (jsdom App mount) still green; timeline+inspector panels render
  with chips under real state.
- Commits: `342e446` (spec+plan) · `9e7255a` (store) · `eca2384` (panel) · `ae7e69b` (chips) as
  this log/graph/doc commit closes.

### Limitations
- `wipe`/`zoom` remain template-only (renderer 422) — overriding a suggestion to them records
  the manual edit but cannot render until a template runner exists.
- Panel hint text is long; chips may crowd tight boundaries (min 36px) — acceptable at current
  PX_PER_SECOND.
- `selectedTransitionId` is transient UI state; it is not persisted (intentional).

### Next step
- Push `transitions-ui` on go-ahead; then final M4 module: `image-motion` (per-capability-map
  spec) — e.g. Ken Burns / drift on stills with editable severity, rendered via the same
  per-stream prep + renderer fold. Update docs/ROADMAP M4 as module completes.

## Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)

### WHAT
Shipped the final M4 module. Still-image clips can carry an optional `motion`
(`zoom-in|zoom-out|pan-left|pan-right|pan-up|pan-down` + `strength` 0–1), it is editable
from the inspector (type select + strength slider, marker on the timeline block), survives
project round-trips (version stays 1), and renders through the same per-stream prep as
transitions `("fps → scale/pad → scale=iw*3 → zoompan → setsar → trim → setpts")` so it
composes with the xfade fold. No-motion clips keep byte-identical filter graphs (parity
tests preserved).

### HOW
Backend `media.py`: `MotionSpec` frozen dataclass, `RenderClip.motion?`, `_motion_filters`
(zoompan `z`/`x`/`y` animated from `on` over the clip, `F = 1 + 0.15·strength`, upscaled
source `*3` for headroom so zoom-out never shows edges), `_prep_chain` shared by
`_filter_complex` and `build_transition_graph` (identical output when motion absent),
`MOTION_INVALID` (422) for unknown type/out-of-range strength. `/api/render` parses optional
per-clip `motion`; `MOTION_INVALID` when motion targets a non-image clip. Frontend:
`MotionSpec`/`MotionType` in types, `Clip.motion?`, `setClipMotion` store action, `MotionPanel`
(render-less for non-image clips; `none` clears), `.clip-motion` marker on blocks. Crop-based
attempt was dropped after ffmpeg rejected `t`-animated crop config — zoompan is the canonical
Ken Burns filter.

### WHY
Stills matched to narration need restrained life without gimmickry; motion is user-set only
(never auto-suggested), fixed amplitudes scaled by strength, editable everywhere, and uses the
established prep+fold so transitions and motion compose with zero architecture change.

### Verify
- Backend `uv run pytest tests/`: 111 passed (85 → 111). Includes parity tests, 6-preset
  string coverage, real-ffmpeg motion smoke, motion+dissolve smoke (3.5s), HTTP cases
  (201 render, 422 `MOTION_INVALID` x3).
- Frontend `npx vitest run`: 133 passed (122 → 133). `npm run build` clean, `npm run lint` 0.
- Commits: `60895b9` (spec+plan) · `4008923` (slices 1-2) · `28c68cc` (slice 3) · `d31a92b`
  (slice 4) · this one (docs D-019).

### Limitations
- Pan/zoom helper upsamples source `*3`; very large stills cost memory during prep.
- Strength slider maps linearly to amplitude; no keyframe/customisation per clip.
- `selectedTransitionId`/motion UI remain transient-ish: motion persists (clip field); only the
  inspector state itself is not persisted (intentional).

### Next step
- Push M4 (image-motion) on go-ahead. ROADMAP M4 then only lacks the measurable-only
  retention bullet. Next milestone: M5 caption engine (multilingual ASR already in M3) — draft
  `SPEC-caption-engine.md`.

---

## Session 13 — M5 caption engine complete (all four modules)

### Purpose (WHY)
Session 12's next step was M5. The approved capability map
(`docs/SPEC-m5-capability-map.md`, committed `9851231`) defined four modules:
caption-core → caption-styles → caption-render → caption-ui. This session shipped
all four with per-slice TDD, closing the M5 milestone.

### WHAT
- **caption-core** — `frontend/src/editor/captions.ts`: `CaptionItem`
  (`{ id: 'cap-*', trackId: 'track-captions', start, duration, text, styleId,
  words?, source }`), `segmentCaptions` (one caption per segment, split on
  pauses ≥ 0.4s — same rule as beat segmentation so captions align with matched
  image beats; word timings copied onto items), pure edit ops
  (`updateCaptionText` manual + drops stale words, `updateCaptionTiming` clamped,
  `removeCaption`, `validateCaptions` with epsilon drift tolerance, `isCaption`).
  `TimelineModel.captions?` + `project.ts` round-trip (version stays 1).
  Store: `captions` state (temporal), `generateCaptions(assetId)` replaces only
  `auto` items — manual captions always survive (D-018 rule), one undo step;
  `updateCaptionText`/`updateCaptionTiming`/`setCaptionStyle`/`removeCaption`;
  `loadProject`/`reset`/partialize/equality wired. Commits: `94b606d` (slices 1-3,
  17 tests) · `cf7d9df` (round-trip) · `0e69e50` (store, 8 tests).
- **caption-styles** — `captionStyles.ts`: 15 original static presets (normal,
  word-highlight, karaoke, important-word pop, punctuation, hook, manga/anime,
  cinematic, meme, storytelling, urdu RTL, roman-urdu, english, mixed,
  emoji-optional). Safe font stacks, `#RRGGBB` colors, alignment, mode flags
  (`karaoke`/`wordHighlight`/`importantWordPop`/`punctuation`/`rtl`/`emoji`).
  No trending claims. Commit: `5557f2a` (7 tests).
- **caption-render** — `docs/SPEC-caption-render.md` + backend `captions.py`
  (pure ASS generator: PlayRes-relative sizes, `#RRGGBB`→`&HAABBGGRR`,
  bottom/middle/top alignment map, `{\k}` karaoke centiseconds from word
  timings, `{\rtl}`, HTML escaping, uppercase) + `media.py` per-job `.ass`
  write + `ass=` filter appended to the final stream (empty/absent =
  byte-identical parity) + `main.py` optional `captions` form field with
  `CAPTION_INVALID` (422). Real-ffmpeg pixel-diff smoke proves the burned
  caption changes the bottom strip. Commit: `9b97b2b` (backend 111 → 140).
- **caption-ui** — `CaptionPanel` (analyze-first empty state, Generate per
  analyzed voice asset, per-caption text/duration/style/remove + source badge),
  timeline caption blocks on the captions lane (click seeks, dashed = manual),
  `captionsRenderPayload` wire mapper, Render button sends captions, CSS in
  existing tokens. Commit: `83f2cc0` (frontend 133 → 174).
- **Docs closure** — D-020 (+ D-019 index row fix), ROADMAP M5 all ticked +
  status line, FEATURES §5 "Shipped" block, UI_SPEC captions entry, todo M5
  closed, this log, graph refresh.

### HOW
Per-slice TDD as in M2–M4: pure layer first (RED exposed two test-expectation
fixes: `makeCaption` clamps negative start so validation tests must inject
malformed values directly; empty captions array is the parity path, not an
error). One real bug caught by tests: the `ass=` filter append initially missed
the `;` chain separator → ffmpeg 500 → fixed to `[vout];[vout]ass=…[voutc]`.
ASS path escaping handles `\`, `:`, `'`. Fonts: first family of the safe stack
is sent; libass falls back for missing fonts (M6 bundles fonts).

### Decisions
- D-020 — captions as optional top-level list; transcript-generated,
  override-first edits, libass burn-in; animated treatments + user fonts → M6,
  live preview overlay → M8. Locked.

### Verify
- Backend: `uv run pytest` 140 passed (111 → 140: +20 captions unit, +6 render
  HTTP incl. pixel smoke).
- Frontend: `npx vitest run` 174 passed (133 → 174: +17 captions, +3 round-trip,
  +8 store, +7 styles, +6 CaptionPanel component). `npm run build` ok,
  `npm run lint` 0 errors.
- Commits: `9851231` (capability map) · `94b606d` · `cf7d9df` · `0e69e50` ·
  `5557f2a` · `9b97b2b` · `83f2cc0` + this docs/graph commit.

### Limitations
- Burn-in uses fonts installed on the machine; missing fonts fall back via
  libass (font bundling + license metadata = M6).
- Animated kinetic/manga/meme/cinematic/storytelling treatments render as
  static styled lines only (M6 templates).
- No live caption preview overlay (M8 polish per capability map).
- Emoji rendering depends on installed emoji fonts; the flag is optional
  per-style, never mandatory.
- In-browser human feel-check of CaptionPanel + caption blocks still pending
  (logic is component-test covered).

### Next step
- Push M5 (8 commits) on user go-ahead. Next milestone candidates: M6
  template/font system (font import + license metadata + animated caption
  treatments) or M1 follow-ups (audio mixing in render — now needed for voice
  to reach the output; ripple editing). M4 retention heuristics stay open
  (measurable-only).

---

## Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)

### Purpose (WHY)
Session 13's next step named M6 template/font system. The user approved the
M6 capability map (`font-system → preset-registry → preset-import →
template-editor → animated-captions`) and then the `font-system` spec +
plan verbatim. This session implemented module 1 end-to-end with per-slice
TDD, closing the font side of M6.

### WHAT
- **Spec + plan + todo** — `docs/SPEC-font-system.md` (approved via question
  tool), `tasks/plan-font.md`, `tasks/todo.md` M6 section. Commit `c7ceb58`.
- **Slice 1 (pure layer)** — `backend/src/lava_backend/fonts.py`: SFNT magic
  validation (no fontTools — hand-rolled name-table reader, nameID 16→1→4,
  Windows/Unicode preferred, UTF-16BE), `clean_family_name`, license payload
  normalisation (`{type: open|commercial|personal|unknown, source?,
  embeddingAllowed}`), registry save/load (`fonts/licenses.json`,
  malformed-tolerant), `make_font_metadata`. `config.py` gained
  `fonts_dir` + `presets_dir`. 17 tests. Commit `60b0290` (backend 140 → 157).
- **Slice 2 (API + renderer)** — `main.py` routes: `POST /api/fonts` (multipart
  file + optional license JSON; `FONT_INVALID` 422 for bad ext/magic/license
  semantics, `INVALID_BODY` 422 for bad license JSON; id-keyed storage +
  registry append), `GET /api/fonts`, `GET /api/fonts/{id}/file`,
  `DELETE /api/fonts/{id}` (204, removes file + registry entry). `media.py`
  refactored ass overlay into `_ass_filter_string` which appends
  `:fontsdir='…/fonts'` only when the dir exists — **no-captions parity
  preserved**. Real-ffmpeg smoke renders captions against a real uploaded Arial
  with fontsdir. 8 API/smoke tests. Commit `b794e29` (backend 157 → 165).
- **Slice 3 (frontend model/client/store)** — `editor/fonts.ts`
  (`FontMetadata`/`FontLicense`, tolerant `parseFontMetadata`,
  `ensureFontFace` @font-face registration keyed id+base),
  `services/fonts.ts` (`listFonts`/`uploadFont`/`deleteFont`/`fontPreviewUrl`,
  `FileResponse`-style `failHttp` + friendly offline message),
  `store/fontStore.ts` (load/import/remove, idle|loading|error),
  14 tests. Commit `18364f8` (frontend 174 → 188).
- **Slice 4 (FontPanel)** — `components/FontPanel.tsx`: import (file picker +
  license type/source/embedding), list with license badge + preview link +
  remove, load-error surface, auto `@font-face`. Mounted in the Inspector
  below Captions; `.font-*` CSS on existing tokens. 5 component tests —
  **no @testing-library dependency**, used the repo's `createRoot`+`act`
  pattern (prototype-value-setter + `input` event). Slice 3→4 test failures
  surfaced two gremlins: React's file input needs `files` set via
  `Object.defineProperty` + `change`, and controlled inputs need the setter
  from `HTMLInputElement.prototype` — both aligned with
  `TransitionsPanel`/`MotionPanel` tests. Commit `243d7ff`
  (frontend 188 → 193; build + lint clean).
- **Docs closure** — D-021, ROADMAP M6 `font-system` tick (+status line),
  FEATURES §6 "Shipped" block, this log, `graphify update .`.

### HOW
Per-slice TDD as established across M2–M5 (RED first, commit per slice,
full regression before commit). Two real bugs tests caught: (1)
`make_font_metadata` stored `ext` with a leading dot while the file-on-disk
name concatenated its own `.` → double dot; fixed by normalising `ext`
dot-less (`b794e29`). (2) frontend type drift — `FontUploadLicense.source`
was `string | undefined` while `FontLicense` is `string | null`; removed the
stray interface and used `FontLicense` everywhere.

### Decisions
- D-021 — fonts are backend-id-keyed assets (`fonts/` + `licenses.json`
  registry), family names travel in the project (version stays 1), libass
  resolves them via `ass=:fontsdir=`; no fontTools, no bundled fonts, no
  project-embedded binaries. Locked.

### Verify
- Backend: `uv run pytest` 165 passed (140 → 165: +17 fonts, +8 API/smoke).
- Frontend: `npx vitest run` 193 passed (174 → 193: +10 services, +4 store,
  +5 FontPanel). `npm run build` ok, `npm run lint` 0 errors (2 pre-existing
  warnings).
- Commits: `c7ceb58` · `60b0290` · `b794e29` · `18364f8` · `243d7ff` + this
  docs/graph commit.

### Limitations
- Family resolution depends on the family being imported **and** libass finding
  it in `fontsdir`; un-imported families still fall back to system fonts.
- `fontsdir` presence keys off directory existence — an imported family that
  libass cannot parse on its platform degrades to fallback (documented, smoke
  covers a real TTF).
- No removal cascade yet: deleting a font does not touch captions/styles that
  reference its family (they simply fall back); preset-registry module will
  decide reference awareness.
- Trending categories remain conceptual — preset-registry module next.
- In-browser human feel-check of FontPanel still pending (component-test
  covered).

### Next step
- Push M6 module 1 (6 commits) on user go-ahead. Next M6 module:
  `preset-registry` (extend `CaptionStyle` with M6 preset fields, updateable
  categories, license-aware references to imported fonts). After that:
  `preset-import` → `template-editor` → `animated-captions`.

---

## Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)

### Purpose (WHY)
Session 14 pushed module 1 (`font-system`) and named `preset-registry` next.
The user approved the module spec + plan verbatim; this session shipped the
registry end-to-end with per-slice TDD (pure → API → model/store → panel →
docs), closing M6 module 2.

### WHAT
- **Spec + plan + todo** — `docs/SPEC-preset-registry.md`, `tasks/plan-presets.md`,
  `tasks/todo.md` M6 module 2. Commit `42e528a`.
- **Slice 1–2 (pure + API)** — `backend/src/lava_backend/preset_registry.py`:
  `BUILTIN_CATEGORIES` (13), frozen `Preset` dataclass (CaptionStyle+
  category/presetVersion/tags/licenseRef), strict `validate_preset`,
  `load_registry`/`save_registry` on `presets/registry.json` with built-in
  fallback, `merge_preset_layers` for future customs, and `BUILTIN_PRESETS`
  (the 15 M5 originals, category-mapped per the spec table). `config.presets_dir`
  already existed from module 1. `GET /api/presets` route returns the registry.
  Commit `434872e` (backend 165 → 178, 13 units + 1 API).
- **Slice 3 (frontend model + store)** — `editor/presets.ts` (`Preset`,
  tolerant `parsePreset`, `BUILTIN_CATEGORIES`, `captionStyleFromPreset`),
  `services/presets.ts` (`listPresets`), `store/presetStore.ts` (load,
  `byCategory`, `getPreset`, `applyPreset(id, captionIds?)`), plus new
  `editorStore.applyPresetStyle(styleId, captionIds?)` — bulk restyle in **one
  undo step**, marks captions `manual`. Commit `6fa35ad` (frontend 193 → 209,
  8 editor + 5 store + re-use).
- **Slice 4 (PresetPanel)** — `components/PresetPanel.tsx`: "All" + 13
  category pills, preset cards (name, category badge, imported-font/system-stack
  indicator, RTL flag, description), Apply per card (project captions), load
  error surface; mounted in the Inspector between Captions and Fonts; `.preset-*`
  CSS on existing tokens. Commit `f25fa47` (frontend 209 → 213, 4 component
  tests; build + lint clean).
- **Docs closure** — D-022, ROADMAP M6 preset-registry tick (+status line),
  FEATURES §6 "Shipped" block, this log, `graphify update .`.

### HOW
Per-slice TDD as established. Two test-signals worth noting: (1)
`parsePreset` normalises all flag booleans, so the fixture had to carry the
full flag set for deep-equality (documented behaviour, not a bug); (2) the
`useShallow` import in the component is required because PresetPanel selects
an object-literal slice from zustand (React 19 rule already in the log).

### Decisions
- D-022 — presets extend `CaptionStyle` with a category; registry is a JSON
  file served read-only until module 3 import; Trending updateable by JSON
  edit, no live fetch. Locked.

### Verify
- Backend: `uv run pytest` 178 passed (165 → 178: +13 registry units, +1 API).
- Frontend: `npx vitest run` 213 passed (193 → 213: +8 editor, +5 store, +4
  component). `npm run build` ok, `npm run lint` 0 errors.
- Commits: `42e528a` · `434872e` · `6fa35ad` · `f25fa47` + this docs/graph
  commit.

### Limitations
- API is read-only by design — importing/saving real presets (validation,
  Custom category writes, export) is module 3.
- `licenseRef` is advisory right now: applying a preset bound to a font that
  is not imported degrades to libass system fallback (no load-time check).
- Presets apply to existing captions only — they do not restyle future
  generated captions' default yet (template-editor module may own that).
- In-browser human feel-check of PresetPanel still pending (component-test
  covered).

### Next step
- Push M6 module 2 (5 commits) on user go-ahead. Next M6 module:
  `preset-import` (JSON schema validation, Custom category management,
  import/export flows building on `preset_registry.py`). After that:
  `template-editor` → `animated-captions`.

## Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)

### WHAT
- **Spec+plan+todo** — `docs/SPEC-preset-import.md` (assumption-led: forced
  `Custom`, `custom-` id prefix, strict `licenseRef` gate, registry-file
  storage, existing todo rows untouched), `tasks/plan-preset-import.md` (5
  vertical slices), `tasks/todo.md` M6 module-3 section. Commit `2895e5d`.
- **Slice 1+2 (backend)** — `backend/src/lava_backend/preset_import.py`:
  `import_preset_payload` (lava-preset envelope OR bare dict), `custom-`
  regex gate, category→Custom force, font `licenseRef` cross-check against the
  fonts registry, `preset_to_export_dict`, `suggested_custom_id`. API:
  `POST /api/presets` (201, duplicate → 422 `PRESET_INVALID`), `DELETE
  /api/presets/{id}` (204 / 403 `BUILTIN_PRESET` / 404), `GET
  /api/presets/{id}/file` (envelope download). Commit `ab46545` (backend 203:
  178 → +12 unit, +13 API).
- **Slice 3 (frontend services+store)** — `services/presets.ts`:
  `importPreset`, `deletePreset`, `exportPresetPayload` (envelope),
  `downloadPresetFile` (projectIO pattern); `presetStore` `importPreset`
  (upsert into list) + `removePreset`. Commit `c9eff3b` (frontend 225 start:
  +3 service, +3 store).
- **Slice 4 (UI)** — PresetPanel Import JSON button (visually-hidden
  `input[type=file]`, FileReader → JSON.parse → store), Export + Remove on
  custom-only cards (danger styling), error surfaces reuse the existing
  `.preset-error` slot; `.preset-actions`, `.preset-card-actions` CSS. Commit
  `88efd5a` (frontend 225: +4 component).
- **Slice 5 (this commit)** — D-023, ROADMAP M6 custom import tick, FEATURES
  "Shipped" block, this log, `graphify update .`.

### HOW
Per-slice TDD as established (RED first per task). jsdom quirks hit twice: no
`DataTransfer` in this env → `fakeFileList` FileList stub set on the input via
`Object.defineProperty`; and `findByText` (exact-text leaf match) can't match a
produced `Invalid preset JSON: <syntax message>` — asserted on the
`.preset-error` textContent instead. Stricter TS caught an unused fetch-stub
`input` param (build), fixed with `_input`.

### Decisions
- D-023 — strict import/export: `Custom` forced, `custom-` prefix, duplicate →
  `PRESET_INVALID`, built-ins undeletable (403), licenseRef cross-checked
  against the fonts registry at import. Locked.

### Verify
- Backend: `uv run pytest` 203 passed (178 → 203: +12 unit, +13 API).
- Frontend: `npx vitest run` 225 passed (213 → 225: +3 service, +3 store, +4
  component). `npm run build` ok, `npm run lint` 0 errors.
- Commits: `2895e5d` · `ab46545` · `c9eff3b` · `88efd5a` + this docs/graph
  commit.

### Limitations
- Export currently writes the preset as stored; built-ins are exportable via
  the API/`downloadPresetFile` on custom cards only in the UI.
- Imported preset ids are fixed at `custom-*` — a user dragging a preset whose
  id has no prefix gets the backend's actionable message, not a rename prompt.
- `preset-import` binds `licenseRef` at import time only; a font deleted later
  still degrades to system fallback at render (registry-driven).

### Next step
- Push M6 module 3 (5 commits) on user go-ahead. Next M6 module:
  `template-editor` (styles for future generated captions + preset/template
  curation), then `animated-captions` (animated caption treatments).

## Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)

### WHAT
Shipped the M6 template editor end-to-end and closed the render gap where
preset-applied captions burned in as the `normal` style.

- Draft model — `frontend/src/editor/templateEditor.ts`: `PresetDraft`,
  `draftFromPreset` (preset or M5 style), immutable `updateDraft` (fontSize
  clamp 8–240, outlineWidth ≥ 0), `customIdForLabel` (mirrors backend slug),
  `finalizeDraft`, `resolveCaptionStyle(styleId, presets)`.
- Backend — `PUT /api/presets/{id}`: in-place custom overwrite (built-in →
  403 `BUILTIN_PRESET`, missing → 404, payload-id ≠ path-id → 422, full
  `import_preset_payload` validation incl. licenseRef gate). Backend 211.
- Frontend — `updatePreset` service; `presetStore.savePreset` (POST unknown /
  PUT present, local upsert, single error surface). `CaptionPanel`:
  `captionToWire` + `captionsRenderPayload` resolve preset styleIds; style
  select lists presets (M5 first, dedup). `TemplateEditorPanel`: base select,
  label/description, font + imported-font picker, size/colors/outline/
  alignment, 8 M5 toggles, live CSS preview, Save-as-new + Overwrite (custom
  bases only), mounted in `InspectorPanel`. Frontend 244.

### HOW
Per-slice TDD. The pure model + PUT landed first (committed together), then
services/store/render-wire, then the panel. Rediscovered: checkbox reactivity
in this React-19/jsdom stack needs `.click()` (a synthetic `change` on a
property-set `checked` was not observed). Also made the pure model honest —
`suggested custom id` + id-bound PUT mean finalize keeps the explicit
overwrite id, and `draftFromPreset` no longer reaches into `CaptionStyle`
fields via casts. Docs D-024 + ROADMAP tick + FEATURES block.

### Decisions
- D-024 — template editor: immutable drafts + slug-id saves; built-in
  immutability preserved for PUT; preview is an inline CSS preview (canvas
  preview stays M8); caption preset resolution runs at wire time.
- Deferred (unchanged from spec): project-level default template for future
  generated captions → M8; kinetic/manga auto-animation → module 5
  `animated-captions`.

### Verify
- Backend: `uv run pytest` 211 passed (203 → 211: +8 PUT tests).
- Frontend: `npx vitest run` 244 passed (225 → 244: +14 model, +2 service,
  +2 store, +1 caption resolution, +5 panel). `npm run build` ok, `npm run
  lint` 0 errors.
- Commits: `f8cfe13` · `804b0a4` · `4312290` · `b304300` + this docs/graph
  commit.

### Limitations
- Overwrite renames a preset in place (UI edits the label on a custom base);
  acceptable, but a dedicated rename affordance is nicer.
- No M5-to-preset visual diff tool; future generated captions still default to
  `normal` until the M8 default-template work lands.
- Toggles map 1:1 to wire flags only; no preview of animated treatments here
  (module 5).

### Next step
- Push M6 module 4 (4 commits) on user go-ahead. Next M6 module:
  `animated-captions` (animated caption treatments), then close the M6
  license-metadata row.

## Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)

### WHAT
Added five named caption animation treatments generated entirely as libass
inline tags in the pure backend ASS generator, selectable through the existing
style/preset/editor surfaces.

- Backend `captions.py` — `ANIMATIONS`, `CaptionStyleSpec.animation`
  (validated enum, default `none`), `_kinetic_word_tokens` (per-word relative
  ms from `words[]`, even-split fallback), per-treatment inline wrappers
  (kinetic per-word alpha+scale reveal; manga impact punch; cinematic
  `{\fad}` + slow scale; meme wobble ramps; storytelling gentle fade+scale),
  `_animate_line` applied after escaping (so `&H00&`/`&HFF&` survive), karaoke
  precedence, rtl wraps outside. 12 byte-exact tests.
- Backend `preset_registry.py` — `Preset.animation: str = "none"` + enum
  validation; import/export round-trips it (backends 211 → 227).
- Frontend — `CaptionAnimation` + `ANIMATION_OPTIONS` + `isCaptionAnimation`;
  M5 `manga`/`cinematic`/`meme`/`storytelling` annotated; `parsePreset`
  passthrough (invalid → `none`), `captionStyleFromPreset` inherits via spread,
  `captionToWire` emits `animation`; `PresetDraft.animation` round-trip;
  TemplateEditorPanel Animation select. Frontend 244 → 250.

### HOW
RED first per slice (12 backend tests for recipes, 3+1 preset schema, 4
frontend, 2 panel). The ASS-brace trap: inline tags contain `{`/`}` which
`.format()` reads as fields — wrapped in `{{`/`}}` so only numeric
`{d}/{pop}/{dur_ms}` placeholders survive; and kinetic words need explicit
space joining since tokens already end in the closed tag. `&H..&` must be
inserted *after* HTML escaping. Docs D-025 + ROADMAP tick (6th row) + FEATURES.

### Decisions
- D-025 — text-level ASS recipes are the render face for animations; true
  manga speed-lines and cinematic letterbox bars (pixel-space `{\p}` drawing)
  and the motion preview are deferred to M8 preview overlay; animation is a
  style/preset property (per-word timing rides existing `words[]`); karaoke
  keeps precedence.
- M2 legacy: keep `animation` out of hook default (no invented behavior) —
  only the four name-matching M5 presets carry treatments; users add kinetic
  via the template editor.

### Verify
- Backend: `uv run pytest` 227 passed (223 → 227 after preset schema slice).
- Frontend: `npx vitest run` 250 passed (244 → 250: +2 styles, +1 presets,
  +1 wire, +1 draft, +1 panel). `npm run build` ok, `npm run lint` 0 errors.
- Commits: `3423d00` · `56fc907` · `0e7b717` · `acce8cb` · `60d7bfd` + this
  docs/graph commit.

### Limitations
- "Manga" is impact-punch, "cinematic" is fade+scale — no speed lines or
  letterbox bars (needs pixel-space drawing; M8 follow-up).
- No motion preview in the panel/timeline (M8 preview overlay owns it).
- Kinetic words ride `words[]`; a manual per-word timing editor is timeline
  work (out of M6 scope).
- `hook` stayed `none`; kinetic-by-default hooks are a future preset idea, not
  an inferred behavior.

### Next step
- Push M6 module 5 (5 commits) on user go-ahead. Then close the last M6 row:
  preset/render license metadata tracking; M6 is complete.

## Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done)

### WHAT
Closed the final M6 row (preset/render license metadata) with a render-time
font license guard and a render font manifest. Fonts already track
`{type, source, embeddingAllowed}` (module 1) and presets bind them via
`licenseRef` (module 3); the render path now enforces them.

- New pure module `backend/src/lava_backend/licensing.py`: matches each
  caption style's `fontFamily` against the fonts registry by family and
  returns `(used_fonts, violations)` where violations are
  `FONT_LICENSE_NOT_EMBEDDABLE` (declared license forbids embedding) or
  `FONT_MISSING` (registered, but `{id}.{ext}` absent from `fonts_dir`).
  System stacks (unregistered families) pass silently and are not listed.
- `POST /api/render`: any violation aborts with an actionable
  `422 FONT_LICENSE` (message from `violation_message`); clean renders return
  `fonts: [{family, fontId, license}]` on the body. `RenderResult.fonts`
  carries the manifest through `media.py`.
- Frontend: `RenderResult.fonts` + `RenderCaptionStyle.animation` parity
  (fixes the module-5 divergence on the caption-wire type); PresetPanel's
  "imported font" badge title now shows the bound family + embedding status
  resolved from `fontStore`.

### HOW
RED first per slice: 12 licensing unit tests then 6 render-API tests
(no-captions `fonts: []`, system stack 201, restricted 422, missing-file 422,
allowed descriptor, mixed dedup), then 3 frontend tests (manifest passthrough,
badge allowed/limited). Endpoint guard placed after caption parse, before
render — violations abort before any ffmpeg work. Descriptor built from
resolver output dicts, not the frozen dataclass, so `RenderResult.fonts`
serializes cleanly.

### Decisions
- D-026 — registry-back fonts are refused on the render path, never silently
  served; guard failures are hard 422s (consistent with no-silent-fallback);
  matching is by family (the only ident on the caption wire) with first-match
  wins; the manifest lists only fonts actually used by caption styles.
- Limitation accepted: a font fully removed from the registry after binding
  becomes indistinguishable from a system stack and passes — predictable from
  the data model; registry-backed cases are all caught.

### Verify
- Backend: `uv run pytest` 245 passed (227 → 239 → 245 across slices).
- Frontend: `npx vitest run` 253 passed (250 → 253: +1 ffmpeg manifest,
  +2 PresetPanel badge). `npm run build` ok, `npm run lint` 0 errors.
- Commits: `61a9d68` (spec+plan+todo) · `6964a87` (resolver) · `34a5794`
  (render guard + manifest) · `b347753` (frontend) + this docs/graph commit.
- `graphify update .` clean; ROADMAP marks Milestone 6 complete.

### Limitations
- Fully-unregistered fonts (deleted after binding) read as system stacks and
  pass the guard; can only be distinguished by the project data model, not by
  the family string.
- The guard is registry-aware at render time; it does not re-validate font
  files' actual license bits (OS/2 fsType) — `embeddingAllowed` is the
  user-declared import contract (module 1) and adherence is by that contract.
- No per-caption override: animation/license checks stay style-level.

### Next step
- Push M6 module 6 (5 commits) on user go-ahead. Milestone 6 is complete.
  Next milestone: **M7 Manhwa extractor** (panel detection/order/export) —
  start with `docs/SPEC-m7-manhwa.md` + capability map + plan.

## Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md

### WHAT
Started milestone 7 (Manhwa extractor) by nailing down its shared data
contract before any image processing exists. Shipped `panel-model`: a frozen
`Panel` dataclass exactly matching PRODUCT_SPEC §9 (`{id, sourceId, x, y, w,
h, confidence, order, userCorrected}`), deterministic analysis↔source
coordinate mapping, zero-padded panel asset naming, and a git-clean
`StripRegistry` (`cache/manhwa/<source_id>/registry.json`) the whole pipeline
shares. Also, per the `constraint-driven-development` gate, wrote
`CONSTRAINTS.md` (first quality bar document for this repo).

### HOW
- CONSTRAINTS.md: Floor (no suppressions/stubs/skips/secrets, never weaken the
  bar) + enforced-with-numbers rows that run today (frontend `tsc -b`, oxlint,
  backend `uv run pytest`, frontend `npx vitest run`) + declared-but-pending
  dimensions (JS/Python coverage via changed-lines ≥ 80%, semgrep, osv-scanner,
  Lighthouse LCP/CLS, axe, dependency-cruiser — BLOCK mode once installed) +
  measured ratchets (backend 245 → 283 must not fall, frontend 253 must not
  fall) + rule that ≥1 external constraint must be live before a feature ships.
  `AGENTS.md` now points at the file.
- `manhwa/panels.py`: `make_panel`/`validate_panels` (rejects negative/zero
  spans, out-of-bounds, NaN confidence, empty/dup ids; clamps confidence),
  `analysis_scale` (aspect-preserving, floor ana_h, identity ≤ 512 wide),
  **boundary-anchored** mapping (`map_cut_to_source` + `boxes_from_cuts` — cut
  lines mapped once, boxes derived from mapped cuts, so panels tile the strip
  seamlessly; `map_bounds_to_source` stays for forward-compat), `asset_name`
  zero-padded by `len(str(total))`, `id_for_asset`/`asset_for_id`,
  `StripRegistry.save/load/reset_panels` (atomic temp+rename, corrupt/missing/
  unknown-version/dup-id → `ManhwaError`, never a silent rewrite).
- 38 unit tests (valid/invalid panel matrix, scale/map round-trips + clamp +
  seam-free tiling, registry round-trip/atomicity/errors/reset, asset padding
  1/9/10/100) — RED first, then GREEN. Full backend suite 283 passed.
- Docs: DECISIONS D-027, ROADMAP M7 row split into 7 module rows (module 1 ✅,
  module 2 in progress), SESSION_LOG 20.

### WHY
Adjacent panels only stay contiguous if the mapping anchors cut positions —
rounding every panel box independently drifts ±factor px per box and leaves
seams (or double-covered pixels) on export. The registry must be git-clean
(data, generated per source) but surfacing corruption loudly (not silently
rebuilding, which would be a data-losing overwrite). Constraints are worth
writing down now, not at merge time, because a CV heuristic pipeline can pause
on arbitrary test-tuning and hard-coded "it works on this image" assertions.

### Verify
- Backend: `uv run pytest` → 283 passed (245 + 38 new), 2 deprecation
  warnings (untouched, pre-existing).
- Frontend: not touched — no frontend change in this slice.
- Commits: `10aa8b5` (spec+plan+todo) · process (`CONSTRAINTS`,
  AGENTS pointer, boundary-anchored spec contract) · module-1 code+tests ·
  docs+graphify (D-027/ROADMAP/SESSION_LOG 20).
- `graphify update .` run from repo root (manhwa package + tests added).

### Limitations
- `map_bounds_to_source` is retained only for forward compatibility; the
  detector will use the anchored cut API.
- Asset naming is order-based by default; renumbering at export is a
  panel-correction/export-module concern (`id_for_asset` documents the
  expectation).
- No image bytes yet, nothing mounted — analysis/export come with
  `panel-detection`.
- CONSTRAINTS coverage/security/a11y rows are exact numbers, but their tools
  aren't installed; enforcement kicks in when each tool is installed (flagged
  in the module report where the first run happens).

### Next step
- Push M7 module 1 on user go-ahead. Then module 2 `panel-detection`:
  `graphify query` existing vision/CLIP image-load helpers, generate
  deterministic synthetic strip fixtures (TEST_PLAN §2 list — clean/black/
  colored gutters, borderless, very tall, small, connected-looking,
  decorative, bubbles, dense text, false boundaries), then implement the
  OpenCV hybrid signal stack (row uniformity, color discontinuity, edge
  energy, gutter darkness, CC/morphology with hysteresis — never one contour
  threshold) → analysis-space cuts → registry write.

## Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence

### WHAT
- Delivered the CV heart of the extractor: analysis-scale cuts (clean 0.95 /
  rescue 0.35), seam-free source-space panels, and idempotent detection save.
- 4 slices: (1) analysis image + row features + clean-gutter cuts + 6
  fixtures; (2) rescue pass + sliver merge + realistic fixture rewrite; (3)
  `build_panels` + `detect_strip` + error paths; (4) spec reconcile + docs.
- Commits: `52fd509` slice 1 · `89744a9` todo tick · `e1cff38` slice 2 ·
  `f2b9378` slice 3 (slice 4 docs committed with this entry). Backend 283 →
  312.

### HOW
- Clean path: rows with content < 3% merge into bands; a band becomes a cut
  only if interior (not clipped at image edges), bordered by ≥ 15% content on
  both immediate 3-row sides, wide ≥ 8, and flat by median uniformity > 0.97
  → conf 0.95. Rescue: 1..24 px flat-empty runs with the same bordered test →
  conf 0.35, scanned between clean bands (or the whole strip). Sliver merge
  drops the lower-confidence cut when two cuts enclose < 24 analysis px.
- Debug journey (worth recording): clean gutters came back as *rescue* because
  the first row of a resampled band is a half-blended transition row
  (`uniform 0.94`) — a strict all-rows-flat mask vetoed real gutters → median
  fixed it. Borderless/bubbles/dense-text gutters read as content because the
  global gray-mode bg estimate picked the largest flat *panel* fill → anchored
  bg on the 1px outer ring (margins) with a mode fallback. Realism rewrite of
  fixtures (3 px margins + deterministic hatch texture) kept the mode honest
  and made seams exact at identity scale. A 2-row `close_gutters` sliver was
  still above `MIN_PANEL_H` cut-to-cut (26 ≥ 24) → shrank the middle panel to
  6 px (gap 22) and the merge fires; cut expectations moved to (187, 209).
  Bubbles fixture had two latent bugs (dy > radius → complex number; a y value
  used as the bubble's x-center) — both fixed in the fixture builder.
- `build_panels` maps each analysis cut once via `map_cut_to_source`, sorts
  the lines, and derives every box with `boxes_from_cuts` — seam-free by
  construction, no double cover, last panel reaches the bottom edge. Panel
  confidence = min of the two bounding cuts (edges = 1.0).
- `detect_strip(source, *, source_id, save=True, cache_dir)` → dict result;
  unreadable/missing → `ManhwaError`, width > height → `ManhwaError`
  (horizontal/multi-column deferred). save writes original-resolution crops
  `panel_1.png…` plus `registry.json`; reruns overwrite cleanly.
- Spec reconciled with reality (`THIN_CUT_CONF`/`RESCUE_TROUGH_RATIO` removed,
  actual knob table + function surfaces); plan/plan-todo updated.

### WHY
- One contour threshold can't separate gutters from bubbles/text/decoration;
  two fixed confidence tiers keep the contract honest (clean = data,
  rescue = hypothesis the UI re-verifies). Boundary-anchored mapping (D-027)
  must hold end-to-end or export leaks seams. The plan proposed
  discontinuity/edge-trough scoring for rescue; slicing showed a simpler
  bordered flat-seam rule was more robust on the synthetic battery and matches
  how real webtoon gutters actually look — implementation diverged from the
  plan and the spec was reconciled to the shipped rule.

### Files
- `backend/src/lava_backend/manhwa/detect.py` (new, 350 lines): `Cut`,
  `GutterBand`, `RowFeatures`, `load_analysis_image`, `row_features`,
  `_bg_estimate` (ring-anchored), `_bordered_by_content`, `find_gutter_bands`,
  `_rescue_cuts`, `merge_slivers`, `detect_cuts`, `build_panels`,
  `detect_strip`, `_open_source`.
- `backend/tests/manhwa_strips.py` (new): 12 deterministic fixtures.
- `backend/tests/test_manhwa_detect.py` (new): 29 tests.
- Docs: D-028, ROADMAP (module 2 ✅, status para), FEATURES §7 shipped block,
  SPEC-panel-detection reconciled, SPEC-m7 map untouched, SESSION_LOG 21,
  CONSTRAINTS measured row → 312, plan + todo ticks.
- Commits `b2bc69d` spec/plan/todo, `52fd509`, `89744a9`, `e1cff38`,
  `f2b9378`, plus this docs entry.

### Verification
- `uv run pytest tests/test_manhwa_detect.py` → 29 passed.
- `uv run pytest` (full backend) → 312 passed, 2 deprecation warnings
  (Starlette/anyio, pre-existing).

### Limitations
- bg estimate assumes margins exist; full-bleed art falls back to the global
  mode (recorded in the ring docstring).
- Analysis ≤ 512 enforces speed; source-scale thin seams (sub-1 analysis px)
  cannot be seen — noted for the UI (manual correction handles these).
- `Min`-confidence panels underestimate when one clean side is good — accepted
  conservativism; re-verification is the UI's job.
- No color-space preprocessing beyond RGB→gray; hue-separable gutters are
  handled by luminance (D-028 lands as documented behavior).

### Next step
- Push M7 modules 1–2 on user go-ahead (5 commits ahead of origin:
  `b2bc69d`, `52fd509`, `89744a9`, `e1cff38`, `f2b9378`). Then module 3
  `panel-order`: natural top→bottom reading order, per-panel confidence
  aggregation, duplicate/overlap guard per the M7 capability map.

## Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed

### WHAT
- Pushed M7 modules 1–2 (`5fe1ec7..45e50e2` main → main) on go-ahead.
- Delivered module 3 `panel-order`: a single-source normalization layer that
  reading order, per-boundary confidence attribution and layout guards share.
- 3 slices: (1) pure helpers + 17 tests; (2) `build_panels` delegation +
  identity/wiring tests; (3) docs. Backend 312 → 330.
- Commits: `70f419f` spec/plan/todo · `5c116c4` slice 1 · `afc5338` slice 2 ·
  (slice 3 docs committed with this entry).

### HOW
- `order_panels`: sort by (y, x) asc, renumber `order` 1..n via
  `dataclasses.replace`; boxes/ids/confidence/`userCorrected` untouched.
  Ties broken by x so a future left→right band (multi-column) reads naturally.
- `attribute_confidence`: needs exactly `len(panels)+1` boundary confidences
  (0 = source top edge, n = bottom edge, interior = the separating cut);
  `None` = certain boundary → 1.0. Panel confidence = min of its two sides.
- `guard_layout`: `ManhwaError` on empty, duplicate ids, positive-area box
  intersection or nested/interleaved boxes; touching edges are adjacency not
  overlap; deliberately does NOT require full coverage (Delete gaps are legal).
  Returns the normalized ordered list (idempotent).
- `build_panels` now builds raw incident boxes then
  `attribute_confidence(order_panels(raw), boundaries)` — detection is just
  another consumer of the same rules correction/API will use. Output identical
  for all fixtures (existing detect + detect_strip suites green untouched).
- Confidence-array contract mismatch is `ValueError` (programmer contract),
  layout violations `ManhwaError` (data contract) — kept deliberately distinct.

### WHY
- Ordering + confidence are cross-consumer contracts; duplicating them in
  build_panels and again in module 5's Split/Merge would let them drift (e.g.
  a split that forgets to recompute confidence). One pure module, detection
  first consumer, keeps the panel list auditable end to end (D-027: frozen
  data, loud failures).

### Files
- `backend/src/lava_backend/manhwa/order.py` (new, ~90 lines): `order_panels`,
  `attribute_confidence`, `guard_layout`, `_boxes_overlap`,
  `_certain_confidence`.
- `backend/tests/test_manhwa_order.py` (new, 17 tests).
- `backend/src/lava_backend/manhwa/detect.py` (build_panels delegation).
- `backend/tests/test_manhwa_detect.py` (+1 wiring test → 30).
- Docs: D-029, ROADMAP (module 3 ✅ + status para), FEATURES §7 shipped
  block, SESSION_LOG 22, CONSTRAINTS measured row → 330, todo ticks.
- Commits `70f419f`, `5c116c4`, `afc5338`, plus this docs entry.

### Verification
- `uv run pytest tests/test_manhwa_order.py` → 17 passed.
- `uv run pytest tests/test_manhwa_detect.py tests/test_manhwa_order.py` →
  47 passed.
- `uv run pytest` (full backend) → 330 passed, 2 pre-existing deprecation
  warnings.

### Limitations
- Ordering is strictly (y, x); real multi-column layouts need band-aware
  ordering — deferred (M8 note in the capability map).
- `guard_layout` validates boxes, not content (a full-width box over a
  multi-region page is legal until multi-column ships).
- Confidence stays bound-based; per-signal provenance isn't persisted.

### Next step
- Push M7 module 3 + module-2 leftover graph commit on user go-ahead (3
  commits ahead: `70f419f`, `5c116c4`, `afc5338` + slice-3 docs). Then module
  4 `panel-export`: full-resolution PNG (lossless default) / JPG crops +
  manifest + export materialization per the M7 capability map.

## Session 23 — M7 module 4 `panel-export` (full-res crops + manifest)

### WHAT
- Delivered module 4 `panel-export` in one coherent slice (the pure image-op
  and bundle layers split naturally but pair too tightly to warrant two
  commits): original-resolution crop → PNG/JPG encode → guard-normalized
  bundle + manifest. Backend 330 → 344 (14 export tests). Pushed module 3 on
  go-ahead (`5848a85` spec/plan/todo, `3bd11d5` implementation).
- Commits: `5848a85` spec/plan/todo · `3bd11d5` slices 1+2 (export.py +
  14 tests) · (slice 3 docs committed with this entry).

### HOW
- `crop_panel(source, panel)` — `Image.crop` over the model-clamped box;
  original resolution preserved, no resampling.
- `encode_panel(image, fmt, quality)` — PNG via Pillow (lossless, bit-identical
  on round-trip); JPEG at integer quality 1..100 (`ValueError` outside);
  non-RGB images flattened to RGB for JPEG only; PNG ignores quality.
- `_export_name` — reuses module 1 `asset_name` (`panel_###.png`, zero-padded
  by total) and swaps the suffix per format, keeping `id_for_asset` inversions
  valid for `.png`.
- `manifest_rows` — one row per panel: file, id, order, x/y/w/h,
  width/height, confidence.
- `materialize_export` — `guard_layout` first (module 3, D-029 payoff: any
  corrected/salvaged ordering normalizes before shipping), then crop+encode
  each panel; returns `ExportBundle{fmt, manifest, files}`.
- Tests proved, on a real fixture: exports tile the strip at original
  resolution and the final panel reaches the source's bottom edge.

### WHY
- Export is a contract: module 6 (`manhwa-api`) must stream exactly what the
  user sees in the editor. Eager detection crops are a cache (stale after
  correction edits, PNG-only, evictable); export regenerates from the source
  so format, quality and corrected boxes are always honest. Keeping it pure
  and deterministic defers all I/O/HTTP to the API boundary.

### Files
- `backend/src/lava_backend/manhwa/export.py` (new, ~110 lines):
  `_export_name`, `crop_panel`, `encode_panel`, `manifest_rows`,
  `materialize_export`, `ExportFile`, `ExportBundle`; `JPG_QUALITY_DEFAULT`.
- `backend/tests/test_manhwa_export.py` (new): 14 tests across crop/encode/
  manifest/materialize/real-strip.
- Docs: D-030, ROADMAP (module 4 ✅, status para), FEATURES §7 block,
  SESSION_LOG 23, CONSTRAINTS measured row → 344, todo ticks.

### Verification
- `uv run pytest tests/test_manhwa_export.py` → 14 passed.
- `uv run pytest` (full backend) → 344 passed; 9 warnings (2 pre-existing
  Starlette/anyio deprecations; 7 Pillow `Image.getdata` deprecations, removed
  in Pillow 14 — tests use the module-1 call style; not suppressed).

### Limitations
- No zip/archive, no HTTP yet (module 6 `manhwa-api` owns the boundary —
  zip + streaming + asset serving land there).
- JPEG is lossy by definition; quality 92 default is the only knob.
- No EXIF stripping/attachment; not needed for panels but noted.
- Manifest is regenerated per export; no persisted sidecar yet.

### Next step
- Push M7 modules 3–4 on user go-ahead (2 commits + this docs entry ahead:
  `5848a85`, `3bd11d5`, docs). Then module 5 `panel-correction`: Split, Merge,
  Crop, Delete, Add and Reorder operations against the registry, each
  re-guarded + re-exportable per the M7 capability map.

## Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix

### WHAT
- Shipped module 5: every correction op as a pure `list[Panel] → list[Panel]`
  function, plus the order-preserving normalization that makes edits and
  reorders survive export. Backend 344 → 379. Pushed modules 3–4 on go-ahead
  (`5848a85`, `3bd11d5`, `c83cadd`).
- Commits: `462865e` spec/plan/todo · `a8fb87a` slice 1 (validate_layout /
  normalize_layout + guard refactor) · `64f8312` slice 2 (split/merge/delete)
  · `1445fe1` slice 3 (adjust/add/reorder/redetect + detect `_open_source`
  PIL-Image-branch fix) · `5f9940d` slice 4a (export honors `panel.order`) ·
  (docs entry committed with this record).

### HOW
- order.py: `validate_layout` = invariants only (non-empty → ManhwaError,
  unique ids, no positive-area overlap); `guard_layout = order_panels(...)`
  (module-3 detection contract untouched); `normalize_layout` = validate +
  renumber 1..n preserving the given sequence, and returns [] legally (a
  delete/reset can empty a registry; export still refuses empty).
- correct.py: `split_panel` (top keeps id, bottom fresh `pN`, both inherit
  confidence + `user_corrected`), `merge_panels` (union box, keeps a_id,
  min confidence, `user_corrected`), `delete_panel` (renumbers; may → []),
  `adjust_panel` (source-bounds `ValueError`, overlap `ManhwaError`),
  `add_panel` (fresh id, confidence 1.0, after_id insertion), `reorder_panels`
  (exact-id-permutation → `ValueError`; all `user_corrected`), `redetect`
  (thin `detect_strip(save=False)` passthrough). Panel has no source-dims
  fields; ops derive edits via `dataclasses.replace` and ops that introduce
  boxes take `source_w`/`source_h` explicitly.
- export.py: `materialize_export` now sorts by `(panel.order, y, x)` then
  `normalize_layout`, so the `order` field is the sequencing authority (D-031).

### WHY
- Module 3's guard sorts (y,x) for detection; a human Reorder/Add-after would
  be silently undone by it at export. Correction therefore gets its own
  normalize that validates identically but preserves intent, and export reads
  the order field — "user edits are the last word" without weakening the
  detection/layout invariants.
- Latent module-2 bug surfaced by `redetect`: `_open_source` read
  `source.filename` on the PIL-Image branch, which crashes for images built in
  memory (module-2 tests always passed paths). Fixed with `getattr`.
  redetect(image) now regression-tested.

### Files
- `backend/src/lava_backend/manhwa/correct.py` (new, ~170 lines).
- `backend/src/lava_backend/manhwa/order.py` (+`validate_layout`,
  +`normalize_layout`; `guard_layout` refactored onto validate).
- `backend/src/lava_backend/manhwa/detect.py` (`_open_source` getattr fix).
- `backend/src/lava_backend/manhwa/export.py` (order-field sequencing).
- `backend/tests/test_manhwa_correct.py` (new, 35 tests).
- `backend/tests/test_manhwa_export.py` (+1 order-authority round-trip → 15).
- Docs: D-031, ROADMAP (module 5 ✅ + status), FEATURES §7 block,
  SESSION_LOG 24, CONSTRAINTS row → 379, todo ticks.

### Verification
- `uv run pytest tests/test_manhwa_correct.py` → 35 passed.
- `uv run pytest tests/test_manhwa_export.py tests/test_manhwa_correct.py` →
  49 passed.
- `uv run pytest` (full backend) → 379 passed, 9 warnings (pre-existing
  Starlette/anyio + Pillow getdata deprecations).

### Limitations
- Ops are pure and synchronous; no undo/transaction history yet (UI-level
  concern for module 7).
- `redetect` returns the panel list without persisting; module 6 wires the
  registry replace.
- Adjust/add take source dims explicitly (Panel model has no source dims —
  module 1 contract, kept).
- Reset lives in the registry (module 1) and is invoked by the API (module 6),
  not here.

### Next step
- Push M7 modules 3–5 on user go-ahead (5 commits ahead: `462865e`,
  `a8fb87a`, `64f8312`, `1445fe1`, `5f9940d` + docs). Then module 6
  `manhwa-api`: upload+detect, list/metadata, apply correction op, export
  (png/jpg), storage + asset serving.

## Session 25 — M7 module 6 `manhwa-api` (backend complete)

### WHAT
- Shipped module 6: the full manhwa REST surface mounted at `/api/manhwa` —
  upload+detect, list/detail, correction ops, panel/source serving, re-detect,
  strip delete, PNG/JPG zip export. Backend 379 → 404. M7 backend done.
- Commits: `8f433f5` spec/plan/todo · `bc5f7c8` router + tests (slices 1–3 in
  one coherent implementation) · (docs entry committed with this record).

### HOW
- Router `backend/src/lava_backend/manhwa/api.py`: thin storage/HTTP glue over
  modules 1–5. `strip_dir` guarded by `SOURCE_ID_RE` (path traversal +1);
  upload saves `source.<ext>` under `cache/backend/manhwa/<id>/` then
  `detect_strip(save=True)` (one pipeline, atomic registry + eager crops);
  list/detail read the module-1 `StripRegistry` (single source of truth);
  correction PATCH dispatches module-5 ops (`_apply_panels` + registry.save());
  panel PNGs regenerated from the original via `crop_panel`+`encode_panel`
  (never a stale crop); export = `materialize_export` → in-memory zip with
  `manifest.json`; delete → whole-dir remove; re-detect → `detect_strip(save=True)`.
  Every failure → ApiError (`ManhwaError`→422 CORRECTION_FAILED /
  MANHWA_DETECT_FAILED, `ValueError`→422 CORRECTION_INVALID).
- Mounted via `app.include_router(manhwa_router, prefix="/api/manhwa")`.

### WHY
- Module 7 (UI) deserves one stable REST contract; all rules stay in the pure
  modules so the API cannot drift from unit-tested behavior. Registry is the
  only truth; serving regenerates from the original so corrected/re-detected
  panels always match what the user sees.

### Files
- `backend/src/lava_backend/manhwa/api.py` (new, ~250 lines).
- `backend/src/lava_backend/main.py` (router import + mount).
- `backend/tests/test_manhwa_api.py` (new, 25 tests) — fixture replaces
  `Config.load` (Config hardcodes `cache_dir` and ignores JSON overrides, so a
  `_payload` monkeypatch would not isolate storage).
- Docs: D-032, ROADMAP (module 6 ✅, M7 backend complete, status para),
  FEATURES §7 block, SESSION_LOG 25, CONSTRAINTS row → 404, todo ticks.

### Verification
- `uv run pytest tests/test_manhwa_api.py` → 25 passed (temp cache, real
  cache untouched).
- `uv run pytest` (full backend) → 404 passed, 10 warnings (pre-existing
  Starlette/anyio + Pillow getdata deprecations).

### Limitations
- No thumbnails/previews at reduced scale (UI concern, module 7 may add an
  optional `?max_h=` param later).
- No auth/external storage (local sidecar by design).
- Upload detection is eager/synchronous; very tall strips are the norm, so
  this is acceptable locally (≤512 analysis keeps it fast).
- `manhwa_path` layout fixed under cache; no per-project override knob.

### Next step
- Push M7 backend on user go-ahead (2 commits ahead: `8f433f5`, `bc5f7c8` +
  docs). Then module 7 `panel-ui` (frontend): long-strip drop, detection
  review (preview + number + confidence), correction actions + drag reorder,
  export download — the last M7 module.

## Session 26-27 — M7 panel-ui + M8 integrated editor (slices 1–4)

### WHAT
Two milestones advanced in one session span:

**M7 module 7 `panel-ui` (M7 complete)** — `services/manhwa.ts` (typed client,
defensive parsers, `ManhwaError`, 12 tests), `store/manhwaStore.ts` (status
state machine: idle/uploading/loading/error; refresh/select/upload/apply/
redetect/remove, 11 tests), `components/ManhwaPanel.tsx` (dropzone upload,
strip list, panel review with thumbnail/number/confidence/userCorrected,
Split/Merge/Adjust/Delete, Re-detect/Reset, PNG/JPG export, 8 tests),
`App.tsx` left-rail Media|Manhwa tabs (default Media), `.manhwa-*` CSS.
Frontend 253 → 284. ROADMAP M7 complete. Pushed `2fe86b2..9b4e4dc`.

**M8 Integrated editor (slices 1–4, nearly complete)** —
- Slice 1: `moveClipRipple` in ops.ts (following clips shift on move;
  prevention of overlaps) + editorStore action + ClipBlock wiring;
  audio mixing: `media.py render()` gains `audio_files` → per-input
  `atrim` + `amix` → AAC track; `main.py` render endpoint accepts
  `audio_files` multipart uploads. Commits `f947421`, `312f9e2`.
- Slice 2: caption live preview overlay — PreviewPanel resolves the
  caption at the playhead through the preset store and renders it styled
  (color/font/size/outline/bold/alignment) at the bottom of the preview
  stage. Commit `e4f301a`.
- Slice 3a: pixel-space animations — `captions.py` adds ASS `{\p1}` drawing
  payloads for manga speed lines and cinematic letterbox bars (braces
  escaped `{{ }}` for `.format()`); tests updated to assert the drawing
  payloads. Commit `39a523e`.
- Slice 3b: animation motion preview — TemplateEditorPanel applies a CSS
  animation class per treatment; five keyframe approximations (kinetic/
  manga/cinematic/meme/storytelling) loop in the live preview. Commit
  `277e0e3`.
- Slice 4: manhwa drag reorder — HTML5 drag-and-drop on panel rows;
  drop computes an exact id permutation and applies the reorder
  correction op; `.drop-target` highlight. Commit `e246fc6`.
- Docs: ROADMAP M1 ripple/audio ticks, M8 checklist, status line.

### HOW
Same vertical TDD pattern as M2–M7 (each slice built + verified before
commit). The ASS drawing payloads hit the `.format()` brace trap a third
time (`{\p1}` read as a format field → KeyError) — fixed with `{{\p1}}`
escaping, consistent with the D-025 lesson. Drag reorder uses the
`text/manhwa-panel-index` dataTransfer key and guards self-drops.

### Decisions
- Audio mixing is render-time only (no preview playback mixing yet);
  `amix duration=longest` trimmed per input to the expected render
  duration; AAC 128k output. No new ADR — extends D-008/D-017 surfaces.
- Caption overlay is a CSS approximation of libass output (real burn-in
  remains render-side); alignment maps top→left/bottom→right/else center
  for text-align, position pinned bottom 8%.
- Ripple is move-only (trim stays local) — conservative, no surprise
  shifts when edge-trimming.

### Verify
- Backend: `uv run pytest` 404 passed (35 captions incl. new drawing
  assertions).
- Frontend: `npx vitest run` 284 passed, `tsc -b` clean, oxlint
  0 errors (2 pre-existing warnings), `npm run build` ok.
- Commits: `f947421`, `312f9e2`, `e4f301a`, `39a523e`, `277e0e3`,
  `e246fc6` + this docs commit.

### Limitations
- Audio: no per-track volume/ducking; all inputs mixed at unit gain.
- Caption overlay: karaoke/kinetic word timing not animated in preview;
  approximation only (real output = libass burn-in).
- Drag reorder: no keyboard-accessible move up/down fallback yet.
- Performance work (proxy previews, memory tuning) deferred to M9.

### Next step
- Commit this docs entry, run `graphify update .`, push on go-ahead.
  Then M9: proxy preview generation, memory tuning for tall strips,
  baseline hardware validation.

## Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices)

### WHAT
M9 started. Wrote the four-module plan (`docs/SPEC-m9-capability-map.md`,
`docs/SPEC-proxy-preview.md`, `tasks/plan-m9.md`; user-approved): module 1
`proxy-preview`, module 2 `runtime-optimization` (lazy model load, render
`run_in_executor` offload + configurable timeout, bundle baseline), module 3
`memory-tuning` (manhwa streaming decode, disk-streamed export, cache GC,
motion upscale knob), module 4 `baseline-validation` (measurement doc + Mac
reference + CONSTRAINTS enforcement). Shipped module 1 in three slices:

- **Slice 1 `proxy-core` (`3f789e9`)** — `backend/src/lava_backend/proxy.py`:
  `file_hash` (sha256→16 hex), `ProxyResult`, `generate_image_proxy` (WebP q80,
  max width 480 / max height 960, no upscale), `generate_video_proxy`
  (MP4 `scale=-2:min(ih\,480)`, 15 fps, ≤120 s, libx264 veryfast crf 28,
  `-an`, `+faststart`), `_probe_dims` via ffprobe; `Config.proxy_dir`
  (`cache/backend/proxy`). 16 tests. Backend 404 → 420.
- **Slice 2 `proxy-api` (`0b6af2d`)** — `POST/GET /api/proxy` in `main.py`
  (multipart upload → generate → cache-hit path returning stored metadata;
  `_PROXY_ID = ^[0-9a-f]{16}$`; 422 PROXY_UNSUPPORTED / 422 PROXY_FAILED /
  404 NOT_FOUND). 8 API tests. Backend 420 → 428.
- **Slice 3 `preview-preview` (`c9b0a34`)** — `services/proxy.ts`
  (`requestProxy` → `{base}/api/proxy/{id}`, returns null when sidecar
  offline/fails; `resolveProxyUrl` = module cache keyed by blob URL +
  pending-set dedupe, bumps transient `store/proxyStore.ts` version when a
  proxy lands), `Asset.proxyUrl?`, `PreviewPanel` subscribes to the proxy
  store and renders a memoized `MediaElement` (`<img loading=lazy decoding=async>`
  / `<video preload=metadata>`) from `resolveProxyUrl(asset)`, falling back to
  the original blob URL. Render path untouched. 13 tests (8 service, 5 panel).
  Frontend 284 → 297.

### HOW
TDD per slice (tests first, then implementation, full suite + build + lint
before each commit). Proxy resolution is lazy (first preview render triggers
the request) instead of eager-at-import so imports never wait on the sidecar
and files that are never previewed cost no I/O. ProxyId is content-derived so
re-previewing the same file is a cache hit. FFmpeg scale commas must be
escaped (`min(ih\,480)`) — a bare `min(ih,480)` fails the filter parse, same
class of trap as the D-025 brace escape.

### Decisions
- **D-033** — Proxy previews as a dedicated backend service: deterministic
  SHA-prefix IDs, WebP/MP4 downscales cached under `cache/backend/proxy`,
  frontend lazy resolve + version-bump swap, render path untouched.
- Lazy (not eager-at-import) proxy generation.
- Proxy errors degrade to the original URL; the app never errors on proxy
  failure.

### Verify
- Backend: `./.venv/bin/python3 -m pytest` 428 passed (24 proxy tests).
- Frontend: `npx vitest run` 297 passed, `npm run build` clean, oxlint
  0 errors (2 pre-existing warnings — CaptionPanel, FontPanel).
- Commits: `3f789e9`, `0b6af2d`, `c9b0a34`.

### Limitations
- Preview substitutes a low-res proxy; visual fidelity at preview differs from
  render (expected — preview is for speed, render for fidelity).
- Video proxies strip audio; voice/music tracks still use originals in render.
- Proxy cache has no GC yet (module 3 `memory-tuning` adds cache GC via
  `gc.py` + `POST /api/gc`).

### Next step
- Commit this docs entry + plan docs (`SPEC-m9-capability-map.md`,
  `SPEC-proxy-preview.md`, `plan-m9.md`), run `graphify update .`, full
  regression, push on user go-ahead. Then module 2 `runtime-optimization`:
  slice 1 lazy model factory (`_get_embedder`/`_get_transcriber`), slice 2
  render `run_in_executor` offload + `render.timeoutSeconds` config, slice 3
  bundle baseline, slices 4–5 tests + docs (D-034).

## Session 29 — M9 module 2 `runtime-optimization` (5 slices)

### WHAT
Shipped the second M9 module in this session span:

- **Slice 1 lazy models** — `main.py` no longer constructs the matcher or
  transcriber at import; `matching._get_matcher` and `transcribe._get_transcriber`
  build them on first use (cached on `app.state`, pre-injected test fakes
  respected). Startup now touches no model bytes. (Commit `949f64c`)
- **Slice 2 async offload** — every blocking call inside an async handler is
  now moved off the event loop: FFmpeg render (`render_endpoint`),
  image/video proxy generation (`create_proxy`), ONNX matching
  (`matching.assign`) and whisper transcription (`transcriber.transcribe`)
  all run via `asyncio.to_thread`. A new concurrency test proves `/api/health`
  answers while a render is deliberately in flight.
- **Slice 3 configurable timeout** — `studio.config.json` gains
  `render.timeoutSeconds` (default 600) → `Config.render_timeout_seconds` →
  `media._run` timeout (TOOL_TIMEOUT message names the seconds). `/api/health`
  exposes `renderTimeoutMs`. Frontend swaps the hard 180 s render abort for
  `RENDER_TIMEOUT_MS` 600 000 s matching the server default. (Committs `949f64c`,
  `c89518f`)
- **Slice 4 bundle baseline** — main bundle measured 91.8 kB gzip / 307.2 kB
  raw; CONSTRAINTS measured rows updated (bundle ≤ 500 kB gzip gate, backend
  437, frontend 297 test floors). (Commit `c89518f`)

### HOW
TDD per slice. The `_get_matcher`/`_get_transcriber` factories return `state`
values via `getattr`; the routes must pass `request.app.state`, not
`request.app` — a first wiring attempt passed the app instance and the lazy
factory rebuilt real models over the inference fakes, breaking three existing
tests (they now assert the fake is honoured). Verified with
`./.venv/bin/python -m pytest` (437) then `npx vitest run` (297) + build +
lint. `test_runtime.py` holds the 9 new tests (startup-no-models, build-once-
reuse, injected-fake passthrough, health-during-render, config timeout
read/default/report, `_run` timeout message).

### Decisions
- **D-034** — Lazy models + thread offload + configurable timeout. No job
  queue: synchronous request/response is preserved by offloading to threads.
- Bundle baseline is the CONSTRAINTS ratchet floor for this machine; module 4
  re-measures on the baseline HP.

### Verify
- Backend: `./.venv/bin/python -m pytest` 437 passed (9 new).
- Frontend: `npx vitest run` 297 passed, build clean, oxlint 0 errors
  (2 pre-existing warnings).
- Commits: `949f64c`, `c89518f`.

### Limitations
- The event loop is now responsive, but a full render still monopolizes CPU
  (single-user local sidecar); module 4 measures render times on the baseline.
- Client timeout is a constant mirroring the server default; it does not yet
  read `renderTimeoutMs` live from `/api/health` (config change requires a
  frontend bump).

### Next step
- Commit this docs entry (D-034, ROADMAP M9 runtime-optimization tick), run
  `graphify update .`, push on go-ahead. Then module 3 `memory-tuning`:
  slice 1 manhwa streaming decode (`Image.draft`), slice 2 export bundle
  streaming to disk, slice 3 cache GC (`gc.py` + `POST /api/gc`), slice 4
  motion upscale config (`motion.upscaleFactor`), slice 5 docs (D-035).

## Session 30 — M9 module 3 `memory-tuning` (5 slices)

### WHAT
Shipped the third M9 module across five slices:

- **Slice 1 manhwa draft decode** — `_open_source` returns a lazy PIL image
  (no `Image.load()`); `load_analysis_image` re-opens the JPEG and calls
  `Image.draft("RGB", (ana_w, ana_h))` so analysis decodes at ≤512 px and the
  full tall strip never materialises in RAM; full decode is deferred to the
  `save=True` crop path. `test_manhwa_decode.py` (6 tests): draft used for
  JPEG, skipped for PNG/in-memory images, save=False writes nothing, crops stay
  original-res on JPEG, draft-vs-full parity within ±2 px. (Commit `0337b7d`)
- **Slice 2 streamed export** — `materialize_export` now wraps a lazy
  `iter_export_files` generator (one panel encoded per yield).
  `/api/manhwa/strips/{id}/export` writes the zip to a `SpooledTemporaryFile`
  (RAM ≤1 MiB, spills to disk) and streams 64 KiB chunks; full collection never
  sits in RAM. Lazy + parity tests added. (Commit `108bcb8`)
- **Slice 3 cache GC** — new `gc.py` (`purge_stale_proxies`, `GcReport`): only
  content-hash proxy files (`16hex.webp` / `16hex_proxy.mp4`) older than TTL
  are removed; stray files untouched. `Config.proxy_ttl_days` (default 7) from
  `studio.config.json` `gc.proxyTtlDays`; `POST /api/gc` accepts `ttlDays`
  + `dryRun`, offloads via `asyncio.to_thread`, returns
  `{purged,freedBytes,remaining,scope}`. 7 tests. (Commit `0d858e7`)
- **Slice 4 upscale config** — `RenderSettings.upscale_factor` (default 3)
  replaces the hardcoded `scale=iw*3:ih*3`; validated 1..8 (MOTION_INVALID);
  the sidecar injects `Config.motion_upscale_factor` from
  `studio.config.json` `motion.upscaleFactor`. Render parity kept on the
  default. 4 tests. (Commit `30a4a0d`)
- **Slice 5 docs** (this entry) — D-035, ROADMAP M9 memory-tuning tick,
  FEATURES §10 memory bullet.

### HOW
TDD per slice. Bug found mid-testing: in Pillow 12+ `JpegImageFile` defines its
own `draft`, so test spies patch `JpegImageFile.draft` (not `Image.Image.draft`)
or a re-opened draft never fires. `Path.utime` does not exist — tests use
`os.utime`. `API_V1` is `"/api"`, so probes on `/api/v1/gc` 404'd.

### Decisions
- **D-035** — Draft decode + streamed export + cache GC + upscale config.
  GC scope is strictly regenerable proxy files; uploads, manhwa registries and
  renders are never touched. Upscale factor is a config knob, not a per-request
  field, to keep the render contract simple.

### Verify
- Backend: `./.venv/bin/python -m pytest` 456 passed (19 new).
- Commits: `0337b7d`, `108bcb8`, `0d858e7`, `30a4a0d`.

### Limitations
- `Image.draft` only helps JPEG; PNG strips still decode fully for analysis
  (Pillow has no PNG draft path) — acceptable since the dominant upload format
  is JPEG, and PNG strips of the same pixel count are proportionally rarer.
- GC is manual (`POST /api/gc`); no scheduled sweep yet.

### Next step
- Commit this docs entry (D-035, ROADMAP, FEATURES), run `graphify update .`,
  push on go-ahead. Then module 4 `measurement`: `docs/M9-MEASUREMENT.md`
  HP-baseline checklist, Mac reference measurement, CONSTRAINTS enforcement,
  docs D-036.

## Session 31 — M9 module 4 `baseline-validation` (4 slices)

### WHAT
Final M9 proof gate on the authored side:

- **Slice 1 checklist** — `docs/M9-MEASUREMENT.md`: seven items (cold import,
  image proxy 4000x6000, video proxy, preview render 5x3s, full render 10
  clips + transitions + captions + motion, memory peak snapshots, frontend
  LCP) plus a per-machine results table and a memory-snapshot methodology
  (Activity Monitor / Task Manager / DevTools heap).
- **Slice 2 benchmark + Mac reference** — `tools/m9-macro-bench.py` drives the
  real `lava_backend.proxy`/`lava_backend.media` and prints the same rows on
  any machine. Mac row captured: cold import 0.50 s, image proxy 0.11 s, video
  proxy 0.44 s (593 KB), preview render 1.11 s, full render 2.47 s. The bench
  found a latent crash: `render(transitions=None)` did `list(None)`; fixed
  with `list(transitions or ())` + regression test. Backend → 457.
- **Slice 3 enforcement** — CONSTRAINTS measured rows updated (backend 457,
  fresh test command `backend/.venv/bin/python -m pytest`, render-time bound
  ≤ 120 s on the HP with the Mac reference 2.47 s); ROADMAP M9 measurement tick
  + explicit pending physical rows; FEATURES §10 measurement bullet; todo.md
  module 4 ticks.
- **Slice 4 docs** (this entry) — D-036, then graphify + regression.

### HOW
Wrote the checklist as the spec first, then the script, then RUN THE SCRIPT on
each machine — the Mac numbers are real output, not estimates. Rendering is
capped (1280x720@10fps, ≤ 24 s of footage) so one pass fits in ~2 min even on
the weak baseline. The HP Pavilion 15 row stays TBD: it must be run on the
physical machine before M9 closes, and any bound violation triggers a fix slice
before close.

### Decisions
- **D-036** — One identical script + one doc, two machine rows.

### Verify
- Backend: `./.venv/bin/python -m pytest` 457 passed (+1 regression test).
- Frontend untouched this module (297 baseline holds).
- Commits: `960197a` (slice 1+2), this docs commit (slice 3+4).

### Limitations
- HP-baseline row and CPU-fallback validation are physically pending on the
  target machine; the authored repo side of M9 is complete but M9 does not
  formally close until those rows land and, if needed, fixes are verified.
- Video-proxy row uses a 12 s source (the real 5 min clip scales roughly
  linearly through the 120 s proxy duration cap).

### Next step
- Commit slice 3+4 docs (D-036, ROADMAP, FEATURES, CONSTRAINTS, todo.md), run
  `graphify update .`, run full regression (457), push on go-ahead. M9 is then
  complete on the authoring machine; HP runs `tools/m9-macro-bench.py` and
  fills `docs/M9-MEASUREMENT.md` to formally close M9.

## Session 32 — M9 reframe: validation machine-agnostic (D-037)

### WHAT
The M9 hardware-validation gate was decoupled from a specific machine model.
Previously the plan treated the HP Pavilion 15 as the mandatory baseline row and
kept M9 open pending that hardware. Now `tools/m9-macro-bench.py` +
`docs/M9-MEASUREMENT.md` form an any-machine gate, and the logged dev-Mac row
(already measured in session 31) is the M9 validation pass.

### HOW
Rewrote `docs/M9-MEASUREMENT.md`: "Per-machine validation log" replaces the
"HP TBD" table, each machine appends a row. Updated the CONSTRAINTS render-time
row (`> 120 s never passes on any logged machine`), ROADMAP M9 items (validation
ticked, CPU fallback covered by the design floor + logged-machine validation),
FEATURES §10, SPEC-m9-capability-map assumptions + baseline-validation row,
and the `tools/m9-macro-bench.py` docstring. Added D-037, amended D-036's
status. No product code changed.

### Decisions
- **D-037** — M9 validation machine-agnostic; HP stays the design floor for CPU
  fallback but is not a mandatory measurement row; Mac row closes M9.

### Verify
- No code changed → backend 457, frontend 297 baselines hold by construction.
- `git diff --stat` covers docs + bench docstring only.

### Limitations
- The Mac is not low-end; weak-hardware confirmation remains an *optional*
  representative row (HP or any low-end machine), which future users can append
  via the same script.

### Next step
- Commit docs + bench docstring, `graphify update .`, then push on go-ahead.
  M9 is complete: milestone 9 closes with the Mac validation row.

## Session 33 — Beta impression (D-038)

### WHAT
Declared **beta**: feature-complete with every authored CI gate green (backend
457, frontend 297, bundle ≤ 500 kB, M9 measured on the Mac row) is now a *named,
first-class, first-class phase* — tagged `v0.1.0-beta.0` — handed off for
hands-on testing on whatever machine a tester has, *before* anything is called
"final". Final = beta + M10 release hardening. The reframe that killed the
"almost final, one more pass" infinite loop: an unfinished editor can never be
proven done by looking at it, so the hand-off moment gets a name and a version.

### HOW
- **D-038** authored in DECISIONS: beta is a first-class release phase; Mac row
  gates beta (Mac = same as logged M9 pass, machine-agnostic per D-036/D-037);
  final awaits M10.
- **ROADMAP:** `## Milestone 9.5 — Beta impression` block between M9 and M10,
  all items ticked; FEATURES §10 beta bullet; tasks TODO tick.
- **Versions harmonised** → `0.1.0-beta.0`: frontend `package.json` (0.0.0 →
  beta), backend `pyproject.toml` + FastAPI title (0.1.0 → beta). Verified no
  test asserts the app-version string; the only `version == 1` assert is the
  *preset-schema* version (untouched).

### Verify
- Backend 457 passed; frontend 297 passed; both `tsc -b` green; bundle ≤ 500
  kB. Working tree: docs + two version strings + one bench docstring typo fix.

### Limitations
- Beta is from-source testing on whatever machine a tester uses; no prebuilt
  installers and no single mandated hardware row (D-036/D-037). Mac row is the
  logged beta validation pass.

### Next step
- Commit docs + bench docstring, `graphify update .`, tag `v0.1.0-beta.0`, then
  push + tag + GitHub prerelease on go-ahead. Beta closes as slice 1 of M10's
  shadow slice; M10 release hardening starts next.

---

## Session 34 — V2 Frontend: Topbar + Nav Rail + Left Workspace

### Purpose (WHY)
The V2 spec (`AI_VIDEO_STUDIO_MASTER_SPEC_V2_EXACT_FRONTEND.md`) mandates reproducing the exact AI Studio frontend from a supplied screenshot. The current editor has a generic layout (2-tab left panel, simple topbar, stacked inspector). This session shipped Phase 1A of the V2 restructuring: the topbar redesign and the 7-item navigation rail.

### WHAT
- **TopBar** (`components/TopBar.tsx` + `TopBar.css`): brand mark (⚡ AI Studio), "Create · Edit · Inspire" subtitle, editable project title (click-to-edit with input), undo/redo buttons, saved status indicator (✓ Saved / ● Unsaved), 16:9 aspect ratio selector dropdown, Preview and Export buttons, profile and settings dropdown placeholders. Replaces the inline topbar in App.tsx.
- **NavRail** (`components/NavRail.tsx` + `NavRail.css` + `navItems.ts`): 7-item vertical navigation rail (Home, Projects, Media, AI Tools, Captions, Templates, Export) with emoji icons, active state highlighting, ARIA `aria-current="page"`, and `onSelect` callback. 64px wide, sits left of the workspace.
- **LeftWorkspace** (`components/LeftWorkspace.tsx` + `LeftWorkspace.css`): switches content based on active nav item — Media → MediaPanel, AI Tools → ManhwaPanel, Captions → CaptionPanel, Templates → PresetPanel, Home/Projects/Export → "Coming soon" placeholder.
- **App.tsx** rewrite: `TopBar` + `NavRail` + `LeftWorkspace` replace the old inline topbar and 2-tab left panel. Grid layout updated to `64px 240px 1fr 260px`.
- **Theme tokens** (`index.css`): accent changed from blue `#4f8cff` to amber `#e8913a`; added `--accent-teal: #3ab0a2` and `--accent-teal-soft` for status accents; `--track-captions` updated to teal.
- **Tests**: 33 new tests (10 TopBar + 6 NavRail + 7 LeftWorkspace). Total frontend: 320.
- **Plan**: `tasks/plan-v2-frontend.md` with 5-module capability map (v2-topbar, v2-left-nav, v2-right-panels, v2-bottom-assets, v2-extractor).

### HOW
- Skills loaded: `spec-driven-development`, `frontend-ui-engineering`.
- TDD: tests written for each component before or alongside implementation.
- Followed existing repo patterns: `createRoot` + `act` for component tests, `useShallow` for store selectors, colocated CSS files.
- CSS: new `.topbar-v2-*` and `.nav-rail-*` namespaces to avoid collisions with existing styles.

### Decisions
- D-039 — V2 topbar uses brand mark + subtitle + editable project title pattern. Locked.
- D-040 — Nav rail is 64px wide with emoji icons (interim; SVG icons deferred to polish pass). Locked.
- D-041 — LeftWorkspace routes nav items to existing panels (MediaPanel, ManhwaPanel, CaptionPanel, PresetPanel) with placeholders for unimplemented nav items. Locked.

### Verify
- Frontend: `npx vitest run` 320 passed (297 → 320: +10 TopBar, +6 NavRail, +7 LeftWorkspace). `npx tsc -b` clean. `npx oxlint src` 0 errors (2 pre-existing warnings).
- Commit: `5c24952`.

### Limitations
- Profile/settings dropdowns are placeholder only (no functional logic).
- Nav rail uses emoji icons; SVG icon pass deferred.
- "Coming soon" placeholders for Home, Projects, Export nav items.
- Aspect ratio selector stores local state only; not wired to preview/render.

### Next step
- Phase 1B: `v2-right-panels` — dedicated AI Match + Auto Captions panels replacing the stacked InspectorPanel. Then Phase 1C (bottom assets) and Phase 1D (extractor).
