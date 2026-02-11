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

import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.Date;
import ca.nrc.cadc.doi.datacite.DateType;
import ca.nrc.cadc.doi.datacite.Language;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.datacite.TitleType;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.FileContent;
import ca.nrc.cadc.net.HttpGet;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.util.Log4jInit;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.StringReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.security.auth.Subject;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.DataNode;
import org.opencadc.vospace.VOS;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.ClientTransfer;
import org.opencadc.vospace.client.VOSpaceClient;
import org.opencadc.vospace.transfer.Direction;
import org.opencadc.vospace.transfer.Protocol;
import org.opencadc.vospace.transfer.Transfer;

public class LifecycleTest extends IntTestBase {

    private static final Logger log = Logger.getLogger(LifecycleTest.class);
    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    @Test
    public void testLifecycle() throws Exception {
        log.debug("testLifecycle()");

        // Create a new DOI
        Resource expected = getTestResource(true, true);

        String doiSuffix = Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

            // create a new DOI
            Resource actual = create(expected, DOISettingsType.DOI);
            String doiID = getDOISuffix(actual.getIdentifier().getValue());

            // update the DOI
            update(actual, doiID, doiServiceURL);

            // publish the DOI
            publish(actual, doiID, DOISettingsType.DOI);

            return doiID;
        });
    }

    Resource create(Resource expected,  DOISettingsType doiSettingsType) throws Exception {

        VOSpaceClient vosClient = getVOSClient(doiSettingsType);
        URL doiServiceURL = getDoiServiceURL(doiSettingsType);

        // Create the folder for the test, and the initial XML file
        String doiMetaData = getResourceXML(expected);
        FileContent metaDataContent = new FileContent(doiMetaData, XML, StandardCharsets.UTF_8);
        Map<String, String> doiNodeData = new HashMap<>();
        doiNodeData.put(DOI.JOURNALREF_NODE_PARAMETER, TEST_JOURNAL_REF);
        FileContent nodeDataContent = new FileContent(getMapAsJSON(doiNodeData), JSON, StandardCharsets.UTF_8);
        Map<String, Object> params = new HashMap<>();
        params.put(DoiInlineContentHandler.META_DATA_KEY, metaDataContent);
        params.put(DoiInlineContentHandler.NODE_DATA_KEY, nodeDataContent);
        HttpPost post = new HttpPost(doiServiceURL, params, false);
        post.run();

        Assert.assertNull("POST exception", post.getThrowable());
        Assert.assertEquals("expected 303 response code", 303, post.getResponseCode());
        String doiPath = post.getRedirectURL().getPath();
        log.debug("redirectURL path: " + doiPath);

        // get the doi suffix
        int index = doiPath.lastIndexOf("/");
        String pathDoiSuffix = doiPath.substring(index + 1);

        // Get the new DOI in XML format
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        HttpGet get = new HttpGet(post.getRedirectURL(), bos);
        get.setRequestProperty("Accept", XML);
        get.run();
        Assert.assertNull("GET exception", get.getThrowable());
        Assert.assertEquals("expected 200 response code", 200, get.getResponseCode());

        // actual resource
        DoiXmlReader reader = new DoiXmlReader();
        Resource actual = reader.read(bos.toString(StandardCharsets.UTF_8));

        String expectedIdentifier = expected.getIdentifier().getValue();
        String actualIdentifier = actual.getIdentifier().getValue();
        Assert.assertNotEquals("New identifier not received from doi service.",
                expectedIdentifier, actualIdentifier);
        compareResource(expected, actual, false);

        String doiSuffix = getDOISuffix(actualIdentifier);
        Assert.assertEquals("DOI suffix", pathDoiSuffix, doiSuffix);

        // Get the DOI in JSON format
        URL doiURL = new URL(String.format("%s/%s", doiServiceURL, doiSuffix));
        bos = new ByteArrayOutputStream();
        get = new HttpGet(doiURL, bos);
        get.setRequestProperty("Accept", JSON);
        get.prepare();
        Assert.assertNull("GET exception", get.getThrowable());
        Assert.assertEquals(JSON, get.getContentType());

        // Get the DOI status
        URL statusURL = new URL(String.format("%s/%s", doiURL, DoiAction.STATUS_ACTION));
        log.debug("statusURL: " + statusURL);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        HttpGet getStatus = new HttpGet(statusURL, baos);
        getStatus.run();
        Assert.assertNull("GET exception", get.getThrowable());
        String status = baos.toString(StandardCharsets.UTF_8);
        log.debug("status: " + status);

        DoiStatusXmlReader statusReader = new DoiStatusXmlReader();
        DoiStatus doiStatus = statusReader.read(new StringReader(status));

        Assert.assertEquals("identifier mismatch", actualIdentifier, doiStatus.getIdentifier().getValue());
        String expectedDataDirectory = String.format("%s/%s/data", doiSettingsType.equals(DOISettingsType.DOI) ? TestUtil.DOI_PARENT_PATH : TestUtil.DOI_ALT_PARENT_PATH, doiSuffix);
        Assert.assertEquals("dataDirectory mismatch", expectedDataDirectory, doiStatus.getDataDirectory());
        Title expectedTitle = expected.getTitles().get(0);
        Assert.assertEquals("title mismatch", expectedTitle.getValue(), doiStatus.getTitle().getValue());
        Assert.assertEquals("status mismatch", Status.DRAFT, doiStatus.getStatus());
        Assert.assertEquals("journalRef mismatch", TEST_JOURNAL_REF, doiStatus.journalRef);

        // Test writing to the data directory
        String dataNodeName = String.format("%s/data", doiSuffix);
        log.debug("write to data folder " + dataNodeName);
        String fileName = "doi-test-write-file.txt";
        String dataFileToWrite = dataNodeName + "/" + fileName;

        VOSURI target = getVOSURI(dataFileToWrite, doiSettingsType);
        DataNode dataNode = new DataNode(fileName);
        log.debug("PUT target:" + target.getURI());
        vosClient.createNode(target, dataNode);

        Transfer transfer = new Transfer(target.getURI(), Direction.pushToVoSpace);
        Protocol put = new Protocol(VOS.PROTOCOL_HTTPS_PUT);
        transfer.getProtocols().add(put);

        log.debug("file to be written: " + dataFileToWrite);
        ClientTransfer clientTransfer = vosClient.createTransfer(transfer);
        File testFile = new File("src/intTest/resources/" + fileName);
        clientTransfer.setFile(testFile);
        clientTransfer.run();

        // Check that file is there.
        String newFilePath = target.getPath();
        vosClient.getNode(newFilePath);

        // Test that read only subject CAN'T write to the same folder
        String writeName = "doi-test-write-failed.txt";
        final String writeFile = dataNodeName + "/" + writeName;

        // Try to write to data directory as read only subject
        Subject.doAs(readOnlySubject, (PrivilegedExceptionAction<Object>) () -> {
            log.debug("write as read only subject");
            try {
                VOSURI target1 = getVOSURI(writeFile, doiSettingsType);
                DataNode dataNode1 = new DataNode(writeName);
                vosClient.createNode(target1, dataNode1);
            } catch (
                    AccessControlException e) {
                log.debug("expected exception: " + e.getMessage());
            } catch (Exception e) {
                Assert.fail("exception writing file: " + e.getMessage());
            }
            return null;
        });
        return actual;
    }

    void update(Resource expected, String doiSuffix, URL doiServiceURL) throws Exception {
        // For DOI tests below
        URL doiURL = new URL(String.format("%s/%s", doiServiceURL, doiSuffix));

        // Only user editable fields are language, publicationYear, creators, titles
        expected.language = new Language("en-US");
        expected.getPublicationYear().setValue("2024");
        Creator creator = new Creator(getCreatorName("foo, bar", true));
        expected.getCreators().add(creator);
        Title title = new Title("Updated Title");
        title.titleType = TitleType.OTHER;
        expected.getTitles().add(title);

        // Update the DOI
        Resource actual = doUpdateTest(expected, doiURL);
        compareResource(expected, actual, true);

        // remove updated properties
        log.info("creaters before: " + expected.getCreators());
        expected.getCreators().remove(creator);
        expected.getTitles().remove(title);
        log.info("creaters after: " + expected.getCreators());

        // Update the DOI
        actual = doUpdateTest(expected, doiURL);
        log.info("expected: " + expected);
        log.info("actual: " + actual);
//        compareResource(expected, actual, true);
    }

    void publish(Resource expected, String doiSuffix, DOISettingsType doiSettingsType) throws Exception {
        // For DOI tests below
        URL doiURL = new URL(String.format("%s/%s", getDoiServiceURL(doiSettingsType), doiSuffix));
        VOSpaceClient vosClient = getVOSClient(doiSettingsType);
        VOSURI doiParentPathURI = getDoiParentPathURI(doiSettingsType);

        // verify the DOI containerNode properties
        ContainerNode doiNode = getContainerNode(doiSuffix , doiParentPathURI, vosClient);
        Assert.assertFalse("incorrect isPublic property",
                doiNode.isPublic != null && doiNode.isPublic);
        Assert.assertFalse("should have group read property",
                doiNode.getReadOnlyGroup().isEmpty());
        ContainerNode dataNode = getContainerNode(doiSuffix + "/data", doiParentPathURI, vosClient);
        Assert.assertFalse("should have group write",
                dataNode.getReadWriteGroup().isEmpty());

        // add a file and a subdirectory with a file to the data directory
        String testFile1 = "test-file-1.txt";
        String testFile1Path = String.format("%s/data/%s", doiSuffix, testFile1);
        DataNode testFileNode = createDataNode(testFile1Path, testFile1, doiSettingsType);

        String subDir = "subDir";
        String subDirPath = String.format("%s/data/%s", doiSuffix, subDir);
        ContainerNode dataSubDirNode = createContainerNode(subDirPath, subDir, doiSettingsType);

        String testFile2 = "test-file-2.txt";
        String testFile2Path = String.format("%s/data/%s/%s", doiSuffix, subDir, testFile2);
        DataNode testFile2Node = createDataNode(testFile2Path, testFile2, doiSettingsType);

        // mint the document, DRAFT ==> LOCKING_DATA
        doMintTest(doiURL);
        doiNode = getContainerNode(doiSuffix , doiParentPathURI, vosClient);
        dataNode = getContainerNode(doiSuffix + "/data" , doiParentPathURI, vosClient);
        dataSubDirNode = getContainerNode(doiSuffix + "/data/" + subDir , doiParentPathURI, vosClient);
        Assert.assertEquals("incorrect status",
                Status.LOCKING_DATA.getValue(), doiNode.getPropertyValue(DOI.VOSPACE_DOI_STATUS_PROPERTY));
        verifyNodeProperties(doiNode, dataNode, dataSubDirNode);
        log.debug("locking data");

        // mint the document, ERROR_LOCKING_DATA ==> LOCKING_DATA
        doiNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY).setValue(Status.ERROR_LOCKING_DATA.getValue());
        VOSURI vosuri = getVOSURI(doiNode.getName(), doiSettingsType);
        vosClient.setNode(vosuri, doiNode);
        doMintTest(doiURL);
        doiNode = getContainerNode(doiSuffix , doiParentPathURI, vosClient);
        dataNode = getContainerNode(doiSuffix + "/data" , doiParentPathURI, vosClient);
        dataSubDirNode = getContainerNode(doiSuffix + "/data/" + subDir , doiParentPathURI, vosClient);
        Assert.assertEquals("incorrect status",
                Status.LOCKING_DATA.getValue(), doiNode.getPropertyValue(DOI.VOSPACE_DOI_STATUS_PROPERTY));
        verifyNodeProperties(doiNode, dataNode, dataSubDirNode);
        log.debug("locking data again");

        // getStatus() changes LOCKING_DATA == > LOCKED_DATA
        DoiStatus  doiStatus = getStatus(doiURL);
        Assert.assertEquals("identifier from DOI status is different",
                expected.getIdentifier().getValue(), doiStatus.getIdentifier().getValue());
        Assert.assertEquals("status is incorrect", Status.LOCKED_DATA, doiStatus.getStatus());
        verifyLockedDataPropertyChanges(doiNode, dataNode, dataSubDirNode);
        log.debug("locked data");

        // mint the document, LOCKED_DATA == REGISTERING
        doMintTest(doiURL);
        doiNode = getContainerNode(doiSuffix , doiParentPathURI, vosClient);
        dataNode = getContainerNode(doiSuffix + "/data" , doiParentPathURI, vosClient);
        dataSubDirNode = getContainerNode(doiSuffix + "/data/" + subDir , doiParentPathURI, vosClient);
        Assert.assertEquals("incorrect status",
                Status.MINTED.getValue(), doiNode.getPropertyValue(DOI.VOSPACE_DOI_STATUS_PROPERTY));
        verifyMintedStatePropertyChanges(doiNode, dataNode, dataSubDirNode);
        log.debug("registering");

        // mint the document, ERROR_REGISTERING ==> REGISTERING
        // the doiContainerNode doesn't have group read & write anymore, and is owned
        // by doi admin, so changes to it must be done with that cert.
        doiNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY).setValue(Status.ERROR_REGISTERING.getValue());
        ContainerNode doiParentNode = doiNode;
        Subject.doAs(adminSubject, (PrivilegedExceptionAction<Object>) () -> {
            VOSURI parentVOSURI = getVOSURI(doiParentNode.getName(), doiSettingsType);
            vosClient.setNode(parentVOSURI, doiParentNode);
            return null;
        });
        log.debug("registering again");

        doMintTest(doiURL);
        doiNode = getContainerNode(doiSuffix , doiParentPathURI, vosClient);
        dataNode = getContainerNode(doiSuffix + "/data" , doiParentPathURI, vosClient);
        dataSubDirNode = getContainerNode(doiSuffix + "/data/" + subDir , doiParentPathURI, vosClient);
        Assert.assertEquals("incorrect status",
                Status.MINTED.getValue(), doiNode.getPropertyValue(DOI.VOSPACE_DOI_STATUS_PROPERTY));
        verifyMintedStatePropertyChanges(doiNode, dataNode, dataSubDirNode);

        // getStatus() changes REGISTERING == > MINTED
        doiStatus = getStatus(doiURL);
        Assert.assertEquals("identifier from DOI status is different",
                expected.getIdentifier().getValue(), doiStatus.getIdentifier().getValue());
        Assert.assertEquals("status is incorrect", Status.MINTED, doiStatus.getStatus());

        // verify the DOI containerNode properties
        Assert.assertEquals("incorrect status", Status.MINTED.getValue(), doiNode.getPropertyValue(DOI.VOSPACE_DOI_STATUS_PROPERTY));
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

    protected Resource doUpdateTest(Resource resource, URL doiURL) throws Exception {
        String testXML = getResourceXML(resource);
        String persistedXml = postDOI(doiURL, testXML, null, true);
        DoiXmlReader reader = new DoiXmlReader();
        return reader.read(persistedXml);
    }

    protected void doMintTest(URL doiURL) throws Exception {
        URL mintURL = new URL(doiURL + "/" + DoiAction.MINT_ACTION);
        postDOI(mintURL, null, null, true);
    }

    private DoiStatus getStatus(URL doiURL)
            throws Exception {
        URL statusURL = new URL(doiURL + "/" + DoiAction.STATUS_ACTION);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        HttpGet get = new HttpGet(statusURL, bos);
        get.setRequestProperty("Accept", "text/xml");
        get.run();
        Assert.assertNull("GET exception", get.getThrowable());
        DoiStatusXmlReader reader = new DoiStatusXmlReader();
        return reader.read(new StringReader(bos.toString(StandardCharsets.UTF_8)));
    }

    private void verifyDataDirNodeProperties(ContainerNode dataContainerNode,
                                             ContainerNode dataSubDirContainerNode) {
        // verify the DOI data containerNode properties
        Assert.assertTrue("should be public", dataContainerNode.isPublic != null && dataContainerNode.isPublic);
        Assert.assertTrue("should not have group read", dataContainerNode.getReadOnlyGroup().isEmpty());
        Assert.assertTrue("should not have group write", dataContainerNode.getReadWriteGroup().isEmpty());
        Assert.assertTrue("incorrect lock property", dataContainerNode.isLocked != null && dataContainerNode.isLocked);

        // verify the DOI data subDir containerNode properties
        Assert.assertTrue("should be public", dataSubDirContainerNode.isPublic != null && dataSubDirContainerNode.isPublic);
        Assert.assertTrue("should not have group read", dataSubDirContainerNode.getReadOnlyGroup().isEmpty());
        Assert.assertTrue("should not have group write", dataSubDirContainerNode.getReadWriteGroup().isEmpty());
        Assert.assertTrue("incorrect lock property", dataSubDirContainerNode.isLocked != null && dataSubDirContainerNode.isLocked);
    }

    private void verifyNodeProperties(ContainerNode doiContainerNode, ContainerNode dataContainerNode,
                                      ContainerNode dataSubDirContainerNode) {
        // verify the DOI containerNode properties
        Assert.assertFalse("incorrect isPublic property", doiContainerNode.isPublic != null && doiContainerNode.isPublic);
        Assert.assertFalse("should have group read", doiContainerNode.getReadWriteGroup().isEmpty());
        Assert.assertFalse("should have group write", doiContainerNode.getReadWriteGroup().isEmpty());
        Assert.assertFalse("incorrect lock property", doiContainerNode.isLocked != null && doiContainerNode.isLocked);

        verifyDataDirNodeProperties(dataContainerNode, dataSubDirContainerNode);
    }

    private void verifyLockedDataPropertyChanges(ContainerNode doiContainerNode, ContainerNode dataContainerNode,
                                                 ContainerNode dataSubDirContainerNode) {
        // verify the DOI containerNode properties
        Assert.assertFalse("incorrect isPublic property", doiContainerNode.isPublic != null && doiContainerNode.isPublic);
        Assert.assertFalse("should have group read", doiContainerNode.getReadWriteGroup().isEmpty());
        Assert.assertFalse("should have group write", doiContainerNode.getReadWriteGroup().isEmpty());
        Assert.assertFalse("incorrect lock property", doiContainerNode.isLocked != null && doiContainerNode.isLocked);

        verifyDataDirNodeProperties(dataContainerNode, dataSubDirContainerNode);
    }

    private void verifyMintedStatePropertyChanges(ContainerNode doiContainerNode, ContainerNode dataContainerNode,
                                                  ContainerNode dataSubDirContainerNode) {
        // verify the DOI containerNode properties
        Assert.assertTrue("incorrect isPublic property", doiContainerNode.isPublic != null && doiContainerNode.isPublic);
        Assert.assertTrue("should not have group read", doiContainerNode.getReadWriteGroup().isEmpty());
        Assert.assertTrue("should not have group write", doiContainerNode.getReadWriteGroup().isEmpty());

        verifyDataDirNodeProperties(dataContainerNode, dataSubDirContainerNode);
    }

}
