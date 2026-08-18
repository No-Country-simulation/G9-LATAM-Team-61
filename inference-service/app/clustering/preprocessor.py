# app/clustering/preprocessor.py
import re
import numpy as np
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from app.keywords import STOPWORDS_ES

class ClusteringPreprocessor:
    """Preprocesa documentos para clustering"""
    
    def __init__(self):
        self.vectorizer = None
        self.feature_names = []
    
    def preprocesar(self, documentos: List[str], idioma: str = "es") -> np.ndarray:
        """Convierte documentos en vectores numéricos"""
        
        # 1. Limpiar textos
        textos_limpios = []
        for doc in documentos:
            texto = str(doc or '').lower()
            texto = re.sub(r'[^\w\s]', ' ', texto)
            texto = re.sub(r'\s+', ' ', texto).strip()
            textos_limpios.append(texto)
        
        # 2. Configurar vectorizador según idioma
        stop_words = self._cargar_stopwords(idioma)
        
        # min_df seguro para evitar errores con lotes pequeños
        min_df = 1 if len(documentos) <= 10 else 2
        
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            min_df=min_df,
            max_df=1.0 if len(documentos) <= 3 else 0.85,
            ngram_range=(1, 2),
            stop_words=stop_words
        )
        
        # 3. Convertir a vectores
        vectores = self.vectorizer.fit_transform(textos_limpios)
        self.feature_names = self.vectorizer.get_feature_names_out()
        
        return vectores.toarray()
    
    def _cargar_stopwords(self, idioma: str) -> List[str]:
        """Carga palabras vacías según idioma"""
        if idioma == "es":
            return list(STOPWORDS_ES)
        else:
            return 'english'  # Usa stopwords de scikit-learn para inglés