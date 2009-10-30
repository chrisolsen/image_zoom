/**
 * ImageZoom
 * Summary:
 *   Simple image viewer without all the fluff.
 * Created By:
 *    Chris Olsen
 */

(function($) {
  var NextPrevDisplayTimeoutId

  var CHAR_CODES = {
    esc: 27,
    left_arrow: 37,
    right_arrow: 39,
    n: 78,
    p: 80
  }
  
  $.fn.gsImageZoom = function(params) {
    
    var defaultParams = {
      filter: "a"
    }

    params = $.extend(defaultParams, params)

    return this.each(function() {
      var zoomItems = {
        links: [],
        currentIndex: 0,
        currentLink: function() { return this.links[this.currentIndex]; },
        addLink: function(link) { this.links[this.links.length] = link; }
      }
      
      $(this).find(params.filter).each(function() {
        // save a list of the images allowing for the zoom 
        zoomItems.addLink(this)
        
        $(this).click(function() {
          zoomItems.currentIndex = find_current_index_for_image(this, zoomItems.links)
          load_image(zoomItems, zoomItems.currentIndex)
          bind_events(zoomItems)

          return false
        })
      }) // link binding
    }) // gsImageZoom()
  }

  /**
   * Finds the index of the image.  Index are used since it
   * allows for later checking to whether the image is first
   * or last in the list to allow for the hiding of the 
   * corresponding previous or next link.
   */
  function find_current_index_for_image(link, zoomItemLinks) {
    var foundIndex = -1
    $.each(zoomItemLinks, function(index) {
      if (this.href == link.href)
        foundIndex = index
    })
    return foundIndex;
  }

  /**
   * Loads the image to be viewed by index into the page
   * and binds all the necessary events
   */
  function load_image(zoomItems, loadIndex) {
    // user is pressing <-/-> or p/n at image bounds
    if (loadIndex < 0 || loadIndex > zoomItems.links.length - 1)
      return

    //locals
    var image = new Image()
   
    $(image)
      .css("display", "none")
      .addClass("gs-image")

    init_layers() 

    // callback method that will be executed after the 
    // .src assignment below
    $(image).load(function() { 
      var imgHeight, topOffset
      var content = $("#gs-image-zoom-content")

      // dimension calculations before adding the new one
      content.append($(image)) 

      // expand the content area to the height of the photo
      imgHeight = $(image).outerHeight()
      topOffset = ($(window).height() - imgHeight) / 2 - 10
    
      // adjust offset for any user scrolling
      topOffset += $(window).scrollTop()

      // remove any previous animations
      var previousImageLinks = $(".gs-image")
      if (previousImageLinks.length > 1) {
        $(previousImageLinks[0]).remove()
        remove_navigation_links()
      }
     
      // ensure the background covers the entire document (not just the visible portion)
      $("#gs-image-zoom-bg").height($(document).height())

      // show the image
      content.animate({height:imgHeight, top:topOffset}, 500, function() {
        $(image).fadeIn()
        attach_navigation_links($(image), zoomItems) 
      })

    }).mouseover(function() {
      clearInterval(NextPrevDisplayTimeoutId)
      $("#gs-image-zoom-previous, #gs-image-zoom-next").fadeIn()
    }).mouseout(function() {
      NextPrevDisplayTimeoutId = setTimeout(function() {
        $("#gs-image-zoom-previous, #gs-image-zoom-next").fadeOut()
      }, 3000)
    })

    // will make request for img data
    image.src = zoomItems.links[loadIndex].href

    // save the index change
    zoomItems.currentIndex = loadIndex 
  }

  /**
   * Creates the overly layers that grey out the main page and
   * highlights the images that are being viewed
   */
  function init_layers() {
    // exit if layers already exist
    if ($("#gs-image-zoom-content").length > 0)
      return
    
    var content = $("<div id='gs-image-zoom-content'>")

    $("body").append(content)
    $("body").append("<div id='gs-image-zoom-bg'>")

    // offset for the window, starting height and scrollOffset
    var yOffset = (($(window).height() - parseInt(content.css("height"))) / 2) + $(window).scrollTop()

    content.css("top", yOffset)
  }

  /**
   * Adds the previous and next links to the image
   * to allow the user to navigate between all the images
   */
  function attach_navigation_links(image, zoomItems) {
    var height = image.height()
    var leftBoundry = image.position().left
    var rightBoundry = leftBoundry + image.width()

    // determine the index of the link clicked to allow us
    // to know whether to show/hide the previous or next link
    var showPrevious = zoomItems.currentIndex != 0
    var showNext = zoomItems.currentIndex != (zoomItems.links.length - 1)

    
    // bind the previous and next links if they are to be shown
    if (showPrevious) {
      var previousLink = $("<a id='gs-image-zoom-previous'>Prev</a>")
      previousLink.click(function() {
        load_image(zoomItems, zoomItems.currentIndex - 1)
        return false
      })

      $("#gs-image-zoom-content").append(previousLink)
      previousLink.css({top:height/2, left:leftBoundry})
    }

    if (showNext) {
      var nextLink = $("<a id='gs-image-zoom-next'>Next</a>")
      nextLink.click(function() {
        load_image(zoomItems, zoomItems.currentIndex + 1)
        return false
      })

      $("#gs-image-zoom-content").append(nextLink)
      nextLink.css({top:height/2, left:rightBoundry - nextLink.width()})
    }
  }

  /**
   * Deletes any previously shown navigation links from the DOM
   */
  function remove_navigation_links() {
    // remove any links that were shown from a previous photo
    $("#gs-image-zoom-previous").remove()
    $("#gs-image-zoom-next").remove()
  }

  /**
   * Attaches all the user events that will allow for the slideshow
   * to be removed from the screen and the dom
   */
  function bind_events(zoomItems) {
    // named function to keypress to allow for
    // later specific removal
    var key_press = function(e) {
      var key = e.charCode || e.keyCode || e.which
      var handled = false
      
      if (key == CHAR_CODES.esc) {
        close()
        handled = true
      }
      else if (key == CHAR_CODES.p || key == CHAR_CODES.left_arrow) {
        load_image(zoomItems, zoomItems.currentIndex - 1)
        handled = true
      }
      else if (key == CHAR_CODES.n || key == CHAR_CODES.right_arrow) {
        load_image(zoomItems, zoomItems.currentIndex + 1)
        handled = true
      }

      return !handled
    }

    var close = function() {
      $("#gs-image-zoom-content, #gs-image-zoom-bg").fadeOut(300, function() {
        $(this).remove()
      })
   
      $(window).unbind("keydown", key_press)
    }
  
    $(window).keydown(key_press)

    // clicking on area outside content layer
    // or the close button
    $("#gs-image-zoom-bg, #close").one("click", close)
  }

})(jQuery);
