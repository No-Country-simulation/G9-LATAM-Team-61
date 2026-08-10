# app/clustering/schemas.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentoCluster(BaseModel):
    """Un documento para clusterizar"""
    id: Optional[str] = Field(None, description="ID único del documento")
    texto: str = Field(..., min_length=3, max_length=5000)
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('texto')
    def validar_texto(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('El texto debe tener al menos 3 caracteres')
        return v

class ClusteringRequest(BaseModel):
    """Solicitud de clustering"""
    documentos: List[DocumentoCluster] = Field(
        ..., 
        min_items=2,
        description="Lista de documentos a clusterizar (mínimo 2)"
    )
    n_clusters: Optional[int] = Field(
        None, 
        ge=2, 
        le=20,
        description="Número de clusters (si no se especifica, se calcula automáticamente)"
    )
    algoritmo: Optional[str] = Field(
        "kmeans",
        description="Algoritmo: kmeans, dbscan, hierarchical"
    )
    idioma: Optional[str] = Field(
        "es",
        description="Idioma: es (español) o en (inglés)"
    )

class ClusterInfo(BaseModel):
    """Información de un cluster"""
    cluster_id: int
    tamano: int
    palabras_clave: List[str] = Field(..., max_items=10)
    etiqueta_sugerida: str
    documentos: List[str] = Field(..., max_items=5)  # Top 5 documentos

class ClusteringResponse(BaseModel):
    """Respuesta de clustering"""
    cluster_id: str
    n_clusters: int
    n_documentos: int
    clusters: List[ClusterInfo]
    metricas: Dict[str, float]
    tiempo_procesamiento_ms: float
    timestamp: datetime = Field(default_factory=datetime.now)