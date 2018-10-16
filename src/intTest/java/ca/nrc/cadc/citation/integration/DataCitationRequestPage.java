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

import ca.nrc.cadc.web.selenium.AbstractTestWebPage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class DataCitationRequestPage extends AbstractTestWebPage {
    private static final By DOI_TITLE_BY = By.id("doi_title");
    private static final By DOI_LOGOUT_BY = By.id("logout");
    public static final By DOI_INFO_PANEL = By.className("alert-danger");
    private static final By DOI_DELETE_BY = By.id("doi_form_delete_button");
    private static final By DOI_REQUEST_SUBMIT_BY = By.id("doi_create_button");
    private static final By DOI_MODAL_LOGIN = By.id("modalUsername");

    @FindBy(id = "doi_number")
    WebElement doiNumberInput;

    @FindBy(id = "doi_title")
    WebElement doiTitleInput;

    @FindBy(id = "doi_creator_list")
    WebElement doiCreatorsInput;

    @FindBy(id = "doi_publisher")
    WebElement doiPublisherInput;

    @FindBy(id = "doi_publish_year")
    WebElement doiPublisherYearInput;

    @FindBy(className = "doi-progress-bar")
    WebElement statusBar;

    @FindBy(id = "doi_metadata")
    WebElement metadataPanel;

    @FindBy(id = "modalUsername")
    WebElement modalUsernameInput;

    @FindBy(id = "modalPassword")
    WebElement modalPasswordInput;

    @FindBy(id = "logout")
    WebElement logout;

    @FindBy(className = "user-actions")
    WebElement userActionDropdown;


    public DataCitationRequestPage(WebDriver driver) throws Exception {
        super(driver);
        PageFactory.initElements(driver, this);
    }

    public String getDoiNumber() {
        return doiNumberInput.getText();
    }

    public String getDoiTitle() {
        return doiTitleInput.getText();
    }

    public String getDoiAuthorList() {
        return doiCreatorsInput.getText();
    }

    public String getPublisher() {
        return doiPublisherInput.getText();
    }

    public String getPublishYear() {
        // this is a dropdown, might not work as expected...
        return doiPublisherYearInput.getText();
    }

    public void setDoiTitle(String title) {
        doiTitleInput.sendKeys(title);
    }

    public void setDoiAuthorList(String authorList) {
         doiCreatorsInput.sendKeys(authorList);
    }

    public void setPublisher(String publisher) {
        doiPublisherInput.sendKeys(publisher);
    }

    public void setPublishYear(String year) {
        // this is a dropdown, might not work as expected...
        doiPublisherYearInput.sendKeys(year);
    }

    public void pageLoadLogin() throws Exception {
        waitForElementPresent(DOI_MODAL_LOGIN);
        sendKeys(modalUsernameInput,"CADCtest");
        sendKeys(modalPasswordInput, "sywymUL4");
        modalPasswordInput.submit();

        waitForElementPresent(DOI_TITLE_BY);
    }

    public void logout() throws Exception {
        click(userActionDropdown);
        waitForElementPresent(DOI_LOGOUT_BY);
        click(logout);
    }

    public void submitForm() throws Exception {
        WebElement cb = find(DOI_REQUEST_SUBMIT_BY);
        click(cb);
        // If this has a problem, this element will not become visible
        waitForElementClickable(DOI_REQUEST_SUBMIT_BY);
    }

    public void deleteDoi() throws Exception {
        WebElement db = find(DOI_DELETE_BY);
        click(db);
        // If this has a problem, this element will not become visible
        waitForElementClickable(DOI_REQUEST_SUBMIT_BY);
    }

    // State verification functions

    boolean isStateOkay() {
        return statusBar.getAttribute("class").contains("progress-bar-success");
    }

    boolean isMetadataDisplayed() {
        return metadataPanel.getAttribute("class").contains("hidden");
    }
}
