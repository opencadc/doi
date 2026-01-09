# tests/test_health.py


def test_home_endpoint(client):
    """Test the home endpoint"""
    response = client.get("/")

    assert response.status_code == 200
    assert "title" in response.json()
    assert "endpoints" in response.json()

    # Check if main endpoints are listed
    endpoints = response.json().get("endpoints", {})
    assert "/validate-xml" in endpoints
    assert "/health-check" in endpoints


def test_health_check_endpoint(client):
    """Test the health check endpoint"""
    response = client.get("/health-check")

    # Status code should be either 200 (healthy) or 503 (degraded)
    assert response.status_code in [200, 503]

    # Basic response structure
    data = response.json()
    assert "status" in data
    assert data["status"] in ["healthy", "degraded", "error"]

    # Check for features section
    if "features" in data:
        features = data["features"]
        assert isinstance(features, dict)
        assert "xml_validation" in features
