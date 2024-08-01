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
 *  $Revision: 5 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi;

import ca.nrc.cadc.doi.datacite.Date;
import ca.nrc.cadc.doi.datacite.DateType;
import ca.nrc.cadc.doi.datacite.Language;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.util.Log4jInit;
import java.net.URL;
import java.security.PrivilegedExceptionAction;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import javax.security.auth.Subject;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

/**
 * Persist a minimal instance
 */
public class UpdateTest extends IntTestBase {

    private static final Logger log = Logger.getLogger(UpdateTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.DEBUG);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.DEBUG);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.DEBUG);
    }

    @Override
    protected List<Date> getDates(boolean optionalAttributes) {
        List<Date> dates = new ArrayList<>();
        LocalDate localDate = LocalDate.now(ZoneId.of("UTC"));
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
        String createdDate = localDate.format(formatter);
        Date date = new Date(createdDate, DateType.CREATED);
        if (optionalAttributes) {
            date.dateInformation = "The date the DOI was created";
        }
        dates.add(date);
        return dates;
    }

    @Test
    public void updateDOITest() {
        try {
            Subject.doAs(
                readWriteSubject,
                (PrivilegedExceptionAction<Object>) () -> {
                    // minimally populated required properties
                    Resource expected = getTestResource(true, true, true);
                    expected.language = new Language("en-US");
                    String doiSuffix = null;
                    try {
                        Resource actual = doTest(expected);

                        Assert.assertNotEquals(
                            "Identifier's should not match",
                            expected.getIdentifier().getValue(),
                            actual.getIdentifier().getValue()
                        );
                        compareResource(expected, actual, false);

                        // get the URL to the new DOI
                        doiSuffix = getDOISuffix(
                            actual.getIdentifier().getValue()
                        );
                        URL doiURL = new URL(
                            String.format("%s/%s", doiServiceURL, doiSuffix)
                        );

                        // fully populated required resource
                        Resource maxResource = getTestResource(
                            false,
                            true,
                            true
                        );
                        updateResource(expected, maxResource);
                        actual = doTest(expected);
                        compareResource(expected, actual);

                        // back to minimally populated required resource
                        Resource minResource = getTestResource(
                            false,
                            false,
                            true
                        );
                        updateResource(expected, minResource);
                        actual = doTest(expected);
                        compareResource(expected, actual);

                        // update PublicationYear
                        expected.getPublicationYear().setValue("2001");
                        actual = doTest(expected);
                        compareResource(expected, actual);

                        // update Language
                        expected.language = new Language("en-GB");
                        actual = doTest(expected);
                        compareResource(expected, actual);
                    } finally {
                        if (doiSuffix != null) {
                            cleanup(doiSuffix);
                        }
                    }
                    return null;
                }
            );
        } catch (Exception e) {
            log.error("unexpected exception", e);
            Assert.fail("unexpected exception: " + e.getMessage());
        }
    }

    protected void updateResource(Resource destination, Resource source) {
        destination.getCreators().clear();
        destination.getCreators().addAll(source.getCreators());

        destination.getTitles().clear();
        destination.getTitles().addAll(source.getTitles());

        destination.getPublisher().publisherIdentifier = source.getPublisher()
            .publisherIdentifier;
        destination.getPublisher().publisherIdentifierScheme =
            source.getPublisher().publisherIdentifierScheme;
        destination.getPublisher().schemeURI = source.getPublisher().schemeURI;
        destination.getPublisher().lang = source.getPublisher().lang;

        destination.getResourceType().value = source.getResourceType().value;
    }

    protected Resource doTest(Resource resource) throws Exception {
        String testXML = getResourceXML(resource);
        String persistedXml = postDOI(doiServiceURL, testXML, TEST_JOURNAL_REF);
        DoiXmlReader reader = new DoiXmlReader();
        return reader.read(persistedXml);
    }

    @Override
    protected void compareResource(Resource expected, Resource actual) {
        Assert.assertNotEquals(
            "Identifier's should not match",
            expected.getIdentifier().getValue(),
            actual.getIdentifier().getValue()
        );
        compareResource(expected, actual, false);
    }
}
