# Start the Lava Studio local media sidecar (FFmpeg probe/render API).
# PowerShell equivalent of sidecar.sh for Windows.
param(
    [int]$Port = 7860
)

$ErrorActionPreference = "Stop"

# Resolve repo root (parent of scripts/)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir

# Allow PORT env var override
if ($env:PORT) {
    $Port = [int]$env:PORT
}

Set-Location "$Root\backend"

# Ensure uv is on PATH
$LocalBin = Join-Path $env:USERPROFILE ".local\bin"
if (Test-Path $LocalBin) {
    $env:PATH = "$LocalBin;$env:PATH"
}

# Create venv if missing
if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    uv sync --extra dev
}

# Start the server
Write-Host "Starting Lava Studio sidecar on port $Port..." -ForegroundColor Green
& uv run uvicorn lava_backend.main:app --host 127.0.0.1 --port $Port @args
