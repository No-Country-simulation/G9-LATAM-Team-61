# app/clustering/service.py
import numpy as np
from sklearn.cluster import KMeans
from collections import Counter
import time
import logging
from typing import List, Dict, Any

from app.clustering.preprocessor import ClusteringPreprocessor

logger = logging.getLogger(__name__)

class ClusteringService:
    """
    Servicio de clustering temático sin estado mutable (Stateless & Thread-Safe).
    Cada ejecución instancia sus propios transformadores y estimadores locales para evitar
    condiciones de carrera o colisiones en entornos concurrentes.
    """
    
    def clusterizar(
        self,
        documentos: List[str],
        documento_ids: List[str],
        n_clusters: int = None,
        algoritmo: str = "kmeans",
        idioma: str = "es"
    ) -> Dict[str, Any]:
        """Realiza el clustering de documentos validando estricta cardinalidad y unicidad de IDs"""
        
        start_time = time.time()
        
        # Validación de frontera interna del servicio (Bloqueante B2)
        if documento_ids is None or not isinstance(documento_ids, list):
            raise ValueError("El parámetro documento_ids es obligatorio y debe ser una lista.")
        
        if len(documentos) != len(documento_ids):
            raise ValueError(
                f"La cardinalidad de documentos ({len(documentos)}) y documento_ids ({len(documento_ids)}) debe coincidir exactamente."
            )
            
        if len(documento_ids) != len(set(documento_ids)):
            raise ValueError("Los elementos de documento_ids deben ser estrictamente únicos.")
        
        # 1. Instanciar preprocesador local por petición (Thread-Safe)
        preprocessor = ClusteringPreprocessor()
        logger.info(f"Preprocesando {len(documentos)} documentos para clustering...")
        vectores = preprocessor.preprocesar(documentos, idioma)
        
        # 2. Determinar número óptimo de clusters si no se especifica
        if n_clusters is None:
            n_clusters = self._encontrar_clusters_optimos(vectores)
            logger.info(f"Clusters óptimos calculados: {n_clusters}")
        
        # 3. Aplicar K-Means con estimador local aislado
        logger.info(f"Aplicando K-Means con {n_clusters} clusters...")
        local_model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = local_model.fit_predict(vectores)
        
        # 4. Generar información detallada de clusters vinculando IDs
        clusters_info = self._generar_info_clusters(
            documentos,
            documento_ids,
            labels,
            preprocessor.feature_names
        )
        
        # 5. Calcular métricas internas
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
            km = KMeans(n_clusters=k, random_state=42, n_init=10)
            km.fit(vectores)
            inertias.append(km.inertia_)
        
        if len(inertias) > 2:
            cambios = [inertias[i] - inertias[i+1] for i in range(len(inertias)-1)]
            return 2 + cambios.index(min(cambios))
        
        return 3
    
    def _generar_info_clusters(
        self,
        documentos: List[str],
        documento_ids: List[str],
        labels: np.ndarray,
        feature_names: List[str]
    ) -> List[Dict]:
        """Genera información detallada de cada cluster asociando todos sus documento_ids"""
        clusters_info = []
        unique_labels = sorted(list(set(labels)))
        
        for cluster_id in unique_labels:
            mask = labels == cluster_id
            docs_cluster = [doc for doc, m in zip(documentos, mask) if m]
            ids_cluster = [doc_id for doc_id, m in zip(documento_ids, mask) if m]
            
            # Palabras más representativas
            palabras_cluster = []
            for doc in docs_cluster:
                palabras = [p for p in doc.lower().split() if p in feature_names]
                palabras_cluster.extend(palabras)
            
            top_palabras = [p for p, _ in Counter(palabras_cluster).most_common(5)]
            if len(top_palabras) == 0 and feature_names is not None and len(feature_names) > 0:
                top_palabras = list(feature_names[:3])
            
            etiqueta = self._generar_etiqueta(top_palabras)
            
            clusters_info.append({
                'cluster_id': int(cluster_id),
                'tamano': len(docs_cluster),
                'palabras_clave': top_palabras,
                'etiqueta_sugerida': etiqueta,
                'documentos': docs_cluster[:5],
                'documento_ids': ids_cluster
            })
        
        return clusters_info
    
    def _generar_etiqueta(self, palabras_clave: List[str]) -> str:
        """Genera una etiqueta legible para el cluster"""
        if not palabras_clave:
            return "Tema General"
        return " / ".join([p.capitalize() for p in palabras_clave[:3]])
    
    def _calcular_metricas(self, vectores: np.ndarray, labels: np.ndarray) -> Dict[str, float]:
        """Calcula métricas de calidad de clustering de forma segura"""
        metricas = {
            'inercia': 0.0,
            'silhouette_score': 0.0
        }
        
        if len(set(labels)) > 1 and len(vectores) > len(set(labels)):
            try:
                from sklearn.metrics import silhouette_score
                metricas['silhouette_score'] = round(float(silhouette_score(vectores, labels)), 3)
            except Exception:
                metricas['silhouette_score'] = 0.0
                
        return metricas

clustering_service = ClusteringService()
