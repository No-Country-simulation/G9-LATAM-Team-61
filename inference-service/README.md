# Inference Service API

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-orange)

Microservicio desarrollado con **FastAPI** para realizar inferencias sobre un modelo de clasificación de texto entrenado con Machine Learning.

Este servicio carga automáticamente el modelo y el vectorizador al iniciar la aplicación y expone una API REST para realizar predicciones.

---

# Tecnologías

- Python 3.12
- FastAPI
- Uvicorn
- Scikit-learn
- Joblib
- Pydantic

---

# Estructura del proyecto

```
inference-service/
│
├── app/
│   ├── config.py
│   ├── main.py
│   ├── model_loader.py
│   ├── predictor.py
│   └── schemas.py
│
├── model/
│   ├── modelo_v1.pkl
│   └── tfidf_vectorizer.pkl
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

# Instalación

Crear un entorno virtual:

```bash
python -m venv .venv
```

Activarlo:

Windows

```bash
.venv\Scripts\activate
```

Linux / macOS

```bash
source .venv/bin/activate
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

---

# Ejecutar el servicio

```bash
uvicorn app.main:app --reload
```

La aplicación estará disponible en:

```
http://127.0.0.1:8000
```

---

# Documentación interactiva

Swagger UI

```
http://127.0.0.1:8000/docs
```

ReDoc

```
http://127.0.0.1:8000/redoc
```

---

# Endpoints

## GET /health

Verifica que el servicio esté operativo y que el modelo haya sido cargado correctamente.

Ejemplo de respuesta

```json
{
    "status": "ok",
    "model_loaded": true
}
```

---

## POST /predict

Realiza una predicción utilizando el modelo entrenado.

### Request

```json
{
    "text": "Quiero aprender Python"
}
```

### Response

```json
{
    "prediction": "python"
}
```

---

# Manejo de errores

| Código | Descripción |
|---------|-------------|
| 200 | Predicción realizada correctamente |
| 400 | El texto enviado está vacío |
| 503 | El modelo aún no ha sido cargado |
| 500 | Error interno durante la predicción |

---

# Autor

Proyecto desarrollado para el Hackathon No Country - G9 LATAM Team 61.