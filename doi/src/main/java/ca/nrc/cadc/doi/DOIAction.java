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

import ca.nrc.cadc.auth.AuthenticationUtil;
import ca.nrc.cadc.auth.HttpPrincipal;
import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.rest.InlineContentHandler;
import ca.nrc.cadc.rest.RestAction;
import ca.nrc.cadc.vos.NodeProperty;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.VOSpaceClient;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.util.List;
import java.util.Set;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.jdom2.Namespace;

public abstract class DOIAction extends RestAction {
    private static final Logger log = Logger.getLogger(DOIAction.class);

    protected static final String DOI_BASE_FILEPATH = "/AstroDataCitationDOI/CISTI.CANFAR";
    protected static final String DOI_BASE_VOSPACE = "vos://cadc.nrc.ca!vospace" + DOI_BASE_FILEPATH;
    protected String GMS_URI_BASE = "ivo://cadc.nrc.ca/gms";
    protected static final String CADC_DOI_PREFIX = "10.11570";
    protected static final String CADC_CISTI_PREFIX = "CISTI_CADC_";
    protected static final String DOI_REQUESTER_KEY = "doiRequester";
    protected static final String DOI_MINTED = "minted";
    protected static final String DOI_GROUP_PREFIX = "DOI-";

    // Request types handled in the GetAction, PostAction, DeleteAction classes
    // as of 21/8/18, only some have been implemented. All are named here because
    // the API has been planned out more fully than has been implemented.
    // GetAction
    protected static final String GET_ONE_REQUEST = "getOne";
    protected static final String GET_ALL_REQUEST = "getAll";

    // PostAction
    protected static final String CREATE_REQUEST = "create";
//    protected static final String EDIT_REQUEST = "edit";
//    protected static final String MINT_REQUEST = "mint";

    // DeleteAction
    protected static final String DELETE_REQUEST = "delete";

    protected Subject callingSubject;
    protected String userID;
    protected String requestType;  // from list above
    protected String DOINumInputStr; // value used
    protected Resource resource;
    protected VOSpaceClient vosClient;
    protected VOSURI doiDataURI;
    protected List<NodeProperty> properties;


    public DOIAction() {
        // initialise and debug statements go here...
    }

    /**
     * Parse input documents
     * @return
     */
    @Override
    protected InlineContentHandler getInlineContentHandler() {
        return new DoiInlineContentHandler();
    }


    protected abstract void doActionImpl() throws Exception;

    /**
     * Capture the initial request, and continue any work necessary using a new subject,
     * using doiadmin credentials
     * @throws Exception
     */
    @Override
    public void doAction() throws Exception {

        // Discover what kind of request this is
        initRequest();

        // Store the calling subject so that user principal information can be
        // pulled out in doActionImpl however it needs to be for the action type (GET, POST, DELETE)
        callingSubject = AuthenticationUtil.getCurrentSubject();

        // Get the submitted form data, if it exists
        // which has been put in a JDOM2 Document
        // Set up values needed to access the xml document
        // TODO: may move this into the PostAction doActionImpl if not used outside of that.
        // doiDocument will be used though? (in GetAction? - not finalised however.)
        resource = (Resource)syncInput.getContent(DoiInlineContentHandler.CONTENT_KEY);

        // Create VOSpace data folder using DOI_BASE_VOSPACE
        doiDataURI = new VOSURI(new URI(DOI_BASE_VOSPACE ));
        vosClient = new VOSpaceClient(doiDataURI.getServiceURI());

        // Do all subsequent work as doiadmin...
        File pemFile = new File(System.getProperty("user.home") + "/.ssl/doiadmin.pem");
        Subject doiadminSubject = SSLUtil.createSubject(pemFile);
        Subject.doAs(doiadminSubject, new PrivilegedExceptionAction<Object>() {
            @Override
            public String run() throws Exception {
                doActionImpl();
                return "done";
            }
        } );

    }

    protected void initRequest() throws AccessControlException, IOException {
        final Subject subject = AuthenticationUtil.getCurrentSubject();
        log.debug("Subject: " + subject);
        
        // authorization, for now, is simply being authenticated
        // (grabbed from quarry service...)
        if (subject == null || subject.getPrincipals().isEmpty()) {
            throw new AccessControlException("Unauthorized");
        }
        Set<HttpPrincipal> httpPrincipals = subject.getPrincipals(HttpPrincipal.class);
        if (httpPrincipals.isEmpty()) {
            throw new AccessControlException("No HTTP Principal");
        }
        userID = httpPrincipals.iterator().next().getName();
        
        String path = syncInput.getPath();
        log.debug("http request path: " + path);
        requestType = GET_ALL_REQUEST;
        
        if (path == null) {
            return;
        }

        // Parse the request path to see if a DOI number has been provided
        String[] parts = path.split("/");
        if (parts.length > 0) {
            requestType = CREATE_REQUEST;
            DOINumInputStr = parts[0];
        }
        if (parts.length > 1) {
            throw new IllegalArgumentException("Invalid request: " + path);
        }
        log.debug("request type: " + requestType);
        log.debug("DOI Number: " + DOINumInputStr);
    }

    protected String getDOISuffix(String doiStr) {
        String[] doiParts = doiStr.split("/");
        return doiParts[1];
    }

    protected String getDoiFilename(String suffix) { return CADC_CISTI_PREFIX + suffix + ".xml"; }

    protected String getDoiParentPath(String suffix) { return  doiDataURI.getPath() + "/" + suffix; }

    protected String getDoiNodeUri(String suffix) { return doiDataURI.getURI() + "/" + suffix; }

}
