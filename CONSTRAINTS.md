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
| Types (frontend) | Zero type errors, strict | `npm run build` (tsc -b) | task end |
| Lint (frontend) | Zero errors from oxlint config | `npm run lint` (oxlint) | task end |
| Tests (backend) | Zero failures, add don't drop | `uv sync --extra dev && uv run pytest` | task end |
| Tests (frontend) | Zero failures, add don't drop | `npx vitest run` | task end |

## Declared, tools pending (BLOCK once installed)

| Dimension | Tool chosen | Command (once installed) | Gate on | Runs at |
|-----------|-------------|--------------------------|---------|---------|
| Coverage (JS) | `@vitest/coverage-v8` | `npx vitest run --coverage` | changed lines ≥ 80% | task end |
| Coverage (Python) | `pytest-cov` | `uv run pytest --cov=src --cov-report=lcov` | changed lines ≥ 80% | task end |
| Security: code | Semgrep | `semgrep scan --config p/default` | any high finding | REVIEW/CI |
| Security: deps | osv-scanner | `osv-scanner scan source -r backend/ frontend/` | high or above | REVIEW/CI |
| Performance: page | Lighthouse | `lighthouse $PREVIEW_URL` | LCP ≤ 2500ms, CLS ≤ 0.1 | preview deploy |
| Accessibility | `@axe-core/cli` | `axe $URL --tags wcag2a,wcag2aa,wcag21aa` | zero critical/serious | panel-ui preview |
| Architecture | dependency-cruiser | `depcruise --validate .dependency-cruiser.cjs src` | any violation | task end |

These tools install machine-wide on demand (flag in the report when a dimension is
enforced for the first time). Until installed, the dimension is scheduled, not
claimed. At least one external (non-suite, non-project) constraint — axe,
Lighthouse, osv-scanner, semgrep — must be live before a feature ships.

## Measured, not yet enforced

| Metric | Today | Direction |
|--------|-------|-----------|
| Backend test count | 330 passed | must not fall |
| Frontend test count | 253 passed (28 files) | must not fall |
| Frontend bundle (main) | not yet measured | must not grow once measured |

## Exceptions

None.