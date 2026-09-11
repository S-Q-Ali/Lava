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