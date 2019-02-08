(function ($)
{
  $.extend(true, window, {
    cadc: {
      web: {
        CanfarTooltip: CanfarTooltip,
        // Events
        events: {
          onMapLoad: new jQuery.Event('tooltips:onMapLoad')
        }
      }
    }
  });

  /**
   * Create tooltips
   */
  function CanfarTooltip(opts)
  {
    var defaultOptions = {
      contentFile: 'tooltips_en.json',
      contentFile: 'tooltips_en.json',
      className: 'canfar-tooltip',
      buttonClassname: 'canfar-tooltip-btn'
    }

    var options = opts || {}

    var tooltipContentFile =
        options.contentFile ||
        defaultOptions.contentFile

    var tooltipClassname =
            options.className ||
            defaultOptions.className

    var buttonTooltipClassname =
            options.buttonClassname ||
            defaultOptions.buttonClassname

    var tooltipMap = {}

    /**
     * Obtain the tooltip string, with markup, for the given markup text and the
     * given header.  This will return a jQuery object representing the content.
     *
     * @param tipHTML
     * @param tooltipHeaderText
     * @param tipClass optional tooltip Class
     * @param tipHeader
     * @returns {jQuery}
     */
    function getContent(tipHTML, tooltipHeaderText, tipClass, tipHeader)
    {
      var $divElement = $("<div class='module-tool module-simplify module-tool-tooltip'></div>");
      var $tooltipHeader = $("<div class='tooltip_header'></div>");
      $("<h6></h6>").appendTo($tooltipHeader);
      var $tooltipTextElement = $("<p>").appendTo("<div class='tooltip_text'></div>");

      if (tipClass)
      {
        $divElement.addClass(tipClass);
      }

      $tooltipTextElement.html(tipHTML);
      $divElement.append($tooltipTextElement.parent());

      return $divElement.clone();
    }

    /**
     * Obtain the tooltip header, with markup, for the given markup text and the
     * given header.  This will return a jQuery object representing the content.
     *
     * @param tooltipHeaderText
     * @returns {jQuery}
     */
    function getHeader(tooltipHeaderText, tooltipID)
    {
      var $divEl =
              $("<div class=''></div>");

      var $spanEl = $('<span class="text-info"></span>');
      $spanEl.text(tooltipHeaderText);

      var buttonID = tooltipID + "_close";
      var $buttonEl = $('<div id="' + buttonID
          + '" class="glyphicon glyphicon-remove-circle popover-blue popover-right"></div>');

      $divEl.append($spanEl);
      $divEl.append($buttonEl);

      return $divEl.clone(true, true);
    }

    /**
     * Construct tooltip from content provided.
     * @param tipJSON
     * @param $infoItem
     * @param inputID
     * @param trigger
     */
    function handleTooltipLoad(
        tipJSON,
        $infoItem,
        inputID,
        trigger
    ) {
      if (tipJSON && tipJSON.tipHTML) {
        var tipMarkup = tipJSON.tipHTML

        var offsetY = tipJSON.verticalOffset ? tipJSON.verticalOffset : 0

        var $tooltipDiv = getContent(
            tipMarkup,
            tipJSON.title,
            null,
            null
        )

        var $tooltipHeaderDiv = getHeader(
            tipJSON.title,
            inputID
        )

        $infoItem.popover({
          title: $tooltipHeaderDiv,
          content: $tooltipDiv[0].innerHTML,
          html: true,
          placement: tipJSON.placement,
          trigger: trigger
        })

      }
    }

    /**
     * Put a '?' icon on the given DOM element
     */
    function setIconToPage(pageEl)
    {
      pageEl.setAttribute("data-toggle", "popover")
      pageEl.setAttribute("data-placement", "right")
      $(pageEl).addClass("glyphicon glyphicon-question-sign popover-blue")
    }

    /**
     * Load all tooltips the calling page has divs set up for, using the
     * json file provided
     */
    function loadTooltips(){
      var tooltipEls = $('.' + tooltipClassname)

      for (var i=0; i< tooltipEls.length; i++ ) {
        var curTooltipEl = tooltipEls[i]
        setIconToPage(curTooltipEl)

        // grab the associated tooltip text from the map
        var tipJSON = tooltipMap[curTooltipEl.dataset.contentkey]

        handleTooltipLoad(tipJSON, $(curTooltipEl), curTooltipEl.id, "click")
      }

      var buttonTooltipEls = $('.' + buttonTooltipClassname)

      for (var i=0; i< buttonTooltipEls.length; i++ ) {
        var curTooltipEl = buttonTooltipEls[i]
        curTooltipEl.setAttribute("data-toggle", "popover")
        curTooltipEl.setAttribute("data-placement", "right")

        // grab the associated tooltip text from the map
        var tipJSON = tooltipMap[curTooltipEl.dataset.contentkey]

        handleTooltipLoad(tipJSON, $(curTooltipEl), curTooltipEl.id, "hover")
      }

      handleTooltipClose()
    }

    /**
     * Get the a map of tooltip text and headers from the tooltipContentFile
     * @private
     */
    function _getContentMap(){
      // Code similar to this would handle multiple languages in future
      //var tooltipURL = 'json/tooltips_' + this.getPageLanguage() + '.json'
      var tooltipURL = 'json/' + tooltipContentFile

      $.getJSON(tooltipURL, function(jsonData) {

        tooltipMap = jsonData
        loadTooltips(jsonData)
      })
    }

    /**
     * Set up listeners for page-wide management of popovers
     */
    function handleTooltipClose() {
      // Manage closing popovers, and maintaining that only one is
      // open at a time.
      $(document).on('click', function(e) {
        if ($(e.target).hasClass('glyphicon-remove-circle')) {
          $('[data-toggle="popover"],[data-original-title]').each(function() {
            ;(
                (
                    $(this)
                        .popover('hide')
                        .data('bs.popover') || {}
                ).inState || {}
            ).click = false // fix for BS
            // 3.3.6
          })
        }

        if ($(e.target).hasClass('glyphicon-question-sign')) {
          $('[data-toggle="popover"]').each(function() {
            if (
                !$(this).is(e.target) &&
                $(this).has(e.target).length === 0 &&
                $('.popover').has(e.target).length === 0
            ) {
              ;(
                  (
                      $(this)
                          .popover('hide')
                          .data('bs.popover') || {}
                  ).inState || {}
              ).click = false // fix for BS 3.3.6
            }
          })

          // reposition popover so it doesn't cover input field for left-side display
          if ($('.popover').hasClass('left')) {
            $('.popover').css('left', '-480px')
          }
        }
      })
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

    // ---------- Main Function that page should call ----------

    function getTooltips() {
      _getContentMap()
    }

    $.extend(this,
        {
          getContent: getContent,
          getHeader: getHeader,
          setIconToPage : setIconToPage,
          loadTooltips: loadTooltips,
          subscribe: subscribe,
          getTooltips: getTooltips
        });
  }
})(jQuery);
