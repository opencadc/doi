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

    function init() {
      // Listen for the (CitationPage) onAuthenticated call
      attachListeners()
      page.setAjaxCount(2)
      parseUrl()
    }

   function parseUrl() {
      var query = window.location.search

      if (query !== '') {
        var doiSuffix = query.split('=')[1]

        page.setInfoModal('Please wait ', 'Fetching Landing page for DOI ' + doiSuffix + '...', false, true)

        Promise.resolve(page.prepareCall())
            .then(function(serviceCapabilityURL) {
              getDoi(serviceCapabilityURL, doiSuffix).catch(function(message) {
                page.handleAjaxError(message)
              })
              getDoiStatus(serviceCapabilityURL, doiSuffix).catch(function(message) {
                page.handleAjaxError(message)
              })
            })
            .catch(function(message) {
              page.handleAjaxError(message)
            })

      } else {
        page.setInfoModal('Not Found', 'Landing page for DOI \' + doiSuffix + \'...\'not found.', true, false)
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

    // ------------ HTTP/Ajax functions ------------

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
                doiDoc.populateDoc(JSON.parse(request.responseText))
                // Load metadata into the panel here before resolving promise
                displayMetadata()
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
        var statusUrl = serviceURL + '/' + doiName + '/status/public'
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
      $('#doi_creator_list').text(doiDoc.getAuthorListString(true))
      $('#doi_title').text(doiDoc.getTitle())
      var doiNumStr = doiDoc.getRelatedDOI()

      var publicationDoiHtml = ''
      if (doiNumStr === 'not available yet') {
        publicationDoiHtml = '<i>' + doiNumStr +'</i>'
      } else {
        var hrefStr = 'https://doi.org/' + doiNumStr
        publicationDoiHtml = '<a href="' + hrefStr + '" target="_blank">' + doiNumStr + '</a>'
      }

      $('#publication_doi').html(publicationDoiHtml)
    }

    $.extend(this, {
      init: init,
      attachListeners: attachListeners
    })

  }

})(jQuery)
