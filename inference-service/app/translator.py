import logging
from collections import OrderedDict

try:
    from deep_translator import GoogleTranslator
    DEEP_TRANSLATOR_AVAILABLE = True
except ImportError:
    DEEP_TRANSLATOR_AVAILABLE = False

logger = logging.getLogger(__name__)

class TranslatorService:
    """
    Servicio de traducción para inferencia en FastAPI con caché acotada en memoria.
    Traduce texto de Español a Inglés antes de entregarlo al modelo de scikit-learn si está habilitado.
    """
    def __init__(self, backend: str = "none", target_lang: str = "en", max_cache_size: int = 1000):
        self.backend = backend
        self.target_lang = target_lang
        self.max_cache_size = max_cache_size
        self._cache = OrderedDict()

    def translate(self, text: str) -> str:
        if not text or not text.strip():
            return text

        if self.backend == "none" or self.is_english(text):
            return text

        if text in self._cache:
            self._cache.move_to_end(text)
            return self._cache[text]

        translated_text = text
        if self.backend == "google" and DEEP_TRANSLATOR_AVAILABLE:
            try:
                translated_text = GoogleTranslator(source="auto", target=self.target_lang).translate(text)
            except Exception as e:
                logger.warning(f"Fallo en servicio de traducción automática ({e}). Usando texto original.")
                translated_text = text

        # Mantener caché acotada LRU
        if len(self._cache) >= self.max_cache_size:
            self._cache.popitem(last=False)
        self._cache[text] = translated_text
        return translated_text

    @staticmethod
    def is_english(text: str) -> bool:
        return not any(char in "áéíóúñüÁÉÍÓÚÑ" for char in text)
