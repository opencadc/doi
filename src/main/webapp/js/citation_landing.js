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
      page.checkAuthentication()
    }

   function parseUrl() {
      var query = window.location.search

      if (query !== '') {
        var doiSuffix = query.split('=')[1]
        // Kick off 2 parallel ajax calls.
        // Doesn't matter which one comes back frist
        handleDOIGet(doiSuffix)
        getDoiStatus(doiSuffix)

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

    // ------------ HTTP/Ajax functions ------------

    //GET DOI Metadata
    function handleDOIGet(doiNumber) {
      page.clearAjaxAlert()
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
          hideInfoModal()
          doiDoc.populateDoc(data)
          displayMetadata()
        })
        .fail(function(message) {
          page.setAjaxFail(message)
        })
      })

      return false
    }

    // GET Status
    function getDoiStatus(doiName) {
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
          displayDoiStatus(data)
        })
        .fail(function(message) {
          page.setAjaxFail(message)
        })
      })
      return false
    }

    function displayDoiStatus(statusData) {
      // Performed after a successful GET for status
      var doiName = statusData.doistatus.identifier['$']
      var dataDir = page.mkDataDirLink(statusData.doistatus.dataDirectory['$'])

      $('#doi_number').html(doiName)
      $('#doi_status').html(statusData.doistatus.status['$'])
      $('#doi_data_dir').html(dataDir)
      $('#doi_journal_ref').html(statusData.doistatus.journalRef['$'])
    }

    function displayMetadata() {
      var authorList = doiDoc.getAuthorList()
      var authorListString = ''
      for (var i=0; i< authorList.length; i++ ){
        authorListString += authorList[i] + ' '
      }
      $('#doi_creator_list').text(authorListString)
      $('#doi_title').text(doiDoc.getTitle())
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
