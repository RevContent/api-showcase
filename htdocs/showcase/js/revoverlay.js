/**
 * Revcontent overlay
 */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition
    // browser global
    window.revOverlay = factory(
      window
    );

}( window, function factory( window ) {

'use strict';

var overlay = {};

// used for reusing icons that just need a new id/class swapped in
overlay.iconTemplates = {
    videoCircle: '<svg class="rc-icon-video" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"' +
                             'id="{{id}}-video-icon" width="100%" viewBox="0 0 440 440">' +
                            '<circle id="{{id}}" cx="220" cy="220" r="200" style=""></circle>' +
                            '<path class="rc-icon-video-arrow" style="stroke-linejoin:miter;"' +
                                  'd="m 175,150 0,150 120,-75 z" ></path>' +
                            '<image width="100%" src="//serve.revcontent.com/assets/img/{{id}}-video-icon.png" xlink:href="">' +
                        '</svg>'
}

overlay.icons = {
    video_rectangle: '<svg class="rc-icon-video" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"' +
                            'id="rectangle-video-icon" viewBox="0 0 640 448">' +
                            '<rect id="rect1" width="640" height="448" x="0" y="0" ry="110" rx="110"></rect>' +
                            '<path class="rc-icon-video-arrow" d="m 250,127 0,187.125 182.59375,-93.5625 z"></path>' +
                            '<image width="100%" src="//serve.revcontent.com/assets/img/rect-video-icon.png" xlink:href="">' +
                          '</svg>',
    video_square: '<svg class="rc-icon-video" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"' +
                             'id="square-video-icon" width="100%" viewBox="0 0 440 440">' +
                            '<rect id="square1" width="400" height="400" x="20" y="20"></rect>' +
                            '<path class="rc-icon-video-arrow" style="stroke-linejoin:miter;"' +
                                  'd="m 175,150 0,150 120,-75 z" ></path>' +
                            '<image width="100%" src="//serve.revcontent.com/assets/img/square-video-icon.png" xlink:href="">' +
                        '</svg>',
    video_circle1: overlay.iconTemplates.videoCircle.replace(/{{id}}/g, 'circle1'),
    video_circle2: overlay.iconTemplates.videoCircle.replace(/{{id}}/g, 'circle2'),
    video_triangle: '<svg class="rc-icon-video" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"' +
                             'id="triangle-video-icon" width="100%" viewBox="0 0 400 340">' +
                            '<defs>' +
                                '<filter id="shadow" x="0" y="0" width="200%" height="200%">' +
                                    '<feOffset result="offOut" in="SourceAlpha" dx="3" dy="4" />' +
                                    '<feGaussianBlur result="blurOut" in="offOut" stdDeviation="7" />' +
                                    '<feBlend in="SourceGraphic" in2="blurOut" mode="normal" />' +
                                '</filter>' +
                            '</defs>' +
                            '<path class="rc-icon-video-arrow" style="stroke-linejoin:miter;"' +
                                  'd="m 100,50 0,250 220,-125 z" ></path>' +
                            '<image width="100%" src="//serve.revcontent.com/assets/img/tri-video-icon.png" xlink:href="">' +
                        '</svg>'
}

overlay.image = function(image, content_type, overlay, position, icons) {
    if (!overlay[content_type]) { // is there a config passed for this content_type?
        return;
    }

    var icon = this.icons[content_type + '_' + overlay[content_type]];
    if (!icon) { // does this icon exist
        return;
    }

    image.insertAdjacentHTML('beforeend', '<div class="rc-icon rc-icon-'+ position +'">' + icon + '</div>');
};

// -----  ----- //
return overlay;

}));