from fastapi.testclient import TestClient
from app.main import app


def test_health():
    with TestClient(app) as client:
        response = client.get("/health")

        assert response.status_code == 200

        data = response.json()

        assert data["status"] == "ok"
        assert data["model_loaded"] is True


def test_predict():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            json={"text": "Quiero aprender Python"}
        )

        assert response.status_code == 200

        data = response.json()

        assert "prediction" in data


def test_predict_empty_text():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            json={"text": ""}
        )

        assert response.status_code == 400

        data = response.json()

        assert data["detail"] == "El texto no puede estar vacío."