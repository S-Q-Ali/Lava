@echo off
REM ============================================
REM  Lava Studio — Pipeline CLI (Standalone)
REM ============================================
REM  Run the auto-clipping pipeline directly
REM  Usage: run_pipeline.bat "E:\video.mp4" --preset ishowspeed
REM ============================================

setlocal enabledelayedexpansion

set ROOT=%~dp0
set BACKEND=%ROOT%backend

if "%~1"=="" (
    echo.
    echo  Usage: run_pipeline.bat "path\to\video.mp4" [options]
    echo.
    echo  Options:
    echo    --preset ishowspeed|podcast|commentary
    echo    --api-key gsk_your_key
    echo    --max-clips 10
    echo    --output-dir ./clips
    echo.
    echo  Example:
    echo    run_pipeline.bat "E:\videos\stream.mp4" --preset ishowspeed --api-key gsk_xxx
    echo.
    pause
    exit /b 1
)

cd /d "%BACKEND%"
call uv run python -m lava_backend.pipeline %*

endlocal
