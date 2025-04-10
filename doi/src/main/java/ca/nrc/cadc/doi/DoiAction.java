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
import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.cred.client.CredUtil;
import ca.nrc.cadc.net.ResourceAlreadyExistsException;
import ca.nrc.cadc.net.ResourceNotFoundException;
import ca.nrc.cadc.reg.Standards;
import ca.nrc.cadc.reg.client.LocalAuthority;
import ca.nrc.cadc.rest.InlineContentHandler;
import ca.nrc.cadc.rest.RestAction;
import ca.nrc.cadc.util.MultiValuedProperties;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.security.AccessControlException;
import java.security.Principal;
import java.security.cert.CertificateExpiredException;
import java.security.cert.CertificateNotYetValidException;
import java.util.Set;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.opencadc.gms.GroupURI;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.NodeNotSupportedException;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.io.NodeParsingException;

public abstract class DoiAction extends RestAction {
    private static final Logger log = Logger.getLogger(DoiAction.class);

    public static final URI DOI_VOS_JOB_URL_PROP = URI.create("ivo://cadc.nrc.ca/vospace/doi#joburl");
    public static final URI DOI_VOS_REQUESTER_PROP = URI.create("ivo://cadc.nrc.ca/vospace/doi#requester");
    public static final URI DOI_VOS_STATUS_PROP = URI.create("ivo://cadc.nrc.ca/vospace/doi#status");
    public static final URI DOI_VOS_JOURNAL_PROP = URI.create("ivo://cadc.nrc.ca/vospace/doi#journalref");

    public static final String STATUS_ACTION = "status";
    public static final String MINT_ACTION = "mint";
    public static final String JOURNALREF_PARAM = "journalref";
    public static final String DOI_GROUP_PREFIX = "DOI-";
    public static final String TEST_DOI_GROUP_PREFIX = "TEST.DOI-";

    protected Subject callingSubject;
    protected Long callersNumericId;
    protected String doiSuffix;
    protected String doiAction;
    protected Boolean includePublic = false;
    protected Boolean allPublic = false;
    protected VospaceDoiClient vospaceDoiClient;
    protected MultiValuedProperties config;
    protected URI vaultResourceID;
    protected URI gmsResourceID;
    protected String accountPrefix;
    protected String parentPath;
    protected GroupURI reviewerGroupURI;
    protected Boolean selfPublish = true;
    protected String doiIdentifierPrefix;

    public DoiAction() {
    }

    /**
     * Parse input documents
     * For DOI minting, the service will use the DataCite test system to register the DOI
     * and to make the DOI findable. 
     * For DOI deletion, the service could delete the DOI irrespective of its status. 
     * However this has not been implemented.
     */
    @Override
    protected InlineContentHandler getInlineContentHandler() {
        return new DoiInlineContentHandler();
    }
    
    protected void init(boolean authorize)
            throws URISyntaxException, UnknownHostException {
        // load doi properties
        this.config = DoiInitAction.getConfig();
        this.vaultResourceID = DoiInitAction.getVospaceResourceID(config);
        this.parentPath = DoiInitAction.getParentPath(config);
        this.accountPrefix = config.getFirstPropertyValue(DoiInitAction.DATACITE_ACCOUNT_PREFIX_KEY);
        this.reviewerGroupURI = DoiInitAction.getReviewerGroupURI(config);
        this.doiIdentifierPrefix = DoiInitAction.getDoiIdentifierPrefix(config);

        String selfPublishProperty = config.getFirstPropertyValue(DoiInitAction.SELF_PUBLISH_KEY);
        this.selfPublish = selfPublishProperty == null || Boolean.parseBoolean(selfPublishProperty);

        LocalAuthority localAuthority = new LocalAuthority();
        Set<URI> gmsServices = localAuthority.getServiceURIs(Standards.GMS_SEARCH_10);
        if (gmsServices.isEmpty()) {
            throw new IllegalStateException("GMS service not found");
        } else if (gmsServices.size() > 1) {
            throw new IllegalStateException("multiple GMS services found");
        }
        this.gmsResourceID = gmsServices.iterator().next();

        // get calling subject
        callingSubject = AuthenticationUtil.getCurrentSubject();
        logInfo.setSubject(callingSubject);

        parsePath();

        ACIdentityManager acIdentMgr = new ACIdentityManager();
        this.callersNumericId = (Long) acIdentMgr.toOwner(callingSubject);
        this.vospaceDoiClient = new VospaceDoiClient(vaultResourceID, parentPath,
                callingSubject, includePublic, reviewerGroupURI, gmsResourceID);

        if (authorize) {
            authorizeUser(callingSubject);
        }
    }

