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
    window.RevSlider = factory(window, window.revUtils, window.revDetect, window.revApi);

}( window, function factory(window, revUtils, revDetect, revApi) {
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
            image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            show_arrows: {
                mobile: false,
                desktop: true
            },
            sponsored: 10,
            internal: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/',
            ad_border: true
        };

        if(typeof window.revDialog !== undefined) {
            window.revDialog = new RevDialog();
        }

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

        revUtils.appendStyle('/* inject:css */#rev-slider a,#rev-slider a:focus,#rev-slider a:hover{text-decoration:none}.rc-about,.rc-about h2{font-family:Arial,sans-serif}#rev-slider,#rev-slider #rev-slider-grid,#rev-slider #rev-slider-grid-container{padding:0;width:100%}#rev-slider #rev-slider-grid-container{display:table;width:100%}#rev-slider{clear:both}#rev-slider *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}#rev-slider #rev-slider-grid-container>div{display:table-cell;vertical-align:middle}#rev-slider #rev-slider-grid-container .rev-btn-container{padding:0 30px}#rev-slider a{color:inherit}#rev-slider:focus{outline:0}#rev-slider .rev-header{float:left;font-size:22px;line-height:32px;margin-bottom:0;text-align:left;width:auto}#rev-slider .rev-sponsored{line-height:24px;font-size:12px}#rev-slider .rev-sponsored.bottom-right,#rev-slider .rev-sponsored.top-right{float:right}#rev-slider .rev-sponsored.top-right a{vertical-align:-5px}#rev-slider .rev-sponsored a{color:#999}#rev-slider .rev-ad a{display:block;color:#222}#rev-slider .rev-image{position:relative;-webkit-transition:background .5s ease-in-out;transition:background .5s ease-in-out;background:#eee}#rev-slider .rev-image img{position:absolute;top:0;left:0;-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:0;display:block;max-width:100%;height:auto}#rev-slider.loaded .rev-image{background:0 0}#rev-slider.loaded .rev-image img{opacity:1}#rev-slider .rev-headline,#rev-slider .rev-provider{margin:0 10px;text-align:left}#rev-slider .rev-headline{margin-top:12px;height:40px;overflow:hidden}#rev-slider .rev-headline h3{font-size:16px;font-weight:500;letter-spacing:.2px;line-height:20px;margin:0}#rev-slider .rev-provider{font-size:12px;color:#888;line-height:30px;height:30px}#rev-slider .rev-ad{border-radius:5px;overflow:hidden;background:#fff}#rev-slider .rev-content{-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:1}#rev-slider .rev-content.rev-next{-webkit-transition:opacity .5s ease-in-out;transition:opacity .5s ease-in-out;opacity:.5}.closeButton{position:absolute;cursor:pointer;right:10px}a{cursor:pointer!important}.revDialogBoxWrap{display:none;z-index:2147483641}.revDialogBoxOverlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;opacity:.5;filter:alpha(opacity=50);z-index:2147483641}.vertical-offset{position:fixed;display:table-cell;top:0;width:100%;z-index:2147483642}.revDialogBox{position:absolute;vertical-align:middle;background-color:#fff;padding:10px;border:1px solid #555;border-radius:12px;-webkit-border-radius:12px;-moz-border-radius:12px;overflow:auto;box-shadow:3px 3px 10px 4px #555}.normal{min-width:270px;max-width:435px;width:90%;margin:10px auto}.full-screen{position:fixed;right:15px;left:15px;top:15px;bottom:15px}.revDialogHeader{height:20px}.rc-about{font-size:14px;text-align:left;box-sizing:content-box;color:#333;padding:15px}.rc-about .rc-logo{background:url(https://www.revcontent.com/assets/img/rc-logo.png) bottom center no-repeat;width:220px;height:48px;display:block;margin:0 auto}.rc-about p{margin:16px 0;color:#555;font-size:14px;line-height:16px}.rc-about p#main{text-align:left}.rc-opt-out,.rc-well{text-align:center}.rc-about h2{color:#777;font-size:16px;line-height:18px}.rc-about a{color:#00cb43}.rc-well{border:1px solid #E0E0E0;padding:20px;border-radius:2px;margin:20px 0}.rc-well h2{margin-top:0}.rc-well p{margin-bottom:0}.rc-opt-out a{margin-top:6px;display:inline-block}/* endinject */', 'rev-slider');

        var backBtn = document.createElement('div');
        backBtn.id = "back";
        backBtn.setAttribute('class', 'rev-btn-container');
        backBtn.innerHTML = '<button id="btn-back" class="rev-btn"><</button>';

        var forwardBtn = document.createElement('div');
        forwardBtn.id = "forward";
        forwardBtn.setAttribute('class', 'rev-btn-container');
        forwardBtn.innerHTML = '<button id="btn-forward" class="rev-btn">></button>';

        var containerElement = document.createElement('div');
        containerElement.id = 'rev-slider';
        containerElement.class = 'rev-slider';

        var gridContainerElement = document.createElement('div');
        gridContainerElement.id = 'rev-slider-grid-container';

        var gridElement = document.createElement('div');
        gridElement.id = 'rev-slider-grid';

        var element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        element.style.width = '100%';

        revUtils.append(containerElement, gridContainerElement);
        revUtils.append(gridContainerElement, backBtn);
        revUtils.append(gridContainerElement, gridElement);
        revUtils.append(gridContainerElement, forwardBtn);
        revUtils.append(element, containerElement);

        var grid = new AnyGrid(gridElement, { masonry: false, perRow: this.options.per_row, transitionDuration: 0});

        var getLimit = function() {
            // can pass object for rows or just single value for all breakpoints
            return grid.getPerRow() * (that.options.rows[grid.getBreakPoint()] ? that.options.rows[grid.getBreakPoint()] : that.options.rows);
        }

        var page = 1,
            limit = getLimit(),
            resizeTimeout;

        grid.on('resized', function() {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            function delay() {
                var newLimit = getLimit();
                var reconfig = 0;
                if (newLimit != limit) {
                    reconfig = (newLimit - limit);
                    limit = newLimit;
                    getData();
                }
                resize(reconfig);
                resizeTimeout = false;
            }
            resizeTimeout = setTimeout(delay, 300);
        });

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

        var appendElements = function() {
            var header = document.createElement('h2');
            header.innerHTML = that.options.header;
            revUtils.addClass(header, 'rev-header');
            revUtils.prepend(containerElement, header);

            var sponsored = document.createElement('div');
            revUtils.addClass(sponsored, 'rev-sponsored');
            sponsored.innerHTML = '<a onclick="revDialog.showDialog();">Sponsored by Revcontent</a>';
            if (that.options.rev_position == 'top_right') {
                revUtils.addClass(sponsored, 'top-right')
                revUtils.prepend(containerElement, sponsored);
            } else if (that.options.rev_position == 'bottom_left' || that.options.rev_position == 'bottom_right') {
                revUtils.addClass(sponsored, that.options.rev_position.replace('_', '-'));
                revUtils.append(containerElement, sponsored);
            }
        }

        appendElements();

        var setUp = function() {
            var width = grid.containerWidth / grid.perRow;

            that.padding = ((width * .025).toFixed(2) / 1);
            that.innerMargin = ((width * .02).toFixed(2) / 1);

            // // font size is relative to width, other measurements are relative to this font size
            that.headlineFontSize = Math.max(14, ((width * .03).toFixed(2) / 1));
            that.headlineLineHeight = ((that.headlineFontSize * 1.25).toFixed(2) / 1);
            that.headlineHeight = ((that.headlineLineHeight * 2).toFixed(2) / 1);
            that.headlineMarginTop = ((that.headlineHeight * .2).toFixed(2) / 1);

            that.providerFontSize = Math.max(11, ((that.headlineLineHeight / 2).toFixed(2) / 1));
            that.providerLineHeight = ((that.providerFontSize * 1.25).toFixed(2) / 1);
            that.providerMargin = ((that.providerLineHeight * .2).toFixed(2) / 1);

            that.preloaderHeight = (grid.columnWidth - (that.padding * 2) - (that.options.ad_border ? 2 : 0)) * (imageHeight / imageWidth);
        }

        setUp();

        var appendCell = function() {
            var html = '<div class="rev-ad" style="'+ (that.options.ad_border ? 'border:1px solid #eee' : '') +'">' +
                        '<a href="" target="_blank">' +
                            '<div class="rev-image" style="height:'+ that.preloaderHeight +'px">' +
                                '<img src=""/>' +
                            '</div>' +
                            '<div class="rev-headline" style="height:'+ that.headlineHeight +'px; margin:'+ that.headlineMarginTop +'px ' + that.innerMargin + 'px' + ' 0;">' +
                                '<h3 style="font-size:'+ that.headlineFontSize +'px; line-height:'+ that.headlineLineHeight +'px;"></h3>' +
                            '</div>' +
                            '<div style="margin:' + that.providerMargin +'px '  + that.innerMargin + 'px ' + that.providerMargin +'px;font-size:'+ that.providerFontSize +'px;line-height:'+ that.providerLineHeight +'px;height:'+ that.providerLineHeight +'px;" class="rev-provider"></div>' +
                        '</a>' +
                    '</div>';
            var cell = document.createElement('div');

            cell.style.padding = that.padding + 'px';

            revUtils.addClass(cell, 'rev-content');

            cell.innerHTML = html;

            gridElement.appendChild(cell);
        };

        for (var i = 0; i < limit; i++) {
            appendCell();
        };

        grid.reloadItems();
        grid.layout();

        var getData = function() {
            var url = that.options.url + '?api_key='+ that.options.api_key +'&pub_id='+ that.options.pub_id +'&widget_id='+ that.options.widget_id +'&domain='+ that.options.domain +'&sponsored_count=' + limit + '&sponsored_offset=' + ((page * limit) - limit) + '&internal_count=0';

            revApi.request(url, function(resp) {

                var ads = element.querySelectorAll('.rev-ad');

                for (var i = 0; i < resp.length; i++) {
                    var ad = ads[i],
                        data = resp[i];
                    ad.querySelectorAll('a')[0].setAttribute('href', data.url);
                    ad.querySelectorAll('img')[0].setAttribute('src', data.image);
                    ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
                    ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
                }

                imagesLoaded( gridElement, function() {
                    revUtils.addClass(containerElement, 'loaded');
                });
            });
        };

        getData();


        var resize = function(reconfig) {
            setUp();
            if (reconfig !== 0) {
                var nodes = element.querySelectorAll('.rev-content');
                if (reconfig < 0) {
                    for (var i = 0; i < nodes.length; i++) {
                        if (i >= limit) {
                            grid.remove(nodes[i]);
                        }
                    };
                } else {
                    var add = limit - nodes.length;
                    for (var i = 0; i < add; i++) {
                        appendCell();
                    }
                }
            }


            var ads = element.querySelectorAll('.rev-content');

            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];

                ad.style.padding = that.padding + 'px';

                ad.querySelectorAll('.rev-image')[0].style.height = that.preloaderHeight + 'px';
                ad.querySelectorAll('.rev-headline')[0].style.height = that.headlineHeight + 'px';
                ad.querySelectorAll('.rev-headline')[0].style.margin = that.headlineMarginTop +'px ' + that.innerMargin + 'px 0';

                ad.querySelectorAll('.rev-headline h3')[0].style.fontSize = that.headlineFontSize +'px';
                ad.querySelectorAll('.rev-headline h3')[0].style.lineHeight = that.headlineLineHeight +'px';
                ad.querySelectorAll('.rev-provider')[0].style.margin = that.providerMargin +'px '  + that.innerMargin + 'px ' + that.providerMargin +'px';
                ad.querySelectorAll('.rev-provider')[0].style.fontSize = that.providerFontSize +'px';
                ad.querySelectorAll('.rev-provider')[0].style.lineHeight = that.providerLineHeight + 'px';
                ad.querySelectorAll('.rev-provider')[0].style.height = that.providerLineHeight +'px';
            }
            grid.reloadItems();
            grid.layout();
        };

        document.getElementById('btn-forward').addEventListener('click', function() {
            page = page + 1;
            getData();
        });

        document.getElementById('btn-back').addEventListener('click', function() {
            page = Math.max(1, page - 1);
            getData();
        });
    };

    return RevSlider;
}));
