import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
PDF_DIR = BASE_DIR / "pdf"
OUTPUT_DIR = BASE_DIR / "output"
ARCHIVE_DIR = BASE_DIR / "archive"

SERVICE_ACCOUNT_PATH = BASE_DIR.parent.parent / "service-account.json"

# Primary model can be overridden using GEMINI_MODEL in env files.
# Keep fallbacks ordered from higher-quality to faster/more-compatible.
GEMINI_MODEL_FALLBACKS = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
]
GEMINI_MODEL = os.getenv("GEMINI_MODEL", GEMINI_MODEL_FALLBACKS[0])

MAX_TOKENS_PER_CHUNK = 1500
MAX_RETRIES = 3
RETRY_DELAY = 2

SUBJECTS = ["Science", "Maths"]
CLASSES = ["6", "7", "8", "9", "10", "11", "12"]

SUBJECT_MAPPING = {
    "science": "Science",
    "sci": "Science",
    "maths": "Maths",
    "math": "Maths",
    "mathematics": "Maths",
}

CLASS_MAPPING = {
    "6": "Class_6",
    "7": "Class_7",
    "8": "Class_8",
    "9": "Class_9",
    "10": "Class_10",
    "11": "Class_11",
    "12": "Class_12",
}
