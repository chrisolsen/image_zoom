/**
 * ImageZoom
 * Summary:
 *   Simple image viewer without all the fluff.
 * Created By:
 *    Chris Olsen
 */

(function($) {
  var NextPrevDisplayTimeoutId
  var ImageLinks = []
  var ImageIndex = 0

  var CHAR_CODES = {
    esc: 27,
    left_arrow: 37,
    right_arrow: 39,
    n: 78,
    p: 80
  }
  
  $.fn.gsImageZoom = function() {
    return this.each(function(index) {
      // save a list of the images allowing for the zoom 
      ImageLinks[ImageLinks.length] = this
      
      $(this).click(function() {
        ImageIndex = find_current_index_for_image(this)
        load_image(ImageIndex)
        
        return false
      })

      if (index == 0)
        bind_events()
    })
  }

  /**
   * Finds the index of the image.  Index are used since it
   * allows for later checking to whether the image is first
   * or last in the list to allow for the hiding of the 
   * corresponding previous or next link.
   */
  function find_current_index_for_image(link) {
    var foundIndex = -1
    $.each(ImageLinks, function(index) {
      if (ImageLinks[index].href == link.href)
        foundIndex = index
    })
    return foundIndex;
  }

  /**
   * Retrieves the url for the link of the index passed in 
   * based on the array of links within the selector 
   */
  function find_url_for_image_by_index(imageIndex) {
    return ImageLinks[imageIndex].href
  }

  /**
   * Loads the image to be viewed by index into the page
   * and binds all the necessary events
   */
  function load_image(imageIndex) {
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
      
      content.append($(image)) 

      // expand the content area to the height of the photo
      imgHeight = $(image).outerHeight()
      topOffset = ($(window).height() - imgHeight) / 2
    
      // remove any previous animations
      var previousImageLinks = $(".gs-image")
      if (previousImageLinks.length > 1) {
        $(previousImageLinks[0]).remove()
        remove_navigation_links()
      }

      content.animate({height:imgHeight, top:topOffset}, 500, function() {
        $(image).fadeIn()
        attach_navigation_links($(image), imageIndex) 
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
    image.src = find_url_for_image_by_index(imageIndex)

    // save the index change
    ImageIndex = imageIndex
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

    var yOffset = ($(window).height() - parseInt(content.css("height"))) / 2
    content.css("top", yOffset)
  }

  /**
   * Adds the previous and next links to the image
   * to allow the user to navigate between all the images
   */
  function attach_navigation_links(image, imageIndex) {
    var height = image.height()
    var leftBoundry = image.position().left
    var rightBoundry = leftBoundry + image.width()

    // determine the index of the link clicked to allow us
    // to know whether to show/hide the previous or next link
    var showPrevious = imageIndex != 0
    var showNext = imageIndex != (ImageLinks.length - 1)

    
    // bind the previous and next links if they are to be shown
    if (showPrevious) {
      var previousLink = $("<a id='gs-image-zoom-previous'>Prev</a>")
      previousLink.click(function() {
        load_image(imageIndex - 1)
        return false
      })

      $("#gs-image-zoom-content").append(previousLink)
      previousLink.css({top:height/2, left:leftBoundry})
    }

    if (showNext) {
      var nextLink = $("<a id='gs-image-zoom-next'>Next</a>")
      nextLink.click(function() {
        load_image(imageIndex + 1)
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
  function bind_events() {
    var close = function() {
      $("#gs-image-zoom-content, #gs-image-zoom-bg").fadeOut(300, function() {
        $(this).remove()
      })
    }
   
    $(window).keydown(function(e) {
      var key = e.charCode || e.keyCode || e.which
      var handled = false
      
      if (key == CHAR_CODES.esc) {
        close()
        handled = true
      }
      else if (key == CHAR_CODES.p || key == CHAR_CODES.left_arrow) {
        load_image(ImageIndex - 1)
        handled = true
      }
      else if (key == CHAR_CODES.n || key == CHAR_CODES.right_arrow) {
        load_image(ImageIndex + 1)
        handled = true
      }

      return !handled
    })

    // clicking on area outside content layer
    // or the close button
    $("#gs-image-zoom-bg, #close").one("click", close)
  }

  function unbind_events() {
    $(window).unbind("keydown", key_press)
  }

})(jQuery);
