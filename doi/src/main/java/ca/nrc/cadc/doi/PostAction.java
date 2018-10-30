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

import ca.nrc.cadc.ac.Group;
import ca.nrc.cadc.ac.GroupURI;
import ca.nrc.cadc.ac.User;
import ca.nrc.cadc.ac.client.GMSClient;
import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.DateType;
import ca.nrc.cadc.doi.datacite.Description;
import ca.nrc.cadc.doi.datacite.DescriptionType;
import ca.nrc.cadc.doi.datacite.DoiDate;
import ca.nrc.cadc.doi.datacite.DoiParsingException;
import ca.nrc.cadc.doi.datacite.DoiReader;
import ca.nrc.cadc.doi.datacite.DoiResourceType;
import ca.nrc.cadc.doi.datacite.DoiXmlReader;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.net.OutputStreamWrapper;
import ca.nrc.cadc.net.ResourceNotFoundException;
import ca.nrc.cadc.vos.ContainerNode;
import ca.nrc.cadc.vos.DataNode;
import ca.nrc.cadc.vos.Direction;
import ca.nrc.cadc.vos.Node;
import ca.nrc.cadc.vos.NodeProperty;
import ca.nrc.cadc.vos.Protocol;
import ca.nrc.cadc.vos.Transfer;
import ca.nrc.cadc.vos.VOS;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.ClientTransfer;

import ca.nrc.cadc.vos.client.VOSpaceClient;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.jdom2.Namespace;


public class PostAction extends DoiAction {
    private static final Logger log = Logger.getLogger(PostAction.class);

    static final String DOI_TEMPLATE_RESOURCE_41 = "DoiTemplate-4.1.xml";
    static final String DESCRIPTION_TEMPLATE = "This contains data and other information related to the publication '%s' by %s et al., %s";

    public PostAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {
        super.init(true);

        if (doiAction != null) {
            throw new IllegalArgumentException("Invalid request.");
        }

        // Do DOI creation work as doiadmin
        File pemFile = new File(System.getProperty("user.home") + "/.ssl/doiadmin.pem");
        Subject doiadminSubject = SSLUtil.createSubject(pemFile);
        Subject.doAs(doiadminSubject, new PrivilegedExceptionAction<Object>() {
            @Override
            public String run() throws Exception {
                if (doiSuffix == null) {
                    createDOI();
                } else {
                    updateDOI();
                } 
                return null;
            }
        });
    }

    // update a DOI instance
    private void updateDOI() throws Exception {
        // Get the submitted form data, if it exists
        Resource resourceFromUser = (Resource) syncInput.getContent(DoiInlineContentHandler.CONTENT_KEY);
        if (resourceFromUser == null) {
            throw new IllegalArgumentException("No content");
        }

        // Get resource from vospace
        Resource resourceFromVos = vClient.getResource(doiSuffix, getDoiFilename(doiSuffix));
        
        // udpate the resource from vospace and upload it
        Resource mergedResource = merge(resourceFromUser, resourceFromVos);
        VOSURI docDataURI = new VOSURI(
                vClient.getDoiBaseVOSURI().toString() + "/" + doiSuffix + "/" + getDoiFilename(doiSuffix) );
        this.uploadDOIDocument(vClient.getVOSpaceClient(), mergedResource, new DataNode(docDataURI));

        // journal reference may be updated as well, will have to change the
        // parameter on the vospace nodes involved - parent & data directory
//        setJournalRef(parentNode);
//        setJournalRef(dataNode);
/*
        String journalRef = syncInput.getParameter(JOURNALREF_PARAM);
        if (journalRef == null) {
            journalRef = "";
        }
*/
        // Done, send redirect to GET for the XML file just uploaded
        String redirectUrl = syncInput.getRequestURI();
        syncOutput.setHeader("Location", redirectUrl);
        syncOutput.setCode(303);
    }

    private Resource merge(Resource sourceResource, Resource targetResource) {

        // A user is only allowed to update creators and titles
        verifyUneditableFields(sourceResource, targetResource);

        // update editable fields
        targetResource.setCreators(sourceResource.getCreators());
        targetResource.setTitles(sourceResource.getTitles());

        return targetResource;
    }

