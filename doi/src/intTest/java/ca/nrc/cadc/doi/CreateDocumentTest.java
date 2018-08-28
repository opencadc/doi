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

import java.io.File;
import java.io.FileInputStream;
import java.net.URI;
import java.net.URL;
import java.security.PrivilegedExceptionAction;

import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.jdom2.Document;
import org.jdom2.Element;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import ca.nrc.cadc.auth.AuthMethod;
import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.reg.Standards;
import ca.nrc.cadc.reg.client.RegistryClient;
import ca.nrc.cadc.util.FileUtil;
import ca.nrc.cadc.util.Log4jInit;

/**
 * Integration tests for the recursive setting of node properties.
 *
 * @author majorb
 */
public class CreateDocumentTest
{
    private static final Logger log = Logger.getLogger(CreateDocumentTest.class);

    private static URI DOI_RESOURCE_ID = URI.create("ivo://cadc.nrc.ca/doi");
    private static File SSL_CERT;
    private static String baseURL;

    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    public CreateDocumentTest() { }

    @BeforeClass
    public static void staticInit() throws Exception
    {
        SSL_CERT = FileUtil.getFileFromResource("x509_CADCAuthtest1.pem", CreateDocumentTest.class);
        
        RegistryClient rc = new RegistryClient();
        URL doi = rc.getServiceURL(DOI_RESOURCE_ID, Standards.DOI_INSTANCES_10, AuthMethod.CERT);
        baseURL = doi.toExternalForm();
    }

    @Test
    public void testCreateDocument() throws Throwable
    {
        final Subject s = SSLUtil.createSubject(SSL_CERT);

        // read test xml file
        final DoiXmlReader reader = new DoiXmlReader(true);
        String fileName = "src/test/data/datacite-example-full-dummy-identifier-v4.1.xml";
        FileInputStream fis = new FileInputStream(fileName);
        Document testDoc = reader.read(fis);
        fis.close();
        
        // Ensure that the test xml document does not contain an identifier
        Element rootElement = testDoc.getRootElement();
        Element dummyIdentifierElement = rootElement.getChild("identifier", rootElement.getNamespace());
        final String dummyIdentifier = dummyIdentifierElement.getText();
        log.info("doi identifier of test document is " + dummyIdentifier);
        
        // write document generated by reader
        final StringBuilder builder = new StringBuilder();
        DoiXmlWriter writer = new DoiXmlWriter();
        writer.write(testDoc, builder);

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
                Document doc = reader.read(returnedDoc);
                Element root = doc.getRootElement();
                Element identifier = root.getChild("identifier", root.getNamespace());
                String returnedIdentifier = identifier.getText();
                log.debug("doi identifier of created document is " + returnedIdentifier);
                Assert.assertFalse("New identifier not received from doi service.", dummyIdentifier.equals(returnedIdentifier));
                return doc;
            }
        });
    }
}