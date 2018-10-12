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
    var doiTable;
    var doiTableSource =[];

    var rowTemplate = {
      "doi_name" : "",
      "status" : "",
      "title" : "",
      "data_dir": "",
      "action": ""
    }

    var page = new cadc.web.citation.CitationPage(inputs)

    // ------------ Page load functions ------------

    function initializeDoiTable() {

      // should be able to have the doi list function in this table
      // may want a refresh button however, to re-load the table if the page is stale?

      doiTable = $("#doi_table").DataTable({
        data: doiTableSource,
        columns: [
          {"data" : "doi_name"},
          {"data" : "status"},
          {"data" : "title"},
          {"data" : "data_dir"},
          {"data" : "action"}
        ],
        columnDefs: [
          { "width": 20, "targets": 0 },
          { "width": 75, "targets": 1 },
          { "width": 20, "targets": 4 }
        ],
        ordering: false,
        paging: false,
        searching: true
      });

      // Do the initial ajax call to get the DOI list
      loadDoiList();
    }

    function attachListeners() {
      $('.doi_refresh').click(loadDoiList)
      $('#doi_request').click(handleDOIRequest)

      subscribe(cadc.web.citation.events.onDoiListLoaded, function(e, data) {
        setTableContent(data.doiList)
      })

      subscribe(cadc.web.citation.events.onDoiDeleted, function(e, data) {
        //       TODO: ideally removeRow would be called but there's a bug in it
        //removeRow(data.doiSuffix)
        loadDoiList()
      })

      // From delete modal
      $('#delete_ok').click(function () {
        loadDoiList($('#doi_delete_num').text());
        // Leave panel up until ajax call returns
        false;
      });
    }

    function setNotAuthenticated(errorMsg) {
      // modal is in _application_header.shtml, code found in canfar-root repository (ROOT.war)
      $("#auth_modal").modal('show');
      $(".doi-not-authenticated").removeClass('hidden')
      $(".doi-authenticated").addClass('hidden')

      $('.doi-not-authenticated').click(function() {
        $("#auth_modal").modal('show')}
      )
    }

    function setAuthenticated() {
      $(".doi_authenticated").removeClass('hidden')
      $(".doi-not-authenticated").addClass('hidden')
      initializeDoiTable()
      attachListeners()
    }

    // ------------ Page state management functions ------------

    function subscribe(event, eHandler) {
      $(_selfCitationController).on(event.type, eHandler)
    }

    function unsubscribe(event) {
      $(_selfCitationController).unbind(event.type)
    }

    function trigger(event, eventData) {
      $(_selfCitationController).trigger(event, eventData)
    }

    function setTableContent(jsonData) {
      // payload from ajax call to /doi/instances is an array of
      // of status objects the calling user has permission to view
      var doiStatusList = jsonData.doiStatuses['$'];

      // Table load
      if (doiStatusList.length == 0) {
        setTableStatus("No data found")
      }
      else {
        for (var j = doiStatusList.length - 1; j >= 0; j--) {
          var doiEntry = doiStatusList[j]
          displayDoiStatus(doiEntry.doistatus)
        }
      }

      page.setProgressBar('okay')
      page.hideInfoModal()

      // attach listeners to delete icons.
      $('.doi_delete').click(confirmDOIDelete)
    }

    function setTableStatus(displayText) {
      $(".dataTables_empty").html(displayText)
    }

    function setDeleteModal(doiName) {
      $('#delete_modal').modal('show');
      $('#doi_delete_num').html(doiName);
    };


    // ------------ HTTP/Ajax functions ------------

    function confirmDOIDelete(event) {
      var doiSuffix = event.currentTarget.dataset.doinum
      setDeleteModal(doiSuffix);
    }

    // DELETE
    function handleDOIDelete(doiSuffix) {
      page.clearAjaxAlert()
      page.setProgressBar('busy')
      page.setInfoModal("Pease wait ", "Processing request... (may take up to 10 seconds)", true)

      page.prepareCall().then(function(serviceURL) {
        var getUrl = serviceURL + '/' + doiSuffix
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: 'DELETE'
        })
          .success(function(data) {
            page.hideInfoModal()
            trigger(cadc.web.citation.events.onDoiDeleted, {
              doiSuffix: doiSuffix,
            })
            page.setProgressBar('okay')
            page.setAjaxSuccess('DOI ' + doiSuffix + ' Deleted')
          })
          .fail(function(message) {
            page.hideInfoModal()
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
      setTableStatus("Loading...")
      page.setInfoModal("Pease wait ", "Processing request... (may take up to 10 seconds)", true)

      page.prepareCall().then(function(serviceURL) {
        $.ajax({
          xhrFields: { withCredentials: true },
          url: serviceURL,
          method: 'GET',
          dataType: 'json',
          contentType: 'application/json'
        })
        .success(function(stringdata) {
          setTableStatus("Loading......")
          trigger(cadc.web.citation.events.onDoiListLoaded, {
            doiList: stringdata,
          })
        })
        .fail(function(message) {
          page.hideInfoModal()
          setTableStatus("No data")
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
      newStatus.status = doi.status['$']
      newStatus.data_dir = mkDataDirLink(doi.dataDirectory['$'])
      newStatus.title = mkTitleLink(doi.title['$'], doiName)
      newStatus.action = mkDeleteLink(doiName)

      addRow(newStatus);
    }

    // New DOI button click handler
    function handleDOIRequest(event) {
      var win = window.open('/citation/request', '_blank');
      if (win) {
        //Browser has allowed it to be opened
        win.focus();
      } else {
        //Browser has blocked it
        alert('Please allow popups for this website');
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
        if($(a).children().eq(0).text() == rowNum){
          doiTable.rows(a).remove();
        }
      } );

      // TODO: bug here - last row of table is duplicated for
      // total number of remaining rows on draw() ??
      doiTable.rows().invalidate();
      doiTable.draw();

    }

    // ------------ Display/rendering functions ------------

    function parseDoiSuffix(doiName) {
      var doiSuffix = "";
      if (doiName.match("/")) {
        doiSuffix = doiName.split("/")[1];
      }
      else {
        doiSuffix = doiName;
      }
      return doiSuffix;
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

    function mkDataDirLink(dataDir) {
      return'<a href="/storage/list' +
              dataDir +
              '" target="_blank">/storage/list' +
              dataDir +
              '</a>'
    }

    function mkDeleteLink(doiName) {
      var doiSuffix = parseDoiSuffix(doiName)
      return '<span class="doi_delete glyphicon glyphicon-remove" data-doiNum = ' + doiSuffix + '></span>'
    }

    $.extend(this, {
      setNotAuthenticated: setNotAuthenticated,
      setAuthenticated: setAuthenticated,
      handleDOIDelete: handleDOIDelete,
      handleDOIRequest: handleDOIRequest
    })
  }

})(jQuery)