    private void verifyUneditableFields(Resource s1, Resource s2) {
        if (!s1.getNamespace().equals(s2.getNamespace())) {
            Namespace expected = s2.getNamespace();
            Namespace actual = s1.getNamespace();
            String msg = "namespace update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalStateException(msg);
        } else if (!s1.getPublisher().equals(s2.getPublisher())) {
            String expected = s2.getPublisher();
            String actual = s1.getPublisher();
            String msg = "software error, publisher is different, expected = " + expected + ", actual = " + actual;
            throw new IllegalStateException(msg);
        } else if (!s1.getPublicationYear().equals(s2.getPublicationYear())) {
            String expected = s2.getPublicationYear();
            String actual = s1.getPublicationYear();
            String msg = "publicationYear update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalStateException(msg);
        } else {
            verifyIdentifier(s1.getIdentifier(), s2.getIdentifier());
            verifyResourceType(s1.getResourceType(), s2.getResourceType());
            verifyString(s1.language, s2.language, "language");
        }
    }
    
    private void verifyString(String s1, String s2, String field)
    {
        verifyNull(s1, s2, field);
        if (s1 != null)
        {
            if (!s1.equals(s2)) {
                String msg = field + " update is not allowed, expected = " + s2 + ", actual = " + s1;
                throw new IllegalStateException(msg);
            }
        }
    }

    private void verifyNull(Object o1, Object o2, String field)
    {
        if (o1 == null)
        {
            if (o2 != null) {
                String msg = field + " update is not allowed, expected = " + o2 + ", actual = null";
                throw new IllegalStateException(msg);
            }
        } 
        else
        {
            if (o2 == null) {
                String msg = field + " update is not allowed, expected = null, actual = " + o1;
                throw new IllegalStateException(msg);
            }
        }
    }

    private void verifyIdentifier(Identifier id1, Identifier id2) {
        if (!id1.getText().equals(id2.getText())) {
            String expected = id2.getText();
            String actual = id1.getText();
            String msg = "identifier update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalStateException(msg);
        } else if (!id1.getIdentifierType().equals(id2.getIdentifierType())) {
            String expected = id2.getIdentifierType();
            String actual = id1.getIdentifierType();
            String msg = "identifierType update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalStateException(msg);
        }
    }
    
    private void verifyResourceType(DoiResourceType rt1, DoiResourceType rt2) {
        verifyNull(rt1, rt2, "DoiResourceType");
        if (rt1.getResourceType() != rt2.getResourceType()) {
            String expected = rt2.getResourceType().getValue();
            String actual = rt1.getResourceType().getValue();
            String msg = "resourceType update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalStateException(msg);
        } else {
            verifyString(rt1.resourceTypeGeneral, rt2.resourceTypeGeneral, "resourceTypeGeneral");
        }
    }
    
    private void createDOI() throws Exception {
        // Get the submitted form data, if it exists
        Resource resource = (Resource) syncInput.getContent(DoiInlineContentHandler.CONTENT_KEY);
        if (resource == null) {
            throw new IllegalArgumentException("No content");
        }

        VOSURI doiDataURI = vClient.getDoiBaseVOSURI();
        VOSpaceClient vosClient = new VOSpaceClient(doiDataURI.getServiceURI());

        // Determine next DOI number        
        String nextDoiSuffix = generateNextDOINumber(vosClient, doiDataURI);
        log.debug("Next DOI suffix: " + nextDoiSuffix);

        // update the template with the new DOI number
        DoiReader.assignIdentifier(resource.getIdentifier(), CADC_DOI_PREFIX + "/" + nextDoiSuffix);

        //Add a Created date to the Resource object
        String createdDate = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        DoiDate doiDate = new DoiDate(createdDate, DateType.CREATED);
        resource.dates = new ArrayList<DoiDate>();
        resource.dates.add(doiDate);

        // Create the group that is able to administer the DOI process
        GroupURI guri = createDoiGroup(nextDoiSuffix);
        
        // Create the VOSpace area for DOI work
        ContainerNode doiFolder = this.createDOIDirectory(vosClient, guri, nextDoiSuffix);
        
        // create VOSpace data node to house XML doc using doi filename and upload the document
        String docName = super.getDoiFilename(nextDoiSuffix);
        DataNode doiDocNode = new DataNode(new VOSURI(doiFolder.getUri().toString() + "/" + docName));
        vosClient.createNode(doiDocNode);
        this.uploadDOIDocument(vosClient, resource, doiDocNode);
        
        // Create the DOI data folder
        VOSURI dataDir = new VOSURI(doiFolder.getUri().toString() + "/data");
        ContainerNode newDataFolder = new ContainerNode(dataDir);
        NodeProperty writeGroup = new NodeProperty(VOS.PROPERTY_URI_GROUPWRITE, guri.toString());
        newDataFolder.getProperties().add(writeGroup);
        vosClient.createNode(newDataFolder);

        // Done, send redirect to GET for the XML file just made
        String redirectUrl = syncInput.getRequestURI() + "/" + nextDoiSuffix;
        syncOutput.setHeader("Location", redirectUrl);
        syncOutput.setCode(303);
    }

