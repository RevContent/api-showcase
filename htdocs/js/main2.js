// Add the basic String function trim for all browsers with an outdated ECMAScript implementation
if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };
}
// Add the isNumeric function for older versions of jQuery that do not have it
if(typeof(jQuery.isNumeric) !== 'function'){
    jQuery.isNumeric = function(obj){ return !isNaN(parseFloat(obj)) && isFinite(obj); };
}
// Re-Adding the discontinued browser detection of jQuery (taken from jQuery.migrate)
jQuery.uaMatch = function( ua ) {
    ua = ua.toLowerCase();

    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
        /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
        /(msie) ([\w.]+)/.exec( ua ) ||
        ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
        [];

    return {
        browser: match[ 1 ] || "",
        version: match[ 2 ] || "0"
    };
};
if ( !jQuery.browser.chrome ) {
    var matched = jQuery.uaMatch( navigator.userAgent );
    var browser = {};

    if ( matched.browser ) {
        browser[ matched.browser ] = true;
        browser.version = matched.version;
    }

    // Chrome is Webkit, but Webkit is also Safari.
    if ( browser.chrome ) {
        browser.webkit = true;
    } else if ( browser.webkit ) {
        browser.safari = true;
    }

    jQuery.browser = browser;
}
// Detect whether the page is viewed on a mobile device
var isMobile = {
    _body: document.getElementsByTagName('body')[0],
    _android: undefined,
    _blackberry: undefined,
    _ios: undefined,
    _iemobile: undefined,
    _operamini: undefined,
    _any: undefined,

    Android: function() {
        if (this._android === undefined) {
            if ((this._android = (navigator.userAgent.match(/Android/i) !== null))) {
                this._body.className += ' Android';
            }
        }
        return this._android;
    },
    BlackBerry: function() {
        if (this._blackberry === undefined) {
            if ((this._blackberry = (navigator.userAgent.match(/BlackBerry/i) !== null))) {
                this._body.className += ' BlackBerry';
            }
        }
        return this._blackberry;
    },
    iOS: function() {
        if (this._ios === undefined) {
            if((this._ios = (navigator.userAgent.match(/iPhone|iPad|iPod/i) !== null))) {
                this._body.className += ' iOS';
            }
        }
        return this._ios;
    },
    IEMobile: function() {
        if (this._iemobile === undefined) {
            if ((this._iemobile = (navigator.userAgent.match(/IEMobile/i) !== null))) {
                this._body.className += ' IEMobile';
            }
        }
        return this._iemobile;
    },
    OperaMini: function() {
        if (this._operamini === undefined) {
            if ((this._operamini = (navigator.userAgent.match(/Opera Mini/i) !== null))) {
                this._body.className += ' OperaMini';
            }
        }
        return this._operamini;
    },
    any: function() {
        if (this._any === undefined) {
            if ((this._any = (isMobile.Android() || isMobile.iOS() || isMobile.BlackBerry() || isMobile.IEMobile() || isMobile.OperaMini()))) {
                this._body.className += ' mobile';
            }
        }
        return this._any;
    }
};
isMobile._autocall = (function() {
    isMobile.any();
})();


