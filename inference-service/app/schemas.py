from pydantic import BaseModel, Field, model_validator

class PredictionRequest(BaseModel):
    text: str | None = Field(
        default=None,
        description="Texto que será clasificado por el modelo de IA",
        json_schema_extra={
            "example": "Configuración de balanceadores de carga en OCI usando Docker"
        }
    )
    contenido_crudo: str | None = Field(
        default=None,
        description="Alias de texto recibido desde Spring Boot",
        json_schema_extra={
            "example": "Configuración de balanceadores de carga en OCI usando Docker"
        }
    )
    descripcion: str | None = Field(
        default=None,
        description="Alias de descripción recibido desde Spring Boot DTO",
        json_schema_extra={
            "example": "Configuración de balanceadores de carga en OCI usando Docker"
        }
    )

    @model_validator(mode='after')
    def validate_text_present(self):
        # Garantizar que al menos uno de los campos ('text', 'contenido_crudo' o 'descripcion') contenga el texto
        content = self.text or self.contenido_crudo or self.descripcion
        if not content or not content.strip():
            raise ValueError("Debe proporcionar 'text', 'contenido_crudo' o 'descripcion' no vacío.")
        self.text = content.strip()
        return self

class PredictionResponse(BaseModel):
    categoria: str = Field(
        ...,
        description="Categoría predicha por el modelo (Backend, Frontend, DevOps, Data Science, Mobile, Otros)",
        json_schema_extra={"example": "DevOps"}
    )
    probabilidad: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Nivel de confianza de la inferencia (0.0 a 1.0)",
        json_schema_extra={"example": 0.94}
    )
    palabras_clave: list[str] = Field(
        default_factory=list,
        description="Top palabras clave más relevantes extraídas de la nota",
        json_schema_extra={"example": ["configuracion", "balanceador", "docker"]}
    )
    tiempo_procesamiento_ms: float | None = Field(
        default=None,
        description="Tiempo exacto transcurrido en la inferencia (milisegundos)",
        json_schema_extra={"example": 32.5}
    )

class BatchPredictionRequest(BaseModel):
    textos: list[str] = Field(
        ...,
        min_length=1,
        description="Lista de textos para clasificación por lotes",
        json_schema_extra={"example": ["Diseño de tablas en PostgreSQL", "Componentes de React"]}
    )