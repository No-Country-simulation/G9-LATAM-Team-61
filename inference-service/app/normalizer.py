import re
from sklearn.base import BaseEstimator, TransformerMixin

class NormalizadorSpanglish(BaseEstimator, TransformerMixin):
    """
    Transformador de normalización Spanglish para modelos de clasificación técnico-TI.
    Reemplaza términos Spanglish y jerga dev por palabras estándar en inglés.
    """
    def __init__(self, diccionario_mapeo=None):
        if diccionario_mapeo is None:
            self.diccionario_mapeo = {
                r'\bdeployar\b': 'deploy',
                r'\bdeployado\b': 'deployed',
                r'\bbuildupear\b': 'build',
                r'\bbackear\b': 'backup',
                r'\bclusterizar\b': 'cluster',
                r'\blibreria\b': 'library',
                r'\blibrerias\b': 'libraries',
                r'\bservidor\b': 'server',
                r'\bservidores\b': 'servers'
            }
        else:
            self.diccionario_mapeo = diccionario_mapeo

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return [self._limpiar_texto(text) for text in X]

    def _limpiar_texto(self, text):
        if not isinstance(text, str):
            return ""
        text_clean = text.lower()
        for patron, reemplazo in self.diccionario_mapeo.items():
            text_clean = re.sub(patron, reemplazo, text_clean)
        return text_clean
