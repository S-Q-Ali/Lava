@echo off
REM ============================================
REM  Lava Studio — Portable Desktop Build
REM ============================================
REM  Builds a portable .exe using PyInstaller
REM ============================================

setlocal enabledelayedexpansion

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set DIST=%ROOT%dist\lava-studio

echo.
echo  ===================================
echo   Lava Studio — Building Desktop App
echo  ===================================
echo.

REM Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.11+
    pause
    exit /b 1
)

REM Install dependencies
echo  [1/4] Installing dependencies...
cd /d "%BACKEND%"
call uv sync --extra desktop
if errorlevel 1 (
    echo  [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

REM Build frontend if dist exists
echo  [2/4] Checking frontend build...
if exist "%ROOT%frontend\dist" (
    echo  Frontend build found.
) else (
    echo  Building frontend...
    cd /d "%ROOT%frontend"
    call npm run build
    if errorlevel 1 (
        echo  [WARN] Frontend build failed. Backend API will still work.
    )
)

REM Run PyInstaller
echo  [3/4] Building executable...
cd /d "%BACKEND%"
call uv run pyinstaller ^
    --name "LavaStudio" ^
    --onefile ^
    --windowed ^
    --icon "%ROOT%tools\icon.ico" ^
    --add-data "%ROOT%frontend\dist;frontend\dist" ^
    --add-data "%ROOT%studio.config.json;." ^
    --add-data "src\lava_backend\pipeline\presets;pipeline\presets" ^
    --hidden-import lava_backend ^
    --hidden-import lava_backend.pipeline ^
    --hidden-import lava_backend.pipeline_api ^
    --hidden-import fastapi ^
    --hidden-import uvicorn ^
    --hidden-import webview ^
    --distpath "%DIST%" ^
    --workpath "%BACKEND%\build" ^
    --specpath "%BACKEND%" ^
    src\lava_backend\desktop.py

if errorlevel 1 (
    echo  [ERROR] PyInstaller build failed
    pause
    exit /b 1
)

REM Copy config
echo  [4/4] Finalizing...
copy "%ROOT%studio.config.json" "%DIST%" >nul

echo.
echo  ===================================
echo   Build complete!
echo   Output: %DIST%\LavaStudio.exe
echo  ===================================
echo.

pause
endlocal
