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
            impression_tracker: [],
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
            headline_size: 3,
            max_headline: false,
            min_headline_height: 17,
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
                line_height: 0,
                margin: 0,
                padding: 0
            },
            prevent_default_pan: true,
            buttons: {
                forward: true,
                back: true,
                size: 40,
                position: 'inside',
                style: 'default',
                dual: false
            },
            disclosure_text: revDisclose.defaultDisclosureText,
            hide_provider: false,
            hide_header: false,
            hide_footer: false,
            beacons: true,
            pagination_dots: false,
            touch_direction: Hammer.DIRECTION_HORIZONTAL, // don't prevent vertical scrolling
            overlay: false, // pass key value object { content_type: icon }
            overlay_icons: false, // pass in custom icons or overrides
            overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            query_params: false
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

        this.data = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider';
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.vertical ? 'vertical' : 'horizontal'));
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.text_right ? 'text-right' : 'text-bottom'));
        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

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

        this.paginationDots();

        this.initButtons();

        this.appendElements();

        this.limit = this.getLimit();

        this.grid.layout();

        this.setUp();

        this.getData();

        this.createCells();

        this.textOverlay();

        this.grid.reloadItems();
        this.grid.layout();

        this.getAnimationDuration();

        if (this.options.vertical && this.options.buttons.position == 'outside') { // buttons outside for vertical only
            this.innerContainerElement.style.padding = (this.options.buttons.back ? (this.options.buttons.size + 'px') : '0') + ' 0 ' + (this.options.buttons.forward ? (this.options.buttons.size + 'px') : '0');
        }

        this.initTouch();

        this.dataPromise.then(function() {
            that.attachTouchEvents();
            that.attachButtonEvents();
        });
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
        this.lineHeightMultiplier = Math.round( (.06256 + Number((this.options.multipliers.line_height * .01).toFixed(2))) * 10000 ) / 10000;
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

    RevSlider.prototype.transitionClass = function(transitioning) {
        revUtils[transitioning ? 'addClass' : 'removeClass'](this.element, 'rev-transitioning');
    };

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
        this.setImageSize();

        this.setPreloaderHeight();

        // hard code provider
        this.providerFontSize = 11;
        this.providerLineHeight = 16;
        this.providerMarginTop = 2;

        // headline calculation based on text_right_height or grid columnWidth and lineHeightMultiplier
        this.setHeadlineLineHeight();
        this.setHeadlineFontSize();
        this.setHeadlineMarginTop();
        this.setHeadlineMaxHeight();

        this.innerMargin = Math.max(0, ((this.grid.columnWidth * this.paddingMultiplier).toFixed(2) / 1));
    };

    RevSlider.prototype.getTextRightHeight = function() {
        return this.options.text_right_height[this.grid.getBreakPoint()] ? this.options.text_right_height[this.grid.getBreakPoint()] : this.options.text_right_height;
    };

    RevSlider.prototype.setImageSize = function() {
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
    };

    RevSlider.prototype.setPreloaderHeight = function() {
        if (this.options.text_right) { // base off text_right_height
            this.preloaderHeight = this.getTextRightHeight();
            this.preloaderWidth = Math.round(this.preloaderHeight * (this.imageWidth / this.imageHeight));
        } else {
            this.preloaderHeight = Math.round((this.grid.columnWidth - (this.padding * 2) - ( this.options.ad_border ? 2 : 0 )) * (this.imageHeight / this.imageWidth));
        }
    };

    RevSlider.prototype.setHeadlineLineHeight = function() {
        if (this.options.text_right) {
            var headlineHeight = 0;
            var availableSpace = (this.getTextRightHeight() - this.providerLineHeight - this.providerMarginTop);
            for (var i = 6; i > 0; i--) {
                headlineHeight = ((availableSpace) / i).toFixed(2) / 1;
                if (headlineHeight > this.options.min_headline_height) {
                    break;
                }
            }
            this.headlineLineHeight = headlineHeight;
        } else {
            this.headlineLineHeight = Math.max(17, ((this.grid.columnWidth * this.lineHeightMultiplier).toFixed(2) / 1));
        }
    };

    RevSlider.prototype.setHeadlineFontSize = function() {
        this.headlineFontSize = (this.headlineLineHeight * .8).toFixed(2) / 1;
    };

    RevSlider.prototype.setHeadlineMarginTop = function() {
        this.headlineMarginTop = 0;
        if (!this.options.text_right) { // give some space between bottom of image and headline
            this.headlineMarginTop = ((this.headlineLineHeight * .4).toFixed(2) / 1);
        }
    };

    RevSlider.prototype.setHeadlineMaxHeight = function() {
        var maxHeight = 0;
        if (this.options.text_right) { // based on preloaderHeight/ ad height
            var verticalSpace = this.preloaderHeight - this.providerLineHeight;
            var headlines = Math.floor(verticalSpace / this.headlineLineHeight);
            maxHeight = headlines * this.headlineLineHeight;
        } else {
            var ads = this.grid.element.querySelectorAll('.rev-ad');
            if (this.options.max_headline && ads.length) { // max_headline and we have some ads otherwise just use the headline_size
                for (var i = 0; i < this.limit; i++) {
                    var ad = ads[i];
                    var el = document.createElement('div');
                    revUtils.addClass(el, 'rev-headline-max-check');
                    el.style.position = 'absolute';
                    el.style.zIndex = '100';
                    el.style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
                    el.innerHTML = '<h3 style="font-size:'+ this.headlineFontSize + 'px;line-height:'+ this.headlineLineHeight +'px">'+ this.displayedItems[i].headline + '</h3>';
                    revUtils.prepend(ad, el); // do it this way b/c changin the element height on the fly needs a repaint and requestAnimationFrame is not avail in IE9
                    maxHeight = Math.max(maxHeight, el.clientHeight);
                    revUtils.remove(el);
                }
            } else {
                maxHeight = ((this.headlineLineHeight * this.options.headline_size).toFixed(2) / 1);
            }
        }
        this.headlineMaxHeight = maxHeight;
    };

    RevSlider.prototype.updatePagination = function(checkPage) {

        if (this.maxPages() <= 1) {
            this.backBtn.style.display = 'none';
            this.forwardBtn.style.display = 'none';
            this.mc.set({enable: false}); // disable touch events
            if (this.options.pagination_dots) {
                revUtils.remove(this.paginationDotsContainer); // remove the pagination dots all together
            }
        } else {
            this.backBtn.style.display = 'block';
            this.forwardBtn.style.display = 'block';
            this.mc.set({enable: true});// make sure touch events are enabled
            if (this.options.pagination_dots && !this.paginationDotsContainer.parentNode) { // add pagination dots if not there
                revUtils.prepend(this.innerContainerElement, this.paginationDotsContainer);
            }
        }

        this.emitter.emitEvent('resized'); // emit resize in case dots changed size

        if (!this.options.pagination_dots) { // if no pagination dots we can return now
            return;
        }

        var children = this.paginationDots.childNodes

        // make sure we don't have too many or too few dots
        var difference = (this.maxPages() - children.length);

        if (difference < 0) {
            var remove = [];
            for (var i = 0; i < this.options.pages; i++) {
                if (i >= this.maxPages()) {
                    remove.push(children[i])
                }
            }
            for (var i = 0; i <= remove.length; i++) {
                revUtils.remove(remove[i]);
            }
        } else if (difference > 0) {
            for (var i = 0; i < difference; i++) {
                this.appendDot();
            }
        }

        // check the page on resize in case the offset changes
        if (checkPage) {
            this.page = (this.offset / this.limit) + 1;
            this.previousPage = Math.max(0, this.page - 1);
        }

        var children = this.paginationDots.childNodes

        // update the active dot
        for (var i = 0; i < children.length; i++) {
            revUtils.removeClass(children[i], 'rev-active');
            if ((i+1) == this.page) {
                revUtils.addClass(children[i], 'rev-active');
            }
        }
    };

    RevSlider.prototype.appendDot = function(active) {
        var dot = document.createElement('div');
        revUtils.addClass(dot, 'rev-pagination-dot');
        dot.innerHTML = '<div></div>';
        if (active) {
            revUtils.addClass(dot, 'rev-active');
        }
        revUtils.append(this.paginationDots, dot);
    };

    RevSlider.prototype.paginationDots = function() {
        if (!this.options.pagination_dots) {
            return;
        }

        this.paginationDots = document.createElement('div');
        revUtils.addClass(this.paginationDots, 'rev-pagination-dots');

        for (var i = 0; i < this.options.pages; i++) {
            this.appendDot(i===0);
        }

        this.paginationDotsWrapper = document.createElement('div');
        revUtils.addClass(this.paginationDotsWrapper, 'rev-pagination-dots-wrapper');
        if (this.options.buttons.position == 'dots') {
            revUtils.addClass(this.paginationDotsWrapper, 'rev-pagination-dots-wrapper-buttons');
        }

        this.paginationDotsContainer = document.createElement('div');
        revUtils.addClass(this.paginationDotsContainer, 'rev-pagination-dots-container');

        revUtils.append(this.paginationDotsWrapper, this.paginationDotsContainer);

        revUtils.append(this.paginationDotsContainer, this.paginationDots);

        revUtils.prepend(this.containerElement, this.paginationDotsWrapper);
    };

    //added to prevent default drag functionality in FF
    RevSlider.prototype.preventDefault = function() {
        revUtils.addEventListener(this.element, 'mousedown', function(e) {
            e.preventDefault();
        });

        revUtils.addEventListener(this.element, 'dragstart', function(e) {
            e.preventDefault();
        });
    };

    RevSlider.prototype.initButtons = function() {
        var chevronUp    = '<path d="M18 12l-9 9 2.12 2.12L18 16.24l6.88 6.88L27 21z"/>';
        var chevronDown  = '<path d="M24.88 12.88L18 19.76l-6.88-6.88L9 15l9 9 9-9z"/><path d="M0 0h36v36H0z" fill="none"/>';
        var chevronLeft  = '<path d="M23.12 11.12L21 9l-9 9 9 9 2.12-2.12L16.24 18z"/>';
        var chevronRight = '<path d="M15 9l-2.12 2.12L19.76 18l-6.88 6.88L15 27l9-9z"/>';

        var btnHeight = this.options.buttons.position == 'dual' ? 'auto' : (this.options.vertical ? this.options.buttons.size + 'px' : '100%');

        this.backBtnWrapper = document.createElement('div');
        this.backBtnWrapper.id = "back-wrapper";
        this.backBtnWrapper.setAttribute('class', 'rev-btn-wrapper rev-btn-wrapper-back rev-btn-style-' + this.options.buttons.style);
        this.backBtnWrapper.style.height = btnHeight;
        this.backBtnWrapper.style.left = this.options.buttons.position == 'dual' ? 'auto' : '0';

        this.backBtnContainer = document.createElement('div');
        this.backBtnContainer.id = 'back-btn-container';
        revUtils.addClass(this.backBtnContainer, 'rev-btn-container');
        this.backBtnContainer.style.right = this.options.buttons.position == 'dual' ? 'auto' : '0px';

        this.backBtn = document.createElement('button');
        revUtils.addClass(this.backBtn, 'rev-chevron');
        this.backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">' + (this.options.vertical ? chevronUp : chevronLeft) + '</svg>';

        this.backBtnContainer.appendChild(this.backBtn);
        this.backBtnWrapper.appendChild(this.backBtnContainer);

        this.forwardBtnWrapper = document.createElement('div');
        this.forwardBtnWrapper.id = "forward-wrapper";
        this.forwardBtnWrapper.setAttribute('class', 'rev-btn-wrapper rev-btn-wrapper-forward rev-btn-style-' + this.options.buttons.style);
        this.forwardBtnWrapper.style.height = btnHeight;
        this.forwardBtnWrapper.style.right = this.options.buttons.position == 'dual' ? 'auto' : '0';

        this.forwardBtnContainer = document.createElement('div');
        this.forwardBtnContainer.id = 'back-btn-container';
        revUtils.addClass(this.forwardBtnContainer, 'rev-btn-container');
        this.forwardBtnContainer.style.right = this.options.buttons.position == 'dual' ? 'auto' : '0px';

        this.forwardBtn = document.createElement('button');
        revUtils.addClass(this.forwardBtn, 'rev-chevron');
        this.forwardBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">' + (this.options.vertical ? chevronDown : chevronRight) + '</svg>';

        this.forwardBtnContainer.appendChild(this.forwardBtn);
        this.forwardBtnWrapper.appendChild(this.forwardBtnContainer);

        if (this.options.buttons.position == 'dual') {
            this.btnContainer = document.createElement('div');
            this.btnContainer.setAttribute('class', 'rev-btn-dual');
            revUtils.append(this.btnContainer, this.backBtnWrapper);
            revUtils.append(this.btnContainer, this.forwardBtnWrapper);
            revUtils.append(this.innerContainerElement, this.btnContainer);
        } else if (this.options.buttons.position == 'dots') {
            if (!this.paginationDotsContainer) {
                return;
            }

            this.paginationDots.style.height = this.options.buttons.size + 'px';
            this.paginationDots.style.margin = '0 24px';

            this.backBtnWrapper.style.height = this.options.buttons.size + 'px';
            this.backBtnWrapper.style.width = this.options.buttons.size + 'px';
            this.backBtnWrapper.style.display = 'inline-block';
            this.backBtnContainer.style.height = '100%';
            this.backBtn.style.height = '100%';
            this.backBtn.style.width = '100%';

            this.forwardBtnWrapper.style.height = this.options.buttons.size + 'px';
            this.forwardBtnWrapper.style.width = this.options.buttons.size + 'px';
            this.forwardBtnWrapper.style.display = 'inline-block';
            this.forwardBtnContainer.style.height = '100%';
            this.forwardBtn.style.height = '100%';
            this.forwardBtn.style.width = '100%';

            revUtils.prepend(this.paginationDotsContainer, this.backBtnWrapper);
            revUtils.append(this.paginationDotsContainer, this.forwardBtnWrapper);
        } else {
            if (this.options.buttons.back) {
                revUtils.append(this.innerContainerElement, this.backBtnWrapper);
            }

            if (this.options.buttons.forward) {
                revUtils.append(this.innerContainerElement, this.forwardBtnWrapper);
            }

            if (this.options.buttons.position == 'outside') { // buttons outside for vertical only
                if (this.options.vertical) {
                    this.innerContainerElement.style.padding = (this.options.buttons.back ? (this.options.buttons.size + 'px') : '0') + ' 0 ' + (this.options.buttons.forward ? (this.options.buttons.size + 'px') : '0');
                } else {

                    // THIS NEEDS TO BE DYNAMIC
                    this.containerElement.style.paddingLeft = this.options.buttons.size + 'px';
                    this.containerElement.style.paddingRight = this.options.buttons.size + 'px';

                    if (this.options.buttons.style == 'fly-out') {
                        this.forwardBtnWrapper.style.width = (this.options.buttons.size * .8) + 'px';
                        this.backBtnWrapper.style.width = (this.options.buttons.size * .8) + 'px';
                    } else {
                        this.forwardBtnWrapper.style.width = this.options.buttons.size + 'px';
                        this.backBtnWrapper.style.width = this.options.buttons.size + 'px';
                    }

                    revUtils.transformCss(this.backBtnWrapper, 'translateX(-100%)');
                    revUtils.transformCss(this.forwardBtnWrapper, 'translateX(100%)');
                }
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
            cellHeight += this.headlineMaxHeight +
            this.headlineMarginTop + this.providerLineHeight + this.providerMarginTop;
            cellHeight += (this.options.ad_border) ? 2 : 0;
        }
        return cellHeight;
    };

    RevSlider.prototype.resize = function() {
        var that = this;
        var oldLimit = this.limit;
        this.grid.option({transitionDuration: 0});
        this.limit = this.getLimit();

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

        this.setUp();

        var ads = this.element.querySelectorAll('.rev-ad');

        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];

            ad.style.height = this.getCellHeight() + 'px';

            this.resizeImage(ad.querySelectorAll('.rev-image')[0]);
            this.resizeHeadline(ad.querySelectorAll('.rev-headline')[0]);
            this.resizeProvider(ad.querySelectorAll('.rev-provider')[0]);

            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = this.displayedItems[i].headline;
        }
        this.textOverlay();
        this.checkEllipsis();

        this.grid.reloadItems();
        this.grid.layout();
        this.grid.option({transitionDuration: this.options.transition_duration});

        this.getAnimationDuration();
        this.updatePagination(true);

        this.emitter.emitEvent('resized');
    };

    RevSlider.prototype.resizeImage = function(el) {
        el.style.height = this.preloaderHeight + 'px';
        el.style.width = this.getImageWidth();
    };

    RevSlider.prototype.resizeHeadline = function(el) {
        el.style.maxHeight = this.headlineMaxHeight + 'px';
        el.style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
        el.firstChild.style.fontSize = this.headlineFontSize +'px';
        el.firstChild.style.lineHeight = this.headlineLineHeight +'px';
    };

    RevSlider.prototype.resizeProvider = function(el) {
        if(this.options.hide_provider) {
            return;
        }
        el.style.margin = this.providerMarginTop + 'px ' + this.innerMargin + 'px 0';
        el.style.fontSize = this.providerFontSize + 'px';
        el.style.lineHeight = this.providerLineHeight + 'px';
        el.style.height = this.providerLineHeight + 'px';
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

    RevSlider.prototype.getImageWidth = function() {
         return typeof this.preloaderWidth === 'undefined' ? 'auto' : this.preloaderWidth + 'px';
    };

    RevSlider.prototype.createNewCell = function() {

        var html = '<div class="rev-ad" style="height: '+ this.getCellHeight() + 'px;' + (this.options.ad_border ? 'border:1px solid #eee' : '') +'">' +
            '<a href="" target="_blank">' +
            '<div class="rev-image" style="width:'+ this.getImageWidth() +';height:'+ this.preloaderHeight +'px">' +
            '<img src=""/>' +
            '</div>' +
            '<div class="rev-headline-brand">' +
            '<div class="rev-headline" style="max-height:'+ this.headlineMaxHeight +'px; margin:'+ this.headlineMarginTop +'px ' + this.innerMargin + 'px' + ' 0;">' +
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

    RevSlider.prototype.getSerializedQueryParams = function() {
         if (!this.serializedQueryParams) {
            this.serializedQueryParams = revUtils.serialize(this.options.query_params);
         }
         return this.serializedQueryParams;
    };

    RevSlider.prototype.getData = function() {
        if (this.dataPromise) {
            return this.dataPromise;
        }

        var that = this;

        this.dataPromise = new Promise(function(resolve, reject) {
            var sponsoredCount = that.options.pages * that.limit;
            var url = that.options.url + '?api_key='+ that.options.api_key +'&uitm=true&img_h='+ that.imageHeight +'&img_w='+ that.imageWidth + '&pub_id='+ that.options.pub_id +'&widget_id='+ that.options.widget_id +'&domain='+ that.options.domain +'&internal_count=0'+'&sponsored_count=' + sponsoredCount;

            url += '&' + that.getSerializedQueryParams();

            revApi.request(url, function(resp) {
                that.data = resp;

                that.updateDisplayedItems(that.options.visible);

                that.emitter.emitEvent('ready');
                that.ready = true;

                revUtils.imagesLoaded(that.grid.element.querySelectorAll('img')).once('done', function() {
                    revUtils.addClass(that.containerElement, 'loaded');
                });
                resolve();
            });
        });
    };

    RevSlider.prototype.registerImpressions = function() {
        if (this.options.impression_tracker[this.offset + '_' + this.limit]) {
            return; // impressions already tracked
        }

        var impressionsUrl = this.options.url + '?&api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&api_source=' + this.options.api_source;

        impressionsUrl += '&sponsored_count=' + (this.options.internal ? 0 : this.limit) + '&internal_count=' + (this.options.internal ? this.limit : 0) + '&sponsored_offset='+ (this.options.internal ? 0 : this.offset) +'&internal_offset=' + (this.options.internal ? this.offset : 0);

        impressionsUrl += '&' + this.getSerializedQueryParams();

        this.options.impression_tracker[this.offset + '_' + this.limit] = true;
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

        this.displayedItems = [];
        var dataIndex = this.offset;
        for (var i = 0; i < this.limit; i++) {
            if (!this.data[dataIndex]) { // go back to the beginning if there are more ads than data
                dataIndex = 0;
            }
            this.displayedItems.push(this.data[dataIndex]);
            dataIndex++;
        }

        this.setUp();

        var ads = this.grid.element.querySelectorAll('.rev-ad');

        for (var i = 0; i < this.displayedItems.length; i++) {
            var ad = ads[i],
                data = this.displayedItems[i];

            ad.style.height = this.getCellHeight() + 'px';

            if (this.options.overlay !== false) {
                revUtils.imageOverlay(ad.querySelectorAll('.rev-image')[0], data.content_type, this.options.overlay, this.options.overlay_position, this.options.overlay_icons);
            }

            ad.querySelectorAll('a')[0].setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', ''));
            ad.querySelectorAll('a')[0].title = data.headline;
            ad.querySelectorAll('img')[0].setAttribute('src', data.image);
            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;

            this.resizeImage(ad.querySelectorAll('.rev-image')[0]);
            this.resizeHeadline(ad.querySelectorAll('.rev-headline')[0]);
            this.resizeProvider(ad.querySelectorAll('.rev-provider')[0]);
        }

        if (registerImpressions) {
            this.registerImpressions();
        }

        this.grid.reloadItems();
        this.grid.layout();
        this.checkEllipsis();
        this.updatePagination();
    };

    RevSlider.prototype.maxPages = function() {
        var maxPages = Math.ceil(this.data.length / this.limit);
        if (maxPages > this.options.pages) {
            maxPages = this.options.pages;
        }
        return maxPages;
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
            if (this.options.buttons.position == 'dual') {
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

            revUtils.addEventListener(that.element, 'mouseenter', function() {
                revUtils.removeClass(that.containerElement, 'off');
                revUtils.addClass(that.containerElement, 'on');
                if (that.options.buttons.style == 'fly-out') {
                    that.forwardBtnWrapper.style.width = that.options.buttons.size + 'px';
                    that.backBtnWrapper.style.width = that.options.buttons.size + 'px';
                }
            });
            revUtils.addEventListener(that.element, 'mouseleave', function() {
                revUtils.removeClass(that.containerElement, 'on');
                revUtils.addClass(that.containerElement, 'off');
                if (that.options.buttons.style == 'fly-out') {
                    that.forwardBtnWrapper.style.width = (that.options.buttons.size * .8) + 'px';
                    that.backBtnWrapper.style.width = (that.options.buttons.size * .8) + 'px';
                }
            });
        }
    };

    RevSlider.prototype.initTouch = function() {
        this.moving = 'forward'; // always start off moving forward no matter the direction

        this.preventDefault(); // prevent default touch/click events

        this.mc = new Hammer(this.element);
        this.mc.add(new Hammer.Swipe({ threshold: 5, velocity: 0, direction: this.options.touch_direction }));
        this.mc.add(new Hammer.Pan({ threshold: 0, direction: this.options.touch_direction })).recognizeWith(this.mc.get('swipe'));

        this.movement = 0;
        this.made = false;
        this.panDirection = false;
        this.updown = false;
    };

    RevSlider.prototype.attachTouchEvents = function() {
        var that = this;

        this.element.addEventListener('click', function(e) {
            if (that.made || that.movement) {
                e.stopPropagation();
                e.preventDefault();
            }
        });

        this.mc.on('pan swipe', function(e) {
            // prevent default on pan by default, or atleast if the thing is moving
            // Lock needs to pass false for example so the user can scroll the page
            if (that.options.prevent_default_pan || that.made || that.transitioning || that.movement) {
                e.preventDefault(); // don't go scrolling the page or any other funny business
            }
        });

        this.mc.on('swipeleft', function(ev) {
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

        this.mc.on('swiperight', function(e) {
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

        this.mc.on('panleft', function(e) {
            if (that.made || that.transitioning || that.panDirection == 'right') {
                return;
            }
            that.pan('left', e.distance / 10);
        });

        this.mc.on('panright', function(e) {
            if (that.made || that.transitioning || that.panDirection == 'left') {
                return;
            }
            that.pan('right', e.distance / 10);
        });

        this.mc.on('panup pandown', function(e) {
            that.updown = true;
        });

        this.mc.on('panend', function(e) {
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

        this.updatePagination();

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

            this.page = this.page + 1;
            this.moving = 'forward';

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
                this.moving = 'back';
            } else {
                if (this.moving == 'back') {
                    this.page = this.page - 1;
                } else {
                    this.page = this.page + 1;
                    this.moving = 'forward';
                }
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

    RevSlider.prototype.destroy = function() {
        this.grid.remove();
        this.grid.destroy();
        this.mc.set({enable: false});
        this.mc.destroy();
    };

    return RevSlider;
}));