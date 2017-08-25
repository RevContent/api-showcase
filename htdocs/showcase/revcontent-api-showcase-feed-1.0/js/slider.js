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
            host: 'https://trends.revcontent.com',
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
            pagination_dots_vertical: false,
            stacked: false,
            destroy: false,
            fit_height: false,
            fit_height_clip: false,
            developer: false,
            header_selector: false,
            headline_icon_selector: false,
            internal_selector: false,
            reactions_selector: false,
            headline_top_selector: false,
            header_logo: false
        };

        // merge options
        this.options = revUtils.extend(defaults, revUtils.deprecateOptions(opts));

        // store options
        revUtils.storeUserOptions(this.options);

        if (revUtils.validateApiParams(this.options).length) {
            return;
        }

        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        var that = this;

        this.logoURI = 'data:image/png;base64,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';

        this.emitter = new EventEmitter();

        this.data = [];
        this.displayedItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider2';

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

        this.setMultipliers();

        this.createCells(this.grid);

        if (this.limit == 0) {
            this.destroy();
            return;
        }

        this.setUp(this.grid.items);

        this.getPadding(this.grid.items);

        this.setContentPadding(this.grid.items);

        this.setSize(this.grid.items);

        this.grid.layout(9);

        this.setUp(this.grid.items);

        this.setSize(this.grid.items);

        this.grid.layout(10);

        this.grid.on('resize', function() {
            that.resize();
        });

        this.getData();

        var that = this;

        this.dataPromise.then(function(data){
            that.updateDisplayedItems(that.grid.items, data);
            revApi.beacons.setPluginSource(this.options.api_source).attach();
        }, function() {
            that.destroy();
        }).catch(function(e) {
            console.log(e);
        });

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

    RevSlider.prototype.createHeader = function() {
        var header = document.createElement('div');
        header.className = 'rev-content-header';
        header.innerHTML = '<div class="rev-content-header-inner">' +
            '<span class="rev-icon">' +
                '<?xml version="1.0" ?><svg enable-background="new 0 0 32 32" height="32px" id="svg2" version="1.1" viewBox="0 0 32 32" width="32px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg"><g id="background"><rect fill="none" height="32" width="32"/></g><g id="arrow_x5F_full_x5F_upperright"><polygon points="28,24 22,18 12,28 4,20 14,10 8,4 28,4  "/></g></svg>' +
            '</span>' +
            '<h2>Trending Now</h2>' +
            '</div>';
        return header;
    };

    RevSlider.prototype.setGridClasses = function() {
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.vertical ? 'vertical' : 'horizontal'));
        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons ? (this.options.buttons.style ? this.options.buttons.style : 'none') : 'none'));

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
        revUtils.addClass(this.containerElement, 'rev-slider-col-' + this.grid.perRow);
        revUtils.addClass(this.containerElement, 'rev-slider-row-' + this.grid.nextRow);
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
        this.internalLimit = 0;
        this.sponsoredLimit = 0;
        this.visibleLimit = 0;

        if (this.options.fit_height) {

            var that = this;
            var fitCheck = function() {
                if (that.options.fit_height_clip) {
                    return that.containerElement.offsetHeight < that.element.offsetHeight || grid.rows[grid.row].count < grid.rows[grid.row].perRow;
                } else {
                    return that.containerElement.offsetHeight < that.element.offsetHeight;
                }
            }

            while (fitCheck() && i < 100) {
                // if (grid.rows[grid.nextRow]) {
                    // console.log(grid.rows);
                // }

                // console.log(grid.nextRow, grid.rows[grid.nextRow].count);

                var cell = this.createNewCell();
                grid.element.appendChild(cell);
                grid.appended([cell]);

                if (i == 0) {
                    this.getPadding();
                }

                this.setContentPadding(grid.items);

                this.setUp(grid.items);

                this.setSize(grid.items);

                grid.layout(9);

                // console.log(that.containerElement, that.element, that.containerElement.offsetHeight, that.element.offsetHeight);

                // TODO improve this to account for situation where element can be in view but not registered
                if (that.containerElement.offsetHeight < that.element.offsetHeight) {
                    this.visibleLimit++;
                }

                // revUtils.checkHidden(cell, function() {
                //     console.log('hidden');
                // })

                // lower the limit

                // console.log(this.containerElement.offsetHeight < this.element.offsetHeight, cell);

                this.limit++;
                i++;

                // console.log(grid.row, this.grid.items[this.grid.items.length - 1].row);
                // console.log(grid.rows[grid.row].count, grid.rows[grid.row].perRow);
                // console.log(grid.nextRow, grid.rows[grid.nextRow]);
            }

            // this.visibleLimit = this.limit;

            // // console.log(this.grid);

            // this.visibleLimit = this.limit;
            // for (var key in this.grid.rows) {
            //   if (this.grid.rows.hasOwnProperty(key)) {
            //     if (this.grid.rows)
            //     console.log('row', this.element.offsetHeight, this.grid.rows[key].maxHeight);
            //     // if (this.grid.rows[key].items) {
            //     //     for (var i = 0; i < this.grid.rows[key].items.length; i++) {
            //     //         console.log(this.grid.rows[key].items[i]);
            //     //     }
            //     // }
            //   }
            // }

            // console.log(this.containerElement, this.element, this.containerElement.offsetHeight, this.element.offsetHeight);

            // if (this.containerElement.offsetHeight > this.element.offsetHeight) {
            //     // console.log('hiiin');
            //     // for (var i = 0; i < this.grid.items.length; i++) {
            //     //     console.log(this.grid.items[i].element);
            //     // }
            //     grid.remove(cell);
            //     grid.layout();
            //     this.limit--;
            // }
        } else {

            var rowData = this.createRows(grid, this.options.rows, true);
            this.viewableItems = rowData.items;
            this.limit = rowData.limit;
            this.internalLimit = rowData.internalLimit;
            this.sponsoredLimit = rowData.sponsoredLimit;
        }
    };

    RevSlider.prototype.createRows = function(grid, rows, initial) {
        var i = 0; // just in case
        var limit = 0;
        var internalLimit = 0;
        var sponsoredLimit = 0;
        var itemsArr = [];
        // this.visibleLimit = 0;

        while (grid.nextRow < rows && i < 100) {
            var cell = this.createNewCell();
            grid.element.appendChild(cell);
            var items = grid.addItems([cell]);
            grid.layoutItems(items, true);
            grid.reveal(items);
            // var items = grid.appended([cell]);
            items[0].initial = initial;
            itemsArr.push(items[0]);

            if (this.options.internal_selector && items[0].element.matches(this.options.internal_selector)) {
                items[0].type = 'internal';
                internalLimit++;

                var meta = document.createElement('div');
                revUtils.addClass(meta, 'rev-meta');

                // meta
                meta.innerHTML = '<div class="rev-meta-inner">' +
                                '<div class="rev-provider"></div>' +
                                '<div class="rev-date"></div>' +
                                '</div>';

                items[0].element.querySelector('.rev-before-image').appendChild(meta);

                // if (this.options.headline_icon_selector && items[0].element.matches(this.options.headline_icon_selector)) {
                    meta.querySelector('.rev-meta-inner').insertAdjacentHTML('afterbegin', '<div class="rev-headline-icon-container"><div class="rev-headline-icon"></div></div>');
                // }

                var description = '<div class="rev-description">' +
                                    '<h4></h4>' +
                                '</div>';

                items[0].element.querySelector('.rev-headline-brand-inner').insertAdjacentHTML('beforeend', description);
            } else {
                items[0].element.querySelector('.rev-headline-brand-inner').insertAdjacentHTML('beforeend', '<div class="rev-provider"></div>');

                items[0].type = 'sponsored';
                sponsoredLimit++;
            }

            if (items[0].element.matches(this.options.reactions_selector)) {
                // reactions
                var reactionsContainer = document.createElement('div');
                revUtils.addClass(reactionsContainer, 'rev-reactions');
                items[0].element.appendChild(reactionsContainer);
            }

            var headline = '<div class="rev-headline">' +
                        '<h3></h3>' +
                    '</div>';

            if (items[0].element.matches(this.options.headline_top_selector)) {
                revUtils.addClass(items[0].element, 'rev-headline-top');
                items[0].element.querySelector('.rev-before-image').insertAdjacentHTML('beforeend', headline);
            } else {
                items[0].element.querySelector('.rev-headline-brand-inner').insertAdjacentHTML('afterbegin', headline);
            }

            if (this.options.header_selector && items[0].element.matches(this.options.header_selector)) {
                var cell = this.createHeader();
                this.grid.element.appendChild(cell);

                var headers = this.grid.addItems([cell]);
                this.grid.layoutItems(headers, true);
                this.grid.reveal(headers);

                // var headers = this.grid.appended([cell]);
                headers[0].type = 'header';
            }

            limit++;
            i++;
        }

        return {
            items: itemsArr,
            limit: limit,
            internalLimit: internalLimit,
            sponsoredLimit: sponsoredLimit
        }
    }

    RevSlider.prototype.getPadding = function(resetItems) {
        if (resetItems) {
            for (var i = 0; i < resetItems.length; i++) {
                resetItems[i].element.style.paddingTop = null;
                resetItems[i].element.style.paddingRight = null;
                resetItems[i].element.style.paddingBottom = null;
                resetItems[i].element.style.paddingLeft = null;

                resetItems[i].element.children[0].style.paddingTop = null;
                resetItems[i].element.children[0].style.paddingRight = null;
                resetItems[i].element.children[0].style.paddingBottom = null;
                resetItems[i].element.children[0].style.paddingLeft = null;
            }
            // this.grid.layout(11);
        }
        // use last element for padding-top
        var paddingTop = parseFloat(revUtils.getComputedStyle(this.grid.items[(this.grid.items.length - 1)].element, 'padding-top'));
        var paddingRight = parseFloat(revUtils.getComputedStyle(this.grid.items[0].element, 'padding-right'));
        var paddingBottom = parseFloat(revUtils.getComputedStyle(this.grid.items[0].element, 'padding-bottom'));
        var paddingLeft = parseFloat(revUtils.getComputedStyle(this.grid.items[0].element, 'padding-left'));

        var adInner = this.grid.element.querySelectorAll('.rev-ad-inner')[0];
        var calculatedPadding = Math.round((adInner.offsetWidth * this.marginMultiplier).toFixed(2) / 1);

        this.padding = {
            top: paddingTop ? false : calculatedPadding,
            right: paddingRight ? false : calculatedPadding,
            bottom: paddingBottom ? false : calculatedPadding,
            left: paddingLeft ? false : calculatedPadding,
        };

        // console.log(this.padding);
    };

    RevSlider.prototype.setContentPadding = function(items) {
        // var content = this.grid.element.querySelectorAll('.rev-content');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (this.padding.top) {
                item.element.style.paddingTop = this.padding.top + 'px';
            }
            if (this.padding.right) {
                item.element.style.paddingRight = this.padding.right + 'px';
            }
            if (this.padding.bottom) {
                item.element.style.paddingBottom = this.padding.bottom + 'px';
            }
            if (this.padding.left) {
                item.element.style.paddingLeft = this.padding.left + 'px';
            }
        }
    };

    RevSlider.prototype.setMultipliers = function() {
        this.lineHeightMultiplier = Math.round( (.05856 + Number((this.options.multipliers.line_height * .01).toFixed(2))) * 10000 ) / 10000;
        // used for padding around elements
        this.marginMultiplier = Math.round( (.05 + Number((this.options.multipliers.margin * .01).toFixed(2))) * 1000 ) / 1000;
        // used for margins on headlines inside
        this.paddingMultiplier = Math.round( (.03 + Number((this.options.multipliers.padding * .01).toFixed(2))) * 1000 ) / 1000;
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
            stacked: this.options.stacked,
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

        this.setContentPadding(this.nextGrid.items);

        this.setSize(this.nextGrid.items);

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

        this.updateDisplayedItems(this.grid.items);

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

    RevSlider.prototype.setUp = function(items) {
        // hard code provider

        var that = this;
        var setUp = function(item) {

            // var index = revUtils.siblingIndex(item.element);
            // // that.setImageSize(index, item.element);

            // var row = Math.floor( index / that.grid.perRow );

            that.setImageSize(item); // TODO: multiple image ratios

            that.setTextRight(item);

            that.setTextOverlay(item);

            that.setItemClasses(item);

            that.setInnerMargin(item);

            that.setPreloaderHeight(item);

            that.setUpProvider(item);

            // headline calculation based on text_right_height or grid columnWidth and lineHeightMultiplier
            that.setHeadlineLineHeight(item);
            that.setHeadlineFontSize(item);
            that.setHeadlineMarginTop(item);

            // that.setHeadlineMaxHeight(item.element, item.span, item.row, item.index, item.stacked, item);
            if (item.type == 'internal') {
                that.setDescriptionLineHeight(item);
                that.setDescriptionFontSize(item);
                that.setDescriptionMarginTop(item);
            }
        };

        // if (item) { // if ad is passed do that one
        //     setUp(item);
        // } else { // otherwise do them all
        for (var i = 0; i < items.length; i++) {
            if (revUtils.hasClass(items[i].element, 'rev-content')) {
                setUp(items[i]);
            }
        }
        // }
    };

    RevSlider.prototype.setSize = function(items) {

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.type == 'sponsored' || item.type == 'internal') {
                this.resizeImage(item.element.querySelector('.rev-image'), item);
                this.resizeHeadline(item.element.querySelector('.rev-headline'), item.row, item.index, item);
                if (item.type == 'internal') {
                    this.resizeDescription(item.element.querySelector('.rev-description'), item.row, item.index, item);
                }
                this.resizeProvider(item.element.querySelector('.rev-provider'), item);
                this.resizeHeadlineIcon(item.element.querySelector('.rev-headline-icon-container'), item.row, item.index, item);
                this.resizeHeadlineBrand(item);
            }
        }

        // var that = this;

        // var setSize = function(item) {

        //     var index = revUtils.siblingIndex(item.element);

        //     var row = Math.floor( index / grid.perRow );

        //     console.log(item.index, index)

        //     that.resizeImage(item.element.querySelector('.rev-image'), item);
        //     that.resizeHeadline(item.element.querySelector('.rev-headline'), row, index, item);
        //     that.resizeProvider(item.element.querySelector('.rev-provider'), item);
        //     that.resizeHeadlineBrand(item);
        // };

        // if (item) { // if ad is passed do that one
        //     setSize(item);
        // } else { // otherwise do them all
        //     for (var i = 0; i < grid.items.length; i++) {
        //         setSize(grid.items[i]);
        //     }
        // }
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
                case 'square':
                    item.imageHeight = 400;
                    item.imageWidth = 400;
                default:
                    var ratioParts = ratio.split(':');
                    if (ratioParts[0] && ratioParts[1]) {
                        item.imageWidth = ratio.split(':')[0];
                        item.imageHeight = ratio.split(':')[1];
                    } else { // something went horribly wrong just do this
                        item.imageHeight = 300;
                        item.imageWidth = 400;
                    }
            }
        }

        setImageSize((revDetect.mobile() ? 'wide_rectangle' : 'rectangle'));

        if (revUtils.isArray(this.options.image_ratio)) {
            for (var i = 0; i < this.options.image_ratio.length; i++) {
                if ((!this.options.image_ratio[i].media || window.matchMedia(this.options.image_ratio[i].media).matches)
                    && (!this.options.image_ratio[i].selector || matchesSelector(item.element, this.options.image_ratio[i].selector))) {
                    setImageSize(this.options.image_ratio[i].ratio);
                }
            }
        }
    };

    RevSlider.prototype.setPreloaderHeight = function(item) {
        item.preloaderHeight = false;
        item.preloaderWidth = false;
        if (item.textRight) { // base off text_right_height
            item.preloaderHeight = this.getTextRightHeight();
            item.preloaderWidth = item.preloaderHeight * (item.imageWidth / item.imageHeight);
        } else {
            var adInner = item.element.querySelector('.rev-ad-inner');
            var rect = adInner.getBoundingClientRect();
            var width = Number(Math.round((rect.width ? rect.width : (rect.right - rect.left)) + 'e2') + 'e-2')

            // console.log(width);

            // item.preloaderHeight = Math.floor(adInner.offsetWidth * (item.imageHeight / item.imageWidth));
            // item.preloaderWidth = Math.ceil(item.preloaderHeight * (item.imageWidth / item.imageHeight));

            item.preloaderHeight = Number(Math.round((width * (item.imageHeight / item.imageWidth)) + 'e2') + 'e-2');
            item.preloaderWidth =  Number(Math.round((item.preloaderHeight * (item.imageWidth / item.imageHeight)) + 'e2') + 'e-2');
        }
    };

    RevSlider.prototype.setTextRight = function(item) {
        item.textRight = false;
        if (this.options.text_right !== false) {
            if (this.options.text_right === true) {
                item.textRight = true;
            } else {
                for (var i = 0; i < this.options.text_right.length; i++) {
                    if ((!this.options.text_right[i].media || window.matchMedia(this.options.text_right[i].media).matches)
                        && (!this.options.text_right[i].selector || matchesSelector(item.element, this.options.text_right[i].selector))) {
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
                    if ((!this.options.text_overlay[i].media || window.matchMedia(this.options.text_overlay[i].media).matches)
                        && (!this.options.text_overlay[i].selector || matchesSelector(item.element, this.options.text_overlay[i].selector))) {
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

        revUtils.removeClass(item.element, 'rev-content-', true);
        revUtils.addClass(item.element, 'rev-content-' + item.type);

        // if (item.stacked) {
        //     revUtils.addClass(item.element, 'rev-stacked');
        // } else {
        //     revUtils.removeClass(item.element, 'rev-stacked');
        // }

        revUtils.removeClass(item.element, 'rev-colspan', true);
        revUtils.addClass(item.element, 'rev-colspan-' + item.span);

        revUtils.removeClass(item.element, 'rev-row', true);
        revUtils.addClass(item.element, 'rev-row-' + (item.row + 1));
    };

    RevSlider.prototype.setInnerMargin = function(item) {
        var headline = item.element.querySelector('.rev-headline h3');
        headline.removeAttribute('style');
        var computedInnerMargin = parseInt(revUtils.getComputedStyle(headline, 'margin-left'));

        if (computedInnerMargin > -1) {
            item.innerMargin = computedInnerMargin;
            return;
        }

        var adInner = item.element.querySelector('.rev-ad-inner');
        item.innerMargin = Math.round(Math.max(0, ((adInner.offsetWidth * this.paddingMultiplier).toFixed(2) / 1)));

        if (item.innerMargin > 15) {
            item.innerMargin = 15;
        }
    };

    RevSlider.prototype.setDescriptionLineHeight = function(item) {
        var description = item.element.querySelector('.rev-description h4');
        description.removeAttribute('style');
        if (!description) {
            return;
        }
        var computedLineHeight = parseInt(revUtils.getComputedStyle(description, 'line-height'));

        if (computedLineHeight) {
            item.descriptionLineHeight = computedLineHeight;
            return;
        }

        item.descriptionLineHeight = item.headlineLineHeight - 4
    };

    RevSlider.prototype.setDescriptionFontSize = function(item) {
        var description = item.element.querySelector('.rev-description h4');
        description.removeAttribute('style');
        if (!description) {
            return;
        }
        var computedFontSize = parseInt(revUtils.getComputedStyle(description, 'font-size'));

        if (computedFontSize) {
            item.descriptionFontSize = computedFontSize;
            return;
        }

        item.descriptionFontSize = Math.max(12, (item.descriptionLineHeight * .8).toFixed(2) / 1);
    };

    RevSlider.prototype.setUpProvider = function(item) {

        item.providerFontSize = 11;
        item.providerLineHeight = 16;
        item.providerMarginTop = 2;

        var provider = item.element.querySelector('.rev-provider');
        provider.removeAttribute('style');

        var computedFontSize = parseInt(revUtils.getComputedStyle(provider, 'font-size'));

        if (computedFontSize) {
            item.providerFontSize = computedFontSize;
        }

        var computedLineHeight = parseInt(revUtils.getComputedStyle(provider, 'line-height'));

        if (computedLineHeight) {
            item.providerLineHeight = computedLineHeight;
        }

        var computedMarginTop = parseInt(revUtils.getComputedStyle(provider, 'margin-top'));

        if (computedMarginTop > -1) {
            item.providerMarginTop = computedMarginTop;
        }
    };

    RevSlider.prototype.setHeadlineLineHeight = function(item) {
        var headline = item.element.querySelector('.rev-headline h3');
        headline.style.lineHeight = null;

        var computedLineHeight = parseInt(revUtils.getComputedStyle(headline, 'line-height'));

        if (computedLineHeight) {
            item.headlineLineHeight = computedLineHeight;
            return;
        }

        var calculateWidth = item.element.querySelector('.rev-ad-inner').offsetWidth;
        // if (item.textRight) {
        //     calculateWidth -= (item.preloaderWidth + parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-image'), 'margin-right')));
        // }
        // something between 18 and 28 for headlineHeight
        item.headlineLineHeight = Math.max(18, Math.round(calculateWidth * this.lineHeightMultiplier));
        if (item.headlineLineHeight > 28) {
            item.headlineLineHeight = 28;
        }
    };

    RevSlider.prototype.setHeadlineFontSize = function(item) {
        var headline = item.element.querySelector('.rev-headline h3');
        headline.style.fontSize = null;
        var computedFontSize = parseInt(revUtils.getComputedStyle(headline, 'font-size'));

        if (computedFontSize) {
            item.headlineFontSize = computedFontSize;
            return;
        }

        item.headlineFontSize = (item.headlineLineHeight * .75).toFixed(2) / 1;
    };

    RevSlider.prototype.setHeadlineMarginTop = function(item) {
        var headline = item.element.querySelector('.rev-headline h3');
        headline.style.marginTop = null;
        var computedMarginTop = parseInt(revUtils.getComputedStyle(headline, 'margin-top'));

        if (computedMarginTop > -1) {
            item.headlineMarginTop = computedMarginTop;
            return;
        }

        item.headlineMarginTop = 0;
        if (!item.textRight) { // give some space between bottom of image and headline
            var adInner = item.element.querySelector('.rev-ad-inner');
            item.headlineMarginTop = Math.round(Math.max(0, ((adInner.offsetWidth * this.paddingMultiplier).toFixed(2) / 1)));

            if (item.headlineMarginTop > 15) {
                item.headlineMarginTop = 15;
            }
        }


        // if (!item.textRight) { // give some space between bottom of image and headline
        //     var headlineMarginTop = ((item.headlineLineHeight * .18).toFixed(2) / 1);
        //     item.headlineMarginTop = headlineMarginTop > 4 ? 4 : headlineMarginTop;
        // }
    };

    RevSlider.prototype.setDescriptionMarginTop = function(item) {
        var description = item.element.querySelector('.rev-description h4');
        if (!description) {
            return;
        }
        description.style.marginTop = null;
        var computedMarginTop = parseInt(revUtils.getComputedStyle(description, 'margin-top'));

        // console.log('sup', computedMarginTop);

        if (computedMarginTop > -1) {
            item.descriptionMarginTop = computedMarginTop;
            return;
        }

        // var adInner = item.element.querySelector('.rev-ad-inner');
        item.descriptionMarginTop = item.headlineMarginTop * .6;
    };

    // RevSlider.prototype.setHeadlineMaxHeight = function(element, colSpan, row, index, stacked, item) {
    //     var maxHeight = 0;

    //     if (!this.headlineMaxHeights) {
    //         this.headlineMaxHeights = {};
    //     }

    //     if (!this.headlineMaxHeights[row]) {
    //         this.headlineMaxHeights[row] = {};
    //     }

    //     if (!this.headlineMaxHeights[row][colSpan]) {
    //         this.headlineMaxHeights[row][colSpan] = {};
    //     }

    //     if (item.textRight) { // based on preloaderHeight/ ad height
    //         var verticalSpace = item.preloaderHeight - item.providerLineHeight;
    //         var headlines = Math.floor(verticalSpace / item.headlineLineHeight);
    //         maxHeight = headlines * item.headlineLineHeight;
    //         this.headlineMaxHeights[row][colSpan][index] = { maxHeight: maxHeight };
    //     } else {

    //         var getHeadlineSizeMax = function(lineHeight, headlineSize) {
    //             return ((lineHeight * headlineSize).toFixed(2) / 1);
    //         }

    //         // var adsInner = this.grid.element.querySelectorAll('.rev-ad-inner');
    //         // if (this.options.max_headline && this.displayedItems.length && adsInner.length) { // max_headline and we have some ads otherwise just use the headline_size
    //         if (this.displayedItems.length && this.displayedItems[index]) { // max_headline and we have some ads otherwise just use the headline_size
    //             var adInner = element.querySelector('.rev-ad-inner');
    //             var el = document.createElement('div');
    //             revUtils.addClass(el, 'rev-headline-max-check');
    //             el.style.position = 'absolute';
    //             el.style.textAlign = revUtils.getComputedStyle(adInner.querySelectorAll('.rev-headline')[0], 'text-align');
    //             el.style.zIndex = '100';
    //             el.style.margin = item.headlineMarginTop +'px ' + item.innerMargin + 'px 0';
    //             el.innerHTML = '<h3 style="font-size:'+ item.headlineFontSize + 'px;line-height:'+ item.headlineLineHeight +'px">'+ this.displayedItems[index].headline + '</h3>';
    //             revUtils.prepend(adInner, el); // do it this way b/c changin the element height on the fly needs a repaint and requestAnimationFrame is not avail in IE9

    //             var height = el.clientHeight;

    //             revUtils.remove(el);

    //             if (stacked) {
    //                 if (this.options.max_headline) {
    //                     this.headlineMaxHeights[row][colSpan][index] = { maxHeight: height };
    //                 } else {
    //                     this.headlineMaxHeights[row][colSpan][index] = { maxHeight: Math.min(getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size), height) };
    //                 }
    //             } else {
    //                 if (this.options.max_headline) {
    //                     maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, height);
    //                     this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
    //                 } else {
    //                     maxHeight = Math.min(getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size), height);
    //                     maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, maxHeight);
    //                     this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
    //                 }
    //             }
    //         } else {
    //             maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size));
    //             this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
    //         }
    //     }
    // };

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

            if (this.options.header_logo) {
                var headLogo = document.createElement('div');
                revUtils.addClass(headLogo, 'rev-header-logo')
                headLogo.style.backgroundImage = 'url('+ this.logoURI +')';

                headLogo.style.height = this.head.offsetHeight + 'px';
                headLogo.style.width = this.head.offsetHeight + 'px';

                this.head.insertAdjacentElement('afterbegin', headLogo);
            }
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
            revDisclose.setGrid(this.grid);
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

    // RevSlider.prototype.getCellHeight = function(row, index, item) {
    //     var ad = item.element.children[0]; //TODO

    //     var cellHeight = item.preloaderHeight;

    //     cellHeight += ad.offsetHeight - ad.children[0].offsetHeight; // padding ad - ad-container
    //     cellHeight += ad.children[0].offsetHeight - ad.children[0].children[0].offsetHeight; // padding ad-container - ad-outer

    //     if (!item.textRight && !item.textOverlay) {
    //         cellHeight += (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) +
    //             item.headlineMarginTop +
    //             this.providerLineHeight +
    //             this.providerMarginTop;
    //     }

    //     return Math.floor(cellHeight);
    // };

    RevSlider.prototype.resize = function() {
        // while (this.grid.element.firstChild) {
        //     this.grid.element.removeChild(this.grid.element.firstChild);
        // }

        // this.grid._resetLayout();

        // this.grid.reloadItems();

        this.grid.layout();

        this.setGridClasses();

        // this.displayedItems = [];

        // this.createCells(this.grid);

        // this.setDisplayedItems();

        this.getPadding(this.grid.items);

        this.setContentPadding(this.grid.items);

        this.setUp(this.grid.items);

        this.setSize(this.grid.items);

        this.grid.layout();

        this.setUp(this.grid.items);

        this.setSize(this.grid.items);

        this.grid.layout();

        // this.updateDisplayedItems(this.grid.items);

        // this.checkEllipsis(true);

        // this.getAnimationDuration();

        // this.updatePagination(true);

        this.emitter.emitEvent('resized');
    };

    RevSlider.prototype.resizeImage = function(el, item) {
        el.style.height = item.preloaderHeight + 'px';
        el.style.width = 'auto';
        // el.style.width = typeof item.preloaderWidth === false ? 'auto' : item.preloaderWidth + 'px';
    };

    RevSlider.prototype.resizeHeadline = function(el, row, index, item) {
        // console.log(this.headlineMaxHeights, item.row, item.element);
        // el.style.maxHeight = (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) + 'px';
        el.querySelector('h3').style.margin = item.headlineMarginTop +'px ' + item.innerMargin + 'px 0';
        el.querySelector('h3').style.fontSize = item.headlineFontSize + 'px';
        el.querySelector('h3').style.lineHeight = item.headlineLineHeight + 'px';
    };

    RevSlider.prototype.resizeDescription = function(el, row, index, item) {
        if (!el) {
            return;
        }
        // el.style.maxHeight = (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) + 'px';
        el.querySelector('h4').style.margin = item.descriptionMarginTop +'px ' + item.innerMargin + 'px 0';
        el.querySelector('h4').style.fontSize = item.descriptionFontSize + 'px';
        el.querySelector('h4').style.lineHeight = item.descriptionLineHeight + 'px';
    };

    RevSlider.prototype.resizeHeadlineIcon = function(el, row, index, item) {
        if (el) {
            var height = item.element.querySelector('.rev-meta-inner').offsetHeight;

            el.style.height = height + 'px';
            el.style.width = height + 'px';

            // var icon = el.children[0];
            // icon.style.height = item.headlineFontSize + 'px'
            // icon.style.width = item.headlineFontSize + 'px';
            // icon.style.marginTop = ((item.headlineLineHeight - item.headlineFontSize) / 2) + 'px';
        }
    };

    RevSlider.prototype.resizeProvider = function(el, item) {
        if(this.options.hide_provider || !el) {
            return;
        }
        // console.log(this.providerMarginTop + 'px ' + item.innerMargin + 'px 0', item.innerMargin);
        el.style.margin = item.providerMarginTop + 'px ' + item.innerMargin + 'px 0';
        el.style.fontSize = item.providerFontSize + 'px';
        el.style.lineHeight = item.providerLineHeight + 'px';
        el.style.height = item.providerLineHeight + 'px';
    };

    RevSlider.prototype.resizeHeadlineBrand = function(item) {

        // if (!this.dataPromise || item.textOverlay)
        //     return;

        if (item.textOverlay)
            return;

        var that = this;
        // TODO: make sure headlines have text
        // this.dataPromise.then(function() {
            var rowItems = that.grid.rows[item.row].items;
            var maxHeight = 0;

            for (var i = 0; i < rowItems.length; i++) {
                var headlineBrand = rowItems[i].element.querySelector('.rev-after-image');
                headlineBrand.style.height = 'auto';
                var height = headlineBrand.offsetHeight;
                if (height > maxHeight) {
                    maxHeight = height;
                }
            }

            // if (item.type == 'internal') {
            //     console.log(item.element, maxHeight);
            // }

            for (var i = 0; i < rowItems.length; i++) {
                rowItems[i].element.querySelector('.rev-after-image').style.height = maxHeight + 'px';
            }
        // });

        // if (this.displayedItems.length && !item.textOverlay) {
        //     var rowItems = this.grid.rows[item.row].items;
        //     var maxHeight = 0;

        //     for (var i = 0; i < rowItems.length; i++) {
        //         var headlineBrand = rowItems[i].element.querySelector('.rev-headline-brand');
        //         // console.log(item, headlineBrand);
        //         headlineBrand.style.height = 'auto';
        //         var height = headlineBrand.offsetHeight;
        //         if (height > maxHeight) {
        //             maxHeight = height;
        //         }
        //     }

        //     for (var i = 0; i < rowItems.length; i++) {
        //         rowItems[i].element.querySelector('.rev-headline-brand').style.height = maxHeight + 'px';
        //     }
        // }
    }

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

                                // favicon, headline, description, provider and date

                                // '<div class="rev-meta">' +
                                //     '<div class="rev-provider"></div>' +
                                //     '<div class="rev-date">15 hrs</div>' +
                                //     // '<div class="rev-headline">' +
                                //     //     '<h3></h3>' +
                                //     // '</div>' +
                                // '</div>' +

                                '<div class="rev-before-image"></div>' +

                                '<div class="rev-image">' +
                                    '<img src=""/>' +
                                '</div>' +

                                '<div class="rev-after-image">' +
                                    '<div class="rev-headline-brand">' +
                                        '<div class="rev-headline-brand-inner">' +
                                            // '<div class="rev-headline">' +
                                            //     '<h3></h3>' +
                                            // '</div>' +
                                            // '<div class="rev-description">' +
                                            //     '<h4></h4>' +
                                            // '</div>' +
                                        '</div>' +
                                        // '<div class="rev-provider"></div>' +
                                    '</div>' +
                                '</div>' +
                                // '<div class="rev-headline-brand">' +
                                //     '<div class="rev-headline">' +
                                //         '<h3></h3>' +
                                //     '</div>' +
                                //     '<div class="rev-provider"></div>' +
                                // '</div>' +
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

    RevSlider.prototype.generateUrl = function(offset, count, empty, viewed, internal, below_article) {
        var url = (this.options.host ? this.options.host + '/api/v1' : this.options.url) +
        '?api_key=' + this.options.api_key +
        this.getSerializedQueryParams() +
        '&pub_id=' + this.options.pub_id +
        '&widget_id=' + this.options.widget_id +
        '&domain=' + this.options.domain +
        '&api_source=' + this.options.api_source + (below_article ? 'ba' : '');

        url +=
        '&sponsored_count=' + (internal ? 0 : count) +
        '&internal_count=' + (internal ? count : 0) +
        '&sponsored_offset=' + (internal ? 0 : offset) +
        '&internal_offset=' + (internal ? offset : 0);

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

        var urls = [];

        if (this.internalLimit > 0) {
            var internalURL = this.generateUrl(0, this.internalLimit, false, false, true);
            urls.push({
                url: internalURL,
                type: 'internal'
            });
        }

        if (this.sponsoredLimit > 0) {
            // if the first internal is greater than 0 there is a ba
            var firstInternal = revUtils.siblingIndex(this.grid.element.querySelector(this.options.internal_selector));
            var sponsoredURL = this.generateUrl(0, this.sponsoredLimit, false, false, false, (firstInternal > 0));
            urls.push({
                url: sponsoredURL,
                type: 'sponsored'
            });
        }

        this.promises = [];
        for (var i = 0; i < urls.length; i++) {
            this.promises.push(new Promise(function(resolve, reject) {
                var url = urls[i];
                revApi.request(url.url, function(resp) {
                    if (!resp.length) {
                        reject();
                        return;
                    }
                    resolve({
                        type: url.type,
                        data: resp
                    });
                });
            }));
        }

        this.dataPromise = Promise.all(this.promises);

        return this.dataPromise;

        // var that = this;

        // this.dataPromise = new Promise(function(resolve, reject) {

        //     // prime data - empty and not viewed
        //     var url = that.generateUrl(0, that.getMaxCount(), true, false);

        //     revApi.request(url, function(resp) {

        //         if (!resp.length) {
        //             resolve(resp);
        //             that.destroy();
        //             return;
        //         }

        //         that.data = resp;

        //         revUtils.addClass(that.containerElement, 'rev-slider-has-data');

        //         that.setDisplayedItems();

        //         that.setUp(that.grid.items);

        //         that.updateDisplayedItems(that.grid.items);

        //         that.emitter.emitEvent('ready');
        //         that.ready = true;

        //         that.emitter.once('imagesLoaded', function() {
        //             revUtils.addClass(that.containerElement, 'loaded');
        //         });

        //         revUtils.imagesLoaded(that.grid.element.querySelectorAll('img'), that.emitter);

        //         resolve(resp);
        //     });
        // });

        // return this.dataPromise;
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

    RevSlider.prototype.updateDisplayedItems = function(items, data) {
        // if (!this.data.length) { // if no data remove the container and call it a day
        //     this.destroy();
        //     return;
        // }

        // console.log(items, data);

        var itemTypes = {
            sponsored: [],
            internal: [],
            header: []
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            itemTypes[item.type].push(item);
        }

        this.removeItems = [];

        for (var i = 0; i < data.length; i++) {
            var dataType = data[i].type;
            var dataData = data[i].data;
            for (var j = 0; j < itemTypes[dataType].length; j++) {
                var item = itemTypes[dataType][j];
                var itemData = dataData[j];

                if (!itemData) {
                    this.removeItems.push(item);
                    continue;
                }

                item.view = itemData.view; // this is different for trending and sponsored so set for each item

                // if (this.options.image_overlay !== false) { // TODO: ad does not exist
                //     revUtils.imageOverlay(ad.querySelector('.rev-image'), itemData.content_type, this.options.image_overlay, this.options.image_overlay_position);
                // }

                // if (this.options.ad_overlay !== false) { // TODO: ad does not exist
                //     revUtils.adOverlay(ad.querySelector('.rev-ad-inner'), itemData.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
                // }

                var reactions = item.element.querySelector('.rev-reactions');
                if (reactions) {
                    var js = document.createElement('script');
                    js.type = 'text/javascript';
                    js.src = this.options.host + '/reactions.js.php?r=199&url=' + itemData.url;
                    js.id = 'rc-react';
                    reactions.appendChild(js);
                }

                var anchor = item.element.querySelector('a');
                anchor.setAttribute('href', itemData.url.replace('&uitm=1', '').replace('uitm=1', '') + (this.viewed ? '&viewed=true' : ''));
                anchor.title = itemData.headline;

                var roundedPreloaderHeight = Math.round(item.preloaderHeight);
                var roundedPreloaderWidth = Math.round(item.preloaderWidth);
                var image = itemData.image.replace('h=315', 'h=' + roundedPreloaderHeight).replace('w=420', 'w=' + roundedPreloaderWidth) + '&h=' + roundedPreloaderHeight + '&w=' + roundedPreloaderWidth;
                item.element.querySelector('img').setAttribute('src', image);

                var headline = item.element.querySelector('.rev-headline h3');
                headline.innerHTML = itemData.headline;

                var description = item.element.querySelector('.rev-description');
                if (description) {
                    description.children[0].innerHTML = itemData.description ? itemData.description : 'Read More';
                }

                var date = item.element.querySelector('.rev-date');
                if (date) {
                    if (itemData.date) {
                        date.innerHTML = itemData.date;
                    } else {
                        date.innerHTML = (Math.floor(Math.random() * (24 - 1 + 1)) + 1) + ' hrs';
                    }
                }


                var favicon = item.element.querySelector('.rev-headline-icon');
                if (favicon) {
                    var url = itemData.favicon_url ? 'url("' + itemData.favicon_url + '")' : 'url('+ this.logoURI +')';
                    favicon.style.backgroundImage = url;
                }

                var provider = item.element.querySelector('.rev-provider');
                if (provider) {
                    provider.innerHTML = itemData.brand ? itemData.brand : this.options.domain;
                }

                // make sure the text-decoration is the same as the headline
                anchor.style.color = revUtils.getComputedStyle(headline, 'color');

                this.setSize([item]);
            }
        }

        // if (this.options.register_impressions) {
        //     this.registerImpressions(viewed);
        // }

        // console.log('remove', this.removeItems); // HERE. REMOVE THESE and HALT THIS THING


        // this.grid.reloadItems();
        this.grid.layout(3);

        // console.log(this.removeItems);

        if (this.removeItems.length) {

            this.emitter.emitEvent('removedItems', [this.removeItems]);

            // for (var i = 0; i < this.removeItems.length; i++) {
            //     var item = this.removeItems[i];
            //     item.remove();
            //     var index = this.grid.items.indexOf(item);
            //     if ( index != -1 ) {
            //        this.grid.items.splice(index, 1);
            //     } else {
            //         console.log('dafuqqq');
            //     }
            // }
        }
        // this.checkEllipsis();
        // this.updatePagination();
        // this.fitHeight();

        // return;

        // this.oldOffset = this.offset;

        // this.offset = ((this.page - 1) * this.limit);

        // this.setDisplayedItems();

        // for (var i = 0; i < items.length; i++) {
        //     var item = items[i];

        //     if (!revUtils.hasClass(item.element, 'rev-content')) {
        //         continue;
        //     }

        //     var data = this.displayedItems[item.index];

        //     if (this.options.image_overlay !== false) { // TODO: ad does not exist
        //         revUtils.imageOverlay(ad.querySelector('.rev-image'), data.content_type, this.options.image_overlay, this.options.image_overlay_position);
        //     }

        //     if (this.options.ad_overlay !== false) { // TODO: ad does not exist
        //         revUtils.adOverlay(ad.querySelector('.rev-ad-inner'), data.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
        //     }

        //     var anchor = item.element.querySelector('a');
        //     anchor.setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', '') + (this.viewed ? '&viewed=true' : ''));
        //     anchor.title = data.headline;

        //     var roundedPreloaderHeight = Math.round(item.preloaderHeight);
        //     var roundedPreloaderWidth = Math.round(item.preloaderWidth);
        //     var image = data.image.replace('h=315', 'h=' + roundedPreloaderHeight).replace('w=420', 'w=' + roundedPreloaderWidth) + '&h=' + roundedPreloaderHeight + '&w=' + roundedPreloaderWidth;
        //     item.element.querySelector('img').setAttribute('src', image);

        //     var headline = item.element.querySelector('.rev-headline h3');
        //     headline.innerHTML = data.headline;

        //     item.element.querySelector('.rev-provider').innerHTML = data.brand;

        //     // make sure the text-decoration is the same as the headline
        //     anchor.style.color = revUtils.getComputedStyle(headline, 'color');

        //     this.setSize([item]);
        // }

        // this.setUp(4);

        // var ads = this.grid.element.querySelectorAll('.rev-content');
        // for (var i = 0; i < this.displayedItems.length; i++) {
        //     var item = this.grid.items[i],
        //         data = this.displayedItems[i];

        //     // ad.style.height = this.getCellHeight(ad) + 'px';

        //     if (this.options.image_overlay !== false) { // TODO: ad does not exist
        //         revUtils.imageOverlay(ad.querySelector('.rev-image'), data.content_type, this.options.image_overlay, this.options.image_overlay_position);
        //     }

        //     if (this.options.ad_overlay !== false) { // TODO: ad does not exist
        //         revUtils.adOverlay(ad.querySelector('.rev-ad-inner'), data.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
        //     }

        //     var anchor = item.element.querySelector('a');
        //     anchor.setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', '') + (this.viewed ? '&viewed=true' : ''));
        //     anchor.title = data.headline;

        //     var roundedPreloaderHeight = Math.round(item.preloaderHeight);
        //     var roundedPreloaderWidth = Math.round(item.preloaderWidth);
        //     var image = data.image.replace('h=315', 'h=' + roundedPreloaderHeight).replace('w=420', 'w=' + roundedPreloaderWidth) + '&h=' + roundedPreloaderHeight + '&w=' + roundedPreloaderWidth;
        //     item.element.querySelector('img').setAttribute('src', image);

        //     var headline = item.element.querySelector('.rev-headline h3');
        //     headline.innerHTML = data.headline;

        //     item.element.querySelector('.rev-provider').innerHTML = data.brand;

        //     // make sure the text-decoration is the same as the headline
        //     anchor.style.color = revUtils.getComputedStyle(headline, 'color');

        //     this.setSize([item]);
        // }

        // if (this.options.register_impressions) {
        //     this.registerImpressions(viewed);
        // }

        // // this.grid.reloadItems();
        // this.grid.layout(3);
        // this.checkEllipsis();
        // this.updatePagination();
        // this.fitHeight();
    };

    RevSlider.prototype.fitHeight = function() {
        return;
        if (!this.options.fit_height) {
            return;
        }
        var i = 0;
        while (this.containerElement.offsetHeight > this.element.offsetHeight && this.grid.items.length && i < 100) {
            this.grid.remove(this.grid.items[this.grid.items.length - 1].element);
            this.grid.layout();
            this.limit--;
            i++
        }

        // if (this.grid.rows[this.grid.nextRow] && this.grid.rows[this.grid.nextRow].count < this.grid.rows[this.grid.nextRow].perRow) {
        //     var count = this.grid.rows[this.grid.nextRow].count;
        //     for (var i = 0; i < count; i++) {
        //         this.grid.remove(this.grid.items[this.grid.items.length - 1].element);
        //         this.grid.layout();
        //         this.limit--;
        //     }
        // }

        this.setGridClasses();
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

        if (typeof this.options.destroy === 'function') {
            this.options.destroy();
        }
    };

    return RevSlider;
}));