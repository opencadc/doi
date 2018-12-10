/*
 ************************************************************************
 ****  C A N A D I A N   A S T R O N O M Y   D A T A   C E N T R E  *****
 *
 * (c) 2018.                         (c) 2018.
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
 *
 *
 ****  C A N A D I A N   A S T R O N O M Y   D A T A   C E N T R E  *****
 ************************************************************************
 */

package ca.nrc.cadc.citation.integration;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.util.StringUtil;
import ca.nrc.cadc.uws.ExecutionPhase;
import ca.nrc.cadc.vos.ContainerNode;
import ca.nrc.cadc.vos.NodeNotFoundException;
import ca.nrc.cadc.vos.VOS;
import ca.nrc.cadc.vos.VOSURI;
import ca.nrc.cadc.vos.client.ClientAbortThread;
import ca.nrc.cadc.vos.client.ClientRecursiveSetNode;
import ca.nrc.cadc.vos.client.VOSpaceClient;
import java.io.File;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.PrivilegedExceptionAction;
import java.util.concurrent.TimeUnit;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

public class DataCitationTest extends AbstractDataCitationIntegrationTest {
    private static final Logger log = Logger.getLogger(DataCitationTest.class);

    public static final String DOI_BASE_FILEPATH = "/AstroDataCitationDOI/CISTI.CANFAR";
    public static final String DOI_BASE_VOSPACE = "vos://cadc.nrc.ca!vospace" + DOI_BASE_FILEPATH;
    public static final String DOI_VOS_STATUS_PROP = "ivo://cadc.nrc.ca/vospace/doi#status";

    final VOSURI baseDataURI = new VOSURI(URI.create(DOI_BASE_VOSPACE));
    final VOSpaceClient vosClient = new VOSpaceClient(baseDataURI.getServiceURI());
    final Subject testSubject = SSLUtil.createSubject(DOIADMIN_CERT);

    // Used to get the doiNumber into the subject.doAs that will delete minted DOIs
    String doiNumber = "";


    public DataCitationTest() throws Exception {
        super();
    }

    @Test
    public void testDoiWorkflow() throws Exception {
        DataCitationRequestPage requestPage = goTo(endpoint, null, DataCitationRequestPage.class);

        requestPage.pageLoadLogin();
        requestPage.waitForCreateStateReady();

        requestPage.setDoiTitle("DOI PUBLICATION TITLE");
        requestPage.setDoiAuthorList("Flintstone, Fred");
        requestPage.setJournalRef("2018, Astronomy Today, ApJ, 3000, 300");

        requestPage.resetForm();

        Assert.assertTrue(requestPage.getDoiTitle().equals(""));

        requestPage.setDoiTitle("Real publication title");
        requestPage.setDoiAuthorList("Warbler, Yellow");
        requestPage.setJournalRef("2018, Nature, ApJ, 1000, 100");

        requestPage.submitForm();

        Assert.assertTrue(requestPage.isStateOkay());

        // Check that landing page for this DOI renders as exepcted
        requestPage.waitForJournalRefLoaded();
        String doiNumber = requestPage.getDoiNumber();
        System.out.println(doiNumber);
        String doiSuffix = doiNumber.split("/")[1];
        System.out.println("doi suffix: " + doiSuffix);

        DataCitationLandingPage landingPage = goTo("/citation/landing",
            "?doi=" + doiSuffix,
            DataCitationLandingPage.class
        );

        Assert.assertEquals("doi number incorrect on landing page", landingPage.getDoiNumber(), doiNumber);

        // Return to the /citation/request page...
        requestPage = goTo(endpoint,
            "?doi=" + doiSuffix,
            DataCitationRequestPage.class
        );

        requestPage.waitForJournalRefLoaded();

        // Update the journal reference and title
        // one is an XML file change, one is a vospace attribute change
        String newJournalRef = "2018, Nature, ApJ, 5000, 1000";
        String newDoiTitle = "Birdsong in the Afternoon";
        requestPage.setDoiTitle(newDoiTitle);
        requestPage.setJournalRef(newJournalRef);

        requestPage.submitForm();
        requestPage.waitForDOIGetDone();

        Assert.assertTrue(requestPage.isStateOkay());

        // Go back to landing page and verify the title and journal reference have changed
        landingPage = goTo("/citation/landing",
            "?doi=" + doiSuffix,
            DataCitationLandingPage.class
        );

        if (newDoiTitle.equals(landingPage.getDoiTitle())) {
            Assert.assertEquals("DOI title update didn't succeed", newDoiTitle, landingPage.getDoiTitle());
        } else {
            // reload the page - sometimes the update is slow
            landingPage = goTo("/citation/landing",
                "?doi=" + doiSuffix,
                DataCitationLandingPage.class
            );
        }
        Assert.assertEquals("DOI Journal ref update didn't succeed", newJournalRef, landingPage.getDoiJournalRef());

        // Return to the /citation/request page...
        requestPage = goTo(endpoint,
            "?doi=" + doiSuffix,
            DataCitationRequestPage.class
        );

        // Delete DOI just created
        requestPage.deleteDoi();
        Assert.assertTrue(requestPage.isStateOkay());

        System.out.println("testDoiWorkflow test complete.");
    }

