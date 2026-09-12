# AI Video Studio — Decision Log

Lightweight architecture decision records (WHAT / WHY / HOW / Alternatives / Status). Append-only; newest at the bottom. Add an entry whenever a design choice is locked during a session.

---

## D-001 — Web-first editor shell (Vite + React + TypeScript)

- **Date**: 2026-09-12
- **WHAT**: The editor is currently a pure web app (`frontend/`); no native shell yet.
- **WHY**: No Rust toolchain available at session time; spec mandates CPU fallback and local-first which a web shell + local backend satisfies; web dev loop is fast. Tauri/native shell is scheduled later (Milestone 10 packaging / hardware validation).
- **HOW**: `create-vite` React-TS scaffold; Timeline/store logic written framework-agnostic (`src/editor/ops.ts` pure functions) so a native shell can reuse them.
- **Alternatives considered**: Tauri + Vite immediately (blocked on Rust); Electron (heavier, no benefit on this plan).
- **Status**: Locked for Milestone 1; revisit at M10.

## D-002 — Zustand + Zundo for state and undo/redo

- **Date**: 2026-09-12
- **WHAT**: Editor state in Zustand with Zundo `temporal` middleware for undo/redo.
- **WHY**: Small, fast, no boilerplate; Zundo adds knob-level undo/redo that the spec requires as a core editor operation; easy `partialize` to keep history on the timeline data only.
- **HOW**: `create(temporal(store, { limit: 100, partialize, equality }))`. History excludes transient UI state (playhead, selection).
- **Alternatives considered**: Redux (+redux-undo) — heavier; bespoke history stack — more code to maintain.
- **Status**: Locked.

## D-003 — Project-local FFmpeg binary

- **Date**: 2026-09-12
- **WHAT**: FFmpeg bundled inside the project at `tools/ffmpeg/bin/`, fetched by `scripts/fetch-ffmpeg.mjs` (darwin/win32/linux static builds).
- **WHY**: Local-first rule: media tooling stays inside the project folder; avoids system installs and version drift; path is configurable in `studio.config.json`.
- **HOW**: Script downloads a static build (FFmpeg 9.0.1 + ffprobe) via Node web streams into the gitignored `tools/ffmpeg/bin/`.
- **Alternatives considered**: System FFmpeg dependency (still a fallback option); npm `ffmpeg-static` (cross-platform but not project-bin-platform-agnostic).
- **Status**: Locked; binary gitignored, re-fetchable.

## D-004 — FFmpeg provider abstraction

- **Date**: 2026-09-12
- **WHAT**: `src/services/ffmpeg.ts` defines a provider interface; the web build ships `UnavailableFFmpegProvider` (explains that probe/render needs the local sidecar).
- **WHY**: Browsers cannot run FFmpeg; the editor must still work as a real editor without it; a swap-in provider lets the `backend/` sidecar (or Tauri) plug in without UI changes.
- **HOW**: Interface + factory; providers registered by runtime.
- **Alternatives considered**: Hard-coding "no FFmpeg" in the web client (fragile); moving all render to backend only (fine later, but abstraction keeps UI honest now).
- **Status**: Locked for web; sidecar provider is the active next step.

## D-005 — Curated vendor skills; reference clones kept local

- **Date**: 2026-09-12
- **WHAT**: `tools/agent-skills/` + `tools/anthropic-skills/` are gitignored reference clones; 12 relevant skills are curated into `.opencode/skills/` (plus checklists in `.opencode/references/`).
- **WHY**: Vendor repos are ~18 MB and re-clonable; the curated set is the project's actual operating surface and must be version-controlled with the repo.
- **HOW**: Default `*.gitkeep` + `.gitignore` rule for the vendor dirs; `.opencode/` committed (its `node_modules` ignored).
- **Alternatives considered**: Committing full vendor clones (~80 MB with plugin deps) — bloats history for no benefit.
- **Status**: Locked.

## D-006 — Commit `graphify-out/`; code-only pass for now

