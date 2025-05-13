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
*  $Revision: 5 $
*
************************************************************************
*/

package ca.nrc.cadc.doi;

import ca.nrc.cadc.auth.AuthMethod;
import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.io.DoiXmlWriter;
import ca.nrc.cadc.net.FileContent;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.reg.Standards;
import ca.nrc.cadc.reg.client.RegistryClient;
import ca.nrc.cadc.util.FileUtil;
import ca.nrc.cadc.util.Log4jInit;
import ca.nrc.cadc.util.StringUtil;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.AccessControlException;
import java.security.PrivilegedActionException;
import java.security.PrivilegedExceptionAction;
import java.util.HashMap;
import java.util.Map;
import javax.security.auth.Subject;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.DataNode;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.VOSpaceClient;
import org.opencadc.vospace.client.async.RecursiveDeleteNode;

/**
 * Integration tests generating DOI folders in VOSpace
 *
 * @author jeevesh
 */
public abstract class IntTestBase extends TestBase {
    private static final Logger log = Logger.getLogger(IntTestBase.class);

    static final String JSON = "application/json";
    static final String XML = "text/xml";
    static final String TEST_JOURNAL_REF = "2018, Test Journal ref. ApJ 1000,100";

    static Subject adminSubject;
    static Subject readWriteSubject;
    static Subject readOnlySubject;
    static Subject publisherSubject;
    static URL doiServiceURL;
    static URL doiAltServiceURL;
    static URL doiSearchServiceURL;
    static VOSpaceClient vosClient;
    static VOSpaceClient doiAltVosClient;
    static VOSURI doiParentPathURI;
    static VOSURI doiAltParentPathURI;

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    @BeforeClass
    public static void staticInit() {
        adminSubject = SSLUtil.createSubject(FileUtil.getFileFromResource(TestUtil.ADMIN_CERT, IntTestBase.class));
        readWriteSubject = SSLUtil.createSubject(FileUtil.getFileFromResource(TestUtil.AUTH_CERT, IntTestBase.class));
        readOnlySubject = SSLUtil.createSubject(FileUtil.getFileFromResource(TestUtil.NO_AUTH_CERT, IntTestBase.class));
        publisherSubject = SSLUtil.createSubject(FileUtil.getFileFromResource(TestUtil.PUBLISHER_CERT, IntTestBase.class));

        RegistryClient regClient = new RegistryClient();
        doiServiceURL = regClient.getServiceURL(TestUtil.DOI_RESOURCE_ID, Standards.DOI_INSTANCES_10, AuthMethod.CERT);
        doiParentPathURI = new VOSURI(TestUtil.DOI_VOSPACE_RESOURCE_ID, TestUtil.DOI_PARENT_PATH);
        vosClient = new VOSpaceClient(TestUtil.DOI_VOSPACE_RESOURCE_ID);

        doiAltServiceURL = regClient.getServiceURL(TestUtil.DOI_ALT_RESOURCE_ID, Standards.DOI_INSTANCES_10, AuthMethod.CERT);
        doiAltParentPathURI = new VOSURI(TestUtil.DOI_ALT_RESOURCE_ID, TestUtil.DOI_ALT_PARENT_PATH);
        doiAltVosClient = new VOSpaceClient(TestUtil.DOI_ALT_VOSPACE_RESOURCE_ID);
        doiSearchServiceURL = regClient.getServiceURL(TestUtil.DOI_ALT_RESOURCE_ID, Standards.DOI_SEARCH_10, AuthMethod.CERT);
    }

    protected VOSURI getVOSURI(String path, DOISettingsType doiSettingsType) {
        switch (doiSettingsType){
            case ALT_DOI:
                return new VOSURI(TestUtil.DOI_ALT_VOSPACE_RESOURCE_ID, String.format("%s/%s", TestUtil.DOI_ALT_PARENT_PATH, path));
            case DOI:
            default:
                return new VOSURI(TestUtil.DOI_VOSPACE_RESOURCE_ID, String.format("%s/%s", TestUtil.DOI_PARENT_PATH, path));
        }
    }

