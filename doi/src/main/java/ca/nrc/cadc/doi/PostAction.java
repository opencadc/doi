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

import org.opencadc.gms.GroupURI;

import ca.nrc.cadc.ac.Group;
import ca.nrc.cadc.ac.GroupAlreadyExistsException;
import ca.nrc.cadc.ac.User;
import ca.nrc.cadc.ac.UserNotFoundException;
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
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.net.HttpUpload;
import ca.nrc.cadc.net.NetrcFile;
import ca.nrc.cadc.net.OutputStreamWrapper;
import ca.nrc.cadc.net.ResourceNotFoundException;
import ca.nrc.cadc.util.Base64;
import ca.nrc.cadc.util.StringUtil;
import ca.nrc.cadc.vos.ContainerNode;
import ca.nrc.cadc.vos.DataNode;
import ca.nrc.cadc.vos.Direction;
import ca.nrc.cadc.vos.Node;
import ca.nrc.cadc.vos.NodeProperty;
import ca.nrc.cadc.vos.Protocol;
import ca.nrc.cadc.vos.Transfer;
import ca.nrc.cadc.vos.VOS;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.ClientAbortThread;
import ca.nrc.cadc.vos.client.ClientRecursiveSetNode;
import ca.nrc.cadc.vos.client.ClientTransfer;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.PasswordAuthentication;
import java.net.URI;
import java.net.URL;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.MissingResourceException;

import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.jdom2.Namespace;


public class PostAction extends DoiAction {
    private static final Logger log = Logger.getLogger(PostAction.class);

    public static final String DOI_TEMPLATE_RESOURCE_41 = "DoiTemplate-4.1.xml";
    public static final String DESCRIPTION_TEMPLATE = "This contains data and other information related to the publication '%s' by %s et al.";
    public static final String DATACITE_CREDENTIALS = "datacite.pass";
    
    private String dataCiteHost;
    private String dataCiteURL;

    public PostAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {
        super.init(true);

        // Do DOI creation work as doiadmin
        File pemFile = new File(System.getProperty("user.home") + "/.ssl/doiadmin.pem");
        Subject doiadminSubject = SSLUtil.createSubject(pemFile);
        Subject.doAs(doiadminSubject, new PrivilegedExceptionAction<Object>() {
            @Override
            public String run() throws Exception {
                if (doiAction != null) {
                    performDoiAction();
                } else if (doiSuffix == null) {
                    createDOI();
                } else {
                    updateDOI();
                }
                return null;
            }
        });
    }

    private Resource merge(Resource sourceResource, Resource targetResource) {

        // A user is only allowed to update creators and titles
        verifyUneditableFields(sourceResource, targetResource);

        // update editable fields
        targetResource.setCreators(sourceResource.getCreators());
        targetResource.setTitles(sourceResource.getTitles());
        targetResource.setPublicationYear(sourceResource.getPublicationYear());
        targetResource.language = sourceResource.language;

        return targetResource;
    }

    private Resource updateResource(Resource resourceFromUser) throws Exception {
        Resource updatedResource = null;
        if (resourceFromUser != null) {
            // Get resource from vospace
            Resource resourceFromVos = vClient.getResource(doiSuffix, getDoiFilename(doiSuffix));
            
            // udpate the resource from vospace and upload it
            updatedResource = merge(resourceFromUser, resourceFromVos);
            VOSURI docDataURI = new VOSURI(
                    vClient.getDoiBaseVOSURI().toString() + "/" + doiSuffix + "/" + getDoiFilename(doiSuffix) );
            this.uploadDOIDocument(updatedResource, new DataNode(docDataURI));
        }

        return updatedResource;
    }
    
