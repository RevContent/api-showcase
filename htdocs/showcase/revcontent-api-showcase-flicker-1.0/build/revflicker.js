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
            beacons: true
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
        revUtils.appendStyle('/* inject:css */#rev-flicker:focus,.flickity-enabled:focus{outline:0}#rev-flicker,#rev-flicker .flickity-viewport,#rev-flicker .rev-flicker{clear:both}.flickity-enabled{position:relative}.flickity-viewport{overflow:hidden;position:relative;height:100%}.flickity-slider{position:absolute;width:100%;height:100%}.flickity-enabled.is-draggable{-webkit-tap-highlight-color:transparent;tap-highlight-color:transparent;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.flickity-enabled.is-draggable .flickity-viewport{cursor:move;cursor:grab}.flickity-enabled.is-draggable .flickity-viewport.is-pointer-down{cursor:grabbing}.flickity-prev-next-button{position:absolute;top:50%;width:44px;height:44px;border:none;border-radius:50%;background:#fff;background:hsla(0,0%,100%,.75);cursor:pointer;-webkit-transform:translateY(-50%);transform:translateY(-50%)}.flickity-prev-next-button:hover{background:#fff}.flickity-prev-next-button:focus{outline:0;box-shadow:0 0 0 5px #09F}.flickity-prev-next-button:active{filter:alpha(opacity=60);opacity:.6}.flickity-prev-next-button.previous{left:10px}.flickity-prev-next-button.next{right:10px}.flickity-rtl .flickity-prev-next-button.previous{left:auto;right:10px}.flickity-rtl .flickity-prev-next-button.next{right:auto;left:10px}.flickity-prev-next-button:disabled{filter:alpha(opacity=30);opacity:.3;cursor:auto}.flickity-prev-next-button svg{position:absolute;left:20%;top:20%;width:60%;height:60%}.flickity-prev-next-button .arrow{fill:#333}.flickity-prev-next-button.no-svg{color:#333;font-size:26px}.flickity-page-dots{position:absolute;width:100%;bottom:-25px;padding:0;margin:0;list-style:none;text-align:center;line-height:1}.flickity-rtl .flickity-page-dots{direction:rtl}.flickity-page-dots .dot{display:inline-block;width:10px;height:10px;margin:0 8px;background:#333;border-radius:50%;filter:alpha(opacity=25);opacity:.25;cursor:pointer}.flickity-page-dots .dot.is-selected{filter:alpha(opacity=100);opacity:1}#rev-flicker *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}#rev-flicker .rev-header{float:left;font-size:22px;line-height:32px;margin-bottom:0;text-align:left;width:auto}#rev-flicker .rev-sponsored{line-height:24px;font-size:12px}#rev-flicker .rev-sponsored.bottom-right,#rev-flicker .rev-sponsored.top-right{float:right}#rev-flicker .rev-sponsored.top-right a{vertical-align:-5px}#rev-flicker .flickity-prev-next-button{-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:1}#rev-flicker .flickity-prev-next-button:disabled{opacity:0}#rev-flicker .rev-sponsored a{color:#999}#rev-flicker a,#rev-flicker a:focus,#rev-flicker a:hover{text-decoration:none}#rev-flicker .rev-ad a{display:block;color:#222}#rev-flicker .rev-image{-webkit-transition:background .5s ease-in-out;transition:background .5s ease-in-out;background:#eee}#rev-flicker .rev-image img{-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:0;display:block;max-width:100%;height:auto}#rev-flicker.loaded .rev-image{background:0 0}#rev-flicker.loaded .rev-image img{opacity:1}#rev-flicker .rev-headline,#rev-flicker .rev-provider{margin:0;text-align:left}#rev-flicker .rev-headline{margin:0;overflow:hidden}#rev-flicker .rev-headline h3{font-size:16px;font-weight:500;letter-spacing:.2px;line-height:20px;margin:0}#rev-flicker .rev-provider{color:#999;font-weight:600}#rev-flicker .rev-ad{border-style:solid;border-color:#eee;border-radius:5px;overflow:hidden;background:#fff}#rev-flicker .rev-content{-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:1}#rev-flicker .rev-content.rev-next{-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:.5}#rev-flicker.rev-flicker-text-overlay .rev-ad{position:relative}#rev-flicker.rev-flicker-text-overlay .rev-ad a{height:100%}#rev-flicker.rev-flicker-text-overlay .rev-ad .rev-headline{position:absolute;bottom:4px;color:#fff;text-shadow:1px 1px rgba(0,0,0,.8);height:auto!important}#rev-flicker.rev-flicker-text-overlay .rev-ad .rev-overlay,#rev-flicker.rev-flicker-text-overlay .rev-ad .rev-overlay:after,#rev-flicker.rev-flicker-text-overlay .rev-ad .rev-overlay:before{border-radius:5px;position:absolute;top:0;height:100%;width:100%}#rev-flicker.rev-flicker-text-overlay .rev-ad .rev-overlay:after,#rev-flicker.rev-flicker-text-overlay .rev-ad .rev-overlay:before{-webkit-transition:all .5s ease-in-out;transition:all .5s ease-in-out;content:"";display:block}#rev-flicker.rev-flicker-text-overlay .rev-ad .rev-overlay:after{background:-webkit-linear-gradient(top,rgba(0,0,0,.1) 0,rgba(0,0,0,.65) 100%);background:linear-gradient(to bottom,rgba(0,0,0,.1) 0,rgba(0,0,0,.65) 100%)}#rev-flicker.rev-flicker-text-overlay .rev-ad .rev-overlay:before{opacity:0;background:-webkit-linear-gradient(top,rgba(0,0,0,0) 0,rgba(0,0,0,.4) 100%);background:linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(0,0,0,.4) 100%)}#rev-flicker.rev-flicker-text-overlay .rev-ad a:hover .rev-overlay:after{opacity:0}#rev-flicker.rev-flicker-text-overlay .rev-ad a:hover .rev-overlay:before{opacity:1}#rev-opt-out .rd-close-button{position:absolute;cursor:pointer;right:10px;z-index:10}#rev-opt-out a{cursor:pointer!important}#rev-opt-out .rd-box-wrap{display:none;z-index:2147483641}#rev-opt-out .rd-box-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;opacity:.5;filter:alpha(opacity=50);z-index:2147483641}#rev-opt-out .rd-vertical-offset{position:fixed;display:table-cell;top:0;width:100%;z-index:2147483642}#rev-opt-out .rd-box{position:absolute;vertical-align:middle;background-color:#fff;padding:10px;border:1px solid #555;border-radius:12px;-webkit-border-radius:12px;-moz-border-radius:12px;overflow:auto;box-shadow:3px 3px 10px 4px #555}#rev-opt-out .rd-normal{min-width:270px;max-width:435px;width:90%;margin:10px auto}#rev-opt-out .rd-full-screen{position:fixed;right:15px;left:15px;top:15px;bottom:15px}#rev-opt-out .rd-header{height:20px;position:absolute;right:0}#rev-opt-out .rd-about{font-family:Arial,sans-serif;font-size:14px;text-align:left;box-sizing:content-box;color:#333;padding:15px}#rev-opt-out .rd-about .rd-logo{background:url(https://serve.revcontent.com/assets/img/rc-logo.png) bottom center no-repeat;width:220px;height:48px;display:block;margin:0 auto}#rev-opt-out .rd-about p{margin:16px 0;color:#555;font-size:14px;line-height:16px}#rev-opt-out .rd-about p#main{text-align:left}#rev-opt-out .rd-about h2{color:#777;font-family:Arial,sans-serif;font-size:16px;line-height:18px}#rev-opt-out .rd-about a{color:#00cb43}#rev-opt-out .rd-well{border:1px solid #E0E0E0;padding:20px;text-align:center;border-radius:2px;margin:20px 0 0}#rev-opt-out .rd-well h2{margin-top:0}#rev-opt-out .rd-well p{margin-bottom:0}#rev-opt-out .rd-opt-out{text-align:center}#rev-opt-out .rd-opt-out a{margin-top:6px;display:inline-block}/* endinject */', 'rev-flicker');

        // append a new element to the flicker
        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-flicker';
        this.containerElement.setAttribute('class', 'rev-flicker');

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

        this.ellipsisTimer;

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
                ad.querySelectorAll('.rev-provider')[0].style.margin = '0 ' + this.innerMargin + 'px 0';
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
        this.checkEllipsis();
    };

    RevFlicker.prototype.checkEllipsis = function() {
        var that = this;
        clearTimeout(that.ellipsisTimer);
        that.ellipsisTimer = setTimeout(function() {
            that.doEllipsis();
        }, 300);
    };

    RevFlicker.prototype.doEllipsis = function() {
        var ads = this.flickity.element.querySelectorAll('.rev-content');
        if (ads.length > 0) {
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];
                var text = ad.querySelectorAll('a')[0].title;
                var el = ad.querySelectorAll('.rev-headline h3')[0];
                var newText = revUtils.ellipsisText(el, text, this.headlineHeight);
                ad.querySelectorAll('.rev-headline h3')[0].innerHTML = newText;
            }
        }
    };

    RevFlicker.prototype.appendElements = function() {
        if (this.header) {
            revUtils.remove(this.header);
        }
        this.header = document.createElement('h2');
        this.header.innerHTML = this.options.header;
        revUtils.addClass(this.header, 'rev-header');
        revUtils.prepend(this.containerElement, this.header);

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

        // font size is relative to width, other measurements are relative to this font size
        this.headlineFontSize = Math.max(14, ((width * .03).toFixed(2) / 1));
        this.headlineLineHeight = ((this.headlineFontSize * 1.2).toFixed(2) / 1);
        this.headlineHeight = ((this.headlineLineHeight * this.options.headline_size).toFixed(2) / 1);
        if (this.options.max_headline && this.getMaxHeadlineHeight() > 0) {
            this.headlineHeight = this.getMaxHeadlineHeight();
        }
        this.headlineMarginTop = ((this.headlineLineHeight * .4).toFixed(2) / 1);

        this.innerMargin = ((this.headlineMarginTop * .3).toFixed(2) / 1);

        this.providerFontSize = Math.max(11, ((this.headlineLineHeight / 2).toFixed(2) / 1));
        this.providerLineHeight = ((this.providerFontSize * 1.5).toFixed(2) / 1);

        this.columnWidth = (((this.containerWidth - (this.margin * this.perRow)) / (this.perRow + (1/2))).toFixed(2) / 1);

        this.preloaderHeight = Math.round((this.columnWidth - ( this.options.ad_border ? 2 : 0 )) * (this.imageHeight / this.imageWidth));
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

    RevFlicker.prototype.getCellHeight = function() {
        var cellHeight = this.preloaderHeight;
        if (!this.options.text_overlay) {
            cellHeight += this.headlineHeight +
                this.headlineMarginTop + (this.options.hide_provider ? 0 : this.providerLineHeight) ;
            cellHeight += (this.options.ad_border) ? 2 : 0;
        }
        return cellHeight;
    }

    RevFlicker.prototype.preData = function() {

        var content = this.flickity.element.querySelectorAll('.rev-content');
        var index = content.length;
        if (content.length > this.options.sponsored) {
            var index = this.options.sponsored;
            for (var i = this.options.sponsored; i < content.length; i++) {
                revUtils.remove(content[i]);
            }
        }

        var that = this;

        for (var j = index; j < this.options.sponsored; j++) {
            var html = '<div class="rev-ad" style="height: '+ that.getCellHeight() +'px; border-width:' + (that.options.ad_border ? '1px' : '0') + '">' +
                        '<a href="" rel="nofollow" target="_blank">' +
                            '<div class="rev-image" style="height:'+ that.preloaderHeight +'px"><img src=""/></div>' +
                            '<div class="rev-headline" style="max-height:'+ that.headlineHeight +'px; margin:'+ that.headlineMarginTop +'px ' + that.innerMargin + 'px' + ' 0;"><h3 style="font-size:'+ that.headlineFontSize +'px; line-height:'+ that.headlineLineHeight +'px;"></h3></div>' +
                            ( that.options.hide_provider === false ? revDisclose.getProvider("rev-provider", 'margin: 0 '  + that.innerMargin + 'px 0;font-size:' + that.providerFontSize + 'px;line-height:' + that.providerLineHeight + 'px;height:' + that.providerLineHeight + 'px;') : '') +
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
        var optionLimit = this.options.internal ? this.options.internal : this.options.sponsored;

        // if its the first time register the intial viewed impressions
        var count = this.perRow;
        var offset = 0;

        if (!initial) { //otherwise register the new one
            count = 1;
            offset = this.flickity.selectedIndex;

            if ( (offset + (this.perRow - 1)) < optionLimit ) {
                offset += (this.perRow - 1);
            }
        }

        var impressionsUrl = this.options.url + '?&api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&api_source=flick';

        impressionsUrl += '&sponsored_count=' + (this.options.internal ? 0 : count) + '&internal_count=' + (this.options.internal ? count : 0) + '&sponsored_offset='+ (this.options.internal ? 0 : offset) +'&internal_offset=' + (this.options.internal ? offset : 0);

        var that = this;
        // don't do the same one twice, this could be improved I am sure
        if ( typeof this.impressionTracker[offset + '_' + count] == 'undefined') {
            revApi.request(impressionsUrl, function() {
                that.impressionTracker[offset + '_' + count] = true;
                if(offset === 0 && true === that.options.beacons) { revApi.beacons.attach(); }
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

        var that = this;
        revApi.request(url, function(resp) {

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

            imagesLoaded( that.flickity.element, function() {
                revUtils.addClass(that.containerElement, 'loaded');
                that.resize();
                that.registerImpressions(true);
                that.attachRegisterImpressions();
            });

        });
    };

    RevFlicker.prototype.getMaxHeadlineHeight = function() {
        var maxHeadlineHeight = 0;
        var that = this;
        var ads = that.flickity.element.querySelectorAll('.rev-ad');
        if (ads.length > 0) {
            var el = ads[0].querySelectorAll('.rev-headline h3')[0];
            var t = el.cloneNode(true);
            t.style.visibility = 'hidden';
            t.style.height = 'auto';
            revUtils.append(el.parentNode, t);
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];
                t.innerHTML = ad.querySelectorAll('a')[0].title;
                if(t.clientHeight > maxHeadlineHeight) {
                    maxHeadlineHeight = t.clientHeight;
                }
            }
            revUtils.remove(t);
            var numLines = Math.ceil(maxHeadlineHeight / that.headlineLineHeight);
            maxHeadlineHeight = numLines * that.headlineLineHeight;
        }
        return maxHeadlineHeight;
    };



    return RevFlicker;

}));