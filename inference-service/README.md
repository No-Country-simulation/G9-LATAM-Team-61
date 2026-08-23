# KMS Inference Service API

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green?logo=fastapi)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-orange?logo=scikit-learn)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

Microservicio canónico desarrollado con **FastAPI** para realizar inferencias sobre modelos de Machine Learning (clasificación multiclase, extracción de palabras clave y clustering temático K-Means).

---

## Arquitectura y Contrato de la API

### 1. Clasificación Individual Canónica

* **Ruta:** `POST /predict`
* **Content-Type:** `application/json`
* **Payload de Entrada:**

```json
{
  "contenido_crudo": "Configuración de balanceadores de carga en Oracle Cloud Infrastructure usando Docker y Kubernetes."
}
```

* **Restricción de Longitud:** Entre **30** y **5,000** caracteres inclusive.
* **Respuesta Exitosa (`HTTP 200`):**

```json
{
  "categoria": "DevOps",
  "probabilidad": 0.94,
  "palabras_clave": ["balanceadores", "carga", "docker", "kubernetes", "oci"],
  "tiempo_procesamiento_ms": 32.5
}
```

> **Política de Compatibilidad y Criterio de Retiro Legacy:**
> El endpoint `POST /analizar` y los campos de entrada `text` y `descripcion` se mantienen temporalmente marcados como `deprecated=True` exclusivamente para permitir la transición sin fricción de clientes antiguos. Quedarán programados para su retiro definitivo en la versión `v2.0` del microservicio una vez que todos los consumidores migren al contrato canónico `POST /predict` con `contenido_crudo`.

---

### 2. Procesamiento por Lotes (Batch)

* **Ruta:** `POST /predict/lote`
* **Payload:** `{ "textos": ["texto 1 con más de 30 caracteres...", "texto 2..."] }`
* **Restricciones:** Máximo 100 elementos por lote. Cada texto individual debe cumplir estrictamente con una longitud de entre **30 y 5,000** caracteres.

---

### 3. Clustering No Supervisado (K-Means)

* **Ruta:** `POST /predict/clustering`
<<<<<<< HEAD
* **Payload:** `{ "documentos": [{"id": "doc-1", "texto": "..."}], "n_clusters": 2, "algoritmo": "kmeans", "idioma": "es" }`
* **Respuesta en cada cluster:** Retorna `documento_ids: ["doc-1", ...]` (todos los IDs asignados para integración con backend), `documentos: [...]` (muestra de hasta 5 textos), `palabras_clave` y métricas de calidad.
=======
* **Payload:** `{ "documentos": [{"id": "1", "texto": "..."}], "n_clusters": 2, "algoritmo": "kmeans", "idioma": "es" }`
>>>>>>> origin/main
* **Restricciones:** Entre 2 y 200 documentos por solicitud. Ejecución 100% *stateless* y segura para concurrencia.

---

### 4. Healthcheck y Diagnóstico

* **`GET /health`**: Retorna `{"status": "ok", "model_loaded": true}`
* **`GET /`**: Retorna información básica y estado del servicio.

---

## Códigos de Estado y Manejo de Errores

| Código HTTP | Causa / Significado |
| :--- | :--- |
| **`200 OK`** | Inferencia procesada exitosamente. *(La categoría `Otros` solo se retorna ante inferencias válidas del modelo).* |
| **`400 Bad Request`** | Cuerpo JSON malformado, sintaxis JSON inválida o parámetros de clustering incorrectos. |
| **`415 Unsupported Media Type`** | `Content-Type` distinto de `application/json` en peticiones POST. |
| **`422 Unprocessable Entity`** | Validación fallida: campo `contenido_crudo` ausente, nulo, compuesto solo por espacios, tipo incorrecto o longitud fuera del rango (30–5000 chars) tanto en peticiones individuales como en cada elemento de lote. |
| **`500 Internal Server Error`** | Error interno no controlado (sanitizado, sin exposición de stack traces ni variables internas). |
| **`503 Service Unavailable`** | Modelo de Machine Learning no cargado o no disponible. |

---

## Estructura del Proyecto

```
inference-service/
├── app/
│   ├── clustering/         # Módulo de clustering no supervisado (K-Means stateless + TF-IDF)
│   ├── routers/            # Routers modulares (health, prediction)
│   ├── config.py           # Configuración centralizada y lectura de variables de entorno
│   ├── keywords.py         # Extracción y filtrado exhaustivo de palabras clave
│   ├── main.py             # Instancia FastAPI, middlewares seguros y manejadores de error
│   ├── model_loader.py     # Singleton para carga segura del modelo en memoria
│   ├── normalizer.py       # Transformador Scikit-Learn NormalizadorSpanglish
│   ├── predictor.py        # Orquestador del pipeline de inferencia
│   ├── schemas.py          # Esquemas Pydantic v2 con validación por elemento (Requests & Responses)
│   └── translator.py       # Servicio de traducción con caché LRU acotada (disabled by default)
├── model/
│   └── modelo_hacka.pkl    # Pipeline Scikit-Learn canónico entrenado (ubicación única)
├── tests/
│   └── test_api.py         # Suite completa de pruebas automatizadas (pytest)
├── .env.example            # Plantilla de variables de entorno
├── Dockerfile              # Empaquetado optimizado en contenedor Python 3.12 slim
├── pytest.ini              # Configuración de pytest
├── requirements.txt        # Dependencias reproducibles del microservicio
└── README.md
```

---

## Pruebas Automatizadas

Para ejecutar la suite completa de pruebas:

```bash
pytest -v
```

---

## Ejecución con Docker

Construir y levantar el contenedor:

```bash
docker build -t inference-service:latest .
docker run -d -p 8000:8000 --name stackpulse-fastapi inference-service:latest
```