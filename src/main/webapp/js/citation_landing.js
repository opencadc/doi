;(function($) {
   //register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        citation: {
          CitationLanding: CitationLanding
        }
      }
    }
  })

  function CitationLanding(inputs) {
    var doiDoc = new cadc.web.citation.DOIDocument()
    var page = new cadc.web.citation.CitationPage(inputs)
    var _ajaxCallCount = 2

    function init() {
      // Listen for the (CitationPage) onAuthenticated call
      attachListeners()
      // landing page is anonymous...
      //page.checkAuthentication()
      parseUrl()
    }

   function parseUrl() {
      var query = window.location.search

      if (query !== '') {
        var doiSuffix = query.split('=')[1]
        // Kick off 2 parallel ajax calls.
        // Doesn't matter which one comes back frist
        //handleDOIGet(doiSuffix)
        //getDoiStatus(doiSuffix)
        Promise.resolve(page.prepareCall())
            .then(serviceURL =>  Promise.race([getDoi(serviceURL, doiSuffix), getDoiStatus(serviceURL, doiSuffix)]))
            .catch(message => page.setAjaxFail(message))


      } else {
        page.setInfoModal('Not Found', 'Landing page not found.', false)
      }
    }

   function attachListeners() {
      // This is to listen from the onAuthenticated event from the page object
      // Just happens that the page object also has the subscribe & trigger functions
      // Would be better if this javascript extended the citation_page stuff, then there'd
      // not be references to 'page' everywhere...
     page.subscribe(page, cadc.web.citation.events.onAuthenticated, function (e, data) {
        parseUrl()
      })
    }

    function handleAjaxError(request) {
      hideInfoModal()
      page.setProgressBar('error')
      page.setAjaxFail(page.getRcDisplayText(request))
    }


    // ------------ HTTP/Ajax functions ------------

    //GET DOI Metadata
    //function handleDOIGet(doiNumber) {
    //  page.clearAjaxAlert()
    //  page.setInfoModal('Please wait ', 'Processing request...', true)
    //
    //  // Submit doc using ajax
    //  page.prepareCall().then(function(serviceURL) {
    //    var getUrl = serviceURL + '/' + doiNumber
    //    $.ajax({
    //      xhrFields: { withCredentials: true },
    //      url: getUrl,
    //      method: 'GET',
    //      dataType: 'json',
    //      contentType: 'application/json'
    //    })
    //    .success(function(data) {
    //      hideInfoModal()
    //      doiDoc.populateDoc(data)
    //      displayMetadata()
    //    })
    //    .fail(function(message) {
    //      page.setAjaxFail(message)
    //    })
    //  })
    //
    //  return false
    //}

    function getDoi(serviceURL, doiNumber) {
      return new Promise(function (resolve, reject) {
        var getUrl = serviceURL + '/' + doiNumber
        var request = new XMLHttpRequest()

        // 'load' is the XMLHttpRequest 'finished' event
        request.addEventListener(
            'load',
            function () {
              if (request.status == '200') {
                // Populate javascript object behind form
                doiDoc.populateDoc(JSON.parse(request.responseText))
                // Load metadata into the panel here before resolving promise
                displayMetadata()
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

    //
    //// GET Status
    //function getDoiStatus(doiName) {
    //  page.prepareCall().then(function(serviceURL) {
    //    var statusUrl = serviceURL + '/' + doiName + '/status/public'
    //    $.ajax({
    //      xhrFields: { withCredentials: true },
    //      url: statusUrl,
    //      method: 'GET',
    //      dataType: 'json',
    //      contentType: 'application/json'
    //    })
    //    .success(function(data) {
    //      hideInfoModal()
    //      displayDoiStatus(data)
    //    })
    //    .fail(function(message) {
    //      page.setAjaxFail(message)
    //    })
    //  })
    //  return false
    //}


    // GET
    function getDoiStatus(serviceURL, doiName) {
      page.setProgressBar('busy')

      return new Promise(function (resolve, reject) {
        var statusUrl = serviceURL + '/' + doiName + '/status/public'
        var request = new XMLHttpRequest()

        // 'load' is the XMLHttpRequest 'finished' event
        request.addEventListener(
            'load',
            function () {
              if (request.status == '200') {
                // load metadata into the panel here before resolving promise
                // Populate javascript object behind form
                hideInfoModal()
                page.setProgressBar('okay')
                var jsonData = JSON.parse(request.responseText)
                displayDoiStatus(jsonData)
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


    function displayDoiStatus(statusData) {
      // Performed after a successful GET for status
      var doiName = statusData.doistatus.identifier['$']
      var dataDir = page.mkDataDirLink(statusData.doistatus.dataDirectory['$'])

      $('#doi_number').html(doiName)
      $('#doi_status').html(page.setStatusText(statusData.doistatus.status['$']))
      $('#doi_data_dir').html(dataDir)
      if (statusData.doistatus.journalRef['$'] !== '') {
        $('#doi_journal_ref').html(statusData.doistatus.journalRef['$'])
        $('.doi-journal-ref').removeClass('hidden')
      } else {
        $('.doi-journal-ref').addClass('hidden')
      }

    }

    function displayMetadata() {
      $('#doi_creator_list').text(doiDoc.getAuthorListString())
      $('#doi_title').text(doiDoc.getTitle())
      $('#publication_doi').html(doiDoc.getRelatedDOI())
    }

    function hideInfoModal() {
      _ajaxCallCount--
      if (_ajaxCallCount == 0) {
        $('#info_modal').modal('hide')
        $('body').removeClass('modal-open')
        $('.modal-backdrop').remove()
      }
    }

    $.extend(this, {
      init: init,
      attachListeners: attachListeners
    })

  }

})(jQuery)
