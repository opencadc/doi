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

import ca.nrc.cadc.doi.datacite.Contributor;
import ca.nrc.cadc.doi.datacite.Rights;
import ca.nrc.cadc.util.FileUtil;
import ca.nrc.cadc.util.InvalidConfigException;
import ca.nrc.cadc.util.MultiValuedProperties;
import ca.nrc.cadc.util.PropertiesReader;
import java.lang.reflect.Field;
import java.net.URISyntaxException;
import java.util.Set;
import java.util.TreeSet;
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
import ca.nrc.cadc.doi.datacite.Date;
import ca.nrc.cadc.doi.datacite.DoiResourceType;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.doi.io.DoiXmlWriter;
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

import java.io.ByteArrayInputStream;
import java.io.File;
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
import java.util.List;
import java.util.MissingResourceException;

import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.DataNode;
import org.opencadc.vospace.Node;
import org.opencadc.vospace.NodeProperty;
import org.opencadc.vospace.VOS;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.ClientAbortThread;
import org.opencadc.vospace.client.ClientTransfer;
import org.opencadc.vospace.client.async.RecursiveSetNode;
import org.opencadc.vospace.transfer.Direction;
import org.opencadc.vospace.transfer.Protocol;
import org.opencadc.vospace.transfer.Transfer;


public class PostAction extends DoiAction {
    private static final Logger log = Logger.getLogger(PostAction.class);

    private static final String DATACITE_CREDENTIALS = "datacite.pass";

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
        verifyImmutableFields(sourceResource, targetResource);

        // update editable fields
        targetResource.getCreators().clear();
        targetResource.getCreators().addAll(sourceResource.getCreators());
        targetResource.getTitles().clear();
        targetResource.getTitles().addAll(sourceResource.getTitles());
        targetResource.setPublicationYear(sourceResource.getPublicationYear());
        targetResource.language = sourceResource.language;

