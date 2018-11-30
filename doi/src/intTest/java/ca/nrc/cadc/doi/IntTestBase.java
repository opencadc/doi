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
*  $Revision: 5 $
*
************************************************************************
*/

package ca.nrc.cadc.doi;

import ca.nrc.cadc.auth.AuthMethod;
import ca.nrc.cadc.net.HttpDelete;
import ca.nrc.cadc.reg.Standards;
import ca.nrc.cadc.reg.client.RegistryClient;
import ca.nrc.cadc.util.FileUtil;
import ca.nrc.cadc.util.Log4jInit;
import ca.nrc.cadc.vos.NodeNotFoundException;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.VOSpaceClient;
import java.io.File;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.BeforeClass;

/**
 * Integration tests generating DOI folders in VOSpace
 *
 * @author jeevesh
 */
public abstract class IntTestBase {
    private static final Logger log = Logger.getLogger(IntTestBase.class);

    protected static URI DOI_RESOURCE_ID = URI.create("ivo://cadc.nrc.ca/doi");
    protected static File CADCAUTHTEST_CERT;
    protected static File CADCREGTEST_CERT;
    protected static String baseURL;
    protected static String DOI_BASE_NODE = "vos://cadc.nrc.ca!vospace/AstroDataCitationDOI/CISTI.CANFAR";
    protected static VOSpaceClient vosClient;
    protected static VOSURI astroDataURI;
    protected static RegistryClient rc;

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    public IntTestBase() {
    }

    @BeforeClass
    public static void staticInit() throws Exception {
        // CadcAuthtest1 will have write access to DOI data folders
        // CadcRegtest1 will only have read access
        CADCAUTHTEST_CERT = FileUtil.getFileFromResource("x509_CADCAuthtest1.pem", IntTestBase.class);
        CADCREGTEST_CERT = FileUtil.getFileFromResource("x509_CADCRegtest1.pem", IntTestBase.class);

        rc = new RegistryClient();
        URL doi = rc.getServiceURL(DOI_RESOURCE_ID, Standards.DOI_INSTANCES_10, AuthMethod.CERT);
        baseURL = doi.toExternalForm();

        // Initialize vosClient for later use
        astroDataURI = new VOSURI(new URI(DOI_BASE_NODE));
        vosClient = new VOSpaceClient(astroDataURI.getServiceURI());
    }

    protected void deleteTestFolder(VOSpaceClient vosClient, String doiSuffix) throws RuntimeException, MalformedURLException, NodeNotFoundException {
        // Clean up test folder
        // Set up DELETE
        URL deleteUrl = new URL(baseURL + "/" + doiSuffix);
        log.info("Deleting folder: " + doiSuffix + " using URL: " + deleteUrl.getPath());

        HttpDelete deleteTask = new HttpDelete(deleteUrl, false);
        deleteTask.run();
        // Check that there was no exception thrown
        if (deleteTask.getThrowable() != null) {
            throw new RuntimeException(deleteTask.getThrowable());
        }
    }

}