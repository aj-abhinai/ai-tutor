# Main entry point: orchestrates PDF extraction, structure detection, and LLM processing
"""
NCERT Seeder: PDF -> curriculum_chunks Firestore documents

Modes:
1. Dry-run (default):
   - Extract PDF
   - Detect structure
   - Run Gemini per subtopic
   - Save one chapter JSON incrementally after each subtopic
2. Write:
   - Read existing chapter JSON
   - Validate
   - Push to Firestore (no Gemini calls)

Setup (from project root):
1. Create venv (one time):
   `python -m venv .venv`
2. Activate venv (each terminal):
   PowerShell: `./.venv/Scripts/activate`
3. Install deps:
   `pip install -r scripts/ncert-seeder/requirements.txt`
4. Ensure:
   - `GEMINI_API_KEY` in `.env.local`, `.env`, or shell env
   - `service-account.json` in project root (write mode only)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional

from dotenv import load_dotenv

from config import (
    BASE_DIR,
    CLASS_MAPPING,
    CLASSES,
    PDF_DIR,
    SUBJECTS,
    SUBJECT_MAPPING,
)
from detector import extract_all_subtopics
from extractor import extract_pdf
from firestore import build_output_path, process_and_write, save_json_output
from processor import get_gemini_client, process_subtopic
from validator import validate_chapter


def load_env_files() -> None:
    """Load environment files in precedence order."""
    project_root = BASE_DIR.parent.parent
    load_dotenv(project_root / ".env", override=False)
    load_dotenv(project_root / ".env.local", override=True)


def now_iso() -> str:
    """Return UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def prompt_class() -> str:
    """Prompt for class level."""
    print("\nAvailable classes: " + ", ".join(CLASSES))
    while True:
        class_level = input("Enter class (6-12): ").strip()
        if class_level in CLASSES:
            return class_level
        print(f"Invalid class. Choose from: {', '.join(CLASSES)}")


def prompt_subject() -> str:
    """Prompt for subject."""
    print("\nAvailable subjects: " + ", ".join(SUBJECTS))
    while True:
        subject = input("Enter subject (Science/Maths): ").strip()
        normalized = normalize_subject(subject)
        if normalized:
            return normalized
        print(f"Invalid subject. Choose from: {', '.join(SUBJECTS)}")


def prompt_chapter() -> str:
    """Prompt for chapter number."""
    while True:
        chapter = input("Enter chapter number [e.g., 1]: ").strip()
        if is_valid_chapter(chapter):
            return chapter
        print("Invalid chapter. Use a single chapter id (for example: 1)")


def normalize_subject(subject: str) -> str:
    """Normalize subject aliases to canonical values."""
    return SUBJECT_MAPPING.get(subject.strip().lower(), "")


def is_valid_chapter(chapter: str) -> bool:
    """Allow only a single chapter id token."""
    value = chapter.strip()
    if not value:
        return False
    if "," in value:
        return False
    return bool(re.fullmatch(r"[A-Za-z0-9_-]+", value))


def parse_chapter(value: Optional[str]) -> str:
    """Parse and validate chapter value from CLI or prompt."""
    chapter = (value or "").strip()
    if not is_valid_chapter(chapter):
        raise ValueError("Chapter must be a single token like 1 or chapter-1")
    return chapter


def normalize_chapter_title(chapter_title: str, chapter_num: str) -> str:
    """Avoid placeholder chapter titles in stored output."""
    cleaned = (chapter_title or "").strip()
    if not cleaned:
        return f"Chapter {chapter_num}"
    lowered = cleaned.lower()
    if lowered in {"detected chapter", "chapter"}:
        return f"Chapter {chapter_num}"
    return cleaned


