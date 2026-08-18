from fastapi import APIRouter
from app.schemas import PredictionRequest, PredictionResponse, BatchPredictionRequest
from app.predictor import predictor

router = APIRouter(tags=["Prediction"])

@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Clasificación individual de texto",
    description="Sanitiza, traduce y clasifica una nota técnica con el modelo ML."
)
def predict(request: PredictionRequest):
    return predictor.predict(request.text)

@router.post(
    "/analizar",
    response_model=PredictionResponse,
    summary="Alias de clasificación individual",
    description="Endpoint alias compatible para inferencia individual."
)
def analizar(request: PredictionRequest):
    return predictor.predict(request.text)

@router.post(
    "/predict/lote",
    summary="Clasificación por lotes masivos",
    description="Procesa un array de textos de forma vectorizada en RAM."
)
def predict_batch(request: BatchPredictionRequest):
    return predictor.predict_batch(request.textos)
