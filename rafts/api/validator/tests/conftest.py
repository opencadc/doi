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

import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import shutil
from app.main import app

# Define test data directory
TEST_DATA_DIR = Path(__file__).parent / "data"


# Make the test data directory available to tests
@pytest.fixture
def test_data_dir():
    """Path to the test data directory"""
    return TEST_DATA_DIR


@pytest.fixture
def client():
    """FastAPI test client"""
    with TestClient(app) as client:
        yield client


# Create test data once per test session
@pytest.fixture(scope="session", autouse=True)
def create_test_data():
    """Create necessary test data files for testing"""
    # Ensure test data directory exists
    TEST_DATA_DIR.mkdir(exist_ok=True)

    # Sample valid XML
    VALID_XML = """<?xml version="1.0" encoding="UTF-8"?>
<ades version="2022">
  <obsBlock>
    <optical>
      <observatory>
        <mpcCode>F51</mpcCode>
      </observatory>
      <observers>
        <name>J. Smith</name>
      </observers>
    </optical>
  </obsBlock>
</ades>
"""

    # Sample invalid XML
    INVALID_XML = """<?xml version="1.0" encoding="UTF-8"?>
<ades version="2017">
  <radar>
    <observatory>
      <mpcCode>F51</mpcCode>
    </observatory>
  </radar>
</ades>
"""

    # Sample PSV file
    SAMPLE_PSV = """# version=2022
# observatory
mpcCode|name
F51|Pan-STARRS 1
# submitter
name|institution
R. Weryk|University of Hawaii
# observers
name
R. Wainscoat
# measurers
name
R. Weryk
# optical
permID|mode|stn|prog|obsTime|ra|dec|mag|rmsMag|band|photCat|notes
00001|CCD|F51|41|2016-04-28T11:15:59.999Z|150.23|30.21|21.9|0.3|r|2MASS|dwin
"""

    # Sample MPC format
    SAMPLE_MPC = """     J99001  C2019 04 30.26891 17 47 44.91 +39 03 22.7          20.1 g      F51
     J99001  C2019 05 01.30760 17 47 21.04 +39 00 03.7          19.9 g      F51
"""

    # Create/overwrite test data files
    test_files = {
        "valid.xml": VALID_XML,
        "invalid.xml": INVALID_XML,
        "valid.psv": SAMPLE_PSV,
        "invalid.psv": "Invalid PSV content",
        "valid.mpc": SAMPLE_MPC,
        "invalid.mpc": "Invalid MPC content",
    }

    created_files = []
    for filename, content in test_files.items():
        file_path = TEST_DATA_DIR / filename
        with open(file_path, "w") as f:
            f.write(content)
        created_files.append(file_path)

    # Provide the test data
    yield

    # Cleanup created test data after the session
    for file_path in created_files:
        if file_path.exists():
            file_path.unlink()

    # Remove the directory if it's empty
    try:
        TEST_DATA_DIR.rmdir()
    except OSError:
        # Directory not empty or cannot be removed; remove recursively
        shutil.rmtree(TEST_DATA_DIR, ignore_errors=True)


# Common helper functions for reading test files
@pytest.fixture
def read_test_file():
    """Helper to read a test file"""

    def _read_file(filename):
        with open(TEST_DATA_DIR / filename, "rb") as f:
            return f.read()

    return _read_file
