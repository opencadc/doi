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

import ca.nrc.cadc.ac.Group;
import ca.nrc.cadc.ac.GroupAlreadyExistsException;
import ca.nrc.cadc.ac.User;
import ca.nrc.cadc.ac.UserNotFoundException;
import ca.nrc.cadc.ac.client.GMSClient;
import ca.nrc.cadc.doi.datacite.Date;
import ca.nrc.cadc.doi.datacite.DateType;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.io.DoiXmlWriter;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.OutputStreamWrapper;
import ca.nrc.cadc.net.ResourceNotFoundException;
import ca.nrc.cadc.util.StringUtil;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.net.URI;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.TreeSet;
import org.apache.log4j.Logger;
import org.opencadc.gms.GroupURI;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.Node;
import org.opencadc.vospace.NodeProperty;
import org.opencadc.vospace.VOS;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.ClientTransfer;
import org.opencadc.vospace.transfer.Direction;
import org.opencadc.vospace.transfer.Protocol;
import org.opencadc.vospace.transfer.Transfer;

/**
 * Common write operations shared by PostAction and PutAction.
 */
public abstract class DoiWriteAction extends DoiAction {
    private static final Logger log = Logger.getLogger(DoiWriteAction.class);

    // methods to assign to private field in Identity
    protected static void assignIdentifier(Object ce, String identifier) {
        try {
            Field f = Identifier.class.getDeclaredField("value");
            f.setAccessible(true);
            f.set(ce, identifier);
        } catch (NoSuchFieldException fex) {
            throw new RuntimeException("Identifier class is missing the value field", fex);
        } catch (IllegalAccessException bug) {
            throw new RuntimeException("No access to Identifier value field", bug);
        }
    }

    protected Title getTitle(Resource resource) {
        Title title = null;
        List<Title> titles = resource.getTitles();
        for (Title t : titles) {
            if (StringUtil.hasText(t.getValue())) {
                title = t;
                break;
            }
        }
        return title;
    }

    protected GroupURI createDoiGroup(String groupName) throws Exception {
        String group = String.format("%s?%s", gmsResourceID, groupName);
        GroupURI guri = new GroupURI(URI.create(group));
        log.debug("creating group: " + guri);

        Group doiRWGroup = new Group(guri);
        User member = new User();
        member.getIdentities().addAll(callingSubject.getPrincipals());
        doiRWGroup.getUserMembers().add(member);
        doiRWGroup.getUserAdmins().add(member);

        try {
            GMSClient gmsClient = getGMSClient();
            gmsClient.createGroup(doiRWGroup);
        } catch (GroupAlreadyExistsException | UserNotFoundException gaeex) {
            throw new RuntimeException(gaeex);
        }
        log.debug("doi group created: " + guri);
        return guri;
    }

    protected ContainerNode createDOIDirectory(GroupURI guri, String folderName, String title) throws Exception {
        Set<NodeProperty> properties = new TreeSet<>();

        NodeProperty doiRequester = new NodeProperty(DOI_VOS_REQUESTER_PROP, this.callersNumericId.toString());
        properties.add(doiRequester);

        NodeProperty doiTitle = new NodeProperty(DOI_VOS_TITLE_PROP, title);
        properties.add(doiTitle);

        NodeProperty doiStatus = new NodeProperty(DOI_VOS_STATUS_PROP, Status.DRAFT.getValue());
        properties.add(doiStatus);

        NodeProperty journalRef = new NodeProperty(DOI_VOS_JOURNAL_PROP, syncInput.getParameter(JOURNALREF_PARAM));
        properties.add(journalRef);

        VOSURI newVOSURI = getVOSURI(folderName);
        ContainerNode newFolder = new ContainerNode(folderName);

        setPermissions(newFolder, guri);

        newFolder.getProperties().addAll(properties);
        vospaceDoiClient.getVOSpaceClient().createNode(newVOSURI, newFolder);
        return newFolder;
    }

    protected void uploadDOIDocument(Resource resource, VOSURI docVOSUIRI) throws ResourceNotFoundException {
        Transfer transfer = new Transfer(docVOSUIRI.getURI(), Direction.pushToVoSpace);
        Protocol put = new Protocol(VOS.PROTOCOL_HTTPS_PUT);
        transfer.getProtocols().add(put);

        ClientTransfer clientTransfer = vospaceDoiClient.getVOSpaceClient().createTransfer(transfer);
        DoiOutputStream outStream = new DoiOutputStream(resource);
        clientTransfer.setOutputStreamWrapper(outStream);
        clientTransfer.run();

        if (clientTransfer.getThrowable() != null) {
            log.debug(clientTransfer.getThrowable().getMessage());
            String message = clientTransfer.getThrowable().getMessage();
            if (message != null) {
                if (message.contains("NodeNotFound")) {
                    throw new ResourceNotFoundException(message);
                }
                if (message.contains("PermissionDenied")) {
                    throw new java.security.AccessControlException(message);
                }
            }
            throw new RuntimeException((clientTransfer.getThrowable().getMessage()));
        }
    }

