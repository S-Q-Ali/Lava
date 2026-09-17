param(
    [string]$Output = "dist\portable-test"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutputPath = Join-Path $Root $Output

Push-Location (Join-Path $Root "frontend")
try {
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    npm run build
}
finally {
    Pop-Location
}

if (Test-Path $OutputPath) {
    Remove-Item $OutputPath -Recurse -Force
}

New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
Copy-Item (Join-Path $Root "frontend\dist") (Join-Path $OutputPath "frontend") -Recurse
Copy-Item (Join-Path $Root "backend") (Join-Path $OutputPath "backend") -Recurse -Exclude ".venv"
Copy-Item (Join-Path $Root "studio.config.json") $OutputPath
Copy-Item (Join-Path $Root "scripts\run-test.bat") $OutputPath

$ToolsPath = Join-Path $Root "tools"
if (Test-Path $ToolsPath) {
    Copy-Item $ToolsPath (Join-Path $OutputPath "tools") -Recurse
} else {
    Write-Warning "tools folder not found; install FFmpeg before testing render features."
}

Write-Host "Portable test bundle created at: $OutputPath" -ForegroundColor Green
Write-Host "Run run-test.bat from that folder." -ForegroundColor Cyan
