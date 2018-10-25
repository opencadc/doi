;(function($) {
  // register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        citation: {
          CitationRequest: CitationRequest
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
    var doiDoc = new cadc.web.citation.DOIDocument()
    var page = new cadc.web.citation.CitationPage(inputs)


    // ------------ Page load functions ------------

    function init() {
      // Listen for the (CitationPage) onAuthenticated call
      attachListeners()
      page.checkAuthentication()
    }

    function parseUrl() {
      var query = window.location.search

      if (query !== '') {
        // perform GET and display for form
        handleDOIGet(query.split('=')[1])
      }
    }

    function attachListeners() {
      $('#doi_form_reset_button').click(handleFormReset)
      $('#doi_form_delete_button').click(handleDOIDelete)
      $('#doi_request_form').submit(handleDOIRequest)

      page.subscribe(page, cadc.web.citation.events.onAuthenticated, function (e, data) {
        parseUrl()
      })
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
      var journalRef = ""

      for (var i = 0, fdl = _formdata.length; i < fdl; i++) {
        var formField = _formdata[i]
        // format: formField: {name:*,value:*}

        switch (formField.name) {
          case 'title': {
            doiDoc.setTitle(formField.value)
            break
          }
          case 'doiNumber': {
            doiDoc.setDOINumber(formField.value)
            break
          }
          case 'creatorList': {
            doiDoc.setAuthor(formField.value)
            break
          }
          case 'journalRef' : {
            journalRef = formField.value
            break
          }
          default: {
            break
          }
        }
      }

      page.setProgressBar('busy')

      // Set up the multi part data to be submitted to the
      // doi web service
      var multiPartData = new FormData();
      multiPartData.append( 'journalRef', journalRef)

      // 'Blob' type is requred to have the 'filename="blob" parameter added
      // to the multipart section, and have the Content-type header added
      multiPartData.append('doiMeta', new Blob([JSON.stringify(doiDoc.getDoc())], {
        type: 'application/json'
      }));

      page.prepareCall().then(function(serviceURL) {
        $.ajax({
          xhrFields: { withCredentials: true },
          url: serviceURL,
          method: 'POST',
          dataType: 'json',
          cache: false,
          data: multiPartData,
          processData: false,
          contentType: false
        })
        .success(function(data) {
          // POST redirects to a get.
          // Load the data returned into the local doiDocument to be
          // accessed.
          page.setProgressBar('okay')
          $('#doi_number').val(data.resource.identifier['$'])
          var doiSuffix = data.resource.identifier['$'].split('/')[1]
          setButtonState('update')

          doiDoc.populateDoc(data)
          populateForm()

          // Kick off status call
          getDoiStatus(doiSuffix);
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
      page.setInfoModal('Please wait ', 'Processing request...', true)

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
          //page.setProgressBar('okay')
          setButtonState('update')

          var doiSuffix = data.resource.identifier['$'].split('/')[1]
          // Populate javascript object behind form
          doiDoc.populateDoc(data)
          populateForm()

          // Kick off status call
          getDoiStatus(doiSuffix);
        })
        .fail(function(message) {
          hideInfoModal()
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
      page.setInfoModal('Please wait ', 'Processing request...', true)

      page.prepareCall().then(function(serviceURL) {
        var getUrl = serviceURL + '/' + doiNumber
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: 'DELETE'
        })
        .success(function(data) {
          hideInfoModal()
          page.setProgressBar('okay')
          handleFormReset(true)
          page.setAjaxSuccess('DOI Deleted')
        })
        .fail(function(message) {
          hideInfoModal()
          page.setProgressBar('error')
          page.setAjaxFail(message)
        })
      })
      return false
    }

    // GET
   function getDoiStatus(doiName) {
     page.setProgressBar('busy')

     page.prepareCall().then(function(serviceURL) {
      var statusUrl = serviceURL + '/' + doiName + '/status'
      $.ajax({
        xhrFields: { withCredentials: true },
        url: statusUrl,
        method: 'GET',
        dataType: 'json',
        contentType: 'application/json'
      })
      .success(function(data) {
        hideInfoModal()
        page.setProgressBar('okay')
        loadMetadata(data)
      })
      .fail(function(message) {
        hideInfoModal()
        page.setProgressBar('error')
        page.setAjaxFail(message)
      })
    })
    return false
  }

    function loadMetadata(statusData) {
      // Performed after a successful GET for status
      var dataDir = page.mkDataDirLink(statusData.doistatus.dataDirectory['$'])
      // Once the Mint function is completed, landing page will also be displayed
      $('#doi_metadata').removeClass('hidden')
      $('#doi_status').html(statusData.doistatus.status['$'])
      $('#doi_data_dir').html(dataDir)

      // This happens to be an input element in the form, so 'val' is preferred
      $('#doi_journal_ref').val(statusData.doistatus.journalRef['$'])
    }

    function populateForm() {
      $('#doi_creator_list').val(doiDoc.getAuthorList())
      $('#doi_title').val(doiDoc.getTitle())
      $('#doi_number').val(doiDoc.getDOINumber())
    }

    function hideInfoModal() {
      $('#info_modal').modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
    }

    $.extend(this, {
      init: init
    })
  }

})(jQuery)
