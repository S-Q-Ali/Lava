"""End-to-End Pipeline Engine — Script to Video orchestrator.

Connects: Script Splitter → TTS → Image Gen → Timeline Sync → Captions → FFmpeg Render.
Each stage is independent; if one fails, the pipeline continues with placeholders.
"""
from __future__ import annotations

import asyncio
import json
import os
import subprocess
import tempfile
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

# ── Stage definitions ────────────────────────────────────────────────────────

STAGES = [
    "split_script",
    "generate_tts",
    "generate_images",
    "sync_timeline",
    "generate_captions",
    "render_video",
]

STAGE_LABELS = {
    "split_script": "Splitting script into scenes",
    "generate_tts": "Generating voiceover audio",
    "generate_images": "Generating images for scenes",
    "sync_timeline": "Syncing images to audio",
    "generate_captions": "Generating captions",
    "render_video": "Rendering final video",
}


@dataclass
class Scene:
    index: int
    text: str
    prompt: str = ""
    audio_path: str = ""
    image_path: str = ""
    duration_ms: int = 0
    start_ms: int = 0


@dataclass
class PipelineState:
    job_id: str
    script: str
    scenes: list[Scene] = field(default_factory=list)
    audio_paths: list[str] = field(default_factory=list)
    image_paths: list[str] = field(default_factory=list)
    total_duration_ms: int = 0
    output_path: str = ""
    stage: str = "starting"
    progress: float = 0.0
    message: str = "Initializing..."
    error: Optional[str] = None
    stage_errors: list[str] = field(default_factory=list)


# ── Script Splitter ──────────────────────────────────────────────────────────

def split_script(script: str) -> list[Scene]:
    """Split script text into scenes.

    Rules:
    - Empty lines = scene break
    - Each non-empty line group = one scene
    - Max 1 scene per 2-3 sentences
    """
    scenes = []
    # Split by double newline or numbered patterns
    import re

    # Try splitting by numbered sections (1. 2. 3. etc)
    numbered = re.split(r'\n\s*\d+[\.\)]\s*', script.strip())
    if len(numbered) > 1:
        for i, block in enumerate(numbered):
            text = block.strip()
            if text:
                scenes.append(Scene(index=i, text=text))
        return scenes

    # Try splitting by double newline
    blocks = [b.strip() for b in script.split("\n\n") if b.strip()]
    if len(blocks) > 1:
        for i, block in enumerate(blocks):
            scenes.append(Scene(index=i, text=block))
        return scenes

    # Split by sentence (max 2-3 sentences per scene)
    sentences = re.split(r'(?<=[.!?])\s+', script.strip())
    chunk_size = 2
    idx = 0
    for i in range(0, len(sentences), chunk_size):
        chunk = " ".join(sentences[i:i + chunk_size])
        scenes.append(Scene(index=idx, text=chunk))
        idx += 1

    return scenes if scenes else [Scene(index=0, text=script.strip())]


# ── Stage: Generate TTS ─────────────────────────────────────────────────────

async def _generate_tts_for_scene(
    scene: Scene,
    voice: str,
    speed: str,
    output_dir: Path,
) -> str:
    """Generate TTS audio for one scene using edge-tts."""
    import edge_tts

    out_path = output_dir / f"scene_{scene.index:03d}.mp3"
    try:
        communicate = edge_tts.Communicate(scene.text, voice, rate=speed)
        await communicate.save(str(out_path))
        scene.audio_path = str(out_path)

        # Get duration via ffprobe
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "json", str(out_path)],
            capture_output=True, timeout=15,
        )
        data = json.loads(result.stdout)
        scene.duration_ms = int(float(data["format"]["duration"]) * 1000)
        return str(out_path)
    except Exception as exc:
        scene.duration_ms = 5000  # Default 5s placeholder
        return ""


async def stage_tts(
    state: PipelineState,
    voice: str = "en-US-GuyNeural",
    speed: str = "+0%",
    output_dir: Path | None = None,
):
    """Generate TTS for all scenes."""
    out = output_dir or Path("pipeline_output") / state.job_id
    out.mkdir(parents=True, exist_ok=True)

    tasks = [_generate_tts_for_scene(s, voice, speed, out) for s in state.scenes]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    state.audio_paths = [r for r in results if isinstance(r, str) and r]
    state.total_duration_ms = sum(s.duration_ms for s in state.scenes)

    if not state.audio_paths:
        state.stage_errors.append("TTS: No audio generated")


# ── Stage: Generate Images ──────────────────────────────────────────────────

