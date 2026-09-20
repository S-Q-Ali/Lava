@echo off
REM ============================================
REM  Lava Studio — Desktop Quick Launch
REM ============================================
REM  Starts the desktop app (pywebview window)
REM  without building — for development testing
REM ============================================

setlocal enabledelayedexpansion

set ROOT=%~dp0
set BACKEND=%ROOT%backend

echo.
echo  ===================================
echo   Lava Studio — Desktop Mode
echo  ===================================
echo.

REM Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.11+
    pause
    exit /b 1
)

REM Install deps if needed
if not exist "%BACKEND%\.venv" (
    echo  Setting up Python environment...
    cd /d "%BACKEND%"
    call uv sync --extra desktop
)

REM Start desktop app
echo  Starting Lava Studio Desktop...
cd /d "%BACKEND%"
call uv run python -m lava_backend.desktop

endlocal
