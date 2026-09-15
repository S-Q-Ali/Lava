# Graph Report - Lava  (2026-09-15)

## Corpus Check
- 271 files · ~198,099 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3454 nodes · 6062 edges · 207 communities (195 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 238 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55c0cd15`
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
- README.md
- Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation
- AI Video Studio — Decision Log
- Implementation Plan: M3 — Semantic image matching (first slice)
- graphify reference: extra exports and benchmark
- AI Video Studio — Test Plan
- TrackRow.tsx
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
- validate_preset
- test_render.py
- Lava Studio — Backend (media sidecar)
- sidecar.sh
- lava-backend
- Task list
- transcribe.py
- Task List
- useEditorStore
- parse_captions
- Matcher
- Task List
- .load
- Spec: Voice Analysis (M2 first slice)
- test_preset_import.py
- fontStore.ts
- manhwa_strips.py
- .prettierrc.json
- Spec: M3 — Semantic image matching (first slice)
- Session 2026-09-12 — Session 2: continuity system + commit discipline
- Session 2026-09-12 — Session 3: media sidecar (real rendering)
- Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)
- Session 2026-09-12 — Session 5: M2 voice analysis (first slice)
- Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)
- export.py
- Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)
- Spec: Timing fit + manual timing override (M3 remainder, slice-set B)
- Implementation Plan: M3 remainder — timing fit + manual timing override
- Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override
- Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass)
- Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)
- Implementation Plan: M3 final — multilingual image matching
- RenderSettings
- Spec: `transitions-core` — transition model, heuristics, persistence
- Implementation Plan: `transitions-core` (M4 module 1)
- Session 2026-09-12 — Session 9: M4 module 1 — transitions-core
- Capability Map: M4 — Transition / Animation Engine
- generate_image_proxy
- Spec: `transitions-render` — transitions in the FFmpeg render pipeline
- Session 2026-09-12 — Session 10: M4 module 2 — transitions-render
- Implementation Plan: `transitions-render` (M4 module 2)
- captions.ts
- Spec: transitions-ui (M4 module 3)
- Spec: image-motion (M4 module 4)
- Module 2 — runtime-optimization (D-034)
- Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui
- WHAT
- main.py
- Spec: M5 Module 3 — caption-render
- Session 13 — M5 caption engine complete (all four modules)
- Capability Map: M5 Caption Engine
- test_clip.py
- CaptionPanel.tsx
- Spec: M6 — Template/Font System
- ffmpeg.ts
- Plan: M5 Module 1 — caption-core
- test_fonts.py
- ndarray
- media.py
- Implementation Plan: preset-registry (M6 module 2)
- Implementation Plan: preset-import (M6 module 3)
- Task list
- Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)
- Panel
- Spec: font-system (M6 module 1)
- Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)
- Spec: preset-registry (M6 module 2)
- build_transition_graph
- Spec: preset-import (M6 module 3)
- Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)
- Session 37 — V2 Frontend: Presentation/Image Extractor
- SPEC — M6 module 5: `animated-captions`
- Implementation Plan: template-editor (M6 module 4)
- matchingStore.ts
- load_analysis_image
- Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)
- detect_strip
- Spec: template-editor (M6 module 4)
- Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)
- import_preset_payload
- PreviewPanel.tsx
- Plan — M6 module 5: animated-captions
- editor/presets.ts
- SPEC — M7 module 1: `panel-model`
- SPEC — M7 module 3: `panel-order`
- Spec: M9 Module 1 — proxy-preview
- SPEC — M7 module 6: `manhwa-api`
- Capability Map: M9 Hardware Validation
- SPEC — M6 module 6: `license-tracking` (closes the M6 license-metadata row)
- Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done)
- Plan — M6 module 6 (final): license-tracking
- test_runtime.py
- panels.py
- Capability Map: M7 Manhwa / Webtoon Extractor
- Constraints
- Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md
- Plan — M7 module 1: panel-model
- api.py
- make_panel
- editorStore.ts
- Session 25 — M7 module 6 `manhwa-api` (backend complete)
- SPEC — M7 module 2: `panel-detection`
- order.py
- PresetPanel.test.tsx
- FontPanel.test.tsx
- Plan — M7 module 6: manhwa-api (thick storage/HTTP glue)
- Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence
- Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed
- Plan — M7 module 2: panel-detection (OpenCV hybrid signals)
- test_manhwa_api.py
- Plan — M7 module 3: panel-order (pure normalization layer)
- Session 23 — M7 module 4 `panel-export` (full-res crops + manifest)
- SPEC — M7 module 4: `panel-export`
- Plan — M7 module 4: panel-export (full-res PNG/JPG + manifest)
- Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices)
- map_cut_to_source
- Session 26-27 — M7 panel-ui + M8 integrated editor (slices 1–4)
- SPEC — M7 module 5: `panel-correction`
- beats.ts
- Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix
- matching.py
- detect.py
- Plan — M7 module 5: panel-correction (pure list ops)
- analysis_scale
- SPEC — M7 module 7 `panel-ui` (Frontend Manhwa Correction View)
- Slices
- Session 29 — M9 module 2 `runtime-optimization` (5 slices)
- AI Video Studio — Architecture
- FakeBatchTokenizer
- Session 30 — M9 module 3 `memory-tuning` (5 slices)
- build_panels
- Implementation Plan: Remaining Features → Regression Audit → Polish
- M9 — Hardware Validation Measurement Log (D-036)
- Session 31 — M9 module 4 `baseline-validation` (4 slices)
- TranscriptPanel.tsx
- AI Video Studio — Session Log
- LeftWorkspace.tsx
- AI VIDEO STUDIO — MASTER BUILD SPEC V2
- V2 Frontend Restructuring — Plan
- Session 32 — M9 reframe: validation machine-agnostic (D-037)
- AGENTS.md — AI Video Studio
- vitest
- Preset
- validate_layout
- Session 39 — Polish Phase: Accessibility, Responsive, Error/Loading, Docs
- preprocess_image
- NavRail.test.tsx
- Session 34 — V2 Frontend: Topbar + Nav Rail + Left Workspace
- Session 35 — V2 Frontend: Right Panels (AI Match + Auto Captions)
- preset_to_export_dict
- Session 36 — V2 Frontend: Bottom Assets Panel
- TemplateEditorPanel.test.tsx
- Session 38 — Remaining Features + Regression Audit + Polish Prep

## God Nodes (most connected - your core abstractions)
1. `useEditorStore` - 75 edges
2. `ApiError` - 49 edges
3. `vitest` - 44 edges
4. `AI Video Studio — Session Log` - 40 edges
5. `get_config()` - 39 edges
6. `react` - 38 edges
7. `Panel` - 34 edges
8. `EditorActions` - 34 edges
9. `_panel()` - 33 edges
10. `detect_strip()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `fake_clip()` --calls--> `FakeEmbedder`  [INFERRED]
  backend/tests/test_runtime.py → backend/tests/test_matching.py
- `render_endpoint()` --uses--> `CaptionError`  [INFERRED]
  backend/src/lava_backend/main.py → backend/src/lava_backend/captions.py
- `test_render_captions_with_fontsdir()` --uses--> `CaptionStyleSpec`  [INFERRED]
  backend/tests/test_fonts.py → backend/src/lava_backend/captions.py
- `render()` --uses--> `CaptionItemSpec`  [INFERRED]
  backend/src/lava_backend/media.py → backend/src/lava_backend/captions.py
- `_write_ass_file()` --uses--> `CaptionItemSpec`  [INFERRED]
  backend/src/lava_backend/media.py → backend/src/lava_backend/captions.py

## Import Cycles
- None detected.

## Communities (207 total, 10 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.05
Nodes (40): dependencies, react, react-dom, zundo, zustand, devDependencies, jsdom, oxlint (+32 more)

### Community 1 - "transitions.ts"
Cohesion: 0.08
Nodes (29): betweenLabel(), clipName(), imageA, imageB, unmount(), TransitionsPanel(), clampTransitionDuration(), ClipLike (+21 more)

### Community 2 - "localDirs"
Cohesion: 0.08
Nodes (24): backend, host, port, ffmpeg, bin, source, localDirs, cache (+16 more)

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
Nodes (24): InspectorPanel(), kindOf(), MediaPanel(), TimelinePanel(), addClip(), addClips(), createClip(), duplicateClip() (+16 more)

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
Cohesion: 0.14
Nodes (14): AI Video Studio — Roadmap, Milestone 0 — Repository bootstrap, Milestone 10 — Release hardening, Milestone 1 — Media foundation, Milestone 2 — Voice analysis, Milestone 3 — Semantic image matching, Milestone 4 — Transition/animation engine, Milestone 5 — Caption engine (+6 more)

### Community 32 - "AI Video Studio — Features"
Cohesion: 0.18
Nodes (11): 10. Hardware-Aware Operation, 1. Media Foundation, 2. Voice / Audio, 3. Semantic Image Matching, 4. Transitions / Animation, 5. Captions, 6. Templates / Styles / Fonts, 7. Manhwa / Webtoon Extractor (+3 more)

### Community 33 - "The Standing Checklist"
Cohesion: 0.18
Nodes (10): Correctness, Definition of Done, Definition of Done vs. Acceptance Criteria, Documentation, How to Apply, Integration, Quality, Red Flags (+2 more)

### Community 34 - "Observability Checklist"
Cohesion: 0.18
Nodes (10): Alerting, Dashboards, Distributed Tracing, Metrics, Observability Checklist, On-Call Questions (Start Here), Pre-Launch Gate, Structured Logging (+2 more)

### Community 35 - "README.md"
Cohesion: 0.14
Nodes (9): 1. Direction, 2. Avoid, 3. Prefer, 4. Primary Layout, 5. Manhwa Correction View, 6. Voice-over → Timeline View, 7. State Requirements, 8. Transitions UI (M4 `transitions-ui`) (+1 more)

### Community 36 - "Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation, Verify, WHAT

### Community 37 - "AI Video Studio — Decision Log"
Cohesion: 0.05
Nodes (40): AI Video Studio — Decision Log, D-001 — Web-first editor shell (Vite + React + TypeScript), D-002 — Zustand + Zundo for state and undo/redo, D-003 — Project-local FFmpeg binary, D-004 — FFmpeg provider abstraction, D-005 — Curated vendor skills; reference clones kept local, D-006 — Commit `graphify-out/`; code-only pass for now, D-007 — Written session log + decisions log for continuity (+32 more)

### Community 38 - "Implementation Plan: M3 — Semantic image matching (first slice)"
Cohesion: 0.14
Nodes (13): Architecture decisions, Checkpoints, Implementation Plan: M3 — Semantic image matching (first slice), Open questions, Overview, Risks and mitigations, Slice 1 — embedding-core (backend, TDD), Slice 2 — match-api (backend, TDD) (+5 more)

### Community 39 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 40 - "AI Video Studio — Test Plan"
Cohesion: 0.20
Nodes (10): 1. Voice/Image Fixtures, 2. Manhwa Fixtures, 3. Editor / Timeline Tests, 4. Templates / Fonts Tests, 5.1 Voice-analysis verification so far, 5.2 Image-matching verification so far, 5. Persistence / Data Integrity, 6. Performance Sanity (Baseline Hardware) (+2 more)

### Community 41 - "TrackRow.tsx"
Cohesion: 0.19
Nodes (11): DragMode, PX_PER_SECOND, TRACK_HEIGHT, TrackRow(), chipWidthPx(), imageA, imageB, unmount() (+3 more)

### Community 42 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 43 - "Lava — AI Video Studio"
Cohesion: 0.22
Nodes (9): Backend (sidecar), Baseline target hardware, Current status, Differentiators, Documentation, Frontend, Getting started, How to work on this project (+1 more)

### Community 44 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 45 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 46 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 52 - "validate_preset"
Cohesion: 0.17
Nodes (15): PresetError, ValueError, Caption-preset registry (M6 module 2). A preset is a shipped-or-user caption…, Raised when a preset record is malformed., _require_bool(), _require_number(), _require_string(), validate_preset() (+7 more)

### Community 53 - "test_render.py"
Cohesion: 0.08
Nodes (44): Lava Studio media sidecar package., make_clip(), test_probe_reports_media_metadata(), font_entry(), license_client(), make_image(), fixture, Path (+36 more)

### Community 54 - "Lava Studio — Backend (media sidecar)"
Cohesion: 0.33
Nodes (5): API, Lava Studio — Backend (media sidecar), Layout, Run, Tests

### Community 58 - "Task list"
Cohesion: 0.06
Nodes (35): M1 — Media foundation (closed, pushed), M2 — Voice analysis (closed, pushed @ `e864f18`), M3 — Semantic image matching (closed, pushed @ `79b2fb2`; timing set closed @ `ca1dd23`), M4 open, M4 — Transition/animation engine (closed, pushed @ `0234747`), M5 — Caption engine (closed, pushed), M6 — Module 1: font-system (SPEC-font-system.md, tasks/plan-font.md), M6 — Module 2: preset-registry (SPEC-preset-registry.md, tasks/plan-presets.md) (+27 more)

### Community 59 - "transcribe.py"
Cohesion: 0.08
Nodes (24): confidence_from_logprob(), detect_pauses(), Pause, Word, _get_transcriber(), Request, UploadFile, Return the app transcriber, building it lazily on first use. A pre-injected… (+16 more)

### Community 60 - "Task List"
Cohesion: 0.14
Nodes (13): Architecture Decisions, Checkpoint: 1–2, Checkpoint: 2, Checkpoint: full, Implementation Plan: transitions-ui (M4 module 3), Open Questions, Overview, Phase 1: Store (slice 1) (+5 more)

### Community 61 - "useEditorStore"
Cohesion: 0.08
Nodes (15): AutoCaptionsPanel(), CaptionPanel(), MatchPanel(), MOTION_TYPES, MotionPanel(), applyClips(), clipWith(), imageAsset (+7 more)

### Community 62 - "parse_captions"
Cohesion: 0.05
Nodes (50): _animate_line(), ass_color(), ass_time(), build_ass_document(), build_dialogue_line(), build_style_line(), CaptionError, CaptionItemSpec (+42 more)

### Community 63 - "Matcher"
Cohesion: 0.18
Nodes (9): Beat, Matcher, Repetition-aware greedy assignment of CLIP embeddings to narration beats.…, FakeEmbedder, make_image(), make_route_client(), png_bytes(), TestMatchEndpoint (+1 more)

### Community 64 - "Task List"
Cohesion: 0.14
Nodes (13): Architecture Decisions, Checkpoint: 1–2, Checkpoint: full, Implementation Plan: image-motion (M4 module 4), Open Questions, Overview, Phase 1: Backend motion filters (slice 1), Phase 2: API contract (slice 2) (+5 more)

### Community 65 - ".load"
Cohesion: 0.31
Nodes (4): Path, Path, _registry(), TestStripRegistry

### Community 66 - "Spec: Voice Analysis (M2 first slice)"
Cohesion: 0.18
Nodes (11): Boundaries, Capability Map, Code Style, Commands, Objective, Open Questions, Project Structure, Spec: Voice Analysis (M2 first slice) (+3 more)

### Community 67 - "test_preset_import.py"
Cohesion: 0.10
Nodes (6): _envelope(), test_import_forces_custom_category(), test_import_valid_envelope(), test_post_creates_custom_preset(), test_post_forces_custom_category(), test_put_updates_custom_preset_in_place()

### Community 68 - "fontStore.ts"
Cohesion: 0.16
Nodes (19): FONT_EXTENSIONS, FontPanel(), LICENSE_TYPES, ensureFontFace(), FontLicense, FontMetadata, parseFontMetadata(), parseLicense() (+11 more)

### Community 69 - "manhwa_strips.py"
Cohesion: 0.11
Nodes (40): _darken(), _gutter_strip(), _identity_strip(), _image(), make_borderless(), make_bubbles(), seam_draw(), make_clean_black() (+32 more)

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

### Community 77 - "export.py"
Cohesion: 0.08
Nodes (31): M7 Manhwa extractor — shared error type., crop_panel(), encode_panel(), _export_name(), ExportBundle, ExportFile, iter_export_files(), _iter_files() (+23 more)

### Community 78 - "Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills), Verify, WHAT, WHY

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

### Community 85 - "RenderSettings"
Cohesion: 0.22
Nodes (26): _filter_complex(), _motion_filters(), MotionSpec, _prep_chain(), Zoom/pan FX via zoompan (per-frame z/x/y), scaled for source headroom., RenderClip, RenderSettings, _validate_motion() (+18 more)

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

### Community 90 - "generate_image_proxy"
Cohesion: 0.07
Nodes (27): file_hash(), generate_image_proxy(), generate_video_proxy(), _probe_dims(), ProxyError, ProxyResult, Exception, Path (+19 more)

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

### Community 97 - "Module 2 — runtime-optimization (D-034)"
Cohesion: 0.08
Nodes (24): Module 1 — proxy-preview (D-033), Module 2 — runtime-optimization (D-034), Module 3 — memory-tuning (D-035), Module 4 — baseline-validation (D-036), Plan: M9 Hardware Validation, Slice 1: HP Pavilion measurement checklist, Slice 1: lazy model factory, Slice 1: manhwa streaming decode (+16 more)

### Community 98 - "Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui, Verify, WHAT, WHY

### Community 99 - "WHAT"
Cohesion: 0.18
Nodes (10): Boundaries / non-goals, Edit ops (pure), Generation — `segmentCaptions(transcript, options?)`, Model (`frontend/src/editor/captions.ts`), Project round-trip (`project.ts`), Spec: M5 Module 1 — caption-core, Store (`editorStore`), Verify (+2 more)

### Community 100 - "main.py"
Cohesion: 0.11
Nodes (50): get_config(), ApiError, error_response(), Exception, Consistent error semantics for the sidecar API., is_allowed_font_name(), _all_presets(), api_error_handler() (+42 more)

### Community 101 - "Spec: M5 Module 3 — caption-render"
Cohesion: 0.22
Nodes (8): ASS generation (pure, `captions.py`), Boundaries / non-goals, Errors, Spec: M5 Module 3 — caption-render, Verify, WHAT, WHY, Wire shape (per item)

### Community 102 - "Session 13 — M5 caption engine complete (all four modules)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 13 — M5 caption engine complete (all four modules), Verify, WHAT

### Community 103 - "Capability Map: M5 Caption Engine"
Cohesion: 0.25
Nodes (7): Boundaries / decisions, Build order, Capability Map: M5 Caption Engine, Gate, Modules, Objective, What is NOT in M5 (explicit deferrals)

### Community 104 - "test_clip.py"
Cohesion: 0.12
Nodes (19): Encoding, FakeTokenizer, make_embedder(), make_multilingual_embedder(), MultilingualStubSession, stub_feed(), StubSession, test_clip_embedder_embeds_image_batch() (+11 more)

### Community 105 - "CaptionPanel.tsx"
Cohesion: 0.16
Nodes (23): captionToWire(), FLAGS, TemplateEditorPanel(), overwrite(), patch(), saveAsNew(), selectBase(), ANIMATION_OPTIONS (+15 more)

### Community 106 - "Spec: M6 — Template/Font System"
Cohesion: 0.09
Nodes (22): Animated Captions, Boundaries, Build Order, Code Style, Commands, Font System, Module 1: font-system, Module 2: preset-registry (+14 more)

### Community 107 - "ffmpeg.ts"
Cohesion: 0.06
Nodes (47): ManhwaPanel(), ManhwaPanelRow(), ManhwaPanelRowProps, stripDetail, stripSummary, unmount(), backendBaseUrl(), DEFAULT_BASE_URL (+39 more)

### Community 108 - "Plan: M5 Module 1 — caption-core"
Cohesion: 0.50
Nodes (3): Plan: M5 Module 1 — caption-core, Risks, Slices

### Community 109 - "test_fonts.py"
Cohesion: 0.08
Nodes (48): _candidate_names(), clean_family_name(), _decode_name(), extract_family_name(), font_license_from_payload(), FontError, has_font_signature(), load_registry() (+40 more)

### Community 110 - "ndarray"
Cohesion: 0.19
Nodes (12): ClipEmbedder, l2_normalize(), _output_names(), _pick(), _pick_by_names(), ndarray, Return the output matching one of ``names`` (case-insensitive, exact). Falls…, CLIP ViT-B/32 embeddings through a fused ONNX session (Xenova export). Model… (+4 more)

### Community 111 - "media.py"
Cohesion: 0.24
Nodes (17): Config, _ass_filter_string(), check_binary(), _float(), _int(), probe(), ProbeResult, ProbeStream (+9 more)

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

### Community 116 - "Panel"
Cohesion: 0.07
Nodes (34): add_panel(), adjust_panel(), delete_panel(), _fresh_id(), merge_panels(), M7 module 5: pure panel correction ops (module 5 slice 2). Split / Merge /…, Replace one panel's bounds (crop/expand within the source). The new box must…, Insert a user-defined panel (near-certain: confidence 1.0). The new panel gets… (+26 more)

### Community 117 - "Spec: font-system (M6 module 1)"
Cohesion: 0.18
Nodes (10): Boundaries, Code style, Commands, Objective, Open questions, Project structure (touched), Scope, Spec: font-system (M6 module 1) (+2 more)

### Community 118 - "Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs), Verify, WHAT

### Community 119 - "Spec: preset-registry (M6 module 2)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Architecture decisions, Files, Open questions, Scope, Slices, Spec: preset-registry (M6 module 2)

### Community 120 - "build_transition_graph"
Cohesion: 0.21
Nodes (21): BetweenSpec, build_transition_graph(), _invalid(), EdgeSpec, Return (filter_complex, total_duration) for a clip fold with transitions. Pure…, clip(), _make_image(), parametrize (+13 more)

### Community 121 - "Spec: preset-import (M6 module 3)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, ASSUMPTIONS I'M MAKING, Files, Objective, Open questions, Slices, Spec: preset-import (M6 module 3)

### Community 122 - "Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes), Verify, WHAT

### Community 123 - "Session 37 — V2 Frontend: Presentation/Image Extractor"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Purpose (WHY), Session 37 — V2 Frontend: Presentation/Image Extractor, Verify, WHAT

### Community 124 - "SPEC — M6 module 5: `animated-captions`"
Cohesion: 0.18
Nodes (10): Acceptance criteria, Assumptions, Definition of done (this module), Goal, In scope, Out of scope — deferred to M8 preview overlay, Recipes (semantics; exact strings derive from RED tests in slice 1), Scope (+2 more)

### Community 125 - "Implementation Plan: template-editor (M6 module 4)"
Cohesion: 0.15
Nodes (12): Architecture decisions, Checkpoints, Implementation Plan: template-editor (M6 module 4), Open questions, Overview, Risks and mitigations, Task 1 — pure editor model (slice 1), Task 2 — API overwrite (slice 2) (+4 more)

### Community 126 - "matchingStore.ts"
Cohesion: 0.08
Nodes (30): Beat, analyzeRetention(), clipDurations(), hookStrength(), narrativeProgression(), pacingScore(), pacingVariation(), RetentionAnalysis (+22 more)

### Community 127 - "load_analysis_image"
Cohesion: 0.14
Nodes (15): detect_cuts(), load_analysis_image(), Convert to gray float analysis image; returns (gray, ana_w, ana_h, factor).…, row_features(), clean_fixture(), _cuts(), _expected_analysis_cuts(), fixture (+7 more)

### Community 128 - "Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix), Verify, WHAT

### Community 129 - "detect_strip"
Cohesion: 0.11
Nodes (20): detect_strip(), Any, Path, Detect panels in a vertical strip; optionally persist crops + registry. The…, asset_name(), Zero-padded asset file name, e.g. `panel_001.png`. Width = len(str(total))., Memory-tuning tests: JPEG draft decode and lazy open path., In-memory Image (no fp) falls back to full convert, never attempts draft. (+12 more)

### Community 130 - "Spec: template-editor (M6 module 4)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, ASSUMPTIONS I'M MAKING, Files, Objective, Open questions, Slices, Spec: template-editor (M6 module 4)

### Community 131 - "Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract), Verify, WHAT

### Community 132 - "import_preset_payload"
Cohesion: 0.15
Nodes (18): import_preset_payload(), _payload_to_preset_dict(), PresetImportError, ValueError, Preset import/export (M6 module 3). Import accepts the `lava-preset` envelope…, Raised when an imported preset fails validation., Validate + normalise an imported preset payload. Forces category to Custom and…, Deterministic-ish, unique-ish id from a label (import UI convenience). (+10 more)

### Community 133 - "PreviewPanel.tsx"
Cohesion: 0.11
Nodes (24): captionsRenderPayload(), formatTime(), MediaElement, PreviewPanel(), unmount(), ASPECT_RATIOS, AspectRatio, unmount() (+16 more)

### Community 134 - "Plan — M6 module 5: animated-captions"
Cohesion: 0.29
Nodes (6): Plan — M6 module 5: animated-captions, Task 1 (slice 1) — Backend ASS animation, Task 2 (slice 2) — Backend preset schema, Task 3 (slice 3) — Frontend model + wire, Task 4 (slice 4) — Editor + panel, Task 5 (slice 5) — Docs + graphify + regression + push

### Community 135 - "editor/presets.ts"
Cohesion: 0.15
Nodes (21): isCaptionAnimation(), BUILTIN_CATEGORIES, captionStyleFromPreset(), isCategory(), parsePreset(), Preset, PresetCategory, good (+13 more)

### Community 136 - "SPEC — M7 module 1: `panel-model`"
Cohesion: 0.15
Nodes (12): Asset naming, Boundaries, Commands, Coordinate mapping (analysis ↔ source), Data model, Objective, Open questions, Project structure (+4 more)

### Community 137 - "SPEC — M7 module 3: `panel-order`"
Cohesion: 0.22
Nodes (8): Boundaries, Commands, Functions (`manhwa/order.py`), Objective, SPEC — M7 module 3: `panel-order`, Success criteria, Testing (TDD), Wire-in (slice 2)

### Community 138 - "Spec: M9 Module 1 — proxy-preview"
Cohesion: 0.14
Nodes (13): API Contract, Assumptions, Backend (`media.py` + `main.py`), Boundaries, Frontend (`types.ts` + `importer.ts` + `services/proxy.ts` + `PreviewPanel.tsx`), GET /api/proxy/{proxyId}, Implementation Notes, Objective (+5 more)

### Community 139 - "SPEC — M7 module 6: `manhwa-api`"
Cohesion: 0.20
Nodes (9): Boundaries, Commands, Correction ops (PATCH `/panels`), Objective, Routes (mounted at `/api/manhwa`), SPEC — M7 module 6: `manhwa-api`, Storage helpers (`manhwa/api.py`), Testing (TDD, isolated in tmp dirs) (+1 more)

### Community 140 - "Capability Map: M9 Hardware Validation"
Cohesion: 0.25
Nodes (7): Assumptions, Build order, Capability Map: M9 Hardware Validation, Gate, Modules, Objective, What is NOT in M9 (explicit deferrals)

### Community 141 - "SPEC — M6 module 6: `license-tracking` (closes the M6 license-metadata row)"
Cohesion: 0.20
Nodes (9): Acceptance criteria, Assumptions, Definition of done (this module), Goal, In scope, Out of scope (documented, not silent), Scope, Slices (+1 more)

### Community 142 - "Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done), Verify, WHAT

### Community 143 - "Plan — M6 module 6 (final): license-tracking"
Cohesion: 0.33
Nodes (5): Plan — M6 module 6 (final): license-tracking, Task 1 (slice 1) — Backend pure resolver, Task 2 (slice 2) — Render integration, Task 3 (slice 3) — Frontend parity + badge, Task 4 (slice 4) — Docs + graphify + regression + push

### Community 144 - "test_runtime.py"
Cohesion: 0.10
Nodes (17): _payload(), Resolve Lava Studio project-local configuration and paths., reset_config(), tool_versions(), ToolVersions, _clean_config(), client(), fixture (+9 more)

### Community 145 - "panels.py"
Cohesion: 0.18
Nodes (13): asset_for_id(), _expect_float(), _expect_int(), _expect_str(), id_for_asset(), panel_from_dict(), panel_to_dict(), Any (+5 more)

### Community 146 - "Capability Map: M7 Manhwa / Webtoon Extractor"
Cohesion: 0.25
Nodes (7): Assumptions, Build order, Capability Map: M7 Manhwa / Webtoon Extractor, Gate, Modules, Objective, What is NOT in M7 (explicit deferrals)

### Community 147 - "Constraints"
Cohesion: 0.29
Nodes (6): Constraints, Declared, tools pending (BLOCK once installed), Enforced with numbers (runs today), Exceptions, Floor (always enforced, no setup required), Measured, not yet enforced

### Community 148 - "Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md, Verify, WHAT, WHY

### Community 150 - "api.py"
Cohesion: 0.10
Nodes (32): apply_correction(), _apply_panels(), delete_strip(), export_strip(), get_strip(), list_strips(), load_registry(), manhwa_dir() (+24 more)

### Community 151 - "make_panel"
Cohesion: 0.30
Nodes (4): make_panel(), _panel(), M7 module 1: panel model, coordinate mapping, asset naming, StripRegistry., TestPanel

### Community 152 - "editorStore.ts"
Cohesion: 0.10
Nodes (40): transcript, unmount(), voice, CaptionItem, isAsset(), isClip(), isRecord(), isTrack() (+32 more)

### Community 153 - "Session 25 — M7 module 6 `manhwa-api` (backend complete)"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 25 — M7 module 6 `manhwa-api` (backend complete), Verification, WHAT, WHY

### Community 154 - "SPEC — M7 module 2: `panel-detection`"
Cohesion: 0.17
Nodes (11): Boundaries, Commands, Fixtures (deterministic, synthetic — TEST_PLAN §2), Function surface (`manhwa/detect.py`), Objective, Open questions, Pipeline, Signals & thresholds (module constants, not per-image tuning) (+3 more)

### Community 155 - "order.py"
Cohesion: 0.13
Nodes (13): attribute_confidence(), _certain_confidence(), guard_layout(), order_panels(), M7 module 3: reading order, confidence attribution, layout guards. Pure data…, Sort into natural top→bottom reading order and renumber `order` 1..n. Sort key…, Attach each panel a confidence equal to its two bounding boundaries' min.…, Validate a layout: non-empty, unique ids, no positive-area box overlap.… (+5 more)

### Community 156 - "PresetPanel.test.tsx"
Cohesion: 0.18
Nodes (5): PresetPanel(), jsonResponse(), presets, smartFetchMock(), unmount()

### Community 157 - "FontPanel.test.tsx"
Cohesion: 0.29
Nodes (3): arial, unmount(), resetFontFaceRegistrations()

### Community 158 - "Plan — M7 module 6: manhwa-api (thick storage/HTTP glue)"
Cohesion: 0.33
Nodes (5): Plan — M7 module 6: manhwa-api (thick storage/HTTP glue), Slice 1 — storage helpers + read endpoints, Slice 2 — upload + asset serving + delete + redetect + reset, Slice 3 — correction ops + export, Slice 4 — docs

### Community 159 - "Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence, Verification, WHAT, WHY

### Community 160 - "Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed, Verification, WHAT, WHY

### Community 161 - "Plan — M7 module 2: panel-detection (OpenCV hybrid signals)"
Cohesion: 0.33
Nodes (5): Plan — M7 module 2: panel-detection (OpenCV hybrid signals), Slice 1 — analysis image + row features + clean-gutter cuts (RED first), Slice 2 — rescue pass + edge cases, Slice 3 — build_panels + registry integration, Slice 4 — docs + graphify + regression + push gate

### Community 162 - "test_manhwa_api.py"
Cohesion: 0.06
Nodes (31): GcReport, _proxy_files(), purge_stale_proxies(), Path, Garbage collection for regenerable disk caches. Only artifacts that are derived…, Proxy-labelled files only; stray files in the dir are never collected., Delete proxy files not accessed within `ttl_days` (default: config). Names not…, fonts_client() (+23 more)

### Community 163 - "Plan — M7 module 3: panel-order (pure normalization layer)"
Cohesion: 0.40
Nodes (4): Plan — M7 module 3: panel-order (pure normalization layer), Slice 1 — order_panels + attribute_confidence + guard_layout (pure), Slice 2 — detect wiring (single source of truth), Slice 3 — docs + graphify + regression + push gate

### Community 164 - "Session 23 — M7 module 4 `panel-export` (full-res crops + manifest)"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 23 — M7 module 4 `panel-export` (full-res crops + manifest), Verification, WHAT, WHY

### Community 165 - "SPEC — M7 module 4: `panel-export`"
Cohesion: 0.25
Nodes (7): Boundaries, Commands, Functions (`manhwa/export.py`), Objective, SPEC — M7 module 4: `panel-export`, Testing (TDD), Wire precedence

### Community 166 - "Plan — M7 module 4: panel-export (full-res PNG/JPG + manifest)"
Cohesion: 0.40
Nodes (4): Plan — M7 module 4: panel-export (full-res PNG/JPG + manifest), Slice 1 — crop + encode (pure image ops), Slice 2 — manifest + materialize (guard integration), Slice 3 — docs + graphify + regression + push gate

### Community 167 - "Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices), Verify, WHAT

### Community 168 - "map_cut_to_source"
Cohesion: 0.18
Nodes (9): boxes_from_cuts(), map_bounds_to_source(), map_cut_to_source(), _map_line(), Map one analysis-space cut/side to source-space, bilinear anchor, clamped., Map an analysis-space box to source space (bilinear anchor, clamped)., Derive a source-space box from already-mapped cut lines (seam-free)., Bilinear-anchor a single coordinate: round, then clamp to [0, src]. (+1 more)

### Community 169 - "Session 26-27 — M7 panel-ui + M8 integrated editor (slices 1–4)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 26-27 — M7 panel-ui + M8 integrated editor (slices 1–4), Verify, WHAT

### Community 170 - "SPEC — M7 module 5: `panel-correction`"
Cohesion: 0.22
Nodes (8): Boundaries, Commands, Functions, Objective, Sequence semantics (important — module-3 contract stays intact), SPEC — M7 module 5: `panel-correction`, Testing (TDD), Wire precedence

### Community 171 - "beats.ts"
Cohesion: 0.17
Nodes (11): labelFor(), PAUSE_BEAT_THRESHOLD, resegmentBeats(), segmentBeats(), splitSegment(), stableBeatId(), wordsInPart(), TranscriptSegment (+3 more)

### Community 172 - "Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix, Verification, WHAT, WHY

### Community 173 - "matching.py"
Cohesion: 0.12
Nodes (13): MultilingualClipEmbedder, Composed multilingual CLIP: images from a base ClipEmbedder, text from the…, EmbedFailure, _get_matcher(), match(), _parse_beats(), Exception, Request (+5 more)

### Community 174 - "detect.py"
Cohesion: 0.20
Nodes (14): _analysis_array(), _bg_estimate(), _bordered_by_content(), find_gutter_bands(), GutterBand, Image, ndarray, M7 module 2: hybrid panel detection (OpenCV + numpy). Operates on a downscaled… (+6 more)

### Community 175 - "Plan — M7 module 5: panel-correction (pure list ops)"
Cohesion: 0.33
Nodes (5): Plan — M7 module 5: panel-correction (pure list ops), Slice 1 — order-preserving normalization (order.py), Slice 2 — structural edits (correct.py I), Slice 3 — bounds + add + reorder + redetect (correct.py II), Slice 4 — export sequencing + docs

### Community 176 - "analysis_scale"
Cohesion: 0.39
Nodes (3): analysis_scale(), Downscale factor for the detection analysis image. Returns `(ana_w, ana_h,…, TestAnalysisScale

### Community 177 - "SPEC — M7 module 7 `panel-ui` (Frontend Manhwa Correction View)"
Cohesion: 0.18
Nodes (10): API contract (back-front ground truth), Capability map (module unit), Definition of done, Objective, Out of scope, Placement & layout, Scope, SPEC — M7 module 7 `panel-ui` (Frontend Manhwa Correction View) (+2 more)

### Community 178 - "Slices"
Cohesion: 0.20
Nodes (9): plan — M7 module 7 `panel-ui`, Slice 1 — services/manhwa.ts (RED→GREEN), Slice 2 — store/manhwaStore.ts (RED→GREEN), Slice 3 — ManhwaPanel (review) (jsdom), Slice 4 — ManhwaPanel (actions), Slice 5 — wiring + CSS, Slice 6 — docs/regression, Slices (+1 more)

### Community 179 - "Session 29 — M9 module 2 `runtime-optimization` (5 slices)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 29 — M9 module 2 `runtime-optimization` (5 slices), Verify, WHAT

### Community 180 - "AI Video Studio — Architecture"
Cohesion: 0.20
Nodes (10): 1. Repository Layout, 2. Design Principles, 3. Core Technology, 4. Voice-over → Images Processing Graph, 5. Manhwa / Webtoon Extraction Processing Graph, 6. Caption Processing Graph, 7. System Boundaries, 8. Design Decisions (WHY) (+2 more)

### Community 181 - "FakeBatchTokenizer"
Cohesion: 0.28
Nodes (6): WordPiece batch tokenization for the multilingual text tower. ``sentence-…, tokenize_multilingual(), FakeBatchTokenizer, test_tokenize_multilingual_batches_rows(), test_tokenize_multilingual_pads_and_masks(), test_tokenize_multilingual_truncates_long_input()

### Community 182 - "Session 30 — M9 module 3 `memory-tuning` (5 slices)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 30 — M9 module 3 `memory-tuning` (5 slices), Verify, WHAT

### Community 183 - "build_panels"
Cohesion: 0.29
Nodes (7): build_panels(), Cut, merge_slivers(), Drop lower-confidence cuts that create sub-MIN_PANEL_H interior panels., Convert analysis-space cuts into seam-free source-space incident panels. Cut…, TestBuildPanels, TestSliverMerge

### Community 184 - "Implementation Plan: Remaining Features → Regression Audit → Polish"
Cohesion: 0.12
Nodes (15): Checkpoint: Release Ready, Checkpoint: Roadmap Complete, Implementation Plan: Remaining Features → Regression Audit → Polish, M10 — Release Hardening, Overview, Phase 1: Remaining Roadmap Features, Phase 2: Release Hardening (M10), Phase 3: Regression Audit (+7 more)

### Community 185 - "M9 — Hardware Validation Measurement Log (D-036)"
Cohesion: 0.25
Nodes (7): Checklist, How to reproduce any row, Logged machines, M9 — Hardware Validation Measurement Log (D-036), Memory peak — how to snapshot, Per-machine validation log, Reference machine results — dev Mac

### Community 186 - "Session 31 — M9 module 4 `baseline-validation` (4 slices)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 31 — M9 module 4 `baseline-validation` (4 slices), Verify, WHAT

### Community 187 - "TranscriptPanel.tsx"
Cohesion: 0.14
Nodes (15): attachPauses(), buildNodes(), confidenceLabel(), lowConfidence(), Node, TranscriptPanel(), TranscriptPause, TranscriptWord (+7 more)

### Community 188 - "AI Video Studio — Session Log"
Cohesion: 0.25
Nodes (8): AI Video Studio — Session Log, HOW, Limitations, Next step, Session 33 — Beta impression (D-038), Template, Verify, WHAT

### Community 189 - "LeftWorkspace.tsx"
Cohesion: 0.20
Nodes (6): ExtractedPage, ExtractorPanel(), unmount(), LeftWorkspace(), LeftWorkspaceProps, unmount()

### Community 190 - "AI VIDEO STUDIO — MASTER BUILD SPEC V2"
Cohesion: 0.14
Nodes (13): Agent stack, AI VIDEO STUDIO — MASTER BUILD SPEC V2, BIG PICKLE OPERATING WORKFLOW, Canonical layout, Captions, FRONTEND REFERENCE — MANDATORY EXACT DESIGN, Local-first, Locked user decisions (+5 more)

### Community 191 - "V2 Frontend Restructuring — Plan"
Cohesion: 0.14
Nodes (13): Capability Map, Module 1: v2-topbar, Module 2: v2-left-nav, Module 3: v2-right-panels, Module 4: v2-bottom-assets, Module 5: v2-extractor, Tasks, Tasks (+5 more)

### Community 192 - "Session 32 — M9 reframe: validation machine-agnostic (D-037)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 32 — M9 reframe: validation machine-agnostic (D-037), Verify, WHAT

### Community 193 - "AGENTS.md — AI Video Studio"
Cohesion: 0.17
Nodes (11): AGENTS.md — AI Video Studio, Captions/templates/fonts, Definition of done, Editor, Hardware, HIGHEST PRIORITY: EXACT FRONTEND, Mandatory workflows, Manhwa (+3 more)

### Community 194 - "vitest"
Cohesion: 0.06
Nodes (29): App(), AIMatchPanel(), AIMatchTab, unmount(), AssetCategory, AssetGrid(), sortRecent(), unmount() (+21 more)

### Community 195 - "Preset"
Cohesion: 0.25
Nodes (11): build_registry_entries(), load_registry(), merge_preset_layers(), Preset, Path, Load presets from the registry file; fall back to built-ins on any issue., Built-ins first (canonical ids), then custom records — custom wins on id…, save_registry() (+3 more)

### Community 196 - "validate_layout"
Cohesion: 0.31
Nodes (5): _boxes_overlap(), Check a layout for the invariants every consumer cares about. Raises…, Positive-area intersection of two axis-aligned boxes (touching = no)., validate_layout(), TestValidateLayout

### Community 197 - "Session 39 — Polish Phase: Accessibility, Responsive, Error/Loading, Docs"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Purpose (WHY), Session 39 — Polish Phase: Accessibility, Responsive, Error/Loading, Docs, Verify, WHAT

### Community 198 - "preprocess_image"
Cohesion: 0.20
Nodes (9): cosine_similarity(), preprocess_image(), Image, test_cosine_similarity_identical_is_one(), test_cosine_similarity_orthogonal_is_zero(), test_preprocess_center_crops_to_square(), test_preprocess_image_returns_normalized_chw(), test_preprocess_normalizes_pixel_range() (+1 more)

### Community 200 - "NavRail.test.tsx"
Cohesion: 0.36
Nodes (5): NAV_ITEMS, NavItem, NavRail(), NavRailProps, unmount()

### Community 202 - "Session 34 — V2 Frontend: Topbar + Nav Rail + Left Workspace"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 34 — V2 Frontend: Topbar + Nav Rail + Left Workspace, Verify, WHAT

### Community 203 - "Session 35 — V2 Frontend: Right Panels (AI Match + Auto Captions)"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Purpose (WHY), Session 35 — V2 Frontend: Right Panels (AI Match + Auto Captions), Verify, WHAT

### Community 205 - "preset_to_export_dict"
Cohesion: 0.50
Nodes (4): preset_to_export_dict(), test_export_has_envelope(), test_export_round_trips_through_import(), test_import_round_trips_animation()

### Community 206 - "Session 36 — V2 Frontend: Bottom Assets Panel"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Purpose (WHY), Session 36 — V2 Frontend: Bottom Assets Panel, Verify, WHAT

### Community 207 - "TemplateEditorPanel.test.tsx"
Cohesion: 0.25
Nodes (3): builtin, custom, unmount()

### Community 208 - "Session 38 — Remaining Features + Regression Audit + Polish Prep"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Purpose (WHY), Session 38 — Remaining Features + Regression Audit + Polish Prep, Verify, WHAT

## Knowledge Gaps
- **1455 isolated node(s):** `$schema`, `plugin`, `lava-backend`, `$schema`, `plugins` (+1450 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1886 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AI Video Studio — Session Log` connect `AI Video Studio — Session Log` to `Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)`, `Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)`, `Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done)`, `Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md`, `Session 25 — M7 module 6 `manhwa-api` (backend complete)`, `Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence`, `Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed`, `README.md`, `Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation`, `Session 23 — M7 module 4 `panel-export` (full-res crops + manifest)`, `Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices)`, `Session 26-27 — M7 panel-ui + M8 integrated editor (slices 1–4)`, `Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix`, `Session 29 — M9 module 2 `runtime-optimization` (5 slices)`, `Session 30 — M9 module 3 `memory-tuning` (5 slices)`, `Session 31 — M9 module 4 `baseline-validation` (4 slices)`, `Session 32 — M9 reframe: validation machine-agnostic (D-037)`, `Session 39 — Polish Phase: Accessibility, Responsive, Error/Loading, Docs`, `Session 2026-09-12 — Session 2: continuity system + commit discipline`, `Session 2026-09-12 — Session 3: media sidecar (real rendering)`, `Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)`, `Session 2026-09-12 — Session 5: M2 voice analysis (first slice)`, `Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)`, `Session 34 — V2 Frontend: Topbar + Nav Rail + Left Workspace`, `Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)`, `Session 35 — V2 Frontend: Right Panels (AI Match + Auto Captions)`, `Session 36 — V2 Frontend: Bottom Assets Panel`, `Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override`, `Session 38 — Remaining Features + Regression Audit + Polish Prep`, `Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)`, `Session 2026-09-12 — Session 9: M4 module 1 — transitions-core`, `Session 2026-09-12 — Session 10: M4 module 2 — transitions-render`, `Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui`, `Session 13 — M5 caption engine complete (all four modules)`, `Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)`, `Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)`, `Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)`, `Session 37 — V2 Frontend: Presentation/Image Extractor`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `ApiError` connect `main.py` to `matching.py`, `media.py`, `test_runtime.py`, `RenderSettings`, `api.py`, `build_transition_graph`, `transcribe.py`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `ManhwaError` connect `Panel` to `detect_strip`, `.load`, `validate_layout`, `export.py`, `detect.py`, `panels.py`, `api.py`, `order.py`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `ApiError` (e.g. with `api_error_handler()` and `apply_correction()`) actually correct?**
  _`ApiError` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `get_config()` (e.g. with `.test_manhwa_dir_under_cache()` and `.test_strip_dir_validates_and_resolves()`) actually correct?**
  _`get_config()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugin`, `lava-backend` to the rest of the system?**
  _1455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.048625792811839326 - nodes in this community are weakly interconnected._