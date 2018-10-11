;(function($) {
  // register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        citation: {
          CitationRequest: CitationRequest,
          DOIDocument: DOIDocument
        }
      }
    }
  })

  /**
   * Controller for Data Citation Request UI.
   *
   * @constructor
   * @param {{}} inputs   Input configuration.
   * @param {String} [inputs.resourceCapabilitiesEndPoint='http://apps.canfar.net/reg/resource-caps'] URL of the resource capability document.
   */
  function CitationRequest(inputs) {
    var doiDoc = new DOIDocument()
    var page = new cadc.web.citation.CitationPage(inputs)


    // ------------ Page load functions ------------
    function parseUrl() {
      var query = window.location.search

      if (query !== '') {
        // perform GET and display for form
        handleDOIGet(query.split('=')[1])
      }
    }

    function setPublicationYears() {
      var curYear = new Date().getFullYear()
      var $yearSelect = $('#doi_publish_year')
      for (var i = 0; i < 3; i++) {
        $yearSelect.append(
          '<option value="' + curYear + '">' + curYear + '</option>'
        )
        curYear++
      }
    }

    function attachListeners() {
      $('#doi_form_reset_button').click(handleFormReset)
      $('#doi_form_delete_button').click(handleDOIDelete)
      $('#doi_request_form').submit(handleDOIRequest)
    }

    function setNotAuthenticated(errorMsg) {
      $('#auth_modal').modal('show')
      $('.doi-form-body').addClass('hidden')
      $('.doi_not_authenticated').removeClass('hidden')

      $('.doi_not_authenticated').click(function() {
        $('#auth_modal').modal('show')}
      )
    }

    function setAuthenticated() {
      $('.doi-form-body').removeClass('hidden')
      $('.doi_not_authenticated').addClass('hidden')

      setPublicationYears()
      // This will kick off a GET if the URL contains a request
      parseUrl()
      attachListeners()
    }

    // ------------ Page state management functions ------------

    function handleFormReset(callFormReset) {
      $('#doi_metadata').addClass('hidden')
      page.clearAjaxAlert()
      $('#doi_data_dir').html('')
      $('#doi_landing_page').html('')
      page.setProgressBar('okay')
      setButtonState('create')

      // Do this only if explicitly asked
      // If this comes in from clicking the 'Clear' button, the data will be
      // the event itself.
      if (callFormReset === true) {
        $('#doi_form_reset_button').click()
      }
    }

    function setButtonState(mode) {
      if (mode === 'update') {
        $('.doi_edit').removeClass('hidden')
        $('#doi_create_button').addClass('hidden')
        $('#doi_form_delete_button').removeClass('hidden')
      } else if (mode === 'create') {
        $('.doi_edit').addClass('hidden')
        $('#doi_create_button').removeClass('hidden')
        $('#doi_form_delete_button').addClass('hidden')
      }
    }

    // ------------ HTTP/Ajax functions ------------

    // POST
    function handleDOIRequest(event) {
      // Clear any previous error bars
      page.clearAjaxAlert()
      var _formdata = $(this).serializeArray()
      var personalInfo = {}

      for (var i = 0, fdl = _formdata.length; i < fdl; i++) {
        var formField = _formdata[i]
        // format: formField: {name:*,value:*}

        switch (formField.name) {
          case 'publisher': {
            doiDoc.setPublisher(formField.value)
            break
          }
          case 'publicationYear': {
            doiDoc.setPublicationYear(formField.value)
            break
          }
          case 'title': {
            doiDoc.setTitle(formField.value)
            break
          }
          case 'doi-number': {
            doiDoc.setDOINumber(formField.value)
            break
          }
          case 'creatorList': {
            doiDoc.setAuthor(formField.value)
            break
          }
          default: {
            break
          }
        }
      }

      page.setProgressBar('busy')

      page.prepareCall().then(function(serviceURL) {
        $.ajax({
          xhrFields: { withCredentials: true },
          url: serviceURL,
          method: 'POST',
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify(doiDoc.getMinimalDoc())
        })
          .success(function(data) {
            // POST redirects to a get.
            // Load the data returned into the local doiDocument to be
            // accessed.
            page.setProgressBar('okay')
            $('#doi_number').val(data.resource.identifier['$'])
            var doiSuffix = data.resource.identifier['$'].split('/')[1]
            setButtonState('update')
            loadMetadata(doiSuffix)

            doiDoc.populateDoc(data)
            populateForm()
          })
          .fail(function(message) {
            page.setAjaxFail(message)
          })
      })

      return false
    }

    //GET
    function handleDOIGet(doiNumber) {
      page.clearAjaxAlert()
      page.setProgressBar('busy')

      // Submit doc using ajax
      page.prepareCall().then(function(serviceURL) {
        var getUrl = serviceURL + '/' + doiNumber
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: 'GET',
          dataType: 'json',
          contentType: 'application/json'
        })
          .success(function(data) {
            page.setProgressBar('okay')
            setButtonState('update')
            $('#doi_number').val(data.resource.identifier['$'])
            var doiSuffix = data.resource.identifier['$'].split('/')[1]
            // Populate lower panel on form page
            loadMetadata(doiSuffix)
            // Populate javascript object behind form
            doiDoc.populateDoc(data)
            populateForm()
          })
          .fail(function(message) {
            page.setProgressBar('error')
            page.setAjaxFail(message)
          })
      })

      return false
    }

    // DELETE
    function handleDOIDelete() {
      // Get doi number from form...
      var doiNumber = $('#doi_number')
        .val()
        .split('/')[1]
      page.clearAjaxAlert()
      page.setProgressBar('busy')

      page.prepareCall().then(function(serviceURL) {
        var getUrl = serviceURL + '/' + doiNumber
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: 'DELETE'
        })
          .success(function(data) {
            page.setProgressBar('okay')
            handleFormReset(true)
            page.setAjaxSuccess('DOI Deleted')
          })
          .fail(function(message) {
            page.setProgressBar('error')
            page.setAjaxFail(message)
          })
      })
      return false
    }

    // TODO: hook this in as a secondary call after the initial GET
    // returns successfully...
    //function getDoiStatus(doiName) {
    //  page.prepareCall().then(function(serviceURL) {
    //    var statusUrl = serviceURL + '/' + doiName + "/status"
    //    $.ajax({
    //      xhrFields: { withCredentials: true },
    //      url: statusUrl,
    //      method: 'GET',
    //      contentType: 'text/xml'
    //    })
    //        .success(function(data) {
    //          page.setProgressBar('okay')
    //          displayDoiStatus(data)
    //        })
    //        .fail(function(message) {
    //          // skip this one
    //          // remove this entry from the table data source
    //          //page.setProgressBar('error')
    //          //setTableProgress('okay')
    //          //page.setAjaxFail(message)
    //        })
    //  })
    //  return false
    //}
    //


    function loadMetadata(doiName) {
      // Performed after a successful GET
      // There will be a service call eventually to get this  data, but for now the front end
      // will display info based on the doiName data directory will be vospace

      $('#doi_metadata').removeClass('hidden')

      var astrodataDir = 'AstroDataCitationDOI/CISTI.CANFAR/'
      var dataUrl =
        '<a href="/storage/list/' +
        astrodataDir +
        doiName +
        '/data' +
        '" target="_blank">/storage/list/' +
        astrodataDir +
        doiName +
        '/data</a>'
      $('#doi_data_dir').html(dataUrl)

      // Once the Mint function is completed, this will be displayed
      //var landingPageClose = ".html?view=data";
      //var landingPageUrl = "<a href=\"/vospace/nodes/" + astrodataDir + doiName + "/" + doiName + landingPageClose +
      //"\">/vospace/nodes/" + astrodataDir + doiName + "/" + doiName + landingPageClose + "</a>";
      //$("#doi_landing_page").html(landingPageUrl);
    }

    function populateForm() {
      $('#doi_creator_list').val(doiDoc.getAuthorList())
      $('#doi_title').val(doiDoc.getTitle())
      $('#doi_publisher').val(doiDoc.getPublisher())
      $('#doi_publish_year').val(doiDoc.getPublicationYear())
    }

    $.extend(this, {
      setNotAuthenticated: setNotAuthenticated,
      setAuthenticated: setAuthenticated,
      handleFormReset: handleFormReset,
      handleDOIRequest: handleDOIRequest,
      handleDOIGet: handleDOIGet,
      handleDOIDelete: handleDOIDelete
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
        resource: {
          '@xmlns': 'http://datacite.org/schema/kernel-4',
          identifier: {
            '@identifierType': 'DOI',
            $: '10.11570/YY.xxxx'
          },
          creators: {
            $: []
          },
          titles: {
            $: [
              {
                title: {
                  '@xml:lang': 'en-US',
                  $: ''
                }
              }
            ]
          },
          publisher: { $: '' },
          publicationYear: { $: new Date().getFullYear() },
          resourceType: {
            '@resourceTypeGeneral': 'Dataset',
            $: 'Dataset'
          }
        }
      }
    }

    function getMinimalDoc() {
      if (_selfDoc._minimalDoc === {}) {
        initMinimalDoc()
      }
      return _selfDoc._minimalDoc
    }

    function populateDoc(serviceData) {
      _selfDoc._minimalDoc = serviceData
    }

    function makeCreatorStanza(personalInfo) {
      var nameParts = personalInfo.split(', ')
      var creatorObject = {
        creatorName: {
          '@nameType': 'Personal',
          $: ''
        },
        givenName: { $: '' },
        familyName: { $: '' }
      }
      creatorObject.creatorName['$'] = personalInfo
      creatorObject.familyName['$'] = nameParts[0]
      creatorObject.givenName['$'] = nameParts[1]

      return { creator: creatorObject }
    }

    function setAuthor(authorList) {
      // personalInfo is a new line delimited list of last name, first name elements
      var names = authorList.split('\n')
      for (var j = 0; j < names.length; j++) {
        _selfDoc._minimalDoc.resource.creators['$'][j] = makeCreatorStanza(
          names[j]
        )
      }
    }

    function setDOINumber(identifier) {
      if (identifier !== '') {
        _selfDoc._minimalDoc.resource.identifier['$'] = identifier
      }
    }

    function setPublicationYear(year) {
      _selfDoc._minimalDoc.resource.publicationYear['$'] = year
    }

    function setPublisher(identifier) {
      _selfDoc._minimalDoc.resource.publisher['$'] = identifier
    }

    function setTitle(title) {
      _selfDoc._minimalDoc.resource.titles['$'][0].title['$'] = title
    }

    function getAuthorFullname() {
      return _selfDoc._minimalDoc.resource.creators['$'][0].creator.creatorName[
        '$'
      ]
    }

    function getAuthorList() {
      var listSize = _selfDoc._minimalDoc.resource.creators['$'].length
      var authorList = ''
      for (var ix = 0; ix < listSize; ix++) {
        authorList =
          authorList +
          _selfDoc._minimalDoc.resource.creators['$'][ix].creator.creatorName[
            '$'
          ] +
          '\n'
      }
      return authorList
    }

    function getDOINumber() {
      return _selfDoc._minimalDoc.resource.identifier['$']
    }

    function getPublicationYear() {
      return _selfDoc._minimalDoc.resource.publicationYear['$']
    }

    function getPublisher() {
      return _selfDoc._minimalDoc.resource.publisher['$']
    }

    function getTitle() {
      return _selfDoc._minimalDoc.resource.titles['$'][0].title['$']
    }

    initMinimalDoc()

    $.extend(this, {
      initMinimalDoc: initMinimalDoc,
      getMinimalDoc: getMinimalDoc,
      populateDoc: populateDoc,
      setAuthor: setAuthor,
      setDOINumber: setDOINumber,
      setPublicationYear: setPublicationYear,
      setPublisher: setPublisher,
      setTitle: setTitle,
      getAuthorFullname: getAuthorFullname,
      getAuthorList: getAuthorList,
      getDOINumber: getDOINumber,
      getPublicationYear: getPublicationYear,
      getPublisher: getPublisher,
      getTitle: getTitle
    })
  }
})(jQuery)
