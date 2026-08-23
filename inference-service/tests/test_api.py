import os
from pathlib import Path
import numpy as np
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.model_loader import loader
from app.config import MODEL_FILE
from app.clustering.service import clustering_service


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


# 5. Pruebas de Validación de Entrada (Espacios, Campos ausentes, nulos o tipos incorrectos)
def test_predict_spaces_only_rejected():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            json={"contenido_crudo": "                                    "}
        )
        assert response.status_code == 422


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


# 6. Prueba de Clasificación Válida que Retorna Categoría 'Otros'
def test_predict_valid_classification_returning_otros():
    with patch.object(loader.model, 'predict', return_value=["Otros"]):
        with TestClient(app) as client:
            response = client.post(
                "/predict",
                json={"contenido_crudo": "Receta tradicional de cocina mediterránea con aceite de oliva virgen."}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["categoria"] == "Otros"
            assert "probabilidad" in data


# 7. Prueba de JSON Malformado (HTTP 400)
def test_predict_malformed_json():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            content='{"contenido_crudo": "texto malformado sin comilla de cierre}',
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400


# 8. Prueba de Unsupported Media Type (HTTP 415)
def test_predict_unsupported_media_type():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            content="Texto en formato plano sin JSON",
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 415


# 9. Compatibilidad Legacy (POST /analizar y alias text/descripcion)
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


# 10. Procesamiento por Lotes y Validación por Elemento
def test_predict_batch_success():
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


def test_predict_batch_element_too_short_rejected():
    with TestClient(app) as client:
        textos = [
            "Texto válido con longitud superior a treinta caracteres requeridos.",
            "Texto corto"  # < 30 caracteres
        ]
        response = client.post(
            "/predict/lote",
            json={"textos": textos}
        )
        assert response.status_code == 422


def test_predict_batch_element_too_long_rejected():
    with TestClient(app) as client:
        textos = [
            "Texto válido con longitud superior a treinta caracteres requeridos.",
            "A" * 5001  # > 5000 caracteres
        ]
        response = client.post(
            "/predict/lote",
            json={"textos": textos}
        )
        assert response.status_code == 422


# 11. Clustering Temático K-Means y Validación de documento_ids
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
        
        for cluster in data["clusters"]:
            assert "documento_ids" in cluster
            assert isinstance(cluster["documento_ids"], list)
            assert len(cluster["documento_ids"]) == cluster["tamano"]


def test_clustering_duplicate_ids_rejected():
    """Valida que IDs duplicados en la solicitud de clustering sean rechazados con 422."""
    with TestClient(app) as client:
        payload = {
            "documentos": [
                {"id": "doc-duplicado", "texto": "Configuración de contenedores Docker en servidor Linux."},
                {"id": "doc-duplicado", "texto": "Despliegue de aplicaciones React con TypeScript."}
            ]
        }
        response = client.post(
            "/predict/clustering",
            json=payload
        )
        assert response.status_code == 422


def test_clustering_null_or_empty_id_rejected():
    """Valida que IDs nulos o vacíos sean rechazados con 422."""
    with TestClient(app) as client:
        # Caso ID nulo
        response_null = client.post(
            "/predict/clustering",
            json={
                "documentos": [
                    {"id": None, "texto": "Configuración de contenedores Docker en servidor Linux."},
                    {"id": "doc-2", "texto": "Despliegue de aplicaciones React con TypeScript."}
                ]
            }
        )
        assert response_null.status_code == 422

        # Caso ID con espacios en blanco
        response_empty = client.post(
            "/predict/clustering",
            json={
                "documentos": [
                    {"id": "   ", "texto": "Configuración de contenedores Docker en servidor Linux."},
                    {"id": "doc-2", "texto": "Despliegue de aplicaciones React con TypeScript."}
                ]
            }
        )
        assert response_empty.status_code == 422


def test_clustering_missing_id_field_rejected():
    """Valida que la ausencia del campo 'id' en los documentos sea rechazada con 422."""
    with TestClient(app) as client:
        payload = {
            "documentos": [
                {"texto": "Configuración de contenedores Docker en servidor Linux sin ID."},
                {"texto": "Despliegue de aplicaciones React con TypeScript sin ID."}
            ]
        }
        response = client.post(
            "/predict/clustering",
            json=payload
        )
        assert response.status_code == 422


def test_clustering_service_internal_boundary_validation():
    """Valida que ClusteringService.clusterizar() exija documento_ids, valide cardinalidad y unicidad al invocarse directamente."""
    docs = [
        "Orquestación de microservicios con Docker y Kubernetes en clusters cloud.",
        "Desarrollo de interfaces reactivas con React 19 y hooks useState."
    ]
    
    # 1. documento_ids ausente o None
    with pytest.raises(ValueError, match="documento_ids es obligatorio"):
        clustering_service.clusterizar(documentos=docs, documento_ids=None)
        
    # 2. Desajuste de cardinalidad entre documentos e IDs
    with pytest.raises(ValueError, match="cardinalidad"):
        clustering_service.clusterizar(documentos=docs, documento_ids=["id-1"])
        
    # 3. IDs duplicados al invocar el servicio directamente
    with pytest.raises(ValueError, match="únicos"):
        clustering_service.clusterizar(documentos=docs, documento_ids=["id-1", "id-1"])


def test_clustering_deterministic_cluster_with_more_than_5_members():
    """
    Prueba determinista con un cluster de tamano > 5 (7 documentos de DevOps con textos idénticos e IDs únicos) y 2 de Frontend:
    Verifica que:
    1. documentos contiene exactamente la muestra máxima de 5.
    2. documento_ids contiene todos los miembros (7).
    3. Los textos idénticos con IDs distintos permanecen completamente diferenciados y preservados.
    """
    with TestClient(app) as client:
        payload = {
            "documentos": [
                # 7 Documentos de DevOps con texto idéntico y IDs únicos
                {"id": f"dev-{i}", "texto": "Orquestación de microservicios con Docker y Kubernetes en clusters cloud."}
                for i in range(1, 8)
            ] + [
                # 2 Documentos de Frontend con texto idéntico y IDs únicos
                {"id": "front-1", "texto": "Desarrollo de interfaces reactivas con React 19 y hooks useState."},
                {"id": "front-2", "texto": "Desarrollo de interfaces reactivas con React 19 y hooks useState."}
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
        assert data["n_documentos"] == 9
        assert len(data["clusters"]) == 2
        
        # Encontrar el cluster grande (DevOps con 7 documentos)
        devops_cluster = next((c for c in data["clusters"] if c["tamano"] == 7), None)
        assert devops_cluster is not None, f"Clusters devueltos: {data['clusters']}"
        
        # 1. documentos contiene exactamente la muestra máxima de 5
        assert len(devops_cluster["documentos"]) == 5
        
        # 2. documento_ids contiene todos los miembros (7)
        assert len(devops_cluster["documento_ids"]) == 7
        assert devops_cluster["tamano"] == 7
        
        # 3. Textos idénticos con IDs distintos permanecen diferenciados
        dev_ids_esperados = {f"dev-{i}" for i in range(1, 8)}
        assert set(devops_cluster["documento_ids"]) == dev_ids_esperados


def test_clustering_cluster_info_keeps_non_empty_top_keywords():
    """Con palabras representativas, conserva términos, miembros, tamaño y preview."""
    documentos = ["docker kubernetes despliegue"] * 6
    documento_ids = [f"doc-{i}" for i in range(6)]

    clusters = clustering_service._generar_info_clusters(
        documentos,
        documento_ids,
        np.zeros(6, dtype=int),
        np.array(["docker", "kubernetes", "despliegue"])
    )

    assert len(clusters) == 1
    cluster = clusters[0]
    assert cluster["palabras_clave"] == ["docker", "kubernetes", "despliegue"]
    assert cluster["etiqueta_sugerida"] == "Docker / Kubernetes / Despliegue"
    assert cluster["tamano"] == 6
    assert cluster["documento_ids"] == documento_ids
    assert len(cluster["documentos"]) == 5


def test_clustering_cluster_info_uses_deterministic_fallback_for_empty_top_keywords():
    """Un cluster sin coincidencias no evalúa ndarray como booleano y usa el fallback existente."""
    documentos = ["contenido sin coincidencias"] * 6
    documento_ids = [f"empty-{i}" for i in range(6)]

    clusters = clustering_service._generar_info_clusters(
        documentos,
        documento_ids,
        np.zeros(6, dtype=int),
        np.array(["alpha", "beta", "gamma", "delta"])
    )

    assert len(clusters) == 1
    cluster = clusters[0]
    assert cluster["palabras_clave"] == ["alpha", "beta", "gamma"]
    assert cluster["etiqueta_sugerida"] == "Alpha / Beta / Gamma"
    assert cluster["tamano"] == 6
    assert cluster["documento_ids"] == documento_ids
    assert len(cluster["documentos"]) == 5


def test_clustering_endpoint_handles_the_sixteen_document_regression_corpus():
    """El corpus real que antes devolvía 400 mantiene todos los IDs y previews acotados."""
    textos = [
        "Este es un documento de prueba suficientemente largo para validar la clasificación integrada del sistema TechMind.",
        "Este es un documento de prueba suficientemente largo para validar la clasificación integrada del sistema TechMind.",
        "Este es un documento de prueba suficientemente largo para validar la clasificación integrada del sistema TechMind.",
        "Este es un documento de prueba suficientemente largo para validar la clasificación integrada del sistema TechMind.",
        "Auditoría funcional del pipeline Spring Boot con PostgreSQL y Flyway para validar persistencia reproducible.",
        "Validación del servicio FastAPI con clasificación por lotes, clustering y extracción estable de palabras clave.",
        "Verificación funcional del origen localhost para la clasificación integrada de TechMind con persistencia PostgreSQL.",
        "Configuración de balanceadores de carga en Oracle Cloud Infrastructure (OCI) con SSL y balanceo por round-robin.",
        "Implementación de componentes funcionales en React 19 con hooks personalizados y optimización con useMemo.",
        "Diseño de arquitectura de microservicios con Spring Boot, Spring Data JPA y PostgreSQL en contenedores Docker.",
        "Automatización de pipelines CI/CD en GitHub Actions para despliegue continuo de contenedores en Kubernetes.",
        "Desarrollo de modelos de Machine Learning no supervisado con K-Means y vectorización TF-IDF en scikit-learn.",
        "Configuración de reverse proxy Nginx con balanceo de carga upstream y terminación segura TLS/SSL.",
        "Verificacion final MVP con termino unicofinale2e sobre Spring Boot PostgreSQL y FastAPI completamente integrados.",
        "Arquitectura Docker Kubernetes OCI para despliegue continuo y automatizacion DevOps con contenedores seguros.",
        "Guia Docker Kubernetes OCI para despliegue continuo, redes DevOps y operacion segura de contenedores."
    ]
    ids = [f"regression-{i}" for i in range(1, 17)]

    with TestClient(app) as client:
        response = client.post(
            "/predict/clustering",
            json={
                "documentos": [
                    {"id": doc_id, "texto": texto}
                    for doc_id, texto in zip(ids, textos)
                ],
                "algoritmo": "kmeans",
                "idioma": "es"
            }
        )

    assert response.status_code == 200
    data = response.json()
    assert data["n_documentos"] == 16
    assert sum(cluster["tamano"] for cluster in data["clusters"]) == 16
    assert {doc_id for cluster in data["clusters"] for doc_id in cluster["documento_ids"]} == set(ids)
    assert all(len(cluster["documento_ids"]) == cluster["tamano"] for cluster in data["clusters"])
    assert all(len(cluster["documentos"]) <= 5 for cluster in data["clusters"])
    assert all(isinstance(cluster["palabras_clave"], list) for cluster in data["clusters"])
    assert all(cluster["etiqueta_sugerida"] for cluster in data["clusters"])


def test_clustering_error_sanitization():
    with patch("app.clustering.router.clustering_service.clusterizar", side_effect=RuntimeError("Internal math error")):
        with TestClient(app) as client:
            payload = {
                "documentos": [
                    {"id": "1", "texto": "Documento de prueba uno con longitud adecuada para el clustering."},
                    {"id": "2", "texto": "Documento de prueba dos con longitud adecuada para el clustering."}
                ]
            }
            response = client.post(
                "/predict/clustering",
                json=payload
            )
            assert response.status_code == 500
            data = response.json()
            assert "Internal math error" not in data["detail"]
            assert data["detail"] == "Error interno al procesar el agrupamiento temático."


# 12. Prueba de Modelo No Disponible (HTTP 503)
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
