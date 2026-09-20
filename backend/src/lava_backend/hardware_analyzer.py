"""Hardware Analyzer — pre-download system capability assessment.

Detects RAM, GPU VRAM, CPU, disk and maps to per-model requirements.
Shows Easy / Medium / Hard scenarios before any model download.
"""
from __future__ import annotations

import os
import platform
import shutil
import subprocess
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/hardware", tags=["hardware"])


# ── Per-model hardware requirements ──────────────────────────────────────────
# RAM/VRAM in MB, disk in MB
MODEL_REQUIREMENTS = {
    # ── Whisper variants ──
    "whisper-tiny": {"ram_mb": 500, "vram_mb": 0, "disk_mb": 75, "cpu_cores": 1, "desc": "~1GB model, very light"},
    "whisper-base": {"ram_mb": 700, "vram_mb": 0, "disk_mb": 142, "cpu_cores": 1, "desc": "~1GB model, light"},
    "whisper-small": {"ram_mb": 1200, "vram_mb": 0, "disk_mb": 466, "cpu_cores": 2, "desc": "~2GB model, moderate"},
    "whisper-medium": {"ram_mb": 2600, "vram_mb": 0, "disk_mb": 1500, "cpu_cores": 4, "desc": "~5GB model, needs good CPU"},
    "whisper-large-v2": {"ram_mb": 4000, "vram_mb": 2048, "disk_mb": 3090, "cpu_cores": 4, "desc": "~6GB model, benefits from GPU"},
    "whisper-large-v3": {"ram_mb": 4000, "vram_mb": 2048, "disk_mb": 3090, "cpu_cores": 4, "desc": "~6GB model, benefits from GPU"},
    "whisper-large-v3-turbo": {"ram_mb": 3500, "vram_mb": 1536, "disk_mb": 1600, "cpu_cores": 4, "desc": "~3GB model, optimized"},
    "whisper-distil-large-v2": {"ram_mb": 3000, "vram_mb": 1536, "disk_mb": 1500, "cpu_cores": 4, "desc": "~3GB model, distilled"},
    "whisper-distil-large-v3": {"ram_mb": 3000, "vram_mb": 1536, "disk_mb": 1500, "cpu_cores": 4, "desc": "~3GB model, distilled"},
    "whisper-medium.en": {"ram_mb": 2600, "vram_mb": 0, "disk_mb": 1500, "cpu_cores": 4, "desc": "~5GB model, English only"},
    "whisper-small.en": {"ram_mb": 1200, "vram_mb": 0, "disk_mb": 466, "cpu_cores": 2, "desc": "~2GB model, English only"},
    "whisper-base.en": {"ram_mb": 700, "vram_mb": 0, "disk_mb": 142, "cpu_cores": 1, "desc": "~1GB model, English only"},
    "whisper-tiny.en": {"ram_mb": 500, "vram_mb": 0, "disk_mb": 75, "cpu_cores": 1, "desc": "~1GB model, English only"},
    "whisper-large-v3-turbo-x": {"ram_mb": 3500, "vram_mb": 1536, "disk_mb": 1600, "cpu_cores": 4, "desc": "~3GB, fastest large variant"},
    "whisper-large-v3-turbo-distil": {"ram_mb": 3000, "vram_mb": 1536, "disk_mb": 1500, "cpu_cores": 4, "desc": "~3GB, distilled turbo"},
    "whisper-large-v3-turbo-x-distil": {"ram_mb": 3000, "vram_mb": 1536, "disk_mb": 1500, "cpu_cores": 4, "desc": "~3GB, distilled turbo"},
    "whisper-puncture": {"ram_mb": 1200, "vram_mb": 0, "disk_mb": 466, "cpu_cores": 2, "desc": "~1GB model, punctuation fix"},

    # ── CLIP ──
    "clip-vit-b32": {"ram_mb": 1500, "vram_mb": 512, "disk_mb": 350, "cpu_cores": 2, "desc": "~1GB model, vision encoder"},
    "clip-vit-b16": {"ram_mb": 2000, "vram_mb": 1024, "disk_mb": 500, "cpu_cores": 2, "desc": "~1.5GB model, vision encoder"},
    "clip-vit-l14": {"ram_mb": 4000, "vram_mb": 2048, "disk_mb": 900, "cpu_cores": 4, "desc": "~2GB model, high accuracy"},

    # ── XTTS-v2 (voice cloning) ──
    "xtts-v2": {"ram_mb": 4000, "vram_mb": 2048, "disk_mb": 1800, "cpu_cores": 4, "desc": "~2GB model, voice cloning (GPU recommended)"},
}


class HardwareSpecs(BaseModel):
    ram_total_mb: int
    ram_available_mb: int
    vram_total_mb: int
    vram_available_mb: int
    cpu_cores: int
    cpu_name: str
    disk_free_mb: int
    disk_total_mb: int
    platform: str
    python_version: str
    has_gpu: bool
    gpu_name: str


