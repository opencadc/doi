;(function($) {
  // register namespace
  $.extend(true, window, {
    cadc: {
      web: {
        citation: {
          CitationPage: CitationPage,
          DOIDocument: DOIDocument,
          // Events
          events: {
            onAuthenticated: new jQuery.Event('doi:onAuthenticated')
          }
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

    var _selfCitationPage = this
    var resourceCapabilitiesEndPoint =
            inputs && inputs.hasOwnProperty('resourceCapabilitiesEndPoint')
                ? inputs.resourceCapabilitiesEndPoint
                : 'http://apps.canfar.net/reg/resource-caps'

    // NOTE: for deployment to production, this constructor should have no parameters.
    // for DEV, use the URL of the dev VM the doi and vospace services are deployed on.
    var _registryClient = new Registry({
      resourceCapabilitiesEndPoint: resourceCapabilitiesEndPoint
    })

    // ------------ Page state management functions ------------

    function clearAjaxAlert() {
      $('.alert-danger').addClass('hidden')
      $('.alert-success').addClass('hidden')
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
      hideModals()
    }

    function setAjaxSuccess(message) {
      $('#alert_msg').text(message)
      $('.alert-success').removeClass('hidden')
      setProgressBar('okay')
      hideModals()
    }

    // ---------- Event Handling Functions ----------

    function subscribe(target, event, eHandler) {
      $(target).on(event.type, eHandler)
    }

    function unsubscribe(target, event) {
      $(target).unbind(event.type)
    }

    function trigger(target, event, eventData) {
      $(target).trigger(event, eventData)
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
          .catch(function (err) {
            setAjaxFail('Error obtaining Service URL > ' + err)
          })
    }


    // ------------ Rendering & display functions ------------

    function mkDataDirLink(dataDir) {
      return '<a href="/storage/list' +
          dataDir +
          '" target="_blank">/storage/list' +
          dataDir +
          '</a>'
    }

    function mkLandingPageLink(doiSuffix) {
      return '<a href="/citation/landing?doi=' +
          doiSuffix +
          '" target="_blank">/citation/landing?doi=' +
          doiSuffix +
          '</a>'
    }

    function setInfoModal(title, msg, hideSpinner, hideThanks) {

      // Set titles and messages
      $('.info-span').html(msg)
      $('#infoModalLongTitle').html(title)

      // Open modal if not already open
      if ($('#info_modal').data('bs.modal') === undefined ||
          $('#info_modal').data('bs.modal').isShown === false) {
        $('#info_modal').modal('show')
      }

      // Toggle these elements as required
      if (hideThanks === true) {
        $('#infoThanks').addClass('d-none')
      } else {
        $('#infoThanks').removeClass('d-none')
      }

      if (hideSpinner === true) {
        $(".spinner-span").addClass('d-none');
      } else {
        $(".spinner-span").removeClass('d-none');
      }

    }




    function setBadgeState(state, useText) {
      // TODO: badge states will come from citation_page later...
      if (state == 'minted') {
        $('.doi-status-badge').removeClass('hidden')
        $('.doi-minted').removeClass('hidden')
        $('.doi-working').addClass('hidden')
        $('.doi-warning').addClass('hidden')
      } else if (state === 'warning') {
        $('.doi-status-badge').removeClass('hidden')
        $('.doi-minted').addClass('hidden')
        $('.doi-working').addClass('hidden')
        $('.doi-warning').removeClass('hidden')
      } else if (state === 'off') {
        $('.doi-status-badge').addClass('hidden')
      } else if (state === 'working') {
        $('.doi-status-badge').removeClass('hidden')
        $('.doi-minted').addClass('hidden')
        $('.doi-working').removeClass('hidden')
        $('.doi-warning').addClass('hidden')
      }
    }

    function setBadge(parentEl, badgeType) {




    //<div class="col-sm-3 doi-status-badge hidden">
    //      <div class="doi-minted glyphicon glyphicon-lock hidden ">
    //      <i>MINTED</i>
    //      </div>
    //      <div class="doi-working glyphicon glyphicon-wrench hidden ">
    //      <i>WORKING</i>
    //      </div>
    //      <div class="doi-warning glyphicon glyphicon-exclamation-sign hidden ">
    //      <i>MINTING INCOMPLETE - Try again or contact a CADC administrator</i>
    //  </div>
    //  </div>
    //  </div>

    }


    // ------------ Authentication functions ------------

    function checkAuthentication() {
      userManager = new cadc.web.UserManager()

      // From cadc.user.js. Listens for when user logs in
      userManager.subscribe(cadc.web.events.onUserLoad,
          function (event, data) {
            // Check to see if user is logged in or not
            if (typeof(data.error) != 'undefined') {
              setNotAuthenticated()
            } else {
              setAuthenticated()
            }
          })

    }

    // #auth_modal is in /canfar/includes/_application_header.shtml
    // the other items are expected to be in the doi index.jsp
    function setNotAuthenticated() {
      $('#auth_modal').modal('show')
      $('.doi-form-body').addClass('hidden')
      $('.doi_not_authenticated').removeClass('hidden')

      $('.doi_not_authenticated').click(function() {
        $('#auth_modal').modal('show')}
      )
    }

    function setAuthenticated() {
      $('.doi-form-body').removeClass('hidden')
      $('.doi_not_authenticated').addClass('hidden')
      trigger(_selfCitationPage, cadc.web.citation.events.onAuthenticated, {})
    }


    function mkSpinner() {
      return $.parseHTML('<span id="doi_working_spinner" class="glyphicon glyphicon-refresh fast-right-spinner"></span>');
    }

    function hideModals() {
      $('.modal-backdrop').remove()
    }

    $.extend(this, {
      prepareCall: prepareCall,
      setAjaxSuccess: setAjaxSuccess,
      setAjaxFail: setAjaxFail,
      setProgressBar: setProgressBar,
      clearAjaxAlert: clearAjaxAlert,
      setInfoModal: setInfoModal,
      mkDataDirLink: mkDataDirLink,
      mkLandingPageLink: mkLandingPageLink,
      checkAuthentication: checkAuthentication,
      subscribe: subscribe,
      trigger: trigger,
      hideModals: hideModals,
      setBadgeState: setBadgeState
    })

  }



  /**
   * Class for handling DOI metadata document
   * @constructor
   */
  function DOIDocument() {
    var _selfDoc = this
    this._badgerfishDoc = {}

    function initDoc() {
      // build initial badgerfish version of metadata doc to start.
      _selfDoc._badgerfishDoc = {
        resource: {
          '@xmlns': 'http://datacite.org/schema/kernel-4',
          identifier: {
            '@identifierType': 'DOI',
            $: ''
          },
          creators: {
            $: []
          },
          language: {
            $: []
          },
          titles: {
            $: [
              {
                title: {
                  '@xml:lang': 'en-US',
                  $: ''
                }
              }
            ]
          }
        }
      }
    }

    function getDoc() {
      if (_selfDoc._badgerfishDoc === {}) {
        initDoc()
      }
      return _selfDoc._badgerfishDoc
    }

    function clearDoc() {
      if (_selfDoc._badgerfishDoc !== {}) {
        delete _selfDoc._badgerfishDoc
        initDoc()
      }
    }

    function populateDoc(serviceData) {
      _selfDoc._badgerfishDoc = serviceData
    }

    function makeCreatorStanza(personalInfo) {
      var nameParts
      if (personalInfo.match(',')) {
        nameParts = personalInfo.split(',').filter(Boolean)
      } else {
        nameParts = personalInfo
      }

      var givenName
      var familyName

      if (nameParts.length > 1) {
        // clean up the ', ' format that might not have been done
        // in the input box, so that output is consistent and format
        // in the XML file is consistent
        givenName = nameParts[1].trim()
        familyName = nameParts[0].trim()
      } else {
        givenName = ''
        familyName = nameParts[0]
      }

      var creatorObject = {
        creatorName: {
          '@nameType': 'Personal',
          $: familyName  + ', ' + givenName
        },
        givenName: { $: givenName },
        familyName: { $: familyName }
      }

      return { creator: creatorObject }
    }

    function setAuthorList(authorList) {
      // authorList is an array of strings with structure 'family name, given name'
      for (var j = 0; j < authorList.length; j++) {
        _selfDoc._badgerfishDoc.resource.creators['$'][j] = makeCreatorStanza(authorList[j])
      }
    }

    function setDOINumber(identifier) {
      if (identifier !== '') {
        _selfDoc._badgerfishDoc.resource.identifier['$'] = identifier
      }
    }

    function setTitle(title) {
      _selfDoc._badgerfishDoc.resource.titles['$'][0].title['$'] = title
    }

    function setLanguage(language) {
      if (language !== '') {
        _selfDoc._badgerfishDoc.resource.language['$'] = language
      }
    }

    function getAuthorFullname() {
      return _selfDoc._badgerfishDoc.resource.creators['$'][0].creator.creatorName[
          '$'
          ]
    }

    function getAuthorList() {
      var listSize = _selfDoc._badgerfishDoc.resource.creators['$'].length
      var authorList = new Array()
      for (var ix = 0; ix < listSize; ix++) {
        authorList.push(_selfDoc._badgerfishDoc.resource.creators['$'][ix].creator.creatorName['$'])
      }
      return authorList
    }

    function getDOINumber() {
      return _selfDoc._badgerfishDoc.resource.identifier['$']
    }

    function getDOISuffix() {
      var suffix = ''
      if (_selfDoc._badgerfishDoc.resource.identifier['$'] !== '' &&
          _selfDoc._badgerfishDoc.resource.identifier['$'].match('/') !== null) {
        suffix = _selfDoc._badgerfishDoc.resource.identifier['$'].split('/')[1]
      }
      return suffix
    }

    function getTitle() {
      return _selfDoc._badgerfishDoc.resource.titles['$'][0].title['$']
    }

    function getLanguage() {
      var language = ''
      if (typeof _selfDoc._badgerfishDoc.resource.language !== 'undefined') {
        language = _selfDoc._badgerfishDoc.resource.language['$']
      }

      return language
    }

    initDoc()

    $.extend(this, {
      initDoc: initDoc,
      getDoc: getDoc,
      clearDoc: clearDoc,
      populateDoc: populateDoc,
      setAuthorList: setAuthorList,
      setDOINumber: setDOINumber,
      setTitle: setTitle,
      setLanguage: setLanguage,
      getAuthorFullname: getAuthorFullname,
      getAuthorList: getAuthorList,
      getDOINumber: getDOINumber,
      getDOISuffix: getDOISuffix,
      getTitle: getTitle,
      getLanguage: getLanguage
    })
  }

})(jQuery)
