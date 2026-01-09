# app/config.py
import logging
import os
import sys
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent

# Define paths to ADES resources
ADES_DIR = PROJECT_ROOT / "ades"
ADES_PYTHON_BIN = ADES_DIR / "Python" / "bin"
ADES_XML_DIR = ADES_DIR / "xml"
ADES_XSD_DIR = ADES_DIR / "xsd"
ADES_XSLT_DIR = ADES_DIR / "xslt"

# Ensure directories exist
os.makedirs(ADES_XSD_DIR, exist_ok=True)
os.makedirs(ADES_XSLT_DIR, exist_ok=True)

# Ensure ADES bin directory is in the Python path
sys.path.insert(0, str(ADES_PYTHON_BIN))

# Set environment variables for ADES tools
os.environ["ADES_ROOT"] = str(ADES_DIR)
os.environ["ADES_XML_DIR"] = str(ADES_XML_DIR)
os.environ["ADES_XSD_DIR"] = str(ADES_XSD_DIR)
os.environ["ADES_XSLT_DIR"] = str(ADES_XSLT_DIR)

# API settings
API_TITLE = "RAFT ADES Validator"
API_DESCRIPTION = "API for validating ADES files in various formats"
API_VERSION = "1.0.0"
