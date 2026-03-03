# ***********************************************************************
# ******************  CANADIAN ASTRONOMY DATA CENTRE  ******************
# *************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  *************
#
#  (c) 2026.                            (c) 2026.
#  Government of Canada                 Gouvernement du Canada
#  National Research Council            Conseil national de recherches
#  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
#  All rights reserved                  Tous droits réservés
#
#  NRC disclaims any warranties,        Le CNRC dénie toute garantie
#  expressed, implied, or               énoncée, implicite ou légale,
#  statutory, of any kind with          de quelque nature que ce
#  respect to the software,             soit, concernant le logiciel,
#  including without limitation         y compris sans restriction
#  any warranty of merchantability      toute garantie de valeur
#  or fitness for a particular          marchande ou de pertinence
#  purpose. NRC shall not be            pour un usage particulier.
#  liable in any event for any          Le CNRC ne pourra en aucun cas
#  damages, whether direct or           être tenu responsable de tout
#  indirect, special or general,        dommage, direct ou indirect,
#  consequential or incidental,         particulier ou général,
#  arising from the use of the          accessoire ou fortuit, résultant
#  software.  Neither the name          de l'utilisation du logiciel. Ni
#  of the National Research             le nom du Conseil National de
#  Council of Canada nor the            Recherches du Canada ni les noms
#  names of its contributors may        de ses  participants ne peuvent
#  be used to endorse or promote        être utilisés pour approuver ou
#  products derived from this           promouvoir les produits dérivés
#  software without specific prior      de ce logiciel sans autorisation
#  written permission.                  préalable et particulière
#                                       par écrit.
#
#  This file is part of the             Ce fichier fait partie du projet
#  OpenCADC project.                    OpenCADC.
#
#  OpenCADC is free software:           OpenCADC est un logiciel libre ;
#  you can redistribute it and/or       vous pouvez le redistribuer ou le
#  modify it under the terms of         modifier suivant les termes de
#  the GNU Affero General Public        la "GNU Affero General Public
#  License as published by the          License" telle que publiée
#  Free Software Foundation,            par la Free Software Foundation
#  either version 3 of the              : soit la version 3 de cette
#  License, or (at your option)         licence, soit (à votre gré)
#  any later version.                   toute version ultérieure.
#
#  OpenCADC is distributed in the       OpenCADC est distribué
#  hope that it will be useful,         dans l'espoir qu'il vous
#  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
#  without even the implied             GARANTIE : sans même la garantie
#  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
#  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
#  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
#  General Public License for           Générale Publique GNU Affero
#  more details.                        pour plus de détails.
#
#  You should have received             Vous devriez avoir reçu une
#  a copy of the GNU Affero             copie de la Licence Générale
#  General Public License along         Publique GNU Affero avec
#  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
#  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
#                                       <http://www.gnu.org/licenses/>.
#
# ***********************************************************************

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
