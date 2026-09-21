"""PDF page extraction for manhwa/webtoon import.

Converts each page of a PDF to a PNG image using PyMuPDF (fitz).
Skips text-only pages (table of contents, copyright, etc.) by checking
for visual content in the rasterized pixmap.
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

from lava_backend.manhwa.errors import ManhwaError

DEFAULT_DPI = 150


def _page_has_visual_content(page: fitz.Page, dpi: int = DEFAULT_DPI, min_visual_ratio: float = 0.01) -> bool:
    """Return True if the page contains meaningful visual content.

    Renders the page at low resolution and checks if there are enough
    non-white pixels to consider it a visual page. This catches both
    embedded images AND vector drawings (rectangles, shapes, illustrations).

    A page is considered text-only if it is almost entirely white/blank
    after rendering.
    """
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=matrix, alpha=False)

    if pix.width == 0 or pix.height == 0:
        return False

    # Sample pixels to check for visual content
    # Look at a grid of sample points across the image
    samples_x = min(pix.width, 40)
    samples_y = min(pix.height, 120)
    step_x = max(1, pix.width // samples_x)
    step_y = max(1, pix.height // samples_y)

    non_white_count = 0
    total_count = 0

    for y in range(0, pix.height, step_y):
        for x in range(0, pix.width, step_x):
            pixel = pix.pixel(x, y)
            r, g, b = pixel[0], pixel[1], pixel[2]
            total_count += 1
            # Consider a pixel "visual" if it's not near-white (R,G,B all > 240)
            if r < 240 or g < 240 or b < 240:
                non_white_count += 1

    if total_count == 0:
        return False

    return (non_white_count / total_count) >= min_visual_ratio


def extract_pages(
    pdf_path: str | Path,
    output_dir: str | Path,
    dpi: int = DEFAULT_DPI,
) -> list[Path]:
    """Extract each visual PDF page as a PNG image, skipping text-only pages.

    Args:
        pdf_path: Path to the PDF file.
        output_dir: Directory to write extracted page images.
        dpi: Resolution for rasterization (150 is good for analysis).

    Returns:
        List of paths to extracted PNG images, in page order.
        Only pages with meaningful visual content are included.

    Raises:
        ManhwaError: If PDF cannot be read or has no visual pages.
    """
    pdf_path = Path(pdf_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        doc = fitz.open(str(pdf_path))
    except Exception as exc:
        raise ManhwaError(f"Cannot open PDF: {exc}") from exc

    try:
        if doc.page_count == 0:
            raise ManhwaError("PDF has no pages")

        pages: list[Path] = []
        zoom = dpi / 72.0
        matrix = fitz.Matrix(zoom, zoom)

        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            if not _page_has_visual_content(page, dpi):
                continue
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            out_path = output_dir / f"page_{page_num + 1:03d}.png"
            pix.save(str(out_path))
            pages.append(out_path)

        if not pages:
            raise ManhwaError("PDF has no pages with visual content (all pages are text-only or blank)")

        return pages
    finally:
        doc.close()


def get_page_count(pdf_path: str | Path) -> int:
    """Return the number of pages in a PDF without extracting them."""
    try:
        doc = fitz.open(str(pdf_path))
    except Exception as exc:
        raise ManhwaError(f"Cannot open PDF: {exc}") from exc
    try:
        return doc.page_count
    finally:
        doc.close()
