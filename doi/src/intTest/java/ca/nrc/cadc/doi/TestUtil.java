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
 *  : 5 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi;

import ca.nrc.cadc.util.FileUtil;
import ca.nrc.cadc.util.Log4jInit;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.net.URI;
import java.util.MissingResourceException;
import java.util.Properties;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.opencadc.vospace.VOSURI;

public class TestUtil {
    private static final Logger log = Logger.getLogger(TestUtil.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    // ADMIN_CERT is the owner of the test DOI
    static String ADMIN_CERT = "doi-admin.pem";

    // AUTH_CERT has read/write access to the test DOI
    static String AUTH_CERT = "doi-auth.pem";

    // AUTH_TWO_CERT is part of test publisher group which can approve or reject a DOI if alternative permissions is configured
    static String PUBLISHER_CERT = "doi-publisher.pem";

    // NO_AUTH_CERT has read only access to the test DOI
    static String NO_AUTH_CERT = "doi-noauth.pem";

    // resourceID for the local test DOI service
    static URI DOI_RESOURCE_ID = URI.create("ivo://opencadc.org/doi");

    // VOSpace URI to the DOI parent node,
    static URI DOI_VOSPACE_PARENT_URI = URI.create("vos://opencadc.org~vault/doi");

    // following derived from VOSPACE_PARENT_URI
    // resourceID for the local VOSpace service
    static URI DOI_VOSPACE_RESOURCE_ID;

    // path for the DOI parent node in VOSpace
    static String DOI_PARENT_PATH;

    // resourceID for the local test DOI service for Alternative DOI specific scenarios
    static URI DOI_ALT_RESOURCE_ID = URI.create("ivo://opencadc.org/doi-alt");

    // VOSpace URI to the Alternative DOI parent node,
    static URI DOI_ALT_VOSPACE_PARENT_URI = URI.create("vos://opencadc.org~vault/doi/doi-alt");

    static String DOI_ALT_PARENT_PATH;

    static URI DOI_ALT_VOSPACE_RESOURCE_ID;

    static {

        try {
            File opt = FileUtil.getFileFromResource("intTest.properties", TestUtil.class);
            if (opt.exists()) {
                Properties props = new Properties();
                props.load(new FileReader(opt));

                if (props.containsKey("doiResourceID")) {
                    DOI_RESOURCE_ID = URI.create(props.getProperty("doiResourceID").trim());
                }
                if (props.containsKey("doiVospaceParentUri")) {
                    DOI_VOSPACE_PARENT_URI = URI.create(props.getProperty("doiVospaceParentUri").trim());
                }
                if (props.containsKey("doiAltResourceID")) {
                    DOI_ALT_RESOURCE_ID = URI.create(props.getProperty("doiAltResourceID").trim());
                }
                if (props.containsKey("doiAltVospaceParentUri")) {
                    DOI_ALT_VOSPACE_PARENT_URI = URI.create(props.getProperty("doiAltVospaceParentUri").trim());
                }
            }
        }
        catch (MissingResourceException | FileNotFoundException noFileException) {
            log.debug("No intTest.properties supplied.  Using defaults.");
        } catch (IOException oops) {
            throw new RuntimeException(oops.getMessage(), oops);
        }

        VOSURI vosURI = new VOSURI(DOI_VOSPACE_PARENT_URI);
        DOI_VOSPACE_RESOURCE_ID = vosURI.getServiceURI();
        DOI_PARENT_PATH = vosURI.getPath();

        VOSURI doiAltVosResourceId = new VOSURI(DOI_ALT_VOSPACE_PARENT_URI);
        DOI_ALT_VOSPACE_RESOURCE_ID = doiAltVosResourceId.getServiceURI();
        DOI_ALT_PARENT_PATH = doiAltVosResourceId.getPath();

        log.debug(String.format("DOI intTest config: %s %s %s %s",
                DOI_RESOURCE_ID, DOI_VOSPACE_PARENT_URI, DOI_VOSPACE_RESOURCE_ID, DOI_PARENT_PATH));

        log.debug(String.format("DOI Alt intTest config: %s %s %s %s",
                DOI_ALT_RESOURCE_ID, DOI_ALT_VOSPACE_PARENT_URI, DOI_ALT_VOSPACE_RESOURCE_ID, DOI_ALT_PARENT_PATH));
    }

 }
