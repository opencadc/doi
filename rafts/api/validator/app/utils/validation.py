# app/utils/validation.py
from lxml import etree
from app.config import ADES_XSD_DIR, logger

# Disable external entity expansion when parsing XML
XML_PARSER = etree.XMLParser(resolve_entities=False)


async def validate_ades_xml(xml_file_path, validation_type):
    """
    Validate an ADES XML file using the appropriate XSD schema.

    Args:
        xml_file_path: Path to the XML file to validate
        validation_type: Type of validation to perform

    Returns:
        List of validation results as dictionaries
    """
    try:
        results = []

        # Determine which schemas to validate against
        if validation_type == "all":
            schemas_to_validate = ["submit", "general"]
        else:
            schemas_to_validate = [validation_type]

        # Parse the XML document to be validated
        try:
            xml_doc = etree.parse(xml_file_path, parser=XML_PARSER)
        except etree.XMLSyntaxError as e:
            # If there's a syntax error, that's the only result
            return [
                {
                    "type": "xml",
                    "valid": False,
                    "message": f"XML syntax error: {str(e)}",
                }
            ]

        # Validate against each schema
        for schema_type in schemas_to_validate:
            xsd_path = ADES_XSD_DIR / f"{schema_type}.xsd"

            if not xsd_path.exists():
                results.append(
                    {
                        "type": schema_type,
                        "valid": False,
                        "message": f"XSD schema file not found: {xsd_path}",
                    }
                )
                continue

            try:
                schema_doc = etree.parse(str(xsd_path), parser=XML_PARSER)
                schema = etree.XMLSchema(schema_doc)

                is_valid = schema.validate(xml_doc)

                if is_valid:
                    results.append(
                        {
                            "type": schema_type,
                            "valid": True,
                            "message": (
                                f"Validation against {schema_type} schema passed"
                            ),
                        }
                    )
                else:
                    # Get detailed error information
                    error_log = schema.error_log
                    errors = []
                    for error in error_log:
                        errors.append(
                            f"Line {error.line}, Column {error.column}: {error.message}"
                        )

                    results.append(
                        {
                            "type": schema_type,
                            "valid": False,
                            "message": (
                                f"Validation against {schema_type} schema failed:\n"
                                + "\n".join(errors)
                            ),
                        }
                    )
            except Exception as e:
                results.append(
                    {
                        "type": schema_type,
                        "valid": False,
                        "message": (
                            f"Error validating against {schema_type} schema: {str(e)}"
                        ),
                    }
                )

        return results

    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return [
            {
                "type": "error",
                "valid": False,
                "message": f"Error during validation: {str(e)}",
            }
        ]


def extract_xml_info(xml_path):
    """
    Extract basic information from an XML file.

    Args:
        xml_path: Path to the XML file

    Returns:
        Dictionary with XML information, or empty dict if extraction fails
    """
    xml_info = {}
    try:
        tree = etree.parse(xml_path, parser=XML_PARSER)
        root = tree.getroot()
        xml_info["root_element"] = root.tag
        xml_info["version"] = root.get("version", "unknown")
        xml_info["attributes"] = {k: v for k, v in root.attrib.items()}
    except Exception as e:
        logger.warning(f"Could not extract XML information: {str(e)}")

    return xml_info
