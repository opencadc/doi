# RAFT ADES Validator

![Tests](https://github.com/zss1980/ades-val/workflows/Python%20Tests/badge.svg)
[![codecov](https://codecov.io/gh/zss1980/ades-val/branch/main/graph/badge.svg)](https://codecov.io/gh/zss1980/ades-val)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

A FastAPI application for validating [ADES (Astrodynamics Data Exchange Standard)](https://minorplanetcenter.net/iau/info/ADES.html) files in different formats. The validator is built on top of the official [IAU-ADES/ADES-Master](https://github.com/IAU-ADES/ADES-Master) repository.

## Features

- **XML Validation**: Direct validation of ADES XML files against general and submission schemas
- **PSV Conversion**: Convert PSV format to XML and validate
- **MPC 80-column Format**: Convert MPC 80-column format to XML and validate
- **Comprehensive Testing**: 83% test coverage with automated CI
- **REST API**: Simple HTTP interface with FastAPI

## Installation

### Prerequisites

- Python 3.10+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/zss1980/ades-val.git
cd ades-val

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies with uv (recommended)
uv pip install -e .

# Or with standard pip
pip install -e .
```

## Development

### Install development dependencies

```bash
# Using uv
uv pip install -e .[dev]

# Or using standard pip
pip install -e .[dev]
```

This installs tools like **pre-commit**, **black**, and **ruff** used for code formatting and linting.

### Set up pre-commit hooks

```bash
pre-commit install
```

### Running Tests

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_xml_validation.py
```

## Running the API

```bash
# Development server with auto-reload
uvicorn app.main:app --reload

# Production server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at http://127.0.0.1:8000.

API documentation is automatically generated and available at:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## API Endpoints

### Health Check

```
GET /health-check
```

Verifies that the API and ADES tools are working correctly.

### Validate XML

```
POST /validate-xml
```

Parameters:
- `file`: XML file to validate (form-data)
- `validation_type`: Type of validation to perform (all, submit, general)

Example:
```bash
curl -X POST http://localhost:8000/validate-xml \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/file.xml" \
  -F "validation_type=all"
```

### Validate PSV

```
POST /validate-psv
```

Parameters:
- `file`: PSV file to convert and validate (form-data)
- `validation_type`: Type of validation to perform (all, submit, general)

Example:
```bash
curl -X POST http://localhost:8000/validate-psv \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/file.psv" \
  -F "validation_type=all"
```

### Validate MPC

```
POST /validate-mpc
```

Parameters:
- `file`: MPC 80-column format file to convert and validate (form-data)
- `validation_type`: Type of validation to perform (all, submit, general)

Example:
```bash
curl -X POST http://localhost:8000/validate-mpc \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/file.txt" \
  -F "validation_type=all"
```

### Model Context

```
GET /model-context
```

Provides metadata about the service, including version and supported validation types.

## Project Structure

```
ades-val/
├── app/                      # Application code
│   ├── __init__.py
│   ├── main.py               # FastAPI application entry point
│   ├── config.py             # Configuration settings
│   ├── routes/               # API endpoints
│   │   ├── __init__.py
│   │   ├── health.py         # Health check endpoints
│   │   ├── xml_validation.py # XML validation endpoints
│   │   ├── psv_validation.py # PSV validation endpoints
│   │   └── mpc_validation.py # MPC validation endpoints
│   └── utils/                # Utility functions
│       ├── __init__.py
│       ├── paths.py          # Path definitions
│       ├── validation.py     # Validation functions
│       └── conversion.py     # Conversion functions
├── ades/                     # ADES-Master repository files
│   ├── Python/               # ADES Python implementation
│   ├── xml/                  # XML resources
│   ├── xsd/                  # XSD schemas
│   └── xslt/                 # XSLT transformations
├── tests/                    # Test suite
│   ├── __init__.py
│   ├── conftest.py           # Test fixtures
│   ├── test_health.py
│   ├── test_xml_validation.py
│   ├── test_psv_validation.py
│   ├── test_mpc_validation.py
│   └── data/                 # Test data
├── .github/                  # GitHub workflows
│   └── workflows/
│       └── tests.yml  # CI workflow
├── .pre-commit-config.yaml   # Pre-commit hooks configuration
├── pyproject.toml            # Project configuration
├── pytest.ini                # Pytest configuration
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

Please make sure your code passes all tests and pre-commit hooks before submitting a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [IAU-ADES/ADES-Master](https://github.com/IAU-ADES/ADES-Master) for the ADES implementation
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [uvicorn](https://www.uvicorn.org/) for the ASGI server
