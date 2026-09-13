# Graph Report - Lava  (2026-09-13)

## Corpus Check
- 189 files · ~143,066 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2319 nodes · 3851 edges · 144 communities (132 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b3477535`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- editorStore.ts
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
- validate_preset
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
- services/fonts.ts
- test_clip.py
- .prettierrc.json
- Spec: M3 — Semantic image matching (first slice)
- Session 2026-09-12 — Session 2: continuity system + commit discipline
- Session 2026-09-12 — Session 3: media sidecar (real rendering)
- Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)
- Session 2026-09-12 — Session 5: M2 voice analysis (first slice)
- Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)
- build_transition_graph
- Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)
- Spec: Timing fit + manual timing override (M3 remainder, slice-set B)
- Implementation Plan: M3 remainder — timing fit + manual timing override
- Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override
- Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass)
- Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)
- Implementation Plan: M3 final — multilingual image matching
- matching.py
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
- resolve_render_font_licenses
- Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui
- WHAT
- main.py
- Spec: M5 Module 3 — caption-render
- Session 13 — M5 caption engine complete (all four modules)
- Capability Map: M5 Caption Engine
- clip.py
- types.ts
- Spec: M6 — Template/Font System
- ffmpeg.ts
- Plan: M5 Module 1 — caption-core
- test_fonts.py
- App.tsx
- editor/presets.ts
- Implementation Plan: preset-registry (M6 module 2)
- Implementation Plan: preset-import (M6 module 3)
- Task list
- Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)
- config.py
- Spec: font-system (M6 module 1)
- Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)
- Spec: preset-registry (M6 module 2)
- import_preset_payload
- Spec: preset-import (M6 module 3)
- Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)
- TranscriptPanel.tsx
- SPEC — M6 module 5: `animated-captions`
- Implementation Plan: template-editor (M6 module 4)
- match.ts
- FakeBatchTokenizer
- Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)
- FontPanel.tsx
- Spec: template-editor (M6 module 4)
- Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)
- media.py
- FontPanel.test.tsx
- Plan — M6 module 5: animated-captions
- _pick_by_names
- importer.ts
- RenderSettings
- test_render_license.py
- vitest
- Preset
- SPEC — M6 module 6: `license-tracking` (closes the M6 license-metadata row)
- AI Video Studio — Session Log
- Plan — M6 module 6 (final): license-tracking

## God Nodes (most connected - your core abstractions)
1. `useEditorStore` - 57 edges
2. `ApiError` - 31 edges
3. `EditorActions` - 31 edges
4. `vitest` - 29 edges
5. `parse_captions()` - 24 edges
6. `RenderSettings` - 24 edges
7. `build_transition_graph()` - 23 edges
8. `render()` - 23 edges
9. `import_preset_payload()` - 23 edges
10. `AI Video Studio — Master Project Documentation` - 23 edges

## Surprising Connections (you probably didn't know these)
- `render_endpoint()` --uses--> `CaptionError`  [INFERRED]
  backend/src/lava_backend/main.py → backend/src/lava_backend/captions.py
- `test_render_captions_with_fontsdir()` --uses--> `CaptionStyleSpec`  [INFERRED]
  backend/tests/test_fonts.py → backend/src/lava_backend/captions.py
- `resolve_render_font_licenses()` --uses--> `CaptionItemSpec`  [INFERRED]
  backend/src/lava_backend/licensing.py → backend/src/lava_backend/captions.py
- `render()` --uses--> `CaptionItemSpec`  [INFERRED]
  backend/src/lava_backend/media.py → backend/src/lava_backend/captions.py
- `_write_ass_file()` --uses--> `CaptionItemSpec`  [INFERRED]
  backend/src/lava_backend/media.py → backend/src/lava_backend/captions.py

## Import Cycles
- None detected.

## Communities (144 total, 10 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (34): dependencies, react, react-dom, zundo, zustand, devDependencies, jsdom, oxlint (+26 more)

### Community 1 - "editorStore.ts"
Cohesion: 0.16
Nodes (22): BetweenTransition, clampTransitionDuration(), ClipLike, DEFAULT_DURATIONS, defaultDuration(), EvaluateOptions, evaluateTransitions(), makeBetweenTransition() (+14 more)

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
Cohesion: 0.23
Nodes (15): InspectorPanel(), addClip(), addClips(), ClipInput, createClip(), duplicateClip(), moveClip(), newId() (+7 more)

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
Cohesion: 0.05
Nodes (38): 1. Repository Layout, 2. Design Principles, 3. Core Technology, 4. Voice-over → Images Processing Graph, 5. Manhwa / Webtoon Extraction Processing Graph, 6. Caption Processing Graph, 7. System Boundaries, 8. Design Decisions (WHY) (+30 more)

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

### Community 52 - "validate_preset"
Cohesion: 0.17
Nodes (15): PresetError, ValueError, Caption-preset registry (M6 module 2). A preset is a shipped-or-user caption…, Raised when a preset record is malformed., _require_bool(), _require_number(), _require_string(), validate_preset() (+7 more)

### Community 53 - "test_render.py"
Cohesion: 0.11
Nodes (30): Lava Studio media sidecar package., make_clip(), test_probe_reports_media_metadata(), make_image(), Path, Real-ffmpeg smoke: the burned caption visibly changes a bottom-strip frame., render_multipart(), render_multipart_captions() (+22 more)

### Community 54 - "Lava Studio — Backend (media sidecar)"
Cohesion: 0.33
Nodes (5): API, Lava Studio — Backend (media sidecar), Layout, Run, Tests

### Community 58 - "Task list"
Cohesion: 0.09
Nodes (22): M1 — Media foundation (closed, pushed), M2 — Voice analysis (closed, pushed @ `e864f18`), M3 — Semantic image matching (closed, pushed @ `79b2fb2`; timing set closed @ `ca1dd23`), M4 open, M4 — Transition/animation engine (closed, pushed @ `0234747`), M5 — Caption engine (closed, pushed), M6 — Module 1: font-system (SPEC-font-system.md, tasks/plan-font.md), M6 — Module 2: preset-registry (SPEC-preset-registry.md, tasks/plan-presets.md) (+14 more)

### Community 59 - "detect_pauses"
Cohesion: 0.09
Nodes (20): confidence_from_logprob(), detect_pauses(), Pause, Word, Request, UploadFile, serialize(), serialize_segment() (+12 more)

### Community 60 - "Task List"
Cohesion: 0.14
Nodes (13): Architecture Decisions, Checkpoint: 1–2, Checkpoint: 2, Checkpoint: full, Implementation Plan: transitions-ui (M4 module 3), Open Questions, Overview, Phase 1: Store (slice 1) (+5 more)

### Community 61 - "useEditorStore"
Cohesion: 0.07
Nodes (19): ClipBlock(), DragMode, PX_PER_SECOND, TRACK_HEIGHT, TimelinePanel(), TrackRow(), chipWidthPx(), imageA (+11 more)

### Community 62 - "parse_captions"
Cohesion: 0.08
Nodes (32): Any, _animate_line(), ass_color(), ass_time(), build_ass_document(), build_dialogue_line(), build_style_line(), CaptionError (+24 more)

### Community 63 - "Matcher"
Cohesion: 0.18
Nodes (10): Beat, Matcher, Repetition-aware greedy assignment of CLIP embeddings to narration beats.…, FakeEmbedder, make_image(), make_route_client(), png_bytes(), post() (+2 more)

### Community 64 - "Task List"
Cohesion: 0.14
Nodes (13): Architecture Decisions, Checkpoint: 1–2, Checkpoint: full, Implementation Plan: image-motion (M4 module 4), Open Questions, Overview, Phase 1: Backend motion filters (slice 1), Phase 2: API contract (slice 2) (+5 more)

### Community 65 - "matchingStore.ts"
Cohesion: 0.20
Nodes (15): MatchPanel(), segmentBeats(), splitSegment(), hasTimingOverride(), MIN_AUTO_DURATION, pacedEnd(), TAIL_HOLD, TimedBeat (+7 more)

### Community 66 - "Spec: Voice Analysis (M2 first slice)"
Cohesion: 0.18
Nodes (11): Boundaries, Capability Map, Code Style, Commands, Objective, Open Questions, Project Structure, Spec: Voice Analysis (M2 first slice) (+3 more)

### Community 67 - "test_preset_import.py"
Cohesion: 0.09
Nodes (8): _envelope(), import_client(), fixture, test_import_forces_custom_category(), test_import_valid_envelope(), test_post_creates_custom_preset(), test_post_forces_custom_category(), test_put_updates_custom_preset_in_place()

### Community 68 - "services/fonts.ts"
Cohesion: 0.22
Nodes (15): FontLicense, FontMetadata, parseFontMetadata(), parseLicense(), registered, resetFontFaceRegistrations(), deleteFont(), failHttp() (+7 more)

### Community 69 - "test_clip.py"
Cohesion: 0.15
Nodes (16): Encoding, FakeTokenizer, make_embedder(), make_multilingual_embedder(), stub_feed(), StubSession, test_clip_embedder_embeds_image_batch(), test_clip_embedder_embeds_text_batch() (+8 more)

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
Cohesion: 0.19
Nodes (25): BetweenSpec, build_transition_graph(), _invalid(), EdgeSpec, _filter_complex(), Return (filter_complex, total_duration) for a clip fold with transitions. Pure…, RenderClip, xfade_name() (+17 more)

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

### Community 85 - "matching.py"
Cohesion: 0.12
Nodes (16): cosine_similarity(), preprocess_image(), EmbedFailure, match(), _parse_beats(), Exception, Request, UploadFile (+8 more)

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
Cohesion: 0.12
Nodes (28): CaptionItem, isAsset(), isClip(), isRecord(), isTrack(), isTranscript(), parseCaptions(), parseProjectJson() (+20 more)

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

### Community 97 - "resolve_render_font_licenses"
Cohesion: 0.15
Nodes (18): _match_registry(), Path, Render-time font license resolution. Closes the M6 license-metadata row: fonts…, A registry-backed font the renderer is going to burn in., Resolve caption styles against the fonts registry. Returns ``(used_fonts,…, Human-readable, actionable message for a resolver violation., _registry_violation(), resolve_render_font_licenses() (+10 more)

### Community 98 - "Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui, Verify, WHAT, WHY

### Community 99 - "WHAT"
Cohesion: 0.18
Nodes (10): Boundaries / non-goals, Edit ops (pure), Generation — `segmentCaptions(transcript, options?)`, Model (`frontend/src/editor/captions.ts`), Project round-trip (`project.ts`), Spec: M5 Module 1 — caption-core, Store (`editorStore`), Verify (+2 more)

### Community 100 - "main.py"
Cohesion: 0.13
Nodes (38): get_config(), error_response(), _all_presets(), api_error_handler(), _builtin_by_id(), ClipMetadata, create_preset(), delete_font() (+30 more)

### Community 101 - "Spec: M5 Module 3 — caption-render"
Cohesion: 0.22
Nodes (8): ASS generation (pure, `captions.py`), Boundaries / non-goals, Errors, Spec: M5 Module 3 — caption-render, Verify, WHAT, WHY, Wire shape (per item)

### Community 102 - "Session 13 — M5 caption engine complete (all four modules)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 13 — M5 caption engine complete (all four modules), Verify, WHAT

### Community 103 - "Capability Map: M5 Caption Engine"
Cohesion: 0.25
Nodes (7): Boundaries / decisions, Build order, Capability Map: M5 Caption Engine, Gate, Modules, Objective, What is NOT in M5 (explicit deferrals)

### Community 104 - "clip.py"
Cohesion: 0.15
Nodes (12): ClipEmbedder, l2_normalize(), MultilingualClipEmbedder, _output_names(), _pick(), CLIP ViT-B/32 embeddings through a fused ONNX session (Xenova export). Model…, Composed multilingual CLIP: images from a base ClipEmbedder, text from the…, softmax() (+4 more)

### Community 105 - "types.ts"
Cohesion: 0.11
Nodes (19): MOTION_TYPES, MotionPanel(), applyClips(), clipWith(), imageAsset, unmount(), videoAsset, labelFor() (+11 more)

### Community 106 - "Spec: M6 — Template/Font System"
Cohesion: 0.09
Nodes (22): Animated Captions, Boundaries, Build Order, Code Style, Commands, Font System, Module 1: font-system, Module 2: preset-registry (+14 more)

### Community 107 - "ffmpeg.ts"
Cohesion: 0.10
Nodes (13): DEFAULT_BASE_URL, detectProvider(), FFmpegProvider, FontRenderInfo, HttpFFmpegProvider, RenderCaption, RenderCaptionStyle, RenderInput (+5 more)

### Community 108 - "Plan: M5 Module 1 — caption-core"
Cohesion: 0.50
Nodes (3): Plan: M5 Module 1 — caption-core, Risks, Slices

### Community 109 - "test_fonts.py"
Cohesion: 0.08
Nodes (51): _candidate_names(), clean_family_name(), _decode_name(), extract_family_name(), font_license_from_payload(), FontError, has_font_signature(), is_allowed_font_name() (+43 more)

### Community 110 - "App.tsx"
Cohesion: 0.19
Nodes (13): App(), captionsRenderPayload(), transcript, unmount(), voice, formatTime(), PreviewPanel(), clipsAtTime() (+5 more)

### Community 111 - "editor/presets.ts"
Cohesion: 0.06
Nodes (52): CaptionPanel(), captionToWire(), PresetPanel(), jsonResponse(), presets, smartFetchMock(), unmount(), FLAGS (+44 more)

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

### Community 120 - "import_preset_payload"
Cohesion: 0.13
Nodes (22): import_preset_payload(), _payload_to_preset_dict(), preset_to_export_dict(), PresetImportError, ValueError, Preset import/export (M6 module 3). Import accepts the `lava-preset` envelope…, Raised when an imported preset fails validation., Validate + normalise an imported preset payload. Forces category to Custom and… (+14 more)

### Community 121 - "Spec: preset-import (M6 module 3)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, ASSUMPTIONS I'M MAKING, Files, Objective, Open questions, Slices, Spec: preset-import (M6 module 3)

### Community 122 - "Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes), Verify, WHAT

### Community 123 - "TranscriptPanel.tsx"
Cohesion: 0.17
Nodes (14): attachPauses(), buildNodes(), confidenceLabel(), lowConfidence(), Node, TranscriptPanel(), parseTranscript(), transcribeAsset() (+6 more)

### Community 124 - "SPEC — M6 module 5: `animated-captions`"
Cohesion: 0.18
Nodes (10): Acceptance criteria, Assumptions, Definition of done (this module), Goal, In scope, Out of scope — deferred to M8 preview overlay, Recipes (semantics; exact strings derive from RED tests in slice 1), Scope (+2 more)

### Community 125 - "Implementation Plan: template-editor (M6 module 4)"
Cohesion: 0.15
Nodes (12): Architecture decisions, Checkpoints, Implementation Plan: template-editor (M6 module 4), Open questions, Overview, Risks and mitigations, Task 1 — pure editor model (slice 1), Task 2 — API overwrite (slice 2) (+4 more)

### Community 126 - "match.ts"
Cohesion: 0.18
Nodes (11): Beat, MatchAlternative, MatchBeatResult, MatchError, MatchImageInput, matchImages(), MatchRequest, MatchResponse (+3 more)

### Community 127 - "FakeBatchTokenizer"
Cohesion: 0.28
Nodes (6): WordPiece batch tokenization for the multilingual text tower. ``sentence-…, tokenize_multilingual(), FakeBatchTokenizer, test_tokenize_multilingual_batches_rows(), test_tokenize_multilingual_pads_and_masks(), test_tokenize_multilingual_truncates_long_input()

### Community 128 - "Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix), Verify, WHAT

### Community 129 - "FontPanel.tsx"
Cohesion: 0.31
Nodes (6): FONT_EXTENSIONS, FontPanel(), LICENSE_TYPES, ensureFontFace(), backendBaseUrl(), fontPreviewUrl()

### Community 130 - "Spec: template-editor (M6 module 4)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, ASSUMPTIONS I'M MAKING, Files, Objective, Open questions, Slices, Spec: template-editor (M6 module 4)

### Community 131 - "Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract), Verify, WHAT

### Community 132 - "media.py"
Cohesion: 0.20
Nodes (19): Config, ApiError, Exception, Consistent error semantics for the sidecar API., _ass_filter_string(), check_binary(), _float(), _int() (+11 more)

### Community 134 - "Plan — M6 module 5: animated-captions"
Cohesion: 0.29
Nodes (6): Plan — M6 module 5: animated-captions, Task 1 (slice 1) — Backend ASS animation, Task 2 (slice 2) — Backend preset schema, Task 3 (slice 3) — Frontend model + wire, Task 4 (slice 4) — Editor + panel, Task 5 (slice 5) — Docs + graphify + regression + push

### Community 135 - "_pick_by_names"
Cohesion: 0.29
Nodes (5): _pick_by_names(), Return the output matching one of ``names`` (case-insensitive, exact). Falls…, MultilingualStubSession, test_pick_by_names_falls_back_to_last(), test_pick_by_names_returns_preferred_output()

### Community 136 - "importer.ts"
Cohesion: 0.13
Nodes (15): kindOf(), MediaPanel(), Asset, AssetKind, AssetMeta, assetFiles, importFiles(), kindOf() (+7 more)

### Community 137 - "RenderSettings"
Cohesion: 0.29
Nodes (18): _motion_filters(), MotionSpec, _prep_chain(), Zoom/pan FX via zoompan (per-frame z/x/y), scaled for source headroom., RenderSettings, _validate_motion(), clip(), parametrize (+10 more)

### Community 138 - "test_render_license.py"
Cohesion: 0.28
Nodes (14): font_entry(), license_client(), make_image(), fixture, Path, Render-time font license guard + render font manifest (module 6, slice 2)., register_fonts(), render_captions() (+6 more)

### Community 139 - "vitest"
Cohesion: 0.15
Nodes (8): imageA, imageB, unmount(), EdgeTransition, presets, imageA, imageB, vitest

### Community 140 - "Preset"
Cohesion: 0.25
Nodes (11): build_registry_entries(), load_registry(), merge_preset_layers(), Preset, Path, Load presets from the registry file; fall back to built-ins on any issue., Built-ins first (canonical ids), then custom records — custom wins on id…, save_registry() (+3 more)

### Community 141 - "SPEC — M6 module 6: `license-tracking` (closes the M6 license-metadata row)"
Cohesion: 0.20
Nodes (9): Acceptance criteria, Assumptions, Definition of done (this module), Goal, In scope, Out of scope (documented, not silent), Scope, Slices (+1 more)

### Community 142 - "AI Video Studio — Session Log"
Cohesion: 0.22
Nodes (9): AI Video Studio — Session Log, Decisions, HOW, Limitations, Next step, Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done), Template, Verify (+1 more)

### Community 143 - "Plan — M6 module 6 (final): license-tracking"
Cohesion: 0.33
Nodes (5): Plan — M6 module 6 (final): license-tracking, Task 1 (slice 1) — Backend pure resolver, Task 2 (slice 2) — Render integration, Task 3 (slice 3) — Frontend parity + badge, Task 4 (slice 4) — Docs + graphify + regression + push

## Knowledge Gaps
- **1102 isolated node(s):** `$schema`, `plugin`, `lava-backend`, `$schema`, `plugins` (+1097 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1353 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `package.json`, `matchingStore.ts`, `editorStore.ts`, `match.ts`, `services/fonts.ts`, `FontPanel.test.tsx`, `ops.ts`, `types.ts`, `importer.ts`, `ffmpeg.ts`, `App.tsx`, `editor/presets.ts`, `project.ts`, `TranscriptPanel.tsx`, `useEditorStore`, `captions.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `AI Video Studio — Session Log` connect `AI Video Studio — Session Log` to `Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)`, `Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)`, `README.md`, `Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation`, `Session 2026-09-12 — Session 2: continuity system + commit discipline`, `Session 2026-09-12 — Session 3: media sidecar (real rendering)`, `Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)`, `Session 2026-09-12 — Session 5: M2 voice analysis (first slice)`, `Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)`, `Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)`, `Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override`, `Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)`, `Session 2026-09-12 — Session 9: M4 module 1 — transitions-core`, `Session 2026-09-12 — Session 10: M4 module 2 — transitions-render`, `Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui`, `Session 13 — M5 caption engine complete (all four modules)`, `Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)`, `Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)`, `Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `useEditorStore` connect `useEditorStore` to `matchingStore.ts`, `editorStore.ts`, `ops.ts`, `importer.ts`, `types.ts`, `vitest`, `App.tsx`, `editor/presets.ts`, `project.ts`, `TranscriptPanel.tsx`, `captions.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `ApiError` (e.g. with `api_error_handler()` and `match()`) actually correct?**
  _`ApiError` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugin`, `lava-backend` to the rest of the system?**
  _1102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `localDirs` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._