"""M7 module 6: manhwa HTTP API — storage/HTTP glue over modules 1–5.

Pure layers hold every rule; this router adds project-local persistence
(under `cache_dir/manhwa/<source_id>/`), multipart upload + detection, panel
correction ops, export bundles, asset serving and strip delete/reset. All
errors translate to `ApiError` so the sidecar's `{error:{code,message}}`
contract holds.
"""

from __future__ import annotations

import re
import shutil
import uuid
import zipfile

from ..fs import rmtree_safe
from pathlib import Path
from tempfile import SpooledTemporaryFile

from fastapi import APIRouter, File, Form, Request, Response, UploadFile
from fastapi.responses import StreamingResponse

from lava_backend.errors import ApiError
from lava_backend.manhwa import correct
from lava_backend.manhwa.detect import detect_strip, _open_source
from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.export import encode_panel
from lava_backend.manhwa.panels import StripRegistry, panel_to_dict
from lava_backend.manhwa import export as export_mod

router = APIRouter()

SOURCE_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")
IMAGE_CONTENT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}
MIME_BY_FORMAT = {
    "png": "image/png",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "webp": "image/webp",
}
_PANEL_OP_META = {
    "split": {"panelId"},
    "merge": {"ids"},
    "adjust": {"panelId"},
    "delete": {"panelId"},
    "add": None,
    "reorder": {"ids"},
    "reset": set(),
}


def manhwa_dir(config) -> Path:
    return config.cache_dir / "manhwa"


def strip_dir(config, source_id: str) -> Path:
    if not SOURCE_ID_RE.fullmatch(source_id):
        raise ValueError(f"invalid source id {source_id!r}")
    return manhwa_dir(config) / source_id


def new_source_id() -> str:
    return "s" + uuid.uuid4().hex[:12]


def load_registry(config, source_id: str) -> StripRegistry:
    path = strip_dir(config, source_id) / "registry.json"
    if not path.exists():
        raise ApiError(404, "NOT_FOUND", f"no manhwa strip {source_id!r}")
    try:
        return StripRegistry.load(path)
    except Exception as exc:
        raise ApiError(422, "REGISTRY_INVALID", f"strip registry corrupt: {exc}") from exc


def _source_path(registry: StripRegistry, config) -> Path:
    """Resolve the stored original to its on-disk location.

    `registry.source_file` holds only the file name (module-2 convention);
    the original always lives at `strip_dir/config, source_id)/<name>`.
    """
    return strip_dir(config, registry.source_id) / Path(registry.source_file).name


def _serialize(registry: StripRegistry) -> dict:
    result = {
        "sourceId": registry.source_id,
        "sourceFile": registry.source_file,
        "width": registry.width,
        "height": registry.height,
        "mime": registry.mime,
        "panels": [panel_to_dict(p) for p in registry.panels],
    }
    if registry.parent_id is not None:
        result["parentId"] = registry.parent_id
    if registry.source_name is not None:
        result["sourceName"] = registry.source_name
    return result


def _summary(registry: StripRegistry) -> dict:
    panels = registry.panels
    result = {
        "sourceId": registry.source_id,
        "sourceFile": registry.source_file,
        "width": registry.width,
        "height": registry.height,
        "mime": registry.mime,
        "panelCount": len(panels),
        "correctedCount": sum(1 for p in panels if p.user_corrected),
    }
    if registry.parent_id is not None:
        result["parentId"] = registry.parent_id
    if registry.source_name is not None:
        result["sourceName"] = registry.source_name
    return result


def _regenerate_panel_png(registry: StripRegistry, panel_id: str) -> bytes:
    from lava_backend.config import get_config

    panel = next((p for p in registry.panels if p.id == panel_id), None)
    if panel is None:
        raise ApiError(404, "NOT_FOUND", f"no panel {panel_id!r} in strip {registry.source_id!r}")
    source_image, _, _ = _open_source(_source_path(registry, get_config()))
    return encode_panel(export_mod.crop_panel(source_image, panel), fmt="png")


# -- read -------------------------------------------------------------------

