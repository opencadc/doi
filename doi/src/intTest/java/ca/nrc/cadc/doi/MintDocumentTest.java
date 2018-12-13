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

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.PrivilegedExceptionAction;
import java.util.concurrent.TimeUnit;

import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.DoiParsingException;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpDownload;
import ca.nrc.cadc.util.Log4jInit;
import ca.nrc.cadc.util.StringUtil;
import ca.nrc.cadc.uws.ExecutionPhase;
import ca.nrc.cadc.vos.ContainerNode;
import ca.nrc.cadc.vos.VOS;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.ClientAbortThread;
import ca.nrc.cadc.vos.client.ClientRecursiveSetNode;

/**
 */
public class MintDocumentTest extends DocumentTest {
    private static final Logger log = Logger.getLogger(MintDocumentTest.class);
    
    final Subject testSubject = SSLUtil.createSubject(CADCAUTHTEST_CERT);

    static final String JSON = "application/json";

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    public MintDocumentTest() {
    }

    private DoiStatus getStatus(URL docURL)
            throws DoiParsingException, IOException {
        URL statusURL = new URL(docURL + "/" + DoiAction.STATUS_ACTION);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        HttpDownload getStatus = new HttpDownload(statusURL, baos);
        getStatus.run();
        Assert.assertNull("GET " + statusURL.toString() + " in XML failed. ", getStatus.getThrowable());
        DoiStatusXmlReader statusReader = new DoiStatusXmlReader();
        return statusReader.read(new StringReader(new String(baos.toByteArray(), "UTF-8")));
    }

    private void executeMintTest(URL docURL, String document, String expectedIdentifier, String journalRef) 
        throws DoiParsingException, IOException {
        URL mintURL = new URL(docURL + "/" + DoiAction.MINT_ACTION);
        postDocument(mintURL, document, journalRef);
    }