    private String updateJournalRef(String journalRefFromUser) throws Exception {
        // update journal reference 
        if (journalRefFromUser != null) {
            ContainerNode doiContainerNode = vClient.getContainerNode(doiSuffix);
            String journalRefFromVOSpace = doiContainerNode.getPropertyValue(DOI_VOS_JOURNAL_PROP);
            if (journalRefFromVOSpace == null) {
                if (journalRefFromUser.length() > 0) {
                    // journal reference does not exist, add it
                    NodeProperty journalRef = new NodeProperty(DOI_VOS_JOURNAL_PROP, syncInput.getParameter(JOURNALREF_PARAM));
                    doiContainerNode.getProperties().add(journalRef);
                    vClient.getVOSpaceClient().setNode(doiContainerNode);
                }
            } else {
                if (journalRefFromUser.length() > 0) {
                    // journal reference already exists, update it
                    doiContainerNode.findProperty(DOI_VOS_JOURNAL_PROP).setValue(journalRefFromUser);
                } else {
                    // delete existing journal reference
                    doiContainerNode.findProperty(DOI_VOS_JOURNAL_PROP).setMarkedForDeletion(true);;
                }
                
                vClient.getVOSpaceClient().setNode(doiContainerNode);
            }
        }

        return journalRefFromUser;
    }

    private String getPath(String filename) {
            URL doiTemplateURL = DoiXmlReader.class.getClassLoader().getResource(filename);
            if (doiTemplateURL == null) {
                throw new MissingResourceException("Resource not found: " + filename, 
                    DoiXmlReader.class.getName(), filename);
            }
            
            return doiTemplateURL.getPath();
    }
    
    private Resource getTemplateResource() {
        Resource templateResource = null;

        try {
            String doiTemplatePath = getPath(DOI_TEMPLATE_RESOURCE_41);
            log.debug("doiTemplatePath: " + doiTemplatePath);
            InputStream inputStream = new FileInputStream(doiTemplatePath);
            // read xml file
            DoiXmlReader reader = new DoiXmlReader(false);
            templateResource = reader.read(inputStream);
        } catch (IOException fne) {
            throw new RuntimeException("failed to load " + DOI_TEMPLATE_RESOURCE_41 + " from classpath");
        } catch (DoiParsingException dpe) {
            throw new RuntimeException("Structure of template file " + DOI_TEMPLATE_RESOURCE_41 + " failed validation");
        }

        return templateResource;
    }

    private Resource addDescription(Resource inProgressDoi, String journalRef) {
        // Generate the description string
        // Get first author's last name
        String lastName = inProgressDoi.getCreators().get(0).familyName;
        if (lastName == null) {
            // Use full name in a pinch
            lastName = inProgressDoi.getCreators().get(0).getCreatorName().getText();
        }

        String description = null;
        if (StringUtil.hasText(journalRef)) {
            description =  String.format(DESCRIPTION_TEMPLATE, inProgressDoi.getTitles().get(0).getText(), lastName) + ", " +journalRef;
        } else {
            description =  String.format(DESCRIPTION_TEMPLATE, inProgressDoi.getTitles().get(0).getText(), lastName);
        }
        
        List<Description> descriptionList = new ArrayList<Description>();
        Description newDescrip = new Description(inProgressDoi.language, description, DescriptionType.OTHER);
        descriptionList.add(newDescrip);
        inProgressDoi.descriptions = descriptionList;

        return inProgressDoi;
    }
    
    /**
     * Add the CADC template material to the DOI during the minting step
     */
    private Resource addFinalElements(Resource inProgressDoi, String journalRef) {

        // Build a resource using the template file
        Resource cadcTemplate = getTemplateResource();

        // Whitelist handling of fields users are allowed to provide information for.

        if (cadcTemplate.contributors == null) {
            throw new RuntimeException("contributors stanza missing from CADC template.");
        } else {
            inProgressDoi.contributors = cadcTemplate.contributors;
        }

        if (cadcTemplate.rightsList != null) {
            throw new RuntimeException("rightslist stanza missing from CADC template.");
        } else {
            inProgressDoi.rightsList = cadcTemplate.rightsList;
        }

        // Generate the description string
        if (journalRef != null) {
            inProgressDoi = addDescription(inProgressDoi, journalRef);
        }

        return inProgressDoi;
    }
    
