# tests/test_xml_validation.py
from pathlib import Path

TEST_DATA_DIR = Path(__file__).parent / "data"


def test_validate_xml_success(client):
    """Test successful validation of XML file"""
    test_file = TEST_DATA_DIR / "valid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("valid.xml", f, "application/xml")},
            data={"validation_type": "all"},
        )

    # Verify the response structure
    assert response.status_code == 200
    assert "results" in response.json()
    assert "xml_info" in response.json()


def test_validate_xml_uppercase_extension(client):
    """File names with upper-case extension should be accepted"""
    test_file = TEST_DATA_DIR / "valid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("VALID.XML", f, "application/xml")},
            data={"validation_type": "all"},
        )

    assert response.status_code == 200
    assert "results" in response.json()


def test_validate_xml_failure(client):
    """Test validation of an invalid XML file"""
    test_file = TEST_DATA_DIR / "invalid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("invalid.xml", f, "application/xml")},
            data={"validation_type": "all"},
        )

    # Verify the response structure and that validation failed
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert any(not r.get("valid", True) for r in data["results"])


def test_validate_xml_specific_type(client):
    """Test validation using a specific validation type"""
    test_file = TEST_DATA_DIR / "valid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("valid.xml", f, "application/xml")},
            data={"validation_type": "submit"},
        )

    # Verify the response structure
    assert response.status_code == 200
    assert "results" in response.json()

    # Print the results for debugging


def test_validate_xml_invalid_type(client):
    """Test validation with an invalid validation type"""
    test_file = TEST_DATA_DIR / "valid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("valid.xml", f, "application/xml")},
            data={"validation_type": "invalid"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "Invalid validation type" in response.json()["detail"]


def test_validate_xml_non_xml_file(client):
    """Test validation with a non-XML file"""
    test_file = TEST_DATA_DIR / "valid.psv"  # Using PSV file as non-XML

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("file.txt", f, "text/plain")},
            data={"validation_type": "all"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "File must be an XML document" in response.json()["detail"]
