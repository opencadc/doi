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
    var ajaxCallStatus = ''  // minting, creating, updating


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
      $('#doi_request').click(handleNewDoiClick)
      $('#doi_form_delete_button').click(handleDOIDelete)
      $('#doi_form_mint_button').click(handleDoiMint)
      $('#doi_request_form').submit(handleDOIRequest)

      $('#doi_add_author').click(handleAddAuthor)


      page.subscribe(page, cadc.web.citation.events.onAuthenticated, function (e, data) {
        parseUrl()
      })
    }


    // ------------ Page state management functions ------------

    function setPageState(newState) {
      if (newState === 'minted') {
        setFormDisplayState('display')
        setButtonState('minted')
        $('.doi-minted').removeClass('hidden')
        $('.doi-status-badge').removeClass('hidden')
        $('.doi-status').addClass('hidden')
      } else if (newState === 'refresh') {
        setFormDisplayState('form')
        setButtonState('create')
        $('.doi-status-badge').addClass('hidden')
        $('.doi-status').removeClass('hidden')
      } else { // 'working' state
        setFormDisplayState('form')
        setButtonState('update')
        $('.doi-status-badge').addClass('hidden')
        $('.doi-status').removeClass('hidden')
      }
    }

    function handleNewDoiClick() {
      // 'true' here will trigger the form to reset itself
      handleFormReset(true)
    }

    function handleFormReset(callFormReset) {
      setPageState('refresh')

      // Clear Related Information panel
      $('#doi_related').addClass('hidden')
      page.clearAjaxAlert()
      $('#doi_data_dir').html('')
      $('#doi_landing_page').html('')

      page.setProgressBar('okay')
      //setFormDisplayState('form')
      //setButtonState('create')
      $('#doi_additional_authors').empty()
      //setPageState('reset')

      // Do this only if explicitly asked
      // If this comes in from clicking the 'Clear' button, the data will be
      // the event itself.
      if (callFormReset === true) {
        $('#doi_form_reset_button').click()
      }
    }

    function setFormDisplayState(mode) {
      if (mode === 'display') {
        $('.doi-display').removeClass('hidden')
        $('.doi-form').addClass('hidden')
      } else {
        $('.doi-display').addClass('hidden')
        $('.doi-form').removeClass('hidden')
      }
    }

    function setButtonState(mode) {
      if (mode === 'update') {
        $('.button-group').removeClass('hidden')
        $('#doi_action_button').text('Update')
        $('#doi_form_delete_button').removeClass('hidden')
        $('#doi_form_mint_button').removeClass('hidden')
      } else if (mode === 'create') {
        $('.button-group').removeClass('hidden')
        $('#doi_action_button').text('Create')
        $('#doi_form_delete_button').addClass('hidden')
        $('#doi_form_mint_button').addClass('hidden')
      } else if (mode === 'minted') {
        $('.button-group').addClass('hidden')
      }
    }

    // Must be 1 to start
    var authorcount = 1
    function handleAddAuthor(event) {
      buildAuthorInput(authorcount++)
    }

    function buildAuthorInput(authorNum) {
      // something to handle tabindex.. TODO
      var elementName = 'addtl_author_' + authorNum
      var elementId = 'doi_' + elementName
      var parentElementId = 'doi_' + elementName + '_div'

      var inputHtml = '<div class="input-group mb-3 doi-remove-author" id="' + parentElementId + '" >' +
          '<input type="text" class="form-control doi-form doi-form-input"  name="' + elementName +
          '"placeholder="family name, given name" id="' + elementId + '" />' +
          '<div class="input-group-addon doi-form ">' +
          '<button type="button" class="btn btn-default doi-small-button glyphicon glyphicon-minus" id="' + elementName + '" ></button>' +
          '</div><div class="mb-3 doi-display ' + elementId + ' hidden"></div></div></div>'

      $('#doi_additional_authors').append(inputHtml)
      $('#' + elementName).bind('click', handleRemoveAuthor)
      return elementName
    }

    function addAuthorStanza(authorName) {
      var elementName = buildAuthorInput(authorcount++)
      $('#doi_' + elementName).val(authorName)
      $('.doi_' + elementName).html(authorName)
    }

    function handleRemoveAuthor(event) {
      var elId = event.currentTarget.getAttribute('id')
      $('#' + elId).unbind('click')
      // Remove entire input-group
      $('#doi_' + elId + '_div').remove()
    }

    // ------------ HTTP/Ajax functions ------------

    // Used in POST for Create, Update and Mint
    function gatherFormData() {
      var _formdata = $('#doi_request_form').serializeArray()
      // Disabled fields are not included in .serializeArray()...
      // Grab the doiNumber field
      _formdata.push({'name': 'doiNumber' , 'value': $('#doi_number').val()})
      var journalRef = ''
      var additionalAuthors = new Array()
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
            if (formField.name.match('addtl_author_')) {
              additionalAuthors.push(formField.value)
            }
            break
          }
        }
      }

      doiDoc.setAuthorList(additionalAuthors)

      page.setProgressBar('busy')

      // Set up the multi part data to be submitted to the
      // doi web service
      var multiPartData = new FormData()
      multiPartData.append( 'journalRef', journalRef)

      // 'Blob' type is requred to have the 'filename="blob" parameter added
      // to the multipart section, and have the Content-type header added
      multiPartData.append('doiMeta', new Blob([JSON.stringify(doiDoc.getDoc())], {
        type: 'application/json'
      }))

      return multiPartData
    }

    // POST
    function handleDOIRequest(event) {
      // Stop normal form submit
      event.preventDefault()
      // Clear any previous error bars
      page.clearAjaxAlert()
      var multiPartData = gatherFormData()

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
          getDoiStatus(doiSuffix)
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
          setButtonState('update')

          var doiSuffix = data.resource.identifier['$'].split('/')[1]
          // Populate javascript object behind form
          doiDoc.populateDoc(data)
          populateForm()

          // Kick off status call
          getDoiStatus(doiSuffix)
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

    // Mint
    function handleDoiMint(event) {
      event.preventDefault()
      ajaxCallStatus = 'minting'
      var multiPartData = gatherFormData()

      // Display message and set URL addition depending on whether
      // this is a CREATE or UPDATE function
      var urlAddition = ''
      var modalMessage = ''
      var doiSuffix = doiDoc.getDOISuffix()

      urlAddition = '/' + doiSuffix  + '/mint'
      modalMessage += 'Minting Data DOI ' + doiSuffix + '...'

      page.setInfoModal('Please wait ', modalMessage, false)

      setFormDisplayState('display')

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
          // Load the data returned into the local doiDocument to be accessed.
          hideInfoModal()
          page.setProgressBar('okay')
          //setPageState('minted') // may be 'working'

          doiDoc.populateDoc(data)
          populateForm()

          // Kick off status call to refresh lower panel
          getDoiStatus(doiSuffix)
        })
        .fail(function(message) {
          hideInfoModal()
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

        if (data.doistatus.status['$'] === 'minted') {
          setPageState('minted')
        } else if (data.doistatus.status['$'] === 'in progress') {
          setPageState('working')
        }

      })
      .fail(function(message) {
        hideInfoModal()
        page.setProgressBar('error')
        //setPageState('warning')
        page.setAjaxFail(message)
      })
    })
    return false
  }

    function loadMetadata(statusData) {
      // Performed after a successful GET for status
      var dataDir = page.mkDataDirLink(statusData.doistatus.dataDirectory['$'])
      // Once the Mint function is completed, landing page will also be displayed
      $('#doi_related').removeClass('hidden')
      $('#doi_status').html(statusData.doistatus.status['$'])
      $('#doi_data_dir').html(dataDir)
      $('#doi_landing_page').html(page.mkLandingPageLink(statusData.doistatus.identifier['$'].split("/")[1]))

      // This happens to be an input element in the form, so 'val' is preferred
      $('#doi_journal_ref').val(statusData.doistatus.journalRef['$'])
      $('.doi-journal-ref').html(statusData.doistatus.journalRef['$'])
    }

    function populateForm() {
      var authorList = doiDoc.getAuthorList()

      // First author is assumed to be the first one sent back
      $('#doi_author').val(authorList[0])
      $('.doi-author').html(authorList[0])

      // Additional authors may be present in the doiDoc
      $('#doi_additional_authors').empty()
      for (var i=1; i<authorList.length; i++) {
        addAuthorStanza(authorList[i])
      }
      $('#doi_title').val(doiDoc.getTitle())
      $('.doi-title').html(doiDoc.getTitle())

      var doiNum = doiDoc.getDOINumber()
      $('#doi_number').val(doiNum)
      $('.doi-number').html(doiNum)

      if (doiDoc.getLanguage() !== '') {
        var languageEl = $('input:radio[name=doiLanguage][value=' + doiDoc.getLanguage() + ']').click()
      }
    }

    function hideInfoModal() {
      $('#info_modal').modal('hide')
      $('body').removeClass('modal-open')
      $('.modal-backdrop').remove()
    }

    $.extend(this, {
      init: init
    })
  }

})(jQuery)
