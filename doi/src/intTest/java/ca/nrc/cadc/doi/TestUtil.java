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

import java.io.File;
import java.io.FileReader;
import java.net.URI;
import java.util.Properties;
import org.apache.log4j.Logger;

public class TestUtil {
    private static final Logger log = Logger.getLogger(TestUtil.class);

    public static URI DOI_RESOURCE_ID = URI.create("ivo://opencadc.org/doi");
    public static URI VAULT_RESOURCE_ID = URI.create("ivo://opencadc.org/vault");
    public static URI GMS_RESOURCE_ID = URI.create("ivo://ca.nrc.cadc/gms");
    public static URI PROD_DOI_RESOURCE_ID = URI.create("ivo://cadc.nrc.ca/doi");

    // adminCert has full access to a DOI
    // readWriteCert has read/write access to a DOI
    // readOnlyCert has read only access to a DOI
    public static String ADMIN_CERT = "doiadmin.pem";
    public static String READ_WRITE_CERT = "x509_CADCAuthtest1.pem";
    public static String READ_ONLY_CERT = "x509_CADCRegtest1.pem";

    public static String DOI_PARENT_PATH = "/AstroDataCitationDOI/CISTI.CANFAR";

    static {
        try {
            File opt = new File("intTest.properties");
            if (opt.exists()) {
                Properties props = new Properties();
                props.load(new FileReader(opt));

                String s = props.getProperty("doiResourceID");
                if (s != null) {
                    DOI_RESOURCE_ID = URI.create(s.trim());
                }
                s = props.getProperty("vaultResourceID");
                if (s != null) {
                    VAULT_RESOURCE_ID = URI.create(s.trim());
                }
                s = props.getProperty("gmsResourceID");
                if (s != null) {
                    GMS_RESOURCE_ID = URI.create(s.trim());
                }
                s = props.getProperty("prodDoiResourceID");
                if (s != null) {
                    PROD_DOI_RESOURCE_ID = URI.create(s.trim());
                }

                s = props.getProperty("adminCert");
                if (s != null) {
                    ADMIN_CERT = s.trim();
                }
                s = props.getProperty("readWriteCert");
                if (s != null) {
                    READ_WRITE_CERT = s.trim();
                }
                s = props.getProperty("readOnlyCert");
                if (s != null) {
                    READ_ONLY_CERT = s.trim();
                }

                s = props.getProperty("doiParentPath");
                if (s != null) {
                    DOI_PARENT_PATH = s.trim();
                }
            }
            log.info(String.format("intTest config: %s %s %s %s %s %s %s %s",
                    DOI_RESOURCE_ID, VAULT_RESOURCE_ID, GMS_RESOURCE_ID, PROD_DOI_RESOURCE_ID,
                    ADMIN_CERT, READ_WRITE_CERT, READ_ONLY_CERT, DOI_PARENT_PATH));

        } catch (Exception oops) {
            log.info("failed to load/read optional config", oops);
        }
    }

    private TestUtil() {
    }

}
