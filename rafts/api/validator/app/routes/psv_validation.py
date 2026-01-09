# app/routes/psv_validation.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import tempfile
import os
from app.config import logger
from app.utils.validation import validate_ades_xml, extract_xml_info
from app.utils.conversion import convert_psv_to_xml

router = APIRouter()


@router.post("/validate-psv")
async def validate_psv(
    file: UploadFile = File(...), validation_type: str = Form("all")
):
    """
    Convert a PSV file to XML and then validate it against ADES schemas.

    - validation_type: Type of validation to perform (all, submit, general)
    """
    # Check if validation_type is valid
    if validation_type not in ["all", "submit", "general"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid validation type: {validation_type}. Must be one of: all, submit, general",
        )

    # Check if file is PSV (case-insensitive)
    if not file.filename.lower().endswith(".psv"):
        raise HTTPException(status_code=400, detail="File must be a PSV document")

    # Create temporary files for the conversion process
    with tempfile.NamedTemporaryFile(delete=False, suffix=".psv") as psv_file:
        psv_content = await file.read()
        psv_file.write(psv_content)
        psv_path = psv_file.name

    xml_path = f"{psv_path}.xml"

    try:
        # Step 1: Convert PSV to XML
        conversion_success, conversion_message = await convert_psv_to_xml(
            psv_path, xml_path
        )

        if not conversion_success:
            return {
                "filename": file.filename,
                "conversion": {"success": False, "message": conversion_message},
                "results": [],
            }

        # Step 2: Validate the generated XML
        validation_results = await validate_ades_xml(xml_path, validation_type)

        # Extract XML information if possible
        xml_info = extract_xml_info(xml_path)

        # Return the results
        return {
            "filename": file.filename,
            "validation_type": validation_type,
            "conversion": {"success": True, "message": conversion_message},
            "results": validation_results,
            "xml_info": xml_info,
        }

    except Exception as e:
        logger.error(f"PSV validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PSV validation error: {str(e)}")
    finally:
        # Clean up temporary files
        if os.path.exists(psv_path):
            os.unlink(psv_path)
        if os.path.exists(xml_path):
            os.unlink(xml_path)
