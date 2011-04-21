/*!
 * No lightbox -jQuery Slideshow Plugin v1.1
 * www.nerdburn.com
 *
 * Copyright 2011, Shawn Adrian
 *
 * TODO: Insert licence(s)
 *
 * @author <a href="mailto:shawn@nerdburn.com">Shawn Adrian</a>
 * @author <a href="mailto:alex.arnell+nlb@gmail.com">Alex Arnell</a>
 */

(function($) {

  // establish the actual plugin
  $.fn.nolightbox = function(options) {

    // extend default options with any provided
    $.extend($.fn.nolightbox.defaults, options);

    // if the user provided an url to read from, do this
    if($.fn.nolightbox.defaults.json_url) {
      // get the images and populate the div
      $.getJSON($.fn.nolightbox.defaults.json_url,function(json){
        // FIXME: should hang to a reference to $(this) for this callback instead
        $().nolightbox({json_url: null, json: json});
      });
      return $(this); // stop execution. callback will start it over asynchronously when we have json data
    } else { // if no json url
      var images;
      if($.fn.nolightbox.defaults.json) {
        images = $.fn.nolightbox.defaults.json;
      } else {
        images = $.map($(this).children("img"), function(img) { return {location: $(img).attr('src'), caption: $(img).attr('alt')}; });
      }
    };

    // setup the html for the gallery, save it in a var
    var html = setupHtml();


    $.fn.nolightbox.run(html,images);

    // return the gallery for chaining purposes
    return $(this);

  };

  // set up plugin default options
  $.fn.nolightbox.defaults = {
    url: undefined,
    speed: 200,
    leftmargin: 100,
    padding: 7,
    aclass: "nolightbox",
    showAfter: 3
  };

  var accumulated_offset = 0;
  var final_height = 0;

  $.fn.nolightbox.size_and_position_pics = function(pics) {
    var min_height = 100000; // height of smallest image in set
    $.each(pics, function() {
      var $pic = this.jquery ? this : $(this);
      // fetch height from the actual img tag
      min_height = Math.min(min_height, $pic.data("nolightbox.height") || 100000);
    });
    var available_viewport_size = $(window).height() - 175;
    var uniform_image_height = Math.min(available_viewport_size, min_height);
    var minimum_acceptable_height = 250;
    // final_height is the height that we will set for images to
    final_height = Math.max(uniform_image_height, minimum_acceptable_height);


    accumulated_offset = $.fn.nolightbox.defaults.leftmargin;
    $.each(pics, function() { placePicLeft(this); });
    /*
    pics.each(function() {
      var scale_multiplier = final_height / this.height;
      var new_width = Math.round(this.width * scale_multiplier);
      $(this).height(final_height).width(new_width);

      $(this).css("left", accumulated_offset);
      accumulated_offset += new_width + $.fn.nolightbox.defaults.padding;
    });
    */
  }

  function placePicLeft(pic) {
    var $pic = pic.jquery ? pic : $(pic),
        scale_multiplier = final_height / $pic.data("nolightbox.height"),
        new_width = Math.round($pic.data("nolightbox.width") * scale_multiplier);
    if (!isNaN(new_width)) {
      $pic.height(final_height).width(new_width);

      $pic.css("left", accumulated_offset);
      $pic.show();
      accumulated_offset += new_width + $.fn.nolightbox.defaults.padding;
    }
  }

  // a simple function to set up / hide html entities on the page and return them
  function setupHtml() {
    // create html for the gallery, etc.
    var html = [];
    html.push( '<div class="nolightbox"></div>' );
    html.push( '<div class="dimmer">' );
    html.push( '<div class="closebutton" title="Close"></div>' );
    html.push( '<p class="loading">Loading...</p>' );
    html.push('</div>' );

    // add the html to the body
    $("body").append(html.join(''));

    // set up vars to simplify code
    var div = $("div.nolightbox");
    var dimmer = $("div.dimmer");
    var loading = $("div.dimmer p.loading");
    var close = $('div.dimmer div.closebutton');

      // hide until launched
    div.hide();
    dimmer.hide();

    // set up var to return
    var html = {
      loading: loading,
      div: div,
      dimmer: dimmer,
      close: close
    };

    // return the html elements
    return html;
  }

  // a function to actually run the slideshow
  $.fn.nolightbox.run = function(html,images){

    // launch the slideshow on click
    $("a." + $.fn.nolightbox.defaults.aclass).click(function(e){

      // prevent default click action
      e.preventDefault();


      // keep a copy of all the previous valus on body that
      // we will tweak just a little later on
      var $body = $("body"), bodyPrevCss = {
        overflow: $body.css("overflow"),
        margin: $body.css("margin"),
        padding: $body.css("padding")
      };

      // style the body, show the slideshow html
      $body.css({
        overflow: "hidden",
        margin: 0,
        padding: 0
      });

      // use a closure to lock in the value of 'options'
      $.fn.nolightbox.close = function() {
        // cleanup
        html.div.children('img').remove();
        html.div.hide();
        html.loading.show();
        html.dimmer.hide();

        $body.css(bodyPrevCss);
      };

      // style the loader
      html.loading.css({
        textAlign: "center",
        top: "50%"
      });

      // style the dimmer
      html.dimmer.css({
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: "#000",
        width: "100%",
        color: "#fff",
        zIndex: 99
      }).animate({opacity: 0.999},$.fn.nolightbox.defaults.speed).height($(document).height());

      // style the close buttom
      html.close.css({
        position: "absolute",
        top: "0px",
        right: "0px",
        width: "30px",
        height: "30px",
        cursor: "pointer",
        background: "url(images/close.png)"
      });

      // style the gallery
      html.div.css({
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 100
      });

      html.dimmer.show();

      // preload all the images...
      var finished = 0, total = images.length;
      var df = $.Deferred(function( dfd ){

        var ldfs = $.map(images, function(image) {
          var img_tag = $("<img/>")
          img_tag.attr('src', image.location);
          if(image.caption) { attr('alt', image.caption); }
          img_tag.hide();
          html.div.append(img_tag);
          var ldf = $.Deferred(function(d) {
            img_tag.load(function() {
              // height and width are known now, store a hard reference
              $.data(this, "nolightbox.height", this.height);
              $.data(this, "nolightbox.width", this.width);
              d.resolve(img_tag);
            });
          });
          return ldf.promise();
        });

        var first = ldfs.splice(0, $.fn.nolightbox.defaults.showAfter || 3);
        // once the first 4 images are loaded resolve
        $.when.apply(this, first).then(function() {
          // arguments will be the first 4 loaded images
          dfd.resolve(arguments, ldfs);
        });


      }).promise();



      // once all the images are loaded remove the loading text
      df = $.when(df).then(function(first, remaining) {

        html.loading.hide();

        // set up a var to house the pics
        var pics = html.div.children("img");

        // style the pics
        pics.css({
          zIndex: 100,
          position: "absolute",
          top: 75
        });

        $.fn.nolightbox.size_and_position_pics(first);

        // now that we have positioned and size the first few images
        // track when the remaining images load so we can resize them too
        $.each(remaining, function() {
          $.when(this).then(function(pic){placePicLeft(pic);});
        });

        $(window).resize(function() {
          $.fn.nolightbox.size_and_position_pics(pics);
        });

        // bind event listeners to close the slideshow
        $(window).keyup(function(e) {
          if (e.which == 27) { $.fn.nolightbox.close(); }   // esc
        });
        html.close.click($.fn.nolightbox.close);

        html.div.show();

        // do the moving around on clicking
        pics.click(function() {
          position = $(this).position();
          html.div.animate({left: -position.left+$.fn.nolightbox.defaults.leftmargin},$.fn.nolightbox.defaults.speed);
          pics.animate({opacity:0.3},$.fn.nolightbox.defaults.speed);
          $(this).animate({opacity:1},$.fn.nolightbox.defaults.speed);
        });

        // fade the pics onto the page
        pics.each(function() {
          var $this = $(this);
          if ($(this).is(":first-child")) {
            $this.animate({opacity:1},$.fn.nolightbox.defaults.speed);
          } else {
            $(this).animate({opacity:0.3}, $.fn.nolightbox.defaults.speed)
          }
        });
      });
    });
  };
})(jQuery);