class ModelAssessment(BaseModel):
    model_id: str
    model_name: str
    scenario: str  # "easy" | "medium" | "hard" | "insufficient"
    ram_ok: bool
    vram_ok: bool
    disk_ok: bool
    cpu_ok: bool
    bottleneck: str  # what is the limiting factor
    detail: str  # human-readable explanation


class HardwareAnalysis(BaseModel):
    specs: HardwareSpecs
    assessments: list[ModelAssessment]
    overall_rating: str  # "capable" | "adequate" | "limited"


def _get_gpu_info() -> tuple[int, str, int]:
    """Detect GPU VRAM via nvidia-smi or WMI."""
    # Try nvidia-smi first
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.total,memory.free,name", "--format=csv,noheader,nounits"],
            capture_output=True, timeout=10,
        )
        if result.returncode == 0:
            lines = result.stdout.decode().strip().split("\n")
            if lines:
                parts = lines[0].split(", ")
                vram_total = int(parts[0].strip())
                vram_free = int(parts[1].strip())
                gpu_name = parts[2].strip() if len(parts) > 2 else "NVIDIA GPU"
                return vram_total, gpu_name, vram_free
    except Exception:
        pass

    # Try WMI on Windows
    try:
        result = subprocess.run(
            ["wmic", "path", "win32_videocontroller", "get", "AdapterRAM,Name", "/format:csv"],
            capture_output=True, timeout=10,
        )
        if result.returncode == 0:
            lines = result.stdout.decode().strip().split("\n")
            for line in lines[1:]:
                parts = line.strip().split(",")
                if len(parts) >= 3 and parts[1].strip():
                    try:
                        vram = int(parts[1].strip()) // (1024 * 1024)  # bytes to MB
                        name = parts[2].strip()
                        return vram, name, 0
                    except ValueError:
                        continue
    except Exception:
        pass

    return 0, "No GPU detected", 0


def _get_disk_info() -> tuple[int, int]:
    """Get disk free and total in MB."""
    try:
        usage = shutil.disk_usage("/")
        return usage.free // (1024 * 1024), usage.total // (1024 * 1024)
    except Exception:
        return 0, 0


def _get_ram_info() -> tuple[int, int]:
    """Get total and available RAM in MB."""
    try:
        import psutil
        mem = psutil.virtual_memory()
        return mem.total // (1024 * 1024), mem.available // (1024 * 1024)
    except ImportError:
        pass

    # Fallback: platform-based estimation
    try:
        result = subprocess.run(
            ["wmic", "OS", "get", "TotalVisibleMemorySize,FreePhysicalMemory", "/format:csv"],
            capture_output=True, timeout=10,
        )
        if result.returncode == 0:
            lines = result.stdout.decode().strip().split("\n")
            for line in lines[1:]:
                parts = line.strip().split(",")
                if len(parts) >= 3 and parts[1].strip():
                    try:
                        total = int(parts[1].strip()) // 1024
                        free = int(parts[2].strip()) // 1024
                        return total, free
                    except ValueError:
                        continue
    except Exception:
        pass

    return 0, 0


