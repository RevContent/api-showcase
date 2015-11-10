/*
ooooooooo.                          .oooooo..o oooo   o8o        .o8
`888   `Y88.                       d8P'    `Y8 `888   `"'       "888
 888   .d88'  .ooooo.  oooo    ooo Y88bo.       888  oooo   .oooo888   .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'   `"Y8888o.   888  `888  d88' `888  d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        `"Y88b  888   888  888   888  888ooo888  888
 888  `88b.  888    .o    `888'    oo     .d8P  888   888  888   888  888    .o  888
o888o  o888o `Y8bod8P'     `8'     8""88888P'  o888o o888o `Y8bod88P" `Y8bod8P' d888b

Project: RevSlider
Version: 1
Author: michael@revcontent.com

RevSlider({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    show_arrows: {
        mobile: false,
        desktop: true
    },
    perRow: {
        xxs: 1,
        xs: 1,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
        xxl: 7
    },
    image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
    rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
    internal: false,
    header: 'Trending Now',
    devices: [
        'phone', 'tablet', 'desktop'
    ],
    url: 'https://trends.revcontent.com/api/v1/'
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevSlider = factory(window, window.revUtils, window.revDetect, window.revApi);

}( window, function factory(window, revUtils, revDetect, revApi) {
'use strict';

    var RevSlider = function(opts) {

        var defaults = {
            element: false,
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            show_arrows: {
                mobile: false,
                desktop: true
            },
            sponsored: 10,
            internal: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/'
        };

        // merge options
        this.options = revUtils.extend(defaults, opts);

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-slider');

        var backBtn = document.createElement('div');
        backBtn.id = "back";
        backBtn.innerHTML = '<button id="btn-back" class="btn btn-primary"><</button>';

        var forwardBtn = document.createElement('div');
        forwardBtn.id = "forward";
        forwardBtn.innerHTML = '<button id="btn-forward" class="btn btn-primary">></button>';

        var containerElement = document.createElement('div');
        containerElement.id = 'rev-slider';
        containerElement.class = 'rev-slider';

        var gridElement = document.createElement('div');
        gridElement.id = 'rev-slider-grid';

        var element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        element.style.width = '100%';

        revUtils.append(containerElement, backBtn);
        revUtils.append(containerElement, gridElement);
        revUtils.append(containerElement, forwardBtn);
        revUtils.append(element, containerElement);

        var grid = new AnyGrid(gridElement, { masonry: false, perRow: this.options.per_row });

        var page = 1,
            limit = grid.getPerRow() * 2,
            resizeTimeout;

        grid.on('resized', function() {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            function delay() {
                var newLimit = grid.getPerRow() * 2;
                if (newLimit != limit) {
                    limit = newLimit;
                    setData();
                }
                resizeTimeout = false;
            }
            resizeTimeout = setTimeout(delay, 300);
        });

        var fade = function(fade) {
            var children = gridElement.children;
            for (var i = 0; i < children.length; i++) {
              var child = children[i];
              child.classList.add(fade);
            }
        }

        var setData = function() {
            var minDelay = (gridElement.children.length > 0) ? 300 : 0;
            var start = new Date();
            var url = 'https://trends.revcontent.com/api/v1/?api_key=3eeb00d786e9a77bbd630595ae0be7e9aa7aff3b&pub_id=945&widget_id=6181&domain=apiexamples.powr.com&sponsored_count=' + limit + '&sponsored_offset=' + ((page * limit) - limit) + '&internal_count=0';

            fade('fadeOut');

            var request = new XMLHttpRequest();

            request.open('GET', url, true);

            request.onload = function() {
              if (request.status >= 200 && request.status < 400) {

                var respond = function() {
                    var resp = JSON.parse(request.responseText);
                    var loader = document.createElement('div');
                    var containerHtml = '';
                    for (var i in resp) {
                        var node = document.createElement('div');
                        var html = '<div style="opacity:0"><a href="'+ resp[i].url +'"><img class="img-responsive" src="'+ resp[i].image +'"/><h3>'+ resp[i].headline +'</h3></a></div>';
                        node.innerHTML = html;
                        containerHtml += html;
                        loader.appendChild(node);
                    }
                    imagesLoaded( loader, function() {
                        gridElement.innerHTML = containerHtml;
                        fade('fadeIn');

                        grid.reloadItems();
                        grid.layout();
                    });
                }

                var end = new Date();
                var requestTime = end - start;
                if (requestTime  < minDelay) {
                    setTimeout(function() { respond(); }, minDelay - requestTime );
                } else {
                    respond();
                }
              } else {
                // error
              }
            };

            request.onerror = function() {

            };

            request.send();
        };

        setData();

        document.getElementById('btn-forward').addEventListener('click', function() {
            page = page + 1;
            setData();
        });

        document.getElementById('btn-back').addEventListener('click', function() {
            page = Math.max(1, page - 1);
            setData();
        });
    };

    return RevSlider;
}));
