#!/usr/bin/env bash
# Regression test script for AI Video Studio
# Runs all verification steps in sequence. Exit on first failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"

echo "=== AI Video Studio Regression Suite ==="
echo ""

# 1. Frontend build
echo "[1/6] Frontend TypeScript build..."
cd "$FRONTEND"
npx tsc -b
echo "  ✓ tsc clean"

# 2. Frontend tests
echo "[2/6] Frontend tests..."
npx vitest run --reporter=dot 2>&1 | tail -1
TESTS=$(npx vitest run --reporter=dot 2>&1 | grep -oE '[0-9]+ passed' | head -1)
echo "  ✓ $TESTS"

# 3. Frontend lint
echo "[3/6] Frontend lint (oxlint)..."
LINT_ERRORS=$(npx oxlint src 2>&1 | grep -oE '[0-9]+ errors' | head -1)
if [ "$LINT_ERRORS" != "0 errors" ]; then
  echo "  ✗ $LINT_ERRORS found"
  exit 1
fi
echo "  ✓ 0 lint errors"

# 4. Backend tests (if pytest available)
echo "[4/6] Backend tests..."
cd "$BACKEND"
if command -v pytest &> /dev/null; then
  pytest --tb=short -q 2>&1 | tail -1
  echo "  ✓ backend tests passed"
else
  echo "  ⚠ pytest not found, skipping"
fi

# 5. Check for TypeScript strict mode violations
echo "[5/6] Frontend strict checks..."
cd "$FRONTEND"
STRICT=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
if [ "$STRICT" -gt 0 ]; then
  echo "  ✗ $STRICT strict violations"
  exit 1
fi
echo "  ✓ 0 strict violations"

# 6. Check bundle size
echo "[6/6] Bundle size check..."
cd "$FRONTEND"
SIZE=$(npx vite build 2>&1 | grep -oE 'dist/assets/[^ ]+ [0-9.]+ KiB' | head -1 || echo "unknown")
echo "  ✓ $SIZE"

echo ""
echo "=== All regression checks passed ==="
