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
| D-019 | Still-image motion via zoompan prep; absent = byte-identical parity | Locked |
| D-020 | Captions as optional top-level `captions` list; transcript-generated, override-first edits, libass burn-in | Locked |
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

### D-019 — Still-image motion is a per-clip `motion` pair via zoompan prep; absent = byte-identical static prep

- **Date**: 2026-09-12
- **WHAT**: `Clip.motion?` (`{ type, strength }` with `zoom-in|zoom-out|pan-left|pan-right|pan-up|pan-down`, `strength ∈ [0,1]`) persists on the clip (clips already round-trip as raw records — project **version stays 1**). Renderer: `_motion_filters` inserts `scale=iw*3:ih*3:flags=bicubic, zoompan=d=1:s=WxH:fps=…:z=…:x=…:y=…` between pad and setsar via the shared `_prep_chain` used by both `_filter_complex` and `build_transition_graph`, so it folds with xfade transitions. `F = 1 + 0.15·strength`; zooompan animates `z`/`x`/`y` from `on` over the clip; source is upscaled ×3 so zoom-out can never show frame edges. `MOTION_INVALID` (422) for unknown type, strength out of range, or motion on a non-image clip. UI: inspector `MotionPanel` (type select + strength slider, hidden for non-image assets, `none` clears) + `.clip-motion` marker on blocks. Motion is user-set only — auto-match never invents it.
- **WHY**: PRODUCT_SPEC — matched stills benefit from restrained drift; "explainable + editable + continuity" rules. Zoompan (not `crop`) is the canonical filter: ffmpeg evaluates `crop` w/h/x/y once at init, so `t`-driven crop animation is rejected at graph config; zoompan evaluates z/x/y per output frame. Parity: when `motion` is absent `_prep_chain` returns today's string exactly, so the no-motion path is byte-identical (parity tests prove it).
- **HOW**: `media.py` adds `MotionSpec`, `_validate_motion`, `_motion_filters`, `_prep_chain`; `main.py`/`ClipMetadata` parse optional motion and reject non-image targets; `types.ts` adds `MotionSpec`/`MotionType`, store adds `setClipMotion`, `MotionPanel` + ClipBlock marker. 21 backend tests (90 → 111: pure preset strings, strength 0 → static, parity, real-ffmpeg zoom smoke, motion+dissolve 3.5s, HTTP 201/422×3) and 8 frontend tests (125 → 133: store set/clear/round-trip, panel select/slider/none/video-clip-hidden, block marker).
- **Alternatives considered**: `crop`-based animated window (dropped — init-time eval); animating `scale` (dropped — scale w/h are init-time too); separate motion layer/track (overkill for one axis); per-clip keyframes (deferred — presets+strength cover current scope).
- **Status**: Locked for M4 (module `image-motion`, final). ROADMAP M4 complete except the measurable-only retention bullet (dimensions to be defined in M5+ planning).

### D-020 — Captions are typed items on a top-level `captions` list; generation is override-first; burn-in is libass

