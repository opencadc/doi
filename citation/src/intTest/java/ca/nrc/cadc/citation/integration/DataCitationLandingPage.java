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

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedCondition;

public class DataCitationLandingPage extends DataCitationAbstractPage {
    private static final By DOI_NUMBER_BY = By.id("doi_number");

    @FindBy(id = "doi_number")
    WebElement doiNumberEl;

    @FindBy(id = "doi_title")
    WebElement doiTitleEl;

    @FindBy(id = "doi_creator_list")
    WebElement doiCreatorsEl;

    @FindBy(id = "doi_journal_ref")
    WebElement doiJournalRefEl;

    public DataCitationLandingPage(WebDriver driver) throws Exception {
        super(driver);
        PageFactory.initElements(driver, this);
        waitForMetadataLoaded();
    }

    public String getDoiNumber() {
        return doiNumberEl.getText();
    }

    public String getDoiTitle() {
        return doiTitleEl.getText();
    }

    public String getDoiAuthorList() {
        return doiCreatorsEl.getText();
    }

    public String getDoiJournalRef() {
        return doiJournalRefEl.getText();
    }

    public void waitForMetadataLoaded() throws Exception {
        waitUntil(new ExpectedCondition<Boolean>() {
            public Boolean apply(WebDriver d) {
                return d.findElement(DOI_NUMBER_BY).getText().length() != 0;
            }
        });
    }

}
