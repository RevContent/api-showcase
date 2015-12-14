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

RevSlider({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    show_arrows: {
        mobile: false,
        desktop: true
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
        xs: 1,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
        xxl: 7
    },
    image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
    rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
    header: 'Trending Now',
    devices: [
        'phone', 'tablet', 'desktop'
    ],
    url: 'https://trends.revcontent.com/api/v1/',
    ad_border: true
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevSlider = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDialog);

}( window, function factory(window, revUtils, revDetect, revApi, revDialog) {
'use strict';

    var RevSlider = function(opts) {

        var defaults = {
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
                xs: 1,
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
                mobile: false,
                desktop: true
            },
            internal: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/',
            ad_border: true,
            headline_size: 2,
            max_headline: false,
            text_overlay: false,
            vertical: false,
            page_increment: true,
            wrap_pages: true,
            show_padding: true,
            pages: 4
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

        revUtils.appendStyle('/* inject:css */#rev-slider a,#rev-slider a:focus,#rev-slider a:hover{text-decoration:none}#rev-slider,#rev-slider #rev-slider-grid,#rev-slider #rev-slider-grid-container{padding:0;width:100%}#rev-slider #rev-slider-grid{padding:0}#rev-slider #rev-slider-grid-container{position:relative;width:100%;overflow:hidden}#rev-slider #rev-slider-grid-container .rev-border-clip{position:absolute;z-index:10}#rev-slider{clear:both}#rev-slider *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}#rev-slider .rev-chevron{position:absolute;font-family:arial narrow;height:37px;font-size:58px;color:#fff;line-height:.5;top:50%}.rc-about,.rc-about h2{font-family:Arial,sans-serif}#rev-slider #rev-slider-grid-container .rev-btn-wrapper{position:absolute;height:100%;width:40px;text-align:center;z-index:10;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;opacity:0;-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out}#rev-slider #rev-slider-grid-container .top-bottom{height:40px;width:100%}#rev-slider #rev-slider-grid-container .rev-btn-container{position:relative;background-color:#333;opacity:.3;-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;height:100%;text-align:center;border-radius:4px}#rev-slider #rev-slider-grid-container .rev-btn-container:hover{opacity:.8}#rev-slider a{color:inherit}#rev-slider:focus{outline:0}#rev-slider .rev-header{float:left;font-size:22px;line-height:32px;margin-bottom:0;text-align:left;width:auto}#rev-slider .rev-sponsored{line-height:24px;font-size:12px}#rev-slider .rev-sponsored.bottom-right,#rev-slider .rev-sponsored.top-right{float:right}#rev-slider .rev-sponsored.top-right a{vertical-align:-5px}#rev-slider .rev-sponsored a{color:#999}#rev-slider .rev-ad a{display:block;color:#222}#rev-slider .rev-image{position:relative;-webkit-transition:background .5s ease-in-out;transition:background .5s ease-in-out;background:#eee}#rev-slider .rev-image img{position:absolute;top:0;left:0;-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:0;display:block;max-width:100%;height:auto}#rev-slider.loaded .rev-image{background:0 0}#rev-slider.loaded .rev-image img{opacity:1}#rev-slider .rev-headline,#rev-slider .rev-provider{margin:0 10px;text-align:left}#rev-slider .rev-headline{margin-top:12px;height:40px;overflow:hidden}#rev-slider .rev-headline h3{font-size:16px;font-weight:500;letter-spacing:.2px;line-height:20px;margin:0}#rev-slider .rev-provider{font-size:12px;color:#888;line-height:30px;height:30px}#rev-slider .rev-ad{border-radius:5px;overflow:hidden;background:#fff}#rev-slider .rev-content{-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:1}#rev-slider .rev-content.rev-next{-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:.5}#rev-slider.rev-slider-text-overlay .rev-ad{position:relative}#rev-slider.rev-slider-text-overlay .rev-ad a{height:100%}#rev-slider.rev-slider-text-overlay .rev-ad .rev-headline{position:absolute;bottom:4px;color:#fff;text-shadow:1px 1px rgba(0,0,0,.8);height:auto!important}#rev-slider.rev-slider-text-overlay .rev-ad .rev-overlay,#rev-slider.rev-slider-text-overlay .rev-ad .rev-overlay:after,#rev-slider.rev-slider-text-overlay .rev-ad .rev-overlay:before{border-radius:5px;position:absolute;top:0;height:100%;width:100%}#rev-slider.rev-slider-text-overlay .rev-ad .rev-overlay:after,#rev-slider.rev-slider-text-overlay .rev-ad .rev-overlay:before{-webkit-transition:all .5s ease-in-out;transition:all .5s ease-in-out;content:"";display:block}#rev-slider.rev-slider-text-overlay .rev-ad .rev-overlay:after{background:-webkit-linear-gradient(top,rgba(0,0,0,.1) 0,rgba(0,0,0,.65) 100%);background:linear-gradient(to bottom,rgba(0,0,0,.1) 0,rgba(0,0,0,.65) 100%)}#rev-slider.rev-slider-text-overlay .rev-ad .rev-overlay:before{opacity:0;background:-webkit-linear-gradient(top,rgba(0,0,0,0) 0,rgba(0,0,0,.4) 100%);background:linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(0,0,0,.4) 100%)}#rev-slider.rev-slider-text-overlay .rev-ad a:hover .rev-overlay:after{opacity:0}#rev-slider.rev-slider-text-overlay .rev-ad a:hover .rev-overlay:before{opacity:1}.slideOutLeft{-webkit-animation-name:slideOutLeft;animation-name:slideOutLeft;-webkit-animation-duration:1s;animation-duration:1s;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;visibility:visible!important}.slideInLeft,.slideOutRight{-webkit-animation-duration:1s;-webkit-animation-timing-function:ease-in-out;visibility:visible!important}@-webkit-keyframes slideOutLeft{0%{-webkit-transform:translateX(0);transform:translateX(0)}100%{-webkit-transform:translateX(-100%);transform:translateX(-100%)}}@keyframes slideOutLeft{0%{-webkit-transform:translateX(0);transform:translateX(0)}100%{-webkit-transform:translateX(-100%);transform:translateX(-100%)}}.slideInLeft{-webkit-animation-name:slideInLeft;animation-name:slideInLeft;animation-duration:1s;animation-timing-function:ease-in-out}@-webkit-keyframes slideInLeft{0%{-webkit-transform:translateX(100%);transform:translateX(100%)}100%{-webkit-transform:translateX(0);transform:translateX(0)}}@keyframes slideInLeft{0%{-webkit-transform:translateX(100%);transform:translateX(100%)}100%{-webkit-transform:translateX(0);transform:translateX(0)}}.slideOutRight{-webkit-animation-name:slideOutRight;animation-name:slideOutRight;animation-duration:1s;animation-timing-function:ease-in-out}.slideInRight,.slideOutUp{-webkit-animation-duration:1s;-webkit-animation-timing-function:ease-in-out}@-webkit-keyframes slideOutRight{0%{-webkit-transform:translateX(0);transform:translateX(0)}100%{-webkit-transform:translateX(100%);transform:translateX(100%)}}@keyframes slideOutRight{0%{-webkit-transform:translateX(0);transform:translateX(0)}100%{-webkit-transform:translateX(100%);transform:translateX(100%)}}.slideInRight{-webkit-animation-name:slideInRight;animation-name:slideInRight;animation-duration:1s;animation-timing-function:ease-in-out;visibility:visible!important}@-webkit-keyframes slideInRight{0%{-webkit-transform:translateX(-100%);transform:translateX(-100%)}100%{-webkit-transform:translateX(0);transform:translateX(0)}}@keyframes slideInRight{0%{-webkit-transform:translateX(-100%);transform:translateX(-100%)}100%{-webkit-transform:translateX(0);transform:translateX(0)}}.slideOutUp{-webkit-animation-name:slideOutUp;animation-name:slideOutUp;animation-duration:1s;animation-timing-function:ease-in-out;visibility:visible!important}.slideInUp,.slideOutDown{-webkit-animation-duration:1s;-webkit-animation-timing-function:ease-in-out;visibility:visible!important}@-webkit-keyframes slideOutUp{0%{-webkit-transform:translateY(0);transform:translateY(0)}100%{-webkit-transform:translateY(-100%);transform:translateY(-100%)}}@keyframes slideOutUp{0%{-webkit-transform:translateY(0);transform:translateY(0)}100%{-webkit-transform:translateY(-100%);transform:translateY(-100%)}}.slideInUp{-webkit-animation-name:slideInUp;animation-name:slideInUp;animation-duration:1s;animation-timing-function:ease-in-out}@-webkit-keyframes slideInUp{0%{-webkit-transform:translateY(100%);transform:translateY(100%)}100%{-webkit-transform:translateY(0);transform:translateY(0)}}@keyframes slideInUp{0%{-webkit-transform:translateY(100%);transform:translateY(100%)}100%{-webkit-transform:translateY(0);transform:translateY(0)}}.slideOutDown{-webkit-animation-name:slideOutDown;animation-name:slideOutDown;animation-duration:1s;animation-timing-function:ease-in-out}@-webkit-keyframes slideOutDown{0%{-webkit-transform:translateY(0);transform:translateY(0)}100%{-webkit-transform:translateY(100%);transform:translateY(100%)}}@keyframes slideOutDown{0%{-webkit-transform:translateY(0);transform:translateY(0)}100%{-webkit-transform:translateY(100%);transform:translateY(100%)}}.slideInDown{-webkit-animation-name:slideInDown;animation-name:slideInDown;-webkit-animation-duration:1s;animation-duration:1s;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;visibility:visible!important}@-webkit-keyframes slideInDown{0%{-webkit-transform:translateY(-100%);transform:translateY(-100%)}100%{-webkit-transform:translateY(0);transform:translateY(0)}}@keyframes slideInDown{0%{-webkit-transform:translateY(-100%);transform:translateY(-100%)}100%{-webkit-transform:translateY(0);transform:translateY(0)}}#rev-opt-out .rd-close-button{position:absolute;cursor:pointer;right:10px;z-index:10}a{cursor:pointer!important}#rev-opt-out .rd-box-wrap{display:none;z-index:2147483641}#rev-opt-out .rd-box-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;opacity:.5;filter:alpha(opacity=50);z-index:2147483641}#rev-opt-out .rd-vertical-offset{position:fixed;display:table-cell;top:0;width:100%;z-index:2147483642}#rev-opt-out .rd-box{position:absolute;vertical-align:middle;background-color:#fff;padding:10px;border:1px solid #555;border-radius:12px;-webkit-border-radius:12px;-moz-border-radius:12px;overflow:auto;box-shadow:3px 3px 10px 4px #555}#rev-opt-out .rd-normal{min-width:270px;max-width:435px;width:90%;margin:10px auto}#rev-opt-out .rd-full-screen{position:fixed;right:15px;left:15px;top:15px;bottom:15px}#rev-opt-out .rd-header{height:20px;position:absolute;right:0}.rc-about{font-size:14px;text-align:left;box-sizing:content-box;color:#333;padding:15px}.rc-about .rc-logo{background:url(https://www.revcontent.com/assets/img/rc-logo.png) bottom center no-repeat;width:220px;height:48px;display:block;margin:0 auto}.rc-about p{margin:16px 0;color:#555;font-size:14px;line-height:16px}.rc-about p#main{text-align:left}.rc-opt-out,.rc-well{text-align:center}.rc-about h2{color:#777;font-size:16px;line-height:18px}.rc-about a{color:#00cb43}.rc-well{border:1px solid #E0E0E0;padding:20px;border-radius:2px;margin:20px 0 0}.rc-well h2{margin-top:0}.rc-well p{margin-bottom:0}.rc-opt-out a{margin-top:6px;display:inline-block}/* endinject */', 'rev-slider');

        this.contentItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider';
        this.containerElement.class = 'rev-slider';

        var gridContainerElement = document.createElement('div');
        gridContainerElement.id = 'rev-slider-grid-container';

        this.gridElement = document.createElement('div');
        this.gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';



        revUtils.append(this.containerElement, gridContainerElement);

        revUtils.append(gridContainerElement, this.gridElement);

        revUtils.append(this.element, this.containerElement);

        this.initButtons();

        this.grid = new AnyGrid(this.gridElement, { masonry: false, perRow: this.options.per_row, transitionDuration: 0, isResizeBound: this.options.is_resize_bound});

        this.grid.on('resized', function() {
            that.resize();
        });

        this.page = 1;
        this.previousPage = 0;

        this.setUp();

        this.getData();

        this.appendElements();

        for (var i = 0; i < this.limit; i++) {
            this.appendCell();
        };

        this.grid.reloadItems();
        this.grid.layout();

        this.attachButtonEvents();

        this.textOverlay();

        this.ellipsisTimer;

        this.impressionTracker = [];
    };

    RevSlider.prototype.createNextPageGrid = function() {
        var that = this;
        var gridContainerElement = document.getElementById('rev-slider-grid-container');
        var previousGridElement = this.gridElement;
        previousGridElement.id = 'rev-slider-grid-prev';

        var nextGridElement = document.createElement('div');
        nextGridElement.id = 'rev-slider-grid';

        revUtils.append(gridContainerElement, nextGridElement);
        var nextGrid = new AnyGrid(nextGridElement, { masonry: false, perRow: this.options.per_row, transitionDuration: 0, isResizeBound: this.options.is_resize_bound});
        nextGrid.on('resized', function() {
            that.resize();
        });

        nextGridElement.style.position = 'absolute';
        var gridTop = '-' + this.grid.element.offsetHeight + 'px;';
        nextGridElement.setAttribute('style', 'position: absolute; top: 0px; left: 0px;');

        var outClass = 'slideOutLeft';
        var inClass = 'slideInLeft';
        if (this.page > this.previousPage) {
            // slide left or up
            outClass = (this.options.vertical) ? 'slideOutUp' : 'slideOutLeft';
            inClass = (this.options.vertical) ? 'slideInUp' : 'slideInLeft';
        } else {
            // Slide right or down
            outClass = (this.options.vertical) ? 'slideOutDown' : 'slideOutRight';
            inClass = (this.options.vertical) ? 'slideInDown' : 'slideInRight';
        }

        revUtils.addClass(previousGridElement, outClass);
        revUtils.addClass(nextGridElement, inClass);

        for (var i = 0; i < this.limit; i++) {
            nextGridElement.appendChild(this.createNewCell());
        };

        var countOffset = ((this.page * this.increment) - this.increment);
        var endIndex = countOffset + this.limit;



        var ads = nextGridElement.querySelectorAll('.rev-content');
        var i = 0;
        var index = i + countOffset;
        for (index; index < endIndex; i++, index++) {
            var ad = ads[i],
                data = this.contentItems[index];
            ad.style.width = this.columnWidth + 'px';
            ad.style.marginRight = this.margin + 'px';
            ad.querySelectorAll('a')[0].setAttribute('href', data.url);
            ad.querySelectorAll('a')[0].title = data.headline;
            ad.querySelectorAll('img')[0].setAttribute('src', data.image);
            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;

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
        this.registerImpressions(countOffset, this.limit);

        this.textOverlay();

        nextGrid.reloadItems();
        nextGrid.layout();

        this.grid = nextGrid;
        this.gridElement = nextGridElement;

        this.checkEllipsis();

        this.gridUpdateTimer = setTimeout(function() {
            that.updateGrids();
        }, 1000);

    }

    RevSlider.prototype.updateGrids = function() {
        var gridContainerElement = document.getElementById('rev-slider-grid-container');
        var previousGridElement = gridContainerElement.querySelector('#rev-slider-grid-prev');
        revUtils.remove(previousGridElement);
        this.gridElement.style.position = 'relative';
        this.gridElement.className = '';
        clearTimeout(this.gridUpdateTimer);
        this.gridUpdateTimer = null;
    }

    RevSlider.prototype.setUp = function() {
        this.grid.layout();
        this.limit = this.getLimit();
        this.increment = (this.options.page_increment) ? this.limit : 1; //this.options.rows[this.grid.getBreakPoint()]
        var width = this.grid.containerWidth / this.grid.perRow;

        if (this.options.image_ratio == 'square') {
            var imageHeight = 400;
            var imageWidth = 400;
        } else if (this.options.image_ratio == 'rectangle') {
            var imageHeight = 300;
            var imageWidth = 400;
        } else if (this.options.image_ratio == 'wide_rectangle') {
            var imageHeight = 450;
            var imageWidth = 800;
        }

        this.padding = (this.options.show_padding) ? ((width * .025).toFixed(2) / 1) : 0;

        // // font size is relative to width, other measurements are relative to this font size
        this.headlineFontSize = Math.max(14, ((width * .03).toFixed(2) / 1));
        this.headlineLineHeight = ((this.headlineFontSize * 1.25).toFixed(2) / 1);
        this.headlineHeight = ((this.headlineLineHeight * this.options.headline_size).toFixed(2) / 1);
        if (this.options.max_headline && this.getMaxHeadlineHeight() > 0) {
            this.headlineHeight = this.getMaxHeadlineHeight();
        }
        this.headlineMarginTop = ((this.headlineLineHeight * .4).toFixed(2) / 1);

        this.innerMargin = ((this.headlineMarginTop * .3).toFixed(2) / 1);

        this.providerFontSize = Math.max(11, ((this.headlineLineHeight / 2).toFixed(2) / 1));
        this.providerLineHeight = ((this.providerFontSize * 1.25).toFixed(2) / 1);
        this.providerMargin = ((this.providerLineHeight * .2).toFixed(2) / 1);

        this.preloaderHeight = (this.grid.columnWidth - (this.padding * 2) - (this.options.ad_border ? 2 : 0)) * (imageHeight / imageWidth);
    };

    RevSlider.prototype.initButtons = function() {
        var backBtnWrapper = document.createElement('div');
        backBtnWrapper.id = "back-wrapper";
        backBtnWrapper.setAttribute('class', 'rev-btn-wrapper');

        var backBtn = document.createElement('div');
        backBtn.id = "back";
        backBtn.setAttribute('class', 'rev-btn-container');
        backBtn.setAttribute('style', 'left: 0px;');
        var backArrow = (this.options.vertical) ? '&circ;' : '&lsaquo;';
        backBtn.innerHTML = '<label id="btn-back" class="rev-chevron">'+backArrow+'</label>'; // &lsaquo; &circ;

        revUtils.append(backBtnWrapper, backBtn);

        var forwardBtnWrapper = document.createElement('div');
        forwardBtnWrapper.id = "forward-wrapper";
        forwardBtnWrapper.setAttribute('class', 'rev-btn-wrapper');

        var forwardBtn = document.createElement('div');
        forwardBtn.id = "forward";
        forwardBtn.setAttribute('class', 'rev-btn-container');
        forwardBtn.setAttribute('style', 'right: 0px;');
        var forwardArrow = (this.options.vertical) ? '&caron;' : '&rsaquo;';
        forwardBtn.innerHTML = '<label id="btn-forward" class="rev-chevron">'+forwardArrow+'</label>'; // &rsaquo; &caron;

        revUtils.append(forwardBtnWrapper, forwardBtn);

        var gridContainerElement = this.containerElement.querySelector('#rev-slider-grid-container');
        revUtils.append(gridContainerElement, backBtnWrapper);
        revUtils.append(gridContainerElement, forwardBtnWrapper);
    }

    RevSlider.prototype.setupButtons = function() {
        var isMobile = (revDetect.mobile()) ? true : false;
        var backBtnWrapper = this.containerElement.querySelector('#back-wrapper');
        var forwardBtnWrapper = this.containerElement.querySelector('#forward-wrapper');

        if ((isMobile && !this.options.show_arrows.mobile) || (!isMobile && !this.options.show_arrows.desktop)) {
            backBtnWrapper.setAttribute('style', 'display: none;');
            forwardBtnWrapper.setAttribute('style', 'display: none;');
        } else {
            var backBtn = this.containerElement.querySelector('#btn-back');
            var forwardBtn = this.containerElement.querySelector('#btn-forward');

            if (this.options.vertical) {
                revUtils.addClass(backBtnWrapper, 'top-bottom');
                revUtils.addClass(forwardBtnWrapper, 'top-bottom');
                backBtnWrapper.setAttribute('style', 'padding: 0px ' + this.padding + 'px; top: 0px;');
                forwardBtnWrapper.setAttribute('style', 'padding: 0px ' + this.padding + 'px; bottom: 0px;');
                backBtn.innerHTML = '&circ;';
                forwardBtn.innerHTML = '&caron;';
                var btnLeft = (backBtn.parentNode.offsetWidth / 2) - (backBtn.offsetWidth / 2) + 'px';
                backBtn.setAttribute('style', 'left: ' + btnLeft + '; top: 50%;');
                forwardBtn.setAttribute('style', 'right: ' + btnLeft + '; top: 50%;');
            } else {
                revUtils.removeClass(backBtnWrapper, 'top-bottom');
                revUtils.removeClass(forwardBtnWrapper, 'top-bottom');
                backBtnWrapper.setAttribute('style', 'padding: ' + this.padding + 'px 0px; left: 0px; top: 0px;');
                forwardBtnWrapper.setAttribute('style', 'padding: ' + this.padding + 'px 0px; right: 0px; top: 0px;');
                backBtn.innerHTML = '&lsaquo;';
                forwardBtn.innerHTML = '&rsaquo;';
                var btnTop = (backBtn.parentNode.offsetHeight / 2) - (backBtn.offsetHeight / 2) + 'px';
                var btnLeft = (backBtn.parentNode.offsetWidth / 2) - (backBtn.offsetWidth / 2) + 'px';
                backBtn.setAttribute('style', 'left: ' + btnLeft + '; top: ' + btnTop + ';');
                forwardBtn.setAttribute('style', 'right: ' + btnLeft + '; top: ' + btnTop + ';');
            }
            if (!this.options.wrap_pages) {
                backBtnWrapper.style.display = 'none';
            }
        }
    }

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
                ad.style.height = 'auto';
            }
        }
    };

    RevSlider.prototype.appendElements = function() {
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
        this.sponsored.innerHTML = '<a onclick="revDialog.showDialog();">Sponsored by Revcontent</a>';
        if (this.options.rev_position == 'top_right') {
            revUtils.addClass(this.sponsored, 'top-right')
            revUtils.prepend(this.containerElement, this.sponsored);
        } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
            revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
            revUtils.append(this.containerElement, this.sponsored);
        }
    }


    RevSlider.prototype.update = function(newOpts, oldOpts) {

        this.options = revUtils.extend(this.options, newOpts);

        if ((this.options.size !== oldOpts.size) ||
            (this.options.realSize !== oldOpts.realSize) ||
            (this.options.per_row !== oldOpts.per_row) ||
            (this.options.rows !== oldOpts.rows) ||
            (this.options.headline_size !== oldOpts.headline_size) ||
            (this.options.vertical !== oldOpts.vertical) ||
            (this.options.page_increment !== oldOpts.page_increment)) {
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
    };

    RevSlider.prototype.resize = function() {
        var oldLimit = this.limit;
        this.grid.option(this.options);
        this.setUp();

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
                };
            } else {
                for (var i = 0; i < (this.limit - nodes.length); i++) {
                    this.appendCell();
                }
                this.updateDisplay();
            }
        }

        var ads = this.element.querySelectorAll('.rev-content');

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

        this.textOverlay();

        this.checkEllipsis();
        if (this.options.max_headline) {
            this.checkMaxHeadlineHeightPerRow();
        }
        this.grid.reloadItems();
        this.grid.layout();
        this.setupButtons();
    };

    RevSlider.prototype.checkMaxHeadlineHeightPerRow = function() {
        var itemsPerRow = this.grid.getPerRow();
        var currentRowNum = 0;
        var currentHeadlineHeight = this.getMaxHeadlineHeight(currentRowNum, itemsPerRow);
        var ads = this.element.querySelectorAll('.rev-content');
        if (ads.length > 0) {
            for (var i = 0; i < ads.length; i++) {
                if (i > 0 && i % itemsPerRow == 0) {
                    var currentHeadlineHeight = this.getMaxHeadlineHeight(++currentRowNum, itemsPerRow);
                }
                var ad = ads[i];
                ad.querySelectorAll('.rev-headline')[0].style.height = currentHeadlineHeight + 'px';
            }
        }

    }


    RevSlider.prototype.checkEllipsis = function() {
        var that = this;
        clearTimeout(that.ellipsisTimer);
        that.ellipsisTimer = setTimeout(function() {
            that.doEllipsis();
        }, 300);
    };

    RevSlider.prototype.doEllipsis = function() {
        var ads = this.element.querySelectorAll('.rev-content');
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

    RevSlider.prototype.getLimit = function() {
        // can pass object for rows or just single value for all breakpoints
        return this.grid.getPerRow() * (this.options.rows[this.grid.getBreakPoint()] ? this.options.rows[this.grid.getBreakPoint()] : this.options.rows);
    }

    RevSlider.prototype.appendCell = function() {
        this.gridElement.appendChild(this.createNewCell());
    };

    RevSlider.prototype.createNewCell = function() {
        var html = '<div class="rev-ad" style="'+ (this.options.ad_border ? 'border:1px solid #eee' : '') +'">' +
            '<a href="" target="_blank">' +
            '<div class="rev-image" style="height:'+ this.preloaderHeight +'px">' +
            '<img src=""/>' +
            '</div>' +
            '<div class="rev-headline" style="height:'+ this.headlineHeight +'px; margin:'+ this.headlineMarginTop +'px ' + this.innerMargin + 'px' + ' 0;">' +
            '<h3 style="font-size:'+ this.headlineFontSize +'px; line-height:'+ this.headlineLineHeight +'px;"></h3>' +
            '</div>' +
            '<div style="margin:' + this.providerMargin +'px '  + this.innerMargin + 'px ' + this.providerMargin +'px;font-size:'+ this.providerFontSize +'px;line-height:'+ this.providerLineHeight +'px;height:'+ this.providerLineHeight +'px;" class="rev-provider"></div>' +
            '</a>' +
            '</div>';
        var cell = document.createElement('div');

        cell.style.padding = this.padding + 'px';

        revUtils.addClass(cell, 'rev-content');

        cell.innerHTML = html;

        return cell;
    }

    RevSlider.prototype.getData = function() {
        var sponsoredCount = this.options.pages * this.limit
        var url = this.options.url + '?api_key='+ this.options.api_key +'&uitm=true&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&internal_count=0'+'&sponsored_count=' + sponsoredCount;

        var that = this;

        revApi.request(url, function(resp) {
            that.contentItems = resp;
            that.updateDisplay();

            imagesLoaded( that.gridElement, function() {
                revUtils.addClass(that.containerElement, 'loaded');
                that.resize();
            });
        });
    };

    RevSlider.prototype.registerImpressions = function(offset, count) {
        var impressionsUrl = this.options.url + '?&api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&api_source=flick';

        impressionsUrl += '&sponsored_count=' + (this.options.internal ? 0 : count) + '&internal_count=' + (this.options.internal ? count : 0) + '&sponsored_offset='+ (this.options.internal ? 0 : offset) +'&internal_offset=' + (this.options.internal ? offset : 0);

        var that = this;
        // don't do the same one twice, this could be improved I am sure
        if ( typeof this.impressionTracker[offset + '_' + count] == 'undefined') {
            revApi.request(impressionsUrl, function() {
                that.impressionTracker[offset + '_' + count] = true;
            });
        }
    }

    RevSlider.prototype.updateDisplay = function() {

        this.previousPage = 0;
        this.page = 1;

        var ads = this.element.querySelectorAll('.rev-ad');
        for (var i = 0; i < this.limit; i++) {
            var ad = ads[i],
                data = this.contentItems[i];
            ad.querySelectorAll('a')[0].setAttribute('href', data.url);
            ad.querySelectorAll('a')[0].title = data.headline;
            ad.querySelectorAll('img')[0].setAttribute('src', data.image);
            ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
            ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
        }
        this.registerImpressions(0, this.limit);

    }

    RevSlider.prototype.hasNextPage = function() {
        var pageOffset = (this.options.page_increment) ? 0 : this.limit;
        return this.contentItems.length - pageOffset  >= (this.page + 1) * this.increment;
    }

    RevSlider.prototype.hasPreviousPage = function() {
        return (this.page - 1) > 0;
    }

    RevSlider.prototype.attachButtonEvents = function() {
        var that = this;
        document.getElementById('forward').addEventListener('click', function() {
            that.showNextPage();
        });

        document.getElementById('back').addEventListener('click', function() {
            that.showPreviousPage();
        });
        var gridContainerElement = this.containerElement.querySelector('#rev-slider-grid-container');
        gridContainerElement.addEventListener('mouseover', function() {
            var forwardBtnWrapper = that.containerElement.querySelector('#forward-wrapper');
            var backBtnWrapper = that.containerElement.querySelector('#back-wrapper');
            forwardBtnWrapper.style.opacity = 1;
            backBtnWrapper.style.opacity = 1;
        });
        gridContainerElement.addEventListener('mouseout', function() {
            var forwardBtnWrapper = that.containerElement.querySelector('#forward-wrapper');
            var backBtnWrapper = that.containerElement.querySelector('#back-wrapper');
            forwardBtnWrapper.style.opacity = 0;
            backBtnWrapper.style.opacity = 0;
        });
    };

    RevSlider.prototype.showNextPage = function() {
        if (!this.gridUpdateTimer) {
            if (!this.hasNextPage() && this.options.wrap_pages) {
                // Wrap to beginning
                this.page = 0;
            }
            this.previousPage = this.page;
            this.page = this.page + 1;
            this.createNextPageGrid();
            if (!this.hasNextPage() && !this.options.wrap_pages) {
                // Disable forward button
                var forwardBtnWrapper = this.containerElement.querySelector('#forward-wrapper');
                forwardBtnWrapper.style.display = 'none';
            }
            if (this.hasPreviousPage()) {
                var backBtnWrapper = this.containerElement.querySelector('#back-wrapper');
                backBtnWrapper.style.display = 'block';
            }
        }
    }

    RevSlider.prototype.showPreviousPage = function() {
        if (!this.gridUpdateTimer) {
            if (!this.hasPreviousPage() && this.options.wrap_pages) {
                // Wrap to end
                // We round up because this is actually to be the previous page
                this.page = Math.ceil(this.contentItems.length / this.limit);
            }
            this.previousPage = this.page;
            this.page = Math.max(1, this.page - 1);
            this.createNextPageGrid();
            if (!this.hasPreviousPage() && !this.options.wrap_pages) {
                // Disable back button
                var backBtnWrapper = this.containerElement.querySelector('#back-wrapper');
                backBtnWrapper.style.display = 'none';
            } else {
                var forwardBtnWrapper = this.containerElement.querySelector('#forward-wrapper');
                forwardBtnWrapper.style.display = 'block';
            }
        }
    }

    RevSlider.prototype.getMaxHeadlineHeight = function(rowNum, numItems) {
        var maxHeadlineHeight = 0;
        var that = this;
        var ads = that.element.querySelectorAll('.rev-ad');
        if (ads.length > 0) {
            rowNum = (rowNum != undefined) ? rowNum : 0;
            numItems = (numItems != undefined) ? numItems : ads.length;
            var offset = rowNum * numItems;
            var nextOffset = offset + numItems;
            var el = ads[0].querySelectorAll('.rev-headline h3')[0];
            var t = el.cloneNode(true);
            t.style.visibility = 'hidden';
            t.style.height = 'auto';
            revUtils.append(el.parentNode, t);
            for (var i = offset; i < nextOffset; i++) {
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


    return RevSlider;
}));
