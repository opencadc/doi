/*
************************************************************************
****  C A N A D I A N   A S T R O N O M Y   D A T A   C E N T R E  *****
*
* (c) 2013.                         (c) 2013.
* National Research Council            Conseil national de recherches
* Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
* All rights reserved                  Tous droits reserves
*
* NRC disclaims any warranties         Le CNRC denie toute garantie
* expressed, implied, or statu-        enoncee, implicite ou legale,
* tory, of any kind with respect       de quelque nature que se soit,
* to the software, including           concernant le logiciel, y com-
* without limitation any war-          pris sans restriction toute
* ranty of merchantability or          garantie de valeur marchande
* fitness for a particular pur-        ou de pertinence pour un usage
* pose.  NRC shall not be liable       particulier.  Le CNRC ne
* in any event for any damages,        pourra en aucun cas etre tenu
* whether direct or indirect,          responsable de tout dommage,
* special or general, consequen-       direct ou indirect, particul-
* tial or incidental, arising          ier ou general, accessoire ou
* from the use of the software.        fortuit, resultant de l'utili-
*                                      sation du logiciel.
*
*
* @author jenkinsd
* 12/13/13 - 1:44 PM
*
*
*
****  C A N A D I A N   A S T R O N O M Y   D A T A   C E N T R E  *****
************************************************************************
*/
package ca.nrc.cadc.citation.integration;

import ca.nrc.cadc.auth.AuthMethod;
import ca.nrc.cadc.net.HttpDelete;
import ca.nrc.cadc.reg.Standards;
import ca.nrc.cadc.reg.client.RegistryClient;
import ca.nrc.cadc.util.FileUtil;
import ca.nrc.cadc.util.Log4jInit;
import ca.nrc.cadc.util.StringUtil;
import ca.nrc.cadc.vos.NodeNotFoundException;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.VOSpaceClient;
import ca.nrc.cadc.web.selenium.AbstractWebApplicationIntegrationTest;
import java.io.File;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.BeforeClass;


public abstract class AbstractDataCitationIntegrationTest extends AbstractWebApplicationIntegrationTest
{
    private static final Logger log = Logger.getLogger(AbstractDataCitationIntegrationTest.class);

    private static final String DEFAULT_ENDPOINT = "/citation/request";
    protected static URI DOI_RESOURCE_ID = URI.create("ivo://cadc.nrc.ca/doi");
    protected static File CADCAUTHTEST_CERT;
    protected static File DOIADMIN_CERT;
    protected static String baseURL;
    protected static String DOI_BASE_NODE = "vos://cadc.nrc.ca!vospace/AstroDataCitationDOI/CISTI.CANFAR";
    protected static VOSpaceClient vosClient;
    protected static VOSURI astroDataURI;
    protected static RegistryClient rc;

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    final String endpoint;

    AbstractDataCitationIntegrationTest() throws Exception
    {
        super();
        setFailOnTimeout(true);

        // Base Host of the web application to be tested.
        final String configuredEndpoint = System.getProperty("web.app.endpoint");
        endpoint = StringUtil.hasText(configuredEndpoint) ? configuredEndpoint : DEFAULT_ENDPOINT;
    }


    @BeforeClass
    public static void staticInit() throws Exception {
        // CadcAuthtest1 will have write access to DOI data folders
        // CadcRegtest1 will only have read access
        CADCAUTHTEST_CERT = FileUtil.getFileFromResource("x509_CADCAuthtest1.pem", AbstractDataCitationIntegrationTest.class);
        DOIADMIN_CERT = FileUtil.getFileFromResource("doiadmin.pem", AbstractDataCitationIntegrationTest.class);

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