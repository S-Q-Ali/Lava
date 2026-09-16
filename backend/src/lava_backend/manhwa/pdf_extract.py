"""PDF page extraction for manhwa/webtoon import.

Converts each page of a PDF to a PNG image using PyMuPDF (fitz).
Each page is treated as an independent vertical strip for panel detection.
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

from lava_backend.manhwa.errors import ManhwaError

DEFAULT_DPI = 150


def extract_pages(
    pdf_path: str | Path,
    output_dir: str | Path,
    dpi: int = DEFAULT_DPI,
) -> list[Path]:
    """Extract each PDF page as a PNG image.

    Args:
        pdf_path: Path to the PDF file.
        output_dir: Directory to write extracted page images.
        dpi: Resolution for rasterization (150 is good for analysis).

    Returns:
        List of paths to extracted PNG images, in page order.

    Raises:
        ManhwaError: If PDF cannot be read or is empty.
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
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            out_path = output_dir / f"page_{page_num + 1:03d}.png"
            pix.save(str(out_path))
            pages.append(out_path)

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
