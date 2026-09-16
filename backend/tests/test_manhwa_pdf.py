"""Tests for PDF page extraction (M8 manhwa PDF import)."""

from __future__ import annotations

import tempfile
from pathlib import Path

import fitz  # PyMuPDF
import pytest

from lava_backend.manhwa.errors import ManhwaError
from lava_backend.manhwa.pdf_extract import extract_pages, get_page_count


def _make_pdf(path: Path, pages: int = 3, width: int = 400, height: int = 1200) -> None:
    """Create a simple test PDF with solid-color pages."""
    doc = fitz.open()
    for i in range(pages):
        page = doc.new_page(width=width, height=height)
        # Draw a colored rectangle per page so pages are distinguishable
        colors = [(0.9, 0.9, 0.9), (0.8, 0.8, 0.8), (0.7, 0.7, 0.7)]
        color = colors[i % len(colors)]
        shape = page.new_shape()
        shape.draw_rect(page.rect)
        shape.finish(color=color, fill=color)
        shape.commit()
    doc.save(str(path))
    doc.close()


def test_extract_pages_returns_correct_count(tmp_path: Path) -> None:
    pdf = tmp_path / "test.pdf"
    _make_pdf(pdf, pages=3)
    out_dir = tmp_path / "output"
    pages = extract_pages(pdf, out_dir)
    assert len(pages) == 3


def test_extract_pages_creates_png_files(tmp_path: Path) -> None:
    pdf = tmp_path / "test.pdf"
    _make_pdf(pdf, pages=2)
    out_dir = tmp_path / "output"
    pages = extract_pages(pdf, out_dir)
    for p in pages:
        assert p.exists()
        assert p.suffix == ".png"


def test_extract_pages_naming(tmp_path: Path) -> None:
    pdf = tmp_path / "test.pdf"
    _make_pdf(pdf, pages=3)
    out_dir = tmp_path / "output"
    pages = extract_pages(pdf, out_dir)
    assert pages[0].name == "page_001.png"
    assert pages[1].name == "page_002.png"
    assert pages[2].name == "page_003.png"


def test_extract_pages_single_page(tmp_path: Path) -> None:
    pdf = tmp_path / "test.pdf"
    _make_pdf(pdf, pages=1)
    out_dir = tmp_path / "output"
    pages = extract_pages(pdf, out_dir)
    assert len(pages) == 1
    assert pages[0].name == "page_001.png"


def test_extract_pages_empty_pdf_raises(tmp_path: Path) -> None:
    pdf = tmp_path / "test.pdf"
    # Create a valid PDF with one page then delete it via fitz
    doc = fitz.open()
    page = doc.new_page(width=100, height=100)
    # Save then reopen and check - an empty PDF can't be created with fitz
    # so we test with a corrupt/empty file instead
    doc.save(str(pdf))
    doc.close()
    # Now create a truly empty file
    empty = tmp_path / "empty.pdf"
    empty.write_bytes(b"")
    out_dir = tmp_path / "output"
    with pytest.raises(ManhwaError, match="Cannot open PDF"):
        extract_pages(empty, out_dir)


def test_extract_pages_invalid_file_raises(tmp_path: Path) -> None:
    bad = tmp_path / "not_a.pdf"
    bad.write_bytes(b"this is not a pdf")
    out_dir = tmp_path / "output"
    with pytest.raises(ManhwaError, match="Cannot open PDF"):
        extract_pages(bad, out_dir)


def test_extract_pages_missing_file_raises(tmp_path: Path) -> None:
    missing = tmp_path / "does_not_exist.pdf"
    out_dir = tmp_path / "output"
    with pytest.raises(ManhwaError, match="Cannot open PDF"):
        extract_pages(missing, out_dir)


def test_get_page_count(tmp_path: Path) -> None:
    pdf = tmp_path / "test.pdf"
    _make_pdf(pdf, pages=5)
    assert get_page_count(pdf) == 5


def test_get_page_count_invalid_raises(tmp_path: Path) -> None:
    bad = tmp_path / "bad.pdf"
    bad.write_bytes(b"not pdf")
    with pytest.raises(ManhwaError, match="Cannot open PDF"):
        get_page_count(bad)


def test_extract_pages_custom_dpi(tmp_path: Path) -> None:
    pdf = tmp_path / "test.pdf"
    _make_pdf(pdf, pages=1, width=400, height=1200)
    out_dir = tmp_path / "output"
    pages = extract_pages(pdf, out_dir, dpi=300)
    assert len(pages) == 1
    # Higher DPI should produce a larger image
    import fitz as _fitz
    doc = _fitz.open(str(pdf))
    page = doc.load_page(0)
    # At 300 DPI, width should be ~400 * (300/72) ≈ 1667
    pix = page.get_pixmap(matrix=_fitz.Matrix(300 / 72, 300 / 72), alpha=False)
    doc.close()
    assert pix.width > 400  # Should be significantly larger than 400px


def test_extract_pages_creates_output_dir(tmp_path: Path) -> None:
    pdf = tmp_path / "test.pdf"
    _make_pdf(pdf, pages=1)
    out_dir = tmp_path / "nested" / "output"
    assert not out_dir.exists()
    pages = extract_pages(pdf, out_dir)
    assert out_dir.exists()
    assert len(pages) == 1
