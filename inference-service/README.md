# KMS Inference Service API

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green?logo=fastapi)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-orange?logo=scikit-learn)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

Microservicio canónico desarrollado con **FastAPI** para realizar inferencias sobre modelos de Machine Learning (clasificación multiclase, extracción de palabras clave y clustering temático K-Means).

---

## 🏛️ Arquitectura y Contrato de la API

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

> **Nota de compatibilidad legacy:** El endpoint `POST /analizar` y los campos `text`/`descripcion` se mantienen exclusivamente marcados como `deprecated` para compatibilidad retroactiva temporal.

---

### 2. Procesamiento por Lotes (Batch)

* **Ruta:** `POST /predict/lote`
* **Payload:** `{ "textos": ["texto 1 con más de 30 caracteres...", "texto 2..."] }` (máximo 100 elementos por lote).

---

### 3. Clustering No Supervisado (K-Means)

* **Ruta:** `POST /predict/clustering`
* **Payload:** `{ "documentos": [{"id": "1", "texto": "..."}], "n_clusters": 2, "algoritmo": "kmeans", "idioma": "es" }`

---

### 4. Healthcheck y Diagnóstico

* **`GET /health`**: Retorna `{"status": "ok", "model_loaded": true}`
* **`GET /`**: Retorna información básica y estado del servicio.

---

## 🚦 Códigos de Estado y Manejo de Errores

| Código HTTP | Causa / Significado |
| :--- | :--- |
| **`200 OK`** | Inferencia procesada exitosamente. *(La categoría `Otros` solo se retorna ante inferencias válidas del modelo).* |
| **`400 Bad Request`** | Cuerpo JSON malformado o sintaxis JSON inválida. |
| **`415 Unsupported Media Type`** | `Content-Type` distinto de `application/json` en peticiones POST. |
| **`422 Unprocessable Entity`** | Validación fallida: campo `contenido_crudo` ausente, nulo, tipo incorrecto o longitud fuera del rango (30–5000 chars). |
| **`500 Internal Server Error`** | Error interno no controlado (sin exposición de stack traces ni variables internas). |
| **`503 Service Unavailable`** | Modelo de Machine Learning no cargado o no disponible. |

---

## 📁 Estructura del Proyecto

```
inference-service/
├── app/
│   ├── clustering/         # Módulo de clustering no supervisado (K-Means + TF-IDF)
│   ├── routers/            # Routers modulares (health, prediction)
│   ├── config.py           # Configuración centralizada y lectura de variables de entorno
│   ├── keywords.py         # Extracción y filtrado exhaustivo de palabras clave
│   ├── main.py             # Instancia FastAPI, middlewares seguros y manejadores de error
│   ├── model_loader.py     # Singleton para carga segura del modelo en memoria
│   ├── normalizer.py       # Transformador Scikit-Learn NormalizadorSpanglish
│   ├── predictor.py        # Orquestador del pipeline de inferencia
│   ├── schemas.py          # Esquemas Pydantic v2 (Requests & Responses)
│   └── translator.py       # Servicio de traducción con caché LRU acotada (disabled by default)
├── model/
│   └── modelo_hacka.pkl    # Pipeline Scikit-Learn canónico entrenado
├── tests/
│   └── test_api.py         # Suite completa de pruebas automatizadas (pytest)
├── .env.example            # Plantilla de variables de entorno
├── Dockerfile              # Empaquetado optimizado en contenedor Python 3.12 slim
├── pytest.ini              # Configuración de pytest
├── requirements.txt        # Dependencias reproducibles del microservicio
└── README.md
```

---

## 🧪 Pruebas Automatizadas

Para ejecutar la suite completa de pruebas:

```bash
pytest -v
```

---

## 🐳 Ejecución con Docker

Construir y levantar el contenedor:

```bash
docker build -t inference-service:latest .
docker run -d -p 8000:8000 --name stackpulse-fastapi inference-service:latest
```