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
            max_headline: false,
            text_overlay: false,
            vertical: false,
            page_increment: true,
            wrap_pages: true,
            show_padding: true,
            sponsored: 45
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



        revUtils.append(this.containerElement, gridContainerElement);

        revUtils.append(gridContainerElement, this.gridElement);

        revUtils.append(this.element, this.containerElement);

        this.initButtons();

        this.grid = new AnyGrid(this.gridElement, { masonry: false, perRow: this.options.per_row, transitionDuration: 0, isResizeBound: this.options.is_resize_bound});

        this.grid.on('resized', function() {
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

        this.attachButtonEvents();

        this.textOverlay();

        this.ellipsisTimer;

        this.impressionTracker = [];
    };

    RevSlider.prototype.createNextPageGrid = function() {
        var that = this;
        var gridContainerElement = document.getElementById('rev-slider-grid-container');
        var previousGridElement = this.gridElement;
        previousGridElement.id = 'rev-slider-grid-prev';

        var nextGridElement = document.createElement('div');
        nextGridElement.id = 'rev-slider-grid';

        revUtils.append(gridContainerElement, nextGridElement);
        var nextGrid = new AnyGrid(nextGridElement, { masonry: false, perRow: this.options.per_row, transitionDuration: 0, isResizeBound: this.options.is_resize_bound});
        nextGrid.on('resized', function() {
            that.resize();
        });

        nextGridElement.style.position = 'absolute';
        var gridTop = '-' + this.grid.element.offsetHeight + 'px;';
        nextGridElement.setAttribute('style', 'position: absolute; top: 0px; left: 0px;');

        var outClass = 'slideOutLeft';
        var inClass = 'slideInLeft';
        if (this.page > this.previousPage) {
            // slide left or up
            outClass = (this.options.vertical) ? 'slideOutUp' : 'slideOutLeft';
            inClass = (this.options.vertical) ? 'slideInUp' : 'slideInLeft';
        } else {
            // Slide right or down
            outClass = (this.options.vertical) ? 'slideOutDown' : 'slideOutRight';
            inClass = (this.options.vertical) ? 'slideInDown' : 'slideInRight';
        }

        revUtils.addClass(previousGridElement, outClass);
        revUtils.addClass(nextGridElement, inClass);

        for (var i = 0; i < this.limit; i++) {
            nextGridElement.appendChild(this.createNewCell());
        };

        var countOffset = ((this.page * this.increment) - this.increment);
        var endIndex = countOffset + this.limit;



        var ads = nextGridElement.querySelectorAll('.rev-content');
        var i = 0;
        var index = i + countOffset;
        for (index; index < endIndex; i++, index++) {
            var ad = ads[i],
                data = this.contentItems[index];
            ad.style.width = this.columnWidth + 'px';
            ad.style.marginRight = this.margin + 'px';
            ad.querySelectorAll('a')[0].setAttribute('href', data.url);
            ad.querySelectorAll('a')[0].title = data.headline;
            ad.querySelectorAll('img')[0].setAttribute('src', data.image);
            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;

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
        this.registerImpressions(countOffset, this.limit);

        this.textOverlay();

        nextGrid.reloadItems();
        nextGrid.layout();

        this.grid = nextGrid;
        this.gridElement = nextGridElement;

        this.checkEllipsis();

        this.gridUpdateTimer = setTimeout(function() {
            that.updateGrids();
        }, 1000);

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
        this.increment = (this.options.page_increment) ? this.limit : 1; //this.options.rows[this.grid.getBreakPoint()]
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

        this.innerMargin = ((this.headlineMarginTop * .3).toFixed(2) / 1);

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
        backBtn.id = "back";
        backBtn.setAttribute('class', 'rev-btn-container');
        backBtn.setAttribute('style', 'left: 0px;');
        var backArrow = (this.options.vertical) ? '&circ;' : '&lsaquo;';
        backBtn.innerHTML = '<label id="btn-back" class="rev-chevron">'+backArrow+'</label>'; // &lsaquo; &circ;

        revUtils.append(backBtnWrapper, backBtn);

        var forwardBtnWrapper = document.createElement('div');
        forwardBtnWrapper.id = "forward-wrapper";
        forwardBtnWrapper.setAttribute('class', 'rev-btn-wrapper');

        var forwardBtn = document.createElement('div');
        forwardBtn.id = "forward";
        forwardBtn.setAttribute('class', 'rev-btn-container');
        forwardBtn.setAttribute('style', 'right: 0px;');
        var forwardArrow = (this.options.vertical) ? '&caron;' : '&rsaquo;';
        forwardBtn.innerHTML = '<label id="btn-forward" class="rev-chevron">'+forwardArrow+'</label>'; // &rsaquo; &caron;

        revUtils.append(forwardBtnWrapper, forwardBtn);

        var gridContainerElement = this.containerElement.querySelector('#rev-slider-grid-container');
        revUtils.append(gridContainerElement, backBtnWrapper);
        revUtils.append(gridContainerElement, forwardBtnWrapper);
    }

    RevSlider.prototype.setupButtons = function() {
        var isMobile = (revDetect.mobile()) ? true : false;
        var backBtnWrapper = this.containerElement.querySelector('#back-wrapper');
        var forwardBtnWrapper = this.containerElement.querySelector('#forward-wrapper');

        if ((isMobile && !this.options.show_arrows.mobile) || (!isMobile && !this.options.show_arrows.desktop)) {
            backBtnWrapper.setAttribute('style', 'display: none;');
            forwardBtnWrapper.setAttribute('style', 'display: none;');
        } else {
            var backBtn = this.containerElement.querySelector('#btn-back');
            var forwardBtn = this.containerElement.querySelector('#btn-forward');

            if (this.options.vertical) {
                revUtils.addClass(backBtnWrapper, 'top-bottom');
                revUtils.addClass(forwardBtnWrapper, 'top-bottom');
                backBtnWrapper.setAttribute('style', 'padding: 0px ' + this.padding + 'px; top: 0px;');
                forwardBtnWrapper.setAttribute('style', 'padding: 0px ' + this.padding + 'px; bottom: 0px;');
                backBtn.innerHTML = '&circ;';
                forwardBtn.innerHTML = '&caron;';
                var btnLeft = (backBtn.parentNode.offsetWidth / 2) - (backBtn.offsetWidth / 2) + 'px';
                backBtn.setAttribute('style', 'left: ' + btnLeft + '; top: 50%;');
                forwardBtn.setAttribute('style', 'right: ' + btnLeft + '; top: 50%;');
            } else {
                revUtils.removeClass(backBtnWrapper, 'top-bottom');
                revUtils.removeClass(forwardBtnWrapper, 'top-bottom');
                backBtnWrapper.setAttribute('style', 'padding: ' + this.padding + 'px 0px; left: 0px; top: 0px;');
                forwardBtnWrapper.setAttribute('style', 'padding: ' + this.padding + 'px 0px; right: 0px; top: 0px;');
                backBtn.innerHTML = '&lsaquo;';
                forwardBtn.innerHTML = '&rsaquo;';
                var btnTop = (backBtn.parentNode.offsetHeight / 2) - (backBtn.offsetHeight / 2) + 'px';
                var btnLeft = (backBtn.parentNode.offsetWidth / 2) - (backBtn.offsetWidth / 2) + 'px';
                backBtn.setAttribute('style', 'left: ' + btnLeft + '; top: ' + btnTop + ';');
                forwardBtn.setAttribute('style', 'right: ' + btnLeft + '; top: ' + btnTop + ';');
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
            revUtils.addClass(this.sponsored, 'top-right')
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
            (this.options.page_increment !== oldOpts.page_increment)) {
            this.options.perRow = this.options.per_row; // AnyGrid needs camels
            this.resize();
        }

        if ((this.options.header !== oldOpts.header) || this.options.rev_position !== oldOpts.rev_position) {
            this.appendElements();
        }

        if (this.options.text_overlay !== oldOpts.text_overlay) {
            this.textOverlay();
            this.grid.reloadItems();
            this.grid.layout();
        }
    };

    RevSlider.prototype.resize = function() {
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
                this.updateDisplay();
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
        this.gridElement.appendChild(this.createNewCell());
    };

    RevSlider.prototype.createNewCell = function() {
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

        return cell;
    }

    RevSlider.prototype.getData = function() {
        var url = this.options.url + '?api_key='+ this.options.api_key +'&uitm=true&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&internal_count=0'+'&sponsored_count=' + this.options.sponsored;

        var that = this;

        revApi.request(url, function(resp) {
            that.contentItems = resp;
            that.updateDisplay();

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

    RevSlider.prototype.updateDisplay = function() {

        this.previousPage = 0;
        this.page = 1;

        var ads = this.element.querySelectorAll('.rev-ad');
        for (var i = 0; i < this.limit; i++) {
            var ad = ads[i],
                data = this.contentItems[i];
            ad.querySelectorAll('a')[0].setAttribute('href', data.url);
            ad.querySelectorAll('a')[0].title = data.headline;
            ad.querySelectorAll('img')[0].setAttribute('src', data.image);
            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
        }
        this.registerImpressions(0, this.limit);

    }

    RevSlider.prototype.hasNextPage = function() {
        var pageOffset = (this.options.page_increment) ? 0 : this.limit;
        return this.contentItems.length - pageOffset  >= (this.page + 1) * this.increment;
    }

    RevSlider.prototype.hasPreviousPage = function() {
        return (this.page - 1) > 0;
    }

    RevSlider.prototype.attachButtonEvents = function() {
        var that = this;
        document.getElementById('forward').addEventListener('click', function() {
            that.showNextPage();
        });

        document.getElementById('back').addEventListener('click', function() {
            that.showPreviousPage();
        });
        var gridContainerElement = this.containerElement.querySelector('#rev-slider-grid-container');
        gridContainerElement.addEventListener('mouseover', function() {
            var forwardBtnWrapper = that.containerElement.querySelector('#forward-wrapper');
            var backBtnWrapper = that.containerElement.querySelector('#back-wrapper');
            forwardBtnWrapper.style.opacity = 1;
            backBtnWrapper.style.opacity = 1;
        });
        gridContainerElement.addEventListener('mouseout', function() {
            var forwardBtnWrapper = that.containerElement.querySelector('#forward-wrapper');
            var backBtnWrapper = that.containerElement.querySelector('#back-wrapper');
            forwardBtnWrapper.style.opacity = 0;
            backBtnWrapper.style.opacity = 0;
        });
    };

    RevSlider.prototype.showNextPage = function() {
        if (!this.gridUpdateTimer) {
            if (!this.hasNextPage() && this.options.wrap_pages) {
                // Wrap to beginning
                this.page = 0;
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
            if (!this.hasPreviousPage() && this.options.wrap_pages) {
                // Wrap to end
                // We round up because this is actually to be the previous page
                this.page = Math.ceil(this.contentItems.length / this.limit);
            }
            this.previousPage = this.page;
            this.page = Math.max(1, this.page - 1);
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