    private Resource getTemplateResource() {
        Resource templateResource = null;

        try {
            InputStream inputStream = new FileInputStream(DOI_TEMPLATE_RESOURCE_41);
            // read xml file
            DoiXmlReader reader = new DoiXmlReader(true);
            templateResource = reader.read(inputStream);
        } catch (IOException fne) {
            throw new RuntimeException("failed to load " + DOI_TEMPLATE_RESOURCE_41 + " from classpath");
        } catch (DoiParsingException dpe) {
            throw new RuntimeException("Structure of template file " + DOI_TEMPLATE_RESOURCE_41 + " failed validation");
        }

        return templateResource;
    }

    /**
     * Add the CADC template material to the DOI during the minting step
     * @param inProgressDoi
     * @param journalRef
     * @return
     */
    private Resource mkMintedResource(Resource inProgressDoi, String journalRef) {

        // Build a resource using the template file
        Resource cadcTemplate = getTemplateResource();

        // Whitelist handling of fields users are allowed to provide information for.

        if (cadcTemplate.contributors != null) {
            inProgressDoi.contributors = cadcTemplate.contributors;
        }
        else {
            throw new RuntimeException("contributors stanza missing from CADC template.");
        }

        if (cadcTemplate.rightsList != null) {
            inProgressDoi.rightsList = cadcTemplate.rightsList;
        }
        else {
            throw new RuntimeException("rightslist stanza missing from CADC template.");
        }

        // TODO:
        // calculate size of data set and add to the mintedDoi resource


        // Generate the description string
        // Get first author's last name
        String lastName = inProgressDoi.getCreators().get(0).familyName;

        if (lastName == null) {
            // Use full name in a pinch
            lastName = inProgressDoi.getCreators().get(0).getCreatorName().getText();
        }

        String description =  String.format(DESCRIPTION_TEMPLATE, inProgressDoi.getTitles().get(0).getText(), lastName, journalRef);

        List<Description> descriptionList = new ArrayList<Description>();
        Description newDescrip = new Description(inProgressDoi.language,"", DescriptionType.OTHER);
        descriptionList.add(newDescrip);

        inProgressDoi.descriptions = descriptionList;

        return inProgressDoi;
    }

    
    private GroupURI createDoiGroup(String groupName) throws Exception {
        // Create group to use for applying permissions
        GMSClient gmsClient = new GMSClient(new URI(GMS_RESOURCE_ID));
        String doiGroupName = DOI_GROUP_PREFIX + groupName;
        String doiGroupURI = GMS_RESOURCE_ID + "?" + doiGroupName;
        GroupURI guri = new GroupURI(new URI(doiGroupURI));
        log.debug("creating group: " + guri);

        Group doiRWGroup = new Group(guri);
        User member = new User();
        member.getIdentities().addAll(callingSubject.getPrincipals());
        doiRWGroup.getUserMembers().add(member);
        doiRWGroup.getUserAdmins().add(member);
        gmsClient.createGroup(doiRWGroup);
        log.debug("doi group created: " + guri);
        return guri;
    }
    
