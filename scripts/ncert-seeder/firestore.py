"""
Firestore Writer - Write processed curriculum data to Firestore.
"""
import json
import shutil
from pathlib import Path
from typing import Any, Dict, Optional

import firebase_admin
from firebase_admin import credentials, firestore

from config import (
    ARCHIVE_DIR,
    CLASS_MAPPING,
    OUTPUT_DIR,
    SERVICE_ACCOUNT_PATH,
    SUBJECT_MAPPING,
)


def get_firestore_client() -> firestore.Client:
    """Initialize Firestore client."""
    if not firebase_admin._apps:
        if not SERVICE_ACCOUNT_PATH.exists():
            raise FileNotFoundError(
                f"Service account not found at {SERVICE_ACCOUNT_PATH}. "
                "Please download from Firebase Console > Project Settings > Service Accounts"
            )
        cred = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
        firebase_admin.initialize_app(cred)

    return firestore.client()


def make_doc_id(subject: str, chapter_id: str, topic_id: str, subtopic_id: str) -> str:
    """Build deterministic chunk doc ID shared with runtime lookups."""
    return f"{subject}__{chapter_id}__{topic_id}__{subtopic_id}"


def build_output_path(subject: str, class_level: str, chapter_num: str) -> Path:
    """Build canonical output JSON path for a chapter."""
    filename = f"{subject.lower()}-class{class_level}-chapter{chapter_num}.json"
    return OUTPUT_DIR / filename


