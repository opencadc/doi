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

    function handleAjaxFail(message) {
      alert(message.responseText);
    }

    // HTTP/Ajax functions
    // POST
    function handleDoiRequest(event) {
      var _formdata = $(this).serializeArray();

      var doiDoc = new DOIDocument();
      //doiDoc.initMinimalDoc();

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
          case "givenName":
          case "familyName":
          case "orcidID":
          case "affiliation":
            personalInfo[formField.name] = formField.value;
            break;
          case "doi-number":
            doiDoc.setDoiNumber(formField.value);
            break;
          default:
            //alert("bad input value");
            break;
        }
      }

      doiDoc.setAuthor(personalInfo);

      // Submit doc using ajax
      $.ajax({
        xhrFields: { withCredentials: true },
        url: "http://jeevesh.cadc.dao.nrc.ca/doi/instances",
        method: "POST",
        dataType: "json",
        contentType: 'application/json',
        data: JSON.stringify(doiDoc.getMinimalDoc())
      }).success(function (data) {

        // will be a redirect to a get...
        //setDoiNumber(data);
        $("#doi_number").val(data.resource.identifier["$"]);
        $("#doi_number").prop("readonly",true);
      }).fail(function (message) {
        handleAjaxFail(message);
      });

      return false;

    };

    $.extend(this, {
      handleDoiRequest: handleDoiRequest,
      handleAjaxFail: handleAjaxFail
    })
  }

  function DOIDocument() {

    var _selfDoc = this
    this._minimalDoc = {}

    //var _entireDoc = {}

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
            "$": [
              {
                "creator": {
                  "creatorName": {
                    "@nameType": "Personal",
                    "$": ""
                  },
                  "givenName": {"$": ""},
                  "familyName": {"$": ""}
                }
              }
            ]
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
          "publicationYear": {"$": new Date().getFullYear()}
        }
      }
    }

      function getMinimalDoc() {
        if (_selfDoc._minimalDoc == {}) {
          initMinimalDoc();
        }
        return _selfDoc._minimalDoc;
      }

      function setAuthor(personalInfo) {
        _selfDoc._minimalDoc.resource.creators["$"][0].creator.creatorName["$"] = personalInfo.familyName + ", " + personalInfo.givenName;
        _selfDoc._minimalDoc.resource.creators["$"][0].creator.familyName["$"] = personalInfo.familyName;
        _selfDoc._minimalDoc.resource.creators["$"][0].creator.givenName["$"] = personalInfo.givenName;

        // orcid id and affiliation can be added later
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

      initMinimalDoc();

      $.extend(this, {
        initMinimalDoc: initMinimalDoc,
        getMinimalDoc: getMinimalDoc,
        setAuthor: setAuthor,
        setDoiNumber: setDoiNumber,
        setPublicationYear: setPublicationYear,
        setPublisher: setPublisher,
        setTitle: setTitle
      })

  }

  //function BadgerFish() {
  //  // General Badgerfish routines
  //  function writeTestEl(e, value) {
  //    return {e: {"$": value}};
  //  };
  //
  //  function writeAttributeEl(e, value) {
  //    var keyVal = "@" + e;
  //    return {keyVal: value};
  //  };
  //
  //  $.extend(this, {
  //    writeTestEl: writeTestEl,
  //    writeAttributeEl: writeAttributeEl
  //  })
  //}

})(jQuery);




//Javascript format that needs to be written - Badgerfish. Eww.
//"creators" : {
//  "$" : [
//    {
//      "creator" : {
//        "creatorName" : {
//          "@nameType" : "Personal",
//          "$" : "Miller, Elizabeth"
//        },
//        "givenName" : {"$" : "Elizabeth"},
//        "familyName" : {"$" : "Miller"},
//        "nameIdentifier" : {
//          "@schemeURI" : "http://orcid.org/",
//          "@nameIdentifierScheme" : "ORCID",
//          "$" : "0000-0001-5000-0007"
//        },
//        "affiliation" : {"$" : "DataCite"}
//      }
//    }
//  ]
//},
//"titles" : {
//  "$" : [
//    {
//      "title" : {
//        "@xml:lang" : "en-US",
//        "$" : "Full DataCite XML Example"
//      }
//    },
//    {
//      "title" : {
//        "@xml:lang" : "en-US",
//        "@titleType" : "Subtitle",
//        "$" : "Demonstration of DataCite Properties."
//      }
//    }
//  ]
//},
//"publisher" : {"$" : "DataCite"},
//"publicationYear" : {"$" : 2014},


//{
//  "resource" : {
//  "@xmlns" : "http://datacite.org/schema/kernel-4",
//      "@xmlns:xsi" : "http://www.w3.org/2001/XMLSchema-instance",
//      "@xsi:schemaLocation" : "http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4.1/metadata.xsd",
//      "identifier" : {
//    "@identifierType" : "DOI",
//        "$" : "10.11570/18.0080"
//  },
//  "creators" : {
//    "$" : [
//      {
//        "creator" : {
//          "creatorName" : {
//            "@nameType" : "Personal",
//            "$" : "Miller, Elizabeth"
//          },
//          "givenName" : {"$" : "Elizabeth"},
//          "familyName" : {"$" : "Miller"},
//          "nameIdentifier" : {
//            "@schemeURI" : "http://orcid.org/",
//            "@nameIdentifierScheme" : "ORCID",
//            "$" : "0000-0001-5000-0007"
//          },
//          "affiliation" : {"$" : "DataCite"}
//        }
//      }
//    ]
//  },
//  "titles" : {
//    "$" : [
//      {
//        "title" : {
//          "@xml:lang" : "en-US",
//          "$" : "Full DataCite XML Example"
//        }
//      },
//      {
//        "title" : {
//          "@xml:lang" : "en-US",
//          "@titleType" : "Subtitle",
//          "$" : "Demonstration of DataCite Properties."
//        }
//      }
//    ]
//  },
//  "publisher" : {"$" : "DataCite"},
//  "publicationYear" : {"$" : 2014},
//
//}
//}


