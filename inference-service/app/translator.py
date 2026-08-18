import logging

try:
    from deep_translator import GoogleTranslator
    DEEP_TRANSLATOR_AVAILABLE = True
except ImportError:
    DEEP_TRANSLATOR_AVAILABLE = False

logger = logging.getLogger(__name__)

class TranslatorService:
    """
    Servicio de traducción para inferencia en FastAPI.
    Traduce texto de Español a Inglés antes de entregarlo al modelo de scikit-learn.
    """
    def __init__(self, backend: str = "google", target_lang: str = "en"):
        self.backend = backend
        self.target_lang = target_lang
        self._cache = {}

    def translate(self, text: str) -> str:
        if not text or not text.strip():
            return text

        if self.backend == "none" or self.is_english(text):
            return text

        if text in self._cache:
            return self._cache[text]

        translated_text = text
        if self.backend == "google" and DEEP_TRANSLATOR_AVAILABLE:
            try:
                translated_text = GoogleTranslator(source="auto", target=self.target_lang).translate(text)
            except Exception as e:
                logger.warning(f"Fallo en servicio de traducción automática ({e}). Usando texto original.")
                translated_text = text

        self._cache[text] = translated_text
        return translated_text

    @staticmethod
    def is_english(text: str) -> bool:
        # Si no contiene caracteres/acentos en español típicos, se asume inglés
        return not any(char in "áéíóúñüÁÉÍÓÚÑ" for char in text)
