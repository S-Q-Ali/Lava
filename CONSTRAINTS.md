# Constraints

Last reviewed: 2026-09-14 by Big Pickle (user gate: enforce all dimensions, block mode,
measure-and-hold, ~90s task-end budget)

## Floor (always enforced, no setup required)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `oxlint-disable`,
  `# noqa`, `# type: ignore`, `x-any`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`,
  bare `pass` standing in for logic
- No skipped or deleted tests without a reason in the commit message
- No secrets in source
- This file does not get weakened to make a change pass

Diff-scoped guard: references/floor-guard.md (exit 0/1/2).

## Enforced with numbers (runs today)

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Types (frontend) | Zero type errors, strict | `npm run check:fast` (tsc --noEmit) | every edit |
| Lint (frontend) | Zero errors from oxlint config | `npm run check:fast` (oxlint) | every edit |
| Tests (backend) | Zero failures, add don't drop | `uv run pytest` | task end |
| Tests (frontend) | Zero failures, add don't drop | `npm run check:task` (vitest run) | task end |
| Coverage (JS) | Changed lines ≥ 80% covered | `npm run check:coverage` (vitest --coverage) | task end |
| Coverage (Python) | Changed lines ≥ 80% covered | `uv run pytest --cov=src --cov-report=lcov` | task end |

## Declared, tools pending (BLOCK once installed)

| Dimension | Tool chosen | Command (once installed) | Gate on | Runs at |
|-----------|-------------|--------------------------|---------|---------|
| Security: code | Semgrep | `semgrep scan --config p/default` | any high finding | REVIEW/CI |
| Security: deps | osv-scanner | `osv-scanner scan source -r backend/ frontend/` | high or above | REVIEW/CI |

Note: Lighthouse and axe-core are not applicable — this is a local desktop app,
not a web page. Performance and accessibility are validated via manual testing
and the M9 macro benchmark.

## Measured, not yet enforced

| Metric | Today | Direction |
|--------|-------|-----------|
| Backend test count | 457 passed | must not fall |
| Frontend test count | 378 passed (45 files) | must not fall |
| Frontend bundle (main) | 91.8 kB gzip / 307.2 kB raw | must stay ≤ 500 kB gzip (M9 baseline) |
| Render time (10-clip benchmark pass) | logged M9 validation: 2.47 s (Mac) | > 120 s never passes on any logged machine (M9) |

M9 macro benchmark: `backend/.venv/bin/python tools/m9-macro-bench.py`
(Mac reference logged in `docs/M9-MEASUREMENT.md`; HP row pending).

## Exceptions

None.