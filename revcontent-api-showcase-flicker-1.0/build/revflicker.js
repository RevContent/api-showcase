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
    rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
    next_width: 60,
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
           per_row: {
                xxs: 1,
                xs: 1,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            next_width: 60,
            next_effect: true,
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
        revUtils.appendStyle('/* inject:css */.flickity-enabled:focus,.rev-flicker:focus{outline:0}.flickity-enabled{position:relative}.flickity-viewport{overflow:hidden;position:relative;height:100%}.flickity-slider{position:absolute;width:100%;height:100%}.flickity-enabled.is-draggable{-webkit-tap-highlight-color:transparent;tap-highlight-color:transparent;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.flickity-enabled.is-draggable .flickity-viewport{cursor:move;cursor:-webkit-grab;cursor:grab}.flickity-enabled.is-draggable .flickity-viewport.is-pointer-down{cursor:-webkit-grabbing;cursor:grabbing}.flickity-prev-next-button{position:absolute;top:50%;width:44px;height:44px;border:none;border-radius:50%;background:#fff;background:hsla(0,0%,100%,.75);cursor:pointer;-webkit-transform:translateY(-50%);-ms-transform:translateY(-50%);transform:translateY(-50%)}.flickity-prev-next-button:hover{background:#fff}.flickity-prev-next-button:focus{outline:0;box-shadow:0 0 0 5px #09F}.flickity-prev-next-button:active{filter:alpha(opacity=60);opacity:.6}.flickity-prev-next-button.previous{left:10px}.flickity-prev-next-button.next{right:10px}.flickity-rtl .flickity-prev-next-button.previous{left:auto;right:10px}.flickity-rtl .flickity-prev-next-button.next{right:auto;left:10px}.flickity-prev-next-button:disabled{filter:alpha(opacity=30);opacity:.3;cursor:auto}.flickity-prev-next-button svg{position:absolute;left:20%;top:20%;width:60%;height:60%}.flickity-prev-next-button .arrow{fill:#333}.flickity-prev-next-button.no-svg{color:#333;font-size:26px}.flickity-page-dots{position:absolute;width:100%;bottom:-25px;padding:0;margin:0;list-style:none;text-align:center;line-height:1}.flickity-rtl .flickity-page-dots{direction:rtl}.flickity-page-dots .dot{display:inline-block;width:10px;height:10px;margin:0 8px;background:#333;border-radius:50%;filter:alpha(opacity=25);opacity:.25;cursor:pointer}.flickity-page-dots .dot.is-selected{filter:alpha(opacity=100);opacity:1}.rev-flicker *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}.rev-flicker .rev-header{float:left;font-size:22px;line-height:32px}.rev-flicker .flickity-viewport{clear:both}.rev-flicker .rev-sponsored{line-height:28px;font-size:14px}.rev-flicker .rev-sponsored.bottom-right,.rev-flicker .rev-sponsored.top-right{float:right}.rev-flicker .rev-sponsored.top-right a{vertical-align:-5px}.rev-flicker .flickity-prev-next-button{opacity:0;-webkit-transition:all .5s ease-in-out;transition:all .5s ease-in-out}.rev-flicker:hover .flickity-prev-next-button{opacity:1}.rev-flicker .rev-sponsored a{color:#777}.rev-flicker a,.rev-flicker a:focus,.rev-flicker a:hover{text-decoration:none}.rev-flicker .rev-ad a{display:block;color:#222}.rev-flicker .rev-image img{max-width:100%;max-height:100%;margin:0 auto;display:inline-block;vertical-align:middle}.rev-flicker .rev-headline,.rev-flicker .rev-provider{margin:0 10px}.rev-flicker .rev-headline{margin-top:12px;height:40px;overflow:hidden}.rev-flicker .rev-headline h3{font-size:16px;font-weight:500;letter-spacing:.2px;line-height:20px;margin:0}.rev-flicker .rev-provider{font-size:12px;color:#888;line-height:30px}.rev-flicker .rev-ad{margin-right:10%;border:1px solid #eee;border-radius:5px;overflow:hidden}.rev-content{-webkit-transition:all .5s ease-in-out;transition:all .5s ease-in-out;opacity:1}.rev-content.next{-webkit-transition:all .5s ease-in-out;transition:all .5s ease-in-out;opacity:.5}/* endinject */', 'rev-flicker');
        // create flickity
        this.flickity = new Flickity( '#' + this.options.id, {
            prevNextButtons: revDetect.mobile() ? false : true,
            pageDots: this.options.dots,
            cellAlign: 'left'
        });
        // wrapper class
        revUtils.addClass(this.flickity.element, 'rev-flicker');
        // HACK for Chrome using emitter to wait for element container to be ready
        this.emitter = new EventEmitter();
        this.getContainerWidth();
        this.emitter.on('containerReady', function() {
            that.setUp();
            that.getData();
        });
    };

    RevFlicker.prototype.appendElements = function() {
        var header = document.createElement('h2');
        header.innerHTML = this.options.header;
        revUtils.addClass(header, 'rev-header');
        revUtils.prepend(this.flickity.element, header);

        var sponsored = document.createElement('div');
        revUtils.addClass(sponsored, 'rev-sponsored');
        sponsored.innerHTML = '<a href="http://revcontent.com">Sponsored by Revcontent</a>';
        if (this.options.rev_position == 'top_right') {
            revUtils.addClass(sponsored, 'top-right')
            revUtils.prepend(this.flickity.element, sponsored);
        } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
            revUtils.addClass(sponsored, this.options.rev_position.replace('_', '-'));
            revUtils.append(this.flickity.element, sponsored);
        }
    }

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
            this.per_row = this.options.per_row.xxl;
        }else if (this.containerWidth >= 1250) {
            this.per_row = this.options.per_row.xl;
        }else if (this.containerWidth >= 1000) {
            this.per_row = this.options.per_row.lg;
        }else if (this.containerWidth >= 750) {
            this.per_row = this.options.per_row.md;
        }else if (this.containerWidth >= 500) {
            this.per_row = this.options.per_row.sm;
        }else if (this.containerWidth >= 250) {
            this.per_row = this.options.per_row.xs;
        }else {
            this.per_row = this.options.per_row.xxs;
        }
        // divide container width by per row to determine column width, account for width of halved/next item
        this.columnWidth = ((this.containerWidth - this.options.next_width) / this.per_row);
    };

    RevFlicker.prototype.getData = function() {
        var url = this.options.url + '?api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&sponsored_count=' + this.options.sponsored + '&sponsored_offset=0&internal_count=0&api_source=flick';
        var that = this;
        revApi.request(url, function(resp) {
            for (var i = 0; i < resp.length; i++) {
                // for each response append
                var html = '<div class="rev-ad">' +
                            '<a href="'+ resp[i].url +'" target="_blank">' +
                                '<div class="rev-image"><img src="'+ resp[i].image +'"/></div>' +
                                '<div class="rev-headline"><h3>'+ resp[i].headline +'</h3></div>' +
                                '<div class="rev-provider">'+ resp[i].brand +'</div>' +
                            '</a>' +
                        '</div>';
                var cell = document.createElement('div');

                cell.style.width = that.columnWidth + 'px';

                revUtils.addClass(cell, 'rev-content');
                // next in line gets special class
                if (that.options.next_effect && i >= that.per_row) {
                    revUtils.addClass(cell, 'next');
                }

                cell.innerHTML = html;

                that.flickity.append(cell);
            }
            imagesLoaded( that.flickity.element, function() {
                that.flickity.reloadCells();
            });
            // append elements
            that.appendElements();

            that.selectedIndex = that.flickity.selectedIndex

            if (that.options.next_effect) {
                that.flickity.on( 'cellSelect', function() {
                    if (that.selectedIndex != that.flickity.selectedIndex) { // only do something when index changes
                        that.selectedIndex = that.flickity.selectedIndex
                        var content = that.flickity.element.querySelectorAll('.rev-content');
                        var nextIndex = that.selectedIndex + that.per_row;
                        var last = that.selectedIndex >= that.options.sponsored - that.per_row;
                        for (var i = 0; i < content.length; i++) {
                            if (last) { // none left to half so all are visible
                                revUtils.removeClass(content[i], 'next');
                            } else if (i >= nextIndex) {
                                revUtils.addClass(content[i], 'next');
                            } else {
                                revUtils.removeClass(content[i], 'next');
                            }
                        }
                    }
                });
            }
        });
    };

    return RevFlicker;

}));