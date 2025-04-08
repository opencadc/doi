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
************************************************************************
*/

package ca.nrc.cadc.doi;

import ca.nrc.cadc.ac.ACIdentityManager;
import ca.nrc.cadc.ac.client.GMSClient;
import ca.nrc.cadc.auth.AuthenticationUtil;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.io.DoiParsingException;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.net.InputStreamWrapper;
import ca.nrc.cadc.net.ResourceNotFoundException;
import ca.nrc.cadc.util.StringUtil;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.security.AccessControlException;
import java.util.Set;
import javax.security.auth.Subject;
import javax.security.auth.x500.X500Principal;
import org.apache.log4j.Logger;
import org.opencadc.gms.GroupURI;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.DataNode;
import org.opencadc.vospace.Node;
import org.opencadc.vospace.NodeNotFoundException;
import org.opencadc.vospace.VOS;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.ClientTransfer;
import org.opencadc.vospace.client.VOSpaceClient;
import org.opencadc.vospace.client.async.RecursiveDeleteNode;
import org.opencadc.vospace.transfer.Direction;
import org.opencadc.vospace.transfer.Protocol;
import org.opencadc.vospace.transfer.Transfer;

public class VospaceDoiClient {

    private static final Logger log = Logger.getLogger(VospaceDoiClient.class);

    private final Long callersNumericId;
    private VOSpaceClient vosClient = null;
    private VOSURI baseDataURI = null;
    private String xmlFilename = "";
    private boolean includePublicNodes = false;
    private GroupURI reviewerGroupURI = null;
    private URI gmsResourceID = null;

    public VospaceDoiClient(URI resourceID, String doiParentPath, Subject callingSubject,
                            Boolean includePublicNodes, GroupURI reviewerGroupURI, URI gmsResourceID) {
        this.baseDataURI = new VOSURI(resourceID, doiParentPath);
        this.vosClient = new VOSpaceClient(baseDataURI.getServiceURI());
        this.reviewerGroupURI = reviewerGroupURI;
        this.gmsResourceID = gmsResourceID;

        ACIdentityManager acIdentMgr = new ACIdentityManager();
        this.callersNumericId = (Long) acIdentMgr.toOwner(callingSubject);
        if (includePublicNodes != null) {
            this.includePublicNodes = includePublicNodes;
        }
    }

    public VOSpaceClient getVOSpaceClient() {
        return this.vosClient;
    }

    public VOSURI getDoiBaseVOSURI() {
        return this.baseDataURI;
    }

    public ContainerNode getContainerNode(String path)
            throws NodeNotFoundException, AccessControlException {
        String nodePath = baseDataURI.getPath();
        if (StringUtil.hasText(path)) {
            nodePath = nodePath + "/" + path;
        }
        ContainerNode requestedNode = null;

        try {
            requestedNode = (ContainerNode) vosClient.getNode(nodePath);
        } catch (AccessControlException ef) {
            throw ef;
        } catch (ResourceNotFoundException e) {
            throw new NodeNotFoundException(e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }

        return requestedNode;
    }

    public DataNode getDataNode(String path)
            throws NodeNotFoundException, AccessControlException {
        String nodePath = baseDataURI.getPath();
        if (StringUtil.hasText(path)) {
            nodePath = nodePath + "/" + path;
        }
        DataNode requestedNode = null;

        try {
            requestedNode = (DataNode) vosClient.getNode(nodePath);
        } catch (AccessControlException ef) {
            throw ef;
        } catch (ResourceNotFoundException e) {
            throw new NodeNotFoundException(e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }

        return requestedNode;
    }

    public Resource getResource(String doiSuffixString, String doiFilename)
            throws Exception {
        VOSURI docDataURI = new VOSURI(baseDataURI.toString() + "/" + doiSuffixString + "/" + doiFilename);

        return getDoiDocFromVOSpace(docDataURI);
    }

    //  doi admin should have access as well
    public boolean isCallerAllowed(Node node, Subject adminSubject) {
        boolean isRequesterNode = false;
        if (this.includePublicNodes && node.isPublic != null && node.isPublic) {
            return true;
        } else if (reviewerGroupURI != null) {
            GMSClient gmsClient = new GMSClient(gmsResourceID);

            if (gmsClient.isMember(reviewerGroupURI)) {
                return true;
            }
        }

        X500Principal adminX500 = AuthenticationUtil.getX500Principal(adminSubject);
        String requester = node.getPropertyValue(DoiAction.DOI_VOS_REQUESTER_PROP);
        log.debug("requester for node: " + requester);
        if (callersNumericId != null && StringUtil.hasText(requester)) {
            isRequesterNode = requester.equals(callersNumericId.toString());
            Set<X500Principal> xset = AuthenticationUtil.getCurrentSubject().getPrincipals(X500Principal.class);
            for (X500Principal p : xset) {
                isRequesterNode = isRequesterNode || AuthenticationUtil.equals(p, adminX500);
            }
        }

        return isRequesterNode;
    }

    private Resource getDoiDocFromVOSpace(VOSURI dataNode) throws Exception {

        Transfer transfer = new Transfer(dataNode.getURI(), Direction.pullFromVoSpace);
        Protocol put = new Protocol(VOS.PROTOCOL_HTTPS_GET);
        //put.setSecurityMethod(Standards.SECURITY_METHOD_CERT);
        transfer.getProtocols().add(put);
        
        xmlFilename = dataNode.getPath();
        ClientTransfer clientTransfer = vosClient.createTransfer(transfer);
        DoiInputStream doiStream = new DoiInputStream();
        clientTransfer.setInputStreamWrapper(doiStream);
        clientTransfer.run();

        if (clientTransfer.getThrowable() != null) {
            log.debug(clientTransfer.getThrowable().getMessage());
            // Get the message from the cause as it has far more context than
            // the throwable itself
            String message = clientTransfer.getThrowable().getMessage();
            if (message.contains("NodeNotFound")) {
                throw new ResourceNotFoundException(message, clientTransfer.getThrowable());
            }
            if (message.contains("PermissionDenied")) {
                throw new AccessControlException(message);
            }
            throw new RuntimeException(clientTransfer.getThrowable());
        }

        return doiStream.getResource();
    }

    private class DoiInputStream implements InputStreamWrapper {
        private Resource resource;

        public DoiInputStream() {
        }

        public void read(InputStream in) throws IOException {
            try {
                DoiXmlReader reader = new DoiXmlReader(true);
                resource = reader.read(in);
            } catch (DoiParsingException dpe) {
                throw new IOException("Error parsing " + xmlFilename + ": ", dpe);
            }
        }

        public Resource getResource() {
            return resource;
        }
    }

    public void deleteNode(String doiSuffix) {
        try {
            VOSURI nodeUri = new VOSURI(baseDataURI.toString() + "/" + doiSuffix);
            log.debug("recursiveDeleteNode: " + nodeUri);

            RecursiveDeleteNode recursiveDeleteNode = getVOSpaceClient().createRecursiveDelete(nodeUri);
            recursiveDeleteNode.setMonitor(true);
            recursiveDeleteNode.run();
        } catch (AccessControlException e) {
            log.error("unexpected AccessControlException: ", e);
        } catch (Exception e) {
            log.error("unexpected exception", e);
        }
    }
}
