;(function($) {
  // register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        citation: {
          Citation: Citation,
          // Events
          events: {
            onDoiListLoaded: new jQuery.Event('doi:onDoiListLoaded')
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
    //    {
    //  "doi_name" : "10.11570/----",
    //  "status" : "-",
    //  "title" : "-",
    //  "data_dir": "-",
    //  "action": ""
    //},
    //{
    //  "doi_name" : "10.11570/abcd",
    //  "status" : "-",
    //  "title" : "-",
    //  "data_dir": "-",
    //  "action": ""
    //}];
    //
    //var newRow = {
    //  "doi_name" : "10.11570/newRow",
    //  "status" : "-",
    //  "title" : "-",
    //  "data_dir": "-",
    //  "action": ""
    //}
    //
    var rowTemplate = {
      "doi_name" : "",
      "status" : "",
      "title" : "",
      "data_dir": "",
      "action": ""
    }

    var page = new cadc.web.citation.CitationPage(inputs)

    //var resourceCapabilitiesEndPoint =
    //  inputs && inputs.hasOwnProperty('resourceCapabilitiesEndPoint')
    //    ? inputs.resourceCapabilitiesEndPoint
    //    : 'http://apps.canfar.net/reg/resource-caps'
    //
    //// NOTE: for deployment to production, this constructor should have no parameters.
    //// for DEV, use the URL of the dev VM the doi and vospace services are deployed on.
    ////var _registryClient = new Registy();
    //var _registryClient = new Registry({
    //  resourceCapabilitiesEndPoint: resourceCapabilitiesEndPoint
    //})

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
          { orderable: false, targets: [-1] }
        ],
        order: [],
        paging: true,
        searching: false
      });

      // Do the initial ajax call to get the DOI list
      loadDoiList();
    }



    function attachListeners() {
      $('.doi_delete').click(handleDOIDelete)
      //$('.doi_request').click(handleDOIRequest)

      subscribe(cadc.web.citation.events.onDoiListLoaded, function(e, data) {
        setTableContent(data.doiList)
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

    function setTableContent(stringdata) {
      var doiSuffixes = stringdata.split("\n");
      // Initial table load
      for (var j=doiSuffixes.length-1; j>=0; j--) {
        var tmpRow = {
          "doi_name" : mkNameLink(doiSuffixes[j]),
          "status" : "-",
          "title" : "-",
          "data_dir": "-",
          "action": ""
        }
        addRow(tmpRow);
        getDoiStatus(doiSuffixes[j])
      }
      page.setProgressBar('okay')
    }



    function setTableState(mode) {
      // TODO: something in here that will show that the table is still loading information

    }


    // ------------ HTTP/Ajax functions ------------

    // DELETE
    function handleDOIDelete() {
      // Get doi number from link...
      var doiNumber = $('#doi_num')  // for the row
        .val()
        .split('/')[1]
      clearAjaxAlert()
      setProgressBar('busy')

      page.prepareCall().then(function(serviceURL) {
        var getUrl = serviceURL + '/' + doiNumber
        $.ajax({
          xhrFields: { withCredentials: true },
          url: getUrl,
          method: 'DELETE',
          dataType: 'json',
          contentType: 'application/json'
        })
          .success(function(data) {
            setProgressBar('okay')
            handleFormReset()
            setAjaxSuccess('DOI Deleted')
          })
          .fail(function(message) {
            setProgressBar('error')
            setAjaxFail(message)
          })
      })
      return false
    }


    function loadDoiList() {
      page.prepareCall().then(function(serviceURL) {
        $.ajax({
          xhrFields: { withCredentials: true },
          url: serviceURL,
          method: 'GET'
        })
        .success(function(stringdata) {
          page.setProgressBar('busy')
          //setTableProgress('busy')

          trigger(cadc.web.citation.events.onDoiListLoaded, {
            doiList: stringdata,
          })
          //var doiSuffixes = stringdata.split("\n");
          //// Initial table load
          //for (var j=doiSuffixes.length-1; j>=0; j--) {
          //  var tmpRow = {
          //    "doi_name" : mkNameLink(doiSuffixes[j]),
          //    "status" : "-",
          //    "title" : "-",
          //    "data_dir": "-",
          //    "action": ""
          //  }
          //  addRow(tmpRow);
          //  getDoiStatus(doiSuffixes[j])
          //}
          //page.setProgressBar('okay')

        })
        .fail(function(message) {
          page.setProgressBar('error')
          page.setAjaxFail(message)
        })
      })
      return false
    }



    // TODO: how to track when doi list is finished?
    function getDoiStatus(doiName) {
      page.prepareCall().then(function(serviceURL) {
        var statusUrl = serviceURL + '/' + doiName + "/status"
        $.ajax({
          xhrFields: { withCredentials: true },
          url: statusUrl,
          method: 'GET',
          contentType: 'text/xml'
        })
            .success(function(data) {
              page.setProgressBar('okay')
              displayDoiStatus(data)
            })
            .fail(function(message) {
              // skip this one
              // remove this entry from the table data source
              //page.setProgressBar('error')
              //setTableProgress('okay')
              //page.setAjaxFail(message)
            })
      })
      return false
    }

    function displayDoiStatus(data) {
      var newStatus = rowTemplate
      var doiName = data.getElementsByTagName("identifier")[0].textContent.split("/")[1]
      newStatus.doi_name = mkNameLink(doiName)
      newStatus.status = data.getElementsByTagName("status")[0].textContent
      newStatus.data_dir = data.getElementsByTagName("dataDirectory")[0].textContent
      newStatus.title = data.getElementsByTagName("title")[0].textContent

      updateRow(getRowNum(newStatus.doi_name), newStatus);
    }

    // ------------ Table update functions ------------


    function updateRow(rowNum, data) {

      // TODO: these will be updated with the HTML-generating link functions below...
      doiTableSource[rowNum].doi_name =  data.doi_name
      doiTableSource[rowNum].status =  data.status
      doiTableSource[rowNum].title =  data.title
      doiTableSource[rowNum].data_dir =  data.data_dir
      refreshRow(rowNum)
    }

    function addRow(newRowData) {
      // Invalidate and redraw
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

    function getRowNum(doi_name) {
      for (i=0; i<doiTableSource.length; i++) {
        if (doiTableSource[i].doi_name === doi_name) {
          return i;
        }
      }

      // not found
      return -1;
    }

    function mkNameLink(doiName) {
      return '<a href="/citation/request?doi=' +
      doiName +
      '" target="_blank">' +
      doiName +
      '</a>'
    }

    function mkTitleLink(title) {

    }

    function mkDataDirLink(dataDir) {

    }



    $.extend(this, {
      setNotAuthenticated: setNotAuthenticated,
      setAuthenticated: setAuthenticated,
      handleDOIDelete: handleDOIDelete,
      getDoiStatus: getDoiStatus
    })
  }

})(jQuery)