- **Date**: 2026-09-13
- **WHAT**: `CaptionItem` (`{ id: 'cap-*', trackId: 'track-captions', start, duration, text, styleId, words?, source: 'auto'|'manual' }`) persists on `TimelineModel.captions` (top-level optional key, project **version stays 1** — D-011/D-013/D-016 pattern). `segmentCaptions(transcript)` generates one caption per segment split on pauses ≥ 0.4s (same rule as beat segmentation so captions align with matched image beats) and copies word timings onto items. Edits are pure ops: `updateCaptionText` (manual + drops stale word timings), `updateCaptionTiming` (clamped, manual), `setCaptionStyle` (manual), `removeCaption`, `validateCaptions` (duplicate id / bad duration / negative start / overlap with epsilon drift tolerance). Store `generateCaptions(assetId)` replaces only `auto` items — **manual captions always survive re-generation** (D-018 rule). Styles: original static preset catalog (`captionStyles.ts`, 15 families incl. urdu RTL + emoji-optional; safe font stacks, no trending claims — M6 adds user fonts + licenses). Render: `/api/render` optional `captions` field → pure `captions.py` builds a libass `.ass` document (PlayRes-relative sizes, `#RRGGBB`→`&HAABBGGRR`, bottom/middle/top alignment, `{\k}` karaoke centiseconds from word timings, `{\rtl}` for RTL, HTML escaping, uppercase) written per-job and overlaid via `ass=` filter appended to the final stream; empty/absent = byte-identical parity graph; malformed → `CAPTION_INVALID` (422). UI: inspector `CaptionPanel` (analyze-first empty state, Generate buttons per analyzed voice asset, per-caption text/duration/style/remove + source badge), timeline caption blocks on the captions lane (click seeks, dashed = manual), Render button sends captions.
- **WHY**: PRODUCT_SPEC §Captions demands the widest preset surface with strict editability; word timings ride on items from day one so karaoke/word-highlight need no schema change later. libass handles bidi/complex-script shaping (Urdu Nastaliq) that hand-rolled drawtext cannot; M5 ships static styled lines — animated kinetic/manga/meme treatments stay deferred to M6 templates by design.
- **HOW**: `frontend/src/editor/captions.ts` (17 tests) + `captionStyles.ts` (7) + store slice (8) + `CaptionPanel` component (6) + `types.ts`/`project.ts` round-trip (3); backend `captions.py` (20 tests) + `media.py` ass overlay + `main.py` wire (6 tests incl. real-ffmpeg pixel-diff smoke: burned caption visibly changes the bottom strip). Backend 111 → 140, frontend 133 → 174. Fonts: first family of the safe stack is sent; missing fonts fall back via libass (documented limitation until M6 font bundling).
- **Alternatives considered**: captions as payloads on media `Clip`s (rejected — different edit axes); SRT burn-in (no styling/karaoke); drawtext per line (no shaping, filter-graph explosion); live preview overlay (M8 polish per capability map).
- **Status**: Locked for M5 (modules caption-core/styles/render/ui, all four shipped). Animated template treatments, user font import + license metadata, live preview overlay: M6/M8.

### D-021 — Fonts are backend-stored assets keyed by id; family names travel in the project; libass burns them in via `fontsdir`

- **Date**: 2026-09-13
- **WHAT**: Imported fonts live in the sidecar filesystem (`Config.fonts_dir`
  → `fonts/`) with a JSON registry (`fonts/licenses.json`), **not** in the
  downloadable project JSON — rendering (and therefore libass) runs on the
  backend, while projects are browser download/upload envelopes (D-009). Stored
  as `font-<hex>.<ext>`; original filename + extracted family + license metadata
  are registry entries. Wire: `POST /api/fonts` (multipart `file` + optional
  `license` JSON; `#RRGGBB`-style validation) → 201 metadata, `GET /api/fonts`,
  `GET /api/fonts/{id}/file` (FileResponse), `DELETE /api/fonts/{id}` → 204.
  Errors: `FONT_INVALID` (422) for bad ext / magic / no signature / bad license
  semantics, `INVALID_BODY` (422) for unparsable license JSON, 404 for unknown
  ids. Binary validation + family extraction are pure (`fonts.py`) with a
  **hand-rolled SFNT parser** — no fontTools dependency: signature set
  (`\x00\x01\x00\x00` / `OTTO` / `true` / `ttcf`), table directory, `name` table
  record scan preferring nameID 16 → 1 → 4 and Windows/Unicode entries, UTF-16BE
  decode, best-effort fallback to filename stem. License shape frozen from the
  approved spec: `{ type: open|commercial|personal|unknown, source?, embeddingAllowed }`
  with type defaulting to `unknown`. Renderer: `media.py` gained
  `_ass_filter_string` — when captions exist the `ass=` filter appends
  `:fontsdir='…/fonts'` only when that dir exists; **no-captions graph stays
  byte-identical (parity)**. Frontend: `editor/fonts.ts` (parse + `@font-face`
  registration keyed by id+base), `services/fonts.ts` (list/upload/delete +
  preview URL), `store/fontStore.ts` (load/import/remove), `components/FontPanel.tsx`
  mounted in the Inspector below Captions: import (file picker, license select/
  source/embedding), per-font license badge + preview link + remove, load-error
  surface. Family-name reference from captions styles (`CaptionStyle.fontFamily`)
  now resolves to an uploaded family via libass `fontsdir`.
