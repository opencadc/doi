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
 *  $Revision: 4 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi;

import static org.junit.Assert.fail;

import java.io.FileInputStream;
import java.util.List;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.jdom2.Namespace;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import ca.nrc.cadc.doi.datacite.Contributor;
import ca.nrc.cadc.doi.datacite.ContributorName;
import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.CreatorName;
import ca.nrc.cadc.doi.datacite.Description;
import ca.nrc.cadc.doi.datacite.DoiDate;
import ca.nrc.cadc.doi.datacite.DoiJsonReader;
import ca.nrc.cadc.doi.datacite.DoiJsonWriter;
import ca.nrc.cadc.doi.datacite.DoiXmlReader;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.NameIdentifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.ResourceType;
import ca.nrc.cadc.doi.datacite.Rights;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.util.Log4jInit;

/**
 * Test read-write of an XML document containing doi metadata using the 
 * DoiXmlReader and DoiXmlWriter. Every test here performs a round trip: 
 * read with xml schema validation enabled, write document in xml format
 * and compare to original document.
 * 
 * @author yeunga
 */
public class DoiReaderWriterTest
{
    private static Logger log = Logger.getLogger(DoiReaderWriterTest.class);
    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.vos", Level.INFO);
    }

    public DoiReaderWriterTest()
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
        Assert.assertTrue("Namespace prefixes are different", ns1.getPrefix().equals(ns2.getPrefix()));
        Assert.assertTrue("Namespace URIs are different", ns1.getURI().equals(ns2.getURI()));
    }
    
    private void compareIdentifier(Identifier id1, Identifier id2)
    {
        Assert.assertEquals("Identifiers are different", id1.getText(), id2.getText());
        Assert.assertEquals("identifierTypes are different", id1.getIdentifierType(), id2.getIdentifierType());
    }
    
    private void compareCreators(List<Creator> creators1, List<Creator> creators2)
    {
        Assert.assertEquals("Number of creators are different", creators1.size(), creators2.size() );
        for (int i=0; i<creators1.size(); i++)
        {
            compareCreator(creators1.get(i), creators2.get(i));
        }
    }
    
    private void compareCreator(Creator creator1, Creator creator2)
    {
        compareCreatorName(creator1.getCreatorName(), creator2.getCreatorName());
        compareNameIdentifier(creator1.nameIdentifier, creator2.nameIdentifier);
        Assert.assertEquals("givenNames are different", creator1.givenName, creator2.givenName);
        Assert.assertEquals("familyNames are different", creator1.familyName, creator2.familyName);
        Assert.assertEquals("affiliations are different", creator1.affiliation, creator2.affiliation);
    }
    
    private void compareCreatorName(CreatorName cn1, CreatorName cn2)
    {
        Assert.assertEquals("creatorNames are different", cn1.getText(), cn2.getText());
        Assert.assertEquals("nameTypes are different", cn1.nameType, cn2.nameType);
    }
    
    private void compareNameIdentifier(NameIdentifier id1, NameIdentifier id2)
    {
        Assert.assertEquals("nameIdentifierSchemes are different", id1.getNameIdentifierScheme(), id2.getNameIdentifierScheme());
        Assert.assertEquals("nameIdentifiers are different", id1.getNameIdentifier(), id2.getNameIdentifier());
        Assert.assertTrue("schemeURIs are different", id1.schemeURI.equals(id2.schemeURI));
    }
    
    private void compareTitles(List<Title> t1, List<Title> t2)
    {
        Assert.assertEquals("Number of titles are different", t1.size(), t2.size());
        for (int i=0; i< t1.size(); i++)
        {
            compareTitle(t1.get(i), t2.get(i));
        }
    }
    
    private void compareTitle(Title t1, Title t2)
    {
        Assert.assertEquals("langs are different", t1.getLang(), t2.getLang());
        Assert.assertEquals("titles are different", t1.getText(), t2.getText());
        Assert.assertEquals("titleTypes are different", t1.titleType, t2.titleType);
    }
    
    private void comparePublisher(String p1, String p2)
    {
        Assert.assertEquals("publishers are different", p1, p2);
    }
    
    private void comparePublicationYear(String p1, String p2)
    {
        Assert.assertEquals("publicationYears are different", p1, p2);
    }

    private void compareResourceType(ResourceType rst1, ResourceType rst2)
    {
        Assert.assertEquals("resourceTypeGenerals are different", rst1.getResourceTypeGeneral(), rst2.getResourceTypeGeneral());
        Assert.assertEquals("resourceTypes are different", rst1.getResourceType(), rst2.getResourceType());
    }
    
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
    
    private void compareContributorName(ContributorName cn1, ContributorName cn2)
    {
        Assert.assertEquals("name is different", cn1.getText(), cn2.getText());
        Assert.assertEquals("nameType is different", cn1.nameType, cn2.nameType);
    }
    
    private void compareStrings(String s1, String s2, String field)
    {
        compareNull(s1, s2, field);
        if (s1 != null)
        {
            Assert.assertEquals(field + "is different", s1, s2);
        }
    }
    
    private void compareContributor(Contributor c1, Contributor c2)
    {
        compareContributorName(c1.getContributorName(), c2.getContributorName());
        Assert.assertEquals("contributorType is different", c1.getContributorType(), c2.getContributorType());
        compareStrings(c1.givenName, c2.givenName, "givenName");
        compareStrings(c1.familyName, c2.familyName, "familyName");
        compareStrings(c1.affiliation, c2.affiliation, "affiliation");
        compareNameIdentifier(c1.nameIdentifier, c2.nameIdentifier);
    }
    
    private void compareContributors(List<Contributor> cs1, List<Contributor> cs2)
    {
        compareNull(cs1, cs2, "contributor");
        if (cs1 != null)
        {
            Assert.assertEquals("contributors size is different", cs1.size(), cs2.size());
            for (int i=0; i< cs1.size(); i++)
            {
                compareContributor(cs1.get(i), cs2.get(i));
            }
        }
    }
    
    private void compareRights(Rights r1, Rights r2)
    {
        compareStrings(r1.getLang(), r2.getLang(), "lang");
        compareStrings(r1.getText(), r2.getText(), "rights text");
        compareNull(r1.rightsURI, r2.rightsURI, "rightsURI");
        if (r1.rightsURI != null)
        {
            Assert.assertTrue("rightsURI is different", r1.rightsURI.equals(r2.rightsURI));
        }
    }
    
    private void compareRightsList(List<Rights> rl1, List<Rights> rl2)
    {
        compareNull(rl1, rl2, "contributor");
        if (rl1 != null)
        {
            Assert.assertEquals("rightsList size is different", rl1.size(), rl2.size());
            for (int i=0; i< rl1.size(); i++)
            {
                compareRights(rl1.get(i), rl2.get(i));
            }
        }
    }
    
    private void compareDate(DoiDate d1, DoiDate d2)
    {
        compareStrings(d1.getIsoDate(), d2.getIsoDate(), "isoDate");
        Assert.assertEquals("dateType is different", d1.getDateType(), d2.getDateType());
        compareStrings(d1.dateInformation, d2.dateInformation, "dateInformation");
    }
    
    private void compareDates(List<DoiDate> d1, List<DoiDate> d2)
    {
        compareNull(d1, d2, "dates");
        if (d1 != null)
        {
            Assert.assertEquals("dates size is different", d1.size(), d2.size());
            for (int i=0; i< d1.size(); i++)
            {
                compareDate(d1.get(i), d2.get(i));
            }
        }
    }
    
    private void compareDescription(Description d1, Description d2)
    {
        compareStrings(d1.getLang(), d2.getLang(), "lang");
        Assert.assertEquals("descriptionType is different", d1.getDescriptionType(), d2.getDescriptionType());
        // XMLOutputter removes leading and trailing '\n' and spaces
        compareStrings(d1.getText().trim(), d2.getText().trim(), "desciption text");
    }
    
    private void compareDescriptions(List<Description> d1, List<Description> d2)
    {
        compareNull(d1, d2, "descriptions");
        if (d1 != null)
        {
            Assert.assertEquals("descriptions size is different", d1.size(), d2.size());
            for (int i=0; i< d1.size(); i++)
            {
                compareDescription(d1.get(i), d2.get(i));
            }
        }
    }
    
    private void compareSizes(List<String> s1, List<String> s2)
    {
        compareNull(s1, s2, "sizes");
        if (s1 != null)
        {
            Assert.assertEquals("sizes size is different", s1.size(), s2.size());
            for (int i=0; i< s1.size(); i++)
            {
                compareStrings(s1.get(i), s2.get(i), "size");
            }
        }
    }

    private void compareResources(Resource r1, Resource r2)
    {
        // compare mandatory fields
        compareNamespace(r1.getNamespace(), r2.getNamespace());
        compareIdentifier(r1.getIdentifier(), r2.getIdentifier());
        compareCreators(r1.getCreators(), r2.getCreators());
        compareTitles(r1.getTitles(), r2.getTitles());
        comparePublisher(r1.getPublisher(), r2.getPublisher());
        comparePublicationYear(r1.getPublicationYear(), r2.getPublicationYear());
        compareResourceType(r1.getResourceType(), r2.getResourceType());
        
        // compare optional fields
        compareContributors(r1.contributors, r2.contributors);
        compareRightsList(r1.rightsList, r2.rightsList);
        compareDates(r1.dates, r2.dates);
        compareDescriptions(r1.descriptions, r2.descriptions);
        compareSizes(r1.sizes, r2.sizes);
    }
    
    @Test
    public void testXmlReaderWriter()
    {
        try
        {
            log.debug("testXmlReaderWriter");
            DoiXmlReader xmlReader = new DoiXmlReader();
            
            // read test xml file
            String fileName = "src/test/data/datacite-example-full-v4.1.xml";
            FileInputStream fis = new FileInputStream(fileName);
            Resource resourceFromReader = xmlReader.read(fis);
            fis.close();
            
            // write Resource instance in XMl format
            StringBuilder builder = new StringBuilder();
            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(resourceFromReader, builder);
            
            // read document generated by writer
            Resource resourceFromWriter = xmlReader.read(builder.toString());
            
            // compare Resource instance generated by reader to Resource instance generated by writer
            compareResources(resourceFromReader, resourceFromWriter);
        }
        catch (Exception ex)
        {
            log.error(ex);
            fail(ex.getMessage());
        }
        
    }

    @Test
    public void testBasicXmlReaderWriter()
    {
        // tests that missing optional elements are handled correctly
        try
        {
            log.debug("testXmlReaderWriter");
            DoiXmlReader xmlReader = new DoiXmlReader();
            
            // read test xml file
            String fileName = "src/test/data/datacite-example-mandatory-only-v4.1.xml";
            FileInputStream fis = new FileInputStream(fileName);
            Resource resourceFromReader = xmlReader.read(fis);
            fis.close();
            
            // write Resource instance in XMl format
            StringBuilder builder = new StringBuilder();
            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(resourceFromReader, builder);
            
            // read document generated by writer
            Resource resourceFromWriter = xmlReader.read(builder.toString());
            
            // compare Resource instance generated by reader to Resource instance generated by writer
            compareResources(resourceFromReader, resourceFromWriter);
        }
        catch (Exception ex)
        {
            log.error(ex);
            fail(ex.getMessage());
        }
        
    }

    @Test
    public void testJsonReaderWriter()
    {
        try
        {
            log.debug("testJsonReaderWriter");
            DoiXmlReader xmlReader = new DoiXmlReader();
            
            // read test xml file
            String fileName = "src/test/data/datacite-example-full-v4.1.xml";
            FileInputStream fis = new FileInputStream(fileName);
            Resource resourceFromReader = xmlReader.read(fis);
            fis.close();
            
            // write Resource instance in JSON format
            StringBuilder builder = new StringBuilder();
            DoiJsonWriter writer = new DoiJsonWriter();
            writer.write(resourceFromReader, builder);

            // read document generated by writer
            DoiJsonReader jsonReader = new DoiJsonReader();
            Resource resourceFromWriter = jsonReader.read(builder.toString());

            // compare Resource instance generated by reader to Resource instance generated by writer
            compareResources(resourceFromReader, resourceFromWriter);
        }
        catch (Exception ex)
        {
            log.error(ex);
            fail(ex.getMessage());
        }
        
    }

    @Test
    public void testBasicJsonReaderWriter()
    {
        // tests that missing optional elements are handled correctly
        try
        {
            log.debug("testJsonReaderWriter");
            DoiXmlReader xmlReader = new DoiXmlReader();
            
            // read test xml file
            String fileName = "src/test/data/datacite-example-mandatory-only-v4.1.xml";
            FileInputStream fis = new FileInputStream(fileName);
            Resource resourceFromReader = xmlReader.read(fis);
            fis.close();
            
            // write Resource instance in JSON format
            StringBuilder builder = new StringBuilder();
            DoiJsonWriter writer = new DoiJsonWriter();
            writer.write(resourceFromReader, builder);

            // read document generated by writer
            DoiJsonReader jsonReader = new DoiJsonReader();
            Resource resourceFromWriter = jsonReader.read(builder.toString());

            // compare Resource instance generated by reader to Resource instance generated by writer
            compareResources(resourceFromReader, resourceFromWriter);
        }
        catch (Exception ex)
        {
            log.error(ex);
            fail(ex.getMessage());
        }
        
    }
}
