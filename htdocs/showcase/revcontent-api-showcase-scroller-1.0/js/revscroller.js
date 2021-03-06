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
                sm: 2,
                md: 3
            },
            rows: 3,
            buttons: {
                forward: false,
                back: false
            },
            multipliers: {
                margin: -3
            },
            css: '',
            column_spans: [
                {
                    spans: 2,
                    selector: "#rev-slider.rev-slider-breakpoint-md .rev-content:nth-child(4)",
                },
                {
                    spans: 2,
                    selector: "#rev-slider.rev-slider-breakpoint-sm .rev-content:nth-child(3)",
                }
            ],
            headline_size: 3,
            max_headline: false,
            disclosure_text: 'Ads by Revcontent',
            query_params: false,
            user_ip: false,
            user_agent: false,
            transition_duration_multiplier: 3,
            auto_scroll: true,
            rev_position: 'top_right'
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
        this.emitter = new EventEmitter();
        this.currentRow = 0;
        this.transform = 0;
        this.offset = 0;
        this.createInnerWidget();
        this.scroll();
        this.mouseWheel();
        this.buttons();
        this.viewability();
    };

    RevScroller.prototype.createInnerWidget = function() {
        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-scroller';

        revUtils.append(this.element, this.containerElement);

        this.innerWidget = new RevSlider({
            api_source:   'scrol',
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
            buttons:      this.options.buttons,
            multipliers:  this.options.multipliers,
            css:          this.options.css,
            column_spans: this.options.column_spans,
            headline_size: this.options.headline_size,
            max_headline: this.options.max_headline,
            disclosure_text: this.options.disclosure_text,
            query_params: this.options.query_params,
            user_ip:      this.options.user_ip,
            user_agent:   this.options.user_agent,
            disable_pagination: true,
            pagination_dots: true,
            pagination_dots_vertical: true,
            register_impressions: false,
            register_views: false,
            row_pages: true,
            visible_rows: 1
        });

        this.innerWidget.innerContainerElement.style.overflowY = 'hidden';

        var that = this;
        var getHeight = function() {
            that.heights = [];
            for(var prop in that.innerWidget.grid.heights) {
                if (that.innerWidget.grid.heights.hasOwnProperty(prop)) {
                    that.heights.push(that.innerWidget.grid.heights[prop].maxHeight);
                }
            }
            // sort ascending
            that.heights.sort(function(a, b){return a - b});
        };

        this.innerWidget.emitter.on('resized', function() {
            getHeight(); // get heights
            // set height to largest
            that.innerWidget.innerContainerElement.style.height = that.heights[(that.heights.length - 1)] + 'px';
        });

        var that = this;
        this.innerWidget.dataPromise.then(function() {
            that.registerImpressions(false);
        });
    };

    RevScroller.prototype.scroll = function() {
        if (this.options.auto_scroll === false) {
            return;
        }
        var hovering = false;

        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

        revUtils.addEventListener(this.containerElement, 'mouseenter', function() {
            hovering = true;
        });

        revUtils.addEventListener(this.containerElement, 'mouseleave', function() {
            hovering = false;
        });

        var that = this;
        var done = false;

        var doIt = function(page) {
            var oldTransform = that.transform;
            that.transform = 0;
            var i = 0;
            while (i < page) {
                that.transform += that.innerWidget.grid.heights[i].maxHeight;
                i++;
            }

            var bottom = that.heights[0] + that.heights[1];
            if (Math.abs(that.transform) > bottom) {
                that.transform = bottom;
            }

            that.innerWidget.page = (page + 1);
            that.innerWidget.updatePagination();

            var distance = Math.abs(Math.abs(oldTransform) - Math.abs(that.transform));
            var duration = distance * that.options.transition_duration_multiplier;

            that.currentRow++;

            that.transform = (that.transform * -1);

            revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
            revUtils.transformCss(that.innerWidget.innerElement, 'translate3d(0, ' + that.transform + 'px, 0)');
            that.registerImpressions(true);
        };

        var doItBottom = function(page) {
            var oldTransform = that.transform;
            that.transform = 0;
            var i = 0;
            while (i < page) {
                that.transform += that.innerWidget.grid.heights[i].maxHeight;
                i++;
            }

            var distance = Math.abs(Math.abs(oldTransform) - Math.abs(that.transform));
            var duration = distance * that.options.transition_duration_multiplier;

            that.transform = (that.transform * -1);

            revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
            revUtils.transformCss(that.innerWidget.innerElement, 'translate3d(0, ' + that.transform + 'px, 0)');
            // that.offset -= that.innerWidget.grid.rows[that.currentRow].perRow;
            that.currentRow--;
            that.innerWidget.page = (page + 1);
            that.innerWidget.updatePagination();
            that.registerImpressions(true);
        };

        revUtils.addEventListener(window, 'scroll', function() {
            requestAnimationFrame(function() {

                if (hovering) {
                    return;
                }

                var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

                var elementTop = that.containerElement.getBoundingClientRect().top;
                var elementBottom = that.containerElement.getBoundingClientRect().bottom;
                var elementVisibleHeight = that.containerElement.offsetHeight;

                var center = (windowHeight - elementVisibleHeight) / 2;

                var scrollBottom = (scroll + windowHeight) - (elementTop + scroll);

                var regionHeight = (windowHeight / 2);

                if (scroll > scrollTop) { // scrolling down

                    if (scrollBottom > (regionHeight * 2) && that.currentRow == 1) { // second region
                        doIt(2); // page 2
                    } else if (scrollBottom > (regionHeight) && that.currentRow == 0) { // first region
                        doIt(1); // page 1
                    }

                } else { // scrolling up
                    if (scrollBottom < (regionHeight * 1) && that.currentRow > 0) {
                        doItBottom(0);
                    } else if (scrollBottom < (regionHeight * 2) && that.currentRow > 1) {
                        doItBottom(1);
                    }
                }

                scrollTop = scroll;
            });
        });
    };

    RevScroller.prototype.mouseWheel = function() {
        var that = this;
        var total = this.innerWidget.grid.heights[this.currentRow].maxHeight;
        var direction;

        var hovering = false;

        var updateTotal = function() {
            total = 0;
            var i = 0;
            while (i <= that.currentRow) {
                total += that.innerWidget.grid.heights[i].maxHeight;
                i++;
            }
            hovering = true;
        };

        revUtils.addEventListener(this.innerWidget.innerContainerElement, 'mouseenter', updateTotal);

        this.emitter.on('button', updateTotal);

        revUtils.addEventListener(this.innerWidget.innerContainerElement, 'mouseleave', function() {
            hovering = false;
        });

        $('#rev-slider-container').mousewheel(function(event) {
            if (hovering) {

                if (event.deltaY < 0) {
                    direction = 'down';
                    that.transform += event.deltaY;
                } else {
                    direction = 'up';
                    that.transform += event.deltaY;
                }

                if (that.transform > 0) {
                    that.transform = 0;
                }

                var holdIt = false;
                var bottom = that.heights[0] + that.heights[1];
                if (Math.abs(that.transform) > bottom) {
                    holdIt = true;
                    that.transform = bottom * -1;
                }

                if (Math.abs(that.transform) > total || (holdIt && (that.currentRow + 1) < that.innerWidget.grid.rowCount)) {
                    that.currentRow++;
                    total += that.innerWidget.grid.heights[that.currentRow].maxHeight;
                    that.innerWidget.page++;
                    that.innerWidget.updatePagination();
                    that.registerImpressions(true);
                } else if( direction == 'up' ) {
                    if (that.transform == 0 && that.currentRow > 0) {
                        that.currentRow = 0;
                        that.innerWidget.page = 1;
                        that.innerWidget.updatePagination();
                        that.registerImpressions(true);
                        total = that.innerWidget.grid.heights[that.currentRow].maxHeight;
                    } else if (Math.abs(that.transform) < that.innerWidget.grid.heights[0].maxHeight && that.currentRow == 2) {
                        that.currentRow = 1;
                        that.innerWidget.page = 2;
                        that.innerWidget.updatePagination();
                        that.registerImpressions(true);
                        total = that.innerWidget.grid.heights[0].maxHeight + that.innerWidget.grid.heights[1].maxHeight;
                    }
                }

                revUtils.transitionDurationCss(that.innerWidget.innerElement, '0ms');
                revUtils.transformCss(that.innerWidget.innerElement, 'translateY(' + that.transform + 'px)');

                if (that.transform !== 0 && !holdIt) {
                    event.preventDefault();
                }
            }
        });
    };

    RevScroller.prototype.buttons = function() {
        var that = this;
        var doIt = function(page) {
            var oldTransform = that.transform;
            that.transform = 0;
            var i = 0;
            while (i < page) {
                that.transform += that.innerWidget.grid.heights[i].maxHeight;
                i++;
            }

            var bottom = Math.ceil(that.innerWidget.grid.heights[0].maxHeight + that.innerWidget.grid.heights[2].maxHeight);
            if (page == 2 && Math.abs(that.transform) > bottom) {
                that.transform = bottom;
            }

            that.innerWidget.page = (page + 1);
            that.innerWidget.updatePagination();

            that.transform = (that.transform * -1);

            var distance = Math.abs(Math.abs(oldTransform) - Math.abs(that.transform));
            var duration = distance * that.options.transition_duration_multiplier;

            revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
            revUtils.transformCss(that.innerWidget.innerElement, 'translate3d(0, ' + that.transform + 'px, 0)');
        };

        var buttons = this.innerWidget.element.querySelectorAll('.rev-pagination-dot div');

        var clickIt = function(index) {
            revUtils.addEventListener(buttons[index], 'click', function() {
                doIt(index);
                for (var i = that.currentRow; i <= index; i++) {
                    that.currentRow = i;
                    that.registerImpressions(true);
                }
                that.emitter.emitEvent('button');
            });
        }

        for (var i = 0; i < buttons.length; i++) {
            clickIt(i);
        }
    };

    RevScroller.prototype.viewability = function() {
        this.registerViewOnceVisible();
        this.attachVisibleListener();
        revUtils.checkVisible.bind(this, this.containerElement, this.visible)();
    };

    RevScroller.prototype.registerViewOnceVisible = function() {
        var that = this;
        this.emitter.once('visible', function() {
            revUtils.removeEventListener(window, 'scroll', that.visibleListener);
            that.registerView();
        });
    };

    RevScroller.prototype.registerView = function() {
        if (!this.viewed) {
            this.viewed = true;
            var count = this.innerWidget.grid.rows[this.currentRow].perRow;

            // register a view without impressions(empty)
            var url = this.innerWidget.generateUrl(0, count, true, true);

            revApi.request(url, function() { return; });

            var that = this;
            // make sure we have some data
            this.innerWidget.dataPromise.then(function() {
                var anchors = that.innerWidget.element.querySelectorAll('.rev-ad a');
                for (var i = 0; i < anchors.length; i++) {
                    anchors[i].setAttribute('href', anchors[i].getAttribute('href') + '&viewed=true');
                }
            });
        }
    };

    RevScroller.prototype.attachVisibleListener = function() {
        this.visibleListener = revUtils.checkVisible.bind(this, this.containerElement, this.visible);
        revUtils.addEventListener(window, 'scroll', this.visibleListener);
    };

    RevScroller.prototype.visible = function() {
        this.emitter.emitEvent('visible');
    };

    RevScroller.prototype.registerImpressions = function(viewed) {

        var count = this.innerWidget.grid.rows[this.currentRow].perRow;
        var offset = 0;
        for (var i = 0; i < this.currentRow; i++) {
            offset += this.innerWidget.grid.rows[i].perRow;
        }

        this.innerWidget.registerImpressions(viewed, offset, count);
    };

    return RevScroller;

}));