    private void verifyNodeProperties(ContainerNode doiContainerNode, ContainerNode dataContainerNode,
    		ContainerNode dataSubDirContainerNode, ContainerNode dataSubSubDirContainerNode) throws Exception {
        // verify the DOI containerNode properties
        Assert.assertEquals("incorrect runId property", "TEST", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_RUNID));
        Assert.assertEquals("incorrect isPublic property", "false", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISPUBLIC));
        Assert.assertNotNull("should have group read", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD));
        Assert.assertNotNull("should have group write", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE));
        Assert.assertNull("incorrect lock property", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISLOCKED));
        
        // verify the DOI data containerNode properties
        Assert.assertTrue("should be public", dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISPUBLIC).equals("true"));
        Assert.assertNull("should not have group read", dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD));
        Assert.assertNull("should not have group write", dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE));
        Assert.assertEquals("incorrect lock property", "true", dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISLOCKED));
       
        // verify the DOI data subDir containerNode properties
        Assert.assertTrue("should be public", dataSubDirContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISPUBLIC).equals("true"));
        Assert.assertNull("should not have group read", dataSubDirContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD));
        Assert.assertNull("should not have group write", dataSubDirContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE));
        Assert.assertEquals("incorrect lock property", "true", dataSubDirContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISLOCKED));
        
        // verify the DOI data subSubDir containerNode properties
        Assert.assertTrue("should be public", dataSubSubDirContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISPUBLIC).equals("true"));
        Assert.assertNull("should not have group read", dataSubSubDirContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD));
        Assert.assertNull("should not have group write", dataSubSubDirContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE));
        Assert.assertEquals("incorrect lock property", "true", dataSubSubDirContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISLOCKED));
    }
    
    private ContainerNode createDataDirectory(String dir) throws URISyntaxException {
        VOSURI dataDir = new VOSURI(new URI(DoiAction.DOI_BASE_VOSPACE + "/" + dir));
        ContainerNode newDataFolder = new ContainerNode(dataDir);
        return (ContainerNode) vosClient.createNode(newDataFolder);
    }
    
    private void setDataNodeRecursively(final ContainerNode dataContainerNode) throws Exception {
        File pemFile = new File(System.getProperty("user.home") + "/.ssl/doiadmin.pem");
        Subject doiadminSubject = SSLUtil.createSubject(pemFile);
        Subject.doAs(doiadminSubject, new PrivilegedExceptionAction<Object>() {
            @Override
            public String run() throws Exception {
                ClientRecursiveSetNode recSetNode = vosClient.setNodeRecursive(dataContainerNode);
                URL jobURL = recSetNode.getJobURL();

                // this is an async operation
                Thread abortThread = new ClientAbortThread(jobURL);
                Runtime.getRuntime().addShutdownHook(abortThread);
                recSetNode.setMonitor(true);
                recSetNode.run();
                Runtime.getRuntime().removeShutdownHook(abortThread);
                
        		recSetNode = new ClientRecursiveSetNode(jobURL, dataContainerNode, false);
        		ExecutionPhase phase = recSetNode.getPhase();
                while (phase == ExecutionPhase.QUEUED || phase == ExecutionPhase.EXECUTING) {
                	TimeUnit.SECONDS.sleep(1);
            		phase = recSetNode.getPhase();
                }

        		Assert.assertTrue("Failed to unlock test data directory, phase = " + phase, ExecutionPhase.COMPLETED == phase);
        		return phase.getValue();
            }
        });
    }
    
    // test minting DOI instance 
    @Test
    public void testMintingDocument() throws Throwable {
        this.buildInitialDocument();
        Subject.doAs(testSubject, new PrivilegedExceptionAction<Object>() {

            public Object run() throws Exception {
                // post the job to create a document
                URL postUrl = new URL(baseURL);

                log.debug("baseURL: " + baseURL);
                log.debug("posting to: " + postUrl);

                // Create the test DOI document in VOSpace
                String returnedDoc = postDocument(postUrl, initialDocument, TEST_JOURNAL_REF);
                Resource resource = xmlReader.read(returnedDoc);
                String expectedIdentifier = resource.getIdentifier().getText();
                Assert.assertFalse("New identifier not received from doi service.",
                        initialResource.getIdentifier().getText().equals(expectedIdentifier));

                // Pull the suffix from the identifier
                String[] doiNumberParts = expectedIdentifier.split("/");

                try {
                    // For DOI tests below
                    URL docURL = new URL(baseURL + "/" + doiNumberParts[1]);

                    // Verify that the DOI document was created successfully
                    DoiStatus doiStatus = getStatus(docURL);
                    Assert.assertEquals("identifier from DOI status is different", expectedIdentifier,
                            doiStatus.getIdentifier().getText());
                    Assert.assertEquals("status is incorrect", Status.DRAFT, doiStatus.getStatus());
                    Assert.assertEquals("journalRef is incorrect", TEST_JOURNAL_REF, doiStatus.journalRef);
                    
                    // verify the DOI containerNode properties
                    ContainerNode doiContainerNode = getContainerNode(doiNumberParts[1]);
                    Assert.assertEquals("incorrect isPublic property", "false", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISPUBLIC));
                    Assert.assertNotNull("should have group read property", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD));
                    ContainerNode dataContainerNode = getContainerNode(doiNumberParts[1] + "/data");
                    Assert.assertNotNull("should have group write", dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE));

                    // create subdirectories under the data directory
                    String subDir = doiNumberParts[1] + "/data/subDir";
                    ContainerNode dataSubDirContainerNode = createDataDirectory(subDir);
                    String subSubDir = subDir + "/subsubDir";
                    ContainerNode dataSubSubDirContainerNode = createDataDirectory(subSubDir);
                    
                    // mint the document, DRAFT ==> LOCKING_DATA
                    executeMintTest(docURL, returnedDoc, expectedIdentifier, null);
                    doiContainerNode = getContainerNode(doiNumberParts[1]);
                    dataContainerNode = getContainerNode(doiNumberParts[1] + "/data");
                    dataSubDirContainerNode = getContainerNode(subDir);
                    dataSubSubDirContainerNode = getContainerNode(subSubDir);
                    Assert.assertEquals("incorrect status", Status.LOCKING_DATA.getValue(), doiContainerNode.getPropertyValue(DoiAction.DOI_VOS_STATUS_PROP));
                    verifyNodeProperties(doiContainerNode, dataContainerNode, dataSubDirContainerNode, dataSubSubDirContainerNode);
                    
                    // mint the document, ERROR_LOCKING_DATA ==> LOCKING_DATA
                    doiContainerNode.findProperty(DoiAction.DOI_VOS_STATUS_PROP).setValue(Status.ERROR_LOCKING_DATA.getValue());
                    vosClient.setNode(doiContainerNode);
                    executeMintTest(docURL, returnedDoc, expectedIdentifier, null);
                    doiContainerNode = getContainerNode(doiNumberParts[1]);
                    dataContainerNode = getContainerNode(doiNumberParts[1] + "/data");
                    dataSubDirContainerNode = getContainerNode(subDir);
                    dataSubSubDirContainerNode = getContainerNode(subSubDir);
                    Assert.assertEquals("incorrect status", Status.LOCKING_DATA.getValue(), doiContainerNode.getPropertyValue(DoiAction.DOI_VOS_STATUS_PROP));
                    verifyNodeProperties(doiContainerNode, dataContainerNode, dataSubDirContainerNode, dataSubSubDirContainerNode);

                    // getStatus() changes LOCKING_DATA == > LOCKED_DATA
                    doiStatus = getStatus(docURL);
                    Assert.assertEquals("identifier from DOI status is different", expectedIdentifier, doiStatus.getIdentifier().getText());
                    Assert.assertEquals("status is incorrect", Status.LOCKED_DATA, doiStatus.getStatus());

                    // mint the document, LOCKED_DATA == REGISTERING 
                    executeMintTest(docURL, returnedDoc, expectedIdentifier, null);
                    doiContainerNode = getContainerNode(doiNumberParts[1]);
                    dataContainerNode = getContainerNode(doiNumberParts[1] + "/data");
                    dataSubDirContainerNode = getContainerNode(subDir);
                    dataSubSubDirContainerNode = getContainerNode(subSubDir);
                    Assert.assertEquals("incorrect status", Status.MINTED.getValue(), doiContainerNode.getPropertyValue(DoiAction.DOI_VOS_STATUS_PROP));
                    verifyNodeProperties(doiContainerNode, dataContainerNode, dataSubDirContainerNode, dataSubSubDirContainerNode);

                    // mint the document, ERROR_REGISTERING ==> REGISTERING
                    doiContainerNode.findProperty(DoiAction.DOI_VOS_STATUS_PROP).setValue(Status.ERROR_REGISTERING.getValue());
                    vosClient.setNode(doiContainerNode);
                    executeMintTest(docURL, returnedDoc, expectedIdentifier, null);
                    doiContainerNode = getContainerNode(doiNumberParts[1]);
                    dataContainerNode = getContainerNode(doiNumberParts[1] + "/data");
                    dataSubDirContainerNode = getContainerNode(subDir);
                    dataSubSubDirContainerNode = getContainerNode(subSubDir);
                    Assert.assertEquals("incorrect status", Status.MINTED.getValue(), doiContainerNode.getPropertyValue(DoiAction.DOI_VOS_STATUS_PROP));
                    verifyNodeProperties(doiContainerNode, dataContainerNode, dataSubDirContainerNode, dataSubSubDirContainerNode);

                    // getStatus() changes REGISTERING == > MINTED
                    doiStatus = getStatus(docURL);
                    Assert.assertEquals("identifier from DOI status is different", expectedIdentifier, doiStatus.getIdentifier().getText());
                    Assert.assertEquals("status is incorrect", Status.MINTED, doiStatus.getStatus());

                    // verify the DOI containerNode properties
                    Assert.assertEquals("incorrect status", Status.MINTED.getValue(), doiContainerNode.getPropertyValue(DoiAction.DOI_VOS_STATUS_PROP));
                } finally {
                    // cannot delete a DOI when it is in 'MINTED' state, change its state to 'DRAFT'
                    ContainerNode doiContainerNode = getContainerNode(doiNumberParts[1]);
                    doiContainerNode.findProperty(DoiAction.DOI_VOS_STATUS_PROP).setValue(Status.DRAFT.getValue());
                    vosClient.setNode(doiContainerNode);
                    
                    // unlock the data directory and delete the DOI
                    ContainerNode dataContainerNode = getContainerNode(doiNumberParts[1] + "/data");
                    String isLocked = dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISLOCKED);
                    if (StringUtil.hasText(isLocked)) {
	                    dataContainerNode.findProperty(VOS.PROPERTY_URI_ISLOCKED).setMarkedForDeletion(true);                    
	                    setDataNodeRecursively(dataContainerNode);
                    }
                    deleteTestFolder(vosClient, doiNumberParts[1]);
                }
                return resource;
            }
        });
    }

}