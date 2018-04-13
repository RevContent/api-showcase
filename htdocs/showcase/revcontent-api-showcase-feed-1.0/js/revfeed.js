/*
Project: Feed
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.Feed = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var Feed = function(opts) {

        var defaults = {
            api_source: 'feed',
            host: 'https://trends.engage.im',
            url: 'https://trends.engage.im/api/v1/',
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            overlay_icons: false, // pass in custom icons or overrides
            image_overlay: false, // pass key value object { content_type: icon }
            image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: false, // pass key value object { content_type: icon }
            ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
            header: 'Feed',
            // per_row: {
            //     sm: 2,
            //     md: 3
            // },
            // rows: 3,
            multipliers: {
                line_height: 0,
                margin: 0,
                padding: 0
            },
            css: '',
            headline_size: 3,
            max_headline: false,
            disclosure_text: 'by Engage.IM',
            query_params: false,
            user_ip: false,
            user_agent: false,
            transition_duration_multiplier: 3,
            auto_scroll: true,
            rev_position: 'top_right',
            developer: false,
            disable_pagination: true,
            columns: 1,
            breakpoints: {
                xxs: 0,
                xs: 100,
                sm: 549,
                md: 550,
                lg: 700,
                xl: 1001,
                xxl: 1500
            },
            rows: 4,
            infinite: true,
            column_spans: [],
            image_ratio: '6:3',
            internal_selector: false, // dynamic based on internal, sponsored, initial_internal and initial_sponsored options
            headline_top_selector: false,
            // headline_icon_selector: '.rev-content:nth-child(4n+10), .rev-content:nth-child(4n+11)',
            // headline_icon_selector: '.rev-content',
            viewable_percentage: 50,
            buffer: 500,
            brand_logo: false,
            brand_logo_secondary: false,
            window_width_devices: [
                'phone'
            ],
            mock: false,
            comment_div: false,
            reaction_id: 299,
            mobile_image_optimize: false,
            trending_utm: false,
            keywords: false,
            disclosure_about_src: '//trends.engage.im/engage-about.php',
            disclosure_about_height: 463,
            disclosure_interest_src: '//trends.engage.im/engage-interests.php',
            disclosure_interest_height: 1066,
            internal: 2,
            sponsored: 1,
            initial_internal: 2,
            initial_sponsored: 1,
            masonry_layout: false,
            img_host: 'https://img.engage.im',
            author_name:'',
            topic_title:'',
            user: null,
            content: [],
            view: false,
            test: false,
            comment_truncate_length: 500,
            reply_truncate_length: 100,
            comment_truncate_length_mobile: 500,
            reply_truncate_length_mobile: 100,
            comments_enabled: false,
            default_avatar_url: 'mm',//gravatar mystery man
            emitter: new EvEmitter(),
            contextual_last_sort: []
        };

        // merge options
        this.options = Object.assign(defaults, opts);

        this.options.authenticated = this.options.user ? true : null;

        if (!this.options.internal_selector) {

            this.options.internal_selector = '';

            if (this.options.initial_sponsored || this.options.sponsored) { // we have sponsored, determine what should be internal

                for (var i = 1; i <= this.options.initial_internal; i++) { // initial internal using nth-child
                    this.options.internal_selector += 'article:nth-of-type('+ i +'),';
                }

                // internal starts up again
                var start = (this.options.initial_internal + this.options.initial_sponsored + 1);

                if (this.options.sponsored) { // pattern for sponsored based on internal
                    for (var i = 1; i <= this.options.internal; i++) {
                        this.options.internal_selector += 'article:nth-of-type('+ (this.options.internal + this.options.sponsored) +'n + '+ start +'),';
                        start++;
                    }
                } else if (this.options.initial_sponsored) { // only inital sponsored so everything after start will be internal
                    this.options.internal_selector += 'article:nth-of-type(n+'+ start +'),';
                }
                // trim comma
                this.options.internal_selector = this.options.internal_selector.slice(0, -1);
            } else { // everything is internal
                this.options.internal_selector = 'article';
            }
        }

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

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-feed',  this.options.css);

        this.init();
    };

    Feed.prototype.init = function() {
        var self = this;
        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-feed';

        revUtils.append(this.element, this.containerElement);

        this.windowWidth();

        this.options.active = true;

        this.innerWidget = this.createInnerWidget(this.containerElement, this.options);
        this.cornerButton = this.createCornerButton(this.options);
        this.userMenu = this.createMenu(this.options);
    };

    Feed.prototype.windowWidth = function() {

        if (this.options.window_width_devices && revDetect.show(this.options.window_width_devices)) {
            this.options.window_width_enabled = true;

            var that = this;

            revUtils.addEventListener(window, 'resize', function() {
                setElementWindowWidth();
            });

            var setElementWindowWidth = function() {
                // ENG-261/ENG-269 Using "Flushed" state and margin changes instead of transform (for now)
                // NOTE: Use of transform on outer grid will break "fixed" positioning of child elements.
                //revUtils.transformCss(that.element, 'none');
                that.element.style.width = document.body.offsetWidth + 'px';
                that.element.style.overflow = 'hidden';
                that.enterFlushedState(that.element);
                //revUtils.transformCss(that.element, 'translateX(-' + that.element.getBoundingClientRect().left + 'px)');
            };

            setElementWindowWidth();
        }
    };

    Feed.prototype.enterFlushedState  = function(grid){
        if(grid.classList.contains('is-flushed')) { return; }
        this.options.window_width_enabled = true;
        //if(!this.innerWidget.containerElement.classList.contains('rev-slider-window-width')) {
        //    revUtils.addClass(this.innerWidget.containerElement, 'rev-slider-window-width');
        //}
        var grid_rect = this.element.getBoundingClientRect();
        var back = grid.querySelector('div#go-back-bar');
        if(back !== null) {
            back.style.width = grid_rect.width + 'px';
        }
        grid.style.backgroundColor = '#ffffff';
        grid.style.marginLeft = '-' + grid_rect.left + 'px';
        grid.style.marginRight = '-' + grid_rect.left + 'px';
        grid.style.overflow = 'hidden';
        grid.classList.add("is-flushed");
        window.dispatchEvent(new Event('resize'));
    };

    // Feed.prototype.leaveFlushedState = function(grid){
    //     if(!grid.classList.contains('is-flushed')) { return; }
    //     this.options.window_width_enabled = false;
    //     //revUtils.removeClass(this.innerWidget.containerElement, 'rev-slider-window-width');
    //     grid.classList.remove("is-flushed");
    //     var back = grid.querySelector('div#go-back-bar');
    //     if(back !== null) {
    //         grid.querySelector('div#go-back-bar').style.width = '100%';
    //     }
    //     grid.style.backgroundColor = 'transparent';
    //     grid.style.marginLeft = 0;
    //     grid.style.marginRight = 0;
    //     window.dispatchEvent(new Event('resize'));
    // };

    Feed.prototype.createInnerWidget = function(element, options) {
        options.element = element;
        options.active = true;
        return new RevSlider(options);
    };

    Feed.prototype.createCornerButton = function(options) {
        options.innerWidget = this.innerWidget;
        options.containerElement = this.containerElement;
        return new EngageCornerButton(options);
    };

    Feed.prototype.createMenu = function(options) {
        return new EngageUserMenu(options);
    };

    return Feed;

}));