- **Date**: 2026-09-12
- **WHAT**: `graphify-out/` (graph.json, GRAPH_REPORT.md, graph.html) is committed; `cost.json` ignored. Graph built with `--code-only` initially.
- **WHY**: Committing the graph gives cold/compacted sessions a durable, queryable map of the codebase — part of the cross-session continuity system. The docs semantic pass needs an LLM API key that isn't configured yet.
- **HOW**: `graphify extract --code-only .` then `graphify cluster-only .`; `graphify update .` after code changes.
- **Alternatives considered**: Ignoring graphify-out entirely (kept only local) — weakens continuity for a tiny 532 KB cost.
- **Status**: Locked; revisit semantic pass when an API key is available.

## D-007 — Written session log + decisions log for continuity

- **Date**: 2026-09-12
- **WHAT**: `docs/SESSION_LOG.md` (append-only session entries with WHAT/HOW/WHY/Verify/Limitations/Next step) + this file.
- **WHY**: Session compaction/fresh sessions must be able to resume without chat history; Graphify tracks code state, not session intent — so written logs are the authority on "where we left off and why."
- **HOW**: AGENTS.md mandates appending to SESSION_LOG at session end; this log is append-only.
- **Alternatives considered**: Relying on ROADMAP checkboxes only (loses rationale and detail); in-memory handoff (dies with the session).
- **Status**: Locked — active policy.

## D-008 — Media sidecar HTTP API (FastAPI)

- **Date**: 2026-09-12
- **WHAT**: `backend/` is a FastAPI service exposing `GET /api/health`, `POST /api/probe`, `POST /api/render` (multipart upload of media files + JSON clips/settings) and `GET /api/files/{jobId}` (rendered `mp4`). The frontend's `HttpFFmpegProvider` auto-detects it and falls back to an unavailable provider.
- **WHY**: Browsers cannot run FFmpeg, but the spec requires the editor to be a real editor with rendering. A localhost HTTP contract gives the web shell honest rendering (images/videos → `mp4`) without a native shell, and the same contract can back a Tauri shell later.
- **HOW**: Multipart render keeps media bytes on the project-local `cache/backend/`; ffmpeg filter graph (fps→scale→pad→trim→setpts→concat) built in `media.py`; single error shape `{ "error": { "code", "message" } }` via a custom exception handler; `python-multipart` for form parsing; pytest + FastAPI TestClient suite.
- **Alternatives considered**: Tauri/Rust sidecar (no toolchain yet); Electron (no benefit on this plan); calling FFmpeg from the browser (impossible); WebAssembly builds (immature for full FFmpeg).
- **Status**: Locked for the media slice; ASR/matching/caption/Manhwa capabilities will extend the same service or add sibling services.

---

## D-009 — Versioned project file format (lava-studio JSON)

- **Date**: 2026-09-12
- **WHAT**: Project save/load exports a `.lava.json` envelope containing `app: 'lava-studio'`, `projectVersion: 1`, `savedAt` ISO timestamp, and a serialized `TimelineModel` (tracks, assets, clips, playhead, selection). `parseProjectJson` validates the envelope shape, rejects unknown versions or malformed contents with clear messages, and throws a `ProjectError`. The file is downloaded from the topbar "Save"; restored with "Open". Asset media bytes stay session-scoped (blob URLs) in a browser; the file stores structure and metadata. Tauri will persist real file paths later.
- **WHY**: Web-first M1 needs a durable save format without native filesystem access. Keeping it explicit and validated prevents silent corruption and makes future migration to a richer binary or Tauri-native format straightforward.
- **HOW**: Pure `serializeProject`/`parseProjectJson` in `editor/project.ts`; `saveProjectToFile`/`readProjectFromFile` helpers use Blob download and `FileReader`. Validation rejects bad JSON, unknown `projectVersion`, wrong `app`, and malformed assets/clips with specific `ProjectError` messages (testable via vitest).
- **Alternatives considered**: raw `TimelineModel` JSON (no envelope/versioning); IndexedDB for assets (over-engineered for M1); binary protobuf (no benefit yet).
- **Status**: Locked for the editor; assets will expand if media persistence or delta-based project files are added.

---

## D-010 — Local faster-whisper as the ASR engine

