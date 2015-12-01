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

RevSlider({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    show_arrows: {
        mobile: false,
        desktop: true
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
    per_row: {
        xxs: 1,
        xs: 1,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
        xxl: 7
    },
    image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
    rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
    header: 'Trending Now',
    devices: [
        'phone', 'tablet', 'desktop'
    ],
    url: 'https://trends.revcontent.com/api/v1/',
    ad_border: true
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevSlider = factory(window, window.revUtils, window.revDetect, window.revApi);

}( window, function factory(window, revUtils, revDetect, revApi) {
'use strict';

    var RevSlider = function(opts) {

        var defaults = {
            element: false,
            rows: {
                xxs: 2,
                xs: 2,
                sm: 2,
                md: 2,
                lg: 2,
                xl: 2,
                xxl: 2
            },
            per_row: {
                xxs: 1,
                xs: 1,
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
                mobile: false,
                desktop: true
            },
            internal: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/',
            ad_border: true,
            headline_size: 2,
            max_headline: false
        };

        // merge options
        this.options = revUtils.extend(defaults, opts);

        if (revUtils.validateApiParams(this.options).length) {
            return;
        }

        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        var that = this;

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-slider');

        var backBtn = document.createElement('div');
        backBtn.id = "back";
        backBtn.setAttribute('class', 'rev-btn-container');
        backBtn.innerHTML = '<button id="btn-back" class="rev-btn"><</button>';

        var forwardBtn = document.createElement('div');
        forwardBtn.id = "forward";
        forwardBtn.setAttribute('class', 'rev-btn-container');
        forwardBtn.innerHTML = '<button id="btn-forward" class="rev-btn">></button>';

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider';
        this.containerElement.class = 'rev-slider';

        var gridContainerElement = document.createElement('div');
        gridContainerElement.id = 'rev-slider-grid-container';

        this.gridElement = document.createElement('div');
        this.gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';

        revUtils.append(this.containerElement, gridContainerElement);
        // revUtils.append(gridContainerElement, backBtn);
        revUtils.append(gridContainerElement, this.gridElement);
        // revUtils.append(gridContainerElement, forwardBtn);
        revUtils.append(this.element, this.containerElement);

        this.grid = new AnyGrid(this.gridElement, { masonry: false, perRow: this.options.per_row, transitionDuration: 0, isResizeBound: this.options.is_resize_bound});

        this.grid.on('resized', function() {
            that.resize();
        });

        this.page = 1;

        this.setUp();

        this.getData();

        this.appendElements();

        for (var i = 0; i < this.limit; i++) {
            this.appendCell();
        };

        this.grid.reloadItems();
        this.grid.layout();

        // this.attachButtonEvents();

        this.ellipsisTimer;
    };

    RevSlider.prototype.setUp = function() {
        this.grid.layout();
        this.limit = this.getLimit();
        var width = this.grid.containerWidth / this.grid.perRow;

        if (this.options.image_ratio == 'square') {
            var imageHeight = 400;
            var imageWidth = 400;
        } else if (this.options.image_ratio == 'rectangle') {
            var imageHeight = 300;
            var imageWidth = 400;
        } else if (this.options.image_ratio == 'wide_rectangle') {
            var imageHeight = 450;
            var imageWidth = 800;
        }

        this.padding = ((width * .025).toFixed(2) / 1);

        // // font size is relative to width, other measurements are relative to this font size
        this.headlineFontSize = Math.max(14, ((width * .03).toFixed(2) / 1));
        this.headlineLineHeight = ((this.headlineFontSize * 1.25).toFixed(2) / 1);
        this.headlineHeight = ((this.headlineLineHeight * this.options.headline_size).toFixed(2) / 1);
        if (this.options.max_headline && this.getMaxHeadlineHeight() > 0) {
            this.headlineHeight = this.getMaxHeadlineHeight();
        }
        this.headlineMarginTop = ((this.headlineLineHeight * .4).toFixed(2) / 1);

        this.innerMargin = ((this.headlineMarginTop * .3).toFixed(2) / 1);

        this.providerFontSize = Math.max(11, ((this.headlineLineHeight / 2).toFixed(2) / 1));
        this.providerLineHeight = ((this.providerFontSize * 1.25).toFixed(2) / 1);
        this.providerMargin = ((this.providerLineHeight * .2).toFixed(2) / 1);

        this.preloaderHeight = (this.grid.columnWidth - (this.padding * 2) - (this.options.ad_border ? 2 : 0)) * (imageHeight / imageWidth);
    };

    RevSlider.prototype.appendElements = function() {
        if (this.header) {
            revUtils.remove(this.header);
        }
        this.header = document.createElement('h2');
        this.header.innerHTML = this.options.header;
        revUtils.addClass(this.header, 'rev-header');
        revUtils.prepend(this.containerElement, this.header);

        if (this.sponsored) {
            revUtils.remove(this.sponsored);
        }
        this.sponsored = document.createElement('div');
        revUtils.addClass(this.sponsored, 'rev-sponsored');
        this.sponsored.innerHTML = '<a href="http://revcontent.com" target="_blank">Sponsored by Revcontent</a>';
        if (this.options.rev_position == 'top_right') {
            revUtils.addClass(this.sponsored, 'top-right')
            revUtils.prepend(this.containerElement, this.sponsored);
        } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
            revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
            revUtils.append(this.containerElement, this.sponsored);
        }
    }


    RevSlider.prototype.update = function(newOpts, oldOpts) {

        this.options = revUtils.extend(this.options, newOpts);

        if ( (newOpts.size !== oldOpts.size) ||
             (newOpts.realSize !== oldOpts.realSize) ||
             (newOpts.per_row !== oldOpts.per_row) ||
             (newOpts.rows !== oldOpts.rows) ||
             (newOpts.headline_size !== oldOpts.headline_size)) {
            this.options.perRow = this.options.per_row; // AnyGrid needs camels
            this.resize();
        }

        if ((newOpts.header !== oldOpts.header) || newOpts.rev_position !== oldOpts.rev_position) {
            this.appendElements();
        }
    };

    RevSlider.prototype.resize = function() {
        var oldLimit = this.limit;
        this.grid.option(this.options);
        this.setUp();

        var reconfig = 0;// how many to add or remove

        if (oldLimit != this.limit) {
            reconfig = (this.limit - oldLimit);
            this.getData();
        }

        if (reconfig !== 0) {
            var nodes = this.element.querySelectorAll('.rev-content');
            if (reconfig < 0) {
                for (var i = 0; i < nodes.length; i++) {
                    if (i >= this.limit) {
                        this.grid.remove(nodes[i]);
                    }
                };
            } else {
                for (var i = 0; i < (this.limit - nodes.length); i++) {
                    this.appendCell();
                }
            }
        }

        var ads = this.element.querySelectorAll('.rev-content');

        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];

            ad.style.width = this.columnWidth + 'px';
            ad.style.marginRight = this.margin + 'px';

            ad.querySelectorAll('.rev-image')[0].style.height = this.preloaderHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.height = this.headlineHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';

            ad.querySelectorAll('.rev-headline h3')[0].style.fontSize = this.headlineFontSize +'px';
            ad.querySelectorAll('.rev-headline h3')[0].style.lineHeight = this.headlineLineHeight +'px';
            ad.querySelectorAll('.rev-provider')[0].style.margin = this.providerMargin +'px '  + this.innerMargin + 'px ' + this.providerMargin +'px';
            ad.querySelectorAll('.rev-provider')[0].style.fontSize = this.providerFontSize +'px';
            ad.querySelectorAll('.rev-provider')[0].style.lineHeight = this.providerLineHeight + 'px';
            ad.querySelectorAll('.rev-provider')[0].style.height = this.providerLineHeight +'px';
        }

        this.checkEllipsis();
        if (this.options.max_headline) {
            this.checkMaxHeadlineHeightPerRow();
        }
        this.grid.reloadItems();
        this.grid.layout();
    };

    RevSlider.prototype.checkMaxHeadlineHeightPerRow = function() {
        var itemsPerRow = this.grid.getPerRow();
        var currentRowNum = 0;
        var currentHeadlineHeight = this.getMaxHeadlineHeight(currentRowNum, itemsPerRow);
        var ads = this.element.querySelectorAll('.rev-content');
        if (ads.length > 0) {
            for (var i = 0; i < ads.length; i++) {
                if (i > 0 && i % itemsPerRow == 0) {
                    var currentHeadlineHeight = this.getMaxHeadlineHeight(++currentRowNum, itemsPerRow);
                }
                var ad = ads[i];
                ad.querySelectorAll('.rev-headline')[0].style.height = currentHeadlineHeight + 'px';
            }
        }

    }


    RevSlider.prototype.checkEllipsis = function() {
        var that = this;
        clearTimeout(that.ellipsisTimer);
        that.ellipsisTimer = setTimeout(function() {
            that.doEllipsis();
        }, 300);
    };

    RevSlider.prototype.doEllipsis = function() {
        var ads = this.element.querySelectorAll('.rev-content');
        if (ads.length > 0) {
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];
                var text = ad.querySelectorAll('a')[0].title;
                var el = ad.querySelectorAll('.rev-headline h3')[0];
                var newText = revUtils.ellipsisText(el, text, this.headlineHeight);
                ad.querySelectorAll('.rev-headline h3')[0].innerHTML = newText;
            }
        }
    };

    RevSlider.prototype.getLimit = function() {
        // can pass object for rows or just single value for all breakpoints
        return this.grid.getPerRow() * (this.options.rows[this.grid.getBreakPoint()] ? this.options.rows[this.grid.getBreakPoint()] : this.options.rows);
    }

    RevSlider.prototype.appendCell = function() {
        var html = '<div class="rev-ad" style="'+ (this.options.ad_border ? 'border:1px solid #eee' : '') +'">' +
                    '<a href="" target="_blank">' +
                        '<div class="rev-image" style="height:'+ this.preloaderHeight +'px">' +
                            '<img src=""/>' +
                        '</div>' +
                        '<div class="rev-headline" style="height:'+ this.headlineHeight +'px; margin:'+ this.headlineMarginTop +'px ' + this.innerMargin + 'px' + ' 0;">' +
                            '<h3 style="font-size:'+ this.headlineFontSize +'px; line-height:'+ this.headlineLineHeight +'px;"></h3>' +
                        '</div>' +
                        '<div style="margin:' + this.providerMargin +'px '  + this.innerMargin + 'px ' + this.providerMargin +'px;font-size:'+ this.providerFontSize +'px;line-height:'+ this.providerLineHeight +'px;height:'+ this.providerLineHeight +'px;" class="rev-provider"></div>' +
                    '</a>' +
                '</div>';
        var cell = document.createElement('div');

        cell.style.padding = this.padding + 'px';

        revUtils.addClass(cell, 'rev-content');

        cell.innerHTML = html;

        this.gridElement.appendChild(cell);
    };

    RevSlider.prototype.getData = function() {
        var url = this.options.url + '?api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&sponsored_count=' + this.limit + '&sponsored_offset=' + ((this.page * this.limit) - this.limit) + '&internal_count=0';

        var that = this;

        revApi.request(url, function(resp) {
            var ads = that.element.querySelectorAll('.rev-ad');
            for (var i = 0; i < resp.length; i++) {
                var ad = ads[i],
                    data = resp[i];
                ad.querySelectorAll('a')[0].setAttribute('href', data.url);
                ad.querySelectorAll('a')[0].title = data.headline;
                ad.querySelectorAll('img')[0].setAttribute('src', data.image);
                ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
                ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
            }

            imagesLoaded( that.gridElement, function() {
                revUtils.addClass(that.containerElement, 'loaded');
                that.resize();
            });
        });
    };

    RevSlider.prototype.attachButtonEvents = function() {
        var that = this;
        document.getElementById('btn-forward').addEventListener('click', function() {
            that.page = that.page + 1;
            that.getData();
        });

        document.getElementById('btn-back').addEventListener('click', function() {
            that.page = Math.max(1, that.page - 1);
            that.getData();
        });
    };

    RevSlider.prototype.getMaxHeadlineHeight = function(rowNum, numItems) {
        var maxHeadlineHeight = 0;
        var that = this;
        var ads = that.element.querySelectorAll('.rev-ad');
        if (ads.length > 0) {
            rowNum = (rowNum != undefined) ? rowNum : 0;
            numItems = (numItems != undefined) ? numItems : ads.length;
            var offset = rowNum * numItems;
            var nextOffset = offset + numItems;
            var el = ads[0].querySelectorAll('.rev-headline h3')[0];
            var t = el.cloneNode(true);
            t.style.visibility = 'hidden';
            t.style.height = 'auto';
            revUtils.append(el.parentNode, t);
            for (var i = offset; i < nextOffset; i++) {
                var ad = ads[i];
                t.innerHTML = ad.querySelectorAll('a')[0].title;
                if(t.clientHeight > maxHeadlineHeight) {
                    maxHeadlineHeight = t.clientHeight;
                }
            }
            revUtils.remove(t);
            var numLines = Math.ceil(maxHeadlineHeight / that.headlineLineHeight);
            maxHeadlineHeight = numLines * that.headlineLineHeight;
        }
        return maxHeadlineHeight;
    };


    return RevSlider;
}));
