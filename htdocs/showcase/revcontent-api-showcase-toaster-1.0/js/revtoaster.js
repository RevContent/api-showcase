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
    disclosure_text: revDisclose.defaultDisclosureText,
    hide_provider: false,
    beacons: true
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevToaster = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revApi, revDisclose) {
'use strict';

    // ----- vars ----- //

    var RevToaster;
    var instance;

    var defaults = {
        testing: false,
        header: 'Trending Today',
        closed_hours: 24,
        sponsored: 1,
        internal: false,
        api_source: 'toast',
        url: 'https://trends.revcontent.com/api/v1/',
        rev_position: 'bottom_right',
        // default is mobile only, no 'desktop'
        devices: [
            'phone', 'tablet'
        ],
        disclosure_text: revDisclose.defaultDisclosureText,
        hide_provider: false,
        beacons: true,
        overlay: false, // pass key value object { content_type: icon }
        overlay_icons: false, // pass in custom icons or overrides
        overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
        query_params: false,
        show_visible_selector: false
    };
    // var options;
    var lastScrollTop = 0;
    var scrollTimeout;

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

        this.emitter = new EventEmitter();

        var that = this;

        this.init = function() {
            this.revToaster = document.createElement('div');
            this.revToaster.id = 'rev-toaster';
            this.revToaster.setAttribute('class', 'rev-toaster');

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

            revUtils.append(document.body, this.revToaster);

            this.limit = this.getLimit();

            this.getData();

            var that = this;

            if (this.setShowVisibleElement()) {
                // show once visible
                this.showOnceVisible();
                // check element visibility on scroll
                this.attachShowElementVisibleListener();

                // wait for all images above show visible elemnt to load before checking visibility
                revUtils.imagesLoaded(revUtils.imagesAbove(this.showVisibleElement)).once('done', function() {
                    revUtils.checkVisible.bind(that, that.showVisibleElement, that.emitVisibleEvent)();
                });
            } else {
                // wait a tick or two before attaching to scroll/touch b/c of auto scroll feature in some browsers
                setTimeout(function() {
                    that.scrollListener = revUtils.throttle(that.move.bind(that), 60);

                    if (revDetect.mobile()) {
                        revUtils.addEventListener(window, 'touchmove', that.scrollListener);
                    } else {
                        revUtils.addEventListener(window, 'scroll', that.scrollListener);
                    }
                }, 300);
            }

            // destroy if no data
            this.dataPromise.then(function(data) {
                if (!data.length) {
                    that.destroy();
                }
            });
        };

        this.setShowVisibleElement = function() {
            this.showVisibleElement = false;
            var elements = document.querySelectorAll(this.options.show_visible_selector);
            if (elements.length) {
                this.showVisibleElement = elements[0];
            }
            return this.showVisibleElement;
        };

        this.update = function(newOpts, oldOpts) {
            this.options = revUtils.extend(defaults, newOpts);
            this.options.sponsored = (this.options.sponsored > 2) ? 2 : this.options.sponsored;

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
            this.header.innerHTML = this.options.header;

            revUtils.append(this.revToaster, this.header);

            if (!this.closeButton) {
                this.closeButton = document.createElement('button');
                this.closeButton.className = 'rev-close';
                this.closeButton.innerHTML = '<div class="rev-icon">' +
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
                                    '</div>';

                revUtils.append(this.revToaster, this.closeButton);
            }

            if (this.sponsored) {
                revUtils.remove(this.sponsored);
            }
            this.sponsored = document.createElement('div');
            this.sponsored.className = 'rev-sponsored';
            this.sponsored.innerHTML = revDisclose.getDisclosure(this.options.disclosure_text, revDialog.showDialog, revDialog);

            if (this.options.rev_position == 'top_right') {
                revUtils.addClass(this.sponsored, 'top-right')
                revUtils.prepend(this.revToaster, this.sponsored);
            } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
                revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
                revUtils.append(this.revToaster, this.sponsored);
            }
        };

        this.move = function() {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }

            scrollTimeout = requestAnimationFrame(function() {
                var scrollTop = window.pageYOffset,
                    scrollDirection = (scrollTop < lastScrollTop) ? 'up' : 'down';

                if (scrollDirection === 'up') {
                    that.show();
                } else if (scrollDirection === 'down') {
                    that.hide();
                }
                lastScrollTop = scrollTop;
                scrollTimeout = false;
            });
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
                            (revDisclose.getProvider('rev-provider')) +
                        '</a>' +
                    '</div>';
            var cell = document.createElement('div');

            revUtils.addClass(cell, 'rev-content');

            cell.innerHTML = html;

            that.containerElement.appendChild(cell);
        };

        this.getSerializedQueryParams = function() {
             if (!this.serializedQueryParams) {
                var serialized = revUtils.serialize(this.options.query_params);
                this.serializedQueryParams = serialized ? '&' + serialized : '';
             }
             return this.serializedQueryParams;
        };

        this.generateUrl = function(offset, count, empty, viewed) {
            var url = this.options.url +
            '?api_key=' + this.options.api_key +
            this.getSerializedQueryParams() +
            '&pub_id=' + this.options.pub_id +
            '&widget_id=' + this.options.widget_id +
            '&domain=' + this.options.domain +
            '&api_source=' + this.options.api_source;

            // TODO
            // url +=
            // '&img_h=' + this.imageHeight +
            // '&img_w=' + this.imageWidth;

            url +=
            '&sponsored_count=' + (this.options.internal ? 0 : count) +
            '&internal_count=' + (this.options.internal ? count : 0) +
            '&sponsored_offset=' + (this.options.internal ? 0 : offset) +
            '&internal_offset=' + (this.options.internal ? offset : 0);

            url += this.options.user_ip ? ('&user_ip=' + this.options.user_ip) : '';
            url += this.options.user_agent ? ('&user_agent=' + this.options.user_agent) : '';

            if (empty) {
                url += '&empty=true';
            }

            if (viewed) {
                url += '&viewed=true';
            }

            return url;
        };

        this.getLimit = function() {
            return (this.options.internal ? this.options.internal : this.options.sponsored);
        }

        this.getData = function(show) {
            if (this.dataPromise) {
                return this.dataPromise;
            }

            var that = this;

            this.dataPromise = new Promise(function(resolve, reject) {

                var url = that.generateUrl(0, that.limit, false, false);

                revApi.request(url, function(resp) {

                    that.data = resp;
                    that.updateDisplayedItems();
                    resolve(resp);
                });
            });
        };

        this.updateDisplayedItems = function() {
            var ads = this.containerElement.querySelectorAll('.rev-ad');

            for (var i = 0; i < this.data.length; i++) {
                var ad = ads[i],
                    data = this.data[i];

                if (this.options.overlay !== false) {
                    revUtils.imageOverlay(ad.querySelectorAll('.rev-image')[0], data.content_type, this.options.overlay, this.options.overlay_position, this.options.overlay_icons);
                }

                ad.querySelectorAll('a')[0].setAttribute('href', data.url);
                ad.querySelectorAll('img')[0].setAttribute('src', data.image);
                ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
                if(this.options.hide_provider === false) {
                    ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
                }

            }
        };

        this.bindClose = function() {
            if (!this.options.closed_hours) {
                return false;
            }
            var that = this;

            revUtils.addEventListener(this.closeButton, 'click', function(e) {
                revUtils.removeClass(document.body, 'rev-toaster-loaded');
                setTimeout(function() {
                    that.revToaster.parentNode.removeChild(that.revToaster);
                    revApi.beacons.detach('toaster');
                    that.removeScrollListener();
                    revUtils.setCookie('revtoaster-closed', 1, (that.options.closed_hours / 24));
                }, 2000);
            });
        };

        this.attachShowElementVisibleListener = function() {
            this.visibleListener = revUtils.throttle(revUtils.checkVisible.bind(this, this.showVisibleElement, this.emitVisibleEvent), 60);
            if (revDetect.mobile()) {
                revUtils.addEventListener(window, 'touchmove', this.visibleListener);
            } else {
                revUtils.addEventListener(window, 'scroll', this.visibleListener);
            }
        };

        this.emitVisibleEvent = function() {
            this.emitter.emitEvent('visible');
        };

        this.showOnceVisible = function() {
            var that = this;
            this.emitter.once('visible', function() {
                that.removeVisibleListener();
                that.show();
            });
        };

        this.getSize = function() {
            return this.revToaster.offsetHeight + 21; // 21 is the size of the trending now banner
        };

        this.show = function() {
            var that = this;
            this.dataPromise.then(function() {
                revUtils.imagesLoaded(that.containerElement.querySelectorAll('img')).once('done', function() {
                    that.visible = true;
                    revUtils.addClass(document.body, 'rev-toaster-loaded');
                    that.registerView();
                    if (that.showVisibleElement) {
                        document.body.style.marginBottom = that.getSize() + 'px';
                    }
                    if(true === that.options.beacons) { revApi.beacons.setPluginSource('toaster').attach(); }
                });
            });
        };

        this.registerView = function() {
            if (!this.viewed) {
                this.viewed = true;

                // register a view without impressions(empty)
                var url = this.generateUrl(0, this.limit, true, true);

                revApi.request(url, function() { return });

                var that = this;
                // make sure we have some data
                this.dataPromise.then(function() {
                    var anchors = that.containerElement.querySelectorAll('.rev-ad a');
                    for (var i = 0; i < anchors.length; i++) {
                        anchors[i].setAttribute('href', anchors[i].getAttribute('href') + '&viewed=true');
                    }
                });
            }
        };

        this.hide = function() {
            this.visible = false;
            if (this.showVisibleElement) {
                document.body.style.marginBottom = 0;
            }
            revUtils.removeClass(document.body, 'rev-toaster-loaded');
        };

        this.removeVisibleListener = function() {
            if (revDetect.mobile()) {
                revUtils.removeEventListener(window, 'touchmove', this.visibleListener);
            } else {
                revUtils.removeEventListener(window, 'scroll', this.visibleListener);
            }
        };

        this.removeScrollListener = function() {
            if (revDetect.mobile()) {
                revUtils.removeEventListener(window, 'touchmove', this.scrollListener);
            } else {
                revUtils.removeEventListener(window, 'scroll', this.scrollListener);
            }
        };

        this.destroy = function() {
            revUtils.remove(this.revToaster);

            this.removeScrollListener();
            this.removeVisibleListener();
        };

        this.init();
    };

    return RevToaster;

}));