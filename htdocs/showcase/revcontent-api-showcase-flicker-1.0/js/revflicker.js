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
    dots: false,
    header: 'Trending Now',
    devices: [
        'phone', 'tablet', 'desktop'
    ],
    url: 'https://trends.revcontent.com/api/v1/'
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevFlicker = factory(window, window.revUtils, window.revDetect, window.revApi);

}( window, function factory(window, revUtils, revDetect, revApi) {
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
            dots: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/'
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

        var that = this;
        //append injrected style
        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-flicker');

        // append a new element to the flicker
        var flickerElement = document.createElement('div');
        flickerElement.id = 'rev-flicker';
        flickerElement.class = 'rev-flicker';
        var innerElement = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        innerElement.style.width = '100%';
        revUtils.append(innerElement, flickerElement);

        // create flickity
        this.flickity = new Flickity( flickerElement, {
            prevNextButtons: revDetect.mobile() ? this.options.show_arrows.mobile : this.options.show_arrows.desktop,
            pageDots: this.options.dots,
            cellAlign: 'left',
            percentPosition: false,
            wrapAround: true
        });
        // wrapper class
        revUtils.addClass(this.flickity.element, 'rev-flicker');
        // HACK for Chrome using emitter to wait for element container to be ready
        this.emitter = new EventEmitter();
        this.getContainerWidth();
        this.emitter.on('containerReady', function() {
            that.setUp();
            that.preData();
            that.getData();
        });

        if (typeof RevDialog !== "undefined") {
            window.revDialog = new RevDialog();
        }

        revUtils.addEventListener(window, 'resize', function() {
            that.resize();
        });


    };

    RevFlicker.prototype.resize = function() {
        this.containerWidth = this.flickity.element.offsetWidth;

        this.setUp();

        var ads = this.flickity.element.querySelectorAll('.rev-content');

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

        this.flickity.resize();

        if (this.options.next_effect) {
            this.selectedIndex = -1;
            this.nextEffect();
        }
    };

    RevFlicker.prototype.appendElements = function() {
        var header = document.createElement('h2');
        header.innerHTML = this.options.header;
        revUtils.addClass(header, 'rev-header');
        revUtils.prepend(this.flickity.element, header);

        var sponsored = document.createElement('div');
        revUtils.addClass(sponsored, 'rev-sponsored');
        sponsored.innerHTML = '<a id="sponsored-link" onclick="revDialog.showDialog();" >Sponsored by Revcontent</a>';
        if (this.options.rev_position == 'top_right') {
            revUtils.addClass(sponsored, 'top-right')
            revUtils.prepend(this.flickity.element, sponsored);
        } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
            revUtils.addClass(sponsored, this.options.rev_position.replace('_', '-'));
            revUtils.append(this.flickity.element, sponsored);
        }
    };

    RevFlicker.prototype.getContainerWidth = function() {
        // HACK for Chrome - sometimes the width will be 0
        var that = this;
        function check() {
            var containerWidth = that.flickity.element.offsetWidth;
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

    RevFlicker.prototype.setUp = function() {
        // determine elements per row based on container width
        if (this.containerWidth >= 1500) {
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

        var width = this.containerWidth / this.perRow;

        this.margin = ((width * .05).toFixed(2) / 1);
        this.innerMargin = ((width * .02).toFixed(2) / 1);

        // font size is relative to width, other measurements are relative to this font size
        this.headlineFontSize = Math.max(14, ((width * .03).toFixed(2) / 1));
        this.headlineLineHeight = ((this.headlineFontSize * 1.25).toFixed(2) / 1);
        this.headlineHeight = ((this.headlineLineHeight * 2).toFixed(2) / 1);
        this.headlineMarginTop = ((this.headlineHeight * .2).toFixed(2) / 1);

        this.providerFontSize = Math.max(11, ((this.headlineLineHeight / 2).toFixed(2) / 1));
        this.providerLineHeight = ((this.providerFontSize * 1.25).toFixed(2) / 1);
        this.providerMargin = ((this.providerLineHeight * .2).toFixed(2) / 1);

        this.columnWidth = (((this.containerWidth - (this.margin * this.perRow)) / (this.perRow + (1/2))).toFixed(2) / 1);

        this.preloaderHeight = Math.round(this.columnWidth * (this.imageHeight / this.imageWidth));
    };

    RevFlicker.prototype.preData = function() {
        var that = this;
        for (var i = 0; i < this.options.sponsored; i++) {
            var html = '<div class="rev-ad">' +
                        '<a href="" target="_blank">' +
                            '<div class="rev-image" style="height:'+ that.preloaderHeight +'px"><img src=""/></div>' +
                            '<div class="rev-headline" style="height:'+ that.headlineHeight +'px; margin:'+ that.headlineMarginTop +'px ' + that.innerMargin + 'px' + ' 0;"><h3 style="font-size:'+ that.headlineFontSize +'px; line-height:'+ that.headlineLineHeight +'px;"></h3></div>' +
                            '<div style="margin:' + that.providerMargin +'px '  + that.innerMargin + 'px ' + that.providerMargin +'px;font-size:'+ that.providerFontSize +'px;line-height:'+ that.providerLineHeight +'px;height:'+ that.providerLineHeight +'px;" class="rev-provider"></div>' +
                        '</a>' +
                    '</div>';
            var cell = document.createElement('div');

            cell.style.width = that.columnWidth + 'px';
            cell.style.marginRight = that.margin + 'px';

            revUtils.addClass(cell, 'rev-content');
            // next in line gets special class
            if (that.options.next_effect && i >= that.perRow) {
                revUtils.addClass(cell, 'rev-next');
            }

            cell.innerHTML = html;

            that.flickity.append(cell);
        }

        // append elements
        that.appendElements();

        if (that.options.next_effect) {
            that.selectedIndex = that.flickity.selectedIndex;
            that.flickity.on( 'cellSelect', function() {
                that.nextEffect();
            });
        }
    };

    RevFlicker.prototype.nextEffect = function() {
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
    };

    RevFlicker.prototype.getData = function() {

        var url = this.options.url + '?img_h='+ this.imageHeight +'&img_w='+ this.imageWidth +'&api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&sponsored_count=' + this.options.sponsored + '&sponsored_offset=0&internal_count=0&api_source=flick';
        var that = this;
        revApi.request(url, function(resp) {

            var ads = that.flickity.element.querySelectorAll('.rev-ad');

            for (var i = 0; i < resp.length; i++) {
                var ad = ads[i],
                    data = resp[i];
                ad.querySelectorAll('a')[0].setAttribute('href', data.url);
                ad.querySelectorAll('img')[0].setAttribute('src', data.image);
                ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
                ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
            }

            imagesLoaded( that.flickity.element, function() {
                revUtils.addClass(that.flickity.element, 'loaded');
            });

        });
    };

    return RevFlicker;

}));