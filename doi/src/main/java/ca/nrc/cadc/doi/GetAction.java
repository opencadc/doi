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


import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusJsonWriter;
import ca.nrc.cadc.doi.status.DoiStatusListJsonWriter;
import ca.nrc.cadc.doi.status.DoiStatusListXmlWriter;
import ca.nrc.cadc.doi.status.DoiStatusXmlWriter;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.cred.client.CredUtil;
import ca.nrc.cadc.doi.datacite.DoiJsonWriter;
import ca.nrc.cadc.doi.datacite.DoiReader;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.util.StringUtil;
import ca.nrc.cadc.uws.ExecutionPhase;

import java.io.File;
import java.net.URL;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.util.ArrayList;
import java.util.List;

import javax.security.auth.Subject;

import org.apache.log4j.Logger;
import org.opencadc.vospace.ContainerNode;
import org.opencadc.vospace.Node;
import org.opencadc.vospace.NodeProperty;
import org.opencadc.vospace.VOSURI;
import org.opencadc.vospace.client.async.RecursiveSetNode;


public class GetAction extends DoiAction {

    private static final Logger log = Logger.getLogger(GetAction.class);

    public GetAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {
        super.init(false);

        // need the following statement because the VOSClient is not initializing
        // the credentials properly
        CredUtil.checkCredentials();

        if (super.doiSuffix == null) {
            // get the DoiStatus of all DOI instances for the calling user
            getStatusList();
        } else if (super.doiAction != null) {
            // perform the action on the DOI
            performDoiAction();
        } else {
            getDoi();
        }
    }
    
    private Title getTitle(Resource resource) {
        Title title = null;
        List<Title> titles = resource.getTitles();
        for (Title t : titles)
        {
            if (t.titleType == null)
            {
                title = t;
                break;
            }
        }
        return title;
    }
    
    private String updateMintingStatus(final ContainerNode doiContainerNode, final String status) throws Exception {
        File pemFile = new File(System.getProperty("user.home") + "/.ssl/doiadmin.pem");
        Subject doiadminSubject = SSLUtil.createSubject(pemFile);
        String returnStatus = (String) Subject.doAs(doiadminSubject, new PrivilegedExceptionAction<Object>() {
            @Override
            public String run() throws Exception {
            	// update status based on the result of the minting service
            	String localStatus = status;
            	String jobURLString = doiContainerNode.getPropertyValue(DOI_VOS_JOB_URL_PROP);
            	if (jobURLString != null) {
            		URL jobURL = new URL(jobURLString);
                    VOSURI vosuri = new VOSURI(VAULT_RESOURCE_ID, DOI_BASE_FILEPATH + "/" + doiContainerNode.getName());
            		RecursiveSetNode recursiveSetNode = new RecursiveSetNode(jobURL, doiContainerNode);
                    recursiveSetNode.setSchemaValidation(false);
            		ExecutionPhase phase = recursiveSetNode.getPhase(20); // seconds
            		switch (phase) {
            			case COMPLETED:
            			case ARCHIVED:
            				// job finished, set corresponding status
            				if (status.equals(Status.LOCKING_DATA.getValue())) {
            					localStatus = Status.LOCKED_DATA.getValue();
            				} else if (status.equals(Status.REGISTERING.getValue())) {
            					localStatus = Status.MINTED.getValue();
            				}
            				
            				// delete jobURL property
                            doiContainerNode.getProperties().remove(new NodeProperty(DOI_VOS_JOB_URL_PROP));
            				doiContainerNode.getProperty(DOI_VOS_STATUS_PROP).setValue(localStatus);
            				vClient.getVOSpaceClient().setNode(vosuri, doiContainerNode);
            				break;
            			case ERROR:
            			case ABORTED:
            			case UNKNOWN:
            			case SUSPENDED:
            			case HELD:
            				// assume job resulted in error, set corresponding status
            				if (status.equals(Status.LOCKING_DATA.getValue())) {
            					localStatus = Status.ERROR_LOCKING_DATA.getValue();
            				} else if (status.equals(Status.REGISTERING.getValue())) {
            					localStatus = Status.ERROR_REGISTERING.getValue();
            				}
            				
            				// delete jobURL property
                            doiContainerNode.getProperties().remove(new NodeProperty(DOI_VOS_JOB_URL_PROP));
            				doiContainerNode.getProperty(DOI_VOS_STATUS_PROP).setValue(localStatus);
            				vClient.getVOSpaceClient().setNode(vosuri, doiContainerNode);
            				break;
            			case PENDING:
            			case QUEUED:
            			case EXECUTING:
            				// job is in progress, do nothing
            				break;
            			default:
            				// do nothing
            		}
            	}
            	return localStatus;
            }
        });
        return returnStatus;
    }
    
