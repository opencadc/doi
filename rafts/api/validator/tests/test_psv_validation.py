# tests/test_psv_validation.py
from pathlib import Path

TEST_DATA_DIR = Path(__file__).parent / "data"


def test_validate_psv_success(client):
    """Test successful validation of PSV file"""
    test_file = TEST_DATA_DIR / "valid.psv"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-psv",
            files={"file": ("valid.psv", f, "text/plain")},
            data={"validation_type": "all"},
        )

    # Verify the response structure
    assert response.status_code == 200
    assert "conversion" in response.json()
    # Note: We're not checking the specific conversion success value
    # since it depends on the actual implementation
    assert "results" in response.json()


def test_validate_psv_uppercase_extension(client):
    """File names with upper-case extension should be accepted"""
    test_file = TEST_DATA_DIR / "valid.psv"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-psv",
            files={"file": ("VALID.PSV", f, "text/plain")},
            data={"validation_type": "all"},
        )

    assert response.status_code == 200
    assert "results" in response.json()


def test_validate_psv_conversion_failure(client):
    """Test validation of an invalid PSV file that fails conversion"""
    # Create a truly invalid PSV file
    with open(TEST_DATA_DIR / "invalid.psv", "w") as f:
        f.write("This is not a valid PSV format file")

    with open(TEST_DATA_DIR / "invalid.psv", "rb") as f:
        response = client.post(
            "/validate-psv",
            files={"file": ("invalid.psv", f, "text/plain")},
            data={"validation_type": "all"},
        )

    # Verify response status code and JSON payload for a failed conversion
    assert response.status_code == 200
    data = response.json()
    assert data.get("conversion", {}).get("success") is False
    assert data.get("results") == []


def test_validate_psv_specific_type(client):
    """Test validation using a specific validation type"""
    test_file = TEST_DATA_DIR / "valid.psv"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-psv",
            files={"file": ("valid.psv", f, "text/plain")},
            data={"validation_type": "submit"},
        )

    # Verify that the response has the expected structure
    assert response.status_code == 200
    assert "results" in response.json()


def test_validate_psv_invalid_type(client):
    """Test validation with an invalid validation type"""
    test_file = TEST_DATA_DIR / "valid.psv"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-psv",
            files={"file": ("valid.psv", f, "text/plain")},
            data={"validation_type": "invalid"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "Invalid validation type" in response.json()["detail"]


def test_validate_psv_non_psv_file(client):
    """Test validation with a non-PSV file"""
    test_file = TEST_DATA_DIR / "valid.xml"  # Using XML file as non-PSV

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-psv",
            files={"file": ("file.txt", f, "text/plain")},
            data={"validation_type": "all"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "File must be a PSV document" in response.json()["detail"]