    /**
     * child nodes of baseNode should have name structure YY.XXXX
     * go through list of child nodes
     * extract XXXX
     * track largest
     * add 1
     * reconstruct YY.XXXX structure and return
     */
    protected String getNextDOISuffix(VOSURI baseDoiURI) throws Exception {
        ContainerNode baseNode = (ContainerNode) vospaceDoiClient.getVOSpaceClient().getNode(baseDoiURI.getPath());
        DateFormat df = new SimpleDateFormat("yy");
        String currentYear = df.format(Calendar.getInstance().getTime());

        int maxDoi = 0;
        if (!baseNode.getNodes().isEmpty()) {
            for (Node childNode : baseNode.getNodes()) {
                String[] nameParts = childNode.getName().split("\\.");
                if (nameParts[0].equals(currentYear)) {
                    int curDoiNum = Integer.parseInt(nameParts[1]);
                    if (curDoiNum > maxDoi) {
                        maxDoi = curDoiNum;
                    }
                }
            }
        }

        maxDoi++;
        String formattedDOI = String.format("%04d", maxDoi);
        return currentYear + "." + formattedDOI;
    }

    protected String getRandomDOISuffix() {
        String allowed = "abcdefghjkmnpqrstuvwxyz1234567890";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        while (sb.length() < 11) {
            if (sb.length() == 5) {
                sb.append("-");
            } else {
                int index = (int) (random.nextFloat() * allowed.length());
                sb.append(allowed.charAt(index));
            }
        }
        sb.append(".test");
        return sb.toString();
    }

    protected void setPermissions(Node node, GroupURI doiGroup) {
        node.isPublic = false;
        node.getReadOnlyGroup().add(doiGroup);
        node.getReadWriteGroup().add(doiGroup);
        if (publisherGroupURI != null) {
            node.getReadOnlyGroup().add(publisherGroupURI);
            node.getReadWriteGroup().add(publisherGroupURI);
        }
    }

    protected void createDOI(Resource resource) throws Exception {
        if (resource == null) {
            throw new IllegalArgumentException("No content");
        }

        boolean randomTestID = Boolean.parseBoolean(config.getFirstPropertyValue(DoiInitAction.RANDOM_TEST_ID_KEY));
        String doiIdentifierPrefix = DoiInitAction.getDoiIdentifierPrefix(config);
        String nextDoiSuffix;

        if (randomTestID) {
            nextDoiSuffix = doiIdentifierPrefix + getRandomDOISuffix();
            log.warn("Random DOI suffix: " + nextDoiSuffix);
        } else {
            // Determine next DOI ID
            // Note: The generated DOI ID is the suffix which should be case insensitive.
            //       Since we are using a number, it does not matter. However if we decide
            //       to use a String, we should only generate either a lowercase or an
            //       uppercase String. (refer to https://support.datacite.org/docs/doi-basics)
            nextDoiSuffix = doiIdentifierPrefix + getNextDOISuffix(vospaceDoiClient.getDoiBaseVOSURI());
            log.debug("Next DOI suffix: " + nextDoiSuffix);
        }

        // Update the resource with the DOI ID
        assignIdentifier(resource.getIdentifier(), accountPrefix + "/" + nextDoiSuffix);

        // Add a Created date to the Resource object
        LocalDate localDate = LocalDate.now();
        String createdDate = localDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        Date doiDate = new Date(createdDate, DateType.CREATED);
        doiDate.dateInformation = "The date the DOI was created";
        resource.dates = new java.util.ArrayList<>();
        resource.dates.add(doiDate);

        // Create the group that is able to administer the DOI process
        String groupName = doiGroupPrefix + nextDoiSuffix;
        GroupURI guri = createDoiGroup(groupName);
        log.debug("Created DOI group: " + guri);

        // Create the VOSpace area for DOI work
        ContainerNode doiFolder = createDOIDirectory(guri, nextDoiSuffix, getTitle(resource).getValue());

        // create VOSpace data node to house XML doc using doi filename and upload the document
        String docName = getDoiFilename(nextDoiSuffix);
        org.opencadc.vospace.DataNode doiDocNode = new org.opencadc.vospace.DataNode(docName);
        VOSURI doiDocVOSURI = getVOSURI(nextDoiSuffix + "/" + docName);
        vospaceDoiClient.getVOSpaceClient().createNode(doiDocVOSURI, doiDocNode);
        this.uploadDOIDocument(resource, doiDocVOSURI);

        // Create the DOI data folder
        VOSURI dataVOSURI = getVOSURI(nextDoiSuffix + "/data");
        ContainerNode newDataFolder = new ContainerNode("data");
        setPermissions(newDataFolder, guri);
        vospaceDoiClient.getVOSpaceClient().createNode(dataVOSURI, newDataFolder);

        // Done, send redirect to GET for the XML file just made
        String redirectUrl = syncInput.getRequestURI() + "/" + nextDoiSuffix;
        syncOutput.setHeader("Location", redirectUrl);
        syncOutput.setCode(303);
    }

    protected static class DoiOutputStream implements OutputStreamWrapper {
        private final Resource streamResource;
        public DoiOutputStream(Resource streamRes) { this.streamResource = streamRes; }
        public void write(OutputStream out) throws IOException {
            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(streamResource, out);
        }
    }

}
