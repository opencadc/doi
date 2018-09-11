(function ($) {
  // register namespace
  $.extend(true, window, {
    "ca": {
      "nrc": {
        "cadc": {
          "Loginform": LoginForm
        }
      }
    }
  });


  /**
   * Basic Login utility class.
   *
   * @constructor
   */
  function LoginForm()
  {
    this._curUsername = null;
    this._curFormId = null;
    this._curForm = null;

    this.defaultOptions = {
      "formId": "loginForm",
      "submitId": "submitLogin"
    };

    this.init = function (options) {
      if (options && options.hasOwnProperty("formId"))
      {
        this._curFormId = options.formId;
      }
      else
      {
        this._curFormId = this.defaultOptions.formId;
      }

      this.setCurrentForm();
      this.attachListeners();
    };

    /**
     * Obtain whether the given string has any length (i.e. > 0).

     * @returns {boolean}
     */
    this.isLoggedIn = function () {
      return ((this._curUsername !== null) && (this._curUsername.length > 0));
    };

    this.resetLoginFormErrors = function () {
      var $loginFailContainer = this._curForm.find("#login_fail");

      this._curForm.removeClass("has-error");
      $loginFailContainer.text("");
    };

    this.attachListeners = function () {
      this._curForm.find("input.form-control").off().change(function () {
        this.resetLoginFormErrors();
      }.bind(this))
    };

    this.authorizationComplete = function (redirectURL) {
      window.location.replace(redirectURL);
    };

    var $_logout = $("#as-logout");
    if ($_logout)
    {
      $_logout.attr("href", $_logout.attr("href") + "?target="
          + encodeURIComponent(new cadc.web.util.currentURI().getURI()));
    }

    var requestURI = new cadc.web.util.currentURI();
    var hashValue = requestURI.getHash();

    if (hashValue.indexOf("PASSWORD_RESET_SUCCESS") >= 0)
    {
      var $successMessageContainer = $("#success_message_container");
      $successMessageContainer.parent().removeClass("hidden");
    }

    this.logout = function () {

    };

    /**
     * Getters & setters
     */
    this.getCurrentUsername = function () {
      return this._curUsername;
    };

    this.setCurrentUsername = function (username) {
      this._curUsername = username;
    };

    this.getCurrentFormId = function () {
      return this._curFormId;
    };

    this.setCurrentFormId = function (formId) {
      this._curFormId = formId;
    };

    this.getCurrenfForm = function () {
      return this._curForm;
    };


    this.setCurrentForm = function () {
      this._curForm = $("#" + this._curFormId);

      // Turn submit button into an ajax call
      this._curForm.submit(function () {
        var $_form = this._curForm;
        var $_this = this;
        var formData = $_form.serialize();
        if (formData.indexOf("target=") < 0)
        {
          formData += "&target=" + encodeURIComponent(new cadc.web.util.currentURI().getURI());
        }

        $.ajax(
            {
              url: $_form.attr("action"),
              method: "POST",
              data: formData
            })
            .done(function (message) {
              $_this.authorizationComplete(message);
            })
            .fail(function () {
              // clear the password field and show an error message
              $_form.find("#login_fail").text(
                  "The username or password you entered is incorrect.");
            });

        return false;
      }.bind(this));

    };
  }

})(jQuery);

