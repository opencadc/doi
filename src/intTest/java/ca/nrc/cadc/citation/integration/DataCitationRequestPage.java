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

public class DataCitationRequestPage extends DataCitationAbstractPage {
    private static final By DOI_DELETE_BY = By.id("doi_delete_button");
    private static final By DOI_MINT_BY = By.id("doi_mint_button");
    private static final By DOI_MINTED_BADGE = By.className("doi-status-badge");
    private static final By DOI_DATA_DIR_BY = By.id("doi_data_dir");
    private static final By DOI_REQUEST_SUBMIT_BY = By.id("doi_action_button");
    private static final By DOI_NUMBER_BY = By.id("doi_number");
    private static final By DOI_JOURNALREF_BY = By.id("doi_journal_ref");
    private static final By DOI_ERRORMSG_BY = By.id("error_msg");
    private static final By DOI_UPDATE_BUTTON = By.xpath("//button[@type='submit' and span='New']");

    //*[@id="doi_action_button"]

    @FindBy(id = "doi_number")
    WebElement doiNumberInput;

    @FindBy(className = "doi-number")
    WebElement doiNumberDisplay;

    @FindBy(id = "doi_title")
    WebElement doiTitleInput;

    @FindBy(id = "doi_author")
    WebElement doiAuthorInput;

    @FindBy(id = "doi_journal_ref")
    WebElement doiJournalRef;

    @FindBy(id = "doi_metadata")
    WebElement metadataPanel;

    public DataCitationRequestPage(WebDriver driver) throws Exception {
        super(driver);
        PageFactory.initElements(driver, this);
    }

    public String getDoiNumber() {
        String doiNumberStr = doiNumberInput.getAttribute("value");

        if (doiNumberStr.isEmpty()) {
            doiNumberStr = doiNumberDisplay.getText();
        }
        return doiNumberStr;
    }

    public String getDoiTitle() {
        return doiTitleInput.getText();
    }

    public String getDoiFirstAuthor() {
        return doiAuthorInput.getText();
    }

    public String getDoiJournalRef() {
        return doiJournalRef.getText();
    }

    public void setDoiTitle(String title) {
        doiTitleInput.clear();
        doiTitleInput.sendKeys(title);
    }

    public void setDoiAuthorList(String authorList) {
        doiAuthorInput.clear();
        doiAuthorInput.sendKeys(authorList);
    }

    public void setJournalRef(String journalRef) {
        doiJournalRef.clear();
        doiJournalRef.sendKeys(journalRef);
    }

    public void submitForm() throws Exception {
        WebElement cb = find(DOI_REQUEST_SUBMIT_BY);
        click(cb);
        // If submit has a problem, this element will not become visible
        waitForElementVisible(DOI_DATA_DIR_BY);
        waitForElementClickable(DOI_DELETE_BY);
    }

    public void deleteDoi() throws Exception {
        // metadata panel should be displayed
        waitForElementVisible(DOI_DATA_DIR_BY);
        WebElement db = find(DOI_DELETE_BY);
        click(db);
        // If delete has a problem, this element will not become visible
        waitForElementVisible(DOI_REQUEST_SUBMIT_BY);
    }

    public void mintDoi() throws Exception {
        // metadata panel should be displayed
        // form should be in 'display' mode
        waitForElementVisible(DOI_DATA_DIR_BY);
        WebElement db = find(DOI_MINT_BY);
        click(db);
        // If mint has worked, button bar will not be visible
        waitForElementInvisible(DOI_REQUEST_SUBMIT_BY);
    }

    public void waitForJournalRefLoaded() throws Exception {
        waitUntil(new ExpectedCondition<Boolean>() {
            public Boolean apply(WebDriver d) {
                return d.findElement(DOI_JOURNALREF_BY).getAttribute("value").length() != 0;
            }
        });
    }

    public void waitForDOIGetDone() throws Exception {
        waitUntil(new ExpectedCondition<Boolean>() {
            public Boolean apply(WebDriver d) {
                return d.findElement(DOI_NUMBER_BY).getAttribute("value").length() != 0;
            }
        });
    }

    public void waitForCreateStateReady() throws Exception {
        waitForElementPresent(DOI_REQUEST_SUBMIT_BY);
    }

    public void waitForGetFailed() throws Exception  {
        waitForElementVisible(DOI_ERRORMSG_BY);
    }

    public boolean isStateMinted() throws Exception {
        WebElement badge = find(DOI_MINTED_BADGE);
        return !badge.getAttribute("class").contains("hidden");
    }

}
