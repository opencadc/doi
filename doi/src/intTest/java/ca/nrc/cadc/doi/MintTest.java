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
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpGet;
import ca.nrc.cadc.util.Log4jInit;
import ca.nrc.cadc.uws.ExecutionPhase;
import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.PrivilegedExceptionAction;
import java.util.concurrent.TimeUnit;
import javax.security.auth.Subject;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.DataNode;
import org.opencadc.vospace.VOS;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.ClientAbortThread;
import org.opencadc.vospace.client.async.RecursiveSetNode;

/**
 */
public class MintTest extends IntTestBase {

    private static final Logger log = Logger.getLogger(MintTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    private ContainerNode doiParentNode;

    // test minting DOI instance
    @Test
    public void testMintingDocument() throws Throwable {
        final Resource testResource = getTestResource(false, true, true);
        final String testXML = getResourceXML(testResource);
        Subject.doAs(
            readWriteSubject,
            (PrivilegedExceptionAction<Object>) () -> {
                // Create the test DOI document in VOSpace
                String persistedXML = postDOI(
                    doiServiceURL,
                    testXML,
                    TEST_JOURNAL_REF
                );
                DoiXmlReader reader = new DoiXmlReader();
                Resource presistedResource = reader.read(persistedXML);
                String expectedIdentifier = presistedResource
                    .getIdentifier()
                    .getValue();
                Assert.assertNotEquals(
                    "New identifier not received from doi service.",
                    testResource.getIdentifier().getValue(),
                    expectedIdentifier
                );

                // Pull the suffix from the identifier
                String doiSuffix = expectedIdentifier.split("/")[1];

                try {
                    // For DOI tests below
                    URL doiURL = new URL(
                        String.format(
                            "%s/%s",
                            TestUtil.DOI_PARENT_PATH,
                            doiSuffix
                        )
                    );

                    // Verify that the DOI document was created successfully
                    DoiStatus doiStatus = getStatus(doiURL);
                    Assert.assertEquals(
                        "identifier from DOI status is different",
                        expectedIdentifier,
                        doiStatus.getIdentifier().getValue()
                    );
                    Assert.assertEquals(
                        "status is incorrect",
                        Status.DRAFT,
                        doiStatus.getStatus()
                    );
                    Assert.assertEquals(
                        "journalRef is incorrect",
                        TEST_JOURNAL_REF,
                        doiStatus.journalRef
                    );

                    // verify the DOI containerNode properties
                    ContainerNode doiContainerNode = getContainerNode(
                        doiSuffix
                    );
                    Assert.assertFalse(
                        "incorrect isPublic property",
                        doiContainerNode.isPublic != null &&
                        doiContainerNode.isPublic
                    );
                    Assert.assertFalse(
                        "should have group read property",
                        doiContainerNode.getReadOnlyGroup().isEmpty()
                    );
                    ContainerNode dataContainerNode = getContainerNode(
                        doiSuffix + "/data"
                    );
                    Assert.assertFalse(
                        "should have group write",
                        dataContainerNode.getReadWriteGroup().isEmpty()
                    );

                    // add a file and a subdirectory with a file to the data directory
                    String testFile1 = "test-file-1.txt";
                    String testFile1Path = String.format(
                        "%s/%s/data/%s",
                        TestUtil.DOI_PARENT_PATH,
                        doiSuffix,
                        testFile1
                    );
                    DataNode testFileNode = createDataNode(
                        testFile1Path,
                        testFile1
                    );

                    String subDir = "subDir";
                    String subDirPath = String.format(
                        "%s/%s/data/%s",
                        TestUtil.DOI_PARENT_PATH,
                        doiSuffix,
                        subDir
                    );
                    ContainerNode dataSubDirContainerNode = createContainerNode(
                        subDirPath,
                        subDir
                    );

                    String testFile2 = "test-file-2.txt";
                    String testFile2Path = String.format(
                        "%s/%s/data/%s/%s",
                        TestUtil.DOI_PARENT_PATH,
                        doiSuffix,
                        subDir,
                        testFile2
                    );
                    DataNode testFile2Node = createDataNode(
                        testFile2Path,
                        testFile2
                    );

                    // mint the document, DRAFT ==> LOCKING_DATA
                    doMintTest(doiURL, persistedXML, expectedIdentifier, null);
                    doiContainerNode = getContainerNode(doiSuffix);
                    dataContainerNode = getContainerNode(doiSuffix + "/data");
                    dataSubDirContainerNode = getContainerNode(
                        doiSuffix + "/data/" + subDir
                    );
                    Assert.assertEquals(
                        "incorrect status",
                        Status.LOCKING_DATA.getValue(),
                        doiContainerNode.getPropertyValue(
                            DoiAction.DOI_VOS_STATUS_PROP
                        )
                    );
                    verifyNodeProperties(
                        doiContainerNode,
                        dataContainerNode,
                        dataSubDirContainerNode
                    );

                    // mint the document, ERROR_LOCKING_DATA ==> LOCKING_DATA
                    doiContainerNode
                        .getProperty(DoiAction.DOI_VOS_STATUS_PROP)
                        .setValue(Status.ERROR_LOCKING_DATA.getValue());
                    VOSURI vosuri = getVOSURI(doiContainerNode.getName());
                    vosClient.setNode(vosuri, doiContainerNode);
                    doMintTest(doiURL, persistedXML, expectedIdentifier, null);
                    doiContainerNode = getContainerNode(doiSuffix);
                    dataContainerNode = getContainerNode(doiSuffix + "/data");
                    dataSubDirContainerNode = getContainerNode(
                        doiSuffix + "/data/" + subDir
                    );
                    Assert.assertEquals(
                        "incorrect status",
                        Status.LOCKING_DATA.getValue(),
                        doiContainerNode.getPropertyValue(
                            DoiAction.DOI_VOS_STATUS_PROP
                        )
                    );
                    verifyNodeProperties(
                        doiContainerNode,
                        dataContainerNode,
                        dataSubDirContainerNode
                    );

                    // getStatus() changes LOCKING_DATA == > LOCKED_DATA
                    doiStatus = getStatus(doiURL);
                    Assert.assertEquals(
                        "identifier from DOI status is different",
                        expectedIdentifier,
                        doiStatus.getIdentifier().getValue()
                    );
                    Assert.assertEquals(
                        "status is incorrect",
                        Status.LOCKED_DATA,
                        doiStatus.getStatus()
                    );
                    verifyLockedDataPropertyChanges(
                        doiContainerNode,
                        dataContainerNode,
                        dataSubDirContainerNode
                    );

                    // mint the document, LOCKED_DATA == REGISTERING
                    doMintTest(doiURL, persistedXML, expectedIdentifier, null);
                    doiContainerNode = getContainerNode(doiSuffix);
                    dataContainerNode = getContainerNode(doiSuffix + "/data");
                    dataSubDirContainerNode = getContainerNode(
                        doiSuffix + "/data/" + subDir
                    );
                    Assert.assertEquals(
                        "incorrect status",
                        Status.MINTED.getValue(),
                        doiContainerNode.getPropertyValue(
                            DoiAction.DOI_VOS_STATUS_PROP
                        )
                    );
                    verifyMintedStatePropertyChanges(
                        doiContainerNode,
                        dataContainerNode,
                        dataSubDirContainerNode
                    );

                    // mint the document, ERROR_REGISTERING ==> REGISTERING
                    // the doiContainerNode doesn't have group read & write anymore, and is owned
                    // by doiadmin, so changes to it must be done with that cert.
                    doiContainerNode
                        .getProperty(DoiAction.DOI_VOS_STATUS_PROP)
                        .setValue(Status.ERROR_REGISTERING.getValue());
                    doiParentNode = doiContainerNode;
                    Subject.doAs(
                        adminSubject,
                        (PrivilegedExceptionAction<Object>) () -> {
                            VOSURI parentVOSURI = getVOSURI(
                                doiParentNode.getName()
                            );
                            vosClient.setNode(parentVOSURI, doiParentNode);
                            return null;
                        }
                    );

                    doMintTest(doiURL, persistedXML, expectedIdentifier, null);
                    doiContainerNode = getContainerNode(doiSuffix);
                    dataContainerNode = getContainerNode(doiSuffix + "/data");
                    dataSubDirContainerNode = getContainerNode(
                        doiSuffix + "/data/" + subDir
                    );
                    Assert.assertEquals(
                        "incorrect status",
                        Status.MINTED.getValue(),
                        doiContainerNode.getPropertyValue(
                            DoiAction.DOI_VOS_STATUS_PROP
                        )
                    );
                    verifyMintedStatePropertyChanges(
                        doiContainerNode,
                        dataContainerNode,
                        dataSubDirContainerNode
                    );

                    // getStatus() changes REGISTERING == > MINTED
                    doiStatus = getStatus(doiURL);
                    Assert.assertEquals(
                        "identifier from DOI status is different",
                        expectedIdentifier,
                        doiStatus.getIdentifier().getValue()
                    );
                    Assert.assertEquals(
                        "status is incorrect",
                        Status.MINTED,
                        doiStatus.getStatus()
                    );

                    // verify the DOI containerNode properties
                    Assert.assertEquals(
                        "incorrect status",
                        Status.MINTED.getValue(),
                        doiContainerNode.getPropertyValue(
                            DoiAction.DOI_VOS_STATUS_PROP
                        )
                    );
                } catch (Throwable e) {
                    log.error("unexpected exception", e);
                    Assert.fail("unexpected exception: " + e);
                } finally {
                    // cannot delete a DOI when it is in 'MINTED' state, change its state to 'DRAFT'
                    // node owner is doiadmin, and after minting the group permissions are removed, so
                    // cleanup needs to be done as doiadmin, not the test subject

                    Subject.doAs(
                        adminSubject,
                        (PrivilegedExceptionAction<Object>) () -> {
                            ContainerNode doiContainerNode = getContainerNode(
                                doiSuffix
                            );
                            VOSURI vosuri = getVOSURI(
                                doiContainerNode.getName()
                            );
                            doiContainerNode
                                .getProperty(DoiAction.DOI_VOS_STATUS_PROP)
                                .setValue(Status.DRAFT.getValue());
                            vosClient.setNode(vosuri, doiContainerNode);

                            // unlock the data directory and delete the DOI
                            ContainerNode dataContainerNode = getContainerNode(
                                doiSuffix + "/data"
                            );
                            if (
                                dataContainerNode.isLocked != null &&
                                dataContainerNode.isLocked
                            ) {
                                dataContainerNode.getNodes().clear();
                                setDataNodeRecursively(doiSuffix);
                            }

                            cleanup(doiSuffix);
                            return null;
                        }
                    );
                }
                return presistedResource;
            }
        );
    }

    private DoiStatus getStatus(URL doiURL) throws Exception {
        URL statusURL = new URL(doiURL + "/" + DoiAction.STATUS_ACTION);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        HttpGet get = new HttpGet(statusURL, bos);
        get.prepare();
        Assert.assertNull("GET exception", get.getThrowable());
        DoiStatusXmlReader reader = new DoiStatusXmlReader();
        return reader.read(
            new StringReader(bos.toString(StandardCharsets.UTF_8))
        );
    }

    private void doMintTest(
        URL doiURL,
        String doiXML,
        String expectedIdentifier,
        String journalRef
    ) throws Exception {
        URL mintURL = new URL(doiURL + "/" + DoiAction.MINT_ACTION);
        postDOI(mintURL, doiXML, journalRef);
    }

    private void verifyDataDirNodeProperties(
        ContainerNode dataContainerNode,
        ContainerNode dataSubDirContainerNode
    ) {
        // verify the DOI data containerNode properties
        Assert.assertTrue(
            "should be public",
            dataContainerNode.isPublic != null && dataContainerNode.isPublic
        );
        Assert.assertTrue(
            "should not have group read",
            dataContainerNode.getReadOnlyGroup().isEmpty()
        );
        Assert.assertTrue(
            "should not have group write",
            dataContainerNode.getReadWriteGroup().isEmpty()
        );
        Assert.assertTrue(
            "incorrect lock property",
            dataContainerNode.isLocked != null && dataContainerNode.isLocked
        );

        // verify the DOI data subDir containerNode properties
        Assert.assertTrue(
            "should be public",
            dataSubDirContainerNode.isPublic != null &&
            dataSubDirContainerNode.isPublic
        );
        Assert.assertTrue(
            "should not have group read",
            dataSubDirContainerNode.getReadOnlyGroup().isEmpty()
        );
        Assert.assertTrue(
            "should not have group write",
            dataSubDirContainerNode.getReadWriteGroup().isEmpty()
        );
        Assert.assertTrue(
            "incorrect lock property",
            dataSubDirContainerNode.isLocked != null &&
            dataSubDirContainerNode.isLocked
        );
    }

    private void verifyNodeProperties(
        ContainerNode doiContainerNode,
        ContainerNode dataContainerNode,
        ContainerNode dataSubDirContainerNode
    ) {
        // verify the DOI containerNode properties
        Assert.assertEquals(
            "incorrect runId property",
            "TEST",
            doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_RUNID)
        );
        Assert.assertFalse(
            "incorrect isPublic property",
            doiContainerNode.isPublic != null && doiContainerNode.isPublic
        );
        Assert.assertFalse(
            "should have group read",
            doiContainerNode.getReadWriteGroup().isEmpty()
        );
        Assert.assertFalse(
            "should have group write",
            doiContainerNode.getReadWriteGroup().isEmpty()
        );
        Assert.assertFalse(
            "incorrect lock property",
            doiContainerNode.isLocked != null && doiContainerNode.isLocked
        );

        verifyDataDirNodeProperties(dataContainerNode, dataSubDirContainerNode);
    }

