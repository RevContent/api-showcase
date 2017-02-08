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
            element: false,
            breakpoints: {
                xs: 250,
                sm: 500,
                md: 750,
                lg: 1000,
                xl: 1250,
                xxl: 1500
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
            query_params: false,
            register_views: true, // manage views or false to let someone else do it
            user_ip: false,
            user_agent: false,
            css: '',
            disable_pagination: false
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

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-slider', this.options.css);

        this.data = [];
        this.displayedItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider';

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

        revUtils.dispatchScrollbarResizeEvent();

        this.grid = new AnyGrid(gridElement, this.gridOptions());

        this.maxLimit = this.getMaxLimit();

        this.limit = this.getLimit();

        this.createCells();

        this.setMultipliers();

        this.grid.option({gutter: this.getPadding()});

        this.grid.reloadItems();
        this.grid.layout();

        this.setUp();

        this.setSize();

        this.grid.layout();

        this.grid.on('resize', function() {
            that.resize();
        });

        this.getData();

        this.offset = 0;
        this.page = 1;
        this.previousPage = 1;

        this.paginationDots();

        this.initButtons();

        this.appendElements();

        this.textOverlay();

        this.setGridClasses();

        this.getAnimationDuration();

        if (this.options.vertical && this.options.buttons.position == 'outside') { // buttons outside for vertical only
            this.innerContainerElement.style.padding = (this.options.buttons.back ? (this.options.buttons.size + 'px') : '0') + ' 0 ' + (this.options.buttons.forward ? (this.options.buttons.size + 'px') : '0');
        }

        this.initTouch();

        // manage views
        this.registerViewOnceVisible();
        if (this.options.register_views) { // widgets that use revSlider might need to do this on their own
            that.attachVisibleListener();
            revUtils.checkVisible.bind(this, this.containerElement, this.visible)();
        }

        this.dataPromise.then(function() {
            if (that.options.disable_pagination === false) {
                that.attachTouchEvents();
                that.attachButtonEvents();
            }
        });
    };

    RevSlider.prototype.setGridClasses = function() {
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.vertical ? 'vertical' : 'horizontal'));
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.text_right ? 'text-right' : 'text-bottom'));
        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

        revUtils.removeClass(this.containerElement, 'rev-slider-col', true);
        revUtils.removeClass(this.containerElement, 'rev-slider-row', true);
        revUtils.addClass(this.containerElement, 'rev-slider-col-' + (typeof this.options.per_row === 'object' ? this.options.per_row[this.grid.getBreakPoint()] : this.options.per_row));
        revUtils.addClass(this.containerElement, 'rev-slider-row-' + (typeof this.options.rows === 'object' ? this.options.rows[this.grid.getBreakPoint()] : this.options.rows));
    };

    RevSlider.prototype.registerViewOnceVisible = function() {
        var that = this;
        this.emitter.once('visible', function() {
            revUtils.removeEventListener(window, 'scroll', that.visibleListener);
            that.registerView();
        });
    };

    RevSlider.prototype.visible = function() {
        this.emitter.emitEvent('visible');
    };

    RevSlider.prototype.attachVisibleListener = function() {
        this.visibleListener = revUtils.checkVisible.bind(this, this.containerElement, this.visible);
        revUtils.addEventListener(window, 'scroll', this.visibleListener);
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
        return {
            isInitLayout: false,
            masonry: false,
            perRow: this.options.per_row,
            transitionDuration: this.options.transition_duration,
            isResizeBound: this.options.is_resize_bound,
            adjustGutter: true,
            removeVerticalGutters: false,
            breakpoints: this.options.breakpoints
        };
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
        this.grid.on('resize', function() {
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

    RevSlider.prototype.setSize = function() {
        var ads = this.grid.element.querySelectorAll('.rev-ad');
        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];

            ad.style.height = this.getCellHeight(ad) + 'px';

            this.resizeImage(ad.querySelectorAll('.rev-image')[0]);
            this.resizeHeadline(ad.querySelectorAll('.rev-headline')[0]);
            this.resizeProvider(ad.querySelectorAll('.rev-provider')[0]);
        }
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
            var ad = this.grid.element.querySelectorAll('.rev-ad')[0];
            var adWidth = parseFloat(revUtils.getComputedStyle(ad, 'width'));
            var adPaddingLeft = parseInt(revUtils.getComputedStyle(ad, 'padding-left'));
            var adPaddingRight = parseInt(revUtils.getComputedStyle(ad, 'padding-right'));
            var adBorderLeft = parseInt(revUtils.getComputedStyle(ad, 'border-left-width'));
            var adBorderRight = parseInt(revUtils.getComputedStyle(ad, 'border-right-width'));

            this.preloaderHeight = ((Math.round((adWidth - adPaddingLeft - adPaddingRight - adBorderLeft - adBorderRight) * 100) / 100) * (this.imageHeight / this.imageWidth));
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
            this.headlineLineHeight = Math.max(17, Math.round(this.grid.columnWidth * this.lineHeightMultiplier));
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

        if (!this.data.length) { // need data to determine max pages
            return;
        }

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
        }, {passive: false});

        revUtils.addEventListener(this.element, 'dragstart', function(e) {
            e.preventDefault();
        }, {passive: false});
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
            // TODO
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

    RevSlider.prototype.getCellHeight = function(ad) {
        var cellHeight = this.preloaderHeight;

        cellHeight += parseInt(revUtils.getComputedStyle(ad, 'border-top-width')) +
            parseInt(revUtils.getComputedStyle(ad, 'border-bottom-width')) +
            parseInt(revUtils.getComputedStyle(ad, 'padding-top')) +
            parseInt(revUtils.getComputedStyle(ad, 'padding-bottom'));

        if (!this.options.text_overlay && !this.options.text_right) {
            cellHeight += this.headlineMaxHeight +
                this.headlineMarginTop +
                this.providerLineHeight +
                this.providerMarginTop;
        }

        return cellHeight;
    };

    RevSlider.prototype.resize = function() {
        var that = this;
        var oldLimit = this.limit;

        // set transitionDuration to 0 and then reset it
        this.grid.option({transitionDuration: 0});
        this.grid.once('resized', function() {
            that.grid.option({transitionDuration: that.options.transition_duration});
        });

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

        this.grid.reloadItems();
        this.grid.layout();

        this.setUp();

        this.setSize();

        this.grid.layout();

        this.textOverlay();
        this.checkEllipsis(true);

        this.getAnimationDuration();
        this.updatePagination(true);
        this.setGridClasses();
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

    RevSlider.prototype.checkEllipsis = function(reset) {
        if (this.options.max_headline && !this.options.text_right) { // text_right should be limited, but don't waste for max_headline only
            return;
        }
        // reset headlines
        if (reset) {
            var ads = this.element.querySelectorAll('.rev-ad');
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];

                if (this.displayedItems[i]) { // reset headlines for new ellipsis check
                    ad.querySelectorAll('.rev-headline h3')[0].innerHTML = this.displayedItems[i].headline;
                }
            }
        }

        revUtils.ellipsisText(this.grid.element.querySelectorAll('.rev-content .rev-headline'));
    };

    RevSlider.prototype.getLimit = function() {
        // can pass object for rows or just single value for all breakpoints
        return this.grid.getPerRow() * (this.options.rows[this.grid.getBreakPoint()] ? this.options.rows[this.grid.getBreakPoint()] : this.options.rows);
    };

    RevSlider.prototype.getMaxLimit = function() {
        var maxLimit = 0;
        var iteratorMax = 0;

        if (typeof this.options.rows === 'object') {
            for (var rowKey in this.options.rows) {
                iteratorMax = 0;
                if (this.options.rows.hasOwnProperty(rowKey)) {
                    if (typeof this.options.per_row === 'object') {
                        iteratorMax = this.options.rows[rowKey] * this.options.per_row[rowKey];
                        if (iteratorMax > maxLimit) {
                            maxLimit = iteratorMax;
                        }
                    } else {
                        iteratorMax = this.options.rows[rowKey] * this.options.per_row;
                        if (iteratorMax > maxLimit) {
                            maxLimit = iteratorMax;
                        }
                    }
                }
            }
        } else {
            if (typeof this.options.per_row === 'object') {
                for (var perRowKey in this.options.per_row) {
                    iteratorMax = 0;
                    if (this.options.per_row.hasOwnProperty(perRowKey)) {
                        iteratorMax = this.options.per_row[perRowKey] * this.options.rows;
                        if (iteratorMax > maxLimit) {
                            maxLimit = iteratorMax;
                        }
                    }
                }
            } else {
                iteratorMax = this.options.rows * this.options.per_row;
                if (iteratorMax > maxLimit) {
                    maxLimit = iteratorMax;
                }
            }
        }
        return maxLimit;
    };

    RevSlider.prototype.getImageWidth = function() {
         return typeof this.preloaderWidth === 'undefined' ? 'auto' : this.preloaderWidth + 'px';
    };

    RevSlider.prototype.createNewCell = function() {
        var html = '<div class="rev-ad">' +
            '<a href="" target="_blank">' +
            '<div class="rev-image">' +
            '<img src=""/>' +
            '</div>' +
            '<div class="rev-headline-brand">' +
            '<div class="rev-headline">' +
            '<h3></h3>' +
            '</div>' +
            '<div class="rev-provider"></div>' +
            '</div>' +
            '</a>' +
            '</div>';

            var cell = document.createElement('div');
            cell.className = 'rev-content';
            cell.innerHTML = html;

            return cell;
    };

    RevSlider.prototype.getSerializedQueryParams = function() {
         if (!this.serializedQueryParams) {
            var serialized = revUtils.serialize(this.options.query_params);
            this.serializedQueryParams = serialized ? '&' + serialized : '';
         }
         return this.serializedQueryParams;
    };

    RevSlider.prototype.generateUrl = function(offset, count, empty, viewed) {
        var url = this.options.url +
        '?api_key=' + this.options.api_key +
        this.getSerializedQueryParams() +
        '&pub_id=' + this.options.pub_id +
        '&widget_id=' + this.options.widget_id +
        '&domain=' + this.options.domain +
        '&api_source=' + this.options.api_source;

        url +=
        '&img_h=' + this.imageHeight +
        '&img_w=' + this.imageWidth;

        url +=
        '&sponsored_count=' + (this.options.internal ? 0 : count) +
        '&internal_count=' + (this.options.internal ? count : 0) +
        '&sponsored_offset=' + (this.options.internal ? 0 : offset) +
        '&internal_offset=' + (this.options.internal ? offset : 0);

        url += this.options.user_ip ? ('&user_ip=' + this.options.user_ip) : '';
        url += this.options.user_agent ? ('&user_agent=' + this.options.user_agent) : '';

        if (empty) {
            url += '&empty=true';
        }

        if (viewed) {
            url += '&viewed=true';
        }

        return url;
    }

    RevSlider.prototype.getData = function() {
        if (this.dataPromise) {
            return this.dataPromise;
        }

        var that = this;

        this.dataPromise = new Promise(function(resolve, reject) {
            // prime data - empty and not viewed
            var url = that.generateUrl(0, that.getMaxCount(), true, false);

            revApi.request(url, function(resp) {
                that.data = resp;

                revUtils.addClass(that.containerElement, 'rev-slider-has-data');

                that.updateDisplayedItems(false);

                that.emitter.emitEvent('ready');
                that.ready = true;

                revUtils.imagesLoaded(that.grid.element.querySelectorAll('img')).once('done', function() {
                    revUtils.addClass(that.containerElement, 'loaded');
                });
                resolve(resp);
            });
        });
    };

    RevSlider.prototype.registerImpressions = function(viewed) {

        if (!this.options.impression_tracker.length && this.options.beacons) {
            revApi.beacons.setPluginSource(this.options.api_source).attach();
        }

        // check to see if we have not already registered for the offset
        var register = [];
        for (var i = this.offset; i < (this.offset + this.limit); i++) {
            if (!this.options.impression_tracker[i]) {
                register.push(i);
            }
            this.options.impression_tracker[i] = true;
        }

        // do we have impressions to register
        if (register.length) {
            // compress into single call
            var offset = register[0];
            var count = (register[(register.length - 1)] + 1) - offset;
            // register impression - not empty and viewed on pagination
            var url = this.generateUrl(offset, count, false, viewed);

            revApi.request(url, function() { return });
        }
    };

    RevSlider.prototype.registerView = function() {
        if (!this.viewed) {
            this.viewed = true;

            // register a view without impressions(empty)
            var url = this.generateUrl(0, this.limit, true, true);

            revApi.request(url, function() { return });

            var that = this;
            // make sure we have some data
            this.dataPromise.then(function() {
                var anchors = that.element.querySelectorAll('.rev-ad a');
                for (var i = 0; i < anchors.length; i++) {
                    anchors[i].setAttribute('href', anchors[i].getAttribute('href') + '&viewed=true');
                }
            });
        }
    };

    RevSlider.prototype.updateDisplayedItems = function(viewed) {
        if (!this.data.length) { // if no data remove the container and call it a day
            this.destroy();
            return;
        }

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

            ad.style.height = this.getCellHeight(ad) + 'px';

            if (this.options.overlay !== false) {
                revUtils.imageOverlay(ad.querySelectorAll('.rev-image')[0], data.content_type, this.options.overlay, this.options.overlay_position, this.options.overlay_icons);
            }

            ad.querySelectorAll('a')[0].setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', '') + (this.viewed ? '&viewed=true' : ''));
            ad.querySelectorAll('a')[0].title = data.headline;
            ad.querySelectorAll('img')[0].setAttribute('src', data.image);
            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;

            this.resizeImage(ad.querySelectorAll('.rev-image')[0]);
            this.resizeHeadline(ad.querySelectorAll('.rev-headline')[0]);
            this.resizeProvider(ad.querySelectorAll('.rev-provider')[0]);
        }

        this.registerImpressions(viewed);

        this.grid.reloadItems();
        this.grid.layout();
        this.checkEllipsis();
        this.updatePagination();
    };

    RevSlider.prototype.getMaxCount = function() {
        // if pagination is disabled multiply maxLimit by 1 page otherwise by configed pages
        return (this.options.disable_pagination ? 1 : this.options.pages) * this.maxLimit;
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

        revUtils.addEventListener(this.element, 'click', function(e) {
            if (that.made || that.movement) {
                e.stopPropagation();
                e.preventDefault();
            }
        }, {passive: false});

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
        revUtils.remove(this.containerElement);
        this.mc.set({enable: false});
        this.mc.destroy();
    };

    return RevSlider;
}));