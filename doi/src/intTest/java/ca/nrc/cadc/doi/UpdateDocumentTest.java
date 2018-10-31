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
import java.io.IOException;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
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
import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.CreatorName;
import ca.nrc.cadc.doi.datacite.DoiParsingException;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;
import ca.nrc.cadc.doi.datacite.NameIdentifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpDownload;
import ca.nrc.cadc.util.Log4jInit;

/**
 */
public class UpdateDocumentTest extends DocumentTest
{
    private static final Logger log = Logger.getLogger(UpdateDocumentTest.class);

    static final String JSON = "application/json";

    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    public UpdateDocumentTest() { };
    
    // test update DOI instance happy path
    @Test
    public void testUpdateDocument() throws Throwable
    {
        final Subject s = SSLUtil.createSubject(CADCAUTHTEST_CERT);

        this.buildInitialDocument();
        Subject.doAs(s, new PrivilegedExceptionAction<Object>()
        {
            private void compareNull(Object o1, Object o2, String field)
            {
                if (o1 == null)
                {
                    Assert.assertNull("one " + field + " is not null", o2);
                } 
                else
                {
                    Assert.assertNotNull("one " + field + " is null", o2);
                }
            }
            
            private void compareCreatorName(CreatorName cn1, CreatorName cn2)
            {
                Assert.assertEquals("creatorName is different", cn1.getText(), cn2.getText());
                Assert.assertEquals("nameType is different", cn1.nameType, cn2.nameType);
            }
            
            private void compareNameIdentifier(NameIdentifier id1, NameIdentifier id2)
            {
                Assert.assertEquals("nameIdentifierScheme is different", id1.getNameIdentifierScheme(), id2.getNameIdentifierScheme());
                Assert.assertEquals("nameIdentifier is different", id1.getNameIdentifier(), id2.getNameIdentifier());
                compareNull(id1.schemeURI, id2.schemeURI, "schemeURI");
                if (id1.schemeURI != null)
                {
                    Assert.assertTrue("schemeURI is different", id1.schemeURI.equals(id2.schemeURI));
                }
            }
            private void compareCreator(Creator creator1, Creator creator2)
            {
                compareCreatorName(creator1.getCreatorName(), creator2.getCreatorName());
                compareNameIdentifier(creator1.nameIdentifier, creator2.nameIdentifier);
                Assert.assertEquals("givenName is different", creator1.givenName, creator2.givenName);
                Assert.assertEquals("familyName is different", creator1.familyName, creator2.familyName);
                Assert.assertEquals("affiliation is different", creator1.affiliation, creator2.affiliation);
            }

            private void compareCreators(List<Creator> c1, List<Creator> c2)
            {
                Assert.assertNotNull("missing expected creators", c1);
                Assert.assertNotNull("missing actual creators", c2);
                Assert.assertEquals("different number of creators", c1.size(), c2.size());
                for (int i=0; i<c1.size(); i++)
                {
                    compareCreator(c1.get(i), c2.get(i));
                }
            }
            
            private void compareTitles(List<Title> t1, List<Title> t2)
            {
                Assert.assertEquals("Number of titles is different", t1.size(), t2.size());
                for (int i=0; i< t1.size(); i++)
                {
                    compareTitle(t1.get(i), t2.get(i));
                }
            }
            
            private void compareTitle(Title t1, Title t2)
            {
                Assert.assertEquals("lang is different", t1.getLang(), t2.getLang());
                Assert.assertEquals("title is different", t1.getText(), t2.getText());
                Assert.assertEquals("titleType is different", t1.titleType, t2.titleType);
            }
            
            private DoiStatus getStatus(URL docURL) throws UnsupportedEncodingException, DoiParsingException, IOException
            {
                URL statusURL = new URL(docURL + "/status");
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                HttpDownload getStatus = new HttpDownload(statusURL, baos);
                getStatus.run();
                Assert.assertNull("GET " + statusURL.toString() + " in XML failed. ", getStatus.getThrowable());
                DoiStatusXmlReader statusReader = new DoiStatusXmlReader();
                return statusReader.read(new StringReader(new String(baos.toByteArray(), "UTF-8")));
            }
            
            public Object run() throws Exception
            {
                // post the job
                URL postUrl = new URL(baseURL);

                log.debug("baseURL: " + baseURL);
                log.debug("posting to: " + postUrl);
                
                // Check that the doi server processed the document and added an identifier
                String returnedDoc = postDocument(postUrl, initialDocument, TEST_JOURNAL_REF);
                Resource resource = xmlReader.read(returnedDoc);
                String returnedIdentifier = resource.getIdentifier().getText();
                Assert.assertFalse("New identifier not received from doi service.", initialResource.getIdentifier().getText().equals(returnedIdentifier));
                
                // Pull the suffix from the identifier
                String[] doiNumberParts = returnedIdentifier.split("/");
                
                try
                {
                    // For DOI status test below
                    URL docURL = new URL(baseURL + "/" + doiNumberParts[1]);
                    Title expectedTitle = resource.getTitles().get(0);
                    Creator expectedCreator = resource.getCreators().get(0);
    
                    // Get the DOI status
                    DoiStatus doiStatus = getStatus(docURL);
                    Assert.assertEquals("identifier from DOI status is different", returnedIdentifier, doiStatus.getIdentifier().getText());
                    Assert.assertEquals("title from DOI status is different", expectedTitle.getText(), doiStatus.getTitle().getText());
                    Assert.assertEquals("status is incorrect", Status.DRAFT, doiStatus.getStatus());
                    Assert.assertEquals("journalRef is incorrect", TEST_JOURNAL_REF, doiStatus.journalRef);
                    
                    // update title
                    Title newTitle = new Title(expectedTitle.getLang(), "new " + expectedTitle.getText());
                    newTitle.titleType = expectedTitle.titleType;
                    
                    // update creator
                    CreatorName expectedCreatorName = expectedCreator.getCreatorName();
                    CreatorName newCreatorName = new CreatorName("new " + expectedCreatorName.getText());
                    newCreatorName.nameType = expectedCreatorName.nameType;
                    Creator newCreator = new Creator(newCreatorName);
                    newCreator.givenName = "new " + expectedCreator.givenName;
                    newCreator.familyName = "new " + expectedCreator.familyName;
                    newCreator.affiliation = "new " + expectedCreator.affiliation;
                    NameIdentifier expectedNameIdentifier = expectedCreator.nameIdentifier;
                    NameIdentifier newNameIdentifier = new NameIdentifier(expectedNameIdentifier.getNameIdentifierScheme(), "new" + expectedNameIdentifier.getNameIdentifier());
                    newNameIdentifier.schemeURI = expectedNameIdentifier.schemeURI;
                    newCreator.nameIdentifier = newNameIdentifier;
                    
                    // update resource
                    List<Title> newTitles = new ArrayList<Title>();
                    newTitles.add(newTitle);
                    resource.setTitles(newTitles);
                    List<Creator> newCreators = new ArrayList<Creator>();
                    newCreators.add(newCreator);
                    resource.setCreators(newCreators);
                    
                    // generate updated document
                    final StringBuilder builder = new StringBuilder();
                    DoiXmlWriter writer = new DoiXmlWriter();
                    writer.write(resource, builder);
                    String newDocument = builder.toString();
                    
                    // post the update and check result
                    String updatedDoc = postDocument(docURL, newDocument, NEW_JOURNAL_REF);
                    Resource updatedResource = xmlReader.read(updatedDoc);
                    compareCreators(newCreators, updatedResource.getCreators());
                    compareTitles(newTitles, updatedResource.getTitles());
                    
                    // check new journal reference
                    DoiStatus updatedStatus = getStatus(docURL);
                    Assert.assertEquals("identifier from DOI status is different", returnedIdentifier, updatedStatus.getIdentifier().getText());
                    Assert.assertEquals("journalRef is incorrect", NEW_JOURNAL_REF, updatedStatus.journalRef);
                    
                    // no change
                    updatedDoc = postDocument(docURL, newDocument, null);
                    updatedResource = xmlReader.read(updatedDoc);
                    compareCreators(newCreators, updatedResource.getCreators());
                    compareTitles(newTitles, updatedResource.getTitles());
                    
                    // check for same journal reference
                    updatedStatus = getStatus(docURL);
                    Assert.assertEquals("identifier from DOI status is different", returnedIdentifier, updatedStatus.getIdentifier().getText());
                    Assert.assertEquals("journalRef has changed", NEW_JOURNAL_REF, updatedStatus.journalRef);
                    
                    // delete journal reference
                    updatedDoc = postDocument(docURL, newDocument, "");
                    updatedResource = xmlReader.read(updatedDoc);
                    compareCreators(newCreators, updatedResource.getCreators());
                    compareTitles(newTitles, updatedResource.getTitles());
                    
                    // check for null journal reference
                    updatedStatus = getStatus(docURL);
                    Assert.assertEquals("identifier from DOI status is different", returnedIdentifier, updatedStatus.getIdentifier().getText());
                    Assert.assertNull("journalRef was not deleted", updatedStatus.journalRef);
                }
                finally
                {
                    // delete containing folder using doiadmin credentials
                    deleteTestFolder(doiNumberParts[1]);
                }
                return resource;
            }
        });
    }
}