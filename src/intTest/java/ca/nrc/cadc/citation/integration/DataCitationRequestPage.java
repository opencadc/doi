package ca.nrc.cadc.citation.integration;

import ca.nrc.cadc.web.selenium.AbstractTestWebPage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;



class DataCitationRequestPage extends AbstractTestWebPage {
    private static final By FORM_RESET_BUTTON_BY = By.xpath("//*[@id=\"doi_form_reset_button\"]/div[1]/button[@type=\"reset\"]");

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


    DataCitationRequestPage(final WebDriver driver) throws Exception {
        super(driver);

//        waitForElementPresent(TOP_RESET_BUTTON_BY);
//        waitForElementVisible(TOP_RESET_BUTTON_BY);
        PageFactory.initElements(driver, this);
    }

//    DataCitationRequestPage(WebDriver driver, int timeoutInSeconds) throws Exception {
//        super(driver, timeoutInSeconds);
//
////        waitForElementPresent(TOP_RESET_BUTTON_BY);
////        waitForElementVisible(TOP_RESET_BUTTON_BY);
//        PageFactory.initElements(driver, this);
//    }


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




    // Functions to change page state
    void submitSuccess() throws Exception {
        click(submitButton);
    }

    void reset() throws Exception {
        click(FORM_RESET_BUTTON_BY);

        // wait for form to clear?
    }



    // State verification functions

    boolean isStateOkay() {
        return statusBar.getAttribute("class").contains("progress-bar-success");
    }

    boolean isMetadataDisplayed() {
        return metadataPanel.getAttribute("class").contains("hidden");
    }
}
