"""
Section Detector - Detect chapter, topic, and subtopic boundaries from PDF text.
Uses pattern matching and font analysis to identify section hierarchies.
"""
import re
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from extractor import ExtractedPDF, TextBlock


@dataclass
class Subtopic:
    """Represents a subtopic section."""
    id: str
    title: str
    content: str = ""
    page_start: int = 0
    page_end: int = 0


@dataclass
class Topic:
    """Represents a topic section."""
    id: str
    title: str
    content: str = ""
    subtopics: List[Subtopic] = field(default_factory=list)
    page_start: int = 0
    page_end: int = 0


@dataclass
class Chapter:
    """Represents a chapter section."""
    id: str
    title: str
    content: str = ""
    topics: List[Topic] = field(default_factory=list)
    page_start: int = 0
    page_end: int = 0


@dataclass
class DetectedStructure:
    """Complete detected structure from PDF."""
    chapter: Optional[Chapter] = None
    page_count: int = 0


def _slugify(text: str) -> str:
    """Convert text to slug format."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-")


def _detect_font_threshold(blocks: List[TextBlock]) -> float:
    """Detect font size threshold for headers."""
    if not blocks:
        return 12.0
    
    font_sizes = [b.font_size for b in blocks if b.font_size > 0]
    if not font_sizes:
        return 12.0
    
    sorted_sizes = sorted(set(font_sizes), reverse=True)
    if len(sorted_sizes) >= 3:
        return sorted_sizes[2]
    elif len(sorted_sizes) >= 2:
        return sorted_sizes[1]
    return sorted_sizes[0] * 1.2


def _parse_numeric_heading(text: str) -> Tuple[int, str]:
    """Return numeric heading depth and prefix, e.g. 6.4.1 -> (3, '6.4.1')."""
    match = re.match(r"^(\d+(?:\.\d+){1,4})\b", text.strip())
    if not match:
        return 0, ""
    prefix = match.group(1)
    return len(prefix.split(".")), prefix


def _is_non_topic_heading(text: str) -> bool:
    """Filter known textbook labels that should not create topic boundaries."""
    normalized = text.strip().lower()
    skip_prefixes = (
        "activity ",
        "table ",
        "fig.",
        "figure ",
        "science and society",
        "know a scientist",
        "in a nutshell",
        "let us enhance our learning",
        "exploratory projects",
    )
    return any(normalized.startswith(prefix) for prefix in skip_prefixes)


def _is_header_line(text: str, font_size: float, is_bold: bool, 
                    threshold: float) -> Tuple[bool, str]:
    """
    Determine if a line is a header.
    Returns (is_header, header_type) where type is 'chapter', 'topic', or 'subtopic'
    """
    text = text.strip()
    if not text:
        return False, ""
    if not re.search(r"[A-Za-z0-9]", text):
        return False, ""
    if _is_non_topic_heading(text):
        return False, ""
    
    chapter_patterns = [
        r"^(chapter|unit)\s+(\d+|[ivxlcdm]+)",
        r"^(\d+)\s+(chapter|unit)",
        r"^chapter\s+\d+\s*[:\.]",
    ]
    
    for pattern in chapter_patterns:
        if re.match(pattern, text, re.IGNORECASE):
            return True, "chapter"

    level, _ = _parse_numeric_heading(text)
    if level == 2:
        return True, "topic"
    if level >= 3:
        return True, "subtopic"
    
    is_large = font_size > threshold or is_bold

    if is_large and len(text) < 90 and not text.endswith("."):
        return True, "topic"
    
    return False, ""


def _is_table_like_heading(text: str) -> bool:
    """Detect compact multi-line labels usually from table headers."""
    level, _ = _parse_numeric_heading(text)
    if level > 0:
        return False
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) < 2:
        return False
    # Table header labels are usually short on each line.
    return all(len(re.findall(r"[A-Za-z]+", line)) <= 4 for line in lines)


def _clean_content_text(text: str) -> str:
    """Clean extracted content text."""
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    
    noise_patterns = [
        r"fig\.\s*\d+",
        r"figure\s*\d+",
        r"page\s*\d+",
    ]
    for pattern in noise_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    
    return text.strip()


def detect_structure(extracted: ExtractedPDF) -> DetectedStructure:
    """
    Detect chapter, topic, and subtopic structure from extracted PDF.
    """
    all_blocks: List[TextBlock] = []
    for page in extracted.pages:
        all_blocks.extend(page.blocks)
    
    threshold = _detect_font_threshold(all_blocks)
    
    chapter: Optional[Chapter] = None
    current_topic: Optional[Topic] = None
    current_subtopic: Optional[Subtopic] = None
    saw_numeric_topic = False
    
    chapter_content_parts: List[str] = []
    topic_content_parts: List[str] = []
    subtopic_content_parts: List[str] = []

    def ensure_chapter(page_num: int, fallback_title: str = "") -> None:
        nonlocal chapter
        if chapter:
            return
        title = fallback_title.strip() if fallback_title else "Detected Chapter"
        chapter = Chapter(
            id=_slugify(title) or "detected-chapter",
            title=title,
            page_start=page_num,
        )

    def finalize_subtopic(page_num: int) -> None:
        nonlocal current_subtopic, subtopic_content_parts, current_topic
        if not current_subtopic:
            return
        current_subtopic.content = _clean_content_text("\n\n".join(subtopic_content_parts))
        current_subtopic.page_end = page_num
        if current_topic:
            current_topic.subtopics.append(current_subtopic)
        current_subtopic = None
        subtopic_content_parts = []

    def finalize_topic(page_num: int) -> None:
        nonlocal current_topic, topic_content_parts, chapter
        if not current_topic:
            return
        current_topic.content = _clean_content_text("\n\n".join(topic_content_parts))
        current_topic.page_end = page_num
        # Ensure each topic has at least one usable subtopic for downstream pipeline.
        if not current_topic.subtopics and current_topic.content:
            current_topic.subtopics.append(
                Subtopic(
                    id=f"{current_topic.id}-overview",
                    title=current_topic.title,
                    content=current_topic.content,
                    page_start=current_topic.page_start,
                    page_end=current_topic.page_end,
                )
            )
        if chapter:
            chapter.topics.append(current_topic)
        current_topic = None
        topic_content_parts = []
    
    for page in extracted.pages:
        for block in page.blocks:
            is_header, header_type = _is_header_line(
                block.text, block.font_size, block.is_bold, threshold
            )
            level, _ = _parse_numeric_heading(block.text)

            if header_type == "topic":
                # Once numbered topics begin, ignore non-numbered topic candidates.
                # This avoids table/header noise being promoted to topic.
                if saw_numeric_topic and level == 0:
                    is_header, header_type = False, ""
                if _is_table_like_heading(block.text):
                    is_header, header_type = False, ""
                # Ignore low-signal single-word headings after numbered flow starts.
                alpha_words = re.findall(r"[A-Za-z]+", block.text)
                if saw_numeric_topic and level == 0 and len(alpha_words) <= 1:
                    is_header, header_type = False, ""
            
            if header_type == "chapter" and not chapter:
                chapter = Chapter(
                    id=_slugify(block.text.strip()) or "chapter",
                    title=block.text.strip(),
                    page_start=page.page_num
                )
                continue
            
            if header_type == "topic":
                ensure_chapter(page.page_num, "Detected Chapter")
                finalize_subtopic(page.page_num)
                finalize_topic(page.page_num)
                if level == 2:
                    saw_numeric_topic = True
                
                topic_id = _slugify(block.text)
                current_topic = Topic(
                    id=topic_id,
                    title=block.text.strip(),
                    page_start=page.page_num
                )
                topic_content_parts = []
                continue
            
            if header_type == "subtopic":
                ensure_chapter(page.page_num, "Detected Chapter")
                if not current_topic:
                    # If subtopics appear before any explicit topic, create an implicit topic.
                    level, prefix = _parse_numeric_heading(block.text)
                    implicit = prefix.rsplit(".", 1)[0] if level >= 3 and "." in prefix else "topic"
                    current_topic = Topic(
                        id=_slugify(implicit) or "topic",
                        title=f"Topic {implicit}" if implicit != "topic" else "Detected Topic",
                        page_start=page.page_num,
                    )

                finalize_subtopic(page.page_num)
                
                subtopic_id = _slugify(block.text)
                current_subtopic = Subtopic(
                    id=subtopic_id,
                    title=block.text.strip(),
                    page_start=page.page_num
                )
                subtopic_content_parts = []
                continue
            
            if current_subtopic:
                subtopic_content_parts.append(block.text)
            elif current_topic:
                topic_content_parts.append(block.text)
            elif chapter:
                chapter_content_parts.append(block.text)
    
    if extracted.pages:
        ensure_chapter(extracted.pages[0].page_num, "Detected Chapter")
    if extracted.pages:
        finalize_subtopic(extracted.pages[-1].page_num)
        finalize_topic(extracted.pages[-1].page_num)
    
    if chapter and chapter_content_parts and not chapter.content:
        chapter.content = _clean_content_text(
            "\n\n".join(chapter_content_parts)
        )
    
    if chapter and chapter.topics:
        chapter.page_end = chapter.topics[-1].page_end or extracted.metadata.get("page_count", 0)
    elif chapter:
        chapter.page_end = extracted.metadata.get("page_count", 0)
        chapter.id = chapter.id or "detected-chapter"
        chapter.title = chapter.title or "Detected Chapter"

    return DetectedStructure(
        chapter=chapter,
        page_count=extracted.metadata.get("page_count", 0)
    )


def extract_all_subtopics(extracted: ExtractedPDF) -> List[dict]:
    """
    Extract all subtopics as a list of dicts for LLM processing.
    """
    structure = detect_structure(extracted)
    result = []
    
    if not structure.chapter:
        return result
    
    for topic in structure.chapter.topics:
        for subtopic in topic.subtopics:
            result.append({
                "chapter_id": structure.chapter.id,
                "chapter_title": structure.chapter.title,
                "topic_id": topic.id,
                "topic_title": topic.title,
                "subtopic_id": subtopic.id,
                "subtopic_title": subtopic.title,
                "content": subtopic.content,
                "page_start": subtopic.page_start,
                "page_end": subtopic.page_end,
            })
    
    return result


if __name__ == "__main__":
    import sys
    from extractor import extract_pdf
    
    if len(sys.argv) > 1:
        extracted = extract_pdf(sys.argv[1])
        structure = detect_structure(extracted)
        
        if structure.chapter:
            print(f"Chapter: {structure.chapter.title}")
            print(f"Topics: {len(structure.chapter.topics)}")
            for topic in structure.chapter.topics:
                print(f"  Topic: {topic.title} ({len(topic.subtopics)} subtopics)")
                for st in topic.subtopics:
                    print(f"    - {st.title}")
        else:
            print("No structure detected")
