# Graph Report - docs  (2026-09-14)

## Corpus Check
- 38 files · ~56,489 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 678 nodes · 649 edges · 61 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `17e00632`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AI Video Studio — Features
- AI Video Studio — Session Log
- AI Video Studio — Decision Log
- Spec: M6 — Template/Font System
- AI Video Studio — Product Specification
- Spec: M9 Module 1 — proxy-preview
- Spec: `transitions-core` — transition model, heuristics, persistence
- AI Video Studio — Roadmap
- SPEC — M7 module 1: `panel-model`
- Spec: Timing fit + manual timing override (M3 remainder, slice-set B)
- AI Video Studio — Architecture
- Spec: M3 — Semantic image matching (first slice)
- SPEC — M7 module 2: `panel-detection`
- Spec: transitions-ui (M4 module 3)
- SPEC — M6 module 5: `animated-captions`
- WHAT
- Spec: font-system (M6 module 1)
- Spec: image-motion (M4 module 4)
- SPEC — M7 module 7 `panel-ui` (Frontend Manhwa Correction View)
- Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass)
- Spec: `transitions-render` — transitions in the FFmpeg render pipeline
- SPEC — M6 module 6: `license-tracking` (closes the M6 license-metadata row)
- SPEC — M7 module 6: `manhwa-api`
- Spec: M5 Module 3 — caption-render
- SPEC — M7 module 5: `panel-correction`
- SPEC — M7 module 3: `panel-order`
- M9 — Hardware Validation Measurement Log (D-036)
- Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation
- Session 2026-09-12 — Session 2: continuity system + commit discipline
- Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)
- Session 2026-09-12 — Session 5: M2 voice analysis (first slice)
- Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)
- Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override
- Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)
- Session 2026-09-12 — Session 9: M4 module 1 — transitions-core
- Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui
- Session 13 — M5 caption engine complete (all four modules)
- Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)
- Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)
- Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence
- Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed
- Session 23 — M7 module 4 `panel-export` (full-res crops + manifest)
- Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix
- Capability Map: M5 Caption Engine
- Capability Map: M7 Manhwa / Webtoon Extractor
- Capability Map: M9 Hardware Validation
- SPEC — M7 module 4: `panel-export`
- Spec: preset-import (M6 module 3)
- Spec: preset-registry (M6 module 2)
- Spec: template-editor (M6 module 4)
- Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done)
- Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices)
- Session 29 — M9 module 2 `runtime-optimization` (5 slices)
- Session 31 — M9 module 4 `baseline-validation` (4 slices)
- Session 32 — M9 reframe: validation machine-agnostic (D-037)
- Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)
- Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)
- Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)
- Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md
- Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)
- Capability Map: M4 — Transition / Animation Engine

## God Nodes (most connected - your core abstractions)
1. `AI Video Studio — Session Log` - 33 edges
2. `AI Video Studio — Decision Log` - 20 edges
3. `AI Video Studio — Product Specification` - 18 edges
4. `Index of decisions` - 15 edges
5. `AI Video Studio — Roadmap` - 13 edges
6. `Spec: `transitions-core` — transition model, heuristics, persistence` - 13 edges
7. `Spec: M6 — Template/Font System` - 12 edges
8. `SPEC — M7 module 1: `panel-model`` - 12 edges
9. `Spec: Timing fit + manual timing override (M3 remainder, slice-set B)` - 12 edges
10. `AI Video Studio — Features` - 11 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (61 total, 0 thin omitted)

### Community 0 - "AI Video Studio — Features"
Cohesion: 0.04
Nodes (41): 10. Hardware-Aware Operation, 1. Media Foundation, 2. Voice / Audio, 3. Semantic Image Matching, 4. Transitions / Animation, 5. Captions, 6. Templates / Styles / Fonts, 7. Manhwa / Webtoon Extractor (+33 more)

### Community 1 - "AI Video Studio — Session Log"
Cohesion: 0.05
Nodes (40): AI Video Studio — Session Log, Decisions, Decisions, Decisions, Decisions, Files, HOW, HOW (+32 more)