async def _generate_image_for_scene(
    scene: Scene,
    style: str,
    api_key: str,
    output_dir: Path,
) -> str:
    """Generate image for one scene using Gemini API or placeholder."""
    if not api_key:
        # No API key — create a colored placeholder
        out_path = output_dir / f"scene_{scene.index:03d}.png"
        _create_placeholder_image(out_path, scene.index, scene.text[:50])
        scene.image_path = str(out_path)
        return str(out_path)

    try:
        import httpx

        url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict"
        payload = {
            "instances": [{"prompt": scene.prompt or scene.text}],
            "parameters": {"sampleCount": 1, "aspectRatio": "9:16"},
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers={"Authorization": f"Bearer {api_key}"})
            if resp.status_code == 200:
                data = resp.json()
                predictions = data.get("predictions", [])
                if predictions:
                    import base64
                    image_data = base64.b64decode(predictions[0].get("bytesBase64Encoded", ""))
                    out_path = output_dir / f"scene_{scene.index:03d}.png"
                    out_path.write_bytes(image_data)
                    scene.image_path = str(out_path)
                    return str(out_path)
    except Exception:
        pass

    # Fallback: placeholder
    out_path = output_dir / f"scene_{scene.index:03d}.png"
    _create_placeholder_image(out_path, scene.index, scene.text[:50])
    scene.image_path = str(out_path)
    return str(out_path)


def _create_placeholder_image(path: Path, index: int, text: str):
    """Create a simple placeholder PNG using FFmpeg."""
    colors = ["#1a1a2e", "#16213e", "#0f3460", "#1b1b2f", "#162447"]
    color = colors[index % len(colors)]
    hex_color = color.lstrip("#")

    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", f"color=c=0x{hex_color}:s=1080x1920:d=1",
            "-vf", f"drawtext=text='Scene {index + 1}':fontcolor=white:fontsize=48:x=(w-tw)/2:y=(h-th)/2",
            "-frames:v", "1", str(path),
        ],
        capture_output=True, timeout=10,
    )


async def stage_images(
    state: PipelineState,
    style: str = "cinematic",
    api_key: str = "",
    output_dir: Path | None = None,
):
    """Generate images for all scenes."""
    out = output_dir or Path("pipeline_output") / state.job_id
    out.mkdir(parents=True, exist_ok=True)

    tasks = [_generate_image_for_scene(s, style, api_key, out) for s in state.scenes]
    await asyncio.gather(*tasks, return_exceptions=True)

    state.image_paths = [s.image_path for s in state.scenes if s.image_path]

    if not state.image_paths:
        state.stage_errors.append("Images: No images generated")


# ── Stage: Sync Timeline ────────────────────────────────────────────────────

def stage_sync(state: PipelineState):
    """Align images to audio timestamps."""
    current_ms = 0
    for scene in state.scenes:
        scene.start_ms = current_ms
        current_ms += scene.duration_ms
    state.total_duration_ms = current_ms


# ── Stage: Generate Captions ────────────────────────────────────────────────

def stage_captions(state: PipelineState, output_dir: Path | None = None):
    """Generate SRT captions from scenes."""
    out = output_dir or Path("pipeline_output") / state.job_id
    out.mkdir(parents=True, exist_ok=True)

    srt_path = out / "captions.srt"
    lines = []
    for i, scene in enumerate(state.scenes):
        start = _ms_to_srt_time(scene.start_ms)
        end = _ms_to_srt_time(scene.start_ms + scene.duration_ms)
        lines.append(f"{i + 1}")
        lines.append(f"{start} --> {end}")
        lines.append(scene.text)
        lines.append("")

    srt_path.write_text("\n".join(lines), encoding="utf-8")
    return str(srt_path)


def _ms_to_srt_time(ms: int) -> str:
    """Convert milliseconds to SRT time format HH:MM:SS,mmm."""
    h = ms // 3600000
    m = (ms % 3600000) // 60000
    s = (ms % 60000) // 1000
    millis = ms % 1000
    return f"{h:02d}:{m:02d}:{s:02d},{millis:03d}"


# ── Stage: Render Video ─────────────────────────────────────────────────────

