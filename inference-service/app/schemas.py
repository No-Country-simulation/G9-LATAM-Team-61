from pydantic import BaseModel, Field, model_validator, field_validator
from app.config import MIN_TEXT_LENGTH, MAX_TEXT_LENGTH, MAX_BATCH_SIZE

class PredictionRequest(BaseModel):
    contenido_crudo: str | None = Field(
        default=None,
        description=f"Texto técnico a clasificar por el modelo de IA ({MIN_TEXT_LENGTH} a {MAX_TEXT_LENGTH} caracteres)",
        json_schema_extra={
            "example": "Configuración de balanceadores de carga en Oracle Cloud Infrastructure usando Docker y Kubernetes."
        }
    )
    # Campos de compatibilidad legacy aislados y documentados
    text: str | None = Field(
        default=None,
        deprecated=True,
        description="[LEGACY] Campo obsoleto. Usar 'contenido_crudo' en el nuevo contrato."
    )
    descripcion: str | None = Field(
        default=None,
        deprecated=True,
        description="[LEGACY] Campo obsoleto. Usar 'contenido_crudo' en el nuevo contrato."
    )

    @model_validator(mode='after')
    def validate_and_normalize_content(self):
        raw_val = self.contenido_crudo if self.contenido_crudo is not None else (self.text if self.text is not None else self.descripcion)
        
        if raw_val is None:
            raise ValueError("El campo 'contenido_crudo' es obligatorio y no puede ser null.")
        
        if not isinstance(raw_val, str) or not raw_val.strip():
            raise ValueError("El campo 'contenido_crudo' no puede estar vacío ni contener solo espacios.")
        
        clean_text = raw_val.strip()
        if len(clean_text) < MIN_TEXT_LENGTH or len(clean_text) > MAX_TEXT_LENGTH:
            raise ValueError(
                f"El texto debe tener entre {MIN_TEXT_LENGTH} y {MAX_TEXT_LENGTH} caracteres (longitud actual: {len(clean_text)})."
            )
        
        self.contenido_crudo = clean_text
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
        description="Tiempo transcurrido en la inferencia (milisegundos)",
        json_schema_extra={"example": 32.5}
    )

class BatchPredictionRequest(BaseModel):
    textos: list[str] = Field(
        ...,
        min_length=1,
        max_length=MAX_BATCH_SIZE,
        description=f"Lista de notas técnicas para procesamiento en lote (máximo {MAX_BATCH_SIZE} notas por lote)",
        json_schema_extra={
            "example": [
                "Configuración de balanceadores de carga en OCI usando Docker.",
                "Desarrollo de interfaces reactivas con React 19 y TypeScript."
            ]
        }
    )

    @field_validator('textos')
    @classmethod
    def validate_individual_batch_elements(cls, textos: list[str]) -> list[str]:
        cleaned_list = []
        for idx, item in enumerate(textos):
            if not isinstance(item, str) or not item.strip():
                raise ValueError(f"El elemento en el índice {idx} no puede estar vacío ni contener solo espacios.")
            clean_item = item.strip()
            if len(clean_item) < MIN_TEXT_LENGTH or len(clean_item) > MAX_TEXT_LENGTH:
                raise ValueError(
                    f"El elemento en el índice {idx} debe tener entre {MIN_TEXT_LENGTH} y {MAX_TEXT_LENGTH} caracteres (longitud actual: {len(clean_item)})."
                )
            cleaned_list.append(clean_item)
        return cleaned_list