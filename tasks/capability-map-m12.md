# Capability Map: M12 Remaining Work

## Context
M11 complete (AutoCut Studio PRO + Clabeo parity). M12 pipeline engine built. 
Three deferred features + quality gaps remain. Skills require spec-first approach.

## Capability Map

| Module ID | Responsibility | Depends On | Est. Tasks |
|---|---|---|---|
| `quality-bar` | Constraints, test coverage, lint rules, type safety | — | 3 |
| `deferred-features` | Script Templates, My Generations, Auto-Update | quality-bar | 3 |
| `pipeline-polish` | Pipeline error states, preview, caption overlay | quality-bar | 3 |
| `spec-docs` | PRODUCT_SPEC update, ARCHITECTURE update, DECISIONS | all above | 2 |

Build order: quality-bar → deferred-features + pipeline-polish (parallel) → spec-docs

## Module Details

### Module: quality-bar
**Objective:** Establish minimum quality bar for all new code.
- CONSTRAINTS.md with enforceable rules
- Test coverage thresholds
- Lint/type-check gates in CI
- Pre-commit hooks

### Module: deferred-features
**Objective:** Complete 3 features deferred from M11.
- Script Templates: pre-built card grid, one-click load
- My Generations: history of generated audio, re-download
- Auto-Update: GitHub releases checker

### Module: pipeline-polish
**Objective:** Make production-ready.
- Pipeline error states (missing API keys, failed stages)
- Caption overlay preview on timeline
- Video preview player in pipeline output

### Module: spec-docs
**Objective:** Documentation matches code.
- PRODUCT_SPEC update with all M11/M12 features
- ARCHITECTURE.md update with new modules
- DECISIONS.md for key choices made
