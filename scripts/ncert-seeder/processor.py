"""
Processor - Two-phase LLM processing for content extraction and question generation.
Phase 1: Extract objectives, concepts, terms, examples, misconceptions
Phase 2: Generate questions from structured data
"""
import json
import os
import re
import sys
import time
from typing import Any, Dict, Optional

import google.genai as genai
from google.genai import types

from chunker import count_tokens
from config import GEMINI_MODEL, GEMINI_MODEL_FALLBACKS, MAX_RETRIES, RETRY_DELAY


PHASE1_SCHEMA = {
    "type": "object",
    "properties": {
        "learningObjectives": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 3,
            "maxItems": 12
        },
        "keyConcepts": {
            "type": "array", 
            "items": {"type": "string"},
            "minItems": 3,
            "maxItems": 12
        },
        "keyTerms": {
            "type": "object",
            "additionalProperties": {"type": "string"}
        },
        "examples": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 2,
            "maxItems": 12
        },
        "misconceptions": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 1,
            "maxItems": 8
        }
    },
    "required": ["learningObjectives", "keyConcepts", "keyTerms", "examples", "misconceptions"]
}

PHASE2_SCHEMA = {
    "type": "object",
    "properties": {
        "questionBank": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "question": {"type": "string"},
                    "type": {"type": "string", "enum": ["mcq", "short", "reasoning"]},
                    "options": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "label": {"type": "string"},
                                "text": {"type": "string"}
                            },
                            "required": ["label", "text"]
                        }
                    },
                    "answer": {
                        "type": "object",
                        "properties": {
                            "correct": {"type": "string"},
                            "explanation": {"type": "string"}
                        },
                        "required": ["correct", "explanation"]
                    },
                    "hint": {"type": "string"}
                },
                "required": ["id", "question", "type", "answer"]
            },
            "minItems": 6,
            "maxItems": 6
        }
    },
    "required": ["questionBank"]
}


def get_gemini_client() -> genai.Client:
    """Initialize Gemini client."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY not set")
    return genai.Client(api_key=api_key)


def repair_json(text: str) -> str:
    """Attempt to repair malformed JSON."""
    if not text:
        return text
    
    out = []
    in_string = False
    escaped = False
    
    for ch in text:
        if in_string:
            if escaped:
                out.append(ch)
                escaped = False
                continue
            if ch == "\\":
                out.append(ch)
                escaped = True
                continue
            if ch == "\"":
                out.append(ch)
                in_string = False
                continue
            if ch == "\n":
                out.append("\\n")
                continue
            if ch == "\r":
                out.append("\\r")
                continue
            if ch == "\t":
                out.append("\\t")
                continue
            out.append(ch)
        else:
            if ch == "\"":
                in_string = True
            out.append(ch)
    
    if in_string:
        out.append("\"")
    
    return "".join(out)


def extract_json(text: str) -> Dict[str, Any]:
    """Extract and parse JSON from LLM response."""
    if not text:
        raise ValueError("Empty response")
    
    cleaned = text.strip()
    
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start:end + 1]
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        repaired = repair_json(cleaned)
        return json.loads(repaired)


def trim_text(text: str, max_chars: int = 8000) -> str:
    """Trim text to fit within token limits."""
    if len(text) <= max_chars:
        return text
    
    head = text[:int(max_chars * 0.75)].rstrip()
    tail = text[-int(max_chars * 0.25):].lstrip()
    return f"{head}\n...\n{tail}"


def _safe_console_text(value: object) -> str:
    """Return text safe for current stdout encoding."""
    text = str(value)
    encoding = sys.stdout.encoding or "utf-8"
    try:
        return text.encode(encoding, errors="replace").decode(encoding, errors="replace")
    except Exception:
        return text.encode("ascii", errors="replace").decode("ascii")


def _build_model_candidates() -> list[str]:
    """Build a deduplicated model preference list."""
    env_model = (os.getenv("GEMINI_MODEL") or "").strip()
    ordered = [env_model, GEMINI_MODEL, *GEMINI_MODEL_FALLBACKS]
    deduped: list[str] = []

    for item in ordered:
        if item and item not in deduped:
            deduped.append(item)

    return deduped


def _is_missing_model_error(error: Exception) -> bool:
    """Detect 404/missing model responses from Gemini API."""
    msg = str(error).lower()
    return (
        "not_found" in msg
        and "models/" in msg
        and ("not found" in msg or "unsupported" in msg)
    )


def call_gemini(
    client: genai.Client,
    prompt: str,
    system_instruction: str,
    schema: Dict[str, Any],
    temperature: float = 0.1
) -> Optional[Dict[str, Any]]:
    """Call Gemini API with retry logic."""
    last_error = None
    model_candidates = _build_model_candidates()

    for model_name in model_candidates:
        for attempt in range(MAX_RETRIES):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=temperature,
                        max_output_tokens=8192,
                        response_mime_type="application/json",
                        response_json_schema=schema
                    )
                )

                if not response.text:
                    raise ValueError("Empty response from Gemini")

                return extract_json(response.text)

            except Exception as e:
                last_error = e
                print(
                    f"  Gemini call failed ({model_name}, attempt {attempt + 1}/{MAX_RETRIES}): {e}"
                )

                # Model id is unavailable for this API/key; move to next candidate.
                if _is_missing_model_error(e):
                    print(f"  Model unavailable: {model_name}. Trying fallback model...")
                    break

                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
    
    print(f"  All attempts failed: {last_error}")
    return None


def phase1_extract_structure(
    client: genai.Client,
    subtopic_data: Dict[str, Any],
    grade_level: str
) -> Optional[Dict[str, Any]]:
    """
    Phase 1: Extract learning objectives, concepts, terms, examples, misconceptions.
    """
    content = subtopic_data.get("content", "")
    title = subtopic_data.get("subtopic_title", "Untitled")
    topic = subtopic_data.get("topic_title", "")
    
    if not content:
        return None
    
    system_instruction = """You are a curriculum designer extracting content from a science textbook.
