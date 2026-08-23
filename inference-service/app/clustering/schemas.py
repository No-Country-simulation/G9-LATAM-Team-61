# app/clustering/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.config import MAX_CLUSTERING_DOCS

class DocumentoCluster(BaseModel):
    """Un documento para clusterizar con ID obligatorio e inequívoco"""
    id: str = Field(..., description="ID único y obligatorio del documento")
    texto: str = Field(..., min_length=3, max_length=5000)
    metadata: Optional[Dict[str, Any]] = None
    
    @field_validator('id', mode='before')
    @classmethod
    def validar_id(cls, v: Any) -> str:
        if v is None:
            raise ValueError('El campo id es obligatorio y no puede ser nulo.')
        str_val = str(v).strip()
        if not str_val:
            raise ValueError('El campo id no puede estar vacío o contener solo espacios.')
        return str_val

    @field_validator('texto')
    @classmethod
    def validar_texto(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError('El texto debe tener al menos 3 caracteres.')
        return v.strip()

class ClusteringRequest(BaseModel):
    """Solicitud de clustering con validación de unicidad de IDs"""
    documentos: List[DocumentoCluster] = Field(
        ..., 
        min_length=2,
        max_length=MAX_CLUSTERING_DOCS,
        description=f"Lista de documentos a clusterizar (mínimo 2, máximo {MAX_CLUSTERING_DOCS})"
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

    @field_validator('documentos')
    @classmethod
    def validar_unicidad_ids(cls, docs: List[DocumentoCluster]) -> List[DocumentoCluster]:
        ids = [doc.id for doc in docs]
        if len(ids) != len(set(ids)):
            seen = set()
            dups = set()
            for doc_id in ids:
                if doc_id in seen:
                    dups.add(doc_id)
                seen.add(doc_id)
            raise ValueError(f"Los IDs de los documentos deben ser únicos en la solicitud. IDs duplicados detectados: {sorted(list(dups))}")
        return docs

class ClusterInfo(BaseModel):
    """Información de un cluster"""
    cluster_id: int
    tamano: int
    palabras_clave: List[str] = Field(..., max_length=10)
    etiqueta_sugerida: str
    documentos: List[str] = Field(..., max_length=5)  # Muestra representativa de hasta 5 documentos
    documento_ids: List[str] = Field(default_factory=list, description="Lista completa de IDs de los documentos asignados al cluster")

class ClusteringResponse(BaseModel):
    """Respuesta de clustering"""
    cluster_id: str
    n_clusters: int
    n_documentos: int
    clusters: List[ClusterInfo]
    metricas: Dict[str, float]
    tiempo_procesamiento_ms: float
    timestamp: datetime = Field(default_factory=datetime.now)