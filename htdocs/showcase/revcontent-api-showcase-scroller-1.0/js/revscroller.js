/*
Project: RevScroller
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevScroller = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevScroller = function(opts) {

        var defaults = {
            url: 'https://trends.revcontent.com/api/v1/',
            header: 'Trending',
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 3,
                xl: 4,
                xxl: 5
            },
            rows: 5,
            visible: 1.5,
            max_headline: true,
            ad_border: false,
            headline_size: 3,
            text_right: true,
            text_right_height: {
                xxs: 70,
                xs: 70,
                sm: 80,
                md: 80,
                lg: 100,
                xl: 100,
                xxl: 120
            },
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            disclosure_text: 'Ads by Revcontent',
            disclosure_text_small: 'Ads',
            overlay: false, // pass key value object { content_type: icon }
            overlay_icons: false, // pass in custom icons or overrides
            overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            timeout: 1000, // timeout in ms for image ad
            show_transition: 600,
            multipliers: {
                margin: -3
            },
            buttons: {
                forward: false,
                back: false
            },
            theme: 'light',
            query_params: false,
            selector: false,
            user_ip: false,
            user_agent: false,
            css: '',
            column_spans: false,
            pagination_dots: true
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

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-scroll');

        this.init();
    };

    RevScroller.prototype.init = function() {
        this.currentRow = 0;
        this.offset = 0;
        this.createInnerWidget();
        this.mouseWheel();
    };

    RevScroller.prototype.createInnerWidget = function() {
        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-scroller';

        revUtils.append(this.element, this.containerElement);

        this.innerWidget = new RevSlider({
            api_source:   'more',
            element:      [this.containerElement],
            pagination_dots: this.options.pagination_dots,
            url:          this.options.url,
            api_key:      this.options.api_key,
            pub_id:       this.options.pub_id,
            widget_id:    this.options.widget_id,
            domain:       this.options.domain,
            rev_position: this.options.rev_position,
            header:       this.options.header,
            per_row:      this.options.per_row,
            rows:         this.options.rows,
            buttons:      this.options.buttons,
            css:          this.options.css,
            column_spans: this.options.column_spans,
            headline_size: this.options.headline_size,
            max_headline: this.options.max_headline,
            pagination_dots_vertical: true,
            disable_pagination: true,
            register_impressions: false,
            register_views: false,
            row_pages: true,
            visible_rows: 1,
        });

        var height = this.innerWidget.grid.heights[1].maxHeight;

        // fully visible ads
        // for (var i = 0; i < this.innerWidget.grid.items.length; i++) {
        //     if (this.innerWidget.grid.items[i].element.offsetTop + this.innerWidget.grid.items[i].element.clientHeight < height) {
        //         // console.log(i, this.innerWidget.grid.items[i].element);
        //     }
        //     // console.log(this.innerWidget.grid.items[i].element.offsetTop, this.innerWidget.grid.items[i].element.clientHeight);
        // }

        this.innerWidget.innerContainerElement.style.height = height + 'px';
        this.innerWidget.innerContainerElement.style.overflowY = 'hidden';

        var that = this;
        this.innerWidget.grid.on('postLayout', function() {
            var height = that.innerWidget.grid.heights[1].maxHeight;
            that.innerWidget.innerContainerElement.style.height = height + 'px';
        });

        var that = this;
        this.innerWidget.dataPromise.then(function() {
            that.registerImpressions(false);
        });
    };

    RevScroller.prototype.mouseWheel = function() {
        var that = this;
        var total = 0;
        // var currentRow = 0;
        var direction;
        var transform = 0;

        $('#rev-slider-container').mousewheel(function(event) {

            if (event.currentTarget.getBoundingClientRect().bottom > (window.innerHeight || document.documentElement.clientHeight)) {
                return;
            }

            if (!that.transitioning) {
                if (event.deltaY < 0) {
                    if (direction == 'up') {
                        total = 0;
                    }
                    direction = 'down';
                    if (that.innerWidget.page < that.innerWidget.grid.rowCount) {
                        total += event.deltaFactor * event.deltaY;
                        event.preventDefault();
                    }
                } else {
                    if (direction == 'down') {
                        total = 0;
                    }
                    direction = 'up';
                    if (that.innerWidget.page > 1) {
                        total += event.deltaFactor * event.deltaY;
                        event.preventDefault();
                    }
                }
            } else {
                event.preventDefault();
            }

            var maxHeight = that.innerWidget.grid.heights[that.currentRow].maxHeight;

            if (Math.abs(total) > (maxHeight * 3)) {
                that.transitioning = true;
                total = 0;

                if (direction == 'down') {
                    transform -= maxHeight;
                    that.offset += that.innerWidget.grid.rows[that.currentRow].perRow;
                    that.currentRow++;
                    that.innerWidget.page++;
                } else if (direction == 'up') {
                    transform += that.innerWidget.grid.heights[(that.currentRow - 1)].maxHeight;
                    that.currentRow--;
                    that.offset -= that.innerWidget.grid.rows[that.currentRow].perRow;
                    that.innerWidget.page--;
                }

                that.innerWidget.updatePagination();

                that.registerImpressions(true);

                var duration = maxHeight * 2;

                revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
                revUtils.transformCss(that.innerWidget.innerElement, 'translateY(' + transform + 'px)');

                setTimeout(function() {
                    that.transitioning = false;
                }, duration);
            }
        });
    };

    RevScroller.prototype.registerImpressions = function(viewed) {
        var count = this.innerWidget.grid.rows[this.currentRow].perRow;
        this.innerWidget.registerImpressions(viewed, this.offset, count);
    };

    return RevScroller;

}));