( function( window, factory ) {
  'use strict';
    window.RevToaster = factory();

}( window, function factory() {
'use strict';

    var options;
    var lastScrollTop = 0;
    var scrollTimeout;
    var loading = false;
    var removed = false;

    function RevToaster( opts ) {
        options = extend(RevToaster.defaults, opts);
        options.sponsored = Math.max(options.sponsored, 2);

        window.addEventListener('scroll', onScroll);
    };

    RevToaster.defaults = {
        sponsored: 1
    };

    var extend = function( a, b ) {
      for ( var prop in b ) {
        a[ prop ] = b[ prop ];
      }
      return a;
    };

    var addClass = function(el, className) {
        if (el.classList)
          el.classList.add(className);
        else
          el.className += ' ' + className;
    }

    var removeClass = function(el, className) {
        if (el.classList)
            el.classList.remove(className);
        else
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }

    var getData = function() {
        loading = true;
        var url = 'https://trends.revcontent.com/api/v1/?api_key=3eeb00d786e9a77bbd630595ae0be7e9aa7aff3b&pub_id=945&widget_id=6181&domain=apiexamples.powr.com&sponsored_count=' + options.sponsored + '&sponsored_offset=0&internal_count=0';

        var request = new XMLHttpRequest();

        request.open('GET', url, true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                var resp = JSON.parse(request.responseText);

                var revToaster = document.createElement('div');
                addClass(revToaster, 'rev-toaster');

                if (options.sponsored > 1) {
                    addClass(revToaster, 'rev-toaster-multi');
                }

                var html = '<div class="rev-by">Sponsored by RevContent</div>' +
                            '<button class="rev-close">' +
                                '<div class="icon">' +
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z"/></svg>' +
                                '</div>' +
                            '</button>';

                for (var i = 0; i < resp.length; i++) {
                    html += '<div class="rev-ad"><a href="'+ resp[i].url +'"><div class="rev-image"><img src="'+ resp[i].image +'"/></div><div class="rev-headline"><h3>'+ resp[i].headline +'</h3></div></a></div>';
                    revToaster.innerHTML = html;
                }

                imagesLoaded( revToaster, function() {
                    document.getElementsByTagName('body')[0].appendChild(revToaster);
                    revToaster.style.bottom = ((revToaster.offsetHeight + 28) * -1) + 'px';
                    setTimeout(function() {
                        addClass(revToaster, 'rev-toaster-loaded');
                        loading = false;
                    }, 1);
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
    }

    var bindClose = function() {
        document.querySelector('.rev-close').addEventListener('click', function(e) {
            removed = true;

            var revToaster = document.querySelector('.rev-toaster');
            removeClass(revToaster, 'rev-toaster-loaded');
            setTimeout(function() {
                revToaster.parentNode.removeChild(revToaster);
            }, 2000);
        });
    }

    var onScroll = function() {
        if (removed) {
            window.removeEventListener('scroll', onScroll);
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
                document.querySelector('.rev-toaster-loaded') !== null) {

                var revToaster = document.querySelector('.rev-toaster');
                removeClass(revToaster, 'rev-toaster-loaded');

            } else if (scrollDirection === 'up' &&
                document.querySelector('.rev-toaster') !== null &&
                document.querySelector('.rev-toaster-loaded') === null) {

                var revToaster = document.querySelector('.rev-toaster');
                addClass(revToaster, 'rev-toaster-loaded');

            }
            lastScrollTop = scrollTop;
            scrollTimeout = false;
        }

        scrollTimeout = setTimeout( delayed, 300);

    }

    return RevToaster;

}));