"""Stage 5: Face tracking — MediaPipe for dynamic reframing."""
from __future__ import annotations
from ..models.crop_path import CropPath, CropFrame


def track_faces(video_path: str, source_width: int, source_height: int, target_width: int = 1080, target_height: int = 1920, sample_fps: float = 10.0, smooth_alpha: float = 0.3) -> CropPath:
    try:
        import cv2
        import mediapipe as mp
    except ImportError:
        raise ImportError("pip install mediapipe opencv-python-headless numpy")
    mp_face = mp.solutions.face_detection
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")
    source_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = max(1, int(source_fps / sample_fps))
    crop_frames: list[CropFrame] = []
    last_x = last_y = None
    print(f"Tracking faces (sampling every {frame_interval} frames)...")
    with mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_det:
        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % frame_interval != 0:
                frame_idx += 1
                continue
            t = frame_idx / source_fps
            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_det.process(rgb)
            x = y = fw = fh = confidence = 0.0
            if results.detections:
                best = max(results.detections, key=lambda d: (d.location_data.relative_bounding_box.width * w) * (d.location_data.relative_bounding_box.height * h))
                bbox = best.location_data.relative_bounding_box
                confidence = best.score[0]
                fw, fh = bbox.width * w, bbox.height * h
                x, y = bbox.xmin * w + fw / 2, bbox.ymin * h + fh / 2
                if last_x is not None:
                    x = smooth_alpha * x + (1 - smooth_alpha) * last_x
                    y = smooth_alpha * y + (1 - smooth_alpha) * last_y
                last_x, last_y = x, y
            else:
                x, y = (last_x, last_y) if last_x is not None else (source_width / 2, source_height / 2)
            crop_frames.append(CropFrame(t=t, x=x, y=y, confidence=confidence, width=fw, height=fh))
            frame_idx += 1
    cap.release()
    print(f"Tracked {len(crop_frames)} frames, {sum(1 for f in crop_frames if f.confidence > 0)} with face detected")
    return CropPath(frames=crop_frames, source_width=source_width, source_height=source_height, target_width=target_width, target_height=target_height, smoothed=True)