    private void verifyLockedDataPropertyChanges(
        ContainerNode doiContainerNode,
        ContainerNode dataContainerNode,
        ContainerNode dataSubDirContainerNode
    ) {
        // verify the DOI containerNode properties
        Assert.assertEquals(
            "incorrect runId property",
            "TEST",
            doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_RUNID)
        );
        Assert.assertFalse(
            "incorrect isPublic property",
            doiContainerNode.isPublic != null && doiContainerNode.isPublic
        );
        Assert.assertFalse(
            "should have group read",
            doiContainerNode.getReadWriteGroup().isEmpty()
        );
        Assert.assertFalse(
            "should have group write",
            doiContainerNode.getReadWriteGroup().isEmpty()
        );
        Assert.assertFalse(
            "incorrect lock property",
            doiContainerNode.isLocked != null && doiContainerNode.isLocked
        );

        verifyDataDirNodeProperties(dataContainerNode, dataSubDirContainerNode);
    }

    private void verifyMintedStatePropertyChanges(
        ContainerNode doiContainerNode,
        ContainerNode dataContainerNode,
        ContainerNode dataSubDirContainerNode
    ) {
        // verify the DOI containerNode properties
        Assert.assertEquals(
            "incorrect runId property",
            "TEST",
            doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_RUNID)
        );
        Assert.assertTrue(
            "incorrect isPublic property",
            doiContainerNode.isPublic != null && doiContainerNode.isPublic
        );
        Assert.assertTrue(
            "should not have group read",
            doiContainerNode.getReadWriteGroup().isEmpty()
        );
        Assert.assertTrue(
            "should not have group write",
            doiContainerNode.getReadWriteGroup().isEmpty()
        );

        verifyDataDirNodeProperties(dataContainerNode, dataSubDirContainerNode);
    }

    private ContainerNode createContainerNode(String path, String name)
        throws Exception {
        ContainerNode node = new ContainerNode(name);
        VOSURI nodeURI = getVOSURI(path);
        return (ContainerNode) vosClient.createNode(nodeURI, node);
    }

    private DataNode createDataNode(String path, String name) throws Exception {
        DataNode node = new DataNode(name);
        VOSURI nodeURI = getVOSURI(path);
        return (DataNode) vosClient.createNode(nodeURI, node);
    }

    private void setDataNodeRecursively(String doiSuffix) throws Exception {
        Subject.doAs(
            adminSubject,
            (PrivilegedExceptionAction<Object>) () -> {
                VOSURI vosuri = getVOSURI(String.format("%s/data", doiSuffix));
                ContainerNode dataContainerNode = new ContainerNode("data");
                RecursiveSetNode recursiveSetNode =
                    vosClient.createRecursiveSetNode(vosuri, dataContainerNode);
                URL jobURL = recursiveSetNode.getJobURL();

                // this is an async operation
                Thread abortThread = new ClientAbortThread(jobURL);
                Runtime.getRuntime().addShutdownHook(abortThread);
                recursiveSetNode.setMonitor(true);
                recursiveSetNode.run();
                Runtime.getRuntime().removeShutdownHook(abortThread);

                recursiveSetNode = new RecursiveSetNode(
                    jobURL,
                    dataContainerNode
                );
                recursiveSetNode.setSchemaValidation(false);
                ExecutionPhase phase = recursiveSetNode.getPhase(20);
                while (
                    phase == ExecutionPhase.QUEUED ||
                    phase == ExecutionPhase.EXECUTING
                ) {
                    TimeUnit.SECONDS.sleep(1);
                    phase = recursiveSetNode.getPhase();
                }

                Assert.assertSame(
                    "Failed to unlock test data directory, phase = " + phase,
                    ExecutionPhase.COMPLETED,
                    phase
                );
                return phase.getValue();
            }
        );
    }
}
