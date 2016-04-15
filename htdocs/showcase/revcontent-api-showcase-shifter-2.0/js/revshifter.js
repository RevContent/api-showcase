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
        scroll_natural: true,
        inner_widget_options: {
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
            text_right_height: 100
        },
        touch_simulation: false,
        closed_hours: 24,
        transition_duration: 2500,
        devices: [
            'phone', 'tablet', 'desktop'
        ],
        url: 'https://trends.revcontent.com/api/v1/',
        disclosure_text: revDisclose.defaultDisclosureText,
        hide_footer: false,
        hide_provider: false,
        beacons: true
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

        // merge options
        this.options = revUtils.extend(defaults, opts);
        //a hack to make up for revUtils shortcomings
        this.options.inner_widget_options = revUtils.extend(defaults.inner_widget_options, opts.inner_widget_options);

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

            revUtils.append(document.body, this.element);

            if (revDetect.mobile()) {
                revUtils.addClass(this.element, 'rev-mobile');

                if (this.options.touch_simulation) {
                    this.appendTouchEnabledElement();
                }
            }

            this.innerWidget = new RevSlider({
                api_source: 'shift',
                visible: this.options.show_on_load,
                element: [this.element],
                url: this.options.url,
                api_key : this.options.api_key,
                pub_id : this.options.pub_id,
                widget_id : this.options.widget_id,
                domain : this.options.domain,
                rev_position: 'bottom_right',
                header : this.options.inner_widget_options.header,
                per_row: this.options.inner_widget_options.per_row,
                rows: this.options.inner_widget_options.rows,
                max_headline: this.options.inner_widget_options.max_headline,
                ad_border: this.options.inner_widget_options.ad_border,
                text_right: this.options.inner_widget_options.text_right,
                text_right_height: this.options.inner_widget_options.text_right_height,
                transition_duration: this.options.transition_duration + 'ms',
                is_layout_instant: true,
                disclosure_text: this.options.disclosure_text,
                hide_provider: this.options.hide_provider,
                hide_header: true,
                hide_footer: this.options.hide_footer,
                buttons: {
                    forward: true,
                    back: true,
                    size: 40,
                    position: 'inside',
                    dual: true
                },
                beacons: this.options.beacons
            });

            if (!this.options.hide_footer && !revDetect.mobile()) {
                this.closeElement = document.createElement('div');
                this.closeElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>';
                revUtils.addClass(this.closeElement, 'rev-close');

                revUtils.append(this.innerWidget.foot, this.closeElement);

                this.attachCloseButtonEvent();
            }

            this.size = this.element.clientHeight;
            this.difference = (this.size - this.innerWidget.grid.maxHeight);
            this.showSize = this.innerWidget.grid.rows[1].height;

            if (typeof this.options.inner_widget_options.per_row === 'object') {
                this.options.single_per_row = {};
                for (var prop in this.options.inner_widget_options.per_row) {
                    this.options.single_per_row[prop] = (this.options.inner_widget_options.per_row[prop] * this.options.inner_widget_options.rows);
                }
            } else {
                this.options.single_per_row = (this.options.inner_widget_options.per_row * this.options.inner_widget_options.rows);
            }

            this.handleTransform();

            this.attachButtonEvents();

            if (this.options.show_on_load) {
                this.show();
            }

        this.doTouchSimulation = function() {
            if (this.options.touch_simulation && !this.first) {
                this.first = true;
                return true;
            }
            return false;
        }

        this.appendTouchEnabledElement = function() {
            this.touchEnabledElement = document.createElement('div');
            revUtils.addClass(this.touchEnabledElement, 'rev-touch-enabled');
            this.touchEnabledElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M18 22.48V15c0-2.76 2.24-5 5-5s5 2.24 5 5v7.48c2.41-1.61 4-4.36 4-7.48 0-4.97-4.03-9-9-9s-9 4.03-9 9c0 3.12 1.59 5.87 4 7.48zm19.67 9.26l-9.08-4.52c-.34-.14-.7-.22-1.09-.22H26V15c0-1.66-1.34-3-3-3s-3 1.34-3 3v21.47l-6.85-1.43c-.15-.03-.31-.05-.47-.05-.62 0-1.18.26-1.59.66l-1.58 1.6 9.88 9.88c.55.54 1.3.88 2.12.88H35.1c1.51 0 2.66-1.11 2.87-2.56l1.51-10.54c.02-.14.03-.27.03-.41-.01-1.24-.77-2.31-1.84-2.76z"/></svg>';
            revUtils.append(this.element, this.touchEnabledElement);

            var that = this;
            requestAnimationFrame(function() {
                that.touchEnabledElement.style.width = that.touchEnabledElement.offsetHeight + 'px';
            });
        }
            // scrolling
            var that = this;
            var move = function() {
                if (this.removed) {
                    window.removeEventListener('scroll', move);
                    return;
                }

                if (that.scrollTimeout) {
                    return;
                }

                function delayed() {
                    var scrollTop = window.pageYOffset;
                    var scrollDirection = false;
                    if (scrollTop < that.lastScrollTop) {
                        scrollDirection = 'up';
                    } else if(scrollTop > that.lastScrollTop) {
                        scrollDirection = 'down';
                    }

                    if (scrollDirection === 'up') {
                        that.options.scroll_natural ? that.hide() : that.show();
                    } else if (scrollDirection === 'down') {
                        that.options.scroll_natural ? that.show() : that.hide();
                    }
                    that.lastScrollTop = scrollTop;
                    that.scrollTimeout = false;
                }

                that.scrollTimeout = setTimeout( delayed, 300);
            };

            this.scrollTimeout;
            // wait a tick or two before doing the scroll b/c of auto scroll feature in some browsers
            if (this.options.show_on_scroll) {
                setTimeout(function() {
                    that.lastScrollTop = window.pageYOffset;
                    revUtils.addEventListener(window, 'scroll', move);
                }, 300);
            }
        };

        this.update = function(newOpts, oldOpts) {
            this.options = revUtils.extend(defaults, newOpts);
            //a hack to make up for revUtils shortcomings
            this.options.inner_widget_options = revUtils.extend(defaults.inner_widget_options, newOpts.inner_widget_options);

            if (this.visible != newOpts.visible) {
                if (newOpts.visible) {
                    this.show();
                } else {
                    this.hide();
                }
            }

            if (this.options.width !== oldOpts.width) {
                this.element.style.width = this.options.width + 'px';
                this.innerWidget.resize();
            }

            if ( (this.options.size !== oldOpts.size) ||
                (this.options.realSize !== oldOpts.realSize) ||
                (this.options.inner_widget_options.header !== oldOpts.inner_widget_options.header) ||
                (this.options.inner_widget_options.per_row !== oldOpts.inner_widget_options.per_row) ||
                (this.options.inner_widget_options.rows !== oldOpts.inner_widget_options.rows)) {
                this.innerWidget.update(this.options.inner_widget_options,  oldOpts.inner_widget_options);
            }
        };

        this.applyTransitionCss = function(element) {
            element.style.transitionDuration = this.options.transition_duration + 'ms';
            element.style.WebkitTransitionDuration = this.options.transition_duration + 'ms';
            element.style.MozTransitionDuration = this.options.transition_duration + 'ms';
            element.style.OTransitionDuration = this.options.transition_duration + 'ms';
        };

        this.handleTransform = function() {
            this.applyTransitionCss(this.element);
            this.applyTransitionCss(document.body);
        };

        this.show = function() {
            this.hideTimeout = clearTimeout(this.hideTimeout);
            revUtils.removeClass(this.element, 'rev-hidden');

            this.innerWidget.registerImpressions();

            this.visible = true;
            this.transitioning = true;
            this.innerWidget.transitioning = true;

            revUtils.addClass(document.body, 'rev-shifter-no-transform');

            var that = this;
            setTimeout(function() {
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
                            that.innerWidget.transitioning = false;
                        }, resetMs);

                    }, that.innerWidget.animationDuration * 1000);
                } else {
                    that.transitioning = false;
                    that.innerWidget.transitioning = false;
                }
            }, this.options.transition_duration);

            if (!this.options.show_on_scroll) {
                document.body.style[this.options.side == 'bottom' ? 'marginBottom' : 'marginTop'] = this.size + 'px';
            }
        };

        this.hide = function() {
            this.visible = false;

            revUtils.removeClass(document.body, 'rev-shifter-no-transform');

            if (!this.options.show_on_scroll) {
                document.body.style[this.options.side == 'bottom' ? 'marginBottom' : 'marginTop'] = 0;
            }

            if (this.hideTimeout) {
                return;
            }

            var that = this;
            this.hideTimeout = setTimeout(function() {
                revUtils.addClass(that.element, 'rev-hidden');
                that.hideTimeout = false;
            }, this.options.transition_duration);
        };

        this.attachCloseButtonEvent = function() {
            var that = this;
            this.closeElement.addEventListener('click', function() {
                that.hide();
                that.removed = true;
                revUtils.setCookie('rev-shifter-closed', 1, (that.options.closed_hours / 24));
            });
        };

        this.init();
    };

    return RevShifter;

}));