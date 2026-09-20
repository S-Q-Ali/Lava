"""ML-based manhwa panel detection using YOLO models.

Tiered approach:
- Tier 1: YOLO26-nano (~2.7 MB) — fast panel + text bbox detection
- Tier 2: YOLO26s-seg (~23 MB) — pixel-level panel + text + balloon masks

Models are lazy-loaded on first use. If ultralytics is not installed or
models are not downloaded, detection gracefully falls back to classical CV.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PanelDetection:
    """A single detected panel from ML inference."""
    x: int
    y: int
    w: int
    h: int
    confidence: float
    class_name: str  # "panel" | "text" | "balloon"


@dataclass(frozen=True)
class DetectionResult:
    """Full ML detection result for one image."""
    panels: list[PanelDetection]
    method: str  # "ml-nano" | "ml-seg"
    image_width: int
    image_height: int


class ManhwaDetector:
    """Singleton YOLO-based panel detector with tiered model support."""

    _nano_model = None
    _seg_model = None
    _nano_path: Optional[Path] = None
    _seg_path: Optional[Path] = None

    @classmethod
    def _models_dir(cls) -> Path:
        from lava_backend.config import get_config
        return get_config().root / "models"

    @classmethod
    def _nano_model_path(cls) -> Path:
        if cls._nano_path is None:
            cls._nano_path = cls._models_dir() / "manhwa-nano"
        return cls._nano_path

    @classmethod
    def _seg_model_path(cls) -> Path:
        if cls._seg_path is None:
            cls._seg_path = cls._models_dir() / "manhwa-seg"
        return cls._seg_path

    @classmethod
    def nano_installed(cls) -> bool:
        path = cls._nano_model_path()
        return path.exists() and any(path.glob("*.pt"))

    @classmethod
    def seg_installed(cls) -> bool:
        path = cls._seg_model_path()
        return path.exists() and any(path.glob("*.pt"))

    @classmethod
    def _find_pt_file(cls, directory: Path) -> Optional[Path]:
        """Find the first .pt file in a directory."""
        if not directory.exists():
            return None
        pt_files = list(directory.glob("*.pt"))
        return pt_files[0] if pt_files else None

    @classmethod
    def load_nano(cls) -> bool:
        """Load the nano model. Returns True if successful."""
        if cls._nano_model is not None:
            return True
        try:
            from ultralytics import YOLO
        except ImportError:
            logger.warning("ultralytics not installed; ML detection unavailable")
            return False
        pt_path = cls._find_pt_file(cls._nano_model_path())
        if pt_path is None:
            logger.info("Nano model not downloaded; ML detection unavailable")
            return False
        try:
            cls._nano_model = YOLO(str(pt_path))
            logger.info("Loaded nano model from %s", pt_path)
            return True
        except Exception as exc:
            logger.error("Failed to load nano model: %s", exc)
            return False

    @classmethod
    def load_seg(cls) -> bool:
        """Load the segmentation model. Returns True if successful."""
        if cls._seg_model is not None:
            return True
        try:
            from ultralytics import YOLO
        except ImportError:
            logger.warning("ultralytics not installed; ML detection unavailable")
            return False
        pt_path = cls._find_pt_file(cls._seg_model_path())
        if pt_path is None:
            logger.info("Seg model not downloaded; ML detection unavailable")
            return False
        try:
            cls._seg_model = YOLO(str(pt_path))
            logger.info("Loaded seg model from %s", pt_path)
            return True
        except Exception as exc:
            logger.error("Failed to load seg model: %s", exc)
            return False

    @classmethod
    def detect(cls, image_path: str | Path, confidence: float = 0.25) -> Optional[DetectionResult]:
        """Detect panels using nano model. Returns None if unavailable."""
        if not cls.load_nano():
            return None
        try:
            results = cls._nano_model.predict(
                source=str(image_path),
                conf=confidence,
                verbose=False,
            )
            if not results:
                return None
            result = results[0]
            img_h, img_w = result.orig_shape
            panels = []
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                class_name = result.names.get(cls_id, "panel")
                panels.append(PanelDetection(
                    x=int(x1),
                    y=int(y1),
                    w=int(x2 - x1),
                    h=int(y2 - y1),
                    confidence=conf,
                    class_name=class_name,
                ))
            return DetectionResult(
                panels=panels,
                method="ml-nano",
                image_width=img_w,
                image_height=img_h,
            )
        except Exception as exc:
            logger.error("Nano detection failed: %s", exc)
            return None

    @classmethod
    def detect_with_seg(cls, image_path: str | Path, confidence: float = 0.25) -> Optional[DetectionResult]:
        """Detect panels using segmentation model. Returns None if unavailable."""
        if not cls.load_seg():
            return None
        try:
            results = cls._seg_model.predict(
                source=str(image_path),
                conf=confidence,
                retina_masks=True,
                verbose=False,
            )
            if not results:
                return None
            result = results[0]
            img_h, img_w = result.orig_shape
            panels = []
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                class_name = result.names.get(cls_id, "panel")
                panels.append(PanelDetection(
                    x=int(x1),
                    y=int(y1),
                    w=int(x2 - x1),
                    h=int(y2 - y1),
                    confidence=conf,
                    class_name=class_name,
                ))
            return DetectionResult(
                panels=panels,
                method="ml-seg",
                image_width=img_w,
                image_height=img_h,
            )
        except Exception as exc:
            logger.error("Seg detection failed: %s", exc)
            return None

    @classmethod
    def detect_auto(cls, image_path: str | Path, confidence: float = 0.25) -> Optional[DetectionResult]:
        """Auto-detect: try nano first, then seg if nano fails."""
        result = cls.detect(image_path, confidence)
        if result and len(result.panels) > 0:
            return result
        result = cls.detect_with_seg(image_path, confidence)
        if result and len(result.panels) > 0:
            return result
        return None
