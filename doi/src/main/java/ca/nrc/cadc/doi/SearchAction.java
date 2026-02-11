/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2025.                            (c) 2025.
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
 *  : 5 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi;

import ca.nrc.cadc.doi.search.DoiSearchFilter;
import ca.nrc.cadc.doi.search.Role;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.rest.InlineContentHandler;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.Node;
import org.opencadc.vospace.NodeProperty;

public class SearchAction extends DoiAction {
    private static final Logger log = Logger.getLogger(SearchAction.class);
    
    private static final List<String>  VALID_KEYS = List.of("role", "status");

    public SearchAction() {
        super();
    }

    /**
     * Action implemented by subclass. The following exceptions, when thrown by this
     * function, are automatically mapped into HTTP errors by RestAction class:
     *
     * <pre>
     * java.lang.IllegalArgumentException : 400
     * ca.nrc.cadc.auth.NotAuthenticatedException : 401
     * java.security.cert.CertificateException : 403 -- should be 401 with a suitable challenge
     * java.security.AccessControlException : 403
     * ca.nrc.cadc.net.ResourceNotFoundException : 404
     * ca.nrc.cadc.net.ResourceAlreadyExistsException : 409
     * ca.nrc.cadc.net.PreconditionFailedException (and subclasses) : 412
     * ca.nrc.cadc.io.ByteLimitExceededException : 413
     * ca.nrc.cadc.net.ExpectationFailedException : 417
     * ca.nrc.cadc.net.TransientException : 503
     * </pre>
     *
     * @throws Exception for standard application failure
     */
    @Override
    public void doAction() throws Exception {
        super.init();
        authorize();

        JSONObject jsonObject = (JSONObject) syncInput.getContent(SearchInlineContentHandler.CONTENT_KEY);
        Set<String> keys = jsonObject.keySet();
        log.info("jsonObject: " + jsonObject.toString(2));
        validateKeys(keys);

        DoiSearchFilter searchFilter = new DoiSearchFilter();
        if (keys.contains("role")) {
            if (!isCallingUserDOIAdmin()) {
                Role role = Role.toValue(jsonObject.getString("role"));
                if (role.equals(Role.PUBLISHER) && publisherGroupURI == null) {
                    role = Role.OWNER;
                }
                searchFilter.setRole(role);
            }
        }
        if (keys.contains("status")) {
            JSONArray jsonArray = jsonObject.getJSONArray("status");
            List<String> statusList = jsonArray.toList().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());
            log.info("statusList: " + statusList);
            searchFilter.prepareStatusList(statusList);
        }

        if ((searchFilter.getRole() == null && searchFilter.getStatusList().isEmpty())
                || callersNumericId == null) {
            getStatusList(getAccessibleDOIs());
        } else {
            getStatusList(getFilteredDOIs(searchFilter));
        }
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
        return new SearchInlineContentHandler();
    }

    private void validateKeys(Set<String> keys) {
        List<String> invalidKeys = new ArrayList<>();
        for (String key : keys) {
            if (!VALID_KEYS.contains(key)) {
                invalidKeys.add(key);
            }
        }
        if (!invalidKeys.isEmpty()) {
            throw new IllegalArgumentException("Invalid parameter key: " + invalidKeys);
        }
    }
    
    private List<Node> getFilteredDOIs(DoiSearchFilter doiSearchFilter) throws Exception {
        List<Node> filteredNodes = new ArrayList<>();
        ContainerNode doiRootNode = vospaceDoiClient.getContainerNode("");
        boolean callingUserPublisher = isCallingUserPublisher();
        boolean callingUserDOIAdmin = isCallingUserDOIAdmin();

        if (doiSearchFilter.getRole() != null
                && doiSearchFilter.getRole().equals(Role.PUBLISHER)
                && !callingUserPublisher) {
            return filteredNodes;
        }

        if (doiRootNode != null) {
            for (Node childNode : doiRootNode.getNodes()) {
                NodeProperty requester = childNode.getProperty(DOI.VOSPACE_DOI_REQUESTER_PROPERTY);
                if (requester == null || requester.getValue() == null) {
                    continue; // Skip nodes without a valid requester
                }

                // Check status filter
                if (!doiSearchFilter.getStatusList().isEmpty()) {
                    NodeProperty statusProp = childNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY);
                    if (statusProp == null || !doiSearchFilter.getStatusList()
                            .contains(Status.toValue(statusProp.getValue()))) {
                        continue; // Skip nodes that don't match the status filter
                    }
                }

                // Check role filter
                if (doiSearchFilter.getRole() != null) {
                    if (doiSearchFilter.getRole().equals(Role.OWNER)) {
                        if (!isCallingUserRequester(childNode)) {
                            continue; // Skip nodes where the caller is not the owner OR DOI Admin
                        }
                    } else if (doiSearchFilter.getRole().equals(Role.PUBLISHER)) {
                        if (isCallingUserRequester(childNode)) {
                            continue; // Skip nodes where the caller is a publisher as well as the owner
                        }

                        NodeProperty statusProp = childNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY);
                        if (statusProp.getValue().equals("minted") && !doiSearchFilter.getStatusList().contains(Status.MINTED)) {
                            continue; // Skip nodes where the status is minted and the caller is a publisher
                        }
                    }
                } else {
                    NodeProperty statusProp = childNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY);

                    // Check if the user is DOI Admin, publisher, or matches the requester
                    if (!statusProp.getValue().equals("minted") && !callingUserDOIAdmin && !callingUserPublisher
                            && !isCallingUserRequester(childNode)) {
                        continue;
                    }
                }

                // Add the node to the filtered list if all conditions are met
                filteredNodes.add(childNode);
            }
        }
        return filteredNodes;
    }

}
