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

import ca.nrc.cadc.vos.DataNode;
import ca.nrc.cadc.vos.Direction;
import ca.nrc.cadc.vos.Node;
import ca.nrc.cadc.vos.Protocol;
import ca.nrc.cadc.vos.Transfer;
import ca.nrc.cadc.vos.VOS;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.ClientTransfer;
import java.io.File;
import java.io.FileInputStream;
import java.net.URI;
import java.net.URL;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;

import java.util.ArrayList;
import java.util.List;
import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.DoiXmlReader;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.util.Log4jInit;

/**
 * Integration tests for the recursive setting of node properties.
 *
 * @author majorb
 */
public class InitializeDOIFolderTest extends IntTestBase
{
    private static final Logger log = Logger.getLogger(InitializeDOIFolderTest.class);

    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    public InitializeDOIFolderTest() { }

    @Test
    public void testInitDoi() throws Throwable
    {
        // new folder is created - calling user should have read access but not write
        // new XML file is created - calling user should have read access
        // data folder created - calling user should have write access

        final Subject cadcauthtest_sub = SSLUtil.createSubject(CADCAUTHTEST_CERT);
        final Subject cadcregtest_sub = SSLUtil.createSubject(CADCREGTEST_CERT);

        // read test xml file
        final DoiXmlReader reader = new DoiXmlReader(true);
        String fileName = "src/test/data/datacite-example-full-dummy-identifier-v4.1.xml";
        FileInputStream fis = new FileInputStream(fileName);
        Resource resource = reader.read(fis);
        fis.close();
        
        // write document generated by reader
        final StringBuilder builder = new StringBuilder();
        DoiXmlWriter writer = new DoiXmlWriter();
        writer.write(resource, builder);

        // Create the folder for the test, and the initial XML file
        Subject.doAs(cadcauthtest_sub, new PrivilegedExceptionAction<Object>()
        {
            public Object run() throws Exception
            {
                // post the job
                URL postUrl = new URL(baseURL);

                log.debug("baseURL: " + baseURL);
                log.debug("posting to: " + postUrl);
                
                HttpPost httpPost = new HttpPost(postUrl, builder.toString(), "text/xml", false);
                httpPost.run();
                
                // Check that there was no exception thrown
                if (httpPost.getThrowable() != null)
                    throw new RuntimeException(httpPost.getThrowable());

                // Check that the HttpPost was sent successfully
                Assert.assertEquals("HttpPost failed, return code = " + httpPost.getResponseCode(), httpPost.getResponseCode(), 303);
                URL redirectUrl = httpPost.getRedirectURL();
                // Pull the next DOI number from the redirect returned
                String returnedDoc = redirectUrl.getPath();

                log.debug("redirect url returned from post: " + returnedDoc);

                String[] doiNumberParts = returnedDoc.split("/");
                // Folder name should be /AstroDataCitationDOI/CISTI.CANFAR/<doiSuffix>
                String doiSuffix = doiNumberParts[3];

                // Check access permissions for DOI Containing folder (get DOI & parse suffix from
                // <identifier> in document)

                String dataNodeName = DOI_BASE_NODE + "/" + doiSuffix + "/data";
                log.debug("Atempting to write to " + dataNodeName);

                // Test writing to the data directory
                final List<Protocol> protocols = new ArrayList<Protocol>();
                protocols.add(new Protocol(VOS.PROTOCOL_HTTPS_PUT));
                String fileName = "doi-test-write-file.txt";
                String dataFileToWrite = dataNodeName + "/" + fileName;

                VOSURI target = new VOSURI(new URI(dataFileToWrite));
                Node doiFileDataNode = new DataNode(target);
                vosClient.createNode(doiFileDataNode);

                Transfer transfer = new Transfer(new URI(dataFileToWrite), Direction.pushToVoSpace, protocols);
                log.debug("file to be written: " + dataFileToWrite);
                ClientTransfer clientTransfer = vosClient.createTransfer(transfer);
                File testFile = new File("src/test/data/" + fileName);
                clientTransfer.setFile(testFile);
                clientTransfer.run();

                // Check that file is there.
                String newFilePath = target.getPath();
                vosClient.getNode(newFilePath);

                // Test that cadcRegtest1 CAN'T write to the same folder

                final String writeFile = dataNodeName + "/doi-test-write-file-2.txt";
                final String testFilename = "doi-test-write-file-2.txt";

                // Try to write to data directory as regtest
                Subject.doAs(cadcregtest_sub, new PrivilegedExceptionAction<Object>() {
                    public Object run() throws Exception {
                        log.debug("Trying as cadcregtest");
                        try {
                            VOSURI target = new VOSURI(new URI(writeFile));
                            Node doiFileDataNode = new DataNode(target);
                            vosClient.createNode(doiFileDataNode);
                        } catch (AccessControlException ace) {
                            log.info("expected exception: " + ace);
                        } catch (Exception e) {
                            log.info("some other error occurred");
                            Assert.fail();
                        }

                        return "done";
                    }
                });

                deleteTestFolder(doiSuffix);
                return "done";
            }
        });

    }
}