    protected VOSpaceClient getVOSClient(DOISettingsType doiSettingsType){
        switch (doiSettingsType){
            case ALT_DOI:
                return doiAltVosClient;
            case DOI:
            default:
                return vosClient;
        }
    }

    protected URL getDoiServiceURL(DOISettingsType doiSettingsType){
        switch (doiSettingsType){
            case ALT_DOI:
                return doiAltServiceURL;
            case DOI:
            default:
                return doiServiceURL;
        }
    }

    protected VOSURI getDoiParentPathURI(DOISettingsType doiSettingsType){
        switch (doiSettingsType){
            case ALT_DOI:
                return doiAltParentPathURI;
            case DOI:
            default:
                return doiParentPathURI;
        }
    }

    protected String getDOISuffix(String doiIdentifier) {
        String [] parts = doiIdentifier.split("/");
        if (parts.length != 2) {
            throw new IllegalArgumentException("expected DOI identifier [prefix/suffix], found: " + doiIdentifier);
        }
        return parts[1];
    }

    protected String getResourceXML(Resource resource) throws IOException {
        StringBuilder sb = new StringBuilder();
        DoiXmlWriter writer = new DoiXmlWriter();
        writer.write(resource, sb);
        return sb.toString();
    }

    protected ContainerNode createContainerNode(String path, String name, DOISettingsType doiSettingsType) throws Exception {
        ContainerNode node = new ContainerNode(name);
        VOSURI nodeURI = getVOSURI(path, doiSettingsType);
        return (ContainerNode) getVOSClient(doiSettingsType).createNode(nodeURI, node);
    }

    protected DataNode createDataNode(String path, String name, DOISettingsType doiSettingsType) throws Exception {
        DataNode node = new DataNode(name);
        VOSURI nodeURI = getVOSURI(path, doiSettingsType);
        return (DataNode) getVOSClient(doiSettingsType).createNode(nodeURI, node);
    }

    protected ContainerNode getContainerNode(String path, VOSURI doiParentPathURI,  VOSpaceClient vosClient) throws Exception {
        String nodePath = doiParentPathURI.getPath();
        if (StringUtil.hasText(path)) {
            nodePath = String.format("%s/%s", nodePath, path);
        }
        return (ContainerNode) vosClient.getNode(nodePath);
    }

    protected String postDOI(URL postUrl, String doiXML, String journalRef)
            throws Exception {
        Map<String, Object> params = new HashMap<>();
        if (StringUtil.hasText(doiXML)) {
            FileContent fileContent = new FileContent(doiXML, XML, StandardCharsets.UTF_8);
            params.put("doiMetadata", fileContent);
        }
        if (journalRef != null) {
            params.put("journalref", journalRef);
        }

        HttpPost post = new HttpPost(postUrl, params, true);
        post.prepare();

        Assert.assertNull("POST exception", post.getThrowable());
        Assert.assertEquals("non 200 response code", 200, post.getResponseCode());
        return new String(post.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }

    protected void cleanup(String doiSuffix, DOISettingsType doiSettingsType) {
        // delete doi as admin
        try {
            Subject.doAs(adminSubject, (PrivilegedExceptionAction<Object>) () -> {
                log.debug("cleanup as doi admin");
                try {
                    VOSURI nodeUri = getVOSURI(doiSuffix, doiSettingsType);
                    log.debug("recursiveDeleteNode: " + nodeUri);
                    RecursiveDeleteNode recursiveDeleteNode = getVOSClient(doiSettingsType).createRecursiveDelete(nodeUri);
                    recursiveDeleteNode.setMonitor(true);
                    recursiveDeleteNode.run();
                    log.debug(String.format("RecursiveDeleteNode done, phase: %s  exception: %s",
                            recursiveDeleteNode.getPhase(), recursiveDeleteNode.getException()));
                    log.debug("deleted node: " + nodeUri.getPath());
                } catch (AccessControlException e) {
                    log.error("unexpected AccessControlException: ", e);
                    Assert.fail("unexpected AccessControlException: " + e);
                } catch (Exception e) {
                    log.error("unexpected exception", e);
                    Assert.fail("unexpected exception: " + e);
                }
                return null;
            });
        } catch (PrivilegedActionException e) {
            log.error("unexpected PrivilegedActionException: ", e);
        }
    }

}