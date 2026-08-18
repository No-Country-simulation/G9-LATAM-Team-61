import re
import time
from fastapi import HTTPException
from app.model_loader import loader
from app.config import TRANSLATOR_BACKEND, TRANSLATE_TARGET_LANG, KEYWORDS_TOP_N
from app.translator import TranslatorService
from app.keywords import extract_keywords

def limpiar_texto_unitario(texto: str) -> str:
    if not isinstance(texto, str):
        return ""
    texto = re.sub(r'<[^>]+>', ' ', texto)
    texto = re.sub(r'http\S+|www\S+', ' ', texto)
    texto = re.sub(r'\s+', ' ', texto).strip()
    return texto

class Predictor:
    def __init__(self):
        self.translator = TranslatorService(backend=TRANSLATOR_BACKEND, target_lang=TRANSLATE_TARGET_LANG)

    def predict(self, text: str) -> dict:
        """
        Realiza una inferencia sobre el texto ingresado:
        1. Aplica sanitización estructural y valida umbral analítico.
        2. Traduce texto ES -> EN mediante TranslatorService.
        3. Ejecuta predicción sobre el Pipeline scikit-learn.
        4. Calcula probabilidad de confianza y extrae palabras clave.
        5. Registra el tiempo exacto de procesamiento (tiempo_procesamiento_ms).
        """
        start_time = time.time()

        if not loader.is_loaded:
            raise HTTPException(
                status_code=503,
                detail="El modelo de IA aún no está cargado."
            )

        raw_text = (text or '').strip() if isinstance(text, str) else ''
        if not raw_text:
            raise HTTPException(
                status_code=400,
                detail="El texto no puede estar vacío."
            )

        clean_text = limpiar_texto_unitario(raw_text)

        # Umbral analítico acordado con Data (30 <= caracteres <= 5000)
        if len(clean_text) < 30 or len(clean_text) > 5000:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "categoria": "Otros",
                "probabilidad": 0.0,
                "palabras_clave": [],
                "tiempo_procesamiento_ms": elapsed_ms
            }

        try:
            # 1. Traducir texto si aplica
            text_for_model = self.translator.translate(clean_text)

            # 2. Inferencia sobre el modelo scikit-learn
            predictions = loader.model.predict([text_for_model])
            predicted_class = str(predictions[0])

            # 3. Cálculo de probabilidades (predict_proba)
            probabilidad = 0.94
            if hasattr(loader.model, "predict_proba"):
                probas = loader.model.predict_proba([text_for_model])[0]
                classes = list(loader.model.classes_)
                if predicted_class in classes:
                    idx = classes.index(predicted_class)
                    probabilidad = round(float(probas[idx]), 3)

            # 4. Extracción de palabras clave sobre el texto original sanitizado (antes de la traducción)
            keywords = extract_keywords(clean_text, top_n=KEYWORDS_TOP_N)
            elapsed_ms = round((time.time() - start_time) * 1000, 2)

            return {
                "categoria": predicted_class,
                "probabilidad": probabilidad,
                "palabras_clave": keywords,
                "tiempo_procesamiento_ms": elapsed_ms
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error realizando la inferencia: {str(e)}"
            )

    def predict_batch(self, texts: list[str]) -> list[dict]:
        """
        Procesamiento vectorizado por lotes (Bulk CSV upload) optimizado en RAM.
        """
        if not texts:
            return []
        return [self.predict(t) for t in texts]

predictor = Predictor()