@router.get("/strips")
def list_strips(request: Request):
    from lava_backend.config import get_config

    base = manhwa_dir(get_config())
    strips = []
    if base.exists():
        for registry in sorted(base.glob("*")):
            path = registry / "registry.json"
            if not path.exists():
                continue
            try:
                strips.append(_summary(StripRegistry.load(path)))
            except Exception:
                continue
    return {"strips": strips}


@router.get("/groups")
def list_groups(request: Request):
    """Return strips grouped by parentId. Strips without parentId → standalone groups."""
    from collections import defaultdict
    from lava_backend.config import get_config

    base = manhwa_dir(get_config())
    all_strips: list[dict] = []
    if base.exists():
        for registry_dir in sorted(base.glob("*")):
            path = registry_dir / "registry.json"
            if not path.exists():
                continue
            try:
                all_strips.append(_summary(StripRegistry.load(path)))
            except Exception:
                continue

    # Group by parentId
    grouped: dict[str, list[dict]] = defaultdict(list)
    for strip in all_strips:
        pid = strip.get("parentId")
        grouped[pid or strip["sourceId"]].append(strip)

    groups = []
    for gid, pages in grouped.items():
        # sourceName = first non-null sourceName in the group
        source_name = None
        for p in pages:
            sn = p.get("sourceName")
            if sn:
                source_name = sn
                break
        groups.append({
            "groupId": gid,
            "sourceName": source_name,
            "pageCount": len(pages),
            "totalPanels": sum(p.get("panelCount", 0) for p in pages),
            "pages": pages,
        })

    # Sort by most recent (last page in group has highest sourceId = most recent)
    groups.sort(key=lambda g: g["pages"][-1]["sourceId"] if g["pages"] else "", reverse=True)
    return {"groups": groups}


@router.get("/strips/{source_id}")
def get_strip(source_id: str):
    from lava_backend.config import get_config

    try:
        registry = load_registry(get_config(), source_id)
    except ValueError as exc:
        raise ApiError(422, "INVALID_SOURCE_ID", str(exc)) from exc
    return _serialize(registry)


@router.get("/strips/{source_id}/source")
def serve_source(source_id: str):
    from lava_backend.config import get_config

    registry = load_registry(get_config(), source_id)
    path = _source_path(registry, get_config())
    if not path.exists():
        raise ApiError(404, "SOURCE_MISSING", "source image missing from disk")
    return Response(
        content=path.read_bytes(),
        media_type=MIME_BY_FORMAT.get(registry.mime.lower(), "application/octet-stream"),
        headers={"Cache-Control": "no-store"},
    )


@router.get("/strips/{source_id}/panels/{panel_id}")
def serve_panel(source_id: str, panel_id: str):
    from lava_backend.config import get_config

    registry = load_registry(get_config(), source_id)
    return Response(
        content=_regenerate_panel_png(registry, panel_id),
        media_type="image/png",
        headers={"Cache-Control": "no-store"},
    )


# -- write ------------------------------------------------------------------

@router.post("/strips", status_code=201)
async def upload_strip(request: Request, file: UploadFile | None = File(default=None)):
    from lava_backend.config import get_config

    if file is None:
        raise ApiError(400, "NO_FILE", "Add a strip image to analyze.")
    content_type = (file.content_type or "").lower()
    ext = IMAGE_CONTENT.get(content_type, ".png")
    data = await file.read()
    if not data:
        raise ApiError(400, "NO_FILE", "The selected strip image is empty.")

    config = get_config()
    source_id = new_source_id()
    base = strip_dir(config, source_id)
    base.mkdir(parents=True, exist_ok=True)
    source_path = base / f"source{ext}"
    try:
        source_path.write_bytes(data)
    except OSError as exc:
        raise ApiError(500, "STORAGE_FAILED", f"could not store strip: {exc}") from exc

    try:
        result = detect_strip(
            source_path,
            source_id=source_id,
            save=True,
            cache_dir=config.cache_dir,
        )
    except Exception as exc:
        rmtree_safe(base, ignore_errors=True)
        raise ApiError(422, "MANHWA_DETECT_FAILED", f"panel detection failed: {exc}") from exc
    return result


