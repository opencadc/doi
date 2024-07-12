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

import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.net.FileContent;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.util.Log4jInit;
import java.io.File;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.util.HashMap;
import java.util.Map;
import javax.security.auth.Subject;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;
import org.opencadc.vospace.DataNode;
import org.opencadc.vospace.VOS;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.ClientTransfer;
import org.opencadc.vospace.transfer.Direction;
import org.opencadc.vospace.transfer.Protocol;
import org.opencadc.vospace.transfer.Transfer;

/**
 */
public class InitFolderTest extends IntTestBase {
    private static final Logger log = Logger.getLogger(InitFolderTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.DEBUG);
        Log4jInit.setLevel("org.opencadc.vospace", Level.DEBUG);
        Log4jInit.setLevel("org.opencadc.vault", Level.DEBUG);
    }

    /**
     * new folder is created - calling user should have read access but not write
     * new XML file is created - calling user should have read access
     * data folder created - calling user should have write access
     */
    @Test
    public void testInitDoi() {
        try {
            Resource testResource = getTestResource(false, true, true);
            final String testXML = getResourceXML(testResource);

            // Create the folder for the test, and the initial XML file
            Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<Object>) () -> {
                String doiSuffix = null;
                try {
                    FileContent fileContent = new FileContent(testXML, "text/xml", StandardCharsets.UTF_8);
                    Map<String, Object> params = new HashMap<>();
                    params.put("doiMetadata", fileContent);
                    params.put("journalref", TEST_JOURNAL_REF);
                    HttpPost post = new HttpPost(doiServiceURL, params, false);
                    post.run();

                    Assert.assertNull("POST exception", post.getThrowable());
                    Assert.assertEquals("expected 303 response code", 303, post.getResponseCode());
                    String doiPath = post.getRedirectURL().getPath();
                    log.debug("redirectURL path: " + doiPath);

                    // Folder name should be /AstroDataCitationDOI/CISTI.CANFAR/<doiSuffix>
                    String[] doiNumberParts = doiPath.split("/");
                    doiSuffix = doiNumberParts[3];

                    String dataNodeName = String.format("%s/data", doiSuffix);
                    log.debug("write to data folder " + dataNodeName);

                    // Test writing to the data directory
                    String fileName = "doi-test-write-file.txt";
                    String dataFileToWrite = dataNodeName + "/" + fileName;

                    VOSURI target = getVOSURI(dataFileToWrite);
                    DataNode dataNode = new DataNode(fileName);
                    log.debug("PUT target:" + target.getURI());
                    vosClient.createNode(target, dataNode);

                    Transfer transfer = new Transfer(target.getURI(), Direction.pushToVoSpace);
                    Protocol put = new Protocol(VOS.PROTOCOL_HTTPS_PUT);
                    transfer.getProtocols().add(put);

                    log.debug("file to be written: " + dataFileToWrite);
                    ClientTransfer clientTransfer = vosClient.createTransfer(transfer);
                    File testFile = new File("src/intTest/resources/" + fileName);
                    clientTransfer.setFile(testFile);
                    clientTransfer.run();

                    // Check that file is there.
                    String newFilePath = target.getPath();
                    vosClient.getNode(newFilePath);

                    // Test that read only subject CAN'T write to the same folder
                    String writeName = "doi-test-write-failed.txt";
                    final String writeFile = dataNodeName + "/" + writeName;

                    // Try to write to data directory as read only subject
                    Subject.doAs(readOnlySubject, (PrivilegedExceptionAction<Object>) () -> {
                        log.debug("write as read only subject");
                        try {
                            VOSURI target1 = getVOSURI(writeFile);
                            DataNode dataNode1 = new DataNode(writeName);
                            vosClient.createNode(target1, dataNode1);
                        } catch (AccessControlException e) {
                            log.info("expected exception: " + e.getMessage());
                        } catch (Exception e) {
                            Assert.fail("exception writing file: " + e.getMessage());
                        }
                        return null;
                    });
                    return null;
                } finally {
//                    if (doiSuffix != null) {
//                        cleanup(doiSuffix);
//                    }
                }
            });
        } catch (Exception e) {
            log.error("Unexpected exception", e);
            Assert.fail("Unexpected exception: " + e.getMessage());
        }
    }

}