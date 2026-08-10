from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.model_loader import loader
from app.routers.health import router as health_router
from app.routers.prediction import router as prediction_router
from app.clustering.router import router as clustering_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación.
    Carga el modelo scikit-learn como Singleton en memoria al arrancar.
    """
    print("Iniciando microservicio de inferencia FastAPI...")
    loader.load()
    print("Modelo scikit-learn (.pkl) cargado correctamente en memoria.")
    yield
    print("Cerrando microservicio de inferencia...")

app = FastAPI(
    title="KMS Inference Service API",
    description="Microservicio de inferencia IA para clasificación de texto, extracción de palabras clave y clustering temático.",
    version="1.0.0",
    lifespan=lifespan,
    contact={"name": "G9 LATAM Team 61"}
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje de Routers Modulares
app.include_router(health_router)
app.include_router(prediction_router)
app.include_router(clustering_router)