- **WHY**: PRODUCT_SPEC demands user font import with appropriate licensing;
  captions burn-in needs actual font files at libass call time, and the browser
  never holds them (D-009 download/upload means a font shipped in the project
  envelope could never reach the backend reliably). Backend-id-keyed storage
  keeps fonts out of git (registry + binary-clean `fonts/`), keeps project
  version at 1, and keeps "Trending"-style claims out (no hard-coded availability
  list; upload is explicit). A dependency-free name reader honors the project's
  local-first/lightweight posture over pulling fontTools.
- **HOW**: `backend/src/lava_backend/fonts.py` (pure; 17 unit tests) +
  `config.py` `fonts_dir`/`presets_dir`; `main.py` font routes (5 API tests) +
  upload/registry lifecycle; `media.py` `_ass_filter_string` + real-ffmpeg render
  smoke with a real uploaded system font (`Arial.ttf`) asserting duration and no
  error (fontsdir path covered); frontend `editor/fonts.ts` + `services/fonts.ts`
  (10 tests) + `store/fontStore.ts` (4 tests) + `FontPanel` (5 component tests,
  repo `createRoot`+`act` pattern — @testing-library intentionally absent).
  Backend 140 → 165, frontend 174 → 193. Commits: `c7ceb58` (spec+plan+todo) ·
  `60b0290` (slice 1, pure layer) · `b794e29` (slice 2, API+renderer) ·
  `18364f8` (slice 3, frontend model/client/store) · `243d7ff` (slice 4,
  FontPanel).
- **Alternatives considered**: bundled vendor fonts (rejected — licensing);
  fontTools dependency (rejected — dignity of a hand-rolled name reader here);
  browser-side storage with `blob:` project URLs (rejected — breaks backend
  burn-in); fonts embedded in project JSON (rejected — D-009 envelope can't
  reach libass; also bloats exports).
- **Status**: Locked for M6 module 1 `font-system` (shipped). Captions still
  reference families by string with libass system fallback when not imported;
  preset-registry, preset-import, template-editor and animated-captions are the
  remaining M6 modules.

### D-022 — Presets extend `CaptionStyle` with a category; registry is a JSON file served read-only by the sidecar until import lands

- **Date**: 2026-09-13
- **WHAT**: `Preset` = the M5 `CaptionStyle` model plus `category`
  (13 constants: Trending, New, Shorts, Reels, YouTube, Anime, Manhwa,
  Storytelling, Cinematic, Motivation, Meme, Documentary, Custom),
  `presetVersion?`, `tags[]?`, `licenseRef?` (a font-system id). The 15
  hardcoded M5 presets become `BUILTIN_PRESETS` with an explicit category
  mapping (spec table: normal/urdu/roman-urdu/english/mixed/punctuation →
  Custom, word-highlight/hook → YouTube, karaoke/emoji → Shorts,
  important-word-pop → Reels, manga → Anime, cinematic/mystery → Cinematic,
  meme → Meme, storytelling → Storytelling). Backend `preset_registry.py`
  (pure, no deps): `validate_preset`, `load_registry`/`save_registry` on
  `presets/registry.json` (seeded from built-ins, corrupt/missing → built-ins),
  `merge_preset_layers` for later custom overlays. API is read-only for module 2:
  `GET /api/presets` returns the registry. Frontend: `editor/presets.ts`
  (`Preset`, `parsePreset`, `BUILTIN_CATEGORIES`, `captionStyleFromPreset`),
  `services/presets.ts` (`listPresets`), `store/presetStore.ts` (load,
  `byCategory`, `getPreset`, `applyPreset(id, captionIds?)`), and a bulk
  `editorStore.applyPresetStyle(styleId, captionIds?)` that writes one undo
  step and marks captions `manual` (D-018 override-first). UI `PresetPanel` in
  the Inspector: 13 category pills + "All", preset cards with category badge,
  font-binding/stack indicator, RTL flag, Apply button (current project
  captions). Trending is **updateable by registry JSON edit** — no live fetch,
  never hard-coded claims.
- **WHY**: PRODUCT_SPEC §Templates/Fonts demands a 13-category browsable
  library that users can apply in one click; keeping the model a strict
  extension of `CaptionStyle` means captions.ts / CaptionPanel / the libass
  renderer see zero schema change. File-backed registry (vs only hardcoded
  code) is what makes "updateable Trending" and (module 3) user import real
  without rebuilds.
