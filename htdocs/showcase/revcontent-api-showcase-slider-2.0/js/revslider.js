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
                xxs: 0,
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
            row_pages: false, // use rows for page count, overrides pages option
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
            touch_direction: typeof Hammer !== 'undefined' ? Hammer.DIRECTION_HORIZONTAL : false, // don't prevent vertical scrolling
            overlay_icons: false, // pass in custom icons or overrides
            image_overlay: false, // pass key value object { content_type: icon }
            image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: false, // pass key value object { content_type: icon }
            ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
            query_params: false,
            register_views: true, // manage views or false to let someone else do it
            user_ip: false,
            user_agent: false,
            css: '',
            disable_pagination: false,
            register_impressions: true,
            visible_rows: false,
            column_spans: false,
            pagination_dots_vertical: false
        };

        // merge options
        this.options = revUtils.extend(defaults, revUtils.deprecateOptions(opts));

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

        this.gridTransitionContainer = document.createElement('div');
        this.gridTransitionContainer.id = 'rev-slider-grid-transition-container';

        this.gridTransitionElement = document.createElement('div');
        this.gridTransitionElement.id = 'rev-slider-grid-transition';

        this.gridContainerElement = document.createElement('div');
        this.gridContainerElement.id = 'rev-slider-grid-container';

        var gridElement = document.createElement('div');
        gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';

        revUtils.append(this.containerElement, this.innerContainerElement);

        revUtils.append(this.innerContainerElement, this.innerElement);

        revUtils.append(this.innerElement, this.gridTransitionContainer);

        revUtils.append(this.gridTransitionContainer, this.gridTransitionElement);

        revUtils.append(this.gridTransitionElement, this.gridContainerElement);

        revUtils.append(this.gridContainerElement, gridElement);

        this.nextGridTransitionElement = this.gridTransitionElement.cloneNode(true);
        // this.nextGridTransitionElement.id = 'rev-slider-next-grid-transition';

        this.nextGridElement = this.nextGridTransitionElement.children[0].children[0];
        // this.nextGridElement = this.nextGridTransitionElement.querySelector('#rev-slider-grid');

        revUtils.append(this.gridTransitionContainer, this.nextGridTransitionElement);

        revUtils.append(this.element, this.containerElement);

        revUtils.dispatchScrollbarResizeEvent();

        this.grid = new AnyGrid(gridElement, this.gridOptions());

        this.paginationDots();

        this.initButtons();

        this.setGridClasses();

        this.createCells(this.grid);

        this.setMultipliers();

        this.getPadding();

        this.setContentPadding(this.grid);

        this.setUp(1);

        this.setSize(this.grid);

        this.grid.layout(9);

        this.setUp(2);

        this.setSize(this.grid);

        this.grid.layout(10);

        this.grid.on('resize', function() {
            that.resize();
        });

        this.getData();

        this.offset = 0;
        this.page = 1;
        this.previousPage = 1;

        this.appendElements();

        this.getAnimationDuration();

        if (this.options.vertical && this.options.buttons.position == 'outside') { // buttons outside for vertical only
            this.innerContainerElement.style.padding = (this.options.buttons.back ? (this.options.buttons.size + 'px') : '0') + ' 0 ' + (this.options.buttons.forward ? (this.options.buttons.size + 'px') : '0');
        }

        // custom icons passed? merge with default
        if (this.options.overlay_icons !== false) {
            revUtils.mergeOverlayIcons(this.options.overlay_icons);
        }

        // manage views
        if (this.options.register_views) { // widgets that use revSlider might need to do this on their own
            that.registerViewOnceVisible();
            that.attachVisibleListener();
            revUtils.checkVisible.bind(this, this.containerElement, this.visible)();
        }

        // pagination
        if (that.options.disable_pagination === false) {
            this.initTouch();
            this.dataPromise.then(function() {
                that.prepareNextGrid();
                that.attachTouchEvents();
                that.attachButtonEvents();
            });
        }
    };

    RevSlider.prototype.setGridClasses = function() {
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.vertical ? 'vertical' : 'horizontal'));
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.text_right ? 'text-right' : 'text-bottom'));
        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

        if (this.options.disable_pagination) {
            revUtils.addClass(this.containerElement, 'rev-slider-pagination-disabled');
        }

        revUtils[this.options.disable_pagination ? 'removeClass' : 'addClass'](this.containerElement, 'rev-slider-pagination');

        revUtils.removeClass(this.containerElement, 'rev-slider-breakpoint', true);
        revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-' + this.grid.getBreakPoint());
        var greaterLessThanBreakPoints = this.grid.getGreaterLessThanBreakPoints();
        for (var i = 0; i < greaterLessThanBreakPoints.gt.length; i++) {
            revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-gt-' + greaterLessThanBreakPoints.gt[i]);
        }
        for (var i = 0; i < greaterLessThanBreakPoints.lt.length; i++) {
            revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-lt-' + greaterLessThanBreakPoints.lt[i]);
        }

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

    RevSlider.prototype.createCells = function(grid) {

        var i = 0; // just in case
        this.limit = 0;
        while (grid.nextRow < grid.rowCount && i < 1000) {
            var cell = this.createNewCell();
            grid.element.appendChild(cell);
            grid.appended([cell]);
            this.limit++;
            i++;
        }
    };

    RevSlider.prototype.getPadding = function(resetInline) {
        var content = this.grid.element.querySelectorAll('.rev-content');

        if (resetInline) {
            for (var i = 0; i < content.length; i++) {
                content[i].style.paddingTop = null;
                content[i].style.paddingRight = null;
                content[i].style.paddingBottom = null;
                content[i].style.paddingLeft = null;

                content[i].children[0].style.paddingTop = null;
                content[i].children[0].style.paddingRight = null;
                content[i].children[0].style.paddingBottom = null;
                content[i].children[0].style.paddingLeft = null;
            }
            this.grid.layout(11);
        }
        // use last element for padding-top
        var paddingTop = parseFloat(revUtils.getComputedStyle(content[(content.length - 1)], 'padding-top'));
        var paddingRight = parseFloat(revUtils.getComputedStyle(content[0], 'padding-right'));
        var paddingBottom = parseFloat(revUtils.getComputedStyle(content[0], 'padding-bottom'));
        var paddingLeft = parseFloat(revUtils.getComputedStyle(content[0], 'padding-left'));

        var adInner = this.grid.element.querySelectorAll('.rev-ad-inner')[0];
        var calculatedPadding = ((adInner.offsetWidth * this.marginMultiplier).toFixed(2) / 1);

        this.padding = {
            top: paddingTop ? false : calculatedPadding,
            right: paddingRight ? false : calculatedPadding,
            bottom: paddingBottom ? false : calculatedPadding,
            left: paddingLeft ? false : calculatedPadding,
        };
    };

    RevSlider.prototype.setContentPadding = function(grid) {
        // var content = this.grid.element.querySelectorAll('.rev-content');
        for (var i = 0; i < grid.items.length; i++) {
            if (this.padding.top) {
                grid.items[i].element.style.paddingTop = this.padding.top + 'px';
            }
            if (this.padding.right) {
                grid.items[i].element.style.paddingRight = this.padding.right + 'px';
            }
            if (this.padding.bottom) {
                grid.items[i].element.style.paddingBottom = this.padding.bottom + 'px';
            }
            if (this.padding.left) {
                grid.items[i].element.style.paddingLeft = this.padding.left + 'px';
            }
        }
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
            // removeVerticalGutters: false,
            breakpoints: this.options.breakpoints,
            column_spans: this.options.column_spans,
            rows: this.options.rows,
            removeVerticalGutters: true
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

    RevSlider.prototype.prepareNextGrid = function() {
        // return;
        // var gridElement = document.createElement('div');//something up here
        // gridElement.id = 'rev-slider-grid';
        // gridElement.style.width = this.innerElement.offsetWidth + 'px';

        // revUtils.append(this.gridContainerElement, gridElement);

        this.nextGrid = new AnyGrid(this.nextGridElement, this.gridOptions());

        this.createCells(this.nextGrid);

        this.setContentPadding(this.nextGrid);

        this.setSize(this.nextGrid);

        this.nextGrid.layout();

        this.nextGrid.bindResize();

        var that = this;
        this.nextGrid.on('resize', function() {
            that.resize();
        });
    };

    RevSlider.prototype.createNextPageGrid = function() {
        console.log('info', 'createNextPageGrid');
        var containerWidth = this.innerElement.offsetWidth;
        var containerHeight = this.innerElement.offsetHeight;

        var prepend = false;
        // var margin;

        if (this.direction == 'next') { // slide left or up
            this.nextGridZindex = 0;
            // var insert = 'append';
            if (this.options.vertical) { // up
                // margin = 'marginBottom';
                this.gridContainerTransform = 'translate3d(0, -'+ (containerHeight + (this.padding.left * 2)) +'px, 0)';
            } else { // left
                // margin = 'marginRight';
                // this.gridContainerTransform = 'translate3d(-'+ (containerWidth + (this.padding.left * 2)) +'px, 0, 0)';
                // this.gridContainerTransform = 'translate3d(-100%, 0, 0)';
                this.nextGridTransform = 'translate3d(-100%, 0, 0)';
                this.gridTransform = 'scale(.8)';
            }
        } else { // Slide right or down
            // var insert = 'prepend';
            prepend = true;
            this.nextGridZindex = 1000;
            if (this.options.vertical) { // down
                // margin = 'marginTop';
                revUtils.transformCss(this.gridContainerElement, 'translate3d(0, -'+ (containerHeight + (this.padding.left * 2)) +'px, 0)');
                this.gridContainerTransform = 'translate3d(0, 0, 0)';
            } else { // right
                // margin = 'marginLeft';
                revUtils.transformCss(this.gridTransitionContainer, 'translate3d(-100%, 0, 0)');
                // revUtils.transformCss(this.gridContainerElement, 'translate3d(-100%, 0, 0)');
                // this.gridContainerTransform = 'translate3d(0, 0, 0)';
                this.nextGridTransform = 'translate3d(100%, 0, 0)';
                this.gridTransform = 'scale(.8)';
            }
        }

        // this.grid.element.style[margin] = (this.padding.left * 2) + 'px';

        // already appended, should we prepend instead
        if (prepend) {
            revUtils.prepend(this.gridTransitionContainer, this.nextGridTransitionElement);
            // revUtils.prepend(this.gridContainerElement, this.nextGrid.element);
        }

        // revUtils[insert](this.gridContainerElement, this.nextGrid.element);

        // if (!this.options.vertical) {
        //     this.grid.element.style.width = containerWidth + 'px';
        //     this.grid.element.style.float = 'left';

        //     this.nextGrid.element.style.width = containerWidth + 'px';
        //     this.nextGrid.element.style.float = 'left';

        //     this.gridContainerElement.style.width = (containerWidth * 2) + (this.padding.left * 2) + 'px';
        // }

        this.oldGrid = this.grid;

        var nextGrid = this.grid;

        this.grid = this.nextGrid;

        this.nextGrid = nextGrid;

        this.updateDisplayedItems(true);

        // this.prepareNextGrid();




        // this.oldGrid = this.grid;

        // this.grid.element.style[margin] = (this.padding.left * 2) + 'px';

        // var gridElement = document.createElement('div');//something up here
        // gridElement.id = 'rev-slider-grid';

        // revUtils[insert](this.gridContainerElement, gridElement);

        // var options = this.gridOptions();
        // options.isResizeBound = false;
        // this.grid = new AnyGrid(gridElement, options);

        // if (!this.options.vertical) {
        //     this.oldGrid.element.style.width = containerWidth + 'px';
        //     this.oldGrid.element.style.float = 'left';

        //     this.grid.element.style.width = containerWidth + 'px';
        //     this.grid.element.style.float = 'left';

        //     this.gridContainerElement.style.width = (containerWidth * 2) + (this.padding.left * 2) + 'px';
        // }

        // this.setGridClasses();

        // this.createCells(this.grid);

        // // this.grid.reloadItems();
        // // this.grid.layout(1);

        // // this.getPadding();

        // this.setContentPadding(this.grid);

        // // this.grid.option({removeVerticalGutters: true});

        // // this.grid.layout(2);

        // this.updateDisplayedItems(true);
    };

    RevSlider.prototype.transitionClass = function(transitioning) {
        revUtils[transitioning ? 'addClass' : 'removeClass'](this.element, 'rev-transitioning');
    };

    RevSlider.prototype.animateGrid = function() {
        console.log('info', 'animateGrid');
        // return;
        this.transitioning = true;
        this.transitionClass(true);

        this.nextGridTransitionElement.style.zIndex = this.nextGridZindex;

        // console.log(this.gridContainerTransform);

        // revUtils.transitionDurationCss(this.gridContainerElement, this.animationDuration + 's');
        // revUtils.transformCss(this.gridContainerElement, this.gridContainerTransform);
        // console.log('animate', this.gridTransitionElement, this.nextGridTransitionElement);

        revUtils.transitionDurationCss(this.gridTransitionElement, this.animationDuration + 's');
        revUtils.transitionDurationCss(this.nextGridTransitionElement, this.animationDuration + 's');

        // revUtils.transformCss(this.oldGrid.element, this.gridTransform);
        revUtils.transformCss(this.gridTransitionElement, this.gridTransform);
        revUtils.transformCss(this.nextGridTransitionElement, this.nextGridTransform);

        var that = this;
        setTimeout(function() {
            that.updateGrids();
            that.transitioning = false;
        }, this.animationDuration * 1000);

        return;

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
        console.log('updateGrids');
        // console.log(this.gridTransitionElement);
        // console.log(this.nextGridTransitionElement);

        revUtils.transitionDurationCss(this.gridTransitionElement,  '0s');
        revUtils.transitionDurationCss(this.nextGridTransitionElement,  '0s');

        revUtils.transformCss(this.gridTransitionElement, 'none');
        revUtils.transformCss(this.nextGridTransitionElement, 'none');

        // revUtils.transitionDurationCss(this.innerElement,  '0s');

        revUtils.transformCss(this.gridTransitionContainer, 'none');

        revUtils.append(this.gridTransitionContainer, this.gridTransitionElement);

        var nextGridTransitionElement = this.gridTransitionElement;
        this.gridTransitionElement = this.nextGridTransitionElement;
        this.nextGridTransitionElement = nextGridTransitionElement;

        this.gridTransitionElement.style.zIndex = 'auto';
        // this.gridTransitionElement.style.transform = 'none';
        // this.nextGridTransitionElement.style.transform = 'none';

        this.updating = false;
        // revUtils.transitionDurationCss(this.gridTransitionElement, '0s');
        // revUtils.transitionDurationCss(this.nextGridTransitionElement, '0s');

        // // revUtils.transformCss(this.oldGrid.element, this.gridTransform);
        // revUtils.transformCss(this.gridTransitionElement, 'none');
        // revUtils.transformCss(this.nextGridTransitionElement, 'none');



        return;

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

    RevSlider.prototype.setUp = function(item) {
        this.headlineMaxHeights = {}; // DONE

        // hard code provider
        this.providerFontSize = 11;
        this.providerLineHeight = 16;
        this.providerMarginTop = 2;

        var that = this;
        var setUp = function(item) {

            var index = revUtils.siblingIndex(item.element);
            // that.setImageSize(index, item.element);

            var row = Math.floor( index / that.grid.perRow );

            that.setImageSize(item); // TODO: multiple image ratios

            that.setTextRight(item);

            that.setTextOverlay(item);

            that.setItemClasses(item);

            that.setInnerMargin(item);

            that.setPreloaderHeight(item);

            // headline calculation based on text_right_height or grid columnWidth and lineHeightMultiplier
            that.setHeadlineLineHeight(item);
            that.setHeadlineFontSize(item);
            that.setHeadlineMarginTop(item);
            that.setHeadlineMaxHeight(item.element, item.span, row, index, item.stacked, item);
        };

        // if (item) { // if ad is passed do that one
        //     setUp(item);
        // } else { // otherwise do them all
            for (var i = 0; i < this.grid.items.length; i++) {
                setUp(this.grid.items[i]);
            }
        // }
    };

    RevSlider.prototype.setSize = function(grid, item) {

        var that = this;

        var setSize = function(item) {

            var index = revUtils.siblingIndex(item.element);

            var row = Math.floor( index / grid.perRow );

            that.resizeImage(item.element.querySelector('.rev-image'), item);
            that.resizeHeadline(item.element.querySelector('.rev-headline'), row, index, item);
            that.resizeProvider(item.element.querySelector('.rev-provider'), item);

            item.element.children[0].style.height = that.getCellHeight(row, index, item) + 'px';
        };

        if (item) { // if ad is passed do that one
            setSize(item);
        } else { // otherwise do them all
            for (var i = 0; i < grid.items.length; i++) {
                setSize(grid.items[i]);
            }
        }
    };

    RevSlider.prototype.getTextRightHeight = function() {
        return this.options.text_right_height[this.grid.getBreakPoint()] ? this.options.text_right_height[this.grid.getBreakPoint()] : this.options.text_right_height;
    };

    RevSlider.prototype.setImageSize = function(item) {
        var setImageSize = function(ratio) {
            switch(ratio) {
                case 'rectangle':
                    item.imageHeight = 300;
                    item.imageWidth = 400;
                    break;
                case 'wide_rectangle':
                    item.imageHeight = 450;
                    item.imageWidth = 800;
                    break;
                case 'tall_rectangle':
                    item.imageHeight = 400;
                    item.imageWidth = 300;
                    break;
                default:
                    item.imageHeight = 400;
                    item.imageWidth = 400;
            }
        }

        setImageSize((revDetect.mobile() ? 'wide_rectangle' : 'rectangle'));

        if (revUtils.isArray(this.options.image_ratio)) {
            for (var i = 0; i < this.options.image_ratio.length; i++) {
                if (matchesSelector(item.element, this.options.image_ratio[i].selector)) {
                    setImageSize(this.options.image_ratio[i].ratio);
                }
            }
        }
    };

    RevSlider.prototype.setPreloaderHeight = function(item) {
        item.preloaderHeight = false;
        item.preloaderWidth = false;
        if (item.textRight) { // base off text_right_height
            var preloaderHeight = this.getTextRightHeight();
            item.preloaderHeight = Math.round(preloaderHeight);
            item.preloaderWidth = Math.round(preloaderHeight * (item.imageWidth / item.imageHeight));
        } else {
            var adInner = item.element.querySelector('.rev-ad-inner');
            item.preloaderHeight = Math.round(adInner.offsetWidth * (item.imageHeight / item.imageWidth));
            item.preloaderWidth = Math.round(item.preloaderHeight * (item.imageWidth / item.imageHeight));
        }
    };

    RevSlider.prototype.setTextRight = function(item) {
        item.textRight = false;
        if (this.options.text_right !== false) {
            if (this.options.text_right === true) {
                item.textRight = true;
            } else {
                for (var i = 0; i < this.options.text_right.length; i++) {
                    if (matchesSelector(item.element, this.options.text_right[i].selector)) {
                        item.textRight = true;
                    }
                }
            }
        }
    };

    RevSlider.prototype.setTextOverlay = function(item) {
        item.textOverlay = false;
        if (this.options.text_overlay !== false) {
            if (this.options.text_overlay === true) {
                item.textOverlay = true;
            } else {
                for (var i = 0; i < this.options.text_overlay.length; i++) {
                    if (matchesSelector(item.element, this.options.text_overlay[i].selector)) {
                        item.textOverlay = true;
                    }
                }
            }
        }
    };

    RevSlider.prototype.setItemClasses = function(item) {
        revUtils.removeClass(item.element, 'rev-text-right');

        if (item.textRight) {
            revUtils.addClass(item.element, 'rev-text-right');
        } else {
            revUtils.removeClass(item.element, 'rev-text-right');
        }

        if (item.textOverlay) {
            revUtils.addClass(item.element, 'rev-text-overlay');
        } else {
            revUtils.removeClass(item.element, 'rev-text-overlay');
        }

        revUtils.removeClass(item.element, 'rev-colspan', true);
        revUtils.addClass(item.element, 'rev-colspan-' + item.span);
    };

    RevSlider.prototype.setInnerMargin = function(item) {
        var computedInnerMargin = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-headline'), 'margin-left'));

        if (computedInnerMargin > -1) {
            item.innerMargin = computedInnerMargin;
            return;
        }

        var adInner = item.element.querySelector('.rev-ad-inner');
        item.innerMargin = Math.round(Math.max(0, ((adInner.offsetWidth * this.paddingMultiplier).toFixed(2) / 1)));
    };

    RevSlider.prototype.setHeadlineLineHeight = function(item) {
        var computedLineHeight = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-headline h3'), 'line-height'));

        if (computedLineHeight) {
            item.headlineLineHeight = computedLineHeight;
            return;
        }

        var calculateWidth = item.element.querySelector('.rev-ad-inner').offsetWidth;
        if (item.textRight) {
            calculateWidth -= (item.preloaderWidth + parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-image'), 'margin-right')));
        }
        item.headlineLineHeight = Math.max(17, Math.round(calculateWidth * this.lineHeightMultiplier));
    };

    RevSlider.prototype.setHeadlineFontSize = function(item) {
        var computedFontSize = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-headline h3'), 'font-size'));

        if (computedFontSize) {
            item.headlineFontSize = computedFontSize;
            return;
        }

        item.headlineFontSize = (item.headlineLineHeight * .8).toFixed(2) / 1;
    };

    RevSlider.prototype.setHeadlineMarginTop = function(item) {
        var computedMarginTop = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-headline'), 'margin-top'));

        if (computedMarginTop > -1) {
            item.headlineMarginTop = computedMarginTop;
            return;
        }

        item.headlineMarginTop = 0;
        if (!item.textRight) { // give some space between bottom of image and headline
            var headlineMarginTop = ((item.headlineLineHeight * .18).toFixed(2) / 1);
            item.headlineMarginTop = headlineMarginTop > 4 ? 4 : headlineMarginTop;
        }
    };

    RevSlider.prototype.setHeadlineMaxHeight = function(element, colSpan, row, index, stacked, item) {
        var maxHeight = 0;

        if (!this.headlineMaxHeights[row]) {
            this.headlineMaxHeights[row] = {};
        }

        if (!this.headlineMaxHeights[row][colSpan]) {
            this.headlineMaxHeights[row][colSpan] = {};
        }

        if (item.textRight) { // based on preloaderHeight/ ad height
            var verticalSpace = item.preloaderHeight - this.providerLineHeight;
            var headlines = Math.floor(verticalSpace / item.headlineLineHeight);
            maxHeight = headlines * item.headlineLineHeight;
            this.headlineMaxHeights[row][colSpan][index] = { maxHeight: maxHeight };
        } else {

            var getHeadlineSizeMax = function(lineHeight, headlineSize) {
                return ((lineHeight * headlineSize).toFixed(2) / 1);
            }

            // var adsInner = this.grid.element.querySelectorAll('.rev-ad-inner');
            // if (this.options.max_headline && this.displayedItems.length && adsInner.length) { // max_headline and we have some ads otherwise just use the headline_size
            if (this.displayedItems.length) { // max_headline and we have some ads otherwise just use the headline_size
                var adInner = element.querySelector('.rev-ad-inner');
                var el = document.createElement('div');
                revUtils.addClass(el, 'rev-headline-max-check');
                el.style.position = 'absolute';
                el.style.textAlign = revUtils.getComputedStyle(adInner.querySelectorAll('.rev-headline')[0], 'text-align');
                el.style.zIndex = '100';
                el.style.margin = item.headlineMarginTop +'px ' + item.innerMargin + 'px 0';
                el.innerHTML = '<h3 style="font-size:'+ item.headlineFontSize + 'px;line-height:'+ item.headlineLineHeight +'px">'+ this.displayedItems[index].headline + '</h3>';
                revUtils.prepend(adInner, el); // do it this way b/c changin the element height on the fly needs a repaint and requestAnimationFrame is not avail in IE9

                var height = el.clientHeight;

                revUtils.remove(el);

                if (stacked) {
                    if (this.options.max_headline) {
                        this.headlineMaxHeights[row][colSpan][index] = { maxHeight: height };
                    } else {
                        this.headlineMaxHeights[row][colSpan][index] = { maxHeight: Math.min(getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size), height) };
                    }
                } else {
                    if (this.options.max_headline) {
                        maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, height);
                        this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
                    } else {
                        maxHeight = Math.min(getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size), height);
                        maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, maxHeight);
                        this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
                    }
                }
            } else {
                maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size));
                this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
            }
        }
    };

    RevSlider.prototype.updatePagination = function(checkPage) {

        if (!this.data.length || (this.options.disable_pagination && !this.options.row_pages)) { // need data to determine max pages
            return;
        }

        if (this.options.disable_pagination === false) {
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
        }

        if (!this.options.pagination_dots) { // if no pagination dots we can return now
            return;
        }

        var children = this.paginationDots.childNodes;

        // make sure we don't have too many or too few dots
        var difference = (this.maxPages() - children.length);

        if (difference < 0) {
            var remove = [];
            for (var i = 0; i < this.options.pages; i++) {
                if (i >= this.maxPages()) {
                    remove.push(children[i]);
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

        var pages = this.options.row_pages ? this.grid.rowCount : this.options.pages;

        for (var i = 0; i < pages; i++) {
            this.appendDot(i===0);
        }

        this.paginationDotsWrapper = document.createElement('div');
        revUtils.addClass(this.paginationDotsWrapper, 'rev-pagination-dots-wrapper');
        if (this.options.buttons.position == 'dots') {
            revUtils.addClass(this.paginationDotsWrapper, 'rev-pagination-dots-wrapper-buttons');
        }

        if (this.options.pagination_dots_vertical) {
            revUtils.addClass(this.paginationDotsWrapper, 'rev-pagination-dots-wrapper-vertical');
        }

        this.paginationDotsContainer = document.createElement('div');
        revUtils.addClass(this.paginationDotsContainer, 'rev-pagination-dots-container');

        revUtils.append(this.paginationDotsWrapper, this.paginationDotsContainer);

        revUtils.append(this.paginationDotsContainer, this.paginationDots);

        revUtils.prepend(this.innerContainerElement, this.paginationDotsWrapper);
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
        if (this.options.buttons === false || this.options.disable_pagination === true) {
            return;
        }

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

    RevSlider.prototype.getCellHeight = function(row, index, item) {
        var ad = item.element.children[0]; //TODO

        var cellHeight = item.preloaderHeight;

        cellHeight += ad.offsetHeight - ad.children[0].offsetHeight; // padding ad - ad-container
        cellHeight += ad.children[0].offsetHeight - ad.children[0].children[0].offsetHeight; // padding ad-container - ad-outer

        if (!item.textRight && !item.textOverlay) {
            cellHeight += (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) +
                item.headlineMarginTop +
                this.providerLineHeight +
                this.providerMarginTop;
        }

        return Math.floor(cellHeight);
    };

    RevSlider.prototype.resize = function() {
        while (this.grid.element.firstChild) {
            this.grid.element.removeChild(this.grid.element.firstChild);
        }

        this.grid.reloadItems();

        this.setGridClasses();

        this.createCells(this.grid);

        this.setDisplayedItems();

        this.getPadding(true);

        this.setContentPadding(this.grid);

        this.setUp();

        this.setSize(this.grid);

        this.grid.layout();

        this.setUp();

        this.setSize(this.grid);

        this.grid.layout();

        this.updateDisplayedItems(false);

        this.checkEllipsis(true);

        this.getAnimationDuration();

        this.updatePagination(true);

        this.emitter.emitEvent('resized');
    };

    RevSlider.prototype.resizeImage = function(el, item) {
        el.style.height = item.preloaderHeight + 'px';
        el.style.width = typeof item.preloaderWidth === false ? 'auto' : item.preloaderWidth + 'px';
    };

    RevSlider.prototype.resizeHeadline = function(el, row, index, item) {
        el.style.maxHeight = (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) + 'px';
        el.style.margin = item.headlineMarginTop +'px ' + item.innerMargin + 'px 0';
        el.firstChild.style.fontSize = item.headlineFontSize + 'px';
        el.firstChild.style.lineHeight = item.headlineLineHeight + 'px';
    };

    RevSlider.prototype.resizeProvider = function(el, item) {
        if(this.options.hide_provider) {
            return;
        }
        el.style.margin = this.providerMarginTop + 'px ' + item.innerMargin + 'px 0';
        el.style.fontSize = this.providerFontSize + 'px';
        el.style.lineHeight = this.providerLineHeight + 'px';
        el.style.height = this.providerLineHeight + 'px';
    };

    RevSlider.prototype.checkEllipsis = function(reset) {
        // if (this.options.max_headline && !this.options.text_right) { // text_right should be limited, but don't waste for max_headline only
        //     return;
        // }
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

    RevSlider.prototype.createNewCell = function() {
        var html = '<div class="rev-ad">' +
                '<div class="rev-ad-container">' +
                    '<div class="rev-ad-outer">' +
                        '<a href="" target="_blank">' +
                            '<div class="rev-ad-inner">' +
                                '<div class="rev-image">' +
                                    '<img src=""/>' +
                                '</div>' +
                                '<div class="rev-headline-brand">' +
                                    '<div class="rev-headline">' +
                                        '<h3></h3>' +
                                    '</div>' +
                                    '<div class="rev-provider"></div>' +
                                '</div>' +
                            '</div>' +
                        '</a>' +
                    '</div>' +
                '</div>' +
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
    };

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

                that.setDisplayedItems();

                that.setUp(4);

                that.updateDisplayedItems(false);

                that.emitter.emitEvent('ready');
                that.ready = true;

                that.emitter.once('imagesLoaded', function() {
                    revUtils.addClass(that.containerElement, 'loaded');
                });

                revUtils.imagesLoaded(that.grid.element.querySelectorAll('img'), that.emitter);

                resolve(resp);
            });
        });
    };

    RevSlider.prototype.registerImpressions = function(viewed, offset, limit) {

        // console.log(this.viewed);

        if (!this.options.impression_tracker.length && this.options.beacons) {
            revApi.beacons.setPluginSource(this.options.api_source).attach();
        }

        // check to see if we have not already registered for the offset
        var register = [];

        if (typeof offset === 'undefined') {
            var offset = this.offset;
            // var limit = this.limit;
        } else {
            offset = offset;
        }
        if (typeof limit === 'undefined') {
            // var offset = this.offset;
            var limit = this.limit;
        } else {
            limit = limit;
        }
        // if (false) {
        //     console.log(this.grid.rows[row].perRow);
        //     console.log('hinn');
        //     var offset = this.offset;
        //     var limit = this.limit;
        // }

        for (var i = offset; i < (offset + limit); i++) {
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

            revApi.request(url, function() { return; });
        }
    };

    RevSlider.prototype.registerView = function() {
        if (!this.viewed) {
            this.viewed = true;
            var count;
            if (this.options.visible_rows) {
                count = 0;
                for (var i = 0; i < this.options.visible_rows; i++) {
                    count += this.grid.rows[i].perRow;
                }
            } else {
                count = this.limit;
            }

            // register a view without impressions(empty)
            var url = this.generateUrl(0, count, true, true);

            revApi.request(url, function() { return; });

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

    RevSlider.prototype.setDisplayedItems = function() {
        this.displayedItems = [];
        var dataIndex = this.offset;

        for (var i = 0; i < this.limit; i++) {
            if (!this.data[dataIndex]) { // go back to the beginning if there are more ads than data
                dataIndex = 0;
            }
            this.displayedItems.push(this.data[dataIndex]);
            dataIndex++;
        }
    };

    RevSlider.prototype.updateDisplayedItems = function(viewed) {
        if (!this.data.length) { // if no data remove the container and call it a day
            this.destroy();
            return;
        }

        this.oldOffset = this.offset;

        this.offset = ((this.page - 1) * this.limit);

        this.setDisplayedItems();

        // this.setUp(4);

        // var ads = this.grid.element.querySelectorAll('.rev-content');
        for (var i = 0; i < this.displayedItems.length; i++) {
            var item = this.grid.items[i],
                data = this.displayedItems[i];

            // ad.style.height = this.getCellHeight(ad) + 'px';

            if (this.options.image_overlay !== false) { // TODO: ad does not exist
                revUtils.imageOverlay(ad.querySelector('.rev-image'), data.content_type, this.options.image_overlay, this.options.image_overlay_position);
            }

            if (this.options.ad_overlay !== false) { // TODO: ad does not exist
                revUtils.adOverlay(ad.querySelector('.rev-ad-inner'), data.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
            }

            item.element.querySelectorAll('a')[0].setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', '') + (this.viewed ? '&viewed=true' : ''));
            item.element.querySelectorAll('a')[0].title = data.headline;

            var image = data.image.replace('h=315', 'h=' + item.preloaderHeight).replace('w=420', 'w=' + item.preloaderWidth) + '&h=' + item.preloaderHeight + '&w=' + item.preloaderWidth;
            item.element.querySelectorAll('img')[0].setAttribute('src', image);
            item.element.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            item.element.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;

            this.setSize(this.grid, item);
        }

        if (this.options.register_impressions) {
            this.registerImpressions(viewed);
        }

        this.grid.reloadItems();
        this.grid.layout(3);
        this.checkEllipsis();
        this.updatePagination();

        this.emitter.emitEvent('resized');
    };

    RevSlider.prototype.getMaxCount = function() {
        // if pagination is disabled multiply maxLimit by 1 page otherwise by configed pages
        return (this.options.disable_pagination || this.options.row_pages ? 1 : this.options.pages) * this.limit;
    };

    RevSlider.prototype.maxPages = function() {
        if (this.options.row_pages) {
            return this.grid.rowCount;
        }
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



        this.mc = new Hammer(this.element, {
            recognizers: [
                [
                    Hammer.Pan,
                    {
                        threshold: 2
                    }
                ]
            ]
        });

        // this.mc = new Hammer(this.element);
        // this.mc.add(new Hammer.Swipe({ threshold: 5, velocity: 0, direction: this.options.touch_direction }));
        // this.mc.add(new Hammer.Pan({ threshold: 2, direction: this.options.touch_direction })).recognizeWith(this.mc.get('swipe'));

        this.movement = 0;
        this.currentX = 0;
        this.lastTranslateX = 0;
        this.made = false;
        this.panDirection = false;
        this.updown = false;
    };

    RevSlider.prototype.attachTouchEvents = function() {
        var that = this;

        // revUtils.addEventListener(this.element, 'click', function(e) {
        //     if (that.made || that.movement) {
        //         e.stopPropagation();
        //         e.preventDefault();
        //     }
        // }, {passive: false});

        // this.mc.on('pan swipe', function(e) {
        //     // prevent default on pan by default, or atleast if the thing is moving
        //     // Lock needs to pass false for example so the user can scroll the page
        //     if (that.options.prevent_default_pan || that.made || that.transitioning || that.movement) {
        //         e.preventDefault(); // don't go scrolling the page or any other funny business
        //     }
        // });

        // this.mc.on('swipeleft', function(ev) {
        //     return;
        //     if (that.made || that.transitioning || !that.movement || that.panDirection == 'right') {
        //         return;
        //     }
        //     that.made = true;
        //     revUtils.transitionDurationCss(that.gridContainerElement, (that.animationDuration / 1.5) + 's');
        //     revUtils.transformCss(that.gridContainerElement, 'translate3d(-'+ (that.innerElement.offsetWidth + (that.padding.left * 2)) +'px, 0, 0)');
        //     setTimeout(function() {
        //         that.updateGrids();
        //         that.made = false;
        //         that.panDirection = false;
        //     }, (that.animationDuration / 1.5) * 1000);
        //     that.movement = 0;
        // });

        // this.mc.on('swiperight', function(e) {
        //     if (that.made || that.transitioning || !that.movement || that.panDirection == 'left') {
        //         return;
        //     }
        //     that.made = true;
        //     revUtils.transitionDurationCss(that.gridContainerElement, (that.animationDuration / 1.5) + 's');
        //     revUtils.transformCss(that.gridContainerElement, 'translate3d(0, 0, 0)');
        //     setTimeout(function() {
        //         that.updateGrids();
        //         that.made = false;
        //         that.panDirection = false;
        //     }, (that.animationDuration / 1.5) * 1000);
        //     that.movement = 0;
        // });

        this.mc.on('panstart', function(e) {

            that.panStartTimeStamp = e.timeStamp;

            // eventEmitter.trigger('dragstart', {
            //     target: targetElement
            // });

            that.currentX = 0;
            // currentY = 0;

            that.isDraging = true;
            // var that = this;

            revUtils.transitionDurationCss(that.gridTransitionElement, '0s');
            revUtils.transitionDurationCss(that.nextGridTransitionElement, '0s');

            that.nextGridTransitionElement.style.zIndex = 1000; // TODO

            (function animation () {
                if (that.isDraging) {
                    that.doMove();

                    requestAnimationFrame(animation);
                }
            })();
        });

        this.mc.on('panleft', function(e) {
            that.showNextPage();
            that.pann(e);
            // console.log('pan', e.deltaX);
            // if (that.made || that.transitioning || that.panDirection == 'right') {
            //     return;
            // }
            // that.pan('left', e.deltaX);
        });

        this.mc.on('panright', function(e) {
            that.showPreviousPage();
            that.pann(e);
            // if (that.made || that.transitioning || that.panDirection == 'left') {
            //     return;
            // }
            // that.pan('right', e.distance / 10);
        });

        this.mc.on('panup pandown', function(e) {
            that.updown = true;
        });

        this.mc.on('panend', function(e) {
            // console.log('checkk', e.distance / (e.timeStamp - that.panStartTimeStamp));

            // console.log('check', e.distance / (e.timeStamp - that.panStartTimeStamp));

            // console.log('check', e, e.velocityX, e.distance, e.timeStamp - that.panStartTimeStamp);
            that.isDraging = false;
            that.finish(e.distance / (e.timeStamp - that.panStartTimeStamp), e.deltaX, Math.abs(e.velocityX), that.nextGridTransitionElement.offsetWidth, 0);
            that.currentX = 0;

            // console.log('panend', Math.abs(e.velocityX), Math.abs(e.velocityX) > .2);

            // console.log('check', e);
            // if (Math.abs(e.velocityX) > .2) {
            //     console.log('panend', 'oh yeah');
            // }
            // if (that.made || that.transitioning || (that.updown && !that.movement)) {
            //     return;
            // }
            // that.resetShowPage();
        });
    };

    RevSlider.prototype.pann = function(e) {
        this.currentX = e.deltaX;
        this.scale = Math.max((1 - (Math.abs(e.deltaX) / 1000)), .8);
        // this.currentDirection = e.direction;
    };

    RevSlider.prototype.doMove = function(direction, movement, reset) {
        // let r,
        //     x,
        //     y;

        if (this.currentX === this.lastX) {
            return;
        }

        this.lastX = this.currentX;

        // var x = this.lastTranslateX + this.currentX;
        // y = lastTranslate.y + currentY;
        // r = config.rotation(x, y, targetElement, config.maxRotation);

        // var scale = Math.max((1 - (Math.abs(this.currentX) / 1000)), .8);
        // revUtils.transformCss(this.gridTransitionElement, 'scale(' + this.scale + ')');

        console.log(this.nextGridTransitionElement);

        revUtils.transformCss(this.nextGridTransitionElement, 'translate3d('+ this.currentX +'px, 0, 0)');




        // eventEmitter.trigger('dragmove', {
        //     target: targetElement,
        //     throwOutConfidence: config.throwOutConfidence(x, targetElement),
        //     throwDirection: x < 0 ? Card.DIRECTION_LEFT : Card.DIRECTION_RIGHT
        // });
    };

    RevSlider.prototype.finish = function(pixelsPerMs, distance, velocity, containerWidth, counter) {

        console.log('fin', velocity);
        // console.log(pixelsPerMs, distance, containerWidth);

        // console.log( (containerWidth - Math.abs(distance)), (containerWidth - Math.abs(distance)) / pixelsPerMs );

        var duration = ((containerWidth - Math.abs(distance)) / velocity);

        revUtils.transitionCss(this.nextGridTransitionElement, 'all ' + duration + 'ms cubic-bezier(.06, 1, .6, 1)');
        revUtils.transformCss(this.nextGridTransitionElement, 'translate3d('+ (containerWidth * -1) +'px, 0, 0)');

        // revUtils.transitionCss(this.gridTransitionElement, 'all ' + (duration * 2) + 'ms');
        // revUtils.transformCss(this.gridTransitionElement, 'scale(0)');

        var that = this;
        setTimeout(function() {
            that.updateGrids();
        }, duration);

        return;


        var duration;
        if (true || velocity > .1) {
            duration = ((containerWidth - this.currentX) / pixelsPerMs);
            // if (this.sent) {
            //     duration *= 100;
            // } else {
            //     // duration *= 20;
            // }
            console.log('fin', this.scale, this.nextGridTransitionElement, this.gridTransitionElement);
            // var bez = [0,1,.31,1];
            // var bez = [.06,.92,.58,1];
            var bez = [.06,1,.6,1];
            // var bez = [0, 1, .06, 1];

            // do this
            Velocity(this.nextGridTransitionElement, { scale: [1, 1], translateZ: 0, translateX: [containerWidth * (this.currentX < 0 ? -1 : 1), this.currentX] }, {duration: duration, easing: bez});
            Velocity(this.gridTransitionElement, { translateX: [0, 0], scale: [0, this.scale] }, {duration: duration} );
        } else {
            duration = ((containerWidth - this.currentX) / pixelsPerMs) / 2;
            Velocity(this.nextGridTransitionElement, { translateZ: 0, translateX: [0, this.currentX] }, {duration: duration} );
            Velocity(this.gridTransitionElement, { scale: [1, this.scale] }, {duration: duration} );
        }

        var that = this;
        setTimeout(function() {
            that.sent = true;
            that.updateGrids();
        }, duration);

        // console.log('check', pixelsPerMs, containerWidth - this.currentX, (containerWidth - this.currentX) / pixelsPerMs);

        // return;

        // if (Math.abs(distance) < containerWidth) {
        //     if (distance < 0) {
        //         distance -= (pixelsPerMs + counter) * 15;
        //         counter += velocity;
        //     } else {
        //         distance += (pixelsPerMs + counter) * 15;
        //         counter += velocity;
        //     }
        //     var that = this;
        //     // requestAnimationFrame(function() {
        //         console.log(distance);
        //         revUtils.transformCss(that.nextGridTransitionElement, 'translate3d('+ distance +'px, 0, 0)');
        //         setTimeout(function() {
        //             that.finish(pixelsPerMs, distance, velocity, containerWidth, counter);
        //         }, 15);
        //     // });

        // }


        // if (counter < 1000) {
        //     counter++;
        //     console.log('check', pixelsPerMs, distance, containerWidth, counter);
        //     this.finish(pixelsPerMs, distance, containerWidth, counter);
        // }

        // this.currentX = e.deltaX;
        // this.currentDirection = e.direction;
    };

    // get this to dod the same as animateGrid
    RevSlider.prototype.pan = function(direction, movement, reset) {
        console.log('pan2', movement);
        this.updown = false;

        this.transitionClass(true);

        this.panDirection = direction;
        if (direction == 'left') {
            this.showNextPage();
        } else if (direction == 'right') {
            this.showPreviousPage();
        }

        // console.log('pan3', this.movement);
        // this.movement = this.movement + movement;
        this.movement = movement;
        // console.log('pan34', this.movement);

        if (this.movement > this.grid.containerWidth) {
            console.log('panupdate');
            this.updateGrids();
            this.panDirection = false;
            this.movement = 0;
        } else {
            // if (reset) { // used for touch simulation
            //     revUtils.transitionDurationCss(this.gridContainerElement,  this.animationDuration + 's');
            //     var that = this;
            //     setTimeout(function() {
            //         that.resetShowPage(reset);
            //     }, this.animationDuration * 1000);
            // } else {
                // revUtils.transitionDurationCss(this.gridContainerElement,  '0s');
                revUtils.transitionDurationCss(this.gridTransitionElement, '0s');
                revUtils.transitionDurationCss(this.nextGridTransitionElement, '0s');
            // }

            this.nextGridTransitionElement.style.zIndex = 1000; // TODO

            var scale = Math.max((1 - (Math.abs(this.movement) / 1000)), .8);
            revUtils.transformCss(this.gridTransitionElement, 'scale(' + scale + ')');

            // if (direction == 'left') {
                console.log('movement', this.movement);
                revUtils.transformCss(this.nextGridTransitionElement, 'translate3d('+ this.movement +'px, 0, 0)');
                // revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ this.movement +'px, 0, 0)');
            // } else if (direction == 'right') {
            //     revUtils.transformCss(this.nextGridTransitionElement, 'translate3d('+ this.movement +'px, 0, 0)');
            //     // revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ ( (this.grid.containerWidth + (this.padding.left * 2)) - this.movement ) +'px, 0, 0)');
            // }
        }
    };

    RevSlider.prototype.resetShowPage = function(ms) {
        ms = ms ? ms : 300;
        // revUtils.transitionDurationCss(this.gridContainerElement, ms + 'ms');
        // if (this.panDirection == 'left') {
        //     revUtils.transformCss(this.gridContainerElement, 'none');
        // } else {
        //     revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ ( (this.grid.containerWidth + (this.padding.left * 2))) +'px, 0, 0)');
        // }

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
        if (this.mc) {
            this.mc.set({enable: false});
            this.mc.destroy();
        }
    };

    return RevSlider;
}));