@router.post("/strips/pdf", status_code=201)
async def upload_pdf(request: Request, file: UploadFile | None = File(default=None)):
    """Upload a manhwa PDF: extract each page as a strip and run panel detection."""
    from lava_backend.config import get_config
    from lava_backend.manhwa.pdf_extract import extract_pages

    if file is None:
        raise ApiError(400, "NO_FILE", "Add a PDF file to analyze.")
    content_type = (file.content_type or "").lower()
    if "pdf" not in content_type and not (file.filename or "").lower().endswith(".pdf"):
        raise ApiError(400, "NOT_PDF", "File must be a PDF.")
    data = await file.read()
    if not data:
        raise ApiError(400, "NO_FILE", "The selected PDF is empty.")

    config = get_config()
    # Store the PDF temporarily for extraction
    pdf_id = new_source_id()
    pdf_dir = config.cache_dir / "manhwa" / pdf_id
    pdf_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = pdf_dir / "source.pdf"
    try:
        pdf_path.write_bytes(data)
    except OSError as exc:
        raise ApiError(500, "STORAGE_FAILED", f"could not store PDF: {exc}") from exc

    # Extract pages as PNG images
    pages_dir = pdf_dir / "pages"
    try:
        page_paths = extract_pages(pdf_path, pages_dir)
    except Exception as exc:
        rmtree_safe(pdf_dir, ignore_errors=True)
        raise ApiError(422, "PDF_EXTRACT_FAILED", f"PDF extraction failed: {exc}") from exc

    # Run panel detection on each page
    strips = []
    for page_path in page_paths:
        page_id = new_source_id()
        page_strip_dir = strip_dir(config, page_id)
        page_strip_dir.mkdir(parents=True, exist_ok=True)
        dest = page_strip_dir / f"source{page_path.suffix}"
        try:
            dest.write_bytes(page_path.read_bytes())
        except OSError as exc:
            rmtree_safe(page_strip_dir, ignore_errors=True)
            continue
        try:
            result = detect_strip(
                dest,
                source_id=page_id,
                save=True,
                cache_dir=config.cache_dir,
            )
            strips.append({
                "sourceId": result["sourceId"],
                "sourceFile": result["sourceFile"],
                "width": result["width"],
                "height": result["height"],
                "mime": result["mime"],
                "panelCount": len(result["panels"]),
                "panels": result["panels"],
            })
        except Exception:
            rmtree_safe(page_strip_dir, ignore_errors=True)
            continue

    # Clean up the temporary PDF
    rmtree_safe(pdf_dir, ignore_errors=True)

    if not strips:
        raise ApiError(422, "NO_PANELS", "No panels could be detected from the PDF.")

    return {"strips": strips}


# -- two-phase upload: upload first, detect on demand -----------------------

@router.post("/strips/upload", status_code=201)
async def upload_strip_only(request: Request, file: UploadFile | None = File(default=None)):
    """Save a strip image WITHOUT running detection. Returns stripId for later detection."""
    from lava_backend.config import get_config

    if file is None:
        raise ApiError(400, "NO_FILE", "Add a strip image to analyze.")
    content_type = (file.content_type or "").lower()
    ext = IMAGE_CONTENT.get(content_type, ".png")
    data = await file.read()
    if not data:
        raise ApiError(400, "NO_FILE", "The selected strip image is empty.")

    config = get_config()
    source_id = new_source_id()
    base = strip_dir(config, source_id)
    base.mkdir(parents=True, exist_ok=True)
    source_path = base / f"source{ext}"
    try:
        source_path.write_bytes(data)
    except OSError as exc:
        raise ApiError(500, "STORAGE_FAILED", f"could not store strip: {exc}") from exc

    from PIL import Image

    try:
        with Image.open(source_path) as probe:
            w, h = probe.size
            mime = (probe.format or ext.lstrip(".")).lower()
    except Exception as exc:
        raise ApiError(422, "IMAGE_INVALID", f"could not read image: {exc}") from exc

    StripRegistry(
        path=base / "registry.json",
        source_id=source_id,
        source_file=source_path.name,
        width=w,
        height=h,
        mime=mime,
        panels=[],
    ).save()

    return {"stripId": source_id, "fileName": file.filename or f"source{ext}"}


