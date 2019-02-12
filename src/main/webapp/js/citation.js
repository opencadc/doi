;(function($) {
  // register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        citation: {
          Citation: Citation,
          // Events
          events: {
            onDoiListLoaded: new jQuery.Event('doi:onDoiListLoaded'),
            onDoiDeleted: new jQuery.Event('doi:onDoiDeleted')
          }
        }
      }
    }
  })

  /**
   * Controller for Data Citation Management/Listing UI.
   *
   * @constructor
   * @param {{}} inputs   Input configuration.
   * @param {String} [inputs.resourceCapabilitiesEndPoint='http://apps.canfar.net/reg/resource-caps'] URL of the resource capability document.
   */
  function Citation(inputs) {

    var _selfCitationController = this
    var doiTable
    var doiTableSource =[]

    var rowTemplate = {
      'doi_name' : '',
      'status' : '',
      'title' : '',
      'data_dir' : '',
      'landing_page' : ''
    }

    var page = new cadc.web.citation.CitationPage(inputs)

    // ------------ Page load functions ------------

    function init() {
      // Listen for the (CitationPage) onAuthenticated call
      attachListeners()
      page.checkAuthentication()
    }

    function initializeDoiTable() {
      // should be able to have the doi list function in this table
      // may want a refresh button however, to re-load the table if the page is stale?

      doiTable = $("#doi_table").DataTable({
        data: doiTableSource,
        columns: [
          {'data' : 'doi_name'},
          {'data' : 'status'},
          {'data' : 'title'},
          {'data' : 'data_dir'},
          {'data' : 'landing_page'}
        ],
        columnDefs: [
          { 'width': 20, 'targets': 0 },
          { 'width': 100, 'targets': 1 }
        ],
        ordering: false,
        paging: false,
        searching: true
      })

      // Do the initial ajax call to get the DOI list
      loadDoiList()
    }

    function attachListeners() {
      $('.doi_refresh').click(loadDoiList)
      $('#doi_request').click(handleDOIRequest)

      page.subscribe(_selfCitationController, cadc.web.citation.events.onDoiListLoaded, function(e, data) {
        setTableContent(data.doiList)
      })

      page.subscribe(page, cadc.web.citation.events.onAuthenticated, function (e, data) {
        initializeDoiTable()
      })

    }
    //
    //function setNotAuthenticated(errorMsg) {
    //  // modal is in _application_header.shtml, code found in canfar-root repository (ROOT.war)
    //  $('#auth_modal').modal('show')
    //  $('.doi-not-authenticated').removeClass('hidden')
    //  $('.doi-authenticated').addClass('hidden')
    //
    //  $('.doi-not-authenticated').click(function() {
    //    $('#auth_modal').modal('show')}
    //  )
    //}
    //
    //function setAuthenticated() {
    //  $('.doi_authenticated').removeClass('hidden')
    //  $('.doi-not-authenticated').addClass('hidden')
    //  initializeDoiTable()
    //  attachListeners()
    //}

    // ------------ Page state management functions ------------

    function setTableContent(jsonData) {
      // payload from ajax call to /doi/instances is an array of
      // of status objects the calling user has permission to view
      var doiStatusList = jsonData.doiStatuses['$']

      // Table load
      if (doiStatusList.length == 0) {
        setTableStatus('No data found')
      }
      else {
        for (var j = doiStatusList.length - 1; j >= 0; j--) {
          var doiEntry = doiStatusList[j]
          displayDoiStatus(doiEntry.doistatus)
        }
      }

      page.setProgressBar('okay')
      hideInfoModal()

      // attach context help to buttons
      page.loadContextHelp()
    }

    function setTableStatus(displayText) {
      $('.dataTables_empty').html(displayText)
    }

    function hideInfoModal() {
      $('#info_modal').modal('hide')
      $('body').removeClass('modal-open')
      $('.modal-backdrop').remove()
    }


    // ------------ HTTP/Ajax functions ------------


    function loadRequestPage(event) {
      var doiSuffix = event.currentTarget.dataset.doinum
      window.open('/citation/request?doi=' + doiSuffix, '_blank');
    }

    // GET
    function loadDoiList() {
      clearTable()
      page.setProgressBar('busy')
      setTableStatus('Loading...')
      page.setInfoModal('Please wait ', 'Fetching current DOI list... (may take up to 10 seconds)', false, true)

      page.prepareCall().then(function(serviceURL) {
        $.ajax({
          xhrFields: { withCredentials: true },
          url: serviceURL,
          method: 'GET',
          dataType: 'json',
          contentType: 'application/json'
        })
            .success(function(stringdata) {
              setTableStatus('Loading......')
              page.trigger(_selfCitationController, cadc.web.citation.events.onDoiListLoaded, {
                doiList: stringdata,
              })
            })
            .fail(function(message) {
              hideInfoModal()
              setTableStatus('No data')
              page.setProgressBar('error')
              page.setAjaxFail(message)
            })
      })
      return false
    }

    // Used on return from GET
    function displayDoiStatus(doi) {
      // The JSON output from /doi/instances uses Badgerfish,
      // which is why pulling the values out of it probably looks
      // strange here...
      // Assuming this is a 'doistatus' object
      var newStatus = rowTemplate
      var doiName = doi.identifier['$']
      newStatus.doi_name = mkNameLink(doiName)
      newStatus.status = page.setStatusText(doi.status['$'])
      newStatus.data_dir = page.mkDataDirLink(doi.dataDirectory['$'])
      newStatus.landing_page = page.mkLandingPageLink(doi.identifier['$'].split("/")[1])
      newStatus.title = mkTitleLink(doi.title['$'], doiName)

      addRow(newStatus)
    }

    // New DOI button click handler
    function handleDOIRequest(event) {
      var win = window.open('/citation/request', '_blank')
      if (win) {
        //Browser has allowed it to be opened
        win.focus()
      } else {
        //Browser has blocked it
        alert('Please allow popups for this website')
      }
    }


    // ------------ Table update functions ------------
    function clearTable() {
      // Invalidate and redraw
      doiTable
          .clear()
          .draw()
    }

    function addRow(newRowData) {
      // Add and redraw
      doiTable
          .row
          .add(newRowData)
          .draw()
    }

    // ------------ Display/rendering functions ------------

    function parseDoiSuffix(doiName) {
      var doiSuffix = ''
      if (doiName.match('/')) {
        doiSuffix = doiName.split('/')[1]
      }
      else {
        doiSuffix = doiNam
      }
      return doiSuffix
    }

    function mkNameLink(doiName) {
      var doiSuffix = parseDoiSuffix(doiName)
      return '<a href="/citation/request?doi=' +
          doiSuffix +
          '" target="_blank">' +
          doiSuffix +
          '</a>'
    }

    function mkTitleLink(title, doiName) {
      var doiSuffix = parseDoiSuffix(doiName)
      return '<a href="/citation/request?doi=' +
          doiSuffix +
          '" target="_blank">' +
          title +
          '</a>'
    }

    $.extend(this, {
      init: init
    })
  }

})(jQuery)
