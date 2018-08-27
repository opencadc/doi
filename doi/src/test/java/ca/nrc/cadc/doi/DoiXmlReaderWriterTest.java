/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2009.                            (c) 2009.
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
 *  $Revision: 4 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi;

import static org.junit.Assert.fail;

import java.io.FileInputStream;
import java.io.FileWriter;
import java.net.URI;
import java.util.List;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.jdom2.Attribute;
import org.jdom2.Content;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.Namespace;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import ca.nrc.cadc.util.Log4jInit;

/**
 * Test read-write of DoiMetadata using the DoiXmlReader and DoiXmlWriter. Every test here
 * performs a round trip: create doiMetadata, write as xml, read with xml schema
 * validation enabled, compare to original node.
 * 
 * @author yeunga
 */
public class DoiXmlReaderWriterTest
{
    private static Logger log = Logger.getLogger(DoiXmlReaderWriterTest.class);
    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.vos", Level.INFO);
    }

    public DoiXmlReaderWriterTest()
    {
    }

    @BeforeClass
    public static void setUpClass() throws Exception
    {
    }

    @AfterClass
    public static void tearDownClass() throws Exception
    {
    }

    @Before
    public void setUp() throws Exception
    {
    }

    @After
    public void tearDown()
    {
    }

    private void compareNamespace(Namespace ns1, Namespace ns2)
    {
        Assert.assertTrue("Namespace is different", ns1.equals(ns2));
        Assert.assertTrue("Namespace prefix is incorrect", ns1.getPrefix().isEmpty());
        Assert.assertTrue("Namespace prefixes are different", ns1.getPrefix().equals(ns2.getPrefix()));
        Assert.assertTrue("Namespace URI is incorrect", ns1.getURI().equals(DoiXmlReader.DOI_NS_41));
        Assert.assertTrue("Namespace URIs are different", ns1.getURI().equals(ns2.getURI()));
    }
    
    private void compareAttributes(Attribute attribute1, Attribute attribute2, String key, String value, String tag)
    {
        Assert.assertTrue(tag + " " + key + " attribute name is incorrect", attribute1.getName().equals(key));
        Assert.assertEquals(tag + " " + key + " attribute names are different", attribute1.getName(), attribute2.getName());
        Assert.assertTrue(tag + " " + key + " attribute value is incorrect", attribute1.getValue().equals(value));
        Assert.assertEquals(tag + " " + key + " attribute values are different", attribute1.getValue(), attribute2.getValue());
    }

    private void compareCreators(Element creator1, Element creator2, Namespace ns)
    {
        // compare creator name attributes
        List<Attribute> attributes1 = creator1.getChild("creatorName", ns).getAttributes();
        List<Attribute> attributes2 = creator2.getChild("creatorName", ns).getAttributes();
        Assert.assertTrue("Incorrect number of creatorName attributes", attributes1.size() == 1);
        Assert.assertEquals("Number of creatorName attributes are different", attributes1.size(), attributes2.size());
        Attribute attribute1 = attributes1.get(0);
        Attribute attribute2 = attributes2.get(0);
        compareAttributes(attribute1, attribute2, "nameType", "Personal", "CreatorName");

        // compare creator name
        String creatorName1 = creator1.getChildText("creatorName", ns);
        String creatorName2 = creator2.getChildText("creatorName", ns);
        Assert.assertTrue("Incorrect creatorName", creatorName1.equals("Miller, Elizabeth"));
        Assert.assertTrue("Creator creatorNames are different", creatorName1.equals(creatorName2));

        // compare creator givenName
        String givenName1 = creator1.getChildText("givenName", ns);
        String givenName2 = creator2.getChildText("givenName", ns);
        Assert.assertTrue("Incorrect creator givenName", givenName1.equals("Elizabeth"));
        Assert.assertTrue("Creator givenNames are different", givenName1.equals(givenName2));

        // compare creator familyName
        String familyName1 = creator1.getChildText("familyName", ns);
        String familyName2 = creator2.getChildText("familyName", ns);
        Assert.assertTrue("Incorrect creator familyName", familyName1.equals("Miller"));
        Assert.assertTrue("Creator familyNames are different", familyName1.equals(familyName2));
        
        // compare creator nameIdentifier attributes
        attributes1 = creator1.getChild("nameIdentifier", ns).getAttributes();
        attributes2 = creator2.getChild("nameIdentifier", ns).getAttributes();
        Assert.assertTrue("Incorrect number of attributes", attributes1.size() == 2);
        Assert.assertEquals("Number of nameIdentifier attributes are different", attributes1.size(), attributes2.size());
        attribute1 = attributes1.get(0);
        attribute2 = attributes2.get(0);
        compareAttributes(attribute1, attribute2, "schemeURI", "http://orcid.org/", "Creator");
        attribute1 = attributes1.get(1);
        attribute2 = attributes2.get(1);
        compareAttributes(attribute1, attribute2, "nameIdentifierScheme", "ORCID", "Creator");
        String nameIdentifier1 = creator1.getChildText("nameIdentifier", ns);
        String nameIdentifier2 = creator2.getChildText("nameIdentifier", ns);
        Assert.assertTrue("Incorrect creator affiliation", nameIdentifier1.equals("0000-0001-5000-0007"));
        Assert.assertTrue("Creator affiliations are different", nameIdentifier1.equals(nameIdentifier2));

        // compare creator affiliation
        String affiliation1 = creator1.getChildText("affiliation", ns);
        String affiliation2 = creator2.getChildText("affiliation", ns);
        Assert.assertTrue("Incorrect creator affiliation", affiliation1.equals("DataCite"));
        Assert.assertTrue("Creator affiliations are different", affiliation1.equals(affiliation2));
    }
    
    private void compareTitles(Element titles1, Element titles2, Namespace ns)
    {
        // compare number of titles element
        List<Element> titleList1 = titles1.getChildren();
        List<Element> titleList2 = titles2.getChildren();
        Assert.assertTrue("Incorrect number of titles", titleList1.size() == 2);
        Assert.assertEquals("Number of titles are different", titleList1.size(), titleList2.size());
        
        // compare first title
        Element title1 = titleList1.get(0);
        Element title2 = titleList2.get(0);
        List<Attribute> attributes1 = title1.getAttributes();
        List<Attribute> attributes2 = title2.getAttributes();
        Assert.assertTrue("Incorrect number of title attributes", attributes1.size() == 1);
        Assert.assertEquals("Number of title attributes are different", attributes1.size(), attributes2.size());
        Attribute attribute1 = attributes1.get(0);
        Attribute attribute2 = attributes2.get(0);
        compareAttributes(attribute1, attribute2, "lang", "en-US", "Title");
        String title1Text = title1.getText();
        String title2Text = title2.getText();
        Assert.assertTrue("Incorrect title", title1Text.equals("Full DataCite XML Example"));
        Assert.assertTrue("Titles are different", title1Text.equals(title2Text));

        // compare second title element
        title1 = titleList1.get(1);
        title2 = titleList2.get(1);
        attributes1 = title1.getAttributes();
        attributes2 = title2.getAttributes();
        Assert.assertTrue("Incorrect number of title attributes", attributes1.size() == 2);
        Assert.assertEquals("Number of title attributes are different", attributes1.size(), attributes2.size());
        attribute1 = attributes1.get(0);
        attribute2 = attributes2.get(0);
        compareAttributes(attribute1, attribute2, "lang", "en-US", "Title");
        attribute1 = attributes1.get(1);
        attribute2 = attributes2.get(1);
        compareAttributes(attribute1, attribute2, "titleType", "Subtitle", "Title");
        title1Text = title1.getText();
        title2Text = title2.getText();
        Assert.assertTrue("Incorrect title", title1Text.equals("Demonstration of DataCite Properties."));
        Assert.assertTrue("Titles are different", title1Text.equals(title2Text));
    }
    
    
    private void compareSubjects(Element subjects1, Element subjects2, Namespace ns)
    {
        // compare number of titles element
        List<Element> subjectList1 = subjects1.getChildren();
        List<Element> subjectList2 = subjects2.getChildren();
        Assert.assertTrue("Incorrect number of subjects", subjectList1.size() == 1);
        Assert.assertEquals("Number of subjectss are different", subjectList1.size(), subjectList2.size());
        
        // compare first title
        Element subject1 = subjectList1.get(0);
        Element subject2 = subjectList2.get(0);
        List<Attribute> attributes1 = subject1.getAttributes();
        List<Attribute> attributes2 = subject2.getAttributes();
        Assert.assertTrue("Incorrect number of subject attributes", attributes1.size() == 3);
        Assert.assertEquals("Number of subject attributes are different", attributes1.size(), attributes2.size());
        Attribute attribute1 = attributes1.get(0);
        Attribute attribute2 = attributes2.get(0);
        compareAttributes(attribute1, attribute2, "lang", "en-US", "Subject");
        attribute1 = attributes1.get(1);
        attribute2 = attributes2.get(1);
        compareAttributes(attribute1, attribute2, "schemeURI", "http://dewey.info/", "Subject");
        attribute1 = attributes1.get(2);
        attribute2 = attributes2.get(2);
        compareAttributes(attribute1, attribute2, "subjectScheme", "dewey", "Subject");
        String subject1Text = subject1.getText();
        String subject2Text = subject2.getText();
        Assert.assertTrue("Incorrect subject", subject1Text.equals("000 computer science"));
        Assert.assertTrue("Subjects are different", subject1Text.equals(subject2Text));
    }

    private void compareDocs(Document docFromReader, Document docFromWriter)
    {
        
        Element rootFromReader = docFromReader.getRootElement();
        Element rootFromWriter = docFromWriter.getRootElement();
        
        // compare namespaces
        compareNamespace(rootFromReader.getNamespace(), rootFromWriter.getNamespace());
        Namespace ns = rootFromReader.getNamespace();
        
        // compare creators
        Element creatorFromReader = rootFromReader.getChild("creators", ns).getChild("creator", ns);
        Element creatorFromWriter = rootFromWriter.getChild("creators", ns).getChild("creator", ns);
        compareCreators(creatorFromReader, creatorFromWriter, ns);
        
        // compare titles
        Element titlesFromReader = rootFromReader.getChild("titles", ns);
        Element titlesFromWriter = rootFromWriter.getChild("titles", ns);
        compareTitles(titlesFromReader, titlesFromWriter, ns);

        // compare publisher
        Element publisherFromReader = rootFromReader.getChild("publisher", ns);
        Element publisherFromWriter = rootFromWriter.getChild("publisher", ns);
        Assert.assertTrue("Incorrect publisher text", publisherFromReader.getText().equals("DataCite"));
        Assert.assertTrue("Publisher texts are different", publisherFromReader.getText().equals(publisherFromWriter.getText()));

        // compare publicationYear
        Element publicationYearFromReader = rootFromReader.getChild("publicationYear", ns);
        Element publicationYearFromWriter = rootFromWriter.getChild("publicationYear", ns);
        Assert.assertTrue("Incorrect publisher text", publicationYearFromReader.getText().equals("2014"));
        Assert.assertTrue("Publisher texts are different", publicationYearFromReader.getText().equals(publicationYearFromWriter.getText()));
        
        // compare subjects
        Element subjectsFromReader = rootFromReader.getChild("subjects", ns);
        Element subjectsFromWriter = rootFromWriter.getChild("subjects", ns);
        compareSubjects(subjectsFromReader, subjectsFromWriter, ns);


    }
    
    @Test
    public void readValidDoiMetadata()
    {
        try
        {
            log.debug("readValidDoiMetadata");
            DoiXmlReader reader = new DoiXmlReader();
            
            // read test xml file
            String fileName = "src/test/data/datacite-example-full-v4.1.xml";
            FileInputStream fis = new FileInputStream(fileName);
            Document docFromReader = reader.read(fis);
            fis.close();
            
            // write document generated by reader
            StringBuilder builder = new StringBuilder();
            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(docFromReader, builder);
            
            // reader document generated by writer
            Document docFromWriter = reader.read(builder.toString());
            
            // compare document generated by reader to document generated by writer
            compareDocs(docFromReader, docFromWriter);
            
            //FileWriter fileWriter = new FileWriter("src/test/data/out.xml", true);
            //fileWriter.write(builder.toString());
            //fileWriter.close();
        }
        catch (Exception ex)
        {
            log.error(ex);
            fail(ex.getMessage());
        }
        
    }
}
