import logging
from fastapi import APIRouter, HTTPException, status
from app.clustering.schemas import ClusteringRequest, ClusteringResponse
from app.clustering.service import clustering_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Clustering"])

@router.post(
    "/predict/clustering",
    response_model=ClusteringResponse,
    status_code=status.HTTP_200_OK,
    summary="Agrupar documentos por temas similares",
    description="Agrupa automáticamente documentos en clusters temáticos usando K-Means y TF-IDF, preservando los IDs de los documentos."
)
def predict_clustering(request: ClusteringRequest):
    try:
        valid_docs = [doc for doc in request.documentos if doc.texto and doc.texto.strip()]
        if len(valid_docs) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se necesitan al menos 2 documentos válidos para realizar clustering."
            )
        
        textos = [doc.texto for doc in valid_docs]
        doc_ids = [str(doc.id) if doc.id is not None else str(idx) for idx, doc in enumerate(valid_docs)]
        
        resultado = clustering_service.clusterizar(
            documentos=textos,
            documento_ids=doc_ids,
            n_clusters=request.n_clusters,
            algoritmo=request.algoritmo or "kmeans",
            idioma=request.idioma or "es"
        )
        return ClusteringResponse(**resultado)
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Error de validación en clustering: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parámetros de clustering inválidos o insuficientes documentos."
        )
    except Exception as e:
        logger.error(f"Error interno durante clustering: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar el agrupamiento temático."
        )

@router.post(
    "/agrupar",
    response_model=ClusteringResponse,
    include_in_schema=False
)
def agrupar_alias(request: ClusteringRequest):
    """Alias para compatibilidad directa con Spring Boot."""
    return predict_clustering(request)
