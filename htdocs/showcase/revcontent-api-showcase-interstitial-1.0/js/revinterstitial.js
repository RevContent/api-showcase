/*
Project: RevInterstitial
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevInterstitial = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevInterstitial = function(opts) {

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
            close_link_text: 'Continue to site →',
            closed_hours: 24,
            testing: false,
            logo_color: '#000',
            logo: false,
            stacked: false,
            text_right: [
                {
                    selector: '.rev-slider-breakpoint-gt-sm .rev-content:nth-child(n+6), .rev-slider-breakpoint-lt-md .rev-content:nth-child(n+3), .rev-slider-breakpoint-lt-sm .rev-content:nth-child(n+2)'
                }
            ],
            column_spans: [
                {
                    selector: '.rev-slider-breakpoint-gt-xs .rev-content:nth-child(1), .rev-slider-breakpoint-gt-sm .rev-content:nth-child(n+6), .rev-slider-breakpoint-sm .rev-content',
                    spans: 2
                },
                {
                    selector: '.rev-slider-breakpoint-gt-md .rev-content:nth-child(n+6)',
                    spans: 1
                }
            ],
            text_overlay: [
                {
                    selector: '.rev-slider-breakpoint-gt-sm .rev-content:nth-child(-n+5)'
                },
                {
                    media: '(orientation: landscape)',
                    selector: '#rev-slider.rev-slider-breakpoint-lt-md .rev-content'
                }
            ],
            image_ratio: [
                {
                    selector: '.rev-slider-breakpoint-gt-sm .rev-content:nth-child(n+6), .rev-slider-breakpoint-lt-md .rev-content:nth-child(n+3), .rev-slider-breakpoint-lt-sm .rev-content:nth-child(n+2)',
                    ratio: 'tall_rectangle'
                },
                {
                    media: '(orientation: landscape)',
                    selector: '#rev-slider.rev-slider-breakpoint-lt-md .rev-content',
                    ratio: 'wide_rectangle'
                }
            ]
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

        if (revUtils.getCookie('rev-interstitial-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-interstitial');

        this.init();
    };

    RevInterstitial.prototype.init = function() {
        this.createContainer();
        this.createInnerWidget();
        this.transition();
        this.close();
        this.resize();
    };

    RevInterstitial.prototype.createContainer = function() {
        this.bodyOverflow = revUtils.getComputedStyle(document.body, 'overflow');
        this.bodyPosition = revUtils.getComputedStyle(document.body, 'position');
        this.bodyHeight = revUtils.getComputedStyle(document.body, 'height');

        this.fullPageContainer = document.createElement('div');
        // this.fullPageContainer.style.height = window.innerHeight + 'px';
        // this.fullPageContainer.style.top = document.body.scrollTop + 'px';

        document.documentElement.style.position = 'relative';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';

        document.body.style.position = 'relative';
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
        this.fullPageContainer.id = 'rev-interstitial';

        this.containerElement = document.createElement('div');
        revUtils.addClass(this.containerElement, 'rev-interstitial-container');

        this.headerContainerElement = document.createElement('div');
        revUtils.addClass(this.headerContainerElement, 'rev-interstitial-header-container');

        this.headerCloseLink = document.createElement('a');
        revUtils.addClass(this.headerCloseLink, 'rev-interstitial-header-close');
        this.headerCloseLink.textContent = this.options.close_link_text;
        this.headerCloseLink.href = window.location.href;
        this.headerCloseLink.onclick = function() {
            return false;
        }

        if (this.options.logo) {
            this.headerImageContainerElement = document.createElement('div');
            revUtils.addClass(this.headerImageContainerElement, 'rev-interstitial-header-image-container');
            this.headerImageContainerElement.style.background = this.options.logo_color;

            this.headerImage = document.createElement('img');
            this.headerImage.src = this.options.logo;

            revUtils.append(this.headerImageContainerElement, this.headerImage);
            revUtils.append(this.headerContainerElement, this.headerImageContainerElement);
        }

        revUtils.append(this.headerContainerElement, this.headerCloseLink);

        revUtils.append(this.fullPageContainer, this.headerContainerElement);
        revUtils.append(this.fullPageContainer, this.containerElement);

        revUtils.prepend(document.body, this.fullPageContainer);
    };

    RevInterstitial.prototype.createInnerWidget = function() {
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

    RevInterstitial.prototype.transition = function() {
        var that = this;
        this.innerWidget.emitter.once('imagesLoaded', function() {
            setTimeout(function() { // settle down?
                revUtils.transitionDurationCss(that.fullPageContainer, (that.fullPageContainer.offsetWidth * that.options.transition_duration_multiplier) + 'ms');
                revUtils.transformCss(that.fullPageContainer, 'translateX(0%)');
                // use the current item length in case items were removed
                that.innerWidget.registerImpressions(true, 0, that.innerWidget.grid.items.length);
                revApi.beacons.setPluginSource(this.options.api_source).attach();
            }, 100);
        });
    };

    RevInterstitial.prototype.resetDocument = function() {
        this.fullPageContainer.style.display = 'none';
        document.body.style.position = this.bodyPosition;
        document.body.style.overflow = this.bodyOverflow;
        document.body.style.height = this.bodyHeight;

        document.documentElement.style.position = null;
        document.documentElement.style.overflow = null;
        document.documentElement.style.height = null;
    }

    RevInterstitial.prototype.close = function() {
        var that = this;
        revUtils.addEventListener(this.headerCloseLink, 'click', function() {
            revUtils.setCookie('rev-interstitial-closed', 1, (that.options.closed_hours / 24));

            revUtils.transitionDurationCss(that.fullPageContainer, (that.fullPageContainer.offsetWidth * that.options.transition_duration_multiplier) + 'ms');
            revUtils.transformCss(that.fullPageContainer, 'translateX(100%)');

            setTimeout(function(){
                that.resetDocument();
            }, (that.fullPageContainer.offsetWidth * that.options.transition_duration_multiplier));

            return false;
        });
    };

    RevInterstitial.prototype.resize = function() {
        var that = this;
        this.innerWidget.emitter.on('resized', function() {
            var i = 0;
            while (that.innerWidget.containerElement.offsetHeight > that.containerElement.offsetHeight && that.innerWidget.grid.items.length && i < 100) {
                that.innerWidget.grid.remove(that.innerWidget.grid.items[that.innerWidget.grid.items.length - 1].element);
                that.innerWidget.grid.layout();
                i++
            }
        });
    };

    RevInterstitial.prototype.destroy = function() {
        this.resetDocument();
        revUtils.remove(this.fullPageContainer);
    };

    return RevInterstitial;

}));