from sklearn.base import BaseEstimator, TransformerMixin
import re
import pandas as pd

class NormalizadorSpanglish(BaseEstimator, TransformerMixin):
    def __init__(self, diccionario_mapeo=None):
        self.diccionario_mapeo = diccionario_mapeo or {
            r'\bdeployar\b|\bdeploye\b|\bdesplegar\b': 'deploy',
            r'\blibreria\b|\blibrerias\b': 'library',
            r'\barreglo\b|\barreglos\b': 'array',
            r'\bconsulta\b|\bconsultas\b': 'query',
            r'\bservidor\b|\bservidores\b': 'server',
            r'\bfuncion\b|\bfunciones\b': 'function',
            r'\bbase\s*de\s*datos\b|\bbdd\b|\bbd\b': 'database',
            r'\berror\b|\bfallo\b|\bbug\b': 'error'
        }

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if isinstance(X, pd.Series):
            return X.apply(self._limpiar_texto)
        elif isinstance(X, (list, tuple)):
            return [self._limpiar_texto(texto) for texto in X]
        else:
            return [self._limpiar_texto(str(X))]

    def _limpiar_texto(self, texto):
        if not isinstance(texto, str) or pd.isna(texto):
            return ""
        
        texto = texto.lower()
        
        for patron, reemplazo in self.diccionario_mapeo.items():
            texto = re.sub(patron, reemplazo, texto)
        
        texto = re.sub(r'[^a-z0-9\s]', ' ', texto)
        texto = re.sub(r'\s+', ' ', texto).strip()
        
        return texto