- **HOW**: `backend/src/lava_backend/preset_registry.py` + `tests/
  test_preset_registry.py` (13 units + 1 API test); `main.py` route; frontend
  `editor/presets.ts`/`services/presets.ts` (+8 tests), `store/presetStore.ts`
  (+5 tests), `editorStore.applyPresetStyle`; `components/PresetPanel.tsx`
  (+4 component tests, createRoot+act pattern). Backend 165 → 178, frontend
  193 → 213. Commits: `42e528a` (spec+plan+todo) · `434872e` (slices 1-2,
  pure+API) · `6fa35ad` (slice 3, model+store) · `f25fa47` (slice 4, panel).
- **Alternatives considered**: presets as a separate non-CaptionStyle schema
  (rejected — dual models for no gain); hardcoding categories only on the
  frontend (rejected — backend/sidecar parity lost, imports would ship
  mismatched data); MySQL/DB (overkill; JSON registry is git-clean and
  project-local per the local-first rule).
- **Status**: Locked for M6 module 2 `preset-registry` (shipped). User preset
  import/export (validation + Custom category writes) and the template editor
  remain modules 3–4.

### D-023 — Preset import/export: strict Custom-category gate with a font `licenseRef` cross-check

- **Date**: 2026-09-13
- **WHAT**: Module 3 turns the module-2 registry writable through import/export
  while keeping built-ins immutable. Import accepts a `lava-preset` envelope
  (`{kind, version: 1, preset}`) or a bare preset dict; ids are forced to the
  `custom-` prefix and `category` to `Custom` (no built-in shadowing, no silent
  overwrite on duplicate — `PRESET_INVALID` 422 instead). A `licenseRef`, when
  present, must name an id in the fonts registry at import time. API:
  `POST /api/presets` (201), `DELETE /api/presets/{id}` (204 custom / 403
  `BUILTIN_PRESET` / 404), `GET /api/presets/{id}/file` (envelope JSON).
  Frontend: `services/presets.ts` import/delete/export + `downloadPresetFile`
  (projectIO.rs pattern), `presetStore.importPreset`/`removePreset`, and
  PresetPanel Import JSON button, per-custom-card Export + Remove.
- **WHY**: PRODUCT_SPEC mandates presets that users can save, share and reload
  without rebuilds, and forbids silently overwriting user edits. D-022 deferred
  `licenseRef` enforcement to import; making it the load-time gate gives
  actionable `PRESET_INVALID` errors instead of silent render fallback.
- **HOW**: `backend/src/lava_backend/preset_import.py` +
  `tests/test_preset_import.py` (12 unit + 13 API), `main.py` routes; frontend
  `services/presets.ts` (+3 tests), `store/presetStore.ts` (+3), PresetPanel
  (+4 component). Backend 178 → 203, frontend 213 → 225. Commits: `2895e5d`
  (spec+plan+todo) · `ab46545` (backend slice) · `c9eff3b` (services+store) ·
  `88efd5a` (panel).
- **Alternatives considered**: separate `custom.json` layer vs editing the
  single registry file (single file — survives the built-in fallback path and
  the module-2 GET already merges); soft licenseRef warning vs strict reject
  (strict — user picked "Approve" over "LicenseRef soft" in the spec gate);
  envelope-only import (plus bare preset accepted — round-trip + hand-authored
  files both work).
- **Status**: Locked for M6 module 3 `preset-import` (shipped). Next: template
  editor (`template-editor`), then `animated-captions`.

### D-024 — Template editor: immutable drafts + slug-id saves; preset-applied captions resolve their real style at render

