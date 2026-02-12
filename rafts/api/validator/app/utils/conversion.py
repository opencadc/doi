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

import asyncio
import os
import sys

from lxml import etree

from app.config import logger


async def _run_converter(converter_module_path, input_path, output_path, label):
    """
    Run an ADES converter script as a subprocess.

    Subprocess isolation is used because the ADES converter scripts call
    exit() on errors, which would kill the FastAPI process if imported directly.

    Args:
        converter_module_path: Path to the converter module file
        input_path: Path to the input file
        output_path: Path to save the resulting XML file
        label: Human-readable label for log messages

    Returns:
        Tuple of (success, message)
    """
    try:
        logger.info(f"Converting {label}: {input_path} -> {output_path}")

        process = await asyncio.create_subprocess_exec(
            sys.executable,
            str(converter_module_path),
            str(input_path),
            str(output_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout_bytes, stderr_bytes = await process.communicate()
        result_stdout = stdout_bytes.decode()
        result_stderr = stderr_bytes.decode()

        if (
            process.returncode == 0
            and os.path.exists(output_path)
            and not (result_stdout.strip() or result_stderr.strip())
        ):
            try:
                etree.parse(output_path)
            except Exception as e:
                if os.path.exists(output_path):
                    os.unlink(output_path)
                return False, f"{label} conversion produced invalid XML: {str(e)}"
            return True, f"{label} conversion successful"
        else:
            error_message = result_stdout + "\n" + result_stderr
            return False, f"{label} conversion failed: {error_message}"

    except Exception as e:
        logger.error(f"{label} conversion error: {str(e)}")
        return False, f"Error during {label} conversion: {str(e)}"


async def convert_psv_to_xml(psv_file_path, xml_output_path):
    """
    Convert a PSV file to XML format using the ADES converter.

    Args:
        psv_file_path: Path to the PSV file
        xml_output_path: Path to save the resulting XML file

    Returns:
        Tuple of (success, message)
    """
    import ades.psvtoxml

    return await _run_converter(
        ades.psvtoxml.__file__, psv_file_path, xml_output_path, "PSV to XML"
    )


async def convert_mpc_to_xml(mpc_file_path, xml_output_path):
    """
    Convert an MPC 80-column format file to XML using the ADES converter.

    Args:
        mpc_file_path: Path to the MPC 80-column file
        xml_output_path: Path to save the resulting XML file

    Returns:
        Tuple of (success, message)
    """
    import ades.mpc80coltoxml

    return await _run_converter(
        ades.mpc80coltoxml.__file__, mpc_file_path, xml_output_path, "MPC 80-col to XML"
    )
