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
            per_row: 1,
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
            topic_title:''
        };


        this.historyStack = [];

        if (opts.masonry_layout) { // they wan't masonry, provide a masonry per_row default
            defaults.per_row = {
                xxs: 1,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 2,
                xl: 3,
                xxl: 3
            };
        }

        // merge options
        this.options = revUtils.extend(defaults, opts);

        if (!this.options.internal_selector) {

            this.options.internal_selector = '';

            if (this.options.initial_sponsored || this.options.sponsored) { // we have sponsored, determine what should be internal

                for (var i = 1; i <= this.options.initial_internal; i++) { // initial internal using nth-child
                    this.options.internal_selector += '.rev-content:nth-child('+ i +'),';
                }

                // internal starts up again
                var start = (this.options.initial_internal + this.options.initial_sponsored + 1);

                if (this.options.sponsored) { // pattern for sponsored based on internal
                    for (var i = 1; i <= this.options.internal; i++) {
                        this.options.internal_selector += '.rev-content:nth-child('+ (this.options.internal + this.options.sponsored) +'n + '+ start +'),';
                        start++;
                    }
                } else if (this.options.initial_sponsored) { // only inital sponsored so everything after start will be internal
                    this.options.internal_selector += '.rev-content:nth-child(n+'+ start +'),';
                }
                // trim comma
                this.options.internal_selector = this.options.internal_selector.slice(0, -1);
            } else { // everything is internal
                this.options.internal_selector = '.rev-content';
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
        this.emitter = new EventEmitter();
        this.internalOffset = 0;
        this.sponsoredOffset =0;

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



        window.feedEasterEgg = function() {
            revApi.request( self.options.host + '/api/v1/engage/profile.php?', function(data) {
                self.initCornerButton(data);
            });
        };

        this.innerWidget.dataPromise.then(function() {
            self.viewability().then(function() {

                // if (self.innerWidget.authenticated) {
                //     revApi.request( self.options.host + '/api/v1/engage/profile.php?', function(data) {
                //         self.initCornerButton(data);
                //     });
                // }

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
            }).catch(function(e) {
                console.log(e);
            });
        }, function() {
        }).catch(function(e) {
            console.log(e);
        });
    };

    Feed.prototype.initCornerButton = function(data) {
        this.buttonContainerElement = document.createElement('div');
        this.buttonContainerElement.id = 'rev-corner-button-container';

        this.buttonElement = document.createElement('a');
        this.buttonElement.id = 'rev-corner-button';

        this.buttonElement.innerHTML = '<img src="' + data.profile_url + '"/>';

        // var svg;

        // svg = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
        // this.buttonElement.classList.add('rev-corner-button-plus');

        // this.buttonElement.innerHTML = svg;

        revUtils.append(this.buttonContainerElement, this.buttonElement);

        // this.buttonMenu = document.createElement('menu');
        // this.buttonMenu.className = 'rev-button-menu';

        // this.button1 = document.createElement('button');
        // this.button1.innerHTML = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
        // this.button1.className = 'menu-button menu-button-1';
        // Waves.attach(this.button1, ['waves-circle', 'waves-float']);

        // this.button2 = document.createElement('button');
        // this.button2.innerHTML = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
        // this.button2.className = 'menu-button menu-button-2';
        // Waves.attach(this.button2, ['waves-circle', 'waves-float']);

        // this.button3 = document.createElement('button');
        // this.button3.innerHTML = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
        // this.button3.className = 'menu-button menu-button-3';
        // Waves.attach(this.button3, ['waves-circle', 'waves-float']);

        // revUtils.append(this.buttonMenu, this.button1);
        // revUtils.append(this.buttonMenu, this.button2);
        // revUtils.append(this.buttonMenu, this.button3);
        // revUtils.append(this.buttonContainerElement, this.buttonMenu);

        Waves.attach(this.buttonElement, ['waves-circle', 'waves-float']);
        Waves.init();

        this.profileMask = document.createElement('div');
        this.profileMask.id = 'profile-mask';

        revUtils.addEventListener(this.profileMask, 'transitionend', function(ev) {
            if (ev.propertyName === 'transform') {
                if (!revUtils.hasClass(document.body, 'animate-user-profile')) {
                    revUtils.removeClass(document.body, 'profile-mask-show');
                }
            }
        });

        var userProfile = document.createElement('div');
        userProfile.id = 'rev-user-profile';

        // TODO TBD
        // revUtils.append(document.body, userProfile);
        // revUtils.append(document.body, this.profileMask);

        userProfile.innerHTML = '<div id="profile-image" style="background-image: url(' + data.profile_url + ')"></div>';

        revUtils.addEventListener(userProfile, revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
            ev.preventDefault();
        }, {passive: false});

        revUtils.addEventListener(this.profileMask, revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
            revUtils.removeClass(document.body, 'animate-user-profile');
        });

        var that = this;
        revUtils.addEventListener(this.buttonElement, revDetect.mobile() ? 'touchstart' : 'click', function(ev) {

            if (!that.userProfileAppended) {
                revUtils.append(document.body, userProfile);
                revUtils.append(document.body, that.profileMask);
                that.userProfileAppended = true;
            }

            // if (revUtils.hasClass(that.buttonContainerElement, 'visible')) {
            //     revUtils.removeClass(that.buttonContainerElement, 'visible')
            // } else {
            //     revUtils.addClass(that.buttonContainerElement, 'visible')
            // }

            // that.innerWidget.grid.unbindResize();
            // document.body.style.overflow = 'hidden';

            revUtils.addClass(document.body, 'profile-mask-show');

            setTimeout(function() {
                if (revUtils.hasClass(document.body, 'animate-user-profile')) {
                    revUtils.removeClass(document.body, 'animate-user-profile');
                } else {
                    revUtils.addClass(document.body, 'animate-user-profile');
                }
            });
        });

        revUtils.append(document.body, this.buttonContainerElement);

        // revUtils.addEventListener(this.button3, 'click', function(e) {
        //     RevSlider.prototype.appendSliderPanel("Your Profile", "loading me here", "engage-profile-panel");
        // });

        // revUtils.addEventListener(this.button2, 'click', function(e) {
        //     RevSlider.prototype.appendSliderPanel("Your Bookmarks", "loading me here", "engage-bookmarks-panel");
        // });

    };

    Feed.prototype.pushHistory = function(){
        this.historyStack.push({
            author_name:this.options.author_name,
            topic_id:this.options.topic_id,
            topic_title:this.options.topic_title
        });
    };

    Feed.prototype.loadFromHistory = function(){
        if(this.historyStack.length>0){
            var item = this.historyStack.pop();
            if(item.topic_id && item.topic_id>0){
                this.innerWidget.loadTopicFeed(item.topic_id,item.topic_title,true);
            }
            else if(item.author_name && item.author_name.length>0){
                this.innerWidget.loadAuthorFeed(item.author_name, true);
            }else{
                this.options.author_name ='';
                this.options.topic_id = -1;
                this.internalOffset = 0;
                this.sponsoredOffset = 0;
                this.createInnerWidget();
                this.infinite();
            }

        }
    };

    Feed.prototype.windowWidth = function() {

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

    Feed.prototype.createInnerWidget = function() {
        var that = this;
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
            topic_id:     this.options.topic_id,
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
            brand_logo_secondary: this.options.brand_logo_secondary,
            comment_div: this.options.comment_div,
            reaction_id: this.options.reaction_id,
            mobile_image_optimize: this.options.mobile_image_optimize,
            trending_utm: this.options.trending_utm,
            keywords: this.options.keywords,
            developer: this.options.developer,
            internal_selector: this.options.internal_selector,
            headline_top_selector: this.options.headline_top_selector,
            window_width_enabled: this.windowWidthEnabled,
            disclosure_about_src: this.options.disclosure_about_src,
            disclosure_about_height: this.options.disclosure_about_height,
            disclosure_interest_src: this.options.disclosure_interest_src,
            disclosure_interest_height: this.options.disclosure_interest_height,
            breakpoints: this.options.breakpoints,
            masonry_layout: this.options.masonry_layout,
            img_host: this.options.img_host,
            author_name: this.options.author_name,
            history_stack:that.historyStack,
            topic_title:this.options.topic_title
        },{
            "loadTopicFeed":function(topicId, topicTitle, withoutHistory){
                if(!withoutHistory) that.pushHistory();
                that.options.author_name = '';
                that.options.topic_id = topicId;
                that.options.topic_title = topicTitle;
                that.internalOffset = 0;
                that.sponsoredOffset = 0;
                that.createInnerWidget();
                that.infinite();


            },
            "loadAuthorFeed":function(authorName, withoutHistory){
                if(!withoutHistory) that.pushHistory();
                that.options.author_name = authorName;
                that.options.topic_id = -1;
                that.internalOffset = 0;
                that.sponsoredOffset = 0;
                that.createInnerWidget();
                that.infinite();

            },
            "back":function () {
                that.loadFromHistory();
            }

        });
    };

    Feed.prototype.viewability = function() {
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

    Feed.prototype.infinite = function() {
        var self = this;

        this.scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

        var scrollFunction = function() {

            var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var height = self.element.offsetHeight;
            var top = self.innerWidget.grid.element.getBoundingClientRect().top;
            var bottom = self.innerWidget.grid.element.getBoundingClientRect().bottom;

            if (scrollTop >= self.scrollTop && bottom > 0 && (scrollTop + windowHeight) >= (top + scrollTop + height - self.options.buffer)) {
                revUtils.removeEventListener(window, 'scroll', self.scrollListener);

                self.internalOffset = self.internalOffset ? self.internalOffset : self.innerWidget.internalLimit;
                self.sponsoredOffset = self.sponsoredOffset ? self.sponsoredOffset : self.innerWidget.sponsoredLimit;

                var rowData = self.innerWidget.createRows(self.innerWidget.grid, self.options.rows);

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
                        revApi.request(url.url, function(resp) {
                            resolve({
                                type: url.type,
                                data: resp
                            });
                        });
                    }));
                }

                setTimeout( function() {
                    revUtils.addEventListener(window, 'scroll', self.scrollListener);
                }, 150); // give it a rest before going back

                Promise.all(this.promises).then(function(data) {
                    self.innerWidget.updateDisplayedItems(rowData.items, data);
                    self.innerWidget.viewableItems = self.innerWidget.viewableItems.concat(rowData.items);
                }, function(e) {
                }).catch(function(e) {
                    console.log(e);
                });
            }

            self.scrollTop = scrollTop;
        };

        this.scrollListener = revUtils.throttle(scrollFunction, 60);

        revUtils.addEventListener(window, 'scroll', this.scrollListener);

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
    };

    Feed.prototype.checkVisible = function() {
        var self = this;
        for (var i = 0; this.innerWidget.viewableItems && i < this.innerWidget.viewableItems.length; i++) {
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

    Feed.prototype.registerView = function(viewed) {

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

    return Feed;

}));