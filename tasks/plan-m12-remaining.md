# Implementation Plan: M12 Remaining Work

## Overview
Quality bar enforcement + 3 deferred features + pipeline polish + documentation.
Spec-first approach per skills: SPEC-m12-remaining.md approved.

## Build Order (dependency graph)
```
quality-bar (CONSTRAINTS update)
    │
    ├──→ Script Templates (independent)
    ├──→ My Generations (independent)
    ├──→ Auto-Update (independent)
    └──→ Pipeline Polish (independent)
              │
              └──→ Documentation (depends on all above)
```

## Task List

### Phase 1: Quality Bar (1 task)
- [ ] Task 1.1: Update CONSTRAINTS.md with current test counts, add pre-commit hook suggestion

### Phase 2: Deferred Features (3 tasks, parallel)
- [ ] Task 2.1: ScriptTemplatesPanel — 9 template cards, one-click load
- [ ] Task 2.2: MyGenerationsPanel — history list, re-download, delete
- [ ] Task 2.3: Auto-Update — GitHub releases checker, notification

### Phase 3: Pipeline Polish (2 tasks)
- [ ] Task 3.1: Pipeline error states — missing API key handling, graceful fallback
- [ ] Task 3.2: Pipeline video preview — player in output section

### Phase 4: Documentation (2 tasks)
- [ ] Task 4.1: PRODUCT_SPEC.md update — M11/M12 features
- [ ] Task 4.2: ARCHITECTURE.md update — new modules, endpoints

## Checkpoints
- After Phase 1: CONSTRAINTS.md updated, counts verified
- After Phase 2: 3 new panels work, all tests pass
- After Phase 3: Pipeline handles errors gracefully
- After Phase 4: Documentation matches code

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Auto-Update needs GitHub repo URL | Medium | Use placeholder until repo is public |
| Pipeline preview needs video player | Low | Use native HTML5 video element |
| Test counts may have drifted | Low | Run full suite, update CONSTRAINTS |
