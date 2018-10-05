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
    private static final By DOI_DATA_DIR_BY = By.id("doi_data_dir");
    private static final By DOI_DELETE_BY = By.id("doi_form_delete_button");
    private static final By DOI_REQUEST_SUBMIT_BY = By.id("doi_create_button");

    @FindBy(xpath = "//*[@id=\"doi_create_button\"]/div[1]/button[@type=\"submit\"]")
    WebElement submitButton;

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

    @FindBy(className = "login-form")
    WebElement loginForm;

    @FindBy(id = "username")
    WebElement usernameInput;

    @FindBy(id = "password")
    WebElement passwordInput;

    @FindBy(id = "submitLogin")
    WebElement submitLogin;

    @FindBy(id = "logout")
    WebElement logout;

    @FindBy(className = "user-actions")
    WebElement userActionDropdown;

    @FindBy(className = "doi_create_button")
    WebElement createButton;


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


    public void login() throws Exception {
        click(loginForm);
        waitForElementClickable(usernameInput);
        sendKeys(usernameInput,"CADCtest");
        sendKeys(passwordInput, "sywymUL4");
        click(submitLogin);
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
