import os
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.config import MODEL_FILE


# 1. Prueba de Existencia y Carga del Modelo Canónico
def test_model_file_exists_and_loads():
    assert Path(MODEL_FILE).is_file(), f"El archivo del modelo no existe en la ruta canónica: {MODEL_FILE}"
    assert os.path.getsize(MODEL_FILE) > 1000, "El archivo del modelo está vacío o corrupto."


# 2. Pruebas de Salud y Estado
def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["model_loaded"] is True


def test_root_endpoint():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "docs" in data


# 3. Prueba Contractual Canónica (POST /predict con contenido_crudo)
def test_predict_canonical_contract():
    with TestClient(app) as client:
        text = "Configuración de balanceadores de carga en Oracle Cloud Infrastructure usando Docker y Kubernetes."
        response = client.post(
            "/predict",
            json={"contenido_crudo": text}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validar contrato exacto de respuesta
        assert "categoria" in data
        assert isinstance(data["categoria"], str)
        assert data["categoria"] in ["DevOps", "Backend", "Frontend", "Data Science", "Mobile", "Otros"]
        
        assert "probabilidad" in data
        assert isinstance(data["probabilidad"], float)
        assert 0.0 <= data["probabilidad"] <= 1.0
        
        assert "palabras_clave" in data
        assert isinstance(data["palabras_clave"], list)
        
        assert "tiempo_procesamiento_ms" in data
        assert isinstance(data["tiempo_procesamiento_ms"], float)
        assert data["tiempo_procesamiento_ms"] >= 0.0


# 4. Pruebas de Límites de Longitud (29, 30, 5000, 5001 caracteres)
def test_boundary_length_29_chars_rejected():
    with TestClient(app) as client:
        text_29 = "A" * 29
        response = client.post(
            "/predict",
            json={"contenido_crudo": text_29}
        )
        assert response.status_code == 422


def test_boundary_length_30_chars_accepted():
    with TestClient(app) as client:
        text_30 = "Texto valido de prueba 30 car!"
        assert len(text_30) == 30
        response = client.post(
            "/predict",
            json={"contenido_crudo": text_30}
        )
        assert response.status_code == 200
        data = response.json()
        assert "categoria" in data


def test_boundary_length_5000_chars_accepted():
    with TestClient(app) as client:
        text_5000 = ("Docker Kubernetes CI/CD " * 250)[:5000]
        assert len(text_5000) == 5000
        response = client.post(
            "/predict",
            json={"contenido_crudo": text_5000}
        )
        assert response.status_code == 200
        data = response.json()
        assert "categoria" in data


def test_boundary_length_5001_chars_rejected():
    with TestClient(app) as client:
        text_5001 = "A" * 5001
        response = client.post(
            "/predict",
            json={"contenido_crudo": text_5001}
        )
        assert response.status_code == 422


# 5. Pruebas de Validación de Entrada (Campos ausentes, nulos, vacíos o tipos incorrectos)
def test_predict_empty_string():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            json={"contenido_crudo": ""}
        )
        assert response.status_code == 422


def test_predict_null_content():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            json={"contenido_crudo": None}
        )
        assert response.status_code == 422


def test_predict_missing_field():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            json={}
        )
        assert response.status_code == 422


def test_predict_wrong_data_type():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            json={"contenido_crudo": 1234567890123456789012345678901}
        )
        assert response.status_code == 422


# 6. Prueba de JSON Malformado (HTTP 400)
def test_predict_malformed_json():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            content='{"contenido_crudo": "texto malformado sin comilla de cierre}',
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400


# 7. Prueba de Unsupported Media Type (HTTP 415)
def test_predict_unsupported_media_type():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            content="Texto en formato plano sin JSON",
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 415


# 8. Compatibilidad Legacy (POST /analizar y alias text/descripcion)
def test_legacy_analizar_endpoint_compatibility():
    with TestClient(app) as client:
        text = "Desarrollo de microservicios con Spring Boot, Spring Data JPA y PostgreSQL."
        response = client.post(
            "/analizar",
            json={"descripcion": text}
        )
        assert response.status_code == 200
        data = response.json()
        assert "categoria" in data


# 9. Procesamiento por Lotes (POST /predict/lote)
def test_predict_batch():
    with TestClient(app) as client:
        textos = [
            "Configuración de pipelines CI/CD con GitHub Actions y Docker.",
            "Desarrollo de interfaces reactivas con React 19 y TypeScript."
        ]
        response = client.post(
            "/predict/lote",
            json={"textos": textos}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2


# 10. Clustering Temático K-Means (POST /predict/clustering)
def test_clustering_kmeans():
    with TestClient(app) as client:
        payload = {
            "documentos": [
                {"id": "1", "texto": "Configuración de balanceadores de carga y proxy inverso con Nginx en Docker."},
                {"id": "2", "texto": "Despliegue automatizado de contenedores en Kubernetes mediante Terraform."},
                {"id": "3", "texto": "Desarrollo de aplicaciones frontend en React 19 con componentes funcionales y hooks."},
                {"id": "4", "texto": "Diseño de interfaces web modernas con CSS Grid y TailwindCSS."}
            ],
            "n_clusters": 2,
            "algoritmo": "kmeans",
            "idioma": "es"
        }
        response = client.post(
            "/predict/clustering",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert "clusters" in data
        assert "n_documentos" in data
        assert data["n_documentos"] == 4


# 11. Prueba de Modelo No Disponible (HTTP 503)
def test_model_unavailable_returns_503():
    with TestClient(app) as client:
        with patch("app.predictor.loader.model", None):
            response = client.post(
                "/predict",
                json={"contenido_crudo": "Texto valido con mas de 30 caracteres para probar error de modelo"}
            )
            assert response.status_code == 503
            data = response.json()
            assert "detail" in data