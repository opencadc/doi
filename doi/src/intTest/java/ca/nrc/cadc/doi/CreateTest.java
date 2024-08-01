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

import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusListXmlReader;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpGet;
import ca.nrc.cadc.util.Log4jInit;
import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.PrivilegedActionException;
import java.security.PrivilegedExceptionAction;
import java.util.ArrayList;
import java.util.List;
import javax.security.auth.Subject;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

/**
 */
public class CreateTest extends IntTestBase {

    private static final Logger log = Logger.getLogger(CreateTest.class);

    static final String JSON = "application/json";

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    @Test
    public void createDOIAndStatusTest() {
        try {
            Subject.doAs(
                readWriteSubject,
                (PrivilegedExceptionAction<Object>) () -> {
                    // create new doi
                    Resource testResource = getTestResource(false, true, true);
                    String testXML = getResourceXML(testResource);

                    String doiSuffix = null;
                    try {
                        // check that the service processed the document and added an identifier
                        String persistedXml = postDOI(
                            doiServiceURL,
                            testXML,
                            TEST_JOURNAL_REF
                        );
                        DoiXmlReader reader = new DoiXmlReader();
                        Resource persistedResource = reader.read(persistedXml);

                        String testIdentifier = testResource
                            .getIdentifier()
                            .getValue();
                        String persistedIdentifier = persistedResource
                            .getIdentifier()
                            .getValue();
                        Assert.assertNotEquals(
                            "New identifier not received from doi service.",
                            testIdentifier,
                            persistedIdentifier
                        );
                        doiSuffix = getDOISuffix(persistedIdentifier);

                        // Get the DOI in JSON format
                        URL doiURL = new URL(
                            String.format("%s/%s", doiServiceURL, doiSuffix)
                        );
                        ByteArrayOutputStream bos = new ByteArrayOutputStream();
                        HttpGet get = new HttpGet(doiURL, bos);
                        get.setRequestProperty("Accept", JSON);
                        get.prepare();
                        Assert.assertNull("GET exception", get.getThrowable());
                        Assert.assertEquals(JSON, get.getContentType());

                        // Get the DOI status
                        URL statusURL = new URL(
                            String.format(
                                "%s/%s",
                                doiURL,
                                DoiAction.STATUS_ACTION
                            )
                        );
                        log.debug("statusURL: " + statusURL);
                        ByteArrayOutputStream baos =
                            new ByteArrayOutputStream();
                        HttpGet getStatus = new HttpGet(statusURL, baos);
                        getStatus.run();
                        Assert.assertNull("GET exception", get.getThrowable());
                        String status = baos.toString(StandardCharsets.UTF_8);
                        log.debug("status: " + status);

                        DoiStatusXmlReader statusReader =
                            new DoiStatusXmlReader();
                        DoiStatus doiStatus = statusReader.read(
                            new StringReader(status)
                        );

                        Assert.assertEquals(
                            "identifier mismatch",
                            persistedIdentifier,
                            doiStatus.getIdentifier().getValue()
                        );
                        String expectedDataDirectory = String.format(
                            "%s/%s/data",
                            TestUtil.DOI_PARENT_PATH,
                            doiSuffix
                        );
                        Assert.assertEquals(
                            "dataDirectory mismatch",
                            expectedDataDirectory,
                            doiStatus.getDataDirectory()
                        );
                        Title expectedTitle = testResource.getTitles().get(0);
                        Assert.assertEquals(
                            "title mismatch",
                            expectedTitle.getValue(),
                            doiStatus.getTitle().getValue()
                        );
                        Assert.assertEquals(
                            "status mismatch",
                            Status.DRAFT,
                            doiStatus.getStatus()
                        );
                        Assert.assertEquals(
                            "journalRef mismatch",
                            TEST_JOURNAL_REF,
                            doiStatus.journalRef
                        );
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

    @Test
    public void testGetStatusList() {
        List<String> testDOIList = new ArrayList<>();
        try {
            // create test DOI's
            testDOIList.add(createDOI(readWriteSubject));
            testDOIList.add(createDOI(readWriteSubject));
            testDOIList.add(createDOI(readWriteSubject));

            // invoke the doi list service
            List<DoiStatus> doiStatusList = getDoiStatusList(readWriteSubject);
            Assert.assertEquals(
                "test DOI list and status DOI list mismatch",
                testDOIList.size(),
                doiStatusList.size()
            );

            for (String doiSuffix : testDOIList) {
                boolean found = false;
                for (DoiStatus doiStatus : doiStatusList) {
                    if (
                        doiSuffix.equals(doiStatus.getIdentifier().getValue())
                    ) {
                        Assert.assertEquals(
                            "expected DOI status DRAFT",
                            Status.DRAFT,
                            doiStatus.getStatus()
                        );
                        String dataDirectory = String.format(
                            "%s/%s/data",
                            TestUtil.DOI_PARENT_PATH,
                            doiSuffix
                        );
                        Assert.assertEquals(
                            "data directory mismatch",
                            dataDirectory,
                            doiStatus.getDataDirectory()
                        );
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    Assert.fail("doiSuffix %s not found in DOI status list");
                }
            }
        } catch (Exception e) {
            log.error("unexpected exception", e);
            Assert.fail("unexpected exception: " + e.getMessage());
        } finally {
            for (String doiSuffix : testDOIList) {
                cleanup(doiSuffix);
            }
        }
    }

    private List<DoiStatus> getDoiStatusList(Subject testSubject)
        throws PrivilegedActionException {
        // TODO readWriteSubject
        return Subject.doAs(
            testSubject,
            (PrivilegedExceptionAction<List<DoiStatus>>) () -> {
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                HttpGet get = new HttpGet(doiServiceURL, bos);
                get.setRequestProperty("Accept", "text/xml");
                get.run();
                DoiStatusListXmlReader reader = new DoiStatusListXmlReader();
                return reader.read(
                    new StringReader(bos.toString(StandardCharsets.UTF_8))
                );
            }
        );
    }
}
