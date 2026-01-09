# app/routes/xml_validation.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import tempfile
import os
from app.config import logger
from app.utils.validation import validate_ades_xml, extract_xml_info

router = APIRouter()


@router.post("/validate-xml")
async def validate_xml(
    file: UploadFile = File(...), validation_type: str = Form("all")
):
    """
    Validate an ADES XML file against XSD schemas.

    - validation_type: Type of validation to perform (all, submit, general)
    """
    # Check if validation_type is valid
    if validation_type not in ["all", "submit", "general"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid validation type: {validation_type}. Must be one of: all, submit, general",
        )

    # Check if file is XML (case-insensitive)
    if not file.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="File must be an XML document")

    # Create temporary file for the uploaded content
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xml") as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        # Validate the XML file
        validation_results = await validate_ades_xml(temp_path, validation_type)

        # Extract XML root information if possible
        xml_info = extract_xml_info(temp_path)

        return {
            "filename": file.filename,
            "validation_type": validation_type,
            "results": validation_results,
            "xml_info": xml_info,
        }
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)
