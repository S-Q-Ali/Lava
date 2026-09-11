"""Lava Studio local media sidecar."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import get_config, tool_versions
from .errors import ApiError, error_response

app = FastAPI(title="Lava Studio Media Sidecar", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api"


@app.exception_handler(ApiError)
async def api_error_handler(_: Request, exc: ApiError):
    return error_response(exc.status, exc.code, exc.message)


@app.get(f"{API_V1}/health")
def health():
    config = get_config()
    versions = tool_versions(config)
    if versions.error:
        return error_response(503, "FFMPEG_UNAVAILABLE", versions.error)
    return {
        "ok": True,
        "name": "lava-backend",
        "ffmpegVersion": versions.ffmpeg,
        "ffprobeVersion": versions.ffprobe,
    }