- **Date**: 2026-09-12
- **WHAT**: Voice narration transcription runs inside the media sidecar through `faster-whisper` (CT2-based) on CPU with `int8` compute and the `tiny` model by default. Models download lazily on first use into `models/whisper` inside the project folder. Speech is exposed via `POST /api/transcribe` (multipart `file` + optional `language`), returning segments with word timestamps/confidence, plus pause list. A `Transcriber` interface keeps the endpoint testable — `FakeTranscriber` (deterministic unit tests) vs real `WhisperTranscriber` (lazy model load).
- **WHY**: Local-first and runs on the baseline hardware (16 GB, MX250 2 GB). `tiny` fits the CPU-only path; bigger models are a config flag away. Word timestamps and (segment) confidence directly serve the voice-over differentiator and later caption highlighting.
- **HOW**: `transcribers.py` defines `Transcriber`/`WhisperTranscriber`/`FakeTranscriber`; `transcribe_core.py` owns pure pause/confidence math (0.3s default threshold, logprob→confidence mapping). Backend dev environment pinned to Python 3.12 (`uv python pin 3.12`) because `onnxruntime` publishes macOS x86_64 wheels only up to `cp312` and numpy<2 is required by onnxruntime 1.17.3 on this machine.
- **Alternatives considered**: whisper.cpp bindings (build complexity on macOS x86_64), transformers+Whisper (heavy, no CT2 speedup), OpenAI Whisper API (not local-first). skips VAD for now.
- **Status**: Locked for M2. Model-size tuning (tiny/base/small) is an open knob; VAD-based silence trimming deferred.

### D-011 — Transcripts persist inside the project file (version unchanged)

- **Date**: 2026-09-12
- **WHAT**: Narrations live in the editor store as `transcripts: Record<assetId, Transcript>` (temporal, undoable), persisted through an optional `model.transcripts` key in the `.lava.json` file. `parseProjectModel` validates each transcript strictly and rejects malformed ones, but a file without the key loads fine (backward compatible). Project `version` stays 1.
- **WHY**: User word edits must survive save/reload without inventing a second file format. Storing transcripts in the model keeps undo/redo uniform (word edits undo and redo across the whole timeline state).
- **HOW**: `voice.ts` `parseTranscript` normalizes sidecar JSON; `editorStore.setTranscript`/`updateTranscriptWord` mutate the map; `updateTranscriptWord` recomputes segment + full text from edited words; transcript analysis *status* is held in a separate non-temporal `transcriptStore` so transient "analyzing/error" state never pollutes history or the project file.
- **Alternatives considered**: separate transcripts store persisted as a sibling top-level key (drift risk, non-undoable); IndexedDB-backed transcripts (overkill).
- **Status**: Locked for M2; timing-edit re-segmentation (moving words in time) deferred to M3.

### D-012 — CLIP ViT-B/32 ONNX (fp32) for semantic image matching

- **Date**: 2026-09-12
- **WHAT**: Beat-to-image matching uses CLIP ViT-B/32 embeddings computed on the CPU via onnxruntime inside the media sidecar. The Xenova ONNX export lazy-downloads into project-local `models/clip/`; `clip.py` provides a lazy-session `Embedder` (Pillow 12.3.0 preprocess: resize/center-crop/normalize → (3,224,224); `tokenizers` text tokenization, max 77, bos/eot) plus pure cosine/softmax helpers. `model_key` selects the export. **The Xenova quantized export produces degenerate text embeddings** (unrelated prompts → cosine 1.0), so **fp32 `model.onnx` (605.8 MB) is the default**; opset verified on onnxruntime 1.17.3.
- **WHY**: Differentiator #1 (voice-over → semantic image matching) needs image+text in one latent space, local-first and CPU-runnable on baseline hardware. ONNX keeps the runtime as one pinned dependency already in the stack (fp32 infer on a 2 GB GPU-lite machine is CPU-only anyway).
- **HOW**: `clip.py` `ClipEmbedder` (lazy session + tokenizer; `_pick` resolves ONNX outputs via `session.get_outputs()` names — ORT has no `.output_names`); `models/` as the gitignored root; tests use `FakeEmbedder`; real-model smoke validated assignment ordering (sunset→sunset 0.220 > cat 0.206; e2e confidences 0.34–0.35).
- **Alternatives considered**: quantized model (failed — degenerate text embeddings); transformers/lib CLIP (heavy, adds torch); OpenAI API (not local-first). Multilingual CLIP flagged for a later Urdu/Roman-Urdu tuning pass.
- **Status**: Locked for M3 (first slice). Speed/multilingual quality tuning open.

