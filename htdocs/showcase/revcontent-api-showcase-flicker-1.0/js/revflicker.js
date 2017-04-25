/*
ooooooooo.                         oooooooooooo oooo   o8o            oooo
`888   `Y88.                       `888'     `8 `888   `"'            `888
 888   .d88'  .ooooo.  oooo    ooo  888          888  oooo   .ooooo.   888  oooo   .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'   888oooo8     888  `888  d88' `"Y8  888 .8P'   d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'    888    "     888   888  888        888888.    888ooo888  888
 888  `88b.  888    .o    `888'     888          888   888  888   .o8  888 `88b.  888    .o  888
o888o  o888o `Y8bod8P'     `8'     o888o        o888o o888o `Y8bod8P' o888o o888o `Y8bod8P' d888b

Project: RevFlicker
Version: 1
Author: michael@revcontent.com

RevFlicker({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    perRow: {
        xxs: 1,
        xs: 1,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
        xxl: 7
    },
    show_arrows: {
        mobile: false,
        desktop: true
    },
    rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
    next_effect: true,
    sponsored: 10,
    internal: false,
    dots: false,
    header: 'Trending Now',
    devices: [
        'phone', 'tablet', 'desktop'
    ],
    url: 'https://trends.revcontent.com/api/v1/',
    disclosure_text: revDisclose.defaultDisclosureText,
    hide_provider: false,
    beacons: true
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevFlicker = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revApi, revDisclose) {
'use strict';

    var RevFlicker = function(opts) {

        var defaults = {
            api_source: 'flick',
            element: false,
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            image_ratio: 'rectangle',
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            next_effect: true,
            show_arrows: {
                mobile: false,
                desktop: true
            },
            arrow_style: 'circle', // circle or square
            sponsored: 10,
            internal: false,
            dots: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/',
            headline_size: 2,
            max_headline: false,
            text_overlay: false,
            ad_border: true,
            square_border: false,
            disclosure_text: revDisclose.defaultDisclosureText,
            hide_provider: false,
            beacons: true,
            multipliers: {
                line_height: 0,
                font_size: 0,
                margin: 0,
                padding: 0
            },
            size: {
                margin: false,
                image_height: false,
                headline_line_height: false,
                headline_margin_top: false,
                provider_line_height: false,
                provider_margin_top: false,
                provider_margin_bottom: false,
                inner_margin: false
            },
            text_top: false,
            text_right: false,
            text_right_height: 100,
            next_width: false,
            transition_content: false,
            css: '',
            user_ip: false,
            user_agent: false,
            hide_header: false,
            hide_disclosure: false,
            overlay_icons: false, // pass in custom icons or overrides
            image_overlay: false, // pass key value object { content_type: icon }
            image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: false, // pass key value object { content_type: icon }
            ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
            query_params: false,
            trending: false,
            trending_theme: 'default'
        };

        // merge options
        this.options = revUtils.extend(defaults, revUtils.deprecateOptions(opts));

        // param errors
        if (revUtils.validateApiParams(this.options).length) {
            return;
        }
        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        this.impressionTracker = {};

        var that = this;
        //append injrected style
        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-flicker', this.options.css);

        // append a new element to the flicker
        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-flicker';
        this.containerElement.setAttribute('class', 'rev-flicker');
        var textPosition = (this.options.text_right ? 'text-right' : this.options.text_top ? 'text-top' : 'text-bottom');
        revUtils.addClass(this.containerElement, 'rev-flicker-' + textPosition);

        if (this.options.transition_content) {
            revUtils.addClass(this.containerElement, 'transition-content');
        }
        if (this.options.square_border) {
            revUtils.addClass(this.containerElement, 'rev-flicker-square-border');
        }
        if (this.options.arrow_style === 'square') {
            revUtils.addClass(this.containerElement, 'rev-flicker-square-arrows');
        }

        this.flickerElement = document.createElement('div');

        this.innerElement = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.innerElement.style.width = '100%';

        this.source = 'flick';

        revUtils.append(this.containerElement, this.flickerElement);
        revUtils.append(this.innerElement, this.containerElement);

        // create flickity
        this.flickity = new Flickity( this.flickerElement, {
            prevNextButtons: revDetect.mobile() ? this.options.show_arrows.mobile : this.options.show_arrows.desktop,
            pageDots: this.options.dots,
            cellAlign: 'left',
            percentPosition: false,
            wrapAround: true
        });

        this.setMultipliers();

        // wrapper class
        revUtils.addClass(this.flickity.element, 'rev-flicker');

        // custom icons passed? merge with default
        if (this.options.overlay_icons !== false) {
            revUtils.mergeOverlayIcons(this.options.overlay_icons);
        }

        // HACK for Chrome using emitter to wait for element container to be ready
        this.emitter = new EventEmitter();
        this.getContainerWidth();
        this.emitter.on('containerReady', function() {
            that.setUp();
            that.appendElements();
            that.preData();
            that.textOverlay();
            that.getData();
            that.registerViewOnceVisible();
            that.attachVisibleListener();
            revUtils.checkVisible.bind(that, that.containerElement, that.visible)();
            that.attachRegisterImpressions();
        });

        revUtils.addEventListener(window, 'resize', function() {
            that.resize();
        });

        revUtils.dispatchScrollbarResizeEvent();

        this.flickity.on( 'cellSelect', function() {
            that.emitter.emit('cellSelect');
        });
    };

    RevFlicker.prototype.resize = function() {
        var that = this;
        this.getContainerWidth(true);

        this.setUp();

        if (this.options.max_headline) {
            this.headlineHeight = this.getMaxHeadlineHeight();
        }

        var ads = this.flickity.element.querySelectorAll('.rev-content');

        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];

            ad.style.width = this.columnWidth + 'px';
            ad.style.marginRight = this.margin + 'px';

            ad.querySelectorAll('.rev-image')[0].style.height = this.preloaderHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.maxHeight = this.headlineHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.padding = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';

            ad.querySelectorAll('.rev-headline h3')[0].style.fontSize = this.headlineFontSize +'px';
            ad.querySelectorAll('.rev-headline h3')[0].style.lineHeight = this.headlineLineHeight +'px';
            if(that.options.hide_provider === false) {
                ad.querySelectorAll('.rev-provider')[0].style.padding = this.providerMarginTop + 'px '  + this.innerMargin + 'px '+ this.providerMarginBottom +'px';
                ad.querySelectorAll('.rev-provider')[0].style.fontSize = this.providerFontSize + 'px';
                ad.querySelectorAll('.rev-provider')[0].style.lineHeight = this.providerLineHeight + 'px';
            }
        }

        this.textOverlay();

        this.flickity.resize();

        if (this.options.next_effect) {
            this.selectedIndex = -1;
            this.nextEffect();
        }
        revUtils.ellipsisText(this.flickity.element.querySelectorAll('.rev-content .rev-headline'));
    };

    RevFlicker.prototype.appendElements = function() {
        if (!this.options.hide_header) {
            if (this.header) {
                revUtils.remove(this.header);
            }
            this.header = document.createElement('h2');
            this.header.innerHTML = this.options.header;
            revUtils.addClass(this.header, 'rev-header');
            revUtils.prepend(this.containerElement, this.header);
        }

        if (!this.options.hide_disclosure) {
            if (this.sponsored) {
                revUtils.remove(this.sponsored);
            }
            this.sponsored = document.createElement('div');
            revUtils.addClass(this.sponsored, 'rev-sponsored');
            this.sponsored.innerHTML = revDisclose.getDisclosure(this.options.disclosure_text);
            if (this.options.rev_position == 'top_right') {
                revUtils.addClass(this.sponsored, 'top-right')
                revUtils.prepend(this.containerElement, this.sponsored);
            } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
                revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
                revUtils.append(this.containerElement, this.sponsored);
            }
        }
    };

    RevFlicker.prototype.getContainerWidth = function(ready) {
        if (ready) {
            this.containerWidth = this.flickity.element.parentNode.offsetWidth;
            return;
        }
        // HACK for Chrome - sometimes the width will be 0
        var that = this;
        function check() {
            var containerWidth = that.flickity.element.parentNode.offsetWidth;
            if(containerWidth > 0) {
                that.containerWidth = containerWidth;
                // emit event so we can continue
                that.emitter.emit('containerReady');
            }else {
                setTimeout(check, 0);
            }
        }
        // start the check
        setTimeout(check, 0);
    };

    RevFlicker.prototype.setMultipliers = function() {
        this.lineHeightMultiplier = Math.round( (0.057 + Number((this.options.multipliers.line_height * .01).toFixed(2))) * 1000 ) / 1000;
        this.fontSizeMultiplier = Math.round( (.83 + Number((this.options.multipliers.font_size * .01).toFixed(2))) * 1000 ) / 1000;
        this.marginMultiplier = Math.round( (.05 + Number((this.options.multipliers.margin * .01).toFixed(2))) * 1000 ) / 1000;
        this.paddingMultiplier = Math.round( (.01 + Number((this.options.multipliers.padding * .01).toFixed(2))) * 1000 ) / 1000;
    };

    RevFlicker.prototype.setUp = function() {
        // determine elements per row based on container width
        if (typeof this.options.per_row == 'number') { // if a number is passed just use that
            this.perRow = this.options.per_row;
        }else if (this.containerWidth >= 1500) {
            this.perRow = this.options.per_row.xxl;
        }else if (this.containerWidth >= 1250) {
            this.perRow = this.options.per_row.xl;
        }else if (this.containerWidth >= 1000) {
            this.perRow = this.options.per_row.lg;
        }else if (this.containerWidth >= 750) {
            this.perRow = this.options.per_row.md;
        }else if (this.containerWidth >= 500) {
            this.perRow = this.options.per_row.sm;
        }else if (this.containerWidth >= 250) {
            this.perRow = this.options.per_row.xs;
        }else {
            this.perRow = this.options.per_row.xxs;
        }

        var width = this.containerWidth / this.perRow;

        this.margin = this.options.size.margin ? this.options.size.margin : ((width * this.marginMultiplier).toFixed(2) / 1);

        if (this.options.next_width) {
            this.columnWidth = (((this.containerWidth - (this.margin * this.perRow)) / (this.perRow)).toFixed(2) / 1);
            this.columnWidth = this.columnWidth - (this.options.next_width / this.perRow);
        } else {
            this.columnWidth = (((this.containerWidth - (this.margin * this.perRow)) / (this.perRow + (1/2))).toFixed(2) / 1);
        }

        if (!this.options.text_right && this.options.size.image_height) {
            this.imageHeight = this.options.size.image_height * 2;
            this.imageWidth = this.columnWidth * 2;
        } else if (this.options.image_ratio == 'square') { // 1:1
            this.imageHeight = 300;
            this.imageWidth = 300;
        } else if (this.options.image_ratio == 'rectangle') { // 4:3
            this.imageHeight = 300;
            this.imageWidth = 400;
        } else if (this.options.image_ratio == 'wide_rectangle') { // 16:9
            this.imageHeight = 300;
            this.imageWidth = 533;
        }

        this.headlineLineHeight = this.options.size.headline_line_height ? this.options.size.headline_line_height : (this.columnWidth * this.lineHeightMultiplier).toFixed(2) / 1;
        if (!this.options.size.headline_line_height && this.headlineLineHeight < 16) {
            this.headlineLineHeight = 16;
        }
        this.headlineFontSize = Math.min(this.headlineLineHeight, (this.headlineLineHeight * this.fontSizeMultiplier).toFixed(2) / 1);

        this.headlineMarginTop = this.options.size.headline_margin_top ? this.options.size.headline_margin_top : ((this.headlineLineHeight * .4).toFixed(2) / 1);

        this.headlineHeight = ((this.headlineLineHeight * this.options.headline_size).toFixed(2) / 1) + this.headlineMarginTop;

        this.innerMargin = this.options.size.inner_margin ? this.options.size.inner_margin : Math.max(0, ((this.columnWidth * this.paddingMultiplier).toFixed(2) / 1));

        this.providerLineHeight = this.options.size.provider_line_height ? this.options.size.provider_line_height : (this.headlineLineHeight * .75).toFixed(2) / 1;
        if (!this.options.size.provider_line_height && this.providerLineHeight < 16.5) {
            this.providerLineHeight = 16.5;
        }
        this.providerFontSize = Math.min(this.providerLineHeight, (this.providerLineHeight * (this.fontSizeMultiplier - .165)).toFixed(2) / 1);

        this.providerMarginTop = this.options.size.provider_margin_top ? this.options.size.provider_margin_top : 0;
        this.providerMarginBottom = this.options.size.provider_margin_bottom ? this.options.size.provider_margin_bottom : 0;

        this.preloaderHeight = this.options.size.image_height ? this.options.size.image_height : Math.round((this.columnWidth - (this.options.ad_border ? 2 : 0)) * (this.imageHeight / this.imageWidth));

        if (this.options.text_right) {
            this.preloaderHeight = 'auto';
            this.preloaderWidth = '50%';
        }
    };

    RevFlicker.prototype.update = function(newOpts, oldOpts) {
        this.options = revUtils.extend(this.options, newOpts);

        if ( (newOpts.size !== oldOpts.size) ||
            (newOpts.realSize !== oldOpts.realSize) ||
            (newOpts.per_row !== oldOpts.per_row) ||
            (newOpts.headline_size !== oldOpts.headline_size)) {
            this.resize();
        }

        if (newOpts.sponsored !== oldOpts.sponsored) {
            this.preData();
            this.getData();
            this.flickity.reloadCells();
            this.flickity.reposition();
        }

        if ((newOpts.header !== oldOpts.header) || newOpts.rev_position !== oldOpts.rev_position) {
            this.appendElements();
        }

        if (newOpts.next_effect !== oldOpts.next_effect) {
            this.nextEffect();
        }

        if (newOpts.text_overlay !== oldOpts.text_overlay) {
            this.textOverlay();
            this.flickity.reloadCells();
            this.flickity.reposition();
        }

        if (newOpts.ad_border !== oldOpts.ad_border) {
            this.adBorder();
            this.resize();
        }
    };

    RevFlicker.prototype.adBorder = function() {
        var ads = this.containerElement.querySelectorAll('.rev-ad');
        for (var i = 0; i < ads.length; i++) {
            var ad = ads[i];
            ad.style.borderWidth = (this.options.ad_border ? '1px' : '0')
        }
    };

    RevFlicker.prototype.textOverlay = function() {
        var ads = this.containerElement.querySelectorAll('.rev-ad');
        if (this.options.text_overlay) {
            revUtils.addClass(this.containerElement, 'rev-flicker-text-overlay');
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];
                ad.style.height = this.preloaderHeight + 'px';
                if (!ad.querySelector('.rev-overlay')) { // add rev-overlay if not already there
                    var overlay = document.createElement('div');
                    overlay.className = 'rev-overlay';
                    revUtils.append(ad.querySelector('.rev-image'), overlay);
                }
            }
        } else {
            revUtils.removeClass(this.containerElement, 'rev-flicker-text-overlay');
        }
    };

    RevFlicker.prototype.getOptionLimit = function() {
        return this.options.internal ? this.options.internal : this.options.sponsored;
    };

    RevFlicker.prototype.getCellHeight = function() {
        var cellHeight = this.preloaderHeight;
        if (!this.options.text_overlay && !this.options.text_right) {
            cellHeight += this.headlineHeight +
                this.headlineMarginTop + (this.options.hide_provider ? 0 : this.providerLineHeight);
            cellHeight += (this.options.ad_border) ? 2 : 0;
            cellHeight += this.providerMarginTop;
            cellHeight += this.providerMarginBottom;
        }
        return cellHeight;
    };

    RevFlicker.prototype.preData = function() {

        var content = this.flickity.element.querySelectorAll('.rev-content');
        var count = this.getOptionLimit();
        var index = content.length;

        if (content.length > count) {
            var index = count;
            for (var i = count; i < content.length; i++) {
                revUtils.remove(content[i]);
            }
        }

        var that = this;

        var imgWidth = typeof this.preloaderWidth === 'undefined' ? 'width:auto;' : 'width:' + this.preloaderWidth + 'px;';

        var proWidth =  'width: 50%;';
        if (!this.options.trending) {
            proWidth = 'width: 100%;';
        }

        for (var j = index; j < count; j++) {
            var html = '<div class="rev-ad" style="border-width:' + (that.options.ad_border ? '1px' : '0') + '">' +
                        '<a href="" rel="nofollow" target="_blank">';

            if (!this.options.text_top) {
                html += '<div class="rev-image" style="'+ imgWidth +'height:'+ that.preloaderHeight +'px"></div>';
            }

            html += '<div class="rev-headline-container">';
            html += '<div class="rev-headline" style="max-height:'+ that.headlineHeight +'px; padding:'+ that.headlineMarginTop +'px ' + that.innerMargin + 'px' + ' 0;"><h3 style="font-size:'+ that.headlineFontSize +'px; line-height:'+ that.headlineLineHeight +'px;"></h3></div>';
            html += '<div class="rev-provider-container">'+
                    ( that.options.hide_provider === false ? revDisclose.getProvider("rev-provider", 'padding: ' + that.providerMarginTop + 'px '  + that.innerMargin + 'px '+ that.providerMarginBottom +'px;font-size:' + that.providerFontSize + 'px;line-height:' + that.providerLineHeight + 'px;' + proWidth) : '');
            if (this.options.trending === true) {
                var theme = (that.options.trending_theme === "social") ? 'rev-hot-social' : 'rev-hot-flame';
                html += '<div class="rev-trending ' + theme + '"><div class="rev-hot-img"></div>' + that.rcruntimec() + '</div>';
            }

            html += '</div>';
            html += '</div>';
            if (this.options.text_top) {
                html += '<div class="rev-image" style="'+ imgWidth +'height:'+ that.preloaderHeight +'px"></div>';
            }
            html += '</a>' +
                    '</div>';
            var cell = document.createElement('div');

            cell.style.width = that.columnWidth + 'px';
            cell.style.marginRight = that.margin + 'px';

            revUtils.addClass(cell, 'rev-content');
            // next in line gets special class
            if (that.options.next_effect && j >= that.perRow) {
                revUtils.addClass(cell, 'rev-next');
            }

            cell.innerHTML = html;

            that.flickity.append(cell);
        }

        if (that.options.next_effect) {
            that.selectedIndex = that.flickity.selectedIndex;
            that.attachNextEffect();
        }
    };

    RevFlicker.prototype.rcruntimec = function()
    {
        var runtime = new Date().getTime().toString().substr(7,5);
        var newruntime = runtime.indexOf("0") == 0 ? 1 + runtime.substr(1) : runtime;

        newruntime = Math.round(newruntime / (Math.random() * 10)).toLocaleString();

        return newruntime.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
    }

    RevFlicker.prototype.getSerializedQueryParams = function() {
         if (!this.serializedQueryParams) {
            var serialized = revUtils.serialize(this.options.query_params);
            this.serializedQueryParams = serialized ? '&' + serialized : '';
         }
         return this.serializedQueryParams;
    };

    RevFlicker.prototype.registerImpressions = function(viewed) {
        var count = this.perRow;
        var offset = this.flickity.selectedIndex;

        var register = [];

        var max = ((offset + count) > this.getLimit()) ? this.getLimit() : (offset + count);
        for (var i = offset; i < max; i++) {
            if (typeof this.impressionTracker[i] == 'undefined') {
                register.push(i);
            }
            this.impressionTracker[i] = true;
        }

        if (register.length) {

            var url = this.generateUrl((register[0]), register.length, false, viewed);

            var that = this;
            revApi.request(url, function() {
                if(offset === 0 && true === that.options.beacons) { revApi.beacons.setPluginSource('flicker').attach(); }
            }, function() {
                //TODO: retry the call or log to db for later attempt
                for (var i = 0; i < register.length; i++) {
                    delete register[register[i]];
                }
            });
        }
    };

    RevFlicker.prototype.attachRegisterImpressions = function() {
        var that = this;
        this.flickity.on( 'cellSelect', function(ev, two) {
            that.registerImpressions(that.viewed);
        });
    };

    RevFlicker.prototype.attachNextEffect = function() {
        var that = this;
        this.emitter.on( 'cellSelect', function() {
            return that.nextEffect();
        });
    };

    RevFlicker.prototype.nextEffect = function() {
        if (this.options.next_effect) {
            if (!this.emitter.getListeners('cellSelect').length) {
                this.attachNextEffect();
            }
            if (this.selectedIndex != this.flickity.selectedIndex) { // only do something when index changes
                this.selectedIndex = this.flickity.selectedIndex;
                var content = this.flickity.element.querySelectorAll('.rev-content');
                var nextIndex = this.selectedIndex + this.perRow;
                var last = this.selectedIndex >= this.options.sponsored - this.perRow;
                for (var i = 0; i < content.length; i++) {
                    if (last) { // none left to half so all are visible
                        revUtils.removeClass(content[i], 'rev-next');
                    } else if (i >= nextIndex) {
                        revUtils.addClass(content[i], 'rev-next');
                    } else {
                        revUtils.removeClass(content[i], 'rev-next');
                    }
                }
            }
        } else {
            var content = this.flickity.element.querySelectorAll('.rev-content.rev-next');
            for (var i = 0; i < content.length; i++) {
                revUtils.removeClass(content[i], 'rev-next');
            }
        }
        return this.options.next_effect ? false : true;
    };



    RevFlicker.prototype.getData = function() {
        if (this.dataPromise) {
            return this.dataPromise;
        }

        var that = this;

        this.dataPromise = new Promise(function(resolve, reject) {
            // prime data - empty and not viewed
            var url = that.generateUrl(0, that.getLimit(), true, false);

            revApi.request(url, function(resp) {
                that.data = resp;

                that.updateDisplayedItems(false);

                that.emitter.emitEvent('ready');
                that.ready = true;

                var images = Array.prototype.slice.call(that.flickity.element.querySelectorAll('img')).slice(0, (that.perRow + 1));

                revUtils.imagesLoaded(images).once('done', function() {
                    revUtils.addClass(that.containerElement, 'loaded');
                });
                resolve();
            });
        });
    };

    RevFlicker.prototype.registerViewOnceVisible = function() {
        var that = this;
        this.emitter.once('visible', function() {
            revUtils.removeEventListener(window, 'scroll', that.visibleListener);
            that.registerView();
        });
    };

    RevFlicker.prototype.visible = function() {
        this.emitter.emitEvent('visible');
    };

    RevFlicker.prototype.attachVisibleListener = function() {
        this.visibleListener = revUtils.checkVisible.bind(this, this.containerElement, this.visible);
        revUtils.addEventListener(window, 'scroll', this.visibleListener);
    };

    RevFlicker.prototype.registerView = function() {
        if (!this.viewed) {
            this.viewed = true;

            // register a view without impressions(empty)
            var url = this.generateUrl(0, this.perRow, true, true);

            revApi.request(url, function() { return; });

            var that = this;
            // make sure we have some data
            this.dataPromise.then(function() {
                var anchors = that.containerElement.querySelectorAll('.rev-ad a');
                for (var i = 0; i < anchors.length; i++) {
                    anchors[i].setAttribute('href', anchors[i].getAttribute('href') + '&viewed=true');
                }
            });
        }
    };

    RevFlicker.prototype.updateDisplayedItems = function(viewed) {

        if (!this.data.length) { // if no data remove the container and call it a day
            revUtils.remove(this.containerElement);
            return;
        }

        var ads = this.flickity.element.querySelectorAll('.rev-ad');

        var dataIndex = 0;
        for (var i = 0; i < ads.length; i++) {
            if (!this.data[dataIndex]) { // go back to the beginning if there are more ads than data
                dataIndex = 0;
            }
            var ad = ads[i],
                data = this.data[dataIndex];

            revUtils.setImage(ad.querySelectorAll('.rev-image')[0], data.image);

            if (this.options.image_overlay !== false) {
                revUtils.imageOverlay(ad.querySelector('.rev-image'), data.content_type, this.options.image_overlay, this.options.image_overlay_position);
            }

            if (this.options.ad_overlay !== false) {
                revUtils.adOverlay(ad.querySelector('a'), data.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
            }

            ad.querySelectorAll('a')[0].setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', ''));
            ad.querySelectorAll('a')[0].title = data.headline;

            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            if (this.options.hide_provider === false) {
                ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
            }
            dataIndex++;
        }

        this.resize(); // kinda wonky, but hey

        this.registerImpressions(viewed);
    };

    RevFlicker.prototype.getLimit = function() {
        return parseInt(this.options.internal) > 0 ? parseInt(this.options.internal) : parseInt(this.options.sponsored);
    };

    RevFlicker.prototype.generateUrl = function(offset, count, empty, viewed) {
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
    };

    RevFlicker.prototype.getMaxHeadlineHeight = function() {
        var maxHeight = 0;
        if (this.options.text_right) { // based on preloaderHeight/ ad height
            var verticalSpace = this.preloaderHeight - this.providerLineHeight - this.providerMarginBottom - this.providerMarginTop;
            var headlines = Math.floor(verticalSpace / this.headlineLineHeight);
            maxHeight = headlines * this.headlineLineHeight;
        } else {
            var ads = this.flickity.element.querySelectorAll('.rev-ad');
            for (var i = 0; i < ads.length; i++) {
                if (!this.data[i]) {
                    continue;
                }
                var ad = ads[i];
                var el = document.createElement('div');
                el.style.position = 'absolute';
                el.style.zIndex = '100';
                el.style.padding = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
                el.innerHTML = '<h3 style="font-size:'+ this.headlineFontSize + 'px;line-height:'+ this.headlineLineHeight +'px">'+ this.data[i].headline + '</h3>';
                revUtils.prepend(ad, el); // do it this way b/c changin the element height on the fly needs a repaint and requestAnimationFrame is not avail in IE9
                maxHeight = Math.max(maxHeight, el.clientHeight);
                revUtils.remove(el);
            }
        }
        return maxHeight + this.headlineMarginTop;
    };

    return RevFlicker;
}));