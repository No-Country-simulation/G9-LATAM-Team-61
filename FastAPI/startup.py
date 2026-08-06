import sys
import os

# --- Registrar la clase NormalizadorSpanglish para joblib ---
from utils import NormalizadorSpanglish
import __main__
__main__.NormalizadorSpanglish = NormalizadorSpanglish

# --- Importar la aplicación ---
from main import app

# --- Ejecutar el servidor ---
if __name__ == "__main__":
    import uvicorn
    
    reload_mode = os.getenv("UVICORN_RELOAD", "False").lower() == "true"
    
    uvicorn.run(
        "startup:app",
        host="0.0.0.0",
        port=8000,
        reload=reload_mode,
        workers=1
    )