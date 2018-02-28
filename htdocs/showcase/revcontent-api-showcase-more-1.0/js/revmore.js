/*
ooooooooo.                         ooo        ooooo
`888   `Y88.                       `88.       .888'
 888   .d88'  .ooooo.  oooo    ooo  888b     d'888   .ooooo.  oooo d8b  .ooooo.
 888ooo88P'  d88' `88b  `88.  .8'   8 Y88. .P  888  d88' `88b `888""8P d88' `88b
 888`88b.    888ooo888   `88..8'    8  `888'   888  888   888  888     888ooo888
 888  `88b.  888    .o    `888'     8    Y     888  888   888  888     888    .o
o888o  o888o `Y8bod8P'     `8'     o8o        o888o `Y8bod8P' d888b    `Y8bod8P'

Project: RevMore
Version: 1
Author: michael@revcontent.com

RevMore({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain'
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevMore = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDialog);

}( window, function factory(window, revUtils, revDetect, revApi, revDialog) {
'use strict';

    var RevMore;
    var that;
    var defaults = {
        top_id: false,
        watch_top_id_interval: 500, // time in ms to watch the top_id position change
        id: false,
        wrapper_id: '',
        url: 'https://trends.revcontent.com/api/v1/',
        distance: 500,
        unlock_text: 'Read More...',
        header: 'Trending Now',
        rev_position: 'top_right',
        image_ratio: 'rectangle',
        pagination_dots: true,
        gradient_height: 60,
        per_row: {
            xxs: 2,
            xs: 2,
            sm: 3,
            md: 4,
            lg: 5,
            xl: 6,
            xxl: 7
        },
        buttons: {
            forward: false,
            back: false
        },
        rows: 2,
        headline_size: 3,
        disclosure_text: 'Ads by Revcontent',
        devices: [
            'phone', 'tablet', 'desktop'
        ],
        beacons: true,
        overlay_icons: false, // pass in custom icons or overrides
        image_overlay: false, // pass key value object { content_type: icon }
        image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
        ad_overlay: false, // pass key value object { content_type: icon }
        ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
        query_params: false,
        user_ip: false,
        user_agent: false,
        hide_selectors: false,
        css: '',
        developer: false
    };

    RevMore = function(opts) {
        if (that) {
            that.destroy();
            return new RevMore(opts);
        }

        // if it wasn't newed up
        if ( !( this instanceof RevMore ) ) {
            that = new RevMore(opts);
            return that;
        } else {
            that = this;
        }

        // merge options
        this.options = revUtils.extend(defaults, revUtils.deprecateOptions(opts));

        // store options
        revUtils.storeUserOptions(this.options);

        if (revUtils.validateApiParams(this.options).length) {
            return;
        }

        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-more');

        this.init = function() {

            this.impressionTracker = [];

            this.checkPadding();

            this.createElements();

            this.setPadding();

            this.appendElements();

            this.createInnerWidget();

            this.setTop();

            this.widget();

            this.wrapperHeight();

            this.attachButtonEvents();

            this.attachResizedEvents();

            this.observeBodyChildList();

            // destroy if no data
            var that = this;
            this.innerWidget.dataPromise.then(function(data) {
                if (!data.length) {
                    that.destroy();
                }
            });
        };

        // we don't want any padding on the body
        this.checkPadding = function() {
            //IE9+
            this.padding = {
                top: getComputedStyle(document.body)['padding-top'],
                right: getComputedStyle(document.body)['padding-right'],
                bottom: getComputedStyle(document.body)['padding-bottom'],
                left: getComputedStyle(document.body)['padding-left']
            }
            //make sure we don't have any strange paddings
            document.body.style.paddingBottom = '0';
            document.body.style.paddingLeft = '0';
            document.body.style.paddingRight = '0';
        };

        this.setPadding = function() {
            if (!parseInt(this.padding.top, 10)) { // if there is not padding move along
                return;
            }
            this.wrapper.style.paddingTop = this.padding.top;
            this.wrapper.style.marginTop = '-' + this.padding.top;
        };

        // create the elements
        this.createElements = function() {
            if (this.options.wrapper_id !== '') {
                var wrapper_obj = document.getElementById(this.options.wrapper_id);
                if (wrapper_obj != undefined) {
                    this.wrapper = wrapper_obj;
                    revUtils.addClass(this.wrapper, 'rev-more-wrapper');
                }
            }
            if (this.wrapper == undefined) {
                this.wrapper = document.createElement("div");
                this.wrapper.id = "rev-more-wrapper";
                while (document.body.firstChild) {
                    this.wrapper.appendChild(document.body.firstChild);
                }
                document.body.appendChild(this.wrapper);
            }
            this.element = document.createElement('div');
            this.element.id = 'rev-more';
            this.element.innerHTML = '<div style="height:' + this.options.gradient_height + 'px; top:-'+ this.options.gradient_height +'px" id="rev-more-gradient"></div>';
            this.element.setAttribute('class', 'rev-more');

            this.unlockBtn = document.createElement('div');
            this.unlockBtn.id = 'rev-more-unlock';
            this.unlockBtn.innerHTML = this.options.unlock_text;

            this.containerElement = document.createElement('div');
            this.containerElement.className = 'rev-more-inner';

            this.innerWidgetElement = document.createElement('div');
        };

        // get the top position using marker if it exists or distance option
        this.setTop = function() {
            this.top = this.options.distance;

            var marker = document.getElementById(this.options.top_id);

            if (marker) {
                var markerTop = marker.getBoundingClientRect().top;
                this.top = markerTop + (window.pageYOffset || document.documentElement.scrollTop);
                this.watchMarkerTop(marker, markerTop);
            }

            this.setElementTop();
        };

        // set the element top position
        this.setElementTop = function() {
            this.element.style.top = this.top + this.options.gradient_height + 'px';
        };

        this.watchMarkerTop = function(marker, currentTop) {
            var that = this;
            var watchMarkerTopInterval = setInterval(function() {
                var markerTop = marker.getBoundingClientRect().top;
                if (currentTop !== markerTop) {
                    that.top = markerTop + (window.pageYOffset || document.documentElement.scrollTop);
                    that.setElementTop();
                    that.wrapperHeight();
                }
                currentTop = markerTop;
            }, this.options.watch_top_id_interval);

            this.innerWidget.emitter.once('unlocked', function() {
                clearInterval(watchMarkerTopInterval);
            });
        };

        this.appendElements = function() {
            revUtils.append(this.containerElement, this.innerWidgetElement);
            revUtils.append(this.element, this.unlockBtn);
            revUtils.append(this.element, this.containerElement);

            revUtils.append(document.body, this.element);
        };

        this.widget = function() {
            if (this.options.id) {
                var that = this;
                this.innerWidget.dataPromise.then(function() {
                    that.sameWidget = new RevSlider({
                        impression_tracker: that.impressionTracker,
                        api_source:         'more',
                        id:                 that.options.id,
                        pagination_dots:    that.options.pagination_dots,
                        url:                that.options.url,
                        api_key:            that.options.api_key,
                        pub_id:             that.options.pub_id,
                        widget_id:          that.options.widget_id,
                        domain:             that.options.domain,
                        rev_position:       that.options.rev_position,
                        header:             that.options.header,
                        per_row:            that.options.per_row,
                        rows:               that.options.rows,
                        image_ratio:        that.options.image_ratio,
                        headline_size:      that.options.headline_size,
                        buttons:            that.options.buttons,
                        beacons:            that.options.beacons,
                        prevent_default_pan: false,
                        disclosure_text:        that.options.disclosure_text,
                        overlay_icons:          that.options.overlay_icons, // pass in custom icons or overrides
                        image_overlay:          that.options.image_overlay, // pass key value object { content_type: icon }
                        image_overlay_position: that.options.image_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
                        ad_overlay:             that.options.ad_overlay, // pass key value object { content_type: icon }
                        ad_overlay_position:    that.options.ad_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
                        multipliers: {
                            font_size: 3,
                            margin: -2.2,
                            padding: 2
                        },
                        user_ip: that.options.user_ip,
                        user_agent: that.options.user_agent,
                        css: that.options.css,
                        developer: that.options.developer
                    });
                });
            }
        };

        this.createInnerWidget = function() {

            this.innerWidget = new RevSlider({
                impression_tracker: this.impressionTracker,
                api_source:   'more',
                element:      [this.innerWidgetElement],
                pagination_dots: this.options.pagination_dots,
                url:          this.options.url,
                api_key:      this.options.api_key,
                pub_id:       this.options.pub_id,
                widget_id:    this.options.widget_id,
                domain:       this.options.domain,
                rev_position: this.options.rev_position,
                header:       this.options.header,
                per_row:      this.options.per_row,
                rows:         this.options.rows,
                image_ratio:  this.options.image_ratio,
                headline_size: this.options.headline_size,
                buttons:      this.options.buttons,
                beacons:      this.options.beacons,
                prevent_default_pan: false,
                disclosure_text: this.options.disclosure_text,
                overlay_icons: this.options.overlay_icons, // pass in custom icons or overrides
                image_overlay: this.options.image_overlay, // pass key value object { content_type: icon }
                image_overlay_position: this.options.image_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
                ad_overlay: this.options.ad_overlay, // pass key value object { content_type: icon }
                ad_overlay_position: this.options.ad_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
                multipliers: {
                    line_height: 3,
                    margin: -2.2,
                    padding: 2
                },
                query_params: this.options.query_params,
                user_ip: this.options.user_ip,
                user_agent: this.options.user_agent,
                css: this.options.css,
                developer: this.options.developer
            });
        };

        // set the wrapper equal to top + the element height
        this.wrapperHeight = function() {
            // subtract 20 to make up for bottom zone
            this.wrapper.style.height = (this.top - 20) + this.element.offsetHeight + this.options.gradient_height + 'px';
        };

        // unlock button
        this.attachButtonEvents = function() {
            var that = this;
            this.unlockBtn.addEventListener('click', function() {
                that.wrapper.style.height = 'auto';
                that.wrapper.style.marginBottom = '0'; // remove buffer margin
                that.wrapper.style.overflow = 'visible';
                // reset any padding or margin set
                document.body.style.paddingBottom = that.padding.bottom;
                document.body.style.paddingLeft = that.padding.left;
                document.body.style.paddingRight = that.padding.right;
                that.wrapper.style.paddingTop = 0;
                that.wrapper.style.marginTop = 0;

                revUtils.addClass(that.element, 'unlocked');

                that.innerWidget.emitter.emitEvent('unlocked');

                setTimeout(function() {
                    that.destroy(false);
                }, 1000);
            });
        };

        // reset the wrapper height on resize
        this.attachResizedEvents = function() {
            var that = this;
            this.innerWidget.grid.on( 'resized', function() {
                that.wrapperHeight();
            });
        };

        this.observeBodyChildList = function() {
            // if we don't have any selectors return
            if (typeof this.options.hide_selectors !== 'object' || !this.options.hide_selectors.length) {
                return;
            }

            // store any hidden elements
            var hidden = [];

            // helper to see if the observed element matches any of the hide_selectors option
            var that = this;
            var matches = function(element) {
                var matched = false;

                try {
                    for (var i = 0; i < that.options.hide_selectors.length; i++) {
                        if (element.matches(that.options.hide_selectors[i])) {
                            matched = true;
                            break;
                        }
                    }
                } catch(e) {}

                return matched;
            };

            // mutation observer for any new body children
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    // if the added node matches hide_selectors option
                    if (mutation.addedNodes[0] && matches(mutation.addedNodes[0])) {
                        // another observer on the element in case the style changes at any point, set hidden
                        var foundObserver = new MutationObserver(function(mutations) {
                            mutation.addedNodes[0].style.display = 'none';
                        });
                        // cache the original display
                        var display = revUtils.getComputedStyle(mutation.addedNodes[0], 'display');

                        // push observer, element and original display into hidden
                        hidden.push({
                            observer: foundObserver,
                            element: mutation.addedNodes[0],
                            display: (display !== 'none' ? display : 'block')
                        });
                        // set element hidden
                        mutation.addedNodes[0].style.display = 'none';
                        // observe
                        foundObserver.observe(mutation.addedNodes[0], {
                            attributes:    true,
                            attributeFilter: ["style"]
                        });
                    }
                });
            });
            // observe
            observer.observe(document.body, {
                childList: true
            });
            // when unlocked disconnect all observers and show the elements that were hidden
            this.innerWidget.emitter.once('unlocked', function() {
                observer.disconnect();
                for (var i = 0; i < hidden.length; i++) {
                    hidden[i].observer.disconnect();
                    hidden[i].element.style.display = hidden[i].display;
                }
            });
        };

        this.destroy = function(destroySameWidget) {
            this.innerWidget.destroy();

            if (destroySameWidget !== false && this.sameWidget) {
                this.sameWidget.destroy();
            }

            revUtils.remove(this.element);
            this.wrapper.style.height = 'auto';
            this.wrapper.style.overflow = 'visible';
            revApi.beacons.detach('more');
            that = null;
        };

        var that = this;
        revUtils.docReady(function() {
            that.init();
        });
    };

    return RevMore;
}));