@router.post("/strips/pdf-upload", status_code=201)
async def upload_pdf_only(request: Request, file: UploadFile | None = File(default=None)):
    """Save a PDF and extract pages as images WITHOUT running detection. Returns page stripIds."""
    from lava_backend.config import get_config
    from lava_backend.manhwa.pdf_extract import extract_pages

    if file is None:
        raise ApiError(400, "NO_FILE", "Add a PDF file to analyze.")
    content_type = (file.content_type or "").lower()
    if "pdf" not in content_type and not (file.filename or "").lower().endswith(".pdf"):
        raise ApiError(400, "NOT_PDF", "File must be a PDF.")
    data = await file.read()
    if not data:
        raise ApiError(400, "NO_FILE", "The selected PDF is empty.")

    config = get_config()
    pdf_id = new_source_id()
    pdf_dir = config.cache_dir / "manhwa" / pdf_id
    pdf_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = pdf_dir / "source.pdf"
    try:
        pdf_path.write_bytes(data)
    except OSError as exc:
        raise ApiError(500, "STORAGE_FAILED", f"could not store PDF: {exc}") from exc

    pages_dir = pdf_dir / "pages"
    try:
        page_paths = extract_pages(pdf_path, pages_dir)
    except Exception as exc:
        rmtree_safe(pdf_dir, ignore_errors=True)
        raise ApiError(422, "PDF_EXTRACT_FAILED", f"PDF extraction failed: {exc}") from exc

    pages = []
    for page_path in page_paths:
        page_id = new_source_id()
        page_strip_dir = strip_dir(config, page_id)
        page_strip_dir.mkdir(parents=True, exist_ok=True)
        dest = page_strip_dir / f"source{page_path.suffix}"
        try:
            dest.write_bytes(page_path.read_bytes())
        except OSError:
            rmtree_safe(page_strip_dir, ignore_errors=True)
            continue

        from PIL import Image

        try:
            with Image.open(dest) as probe:
                w, h = probe.size
                mime = (probe.format or dest.suffix.lstrip(".")).lower()
        except Exception:
            rmtree_safe(page_strip_dir, ignore_errors=True)
            continue

        StripRegistry(
            path=page_strip_dir / "registry.json",
            source_id=page_id,
            source_file=dest.name,
            width=w,
            height=h,
            mime=mime,
            panels=[],
            parent_id=pdf_id,
            source_name=file.filename,
        ).save()
        pages.append({"stripId": page_id, "fileName": page_path.name})

    rmtree_safe(pdf_dir, ignore_errors=True)

    if not pages:
        raise ApiError(422, "NO_PAGES", "No pages could be extracted from the PDF.")

    return {"pages": pages, "fileName": file.filename or "document.pdf"}


@router.post("/strips/{source_id}/detect")
def detect_panels(source_id: str):
    """Run panel detection on an already-uploaded strip."""
    from lava_backend.config import get_config

    config = get_config()
    try:
        base = strip_dir(config, source_id)
    except ValueError as exc:
        raise ApiError(422, "INVALID_SOURCE_ID", str(exc)) from exc

    if not base.exists():
        raise ApiError(404, "NOT_FOUND", f"no manhwa strip {source_id!r}")

    source_files = list(base.glob("source.*"))
    if not source_files:
        raise ApiError(404, "SOURCE_MISSING", "source image missing from disk")

    source_path = source_files[0]
    try:
        result = detect_strip(
            source_path,
            source_id=source_id,
            save=True,
            cache_dir=config.cache_dir,
        )
    except Exception as exc:
        raise ApiError(422, "MANHWA_DETECT_FAILED", f"panel detection failed: {exc}") from exc
    return result


@router.patch("/strips/{source_id}/panels")
async def apply_correction(source_id: str, request: Request):
    from lava_backend.config import get_config

    config = get_config()
    registry = load_registry(config, source_id)
    try:
        raw = await request.json()
    except Exception as exc:
        raise ApiError(422, "CORRECTION_INVALID", "correction body must be valid JSON") from exc
    op = raw.get("op") if isinstance(raw, dict) else None
    if op not in _PANEL_OP_META:
        raise ApiError(422, "CORRECTION_INVALID", f"unknown correction op {op!r}")

    try:
        panels = _apply_panels(registry, raw, op)
    except ValueError as exc:
        raise ApiError(422, "CORRECTION_INVALID", str(exc)) from exc
    except Exception as exc:
        raise ApiError(422, "CORRECTION_FAILED", str(exc)) from exc

    registry.panels = panels
    registry.save()
    return _serialize(registry)


