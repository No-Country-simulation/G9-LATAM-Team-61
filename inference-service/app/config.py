import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    BASE_DIR = Path(__file__).resolve().parent.parent
    load_dotenv(BASE_DIR / ".env")
except ImportError:
    BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_FILE = BASE_DIR / "model" / "modelo_hacka.pkl"

TRANSLATOR_BACKEND = os.getenv("TRANSLATOR_BACKEND", "google")
TRANSLATE_TARGET_LANG = os.getenv("TRANSLATE_TARGET_LANG", "en")
MAX_TEXT_LENGTH = int(os.getenv("MAX_TEXT_LENGTH", "10000"))
KEYWORDS_TOP_N = int(os.getenv("KEYWORDS_TOP_N", "8"))