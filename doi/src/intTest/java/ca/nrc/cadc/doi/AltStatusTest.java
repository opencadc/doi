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
import java.net.URL;
import java.security.PrivilegedExceptionAction;
import java.util.HashMap;
import java.util.Map;
import javax.security.auth.Subject;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Ignore;
import org.junit.Test;
import org.opencadc.vospace.Node;
import org.opencadc.vospace.NodeProperty;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.VOSpaceClient;

public class AltStatusTest extends LifecycleTest {
    private static final Logger log = Logger.getLogger(AltStatusTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    @Override
    @Ignore
    @Test
    public void testLifecycle() throws Exception {
        // skip re-running the lifecycle test
    }

    @Test
    public void testUpdateStatus() {
        try {
            Resource expected = getTestResource(true, true);
            log.debug("test resource: " + expected);

            String doiSuffix = Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

                // create a new DOI
                Resource actual = create(expected, DOISettingsType.ALT_DOI);
                String doiID = getDOISuffix(actual.getIdentifier().getValue());
                Assert.assertNotNull(doiID);
                Assert.assertTrue(doiID.startsWith(TestUtil.DOI_ALT_IDENTIFIER_PREFIX));
                log.debug("created doiID: " + doiID);

                // update status = 'in review'
                log.debug("update status to 'in review'");
                URL doiURL = new URL(String.format("%s/%s", doiAltServiceURL, doiID));
                Map<String, String> params = new HashMap<>();
                params.put(DOI.STATUS_NODE_PARAMETER, Status.IN_REVIEW.getValue());
                postDOI(doiURL , null, params, true);
                log.debug("status updated");

                // get the doi parent node
                VOSpaceClient vosClient = getVOSClient(DOISettingsType.ALT_DOI);
                VOSURI doiParentPathURI = getDoiParentPathURI(DOISettingsType.ALT_DOI);
                Node doiNode = getContainerNode(doiID, doiParentPathURI, vosClient);
                Assert.assertNotNull(doiNode);

                // check status
                NodeProperty status = doiNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY);
                Assert.assertNotNull(status);
                Assert.assertEquals(Status.IN_REVIEW.getValue(), status.getValue());

                // check permissions
                // 'in review' node permissions, doi-group:r reviewer-group:r public:false
                if (doiNode.isLocked != null) {
                    Assert.assertFalse(doiNode.isLocked);
                }
                if (doiNode.isPublic != null) {
                    Assert.assertFalse(doiNode.isPublic);
                }
                Assert.assertEquals(2, doiNode.getReadOnlyGroup().size());
                Assert.assertEquals(0, doiNode.getReadWriteGroup().size());

                // update status = 'in progress'
                doiURL = new URL(String.format("%s/%s", doiAltServiceURL, doiID));
                params.clear();
                params.put(DOI.STATUS_NODE_PARAMETER, Status.DRAFT.getValue());
                postDOI(doiURL , null, params, true);

                // check status
                doiNode = getContainerNode(doiID, doiParentPathURI, vosClient);
                status = doiNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY);
                Assert.assertNotNull(status);
                Assert.assertEquals(Status.DRAFT.getValue(), status.getValue());

                // check permissions
                // 'in progress' node permissions, doi-group:rw reviewer-group:- public:false
                if (doiNode.isLocked != null) {
                    Assert.assertFalse(doiNode.isLocked);
                }
                if (doiNode.isPublic != null) {
                    Assert.assertFalse(doiNode.isPublic);
                }
                Assert.assertEquals(1, doiNode.getReadOnlyGroup().size());
                Assert.assertEquals(1, doiNode.getReadWriteGroup().size());

                // update status = 'in review' so reviewer can change status
                params.clear();
                params.put(DOI.STATUS_NODE_PARAMETER, Status.IN_REVIEW.getValue());
                postDOI(doiURL , null, params, true);

                // check status
                doiNode = getContainerNode(doiID, doiParentPathURI, vosClient);
                status = doiNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY);
                Assert.assertNotNull(status);
                Assert.assertEquals(Status.IN_REVIEW.getValue(), status.getValue());

                // check permissions
                // 'in review' node permissions, doi-group:r reviewer-group:r public:false
                if (doiNode.isLocked != null) {
                    Assert.assertFalse(doiNode.isLocked);
                }
                if (doiNode.isPublic != null) {
                    Assert.assertFalse(doiNode.isPublic);
                }
                Assert.assertEquals(2, doiNode.getReadOnlyGroup().size());
                Assert.assertEquals(0, doiNode.getReadWriteGroup().size());

                return doiID;
            });

            Subject.doAs(publisherSubject, (PrivilegedExceptionAction<Object>) () -> {

                // update status = 'in progress' as reviewer
                URL doiURL = new URL(String.format("%s/%s", doiAltServiceURL, doiSuffix));
                Map<String, String> params = new HashMap<>();
                params.put(DOI.STATUS_NODE_PARAMETER, Status.DRAFT.getValue());
                String redirectUrl = postDOI(doiURL, null, params, false);
                log.debug("redirectUrl: " + redirectUrl);

                return null;
            });

            // After the above POST has updated the status to 'in progress'
            // the reviewer no longer has permission to the DOI, GET the DOI as the creator
            Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

                // get the doi parent node
                VOSpaceClient vosClient = getVOSClient(DOISettingsType.ALT_DOI);
                VOSURI doiParentPathURI = getDoiParentPathURI(DOISettingsType.ALT_DOI);
                Node doiNode = getContainerNode(doiSuffix, doiParentPathURI, vosClient);

                // check status
                NodeProperty status = doiNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY);
                Assert.assertNotNull(status);
                Assert.assertEquals(Status.DRAFT.getValue(), status.getValue());

                // check permissions
                // 'in progress' node permissions, doi-group:rw reviewer-group:- public:false
                if (doiNode.isLocked != null) {
                    Assert.assertFalse(doiNode.isLocked);
                }
                if (doiNode.isPublic != null) {
                    Assert.assertFalse(doiNode.isPublic);
                }
                Assert.assertEquals(1, doiNode.getReadOnlyGroup().size());
                Assert.assertEquals(1, doiNode.getReadWriteGroup().size());

                return null;
            });

        } catch (Exception unexpected) {
            unexpected.printStackTrace();
            log.debug("unexpected error: " + unexpected);
            Assert.fail("unexpected error: " + unexpected.getMessage());
        }
    }

}
