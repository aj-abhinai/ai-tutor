# PDF text extraction with layout information
"""
PDF Extractor - Extract raw text with layout information from PDF files.
Improved column detection and layout preservation.
"""
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import fitz


@dataclass
class TextBlock:
    """Represents a text block with position info."""
    text: str
    x0: float
    y0: float
    x1: float
    y1: float
    font_size: float
    font_name: str
    is_bold: bool = False
    page_num: int = 0


@dataclass
class ExtractedPage:
    """Extracted content from a single page."""
    page_num: int
    width: float
    height: float
    blocks: List[TextBlock] = field(default_factory=list)
    raw_text: str = ""


@dataclass 
class ExtractedPDF:
    """Complete extracted PDF data."""
    source_path: str
    pages: List[ExtractedPage] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)


def _needs_space(prev_text: str, next_text: str, gap: float, 
                 prev_size: Optional[float] = None, 
                 next_size: Optional[float] = None) -> bool:
    """Determine if we need a space between text elements."""
    if not prev_text or not next_text:
        return False
    if prev_text.endswith(" ") or next_text.startswith(" "):
        return False
    if gap is not None and prev_size:
        if gap < prev_size * 0.18:
            return False
        if gap > prev_size * 0.5:
            return True
    prev_char = prev_text[-1]
    next_char = next_text[0]
    if prev_char in "+-*/=<>^~" or next_char in "+-*/=<>^~":
        return False
    if prev_char.isalnum() and next_char.isalnum():
        return True
    if prev_char in ".,;:)]" and next_char.isalnum():
        return True
    return False


def _normalize_text(text: str) -> str:
    """Normalize extracted span text for stable downstream parsing."""
    if not text:
        return ""
    text = text.replace("\u00a0", " ")  # non-breaking space
    text = text.replace("\u2009", " ")  # thin space
    text = text.replace("\u2011", "-")  # non-breaking hyphen
    # Drop control chars except whitespace controls used for layout.
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text


def _join_spans(spans: List[dict]) -> str:
    """Join text spans with proper spacing."""
    parts = []
    prev_bbox = None
    prev_text = ""
    prev_size = None
    
    for span in spans:
        text = _normalize_text(span.get("text", ""))
        if not text:
            continue
        bbox = span.get("bbox")
        size = span.get("size")
        
        gap = None
        if prev_bbox is not None and bbox is not None:
            gap = bbox[0] - prev_bbox[2]
        
        if _needs_space(prev_text, text, gap, prev_size=prev_size, next_size=size):
            parts.append(" ")
        
        parts.append(text)
        prev_text = text
        prev_bbox = bbox
        prev_size = size
    
    return "".join(parts).strip()


def _merge_hyphenated_lines(lines: List[str]) -> str:
    """Merge hyphenated line breaks."""
    if not lines:
        return ""
    merged = []
    i = 0
    while i < len(lines):
        line = _normalize_text(lines[i])
        if line.endswith("-") and i + 1 < len(lines):
            next_line = _normalize_text(lines[i + 1]).lstrip()
            if next_line and next_line[0].islower():
                merged.append(line[:-1] + next_line)
                i += 2
                continue
        merged.append(line)
        i += 1
    return "\n".join(merged)


def _tighten_math_line(line: str) -> str:
    """Clean up math expressions."""
    if not re.search(r"[=<>±×÷*/^]", line):
        return line
    line = re.sub(r"\s+([,.;:%])", r"\1", line)
    line = re.sub(r"([(\[{])\s+", r"\1", line)
    line = re.sub(r"\s+([)\]}])", r"\1", line)
    line = re.sub(r"(?<=\w)\s*([=<>±×÷*/^])\s*(?=\w)", r"\1", line)
    line = re.sub(r"(?<=\d)\s*/\s*(?=\d)", r"/", line)
    return line


def _detect_columns(blocks: List[dict], page_width: float) -> bool:
    """Detect if page has two columns based on block positions."""
    if page_width <= 0:
        return False
    left = [b for b in blocks if b.get("x0", 0) < page_width * 0.45]
    right = [b for b in blocks if b.get("x0", 0) > page_width * 0.55]
    return len(left) >= 3 and len(right) >= 3


