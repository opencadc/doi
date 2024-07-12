/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2024.                            (c) 2024.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la “GNU Affero General Public
 *  License as published by the          License” telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l’espoir qu’il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d’ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n’est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 *  : 5 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi;

import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.io.DoiJsonReader;
import ca.nrc.cadc.doi.io.DoiJsonWriter;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.doi.io.DoiXmlWriter;
import ca.nrc.cadc.util.Log4jInit;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

public class Doi45RoundTripTest extends TestBase {
    private static final Logger log = Logger.getLogger(Doi45RoundTripTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    @Test
    public void xmlMinSchemaTest() {
        doXMLTest(false, false);
    }

    @Test
    public void xmlFullSchemaTest() {
        doXMLTest(true, true);
    }

    @Test
    public void jsonMinSchemaTest() {
        doJSONTest(false, false);
    }

    @Test
    public void jsonFullSchemaTest() {
        doJSONTest(true, true);
    }

    void doXMLTest(boolean optionalProperties, boolean optionalAttributes) {
        try {
            Resource expected = getTestResource(optionalProperties, optionalAttributes, false);
            StringBuilder sb = new StringBuilder();

            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(expected, sb);
            log.debug(sb.toString());

            DoiXmlReader reader = new DoiXmlReader();
            Resource actual = reader.read(sb.toString());

            compareResource(expected, actual);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Unexpected exception", e);
            Assert.fail(e.getMessage());
        }
    }

    void doJSONTest(boolean optionalProperties, boolean optionalAttributes) {
        try {
            Resource expected = getTestResource(optionalProperties, optionalAttributes, false);
            StringBuilder sb = new StringBuilder();

            DoiJsonWriter writer = new DoiJsonWriter();
            writer.write(expected, sb);
            log.debug(sb.toString());

            DoiJsonReader reader = new DoiJsonReader();
            Resource actual = reader.read(sb.toString());

            compareResource(expected, actual);
        } catch (Exception e) {
            log.error("Unexpected exception", e);
            Assert.fail(e.getMessage());
        }
    }

}
