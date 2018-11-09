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
import ca.nrc.cadc.cred.client.CredUtil;
import ca.nrc.cadc.doi.datacite.DoiJsonWriter;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;

import ca.nrc.cadc.util.StringUtil;
import ca.nrc.cadc.vos.ContainerNode;
import ca.nrc.cadc.vos.Node;

import java.security.AccessControlException;
import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;


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
        }
        else if (super.doiAction != null) {
            // perform the action on the DOI
            performDoiAction();
        }
        else
        {
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
    

    private DoiStatus getDoiStatus(String doiSuffixString) throws Exception {
        DoiStatus doiStatus = null;
        ContainerNode doiContainerNode = vClient.getContainerNode(doiSuffixString);

        if (vClient.isRequesterNode(doiContainerNode))
        {
            String status = doiContainerNode.getPropertyValue(DOI_VOS_STATUS_PROP);
            log.info("node: " + doiContainerNode.getName() + ", status: " + status);
            if (StringUtil.hasText(status))
            {
                String journalRef = doiContainerNode.getPropertyValue(DOI_VOS_JOURNAL_PROP);

                Resource resource = vClient.getResource(doiSuffixString, getDoiFilename(doiSuffixString));
                Title title = getTitle(resource);
                
                // get the data directory
                String dataDirectory = null;
                List<Node> doiContainedNodes = doiContainerNode.getNodes();
                for (Node node : doiContainedNodes)
                {
                    if (node.getName().equals("data"))
                    {
                        dataDirectory = node.getUri().getPath();
                        break;
                    }
                }
                
                // construct the DOI status
                doiStatus = new DoiStatus(resource.getIdentifier(), title,
                        dataDirectory, Status.toValue(status));
                doiStatus.journalRef = journalRef;
            }
        }
        else
        {
            String msg = "No access to " + doiSuffixString + " which was created by someone else.";
            throw new AccessControlException(msg);
        }

        return doiStatus;
    }
    
    private List<Node> getNodeList() throws Exception {
        // VOspace is expected to filter the list of DOIs by user in the future.
        // Currently all DOIs are returned.
        List<Node> containedNodes = new ArrayList<Node>();
        ContainerNode doiContainer = vClient.getContainerNode("");
        if (doiContainer != null)
        {
            containedNodes = doiContainer.getNodes();
        }
        return containedNodes;
    }
    
    private void getStatusList() throws Exception {
        List<DoiStatus> doiStatusList = new ArrayList<DoiStatus>();
        List<Node> nodes = getNodeList();
        for (Node node : nodes)
        {
            // Verify this is a container node before continuing
            if (node instanceof ContainerNode) {
                try {
                    DoiStatus doiStatus = getDoiStatus(node.getName());
                    if (doiStatus != null) {
                        doiStatusList.add(doiStatus);
                    }
                } catch (AccessControlException ex) {
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
            DoiStatus doiStatus = getDoiStatus(doiSuffix);

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
