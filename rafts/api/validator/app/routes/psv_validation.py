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
