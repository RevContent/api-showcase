
/* ========================================================================
 * grid.js v1.0.0
 * ========================================================================
 * Copyright 2011-2014 Integraclick, Inc.
 * ======================================================================== */

+function ($) {
    'use strict';

    // CLASS DEFINITION
    // =========================

    var Grid = function (element, options) {
        var that = this;

        this.$element = $(element);
        // item template
        this.$template = $('<div class="ad-wrapper">' +
            '<a href="">' +
                '<div class="inner">' +
                    '<div>' +
                        '<div class="rc-headline"></div>' +
                        '<img class="img-responsive" src="">' +
                    '</div>' +
                '</div>' +
            '</a>' +
        '</div>');

        this.$loader = $('<div class="rc-loader">Loading...</div>');

        this.$element.append(this.$loader);

        // init vars
        this.options     = options;
        this.offset      = 0;
        this.cur_page    = 1;

        that.load(true).then(function() {
            that.resize();
            that.scroll();
        });
    };
    //to == timeout
    Grid.DEFAULTS = {
        rows: 2,
        items: {
            xs: 2,
            sm: 3,
            md: 4,
            lg: 6,
            xl: 8
        }
    };
    // load does different things the first time
    Grid.prototype.load = function (init) {
        this.containerQuery();
        this.setUp(init);

        if (init) {
            var that = this;
            this.getTotal().then(function() { // when we have total and  we can determing pages
                that.pager();
            });
        }

        var xhr = this.doAjax();

        xhr.then(function() {
            if (!that.hasScrollBar()) {
                xhr = that.doAjax();
            }
        })
        return xhr;
    };
    // get total number of items
    Grid.prototype.getTotal = function() {
        var that = this;
        var totalParams = this.options.params;
        totalParams.count = 200;
        delete totalParams.offset;

        return $.ajax({
            url : this.options.url,
            method : 'GET',
            dataType: 'json',
            data: totalParams,
            success: function(json) {
                that.total = json.length;
            }
        });
    };
    // get the number of pages - can do more here if we need navigation
    Grid.prototype.pager = function() {
        this.pages = Math.ceil(this.total / this.limit);
    };
    // check the container size and set class and determin number of items for this size container
    Grid.prototype.containerQuery = function() {

        this.containerWidth = this.$element.outerWidth();

        this.$element.removeClass(function (index, css) {
            return (css.match (/\bgrid-size-\S+/g) || []).join(' ');
        });

        if (this.containerWidth <= 450) {
            this.containerSize = 'xs';
            this.items = this.options.items.xs;
            this.$element.addClass('grid-size-xs');
        } else if (this.containerWidth > 450 && this.containerWidth <= 600) {
            this.containerSize = 'sm';
            this.items = this.options.items.sm;
            this.$element.addClass('grid-size-sm');
        } else if (this.containerWidth > 600 && this.containerWidth <= 960) {
            this.containerSize = 'md';
            this.items = this.options.items.md;
            this.$element.addClass('grid-size-md');
        } else if (this.containerWidth > 960 && this.containerWidth <= 1160) {
            this.containerSize = 'lg';
            this.items = this.options.items.lg;
            this.$element.addClass('grid-size-lg');
        } else if (this.containerWidth > 1160) {
            this.containerSize = 'xl';
            this.items = this.options.items.xl;
            this.$element.addClass('grid-size-xl');
        }
    };
    // set up vars for calculations
    Grid.prototype.setUp = function(init) {
        this.limit = this.items * this.options.rows;

        this.itemWidth = (this.containerWidth / this.items);

        this.$template.width(this.itemWidth);
    };
    // when the browser resizes load again
    Grid.prototype.resize = function() {
        var that = this,
            resize;

        $(window).on('resize', function() {
            clearTimeout(resize);
            resize = setTimeout(function() {
                that.load().then(function() {
                    // that.pager();
                });
            }, 500);
        });
    };

    Grid.prototype.xhrParams = function() {
        this.cur_page++;
        this.offset += this.limit;

        if ((this.offset + this.limit) >= this.total) {
            this.done = true;
        }
    };

    //when the user scrolls
    Grid.prototype.scroll = function() {
        var that = this;
        var win = $(window);
        var lastScrollTop = 0;
        win.on('scroll', function() {
            var scrollTop = win.scrollTop();
            var winBottom = win.height() + scrollTop,
                elementBottom = that.$element.offset().top + that.$element.height();

            if (((elementBottom - winBottom) <= 0) && (scrollTop > lastScrollTop) && !that.loading && !that.done) {
                that.doAjax();
            }
            lastScrollTop = scrollTop;
        });
    };
    // get the content
    Grid.prototype.doAjax = function () {
        var that = this;
        that.xhrParams();
        var data = this.getData();

        var url = that.options.url ? that.options.url : this.$element.data('url');

        that.options.params.offset = data.offset;
        that.options.params.count = data.limit;

        this.$element.trigger('change.app.grid');

        that.loading = true;
        this.$loader.show();

        var maxHeight = 0;
        var xhr = $.ajax({
            url : url,
            method : 'GET',
            dataType: 'json',
            data: that.options.params,
            success: function(json) {
                // that.total = json.count;
                if (json.length) {
                    $.each(json, function(index, val) {

                        var $template = that.$template.clone();
                        $template.find('.rc-headline').text(val.headline);
                        $template.find('a').attr('href', val.url);
                        $template.find('img').attr('src', val.image);

                        that.$element.append($template);
                    });

                var columnCount = that.items,
                    count = 0,
                    left  = 0,
                    columns = {
                        1: 0,
                        2: 0,
                        3: 0,
                        4: 0,
                        5: 0,
                        6: 0,
                        7: 0
                    };

                    that.$element.children().not('.rc-loader').each(function(i, val) {
                        count++;

                        var column = (count % columnCount) === 0 ? columnCount : (count % columnCount),
                            e = $(val);

                        e.css({
                            top: columns[column],
                            left: left
                        });

                        if ((count % columnCount) === 0 ) {
                            left = 0;
                        } else {
                            left = left + e.outerWidth(true);
                        }

                        columns[column] = columns[column] + e.outerHeight(true);
                        maxHeight = Math.max(maxHeight, columns[column]);
                    });
                }
            }
        });

        xhr.then(function() {
            that.loading = false;
            that.$loader.hide();
            that.$element.height(maxHeight);
        });

        return xhr;
    };

    Grid.prototype.hasScrollBar = function() {
        return ($(document).height() > $(window).height());
    };

    // get data
    Grid.prototype.getData = function() {
        return jQuery.extend({limit: this.limit, offset: this.offset}, this.$element.data('params'));
    };

    // PLUGIN DEFINITION
    // ==========================
    var old = $.fn.grid;

    $.fn.grid = function (option) {
        return this.each(function (i, v) {
            var $this   = $(this);
            var data    = $this.data('app.grid');
            var options = $.extend({}, Grid.DEFAULTS, $this.data(), typeof option == 'object' && option);
            var action  = typeof option == 'string' ? option : options.slide;

            $this.addClass('rc-grid');

            if (!data) $this.data('app.grid', (data = new Grid(this, options)));
        })
    };

    $.fn.grid.Constructor = Grid;


    // NO CONFLICT
    // ====================

    $.fn.grid.noConflict = function () {
        $.fn.grid = old;

        return this;
    };

}(jQuery);
