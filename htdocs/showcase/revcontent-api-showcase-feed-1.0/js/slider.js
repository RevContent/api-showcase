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

    var RevSlider = function(opts) {

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
            columns: {
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
            text_right: false,
            text_right_height: 100,
            transition_duration: 0,
            multipliers: {
                line_height: 0,
                margin: 0,
                padding: 0
            },
            prevent_default_pan: true,
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
            user_ip: false,
            user_agent: false,
            css: '',
            disable_pagination: false,
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
            masonry_layout: false,
            initial_comments_limit_mobile: 1,
            initial_comments_limit: 3,
            user: null,
            jwt: null,
            content: [],
            comments_enabled: false,
            actions_api_url: 'https://api.engage.im/' + opts.env + '/actions/',
            //actions_api_url: 'http://shearn.api.engage.im/actions/',
            contextual_last_sort: []
        };

        // merge options
        this.options = Object.assign(defaults, opts);

        // store options
        revUtils.storeUserOptions(this.options);

        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        var that = this;

        this.emitter = new EvEmitter();

        revDisclose.setEmitter(this.emitter);

        this.emitter.on('dialog_closed', function() {
            that.options.emitter.emitEvent('updateButtonElementInnerIcon');
            that.isAuthenticated(function(response) {
                that.options.emitter.emitEvent('updateButtons', [response]);
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

        // TODO make navbar a component
        this.options.emitter.on('createFeed', function(type, data) {

            if (!that.options.active) {
                return;
            }

            if (!that.historyStack) {
                that.historyStack = [];
            }

            that.removeNotify(); // remove notify if present

            // initial
            var total = that.options.rows * that.grid.perRow;

            // remove any elements beyond initial count
            var removeItems = [];
            var removeCount = 0;
            var updateItems = 0;

            var sponsoredLimit = 0;
            var internalLimit = 0;

            for (var i = 0; i < that.grid.items.length; i++) {
                if (that.grid.items[i].type) {
                    if (removeCount >= total) {
                        removeItems.push(that.grid.items[i]);
                    } else {
                        updateItems++;

                        switch(that.grid.items[i].type) {
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
                var index = that.grid.items.indexOf(removeItems[i]);
                var removed = that.grid.items.splice(index, 1);
                removed[0].remove();
            }

            // add up to initial if its a new gridsky
            if (updateItems < total) {
                var rowData = that.createRows(that.grid, (total - updateItems));
                sponsoredLimit += rowData.sponsoredLimit;
                internalLimit += rowData.internalLimit;
                updateItems += rowData.items.length;
            }

            that.internalOffset = 0;
            that.sponsoredOffset = 0;

            switch (type) {
                case 'author':
                    that.options.feed_type = false;
                    that.options.topic_type = type;
                    that.options.author_name = data.authorName;
                    that.options.topic_id = -1;
                    that.options.topic_title = '';
                    break;
                case 'topic':
                    that.options.feed_type = false;
                    that.options.topic_type = type;
                    that.options.author_name = '';
                    that.options.topic_id = data.topicId;
                    that.options.topic_title = data.topicTitle;
                    break;
                default:
                    that.options.feed_type = false;
                    that.options.topic_type = 'default';
                    that.options.author_name ='';
                    that.options.topic_id = -1;
                    break;
            }


            // History Stack
            if (!data.withoutHistory) {
                that.pushHistory(data);
            }

            // TODO - yikes
            that.options = Object.assign(that.options, that.options);

            if (updateItems > 0) {
                var internalURL = that.generateUrl(0, internalLimit, 0, sponsoredLimit);

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
                        that.options.emitter.emitEvent('removedItems');
                        that.notify('Oh no! This is somewhat embarrassing. We don\'t have content for that ' + revUtils.capitalize(type) + '. Please go back or try a different ' + revUtils.capitalize(type) + '.', {label: 'continue', link: '#'}, 'info', false);
                        if (that.historyStack.length > 0) {
                            that.historyStack.pop();
                            that.navBar();
                        }
                        return;
                    }

                    if (that.removed) { // if feed ended reinit infinite
                        that.removed = false;
                        that.infinite();
                    }

                    that.updateDisplayedItems(that.grid.items, resp);

                    that.navBar();

                });
            }

            setTimeout(function() { // wait a tick ENG-263
                if (that.options.infinite_container) { // scroll to top of container
                    revUtils.scrollTop(that.innerContainerElement, 3000);
                } else {
                    that.containerElement.scrollIntoView({ behavior: 'smooth', block: "start" });
                }
                // allow feed link clicks again
                that.preventFeedLinkClick = false;

                that.navBar();
            });
        });

        this.emitter.on('feedLink', function(type, data) {
            that.handleFeedLink(type, data);
        });

        this.emitter.on('updateInterstsSubscription', function(type, data) {
            that.updateInterstsSubscription(type, data);
        });

        this.data = [];
        this.displayedItems = [];

        this.feedItems = {};

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider2';

        this.innerContainerElement = document.createElement('div');
        this.innerContainerElement.id = 'rev-slider-container';

        this.innerElement = document.createElement('div');
        this.innerElement.id = 'rev-slider-inner';

        this.gridContainerElement = document.createElement('div');
        this.gridContainerElement.id = 'rev-slider-grid-container';

        var gridElement = document.createElement('div');
        gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element : document.getElementById(this.options.id);
        this.element.style.width = '100%';
        this.element.innerHTML="";
        revUtils.append(this.containerElement, this.innerContainerElement);

        revUtils.append(this.innerContainerElement, this.innerElement);

        revUtils.append(this.innerElement, this.gridContainerElement);

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

        this.selected_interests = {};

        this.queue = [];
        this.queueRetries = 0;

        this.internalOffset = 0;
        this.sponsoredOffset = 0;

        this.getData();


        // TODO: get bookmarks and add them to UI and save under this.options.user.bookmarks
        // TODO: add bookmarks count to side menu

        this.dataPromise.then(function(data) {

            that.viewableItems = [];

            for (var i = 0; i < data.rowData.items.length; i++) {
                if (data.rowData.items[i].view) {
                    that.viewableItems.push(data.rowData.items[i]);
                }
            }

            that.viewability().then(function() {
                if (!that.removed) {
                    that.options.infinite ? that.infinite() : that.loadMore();
                }

                if (that.viewed.length) {
                    that.registerView(that.viewed);
                }

                that.visibleListener = revUtils.throttle(that.checkVisible.bind(that), 30);
                revUtils.addEventListener(window, 'scroll', that.visibleListener);
            }, function() {
                console.log('*************Feed', 'something went wrong');
            }).catch(function(e) {
                console.log('*************Feed', e);
            });
        }, function(e) {
            that.destroy();
            console.log('*************Feed', e);
        }).catch(function(e) {
            console.log('*************Feed', e);
        });

        this.options.emitter.on('removedItems', function(items) {
            if (!that.options.active) {
                return;
            }
            that.removed = true;

            revUtils.removeEventListener(window, 'scroll', that.scrollListener);

            if (items) { // TODO make sure these items are in the grid
                for (var i = 0; i < items.length; i++) {
                    var index = that.grid.items.indexOf(items[i]);
                    var removed = that.grid.items.splice(index, 1);
                    removed[0].remove();
                }
            }

            that.grid.layout();
        });

        this.appendElements();
    };

    // TODO make navbar a component
    RevSlider.prototype.navBar = function() {
        if(this.historyStack.length == 0){
            var existingBack = this.containerElement.querySelector('.go-back-bar');
            if (existingBack){
                this.detachBackBar(existingBack, existingBack.querySelector('button'));
            }
            return;
        }

        var activePage = this.historyStack[this.historyStack.length-1];

        if (!this.navBarElement) {
            this.navBarElement = document.createElement('div');
        }

        var existingBack = this.containerElement.querySelector('.go-back-bar');
        var back = existingBack ? existingBack : document.createElement('div');

        this.navBarElement.setAttribute('data-type', activePage.type);
        this.navBarElement.setAttribute('data-author', activePage.author_name.toLowerCase());
        this.navBarElement.setAttribute('data-topic', activePage.topic_id);
        this.navBarElement.setAttribute('data-title', activePage.topic_title);

        //var e_icon = '<span style="margin: 10px 10px 0 10px;width:16px;height:16px;display:block;background: transparent url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACPCAYAAAAVxlL2AAAQWElEQVR4nO2deXRU1R3HP4kBQoAAgogiWFTEilrccGvdrdW6i1WpPWqtdauKtXXXWluL1gUEqx6xHBUttGpFca1blVqWal1xq6Igm0DYAmSBkP7xfUOG4b2Z9+7bZpL7OeedJPOWe2fynbv87u/+fmWMa6aV0R7oDnQDujo/ewE9gR7A5s5r1c7RGagEOjn3dgDaAW4fzHqgAWgE1gD1QC2wClgJLAeWATXOsQhYmnWuBqiL9u2mS0XaFQhBFbC9c/QH+gJ9gK2BrZyjKrXabcw6YCGwwDnmA3OAr4AvgU+R8EqOUhFQFTAAGAIMBnYGtgG2BLqkWC+/VKD6buNyrh61VAuRkN4D3gI+QKIq6i6irEi7sM2BQcBewHeRcNw+/NbMcuAd4F/ANOBD4GuKTFDFJKB+wJHAgcD+wHbpVqfoqAH+7RwvA29TBGJKW0BbAccDQ4E90eDWUpgGYCbwLPBX5/dUSENAlcABwBlIOJ2TrkAroxl4FXgQeAFYkmThSQqoI3AWcA5qbSzRMxcYD4xFs7vYSUJAHYHzgeFonGOJn5XAo8AtyFwQG+UxP/s0NB29EyueJKkGLkAztxvRrDYW4hLQIOAVYAIy9FnSoQvwG+C/wIlxFBCHgC4DpgMHx/BsixnbAn9HA+3uUT44SgF1QZW8E60rWYqPM4GpwHeiemBUAhoIvEFMzaQlUgYCrwOnRvGwKAS0OxrvDI7gWZZk6ApMRCaVUIQV0A7IGtonbEUsqfAA6taMCSOg/sBTaDnCUrqMA35kerOpgHqiNZidTQu2FA3lwEPI68HoZhPuB/Y2vNdSfFQCDyNnvECYCOh67GyrNdIfuBcoC3JTUAEdjCybltbJccCVQW4IIqAyYASwWZACLCXH1cg044sgAroC2DdwdSylRjXwO78X+xXQ9miNy9I2+CE+x7l+BfRztAPC0na4Cs3O8uJHQAOAi0NXx1JqDMGHgdGPgH6BvAotbY+CDUchAW0JnBBNXSwlyF4UWLUvJKCzsK6obZ2h+U7mE1B74Nho62IpQU4G9vA6mU9ABziHpW1TBhzudTKfgI6Pvi6WEuVsPNyUvQTUlQJ9n6VNsSOwm9sJLwEdgPUytLRQDgzzOuHGKfHVxVKifM/tRS8B2b3rllx2BPbLfdFNQAeirR8WSzYdgYNyX3QT0P7IBmSx5LKJn5CbgOz+LosX+5ETajBXQL2xzvIWb/oi3+kN5ApoO2xsQkt+NtpXnysgO3i2FGIjt+ZcAdnuy1KIIWQta2QLqD3y/7BY8tGXLPfmbAFVI2ORxZKPSrLWxbIFNBAbctfij10zv2QLaBB206DFH64CsjMwi182uDlnZ+vZKYWK+KUZmAV8gTLbrEA5uzqi9Ahbo/r3SquCPlmAMvIsQO+hDuUnq0YD0wHAt9KqXAB6omCdy7IFVGwffg1KKvIMSn+UEU6Ty7XtkZD6ojg3xzo/OyRSU29Wo2w7k1GSlLkoC89al2s3Q458vdFs+FjgMCKOqhoRPVHk12WZSPU9gRnkmKlT4l3gz8BfULY/UwYA5wKnk3yqqNnAI+h9hEk50BOFoDuTrHFHkXAcMDkzBtqGGKOZ++Rz9EHtA9xNOPEA/A8FhBiMggU0hHyeH1agLcG7A9cRPl/FEuAOtCviTGBeyOdFSV9oGURvjZrPtLgPfUgPo7FNlNQAN6B/6tSIn53NS+g93Er06SvXoc9mVxSOrhjoDS0C6p1SJZYjX9sLUPLaOPkYOAJ4OuLnNqOgW99HA/04WYY2e56Fxldp0gtaBJRG5I15aJA4IcEyVwMnoRYvCtajL8BNET3PLw+hvVphu/kwbAktAuqRcOHzgaNQEpCkaUIt3i0hn9OIBugTQ9fIjGnoM0xrXLQFUFme9UdSrEAb9j9IsEw3rgauMbx3LWp5/hZddYyYgUScRi76HkCXjICStDWch2wjxcAIgsc+akabLp+IvjpGTEEtatJsEFAHkhPQfShAeTFxN7IX+aEBJdGLeiAelodQ2oIk6QZ0qkDOQUlkS/4SuDbE/duizW07oQFcBVCPrLvvoTGBacLZB4B2wD15rqkjvHh6ol2/uyLbWwfUHX6DMi+/iXLDm3A98AOSM5q2wxFQFVqLiZvfYjZr2AP4Ncopn6+lnIO6lT8CCwOW0Rk4JM/5tSjQ1j8CPjdDHzTmOpH80eBrnDJGEHyMuBD4PdHNMP1QVY4chLrEXNBbmI0ZbgT+g775hbrZfiiS7Pt47OP2oAMaDHtt565FMXJMxfMTlLv0IgqnEuiBBsVvYzbAn4Ba46TokhFQ3I5kY4FVAa6vAh5HBrqg0fS3QBmLb/ZxbTXKsniUx/k1SDyTA9Yhwx+QBTnoEKEdqv9jBMv+uNK5JymqM4PodjEWMo9g395ytJB6cshyrwFG5TnfCZgEHO1xvhEZHV8yLH8U6rbCMBQJMAgPojFVEmwQUJxMAb4KcP0NRBfc6lK0GJlLFfqmeo17apF4XjQs93an7Cg4CS3Q+mUe8E5EZReispx4Wx+QH4xfMqvYUfJLYHTW3366rRNRJkYTbgMuN7zXi2uBbwe4/pmIy/eiqpx4AynUoqmpXy4lHr/si9GYohIN5o/0uK4eiecVw3LuAn6V5/x6gwM0Rh0eoB5BPvMwVFYQr4BqkH3DD72BY2Ksy3A0I+rrcT5j5zGdbd0OXOJxbjVwIbJVVRMsJ1czct0N4q2wEI2D4l4kr6wg3i7sG/w7ch1KvIu6Vc7hRiMK62/a9N+Buko3mpxnP2f4bBOWI4e6uAVUlpnGx8XcANd6xiKOmSY02zEVzyi8xVOHZpNJigfUFQc1pppQWY6ayLhYEeDaNJz661DrYGrnuQPv2VY96hKfMnx2WOJ20AOoqCh8TSjWBbg27tlgLo2odXje8P6ReA9sm9DSh6kZIAqidg12o7mcgElWAxIky8+a2GqxKY2o2zIVzxi8xZOxXqcpHvAe70VKOe77rKIiiJvI7NhqsTF1yKHNtNu6E6XAcqPeeXZa3VaGcpLZZdOYcYmIiyCZfqaiLi/ObrUBWXZfMLx/FN5jnkbkTvG64bOjpBMGOeANWFtBi7EqDnqgb4IfN44pyBcmrs2NjWjF3VQ8Y/BueRYjf5wzkD2ohniHBvlYhwQ0KImyKojXn7YXWp7wY9mtR45dflbRg1KHXDzi6LbqkIHyRfRl/JlhGaVIfTnBZkpBaYcCl/tlLAqgECUNaHlikuH9o/HOWN3kPDszYB7r/B2naaSYaCgn/i2/QwJcuxjv5QATGlC3ZTojuhtvp/tVbCyeDJPQFD6NnRJJs7oc90gRUXI42u/ul+fQnvaw1KKpumm3NRJ5EbpRyAD5tHM+CVtMmqzJzMLqiW9JowIlsp8e4J7b0D9pJGazsqXIXWOGwb2glsdLPBkjYaFF12eQX9N45EwflFrkzLYWf16ZTc5xGMltVV9Vxrjm/uifG+fmwqVoJ8L8gPdlInUEiR47EbgSOdmbcA/e+6xqkc9yEF+hbdEg/KQA97yBzAXvBrgHYBe05y6pQBlHl6PWJ+51k83xXnDMx3QU2HoY+qe5CXAdCg3zKBqwn465eEaSf5PeqQR3NJuNLNOHIqf3L3A3ncxDrdYpwMEEFw9of1uSUVZWlzGuuSvwGi6ZWCJmDRoPhQmxshWyb/RAjmeNSFQzCbZw68afkM9OPm4hvJ9zNUoX0BvNUpvQfraZhFtBPwxFdEuSvSuQs9PyBAqrQk35QZgPLhc4R9Tk67ayuQptgfKyCflhJTKaRkk1+myTpA5nFraO5MKE7IsstcXEKILtLb8ItVbFxEg8kuLGyFIcAYFM70lxMdppWgzci9nuiQuB+yOuiynXAz9NodylQG0aAgJtPz4/4TJzuS9kHc4l/176JLiM5INbZVhCigICfftN4/OEoRrNhs6L4FkXoNlfGilCbyL5cU82i4B1GQEl4T/rxs3I0JZUeJmByMZyWoTPHAa8isIKJ0F3tCny+oTK8+IbaLFwzifeRdV8nIECKHjt1YqCCjTWmUZOxr2IOAC9h0JmgLCcgMICDo25HD9sIqAkpvJebI/8dJ4k2LpZIcpQxPepaLYVZxykrmh2NhXtt4/SMW4I8nJ8kuJJhTAfIBOpvgopuxgSrjQgw+YE9KGZGAj7IavxaaS3XWg6WlZ5ArOgUd3RWtowZCQMGqUkTtajHuPljIBAe9j3S61K7ixC3c4UZNqfgwyfjciCW0FLspIdkFgOdn4WS+6zlSjYwWso7s8stHTUgBZKM++hExL+YGRs3QezRdgkWIxykXyWLaCJ6Ftb7CxzjrXIg6A7yURYi5JaNPOto+U9JBFmMCo+Qktfjdn99CcpVSYo3SnODDZB6EL8UeHiZBHOclR2v/ppOnWxlCAb3I6zBfQ+rd+DzhINGwKAZgvoa9KxSFtKi/VkBfLMFlAtaoUslnysQYNoYGMBNZNO8hNLafERWUbnXOPUW8nWxVKCTCNrrJwroFm0nU1xFjM22umSK6DPkbXUYvHis+w/cgW0CtuNWbx5lxx7odsCXZK5FiylxXS0trcBNwH9E2sPsrizSQR8NwF9Qk4/Z7EgB7JNtnN7+Zi8Fm9dLCXIJyhp4EZ4Cehx4o2daCk9XGNdewnoY8z2ZltaJ40oQc0meAmoHuXsslhAE6tZbify+dm+iu3GLOIRPIKx5hPQu2gsZGnbzEUtkCuFPP1Nw8NZWg9PkmdXSSEBPYq1TLdlaimQs9XPXqNiiUJhSZ4XKLA26kdA49EqvaXtkS/rNeBPQLXAreHrYikxxuMjYbLf7bKPEC62oaW0qMdnJDm/AqoHRhhXx1JqjMbnBosgG/Yno1wQltbNTAJEPQsa8eFqtE5mab1cgQJY+CKogGqINhmKpbi4mYAZpk1izryMWWRTS3EzCbgu6E2mQYtGA3cZ3mspPqYC55jcGCbq1XAURcxS2ryPUlMZBZsPGzbtLOyCaykzB8WQnGv6gLACakRxCB8L+RxL8nyCskybZjYCogncuAY1gWMieJYlGV4HDiECk0yUkT8vAc6mbeQKLWXGoAirkQSXjzp07IPA3igavKW4mIsClV9ChImW44g9PBNl57uc5NJIWfLzAIrQ/1TUD44reHUTSgSym/Mz7tTiFneeRflmzyWmL3Pc0c/noZZoN/QtiDs3q0U5T14BjgCOIeZwPdmBxpOgH8rRdSqwXZIFtwGWoy5qLPBmUoUmLaAM3dA46ccoMUlcOevbAlOR9+CzhLTpmJCWgLLpg5KKnADsiVKEW7zJREl9Hu3b+4AUwxIWg4Cy2QYZuPZHiV8GEW3apFJlNmpppiFviJnpVqeFYhNQNp1RFsBdUL6sfZCgqtKsVAKsQ6kEZqAkdu+gsHKL06yUF8UsoFw2Q+mPBqFMMYOAHYFewBaUVrYbUFe02DlmoVblfeeYS4mknSglAXnREWU87Ie6wD7AVkhYvZDoepJ8hp/VKLPxEiSSb9DywXy0VfhrJJySNra2hvFFHfChc+TSAaWi7IK6xE7O791QjrFq57UqJMT2zj0d2HRgWoZylDU6xxq0W6UWRbetRVPplUg8mddWOr+3Sv4PX59FINlU9ZAAAAAASUVORK5CYII=) top left no-repeat;background-size:contain"></span>';
        var e_icon = '';
        var back_icon = '<span style="margin:0 auto;width:16px;height:16px;display:block;cursor:pointer;background: transparent url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNTEyLjA1NiA1MTIuMDU2IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIuMDU2IDUxMi4wNTY7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgY2xhc3M9IiI+PGc+PGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNDM0LjE2LDI0NC4yMjVjLTUxLjk2OC01My44NjctMTI2LjIyOS04Mi4xNTUtMjIwLjg0My04NC4wOTZWNjQuMDIyYzAtNC4zMDktMi42MDMtOC4yMTMtNi41OTItOS44NTYgICAgYy0zLjk4OS0xLjYyMS04LjU1NS0wLjc0Ny0xMS42MDUsMi4zMDRsLTE5MiwxOTJjLTQuMTYsNC4xNi00LjE2LDEwLjkyMywwLDE1LjA4M2wxOTIsMTkyYzMuMDUxLDMuMDcyLDcuNjU5LDMuOTg5LDExLjYyNywyLjMwNCAgICBjMy45ODktMS42NDMsNi41OTItNS41NDcsNi41OTItOS44NTZ2LTk1LjkxNWMyMTQuMzM2LDMuMTE1LDI3OC4zMTUsMTAwLjU2NSwyNzguOTMzLDEwMS41MjVjMS45ODQsMy4yLDUuNDQsNS4wNTYsOS4wNjcsNS4wNTYgICAgYzAuODk2LDAsMS44MTMtMC4xMjgsMi43MzEtMC4zNjNjNC41NDQtMS4yMTYsNy43NjUtNS4yMjcsNy45MzYtOS45NDFDNTEyLjE1NSw0NDMuNTQyLDUxNS4zMzMsMzI4LjM4NSw0MzQuMTYsMjQ0LjIyNXoiIGRhdGEtb3JpZ2luYWw9IiMwMDAwMDAiIGNsYXNzPSJhY3RpdmUtcGF0aCIgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgZGF0YS1vbGRfY29sb3I9IiNmZmZmZmYiPjwvcGF0aD4KCTwvZz4KPC9nPjwvZz4gPC9zdmc+) top left no-repeat;background-size:contain;">&nbsp;</span>';
        //var menu_icon = '<span style="margin: 9px 9px 0 9px;width:18px;height:18px;display:block;background:transparent url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAiIHkxPSIyNTgiIHgyPSI1MTIiIHkyPSIyNTgiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgLTEgMCA1MTQpIj4KCTxzdG9wIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwRjJGRSIvPgoJPHN0b3Agb2Zmc2V0PSIwLjAyMSIgc3R5bGU9InN0b3AtY29sb3I6IzAzRUZGRSIvPgoJPHN0b3Agb2Zmc2V0PSIwLjI5MyIgc3R5bGU9InN0b3AtY29sb3I6IzI0RDJGRSIvPgoJPHN0b3Agb2Zmc2V0PSIwLjU1NCIgc3R5bGU9InN0b3AtY29sb3I6IzNDQkRGRSIvPgoJPHN0b3Agb2Zmc2V0PSIwLjc5NiIgc3R5bGU9InN0b3AtY29sb3I6IzRBQjBGRSIvPgoJPHN0b3Agb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojNEZBQ0ZFIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIHN0eWxlPSJmaWxsOnVybCgjU1ZHSURfMV8pOyIgZD0iTTQzOCwxNDhINzRjLTQwLjgwNCwwLTc0LTMzLjE5Ni03NC03NFMzMy4xOTYsMCw3NCwwaDM2NGM0MC44MDQsMCw3NCwzMy4xOTYsNzQsNzQgIFM0NzguODA0LDE0OCw0MzgsMTQ4eiBNNzQsNDBjLTE4Ljc0OCwwLTM0LDE1LjI1Mi0zNCwzNHMxNS4yNTIsMzQsMzQsMzRoMzY0YzE4Ljc0OCwwLDM0LTE1LjI1MiwzNC0zNHMtMTUuMjUyLTM0LTM0LTM0SDc0eiAgIE00MzgsMzMwSDc0Yy00MC44MDQsMC03NC0zMy4xOTYtNzQtNzRzMzMuMTk2LTc0LDc0LTc0aDM2NGM0MC44MDQsMCw3NCwzMy4xOTYsNzQsNzRTNDc4LjgwNCwzMzAsNDM4LDMzMHogTTc0LDIyMiAgYy0xOC43NDgsMC0zNCwxNS4yNTItMzQsMzRzMTUuMjUyLDM0LDM0LDM0aDM2NGMxOC43NDgsMCwzNC0xNS4yNTIsMzQtMzRzLTE1LjI1Mi0zNC0zNC0zNEg3NHogTTUxMiw0MzhjMC00MC44MDQtMzMuMTk2LTc0LTc0LTc0ICBINzRjLTQwLjgwNCwwLTc0LDMzLjE5Ni03NCw3NHMzMy4xOTYsNzQsNzQsNzRoMjY0YzExLjA0NiwwLDIwLTguOTU0LDIwLTIwcy04Ljk1NC0yMC0yMC0yMEg3NGMtMTguNzQ4LDAtMzQtMTUuMjUyLTM0LTM0ICBzMTUuMjUyLTM0LDM0LTM0aDM2NGMxOC43NDgsMCwzNCwxNS4yNTIsMzQsMzRzLTE1LjI1MiwzNC0zNCwzNGMtMTEuMDQ2LDAtMjAsOC45NTQtMjAsMjBzOC45NTQsMjAsMjAsMjAgIEM0NzguODA0LDUxMiw1MTIsNDc4LjgwNCw1MTIsNDM4eiIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K) top left no-repeat;background-size:contain"></span>';
        var menu_icon = '';

        var grid_rect = this.containerElement.getBoundingClientRect();
        var left_pos = grid_rect.left || 'auto';
        var top_pos = grid_rect.top || 0;
        //top_pos = 0; // TODO
        var grid_width = this.containerElement.clientWidth > 0 ?  this.containerElement.clientWidth  + 'px' : '100%';

        // TODO look into if this is needed always, top offset in general with videos and fixed navbars
        if (!this.options.infinite_container) {
            this.containerElement.style.paddingTop = '48px';
        }

        this.navBarElement.style.left = left_pos;
        this.navBarElement.style.top = top_pos;
        this.navBarElement.style.width = grid_width;

        this.navBarElement.setAttribute('id','go-back-bar');
        this.navBarElement.classList.add('go-back-bar');

        var header_logo = activePage.iconHtml;

        var title = "";

        if (activePage.type == "topic") {
            title = activePage.topic_title;
        } else if (activePage.type == "author" && activePage.author_name) {
            title = "Articles by " + activePage.author_name;
        }

        this.navBarElement.innerHTML = '<div class="feed-header">' +
            '<div class="feed-header-back"><button style="background-color:#444444;border:0;margin:0;border-right:1.0px solid #484848;display:block;width:40px;height:40px;text-align:center;font-weight: bold;font-size:32px" class="feed-back-button" name="feed-back-button" value="">' + back_icon + '</button></div>' +
            '<div class="feed-header-logo">' + header_logo + '</div>' +
            '<div class="feed-header-title" style="white-space:nowrap;padding-left:18px;text-overflow:ellipsis;overflow:hidden;text-align-center;color:#ffffff;font-size:14px;letter-spacing: 0;font-weight:normal;"><span>' + title + '</span></div>' +
            '<div class="feed-header-options" style="min-width:auto;text-align:center;">' + e_icon + '</div>' +
            '</div>';

        this.head.insertAdjacentElement('afterend', this.navBarElement);

        if (!existingBack) {
            var that = this;

            if (!that.options.infinite_container) { // don't scroll for infinite container
                this.scrollListenerNavbar = revUtils.throttle(this.navbarScrollListener.bind(this, this.navBarElement), 60);

                revUtils.addEventListener(window, 'scroll', this.scrollListenerNavbar);
            }

            revUtils.addEventListener(window, 'resize', function(){
                var grid_rect = that.containerElement.getBoundingClientRect();
                this.navBarElement.style.width = grid_rect.width + 'px';
            });
        }

        var backButton = this.navBarElement.querySelector('.feed-back-button');
        // TODO fix this
        revUtils.addEventListener(backButton, revDetect.mobile() ? 'touchstart' : 'click', this.loadFromHistory.bind(this, this.navBarElement, backButton));
    };

    RevSlider.prototype.navbarScrollListener = function(back){
        var grid_rect = this.containerElement.getBoundingClientRect();

        if(grid_rect.top <= 0) {
            var fix_ts = 0;
            clearTimeout(fix_ts);
            var that = this;
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

            var notice = this.element.querySelector('div#rev-notify-panel');

            if (notice) {
                notice.style.top = 0;
                notice.style.position = 'static';
                notice.style.width = '100%';
                notice.style.marginBottom = '9px';
                back.style.marginBottom = 0;
            } else {
                back.style.marginBottom = '9px';
            }
        }
    };

    RevSlider.prototype.pushHistory = function(data){

        if (this.options.topic_type == "author") {
            if(this.historyStack.length > 0){
                if (this.options.author_name.toLowerCase() == this.historyStack[this.historyStack.length-1].author_name.toLowerCase()) {
                    return;
                }
            }
        }

        if (this.options.topic_type == "topic" && this.options.topic_id !== -1){
            if(this.historyStack.length > 0){
                if (this.options.topic_id == this.historyStack[this.historyStack.length-1].topic_id) {
                    return;
                }
            }
        }

        this.historyStack.push({
            type: this.options.topic_type,
            author_name:this.options.author_name,
            topic_id:this.options.topic_id,
            topic_title:this.options.topic_title,
            iconHtml: data.iconHtml
        });
    };

    RevSlider.prototype.loadFromHistory = function(backBar, backButton) {
        //alert("here!");
        var that = this;
        if(this.element.classList.contains('is-loading') || this.historyStack.length == 0) {
            return;
        }
        this.element.classList.add('is-loading');
        this.element.style.pointerEvents = 'none';
        this.element.style.transition = 'all 0.8s';
        this.element.style.opacity = 0.7;
        if (this.historyStack.length > 1) {
            var item = this.historyStack.pop();
            if(this.historyStack.length == 0){
                this.clearHistory(backBar, backButton);
            } else {
                item = this.historyStack.pop();
            }
            if (item.type == "topic" && !isNaN(item.topic_id)) {
                this.loadTopicFeed(item.topic_id, item.topic_title, item.iconHtml, false);
            }
            else if (item.type == "author" && item.author_name.length > 0) {
                this.loadAuthorFeed(item.author_name, item.iconHtml, false);
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

    RevSlider.prototype.clearHistory = function(backBar, backButton) {
        this.detachBackBar(backBar, backButton);
        this.historyStack = [];
    };

    RevSlider.prototype.detachBackBar = function(backBar, backButton) {

        revUtils.removeEventListener(window, 'scroll', this.scrollListenerNavbar);

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

    RevSlider.prototype.infinite = function() {
        var self = this;

        if (this.options.infinite_container) {
            this.innerContainerElement.style.paddingBottom = self.innerContainerElement.getBoundingClientRect().top + 'px';
        }

        this.scrollTop = this.options.infinite_container ? self.innerContainerElement.scrollTop : (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);

        this.infiniteElement = this.options.infinite_container ? this.innerContainerElement : window;

        var scrollFunction = function() {
            if (!self.options.active) {
                return;
            }
            if (self.options.infinite_container) {
                var scrollTop = self.innerContainerElement.scrollTop;// || document.documentElement.scrollTop || document.body.scrollTop;
                var height = self.grid.element.offsetHeight;
                var top = self.grid.element.getBoundingClientRect().top;
                var bottom = self.grid.element.getBoundingClientRect().bottom;
                var offsetTop = self.innerContainerElement.getBoundingClientRect().top;
            } else {
                var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
                var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                var height = self.element.offsetHeight;
                var top = self.grid.element.getBoundingClientRect().top;
                var bottom = self.grid.element.getBoundingClientRect().bottom;
            }

            if (self.removed) {
                revUtils.removeEventListener(self.infiniteElement, 'scroll', self.scrollListener);
                return;
            }

            var check = false;
            if (self.options.infinite_container) {
                check = (scrollTop >= self.scrollTop && bottom > 0 && (self.options.buffer >= (top + height - self.element.offsetHeight - offsetTop)));
            } else {
                check = (scrollTop >= self.scrollTop && bottom > 0 && (scrollTop + windowHeight) >= (top + scrollTop + height - self.options.buffer));
            }

            if (check) {
                revUtils.removeEventListener(self.options.infinite_container ? self.innerContainerElement : window, 'scroll', self.scrollListener);

                var promise = new Promise(function(resolve, reject) {

                    var tryToCreateRows = function(retries) {
                        try {
                            var beforeItemCount = self.grid.items.length;

                            var rowData = self.createRows(self.grid, self.options.rows);

                            // if (self.testRetry > 0 && retries != 3) { // TEST
                            //     throw new Error('Whoops!');
                            // }

                            setTimeout( function() {
                                if (!self.removed) {
                                    revUtils.addEventListener(self.infiniteElement, 'scroll', self.scrollListener);
                                }
                            }, 150); // give it a rest before going back

                            resolve(rowData);
                        } catch (e) { // remove items and try again
                            // remove items TODO: wrap this in try
                            var remove = self.grid.items.length - beforeItemCount;
                            for (var i = 0; i < remove; i++) {
                                var popped = self.grid.items.pop();
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
                        revApi.request(self.generateUrl(self.internalOffset, rowData.internalLimit, self.sponsoredOffset, rowData.sponsoredLimit), function(data) {
                            resolve({rowData: rowData, data: data});
                        })
                    });
                }).then(function(data) {
                    var tryToUpdateDisplayedItems = function(retries) {
                        try {
                            var itemTypes = self.updateDisplayedItems(data.rowData.items, data.data);
                            // self.viewableItems = self.viewableItems.concat(itemTypes.viewableItems); // TODO

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
                // self.testRetry++;
            }

            self.scrollTop = scrollTop;
        }

        this.scrollListener = revUtils.throttle(scrollFunction, 60);

        revUtils.addEventListener(self.infiniteElement, 'scroll', this.scrollListener);

        this.options.emitter.on('removeScrollListener', function(items) {
            revUtils.removeEventListener(self.infiniteElement, 'scroll', this.scrollListener);
        });

        this.options.emitter.on('addScrollListener', function(items) {
            revUtils.addEventListener(self.infiniteElement, 'scroll', this.scrollListener);
        });
    };

    RevSlider.prototype.personalize = function() {
        var that = this;

        var personalize = function(data) {
            var starttime = new Date().getTime();
            that.personalized = true;

            that.interestsCarouselItem.carousel.update(data.data, that.options.authenticated);

            // TODO
            // that.updateVideoItems(that.mockVideosAuthenticated);

            var internalPersonalizedCount = 0;
            for (var i = 0; i < that.grid.items.length; i++) {
                if (that.grid.items[i].type === 'internal') {
                    internalPersonalizedCount++;
                }
            }

            if (internalPersonalizedCount) {

                var internalURL = that.generateUrl(0, internalPersonalizedCount, 0, 0);

                revApi.request(internalURL, function(resp) {
                    data.totaltime = ((new Date().getTime() - starttime) + data.totaltime);

                    var finishPersonalize = function() {
                        that.updateDisplayedItems(that.grid.items, resp, true);
                        that.closePersonalizedTransition();
                    }

                    var mintime = 7000; // show for a minimum of 7s
                    if (data.totaltime > mintime) {
                        finishPersonalize();
                    } else {
                        setTimeout(function() {
                            finishPersonalize();
                        }, mintime - data.totaltime)
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

                    revApi.xhr(that.options.actions_api_url + 'user/profile', function(data) {

                        //data.interests
                        if (!data.hasOwnProperty('interests')) { // test with && totaltime < 1200
                            setTimeout(function() {
                                request();
                            }, 2000);
                        } else {
                            resolve({
                                totaltime: totaltime,
                                data: data.interests
                            });
                        }
                    },null, true);
                }
                request();
            });
        };

        requestInterests(new Date().getTime()).then(function(data) {
            personalize(data);
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

        if (revDetect.mobile()) {
            revUtils.addClass(this.containerElement, 'rev-slider-mobile');
        }

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

    RevSlider.prototype.milliFormatter = function(value) {
        return value > 999 ? (value/1000).toFixed(1) + 'k' : value
    }

    RevSlider.prototype.createRows = function(grid, total) {
        var limit = 0;
        var internalLimit = 0;
        var sponsoredLimit = 0;

        var total = total ? total : this.options.rows * grid.perRow;

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

        if (this.options.comments_enabled) {
            var comment_b64 = '<a class="rev-reaction rev-reaction-comment"><div class="rev-reaction-icon rev-reaction-icon-comment"></div></a>';
        } else {
            var comment_b64 = '<a href="#' + (this.options.comment_div ? this.options.comment_div : this.options.feed_id) + '" class="rev-reaction rev-reaction-comment"><div class="rev-reaction-icon rev-reaction-icon-comment"></div></a>';
        }

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
                layoutItems = layoutItems.concat(this.appendInterestsCarousel(grid,this.options.authenticated));
                i--;
                continue;
            }

            if (!this.options.authenticated && i == 1 && !this.feedAuthButtonVisible) {
                this.feedAuthButtonVisible = true;
                var feedAuthButton = this.appendfeedAuthButton(grid);
                layoutItems = layoutItems.concat(feedAuthButton);
                i--;
                continue;
            }

            var element = this.createNewCell();

            grid.element.appendChild(element);

            var added = grid.addItems([element]);

            added[0].reactions = true; // everything has reactions
            added[0].handlers = [];

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
    };

    RevSlider.prototype.appendfeedAuthButton = function(grid) {
        this.feedAuthButton = document.createElement('div');
        this.feedAuthButton.className = 'rev-content';
        // TODO: remove background: none hack. Only way to get button shadow to show
        this.feedAuthButton.innerHTML = '<div class="rev-content-inner feed-auth-button-size-remove-me" style="background: none; height:' + (this.options.auth_height > 0 ? (this.options.auth_height + 'px') : 'auto') + ';"><div class="rev-auth-mask"></div><div class="rev-auth">' +
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

                    if(likeReactionElement.getAttribute('data-active')) {
                        that.removeReaction(likeReactionElement);
                        that.reactionCount(item, likeReactionElement.getAttribute('data-active'), false);
                    }

                    that.addReaction(likeReactionElement, item, iconName);

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

                    //that.transitionLogin(item, 'reaction');
                    var rc_inner = item.element.querySelector('.rev-content-inner');
                    that.tryAuth(rc_inner, 'reaction');

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

                    that.removeReaction(likeReactionElement);
                    that.reactionCount(item, iconName, false);

                    // var count = item.element.querySelector('.rev-reaction-count');
                    // count.innerHTML = count.innerHTML.split(' ')[2];
                } else {
                    that.addReaction(likeReactionElement, item, iconName);
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

                //that.transitionLogin(item, 'reaction');
                var rc_inner = item.element.querySelector('.rev-content-inner');
                    that.tryAuth(rc_inner, 'reaction');
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
                    that.removeReaction(likeReactionElement);

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

                    that.addReaction(likeReactionElement, item, iconName);

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

                //that.transitionLogin(item, 'reaction');
                var rc_inner = item.element.querySelector('.rev-content-inner');
                    that.tryAuth(rc_inner, 'reaction');

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

                    if(likeReactionElement.getAttribute('data-active')) {
                        that.removeReaction(likeReactionElement);
                        that.reactionCount(item, likeReactionElement.getAttribute('data-active'), false);
                    }

                    that.addReaction(likeReactionElement, item, iconName);

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

                    //that.transitionLogin(item, 'reaction');
                    var rc_inner = item.element.querySelector('.rev-content-inner');
                    that.tryAuth(rc_inner, 'reaction');

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

            if (!that.options.authenticated) {
                //old flip logic
                // revUtils.removeClass(document.querySelector('.rev-flipped'), 'rev-flipped');
                // revUtils.addClass(item.element, 'rev-flipped');
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
                e.preventDefault();
                if (revUtils.hasClass(bookmark, 'rev-save-active')) {
                    revUtils.removeClass(bookmark, 'rev-save-active');

                    var options = {
                        method: 'DELETE'
                    }
                    if (that.options.authenticated) {
                        revApi.xhr(that.options.actions_api_url + 'bookmark/remove/' + item.element.getAttribute('data-id'), function(data) {
                            that.options.emitter.emitEvent('removeBookmark', [item.element]);
                        }, null, true, options);
                        // revApi.request(url, function(data) {
                        //     return;
                        // });
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

                    var url = that.options.actions_api_url + 'bookmark/add';
                    var opts = {};
                    var bm = {
                        title: item.data.headline,
                        url: item.data.target_url
                    }
                    opts.data = JSON.stringify(bm);
                    opts.method = "POST";
                    if (that.options.jwt) {
                        opts.jwt = that.options.jwt;
                    }

                    if (that.options.authenticated) {
                        revApi.xhr(url, function (bm) {
                            item.element.setAttribute('data-id', bm.id);
                            that.options.emitter.emitEvent('addBookmark', [bm]);
                        }, null, true, opts);
                    } else {
                        //TODO: Fix bookmark/reactions ENG-363
                        that.transitionLogin(item, 'bookmark');
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
        save.innerHTML = '<a href="#"><?xml version="1.0" ?><svg contentScriptType="text/ecmascript" contentStyleType="text/css" preserveAspectRatio="xMidYMid meet" version="1.0" viewBox="0 0 60.000000 60.000000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" zoomAndPan="magnify"><g><polygon fill="none" points="51.0,59.0 29.564941,45.130005 9.0,59.0 9.0,1.0 51.0,1.0" stroke="#231F20" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2"/></g></svg></a>';

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
            heightElement: this.options.height_element,
            heightElementMeasure: this.options.height_element_measure,
            isInitLayout: false,
            perRow: this.options.columns,
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

        this.head = false;

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
        if (that.options.authenticated) {
            callback.call(this, that.options.authenticated);
        } else {
            revApi.xhr(that.options.actions_api_url + 'user/profile', function(data) {
                //todo check for errors before setting this
                that.options.authenticated = true;

                that.options.user = data;
                if (data.picture === "") {
                    that.options.user.profile_url = that.options.default_avatar_url;
                    that.options.user.picture = that.options.default_avatar_url;
                }

                if (data.picture.indexOf("gravatar") !== -1) {
                    data.picture = data.picture + '?d=' + that.options.default_avatar_url;
                }


                callback.call(that, true);
                //localStorage.setItem('engage_jwt',data.token);
        },function(data){
            //error
            callback.call(that, -1);
        },true);

        }

    };

    // Don't dupe this svg
    RevSlider.prototype.revAuthButtonIconHtml = function() {
        return '<div class="rev-auth-button-icon">' +
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 155.139 155.139" style="enable-background:new 0 0 155.139 155.139;" xml:space="preserve" class=""><g><g> <path id="f_1_" d="M89.584,155.139V84.378h23.742l3.562-27.585H89.584V39.184   c0-7.984,2.208-13.425,13.67-13.425l14.595-0.006V1.08C115.325,0.752,106.661,0,96.577,0C75.52,0,61.104,12.853,61.104,36.452   v20.341H37.29v27.585h23.814v70.761H89.584z" data-original="#000000" class="active-path" data-old_color="#ffffff" fill="#ffffff"/> </g></g> </svg>' +
        '</div>';
    };

    RevSlider.prototype.createNewCell = function() {
        var that = this;
        //old flip logic
        var html = '<div class="rev-content-inner">' +
            '<div class="rev-flip">' +

                '<div class="rev-flip-front">' +
                    '<div class="rev-ad">' +
                        '<div class="rev-ad-container">' +
                            '<div class="rev-ad-outer">' +
                                '<a href="">' +
                                    '<div class="rev-ad-inner">' +
                                        '<div class="rev-before-image">' +
                                            '<div class="rev-meta">' +
                                                '<div class="rev-meta-inner">' +
                                                    '<div class="rev-feed-link" data-type="author">' +
                                                        '<div class="rev-headline-icon-container" style="cursor:pointer"><div class="rev-headline-icon"></div></div>' +
                                                        '<div class="rev-provider-date-container" style="cursor:pointer">' +
                                                            '<div class="rev-provider"></div>' +
                                                            '<div class="rev-date"></div>' +
                                                        '</div>' +
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

                //'<div class="rev-flip-back">' +
                    //'<div class="rev-auth-mask"></div>' +
                    //'<div class="rev-auth">' +
                        // '<a class="rev-auth-close-button">' +
                        //     '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>' +
                        // '</a>' +
                        //'<div class="rev-auth-box">' +

                            //'<div class="rev-auth-box-inner">' +
                                //'<div class="rev-auth-subline">'+ this.getDisclosure() +'</div>' +
                                // '<div class="rev-auth-headline">' +
                                //     (this.options.authenticated ? 'Currently logged in!' : '<span class="rev-engage-type-txt">Almost Done! Login to save your reaction</span> <br /> <strong>and</strong> personalize your experience') +
                                // '</div>' +
                                // '<div class="rev-auth-button">' +
                                //     this.revAuthButtonIconHtml() +
                                //     '<div class="rev-auth-button-text">' +
                                //         (this.options.authenticated ? 'Log out' : 'Continue with facebook') +
                                //     '</div>' +
                                // '</div>' +

                                //'<div class="rev-auth-buttonline">Once personalized the content recommendations on this page will be based on the pages you\'ve liked and urls you\'ve shared on Facebook</div>' +

                                // '<div class="rev-auth-terms">' +
                                //     '<span>by signing up you agree to the <a target="_blank" href="//www.engage.im/privacy.html">Terms</a></span>' +
                                //     // '<span>|</span>' +
                                //     // '<a href="#">Privacy Policy</a>' +
                                // '</div>' +
                            //'</div>' +
                        //'</div>' +
                    //'</div>' +
                //'</div>' + // end back

            '</div>' +

            '<div class="rev-reactions">' +
                '<div class="rev-reaction-bar"></div>' +
            '</div>' +

            '<div class="rev-reactions-total">' +
                '<div class="rev-comment-count"></div>' +
                '<div class="rev-reactions-total-inner">' +
            '</div>' +

        '</div>';

        var cell = document.createElement('article');
        cell.className = 'rev-content';
        cell.innerHTML = html;

        if (this.options.brand_logo_secondary) {
            //old flip logic
            //var brandLogoSquare = this.createBrandLogo('rev-auth-site-logo', true);
            //revUtils.prepend(cell.querySelector('.rev-auth-box'), brandLogoSquare);
        }

        //var close = cell.querySelector('.rev-auth-close-button');
        //revUtils.addEventListener(close, 'click', function(e) {
            //old flip logic
            //revUtils.removeClass(cell, 'rev-flipped');
        //});

        var that = this;
        //commented out with old flip logic
        //revUtils.addEventListener(cell.querySelector('.rev-auth-button'), 'click', this.authButtonHandler.bind(this, cell));

        /* secondary auth page, deemed unnecessary for now
        revUtils.addEventListener(cell.querySelector('.rev-auth-button'), 'click', function(e) {
            //revUtils.removeClass(cell, 'rev-flipped');
            //that.updateAuthElements();
        });
        */

        return cell;
    };
    RevSlider.prototype.afterAuth = false;
    RevSlider.prototype.authButtonHandler = function(cell, e) {
        var that = this;
        if (that.options.authenticated) {
            that.logOut();
        } else {
            var popup = window.open(that.options.actions_api_url + 'facebook/login', 'Login', 'resizable,width=600,height=800');

            var closedCheckInterval = setInterval(function () {
                if (popup.closed) {
                    that.options.emitter.emitEvent('updateButtonElementInnerIcon');
                    that.isAuthenticated(function (response) {

                        that.options.emitter.emitEvent('updateButtons', [response]);

                        if (response === true) {
                            if (cell) {
                                //old flip logic
                                //revUtils.removeClass(cell, 'rev-flipped');
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
                                that.userMenu = that.createUserMenu(that.options);
                            }

                            //if commenting
                            if (typeof that.afterAuth === "function") {
                                that.afterAuth();
                            }

                        }
                        revDisclose.postMessage();
                    });
                    clearInterval(closedCheckInterval);
                }
            }, 100);
        }
    }

    RevSlider.prototype.logOut = function() {
        var that = this;
        revApi.xhr(that.options.actions_api_url + 'user/logout', function(data) {
            localStorage.clear();
            that.options.authenticated = false;
            that.options.user = null;

            that.options.emitter.emitEvent('updateButtonElementInnerIcon');
            that.options.emitter.emitEvent('updateButtons', [false]);

            that.grid.remove(that.feedAuthButton);
            if (that.grid.perRow > 1) { // relayout if not single column
                that.grid.layout();
            }

            that.grid.layout();
        },null,true,null);
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
    };

    RevSlider.prototype.loadTopicFeed = function(topicId, topicTitle, iconHtml, withoutHistory){
        this.options.emitter.emitEvent('createFeed', ['topic', {
            topicId: topicId,
            topicTitle: topicTitle,
            iconHtml: iconHtml,
            withoutHistory: withoutHistory
        }]);
    }

    RevSlider.prototype.loadAuthorFeed = function(authorName, iconHtml, withoutHistory){
        this.options.emitter.emitEvent('createFeed', ['author', {
            authorName: authorName,
            iconHtml: iconHtml,
            withoutHistory: withoutHistory
        }]);
    }

    RevSlider.prototype.generateUrl = function(internalOffset, internalCount, sponsoredOffset, sponsoredCount) {
        var url = (this.options.host ? this.options.host + '/api/v1/' : this.options.url) +
        '?api_key=' + this.options.api_key +
        this.getSerializedQueryParams() +
        '&pub_id=' + this.options.pub_id +
        '&widget_id=' + this.options.widget_id +
        '&domain=' + this.options.domain +
        '&api_source=' + this.options.api_source;

        url +=
        '&sponsored_count=' + sponsoredCount +
        '&internal_count=' + internalCount +
        '&sponsored_offset=' + sponsoredOffset +
        '&internal_offset=0'; // fix to 0 so cache doesn't skip over the Elasticsearch results.

        if (internalCount) {
            url += '&show_comments=1';

            var ignoreList = this.getIgnoreList(this.grid.items);
            url += '&doc_ids=' + ignoreList.join(",");

            if (this.options.feed_type) {
                url += "&feed_type=" + this.options.feed_type;
            }

            var topicId = this.options.topic_id;
            if(topicId && topicId > 0) {
                url += "&topic_id=" + topicId;
            }

            var authorName = this.options.author_name;
            if(authorName && authorName.length>0) {
                url += '&author_name=' + encodeURI(authorName);
            }

            if (Array.isArray(this.options.contextual_last_sort)) {
                url += '&contextual_last_sort=' + encodeURIComponent(this.options.contextual_last_sort.join(','));
            }
        }

        if (this.options.keywords) {
            url += ('&keywords=' + encodeURI(this.options.keywords));
        }

        url += this.options.user_ip ? ('&user_ip=' + this.options.user_ip) : '';
        url += this.options.user_agent ? ('&user_agent=' + this.options.user_agent) : '';

        if (this.options.test) {
            url += '&empty=1';
        }

        url += '&fill=1';

        return url;
    };

    RevSlider.prototype.getData = function() {
        if (this.dataPromise) {
            return this.dataPromise;
        }

        var that = this;

        this.dataPromise = new Promise(function(resolve, reject) {

            var tryToCreateRows = function(retries) {
                try {
                    var rowData = that.createRows(that.grid);
                    resolve({authenticated: that.options.authenticated, rowData: rowData});
                } catch (e) {
                    // TODO test
                    while(that.grid.items.length) {
                        var popped = that.grid.items.pop();
                        popped.remove();
                    }

                    if (retries > 0) {
                        setTimeout(function() {
                            tryToCreateRows((retries - 1));
                        }, 100);
                    }
                }
            }

            var initAuthenticated = function() {
                try {
                    if (that.options.authenticated === true) {
                        that.updateAuthElements();
                    }

                    tryToCreateRows(10);
                } catch (e) {
                    console.log('*************Feed', e);
                    reject(new Error("Feed - getData tryToCreateRows"));
                }
            }

            if (that.options.authenticated === null) {
                that.isAuthenticated(function(authenticated) {
                    initAuthenticated();
                });
            } else {
                initAuthenticated();
            }
        }).then(function(data) {
            return new Promise(function(resolve, reject) {
                if (that.options.content.length && that.options.view) {
                    data.initial_content_mode = true;
                    data.data = { content: that.options.content, view: that.options.view };
                    resolve(data);
                } else {
                    revApi.request(that.generateUrl(that.internalOffset, data.rowData.internalLimit, that.sponsoredOffset, data.rowData.sponsoredLimit), function(apiData) {

                        if (!apiData.content.length) {
                            reject(new Error("Feed - getData no data"));
                            return;
                        }
                        data.data = apiData;
                        resolve(data);
                    });
                }
            });
        }).then(function(data) {

            var tryToUpdateDisplayedItems = function(retries, items, data, passive) {
                try {
                    return Promise.resolve(that.updateDisplayedItems(items, data, passive));
                } catch (e) {
                    console.log('*************Feed', e);
                    if (retries > 0) {
                        setTimeout(function() {
                            tryToUpdateDisplayedItems((retries - 1));
                        }, 100)
                    }
                }
            }

            return new Promise(function(resolve, reject) {

                if (data.initial_content_mode) {
                    // update passive and retry if not matching
                    tryToUpdateDisplayedItems(10, data.rowData.items, data.data, true).then(function(itemTypes) {


                        if (itemTypes.removeItems.length) { // try to fill any discrepencies

                            var actualInternalOffset = 0;
                            var actualSponsoredOffset = 0;
                            var missInternalCount = 0;
                            var missSponsoredCount = 0;

                            for (var i = 0; i < itemTypes.viewableItems.length; i++) {
                                switch(itemTypes.viewableItems[i].type) {
                                    case 'internal':
                                        actualInternalOffset++;
                                        break;
                                    case 'sponsored':
                                        actualSponsoredOffset++;
                                        break;
                                }
                            }

                            for (var i = 0; i < itemTypes.removeItems.length; i++) {
                                switch(itemTypes.removeItems[i].type) {
                                    case 'internal':
                                        missInternalCount++;
                                        break;
                                    case 'sponsored':
                                        missSponsoredCount++;
                                        break;
                                }
                            }

                            revApi.request(that.generateUrl(actualInternalOffset, missInternalCount, actualSponsoredOffset, missSponsoredCount), function(apiData) {

                                if (!apiData.content.length) {
                                    reject(new Error("Feed - getData no extra data"));
                                    return;
                                };

                                tryToUpdateDisplayedItems(10, itemTypes.removeItems, apiData).then(function() {
                                    resolve(data);
                                })
                            });
                        } else {
                            resolve(data);
                        }

                    })
                } else {
                    tryToUpdateDisplayedItems(10, data.rowData.items, data.data).then(function() {
                        resolve(data);
                    });
                }
            })
        }).then(function(data) {
            return data;
        }, function(e) {
            throw new Error(e);
        });

        return this.dataPromise;
    };


    RevSlider.prototype.updateDisplayedItem = function(item) {

        var itemData = item.data;

        for (var i = 0; i < item.handlers.length; i++) {
            var handler = item.handlers[i];
            revUtils.removeEventListener(handler.el, handler.type, handler.handle);
        }

        if (!itemData) {
            return;
            // continue;
        }

        // item.viewIndex = j;
        // item.data = itemData;

        item.anchor = item.element.querySelector('a');

        var url = itemData.url;
        if (itemData.type == 'internal' && this.options.trending_utm) {
            url += ('&' + this.options.trending_utm);
        }
        item.anchor.setAttribute('href', url);
        item.anchor.title = itemData.headline;

        if (item.type == 'internal') {
            item.anchor.removeAttribute('target');
            item.anchor.removeAttribute('rel');
        } else {
            item.anchor.setAttribute('target', '_blank');
            item.anchor.setAttribute('rel', 'nofollow');
        }

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
                    var imageFormat = itemData.favicon_url.substring(itemData.favicon_url.lastIndexOf('.')+1, itemData.favicon_url.length) || itemData.favicon_url;

                    if (imageFormat == 'ico' ) {
                        imageUrl += '&op=noop';
                    } else if (item.type == 'internal') {
                        imageUrl += '&fmt=jpeg';
                    }

                    imageUrl += '&h=34&w=34';

                    itemData.iconHtml = '<span class="rev-headline-icon-image" style="background-image:url('+ imageUrl +')' + '"></span>'

                    favicon.innerHTML = itemData.iconHtml;
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

                    itemData.iconHtml = '<div style="background-color:#'+ initialColor +'" class="rev-author-initials">'+ initials +'</div>';

                    favicon.innerHTML = itemData.iconHtml;
                }

                var date = item.element.querySelector('.rev-date');
                if (date) {
                    if (item.type == 'sponsored') {
                        var icon = '<span class="rev-sponsored-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg enable-background="new 0 0 128 128" id="Layer_1" version="1.1" viewBox="0 0 128 128" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M72.259,38.978c0.148,0.021,0.797-0.38,1.041-0.506s0.979,0.295,1.208,0.38s1.28-0.13,1.45-0.295   c0.17-0.166,0.192-0.507,0.049-0.759s-0.709-0.947-0.935-0.991c-0.225-0.044-0.969-0.158-1.147-0.159s-0.724,0.1-0.81,0.225   c-0.085,0.125-0.345,0.559-0.386,0.685s-0.3,0.494-0.481,0.538c-0.181,0.043-0.628,0.281-0.588,0.428S72.11,38.957,72.259,38.978z"/><path d="M74.428,41.097c-0.13,0.172-0.572,1.036-0.692,1.535c-0.12,0.499,0.012,2.559,0.237,2.423   c0.226-0.136,0.81-0.779,0.799-1.129c-0.011-0.35,0.102-1.443,0.275-1.66s0.969-1.123,1.098-1.25   c0.128-0.127-0.023-0.232-0.336-0.233C75.497,40.782,74.559,40.925,74.428,41.097z"/><path d="M87.878,4.622c-0.026,0-0.293-0.108-0.849-0.334C79.882,1.528,72.121,0,64,0C28.654,0,0,28.654,0,64   c0,35.347,28.654,64,64,64c35.346,0,64-28.653,64-64C128,37.098,111.393,14.088,87.878,4.622z M83.076,6.278   c0.146,0.16,1.074,0.425,1.412,0.481c0.339,0.057,2.473,0.523,2.654,0.659s0.362,0.448,0.401,0.692   c0.039,0.245-1.719,0.042-2.532-0.18c-0.814-0.222-3.471-1.203-3.654-1.373s0.037-0.725,0.421-0.719   C82.162,5.845,82.929,6.118,83.076,6.278z M77.201,4.695c0.193-0.01,1.237-0.052,1.559-0.055c0.32-0.002,1.179,0.073,1.333,0.073   s1.465,0.086,1.528,0.165c0.064,0.079,0.004,0.163-0.134,0.188s-0.703,0.045-0.88,0.033c-0.178-0.012-0.589-0.131-0.475-0.158   c0.115-0.027,0.259-0.108,0.168-0.122c-0.092-0.014-0.423-0.044-0.537-0.042c-0.114,0.003-0.417,0.065-0.419,0.133   c-0.002,0.067-1.258,0.024-1.524-0.052c-0.268-0.076-1.187-0.138-1.117-0.144C76.771,4.706,77.008,4.705,77.201,4.695z    M72.222,4.825c0.531-0.002,0.991-0.01,1.001-0.011c0.009-0.001,0.562-0.014,0.708-0.018c0.146-0.003,0.542-0.009,0.626-0.008   c0.083,0.001,0.098,0.01,0.033,0.018c-0.065,0.008-1.856,0.101-2.477,0.101S71.69,4.828,72.222,4.825z M65.721,5.043   c0.182-0.004,0.916-0.024,1.232-0.037c0.315-0.012,0.872-0.026,0.973-0.027c0.1-0.001,0.491-0.004,0.748-0.011   c0.171-0.005,0.604-0.02,0.914-0.032c-0.034-0.001-0.078-0.004-0.1-0.004c-0.172-0.006,0.082-0.026,0.209-0.028   c0.127-0.002,0.339,0.007,0.217,0.017c-0.041,0.003-0.169,0.009-0.326,0.016c0.234,0.01,0.706,0.035,0.883,0.04   c0.202,0.004,0.832,0.106,0.916,0.088c0.083-0.019,0.609-0.108,0.801-0.127c0.192-0.02,0.917,0.005,0.974,0.033   c0.057,0.027,0.372,0.137,0.578,0.159s1.114-0.007,1.351-0.031c0.235-0.023,0.599-0.102,0.695-0.083   c0.096,0.02,0.47,0.082,0.617,0.087c0.148,0.005,1.246,0.061,1.562,0.082s0.801,0.099,0.901,0.139   c0.101,0.04-0.015,0.235-0.073,0.294c-0.059,0.059,0.196,0.256,0.492,0.355c0.296,0.099,1.132,0.628,0.947,0.654   s-0.472,0.002-0.639-0.051c-0.167-0.054-0.896-0.332-1.132-0.409c-0.236-0.077-1.123-0.247-1.348-0.294S75.937,5.5,75.658,5.413   c-0.278-0.086-0.992-0.208-1.084-0.204s-0.244,0.053-0.135,0.103c0.108,0.049-0.14,0.166-0.258,0.19   c-0.119,0.024-1.206,0.056-2.27,0.077s-2.958-0.071-3.58-0.165c-0.623-0.093-1.512-0.348-1.658-0.352s-0.625-0.01-0.74-0.013   c-0.086-0.002-0.285-0.003-0.391-0.004c-0.052,0-0.08-0.001-0.067-0.001c0.006,0,0.031,0,0.067,0.001   C65.585,5.045,65.641,5.045,65.721,5.043z M13.156,41.313c-0.009,0.027-0.011,0.054-0.011-0.008c0-0.062,0.018-0.136,0.021-0.102   S13.165,41.286,13.156,41.313z M13.367,40.05c-0.027,0.087-0.07,0.178-0.052,0.007c0.018-0.171,0.109-0.616,0.105-0.456   S13.394,39.963,13.367,40.05z M15.071,36.306c-0.396,0.745-1.131,2.144-1.107,1.946s0.142-0.502,0.17-0.522   c0.029-0.02,0.219-0.389,0.355-0.777c0.136-0.388,0.589-1.23,0.759-1.579s0.484-0.594,0.505-0.533   C15.775,34.901,15.468,35.561,15.071,36.306z M88.323,122.139c-0.253,0.126-1.378,0.228-1.232,0.1s1.444-0.466,1.608-0.49   C88.863,121.723,88.577,122.014,88.323,122.139z M102.949,86.24c-0.022,0.335-0.105,1.195-0.184,1.911   c-0.079,0.717-0.553,4.61-0.81,6.39s-0.806,4.162-0.979,4.402s-0.881,1.237-1.128,1.693c-0.246,0.456-0.88,1.484-1.112,1.806   s-0.81,1.846-0.763,1.884s-0.157,0.857-0.562,1.738c-0.404,0.881-1.234,2.521-1.337,2.609s-0.431,0.475-0.498,0.664   s-0.479,1.25-0.82,1.624s-1.835,1.689-1.853,1.821s-0.202,0.772-0.371,1.136c-0.17,0.364-1.824,1.766-2.025,1.85   c-0.202,0.085-0.812,0.407-0.896,0.533c-0.084,0.125-0.661,0.998-0.914,1.059c-0.254,0.06-0.932,0.444-1.026,0.541   c-0.095,0.098-0.19,0.333-0.001,0.314s0.678,0,0.679,0.08s-0.518,0.426-0.688,0.515s-0.479,0.332-0.552,0.497   c-0.073,0.164-1.095,0.892-1.393,1.082c-0.297,0.19-0.394,0.485-0.234,0.51s0.27,0.323-0.104,0.607   c-0.372,0.285-1.368,0.965-1.366,1.045s0.046,0.312,0.103,0.362c0.058,0.05,0.627,0.623,0.838,0.605   c0.211-0.019,0.812,0.205,0.65,0.243c-0.163,0.038-1.248,0.45-1.665,0.487s-1.485-0.207-1.826-0.203   c-0.341,0.005-1.262-0.788-1.544-0.806c-0.281-0.018-0.203-0.342-0.322-0.345s-0.355-0.081-0.257-0.169s0.286-0.374,0.2-0.396   c-0.085-0.023-0.22-0.17-0.104-0.266c0.117-0.097,0.744-0.45,0.812-0.471s0.325-0.182,0.387-0.268   c0.062-0.086-0.275-0.129-0.427-0.122s-0.555-0.081-0.529-0.175s0.529-0.788,0.659-0.877c0.131-0.09,0.511-0.464,0.553-0.627   c0.043-0.163,0.071-0.695-0.027-0.794c-0.098-0.099,0.07-0.776,0.186-0.975c0.114-0.198,0.799-0.903,0.972-1.151   c0.173-0.247,0.595-1.095,0.558-1.3s-0.104-1.044-0.059-1.382c0.045-0.337,0.499-2.082,0.66-2.649   c0.162-0.567,0.675-2.622,0.731-3.188s-0.284-2.2-0.532-2.598c-0.249-0.398-2.226-1.274-2.798-1.459s-1.465-0.615-1.826-0.84   s-1.503-1.317-1.788-1.703c-0.284-0.387-1.137-2.075-1.619-2.468s-1.257-1.458-1.172-1.761c0.085-0.304,1.138-2.479,1.082-3.051   c-0.055-0.573-0.021-2.418,0.198-2.654s1.855-2.153,2.305-2.761s0.704-2.521,0.525-3.306c-0.179-0.783-1.999-1.797-2.097-1.523   c-0.099,0.273-0.794,0.872-1.324,0.722s-3.383-1.343-3.902-1.531c-0.519-0.188-2.025-2.018-2.433-2.546s-2.306-1.296-3.365-1.577   c-1.061-0.281-5.067-1.191-6.517-1.374c-1.45-0.184-4.75-1.017-5.586-1.34s-3.341-2.303-3.393-3.068   c-0.052-0.766-0.899-2.46-1.449-3.165s-2.869-4.339-3.547-5.377c-0.678-1.038-2.225-2.364-2.193-1.812s1.119,3.063,1.476,3.784   c0.356,0.722,1.039,2.416,1.195,2.757c0.155,0.341,0.517,0.683,0.373,0.784c-0.143,0.103-0.882,0.077-1.324-0.281   c-0.442-0.359-1.663-2.329-1.98-2.875c-0.317-0.546-1.048-1.64-1.001-2.058s0.161-1.05-0.164-1.375   c-0.325-0.325-1.022-2.582-1.155-3.212c-0.132-0.63-0.918-2.466-1.459-2.688s-2.041-1.244-2.163-1.792   c-0.122-0.547-0.302-2.742-0.45-2.902s-0.486-0.71-0.569-0.854c-0.083-0.144-0.237-1.465-0.16-2.765   c0.076-1.3,0.643-4.438,0.906-5.312s1.583-4.077,1.64-4.353s0.119-1.635,0.255-1.778c0.137-0.143,0.304-0.863,0.067-1.285   c-0.237-0.422-2.156-1.414-2.092-1.743c0.064-0.33,0.583-0.983,0.759-1.121c0.176-0.138,0.549-1.063,0.438-1.813   c-0.111-0.75-1.356-2.485-1.485-2.387c-0.129,0.099-0.501,0.689-0.539,1.093c-0.039,0.403-0.241,1.209-0.369,0.872   c-0.128-0.338,0.146-1.549,0.352-1.843s1.268-0.709,1.282-0.854s-0.073-0.582-0.225-0.654c-0.153-0.072-0.561-0.755-0.573-1.362   s-0.446-1.994-0.379-2.36c0.067-0.366,0.112-1.052-0.092-1.341s-0.887-1.22-1.433-1.558c-0.546-0.338-2.719-0.801-2.614-0.996   s0.28-0.709,0.15-0.722c-0.13-0.012-1.204,0.643-2.101,1.48c-0.896,0.837-2.993,1.763-3,1.658c-0.008-0.104-0.177-0.284-0.361-0.17   s-0.746,0.803-0.892,1.026c-0.146,0.223-0.745,1.115-1.119,1.525c-0.373,0.411-2.23,2.098-2.912,2.786   c-0.683,0.688-2.835,3.095-3.395,3.719c-0.56,0.624-1.66,1.518-1.588,1.346c0.071-0.171,0.632-1.056,1.083-1.585   c0.451-0.53,1.494-1.661,1.774-1.965c0.281-0.305,1.589-1.819,1.997-2.296c0.409-0.477,1.446-1.814,1.419-1.936   c-0.026-0.121-0.463-0.27-0.913-0.068c-0.45,0.202-1.037,0.041-0.936-0.234s0.281-1.224,0.144-1.412   c-0.137-0.188-0.397-0.74-0.291-0.827c0.106-0.087,0.437-0.438,0.495-0.588s0.004-0.334-0.034-0.358s0.257-0.649,0.739-1.336   c0.482-0.687,1.936-1.902,2.426-2.113c0.49-0.21,1.743-0.985,2.085-1.323c0.342-0.339,0.295-0.822,0.167-0.828   c-0.128-0.006-0.832,0.244-1.037,0.333c-0.206,0.089-0.63,0.036-0.688-0.233c-0.058-0.27,0.887-1.727,1.285-1.958   s1.47-0.967,1.665-1.006s0.679-0.042,0.634,0.077c-0.045,0.119-0.071,0.491-0.006,0.541c0.065,0.05,0.953-0.467,1.206-0.72   s0.351-0.583,0.281-0.607s-0.192-0.217-0.119-0.377c0.073-0.16,0.538-0.987,0.708-1.211c0.169-0.225,1.021-0.689,1.365-0.828   s2.319-0.88,2.89-1.087s1.666-0.606,1.893-0.655c0.227-0.049,1.383-0.334,2.062-0.529c0.679-0.195,1.864-0.279,2.213-0.251   c0.349,0.029,1.977,0.162,2.521,0.208c0.544,0.046,2.54,0.227,2.843,0.232c0.304,0.005,1.541,0.266,1.876,0.351   c0.336,0.086,1.155,0.105,1.501,0.024c0.346-0.082,2.393-0.632,3-0.762c0.607-0.131,2.021-0.153,2.325-0.208   c0.304-0.055,1.099-0.15,1.096-0.097c-0.003,0.053,0.354,0.276,0.8,0.369c0.446,0.093,3.109,1.056,3.81,1.269   c0.701,0.212,2.485,0.315,2.56,0.275c0.076-0.041-0.012-0.287-0.361-0.459c-0.35-0.172-0.901-0.664-0.848-0.732   c0.054-0.068,0.98-0.295,1.054-0.329c0.073-0.034,0.016-0.246-0.286-0.398c-0.303-0.152-0.681-0.564-1.306-0.661   c-0.625-0.098-2.099,0.045-2.291-0.121c-0.192-0.166,0.327-0.525,0.829-0.729s1.981-0.476,2.033-0.534   c0.052-0.059,0.439-0.142,0.716-0.153s1.482-0.009,2.065,0.027c0.582,0.036,1.65,0.238,1.543,0.363   c-0.107,0.125-0.054,0.326,0.085,0.364s1.124,0.185,1.03,0.229c-0.093,0.044-0.028,0.224,0.357,0.293s1.301-0.023,1.721-0.149   c0.421-0.126,1.692-0.426,1.938-0.438c0.246-0.012,0.924,0.136,1.051,0.198c0.127,0.062-0.125,0.524-0.322,0.882   C72.079,7.562,71.776,8.845,72,9.07c0.225,0.225,0.771,0.86,0.581,0.85s-0.74,0.048-0.794,0.145   c-0.055,0.098-0.593,0.306-1.068,0.239c-0.477-0.067-1.899-0.17-2.091-0.028c-0.191,0.141,0.424,0.67,1.164,0.985   c0.74,0.314,3.101,0.549,3.327,0.431c0.228-0.118,0.559-0.49,0.613-0.59c0.054-0.1,0.571-0.512,1.017-0.735   c0.445-0.224,1.097-0.817,1.058-1.012s-0.494-1.091-0.41-1.149c0.085-0.058,0.174-0.473,0.012-0.797   c-0.162-0.325,0.769-1.04,0.939-1.029s0.703,0.081,0.806,0.128c0.103,0.047,0.481,0.166,0.585,0.192   c0.104,0.026,0.904,0.18,1.623,0.327c0.718,0.147,2.086,0.46,2.01,0.569c-0.075,0.108-0.535,0.292-0.721,0.316   s-1.155,0.041-1.41,0.088c-0.254,0.047-0.376,0.955-0.232,1.364c0.144,0.408,0.279,1.168,0.16,1.234   c-0.118,0.066-0.397,0.339-0.348,0.453s0.858,0.466,1.11,0.557s0.705,0.399,0.82,0.567c0.115,0.168,0.304,1.017,0.528,1.071   c0.224,0.054,0.818-0.31,0.959-0.453c0.142-0.143,0.441-0.51,0.508-0.598c0.065-0.087,0.249-0.309,0.297-0.37   c0.047-0.062-0.132-0.412-0.49-0.611c-0.357-0.2-1.418-0.482-1.451-0.585c-0.034-0.104-0.049-0.392,0.043-0.417   s0.197-0.233,0.035-0.407c-0.161-0.174-0.367-0.467-0.406-0.529c-0.04-0.062,0.039-0.421,0.389-0.618   c0.349-0.196,1.245-0.544,1.648-0.619c0.404-0.075,1.786,0.248,1.819,0.313s0.542,0.286,1.06,0.341s2.197,0.799,2.634,1.128   c0.437,0.33,1.465,1.998,1.733,2.19c0.27,0.192,1.131,0.701,1.14,0.885s0.705,0.779,0.812,0.794   c0.107,0.015,0.597,0.359,0.855,0.729s0.67,1.717,0.582,1.751c-0.087,0.034-0.143,0.399,0.078,0.732   c0.22,0.333,0.849,0.717,0.898,0.964c0.049,0.247,0.802,1.397,0.903,1.443s0.227,0.438,0.056,0.765   c-0.171,0.327-0.579,0.982-0.686,0.964c-0.105-0.018-0.65-0.727-0.804-0.943s-0.487-0.451-0.622-0.474s-0.216,0.38,0.122,0.947   c0.338,0.566,0.828,1.716,0.771,2.068c-0.057,0.353-1.132,0.663-1.18,0.706c-0.048,0.042-0.35,0.004-0.566-0.181   s-1.167-1.278-1.446-1.586s-1.194-1.041-1.584-1.38c-0.39-0.338-1.092-1.025-1.428-0.878s-1.432-0.83-1.46-0.975   c-0.028-0.145,0.013-0.542,0.155-0.567c0.144-0.025,1.095,0.134,1.252,0.277c0.157,0.144,0.682,0.306,0.823,0.035   c0.142-0.271,0.467-0.795,0.637-0.955s0.603-0.794,0.595-1.075c-0.008-0.281-0.928-1.371-1.272-1.69s-1.215-1.172-1.204-1.234   c0.01-0.063-0.12-0.228-0.315-0.23c-0.195-0.003-0.944-0.325-1.024-0.385c-0.081-0.06-0.405-0.256-0.545-0.305   s-0.54-0.035-0.627-0.009c-0.086,0.026-0.086,0.279-0.031,0.463s0.103,0.723-0.014,0.768c-0.115,0.045-0.359,0.587-0.281,1.099   c0.079,0.511-0.583,0.983-1.062,0.902c-0.479-0.081-1.723-0.138-1.789,0.014c-0.065,0.153,0.604,0.859,0.832,1.062   c0.228,0.203,0.829,0.816,1.287,1.113c0.459,0.297,1.041,0.747,0.951,0.816s-0.264,0.309-0.182,0.38   c0.083,0.072,0.087,0.224-0.174,0.179s-1.569-0.605-1.941-0.716c-0.372-0.111-1.118,0.269-1.27,0.25   c-0.152-0.019-0.506-0.417-0.445-0.843s0.833-1.616,0.779-1.703c-0.055-0.088-0.512-0.255-0.896-0.181   c-0.384,0.074-1.882,0.902-2.283,1.154s-1.045,0.653-1.103,0.794c-0.059,0.141-0.754,0.779-1.418,1.098s-2.024,1.606-2.189,2.052   c-0.164,0.446-0.524,1.86-0.419,2.103c0.105,0.243,0.396,1.034,0.41,1.209c0.014,0.174,0.447,0.785,0.931,0.963   c0.482,0.178,2.186,1.227,2.989,1.813c0.804,0.586,2.957,2.396,3.042,2.66c0.086,0.264,0.392,2.4,0.529,2.872   s1.148,0.801,1.338,0.669c0.19-0.133,0.42-1.645,0.438-2.102c0.019-0.456,0.431-1.434,0.95-1.836   c0.519-0.402,1.894-1.798,1.866-2.183c-0.027-0.384-1.216-1.496-1.238-1.667s0.152-0.776,0.435-0.966s0.695-0.985,0.633-1.523   c-0.062-0.538-0.039-2.047,0.094-2.138c0.132-0.09,1.283,0.271,1.668,0.432s1.529,0.859,1.771,1.248s0.796,0.877,0.921,0.877   s0.57,0.133,0.719,0.293c0.147,0.16,0.372,1.087,0.175,1.7c-0.197,0.614,0.662,1.702,1.128,1.805   c0.465,0.103,1.316-1.061,1.336-1.376c0.019-0.316,0.39-0.117,0.567,0.358c0.178,0.475,1,3.531,1.325,4.427   c0.326,0.896,1.644,2.559,1.676,2.933s0.667,2.401,0.758,3.216c0.09,0.815,0.452,2.548,0.602,2.703   c0.149,0.155,0.779,0.823,0.834,1.257s0.071,1.673-0.078,1.781c-0.148,0.107-0.267,0.496-0.296,0.38s-0.213-0.47-0.338-0.527   s-0.636-0.042-0.62-0.146c0.017-0.104-0.056-0.542-0.195-0.745s-0.85-0.535-1.07-0.607s-0.444-0.76-0.12-1.276   c0.324-0.517,1.094-1.956,1.087-2.027c-0.006-0.071-0.051-0.324-0.081-0.403s-0.508-0.125-0.988,0.077   c-0.48,0.201-2.045,0.735-2.247,0.646c-0.202-0.089-1.578-0.767-1.977-0.885s-0.724,0.582-0.498,0.75   c0.227,0.168,0.975,0.63,1.079,0.761c0.104,0.131,0.282,0.554,0.165,0.646c-0.116,0.093-0.287,0.489-0.116,0.669   c0.171,0.179,1.005,0.843,1.274,1.042c0.27,0.199,1.104,1.045,1.188,1.419c0.082,0.374-0.379,0.853-0.783,0.939   c-0.403,0.086-1.746,0.544-2.006,0.793s-0.996,0.052-1.33-0.223c-0.333-0.275-2.114-0.449-2.357-0.253   c-0.244,0.195-0.771,1.308-0.884,1.665s-0.533,1.24-0.801,1.229s-1.279,0.232-1.642,0.561s-1.445,2.167-1.733,2.751   s-0.98,2.459-1.011,2.991c-0.029,0.531-0.853,1.796-1.469,2.215c-0.615,0.418-2.251,1.567-2.669,1.912s-1.59,1.945-1.813,2.402   c-0.225,0.457,0.597,2.588,1.416,4.146c0,0,0,0,0,1.331c0,0.337,0,0.337,0,0.337c-0.068,0.3-0.208,0.617-0.309,0.705   s-0.896-0.224-1.17-0.526c-0.272-0.303-1.186-1.584-1.416-2.171c-0.23-0.586-1.058-2.198-1.314-2.275   c-0.258-0.077-0.98-0.395-1.193-0.522s-1.667-0.516-2.598-0.277c-0.932,0.239-2.504,1.727-3.501,1.646s-3.406,0.107-4.268,0.351   c-0.862,0.243-3.037,3.576-3.735,5.662c0,0-0.346,1.032-0.346,2.229c0,0.509,0,0.509,0,0.509c0,0.566,0.141,1.318,0.312,1.671   s0.705,1.447,0.964,1.723s2.382,0.783,3.081,0.83s2.497-0.503,2.691-0.7c0.194-0.198,0.885-1.546,1.093-1.923   s1.006-0.855,1.235-0.918c0.229-0.062,0.969-0.29,1.211-0.366c0.242-0.075,1.15-0.167,1.173,0.062s-0.413,2.034-0.536,2.531   c-0.124,0.496-1.245,1.94-1.418,2.508c-0.172,0.567,1.618,1.366,2.283,1.309s2.511-0.152,2.649-0.074   c0.139,0.079,0.378,0.947,0.224,1.754c-0.155,0.806-0.174,2.649-0.021,3.103c0.151,0.453,2.018,0.96,2.745,0.699   s2.476-0.356,2.907-0.282c0.432,0.075,1.864-0.559,2.795-1.356c0.932-0.798,2.71-2.553,3.176-2.444   c0.466,0.109,2.832,0.324,2.9,0.481s0.612,0.506,1.057,0.429c0.445-0.077,1.982-0.416,2.482-0.574   c0.501-0.159,1.537-0.552,1.577-0.721c0.04-0.17,0.25-0.542,0.38-0.449c0.13,0.094,0.145,0.81,0.127,1.034   c-0.019,0.225,0.399,1.075,0.81,1.562s1.493,1.227,1.806,1.304c0.312,0.076,1.554-0.01,1.862,0.125s1.281,1.809,1.278,2.123   c-0.004,0.314,0.416,1.177,0.941,1.222c0.526,0.045,1.271,0.421,1.383,0.366c0.111-0.054,0.6-0.566,0.719-0.701   c0.12-0.136,0.366-0.107,0.459-0.035C102.896,84.694,102.973,85.905,102.949,86.24z M93.49,73.909   c-0.011,0.329-0.119,0.448-0.241,0.264s-0.337-0.845-0.201-1.053C93.184,72.913,93.501,73.579,93.49,73.909z M90.076,72.218   c-0.396,0.138-1.197,0.202-0.857-0.162c0.341-0.364,1.287-0.409,1.391-0.295S90.474,72.08,90.076,72.218z M79.55,71.355   c-0.219-0.07-1.31-0.951-1.644-1.22c-0.333-0.269-1.74-0.679-2.52-0.757s-2.627,0.117-2.012-0.345   c0.615-0.463,3.881-0.825,4.42-0.593s2.432,0.997,3.039,1.192s2.167,1.056,2.164,1.234s-0.457,0.368-1.01,0.422   C81.435,71.344,79.769,71.426,79.55,71.355z M80.527,73.434c-0.058,0.163-0.652,0.568-0.842,0.655   c-0.189,0.086-0.571,0.033-0.656-0.138c-0.086-0.171,0.621-0.715,0.971-0.75C80.349,73.166,80.586,73.271,80.527,73.434z    M79.275,63.851c0.482-0.031,0.963-0.062,1.438-0.093C79.919,64.142,79.434,64.174,79.275,63.851z M79.75,66.8   c-0.002,0.408-0.074,0.488-0.161,0.177s-0.244-1.216-0.155-1.312C79.522,65.568,79.752,66.391,79.75,66.8z M81.453,65.728   c0.407,0.265,1.005,1.452,1.045,1.766c0.039,0.312-0.204,0.147-0.541-0.366C81.619,66.613,81.045,65.463,81.453,65.728z    M82.911,72.054c0.352-0.503,4.476-0.939,4.69-0.51c0.215,0.431-0.255,0.893-1.043,1.027c-0.788,0.134-2.051,0.6-2.629,0.62   S82.56,72.558,82.911,72.054z M103.025,83.868c-0.006,0.087-0.034-0.007-0.047-0.07c-0.012-0.062-0.016-0.183-0.009-0.268   s0.052-0.15,0.059-0.09C103.035,83.502,103.03,83.781,103.025,83.868z"/><path d="M77.699,41.569c0.05,0.171,0.26,0.798,0.357,1.013c0.097,0.214,0.488,0.644,0.656,0.473s0.596-0.79,0.587-1.002   c-0.009-0.213,0.301-0.989,0.425-1.071c0.125-0.082,0.084-0.221-0.092-0.309c-0.175-0.088-0.819-0.356-1.039-0.402   c-0.221-0.046-0.871-0.133-0.957-0.092c-0.086,0.042-0.27,0.291-0.217,0.46C77.472,40.809,77.648,41.398,77.699,41.569z"/><path d="M57.341,12.109c-0.083-0.006-0.461-0.144-0.664-0.219c-0.204-0.075-0.8-0.296-0.88-0.333s-0.424-0.086-0.588-0.027   c-0.164,0.058-0.533,0.245-0.454,0.282s0.318,0.246,0.354,0.379c0.036,0.133,0.267,0.481,0.431,0.467   c0.165-0.014,1.251-0.104,1.499-0.123c0.247-0.019,0.483-0.085,0.524-0.146C57.604,12.327,57.423,12.115,57.341,12.109z"/></g></svg></span>';
                    }
                    date.innerHTML = itemData.date ? revUtils.timeAgo(itemData.date) : item.type == 'sponsored' ? 'Sponsored' : '&nbsp;';
                }
            }
        }

        var provider = item.element.querySelector('.rev-provider');
        var that = this;
        if (provider) {
            if (item.type == 'sponsored') {
                provider.innerHTML = itemData.brand ? itemData.brand : revUtils.extractRootDomain(itemData.target_url);
            } else if (item.type == 'internal' && itemData.author) {
                provider.innerHTML = itemData.author;
            }
        }

        //remove any existing comment ui so it doesnt dupe on personalization
        revUtils.remove(item.element.querySelector('.rev-comments'));
        revUtils.remove(item.element.querySelector('.rev-comment-box'));
        revUtils.remove(item.element.querySelector('.comments-list'));

        var commentsULElement = document.createElement('ul');
        revUtils.addClass(commentsULElement, 'comments-list');
        item.element.querySelector('.rev-content-inner').appendChild(commentsULElement);


        if (item.type !== 'sponsored') {
            this.setFeaturedComment(item, commentsULElement);
            //add item to array for later access
            this.feedItems[itemData.uid] = item;
            this.getReactions(item);
            //TODO: This is where bookmarks needs to be called when setting bookmark indicators
        }

        var commentButton = item.element.querySelector('.rev-reaction-comment');
        //dont show comment input on sponsored
        if (item.type !== 'sponsored' && this.options.comments_enabled) {

            var commentBoxElement = this.createCommentInput("comment");
            commentBoxElement.style.display = 'none';
            var submitCommentBtn = commentBoxElement.querySelector('.comment-submit-button');
            var commentTextAreaElement = commentBoxElement.querySelector('.comment-textarea');

            commentBoxElement.itemData = itemData;

            //var commentButton = item.element.querySelector('.rev-reaction-comment');
            if (commentButton) {
                var contentInner = that.getClosestParent(commentButton, '.rev-content-inner');
                itemData.contentInner = contentInner;
                commentButton.itemData = itemData;
                revUtils.addEventListener(commentButton, 'click', function(ev) {
                    that.handleComments(this.itemData, false);
                    commentBoxElement.style.display = 'block';
                    that.grid.layout();
                    commentTextAreaElement.focus();

                    var fontSize = parseInt(revUtils.getComputedStyle(commentTextAreaElement, 'font-size'));
                    // if commentTextArea is scrolling bump the font size down, min font size is 10
                    while(commentTextAreaElement.scrollHeight > commentTextAreaElement.offsetHeight && fontSize > 10) {
                        fontSize--;
                        commentTextAreaElement.style.fontSize = fontSize + 'px';
                    }
                });
            }

            var commentCountElement = item.element.querySelector('.rev-comment-count');

            if (commentCountElement) {
                commentCountElement.itemData = itemData;
                revUtils.addEventListener(commentCountElement, 'click', function(ev) {
                    if (revDetect.mobile()) {
                        that.handleComments(this.itemData, false);
                    } else {
                        //commentTextAreaElement.focus();
                    }
                });
            }

            if (revDetect.mobile()) {
                revUtils.addEventListener(commentBoxElement, 'click', function(ev) {
                    //that.handleComments(this.itemData, true);
                });
            }

            item.element.querySelector('.rev-content-inner').appendChild(commentBoxElement);

            revUtils.addEventListener(submitCommentBtn, 'click', function(ev){
                revUtils.addClass(this, 'novak-animate');

                var callbackFn = function() {
                    //create comment inline on desktop
                    var submitted_comment_data = that.submitComment(commentTextAreaElement.value, itemData.target_url, null, function(data,error){
                        // if (typeof data === "number" && data === 201) {
                        //         //for some reason we are getting dual responses, one with the payload and one with the http code
                        //     return;
                        // }

                        if (error) {
                            //currently only want to show error for bad words, but gathering the error msg from response for later use
                            var errorMsg = JSON.parse(data.responseText);
                            var httpStatus = data.status;
                            if (httpStatus === 406) {
                                //bad word
                                that.displayError(commentBoxElement,"Oops! We've detected a <b>bad word</b> in your comment, Please update your response before submitting.");
                            }
                            return;
                        }

                        var commentDetailsElement = item.element.querySelector(".rev-comment-detail");
                        var commentUL = item.element.querySelector(".comments-list");
                        var newCommentElement = that.setCommentHTML(data,false,false,itemData.uid);
                        var newCommentElement_forDetails = that.setCommentHTML(data,false,false,itemData.uid);

                        commentUL.appendChild(newCommentElement);

                        if (commentDetailsElement) {
                            commentDetailsElement.querySelector(".comments-list").appendChild(newCommentElement_forDetails);
                        }

                        commentTextAreaElement.value = "";
                        var e = document.createEvent('HTMLEvents');
                        e.initEvent("keyup", false, true);
                        commentTextAreaElement.dispatchEvent(e);

                        //update count
                        var countEl = that.getClosestParent(newCommentElement, '.rev-content-inner').querySelector('.rev-reactions-total > .rev-comment-count');
                        var currentCount = countEl.getAttribute('data-count') * 1;

                        countEl.setAttribute('data-count', currentCount + 1);
                        countEl.innerText = (currentCount + 1) + ' comment' + ((currentCount + 1) !== 1 ? 's' : '');

                        //update feed item
                        //that.updateDisplayedItem(that.feedItems[itemData.uid]);
                        that.grid.layout();
                    });
                };

                if (that.options.authenticated) {
                    callbackFn();
                } else {
                    var contentInner = item.element.querySelector('.rev-content-inner');
                    that.tryAuth(contentInner, 'comment', callbackFn);
                    //old flip logic
                    // revUtils.removeClass(document.querySelector('.rev-flipped'), 'rev-flipped');
                    // revUtils.addClass(item.element, 'rev-flipped');
                    //item.element.scrollIntoView({ behavior: 'smooth', block: "start" });

                    //store users comment for after auth
                    //that.afterAuth = callbackFn;
                }

            });

        } else {
            if (commentButton) {
                commentButton.href = item.data.target_url + '#' + (this.options.comment_div ? this.options.comment_div : this.options.feed_id);
            }
        }

        revUtils.remove(item.element.querySelector('.rev-reason'));

        if (itemData.reason_topic_id > 0) {
            var reason = document.createElement('div');
            var t = document.createElement("span");
            t.setAttribute('style', 'cursor:pointer;');
            t.setAttribute('data-type', 'topic');
            t.className = 'rev-feed-link';
            t.innerHTML = "<strong>"+itemData.reason_topic+"</strong>";

            var txt = 'Recommended because you are interested in ';
            reason.className = 'rev-reason';
            reason.innerHTML = txt;
            reason.title = txt + itemData.reason_topic;
            reason.appendChild(t);
            revUtils.prepend(item.element.querySelector('.rev-ad-outer'), reason);
        }

        if (item.type == 'internal') {
            var save = item.element.querySelector('.rev-save');
            revUtils.removeClass(save, 'rev-save-active');
            if (itemData.bookmarked) {
                revUtils.addClass(save, 'rev-save-active');
            }

            // feed links
            var feedLinks = item.element.querySelectorAll('.rev-feed-link');
            for (var i = 0; i < feedLinks.length; i++) {
                var clickHandle = this.handleFeedLink.bind(this, feedLinks[i].getAttribute('data-type'), itemData);
                item.handlers.push({
                    el: feedLinks[i],
                    type: 'click',
                    handle: clickHandle
                });
                revUtils.addEventListener(feedLinks[i], 'click', clickHandle, {passive:false});
            }
        }
    };

    RevSlider.prototype.handleFeedLink = function(type, itemData, e) {

        if (this.preventFeedLinkClick) {
            return;
        }

        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        this.preventFeedLinkClick = true;

        switch (type) {
            case 'author':
                this.loadAuthorFeed(itemData.author, itemData.iconHtml);
                break;
            case 'topic':
                this.loadTopicFeed(itemData.reason_topic_id, itemData.reason_topic, itemData.iconHtml)
                break;
            default:
                // TODO
                break;
        }
    }

    RevSlider.prototype.updateDisplayedItems = function(items, data, passive) {
        // if (!this.data.length) { // if no data remove the container and call it a day
        //     this.destroy();
        //     return;
        // }

        var view = data.view;
        var content = data.content;

        var itemTypes = {
            sponsored: [],
            internal: [],
            undefined: [] // bootleg moonshine?
        }

        var removeItems = [];
        var viewableItems = [];

        itemloop:
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.type) {
                for (var j = 0; j < content.length; j++) {
                    if (item.type == content[j].type) {
                        switch(item.type) {
                            case 'internal':
                                this.internalOffset++
                                break;
                            case 'sponsored':
                                this.sponsoredOffset++;
                                break;
                        }
                        item.view = view;
                        item.viewIndex = i;
                        item.data = content[j];
                        this.updateDisplayedItem(item);
                        viewableItems.push(item);
                        content.splice(j, 1);
                        continue itemloop;
                    }
                }
                removeItems.push(item);
            }

        }

        if (this.grid.perRow > 1) { // relayout if not single column
            if (!this.fontsLoaded && typeof FontFaceObserver !== 'undefined') { // first time wait for the fonts to load
                var fontNormal = new FontFaceObserver('Montserrat');
                var fontBold = new FontFaceObserver('Montserrat', { weight: 500 });
                var that = this;
                Promise.all([fontNormal.load(), fontBold.load()]).then(function () {
                    that.grid.layout();
                }, function() {
                    that.grid.layout();
                }).catch(function(e) {
                    that.grid.layout();
                });
                this.fontsLoaded = true;
            } else {
                this.grid.layout();
            }
        }

        if (removeItems.length && passive !== true) {
            this.options.emitter.emitEvent('removedItems', [removeItems]);
        }

        return {
            viewableItems: viewableItems,
            removeItems: removeItems
        }
    };

    RevSlider.prototype.updateAuthElements = function() {
        var authBoxes = document.querySelectorAll('.rev-auth-box');
        this.isAuthenticated(function(response) {
            if(response) {
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
        });
    };

    RevSlider.prototype.closePersonalizedTransition = function(ev) {
        //document.body.style.overflow = this.bodyOverflow;
        revUtils.removeClass(document.body, 'overflow-hidden');
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
            //document.body.style.overflow = 'hidden';
            revUtils.addClass(document.body, 'rev-blur');
            revUtils.addClass(document.body, 'overflow-hidden');
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
        this.personalizedMask.classList.add('mask-bg-dark');

        this.personalizedContent = document.createElement('div');
        this.personalizedContent.id = 'personalized-transition-wrapper';

        var ucDomain = this.options.domain.charAt(0).toUpperCase() + this.options.domain.slice(1);

        this.personalizedContent.innerHTML = '' +

            '<div id="personalized-transition-logo">' +
            '<div id="personalized-transition-logo-publisher-logo" style="background:#222222 url(' + this.options.brand_logo_secondary + ');background-size:contain;background-position: center center;">' +

            '</div>' +
            '</div>' +

            '<div id="personalized-transition-copyright">by <strong>ENGAGE.IM</strong></div>' +
            '<div id="personalized-transition-headline">' +
            'Welcome!' +
            '</div>' +

            '<div id="personalized-transition-text" class="text-out"><div>Analyzing <strong>' + ucDomain + '</strong> Articles</div></div>' +

            '<div id="personalized-transition-animation">' +

            '<div class="personalized-transition-dna animated" style="display:flex;flex:1;align-items:center;width:100%">' +
            '<div class="personalized-transition-dna-element" style="margin:0 auto">' +
            '<svg class="lds-dna" width="100px"  height="auto"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" style="background: rgba(0, 0, 0, 0) none repeat scroll 0% 0%;"><circle cx="6.451612903225806" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-0.5s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="0s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-0.5s"></animate>' +
            '</circle><circle cx="6.451612903225806" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-1.5s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-0.5s"></animate>' +
            '</circle><circle cx="16.129032258064512" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-0.7s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-0.2s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-0.7s"></animate>' +
            '</circle><circle cx="16.129032258064512" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-1.7s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1.2s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-0.7s"></animate>' +
            '</circle><circle cx="25.806451612903224" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-0.9s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-0.4s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-0.9s"></animate>' +
            '</circle><circle cx="25.806451612903224" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-1.9s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1.4s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-0.9s"></animate>' +
            '</circle><circle cx="35.48387096774193" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-1.1s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-0.6s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-1.1s"></animate>' +
            '</circle><circle cx="35.48387096774193" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-2.1s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1.6s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-1.1s"></animate>' +
            '</circle><circle cx="45.16129032258064" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-1.3s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-0.8s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-1.3s"></animate>' +
            '</circle><circle cx="45.16129032258064" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-2.3s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1.8s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-1.3s"></animate>' +
            '</circle><circle cx="54.838709677419345" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-1.5s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-1.5s"></animate>' +
            '</circle><circle cx="54.838709677419345" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-2.5s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-2s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-1.5s"></animate>' +
            '</circle><circle cx="64.51612903225805" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-1.7s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1.2s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-1.7s"></animate>' +
            '</circle><circle cx="64.51612903225805" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-2.7s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-2.2s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-1.7s"></animate>' +
            '</circle><circle cx="74.19354838709677" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-1.9s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1.4s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-1.9s"></animate>' +
            '</circle><circle cx="74.19354838709677" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-2.9s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-2.4s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-1.9s"></animate>' +
            '</circle><circle cx="83.87096774193547" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-2.1s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1.6s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-2.1s"></animate>' +
            '</circle><circle cx="83.87096774193547" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-3.1s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-2.6s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-2.1s"></animate>' +
            '</circle><circle cx="93.54838709677418" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-2.3s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-1.8s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#941946;#fbacc9;#941946" dur="2s" repeatCount="indefinite" begin="-2.3s"></animate>' +
            '</circle><circle cx="93.54838709677418" cy="50" r="3">' +
            '<animate attributeName="r" times="0;0.5;1" values="2.4000000000000004;3.5999999999999996;2.4000000000000004" dur="2s" repeatCount="indefinite" begin="-3.3s"></animate>' +
            '<animate attributeName="cy" keyTimes="0;0.5;1" values="32;68;32" dur="2s" repeatCount="indefinite" begin="-2.8s" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline"></animate>' +
            '<animate attributeName="fill" keyTimes="0;0.5;1" values="#a2f0fb;#164ba3;#a2f0fb" dur="2s" repeatCount="indefinite" begin="-2.3s"></animate>' +
            '</circle></svg>' +
            '</div>' +
            '</div>' +

            '</div>';

        show();

        setTimeout(function() {
            that.personalizedMask.classList.add('mask-bg-activated');
            var personalizedTransitionLogo = that.personalizedContent.querySelector('div#personalized-transition-logo');
            var personalizedTransitionHeadline = that.personalizedContent.querySelector('div#personalized-transition-headline');
            var personalizedTransitionText = that.personalizedContent.querySelector('div#personalized-transition-text');
            var personalizedTransitionAnimation = that.personalizedContent.querySelector('div#personalized-transition-animation');
            var personalizedTransitionCopyright = that.personalizedContent.querySelector('div#personalized-transition-copyright');

            personalizedTransitionLogo.classList.add('logo-in');
            personalizedTransitionHeadline.classList.add('text-in');
            personalizedTransitionCopyright.classList.add('text-in');

            setTimeout(function() {
                personalizedTransitionText.classList.remove('text-out');
                personalizedTransitionText.classList.add('text-in');
                personalizedTransitionAnimation.classList.add('animation-active');
                setTimeout(function() {
                    personalizedTransitionText.classList.remove('text-in');
                    personalizedTransitionText.classList.add('text-out');
                    setTimeout(function() {
                        personalizedTransitionText.textContent = 'Matching your Interests';
                        personalizedTransitionText.classList.remove('text-out');
                        personalizedTransitionText.classList.add('text-in');
                        setTimeout(function() {
                            personalizedTransitionText.classList.remove('text-in');
                            personalizedTransitionText.classList.add('text-out');
                            setTimeout(function() {
                                personalizedTransitionText.textContent = 'Personalizing your Experience';
                                personalizedTransitionText.classList.remove('text-out');
                                personalizedTransitionText.classList.add('text-in');
                                //setTimeout(function() {

                                //}, 2500);
                            }, 800);
                        }, 2500);
                    }, 800);
                }, 2500);
            }, 800);
        }, 1000);

    };

    RevSlider.prototype.updateInterstsSubscription = function(type, data) {
        switch(type) {
            case 'subscribe':
                this.subscribeToInterest(data);
                break;
            case 'unsubscribe':
                this.unsubscribeFromInterest(data);
                break;
        }
    };

    RevSlider.prototype.subscribeToInterest = function(interestId) {
        var that = this;
        if(isNaN(interestId)){
            that.notify('Invalid Category, please try again.', {label: 'continue', link: '#'});
            return;
        }
        if(that.interests && that.interests.subscribed_ids.indexOf(interestId) == -1) {
            //add post opt
            revApi.request(that.options.actions_api_url + 'interest/add/' + interestId, function(subscribeResponse) {
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

    RevSlider.prototype.unsubscribeFromInterest = function(interestId) {
        var that = this;
        if(isNaN(interestId)){
            that.notify('Invalid Category, please try again.', {label: 'continue', link: '#'});
            return;
        }
        if(that.interests && that.interests.subscribed_ids.indexOf(interestId) !== -1) {
            //add delete opt
            revApi.request(that.options.actions_api_url + 'interest/remove/' + interestId, function(unsubscribeResponse) {
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

    RevSlider.prototype.appendInterestsCarousel = function (grid) {
        var that = this;

        var interestsCarouselElement = document.createElement('div');
        interestsCarouselElement.className = 'rev-content';

        grid.element.appendChild(interestsCarouselElement);

        var added = grid.addItems([interestsCarouselElement]);

        this.interestsCarouselItem = added[0];

        if (that.options.user !== null && that.options.user.hasOwnProperty('interests')) {
            setTimeout(function() { // wait a tick for layout
                that.handleCarousel(that.options.user.interests);
            });
        } else {
            revApi.xhr( that.options.actions_api_url + 'interests?domain=' + that.options.domain, function (data) {
                that.handleCarousel(data);
            });
        }

        return added;
    };

    RevSlider.prototype.handleCarousel = function(data) {
        var that = this;

        var subscribed_ids = [];
        for (var i; i < data.length; i++) {
            subscribed_ids[i] = data[i].id;
        }

        that.interests = {
            list: data,
            subscribed: data, //data.subscribed
            subscribed_ids: subscribed_ids, //data.subscribed_ids
            available: data,
            //recomended: data.recommended,
            count: data.length // data.count
        };

        that.interestsCarouselItem.carousel = new EngageInterestsCarousel({
            domain: that.options.domain,
            item: that.interestsCarouselItem,
            emitter: that.emitter
        });

        that.interestsCarouselItem.carousel.update(data, that.options.authenticated);

        if (that.grid.perRow > 1) { // relayout if not single column
            that.grid.layout();
        }
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

    RevSlider.prototype.notify = function(message, action, type, keep) {
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
        notice.innerHTML = '<p style="margin:0;padding:0;"><a class="notice-action" href="' + (action.link !== undefined ? action.link : '#') + '" style="color:#ffffff;text-transform:uppercase;float:right;font-weight:bold;padding:2px 8px;border-radius:8px;margin-left:5px;background-color:rgba(75,152,223,0.9)" onclick="javascript:return false;">' + action.label + '</a> ' + message + '</p>';
        notice.setAttribute('style','display:block;transition: none;position:static;top:0;left:0;z-index:15000;width:100%;min-height:32px;line-height:16px!important;font-size:10px!important;font-family:"Montserrat";padding:8px 9px;background-color:rgba(0,0,0,0.8);color:#ffffff;border-top:1px solid rgba(75,152,223,0.9)');

        var noticeAction = notice.querySelector('.notice-action');
        if (noticeAction) {
            revUtils.addEventListener(noticeAction, 'click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                notice.remove();
            }, {passive: false});
        }

        var revHead = this.containerElement.querySelector('.rev-head');
        var existingBack = this.containerElement.querySelector('.go-back-bar');

        if(existingBack) {
            existingBack.after(notice);
        } else {
            revHead.after(notice);
        }

        setTimeout(function(){
            notice.style.top = 0;
        }, 504);
        clearTimeout(notice_timeout);

        if (!keep) {
            notice_timeout = setTimeout(this.removeNotify, 6000);
        }
    };

    RevSlider.prototype.removeNotify = function() {
        var notice_panel = document.getElementById('rev-notify-panel');
        if(typeof notice_panel == 'object' && notice_panel != null){
            notice_panel.style.top = '-48px';
            setTimeout(function(){
                notice_panel.remove();
            }, 550);
        }
    }

    RevSlider.prototype.loadMore = function() {
        var self = this;

        self.loadMoreContainer = document.createElement('div');
        self.loadMoreContainer.className = 'rev-loadmore-button';

        self.loadMoreText = document.createElement('div');
        self.loadMoreText.className = 'rev-loadmore-button-text';
        self.loadMoreText.innerHTML = 'LOAD MORE CONTENT';

        revUtils.append(self.loadMoreContainer, self.loadMoreText);
        revUtils.append(self.containerElement, self.loadMoreContainer);

        self.loadMoreListener = function() {
            self.loadMoreText.innerHTML = 'LOADING ...';
            self.loadMoreContainer.className = 'rev-loadmore-button loading';
            revUtils.removeEventListener(self.loadMoreContainer, 'click', self.loadMoreListener);

            var beforeItemCount = self.grid.items.length;

            self
                .promiseCreateBlankCardsRetry(self, beforeItemCount)
                .then(self.promiseFetchCardData)
                .then(self.promiseUpdateCardDataRetry)
                .then(function(input) {
                    self.loadMoreText.innerHTML = 'LOAD MORE CONTENT';
                    self.loadMoreContainer.className = 'rev-loadmore-button';
                    revUtils.addEventListener(self.loadMoreContainer, 'click', self.loadMoreListener);

                    return input;
                })
                .catch(function (error) {
                    // no more content, remove the button and blank cards
                    revUtils.remove(self.loadMoreContainer);

                    self.catchRemoveBlankCards(self, beforeItemCount, error);
                })
                .catch(function (error) {
                    // do nothing since the button and blank cards were removed
                });
        };

        revUtils.addEventListener(self.loadMoreContainer, 'click', self.loadMoreListener);
    };

    RevSlider.prototype.promiseCreateBlankCardsRetry = function(self, beforeItemCount) {
        return self.promiseRetry(function() {
            return self.promiseCreateBlankCards(self, beforeItemCount);
        }, 10, 100);
    };

    RevSlider.prototype.promiseCreateBlankCards = function(self, beforeItemCount) {
        return new Promise(function(resolve, reject) {
            try {
                var rowData = self.createRows(self.grid);

                resolve({self: self, rowData: rowData});
            } catch (e) {
                self.removeBlankCards(beforeItemCount);
                reject(e);
            }
        });
    };

    RevSlider.prototype.promiseFetchCardData = function(input) {
        return new Promise(function(resolve, reject) {
            var self = input.self;
            var rowData = input.rowData;

            revApi.request(self.generateUrl(self.internalOffset, rowData.internalLimit, self.sponsoredOffset, rowData.sponsoredLimit), function(data) {
                // reject if we don't have any content or not enough content
                if (!data.content.length || data.content.length !== (rowData.internalLimit + rowData.sponsoredLimit)) {
                    reject();
                    return;
                }

                resolve({self: self, rowData: rowData, data: data});
            }, function() {
                reject();
            });
        });
    };

    RevSlider.prototype.promiseUpdateCardDataRetry = function(input) {
        return input.self.promiseRetry(function() {
            return input.self.promiseUpdateCardData(input);
        }, 10, 100);
    };

    RevSlider.prototype.promiseUpdateCardData = function(input) {
        return new Promise(function(resolve, reject) {
            try {
                var self = input.self;
                var rowData = input.rowData;
                var data = input.data;

                self.options.contextual_last_sort = data.contextual_last_sort;
                var itemTypes = self.updateDisplayedItems(rowData.items, data);
                self.viewableItems = self.viewableItems.concat(itemTypes.viewableItems);

                resolve({self: self, rowData: rowData, data: data});
            } catch (e) {
                reject(e);
            }
        });
    };

    RevSlider.prototype.promiseRetry = function(fn, times, delay) {
        return new Promise(function(resolve, reject){
            var error;

            var attempt = function() {
                if (times === 0) {
                    reject(error);
                } else {
                    fn().then(resolve)
                        .catch(function(e){
                            times--;
                            error = e;

                            setTimeout(function(){attempt()}, delay);
                        });
                }
            };

            attempt();
        });
    };

    RevSlider.prototype.catchRemoveBlankCards = function(self, beforeItemCount, error) {
        self.removed = true;

        self.removeBlankCards(self, beforeItemCount);

        throw error;
    };

    RevSlider.prototype.removeBlankCards = function(self, beforeItemCount) {
        var remove = self.grid.items.length - beforeItemCount;

        for (var i = 0; i < remove; i++) {
            var popped = self.grid.items.pop();
            popped.remove();
        }

        self.grid.layout();
    };


    RevSlider.prototype.viewability = function() {
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

    RevSlider.prototype.checkVisible = function() {
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

    RevSlider.prototype.registerView = function(viewed) {

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

    RevSlider.prototype.setCommentHTML = function(commentData, includeReplies, truncate, uid) {

        var that = this;
        var includeReplies = typeof includeReplies  === 'undefined' ? false : includeReplies;

        var hasReplies = (commentData.hasOwnProperty('replies') && commentData.replies !== null);
        var isReply = (commentData.hasOwnProperty('comment_id') && commentData.comment_id !== null);
        var isLegacyComment = commentData.user.id === "legacy";

        var commentOwner = false;
        if (that.options.user !== null) {
            var commentDataUserID = commentData.user.id.toLowerCase();
            var optionsDataUserID = '';
            if (that.options.user.hasOwnProperty('id')) {
                optionsDataUserID = that.options.user.id.toLowerCase();
            }

            commentOwner = commentDataUserID === optionsDataUserID;
        }

        var li = document.createElement("li");
        li.id = "comment-" + commentData.id;// + '_' + Date.now();

        if (hasReplies && includeReplies) revUtils.addClass(li, 'has-children');

        var post_author_div = document.createElement("div");
        revUtils.addClass(post_author_div, 'post__author');
        revUtils.addClass(post_author_div, 'author');
        revUtils.addClass(post_author_div, 'vcard');
        revUtils.addClass(post_author_div, 'inline-items');
        var time = revUtils.timeAgo(commentData.created, true);
        var avatar = commentData.user.picture === "" ? "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=" + that.options.default_avatar_url : commentData.user.picture;

        if (avatar.indexOf("gravatar") !== -1) {
            avatar = avatar + '?d=' + that.options.default_avatar_url;
        }

        var display_name = (commentData.user.display_name !== "") ? commentData.user.display_name : (commentData.user.first_name + ' ' + commentData.user.last_name);

        post_author_div.innerHTML = '<img src="' + avatar + '" alt="author">' +
                                    '<div class="author-date">' +
                                        '<a class="h6 post__author-name fn" href="#">' + display_name + '</a>' +
                                        '<div class="post__date">' +
                                            '<time class="published" datetime="' + commentData.created + '"><span>' + time + (time !== 'yesterday' && time !== "" ? ' ago' : '') + '</span></time>' +
                                        '</div>' +
                                    '</div>';
        li.appendChild(post_author_div);


        if (commentOwner) {

            var deleteCommentElement = document.createElement("a");
            revUtils.addClass(deleteCommentElement, 'comment-delete-button');
            deleteCommentElement.innerText = "delete";
            post_author_div.querySelector('time').appendChild(deleteCommentElement);

            revUtils.addEventListener(deleteCommentElement, 'click', function() {
               that.deleteComment(commentData.id, li, uid);
            });

        }

        var comment_body = document.createElement("p");
        comment_body.innerHTML = commentData.comment || commentData.reply;

        if (typeof truncate === "number") {

            var comment_length = isReply ? commentData.reply.length : commentData.comment.length;

            if (comment_length > truncate) {
                comment_body.style = "display:none;";
                var comment_body_truncated = document.createElement("p");
                comment_body_truncated.innerHTML = isReply ? commentData.reply.trunc(truncate) : commentData.comment.trunc(truncate);

                var readMoreCommentElement = document.createElement("a");
                revUtils.addClass(readMoreCommentElement, 'comment-read-more');
                readMoreCommentElement.innerText = "read more";
                comment_body_truncated.appendChild(readMoreCommentElement);
                li.appendChild(comment_body_truncated);

                revUtils.addEventListener(readMoreCommentElement, 'click', function() {
                   this.parentNode.style = "display:none;";
                   this.parentNode.nextSibling.style = "display:block;";
                });
            }
        }

        li.appendChild(comment_body);
        li.setAttribute('data-type', isReply ? 'reply' : 'comment');

        var commentToolBox = document.createElement("div");
        revUtils.addClass(commentToolBox,'rev-comment-tools');

        if (!isReply && !isLegacyComment) {
        var comment_reply_btn = document.createElement("a");
            revUtils.addClass(comment_reply_btn, 'reply');
            comment_reply_btn.innerText = "Reply";
            commentToolBox.appendChild(comment_reply_btn);

            revUtils.addEventListener(comment_reply_btn, 'click', function(ev) {
                that.handleComments(commentData, true, commentData.id, uid);
            });

        }

        if (commentData.up_votes > 0) {
        var comment_likes_count = document.createElement("span");
            revUtils.addClass(comment_likes_count, 'rev-comment-likes-count');
            if (commentData.up_votes <= 1) {
                comment_likes_count.innerText = commentData.up_votes + " like";
            } else {
                comment_likes_count.innerText = commentData.up_votes + " likes";
            }
            commentToolBox.appendChild(comment_likes_count);
        }

        if (!isLegacyComment) {
            var comment_like = document.createElement("a");
                revUtils.addClass(comment_like, 'rev-comment-like');
                if (commentData.vote.vote === "up") {
                    revUtils.addClass(comment_like, 'selected');
                }
                comment_like.innerHTML = '<svg aria-hidden="true" data-prefix="fas" data-icon="thumbs-up" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-thumbs-up fa-w-16 fa-5x"><path d="M104 224H24c-13.255 0-24 10.745-24 24v240c0 13.255 10.745 24 24 24h80c13.255 0 24-10.745 24-24V248c0-13.255-10.745-24-24-24zM64 472c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zM384 81.452c0 42.416-25.97 66.208-33.277 94.548h101.723c33.397 0 59.397 27.746 59.553 58.098.084 17.938-7.546 37.249-19.439 49.197l-.11.11c9.836 23.337 8.237 56.037-9.308 79.469 8.681 25.895-.069 57.704-16.382 74.757 4.298 17.598 2.244 32.575-6.148 44.632C440.202 511.587 389.616 512 346.839 512l-2.845-.001c-48.287-.017-87.806-17.598-119.56-31.725-15.957-7.099-36.821-15.887-52.651-16.178-6.54-.12-11.783-5.457-11.783-11.998v-213.77c0-3.2 1.282-6.271 3.558-8.521 39.614-39.144 56.648-80.587 89.117-113.111 14.804-14.832 20.188-37.236 25.393-58.902C282.515 39.293 291.817 0 312 0c24 0 72 8 72 81.452z" class=""></path></svg>';
                commentToolBox.appendChild(comment_like);

            var comment_dislike = document.createElement("a");
                revUtils.addClass(comment_dislike, 'rev-comment-dislike');
                if (commentData.vote.vote === "down") {
                    revUtils.addClass(comment_dislike, 'selected');
                }
                comment_dislike.innerHTML = '<svg aria-hidden="true" data-prefix="fas" data-icon="thumbs-down" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-thumbs-down fa-w-16 fa-5x"><path d="M0 56v240c0 13.255 10.745 24 24 24h80c13.255 0 24-10.745 24-24V56c0-13.255-10.745-24-24-24H24C10.745 32 0 42.745 0 56zm40 200c0-13.255 10.745-24 24-24s24 10.745 24 24-10.745 24-24 24-24-10.745-24-24zm272 256c-20.183 0-29.485-39.293-33.931-57.795-5.206-21.666-10.589-44.07-25.393-58.902-32.469-32.524-49.503-73.967-89.117-113.111a11.98 11.98 0 0 1-3.558-8.521V59.901c0-6.541 5.243-11.878 11.783-11.998 15.831-.29 36.694-9.079 52.651-16.178C256.189 17.598 295.709.017 343.995 0h2.844c42.777 0 93.363.413 113.774 29.737 8.392 12.057 10.446 27.034 6.148 44.632 16.312 17.053 25.063 48.863 16.382 74.757 17.544 23.432 19.143 56.132 9.308 79.469l.11.11c11.893 11.949 19.523 31.259 19.439 49.197-.156 30.352-26.157 58.098-59.553 58.098H350.723C358.03 364.34 384 388.132 384 430.548 384 504 336 512 312 512z" class=""></path></svg>';
                commentToolBox.appendChild(comment_dislike);

            li.appendChild(commentToolBox);



            //comment voting, remove event handlers as soon as a valid vote is initiated
            var upvote = function() {
                that.handleVotes(commentData, 'up', comment_like, li, function(){
                    revUtils.removeEventListener(comment_like, 'click', upvote);
                    revUtils.addClass(comment_like, 'novak-animate');

                    //revUtils.removeClass(comment_dislike, 'rev-comment-disliked');
                });
            };

            var downvote = function() {
                that.handleVotes(commentData, 'down', comment_dislike, li, function(){
                    revUtils.removeEventListener(comment_dislike, 'click', downvote);
                    revUtils.addClass(comment_dislike, 'novak-animate');

                    //revUtils.removeClass(comment_like, 'rev-comment-liked');
                });
            };

            //comment voting, only add listener on non-current vote
            if (commentData.vote.vote !== "up") {
                revUtils.addEventListener(comment_like, 'click', upvote);
            }
            if (commentData.vote.vote !== "down") {
                revUtils.addEventListener(comment_dislike, 'click', downvote);
            }

            if (hasReplies && includeReplies) {
                var replies_ul = document.createElement("ul");
                revUtils.addClass(replies_ul, 'children');
                var truncate = revDetect.mobile() ? this.options.reply_truncate_length_mobile : this.options.reply_truncate_length;

                for (var key in commentData.replies) {
                    if (commentData.replies.hasOwnProperty(key)) {
                        var reply_li = that.setCommentHTML.call(this, commentData.replies[key],false,truncate,uid);
                        reply_li.setAttribute('data-type', 'reply');
                        replies_ul.appendChild(reply_li);
                    }
                }

                li.appendChild(replies_ul);
            }
        }

        return li;
    };

    RevSlider.prototype.getReactions = function(item) {
        var that = this;

        var params = {
            url: item.data.target_url
        };

        var options = {};
        if (that.options.jwt) {
            options.jwt = that.options.jwt;
        }

        var queryString = Object.keys(params).map(function(key) {
            return key + '=' + params[key];
        }).join('&');

        revApi.xhr(that.options.actions_api_url + 'reactions?' + queryString, function(data) {

            var myReaction = '';

            var likeReactionElement = item.element.querySelector('.rev-reaction-icon');
            likeReactionElement.removeAttribute('data-active');

            var icon = item.element.querySelector('.rev-reaction-like .rev-reaction-icon');
            revUtils.removeClass(icon, 'rev-reaction-icon-', true);
            revUtils.addClass(icon, 'rev-reaction-icon-love');
            revUtils.removeClass(icon, 'rev-reaction-icon-selected');

            if (data.reaction && data.reaction.reaction) {
                myReaction = data.reaction.reaction;
                likeReactionElement.setAttribute('data-active', myReaction);
                likeReactionElement.setAttribute('data-id', data.reaction.id)

                revUtils.addClass(icon, 'rev-reaction-icon-' + myReaction);
                revUtils.addClass(icon, 'rev-reaction-icon-selected');
                revUtils.removeClass(item.element, 'rev-menu-active');
            }

            var reactionHtml = '';

            var reactionCountTotal = 0;
            var reactionCountTotalPos = 0;
            var reactionCountTotalNeg = 0;
            var zIndex = 100;

            for (var reactionCounter = 0; reactionCounter < that.options.reactions.length; reactionCounter++) {
                var reaction = that.options.reactions[reactionCounter];
                var reactionCount = 0;
                if (data.reaction && data.reactions.hasOwnProperty(reaction)) {
                    reactionCount = data.reactions[reaction];
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

            item.element.querySelector('.rev-reaction-menu-item-count-pos .rev-reaction-menu-item-count-inner').innerText = that.milliFormatter(reactionCountTotalPos);
            item.element.querySelector('.rev-reaction-menu-item-count-neg .rev-reaction-menu-item-count-inner').innerText = that.milliFormatter(reactionCountTotalNeg);

            if (myReaction) {
                var reactionTotal = Math.max(1, (reactionCountTotal - 1));
                reactionHtml += '<div class="rev-reaction-count">'+ ((reactionCountTotal == 1) ? 'You reacted' : 'You and ' + reactionTotal + ' other' + (reactionTotal > 1 ? 's' : '') ) + '</div>';
                item.element.querySelector('.rev-reactions-total-inner').innerHTML = reactionHtml;
            } else {
                item.element.querySelector('.rev-reactions-total-inner').innerHTML = '<div class="rev-reaction-count">Be the first to react</div>';
            }


        },null,true,options);
    };

    RevSlider.prototype.addReaction = function(element, item, iconName) {
        var that = this;
        var options = {};
        var data = {
            url: encodeURI(item.data.target_url),
            reaction: iconName
        };
        options.data = JSON.stringify(data);
        options.method = "POST";
        if (that.options.jwt) {
            options.jwt = that.options.jwt;
        }

        revApi.xhr( that.options.actions_api_url + 'reaction/add', function(data) {
            element.setAttribute('data-id', data.id);
        },null,true,options);
    };

    RevSlider.prototype.removeReaction = function(element) {
        var that = this;
        var options = {};
        options.method = "DELETE";
        if (that.options.jwt) {
            options.jwt = that.options.jwt;
        }

        revApi.xhr( that.options.actions_api_url + 'reaction/remove/' + element.getAttribute('data-id'), null, null, true, options);
    };

    RevSlider.prototype.setFeaturedComment = function(item,commentULElement) {

        var that = this;
        var commentCountElement = item.element.querySelector('.rev-comment-count');

        if (that.options.comments_enabled) {

            var params = {
                sort: 'desc',
                start: 0,
                count: 5000,
                url: item.data.target_url
            };

            var options = {};
            if (that.options.jwt) {
                options.jwt = that.options.jwt;
            }

            var max = revDetect.mobile() ? that.options.initial_comments_limit_mobile : that.options.initial_comments_limit;
            var truncate = revDetect.mobile() ? that.options.comment_truncate_length_mobile : that.options.comment_truncate_length;

            var queryString = Object.keys(params).map(function(key) {
                return key + '=' + params[key];
            }).join('&');

            revApi.xhr(that.options.actions_api_url + 'comments?' + queryString, function(data) {
                var total = Object.keys(data).length;
                //api returned no data, read response code
                if (typeof data === "number" && data === 204) {
                    //possible no comments ui here
                    commentCountElement.innerText = '0 comments';

                    //no comments so use legacy if we have it
                    if (item.data.comments && item.data.comments.length) {
                        commentCountElement.innerText = '1 comment';
                        //map legacy data
                        var legacyData = {
                            comment: item.data.comments[0].comment,
                            //created: item.data.comment_time,
                            user:{
                                id:"legacy",
                                display_name: item.data.comments[0].comment_author,
                                picture: item.data.comments[0].comment_author_img
                            }
                        };

                        var legacyCommentLi = that.setCommentHTML(legacyData);
                        commentULElement.appendChild(legacyCommentLi);

                        if (that.grid.perRow > 1) {
                            that.grid.layout();
                        }

                    }

                    return false;

                }

                var commentULElementFULL = document.createElement("ul");
                revUtils.addClass(commentULElementFULL, 'comments-list');
                revUtils.addClass(commentULElementFULL, 'comments-list-scroll');

                var count = 0;
                for (var key in data) {

                    if (data.hasOwnProperty(key)) {
                        var comment_li_full = that.setCommentHTML(data[key],true, truncate,item.data.uid);
                        commentULElementFULL.insertBefore(comment_li_full, commentULElementFULL.childNodes[0]);

                    if (max >= count + 1) {
                        var comment_li = that.setCommentHTML(data[key],true, truncate,item.data.uid);
                        commentULElement.insertBefore(comment_li, commentULElement.childNodes[0]);
                     }

                    if (data[key].replies !== null) {
                        total += Object.keys(data[key].replies).length;
                    }

                     count++;
                    }
                }

                commentCountElement.innerText = total + ' comment' + (total !== 1 ? 's' : '');
                commentCountElement.setAttribute('data-count', total);

                if (/*!revDetect.mobile() &&*/ total > max) {
                    var showmoreLi = document.createElement('li');
                    var showmorebtn = document.createElement('a');
                    revUtils.addClass(showmorebtn, 'engage_load_prev_comments');
                    showmoreLi.style.padding = "0";
                    showmoreLi.style.border = "0 none";
                    showmorebtn.innerText = "Load previous comments";

                    showmoreLi.appendChild(showmorebtn);

                    commentULElement.insertBefore(showmoreLi, commentULElement.childNodes[0]);

                    revUtils.addEventListener(showmorebtn, 'click', function(ev) {

                        commentULElement.parentNode.replaceChild(commentULElementFULL,commentULElement);
                        //keep scroll position after injecting html
                        //showmorebtn.scrollIntoView(true);
                        showmorebtn.parentNode.removeChild(showmorebtn);

                        if (that.grid.perRow > 1) {
                            that.grid.layout();
                        }
                    });
                }

                if (that.grid.perRow > 1) {
                    that.grid.layout();
                }

            },null,true,options);

        } //if enabled

    };

    //triggered by clicking comment button or input on feed item
    RevSlider.prototype.handleComments = function(itemData, focus, replyingTo, uid) {
        var that = this;

        //gulp wont let us use argument defaults (breaks the build)
        replyingTo = typeof replyingTo  === 'undefined' ? null : replyingTo;
        uid = typeof uid  === 'undefined' ? itemData.uid : uid;
        var isReplyMode = replyingTo !== null;

        if (uid !== 'undefined') {
            var article = this.feedItems[uid].element;
            var comment_detail = article.querySelector('.rev-comment-detail');
        }


        if (isReplyMode && (document.getElementById('rev-reply-detail') !== null)) {
            return false;
        } else if (!isReplyMode && comment_detail !== null) {
            return false;
        }

        //create comment overlay div for mobile only
        if (false /*revDetect.mobile()*/ ) {


            var commentDetailsHeaderElement = document.createElement('div');
            revUtils.addClass(commentDetailsHeaderElement, 'rev-comment-detail-header');

            commentDetailsHeaderElement.innerHTML = '<a class="close-detail" style="float: left;width: 20px;height: 20px;">' +
                                                        '<svg aria-hidden="true" data-prefix="fas" data-icon="arrow-left" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-arrow-left fa-w-14" style="font-size: 48px;color: red;">' +
                                                            '<path d="M229.9 473.899l19.799-19.799c4.686-4.686 4.686-12.284 0-16.971L94.569 282H436c6.627 0 12-5.373 12-12v-28c0-6.627-5.373-12-12-12H94.569l155.13-155.13c4.686-4.686 4.686-12.284 0-16.971L229.9 38.101c-4.686-4.686-12.284-4.686-16.971 0L3.515 247.515c-4.686 4.686-4.686 12.284 0 16.971L212.929 473.9c4.686 4.686 12.284 4.686 16.971-.001z" class=""></path>' +
                                                        '</svg>' +
                                                    '</a>';

            if (isReplyMode) {
                var detailExists = document.getElementById('rev-reply-detail') !== null;


                var commentDetailsElement = document.getElementById('rev-reply-detail') || document.createElement('div');
                commentDetailsElement.id = 'rev-reply-detail';

                commentDetailsHeaderElement.innerHTML += '<span style="text-align:center;width: 100%;display: block;font-size: 16px;margin-left: -14px;font-weight: bold;">Replies</span>';
                history.pushState({engage: 'comment_reply'}, null, "#comment-reply");
            } else {
                var detailExists = document.getElementById('rev-comment-detail') !== null;

                var commentDetailsElement = document.getElementById('rev-comment-detail') || document.createElement('div');
                revUtils.addClass(commentDetailsElement, 'rev-comment-detail');
                //commentDetailsElement.id = 'rev-comment-detail';

                commentDetailsHeaderElement.innerHTML += '<div class="rev-headline" style="margin: 0 7px 0 27px;font-size: 12px;font-weight: bold;text-align: center;line-height: 12px;max-height: 25px;overflow: hidden;">' + itemData.headline + '</div>';
                history.pushState({engage: 'comment'}, null, "#comment");
            }

            //only inject if doesnt already exist
            if (!detailExists) {
                itemData.contentInner.appendChild(commentDetailsElement);
                //commentDetailsElement.scrollIntoView();
            }



            //revUtils.addClass(document.body, 'modal-open');

            commentDetailsElement.appendChild(commentDetailsHeaderElement);

            revUtils.addEventListener(commentDetailsElement.querySelector('.close-detail'), 'click', function(ev) {
                revUtils.removeClass(commentDetailsElement, 'comment-slide-in');
                revUtils.addClass(commentDetailsElement, 'comment-slide-out');
                var func = function(){commentDetailsElement.remove();};
                setTimeout(func, 500);
                //revUtils.removeClass(document.body, 'modal-open');
                history.back();
            });

            //create feed container
            var commentFeedElement = document.createElement('div');
            revUtils.addClass(commentFeedElement, 'rev-comment-feed');

            var commentFeedLoader = document.createElement('div');
            revUtils.addClass(commentFeedLoader, 'rev-comment-feed-loading');

            var commentFeedUL = document.createElement('ul');
            revUtils.addClass(commentFeedUL, 'comments-list');
            //commentFeedUL.id = "comments-list";

            //add loader
            commentFeedElement.appendChild(commentFeedLoader);

            //append comments
            commentDetailsElement.appendChild(commentFeedElement);

            //get initial comments
            var params = {
                sort: 'asc',
                start: 0,
                count: 200,
                url: itemData.target_url,
                comment_id: replyingTo
            };

            var options = {};
            if (that.options.jwt) {
                options.jwt = that.options.jwt;
            }

            var queryString = Object.keys(params).map(function(key) {
                return key + '=' + params[key];
            }).join('&');

            var comment_type = isReplyMode ? 'replies' : 'comments';

            revApi.xhr(that.options.actions_api_url + comment_type + '?' + queryString, function(data) {

                var truncate = isReplyMode ? that.options.reply_truncate_length_mobile : that.options.comment_truncate_length_mobile;

                //api returned no data, read response code
                if (typeof data === "number" && data === 204) {
                    //possible UI for no comments
                }

                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        var comment_li = that.setCommentHTML(data[key], true, truncate, uid);
                        commentFeedUL.appendChild(comment_li);
                    }
                }

                //remove loader
                commentFeedElement.removeChild(commentFeedLoader);
                //add UL
                commentFeedElement.appendChild(commentFeedUL);
                //scroll to bottom of comments list
                commentFeedElement.scrollTop = commentFeedElement.scrollHeight;

            },function(){
                //if loading comments api fails, do so gracefully
                commentFeedElement.removeChild(commentFeedLoader);
                var noComments = document.createElement("p");
                noComments.innerText = "No Comments";
                commentFeedElement.appendChild(noComments);
            },true, options);

            // var commentBoxElement = this.createCommentInput("comment");
            // var clearfix = document.createElement('div');
            // clearfix.style = 'clear: both;';
            // commentBoxElement.appendChild(clearfix);
            // commentDetailsElement.appendChild(commentBoxElement);

            // var commentTextAreaElement = commentBoxElement.querySelector('.comment-textarea');
            // var commentInputHiddenTxtElement = commentBoxElement.querySelector('.hidden_text_size');
            // var submitCommentBtn = commentBoxElement.querySelector('.comment-submit-button');

            if (isReplyMode) {
                var ReplyDetailsElement = commentDetailsElement;
            }

            if (focus) {
                //commentTextAreaElement.focus();
            }

            // revUtils.addEventListener(submitCommentBtn, 'click', function(ev){
            //     revUtils.addClass(this, 'novak-animate');


            //         var submitFn = function() {
            //         var submitted_comment_data = that.submitComment(commentTextAreaElement.value, itemData.target_url, replyingTo, function(data,error){

            //             if (typeof data === "number" && data === 201) {
            //                 //for some reason we are getting dual responses, one with the payload and one with the http code
            //                 return;
            //             }

            //             if (error) {
            //                 //currently only want to show error for bad words, but gathering the error msg from response for later use
            //                 var errorMsg = JSON.parse(data.responseText);
            //                 var httpStatus = data.status;
            //                 if (httpStatus === 406) {
            //                     //bad word
            //                     that.displayError(commentBoxElement,"Oops! We've detected a <b>bad word</b> in your comment, Please update your response before submitting.");
            //                 }
            //                 return;
            //             }
            //             var truncate = isReplyMode ? that.options.reply_truncate_length_mobile : that.options.comment_truncate_length_mobile;
            //             var newCommentElement = that.setCommentHTML(data,false,truncate,uid);
            //             commentFeedUL.appendChild(newCommentElement);
            //             commentTextAreaElement.value = "";
            //             commentFeedElement.scrollTop = commentFeedElement.scrollHeight;

            //             that.updateDisplayedItem(that.feedItems[uid]);

            //         });
            //     };

            //     if (that.options.authenticated) {
            //         submitFn();
            //     } else {
            //         that.cardActionAuth(submitFn);
            //     }
            // });

            revUtils.addClass(commentDetailsElement, 'flipped');

            // window.onpopstate = function(event) {
            //     var authbox = document.getElementById('comment_authbox');
            //     var reply_window = document.getElementById('rev-reply-detail');
            //     var comment_window = document.getElementById('rev-comment-detail');

            //     if (authbox === null) {

            //         if (reply_window !== null) {
            //             revUtils.removeClass(reply_window, 'comment-slide-in');
            //             revUtils.addClass(reply_window, 'comment-slide-out');
            //             var func = function(){reply_window.remove();};
            //             setTimeout(func, 500);
            //         } else if (comment_window !== null){
            //             revUtils.removeClass(comment_window, 'comment-slide-in');
            //             revUtils.addClass(comment_window, 'comment-slide-out');
            //             var func = function(){comment_window.remove();};
            //             setTimeout(func, 500);
            //             revUtils.removeClass(document.body, 'modal-open');
            //         }

            //     } else {
            //         revUtils.removeClass(authbox, 'comment-slide-in');
            //         revUtils.addClass(authbox, 'comment-slide-out');
            //         var func = function(){authbox.remove();};
            //         setTimeout(func, 500);
            //     }
            // };

        } else {
            //not mobile

            if (isReplyMode) {
                //inject reply comment box below comment
                var commentLi = document.getElementById("comment-" + replyingTo);
                var commentBoxElement = commentLi.querySelector(".rev-comment-box");

                //if comment box exists, just focus it
                if (commentBoxElement !== null) {
                    var submitCommentBtn = commentBoxElement.querySelector('.comment-submit-button');
                    var commentTextAreaElement = commentBoxElement.querySelector('.comment-textarea');
                    commentTextAreaElement.focus();
                } else {
                    var commentBoxElement = this.createCommentInput("reply");
                    var submitCommentBtn = commentBoxElement.querySelector('.comment-submit-button');
                    var commentTextAreaElement = commentBoxElement.querySelector('.comment-textarea');

                    commentLi.appendChild(commentBoxElement);
                    commentTextAreaElement.focus();
                }

                revUtils.addEventListener(submitCommentBtn, 'click', function(ev){
                    revUtils.addClass(this, 'novak-animate');

                    var submit_comment = function(){
                        that.submitComment(commentTextAreaElement.value, null, replyingTo, function(data){
                            if (typeof data === "number" && data === 201) {
                                //for some reason we are getting dual responses, one with the payload and one with the http code
                                return;
                            }
                            var newCommentElement = that.setCommentHTML(data,false,that.options.reply_truncate_length,itemData.uid);

                            //if child ul exists, append li to it, else create ul
                            var childUL = commentLi.querySelector("ul");
                            if (childUL == null) {
                                childUL = document.createElement("ul");
                                revUtils.addClass(childUL, 'children');
                                commentLi.appendChild(childUL);
                            }
                            childUL.appendChild(newCommentElement);

                            commentBoxElement.remove();
                            //commentTextAreaElement.value = "";
                            // var e = document.createEvent('HTMLEvents');
                            // e.initEvent("keyup", false, true);
                            // commentTextAreaElement.dispatchEvent(e);
                        });
                    }

                    if (that.options.authenticated) {
                        submit_comment();
                    } else {
                        that.tryAuth(article, 'comment', submit_comment);
                    }
                });


            } else {
                //not reply mode

            }
        }

    };


    RevSlider.prototype.handleVotes = function(commentData, voteType, voteButton, commentLi, callback) {
        var that = this;
        var oldComment = commentLi;
        var currentTime = Date.now()/1000;
        var hasExistingVote = (commentData.vote.vote && commentData.vote.vote !== voteType);

        var contentInner = that.getClosestParent(voteButton, '.rev-content-inner');


        if ( (currentTime - commentData.vote.created) < 1 ) {
            //voting too fast
            return false;
        }

        if (commentData.vote.vote && commentData.vote.vote === voteType) {
            //already voted this type
            //this shouldnt be hit, but just in case
            return false;
        }

        //promise
        var canIAddNewVote = new Promise(
            function (resolve, reject) {
                if (hasExistingVote) {
                    //remove existing vote first
                    var options = {method:'DELETE'};
                    if (that.options.jwt) {
                        options.jwt = that.options.jwt;
                    }

                    revApi.xhr(that.options.actions_api_url + 'vote/remove/' + commentData.vote.id, function(data) {
                        if (voteType === "up") {
                            commentData.down_votes = commentData.down_votes - 1;
                        } else {
                            commentData.up_votes = commentData.up_votes - 1;
                        }
                        //old vote removed, continue
                        resolve();

                    },null,false,options);
                } else {
                    //no existing vote, go ahead
                    resolve();
                }
            }
        );


        // call promise
        var tryToVote = function () {
            canIAddNewVote
                .then(function (fulfilled) {
                    if( callback && typeof callback === 'function' ) { callback.call(); }//remove event handler
                    //add new vote
                    var options = {};
                    var data = {
                        action_id: commentData.id,
                        type: commentData.hasOwnProperty("comment_id") ? 'reply' : 'comment',
                        vote: voteType
                    };
                    options.data = JSON.stringify(data);
                    options.method = "POST";
                    if (that.options.jwt) {
                        options.jwt = that.options.jwt;
                    }

                    revApi.xhr(that.options.actions_api_url + 'vote/add', function(data) {

                        if (voteType === "down") {
                            commentData.down_votes = commentData.down_votes + 1;
                        } else {
                            commentData.up_votes = commentData.up_votes + 1;
                        }

                        commentData.vote.action_id = data.action_id;
                        commentData.vote.created = currentTime;
                        commentData.vote.id = data.id;
                        commentData.vote.type = data.type;
                        commentData.vote.vote = data.vote;

                        //replace comment with new data (includeReplies)

                        var truncate = revDetect.mobile() ? that.options.comment_truncate_length_mobile : that.options.comment_truncate_length;

                          var newComment = that.setCommentHTML(commentData, false, truncate);
                          var current_replies = oldComment.querySelector("ul.children");
                          if (current_replies !== null) {
                            newComment.appendChild(current_replies);
                          }
                          oldComment.parentNode.replaceChild(newComment, oldComment);
                    },null,true,options);
                })
                .catch(function (error) {
                    console.log(error.message);
                });
        };

        if (that.options.authenticated) {
            tryToVote();
        } else {
            if (revDetect.mobile()) {
                that.tryAuth(contentInner, 'vote', tryToVote);
            } else {
                that.tryAuth(contentInner, 'vote', tryToVote);
                var articleEl = that.getClosestParent(commentLi, 'article');
                // revUtils.removeClass(document.querySelector('.rev-flipped'), 'rev-flipped');
                // revUtils.addClass(articleEl, 'rev-flipped');

                articleEl.scrollIntoView({ behavior: 'smooth', block: "start" });
            }
            //store users vote for after auth
            that.afterAuth = tryToVote;
        }

    };


    RevSlider.prototype.tryAuth = function(card, engagetype, callback){
        var that = this;
        if (that.options.authenticated) {
            //already authed
            if( callback && typeof callback === 'function' ) { callback.call(); }
        } else {
            //not authed, double check

            var authPromise = new Promise(function(resolve, reject) {
                revApi.xhr(that.options.actions_api_url + 'user/profile', function(data) {
                    resolve(data);
                },function(data){
                    reject(data);
                },true);
            });

            authPromise.then(function(data) {
                //user is logged in, continue whatever they were doing
                that.options.authenticated = true;
                    that.options.user = data;
                    if (data.picture === "") {
                        that.options.user.profile_url = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=" + that.options.default_avatar_url;
                        that.options.user.picture = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=" + that.options.default_avatar_url;
                    }
                    if( callback && typeof callback === 'function' ) { callback.call(); }

            },function(data){
                //no user logged in, send them to auth
                that.cardActionAuth(card, engagetype, callback);
            }).catch(function(e) {
                /* error :( */
            });

        }
    };

    RevSlider.prototype.cardActionAuth = function(card, engagetype, callback){
        var that = this;
        if (that.options.authenticated) {
            //already authed, shouldnt get this far, but just incase
            return false;
        }

        //var article = card.parentNode;
        //card is rev-content-inner
        card.style.height = "600px";
        card.style.overflow = "hidden";

        //re-layout grid for masonry
        that.grid.layout();

        //create authbox
        var engage_auth = document.createElement('div');
        revUtils.addClass(engage_auth,'rev-auth');
        revUtils.addClass(engage_auth,'engage-auth');

        var close_button = document.createElement('a');
        revUtils.addClass(close_button,'rev-auth-close-button');
        close_button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"></path></svg>';

        var engage_auth_box = document.createElement('div');
        revUtils.addClass(engage_auth_box,'rev-auth-box');

        engage_auth.appendChild(close_button);

        if (this.options.brand_logo_secondary) {
           var brandLogoSquare = this.createBrandLogo('rev-auth-site-logo', true);
           engage_auth_box.appendChild(brandLogoSquare);
        }

        var engage_auth_box_inner = document.createElement('div');
        revUtils.addClass(engage_auth_box_inner,'rev-auth-box-inner');
        revUtils.addClass(engage_auth_box_inner,'animated');

        var engage_auth_subline = document.createElement('div');
        revUtils.addClass(engage_auth_subline,'rev-auth-subline');
        engage_auth_subline.innerHTML = that.getDisclosure();

        var engage_auth_almost_done = document.createElement('h2');
        engage_auth_almost_done.innerText = 'Almost Done!';
        engage_auth_almost_done.style = 'text-align:center;'

        var engage_auth_headline = document.createElement('div');
        revUtils.addClass(engage_auth_headline,'rev-auth-headline');
        engage_auth_headline.style.fontSize = '15px';
        engage_auth_headline.style.lineHeight = '22px';
        engage_auth_headline.innerHTML = '<span class="rev-engage-type-txt">Login to save your reaction</span> <br> and personalize your experience';


        engage_auth_box_inner.appendChild(engage_auth_subline);
        engage_auth_box_inner.appendChild(engage_auth_almost_done);
        engage_auth_box_inner.appendChild(engage_auth_headline);

        //create auth buttons
        var engage_auth_facebook = document.createElement('div');
        revUtils.addClass(engage_auth_facebook,'auth-button');
        revUtils.addClass(engage_auth_facebook,'primary-auth-button');
        engage_auth_facebook.innerHTML = '<span><div style="width: 30px;height: 30px;"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 470.513 470.513" style="enable-background:new 0 0 470.513 470.513;fill: #fff;" xml:space="preserve"><path d="M271.521,154.17v-40.541c0-6.086,0.28-10.8,0.849-14.13c0.567-3.335,1.857-6.615,3.859-9.853   c1.999-3.236,5.236-5.47,9.706-6.708c4.476-1.24,10.424-1.858,17.85-1.858h40.539V0h-64.809c-37.5,0-64.433,8.897-80.803,26.691   c-16.368,17.798-24.551,44.014-24.551,78.658v48.82h-48.542v81.086h48.539v235.256h97.362V235.256h64.805l8.566-81.086H271.521z"></path></svg></div></span><strong>Continue</strong> with <strong>facebook</strong>';

        var engage_auth_email = document.createElement('div');
        revUtils.addClass(engage_auth_email,'auth-button');
        revUtils.addClass(engage_auth_email,'secondary-auth-button');
        engage_auth_email.innerHTML = '<span><div style="width: 30px;height: 30px;"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 612 612" style="enable-background:new 0 0 612 612;fill: #7b7b7b;" xml:space="preserve"><path d="M612,306.036C612,137.405,474.595,0,305.964,0S0,137.405,0,306.036c0,92.881,42.14,176.437,107.698,232.599   c0.795,0.795,1.59,1.59,3.108,2.313C163.86,585.473,231.804,612,306.759,612c73.365,0,141.309-26.527,194.363-69.462   c3.108-0.795,5.493-3.108,7.011-5.493C571.451,480.088,612,398.122,612,306.036z M28.117,306.036   c0-153.018,124.901-277.919,277.919-277.919s277.919,124.901,277.919,277.919c0,74.955-29.635,142.826-78.063,192.845   c-7.806-36.719-31.225-99.169-103.072-139.718c16.408-20.311,25.732-46.838,25.732-74.955c0-67.149-54.644-121.793-121.793-121.793   s-121.793,54.644-121.793,121.793c0,28.117,10.119,53.849,25.732,74.955c-72.497,40.549-95.916,103-102.928,139.718   C58.547,449.658,28.117,380.991,28.117,306.036z M212.36,284.93c0-51.536,42.14-93.676,93.676-93.676s93.676,42.14,93.676,93.676   s-42.14,93.676-93.676,93.676S212.36,336.466,212.36,284.93z M132.707,523.023c1.59-22.624,14.022-99.169,98.374-142.104   c21.106,16.408,46.838,25.732,74.955,25.732c28.117,0,54.644-10.119,75.75-26.527c83.556,42.935,96.784,117.89,99.169,142.104   c-47.633,38.237-108.493,61.655-174.052,61.655C240.478,583.955,180.34,561.331,132.707,523.023z"></path></svg></div></span><strong>Continue</strong> with <strong>E-mail</strong>';

        var engage_auth_or = document.createElement('p');
        engage_auth_or.style = 'text-align: center;margin: 10px auto;font-style: italic;color: #545454;';
        engage_auth_or.innerHTML = '- or -';

        var engage_auth_login_option = document.createElement('div');
        revUtils.addClass(engage_auth_login_option,'engage-auth-login-option');
        engage_auth_login_option.innerHTML = 'Already have an Account? <a target="_blank">Login</a>';

        var engage_auth_terms = document.createElement('div');
        revUtils.addClass(engage_auth_terms,'engage-auth-terms');
        engage_auth_terms.innerHTML = '<span><a target="_blank" href="//www.engage.im/privacy.html">Terms and Conditions</a></span>';

        engage_auth_box_inner.appendChild(engage_auth_facebook);
        engage_auth_box_inner.appendChild(engage_auth_or);
        engage_auth_box_inner.appendChild(engage_auth_email);

        engage_auth_box_inner.appendChild(engage_auth_login_option);
        engage_auth_box_inner.appendChild(engage_auth_terms);

        engage_auth_box.appendChild(engage_auth_box_inner);
        engage_auth.appendChild(engage_auth_box);

        card.appendChild(engage_auth);

        //article.parentNode.insertBefore(engage_auth, article.nextSibling);

        //scroll auth into view
        var elementRect = engage_auth.getBoundingClientRect();
        var absoluteElementTop = elementRect.top + window.pageYOffset;
        var middle = absoluteElementTop - (window.innerHeight - elementRect.height) / 2;
        window.scrollTo(0, middle);

        setTimeout(function(){
            revUtils.addClass(engage_auth, 'flipped');
        },50);
        //history.pushState({engage: 'auth'}, "Login to save your comment", "#login");


        var login_register_handler = function(mode){

            //fade out all elms we are changing  //or do some other animation here
            revUtils.addClass(engage_auth_almost_done, 'fade-out');
            revUtils.addClass(engage_auth_headline, 'fade-out');
            revUtils.addClass(engage_auth_facebook, 'fade-out');
            revUtils.addClass(engage_auth_or, 'fade-out');
            revUtils.addClass(engage_auth_email, 'fade-out');
            revUtils.addClass(engage_auth_login_option, 'fade-out');
            revUtils.addClass(engage_auth_terms, 'fade-out');


            revUtils.addClass(engage_auth_box_inner, 'flipOutX');



            setTimeout(function(){
                //remove items we dont need
                engage_auth_or.remove();
                engage_auth_login_option.remove();
                engage_auth_terms.remove();

                //change text elms
                engage_auth_almost_done.innerText = mode === 'register' ? 'Sign-up' : 'Login';
                engage_auth_headline.innerHTML = mode === 'register' ? 'Create an Account to continue' : 'Just enter your e-mail and <br/>password to continue';

                //create form elms
                var engage_auth_email_input_wrap = document.createElement('div');
                revUtils.addClass(engage_auth_email_input_wrap, 'engage-auth-input-wrap');

                var engage_auth_email_input = document.createElement('input');
                revUtils.addClass(engage_auth_email_input, 'engage-auth-input');
                engage_auth_email_input.placeholder = 'E-mail';
                engage_auth_email_input.name = 'email';

                var engage_auth_email_input_error_text = document.createElement('span');
                revUtils.addClass(engage_auth_email_input_error_text, 'error-text');

                engage_auth_email_input_wrap.appendChild(engage_auth_email_input);
                engage_auth_email_input_wrap.appendChild(engage_auth_email_input_error_text);

                var engage_auth_password_input_wrap = document.createElement('div');
                revUtils.addClass(engage_auth_password_input_wrap, 'engage-auth-input-wrap');

                var engage_auth_password_input = document.createElement('input');
                revUtils.addClass(engage_auth_password_input, 'engage-auth-input');
                engage_auth_password_input.placeholder = 'Password';
                engage_auth_password_input.name = 'password';
                engage_auth_password_input.type = 'password';

                var engage_auth_password_input_error_text = document.createElement('span');
                revUtils.addClass(engage_auth_password_input_error_text, 'error-text');

                var engage_auth_password_visibility_on = document.createElement('div');
                revUtils.addClass(engage_auth_password_visibility_on, 'password-visibility');
                engage_auth_password_visibility_on.style.display = 'none';
                engage_auth_password_visibility_on.innerHTML = '<svg aria-hidden="true" data-prefix="far" data-icon="eye" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="svg-inline--fa fa-eye fa-w-18 fa-7x" style=""><path fill="currentColor" d="M569.354 231.631C512.97 135.949 407.81 72 288 72 168.14 72 63.004 135.994 6.646 231.631a47.999 47.999 0 0 0 0 48.739C63.031 376.051 168.19 440 288 440c119.86 0 224.996-63.994 281.354-159.631a47.997 47.997 0 0 0 0-48.738zM288 392c-102.556 0-192.091-54.701-240-136 44.157-74.933 123.677-127.27 216.162-135.007C273.958 131.078 280 144.83 280 160c0 30.928-25.072 56-56 56s-56-25.072-56-56l.001-.042C157.794 179.043 152 200.844 152 224c0 75.111 60.889 136 136 136s136-60.889 136-136c0-31.031-10.4-59.629-27.895-82.515C451.704 164.638 498.009 205.106 528 256c-47.908 81.299-137.444 136-240 136z" class=""></path></svg>';

                var engage_auth_password_visibility_off = document.createElement('div');
                revUtils.addClass(engage_auth_password_visibility_off, 'password-visibility');
                engage_auth_password_visibility_off.style.display = 'block';
                engage_auth_password_visibility_off.innerHTML = '<svg aria-hidden="true" data-prefix="far" data-icon="eye-slash" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="svg-inline--fa fa-eye-slash fa-w-18 fa-7x"><path fill="currentColor" d="M272.702 359.139c-80.483-9.011-136.212-86.886-116.93-167.042l116.93 167.042zM288 392c-102.556 0-192.092-54.701-240-136 21.755-36.917 52.1-68.342 88.344-91.658l-27.541-39.343C67.001 152.234 31.921 188.741 6.646 231.631a47.999 47.999 0 0 0 0 48.739C63.004 376.006 168.14 440 288 440a332.89 332.89 0 0 0 39.648-2.367l-32.021-45.744A284.16 284.16 0 0 1 288 392zm281.354-111.631c-33.232 56.394-83.421 101.742-143.554 129.492l48.116 68.74c3.801 5.429 2.48 12.912-2.949 16.712L450.23 509.83c-5.429 3.801-12.912 2.48-16.712-2.949L102.084 33.399c-3.801-5.429-2.48-12.912 2.949-16.712L125.77 2.17c5.429-3.801 12.912-2.48 16.712 2.949l55.526 79.325C226.612 76.343 256.808 72 288 72c119.86 0 224.996 63.994 281.354 159.631a48.002 48.002 0 0 1 0 48.738zM528 256c-44.157-74.933-123.677-127.27-216.162-135.007C302.042 131.078 296 144.83 296 160c0 30.928 25.072 56 56 56s56-25.072 56-56l-.001-.042c30.632 57.277 16.739 130.26-36.928 171.719l26.695 38.135C452.626 346.551 498.308 306.386 528 256z" class=""></path></svg>';

                engage_auth_password_input_wrap.appendChild(engage_auth_password_input);
                engage_auth_password_input_wrap.appendChild(engage_auth_password_input_error_text);

                engage_auth_password_input_wrap.appendChild(engage_auth_password_visibility_on);
                engage_auth_password_input_wrap.appendChild(engage_auth_password_visibility_off);

                revUtils.addEventListener(engage_auth_password_visibility_off,'click', function(){
                    engage_auth_password_visibility_off.style.display = 'none';
                    engage_auth_password_visibility_on.style.display = 'block';
                    engage_auth_password_input.type = 'text';
                });

                revUtils.addEventListener(engage_auth_password_visibility_on,'click', function(){
                    engage_auth_password_visibility_on.style.display = 'none';
                    engage_auth_password_visibility_off.style.display = 'block';
                    engage_auth_password_input.type = 'password';
                });


                engage_auth_facebook.parentNode.replaceChild(engage_auth_email_input_wrap, engage_auth_facebook);
                engage_auth_email.parentNode.replaceChild(engage_auth_password_input_wrap, engage_auth_email);


                if (mode === "register") {
                    //create additional fields
                    var engage_auth_username_input_wrap = document.createElement('div');
                    revUtils.addClass(engage_auth_username_input_wrap, 'engage-auth-input-wrap');

                    var engage_auth_username_input = document.createElement('input');
                    revUtils.addClass(engage_auth_username_input, 'engage-auth-input');
                    engage_auth_username_input.placeholder = 'Display Name';
                    engage_auth_username_input.name = 'engage_name';

                    var engage_auth_username_input_error_text = document.createElement('span');
                    revUtils.addClass(engage_auth_username_input_error_text, 'error-text');

                    engage_auth_username_input_wrap.appendChild(engage_auth_username_input);
                    engage_auth_username_input_wrap.appendChild(engage_auth_username_input_error_text);

                    engage_auth_box_inner.appendChild(engage_auth_username_input_wrap);
                }


                //fade it all back in // or do other animation
                revUtils.removeClass(engage_auth_almost_done, 'fade-out');
                revUtils.addClass(engage_auth_almost_done, 'fade-in');

                revUtils.removeClass(engage_auth_headline, 'fade-out');
                revUtils.addClass(engage_auth_headline, 'fade-in');

                revUtils.removeClass(engage_auth_email_input_wrap, 'fade-out');
                revUtils.addClass(engage_auth_email_input_wrap, 'fade-in');

                revUtils.removeClass(engage_auth_password_input_wrap, 'fade-out');
                revUtils.addClass(engage_auth_password_input_wrap, 'fade-in');

                revUtils.removeClass(engage_auth_box_inner, 'flipOutX');
                revUtils.addClass(engage_auth_box_inner, 'flipInX');



                if (mode === "register") {
                    var engage_auth_register = document.createElement('a');
                    revUtils.addClass(engage_auth_register, 'engage-auth-register-button');
                    engage_auth_register.innerHTML = '<svg aria-hidden="true" data-prefix="fal" data-icon="chevron-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" class="svg-inline--fa fa-chevron-right fa-w-8 fa-7x"><path fill="currentColor" d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" class=""></path></svg>';
                    engage_auth_box_inner.appendChild(engage_auth_register);
                } else {
                    var engage_auth_login = document.createElement('a');
                    revUtils.addClass(engage_auth_login, 'engage-auth-login-button');
                    engage_auth_login.innerHTML = '<svg aria-hidden="true" data-prefix="fal" data-icon="chevron-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" class="svg-inline--fa fa-chevron-right fa-w-8 fa-7x"><path fill="currentColor" d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" class=""></path></svg>';
                    engage_auth_box_inner.appendChild(engage_auth_login);
                }


                if (engage_auth_login) {

                    var login_fn = function(){
                        //validate email
                        if (revUtils.validateEmail(engage_auth_email_input.value)) {
                            //valid email
                        } else {
                            engage_auth_email_input.focus();
                            engage_auth_email_input_error_text.innerText = 'Please enter a valid email';
                            return false;
                        }

                        //get values
                        var data = {
                            email: engage_auth_email_input.value,
                            password: engage_auth_password_input.value
                        };

                        var options = {};
                        options.data = JSON.stringify(data);
                        options.method = "POST";

                        //revApi.xhr('https://api.engage.im/s2/health', function(data) {
                        revApi.xhr(that.options.actions_api_url + 'user/login', function(data) {
                            that.options.authenticated = true;
                            that.options.user = data.user;
                            localStorage.setItem('engage_jwt',data.token);

                            that.updateCommentAvatars();

                            //continue whatever user was doing prior to auth
                            if( callback && typeof callback === 'function' ) { callback.call(); }

                            // that.engage_auth_personalize();

                            engage_auth.remove();
                            //re-layout grid for masonry
                            that.grid.layout();
                            if (!that.personalized) {
                                that.showPersonalizedTransition();
                                that.personalize();
                            }

                        },function(data){

                            if (data.status === 500) {
                                //bad user
                                engage_auth_email_input.focus();
                                engage_auth_email_input_error_text.innerText = 'Unknown user, Please check your email and try again';
                            } else if (data.status === 403) {
                                //bad password
                                engage_auth_password_input.focus();
                                engage_auth_password_input_error_text.innerText = 'Invalid password, Please check your password and try again';
                            }

                        },true,options);
                    };


                    revUtils.addEventListener(engage_auth_login, 'click', function(){
                        login_fn();
                    });
                    revUtils.addEventListener(engage_auth_password_input, 'keyup', function(ev){
                        if (ev.which === 13) {
                            login_fn();
                        }
                    });
                    revUtils.addEventListener(engage_auth_email_input, 'keyup', function(ev){
                        if (ev.which === 13) {
                            login_fn();
                        }
                    });
                }

                if(engage_auth_register) {

                    var register_fn = function(){
                        //validate email
                        if (revUtils.validateEmail(engage_auth_email_input.value)) {
                            //valid email
                        } else {
                            engage_auth_email_input.focus();
                            engage_auth_email_input_error_text.innerText = 'Please enter a valid email';
                            //return false;
                        }

                        if (engage_auth_password_input.value.length !== 0) {
                            //valid password
                        } else {
                            engage_auth_password_input.focus();
                            engage_auth_password_input.innerText = 'Please enter a password';
                            //return false;
                        }

                        //get values
                        var data = {
                            email: engage_auth_email_input.value,
                            password: engage_auth_password_input.value,
                            display_name: engage_auth_username_input.value
                        };

                        var options = {};
                        options.data = JSON.stringify(data);
                        options.method = "POST";

                        //revApi.xhr('https://api.engage.im/s2/health', function(data) {
                        revApi.xhr(that.options.actions_api_url + 'user/register', function(data) {

                            that.options.authenticated = true;
                            that.options.user = data.user;

                            localStorage.setItem('engage_jwt',data.token);
                            that.updateCommentAvatars();

                            //load interests card

                            //continue whatever user was doing prior to auth
                            if( callback && typeof callback === 'function' ) { callback.call(); }
                            //engage_auth.remove();


                            if (true) {
                                var engage_auth_interests_card = document.createElement('div');
                                revUtils.addClass(engage_auth_interests_card, 'engage-interests-card');
                                revUtils.addClass(engage_auth_interests_card, 'rc-interests');

                                var engage_auth_interests_header = document.createElement('div');
                                revUtils.addClass(engage_auth_interests_header, 'engage-interests-header');
                                engage_auth_interests_header.innerHTML = '<div class="engage-interests-header-icon pull-left">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 57.943 57.943" style="enable-background:new 0 0 57.943 57.943;" xml:space="preserve"><g><path fill="currentColor" d="M57.426,42.053C57.027,37.964,53.974,35,50.156,35c-2.396,0-4.407,1.449-5.684,3.213C43.196,36.449,41.184,35,38.788,35   c-3.818,0-6.871,2.963-7.271,7.052c-0.042,0.268-0.145,1.22,0.226,2.709c0.545,2.197,1.8,4.191,3.631,5.771l8.329,7.126   c0.222,0.19,0.494,0.286,0.768,0.286c0.271,0,0.545-0.095,0.77-0.284l8.331-7.13c1.828-1.575,3.083-3.57,3.629-5.768   C57.57,43.271,57.468,42.319,57.426,42.053z M55.259,44.279c-0.445,1.794-1.479,3.432-2.99,4.732l-7.796,6.672l-7.795-6.67   c-1.514-1.305-2.549-2.941-2.993-4.735c-0.302-1.213-0.194-1.897-0.194-1.897l0.016-0.105C33.751,39.654,35.644,37,38.788,37   c2.189,0,3.974,1.811,4.77,3.605l0.914,2.061l0.914-2.061c0.796-1.795,2.58-3.605,4.77-3.605c3.145,0,5.037,2.654,5.295,5.367   C55.453,42.374,55.563,43.058,55.259,44.279z"></path><path fill="currentColor" d="M27.972,53c-0.634,0-1.266-0.031-1.895-0.078c-0.109-0.008-0.218-0.015-0.326-0.025c-0.634-0.056-1.265-0.131-1.89-0.233   c-0.028-0.005-0.056-0.01-0.084-0.015c-1.322-0.221-2.623-0.546-3.89-0.971c-0.039-0.013-0.079-0.026-0.118-0.04   c-0.629-0.214-1.251-0.45-1.862-0.713c-0.004-0.002-0.009-0.004-0.013-0.006c-0.578-0.249-1.145-0.525-1.705-0.816   c-0.073-0.038-0.147-0.074-0.219-0.113c-0.511-0.273-1.011-0.568-1.504-0.876c-0.146-0.092-0.291-0.185-0.435-0.279   c-0.454-0.297-0.902-0.606-1.338-0.933c-0.045-0.034-0.088-0.07-0.133-0.104c0.032-0.018,0.064-0.036,0.096-0.054l7.907-4.313   c1.36-0.742,2.205-2.165,2.205-3.714l-0.001-3.602l-0.23-0.278c-0.022-0.025-2.184-2.655-3.001-6.216l-0.091-0.396l-0.341-0.221   c-0.481-0.311-0.769-0.831-0.769-1.392v-3.545c0-0.465,0.197-0.898,0.557-1.223l0.33-0.298v-5.57l-0.009-0.131   c-0.003-0.024-0.298-2.429,1.396-4.36C22.055,10.837,24.533,10,27.972,10c3.426,0,5.896,0.83,7.346,2.466   c1.692,1.911,1.415,4.361,1.413,4.381l-0.009,5.701l0.33,0.298c0.359,0.324,0.557,0.758,0.557,1.223v3.545   c0,0.713-0.485,1.36-1.181,1.575c-0.527,0.162-0.823,0.723-0.66,1.25c0.162,0.527,0.72,0.821,1.25,0.66   c1.55-0.478,2.591-1.879,2.591-3.485v-3.545c0-0.867-0.318-1.708-0.887-2.369v-4.667c0.052-0.52,0.236-3.448-1.883-5.864   C34.996,9.065,32.013,8,27.972,8s-7.024,1.065-8.867,3.168c-2.119,2.416-1.935,5.346-1.883,5.864v4.667   c-0.568,0.661-0.887,1.502-0.887,2.369v3.545c0,1.101,0.494,2.128,1.34,2.821c0.81,3.173,2.477,5.575,3.093,6.389v2.894   c0,0.816-0.445,1.566-1.162,1.958l-7.907,4.313c-0.252,0.137-0.502,0.297-0.752,0.476C5.748,41.792,2.472,35.022,2.472,27.5   c0-14.061,11.439-25.5,25.5-25.5s25.5,11.439,25.5,25.5c0,0.553,0.447,1,1,1s1-0.447,1-1c0-15.163-12.337-27.5-27.5-27.5   s-27.5,12.337-27.5,27.5c0,8.009,3.444,15.228,8.926,20.258l-0.026,0.023l0.892,0.752c0.058,0.049,0.121,0.089,0.179,0.137   c0.474,0.393,0.965,0.766,1.465,1.127c0.162,0.117,0.324,0.235,0.489,0.348c0.534,0.368,1.082,0.717,1.642,1.048   c0.122,0.072,0.245,0.142,0.368,0.212c0.613,0.349,1.239,0.678,1.88,0.98c0.047,0.022,0.095,0.042,0.142,0.064   c2.089,0.971,4.319,1.684,6.651,2.105c0.061,0.011,0.122,0.022,0.184,0.033c0.724,0.125,1.456,0.225,2.197,0.292   c0.09,0.008,0.18,0.013,0.271,0.021C26.47,54.961,27.216,55,27.972,55c0.553,0,1-0.447,1-1S28.525,53,27.972,53z"></path></g></svg>' +
                                '</div>' +
                                '<div class="engage-interests-header-text pull-left">' +
                                    '<h2>Personalize<br>' +
                                    '<i>your</i> Experience</h2>' +
                                '</div>' +
                                '<div class="clearfix"></div>' +
                                '<p>Pick at least <strong>3</strong> topics you like, or automatically with Facebook</p>';


                                engage_auth_interests_card.appendChild(engage_auth_interests_header);


                                // var engage_auth_interests_search_bar = document.createElement('div');
                                // revUtils.addClass(engage_auth_interests_search_bar, 'engage_auth_interests_search_bar');
                                // engage_auth_interests_search_bar.style.height = '40px';

                                // var engage_auth_interests_search_wrap = document.createElement('div');
                                // revUtils.addClass(engage_auth_interests_search_wrap, 'engage_auth_interests_search_wrap');
                                // revUtils.addClass(engage_auth_interests_search_wrap, 'pull-left');
                                // engage_auth_interests_search_wrap.style = 'height: 40px;width: 100%;margin-right: -100px;';

                                // var engage_auth_interests_search_toggle = document.createElement('div');
                                // revUtils.addClass(engage_auth_interests_search_toggle, 'engage_auth_interests_search_toggle');
                                // revUtils.addClass(engage_auth_interests_search_toggle, 'pull-left');
                                // engage_auth_interests_search_toggle.style = 'width:100px; height: 40px;';

                                // engage_auth_interests_search_bar.appendChild(engage_auth_interests_search_wrap);
                                // engage_auth_interests_search_bar.appendChild(engage_auth_interests_search_toggle);
                                // engage_auth_interests_card.appendChild(engage_auth_interests_search_bar);

                                var engage_auth_finish_buton = document.createElement('a');
                                revUtils.addClass(engage_auth_finish_buton, 'engage-auth-register-button');
                                engage_auth_finish_buton.innerHTML = '<svg aria-hidden="true" data-prefix="fal" data-icon="chevron-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" class="svg-inline--fa fa-chevron-right fa-w-8 fa-7x"><path fill="currentColor" d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" class=""></path></svg>';
                                engage_auth_finish_buton.style.display = "none";


                                var engage_auth_interests = document.createElement('div');
                                revUtils.addClass(engage_auth_interests, 'grid');
                                engage_auth_interests.innerHTML = '';

                                revApi.xhr( that.options.actions_api_url + 'interests?domain=' + that.options.domain, function (data) {

                                    for(var i = 0; i < data.length; i++) {

                                        var new_interest = document.createElement('div');
                                        new_interest.id = 'interest_cell_' + data[i].id;
                                        new_interest.setAttribute('data-id', data[i].id);
                                        new_interest.setAttribute('data-interest', data[i].title);
                                        new_interest.setAttribute('data-selected', false);
                                        new_interest.style.backgroundImage = 'url(' + data[i].image + ')';
                                        revUtils.addClass(new_interest, 'interests-cell');
                                        revUtils.addClass(new_interest, 'with-img');
                                        revUtils.addClass(new_interest, 'interests_'+data[i].id);
                                        revUtils.addClass(new_interest, 'deselected');
                                        new_interest.innerHTML = '<div class="interest-wrap">' +
                                                '<div class="rc-circle-tag off"><span class="checkmark interest-checked">&nbsp;</span></div>' +
                                                '<div class="interest-title">'+data[i].title+'</div>' +
                                            '</div>&nbsp;';

                                        revUtils.addEventListener(new_interest, 'click', function(){
                                            this.classList.toggle('selected');
                                            this.classList.toggle('deselected');

                                            var interest = {
                                                id: this.getAttribute("data-id"),
                                                name: this.getAttribute("data-interest")
                                            };

                                            that.handleInterests(interest, engage_auth_finish_buton);
                                        });

                                        engage_auth_interests.appendChild(new_interest);

                                    }

                                    var clearfix = document.createElement('div');
                                    revUtils.addClass(clearfix, 'clearfix');
                                    engage_auth_interests.appendChild(clearfix);

                                    engage_auth_interests_card.appendChild(engage_auth_interests);
                                    engage_auth_interests_card.appendChild(engage_auth_finish_buton);

                                });

                                // engage_auth_interests_card.appendChild(engage_auth_interests);

                                revUtils.addClass(engage_auth_interests, 'animated');
                                revUtils.addClass(engage_auth_interests, 'flipInX');




                                // for (var i = 0; i < engage_auth_interests.childNodes.length; i++) {

                                //     revUtils.addEventListener(engage_auth_interests.childNodes[i], 'click', function(){
                                //         this.classList.toggle('selected');
                                //         this.classList.toggle('deselected');

                                //         var interest = {
                                //             id: this.getAttribute("data-id"),
                                //             name: this.getAttribute("data-interest")
                                //         };

                                //         that.handleInterests(interest, engage_auth_finish_buton);
                                //     });

                                // }

                                //card.appendChild(engage_auth_interests_card);
                                //engage_auth.parentNode.replaceChild(engage_auth_interests_card,engage_auth);
                                engage_auth_box.parentNode.replaceChild(engage_auth_interests_card,engage_auth_box);


                                revUtils.addEventListener(engage_auth_finish_buton, 'click', function(){
                                    engage_auth.remove();
                                    //re-layout grid for masonry
                                    that.grid.layout();
                                    if (!that.personalized) {
                                       that.showPersonalizedTransition();
                                        that.personalize();
                                    }
                                });

                            }

                        },null,false,options);
                    };

                    revUtils.addEventListener(engage_auth_register, 'click', function(){
                        register_fn();
                    });
                    revUtils.addEventListener(engage_auth_password_input, 'keyup', function(ev){
                        if (ev.which === 13) {register_fn();}
                    });
                    revUtils.addEventListener(engage_auth_email_input, 'keyup', function(ev){
                        if (ev.which === 13) {register_fn()};
                    });
                    revUtils.addEventListener(engage_auth_username_input, 'keyup', function(ev){
                        if (ev.which === 13) {register_fn()};
                    });

                }

                //monitor valid email input only if error already exisits
                revUtils.addEventListener(engage_auth_email_input, 'keyup', function(ev) {
                    if (engage_auth_email_input_error_text.innerText !== '') {
                        if (revUtils.validateEmail(engage_auth_email_input.value)) {
                            engage_auth_email_input_error_text.innerText = '';
                        }
                    }
                });

            },500);

        };


        //continue with facebook
        revUtils.addEventListener(engage_auth_facebook, 'click', function(){

            var url = that.options.actions_api_url + "facebook/login";
            var popup = window.open(url, 'Login', 'resizable,width=600,height=800');

            var closedCheckInterval = setInterval(function() {
                if (popup.closed) {
                    that.options.emitter.emitEvent('updateButtonElementInnerIcon');
                    that.isAuthenticated(function(response) {
                        that.options.emitter.emitEvent('updateButtons', [response]);

                        if (response === true) {
                            engage_auth.remove();
                            //re-layout grid for masonry
                            that.grid.layout();


                            that.updateAuthElements();
                            that.processQueue();

                            if (!that.personalized) {
                                that.showPersonalizedTransition();
                                that.personalize();
                            }

                            //post comment
                            if( callback && typeof callback === 'function' ) { callback.call(); }
                            that.updateCommentAvatars();

                        }
                        revDisclose.postMessage();
                    });
                    clearInterval(closedCheckInterval);
                }
            }, 100);
        });

        //continue with email
        revUtils.addEventListener(engage_auth_email, 'click', function(){
            login_register_handler('register');
        });

        //already have acct, login
        revUtils.addEventListener(engage_auth_login_option.querySelector('a'), 'click', function(){
            login_register_handler('login');
        });

        revUtils.addEventListener(close_button, 'click', function(ev) {
            revUtils.removeClass(engage_auth, 'flipped');
            revUtils.addClass(engage_auth, 'comment-slide-out');
            card.style = "";
            var func = function(){
                engage_auth.remove();
                //re-layout grid for masonry
                that.grid.layout();
                card.scrollIntoView();
            };
            setTimeout(func, 500);
            //history.back();
        });

        //update authbox items
        setTimeout(function() {
            var engagetxt = engage_auth_headline.querySelector('.rev-engage-type-txt');

            if (engagetxt) {
                engagetxt.innerHTML = 'Sign-up to save your ' + engagetype;
            }

            that.resizeHeadlineLines(engage_auth_headline);

            // reduce margins based on vertical space
            var innerHeight = brandLogoSquare ? (brandLogoSquare.offsetHeight + engage_auth_box_inner.offsetHeight) : engage_auth_box_inner.offsetHeight;

            if (engage_auth.offsetHeight < innerHeight) {
                var sanity = 0;
                var zeroed = [];

                var subline = engage_auth_box_inner.querySelector('.rev-auth-subline');
                var button = engage_auth_box_inner.querySelector('.auth-button');
                // var buttonline = item.element.querySelector('.rev-auth-buttonline');
                // var terms = item.element.querySelector('.rev-auth-terms');

                while ((sanity < 20) && (zeroed.length < 5) && (engage_auth.offsetHeight < innerHeight)) {

                    var sublineMarginTop = parseInt(revUtils.getComputedStyle(engage_auth_subline, 'margin-top'));
                    if (sublineMarginTop > 1) {
                        engage_auth_subline.style.marginTop = (sublineMarginTop - 1) + 'px';
                    } else if(!zeroed.indexOf('subline')) {
                        zeroed.push('subline');
                    }

                    var headlineMarginTop = parseInt(revUtils.getComputedStyle(engage_auth_headline, 'margin-top'));
                    if (headlineMarginTop > 3) {
                        engage_auth_headline.style.marginTop = (headlineMarginTop - 2) + 'px';
                    } else if(!zeroed.indexOf('headline')) {
                        zeroed.push('headline');
                    }

                    var buttonMarginTop = parseInt(revUtils.getComputedStyle(button, 'margin-top'));
                    if (buttonMarginTop > 3) {
                        button.style.marginTop = (buttonMarginTop - 2) + 'px';
                    } else if(!zeroed.indexOf('button')) {
                        zeroed.push('button');
                    }

                    // var buttonlineMarginTop = parseInt(revUtils.getComputedStyle(buttonline, 'margin-top'));
                    // if (buttonlineMarginTop > 3) {
                    //     buttonline.style.marginTop = (buttonlineMarginTop - 1) + 'px';
                    // } else if(!zeroed.indexOf('buttonline')) {
                    //     zeroed.push('buttonline');
                    // }

                    // var termsMarginTop = parseInt(revUtils.getComputedStyle(terms, 'margin-top'));
                    // if (termsMarginTop > 1) {
                    //     terms.style.marginTop = (termsMarginTop - 2) + 'px';
                    // } else if(!zeroed.indexOf('terms')) {
                    //     zeroed.push('terms');
                    // }

                    innerHeight = brandLogoSquare ? (brandLogoSquare.offsetHeight + engage_auth_box_inner.offsetHeight) : engage_auth_box_inner.offsetHeight;
                    sanity++;
                }
            }

            if (brandLogoSquare) {
                brandLogoSquare.style.width = brandLogoSquare.offsetHeight + 'px';
            }

            if (!that.options.authenticated) {
                //old flip logic
                // revUtils.removeClass(document.querySelector('.rev-flipped'), 'rev-flipped');
                // revUtils.addClass(item.element, 'rev-flipped');
            }
        }, 0);





    };


    RevSlider.prototype.deleteComment = function(commentID, comment_el, uid) {
        var that = this;
        var mode = comment_el.getAttribute("data-type");

        var options = {method:'DELETE'};
        if (that.options.jwt) {
            options.jwt = that.options.jwt;
        }

        revApi.xhr(this.options.actions_api_url + mode + '/delete/' + commentID, function(data) {

            if (!revDetect.mobile()) {
                //update count
                var countEl = that.getClosestParent(comment_el, '.rev-content-inner').querySelector('.rev-reactions-total > .rev-comment-count');
                var currentCount = countEl.getAttribute('data-count');

                countEl.setAttribute('data-count', currentCount - 1);
                countEl.innerText = (currentCount - 1) + ' comment' + ((currentCount - 1) !== 1 ? 's' : '');
            }

            //remove comment from ui
            revUtils.remove(comment_el);
            //re-layout grid for masonry
            that.grid.layout();
            //update feed item
            //that.updateDisplayedItem(that.feedItems[uid]);

        },null,true,options);
    };

    RevSlider.prototype.submitComment = function(comment, url, commentID, callback) {

        if (comment === "") {
            return false;
        }
        url = (typeof url === "undefined") ? null : url;

        var that = this;
        var options = {};
        var data = {};
        var isReplyMode = (url === null && commentID !== null);

        data.comment = String(comment).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        data.url = url;

        if (isReplyMode) {
            data.comment_id = commentID;
            data.reply = data.comment;
        }

        options.data = JSON.stringify(data);
        options.method = "POST";
        if (that.options.jwt) {
            options.jwt = that.options.jwt;
        }


        //send comment xhr
        var comment_type = isReplyMode ? 'reply' : 'comment';
        var newData;
        revApi.xhr(that.options.actions_api_url + comment_type + '/create', function(response) {
            if( callback && typeof callback === 'function' ) { callback.call(this, response); }
        },function(response){
            if( callback && typeof callback === 'function' ) { callback.call(this, response,true); }
            if (response.status === 406) {
                //Bad Word
                //if( callback && typeof callback === 'function' ) { callback.call(this, response,true); }
            }
        },true,options);

    };

    RevSlider.prototype.createCommentInput = function(){

        var commentBoxElement = document.createElement('div');
        revUtils.addClass(commentBoxElement, 'rev-comment-box');
        commentBoxElement.style = 'padding: 8px;background: #fafbfd;border-top: 1px solid #e6ecf5;'; //add this to css file

        var commentUserAvatar = document.createElement('div');
        revUtils.addClass(commentUserAvatar, 'comment-avatar');
        commentUserAvatar.style.backgroundImage = 'url(' + (typeof this.options.authenticated && this.options.user !== null && this.options.user.hasOwnProperty("picture") ? this.options.user.picture : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=" + this.options.default_avatar_url) + ')';
        commentBoxElement.appendChild(commentUserAvatar);

        var commentInputWrapElement = document.createElement('div');
        revUtils.addClass(commentInputWrapElement, 'comment-input');
        commentInputWrapElement.style = 'padding: 0px 0 0 34px;';
        commentBoxElement.appendChild(commentInputWrapElement);


        var commentInputHiddenTxtElement = document.createElement('div');
        revUtils.addClass(commentInputHiddenTxtElement, 'hidden_text_size');
        commentInputHiddenTxtElement.style = 'min-height: 30px;width: 100%;border-radius: 4px;padding: 4px 70px 4px 10px;position: absolute;z-index: -2000;border: 0 none;color: #ffffff00;user-select: none;';
        //commentInputWrapElement.appendChild(commentInputHiddenTxtElement);

        var commentTextAreaElement = document.createElement('textarea');
        revUtils.addClass(commentTextAreaElement, 'comment-textarea');
        commentTextAreaElement.placeholder = 'Engage in this discussion!';
        commentInputWrapElement.appendChild(commentTextAreaElement);

        var submitCommentBtn = document.createElement('a');
        revUtils.addClass(submitCommentBtn, 'comment-submit-button');
        submitCommentBtn.style = 'display:none;';
        submitCommentBtn.innerHTML = '<svg aria-hidden="true" data-prefix="fas" data-icon="paper-plane" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-paper-plane fa-w-16 fa-3x"><path d="M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z" class=""></path></svg>';
        commentInputWrapElement.appendChild(submitCommentBtn);

        var clearfix = document.createElement('div');
        clearfix.style = 'clear: both;';
        commentBoxElement.appendChild(clearfix);

        //Adjust comment textarea height, 1 - 4 lines
        revUtils.addEventListener(commentTextAreaElement, 'keyup', function(ev) {
            submitCommentBtn.style.display = 'inline-block';
            // commentInputHiddenTxtElement.innerText = commentTextAreaElement.value;
            // if (commentInputHiddenTxtElement.scrollHeight < 88) {
            //     commentTextAreaElement.style.height = (commentInputHiddenTxtElement.scrollHeight + 2) + "px";
            // }
        });

        return commentBoxElement;
    };

    RevSlider.prototype.getUserProfile = function(callback){
        var that = this;
        revApi.xhr(that.options.actions_api_url + 'user/profile', function(data) {
            //todo check for errors before setting this
            that.options.authenticated = true;

            that.options.user = data;
            if (data.picture === "") {
                that.options.user.profile_url = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=" + that.options.default_avatar_url;
                that.options.user.picture = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=" + that.options.default_avatar_url;
            }

            if (data.picture.indexOf("gravatar") !== -1) {
                data.picture = data.picture + '?d=' + that.options.default_avatar_url;
            }


            callback.call(that);
            //localStorage.setItem('engage_jwt',data.token);
        },function(data){
            //error
        },true);
    };

    RevSlider.prototype.updateTimeAgo = function(mode){
        var times = document.querySelectorAll('time.published'), i;
        for (i = 0; i < times.length; ++i) {
            var newTimeStr = revUtils.timeAgo(times[i].getAttribute("datetime"));
            times[i].querySelector("span").innerText = newTimeStr + (newTimeStr !== 'yesterday' ? ' ago' : '');
        }
    };

    RevSlider.prototype.getClosestParent = function (elem, selector) {
        // Element.matches() polyfill
        if (!Element.prototype.matches) {
            Element.prototype.matches =
                Element.prototype.matchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                function(s) {
                    var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                        i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) {}
                    return i > -1;
                };
        }

        // Get the closest matching element
        for ( ; elem && elem !== document; elem = elem.parentNode ) {
            if ( elem.matches( selector ) ) return elem;
        }
        return null;

    };

    RevSlider.prototype.updateCommentAvatars = function() {
        var that = this;
        // revApi.xhr(that.options.actions_api_url + 'user/profile', function(data) {
        //     if (data && data.picture) {
        //         var styleNode = document.createElement('style');
        //         styleNode.type = "text/css";
        //         // browser detection (based on prototype.js)
        //         if(!!(window.attachEvent && !window.opera)) {
        //             styleNode.styleSheet.cssText = '.comment-avatar { background-image: url('+data.picture+')!important; }';
        //         } else {
        //             var styleText = document.createTextNode('.comment-avatar { background-image: url('+data.picture+')!important; }');
        //             styleNode.appendChild(styleText);
        //         }
        //         document.getElementsByTagName('head')[0].appendChild(styleNode);
        //     }
        // });

        if (that.options.user && that.options.user.picture) {
            var styleNode = document.createElement('style');
            styleNode.type = "text/css";
            // browser detection (based on prototype.js)
            if(!!(window.attachEvent && !window.opera)) {
                styleNode.styleSheet.cssText = '.comment-avatar { background-image: url('+that.options.user.picture+')!important; }';
            } else {
                var styleText = document.createTextNode('.comment-avatar { background-image: url('+that.options.user.picture+')!important; }');
                styleNode.appendChild(styleText);
            }
            document.getElementsByTagName('head')[0].appendChild(styleNode);
        }



    };

    RevSlider.prototype.handleInterests = function(interest, button) {

        var that = this;


        if (that.selected_interests.hasOwnProperty(interest.id)) {
            //remove interest
            delete that.selected_interests[interest.id];

            var options = {method:'DELETE'};
            if (that.options.hasOwnProperty("jwt")) {
                options.jwt = that.options.jwt;
            }

            revApi.xhr(that.options.actions_api_url + 'interest/remove/' + interest.id, function(data) {
                //console.log(data);
            },null,false,options);

        } else {
            //add interest
            that.selected_interests[interest.id] = interest.name;

            var options = {method:'POST'};
            if (that.options.hasOwnProperty("jwt")) {
                options.jwt = that.options.jwt;
            }

            revApi.xhr(that.options.actions_api_url + 'interest/add/' + interest.id, function(data) {
                //console.log(data);
            },null,false,options);
        }

        var count = Object.keys(that.selected_interests).length;
        if (count >= 3) {
            button.style.display = "block";
        } else {
            button.style.display = "none";
        }

        // if (!that.personalized) {
        //     that.showPersonalizedTransition();
        //     that.personalize();
        // }

    };

    RevSlider.prototype.displayError = function(element, error){
        var errorEl = document.createElement('div');
        revUtils.addClass(errorEl, 'comment-error-notification');
        revUtils.addClass(errorEl, 'fade-out');
        revUtils.addClass(errorEl, 'is-paused');
        errorEl.innerHTML = error;

        element.insertBefore(errorEl,element.childNodes[0]);

        var tO = setTimeout(function(){
            revUtils.removeClass(errorEl, 'is-paused');
        },6000);
        var tO2 = setTimeout(function(){
            errorEl.remove();
        },7000);
    };

    RevSlider.prototype.createUserMenu = function (options) {
        return new EngageUserMenu(options);
    };

    String.prototype.trunc = String.prototype.trunc ||
      function(n){
          return (this.length > n) ? this.substr(0, n-1) + '&hellip;&nbsp;&nbsp;' : this;
      };

    return RevSlider;
}));