### D-013 — Match meta persists as `clip.beatId`; one undoable auto-match

- **Date**: 2026-09-12
- **WHAT**: Auto-match result lands on the timeline as real clips with `beatId` (optional) + reused `confidence`; both persist through the existing project file (version stays 1, D-011 pattern). Applying the full match inside `zundo` `pause()/resume()` makes auto-place **one undo step**. Re-running only replaces clips created by the *last* match (`lastMatchClipIds`); user-placed or manually-edited clips are never silently overwritten.
- **WHY**: AI edits must stay editable and reversible (product rule), and re-runs must not clobber manual work.
- **HOW**: `editor/types.ts` `ClipInput.beatId`; `ops.ts` `addClips`/`replaceClips`; `editorStore.applyMatch(inputs, removeIds)` inside one history step; transient UI state (status/results) lives in non-temporal `matchingStore`.
- **Alternatives considered**: separate overlay track (drift/duplication), non-undoable bulk insert (rejected — violates editability rule).
- **Status**: Locked for M3 (first slice).

### D-014 — Timing overrides survive re-matches (transient derivation, no new persistence)

- **Date**: 2026-09-12
- **WHAT**: Re-running image auto-match preserves the user's timing edits on previously matched clips. An "override" is any last-match clip whose `start`/`duration` differs from its recorded beat timing beyond `TIMING_EPSILON` (0.01s); such clips keep `start`/`duration` on the next run (the image may still change). Overrides are derived transiently from the previous match response (stored in `matchingStore.results`), never written to the project file, and the whole re-match including preserved timings stays one undo step. Pacing refinements (`MIN_AUTO_DURATION` 0.5s floor, `TAIL_HOLD` 0.3s settle) apply only to the final beat and only within narration-audio-duration airtime.
- **WHY**: "Do not silently overwrite user edits" (product rule) was violated by the original M3 slice — a re-run reset any trim/move. Overrides as *derivation* keeps the project schema and version untouched and makes the rule testable as pure math.
- **HOW**: `frontend/src/editor/timing.ts` (`hasTimingOverride`, `pacedEnd` — explicit `isFinal` + `horizon`); `matchingStore.match(assetIds, beats, { horizon })` captures overrides from `results` + `lastMatchClipIds` before `applyMatch`; success status gained `kept`; `MatchPanel` shows the kept count and passes the narration-audio duration as horizon.
- **Alternatives considered**: a persisted `timingLocked` flag on clips (extra schema/UI — rejected for this slice); auto-locking all matched clips after any edit (fragile vs single-trim). Beat ids remain positional — a transcript edit can map an override onto a different beat position (open issue reserved for stable-id work).
- **Status**: Locked for M3 remainder.

### D-015 — Multilingual matching via a composed two-session embedder (no new stack)

- **Date**: 2026-09-12
- **WHAT**: Urdu-script beat text now matches images correctly by swapping only the text tower. `MultilingualClipEmbedder` composes two ONNX sessions: images through the existing `ClipEmbedder` (OpenAI CLIP ViT-B/32, fp32 — the same image room as before) and text through the sentence-transformers **multilingual** CLIP text tower (DistilBERT wordpiece, vocab 119547) while it is present as a user-downloaded `models/clip-multilingual/{onnx/model.onnx, tokenizer.json}`. Auto-selected at startup when `model.onnx` exists (flat or `onnx/`); otherwise English-only behaviour is unchanged. Text is WordPiece-tokenized (77-wide, PAD + mask), the graph's `sentence_embedding` output is picked by exact name and L2-normalized; images keep the fused-graph full-feed pattern.
- **WHY**: English-only CLIP misreads non-English beats; the requirement is mixed-language narration support (product spec). The ST multilingual export mirrors CLIP's image side exactly, so image embeddings stay untouched — no re-embedding, no API change, ONNX/CPU-only.
- **HOW**: `clip.py` (`tokenize_multilingual`, `_pick_by_names`, `MultilingualClipEmbedder`), `config.clip_multilingual_dir`, `main.py` start-up auto-select. Unit tests use fakes (no model files); real-model smoke: Urdu "گھنا سبز جنگل کی تصویر" → forest image 0.284 > sunset 0.222, EN 0.275 > 0.201, Roman-Urdu 0.241 > 0.228 (weak margin), noise ties — and live `POST /api/match` returns the Urdu beat → forest.png.
- **Alternatives considered**: `M-CLIP/XLM-Roberta-Large-Vit-B-32` for Roman-Urdu (PyTorch — adds torch, out of scope); `canavar/clip-ViT-B-32-multilingual-v1-ONNX` (ST-layout export, no preproc file, larger); `Marqo` ONNX repo (empty). Roman-Urdu weakness is inherent to scripted-tokenizer models — documented open issue, not a regression.
- **Status**: Locked for M3 final pass.

