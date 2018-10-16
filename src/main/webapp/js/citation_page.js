;(function($) {
  // register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        citation: {
          CitationPage: CitationPage
        }
      }
    }
  })

  /**
   * Common functions for Data Citation Page UI.
   *
   * @constructor
   * @param {{}} inputs   Input configuration.
   * @param {String} [inputs.resourceCapabilitiesEndPoint='http://apps.canfar.net/reg/resource-caps'] URL of the resource capability document.
   */
  function CitationPage(inputs) {

    var resourceCapabilitiesEndPoint =
      inputs && inputs.hasOwnProperty('resourceCapabilitiesEndPoint')
        ? inputs.resourceCapabilitiesEndPoint
        : 'http://apps.canfar.net/reg/resource-caps'

    // NOTE: for deployment to production, this constructor should have no parameters.
    // for DEV, use the URL of the dev VM the doi and vospace services are deployed on.
    //var _registryClient = new Registy();
    var _registryClient = new Registry({
      resourceCapabilitiesEndPoint: resourceCapabilitiesEndPoint
    })


    // ------------ Page state management functions ------------

    function clearAjaxAlert() {
      $('.alert-danger').addClass('hidden')
      $('.alert-sucess').addClass('hidden')
      setProgressBar('okay')
    }

    // Communicate AJAX progress and status using progress bar
    function setProgressBar(state) {
      var _progressBar = $('.doi-progress-bar')
      switch (state) {
        case 'busy': {
          _progressBar.addClass('progress-bar-striped')
          _progressBar.removeClass('progress-bar-danger')
          _progressBar.addClass('progress-bar-success')
          break
        }
        case 'okay': {
          _progressBar.removeClass('progress-bar-striped')
          _progressBar.removeClass('progress-bar-danger')
          _progressBar.addClass('progress-bar-success')
          break
        }
        case 'error': {
          _progressBar.removeClass('progress-bar-striped')
          _progressBar.removeClass('progress-bar-success')
          _progressBar.addClass('progress-bar-danger')
          break
        }
        default: {
          // Nothing
          break
        }
      }
    }

    function setAjaxFail(message) {
      $('#status_code').text(message.status)
      $('#error_msg').text(message.responseText)
      $('.alert-danger').removeClass('hidden')
      setProgressBar('error')
    }

    function setAjaxSuccess(message) {
      $('#error_msg').text(message.responseText)
      $('.alert-sucess').removeClass('hidden')
      setProgressBar('okay')
    }

    // ------------ HTTP/Ajax functions ------------

    function prepareCall() {
      return _registryClient
        .getServiceURL(
          'ivo://cadc.nrc.ca/doi',
          'vos://cadc.nrc.ca~vospace/CADC/std/DOI#instances-1.0',
          'vs:ParamHTTP',
          'cookie'
        )
        .catch(function(err) {
          setAjaxFail('Error obtaining Service URL > ' + err)
        })
    }

    function setInfoModal(title, msg, hideThanks) {
      $('.info-span').html(msg)
      $('#infoModalLongTitle').html(title)

      // Check if modal is already open
      if ($('#info_modal').data("bs.modal") === undefined ||
          $('#info_modal').data("bs.modal").isShown === false) {
        $('#info_modal').modal('show')
      }

      if (hideThanks === true) {
        $('#infoThanks').addClass('d-none')
      } else {
        $('#infoThanks').removeClass('d-none')
      }

    };

    $.extend(this, {
      prepareCall: prepareCall,
      setAjaxSuccess: setAjaxSuccess,
      setAjaxFail: setAjaxFail,
      setProgressBar: setProgressBar,
      clearAjaxAlert: clearAjaxAlert,
      setInfoModal: setInfoModal
    })
  }

  // ------------ Modal control, messaging, common metadata display ------------



})(jQuery)
