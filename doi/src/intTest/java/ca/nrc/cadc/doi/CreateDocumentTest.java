/*
************************************************************************
*******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
**************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
*
*  (c) 2018.                            (c) 2018.
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

import ca.nrc.cadc.ac.client.GMSClient;
import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.net.URI;
import java.net.URL;
import java.security.AccessControlException;
import java.security.PrivilegedActionException;
import java.security.PrivilegedExceptionAction;
import java.util.List;

import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Ignore;
import org.junit.Test;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusListXmlReader;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpDownload;
import ca.nrc.cadc.util.Log4jInit;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.VOS;
import org.opencadc.vospace.VOSURI;

/**
 */
public class CreateDocumentTest extends DocumentTest {
    private static final Logger log = Logger.getLogger(CreateDocumentTest.class);

    static final String JSON = "application/json";

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    public CreateDocumentTest() {
    };

    private List<DoiStatus> getDoiStatusList(Subject s) throws PrivilegedActionException {
        List<DoiStatus> doiStatusList = (List<DoiStatus>) Subject.doAs(s,
                new PrivilegedExceptionAction<List<DoiStatus>>() {
                    public List<DoiStatus> run() throws Exception {
                        URL docURL = new URL(baseURL);
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        HttpDownload get = new HttpDownload(docURL, baos);
                        get.setRequestProperty("Accept", "text/xml");
                        get.run();
                        DoiStatusListXmlReader statusReader = new DoiStatusListXmlReader();
                        return (List<DoiStatus>) statusReader
                                .read(new StringReader(new String(baos.toByteArray(), "UTF-8")));
                    }
                });

        return doiStatusList;
    }