### Community 2 - "AI Video Studio — Decision Log"
Cohesion: 0.05
Nodes (39): AI Video Studio — Decision Log, D-001 — Web-first editor shell (Vite + React + TypeScript), D-002 — Zustand + Zundo for state and undo/redo, D-003 — Project-local FFmpeg binary, D-004 — FFmpeg provider abstraction, D-005 — Curated vendor skills; reference clones kept local, D-006 — Commit `graphify-out/`; code-only pass for now, D-007 — Written session log + decisions log for continuity (+31 more)

### Community 3 - "Spec: M6 — Template/Font System"
Cohesion: 0.09
Nodes (22): Animated Captions, Boundaries, Build Order, Code Style, Commands, Font System, Module 1: font-system, Module 2: preset-registry (+14 more)

### Community 4 - "AI Video Studio — Product Specification"
Cohesion: 0.10
Nodes (20): 10. Captions System, 11. Templates / Styles / Fonts, 12. Editor / Timeline, 13. AI Control Philosophy, 14. UI / UX Direction, 15. Runtime / Hardware Strategy, 16. Key Product Principle, 1. Mission (+12 more)

### Community 5 - "Spec: M9 Module 1 — proxy-preview"
Cohesion: 0.14
Nodes (13): API Contract, Assumptions, Backend (`media.py` + `main.py`), Boundaries, Frontend (`types.ts` + `importer.ts` + `services/proxy.ts` + `PreviewPanel.tsx`), GET /api/proxy/{proxyId}, Implementation Notes, Objective (+5 more)

### Community 6 - "Spec: `transitions-core` — transition model, heuristics, persistence"
Cohesion: 0.14
Nodes (13): Behaviour / acceptance, Boundaries, Code style, Commands, Data model, Objective, Persistence, Project structure / files (+5 more)

### Community 7 - "AI Video Studio — Roadmap"
Cohesion: 0.15
Nodes (13): AI Video Studio — Roadmap, Milestone 0 — Repository bootstrap, Milestone 10 — Release hardening, Milestone 1 — Media foundation, Milestone 2 — Voice analysis, Milestone 3 — Semantic image matching, Milestone 4 — Transition/animation engine, Milestone 5 — Caption engine (+5 more)

### Community 8 - "SPEC — M7 module 1: `panel-model`"
Cohesion: 0.15
Nodes (12): Asset naming, Boundaries, Commands, Coordinate mapping (analysis ↔ source), Data model, Objective, Open questions, Project structure (+4 more)

### Community 9 - "Spec: Timing fit + manual timing override (M3 remainder, slice-set B)"
Cohesion: 0.15
Nodes (12): Behaviour (acceptance criteria), Boundaries, Code style, Commands, Concepts, Implementation notes (post-slice audit), Objective, Open questions (+4 more)

### Community 10 - "AI Video Studio — Architecture"
Cohesion: 0.17
Nodes (10): 1. Repository Layout, 2. Design Principles, 3. Core Technology, 4. Voice-over → Images Processing Graph, 5. Manhwa / Webtoon Extraction Processing Graph, 6. Caption Processing Graph, 7. System Boundaries, 8. Design Decisions (WHY) (+2 more)

### Community 11 - "Spec: M3 — Semantic image matching (first slice)"
Cohesion: 0.17
Nodes (11): Boundaries, Capability map, Code style, Commands, Objective, Open questions, Project structure, Spec: M3 — Semantic image matching (first slice) (+3 more)

### Community 12 - "SPEC — M7 module 2: `panel-detection`"
Cohesion: 0.17
Nodes (11): Boundaries, Commands, Fixtures (deterministic, synthetic — TEST_PLAN §2), Function surface (`manhwa/detect.py`), Objective, Open questions, Pipeline, Signals & thresholds (module constants, not per-image tuning) (+3 more)

### Community 13 - "Spec: transitions-ui (M4 module 3)"
Cohesion: 0.17
Nodes (11): Boundaries, Code style, Commands, Objective, Open questions, Out of scope, Project structure (touched), Scope (+3 more)