    /*
     * 
     */
    private String getCredentials() {
        // datacite.pass contains the credentials and is in the doi.war file
        String dataciteCredentialsPath = getPath(DATACITE_CREDENTIALS);
        log.debug("datacite username/password file path: " + dataciteCredentialsPath);
        NetrcFile netrcFile = new NetrcFile(dataciteCredentialsPath);
        PasswordAuthentication pa = netrcFile.getCredentials(dataCiteHost, true);
        if (pa == null) {
            throw new RuntimeException("failed to read from " + dataciteCredentialsPath + " file");
            }

        return pa.getUserName() + ":" + String.valueOf(pa.getPassword());
    }
    
    private void processResponse(Throwable throwable, int responseCode, String responseBody, String msg) throws IOException {
        log.debug("response code from DataCite: " + responseCode);

        // check if an exception was thrown
        if (throwable != null) {
            if ((responseCode == 401) || (responseCode == 403)) {
                throw new AccessControlException(throwable.getMessage());
            } else {
                throw new RuntimeException(responseBody + ", " + throwable);
            }
        }
        
        // no exception thrown, check response code
        if (responseCode == 200 || responseCode == 201) {
            log.debug(msg);
            return;
        } else {
            throw new IOException("HttpResponse (" + responseCode + ") - " + responseBody);
        }

    }
    
    private void registerDOI(URL postURL, String content, String contentType, boolean redirect) throws IOException {
        log.debug("post to DataCite URL: " + postURL);
        log.debug("contentType: " + contentType);

        // post to DataCite
        HttpPost postToDataCite = new HttpPost(postURL, content, contentType, redirect);
        postToDataCite.setRequestProperty("Authorization", "Basic " + Base64.encodeString(getCredentials()));    	
        postToDataCite.run();

        // process response
        String msg = "Successfully registered DOI " + doiSuffix;
        processResponse(postToDataCite.getThrowable(), postToDataCite.getResponseCode(), postToDataCite.getResponseBody(), msg);
    }
    
    private void makeDOIFindable(ContainerNode doiContainerNode) throws Exception {
        // form the upload endpoint
        String doiToMakeFindable = CADC_DOI_PREFIX + "/" + doiSuffix;
        URL makeFindableURL = new URL(dataCiteURL +"/doi/" + doiToMakeFindable);
        log.debug("makeFindable endpoint: " + makeFindableURL);

        // add the landing page URL
        String content = "doi=" + doiToMakeFindable + "\nurl=" + this.landingPageURL + "?doi=" + doiSuffix;
        log.debug("content: " + content);    	
        InputStream inputStream = new ByteArrayInputStream(content.getBytes());

        // upload
        HttpUpload put = new HttpUpload(inputStream, makeFindableURL);
        put.setRequestProperty("Authorization", "Basic " + Base64.encodeString(getCredentials()));
        put.setBufferSize(64 * 1024);
        put.setContentType("text/plain;charset=UTF-8");
        put.run();

        // process response
        String msg = "Successfully made DOI " + doiSuffix + " findable";
        processResponse(put.getThrowable(), put.getResponseCode(), put.getResponseBody(), msg);
    }
   
    private String getDOIContent() throws Exception  {
        Resource resource = vClient.getResource(doiSuffix, getDoiFilename(doiSuffix));
        StringBuilder builder = new StringBuilder();
        DoiXmlWriter writer = new DoiXmlWriter();
        writer.write(resource, builder);
        return builder.toString();
    }