---

## Index of decisions

| ID | Decision | Status |
| --- | --- | --- |
| D-001 | Web-first editor (Vite + React) | Locked |
| D-002 | Zustand + Zundo undo/redo | Locked |
| D-003 | Project-local FFmpeg | Locked |
| D-004 | FFmpeg provider abstraction | Locked |
| D-005 | Curated skills, vendor clones gitignored | Locked |
| D-006 | Commit graphify-out; code-only pass | Locked |
| D-007 | Session log + decisions log | Locked |
| D-008 | Media sidecar HTTP API (FastAPI) | Locked |
| D-009 | Versioned project file format (lava-studio JSON) | Locked |
| D-010 | Local faster-whisper ASR in the sidecar | Locked |
| D-011 | Transcripts persist in project file (version stays 1) | Locked |
| D-012 | CLIP ViT-B/32 ONNX fp32 for image matching (quantized broken) | Locked |
| D-013 | Match meta persists via `clip.beatId`; one undoable auto-match | Locked |
| D-014 | Timing overrides survive re-matches (transient derivation, kept count) | Locked |
| D-015 | Multilingual matching via composed two-session embedder (no new stack) | Locked |
| D-016 | Transitions as top-level model (cut = absence; suggestions default-clean) | Locked |
| D-017 | Renderer fold for transitions (xfade offsets = Σdur−ΣD; wipe/zoom → 422) | Locked |
| D-018 | Transitions editable in editor UI; suggested auto-only, edits manual, invalids resolved on request | Locked |
### D-016 — Transitions live as an optional top-level `transitions` list; cut = absence; suggestions default-clean

- **Date**: 2026-09-12
- **WHAT**: A transition is an object with kind (`between` two clips or `edge` fade), type (`match`/`dissolve`/`fade`/`wipe`/`zoom` for between; `fade` only for edges), clamped duration (0.1–2s), `source` (`auto`/`manual`), `reason` and a human-readable `rationale`. They persist on `TimelineModel.transitions` (top-level optional key, project **version stays 1** — D-011/D-013 pattern). A clean cut is the *absence* of a transition object, never materialised. `evaluateTransitions` is a deterministic pure function: same-asset continuity → match cut; matched-beat gap ≥ 0.5s → dissolve; everything else → no suggestion (cut, "avoid transition spam"); wipe/zoom are template-only and never auto-suggested. `overrideTransition`/`removeTransition` are pure; manual overrides flip to `source: 'manual'` and are never re-suggested over. `validateTransitions` flags missing/cross-track/non-contiguous clips, over-long durations and duplicates.
- **WHY**: PRODUCT_SPEC §Transitions — "default behavior must favor clean cuts", "transition decisions must be explainable, editable and user-overridable". Keeping cut as absence keeps the model honest (no spam objects) and projects lean; the derived rationale string makes every automatic decision explainable in the UI (next module).
- **HOW**: `frontend/src/editor/transitions.ts` + `transitions.test.ts` (model, clamps, `evaluateTransitions`, `validateTransitions`, override/remove, `isTransition` guard); `types.ts` gains `transitions?`; `project.ts` parses/re-emits the optional key; 33 new tests (frontend 85 → 118).
- **Alternatives considered**: per-clip transition fields (split semantics, anchor ambiguity); materialising "cut" objects (spam in the model, validation noise); suggestion confidence numbers (rationale strings beat scores for explainability in this module). Render direction/offsets belong to `transitions-render`, not here.
- **Status**: Locked for M4 (module `transitions-core`). Render + UI + image-motion are follow-on modules.

