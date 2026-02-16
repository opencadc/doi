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

import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.util.Log4jInit;
import java.security.PrivilegedExceptionAction;
import javax.security.auth.Subject;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;
import org.opencadc.vospace.Node;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.VOSpaceClient;

public class AltStatusTest extends LifecycleTest {
    private static final Logger log = Logger.getLogger(AltStatusTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    @Override
    public void testLifecycle() throws Exception {
        // skip re-running the lifecycle test
    }

    @Test
    public void testUpdateStatus() {
        try {
            final VOSpaceClient vosClient = getVOSClient(DOISettingsType.ALT_DOI);
            final VOSURI doiParentPathURI = getDoiParentPathURI(DOISettingsType.ALT_DOI);
            final Resource expected = getTestResource(true, true);
            log.debug("test resource: " + expected);

            final String doiSuffix = Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

                // create a new DOI
                Resource actual = create(expected, DOISettingsType.ALT_DOI);
                String doiID = getDOISuffix(actual.getIdentifier().getValue());
                Assert.assertTrue(doiID.startsWith(TestUtil.DOI_ALT_IDENTIFIER_PREFIX));
                log.debug("submitter - created doiID: " + doiID);

                // submitter updates status to 'review ready'
                log.debug("submitter - update status to 'review ready'");
                updateStatus(doiID, Status.REVIEW_READY, true);
                Node doiNode = getContainerNode(doiID, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.REVIEW_READY);
                log.debug("submitter - checked status");

                // 'review ready' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("submitter - checked permissions");

                // submitter can update status to 'in progress' from 'review ready'
                log.debug("submitter - update status to 'in progress'");
                updateStatus(doiID, Status.DRAFT, true);
                doiNode = getContainerNode(doiID, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.DRAFT);
                log.debug("submitter - checked status");

                // 'in progress' node permissions, doi-group:rw reviewer-group:- public:false
                checkPermissions(doiNode, false, false, 1,1);
                log.debug("submitter - checked permissions");

                // submitter updates status to 'review ready' so a reviewer can review
                log.debug("submitter - update status to 'review ready'");
                updateStatus(doiID, Status.REVIEW_READY, true);
                doiNode = getContainerNode(doiID, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.REVIEW_READY);
                log.debug("submitter - checked status");

                // 'review ready' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("submitter - checked permissions");

                return doiID;
            });

            Subject.doAs(publisherSubject, (PrivilegedExceptionAction<Object>) () -> {

                // reviewer updates status to 'in review'
                log.debug("publisher - update status to 'in review'");
                updateStatus(doiSuffix, Status.IN_REVIEW, true);
                Node doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.IN_REVIEW);
                log.debug("publisher - checked status");

                // 'inready' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("publisher - checked permissions");

                // reviewer updates status back to 'in progress'
                log.debug("publisher - update status to 'in progress'");
                updateStatus(doiSuffix, Status.DRAFT, false);
                // reviewer can't view when 'in progress'

                return null;
            });

            Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

                // submitter checks status is 'in progress'
                Node doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.DRAFT);
                log.debug("submitter - checked status");

                // 'in progress' node permissions, doi-group:rw reviewer-group:- public:false
                checkPermissions(doiNode, false, false, 1,1);
                log.debug("submitter - checked permissions");

                // submitter updates status to 'review ready'
                log.debug("submitter - update status to 'review ready'");
                updateStatus(doiSuffix, Status.REVIEW_READY, true);
                doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.REVIEW_READY);
                log.debug("submitter - checked status");

                // 'review ready' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("submitter - checked permissions");

                return null;
            });

            Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {

                // update status = 'in review'
                log.debug("publisher - update status to 'in review'");
                updateStatus(doiSuffix, Status.IN_REVIEW, true);
                Node doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.IN_REVIEW);
                log.debug("publisher - checked status");

                // 'in review' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("publisher - checked permissions");

                // update status = 'rejected'
                log.debug("publisher - update status to 'rejected");
                updateStatus(doiSuffix, Status.REJECTED, true);
                doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.REJECTED);
                log.debug("publisher - checked status");

                // 'rejected' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("publisher - checked permissions");

                return null;
            });

            Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

                // update status = 'in progress'
                log.debug("submitter - update status to 'in progress");
                updateStatus(doiSuffix, Status.DRAFT, true);
                // reviewer can't view when 'in progress'

                // submitter checks status is 'in progress'
                Node doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.DRAFT);
                log.debug("submitter - checked status");

                // 'in progress' node permissions, doi-group:rw reviewer-group:- public:false
                checkPermissions(doiNode, false, false, 1,1);
                log.debug("submitter - checked permissions");

                // update status = 'review ready'
                log.debug("submitter - update status to 'review ready");
                updateStatus(doiSuffix, Status.REVIEW_READY, true);
                doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.REVIEW_READY);
                log.debug("submitter - checked status");

                // 'review ready' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("submitter - checked permissions");

                return null;
            });

            Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {

                // update status = 'in review'
                log.debug("publisher - update status to 'in review");
                updateStatus(doiSuffix, Status.IN_REVIEW, true);
                Node doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.IN_REVIEW);
                log.debug("publisher - checked status");

                // 'review ready' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("publisher - checked permissions");

                // update status = 'approved'
                log.debug("publisher - update status to 'approved");
                updateStatus(doiSuffix, Status.APPROVED, true);
                doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);
                checkStatus(doiNode, Status.APPROVED);
                log.debug("publisher - checked status");

                // 'approved' node permissions, doi-group:r reviewer-group:r public:false
                checkPermissions(doiNode, false, false, 2,0);
                log.debug("publisher - checked permissions");

                return null;
            });

        } catch (Exception unexpected) {
            log.debug("unexpected error: " + unexpected);
            Assert.fail("unexpected error: " + unexpected.getMessage());
        }
    }

    void checkPermissions(Node doiNode, boolean isLocked, boolean isPublic,
                          int readOnlyGroups, int readWriteGroups) {

        if (isLocked) {
            Assert.assertNotNull(doiNode.isLocked);
            Assert.assertTrue(doiNode.isLocked);
        } else {
            if (doiNode.isLocked != null) {
                Assert.assertFalse(doiNode.isLocked);
            }
        }

        if (isPublic) {
            Assert.assertNotNull(doiNode.isPublic);
            Assert.assertTrue(doiNode.isPublic);
        } else {
            if (doiNode.isPublic != null) {
                Assert.assertFalse(doiNode.isPublic);
            }
        }

        Assert.assertEquals(readOnlyGroups, doiNode.getReadOnlyGroup().size());
        Assert.assertEquals(readWriteGroups, doiNode.getReadWriteGroup().size());
    }

}
