@echo off
setlocal

set "ROOT=%~dp0"
set "PORT=7860"

if not exist "%ROOT%frontend\index.html" (
    echo Frontend build not found. Run build-test.ps1 first.
    pause
    exit /b 1
)

where uv >nul 2>&1
if errorlevel 1 (
    echo uv is required. Install it with: pip install uv
    pause
    exit /b 1
)

if not exist "%ROOT%backend\.venv" (
    cd /d "%ROOT%backend"
    call uv sync --extra dev
    if errorlevel 1 exit /b 1
)

cd /d "%ROOT%backend"
start "Lava Test Backend" /min cmd /c "call uv run uvicorn lava_backend.main:app --host 127.0.0.1 --port %PORT%"

cd /d "%ROOT%frontend"
start "Lava Test Frontend" /min cmd /c "python -m http.server 4173 --bind 127.0.0.1"

timeout /t 3 /nobreak >nul
start http://127.0.0.1:4173

echo Lava portable test build is running.
echo Frontend: http://127.0.0.1:4173
echo Backend:  http://127.0.0.1:%PORT%
echo.
pause

endlocal