    @Test
    public void testMinting() throws Exception {
        // NOTE: This test requires manual clean up, as minted DOIs
        // can't be removed by the doi service.
        // Manual clean up includes: removing the parent directory from vospace, and
        // removing the user group set up.
        DataCitationRequestPage requestPage = goTo(endpoint, null, DataCitationRequestPage.class);

        try {
            requestPage.pageLoadLogin();
            requestPage.waitForCreateStateReady();

            requestPage.setDoiTitle("Test publication title");
            requestPage.setDoiAuthorList("Warbler, Yellow");
            requestPage.setJournalRef("2018, Nature, ApJ, 1000, 100");
            requestPage.submitForm();

            // Wait for create to complete
            requestPage.waitForJournalRefLoaded();
            Assert.assertTrue(requestPage.isStateOkay());

            // Update the journal reference and title
            // one is an XML file change, one is a vospace attribute change
            String newJournalRef = "2018, Nature, ApJ, 5000, 1000";
            String newDoiTitle = "Birdsong in the Afternoon - TEST DOI";
            requestPage.setDoiTitle(newDoiTitle);
            requestPage.setJournalRef(newJournalRef);

            requestPage.submitForm();
            requestPage.waitForDOIGetDone();

            Assert.assertTrue(requestPage.isStateOkay());

            // Mint DOI just created
            requestPage.mintDoi();
            doiNumber = requestPage.getDoiNumber();

            Assert.assertTrue(requestPage.isStateMinted());
        } catch (Exception e) {

        } finally {

            Subject.doAs(testSubject, new PrivilegedExceptionAction<Object>() {
                @Override
                public String run() throws Exception {


                    String doiNumberParts[] = doiNumber.split("/");
                    // cannot delete a DOI when it is in 'MINTED' state, change its state to 'DRAFT'
                    ContainerNode doiContainerNode = getContainerNode(doiNumberParts[1]);
                    // the Status enum is in the war file for doiservice, not in a library that can be included in this test,
                    // so we're stuck with hard coding the values.
                    doiContainerNode.findProperty(DOI_VOS_STATUS_PROP).setValue("in progress");
                    vosClient.setNode(doiContainerNode);

                    // unlock the data directory and delete the DOI
                    ContainerNode dataContainerNode = getContainerNode(doiNumberParts[1] + "/data");
                    String isLocked = dataContainerNode.getPropertyValue(VOS.PROPERTY_URI_ISLOCKED);
                    if (StringUtil.hasText(isLocked)) {
                        dataContainerNode.findProperty(VOS.PROPERTY_URI_ISLOCKED).setMarkedForDeletion(true);
                        setDataNodeRecursively(dataContainerNode);
                    }
                    deleteTestFolder(vosClient, doiNumberParts[1]);

                    return null;
                }

            });
        }

        System.out.println("testDoiWorkflow test complete.");
    }

    private ContainerNode getContainerNode(String path) throws URISyntaxException, NodeNotFoundException {
        String nodePath = baseDataURI.getPath();
        if (StringUtil.hasText(path)) {
            nodePath = nodePath + "/" + path;
        }

        return (ContainerNode) vosClient.getNode(nodePath);
    }

    private void setDataNodeRecursively(final ContainerNode dataContainerNode) throws Exception {
        File pemFile = new File(System.getProperty("user.home") + "/.ssl/doiadmin.pem");
        Subject doiadminSubject = SSLUtil.createSubject(pemFile);
        Subject.doAs(doiadminSubject, new PrivilegedExceptionAction<Object>() {
            @Override
            public String run() throws Exception {
                ClientRecursiveSetNode recSetNode = vosClient.setNodeRecursive(dataContainerNode);
                URL jobURL = recSetNode.getJobURL();

                // this is an async operation
                Thread abortThread = new ClientAbortThread(jobURL);
                Runtime.getRuntime().addShutdownHook(abortThread);
                recSetNode.setMonitor(true);
                recSetNode.run();
                Runtime.getRuntime().removeShutdownHook(abortThread);

                recSetNode = new ClientRecursiveSetNode(jobURL, dataContainerNode, false);
                ExecutionPhase phase = recSetNode.getPhase();
                while (phase == ExecutionPhase.QUEUED || phase == ExecutionPhase.EXECUTING) {
                    TimeUnit.SECONDS.sleep(1);
                    phase = recSetNode.getPhase();
                }

                Assert.assertTrue("Failed to unlock test data directory, phase = " + phase, ExecutionPhase.COMPLETED == phase);
                return phase.getValue();
            }
        });
    }


    @Test
    public void getInvalidDoi() throws Exception {
        DataCitationRequestPage requestPage;

        requestPage = goTo(endpoint + "?doi=99.9999", null, DataCitationRequestPage.class);

        requestPage.pageLoadLogin();
        requestPage.waitForGetFailed();

        Assert.assertFalse(requestPage.isStateOkay());

        requestPage.logout();

        System.out.println("getInvalidDoi test complete.");
    }

    @Test
    public void testListPage() throws Exception {
        DataCitationPage citationPage = goTo("/citation", null, DataCitationPage.class);

        citationPage.pageLoadLogin();
        citationPage.waitForCreateStateReady();
        Assert.assertTrue(citationPage.isStateOkay());

        System.out.println("testListPage test complete.");
    }
}