def _atomic_write_json(path: Path, payload: Dict[str, Any]) -> None:
    """Write JSON atomically to avoid partial files on interruption."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    temp_path.replace(path)


def write_chunks_to_firestore(
    db: firestore.Client,
    chapter_data: Dict[str, Any],
    subject: str,
    class_level: str,
    chapter_num: str,
) -> Dict[str, str]:
    """
    Write chapter subtopics into curriculum_chunks collection.
    Returns the document paths written.
    """
    normalized_subject = SUBJECT_MAPPING.get(subject.lower(), subject)
    class_id = CLASS_MAPPING.get(str(class_level), f"Class_{class_level}")
    chapter_id = chapter_data.get("id") or f"{normalized_subject.lower()}-{class_level}-{chapter_num}"
    chapter_title = chapter_data.get("title", "")

    chunks_ref = db.collection("curriculum_chunks")
    batch = db.batch()
    batch_ops = 0
    max_batch_ops = 400

    topic_count = 0
    subtopic_count = 0
    skipped = 0
    skipped_failed = 0

    for topic in chapter_data.get("topics", []):
        topic_id = (topic.get("id") or "").strip()
        topic_title = topic.get("title", "")
        if not topic_id:
            skipped += 1
            continue

        topic_count += 1

        for subtopic in topic.get("subtopics", []):
            subtopic_id = (subtopic.get("id") or "").strip()
            subtopic_title = subtopic.get("title", "")
            if not subtopic_id:
                skipped += 1
                continue
            if (subtopic.get("status") or "").strip().lower() == "failed":
                skipped_failed += 1
                continue

            subtopic_count += 1
            doc_id = make_doc_id(normalized_subject, chapter_id, topic_id, subtopic_id)
            doc_ref = chunks_ref.document(doc_id)

            batch.set(
                doc_ref,
                {
                    "subject": normalized_subject,
                    "classLevel": class_id,
                    "chapterId": chapter_id,
                    "chapterTitle": chapter_title,
                    "chapterNumber": chapter_num,
                    "topicId": topic_id,
                    "topicTitle": topic_title,
                    "subtopicId": subtopic_id,
                    "subtopicTitle": subtopic_title,
                    "content": subtopic,
                    "updatedAt": firestore.SERVER_TIMESTAMP,
                },
                merge=True,
            )
            batch_ops += 1

            if batch_ops >= max_batch_ops:
                batch.commit()
                batch = db.batch()
                batch_ops = 0

    if batch_ops > 0:
        batch.commit()

    print(f"  Written to: curriculum_chunks ({subtopic_count} documents)")

    return {
        "collection": "curriculum_chunks",
        "chapter_id": chapter_id,
        "topics_written": str(topic_count),
        "subtopics_written": str(subtopic_count),
        "skipped": str(skipped),
        "skipped_failed": str(skipped_failed),
    }


def archive_pdf(pdf_path: Path, subject: str, class_level: str, chapter: str) -> Path:
    """Move processed PDF to archive folder."""
    archive_subject_dir = ARCHIVE_DIR / f"{class_level}_{subject}"
    archive_subject_dir.mkdir(parents=True, exist_ok=True)

    dest = archive_subject_dir / f"{chapter}.pdf"
    if dest.exists():
        dest = archive_subject_dir / f"{chapter}_{pdf_path.stem}.pdf"

    shutil.move(str(pdf_path), str(dest))
    return dest


def save_json_output(
    chapter_data: Dict[str, Any],
    subject: str,
    class_level: str,
    chapter_num: str,
    output_path: Optional[Path] = None,
) -> Path:
    """Save chapter data as JSON for review."""
    output_path = output_path or build_output_path(subject, class_level, chapter_num)
    _atomic_write_json(output_path, chapter_data)
    return output_path


def dry_run_summary(chapter_data: Dict[str, Any]) -> None:
    """Print a summary of what would be written."""
    print("\n" + "=" * 50)
    print("DRY RUN SUMMARY")
    print("=" * 50)

    print(f"Chapter: {chapter_data.get('title', 'Unknown')}")

    topics = chapter_data.get("topics", [])
    print(f"Topics: {len(topics)}")

    total_subtopics = 0
    total_questions = 0
    total_failed = 0

    for topic in topics:
        subtopics = topic.get("subtopics", [])
        total_subtopics += len(subtopics)

        for st in subtopics:
            questions = st.get("questionBank", [])
            total_questions += len(questions)
            if (st.get("status") or "").lower() == "failed":
                total_failed += 1

    print(f"Subtopics: {total_subtopics}")
    print(f"Failed Subtopics: {total_failed}")
    print(f"Total Questions: {total_questions}")
    print("=" * 50)


def process_and_write(
    json_path: str,
    subject: str,
    class_level: str,
    chapter: str,
    write_to_firestore: bool = False,
    archive: bool = True,
    pdf_path: Optional[Path] = None,
    save_output: bool = True,
) -> Dict[str, Any]:
    """
    Process JSON file and optionally write to Firestore.
    """
    json_file = Path(json_path)
    with open(json_file, "r", encoding="utf-8") as f:
        chapter_data = json.load(f)

    output_path = json_file
    if save_output:
        output_path = save_json_output(
            chapter_data,
            subject,
            class_level,
            chapter,
            output_path=json_file,
        )
        print(f"  JSON saved: {output_path}")

    dry_run_summary(chapter_data)

    result = {
        "json_output": str(output_path),
        "written_to_firestore": False,
    }

    if write_to_firestore:
        try:
            db = get_firestore_client()
            paths = write_chunks_to_firestore(
                db, chapter_data, subject, class_level, chapter
            )
            result["written_to_firestore"] = True
            result["firestore_paths"] = paths
            print("\n[OK] Successfully written to Firestore")
        except Exception as e:
            print(f"\n[ERR] Firestore write failed: {e}")
            result["error"] = str(e)

    should_archive = (
        archive
        and write_to_firestore
        and result["written_to_firestore"]
        and pdf_path
        and pdf_path.exists()
    )
    if should_archive:
        archive_dest = archive_pdf(pdf_path, subject, class_level, chapter)
        print(f"  Archived: {archive_dest}")
        result["archived_to"] = str(archive_dest)
    elif archive and write_to_firestore and not result["written_to_firestore"]:
        print("  Skipped archive because Firestore write failed.")

    return result


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        result = process_and_write(
            sys.argv[1],
            sys.argv[2] if len(sys.argv) > 2 else "Science",
            sys.argv[3] if len(sys.argv) > 3 else "7",
            sys.argv[4] if len(sys.argv) > 4 else "1",
            write_to_firestore=True,
        )
        print(json.dumps(result, indent=2))
