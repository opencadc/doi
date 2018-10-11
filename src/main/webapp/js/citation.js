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

    var _selfGroupManager = this
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
          { width: 20, targets: 0 },
          { width: 50, targets: 1 },
          { width: 20, targets: 4 }
        ],
        order: [],
        paging: true,
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
    }

    function setNotAuthenticated(errorMsg) {
      $('.info-span').html(errorMsg)
      $('.doi-anonymous').removeClass('hidden')
      $('.doi-authenticated').addClass('hidden')
    }

    function setAuthenticated() {
      $('.doi-authenticated').removeClass('hidden')
      $('.doi-anonymous').addClass('hidden')

      initializeDoiTable()
      attachListeners()
    }

    // ------------ Page state management functions ------------


    function subscribe(event, eHandler) {
      $(_selfGroupManager).on(event.type, eHandler)
    }

    function unsubscribe(event) {
      $(_selfGroupManager).unbind(event.type)
    }

    function trigger(event, eventData) {
      $(_selfGroupManager).trigger(event, eventData)
    }

    function setTableContent(jsonData) {
      // payload from ajax call to /doi/instances is an array of
      // of status objects the calling user has permission to view
      var doiStatusList = jsonData.doiStatuses['$'];

      // Table load
      for (var j=doiStatusList.length-1; j>=0; j--) {
        var doiEntry = doiStatusList[j]
        displayDoiStatus(doiEntry.doistatus)
      }
      page.setProgressBar('okay')

      // attach listeners to delete icons.
      $('.doi_delete').click(handleDOIDelete)
    }

    function setTableStatus(displayText) {
      $(".dataTables_empty").html(displayText)
    }

    function setTableState(mode) {
      // TODO: something in here that will show that the table is still loading information
    }


    // ------------ HTTP/Ajax functions ------------

    // DELETE
    function handleDOIDelete(event) {
      var doiSuffix = event.currentTarget.dataset.doinum
      page.clearAjaxAlert()
      page.setProgressBar('busy')

      page.prepareCall().then(function(serviceURL) {
        var getUrl = serviceURL + '/' + doiSuffix
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: 'DELETE'
        })
          .success(function(data) {
            trigger(cadc.web.citation.events.onDoiDeleted, {
              doiSuffix: doiSuffix,
            })
            page.setProgressBar('okay')
            page.setAjaxSuccess('DOI ' + doiSuffix + ' Deleted')
          })
          .fail(function(message) {
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

    function updateRow(rowNum, data) {
      doiTableSource[rowNum].doi_name =  data.doi_name
      doiTableSource[rowNum].status =  data.status
      doiTableSource[rowNum].title =  data.title
      doiTableSource[rowNum].data_dir =  data.data_dir
      refreshRow(rowNum)
    }

    function addRow(newRowData) {
      // Add and redraw
      doiTable
          .row
          .add(newRowData)
          .draw()
    }

    function refreshRow(rowNum) {
      // Invalidate and redraw
      doiTable
          .row( rowNum )
          .invalidate()
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

    //function getRowNum(doi_name) {
    //  for (i=0; i<doiTableSource.length; i++) {
    //    if (doiTableSource[i].doi_name === doi_name) {
    //      return i;
    //    }
    //  }
    //
    //  // not found
    //  return -1;
    //}


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
