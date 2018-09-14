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
   *
   *
   * @constructor
   */
  function Citation()
  {
    var doiDoc = new DOIDocument();

    function handleAjaxFail(message) {
      alert(message.responseText);
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


    function setInfoModal(title, msg, hideThanks) {
      $('.info-span').html(msg);
      $('#infoModalLongTitle').html(title);
      $('#infoModal').modal('show');

      if (hideThanks === true) {
        $('#infoThanks').addClass('hidden');
      } else {
        $('#infoThanks').removeClass('hidden');
      }
    };

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

      // Submit doc using ajax
      $.ajax({
        xhrFields: { withCredentials: true },
        url: "http://jeevesh.cadc.dao.nrc.ca/doi/instances",
        method: "POST",
        dataType: "json",
        contentType: 'application/json',
        data: JSON.stringify(doiDoc.getMinimalDoc())
      }).success(function (data) {
        // POST redirects to a get.
        // Load the data returned into the local doiDocument to be
        // accessed.
        //setDoidocument(data);
        // TODO: function above needs to be made. This is all the return does for now
        //$('#infoModal').modal('hide');
        setProgressBar("okay");
        $("#doi_number").val(data.resource.identifier["$"]);

        var doiSuffix = data.resource.identifier["$"].split("/")[1];
        loadMetadata(doiSuffix);
        doiDoc.populateDoc(data);
        populateForm();
      }).fail(function (message) {
        setProgressBar("error");
        //$('#infoModal').modal('hide');
        handleAjaxFail(message);
      });

      return false;
    };

    //GET
    function handleDoiGet(doiNumber) {

      //setInfoModal("Pease wait ", "We're setting up your DOI data directory and draft metadata documents. Thank you for your patience...", true);

      setProgressBar("busy");
      // Submit doc using ajax
      $.ajax({
        xhrFields: { withCredentials: true },
        url: "http://jeevesh.cadc.dao.nrc.ca/doi/instances/" + doiNumber,
        method: "GET",
        dataType: "json",
        contentType: 'application/json'
      }).success(function (data) {
        // POST redirects to a get.
        // Load the data returned into the local doiDocument to be
        // accessed.
        //setDoidocument(data);
        // TODO: function above needs to be made. This is all the return does for now
        //$('#infoModal').modal('hide');
        setProgressBar("okay");
        $("#doi_number").val(data.resource.identifier["$"]);

        var doiSuffix = data.resource.identifier["$"].split("/")[1];
        loadMetadata(doiSuffix);
        doiDoc.populateDoc(data);
        populateForm();
      }).fail(function (message) {
        //$('#infoModal').modal('hide');
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

      //var baseLandingPageUrl = "http://www.canfar.phys.uvic.ca/vospace/nodes/AstroDataCitationDOI/CISTI.CANFAR/";
      var baseLandingPageUrl = "http://jeevesh.cadc.dao.nrc.ca";
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

    $.extend(this, {
      parseUrl: parseUrl,
      handleDoiRequest: handleDoiRequest,
      handleDoiGet: handleDoiGet,
      handleAjaxFail: handleAjaxFail,
      loadMetadata: loadMetadata,
      populateForm: populateForm
    })
  }

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