    @Test
    public void testCreateDocumentAndStatus() throws Throwable {

        final Subject cadcauthtest_sub = SSLUtil.createSubject(CADCAUTHTEST_CERT);
        final Subject doiadmin_sub = SSLUtil.createSubject(DOIADMIN_CERT);

        this.buildInitialDocument();
        Subject.doAs(cadcauthtest_sub, new PrivilegedExceptionAction<Object>() {
            public Object run() throws Exception {
                // post the job
                URL postUrl = new URL(baseURL);

                log.debug("baseURL: " + baseURL);
                log.debug("posting to: " + postUrl);

                // Check that the doi server processed the document and added an identifier
                String returnedDoc = postDocument(postUrl, initialDocument, TEST_JOURNAL_REF);
                Resource resource = xmlReader.read(returnedDoc);
                String returnedIdentifier = resource.getIdentifier().getText();
                Assert.assertFalse("New identifier not received from doi service.",
                        initialResource.getIdentifier().getText().equals(returnedIdentifier));

                // Pull the suffix from the identifier
                String[] doiNumberParts = returnedIdentifier.split("/");

                try {
                    // Get the document in JSON format
                    URL docURL = new URL(baseURL + "/" + doiNumberParts[1]);
                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    HttpDownload get = new HttpDownload(docURL, bos);
                    get.setRequestProperty("Accept", JSON);
                    get.run();
                    Assert.assertNull("GET " + docURL.toString() + " in JSON failed. ", get.getThrowable());
                    Assert.assertEquals(JSON, get.getContentType());

                    // should have runId property, only test DOI's have this property
                    ContainerNode doiContainerNode = getContainerNode(doiNumberParts[1]);
                    Assert.assertEquals("incorrect runId property", "TEST", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_RUNID));

                    // For DOI status test below
                    Title expectedTitle = resource.getTitles().get(0);
                    String expectedDataDirectory = "/AstroDataCitationDOI/CISTI.CANFAR/" + doiNumberParts[1] + "/data";

                    // Get the DOI status
                    URL statusURL = new URL(docURL + "/" + DoiAction.STATUS_ACTION);
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    HttpDownload getStatus = new HttpDownload(statusURL, baos);
                    getStatus.run();
                    Assert.assertNull("GET " + statusURL.toString() + " in XML failed. ", getStatus.getThrowable());
                    DoiStatusXmlReader statusReader = new DoiStatusXmlReader();
                    DoiStatus doiStatus = statusReader.read(new StringReader(new String(baos.toByteArray(), "UTF-8")));
                    Assert.assertEquals("identifier from DOI status is different", returnedIdentifier,
                            doiStatus.getIdentifier().getText());
                    Assert.assertEquals("dataDirectory from DOI status is different", expectedDataDirectory,
                            doiStatus.getDataDirectory());
                    Assert.assertEquals("title from DOI status is different", expectedTitle.getText(),
                            doiStatus.getTitle().getText());
                    Assert.assertEquals("status is incorrect", Status.DRAFT, doiStatus.getStatus());
                    Assert.assertEquals("journalRef is incorrect", TEST_JOURNAL_REF, doiStatus.journalRef);
                } catch (Exception e) {
                    log.error("unexpected exception", e);
                    Assert.fail("unexpected exception");
                } finally {
                    // delete containing folder using doiadmin credentials
                    Subject.doAs(doiadmin_sub, new PrivilegedExceptionAction<Object>() {
                        public Object run() throws Exception {
                            log.debug("Cleanup as doiadmin");
                            try {
                                GMSClient gmsClient = new GMSClient(new URI(DoiAction.GMS_RESOURCE_ID));
                                String groupToDelete = DoiAction.DOI_GROUP_PREFIX + doiNumberParts[1];
                                log.debug("deleting this group: " + groupToDelete);
                                gmsClient.deleteGroup(groupToDelete);

                                VOSURI nodeURI = new VOSURI(DoiAction.VAULT_RESOURCE_ID, DoiAction.DOI_BASE_FILEPATH + "/" + doiNumberParts[1]);
                                vosClient.deleteNode(nodeURI.getPath() + "/" + getDoiFilename(doiNumberParts[1]));
                                vosClient.deleteNode(nodeURI.getPath() + "/data");
                                vosClient.deleteNode(nodeURI.getPath());
                            } catch (AccessControlException nae) {
                                log.info("expected exception: ", nae);
                            } catch (Exception e) {
                                log.info("some other error occurred", e);
                                Assert.fail();
                            }
                            return "done";
                        }
                    });
                }
                return resource;
            }
        });
    }

    // Ignored until getting the status list returns in a reasonable time.
    @Ignore
    @Test
    public void testGetStatusList() throws Throwable {
        final Subject cadcauthtest_sub = SSLUtil.createSubject(CADCAUTHTEST_CERT);
        final Subject doiadmin_sub = SSLUtil.createSubject(DOIADMIN_CERT);
        final String[] newDois = new String[3];

        // create a list of documents
        for (int i = 0; i < newDois.length; i++) {
            newDois[i] = this.createADocument(cadcauthtest_sub);
        }

        // invoke the doi list service
        System.out.print("made dois");
        List<DoiStatus> doiStatusList = getDoiStatusList(cadcauthtest_sub);
        DoiStatus[] doiStatusArray = doiStatusList.toArray(new DoiStatus[doiStatusList.size()]);

        // verify that the returned list contains the dois of the documents just created
        // above
        Assert.assertTrue("Some created DOIs are missing from the DOI list", doiStatusList.size() >= newDois.length);
        try {
            int matchCount = 0;
            for (int i = 0; i < doiStatusArray.length; i++) {
                for (int j = 0; j < newDois.length; j++) {
                    DoiStatus doiStatus = doiStatusArray[i];
                    String[] doiParts = doiStatus.getIdentifier().getText().split("/");

                    // verify doi
                    if (doiParts[1].equals(newDois[j])) {
                        // verify status
                        Status status = doiStatus.getStatus();
                        Assert.assertEquals("Status of DOI " + doiParts[1] + " is incorrect", Status.DRAFT, status);

                        // verify data directory
                        String actualDataDirectory = doiStatus.getDataDirectory();
                        String expectedDataDirectory = "/AstroDataCitationDOI/CISTI.CANFAR/" + newDois[j] + "/data";
                        Assert.assertEquals("Data directories are different", expectedDataDirectory,
                                actualDataDirectory);

                        matchCount++;
                        break;
                    }
                }

                if (matchCount == newDois.length) {
                    break;
                }
            }

            Assert.assertEquals("Missing DOIs in DOI list", newDois.length, matchCount);
        } catch (Exception e) {
            log.error("unexpected exception", e);
            Assert.fail("unexpected exception: " + e);
        } finally {
            // clean up as doiadmin
            Subject.doAs(doiadmin_sub, new PrivilegedExceptionAction<Object>() {
                public Object run() throws Exception {
                    log.debug("Cleanup as doiadmin");
                    GMSClient gmsClient = new GMSClient(new URI(DoiAction.GMS_RESOURCE_ID));
                    try {
                        for (int i = 0; i < newDois.length; i++) {
                            String groupToDelete = DoiAction.DOI_GROUP_PREFIX + newDois[1];
                            log.debug("deleting this group: " + groupToDelete);
                            gmsClient.deleteGroup(groupToDelete);

                            VOSURI nodeURI = new VOSURI(DoiAction.VAULT_RESOURCE_ID, DoiAction.DOI_BASE_FILEPATH + "/" + newDois[i]);
                            vosClient.deleteNode(nodeURI.getPath() + "/" + getDoiFilename(newDois[i]));
                            vosClient.deleteNode(nodeURI.getPath() + "/data");
                            vosClient.deleteNode(nodeURI.getPath());
                        }
                    } catch (AccessControlException nae) {
                        log.info("expected exception: ", nae);
                    } catch (Exception e) {
                        log.info("some other error occurred", e);
                        Assert.fail();
                    }
                    return "done";
                }
            });

        }
    }
}