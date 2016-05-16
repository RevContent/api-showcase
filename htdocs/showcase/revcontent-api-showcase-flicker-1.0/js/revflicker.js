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
            image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            next_effect: true,
            show_arrows: {
                mobile: false,
                desktop: true
            },
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
            text_right: false,
            text_right_height: 100,
            next_width: false,
            css: '',
            user_ip: false,
            user_agent: false,
            hide_header: false,
            hide_disclosure: false
        };

        // merge options
        this.options = revUtils.extend(defaults, opts);

        // param errors
        if (revUtils.validateApiParams(this.options).length) {
            return;
        }
        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        this.maxHeadlineHeight = 0;

        this.impressionTracker = {};

        var that = this;
        //append injrected style
        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-flicker', this.options.css);

        // append a new element to the flicker
        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-flicker';
        this.containerElement.setAttribute('class', 'rev-flicker');
        revUtils.addClass(this.containerElement, 'rev-flicker-' + (this.options.text_right ? 'text-right' : 'text-bottom'));

        this.flickerElement = document.createElement('div');

        this.innerElement = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.innerElement.style.width = '100%';

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
        // HACK for Chrome using emitter to wait for element container to be ready
        this.emitter = new EventEmitter();
        this.getContainerWidth();
        this.emitter.on('containerReady', function() {
            that.setUp();
            that.appendElements();
            that.preData();
            that.textOverlay();
            that.getData();
        });

        revUtils.addEventListener(window, 'resize', function() {
            that.resize();
        });

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
            ad.querySelectorAll('.rev-ad')[0].style.height = this.getCellHeight() + 'px';

            ad.querySelectorAll('.rev-image')[0].style.height = this.preloaderHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.maxHeight = this.headlineHeight + 'px';
            ad.querySelectorAll('.rev-headline')[0].style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';

            ad.querySelectorAll('.rev-headline h3')[0].style.fontSize = this.headlineFontSize +'px';
            ad.querySelectorAll('.rev-headline h3')[0].style.lineHeight = this.headlineLineHeight +'px';
            if(that.options.hide_provider === false) {
                ad.querySelectorAll('.rev-provider')[0].style.margin = this.providerMarginTop + 'px '  + this.innerMargin + 'px '+ this.providerMarginBottom +'px';
                ad.querySelectorAll('.rev-provider')[0].style.fontSize = this.providerFontSize + 'px';
                ad.querySelectorAll('.rev-provider')[0].style.lineHeight = this.providerLineHeight + 'px';
                ad.querySelectorAll('.rev-provider')[0].style.height = this.providerLineHeight + 'px';
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
        } else if (this.options.image_ratio == 'square') {
            this.imageHeight = 400;
            this.imageWidth = 400;
        } else if (this.options.image_ratio == 'rectangle') {
            this.imageHeight = 300;
            this.imageWidth = 400;
        } else if (this.options.image_ratio == 'wide_rectangle') {
            this.imageHeight = 450;
            this.imageWidth = 800;
        }

        this.headlineLineHeight = this.options.size.headline_line_height ? this.options.size.headline_line_height : (this.columnWidth * this.lineHeightMultiplier).toFixed(2) / 1;
        if (!this.options.size.headline_line_height && this.headlineLineHeight < 16) {
            this.headlineLineHeight = 16;
        }
        this.headlineFontSize = Math.min(this.headlineLineHeight, (this.headlineLineHeight * this.fontSizeMultiplier).toFixed(2) / 1);

        this.headlineHeight = ((this.headlineLineHeight * this.options.headline_size).toFixed(2) / 1);

        this.headlineMarginTop = this.options.size.headline_margin_top ? this.options.size.headline_margin_top : ((this.headlineLineHeight * .4).toFixed(2) / 1);
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
            this.preloaderHeight = this.options.text_right_height;
            this.preloaderWidth = Math.round(this.preloaderHeight * (this.imageWidth / this.imageHeight) * 100) / 100;
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
    }

    RevFlicker.prototype.textOverlay = function() {
        var ads = this.containerElement.querySelectorAll('.rev-ad');
        if (this.options.text_overlay) {
            revUtils.addClass(this.containerElement, 'rev-flicker-text-overlay');
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];
                ad.style.height = this.preloaderHeight + 'px';
                if (!ad.querySelectorAll('.rev-overlay').length) { // add rev-overlay if not already there
                    ad.querySelectorAll('img')[0].insertAdjacentHTML('afterend', '<div class="rev-overlay"></div>');
                }
            }
        } else {
            revUtils.removeClass(this.containerElement, 'rev-flicker-text-overlay');
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];
                ad.style.height = this.getCellHeight() + 'px';
            }
        }
    }

    RevFlicker.prototype.getOptionLimit = function(initial) {
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
    }

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

        for (var j = index; j < count; j++) {
            var html = '<div class="rev-ad" style="height: '+ that.getCellHeight() +'px; border-width:' + (that.options.ad_border ? '1px' : '0') + '">' +
                        '<a href="" rel="nofollow" target="_blank">' +
                            '<div class="rev-image" style="'+ imgWidth +'height:'+ that.preloaderHeight +'px"><img src=""/></div>' +
                            '<div class="rev-headline" style="max-height:'+ that.headlineHeight +'px; margin:'+ that.headlineMarginTop +'px ' + that.innerMargin + 'px' + ' 0;"><h3 style="font-size:'+ that.headlineFontSize +'px; line-height:'+ that.headlineLineHeight +'px;"></h3></div>' +
                            ( that.options.hide_provider === false ? revDisclose.getProvider("rev-provider", 'margin: ' + that.providerMarginTop + 'px '  + that.innerMargin + 'px '+ that.providerMarginBottom +'px;font-size:' + that.providerFontSize + 'px;line-height:' + that.providerLineHeight + 'px;height:' + that.providerLineHeight + 'px;') : '') +
                        '</a>' +
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

    RevFlicker.prototype.registerImpressions = function(initial) {
        // if its the first time register the intial viewed impressions
        var count = this.perRow;
        var offset = 0;

        if (!initial) { //otherwise register the new one
            count = 1;
            offset = this.flickity.selectedIndex;

            if ( (offset + (this.perRow - 1)) < this.getOptionLimit() ) {
                offset += (this.perRow - 1);
            }
        }

        var impressionsUrl = this.options.url + '?&api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&api_source=flick';

        impressionsUrl += '&sponsored_count=' + (this.options.internal ? 0 : count) + '&internal_count=' + (this.options.internal ? count : 0) + '&sponsored_offset='+ (this.options.internal ? 0 : offset) +'&internal_offset=' + (this.options.internal ? offset : 0);

        var that = this;
        // don't do the same one twice, this could be improved I am sure
        if ( typeof this.impressionTracker[offset + '_' + count] == 'undefined') {

            if (offset == 0 && count > 1) {
                for (var i = 1; i < count; i++) {
                    that.impressionTracker[i + '_1'] = true;
                }
            }

            that.impressionTracker[offset + '_' + count] = true;

            revApi.request(impressionsUrl, function() {
                if(offset === 0 && true === that.options.beacons) { revApi.beacons.setPluginSource('flicker').attach(); }
            }, function() {
                delete that.impressionTracker[offset + '_' + count]; //unset on failure in case we somehow try it again
                //TODO: retry the call or log to db for later attempt
            });
        }
    }

    RevFlicker.prototype.attachRegisterImpressions = function() {
        var that = this;
        this.flickity.on( 'cellSelect', function() {
            that.registerImpressions()
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

        var sponsored = this.options.internal ? 0 : this.options.sponsored;
        var internal = this.options.internal ? this.options.internal : 0;

        var url = this.options.url + '?uitm=true&img_h='+ this.imageHeight +'&img_w='+ this.imageWidth +'&api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&sponsored_count=' + sponsored + '&internal_count=' + internal + '&sponsored_offset=0&internal_offset=0&api_source=flick';
        // user ip or user_agent passed?
        url += this.options.user_ip ? '&user_ip=' + this.options.user_ip : '';
        url += this.options.user_agent ? '&user_agent=' + this.options.user_agent : '';

        var that = this;
        revApi.request(url, function(resp) {

            that.data = resp;

            var ads = that.flickity.element.querySelectorAll('.rev-ad');

            for (var i = 0; i < resp.length; i++) {
                var ad = ads[i],
                    data = resp[i];
                ad.querySelectorAll('a')[0].setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', ''));
                ad.querySelectorAll('a')[0].title = data.headline;
                ad.querySelectorAll('img')[0].setAttribute('src', data.image);
                ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
                if(that.options.hide_provider === false){
                    ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
                }
            }

            that.resize();

            imagesLoaded( that.flickity.element, function() {
                revUtils.addClass(that.containerElement, 'loaded');
                that.registerImpressions(true);
                that.attachRegisterImpressions();
            });

        });
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
                var ad = ads[i];
                var el = document.createElement('div');
                el.style.position = 'absolute';
                el.style.zIndex = '100';
                el.style.margin = this.headlineMarginTop +'px ' + this.innerMargin + 'px 0';
                el.innerHTML = '<h3 style="font-size:'+ this.headlineFontSize + 'px;line-height:'+ this.headlineLineHeight +'px">'+ this.data[i].headline + '</h3>';
                revUtils.prepend(ad, el); // do it this way b/c changin the element height on the fly needs a repaint and requestAnimationFrame is not avail in IE9
                maxHeight = Math.max(maxHeight, el.clientHeight);
                revUtils.remove(el);
            }
        }
        return maxHeight;
    };

    return RevFlicker;
}));