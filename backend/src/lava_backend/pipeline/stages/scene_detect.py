"""Stage 3: Scene detection — PySceneDetect ContentDetector."""
from __future__ import annotations
from typing import Any


def detect_scenes(video_path: str, threshold: float = 27.0) -> list[dict[str, Any]]:
    try:
        from scenedetect import detect, ContentDetector
    except ImportError:
        raise ImportError("pip install scenedetect[opencv]")
    print(f"Detecting scenes (threshold={threshold})...")
    scene_list = detect(video_path, ContentDetector(threshold=threshold))
    scenes = []
    for i, (start_time, end_time) in enumerate(scene_list):
        start_sec = start_time.get_seconds()
        end_sec = end_time.get_seconds()
        scenes.append({"start": start_sec, "end": end_sec, "duration": end_sec - start_sec, "scene_index": i})
    print(f"Detected {len(scenes)} scenes")
    return scenes