### Community 14 - "SPEC — M6 module 5: `animated-captions`"
Cohesion: 0.18
Nodes (10): Acceptance criteria, Assumptions, Definition of done (this module), Goal, In scope, Out of scope — deferred to M8 preview overlay, Recipes (semantics; exact strings derive from RED tests in slice 1), Scope (+2 more)

### Community 15 - "WHAT"
Cohesion: 0.18
Nodes (10): Boundaries / non-goals, Edit ops (pure), Generation — `segmentCaptions(transcript, options?)`, Model (`frontend/src/editor/captions.ts`), Project round-trip (`project.ts`), Spec: M5 Module 1 — caption-core, Store (`editorStore`), Verify (+2 more)

### Community 16 - "Spec: font-system (M6 module 1)"
Cohesion: 0.18
Nodes (10): Boundaries, Code style, Commands, Objective, Open questions, Project structure (touched), Scope, Spec: font-system (M6 module 1) (+2 more)

### Community 17 - "Spec: image-motion (M4 module 4)"
Cohesion: 0.18
Nodes (10): Boundaries, Code style, Commands, Objective, Open questions, Project structure (touched), Scope, Spec: image-motion (M4 module 4) (+2 more)

### Community 18 - "SPEC — M7 module 7 `panel-ui` (Frontend Manhwa Correction View)"
Cohesion: 0.18
Nodes (10): API contract (back-front ground truth), Capability map (module unit), Definition of done, Objective, Out of scope, Placement & layout, Scope, SPEC — M7 module 7 `panel-ui` (Frontend Manhwa Correction View) (+2 more)

### Community 19 - "Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass)"
Cohesion: 0.18
Nodes (10): Behaviour / acceptance, Boundaries, Commands, Design, Key finding (validated on the downloaded model), Objective, Spec: Multilingual image matching (Urdu/Roman-Urdu quality pass), Structure (+2 more)

### Community 20 - "Spec: `transitions-render` — transitions in the FFmpeg render pipeline"
Cohesion: 0.18
Nodes (10): Behaviour / acceptance, Boundaries, Code style, Commands, Data contract (backend), Objective, Spec: `transitions-render` — transitions in the FFmpeg render pipeline, Structure / files (+2 more)

### Community 21 - "SPEC — M6 module 6: `license-tracking` (closes the M6 license-metadata row)"
Cohesion: 0.20
Nodes (9): Acceptance criteria, Assumptions, Definition of done (this module), Goal, In scope, Out of scope (documented, not silent), Scope, Slices (+1 more)

### Community 22 - "SPEC — M7 module 6: `manhwa-api`"
Cohesion: 0.20
Nodes (9): Boundaries, Commands, Correction ops (PATCH `/panels`), Objective, Routes (mounted at `/api/manhwa`), SPEC — M7 module 6: `manhwa-api`, Storage helpers (`manhwa/api.py`), Testing (TDD, isolated in tmp dirs) (+1 more)

### Community 23 - "Spec: M5 Module 3 — caption-render"
Cohesion: 0.22
Nodes (8): ASS generation (pure, `captions.py`), Boundaries / non-goals, Errors, Spec: M5 Module 3 — caption-render, Verify, WHAT, WHY, Wire shape (per item)

### Community 24 - "SPEC — M7 module 5: `panel-correction`"
Cohesion: 0.22
Nodes (8): Boundaries, Commands, Functions, Objective, Sequence semantics (important — module-3 contract stays intact), SPEC — M7 module 5: `panel-correction`, Testing (TDD), Wire precedence

### Community 25 - "SPEC — M7 module 3: `panel-order`"
Cohesion: 0.22
Nodes (8): Boundaries, Commands, Functions (`manhwa/order.py`), Objective, SPEC — M7 module 3: `panel-order`, Success criteria, Testing (TDD), Wire-in (slice 2)

### Community 26 - "M9 — Hardware Validation Measurement Log (D-036)"
Cohesion: 0.25
Nodes (7): Checklist, How to reproduce any row, Logged machines, M9 — Hardware Validation Measurement Log (D-036), Memory peak — how to snapshot, Per-machine validation log, Reference machine results — dev Mac