def _assess_model(
    model_id: str,
    reqs: dict,
    specs: HardwareSpecs,
) -> ModelAssessment:
    """Evaluate one model against hardware specs."""
    ram_ok = specs.ram_total_mb >= reqs["ram_mb"]
    vram_ok = reqs["vram_mb"] == 0 or specs.vram_total_mb >= reqs["vram_mb"]
    disk_ok = specs.disk_free_mb >= reqs["disk_mb"]
    cpu_ok = specs.cpu_cores >= reqs["cpu_cores"]

    # Determine bottleneck
    bottlenecks = []
    if not ram_ok:
        need = reqs["ram_mb"] - specs.ram_total_mb
        bottlenecks.append(f"RAM short by {need}MB")
    if not vram_ok and reqs["vram_mb"] > 0:
        need = reqs["vram_mb"] - specs.vram_total_mb
        bottlenecks.append(f"VRAM short by {need}MB")
    if not disk_ok:
        need = reqs["disk_mb"] - specs.disk_free_mb
        bottlenecks.append(f"Disk short by {need}MB")
    if not cpu_ok:
        bottlenecks.append(f"Need {reqs['cpu_cores']} cores, have {specs.cpu_cores}")

    bottleneck = "; ".join(bottlenecks) if bottlenecks else "none"

    # Scenario scoring
    if not ram_ok and reqs["vram_mb"] > 0 and not vram_ok:
        # Both RAM and VRAM insufficient
        scenario = "insufficient"
        detail = f"This model needs {reqs['ram_mb']}MB RAM + {reqs['vram_mb']}MB VRAM. Your system has {specs.ram_total_mb}MB RAM, {specs.vram_total_mb}MB VRAM. Consider using Groq cloud instead."
    elif not ram_ok:
        scenario = "insufficient"
        detail = f"This model needs {reqs['ram_mb']}MB RAM but you only have {specs.ram_total_mb}MB. Use cloud API instead."
    elif not disk_ok:
        scenario = "insufficient"
        detail = f"This model needs {reqs['disk_mb']}MB disk space but you only have {specs.disk_free_mb}MB free."
    elif ram_ok and vram_ok and cpu_ok and disk_ok:
        # Check headroom
        ram_ratio = specs.ram_total_mb / reqs["ram_mb"]
        vram_ratio = (specs.vram_total_mb / reqs["vram_mb"]) if reqs["vram_mb"] > 0 else 99

        if ram_ratio >= 3 and (vram_ratio >= 2 or reqs["vram_mb"] == 0):
            scenario = "easy"
            detail = f"Well within specs. {specs.ram_total_mb}MB RAM available vs {reqs['ram_mb']}MB needed. System handles this easily."
        elif ram_ratio >= 1.5 and (vram_ratio >= 1.2 or reqs["vram_mb"] == 0):
            scenario = "medium"
            detail = f"Runs fine but system will be under moderate load. Close other apps for best results."
        else:
            scenario = "hard"
            detail = f"Will run but at near-max capacity. Expect slower processing. Keep other apps closed."
    else:
        scenario = "medium"
        detail = "Meets minimum requirements. May need to close other apps."

    # Friendly model name
    friendly_names = {
        "whisper-tiny": "Whisper Tiny",
        "whisper-base": "Whisper Base",
        "whisper-small": "Whisper Small",
        "whisper-medium": "Whisper Medium",
        "whisper-large-v2": "Whisper Large v2",
        "whisper-large-v3": "Whisper Large v3",
        "whisper-large-v3-turbo": "Whisper Large v3 Turbo",
        "whisper-distil-large-v2": "Whisper Distil Large v2",
        "whisper-distil-large-v3": "Whisper Distil Large v3",
        "whisper-medium.en": "Whisper Medium (EN)",
        "whisper-small.en": "Whisper Small (EN)",
        "whisper-base.en": "Whisper Base (EN)",
        "whisper-tiny.en": "Whisper Tiny (EN)",
        "whisper-large-v3-turbo-x": "Whisper Large Turbo X",
        "whisper-large-v3-turbo-distil": "Whisper Turbo Distil",
        "whisper-large-v3-turbo-x-distil": "Whisper Turbo X Distil",
        "whisper-puncture": "Whisper Punctuation",
        "clip-vit-b32": "CLIP ViT-B/32",
        "clip-vit-b16": "CLIP ViT-B/16",
        "clip-vit-l14": "CLIP ViT-L/14",
        "xtts-v2": "XTTS-v2 (Voice Cloning)",
    }

    return ModelAssessment(
        model_id=model_id,
        model_name=friendly_names.get(model_id, model_id),
        scenario=scenario,
        ram_ok=ram_ok,
        vram_ok=vram_ok,
        disk_ok=disk_ok,
        cpu_ok=cpu_ok,
        bottleneck=bottleneck,
        detail=detail,
    )


@router.get("/analyze", response_model=HardwareAnalysis)
async def analyze_hardware():
    """Analyze system hardware and assess all model requirements.

    Returns system specs + per-model Easy/Medium/Hard/Insufficient rating.
    """
    ram_total, ram_avail = _get_ram_info()
    vram_total, gpu_name, vram_free = _get_gpu_info()
    disk_free, disk_total = _get_disk_info()

    cpu_cores = os.cpu_count() or 1
    cpu_name = platform.processor() or f"{cpu_cores} cores"

    specs = HardwareSpecs(
        ram_total_mb=ram_total,
        ram_available_mb=ram_avail,
        vram_total_mb=vram_total,
        vram_available_mb=vram_free,
        cpu_cores=cpu_cores,
        cpu_name=cpu_name,
        disk_free_mb=disk_free,
        disk_total_mb=disk_total,
        platform=f"{platform.system()} {platform.release()}",
        python_version=platform.python_version(),
        has_gpu=vram_total > 0,
        gpu_name=gpu_name,
    )

    # Assess each model
    assessments = []
    for model_id, reqs in MODEL_REQUIREMENTS.items():
        assessments.append(_assess_model(model_id, reqs, specs))

    # Overall rating
    easy_count = sum(1 for a in assessments if a.scenario == "easy")
    medium_count = sum(1 for a in assessments if a.scenario == "medium")
    insufficient_count = sum(1 for a in assessments if a.scenario == "insufficient")

    if insufficient_count == 0 and easy_count > medium_count:
        overall = "capable"
    elif insufficient_count <= 3:
        overall = "adequate"
    else:
        overall = "limited"

    return HardwareAnalysis(
        specs=specs,
        assessments=assessments,
        overall_rating=overall,
    )
