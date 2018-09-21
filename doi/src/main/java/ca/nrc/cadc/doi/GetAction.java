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

import ca.nrc.cadc.doi.datacite.DoiJsonWriter;
import ca.nrc.cadc.doi.datacite.DoiParsingException;
import ca.nrc.cadc.doi.datacite.DoiXmlReader;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;

import ca.nrc.cadc.net.InputStreamWrapper;
import ca.nrc.cadc.net.ResourceNotFoundException;
import ca.nrc.cadc.vos.Direction;
import ca.nrc.cadc.vos.Protocol;
import ca.nrc.cadc.vos.Transfer;
import ca.nrc.cadc.vos.VOS;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.ClientTransfer;

import ca.nrc.cadc.vos.client.VOSpaceClient;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.AccessControlException;
import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;


public class GetAction extends DOIAction {

    private static final Logger log = Logger.getLogger(GetAction.class);

    private static final String GET_ONE_REQUEST = "getOne";
    private static final String GET_ALL_REQUEST = "getAll";
    //    protected static final String GET_DOI_METADATA = "getDoiMeta";

    private String requestType;  // from list above
    private String DOINumInputStr; // value used
    protected Resource resource;
    private VOSpaceClient vosClient;

    public GetAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {

        // Discover what kind of request this is
        initRequest();

        // Interact with VOSPACE using DOI_BASE_VOSPACE
        doiDataURI = new VOSURI(new URI(DOI_BASE_VOSPACE ));
        vosClient = new VOSpaceClient(doiDataURI.getServiceURI());

        switch (requestType) {
            case GET_ONE_REQUEST:
                // Get path and filename for DOI Document stored in VOSpace
                if (DOINumInputStr.equals(""))
                {
                    throw new IllegalArgumentException("DOI number required.");
                } else {
                    String doiDatafileName = getDoiNodeUri(DOINumInputStr) + "/" + getDoiFilename(DOINumInputStr);
                    getDoiDocFromVospace(doiDatafileName);
                }
                writeDoiDocToSyncOutput();
                break;
            case GET_ALL_REQUEST:
                throw new UnsupportedOperationException("\"Get All\" not implemented yet.");
            // case GET_DOI_METADATA:
            // check permissions for and return data directory location
            // or possibly status, or...
            // To be used for generating the DOI metadata displayed with a GET, or
            // with the landing page
            default:
                throw new UnsupportedOperationException("Unknown request type");
        }

    }

    private void writeDoiDocToSyncOutput () throws IOException {
        StringBuilder doiBuilder = new StringBuilder();
        String docFormat = this.syncInput.getHeader("Accept");
        log.debug("'Accept' value in header was " + docFormat);
        if (docFormat != null && docFormat.contains("application/json"))
        {
            // json document
            syncOutput.setHeader("Content-Type", "application/json");
            DoiJsonWriter writer = new DoiJsonWriter();
            writer.write(resource, doiBuilder);
        }
        else
        {
            // xml document
            syncOutput.setHeader("Content-Type", "text/xml");
            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(resource,doiBuilder);
        }
        syncOutput.getOutputStream().write(doiBuilder.toString().getBytes());
    }


    private void initRequest() {
        String path = syncInput.getPath();
        log.debug("http request path: " + path);
        requestType = GET_ALL_REQUEST;

        if (path == null) {
            return;
        }

        // Parse the request path to see if a DOI number has been provided
        String[] parts = path.split("/");
        if (parts.length > 0) {
            requestType = GET_ONE_REQUEST;
            DOINumInputStr = parts[0];
        }
        if (parts.length > 1) {
            // Until 'status' is supported
            throw new IllegalArgumentException("Invalid request: " + path);
        }
        log.debug("request type: " + requestType);
        log.debug("DOI Number: " + DOINumInputStr);
    }



    private void getDoiDocFromVospace (String dataNodePath)
        throws URISyntaxException, ResourceNotFoundException {

        List<Protocol> protocols = new ArrayList<Protocol>();
        protocols.add(new Protocol(VOS.PROTOCOL_HTTP_GET));
        protocols.add(new Protocol(VOS.PROTOCOL_HTTPS_GET));
        Transfer transfer = new Transfer(new URI(dataNodePath), Direction.pullFromVoSpace, protocols);
        ClientTransfer clientTransfer = vosClient.createTransfer(transfer);
        clientTransfer.setInputStreamWrapper(new DoiInputStream());
        clientTransfer.run();

        if (clientTransfer.getThrowable() != null) {
            log.debug(clientTransfer.getThrowable().getMessage());
            String message = clientTransfer.getThrowable().getMessage();
            if (message.contains("NodeNotFound")) {
                throw new ResourceNotFoundException(message);
            }
            if (message.contains("PermissionDenied")) {
                throw new AccessControlException(message);
            }
            throw new RuntimeException((clientTransfer.getThrowable().getMessage()));
        }
    }

    private class DoiInputStream implements InputStreamWrapper
    {
        public DoiInputStream() { }

        public void read(InputStream in) throws IOException
        {
            try {
                DoiXmlReader reader = new DoiXmlReader(true);
                resource = reader.read(in);
            } catch (DoiParsingException dpe) {
                throw new IOException(dpe);
            }
        }
    }
}
