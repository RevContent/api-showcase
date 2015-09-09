/*

Project: RevFlickity
Version: 1
Author: michael@revcontent.com

RevFlickity({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    perRow: {
        xxs: 1,
        xs: 1,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
        xxl: 7
    },
    devices: [
        'phone', 'tablet', 'desktop'
    ]
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevFlickity = factory(window, window.revUtils, window.revDetect, window.revApi);

}( window, function factory(window, revUtils, revDetect, revApi) {
'use strict';

    var RevFlickity = function(opts) {
        var defaults = {
           per_row: {
                xxs: 1,
                xs: 1,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            next_width: 60,
            next_effect: true,
            sponsored: 10,
            dots: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/'
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

        var that = this;
        //append injrected style
        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-flickity');
        // create flickity
        this.flickity = new Flickity( '#' + this.options.id, {
            prevNextButtons: revDetect.mobile() ? false : true,
            pageDots: this.options.dots,
            cellAlign: 'left'
        });
        // wrapper class
        revUtils.addClass(this.flickity.element, 'rev-flickity');
        // HACK for Chrome using emitter to wait for element container to be ready
        this.emitter = new EventEmitter();
        this.getContainerWidth();
        this.emitter.on('containerReady', function() {
            that.setUp();
            that.getData();
        });
    };

    RevFlickity.prototype.appendElements = function() {
        var header = document.createElement('h2');
        header.innerHTML = this.options.header;
        revUtils.addClass(header, 'rev-header');
        revUtils.prepend(this.flickity.element, header);

        var sponsored = document.createElement('div');
        revUtils.addClass(sponsored, 'rev-sponsored');
        sponsored.innerHTML = '<a href="http://revcontent.com">Sponsored by Revcontent</a>';
        if (this.options.rev_position == 'top_right') {
            revUtils.addClass(sponsored, 'top-right')
            revUtils.prepend(this.flickity.element, sponsored);
        } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
            revUtils.addClass(sponsored, this.options.rev_position.replace('_', '-'));
            revUtils.append(this.flickity.element, sponsored);
        }
    }

    RevFlickity.prototype.getContainerWidth = function() {
        // HACK for Chrome - sometimes the width will be 0
        var that = this;
        function check() {
            var containerWidth = that.flickity.element.offsetWidth;
            if(containerWidth > 0) {
                that.containerWidth = containerWidth;
                // emit event so we can continue
                that.emitter.emit('containerReady');
            }else {
                setTimeout(check, 0);
            }
        }
        // start the check
        setTimeout(check, 0);
    };

    RevFlickity.prototype.setUp = function() {
        // determine elements per row based on container width
        if (this.containerWidth >= 1500) {
            this.per_row = this.options.per_row.xxl;
        }else if (this.containerWidth >= 1250) {
            this.per_row = this.options.per_row.xl;
        }else if (this.containerWidth >= 1000) {
            this.per_row = this.options.per_row.lg;
        }else if (this.containerWidth >= 750) {
            this.per_row = this.options.per_row.md;
        }else if (this.containerWidth >= 500) {
            this.per_row = this.options.per_row.sm;
        }else if (this.containerWidth >= 250) {
            this.per_row = this.options.per_row.xs;
        }else {
            this.per_row = this.options.per_row.xxs;
        }
        // divide container width by per row to determine column width, account for width of halved/next item
        this.columnWidth = ((this.containerWidth - this.options.next_width) / this.per_row);
    };

    RevFlickity.prototype.getData = function() {
        var url = this.options.url + '?api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&sponsored_count=' + this.options.sponsored + '&sponsored_offset=0&internal_count=0&api_source=flick';
        var that = this;
        revApi.request(url, function(resp) {
            for (var i = 0; i < resp.length; i++) {
                // for each response append
                var html = '<div class="rev-ad">' +
                            '<a href="'+ resp[i].url +'" target="_blank">' +
                                '<div class="rev-image"><img src="'+ resp[i].image +'"/></div>' +
                                '<div class="rev-headline"><h3>'+ resp[i].headline +'</h3></div>' +
                                '<div class="rev-provider">'+ resp[i].brand +'</div>' +
                            '</a>' +
                        '</div>';
                var cell = document.createElement('div');

                cell.style.width = that.columnWidth + 'px';

                revUtils.addClass(cell, 'rev-content');
                // next in line gets special class
                if (that.options.next_effect && i >= that.per_row) {
                    revUtils.addClass(cell, 'next');
                }

                cell.innerHTML = html;

                that.flickity.append(cell);
            }
            imagesLoaded( that.flickity.element, function() {
                that.flickity.reloadCells();
            });
            // append elements
            that.appendElements();

            that.selectedIndex = that.flickity.selectedIndex

            if (that.options.next_effect) {
                that.flickity.on( 'cellSelect', function() {
                    if (that.selectedIndex != that.flickity.selectedIndex) { // only do something when index changes
                        that.selectedIndex = that.flickity.selectedIndex
                        var content = that.flickity.element.querySelectorAll('.rev-content');
                        var nextIndex = that.selectedIndex + that.per_row;
                        var last = that.selectedIndex >= that.options.sponsored - that.per_row;
                        for (var i = 0; i < content.length; i++) {
                            if (last) { // none left to half so all are visible
                                revUtils.removeClass(content[i], 'next');
                            } else if (i >= nextIndex) {
                                revUtils.addClass(content[i], 'next');
                            } else {
                                revUtils.removeClass(content[i], 'next');
                            }
                        }
                    }
                });
            }
        });
    };

    return RevFlickity;

}));