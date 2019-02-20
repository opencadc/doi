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
import ca.nrc.cadc.vos.client.ClientAbortThread;
import ca.nrc.cadc.vos.client.ClientRecursiveSetNode;
import java.net.URL;
import java.security.PrivilegedExceptionAction;
import java.util.concurrent.TimeUnit;
import javax.security.auth.Subject;
import org.junit.Assert;
import org.junit.Test;

public class DataCitationMintingTest extends AbstractDataCitationIntegrationTest {

    public static final String DOI_VOS_STATUS_PROP = "ivo://cadc.nrc.ca/vospace/doi#status";

    final Subject testSubject = SSLUtil.createSubject(DOIADMIN_CERT);

    // Used to get the doiNumber into the subject.doAs that will delete minted DOIs
    String doiNumber = "";

    public DataCitationMintingTest() throws Exception {
        super();
    }

    @Test
    public void testMinting() throws Exception {
        DataCitationRequestPage requestPage = goTo(endpoint, null, DataCitationRequestPage.class);
        doiNumber = "";

        try {
            requestPage.pageLoadLogin();
            requestPage.waitForCreateStateReady();

            requestPage.setDoiTitle("Birdsong in the Afternoon - AUTOMATED TEST DOI");
            requestPage.setDoiAuthorList("Warbler, Yellow");
            requestPage.setJournalRef("2018, Nature, ApJ, 5000, 100");
            requestPage.requestDoi();

            // Wait for create to complete
            requestPage.waitForJournalRefLoaded();
            requestPage.waitForInfoModalGone();
            Assert.assertTrue(requestPage.isStateOkay());

            requestPage.waitForDOIGetDone();

            Assert.assertTrue(requestPage.isStateOkay());

            // Mint DOI just created
            requestPage.mintDoi();
            requestPage.waitForInfoModalGone();
            doiNumber = requestPage.getDoiNumber();

            Assert.assertTrue(requestPage.isStateMinted());
            System.out.println("minted");
        } catch (Exception e) {

            Assert.fail("Failed minting DOI test");
            throw e;

        } finally {
            // Attempt cleanup of any DOIs careated

            if (!doiNumber.equals("")) {

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
        }

        requestPage.logout();
        System.out.println("testDoiWorkflow test complete.");
    }


    private ContainerNode getContainerNode(String path) throws NodeNotFoundException {
        String nodePath = astroDataURI.getPath();
        if (StringUtil.hasText(path)) {
            nodePath = nodePath + "/" + path;
        }

        return (ContainerNode) vosClient.getNode(nodePath);
    }

    private void setDataNodeRecursively(final ContainerNode dataContainerNode) throws Exception {
        // testSubject is doiadmin subject.
        Subject.doAs(testSubject, new PrivilegedExceptionAction<Object>() {
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

}
