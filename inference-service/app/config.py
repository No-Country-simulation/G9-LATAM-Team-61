import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    BASE_DIR = Path(__file__).resolve().parent.parent
    load_dotenv(BASE_DIR / ".env")
except ImportError:
    BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_FILE = BASE_DIR / "model" / "modelo_hacka.pkl"

# Configuración de Inferencia y Normalización
TRANSLATOR_BACKEND = os.getenv("TRANSLATOR_BACKEND", "none")  # Desactivado por defecto
TRANSLATE_TARGET_LANG = os.getenv("TRANSLATE_TARGET_LANG", "en")
MIN_TEXT_LENGTH = int(os.getenv("MIN_TEXT_LENGTH", "30"))
MAX_TEXT_LENGTH = int(os.getenv("MAX_TEXT_LENGTH", "5000"))
KEYWORDS_TOP_N = int(os.getenv("KEYWORDS_TOP_N", "8"))
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", "100"))
MAX_CLUSTERING_DOCS = int(os.getenv("MAX_CLUSTERING_DOCS", "200"))