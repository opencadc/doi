(function ($) {
  // register namespace
  $.extend(true, window, {
    "cadc": {
      "web": {
        "citation": {
          "Citation": Citation,
          "DOIDocument": DOIDocument
        }
      }
    }
  });


  /**
   * Controller for Data Citation UI.
   *
   * @constructor
   */
  function Citation()
  {
    var doiDoc = new DOIDocument();

    // NOTE: for deployment to production, this constructor should have no parameters.
    // for DEV, use the URL of the dev VM the doi and vospace services are deployed on.
    //var _registryClient = new Registy();
    var _registryClient = new Registry({resourceCapabilitiesEndPoint:'http://jeevesh.cadc.dao.nrc.ca/reg/resource-caps'});


    // ------------ Page load functions ------------

    function parseUrl() {
      var query = window.location.search;

      if (query !== "") {
        // perform GET and display for form
        handleDoiGet(query.split("=")[1]);
      }
    }

    function setPublicationYears() {
      var yearOptions = "";
      var curYear = new Date().getFullYear();
      yearOptions = "<option value=\"\" selected disabled>yyyy</option>";

      for (var i=0; i<3; i++) {
        yearOptions = yearOptions + "<option>" + curYear + "</option>";
        curYear= curYear + 1;
      }
      $("#doi_publish_year").html(yearOptions);
    }

    function attachListeners() {
      $("#doi_form_reset_button").click(handleFormReset);
      $("#doi_form_delete_button").click(handleDoiDelete);
      $("#doi_request_form").submit(handleDoiRequest);
    }

    function setNotAuthenticated(errorMsg) {
      $('.info-span').html(errorMsg);
      $('.doi-anonymous').removeClass('hidden');
      $('.doi-authenticated').addClass('hidden');
    }

    function setAuthenticated() {
      $('.doi-authenticated').removeClass('hidden');
      $('.doi-anonymous').addClass('hidden');

      setPublicationYears();
      // This will kick off a GET if the URL contains a request
      parseUrl();
      attachListeners();
    }



    // ------------ Page state management functions ------------

    function clearAjaxAlert() {
      $(".alert-danger").addClass("hidden");
      $(".alert-sucess").addClass("hidden");
      setProgressBar("okay");
    }

    function handleFormReset(message) {
      $("#doi_metadata").addClass("hidden");
      clearAjaxAlert();
      $("#doi_data_dir").html("");
      $("#doi_landing_page").html("");
      setProgressBar("okay");
      setButtonState("create");
    }

    // Communicate AJAX progress and status using progress bar
    function setProgressBar(state) {
      var _progressBar = $(".doi-progress-bar");
      if (state === "busy") {
        _progressBar.addClass("progress-bar-striped");
        _progressBar.removeClass("progress-bar-danger");
        _progressBar.addClass("progress-bar-success");
      }
      if (state === "okay") {
        _progressBar.removeClass("progress-bar-striped");
        _progressBar.removeClass("progress-bar-danger");
        _progressBar.addClass("progress-bar-success");
      }
      if (state === "error") {
        _progressBar.removeClass("progress-bar-striped");
        _progressBar.removeClass("progress-bar-success");
        _progressBar.addClass("progress-bar-danger");
      }
    }

    function setButtonState(mode) {
      if (mode === "update"){
        $(".doi_edit").removeClass("hidden");
        $("#doi_create_button").addClass("hidden");
      }
      if (mode === "create") {
        $(".doi_edit").addClass("hidden");
        $("#doi_create_button").removeClass("hidden");
      }
    }

    function setAjaxFail(message) {
      $("#status_code").text(message.status);
      $("#error_msg").text(message.responseText);
      $(".alert-danger").removeClass("hidden");
      setProgressBar("error");
    }

    function setAjaxSuccess(message) {
      $("#error_msg").text(message.responseText);
      $(".alert-sucess").removeClass("hidden");
      setProgressBar("okay");
    }


    // ------------ HTTP/Ajax functions ------------

    // POST
    function handleDoiRequest(event) {
      // Clear any previous error bars
      clearAjaxAlert();
      var _formdata = $(this).serializeArray();

      var personalInfo = {};

      for (var i=0; i< _formdata.length; i++) {
        var formField = _formdata[i];
        // format: formField: {name:*,value:*}

        switch (formField.name) {
          case "publisher" :
            doiDoc.setPublisher(formField.value);
            break;
          case "publicationYear" :
            doiDoc.setPublicationYear(formField.value);
            break;
          case "title" :
            doiDoc.setTitle(formField.value);
            break;
          case "doi-number":
            doiDoc.setDoiNumber(formField.value);
            break;
          case "creatorList":
            doiDoc.setAuthor(formField.value);
            break;
          default:
            //alert("bad input value");
            break;
        }
      }

      setProgressBar("busy");

      _registryClient.getServiceURL(
          'ivo://cadc.nrc.ca/doi',
          'vos://cadc.nrc.ca~vospace/CADC/std/DOI#instances-1.0',
          'vs:ParamHTTP',
          "cookie"
      )
      .then(function(serviceURL) {
        $.ajax({
          xhrFields: { withCredentials: true },
          url: serviceURL,
          method: "POST",
          dataType: "json",
          contentType: 'application/json',
          data: JSON.stringify(doiDoc.getMinimalDoc())
        }).success(function (data) {
          // POST redirects to a get.
          // Load the data returned into the local doiDocument to be
          // accessed.
          setProgressBar("okay");
          $("#doi_number").val(data.resource.identifier["$"]);
          var doiSuffix = data.resource.identifier["$"].split("/")[1];
          setButtonState("update");
          loadMetadata(doiSuffix);

          doiDoc.populateDoc(data);
          populateForm();
        }).fail(function (message) {
          setAjaxFail(message);
        });

      }).catch(function(err) {
        setAjaxFail('Error obtaining Service URL > ' + err);
      });

      return false;
    }

    //GET
    function handleDoiGet(doiNumber) {
      clearAjaxAlert();
      setProgressBar("busy");

      // Submit doc using ajax
      _registryClient.getServiceURL(
          'ivo://cadc.nrc.ca/doi',
          'vos://cadc.nrc.ca~vospace/CADC/std/DOI#instances-1.0',
          'vs:ParamHTTP',
          "cookie"
      )
      .then(function(serviceURL) {
        var getUrl = serviceURL + "/" + doiNumber;
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: "GET",
          dataType: "json",
          contentType: 'application/json'
        }).success(function (data) {
          setProgressBar("okay");
          setButtonState("update");
          $("#doi_number").val(data.resource.identifier["$"]);
          var doiSuffix = data.resource.identifier["$"].split("/")[1];
          // Populate lower panel on form page
          loadMetadata(doiSuffix);
          // Populate javascript object behind form
          doiDoc.populateDoc(data);
          populateForm();
        }).fail(function (message) {
          setProgressBar("error");
          setAjaxFail(message);
        });

      }).catch(function(err) {
        setAjaxFail('Error obtaining Service URL > ' + err);
      });

      return false;
    }

    // DELETE
    function handleDoiDelete() {
      // Get doi number from form...
      var doiNumber = $("#doi_number").val().split("/")[1];
      clearAjaxAlert();
      setProgressBar("busy");

      _registryClient.getServiceURL(
          'ivo://cadc.nrc.ca/doi',
          'vos://cadc.nrc.ca~vospace/CADC/std/DOI#instances-1.0',
          'vs:ParamHTTP',
          "cookie"
      )
      .then(function(serviceURL) {
        var getUrl = serviceURL + "/" + doiNumber;
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: "DELETE",
          dataType: "json",
          contentType: 'application/json'
        }).success(function (data) {
          setProgressBar("okay");
          handleFormReset();
          setAjaxSuccess("DOI Deleted");
        }).fail(function (message) {
          setProgressBar("error");
          setAjaxFail(message);
        });

      }).catch(function(err) {
        setAjaxFail('Error obtaining Service URL > ' + err);
      });
      return false;
    }


    function loadMetadata(doiName) {
      // Performed after a successful GET
      // There will be a service call eventually to get this  data, but for now the front end
      // will display info based on the doiName data directory will be vospace

      $("#doi_metadata").removeClass("hidden");

      var astrodataDir = "AstroDataCitationDOI/CISTI.CANFAR/";
      var dataUrl = "<a href=\"/storage/list/" + astrodataDir + doiName + "/data" +
          "\" target=\"_blank\">/storage/list/" + astrodataDir + doiName + "/data</a>";
      $("#doi_data_dir").html(dataUrl);

      // Once the Mint function is completed, this will be displayed
      //var landingPageClose = ".html?view=data";
      //var landingPageUrl = "<a href=\"/vospace/nodes/" + astrodataDir + doiName + "/" + doiName + landingPageClose +
      //"\">/vospace/nodes/" + astrodataDir + doiName + "/" + doiName + landingPageClose + "</a>";
      //$("#doi_landing_page").html(landingPageUrl);

    }

    function populateForm(){
      $("#doi_creator_list").val(doiDoc.getAuthorList());
      $("#doi_title").val(doiDoc.getTitle());
      $("#doi_publisher").val(doiDoc.getPublisher());
      $("#doi_publish_year").val(doiDoc.getPublicationYear());
    }





    $.extend(this, {
      setNotAuthenticated: setNotAuthenticated,
      setAuthenticated: setAuthenticated,
      handleFormReset:handleFormReset,
      handleDoiRequest: handleDoiRequest,
      handleDoiGet: handleDoiGet,
      handleDoiDelete: handleDoiDelete
    })
  }

  /**
   * Class for handling DOI metadata document
   * @constructor
   */
  function DOIDocument() {
    var _selfDoc = this;
    this._minimalDoc = {};

    function initMinimalDoc() {
      // build minimal doc to start.
      _selfDoc._minimalDoc = {
        "resource": {
          "@xmlns": "http://datacite.org/schema/kernel-4",
          "identifier": {
            "@identifierType": "DOI",
            "$": "10.11570/YY.xxxx"
          },
          "creators": {
            "$": []
          },
          "titles": {
            "$": [
              {
                "title": {
                  "@xml:lang": "en-US",
                  "$": ""
                }
              }
            ]
          },
          "publisher": {"$": ""},
          "publicationYear": {"$": new Date().getFullYear()},
          "resourceType": {
            "@resourceTypeGeneral": "Dataset",
            "$": "Dataset"
          }
        }
      }
    }

    function getMinimalDoc() {
      if (_selfDoc._minimalDoc === {}) {
        initMinimalDoc();
      }
      return _selfDoc._minimalDoc;
    }

    function populateDoc(serviceData) {
      _selfDoc._minimalDoc = serviceData;
    }

    function makeCreatorStanza(personalInfo){
      var nameParts = personalInfo.split(", ");
      var creatorObject =  {
        "creatorName": {
          "@nameType": "Personal",
              "$": ""
        },
        "givenName": {"$": ""},
        "familyName": {"$": ""}
      };
      creatorObject.creatorName["$"] = personalInfo;
      creatorObject.familyName["$"] = nameParts[0];
      creatorObject.givenName["$"] = nameParts[1];

      return {"creator": creatorObject} ;
    }

    function setAuthor(authorList) {
      // personalInfo is a new line delimited list of last name, first name elements
      var names = authorList.split("\n");
      for (var j=0; j< names.length; j++) {
        _selfDoc._minimalDoc.resource.creators["$"][j] = makeCreatorStanza(names[j]);
      }
    }

    function setDoiNumber(identifier) {
      if (identifier !== "") {
        _selfDoc._minimalDoc.resource.identifier["$"] = identifier;
      }
    }

    function setPublicationYear(year) {
      _selfDoc._minimalDoc.resource.publicationYear["$"] = year;
    }

    function setPublisher(identifier) {
      _selfDoc._minimalDoc.resource.publisher["$"] = identifier;
    }

    function setTitle(title) {
      _selfDoc._minimalDoc.resource.titles["$"][0].title["$"] = title;
    }

    function getAuthorFullname() {
      return  _selfDoc._minimalDoc.resource.creators["$"][0].creator.creatorName["$"];
    }

    function getAuthorList() {
      var listSize = _selfDoc._minimalDoc.resource.creators["$"].length;
      var authorList = "";
      for (var ix=0; ix<listSize; ix++) {
        authorList = authorList + _selfDoc._minimalDoc.resource.creators["$"][ix].creator.creatorName["$"] + "\n";
      }
      return authorList;
    }

    function getDoiNumber() {
        return _selfDoc._minimalDoc.resource.identifier["$"];
    }

    function getPublicationYear() {
      return _selfDoc._minimalDoc.resource.publicationYear["$"];
    }

    function getPublisher() {
      return _selfDoc._minimalDoc.resource.publisher["$"];
    }

    function getTitle() {
      return _selfDoc._minimalDoc.resource.titles["$"][0].title["$"];
    }

    initMinimalDoc();

    $.extend(this, {
      initMinimalDoc: initMinimalDoc,
      getMinimalDoc: getMinimalDoc,
      populateDoc: populateDoc,
      setAuthor: setAuthor,
      setDoiNumber: setDoiNumber,
      setPublicationYear: setPublicationYear,
      setPublisher: setPublisher,
      setTitle: setTitle,
      getAuthorFullname: getAuthorFullname,
      getAuthorList: getAuthorList,
      getDoiNumber: getDoiNumber,
      getPublicationYear: getPublicationYear,
      getPublisher: getPublisher,
      getTitle: getTitle
    })

  }

})(jQuery);




