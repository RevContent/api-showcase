/*
Project: EngagePanel
Version: 0.0.1
Author: michael@revcontent.com
*/

( function( window, factory ) {
    'use strict';
    // browser global
    window.EngagePanel = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var EngagePanel = function(opts) {

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
            opened_hours: 8,
            logo_color: '#000',
            logo: false,
            stacked: false,
            text_overlay: false,
            show_visible_selector: false,
            height_percentage: false,
            min_height: 300,
            button_icon: 'plus', // flame, bell
            bell_animation: true,
            bell_zero: true,
            side: 'right',
            fit_height: true,
            button_devices: [ // only show the button on desktop by default, don't enable touch for
                'desktop'
            ],
            touch_devices: [
                'phone', 'tablet'
            ],
            column_spans: [
                {
                    selector: '#rev-side-shifter .rev-slider-breakpoint-gt-xs .rev-content:nth-child(-n+4)',
                    spans: 2
                },
                {
                    selector: '#rev-side-shifter .rev-slider-breakpoint-gt-xs .rev-content:nth-child(n+5)',
                    spans: 4
                }
            ],
            text_right: [
                {
                    selector: '#rev-side-shifter .rev-slider-breakpoint-gt-xs .rev-content:nth-child(n+5)',
                },
                {
                    selector: '#rev-side-shifter .rev-slider-breakpoint-lt-sm .rev-content:nth-child(n+4)',
                }
            ],
            text_right_height: {
                xs: 100,
                sm: 204,
                md: 204,
                lg: 204,
                xl: 204,
                xxl: 204
            },
            developer: false,
            emitter: new EvEmitter(),
        };

        // merge options
        this.options = Object.assign(defaults, opts);

        // param errors
        // if (revUtils.validateApiParams(this.options).length) {
        //     return;
        // }
        // don't show for this device
        // if (!revDetect.show(this.options.devices)) {
        //     return;
        // }

        // revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-side-shifter');

        this.init();
    };

    EngagePanel.prototype.init = function() {
        this.opened = revUtils.getCookie('rev-side-shifter-opened-' + this.options.widget_id);
        this.open = false;
        this.createContainer();
        this.positionContainer();
        // this.sizeCheck();
        // this.createInnerWidget();
        // this.buttonCountText();
        // this.initTouch();
        // this.resize();
        // this.initShowVisibleElement();
    };

    // EngagePanel.prototype.initShowVisibleElement = function() {
    //     if (this.setShowVisibleElement()) {
    //         // show once visible
    //         this.showOnceVisible();

    //         this.hideOnceHidden();
    //         // check element visibility on scroll
    //         this.attachShowElementVisibleListener();

    //         var that = this;
    //         this.innerWidget.emitter.once('imagesLoaded', function() {
    //             revUtils.checkVisible.bind(that, that.showVisibleElement, that.emitVisibleEvent)();
    //         });

    //         revUtils.imagesLoaded(revUtils.imagesAbove(this.showVisibleElement), this.innerWidget.emitter);
    //     }
    // };

    // EngagePanel.prototype.attachShowElementHiddenListener = function() {
    //     this.hiddenListener = revUtils.throttle(revUtils.checkHidden.bind(this, this.showVisibleElement, this.emitHiddenEvent, 0, false), 60);
    //     if (revDetect.mobile()) {
    //         revUtils.addEventListener(window, 'touchmove', this.hiddenListener);
    //     } else {
    //         revUtils.addEventListener(window, 'scroll', this.hiddenListener);
    //     }
    // };

    // EngagePanel.prototype.attachShowElementVisibleListener = function() {
    //     this.visibleListener = revUtils.throttle(revUtils.checkVisible.bind(this, this.showVisibleElement, this.emitVisibleEvent), 60);
    //     if (revDetect.mobile()) {
    //         revUtils.addEventListener(window, 'touchmove', this.visibleListener);
    //     } else {
    //         revUtils.addEventListener(window, 'scroll', this.visibleListener);
    //     }
    // };

    // EngagePanel.prototype.emitVisibleEvent = function() {
    //     this.innerWidget.emitter.emitEvent('visible');
    // };

    // EngagePanel.prototype.emitHiddenEvent = function() {
    //     this.innerWidget.emitter.emitEvent('hidden');
    // };

    // EngagePanel.prototype.showOnceVisible = function() {
    //     var that = this;
    //     this.innerWidget.emitter.on('visible', function() {
    //         if (!that.transitioning && !that.open) {
    //             that.removeVisibleListener();
    //             that.attachShowElementHiddenListener();
    //             that.transition();
    //             that.emptyBell();
    //         }
    //     });
    // };

    // EngagePanel.prototype.hideOnceHidden = function() {
    //     var that = this;
    //     this.innerWidget.emitter.on('hidden', function() {
    //         if (!that.transitioning && that.open) {
    //             that.removeHiddenListener();
    //             that.attachShowElementVisibleListener();
    //             that.transition();
    //         }
    //     });
    // };

    // EngagePanel.prototype.removeVisibleListener = function() {
    //     if (revDetect.mobile()) {
    //         revUtils.removeEventListener(window, 'touchmove', this.visibleListener);
    //     } else {
    //         revUtils.removeEventListener(window, 'scroll', this.visibleListener);
    //     }
    // };

    // EngagePanel.prototype.removeHiddenListener = function() {
    //     if (revDetect.mobile()) {
    //         revUtils.removeEventListener(window, 'touchmove', this.hiddenListener);
    //     } else {
    //         revUtils.removeEventListener(window, 'scroll', this.hiddenListener);
    //     }
    // };

    // EngagePanel.prototype.setShowVisibleElement = function() {
    //     this.showVisibleElement = false;
    //     var elements = document.querySelectorAll(this.options.show_visible_selector);
    //     if (elements.length) {
    //         this.showVisibleElement = elements[0];
    //     }
    //     return this.showVisibleElement;
    // };

    EngagePanel.prototype.createContainer = function() {
        this.fullPageContainer = document.createElement('div');

        this.fullPageContainer.id = 'rev-side-shifter';

        this.containerElement = document.createElement('div');
        revUtils.addClass(this.containerElement, 'rev-side-shifter-container');
        // this.containerElement.id = 'rev-feed';

        this.innerElement = document.createElement('div');
        revUtils.addClass(this.innerElement, 'rev-side-shifter-inner');

        revUtils.append(this.containerElement, this.innerElement);

        revUtils.append(this.fullPageContainer, this.containerElement);

        // if (revDetect.show(this.options.button_devices)) {
        //     this.initButtonContainerElement();
        // }

        revUtils.prepend(document.body, this.fullPageContainer);

        // this.options.element = this.innerElement;

        // this.slider = new RevSlider(this.options);
    };

    EngagePanel.prototype.positionContainer = function() {
        if (this.options.side == 'left') {
            revUtils.transformCss(this.fullPageContainer, 'translateX(-100%)');
            revUtils.addClass(this.fullPageContainer, 'rev-side-shifter-left');
            this.fullPageContainer.style.left = '0';
        } else {
            revUtils.transformCss(this.fullPageContainer, 'translateX(100%)');
            revUtils.addClass(this.fullPageContainer, 'rev-side-shifter-right');
            this.fullPageContainer.style.right = '0';
        }
    };

    // EngagePanel.prototype.initButtonContainerElement = function() {
    //     this.buttonContainerElement = document.createElement('div');
    //     this.buttonContainerElement.id = 'rev-side-shifter-button-container';

    //     this.buttonCounter = document.createElement('div');
    //     this.buttonCounter.classList.add('rev-button-count');
    //     this.buttonCounterCount = document.createElement('div');
    //     this.buttonCounterCount.textContent = '0';
    //     revUtils.append(this.buttonCounter, this.buttonCounterCount);
    //     revUtils.append(this.buttonContainerElement, this.buttonCounter);

    //     this.buttonElement = document.createElement('a');
    //     this.buttonElement.id = 'rev-side-shifter-button';

    //     var svg;

    //     switch (this.options.button_icon) {
    //         case 'flame':
    //             svg = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
    //                         '<path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>' +
    //                         '<path d="M0 0h24v24H0z" fill="none"/>' +
    //                         '</svg>';
    //             this.buttonElement.classList.add('rev-side-shifter-button-flame');
    //             break;
    //         case 'bell':
    //             svg = '<svg class="rev-bell-empty" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
    //                     '<path d="M0 0h24v24H0z" fill="none"/>' +
    //                     '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>' +
    //                   '</svg>' +
    //                   '<svg class="rev-bell-static" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
    //                         '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>' +
    //                     '</svg>' +
    //                   '<svg class="rev-bell-active" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
    //                       '<path d="M0 0h24v24H0z" fill="none"/>' +
    //                       '<path d="M7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42zM18 11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2v-5zm-6 11c.14 0 .27-.01.4-.04.65-.14 1.18-.58 1.44-1.18.1-.24.15-.5.15-.78h-4c.01 1.1.9 2 2.01 2z"/>' +
    //                   '</svg>'
    //             this.buttonElement.classList.add('rev-side-shifter-button-bell');

    //             if (this.opened) {
    //                 revUtils.addClass(this.buttonElement, 'rev-side-shifter-button-bell-empty');
    //                 break;
    //             }
    //             // don't animate the bell?
    //             if (!this.options.bell_animation) {
    //                 break;
    //             }

    //             this.bellRings = 0;
    //             this.bellTimeout = setTimeout(function() {
    //                 revUtils.addClass(that.buttonElement, 'rev-side-shifter-button-bell-ring');

    //                 var animationEnd = function() {

    //                     if (that.bellRings < 3) {
    //                         that.bellRings++;
    //                         that.bellTimeout = setTimeout(function() {
    //                             revUtils.addClass(that.buttonElement, 'rev-side-shifter-button-bell-ring');
    //                         }, (that.bellRings * 5000));
    //                     }

    //                     revUtils.removeClass(that.buttonElement, 'rev-side-shifter-button-bell-ring');
    //                 };

    //                 revUtils.addEventListener(that.buttonElement.children[2], 'animationend', animationEnd);
    //                 revUtils.addEventListener(that.buttonElement.children[2], 'webkitAnimationEnd', animationEnd);
    //             }, 5000);
    //             break;
    //         default:
    //             svg = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
    //             this.buttonElement.classList.add('rev-side-shifter-button-plus');
    //     }

    //     this.buttonElement.innerHTML = svg;

    //     revUtils.append(this.buttonContainerElement, this.buttonElement);

    //     Waves.attach(this.buttonElement, ['waves-circle', 'waves-float']);
    //     Waves.init();

    //     var that = this;
    //     revUtils.addEventListener(this.buttonElement, 'click', function() {
    //         that.transition(true);
    //         that.emptyBell();
    //     });

    //     if (this.options.side == 'left') {
    //         this.buttonContainerElement.style.right = '-15px';
    //         revUtils.transformCss(this.buttonContainerElement, 'translateX(100%)');
    //         revUtils.append(this.fullPageContainer, this.buttonContainerElement);
    //     } else {
    //         this.buttonContainerElement.style.left = '-15px';
    //         revUtils.transformCss(this.buttonContainerElement, 'translateX(-100%)');
    //         revUtils.prepend(this.fullPageContainer, this.buttonContainerElement);
    //     }
    // };

    // EngagePanel.prototype.emptyBell = function() {
    //     var that = this;
    //     if (that.options.button_icon == 'bell') {
    //         setTimeout(function() {
    //             revUtils.setCookie('rev-side-shifter-opened-' + that.options.widget_id, 1, (that.options.opened_hours / 24));
    //             revUtils.addClass(that.buttonElement, 'rev-side-shifter-button-bell-empty');
    //             revUtils.removeClass(that.buttonElement, 'rev-side-shifter-button-bell-ring');
    //             // zero out the text if bell_zero option is true
    //             if (that.options.bell_zero) {
    //                 that.buttonCounterCount.textContent = 0;
    //             }
    //         }, that.transitionDuration);
    //         clearTimeout(that.bellTimeout);
    //     }
    // };

    EngagePanel.prototype.sizeCheck = function() {
        if (this.options.height_percentage) {
            var height = (revUtils.windowHeight() * (this.options.height_percentage * .01));
            if (height < this.options.min_height) {
                height = this.options.min_height;
            }
            this.fullPageContainer.style.height = height + 'px';
        }

        if (revDetect.show(this.options.button_devices)) { // if there is a button make sure there is space for it
            var maximumWidth = revUtils.windowWidth() -
                ( 5 + parseInt(revUtils.getComputedStyle(this.buttonContainerElement, 'width')) +
                    Math.abs(parseInt(revUtils.getComputedStyle(this.buttonContainerElement, (this.options.side == 'left' ? 'right' : 'left')))));
            var computedMaxWidth = parseInt(revUtils.getComputedStyle(this.fullPageContainer, 'max-width'));

            if (computedMaxWidth > maximumWidth) {
                this.fullPageContainer.style.maxWidth = maximumWidth + 'px';
            }
        } else {
            this.fullPageContainer.style.maxWidth = 'none';
        }
    }

    // EngagePanel.prototype.createInnerWidget = function() {
    //     this.innerWidget = new RevSlider({
    //         api_source:   'inter',
    //         element:      [this.containerElement],
    //         url:          this.options.url,
    //         api_key:      this.options.api_key,
    //         pub_id:       this.options.pub_id,
    //         widget_id:    this.options.widget_id,
    //         domain:       this.options.domain,
    //         overlay_icons: this.options.overlay_icons, // pass in custom icons or overrides
    //         image_overlay: this.options.image_overlay, // pass key value object { content_type: icon }
    //         image_overlay_position: this.options.image_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
    //         ad_overlay: this.options.ad_overlay, // pass key value object { content_type: icon }
    //         ad_overlay_position: this.options.ad_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
    //         rev_position: this.options.rev_position,
    //         header:       this.options.header,
    //         per_row:      this.options.per_row,
    //         rows:         this.options.rows,
    //         multipliers:  this.options.multipliers,
    //         css:          this.options.css,
    //         column_spans: this.options.column_spans,
    //         headline_size: this.options.headline_size,
    //         max_headline: this.options.max_headline,
    //         disclosure_text: this.options.disclosure_text,
    //         query_params: this.options.query_params,
    //         user_ip:      this.options.user_ip,
    //         user_agent:   this.options.user_agent,
    //         text_right: this.options.text_right,
    //         text_right_height:   this.options.text_right_height,
    //         text_overlay: this.options.text_overlay,
    //         image_ratio: this.options.image_ratio,
    //         stacked: this.options.stacked,
    //         internal: this.options.internal,
    //         fit_height: this.options.fit_height,
    //         destroy: this.destroy.bind(this),
    //         buttons:      false,
    //         disable_pagination: true,
    //         pagination_dots_vertical: true,
    //         register_impressions: false,
    //         register_views: false,
    //         row_pages: true,
    //         visible_rows: 1,
    //         pagination_dots: false,
    //         developer: this.options.developer
    //     });
    // };

    EngagePanel.prototype.transition = function(button) {
        this.transitionDuration = this.fullPageContainer.offsetWidth * this.options.transition_duration_multiplier

        this.transitionTransformShadow(this.transitionDuration);

        if (this.buttonElement) {
            revUtils.transitionDurationCss(this.buttonElement.children[0], (this.transitionDuration / 4) + 'ms');
        }

        if (this.open) {
            document.documentElement.style.overflow = 'visible';
            document.documentElement.style.height = 'auto';

            if (this.options.side == 'left') {
                revUtils.transformCss(this.fullPageContainer, 'translateX(-100%)');
            } else {
                revUtils.transformCss(this.fullPageContainer, 'translateX(100%)');
            }
            this.open = false;
            revUtils.removeClass(this.buttonElement, 'rev-close');

            // if (revDetect.show(this.options.touch_devices)) {
            //     this.setTouchClose();
            // }

            var that = this;
            setTimeout(function() {
                revUtils.removeClass(that.fullPageContainer, 'rev-side-shifter-animating');
            }, Math.max(0, this.transitionDuration - 300));
        } else {
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.height = '100%';

            revUtils.addClass(this.fullPageContainer, 'rev-side-shifter-animating');

            revUtils.transformCss(this.fullPageContainer, 'translateX(0%)');
            this.open = true;
            revUtils.addClass(this.buttonElement, 'rev-close');
            // if (button && this.showVisibleElement) { // if they clicked the button disable showVisibleElement behavior
            //     this.buttonClicked = true;
            //     this.removeHiddenListener();
            //     this.removeVisibleListener();
            // }

            // if (revDetect.show(this.options.touch_devices)) {
            //     this.setTouchOpen();
            // }

            // this.registerOnceOpened();
        }
        this.transitioning = true;

        var that = this;
        setTimeout(function() {
            that.transitioning = false;
        }, this.transitionDuration);
    };

    // EngagePanel.prototype.buttonCountText = function() {
    //     // if no button, get outta here
    //     if (!revDetect.show(this.options.button_devices)) {
    //         return;
    //     }

    //     var that = this;
    //     var setbuttonCountText = function() {
    //         // leave it at zero if opened, bell icon and bell_zero option is true
    //         if (that.opened && that.options.button_icon == 'bell' && that.options.bell_zero) {
    //             return;
    //         }
    //         that.buttonCounterCount.textContent = that.innerWidget.grid.items.length;
    //     };

    //     this.innerWidget.emitter.once('ready', setbuttonCountText);

    //     this.innerWidget.emitter.on('resize', setbuttonCountText);
    // };

    EngagePanel.prototype.transitionTransformShadow = function(duration) {
        revUtils.transitionCss(this.fullPageContainer, 'transform ' + duration + 'ms cubic-bezier(.06, 1, .6, 1), box-shadow 300ms');
    };

    // EngagePanel.prototype.registerOnceOpened = function() {
    //     if (this.registered) {
    //         return;
    //     }
    //     this.registered = true;
    //     var url = this.innerWidget.generateUrl(0, this.innerWidget.limit, false, true);
    //     revApi.request(url, function() { return; });
    //     revApi.beacons.setPluginSource(this.innerWidget.options.api_source).attach();
    // };

    EngagePanel.prototype.initTouchVars = function() {
        // if the button is active don't enable touch
        if (!revDetect.show(this.options.touch_devices)) {
            return;
        }

        this.width = this.fullPageContainer.offsetWidth;

        if (this.options.side == 'left') {
            this.closeDirection = Hammer.DIRECTION_LEFT;
            this.openDirection = Hammer.DIRECTION_RIGHT;
            this.closePosition = this.width * -1;
        } else {
            this.closeDirection = Hammer.DIRECTION_RIGHT;
            this.openDirection = Hammer.DIRECTION_LEFT;;
            this.closePosition = this.width;
        }

        this.currentX = this.open ? 0 : this.closePosition;
    };

    EngagePanel.prototype.setTouchClose = function() {
        this.thresholdActive = this.openThreshold;

        this.panRecognizer.set({
            threshold: this.thresholdActive,
            direction: this.openDirection
        });

        this.currentX = this.closePosition;
        this.open = false;
    };

    EngagePanel.prototype.setTouchOpen = function() {
        this.thresholdActive = this.closeThreshold;

        this.panRecognizer.set({
            threshold: this.thresholdActive,
            direction: this.closeDirection | Hammer.DIRECTION_VERTICAL
        });

        this.currentX = 0;
        this.open = true;

        this.lastDeltaX = 0;
    };

    EngagePanel.prototype.initTouch = function() {
        // if the button is active don't enable touch
        if (!revDetect.show(this.options.touch_devices)) {
            return;
        }

        this.initTouchVars();

        this.openThreshold = 50;
        this.closeThreshold = 10;

        this.thresholdActive = this.openThreshold;

        this.lastDeltaX = 0;

        this.mc = new Hammer(document.documentElement);

        this.panRecognizer = new Hammer.Pan({
            threshold: this.thresholdActive,
            direction: this.openDirection
        });

        this.mc.add(this.panRecognizer);

        var that = this;

        this.mc.on('panstart', function(e) {
            clearTimeout(that.animatingClassTimeout);
            revUtils.addClass(that.fullPageContainer, 'rev-side-shifter-animating');

            that.panStartTimeStamp = e.timeStamp;
            that.isDraging = true;

            (function animation () {
                if (that.isDraging) {
                    that.fullPageContainer.style.transform = 'translate3d('+ that.currentX +'px, 0, 0)';
                    that.animationFrameId = requestAnimationFrame(animation);
                }
            })();
        });

        this.mc.on('panleft panright', function(e) {
            that.lastDirection = e.direction;

            if (that.options.side == 'left') {
                var amount = (e.deltaX - that.thresholdActive);
            } else {
                if (e.direction == that.openDirection) {
                    var amount = (that.thresholdActive + e.deltaX);
                } else if (e.direction == that.closeDirection) {
                    var amount = (e.deltaX + that.thresholdActive);
                }
            }

            that.currentX = that.currentX + (amount - that.lastDeltaX);
            that.lastDeltaX = amount;
        });

        this.mc.on('panend', function(e) {
            that.isDraging = false;
            cancelAnimationFrame(that.animationFrameId);

            var velocity = Math.abs(e.velocityX);

            var duration;

            if (that.open) {
                var distance = Math.abs(that.currentX);
            } else {
                var distance = that.width - Math.abs(that.currentX);
            }

            // reset if low velocity and not over 70% or swiped back to close direction
            if (velocity < .025 && (distance / that.width) < .7 ||
                (that.open && that.lastDirection == that.openDirection) || (!that.open && that.lastDirection == that.closeDirection)) {

                duration = distance * 3.5;

                if (that.open) {
                    that.currentX = 0;
                    that.open = true;
                } else {
                    that.currentX = that.closePosition;
                    that.open = false;
                }

            } else { //otherwise do it

                if (velocity < .025) { // over 70% but low velocity use 2.5
                    duration = (that.width - distance) * 3.5;
                } else { // use the velocity
                    duration = (that.width - distance) / velocity;
                }

                if (that.open) {
                    revUtils.removeClass(that.buttonElement, 'rev-close');
                    // that.setTouchClose();
                } else {
                    revUtils.addClass(that.buttonElement, 'rev-close');
                    // that.setTouchOpen();
                    // that.registerOnceOpened();
                }
            }

            // don't let it take longer that 1800 ms or less than 150
            duration = Math.min(1800, duration < 150 ? 150 : duration);

            that.lastDeltaX = 0;

            that.transitionTransformShadow(duration);

            revUtils.transformCss(that.fullPageContainer, 'translate3d('+ that.currentX + 'px, 0, 0)');

            if (!revDetect.show(that.options.button_devices) || !that.open) {
                that.animatingClassTimeout = setTimeout(function() {
                    revUtils.removeClass(that.fullPageContainer, 'rev-side-shifter-animating');
                }, Math.max(0, duration - 300));
            }
        });
    };

    EngagePanel.prototype.resize = function() {

        var that = this;
        this.options.emitter.on('resized', function() {
            that.initTouchVars();
            if (!that.open) {
                that.positionContainer();
            }
        });
    };

    EngagePanel.prototype.destroy = function() {
        revUtils.remove(this.fullPageContainer);
        if (this.mc) {
            this.mc.set({enable: false});
            this.mc.destroy();
        }
    };

    return EngagePanel;

}));