- **Date**: 2026-09-13
- **WHAT**: Module 4 = a visual preset editor plus a render-path fix. Pure
  editor layer `frontend/src/editor/templateEditor.ts`: `PresetDraft`,
  `draftFromPreset`, immutable `updateDraft` (font size clamped 8–240, outline
  ≥ 0), `customIdForLabel` (backend-compatible `custom-<slug>` mirroring
  backend `suggested_custom_id`), `finalizeDraft` (→ full Custom `Preset`
  payload) and `resolveCaptionStyle(styleId, presets)` (preset first, M5
  registry fallback). API gains `PUT /api/presets/{id}` — custom overwrite only
  (built-in 403 `BUILTIN_PRESET`, missing 404, payload id must match path id
  else 422, full `import_preset_payload` validation incl. licenseRef gate).
  Frontend: `updatePreset` service, `presetStore.savePreset` (POST when
  unknown / PUT when present, local upsert, one error surface), and
  `TemplateEditorPanel` in the Inspector: base preset select (default
  `normal`), label/description, font family + imported-font picker, size/colors/
  outline/alignment, the eight M5 flag toggles, a live CSS preview, and
  Save-as-new (label-gated) + Overwrite (custom bases only). The render gap:
  `captionToWire`/`captionsRenderPayload` now resolve preset-applied caption
  `styleId`s through the preset store so a preset's actual style reachs libass
  (previously fell back to `normal`), and the CaptionPanel style select lists
  custom presets.
- **WHY**: The M6 draft's "template editor" is the authoring surface for
  presets — without a render-path resolution step, an edited preset that is
  applied to captions would still burn in as the default style, silently
  defeating the editor. Per-overwrite discipline (D-018/D-022/D-023) built-ins
  stay immutable; overwrites are path-id-bound so a payload can't rename or
  move a preset.
- **HOW**: `frontend/src/editor/templateEditor.ts(.test)` (14 units),
  `main.py` `PUT` (7 API tests; backend 203 → 211), `services/presets.ts`
  `updatePreset` (2), `store/presetStore.ts` `savePreset` (2), CaptionPanel
  resolution (1), `TemplateEditorPanel` (5 component). Frontend 225 → 244.
  Commits: `f8cfe13` (spec+plan+todo) · `804b0a4` (pure model + PUT) ·
  `4312290` (services/store + render wire) · `b304300` (panel).
- **Alternatives considered**: full visual-on-canvas editor (rejected — the M8
  preview overlay owns canvas preview; this panel uses a faithful inline CSS
  preview now); resolve preset styles by merging into `CAPTION_STYLES` at load
  (rejected — mutating the M5 lookup table in place breaks its purity and the
  M5 parity tests); `PUT` without id-bound enforcement (rejected — would allow
  cross-id moves).
- **Status**: Locked for M6 module 4 `template-editor` (shipped). Remaining M6:
  `animated-captions` (module 5) and the preset/render license-metadata row.

### D-025 — Animated captions: named treatments as text-level ASS tag recipes; pixel-space frame effects deferred to M8

- **Date**: 2026-09-13
- **WHAT**: Module 5 adds five named caption animation treatments — `kinetic`
  (per-word alpha+scale reveal using the voice pipeline's `words[]` offsets,
  even-split fallback), `manga` (impact punch: 200%→100% scale + alpha fade
  over ~180 ms), `cinematic` (`{\fad(400,400)}` + 96%→100% scale over the line),
  `meme` (three non-overlapping scale ramps ~180 ms for a punch/wobble) and
  `storytelling` (`{\fad(600,600)}` + 98%→100%) — all emitted as deterministic
  libass inline tags in the pure backend generator (`captions.py`), plus
  `animation` on the caption-style contract, the `Preset` schema (enum
  validation, import/export round-trip), the `PresetDraft`, and the render
  wire. The four M5 presets named after the families (`manga`, `cinematic`,
  `meme`, `storytelling`) carry matching treatments; all other presets default
  to `none`. `karaoke` retains precedence over animation; rtl wraps outside.
- **WHY**: PRODUCT_SPEC/AGENTS mandate editable, non-slop treatment support;
  M6 success criteria list five treatments that must render "via libass tags".
  Because the ASS generator is the single render face (byte-parity tests, M5
  parity), treatments live there as pure recipes rather than in the editor;
  per-word timing rides the existing `words[]` structure, so no new timing UI
  is needed (M6 open question 3 default).
