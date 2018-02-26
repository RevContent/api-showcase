/*
ooooooooo.                          .oooooo..o oooo   o8o        .o8
`888   `Y88.                       d8P'    `Y8 `888   `"'       "888
 888   .d88'  .ooooo.  oooo    ooo Y88bo.       888  oooo   .oooo888   .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'   `"Y8888o.   888  `888  d88' `888  d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        `"Y88b  888   888  888   888  888ooo888  888
 888  `88b.  888    .o    `888'    oo     .d8P  888   888  888   888  888    .o  888
o888o  o888o `Y8bod8P'     `8'     8""88888P'  o888o o888o `Y8bod88P" `Y8bod8P' d888b

Project: RevSlider
Version: 1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevSlider = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDisclose);
}( window, function factory(window, revUtils, revDetect, revApi, revDisclose) {
'use strict';

    var RevSlider = function(opts,handles) {

        var defaults = {
            impression_tracker: [],
            api_source: 'slide',
            element: false,
            item_breakpoints: {
                xxs: 200,
                xs: 275,
                sm: 350,
                md: 425,
                lg: 500,
                xl: 575,
                xxl: 650,
            },
            breakpoints: {
                xxs: 0,
                xs: 250,
                sm: 500,
                md: 750,
                lg: 1000,
                xl: 1250,
                xxl: 1500
            },
            rows: {
                xxs: 2,
                xs: 2,
                sm: 2,
                md: 2,
                lg: 2,
                xl: 2,
                xxl: 2
            },
            per_row: {
                xxs: 1,
                xs: 2,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            is_resize_bound: true,
            image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            show_arrows: {
                mobile: true,
                desktop: true
            },
            internal: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/',
            host: 'https://trends.revcontent.com',
            img_host: 'https://img.engage.im',
            headline_size: 3,
            max_headline: false,
            min_headline_height: 17,
            text_overlay: false,
            vertical: false,
            wrap_pages: true, //currently the only supported option
            wrap_reverse: true, //currently the only supported option
            show_padding: true,
            pages: 4,
            row_pages: false, // use rows for page count, overrides pages option
            text_right: false,
            text_right_height: 100,
            transition_duration: 0,
            multipliers: {
                line_height: 0,
                margin: 0,
                padding: 0
            },
            prevent_default_pan: true,
            buttons: {
                forward: true,
                back: true,
                size: 40,
                position: 'inside',
                style: 'default',
                dual: false
            },
            disclosure_text: 'by Revcontent',
            hide_provider: false,
            hide_header: false,
            hide_footer: false,
            beacons: true,
            pagination_dots: false,
            touch_direction: typeof Hammer !== 'undefined' ? Hammer.DIRECTION_HORIZONTAL : false, // don't prevent vertical scrolling
            overlay_icons: false, // pass in custom icons or overrides
            image_overlay: false, // pass key value object { content_type: icon }
            image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: false, // pass key value object { content_type: icon }
            ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
            query_params: false,
            register_views: true, // manage views or false to let someone else do it
            user_ip: false,
            user_agent: false,
            css: '',
            disable_pagination: false,
            register_impressions: true,
            visible_rows: false,
            column_spans: false,
            pagination_dots_vertical: false,
            stacked: false,
            destroy: false,
            fit_height: false,
            fit_height_clip: false,
            developer: false,
            headline_icon_selector: false,
            internal_selector: false,
            reactions_selector: false,
            headline_top_selector: false,
            brand_logo: false,
            brand_logo_secondary: false,
            comment_div: false,
            window_width_enabled: false,
            reactions: [ 'love', 'exciting', 'interesting', 'gross', 'sad', 'angry' ],
            initial_icon_colors: [
                'EF5350',
                'F06292',
                'BA68C8',
                '9575CD',
                '7986CB',
                '64B5F6',
                '4FC3F7',
                '4DD0E1',
                '4DB6AC',
                '81C784',
                '9CCC65',
                'D4E157',
                'FFF176',
                'FFD54F',
                'FFB74D',
                'FF8A65',
                'A1887F'
            ],
            reaction_id: 5,
            mobile_image_optimize: 1.2,
            trending_utm: false,
            keywords: false,
            disclosure_about_src: '//trends.engage.im/engage-about.php',
            disclosure_about_height: 575,
            disclosure_interest_src: '//trends.engage.im/engage-interests.php',
            disclosure_interest_height: 520,
            masonry_layout: false
        };

        // merge options
        this.options = revUtils.extend(defaults, revUtils.deprecateOptions(opts));
        this.handlers = handles;

        // store options
        revUtils.storeUserOptions(this.options);

        if (revUtils.validateApiParams(this.options).length) {
            return;
        }

        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        var that = this;

        this.emitter = new EventEmitter();

        revDisclose.setEmitter(this.emitter);

        this.emitter.on('dialog_closed', function() {
            that.isAuthenticated(function(response) {
                that.updateAuthElements();
                that.processQueue();
                if (response === true) {
                    if (!that.personalized) {
                        that.showPersonalizedTransition();
                        that.personalize();
                    }
                }
            });
        });

        this.data = [];
        this.displayedItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider2';

        this.innerContainerElement = document.createElement('div');
        this.innerContainerElement.id = 'rev-slider-container';

        this.innerElement = document.createElement('div');
        this.innerElement.id = 'rev-slider-inner';

        this.gridTransitionContainer = document.createElement('div');
        this.gridTransitionContainer.id = 'rev-slider-grid-transition-container';

        this.gridTransitionElement = document.createElement('div');
        this.gridTransitionElement.id = 'rev-slider-grid-transition';

        this.gridContainerElement = document.createElement('div');
        this.gridContainerElement.id = 'rev-slider-grid-container';

        var gridElement = document.createElement('div');
        gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';
        this.element.innerHTML="";

        if(this.options.history_stack.length>0){

            var header = document.createElement('div');
            if(this.options.topic_id>0){
                header.innerHTML="<h3>"+this.options.topic_title+" Articles</h3>";
            }
            if(this.options.author_name && this.options.author_name.length>0){
                header.innerHTML="<h3>Articles By "+this.options.author_name+"</h3>";
            }
            this.containerElement.appendChild(header);
            var back = document.createElement('button');
            back.innerHTML = "Back";
            this.containerElement.appendChild(back);
            revUtils.addEventListener(back,'click',this.handlers.back);
        }

        revUtils.append(this.containerElement, this.innerContainerElement);

        revUtils.append(this.innerContainerElement, this.innerElement);

        revUtils.append(this.innerElement, this.gridTransitionContainer);

        revUtils.append(this.gridTransitionContainer, this.gridTransitionElement);

        revUtils.append(this.gridTransitionElement, this.gridContainerElement);

        revUtils.append(this.gridContainerElement, gridElement);

        revUtils.append(this.element, this.containerElement);

        revUtils.dispatchScrollbarResizeEvent();

        this.grid = new AnyGrid(gridElement, this.gridOptions());

        this.setGridClasses();

        // SWIPE Feature (Explore Panel)
        // this.appendExplorePanel(this.grid);

        this.grid.on('resize', function() {
            that.resize();
        });

        // inject:mock
        // endinject

        this.interests = {
            list: [],
            subscribed: [],
            subscribed_ids: [],
            available: [],
            recommended: [],
            count: 0
        };

        this.authenticated = false;

        this.queue = [];
        this.queueRetries = 0;

        this.getData();

        var that = this;

        if (this.grid.perRow > 1) { // if more than one row relayout when font loads
            if (typeof FontFaceObserver !== 'undefined') {
                var fontNormal = new FontFaceObserver('Montserrat');
                var fontBold = new FontFaceObserver('Montserrat', { weight: 500 });

                Promise.all([fontNormal.load(), fontBold.load()]).then(function () {
                    that.grid.layout();
                }).catch(function(e) {
                    console.log(e);
                });
            }
        }

        this.dataPromise.then(function(data) {
            that.updateDisplayedItems(that.grid.items, data);
            if (that.options.beacons) {
                revApi.beacons.setPluginSource(that.options.api_source).attach();
            }
        }, function(e) {
            console.log(e);
            that.destroy();
        }).catch(function(e) {
            console.log(e);
        });

        this.offset = 0;

        this.appendElements();
    };

    RevSlider.prototype.personalize = function() {
        var that = this;

        var personalize = function(time) {
            var starttime = new Date().getTime();
            that.personalized = true;

            // TODO
            // that.updateVideoItems(that.mockVideosAuthenticated);

            var internalPersonalizedCount = 0;
            for (var i = 0; i < that.grid.items.length; i++) {
                if (that.grid.items[i].type === 'internal') {
                    internalPersonalizedCount++;
                }
            }

            if (internalPersonalizedCount) {
                var internalURL = that.generateUrl(0, internalPersonalizedCount, false, false, true);
                revApi.request(internalURL, function(resp) {
                    var totaltime = ((new Date().getTime() - starttime) + time);

                    var finishPersonalize = function() {
                        that.updateDisplayedItems(that.grid.items, [{
                            type: 'internal',
                            data: resp
                        }]);
                        that.closePersonalizedTransition();
                    }

                    var mintime = 7000; // show for a minimum of 7s
                    if (totaltime > mintime) {
                        finishPersonalize();
                    } else {
                        setTimeout(function() {
                            finishPersonalize();
                        }, mintime - totaltime)
                    }
                });
            }

            // TODO
            // var sponsoredPersonalizedCount = 0;
            // for (var i = 0; i < that.grid.items.length; i++) {
            //     if (that.grid.items[i].type === 'sponsored') {
            //         sponsoredPersonalizedCount++;
            //     }
            // }

            // if (sponsoredPersonalizedCount && that.mockSponsoredPersonalized) {
            //     data.push({
            //         type: 'sponsored',
            //         data: that.mockSponsoredPersonalized.slice(0, sponsoredPersonalizedCount)
            //     });
            // }
        }

        var requestInterests = function(time) {
            return new Promise(function(resolve, reject) {
                var request = function() {
                    var totaltime = new Date().getTime() - time;

                    if (totaltime > 8000) { // stop after 8 seconds
                        reject();
                        return;
                    }

                    revApi.request( that.options.host + '/api/v1/engage/getinterests.php?', function(data) {
                        if (!data.subscribed || !data.subscribed.length) { // test with && totaltime < 1200
                            setTimeout(function() {
                                request();
                            }, 2000);
                        } else {
                            resolve(totaltime);
                        }
                    });
                }
                request();
            }).catch(function(e) {
                console.log(e);
            });
        };

        requestInterests(new Date().getTime()).then(function(time) {
            personalize(time);
            // TODO animate in new content
        }, function() {
            // TODO display message that no personalized content
            that.closePersonalizedTransition();
        }).catch(function(e) {
            console.log(e);
        });
    };

    RevSlider.prototype.setGridClasses = function() {
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.vertical ? 'vertical' : 'horizontal'));
        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

        if (revDetect.mobile()) {
            revUtils.addClass(this.containerElement, 'rev-slider-mobile');
        }

        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons ? (this.options.buttons.style ? this.options.buttons.style : 'none') : 'none'));

        if (this.options.disable_pagination) {
            revUtils.addClass(this.containerElement, 'rev-slider-pagination-disabled');
        }

        revUtils[this.options.disable_pagination ? 'removeClass' : 'addClass'](this.containerElement, 'rev-slider-pagination');

        if (this.options.window_width_enabled) {
            revUtils.addClass(this.containerElement, 'rev-slider-window-width');
        }

        revUtils.removeClass(this.containerElement, 'rev-slider-breakpoint', true);
        revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-' + this.grid.getBreakPoint());
        var greaterLessThanBreakPoints = this.grid.getGreaterLessThanBreakPoints();
        for (var i = 0; i < greaterLessThanBreakPoints.gt.length; i++) {
            revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-gt-' + greaterLessThanBreakPoints.gt[i]);
        }
        for (var i = 0; i < greaterLessThanBreakPoints.lt.length; i++) {
            revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-lt-' + greaterLessThanBreakPoints.lt[i]);
        }

        revUtils.removeClass(this.containerElement, 'rev-slider-col', true);
        revUtils.removeClass(this.containerElement, 'rev-slider-row', true);
        revUtils.addClass(this.containerElement, 'rev-slider-col-' + this.grid.perRow);
        revUtils.addClass(this.containerElement, 'rev-slider-row-' + this.grid.nextRow);
    };

    RevSlider.prototype.createCells = function(grid) {
        var i = 0; // just in case
        this.limit = 0;
        this.internalLimit = 0;
        this.sponsoredLimit = 0;
        this.visibleLimit = 0;

        var rowData = this.createRows(grid, this.options.rows, true);

        this.viewableItems = rowData.items;
        this.limit = rowData.limit;
        this.internalLimit = rowData.internalLimit;
        this.sponsoredLimit = rowData.sponsoredLimit;
    };

    RevSlider.prototype.milliFormatter = function(value) {
        return value > 999 ? (value/1000).toFixed(1) + 'k' : value
    }

    RevSlider.prototype.createRows = function(grid, rows, initial) {
        var i = 0; // just in case
        var limit = 0;
        var internalLimit = 0;
        var sponsoredLimit = 0;
        var itemsArr = [];
        var rowLen = rows.length;
        // this.visibleLimit = 0;

        var total = this.options.rows * grid.perRow;

        // reactions
        var like_b64 = '<div class="rev-reaction rev-reaction-like">' +
                '<div class="rev-reaction-menu">' +
                    '<div class="rev-reaction-icon rev-reaction-icon-love">' +
                        '<div class="rev-reaction-menu-container">' +
                            '<div class="rev-reaction-menu-inner">' +
                                '<div class="rev-reaction-menu-item rev-reaction-menu-item-count rev-reaction-menu-item-count-pos"><div class="rev-reaction-menu-item-count-inner"></div></div>' +
                                '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[4] + '"><div data-icon="' + this.options.reactions[4] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[4] + '"></div></div>' +
                                '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[5] + '"><div data-icon="' + this.options.reactions[5] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[5] + '"></div></div>' +
                                '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[3] + '"><div data-icon="' + this.options.reactions[3] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[3] + '"></div></div>' +
                                '<div class="rev-reaction-menu-item rev-reaction-menu-item-count rev-reaction-menu-item-count-neg"><div class="rev-reaction-menu-item-count-inner"></div></div>' +
                                '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[2] + '"><div data-icon="' + this.options.reactions[2] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[2] + '"></div></div>' +
                                '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="'+ this.options.reactions[0] +'"><div data-icon="' + this.options.reactions[0] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[0] + '"></div></div>' +
                                '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[1] + '"><div data-icon="' + this.options.reactions[1] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[1] + '"></div></div>' +
                                '<div class="rev-reaction-menu-mask"><div class="rev-reaction-menu-mask-inner">' + "<?xml version='1.0' ?><!DOCTYPE svg  PUBLIC '-//W3C//DTD SVG 1.1//EN'  'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'><svg enable-background='new 0 0 24 24' height='24px' id='Layer_1' version='1.1' viewBox='0 0 24 24' width='24px' xml:space='preserve' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><g><polygon points='17.5,1 11,7.5 15,7.5 15,17.75 15,21.5 15,22.5 16,22.5 19,22.5 20,22.5 20,21.5 20,17.75 20,7.5 24,7.5  '/><polygon points='9,6.25 9,2.5 9,1.5 8,1.5 5,1.5 4,1.5 4,2.5 4,6.25 4,16.5 0,16.5 6.5,23 13,16.5 9,16.5  '/></g></svg>" + '</div></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        var comment_b64 = '<a href="#' + (this.options.comment_div ? this.options.comment_div : this.options.feed_id) + '" class="rev-reaction rev-reaction-comment"><div class="rev-reaction-icon rev-reaction-icon-comment"></div></a>';
        var share_b64 = '<a href="https://www.facebook.com/sharer/sharer.php?u='+ this.options.domain +'" target="_blank" class="rev-reaction rev-reaction-share"><div class="rev-reaction-icon rev-reaction-icon-share"></div></a>';

        var items = [];
        var layoutItems = [];
        var reactionHtml = []; // don't want to store this massive string

        // TODO: make this a 2 step process. first append single element then get type, second add innerhtml
        for (var i = 0; i < total; i++) {

            //  && i == patternTotal
            // @todo find replacement/correct var for patternTotal
            if (!this.interestsCarouselVisible && i == 3) {
                this.interestsCarouselVisible = true;
                layoutItems = layoutItems.concat(this.appendInterestsCarousel(grid,this.authenticated));
                i--;
                continue;
            }

            if (!this.authenticated && i == 1 && !this.feedAuthButtonVisible) {
                this.feedAuthButtonVisible = true;
                var feedAuthButton = this.appendfeedAuthButton(grid);
                layoutItems = layoutItems.concat(feedAuthButton);
                i--;
                continue;
            }

            var element = this.createNewCell();
            // items.push(item);
            grid.element.appendChild(element);

            var added = grid.addItems([element]);

            added[0].reactions = true; // everything has reactions

            // var reactionsContainer = document.createElement('div');

            if (this.options.internal_selector && matchesSelector(element, this.options.internal_selector)) {
                added[0].type = 'internal';
                internalLimit++;
                reactionHtml.push(like_b64 + comment_b64 + share_b64);
            } else {
                added[0].type = 'sponsored';
                sponsoredLimit++;

                reactionHtml.push(like_b64);
                revUtils.addClass(element.querySelector('.rev-reactions'), 'rev-reactions-single');
            }

            // reactionsContainer.innerHTML = '<div class="rev-reaction-bar">' + reactionHtml + '</div>';
            // revUtils.addClass(reactionsContainer, 'rev-reactions');
            // element.querySelector('.rev-content-inner').appendChild(reactionsContainer);

            // this.handleShareAction(added[0]);
            // this.handleReactionMenu(added[0]);

            layoutItems = layoutItems.concat(added);
            items = items.concat(added);
            limit++;
        }

        grid.layoutItems(layoutItems, true);

        if (feedAuthButton && feedAuthButton.length) {
            this.resizeHeadlineLines(feedAuthButton[0].element.querySelector('.rev-auth-headline'));
            // grid.layoutItems(layoutItems, true);
        }

        // strictly for perf
        for (var i = 0; i < items.length; i++) {
            items[i].element.querySelector('.rev-reaction-bar').innerHTML = reactionHtml[i];
            this.handleShareAction(items[i]);
            this.handleReactionMenu(items[i]);
            if (items[i].type == 'internal') {
                this.handleBookmarkAction(items[i]);
            }
        }

        return {
            items: items,
            limit: limit,
            internalLimit: internalLimit,
            sponsoredLimit: sponsoredLimit
        }
    }

    RevSlider.prototype.appendfeedAuthButton = function(grid) {
        this.feedAuthButton = document.createElement('div');
        this.feedAuthButton.className = 'rev-content';
        // TODO: remove background: none hack. Only way to get button shadow to show
        this.feedAuthButton.innerHTML = '<div class="rev-content-inner" style="background: none;"><div class="rev-auth-mask"></div><div class="rev-auth">' +
        '<div class="rev-auth-box">' +
            '<div class="rev-auth-box-inner" style="margin-bottom: 30px;">' +

                '<div class="rev-auth-headline">' +
                    '<span class="rev-engage-type-txt">Hey there! Connect your account to<br /> surface personalized <strong>and</strong> relevant content!</span>' +
                '</div>' +

                '<div class="rev-auth-button">' +
                    this.revAuthButtonIconHtml() +
                    '<div class="rev-auth-button-text">' +
                        'Personalize with facebook' +
                    '</div>' +
                '</div>' +

                '<div class="rev-auth-buttonline">Once personalized the content recommendations on this page will be based on the pages you\'ve liked and urls you\'ve shared on Facebook</div>' +

                '<div class="rev-auth-terms">' +
                    '<span>by signing up you agree to the <a target="_blank" href="//www.engage.im/privacy.html">Terms</a></span>' +
                    // '<span>|</span>' +
                    // '<a href="#">Privacy Policy</a>' +
                '</div>' +
            '</div>' +
        '</div></div></div>';

        grid.element.appendChild(this.feedAuthButton);

        revUtils.addEventListener(this.feedAuthButton.querySelector('.rev-auth-button'), 'click', this.authButtonHandler.bind(this, false));

        return grid.addItems([this.feedAuthButton]);
    }

    RevSlider.prototype.handleReactionMenu = function(item) {
        var that = this;
        var likeReactionElement = item.element.querySelector('.rev-reaction-icon');

        if (revDetect.mobile()) {

            // TODO - see related todo in revfeed.scss
            // revUtils.addEventListener(item.element.querySelector('.rev-reactions'), 'mouseover', function(ev) {
            //     ev.preventDefault();
            //     revUtils.addClass(item.element, 'rev-user-select-none');
            // }, {passive: false});

            this.mc = new Hammer(likeReactionElement, {
                recognizers: [
                    [
                        Hammer.Press,
                        {
                            time: 200
                        }
                    ],
                    [
                        Hammer.Tap,
                        // {
                        //     threshold: 2
                        // }
                    ],

                ],
                // domEvents: true
            });

            revUtils.addEventListener(likeReactionElement, 'touchstart', function(ev) {
                ev.stopPropagation();
                ev.preventDefault();
            }, {passive: false});

            this.mc.on('tap', function(ev) {
                var iconName = ev.target.getAttribute('data-icon');

                // revUtils.removeClass(item.element, 'rev-menu-active');

                if (iconName) {

                    revApi.request( that.options.host + '/api/v1/engage/addreaction.php?r=' + iconName + '&url=' + encodeURI(item.data.url), function(data) {
                        return;
                    });

                    likeReactionElement.setAttribute('data-active', iconName);

                    var icon = item.element.querySelector('.rev-reaction-like .rev-reaction-icon');

                    revUtils.removeClass(icon, 'rev-reaction-icon-', true);
                    revUtils.addClass(icon, 'rev-reaction-icon-' + iconName);

                    revUtils.addClass(icon, 'rev-reaction-icon-selected'); // TODO: this should not be needed
                    revUtils.removeClass(item.element, 'rev-menu-active');

                    var count = item.element.querySelector('.rev-reaction-count');
                    count.style.marginLeft = null; // remove margin left

                    if (!item.element.querySelector('.rev-reactions-total-inner .rev-reaction.rev-reaction-'+ iconName)) {
                        var iconTotal = 0;
                        var icons = item.element.querySelectorAll('.rev-reactions-total-inner .rev-reaction');
                        if (icons) {
                            iconTotal = icons.length;
                        }
                        item.element.querySelector('.rev-reactions-total-inner').insertAdjacentHTML('afterbegin', '<div style="z-index:' + (100 + iconTotal) + ';" class="rev-reaction rev-reaction-'+ iconName +'"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-'+ iconName +'-full"></div></div></div>');
                    }

                    that.setReactionText(item);

                    that.reactionCount(item, iconName, true);

                    that.transitionLogin(item, 'reaction');

                    return;
                }

                // revUtils.removeClass(item.element, 'rev-menu-active');
                // clearTimeout(that.likeReactionIconShowTimeout);

                var iconName = 'love';

                if (likeReactionElement.getAttribute('data-active')) {
                    iconName = likeReactionElement.getAttribute('data-active');

                    likeReactionElement.removeAttribute('data-active');

                    revUtils.removeClass(likeReactionElement, 'rev-reaction-icon-', true);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-love');

                    that.reactionCount(item, iconName, false);

                    // var count = item.element.querySelector('.rev-reaction-count');
                    // count.innerHTML = count.innerHTML.split(' ')[2];
                } else {
                    likeReactionElement.setAttribute('data-active', iconName);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-like');

                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-selected'); // TODO: this should not be needed

                    var count = item.element.querySelector('.rev-reaction-count');
                    count.style.marginLeft = null; // remove margin left

                    if (!item.element.querySelector('.rev-reactions-total-inner .rev-reaction.rev-reaction-'+ iconName)) {
                        var iconTotal = 0;
                        var icons = item.element.querySelectorAll('.rev-reactions-total-inner .rev-reaction');
                        if (icons) {
                            iconTotal = icons.length;
                        }
                        item.element.querySelector('.rev-reactions-total-inner').insertAdjacentHTML('afterbegin', '<div style="z-index:' + (100 + iconTotal) + ';" class="rev-reaction rev-reaction-'+ iconName +'"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-'+ iconName +'-full"></div></div></div>');
                    }

                    that.reactionCount(item, iconName, true);

                    that.setReactionText(item);
                }

                that.transitionLogin(item, 'reaction');
            });

            this.mc.on('press', function(ev) {
                // TODO REMOVE THIS and shit
                var dataIcon = ev.target.getAttribute('data-icon');
                if (dataIcon) {
                    return;
                }
                // ev.srcEvent.stopPropagation();
                // ev.preventDefault();
                revUtils.addClass(item.element, 'rev-menu-active');

                var listener = function(ev) {
                    ev.stopPropagation();
                    revUtils.removeClass(item.element, 'rev-user-select-none');
                    revUtils.removeClass(item.element, 'rev-menu-active');

                    // ev.preventDefault(); // TODO
                    revUtils.removeEventListener(window, 'touchstart', listener);
                };

                revUtils.addEventListener(window, 'touchstart', listener, {passive: false});
            });
        } else {

            revUtils.addEventListener(likeReactionElement, 'mouseenter', function(ev) {
                revUtils.addClass(likeReactionElement, 'rev-reaction-icon-active');
                clearTimeout(that.likeReactionIconHideTimeout);
                clearTimeout(that.likeReactionIconHideTimeoutInner);

                that.likeReactionIconShowTimeout = setTimeout(function() {
                    revUtils.addClass(item.element, 'rev-menu-active');
                }, 200);
            });

            revUtils.addEventListener(likeReactionElement, 'mouseleave', function(ev) {
                clearTimeout(that.likeReactionIconShowTimeout);

                that.likeReactionIconHideTimeout = setTimeout(function() {
                    revUtils.removeClass(likeReactionElement, 'rev-reaction-icon-active');
                    that.likeReactionIconHideTimeoutInner = setTimeout(function() {
                        revUtils.removeClass(item.element, 'rev-menu-active');
                    }, 600);
                }, 400);
            });

            revUtils.addEventListener(item.element.querySelector('.rev-reaction-menu-container'), 'click', function(ev) {
                ev.stopPropagation();
                ev.preventDefault();
            }, {passive: false});

            revUtils.addEventListener(likeReactionElement, 'click', function(ev) {

                var iconName = 'love';

                revUtils.removeClass(item.element, 'rev-menu-active');
                clearTimeout(that.likeReactionIconShowTimeout);

                if (likeReactionElement.getAttribute('data-active')) {

                    iconName = likeReactionElement.getAttribute('data-active');

                    likeReactionElement.removeAttribute('data-active');

                    revUtils.removeClass(likeReactionElement, 'rev-reaction-icon-', true);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-love');

                    that.reactionCount(item, iconName, false);
                } else {
                    likeReactionElement.setAttribute('data-active', iconName);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-like');

                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-selected'); // TODO: this should not be needed

                    var count = item.element.querySelector('.rev-reaction-count');

                    count.style.marginLeft = null; // remove margin left

                    revApi.request( that.options.host + '/api/v1/engage/addreaction.php?r=' + iconName + '&url=' + encodeURI(item.data.url), function(data) {
                        return;
                    });

                    if (!item.element.querySelector('.rev-reactions-total-inner .rev-reaction.rev-reaction-'+ iconName)) {
                        var iconTotal = 0;
                        var icons = item.element.querySelectorAll('.rev-reactions-total-inner .rev-reaction');
                        if (icons) {
                            iconTotal = icons.length;
                        }

                        item.element.querySelector('.rev-reactions-total-inner').insertAdjacentHTML('afterbegin', '<div style="z-index:' + (100 + iconTotal) + ';" class="rev-reaction rev-reaction-'+ iconName +'"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-'+ iconName +'-full"></div></div></div>');
                    }

                    that.reactionCount(item, iconName, true);

                    that.setReactionText(item);
                }

                that.transitionLogin(item, 'reaction');
            });

            var menuItems = item.element.querySelectorAll('.rev-reaction-menu-item');

            for (var menuItemCount = 0; menuItemCount < menuItems.length; menuItemCount++) {
                revUtils.addEventListener(menuItems[menuItemCount], 'click', function(ev) {

                    ev.preventDefault();
                    ev.stopPropagation();

                    var iconName = ev.target.getAttribute('data-icon');

                    if (!iconName) {
                        return;
                    }

                    revApi.request( that.options.host + '/api/v1/engage/addreaction.php?r=' + iconName + '&url=' + encodeURI(item.data.url), function(data) {
                        return;
                    });

                    likeReactionElement.setAttribute('data-active', iconName);

                    var icon = item.element.querySelector('.rev-reaction-like .rev-reaction-icon');

                    revUtils.removeClass(icon, 'rev-reaction-icon-', true);
                    revUtils.addClass(icon, 'rev-reaction-icon-' + iconName);

                    revUtils.addClass(icon, 'rev-reaction-icon-selected'); // TODO: this should not be needed

                    // revUtils.removeClass(el.target.parentNode.parentNode.parentNode, 'rev-active');
                    revUtils.removeClass(item.element, 'rev-menu-active');

                    var count = item.element.querySelector('.rev-reaction-count');

                    count.style.marginLeft = null; // remove margin left

                    if (!item.element.querySelector('.rev-reactions-total-inner .rev-reaction.rev-reaction-'+ iconName)) {
                        var iconTotal = 0;
                        var icons = item.element.querySelectorAll('.rev-reactions-total-inner .rev-reaction');
                        if (icons) {
                            iconTotal = icons.length;
                        }
                        item.element.querySelector('.rev-reactions-total-inner').insertAdjacentHTML('afterbegin', '<div style="z-index:' + (100 + iconTotal) + ';" class="rev-reaction rev-reaction-'+ iconName +'"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-'+ iconName +'-full"></div></div></div>');
                    }

                    that.reactionCount(item, iconName, true);

                    that.setReactionText(item);

                    that.transitionLogin(item, 'reaction');

                }, {passive: false});
            }
        }
    };

    RevSlider.prototype.resizeHeadlineLines = function(headline) {
        var lineHeight = parseInt(revUtils.getComputedStyle(headline, 'line-height'));
        var fontSize = parseInt(revUtils.getComputedStyle(headline, 'font-size'));
        var height = parseInt(revUtils.getComputedStyle(headline, 'height'));
        var lines = height / lineHeight;

        var fallback = 0; // just in case
        while(lines >= 3 && fallback < 100) {
            fallback++;

            fontSize--;
            lineHeight--;

            headline.style.fontSize = fontSize + 'px';
            headline.style.lineHeight = lineHeight + 'px';

            height = parseInt(revUtils.getComputedStyle(headline, 'height'));

            lines = height / lineHeight;
        }
    }

    RevSlider.prototype.transitionLogin = function(item, engagetype) {
        var that = this;
        setTimeout(function() {
            var engagetxt = item.element.querySelector('.rev-engage-type-txt');

            if (engagetxt) {
                if (engagetype == 'reaction') {
                    engagetxt.innerHTML = 'Almost Done! Login to save your reaction';
                } else if (engagetype == 'bookmark') {
                    engagetxt.innerHTML = 'Almost Done! Login to save your bookmark';
                }
            }

            var headline = item.element.querySelector('.rev-auth-headline');

            that.resizeHeadlineLines(headline);

            // reduce margins based on vertical space
            var revAuth = item.element.querySelector('.rev-auth');

            var revAuthSiteLogo = item.element.querySelector('.rev-auth-site-logo');
            var revAuthBoxInner = item.element.querySelector('.rev-auth-box-inner');

            var innerHeight = revAuthSiteLogo ? (revAuthSiteLogo.offsetHeight + revAuthBoxInner.offsetHeight) : revAuthBoxInner.offsetHeight;

            if (revAuth.offsetHeight < innerHeight) {
                var sanity = 0;
                var zeroed = [];

                var subline = item.element.querySelector('.rev-auth-subline');
                var button = item.element.querySelector('.rev-auth-button');
                var buttonline = item.element.querySelector('.rev-auth-buttonline');
                var terms = item.element.querySelector('.rev-auth-terms');

                while ((sanity < 20) && (zeroed.length < 5) && (revAuth.offsetHeight < innerHeight)) {

                    var sublineMarginTop = parseInt(revUtils.getComputedStyle(subline, 'margin-top'));
                    if (sublineMarginTop > 1) {
                        subline.style.marginTop = (sublineMarginTop - 1) + 'px';
                    } else if(!zeroed.indexOf('subline')) {
                        zeroed.push('subline');
                    }

                    var headlineMarginTop = parseInt(revUtils.getComputedStyle(headline, 'margin-top'));
                    if (headlineMarginTop > 3) {
                        headline.style.marginTop = (headlineMarginTop - 2) + 'px';
                    } else if(!zeroed.indexOf('headline')) {
                        zeroed.push('headline');
                    }

                    var buttonMarginTop = parseInt(revUtils.getComputedStyle(button, 'margin-top'));
                    if (buttonMarginTop > 3) {
                        button.style.marginTop = (buttonMarginTop - 2) + 'px';
                    } else if(!zeroed.indexOf('button')) {
                        zeroed.push('button');
                    }

                    var buttonlineMarginTop = parseInt(revUtils.getComputedStyle(buttonline, 'margin-top'));
                    if (buttonlineMarginTop > 3) {
                        buttonline.style.marginTop = (buttonlineMarginTop - 1) + 'px';
                    } else if(!zeroed.indexOf('buttonline')) {
                        zeroed.push('buttonline');
                    }

                    var termsMarginTop = parseInt(revUtils.getComputedStyle(terms, 'margin-top'));
                    if (termsMarginTop > 1) {
                        terms.style.marginTop = (termsMarginTop - 2) + 'px';
                    } else if(!zeroed.indexOf('terms')) {
                        zeroed.push('terms');
                    }

                    innerHeight = revAuthSiteLogo ? (revAuthSiteLogo.offsetHeight + revAuthBoxInner.offsetHeight) : revAuthBoxInner.offsetHeight;
                    sanity++;
                }
            }

            var logo = item.element.querySelector('.rev-auth-site-logo');
            if (logo) {
                logo.style.width = logo.offsetHeight + 'px';
            }

            if (!that.authenticated) {
                revUtils.removeClass(document.querySelector('.rev-flipped'), 'rev-flipped');
                revUtils.addClass(item.element, 'rev-flipped');
            }
        }, 0);
    };

    RevSlider.prototype.reactionCount = function(item, iconName, increase) {
        if (this.options.reactions.indexOf(iconName) < 3) {
            if (increase) {
                item.reactionCountTotalPos++;
            } else {
                item.reactionCountTotalPos--;
            }
            item.element.querySelector('.rev-reaction-menu-item-count-pos .rev-reaction-menu-item-count-inner').innerText = this.milliFormatter(item.reactionCountTotalPos);
        } else {
            if (increase) {
                item.reactionCountTotalNeg++;
            } else {
                item.reactionCountTotalNeg--;
            }
            item.element.querySelector('.rev-reaction-menu-item-count-neg .rev-reaction-menu-item-count-inner').innerText = this.milliFormatter(item.reactionCountTotalNeg);
        }
    };

    RevSlider.prototype.setReactionText = function(item) {
        var count = item.element.querySelector('.rev-reaction-count');

        if (item.reactionCountTotal === 0) {
            count.innerHTML = 'You reacted!';
        } else {
            count.innerHTML = 'You and ' + item.reactionCountTotal + (item.reactionCountTotal === 1 ? ' other' : ' others');
        }
    };

    RevSlider.prototype.handleShareAction = function(item) {
        var share = item.element.querySelector('.rev-reaction-share');

        if (share) {
            revUtils.addEventListener(share, 'click', function(ev) {
                ev.preventDefault();
                if (!item.data) {
                    return;
                }

                // Fixes dual-screen position                         Most browsers      Firefox
                var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
                var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

                var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
                var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

                var w = width / 2;
                var h = height / 2;

                var left = ((width / 2) - (w / 2)) + dualScreenLeft;
                var top = ((height / 2) - (h / 2)) + dualScreenTop;
                var newWindow = window.open("https://www.facebook.com/sharer/sharer.php?u=" + item.data.target_url, "shareWindow", 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

                // Puts focus on the newWindow
                if (window.focus) {
                    newWindow.focus();
                }
            }, {passive: false});
        }
    }

    RevSlider.prototype.handleBookmarkAction = function(item) {
        var that = this;
        var handleSave = function(bookmark) {
            revUtils.addEventListener(bookmark, revDetect.mobile() ? 'touchstart' : 'click', function(e) {
                if (revUtils.hasClass(bookmark, 'rev-save-active')) {
                    revUtils.removeClass(bookmark, 'rev-save-active');

                    var url = that.options.host + '/api/v1/engage/removebookmark.php?url=' + encodeURI(item.data.target_url) + '&title=' + encodeURI(item.data.headline);

                    if (that.authenticated) {
                        revApi.request(url, function(data) {
                            return;
                        });
                    } else {
                        that.queue.push({
                            type: 'bookmark',
                            url: url
                        });
                    }
                } else {
                    revUtils.addClass(bookmark, 'rev-save-active');

                    if (that.options.window_width_enabled && item.index === 0) { // set overflows if window with for first element
                        that.element.parentNode.style.overflow = 'visible';
                        document.documentElement.style.overflow = 'hidden';
                        document.body.style.overflow = 'hidden';

                        var removeOverflow = function() {
                            document.documentElement.style.overflow = 'visible';
                            document.body.style.overflow = 'visible';
                            that.element.parentNode.style.overflow = 'hidden';
                            revUtils.removeEventListener(window, 'touchstart', removeOverflow);
                        }

                        revUtils.addEventListener(window, 'touchstart', removeOverflow);

                        that.onEndAnimation(bookmark, function() {
                            removeOverflow();
                        });
                    }
                    that.transitionLogin(item, 'bookmark');

                    //save bookmark
                    var url = that.options.host + '/api/v1/engage/addbookmark.php?url=' + encodeURI(item.data.target_url) + '&title=' + encodeURI(item.data.headline);

                    if (that.authenticated) {
                        revApi.request( url, function(data) {
                            return;
                        });
                    } else {
                        that.queue.push({
                            type: 'bookmark',
                            url: url
                        });
                    }
                }
                e.preventDefault();
                e.stopPropagation();

            }, {passive: false});
        }

        var save = document.createElement('div');
        save.className = 'rev-save';
        save.innerHTML = '<?xml version="1.0" ?><svg contentScriptType="text/ecmascript" contentStyleType="text/css" preserveAspectRatio="xMidYMid meet" version="1.0" viewBox="0 0 60.000000 60.000000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" zoomAndPan="magnify"><g><polygon fill="none" points="51.0,59.0 29.564941,45.130005 9.0,59.0 9.0,1.0 51.0,1.0" stroke="#231F20" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2"/></g></svg>'

        revUtils.append(item.element.querySelector('.rev-meta-inner'), save);

        handleSave(save);
    };

    RevSlider.prototype.processQueue = function() {
        var that = this;

        var retryQueue = function() {
            if (that.queueRetries > 5) {
                return; // that's it and that's all
            }

            setTimeout(function() {
                if (that.queue.length) {
                    that.processQueue();
                    that.queueRetries++;
                }
            }, 5000);
        }

        var nextQueue = function(queue) {
            return new Promise(function(resolve, reject) {
                revApi.request(queue.url, function(resp) {
                    if (resp.success == true) {
                        var i = that.queue.indexOf(queue);
                        if(i != -1) {
                            that.queue.splice(i, 1);
                        }
                        that.queueRetries = 0;
                        resolve();
                    } else {
                        reject();
                    }
                });
            }).catch(function(e) {
                console.log(e);
            });
        }

        var test = function(queue) {
            return sequence.then(function() {
                return nextQueue(queue)
            }, function() {
                retryQueue();
            }).catch(function(e) {
                console.log(e);
            });
        }

        var sequence = Promise.resolve();

        for (var i = 0; i < this.queue.length; i++) {
            sequence = test(this.queue[i])
        };

        return sequence;
    };

    RevSlider.prototype.onEndAnimation = function(el, callback) {
        // modified from https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Detecting_CSS_animation_support
        var animation = false,
            animationstring = 'animationend',
            domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
            pfx  = '',
            elem = document.createElement('div');

        if( elem.style.animationName !== undefined ) { animation = true; }

        if( animation === false ) {
            for( var i = 0; i < domPrefixes.length; i++ ) {
                if( elem.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
                    pfx = domPrefixes[ i ];
                    animationstring = pfx.toLowerCase() + 'AnimationEnd';
                    animation = true;
                    break;
                }
            }
        }

        var onEndCallbackFn = function( ev ) {
            if( animation ) {
                if( ev.target != this ) return;
                this.removeEventListener( animationstring, onEndCallbackFn );
            }
            if( callback && typeof callback === 'function' ) { callback.call(); }
        };
        if( animation ) {
            el.addEventListener( animationstring, onEndCallbackFn );
        } else {
            onEndCallbackFn();
        }
    };

    RevSlider.prototype.gridOptions = function() {
        return {
            isInitLayout: false,
            perRow: this.options.per_row,
            transitionDuration: this.options.transition_duration,
            isResizeBound: this.options.is_resize_bound,
            adjustGutter: true,
            // removeVerticalGutters: false,
            breakpoints: this.options.breakpoints,
            column_spans: this.options.column_spans,
            rows: this.options.rows,
            stacked: this.options.stacked,
            removeVerticalGutters: true,
            masonry: this.options.masonry_layout,
            orderMasonry: false,
            itemBreakpoints: this.options.item_breakpoints,
            imageRatio: this.options.image_ratio
        };
    };

    RevSlider.prototype.createBrandLogo = function(className, square) {
        var char = square ? this.options.brand_logo_secondary.charAt(0) : this.options.brand_logo.charAt(0);

        var brandLogo = document.createElement('div');

        if (char === '<') {
            brandLogo.innerHTML = (square ? this.options.brand_logo_secondary : this.options.brand_logo);
        } else {
            // var brandLogo = document.createElement('img');
            brandLogo.innerHTML = '<img src="'+ (square ? this.options.brand_logo_secondary : this.options.brand_logo) +'"/>';
        }

        revUtils.addClass(brandLogo, className);

        return brandLogo;
    };

    RevSlider.prototype.appendElements = function() {

        if (!this.options.hide_header) {
            if (this.head) {
                revUtils.remove(this.head);
            }
            this.head = document.createElement('div');
            revUtils.addClass(this.head, 'rev-head');
            revUtils.prepend(this.containerElement, this.head);

            this.header = document.createElement('h2');
            this.header.innerHTML = this.options.header;
            revUtils.addClass(this.header, 'rev-header');
            revUtils.append(this.head, this.header);

            if (this.options.brand_logo) {
                var brandLogo = this.createBrandLogo('rev-header-logo');
                brandLogo.style.float = 'left';
                this.head.insertAdjacentElement('afterbegin', brandLogo);
            }
        }

        if (!this.options.hide_footer) {
            if (this.foot) {
                revUtils.remove(this.foot);
            }
            var sponsoredFoot = (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right');
            if (sponsoredFoot) {
                this.foot = document.createElement('div');
                revUtils.addClass(this.foot, 'rev-foot');
                revUtils.append(this.containerElement, this.foot);
            }

            this.sponsored = document.createElement('div');

            revUtils.addClass(this.sponsored, 'rev-sponsored');
            revDisclose.setGrid(this.grid);
            this.sponsored.innerHTML = this.getDisclosure();

            if (this.options.rev_position == 'top_right') {
                revUtils.addClass(this.sponsored, 'top-right');
                revUtils.append(this.head, this.sponsored);
            } else if (sponsoredFoot) {
                revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
                revUtils.append(this.foot, this.sponsored);
            }
        }
    };

    RevSlider.prototype.resize = function() {
        this.grid.layout();

        this.setGridClasses();

        this.resizeImageCheck(this.grid.items);

        this.emitter.emitEvent('resized');
    };

    RevSlider.prototype.resizeImageCheck = function(items) {
        for (var i = 0; i < items.length; i++) {
            var revImage = items[i].element.querySelector('.rev-image');
            if (revImage && (items[i].preloaderHeight > parseInt(revImage.getAttribute('data-img-height')) ||  items[i].preloaderWidth > parseInt(revImage.getAttribute('data-img-width')))) {
                this.setImage(items[i], revImage);
            }
        }
    };

    RevSlider.prototype.setImage = function(item, revImage) {
        if (this.options.mobile_image_optimize && revDetect.mobile()) {
            var roundedPreloaderHeight = Math.round(item.preloaderHeight / this.options.mobile_image_optimize);
            var roundedPreloaderWidth = Math.round(item.preloaderWidth / this.options.mobile_image_optimize);
        } else {
            var roundedPreloaderHeight = Math.round(item.preloaderHeight);
            var roundedPreloaderWidth = Math.round(item.preloaderWidth);
        }
        var image = item.data.image;

        image = image.replace('h=315', 'h=' + roundedPreloaderHeight).replace('w=420', 'w=' + roundedPreloaderWidth) + '&h=' + roundedPreloaderHeight + '&w=' + roundedPreloaderWidth;

        revImage.setAttribute('data-img-height', roundedPreloaderHeight);
        revImage.setAttribute('data-img-width', roundedPreloaderWidth);

        if (!item.data.video_id) {
            revImage.style.backgroundImage = 'url('+ image +')';
            // revImage.innerHTML = '<img src=" ' + image + ' " />';
        } else {
	    var cb = new Date().getTime();
            var site_url = document.location.href;
            var pub_id = this.options.pub_id;
            revImage.innerHTML = '<iframe id="rc_video' + item.data.video_id + '" src="//video.powr.com/video.js.php?if=true&v=' + item.data.video_id + '&uid='+ pub_id +'&t=1&c='+cb+'&su='+ encodeURI(site_url) +'&adt=-1&re=mobile&vp=metadata" style="border: none; width: '+ roundedPreloaderWidth +'px; height: ' + roundedPreloaderHeight + 'px;""></iframe>';
            // revImage.innerHTML = '<iframe id="rc_video' + item.data.video_id + '" src="http://code.revcontent.com/mock/feed4/video' + item.data.video_id + '.iframe.html" style="border: none; width: '+ roundedPreloaderWidth +'px; height: ' + roundedPreloaderHeight + 'px;""></iframe>';
        }
    };

    RevSlider.prototype.isAuthenticated = function(callback) {
        var that = this;
        revApi.request(this.options.host + '/feed.php?provider=facebook_engage&action=connected', function(response) {
            that.authenticated = response.success;
            callback.call(this, that.authenticated);
        }, function() {
            callback.call(this, -1);
        });
    };

    // Don't dupe this svg
    RevSlider.prototype.revAuthButtonIconHtml = function() {
        return '<div class="rev-auth-button-icon">' +
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 155.139 155.139" style="enable-background:new 0 0 155.139 155.139;" xml:space="preserve" class=""><g><g> <path id="f_1_" d="M89.584,155.139V84.378h23.742l3.562-27.585H89.584V39.184   c0-7.984,2.208-13.425,13.67-13.425l14.595-0.006V1.08C115.325,0.752,106.661,0,96.577,0C75.52,0,61.104,12.853,61.104,36.452   v20.341H37.29v27.585h23.814v70.761H89.584z" data-original="#000000" class="active-path" data-old_color="#ffffff" fill="#ffffff"/> </g></g> </svg>' +
        '</div>';
    };

    RevSlider.prototype.createNewCell = function() {
        var that = this;

        var html = '<div class="rev-content-inner">' +
            '<div class="rev-flip">' +

                '<div class="rev-flip-front">' +
                    '<div class="rev-ad">' +
                        '<div class="rev-ad-container">' +
                            '<div class="rev-ad-outer">' +
                                '<a href="" target="_blank">' +
                                    '<div class="rev-ad-inner">' +
                                        '<div class="rev-before-image">' +
                                            '<div class="rev-meta">' +
                                                '<div class="rev-meta-inner">' +
                                                    '<div class="rev-headline-icon-container" style="cursor:pointer"><div class="rev-headline-icon"></div></div>' +
                                                    '<div class="rev-provider-date-container" style="cursor:pointer">' +
                                                        '<div class="rev-provider"></div>' +
                                                        '<div class="rev-date"></div>' +
                                                    '</div>' +

                                                '</div>' +
                                            '</div>' +
                                        '</div>' +

                                        '<div class="rev-image"></div>' +

                                        '<div class="rev-after-image">' +
                                            '<div class="rev-headline-brand">' +
                                                '<div class="rev-headline-brand-inner">' +
                                                    '<div class="rev-headline"></div>' +
                                                    '<div class="rev-description"></div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</a>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="rev-flip-back">' +
                    '<div class="rev-auth-mask"></div>' +
                    '<div class="rev-auth">' +
                        '<a class="rev-auth-close-button">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>' +
                        '</a>' +
                        '<div class="rev-auth-box">' +

                            '<div class="rev-auth-box-inner">' +
                                '<div class="rev-auth-subline">'+ this.getDisclosure() +'</div>' +
                                '<div class="rev-auth-headline">' +
                                    (this.authenticated ? 'Currently logged in!' : '<span class="rev-engage-type-txt">Almost Done! Login to save your reaction</span> <br /> <strong>and</strong> personalize your experience') +
                                '</div>' +
                                '<div class="rev-auth-button">' +
                                    this.revAuthButtonIconHtml() +
                                    '<div class="rev-auth-button-text">' +
                                        (this.authenticated ? 'Log out' : 'Continue with facebook') +
                                    '</div>' +
                                '</div>' +

                                '<div class="rev-auth-buttonline">Once personalized the content recommendations on this page will be based on the pages you\'ve liked and urls you\'ve shared on Facebook</div>' +

                                '<div class="rev-auth-terms">' +
                                    '<span>by signing up you agree to the <a target="_blank" href="//www.engage.im/privacy.html">Terms</a></span>' +
                                    // '<span>|</span>' +
                                    // '<a href="#">Privacy Policy</a>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' + // end back

            '</div>' +

            '<div class="rev-reactions">' +
                '<div class="rev-reaction-bar"></div>' +
            '</div>' +

            '<div class="rev-reactions-total">' +
                '<div class="rev-reactions-total-inner">' +
            '</div>' +

        '</div>';

        var cell = document.createElement('div');
        cell.className = 'rev-content';
        cell.innerHTML = html;

        if (this.options.brand_logo_secondary) {

            var brandLogoSquare = this.createBrandLogo('rev-auth-site-logo', true);

            revUtils.prepend(cell.querySelector('.rev-auth-box'), brandLogoSquare);
        }

        var close = cell.querySelector('.rev-auth-close-button');
        revUtils.addEventListener(close, 'click', function(e) {
            revUtils.removeClass(cell, 'rev-flipped');
        });

        var that = this;
        revUtils.addEventListener(cell.querySelector('.rev-auth-button'), 'click', this.authButtonHandler.bind(this, cell));

        /* secondary auth page, deemed unnecessary for now
        revUtils.addEventListener(cell.querySelector('.rev-auth-button'), 'click', function(e) {
            //revUtils.removeClass(cell, 'rev-flipped');
            //that.updateAuthElements();
        });
        */

        return cell;
    };

    RevSlider.prototype.authButtonHandler = function(cell, e) {
        var that = this;
        if (that.authenticated) {
            var url = that.options.host + "/feed.php?provider=facebook_engage&action=logout&w=" + that.options.widget_id + "&p=" + that.options.pub_id;
        } else {
            var url = that.options.host + "/feed.php?provider=facebook_engage&w=" + that.options.widget_id + "&p=" + that.options.pub_id;
        }

        var popup = window.open(url, 'Login', 'resizable,width=600,height=800');

        var closedCheckInterval = setInterval(function() {
            if (popup.closed) {
                that.isAuthenticated(function(response) {
                    if (response === true) {
                        if (cell) {
                            revUtils.removeClass(cell, 'rev-flipped');
                        }
                        that.updateAuthElements();
                        that.processQueue();

                        /* secondary auth page, deemed unnecessary for now
                        var headline = cell.querySelector('.rev-auth-headline');
                        var button = cell.querySelector('.rev-auth-button');
                        var image = cell.querySelector('.rev-auth-site-logo');
                        var container = cell.querySelector('.rev-auth-box');

                        if (image) {
                            image.innerHTML = "<img src='https://graph.facebook.com/758080600/picture?type=square' />";
                        } else {
                            container.insertAdjacentHTML('afterbegin',"<img src='https://graph.facebook.com/758080600/picture?type=square' />");
                        }

                        button.style.display = "none";
                        headline.innerHTML = "One Last Step, Please enter a password:<br/><input type='text' class='rev-engpass'/><input type='button' value='Sign Up'/>";*/
                        if (!that.personalized) {
                            that.showPersonalizedTransition();
                            that.personalize();
                        }
                    } else {
                        if (!cell) { // logged out from inline auth button
                            that.grid.remove(that.feedAuthButton);
                            if (that.grid.perRow > 1) { // relayout if not single column
                                that.grid.layout();
                            }
                        }
                    }
                    revDisclose.postMessage();
                });
                clearInterval(closedCheckInterval);
            }
        }, 100);
    }

    RevSlider.prototype.getDisclosure = function() {
        return revDisclose.getDisclosure(this.options.disclosure_text, {
            aboutSrc: this.options.disclosure_about_src,
            aboutHeight: this.options.disclosure_about_height,
            interestSrc: this.options.disclosure_interest_src,
            interestHeight: this.options.disclosure_interest_height,
            widget_id: this.options.widget_id,
            pub_id: this.options.pub_id
        });
    };

    RevSlider.prototype.getSerializedQueryParams = function() {
         if (!this.serializedQueryParams) {
            var serialized = revUtils.serialize(this.options.query_params);
            this.serializedQueryParams = serialized ? '&' + serialized : '';
         }
         return this.serializedQueryParams;
    };

    RevSlider.prototype.getIgnoreList = function(data){
        var list = [];
        if(data) {
            for (var i in data) {
                if (data[i].data && data[i].data.doc_id) {
                    list.push(data[i].data.doc_id);
                }
            }
        }
        return list;
    }

    RevSlider.prototype.loadTopicFeed = function(topicId, topicTitle){
        if(this.handlers && this.handlers.loadTopicFeed){
            this.options.topic_title = topicTitle;
            this.handlers.loadTopicFeed(topicId,topicTitle);
        }
    };

    RevSlider.prototype.loadAuthorFeed = function(authorName){
        if(this.handlers && this.handlers.loadAuthorFeed){
            this.handlers.loadAuthorFeed(authorName);
        }
    };

    RevSlider.prototype.generateUrl = function(offset, count, empty, viewed, internal, below_article, fill) {
        var url = (this.options.host ? this.options.host + '/api/v1/' : this.options.url) +
        '?api_key=' + this.options.api_key +
        this.getSerializedQueryParams() +
        '&pub_id=' + this.options.pub_id +
        '&widget_id=' + this.options.widget_id +
        '&domain=' + this.options.domain +
        '&api_source=' + this.options.api_source + (below_article ? 'ba' : '');

        url +=
        '&sponsored_count=' + (internal ? 0 : count) +
        '&internal_count=' + (internal ? count : 0) +
        '&sponsored_offset=' + (internal ? 0 : offset) +
        '&internal_offset=' + (internal ? offset : 0);




        if (internal) {
            url += '&show_comments=1';

            var ignoreList = this.getIgnoreList(this.grid.items);
            url +="&doc_ids="+ignoreList.join(",");
            var topicId = this.options.topic_id;
            if(topicId && topicId>0){
                url +="&topic_id="+topicId;
            }
            var authorName = this.options.author_name;
            if(authorName && authorName.length>0){
                url +="&author_name="+encodeURI(authorName);
            }


        }

        if (this.options.keywords) {
            url += ('&keywords=' + encodeURI(this.options.keywords));
        }

        url += fill ? '&fill=true' : '';

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

    RevSlider.prototype.getData = function() {
        if (this.dataPromise) {
            return this.dataPromise;
        }

        var that = this;

        this.dataPromise = new Promise(function(resolve, reject) {
            that.isAuthenticated(function(response) {
                if (response === true) {
                    that.updateAuthElements();
                }

                that.createCells(that.grid);

                if (that.limit == 0) {
                    that.destroy();
                    reject();
                    return;
                }
                resolve(response)
            })
        }).then(function(authenticated) { // data depending on auth

            var urls = [];

            if (that.internalLimit > 0) {

                var internalURL = that.generateUrl(0, that.internalLimit, false, false, true);
                urls.push({
                    offset: 0,
                    limit: that.internalLimit,
                    url: internalURL,
                    type: 'internal'
                });
            }

            if (that.sponsoredLimit > 0) {
                // don't register multiple widget impressions
                // var fill = urls.length > 0;
                var sponsoredURL = that.generateUrl(0, that.sponsoredLimit, false, false, false);
                urls.push({
                    offset: 0,
                    limit: that.sponsoredLimit,
                    url: sponsoredURL,
                    type: 'sponsored'
                });
            }

            that.promises = [];
            for (var i = 0; i < urls.length; i++) {
                that.promises.push(new Promise(function(resolve, reject) {
                    var url = urls[i];

                    revApi.request(url.url, function(resp) {
                        if (!resp.length) {
                            reject();
                            return;
                        }
                        resolve({
                            type: url.type,
                            data: resp
                        });
                    });
                }));
            }

            return Promise.all(that.promises);
        }).catch(function(e) {
            console.log(e);
        });;

        return this.dataPromise;
    };

    RevSlider.prototype.updateDisplayedItems = function(items, data) {
        // if (!this.data.length) { // if no data remove the container and call it a day
        //     this.destroy();
        //     return;
        // }
        var that = this;
        var itemTypes = {
            sponsored: [],
            internal: [],
            undefined: [] // bootleg moonshine?
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            itemTypes[item.type].push(item);
        }

        this.removeItems = [];

        for (var i = 0; i < data.length; i++) {
            var dataType = data[i].type;
            var dataData = data[i].data;
            for (var j = 0; j < itemTypes[dataType].length; j++) {
                var item = itemTypes[dataType][j];
                var itemData = dataData[j];

                if (!itemData) {
                    this.removeItems.push(item);
                    continue;
                }

                item.viewIndex = j;
                item.data = itemData;

                var anchor = item.element.querySelector('a');
                var url = itemData.url;
                if (itemData.type == 'internal' && this.options.trending_utm) {
                    url += ('&' + this.options.trending_utm);
                }
                anchor.setAttribute('href', url);
                anchor.title = itemData.headline;

                this.setImage(item, item.element.querySelector('.rev-image'));

                var headline = item.element.querySelector('.rev-headline');
                headline.innerHTML = itemData.headline;

                var description = item.element.querySelector('.rev-description');
                if (description) {
                    description.innerHTML = itemData.description ? itemData.description : 'Read More';
                }

                var favicon = item.element.querySelector('.rev-headline-icon');
                if (favicon) {
                    if (item.type == 'internal' && !itemData.author) {
                        revUtils.addClass(item.element, 'rev-no-meta');
                        revUtils.remove(item.element.querySelector('.rev-before-image .rev-meta'));
                    } else {
                        if (itemData.favicon_url) {
                            var imageUrl = this.options.img_host +'/?url=' + itemData.favicon_url.replace('https://', 'http://');
                            // https://stackoverflow.com/a/1203361
                            var imageFormat = itemData.favicon_url.substring(itemData.favicon_url.lastIndexOf('.')+1, itemData.favicon_url.length) || itemData.favicon_url

                            if (imageFormat == 'ico' ) {
                                imageUrl += '&op=noop';
                            } else if (item.type == 'internal') {
                                imageUrl += '&fmt=jpeg';
                            }

                            favicon.innerHTML = '<span class="rev-headline-icon-image" style="background-image:url('+ imageUrl +')' + '"></span>';
                        } else {
                            var iconInitialsWords = itemData.author ? itemData.author.replace(/\(|\)/g, '').split(' ') : itemData.brand.replace(/\(|\)/g, '').split(' ');

                            var initials = '';
                            for (var initialsCount = 0; initialsCount < 2 && iconInitialsWords.length > initialsCount; initialsCount++) {
                                initials += iconInitialsWords[initialsCount].charAt(0).toUpperCase();
                            }

                            if (!this.initialIconColorsCopy || this.initialIconColorsCopy.length == 0) {
                                this.initialIconColorsCopy = this.options.initial_icon_colors.slice(0);
                            }

                            if (this.initialColors && this.initialColors[initials]) {
                                var initialColor = this.initialColors[initials];
                            } else {
                                var initialColor = this.initialIconColorsCopy[Math.floor(Math.random()*this.initialIconColorsCopy.length)];
                                var index = this.initialIconColorsCopy.indexOf(initialColor);
                                if (index > -1) {
                                    this.initialIconColorsCopy.splice(index, 1);
                                }
                                if (!this.initialColors) {
                                    this.initialColors = {};
                                }
                                this.initialColors[initials] = initialColor;
                            }
                            favicon.innerHTML = '<div style="background-color:#'+ initialColor +'" class="rev-author-initials">'+ initials +'</div>';
                        }

                        var date = item.element.querySelector('.rev-date');
                        if (date) {
                            if (item.type == 'sponsored') {
                                var icon = '<span class="rev-sponsored-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg enable-background="new 0 0 128 128" id="Layer_1" version="1.1" viewBox="0 0 128 128" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M72.259,38.978c0.148,0.021,0.797-0.38,1.041-0.506s0.979,0.295,1.208,0.38s1.28-0.13,1.45-0.295   c0.17-0.166,0.192-0.507,0.049-0.759s-0.709-0.947-0.935-0.991c-0.225-0.044-0.969-0.158-1.147-0.159s-0.724,0.1-0.81,0.225   c-0.085,0.125-0.345,0.559-0.386,0.685s-0.3,0.494-0.481,0.538c-0.181,0.043-0.628,0.281-0.588,0.428S72.11,38.957,72.259,38.978z"/><path d="M74.428,41.097c-0.13,0.172-0.572,1.036-0.692,1.535c-0.12,0.499,0.012,2.559,0.237,2.423   c0.226-0.136,0.81-0.779,0.799-1.129c-0.011-0.35,0.102-1.443,0.275-1.66s0.969-1.123,1.098-1.25   c0.128-0.127-0.023-0.232-0.336-0.233C75.497,40.782,74.559,40.925,74.428,41.097z"/><path d="M87.878,4.622c-0.026,0-0.293-0.108-0.849-0.334C79.882,1.528,72.121,0,64,0C28.654,0,0,28.654,0,64   c0,35.347,28.654,64,64,64c35.346,0,64-28.653,64-64C128,37.098,111.393,14.088,87.878,4.622z M83.076,6.278   c0.146,0.16,1.074,0.425,1.412,0.481c0.339,0.057,2.473,0.523,2.654,0.659s0.362,0.448,0.401,0.692   c0.039,0.245-1.719,0.042-2.532-0.18c-0.814-0.222-3.471-1.203-3.654-1.373s0.037-0.725,0.421-0.719   C82.162,5.845,82.929,6.118,83.076,6.278z M77.201,4.695c0.193-0.01,1.237-0.052,1.559-0.055c0.32-0.002,1.179,0.073,1.333,0.073   s1.465,0.086,1.528,0.165c0.064,0.079,0.004,0.163-0.134,0.188s-0.703,0.045-0.88,0.033c-0.178-0.012-0.589-0.131-0.475-0.158   c0.115-0.027,0.259-0.108,0.168-0.122c-0.092-0.014-0.423-0.044-0.537-0.042c-0.114,0.003-0.417,0.065-0.419,0.133   c-0.002,0.067-1.258,0.024-1.524-0.052c-0.268-0.076-1.187-0.138-1.117-0.144C76.771,4.706,77.008,4.705,77.201,4.695z    M72.222,4.825c0.531-0.002,0.991-0.01,1.001-0.011c0.009-0.001,0.562-0.014,0.708-0.018c0.146-0.003,0.542-0.009,0.626-0.008   c0.083,0.001,0.098,0.01,0.033,0.018c-0.065,0.008-1.856,0.101-2.477,0.101S71.69,4.828,72.222,4.825z M65.721,5.043   c0.182-0.004,0.916-0.024,1.232-0.037c0.315-0.012,0.872-0.026,0.973-0.027c0.1-0.001,0.491-0.004,0.748-0.011   c0.171-0.005,0.604-0.02,0.914-0.032c-0.034-0.001-0.078-0.004-0.1-0.004c-0.172-0.006,0.082-0.026,0.209-0.028   c0.127-0.002,0.339,0.007,0.217,0.017c-0.041,0.003-0.169,0.009-0.326,0.016c0.234,0.01,0.706,0.035,0.883,0.04   c0.202,0.004,0.832,0.106,0.916,0.088c0.083-0.019,0.609-0.108,0.801-0.127c0.192-0.02,0.917,0.005,0.974,0.033   c0.057,0.027,0.372,0.137,0.578,0.159s1.114-0.007,1.351-0.031c0.235-0.023,0.599-0.102,0.695-0.083   c0.096,0.02,0.47,0.082,0.617,0.087c0.148,0.005,1.246,0.061,1.562,0.082s0.801,0.099,0.901,0.139   c0.101,0.04-0.015,0.235-0.073,0.294c-0.059,0.059,0.196,0.256,0.492,0.355c0.296,0.099,1.132,0.628,0.947,0.654   s-0.472,0.002-0.639-0.051c-0.167-0.054-0.896-0.332-1.132-0.409c-0.236-0.077-1.123-0.247-1.348-0.294S75.937,5.5,75.658,5.413   c-0.278-0.086-0.992-0.208-1.084-0.204s-0.244,0.053-0.135,0.103c0.108,0.049-0.14,0.166-0.258,0.19   c-0.119,0.024-1.206,0.056-2.27,0.077s-2.958-0.071-3.58-0.165c-0.623-0.093-1.512-0.348-1.658-0.352s-0.625-0.01-0.74-0.013   c-0.086-0.002-0.285-0.003-0.391-0.004c-0.052,0-0.08-0.001-0.067-0.001c0.006,0,0.031,0,0.067,0.001   C65.585,5.045,65.641,5.045,65.721,5.043z M13.156,41.313c-0.009,0.027-0.011,0.054-0.011-0.008c0-0.062,0.018-0.136,0.021-0.102   S13.165,41.286,13.156,41.313z M13.367,40.05c-0.027,0.087-0.07,0.178-0.052,0.007c0.018-0.171,0.109-0.616,0.105-0.456   S13.394,39.963,13.367,40.05z M15.071,36.306c-0.396,0.745-1.131,2.144-1.107,1.946s0.142-0.502,0.17-0.522   c0.029-0.02,0.219-0.389,0.355-0.777c0.136-0.388,0.589-1.23,0.759-1.579s0.484-0.594,0.505-0.533   C15.775,34.901,15.468,35.561,15.071,36.306z M88.323,122.139c-0.253,0.126-1.378,0.228-1.232,0.1s1.444-0.466,1.608-0.49   C88.863,121.723,88.577,122.014,88.323,122.139z M102.949,86.24c-0.022,0.335-0.105,1.195-0.184,1.911   c-0.079,0.717-0.553,4.61-0.81,6.39s-0.806,4.162-0.979,4.402s-0.881,1.237-1.128,1.693c-0.246,0.456-0.88,1.484-1.112,1.806   s-0.81,1.846-0.763,1.884s-0.157,0.857-0.562,1.738c-0.404,0.881-1.234,2.521-1.337,2.609s-0.431,0.475-0.498,0.664   s-0.479,1.25-0.82,1.624s-1.835,1.689-1.853,1.821s-0.202,0.772-0.371,1.136c-0.17,0.364-1.824,1.766-2.025,1.85   c-0.202,0.085-0.812,0.407-0.896,0.533c-0.084,0.125-0.661,0.998-0.914,1.059c-0.254,0.06-0.932,0.444-1.026,0.541   c-0.095,0.098-0.19,0.333-0.001,0.314s0.678,0,0.679,0.08s-0.518,0.426-0.688,0.515s-0.479,0.332-0.552,0.497   c-0.073,0.164-1.095,0.892-1.393,1.082c-0.297,0.19-0.394,0.485-0.234,0.51s0.27,0.323-0.104,0.607   c-0.372,0.285-1.368,0.965-1.366,1.045s0.046,0.312,0.103,0.362c0.058,0.05,0.627,0.623,0.838,0.605   c0.211-0.019,0.812,0.205,0.65,0.243c-0.163,0.038-1.248,0.45-1.665,0.487s-1.485-0.207-1.826-0.203   c-0.341,0.005-1.262-0.788-1.544-0.806c-0.281-0.018-0.203-0.342-0.322-0.345s-0.355-0.081-0.257-0.169s0.286-0.374,0.2-0.396   c-0.085-0.023-0.22-0.17-0.104-0.266c0.117-0.097,0.744-0.45,0.812-0.471s0.325-0.182,0.387-0.268   c0.062-0.086-0.275-0.129-0.427-0.122s-0.555-0.081-0.529-0.175s0.529-0.788,0.659-0.877c0.131-0.09,0.511-0.464,0.553-0.627   c0.043-0.163,0.071-0.695-0.027-0.794c-0.098-0.099,0.07-0.776,0.186-0.975c0.114-0.198,0.799-0.903,0.972-1.151   c0.173-0.247,0.595-1.095,0.558-1.3s-0.104-1.044-0.059-1.382c0.045-0.337,0.499-2.082,0.66-2.649   c0.162-0.567,0.675-2.622,0.731-3.188s-0.284-2.2-0.532-2.598c-0.249-0.398-2.226-1.274-2.798-1.459s-1.465-0.615-1.826-0.84   s-1.503-1.317-1.788-1.703c-0.284-0.387-1.137-2.075-1.619-2.468s-1.257-1.458-1.172-1.761c0.085-0.304,1.138-2.479,1.082-3.051   c-0.055-0.573-0.021-2.418,0.198-2.654s1.855-2.153,2.305-2.761s0.704-2.521,0.525-3.306c-0.179-0.783-1.999-1.797-2.097-1.523   c-0.099,0.273-0.794,0.872-1.324,0.722s-3.383-1.343-3.902-1.531c-0.519-0.188-2.025-2.018-2.433-2.546s-2.306-1.296-3.365-1.577   c-1.061-0.281-5.067-1.191-6.517-1.374c-1.45-0.184-4.75-1.017-5.586-1.34s-3.341-2.303-3.393-3.068   c-0.052-0.766-0.899-2.46-1.449-3.165s-2.869-4.339-3.547-5.377c-0.678-1.038-2.225-2.364-2.193-1.812s1.119,3.063,1.476,3.784   c0.356,0.722,1.039,2.416,1.195,2.757c0.155,0.341,0.517,0.683,0.373,0.784c-0.143,0.103-0.882,0.077-1.324-0.281   c-0.442-0.359-1.663-2.329-1.98-2.875c-0.317-0.546-1.048-1.64-1.001-2.058s0.161-1.05-0.164-1.375   c-0.325-0.325-1.022-2.582-1.155-3.212c-0.132-0.63-0.918-2.466-1.459-2.688s-2.041-1.244-2.163-1.792   c-0.122-0.547-0.302-2.742-0.45-2.902s-0.486-0.71-0.569-0.854c-0.083-0.144-0.237-1.465-0.16-2.765   c0.076-1.3,0.643-4.438,0.906-5.312s1.583-4.077,1.64-4.353s0.119-1.635,0.255-1.778c0.137-0.143,0.304-0.863,0.067-1.285   c-0.237-0.422-2.156-1.414-2.092-1.743c0.064-0.33,0.583-0.983,0.759-1.121c0.176-0.138,0.549-1.063,0.438-1.813   c-0.111-0.75-1.356-2.485-1.485-2.387c-0.129,0.099-0.501,0.689-0.539,1.093c-0.039,0.403-0.241,1.209-0.369,0.872   c-0.128-0.338,0.146-1.549,0.352-1.843s1.268-0.709,1.282-0.854s-0.073-0.582-0.225-0.654c-0.153-0.072-0.561-0.755-0.573-1.362   s-0.446-1.994-0.379-2.36c0.067-0.366,0.112-1.052-0.092-1.341s-0.887-1.22-1.433-1.558c-0.546-0.338-2.719-0.801-2.614-0.996   s0.28-0.709,0.15-0.722c-0.13-0.012-1.204,0.643-2.101,1.48c-0.896,0.837-2.993,1.763-3,1.658c-0.008-0.104-0.177-0.284-0.361-0.17   s-0.746,0.803-0.892,1.026c-0.146,0.223-0.745,1.115-1.119,1.525c-0.373,0.411-2.23,2.098-2.912,2.786   c-0.683,0.688-2.835,3.095-3.395,3.719c-0.56,0.624-1.66,1.518-1.588,1.346c0.071-0.171,0.632-1.056,1.083-1.585   c0.451-0.53,1.494-1.661,1.774-1.965c0.281-0.305,1.589-1.819,1.997-2.296c0.409-0.477,1.446-1.814,1.419-1.936   c-0.026-0.121-0.463-0.27-0.913-0.068c-0.45,0.202-1.037,0.041-0.936-0.234s0.281-1.224,0.144-1.412   c-0.137-0.188-0.397-0.74-0.291-0.827c0.106-0.087,0.437-0.438,0.495-0.588s0.004-0.334-0.034-0.358s0.257-0.649,0.739-1.336   c0.482-0.687,1.936-1.902,2.426-2.113c0.49-0.21,1.743-0.985,2.085-1.323c0.342-0.339,0.295-0.822,0.167-0.828   c-0.128-0.006-0.832,0.244-1.037,0.333c-0.206,0.089-0.63,0.036-0.688-0.233c-0.058-0.27,0.887-1.727,1.285-1.958   s1.47-0.967,1.665-1.006s0.679-0.042,0.634,0.077c-0.045,0.119-0.071,0.491-0.006,0.541c0.065,0.05,0.953-0.467,1.206-0.72   s0.351-0.583,0.281-0.607s-0.192-0.217-0.119-0.377c0.073-0.16,0.538-0.987,0.708-1.211c0.169-0.225,1.021-0.689,1.365-0.828   s2.319-0.88,2.89-1.087s1.666-0.606,1.893-0.655c0.227-0.049,1.383-0.334,2.062-0.529c0.679-0.195,1.864-0.279,2.213-0.251   c0.349,0.029,1.977,0.162,2.521,0.208c0.544,0.046,2.54,0.227,2.843,0.232c0.304,0.005,1.541,0.266,1.876,0.351   c0.336,0.086,1.155,0.105,1.501,0.024c0.346-0.082,2.393-0.632,3-0.762c0.607-0.131,2.021-0.153,2.325-0.208   c0.304-0.055,1.099-0.15,1.096-0.097c-0.003,0.053,0.354,0.276,0.8,0.369c0.446,0.093,3.109,1.056,3.81,1.269   c0.701,0.212,2.485,0.315,2.56,0.275c0.076-0.041-0.012-0.287-0.361-0.459c-0.35-0.172-0.901-0.664-0.848-0.732   c0.054-0.068,0.98-0.295,1.054-0.329c0.073-0.034,0.016-0.246-0.286-0.398c-0.303-0.152-0.681-0.564-1.306-0.661   c-0.625-0.098-2.099,0.045-2.291-0.121c-0.192-0.166,0.327-0.525,0.829-0.729s1.981-0.476,2.033-0.534   c0.052-0.059,0.439-0.142,0.716-0.153s1.482-0.009,2.065,0.027c0.582,0.036,1.65,0.238,1.543,0.363   c-0.107,0.125-0.054,0.326,0.085,0.364s1.124,0.185,1.03,0.229c-0.093,0.044-0.028,0.224,0.357,0.293s1.301-0.023,1.721-0.149   c0.421-0.126,1.692-0.426,1.938-0.438c0.246-0.012,0.924,0.136,1.051,0.198c0.127,0.062-0.125,0.524-0.322,0.882   C72.079,7.562,71.776,8.845,72,9.07c0.225,0.225,0.771,0.86,0.581,0.85s-0.74,0.048-0.794,0.145   c-0.055,0.098-0.593,0.306-1.068,0.239c-0.477-0.067-1.899-0.17-2.091-0.028c-0.191,0.141,0.424,0.67,1.164,0.985   c0.74,0.314,3.101,0.549,3.327,0.431c0.228-0.118,0.559-0.49,0.613-0.59c0.054-0.1,0.571-0.512,1.017-0.735   c0.445-0.224,1.097-0.817,1.058-1.012s-0.494-1.091-0.41-1.149c0.085-0.058,0.174-0.473,0.012-0.797   c-0.162-0.325,0.769-1.04,0.939-1.029s0.703,0.081,0.806,0.128c0.103,0.047,0.481,0.166,0.585,0.192   c0.104,0.026,0.904,0.18,1.623,0.327c0.718,0.147,2.086,0.46,2.01,0.569c-0.075,0.108-0.535,0.292-0.721,0.316   s-1.155,0.041-1.41,0.088c-0.254,0.047-0.376,0.955-0.232,1.364c0.144,0.408,0.279,1.168,0.16,1.234   c-0.118,0.066-0.397,0.339-0.348,0.453s0.858,0.466,1.11,0.557s0.705,0.399,0.82,0.567c0.115,0.168,0.304,1.017,0.528,1.071   c0.224,0.054,0.818-0.31,0.959-0.453c0.142-0.143,0.441-0.51,0.508-0.598c0.065-0.087,0.249-0.309,0.297-0.37   c0.047-0.062-0.132-0.412-0.49-0.611c-0.357-0.2-1.418-0.482-1.451-0.585c-0.034-0.104-0.049-0.392,0.043-0.417   s0.197-0.233,0.035-0.407c-0.161-0.174-0.367-0.467-0.406-0.529c-0.04-0.062,0.039-0.421,0.389-0.618   c0.349-0.196,1.245-0.544,1.648-0.619c0.404-0.075,1.786,0.248,1.819,0.313s0.542,0.286,1.06,0.341s2.197,0.799,2.634,1.128   c0.437,0.33,1.465,1.998,1.733,2.19c0.27,0.192,1.131,0.701,1.14,0.885s0.705,0.779,0.812,0.794   c0.107,0.015,0.597,0.359,0.855,0.729s0.67,1.717,0.582,1.751c-0.087,0.034-0.143,0.399,0.078,0.732   c0.22,0.333,0.849,0.717,0.898,0.964c0.049,0.247,0.802,1.397,0.903,1.443s0.227,0.438,0.056,0.765   c-0.171,0.327-0.579,0.982-0.686,0.964c-0.105-0.018-0.65-0.727-0.804-0.943s-0.487-0.451-0.622-0.474s-0.216,0.38,0.122,0.947   c0.338,0.566,0.828,1.716,0.771,2.068c-0.057,0.353-1.132,0.663-1.18,0.706c-0.048,0.042-0.35,0.004-0.566-0.181   s-1.167-1.278-1.446-1.586s-1.194-1.041-1.584-1.38c-0.39-0.338-1.092-1.025-1.428-0.878s-1.432-0.83-1.46-0.975   c-0.028-0.145,0.013-0.542,0.155-0.567c0.144-0.025,1.095,0.134,1.252,0.277c0.157,0.144,0.682,0.306,0.823,0.035   c0.142-0.271,0.467-0.795,0.637-0.955s0.603-0.794,0.595-1.075c-0.008-0.281-0.928-1.371-1.272-1.69s-1.215-1.172-1.204-1.234   c0.01-0.063-0.12-0.228-0.315-0.23c-0.195-0.003-0.944-0.325-1.024-0.385c-0.081-0.06-0.405-0.256-0.545-0.305   s-0.54-0.035-0.627-0.009c-0.086,0.026-0.086,0.279-0.031,0.463s0.103,0.723-0.014,0.768c-0.115,0.045-0.359,0.587-0.281,1.099   c0.079,0.511-0.583,0.983-1.062,0.902c-0.479-0.081-1.723-0.138-1.789,0.014c-0.065,0.153,0.604,0.859,0.832,1.062   c0.228,0.203,0.829,0.816,1.287,1.113c0.459,0.297,1.041,0.747,0.951,0.816s-0.264,0.309-0.182,0.38   c0.083,0.072,0.087,0.224-0.174,0.179s-1.569-0.605-1.941-0.716c-0.372-0.111-1.118,0.269-1.27,0.25   c-0.152-0.019-0.506-0.417-0.445-0.843s0.833-1.616,0.779-1.703c-0.055-0.088-0.512-0.255-0.896-0.181   c-0.384,0.074-1.882,0.902-2.283,1.154s-1.045,0.653-1.103,0.794c-0.059,0.141-0.754,0.779-1.418,1.098s-2.024,1.606-2.189,2.052   c-0.164,0.446-0.524,1.86-0.419,2.103c0.105,0.243,0.396,1.034,0.41,1.209c0.014,0.174,0.447,0.785,0.931,0.963   c0.482,0.178,2.186,1.227,2.989,1.813c0.804,0.586,2.957,2.396,3.042,2.66c0.086,0.264,0.392,2.4,0.529,2.872   s1.148,0.801,1.338,0.669c0.19-0.133,0.42-1.645,0.438-2.102c0.019-0.456,0.431-1.434,0.95-1.836   c0.519-0.402,1.894-1.798,1.866-2.183c-0.027-0.384-1.216-1.496-1.238-1.667s0.152-0.776,0.435-0.966s0.695-0.985,0.633-1.523   c-0.062-0.538-0.039-2.047,0.094-2.138c0.132-0.09,1.283,0.271,1.668,0.432s1.529,0.859,1.771,1.248s0.796,0.877,0.921,0.877   s0.57,0.133,0.719,0.293c0.147,0.16,0.372,1.087,0.175,1.7c-0.197,0.614,0.662,1.702,1.128,1.805   c0.465,0.103,1.316-1.061,1.336-1.376c0.019-0.316,0.39-0.117,0.567,0.358c0.178,0.475,1,3.531,1.325,4.427   c0.326,0.896,1.644,2.559,1.676,2.933s0.667,2.401,0.758,3.216c0.09,0.815,0.452,2.548,0.602,2.703   c0.149,0.155,0.779,0.823,0.834,1.257s0.071,1.673-0.078,1.781c-0.148,0.107-0.267,0.496-0.296,0.38s-0.213-0.47-0.338-0.527   s-0.636-0.042-0.62-0.146c0.017-0.104-0.056-0.542-0.195-0.745s-0.85-0.535-1.07-0.607s-0.444-0.76-0.12-1.276   c0.324-0.517,1.094-1.956,1.087-2.027c-0.006-0.071-0.051-0.324-0.081-0.403s-0.508-0.125-0.988,0.077   c-0.48,0.201-2.045,0.735-2.247,0.646c-0.202-0.089-1.578-0.767-1.977-0.885s-0.724,0.582-0.498,0.75   c0.227,0.168,0.975,0.63,1.079,0.761c0.104,0.131,0.282,0.554,0.165,0.646c-0.116,0.093-0.287,0.489-0.116,0.669   c0.171,0.179,1.005,0.843,1.274,1.042c0.27,0.199,1.104,1.045,1.188,1.419c0.082,0.374-0.379,0.853-0.783,0.939   c-0.403,0.086-1.746,0.544-2.006,0.793s-0.996,0.052-1.33-0.223c-0.333-0.275-2.114-0.449-2.357-0.253   c-0.244,0.195-0.771,1.308-0.884,1.665s-0.533,1.24-0.801,1.229s-1.279,0.232-1.642,0.561s-1.445,2.167-1.733,2.751   s-0.98,2.459-1.011,2.991c-0.029,0.531-0.853,1.796-1.469,2.215c-0.615,0.418-2.251,1.567-2.669,1.912s-1.59,1.945-1.813,2.402   c-0.225,0.457,0.597,2.588,1.416,4.146c0,0,0,0,0,1.331c0,0.337,0,0.337,0,0.337c-0.068,0.3-0.208,0.617-0.309,0.705   s-0.896-0.224-1.17-0.526c-0.272-0.303-1.186-1.584-1.416-2.171c-0.23-0.586-1.058-2.198-1.314-2.275   c-0.258-0.077-0.98-0.395-1.193-0.522s-1.667-0.516-2.598-0.277c-0.932,0.239-2.504,1.727-3.501,1.646s-3.406,0.107-4.268,0.351   c-0.862,0.243-3.037,3.576-3.735,5.662c0,0-0.346,1.032-0.346,2.229c0,0.509,0,0.509,0,0.509c0,0.566,0.141,1.318,0.312,1.671   s0.705,1.447,0.964,1.723s2.382,0.783,3.081,0.83s2.497-0.503,2.691-0.7c0.194-0.198,0.885-1.546,1.093-1.923   s1.006-0.855,1.235-0.918c0.229-0.062,0.969-0.29,1.211-0.366c0.242-0.075,1.15-0.167,1.173,0.062s-0.413,2.034-0.536,2.531   c-0.124,0.496-1.245,1.94-1.418,2.508c-0.172,0.567,1.618,1.366,2.283,1.309s2.511-0.152,2.649-0.074   c0.139,0.079,0.378,0.947,0.224,1.754c-0.155,0.806-0.174,2.649-0.021,3.103c0.151,0.453,2.018,0.96,2.745,0.699   s2.476-0.356,2.907-0.282c0.432,0.075,1.864-0.559,2.795-1.356c0.932-0.798,2.71-2.553,3.176-2.444   c0.466,0.109,2.832,0.324,2.9,0.481s0.612,0.506,1.057,0.429c0.445-0.077,1.982-0.416,2.482-0.574   c0.501-0.159,1.537-0.552,1.577-0.721c0.04-0.17,0.25-0.542,0.38-0.449c0.13,0.094,0.145,0.81,0.127,1.034   c-0.019,0.225,0.399,1.075,0.81,1.562s1.493,1.227,1.806,1.304c0.312,0.076,1.554-0.01,1.862,0.125s1.281,1.809,1.278,2.123   c-0.004,0.314,0.416,1.177,0.941,1.222c0.526,0.045,1.271,0.421,1.383,0.366c0.111-0.054,0.6-0.566,0.719-0.701   c0.12-0.136,0.366-0.107,0.459-0.035C102.896,84.694,102.973,85.905,102.949,86.24z M93.49,73.909   c-0.011,0.329-0.119,0.448-0.241,0.264s-0.337-0.845-0.201-1.053C93.184,72.913,93.501,73.579,93.49,73.909z M90.076,72.218   c-0.396,0.138-1.197,0.202-0.857-0.162c0.341-0.364,1.287-0.409,1.391-0.295S90.474,72.08,90.076,72.218z M79.55,71.355   c-0.219-0.07-1.31-0.951-1.644-1.22c-0.333-0.269-1.74-0.679-2.52-0.757s-2.627,0.117-2.012-0.345   c0.615-0.463,3.881-0.825,4.42-0.593s2.432,0.997,3.039,1.192s2.167,1.056,2.164,1.234s-0.457,0.368-1.01,0.422   C81.435,71.344,79.769,71.426,79.55,71.355z M80.527,73.434c-0.058,0.163-0.652,0.568-0.842,0.655   c-0.189,0.086-0.571,0.033-0.656-0.138c-0.086-0.171,0.621-0.715,0.971-0.75C80.349,73.166,80.586,73.271,80.527,73.434z    M79.275,63.851c0.482-0.031,0.963-0.062,1.438-0.093C79.919,64.142,79.434,64.174,79.275,63.851z M79.75,66.8   c-0.002,0.408-0.074,0.488-0.161,0.177s-0.244-1.216-0.155-1.312C79.522,65.568,79.752,66.391,79.75,66.8z M81.453,65.728   c0.407,0.265,1.005,1.452,1.045,1.766c0.039,0.312-0.204,0.147-0.541-0.366C81.619,66.613,81.045,65.463,81.453,65.728z    M82.911,72.054c0.352-0.503,4.476-0.939,4.69-0.51c0.215,0.431-0.255,0.893-1.043,1.027c-0.788,0.134-2.051,0.6-2.629,0.62   S82.56,72.558,82.911,72.054z M103.025,83.868c-0.006,0.087-0.034-0.007-0.047-0.07c-0.012-0.062-0.016-0.183-0.009-0.268   s0.052-0.15,0.059-0.09C103.035,83.502,103.03,83.781,103.025,83.868z"/><path d="M77.699,41.569c0.05,0.171,0.26,0.798,0.357,1.013c0.097,0.214,0.488,0.644,0.656,0.473s0.596-0.79,0.587-1.002   c-0.009-0.213,0.301-0.989,0.425-1.071c0.125-0.082,0.084-0.221-0.092-0.309c-0.175-0.088-0.819-0.356-1.039-0.402   c-0.221-0.046-0.871-0.133-0.957-0.092c-0.086,0.042-0.27,0.291-0.217,0.46C77.472,40.809,77.648,41.398,77.699,41.569z"/><path d="M57.341,12.109c-0.083-0.006-0.461-0.144-0.664-0.219c-0.204-0.075-0.8-0.296-0.88-0.333s-0.424-0.086-0.588-0.027   c-0.164,0.058-0.533,0.245-0.454,0.282s0.318,0.246,0.354,0.379c0.036,0.133,0.267,0.481,0.431,0.467   c0.165-0.014,1.251-0.104,1.499-0.123c0.247-0.019,0.483-0.085,0.524-0.146C57.604,12.327,57.423,12.115,57.341,12.109z"/></g></svg></span>';
                            }
                            date.innerHTML = itemData.date ? this.timeAgo(itemData.date) : item.type == 'sponsored' ? 'Sponsored' : '&nbsp;';
                        }
                    }
                }

                var provider = item.element.querySelector('.rev-provider');
                if (provider) {
                    if (item.type == 'sponsored') {
                        provider.innerHTML = itemData.brand ? itemData.brand : this.extractRootDomain(itemData.target_url);
                    } else if (item.type == 'internal' && itemData.author) {
                        provider.innerHTML = itemData.author;
                        var authorElement = item.element.querySelector(".rev-provider-date-container");
                        var authorImage = item.element.querySelector(".rev-headline-icon-container");
                        var handle = (function(a){ return function(e){
                            e.stopPropagation();
                            e.preventDefault();
                            that.loadAuthorFeed(a);
                        }
                        })(itemData.author);
                        revUtils.addEventListener(authorElement, 'click',handle,{passive:false});
                        revUtils.addEventListener(authorImage, 'click',handle,{passive:false});

                    }
                }

                var commentButton = item.element.querySelector('.rev-reaction-comment');

                if (commentButton) {
                    commentButton.setAttribute('href', itemData.target_url + commentButton.getAttribute('href'));
                }

                revUtils.remove(item.element.querySelector('.rev-comments'));
                if (itemData.comments && itemData.comments.length) {

                    var commentsElement = document.createElement('div');
                    revUtils.addClass(commentsElement, 'rev-comments');
                    revUtils.addClass(commentsElement, 'rev-has-comments');

                    var commentHtml = '';

                    var comment = itemData.comments[0];

                    commentHtml += '<div class="rev-comment">' +
                            '<div class="rev-comment-image" style="background-image:url('+ (comment.comment_author_img) +')"></div>' +
                            '<div class="rev-comment-text">' +
                                '<span class="rev-comment-author">' + (comment.comment_author) + '</span>' +
                                ' &middot; ' +
                                '<span class="rev-comment-date">' + this.timeAgo(itemData.comment_time, true) + '</span>  ' + comment.comment +
                            '</div>' +
                        '</div>' +
                        '</div>';

                    commentsElement.innerHTML = commentHtml;

                    item.element.querySelector('.rev-content-inner').appendChild(commentsElement);
                }

                if (item.reactions) {

                    var myReaction = '';

                    var likeReactionElement = item.element.querySelector('.rev-reaction-icon');
                    likeReactionElement.removeAttribute('data-active');

                    var icon = item.element.querySelector('.rev-reaction-like .rev-reaction-icon');
                    revUtils.removeClass(icon, 'rev-reaction-icon-', true);
                    revUtils.addClass(icon, 'rev-reaction-icon-love');
                    revUtils.removeClass(icon, 'rev-reaction-icon-selected');

                    if (itemData.my_reaction) {
                        myReaction = itemData.my_reaction;
                        likeReactionElement.setAttribute('data-active', myReaction);

                        revUtils.addClass(icon, 'rev-reaction-icon-' + myReaction);
                        revUtils.addClass(icon, 'rev-reaction-icon-selected');
                        revUtils.removeClass(item.element, 'rev-menu-active');
                    }

                    var reactionHtml = '';

                    var reactionCountTotal = 0;
                    var reactionCountTotalPos = 0;
                    var reactionCountTotalNeg = 0;
                    var zIndex = 100;

                    var positiveReactions = this.options.reactions.slice(0, 3);
                    var negativeReactions = this.options.reactions.slice(3)

                    for (var reactionCounter = 0; reactionCounter < this.options.reactions.length; reactionCounter++) {
                        var reaction = this.options.reactions[reactionCounter];
                        var reactionCount = 0;
                        if (itemData.hasOwnProperty("reactions")) {
                            reactionCount = itemData.reactions[reaction];
                        }

                        if (reactionCount) {
                            if (reactionCounter < 3) {
                                reactionCountTotalPos += reactionCount;
                            } else {
                                reactionCountTotalNeg += reactionCount;
                            }

                            reactionCountTotal += reactionCount;
                            reactionHtml += '<div style="z-index:'+ zIndex +';" class="rev-reaction rev-reaction-' + reaction + '">' +
                                '<div class="rev-reaction-inner">' +
                                '<div class="rev-reaction-icon rev-reaction-icon-' + reaction + '-full"></div>' +
                                '</div>' +
                                '</div>';
                            zIndex--;
                        }
                    }
                    item.reactionCountTotalPos = reactionCountTotalPos;
                    item.reactionCountTotalNeg = reactionCountTotalNeg;
                    item.reactionCountTotal = reactionCountTotal;

                    item.element.querySelector('.rev-reaction-menu-item-count-pos .rev-reaction-menu-item-count-inner').innerText = this.milliFormatter(reactionCountTotalPos);
                    item.element.querySelector('.rev-reaction-menu-item-count-neg .rev-reaction-menu-item-count-inner').innerText = this.milliFormatter(reactionCountTotalNeg);

                    if (myReaction) {
                        var reactionTotal = Math.max(1, (reactionCountTotal - 1));
                        reactionHtml += '<div class="rev-reaction-count">'+ ((reactionCountTotal == 1) ? 'You reacted' : 'You and ' + reactionTotal + ' other' + (reactionTotal > 1 ? 's' : '') ) + '</div>';
                    } else {
                        reactionHtml += '<div ' + (!reactionCountTotal ? 'style="margin-left: 0;"' : '') + ' class="rev-reaction-count">'+ (reactionCountTotal ? reactionCountTotal : 'Be the first to react') +'</div>';
                    }

                    item.element.querySelector('.rev-reactions-total-inner').innerHTML = reactionHtml;
                }

                if (item.type == 'internal') {
                    var save = item.element.querySelector('.rev-save')
                    revUtils.removeClass(save, 'rev-save-active');
                    if (itemData.bookmarked) {
                        revUtils.addClass(save, 'rev-save-active');
                    }
                }

                revUtils.remove(item.element.querySelector('.rev-reason'));
                if (itemData.reason) {
                    var reason = document.createElement('div');
                    reason.className = 'rev-reason';
                    reason.innerHTML = itemData.reason;
                    reason.title = itemData.reason;
                    revUtils.prepend(item.element.querySelector('.rev-ad-outer'), reason);
                }
            }
        }

        if (this.grid.perRow > 1) { // relayout if not single column
            this.grid.layout();
        }

        if (this.removeItems.length) {
            this.emitter.emitEvent('removedItems', [this.removeItems]);
        }
    };

    RevSlider.prototype.updateAuthElements = function() {
        var authBoxes = document.querySelectorAll('.rev-auth-box');
        if (this.authenticated) {
            for (var i = 0; i < authBoxes.length; i++) {
                authBoxes[i].querySelector('.rev-auth-headline').innerText = 'Currently logged in!';
                authBoxes[i].querySelector('.rev-auth-button-text').innerText = 'Log out';
            }
        } else {
            for (var i = 0; i < authBoxes.length; i++) {
                authBoxes[i].querySelector('.rev-auth-headline').innerHTML = 'Almost Done! Login to save your reaction <br /> <strong>and</strong> personalize your experience';
                authBoxes[i].querySelector('.rev-auth-button-text').innerText = 'Continue with facebook';
            }
        }
    };

    RevSlider.prototype.closePersonalizedTransition = function(ev) {
        document.body.style.overflow = this.bodyOverflow;
        revUtils.removeClass(document.body, 'rev-blur');
        revUtils.remove(this.personalizedMask);
        revUtils.remove(this.personalizedContent);
        this.grid.bindResize();
        revUtils.removeEventListener(this.personalizedContent, revDetect.mobile() ? 'touchstart' : 'click', this.closePersonalizedTransitionCb);
        if (ev) {
            ev.stopPropagation();
            ev.preventDefault();
        }
    };

    RevSlider.prototype.showPersonalizedTransition = function() {

        var that = this;
        var show = function() {
            revUtils.addClass(document.body, 'rev-blur');
            that.grid.unbindResize();
            document.body.style.overflow = 'hidden';
            revUtils.addClass(document.body, 'rev-blur');
            document.body.appendChild(that.personalizedMask);
            document.body.appendChild(that.personalizedContent);

            that.closePersonalizedTransitionCb = function(ev) {
                that.closePersonalizedTransition(ev);
            }
            revUtils.addEventListener(that.personalizedContent, revDetect.mobile() ? 'touchstart' : 'click', that.closePersonalizedTransitionCb, {passive: false});
        }

        if (this.personalizedMask) {
            show();
            return;
        }

        this.bodyOverflow = revUtils.getComputedStyle(document.body, 'overflow');

        this.personalizedMask = document.createElement('div');
        this.personalizedMask.id = 'personalized-transition-mask';

        this.personalizedContent = document.createElement('div');
        this.personalizedContent.id = 'personalized-transition-wrapper';

        var ucDomain = this.options.domain.charAt(0).toUpperCase() + this.options.domain.slice(1);

        this.personalizedContent.innerHTML = '<div id="personalized-transition-animation"><div></div></div><div id="personalized-transition-text"><div>Analyzing ' + ucDomain + ' Articles</div></div>';

        show();

        setTimeout(function() {
            var personalizedTransitionText = that.personalizedContent.querySelector('#personalized-transition-text div');

            var remove = function() {
                that.onEndAnimation(personalizedTransitionText, function() {
                    revUtils.removeClass(personalizedTransitionText, 'personalized-transition-text-animated');
                });
            };

            revUtils.addClass(personalizedTransitionText, 'personalized-transition-text-animated');
            personalizedTransitionText.innerHTML = 'Matching your interests to ' + ucDomain + ' content';
            remove();

            setTimeout(function() {
                revUtils.addClass(personalizedTransitionText, 'personalized-transition-text-animated');
                personalizedTransitionText.innerHTML = 'Preparing a personalized ' + ucDomain + ' experience for you';
                remove();
            }, 2500);
        }, 2500);
    };

    RevSlider.prototype.subscribeToInterest = function(interestId){
        var that = this;
        if(isNaN(interestId)){
            that.notify('Invalid Category, please try again.', {label: 'continue', link: '#'});
            return;
        }
        if(that.interests && that.interests.subscribed_ids.indexOf(interestId) == -1) {
            revApi.request(that.options.host + '/api/v1/engage/addinterest.php?id=' + interestId, function(subscribeResponse) {
                if(!subscribeResponse.success || typeof subscribeResponse !== "object") {
                    that.notify('Preference not saved, try again.', {label: 'continue', link: '#'});
                    return false;
                }
                that.interests.subscribed.push(that.interests.list[interestId]);
                that.interests.subscribed_ids.push(interestId);
                that.interests.count = that.interests.subscribed_ids.length;
                that.notify('Topic added, new content available.', {label: 'continue', link: '#'});
                return interestId;
            });

        } else {
            that.notify('API busy, please try again.', {label: 'continue', link: '#'});
            return false;
        }
    };

    RevSlider.prototype.unsubscribeFromInterest = function(interestId){
        var that = this;
        if(isNaN(interestId)){
            that.notify('Invalid Category, please try again.', {label: 'continue', link: '#'});
            return;
        }
        if(that.interests && that.interests.subscribed_ids.indexOf(interestId) !== -1) {
            revApi.request(that.options.host + '/api/v1/engage/removeinterest.php?id=' + interestId, function(unsubscribeResponse) {
                if(!unsubscribeResponse.success || typeof unsubscribeResponse !== "object") {
                    that.notify('Operation cancelled, please try again.', {label: 'continue', link: '#'});
                    return false;
                }
                var revised_interests = [];
                var revised_ids = [];
                for(var i=0;i<that.interests.count;i++){
                    if(that.interests.subscribed_ids[i] !== interestId){
                        revised_interests.push(that.interests.subscribed[i]);
                        revised_ids.push(that.interests.subscribed_ids[i]);
                    }
                }

                that.interests.subscribed = revised_interests;
                that.interests.subscribed_ids = revised_ids;
                that.interests.count = revised_ids.length;
                that.notify('Topic removed from your feed.', {label: 'continue', link: '#'});
                return interestId;

            });
        } else {
            that.notify('API busy, please try again.', {label: 'continue', link: '#'});
            return false;
        }
    };

    RevSlider.prototype.capitalize = function (str) {

        return str.charAt(0).toUpperCase() + str.slice(1);

    };

    RevSlider.prototype.appendInterestsCarousel = function (grid,isLoggedin) {
        var that = this;
        var interest_cells = '';

        var interestsCarousel = document.createElement('div');
        interestsCarousel.className = 'rev-content';
        grid.element.appendChild(interestsCarousel);

        revApi.request( that.options.host + '/api/v1/engage/getinterests.php?auth='+isLoggedin+"&d="+that.options.domain, function (data) {

            if(typeof data !== "object" || (typeof data == "object" && data.subscribed.length == 0)) {
                interestsCarousel.setAttribute('style','margin:0!important;padding:0!important;height:0;border:0');
                interestsCarousel.classList.add('revcontent-carousel-is-empty');
                interestsCarousel.classList.add('revcontent-remove-element');
                return;
            }

            var interests_data = data.subscribed;
            that.interests = {
                list: data.subscribed,
                subscribed: data.subscribed, //data.subscribed
                subscribed_ids: data.subscribed_ids, //data.subscribed_ids
                available: data.subscribed,
                //recomended: data.recommended,
                count: data.subscribed.length // data.count
            };
            var interests_count = 0;
            var initialIndex = 3;
            var topicFeed = that.options.topic_id>0;
            if (typeof interests_data !== 'undefined') {
                if(topicFeed) {
                    interests_data = interests_data.filter(function (t) {
                        return t.id != that.options.topic_id;
                    });
                }
                interests_count = interests_data.length;
                if(topicFeed && interests_count>=6){
                    initialIndex = 6;
                }
            }

            for(var i=0;i<interests_count;i++){
                var interest = interests_data[i];

                var the_cell = '' +
                // Interest Image should be stored as CSS by slug/name ID interest-' + interest.slug.toLowerCase() + '
                // $image property in interest object could be used as override if non-empty.
                '<div style="' + (interest.image != '' ? 'background:transparent url(' + interest.image + ') top left no-repeat;background-size:cover;' : '') + '" class="carousel-cell interest-cell interest-' + interest.title.toLowerCase() + ' selected-interest"  data-id="' + interest.id + '" data-title="' + interest.title + '" data-interest="' + interest.title.toLowerCase() + '">' +
                    '<div class="cell-wrapper">' +
                    (that.authenticated?'<span class="selector subscribed"></span>':'') +
                        '<div class="interest-title ' + (interest.lightMode ? ' light-mode' : '') + '">' + interest.title + '</div>' +
                    '</div>' +
                '</div>';
                interest_cells += the_cell;
            }

            var cTitle = "Trending topics on "+that.capitalize(that.extractRootDomain(window.location.href));;
            var cSubtitle = "";
            if(isLoggedin){
                cTitle = "Content You Love";
                cSubtitle = "SIMILAR TOPICS";
            }
            interestsCarousel.innerHTML = '<div><h1 style="font-size:17px;">' + cTitle +
                '<small style="font-size:12px;font-weight:normal;padding-left:15px;color:#777777"><sup>'+cSubtitle+'</sup></small>' +
                '</h1>' +
                '<div id="rev-feed-interests" class="feed-interests-carousel">' +

                    interest_cells +

                '</div>' +
                '</div>';

            var carousel = interestsCarousel.querySelector('.feed-interests-carousel');

            var interests_flick = new Flickity( carousel, {
                wrapAround: false,
                prevNextButtons: false,
                pageDots: false,
                adaptiveHeight: true,
                freeScroll: true,
                selectedAttraction: 0.15,
                freeScrollFriction: 0.03,
                initialIndex: initialIndex
            });

            interests_flick.on( 'staticClick', function( event, pointer, cellElement, cellIndex ) {
                var target = event.target || event.srcElement;
                if ( !cellElement ) {
                    return;
                }
                if(target.classList.contains('selector')) {
                    if (cellElement.classList.contains('selected-interest')) {
                        cellElement.classList.remove('selected-interest');
                        cellElement.querySelectorAll('span.selector')[0].classList.remove('subscribed');
                        that.unsubscribeFromInterest(parseInt(cellElement.getAttribute('data-id'), 10));
                        //that.notify('Topic removed from your feed.', {label: 'continue', link: '#'});
                    } else {
                        cellElement.classList.add('selected-interest');
                        cellElement.querySelectorAll('span.selector')[0].classList.add('subscribed');
                        that.subscribeToInterest(parseInt(cellElement.getAttribute('data-id'), 10));
                        //that.notify('Topic added, new content available.', {label: 'continue', link: '#'});
                    }
                }



                if(target.classList.contains('cell-wrapper') || target.classList.contains('interest-title')){

                    that.loadTopicFeed(parseInt(cellElement.getAttribute('data-id'), 10),
                        cellElement.getAttribute('data-title'));
                    // Load an Explore Panel in "TOPIC" mode to show articles in that interest category...
                    // this.swipeToPanel('trending', target.getAttribute('data-slug'));
                    // -- DISABLE TOPIC "DIVE-IN" PANEL UNTIL OTHER FEATURES ARE COMPLETED
                    //that.appendSliderPanel(cellElement.getAttribute('data-title'), '<div style="padding:18px"><p><strong>Loading Topics...</strong><br />fetching your personalized content.</p></div>', 1);
                }

            });

            interests_flick.on( 'dragStart', function( event, pointer ) {
                carousel.classList.add('is-dragging');
            });

            interests_flick.on( 'dragEnd', function( event, pointer ) {
                carousel.classList.remove('is-dragging');
            });

            if (grid.perRow > 1) { // relayout if not single column
                grid.layout();
            }
        });

        return grid.addItems([interestsCarousel]);
    };

    RevSlider.prototype.appendExplorePanel = function(grid){
        var explorePanel = document.createElement('div');
        explorePanel.id = 'revfeed-explore';
        explorePanel.classList.add('revfeed-explore');
        explorePanel.classList.add('revfeed-explore-panel');
        explorePanel.classList.add('revfeed-explore-panel--docked');
        explorePanel.innerHTML = '<div id="revfeed-explore-wrapper" class="revfeed-explore-wrapper">' +
            '<div><div style="line-height:32px;height:32px;border-bottom:1.0px solid #dddddd;padding:0 12px">' +
            '<strong style="font-family:Montserrat;letter-spacing:1px;color:#222222">EXPLORE &nbsp;<small style="color:#00a8ff">FEED</small></strong>' +
            '</div></div>' +
            '<div style="display:block;height:50vw;overflow:hidden;margin-bottom:2px">' +
            '<div style="display:block;float:left;width:33vw;height:100%;"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=1) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:34vw;height:100%"><div style="display:block;width:100%;height:100%;border-left:2px solid #ffffff;border-right:2px solid #ffffff;background:transparent url(http://placehold.it/106x200?text=2) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:33vw;height:100%"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=3) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="clear:both"></div>' +
            '</div>' +
            '<div style="display:block;height:50vw;overflow:hidden;margin-bottom:2px">' +
            '<div style="display:block;float:left;width:34vw;height:100%"><div style="display:block;width:100%;height:100%;border-right:2px solid #ffffff;background:transparent url(http://placehold.it/106x200?text=4) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:66vw;height:100%"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=5) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="clear:both"></div>' +
            '</div>' +
            '<div style="display:block;height:50vw;overflow:hidden;margin-bottom:2px">' +
            '<div style="display:block;float:left;width:50vw;height:100%"><div style="display:block;width:100%;height:100%;border-right:2px solid #ffffff;background:transparent url(http://placehold.it/106x200?text=6) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:50vw;height:100%"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/212x200?text=7) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="clear:both"></div>' +
            '</div>' +
            '<div style="display:block;height:50vw;overflow:hidden;margin-bottom:2px">' +
            '<div style="display:block;float:left;width:33vw;height:100%;"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=1) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:34vw;height:100%"><div style="display:block;width:100%;height:100%;border-left:2px solid #ffffff;border-right:2px solid #ffffff;background:transparent url(http://placehold.it/106x200?text=2) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:33vw;height:100%"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=3) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="clear:both"></div>' +
            '</div>' +

            '</div>';

        if (this.options.brand_logo) {
            var brandLogo = this.createBrandLogo('rev-header-logo');
            brandLogo.style.textAlign = 'center';
            brandLogo.style.display = 'block';
            brandLogo.style.height = '48px';
            brandLogo.style.lineHeight = '48px';
            brandLogo.style.paddingTop = '9px';
            explorePanel.insertAdjacentElement('afterbegin', brandLogo);
        }
        grid.element.prepend(explorePanel);
        var SwipeFeed = new Hammer.Manager(document.getElementById('grid'), {

        });
        var is_scrolling;
        SwipeFeed.add( new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 50 }) );
        window.addEventListener('scroll', function() {
            is_scrolling = true;
        }, { passive: true });
        window.addEventListener('touchend', function() {
            is_scrolling = false;
        });
        SwipeFeed.on("panleft", function(ev) {
            if (is_scrolling) {
                return;
            }
            top.location.href = '#revfeed-explore';
            explorePanel.classList.remove('revfeed-explore-panel--docked');
            explorePanel.classList.add('revfeed-explore-panel--visible');
            document.body.classList.add('revfeed-is-exploring');

        });
        SwipeFeed.on("panright", function(ev) {
            if (is_scrolling) {
                return;
            }
            explorePanel.classList.remove('revfeed-explore-panel--visible');
            explorePanel.classList.add('revfeed-explore-panel--docked');
            document.body.classList.remove('revfeed-is-exploring');
        });

        revUtils.addEventListener(grid.element, 'touchstart', function(e){
            if(document.body.classList.contains('revfeed-is-exploring')){
                //e.preventDefault();
                //e.stopPropagation();
            }
        }, {passive: false});
    };

    RevSlider.prototype.appendSliderPanel = function(title, content, panelId) {
        var sliderPanel = document.createElement('div');
        if(document.getElementById('revfeed-panel') !== null) {
            return;
        }
        sliderPanel.id = 'revfeed-panel';
        sliderPanel.classList.add('revfeed-panel');
        sliderPanel.classList.add('revfeed-panel--docked');
        sliderPanel.innerHTML = '<div class="revfeed-slider-panel" data-panel="' + panelId +'"><div class="revfeed-panel-wrapper">' +
            '<div class="revfeed-panel-title"><div id="revfeed-nav-back" class="revfeed-nav-back"><a id="revfeed-nav-back-link">&lt;</a></div>' + title + '</div>' +
            '<div class="revfeed-panel-navigation">' +
            '<ul>' +
            '<li><a href="#" data-panel="1">Panel 01</a></li>' +
            '<li><a href="#" data-panel="2">Panel 02</a></li>' +
            '<li><a href="#" data-panel="3">Panel 03</a></li>' +
            '</ul>' +
            '<div style="clear:both"></div>' +
            '</div>' +
            '<div class="revfeed-panel-content">' + content + '</div>' +
            '</div></div>';

        document.body.prepend(sliderPanel);
        var the_panel = document.getElementById('revfeed-panel');
        var go_back = the_panel.querySelector('a#revfeed-nav-back-link');
        if(go_back !== null && typeof go_back == "object") {
            revUtils.addEventListener(go_back, 'click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                the_panel.classList.remove('revfeed-panel--activated');
                the_panel.classList.add('revfeed-panel--docked');
                setTimeout(function(){
                    the_panel.remove();
                }, 750);
            }, {passive: false});
        }

        setTimeout(function(){
            var the_panel = document.getElementById('revfeed-panel');
            the_panel.classList.remove('revfeed-panel--docked');
            the_panel.classList.add('revfeed-panel--activated');

        }, 150);


        return sliderPanel;

    };

    RevSlider.prototype.extractRootDomain = function(url) {
        if (!url) {
            return '';
        }
        var domain;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        }
        else {
            domain = url.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];
        //find & remove "?"
        domain = domain.split('?')[0];

        var splitArr = domain.split('.'),
            arrLen = splitArr.length;

        //extracting the root domain here
        if (arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        }
        return domain;
    };

    RevSlider.prototype.timeAgo = function(time, output) {
        var templates = {
            prefix: "",
            suffix: "",
            seconds: "less than a minute",
            minute: "about a minute",
            minutes: "%d minutes",
            hour: "1 hr",
            hours: "%d hrs",
            day: "yesterday",
            days: "%d days",
            month: "1 month",
            months: "%d months",
            year: "1 year",
            years: "%d years"
        };
        var template = function(t, n) {
            return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
        };

        // random hrs
        if (!time)
            return '';
        if (typeof time === 'string') {
            time = time.replace(/\.\d+/, ""); // remove milliseconds
            time = time.replace(/-/, "/").replace(/-/, "/");
            time = time.replace(/T/, " ").replace(/Z/, " UTC");
            time = time.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
        }

        time = new Date(time * 1000 || time);

        var now = new Date();
        var seconds = ((now.getTime() - time) * .001) >> 0;
        var minutes = seconds / 60;
        var hours = minutes / 60;
        var days = hours / 24;
        var years = days / 365;

        return templates.prefix + (
                seconds < 45 && template('seconds', seconds) ||
                seconds < 90 && template('minute', 1) ||
                minutes < 45 && template('minutes', minutes) ||
                minutes < 90 && template('hour', 1) ||
                hours < 24 && template('hours', hours) ||
                hours < 42 && template('day', 1) ||
                days < 30 && template('days', days) ||
                days < 45 && template('month', 1) ||
                days < 365 && template('months', days / 30) ||
                years < 1.5 && template('year', 1) ||
                template('years', years)
                ) + templates.suffix;
    };

    RevSlider.prototype.notify = function(message, action, type){
        if(!message){
            return;
        }
        if(!type){ type = 'info' };
        var notice_panel = document.getElementById('rev-notify-panel');
        if(typeof notice_panel == 'object' && notice_panel != null){
            notice_panel.remove();
        }
        var notice = document.createElement('div');
        var notice_timeout = 0;
        notice.id = 'rev-notify-panel';
        notice.classList.add('rev-notify');
        notice.classList.add('rev-notify-alert');
        notice.classList.add('rev-notify-alert--default');
        notice.innerHTML = '<p style="margin:0;padding:0"><a class="notice-action" href="' + (action.link !== undefined ? action.link : '#') + '" style="text-transform:uppercase;float:right;font-weight:bold;padding-left:8px;" onclick="javascript:return false;">' + action.label + '</a> ' + message + '</p>';
        notice.setAttribute('style','display:block;transition: all 0.5s ease-out;position:fixed;top:-48px;left:0;z-index:15000;width:100%;height:32px;line-height:32px;font-size:10px;font-family:"Montserrat";padding:0 9px;background-color:rgba(0,0,0,0.7);color:#ffffff;');

        document.body.appendChild(notice);
        setTimeout(function(){
            notice.style.top = 0;
        }, 504);
        clearTimeout(notice_timeout);
        notice_timeout = setTimeout(function() {
            var notice_panel = document.getElementById('rev-notify-panel');
            if(typeof notice_panel == 'object' && notice_panel != null){
                notice_panel.style.top = '-48px';
                setTimeout(function(){
                    notice_panel.remove();
                }, 550);
            }
        }, 2000);
    };

    RevSlider.prototype.destroy = function() {
        this.grid.remove();
        this.grid.destroy();
        revUtils.remove(this.containerElement);
        if (this.mc) {
            this.mc.set({enable: false});
            this.mc.destroy();
        }

        if (typeof this.options.destroy === 'function') {
            this.options.destroy();
        }
    };

    return RevSlider;
}));