### Community 27 - "Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation, Verify, WHAT

### Community 28 - "Session 2026-09-12 — Session 2: continuity system + commit discipline"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 2: continuity system + commit discipline, Verify, WHAT

### Community 29 - "Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing), Verify, WHAT

### Community 30 - "Session 2026-09-12 — Session 5: M2 voice analysis (first slice)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 5: M2 voice analysis (first slice), Verify, WHAT

### Community 31 - "Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 6: M3 semantic image matching (first slice), Verify, WHAT

### Community 32 - "Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override, Verify, WHAT

### Community 33 - "Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu), Verify, WHAT, WHY

### Community 34 - "Session 2026-09-12 — Session 9: M4 module 1 — transitions-core"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 9: M4 module 1 — transitions-core, Verify, WHAT, WHY

### Community 35 - "Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui, Verify, WHAT, WHY

### Community 36 - "Session 13 — M5 caption engine complete (all four modules)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 13 — M5 caption engine complete (all four modules), Verify, WHAT

### Community 37 - "Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs), Verify, WHAT

### Community 38 - "Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)"
Cohesion: 0.25
Nodes (8): Decisions, HOW, Limitations, Next step, Purpose (WHY), Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply), Verify, WHAT

### Community 39 - "Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence, Verification, WHAT, WHY

### Community 40 - "Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed, Verification, WHAT, WHY

### Community 41 - "Session 23 — M7 module 4 `panel-export` (full-res crops + manifest)"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 23 — M7 module 4 `panel-export` (full-res crops + manifest), Verification, WHAT, WHY

### Community 42 - "Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix"
Cohesion: 0.25
Nodes (8): Files, HOW, Limitations, Next step, Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix, Verification, WHAT, WHY

### Community 43 - "Capability Map: M5 Caption Engine"
Cohesion: 0.25
Nodes (7): Boundaries / decisions, Build order, Capability Map: M5 Caption Engine, Gate, Modules, Objective, What is NOT in M5 (explicit deferrals)

### Community 44 - "Capability Map: M7 Manhwa / Webtoon Extractor"
Cohesion: 0.25
Nodes (7): Assumptions, Build order, Capability Map: M7 Manhwa / Webtoon Extractor, Gate, Modules, Objective, What is NOT in M7 (explicit deferrals)

### Community 45 - "Capability Map: M9 Hardware Validation"
Cohesion: 0.25
Nodes (7): Assumptions, Build order, Capability Map: M9 Hardware Validation, Gate, Modules, Objective, What is NOT in M9 (explicit deferrals)

### Community 46 - "SPEC — M7 module 4: `panel-export`"
Cohesion: 0.25
Nodes (7): Boundaries, Commands, Functions (`manhwa/export.py`), Objective, SPEC — M7 module 4: `panel-export`, Testing (TDD), Wire precedence

### Community 47 - "Spec: preset-import (M6 module 3)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, ASSUMPTIONS I'M MAKING, Files, Objective, Open questions, Slices, Spec: preset-import (M6 module 3)

### Community 48 - "Spec: preset-registry (M6 module 2)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Architecture decisions, Files, Open questions, Scope, Slices, Spec: preset-registry (M6 module 2)

### Community 49 - "Spec: template-editor (M6 module 4)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, ASSUMPTIONS I'M MAKING, Files, Objective, Open questions, Slices, Spec: template-editor (M6 module 4)

### Community 50 - "Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done), Verify, WHAT

### Community 51 - "Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices), Verify, WHAT

### Community 52 - "Session 29 — M9 module 2 `runtime-optimization` (5 slices)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 29 — M9 module 2 `runtime-optimization` (5 slices), Verify, WHAT

### Community 53 - "Session 31 — M9 module 4 `baseline-validation` (4 slices)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 31 — M9 module 4 `baseline-validation` (4 slices), Verify, WHAT

