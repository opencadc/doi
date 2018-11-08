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
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.PrivilegedExceptionAction;
import java.util.ArrayList;
import java.util.List;

import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.Description;
import ca.nrc.cadc.doi.datacite.DescriptionType;
import ca.nrc.cadc.doi.datacite.DoiParsingException;
import ca.nrc.cadc.doi.datacite.DoiXmlReader;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpDownload;
import ca.nrc.cadc.util.Log4jInit;
import ca.nrc.cadc.util.StringUtil;
import ca.nrc.cadc.vos.ContainerNode;
import ca.nrc.cadc.vos.NodeNotFoundException;
import ca.nrc.cadc.vos.VOS;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.VOSpaceClient;

/**
 */
public class MintDocumentTest extends DocumentTest {
    private static final Logger log = Logger.getLogger(MintDocumentTest.class);
    
    protected static final String DOI_BASE_FILEPATH = "/AstroDataCitationDOI/CISTI.CANFAR";
    protected static final String DOI_BASE_VOSPACE = "vos://cadc.nrc.ca!vospace" + DOI_BASE_FILEPATH;
    protected static final String DOI_VOS_STATUS_PROP = "ivo://cadc.nrc.ca/vospace/doi#status";
    
    static final String JSON = "application/json";

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    public MintDocumentTest() {
    }

