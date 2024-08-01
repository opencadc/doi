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
import ca.nrc.cadc.doi.status.Status;
import java.security.AccessControlException;
import java.security.Principal;
import java.security.PrivilegedExceptionAction;
import java.util.Set;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.opencadc.vospace.ContainerNode;

public class DeleteAction extends DoiAction {

    private static final Logger log = Logger.getLogger(DeleteAction.class);

    public DeleteAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {
        super.init(true);

        // Do all subsequent work as doiadmin
        Subject.doAs(
            getAdminSubject(),
            (PrivilegedExceptionAction<Object>) () -> {
                doActionImpl();
                return null;
            }
        );
    }

    private void doActionImpl() throws Exception {
        if (doiSuffix == null) {
            throw new IllegalArgumentException("DOI number required.");
        }
        if (doiAction != null) {
            throw new IllegalArgumentException("Cannot Delete: Bad request.");
        }

        // Get container node for DOI
        String doiPath = String.format("%s/%s", doiParentPath, doiSuffix);
        ContainerNode doiContainer = (ContainerNode) vospaceDoiClient
            .getVOSpaceClient()
            .getNode(doiPath);

        // check to see if this user has permission
        String doiRequester = doiContainer.getPropertyValue(
            DOI_VOS_REQUESTER_PROP
        );
        if (doiRequester == null) {
            throw new IllegalStateException(
                "No requester associated with DOI: " + doiSuffix
            );
        }
        ACIdentityManager acIdentMgr = new ACIdentityManager();
        Integer numericID = Integer.parseInt(doiRequester);
        Subject requestorSubject = acIdentMgr.toSubject(numericID);
        if (!checkSubjectsMatch(callingSubject, requestorSubject)) {
            // if doiadmin is the calling user, it has permission to delete any of the DOIs as well
            if (!checkSubjectsMatch(callingSubject, getAdminSubject())) {
                throw new AccessControlException("Not permitted to delete DOI");
            }
        }

        // check the state of the doi
        String doiStatus = doiContainer.getPropertyValue(DOI_VOS_STATUS_PROP);
        if (doiStatus != null && doiStatus.equals(Status.MINTED.getValue())) {
            throw new AccessControlException(
                "Unable to delete " + doiSuffix + "DOI already minted.\n"
            );
        }

        // Delete the DOI group. Will be format DOI-<DOINumInputStr>
        String groupToDelete = DOI_GROUP_PREFIX + doiSuffix;
        log.debug("deleting group: " + groupToDelete);
        getGMSClient().deleteGroup(groupToDelete);

        log.debug("deleting node: " + doiPath);
        vospaceDoiClient.getVOSpaceClient().deleteNode(doiPath);
    }

    private boolean checkSubjectsMatch(Subject subA, Subject subB) {
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
}