    private void register(ContainerNode doiContainerNode) throws Exception {
        String groupRead = "";
        String groupWrite = "";
        String xmlFilename = doiSuffix + "/"+ getDoiFilename(doiSuffix);
        DataNode xmlFile = null;

        try {
            // update status
            doiContainerNode.findProperty(DOI_VOS_STATUS_PROP).setValue(Status.REGISTERING.getValue());
            vClient.getVOSpaceClient().setNode(doiContainerNode);

            // register DOI to DataCite
            String doiToRegister = CADC_DOI_PREFIX + "/" + doiSuffix;
            String content = getDOIContent();
            String contentType = "application/xml;charset=UTF-8";
            URL registerURL = new URL(dataCiteURL + "/metadata/" + doiToRegister);
            registerDOI(registerURL, content, contentType, true);

            // success, add landing page to the DOI instance
            makeDOIFindable(doiContainerNode);

            // completed minting, update status and node properties
            doiContainerNode.findProperty(DOI_VOS_STATUS_PROP).setValue(Status.MINTED.getValue());

            // make parent container and XML file public, remove group properties.
            // this is required for the landing page to be available to doi.org for
            // anonymous access
            xmlFile = vClient.getDataNode(xmlFilename);
            xmlFile.findProperty(VOS.PROPERTY_URI_ISPUBLIC).setValue("true");
            if (StringUtil.hasText(xmlFile.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD))) {
                xmlFile.findProperty(VOS.PROPERTY_URI_GROUPREAD).setMarkedForDeletion(true);
            }
            if (StringUtil.hasText(xmlFile.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE))) {
                xmlFile.findProperty(VOS.PROPERTY_URI_GROUPWRITE).setMarkedForDeletion(true);
            }

            vClient.getVOSpaceClient().setNode(xmlFile);