// Outer Code Wrapper for jQuery, prevents polluting the window object while still keeping it accessible.
;(function($, window, document, undefined) {
    "use strict";
    var $window   = $(window),
        $document = $(document),
        $body     = $('body');

    /**
     * jQuery displayWidth - A simple Media Query check
     * @param  {string} comparison   Comparison condition. Possible values: Either one these: '>', '<', '>=', '<=' or a full, complex Media Query. The latter is risky because it will fail without a fallback in browsers that do not support the matchMedia function.
     * @param  {int+} width          Display width (in pixels)
     *
     * @author Stefan Winkler
     */
    window.displayWidth = function(comparison, value){
        if(typeof window.matchMedia == 'function' && window.matchMedia!==undefined && window.matchMedia('screen and (max-width: 767px)')!==null){
            if(jQuery.isNumeric(value)){
                value = Number(value);
                if(comparison == '>='){
                    comparison = 'min-width';
                }else if(comparison == '<='){
                    comparison = 'max-width';
                }else if(comparison == '>'){
                    comparison = 'min-width';
                    value++;
                }else if(comparison == '<'){
                    comparison = 'max-width';
                    value--;
                }
                return window.matchMedia('('+comparison+':'+value+'px)').matches;
            }else{
                return window.matchMedia(value).matches;
            }
        }else{
            if(!jQuery.isNumeric(value)){
                if(typeof(console) !== 'undefined'){
                    console.log("Error: This Browser doesn't support media queries.");
                }
                return false;
            }
            if(typeof(window.current_screen_width)==='undefined'){
                window.current_screen_width = jQuery(window).outerWidth();
            }
            if(comparison == '>='){
                return window.current_screen_width >= value;
            }else if(comparison == '<='){
                return window.current_screen_width <= value;
            }else if(comparison == '>'){
                return window.current_screen_width > value;
            }else if(comparison == '<'){
                return window.current_screen_width < value;
            }
        }
    };

    /**
     * @param  {function} func      the code to be executed
     * @param  {int+} threshold     delay after trigger event (in milliseconds)
     * @param  {boolean} execAsap   forces to execute the code as soon as possible
     * @return {void}
     *
     * @author Paul Irish
     * @see http://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/
     */
    var debounce = function (func, threshold, execAsap) {
        var timeout;

        return function () {
            var obj = this, args = arguments;
            function delayed () {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null;
            }

            if (timeout)
                clearTimeout(timeout);
            else if (execAsap)
                func.apply(obj, args);

            timeout = setTimeout(delayed, threshold || 100);
        };
    };

    /**
     * jQuery debounceEvent function
     * @param  {string} event       The event to be bound
     * @param  {int+} threshold     The delay after the trigger event (in milliseconds)
     * @param  {boolean} execAsap   Forces the code to be executed as soon as possible
     *
     * @author Paul Irish
     * @see http://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/
     */
    $.fn.debounceEvent = function(event, func, threshold, execAsap){
        return func ? this.bind(event, debounce(func, threshold, execAsap)) : this.trigger(event);
    };

    var resizingHandler = function(force) {
        var execute = typeof(force) === 'undefined' ? false : (force === true);
        var new_width = $(window).outerWidth();
        if(execute || new_width != window.current_window_width){
            if(!execute){
                window.current_window_width = new_width;
            }
			$('body').removeClass('pushed-left').removeClass('pushed-left-alt');
            setTimeout(function(){
                $('.slider-overlay').each(function(){
                    var $so  = $(this);
                    var $fs  = $so.next('flexslider').children('.flex-viewport').first();
                    var so_h = $so.outerHeight();
                    var fs_h = $fs.outerHeight();
                    if(so_h > fs_h){
                        $so.css({'min-height': fs_h+'px'});
                    }else{
                        $so.removeAttr('style');
                    }
                });
            }, 420);
        }
    };

    var init_polyfills = function(){
        if(!Modernizr.csstransitions){
            $('.element.hybrid').on('mouseover', function(e){
                $(this).children('.images').stop().animate({right: '-100%'}, 420);
            }).on('mouseout', function(e){
                $(this).children('.images').stop().animate({right: '-0%'}, 420);
            });
        }
    };

    // Ready Event

    $document.ready(function(){
        window.current_window_width = 0;
        $window.debounceEvent('resize', resizingHandler, 120);

        var alternate_menu_behavior = $.browser.safari || isMobile.iOS();

        // main menu logic
        $('#menu-button, #menu-close-button').on('click touchend', function(e){
            e.preventDefault();
            if(alternate_menu_behavior){
                $('body').toggleClass('pushed-left-alt');
            }else{
                $('body').toggleClass('pushed-left');
            }
        });
		$('#options li a').on('click', function(e){
            e.preventDefault();
            if(alternate_menu_behavior){
                $('body').toggleClass('pushed-left-alt');
            }else{
                $('body').toggleClass('pushed-left');
            }
        });
        $('body').on('click touchend', function(e){
            var $body = $(this);
            var $target = $(e.target);
            if(($body.hasClass('pushed-left-alt') || $body.hasClass('pushed-left')) && $target.closest('#main-nav').length === 0 && $target.closest('#menu-button').length === 0){
                e.preventDefault();
                $body.removeClass('pushed-left-alt').removeClass('pushed-left');
            }
        });
        $('.sub-nav-toggle').on('click touchend', function(e){
            e.preventDefault();
            var $subNav = $(this).next('.sub-nav');
            if($subNav.hasClass('hidden')){
                $subNav.hide().removeClass('hidden').stop().slideDown(420);
            }else{
           //     $subNav.stop().slideUp(420, function(){
           //         $(this).addClass('hidden');
           //     });
            }
        });
        /* Form validation requirement to prevent validation before the form was interacted with */
        $('.unfocused').on('blur', function(e){
            if($(this).hasClass('unfocused')){
                $(this).removeClass('unfocused');
            }
        });
        $('.slider-wrapper img').on('dragstart', function(event) { event.preventDefault(); });
        $('.slider-overlay').swipe( {
            swipe:function(event, direction, distance, duration, fingerCount, fingerData) {
                if(direction == 'left'){
                    $(this).next('.flexslider').flexslider('next');
                }else if(direction == 'right'){
                    $(this).next('.flexslider').flexslider('prev');
                }
            },
            threshold:64
        });
        init_polyfills();

        resizingHandler(true);
        debounce(resizingHandler, 160, false);
    });

})(jQuery, window, document);