def stage_render(state: PipelineState, output_dir: Path | None = None) -> str:
    """Render final video from images + audio + captions using FFmpeg."""
    out = output_dir or Path("pipeline_output") / state.job_id
    out.mkdir(parents=True, exist_ok=True)

    output_path = out / f"pipeline_{state.job_id}.mp4"

    # Build FFmpeg command with concat
    inputs = []
    for scene in state.scenes:
        if scene.image_path and scene.audio_path:
            inputs.extend([
                "-loop", "1",
                "-i", scene.image_path,
                "-i", scene.audio_path,
            ])

    if not inputs:
        # No valid scenes — create a placeholder video
        subprocess.run(
            [
                "ffmpeg", "-y", "-f", "lavfi",
                "-i", "color=c=0x10131a:s=1080x1920:d=10",
                "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
                "-t", "10",
                "-c:v", "libx264", "-preset", "fast",
                "-c:a", "aac", "-shortest",
                str(output_path),
            ],
            capture_output=True, timeout=60,
        )
        state.output_path = str(output_path)
        return str(output_path)

    # Build filter_complex for slideshow with audio
    n = len([s for s in state.scenes if s.image_path and s.audio_path])
    filter_parts = []
    for i in range(n):
        idx = i * 2
        dur = state.scenes[i].duration_ms / 1000 if state.scenes[i].duration_ms > 0 else 5
        filter_parts.append(f"[{idx}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p,trim=0:{dur},setpts=PTS-STARTPTS[v{i}]")
        filter_parts.append(f"[{idx + 1}:a]aresample=44100,atrim=0:{dur},asetpts=PTS-STARTPTS[a{i}]")

    # Concat
    v_parts = "".join(f"[v{i}]" for i in range(n))
    a_parts = "".join(f"[a{i}]" for i in range(n))
    filter_parts.append(f"{v_parts}{a_parts}concat=n={n}:v=1:a=1[outv][outa]")

    filter_complex = ";".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
    ] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-map", "[outa]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(output_path),
    ]

    result = subprocess.run(cmd, capture_output=True, timeout=300)

    if result.returncode != 0:
        # Fallback: simple concat
        state.stage_errors.append(f"Render: FFmpeg error, trying fallback")
        _render_fallback(state, output_path)

    state.output_path = str(output_path)
    return str(output_path)


def _render_fallback(state: PipelineState, output_path: Path):
    """Fallback render using simple concat demuxer."""
    out = output_path.parent
    list_file = out / "concat.txt"

    # Generate individual scene videos
    scene_videos = []
    for scene in state.scenes:
        if not scene.image_path or not scene.audio_path:
            continue
        scene_out = out / f"scene_{scene.index:03d}.mp4"
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-loop", "1", "-i", scene.image_path,
                "-i", scene.audio_path,
                "-c:v", "libx264", "-preset", "fast",
                "-c:a", "aac", "-shortest",
                "-t", str(scene.duration_ms / 1000) if scene.duration_ms > 0 else "5",
                str(scene_out),
            ],
            capture_output=True, timeout=60,
        )
        if scene_out.exists():
            scene_videos.append(scene_out)

    if not scene_videos:
        return

    list_file.write_text(
        "\n".join(f"file '{v}'" for v in scene_videos),
        encoding="utf-8",
    )

    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(list_file), "-c", "copy", str(output_path)],
        capture_output=True, timeout=120,
    )
    list_file.unlink(missing_ok=True)


# ── Full Pipeline Runner ────────────────────────────────────────────────────

async def run_pipeline(
    script: str,
    voice: str = "en-US-GuyNeural",
    speed: str = "+0%",
    style: str = "cinematic",
    gemini_key: str = "",
    on_progress: Callable[[str, float, str], None] | None = None,
) -> PipelineState:
    """Run the full script-to-video pipeline.

    Returns PipelineState with output_path and all intermediate data.
    """
    job_id = str(uuid.uuid4())[:12]
    state = PipelineState(job_id=job_id, script=script)
    output_dir = Path("pipeline_output") / job_id
    output_dir.mkdir(parents=True, exist_ok=True)

    def _progress(stage: str, pct: float, msg: str):
        state.stage = stage
        state.progress = pct
        state.message = msg
        if on_progress:
            on_progress(stage, pct, msg)

    try:
        # Stage 1: Split script
        _progress("split_script", 0.1, "Splitting script into scenes...")
        state.scenes = split_script(script)
        if not state.scenes:
            state.error = "No scenes generated from script"
            return state
        _progress("split_script", 0.15, f"Found {len(state.scenes)} scenes")

        # Stage 2: Generate TTS
        _progress("generate_tts", 0.2, "Generating voiceover audio...")
        await stage_tts(state, voice, speed, output_dir)
        _progress("generate_tts", 0.4, f"Generated {len(state.audio_paths)} audio files")

        # Stage 3: Generate Images
        _progress("generate_images", 0.45, "Generating images for scenes...")
        await stage_images(state, style, gemini_key, output_dir)
        _progress("generate_images", 0.65, f"Generated {len(state.image_paths)} images")

        # Stage 4: Sync Timeline
        _progress("sync_timeline", 0.7, "Syncing images to audio...")
        stage_sync(state)
        _progress("sync_timeline", 0.75, f"Total duration: {state.total_duration_ms / 1000:.1f}s")

        # Stage 5: Generate Captions
        _progress("generate_captions", 0.78, "Generating captions...")
        stage_captions(state, output_dir)
        _progress("generate_captions", 0.82, "Captions generated")

        # Stage 6: Render Video
        _progress("render_video", 0.85, "Rendering final video...")
        stage_render(state, output_dir)
        _progress("render_video", 1.0, f"Video rendered: {state.output_path}")

    except Exception as exc:
        state.error = str(exc)
        state.stage_errors.append(f"Pipeline error: {exc}")

    return state