            doiContainerNode.findProperty(VOS.PROPERTY_URI_ISPUBLIC).setValue("true");
            groupRead = doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD);
            if (StringUtil.hasText(groupRead)) {
                doiContainerNode.findProperty(VOS.PROPERTY_URI_GROUPREAD).setMarkedForDeletion(true);
            }
            groupWrite = doiContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE);
            if (StringUtil.hasText(groupWrite)) {
                doiContainerNode.findProperty(VOS.PROPERTY_URI_GROUPWRITE).setMarkedForDeletion(true);
            }
            vClient.getVOSpaceClient().setNode(doiContainerNode);

        } catch (Exception ex) {
            // update status to flag error state, and original properties of
            // container node and xml file

            if (xmlFile != null) {
                xmlFile.findProperty(VOS.PROPERTY_URI_ISPUBLIC).setValue("false");
                if (StringUtil.hasText(groupRead)) {
                    xmlFile.findProperty(VOS.PROPERTY_URI_GROUPREAD).setValue(groupRead);
                }
                if (StringUtil.hasText(groupWrite)) {
                    xmlFile.findProperty(VOS.PROPERTY_URI_GROUPWRITE).setValue(groupRead);
                }
                vClient.getVOSpaceClient().setNode(xmlFile);
            }

            doiContainerNode.findProperty(DOI_VOS_STATUS_PROP).setValue(Status.ERROR_REGISTERING.getValue());
            doiContainerNode.findProperty(VOS.PROPERTY_URI_ISPUBLIC).setValue("false");
            if (StringUtil.hasText(groupRead)) {
                doiContainerNode.findProperty(VOS.PROPERTY_URI_GROUPREAD).setValue(groupRead);
            }
            if (StringUtil.hasText(groupWrite)) {
                doiContainerNode.findProperty(VOS.PROPERTY_URI_GROUPWRITE).setValue(groupRead);
            }

            // update both nodes
            // This will work unless vospace is failing
            vClient.getVOSpaceClient().setNode(doiContainerNode);

            throw ex;
        }
    }

    private void lockData(ContainerNode doiContainerNode) throws Exception {        
        try {
            ContainerNode dataContainerNode = vClient.getContainerNode(doiSuffix + "/data");

            // update status
            doiContainerNode.findProperty(DOI_VOS_STATUS_PROP).setValue(Status.LOCKING_DATA.getValue());;
            vClient.getVOSpaceClient().setNode(doiContainerNode);

            // lock data directory and subdirectories, make them public
            dataContainerNode.findProperty(VOS.PROPERTY_URI_ISPUBLIC).setValue("true");
            if (StringUtil.hasText(dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPREAD))) {
                dataContainerNode.findProperty(VOS.PROPERTY_URI_GROUPREAD).setMarkedForDeletion(true);
            }

            if (StringUtil.hasText(dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_GROUPWRITE))) {
                dataContainerNode.findProperty(VOS.PROPERTY_URI_GROUPWRITE).setMarkedForDeletion(true);
            }

            NodeProperty readOnly = new NodeProperty(VOS.PROPERTY_URI_ISLOCKED, "true");
            dataContainerNode.getProperties().add(readOnly);
            // clear all children in the dataContainerNode, otherwise the XML file may be
            // too long resulting in (413) Request Entity Too Large
            dataContainerNode.setNodes(new ArrayList<Node>());
            vClient.getVOSpaceClient().setNode(dataContainerNode);
            
            // get the job URL
            ClientRecursiveSetNode recSetNode = vClient.getVOSpaceClient().setNodeRecursive(dataContainerNode);
            URL jobURL = recSetNode.getJobURL();

            // this is an async operation
            Thread abortThread = new ClientAbortThread(jobURL);
            Runtime.getRuntime().addShutdownHook(abortThread);
            recSetNode.setMonitor(false);
            recSetNode.run();
            Runtime.getRuntime().removeShutdownHook(abortThread);
            log.debug("invoked async call to recursively set the properties in the data directory " + doiSuffix + "/data");
           
            // save job URL
            NodeProperty jobURLProp = new NodeProperty(DoiAction.DOI_VOS_JOB_URL_PROP, jobURL.toExternalForm());
            doiContainerNode.getProperties().add(jobURLProp);
            vClient.getVOSpaceClient().setNode(doiContainerNode);
        } catch (Exception ex) {
            // update status
            doiContainerNode.findProperty(DOI_VOS_STATUS_PROP).setValue(Status.ERROR_LOCKING_DATA.getValue());;
            String jobURLString = doiContainerNode.getPropertyValue(DoiAction.DOI_VOS_JOB_URL_PROP);
            if (jobURLString != null) {
            	doiContainerNode.findProperty(DoiAction.DOI_VOS_JOB_URL_PROP).setMarkedForDeletion(true);
            }
            
            vClient.getVOSpaceClient().setNode(doiContainerNode);
            throw ex;
        }
    }
    
    private void setDataCiteProperties() {
        if (isTesting()) {
            this.dataCiteHost = devHost;
            this.dataCiteURL = devURL;
        } else {
            this.dataCiteHost = prodHost;
            this.dataCiteURL = prodURL;
        }
    }
    
    private void performDoiAction() throws Exception {
        if (doiAction.equals(DoiAction.MINT_ACTION)) {
            setDataCiteProperties();

            // start minting process            
            // check minting status
            ContainerNode doiContainerNode = vClient.getContainerNode(doiSuffix);
            Status mintingStatus = Status.toValue(doiContainerNode.getPropertyValue(DoiAction.DOI_VOS_STATUS_PROP));
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
            }

            // Done, send redirect to GET for the XML file just minted
            int lastPosition = syncInput.getRequestURI().lastIndexOf('/');
            String redirectUrl = syncInput.getRequestURI().substring(0, lastPosition);
            log.debug("redirectUrl: " + redirectUrl);
            syncOutput.setHeader("Location", redirectUrl);
            syncOutput.setCode(303);
        } else {
            throw new UnsupportedOperationException("DOI action not implemented: " + doiAction);
        }
    }
    
    // update a DOI instance
    private void updateDOI() throws Exception {
        // Get the submitted form data, if it exists
        Resource resourceFromUser = (Resource) syncInput.getContent(DoiInlineContentHandler.CONTENT_KEY);
        String journalRefFromUser = syncInput.getParameter(JOURNALREF_PARAM);
        if (resourceFromUser == null && journalRefFromUser == null) {
            throw new IllegalArgumentException("No content");
        }

        // perform the update
        updateResource(resourceFromUser);
        updateJournalRef(journalRefFromUser);

        // Done, send redirect to GET for the XML file just uploaded
        String redirectUrl = syncInput.getRequestURI();
        syncOutput.setHeader("Location", redirectUrl);
        syncOutput.setCode(303);
    }

    private void verifyUneditableFields(Resource s1, Resource s2) {
        if (!s1.getNamespace().getPrefix().equals(s2.getNamespace().getPrefix()) ||
            !s1.getNamespace().getURI().equals(s2.getNamespace().getURI())) {
            Namespace expected = s2.getNamespace();
            Namespace actual = s1.getNamespace();
            String msg = "namespace update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalArgumentException(msg);
        } else if (!s1.getPublisher().equals(s2.getPublisher())) {
            String expected = s2.getPublisher();
            String actual = s1.getPublisher();
            String msg = "software error, publisher is different, expected = " + expected + ", actual = " + actual;
            throw new IllegalArgumentException(msg);
        } else {
            verifyIdentifier(s1.getIdentifier(), s2.getIdentifier());
            verifyResourceType(s1.getResourceType(), s2.getResourceType());
        }
    }
    
    private void verifyString(String s1, String s2, String field)
    {
        verifyNull(s1, s2, field);
        if (s1 != null)
        {
            if (!s1.equals(s2)) {
                String msg = field + " update is not allowed, expected = " + s2 + ", actual = " + s1;
                throw new IllegalArgumentException(msg);
            }
        }
    }

    private void verifyNull(Object o1, Object o2, String field)
    {
        if (o1 == null)
        {
            if (o2 != null) {
                String msg = field + " update is not allowed, expected = " + o2 + ", actual = null";
                throw new IllegalArgumentException(msg);
            }
        } 
        else
        {
            if (o2 == null) {
                String msg = field + " update is not allowed, expected = null, actual = " + o1;
                throw new IllegalArgumentException(msg);
            }
        }
    }

    private void verifyIdentifier(Identifier id1, Identifier id2) {
        if (!id1.getText().equals(id2.getText())) {
            String expected = id2.getText();
            String actual = id1.getText();
            String msg = "identifier update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalArgumentException(msg);
        } else if (!id1.getIdentifierType().equals(id2.getIdentifierType())) {
            String expected = id2.getIdentifierType();
            String actual = id1.getIdentifierType();
            String msg = "identifierType update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalArgumentException(msg);
        }
    }
    
    private void verifyResourceType(DoiResourceType rt1, DoiResourceType rt2) {
        verifyNull(rt1, rt2, "DoiResourceType");
        if (rt1.getResourceTypeGeneral() != rt2.getResourceTypeGeneral()) {
            String expected = rt2.getResourceTypeGeneral().getValue();
            String actual = rt1.getResourceTypeGeneral().getValue();
            String msg = "resourceType update is not allowed, expected = " + expected + ", actual = " + actual;
            throw new IllegalArgumentException(msg);
        } else {
            verifyString(rt1.text, rt2.text, "resourceTYpe text");
        }
    }
    
    private void setPermissions(List<NodeProperty> properties, String guriString) {
        // Before completion, directory is visible in AstroDataCitationDOI directory, but not readable
        // except by doiadmin and calling user's group
        NodeProperty isPublic = new NodeProperty(VOS.PROPERTY_URI_ISPUBLIC, "false");
        properties.add(isPublic);

        // All folders will be only readable by requester
        NodeProperty rGroup = new NodeProperty(VOS.PROPERTY_URI_GROUPREAD, guriString);
        properties.add(rGroup);
        
        // All folders will be only readable by requester
        NodeProperty writeGroup = new NodeProperty(VOS.PROPERTY_URI_GROUPWRITE, guriString);
        properties.add(writeGroup);
    }
    
    private void createDOI() throws Exception {
        // Get the submitted form data, if it exists
        Resource resource = (Resource) syncInput.getContent(DoiInlineContentHandler.CONTENT_KEY);
        if (resource == null) {
            throw new IllegalArgumentException("No content");
        }

        // Determine next DOI number   
        // Note: The generated DOI number is the suffix which should be case insensitive.
        //       Since we are using a number, it does not matter. However if we decide
        //       to use a String, we should only generate either a lowercase or an
        //       uppercase String. (refer to https://support.datacite.org/docs/doi-basics)
        VOSURI doiDataURI = vClient.getDoiBaseVOSURI();
        String nextDoiSuffix = generateNextDOINumber(doiDataURI);
        if (isTesting()) {
        	nextDoiSuffix = nextDoiSuffix + DoiAction.TEST_SUFFIX;
        }
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
        ContainerNode doiFolder = this.createDOIDirectory(guri, nextDoiSuffix);
        
        // create VOSpace data node to house XML doc using doi filename and upload the document
        String docName = super.getDoiFilename(nextDoiSuffix);
        DataNode doiDocNode = new DataNode(new VOSURI(doiFolder.getUri().toString() + "/" + docName));
        vClient.getVOSpaceClient().createNode(doiDocNode);
        this.uploadDOIDocument(resource, doiDocNode);
        
        // Create the DOI data folder
        VOSURI dataDir = new VOSURI(doiFolder.getUri().toString() + "/data");
        ContainerNode newDataFolder = new ContainerNode(dataDir);
        setPermissions(newDataFolder.getProperties(), guri.toString());
        vClient.getVOSpaceClient().createNode(newDataFolder);

        // Done, send redirect to GET for the XML file just made
        String redirectUrl = syncInput.getRequestURI() + "/" + nextDoiSuffix;
        syncOutput.setHeader("Location", redirectUrl);
        syncOutput.setCode(303);
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
        
        try {
            gmsClient.createGroup(doiRWGroup);
        } catch (GroupAlreadyExistsException gaeex) {
            // expose it as a server error
            throw new RuntimeException(gaeex);
        } catch (UserNotFoundException unfex) {
            // expose it as a server error
            throw new RuntimeException(unfex);
        }
        
        log.debug("doi group created: " + guri);
        return guri;
    }
    
    private ContainerNode createDOIDirectory(GroupURI guri, String folderName)
        throws Exception {
        
        List<NodeProperty> properties = new ArrayList<>();

        // Before completion, directory is visible in AstroDataCitationDOI directory, 
        // but not readable except by doiadmin and calling user's group
        setPermissions(properties, guri.toString());

        // Get numeric id for setting doiRequestor property
        NodeProperty doiRequestor = new NodeProperty(DOI_VOS_REQUESTER_PROP, this.callersNumericId.toString());
        properties.add(doiRequestor);
        
        NodeProperty doiStatus = new NodeProperty(DOI_VOS_STATUS_PROP, DOI_VOS_STATUS_DRAFT);
        properties.add(doiStatus);
        
        // Should have come in as a parameter with the POST
        NodeProperty journalRef = new NodeProperty(DOI_VOS_JOURNAL_PROP, syncInput.getParameter(JOURNALREF_PARAM));
        properties.add(journalRef);
        
        if (isTesting()) {
            NodeProperty runIdTest = new NodeProperty(VOS.PROPERTY_URI_RUNID, RUNID_TEST);
            properties.add(runIdTest);
        }

        String dataDirURI = DOI_BASE_VOSPACE + "/" + folderName;

        VOSURI target = new VOSURI(new URI(dataDirURI));
        ContainerNode newFolder = new ContainerNode(target, properties);
        vClient.getVOSpaceClient().createNode(newFolder);
        return newFolder;
    }
    
    private void uploadDOIDocument(Resource resource, DataNode docNode)
        throws ResourceNotFoundException {
        
        Transfer transfer = new Transfer(docNode.getUri().getURI(), Direction.pushToVoSpace);
        Protocol put = new Protocol(VOS.PROTOCOL_HTTPS_PUT);
        //put.setSecurityMethod(Standards.SECURITY_METHOD_CERT);
        transfer.getProtocols().add(put);
        
        ClientTransfer clientTransfer = vClient.getVOSpaceClient().createTransfer(transfer);
        DoiOutputStream outStream = new DoiOutputStream(resource);
        clientTransfer.setOutputStreamWrapper(outStream);
        clientTransfer.run();

        if (clientTransfer.getThrowable() != null) {
            log.debug(clientTransfer.getThrowable().getMessage());

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

    private String generateNextDOINumber(VOSURI baseDoiURI)
        throws Exception {
        
        // child nodes of baseNode should have name structure YY.XXXX
        // go through list of child nodes
        // extract XXXX
        // track largest
        // add 1
        // reconstruct YY.XXXX structure and return
        
        ContainerNode baseNode = (ContainerNode) vClient.getVOSpaceClient().getNode(baseDoiURI.getPath());

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
