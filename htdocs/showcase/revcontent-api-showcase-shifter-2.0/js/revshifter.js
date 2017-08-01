/*
ooooooooo.                          .oooooo..o oooo         o8o   .o88o.     .
`888   `Y88.                       d8P'    `Y8 `888         `"'   888 `"   .o8
 888   .d88'  .ooooo.  oooo    ooo Y88bo.       888 .oo.   oooo  o888oo  .o888oo  .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'   `"Y8888o.   888P"Y88b  `888   888      888   d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        `"Y88b  888   888   888   888      888   888ooo888  888
 888  `88b.  888    .o    `888'    oo     .d8P  888   888   888   888      888 . 888    .o  888
o888o  o888o `Y8bod8P'     `8'     8""88888P'  o888o o888o o888o o888o     "888" `Y8bod8P' d888b


Project: RevShifter
Version: 1
Author: michael@revcontent.com

RevShifter({
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
    window.RevShifter = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevShifter;
    var instance;
    var defaults = {
        testing: false,
        size: 300,
        side: 'bottom',
        show_on_load: false,
        show_on_scroll: true,
        show_on_touch: true,
        show_visible_selector: false,
        scroll_natural: true,
        hide_header: true,
        header: 'Trending Now',
        per_row: {
            xxs: 1,
            xs: 1,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 4,
            xxl: 5
        },
        rows: 1,
        max_headline: true,
        ad_border: false,
        text_right: true,
        text_right_height: 100,
        touch_simulation: false,
        closed_hours: 24,
        pagination_dots: false,
        transition_duration: 1200,
        devices: [
            'phone', 'tablet', 'desktop'
        ],
        hide_on_show_transition: true,
        url: 'https://trends.revcontent.com/api/v1/',
        disclosure_text: 'Ads by Revcontent',
        hide_footer: false,
        hide_provider: false,
        beacons: true,
        overlay_icons: false, // pass in custom icons or overrides
        image_overlay: false, // pass key value object { content_type: icon }
        image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
        ad_overlay: false, // pass key value object { content_type: icon }
        ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
        query_params: false,
        user_ip: false,
        user_agent: false,
        css: '',
        internal: false
    };

    RevShifter = function(opts) {
        if (instance) {
            instance.update(opts, instance.options);
            return instance;
        }

        // if it wasn't newed up
        if ( !( this instanceof RevShifter ) ) {
            instance = new RevShifter(opts);
            return instance;
        } else {
            instance = this;
        }

        // deprecated inner_widget_options
        if (opts.inner_widget_options) {
            if (typeof opts.inner_widget_options.header !== 'undefined') {
                opts.header = opts.inner_widget_options.header;
            }
            if (typeof opts.inner_widget_options.per_row !== 'undefined') {
                opts.per_row = opts.inner_widget_options.per_row;
            }
            if (typeof opts.inner_widget_options.rows !== 'undefined') {
                opts.rows = opts.inner_widget_options.rows;
            }
            if (typeof opts.inner_widget_options.max_headline !== 'undefined') {
                opts.max_headline = opts.inner_widget_options.max_headline;
            }
            if (typeof opts.inner_widget_options.ad_border !== 'undefined') {
                opts.ad_border = opts.inner_widget_options.ad_border;
            }
            if (typeof opts.inner_widget_options.text_right !== 'undefined') {
                opts.text_right = opts.inner_widget_options.text_right;
            }
            if (typeof opts.inner_widget_options.text_right_height !== 'undefined') {
                opts.text_right_height = opts.inner_widget_options.text_right_height;
            }
        }

        // merge options
        this.options = revUtils.extend(defaults, revUtils.deprecateOptions(opts));

        // store options
        revUtils.storeUserOptions(this.options);

        // param errors
        if (revUtils.validateApiParams(this.options).length) {
            return;
        }
        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        if (revUtils.getCookie('rev-shifter-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-shifter');

        this.init = function() {
            this.element = document.createElement('div');
            this.element.style.zIndex = '10001';
            this.element.id = 'rev-shifter';
            revUtils.addClass(this.element, 'rev-shifter');
            revUtils.addClass(this.element, 'rev-hidden');
            revUtils.addClass(this.element, this.options.side);

            if (this.options.hide_header === false) {
                revUtils.addClass(this.element, 'rev-shifter-header');
            }

            if (this.options.pagination_dots === true) {
                revUtils.addClass(this.element, 'rev-shifter-pagination-dots');
            }

            revUtils.append(document.body, this.element);

            if (revDetect.mobile()) {
                revUtils.addClass(this.element, 'rev-mobile');

                if (this.options.touch_simulation) {
                    this.appendTouchEnabledElement();
                }
            }

            this.innerWidget = new RevSlider({
                api_source: 'shift',
                element: [this.element],
                url: this.options.url,
                api_key : this.options.api_key,
                pub_id : this.options.pub_id,
                widget_id : this.options.widget_id,
                domain : this.options.domain,
                rev_position: 'bottom_right',
                header : this.options.header,
                per_row: this.options.per_row,
                rows: this.options.rows,
                max_headline: this.options.max_headline,
                ad_border: this.options.ad_border,
                text_right: this.options.text_right,
                text_right_height: this.options.text_right_height,
                disclosure_text: this.options.disclosure_text,
                hide_provider: this.options.hide_provider,
                hide_header: this.options.hide_header,
                hide_footer: this.options.hide_footer,
                pagination_dots: this.options.pagination_dots,
                buttons: {
                    forward: true,
                    back: true,
                    size: 40,
                    position: (revDetect.mobile() ? 'inside' : 'dual')
                },
                beacons: this.options.beacons,
                touch_direction: Hammer.DIRECTION_ALL, // prevent vertical scrolling
                overlay_icons: this.options.overlay_icons, // pass in custom icons or overrides
                image_overlay: this.options.image_overlay, // pass key value object { content_type: icon }
                image_overlay_position: this.options.image_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
                ad_overlay: this.options.ad_overlay, // pass key value object { content_type: icon }
                ad_overlay_position: this.options.ad_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
                query_params: this.options.query_params,
                register_views: false, // handle viewibility/prevent Slider from doing checks
                user_ip: this.options.user_ip,
                user_agent: this.options.user_agent,
                css: this.options.css,
                internal: this.options.internal
            });

            this.closeButton();

            this.size = this.element.clientHeight;

            if (typeof this.options.per_row === 'object') {
                this.options.single_per_row = {};
                for (var prop in this.options.per_row) {
                    this.options.single_per_row[prop] = (this.options.per_row[prop] * this.options.rows);
                }
            } else {
                this.options.single_per_row = (this.options.per_row * this.options.rows);
            }

            this.setTransitionDuration();

            if (this.options.show_on_load) {
                this.show();
            }
            // if show visible element show once that is visible
            if (this.setShowVisibleElement()) {
                // show once visible
                this.showOnceVisible();
                // check element visibility on scroll
                this.attachShowElementVisibleListener();

                var that = this;
                // wait for all images above show visible elemnt to load before checking visibility
                revUtils.imagesLoaded(revUtils.imagesAbove(this.showVisibleElement)).once('done', function() {
                    revUtils.checkVisible.bind(that, that.showVisibleElement, that.emitVisibleEvent)();
                });
            } else { // otherwise show on scroll
                var that = this;
                // wait a tick or two before attaching to scroll/touch b/c of auto scroll feature in some browsers
                setTimeout(function() {
                    if (revDetect.mobile() && that.options.show_on_touch) {
                        that.attachTouchEvents();
                    } else if (that.options.show_on_scroll) {
                        that.attachScrollEvents();
                    }
                }, 300);
            }

            // destroy if no data
            that.innerWidget.dataPromise.then(function(data) {
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

        this.setTransitionDuration = function(transitionDuration) {
            var transitionDuration = transitionDuration ? transitionDuration : this.options.transition_duration;
            revUtils.transitionDurationCss(this.element, transitionDuration + 'ms');
            revUtils.transitionDurationCss(document.body, transitionDuration + 'ms');
        };

        this.doTouchSimulation = function() {
            if (this.options.touch_simulation && !this.first) {
                this.first = true;
                return true;
            }
            return false;
        };

        this.appendTouchEnabledElement = function() {
            this.touchEnabledElement = document.createElement('div');
            revUtils.addClass(this.touchEnabledElement, 'rev-touch-enabled');
            this.touchEnabledElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M18 22.48V15c0-2.76 2.24-5 5-5s5 2.24 5 5v7.48c2.41-1.61 4-4.36 4-7.48 0-4.97-4.03-9-9-9s-9 4.03-9 9c0 3.12 1.59 5.87 4 7.48zm19.67 9.26l-9.08-4.52c-.34-.14-.7-.22-1.09-.22H26V15c0-1.66-1.34-3-3-3s-3 1.34-3 3v21.47l-6.85-1.43c-.15-.03-.31-.05-.47-.05-.62 0-1.18.26-1.59.66l-1.58 1.6 9.88 9.88c.55.54 1.3.88 2.12.88H35.1c1.51 0 2.66-1.11 2.87-2.56l1.51-10.54c.02-.14.03-.27.03-.41-.01-1.24-.77-2.31-1.84-2.76z"/></svg>';
            revUtils.append(this.element, this.touchEnabledElement);

            var that = this;
            requestAnimationFrame(function() {
                that.touchEnabledElement.style.width = that.touchEnabledElement.offsetHeight + 'px';
            });
        };

        this.move = function() {
            if (this.scrollTimeout) {
                cancelAnimationFrame(this.scrollTimeout);
            }

            var that = this;
            this.scrollTimeout = requestAnimationFrame(function() {
                var scrollTop = window.pageYOffset;
                var scrollDirection = false;
                if (scrollTop < that.lastScrollTop) {
                    scrollDirection = 'up';
                } else if(scrollTop > that.lastScrollTop) {
                    scrollDirection = 'down';
                }

                that.lastScrollTop = scrollTop;
                that.scrollTimeout = false;

                if (that.transitioning && !that.options.hide_on_show_transition) { // don't do anything if already transitioning and option is false
                    return;
                } else if (scrollDirection === 'up') {
                    that.options.scroll_natural ? that.hide() : that.show();
                } else if (scrollDirection === 'down') {
                    that.options.scroll_natural ? that.show() : that.hide();
                }
            });
        };

        this.attachScrollEvents = function() {
            // scrolling
            this.scrollListener = revUtils.throttle(this.move.bind(this), 60);
            this.lastScrollTop = window.pageYOffset;

            if (revDetect.mobile()) {
                revUtils.addEventListener(window, 'touchmove', this.scrollListener);
            } else {
                revUtils.addEventListener(window, 'scroll', this.scrollListener);
            }
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

            if (this.options.width !== oldOpts.width) {
                this.element.style.width = this.options.width + 'px';
                this.innerWidget.grid.resize();
            }

            if ( (this.options.size !== oldOpts.size) ||
                (this.options.realSize !== oldOpts.realSize) ||
                (this.options.header !== oldOpts.header) ||
                (this.options.per_row !== oldOpts.per_row) ||
                (this.options.rows !== oldOpts.rows)) {
                this.innerWidget.update(this.options,  oldOpts);
            }
        };

        // this is a bit of a hack but is the best/ only working way to
        // prevent show/hide when paning vertically on element
        this.cancelPan = function() {
            this.panCancelled = true;
        };

        this.attachTouchEvents = function() {

            this.mc = new Hammer(window, {
                touchAction: 'auto'
            });
            this.mc.add(new Hammer.Pan({ threshold: 0, direction: Hammer.DIRECTION_ALL }));

            var that = this;
            this.mc.on("panup pandown", function(ev){
                if ( that.panCancelled || (that.transitioning && !that.options.hide_on_show_transition)) { // don't do anything if already transitioning and option is false
                    that.panCancelled = false;
                    return;
                }
                if (ev.type === 'panup') {
                    that.options.scroll_natural ? that.show() : that.hide();
                } else if (ev.type === 'pandown') {
                    that.options.scroll_natural ? that.hide() : that.show();
                }
            });

            this.cancelPanListener = this.cancelPan.bind(this);

            revUtils.addEventListener(this.element, 'touchstart', this.cancelPanListener);
            revUtils.addEventListener(this.element, 'touchend', this.cancelPanListener);
            revUtils.addEventListener(this.element, 'touchmove', this.cancelPanListener);
        };

        this.show = function() {
            this.hideTimeout = clearTimeout(this.hideTimeout);
            revUtils.removeClass(this.element, 'rev-hidden');

            this.visible = true;
            this.transitioning = true;

            revUtils.addClass(document.body, 'rev-shifter-no-transform');

            if (this.showTimeout) {
                return;
            }

            var that = this;
            this.showTimeout = setTimeout(function() {
                if (that.doTouchSimulation()) {
                    revUtils.addClass(that.touchEnabledElement, 'rev-touch-enabled-scale-down');
                    revUtils.addClass(that.touchEnabledElement, 'rev-touch-enabled-scale');

                    var resetMs = 600;

                    if (that.innerWidget.ready) { // make sure innerwidget is ready
                        that.innerWidget.pan('left', that.innerWidget.preloaderWidth, resetMs);
                    } else {
                        that.innerWidget.emitter.on( 'ready', function() {
                            that.innerWidget.pan('left', that.innerWidget.preloaderWidth, resetMs);
                        });
                    }

                    setTimeout(function() { // once animation is complete scale back up/ remove press
                        revUtils.addClass(that.touchEnabledElement, 'rev-touch-enabled-scale-up');
                        revUtils.removeClass(that.touchEnabledElement, 'rev-touch-enabled-scale');

                        setTimeout(function() { // start the fade out
                            revUtils.addClass(that.touchEnabledElement, 'rev-touch-enabled-scale-remove');
                            setTimeout(function() { // wait until faded out with a bit of a buffer
                                revUtils.remove(that.touchEnabledElement);
                            }, (resetMs / 2));
                        }, (resetMs / 1.75));

                        setTimeout(function() { // everything is done
                            that.transitioning = false;
                        }, resetMs);

                    }, that.innerWidget.animationDuration * 1000);
                } else {
                    that.transitioning = false;
                    that.showTimeout = false;
                    that.innerWidget.visible();
                }
            }, this.options.transition_duration);

            if (!this.options.show_on_scroll || this.showVisibleElement) {
                document.body.style[this.options.side == 'bottom' ? 'marginBottom' : 'marginTop'] = this.size + 'px';
            }
        };

        this.hide = function() {
            this.showTimeout = clearTimeout(this.showTimeout);

            this.visible = false;
            this.transitioning = true;

            revUtils.removeClass(document.body, 'rev-shifter-no-transform');

            if (!this.options.show_on_scroll || this.showVisibleElement) {
                document.body.style[this.options.side == 'bottom' ? 'marginBottom' : 'marginTop'] = 0;
            }

            if (this.hideTimeout) {
                return;
            }

            var that = this;
            this.hideTimeout = setTimeout(function() {
                revUtils.addClass(that.element, 'rev-hidden');
                that.hideTimeout = false;
                that.transitioning = false;
            }, this.options.transition_duration);
        };

        this.closeButton = function() {
            // if desktop and hide footer get out of here
            if (!revDetect.mobile() && this.options.hide_footer) {
                return;
            }

            this.closeElement = document.createElement('div');
            this.closeElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>';
            revUtils.addClass(this.closeElement, 'rev-close');

            if (revDetect.mobile()) { // up top on mobile
                revUtils.append(this.element, this.closeElement);
            } else if (!this.options.hide_footer) { // footer on desktop
                revUtils.append(this.innerWidget.foot, this.closeElement);
            }

            this.attachCloseButtonEvent();
        };

        this.attachCloseButtonEvent = function() {
            var that = this;
            this.closeElement.addEventListener('click', function() {
                that.hide();
                revUtils.setCookie('rev-shifter-closed', 1, (that.options.closed_hours / 24));
                setTimeout(function() {
                    that.destroy();
                }, that.options.transition_duration);
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
            this.innerWidget.emitter.emitEvent('visible');
        };

        this.showOnceVisible = function() {
            var that = this;
            this.innerWidget.emitter.once('visible', function() {
                that.removeVisibleListener();
                that.show();
            });
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
            if (this.mc && this.cancelPanListener) {
                this.mc.set({enable: false});
                this.mc.destroy();
                revUtils.removeEventListener(this.element, 'touchstart', this.cancelPanListener);
                revUtils.removeEventListener(this.element, 'touchend', this.cancelPanListener);
                revUtils.removeEventListener(this.element, 'touchmove', this.cancelPanListener);
            }

            this.removeScrollListener();
            this.removeVisibleListener();

            this.innerWidget.destroy();
            revUtils.remove(this.element);
        };

        this.init();
    };

    return RevShifter;

}));