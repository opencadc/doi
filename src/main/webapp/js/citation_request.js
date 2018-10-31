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

      $('#doi_add_author').click(handleAddAuthor)

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
      $('#doi_additional_authors').empty()

      // Do this only if explicitly asked
      // If this comes in from clicking the 'Clear' button, the data will be
      // the event itself.
      if (callFormReset === true) {
        $('#doi_form_reset_button').click()
      }
    }

    function setButtonState(mode) {
      if (mode === 'update') {
        $('#doi_action_button').text("Update")
        $('#doi_form_delete_button').removeClass('hidden')
      } else if (mode === 'create') {
        $('.doi_edit').addClass('hidden')
        $('#doi_action_button').text("Create")
        $('#doi_form_delete_button').addClass('hidden')
      }
    }

    // Must be 1 to start
    var authorcount = 1;
    function handleAddAuthor(event) {
      buildAuthorInput(authorcount++)
    }

    function buildAuthorInput(authorNum) {
      // something to handle tabindex.. TODO
      var elementName = 'addtl_author_' + authorNum;
      var elementId = 'doi_' + elementName;
      var paretElementId = 'doi_' + elementName + '_div';

      var inputHtml = "<div class=\"input-group mb-3 doi-remove-author\" id=\"" + paretElementId + "\" >" +
          "<input type=\"text\" class=\"form-control doi-form-input\"  name=\"" + elementName +
          "\"placeholder=\"family name, given name\" id=\"" + elementId + "\" />" +
          "<div class=\"input-group-addon\">" +
          "<button type=\"button\" class=\"btn btn-default doi-small-button glyphicon glyphicon-minus\" id=\"" + elementName + "\" ></button>" +
          "</div></div>"

      $('#doi_additional_authors').append(inputHtml);
      $('#' + elementName).bind('click', handleRemoveAuthor)
      return elementName;
    }

    function addAuthorStanza(authorName) {
      var elementName = buildAuthorInput(authorcount++);
      $('#doi_' + elementName).val(authorName)
    }

    function handleRemoveAuthor(event) {
      var elId = event.currentTarget.getAttribute('id')
      $('#' + elId).unbind('click')
      // Remove entire input-group
      $('#doi_' + elId + '_div').remove()
    }

    // ------------ HTTP/Ajax functions ------------

    // POST
    function handleDOIRequest(event) {
      // Stop normal form submit
      event.preventDefault();
      // Clear any previous error bars
      page.clearAjaxAlert()
      var _formdata = $(this).serializeArray()
      // Disabled fields are not included in .serializeArray()...
      // Grab the doiNumber field
      _formdata.push({'name': 'doiNumber' , 'value': $('#doi_number').val()})
      var journalRef = ''
      var additionalAuthors = new Array();
      doiDoc.clearDoc()

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
          case 'firstAuthor': {
            additionalAuthors.push(formField.value)
            break
          }
          case 'journalRef' : {
            journalRef = formField.value
            break
          }
          case 'doiLanguage' : {
            doiDoc.setLanguage(formField.value)
            break
          }
          default: {
            // Check to see if this an additional author:
            if (formField.name.match("addtl_author_")) {
              additionalAuthors.push(formField.value)
            }
            break
          }
        }
      }

      doiDoc.setAuthorList(additionalAuthors)

      page.setProgressBar('busy')

      // Display message and set URL addition depending on whether
      // this is a CREATE or UPDATE function
      var urlAddition = ''
      var modalMessage = ''
      var doiSuffix = doiDoc.getDOISuffix()
      if (doiSuffix !== '') {
        urlAddition = '/' + doiSuffix
        modalMessage += ' Updating Data DOI ' + doiSuffix + '...'
      }
      else {
        modalMessage += 'Requesting new Data DOI...'
      }
      page.setInfoModal('Please wait ', modalMessage, false)

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
          url: serviceURL + urlAddition,
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
          hideInfoModal()
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
          hideInfoModal()
          page.setAjaxFail(message)
        })
      })

      return false
    }

    //GET
    function handleDOIGet(doiNumber) {
      page.clearAjaxAlert()
      page.setProgressBar('busy')
      page.setInfoModal('Please wait ', 'Fetching DOI ' + doiNumber + '...', true)

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
      var authorList = doiDoc.getAuthorList()

      // First author is assumed to be the first one sent back
      $('#doi_author').val(authorList[0])

      // Additional authors may be present in the doiDoc
      $('#doi_additional_authors').empty()
      for (var i=1; i<authorList.length; i++) {
        addAuthorStanza(authorList[i])
      }
      $('#doi_title').val(doiDoc.getTitle())
      $('#doi_number').val(doiDoc.getDOINumber())

      if (doiDoc.getLanguage() !== "") {
        var languageEl = $('input:radio[name=doiLanguage][value=' + doiDoc.getLanguage() + ']').click();
      }
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
