# Graph Report - Lava  (2026-09-13)

## Corpus Check
- 176 files · ~130,836 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2127 nodes · 3458 edges · 123 communities (112 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `88efd5a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- transitions.ts
- localDirs
- compilerOptions
- Worked example: Agent Teams for competing-hypothesis debugging
- compilerOptions
- Code Review and Quality
- Test-Driven Development
- ops.ts
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
- Implementation Plan: M3 — Semantic image matching (first slice)
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
- media.py
- test_render.py
- Lava Studio — Backend (media sidecar)
- sidecar.sh
- lava-backend
- Task list
- detect_pauses
- Task List
- useEditorStore
- parse_captions
- Matcher
- Task List
- matchingStore.ts
- Spec: Voice Analysis (M2 first slice)
- test_preset_import.py
- TrackRow.tsx
- test_clip.py
- .prettierrc.json
- Spec: M3 — Semantic image matching (first slice)
- Session 2026-09-12 — Session 2: continuity system + commit discipline
- Session 2026-09-12 — Session 3: media sidecar (real rendering)
- Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)
- Session 2026-09-12 — Session 5: M2 voice analysis (first slice)
- Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)
- build_transition_graph
- AI Video Studio — Session Log
- Spec: Timing fit + manual timing override (M3 remainder, slice-set B)
- Implementation Plan: M3 remainder — timing fit + manual timing override
- Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override
- Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass)
- Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)
- Implementation Plan: M3 final — multilingual image matching
- ApiError
- Spec: `transitions-core` — transition model, heuristics, persistence
- Implementation Plan: `transitions-core` (M4 module 1)
- Session 2026-09-12 — Session 9: M4 module 1 — transitions-core
- Capability Map: M4 — Transition / Animation Engine
- project.ts
- Spec: `transitions-render` — transitions in the FFmpeg render pipeline
- Session 2026-09-12 — Session 10: M4 module 2 — transitions-render
- Implementation Plan: `transitions-render` (M4 module 2)
- captions.ts
- Spec: transitions-ui (M4 module 3)
- Spec: image-motion (M4 module 4)
- vitest
- Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui
- WHAT
- main.py
- Spec: M5 Module 3 — caption-render
- Session 13 — M5 caption engine complete (all four modules)
- Capability Map: M5 Caption Engine
- RenderSettings
- editorStore.ts
- Spec: M6 — Template/Font System
- ffmpeg.ts
- Plan: M5 Module 1 — caption-core
- test_fonts.py
- CaptionPanel.tsx
- PresetPanel.test.tsx
- Implementation Plan: preset-registry (M6 module 2)
- Implementation Plan: preset-import (M6 module 3)
- Task list
- Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)
- config.py
- Spec: font-system (M6 module 1)
- Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)
- Spec: preset-registry (M6 module 2)
- AI Video Studio — Architecture
- Spec: preset-import (M6 module 3)
- Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)

## God Nodes (most connected - your core abstractions)
1. `useEditorStore` - 56 edges
2. `EditorActions` - 31 edges
3. `ApiError` - 30 edges
4. `vitest` - 27 edges
5. `RenderSettings` - 24 edges
6. `build_transition_graph()` - 23 edges
7. `AI Video Studio — Master Project Documentation` - 23 edges
8. `render()` - 22 edges
9. `make_image()` - 22 edges
10. `Matcher` - 21 edges

## Surprising Connections (you probably didn't know these)
- `render_endpoint()` --uses--> `CaptionError`  [INFERRED]
  backend/src/lava_backend/main.py → backend/src/lava_backend/captions.py
- `test_render_captions_with_fontsdir()` --uses--> `CaptionStyleSpec`  [INFERRED]
  backend/tests/test_fonts.py → backend/src/lava_backend/captions.py
- `render()` --uses--> `CaptionItemSpec`  [INFERRED]
  backend/src/lava_backend/media.py → backend/src/lava_backend/captions.py
- `_write_ass_file()` --uses--> `CaptionItemSpec`  [INFERRED]
  backend/src/lava_backend/media.py → backend/src/lava_backend/captions.py
- `test_render_captions_with_fontsdir()` --uses--> `CaptionItemSpec`  [INFERRED]
  backend/tests/test_fonts.py → backend/src/lava_backend/captions.py

## Import Cycles
- None detected.

## Communities (123 total, 9 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (35): dependencies, react, react-dom, zundo, zustand, devDependencies, jsdom, oxlint (+27 more)

### Community 1 - "transitions.ts"
Cohesion: 0.12
Nodes (24): betweenLabel(), clipName(), TransitionsPanel(), BetweenTransition, clampTransitionDuration(), ClipLike, DEFAULT_DURATIONS, defaultDuration() (+16 more)

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

### Community 8 - "ops.ts"
Cohesion: 0.12
Nodes (24): addClip(), addClips(), ClipInput, createClip(), duplicateClip(), moveClip(), newId(), removeClip() (+16 more)

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
Cohesion: 0.11
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
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation, Verify, WHAT

### Community 37 - "AI Video Studio — Decision Log"
Cohesion: 0.08
Nodes (25): AI Video Studio — Decision Log, D-001 — Web-first editor shell (Vite + React + TypeScript), D-002 — Zustand + Zundo for state and undo/redo, D-003 — Project-local FFmpeg binary, D-004 — FFmpeg provider abstraction, D-005 — Curated vendor skills; reference clones kept local, D-006 — Commit `graphify-out/`; code-only pass for now, D-007 — Written session log + decisions log for continuity (+17 more)

### Community 38 - "Implementation Plan: M3 — Semantic image matching (first slice)"
Cohesion: 0.14
Nodes (13): Architecture decisions, Checkpoints, Implementation Plan: M3 — Semantic image matching (first slice), Open questions, Overview, Risks and mitigations, Slice 1 — embedding-core (backend, TDD), Slice 2 — match-api (backend, TDD) (+5 more)

### Community 39 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 40 - "AI Video Studio — Test Plan"
Cohesion: 0.20
Nodes (10): 1. Voice/Image Fixtures, 2. Manhwa Fixtures, 3. Editor / Timeline Tests, 4. Templates / Fonts Tests, 5.1 Voice-analysis verification so far, 5.2 Image-matching verification so far, 5. Persistence / Data Integrity, 6. Performance Sanity (Baseline Hardware) (+2 more)

### Community 41 - "AI Video Studio — UI Specification"
Cohesion: 0.22
Nodes (9): 1. Direction, 2. Avoid, 3. Prefer, 4. Primary Layout, 5. Manhwa Correction View, 6. Voice-over → Timeline View, 7. State Requirements, 8. Transitions UI (M4 `transitions-ui`) (+1 more)

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

### Community 52 - "media.py"
Cohesion: 0.24
Nodes (17): Config, _ass_filter_string(), check_binary(), _float(), _int(), probe(), ProbeResult, ProbeStream (+9 more)

### Community 53 - "test_render.py"
Cohesion: 0.11
Nodes (30): Lava Studio media sidecar package., make_clip(), test_probe_reports_media_metadata(), make_image(), Path, Real-ffmpeg smoke: the burned caption visibly changes a bottom-strip frame., render_multipart(), render_multipart_captions() (+22 more)

### Community 54 - "Lava Studio — Backend (media sidecar)"
Cohesion: 0.33
Nodes (5): API, Lava Studio — Backend (media sidecar), Layout, Run, Tests

### Community 58 - "Task list"
Cohesion: 0.10
Nodes (19): M1 — Media foundation (closed, pushed), M2 — Voice analysis (closed, pushed @ `e864f18`), M3 — Semantic image matching (closed, pushed @ `79b2fb2`; timing set closed @ `ca1dd23`), M4 open, M4 — Transition/animation engine (closed, pushed @ `0234747`), M5 — Caption engine (closed, pushed), M6 — Module 1: font-system (SPEC-font-system.md, tasks/plan-font.md), M6 — Module 2: preset-registry (SPEC-preset-registry.md, tasks/plan-presets.md) (+11 more)

### Community 59 - "detect_pauses"
Cohesion: 0.09
Nodes (17): confidence_from_logprob(), detect_pauses(), Pause, Word, serialize(), serialize_segment(), FakeTranscriber, Path (+9 more)

### Community 60 - "Task List"
Cohesion: 0.14
Nodes (13): Architecture Decisions, Checkpoint: 1–2, Checkpoint: 2, Checkpoint: full, Implementation Plan: transitions-ui (M4 module 3), Open Questions, Overview, Phase 1: Store (slice 1) (+5 more)

### Community 61 - "useEditorStore"
Cohesion: 0.08
Nodes (19): App(), captionsRenderPayload(), InspectorPanel(), kindOf(), MediaPanel(), MotionPanel(), formatTime(), PreviewPanel() (+11 more)

### Community 62 - "parse_captions"
Cohesion: 0.09
Nodes (27): Any, ass_color(), ass_time(), build_ass_document(), build_dialogue_line(), build_style_line(), CaptionError, CaptionItemSpec (+19 more)

### Community 63 - "Matcher"
Cohesion: 0.18
Nodes (10): Beat, Matcher, Repetition-aware greedy assignment of CLIP embeddings to narration beats.…, FakeEmbedder, make_image(), make_route_client(), png_bytes(), post() (+2 more)

### Community 64 - "Task List"
Cohesion: 0.14
Nodes (13): Architecture Decisions, Checkpoint: 1–2, Checkpoint: full, Implementation Plan: image-motion (M4 module 4), Open Questions, Overview, Phase 1: Backend motion filters (slice 1), Phase 2: API contract (slice 2) (+5 more)

### Community 65 - "matchingStore.ts"
Cohesion: 0.06
Nodes (45): MatchPanel(), attachPauses(), buildNodes(), confidenceLabel(), lowConfidence(), Node, TranscriptPanel(), Beat (+37 more)

### Community 66 - "Spec: Voice Analysis (M2 first slice)"
Cohesion: 0.18
Nodes (11): Boundaries, Capability Map, Code Style, Commands, Objective, Open Questions, Project Structure, Spec: Voice Analysis (M2 first slice) (+3 more)

### Community 67 - "test_preset_import.py"
Cohesion: 0.05
Nodes (51): import_preset_payload(), _payload_to_preset_dict(), preset_to_export_dict(), PresetImportError, ValueError, Preset import/export (M6 module 3). Import accepts the `lava-preset` envelope…, Raised when an imported preset fails validation., Validate + normalise an imported preset payload. Forces category to Custom and… (+43 more)

### Community 68 - "TrackRow.tsx"
Cohesion: 0.20
Nodes (9): DragMode, PX_PER_SECOND, TRACK_HEIGHT, TrackRow(), chipWidthPx(), imageA, imageB, unmount() (+1 more)

### Community 69 - "test_clip.py"
Cohesion: 0.05
Nodes (48): ClipEmbedder, cosine_similarity(), l2_normalize(), MultilingualClipEmbedder, _output_names(), _pick(), _pick_by_names(), preprocess_image() (+40 more)

### Community 70 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 71 - "Spec: M3 — Semantic image matching (first slice)"
Cohesion: 0.17
Nodes (11): Boundaries, Capability map, Code style, Commands, Objective, Open questions, Project structure, Spec: M3 — Semantic image matching (first slice) (+3 more)

### Community 72 - "Session 2026-09-12 — Session 2: continuity system + commit discipline"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 2: continuity system + commit discipline, Verify, WHAT

### Community 73 - "Session 2026-09-12 — Session 3: media sidecar (real rendering)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 3: media sidecar (real rendering), Verify, WHAT

### Community 74 - "Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing), Verify, WHAT

### Community 75 - "Session 2026-09-12 — Session 5: M2 voice analysis (first slice)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 5: M2 voice analysis (first slice), Verify, WHAT

### Community 76 - "Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 6: M3 semantic image matching (first slice), Verify, WHAT

### Community 77 - "build_transition_graph"
Cohesion: 0.21
Nodes (23): BetweenSpec, build_transition_graph(), EdgeSpec, _filter_complex(), Return (filter_complex, total_duration) for a clip fold with transitions. Pure…, RenderClip, test_build_transition_graph_with_motion_keeps_parity_when_absent(), clip() (+15 more)

### Community 78 - "AI Video Studio — Session Log"
Cohesion: 0.22
Nodes (9): AI Video Studio — Session Log, HOW, Limitations, Next step, Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills), Template, Verify, WHAT (+1 more)

### Community 79 - "Spec: Timing fit + manual timing override (M3 remainder, slice-set B)"
Cohesion: 0.15
Nodes (12): Behaviour (acceptance criteria), Boundaries, Code style, Commands, Concepts, Implementation notes (post-slice audit), Objective, Open questions (+4 more)

### Community 80 - "Implementation Plan: M3 remainder — timing fit + manual timing override"
Cohesion: 0.18
Nodes (10): Checkpoints, Implementation Plan: M3 remainder — timing fit + manual timing override, Open questions, Overview, Risks / mitigations, Slice 1 — timing-core (pure TS, TDD), Slice 2 — store-override (matchingStore, TDD), Slice 3 — panel-note (+2 more)

### Community 81 - "Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override, Verify, WHAT

### Community 82 - "Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass)"
Cohesion: 0.18
Nodes (10): Behaviour / acceptance, Boundaries, Commands, Design, Key finding (validated on the downloaded model), Objective, Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass), Structure (+2 more)

### Community 83 - "Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu), Verify, WHAT, WHY

### Community 84 - "Implementation Plan: M3 final — multilingual image matching"
Cohesion: 0.25
Nodes (7): Checkpoints, Implementation Plan: M3 final — multilingual image matching, Risks / mitigation, Slice 1 — multilingual core (backend, TDD), Slice 2 — wiring (auto-select), Slice 3 — real-model smoke (manual, non-committed), Slice 4 — docs, review, commit, push

### Community 85 - "ApiError"
Cohesion: 0.12
Nodes (19): ApiError, error_response(), Exception, Consistent error semantics for the sidecar API., api_error_handler(), Request, EmbedFailure, match() (+11 more)

### Community 86 - "Spec: `transitions-core` — transition model, heuristics, persistence"
Cohesion: 0.14
Nodes (13): Behaviour / acceptance, Boundaries, Code style, Commands, Data model, Objective, Persistence, Project structure / files (+5 more)

### Community 87 - "Implementation Plan: `transitions-core` (M4 module 1)"
Cohesion: 0.22
Nodes (8): Checkpoints, Implementation Plan: `transitions-core` (M4 module 1), Risks, Slice 1 — model + constants + clamps, Slice 2 — heuristics, Slice 3 — validation + ops, Slice 4 — persistence, Slice 5 — docs + regression + commit + push

### Community 88 - "Session 2026-09-12 — Session 9: M4 module 1 — transitions-core"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 9: M4 module 1 — transitions-core, Verify, WHAT, WHY

### Community 89 - "Capability Map: M4 — Transition / Animation Engine"
Cohesion: 0.29
Nodes (6): Boundaries, Build order, Capability Map: M4 — Transition / Animation Engine, Dependency direction notes, Open questions, Per-module gating

### Community 90 - "project.ts"
Cohesion: 0.20
Nodes (20): isAsset(), isClip(), isRecord(), isTrack(), isTranscript(), parseCaptions(), parseProjectJson(), parseProjectModel() (+12 more)

### Community 91 - "Spec: `transitions-render` — transitions in the FFmpeg render pipeline"
Cohesion: 0.18
Nodes (10): Behaviour / acceptance, Boundaries, Code style, Commands, Data contract (backend), Objective, Spec: `transitions-render` — transitions in the FFmpeg render pipeline, Structure / files (+2 more)

### Community 92 - "Session 2026-09-12 — Session 10: M4 module 2 — transitions-render"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 10: M4 module 2 — transitions-render, Verify, WHAT, WHY

### Community 93 - "Implementation Plan: `transitions-render` (M4 module 2)"
Cohesion: 0.25
Nodes (7): Checkpoints, Implementation Plan: `transitions-render` (M4 module 2), Risks, Slice 1 — pure graph builder (media.py, TDD), Slice 2 — render integration, Slice 3 — API contract, Slice 4 — docs + regression + commit + push

### Community 94 - "captions.ts"
Cohesion: 0.19
Nodes (18): CAPTION_PAUSE_SPLIT_THRESHOLD, CAPTION_TRACK_ID, CaptionSource, CaptionWord, clampCaptionDuration(), DEFAULT_CAPTION_STYLE_ID, isCaption(), isRecord() (+10 more)

### Community 95 - "Spec: transitions-ui (M4 module 3)"
Cohesion: 0.17
Nodes (11): Boundaries, Code style, Commands, Objective, Open questions, Out of scope, Project structure (touched), Scope (+3 more)

### Community 96 - "Spec: image-motion (M4 module 4)"
Cohesion: 0.18
Nodes (10): Boundaries, Code style, Commands, Objective, Open questions, Project structure (touched), Scope, Spec: image-motion (M4 module 4) (+2 more)

### Community 97 - "vitest"
Cohesion: 0.13
Nodes (8): imageA, imageB, unmount(), EdgeTransition, presets, imageA, imageB, vitest

### Community 98 - "Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui, Verify, WHAT, WHY

### Community 99 - "WHAT"
Cohesion: 0.18
Nodes (10): Boundaries / non-goals, Edit ops (pure), Generation — `segmentCaptions(transcript, options?)`, Model (`frontend/src/editor/captions.ts`), Project round-trip (`project.ts`), Spec: M5 Module 1 — caption-core, Store (`editorStore`), Verify (+2 more)

### Community 100 - "main.py"
Cohesion: 0.15
Nodes (33): get_config(), is_allowed_font_name(), make_font_metadata(), _all_presets(), _builtin_by_id(), ClipMetadata, create_preset(), delete_font() (+25 more)

### Community 101 - "Spec: M5 Module 3 — caption-render"
Cohesion: 0.22
Nodes (8): ASS generation (pure, `captions.py`), Boundaries / non-goals, Errors, Spec: M5 Module 3 — caption-render, Verify, WHAT, WHY, Wire shape (per item)

### Community 102 - "Session 13 — M5 caption engine complete (all four modules)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 13 — M5 caption engine complete (all four modules), Verify, WHAT

### Community 103 - "Capability Map: M5 Caption Engine"
Cohesion: 0.25
Nodes (7): Boundaries / decisions, Build order, Capability Map: M5 Caption Engine, Gate, Modules, Objective, What is NOT in M5 (explicit deferrals)

### Community 104 - "RenderSettings"
Cohesion: 0.29
Nodes (18): _motion_filters(), MotionSpec, _prep_chain(), Zoom/pan FX via zoompan (per-frame z/x/y), scaled for source headroom., RenderSettings, _validate_motion(), clip(), parametrize (+10 more)

### Community 105 - "editorStore.ts"
Cohesion: 0.13
Nodes (25): MOTION_TYPES, applyClips(), clipWith(), imageAsset, unmount(), videoAsset, CaptionItem, assets (+17 more)

### Community 106 - "Spec: M6 — Template/Font System"
Cohesion: 0.09
Nodes (22): Animated Captions, Boundaries, Build Order, Code Style, Commands, Font System, Module 1: font-system, Module 2: preset-registry (+14 more)

### Community 107 - "ffmpeg.ts"
Cohesion: 0.06
Nodes (36): FONT_EXTENSIONS, FontPanel(), LICENSE_TYPES, arial, unmount(), ensureFontFace(), FontLicense, FontMetadata (+28 more)

### Community 108 - "Plan: M5 Module 1 — caption-core"
Cohesion: 0.50
Nodes (3): Plan: M5 Module 1 — caption-core, Risks, Slices

### Community 109 - "test_fonts.py"
Cohesion: 0.08
Nodes (49): _candidate_names(), clean_family_name(), _decode_name(), extract_family_name(), font_license_from_payload(), FontError, has_font_signature(), load_registry() (+41 more)

### Community 110 - "CaptionPanel.tsx"
Cohesion: 0.20
Nodes (10): CaptionPanel(), captionToWire(), transcript, unmount(), voice, CAPTION_STYLES, DEFAULT_CAPTION_STYLE_ID, getCaptionStyle() (+2 more)

### Community 111 - "PresetPanel.test.tsx"
Cohesion: 0.11
Nodes (22): PresetPanel(), presets, unmount(), CaptionStyle, BUILTIN_CATEGORIES, captionStyleFromPreset(), isCategory(), parsePreset() (+14 more)

### Community 112 - "Implementation Plan: preset-registry (M6 module 2)"
Cohesion: 0.17
Nodes (11): Architecture decisions, Implementation Plan: preset-registry (M6 module 2), Open questions, Overview, Risks and mitigations, Task 1 — pure layer (slice 1), Task 2 — API (slice 2), Task 3 — frontend model + store (slice 3) (+3 more)

### Community 113 - "Implementation Plan: preset-import (M6 module 3)"
Cohesion: 0.15
Nodes (12): Architecture decisions, Checkpoints, Implementation Plan: preset-import (M6 module 3), Open questions, Overview, Risks and mitigations, Task 1 — pure import layer (slice 1), Task 2 — API (slice 2) (+4 more)

### Community 114 - "Task list"
Cohesion: 0.15
Nodes (12): Architecture decisions, Checkpoint 1–2, Implementation Plan: font-system (M6 module 1), Open questions, Overview, Risks and mitigations, Task 1 — backend core (slice 1), Task 2 — API + renderer wire (slice 2) (+4 more)

### Community 115 - "Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply), Verify, WHAT

### Community 116 - "config.py"
Cohesion: 0.24
Nodes (8): _payload(), Resolve Lava Studio project-local configuration and paths., reset_config(), tool_versions(), ToolVersions, _clean_config(), client(), fixture

### Community 117 - "Spec: font-system (M6 module 1)"
Cohesion: 0.18
Nodes (10): Boundaries, Code style, Commands, Objective, Open questions, Project structure (touched), Scope, Spec: font-system (M6 module 1) (+2 more)

### Community 118 - "Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs), Verify, WHAT

### Community 119 - "Spec: preset-registry (M6 module 2)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Architecture decisions, Files, Open questions, Scope, Slices, Spec: preset-registry (M6 module 2)

### Community 120 - "AI Video Studio — Architecture"
Cohesion: 0.20
Nodes (10): 1. Repository Layout, 2. Design Principles, 3. Core Technology, 4. Voice-over → Images Processing Graph, 5. Manhwa / Webtoon Extraction Processing Graph, 6. Caption Processing Graph, 7. System Boundaries, 8. Design Decisions (WHY) (+2 more)

### Community 121 - "Spec: preset-import (M6 module 3)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, ASSUMPTIONS I'M MAKING, Files, Objective, Open questions, Slices, Spec: preset-import (M6 module 3)

### Community 122 - "Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes), Verify, WHAT

## Knowledge Gaps
- **1032 isolated node(s):** `$schema`, `plugin`, `lava-backend`, `$schema`, `plugins` (+1027 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1254 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `package.json`, `matchingStore.ts`, `transitions.ts`, `TrackRow.tsx`, `ops.ts`, `editorStore.ts`, `ffmpeg.ts`, `CaptionPanel.tsx`, `PresetPanel.test.tsx`, `useEditorStore`, `captions.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `useEditorStore` connect `useEditorStore` to `matchingStore.ts`, `transitions.ts`, `vitest`, `TrackRow.tsx`, `ops.ts`, `editorStore.ts`, `CaptionPanel.tsx`, `PresetPanel.test.tsx`, `captions.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `AI Video Studio — Session Log` connect `AI Video Studio — Session Log` to `Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui`, `README.md`, `Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation`, `Session 13 — M5 caption engine complete (all four modules)`, `Session 2026-09-12 — Session 2: continuity system + commit discipline`, `Session 2026-09-12 — Session 3: media sidecar (real rendering)`, `Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)`, `Session 2026-09-12 — Session 5: M2 voice analysis (first slice)`, `Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)`, `Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override`, `Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)`, `Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)`, `Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)`, `Session 2026-09-12 — Session 9: M4 module 1 — transitions-core`, `Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)`, `Session 2026-09-12 — Session 10: M4 module 2 — transitions-render`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `ApiError` (e.g. with `api_error_handler()` and `match()`) actually correct?**
  _`ApiError` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `RenderSettings` (e.g. with `render_endpoint()` and `test_render_captions_with_fontsdir()`) actually correct?**
  _`RenderSettings` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugin`, `lava-backend` to the rest of the system?**
  _1032 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._