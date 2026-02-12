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


def test_validate_xml_success(client):
    """Test successful validation of XML file"""
    test_file = TEST_DATA_DIR / "valid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("valid.xml", f, "application/xml")},
            data={"validation_type": "all"},
        )

    # Verify the response structure
    assert response.status_code == 200
    assert "results" in response.json()
    assert "xml_info" in response.json()


def test_validate_xml_uppercase_extension(client):
    """File names with upper-case extension should be accepted"""
    test_file = TEST_DATA_DIR / "valid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("VALID.XML", f, "application/xml")},
            data={"validation_type": "all"},
        )

    assert response.status_code == 200
    assert "results" in response.json()


def test_validate_xml_failure(client):
    """Test validation of an invalid XML file"""
    test_file = TEST_DATA_DIR / "invalid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("invalid.xml", f, "application/xml")},
            data={"validation_type": "all"},
        )

    # Verify the response structure and that validation failed
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert any(not r.get("valid", True) for r in data["results"])


def test_validate_xml_specific_type(client):
    """Test validation using a specific validation type"""
    test_file = TEST_DATA_DIR / "valid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("valid.xml", f, "application/xml")},
            data={"validation_type": "submit"},
        )

    # Verify the response structure
    assert response.status_code == 200
    assert "results" in response.json()

    # Print the results for debugging


def test_validate_xml_invalid_type(client):
    """Test validation with an invalid validation type"""
    test_file = TEST_DATA_DIR / "valid.xml"

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("valid.xml", f, "application/xml")},
            data={"validation_type": "invalid"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "Invalid validation type" in response.json()["detail"]


def test_validate_xml_non_xml_file(client):
    """Test validation with a non-XML file"""
    test_file = TEST_DATA_DIR / "valid.psv"  # Using PSV file as non-XML

    with open(test_file, "rb") as f:
        response = client.post(
            "/validate-xml",
            files={"file": ("file.txt", f, "text/plain")},
            data={"validation_type": "all"},
        )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "File must be an XML document" in response.json()["detail"]
