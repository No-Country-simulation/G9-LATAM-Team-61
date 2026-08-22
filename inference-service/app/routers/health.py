from fastapi import APIRouter
from app.model_loader import loader

router = APIRouter(tags=["Health & Status"])

@router.get("/", summary="Información del microservicio")
def root():
    return {
        "service": "KMS Inference Service API",
        "status": "running",
        "docs": "/docs"
    }

@router.get("/health", summary="Health check del microservicio y modelo")
def health():
    return {
        "status": "ok",
        "model_loaded": loader.is_loaded
    }
