# Implementation Plan: Remaining Features → Regression Audit → Polish

## Overview
Complete the 4 unchecked roadmap features (M2/M4/M8), then M10 release hardening, then a full regression audit, then polish. All 5 V2 frontend modules are complete (354 tests, tsc clean, oxlint clean).

## Remaining Roadmap Items (unchecked)
1. **M2: Timing-edit / re-segmentation from edits** — when a user edits transcript text, re-run segmentation to update beat boundaries
2. **M2: Semantic visual-beat matching over transcript** — full pipeline: transcript → semantic beats → image match
3. **M4: Retention-oriented heuristics** — measurable hooks (open-loop structure, pattern interrupt, pacing variation) without viral claims
4. **M8: Performance work** — proxy preview optimization, memory tuning, lazy loading

## M10 — Release Hardening
5. **M10: Crash/error reporting** — global error boundary, toast notifications, backend error normalization
6. **M10: Docs** — user-facing README, getting-started guide, API reference
7. **M10: Regression suite** — end-to-end test script covering all major flows

## Phase 3: Regression Audit
8. Full regression audit — build, lint, test, manual flow verification, performance baseline

## Phase 4: Polish
9. Accessibility audit — ARIA labels, keyboard navigation, focus management
10. Responsive breakpoints — minimum viable widths for panels
11. Error state polish — empty states, loading states, failure recovery
12. Final documentation update — SESSION_LOG, ROADMAP, DECISIONS

## Task List

### Phase 1: Remaining Roadmap Features
- [ ] Task 1: Timing-edit re-segmentation (backend + frontend) [M2]
- [ ] Task 2: Semantic beat matching pipeline (backend + frontend) [M2]
- [ ] Task 3: Retention heuristics engine [M4]
- [ ] Task 4: Performance optimization pass [M8]

### Checkpoint: Roadmap Complete
- [ ] All 4 remaining roadmap items shipped
- [ ] Tests pass, build clean

### Phase 2: Release Hardening (M10)
- [ ] Task 5: Global error boundary + toast system
- [ ] Task 6: User documentation (README + getting-started)
- [ ] Task 7: Regression test script

### Checkpoint: Release Ready
- [ ] M10 items complete
- [ ] Error handling robust

### Phase 3: Regression Audit
- [ ] Task 8: Full regression audit

### Phase 4: Polish
- [ ] Task 9: Accessibility pass
- [ ] Task 10: Responsive breakpoints
- [ ] Task 11: Error/loading state polish
- [ ] Task 12: Final doc update

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| M2 re-segmentation complex | High | Start with simple pause-based re-split, defer word-level |
| Semantic matching needs CLIP | Medium | Backend already has CLIP; wire existing `/api/match` |
| Retention heuristics are subjective | Low | Define measurable metrics only, no subjective claims |
| Performance tuning needs profiling | Medium | Use existing M9 measurement methodology |

## Verification
- `npx tsc -b` clean after each task
- `npx vitest run` all tests pass
- `npx oxlint src` 0 new errors
- Session log appended after each task
