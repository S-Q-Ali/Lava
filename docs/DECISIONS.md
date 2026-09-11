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