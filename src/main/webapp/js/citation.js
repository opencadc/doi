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
      'landing_page' : '',
      'action' : ''
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
          {'data' : 'landing_page'},
          {'data' : 'action'}
        ],
        columnDefs: [
          { 'width': 20, 'targets': 0 },
          { 'width': 100, 'targets': 1 },
          { 'width': 200, 'targets': 5 }
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

      page.subscribe(_selfCitationController, cadc.web.citation.events.onDoiDeleted, function(e, data) {
        loadDoiList()
      })

      page.subscribe(page, cadc.web.citation.events.onAuthenticated, function (e, data) {
        initializeDoiTable()
      })

      // From delete modal
      $('#delete_ok').click(function () {
        $('#delete_modal').modal('hide')
        $('body').removeClass('modal-open')
        $('.modal-backdrop').remove()
        handleDOIDelete($('#doi_delete_num').text())
      })

      // From mint modal
      $('#mint_ok').click(function () {
        $('#mint_modal').modal('hide')
        $('body').removeClass('modal-open')
        $('.modal-backdrop').remove()
        handleDOIMint($('#doi_delete_num').text())
      })
    }

    function setNotAuthenticated(errorMsg) {
      // modal is in _application_header.shtml, code found in canfar-root repository (ROOT.war)
      $('#auth_modal').modal('show')
      $('.doi-not-authenticated').removeClass('hidden')
      $('.doi-authenticated').addClass('hidden')

      $('.doi-not-authenticated').click(function() {
        $('#auth_modal').modal('show')}
      )
    }

    function setAuthenticated() {
      $('.doi_authenticated').removeClass('hidden')
      $('.doi-not-authenticated').addClass('hidden')
      initializeDoiTable()
      attachListeners()
    }

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

      // attach listeners to action icons.
      $('.doi-delete').click(confirmDOIDelete)
      $('.doi-mint').click(loadRequestPage)
    }

    function setTableStatus(displayText) {
      $('.dataTables_empty').html(displayText)
    }

    function setDeleteModal(doiName) {
      $('#doi_delete_num').html(doiName)
      $('#delete_modal').modal('show')
    }

    function setMintModal(doiName) {
      $('#doi_mint_num').html(doiName)
      $('#mint_modal').modal('show')
    }

    function hideInfoModal() {
      $('#info_modal').modal('hide')
      $('body').removeClass('modal-open')
      $('.modal-backdrop').remove()
    }

    // ------------ HTTP/Ajax functions ------------

    function confirmDOIDelete(event) {
      var doiSuffix = event.currentTarget.dataset.doinum
      setDeleteModal(doiSuffix)
    }

    function loadRequestPage(event) {
      var doiSuffix = event.currentTarget.dataset.doinum
      window.open('/citation/request?doi=' + doiSuffix, '_blank');
    }

    // DELETE
    function handleDOIDelete(doiSuffix) {
      page.clearAjaxAlert()
      page.setProgressBar('busy')
      page.setInfoModal('Please wait ', 'Deleting DOI ' + doiSuffix, false, true)

      page.prepareCall().then(function(serviceURL) {
        var getUrl = serviceURL + '/' + doiSuffix
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: 'DELETE'
        })
          .success(function(data) {
            //hideInfoModal()
            page.setProgressBar('okay')
            page.trigger(_selfCitationController, cadc.web.citation.events.onDoiDeleted, {
              doiSuffix: doiSuffix,
            })
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
      newStatus.action = mkActionLinks(doiName, doi.status['$'])

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

    function removeRow(rowNum) {
      doiTable.rows().nodes().each(function(a,b) {
        if($(a).children().eq(0).text() === rowNum){
          doiTable.rows(a).remove()
        }
      } )

      // TODO: bug here - last row of table is duplicated for
      // total number of remaining rows on draw() ??
      doiTable.rows().invalidate()
      doiTable.draw()

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

    function mkActionLinks(doiName, status) {
      var actionLinkString
      if (status !== page.serviceState.MINTED) {
        switch(status) {
          case page.serviceState.INPROGRESS:
            actionLinkString = mkMintButton(doiName, 'Mint') + mkDeleteButton(doiName, false)
            break
          case page.serviceState.DATA_LOCKED:
            actionLinkString = mkMintButton(doiName, 'Continue Mint')
            break
          case page.serviceState.ERROR_LOCKING_DATA:
            actionLinkString = mkMsg(doiName, 'Contact Admin ')
            break
          default:
            actionLinkString = ''
        }
      } else {
        actionLinkString = ''
      }
      return actionLinkString
    }

    function mkDeleteButton(doiName) {
      var doiSuffix = parseDoiSuffix(doiName)
      //return '<span class="doi-delete glyphicon glyphicon-remove" data-doiNum = ' + doiSuffix + '></span>'
      var btnClass = 'btn btn-danger doi-button doi-listpage-header btn-sm doi-delete'
      return '<button type="delete" class="' + btnClass + '" data-doiNum=' + doiSuffix + '>Delete</button>'
    }

    function mkMintButton(doiName, text) {
      var doiSuffix = parseDoiSuffix(doiName)
      var btnClass = 'btn btn-success doi-button doi-listpage-header btn-sm doi-mint'
      //return '<span class="doi-mint glyphicon glyphicon-lock" data-doiNum = ' + doiSuffix + '></span>'
      return '<button type="mint" class="' + btnClass + '" data-doiNum = ' + doiSuffix + '>' + text + '</button>'
    }

    function mkMsg(doiName, text) {
      var doiSuffix = parseDoiSuffix(doiName)
      var btnClass = 'doi-button doi-listpage-header btn-sm doi-warning'
      //return '<span class="doi-mint glyphicon glyphicon-lock" data-doiNum = ' + doiSuffix + '></span>'
      return '<span class="' + btnClass + '" data-doiNum = ' + doiSuffix + '>' + text + '</span>'
    }

    $.extend(this, {
      init: init
    })
  }

})(jQuery)
