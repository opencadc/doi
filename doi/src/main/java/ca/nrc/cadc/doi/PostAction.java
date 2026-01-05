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
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.ResourceType;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.io.DoiXmlWriter;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.FileContent;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.net.HttpTransfer;
import ca.nrc.cadc.net.HttpUpload;
import ca.nrc.cadc.util.Base64;
import ca.nrc.cadc.util.StringUtil;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.TreeSet;
import javax.security.auth.Subject;

import org.apache.log4j.Logger;
import org.json.JSONObject;
import org.opencadc.gms.GroupURI;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.DataNode;
import org.opencadc.vospace.Node;
import org.opencadc.vospace.NodeNotFoundException;
import org.opencadc.vospace.NodeProperty;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.ClientAbortThread;
import org.opencadc.vospace.client.async.RecursiveSetNode;

public class PostAction extends DoiAction {
    private static final Logger log = Logger.getLogger(PostAction.class);

    public PostAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {
        super.init();
        authorize();

        // Validate user for minting or updating DOI
        if (doiSuffix != null) { // DOI Initialization does not require authorization
            authorizeResourceAccess();
        }

        // Do DOI work as doi admin
        Subject.doAs(getAdminSubject(), (PrivilegedExceptionAction<Object>) () -> {
            if (doiAction != null) {
                performDOIAction();
            } else if (doiSuffix == null) {
                createDOI();
            } else {
                updateDOI();
            }
            return null;
        });
    }

    private void authorizeResourceAccess() throws NodeNotFoundException {
        // doiadmin can perform all operations
        if (isCallingUserDOIAdmin()) {
            return;
        }

        // if this is a mint action for an alt configuration
        boolean isRequester = isCallingUserRequester(vospaceDoiClient.getContainerNode(doiSuffix));
        boolean isPublisher = isCallingUserPublisher();
        if (DoiAction.MINT_ACTION.equals(doiAction) && isAlternativeConfiguration()) {
            // in alt configuration the request to mint a DOI can only made by a member of the publisher group
            // that does not own the doi
            if (isPublisher && !isRequester) {
                return;
            } else {
                throw new AccessControlException("Not authorized to Mint this resource: " + doiSuffix);
            }
        }

        // must be the requester (doi creator), or reviewer in alternative configuration, for all other actions
        if (isRequester || isAlternativeConfiguration() && isPublisher) {
            return;
        }

        throw new AccessControlException("Not authorized to update this resource: " + doiSuffix);
    }

    private String getDataciteCredentials() {
        return String.format("%s:%s",
                config.getFirstPropertyValue(DoiInitAction.DATACITE_MDS_USERNAME_KEY),
                config.getFirstPropertyValue(DoiInitAction.DATACITE_MDS_PASSWORD_KEY));
    }

    //
    // CREATE a DOI
    //
    private void createDOI() throws Exception {
        Resource doiMetaData = (Resource) syncInput.getContent(DoiInlineContentHandler.META_DATA_KEY);
        if (doiMetaData == null) {
            throw new IllegalArgumentException("No content");
        }
        // doiNodeData can be null
        JSONObject doiNodeData = (JSONObject) syncInput.getContent(DoiInlineContentHandler.NODE_DATA_KEY);
        Map<URI, String> nodePropertyMap = getNodeProperties(doiNodeData);

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
        assignIdentifier(doiMetaData.getIdentifier(), accountPrefix + "/" + nextDoiSuffix);

        // Add a Created date to the Resource object
        LocalDate localDate = LocalDate.now();
        String createdDate = localDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        Date doiDate = new Date(createdDate, DateType.CREATED);
        doiDate.dateInformation = "The date the DOI was created";
        doiMetaData.dates = new java.util.ArrayList<>();
        doiMetaData.dates.add(doiDate);

        // Create the group that is able to administer the DOI process
        String groupName = doiGroupPrefix + nextDoiSuffix;
        GroupURI guri = createDoiGroup(groupName);
        log.debug("Created DOI group: " + guri);

        // Create the VOSpace area for DOI work
        ContainerNode doiFolder = createDOIDirectory(guri, nextDoiSuffix, getTitle(doiMetaData).getValue(), nodePropertyMap);
        log.debug("Created DOI folder: " + doiFolder);

        // create VOSpace data node to house XML doc using doi filename and upload the document
        String docName = getDoiFilename(nextDoiSuffix);
        DataNode doiDocNode = new DataNode(docName);
        VOSURI doiDocVOSURI = getVOSURI(nextDoiSuffix + "/" + docName);
        vospaceDoiClient.getVOSpaceClient().createNode(doiDocVOSURI, doiDocNode);
        uploadDOIDocument(doiMetaData, doiDocVOSURI);
        log.debug("Created DOI metadata document: " + doiDocVOSURI);

        // Create the DOI data folder
        VOSURI dataVOSURI = getVOSURI(nextDoiSuffix + "/data");
        ContainerNode newDataFolder = new ContainerNode("data");
        setPermissions(newDataFolder, guri);
        vospaceDoiClient.getVOSpaceClient().createNode(dataVOSURI, newDataFolder);
        log.debug("Created DOI data folder: " + dataVOSURI);

        // Done, send redirect to GET for the XML file just made
        String redirectUrl = syncInput.getRequestURI() + "/" + nextDoiSuffix;
        syncOutput.setHeader("Location", redirectUrl);
        syncOutput.setCode(303);
    }

