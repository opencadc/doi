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

package ca.nrc.cadc.doi.status;

import static org.junit.Assert.fail;

import java.io.FileInputStream;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.util.Log4jInit;

/**
 * Test read-write of an XML document containing doi status using the 
 * DoiStatusXmlReader and DoiStatusXmlWriter. Every test here performs a 
 * round trip: read document in xml format, write document in xml format
 * and compare to original document.
 * 
 * @author yeunga
 */
public class DoiStatusReaderWriterTest
{
    private static Logger log = Logger.getLogger(DoiStatusReaderWriterTest.class);
    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.vos", Level.INFO);
    }

    public DoiStatusReaderWriterTest()
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
    
    private void compareIdentifier(Identifier id1, Identifier id2)
    {
        Assert.assertEquals("Identifiers are different", id1.getText(), id2.getText());
        Assert.assertEquals("identifierTypes are different", id1.getIdentifierType(), id2.getIdentifierType());
    }
    
    private void compareTitle(Title t1, Title t2)
    {
        Assert.assertEquals("langs are different", t1.getLang(), t2.getLang());
        Assert.assertEquals("titles are different", t1.getTitle(), t2.getTitle());
        Assert.assertEquals("titleTypes are different", t1.titleType, t2.titleType);
    }
    
    private void comparePublicationYear(String p1, String p2)
    {
        Assert.assertEquals("publicationYears are different", p1, p2);
    }
    
    private void compareStatus(String s1, String s2)
    {
        Assert.assertEquals("statuses are different", s1, s2);
    }

    private void compareDoiStatus(DoiStatus s1, DoiStatus s2)
    {
        compareIdentifier(s1.getIdentifier(), s2.getIdentifier());
        compareTitle(s1.getTitle(), s2.getTitle());
        comparePublicationYear(s1.getPublicationYear(), s2.getPublicationYear());
        compareStatus(s1.getStatus().getValue(), s2.getStatus().getValue());
    }
    
    @Test
    public void testXmlReaderWriter()
    {
        try
        {
            log.debug("testXmlReaderWriter");
            DoiStatusXmlReader xmlReader = new DoiStatusXmlReader();
            
            // read test xml file
            String fileName = "src/test/data/doi-status.xml";
            FileInputStream fis = new FileInputStream(fileName);
            DoiStatus doiStatusFromReader = xmlReader.read(fis);
            fis.close();
            
            // write DoiStatus instance in XMl format
            StringBuilder builder = new StringBuilder();
            DoiStatusXmlWriter writer = new DoiStatusXmlWriter();
            writer.write(doiStatusFromReader, builder);
            
            // read document generated by writer
            DoiStatus doiStatusFromWriter = xmlReader.read(builder.toString());
            
            // compare DOiStatus instance generated by reader to DoiStatus instance generated by writer
            compareDoiStatus(doiStatusFromReader, doiStatusFromWriter);
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
            DoiStatusXmlReader xmlReader = new DoiStatusXmlReader();
            
            // read test xml file
            String fileName = "src/test/data/doi-status.xml";
            FileInputStream fis = new FileInputStream(fileName);
            DoiStatus doiStatusFromReader = xmlReader.read(fis);
            fis.close();
            
            // write DoiStatus instance in JSON format
            StringBuilder builder = new StringBuilder();
            DoiStatusJsonWriter writer = new DoiStatusJsonWriter();
            writer.write(doiStatusFromReader, builder);

            // read document generated by writer
            DoiStatusJsonReader jsonReader = new DoiStatusJsonReader();
            DoiStatus doiStatusFromWriter = jsonReader.read(builder.toString());

            // compare DoiStatus instance generated by reader to DoiStatus instance generated by writer
            compareDoiStatus(doiStatusFromReader, doiStatusFromWriter);
        }
        catch (Exception ex)
        {
            log.error(ex);
            fail(ex.getMessage());
        }
        
    }
}
