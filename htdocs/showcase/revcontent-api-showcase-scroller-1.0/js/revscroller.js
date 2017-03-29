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
            max_headline: false,
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
        this.transform = 0;
        this.offset = 0;
        this.createInnerWidget();
        this.scroll();
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
            multipliers: {
                margin: -3
            },
        });

        var height = this.innerWidget.grid.heights[1].maxHeight;

        var that = this;

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

    RevScroller.prototype.scroll = function() {
        // var transform = 0;
        var hovering = false;

        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

        revUtils.addEventListener(this.containerElement, 'mouseenter', function() {
            hovering = true;
        });

        revUtils.addEventListener(this.containerElement, 'mouseleave', function() {
            hovering = false;
        });

        console.log(scrollTop);

        var that = this;
        var done = false;

        var doIt = function(page) {

            // var maxHeight = that.innerWidget.grid.heights[that.currentRow].maxHeight;
            // transform -= maxHeight;
            that.transform = 0;
            var i = 0;
            while (i < page) {
                that.transform += that.innerWidget.grid.heights[i].maxHeight;
                i++;
            }

            // console.log(page, transform);

            var bottom = Math.ceil(that.innerWidget.grid.heights[0].maxHeight + that.innerWidget.grid.heights[2].maxHeight);
            if (page == 2 && Math.abs(that.transform) > bottom) {
                // holdIt = true;
                that.transform = bottom;
            }

            that.innerWidget.page = (page + 1);
            that.innerWidget.updatePagination();

            var duration = that.innerWidget.grid.heights[that.currentRow].maxHeight * 4;

            that.currentRow++;

            that.transform = (that.transform * -1);

            revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
            revUtils.transformCss(that.innerWidget.innerElement, 'translate3d(0, ' + that.transform + 'px, 0)');
        };

        var doItBottom = function(page) {
            that.transform = 0;
            var i = 0;
            while (i < page) {
                that.transform += that.innerWidget.grid.heights[i].maxHeight;
                i++;
            }

            // if (transform > 0) {
            //     transform = 0;
            // }


            // console.log('bottom', page, transform);
            // transform += that.innerWidget.grid.heights[(that.currentRow - 1)].maxHeight;

            var duration = that.innerWidget.grid.heights[(that.currentRow - 1)].maxHeight * 4;

            that.transform = (that.transform * -1);

            revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
            revUtils.transformCss(that.innerWidget.innerElement, 'translate3d(0, ' + that.transform + 'px, 0)');
            // that.offset -= that.innerWidget.grid.rows[that.currentRow].perRow;
            that.currentRow--;
            that.innerWidget.page = (page + 1);
            that.innerWidget.updatePagination();
        };

        revUtils.addEventListener(window, 'scroll', function() {
            requestAnimationFrame(function() {

                if (hovering) {
                    return;
                }

                // console.log(that.innerWidget.innerContainerElement.offsetHeight);
                // what percentage of the element should be visible
                // var visibleHeightMultiplier = (typeof percentVisible === 'number') ? (parseInt(percentVisible) * .01) : 0;

                var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

                // if (scroll > scrollTop) {
                //     console.log('up');
                // } else {
                //     console.log('down');
                // }


                var elementTop = that.containerElement.getBoundingClientRect().top;
                var elementBottom = that.containerElement.getBoundingClientRect().bottom;
                // var elementVisibleHeight = element.offsetHeight * visibleHeightMultiplier;
                var elementVisibleHeight = that.containerElement.offsetHeight;

                var center = (windowHeight - elementVisibleHeight) / 2;

                // console.log(windowHeight / 3);

                // var scrollBottom = (scroll + windowHeight) - (elementTop + scroll + elementVisibleHeight);
                var scrollBottom = (scroll + windowHeight) - (elementTop + scroll);

                var regionHeight = (windowHeight / 2)

                // console.log(scroll, scrollTop);

                if (scroll > scrollTop) { // scrolling down

                    // if (scrollBottom > (regionHeight * 3) && that.currentRow == 2) { // third region
                    //     console.log('page 3');
                    // } else
                    if (scrollBottom > (regionHeight * 2) && that.currentRow == 1) { // second region
                        doIt(2);
                        // console.log('page 2');
                    } else if (scrollBottom > (regionHeight) && that.currentRow == 0) { // first region
                        doIt(1);
                        // console.log('page 1');
                    }

                    // console.log(scrollBottom, regionHeight * 3);
                    // if (scrollBottom > windowHeight / 3) {
                    //     console.log('first');
                    // } else if (scrollBottom > windowHeight / 2){
                    //     console.log('second');
                    // }

                } else { // scrolling up
                    if (scrollBottom < (regionHeight * 1) && that.currentRow > 0) {
                        // console.log('do it bottom', that.currentRow);
                        doItBottom(0);
                    } else if (scrollBottom < (regionHeight * 2) && that.currentRow > 1) {
                        // console.log('do it', that.currentRow);
                        doItBottom(1);
                    }
                    // console.log(scrollBottom, regionHeight * 2);
                    // if (scrollBottom > (regionHeight * 2)) { // first region
                    //     // doIt();
                    //     console.log('page 2');
                    // } else if (scrollBottom > (regionHeight * 1)) {
                    //     console.log('page 1');
                    // }
                    // if (scrollBottom > (regionHeight * 2) && that.currentRow == 1) { // second region
                    //     doIt();
                    //     console.log('page 2');
                    // } else if (scrollBottom > (regionHeight) && that.currentRow == 0) { // first region
                    //     doIt();
                    //     console.log('page 1');
                    // }
                }

                scrollTop = scroll;
                return;





                // // element is in the middle and scrolling up and in the first row
                // if (scrollBottom > center && scroll > scrollTop && that.currentRow == 0) {
                //     var maxHeight = that.innerWidget.grid.heights[that.currentRow].maxHeight;
                //     transform -= maxHeight;
                //     // that.offset += that.innerWidget.grid.rows[that.currentRow].perRow;
                //     that.innerWidget.page++;
                //     that.innerWidget.updatePagination();

                //     var duration = that.innerWidget.grid.heights[that.currentRow].maxHeight * 4;

                //     that.currentRow++;

                //     revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
                //     revUtils.transformCss(that.innerWidget.innerElement, 'translate3d(0, ' + transform + 'px, 0)');

                // } else if (scrollBottom < center && scroll < scrollTop && that.currentRow == 1) {
                //     // var maxHeight = that.innerWidget.grid.heights[that.currentRow].maxHeight;
                //     transform += that.innerWidget.grid.heights[(that.currentRow - 1)].maxHeight;

                //     var duration = that.innerWidget.grid.heights[(that.currentRow - 1)].maxHeight * 4;

                //     revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
                //     revUtils.transformCss(that.innerWidget.innerElement, 'translate3d(0, ' + transform + 'px, 0)');
                //     // that.offset -= that.innerWidget.grid.rows[that.currentRow].perRow;
                //     that.currentRow--;
                //     that.innerWidget.page--;
                //     that.innerWidget.updatePagination();
                // }
                // scrollTop = scroll;





                // if (scrollBottom > center) {
                //     console.log('do it');
                // } else {
                //     console.log('other way');
                // }

                // if ((scroll + windowHeight >= (elementTop + scroll + elementVisibleHeight)) &&
                //     elementBottom > elementVisibleHeight) {
                //     console.log(elementBottom);
                // }
            });
        });
    };

    RevScroller.prototype.mouseWheel = function() {
        console.log('hinn');
        var that = this;
        var total = this.innerWidget.grid.heights[this.currentRow].maxHeight;
        // var currentRow = 0;
        var direction;
        // var transform = 0;

        var hovering = false;

        // console.log('info', this.innerWidget.innerContainerElement);

        revUtils.addEventListener(this.innerWidget.innerContainerElement, 'mouseenter', function() {
            console.log('info', 'enter', that.currentRow);
            // total = this.innerWidget.grid.heights[this.currentRow].maxHeight;
            total = 0;
            var i = 0;
            while (i <= that.currentRow) {
                total += that.innerWidget.grid.heights[i].maxHeight;
                // transform += that.innerWidget.grid.heights[i].maxHeight;
                i++;
            }
            hovering = true;
        });

        revUtils.addEventListener(this.innerWidget.innerContainerElement, 'mouseleave', function() {
            console.log('info', 'over');
            hovering = false;
        });

        $('#rev-slider-container').mousewheel(function(event) {
            if (hovering) {

                if (event.deltaY < 0) {
                    // if (direction == 'up') {
                    //     total = 0;
                    // }
                    direction = 'down';
                    that.transform += event.deltaY;

                    console.log('innn', that.transform, event.deltaY);
                    // console.log('info', event.deltaY);
                    // if (that.innerWidget.page < that.innerWidget.grid.rowCount) {
                    //     total += event.deltaFactor * event.deltaY;
                    //     event.preventDefault();
                    // }
                } else {
                    // if (direction == 'down') {
                    //     total = 0;
                    // }
                    direction = 'up';
                    that.transform += event.deltaY;

                    console.log('innn', that.transform, event.deltaY);
                    // if (that.innerWidget.page > 1) {
                    //     total += event.deltaFactor * event.deltaY;
                    //     event.preventDefault();
                    // }
                }

                if (that.transform > 0) {
                    that.transform = 0;
                }

                var holdIt = false;
                var bottom = Math.ceil(that.innerWidget.grid.heights[0].maxHeight + that.innerWidget.grid.heights[2].maxHeight);
                if (Math.abs(that.transform) > bottom) {
                    holdIt = true;
                    that.transform = bottom * -1;
                    // console.log('info', 'bottom', that.innerWidget.grid.heights[0].maxHeight + that.innerWidget.grid.heights[2].maxHeight);
                }

                // console.log('info', 'here', bottom, (holdIt && (that.currentRow + 1) < that.innerWidget.grid.rowCount));

                if (Math.abs(that.transform) > total || (holdIt && (that.currentRow + 1) < that.innerWidget.grid.rowCount)) {
                    that.currentRow++;
                    total += that.innerWidget.grid.heights[that.currentRow].maxHeight;
                    that.innerWidget.page++;
                    that.innerWidget.updatePagination();
                } else if( direction == 'up' ) {

                    if (that.transform == 0 && that.currentRow > 0) {
                        that.currentRow = 0;
                        that.innerWidget.page = 1;
                        that.innerWidget.updatePagination();
                        total = that.innerWidget.grid.heights[that.currentRow].maxHeight;
                    } else if (Math.abs(that.transform) < that.innerWidget.grid.heights[0].maxHeight && that.currentRow == 2) {
                        // console.log(transform, that.innerWidget.grid.heights[0].maxHeight);
                        that.currentRow = 1;
                        that.innerWidget.page = 2;
                        that.innerWidget.updatePagination();
                        total = that.innerWidget.grid.heights[0].maxHeight + that.innerWidget.grid.heights[1].maxHeight;
                        console.log('dot goes up', that.transform, total);
                    }



                    // console.log('info', 'else');
                    // that.currentRow--;
                    // that.innerWidget.page--;
                    // that.innerWidget.updatePagination();
                }

                // console.log('info', Math.abs(transform), total, Math.abs(transform), that.innerWidget.grid.heights[0].maxHeight);

                revUtils.transitionDurationCss(that.innerWidget.innerElement, '0ms');
                revUtils.transformCss(that.innerWidget.innerElement, 'translateY(' + that.transform + 'px)');



                if (that.transform !== 0 && !holdIt) {
                    event.preventDefault();
                }
            }
        });

        // $('#rev-slider-container').mousewheel(function(event) {

        //     if (event.currentTarget.getBoundingClientRect().bottom > (window.innerHeight || document.documentElement.clientHeight)) {
        //         return;
        //     }

        //     if (!that.transitioning) {
        //         if (event.deltaY < 0) {
        //             if (direction == 'up') {
        //                 total = 0;
        //             }
        //             direction = 'down';
        //             if (that.innerWidget.page < that.innerWidget.grid.rowCount) {
        //                 total += event.deltaFactor * event.deltaY;
        //                 event.preventDefault();
        //             }
        //         } else {
        //             if (direction == 'down') {
        //                 total = 0;
        //             }
        //             direction = 'up';
        //             if (that.innerWidget.page > 1) {
        //                 total += event.deltaFactor * event.deltaY;
        //                 event.preventDefault();
        //             }
        //         }
        //     } else {
        //         event.preventDefault();
        //     }

        //     var maxHeight = that.innerWidget.grid.heights[that.currentRow].maxHeight;

        //     if (Math.abs(total) > (maxHeight * 3)) {
        //         that.transitioning = true;
        //         total = 0;

        //         if (direction == 'down') {
        //             transform -= maxHeight;
        //             that.offset += that.innerWidget.grid.rows[that.currentRow].perRow;
        //             that.currentRow++;
        //             that.innerWidget.page++;
        //         } else if (direction == 'up') {
        //             transform += that.innerWidget.grid.heights[(that.currentRow - 1)].maxHeight;
        //             that.currentRow--;
        //             that.offset -= that.innerWidget.grid.rows[that.currentRow].perRow;
        //             that.innerWidget.page--;
        //         }

        //         that.innerWidget.updatePagination();

        //         that.registerImpressions(true);

        //         var duration = maxHeight * 2;

        //         revUtils.transitionDurationCss(that.innerWidget.innerElement, duration + 'ms');
        //         revUtils.transformCss(that.innerWidget.innerElement, 'translateY(' + transform + 'px)');

        //         setTimeout(function() {
        //             that.transitioning = false;
        //         }, duration);
        //     }
        // });
    };

    RevScroller.prototype.registerImpressions = function(viewed) {
        var count = this.innerWidget.grid.rows[this.currentRow].perRow;
        this.innerWidget.registerImpressions(viewed, this.offset, count);
    };

    return RevScroller;

}));