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

import ca.nrc.cadc.auth.ACIdentityManager;
import ca.nrc.cadc.auth.AuthenticationUtil;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.rest.InlineContentHandler;
import ca.nrc.cadc.rest.RestAction;
import ca.nrc.cadc.util.PropertiesReader;

import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.security.AccessControlException;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;

public abstract class DoiAction extends RestAction {
    private static final Logger log = Logger.getLogger(DoiAction.class);
    
    public static final String STATUS_ACTION = "status";
    public static final String MINT_ACTION = "mint";
    public static final String TEST_SUFFIX = "test";
    public static final String DOI_BASE_FILEPATH = "/AstroDataCitationDOI/CISTI.CANFAR";
    public static final String DOI_BASE_VOSPACE = "vos://cadc.nrc.ca!vospace" + DOI_BASE_FILEPATH;
    public static final String GMS_RESOURCE_ID = "ivo://cadc.nrc.ca/gms";
    public static final String CADC_DOI_PREFIX = "10.11570";
    public static final String CADC_CISTI_PREFIX = "CISTI_CADC_";
    public static final String JOURNALREF_PARAM = "journalref";
    public static final String RUNID_TEST = "TEST";
    
    public static final String DOI_VOS_JOB_URL_PROP = "ivo://cadc.nrc.ca/vospace/doi#joburl";
    public static final String DOI_VOS_REQUESTER_PROP = "ivo://cadc.nrc.ca/vospace/doi#requester";
    public static final String DOI_VOS_STATUS_PROP = "ivo://cadc.nrc.ca/vospace/doi#status";
    public static final String DOI_VOS_JOURNAL_PROP = "ivo://cadc.nrc.ca/vospace/doi#journalref";
    protected static final String DOI_VOS_STATUS_DRAFT = Status.DRAFT.getValue();
    protected static final String DOI_VOS_STATUS_MINTED = Status.MINTED.getValue();
    
    protected static final String DOI_CONFIG_FILE = "doi.properties";
    
    protected static final String DOI_GROUP_PREFIX = "DOI-";
    
    protected Subject callingSubject;
    protected Integer callingSubjectNumericID;
    protected String doiSuffix;
    protected String doiAction;
    protected VospaceDoiClient vClient = null;
    protected String prodHost = null;
    protected String devHost = null;
    protected String prodURL = null;
    protected String devURL = null;

    public DoiAction() { }

    /**
     * Parse input documents
     * @return
     */
    @Override
    protected InlineContentHandler getInlineContentHandler() {
        return new DoiInlineContentHandler();
    }
    
    protected void init(boolean authorize) throws URISyntaxException, UnknownHostException { 
    	// load doi properties
    	loadConfig();
    	
    	// get calling subject
        callingSubject = AuthenticationUtil.getCurrentSubject();
        log.debug("subject: " + callingSubject);
        if (authorize) {
            authorizeUser(callingSubject);
        }
        
        ACIdentityManager acIdentMgr = new ACIdentityManager();
        this.callingSubjectNumericID = (Integer) acIdentMgr.toOwner(callingSubject);
        this.vClient = new VospaceDoiClient(callingSubject);

        parsePath();
    }

    private void loadConfig() {
    	PropertiesReader pr = new PropertiesReader(DOI_CONFIG_FILE);
    	this.prodHost = pr.getFirstPropertyValue("PROD_HOST");
    	this.devHost = pr.getFirstPropertyValue("DEV_HOST");
    	this.prodURL = pr.getFirstPropertyValue("PROD_URL");
    	this.devURL = pr.getFirstPropertyValue("DEV_URL");
    	if (this.prodHost == null || this.devHost == null || this.prodHost == null || this.devURL == null) {
    		throw new RuntimeException("Failed to load properties from config file " + DOI_CONFIG_FILE);
    	}
    }
    
    private void authorizeUser(Subject s) {
        // authorization, for now, is defined as having a set of principals
        if (s == null || s.getPrincipals().isEmpty()) {
            throw new AccessControlException("Unauthorized");
        }
    }

    private void parsePath() {
        String path = syncInput.getPath();
        log.debug("http request path: " + path);

        if (path != null) {
            String[] parts = path.split("/");
            // Parse the request path to see if a DOI suffix has been provided
            // A full DOI number for CANFAR will be: 10.11570/<DOISuffix>
            if (parts.length > 0) {
                doiSuffix = parts[0];
                log.debug("DOI Number: " + doiSuffix);
                if (parts.length > 1) {
                    doiAction = parts[1];
                    if (parts.length > 2) {
                        log.debug("DOI ACTION BAD REQUEST: " + path);
                        throw new IllegalArgumentException("Bad smelly request: " + path);
                    }
                }
            }
        }
    }

    protected String getDoiFilename(String suffix) {
        return CADC_CISTI_PREFIX + suffix + ".xml";
    }

}