        return targetResource;
    }

    private void updateResource(Resource resourceFromUser) throws Exception {
        if (resourceFromUser == null) {
            return;
        }

        // merge resources and push
        String nodeName = getDoiFilename(doiSuffix);
        Resource resourceFromVos = vClient.getResource(doiSuffix, nodeName);
        Resource mergedResource = merge(resourceFromUser, resourceFromVos);
//        VOSURI docVOSURI = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + doiSuffix + "/" + getDoiFilename(doiSuffix));
        VOSURI docVOSURI = getVOSURI(String.format("%s/%s", doiSuffix, getDoiFilename(doiSuffix)));
        this.uploadDOIDocument(mergedResource, docVOSURI);
    }
    
    private void updateJournalRef(String journalRefFromUser) throws Exception {
        // update journal reference 
        if (journalRefFromUser == null) {
            return;
        }

        ContainerNode doiContainerNode = vClient.getContainerNode(doiSuffix);
//        VOSURI vosuri = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + doiSuffix);
        VOSURI vosuri = getVOSURI(doiSuffix);
        String journalRefFromVOSpace = doiContainerNode.getPropertyValue(DOI_VOS_JOURNAL_PROP);
        if (journalRefFromVOSpace == null) {
            if (!journalRefFromUser.isEmpty()) {
                // journal reference does not exist, add it
                NodeProperty journalRef = new NodeProperty(DOI_VOS_JOURNAL_PROP, syncInput.getParameter(JOURNALREF_PARAM));
                doiContainerNode.getProperties().add(journalRef);
                vClient.getVOSpaceClient().setNode(vosuri, doiContainerNode);
            }
        } else {
            if (!journalRefFromUser.isEmpty()) {
                // journal reference already exists, update it
                doiContainerNode.getProperty(DOI_VOS_JOURNAL_PROP).setValue(journalRefFromUser);
            } else {
                // delete existing journal reference
                NodeProperty nodeProperty = doiContainerNode.getProperty(DOI_VOS_JOURNAL_PROP);
                if (nodeProperty != null) {
                    doiContainerNode.getProperties().remove(nodeProperty);
                    doiContainerNode.getProperties().add(new NodeProperty(DOI_VOS_JOURNAL_PROP));
                }
            }
            vClient.getVOSpaceClient().setNode(vosuri, doiContainerNode);
        }
    }

    private String getCredentials() {
//        // datacite.pass contains the credentials and is in the doi.war file
//        URL fileUrl = PostAction.class.getClassLoader().getResource(DATACITE_CREDENTIALS);
//        if (fileUrl == null) {
//            throw new MissingResourceException("Resource not found: " + DATACITE_CREDENTIALS,
//                    PostAction.class.getName(), DATACITE_CREDENTIALS);
//        }
//        String passwordPath = fileUrl.getPath();
//        log.debug("datacite username/password file path: " + passwordPath);
//        PropertiesReader reader = new PropertiesReader(passwordPath);

        File passwordFile;
        try {
            passwordFile = FileUtil.getFileFromResource(DATACITE_CREDENTIALS, PostAction.class);
        } catch (InvalidConfigException e) {
            throw new RuntimeException(String.format("Could not find password file '%s'", DATACITE_CREDENTIALS));
        }
        PropertiesReader reader = new PropertiesReader(passwordFile);
        MultiValuedProperties properties = reader.getAllProperties();
        String username = properties.getFirstPropertyValue("username");
        String password = properties.getFirstPropertyValue("password");
        if (username == null || password == null) {
            throw new RuntimeException(String.format("Username or password are missing in '%s'", DATACITE_CREDENTIALS));
        }
        return String.format("%s:%s", username, password);
    }
    
    private void processResponse(Throwable throwable, int responseCode, String responseBody, String msg)
            throws IOException {
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
        } else {
            throw new IOException("HttpResponse (" + responseCode + ") - " + responseBody);
        }
    }
    
    private void registerDOI(URL postURL, String content, String contentType, boolean redirect)
            throws IOException {
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
//        String doiToMakeFindable = CADC_DOI_PREFIX + "/" + doiSuffix;
//        URL makeFindableURL = new URL(dataCiteURL +"/doi/" + doiToMakeFindable);
        String dataCiteUrl = config.getFirstPropertyValue(DoiInitAction.DATACITE_MDS_URL_KEY);
        String path = String.format("%s/doi/%s/%s", dataCiteUrl, cadcDataCitePrefix, doiSuffix);
        URL doiURL = new URL(path);
        log.debug("makeFindable endpoint: " + doiURL);

        // add the landing page URL
        String landingPageUrl = config.getFirstPropertyValue(DoiInitAction.LANDING_URL_KEY);
//        String content = "doi=" + doiURL + "\nurl=" + landingPageUrl + "?doi=" + doiSuffix;
        String content = String.format("doi=%s\nurl=%s?doi=%s", doiURL, landingPageUrl, doiSuffix);
        log.debug("content: " + content);    	
        InputStream inputStream = new ByteArrayInputStream(content.getBytes());

        // upload
        HttpUpload put = new HttpUpload(inputStream, doiURL);
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
        Set<GroupURI> groupRead = new TreeSet<>();
        Set<GroupURI> groupWrite = new TreeSet<>();
        String xmlFilename = doiSuffix + "/"+ getDoiFilename(doiSuffix);
        DataNode xmlFile = null;

//        VOSURI doiURI = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + doiContainerNode.getName());
//        VOSURI xmlURI = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + xmlFilename);
        VOSURI doiURI = getVOSURI(doiContainerNode.getName());
        VOSURI xmlURI = getVOSURI(xmlFilename);

        try {
            // update status
            doiContainerNode.getProperty(DOI_VOS_STATUS_PROP).setValue(Status.REGISTERING.getValue());
            vClient.getVOSpaceClient().setNode(doiURI, doiContainerNode);

            // register DOI to DataCite
            String dataCiteUrl = config.getFirstPropertyValue(DoiInitAction.DATACITE_MDS_URL_KEY);
            URL registerURL = new URL(String.format("%s/metadata/%s/%s", dataCiteUrl, cadcDataCitePrefix, doiSuffix));
            String content = getDOIContent();
            String contentType = "application/xml;charset=UTF-8";
            registerDOI(registerURL, content, contentType, true);

            // success, add landing page to the DOI instance
            makeDOIFindable(doiContainerNode);

            // completed minting, update status and node properties
            doiContainerNode.getProperty(DOI_VOS_STATUS_PROP).setValue(Status.MINTED.getValue());

            // make parent container and XML file public, remove group properties.
            // this is required for the landing page to be available to doi.org for
            // anonymous access
            xmlFile = vClient.getDataNode(xmlFilename);
            xmlFile.isPublic = true;
            xmlFile.clearReadOnlyGroups = true;
            xmlFile.getReadOnlyGroup().clear();
            xmlFile.clearReadWriteGroups = true;
            xmlFile.getReadWriteGroup().clear();
            vClient.getVOSpaceClient().setNode(xmlURI, xmlFile);

            groupRead.addAll(doiContainerNode.getReadOnlyGroup());
            groupWrite.addAll(doiContainerNode.getReadWriteGroup());
            doiContainerNode.isPublic = true;
            doiContainerNode.clearReadOnlyGroups = true;
            doiContainerNode.getReadOnlyGroup().clear();
            doiContainerNode.clearReadWriteGroups = true;
            doiContainerNode.getReadWriteGroup().clear();
            vClient.getVOSpaceClient().setNode(doiURI, doiContainerNode);

        } catch (Exception ex) {
            // update status to flag error state, and original properties of
            // container node and xml file

            if (xmlFile != null) {
                xmlFile.isPublic = false;
                xmlFile.getReadOnlyGroup().addAll(groupRead);
                xmlFile.getReadWriteGroup().addAll(groupWrite);
                vClient.getVOSpaceClient().setNode(xmlURI, xmlFile);
            }

            doiContainerNode.getProperty(DOI_VOS_STATUS_PROP).setValue(Status.ERROR_REGISTERING.getValue());
            doiContainerNode.isPublic = false;
            doiContainerNode.getReadOnlyGroup().addAll(groupRead);
            doiContainerNode.getReadWriteGroup().addAll(groupWrite);

            // update both nodes
            // This will work unless vospace is failing
            vClient.getVOSpaceClient().setNode(doiURI, doiContainerNode);

            throw ex;
        }
    }

    private void lockData(ContainerNode doiContainerNode) throws Exception {
//        VOSURI containerVOSURI = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + doiSuffix);
//        VOSURI dataVOSURI = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + doiSuffix + "/data");
        String doiDataPath = doiSuffix + "/data";
        VOSURI containerVOSURI = getVOSURI(doiSuffix);
        VOSURI dataVOSURI = getVOSURI( doiDataPath);
        try {
            // update status
            ContainerNode dataContainerNode = vClient.getContainerNode(doiDataPath);
            doiContainerNode.getProperty(DOI_VOS_STATUS_PROP).setValue(Status.LOCKING_DATA.getValue());;
            vClient.getVOSpaceClient().setNode(containerVOSURI, doiContainerNode);

            // lock data directory and subdirectories, make them public
            dataContainerNode.isPublic = true;
            dataContainerNode.clearReadOnlyGroups = true;
            dataContainerNode.getReadOnlyGroup().clear();
            dataContainerNode.clearReadWriteGroups = true;
            dataContainerNode.getReadWriteGroup().clear();
            dataContainerNode.isLocked = true;

            // clear all children in the dataContainerNode, otherwise the XML file may be
            // too long resulting in (413) Request Entity Too Large
            dataContainerNode.getNodes().clear();
            vClient.getVOSpaceClient().setNode(dataVOSURI, dataContainerNode);
            
            // get the job URL
            RecursiveSetNode recSetNode = vClient.getVOSpaceClient().createRecursiveSetNode(dataVOSURI, dataContainerNode);
            URL jobURL = recSetNode.getJobURL();

            // this is an async operation
            Thread abortThread = new ClientAbortThread(jobURL);
            Runtime.getRuntime().addShutdownHook(abortThread);
            recSetNode.setMonitor(false);
            recSetNode.run();
            Runtime.getRuntime().removeShutdownHook(abortThread);
            log.debug("invoked async call to recursively set the properties in the data directory " + doiDataPath);
           
            // save job URL
            NodeProperty jobURLProp = new NodeProperty(DOI_VOS_JOB_URL_PROP, jobURL.toExternalForm());
            doiContainerNode.getProperties().add(jobURLProp);
            vClient.getVOSpaceClient().setNode(containerVOSURI, doiContainerNode);
        } catch (Exception ex) {
            // update status
            doiContainerNode.getProperty(DOI_VOS_STATUS_PROP).setValue(Status.ERROR_LOCKING_DATA.getValue());;
            String jobURLString = doiContainerNode.getPropertyValue(DOI_VOS_JOB_URL_PROP);
            if (jobURLString != null) {
                doiContainerNode.getProperties().remove(new NodeProperty(DOI_VOS_JOB_URL_PROP));
            }
            
            vClient.getVOSpaceClient().setNode(containerVOSURI, doiContainerNode);
            throw ex;
        }
    }
    
