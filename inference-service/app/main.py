import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.model_loader import loader
from app.routers.health import router as health_router
from app.routers.prediction import router as prediction_router
from app.clustering.router import router as clustering_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación.
    Carga el modelo scikit-learn como Singleton en memoria al arrancar.
    """
    logger.info("Iniciando microservicio de inferencia FastAPI...")
    loader.load()
    logger.info("Modelo scikit-learn (.pkl) cargado correctamente en memoria.")
    yield
    logger.info("Cerrando microservicio de inferencia...")

app = FastAPI(
    title="KMS Inference Service API",
    description="Microservicio canónico de inferencia IA para clasificación de texto y clustering temático.",
    version="1.0.0",
    lifespan=lifespan,
    contact={"name": "G9 LATAM Team 61"}
)

# 1. Configuración Segura de CORS (Wildcard sin credenciales para prevenir vulnerabilidades)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Middleware para validar Media Type (HTTP 415) en peticiones POST
@app.middleware("http")
async def validate_media_type_middleware(request: Request, call_next):
    if request.method == "POST":
        content_type = request.headers.get("content-type", "")
        # Validar en rutas de API que no sean documentación
        if request.url.path not in ["/docs", "/openapi.json", "/redoc"]:
            if content_type and not content_type.startswith("application/json"):
                return JSONResponse(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    content={"detail": "Unsupported Media Type: El Content-Type debe ser 'application/json'."}
                )
    return await call_next(request)

# 3. Manejador de Errores de Validación (HTTP 422) y JSON Malformado (HTTP 400)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    # Si el error es JSON malformado (JSON decode error), retornar 400 Bad Request
    for err in errors:
        err_type = str(err.get("type", ""))
        if "json" in err_type or "decode" in err_type:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Cuerpo de solicitud JSON malformado o inválido."}
            )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": jsonable_encoder(errors)}
    )

# 4. Manejador de Excepciones HTTP
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# 5. Manejador Global de Errores no controlados (HTTP 500) sin exponer stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Excepción no controlada en ruta {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno del servidor al procesar la solicitud."}
    )

# Montaje de Routers Modulares
app.include_router(health_router)
app.include_router(prediction_router)
app.include_router(clustering_router)