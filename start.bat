@echo off
REM ============================================
REM  Lava AI Video Studio — Windows Launcher
REM ============================================
REM  Double-click this file to start the app.
REM  It will:
REM    1. Start the Python backend (FastAPI + FFmpeg API)
REM    2. Open the editor in your default browser
REM ============================================

setlocal enabledelayedexpansion

set ROOT=%~dp0
set PORT=7860

echo.
echo  ===================================
echo   Lava AI Video Studio
echo  ===================================
echo.

REM Check if uv is available
where uv >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] 'uv' not found. Please install it first:
    echo    pip install uv
    echo    or visit: https://docs.astral.sh/uv/getting-started/installation/
    echo.
    pause
    exit /b 1
)

REM Create venv if missing
if not exist "%ROOT%backend\.venv" (
    echo  [1/3] Creating Python virtual environment...
    cd /d "%ROOT%backend"
    call uv sync --extra dev
    if errorlevel 1 (
        echo  [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo  [1/3] Virtual environment found.
)

REM Check FFmpeg
if not exist "%ROOT%tools\ffmpeg\bin\ffmpeg.exe" (
    echo.
    echo  [2/3] FFmpeg not found. Downloading...
    cd /d "%ROOT%"
    node scripts/fetch-ffmpeg.mjs
    if errorlevel 1 (
        echo  [WARN] FFmpeg download failed. You can download manually from:
        echo    https://www.gyan.dev/ffmpeg/builds/
        echo    Place ffmpeg.exe and ffprobe.exe in tools\ffmpeg\bin\
    )
) else (
    echo  [2/3] FFmpeg found.
)

REM Start backend
echo  [3/3] Starting backend on port %PORT%...
echo.
cd /d "%ROOT%backend"
start "Lava Backend" /min cmd /c "call uv run uvicorn lava_backend.main:app --host 127.0.0.1 --port %PORT%"

REM Wait for server to start
echo  Waiting for server...
timeout /t 3 /nobreak >nul

REM Open browser
echo  Opening browser...
start http://localhost:%PORT%

echo.
echo  ===================================
echo   Server running on http://localhost:%PORT%
echo   Press Ctrl+C in the backend window to stop
echo  ===================================
echo.

endlocal
