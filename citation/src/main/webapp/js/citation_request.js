;(function($) {
  // register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        citation: {
          CitationRequest: CitationRequest,
          events: {
            onDoiLoad: new jQuery.Event('doi:onDoiLoad')
          }
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
    var doiInfo = {'journalRef': ' '}
    var ajaxCallStatus = ''  // minting, creating, updating

    // The UI state reflects what actions are available and how the metadata is displayed to the
    // screen, what the user is able to update, etc.
    const uiState = {
      CREATE: 'create', // empty form - create action available
      UPDATE: 'update', // populated form, update, delete available, mint disabled
      MINT: 'mint', // populated form, update, delete, mint button enabled
      MINT_RETRY: 'mint_retry', // when error occurs during minting: update button disabled? - mint_retry available
      POLLING: 'polling', // loading spinner with modal - no actions available
      REGISTER: 'register', // publication doi (and journal ref?) updatable - register_doi available
      COMPLETED: 'complete' // no actions available
    }

    var curUIState = ''
    var curServiceState = ''
    var _initialLoad = true


    // ------------ Page load functions ------------

    function init() {
      // Initialize ui and service states
      curUIState = uiState.CREATE
      curServiceState = page.serviceState.START

      // Listen for the (CitationPage) onAuthenticated call
      attachListeners()
      page.checkAuthentication()
    }

    function parseUrl() {
      var query = window.location.search

      if (query.match('runid')) {
        page.parseUrl()
      }

      if (query !== '') {
        // Parse key/value pairs
        var queryPairs = query.split('&')

        for (var i=0, qpl=queryPairs.length; i<qpl; i++) {
          var keyVal = queryPairs[i].split('=')
          if (keyVal[0].match('doi')) {
            handleDOIGet(keyVal[1])
            break
          }
        }
      }
    }


    function attachListeners() {
      // Button listeners
      $('#doi_form_reset_button').click(handleResetFormState)
      $('#doi_delete_button').click(handleDOIDelete)
      $('#doi_mint_button').click(handleDoiMint)
      $('#doi_request_form').submit(handleDOIRequest)

      // Other page function listeners
      $('#doi_request').click(handleNewDoiClick)
      $('#doi_add_author').click(handleAddAuthor)

      page.subscribe(page, cadc.web.citation.events.onAuthenticated, function (e, data) {
        parseUrl()
      })

      // Monitor changes in data in form: MINT function is not available
      // if data has been updated.
      $('input').keyup(function(){
        if (curUIState === uiState.MINT) {
          setButtonState(uiState.UPDATE)
        }
      })
    }


    // ------------ Page state management functions ------------

    function setPageState(newState) {
      // Clear any tooltips
      page
      curServiceState = newState
      switch(newState) {
        case page.serviceState.START:
          // Blank form
          curUIState = uiState.CREATE
          setButtonState(uiState.CREATE)
          setFormDisplayState('form')
          setBadgeState('off')
          setContextHelp(uiState.CREATE)
          curUIState = uiState.CREATE
          break
        case page.serviceState.INPROGRESS:
          // Update form
          curUIState = uiState.MINT
          setButtonState(uiState.MINT)
          setFormDisplayState('form')
          setContextHelp(uiState.MINT)
          break
        case page.serviceState.LOCKING_DATA:
          setButtonState(uiState.MINT_RETRY)
          setMintButton('disabled')
          curUIState = uiState.MINT_RETRY
          setFormDisplayState('display')
          setBadgeState('working')
          setContextHelp(uiState.MINT_RETRY)
          break
        case page.serviceState.DATA_LOCKED:
          // XML can be updated
          curUIState = uiState.MINT
          setButtonState(uiState.MINT_RETRY)
          setFormDisplayState('display')
          setBadgeState('data_locked')
          setContextHelp(uiState.MINT_RETRY)
          break
        case page.serviceState.MINTED:
          curUIState = uiState.REGISTER
          setButtonState(uiState.REGISTER)
          setFormDisplayState('display')
          setBadgeState(newState)
          setContextHelp(uiState.COMPLETED)
          break
        case page.serviceState.ERROR_LOCKING_DATA:
        case page.serviceState.ERROR_REGISTERING:
          setButtonState(uiState.MINT_RETRY)
          curUIState = uiState.MINT_RETRY
          // assuming updating metadata is blocked at this point?
          // if not this will be different than REGISTER_ERROR state
          setFormDisplayState('display')
          setBadgeState('warning')
          setContextHelp(uiState.COMPLETED)
          break
        case page.serviceState.COMPLETED:
          curUIState = uiState.COMPLETED
          setButtonState(uiState.COMPLETED)
          setFormDisplayState('display')
          setBadgeState('completed')
          setContextHelp(uiState.COMPLETED)
          break
      }
    }

    function setBadgeState(state) {
      if (state === 'off') {
        $('.doi-status-badge').addClass('hidden')
        $('.doi-data-locked').addClass('hidden')
      } else {
        $('.doi-status-badge').removeClass('hidden')

        switch (state) {
          case 'working':
            $('.doi-minted').addClass('hidden')
            $('.doi-working').removeClass('hidden')
            $('.doi-warning').addClass('hidden')
            $('.doi-retry').addClass('hidden')
            break
          case 'retry':
            $('.doi-minted').addClass('hidden')
            $('.doi-working').addClass('hidden')
            $('.doi-warning').addClass('hidden')
            $('.doi-retry').removeClass('hidden')
            break
          case 'data_locked':
            $('.doi-minted').addClass('hidden')
            $('.doi-working').addClass('hidden')
            $('.doi-warning').addClass('hidden')
            $('.doi-retry').removeClass('hidden')
            $('.doi-data-locked').removeClass('hidden')
            break
          case 'minted' :
            $('.doi-minted').removeClass('hidden')
            $('.doi-working').addClass('hidden')
            $('.doi-warning').addClass('hidden')
            $('.doi-retry').addClass('hidden')
            $('#green_badge').text('PUBLISHED')
            $('.doi-data-locked').removeClass('hidden')
            break
          case 'completed' :
            $('.doi-minted').removeClass('hidden')
            $('.doi-working').addClass('hidden')
            $('.doi-warning').addClass('hidden')
            $('.doi-retry').addClass('hidden')
            $('#green_badge').text('COMPLETE')
            $('.doi-data-locked').removeClass('hidden')
            break
          case 'warning' :
            $('.doi-minted').addClass('hidden')
            $('.doi-working').addClass('hidden')
            $('.doi-warning').removeClass('hidden')
            $('.doi-retry').addClass('hidden')
            break

        }
      }
    }

    function setMintButton(state) {
      // Disabled state supports emphasizing that Mint feature isn't available if
      // current form data has been updated. Having the button disappear completely is more
      // confusing than having the button be disabled with some helpful text...
      if (state === 'on') {
        $('#doi_mint_button').text('Publish')
        $('#doi_mint_button').removeClass('hidden')
        $('#doi_mint_button').prop('disabled', false)
        $('.doi-mint-info').addClass('hidden')
      } else if (state === 'disabled') {
        $('#doi_mint_button').text('Publish')
        $('#doi_mint_button').removeClass('hidden')
        $('#doi_mint_button').prop('disabled', true)
        $('.doi-mint-info').removeClass('hidden')
      } else if (state === 'retry') {
        $('#doi_mint_button').text('Retry Publish')
        $('#doi_mint_button').removeClass('hidden')
        $('#doi_mint_button').prop('disabled', false)
        $('.doi-mint-info').addClass('hidden')
      } else if (state === 'off') {
        $('#doi_mint_button').addClass('hidden')
        $('.doi-mint-info').addClass('hidden')
      }
    }

    function setButtonState(curUiState) {
      switch(curUiState){
        case uiState.CREATE:
          $('.button-group').removeClass('hidden')
          $('#doi_request_button').removeClass('hidden')
          $('#doi_update_button').addClass('hidden')
          $('#doi_form_reset_button').removeClass('hidden')
          $('#doi_delete_button').addClass('hidden')
          $('#doi_register_button').addClass('hidden')
          $('#doi_request').addClass('hidden')
          setMintButton('off')
          break
        case uiState.UPDATE:
          $('.button-group').removeClass('hidden')
          $('#doi_request_button').addClass('hidden')
          $('#doi_update_button').removeClass('hidden')
          $('#doi_form_reset_button').removeClass('hidden')
          $('#doi_delete_button').removeClass('hidden')
          $('#doi_register_button').addClass('hidden')
          $('#doi_request').removeClass('hidden')
          setMintButton('disabled')
          break
        case uiState.MINT:
          $('.button-group').removeClass('hidden')
          $('#doi_request_button').addClass('hidden')
          $('#doi_update_button').removeClass('hidden')
          $('#doi_form_reset_button').removeClass('hidden')
          $('#doi_delete_button').removeClass('hidden')
          $('#doi_register_button').addClass('hidden')
          $('#doi_request').removeClass('hidden')
          setMintButton('on')
          break
        case uiState.MINT_RETRY:
          $('.button-group').removeClass('hidden')
          $('.doi_action_button').addClass('hidden')
          $('#doi_form_reset_button').addClass('hidden')
          $('#doi_delete_button').addClass('hidden')
          $('#doi_register_button').addClass('hidden')
          $('#doi_request').removeClass('hidden')
          setMintButton('retry')
          break
        case uiState.REGISTER:
        case uiState.COMPLETED:
          // TODO: with story to support registering the Publication DOI, this will change
          $('.button-group').addClass('hidden')
          $('#doi_request').removeClass('hidden')
          setMintButton('off')
          break
      }
    }

    function setContextHelp(state) {
        $('.citation-btn-bar').addClass('hidden')

        switch (state) {
          case uiState.CREATE:
            // Upper right button bar not active
            $('.citation-tooltip[data-contentkey="request_doi"]').removeClass('hidden')
            break
          case uiState.MINT:
            // Both button bars active
            $('.citation-tooltip[data-contentkey="update_doi"]').removeClass('hidden')
            $('.citation-tooltip[data-contentkey="update_buttonbar"]').removeClass('hidden')
            break
          case uiState.MINT_RETRY:
            $('.citation-tooltip[data-contentkey="update_doi"]').removeClass('hidden')
            $('.citation-tooltip[data-contentkey="locked_data_buttonbar"]').removeClass('hidden')
            break
          case uiState.MINTED :
            // Button bar below form not active
            $('.citation-tooltip[data-contentkey="minted_buttonbar"]').removeClass('hidden')
            break
          case uiState.COMPLETED :
            // Button bar below form not active
            $('.citation-tooltip[data-contentkey="completed_buttonbar"]').removeClass('hidden')
            break
        }
    }

    function handleNewDoiClick() {
      // Reset the form to it's original state.
      setPageState(page.serviceState.START)

      // Reset the doi Doc
      doiDoc.clearDoc()
      doiInfo.journalRef = ''

      // Clear Related Information panel
      $('#doi_related').addClass('hidden')
      page.clearAjaxAlert()
      $('#doi_data_dir').html('')
      $('#doi_landing_page').html('')

      page.setProgressBar('okay')
      $('#doi_additional_authors').empty()

      // Clear the form programmatically.
      $('form input[type=text]').val('')
      $('.doi_action_label').removeClass('hidden')

    }

    function handleResetFormState(event) {
      // revert form to it's state when page was first loaded
      // load the data from the last ajax call, if there is any
      event.preventDefault()
      page.clearAjaxAlert()

      if (doiDoc.isEmpty() === true) {
        // Clear the form programmatically.
        $('form input[type=text]').val('')
      } else {
        populateForm()
      }
      $('#doi_journal_ref').val(doiInfo.journalRef)
      $('.doi-journal-ref').html(doiInfo.journalRef)
    }

    function setFormDisplayState(mode) {
      if (mode === 'display') {
        $('.doi-display').removeClass('hidden')
        $('#doi_additional_authors_display').removeClass('hidden')
        $('.doi-form').addClass('hidden')
      } else {
        $('.doi-display').addClass('hidden')
        $('#doi_additional_authors_display').addClass('hidden')
        $('.doi-form').removeClass('hidden')
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
          '" placeholder="Author or Group Name" id="' + elementId + '" />' +
          '<div class="input-group-addon doi-form ">' +
          '<button type="button" class="btn btn-default doi-small-button glyphicon glyphicon-minus" id="' + elementName + '" ></button>' +
          '</div></div></div>'

      $('#doi_additional_authors').append(inputHtml)
      $('#' + elementName).bind('click', handleRemoveAuthor)
      return elementName
    }

    function addAuthorStanza(authorName) {
      var elementName = buildAuthorInput(authorcount++)
      $('#doi_' + elementName).val(authorName)
    }

    function handleRemoveAuthor(event) {
      var elId = event.currentTarget.getAttribute('id')
      $('#' + elId).unbind('click')
      // Remove entire input-group
      $('#doi_' + elId + '_div').remove()
    }


    // ------------ HTTP/Ajax functions ------------

    // Used in POST for Create, Update and Mint (postDoiData and handleDoiMint)
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

      // Set a dummy entry that gets checked server-side, but also gets replaced.
      // This will need revisiting sometime, but the Citation web application
      // needs rework to properly support CORS.
      // jenkinsd 2024.12.18
      //
      if (!doiDoc.getDOINumber()) {
        doiDoc.setDOINumber('NEWIDENTIFIER')
      }

      page.setProgressBar('busy')

      // Set up the multi part data to be submitted to the doi web service
      var multiPartData = new FormData()
      multiPartData.append( 'journalRef', journalRef)

      var _runid = page.getRunid()
      if (_runid !== '') {
        multiPartData.append('runId', _runid)
      }

      // 'Blob' type is requred to have the 'filename="blob" parameter added
      // to the multipart section, and have the Content-type header added
      multiPartData.append('doiMeta', new Blob([JSON.stringify(doiDoc.getDoc())], {
        type: 'application/json'
      }))

      return multiPartData
    }

    // ---------------- POST ------------------
    // Create and Update
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
        modalMessage += 'Updating Data DOI ' + doiSuffix + '...'
      }
      else {
        modalMessage += 'Requesting new Data DOI...'
      }
      page.setInfoModal('Please wait ', modalMessage, false, true)

      page.setAjaxCount(2)

      Promise.resolve(page.prepareCall())
        .then(function(serviceURL) {

          Promise.resolve(postDoiMetadata(serviceURL + urlAddition, multiPartData))
              .then(function(doiSuffix) {
                getDoiStatus(serviceURL, doiSuffix)
                    .catch(function(message) {
                      page.handleAjaxError(message)
                    })
              })
              .catch(function(message) {
                page.handleAjaxError(message)

              })
        })
        .catch(function(message) {
          page.handleAjaxError(message)
        })
    }


    function postDoiMetadata(serviceURL, doiData) {
      page.setProgressBar('busy')

      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest()

        // 'load' is the XMLHttpRequest 'finished' event
        request.addEventListener(
            'load',
            function () {
              if (request.status === 200) {
                // load metadata into the panel here before resolving promise
                // Populate javascript object behind form

                page.hideInfoModal()
                page.setProgressBar('okay')
                var jsonData = page.parseJSONStr(request.responseText)
                $('#doi_number').val(jsonData.resource.identifier['$'])
                var doiSuffix = jsonData.resource.identifier['$'].split('/')[1]

                doiDoc.populateDoc(jsonData)
                // Load metadata into the panel here before resolving promise
                populateForm()
                resolve(doiSuffix)
              } else {
                reject(request)
              }
            },
            false
        )
        request.overrideMimeType('application/json')
        request.withCredentials = true
        request.open('POST', serviceURL)
        request.setRequestHeader('Accept', 'application/json')
        request.send(doiData)
      })
    }

    //  Mint
    function handleDoiMint(event) {
      event.preventDefault()
      ajaxCallStatus = 'minting'
      var multiPartData = gatherFormData()

      // Display message and set URL addition depending on whether
      // this is a CREATE or UPDATE function
      var urlAddition = ''
      var modalMessage = ''
      if (typeof event.newMsg !== 'undefined') {
        modalMessage = event.newMsg
      } else {
        modalMessage = 'Publishing DOI '
      }
      var doiSuffix = doiDoc.getDOISuffix()

      urlAddition = '/' + doiSuffix  + '/mint'
      modalMessage +=  doiSuffix + '...'
      page.setInfoModal('Please wait ', modalMessage, false, false)
      setFormDisplayState('display')

      page.setAjaxCount(2)

      Promise.resolve(page.prepareCall())
        .then(function(serviceURL) {

          Promise.resolve(postDoiMetadata(serviceURL + urlAddition, multiPartData))
            .then(function(doiSuffix) {
              getDoiStatus(serviceURL, doiSuffix). then (function() {
                // start polling
                pollDoiStatus(serviceURL, doiSuffix, 1000, 100)
                    .then(function(status) {
                        if (status === page.serviceState.DATA_LOCKED) {
                          // Submit second mint request to complete registration
                          event.newMsg = 'Registering DOI with DataCite: '
                          handleDoiMint(event)
                        } else {
                          // Otherwise return to the page with current status
                          // close all remaining modals
                          page.hideInfoModal(true)
                        }
                    })
                    .catch(function(message) {
                  page.handleAjaxError(message)
                })
                .catch(function(message) {
                  page.handleAjaxError(message)
                })
              })
              .catch(function(message) {
                page.handleAjaxError(message)
            })
          })
          .catch(function(message) {
            page.handleAjaxError(message)
          })
        })
        .catch(function(message) {
          page.handleAjaxError(message)
        })
    }


    // ---------------- GET ----------------
    function handleDOIGet(doiNumber) {
      page.clearAjaxAlert()
      page.setProgressBar('busy')
      page.setInfoModal('Please wait ', 'Fetching DOI ' + doiNumber + '...', false, true)

      page.setAjaxCount(2)

      Promise.resolve(page.prepareCall())
        .then(function(serviceCapabilityURL) {
          getDoi(serviceCapabilityURL, doiNumber)
              .catch(function(message) {
                page.handleAjaxError(message)
              })
          getDoiStatus(serviceCapabilityURL, doiNumber)
              .catch(function(message) {
                page.handleAjaxError(message)
              })
        })
        .catch(function(message) {
          page.handleAjaxError(message)
        })
    }

    function getDoi(serviceURL, doiNumber) {
      return new Promise(function (resolve, reject) {
        var getUrl = serviceURL + '/' + doiNumber
        var request = new XMLHttpRequest()

        // 'load' is the XMLHttpRequest 'finished' event
        request.addEventListener(
            'load',
            function () {
              if (request.status === 200) {
                // Populate javascript object behind form
                doiDoc.populateDoc(page.parseJSONStr(request.responseText))
                // Load metadata into the panel here before resolving promise
                populateForm()
                page.hideInfoModal()
                resolve(request)
              } else {
                reject(request)
              }
            },
            false
        )
        request.overrideMimeType('application/json')
        request.withCredentials = true
        request.open('GET', getUrl)
        request.setRequestHeader('Accept', 'application/json')
        request.send(null)
      })
    }

    // GET
    function getDoiStatus(serviceURL, doiName) {
      page.setProgressBar('busy')

      return new Promise(function (resolve, reject) {
        var statusUrl = serviceURL + '/' + doiName + '/status'
        var request = new XMLHttpRequest()

        // 'load' is the XMLHttpRequest 'finished' event
        request.addEventListener(
            'load',
            function () {
              if (request.status === 200) {
                // load metadata into the panel here before resolving promise
                // Populate javascript object behind form
                page.setProgressBar('okay')
                var jsonData = page.parseJSONStr(request.responseText)
                loadMetadata(jsonData)
                curServiceState = jsonData.doistatus.status['$']
                setPageState(curServiceState)
                page.hideInfoModal()
                resolve(request)
              } else {
                reject(request)
              }
            },
            false
        )
        request.overrideMimeType('application/json')
        request.withCredentials = true
        request.open('GET', statusUrl)
        request.setRequestHeader('Accept', 'application/json')
        request.send(null)
      })
    }

    // ---------------- DELETE ----------------
    function handleDOIDelete() {
      // Get doi number from form...
      var doiNumber = $('#doi_number')
        .val()
        .split('/')[1]
      page.clearAjaxAlert()
      page.setProgressBar('busy')
      page.setInfoModal('Please wait ', 'Processing request...', false, true)
      page.setAjaxCount(1)

      Promise.resolve(page.prepareCall())
          .then(function(serviceURL) {
            deleteDoi(serviceURL, doiNumber)
              .catch(function(message) {
                page.handleAjaxError(message)
              })
          })
          .catch(function(message) {
            page.handleAjaxError(message)
          })

      return false
    }

    function deleteDoi(serviceURL, doiNumber) {
      return new Promise(function (resolve, reject) {
        var deleteUrl = serviceURL + '/' + doiNumber
        var request = new XMLHttpRequest()

        // 'load' is the XMLHttpRequest 'finished' event
        request.addEventListener(
            'load',
            function () {
              if (request.status === 200) {
                page.hideInfoModal()
                page.setProgressBar('okay')
                handleNewDoiClick()
                page.setAjaxSuccess('DOI Deleted')
                resolve(request)
              } else {
                reject(request)
              }
            },
            false
        )
        request.withCredentials = true
        request.open('DELETE', deleteUrl)
        request.send(null)
      })
    }


    function loadMetadata(statusData) {
      // Performed after a successful GET for status
      var dataDir = page.mkDataDirLink(statusData.doistatus.dataDirectory['$'])
      // Once the Mint function is completed, landing page will also be displayed
      $('#doi_related').removeClass('hidden')
      $('#doi_status').html(page.setStatusText(statusData.doistatus.status['$']))
      $('#doi_data_dir').html(dataDir)
      $('#doi_landing_page').html(page.mkLandingPageLink(statusData.doistatus.identifier['$'].split('/')[1]))

      // This happens to be an input element in the form, so 'val' is preferred
      if (typeof statusData.doistatus.journalRef === 'undefined') {
        $('#doi_journal_ref').val('not available')
        $('.doi-journal-ref').html('<i>not available</i>')
        doiInfo.journalRef = ''
      } else {
        $('#doi_journal_ref').val(statusData.doistatus.journalRef['$'])
        $('.doi-journal-ref').html(statusData.doistatus.journalRef['$'])
        doiInfo.journalRef = statusData.doistatus.journalRef['$']
      }
    }

    function populateForm() {
      var authorList = doiDoc.getAuthorList()

      // First author is assumed to be the first one sent back
      $('#doi_author').val(authorList[0])
      $('.doi-author').html(authorList[0])

      // Build additional author list
      var addtlAuthorString = ''
      // Additional authors may be present in the doiDoc
      $('#doi_additional_authors').empty()
      for (var i=1; i<authorList.length; i++) {
        addAuthorStanza(authorList[i])
        addtlAuthorString += authorList[i] + '; '
      }

      addtlAuthorString = addtlAuthorString.slice(0, -2)
      $('#doi_additional_authors_display').text(addtlAuthorString)
      $('#doi_title').val(doiDoc.getTitle())
      $('.doi-title').html(doiDoc.getTitle())

      var doiNum = doiDoc.getDOINumber()
      $('#doi_number').val(doiNum)
      $('.doi-number').html(doiNum)

      if (doiDoc.getLanguage() !== '') {
        var languageEl = $('input:radio[name=doiLanguage][value=' + doiDoc.getLanguage() + ']').click()
      }

      if (_initialLoad === true) {
        _initialLoad = false
      }
    }


    function pollDoiStatus(serviceUrl, doiNumber, timeout, interval) {
      // Set a reasonable timeout
      var endTime = Number(new Date()) + (timeout || 2000)
      interval = interval || 100

      var checkCondition = function(resolve, reject) {
          getDoiStatus(serviceUrl, doiNumber)
          .then( function(response){
            // If the condition is met, we're done!
            var jsonData = page.parseJSONStr(response.responseText)
            var curStatus = jsonData.doistatus.status["$"]
            if(curStatus == page.serviceState.DATA_LOCKED ||
                curStatus === page.serviceState.MINTED) {
              resolve(curStatus)
            }
            else if (Number(new Date()) < endTime) {
              // If neither of the conditions are met and the timeout
              // hasn't elapsed, go again
              setTimeout(checkCondition, interval, resolve, reject)
            }
            // Didn't match and too much time, reject!
            else {
              reject(new Error('timed out for ' + fn + ': ' + arguments))
            }
          })
          .catch(function(message) {
            page.handleAjaxError(message)
          })
      }

      return new Promise(checkCondition)
    }

    $.extend(this, {
      init: init
    })
  }

})(jQuery)