    // test minting DOI instance
    //@Test
    public void testMintingDocumentWithNoUpdates() throws Throwable {
        final Subject s = SSLUtil.createSubject(CADCAUTHTEST_CERT);

        final VOSURI baseDataURI = new VOSURI(URI.create(DOI_BASE_VOSPACE));
        final VOSpaceClient vosClient = new VOSpaceClient(baseDataURI.getServiceURI());
        
        this.buildInitialDocument();
        Subject.doAs(s, new PrivilegedExceptionAction<Object>() {

            private DoiStatus getStatus(URL docURL)
                    throws UnsupportedEncodingException, DoiParsingException, IOException {
                URL statusURL = new URL(docURL + "/status");
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                HttpDownload getStatus = new HttpDownload(statusURL, baos);
                getStatus.run();
                Assert.assertNull("GET " + statusURL.toString() + " in XML failed. ", getStatus.getThrowable());
                DoiStatusXmlReader statusReader = new DoiStatusXmlReader();
                return statusReader.read(new StringReader(new String(baos.toByteArray(), "UTF-8")));
            }

            private Resource executeMintTest(URL docURL, String document, String expectedIdentifier, String journalRef) 
                throws DoiParsingException, UnsupportedEncodingException, IOException {
                String mDoc = mintDocument(docURL, document, journalRef);
                Resource mResource = xmlReader.read(mDoc);
                
                // verify the DOI status to be "minting"
                DoiStatus doiStatus = getStatus(docURL);
                Assert.assertEquals("identifier from DOI status is different", expectedIdentifier,
                        doiStatus.getIdentifier().getText());
                Assert.assertEquals("status is incorrect", Status.MINTING, doiStatus.getStatus());
                return mResource;
            }

            private Resource getTemplateResource() {
                Resource templateResource = null;
                String templateFilename = null;

                try {
                    templateFilename = "src/main/resources/" + PostAction.DOI_TEMPLATE_RESOURCE_41;
                    InputStream inputStream = new FileInputStream(templateFilename);
                    // read xml file
                    DoiXmlReader reader = new DoiXmlReader(true);
                    templateResource = reader.read(inputStream);
                } catch (IOException fne) {
                    throw new RuntimeException("failed to load " + templateFilename);
                } catch (DoiParsingException dpe) {
                    throw new RuntimeException("Structure of template file " + templateFilename + " failed validation");
                }

                return templateResource;
            }

            private Resource addDescription(Resource inProgressDoi, String journalRef) {
                // Generate the description string
                // Get first author's last name
                String lastName = inProgressDoi.getCreators().get(0).familyName;
                if (lastName == null) {
                    // Use full name in a pinch
                    lastName = inProgressDoi.getCreators().get(0).getCreatorName().getText();
                }

                String description =  String.format(PostAction.DESCRIPTION_TEMPLATE, inProgressDoi.getTitles().get(0).getText(), lastName, journalRef);
                List<Description> descriptionList = new ArrayList<Description>();
                Description newDescrip = new Description(inProgressDoi.language, description, DescriptionType.OTHER);
                descriptionList.add(newDescrip);
                inProgressDoi.descriptions = descriptionList;

                return inProgressDoi;
            }
            
            /**
             * Add the CADC template material to the DOI during the minting step
             */
            private Resource addFinalElements(Resource inProgressDoi, String journalRef) {

                // Build a resource using the template file
                Resource cadcTemplate = getTemplateResource();

                // Whitelist handling of fields users are allowed to provide information for.

                if (cadcTemplate.contributors == null) {
                    throw new RuntimeException("contributors stanza missing from CADC template.");
                } else {
                    inProgressDoi.contributors = cadcTemplate.contributors;
                }

                if (cadcTemplate.rightsList != null) {
                    throw new RuntimeException("rightslist stanza missing from CADC template.");
                } else {
                    inProgressDoi.rightsList = cadcTemplate.rightsList;
                }

                // Generate the description string
                if (journalRef != null) {
                    inProgressDoi = addDescription(inProgressDoi, journalRef);
                }

                return inProgressDoi;
            }

            private ContainerNode getContainerNode(String path) throws URISyntaxException, NodeNotFoundException {
                String nodePath = baseDataURI.getPath();
                if (StringUtil.hasText(path)) {
                    nodePath = nodePath + "/" + path;
                }

                return (ContainerNode) vosClient.getNode(nodePath);
            }

            public Object run() throws Exception {
                // post the job to create a document
                URL postUrl = new URL(baseURL);

                log.debug("baseURL: " + baseURL);
                log.debug("posting to: " + postUrl);

                // Create the test DOI document in VOSpace
                String returnedDoc = updateDocument(postUrl, initialDocument, TEST_JOURNAL_REF);
                Resource resource = xmlReader.read(returnedDoc);
                String returnedIdentifier = resource.getIdentifier().getText();
                Assert.assertFalse("New identifier not received from doi service.",
                        initialResource.getIdentifier().getText().equals(returnedIdentifier));

                // Pull the suffix from the identifier
                String[] doiNumberParts = returnedIdentifier.split("/");

                try {
                    // build a resource containing the CADC final elements
                    Resource resourceFromTemplate = getTemplateResource();
                    
                    // For DOI tests below
                    URL docURL = new URL(baseURL + "/" + doiNumberParts[1]);

                    // Verify that the DOI document was created successfully
                    DoiStatus doiStatus = getStatus(docURL);
                    Assert.assertEquals("identifier from DOI status is different", returnedIdentifier,
                            doiStatus.getIdentifier().getText());
                    Assert.assertEquals("status is incorrect", Status.DRAFT, doiStatus.getStatus());
                    Assert.assertEquals("journalRef is incorrect", TEST_JOURNAL_REF, doiStatus.journalRef);

                    // mint the document with no changes
                    Resource resourceFromMinting = executeMintTest(docURL, null, returnedIdentifier, null);
                    
                    // construct the expected resource
                    Resource expectedResource = addFinalElements(resource, TEST_JOURNAL_REF);
                    
                    // verify the resource returned from the mint process
                    compareResource(expectedResource, resourceFromMinting);
                    
                    // verify the DOI containerNode properties
                    ContainerNode doiContainerNode = getContainerNode(doiNumberParts[0]);
                    Assert.assertEquals("incorrect status", doiContainerNode.getPropertyValue(DOI_VOS_STATUS_PROP), Status.MINTING.getValue());
                    Assert.assertEquals("incorrect isPublic property", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISPUBLIC), "true");
                    Assert.assertNull("incorrect status", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD));
                    Assert.assertNull("incorrect status", doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE));
                } finally {
                    // delete containing folder using doiadmin credentials
                    deleteTestFolder(doiNumberParts[1]);
                }
                return resource;
            }
        });
    }
}