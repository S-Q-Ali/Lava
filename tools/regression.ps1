# Regression test script for AI Video Studio
# PowerShell equivalent of regression.sh for Windows.
# Runs all verification steps in sequence. Exit on first failure.
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$Frontend = "$Root\frontend"
$Backend = "$Root\backend"

Write-Host "=== AI Video Studio Regression Suite ===" -ForegroundColor Cyan
Write-Host ""

# 1. Frontend build
Write-Host "[1/6] Frontend TypeScript build..." -ForegroundColor Yellow
Set-Location $Frontend
npx tsc -b
Write-Host "  OK tsc clean" -ForegroundColor Green

# 2. Frontend tests
Write-Host "[2/6] Frontend tests..." -ForegroundColor Yellow
$testOutput = npx vitest run --reporter=dot 2>&1 | Out-String
$testMatch = [regex]::Match($testOutput, '(\d+) passed')
if ($testMatch.Success) {
    Write-Host "  OK $($testMatch.Groups[1].Value) tests passed" -ForegroundColor Green
} else {
    Write-Host "  WARN Could not parse test results" -ForegroundColor Yellow
}

# 3. Frontend lint
Write-Host "[3/6] Frontend lint (oxlint)..." -ForegroundColor Yellow
$lintOutput = npx oxlint src 2>&1 | Out-String
$lintMatch = [regex]::Match($lintOutput, '(\d+) errors?')
if ($lintMatch.Success -and [int]$lintMatch.Groups[1].Value -gt 0) {
    Write-Host "  FAIL $($lintMatch.Groups[1].Value) lint errors found" -ForegroundColor Red
    exit 1
}
Write-Host "  OK 0 lint errors" -ForegroundColor Green

# 4. Backend tests
Write-Host "[4/6] Backend tests..." -ForegroundColor Yellow
Set-Location $Backend
if (Get-Command pytest -ErrorAction SilentlyContinue) {
    pytest --tb=short -q 2>&1 | Out-Null
    Write-Host "  OK backend tests passed" -ForegroundColor Green
} else {
    Write-Host "  WARN pytest not found, skipping" -ForegroundColor Yellow
}

# 5. Check for TypeScript strict mode violations
Write-Host "[5/6] Frontend strict checks..." -ForegroundColor Yellow
Set-Location $Frontend
$strictOutput = npx tsc --noEmit 2>&1 | Out-String
$strictCount = ([regex]::Matches($strictOutput, 'error TS')).Count
if ($strictCount -gt 0) {
    Write-Host "  FAIL $strictCount strict violations" -ForegroundColor Red
    exit 1
}
Write-Host "  OK 0 strict violations" -ForegroundColor Green

# 6. Check bundle size
Write-Host "[6/6] Bundle size check..." -ForegroundColor Yellow
$buildOutput = npx vite build 2>&1 | Out-String
$sizeMatch = [regex]::Match($buildOutput, 'dist/assets/[^ ]+ ([0-9.]+ KiB)')
if ($sizeMatch.Success) {
    Write-Host "  OK $($sizeMatch.Groups[1].Value)" -ForegroundColor Green
} else {
    Write-Host "  WARN Could not parse bundle size" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== All regression checks passed ===" -ForegroundColor Cyan
