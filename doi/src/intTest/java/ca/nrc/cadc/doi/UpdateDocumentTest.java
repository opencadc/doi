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
            
            private void compareStrings(String s1, String s2, String field)
            {
                compareNull(s1, s2, field);
                if (s1 != null)
                {
                    Assert.assertEquals(field + "is different", s1, s2);
                }
            }

            private void compareCreatorName(CreatorName cn1, CreatorName cn2)
            {
                Assert.assertEquals("creatorName is different", cn1.getText(), cn2.getText());
                Assert.assertEquals("nameType is different", cn1.nameType, cn2.nameType);
            }
            
            private void compareNameIdentifier(NameIdentifier id1, NameIdentifier id2)
            {
                compareNull(id1, id2, "nameIdentifier");
                if (id1 != null) {
                    compareStrings(id1.getNameIdentifier(), id2.getNameIdentifier(), "nameIdentifier text");
                    compareStrings(id1.getNameIdentifierScheme(), id2.getNameIdentifierScheme(), "nameIdentifierScheme");
                    compareNull(id1.schemeURI, id2.schemeURI, "schemeURI");
                    if (id1.schemeURI != null)
                    {
                        Assert.assertTrue("schemeURI is different", id1.schemeURI.equals(id2.schemeURI));
                    }
                }
            }
            private void compareCreator(Creator creator1, Creator creator2)
            {
                compareCreatorName(creator1.getCreatorName(), creator2.getCreatorName());
                compareNameIdentifier(creator1.nameIdentifier, creator2.nameIdentifier);
                compareStrings(creator1.givenName, creator2.givenName, "givenName");
                compareStrings(creator1.familyName, creator2.familyName, "familyName");
                compareStrings(creator1.affiliation, creator2.affiliation, "affiliation");
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
                Assert.assertNotNull("missing expected titles", t1);
                Assert.assertNotNull("missing actual titles", t2);
                Assert.assertEquals("Number of titles is different", t1.size(), t2.size());
                for (int i=0; i< t1.size(); i++)
                {
                    compareTitle(t1.get(i), t2.get(i));
                }
            }
            
            private void compareTitle(Title t1, Title t2)
            {
                compareStrings(t1.getLang(), t2.getLang(), "lang");
                compareStrings(t1.getText(), t2.getText(), "title");
                compareNull(t1.titleType, t2.titleType, "titleType");
                if (t1.titleType != null) {
                    Assert.assertEquals("titleType is different", t1.titleType, t2.titleType);
                }
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
            
            private String generateDocument(Resource resource) throws IOException {
                StringBuilder builder = new StringBuilder();
                DoiXmlWriter writer = new DoiXmlWriter();
                writer.write(resource, builder);
                return builder.toString();
            }
            
            private Resource executeTest(URL docURL, String document, 
                List<Creator> expectedCreators, List<Title> expectedTitles,
                String expectedIdentifier, String expectedJournalRef, String newJournalRef) 
                    throws DoiParsingException, UnsupportedEncodingException, IOException {
                String uDoc = postDocument(docURL, document, newJournalRef);
                Resource uResource = xmlReader.read(uDoc);
                compareCreators(expectedCreators, uResource.getCreators());
                compareTitles(expectedTitles, uResource.getTitles());
                
                // check for same journal reference
                DoiStatus uStatus = getStatus(docURL);
                Assert.assertEquals("identifier from DOI status is different", expectedIdentifier, uStatus.getIdentifier().getText());
                if (newJournalRef == null) {
                    Assert.assertEquals("journalRef has changed", expectedJournalRef, uStatus.journalRef);
                } else if (newJournalRef.length() > 0) {
                    Assert.assertEquals("journalRef is incorrect", expectedJournalRef, uStatus.journalRef);
                } else {
                    Assert.assertNull("journalRef was not deleted", uStatus.journalRef);
                }
                
                return uResource;
            }

            private Resource executeUpdateLanguageTest(URL docURL, String document, String expectedLanguage) 
                    throws DoiParsingException, UnsupportedEncodingException, IOException {
                String uDoc = postDocument(docURL, document, null);
                Resource uResource = xmlReader.read(uDoc);
                compareStrings(expectedLanguage, uResource.language, "language");
                return uResource;
            }

            private Resource executeUpdatePublicationYearTest(URL docURL, String document, String expectedPublicationYear) 
                    throws DoiParsingException, UnsupportedEncodingException, IOException {
                String uDoc = postDocument(docURL, document, null);
                Resource uResource = xmlReader.read(uDoc);
                compareStrings(expectedPublicationYear, uResource.getPublicationYear(), "publicationYear");
                return uResource;
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
                    String newDocument = this.generateDocument(resource);
                    
                    // TEST CASE 1: update both creators and title, and journalRef
                    Resource t1Resource = executeTest(docURL, newDocument, newCreators, newTitles, returnedIdentifier, NEW_JOURNAL_REF, NEW_JOURNAL_REF);
                    
                    // TEST CASE 2: no update to document or journalRef
                    Resource t2Resource = executeTest(docURL, newDocument, newCreators, newTitles, returnedIdentifier, NEW_JOURNAL_REF, null);
                    
                    // TEST CASE 3: title and creator with null optional elements, and delete journal reference
                    Title titleWithNullTitleType = new Title(expectedTitle.getLang(), "NullTitleType");
                    t2Resource.getTitles().add(titleWithNullTitleType);
                    List<Title> t3ExpectedTitles = t2Resource.getTitles();
                    Creator creatorWithNullOptionalFields = new Creator(new CreatorName("NullOptionalFields"));
                    List<Creator> t3ExpectedCreators = t2Resource.getCreators();
                    t3ExpectedCreators.add(creatorWithNullOptionalFields);
                    String t3GeneratedDoc = this.generateDocument(t2Resource);
                    Resource t3Resource = executeTest(docURL, t3GeneratedDoc, t3ExpectedCreators, t3ExpectedTitles, returnedIdentifier, null, "");
                    
                    // TEST CASE 4: creator with nameIdentifer but no optional schemeURI
                    Creator creatorWithNullSchemeURI = new Creator(new CreatorName("NullOptionalFields"));
                    NameIdentifier nameID = new NameIdentifier(expectedNameIdentifier.getNameIdentifier(), "nullSchemURI");
                    creatorWithNullSchemeURI.nameIdentifier = nameID;
                    List<Creator> t4ExpectedCreators = t3Resource.getCreators();
                    t4ExpectedCreators.add(creatorWithNullSchemeURI);
                    String t4GeneratedDoc = this.generateDocument(t3Resource);
                    Resource t4Resource = executeTest(docURL, t4GeneratedDoc, t4ExpectedCreators, t3ExpectedTitles, returnedIdentifier, null, "");

                    // TEST CASE 5: update language
                    if (t4Resource.language.contains("en")) {
                        t4Resource.language = "fr";
                    } else {
                        t4Resource.language = "en-US";
                    }
                    
                    String t5GeneratedDoc = this.generateDocument(t4Resource);
                    Resource t5Resource = executeUpdateLanguageTest(docURL, t5GeneratedDoc, t4Resource.language);
                    
                    // TEST CASE 6: update publicationYear
                    // update to a valid year
                    t5Resource.setPublicationYear("2010");
                    String t6GeneratedDoc = this.generateDocument(t5Resource);
                    Resource t6Resource = executeUpdatePublicationYearTest(docURL, t6GeneratedDoc, t5Resource.getPublicationYear());

                    // update to a year too far in the past
                    try {
                        t5Resource.setPublicationYear(String.valueOf(Resource.PUBLICATION_YEAR_LOWER_LIMIT - 1));
                        t6GeneratedDoc = this.generateDocument(t5Resource);
                        t6Resource = executeUpdatePublicationYearTest(docURL, t6GeneratedDoc, t5Resource.getPublicationYear());
                    } catch (Exception ex) {
                        log.info("alinga-- message=" + ex.getMessage());
                        Assert.assertTrue("caught an unexpected exception", ex.getMessage().contains("Bad Request"));
                    }
                    
                    // update to a year too far in the future
                    try {
                        t5Resource.setPublicationYear(String.valueOf(Resource.PUBLICATION_YEAR_UPPER_LIMIT + 1));
                        t6GeneratedDoc = this.generateDocument(t5Resource);
                        t6Resource = executeUpdatePublicationYearTest(docURL, t6GeneratedDoc, t5Resource.getPublicationYear());
                    } catch (Exception ex) {
                        log.info("alinga-- message1=" + ex.getMessage());
                        Assert.assertTrue("caught an unexpected exception", ex.getMessage().contains("Bad Request"));
                    }

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