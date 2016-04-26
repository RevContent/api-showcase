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
    ad_border: true,
    disclosure_text: revDisclose.defaultDisclosureText,
    hide_provider: false,
    hide_header: false,
    beacons: true
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevSlider = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revApi, revDisclose) {
'use strict';

    var RevSlider = function(opts) {

        var defaults = {
            api_source: 'slide',
            visible: true,
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
            wrap_pages: true, //currently the only supported option
            wrap_reverse: true, //currently the only supported option
            show_padding: true,
            pages: 4,
            text_right: false,
            text_right_height: 100,
            transition_duration: 0,
            multipliers: {
                font_size: 0,
                margin: 0,
                padding: 0
            },
            prevent_default_pan: true,
            buttons: {
                forward: true,
                back: true,
                size: 40,
                position: 'inside',
                dual: false
            },
            disclosure_text: revDisclose.defaultDisclosureText,
            hide_provider: false,
            hide_header: false,
            hide_footer: false,
            beacons: true,
            touch_direction: Hammer.DIRECTION_HORIZONTAL // don't prevent vertical scrolling
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

        this.emitter = new EventEmitter();

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-slider');

        this.contentItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider';
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.vertical ? 'vertical' : 'horizontal'));
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.text_right ? 'text-right' : 'text-bottom'));

        this.innerContainerElement = document.createElement('div');
        this.innerContainerElement.id = 'rev-slider-container';

        this.innerElement = document.createElement('div');
        this.innerElement.id = 'rev-slider-inner';

        this.gridContainerElement = document.createElement('div');
        this.gridContainerElement.id = 'rev-slider-grid-container';

        var gridElement = document.createElement('div');
        gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';

        revUtils.append(this.containerElement, this.innerContainerElement);

        revUtils.append(this.innerContainerElement, this.innerElement);

        revUtils.append(this.innerElement, this.gridContainerElement);

        revUtils.append(this.gridContainerElement, gridElement);

        revUtils.append(this.element, this.containerElement);

        this.grid = new AnyGrid(gridElement, this.gridOptions());

        this.grid.on('resized', function() {
            that.resize();
        });

        this.setMultipliers();

        this.grid.option({gutter: this.getPadding()});

        this.offset = 0;
        this.page = 1;
        this.previousPage = 1;

        this.setUp();

        this.getData();

        this.appendElements();

        this.createCells();

        this.textOverlay();

        this.grid.reloadItems();
        this.grid.layout();

        this.getAnimationDuration();

        if (this.options.vertical && this.options.buttons.position == 'outside') { // buttons outside for vertical only
            this.innerContainerElement.style.padding = (this.options.buttons.back ? (this.options.buttons.size + 'px') : '0') + ' 0 ' + (this.options.buttons.forward ? (this.options.buttons.size + 'px') : '0');
        }

        this.initButtons();

        this.attachTouchEvents();

        this.impressionTracker = [];
    };

    RevSlider.prototype.createCells = function() {
        for (var i = 0; i < this.limit; i++) {
            this.grid.element.appendChild(this.createNewCell());
        }
    };

    RevSlider.prototype.getPadding = function() {
        this.padding = ((this.grid.columnWidth * this.marginMultiplier).toFixed(2) / 1);
        return this.padding;
    };

    RevSlider.prototype.setMultipliers = function() {
        this.fontSizeMultiplier = Math.round( (.044 + Number((this.options.multipliers.font_size * .01).toFixed(2))) * 1000 ) / 1000;
        this.marginMultiplier = Math.round( (.05 + Number((this.options.multipliers.margin * .01).toFixed(2))) * 1000 ) / 1000;
        this.paddingMultiplier = Math.round( (.01 + Number((this.options.multipliers.padding * .01).toFixed(2))) * 1000 ) / 1000;
    };

    RevSlider.prototype.gridOptions = function() {
        return { masonry: false, perRow: this.options.per_row, transitionDuration: this.options.transition_duration, isResizeBound: this.options.is_resize_bound, adjustGutter:true, removeVerticalGutters: true, gutter: this.padding };
    };

    RevSlider.prototype.getAnimationDuration = function() {
        this.animationDuration = 0.5;

        if (this.options.vertical) {
            var gridRows = this.grid.rowsCount;
            if (gridRows >= 7) {
                this.animationDuration = 2;
            } else if (gridRows >= 6) {
                this.animationDuration = 1.75;
            } else if (gridRows >= 5) {
                this.animationDuration = 1.5;
            } else if (gridRows >= 4) {
                this.animationDuration = 1.25;
            } else if (gridRows >= 3) {
                this.animationDuration = 1;
            } else if (gridRows >= 2) {
                this.animationDuration = 0.75;
            }
        } else {
            switch (this.grid.breakPoint) {
                case 'xxs':
                    this.animationDuration = .6;
                    break;
                case 'xs':
                    this.animationDuration = .7;
                    break;
                case 'sm':
                    this.animationDuration = .8;
                    break;
                case 'md':
                    this.animationDuration = .9;
                    break;
                case 'lg':
                    this.animationDuration = 1;
                    break;
                case 'xl':
                    this.animationDuration = 1.1;
                    break;
                case 'xxl':
                    this.animationDuration = 1.2;
                    break;
            }
        }

        return this.animationDuration;
    };

    RevSlider.prototype.createNextPageGrid = function() {
        var containerWidth = this.innerElement.offsetWidth;
        var containerHeight = this.innerElement.offsetHeight;

        if (this.direction == 'next') { // slide left or up
            var insert = 'append';
            if (this.options.vertical) { // up
                var margin = 'marginBottom';
                this.gridContainerTransform = 'translate3d(0, -'+ (containerHeight + (this.padding * 2)) +'px, 0)';
            } else { // left
                var margin = 'marginRight';
                this.gridContainerTransform = 'translate3d(-'+ (containerWidth + (this.padding * 2)) +'px, 0, 0)';
            }
        } else { // Slide right or down
            var insert = 'prepend';
            if (this.options.vertical) { // down
                var margin = 'marginTop';
                revUtils.transformCss(this.gridContainerElement, 'translate3d(0, -'+ (containerHeight + (this.padding * 2)) +'px, 0)');
                this.gridContainerTransform = 'translate3d(0, 0, 0)';
            } else { // right
                var margin = 'marginLeft';
                revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ (containerWidth + (this.padding * 2)) +'px, 0, 0)');
                this.gridContainerTransform = 'translate3d(0, 0, 0)';
            }
        }

        this.oldGrid = this.grid;

        this.grid.element.style[margin] = (this.padding * 2) + 'px';

        var gridElement = document.createElement('div');//something up here
        gridElement.id = 'rev-slider-grid';

        revUtils[insert](this.gridContainerElement, gridElement);

        var options = this.gridOptions();
        options.isResizeBound = false;
        this.grid = new AnyGrid(gridElement, options);

        if (!this.options.vertical) {
            this.oldGrid.element.style.width = containerWidth + 'px';
            this.oldGrid.element.style.float = 'left';

            this.grid.element.style.width = containerWidth + 'px';
            this.grid.element.style.float = 'left';

            this.gridContainerElement.style.width = ((containerWidth * 2) + (this.padding * 2)) + 'px';
        }

        this.createCells();

        this.textOverlay();

        this.grid.reloadItems();
        this.grid.layout();

        this.updateDisplayedItems(true);
    };

    RevSlider.prototype.transitionClass = function(transitioning)
    {
        revUtils[transitioning ? 'addClass' : 'removeClass'](this.element, 'rev-transitioning');
    }

    RevSlider.prototype.animateGrid = function() {
        this.transitioning = true;
        this.transitionClass(true);

        revUtils.transitionDurationCss(this.gridContainerElement, this.animationDuration + 's');
        revUtils.transformCss(this.gridContainerElement, this.gridContainerTransform);

        var that = this;
        setTimeout(function() {
            that.updateGrids();
            that.transitioning = false;
        }, this.animationDuration * 1000);
    };

    RevSlider.prototype.updateGrids = function(revert) {
        if (revert === true) {
            var removeGrid = this.grid;
            var transitionGrid = this.oldGrid;
        } else {
            var removeGrid = this.oldGrid;
            var transitionGrid = this.grid;
        }

        revUtils.transformCss(transitionGrid.element, 'none');
        transitionGrid.element.style.marginLeft = '0';
        transitionGrid.element.style.marginRight = '0';
        transitionGrid.element.className = '';

        revUtils.transitionDurationCss(this.gridContainerElement,  '0s');

        revUtils.transformCss(this.gridContainerElement, 'none');

        removeGrid.remove();
        removeGrid.destroy();
        revUtils.remove(removeGrid.element);

        if (revert) {
            this.grid = transitionGrid;
            this.offset = this.oldOffset;
        }

        if (!this.options.vertical) {
            this.grid.element.style.width = 'auto';
            this.grid.element.style.float = 'none';

            this.gridContainerElement.style.width = '100%';
        }

        this.grid.bindResize();

        var that = this;
        this.grid.on('resized', function() {
            that.resize();
        });

        that.transitionClass(false);
        this.updating = false;
    };

    RevSlider.prototype.setUp = function() {
        this.grid.layout();
        this.limit = this.getLimit();

        if (this.options.image_ratio == 'square') {
            this.imageHeight = 400;
            this.imageWidth = 400;
        } else if (this.options.image_ratio == 'rectangle') {
            this.imageHeight = 300;
            this.imageWidth = 400;
        } else if (this.options.image_ratio == 'wide_rectangle') {
            this.imageHeight = 450;
            this.imageWidth = 800;
        }

        this.preloaderHeight = Math.round((this.grid.columnWidth - (this.padding * 2) - ( this.options.ad_border ? 2 : 0 )) * (this.imageHeight / this.imageWidth));

        if (this.options.text_right) {
            this.preloaderHeight = this.options.text_right_height;
            this.preloaderWidth = Math.round(this.preloaderHeight * (this.imageWidth / this.imageHeight) * 100) / 100;
        }

        this.headlineFontSize = Math.max(14, ((this.grid.columnWidth * this.fontSizeMultiplier).toFixed(2) / 1));

        this.headlineLineHeight = ((this.headlineFontSize * 1.25).toFixed(2) / 1);
        this.headlineHeight = ((this.headlineLineHeight * this.options.headline_size).toFixed(2) / 1);

        this.headlineMarginTop = ((this.headlineLineHeight * .4).toFixed(2) / 1);

        this.providerFontSize = ((this.headlineLineHeight / 2).toFixed(2)) / 1;
        this.providerFontSize = this.providerFontSize < 11 ? 11 : this.providerFontSize;

        this.providerLineHeight = Math.round(((this.providerFontSize * 1.8).toFixed(2) / 1));

        this.innerMargin = Math.max(0, ((this.grid.columnWidth * this.paddingMultiplier).toFixed(2) / 1));
    };

    RevSlider.prototype.initButtons = function() {
        var chevronUp    = '<path d="M18 12l-9 9 2.12 2.12L18 16.24l6.88 6.88L27 21z"/>';
        var chevronDown  = '<path d="M24.88 12.88L18 19.76l-6.88-6.88L9 15l9 9 9-9z"/><path d="M0 0h36v36H0z" fill="none"/>';
        var chevronLeft  = '<path d="M23.12 11.12L21 9l-9 9 9 9 2.12-2.12L16.24 18z"/>';
        var chevronRight = '<path d="M15 9l-2.12 2.12L19.76 18l-6.88 6.88L15 27l9-9z"/>';

        var btnHeight = this.options.buttons.dual ? 'auto' : (this.options.vertical ? this.options.buttons.size + 'px' : '100%');

        this.backBtn = document.createElement('div');
        this.backBtn.id = "back-wrapper";
        this.backBtn.setAttribute('class', 'rev-btn-wrapper rev-btn-wrapper-back');
        this.backBtn.style.height = btnHeight;
        this.backBtn.style.left = this.options.buttons.dual ? 'auto' : '0';
        this.backBtn.innerHTML = '<div id="back-btn-container" class="rev-btn-container" style="right: ' + (this.options.buttons.dual ? 'auto' : '0px') +';">' +
            '<label id="btn-back" class="rev-chevron">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">' + (this.options.vertical ? chevronUp : chevronLeft) + '</svg>' +
            '</label></div>';

        this.forwardBtn = document.createElement('div');
        this.forwardBtn.id = "forward-wrapper";
        this.forwardBtn.setAttribute('class', 'rev-btn-wrapper rev-btn-wrapper-forward');
        this.forwardBtn.style.height = btnHeight;
        this.forwardBtn.style.right = this.options.buttons.dual ? 'auto' : '0';
        this.forwardBtn.innerHTML = '<div id="forward-btn-container" class="rev-btn-container" style="right: ' + (this.options.buttons.dual ? 'auto' : '0px') + ';">' +
            '<label id="btn-forward" class="rev-chevron">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">' + (this.options.vertical ? chevronDown : chevronRight) + '</svg>' +
            '</label></div>';

        if (this.options.buttons.dual) {
            this.btnContainer = document.createElement('div');
            this.btnContainer.setAttribute('class', 'rev-btn-dual');
            revUtils.append(this.btnContainer, this.backBtn);
            revUtils.append(this.btnContainer, this.forwardBtn);
            revUtils.append(this.innerContainerElement, this.btnContainer);
        } else {
            if (this.options.buttons.back) {
                revUtils.append(this.innerContainerElement, this.backBtn);
            }

            if (this.options.buttons.forward) {
                revUtils.append(this.innerContainerElement, this.forwardBtn);
            }
        }

        this.attachButtonEvents();
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

        if (!this.options.hide_header) {
            if (this.head) {
                revUtils.remove(this.head);
            }
            this.head = document.createElement('div');
            revUtils.addClass(this.head, 'rev-head');
            revUtils.prepend(this.containerElement, this.head);

            this.header = document.createElement('h2');
            this.header.innerHTML = this.options.header;
            revUtils.addClass(this.header, 'rev-header');
            revUtils.append(this.head, this.header);
        }

        if (!this.options.hide_footer) {
            if (this.foot) {
                revUtils.remove(this.foot);
            }
            var sponsoredFoot = (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right');
            if (sponsoredFoot) {
                this.foot = document.createElement('div');
                revUtils.addClass(this.foot, 'rev-foot');
                revUtils.append(this.containerElement, this.foot);
            }

            this.sponsored = document.createElement('div');

            revUtils.addClass(this.sponsored, 'rev-sponsored');
            this.sponsored.innerHTML = revDisclose.getDisclosure(this.options.disclosure_text);

            if (this.options.rev_position == 'top_right') {
                revUtils.addClass(this.sponsored, 'top-right');
                revUtils.prepend(this.head, this.sponsored);
            } else if (sponsoredFoot) {
                revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
                revUtils.append(this.foot, this.sponsored);
            }
        }
    };


    RevSlider.prototype.update = function(newOpts, oldOpts) {
        oldOpts = oldOpts ? oldOpts : this.options;

        this.options = revUtils.extend(this.options, newOpts);

        if ((this.options.size !== oldOpts.size) ||
            (this.options.realSize !== oldOpts.realSize) ||
            (this.options.per_row !== oldOpts.per_row) ||
            (this.options.rows !== oldOpts.rows) ||
            (this.options.headline_size !== oldOpts.headline_size) ||
            (this.options.vertical !== oldOpts.vertical) ||
            (this.options.show_padding !== oldOpts.show_padding)) {
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
        if (!this.options.text_overlay && !this.options.text_right) {
            cellHeight += this.headlineHeight +
            this.headlineMarginTop + this.providerLineHeight;
            cellHeight += (this.options.ad_border) ? 2 : 0;
        }
        return cellHeight;
    };

    RevSlider.prototype.resize = function() {
        var that = this;
        var oldLimit = this.limit;
        this.grid.option({transitionDuration: 0});
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
                }
            } else {
                for (var i = 0; i < (this.limit - nodes.length); i++) {
                    this.grid.element.appendChild(this.createNewCell());
                }
                this.page = 1;
                this.previousPage = 1;
                this.updateDisplayedItems(false);
            }
        }

        if (this.options.max_headline) {
            this.headlineHeight = this.getMaxHeadlineHeight();
        }

        var ads = this.element.querySelectorAll('.rev-ad');

        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];

            ad.style.height = this.getCellHeight() + 'px';

            ad.querySelectorAll('.rev-image')[0].style.height = this.preloaderHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.maxHeight = this.headlineHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
            ad.querySelectorAll('.rev-headline h3')[0].style.fontSize = this.headlineFontSize +'px';
            ad.querySelectorAll('.rev-headline h3')[0].style.lineHeight = this.headlineLineHeight +'px';

            if(that.options.hide_provider === false) {
                ad.querySelectorAll('.rev-provider')[0].style.margin = this.providerMargin + 'px ' + this.innerMargin + 'px ' + this.providerMargin + 'px';
                ad.querySelectorAll('.rev-provider')[0].style.fontSize = this.providerFontSize + 'px';
                ad.querySelectorAll('.rev-provider')[0].style.lineHeight = this.providerLineHeight + 'px';
                ad.querySelectorAll('.rev-provider')[0].style.height = this.providerLineHeight + 'px';
            }

            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = this.displayedItems[i].headline;
        }
        this.textOverlay();
        this.checkEllipsis();

        this.grid.reloadItems();
        this.grid.layout();
        this.grid.option({transitionDuration: this.options.transition_duration});

        this.getAnimationDuration();

        this.emitter.emitEvent('resized');
    };

    RevSlider.prototype.checkEllipsis = function() {
        if (this.options.max_headline && !this.options.text_right) { // text_right should be limited, but don't waste for max_headline only
            return;
        }
        revUtils.ellipsisText(this.grid.element.querySelectorAll('.rev-content .rev-headline'));
    };

    RevSlider.prototype.getLimit = function() {
        // can pass object for rows or just single value for all breakpoints
        return this.grid.getPerRow() * (this.options.rows[this.grid.getBreakPoint()] ? this.options.rows[this.grid.getBreakPoint()] : this.options.rows);
    };

    RevSlider.prototype.createNewCell = function() {
        var imgWidth = typeof this.preloaderWidth === 'undefined' ? 'width:auto;' : 'width:' + this.preloaderWidth + 'px;';
        var html = '<div class="rev-ad" style="height: '+ this.getCellHeight() + 'px;' + (this.options.ad_border ? 'border:1px solid #eee' : '') +'">' +
            '<a href="" target="_blank">' +
            '<div class="rev-image" style="'+ imgWidth +'height:'+ this.preloaderHeight +'px">' +
            '<img src=""/>' +
            '</div>' +
            '<div class="rev-headline-brand">' +
            '<div class="rev-headline" style="max-height:'+ this.headlineHeight +'px; margin:'+ this.headlineMarginTop +'px ' + this.innerMargin + 'px' + ' 0;">' +
            '<h3 style="font-size:'+ this.headlineFontSize +'px; line-height:'+ this.headlineLineHeight +'px;"></h3>' +
            '</div>' +
            '<div style="margin:0 '  + this.innerMargin + 'px 0;font-size:'+ this.providerFontSize +'px;line-height:'+ this.providerLineHeight +'px;height:'+ this.providerLineHeight +'px;" class="rev-provider"></div>' +
            '</div>' +
            '</a>' +
            '</div>';

            var cell = document.createElement('div');

            cell.style.padding = this.padding + 'px';

            revUtils.addClass(cell, 'rev-content');

            cell.innerHTML = html;

            return cell;
    };

    RevSlider.prototype.getData = function() {
        var sponsoredCount = this.options.pages * this.limit;
        var url = this.options.url + '?api_key='+ this.options.api_key +'&uitm=true&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&internal_count=0'+'&sponsored_count=' + sponsoredCount;

        var that = this;

        revApi.request(url, function(resp) {
            that.contentItems = resp;
            that.updateDisplayedItems(that.options.visible);

            that.emitter.emitEvent('ready');
            that.ready = true;

            imagesLoaded( that.grid.element, function() {
                revUtils.addClass(that.containerElement, 'loaded');
            });
        });
    };

    RevSlider.prototype.registerImpressions = function() {
        if (this.impressionTracker[this.offset + '_' + this.limit]) {
            return; // impressions already tracked
        }

        var impressionsUrl = this.options.url + '?&api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&api_source=' + this.options.api_source;

        impressionsUrl += '&sponsored_count=' + (this.options.internal ? 0 : this.limit) + '&internal_count=' + (this.options.internal ? this.limit : 0) + '&sponsored_offset='+ (this.options.internal ? 0 : this.offset) +'&internal_offset=' + (this.options.internal ? this.offset : 0);

        this.impressionTracker[this.offset + '_' + this.limit] = true;
        var that = this;
        // don't do the same one twice, this could be improved I am sure
        revApi.request(impressionsUrl, function() {
            if(that.offset == 0 && true === that.options.beacons) { revApi.beacons.setPluginSource(that.options.api_source).attach(); }
            return;
        });
    };

    RevSlider.prototype.updateDisplayedItems = function(registerImpressions) {
        this.oldOffset = this.offset;

        this.offset = ((this.page - 1) * this.limit);

        var endIndex = this.offset + this.limit;
        var moreItemsNeeded = 0;
        if (endIndex > this.contentItems.length) {
            endIndex = this.contentItems.length;
            moreItemsNeeded = this.limit - (endIndex - this.offset);
        }
        this.displayedItems = [];
        for (var i = this.offset; i < endIndex; i++) {
            this.displayedItems.push(this.contentItems[i]);
        }
        for (var i = 0; i < moreItemsNeeded; i++) {
            this.displayedItems.push(this.contentItems[i]);
        }

        if (this.options.max_headline) {
            this.headlineHeight = this.getMaxHeadlineHeight();
        }

        var ads = this.grid.element.querySelectorAll('.rev-ad');

        for (var i = 0; i < this.displayedItems.length; i++) {
            var ad = ads[i],
                data = this.displayedItems[i];

            ad.style.height = this.getCellHeight() + 'px';

            ad.querySelectorAll('a')[0].setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', ''));
            ad.querySelectorAll('a')[0].title = data.headline;
            ad.querySelectorAll('img')[0].setAttribute('src', data.image);
            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
            ad.querySelectorAll('.rev-image')[0].style.height = this.preloaderHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.maxHeight = this.headlineHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
            ad.querySelectorAll('.rev-headline h3')[0].style.fontSize = this.headlineFontSize +'px';
            ad.querySelectorAll('.rev-headline h3')[0].style.lineHeight = this.headlineLineHeight +'px';
            ad.querySelectorAll('.rev-provider')[0].style.margin = '0 '  + this.innerMargin + 'px 0';
            ad.querySelectorAll('.rev-provider')[0].style.fontSize = this.providerFontSize +'px';
            ad.querySelectorAll('.rev-provider')[0].style.lineHeight = this.providerLineHeight + 'px';
            ad.querySelectorAll('.rev-provider')[0].style.height = this.providerLineHeight +'px';
        }

        if (registerImpressions) {
            this.registerImpressions();
        }

        this.grid.reloadItems();
        this.grid.layout();
        this.checkEllipsis();
    };

    RevSlider.prototype.maxPages = function() {
        return Math.floor(this.contentItems.length / this.limit);
    };

    RevSlider.prototype.attachButtonEvents = function() {
        var that = this;

        if (revDetect.mobile()) { // if mobile detect tap TODO: see if hammer can accept multiple elements somehow(array does not work :( )
            var mcForwardBtn = new Hammer(this.forwardBtn);
            mcForwardBtn.add(new Hammer.Tap());

            mcForwardBtn.on('tap', function(e) {
                that.showNextPage(true);
            });

            var mcBackBtn = new Hammer(this.backBtn);
            mcBackBtn.add(new Hammer.Tap());

            mcBackBtn.on('tap', function(e) {
                that.showPreviousPage(true);
            });
        } else {
            // dual button mouse move position
            if (this.options.buttons.dual) {
                this.element.addEventListener('mousemove', function(e) {
                    // get left or right cursor position
                    if ((e.clientX - that.element.getBoundingClientRect().left) > (that.element.offsetWidth / 2)) {
                        revUtils.addClass(that.btnContainer, 'rev-btn-dual-right');
                    } else {
                        revUtils.removeClass(that.btnContainer, 'rev-btn-dual-right');
                    }
                });
            }

            // button events
            revUtils.addEventListener(this.forwardBtn, 'click', function() {
                that.showNextPage(true);
            });

            revUtils.addEventListener(this.backBtn, 'click', function() {
                that.showPreviousPage(true);
            });

            revUtils.addEventListener(that.element, 'mouseenter', function(){
                revUtils.removeClass(that.containerElement, 'off');
                revUtils.addClass(that.containerElement, 'on');
            });
            revUtils.addEventListener(that.element, 'mouseleave', function(){
                revUtils.removeClass(that.containerElement, 'on');
                revUtils.addClass(that.containerElement, 'off');
            });
        }
    };

    RevSlider.prototype.attachTouchEvents = function() {
        var that = this;

        var mc = new Hammer(this.element);
        mc.add(new Hammer.Swipe({ threshold: 5, velocity: 0, direction: this.options.touch_direction }));
        mc.add(new Hammer.Pan({ threshold: 0, direction: this.options.touch_direction })).recognizeWith(mc.get('swipe'));

        this.movement = 0;
        this.made = false;
        this.panDirection = false;
        this.updown = false;

        this.element.addEventListener('click', function(e) {
            if (that.made || that.movement) {
                e.stopPropagation();
                e.preventDefault();
            }
        });

        mc.on('pan swipe', function(e) {
            // prevent default on pan by default, or atleast if the thing is moving
            // Lock needs to pass false for example so the user can scroll the page
            if (that.options.prevent_default_pan || that.made || that.transitioning || that.movement) {
                e.preventDefault(); // don't go scrolling the page or any other funny business
            }
        });

        mc.on('swipeleft', function(ev) {
            if (that.made || that.transitioning || !that.movement || that.panDirection == 'right') {
                return;
            }
            that.made = true;
            revUtils.transitionDurationCss(that.gridContainerElement, (that.animationDuration / 1.5) + 's');
            revUtils.transformCss(that.gridContainerElement, 'translate3d(-'+ (that.innerElement.offsetWidth + (that.padding * 2)) +'px, 0, 0)');
            setTimeout(function() {
                that.updateGrids();
                that.made = false;
                that.panDirection = false;
            }, (that.animationDuration / 1.5) * 1000);
            that.movement = 0;
        });

        mc.on('swiperight', function(e) {
            if (that.made || that.transitioning || !that.movement || that.panDirection == 'left') {
                return;
            }
            that.made = true;
            revUtils.transitionDurationCss(that.gridContainerElement, (that.animationDuration / 1.5) + 's');
            revUtils.transformCss(that.gridContainerElement, 'translate3d(0, 0, 0)');
            setTimeout(function() {
                that.updateGrids();
                that.made = false;
                that.panDirection = false;
            }, (that.animationDuration / 1.5) * 1000);
            that.movement = 0;
        });

        mc.on('panleft', function(e) {
            if (that.made || that.transitioning || that.panDirection == 'right') {
                return;
            }
            that.pan('left', e.distance / 10);
        });

        mc.on('panright', function(e) {
            if (that.made || that.transitioning || that.panDirection == 'left') {
                return;
            }
            that.pan('right', e.distance / 10);
        });

        mc.on('panup pandown', function(e) {
            that.updown = true;
        });

        mc.on('panend', function(e) {
            if (that.made || that.transitioning || (that.updown && !that.movement)) {
                return;
            }
            that.resetShowPage();
        });
    };

    RevSlider.prototype.pan = function(direction, movement, reset) {
        this.updown = false;

        this.transitionClass(true);

        this.panDirection = direction;
        if (direction == 'left') {
            this.showNextPage();
        } else if (direction == 'right') {
            this.showPreviousPage();
        }

        this.movement = this.movement + movement;

        if (this.movement > this.grid.containerWidth) {
            this.updateGrids();
            this.panDirection = false;
            this.movement = 0;
        } else {
            if (reset) { // used for touch simulation
                revUtils.transitionDurationCss(this.gridContainerElement,  this.animationDuration + 's');
                var that = this;
                setTimeout(function() {
                    that.resetShowPage(reset);
                }, this.animationDuration * 1000);
            } else {
                revUtils.transitionDurationCss(this.gridContainerElement,  '0s');
            }

            if (direction == 'left') {
                revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ this.movement +'px, 0, 0)');
            } else if (direction == 'right') {
                revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ ( (this.grid.containerWidth + (this.padding * 2)) - this.movement ) +'px, 0, 0)');
            }
        }
    };

    RevSlider.prototype.resetShowPage = function(ms) {
        var ms = ms ? ms : 300;
        revUtils.transitionDurationCss(this.gridContainerElement, ms + 'ms');
        if (this.panDirection == 'left') {
            revUtils.transformCss(this.gridContainerElement, 'none');
        } else {
            revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ ( (this.grid.containerWidth + (this.padding * 2))) +'px, 0, 0)');
        }

        this.page = this.previousPage;
        this.direction = this.previousDirection;
        this.previousPage = this.lastPage;

        var that = this;
        setTimeout(function() {
            that.updateGrids(true);
            that.movement = 0;
            that.made = false;
            that.panDirection = false;
        }, ms);
    };

    RevSlider.prototype.showNextPage = function(click) {
        if (!this.updating) {
            this.updating = true;

            var previousPage = this.page;

            if (this.direction == 'previous') {
                this.page = this.previousPage;
            } else {
                this.page = (this.page + 1);
            }

            if (this.page > this.maxPages()) {
                this.page = 1;
            }else if (this.page === 0) {
                this.page = this.maxPages();
            }

            this.lastPage = this.previousPage;
            this.previousPage = previousPage;
            this.previousDirection = this.direction;

            this.direction = 'next';
            this.createNextPageGrid();

            if (click) { // animate right away on click
                this.animateGrid();
            }
        }
    };

    RevSlider.prototype.showPreviousPage = function(click) {
        if (!this.updating) {
            this.updating = true;

            var previousPage = this.page;

            if (this.direction == 'next') {
                this.page = this.previousPage;
            } else {
                this.page = (this.page + 1);
            }

            if (this.page > this.maxPages()) {
                this.page = 1;
            }else if (this.page === 0) {
                this.page = this.maxPages();
            }

            this.lastPage = this.previousPage;
            this.previousPage = previousPage;
            this.previousDirection = this.direction;

            this.direction = 'previous';

            this.createNextPageGrid();

            if (click) {
                this.animateGrid();
            }
        }
    };

    RevSlider.prototype.getMaxHeadlineHeight = function() {
        var maxHeight = 0;
        if (this.options.text_right) { // based on preloaderHeight/ ad height
            var verticalSpace = this.preloaderHeight - this.providerLineHeight;
            var headlines = Math.floor(verticalSpace / this.headlineLineHeight);
            maxHeight = headlines * this.headlineLineHeight;
        } else {
            var ads = this.grid.element.querySelectorAll('.rev-ad');
            for (var i = 0; i < this.limit; i++) {
                var ad = ads[i];
                var el = document.createElement('div');
                el.style.position = 'absolute';
                el.style.zIndex = '100';
                el.style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
                el.innerHTML = '<h3 style="font-size:'+ this.headlineFontSize + 'px;line-height:'+ this.headlineLineHeight +'px">'+ this.displayedItems[i].headline + '</h3>';
                revUtils.prepend(ad, el); // do it this way b/c changin the element height on the fly needs a repaint and requestAnimationFrame is not avail in IE9
                maxHeight = Math.max(maxHeight, el.clientHeight);
                revUtils.remove(el);
            }
        }
        return maxHeight;
    };

    return RevSlider;
}));