    protected String getDoiFilename(String suffix) {
        return String.format("%s%s.xml",
                config.getFirstPropertyValue(DoiInitAction.METADATA_PREFIX_KEY), suffix);
    }

    protected VOSURI getVOSURI(String path) {
        return new VOSURI(vaultResourceID, String.format("%s/%s", parentPath, path));
    }

    protected GMSClient getGMSClient() {
        return new GMSClient(gmsResourceID);
    }

    protected Subject getAdminSubject() {
        return SSLUtil.createSubject(new File("/config/doiadmin.pem"));
    }

    private void authorizeUser(Subject s) {
        try {
            CredUtil.checkCredentials(s);
        } catch (CertificateExpiredException | CertificateNotYetValidException e) {
            throw new RuntimeException("Failed to check credentials: ", e);
        }
        // authorization, for now, is defined as having a set of principals
        if (s == null || s.getPrincipals().isEmpty()) {
            throw new AccessControlException("Unauthorized");
        }

        if (doiSuffix == null) {
            return; // DOI Initialization does not require authorization
        }

        if (checkSubjectsMatch(s, getAdminSubject())) {
            return; // Doi Admin has full access
        }

        if (this instanceof PostAction) {
            if (doiAction != null && doiAction.equals(DoiAction.MINT_ACTION) && !selfPublish) {
                if (isCallingUserReviewer() && !isCallingUserRequester()) {
                    return;
                } else {
                    throw new AccessControlException("Mint Action is not permitted for DOI : " + doiSuffix);
                }
            }
            if (isCallingUserRequester()) {
                return;
            }
        } else if (this instanceof DeleteAction) {
            if (isCallingUserRequester()) {
                return;
            } else if (reviewerGroupURI != null && isCallingUserReviewer()) {
                return;
            }
        }

        throw new AccessControlException("Not authorized to access this resource.");
    }

    private void parsePath() {
        String path = syncInput.getPath();
        logInfo.setPath(path);

        if (syncInput.getParameter("view") != null) {
            allPublic = true;
            return;
        }

        if (path != null) {
            String[] parts = path.split("/");
            // Parse the request path to see if a DOI suffix has been provided
            // A full DOI number for CANFAR will be: 10.11570/<DOISuffix>
            if (parts.length > 3) {
                throw new IllegalArgumentException("Bad request: " + path);
            }
            if (parts.length > 0) {
                doiSuffix = parts[0];
                if (parts.length > 1) {
                    doiAction = parts[1];
                }
                // For status requests for individual DOIs, there is need to check
                // to see if the DOI is public in order to provide access.
                if (parts.length > 2 && (parts[2].equals("public"))) {
                    includePublic = true;
                }
            }
        }
    }

    protected boolean checkSubjectsMatch(Subject subA, Subject subB) {
        Set<Principal> subAPrincipals = subA.getPrincipals();
        Set<Principal> subBPrincipals = subB.getPrincipals();

        for (Principal subAPrincipal : subAPrincipals) {
            if (subBPrincipals.contains(subAPrincipal)) {
                // Return if one of the principals matches
                return true;
            }
        }
        return false;
    }

    protected ContainerNode getDoiContainer(String doiPath) {
        ContainerNode doiContainer;
        try {
            doiContainer = (ContainerNode) vospaceDoiClient.getVOSpaceClient().getNode(doiPath);
        } catch (IOException | InterruptedException | NodeParsingException | NodeNotSupportedException |
                 ResourceAlreadyExistsException | ResourceNotFoundException e) {
            throw new RuntimeException("Failed to get DOI Container from DOI Path: " + doiPath, e);
        }
        return doiContainer;
    }

    protected boolean isCallingUserReviewer() {
        if (reviewerGroupURI != null) {
            return getGMSClient().isMember(reviewerGroupURI);
        }
        return false;
    }

    protected boolean isCallingUserRequester() {
        String doiPath = String.format("%s/%s", parentPath, doiSuffix);
        ContainerNode doiContainer = getDoiContainer(doiPath);
        Subject requestorSubject = getRequesterSubject(doiContainer);

        return checkSubjectsMatch(callingSubject, requestorSubject);
    }

    protected Subject getRequesterSubject(ContainerNode doiContainer) {
        String doiRequester = doiContainer.getPropertyValue(DOI_VOS_REQUESTER_PROP);

        if (doiRequester == null) {
            throw new IllegalStateException("No requester associated with DOI: " + doiSuffix);
        }

        ACIdentityManager acIdentityManager = new ACIdentityManager();
        Integer numericID = Integer.parseInt(doiRequester);
        return acIdentityManager.toSubject(numericID);
    }
}
