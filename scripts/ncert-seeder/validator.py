"""
Validator - JSON schema validation for SubtopicKnowledge.
"""
import json
from typing import Any, Dict, List, Tuple


def validate_subtopic(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate a subtopic against the required schema.
    Returns (is_valid, error_messages)
    """
    errors = []
    
    required_fields = [
        "id", "title", "learningObjectives", "keyConcepts",
        "keyTerms", "examples", "questionBank"
    ]
    
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")
    
    if "learningObjectives" in data:
        objectives = data["learningObjectives"]
        if not isinstance(objectives, list):
            errors.append("learningObjectives must be an array")
        elif len(objectives) < 3:
            errors.append(f"learningObjectives needs at least 3, got {len(objectives)}")
    
    if "keyConcepts" in data:
        concepts = data["keyConcepts"]
        if not isinstance(concepts, list):
            errors.append("keyConcepts must be an array")
        elif len(concepts) < 3:
            errors.append(f"keyConcepts needs at least 3, got {len(concepts)}")
    
    if "keyTerms" in data:
        terms = data["keyTerms"]
        if not isinstance(terms, dict):
            errors.append("keyTerms must be an object")
        elif len(terms) < 1:
            errors.append("keyTerms needs at least 1 entry")
    
    if "examples" in data:
        examples = data["examples"]
        if not isinstance(examples, list):
            errors.append("examples must be an array")
        elif len(examples) < 2:
            errors.append(f"examples needs at least 2, got {len(examples)}")
    
    if "questionBank" in data:
        qb = data["questionBank"]
        if not isinstance(qb, list):
            errors.append("questionBank must be an array")
        else:
            if len(qb) < 6:
                errors.append(f"questionBank needs at least 6, got {len(qb)}")
            
            for i, q in enumerate(qb):
                q_errors = validate_question(q, i)
                errors.extend(q_errors)
    
    return len(errors) == 0, errors


def validate_question(q: Dict[str, Any], index: int) -> List[str]:
    """Validate a single question."""
    errors = []
    prefix = f"questionBank[{index}]"
    
    if "id" not in q:
        errors.append(f"{prefix}: missing id")
    if "question" not in q:
        errors.append(f"{prefix}: missing question")
    if "type" not in q:
        errors.append(f"{prefix}: missing type")
    if "answer" not in q:
        errors.append(f"{prefix}: missing answer")
    
    qtype = q.get("type")
    if qtype == "mcq":
        options = q.get("options", [])
        if not options or len(options) < 4:
            errors.append(f"{prefix}: MCQ needs 4 options, got {len(options)}")
        
        labels = [o.get("label") for o in options]
        if len(labels) != len(set(labels)):
            errors.append(f"{prefix}: duplicate option labels")
        
        correct = q.get("answer", {}).get("correct", "")
        if correct and correct not in labels:
            errors.append(f"{prefix}: correct answer '{correct}' not in options")
    elif qtype in ["short", "reasoning"]:
        options = q.get("options", [])
        if options:
            errors.append(f"{prefix}: non-MCQ should not have options")
    
    if "answer" in q:
        ans = q["answer"]
        if "correct" not in ans:
            errors.append(f"{prefix}.answer: missing correct")
        if "explanation" not in ans:
            errors.append(f"{prefix}.answer: missing explanation")
    
    return errors


def validate_chapter(chapter_data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """
    Validate complete chapter data.
    Returns (is_valid, validation_report)
    """
    report = {
        "chapter_title": chapter_data.get("title", "Unknown"),
        "topics": [],
        "total_subtopics": 0,
        "valid_subtopics": 0,
        "errors": []
    }
    
    topics = chapter_data.get("topics", [])
    
    for topic in topics:
        topic_report = {
            "title": topic.get("title", "Unknown"),
            "subtopics": []
        }
        
        for st in topic.get("subtopics", []):
            report["total_subtopics"] += 1
            is_valid, errors = validate_subtopic(st)
            
            topic_report["subtopics"].append({
                "id": st.get("id"),
                "title": st.get("title"),
                "valid": is_valid,
                "errors": errors
            })
            
            if is_valid:
                report["valid_subtopics"] += 1
            else:
                report["errors"].extend([f"{st.get('title')}: {e}" for e in errors])
        
        report["topics"].append(topic_report)
    
    is_valid = report["total_subtopics"] > 0 and len(report["errors"]) == 0
    
    return is_valid, report


def load_and_validate(json_path: str) -> Tuple[bool, Dict[str, Any]]:
    """Load JSON file and validate."""
    with open(json_path) as f:
        data = json.load(f)
    return validate_chapter(data)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        is_valid, report = load_and_validate(sys.argv[1])
        print(json.dumps(report, indent=2))
        print(f"\nValid: {is_valid}")
