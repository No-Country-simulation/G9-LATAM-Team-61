from fastapi import APIRouter
from app.schemas import PredictionRequest, PredictionResponse, BatchPredictionRequest
from app.predictor import predictor

router = APIRouter(tags=["Prediction"])

@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=200,
    summary="Clasificación canónica de texto técnico",
    description="Endpoint principal de inferencia. Recibe 'contenido_crudo' (30 a 5000 caracteres) y clasifica la nota técnica con el modelo ML."
)
def predict(request: PredictionRequest):
    return predictor.predict(request.contenido_crudo)

@router.post(
    "/analizar",
    response_model=PredictionResponse,
    status_code=200,
    deprecated=True,
    summary="[LEGACY] Endpoint alias para compatibilidad retroactiva",
    description="Ruta heredada temporal para compatibilidad hacia atrás con clientes anteriores. Usar '/predict' como ruta canónica."
)
def analizar(request: PredictionRequest):
    return predictor.predict(request.contenido_crudo)

@router.post(
    "/predict/lote",
    summary="Clasificación por lotes masivos",
    description="Procesa un array de textos técnicos de forma vectorizada en memoria."
)
def predict_batch(request: BatchPredictionRequest):
    return predictor.predict_batch(request.textos)