def find_pdf(chapter: Optional[str] = None) -> Path:
    """Find PDF file in the pdf directory."""
    pdfs = list(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {PDF_DIR}")
        sys.exit(1)

    if len(pdfs) == 1:
        return pdfs[0]

    if chapter:
        for pdf in pdfs:
            if chapter in pdf.stem.lower():
                return pdf

    print(f"Found {len(pdfs)} PDFs:")
    for i, pdf in enumerate(pdfs, 1):
        print(f"  {i}. {pdf.name}")

    while True:
        try:
            choice = int(input("Select PDF number: "))
            if 1 <= choice <= len(pdfs):
                return pdfs[choice - 1]
        except ValueError:
            pass
        print(f"Enter a number between 1 and {len(pdfs)}")


def _new_subtopic_entry(source: Dict[str, object]) -> Dict[str, object]:
    """Build initial subtopic payload."""
    return {
        "id": source.get("subtopic_id", ""),
        "title": source.get("subtopic_title", ""),
        "learningObjectives": [],
        "keyConcepts": [],
        "keyTerms": {},
        "examples": [],
        "misconceptions": [],
        "questionBank": [],
        "page_start": source.get("page_start", 0),
        "page_end": source.get("page_end", 0),
        "status": "pending",
        "error": "",
        "updatedAt": now_iso(),
    }


def build_initial_chapter_structure(
    chapter_title: str,
    detected_subtopics: list[Dict[str, object]],
    chapter_num: str,
    subject: str,
    class_level: str,
) -> Dict[str, object]:
    """Build chapter structure from detector output with pending entries."""
    topics_dict: OrderedDict[str, Dict[str, object]] = OrderedDict()
    for item in detected_subtopics:
        topic_id = str(item.get("topic_id", "")).strip()
        topic_title = str(item.get("topic_title", "")).strip()
        if topic_id not in topics_dict:
            topics_dict[topic_id] = {
                "id": topic_id,
                "title": topic_title,
                "subtopics": [],
            }
        topics_dict[topic_id]["subtopics"].append(_new_subtopic_entry(item))

    chapter_id = f"{subject.lower()}-{class_level}-{chapter_num}"
    chapter_data: Dict[str, object] = {
        "id": chapter_id,
        "title": chapter_title,
        "subject": subject,
        "classLevel": CLASS_MAPPING.get(class_level, f"Class_{class_level}"),
        "chapterNumber": chapter_num,
        "topics": list(topics_dict.values()),
        "processingMeta": {
            "status": "in_progress",
            "totalSubtopics": len(detected_subtopics),
            "completedSubtopics": 0,
            "failedSubtopics": 0,
            "lastUpdatedAt": now_iso(),
        },
    }
    recompute_processing_meta(chapter_data)
    return chapter_data


def build_subtopic_lookup(chapter_data: Dict[str, object]) -> Dict[str, Dict[str, object]]:
    """Map subtopic id -> subtopic object within chapter_data."""
    lookup: Dict[str, Dict[str, object]] = {}
    topics = chapter_data.get("topics", [])
    if not isinstance(topics, list):
        return lookup

    for topic in topics:
        if not isinstance(topic, dict):
            continue
        subtopics = topic.get("subtopics", [])
        if not isinstance(subtopics, list):
            continue
        for subtopic in subtopics:
            if not isinstance(subtopic, dict):
                continue
            subtopic_id = str(subtopic.get("id", "")).strip()
            if subtopic_id:
                lookup[subtopic_id] = subtopic
    return lookup


def recompute_processing_meta(chapter_data: Dict[str, object]) -> None:
    """Recompute processing counters based on current subtopic statuses."""
    total = 0
    completed = 0
    failed = 0

    for topic in chapter_data.get("topics", []):
        if not isinstance(topic, dict):
            continue
        for subtopic in topic.get("subtopics", []):
            if not isinstance(subtopic, dict):
                continue
            total += 1
            status = str(subtopic.get("status", "pending")).lower()
            if status == "completed":
                completed += 1
            elif status == "failed":
                failed += 1

    processing_meta = chapter_data.get("processingMeta")
    if not isinstance(processing_meta, dict):
        processing_meta = {}
        chapter_data["processingMeta"] = processing_meta

    processing_meta["totalSubtopics"] = total
    processing_meta["completedSubtopics"] = completed
    processing_meta["failedSubtopics"] = failed
    processing_meta["status"] = "completed" if completed == total and failed == 0 else "in_progress"
    processing_meta["lastUpdatedAt"] = now_iso()


def merge_existing_with_detected(
    chapter_data: Dict[str, object],
    detected_subtopics: list[Dict[str, object]],
) -> Dict[str, Dict[str, object]]:
    """Ensure existing JSON contains all currently detected subtopics."""
    topics = chapter_data.get("topics")
    if not isinstance(topics, list):
        chapter_data["topics"] = []
        topics = chapter_data["topics"]

    topic_index: Dict[str, Dict[str, object]] = {}
    for topic in topics:
        if not isinstance(topic, dict):
            continue
        topic_id = str(topic.get("id", "")).strip()
        if topic_id:
            topic_index[topic_id] = topic
            if not isinstance(topic.get("subtopics"), list):
                topic["subtopics"] = []

    lookup = build_subtopic_lookup(chapter_data)

    for source in detected_subtopics:
        topic_id = str(source.get("topic_id", "")).strip()
        topic_title = str(source.get("topic_title", "")).strip()
        subtopic_id = str(source.get("subtopic_id", "")).strip()

        if topic_id not in topic_index:
            topic_obj: Dict[str, object] = {
                "id": topic_id,
                "title": topic_title,
                "subtopics": [],
            }
            topics.append(topic_obj)
            topic_index[topic_id] = topic_obj

        topic_obj = topic_index[topic_id]
        if subtopic_id not in lookup:
            entry = _new_subtopic_entry(source)
            topic_obj["subtopics"].append(entry)
            lookup[subtopic_id] = entry

    return lookup


def is_subtopic_completed(subtopic: Dict[str, object]) -> bool:
    """Return True when subtopic already has successful output."""
    if str(subtopic.get("status", "")).lower() == "completed":
        return True
    return bool(subtopic.get("keyConcepts")) and bool(subtopic.get("questionBank"))


def _extract_numeric_subtopic_id(value: str) -> str:
    """Extract numeric id prefix like 6.4.5 from a title/id string."""
    match = re.search(r"\b(\d+(?:\.\d+)+)\b", value or "")
    return match.group(1) if match else ""


def matches_retry_target(source: Dict[str, object], retry_target: str) -> bool:
    """Support retry by exact slug id or numeric id prefix."""
    target = retry_target.strip().lower()
    if not target:
        return False

    subtopic_id = str(source.get("subtopic_id", "")).strip().lower()
    subtopic_title = str(source.get("subtopic_title", "")).strip()
    if target == subtopic_id:
        return True

    numeric_from_title = _extract_numeric_subtopic_id(subtopic_title).lower()
    numeric_from_id = _extract_numeric_subtopic_id(subtopic_id.replace("-", ".")).lower()
    if target in {numeric_from_title, numeric_from_id}:
        return True

    # Accept dotted input for slug ids, e.g., 6.4.5 -> 6-4-5-...
    hyphen_target = target.replace(".", "-")
    if subtopic_id.startswith(hyphen_target):
        return True

    return False


def load_json_file(path: Path) -> Dict[str, object]:
    """Load JSON from file with UTF-8 encoding."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError("Top-level JSON must be an object")
    return data


def main() -> None:
    load_env_files()

    parser = argparse.ArgumentParser(
        description="NCERT Curriculum Seeder - Convert PDFs to structured curriculum data"
    )
    parser.add_argument("--pdf", help="Specific PDF file to process (in ./pdf folder)")
    parser.add_argument("--json", help="Specific JSON file path to write from")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Explicit dry-run mode (default when --write is not set)",
    )
    parser.add_argument("--write", action="store_true", help="Write to Firestore from JSON output")
    parser.add_argument("--fresh", action="store_true", help="Rebuild chapter JSON from scratch")
    parser.add_argument("--retry-subtopic", help="Rerun one subtopic id (example: 6.4.2)")
    parser.add_argument("--no-archive", action="store_true", help="Don't archive PDF after write")
    parser.add_argument("--class", dest="class_level", help="Class level (6-12)")
    parser.add_argument("--subject", help="Subject (Science/Maths)")
    parser.add_argument("--chapter", help="Chapter number")

    args = parser.parse_args()

    if args.write and args.dry_run:
        parser.error("Use either --write or --dry-run, not both.")
    if args.write and args.retry_subtopic:
        parser.error("--retry-subtopic can only be used in dry-run mode.")

    print("=" * 60)
    print("NCERT Curriculum Seeder")
    print("=" * 60)

    class_level = (args.class_level or prompt_class()).strip()
    if class_level not in CLASSES:
        print(f"Invalid class '{class_level}'. Choose from: {', '.join(CLASSES)}")
        sys.exit(1)

    raw_subject = args.subject or prompt_subject()
    subject = normalize_subject(raw_subject)
    if not subject:
        print(f"Invalid subject '{raw_subject}'. Choose from: {', '.join(SUBJECTS)}")
        sys.exit(1)

    try:
        chapter = parse_chapter(args.chapter or prompt_chapter())
    except ValueError as err:
        print(f"ERROR: {err}")
        sys.exit(1)

    mode_name = "WRITE" if args.write else "DRY-RUN"
    print("\nConfiguration:")
    print(f"  Subject: {subject}")
    print(f"  Class: {class_level}")
    print(f"  Chapter: {chapter}")
    print(f"  Mode: {mode_name}")
    if args.retry_subtopic:
        print(f"  Retry Subtopic: {args.retry_subtopic}")
    if args.fresh:
        print("  Fresh Run: True")

    output_path = build_output_path(subject, class_level, chapter)

    if args.write:
        print("\nStep 1: Loading JSON...")
        json_path = Path(args.json) if args.json else output_path
        if not json_path.exists():
            print(f"ERROR: JSON not found at {json_path}")
            print("Run dry-run first to generate the chapter JSON.")
            sys.exit(1)

        try:
            chapter_data = load_json_file(json_path)
        except Exception as e:
            print(f"ERROR: Could not load JSON: {e}")
            sys.exit(1)

        print("Step 2: Validating...")
        is_valid, report = validate_chapter(chapter_data)
        print(f"  Valid: {is_valid}")
        if not is_valid:
            print(f"  Errors: {len(report.get('errors', []))}")
            for err in report.get("errors", [])[:10]:
                print(f"    - {err}")
            sys.exit(1)

        pdf_path = None
        if args.pdf:
            candidate = PDF_DIR / args.pdf
            if candidate.exists():
                pdf_path = candidate

        print("Step 3: Writing to Firestore...")
        result = process_and_write(
            str(json_path),
            subject,
            class_level,
            chapter,
            write_to_firestore=True,
            archive=not args.no_archive,
            pdf_path=pdf_path,
            save_output=False,
        )

        print("\n" + "=" * 60)
        print("COMPLETE!")
        print("=" * 60)
        print(f"JSON: {result.get('json_output', 'N/A')}")
        print(f"Firestore: {'Success' if result.get('written_to_firestore') else 'Failed'}")
        if result.get("archived_to"):
            print(f"Archived: {result['archived_to']}")
        sys.exit(0)

    if args.json:
        print("WARNING: --json is ignored in dry-run mode.")

    if args.pdf:
        pdf_path = PDF_DIR / args.pdf
    else:
        pdf_path = find_pdf(chapter)

    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}")
        sys.exit(1)

    print(f"\nProcessing: {pdf_path.name}")
    print("-" * 40)

    print("Step 1: Extracting PDF text...")
    extracted = extract_pdf(str(pdf_path))
    print(f"  Extracted {len(extracted.pages)} pages")

    print("Step 2: Detecting structure...")
    detected_subtopics = extract_all_subtopics(extracted)
    print(f"  Found {len(detected_subtopics)} subtopics")
    if not detected_subtopics:
        print("ERROR: No subtopics detected. Check PDF format.")
        sys.exit(1)

    chapter_title = extracted.pages[0].raw_text[:100] if extracted.pages else "Untitled"
    for st in detected_subtopics:
        if st.get("chapter_title"):
            chapter_title = str(st["chapter_title"])
            break

    chapter_data: Dict[str, object]
    if output_path.exists() and not args.fresh:
        print("Step 3: Loading existing output for resume...")
        try:
            chapter_data = load_json_file(output_path)
        except Exception as e:
            print(f"ERROR: Could not load existing JSON ({output_path}): {e}")
            print("Run with --fresh to rebuild.")
            sys.exit(1)
    else:
        print("Step 3: Creating new chapter output...")
        chapter_data = build_initial_chapter_structure(
            chapter_title, detected_subtopics, chapter, subject, class_level
        )

    chapter_data["id"] = f"{subject.lower()}-{class_level}-{chapter}"
    chapter_data["title"] = normalize_chapter_title(chapter_title, chapter)
    chapter_data["subject"] = subject
    chapter_data["classLevel"] = CLASS_MAPPING.get(class_level, f"Class_{class_level}")
    chapter_data["chapterNumber"] = chapter

    subtopic_lookup = merge_existing_with_detected(chapter_data, detected_subtopics)
    recompute_processing_meta(chapter_data)
    save_json_output(chapter_data, subject, class_level, chapter, output_path=output_path)
    print(f"  JSON initialized: {output_path}")

    retry_id = args.retry_subtopic.strip() if args.retry_subtopic else ""
    if retry_id and not any(matches_retry_target(s, retry_id) for s in detected_subtopics):
        print(f"ERROR: Subtopic id '{retry_id}' not found in detected structure.")
        sys.exit(1)

    targets = []
    for source in detected_subtopics:
        subtopic_id = str(source.get("subtopic_id", "")).strip()
        existing = subtopic_lookup.get(subtopic_id)
        if existing is None:
            continue
        if retry_id:
            if matches_retry_target(source, retry_id):
                targets.append(source)
            continue
        if not args.fresh and is_subtopic_completed(existing):
            continue
        targets.append(source)

    if targets:
        print("Step 4: Processing with Gemini (incremental save)...")
        try:
            client = get_gemini_client()
        except ValueError as e:
            print(f"ERROR: {e}")
            sys.exit(1)

        total = len(targets)
        print(f"\nProcessing {total} subtopics...")
        for idx, source in enumerate(targets, 1):
            subtopic_id = str(source.get("subtopic_id", "")).strip()
            print(f"\n[{idx}/{total}] ", end="", flush=True)
            processed = process_subtopic(client, source, class_level)

            entry = subtopic_lookup[subtopic_id]
            entry["id"] = processed.get("id", subtopic_id)
            entry["title"] = processed.get("title", source.get("subtopic_title", ""))
            entry["learningObjectives"] = processed.get("learningObjectives", [])
            entry["keyConcepts"] = processed.get("keyConcepts", [])
            entry["keyTerms"] = processed.get("keyTerms", {})
            entry["examples"] = processed.get("examples", [])
            entry["misconceptions"] = processed.get("misconceptions", [])
            entry["questionBank"] = processed.get("questionBank", [])
            entry["page_start"] = processed.get("page_start", source.get("page_start", 0))
            entry["page_end"] = processed.get("page_end", source.get("page_end", 0))
            entry["updatedAt"] = now_iso()

            ok_phase1 = bool(entry["keyConcepts"]) and bool(entry["learningObjectives"])
            ok_phase2 = bool(entry["questionBank"])
            if ok_phase1 and ok_phase2:
                entry["status"] = "completed"
                entry["error"] = ""
            elif ok_phase1:
                entry["status"] = "failed"
                entry["error"] = "Phase 2 failed: no questions generated"
            else:
                entry["status"] = "failed"
                entry["error"] = "Phase 1 failed: no structure extracted"

            recompute_processing_meta(chapter_data)
            save_json_output(chapter_data, subject, class_level, chapter, output_path=output_path)
            print(f"    Saved: {output_path.name}")

        print(f"\n[OK] Completed {total} targeted subtopics")
    else:
        print("Step 4: No pending subtopics to process.")

    print("Step 5: Validating...")
    is_valid, report = validate_chapter(chapter_data)
    print(f"  Valid: {is_valid}")
    if not is_valid:
        print(f"  Errors: {len(report.get('errors', []))}")
        for err in report.get("errors", [])[:10]:
            print(f"    - {err}")

    recompute_processing_meta(chapter_data)
    save_json_output(chapter_data, subject, class_level, chapter, output_path=output_path)
    print("Step 6: Saved final dry-run JSON.")

    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)
    print(f"JSON: {output_path}")
    print("\nTo write to Firestore, run with --write flag")


if __name__ == "__main__":
    main()