- **HOW**: `captions.py` (`ANIMATIONS`, `_kinetic_word_tokens`,
  `_ANIMATION_WRAPPERS`, `_animate_line`; 12 tests), `preset_registry.py`
  (`Preset.animation`, enum validation; 3 new + 1 extended), `captionStyles.ts`
  (`CaptionAnimation`/`ANIMATION_OPTIONS`/annotations; 2 tests), `presets.ts`
  (parse passthrough; 1 test), `CaptionPanel` wire (1 test),
  `templateEditor.ts` + `TemplateEditorPanel` (2 tests). Backend 211 → 227,
  frontend 244 → 250. Commits: `3423d00` (spec+plan+todo) · `56fc907` (ASS
  recipes) · `0e7b717` (Preset schema) · `acce8cb` (frontend model+wire) ·
  `60d7bfd` (draft+panel).
- **Alternatives considered**: true pixel-space manga "speed lines" and
  cinematic letterbox bars via `{\p}` vector drawing (rejected — the text ASS
  generator cannot measure resolved glyph placement, quality would be
  guesswork; recorded as deferred to the M8 preview overlay, which owns
  pixel-space preview); per-caption animation overrides vs style-level
  (style-level — matches preset-as-style architecture, D-022/D-024);
  animation applied in the editor preview (deferred — motion preview is M8).
- **Status**: Locked for M6 module 5 `animated-captions` (shipped). Remaining
  M6: the preset/render license-metadata row; M6 animation gap notes
  (speed lines, letterbox, motion preview) ride into M8.

### D-026 — Render-time license guard: registry-back fonts are refused, not silently served

- **Date**: 2026-09-13
- **WHAT**: Module 6 closes the M6 license-metadata row. A pure resolver
  (`backend/src/lava_backend/licensing.py`) walks the caption specs the render
  endpoint is about to burn in, matches each caption's `fontFamily` against the
  fonts registry by family, and returns either a used-font manifest or blocking
  violations: `FONT_LICENSE_NOT_EMBEDDABLE` (the declared license sets
  `embeddingAllowed` false) and `FONT_MISSING` (registered, but `{id}.{ext}` is
  absent from `fonts_dir`). Violations abort `POST /api/render` with a single
  actionable 422 `FONT_LICENSE`; clean renders return `fonts` =
  `[{family, fontId, license}]` in the response. `RenderResult` carries the
  manifest; the frontend mirrors it (`RenderResult.fonts`,
  `RenderCaptionStyle.animation` parity) and the PresetPanel "imported font"
  badge title now shows the bound family + embedding status resolved from
  `fontStore`.
- **WHY**: Fonts already track `{type, source, embeddingAllowed}` (module 1)
  and presets bind them via `licenseRef` (module 3), but the render path never
  checked them — an embed-forbidden or punctured font would fall back silently
  (the exact anti-pattern PRODUCT_SPEC/AGENTS prohibit). A guard-plus-manifest
  makes exports honest: restricted fonts cannot be burned in, and the API says
  which registry fonts each render used.
- **HOW**: `licensing.py` (12 unit tests), render endpoint guard + manifest
  serialization, `RenderResult.fonts` (`media.py`), frontend type parity +
  PresetPanel badge (3 tests). Backend 227 → 245, frontend 250 → 253.
  Commits: `61a9d68` (spec+plan+todo) · `6964a87` (resolver) · `34a5794`
  (render guard + manifest) · `b347753` (frontend).
- **Alternatives considered**: warning-only on render (rejected — "no silent
  fallback" is a hard rule, and a 201 output with an uncertain font is the same
  danger); matching registry by `licenseRef` font id instead of family (family
  is the only ident that travels on the caption wire today; `licenseRef` is
  bound at import); including every bundled font in the manifest (only the
  fonts actually used by caption styles are rendered).
- **Status**: Locked for M6 module 6 `license-tracking` (shipped — closes the
  final M6 row). Limitation recorded: a font fully removed from the registry
  after a preset bound it is indistinguishable from a system stack and passes
  (predictable from the data model); guard-abort paths take precedence, and
  blurring/deletion of registry entries is a project-operation concern.

### D-027 — M7 manhwa: frozen panel model, boundary-anchored coordinate mapping, git-clean registry

