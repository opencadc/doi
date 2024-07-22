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


import org.junit.Assert;
import org.junit.Test;

public class DataCitationWorkflowTest extends AbstractDataCitationIntegrationTest {

    public DataCitationWorkflowTest() {
        super();
    }

    @Test
    public void testDoiWorkflow() throws Exception {
        DataCitationRequestPage requestPage = goTo(endpoint, null, DataCitationRequestPage.class);

        requestPage.pageLoadLogin(username, password);
        requestPage.waitForCreateStateReady();

        requestPage.setDoiTitle("DOI PUBLICATION TITLE");
        requestPage.setDoiAuthorList("Flintstone, Fred");
        requestPage.setJournalRef("2018, Astronomy Today, ApJ, 3000, 300");

        requestPage.resetForm();

        Assert.assertEquals("", requestPage.getDoiTitle());

        requestPage.setDoiTitle("TEST publication title");
        // Change format to something non-standard that is similar to a group name
        requestPage.setDoiAuthorList("Yellow Warbler Jamboree");
        requestPage.setJournalRef("2018, Nature, ApJ, 1000, 100");

        requestPage.requestDoi();

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
            "&doi=" + doiSuffix,
            DataCitationRequestPage.class
        );

        requestPage.waitForJournalRefLoaded();

        // Update the journal reference and title
        // one is an XML file change, one is a vospace attribute change
        String newJournalRef = "2018, Nature, ApJ, 1000, 100";
        String newDoiTitle = "Birdsong in the Afternoon: AUTOMATED TEST DOI";
        requestPage.setDoiTitle(newDoiTitle);
        requestPage.setJournalRef(newJournalRef);

        requestPage.updateDoi();
        requestPage.waitForDOIGetDone();

        Assert.assertTrue(requestPage.isStateOkay());

        // Go back to landing page and verify the title and journal references have changed
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
            "&doi=" + doiSuffix,
            DataCitationRequestPage.class
        );

        // Delete DOI just created
        requestPage.deleteDoi();
        Assert.assertTrue(requestPage.isStateOkay());

        System.out.println("testDoiWorkflow test complete.");
    }

}
