import sys
import joblib
from app.config import MODEL_FILE
from app.normalizer import NormalizadorSpanglish

# Inyectar NormalizadorSpanglish en sys.modules['__main__'] antes de des-serializar el pickle
setattr(sys.modules['__main__'], 'NormalizadorSpanglish', NormalizadorSpanglish)

class ModelLoader:
    """
    Responsable de cargar el pipeline integrado del modelo de scikit-learn.
    """
    def __init__(self):
        self.model = None

    def load(self):
        """
        Carga el pipeline integrado entrenado.
        """
        self.model = joblib.load(MODEL_FILE)

    @property
    def is_loaded(self) -> bool:
        """
        Indica si el modelo fue cargado correctamente.
        """
        return self.model is not None

loader = ModelLoader()