//    private void setDataCiteProperties() {
//        if (isTesting()) {
//            this.dataCiteHost = devHost;
//            this.dataCiteURL = devURL;
//        } else {
//            this.dataCiteHost = prodHost;
//            this.dataCiteURL = prodURL;
//        }
//    }
    
    private void performDoiAction() throws Exception {
        if (doiAction.equals(DoiAction.MINT_ACTION)) {
//            setDataCiteProperties();

            // start minting process            
            // check minting status
            ContainerNode doiContainerNode = vClient.getContainerNode(doiSuffix);
            Status mintingStatus = Status.toValue(doiContainerNode.getPropertyValue(DOI_VOS_STATUS_PROP));
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

    private void verifyImmutableFields(Resource r1, Resource r2) {
        if (!r1.getNamespace().getPrefix().equals(r2.getNamespace().getPrefix()) ||
            !r1.getNamespace().getURI().equals(r2.getNamespace().getURI())) {
            String msg = String.format("namespace update is not allowed, expected: %s, actual: %s",
                    r2.getNamespace(), r1.getNamespace());
            throw new IllegalArgumentException(msg);
        } else if (!r1.getPublisher().equals(r2.getPublisher())) {
            String msg = String.format("software error, publisher is different, expected: %s, actual: %s",
                    r2.getPublisher(), r1.getPublisher());
            throw new IllegalArgumentException(msg);
        } else {
            verifyIdentifier(r1.getIdentifier(), r2.getIdentifier());
            verifyResourceType(r1.getResourceType(), r2.getResourceType());
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

    private void verifyIdentifier(Identifier i1, Identifier i2) {
        if (!i1.equals(i2)) {
            String msg = String.format("identifier update is not allowed, expected: %s, actual: %s",
                    i2, i1);
            throw new IllegalArgumentException(msg);
        }
    }
    
    private void verifyResourceType(DoiResourceType rt1, DoiResourceType rt2) {
        verifyNull(rt1, rt2, "DoiResourceType");
        if (rt1.getResourceTypeGeneral() != rt2.getResourceTypeGeneral()) {
            String msg = String.format("resourceType update is not allowed, expected: %s, actual: %s",
                    rt2.getResourceTypeGeneral().getValue(), rt1.getResourceTypeGeneral().getValue());
            throw new IllegalArgumentException(msg);
        } else {
            verifyString(rt1.text, rt2.text, "resourceTYpe description");
        }
    }
    
    private void setPermissions(Node node, GroupURI doiGroup) {
        // Before completion, directory is visible in AstroDataCitationDOI directory, but not readable
        // except by doiadmin and calling user's group
        node.isPublic = false;

        // All folders will be only readable by requester
        node.getReadOnlyGroup().add(doiGroup);
        
        // All folders will be only readable by requester
        node.getReadWriteGroup().add(doiGroup);
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

        String testSuffix = config.getFirstPropertyValue(DoiInitAction.TEST_SUFFIX_KEY);
        if (testSuffix != null) {
        	nextDoiSuffix = nextDoiSuffix + testSuffix;
        }
        log.debug("Next DOI suffix: " + nextDoiSuffix);

        // update the template with the new DOI number
        assignIdentifier(resource.getIdentifier(), cadcDataCitePrefix + "/" + nextDoiSuffix);

        //Add a Created date to the Resource object
        String createdDate = new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date());
        Date doiDate = new Date(createdDate, DateType.CREATED);
        resource.dates = new ArrayList<Date>();
        resource.dates.add(doiDate);

        // Create the group that is able to administer the DOI process
        GroupURI guri = createDoiGroup(nextDoiSuffix);
        
        // Create the VOSpace area for DOI work
        ContainerNode doiFolder = this.createDOIDirectory(guri, nextDoiSuffix);
        
        // create VOSpace data node to house XML doc using doi filename and upload the document
        String docName = super.getDoiFilename(nextDoiSuffix);
        DataNode doiDocNode = new DataNode(docName);
//        VOSURI doiDocVOSURI = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + nextDoiSuffix + "/" + docName);
        VOSURI doiDocVOSURI = getVOSURI(nextDoiSuffix + "/" + docName);
        vClient.getVOSpaceClient().createNode(doiDocVOSURI, doiDocNode);
        this.uploadDOIDocument(resource, doiDocVOSURI);
        
        // Create the DOI data folder
//        VOSURI dataVOSURI = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + nextDoiSuffix + "/data");
        VOSURI dataVOSURI = getVOSURI(nextDoiSuffix + "/data");
        ContainerNode newDataFolder = new ContainerNode("data");
        setPermissions(newDataFolder, guri);
        vClient.getVOSpaceClient().createNode(dataVOSURI, newDataFolder);

        // Done, send redirect to GET for the XML file just made
        String redirectUrl = syncInput.getRequestURI() + "/" + nextDoiSuffix;
        syncOutput.setHeader("Location", redirectUrl);
        syncOutput.setCode(303);
    }
    
    private GroupURI createDoiGroup(String groupName) throws Exception {
        // Create group to use for applying permissions
        GMSClient gmsClient = getGMSClient();
//        String doiGroupName = DOI_GROUP_PREFIX + groupName;
//        String doiGroupURI = GMS_RESOURCE_ID + "?" + doiGroupName;
        String gmsResourceID = config.getFirstPropertyValue(DoiInitAction.GMS_RESOURCE_ID_KEY);
        String doiGroupPrefix = config.getFirstPropertyValue(DoiInitAction.GROUP_PREFIX_KEY);
        String group = String.format("%s?%s%s", gmsResourceID, doiGroupPrefix, groupName);
        GroupURI guri = new GroupURI(URI.create(group));
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
        
        Set<NodeProperty> properties = new TreeSet<>();

        // Get numeric id for setting doiRequestor property
        NodeProperty doiRequestor = new NodeProperty(DOI_VOS_REQUESTER_PROP, this.callersNumericId.toString());
        properties.add(doiRequestor);
        
        NodeProperty doiStatus = new NodeProperty(DOI_VOS_STATUS_PROP, DOI_VOS_STATUS_DRAFT);
        properties.add(doiStatus);
        
        // Should have come in as a parameter with the POST
        NodeProperty journalRef = new NodeProperty(DOI_VOS_JOURNAL_PROP, syncInput.getParameter(JOURNALREF_PARAM));
        properties.add(journalRef);
        
//        if (isTesting()) {
//            NodeProperty runIdTest = new NodeProperty(VOS.PROPERTY_URI_RUNID, RUNID_TEST);
//            properties.add(runIdTest);
//        }

//        VOSURI newVOSURI = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + folderName);
        VOSURI newVOSURI = getVOSURI(folderName);
        ContainerNode newFolder = new ContainerNode(folderName);

        // Before completion, directory is visible in AstroDataCitationDOI directory,
        // but not readable except by doiadmin and calling user's group
        setPermissions(newFolder, guri);

        newFolder.getProperties().addAll(properties);
        vClient.getVOSpaceClient().createNode(newVOSURI, newFolder);
        return newFolder;
    }
    
    private void uploadDOIDocument(Resource resource, VOSURI docVOSUIRI)
        throws URISyntaxException, ResourceNotFoundException {

        Transfer transfer = new Transfer(docVOSUIRI.getURI(), Direction.pushToVoSpace);
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

    // methods to assign to private field in Identity
    public static void assignIdentifier(Object ce, String identifier) {
        try {
            Field f = Identifier.class.getDeclaredField("text");
            f.setAccessible(true);
            f.set(ce, identifier);
        } catch (NoSuchFieldException fex) {
            throw new RuntimeException("Identifier class is missing the text field", fex);
        } catch (IllegalAccessException bug) {
            throw new RuntimeException("No access to Identifier text field", bug);
        }
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
