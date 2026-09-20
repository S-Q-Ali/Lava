"""Lava Studio Desktop — pywebview + FastAPI backend.

This is the portable desktop entry point. It:
1. Starts the FastAPI backend on a random free port
2. Opens a native pywebview window pointing to the backend
3. Serves the React frontend from the built dist/ folder

Usage:
    python -m lava_backend.desktop
"""
from __future__ import annotations

import socket
import sys
import threading
import time
import webbrowser
from pathlib import Path

import uvicorn


def _find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _start_backend(port: int, backend_dir: Path):
    """Start FastAPI backend in a background thread."""
    sys.path.insert(0, str(backend_dir / "src"))
    from lava_backend.main import app
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)
    server.run()


def main():
    port = _find_free_port()
    root = Path(__file__).resolve().parent.parent.parent  # repo root
    backend_dir = Path(__file__).resolve().parent.parent    # backend/

    print(f"Starting Lava Studio Desktop on port {port}...")

    # Start backend in background thread
    backend_thread = threading.Thread(target=_start_backend, args=(port, backend_dir), daemon=True)
    backend_thread.start()

    # Wait for backend to be ready
    time.sleep(2)

    # Determine frontend URL
    frontend_dist = root / "frontend" / "dist"
    if frontend_dist.exists():
        # Serve from built frontend
        url = f"http://localhost:{port}"
    else:
        # Fallback: open Vite dev server URL
        url = f"http://localhost:{port}"
        print(f"Note: frontend/dist not found. Backend API available at {url}")

    print(f"Opening {url}...")

    # Try pywebview first, fallback to browser
    try:
        import webview
        webview.create_window(
            "Lava Studio",
            url,
            width=1400,
            height=900,
            min_size=(1024, 600),
            text_select=True,
        )
        webview.start(debug=False)
    except ImportError:
        print("pywebview not installed. Opening in default browser...")
        print("Install with: pip install pywebview")
        webbrowser.open(url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down.")


if __name__ == "__main__":
    main()
