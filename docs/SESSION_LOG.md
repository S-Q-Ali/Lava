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