def _is_header_footer(text: str, page_height: float, y0: float, 
                      page_num: int, total_pages: int) -> bool:
    """Detect if text is a header or footer."""
    text = text.strip().lower()
    
    if text.isdigit() and len(text) <= 3:
        return True
    
    header_footer_patterns = [
        r"^chapter\s+\d+",
        r"^unit\s+\d+",
        r"^section\s+\d+",
    ]
    
    for pattern in header_footer_patterns:
        if re.match(pattern, text):
            return True
    
    margin_threshold = page_height * 0.08
    if y0 < margin_threshold or y0 > page_height - margin_threshold:
        return True
    
    return False


def _extract_blocks_with_layout(page: fitz.Page) -> List[TextBlock]:
    """Extract blocks with layout information."""
    blocks = []
    data = page.get_text("dict")
    page_width = page.rect.width
    page_height = page.rect.height
    
    for b in data.get("blocks", []):
        if b.get("type") != 0:
            continue
            
        lines = []
        for line in b.get("lines", []):
            line_text = _join_spans(line.get("spans", []))
            if line_text:
                lines.append(line_text)
        
        text = _merge_hyphenated_lines(lines)
        if not text.strip():
            continue
        
        x0, y0, x1, y1 = b.get("bbox", (0, 0, 0, 0))
        
        spans = []
        for line in b.get("lines", []):
            spans.extend(line.get("spans", []))
        
        font_size = max((s.get("size", 0) for s in spans), default=0)
        font_name = spans[0].get("font", "") if spans else ""
        is_bold = "bold" in font_name.lower() or "bd" in font_name.lower()
        
        if _is_header_footer(text, page_height, y0, page.number + 1, len(page.parent)):
            continue
        
        blocks.append(TextBlock(
            text=text,
            x0=x0,
            y0=y0,
            x1=x1,
            y1=y1,
            font_size=font_size,
            font_name=font_name,
            is_bold=is_bold,
            page_num=page.number + 1
        ))
    
    return blocks


def _extract_text_simple(page: fitz.Page) -> str:
    """Simple text extraction as fallback."""
    text = page.get_text("text")
    lines = text.split("\n")
    cleaned = []
    for line in lines:
        line = _tighten_math_line(_normalize_text(line.strip()))
        if line and not line.isdigit():
            cleaned.append(line)
    return "\n\n".join(cleaned)


def extract_pdf(pdf_path: str | Path) -> ExtractedPDF:
    """
    Extract text and layout from PDF.
    Returns structured data with position info for section detection.
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    
    extracted = ExtractedPDF(source_path=str(pdf_path))
    
    with fitz.open(pdf_path) as doc:
        extracted.metadata = {
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "page_count": len(doc),
        }
        
        for page_num, page in enumerate(doc):
            width = page.rect.width
            height = page.rect.height
            
            blocks = _extract_blocks_with_layout(page)
            
            if not blocks:
                raw_text = _extract_text_simple(page)
                extracted.pages.append(ExtractedPage(
                    page_num=page_num + 1,
                    width=width,
                    height=height,
                    raw_text=raw_text
                ))
                continue
            
            if _detect_columns([{"x0": b.x0, "x1": b.x1} for b in blocks], width):
                mid = width / 2.0
                blocks.sort(key=lambda b: (
                    0 if b.x0 < mid else 1,
                    b.y0
                ))
            else:
                blocks.sort(key=lambda b: (b.y0, b.x0))
            
            raw_text = "\n\n".join(b.text for b in blocks)
            
            extracted.pages.append(ExtractedPage(
                page_num=page_num + 1,
                width=width,
                height=height,
                blocks=blocks,
                raw_text=raw_text
            ))
    
    return extracted


def extract_full_text(pdf_path: str | Path) -> str:
    """Convenience function to get just the text."""
    extracted = extract_pdf(pdf_path)
    return "\n\n".join(p.raw_text for p in extracted.pages)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        result = extract_pdf(sys.argv[1])
        print(f"Extracted {len(result.pages)} pages")
        print(result.pages[0].raw_text[:500] if result.pages else "No content")
