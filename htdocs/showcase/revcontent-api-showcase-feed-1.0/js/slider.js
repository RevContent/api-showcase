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
            item_breakpoints: {
                xxs: 200,
                xs: 275,
                sm: 350,
                md: 425,
                lg: 500,
                xl: 575,
                xxl: 650,
            },
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
            disclosure_text: 'by Revcontent',
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
            header_logo: false,
            window_width_enabled: false
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

        // this.nextGridTransitionElement = this.gridTransitionElement.cloneNode(true);
        // this.nextGridTransitionElement.id = 'rev-slider-next-grid-transition';

        // this.nextGridElement = this.nextGridTransitionElement.children[0].children[0];
        // this.nextGridElement = this.nextGridTransitionElement.querySelector('#rev-slider-grid');

        // revUtils.append(this.gridTransitionContainer, this.nextGridTransitionElement);

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
            if (that.options.beacons) {
                revApi.beacons.setPluginSource(that.options.api_source).attach();
            }
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
            // '<span class="rev-icon">' +
            //     '<?xml version="1.0" ?><svg enable-background="new 0 0 32 32" height="32px" id="svg2" version="1.1" viewBox="0 0 32 32" width="32px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg"><g id="background"><rect fill="none" height="32" width="32"/></g><g id="arrow_x5F_full_x5F_upperright"><polygon points="28,24 22,18 12,28 4,20 14,10 8,4 28,4  "/></g></svg>' +
            // '</span>' +
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

        if (this.options.window_width_enabled) {
            revUtils.addClass(this.containerElement, 'rev-slider-window-width');
        }

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

            if (items[0].element.matches(this.options.meta_selector)) {
                var meta = document.createElement('div');
                revUtils.addClass(meta, 'rev-meta');

                items[0].meta = true;

                // meta
                meta.innerHTML = '<div class="rev-meta-inner">' +
                                    '<div style="overflow: hidden; ">' +
                                        '<div class="rev-provider"></div>' +
                                        '<div class="rev-date"></div>' +
                                    '</div>' +
                                '</div>';

                items[0].element.querySelector('.rev-before-image').appendChild(meta);

                // items[0].element.querySelector('.rev-meta-inner').insertAdjacentHTML('beforeend', '<div>test</div>');

                // if (this.options.headline_icon_selector && items[0].element.matches(this.options.headline_icon_selector)) {
                meta.querySelector('.rev-meta-inner').insertAdjacentHTML('afterbegin', '<div class="rev-headline-icon-container"><div class="rev-headline-icon"></div></div>');
            }

            if (this.options.internal_selector && items[0].element.matches(this.options.internal_selector)) {
                items[0].type = 'internal';
                internalLimit++;
                // }

                var description = '<div class="rev-description">' +
                                    '<h4></h4>' +
                                '</div>';

                items[0].element.querySelector('.rev-headline-brand-inner').insertAdjacentHTML('beforeend', description);
            } else {
                if (!items[0].meta) {
                    items[0].element.querySelector('.rev-headline-brand-inner').insertAdjacentHTML('beforeend', '<div class="rev-provider"></div>');    
                }

                items[0].type = 'sponsored';
                sponsoredLimit++;
            }

            if (items[0].element.matches(this.options.reactions_selector)) {

                // console.log(items[0].type);

                // reactions
                var like = '<div class="rev-reaction rev-reaction-like"><div class="rev-reaction-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M1271 474c415,0 773,246 935,601 162,-354 519,-601 935,-601 472,0 870,319 990,753l0 0c161,332 110,1036 -543,1785 -507,582 -1115,974 -1362,1120l0 23 -20 -12 -20 12 0 -23c-247,-146 -855,-539 -1362,-1120 -653,-749 -704,-1453 -543,-1785l0 0c120,-434 518,-753 990,-753z"/></g></svg></div></div>';

                var comment = '<div class="rev-reaction rev-reaction-comment"><div class="rev-reaction-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg enable-background="new 0 0 24 24" id="Layer_1" version="1.1" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path class="fil0" clip-rule="evenodd" d="M10.718,18.561l6.78,5.311C17.609,23.957,17.677,24,17.743,24  c0.188,0,0.244-0.127,0.244-0.338v-5.023c0-0.355,0.233-0.637,0.548-0.637L21,18c2.219,0,3-1.094,3-2s0-13,0-14s-0.748-2-3.014-2  H2.989C0.802,0,0,0.969,0,2s0,13.031,0,14s0.828,2,3,2h6C9,18,10.255,18.035,10.718,18.561z" fill-rule="evenodd"/></svg></div></div>';

                var share = '<div class="rev-reaction rev-reaction-share"><div class="rev-reaction-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg id="Livello_1" style="enable-background:new 0 0 50 50;" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path class="fil0" d="M341.928,459.383c-0.113-0.346-0.402-0.61-0.76-0.693l-12.822-2.878l-6.707-11.301c-0.364-0.617-1.425-0.612-1.788,0  l-6.7,11.305l-12.82,2.884c-0.355,0.078-0.646,0.343-0.763,0.694c-0.112,0.349-0.032,0.736,0.208,1.006l8.682,9.865l-1.219,13.09  c-0.033,0.365,0.131,0.726,0.423,0.932c0.179,0.132,0.391,0.202,0.613,0.202c0.144,0,0.283-0.029,0.411-0.085l12.066-5.208  l12.068,5.202c0.333,0.146,0.736,0.099,1.023-0.113c0.295-0.214,0.457-0.573,0.424-0.938l-1.223-13.086l8.676-9.872  C341.963,460.114,342.041,459.729,341.928,459.383z M327.678,475.8l-6.734-2.902c-0.123-0.054-0.264-0.054-0.387,0l-6.729,2.905  l0.68-7.302c0.013-0.134-0.031-0.266-0.12-0.367l-4.842-5.502l7.152-1.608c0.131-0.03,0.244-0.113,0.312-0.229l3.738-6.306  l3.74,6.304c0.068,0.116,0.182,0.198,0.313,0.229l7.152,1.604l-4.84,5.506c-0.089,0.102-0.132,0.233-0.12,0.368L327.678,475.8z"/><path d="M489.378,472.354c-0.184-0.263-0.483-0.369-0.872-0.417l-0.225,0.016c-0.347,0.024-0.693,0.05-1.046,0.05  c-10.438,0-18.931-8.492-18.931-18.931c0-2.634,0.542-5.197,1.609-7.621c0.139-0.312,0.103-0.68-0.094-0.962  c-0.182-0.26-0.476-0.416-0.858-0.416c-0.003,0-0.007,0-0.011,0c-10.932,0.729-19.494,9.876-19.494,20.826  c0,11.522,9.374,20.896,20.896,20.896c8.271,0,15.776-4.899,19.119-12.481C489.609,473.002,489.573,472.634,489.378,472.354z   M479.384,476.735c-2.59,1.979-5.762,3.06-9.03,3.06c-8.214,0-14.896-6.683-14.896-14.896c0-5.064,2.605-9.778,6.857-12.513  c-0.007,0.228-0.01,0.456-0.01,0.686C462.305,463.776,469.281,473.374,479.384,476.735z"/><path d="M557.998,461.126c-3.972-7.729-13.083-17.287-13.175-17.384c-0.093-0.097-0.221-0.152-0.356-0.154c-0.003,0-0.005,0-0.008,0  c-0.004,0-0.006,0-0.01,0c-0.003,0-0.005,0-0.008,0c-0.136,0.002-0.264,0.058-0.356,0.154c-0.092,0.097-9.203,9.654-13.193,17.418  c-1.506,2.425-2.312,5.233-2.312,8.087c0,8.573,7.12,15.604,15.871,15.673c8.759-0.068,15.879-7.1,15.879-15.673  C560.329,466.394,559.522,463.585,557.998,461.126z M546.153,478.451c-1.902,0-3.695-0.551-5.185-1.594  c-0.189-0.132-0.263-0.377-0.178-0.593c0.085-0.215,0.308-0.339,0.535-0.312c0.516,0.073,0.977,0.108,1.41,0.108  c4.922,0,8.927-3.526,8.927-7.86c0-0.479-0.055-0.977-0.163-1.479c-0.046-0.216,0.055-0.437,0.247-0.543s0.432-0.074,0.592,0.079  c1.38,1.347,2.14,3.081,2.14,4.883C554.479,475.172,550.744,478.451,546.153,478.451z"/><path d="M710.062,520.14h-29.015c-0.233,0-0.422,0.188-0.422,0.422v37.303c0,0.232,0.188,0.421,0.422,0.421h29.015  c0.231,0,0.42-0.188,0.42-0.421v-37.303C710.481,520.328,710.293,520.14,710.062,520.14z M695.554,556.459  c-1.124,0-2.034-0.911-2.034-2.034s0.91-2.035,2.034-2.035s2.034,0.912,2.034,2.035S696.678,556.459,695.554,556.459z   M707.322,549.676c0,0.224-0.181,0.404-0.405,0.404h-22.728c-0.225,0-0.406-0.181-0.406-0.404v-25.932  c0-0.225,0.182-0.404,0.406-0.404h22.728c0.225,0,0.405,0.18,0.405,0.404V549.676z"/><g><path d="M782.984,559.927h-4.75l-1.61-5.653c0-0.234-0.189-0.425-0.425-0.425h-12.61c-0.235,0-0.424,0.19-0.424,0.425l-1.611,5.653   h-4.75c-0.235,0-0.425,0.19-0.425,0.424v1.188h27.03v-1.188C783.409,560.117,783.22,559.927,782.984,559.927z"/><path d="M793.289,518.736H746.5c-0.235,0-0.425,0.189-0.425,0.426v32.511c0,0.234,0.189,0.426,0.425,0.426h46.789   c0.234,0,0.425-0.191,0.425-0.426v-32.511C793.714,518.926,793.523,518.736,793.289,518.736z M769.895,550.23   c-1.053,0-1.906-0.853-1.906-1.905s0.854-1.907,1.906-1.907s1.906,0.854,1.906,1.907S770.947,550.23,769.895,550.23z    M790.019,544.404h-40.246v-22.772h40.246V544.404z"/></g><path d="M258.563,70.629h-45.947c-0.276,0-0.5,0.224-0.5,0.5v28.14c0,0.276,0.224,0.5,0.5,0.5h9.589l-0.001,7.894  c0.095,0.098,0.224,0.152,0.359,0.152s0.265-0.055,0.359-0.152l15.31-7.894h20.331c0.276,0,0.5-0.224,0.5-0.5v-28.14  C259.063,70.853,258.84,70.629,258.563,70.629z M226.798,99.63l0.031-5.559c-0.095-0.097-0.224-0.151-0.359-0.151h-8.504V76.479  h35.249V93.92h-15.247c-0.136,0-0.265,0.055-0.359,0.151L226.798,99.63z"/><g><path d="M626.614,166.73l5.318-17.658c0.042-0.139,0.016-0.289-0.071-0.406c-0.087-0.116-0.223-0.186-0.368-0.186h-31.849   l-1.124-4.828c-0.05-0.207-0.234-0.354-0.447-0.354h-8.769c-0.253,0-0.458,0.205-0.458,0.459v3.669   c0,0.253,0.205,0.459,0.458,0.459h5.49l5.866,26.171c0.049,0.209,0.234,0.355,0.447,0.355h27.915c0.254,0,0.459-0.206,0.459-0.459   v-3.67c0-0.254-0.205-0.459-0.459-0.459h-24.637l-0.421-2.766h22.209C626.378,167.059,626.556,166.925,626.614,166.73z"/><circle cx="603.469" cy="179.187" r="3.399"/><circle cx="625.624" cy="179.187" r="3.399"/></g><path d="M44.504,20.72L27.944,6.035c-0.142-0.117-0.352-0.153-0.535-0.089  c-0.184,0.061-0.303,0.208-0.303,0.372l0.025,6.986c-8.369,0.13-21.768,7.379-21.768,30.324c0,0.229,0.166,0.422,0.394,0.454  c0.021,0.003,0.044,0.005,0.064,0.005c0.202,0,0.383-0.131,0.442-0.328C9.269,33.696,19.763,28.725,25.79,28.725  c0.568,0,1.026,0.015,1.342,0.025l-0.025,7.066c0,0.164,0.12,0.312,0.303,0.373c0.187,0.062,0.396,0.027,0.535-0.09l16.562-14.735  C44.681,21.186,44.681,20.898,44.504,20.72z" style="fill:#010202;"/></svg></div></div>';                

                var dislike = '<div class="rev-reaction rev-reaction-dislike"><div class="rev-reaction-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M1335 709l0 0c5,0 10,0 15,0l0 0c5,0 10,0 15,0l0 0c5,0 10,0 15,1l0 0c5,0 10,1 15,1 308,23 569,215 690,485 121,-269 382,-462 690,-485 5,0 10,-1 15,-1l0 0c5,0 10,-1 15,-1l0 0c5,0 10,0 15,0l0 0c5,0 10,0 15,0l0 0c7,0 14,0 21,0l0 0c7,0 14,0 21,1l0 0c7,0 14,1 21,1 60,5 118,15 173,32l-2087 2087c-471,-589 -477,-1224 -476,-1292l0 -6c0,-434 335,-789 760,-821 7,-1 14,-1 21,-1l0 0c7,0 14,-1 21,-1l0 0c7,0 14,0 21,0zm911 1057l-637 637 -616 616 -451 451 256 256 451 -451 616 -616 637 -637 1067 -1067 451 -451 -256 -256 -451 451 -1067 1067zm1322 -616c60,114 94,244 94,382l0 6c1,74 -5,810 -600,1434 -421,443 -746,614 -913,679l0 2 -126 0 0 -2c-121,-47 -324,-150 -587,-371l2131 -2131z"/></g></svg></div></div>';
                dislike = '';

                var reactionsContainer = document.createElement('div');

                if (items[0].type === 'internal') {
                    var html = like + comment + share;
                } else {
                    var html = like;
                }

                reactionsContainer.innerHTML = '<div class="rev-reaction-bar">' + html + '</div>';
                revUtils.addClass(reactionsContainer, 'rev-reactions');
                items[0].element.querySelector('.rev-content-inner').appendChild(reactionsContainer);

                var reactions = items[0].element.querySelectorAll('.rev-reaction');

                var random = function(max) {
                    return (Math.floor(Math.random() * (max - 30 + 1)) + 30).toLocaleString();
                }

                if (reactions[0]) {
                    reactions[0].insertAdjacentHTML('beforeend', '<div class="rev-reaction-count"><div class="rev-reaction-count-inner">Love</div></div>');    
                }

                if (reactions[1]) {
                    reactions[1].insertAdjacentHTML('beforeend', '<div class="rev-reaction-count"><div class="rev-reaction-count-inner">Comment</div></div>');
                }
                
                if (reactions[2]) {
                    reactions[2].insertAdjacentHTML('beforeend', '<div class="rev-reaction-count"><div class="rev-reaction-count-inner">Share</div></div>');
                }
                
                // reactions[3].insertAdjacentHTML('beforeend', '<div class="rev-reaction-count"><div class="rev-reaction-count-inner">'+ random(1800) +'</div></div>');
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
                var header = this.createHeader();
                items[0].element.querySelector('.rev-ad-container').insertAdjacentElement('afterbegin', header);
                // this.grid.element.appendChild(cell);

                // var headers = this.grid.addItems([cell]);
                // this.grid.layoutItems(headers, true);
                // this.grid.reveal(headers);

                // // var headers = this.grid.appended([cell]);
                // headers[0].type = 'header';
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

        // console.log(calculatedPadding);

        this.padding = {
            top: paddingTop ? false : calculatedPadding,
            right: paddingRight ? false : calculatedPadding,
            bottom: paddingBottom ? false : calculatedPadding,
            left: paddingLeft ? false : calculatedPadding,
        };
    };

    RevSlider.prototype.setContentPadding = function(items) {

        // console.log('hree', this.padding);
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
        this.paddingMultiplier = Math.round( (.02 + Number((this.options.multipliers.padding * .01).toFixed(2))) * 1000 ) / 1000;
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

            // that.setTextRight(item);

            // that.setTextOverlay(item);

            that.setItemClasses(item);

            // that.setInnerMargin(item);

            that.setPreloaderHeight(item);

            // that.setUpProvider(item);

            // headline calculation based on text_right_height or grid columnWidth and lineHeightMultiplier
            // that.setHeadlineLineHeight(item);
            // that.setHeadlineFontSize(item);
            // that.setHeadlineMarginTop(item);

            // that.setHeadlineMaxHeight(item.element, item.span, item.row, item.index, item.stacked, item);
            // if (item.type == 'internal') {
            //     that.setDescriptionLineHeight(item);
            //     that.setDescriptionFontSize(item);
            //     that.setDescriptionMarginTop(item);
            // }
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
                // this.resizeAfterImage(item);
                // this.resizeHeader(item);
                // this.resizeHeadline(item.element.querySelector('.rev-headline'), item.row, item.index, item);
                // if (item.type == 'internal') {
                //     this.resizeDescription(item.element.querySelector('.rev-description'), item.row, item.index, item);
                // }
                // this.resizeProvider(item.element.querySelector('.rev-provider'), item);
                // this.resizeReactions(item);
                // this.resizeComments(item);
                // this.resizeHeadlineIcon(item.element.querySelector('.rev-headline-icon-container'), item.row, item.index, item);
                // this.resizeHeadlineBrand(item);
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
            // var adInner = item.element.querySelector('.rev-ad-inner');
            // console.log();
            var rect = item.element.querySelector('.rev-image').getBoundingClientRect();
            var width = Number(Math.round((rect.width ? rect.width : (rect.right - rect.left)) + 'e2') + 'e-2');
            // console.log(width);

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

    RevSlider.prototype.getItemBreakpoint = function(item) {
        var width = item.element.offsetWidth;

        if (width >= this.options.item_breakpoints.xxl) { // 650
            return 'xxl';
        }else if (width >= this.options.item_breakpoints.xl) { // 575
            return 'xl';
        }else if (width >= this.options.item_breakpoints.lg) { // 500
            return 'lg';
        }else if (width >= this.options.item_breakpoints.md) { // 425
            return 'md';
        }else if (width >= this.options.item_breakpoints.sm) { // 350
            return 'sm';
        }else if (width >= this.options.item_breakpoints.xs) { // 275
            return 'xs';
        }else { // 200
            return 'xxs';
        }
    };

    RevSlider.prototype.getGreaterLessThanBreakPoints = function(breakpoint) {
        var breakpoints = [];
        var index = 0;
        var indexed = false;
        for (var key in this.options.item_breakpoints) {
            if (this.options.item_breakpoints.hasOwnProperty(key)) {
            breakpoints.push(key);
            if (breakpoint == key) {
                indexed = true;
            }
            if (!indexed) {
                index++;
            }
        }
      }

      return {
        gt: breakpoints.slice(0, index),
        lt: breakpoints.slice(index + 1)
      }
    };

    RevSlider.prototype.setItemClasses = function(item) {
        revUtils.removeClass(item.element, 'rev-text-right');

        var breakpoint = this.getItemBreakpoint(item);

        revUtils.removeClass(item.element, 'rev-content-', true);
        revUtils.addClass(item.element, 'rev-content-' + item.type);

        revUtils.addClass(item.element, 'rev-content-breakpoint-' + breakpoint);
        var greaterLessThanBreakPoints = this.getGreaterLessThanBreakPoints(breakpoint);
        for (var i = 0; i < greaterLessThanBreakPoints.gt.length; i++) {
            revUtils.addClass(item.element, 'rev-content-breakpoint-gt-' + greaterLessThanBreakPoints.gt[i]);
        }
        for (var i = 0; i < greaterLessThanBreakPoints.lt.length; i++) {
            revUtils.addClass(item.element, 'rev-content-breakpoint-lt-' + greaterLessThanBreakPoints.lt[i]);
        }

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
        var element = item.element.querySelector('.rev-after-image');
        element.removeAttribute('style');
        var computedInnerMargin = parseInt(revUtils.getComputedStyle(element, 'margin-left'));

        if (computedInnerMargin > -1) {
            item.innerMargin = computedInnerMargin;
            return;
        }

        var adInner = item.element.querySelector('.rev-ad-inner');
        item.innerMargin = Math.round(Math.max(0, ((adInner.offsetWidth * this.paddingMultiplier).toFixed(2) / 1)));

        if (item.innerMargin > 14) {
            item.innerMargin = 14;
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
        if (!provider) {
            return;
        }
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
                headLogo.style.backgroundRepeat = 'no-repeat';
                headLogo.style.float = 'left';
                headLogo.style.backgroundSize = 'contain';
            
                // headLogo.style.backgroundImage = 'url('+ this.logoURI +')';
                headLogo.style.backgroundImage = 'url(/app/resources/img/powr.png)';

                // headLogo.style.height = this.head.offsetHeight + 'px';
                headLogo.style.height = '28px';
                // headLogo.style.width = this.head.offsetHeight + 'px';
                headLogo.style.width = '28px';

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
        el.style.width = '100%';
        // el.style.width = typeof item.preloaderWidth === false ? 'auto' : item.preloaderWidth + 'px';
    };

    RevSlider.prototype.resizeHeadline = function(el, row, index, item) {
        // console.log(this.headlineMaxHeights, item.row, item.element);
        // el.style.maxHeight = (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) + 'px';
        // el.querySelector('h3').style.margin = item.headlineMarginTop +'px ' + item.innerMargin + 'px 0';
        el.querySelector('h3').style.marginTop = item.headlineMarginTop +'px';
        el.querySelector('h3').style.fontSize = item.headlineFontSize + 'px';
        el.querySelector('h3').style.lineHeight = item.headlineLineHeight + 'px';
    };

    RevSlider.prototype.resizeAfterImage = function(item) {
        item.element.querySelector('.rev-after-image').style.marginLeft = item.innerMargin + 'px';
        item.element.querySelector('.rev-after-image').style.marginRight = item.innerMargin + 'px';
        item.element.querySelector('.rev-after-image').style.marginBottom = item.innerMargin + 'px';

        var image = item.element.querySelector('.rev-image');

        // image.style.marginLeft = item.innerMargin + 'px';
        // image.style.marginRight = item.innerMargin + 'px';

        var meta = item.element.querySelector('.rev-meta');
        if (meta) {
            meta.style.marginLeft = item.innerMargin + 'px';
            meta.style.marginRight = item.innerMargin + 'px';
        }
        // item.element.querySelector('.rev-after-image').style.marginBottom = item.innerMargin + 'px';
    };


    RevSlider.prototype.resizeHeader = function(item) {
        var header = item.element.querySelector('.rev-content-header');
        if (header) {
            header.style.marginLeft = item.innerMargin + 'px';
            header.style.marginRight = item.innerMargin + 'px';
        }
        // item.element.querySelector('.rev-after-image').style.marginBottom = item.innerMargin + 'px';
    };

    RevSlider.prototype.resizeDescription = function(el, row, index, item) {
        if (!el) {
            return;
        }
        // el.style.maxHeight = (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) + 'px';
        // el.querySelector('h4').style.margin = item.descriptionMarginTop +'px ' + item.innerMargin + 'px 0';
        el.querySelector('h4').style.marginTop = item.descriptionMarginTop +'px';
        el.querySelector('h4').style.fontSize = item.descriptionFontSize + 'px';
        el.querySelector('h4').style.lineHeight = item.descriptionLineHeight + 'px';
    };

    RevSlider.prototype.resizeHeadlineIcon = function(el, row, index, item) {
        if (!el) {
            return;
        }

        // console.log(item.element.querySelector('.rev-meta-inner'));
        var height = item.element.querySelector('.rev-meta-inner').offsetHeight;

        el.style.height = height + 'px';
        el.style.width = height + 'px';
    };

    RevSlider.prototype.resizeProvider = function(el, item) {
        if(this.options.hide_provider || !el) {
            return;
        }
        // console.log(this.providerMarginTop + 'px ' + item.innerMargin + 'px 0', item.innerMargin);
        el.style.marginTop = item.providerMarginTop + 'px';
        el.style.fontSize = item.providerFontSize + 'px';
        el.style.lineHeight = item.providerLineHeight + 'px';
        el.style.height = item.providerLineHeight + 'px';
        el.style.position = 'relative';
        el.style.top = '-' + (item.providerLineHeight - item.providerFontSize) / 2 + 'px';
    };

    RevSlider.prototype.resizeReactions = function(item) {
        var el = item.element.querySelector('.rev-reactions');
        if(!el) {
            return;
        }
        el.style.marginLeft = item.innerMargin + 'px';
        el.style.marginRight = item.innerMargin + 'px';

        // el.style.paddingLeft = item.innerMargin + 'px';
        // el.style.paddingRight = item.innerMargin + 'px';
    }

    RevSlider.prototype.resizeComments = function(item) {
        var el = item.element.querySelector('.rev-comments');
        if(!el) {
            return;
        }
        el.style.paddingLeft = item.innerMargin + 'px';
        el.style.paddingRight = item.innerMargin + 'px';

        // el.style.paddingLeft = item.innerMargin + 'px';
        // el.style.paddingRight = item.innerMargin + 'px';
    }

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
        var html = '<div class="rev-content-inner">' +
            '<div class="rev-ad">' +
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

    RevSlider.prototype.generateUrl = function(offset, count, empty, viewed, internal, below_article, fill) {
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

        url += fill ? '&fill=true' : '';

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
            // don't register multiple widget impressions
            var fill = urls.length > 0;
            var sponsoredURL = this.generateUrl(0, this.sponsoredLimit, false, false, false, (firstInternal > 0), fill);
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

        var authors = ['Scottie Pippen', 'Hakeem Olajuwon', 'John Stockton', 'Charles Barkley', 'Michael Jordan', 'Larry Bird', 'Dominique Wilkins', 'Magic Johnson', 'Karl Malone', 'Kareem Abdul Jabar']

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

                item.viewIndex = j;
                item.data = itemData;

                // if (this.options.image_overlay !== false) { // TODO: ad does not exist
                //     revUtils.imageOverlay(ad.querySelector('.rev-image'), itemData.content_type, this.options.image_overlay, this.options.image_overlay_position);
                // }

                // if (this.options.ad_overlay !== false) { // TODO: ad does not exist
                //     revUtils.adOverlay(ad.querySelector('.rev-ad-inner'), itemData.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
                // }

                // var reactions = item.element.querySelector('.rev-reactions');
                // if (reactions) {
                //     var js = document.createElement('script');
                //     js.type = 'text/javascript';
                //     js.src = this.options.host + '/reactions.js.php?r=199&url=' + itemData.url;
                //     js.id = 'rc-react';
                //     reactions.appendChild(js);
                // }

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

                var favicon = item.element.querySelector('.rev-headline-icon');
                if (favicon) {
                    if (item.type == 'internal' && !itemData.author) {
                        revUtils.remove(item.element.querySelector('.rev-before-image'));
                    } else {
                        favicon.innerHTML = item.type == 'sponsored' ? '<span class="rev-headline-icon-image" style="background-repeat:no-repeat;background-image:url('+ this.logoURI +')' + '"></span>' : '<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M2121 179c1065,0 1929,864 1929,1929 0,1065 -864,1929 -1929,1929 -1065,0 -1929,-864 -1929,-1929 0,-1065 864,-1929 1929,-1929zm1059 3099c-92,-307 -377,-1047 -982,-1047 -21,0 -40,1 -59,2 -19,-1 -38,-2 -59,-2 -622,0 -906,783 -989,1072 -335,-289 -548,-718 -548,-1195 0,-872 707,-1578 1578,-1578 872,0 1578,707 1578,1578 0,464 -200,881 -519,1170zm-1053 408c4,-4 8,-8 12,-13 4,4 8,8 12,12 -8,0 -16,0 -24,0zm12 -2806c293,0 530,269 530,601 0,332 -237,601 -530,601 -293,0 -530,-269 -530,-601 0,-332 237,-601 530,-601z"/></g></svg>';
                        var date = item.element.querySelector('.rev-date');
                        if (date) {
                            if (item.type == 'sponsored') {
                                var icon = '<span class="rev-sponsored-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg enable-background="new 0 0 128 128" id="Layer_1" version="1.1" viewBox="0 0 128 128" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M72.259,38.978c0.148,0.021,0.797-0.38,1.041-0.506s0.979,0.295,1.208,0.38s1.28-0.13,1.45-0.295   c0.17-0.166,0.192-0.507,0.049-0.759s-0.709-0.947-0.935-0.991c-0.225-0.044-0.969-0.158-1.147-0.159s-0.724,0.1-0.81,0.225   c-0.085,0.125-0.345,0.559-0.386,0.685s-0.3,0.494-0.481,0.538c-0.181,0.043-0.628,0.281-0.588,0.428S72.11,38.957,72.259,38.978z"/><path d="M74.428,41.097c-0.13,0.172-0.572,1.036-0.692,1.535c-0.12,0.499,0.012,2.559,0.237,2.423   c0.226-0.136,0.81-0.779,0.799-1.129c-0.011-0.35,0.102-1.443,0.275-1.66s0.969-1.123,1.098-1.25   c0.128-0.127-0.023-0.232-0.336-0.233C75.497,40.782,74.559,40.925,74.428,41.097z"/><path d="M87.878,4.622c-0.026,0-0.293-0.108-0.849-0.334C79.882,1.528,72.121,0,64,0C28.654,0,0,28.654,0,64   c0,35.347,28.654,64,64,64c35.346,0,64-28.653,64-64C128,37.098,111.393,14.088,87.878,4.622z M83.076,6.278   c0.146,0.16,1.074,0.425,1.412,0.481c0.339,0.057,2.473,0.523,2.654,0.659s0.362,0.448,0.401,0.692   c0.039,0.245-1.719,0.042-2.532-0.18c-0.814-0.222-3.471-1.203-3.654-1.373s0.037-0.725,0.421-0.719   C82.162,5.845,82.929,6.118,83.076,6.278z M77.201,4.695c0.193-0.01,1.237-0.052,1.559-0.055c0.32-0.002,1.179,0.073,1.333,0.073   s1.465,0.086,1.528,0.165c0.064,0.079,0.004,0.163-0.134,0.188s-0.703,0.045-0.88,0.033c-0.178-0.012-0.589-0.131-0.475-0.158   c0.115-0.027,0.259-0.108,0.168-0.122c-0.092-0.014-0.423-0.044-0.537-0.042c-0.114,0.003-0.417,0.065-0.419,0.133   c-0.002,0.067-1.258,0.024-1.524-0.052c-0.268-0.076-1.187-0.138-1.117-0.144C76.771,4.706,77.008,4.705,77.201,4.695z    M72.222,4.825c0.531-0.002,0.991-0.01,1.001-0.011c0.009-0.001,0.562-0.014,0.708-0.018c0.146-0.003,0.542-0.009,0.626-0.008   c0.083,0.001,0.098,0.01,0.033,0.018c-0.065,0.008-1.856,0.101-2.477,0.101S71.69,4.828,72.222,4.825z M65.721,5.043   c0.182-0.004,0.916-0.024,1.232-0.037c0.315-0.012,0.872-0.026,0.973-0.027c0.1-0.001,0.491-0.004,0.748-0.011   c0.171-0.005,0.604-0.02,0.914-0.032c-0.034-0.001-0.078-0.004-0.1-0.004c-0.172-0.006,0.082-0.026,0.209-0.028   c0.127-0.002,0.339,0.007,0.217,0.017c-0.041,0.003-0.169,0.009-0.326,0.016c0.234,0.01,0.706,0.035,0.883,0.04   c0.202,0.004,0.832,0.106,0.916,0.088c0.083-0.019,0.609-0.108,0.801-0.127c0.192-0.02,0.917,0.005,0.974,0.033   c0.057,0.027,0.372,0.137,0.578,0.159s1.114-0.007,1.351-0.031c0.235-0.023,0.599-0.102,0.695-0.083   c0.096,0.02,0.47,0.082,0.617,0.087c0.148,0.005,1.246,0.061,1.562,0.082s0.801,0.099,0.901,0.139   c0.101,0.04-0.015,0.235-0.073,0.294c-0.059,0.059,0.196,0.256,0.492,0.355c0.296,0.099,1.132,0.628,0.947,0.654   s-0.472,0.002-0.639-0.051c-0.167-0.054-0.896-0.332-1.132-0.409c-0.236-0.077-1.123-0.247-1.348-0.294S75.937,5.5,75.658,5.413   c-0.278-0.086-0.992-0.208-1.084-0.204s-0.244,0.053-0.135,0.103c0.108,0.049-0.14,0.166-0.258,0.19   c-0.119,0.024-1.206,0.056-2.27,0.077s-2.958-0.071-3.58-0.165c-0.623-0.093-1.512-0.348-1.658-0.352s-0.625-0.01-0.74-0.013   c-0.086-0.002-0.285-0.003-0.391-0.004c-0.052,0-0.08-0.001-0.067-0.001c0.006,0,0.031,0,0.067,0.001   C65.585,5.045,65.641,5.045,65.721,5.043z M13.156,41.313c-0.009,0.027-0.011,0.054-0.011-0.008c0-0.062,0.018-0.136,0.021-0.102   S13.165,41.286,13.156,41.313z M13.367,40.05c-0.027,0.087-0.07,0.178-0.052,0.007c0.018-0.171,0.109-0.616,0.105-0.456   S13.394,39.963,13.367,40.05z M15.071,36.306c-0.396,0.745-1.131,2.144-1.107,1.946s0.142-0.502,0.17-0.522   c0.029-0.02,0.219-0.389,0.355-0.777c0.136-0.388,0.589-1.23,0.759-1.579s0.484-0.594,0.505-0.533   C15.775,34.901,15.468,35.561,15.071,36.306z M88.323,122.139c-0.253,0.126-1.378,0.228-1.232,0.1s1.444-0.466,1.608-0.49   C88.863,121.723,88.577,122.014,88.323,122.139z M102.949,86.24c-0.022,0.335-0.105,1.195-0.184,1.911   c-0.079,0.717-0.553,4.61-0.81,6.39s-0.806,4.162-0.979,4.402s-0.881,1.237-1.128,1.693c-0.246,0.456-0.88,1.484-1.112,1.806   s-0.81,1.846-0.763,1.884s-0.157,0.857-0.562,1.738c-0.404,0.881-1.234,2.521-1.337,2.609s-0.431,0.475-0.498,0.664   s-0.479,1.25-0.82,1.624s-1.835,1.689-1.853,1.821s-0.202,0.772-0.371,1.136c-0.17,0.364-1.824,1.766-2.025,1.85   c-0.202,0.085-0.812,0.407-0.896,0.533c-0.084,0.125-0.661,0.998-0.914,1.059c-0.254,0.06-0.932,0.444-1.026,0.541   c-0.095,0.098-0.19,0.333-0.001,0.314s0.678,0,0.679,0.08s-0.518,0.426-0.688,0.515s-0.479,0.332-0.552,0.497   c-0.073,0.164-1.095,0.892-1.393,1.082c-0.297,0.19-0.394,0.485-0.234,0.51s0.27,0.323-0.104,0.607   c-0.372,0.285-1.368,0.965-1.366,1.045s0.046,0.312,0.103,0.362c0.058,0.05,0.627,0.623,0.838,0.605   c0.211-0.019,0.812,0.205,0.65,0.243c-0.163,0.038-1.248,0.45-1.665,0.487s-1.485-0.207-1.826-0.203   c-0.341,0.005-1.262-0.788-1.544-0.806c-0.281-0.018-0.203-0.342-0.322-0.345s-0.355-0.081-0.257-0.169s0.286-0.374,0.2-0.396   c-0.085-0.023-0.22-0.17-0.104-0.266c0.117-0.097,0.744-0.45,0.812-0.471s0.325-0.182,0.387-0.268   c0.062-0.086-0.275-0.129-0.427-0.122s-0.555-0.081-0.529-0.175s0.529-0.788,0.659-0.877c0.131-0.09,0.511-0.464,0.553-0.627   c0.043-0.163,0.071-0.695-0.027-0.794c-0.098-0.099,0.07-0.776,0.186-0.975c0.114-0.198,0.799-0.903,0.972-1.151   c0.173-0.247,0.595-1.095,0.558-1.3s-0.104-1.044-0.059-1.382c0.045-0.337,0.499-2.082,0.66-2.649   c0.162-0.567,0.675-2.622,0.731-3.188s-0.284-2.2-0.532-2.598c-0.249-0.398-2.226-1.274-2.798-1.459s-1.465-0.615-1.826-0.84   s-1.503-1.317-1.788-1.703c-0.284-0.387-1.137-2.075-1.619-2.468s-1.257-1.458-1.172-1.761c0.085-0.304,1.138-2.479,1.082-3.051   c-0.055-0.573-0.021-2.418,0.198-2.654s1.855-2.153,2.305-2.761s0.704-2.521,0.525-3.306c-0.179-0.783-1.999-1.797-2.097-1.523   c-0.099,0.273-0.794,0.872-1.324,0.722s-3.383-1.343-3.902-1.531c-0.519-0.188-2.025-2.018-2.433-2.546s-2.306-1.296-3.365-1.577   c-1.061-0.281-5.067-1.191-6.517-1.374c-1.45-0.184-4.75-1.017-5.586-1.34s-3.341-2.303-3.393-3.068   c-0.052-0.766-0.899-2.46-1.449-3.165s-2.869-4.339-3.547-5.377c-0.678-1.038-2.225-2.364-2.193-1.812s1.119,3.063,1.476,3.784   c0.356,0.722,1.039,2.416,1.195,2.757c0.155,0.341,0.517,0.683,0.373,0.784c-0.143,0.103-0.882,0.077-1.324-0.281   c-0.442-0.359-1.663-2.329-1.98-2.875c-0.317-0.546-1.048-1.64-1.001-2.058s0.161-1.05-0.164-1.375   c-0.325-0.325-1.022-2.582-1.155-3.212c-0.132-0.63-0.918-2.466-1.459-2.688s-2.041-1.244-2.163-1.792   c-0.122-0.547-0.302-2.742-0.45-2.902s-0.486-0.71-0.569-0.854c-0.083-0.144-0.237-1.465-0.16-2.765   c0.076-1.3,0.643-4.438,0.906-5.312s1.583-4.077,1.64-4.353s0.119-1.635,0.255-1.778c0.137-0.143,0.304-0.863,0.067-1.285   c-0.237-0.422-2.156-1.414-2.092-1.743c0.064-0.33,0.583-0.983,0.759-1.121c0.176-0.138,0.549-1.063,0.438-1.813   c-0.111-0.75-1.356-2.485-1.485-2.387c-0.129,0.099-0.501,0.689-0.539,1.093c-0.039,0.403-0.241,1.209-0.369,0.872   c-0.128-0.338,0.146-1.549,0.352-1.843s1.268-0.709,1.282-0.854s-0.073-0.582-0.225-0.654c-0.153-0.072-0.561-0.755-0.573-1.362   s-0.446-1.994-0.379-2.36c0.067-0.366,0.112-1.052-0.092-1.341s-0.887-1.22-1.433-1.558c-0.546-0.338-2.719-0.801-2.614-0.996   s0.28-0.709,0.15-0.722c-0.13-0.012-1.204,0.643-2.101,1.48c-0.896,0.837-2.993,1.763-3,1.658c-0.008-0.104-0.177-0.284-0.361-0.17   s-0.746,0.803-0.892,1.026c-0.146,0.223-0.745,1.115-1.119,1.525c-0.373,0.411-2.23,2.098-2.912,2.786   c-0.683,0.688-2.835,3.095-3.395,3.719c-0.56,0.624-1.66,1.518-1.588,1.346c0.071-0.171,0.632-1.056,1.083-1.585   c0.451-0.53,1.494-1.661,1.774-1.965c0.281-0.305,1.589-1.819,1.997-2.296c0.409-0.477,1.446-1.814,1.419-1.936   c-0.026-0.121-0.463-0.27-0.913-0.068c-0.45,0.202-1.037,0.041-0.936-0.234s0.281-1.224,0.144-1.412   c-0.137-0.188-0.397-0.74-0.291-0.827c0.106-0.087,0.437-0.438,0.495-0.588s0.004-0.334-0.034-0.358s0.257-0.649,0.739-1.336   c0.482-0.687,1.936-1.902,2.426-2.113c0.49-0.21,1.743-0.985,2.085-1.323c0.342-0.339,0.295-0.822,0.167-0.828   c-0.128-0.006-0.832,0.244-1.037,0.333c-0.206,0.089-0.63,0.036-0.688-0.233c-0.058-0.27,0.887-1.727,1.285-1.958   s1.47-0.967,1.665-1.006s0.679-0.042,0.634,0.077c-0.045,0.119-0.071,0.491-0.006,0.541c0.065,0.05,0.953-0.467,1.206-0.72   s0.351-0.583,0.281-0.607s-0.192-0.217-0.119-0.377c0.073-0.16,0.538-0.987,0.708-1.211c0.169-0.225,1.021-0.689,1.365-0.828   s2.319-0.88,2.89-1.087s1.666-0.606,1.893-0.655c0.227-0.049,1.383-0.334,2.062-0.529c0.679-0.195,1.864-0.279,2.213-0.251   c0.349,0.029,1.977,0.162,2.521,0.208c0.544,0.046,2.54,0.227,2.843,0.232c0.304,0.005,1.541,0.266,1.876,0.351   c0.336,0.086,1.155,0.105,1.501,0.024c0.346-0.082,2.393-0.632,3-0.762c0.607-0.131,2.021-0.153,2.325-0.208   c0.304-0.055,1.099-0.15,1.096-0.097c-0.003,0.053,0.354,0.276,0.8,0.369c0.446,0.093,3.109,1.056,3.81,1.269   c0.701,0.212,2.485,0.315,2.56,0.275c0.076-0.041-0.012-0.287-0.361-0.459c-0.35-0.172-0.901-0.664-0.848-0.732   c0.054-0.068,0.98-0.295,1.054-0.329c0.073-0.034,0.016-0.246-0.286-0.398c-0.303-0.152-0.681-0.564-1.306-0.661   c-0.625-0.098-2.099,0.045-2.291-0.121c-0.192-0.166,0.327-0.525,0.829-0.729s1.981-0.476,2.033-0.534   c0.052-0.059,0.439-0.142,0.716-0.153s1.482-0.009,2.065,0.027c0.582,0.036,1.65,0.238,1.543,0.363   c-0.107,0.125-0.054,0.326,0.085,0.364s1.124,0.185,1.03,0.229c-0.093,0.044-0.028,0.224,0.357,0.293s1.301-0.023,1.721-0.149   c0.421-0.126,1.692-0.426,1.938-0.438c0.246-0.012,0.924,0.136,1.051,0.198c0.127,0.062-0.125,0.524-0.322,0.882   C72.079,7.562,71.776,8.845,72,9.07c0.225,0.225,0.771,0.86,0.581,0.85s-0.74,0.048-0.794,0.145   c-0.055,0.098-0.593,0.306-1.068,0.239c-0.477-0.067-1.899-0.17-2.091-0.028c-0.191,0.141,0.424,0.67,1.164,0.985   c0.74,0.314,3.101,0.549,3.327,0.431c0.228-0.118,0.559-0.49,0.613-0.59c0.054-0.1,0.571-0.512,1.017-0.735   c0.445-0.224,1.097-0.817,1.058-1.012s-0.494-1.091-0.41-1.149c0.085-0.058,0.174-0.473,0.012-0.797   c-0.162-0.325,0.769-1.04,0.939-1.029s0.703,0.081,0.806,0.128c0.103,0.047,0.481,0.166,0.585,0.192   c0.104,0.026,0.904,0.18,1.623,0.327c0.718,0.147,2.086,0.46,2.01,0.569c-0.075,0.108-0.535,0.292-0.721,0.316   s-1.155,0.041-1.41,0.088c-0.254,0.047-0.376,0.955-0.232,1.364c0.144,0.408,0.279,1.168,0.16,1.234   c-0.118,0.066-0.397,0.339-0.348,0.453s0.858,0.466,1.11,0.557s0.705,0.399,0.82,0.567c0.115,0.168,0.304,1.017,0.528,1.071   c0.224,0.054,0.818-0.31,0.959-0.453c0.142-0.143,0.441-0.51,0.508-0.598c0.065-0.087,0.249-0.309,0.297-0.37   c0.047-0.062-0.132-0.412-0.49-0.611c-0.357-0.2-1.418-0.482-1.451-0.585c-0.034-0.104-0.049-0.392,0.043-0.417   s0.197-0.233,0.035-0.407c-0.161-0.174-0.367-0.467-0.406-0.529c-0.04-0.062,0.039-0.421,0.389-0.618   c0.349-0.196,1.245-0.544,1.648-0.619c0.404-0.075,1.786,0.248,1.819,0.313s0.542,0.286,1.06,0.341s2.197,0.799,2.634,1.128   c0.437,0.33,1.465,1.998,1.733,2.19c0.27,0.192,1.131,0.701,1.14,0.885s0.705,0.779,0.812,0.794   c0.107,0.015,0.597,0.359,0.855,0.729s0.67,1.717,0.582,1.751c-0.087,0.034-0.143,0.399,0.078,0.732   c0.22,0.333,0.849,0.717,0.898,0.964c0.049,0.247,0.802,1.397,0.903,1.443s0.227,0.438,0.056,0.765   c-0.171,0.327-0.579,0.982-0.686,0.964c-0.105-0.018-0.65-0.727-0.804-0.943s-0.487-0.451-0.622-0.474s-0.216,0.38,0.122,0.947   c0.338,0.566,0.828,1.716,0.771,2.068c-0.057,0.353-1.132,0.663-1.18,0.706c-0.048,0.042-0.35,0.004-0.566-0.181   s-1.167-1.278-1.446-1.586s-1.194-1.041-1.584-1.38c-0.39-0.338-1.092-1.025-1.428-0.878s-1.432-0.83-1.46-0.975   c-0.028-0.145,0.013-0.542,0.155-0.567c0.144-0.025,1.095,0.134,1.252,0.277c0.157,0.144,0.682,0.306,0.823,0.035   c0.142-0.271,0.467-0.795,0.637-0.955s0.603-0.794,0.595-1.075c-0.008-0.281-0.928-1.371-1.272-1.69s-1.215-1.172-1.204-1.234   c0.01-0.063-0.12-0.228-0.315-0.23c-0.195-0.003-0.944-0.325-1.024-0.385c-0.081-0.06-0.405-0.256-0.545-0.305   s-0.54-0.035-0.627-0.009c-0.086,0.026-0.086,0.279-0.031,0.463s0.103,0.723-0.014,0.768c-0.115,0.045-0.359,0.587-0.281,1.099   c0.079,0.511-0.583,0.983-1.062,0.902c-0.479-0.081-1.723-0.138-1.789,0.014c-0.065,0.153,0.604,0.859,0.832,1.062   c0.228,0.203,0.829,0.816,1.287,1.113c0.459,0.297,1.041,0.747,0.951,0.816s-0.264,0.309-0.182,0.38   c0.083,0.072,0.087,0.224-0.174,0.179s-1.569-0.605-1.941-0.716c-0.372-0.111-1.118,0.269-1.27,0.25   c-0.152-0.019-0.506-0.417-0.445-0.843s0.833-1.616,0.779-1.703c-0.055-0.088-0.512-0.255-0.896-0.181   c-0.384,0.074-1.882,0.902-2.283,1.154s-1.045,0.653-1.103,0.794c-0.059,0.141-0.754,0.779-1.418,1.098s-2.024,1.606-2.189,2.052   c-0.164,0.446-0.524,1.86-0.419,2.103c0.105,0.243,0.396,1.034,0.41,1.209c0.014,0.174,0.447,0.785,0.931,0.963   c0.482,0.178,2.186,1.227,2.989,1.813c0.804,0.586,2.957,2.396,3.042,2.66c0.086,0.264,0.392,2.4,0.529,2.872   s1.148,0.801,1.338,0.669c0.19-0.133,0.42-1.645,0.438-2.102c0.019-0.456,0.431-1.434,0.95-1.836   c0.519-0.402,1.894-1.798,1.866-2.183c-0.027-0.384-1.216-1.496-1.238-1.667s0.152-0.776,0.435-0.966s0.695-0.985,0.633-1.523   c-0.062-0.538-0.039-2.047,0.094-2.138c0.132-0.09,1.283,0.271,1.668,0.432s1.529,0.859,1.771,1.248s0.796,0.877,0.921,0.877   s0.57,0.133,0.719,0.293c0.147,0.16,0.372,1.087,0.175,1.7c-0.197,0.614,0.662,1.702,1.128,1.805   c0.465,0.103,1.316-1.061,1.336-1.376c0.019-0.316,0.39-0.117,0.567,0.358c0.178,0.475,1,3.531,1.325,4.427   c0.326,0.896,1.644,2.559,1.676,2.933s0.667,2.401,0.758,3.216c0.09,0.815,0.452,2.548,0.602,2.703   c0.149,0.155,0.779,0.823,0.834,1.257s0.071,1.673-0.078,1.781c-0.148,0.107-0.267,0.496-0.296,0.38s-0.213-0.47-0.338-0.527   s-0.636-0.042-0.62-0.146c0.017-0.104-0.056-0.542-0.195-0.745s-0.85-0.535-1.07-0.607s-0.444-0.76-0.12-1.276   c0.324-0.517,1.094-1.956,1.087-2.027c-0.006-0.071-0.051-0.324-0.081-0.403s-0.508-0.125-0.988,0.077   c-0.48,0.201-2.045,0.735-2.247,0.646c-0.202-0.089-1.578-0.767-1.977-0.885s-0.724,0.582-0.498,0.75   c0.227,0.168,0.975,0.63,1.079,0.761c0.104,0.131,0.282,0.554,0.165,0.646c-0.116,0.093-0.287,0.489-0.116,0.669   c0.171,0.179,1.005,0.843,1.274,1.042c0.27,0.199,1.104,1.045,1.188,1.419c0.082,0.374-0.379,0.853-0.783,0.939   c-0.403,0.086-1.746,0.544-2.006,0.793s-0.996,0.052-1.33-0.223c-0.333-0.275-2.114-0.449-2.357-0.253   c-0.244,0.195-0.771,1.308-0.884,1.665s-0.533,1.24-0.801,1.229s-1.279,0.232-1.642,0.561s-1.445,2.167-1.733,2.751   s-0.98,2.459-1.011,2.991c-0.029,0.531-0.853,1.796-1.469,2.215c-0.615,0.418-2.251,1.567-2.669,1.912s-1.59,1.945-1.813,2.402   c-0.225,0.457,0.597,2.588,1.416,4.146c0,0,0,0,0,1.331c0,0.337,0,0.337,0,0.337c-0.068,0.3-0.208,0.617-0.309,0.705   s-0.896-0.224-1.17-0.526c-0.272-0.303-1.186-1.584-1.416-2.171c-0.23-0.586-1.058-2.198-1.314-2.275   c-0.258-0.077-0.98-0.395-1.193-0.522s-1.667-0.516-2.598-0.277c-0.932,0.239-2.504,1.727-3.501,1.646s-3.406,0.107-4.268,0.351   c-0.862,0.243-3.037,3.576-3.735,5.662c0,0-0.346,1.032-0.346,2.229c0,0.509,0,0.509,0,0.509c0,0.566,0.141,1.318,0.312,1.671   s0.705,1.447,0.964,1.723s2.382,0.783,3.081,0.83s2.497-0.503,2.691-0.7c0.194-0.198,0.885-1.546,1.093-1.923   s1.006-0.855,1.235-0.918c0.229-0.062,0.969-0.29,1.211-0.366c0.242-0.075,1.15-0.167,1.173,0.062s-0.413,2.034-0.536,2.531   c-0.124,0.496-1.245,1.94-1.418,2.508c-0.172,0.567,1.618,1.366,2.283,1.309s2.511-0.152,2.649-0.074   c0.139,0.079,0.378,0.947,0.224,1.754c-0.155,0.806-0.174,2.649-0.021,3.103c0.151,0.453,2.018,0.96,2.745,0.699   s2.476-0.356,2.907-0.282c0.432,0.075,1.864-0.559,2.795-1.356c0.932-0.798,2.71-2.553,3.176-2.444   c0.466,0.109,2.832,0.324,2.9,0.481s0.612,0.506,1.057,0.429c0.445-0.077,1.982-0.416,2.482-0.574   c0.501-0.159,1.537-0.552,1.577-0.721c0.04-0.17,0.25-0.542,0.38-0.449c0.13,0.094,0.145,0.81,0.127,1.034   c-0.019,0.225,0.399,1.075,0.81,1.562s1.493,1.227,1.806,1.304c0.312,0.076,1.554-0.01,1.862,0.125s1.281,1.809,1.278,2.123   c-0.004,0.314,0.416,1.177,0.941,1.222c0.526,0.045,1.271,0.421,1.383,0.366c0.111-0.054,0.6-0.566,0.719-0.701   c0.12-0.136,0.366-0.107,0.459-0.035C102.896,84.694,102.973,85.905,102.949,86.24z M93.49,73.909   c-0.011,0.329-0.119,0.448-0.241,0.264s-0.337-0.845-0.201-1.053C93.184,72.913,93.501,73.579,93.49,73.909z M90.076,72.218   c-0.396,0.138-1.197,0.202-0.857-0.162c0.341-0.364,1.287-0.409,1.391-0.295S90.474,72.08,90.076,72.218z M79.55,71.355   c-0.219-0.07-1.31-0.951-1.644-1.22c-0.333-0.269-1.74-0.679-2.52-0.757s-2.627,0.117-2.012-0.345   c0.615-0.463,3.881-0.825,4.42-0.593s2.432,0.997,3.039,1.192s2.167,1.056,2.164,1.234s-0.457,0.368-1.01,0.422   C81.435,71.344,79.769,71.426,79.55,71.355z M80.527,73.434c-0.058,0.163-0.652,0.568-0.842,0.655   c-0.189,0.086-0.571,0.033-0.656-0.138c-0.086-0.171,0.621-0.715,0.971-0.75C80.349,73.166,80.586,73.271,80.527,73.434z    M79.275,63.851c0.482-0.031,0.963-0.062,1.438-0.093C79.919,64.142,79.434,64.174,79.275,63.851z M79.75,66.8   c-0.002,0.408-0.074,0.488-0.161,0.177s-0.244-1.216-0.155-1.312C79.522,65.568,79.752,66.391,79.75,66.8z M81.453,65.728   c0.407,0.265,1.005,1.452,1.045,1.766c0.039,0.312-0.204,0.147-0.541-0.366C81.619,66.613,81.045,65.463,81.453,65.728z    M82.911,72.054c0.352-0.503,4.476-0.939,4.69-0.51c0.215,0.431-0.255,0.893-1.043,1.027c-0.788,0.134-2.051,0.6-2.629,0.62   S82.56,72.558,82.911,72.054z M103.025,83.868c-0.006,0.087-0.034-0.007-0.047-0.07c-0.012-0.062-0.016-0.183-0.009-0.268   s0.052-0.15,0.059-0.09C103.035,83.502,103.03,83.781,103.025,83.868z"/><path d="M77.699,41.569c0.05,0.171,0.26,0.798,0.357,1.013c0.097,0.214,0.488,0.644,0.656,0.473s0.596-0.79,0.587-1.002   c-0.009-0.213,0.301-0.989,0.425-1.071c0.125-0.082,0.084-0.221-0.092-0.309c-0.175-0.088-0.819-0.356-1.039-0.402   c-0.221-0.046-0.871-0.133-0.957-0.092c-0.086,0.042-0.27,0.291-0.217,0.46C77.472,40.809,77.648,41.398,77.699,41.569z"/><path d="M57.341,12.109c-0.083-0.006-0.461-0.144-0.664-0.219c-0.204-0.075-0.8-0.296-0.88-0.333s-0.424-0.086-0.588-0.027   c-0.164,0.058-0.533,0.245-0.454,0.282s0.318,0.246,0.354,0.379c0.036,0.133,0.267,0.481,0.431,0.467   c0.165-0.014,1.251-0.104,1.499-0.123c0.247-0.019,0.483-0.085,0.524-0.146C57.604,12.327,57.423,12.115,57.341,12.109z"/></g></svg></span>';
                            }
                            date.innerHTML = itemData.date ? this.timeAgo(itemData.date) : item.type == 'sponsored' ? 'Sponsored  ·  · ' + icon : '&nbsp;';
                        }
                    }
                }
                // if (favicon && itemData.favicon_url) {
                //     favicon.style.backgroundImage = 'url("' + itemData.favicon_url + '")';

                //     var date = item.element.querySelector('.rev-date');
                //     if (date && itemData.date) {
                //         date.innerHTML = this.timeAgo(itemData.date);
                //     }
                // } else { // no meta
                //     revUtils.remove(item.element.querySelector('.rev-meta'))
                // }

                var provider = item.element.querySelector('.rev-provider');
                if (provider) {
                    if (item.type == 'sponsored') {
                        provider.innerHTML = itemData.brand ? itemData.brand : this.extractRootDomain(itemData.target_url);
                    } else if (item.type == 'internal') {
                        provider.innerHTML = itemData.author ? itemData.author : authors[Math.floor(Math.random() * authors.length)];
                    }
                    // console.log(item.type);
                    // provider.innerHTML = itemData.brand ? itemData.brand : this.extractRootDomain(itemData.target_url);
                }

                var reactions = item.element.querySelector('.rev-reactions');
                if (reactions) {

                    var texts = [
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
                    ]

                    var random = function(max, min) {
                        min = min ? min : 1;
                        return Math.floor(Math.random()*(max-min+1)+min);
                    }

                    var comments = document.createElement('div');
                    revUtils.addClass(comments, 'rev-comments');
                    // comments.innerHTML = '<div class="rev-comment">' +
                    //         '<div class="rev-comment-image">' +
                    //             '<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M2121 179c1065,0 1929,864 1929,1929 0,1065 -864,1929 -1929,1929 -1065,0 -1929,-864 -1929,-1929 0,-1065 864,-1929 1929,-1929zm1059 3099c-92,-307 -377,-1047 -982,-1047 -21,0 -40,1 -59,2 -19,-1 -38,-2 -59,-2 -622,0 -906,783 -989,1072 -335,-289 -548,-718 -548,-1195 0,-872 707,-1578 1578,-1578 872,0 1578,707 1578,1578 0,464 -200,881 -519,1170zm-1053 408c4,-4 8,-8 12,-13 4,4 8,8 12,12 -8,0 -16,0 -24,0zm12 -2806c293,0 530,269 530,601 0,332 -237,601 -530,601 -293,0 -530,-269 -530,-601 0,-332 237,-601 530,-601z"/></g></svg>' +
                    //         '</div>' +
                    //         '<div class="rev-comment-text">' +
                    //         '<span class="rev-comment-author">' + authors[Math.floor(Math.random() * authors.length)] + '</span>' + 
                    //         ' · <span class="rev-comment-date">' + this.timeAgo(new Date(Date.now() - (random(120) * 60000)), true) + '</span>  ' + texts[Math.floor(Math.random() * texts.length)]
                    //         '</div>' +
                    //     '</div>' +
                    // '</div>';
                    
                    var reactionHtml = '<div class="rev-reactions-total"><div class="rev-reactions-total-inner">';

                    var reactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];

                    var reactionCount = random(5);
                    var start = random(3);
                    // console.log(start);
                    start--;
                    var zIndex = 100;
                    for (var reactionId = 0; reactionId < reactionCount; reactionId++) {
                        if (reactions[start]) {
                            reactionHtml += '<div style="z-index:'+ zIndex +';" class="rev-reaction rev-reaction-' + reactions[start] + '"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-' + reactions[start] + '"></div></div></div>';    
                        }
                        zIndex--;
                        start++;
                    }

                    reactionHtml += '<div class="rev-reaction-count">'+ random(168, reactionCount) +'</div>';

                    // for (var reactionId = 0; reactionId < reactions.length; reactionId++) {
                    //     if (reactions[reactionId]) {
                    //         reactionHtml += '<div class="rev-reaction rev-reaction-' + reactions[reactionId] + '"></div>';    
                    //     }
                    //     start++;
                    // }

                    reactionHtml += '</div></div>';

                    var commentHtml = ''

                    var commentCount = random(3);
                    for (var commentId = 0; commentId < commentCount; commentId++) {
                        var author = authors[Math.floor(Math.random() * authors.length)];
                        var authorNames = author.split(' ');
                        var authorImageString = author.split(' ')[authorNames.length - 1].toLowerCase();
                        var authorImage = '/app/resources/img/' + authorImageString + '.png';

                        commentHtml += '<div class="rev-comment">' +
                                '<div class="rev-comment-image" style="background-image:url('+ authorImage +')">' +
                                    // '<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M2121 179c1065,0 1929,864 1929,1929 0,1065 -864,1929 -1929,1929 -1065,0 -1929,-864 -1929,-1929 0,-1065 864,-1929 1929,-1929zm1059 3099c-92,-307 -377,-1047 -982,-1047 -21,0 -40,1 -59,2 -19,-1 -38,-2 -59,-2 -622,0 -906,783 -989,1072 -335,-289 -548,-718 -548,-1195 0,-872 707,-1578 1578,-1578 872,0 1578,707 1578,1578 0,464 -200,881 -519,1170zm-1053 408c4,-4 8,-8 12,-13 4,4 8,8 12,12 -8,0 -16,0 -24,0zm12 -2806c293,0 530,269 530,601 0,332 -237,601 -530,601 -293,0 -530,-269 -530,-601 0,-332 237,-601 530,-601z"/></g></svg>' +
                                '</div>' +
                                '<div class="rev-comment-text">' +
                                    '<span class="rev-comment-author">' + author + '</span>' + 
                                    ' · ' + 
                                    '<span class="rev-comment-date">' + this.timeAgo(new Date(Date.now() - (random(120) * 60000)), true) + '</span>  ' + texts[Math.floor(Math.random() * texts.length)] +
                                '</div>' +
                            '</div>' + 
                            '</div>';
                    }
                    comments.innerHTML = reactionHtml + commentHtml;
                    item.element.querySelector('.rev-content-inner').appendChild(comments);
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

    RevSlider.prototype.extractRootDomain = function(url) {
        if (!url) {
            return '';
        }
        var domain;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        }
        else {
            domain = url.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];
        //find & remove "?"
        domain = domain.split('?')[0];

        var splitArr = domain.split('.'),
            arrLen = splitArr.length;

        //extracting the root domain here
        if (arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        }
        return domain;
    }

    RevSlider.prototype.timeAgo = function(time, output) {
        var templates = {
            prefix: "",
            suffix: "",
            seconds: "less than a minute",
            minute: "about a minute",
            minutes: "%d minutes",
            hour: "1 hr",
            hours: "%d hrs",
            day: "a day",
            days: "%d days",
            month: "1 month",
            months: "%d months",
            year: "1 year",
            years: "%d years"
        };
        var template = function(t, n) {
            return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
        };

        // random hrs
        if (!time)
            return '';
        if (typeof time === 'string') {
            time = time.replace(/\.\d+/, ""); // remove milliseconds
            time = time.replace(/-/, "/").replace(/-/, "/");
            time = time.replace(/T/, " ").replace(/Z/, " UTC");
            time = time.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
            time = new Date(time * 1000 || time);
        }

        // if (true) {
        //     console.log(time.toString());
        // }

        var now = new Date();
        var seconds = ((now.getTime() - time) * .001) >> 0;
        var minutes = seconds / 60;
        var hours = minutes / 60;
        var days = hours / 24;
        var years = days / 365;

        return templates.prefix + (
                seconds < 45 && template('seconds', seconds) ||
                seconds < 90 && template('minute', 1) ||
                minutes < 45 && template('minutes', minutes) ||
                minutes < 90 && template('hour', 1) ||
                hours < 24 && template('hours', hours) ||
                hours < 42 && template('day', 1) ||
                days < 30 && template('days', days) ||
                days < 45 && template('month', 1) ||
                days < 365 && template('months', days / 30) ||
                years < 1.5 && template('year', 1) ||
                template('years', years)
                ) + templates.suffix;
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