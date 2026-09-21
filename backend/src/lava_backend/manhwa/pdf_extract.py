"""PDF page extraction for manhwa/webtoon import.

Converts each page of a PDF to a PNG image using PyMuPDF (fitz).
Skips blank pages using pixel sampling — keeps all non-blank pages
(including manhwa panels, text pages, and anything with visual content).
Manhwa PDFs often use Form XObjects which make image/drawing detection
unreliable, so we rely on rendered pixel sampling instead.
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

from lava_backend.manhwa.errors import ManhwaError

DEFAULT_DPI = 150


def _should_extract_page(page: fitz.Page, dpi: int = DEFAULT_DPI) -> bool:
    """Skip blank pages using pixel sampling. Keep everything else.

    Renders the page at low resolution and checks if there are enough
    non-white pixels to consider it non-blank. Uses an 80×240 sampling
    grid with a 0.3% threshold — catches blank pages while keeping
    manhwa pages with large white gutters between panels.
    """
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=matrix, alpha=False)

    if pix.width == 0 or pix.height == 0:
        return False

    samples_x = min(pix.width, 80)
    samples_y = min(pix.height, 240)
    step_x = max(1, pix.width // samples_x)
    step_y = max(1, pix.height // samples_y)

    non_white_count = 0
    total_count = 0

    for y in range(0, pix.height, step_y):
        for x in range(0, pix.width, step_x):
            pixel = pix.pixel(x, y)
            r, g, b = pixel[0], pixel[1], pixel[2]
            total_count += 1
            if r < 240 or g < 240 or b < 240:
                non_white_count += 1

    if total_count == 0:
        return False

    # 0.3% threshold — keeps manhwa pages with white gutters
    return (non_white_count / total_count) >= 0.003


def extract_pages(
    pdf_path: str | Path,
    output_dir: str | Path,
    dpi: int = DEFAULT_DPI,
) -> list[Path]:
    """Extract each visual PDF page as a PNG image, skipping blank/text-only pages.

    Args:
        pdf_path: Path to the PDF file.
        output_dir: Directory to write extracted page images.
        dpi: Resolution for rasterization (150 is good for analysis).

    Returns:
        List of paths to extracted PNG images, in page order.
        Only pages with meaningful visual content (manhwa panels) are included.

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
            if not _should_extract_page(page, dpi):
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
