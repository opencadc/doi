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

import ca.nrc.cadc.rest.InitAction;
import ca.nrc.cadc.util.MultiValuedProperties;
import ca.nrc.cadc.util.PropertiesReader;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import org.apache.log4j.Logger;

public class DoiInitAction extends InitAction {
    private static final Logger log = Logger.getLogger(DoiInitAction.class);

    public static final String DOI_KEY = "ca.nrc.cadc.doi";
    public static final String VAULT_RESOURCE_ID_KEY = DOI_KEY + ".vault.resourceID";
    public static final String GMS_RESOURCE_ID_KEY = DOI_KEY + ".gms.resourceID";
    public static final String METADATA_FILE_PREFIX_KEY = DOI_KEY + ".metadataFilePrefix";
    public static final String LANDING_URL_KEY = DOI_KEY + ".landingUrl";
    public static final String VAULT_DOI_PARENT_PATH_KEY = DOI_KEY + ".vault.doiParentPath";
    public static final String DATACITE_CADC_PREFIX_KEY = DOI_KEY + ".datacite.cadcPrefix";
    public static final String DATACITE_MDS_URL_KEY = DOI_KEY + ".datacite.mdsUrl";
    public static final String DATACITE_MDS_USERNAME_KEY = DOI_KEY + ".datacite.username";
    public static final String DATACITE_MDS_PASSWORD_KEY = DOI_KEY + ".datacite.password";


    // optional properties
    public static final String TEST_RANDOM_NAME_KEY = DOI_KEY + ".test.randomName";
    public static final String TEST_GROUP_URI_KEY = DOI_KEY + ".test.groupURI";

    @Override
    public void doInit() {
        getConfig(true);
    }

    public static MultiValuedProperties getConfig() {
        return getConfig(false);
    }

    private static MultiValuedProperties getConfig(boolean verify) {
        PropertiesReader reader = new PropertiesReader("doi.properties");
        MultiValuedProperties props = reader.getAllProperties();

        StringBuilder sb = new StringBuilder();
        boolean ok = true;

        String vaultServiceUri = props.getFirstPropertyValue(VAULT_RESOURCE_ID_KEY);
        sb.append(String.format("\n\t%s: ", VAULT_RESOURCE_ID_KEY));
        if (vaultServiceUri == null) {
            sb.append("MISSING");
            ok = false;
        } else if (verify) {
            try {
                new URI(vaultServiceUri);
                sb.append("OK");
            } catch (URISyntaxException e) {
                sb.append("INVALID VAULT SERVICE URI: ").append(e.getMessage());
                ok = false;
            }
        } else {
            sb.append("OK");
        }

        String gmsServiceUri = props.getFirstPropertyValue(GMS_RESOURCE_ID_KEY);
        sb.append(String.format("\n\t%s: ", GMS_RESOURCE_ID_KEY));
        if (gmsServiceUri == null) {
            sb.append("MISSING");
            ok = false;
        } else if (verify) {
            try {
                new URI(gmsServiceUri);
                sb.append("OK");
            } catch (URISyntaxException e) {
                sb.append("INVALID GMS SERVICE URI: ").append(e.getMessage());
                ok = false;
            }
        } else {
            sb.append("OK");
        }

        String metadataFilePrefix = props.getFirstPropertyValue(METADATA_FILE_PREFIX_KEY);
        sb.append(String.format("\n\t%s: ", METADATA_FILE_PREFIX_KEY));
        if (metadataFilePrefix == null) {
            sb.append("MISSING");
            ok = false;
        } else {
            sb.append("OK");
        }

        String landingUrl = props.getFirstPropertyValue(LANDING_URL_KEY);
        sb.append(String.format("\n\t%s: ", LANDING_URL_KEY));
        if (landingUrl == null) {
            sb.append("MISSING");
            ok = false;
        } else if (verify) {
            try {
                new URL(landingUrl);
                sb.append("OK");
            } catch (MalformedURLException e) {
                sb.append("INVALID URL");
                ok = false;
            }
        } else {
            sb.append("OK");
        }

        String parentPath = props.getFirstPropertyValue(VAULT_DOI_PARENT_PATH_KEY);
        sb.append(String.format("\n\t%s: ", VAULT_DOI_PARENT_PATH_KEY));
        if (parentPath == null) {
            sb.append("MISSING");
            ok = false;
        } else {
            sb.append("OK");
        }

        String cadcPrefix = props.getFirstPropertyValue(DATACITE_CADC_PREFIX_KEY);
        sb.append(String.format("\n\t%s: ", DATACITE_CADC_PREFIX_KEY));
        if (cadcPrefix == null) {
            sb.append("MISSING");
            ok = false;
        } else {
            sb.append("OK");
        }

        String mdsEndpoint = props.getFirstPropertyValue(DATACITE_MDS_URL_KEY);
        sb.append(String.format("\n\t%s: ", DATACITE_MDS_URL_KEY));
        if (mdsEndpoint == null) {
            sb.append("MISSING");
            ok = false;
        } else if (verify) {
            try {
                new URL(mdsEndpoint);
                sb.append("OK");
            } catch (MalformedURLException e) {
                sb.append("INVALID URL");
                ok = false;
            }
        } else {
            sb.append("OK");
        }

        String dataciteUsername = props.getFirstPropertyValue(DATACITE_MDS_USERNAME_KEY);
        sb.append(String.format("\n\t%s: ", DATACITE_MDS_USERNAME_KEY));
        if (dataciteUsername == null) {
            sb.append("MISSING");
            ok = false;
        } else {
            sb.append("OK");
        }

        String datacitePassword = props.getFirstPropertyValue(DATACITE_MDS_PASSWORD_KEY);
        sb.append(String.format("\n\t%s: ", DATACITE_MDS_PASSWORD_KEY));
        if (datacitePassword == null) {
            sb.append("MISSING");
            ok = false;
        } else {
            sb.append("OK");
        }

        // optional properties
        String testRandomName = props.getFirstPropertyValue(TEST_RANDOM_NAME_KEY);
        sb.append(String.format("\n\t%s: ", TEST_RANDOM_NAME_KEY));
        if (testRandomName == null) {
            sb.append("MISSING");
        } else {
            sb.append("OK");
        }

        String testGroupURI = props.getFirstPropertyValue(TEST_GROUP_URI_KEY);
        sb.append(String.format("\n\t%s: ", TEST_GROUP_URI_KEY));
        if (testGroupURI == null) {
            sb.append("MISSING");
        } else {
            if (verify) {
                try {
                    new URI(testGroupURI);
                    sb.append("OK");
                } catch (URISyntaxException e) {
                    sb.append("INVALID URI");
                    ok = false;
                }
            } else {
                sb.append("OK");
            }
        }
        log.info(sb.toString());

        if (!ok) {
            throw new IllegalStateException("incomplete config: " + sb.toString());
        }
        return props;
    }

}