def _apply_panels(registry: StripRegistry, raw: dict, op: str) -> list:
    panels = registry.panels
    if op == "split":
        return correct.split_panel(panels, raw["panelId"], int(raw["y"]))
    if op == "merge":
        ids = raw["ids"]
        if len(ids) != 2:
            raise ValueError("merge needs exactly two panel ids")
        return correct.merge_panels(panels, ids[0], ids[1])
    if op == "adjust":
        return correct.adjust_panel(
            panels, raw["panelId"], x=int(raw["x"]), y=int(raw["y"]),
            w=int(raw["w"]), h=int(raw["h"]),
            source_w=registry.width, source_h=registry.height,
        )
    if op == "delete":
        return correct.delete_panel(panels, raw["panelId"])
    if op == "add":
        return correct.add_panel(
            panels, x=int(raw["x"]), y=int(raw["y"]),
            w=int(raw["w"]), h=int(raw["h"]),
            source_w=registry.width, source_h=registry.height,
            after_id=raw.get("afterId"),
        )
    if op == "reorder":
        return correct.reorder_panels(panels, raw["ids"])
    if op == "reset":
        return []
    raise ValueError(f"unknown correction op {op!r}")


@router.post("/strips/{source_id}/redetect")
def re_detect_strip(source_id: str):
    from lava_backend.config import get_config

    config = get_config()
    registry = load_registry(config, source_id)
    path = _source_path(registry, get_config())
    if not path.exists():
        raise ApiError(404, "SOURCE_MISSING", "source image missing from disk")
    try:
        result = detect_strip(path, source_id=source_id, save=True, cache_dir=config.cache_dir)
    except Exception as exc:
        raise ApiError(422, "MANHWA_DETECT_FAILED", f"re-detect failed: {exc}") from exc
    return result


@router.delete("/strips", status_code=204)
def delete_all_strips():
    from lava_backend.config import get_config

    config = get_config()
    base = manhwa_dir(config)
    if base.exists():
        for child in base.iterdir():
            if child.is_dir():
                rmtree_safe(child, ignore_errors=True)
    return Response(status_code=204)


@router.delete("/strips/{source_id}", status_code=204)
def delete_strip(source_id: str):
    from lava_backend.config import get_config

    config = get_config()
    base = strip_dir(config, source_id)
    if not base.exists():
        raise ApiError(404, "NOT_FOUND", f"no manhwa strip {source_id!r}")
    rmtree_safe(base, ignore_errors=True)
    return Response(status_code=204)


# -- export ------------------------------------------------------------------

@router.get("/strips/{source_id}/export")
def export_strip(source_id: str, format: str = "png", quality: int = export_mod.JPG_QUALITY_DEFAULT):
    from lava_backend.config import get_config

    registry = load_registry(get_config(), source_id)
    source_image, _, _ = _open_source(_source_path(registry, get_config()))
    try:
        ordered = export_mod.normalize_panels(registry.panels)
    except ManhwaError as exc:
        raise ApiError(422, "EXPORT_INVALID", str(exc)) from exc
    except Exception as exc:
        raise ApiError(422, "EXPORT_FAILED", str(exc)) from exc
    manifest_payload = __import__("json").dumps({
        "format": format,
        "panels": export_mod.manifest_rows(ordered, fmt=format),
    }, indent=2)

    def emit():
        # Zip central directory forces a single pass, so the archive is buffered
        # to a spool (RAM up to 1 MiB, disk beyond) and streamed back — the whole
        # export never sits in memory: one panel at a time, 64 KiB chunks out.
        with SpooledTemporaryFile(max_size=1 << 20) as spool:
            with zipfile.ZipFile(spool, "w", zipfile.ZIP_DEFLATED) as archive:
                archive.writestr("manifest.json", manifest_payload)
                for name, data in export_mod.iter_export_files(
                    source_image, ordered, fmt=format, quality=quality
                ):
                    archive.writestr(name, data)
            spool.seek(0)
            while chunk := spool.read(64 * 1024):
                yield chunk

    return StreamingResponse(
        emit(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{source_id}-panels.zip"',
        },
    )