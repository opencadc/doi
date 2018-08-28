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

import ca.nrc.cadc.auth.AuthenticationUtil;
import ca.nrc.cadc.auth.HttpPrincipal;
import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.net.HttpDownload;
import ca.nrc.cadc.net.OutputStreamWrapper;
import ca.nrc.cadc.rest.InlineContentHandler;
import ca.nrc.cadc.rest.RestAction;
import ca.nrc.cadc.vos.Node;
import ca.nrc.cadc.vos.NodeWriter;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.security.AccessControlException;
import java.security.PrivilegedExceptionAction;
import java.util.Arrays;
import java.util.Set;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.jdom2.Document;

public abstract class DOIAction extends RestAction {

    private static final Logger log = Logger.getLogger(DOIAction.class);

    // Request types handled in the GetAction, PostAction, DeleteAction classes
    // as of 21/8/18, only some have been implemented. All are named here because
    // the API has been planned out more fully than has been implemented.

    // GetAction
    protected static final String GET_ONE_REQUEST = "getOne";
    protected static final String GET_ALL_REQUEST = "getAll";

    // PostAction
    protected static final String CREATE_REQUEST = "create";
//    protected static final String EDIT_REQUEST = "edit";
//    protected static final String MINT_REQUEST = "mint";

    // DeleteAction
//    protected static final String INIT_REQUEST = "init";


    protected String userID;
    protected String requestType;  // from list above
    protected String DOINum;

    public DOIAction() {
        // initialise and debug statements go here...

    }

    /**
     * Parse input documents
     * @return
     */
    @Override
    protected InlineContentHandler getInlineContentHandler() {
        return new DoiInlineContentHandler();
    }


    protected abstract void doActionImpl() throws Exception;

    /**
     * Capture the initial request, and continue any work necessary using a new subject,
     * using doiadmin credentials
     * @throws Exception
     */
    @Override
    public void doAction() throws Exception {

        // Discover whether a DOI Number has been provided or not
        initRequest();

        Subject subject = AuthenticationUtil.getCurrentSubject();
        // Grab any user credentials necessary

        File pemFile = new File(System.getProperty("user.home") + "/.ssl/doiadmin.pem");
        Subject doiadminSubject = SSLUtil.createSubject(pemFile);
        Subject.doAs(doiadminSubject, new PrivilegedExceptionAction<Object>() {
            @Override
            public String run() throws Exception {
                doActionImpl();
                return "don";
            }
        } );

    }


    protected void initRequest() throws AccessControlException, IOException {
        
        final Subject subject = AuthenticationUtil.getCurrentSubject();
        log.debug("Subject: " + subject);
        
        // authorization, for now, is simply being authenticated
        // (grabbed from quarry service...)
        if (subject == null || subject.getPrincipals().isEmpty()) {
            throw new AccessControlException("Unauthorized");
        }
        Set<HttpPrincipal> httpPrincipals = subject.getPrincipals(HttpPrincipal.class);
        if (httpPrincipals.isEmpty()) {
            throw new AccessControlException("No HTTP Principal");
        }
        userID = httpPrincipals.iterator().next().getName();
        
        String path = syncInput.getPath();
        log.debug("http request path: " + path);
        requestType = GET_ALL_REQUEST;
        
        if (path == null) {
            return;
        }

        // Parse the request path to see if a DOI number has been provided
        String[] parts = path.split("/");
        //
        if (parts.length > 0) {
            requestType = CREATE_REQUEST;
            DOINum = parts[0];
        }
        if (parts.length > 1) {
            throw new IllegalArgumentException("Invalid request: " + path);
        }
        log.debug("request type: " + requestType);
        log.debug("DOI Number: " + DOINum);
    }
    
    protected String readStream(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[1024];
        while ((nRead = in.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toString("UTF-8");
    }
    
    protected String execute(String[] command) throws IOException, InterruptedException {
        Process p = Runtime.getRuntime().exec(command);
        int status = p.waitFor();
        log.debug("Status=" + status + " for command: " + Arrays.toString(command));
        String stdout = readStream(p.getInputStream());
        String stderr = readStream(p.getErrorStream());
        log.debug("stdout: " + stdout);
        log.debug("stderr: " + stderr);
        if (status != 0) {
            String message = "Error executing command: " + Arrays.toString(command) + " Error: " + stderr;
            throw new IOException(message);
        } 
        return stdout.trim();
    }
    
    protected String parseCID(String vncName) {
        String[] parts = vncName.split("_");
        String sessionID = parts[parts.length - 2];
        return sessionID;
    }

    /*
     * Validate that calling user has permission to access this DOI
     * (there will be an attribute on the VOSpace directory corresponding to this DOI
     */
    protected void validateDOI(String doiNum) {
        // Verify that a VOSpace directory exists for this DOI
        throw new IllegalArgumentException("DOI not validated (code not implemented yet)");
    }


    /*
     * Validate that calling user has permission to access this DOI
     * (there will be an attribute on the VOSpace directory corresponding to this DOI
     */
    protected void checkWritePermission(String doiNum) {
        // Verify that the calling user has access to this DOI
        throw new IllegalArgumentException("Unauthorised to write to DOI(code not implemented yet)");
    }

    /*
     * Validate that calling user has permission to access this DOI
     * (there will be an attribute on the VOSpace directory corresponding to this DOI
     */
    protected void checkReadPermission(String doiNum) {
        // Verify that the calling user has access to this DOI
        throw new IllegalArgumentException("Unauthorised to read DOI(code not implemented yet)");
    }



    private Document parseInput() {
        // Check input type
        String contentType = syncInput.getHeader("Content-type");

        Document userInput = new Document();
        if (contentType.toLowerCase().equals("text/xml")) {

            try {
                // read test xml file
                DoiXmlReader reader = new DoiXmlReader(false);
//                syncInput.
//                InputStream fis = syncInput.request.getInputStream();
//                userInput = reader.read(fis);
//                fis.close();
            } catch (Exception e) {
                log.debug(e);
            }

        }

        return userInput;
    }

    protected class DoiOutputStream implements OutputStreamWrapper
    {
        private Document xmlDoc;

        public DoiOutputStream(Document xmlDoc)
        {
            this.xmlDoc = xmlDoc;
        }

        public void write(OutputStream out) throws IOException
        {
            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(xmlDoc, out);
        }

    }


}
