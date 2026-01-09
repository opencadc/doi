from fastapi.testclient import TestClient


def test_model_context_endpoint(client: TestClient):
    response = client.get("/model-context")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert "supported_validation_types" in data