    private DoiStatus getDoiStatus(String doiSuffixString, ContainerNode doiContainerNode) throws Exception {
        DoiStatus doiStatus = null;
        if (vClient.isCallerAllowed(doiContainerNode))
        {
            // get status
            String status = doiContainerNode.getPropertyValue(DOI_VOS_STATUS_PROP);
            log.debug("node: " + doiContainerNode.getName() + ", status: " + status);
            if (StringUtil.hasText(status) && 
            		!status.equals(Status.ERROR_REGISTERING.getValue()) &&
            		!status.equals(Status.ERROR_LOCKING_DATA.getValue())) {
                // update status based on the result of the minting service
                status = updateMintingStatus(doiContainerNode, status);
            }

            // get the data directory
            String dataDirectory = null;
            List<Node> doiContainedNodes = doiContainerNode.getNodes();
            for (Node node : doiContainedNodes) {
                if (node.getName().equals("data")) {
                    dataDirectory = String.format("%s/%s/data", DoiAction.DOI_BASE_FILEPATH, doiSuffixString);
                    break;
                }
            }

            // get title and construct DoiStatus instance
            Title title = null;
            try {
                Resource resource = vClient.getResource(doiSuffixString, getDoiFilename(doiSuffixString));
                title = getTitle(resource);
                doiStatus = new DoiStatus(resource.getIdentifier(), title, dataDirectory, Status.toValue(status));
            } catch (Exception ex) {
                Identifier id = new Identifier("DOI");
                DoiReader.assignIdentifier(id, doiSuffixString);
                doiStatus = new DoiStatus(id, title, dataDirectory, Status.toValue(status));
            }

            // set journalRef
            doiStatus.journalRef = doiContainerNode.getPropertyValue(DOI_VOS_JOURNAL_PROP);
        }
        else
        {
            String msg = "Access Denied to " + doiSuffixString + ".";
            throw new AccessControlException(msg);
        }

        return doiStatus;
    }
    
    private List<Node> getOwnedDOIList() throws Exception {
        List<Node> ownedNodes = new ArrayList<>();
        ContainerNode doiRootNode = vClient.getContainerNode("");
        if (doiRootNode != null) {
            for (Node childNode : doiRootNode.getNodes()) {
                // TODO: configure doiadmin viewing of all nodes
                NodeProperty requester = childNode.getProperty(DOI_VOS_REQUESTER_PROP);
                if (requester != null && requester.getValue() != null) {
                    try {
                        Long uid = Long.parseLong(requester.getValue());
                        if (callersNumericId.equals(uid)) {
                            ownedNodes.add(childNode);
                        }
                    } catch (NumberFormatException e) {
                        log.error(String.format("Unable to parse requester uid[%s] for doi: %s",
                                requester.getValue(), childNode.getName()), e);
                    }
                }
            }
        }
        return ownedNodes;
    }
    
    private void getStatusList() throws Exception {
        List<DoiStatus> doiStatusList = new ArrayList<>();
        List<Node> nodes = getOwnedDOIList();
        for (Node node : nodes)
        {
            // Verify this is a container node before continuing
            if (node instanceof ContainerNode) {
                try {
            		ContainerNode doiContainerNode = vClient.getContainerNode(node.getName());
                    DoiStatus doiStatus = getDoiStatus(node.getName(), doiContainerNode);
                    if (doiStatus != null) {
                        doiStatusList.add(doiStatus);
                    }
                } catch (Exception ex) {
                    // skip
                    log.debug(ex);
                }
            } else {
                log.warn("Non-container node found in DOI base directory. Skipping... ");
            }
        }

        String docFormat = this.syncInput.getHeader("Accept");
        log.debug("'Accept' value in header is " + docFormat);
        if (docFormat != null && docFormat.contains("application/json"))
        {
            // json document
            syncOutput.setHeader("Content-Type", "application/json");
            DoiStatusListJsonWriter writer = new DoiStatusListJsonWriter();
            writer.write(doiStatusList, syncOutput.getOutputStream());
        }
        else
        {
            // xml document
            syncOutput.setHeader("Content-Type", "text/xml");
            DoiStatusListXmlWriter writer = new DoiStatusListXmlWriter();
            writer.write(doiStatusList, syncOutput.getOutputStream());
        }
    }
    
    private void getDoi() throws Exception {
        Resource resource = vClient.getResource(doiSuffix, getDoiFilename(doiSuffix));
        String docFormat = this.syncInput.getHeader("Accept");
        log.debug("'Accept' value in header is " + docFormat);
        if (docFormat != null && docFormat.contains("application/json"))
        {
            // json document
            syncOutput.setHeader("Content-Type", "application/json");
            DoiJsonWriter writer = new DoiJsonWriter();
            writer.write(resource, syncOutput.getOutputStream());
        }
        else
        {
            // xml document
            syncOutput.setHeader("Content-Type", "text/xml");
            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(resource, syncOutput.getOutputStream());
        }
    }
    
    private void performDoiAction() throws Exception {
        if (doiAction.equals(DoiAction.STATUS_ACTION))
        {
            ContainerNode doiContainerNode = vClient.getContainerNode(doiSuffix);
            DoiStatus doiStatus = getDoiStatus(doiSuffix, doiContainerNode);

            String docFormat = this.syncInput.getHeader("Accept");
            log.debug("'Accept' value in header is " + docFormat);
            if (docFormat != null && docFormat.contains("application/json"))
            {
                // json document
                syncOutput.setHeader("Content-Type", "application/json");
                DoiStatusJsonWriter writer = new DoiStatusJsonWriter();
                writer.write(doiStatus, syncOutput.getOutputStream());
            }
            else
            {
                // xml document
                syncOutput.setHeader("Content-Type", "text/xml");
                DoiStatusXmlWriter writer = new DoiStatusXmlWriter();
                writer.write(doiStatus, syncOutput.getOutputStream());
            }
        }
        else
        {
            throw new UnsupportedOperationException("DOI action not implemented: " + doiAction);
        }
    }

}
