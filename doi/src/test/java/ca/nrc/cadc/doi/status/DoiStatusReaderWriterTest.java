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
 *  $Revision: 4 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi.status;

import static org.junit.Assert.fail;

import java.io.FileInputStream;
import java.util.List;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.util.Log4jInit;

/**
 * Test read-write of an XML document containing a list of doi statuses using the 
 * DoiStatusListXmlReader and DoiStatusListXmlWriter. Every test here performs a 
 * round trip: read document in xml format, write document in xml format
 * and compare to original document.
 * 
 * @author yeunga
 */
public class DoiStatusReaderWriterTest {
    private static final Logger log = Logger.getLogger(DoiStatusReaderWriterTest.class);
    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.vos", Level.INFO);
    }

    public DoiStatusReaderWriterTest() {
    }

    private void compareIdentifier(Identifier id1, Identifier id2) {
        Assert.assertEquals("Identifiers are different", id1.getValue(), id2.getValue());
        Assert.assertEquals("identifierTypes are different", id1.getIdentifierType(), id2.getIdentifierType());
    }
    
    private void compareTitle(Title t1, Title t2) {
    	if (t1 == null) {
    		Assert.assertNull("expected title is null, actual title is not null: " + t2);
    	} else {
	        Assert.assertEquals("langs are different", t1.lang, t2.lang);
	        Assert.assertEquals("titles are different", t1.getValue(), t2.getValue());
	        Assert.assertEquals("titleTypes are different", t1.titleType, t2.titleType);
    	}
    }
    
    private void compareJournalRef(String p1, String p2) {
        Assert.assertEquals("journalRefs are different", p1, p2);
    }
    
    private void compareStatus(String s1, String s2) {
        Assert.assertEquals("statuses are different", s1, s2);
    }

    private void compareDataDir(String s1, String s2) {
    	if (s1 == null) {
    		Assert.assertNull("expected dataDirectory is null, actual dataDirectory is not null: ", s2);
    	} else {
	        Assert.assertEquals("data directories are different", s1, s2);
    	}
    }

    private void compareDoiStatus(DoiStatus s1, DoiStatus s2) {
        compareIdentifier(s1.getIdentifier(), s2.getIdentifier());
        compareTitle(s1.getTitle(), s2.getTitle());
        compareDataDir(s1.getDataDirectory(), s2.getDataDirectory());
        compareStatus(s1.getStatus().getValue(), s2.getStatus().getValue());
        compareJournalRef(s1.journalRef, s2.journalRef);
    }
    
    private void compareDoiStatusList(List<DoiStatus> l1, List<DoiStatus> l2) {
        Assert.assertEquals("size are different", l1.size(), l2.size());
        DoiStatus[] a1 = l1.toArray(new DoiStatus[l1.size()]);
        DoiStatus[] a2 = l2.toArray(new DoiStatus[l2.size()]);
        for (int i = 0; i < a1.length; i++) {
            compareDoiStatus(a1[i], a2[i]);
        }
    }
    
    @Test
    public void testXmlStatusReaderWriter() {
        try {
            log.debug("testXmlReaderWriter");
            DoiStatusXmlReader xmlReader = new DoiStatusXmlReader();
            
            // read test xml file
            String fileName = "src/test/resources/doi-status.xml";
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
        } catch (Exception ex) {
            log.error(ex);
            fail(ex.getMessage());
        }
    }
    
    @Test
    public void testXmlStatusesReaderWriter() {
        try {
            log.debug("testXmlReaderWriter");
            DoiStatusListXmlReader xmlReader = new DoiStatusListXmlReader();
            
            // read test xml file
            String fileName = "src/test/resources/doi-statuses.xml";
            FileInputStream fis = new FileInputStream(fileName);
            List<DoiStatus> doiStatusListFromReader = xmlReader.read(fis);
            fis.close();
            
            // write DoiStatus instance in XMl format
            StringBuilder builder = new StringBuilder();
            DoiStatusListXmlWriter writer = new DoiStatusListXmlWriter();
            writer.write(doiStatusListFromReader, builder);
            
            // read document generated by writer
            List<DoiStatus> doiStatusListFromWriter = xmlReader.read(builder.toString());
            
            // compare DOiStatus instance generated by reader to DoiStatus instance generated by writer
            compareDoiStatusList(doiStatusListFromReader, doiStatusListFromWriter);
        } catch (Exception ex) {
            log.error(ex);
            fail(ex.getMessage());
        }
    }

    @Test
    public void testJsonStatusReaderWriter() {
        try {
            log.debug("testJsonReaderWriter");
            DoiStatusXmlReader xmlReader = new DoiStatusXmlReader();
            
            // read test xml file
            String fileName = "src/test/resources/doi-status.xml";
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
        } catch (Exception ex) {
            log.error(ex);
            fail(ex.getMessage());
        }
    }

    @Test
    public void testJsonStatusesReaderWriter() {
        try {
            log.debug("testJsonReaderWriter");
            DoiStatusListXmlReader xmlReader = new DoiStatusListXmlReader();
            
            // read test xml file
            String fileName = "src/test/resources/doi-statuses.xml";
            FileInputStream fis = new FileInputStream(fileName);
            List<DoiStatus> doiStatusListFromReader = xmlReader.read(fis);
            fis.close();
            
            // write DoiStatus instance in JSON format
            StringBuilder builder = new StringBuilder();
            DoiStatusListJsonWriter writer = new DoiStatusListJsonWriter();
            writer.write(doiStatusListFromReader, builder);

            // read document generated by writer
            DoiStatusListJsonReader jsonReader = new DoiStatusListJsonReader();
            List<DoiStatus> doiStatusListFromWriter = jsonReader.read(builder.toString());

            // compare DoiStatus instance generated by reader to DoiStatus instance generated by writer
            compareDoiStatusList(doiStatusListFromReader, doiStatusListFromWriter);
        } catch (Exception ex) {
            log.error(ex);
            fail(ex.getMessage());
        }
    }

}
