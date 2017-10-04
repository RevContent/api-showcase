/*
Project: RevFeed
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevFeed = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevFeed = function(opts) {

        var below_article = (typeof opts.below_article !== 'undefined') ? opts.below_article : false;

        var defaults = {
            api_source: 'rcfeed',
            url: 'https://trends.revcontent.com/api/v1/',
            host: 'https://trends.revcontent.com',
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
            buttons: {
                forward: false,
                back: false
            },
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
            per_row: 6,
            rows: below_article ? 5 : 4,
            infinite: true,
            column_spans: below_article ? [
                {
                    selector: '.rev-content-header, .rev-content',
                    spans: 6
                },
                {
                    selector: '.rev-slider-breakpoint-gt-xs .rev-content:nth-child(-n+9)',
                    spans: 2
                },
            ] : [
                {
                    selector: '.rev-content',
                    spans: 6
                },
            ],
            image_ratio: below_article ? [
                {
                    selector: '.rev-slider-breakpoint-lt-sm .rev-content, .rev-content:nth-child(n+10)',
                    ratio: '6:3'
                }
            ] : [
                {
                    selector: '.rev-content',
                    ratio: '6:3'
                }
            ],
            internal_selector: below_article ? '.rev-slider-breakpoint-lt-sm .rev-content:nth-child(3n + 4), .rev-slider-breakpoint-lt-sm .rev-content:nth-child(3n + 5), .rev-slider-breakpoint-gt-xs .rev-content:nth-child(3n+10), .rev-slider-breakpoint-gt-xs .rev-content:nth-child(3n+11)' :
                '.rev-content:nth-child(3n+1), .rev-content:nth-child(3n+2)',
            meta_selector: below_article ? '.rev-slider-breakpoint-lt-sm .rev-content, .rev-slider-breakpoint-gt-xs .rev-content:nth-child(n+10)' : '.rev-content',
            reactions_selector: below_article ? '.rev-slider-breakpoint-lt-sm .rev-content, .rev-slider-breakpoint-gt-xs .rev-content:nth-child(n+10)' : '.rev-content',
            headline_top_selector: false,
            // headline_icon_selector: '.rev-content:nth-child(4n+10), .rev-content:nth-child(4n+11)',
            // headline_icon_selector: '.rev-content',
            viewable_percentage: 50,
            buffer: 500,
            brand_logo: false,
            window_width_devices: [
                'phone'
            ],
            mock: false,
            comment_div: false,
            reaction_id: 299,
            mobile_image_optimize: false,
            trending_utm: false
        };

        // merge options
        this.options = revUtils.extend(defaults, opts);

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

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-feed');

        this.init();
    };

    RevFeed.prototype.init = function() {
        this.emitter = new EventEmitter();

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-feed';

        revUtils.append(this.element, this.containerElement);

        this.windowWidth();

        this.createInnerWidget();

        var self = this;

        if (!this.innerWidget.dataPromise) {
            return;
        }

        this.innerWidget.dataPromise.then(function() {
            self.viewability().then(function() {

                if (self.options.infinite) {
                    self.infinite();
                }

                if (self.viewed.length) {
                    self.registerView(self.viewed);
                }
                self.visibleListener = self.checkVisible.bind(self);
                revUtils.addEventListener(window, 'scroll', self.visibleListener);
            }, function() {
                console.log('someething went wrong');
            });
        }, function() {
        }).catch(function(e) {
            console.log(e);
        });
    };

    RevFeed.prototype.windowWidth = function() {

        if (this.options.window_width_devices && revDetect.show(this.options.window_width_devices)) {
            this.windowWidthEnabled = true;

            var that = this;

            revUtils.addEventListener(window, 'resize', function() {
                setElementWindowWidth();
            });

            var setElementWindowWidth = function() {
                revUtils.transformCss(that.element, 'none');
                that.element.style.width = document.body.offsetWidth + 'px';
                that.element.style.overflow = 'hidden';
                revUtils.transformCss(that.element, 'translateX(-' + that.element.getBoundingClientRect().left + 'px)');
            };

            setElementWindowWidth();
        }
    };

    RevFeed.prototype.createInnerWidget = function() {
        this.innerWidget = new RevSlider({
            mock: this.options.mock,
            api_source:   this.options.api_source,
            element:      [this.containerElement],
            url:          this.options.url,
            host:          this.options.host,
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
            buttons:      this.options.buttons,
            multipliers:  this.options.multipliers,
            css:          this.options.css,
            column_spans: this.options.column_spans,
            image_ratio:  this.options.image_ratio,
            headline_icon_selector:  this.options.headline_icon_selector,
            headline_size: this.options.headline_size,
            max_headline: this.options.max_headline,
            disclosure_text: this.options.disclosure_text,
            query_params: this.options.query_params,
            user_ip:      this.options.user_ip,
            user_agent:   this.options.user_agent,
            disable_pagination: true,
            // pagination_dots: true,
            // pagination_dots_vertical: true,
            register_impressions: false,
            register_views: false,
            row_pages: true,
            visible_rows: 1,
            brand_logo: this.options.brand_logo,
            comment_div: this.options.comment_div,
            reaction_id: this.options.reaction_id,
            mobile_image_optimize: this.options.mobile_image_optimize,
            trending_utm: this.options.trending_utm,
            developer: this.options.developer,
            internal_selector: this.options.internal_selector,
            header_selector: this.options.header_selector,
            reactions_selector: this.options.reactions_selector,
            meta_selector: this.options.meta_selector,
            headline_top_selector: this.options.headline_top_selector,
            window_width_enabled: this.windowWidthEnabled
        });
    };

    RevFeed.prototype.viewability = function() {
        this.viewed = [];

        var self = this;

        return new Promise(function(resolve, reject) {
            var total = self.innerWidget.viewableItems.length;
            var count = 0;
            for (var i = 0; i < self.innerWidget.viewableItems.length; i++) {
                revUtils.checkVisibleItem(self.innerWidget.viewableItems[i], function(viewed, item) {
                    count++;
                    if (count == total) {
                        resolve();
                    }
                    if (viewed) {
                        var index = self.innerWidget.viewableItems.indexOf(item);
                        if(index != -1) {
                            self.innerWidget.viewableItems.splice(index, 1);
                        }
                        self.viewed.push(item);
                    }
                }, self.options.viewable_percentage);
            }
        });
    };

    RevFeed.prototype.infinite = function() {
        var self = this;

        this.scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

        this.scrollListener = function() {
            if (self.doing) {
                return;
            }

            var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var height = self.innerWidget.grid.maxHeight
            var top = self.innerWidget.grid.element.getBoundingClientRect().top;
            var bottom = self.innerWidget.grid.element.getBoundingClientRect().bottom;

            if (scrollTop >= self.scrollTop && bottom > 0 && (scrollTop + windowHeight) >= (top + scrollTop + height - self.options.buffer)) {
                self.doing = true;

                var moreRowCount = self.innerWidget.grid.nextRow + self.options.rows;

                // var offset = self.innerWidget.limit;

                // var count = 0;

                // self.internalLimit = 0;
                // self.sponsoredLimit = 0;

                self.internalOffset = self.internalOffset ? self.internalOffset : self.innerWidget.internalLimit;
                self.sponsoredOffset = self.sponsoredOffset ? self.sponsoredOffset : self.innerWidget.sponsoredLimit;

                var rowData = self.innerWidget.createRows(self.innerWidget.grid, moreRowCount);

                self.innerWidget.setUp(rowData.items);

                self.innerWidget.getPadding(rowData.items, true);

                self.innerWidget.setContentPadding(rowData.items);

                self.innerWidget.setSize(rowData.items);

                self.innerWidget.setUp(rowData.items);

                self.innerWidget.grid.layout();

                var urls = [];

                if (rowData.internalLimit > 0) {
                    var internalURL = self.innerWidget.generateUrl(self.internalOffset, rowData.internalLimit, false, false, true);
                    urls.push({
                        offset: self.internalOffset,
                        limit: rowData.internalLimit,
                        url: internalURL,
                        type: 'internal'
                    });
                    self.internalOffset += rowData.internalLimit;
                }

                if (rowData.sponsoredLimit > 0) {
                    var sponsoredURL = self.innerWidget.generateUrl(self.sponsoredOffset, rowData.sponsoredLimit, false, false, false);
                    urls.push({
                        offset: self.sponsoredOffset,
                        limit: rowData.sponsoredLimit,
                        url: sponsoredURL,
                        type: 'sponsored'
                    });
                    self.sponsoredOffset += rowData.sponsoredLimit;
                }

                this.promises = [];
                for (var i = 0; i < urls.length; i++) {
                    this.promises.push(new Promise(function(resolve, reject) {
                        var url = urls[i];

                        // TODO - mock data
                        // if (url.type == 'internal') {
                        //     var resp = self.innerWidget.mockInternal[self.options.mock].slice(url.offset, url.offset + url.limit);
                        //     resolve({
                        //         type: url.type,
                        //         data: resp
                        //     });
                        //     return;
                        // }

                        // if (url.type == 'sponsored') {
                        //     var resp = self.innerWidget.mockSponsored[self.options.mock].slice(url.offset, url.offset + url.limit);
                        //     resolve({
                        //         type: url.type,
                        //         data: resp
                        //     });
                        //     return;
                        // }
                        revApi.request(url.url, function(resp) {
                            resolve({
                                type: url.type,
                                data: resp
                            });
                        });
                    }));
                }

                Promise.all(this.promises).then(function(data) {
                    self.innerWidget.updateDisplayedItems(rowData.items, data);
                    self.innerWidget.viewableItems = self.innerWidget.viewableItems.concat(rowData.items);
                    self.doing = false; // TODO should this be moved up and out
                }, function(e) {
                }).catch(function(e) {
                    console.log(e);
                });
            }

            self.scrollTop = scrollTop;
        }

        this.innerWidget.emitter.on('removedItems', function(items) {
            revUtils.removeEventListener(window, 'scroll', self.visibleListener);
            revUtils.removeEventListener(window, 'scroll', self.scrollListener);

            var el = items[0].element;
            var remove = [el];
            while (el= el.nextSibling) {
                remove.push(el);
            }

            self.innerWidget.grid.remove(remove);

            self.innerWidget.grid.layout();
        });

        revUtils.addEventListener(window, 'scroll', this.scrollListener);
    };

    RevFeed.prototype.checkVisible = function() {
        var self = this;
        for (var i = 0; i < this.innerWidget.viewableItems.length; i++) {
            revUtils.checkVisibleItem(this.innerWidget.viewableItems[i], function(viewed, item) {
                if (viewed) {
                    var index = self.innerWidget.viewableItems.indexOf(item);
                    if(index != -1) {
                        self.innerWidget.viewableItems.splice(index, 1);

                        // if (!self.viewable.length) {
                        //     revUtils.removeEventListener(window, 'scroll', self.visibleListener);
                        // }
                        self.registerView([item]);
                    }
                }
            }, self.options.viewable_percentage);
        }
    };

    RevFeed.prototype.registerView = function(viewed) {

        var view = viewed[0].data.view;

        if (!view) { // safety first, if the first one doesn't have data none should
            return;
        }

        // var params = 'api_source=' + (viewed[0].initial ? 'ba_' : '') + this.options.api_source;

        // params += 'id=' + encodeURIComponent(this.options.id); // debug/test

        var params = 'view=' + view;

        for (var i = 0; i < viewed.length; i++) {
            params += '&' + encodeURIComponent('p[]') + '=' + viewed[i].viewIndex;
        }

        revApi.request(this.options.host + '/view.php?' + params, function() {

        });
    };

    return RevFeed;

}));