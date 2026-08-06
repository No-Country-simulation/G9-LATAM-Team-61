import joblib
import os
import re
import pandas as pd
import sys
import sklearn
import sklearn.linear_model
import sklearn.feature_extraction.text
from normalizador import NormalizadorSpanglish
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import HashingVectorizer # Necesario para joblib.load
from sklearn.linear_model import SGDClassifier # Necesario para joblib.load
from sklearn.pipeline import Pipeline # Necesario para joblib.load

# Cargar variables de entorno
load_dotenv()

# --- Definición de la clase NormalizadorSpanglish (necesaria para joblib.load) ---
# joblib necesita tener la definición de la clase presente en el entorno donde se carga el modelo.


# --- Configuración de Google Cloud Translation API ---
GOOGLE_TRANSLATE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

translate_client = None
if GOOGLE_TRANSLATE_API_KEY or GOOGLE_APPLICATION_CREDENTIALS:
    try:
        from google.cloud import translate_v2 as translate
        translate_client = translate.Client(api_key=GOOGLE_TRANSLATE_API_KEY)
        print("Google Cloud Translation client inicializado.")
    except Exception as e:
        print(f"Advertencia: No se pudo inicializar Google Cloud Translation: {e}")
        print("Las traducciones no estarán disponibles. El texto se pasará directamente al modelo.")
else:
    print("Advertencia: No se encontraron credenciales de Google Cloud Translation (.env). El texto se pasará directamente al modelo.")

# --- Función de traducción ---
def translate_text(text: str, target_language: str = 'en') -> str:
    if not translate_client:
        return text # No translation if client not initialized
    try:
        result = translate_client.translate(text, target_language=target_language)
        return result['translatedText']
    except Exception as e:
        print(f"Error durante la traducción: {e}. Se devuelve el texto original.")
        return text

# --- Cargar el modelo ---
MODEL_PATH = "model/modelo_hacka.pkl"
try:
    # Asegúrate de que las clases personalizadas estén disponibles en el scope global
    # para que joblib pueda deserializarlas.
    model_pipeline = joblib.load(MODEL_PATH)
    print(f"Modelo cargado exitosamente desde {MODEL_PATH}")
except FileNotFoundError:
    raise HTTPException(status_code=500, detail=f"Modelo no encontrado en {MODEL_PATH}. Asegúrate de que el archivo exista.")
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Error al cargar el modelo: {e}")

app = FastAPI(
    title="StackPulse Tag Predictor",
    description="API para predecir tags de Stack Overflow a partir del texto de la pregunta, con traducción opcional.",
    version="1.0.0"
)

# --- Esquema de la solicitud de predicción ---
class PredictRequest(BaseModel):
    text: str
    translate_to_english: bool = True # Por defecto, traducir a inglés

# --- Endpoint de predicción ---
@app.post("/predict")
async def predict_tag(request: PredictRequest):
    input_text = request.text

    # Paso de traducción (si está habilitado y el cliente está configurado)
    if request.translate_to_english:
        processed_text = translate_text(input_text, target_language='en')
        if processed_text != input_text:
            print(f"Texto original: '{input_text[:50]}'...")
            print(f"Texto traducido: '{processed_text[:50]}'...")
        else:
            print(f"No se realizó la traducción (API no configurada o error). Procesando texto original: '{input_text[:50]}'...")
    else:
        processed_text = input_text
        print(f"Traducción deshabilitada. Procesando texto original: '{input_text[:50]}'...")

    # El pipeline_final ya contiene NormalizadorSpanglish y HashingVectorizer
    # NormalizadorSpanglish procesará el texto traducido/original, y como ya estará en inglés,
    # sus patrones para Spanglish/Español no se activarán, 'neutralizando' su efecto sobre estos.
    prediction = model_pipeline.predict([processed_text])[0]

    return {"predicted_tag": prediction, "processed_text": processed_text}

# --- Endpoint de salud ---
@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": True if model_pipeline else False}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
