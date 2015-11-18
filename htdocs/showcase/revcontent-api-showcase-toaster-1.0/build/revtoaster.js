/*
ooooooooo.                         ooooooooooooo                                  .
`888   `Y88.                       8'   888   `8                                .o8
 888   .d88'  .ooooo.  oooo    ooo      888       .ooooo.   .oooo.    .oooo.o .o888oo  .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'       888      d88' `88b `P  )88b  d88(  "8   888   d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        888      888   888  .oP"888  `"Y88b.    888   888ooo888  888
 888  `88b.  888    .o    `888'         888      888   888 d8(  888  o.  )88b   888 . 888    .o  888
o888o  o888o `Y8bod8P'     `8'         o888o     `Y8bod8P' `Y888""8o 8""888P'   "888" `Y8bod8P' d888b

Project: RevToaster
Version: 1
Author: michael@revcontent.com

RevToaster({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    header: 'Trending Today',
    closed_hours: 24,
    sponsored: 2,
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevToaster = factory(window);

}( window, function factory(window) {
'use strict';

    // ----- vars ----- //

    var options;
    var lastScrollTop = 0;
    var scrollTimeout;
    var loading = false;
    var removed = false;
    var revToaster;

    function RevToaster( opts ) {
        options = extend(RevToaster.defaults, opts);

        if (validateApiParams(options).length) {
            return;
        }

        if (getCookie('revtoaster-closed') && !options.testing) {
            return;
        }

        appendStyle();

        options.sponsored = (options.sponsored > 2) ? 2 : options.sponsored;

        revToaster = document.createElement('div');
        addClass(revToaster, 'rev-toaster');
        if (options.sponsored > 1) {
            addClass(revToaster, 'rev-toaster-multi');
        }

        window.addEventListener('touchmove', move);
    };

    RevToaster.defaults = {
        testing: false,
        header: 'Trending Today',
        closed_hours: 24,
        sponsored: 1,
        url: 'https://trends.revcontent.com/api/v1/'
    };

    var appendStyle = function() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '/* inject:css */.rev-toaster{-ms-overflow-style:-ms-autohiding-scrollbar;-webkit-text-size-adjust:100%;text-size-adjust:100%;box-sizing:border-box;cursor:default;text-rendering:optimizeLegibility;background:rgba(0,0,0,.89);position:fixed;-webkit-transition:.5s;transition:.5s;width:100%;padding-top:3px;padding-left:3px;bottom:-20px;transform:translateY(100%);-ms-transform:translateY(100%);-moz-transform:translateY(100%);-o-transform:translateY(100%);-webkit-transform:translateY(100%)}.rev-toaster *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}.rev-toaster a,.rev-toaster a:focus,.rev-toaster a:hover{text-decoration:none}body.rev-toaster-loaded{margin:0}body.rev-toaster-loaded .rev-toaster{bottom:0;transform:none;-ms-transform:none;-moz-transform:none;-o-transform:none;-webkit-transform:none;z-index:2147483647}.rev-toaster .rev-header{position:absolute;background:#000;line-height:20px;top:-20px;left:-3px;color:#fff;font-size:10px;padding:0 4px 0 6px;border-top:1px solid #4CC93D;font-weight:500;letter-spacing:.1px}.rev-toaster .rev-header:after,.rev-toaster .rev-header:before{border-right:solid 10px transparent;border-top:solid 10px transparent;box-sizing:border-box;display:block;position:absolute;width:20px;height:20px;top:0;right:-20px;content:""}.rev-toaster .rev-header:before{border-left:solid 10px transparent;border-bottom:solid 10px transparent}.rev-toaster .rev-header:after{border-bottom:solid 10px #000;border-left:solid 10px #000}.rev-toaster .rev-footer{text-align:right;font-weight:300;font-size:10px;line-height:16px;opacity:.4;clear:both}.rev-toaster .rev-footer a{letter-spacing:.1px;color:#fff;padding:0 6px 3px;display:inline-block}.rev-toaster .rev-footer a span{color:#4CC93D}.rev-toaster .rev-ad{padding-bottom:3px;margin-right:36px;clear:left}.rev-toaster .rev-ad a{display:block}.rev-toaster .rev-image{height:75px;float:left;margin-right:10px}.rev-toaster .rev-image img{max-width:100%;max-height:100%;border:1px solid #000;margin:0 auto;display:inline-block;vertical-align:middle}.rev-toaster .rev-headline{max-height:40px;overflow:hidden}.rev-toaster .rev-headline h3{color:#fff;font-size:16px;font-weight:500;letter-spacing:.2px;line-height:20px;margin:0}.rev-toaster .rev-provider{font-size:12px;color:#888;line-height:30px}.rev-toaster button.rev-close{outline:0;border:0;display:inline-table;background:#6D6D6D;white-space:nowrap;cursor:pointer;box-shadow:0 2px 5px 0 rgba(0,0,0,.26);box-sizing:border-box;color:currentColor;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:20;vertical-align:middle;border-radius:50%;background-clip:padding-box;overflow:hidden;-webkit-transition:.2s linear;transition:.2s linear;-webkit-transition-property:background-color,box-shadow;transition-property:background-color,box-shadow;line-height:30px;width:30px;height:30px;position:absolute;top:-15px;right:8px}.rev-toaster button.rev-close .icon{margin:-2px auto auto;background-repeat:no-repeat no-repeat;fill:currentColor;height:30px;width:30px;color:#c5c5c5}.rev-toaster button.rev-close .icon svg{vertical-align:middle;width:15px;height:15px}/* endinject */';
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    var getData = function() {
        loading = true;
        var url = options.url + '?api_key='+ options.api_key +'&pub_id='+ options.pub_id +'&widget_id='+ options.widget_id +'&domain='+ options.domain +'&sponsored_count=' + options.sponsored + '&sponsored_offset=0&internal_count=0&api_source=toast';

        var request = new XMLHttpRequest();

        request.open('GET', url, true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                var resp = JSON.parse(request.responseText);

                var html = '<div class="rev-header">' + options.header + '</div>' +
                            '<button class="rev-close">' +
                                '<div class="icon">' +
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
                                '</div>' +
                            '</button>';

                html += '<div class="rev-content">';

                for (var i = 0; i < resp.length; i++) {
                    html += '<div class="rev-ad">' +
                                '<a rel="nofollow" href="'+ resp[i].url +'">' +
                                    '<div class="rev-image"><img src="'+ resp[i].image +'"/></div>' +
                                    '<div class="rev-headline"><h3>'+ resp[i].headline +'</h3></div>' +
                                    '<div class="rev-provider">'+ resp[i].brand +'</div>' +
                                '</a>' +
                            '</div>';
                }

                html += '</div>';

                html += '<div class="rev-footer"><a href="http://revcontent.com">Sponsored by Revcontent</a></div>';

                revToaster.innerHTML = html;

                document.getElementsByTagName('body')[0].appendChild(revToaster);

                imagesLoaded( revToaster, function() {
                    addClass(document.body, 'rev-toaster-loaded');
                    loading = false;
                    bindClose();
                });
            } else {
                //error
            }
        };

        request.onerror = function() {
            //error
        };

        request.send();
    };

    var bindClose = function() {
        if (!options.closed_hours) {
            return false;
        }
        document.querySelector('.rev-close').addEventListener('click', function(e) {
            removeClass(document.body, 'rev-toaster-loaded');
            setTimeout(function() {
                revToaster.parentNode.removeChild(revToaster);
                removed = true;
                setCookie('revtoaster-closed', 1, (options.closed_hours / 24));
            }, 2000);
        });
    };

    var move = function() {
        if (removed) {
            window.removeEventListener('touchmove', move);
            return;
        }

        if (loading || scrollTimeout) {
            return;
        }

        function delayed() {

            var scrollTop = window.pageYOffset,
                scrollDirection = (scrollTop < lastScrollTop) ? 'up' : 'down';

            if (scrollDirection === 'up' &&
                document.querySelector('.rev-toaster') === null) {

                getData();

            } else if (scrollDirection === 'down' &&
                document.querySelector('.rev-toaster') !== null &&
                hasClass(document.body, 'rev-toaster-loaded')) {

                removeClass(document.body, 'rev-toaster-loaded');

            } else if (scrollDirection === 'up' &&
                document.querySelector('.rev-toaster') !== null &&
                !hasClass(document.body, 'rev-toaster-loaded')) {

                addClass(document.body, 'rev-toaster-loaded');
            }
            lastScrollTop = scrollTop;
            scrollTimeout = false;
        }

        scrollTimeout = setTimeout( delayed, 300);

    };

    var validateApiParams = function(params) {
        var errors = [];
        if (!params.sponsored){
            errors.push('sponsored');
        }
        if (!params.api_key){
            errors.push('api_key');
        }
        if (!params.pub_id){
            errors.push('pub_id');
        }
        if (!params.widget_id){
            errors.push('widget_id');
        }
        if (!params.domain){
            errors.push('domain');
        }
        return errors;
    }

    var extend = function( a, b ) {
      for ( var prop in b ) {
        a[ prop ] = b[ prop ];
      }
      return a;
    };

    var setCookie = function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    };

    var getCookie = function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    };

    var hasClass = function(el, className) {
        if (el.classList)
          return el.classList.contains(className);
        else
          return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }

    var addClass = function(el, className) {
        if (el.classList)
          el.classList.add(className);
        else
          el.className += ' ' + className;
    };

    var removeClass = function(el, className) {
        if (el.classList)
            el.classList.remove(className);
        else
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    };

    return RevToaster;

}));