- **Date**: 2026-09-14
- **WHAT**: Module 1 of the M7 extractor. A frozen `Panel` dataclass
  (`{id, sourceId, x, y, w, h, confidence, order, userCorrected}` — PRODUCT_SPEC
  §9 shape) with a single validated constructor (`make_panel`), deterministic
  analysis↔source mapping, zero-padded asset naming (`panel_001.png`), and a
  git-clean `StripRegistry` at `cache/manhwa/<source_id>/registry.json`
  (atomic temp+rename writes; corrupt/missing/unknown-version/dup-id files →
  `ManhwaError`, never a silent rewrite).
- **WHY**: Every later module (detection/order/export/correction/API/UI) shares
  one panel record and one coordinate frame. Rounding rules had to be pinned
  once: analysis coordinates are smaller (≤512 wide) so a naive per-panel
  rounding could widen adjacent panels by ±factor px and leave seams or double
  covered pixels on export.
- **HOW**: `manhwa/panels.py` (pure data — no image bytes), `manhwa/errors.py`,
  38 unit tests. Mapping is **boundary-anchored**: `map_cut_to_source` maps each
  cut line once, and `boxes_from_cuts` derives every panel box from two mapped
  cuts, so adjacent panels tile the strip exactly (verified: last panel reaches
  the bottom edge). `analysis_scale` keeps aspect, floors `ana_h`, identity when
  source ≤ 512 wide. Asset ids (`p1…`) are stable; file names may be renumbered
  at export — `id_for_asset`/`asset_for_id` invert the default, order-based
  mapping only. Backend 245 → 283.
- **Alternatives considered**: per-panel rounded boxes (rejected — seam
  risk); naive `ana_h = round(...)` (rejected — non-deterministic edge cases);
  registry stored under `.gitignore`d user-data path (kept — registry mirrors
  the `fonts/licenses.json` + `presets/registry.json` precedent); silent
  corrupt-registry recovery (rejected — load surfaces `ManhwaError` because a
  silently rebuilt registry is a data-losing overwrite).
- **Status**: Locked for M7 module 1 `panel-model` (shipped). Next:
  module 2 `panel-detection` (OpenCV hybrid signals → analysis-space cuts).

### D-028 — M7 manhwa: hybrid signal fusion with fixed per-kind confidence + margin-ring background estimate

- **Date**: 2026-09-14
- **WHAT**: Module 2 of the M7 extractor. A two-tier CV pipeline over a
  ≤512 px analysis image. Per-row signals: foreground content coverage
  (`|gray − bg| > 12`), uniformity (`1 − std/40`), Canny edge projection.
  Clean path → flat (median > 0.97), empty (< 3% content), interior run
  ≥ 8 px bordered by ≥ 15% content on BOTH immediate 3-row sides → cut at
  **confidence 0.95**. Rescue path → 1..24 px flat-empty runs with the same
  bordered test → cut at **confidence 0.35**. Sliver merge drops the
  lower-confidence cut whenever two adjacent cuts enclose < 24 analysis px.
  Panel confidence = min of the two bounding cuts (edges = 1.0), so panels
  never outrank their worst boundary. Panels map to source via the module-1
  boundary-anchored mapping (`build_panels`); `detect_strip` persists
  original-resolution crops + the git-clean registry idempotently.
- **WHY**: Manhwa criticizes single-threshold detection (one contour
  threshold can't separate clean gutters from borders, bubbles, dense text or
  flat decoration). Two tiers with *fixed* confidence per kind keep cut
  semantics traceable: clean data is trustworthy, rescue data is a hypothesis
  the UI must let the user re-verify. Filters (bubbles, dense text,
  decorative full-bleed art and flat dead zones) must never earn a cut —
  they fail the bordered-by-content side test because their neighbors within
  NEIGHBOR_BAND rows are empty or sparse, unlike a real gutter which sits
  between two painted panels.
- **HOW**: `manhwa/detect.py` + `tests/manhwa_strips.py` (12 deterministic
  fixtures: margins + hatch texture so the background stays the image's real
  background). Background estimate anchored on the **1px outer ring** (comic
  margins) with a global-mode fallback for full-bleed art — a global gray
  mode picks the biggest flat panel fill, not the background. Flatness uses a
  **median** over the band so one half-blended transition row (analysis
  resampling) can't veto a real gutter. 29 detect tests; backend 283 → 312.
