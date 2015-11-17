/*
ooooooooo.                          .oooooo..o  o8o        .o8
`888   `Y88.                       d8P'    `Y8  `"'       "888
 888   .d88'  .ooooo.  oooo    ooo Y88bo.      oooo   .oooo888   .ooooo.  ooo. .oo.    .oooo.   oooo    ooo
 888ooo88P'  d88' `88b  `88.  .8'   `"Y8888o.  `888  d88' `888  d88' `88b `888P"Y88b  `P  )88b   `88.  .8'
 888`88b.    888ooo888   `88..8'        `"Y88b  888  888   888  888ooo888  888   888   .oP"888    `88..8'
 888  `88b.  888    .o    `888'    oo     .d8P  888  888   888  888    .o  888   888  d8(  888     `888'
o888o  o888o `Y8bod8P'     `8'     8""88888P'  o888o `Y8bod88P" `Y8bod8P' o888o o888o `Y888""8o     `8'


Project: RevSidenav
Version: 1
Author: michael@revcontent.com

RevSidenav({
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
    window.RevSidenav = factory(window, window.revUtils, window.revDetect, window.revApi);

}( window, function factory(window, revUtils, revDetect, revApi) {
'use strict';

    // ----- vars ----- //
    var lastScrollTop = 0;
    var scrollTimeout;
    var loading = false;
    var removed = false;
    var revSidenav;

    function RevSidenav( opts ) {
        var defaults = {
            testing: false,
            width: 300,
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            inner_widget: {
                name: 'slider',
                options: {
                    per_row: {
                        xxs: 2,
                        xs: 2,
                        sm: 3,
                        md: 4,
                        lg: 5,
                        xl: 6,
                        xxl: 7
                    },
                    rows: 10
                }
            },
            image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            sponsored: 10,
            internal: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/'
        };

        // HALT if already on the page
        if (document.getElementById('rev-sidenav')) {
            return;
        }

        this.visible = false;

        // merge options
        this.options = revUtils.extend(defaults, opts);
        // param errors
        if (revUtils.validateApiParams(this.options).length) {
            return;
        }
        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        if (revUtils.getCookie('revsidenav-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */.rev-sidenav{-ms-overflow-style:-ms-autohiding-scrollbar;-webkit-text-size-adjust:100%;text-size-adjust:100%;box-sizing:border-box;cursor:default;text-rendering:optimizeLegibility;background:#fff;position:fixed;-webkit-transition:.5s;transition:.5s;width:100%;padding:30px 10px 10px;bottom:0;right:0;-webkit-transition-property:-webkit-transform;transition-property:transform;transform:translateX(100%);-ms-transform:translateX(100%);-moz-transform:translateX(100%);-o-transform:translateX(100%);-webkit-transform:translateX(100%);overflow-y:scroll;border-left:1px solid #dcdcdc}.rev-sidenav .rev-close{position:absolute;top:0;right:0;cursor:pointer;padding:10px;fill:#555}.rev-sidenav *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}.rev-sidenav a,.rev-sidenav a:focus,.rev-sidenav a:hover{text-decoration:none}body.rev-sidenav-loaded{margin:0}body.rev-sidenav-open .rev-sidenav{top:0;right:0;transform:none;-ms-transform:none;-moz-transform:none;-o-transform:none;-webkit-transform:none;z-index:2147483647}/* endinject */', 'rev-sidenav');

        this.sidenavElement = document.createElement('div');
        this.innerWidgetElement = document.createElement('div');
        this.sidenavElement.style.width = this.options.width + 'px';
        this.sidenavElement.style.zIndex = '10001';
        this.sidenavElement.style.height = '100%';
        this.sidenavElement.id = 'rev-sidenav';
        this.sidenavElement.setAttribute('class', 'rev-sidenav');

        this.closeElement = document.createElement('div');
        this.closeElement.setAttribute('class', 'rev-close');
        this.closeElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>';
        revUtils.append(this.sidenavElement, this.closeElement);

        revUtils.append(this.sidenavElement, this.innerWidgetElement);

        document.getElementsByTagName('body')[0].appendChild(this.sidenavElement);


        this.innerWidget = new RevSlider({
            element: [this.innerWidgetElement],
            url: 'http://trends.revcontent.com/api/v1/',
            api_key : 'bf3f270aa50d127f0f8b8c92a979d76aa1391d38',
            pub_id : 7846,
            widget_id : 13523,
            domain : 'bustle.com',
            rev_position: 'top_right',
            per_row: this.options.inner_widget.options.per_row,
            rows: this.options.inner_widget.options.rows
        });

        this.attachButtonEvents();

        // window.addEventListener('touchmove', move);
    };

    RevSidenav.prototype.update = function(newOpts, oldOpts) {
        this.options = revUtils.extend(this.options, newOpts);

        if (this.visible != newOpts.visible) {
            if (newOpts.visible) {
                this.show();
            } else {
                this.hide();
            }
        }

        if (newOpts.width !== oldOpts.width) {
            this.sidenavElement.style.width = this.options.width + 'px';
        }

        if (newOpts.width !== oldOpts.width) {
            this.innerWidget.resize();
        }

        if ( (newOpts.size !== oldOpts.size) || (newOpts.realSize !== oldOpts.realSize) || (newOpts.inner_widget.options.per_row !== oldOpts.inner_widget.options.per_row) || (newOpts.inner_widget.options.rows !== oldOpts.inner_widget.options.rows)) {
            this.innerWidget.update(newOpts.inner_widget.options,  oldOpts.inner_widget.options);
        }
    };


    RevSidenav.prototype.show = function() {
        this.visible = true;
        revUtils.addClass(document.body, 'rev-sidenav-open');
    }

    RevSidenav.prototype.hide = function() {
        this.visible = false;
        revUtils.removeClass(document.body, 'rev-sidenav-open');
    }

    RevSidenav.prototype.attachButtonEvents = function() {
        var that = this;
        this.closeElement.addEventListener('click', function() {
            that.hide();
        });
    }

    // var appendStyle = function() {
    //     var style = document.createElement('style');
    //     style.type = 'text/css';
    //     style.innerHTML = '/* inject:css */.rev-sidenav{-ms-overflow-style:-ms-autohiding-scrollbar;-webkit-text-size-adjust:100%;text-size-adjust:100%;box-sizing:border-box;cursor:default;text-rendering:optimizeLegibility;background:#fff;position:fixed;-webkit-transition:.5s;transition:.5s;width:100%;padding:30px 10px 10px;bottom:0;right:0;-webkit-transition-property:-webkit-transform;transition-property:transform;transform:translateX(100%);-ms-transform:translateX(100%);-moz-transform:translateX(100%);-o-transform:translateX(100%);-webkit-transform:translateX(100%);overflow-y:scroll;border-left:1px solid #dcdcdc}.rev-sidenav .rev-close{position:absolute;top:0;right:0;cursor:pointer;padding:10px;fill:#555}.rev-sidenav *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}.rev-sidenav a,.rev-sidenav a:focus,.rev-sidenav a:hover{text-decoration:none}body.rev-sidenav-loaded{margin:0}body.rev-sidenav-open .rev-sidenav{top:0;right:0;transform:none;-ms-transform:none;-moz-transform:none;-o-transform:none;-webkit-transform:none;z-index:2147483647}/* endinject */';
    //     document.getElementsByTagName('head')[0].appendChild(style);
    // }

    // var getData = function() {
    //     loading = true;
    //     var url = options.url + '?api_key='+ options.api_key +'&pub_id='+ options.pub_id +'&widget_id='+ options.widget_id +'&domain='+ options.domain +'&sponsored_count=' + options.sponsored + '&sponsored_offset=0&internal_count=0&api_source=toast';

    //     var request = new XMLHttpRequest();

    //     request.open('GET', url, true);

    //     request.onload = function() {
    //         if (request.status >= 200 && request.status < 400) {
    //             var resp = JSON.parse(request.responseText);

    //             var html = '<div class="rev-header">' + options.header + '</div>' +
    //                         '<button class="rev-close">' +
    //                             '<div class="icon">' +
    //                                 '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
    //                             '</div>' +
    //                         '</button>';

    //             html += '<div class="rev-content">';

    //             for (var i = 0; i < resp.length; i++) {
    //                 html += '<div class="rev-ad">' +
    //                             '<a href="'+ resp[i].url +'">' +
    //                                 '<div class="rev-image"><img src="'+ resp[i].image +'"/></div>' +
    //                                 '<div class="rev-headline"><h3>'+ resp[i].headline +'</h3></div>' +
    //                                 '<div class="rev-provider">'+ resp[i].brand +'</div>' +
    //                             '</a>' +
    //                         '</div>';
    //             }

    //             html += '</div>';

    //             html += '<div class="rev-footer"><a href="http://revcontent.com">Sponsored by Revcontent</a></div>';

    //             revSidenav.innerHTML = html;

    //             document.getElementsByTagName('body')[0].appendChild(revSidenav);

    //             imagesLoaded( revSidenav, function() {
    //                 addClass(document.body, 'rev-sidenav-loaded');
    //                 loading = false;
    //                 bindClose();
    //             });
    //         } else {
    //             //error
    //         }
    //     };

    //     request.onerror = function() {
    //         //error
    //     };

    //     request.send();
    // };

    // var bindClose = function() {
    //     if (!options.closed_hours) {
    //         return false;
    //     }
    //     document.querySelector('.rev-close').addEventListener('click', function(e) {
    //         removeClass(document.body, 'rev-sidenav-loaded');
    //         setTimeout(function() {
    //             revSidenav.parentNode.removeChild(revSidenav);
    //             removed = true;
    //             setCookie('revsidenav-closed', 1, (options.closed_hours / 24));
    //         }, 2000);
    //     });
    // };

    // var move = function() {
    //     if (removed) {
    //         window.removeEventListener('touchmove', move);
    //         return;
    //     }

    //     if (loading || scrollTimeout) {
    //         return;
    //     }

    //     function delayed() {

    //         var scrollTop = window.pageYOffset,
    //             scrollDirection = (scrollTop < lastScrollTop) ? 'up' : 'down';

    //         if (scrollDirection === 'up' &&
    //             document.querySelector('.rev-sidenav') === null) {

    //             getData();

    //         } else if (scrollDirection === 'down' &&
    //             document.querySelector('.rev-sidenav') !== null &&
    //             hasClass(document.body, 'rev-sidenav-loaded')) {

    //             removeClass(document.body, 'rev-sidenav-loaded');

    //         } else if (scrollDirection === 'up' &&
    //             document.querySelector('.rev-sidenav') !== null &&
    //             !hasClass(document.body, 'rev-sidenav-loaded')) {

    //             addClass(document.body, 'rev-sidenav-loaded');
    //         }
    //         lastScrollTop = scrollTop;
    //         scrollTimeout = false;
    //     }

    //     scrollTimeout = setTimeout( delayed, 300);

    // };

    return RevSidenav;

}));