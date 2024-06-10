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

import ca.nrc.cadc.doi.datacite.Affiliation;
import ca.nrc.cadc.doi.datacite.Language;
import ca.nrc.cadc.doi.datacite.PublicationYear;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.net.HttpGet;
import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.PrivilegedExceptionAction;
import java.util.List;

import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.jdom2.Namespace;
import org.junit.Assert;
import org.junit.Test;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.CreatorName;
import ca.nrc.cadc.doi.io.DoiReader;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.NameIdentifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.util.Log4jInit;

/**
 * Persist a minimal instance
 */
public class UpdateTest extends IntTestBase {
    private static final Logger log = Logger.getLogger(UpdateTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    public void updateDOITest() {
        try {
            // minimally populated doi
            Resource minResource = getTestResource(false);
            final String testXML = getResourceXML(minResource);
            String persistedXml = postDOI(doiServiceURL, testXML, TEST_JOURNAL_REF);
            DoiXmlReader reader = new DoiXmlReader();
            Resource persistedResource = reader.read(persistedXml);
            compareResource(minResource, persistedResource);

            // fully populate the persisted doi
            Resource maxResource = getTestResource(true);
            minResource.


        } catch (Exception e) {
            log.error("unexpected exception", e);
            Assert.fail("unexpected exception: " + e.getMessage());
        }
    }

    // test update DOI instance
    @Test
    public void testUpdateDocument() throws Throwable {

        final Subject testSubject = SSLUtil.createSubject(CADCAuthTest1Cert);
        Subject.doAs(testSubject, (PrivilegedExceptionAction<Object>) () -> {
            Resource testResource = getTestResource(true);
            final String testXML = getResourceXML(testResource);
            String doiSuffix = null;
            try {
                // check that the service processed the document and added an identifier
                String persistedXml = postDOI(doiServiceURL, testXML, TEST_JOURNAL_REF);
                DoiXmlReader reader = new DoiXmlReader();
                Resource persistedResource = reader.read(persistedXml);

                String testIdentifier = testResource.getIdentifier().getText();
                String persistedIdentifier = persistedResource.getIdentifier().getText();
                Assert.assertNotEquals("New identifier not received from doi service.",
                        testIdentifier, persistedIdentifier);
                doiSuffix = getDOISuffix(persistedIdentifier);

                // Get the DOI status
                URL doiURL = new URL(String.format("%s/%s", TestUtil.DOI_PARENT_PATH, doiSuffix));
                DoiStatus doiStatus = getStatus(doiURL);
                Assert.assertEquals("identifier mismatch", persistedIdentifier,
                        doiStatus.getIdentifier().getText());
                Assert.assertEquals("title mismatch", testResource.getTitles().get(0).getText(),
                        doiStatus.getTitle().getText());
                Assert.assertEquals("status mismatch", Status.DRAFT, doiStatus.getStatus());
                Assert.assertEquals("journalRef mismatch", TEST_JOURNAL_REF, doiStatus.journalRef);

                // update the title
                Title expectedTitle = testResource.getTitles().get(0);
                Title updatedTitle = new Title("new " + expectedTitle.getText());
                updatedTitle.titleType = expectedTitle.titleType;
                updatedTitle.lang = expectedTitle.lang;
                persistedResource.getTitles().clear();
                persistedResource.getTitles().add(updatedTitle);

                // update the creator
                Creator expectedCreator = testResource.getCreators().get(0);
                CreatorName expectedCreatorName = expectedCreator.getCreatorName();
                CreatorName updatedCreatorName = new CreatorName("new " + expectedCreatorName.getText());
                updatedCreatorName.nameType = expectedCreatorName.nameType;
                Creator updatedCreator = new Creator(updatedCreatorName);
                updatedCreator.givenName = "new " + expectedCreator.givenName;
                updatedCreator.familyName = "new " + expectedCreator.familyName;
                updatedCreator.affiliation = new Affiliation("new " + expectedCreator.affiliation);
                NameIdentifier expectedNameIdentifier = expectedCreator.nameIdentifier;
                NameIdentifier updatedNameIdentifier = new NameIdentifier(
                        "new" + expectedNameIdentifier.getText(),
                        expectedNameIdentifier.getNameIdentifierScheme());
                updatedNameIdentifier.schemeURI = expectedNameIdentifier.schemeURI;
                updatedCreator.nameIdentifier = updatedNameIdentifier;
                persistedResource.getCreators().clear();
                persistedResource.getCreators().add(updatedCreator);

                // get updated resource XML
                String updatedXML = getResourceXML(persistedResource);

                // TEST CASE 1: update both creators and title, and journalRef
                Resource t1Resource = doTest(doiURL, updatedXML, persistedResource, NEW_JOURNAL_REF, NEW_JOURNAL_REF);

                // TEST CASE 2: no update to document or journalRef
                Resource t2Resource = doTest(doiURL, updatedXML, t1Resource, NEW_JOURNAL_REF, null);

                // TEST CASE 3: title and creator with null optional elements, and delete journal reference
                t2Resource.getTitles().add(new Title("NullTitleType"));
                t2Resource.getCreators().add(new Creator(new CreatorName("NullOptionalFields")));
                updatedXML = getResourceXML(t2Resource);
                Resource t3Resource = doTest(doiURL, updatedXML, t2Resource, null, "");

                // TEST CASE 4: creator with nameIdentifer but no optional schemeURI
                Creator creatorWithNullSchemeURI = new Creator(new CreatorName("NullOptionalFields"));
                NameIdentifier nameID = new NameIdentifier(expectedNameIdentifier.getText(),
                        "nullSchemURI");
                creatorWithNullSchemeURI.nameIdentifier = nameID;
                List<Creator> t4ExpectedCreators = t3Resource.getCreators();
                t4ExpectedCreators.add(creatorWithNullSchemeURI);
                String t4GeneratedDoc = this.generateDocument(t3Resource);
                Resource t4Resource = doTest(docURL, t4GeneratedDoc, t4ExpectedCreators, t3ExpectedTitles,
                        returnedIdentifier, null, "");

                // TEST CASE 5: update language
                if (t4Resource.language.contains("en")) {
                    t4Resource.language = "fr";
                } else {
                    t4Resource.language = "en-US";
                }

                String t5GeneratedDoc = this.generateDocument(t4Resource);
                Resource t5Resource = doUpdateLanguageTest(docURL, t5GeneratedDoc, t4Resource.language);

                // TEST CASE 6: update publicationYear
                // update to a valid year
                t5Resource.setPublicationYear("2010");
                String t6GeneratedDoc = this.generateDocument(t5Resource);
                doUpdatePublicationYearTest(docURL, t6GeneratedDoc, t5Resource.getPublicationYear());

                // update to a year too far in the past
                try {
                    t5Resource.setPublicationYear(String.valueOf(Resource.PUBLICATION_YEAR_LOWER_LIMIT - 1));
                    t6GeneratedDoc = this.generateDocument(t5Resource);
                    doUpdatePublicationYearTest(docURL, t6GeneratedDoc, t5Resource.getPublicationYear());
                    Assert.fail("publicationiYear lower limit not detected");
                } catch (Exception ex) {
                    Assert.assertTrue("caught an unexpected exception",
                            ex.getMessage().contains("publicationYear is not a recent year"));
                }

                // update to a year too far in the future
                try {
                    t5Resource.setPublicationYear(String.valueOf(Resource.PUBLICATION_YEAR_UPPER_LIMIT + 1));
                    t6GeneratedDoc = this.generateDocument(t5Resource);
                    doUpdatePublicationYearTest(docURL, t6GeneratedDoc, t5Resource.getPublicationYear());
                    Assert.fail("publicationiYear upper limit not detected");
                } catch (Exception ex) {
                    Assert.assertTrue("caught an unexpected exception",
                            ex.getMessage().contains("publicationYear is not a recent year"));
                }

                // TEST CASE 7: update to Resource.namespace is not allowed
                // updating Namespace.predix should fail
                String t7Prefix = t1Resource.getNamespace().getPrefix() + "a";
                Namespace t7Namespace = Namespace.getNamespace(t7Prefix, t1Resource.getNamespace().getURI());
                Resource t7Resource = new Resource(t7Namespace, t1Resource.getIdentifier(),
                        t1Resource.getCreators(), t1Resource.getTitles(), t1Resource.getPublicationYear());
                String t7GeneratedDoc = this.generateDocument(t7Resource);
                try {
                    doTest(docURL, t7GeneratedDoc, t7Resource.getCreators(), t7Resource.getTitles(),
                            returnedIdentifier, null, null);
                    Assert.fail("resource.namespace update failure not detected");
                } catch (Exception ex) {
                    Assert.assertTrue("caught an unexpected exception",
                            ex.getMessage().contains("namespace update is not allowed"));
                }

                // updating Namespace.URI should fail
                String t7NamespaceURI = t1Resource.getNamespace().getURI() + "a";
                t7Namespace = Namespace.getNamespace(t1Resource.getNamespace().getPrefix(), t7NamespaceURI);
                t7Resource = new Resource(t7Namespace, t1Resource.getIdentifier(), t1Resource.getCreators(),
                        t1Resource.getTitles(), t1Resource.getPublicationYear());
                t7GeneratedDoc = this.generateDocument(t7Resource);
                try {
                    doTest(docURL, t7GeneratedDoc, t7Resource.getCreators(), t7Resource.getTitles(),
                            returnedIdentifier, null, null);
                    Assert.fail("resource.namespace update failure not detected");
                } catch (Exception ex) {
                    Assert.assertTrue("caught an unexpected exception",
                            ex.getMessage().contains("namespace update is not allowed"));
                }

                // TEST CASE 8: update to Resource.identifier is not allowed
                // Note: IdentifierType is validated by xsd to be "DOI"
                // updating Identifier text should fail
                Identifier t8Identifier = t1Resource.getIdentifier();
                DoiReader.assignIdentifier(t8Identifier, "test8");
                Resource t8Resource = new Resource(t1Resource.getNamespace(), t8Identifier,
                        t1Resource.getCreators(), t1Resource.getTitles(), t1Resource.getPublicationYear());
                String t8GeneratedDoc = this.generateDocument(t8Resource);
                try {
                    doTest(docURL, t8GeneratedDoc, t8Resource.getCreators(), t8Resource.getTitles(),
                            returnedIdentifier, null, null);
                    Assert.fail("resource.identifier update failure not detected");
                } catch (Exception ex) {
                    Assert.assertTrue("caught an unexpected exception",
                            ex.getMessage().contains("identifier update is not allowed"));
                }
            } finally {
                if (doiSuffix != null) {
                    cleanup(doiSuffix);
                }
            }
            return null;
        });
    }

    private DoiStatus getStatus(URL doiURL)
            throws Exception {
        URL statusURL = new URL(doiURL + "/status");
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        HttpGet get = new HttpGet(statusURL, bos);
        get.prepare();
        Assert.assertNull("GET exception: " + get.getThrowable().getMessage(), get.getThrowable());
        DoiStatusXmlReader reader = new DoiStatusXmlReader();
        return reader.read(new StringReader(bos.toString(StandardCharsets.UTF_8)));
    }

    private Resource doTest(URL doiURL, String doiXML, Resource expectedResource,
                            String expectedJournalRef, String newJournalRef)
            throws Exception {
        String updatedDoiXML = postDOI(doiURL, doiXML, newJournalRef);
        DoiXmlReader reader = new DoiXmlReader();
        Resource updatedResource = reader.read(updatedDoiXML);

        compareResource(expectedResource, updatedResource);

        // check for same journal reference
        DoiStatus updatedStatus = getStatus(doiURL);
        Assert.assertEquals("identifier from DOI status is different",
                expectedResource.getIdentifier().getText(), updatedStatus.getIdentifier().getText());
        if (newJournalRef == null) {
            Assert.assertEquals("journalRef has changed", expectedJournalRef, updatedStatus.journalRef);
        } else if (!newJournalRef.isEmpty()) {
            Assert.assertEquals("journalRef is incorrect", expectedJournalRef, updatedStatus.journalRef);
        } else {
            Assert.assertNull("journalRef was not deleted", updatedStatus.journalRef);
        }
        return updatedResource;
    }

    private Resource doUpdateLanguageTest(URL doiURL, String doiXML, Language expectedLanguage)
            throws Exception {
        String updateDoiXML = postDOI(doiURL, doiXML, null);
        DoiXmlReader reader = new DoiXmlReader();
        Resource updatedResource = reader.read(updateDoiXML);
        compareLanguage(expectedLanguage, updatedResource.language);
        return updatedResource;
    }

    private Resource doUpdatePublicationYearTest(URL doiURL, String doiXML,
                                                 PublicationYear expectedPublicationYear)
            throws Exception {
        String updatedDoiXML = postDOI(doiURL, doiXML, null);
        DoiXmlReader reader = new DoiXmlReader();
        Resource updatedResource = reader.read(updatedDoiXML);
        comparePublicationYear(expectedPublicationYear, updatedResource.getPublicationYear());
        return updatedResource;
    }

}