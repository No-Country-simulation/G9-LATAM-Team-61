# app/clustering/service.py
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from collections import Counter
import time
import logging
from typing import List, Dict, Any

from app.clustering.preprocessor import ClusteringPreprocessor
from app.clustering.schemas import ClusterInfo

logger = logging.getLogger(__name__)

class ClusteringService:
    """Servicio principal de clustering"""
    
    def __init__(self):
        self.preprocessor = ClusteringPreprocessor()
        self.model = None
    
    def clusterizar(
        self,
        documentos: List[str],
        n_clusters: int = None,
        algoritmo: str = "kmeans",
        idioma: str = "es"
    ) -> Dict[str, Any]:
        """Realiza el clustering de documentos"""
        
        start_time = time.time()
        
        # 1. Preprocesar documentos
        logger.info(f"Preprocesando {len(documentos)} documentos...")
        vectores = self.preprocessor.preprocesar(documentos, idioma)
        
        # 2. Determinar número óptimo de clusters
        if n_clusters is None:
            n_clusters = self._encontrar_clusters_optimos(vectores)
            logger.info(f"Clusters óptimos: {n_clusters}")
        
        # 3. Aplicar K-Means
        logger.info(f"Aplicando K-Means con {n_clusters} clusters...")
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = self.model.fit_predict(vectores)
        
        # 4. Generar información de clusters
        clusters_info = self._generar_info_clusters(
            documentos, 
            labels,
            self.preprocessor.feature_names
        )
        
        # 5. Calcular métricas
        metricas = self._calcular_metricas(vectores, labels)
        
        tiempo = (time.time() - start_time) * 1000
        
        return {
            'cluster_id': f"cluster_{int(time.time())}",
            'n_clusters': n_clusters,
            'n_documentos': len(documentos),
            'clusters': clusters_info,
            'metricas': metricas,
            'tiempo_procesamiento_ms': round(tiempo, 2)
        }
    
    def _encontrar_clusters_optimos(self, vectores: np.ndarray) -> int:
        """Encuentra el número óptimo de clusters usando método del codo"""
        max_clusters = min(10, len(vectores) // 2)
        
        if len(vectores) < 10:
            return 2
        
        inertias = []
        for k in range(2, max_clusters + 1):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(vectores)
            inertias.append(kmeans.inertia_)
        
        # Buscar el punto de inflexión
        if len(inertias) > 2:
            cambios = [inertias[i] - inertias[i+1] for i in range(len(inertias)-1)]
            return 2 + cambios.index(min(cambios))
        
        return 3  # Valor por defecto
    
    def _generar_info_clusters(
        self,
        documentos: List[str],
        labels: np.ndarray,
        feature_names: List[str]
    ) -> List[Dict]:
        """Genera información detallada de cada cluster"""
        clusters_info = []
        unique_labels = set(labels)
        
        for cluster_id in unique_labels:
            # Documentos en este cluster
            mask = labels == cluster_id
            docs_cluster = [documentos[i] for i in range(len(documentos)) if mask[i]]
            
            # Extraer palabras clave
            palabras_clave = self._extraer_keywords(docs_cluster)
            
            # Generar etiqueta sugerida
            etiqueta = ' '.join(palabras_clave[:3]).title()
            
            clusters_info.append({
                'cluster_id': int(cluster_id),
                'tamano': len(docs_cluster),
                'palabras_clave': palabras_clave[:10],
                'etiqueta_sugerida': etiqueta if etiqueta else "Cluster sin nombre",
                'documentos': docs_cluster[:5]  # Solo top 5
            })
        
        return clusters_info
    
    def _extraer_keywords(self, documentos: List[str]) -> List[str]:
        """Extrae palabras clave de un cluster usando el módulo optimizado de keywords"""
        from app.keywords import extract_keywords
        texto_unido = ' '.join(documentos)
        return extract_keywords(texto_unido, top_n=10)
    
    def _calcular_metricas(self, vectores: np.ndarray, labels: np.ndarray) -> Dict:
        """Calcula métricas de calidad"""
        metricas = {}
        
        if len(set(labels)) > 1:
            try:
                metricas['silhouette_score'] = round(
                    silhouette_score(vectores, labels), 3
                )
            except:
                metricas['silhouette_score'] = 0.0
        
        return metricas

# Instancia global para usar en toda la app
clustering_service = ClusteringService()