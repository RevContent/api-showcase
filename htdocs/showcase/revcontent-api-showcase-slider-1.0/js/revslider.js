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
            ad_border: false,
            headline_size: 2,
            max_headline: false,
            text_overlay: false,
            vertical: false,
            page_increment: true,
            wrap_pages: true,
            wrap_reverse: true, // if page_increment is false, this must be false
            show_padding: true,
            pages: 4
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

        this.contentItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider';
        this.containerElement.class = 'rev-slider';

        var gridContainerElement = document.createElement('div');
        gridContainerElement.id = 'rev-slider-grid-container';

        this.gridElement = document.createElement('div');
        this.gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';

        // Utility for detecting swipe gestures
        this.hammer = new Hammer.Manager(gridContainerElement, null);
        this.hammer.add( new Hammer.Swipe({ direction: Hammer.DIRECTION_ALL, threshold: 10 }) );
        this.hammer.on("swipe", function(event) {
            // event.direction: 2 = left, 4 = right, 8 = up, 16 = down
            if (event.direction === 2 || event.direction === 8) {
                that.showNextPage();
            } else if (event.direction === 4 || event.direction === 16) {
                that.showPreviousPage();
            }
        });

        revUtils.append(this.containerElement, gridContainerElement);

        revUtils.append(gridContainerElement, this.gridElement);

        revUtils.append(this.element, this.containerElement);

        this.initButtons();

        this.grid = new AnyGrid(this.gridElement, { masonry: false, perRow: this.options.per_row, transitionDuration: 0, isResizeBound: this.options.is_resize_bound});

        /*this.grid.on('resized', function() {
            that.resize();
        });*/
        revUtils.addEventListener(window, 'resize', function() {
            that.resize();
        });

        this.page = 1;
        this.previousPage = 0;

        this.setUp();

        this.getData();

        this.appendElements();

        for (var i = 0; i < this.limit; i++) {
            this.appendCell();
        };

        this.grid.reloadItems();
        this.grid.layout();

        this.textOverlay();

        this.ellipsisTimer;

        this.impressionTracker = [];
    };

    RevSlider.prototype.getAnimationDuration = function() {
        var duration = 0.5;
        if (this.options.vertical) {
            var gridRows = this.options.rows[this.grid.getBreakPoint()];
            if (gridRows >= 7) {
                duration = 2;
            } else if (gridRows >= 6) {
                duration = 1.75;
            } else if (gridRows >= 5) {
                duration = 1.5;
            } else if (gridRows >= 4) {
                duration = 1.25;
            } else if (gridRows >= 3) {
                duration = 1;
            } else if (gridRows >= 2) {
                duration = 0.75;
            }
        } else {
            var gridWidth = this.grid.containerWidth;

            if (gridWidth >= 1500) {
                duration = 2;
            } else if (gridWidth >= 1250) {
                duration = 1.75;
            } else if (gridWidth >= 1000) {
                duration = 1.5;
            } else if (gridWidth >= 750) {
                duration = 1.25;
            } else if (gridWidth >= 500) {
                duration = 1;
            } else if (gridWidth >= 250) {
                duration = 0.75;
            }
        }
        if (!this.options.page_increment) {
            duration = duration * .5;
        }
        return duration;
    }

    RevSlider.prototype.createNextPageGrid = function() {
        var that = this;
        var gridContainerElement = document.getElementById('rev-slider-grid-container');
        var previousGridElement = this.gridElement;
        previousGridElement.id = 'rev-slider-grid-prev';

        var nextGridElement = document.createElement('div');
        nextGridElement.id = 'rev-slider-grid';

        revUtils.append(gridContainerElement, nextGridElement);
        var nextGrid = new AnyGrid(nextGridElement, { masonry: false, perRow: this.options.per_row, transitionDuration: 0, isResizeBound: this.options.is_resize_bound});

        var animationDuration = this.getAnimationDuration();

        var width = (this.options.page_increment) ? this.grid.containerWidth : this.grid.containerWidth / this.grid.perRow;
        var rowHeight = this.gridElement.offsetHeight / this.options.rows[this.grid.getBreakPoint()];
        var height = (this.options.page_increment) ? this.gridElement.offsetHeight : rowHeight;
        var newTop = 0;
        var newLeft = 0;
        var topLeft = 'left';
        if (this.page > this.previousPage) { // slide left or up
            if (this.options.vertical) { // up
                topLeft = 'top';
                newTop = height;
            } else { // left
                newLeft = width;
            }
        } else { // Slide right or down
            if (this.options.vertical) { // down
                topLeft = 'top';
                newTop = height * -1;
            } else { // right
                newLeft = width * -1;
            }
        }
        nextGridElement.setAttribute('style', 'position: absolute; top: '+newTop+'px; left: '+newLeft+'px;');
        nextGridElement.style.transition = topLeft + ' ' + animationDuration + 's';
        nextGridElement.style.transitionTimingFunction = 'ease-in-out';
        previousGridElement.setAttribute('style', 'position: absolute; top: 0px; left: 0px; z-index: 5');
        previousGridElement.style.transition = topLeft + ' ' + animationDuration + 's';
        previousGridElement.style.transitionTimingFunction = 'ease-in-out';
        setTimeout(function () {
            if (that.options.vertical) {
                nextGridElement.style.top = '0px';
                previousGridElement.style.top = (newTop * -1) + 'px';
            } else {
                nextGridElement.style.left = '0px';
                previousGridElement.style.left = (newLeft * -1) + 'px';
            }
        }, 50);

        for (var i = 0; i < this.limit; i++) {
            nextGridElement.appendChild(this.createNewCell());
        };
        this.removeBorderPadding(nextGridElement);

        this.grid = nextGrid;
        this.gridElement = nextGridElement;

        this.updateDisplayedItems();
        this.checkEllipsis();
        this.textOverlay();
        this.grid.reloadItems();
        this.grid.layout();

        this.gridUpdateTimer = setTimeout(function() {
            that.updateGrids();
        }, animationDuration * 1000);
    }

    RevSlider.prototype.updateGrids = function() {
        var gridContainerElement = document.getElementById('rev-slider-grid-container');
        var previousGridElement = gridContainerElement.querySelector('#rev-slider-grid-prev');
        revUtils.remove(previousGridElement);
        this.gridElement.style.position = 'relative';
        this.gridElement.className = '';
        clearTimeout(this.gridUpdateTimer);
        this.gridUpdateTimer = null;
    }

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
        var backBtnWrapper = document.createElement('div');
        backBtnWrapper.id = "back-wrapper";
        backBtnWrapper.setAttribute('class', 'rev-btn-wrapper');

        var backBtn = document.createElement('div');
        backBtn.id = "back-btn-container";
        backBtn.setAttribute('class', 'rev-btn-container');
        backBtn.setAttribute('style', 'left: 0px;');
        //var backArrow = (this.options.vertical) ? '&circ;' : '&lsaquo;';
        backBtn.innerHTML = '<label id="btn-back" class="rev-chevron">&lsaquo;</label>'; // &lsaquo; &circ;

        revUtils.append(backBtnWrapper, backBtn);

        var forwardBtnWrapper = document.createElement('div');
        forwardBtnWrapper.id = "forward-wrapper";
        forwardBtnWrapper.setAttribute('class', 'rev-btn-wrapper');

        var forwardBtn = document.createElement('div');
        forwardBtn.id = "forward-btn-container";
        forwardBtn.setAttribute('class', 'rev-btn-container');
        forwardBtn.setAttribute('style', 'right: 0px;');
        //var forwardArrow = (this.options.vertical) ? '&caron;' : '&rsaquo;';
        forwardBtn.innerHTML = '<label id="btn-forward" class="rev-chevron">&rsaquo;</label>'; // &rsaquo; &caron;

        revUtils.append(forwardBtnWrapper, forwardBtn);

        var gridContainerElement = this.containerElement.querySelector('#rev-slider-grid-container');
        revUtils.append(gridContainerElement, backBtnWrapper);
        revUtils.append(gridContainerElement, forwardBtnWrapper);

        var isMobile = (revDetect.mobile()) ? true : false;
        if (isMobile) {
            forwardBtn.style.opacity = .3;
            backBtn.style.opacity = .3;
            forwardBtnWrapper.style.opacity = 1;
            backBtnWrapper.style.opacity = 1;
        } else {
            forwardBtnWrapper.style.opacity = 0;
            backBtnWrapper.style.opacity = 0;
        }

        this.attachButtonEvents();
    }

    RevSlider.prototype.setupButtons = function() {
        var isMobile = (revDetect.mobile()) ? true : false;
        var backBtnWrapper = this.containerElement.querySelector('#back-wrapper');
        var forwardBtnWrapper = this.containerElement.querySelector('#forward-wrapper');
        var backBtnContainer = this.containerElement.querySelector('#back-btn-container');
        var forwardBtnContainer = this.containerElement.querySelector('#forward-btn-container');

        if ((isMobile && !this.options.show_arrows.mobile) || (!isMobile && !this.options.show_arrows.desktop)) {
            backBtnWrapper.setAttribute('style', 'display: none;');
            forwardBtnWrapper.setAttribute('style', 'display: none;');
        } else {
            var backBtn = this.containerElement.querySelector('#btn-back');
            var forwardBtn = this.containerElement.querySelector('#btn-forward');
            var transform = 'rotate(0deg)';

            if (this.options.vertical) {
                backBtnContainer.style.borderRadius = '4px 4px 0px 0px';
                forwardBtnContainer.style.borderRadius = '0px 0px 4px 4px';
                revUtils.addClass(backBtnWrapper, 'top-bottom');
                revUtils.addClass(forwardBtnWrapper, 'top-bottom');
                backBtnWrapper.setAttribute('style', 'padding: 0px ' + this.padding + 'px; top: 0px;');
                forwardBtnWrapper.setAttribute('style', 'padding: 0px ' + this.padding + 'px; bottom: 0px;');
                transform = "rotate(90deg)";
            } else {
                backBtnContainer.style.borderRadius = '4px 0px 0px 4px';
                forwardBtnContainer.style.borderRadius = '0px 4px 4px 0px';
                revUtils.removeClass(backBtnWrapper, 'top-bottom');
                revUtils.removeClass(forwardBtnWrapper, 'top-bottom');
                backBtnWrapper.setAttribute('style', 'padding: ' + this.padding + 'px 0px; left: 0px; top: 0px;');
                forwardBtnWrapper.setAttribute('style', 'padding: ' + this.padding + 'px 0px; right: 0px; top: 0px;');
            }
            var btnTop = (backBtn.parentNode.offsetHeight / 2) - (backBtn.offsetHeight / 2) + 'px';
            var btnLeft = (backBtn.parentNode.offsetWidth / 2) - (backBtn.offsetWidth / 2) + 'px';
            backBtn.setAttribute('style', 'left: ' + btnLeft + '; top: ' + btnTop + '; transform: ' + transform + ';');
            forwardBtn.setAttribute('style', 'right: ' + btnLeft + '; top: ' + btnTop + '; transform: ' + transform + ';');

            if (!isMobile) {
                forwardBtnWrapper.style.opacity = 0;
                backBtnWrapper.style.opacity = 0;
            }
            if (!this.options.wrap_pages) {
                backBtnWrapper.style.display = 'none';
            }
        }
    }

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
                ad.style.height = 'auto';
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
        this.sponsored.innerHTML = '<a onclick="revDialog.showDialog();">Sponsored by Revcontent</a>';
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

        if (this.options.pages !== oldOpts.pages) {
            this.getData();
        }
    };

    RevSlider.prototype.resize = function() {
        var gridContainerElement = document.getElementById('rev-slider-grid-container');
        gridContainerElement.style.height = '';
        gridContainerElement.style.width = '100%';

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
                    this.appendCell();
                }
                this.resetDisplay();
            }
        }

        var ads = this.element.querySelectorAll('.rev-content');

        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];

            ad.style.width = this.columnWidth + 'px';
            //ad.style.marginright = this.margin + 'px';
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

        this.removeBorderPadding(this.gridElement);

        this.textOverlay();

        this.checkEllipsis();
        if (this.options.max_headline) {
            this.checkMaxHeadlineHeightPerRow();
        }
        this.grid.reloadItems();
        this.grid.layout();
        gridContainerElement.style.height = this.gridElement.offsetHeight + 'px';
        gridContainerElement.style.width = this.gridElement.offsetWidth + 'px';
        this.setupButtons();
    };

    RevSlider.prototype.removeBorderPadding = function(gridEl) {
        var ads = gridEl.querySelectorAll('.rev-content');
        var rows = this.options.rows[this.grid.getBreakPoint()];
        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];
            if (i == 0 || i == this.limit/rows) { // Remove padding left
                ad.style.paddingLeft = '0px';
            } else if (i == this.limit-1 || i == (this.limit/rows)-1) { // remove padding right
                ad.style.paddingRight = '0px';
            }
        }
    }

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
                ad.querySelectorAll('.rev-headline')[0].style.maxheight = currentHeadlineHeight + 'px';
            }
        }

    }


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
    }

    RevSlider.prototype.appendCell = function() {
        this.gridElement.appendChild(this.createNewCell());
    };

    RevSlider.prototype.createNewCell = function() {
        var html = '<div class="rev-ad" style="'+ (this.options.ad_border ? 'border:1px solid #eee' : '') +'" onmousedown="return false">' +
            '<a href="" target="_blank">' +
            '<div class="rev-image" style="height:'+ this.preloaderHeight +'px">' +
            '<img src=""/>' +
            '</div>' +
            '<div>' +
            '<div class="rev-headline" style="max-height:'+ this.headlineHeight +'px; margin:'+ this.headlineMarginTop +'px ' + this.innerMargin + 'px' + ' 0;">' +
            '<h3 style="font-size:'+ this.headlineFontSize +'px; line-height:'+ this.headlineLineHeight +'px;"></h3>' +
            '</div>' +
            '<div style="margin:' + this.providerMargin +'px '  + this.innerMargin + 'px ' + this.providerMargin +'px;font-size:'+ this.providerFontSize +'px;line-height:'+ this.providerLineHeight +'px;height:'+ this.providerLineHeight +'px;" class="rev-provider"></div>' +
            '</div>' +
            '</a>' +
            '</div>';
        var cell = document.createElement('div');

        cell.style.padding = this.padding + 'px';

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
        var forwardBtnContainer = that.containerElement.querySelector('#forward-btn-container');
        var backBtnContainer = that.containerElement.querySelector('#back-btn-container');
        forwardBtnContainer.addEventListener('click', function() {
            that.showNextPage();
        });

        backBtnContainer.addEventListener('click', function() {
            that.showPreviousPage();
        });
        var isMobile = (revDetect.mobile()) ? true : false;
        var forwardBtnWrapper = that.containerElement.querySelector('#forward-wrapper');
        var backBtnWrapper = that.containerElement.querySelector('#back-wrapper');
        if (!isMobile) {
            var gridContainerElement = this.containerElement.querySelector('#rev-slider-grid-container');
            gridContainerElement.addEventListener('mouseover', function () {
                forwardBtnWrapper.style.opacity = 1;
                backBtnWrapper.style.opacity = 1;
            });
            gridContainerElement.addEventListener('mouseout', function () {
                forwardBtnWrapper.style.opacity = 0;
                backBtnWrapper.style.opacity = 0;
            });
        }
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
