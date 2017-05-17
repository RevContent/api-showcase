/*
Project: RevSideShifter
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevSideShifter = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevSideShifter = function(opts) {

        var defaults = {
            url: 'https://trends.revcontent.com/api/v1/',
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            overlay_icons: false, // pass in custom icons or overrides
            image_overlay: false, // pass key value object { content_type: icon }
            image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: false, // pass key value object { content_type: icon }
            ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
            header: 'Trending',
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 4,
                md: 4,
                lg: 4,
                xl: 4,
                xxl: 4
            },
            internal: false,
            rows: 3,
            multipliers: {
                margin: -3
            },
            css: '',
            headline_size: 3,
            max_headline: false,
            disclosure_text: 'Ads by Revcontent',
            query_params: false,
            user_ip: false,
            user_agent: false,
            transition_duration_multiplier: 2,
            rev_position: 'top_right',
            close_link_text: 'See more content →',
            closed_hours: 24,
            testing: false,
            logo_color: '#000',
            logo: false,
            stacked: false,
            column_spans: false,
            text_right: false,
            text_overlay: false,
            show_visible_selector: false,
            height_percentage: false,
            min_height: 300,
            button_icon: 'plus' // flame, bell
        };

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

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-side-shifter');

        this.init();
    };

    RevSideShifter.prototype.init = function() {
        this.opened = revUtils.getCookie('rev-side-shifter-opened') || false;
        this.createContainer();
        this.sizeCheck();
        this.createInnerWidget();
        this.continue();
        this.resize();

        if (this.setShowVisibleElement()) {
            // show once visible
            this.showOnceVisible();

            this.hideOnceHidden();
            // check element visibility on scroll
            this.attachShowElementVisibleListener();

            var that = this;
            this.innerWidget.emitter.once('imagesLoaded', function() {
                revUtils.checkVisible.bind(that, that.showVisibleElement, that.emitVisibleEvent)();
            });

            revUtils.imagesLoaded(revUtils.imagesAbove(this.showVisibleElement), this.innerWidget.emitter);
        }
    };

    RevSideShifter.prototype.attachShowElementHiddenListener = function() {
        this.hiddenListener = revUtils.throttle(revUtils.checkHidden.bind(this, this.showVisibleElement, this.emitHiddenEvent, 0, false), 60);
        if (revDetect.mobile()) {
            revUtils.addEventListener(window, 'touchmove', this.hiddenListener);
        } else {
            revUtils.addEventListener(window, 'scroll', this.hiddenListener);
        }
    };

    RevSideShifter.prototype.attachShowElementVisibleListener = function() {
        this.visibleListener = revUtils.throttle(revUtils.checkVisible.bind(this, this.showVisibleElement, this.emitVisibleEvent), 60);
        if (revDetect.mobile()) {
            revUtils.addEventListener(window, 'touchmove', this.visibleListener);
        } else {
            revUtils.addEventListener(window, 'scroll', this.visibleListener);
        }
    };

    RevSideShifter.prototype.emitVisibleEvent = function() {
        this.innerWidget.emitter.emitEvent('visible');
    };

    RevSideShifter.prototype.emitHiddenEvent = function() {
        this.innerWidget.emitter.emitEvent('hidden');
    };

    RevSideShifter.prototype.showOnceVisible = function() {
        var that = this;
        this.innerWidget.emitter.on('visible', function() {
            if (!that.transitioning && !that.visible) {
                that.removeVisibleListener();
                that.attachShowElementHiddenListener();
                that.transition();
                that.emptyBell();
            }
        });
    };

    RevSideShifter.prototype.hideOnceHidden = function() {
        var that = this;
        this.innerWidget.emitter.on('hidden', function() {
            if (!that.transitioning && that.visible) {
                that.removeHiddenListener();
                that.attachShowElementVisibleListener();
                that.transition();
            }
        });
    };

    RevSideShifter.prototype.removeVisibleListener = function() {
        if (revDetect.mobile()) {
            revUtils.removeEventListener(window, 'touchmove', this.visibleListener);
        } else {
            revUtils.removeEventListener(window, 'scroll', this.visibleListener);
        }
    };

    RevSideShifter.prototype.removeHiddenListener = function() {
        if (revDetect.mobile()) {
            revUtils.removeEventListener(window, 'touchmove', this.hiddenListener);
        } else {
            revUtils.removeEventListener(window, 'scroll', this.hiddenListener);
        }
    };

    RevSideShifter.prototype.setShowVisibleElement = function() {
        this.showVisibleElement = false;
        var elements = document.querySelectorAll(this.options.show_visible_selector);
        if (elements.length) {
            this.showVisibleElement = elements[0];
        }
        return this.showVisibleElement;
    };

    RevSideShifter.prototype.createContainer = function() {
        this.bodyOverflow = revUtils.getComputedStyle(document.body, 'overflow');
        this.bodyPosition = revUtils.getComputedStyle(document.body, 'position');
        this.bodyHeight = revUtils.getComputedStyle(document.body, 'height');

        this.fullPageContainer = document.createElement('div');

        this.fullPageContainer.id = 'rev-side-shifter';

        this.containerElement = document.createElement('div');
        revUtils.addClass(this.containerElement, 'rev-side-shifter-container');

        this.headerContainerElement = document.createElement('div');
        revUtils.addClass(this.headerContainerElement, 'rev-side-shifter-header-container');

        this.headerCloseLink = document.createElement('a');
        revUtils.addClass(this.headerCloseLink, 'rev-side-shifter-header-close');
        this.headerCloseLink.textContent = this.options.close_link_text;
        this.headerCloseLink.href = window.location.href;
        this.headerCloseLink.onclick = function() {
            return false;
        }

        if (this.options.logo) {
            this.headerImageContainerElement = document.createElement('div');
            revUtils.addClass(this.headerImageContainerElement, 'rev-side-shifter-header-image-container');
            this.headerImageContainerElement.style.background = this.options.logo_color;

            this.headerImage = document.createElement('img');
            this.headerImage.src = this.options.logo;

            revUtils.append(this.headerImageContainerElement, this.headerImage);
            revUtils.append(this.headerContainerElement, this.headerImageContainerElement);
        }

        revUtils.append(this.headerContainerElement, this.headerCloseLink);

        revUtils.append(this.fullPageContainer, this.headerContainerElement);
        revUtils.append(this.fullPageContainer, this.containerElement);

        this.buttonContainerElement = document.createElement('div');
        this.buttonContainerElement.id = 'rev-side-shifter-button-container';

        this.buttonCounter = document.createElement('div');
        this.buttonCounter.classList = 'rev-button-count';
        this.buttonCounterCount = document.createElement('div');
        this.buttonCounterCount.textContent = '0';
        revUtils.append(this.buttonCounter, this.buttonCounterCount);
        revUtils.append(this.buttonContainerElement, this.buttonCounter);

        this.buttonElement = document.createElement('a');
        this.buttonElement.id = 'rev-side-shifter-button';

        var svg;

        switch (this.options.button_icon) {
            case 'flame':
                svg = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
                            '<path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>' +
                            '<path d="M0 0h24v24H0z" fill="none"/>' +
                            '</svg>';
                this.buttonElement.classList = 'rev-side-shifter-button-flame';
                break;
            case 'bell':
                svg = '<svg class="rev-bell-empty" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M0 0h24v24H0z" fill="none"/>' +
                        '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>' +
                      '</svg>' +
                      '<svg class="rev-bell-static" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
                            '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>' +
                        '</svg>' +
                      '<svg class="rev-bell-active" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
                          '<path d="M0 0h24v24H0z" fill="none"/>' +
                          '<path d="M7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42zM18 11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2v-5zm-6 11c.14 0 .27-.01.4-.04.65-.14 1.18-.58 1.44-1.18.1-.24.15-.5.15-.78h-4c.01 1.1.9 2 2.01 2z"/>' +
                      '</svg>'
                this.buttonElement.classList = 'rev-side-shifter-button-bell';

                if (this.opened) {
                    revUtils.addClass(this.buttonElement, 'rev-side-shifter-button-bell-empty');
                    break;
                }

                this.bellRings = 0;
                this.bellTimeout = setTimeout(function() {
                    revUtils.addClass(that.buttonElement, 'rev-side-shifter-button-bell-ring');

                    var animationEnd = function() {

                        if (that.bellRings < 3) {
                            that.bellRings++;
                            that.bellTimeout = setTimeout(function() {
                                revUtils.addClass(that.buttonElement, 'rev-side-shifter-button-bell-ring');
                            }, (that.bellRings * 5000));
                        }

                        revUtils.removeClass(that.buttonElement, 'rev-side-shifter-button-bell-ring');
                    };

                    revUtils.addEventListener(that.buttonElement.children[2], 'animationend', animationEnd);
                    revUtils.addEventListener(that.buttonElement.children[2], 'webkitAnimationEnd', animationEnd);
                }, 5000);
                break;
            default:
                svg = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
                this.buttonElement.classList = 'rev-side-shifter-button-plus';
        }

        this.buttonElement.innerHTML = svg;

        revUtils.append(this.buttonContainerElement, this.buttonElement);

        var that = this;
        revUtils.addEventListener(this.buttonElement, 'click', function() {
            that.transition(true);
            that.emptyBell();
        });

        revUtils.append(this.fullPageContainer, this.buttonContainerElement);

        revUtils.prepend(document.body, this.fullPageContainer);

        Waves.attach(this.buttonElement);
        Waves.init();
    };

    RevSideShifter.prototype.emptyBell = function() {
        var that = this;
        if (that.options.button_icon == 'bell') {
            setTimeout(function() {
                revUtils.setCookie('rev-side-shifter-opened', 1, (that.options.closed_hours / 24));
                revUtils.addClass(that.buttonElement, 'rev-side-shifter-button-bell-empty');
                revUtils.removeClass(that.buttonElement, 'rev-side-shifter-button-bell-ring');
                that.buttonCounterCount.textContent = 0;
            }, that.transitionDuration);
            clearTimeout(that.bellTimeout);
        }
    };

    RevSideShifter.prototype.sizeCheck = function() {
        if (this.options.height_percentage) {
            var height = (revUtils.windowHeight() * (this.options.height_percentage * .01));
            if (height < this.options.min_height) {
                height = this.options.min_height;
            }
            this.fullPageContainer.style.height = height + 'px';
        }

        this.fullPageContainer.style.maxWidth = revUtils.windowWidth() - ( 5 + parseInt(revUtils.getComputedStyle(this.buttonContainerElement, 'width')) + Math.abs(parseInt(revUtils.getComputedStyle(this.buttonContainerElement, 'right')))) + 'px';
    }

    RevSideShifter.prototype.createInnerWidget = function() {
        this.innerWidget = new RevSlider({
            api_source:   'inter',
            element:      [this.containerElement],
            url:          this.options.url,
            api_key:      this.options.api_key,
            pub_id:       this.options.pub_id,
            widget_id:    this.options.widget_id,
            domain:       this.options.domain,
            overlay_icons: this.options.overlay_icons, // pass in custom icons or overrides
            image_overlay: this.options.image_overlay, // pass key value object { content_type: icon }
            image_overlay_position: this.options.image_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: this.options.ad_overlay, // pass key value object { content_type: icon }
            ad_overlay_position: this.options.ad_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
            rev_position: this.options.rev_position,
            header:       this.options.header,
            per_row:      this.options.per_row,
            rows:         this.options.rows,
            multipliers:  this.options.multipliers,
            css:          this.options.css,
            column_spans: this.options.column_spans,
            headline_size: this.options.headline_size,
            max_headline: this.options.max_headline,
            disclosure_text: this.options.disclosure_text,
            query_params: this.options.query_params,
            user_ip:      this.options.user_ip,
            user_agent:   this.options.user_agent,
            text_right: this.options.text_right,
            text_overlay: this.options.text_overlay,
            image_ratio: this.options.image_ratio,
            stacked: this.options.stacked,
            internal: this.options.internal,
            buttons:      false,
            disable_pagination: true,
            pagination_dots_vertical: true,
            register_impressions: false,
            register_views: false,
            row_pages: true,
            visible_rows: 1,
            pagination_dots: false
        });

        // destroy if no data
        var that = this;
        this.innerWidget.dataPromise.then(function(data) {
            if (!data.length) {
                that.destroy();
            }
        });
    };

    RevSideShifter.prototype.transition = function(button) {
        // var that = this;
        this.transitionDuration = this.fullPageContainer.offsetWidth * this.options.transition_duration_multiplier
        revUtils.transitionDurationCss(this.fullPageContainer, this.transitionDuration + 'ms');
        revUtils.transitionDurationCss(this.buttonElement.children[0], (this.transitionDuration / 4) + 'ms');

        if (this.visible) {
            revUtils.transformCss(this.fullPageContainer, 'translateX(-100%)');
            this.visible = false;
            revUtils.removeClass(this.buttonElement, 'rev-close');
        } else {
            revUtils.transformCss(this.fullPageContainer, 'translateX(0%)');
            this.visible = true;
            revUtils.addClass(this.buttonElement, 'rev-close');
            if (button && this.showVisibleElement) { // if they clicked the button disable showVisibleElement behavior
                this.buttonClicked = true;
                this.removeHiddenListener();
                this.removeVisibleListener();
            }
        }
        this.transitioning = true;

        var that = this;
        setTimeout(function() {
            that.transitioning = false;
        }, this.transitionDuration);
    };

    RevSideShifter.prototype.resetDocument = function() {
        this.fullPageContainer.style.display = 'none';
        document.body.style.position = this.bodyPosition;
        document.body.style.overflow = this.bodyOverflow;
        document.body.style.height = this.bodyHeight;

        document.documentElement.style.position = null;
        document.documentElement.style.overflow = null;
        document.documentElement.style.height = null;
    };

    RevSideShifter.prototype.continue = function() {
        var that = this;
        revUtils.addEventListener(this.headerCloseLink, 'click', function() {
            that.fullPageContainer.style.width = '100%';
            setTimeout(function() {
                that.innerWidget.resize();
            }, that.transitionDuration);
        });
    };

    RevSideShifter.prototype.resize = function() {
        var that = this;
        this.innerWidget.emitter.on('resized', function() {
            var i = 0;
            while (that.innerWidget.containerElement.offsetHeight > that.containerElement.offsetHeight && that.innerWidget.grid.items.length && i < 100) {
                that.innerWidget.grid.remove(that.innerWidget.grid.items[that.innerWidget.grid.items.length - 1].element);
                that.innerWidget.grid.layout();
                i++
            }
            if (!that.opened) {
                that.buttonCounterCount.textContent = that.innerWidget.grid.items.length;
            }
        });
    };

    RevSideShifter.prototype.destroy = function() {
        this.resetDocument();
        revUtils.remove(this.fullPageContainer);
    };

    return RevSideShifter;

}));