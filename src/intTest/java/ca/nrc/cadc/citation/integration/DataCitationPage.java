package ca.nrc.cadc.citation.integration;

import ca.nrc.cadc.web.selenium.AbstractTestWebPage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;


public class DataCitationPage extends AbstractTestWebPage {
    private static final By DOI_TABLE_BY = By.id("doi_table");

//    @FindBy(xpath = "//*[@id=\"doi_create_button\"]/div[1]/button[@type=\"submit\"]")
//    WebElement submitButton;

    @FindBy(className = "doi-progress-bar")
    WebElement statusBar;

    @FindBy(className = "login-form")
    WebElement loginForm;

    @FindBy(id = "username")
    WebElement usernameInput;

    @FindBy(id = "password")
    WebElement passwordInput;

    @FindBy(id = "submitLogin")
    WebElement submitLogin;


    public DataCitationPage(WebDriver driver) throws Exception {
        super(driver);
        PageFactory.initElements(driver, this);
    }


    public void login() throws Exception {
        click(loginForm);
        waitForElementClickable(usernameInput);
        sendKeys(usernameInput,"CADCtest");
        sendKeys(passwordInput, "sywymUL4");
        click(submitLogin);
        waitForElementPresent(DOI_TABLE_BY);
    }

    // State verification functions

    boolean isStateOkay() {
        return statusBar.getAttribute("class").contains("progress-bar-success");
    }

}
