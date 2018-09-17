(function ($) {
  // register namespace
  $.extend(true, window, {
    "ca": {
      "nrc": {
        "cadc": {
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
    var _baseUrl = "";

    function checkAuthenticated() {

    }

    function handleAjaxFail(message) {
      alert(message.responseText);
    }

    function handleFormReset(message) {
      $("#doi_metadata").addClass("hidden");
      $("#doi_data_dir").html("");
      $("#doi_landing_page").html("");
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


    // TODO: yank info modal most likely.. from index.jsp as well
    //function setInfoModal(title, msg, hideThanks) {
    //  $('.info-span').html(msg);
    //  $('#infoModalLongTitle').html(title);
    //  $('#infoModal').modal('show');
    //
    //  if (hideThanks === true) {
    //    $('#infoThanks').addClass('hidden');
    //  } else {
    //    $('#infoThanks').removeClass('hidden');
    //  }
    //};

    // Page load function
    function parseUrl() {
      var query = window.location.search;

      if (query !== "") {
        // perform GET and display for form
        handleDoiGet(query.split("=")[1]);
      }
    }

    // HTTP/Ajax functions
    // POST
    function handleDoiRequest(event) {
      var _formdata = $(this).serializeArray();

      var personalInfo = {};
      // todo: consider making this a separate function to
      // parse form into DataCite JSON format

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
          case "givenName":
          case "familyName":
          case "orcidID":
          case "affiliation":
            personalInfo[formField.name] = formField.value;
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
      //setInfoModal("Pease wait ", "We're setting up your DOI data directory and draft metadata documents. Thank you for your patience...", true);

      var createUrl = _baseUrl + "/doi/instances";
      // Submit doc using ajax
      $.ajax({
        xhrFields: { withCredentials: true },
        url: createUrl,
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
        loadMetadata(doiSuffix);
        doiDoc.populateDoc(data);
        populateForm();
      }).fail(function (message) {
        setProgressBar("error");
        handleAjaxFail(message);
      });

      return false;
    };

    //GET
    function handleDoiGet(doiNumber) {

      //setInfoModal("Pease wait ", "We're setting up your DOI data directory and draft metadata documents. Thank you for your patience...", true);

      setProgressBar("busy");
      // Submit doc using ajax
      var getUrl = _baseUrl + "/doi/instances/" + doiNumber;
      $.ajax({
        xhrFields: { withCredentials: true },
        url: getUrl,
        method: "GET",
        dataType: "json",
        contentType: 'application/json'
      }).success(function (data) {
        setProgressBar("okay");
        $("#doi_number").val(data.resource.identifier["$"]);
        var doiSuffix = data.resource.identifier["$"].split("/")[1];
        // Populate lower panel on form page
        loadMetadata(doiSuffix);
        // Populate javascript object behind form
        doiDoc.populateDoc(data);
        // Populate form
        populateForm();
      }).fail(function (message) {
        // TODO: not sure this red bar will be retained.
        setProgressBar("error");
        handleAjaxFail(message);
      });
      return false;
    };

    function loadMetadata(doiName) {
      // There will be a service call eventually, for now the front end
      // will display info based on the doiName
      // data directory will be vospace

      $("#doi_metadata").removeClass("hidden");

      // get the vospace url & put an href here in the long run
      //http://www.canfar.phys.uvic.ca/vospace/nodes/AstroDataCitationDOI/CISTI.CANFAR/18.0001/18.0001.html?view=data

      // TODO: for release to beta, this needs to be what??
      //var baseLandingPageUrl = "http://www.canfar.phys.uvic.ca/vospace/nodes/AstroDataCitationDOI/CISTI.CANFAR/";
      var baseLandingPageUrl = _baseUrl;
      var astrodataDir = "AstroDataCitationDOI/CISTI.CANFAR/";
      var landingPageClose = ".html?view=data";
      var landingPageUrl = "<a href=\"" + baseLandingPageUrl + "/vospace/nodes/" + astrodataDir + doiName + "/" + doiName + landingPageClose +
              "\">"  + baseLandingPageUrl + "/vospace/nodes/" + astrodataDir + doiName + "/" + doiName + landingPageClose + "</a>";

      var dataUrl = "<a href=\"" + baseLandingPageUrl + "/storage/list/" + astrodataDir + doiName + "/data" +
          "\">"  + baseLandingPageUrl + "/storage/list/" + astrodataDir + doiName + "/data</a>";

      $("#doi_data_dir").html(dataUrl);
      $("#doi_landing_page").html(landingPageUrl);
    };

    function populateForm(){
      $("#doi_creator_list").val(doiDoc.getAuthorFullname());
      $("#doi_title").val(doiDoc.getTitle());
      $("#doi_publisher").val(doiDoc.getPublisher());
      $("#doi_publish_year").val(doiDoc.getPublicationYear());
    };


    // ------------ Page State functions -------------------
    function setPublicationYears() {
      var yearOptions = "";
      var curYear = new Date().getFullYear();
      yearOptions = "<option value=\"\" selected disabled>yyyy</option>";

      for (var i=0; i<3; i++) {
        yearOptions = yearOptions + "<option>" + curYear + "</option>";
        curYear= curYear + 1;
      };
      $("#doi_publish_year").html(yearOptions);
    }

    function setNotAuthenticated(errorMsg) {
      $('.info-span').html(errorMsg);
      $('.doi-anonymous').removeClass('hidden');
      $('.doi-authenticated').addClass('hidden');
    };

    function setAuthenticated() {
      $('.doi-authenticated').removeClass('hidden');
      $('.doi-anonymous').addClass('hidden');

      setPublicationYears();
      parseUrl();

      // Set handlers
      $("#doi_form_reset_button").click(citation_js.handleFormReset);
      $("#doi_find").click(citation_js.handleDoiGet);
      $("#doi_request_form").submit(citation_js.handleDoiRequest);
    };


    function setBaseUrl(baseUrl) {
      _baseUrl = baseUrl;
    }

    function getBaseUrl() {
      return _baseUrl;
    }

    $.extend(this, {
      parseUrl: parseUrl,
      setNotAuthenticated: setNotAuthenticated,
      setAuthenticated: setAuthenticated,
      handleFormReset:handleFormReset,
      handleDoiRequest: handleDoiRequest,
      handleDoiGet: handleDoiGet,
      handleAjaxFail: handleAjaxFail,
      loadMetadata: loadMetadata,
      populateForm: populateForm,
      setPublicationYears: setPublicationYears,
      setBaseUrl: setBaseUrl,
      getBaseUrl: getBaseUrl
    })
  }

  /**
   * Class for handling DOI metadata document
   * @constructor
   */
  function DOIDocument() {
    var _selfDoc = this
    this._minimalDoc = {}

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
      if (_selfDoc._minimalDoc == {}) {
        initMinimalDoc();
      }
      return _selfDoc._minimalDoc;
    }

    function populateDoc(serviceData) {
      // parse out the badgerfish from the service data and place into _selfDoc.
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
      var names = authorList.split("\\\n");
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
      getDoiNumber: getDoiNumber,
      getPublicationYear: getPublicationYear,
      getPublisher: getPublisher,
      getTitle: getTitle
    })

  }

})(jQuery);




