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
************************************************************************
*/

package ca.nrc.cadc.doi;

import ca.nrc.cadc.ac.client.GMSClient;
import ca.nrc.cadc.auth.ACIdentityManager;
import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.vos.Node;
import ca.nrc.cadc.vos.NodeProperty;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.VOSpaceClient;
import java.io.File;
import java.net.URI;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.util.List;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;


public class DeleteAction extends DOIAction {

    private static final Logger log = Logger.getLogger(DeleteAction.class);

    private String DOINumInputStr;
    private VOSpaceClient vosClient;
    protected Resource resource;
    protected List<NodeProperty> properties;

    public DeleteAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {
        // Store calling user information for later reference
        setAuthorisedUser();

        // Discover what kind of request this is
        initRequest();

        // Interact with VOSPACE using DOI_BASE_VOSPACE
        doiDataURI = new VOSURI(new URI(DOI_BASE_VOSPACE ));

        // Do all subsequent work as doiadmin
        File pemFile = new File(System.getProperty("user.home") + "/.ssl/doiadmin.pem");
        Subject doiadminSubject = SSLUtil.createSubject(pemFile);
        Subject.doAs(doiadminSubject, new PrivilegedExceptionAction<Object>() {
            @Override
            public String run() throws Exception {
                // This should be done within the Subject for the user
                // that will be using the client.
                vosClient = new VOSpaceClient(doiDataURI.getServiceURI());
                doActionImpl();
                return "done";
            }
        });
    }


    private void doActionImpl() throws Exception {

        if (DOINumInputStr.equals("")) {
            throw new IllegalArgumentException("DOI number required.");
        }
        else {
            // Get containing node for DOI
            String doiParentPath = getDoiParentPath(DOINumInputStr);
            Node doiContainer = vosClient.getNode(doiParentPath);

            properties = doiContainer.getProperties();
            boolean hasPermission = false;
            for (NodeProperty np: properties) {
                // Check if is already minted (attribute on containing node will be "true"
                if (np.getPropertyURI().equals(DOI_MINTED)) {
                    if (np.getPropertyValue().equals("true")) {
                        throw new AccessControlException("Unable to delete " + DOINumInputStr + "DOI already minted.\n");
                    }
                }
                // Check if user has permission: ensure principals set is same for doiRequester
                // numeric id stored as node attribute as for calling user...
                if (np.getPropertyURI().equals(DOI_REQUESTER_KEY)) {
                    ACIdentityManager acIdentMgr = new ACIdentityManager();
                    // change the numeric id back into a subject and compare to calling subject
                    Subject doiRequesterSubject = acIdentMgr.toSubject(Integer.parseInt(np.getPropertyValue()));

                    if (callingSubject.getPrincipals().equals(doiRequesterSubject.getPrincipals())) {
                        hasPermission = true;
                        break;
                    } else {
                        throw new AccessControlException("User not authorised to delete " + DOINumInputStr + "\n");
                    }
                }
            }

            if (hasPermission == true) {
                // Delete group created. Will be format DOI-<DOINumInputStr>
                GMSClient gmsClient = new GMSClient(new URI(GMS_URI_BASE));
                String doiGroupURI = GMS_URI_BASE + "#" + DOI_GROUP_PREFIX + DOINumInputStr;
                log.debug("deleting this group: " + doiGroupURI);
                gmsClient.deleteGroup(DOI_GROUP_PREFIX + DOINumInputStr);

                log.debug("deleting this node: " + doiParentPath);
                vosClient.deleteNode(doiParentPath);
            } else {
                throw new RuntimeException(DOI_REQUESTER_KEY + " not found on main DOI folder. Unable to determine permissions.\n");
            }

        }
    }

    private void initRequest() {
        String path = syncInput.getPath();
        log.debug("http request path: " + path);

        if (path == null) {
            throw new IllegalArgumentException("Invalid request: " + path);
        }

        // Parse the request path to see if a DOI number has been provided
        String[] parts = path.split("/");
        if (parts.length > 0) {
            DOINumInputStr = parts[0];
        }
        if (parts.length > 1) {
            throw new IllegalArgumentException("Invalid request: " + path);
        }
        log.debug("DOI Number: " + DOINumInputStr);
    }
}
