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
import java.io.StringReader;
import java.net.URL;
import java.security.PrivilegedExceptionAction;

import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.DoiXmlReader;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpDownload;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.util.Log4jInit;

/**
 * Integration tests for the recursive setting of node properties.
 *
 * @author majorb
 */
public class CreateDocumentTest extends IntTestBase
{
    private static final Logger log = Logger.getLogger(CreateDocumentTest.class);

    static final String JSON = "application/json";

    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
    }

    public CreateDocumentTest() { }

    @Test
    public void testCreateDocumentAndStatus() throws Throwable
    {
        final Subject s = SSLUtil.createSubject(CADCAUTHTEST_CERT);

        // read test xml file
        final DoiXmlReader reader = new DoiXmlReader(true);
        String fileName = "src/test/data/datacite-example-full-dummy-identifier-v4.1.xml";
        FileInputStream fis = new FileInputStream(fileName);
        Resource resource = reader.read(fis);
        fis.close();
        
        // Ensure that the test xml document does not contain an identifier
        final String dummyIdentifier = resource.getIdentifier().getText();
        
        // write document generated by reader
        final StringBuilder builder = new StringBuilder();
        DoiXmlWriter writer = new DoiXmlWriter();
        writer.write(resource, builder);

        Subject.doAs(s, new PrivilegedExceptionAction<Object>()
        {
            public Object run() throws Exception
            {
                // post the job
                URL postUrl = new URL(baseURL);

                log.debug("baseURL: " + baseURL);
                log.debug("posting to: " + postUrl);
                
                HttpPost httpPost = new HttpPost(postUrl, builder.toString(), "text/xml", true);
                httpPost.run();
                
                // Check that there was no exception thrown
                if (httpPost.getThrowable() != null)
                    throw new RuntimeException(httpPost.getThrowable());
                
                // Check that the HttpPost was sent successfully
                Assert.assertEquals("HttpPost failed, return code = " + httpPost.getResponseCode(), httpPost.getResponseCode(), 200);

                // Check that the doi server processed the document and added an identifier
                String returnedDoc = httpPost.getResponseBody();
                Resource resource = reader.read(returnedDoc);
                String returnedIdentifier = resource.getIdentifier().getText();
                Assert.assertFalse("New identifier not received from doi service.", dummyIdentifier.equals(returnedIdentifier));

                // For DOI status test below
                Title expectedTitle = resource.getTitles().get(0);
                String expectedPublicationYear = resource.getPublicationYear();
                
                // Pull the suffix from the identifier
                String[] doiNumberParts = returnedIdentifier.split("/");

                // Get the document in JSON format
                URL docURL = new URL(baseURL + "/" + doiNumberParts[1]);
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                HttpDownload get = new HttpDownload(docURL, bos);
                get.setRequestProperty("Accept", JSON);
                get.run();
                Assert.assertNull("GET " + docURL.toString() + " in JSON failed. ", get.getThrowable());
                Assert.assertEquals(JSON, get.getContentType());

                // Get the DOI status
                URL statusURL = new URL(docURL + "/status");
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                HttpDownload getStatus = new HttpDownload(statusURL, baos);
                get.run();
                Assert.assertNull("GET " + statusURL.toString() + " in XML failed. ", get.getThrowable());
                DoiStatusXmlReader statusReader = new DoiStatusXmlReader();
                DoiStatus doiStatus = statusReader.read(new StringReader(new String(baos.toByteArray(), "UTF-8")));
                Assert.assertEquals("identifier from DOI status is different", returnedIdentifier, doiStatus.getIdentifier().getText());
                Assert.assertEquals("publicationYear from DOI status is different", expectedPublicationYear, doiStatus.getPublicationYear());
                Assert.assertEquals("title from DOI status is different", expectedTitle.getText(), doiStatus.getTitle().getText());
                Assert.assertEquals("status is incorrect", Status.MINTED, doiStatus.getStatus());
                
                // delete containing folder using doiadmin credentials
                deleteTestFolder(doiNumberParts[1]);

                return resource;
            }
        });
    }
}