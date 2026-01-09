# app/routes/mpc_validation.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import tempfile
import os
from app.config import logger
from app.utils.validation import validate_ades_xml, extract_xml_info
from app.utils.conversion import convert_mpc_to_xml

router = APIRouter()


@router.post("/validate-mpc")
async def validate_mpc(
    file: UploadFile = File(...), validation_type: str = Form("all")
):
    """
    Convert an MPC 80-column format file to XML and then validate it against ADES schemas.

    - validation_type: Type of validation to perform (all, submit, general)
    """
    # Check if validation_type is valid
    if validation_type not in ["all", "submit", "general"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid validation type: {validation_type}. Must be one of: all, submit, general",
        )

    # Check if file extension is appropriate for MPC format
    valid_extensions = [
        ".txt",
        ".mpc",
        ".80col",
        "",
    ]  # Some MPC files might not have an extension
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in valid_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{file_ext}' is not recognized as an MPC 80-column format. Expected: {valid_extensions}",
        )

    # Create temporary files for the conversion process
    with tempfile.NamedTemporaryFile(delete=False, suffix=".80col") as mpc_file:
        mpc_content = await file.read()
        mpc_file.write(mpc_content)
        mpc_path = mpc_file.name

    xml_path = f"{mpc_path}.xml"

    try:
        # Step 1: Convert MPC 80-column to XML
        conversion_success, conversion_message = await convert_mpc_to_xml(
            mpc_path, xml_path
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
        logger.error(f"MPC validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"MPC validation error: {str(e)}")
    finally:
        # Clean up temporary files
        if os.path.exists(mpc_path):
            os.unlink(mpc_path)
        if os.path.exists(xml_path):
            os.unlink(xml_path)
