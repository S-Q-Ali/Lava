# Graph Report - Lava  (2026-09-12)

## Corpus Check
- 96 files · ~74,316 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1105 nodes · 1448 edges · 71 communities (60 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `465005ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- project.ts
- localDirs
- compilerOptions
- Worked example: Agent Teams for competing-hypothesis debugging
- compilerOptions
- Code Review and Quality
- Test-Driven Development
- ffmpeg.ts
- fetch-ffmpeg.mjs
- .oxlintrc.json
- tsconfig.json
- graphify.js
- Performance Checklist
- Git Workflow and Versioning
- API and Interface Design
- What You Must Do When Invoked
- AI Video Studio — Master Project Documentation
- Constraint-Driven Development
- Frontend UI Engineering
- Incremental Implementation
- Code Simplification
- Debugging and Error Recovery
- Documentation and ADRs
- AI Video Studio — Product Specification
- AGENTS.md — AI Video Studio
- Planning and Task Breakdown
- Security Checklist
- Accessibility Checklist
- Testing Patterns Reference (JavaScript/TypeScript)
- Spec-Driven Development
- AI Video Studio — Roadmap
- AI Video Studio — Features
- The Standing Checklist
- Observability Checklist
- Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation
- AI Video Studio — Decision Log
- Implementation Plan: M2 Voice analysis (first slice)
- graphify reference: extra exports and benchmark
- AI Video Studio — Test Plan
- AI Video Studio — UI Specification
- graphify reference: query, path, explain
- Lava — AI Video Studio
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- opencode.json
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- frontend/README.md
- extraction-spec.md
- main.py
- test_render.py
- Lava Studio — Backend (media sidecar)
- sidecar.sh
- lava-backend
- Task list
- detect_pauses
- editorStore.ts
- ops.ts
- TranscriptPanel.tsx
- useEditorStore
- importer.ts
- App.tsx
- Spec: Voice Analysis (M2 first slice)
- AI Video Studio — Architecture
- TrackRow.tsx
- voice.ts
- .prettierrc.json

## God Nodes (most connected - your core abstractions)
1. `useEditorStore` - 30 edges
2. `AI Video Studio — Master Project Documentation` - 23 edges
3. `Code Review and Quality` - 19 edges
4. `AGENTS.md — AI Video Studio` - 19 edges
5. `EditorActions` - 18 edges
6. `compilerOptions` - 18 edges
7. `AI Video Studio — Product Specification` - 18 edges
8. `compilerOptions` - 15 edges
9. `Security Checklist` - 15 edges
10. `Git Workflow and Versioning` - 15 edges

## Surprising Connections (you probably didn't know these)
- `serialize_segment()` --uses--> `Segment`  [INFERRED]
  backend/src/lava_backend/transcribe.py → backend/src/lava_backend/transcribers.py
- `serialize()` --uses--> `Transcription`  [INFERRED]
  backend/src/lava_backend/transcribe.py → backend/src/lava_backend/transcribers.py
- `ProjectFile` --references--> `TimelineModel`  [EXTRACTED]
  frontend/src/editor/project.ts → frontend/src/editor/types.ts
- `check_binary()` --uses--> `Config`  [INFERRED]
  backend/src/lava_backend/media.py → backend/src/lava_backend/config.py
- `probe()` --uses--> `Config`  [INFERRED]
  backend/src/lava_backend/media.py → backend/src/lava_backend/config.py

## Import Cycles
- None detected.

## Communities (71 total, 9 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (32): dependencies, react, react-dom, zundo, zustand, devDependencies, oxlint, @types/node (+24 more)

### Community 1 - "project.ts"
Cohesion: 0.17
Nodes (21): isAsset(), isClip(), isRecord(), isTrack(), isTranscript(), parseProjectJson(), parseProjectModel(), parseTranscripts() (+13 more)

### Community 2 - "localDirs"
Cohesion: 0.10
Nodes (20): backend, host, port, ffmpeg, bin, source, localDirs, cache (+12 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 4 - "Worked example: Agent Teams for competing-hypothesis debugging"
Cohesion: 0.06
Nodes (31): 1. Direct invocation (no orchestration), 2. Single-persona slash command, 3. Parallel fan-out with merge, 4. Sequential pipeline as user-driven slash commands, 5. Research isolation (context preservation), A. Router persona ("meta-orchestrator"), Anti-pattern in this scenario, Anti-patterns (+23 more)

### Community 5 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 6 - "Code Review and Quality"
Cohesion: 0.07
Nodes (29): 1. Correctness, 2. Readability & Simplicity, 3. Architecture, 4. Security, 5. Performance, Change Descriptions, Change Sizing, Code Review and Quality (+21 more)

### Community 7 - "Test-Driven Development"
Cohesion: 0.07
Nodes (29): Browser Testing with DevTools, Common Rationalizations, DAMP Over DRY in Tests, Decision Guide, Discover the Stack First, Name Tests Descriptively, One Assertion Per Concept, Overview (+21 more)

### Community 8 - "ffmpeg.ts"
Cohesion: 0.11
Nodes (12): backendBaseUrl(), DEFAULT_BASE_URL, detectProvider(), FFmpegProvider, HttpFFmpegProvider, RenderClipInput, RenderInput, RenderResult (+4 more)

### Community 9 - "fetch-ffmpeg.mjs"
Cohesion: 0.24
Nodes (10): args, binDir, cacheDir, download(), extract(), findBinary(), main(), root (+2 more)

### Community 10 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 13 - "Performance Checklist"
Cohesion: 0.07
Nodes (26): API, Backend Checklist, Cache checklist, Caching Strategies, Common Anti-Patterns, Connection pooling, Core Web Vitals Targets, CSS (+18 more)

### Community 14 - "Git Workflow and Versioning"
Cohesion: 0.07
Nodes (26): 1. Commit Early, Commit Often, 2. Atomic Commits, 3. Descriptive Messages, 4. Keep Concerns Separate, 5. Size Your Changes, Branch Naming, Branching Strategy, Change Summaries (+18 more)

### Community 15 - "API and Interface Design"
Cohesion: 0.08
Nodes (24): 1. Contract First, 2. Consistent Error Semantics, 3. Validate at Boundaries, 4. Prefer Addition Over Modification, 5. Predictable Naming, 6. Honouring an Idempotency Key, API and Interface Design, Common Rationalizations (+16 more)

### Community 16 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 17 - "AI Video Studio — Master Project Documentation"
Cohesion: 0.08
Nodes (23): 10. Captions System, 11. Templates / Styles / Fonts, 12. Editor / Timeline, 13. AI Control Philosophy, 14. UI / UX Direction, 15. Runtime / Hardware Strategy, 16. Suggested Repository Architecture, 17. Testing Strategy (+15 more)

### Community 18 - "Constraint-Driven Development"
Cohesion: 0.08
Nodes (22): Adapting it, Contract, Floor guard: reference implementation, Reference (Node, ~stack-agnostic patterns), Common Rationalizations, Constraint-Driven Development, Escalation Path, Loading Constraints (+14 more)

### Community 19 - "Frontend UI Engineering"
Cohesion: 0.08
Nodes (23): Accessibility (WCAG 2.1 AA), ARIA Labels, Avoid the AI Aesthetic, Color, Common Rationalizations, Component Architecture, Component Patterns, Design System Adherence (+15 more)

### Community 20 - "Incremental Implementation"
Cohesion: 0.09
Nodes (22): Common Rationalizations, Contract-First Slicing, Implementation Rules, Increment Checklist, Incremental Implementation, Overview, Red Flags, Risk-First Slicing (+14 more)

### Community 21 - "Code Simplification"
Cohesion: 0.09
Nodes (21): 1. Preserve Behavior Exactly, 2. Follow Project Conventions, 3. Prefer Clarity Over Cleverness, 4. Maintain Balance, 5. Scope to What Changed, Code Simplification, Common Rationalizations, Language-Specific Guidance (+13 more)

### Community 22 - "Debugging and Error Recovery"
Cohesion: 0.09
Nodes (21): Build Failure Triage, Common Rationalizations, Debugging and Error Recovery, Error-Specific Patterns, Instrumentation Guidelines, Overview, Red Flags, Runtime Error Triage (+13 more)

### Community 23 - "Documentation and ADRs"
Cohesion: 0.09
Nodes (21): ADR Lifecycle, ADR Template, API Documentation, Architecture Decision Records (ADRs), Changelog Maintenance, Common Rationalizations, Document Known Gotchas, Documentation and ADRs (+13 more)

### Community 24 - "AI Video Studio — Product Specification"
Cohesion: 0.10
Nodes (20): 10. Captions System, 11. Templates / Styles / Fonts, 12. Editor / Timeline, 13. AI Control Philosophy, 14. UI / UX Direction, 15. Runtime / Hardware Strategy, 16. Key Product Principle, 1. Mission (+12 more)

### Community 25 - "AGENTS.md — AI Video Studio"
Cohesion: 0.10
Nodes (19): Agent skills (OpenCode), AGENTS.md — AI Video Studio, Captions, Core product, Definition of done, Documentation index, Editor, graphify (+11 more)

### Community 26 - "Planning and Task Breakdown"
Cohesion: 0.11
Nodes (18): Common Rationalizations, Output Files, Overview, Parallelization Opportunities, Plan Document Template, Planning and Task Breakdown, Red Flags, See Also (+10 more)

### Community 27 - "Security Checklist"
Cohesion: 0.11
Nodes (17): AI / LLM Security, Authentication, Authorization, CORS Configuration, Data Protection, Dependency Security, Destructive Path Operations, Error Handling (+9 more)

### Community 28 - "Accessibility Checklist"
Cohesion: 0.12
Nodes (16): Accessibility Checklist, Accessible Lists, ARIA Roles, Buttons vs. Links, Common Anti-Patterns, Common HTML Patterns, Content, Essential Checks (+8 more)

### Community 29 - "Testing Patterns Reference (JavaScript/TypeScript)"
Cohesion: 0.14
Nodes (13): API / Integration Testing, Common Assertions, E2E Testing (Playwright), Mock at Boundaries Only, Mock Functions, Mock Modules, Mocking Patterns, React/Component Testing (+5 more)

### Community 30 - "Spec-Driven Development"
Cohesion: 0.14
Nodes (13): Common Rationalizations, Keeping the Spec Alive, Overview, Phase 0: Scope Check, Phase 1: Specify, Phase 2: Plan, Phase 3: Tasks, Phase 4: Implement (+5 more)

### Community 31 - "AI Video Studio — Roadmap"
Cohesion: 0.15
Nodes (13): AI Video Studio — Roadmap, Milestone 0 — Repository bootstrap, Milestone 10 — Release hardening, Milestone 1 — Media foundation, Milestone 2 — Voice analysis, Milestone 3 — Semantic image matching, Milestone 4 — Transition/animation engine, Milestone 5 — Caption engine (+5 more)

### Community 32 - "AI Video Studio — Features"
Cohesion: 0.18
Nodes (11): 10. Hardware-Aware Operation, 1. Media Foundation, 2. Voice / Audio, 3. Semantic Image Matching, 4. Transitions / Animation, 5. Captions, 6. Templates / Styles / Fonts, 7. Manhwa / Webtoon Extractor (+3 more)

### Community 33 - "The Standing Checklist"
Cohesion: 0.18
Nodes (10): Correctness, Definition of Done, Definition of Done vs. Acceptance Criteria, Documentation, How to Apply, Integration, Quality, Red Flags (+2 more)

### Community 34 - "Observability Checklist"
Cohesion: 0.18
Nodes (10): Alerting, Dashboards, Distributed Tracing, Metrics, Observability Checklist, On-Call Questions (Start Here), Pre-Launch Gate, Structured Logging (+2 more)

### Community 36 - "Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation"
Cohesion: 0.05
Nodes (42): AI Video Studio — Session Log, Decisions, Decisions, Decisions, Decisions, Decisions, HOW, HOW (+34 more)

### Community 37 - "AI Video Studio — Decision Log"
Cohesion: 0.15
Nodes (13): AI Video Studio — Decision Log, D-001 — Web-first editor shell (Vite + React + TypeScript), D-002 — Zustand + Zundo for state and undo/redo, D-003 — Project-local FFmpeg binary, D-004 — FFmpeg provider abstraction, D-005 — Curated vendor skills; reference clones kept local, D-006 — Commit `graphify-out/`; code-only pass for now, D-007 — Written session log + decisions log for continuity (+5 more)

### Community 38 - "Implementation Plan: M2 Voice analysis (first slice)"
Cohesion: 0.14
Nodes (13): Checkpoints, Implementation Plan: M2 Voice analysis (first slice), Open Questions, Overview, Risks and Mitigations, Skills workflow (per AGENTS.md, applied per phase), Slice 1 — pause-segmentation (backend, pure, TDD), Slice 2 — transcribe-api contract (+5 more)

### Community 39 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 40 - "AI Video Studio — Test Plan"
Cohesion: 0.22
Nodes (9): 1. Voice/Image Fixtures, 2. Manhwa Fixtures, 3. Editor / Timeline Tests, 4. Templates / Fonts Tests, 5.1 Voice-analysis verification so far, 5. Persistence / Data Integrity, 6. Performance Sanity (Baseline Hardware), 7. Regression Policy (+1 more)

### Community 41 - "AI Video Studio — UI Specification"
Cohesion: 0.25
Nodes (8): 1. Direction, 2. Avoid, 3. Prefer, 4. Primary Layout, 5. Manhwa Correction View, 6. Voice-over → Timeline View, 7. State Requirements, AI Video Studio — UI Specification

### Community 42 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 43 - "Lava — AI Video Studio"
Cohesion: 0.33
Nodes (6): Baseline target hardware, Current status, Differentiators, Documentation, How to work on this project, Lava — AI Video Studio

### Community 44 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 45 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 46 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 52 - "main.py"
Cohesion: 0.08
Nodes (50): Config, get_config(), _payload(), Resolve Lava Studio project-local configuration and paths., reset_config(), tool_versions(), ToolVersions, ApiError (+42 more)

### Community 53 - "test_render.py"
Cohesion: 0.19
Nodes (11): Lava Studio media sidecar package., make_clip(), test_probe_reports_media_metadata(), make_image(), Path, render_multipart(), test_render_file_clip_count_mismatch_is_400(), test_render_invalid_duration_is_422() (+3 more)

### Community 54 - "Lava Studio — Backend (media sidecar)"
Cohesion: 0.33
Nodes (5): API, Lava Studio — Backend (media sidecar), Layout, Run, Tests

### Community 58 - "Task list"
Cohesion: 0.50
Nodes (3): M1 completion: project save/load + timeline drag/trim UX (closed 2026-09-12), M2 Voice analysis — first slice (active) — SPEC-voice-analysis, tasks/plan.md, Task list

### Community 59 - "detect_pauses"
Cohesion: 0.10
Nodes (15): confidence_from_logprob(), detect_pauses(), Pause, Word, FakeTranscriber, Path, Segment, Transcriber (+7 more)

### Community 60 - "editorStore.ts"
Cohesion: 0.21
Nodes (15): Asset, Clip, DEFAULT_TRACKS, TimelineModel, Track, TrackType, Transcript, TranscriptSegment (+7 more)

### Community 61 - "ops.ts"
Cohesion: 0.22
Nodes (14): InspectorPanel(), TimelinePanel(), addClip(), ClipInput, createClip(), duplicateClip(), moveClip(), newId() (+6 more)

### Community 62 - "TranscriptPanel.tsx"
Cohesion: 0.18
Nodes (13): attachPauses(), buildNodes(), confidenceLabel(), lowConfidence(), Node, TranscriptPanel(), TranscriptPause, TranscriptWord (+5 more)

### Community 63 - "useEditorStore"
Cohesion: 0.23
Nodes (3): ClipBlock(), EditorActions, useEditorStore

### Community 64 - "importer.ts"
Cohesion: 0.22
Nodes (10): kindOf(), MediaPanel(), AssetKind, AssetMeta, assetFiles, importFiles(), kindOf(), readImageMeta() (+2 more)

### Community 65 - "App.tsx"
Cohesion: 0.29
Nodes (8): App(), formatTime(), PreviewPanel(), clipsAtTime(), getAssetFile(), getFFmpegProvider(), saveProjectToFile(), react

### Community 66 - "Spec: Voice Analysis (M2 first slice)"
Cohesion: 0.18
Nodes (11): Boundaries, Capability Map, Code Style, Commands, Objective, Open Questions, Project Structure, Spec: Voice Analysis (M2 first slice) (+3 more)

### Community 67 - "AI Video Studio — Architecture"
Cohesion: 0.20
Nodes (10): 1. Repository Layout, 2. Design Principles, 3. Core Technology, 4. Voice-over → Images Processing Graph, 5. Manhwa / Webtoon Extraction Processing Graph, 6. Caption Processing Graph, 7. System Boundaries, 8. Design Decisions (WHY) (+2 more)

### Community 68 - "TrackRow.tsx"
Cohesion: 0.46
Nodes (4): DragMode, PX_PER_SECOND, TRACK_HEIGHT, TrackRow()

### Community 69 - "voice.ts"
Cohesion: 0.67
Nodes (3): parseTranscript(), transcribeAsset(), VoiceError

### Community 70 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

## Knowledge Gaps
- **671 isolated node(s):** `$schema`, `plugin`, `lava-backend`, `$schema`, `plugins` (+666 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 741 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AI Video Studio — Session Log` connect `Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation` to `README.md`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `useEditorStore` connect `useEditorStore` to `importer.ts`, `App.tsx`, `TrackRow.tsx`, `editorStore.ts`, `ops.ts`, `TranscriptPanel.tsx`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `lava-backend` to the rest of the system?**
  _671 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `localDirs` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Worked example: Agent Teams for competing-hypothesis debugging` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._