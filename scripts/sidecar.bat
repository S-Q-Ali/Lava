@echo off
REM Start the Lava Studio local media sidecar (FFmpeg probe/render API).
REM Batch equivalent of sidecar.sh for Windows (works without PowerShell).

setlocal enabledelayedexpansion

set ROOT=%~dp0..
set PORT=7860

REM Allow PORT env var override
if defined PORT_ENV set PORT=%PORT_ENV%

cd /d "%ROOT%\backend"

REM Ensure uv is on PATH
if exist "%USERPROFILE%\.local\bin" set "PATH=%USERPROFILE%\.local\bin;%PATH%"

REM Create venv if missing
if not exist ".venv" (
    echo Creating virtual environment...
    call uv sync --extra dev
    if errorlevel 1 (
        echo Failed to create virtual environment.
        exit /b 1
    )
)

REM Start the server
echo Starting Lava Studio sidecar on port %PORT%...
call uv run uvicorn lava_backend.main:app --host 127.0.0.1 --port %PORT% %*

endlocal
