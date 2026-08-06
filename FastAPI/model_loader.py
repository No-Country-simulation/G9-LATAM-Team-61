import joblib
import os
import sys
from utils import NormalizadorSpanglish

# --- IMPORTANTE: Registrar la clase en __main__ ANTES de cargar ---
import __main__
__main__.NormalizadorSpanglish = NormalizadorSpanglish

# También registrar en el módulo actual
sys.modules[__name__].NormalizadorSpanglish = NormalizadorSpanglish

def load_model(model_path):
    """Carga el modelo asegurando que la clase NormalizadorSpanglish esté disponible"""
    try:
        # Forzar la importación de la clase en el contexto global
        global NormalizadorSpanglish
        NormalizadorSpanglish = NormalizadorSpanglish
        
        # Cargar el modelo
        model = joblib.load(model_path)
        print(f"Modelo cargado exitosamente desde {model_path}")
        return model
    except Exception as e:
        print(f"Error al cargar el modelo: {e}")
        return None