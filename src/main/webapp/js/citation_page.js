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
    //var _registryClient = new Registy();
    var _registryClient = new Registry({
      resourceCapabilitiesEndPoint: resourceCapabilitiesEndPoint
    })

    function setCapabilitiesEndpoint(inputs) {
      resourceCapabilitiesEndPoint =
              inputs && inputs.hasOwnProperty('resourceCapabilitiesEndPoint')
                  ? inputs.resourceCapabilitiesEndPoint
                  : 'http://apps.canfar.net/reg/resource-caps'

      _registryClient = new Registry({
        resourceCapabilitiesEndPoint: resourceCapabilitiesEndPoint
      })
    }

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
      hideModals()
    }

    function setAjaxSuccess(message) {
      $('#error_msg').text(message.responseText)
      $('.alert-sucess').removeClass('hidden')
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


    function mkDataDirLink(dataDir) {
      return '<a href="/storage/list' +
          dataDir +
          '" target="_blank">/storage/list' +
          dataDir +
          '</a>'
    }


    // ------------ Authentication functions ------------

    function checkAuthentication() {
      userManager = new cadc.web.UserManager()

      // From cadc.user.js. Listens for when user logs in
      userManager.subscribe(cadc.web.events.onUserLoad,
          function (event, data) {
            // Check to see if user is logged in or not
            if (typeof(data.error) != "undefined") {
              setNotAuthenticated()
            } else {
              setAuthenticated()
            }
          });

      // This function is in cadc.user.js, will throw the event
      // in the userManager.subscribe above...
      userManager.loadCurrent()
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

    function hideModals() {
      $('.modal-backdrop').remove();
    }

    $.extend(this, {
      prepareCall: prepareCall,
      setAjaxSuccess: setAjaxSuccess,
      setAjaxFail: setAjaxFail,
      setProgressBar: setProgressBar,
      clearAjaxAlert: clearAjaxAlert,
      setInfoModal: setInfoModal,
      mkDataDirLink: mkDataDirLink,
      checkAuthentication: checkAuthentication,
      setCapabilitiesEndpoint: setCapabilitiesEndpoint,
      subscribe: subscribe,
      hideModals: hideModals
    })



  }



  /**
   * Class for handling DOI metadata document
   * @constructor
   */
  function DOIDocument() {
    var _selfDoc = this
    this._minimalDoc = {}

    function initMinimalDoc() {
      // build minimal doc to start.
      _selfDoc._minimalDoc = {
        resource: {
          '@xmlns': 'http://datacite.org/schema/kernel-4',
          identifier: {
            '@identifierType': 'DOI',
            $: '10.11570/YY.xxxx'
          },
          creators: {
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
          },
          publisher: { $: 'Canadian Astronomy Data Centre (CADC)' },
          publicationYear: { $: new Date().getFullYear() },
          resourceType: {
            '@resourceTypeGeneral': 'Dataset',
            $: 'Dataset'
          }
        }
      }
    }

    function getMinimalDoc() {
      if (_selfDoc._minimalDoc === {}) {
        initMinimalDoc()
      }
      return _selfDoc._minimalDoc
    }

    function populateDoc(serviceData) {
      _selfDoc._minimalDoc = serviceData
    }

    function makeCreatorStanza(personalInfo) {
      var nameParts = personalInfo.split(/s*[s,]s*/).filter(Boolean)
      var creatorObject = {
        creatorName: {
          '@nameType': 'Personal',
          $: ''
        },
        givenName: { $: '' },
        familyName: { $: '' }
      }

      // clean up the ", " format that might not have been done
      // in the input box, so that output is consistent and format
      // in the XML file is consistent
      var givenName = nameParts[1].trim()
      var familyName = nameParts[0].trim()
      creatorObject.creatorName['$'] = givenName + ", " + familyName
      creatorObject.familyName['$'] = familyName
      creatorObject.givenName['$'] = givenName

      return { creator: creatorObject }
    }

    function setAuthor(authorList) {
      // personalInfo is a new line delimited list of last name, first name elements
      var names = authorList.split('\n')
      for (var j = 0; j < names.length; j++) {
        _selfDoc._minimalDoc.resource.creators['$'][j] = makeCreatorStanza(
            names[j]
        )
      }
    }

    function setDOINumber(identifier) {
      if (identifier !== '') {
        _selfDoc._minimalDoc.resource.identifier['$'] = identifier
      }
    }

    function setTitle(title) {
      _selfDoc._minimalDoc.resource.titles['$'][0].title['$'] = title
    }

    function getAuthorFullname() {
      return _selfDoc._minimalDoc.resource.creators['$'][0].creator.creatorName[
          '$'
          ]
    }

    function getAuthorList() {
      var listSize = _selfDoc._minimalDoc.resource.creators['$'].length
      var authorList = ''
      for (var ix = 0; ix < listSize; ix++) {
        authorList =
            authorList +
            _selfDoc._minimalDoc.resource.creators['$'][ix].creator.creatorName[
                '$'
                ] +
            '\n'
      }
      return authorList
    }

    function getDOINumber() {
      return _selfDoc._minimalDoc.resource.identifier['$']
    }

    function getTitle() {
      return _selfDoc._minimalDoc.resource.titles['$'][0].title['$']
    }

    initMinimalDoc()

    $.extend(this, {
      initMinimalDoc: initMinimalDoc,
      getMinimalDoc: getMinimalDoc,
      populateDoc: populateDoc,
      setAuthor: setAuthor,
      setDOINumber: setDOINumber,
      setTitle: setTitle,
      getAuthorFullname: getAuthorFullname,
      getAuthorList: getAuthorList,
      getDOINumber: getDOINumber,
      getTitle: getTitle
    })
  }


})(jQuery)
