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
import org.openqa.selenium.By;


public class DataCitationRequestPageTest extends AbstractDataCitationIntegrationTest {
//    private static final By ONE_CLICK_DOWNLOAD_LINK_ROW_3_ID_BY = By.id("_one-click_vov_3");


    public DataCitationRequestPageTest() throws Exception {
        super();
    }


    @Test
    public void requestDoi() throws Exception {
        DataCitationRequestPage requestPage = goTo(endpoint, null, DataCitationRequestPage.class);

        requestPage.login();

        requestPage.setDoiTitle("DOI PUBLICATION TITLE");
        requestPage.setDoiAuthorList("Flintstone, Fred");
        requestPage.setPublishYear("2019");
        requestPage.setPublisher("Steady Hand Printing");

        Assert.assertTrue(requestPage.isStateOkay());

        System.out.println("requestDoi test complete.");

    }
}
