/**
 * image zoom:
 *    Displays the linked image by floating it above the page
 */

(function($) {
  var NextPrevDisplayTimeoutId

  $.fn.gsImageZoom = function() {
    return this.each(function() {
      $(this).click(function() {
        var currentImageIndex = find_current_index_for_image(this)
        load_image(currentImageIndex)
        
        return false
      })
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
    $(".image-zoom").each(function(index) {
      if (this.href == link.href)
        foundIndex = index
    })
    return foundIndex;
  }

  /**
   * Retrieves the url for the link of the index passed in 
   * based on the array of links of the .image-zoom class
   */
  function find_url_for_image_by_index(index) {
    return $(".image-zoom")[index].href
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
      var previousImages = $(".gs-image")
      if (previousImages.length > 1) {
        $(previousImages[0]).remove()
        remove_navigation_links()
      }

      content.animate({height:imgHeight, top:topOffset}, 500, function() {
        $(image).fadeIn()
        attach_navigation_links($(image), imageIndex) 
        bind_closing_triggers()
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
    var showNext = imageIndex != ($("a.image-zoom").length - 1)

    
    // bind the previous and next links if they are to be shown
    if (showPrevious) {
      var previousLink = $("<a id='gs-image-zoom-previous'>Previous</a>")
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
  function bind_closing_triggers() {
    var close = function() {
      $("#gs-image-zoom-content, #gs-image-zoom-bg").fadeOut(300, function() {
        $(this).remove()
      })
    }
   
    // esc key
    $(window).one("keydown", function(e) {
      var key = e.charCode || e.keyCode || e.which
      if (key == "27")
        close()
    })

    // clicking on area outside content layer
    // or the close button
    $("#gs-image-zoom-bg, #close").one("click", close)
  }

 })(jQuery);
