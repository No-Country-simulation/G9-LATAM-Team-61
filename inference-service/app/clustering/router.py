import logging
from fastapi import APIRouter, HTTPException
from app.clustering.schemas import ClusteringRequest, ClusteringResponse
from app.clustering.service import clustering_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Clustering"])

@router.post(
    "/predict/clustering",
    response_model=ClusteringResponse,
    status_code=200,
    summary="Agrupar documentos por temas similares",
    description="Agrupa automáticamente documentos en clusters temáticos usando K-Means y TF-IDF"
)
def predict_clustering(request: ClusteringRequest):
    try:
        textos = [doc.texto for doc in request.documentos if doc.texto and doc.texto.strip()]
        if len(textos) < 2:
            raise HTTPException(status_code=400, detail="Se necesitan al menos 2 documentos para realizar clustering.")
        
        resultado = clustering_service.clusterizar(
            documentos=textos,
            n_clusters=request.n_clusters,
            algoritmo=request.algoritmo or "kmeans",
            idioma=request.idioma or "es"
        )
        return ClusteringResponse(**resultado)
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Error de validación en clustering: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error procesando clustering: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al procesar clustering: {str(e)}")

@router.post(
    "/agrupar",
    response_model=ClusteringResponse,
    include_in_schema=False
)
def agrupar_alias(request: ClusteringRequest):
    """Alias para compatibilidad directa con Spring Boot."""
    return predict_clustering(request)
