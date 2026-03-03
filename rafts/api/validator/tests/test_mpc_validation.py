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

from pathlib import Path

TEST_DATA_DIR = Path(__file__).parent / "data"


def test_validate_mpc_success(client):
    """Test successful validation of MPC file"""
    test_file = TEST_DATA_DIR / "valid.mpc"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("valid.mpc", f, "text/plain")},
            data={"validation_type": "all"},
        )

    # Verify the response structure
    assert response.status_code == 200
    assert "conversion" in response.json()
    assert "success" in response.json()["conversion"]
    assert "results" in response.json()


def test_validate_mpc_conversion_failure(client):
    """Test validation of an invalid MPC file that fails conversion"""
    # For this test, we'll use a more direct approach
    # We need to modify the app route temporarily to force a conversion failure

    # Let's create a truly invalid MPC file that will fail conversion naturally
    with open(TEST_DATA_DIR / "invalid.mpc", "w") as f:
        f.write("This is not a valid MPC 80-column format file")

    # Now make the request with our custom invalid file
    with open(TEST_DATA_DIR / "invalid.mpc", "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("invalid.mpc", f, "text/plain")},
            data={"validation_type": "all"},
        )

    # Verify response status code and JSON payload for a failed conversion
    assert response.status_code == 200
    data = response.json()
    assert data.get("conversion", {}).get("success") is False
    assert data.get("results") == []


def test_validate_mpc_specific_type(client):
    """Test validation using a specific validation type"""
    test_file = TEST_DATA_DIR / "valid.mpc"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("valid.mpc", f, "text/plain")},
            data={"validation_type": "submit"},
        )

    # Verify that the response has the expected structure
    assert response.status_code == 200
    assert "results" in response.json()


def test_validate_mpc_invalid_type(client):
    """Test validation with an invalid validation type"""
    test_file = TEST_DATA_DIR / "valid.mpc"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("valid.mpc", f, "text/plain")},
            data={"validation_type": "invalid"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "Invalid validation type" in response.json()["detail"]


def test_validate_mpc_unknown_extension(client):
    """Test validation with an unknown file extension"""
    test_file = TEST_DATA_DIR / "valid.mpc"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-mpc",
            files={"file": ("data.unknown", f, "text/plain")},
            data={"validation_type": "all"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "File extension" in response.json()["detail"]
