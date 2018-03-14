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
            emitter: new EvEmitter(),
            history_stack: [],
            contextual_last_sort: []
        };

        // merge options
        this.options = revUtils.extend(defaults, opts);

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

        self.windowWidth();

        this.options.emitter.on('removedItems', function(items) {
            self.removed = true;

            if (self.options.infinite) {
                revUtils.removeEventListener(window, 'scroll', self.scrollListener);
            } else {
                revUtils.remove(self.loadMoreContainer);
            }

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    var index = self.innerWidget.grid.items.indexOf(items[i]);
                    var removed = self.innerWidget.grid.items.splice(index, 1);
                    removed[0].remove();
                }
            }

            self.innerWidget.grid.layout();
        });

        this.options.emitter.on('createFeed', function(type, data) {
            self.innerWidget.removeNotify(); // remove notify if present

            // initial
            var total = self.options.rows * self.innerWidget.grid.perRow;

            // remove any elements beyond initial count
            var removeItems = [];
            var removeCount = 0;
            var updateItems = 0;

            var sponsoredLimit = 0;
            var internalLimit = 0;

            for (var i = 0; i < self.innerWidget.grid.items.length; i++) {
                if (self.innerWidget.grid.items[i].type) {
                    if (removeCount >= total) {
                        removeItems.push(self.innerWidget.grid.items[i]);
                    } else {
                        updateItems++;

                        switch(self.innerWidget.grid.items[i].type) {
                            case 'internal':
                                internalLimit++;
                                break;
                            case 'sponsored':
                                sponsoredLimit++;
                                break;
                        };
                    }
                    removeCount++
                }
            }

            for (var i = 0; i < removeItems.length; i++) {
                var index = self.innerWidget.grid.items.indexOf(removeItems[i]);
                var removed = self.innerWidget.grid.items.splice(index, 1);
                removed[0].remove();
            }

            // add up to initial if its a new gridsky
            if (updateItems < total) {
                var rowData = self.innerWidget.createRows(self.innerWidget.grid, (total - updateItems));
                sponsoredLimit += rowData.sponsoredLimit;
                internalLimit += rowData.internalLimit;
                updateItems += rowData.items.length;
            }

            self.innerWidget.internalOffset = 0;
            self.innerWidget.sponsoredOffset = 0;

            switch (type) {
                case 'author':
                    self.options.topic_type = type;
                    self.options.author_name = data.authorName;
                    self.options.topic_id = -1;
                    self.options.topic_title = '';
                    break;
                case 'topic':
                    self.options.topic_type = type;
                    self.options.author_name = '';
                    self.options.topic_id = data.topicId;
                    self.options.topic_title = data.topicTitle;
                    break;
                default:
                    self.options.topic_type = 'default';
                    self.options.author_name ='';
                    self.options.topic_id = -1;
                    break;
            }


            // History Stack
            if (!data.withoutHistory) {
                self.pushHistory();
            }

            // TODO - yikes
            self.innerWidget.options = revUtils.extend(self.innerWidget.options, self.options);

            if (updateItems > 0) {
                var internalURL = self.innerWidget.generateUrl(0, internalLimit, 0, sponsoredLimit);

                revApi.request(internalURL, function(resp) {

                    var internalCount = 0;

                    if (resp.content) {
                        for (var i = 0; i < resp.content.length; i++) {
                            if (resp.content[i].type === 'internal') {
                                internalCount++;
                            }
                        }
                    }

                    if (!internalCount) { // if not content stop infinite scroll and get out
                        self.options.emitter.emitEvent('removedItems');
                        self.innerWidget.notify('Oh no! This is somewhat embarrassing. We don\'t have content for that ' + revUtils.capitalize(type) + '. Please go back or try a different ' + revUtils.capitalize(type) + '.', {label: 'continue', link: '#'}, 'info', false);
                        if (self.options.history_stack.length > 0) {
                            self.options.history_stack.pop();
                            self.navBar();
                        }
                        return;
                    }

                    if (self.removed) { // if feed ended reinit infinite
                        self.removed = false;
                        self.infinite();
                    }

                    self.innerWidget.updateDisplayedItems(self.innerWidget.grid.items, resp);

                    self.navBar();

                });
            }

            setTimeout(function() { // wait a tick ENG-263
                self.innerWidget.containerElement.scrollIntoView(true);
                // allow feed link clicks again
                self.innerWidget.preventFeedLinkClick = false;

                self.navBar();
            });

        });

        this.innerWidget = this.createInnerWidget(this.containerElement, this.options);

        if (!this.innerWidget.dataPromise) {
            return;
        }

        window.feedEasterEgg = function() {
            self.initCornerButton();
        };

        this.innerWidget.dataPromise.then(function(data) {

            self.viewableItems = [];
            for (var i = 0; i < data.rowData.items.length; i++) {
                if (data.rowData.items[i].view) {
                    self.viewableItems.push(data.rowData.items[i]);
                }
            }

            self.viewability().then(function() {

                // if (self.innerWidget.authenticated) {
                //     revApi.request( self.options.host + '/api/v1/engage/profile.php?', function(data) {
                //         self.initCornerButton(data);
                //     });
                // }

                if (!self.removed) {
                    self.options.infinite ? self.infinite() : self.loadMore();
                }

                if (self.viewed.length) {
                    self.registerView(self.viewed);
                }
                self.visibleListener = revUtils.throttle(self.checkVisible.bind(self), 30);
                revUtils.addEventListener(window, 'scroll', self.visibleListener);
            }, function() {
                console.log('*************Feed', 'something went wrong');
            }).catch(function(e) {
                console.log('*************Feed', e);
            });
        }, function(e) {
            self.innerWidget.destroy();
            console.log('*************Feed', e);
        }).catch(function(e) {
            console.log('*************Feed', e);
        });
    };

    Feed.prototype.initCornerButton = function() {

        if (!this.options.user) {
            return;
        }

        this.buttonContainerElement = document.createElement('div');
        this.buttonContainerElement.id = 'rev-corner-button-container';

        this.buttonElement = document.createElement('a');
        this.buttonElement.id = 'rev-corner-button';

        this.buttonElement.innerHTML = '<img src="' + this.options.user.profile_url + '"/>';

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

        userProfile.innerHTML = '<div id="profile-image" style="background-image: url(' + this.options.user.profile_url + ')"></div>';

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

    Feed.prototype.navBar = function() {
        if(this.options.history_stack.length == 0){
            var existingBack = this.innerWidget.containerElement.querySelector('.go-back-bar');
            if (existingBack){
                this.detachBackBar(existingBack, existingBack.querySelector('button'));
            }
            return;
        }

        var activePage = this.options.history_stack[this.options.history_stack.length-1];
        var existingHeader = this.innerWidget.containerElement.querySelector('.rev-nav-header');
        var header = existingHeader ? existingHeader : document.createElement('div');
        header.className = 'rev-nav-header';
        //if(this.options.topic_id>0){
        //    header.innerHTML="<h3>"+this.options.topic_title+" Articles</h3>";
        //}

        //if(this.options.author_name && this.options.author_name.length>0){
        //    header.innerHTML="<h3>Articles By "+this.options.author_name+"</h3>";
        //}

        var existingBack = this.innerWidget.containerElement.querySelector('.go-back-bar');
        var back = existingBack ? existingBack : document.createElement('div');

        back.setAttribute('data-type', activePage.type);
        back.setAttribute('data-author', activePage.author_name.toLowerCase());
        back.setAttribute('data-topic', activePage.topic_id);
        back.setAttribute('data-title', activePage.topic_title);

        //var e_icon = '<span style="margin: 10px 10px 0 10px;width:16px;height:16px;display:block;background: transparent url(data:image/png;base64,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) top left no-repeat;background-size:contain"></span>';
        var e_icon = '';
        var back_icon = '<span style="margin:0 auto;width:16px;height:16px;display:block;cursor:pointer;background: transparent url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNTEyLjA1NiA1MTIuMDU2IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIuMDU2IDUxMi4wNTY7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgY2xhc3M9IiI+PGc+PGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNDM0LjE2LDI0NC4yMjVjLTUxLjk2OC01My44NjctMTI2LjIyOS04Mi4xNTUtMjIwLjg0My04NC4wOTZWNjQuMDIyYzAtNC4zMDktMi42MDMtOC4yMTMtNi41OTItOS44NTYgICAgYy0zLjk4OS0xLjYyMS04LjU1NS0wLjc0Ny0xMS42MDUsMi4zMDRsLTE5MiwxOTJjLTQuMTYsNC4xNi00LjE2LDEwLjkyMywwLDE1LjA4M2wxOTIsMTkyYzMuMDUxLDMuMDcyLDcuNjU5LDMuOTg5LDExLjYyNywyLjMwNCAgICBjMy45ODktMS42NDMsNi41OTItNS41NDcsNi41OTItOS44NTZ2LTk1LjkxNWMyMTQuMzM2LDMuMTE1LDI3OC4zMTUsMTAwLjU2NSwyNzguOTMzLDEwMS41MjVjMS45ODQsMy4yLDUuNDQsNS4wNTYsOS4wNjcsNS4wNTYgICAgYzAuODk2LDAsMS44MTMtMC4xMjgsMi43MzEtMC4zNjNjNC41NDQtMS4yMTYsNy43NjUtNS4yMjcsNy45MzYtOS45NDFDNTEyLjE1NSw0NDMuNTQyLDUxNS4zMzMsMzI4LjM4NSw0MzQuMTYsMjQ0LjIyNXoiIGRhdGEtb3JpZ2luYWw9IiMwMDAwMDAiIGNsYXNzPSJhY3RpdmUtcGF0aCIgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgZGF0YS1vbGRfY29sb3I9IiNmZmZmZmYiPjwvcGF0aD4KCTwvZz4KPC9nPjwvZz4gPC9zdmc+) top left no-repeat;background-size:contain;">&nbsp;</span>';
        //var menu_icon = '<span style="margin: 9px 9px 0 9px;width:18px;height:18px;display:block;background:transparent url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAiIHkxPSIyNTgiIHgyPSI1MTIiIHkyPSIyNTgiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgLTEgMCA1MTQpIj4KCTxzdG9wIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwRjJGRSIvPgoJPHN0b3Agb2Zmc2V0PSIwLjAyMSIgc3R5bGU9InN0b3AtY29sb3I6IzAzRUZGRSIvPgoJPHN0b3Agb2Zmc2V0PSIwLjI5MyIgc3R5bGU9InN0b3AtY29sb3I6IzI0RDJGRSIvPgoJPHN0b3Agb2Zmc2V0PSIwLjU1NCIgc3R5bGU9InN0b3AtY29sb3I6IzNDQkRGRSIvPgoJPHN0b3Agb2Zmc2V0PSIwLjc5NiIgc3R5bGU9InN0b3AtY29sb3I6IzRBQjBGRSIvPgoJPHN0b3Agb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojNEZBQ0ZFIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIHN0eWxlPSJmaWxsOnVybCgjU1ZHSURfMV8pOyIgZD0iTTQzOCwxNDhINzRjLTQwLjgwNCwwLTc0LTMzLjE5Ni03NC03NFMzMy4xOTYsMCw3NCwwaDM2NGM0MC44MDQsMCw3NCwzMy4xOTYsNzQsNzQgIFM0NzguODA0LDE0OCw0MzgsMTQ4eiBNNzQsNDBjLTE4Ljc0OCwwLTM0LDE1LjI1Mi0zNCwzNHMxNS4yNTIsMzQsMzQsMzRoMzY0YzE4Ljc0OCwwLDM0LTE1LjI1MiwzNC0zNHMtMTUuMjUyLTM0LTM0LTM0SDc0eiAgIE00MzgsMzMwSDc0Yy00MC44MDQsMC03NC0zMy4xOTYtNzQtNzRzMzMuMTk2LTc0LDc0LTc0aDM2NGM0MC44MDQsMCw3NCwzMy4xOTYsNzQsNzRTNDc4LjgwNCwzMzAsNDM4LDMzMHogTTc0LDIyMiAgYy0xOC43NDgsMC0zNCwxNS4yNTItMzQsMzRzMTUuMjUyLDM0LDM0LDM0aDM2NGMxOC43NDgsMCwzNC0xNS4yNTIsMzQtMzRzLTE1LjI1Mi0zNC0zNC0zNEg3NHogTTUxMiw0MzhjMC00MC44MDQtMzMuMTk2LTc0LTc0LTc0ICBINzRjLTQwLjgwNCwwLTc0LDMzLjE5Ni03NCw3NHMzMy4xOTYsNzQsNzQsNzRoMjY0YzExLjA0NiwwLDIwLTguOTU0LDIwLTIwcy04Ljk1NC0yMC0yMC0yMEg3NGMtMTguNzQ4LDAtMzQtMTUuMjUyLTM0LTM0ICBzMTUuMjUyLTM0LDM0LTM0aDM2NGMxOC43NDgsMCwzNCwxNS4yNTIsMzQsMzRzLTE1LjI1MiwzNC0zNCwzNGMtMTEuMDQ2LDAtMjAsOC45NTQtMjAsMjBzOC45NTQsMjAsMjAsMjAgIEM0NzguODA0LDUxMiw1MTIsNDc4LjgwNCw1MTIsNDM4eiIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K) top left no-repeat;background-size:contain"></span>';
        var menu_icon = '';

        var grid_rect = this.innerWidget.containerElement.getBoundingClientRect();
        var left_pos = grid_rect.left || 'auto';
        var top_pos = grid_rect.top || 0;
        //top_pos = 0; // TODO
        var grid_width = this.innerWidget.containerElement.clientWidth > 0 ?  this.innerWidget.containerElement.clientWidth  + 'px' : '100%';

        this.innerWidget.containerElement.style.paddingTop = '48px';

        back.setAttribute('style','overflow:hidden;transition: none;-moz-transition: none;-webkit-transition: none;-o-transition: none;box-shadow: 0 1px 4px 0 rgba(12, 12, 13, 0.5);position:static;z-index:5000;left:' + left_pos + ';top:' + top_pos + ';margin-bottom: 0;display: block;width: ' + grid_width + ';height: 40px;line-height: 40px;background-color:rgba(0,0,0,0.83);color:#dddddd;font-size:12px;');
        back.setAttribute('id','go-back-bar');
        back.classList.add('go-back-bar');

        var header_logo = '';
        if(this.options.brand_logo_secondary){
            header_logo = '<img src="' + this.options.brand_logo_secondary + '" alt="" style="max-width:100%;margin: 0 9px;" />';
        }

        var title = "";
        var author_initials = '';

        if(activePage.type == "topic"){
            title = activePage.topic_title;
        }
        else if (activePage.type == "author"){
            if(activePage.author_name){
                title = "Articles by " + activePage.author_name;
                var ai = activePage.author_name.split(' ');
                author_initials = ai[0].charAt(0) + ' ' + (ai.length == 3 ? ai[2].charAt(0) : ai[1].charAt(0));
                header_logo = '<span style="display:block;margin-left:9px;width:24px;height:24px;border-radius:24px;text-align:center;font-size:11px;background-color:#ffffff;color:#222222;letter-spacing:-1px;line-height:24px;margin-top:8px;">' + author_initials + '</span>';
            }
        }

        back.innerHTML = '<div style="display:flex;flex-direction:row;">' +
            '<div class="feed-header-back"><button style="background-color:#444444;border:0;margin:0;border-right:1.0px solid #484848;display:block;width:40px;height:40px;text-align:center;font-weight: bold;font-size:32px" class="feed-back-button" name="feed-back-button" value="">' + back_icon + '</button></div>' +
            '<div class="feed-header-logo" style="' + (header_logo != '' ? 'width:32px;' : '') + '">' + header_logo + '</div>' +
            '<div class="feed-header-title" style="white-space:nowrap;width:95%;padding-left:18px;text-overflow:ellipsis;overflow:hidden;text-align-center;color:#ffffff;font-size:14px;letter-spacing: 0;font-weight:normal;"><span>' + title + '</span></div>' +
            '<div class="feed-header-options" style="min-width:auto;text-align:center;">' + e_icon + '</div>' +

            '</div>';

        // this.innerWidget.containerElement.appendChild(back);

        this.innerWidget.head.insertAdjacentElement('afterend', back);
        this.innerWidget.head.insertAdjacentElement('afterend', header);

        var that = this;

        revUtils.addEventListener(window, 'resize', function(){
            var grid_rect = that.innerWidget.containerElement.getBoundingClientRect();
            back.style.width = grid_rect.width + 'px';
        });

        //window.addEventListener('scroll', function() {
        //}, { passive: true });

        revUtils.addEventListener(window, 'scroll', function(){
            that.navbarScrollListener(that, back);
        });

        var backButton = back.querySelector('.feed-back-button');

        revUtils.addEventListener(backButton, revDetect.mobile() ? 'touchstart' : 'click', this.loadFromHistory.bind(this, back, backButton));
    };

    Feed.prototype.navbarScrollListener = function(that, back){
        var pos_1 = window.pageYOffset;
        setTimeout(function(){
            var pos_2 = window.pageYOffset;
            var direction = 'down';
            var grid_rect = that.innerWidget.containerElement.getBoundingClientRect();

            if(pos_2 < pos_1) {
                direction = 'up';
            }

            if(grid_rect.top <= 0) {
                var fix_ts = 0;
                clearTimeout(fix_ts);
                fix_ts = setTimeout(function() {
                    var fixed_head = document.querySelector('.page-header.shrink.fixed');
                    var fixed_head2 = document.querySelector('.page-header.fixed');
                    // ENG-285 Need to improve fixed element detection for better cross-site support.
                    // for now these classes are site specific...
                    var fixed_video = document.querySelector('.videocontent-wrapper.mStickyPlayer');
                    var top_offset = 0;

                    var notice = that.element.querySelector('div#rev-notify-panel');

                    if (fixed_head) {
                        top_offset = parseInt(fixed_head.clientHeight);
                    }
                    if (fixed_head2) {
                        top_offset = parseInt(fixed_head2.clientHeight);
                    }
                    if (fixed_video) {
                        top_offset = parseInt(fixed_video.clientHeight);
                        fixed_video.style.zIndex = '20000';
                    }
                    back.style.position = 'fixed';
                    back.style.width = grid_rect.width + 'px';
                    back.style.top = 0 + top_offset + 'px';
                    back.classList.remove('no-shadow');

                    if (notice) {
                        notice.style.position = 'fixed';
                        notice.style.left = 'auto';
                        notice.style.top = 0 + (top_offset + back.clientHeight) + 'px';
                        notice.style.width = grid_rect.width + 'px';
                    }

                    //if (that.options.window_width_devices && revDetect.show(that.options.window_width_devices)) {
                    //    that.enterFlushedState(that.element);
                    //}
                    clearTimeout(fix_ts);
                }, 0);

            } else {
                back.style.top = 0;
                back.style.position = 'static';
                back.style.width = '100%';
                back.classList.add('no-shadow');

                var notice = that.element.querySelector('div#rev-notify-panel');

                if (notice) {
                    notice.style.top = 0;
                    notice.style.position = 'static';
                    notice.style.width = '100%';
                    notice.style.marginBottom = '9px';
                    back.style.marginBottom = 0;
                } else {
                    back.style.marginBottom = '9px';
                }

                //if (that.options.window_width_devices && revDetect.show(that.options.window_width_devices)) {
                //    that.leaveFlushedState(that.element);
                //}
            }
        }, 300);
    };

    Feed.prototype.pushHistory = function(){

        if (this.options.topic_type == "author") {
            if(this.options.history_stack.length > 0){
                if (this.options.author_name.toLowerCase() == this.options.history_stack[this.options.history_stack.length-1].author_name.toLowerCase()) {
                    return;
                }
            }
        }

        if (this.options.topic_type == "topic" && this.options.topic_id !== -1){
            if(this.options.history_stack.length > 0){
                if (this.options.topic_id == this.options.history_stack[this.options.history_stack.length-1].topic_id) {
                    return;
                }
            }
        }

        this.options.history_stack.push({
            type: this.options.topic_type,
            author_name:this.options.author_name,
            topic_id:this.options.topic_id,
            topic_title:this.options.topic_title
        });

    };

    Feed.prototype.loadFromHistory = function(backBar, backButton) {
        //alert("here!");
        var that = this;
        if(this.element.classList.contains('is-loading') || this.options.history_stack.length == 0) {
            return;
        }
        this.element.classList.add('is-loading');
        this.element.style.pointerEvents = 'none';
        this.element.style.transition = 'all 0.8s';
        this.element.style.opacity = 0.7;
        if (this.options.history_stack.length > 1) {
            var item = this.options.history_stack.pop();
            if(this.options.history_stack.length == 0){
                this.clearHistory(backBar, backButton);
            } else {
                item = this.options.history_stack.pop();
            }
            if (item.type == "topic" && !isNaN(item.topic_id)) {
                this.innerWidget.loadTopicFeed(item.topic_id,item.topic_title, false);
            }
            else if (item.type == "author" && item.author_name.length > 0) {
                this.innerWidget.loadAuthorFeed(item.author_name, false);
            } else {
                this.options.emitter.emitEvent('createFeed', ['default', {
                    withoutHistory: true
                }]);
                this.clearHistory(backBar, backButton);
            }

        } else {
            this.options.emitter.emitEvent('createFeed', ['default', {
                withoutHistory: true
            }]);
            this.clearHistory(backBar, backButton);
        }

        var refreshTimeout = setTimeout(function(){
            that.element.classList.remove('is-loading');
            that.element.style.pointerEvents = 'auto';
            that.element.style.transition = 'none';
            that.element.style.opacity = 1;
            clearTimeout(refreshTimeout);
        }, 800);
    };

    Feed.prototype.clearHistory = function(backBar, backButton) {
        this.detachBackBar(backBar, backButton);
        this.options.history_stack = [];
    };

    Feed.prototype.detachBackBar = function(backBar, backButton) {
        if (backBar) {
            backBar.style.pointerEvents = 'none';
            if (revDetect.mobile()) {
                revUtils.addEventListener(backButton, 'touchend', function() {
                    setTimeout(function() {
                        backBar.remove(); // wait a tick
                    });
                });
            } else {
                backBar.remove();
            }
        }
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
        return new RevSlider(options);
    };

    Feed.prototype.viewability = function() {
        this.viewed = [];

        var self = this;

        return new Promise(function(resolve, reject) {
            var total = self.viewableItems.length;
            var count = 0;
            for (var i = 0; i < self.viewableItems.length; i++) {
                revUtils.checkVisibleItem(self.viewableItems[i], function(viewed, item) {
                    count++;
                    if (count == total) {
                        resolve();
                    }
                    if (viewed) {
                        var index = self.viewableItems.indexOf(item);
                        if(index != -1) {
                            self.viewableItems.splice(index, 1);
                        }
                        self.viewed.push(item);
                    }
                }, self.options.viewable_percentage);
            }
        });
    };

    Feed.prototype.loadMore = function() {
        var self = this;

        self.loadMoreContainer = document.createElement('div');
        self.loadMoreContainer.className = 'rev-loadmore-button';

        self.loadMoreText = document.createElement('div');
        self.loadMoreText.className = 'rev-loadmore-button-text';
        self.loadMoreText.innerHTML = 'LOAD MORE CONTENT';

        revUtils.append(self.loadMoreContainer, self.loadMoreText);
        revUtils.append(self.innerWidget.containerElement, self.loadMoreContainer);

        self.loadMoreListener = function() {
            self.loadMoreText.innerHTML = 'LOADING ...';
            self.loadMoreContainer.className = 'rev-loadmore-button loading';
            revUtils.removeEventListener(self.loadMoreContainer, 'click', self.loadMoreListener);

            self.addContent(self);
        };

        revUtils.addEventListener(self.loadMoreContainer, 'click', self.loadMoreListener);
    };

    Feed.prototype.infinite = function() {
        var self = this;

        this.scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

        // this.testRetry = 0;

        var scrollFunction = function() {

            var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var height = self.element.offsetHeight;
            var top = self.innerWidget.grid.element.getBoundingClientRect().top;
            var bottom = self.innerWidget.grid.element.getBoundingClientRect().bottom;

            // if(top <= 0 && (self.options.window_width_devices && revDetect.show(self.options.window_width_devices))) {
            //     self.enterFlushedState(self.element);
            // } else {
            //     self.leaveFlushedState(self.element);
            // }

            if (self.removed) {
                revUtils.removeEventListener(window, 'scroll', self.scrollListener);
                return;
            }

            if (scrollTop >= self.scrollTop && bottom > 0 && (scrollTop + windowHeight) >= (top + scrollTop + height - self.options.buffer)) {

                revUtils.removeEventListener(window, 'scroll', self.scrollListener);

                self.addContent(self);
                // self.testRetry++;
            }

            self.scrollTop = scrollTop;
        };

        this.scrollListener = revUtils.throttle(scrollFunction, 60);

        revUtils.addEventListener(window, 'scroll', this.scrollListener);
    };

    Feed.prototype.addContent = function(self) {
        var promise = new Promise(function(resolve, reject) {

            var tryToCreateRows = function(retries) {
                try {
                    var beforeItemCount = self.innerWidget.grid.items.length;

                    var rowData = self.innerWidget.createRows(self.innerWidget.grid, self.options.rows);

                    // if (self.testRetry > 0 && retries != 3) { // TEST
                    //     throw new Error('Whoops!');
                    // }

                    if (self.options.infinite) {
                        setTimeout(function () {
                            if (!self.removed) {
                                revUtils.addEventListener(window, 'scroll', self.scrollListener);
                            }
                        }, 150); // give it a rest before going back
                    }

                    resolve(rowData);
                } catch (e) { // remove items and try again
                    // remove items TODO: wrap this in try
                    var remove = self.innerWidget.grid.items.length - beforeItemCount;
                    for (var i = 0; i < remove; i++) {
                        var popped = self.innerWidget.grid.items.pop();
                        popped.remove();
                    }
                    // try again
                    if (retries > 0) {
                        setTimeout(function() {
                            tryToCreateRows((retries - 1));
                        }, 100);
                    }
                }
            }

            try {
                tryToCreateRows(10); // retry 10 times
            } catch (e) {
                console.log('*************Feed', e);
            }
        }).then(function(rowData) {
            return new Promise(function(resolve, reject) {
                revApi.request(self.innerWidget.generateUrl(self.innerWidget.internalOffset, rowData.internalLimit, self.innerWidget.sponsoredOffset, rowData.sponsoredLimit), function(data) {
                    resolve({rowData: rowData, data: data});
                })
            });
        }).then(function(data) {
            var tryToUpdateDisplayedItems = function(retries) {
                try {
                    self.innerWidget.contextual_last_sort = data.contextual_last_sort;
                    var itemTypes = self.innerWidget.updateDisplayedItems(data.rowData.items, data.data);
                    self.viewableItems = self.viewableItems.concat(itemTypes.viewableItems);

                    if (!self.options.infinite) {
                        self.loadMoreText.innerHTML = 'LOAD MORE CONTENT';
                        self.loadMoreContainer.className = 'rev-loadmore-button';
                        revUtils.addEventListener(self.loadMoreContainer, 'click', self.loadMoreListener);
                    }

                    return Promise.resolve(data);
                } catch (e) {
                    if (retries > 0) {
                        setTimeout(function() {
                            tryToUpdateDisplayedItems((retries - 1));
                        }, 100)
                    }
                }
            }

            return tryToUpdateDisplayedItems(10);
        }).catch(function(e) {
            console.log('*************Feed', e);
        });
    };

    Feed.prototype.checkVisible = function() {
        var self = this;
        for (var i = 0; i < this.viewableItems.length; i++) {
            revUtils.checkVisibleItem(this.viewableItems[i], function(viewed, item) {
                if (viewed) {
                    var index = self.viewableItems.indexOf(item);
                    if(index != -1) {
                        self.viewableItems.splice(index, 1);

                        if (!self.viewableItems.length && self.removed) {
                            revUtils.removeEventListener(window, 'scroll', self.visibleListener);
                        }
                        self.registerView([item]);
                    }
                }
            }, self.options.viewable_percentage);
        }
    };

    Feed.prototype.registerView = function(viewed) {

        for (var i = 0; i < viewed.length; i++) {
            viewed[i].anchor.setAttribute('href', viewed[i].anchor.getAttribute('href') + '&viewed=1');
        }

        var view = viewed[0].view;

        if (!view) { // safety first, if the first one doesn't have data none should
            return;
        }

        // params += 'id=' + encodeURIComponent(this.options.id); // debug/test

        var params = 'view=' + view;

        if (this.options.test) { // if test pass empty to view
            params += '&empty=1';
        }

        for (var i = 0; i < viewed.length; i++) {
            params += '&' + encodeURIComponent('p[]') + '=' + viewed[i].viewIndex;
        }

        revApi.request(this.options.host + '/view.php?' + params, function() {

        });
    };

    return Feed;

}));