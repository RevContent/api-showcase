/*
ooooooooo.                         ooooo                          .
`888   `Y88.                       `888'                        .o8
 888   .d88'  .ooooo.  oooo    ooo  888  ooo. .oo.    .oooo.o .o888oo oooo d8b  .ooooo.   .oooo.   ooo. .oo.  .oo.
 888ooo88P'  d88' `88b  `88.  .8'   888  `888P"Y88b  d88(  "8   888   `888""8P d88' `88b `P  )88b  `888P"Y88bP"Y88b
 888`88b.    888ooo888   `88..8'    888   888   888  `"Y88b.    888    888     888ooo888  .oP"888   888   888   888
 888  `88b.  888    .o    `888'     888   888   888  o.  )88b   888 .  888     888    .o d8(  888   888   888   888
o888o  o888o `Y8bod8P'     `8'     o888o o888o o888o 8""888P'   "888" d888b    `Y8bod8P' `Y888""8o o888o o888o o888o


Project: RevInstream
Version: 1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevInstream = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDisclose, window.AnyGrid);

}( window, function factory(window, revUtils, revDetect, revApi, revDisclose, AnyGrid) {
'use strict';

    var RevInstream = function(opts) {

        var defaults = {
            impression_tracker: [],
            api_source: 'instr',
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
            rows: 1,
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 2,
                xl: 2,
                xxl: 2
            },
            is_resize_bound: true,
            image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            internal: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/',
            headline_size: 3,
            max_headline: false,
            min_headline_height: 17,
            text_overlay: false,
            text_right: false,
            text_right_height: 100,
            transition_duration: 0,
            multipliers: {
                line_height: 0,
                margin: 0,
                padding: 0
            },
            disclosure_text: revDisclose.defaultDisclosureText,
            hide_provider: false,
            hide_header: false,
            hide_footer: false,
            beacons: true,
            overlay_icons: false, // pass in custom icons or overrides
            image_overlay: false, // pass key value object { content_type: icon }
            image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: false, // pass key value object { content_type: icon }
            ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
            query_params: false,
            register_views: true, // manage views or false to let someone else do it
            lazy_load_images: true,
            lazy_load_images_buffer: 500, // top buffer in pixels
            user_ip: false,
            user_agent: false,
            css: '',
            register_impressions: true,
            visible_rows: false,
            column_spans: false,
            stacked: false,
            link_button: false,
            link_button_text: 'Visit Site',
            window_width_devices: [
                'phone'
            ],
            developer: false
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
        revUtils.docReady(function() {
            that.init();
        });
    };

    RevInstream.prototype.init = function() {
        var that = this;

        this.emitter = new EventEmitter();

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-instream', this.options.css);

        this.data = [];
        this.displayedItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-instream';

        this.innerContainerElement = document.createElement('div');
        this.innerContainerElement.id = 'rev-instream-container';

        this.innerElement = document.createElement('div');
        this.innerElement.id = 'rev-instream-inner';

        this.gridTransitionContainer = document.createElement('div');
        this.gridTransitionContainer.id = 'rev-instream-grid-transition-container';

        this.gridTransitionElement = document.createElement('div');
        this.gridTransitionElement.id = 'rev-instream-grid-transition';

        this.gridContainerElement = document.createElement('div');
        this.gridContainerElement.id = 'rev-instream-grid-container';

        var gridElement = document.createElement('div');
        gridElement.id = 'rev-instream-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';

        this.windowWidth();

        revUtils.append(this.containerElement, this.innerContainerElement);

        revUtils.append(this.innerContainerElement, this.innerElement);

        revUtils.append(this.innerElement, this.gridTransitionContainer);

        revUtils.append(this.gridTransitionContainer, this.gridTransitionElement);

        revUtils.append(this.gridTransitionElement, this.gridContainerElement);

        revUtils.append(this.gridContainerElement, gridElement);

        revUtils.append(this.element, this.containerElement);

        this.setMultipliers();

        this.appendElements();

        revUtils.dispatchScrollbarResizeEvent();

        this.grid = new AnyGrid(gridElement, this.gridOptions());

        this.setGridClasses();

        this.createCells(this.grid);

        this.getPadding();

        this.setContentPadding(this.grid);

        this.setUp();

        this.setSize(this.grid);

        this.grid.layout();

        this.setUp();

        this.setSize(this.grid);

        this.grid.layout();

        this.grid.on('resize', function() {
            that.resize();
        });

        this.getData();

        // custom icons passed? merge with default
        if (this.options.overlay_icons !== false) {
            revUtils.mergeOverlayIcons(this.options.overlay_icons);
        }

        // manage views
        if (this.options.register_views) { // some widgets might need to do this on their own
            that.registerViewOnceVisible();
            that.attachVisibleListener();
            revUtils.checkVisible.bind(this, this.containerElement, this.visible)();
        }

        if (this.options.lazy_load_images) {
            that.loadImagesOnceNear();
            that.attachNearListener();
            var that = this;
            this.emitter.on('ready', function() {
                revUtils.checkVisible.bind(that, that.containerElement, that.near, false, that.options.lazy_load_images_buffer)();
            });
        }
    };

    RevInstream.prototype.windowWidth = function() {

        if (this.options.window_width_devices && revDetect.show(this.options.window_width_devices)) {
            this.windowWidthEnabled = true;

            var that = this;

            revUtils.addEventListener(window, 'resize', function() {
                setElementWindowWidth();
            });

            var setElementWindowWidth = function() {
                revUtils.transformCss(that.element, 'none');
                that.element.style.width = document.body.offsetWidth + 'px';
                revUtils.transformCss(that.element, 'translateX(-' + that.element.getBoundingClientRect().left + 'px)');
            };

            setElementWindowWidth();
        }
    };

    RevInstream.prototype.setGridClasses = function() {
        revUtils.addClass(this.containerElement, 'rev-instream-device-' + revDetect.device());

        if (this.windowWidthEnabled) {
            revUtils.addClass(this.containerElement, 'rev-instream-window-width');
        }

        revUtils.removeClass(this.containerElement, 'rev-instream-breakpoint', true);
        revUtils.addClass(this.containerElement, 'rev-instream-breakpoint-' + this.grid.getBreakPoint());

        var greaterLessThanBreakPoints = this.grid.getGreaterLessThanBreakPoints();
        for (var i = 0; i < greaterLessThanBreakPoints.gt.length; i++) {
            revUtils.addClass(this.containerElement, 'rev-instream-breakpoint-gt-' + greaterLessThanBreakPoints.gt[i]);
        }
        for (var i = 0; i < greaterLessThanBreakPoints.lt.length; i++) {
            revUtils.addClass(this.containerElement, 'rev-instream-breakpoint-lt-' + greaterLessThanBreakPoints.lt[i]);
        }

        revUtils.removeClass(this.containerElement, 'rev-instream-col', true);
        revUtils.removeClass(this.containerElement, 'rev-instream-row', true);
        revUtils.addClass(this.containerElement, 'rev-instream-col-' + (typeof this.options.per_row === 'object' ? this.options.per_row[this.grid.getBreakPoint()] : this.options.per_row));
        revUtils.addClass(this.containerElement, 'rev-instream-row-' + (typeof this.options.rows === 'object' ? this.options.rows[this.grid.getBreakPoint()] : this.options.rows));
    };

    RevInstream.prototype.registerViewOnceVisible = function() {
        var that = this;
        this.emitter.once('visible', function() {
            revUtils.removeEventListener(window, 'scroll', that.visibleListener);
            that.registerView();
        });
    };

    RevInstream.prototype.loadImagesOnceNear = function() {
        var that = this;
        this.emitter.once('near', function() {
            revUtils.removeEventListener(window, 'scroll', that.nearListener);
            that.loadImages();
        });
    };

    RevInstream.prototype.loadImages = function() {
        var that = this;
        this.dataPromise.then(function() {
            for (var i = 0; i < that.displayedItems.length; i++) {
                var item = that.grid.items[i],
                    data = that.displayedItems[i];

                var image = data.image.replace('h=315', 'h=' + item.preloaderHeight).replace('w=420', 'w=' + item.preloaderWidth) + '&h=' + item.preloaderHeight + '&w=' + item.preloaderWidth;
                item.element.querySelector('img').setAttribute('src', image);
            }
            revUtils.addClass(that.containerElement, 'rev-instream-has-image');
        })
    };

    RevInstream.prototype.visible = function() {
        this.emitter.emitEvent('visible');
    };

    RevInstream.prototype.near = function() {
        this.emitter.emitEvent('near');
    };

    RevInstream.prototype.attachVisibleListener = function() {
        this.visibleListener = revUtils.checkVisible.bind(this, this.containerElement, this.visible);
        revUtils.addEventListener(window, 'scroll', this.visibleListener);
    };

    RevInstream.prototype.attachNearListener = function() {
        this.nearListener = revUtils.checkVisible.bind(this, this.containerElement, this.near, false, this.options.lazy_load_images_buffer);
        revUtils.addEventListener(window, 'scroll', this.nearListener);
    };

    RevInstream.prototype.createCells = function(grid) {
        var i = 0; // just in case
        this.limit = 0;
        while (grid.nextRow < grid.rowCount && i < 100) {
            var cell = this.createNewCell();
            grid.element.appendChild(cell);
            grid.appended([cell]);
            this.limit++;
            i++;
        }
    };

    RevInstream.prototype.getPadding = function(resetInline) {
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

    RevInstream.prototype.setContentPadding = function(grid) {
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

    RevInstream.prototype.setMultipliers = function() {
        this.lineHeightMultiplier = Math.round( (.06256 + Number((this.options.multipliers.line_height * .01).toFixed(2))) * 10000 ) / 10000;
        this.marginMultiplier = Math.round( (.05 + Number((this.options.multipliers.margin * .01).toFixed(2))) * 1000 ) / 1000;
        this.paddingMultiplier = Math.round( (.01 + Number((this.options.multipliers.padding * .01).toFixed(2))) * 1000 ) / 1000;
    };

    RevInstream.prototype.gridOptions = function() {
        return {
            isInitLayout: false,
            masonry: false,
            perRow: this.options.per_row,
            transitionDuration: this.options.transition_duration,
            isResizeBound: this.options.is_resize_bound,
            adjustGutter: true,
            breakpoints: this.options.breakpoints,
            column_spans: this.options.column_spans,
            rows: this.options.rows,
            stacked: this.options.stacked,
            removeVerticalGutters: true
        };
    };

    RevInstream.prototype.setUp = function(item) {
        this.headlineMaxHeights = {};

        var that = this;
        var setUp = function(item) {

            var index = revUtils.siblingIndex(item.element);

            var row = Math.floor( index / that.grid.perRow );

            that.setImageSize(item); // TODO: multiple image ratios

            that.setTextRight(item);

            that.setTextOverlay(item);

            that.setItemClasses(item);

            that.setInnerMargin(item);

            that.setPreloaderHeight(item);

            that.setProviderLineHeight(item);
            that.setProviderFontSize(item);
            that.setProviderMarginTop(item);

            // headline calculation based on text_right_height or grid columnWidth and lineHeightMultiplier
            that.setHeadlineLineHeight(item);
            that.setHeadlineFontSize(item);
            that.setHeadlineMarginTop(item);
            that.setHeadlineMaxHeight(item.element, item.span, row, index, item.stacked, item);
        };

        for (var i = 0; i < this.grid.items.length; i++) {
            setUp(this.grid.items[i]);
        }
    };

    RevInstream.prototype.setSize = function(grid, item) {
        var that = this;

        var setSize = function(item) {
            that.resizeImage(item.element.querySelector('.rev-image'), item);
            that.resizeHeadline(item.element.querySelector('.rev-headline'), item.row, item.index, item);
            that.resizeProvider(item.element.querySelector('.rev-provider'), item);
            that.resizeHeadlineBrand(item);
        };

        if (item) { // if ad is passed do that one
            setSize(item);
        } else { // otherwise do them all
            for (var i = 0; i < grid.items.length; i++) {
                setSize(grid.items[i]);
            }
        }
    };

    RevInstream.prototype.getTextRightHeight = function() {
        return this.options.text_right_height[this.grid.getBreakPoint()] ? this.options.text_right_height[this.grid.getBreakPoint()] : this.options.text_right_height;
    };

    RevInstream.prototype.setImageSize = function(item) {
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

        setImageSize(revUtils.isArray(this.options.image_ratio) ? (revDetect.mobile() ? 'wide_rectangle' : 'rectangle') : this.options.image_ratio);

        if (revUtils.isArray(this.options.image_ratio)) {
            for (var i = 0; i < this.options.image_ratio.length; i++) {
                if ((!this.options.image_ratio[i].media || window.matchMedia(this.options.image_ratio[i].media).matches)
                    && (!this.options.image_ratio[i].selector || matchesSelector(item.element, this.options.image_ratio[i].selector))) {
                    setImageSize(this.options.image_ratio[i].ratio);
                }
            }
        }
    };

    RevInstream.prototype.setPreloaderHeight = function(item) {
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

    RevInstream.prototype.setTextRight = function(item) {
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

    RevInstream.prototype.setTextOverlay = function(item) {
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

    RevInstream.prototype.setItemClasses = function(item) {
        if (this.options.link_button) {
            revUtils.removeClass(item.element, 'rev-has-link-button');
            revUtils.addClass(item.element, 'rev-has-link-button');
        }

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

        revUtils.removeClass(item.element, 'rev-row', true);
        revUtils.addClass(item.element, 'rev-row-' + (item.row + 1));
    };

    RevInstream.prototype.setInnerMargin = function(item) {
        var computedInnerMargin = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-headline'), 'margin-left'));

        if (computedInnerMargin > -1) {
            item.innerMargin = computedInnerMargin;
            return;
        }

        var adInner = item.element.querySelector('.rev-ad-inner');
        item.innerMargin = Math.round(Math.max(0, ((adInner.offsetWidth * this.paddingMultiplier).toFixed(2) / 1)));
    };

    RevInstream.prototype.setProviderLineHeight = function(item) {
        var computedLineHeight = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-provider'), 'line-height'));

        if (computedLineHeight) {
            item.providerLineHeight = computedLineHeight;
            return;
        }

        item.providerLineHeight = 16;
    };

    RevInstream.prototype.setProviderFontSize = function(item) {
        var computedFontSize = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-provider'), 'font-size'));

        if (computedFontSize) {
            item.providerFontSize = computedFontSize;
            return;
        }

        item.providerFontSize = Math.round((item.providerLineHeight * .7).toFixed(2) / 1);
    };

    RevInstream.prototype.setProviderMarginTop = function(item) {
        var computedMarginTop = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-provider'), 'margin-top'));

        if (computedMarginTop > -1) {
            item.providerMarginTop = computedMarginTop;
            return;
        }

        item.providerMarginTop = 2;
    };

    RevInstream.prototype.setHeadlineLineHeight = function(item) {
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

    RevInstream.prototype.setHeadlineFontSize = function(item) {
        var computedFontSize = parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-headline h3'), 'font-size'));

        if (computedFontSize) {
            item.headlineFontSize = computedFontSize;
            return;
        }

        item.headlineFontSize = (item.headlineLineHeight * .8).toFixed(2) / 1;
    };

    RevInstream.prototype.setHeadlineMarginTop = function(item) {
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

    RevInstream.prototype.setHeadlineMaxHeight = function(element, colSpan, row, index, stacked, item) {
        var maxHeight = 0;

        if (!this.headlineMaxHeights[row]) {
            this.headlineMaxHeights[row] = {};
        }

        if (!this.headlineMaxHeights[row][colSpan]) {
            this.headlineMaxHeights[row][colSpan] = {};
        }

        if (item.textRight) { // based on preloaderHeight/ ad height
            var verticalSpace = item.preloaderHeight - item.providerLineHeight;
            var headlines = Math.floor(verticalSpace / item.headlineLineHeight);
            maxHeight = headlines * item.headlineLineHeight;
            this.headlineMaxHeights[row][colSpan][index] = { maxHeight: maxHeight };
        } else {
            maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, ((item.headlineLineHeight * this.options.headline_size).toFixed(2) / 1));
            this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
        }
    };

    RevInstream.prototype.appendElements = function() {
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

    RevInstream.prototype.resize = function() {
        while (this.grid.element.firstChild) {
            this.grid.element.removeChild(this.grid.element.firstChild);
        }

        this.grid.reloadItems();

        this.setGridClasses();

        this.createCells(this.grid);

        this.getPadding(true);

        this.setContentPadding(this.grid);

        this.setUp();

        this.setSize(this.grid);

        this.grid.layout();

        this.setUp();

        this.updateDisplayedItems(true);

        if (this.options.lazy_load_images) {
            this.loadImages();
        }

        this.emitter.emitEvent('resized');
    };

    RevInstream.prototype.resizeImage = function(el, item) {
        el.style.height = item.preloaderHeight + 'px';
        el.style.width = item.textRight === false || typeof item.preloaderWidth === false ? 'auto' : item.preloaderWidth + 'px';
    };

    RevInstream.prototype.resizeHeadline = function(el, row, index, item) {
        if (!this.options.max_headline) {
            el.style.maxHeight = this.headlineMaxHeights[row][item.span].maxHeight + 'px';
        }
        el.style.margin = item.headlineMarginTop +'px ' + item.innerMargin + 'px 0';
        el.firstChild.style.fontSize = item.headlineFontSize + 'px';
        el.firstChild.style.lineHeight = item.headlineLineHeight + 'px';

        if (this.displayedItems.length) {
            el.style.height = 'auto';
        } else {
            el.style.height = (item.headlineLineHeight * 2) + 'px';
        }
    };

    RevInstream.prototype.resizeProvider = function(el, item) {
        if(this.options.hide_provider) {
            return;
        }
        el.style.margin = item.providerMarginTop + 'px ' + item.innerMargin + 'px 0';
        el.style.fontSize = item.providerFontSize + 'px';
        el.style.lineHeight = item.providerLineHeight + 'px';
        el.style.height = item.providerLineHeight + 'px';

        if (this.options.link_button) {
            var linkButton = item.element.querySelector('.rev-link-button');
            linkButton.style.lineHeight = item.providerLineHeight + 'px';
            linkButton.style.height = item.providerLineHeight + 'px';
        }
    };

    RevInstream.prototype.resizeHeadlineBrand = function(item) {
        if (this.displayedItems.length) {
            var rowItems = this.grid.rows[item.row].items;
            var maxHeight = 0;

            for (var i = 0; i < rowItems.length; i++) {
                var headlineBrand = rowItems[i].element.querySelector('.rev-headline-brand');
                headlineBrand.style.height = 'auto';
                var height = headlineBrand.offsetHeight;
                if (height > maxHeight) {
                    maxHeight = height;
                }
            }

            for (var i = 0; i < rowItems.length; i++) {
                rowItems[i].element.querySelector('.rev-headline-brand').style.height = maxHeight + 'px';
            }
        }
    }

    RevInstream.prototype.checkEllipsis = function(reset) {
        if (this.options.max_headline && !this.options.text_right) { // text_right should be limited, but don't waste for max_headline only
            return;
        }
        // reset headlines
        if (reset) {
            var ads = this.grid.element.querySelectorAll('.rev-ad');
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];

                if (this.displayedItems[i]) { // reset headlines for new ellipsis check
                    ad.querySelectorAll('.rev-headline h3')[0].innerHTML = this.displayedItems[i].headline;
                }
            }
        }

        revUtils.ellipsisText(this.grid.element.querySelectorAll('.rev-content .rev-headline'));
    };

    RevInstream.prototype.createNewCell = function() {
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
                                (this.options.link_button ? '<div class="rev-link-button">'+ this.options.link_button_text +'</div>' : '') +
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

    RevInstream.prototype.getSerializedQueryParams = function() {
         if (!this.serializedQueryParams) {
            var serialized = revUtils.serialize(this.options.query_params);
            this.serializedQueryParams = serialized ? '&' + serialized : '';
         }
         return this.serializedQueryParams;
    };

    RevInstream.prototype.generateUrl = function(offset, count, empty, viewed) {
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

    RevInstream.prototype.getData = function() {
        if (this.dataPromise) {
            return this.dataPromise;
        }

        var that = this;

        this.dataPromise = new Promise(function(resolve, reject) {
            // prime data - empty and not viewed
            // TODO: determin if in view
            var url = that.generateUrl(0, that.limit, false, false);

            revApi.request(url, function(resp) {
                if (!resp.length) {
                    resolve(resp);
                    return;
                }

                that.data = resp;

                revUtils.addClass(that.containerElement, 'rev-instream-has-data');

                that.updateDisplayedItems();
                revApi.beacons.setPluginSource(that.options.api_source).attach();

                if (that.options.lazy_load_images === false) {
                    revUtils.addClass(that.containerElement, 'rev-instream-has-image');
                }

                that.emitter.emitEvent('ready');
                that.ready = true;

                resolve(resp);
            });
        });
    };

    RevInstream.prototype.registerView = function() {
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
                var anchors = that.grid.element.querySelectorAll('.rev-ad a');
                for (var i = 0; i < anchors.length; i++) {
                    anchors[i].setAttribute('href', anchors[i].getAttribute('href') + '&viewed=true');
                }
            });
        }
    };

    RevInstream.prototype.setDisplayedItems = function() {
        this.displayedItems = [];

        if (!this.data.length) { // if no data remove the container and call it a day
            return;
        }

        var dataIndex = 0;

        for (var i = 0; i < this.limit; i++) {
            if (!this.data[dataIndex]) { // go back to the beginning if there are more ads than data
                dataIndex = 0;
            }
            this.displayedItems.push(this.data[dataIndex]);
            dataIndex++;
        }
    };

    RevInstream.prototype.updateDisplayedItems = function(resized) {
        this.setDisplayedItems();

        if (!this.displayedItems.length) { // if no data remove the container and call it a day
            this.destroy();
            return;
        }

        for (var i = 0; i < this.displayedItems.length; i++) {
            var item = this.grid.items[i],
                data = this.displayedItems[i];

            if (this.options.image_overlay !== false) {
                revUtils.imageOverlay(item.element.querySelector('.rev-image'), data.content_type, this.options.image_overlay, this.options.image_overlay_position);
            }

            if (this.options.ad_overlay !== false) {
                revUtils.adOverlay(item.element.querySelector('.rev-ad-inner'), data.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
            }

            var anchor = item.element.querySelector('a');
            anchor.setAttribute('href', data.url + (this.viewed ? '&viewed=true' : ''));
            anchor.title = data.headline;

            if (this.options.lazy_load_images === false) {
                var image = data.image.replace('h=315', 'h=' + item.preloaderHeight).replace('w=420', 'w=' + item.preloaderWidth) + '&h=' + item.preloaderHeight + '&w=' + item.preloaderWidth;
                item.element.querySelector('img').setAttribute('src', image);
            }

            var headline = item.element.querySelector('.rev-headline h3');
            headline.innerHTML = data.headline;

            item.element.querySelector('.rev-provider').innerHTML = data.brand;

            // make sure the text-decoration is the same as the headline
            anchor.style.color = revUtils.getComputedStyle(headline, 'color');

            this.setSize(this.grid, item);
        }

        this.grid.layout();

        this.checkEllipsis(resized);
    };

    RevInstream.prototype.destroy = function() {
        this.grid.remove();
        this.grid.destroy();
        revUtils.remove(this.containerElement);
        if (this.mc) {
            this.mc.set({enable: false});
            this.mc.destroy();
        }
    };

    return RevInstream;
}));