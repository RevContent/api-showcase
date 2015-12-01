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
    window.RevToaster = factory(window, window.revUtils, window.revDetect, window.revApi);

}( window, function factory(window, revUtils, revDetect, revApi) {
'use strict';

    // ----- vars ----- //

    var RevToaster;
    var instance;

    var defaults = {
        testing: false,
        header: 'Trending Today',
        closed_hours: 24,
        sponsored: 1,
        url: 'https://trends.revcontent.com/api/v1/',
        rev_position: 'bottom_right',
        devices: [
            'phone', 'tablet', 'desktop'
        ]
    };
    // var options;
    var lastScrollTop = 0;
    var scrollTimeout;
    var loaded = false;
    var removed = false;

    var RevToaster = function( opts ) {
        if (instance) {
            instance.update(opts, instance.options);
            return instance;
        }

        // if it wasn't newed up
        if ( !( this instanceof RevToaster ) ) {
            instance = new RevToaster(opts);
            return instance;
        } else {
            instance = this;
        }

        // merge options
        this.options = revUtils.extend(defaults, opts);
        this.options.sponsored = (this.options.sponsored > 2) ? 2 : this.options.sponsored;

        // param errors
        if (revUtils.validateApiParams(this.options).length) {
            return;
        }
        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        if (revUtils.getCookie('revtoaster-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-toaster');

        var that = this;

        this.init = function() {
            this.revToaster = document.createElement('div');
            this.revToaster.className = 'rev-toaster';

            this.containerElement = document.createElement('div');
            this.containerElement.className = 'rev-content-container';
            revUtils.append(this.revToaster, this.containerElement);

            if (this.options.sponsored > 1) {
                revUtils.addClass(this.revToaster, 'rev-toaster-multi');
            }

            this.appendElements();

            for (var i = 0; i < this.options.sponsored; i++) {
                this.appendCell();
            };

            this.bindClose();

            revUtils.append(document.body, that.revToaster);

            // window.addEventListener('scroll', this.move); // for debugging

            window.addEventListener('touchmove', this.move);
        };

        this.update = function(newOpts, oldOpts) {
            this.options = revUtils.extend(defaults, newOpts);

            if (this.visible != newOpts.visible) {
                if (newOpts.visible) {
                    this.show();
                } else {
                    this.hide();
                }
            }

            if ((this.options.header !== oldOpts.header) || this.options.rev_position !== oldOpts.rev_position) {
                this.appendElements();
            }

            if (this.options.sponsored !== oldOpts.sponsored) {
                if (this.options.sponsored > oldOpts.sponsored) {
                    this.appendCell();
                } else {
                    var nodes = this.revToaster.querySelectorAll('.rev-content');
                    revUtils.remove(nodes[1]);
                }
                this.getData();
            }
        };

        this.appendElements = function() {
            if (this.header) {
                revUtils.remove(this.header);
            }

            this.header = document.createElement('div');
            this.header.className = 'rev-header';
            this.header.innerHTML = that.options.header;

            revUtils.append(that.revToaster, this.header);

            if (!this.closeButton) {
                this.closeButton = document.createElement('button');
                this.closeButton.className = 'rev-close';
                this.closeButton.innerHTML = '<div class="icon">' +
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
                                    '</div>';

                revUtils.append(that.revToaster, this.closeButton);
            }

            if (this.sponsored) {
                revUtils.remove(this.sponsored);
            }
            this.sponsored = document.createElement('div');
            this.sponsored.className = 'rev-sponsored';
            this.sponsored.innerHTML = '<a onclick="revDialog.showDialog()">Sponsored by Revcontent</a>';

            if (this.options.rev_position == 'top_right') {
                revUtils.addClass(this.sponsored, 'top-right')
                revUtils.prepend(this.revToaster, this.sponsored);
            } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
                revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
                revUtils.append(this.revToaster, this.sponsored);
            }
        };

        this.move = function() {
            if (removed) {
                window.removeEventListener('touchmove', this.move);
                return;
            }

            if (scrollTimeout) {
                return;
            }

            function delayed() {

                var scrollTop = window.pageYOffset,
                    scrollDirection = (scrollTop < lastScrollTop) ? 'up' : 'down';

                if (scrollDirection === 'up') {
                    if (!loaded) {
                        that.getData(true);
                    } else {
                        that.show();
                    }
                } else if (scrollDirection === 'down') {
                    that.hide();

                }
                lastScrollTop = scrollTop;
                scrollTimeout = false;
            }

            scrollTimeout = setTimeout( delayed, 300);
        };

        this.appendCell = function() {
            var html = '<div class="rev-ad">' +
                        '<a href="" target="_blank">' +
                            '<div class="rev-image">' +
                                '<img src=""/>' +
                            '</div>' +
                            '<div class="rev-headline">' +
                                '<h3></h3>' +
                            '</div>' +
                            '<div class="rev-provider"></div>' +
                        '</a>' +
                    '</div>';
            var cell = document.createElement('div');

            revUtils.addClass(cell, 'rev-content');

            cell.innerHTML = html;

            that.containerElement.appendChild(cell);
        };

        this.getData = function(show) {
            loaded = true;
            var url = this.options.url + '?api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&sponsored_count=' + this.options.sponsored + '&sponsored_offset=0&internal_count=0&api_source=toast';

            var that = this;

            revApi.request(url, function(resp) {

                var ads = that.containerElement.querySelectorAll('.rev-ad');

                for (var i = 0; i < resp.length; i++) {
                    var ad = ads[i],
                        data = resp[i];
                    ad.querySelectorAll('a')[0].setAttribute('href', data.url);
                    ad.querySelectorAll('img')[0].setAttribute('src', data.image);
                    ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
                    ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
                }
                if (show) {
                    that.show();
                }
            });
        };

        this.bindClose = function() {
            if (!this.options.closed_hours) {
                return false;
            }
            var that = this;

            this.closeButton.addEventListener('click', function(e) {
                revUtils.removeClass(document.body, 'rev-toaster-loaded');
                setTimeout(function() {
                    that.revToaster.parentNode.removeChild(that.revToaster);
                    removed = true;
                    revUtils.setCookie('revtoaster-closed', 1, (that.options.closed_hours / 24));
                }, 2000);
            });
        };

        this.show = function() {
            if (!loaded) {
                this.getData(true);
            } else {
                var that = this;
                imagesLoaded( this.containerElement, function() {
                    that.visible = true;
                    revUtils.addClass(document.body, 'rev-toaster-loaded');
                });
            }
        };

        this.hide = function() {
            this.visible = false;
            revUtils.removeClass(document.body, 'rev-toaster-loaded');
        };

        this.init();
    };

    return RevToaster;

}));