    private ContainerNode createDOIDirectory(VOSpaceClient vosClient, GroupURI guri, String folderName)
        throws Exception {
        
        List<NodeProperty> properties = new ArrayList<>();

        // This will change to become public on minting. While in DRAFT,
        // directory is visible in AstroDataCitationDOI directory, but not readable
        // except by doiadmin and calling user's group
        NodeProperty isPublic = new NodeProperty(VOS.PROPERTY_URI_ISPUBLIC, "false");
        properties.add(isPublic);

        // Get numeric id for setting doiRequestor property
        NodeProperty doiRequestor = new NodeProperty(DOI_VOS_REQUESTER_PROP, this.callingSubjectNumericID.toString());
        properties.add(doiRequestor);
        
        NodeProperty doiStatus = new NodeProperty(DOI_VOS_STATUS_PROP, DOI_VOS_STATUS_DRAFT);
        properties.add(doiStatus);

        // Should have come in as a parameter with the POST
        NodeProperty journalRef = new NodeProperty(DOI_VOS_JOURNAL_PROP, syncInput.getParameter(JOURNALREF_PARAM));
        properties.add(journalRef);

        // All folders will be only readable by requester
        NodeProperty rGroup = new NodeProperty(VOS.PROPERTY_URI_GROUPREAD, guri.toString());
        properties.add(rGroup);

        String dataDirURI = DOI_BASE_VOSPACE + "/" + folderName;

        VOSURI target = new VOSURI(new URI(dataDirURI));
        ContainerNode newFolder = new ContainerNode(target, properties);
        vosClient.createNode(newFolder);
        return newFolder;
    }
    
    private void uploadDOIDocument(VOSpaceClient vosClient, Resource resource, DataNode docNode)
        throws ResourceNotFoundException {
        
        List<Protocol> protocols = new ArrayList<Protocol>();
        protocols.add(new Protocol(VOS.PROTOCOL_HTTP_PUT));
        protocols.add(new Protocol(VOS.PROTOCOL_HTTPS_PUT));
        Transfer transfer = new Transfer(docNode.getUri().getURI(), Direction.pushToVoSpace, protocols);
        ClientTransfer clientTransfer = vosClient.createTransfer(transfer);
        DoiOutputStream outStream = new DoiOutputStream(resource);
        clientTransfer.setOutputStreamWrapper(outStream);
        clientTransfer.run();

        if (clientTransfer.getThrowable() != null) {
            log.info(clientTransfer.getThrowable().getMessage());

            if (clientTransfer.getThrowable() != null) {
                log.debug(clientTransfer.getThrowable().getMessage());
                String message = clientTransfer.getThrowable().getMessage();
                
                // Note: proper exception handling in ClientTransfer would eliminate
                // the need for message parsing.
                if (message.contains("NodeNotFound")) {
                    throw new ResourceNotFoundException(message);
                }
                if (message.contains("PermissionDenied")) {
                    throw new AccessControlException(message);
                }
                throw new RuntimeException((clientTransfer.getThrowable().getMessage()));
            }

        }
    }

    private String generateNextDOINumber(VOSpaceClient vosClient, VOSURI baseDoiURI)
        throws Exception {
        
        // child nodes of baseNode should have name structure YY.XXXX
        // go through list of child nodes
        // extract XXXX
        // track largest
        // add 1
        // reconstruct YY.XXXX structure and return
        
        ContainerNode baseNode = (ContainerNode) vosClient.getNode(baseDoiURI.getPath());

        // Look into the node list for folders from current year only
        DateFormat df = new SimpleDateFormat("yy"); // Just the year, with 2 digits
        String currentYear = df.format(Calendar.getInstance().getTime());

        Integer maxDoi = 0;
        if (baseNode.getNodes().size() > 0) {
            for( Node childNode : baseNode.getNodes()) {
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

    private class DoiOutputStream implements OutputStreamWrapper
    {
        private Resource streamResource;

        public DoiOutputStream(Resource streamRes)
        {
            this.streamResource = streamRes;
        }

        public void write(OutputStream out) throws IOException
        {
            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(streamResource, out);
        }
    }

}
