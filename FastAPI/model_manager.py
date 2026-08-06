import joblib
import os
from utils import NormalizadorSpanglish

# --- Registrar la clase para joblib ---
import __main__
__main__.NormalizadorSpanglish = NormalizadorSpanglish

class ModelManager:
    """Gestor del modelo de predicción"""
    
    def __init__(self, model_path="model/modelo_hacka.pkl"):
        self.model_path = model_path
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Carga el modelo desde el archivo"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"No se encontró el modelo en {self.model_path}")
            
            self.model = joblib.load(self.model_path)
            print(f"✅ Modelo cargado exitosamente desde {self.model_path}")
            return True
        except FileNotFoundError as e:
            print(f"❌ Error: {e}")
            self.model = None
            return False
        except Exception as e:
            print(f"❌ Error al cargar el modelo: {e}")
            self.model = None
            return False
    
    def predict(self, text: str) -> str:
        """Predice el tag para un texto"""
        if self.model is None:
            raise RuntimeError("El modelo no está cargado")
        
        prediction = self.model.predict([text])[0]
        return prediction
    
    def is_loaded(self) -> bool:
        return self.model is not None