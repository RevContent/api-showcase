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
    window.RevSlider = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDialog);

}( window, function factory(window, revUtils, revDetect, revApi, revDialog) {
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
            ad_border: true,
            headline_size: 2,
            max_headline: false,
            text_overlay: false,
            vertical: false,
            page_increment: true,
            wrap_pages: true,
            wrap_reverse: true, // if page_increment is false, this must be false
            show_padding: true,
            pages: 4,
            text_right: false
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

        this.moblie = (revDetect.mobile()) ? true : false;

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-slider');

        this.contentItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider';
        this.containerElement.class = 'rev-slider';

        this.innerElement = document.createElement('div');
        this.innerElement.id = 'rev-slider-inner';

        this.gridContainerElement = document.createElement('div');
        this.gridContainerElement.id = 'rev-slider-grid-container';

        this.gridElement = document.createElement('div');
        this.gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';

        revUtils.append(this.containerElement, this.innerElement);

        revUtils.append(this.innerElement, this.gridContainerElement);

        revUtils.append(this.gridContainerElement, this.gridElement);

        revUtils.append(this.element, this.containerElement);

        this.initButtons();

        this.grid = new AnyGrid(this.gridElement, this.gridOptions());

        this.page = 1;
        this.previousPage = 0;

        this.setUp();

        this.getData();

        this.appendElements();

        for (var i = 0; i < this.limit; i++) {
            this.gridElement.appendChild(this.createNewCell());
        };

        this.grid.reloadItems();
        this.grid.layout();

        this.setupButtons();

        this.textOverlay();

        this.ellipsisTimer;

        this.impressionTracker = [];
    };

    RevSlider.prototype.gridOptions = function() {
        return { masonry: false, perRow: this.options.per_row, transitionDuration: 0, isResizeBound: this.options.is_resize_bound, adjust_gutter:true };   
    }; 

    // RevSlider.prototype.getAnimationDuration = function() {
    //     var duration = 0.5;
    //     if (this.options.vertical) {
    //         var gridRows = this.options.rows[this.grid.getBreakPoint()];
    //         if (gridRows >= 7) {
    //             duration = 2;
    //         } else if (gridRows >= 6) {
    //             duration = 1.75;
    //         } else if (gridRows >= 5) {
    //             duration = 1.5;
    //         } else if (gridRows >= 4) {
    //             duration = 1.25;
    //         } else if (gridRows >= 3) {
    //             duration = 1;
    //         } else if (gridRows >= 2) {
    //             duration = 0.75;
    //         }
    //     } else {
    //         var gridWidth = this.grid.containerWidth;

    //         if (gridWidth >= 1500) {
    //             duration = 2;
    //         } else if (gridWidth >= 1250) {
    //             duration = 1.75;
    //         } else if (gridWidth >= 1000) {
    //             duration = 1.5;
    //         } else if (gridWidth >= 750) {
    //             duration = 1.25;
    //         } else if (gridWidth >= 500) {
    //             duration = 1;
    //         } else if (gridWidth >= 250) {
    //             duration = 0.75;
    //         }
    //     }
    //     if (!this.options.page_increment) {
    //         duration = duration * .5;
    //     }
    //     return duration;
    // };

    RevSlider.prototype.createNextPageGrid = function() {
        var that = this;

        var previousGridElement = this.gridElement;
        previousGridElement.id = 'rev-slider-grid-prev';

        var nextGridElement = document.createElement('div');
        nextGridElement.id = 'rev-slider-grid';

        var nextGrid = new AnyGrid(nextGridElement, this.gridOptions());

        nextGridElement.style.position = 'absolute';
        nextGridElement.style.height =  this.grid.size.height + 'px';
        nextGridElement.style.width =  this.grid.size.width + 'px';

        revUtils.append(this.gridContainerElement, nextGridElement);
        
        var animationDuration = 1.75; //this.getAnimationDuration(); TODO: make dynamic

        var width = (this.options.page_increment) ? this.gridElement.offsetWidth : this.gridElement.offsetWidth / this.grid.perRow;

        var rowHeight = this.gridElement.offsetHeight / this.options.rows[this.grid.getBreakPoint()];
        var height = (this.options.page_increment) ? this.gridElement.offsetHeight : rowHeight;
        var newTop = 0;
        var newLeft = 0;
        var invertedPadding = this.padding*-1;
        var topLeft = 'left';

        if (this.page > this.previousPage) { // slide left or up
            if (this.options.vertical) { // up
                topLeft = 'top';
                newTop = height + invertedPadding;
                newLeft = invertedPadding;
            } else { // left
                newTop = 0;
                newLeft = width + this.grid.itemPadding;
            }
        } else { // Slide right or down
            if (this.options.vertical) { // down
                topLeft = 'top';
                newTop = (height * -1) + invertedPadding;
                newLeft = invertedPadding;
            } else { // right
                newTop = 0;
                newLeft = ((width + this.grid.itemPadding) * -1);// - invertedPadding*2;
            }
        }

        nextGridElement.style.top = newTop + 'px';
        nextGridElement.style.left = newLeft + 'px';

        previousGridElement.style.left = 0;

        for (var i = 0; i < this.limit; i++) {
            nextGridElement.appendChild(this.createNewCell());
        };

        this.grid = nextGrid;
        this.gridElement = nextGridElement;

        this.updateDisplayedItems();
        this.checkEllipsis();
        this.textOverlay();
        this.grid.reloadItems();
        this.grid.layout();

        setTimeout(function () {
            nextGridElement.style.position = 'absolute';

            nextGridElement.style.transition = topLeft + ' ' + animationDuration + 's';
            nextGridElement.style.transitionTimingFunction = 'ease-in-out';

            previousGridElement.style.transition = topLeft + ' ' + animationDuration + 's';
            previousGridElement.style.transitionTimingFunction = 'ease-in-out';


            if (that.options.vertical) {
                nextGridElement.style.top = invertedPadding+'px';
                previousGridElement.style.top = (newTop * -1) + 'px';
            } else {
                nextGridElement.style.left = 0;
                previousGridElement.style.left = (newLeft * -1) + invertedPadding + 'px';
            }
        }, 0);

        setTimeout(function() {
            nextGridElement.style.position = 'relative';
            that.updateGrids();
        }, animationDuration * 1000);
    };

    RevSlider.prototype.updateGrids = function() {
        var gridContainerElement = document.getElementById('rev-slider-grid-container');
        var previousGridElement = gridContainerElement.querySelector('#rev-slider-grid-prev');
        revUtils.remove(previousGridElement);
        //this.gridElement.style.position = 'relative';
        this.gridElement.style.transition = '';
        this.gridElement.className = '';
    };

    RevSlider.prototype.setUp = function() {
        this.grid.layout();
        this.limit = this.getLimit();
        var rowsCols = (this.options.vertical) ? this.grid.perRow : this.options.rows[this.grid.getBreakPoint()];
        this.increment = (this.options.page_increment) ? this.limit : rowsCols;
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

        this.padding = (this.options.show_padding) ? ((width * .025).toFixed(2) / 1) : 0;

        // // font size is relative to width, other measurements are relative to this font size
        this.headlineFontSize = Math.max(14, ((width * .03).toFixed(2) / 1));
        this.headlineLineHeight = ((this.headlineFontSize * 1.25).toFixed(2) / 1);
        this.headlineHeight = ((this.headlineLineHeight * this.options.headline_size).toFixed(2) / 1);
        if (this.options.max_headline && this.getMaxHeadlineHeight() > 0) {
            this.headlineHeight = this.getMaxHeadlineHeight();
        }
        this.headlineMarginTop = ((this.headlineLineHeight * .4).toFixed(2) / 1);

        this.innerMargin = ((this.headlineMarginTop * .2).toFixed(2) / 1);

        this.providerFontSize = Math.max(11, ((this.headlineLineHeight / 2).toFixed(2) / 1));
        this.providerLineHeight = ((this.providerFontSize * 1.25).toFixed(2) / 1);
        this.providerMargin = ((this.providerLineHeight * .2).toFixed(2) / 1);

        this.preloaderHeight = (this.grid.columnWidth - (this.padding * 2) - (this.options.ad_border ? 2 : 0)) * (imageHeight / imageWidth);
    };

    RevSlider.prototype.initButtons = function() {
        this.backBtn = document.createElement('div');
        this.backBtn.id = "back-wrapper";
        this.backBtn.setAttribute('class', 'rev-btn-wrapper');

        var backBtnHtml = document.createElement('div');
        backBtnHtml.id = "back-btn-container";
        backBtnHtml.setAttribute('class', 'rev-btn-container');
        backBtnHtml.setAttribute('style', 'left: 0px;');
        //var backArrow = (this.options.vertical) ? '&circ;' : '&lsaquo;';
        backBtnHtml.innerHTML = '<label id="btn-back" class="rev-chevron">&lsaquo;</label>'; // &lsaquo; &circ;

        this.forwardBtn = document.createElement('div');
        this.forwardBtn.id = "forward-wrapper";
        this.forwardBtn.setAttribute('class', 'rev-btn-wrapper');

        var forwardBtnHtml = document.createElement('div');
        forwardBtnHtml.id = "forward-btn-container";
        forwardBtnHtml.setAttribute('class', 'rev-btn-container');
        forwardBtnHtml.setAttribute('style', 'right: 0px;');
        //var forwardArrow = (this.options.vertical) ? '&caron;' : '&rsaquo;';
        forwardBtnHtml.innerHTML = '<label id="btn-forward" class="rev-chevron">&rsaquo;</label>'; // &rsaquo; &caron;

        var gridContainerElement = this.containerElement.querySelector('#rev-slider-grid-container');

        revUtils.append(this.forwardBtn, forwardBtnHtml);
        revUtils.append(this.backBtn, backBtnHtml);
        revUtils.append(this.innerElement, this.backBtn);
        revUtils.append(this.innerElement, this.forwardBtn);

        if (this.mobile) {
            forwardBtnHtml.style.opacity = .3;
            backBtnHtml.style.opacity = .3;
            this.forwardBtn.style.opacity = 1;
            this.backBtn.style.opacity = 1;
        } else {
            this.forwardBtn.style.opacity = 0;
            this.backBtn.style.opacity = 0;
        }

        this.attachButtonEvents();
    };

    RevSlider.prototype.setupButtons = function() {
        if ((this.mobile && !this.options.show_arrows.mobile) || (!this.mobile && !this.options.show_arrows.desktop)) {
            this.backBtn.setAttribute('style', 'display: none;');
            this.forwardBtn.setAttribute('style', 'display: none;');
        } else {
            // var backBtn = this.containerElement.querySelector('#btn-back');
            // var forwardBtn = this.containerElement.querySelector('#btn-forward');
            var transform = 'rotate(0deg)';

            if (this.options.vertical) {
                revUtils.removeClass(this.backBtn, 'side');
                revUtils.removeClass(this.forwardBtn, 'side');

                revUtils.addClass(this.backBtn, 'top-bottom');
                revUtils.addClass(this.forwardBtn, 'top-bottom');

                this.backBtn.setAttribute('style', 'padding: 0px 0px; top: 0px;');
                this.forwardBtn.setAttribute('style', 'padding: 0px 0px; bottom: 0px;');
                transform = "rotate(90deg)";
            } else {
                revUtils.addClass(this.backBtn, 'side');
                revUtils.addClass(this.forwardBtn, 'side');

                revUtils.removeClass(this.backBtn, 'top-bottom');
                revUtils.removeClass(this.forwardBtn, 'top-bottom');

                this.backBtn.setAttribute('style', 'padding: 0px 0px; left: 0px; top: 0px;');
                this.forwardBtn.setAttribute('style', 'padding: 0px 0px; right: 0px; top: 0px;');
            }

            if (!this.mobile) {
                this.forwardBtn.style.opacity = 0;
                this.backBtn.style.opacity = 0;
            }
            if (!this.options.wrap_pages) {
                this.backBtn.style.display = 'none';
            }
        }
    };

    RevSlider.prototype.textOverlay = function() {
        var ads = this.containerElement.querySelectorAll('.rev-ad');
        if (this.options.text_overlay) {
            revUtils.addClass(this.containerElement, 'rev-slider-text-overlay');
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];
                ad.style.height = this.preloaderHeight + 'px';
                if (!ad.querySelectorAll('.rev-overlay').length) { // add rev-overlay if not already there
                    ad.querySelectorAll('img')[0].insertAdjacentHTML('afterend', '<div class="rev-overlay"></div>');
                }
            }
        } else {
            revUtils.removeClass(this.containerElement, 'rev-slider-text-overlay');
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];
                //ad.style.height = 'auto';
            }
        }
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
        this.sponsored.innerHTML = '<a href="javascript:;" onclick="revDialog.showDialog();">Sponsored by Revcontent</a>';
        if (this.options.rev_position == 'top_right') {
            revUtils.addClass(this.sponsored, 'top-right');
            revUtils.prepend(this.containerElement, this.sponsored);
        } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
            revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
            revUtils.append(this.containerElement, this.sponsored);
        }
    }


    RevSlider.prototype.update = function(newOpts, oldOpts) {

        this.options = revUtils.extend(this.options, newOpts);

        if ((this.options.size !== oldOpts.size) ||
            (this.options.realSize !== oldOpts.realSize) ||
            (this.options.per_row !== oldOpts.per_row) ||
            (this.options.rows !== oldOpts.rows) ||
            (this.options.headline_size !== oldOpts.headline_size) ||
            (this.options.vertical !== oldOpts.vertical) ||
            (this.options.page_increment !== oldOpts.page_increment) ||
            (this.options.show_padding !== oldOpts.show_padding)) {
            this.options.perRow = this.options.per_row; // AnyGrid needs camels
            this.resize();
        }

        if (!this.options.page_increment) {
            this.options.wrap_reverse = false;
        }

        if ((this.options.header !== oldOpts.header) || this.options.rev_position !== oldOpts.rev_position) {
            this.appendElements();
        }

        if (this.options.text_overlay !== oldOpts.text_overlay) {
            this.textOverlay();
            this.grid.reloadItems();
            this.grid.layout();
        }
        if (this.options.text_right !== oldOpts.text_right) {
            this.grid.reloadItems();
            this.grid.layout();
        }

        if (this.options.pages !== oldOpts.pages) {
            this.getData();
        }
    };

    RevSlider.prototype.getCellHeight = function() {
        var cellHeight = this.preloaderHeight;
        if (!this.options.text_overlay) {
            cellHeight += this.headlineHeight +
            this.headlineMarginTop + this.providerLineHeight +
            this.providerMargin*2;
            cellHeight += (this.options.ad_border) ? 2 : 0;
        }
        if (this.options.text_right) {
            cellHeight = cellHeight/2.7;
        }
        return cellHeight;
    }

    RevSlider.prototype.resize = function() {
        //var gridContainerElement = document.getElementById('rev-slider-grid-container');
        //gridContainerElement.style.height = '';
        //gridContainerElement.style.width = '100%';

        var oldLimit = this.limit;
        this.grid.option(this.options);
        this.setUp();

        var reconfig = 0;// how many to add or remove

        if (oldLimit != this.limit) {
            reconfig = (this.limit - oldLimit);

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
                    this.gridElement.appendChild(this.createNewCell());
                }
                this.resetDisplay();
            }
        }

        var ads = this.element.querySelectorAll('.rev-content');

        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];

            ad.querySelectorAll('.rev-ad')[0].style.height = this.getCellHeight() + 'px';

            //ad.style.width = this.grid.columnWidth + 'px';

            if (this.options.text_right) {
                var paddingOffset = this.padding * 2;
                var halfWidth = ((this.grid.columnWidth - paddingOffset) / 2);
                ad.querySelectorAll('#rev-headline-brand')[0].style.width = halfWidth + 'px';
                ad.querySelectorAll('a')[0].style.display = 'inline-flex';
                ad.querySelectorAll('.rev-image')[0].style.width = halfWidth + 'px';
            }
            ad.querySelectorAll('.rev-image')[0].style.height = this.preloaderHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.maxheight = this.headlineHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
            ad.querySelectorAll('.rev-headline h3')[0].style.fontSize = this.headlineFontSize +'px';
            ad.querySelectorAll('.rev-headline h3')[0].style.lineHeight = this.headlineLineHeight +'px';
            ad.querySelectorAll('.rev-provider')[0].style.margin = this.providerMargin +'px '  + this.innerMargin + 'px ' + this.providerMargin +'px';
            ad.querySelectorAll('.rev-provider')[0].style.fontSize = this.providerFontSize +'px';
            ad.querySelectorAll('.rev-provider')[0].style.lineHeight = this.providerLineHeight + 'px';
            ad.querySelectorAll('.rev-provider')[0].style.height = this.providerLineHeight +'px';


        }
        this.textOverlay();

        this.checkEllipsis();
        if (this.options.max_headline) {
            this.checkMaxHeadlineHeightPerRow();
        }
        this.grid.reloadItems();
        this.grid.layout();

        this.setupButtons();
    };

    RevSlider.prototype.checkMaxHeadlineHeightPerRow = function() {
        var itemsPerRow = this.grid.getPerRow();
        var currentRowNum = 0;
        var currentHeadlineHeight = this.getMaxHeadlineHeight(currentRowNum, itemsPerRow);
        var ads = this.element.querySelectorAll('.rev-content');
        if (ads.length > 0) {
            for (var i = 0; i < ads.length; i++) {
                if (i > 0 && i % itemsPerRow == 0) {
                    currentHeadlineHeight = this.getMaxHeadlineHeight(++currentRowNum, itemsPerRow);
                }
                var ad = ads[i];
                ad.querySelectorAll('.rev-headline')[0].style.maxheight = currentHeadlineHeight + 'px';
            }
        }
    };


    RevSlider.prototype.checkEllipsis = function() {
        var that = this;
        clearTimeout(that.ellipsisTimer);
        that.ellipsisTimer = setTimeout(function() {
            that.doEllipsis();
        }, 10);
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
    };

    RevSlider.prototype.createNewCell = function() {
        var html = '<div class="rev-ad" style="height: '+ this.getCellHeight() + 'px;' + (this.options.ad_border ? 'border:1px solid #eee' : '') +'" onmousedown="return false">' +
            '<a href="" target="_blank">' +
            '<div class="rev-image" style="height:'+ this.preloaderHeight +'px">' +
            '<img src=""/>' +
            '</div>' +
            '<div id="rev-headline-brand">' +
            '<div class="rev-headline" style="max-height:'+ this.headlineHeight +'px; margin:'+ this.headlineMarginTop +'px ' + this.innerMargin + 'px' + ' 0;">' +
            '<h3 style="font-size:'+ this.headlineFontSize +'px; line-height:'+ this.headlineLineHeight +'px;"></h3>' +
            '</div>' +
            '<div style="margin:' + this.providerMargin +'px '  + this.innerMargin + 'px ' + this.providerMargin +'px;font-size:'+ this.providerFontSize +'px;line-height:'+ this.providerLineHeight +'px;height:'+ this.providerLineHeight +'px;" class="rev-provider"></div>' +
            '</div>' +
            '</a>' +
            '</div>';
        var cell = document.createElement('div');

        cell.style.padding = this.padding + 'px';
        //cell.style.height = this.getCellHeight() + 'px';

        revUtils.addClass(cell, 'rev-content');

        cell.innerHTML = html;

        return cell;
    }

    RevSlider.prototype.getData = function() {
        var sponsoredCount = this.options.pages * this.limit
        var url = this.options.url + '?api_key='+ this.options.api_key +'&uitm=true&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&internal_count=0'+'&sponsored_count=' + sponsoredCount;

        var that = this;

        revApi.request(url, function(resp) {
            that.contentItems = resp;
            that.resetDisplay();

            imagesLoaded( that.gridElement, function() {
                revUtils.addClass(that.containerElement, 'loaded');
                that.resize();
            });
        });
    };

    RevSlider.prototype.registerImpressions = function(offset, count) {
        var impressionsUrl = this.options.url + '?&api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&api_source=flick';

        impressionsUrl += '&sponsored_count=' + (this.options.internal ? 0 : count) + '&internal_count=' + (this.options.internal ? count : 0) + '&sponsored_offset='+ (this.options.internal ? 0 : offset) +'&internal_offset=' + (this.options.internal ? offset : 0);

        var that = this;
        // don't do the same one twice, this could be improved I am sure
        if ( typeof this.impressionTracker[offset + '_' + count] == 'undefined') {
            revApi.request(impressionsUrl, function() {
                that.impressionTracker[offset + '_' + count] = true;
            });
        }
    }

    RevSlider.prototype.resetDisplay = function() {
        this.previousPage = 0;
        this.page = 1;
        this.updateDisplayedItems();
    }

    RevSlider.prototype.updateDisplayedItems = function() {
        var correctedPage = Math.abs(this.page);
        var countOffset = ((correctedPage * this.increment) - this.increment);
        var endIndex = countOffset + this.limit;
        var moreItemsNeeded = 0;
        if (endIndex > this.contentItems.length) {
            endIndex = this.contentItems.length;
            moreItemsNeeded = this.limit - (endIndex - countOffset);
        }
        var itemsToDisplay = [];
        for (var i = 0; countOffset < endIndex; i++, countOffset++) {
            itemsToDisplay[i] = this.contentItems[countOffset];
        }
        for (var i = 0; i < moreItemsNeeded; i++) {
            itemsToDisplay[itemsToDisplay.length] = this.contentItems[i];
        }
        var ads = this.gridElement.querySelectorAll('.rev-ad');
        var contentIndex = 0;
        var rowCount = 0;
        var contentIncrement = (this.options.vertical) ? 1 : this.options.rows[this.grid.getBreakPoint()];
        for (var i = 0; i < this.limit; i++) {
            var ad = ads[i],
                data = itemsToDisplay[contentIndex];

            if (this.options.text_right) {
                var paddingOffset = this.padding * 2;
                var halfWidth = ((this.grid.columnWidth - paddingOffset) / 2);
                ad.querySelectorAll('#rev-headline-brand')[0].style.width = halfWidth + 'px';
                ad.querySelectorAll('a')[0].style.display = 'inline-flex';
                ad.querySelectorAll('.rev-image')[0].style.width = halfWidth + 'px';
            }
            ad.querySelectorAll('a')[0].setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', ''));
            ad.querySelectorAll('a')[0].title = data.headline;
            ad.querySelectorAll('img')[0].setAttribute('src', data.image);
            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
            ad.querySelectorAll('.rev-image')[0].style.height = this.preloaderHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.maxheight = this.headlineHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
            ad.querySelectorAll('.rev-headline h3')[0].style.fontSize = this.headlineFontSize +'px';
            ad.querySelectorAll('.rev-headline h3')[0].style.lineHeight = this.headlineLineHeight +'px';
            ad.querySelectorAll('.rev-provider')[0].style.margin = this.providerMargin +'px '  + this.innerMargin + 'px ' + this.providerMargin +'px';
            ad.querySelectorAll('.rev-provider')[0].style.fontSize = this.providerFontSize +'px';
            ad.querySelectorAll('.rev-provider')[0].style.lineHeight = this.providerLineHeight + 'px';
            ad.querySelectorAll('.rev-provider')[0].style.height = this.providerLineHeight +'px';
            contentIndex += contentIncrement;
            if (!this.options.vertical && contentIndex > this.limit - 1) {
                contentIndex = ++rowCount;
            }
        }
        this.registerImpressions(0, this.limit);
    }

    RevSlider.prototype.hasNextPage = function() {
        //var pageOffset = (this.options.page_increment) ? 0 : this.limit;
        var correctedPage = Math.abs(this.page);
        return this.contentItems.length  >= (correctedPage * this.increment) + this.increment;
    }

    RevSlider.prototype.hasPreviousPage = function() {
        var correctedPage = Math.abs(this.page);
        return (correctedPage - 1) > 0;
    }

    RevSlider.prototype.hasMorePages = function() {
        var correctedPage = Math.abs(this.page);
        return this.contentItems.length  >= (correctedPage * this.increment) + this.increment;
    }

    RevSlider.prototype.attachButtonEvents = function() {
        var that = this;
        this.forwardBtn.addEventListener('click', function() {
            that.showNextPage();
        });

        this.backBtn.addEventListener('click', function() {
            that.showPreviousPage();
        });
    };

    RevSlider.prototype.showNextPage = function() {
        if (!this.gridUpdateTimer) {
            if (this.options.wrap_pages) {
                if (!this.hasMorePages() || this.page === -1) {
                    // wrap or reverse
                    this.page = (this.options.wrap_reverse) ? this.page * -1 : 0;
                }
            }
            this.previousPage = this.page;
            this.page = this.page + 1;
            this.createNextPageGrid();
            if (!this.hasNextPage() && !this.options.wrap_pages) {
                // Disable forward button
                var forwardBtnWrapper = this.containerElement.querySelector('#forward-wrapper');
                forwardBtnWrapper.style.display = 'none';
            }
            if (this.hasPreviousPage()) {
                var backBtnWrapper = this.containerElement.querySelector('#back-wrapper');
                backBtnWrapper.style.display = 'block';
            }
        }
    }

    RevSlider.prototype.showPreviousPage = function() {
        if (!this.gridUpdateTimer) {
            if (this.options.wrap_pages) {
                if (this.options.wrap_reverse) {
                    if (!this.hasMorePages() || this.page === 1) {
                        // Reverse direction
                        this.page = this.page * -1;
                    }
                } else if (!this.hasPreviousPage()) {
                    // Wrap to end
                    this.page = Math.floor(this.contentItems.length / this.increment);
                    // Add 1 here as it will be subtracted below.
                    this.page += 1;
                }
            }
            this.previousPage = this.page;
            this.page = this.page - 1;
            this.createNextPageGrid();
            if (!this.hasPreviousPage() && !this.options.wrap_pages) {
                // Disable back button
                var backBtnWrapper = this.containerElement.querySelector('#back-wrapper');
                backBtnWrapper.style.display = 'none';
            } else {
                var forwardBtnWrapper = this.containerElement.querySelector('#forward-wrapper');
                forwardBtnWrapper.style.display = 'block';
            }
        }
    }

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