- **Alternatives considered**: per-signal weighted confidence (rejected —
  opaque; two fixed tiers are auditable); discontinuity/edge trough scoring
  for rescue (rejected mid-slice — measured instability on synthetic
  batteries; replaced by bordered flat-seam runs); global gray-mode bg
  (rejected — panneel fills outvote gutters); strict all-rows-flat mask
  (rejected — single resampled row breaks real gutters).
- **Status**: Locked for M7 module 2 `panel-detection` (shipped, backend
  312). Next: module 3 `panel-order`.

### D-029 — M7 manhwa: ordering/confidence/layout-guard live in one pure normalization module

- **Date**: 2026-09-14
- **WHAT**: Module 3 of the M7 extractor. `manhwa/order.py` owns three pure
  operations on `Panel` lists: `order_panels` (reading order by (y, x),
  renumbers `order` 1..n, leaves boxes/ids/confidence/userCorrected alone),
  `attribute_confidence` (per-panel confidence = min of the two bounding
  boundary confidences, source edges = certainty), and `guard_layout`
  (`ManhwaError` on empty lists, duplicate ids, positive-area box overlaps or
  interleaved regions; returns the normalized list). `detect.build_panels`
  delegates its ordering + confidence step to this module so correction
  (module 5) and the API (module 6) normalize identically after every edit.
- **WHY**: Ordering and confidence are contracts shared by every later M7
  consumer. Duplicating the "min of bounding cuts" logic in build_panels and
  again in correction would let the two drift (e.g. a split that forgets to
  recompute a panel's confidence). Fixing the semantics once — and making
  detection just another consumer — keeps the panel list auditable end to end
  (D-027: frozen data, loud failures).
- **HOW**: Pure functions, dataclasses.replace for the frozen `Panel`, unit
  tests only (no images). `guard_layout` deliberately does NOT enforce full
  coverage (gaps are legal after Delete in correction) and treats touching
  edges as adjacency, not overlap. Backend 312 → 330 (17 order tests + 1
  wiring test).
- **Alternatives considered**: leaving ordering in `build_panels` (rejected —
  correction would re-implement and drift); enforcing gap coverage in the
  guard (rejected — legal Delete gaps); list mismatch surfaced as ValueError
  (used for the confidence-array contract, kept deliberately distinct from the
  ManhwaError layout violations).
- **Status**: Locked for M7 module 3 `panel-order` (shipped, backend 330).
  Next: module 4 `panel-export`.

## D-030 — Export is a pure materialization layer; naming asset-stable

- **WHAT**: M7 module 4 `panel-export` owns full-resolution crop + encode +
  manifest, and nothing else. `crop_panel` slices the original strip's box
  (never resampled), `encode_panel` produces PNG (lossless default) or JPEG
  (quality 1..100; non-RGB images flattened to RGB for JPEG only), and
  `materialize_export` normalizes the panel list through `guard_layout`
  (module 3) before cropping so files + manifest are always a clean 1..n
  reading order — regardless of how the list arrived (correction edits,
  re-detection, salvage after a crash).
- **WHY**: Detection eager-crops per-panel PNGs to a cache, but exports must
  survive cache eviction, format switches (JPG), corrected boxes, and be the
  single honest record of "what the user asked for". Keeping export a pure,
  deterministic function of (source image, panel list, format) means module 6
  (`manhwa-api`) just streams the bundle and can never silently ship stale
  crops.
- **HOW**: File naming is asset-stable: the module-1 `asset_name(id, total)`
  zero-padded `panel_###.png` scheme is kept and the suffix swapped per format
  (`_export_name`), so `id_for_asset` inversions still hold for `.png`.
  `ExportBundle{fmt, manifest, files}` pairs each file with its manifest row
  (`file`, `id`, `order`, `x/y/w/h`, `width/height`, `confidence`).
  Backend 330 → 344 (14 export tests; real-fixture test proves crops tile the
  last panel to source bottom edge at original resolution).
- **Alternatives considered**: reusing the eager detection cache for exports
  (rejected — stale after correction, PNG-only, cache can be cleared); zipping
  inside this module (deferred to module 6 which owns the HTTP boundary);
  resizing panels to a fixed grid (rejected — export must preserve original
  resolution per product rules).
- **Status**: Locked for M7 module 4 `panel-export` (shipped, backend 344).
  Next: module 5 `panel-correction`.
