# tests/test_mpc_validation.py
from pathlib import Path

TEST_DATA_DIR = Path(__file__).parent / "data"


def test_validate_mpc_success(client):
    """Test successful validation of MPC file"""
    test_file = TEST_DATA_DIR / "valid.mpc"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("valid.mpc", f, "text/plain")},
            data={"validation_type": "all"},
        )

    # Verify the response structure
    assert response.status_code == 200
    assert "conversion" in response.json()
    assert "success" in response.json()["conversion"]
    assert "results" in response.json()


def test_validate_mpc_conversion_failure(client):
    """Test validation of an invalid MPC file that fails conversion"""
    # For this test, we'll use a more direct approach
    # We need to modify the app route temporarily to force a conversion failure

    # Let's create a truly invalid MPC file that will fail conversion naturally
    with open(TEST_DATA_DIR / "invalid.mpc", "w") as f:
        f.write("This is not a valid MPC 80-column format file")

    # Now make the request with our custom invalid file
    with open(TEST_DATA_DIR / "invalid.mpc", "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("invalid.mpc", f, "text/plain")},
            data={"validation_type": "all"},
        )

    # Verify response status code and JSON payload for a failed conversion
    assert response.status_code == 200
    data = response.json()
    assert data.get("conversion", {}).get("success") is False
    assert data.get("results") == []


def test_validate_mpc_specific_type(client):
    """Test validation using a specific validation type"""
    test_file = TEST_DATA_DIR / "valid.mpc"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("valid.mpc", f, "text/plain")},
            data={"validation_type": "submit"},
        )

    # Verify that the response has the expected structure
    assert response.status_code == 200
    assert "results" in response.json()


def test_validate_mpc_invalid_type(client):
    """Test validation with an invalid validation type"""
    test_file = TEST_DATA_DIR / "valid.mpc"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("valid.mpc", f, "text/plain")},
            data={"validation_type": "invalid"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "Invalid validation type" in response.json()["detail"]


def test_validate_mpc_unknown_extension(client):
    """Test validation with an unknown file extension"""
    test_file = TEST_DATA_DIR / "valid.mpc"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("data.unknown", f, "text/plain")},
            data={"validation_type": "all"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "File extension" in response.json()["detail"]