    private String getRandomDOISuffix() {
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

    /**
     * child nodes of baseNode should have name structure YY.XXXX
     * go through list of child nodes
     * extract XXXX
     * track largest
     * add 1
     * reconstruct YY.XXXX structure and return
     */
    private String getNextDOISuffix(VOSURI baseDoiURI) throws Exception {
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

    // methods to assign to private field in Identity
    public static void assignIdentifier(Object ce, String identifier) {
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

    private GroupURI createDoiGroup(String groupName) throws Exception {
        GroupURI guri = createGroupURI(groupName);
        log.debug("creating group: " + guri);

        Group doiRWGroup = new Group(guri);
        User member = new User();
        member.getIdentities().addAll(callingSubject.getPrincipals());
        doiRWGroup.getUserMembers().add(member);
        doiRWGroup.getUserAdmins().add(member);

        try {
            GMSClient gmsClient = getGMSClient();
            gmsClient.createGroup(doiRWGroup);
        } catch (
                GroupAlreadyExistsException |
                UserNotFoundException gaeex) {
            throw new RuntimeException(gaeex);
        }
        log.debug("doi group created: " + guri);
        return guri;
    }

    private ContainerNode createDOIDirectory(GroupURI guri, String folderName, String title, Map<URI, String> nodeProperties) throws Exception {
        Set<NodeProperty> properties = new TreeSet<>();

        NodeProperty doiRequester = new NodeProperty(DOI.VOSPACE_DOI_REQUESTER_PROPERTY, this.callersNumericId.toString());
        properties.add(doiRequester);

        NodeProperty doiTitle = new NodeProperty(DOI.VOSPACE_DOI_TITLE_PROPERTY, title);
        properties.add(doiTitle);

        NodeProperty doiStatus = new NodeProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY, Status.DRAFT.getValue());
        properties.add(doiStatus);

        String journalRef = nodeProperties.get(DOI.VOSPACE_DOI_JOURNAL_PROPERTY);
        if (journalRef != null) {
            properties.add(new NodeProperty(DOI.VOSPACE_DOI_JOURNAL_PROPERTY, journalRef));
        }

        VOSURI newVOSURI = getVOSURI(folderName);
        ContainerNode newFolder = new ContainerNode(folderName);

        setPermissions(newFolder, guri);

        newFolder.getProperties().addAll(properties);
        vospaceDoiClient.getVOSpaceClient().createNode(newVOSURI, newFolder);
        return newFolder;
    }

    private Title getTitle(Resource resource) {
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

    private void setPermissions(Node node, GroupURI doiGroup) {
        node.isPublic = false;
        node.getReadOnlyGroup().add(doiGroup);
        node.getReadWriteGroup().add(doiGroup);
        if (publisherGroupURI != null) {
            node.getReadOnlyGroup().add(publisherGroupURI);
            node.getReadWriteGroup().add(publisherGroupURI);
        }
    }

    //
    // UPDATE a DOI
    //
    private void updateDOI() throws Exception {
        // Get the submitted form data, if it exists
        Resource doiMetaData = (Resource) syncInput.getContent(DoiInlineContentHandler.META_DATA_KEY);
        JSONObject doiNodeData = (JSONObject) syncInput.getContent(DoiInlineContentHandler.NODE_DATA_KEY);
        if (doiMetaData == null && doiNodeData == null) {
            throw new IllegalArgumentException("No content");
        }

        // perform the update
        updateResource(doiMetaData);
        updateNodeProperties(doiNodeData);

        // Done, send redirect to GET for the XML file just uploaded
        String redirectUrl = syncInput.getRequestURI();
        syncOutput.setHeader("Location", redirectUrl);
        syncOutput.setCode(303);
    }

    private void updateResource(Resource resourceFromUser) throws Exception {
        if (resourceFromUser == null) {
            return;
        }

        // merge resources and push as doiadmin
        Subject.doAs(getAdminSubject(), (PrivilegedExceptionAction<Object>) () -> {
            String nodeName = getDoiFilename(doiSuffix);
            Resource resourceFromVos = vospaceDoiClient.getResource(doiSuffix, nodeName);
            Resource mergedResource = merge(resourceFromUser, resourceFromVos);
            VOSURI docVOSURI = getVOSURI(String.format("%s/%s", doiSuffix, getDoiFilename(doiSuffix)));
            uploadDOIDocument(mergedResource, docVOSURI);
            return null;
        });
    }

    private Resource merge(Resource sourceResource, Resource targetResource) {

        log.info("sourceResource: " + sourceResource);
        log.info("targetResource: " + targetResource);

        // A user is only allowed to update creators and titles
        verifyImmutableFields(sourceResource, targetResource);

        // update editable fields
        targetResource.getCreators().clear();
        targetResource.getCreators().addAll(sourceResource.getCreators());
        log.info("targetResource.getCreators(): " + targetResource.getCreators());
        targetResource.getTitles().clear();
        targetResource.getTitles().addAll(sourceResource.getTitles());
        targetResource.getPublicationYear().setValue(sourceResource.getPublicationYear().getValue());
        targetResource.language = sourceResource.language;
        log.info("merged Resource: " + targetResource);
        return targetResource;
    }

    private void verifyImmutableFields(Resource r1, Resource r2) {
        if (!r1.getNamespace().getPrefix().equals(r2.getNamespace().getPrefix())
                || !r1.getNamespace().getURI().equals(r2.getNamespace().getURI())) {
            String msg = String.format("namespace update is not allowed, expected: %s, actual: %s",
                    r2.getNamespace(), r1.getNamespace());
            throw new IllegalArgumentException(msg);
        } else if (!r1.getPublisher().getValue().equals(r2.getPublisher().getValue())) {
            String msg = String.format("software error, publisher is different, expected: %s, actual: %s",
                    r2.getPublisher(), r1.getPublisher());
            throw new IllegalArgumentException(msg);
        } else {
            verifyIdentifier(r1.getIdentifier(), r2.getIdentifier());
            verifyResourceType(r1.getResourceType(), r2.getResourceType());
        }
    }

    private void verifyIdentifier(Identifier i1, Identifier i2) {
        if (!i1.getValue().equals(i2.getValue()) && !i1.getIdentifierType().equals(i2.getIdentifierType())) {
            String msg = String.format("identifier update is not allowed, expected: %s, actual: %s",
                    i2, i1);
            throw new IllegalArgumentException(msg);
        }
    }

    private void verifyResourceType(ResourceType rt1, ResourceType rt2) {
        verifyNull(rt1, rt2, "DoiResourceType");
        if (rt1.getResourceTypeGeneral() != rt2.getResourceTypeGeneral()) {
            String msg = String.format("resourceType update is not allowed, expected: %s, actual: %s",
                    rt2.getResourceTypeGeneral().getValue(), rt1.getResourceTypeGeneral().getValue());
            throw new IllegalArgumentException(msg);
        } else {
            verifyString(rt1.value, rt2.value, "resourceType description");
        }
    }

    private void verifyString(String s1, String s2, String field) {
        verifyNull(s1, s2, field);
        if (!s1.equals(s2)) {
            String msg = String.format("%s update is not allowed, expected: %s, actual: %s", field, s2, s1);
            throw new IllegalArgumentException(msg);
        }
    }

    private void verifyNull(Object o1, Object o2, String field) {
        if (o1 == null && o2 != null) {
            String msg = String.format("%s update is not allowed, expected: %s, actual: null", field, o2);
            throw new IllegalArgumentException(msg);
        } else if (o2 == null) {
            String msg = String.format("%s update is not allowed, expected: null, actual: %s", field, o1);
            throw new IllegalArgumentException(msg);
        }
    }

    private void updateNodeProperties(JSONObject nodeData) throws Exception {

        // get a map of NodeProperty key(URI) and value(String)
        Map<URI, String> propertyMap = getNodeProperties(nodeData);

        // Get existing node properties
        ContainerNode doiNode = vospaceDoiClient.getContainerNode(doiSuffix);
        VOSURI vosuri = getVOSURI(doiSuffix);

        // Update the node properties
        String requestedStatus = null;
        String currentStatus = null;
        for (Map.Entry<URI, String> entry : propertyMap.entrySet()) {
            NodeProperty nodeProperty = doiNode.getProperty(entry.getKey());

            // save the status for possible permission updates
            if (entry.getKey().equals(DOI.VOSPACE_DOI_STATUS_PROPERTY)) {
                requestedStatus = entry.getValue();
                currentStatus = nodeProperty.getValue();
            }

            if (entry.getKey().equals(DOI.VOSPACE_DOI_REVIEWER_PROPERTY)) {
                if (!isCallingUserPublisher() && !isCallingUserDOIAdmin()) {
                    throw new IllegalArgumentException("Not authorized to set reviewer");
                }
            }

            // current == null, update with new
            // current != null
            //  new == null, delete current
            //  new != null, update current
            if (nodeProperty == null) {
                // node property does not exist, add it
                NodeProperty newProperty = new NodeProperty(entry.getKey(), entry.getValue());
                doiNode.getProperties().add(newProperty);
            } else {
                if (entry.getValue() == null || entry.getValue().isEmpty()) {
                    // new value is null or empty, delete
                    doiNode.getProperties().remove(nodeProperty);
                    doiNode.getProperties().add(new NodeProperty(entry.getKey()));
                } else {
                    // update existing property
                    doiNode.getProperty(entry.getKey()).setValue(entry.getValue());
                }
            }
        }

        // If the status changed, update the node permissions
        if (requestedStatus != null) {
            log.debug("requested status: " + requestedStatus);
            log.debug("current status: " + currentStatus);
            if (!requestedStatus.equals(currentStatus)) {
                GroupURI doiGroupUri = createGroupURI(doiGroupPrefix + doiSuffix);
                log.debug("updating status...");

                // can only update to 'review ready' from 'in progress' (author submits for review)
                if (requestedStatus.equals(Status.REVIEW_READY.getValue()) && currentStatus.equals(Status.DRAFT.getValue())) {
                    if (isAlternativeConfiguration() && (isCallingUserRequester(doiNode) || isCallingUserDOIAdmin())) {
                        // 'review ready' node permissions: doi-group:r publisher-group:r public:false
                        doiNode.getReadWriteGroup().clear();
                        doiNode.getReadOnlyGroup().clear();
                        doiNode.getReadOnlyGroup().add(doiGroupUri);
                        doiNode.isPublic = false;
                    } else {
                        String message = String.format("Invalid status change requested: from '%s' to '%s'", currentStatus, requestedStatus);
                        throw new IllegalArgumentException(message);
                    }

                // can only update to 'in review' from 'review ready' (publisher/reviewer accepts)
                } else if (requestedStatus.equals(Status.IN_REVIEW.getValue()) && currentStatus.equals(Status.REVIEW_READY.getValue())) {
                    if (isAlternativeConfiguration() && (isCallingUserPublisher() || isCallingUserDOIAdmin())) {
                        // 'in review' node permissions: doi-group:r reviewer-group:r public:false
                        doiNode.clearReadWriteGroups = true;
                        doiNode.getReadWriteGroup().clear();
                        doiNode.clearReadOnlyGroups = true;
                        doiNode.getReadOnlyGroup().clear();
                        doiNode.getReadOnlyGroup().add(doiGroupUri);
                        doiNode.getReadOnlyGroup().add(publisherGroupURI);
                        doiNode.isPublic = false;
                    } else {
                        String message = String.format("Invalid status change requested: from '%s' to '%s'", currentStatus, requestedStatus);
                        throw new IllegalArgumentException(message);
                    }

                // can only update to 'in progress' from 'review ready', 'in review', 'rejected', or 'approved'
                } else if (requestedStatus.equals(Status.DRAFT.getValue())
                        && (currentStatus.equals(Status.REVIEW_READY.getValue())
                            || currentStatus.equals(Status.IN_REVIEW.getValue())
                            || currentStatus.equals(Status.REJECTED.getValue())
                            || currentStatus.equals(Status.APPROVED.getValue()))) {
                    // alt config only:
                    // - from 'review ready': requester or admin (author withdraws)
                    // - from 'in review': requester, publisher, or admin
                    // - from 'rejected': requester or admin
                    // - from 'approved': requester or admin (author wants to edit after approval)
                    boolean canTransition = false;
                    if (currentStatus.equals(Status.REVIEW_READY.getValue())) {
                        canTransition = isAlternativeConfiguration() && (isCallingUserRequester(doiNode) || isCallingUserDOIAdmin());
                    } else if (currentStatus.equals(Status.IN_REVIEW.getValue())) {
                        canTransition = isAlternativeConfiguration() && (isCallingUserRequester(doiNode) || isCallingUserPublisher() || isCallingUserDOIAdmin());
                    } else if (currentStatus.equals(Status.REJECTED.getValue())) {
                        canTransition = isAlternativeConfiguration() && (isCallingUserRequester(doiNode) || isCallingUserDOIAdmin());
                    } else if (currentStatus.equals(Status.APPROVED.getValue())) {
                        canTransition = isAlternativeConfiguration() && (isCallingUserRequester(doiNode) || isCallingUserDOIAdmin());
                    }
                    if (canTransition) {
                        // 'in progress' node permissions: doi-group:rw reviewer-group:- public:false
                        doiNode.getReadWriteGroup().clear();
                        doiNode.getReadWriteGroup().add(doiGroupUri);
                        doiNode.clearReadOnlyGroups = true;
                        doiNode.getReadOnlyGroup().clear();
                        doiNode.getReadOnlyGroup().add(doiGroupUri);
                        doiNode.isPublic = false;
                    } else {
                        String message = String.format("Invalid status change requested: from '%s' to '%s'", currentStatus, requestedStatus);
                        throw new IllegalArgumentException(message);
                    }

                // can only update to 'approved' from 'in review' (publisher only)
                } else if (requestedStatus.equals(Status.APPROVED.getValue()) && currentStatus.equals(Status.IN_REVIEW.getValue())) {
                    if (isAlternativeConfiguration() && (isCallingUserPublisher() || isCallingUserDOIAdmin())) {
                        // 'approved' node permissions: doi-group:r reviewer-group:r public:false
                        doiNode.getReadWriteGroup().clear();
                        doiNode.getReadOnlyGroup().clear();
                        doiNode.getReadOnlyGroup().add(doiGroupUri);
                        doiNode.isPublic = false;
                    } else {
                        String message = String.format("Invalid status change requested: from '%s' to '%s'", currentStatus, requestedStatus);
                        throw new IllegalArgumentException(message);
                    }

                // can only update to 'rejected' from 'in review' (publisher only)
                } else if (requestedStatus.equals(Status.REJECTED.getValue()) && currentStatus.equals(Status.IN_REVIEW.getValue())) {
                    if (isAlternativeConfiguration() && (isCallingUserPublisher() || isCallingUserDOIAdmin())) {
                        // 'rejected' node permissions: doi-group:rw reviewer-group:r public:false
                        doiNode.getReadWriteGroup().clear();
                        doiNode.getReadWriteGroup().add(doiGroupUri);
                        doiNode.getReadOnlyGroup().clear();
                        doiNode.isPublic = false;
                    } else {
                        String message = String.format("Invalid status change requested: from '%s' to '%s'", currentStatus, requestedStatus);
                        throw new IllegalArgumentException(message);
                    }

                } else {
                    // all other updates are not allowed
                    String message = String.format("Invalid status change requested: from '%s' to '%s'", currentStatus, requestedStatus);
                    throw new IllegalArgumentException(message);
                }
                log.debug("status updated");
            }
        }
        vospaceDoiClient.getVOSpaceClient().setNode(vosuri, doiNode);
    }

    private Map<URI, String> getNodeProperties(JSONObject nodeData) {
        Map<URI, String> propertyMap = new HashMap<>();
        if (nodeData != null) {
            for (String key : nodeData.keySet()) {
                Object keyValue = nodeData.get(key);
                String value = keyValue == null ? null : keyValue.toString();

                switch (key) {
                    case DOI.JOURNALREF_NODE_PARAMETER:
                        propertyMap.put(DOI.VOSPACE_DOI_JOURNAL_PROPERTY, value);
                        break;
                    case DOI.STATUS_NODE_PARAMETER:
                        propertyMap.put(DOI.VOSPACE_DOI_STATUS_PROPERTY, value);
                        break;
                    case DOI.REVIEWER_NODE_PARAMETER:
                        propertyMap.put(DOI.VOSPACE_DOI_REVIEWER_PROPERTY, value);
                        break;
                    default:
                        throw new IllegalArgumentException("Unknown property for update: " + key);
                }
            }
        }
        return propertyMap;
    }

    //
    // MINT a DOI
    //
    private void performDOIAction() throws Exception {
        if (DoiAction.MINT_ACTION.equals(doiAction)) {

            // in alt configuration, a member of the publisher group cannot mint
            // process DOI based on current minting status
            ContainerNode doiContainerNode = vospaceDoiClient.getContainerNode(doiSuffix);
            Status mintingStatus = Status.toValue(doiContainerNode.getPropertyValue(DOI.VOSPACE_DOI_STATUS_PROPERTY));
            switch (mintingStatus) {
                case DRAFT:
                case ERROR_LOCKING_DATA:
                    lockData(doiContainerNode);
                    break;
                case LOCKING_DATA:
                    // locking data directory in progress, do nothing
                    log.debug("doi " + doiSuffix + " status: " + Status.LOCKING_DATA);
                    break;
                case LOCKED_DATA:
                case ERROR_REGISTERING:
                    register(doiContainerNode);
                    break;
                case REGISTERING:
                    // registering doi to DataCite, do nothing
                    log.debug("doi " + doiSuffix + " status: " + Status.REGISTERING);
                    break;
                case MINTED:
                    // minting finished, do nothing
                    log.debug("doi " + doiSuffix + " status: " + Status.MINTED);
                    break;
                case COMPLETED:
                    // minting service should not have been called in this status, ignore
                    log.debug("doi " + doiSuffix + " status: " + Status.COMPLETED);
                    break;
                default:
                    // do nothing
            }

            // Done, send redirect to GET for the XML file just minted
            int lastPosition = syncInput.getRequestURI().lastIndexOf('/');
            String redirectUrl = syncInput.getRequestURI().substring(0, lastPosition);
            log.debug("redirectUrl: " + redirectUrl);
            syncOutput.setHeader("Location", redirectUrl);
            syncOutput.setCode(303);
        } else {
            throw new UnsupportedOperationException("DOI action not supported: " + doiAction);
        }
    }

    private void lockData(ContainerNode doiContainerNode) throws Exception {
        String doiDataPath = doiSuffix + "/data";
        VOSURI containerVOSURI = getVOSURI(doiSuffix);
        VOSURI dataVOSURI = getVOSURI(doiDataPath);
        try {
            // update status
            doiContainerNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY).setValue(Status.LOCKING_DATA.getValue());
            vospaceDoiClient.getVOSpaceClient().setNode(containerVOSURI, doiContainerNode);

            // lock data directory and subdirectories, make them public
            ContainerNode dataContainerNode = vospaceDoiClient.getContainerNode(doiDataPath);
            dataContainerNode.isPublic = true;
            dataContainerNode.clearReadOnlyGroups = true;
            dataContainerNode.getReadOnlyGroup().clear();
            dataContainerNode.clearReadWriteGroups = true;
            dataContainerNode.getReadWriteGroup().clear();
            dataContainerNode.isLocked = true;

            // clear all children in the dataContainerNode, otherwise the XML file may be
            // too long resulting in (413) Request Entity Too Large
            dataContainerNode.getNodes().clear();
            vospaceDoiClient.getVOSpaceClient().setNode(dataVOSURI, dataContainerNode);

            // get the job URL
            RecursiveSetNode recSetNode = vospaceDoiClient.getVOSpaceClient().createRecursiveSetNode(dataVOSURI, dataContainerNode);
            URL jobURL = recSetNode.getJobURL();

            // this is an async operation
            Thread abortThread = new ClientAbortThread(jobURL);
            Runtime.getRuntime().addShutdownHook(abortThread);
            recSetNode.setMonitor(false);
            recSetNode.run();
            Runtime.getRuntime().removeShutdownHook(abortThread);
            log.debug("invoked async call to recursively set the properties in the data directory " + doiDataPath);

            // save job URL
            NodeProperty jobURLProp = new NodeProperty(DOI.VOSPACE_DOI_JOB_URL_PROPERTY, jobURL.toExternalForm());
            doiContainerNode.getProperties().add(jobURLProp);
            vospaceDoiClient.getVOSpaceClient().setNode(containerVOSURI, doiContainerNode);
        } catch (Exception ex) {
            // update status
            doiContainerNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY).setValue(Status.ERROR_LOCKING_DATA.getValue());
            String jobURLString = doiContainerNode.getPropertyValue(DOI.VOSPACE_DOI_JOB_URL_PROPERTY);
            if (jobURLString != null) {
                doiContainerNode.getProperties().remove(new NodeProperty(DOI.VOSPACE_DOI_JOB_URL_PROPERTY));
            }

            vospaceDoiClient.getVOSpaceClient().setNode(containerVOSURI, doiContainerNode);
            throw ex;
        }
    }

    private void register(ContainerNode doiContainerNode) throws Exception {
        Set<GroupURI> groupRead = new TreeSet<>();
        Set<GroupURI> groupWrite = new TreeSet<>();
        String xmlFilename = doiSuffix + "/" + getDoiFilename(doiSuffix);
        DataNode xmlFile = null;

        VOSURI doiURI = getVOSURI(doiContainerNode.getName());
        VOSURI xmlURI = getVOSURI(xmlFilename);

        try {
            // update status
            doiContainerNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY).setValue(Status.REGISTERING.getValue());
            vospaceDoiClient.getVOSpaceClient().setNode(doiURI, doiContainerNode);

            // register DOI to DataCite
            String dataCiteUrl = config.getFirstPropertyValue(DoiInitAction.DATACITE_MDS_URL_KEY);
            URL registerURL = new URL(String.format("%s/metadata/%s/%s", dataCiteUrl, accountPrefix, doiSuffix));
            String content = getDOIContent();
            String contentType = "application/xml;charset=UTF-8";
            FileContent fileContent = new FileContent(content, contentType, StandardCharsets.UTF_8);
            registerDOI(registerURL, fileContent);

            // success, add landing page to the DOI instance
            makeDOIFindable();

            // completed minting, update status and node properties
            doiContainerNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY).setValue(Status.MINTED.getValue());

            // make parent container and XML file public, remove group properties.
            // this is required for the landing page to be available to doi.org for
            // anonymous access
            xmlFile = vospaceDoiClient.getDataNode(xmlFilename);
            xmlFile.isPublic = true;
            xmlFile.clearReadOnlyGroups = true;
            xmlFile.getReadOnlyGroup().clear();
            xmlFile.clearReadWriteGroups = true;
            xmlFile.getReadWriteGroup().clear();
            vospaceDoiClient.getVOSpaceClient().setNode(xmlURI, xmlFile);

            groupRead.addAll(doiContainerNode.getReadOnlyGroup());
            groupWrite.addAll(doiContainerNode.getReadWriteGroup());
            doiContainerNode.isPublic = true;
            doiContainerNode.clearReadOnlyGroups = true;
            doiContainerNode.getReadOnlyGroup().clear();
            doiContainerNode.clearReadWriteGroups = true;
            doiContainerNode.getReadWriteGroup().clear();
            vospaceDoiClient.getVOSpaceClient().setNode(doiURI, doiContainerNode);

        } catch (Exception ex) {
            // update status to flag error state, and original properties of
            // container node and xml file

            if (xmlFile != null) {
                xmlFile.isPublic = false;
                xmlFile.getReadOnlyGroup().addAll(groupRead);
                xmlFile.getReadWriteGroup().addAll(groupWrite);
                vospaceDoiClient.getVOSpaceClient().setNode(xmlURI, xmlFile);
            }

            doiContainerNode.getProperty(DOI.VOSPACE_DOI_STATUS_PROPERTY).setValue(Status.ERROR_REGISTERING.getValue());
            doiContainerNode.isPublic = false;
            doiContainerNode.getReadOnlyGroup().addAll(groupRead);
            doiContainerNode.getReadWriteGroup().addAll(groupWrite);

            // update both nodes
            // This will work unless vospace is failing
            vospaceDoiClient.getVOSpaceClient().setNode(doiURI, doiContainerNode);

            throw ex;
        }
    }

    private String getDOIContent() throws Exception  {
        Resource resource = vospaceDoiClient.getResource(doiSuffix, getDoiFilename(doiSuffix));
        StringBuilder builder = new StringBuilder();
        DoiXmlWriter writer = new DoiXmlWriter();
        writer.write(resource, builder);
        return builder.toString();
    }

    private void registerDOI(URL postURL, FileContent fileContent)
            throws Exception {
        log.debug("post to DataCite URL: " + postURL);
        log.debug("contentType: " + fileContent.getContentType());

        // post to DataCite
        HttpPost postToDataCite = new HttpPost(postURL, fileContent, true);
        postToDataCite.setRequestProperty("Authorization", "Basic " + Base64.encodeString(getDataciteCredentials()));
        postToDataCite.prepare();

        // process response
        String msg = "Successfully registered DOI " + doiSuffix;
        processResponse(postToDataCite.getThrowable(), postToDataCite.getResponseCode(), postToDataCite.getInputStream(), msg);
    }

    private void makeDOIFindable()
            throws Exception {
        // form the upload endpoint
        String dataCiteUrl = config.getFirstPropertyValue(DoiInitAction.DATACITE_MDS_URL_KEY);
        String path = String.format("%s/doi/%s/%s", dataCiteUrl, accountPrefix, doiSuffix);
        URL doiURL = new URL(path);
        log.debug("makeFindable endpoint: " + doiURL);

        // add the landing page URL
        String landingPageUrl = config.getFirstPropertyValue(DoiInitAction.LANDING_URL_KEY);
        String content = String.format("doi=%s/%s\nurl=%s?doi=%s", accountPrefix, doiSuffix, landingPageUrl, doiSuffix);
        log.debug("content: " + content);
        InputStream inputStream = new ByteArrayInputStream(content.getBytes());

        // upload
        HttpUpload put = new HttpUpload(inputStream, doiURL);
        put.setRequestProperty("Authorization", "Basic " + Base64.encodeString(getDataciteCredentials()));
        put.setBufferSize(64 * 1024);
        put.setRequestProperty(HttpTransfer.CONTENT_TYPE, "text/plain;charset=UTF-8");
        put.prepare();

        // process response
        String msg = "Successfully made DOI " + doiSuffix + " findable";
        processResponse(put.getThrowable(), put.getResponseCode(), put.getInputStream(), msg);
    }

    private void processResponse(Throwable throwable, int responseCode, InputStream inputStream, String msg)
            throws IOException {
        log.debug("response code from DataCite: " + responseCode);
        String body = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);

        // check if an exception was thrown
        if (throwable != null) {
            if ((responseCode == 401) || (responseCode == 403)) {
                throw new AccessControlException(throwable.getMessage());
            } else {
                throw new RuntimeException(body + ", " + throwable);
            }
        }
        
        // no exception thrown, check response code
        if (responseCode == 200 || responseCode == 201) {
            log.debug(msg);
        } else {
            throw new IOException("HttpResponse (" + responseCode + ") - " + body);
        }
    }

}