### Community 54 - "Session 32 — M9 reframe: validation machine-agnostic (D-037)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 32 — M9 reframe: validation machine-agnostic (D-037), Verify, WHAT

### Community 55 - "Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes), Verify, WHAT

### Community 56 - "Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix), Verify, WHAT

### Community 57 - "Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)"
Cohesion: 0.29
Nodes (7): Decisions, HOW, Limitations, Next step, Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract), Verify, WHAT

### Community 58 - "Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md, Verify, WHAT, WHY

### Community 59 - "Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)"
Cohesion: 0.29
Nodes (7): HOW, Limitations, Next step, Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills), Verify, WHAT, WHY

### Community 60 - "Capability Map: M4 — Transition / Animation Engine"
Cohesion: 0.29
Nodes (6): Boundaries, Build order, Capability Map: M4 — Transition / Animation Engine, Dependency direction notes, Open questions, Per-module gating

## Knowledge Gaps
- **559 isolated node(s):** `1. Repository Layout`, `2. Design Principles`, `3. Core Technology`, `4. Voice-over → Images Processing Graph`, `5. Manhwa / Webtoon Extraction Processing Graph` (+554 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 588 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AI Video Studio — Session Log` connect `AI Video Studio — Session Log` to `AI Video Studio — Features`, `Session 2026-09-12 — Milestone 0 bootstrap + Milestone 1 media foundation`, `Session 2026-09-12 — Session 2: continuity system + commit discipline`, `Session 2026-09-12 — Session 4: M1 completion (save/load + clip editing)`, `Session 2026-09-12 — Session 5: M2 voice analysis (first slice)`, `Session 2026-09-12 — Session 6: M3 semantic image matching (first slice)`, `Session 2026-09-12 — Session 7: M3 remainder — timing fit + manual timing override`, `Session 2026-09-12 — Session 8: M3 final pass — multilingual image matching (Urdu/Roman-Urdu)`, `Session 2026-09-12 — Session 9: M4 module 1 — transitions-core`, `Session 2026-09-12 — Session 11: M4 module 3 — transitions-ui`, `Session 13 — M5 caption engine complete (all four modules)`, `Session 14 — M6 module 1: font-system shipped (spec → plan → TDD slices → docs)`, `Session 15 — M6 module 2: preset-registry shipped (13 categories, one-click apply)`, `Session 21 — M7 module 2 `panel-detection`: hybrid signals, rescue seams, source mapping, registry persistence`, `Session 22 — M7 module 3 `panel-order` (pure normalization layer) + modules 1–2 pushed`, `Session 23 — M7 module 4 `panel-export` (full-res crops + manifest)`, `Session 24 — M7 module 5 `panel-correction` (pure list ops) + export order fix`, `Session 19 — M6 module 6 `license-tracking` (render guard + manifest; M6 done)`, `Session 28 — M9 hardware validation plan + module 1 `proxy-preview` (4 slices)`, `Session 29 — M9 module 2 `runtime-optimization` (5 slices)`, `Session 31 — M9 module 4 `baseline-validation` (4 slices)`, `Session 32 — M9 reframe: validation machine-agnostic (D-037)`, `Session 16 — M6 module 3 `preset-import` (import/export/delete + Custom writes)`, `Session 17 — M6 module 4 `template-editor` (draft model, PUT overwrite, panel, render-path fix)`, `Session 18 — M6 module 5 `animated-captions` (ASS treatments + contract)`, `Session 20 — M7 module 1 `panel-model` (frozen model, anchored mapping, git-clean registry) + CONSTRAINTS.md`, `Session 12 — M4 module 4: image-motion (Ken Burns/drift on stills)`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Why does `AI Video Studio — Product Specification` connect `AI Video Studio — Product Specification` to `AI Video Studio — Features`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `AI Video Studio — Roadmap` connect `AI Video Studio — Roadmap` to `AI Video Studio — Features`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `1. Repository Layout`, `2. Design Principles`, `3. Core Technology` to the rest of the system?**
  _559 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Video Studio — Features` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Should `AI Video Studio — Session Log` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `AI Video Studio — Decision Log` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._