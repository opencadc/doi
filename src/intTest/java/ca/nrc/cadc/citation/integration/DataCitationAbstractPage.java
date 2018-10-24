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

public abstract class DataCitationAbstractPage extends AbstractTestWebPage {
    protected static final By DOI_TITLE_BY = By.id("doi_title");
    protected static final By DOI_LOGOUT_BY = By.id("logout");
    protected static final By DOI_INFO_PANEL = By.className("alert-danger");
    protected static final By DOI_MODAL_LOGIN = By.xpath("//*[@id=\"modalloginForm\"]/div[2]/button");


    @FindBy(className = "doi-progress-bar")
    WebElement statusBar;

    @FindBy(id = "modalUsername")
    WebElement modalUsernameInput;

    @FindBy(id = "modalPassword")
    WebElement modalPasswordInput;

    @FindBy(id = "logout")
    WebElement logout;

    @FindBy(className = "user-actions")
    WebElement userActionDropdown;


    public DataCitationAbstractPage(WebDriver driver) throws Exception {
        super(driver);
        PageFactory.initElements(driver, this);
    }

    protected void pageLoadLogin() throws Exception {
        // timing here is bad. By the time the modal is rendered, the sendKeys
        // can sometimes be already run (or partially run?), and for whatever reason only some of
        // the values get sent. :(
        // This first wait for seems the most stable answer to the problem...

        waitForElementClickable(DOI_MODAL_LOGIN);

        sendKeys(modalUsernameInput,"CADCtest");
        sendKeys(modalPasswordInput, "sywymUL4");
        modalPasswordInput.submit();

        waitForElementNotPresent(DOI_MODAL_LOGIN);
    }

    protected void logout() throws Exception {
        click(userActionDropdown);
        waitForElementPresent(DOI_LOGOUT_BY);
        click(logout);
    }

    protected boolean isStateOkay() {
        return statusBar.getAttribute("class").contains("progress-bar-success");
    }

}
