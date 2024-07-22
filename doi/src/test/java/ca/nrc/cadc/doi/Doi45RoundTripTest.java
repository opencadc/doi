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

import ca.nrc.cadc.doi.datacite.Affiliation;
import ca.nrc.cadc.doi.datacite.CreatorName;
import ca.nrc.cadc.doi.datacite.Publisher;
import ca.nrc.cadc.doi.datacite.Rights;
import ca.nrc.cadc.util.Log4jInit;
import java.net.URI;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Test;

public class Doi45RoundTripTest extends Doi41RoundTripTest {
    private static final Logger log = Logger.getLogger(Doi45RoundTripTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.DEBUG);
    }

    @Test
    public void xmlMinSchemaTest() {
        doXMLTest(false);
    }

    @Test
    public void xmlFullSchemaTest() {
        doXMLTest(true);
    }

    @Test
    public void jsonMinSchemaTest() {
        doJSONTest(false);
    }

    @Test
    public void jsonFullSchemaTest() {
        doJSONTest(true);
    }

    @Override
    protected CreatorName getCreatorName(boolean full) {
        CreatorName creatorName = super.getCreatorName(full);
        if (full) {
            creatorName.lang = "en-GB";
        }
        return creatorName;
    }

    @Override
    protected Publisher getPublisher(boolean full) {
        Publisher publisher = super.getPublisher(full);
        if (full) {
            publisher.publisherIdentifier = "https://ror.org/04z8jg394";
            publisher.publisherIdentifierScheme = "ROR";
            publisher.schemeURI = URI.create("https://ror.org/");
            publisher.lang = "en";
        }
        return publisher;
    }

    @Override
    protected Rights getRights(boolean full) {
        Rights rights = super.getRights(full);
        if (full) {
            rights.rightsURI = URI.create("https://creativecommons.org/licenses/by/4.0/");
            rights.rightsIdentifier = "CC-BY-4.0";
            rights.rightsIdentifierScheme = "ROR";
            rights.schemeURI = URI.create("https://spdx.org/licenses/");
            rights.lang = "en";
        }
        return rights;
    }

    @Override
    protected Affiliation getAffiliation(boolean full) {
        Affiliation affiliation = super.getAffiliation(full);
        if (full) {
            affiliation.affiliationIdentifier = "https://ror.org/04wxnsj81";
            affiliation.affiliationIdentifierScheme = "ROR";
            affiliation.schemeURI = URI.create("https://ror.org");
        }
        return affiliation;
    }

}
