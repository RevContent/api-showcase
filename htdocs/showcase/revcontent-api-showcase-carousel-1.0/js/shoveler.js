
/* ========================================================================
 * shoveler.js v1.0.0
 * ========================================================================
 * Copyright 2011-2014 Integraclick, Inc.
 * ======================================================================== */

jQuery.fn.reverse = [].reverse;

+function ($) {
    'use strict';

    // CLASS DEFINITION
    // =========================

    var ContentSlider = function (element, options) {
        var that = this;

        this.$element = $(element);
        //append buttons and items container
        $('<div class="shoveler-btn">' +
                '<button class="btn btn-default pull-left"' +
                        'data-slide="prev">' +
                        '<i class="fa fa-chevron-left"><</i></button>' +
            '</div>' +
            '<div class="shoveler-items">' +
                '<ul class="list-unstyled"></ul>' +
            '</div>' +
            '<div class="shoveler-btn">' +
                '<button class="btn btn-default pull-left"' +
                        'data-slide="next">' +
                        '<i class="fa fa-chevron-right">></i></button>' +
            '</div>')
        .appendTo(this.$element);
        // shoveler item template
        this.$shovelerTemplate = $('<li class="shoveler-item">' +
                        '<div class="shoveler-item-inner">' +
                            '<div class="well well-sm" style="margin-bottom: 0;">' +
                                '<div class="ad-container">' +
                                    '<div class="ad-wrapper" style="display:none;">' +
                                        '<img class="img-responsive" src="" alt="">' +
                                        '<p></p>' +
                                    '</div>' +
                                    '<div class="loader" style="width: 100%; height:100%; display:table;">' +
                                        '<div style="display:table-cell; vertical-align:middle; text-align: center;"><img src="/app/resources/img/spinner-dots.gif" /></div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</li>');
        // init vars
        this.options     = options;
        this.offset      = 0;
        this.cur_page    = 1;

        that.load(true).then(function() {
            that.resize();
            that.$element.trigger('load.app.contentSlider');
        });
    };
    //to == timeout
    ContentSlider.DEFAULTS = {
        toLoader: 100,
        toTransition: 200,
        toImage: 0,
        items: {
            xs: 2,
            sm: 4,
            md: 5,
            lg: 6,
            xl: 8
        }
    };
    // load does different things the first time
    ContentSlider.prototype.load = function (init) {
        this.containerQuery();
        this.setUp(init);

        if (init) {
            var that = this;
            this.getTotal().then(function() { // when we have total and  we can determing pages
                that.pager();
            });
        }

        this.appendTemplates();
        this.containerHeight(init);

        return this.doAjax(this.getData(), false);
    };
    // get total number of items
    ContentSlider.prototype.getTotal = function() {
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
    ContentSlider.prototype.pager = function() {
        this.pages = Math.ceil(this.total / this.limit);
    };
    // check the container size and set class and determin number of items for this size container
    ContentSlider.prototype.containerQuery = function() {

        this.containerWidth = this.$element.find('.shoveler-items').outerWidth();

        this.$element.removeClass (function (index, css) {
            return (css.match (/\bshoveler-size-\S+/g) || []).join(' ');
        });

        if (this.containerWidth <= 450) {
            this.containerSize = 'xs';
            this.items = this.options.items.xs;
            this.$element.addClass('shoveler-size-xs');
        } else if (this.containerWidth > 450 && this.containerWidth <= 600) {
            this.containerSize = 'sm';
            this.items = this.options.items.sm;
            this.$element.addClass('shoveler-size-sm');
        } else if (this.containerWidth > 600 && this.containerWidth <= 960) {
            this.containerSize = 'md';
            this.items = this.options.items.md;
            this.$element.addClass('shoveler-size-md');
        } else if (this.containerWidth > 960 && this.containerWidth <= 1160) {
            this.containerSize = 'lg';
            this.items = this.options.items.lg;
            this.$element.addClass('shoveler-size-lg');
        } else if (this.containerWidth > 1160) {
            this.containerSize = 'xl';
            this.items = this.options.items.xl;
            this.$element.addClass('shoveler-size-xl');
        }
    };
    // set up vars for calculations
    ContentSlider.prototype.setUp = function(init) {
        this.adHeight = 50; // default ad height

        // if (this.hasScrollBar()) // if it has a scrollbar do something?
        //     this.containerWidth = this.containerWidth + this.scrollbarWidth;

        this.itemWidth = (this.containerWidth / this.items);

        this.$shovelerTemplate.find('.shoveler-item-inner').width(this.itemWidth);

        if (!init) {
            var padding = parseFloat(this.$element.find('.shoveler-item-inner').css('padding-left')) + parseFloat(this.$element.find('.shoveler-item-inner').css('padding-right'));
            this.itemWidth = this.itemWidth - padding;
            this.$element.find('.shoveler-item-inner').width(this.itemWidth);
        }

        this.limit = Math.floor(this.containerWidth / this.itemWidth);
    };
    // append $shovelerTemplate depending on number of items needed
    ContentSlider.prototype.appendTemplates = function() {
        var that   = this;

        var $items = that.$element.find('.shoveler-item'),
            length = $items.length;
        if (length > that.limit) {
            $items.slice(that.limit - length).remove();
        } else {
            while (length < that.limit) {
                that.$element.find('.shoveler-items ul').append(that.$shovelerTemplate.clone());
                length++;
            }
        }
    };
    // set the container height - this will never decrease in size it only increases to accomodate more content
    ContentSlider.prototype.containerHeight = function(blind) {
        var adHeight = this.adHeight;

        if (blind) {
            this.$element.find('.shoveler-item .ad-container').height(this.adHeight);
        } else {
            this.$element.find('.shoveler-item .ad-container').height('auto');
            this.$element.find('.shoveler-item .ad-container').each(function() {
                adHeight = adHeight >= $(this).height() ? adHeight : $(this).height();
            });
            this.$element.find('.shoveler-item .ad-container').height(adHeight);
            this.adHeight = adHeight;
        }
    };
    // when the browser resizes load again
    ContentSlider.prototype.resize = function() {
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
    // slide next
    ContentSlider.prototype.next = function () {
        if (this.sliding) return;
        return this.slide('next');
    };
    // slide prev
    ContentSlider.prototype.prev = function () {
        if (this.sliding) return;
        return this.slide('prev');
    };
    // slide
    ContentSlider.prototype.slide = function (direction) {
        if (this.sliding == true) return;
        this.sliding = true;
        if (direction == 'next') {
            if (this.cur_page == this.pages) {
                this.cur_page = 1;
            } else {
                this.cur_page++;
            }


            this.offset += this.limit;
            if (this.offset >= this.total) {
                this.offset = 0;
            }
        } else {
            if (this.cur_page == 1) {
                this.cur_page = this.pages;
            } else {
                this.cur_page--;
            }


            this.offset -= this.limit;

            if (this.offset < 0) {
                this.offset = (Math.abs(this.pages * this.offset)) + this.offset;
            }
        }

        this.doAjax(this.getData(), direction);
    };
    // show the loader
    ContentSlider.prototype.loader = function(items, data) {
        var that = this;
        var r = $.Deferred();
        var timeout = 0;
        items.each(function(i, el){
            var $this = $(this);

            timeout = i * that.options.toLoader;
            setTimeout(function() {
                if (!data[i]) {
                    $(el).css('visibility', 'hidden');
                } else {
                    $(el).css('visibility', 'visible');
                    $this.find('.ad-wrapper').hide();
                    $this.find('.loader').css('display', 'table');
                }
            }, timeout);
        });
        setTimeout(function() {
            r.resolve('loader');
        }, timeout + 1);
        return r;
    };
    // wait for images
    ContentSlider.prototype.images = function(data) {
        var that = this;
        var r = $.Deferred();

        var goodData = [];

        $.each(data, function(i, val) {
            if (val) goodData.push(val);
        });

        that.failures = [];

        $.each(goodData, function(i, val) {

            var img = $('<img/>').attr('src', val.image),
                imgLoad = imagesLoaded(img);

            imgLoad.on('always', function() {
                img.remove();
                if ((i + 1) == goodData.length) {
                    r.resolve('images');
                }
            });

            imgLoad.on('fail', function(instance) {
                that.failures.push(i);
            });
        });
        return r;
    };
    // get the content
    ContentSlider.prototype.doAjax = function (data, direction) {
        var that   = this;

        var url = that.options.url ? that.options.url : this.$element.data('url');

        that.options.params.offset = data.offset;
        that.options.params.count = data.limit;

        this.$element.trigger('change.app.contentSlider');

        return $.ajax({
            url : url,
            method : 'GET',
            dataType: 'json',
            data: that.options.params,
            beforeSend: function() {
                that.appendTemplates();
            },
            success: function(json) {
                // that.total = json.count;
                if (json.length) {
                    var $items = that.$element.find('.shoveler-item');
                    // get the difference between items and json length
                    var lengthDiff = ($items.length - json.length);
                    // fill in empty content
                    if (lengthDiff > 0) {
                        for (var i = 0; i < lengthDiff; i++) {
                            json.push(false);
                        };
                    }
                    // reverse order
                    if (direction == 'next') {
                        json.reverse();
                        $items.reverse();
                    }

                    $.when(that.images(json), that.loader($items, json)).done(function (d1, d2) {
                        that.transition($items, json).then(function() {
                            that.containerHeight();
                        });
                    });
                }
            }
        });
    };
    // make shit happen
    ContentSlider.prototype.transition = function(items, json) {
        var that = this;

        var r = $.Deferred();

        setTimeout(function() {
            //some loader bull dick going on!
            items.each(function(i, el) {
                if (json[i]) {
                    var $el = $(el);

                    if ($.inArray(i, that.failures) !== -1) { //if it failed change image
                        $el.find('.ad-wrapper img').attr('src', '/images/no-image.png');
                    } else {
                        $el.find('.ad-wrapper img').attr('src', json[i].image);
                    }

                    $el.find('.ad-wrapper p').text(json[i].headline);
                }
            });

            items.find('.loader').hide();

            setTimeout(function() {
                items.find('.ad-wrapper').show();
                r.resolve('transition');
            }, 50);
            that.sliding = false;
        }, that.options.toTransition);

        return r;
    };
    // get data
    ContentSlider.prototype.getData = function() {
        return jQuery.extend({limit: this.limit, offset: this.offset}, this.$element.data('params'));
    };

    // PLUGIN DEFINITION
    // ==========================
    var old = $.fn.contentSlider;

    $.fn.contentSlider = function (option) {
        return this.each(function (i, v) {
            var $this   = $(this);
            var data    = $this.data('app.contentSlider');
            var options = $.extend({}, ContentSlider.DEFAULTS, $this.data(), typeof option == 'object' && option);
            var action  = typeof option == 'string' ? option : options.slide;

            $this.addClass('shoveler');

            if (!data) $this.data('app.contentSlider', (data = new ContentSlider(this, options)));
        })
    };

    $.fn.contentSlider.Constructor = ContentSlider;


    // NO CONFLICT
    // ====================

    $.fn.contentSlider.noConflict = function () {
        $.fn.contentSlider = old;

        return this;
    };


    // DATA-API
    // =================

    $(document).on('click.app.shoveler.data-api', '[data-slide], [data-slide-to]', function (e) {
        e.preventDefault();

        var $this = $(this);

        $this.closest('.shoveler').data('app.contentSlider').slide($this.data('slide'));
    });

}(jQuery);