Return clean, production-ready JSON. Use only facts explicitly present in SOURCE TEXT.
Keep language clear and age-appropriate for school students.
- Each learning objective should start with an action verb
- Key terms should be single words or short phrases with clear definitions
- Examples should be concrete and from everyday life
- Misconceptions should address common student misunderstandings"""
    
    prompt = f"""SUBTOPIC: {title}
TOPIC: {topic}
GRADE LEVEL: Class {grade_level}

SOURCE TEXT START >>>
{trim_text(content, 8000)}
<<< SOURCE TEXT END

Extract and return ONLY valid JSON with these fields:
- learningObjectives (at least 3)
- keyConcepts (at least 3) 
- keyTerms (object with term: definition)
- examples (at least 2)
- misconceptions (at least 1)

Return JSON only, no markdown fences."""

    return call_gemini(client, prompt, system_instruction, PHASE1_SCHEMA)


def phase2_generate_questions(
    client: genai.Client,
    subtopic_data: Dict[str, Any],
    extracted_data: Dict[str, Any],
    grade_level: str
) -> Optional[Dict[str, Any]]:
    """
    Phase 2: Generate questions from extracted structure.
    """
    title = subtopic_data.get("subtopic_title", "Untitled")
    topic = subtopic_data.get("topic_title", "")
    content = subtopic_data.get("content", "")
    
    concepts = extracted_data.get("keyConcepts", [])
    terms = extracted_data.get("keyTerms", {})
    examples = extracted_data.get("examples", [])
    
    system_instruction = """You are a science teacher creating quiz questions.
Generate questions that test understanding based on the provided concepts and content.
- MCQ: 4 options (A-D), one correct answer
- Short: Direct answer questions
- Reasoning: Explain WHY questions
All questions must be answerable from the source content."""

    prompt = f"""SUBTOPIC: {title}
TOPIC: {topic}
GRADE LEVEL: Class {grade_level}

KEY CONCEPTS:
{chr(10).join(f"- {c}" for c in concepts[:6])}

KEY TERMS:
{json.dumps(terms, indent=2)}

EXAMPLES:
{chr(10).join(f"- {e}" for e in examples[:4])}

SOURCE CONTENT:
{trim_text(content, 4000)}

Generate exactly 6 questions:
- 3 MCQ (multiple choice with 4 options each)
- 2 Short answer
- 1 Reasoning question

Return ONLY valid JSON with questionBank array containing objects with:
- id: unique identifier (e.g., "q1", "q2")
- question: the question text
- type: "mcq", "short", or "reasoning"
- options: array of {{label, text}} for MCQ only (empty for others)
- answer: {{correct, explanation}}

Return JSON only, no markdown fences."""

    return call_gemini(client, prompt, system_instruction, PHASE2_SCHEMA, temperature=0.2)


def process_subtopic(
    client: genai.Client,
    subtopic_data: Dict[str, Any],
    grade_level: str
) -> Dict[str, Any]:
    """
    Process a single subtopic through both LLM phases.
    Returns complete subtopic data ready for database.
    """
    subtopic_id = subtopic_data.get("subtopic_id", "")
    title = subtopic_data.get("subtopic_title", "")
    
    print(f"  Processing: {_safe_console_text(title)}")
    
    result = {
        "id": subtopic_id,
        "title": title,
        "learningObjectives": [],
        "keyConcepts": [],
        "keyTerms": {},
        "examples": [],
        "misconceptions": [],
        "questionBank": [],
        "page_start": subtopic_data.get("page_start", 0),
        "page_end": subtopic_data.get("page_end", 0)
    }
    
    extracted = phase1_extract_structure(client, subtopic_data, grade_level)
    
    if extracted:
        result.update(extracted)
        print(f"    Phase 1 complete: {len(extracted.get('keyConcepts', []))} concepts")
        
        questions = phase2_generate_questions(client, subtopic_data, extracted, grade_level)
        
        if questions and questions.get("questionBank"):
            result["questionBank"] = questions["questionBank"]
            print(f"    Phase 2 complete: {len(result['questionBank'])} questions")
        else:
            print(f"    Phase 2 failed - no questions generated")
    else:
        print(f"    Phase 1 failed - no structure extracted")
    
    return result


def process_all_subtopics(
    client: genai.Client,
    subtopics: list,
    grade_level: str
) -> list:
    """Process multiple subtopics with progress tracking."""
    results = []
    total = len(subtopics)
    
    print(f"\nProcessing {total} subtopics...")
    
    for i, subtopic in enumerate(subtopics, 1):
        print(f"\n[{i}/{total}] ", end="", flush=True)
        
        processed = process_subtopic(client, subtopic, grade_level)
        results.append(processed)
        
        if i < total:
            time.sleep(0.5)
    
    print(f"\n[OK] Completed {total} subtopics")
    return results


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python processor.py <test_json>")
        sys.exit(1)
    
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        test_data = json.load(f)
    
    client = get_gemini_client()
    result = process_subtopic(client, test_data, "7")
    print(json.dumps(result, indent=2))