### D-017 — Transitions render through an FFmpeg xfade fold; offsets = Σdur − ΣD; wipe/zoom → 422

- **Date**: 2026-09-12
- **WHAT**: `POST /api/render` accepts an optional `transitions` JSON form field (between/edge specs by clip *index*). Rendering folds the ordered clip list: per-stream prep stays identical, then each adjacent pair is either a nested `concat` (cut or `match`) or an `xfade` (`dissolve`→`fade`, between `fade`→`fadeblack`) at `offset = Σdur(previous) − ΣD(previous transitions)`; edge transitions wrap the first/last stream with a `fade=t=in|out` filter (`st` = 0 or clipDur−D). Result duration = Σdur − ΣD (edges cost nothing). `wipe`/`zoom` are template-only → `TRANSITION_UNSUPPORTED`; semantic errors → `TRANSITION_INVALID`; malformed body → `INVALID_BODY`. Parity path: no renderable transitions produces byte-identical graph + behaviour to the pre-transition renderer.
- **WHY**: PRODUCT_SPEC — clean cuts stay cheap, "restrained transitions" are still actual render effects, and the model/UI (modules 1/3) must not leak encoder math. Keeping `match` encodable as cut means continuity cuts add zero render cost.
- **HOW**: `media.py` `BetweenSpec`/`EdgeSpec`, `xfade_name`, pure `build_transition_graph` (validates + folds + computes total duration), `render(..., transitions=())`; `main.py` parses the field. 22 new backend tests (63 → 85): pure graph/offsets/parity, real-ffmpeg dissolve render (2×2s − 0.5s → 3.5s), edge fades, HTTP codes.
- **Alternatives considered**: per-pair ffmpeg commands instead of a fold (chain explosion); backend-side suggestion of transitions (frontend only sends validated specs); mixed concat/xfade nesting rejected → implemented with labelled `concat=n=2` intermediates (verified with a real mixed graph render).
- **Status**: Locked for M4 (module `transitions-render`). `transitions-ui` sends the specs; `image-motion` extends the same per-stream prep.

### D-018 — Transitions are editor-editable: suggestions replace auto-only, manual edits win, invalids are resolved on request

- **Date**: 2026-09-12
- **WHAT**: `editorStore` now carries `transitions` + `selectedTransitionId` (transient, like `selectedClipId`). Actions: `suggestTransitions()` (runs `evaluateTransitions` and REPLACES only `auto` entries — any `manual` entry survives), `overrideTransition` (flips `source`→`manual`, clamps duration 0.1–2s; edge fades get duration edits too), `removeTransition`, `resolveInvalidTransitions` (removes exactly the entries `validateTransitions` flags). UI: `TransitionsPanel` (rationale text, type `<select>` + duration `<input>`, Remove, invalid banner with explicit resolve — never silent auto-deletion), `TransitionOverlay` chips centred on cut boundaries and track edge-fade positions, width ∝ duration clamped to 36–64px, click-to-select. No manual "add" button — creation stays suggestion-only.
- **WHY**: PRODUCT_SPEC — "every automatic transition must be editable", "do not silently overwrite user edits", and "optimize for clarity / clean cuts are the default". Keeping creation suggestion-only preserves the no-spam bias; manual energy goes into changing/removing, and re-suggestion cannot clobber that.
- **HOW**: All model ops reused from `transitions-core`; store is the single place that merges auto/manual per pair (`A→B`), so any future auto-suggestion source cannot overwrite a manual override. 122 frontend tests (104 → 122): 8 store (12 incl. component-flight) + 13 panel/overlay component tests, incl. re-suggest-preserves-manual and invalid-surfaced-not-deleted.
- **Alternatives considered**: separate `transitionsStore` (rejected — transitions are model data like `clips`, need temporal undo + project round-trip); component-level pruning of orphans (rejected — that is silent deletion); manual-add button (rejected this milestone — spam risk, template-only types still 422).
- **Status**: Locked for M4 (module `transitions-ui`). `image-motion` builds on the same store/overlay pattern.
