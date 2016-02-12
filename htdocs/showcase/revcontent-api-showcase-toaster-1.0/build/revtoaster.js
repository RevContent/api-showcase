/*
ooooooooo.                         ooooooooooooo                                  .
`888   `Y88.                       8'   888   `8                                .o8
 888   .d88'  .ooooo.  oooo    ooo      888       .ooooo.   .oooo.    .oooo.o .o888oo  .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'       888      d88' `88b `P  )88b  d88(  "8   888   d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        888      888   888  .oP"888  `"Y88b.    888   888ooo888  888
 888  `88b.  888    .o    `888'         888      888   888 d8(  888  o.  )88b   888 . 888    .o  888
o888o  o888o `Y8bod8P'     `8'         o888o     `Y8bod8P' `Y888""8o 8""888P'   "888" `Y8bod8P' d888b

Project: RevToaster
Version: 1
Author: michael@revcontent.com

RevToaster({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    header: 'Trending Today',
    closed_hours: 24,
    sponsored: 2,
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevToaster = factory(window, window.revUtils, window.revDetect, window.revApi);

}( window, function factory(window, revUtils, revDetect, revApi) {
'use strict';

    // ----- vars ----- //

    var RevToaster;
    var instance;

    var defaults = {
        testing: false,
        header: 'Trending Today',
        closed_hours: 24,
        sponsored: 1,
        url: 'https://trends.revcontent.com/api/v1/',
        rev_position: 'bottom_right',
        devices: [
            'phone', 'tablet', 'desktop'
        ]
    };
    // var options;
    var lastScrollTop = 0;
    var scrollTimeout;
    var loaded = false;
    var removed = false;

    var RevToaster = function( opts ) {
        if (instance) {
            instance.update(opts, instance.options);
            return instance;
        }

        // if it wasn't newed up
        if ( !( this instanceof RevToaster ) ) {
            instance = new RevToaster(opts);
            return instance;
        } else {
            instance = this;
        }

        // merge options
        this.options = revUtils.extend(defaults, opts);
        this.options.sponsored = (this.options.sponsored > 2) ? 2 : this.options.sponsored;

        // param errors
        if (revUtils.validateApiParams(this.options).length) {
            return;
        }
        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        if (revUtils.getCookie('revtoaster-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */#rev-toaster{-ms-overflow-style:-ms-autohiding-scrollbar;-webkit-text-size-adjust:100%;text-size-adjust:100%;box-sizing:border-box;cursor:default;text-rendering:optimizeLegibility;background:rgba(0,0,0,.89);position:fixed;-webkit-transition:.5s;transition:.5s;width:100%;padding-top:3px;padding-left:3px;bottom:-20px;transform:translateY(100%);-ms-transform:translateY(100%);-moz-transform:translateY(100%);-o-transform:translateY(100%);-webkit-transform:translateY(100%)}#rev-toaster *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}#rev-toaster a,#rev-toaster a:focus,#rev-toaster a:hover{text-decoration:none}body.rev-toaster-loaded{margin:0}body.rev-toaster-loaded #rev-toaster{bottom:0;transform:none;-ms-transform:none;-moz-transform:none;-o-transform:none;-webkit-transform:none;z-index:147483647}#rev-toaster .rev-header{position:absolute;background:#000;line-height:20px;top:-20px;left:-3px;color:#fff;font-size:10px;padding:0 4px 0 6px;border-top:1px solid #4CC93D;font-weight:500;letter-spacing:.1px}#rev-toaster .rev-header:after,#rev-toaster .rev-header:before{border-right:solid 10px transparent;border-top:solid 10px transparent;box-sizing:border-box;display:block;position:absolute;width:20px;height:20px;top:0;right:-20px;content:""}#rev-toaster .rev-header:before{border-left:solid 10px transparent;border-bottom:solid 10px transparent}#rev-toaster .rev-header:after{border-bottom:solid 10px #000;border-left:solid 10px #000}#rev-toaster .rev-sponsored{text-align:right;font-weight:300;font-size:10px;line-height:16px;opacity:.4;clear:both}#rev-opt-out .rd-about,#rev-opt-out .rd-about p#main,#rev-toaster .rev-sponsored.bottom-left{text-align:left}#rev-toaster .rev-sponsored a{letter-spacing:.1px;color:#fff;padding:0 6px 3px;display:inline-block}#rev-toaster .rev-sponsored a span{color:#4CC93D}#rev-toaster .rev-content{padding-bottom:3px;margin-right:36px;clear:left}#rev-toaster .rev-ad a{display:block}#rev-toaster .rev-image{height:75px;float:left;margin-right:10px}#rev-toaster .rev-image img{max-width:100%;max-height:100%;border:1px solid #000;margin:0 auto;display:inline-block;vertical-align:middle}#rev-toaster .rev-headline{max-height:40px;overflow:hidden}#rev-toaster .rev-headline h3{color:#fff;font-size:16px;font-weight:500;letter-spacing:.2px;line-height:20px;margin:0;text-align:left;text-transform:none}#rev-toaster .rev-provider{font-size:12px;color:#888;line-height:30px}#rev-toaster button.rev-close{outline:0;border:0;display:inline-table;background:#6D6D6D;white-space:nowrap;cursor:pointer;box-shadow:0 2px 5px 0 rgba(0,0,0,.26);box-sizing:border-box;color:currentColor;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:20;vertical-align:middle;border-radius:50%;background-clip:padding-box;overflow:hidden;-webkit-transition:.2s linear;transition:.2s linear;-webkit-transition-property:background-color,box-shadow;transition-property:background-color,box-shadow;line-height:30px;width:30px;height:30px;position:absolute;top:-15px;right:8px}#rev-toaster button.rev-close .rev-icon{margin:auto;background-repeat:no-repeat no-repeat;fill:currentColor;height:30px;width:15px;color:#c5c5c5;position:relative}#rev-toaster button.rev-close .rev-icon svg{position:absolute;top:7px;left:0;width:15px;height:15px}#rev-opt-out .rd-close-button{position:absolute;cursor:pointer;right:10px;z-index:10}#rev-opt-out a{cursor:pointer!important}#rev-opt-out .rd-box-wrap{display:none;z-index:2147483641}#rev-opt-out .rd-box-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;opacity:.5;filter:alpha(opacity=50);z-index:2147483641}#rev-opt-out .rd-vertical-offset{position:fixed;display:table-cell;top:0;width:100%;z-index:2147483642}#rev-opt-out .rd-box{position:absolute;vertical-align:middle;background-color:#fff;padding:10px;border:1px solid #555;border-radius:12px;-webkit-border-radius:12px;-moz-border-radius:12px;overflow:auto;box-shadow:3px 3px 10px 4px #555}#rev-opt-out .rd-normal{min-width:270px;max-width:435px;width:90%;margin:10px auto}#rev-opt-out .rd-full-screen{position:fixed;right:15px;left:15px;top:15px;bottom:15px}#rev-opt-out .rd-header{height:20px;position:absolute;right:0}#rev-opt-out .rd-about{font-family:Arial,sans-serif;font-size:14px;box-sizing:content-box;color:#333;padding:15px}#rev-opt-out .rd-about .rd-logo{background:url(https://serve.revcontent.com/assets/img/rc-logo.png) bottom center no-repeat;width:220px;height:48px;display:block;margin:0 auto}#rev-opt-out .rd-about p{margin:16px 0;color:#555;font-size:14px;line-height:16px}#rev-opt-out .rd-about h2{color:#777;font-family:Arial,sans-serif;font-size:16px;line-height:18px}#rev-opt-out .rd-about a{color:#00cb43}#rev-opt-out .rd-well{border:1px solid #E0E0E0;padding:20px;text-align:center;border-radius:2px;margin:20px 0 0}#rev-opt-out .rd-well h2{margin-top:0}#rev-opt-out .rd-well p{margin-bottom:0}#rev-opt-out .rd-opt-out{text-align:center}#rev-opt-out .rd-opt-out a{margin-top:6px;display:inline-block}/* endinject */', 'rev-toaster');

        var that = this;

        this.init = function() {
            this.revToaster = document.createElement('div');
            this.revToaster.id = 'rev-toaster';
            this.revToaster.setAttribute('class', 'rev-toaster');

            this.containerElement = document.createElement('div');
            this.containerElement.className = 'rev-content-container';
            revUtils.append(this.revToaster, this.containerElement);

            if (this.options.sponsored > 1) {
                revUtils.addClass(this.revToaster, 'rev-toaster-multi');
            }

            this.appendElements();

            for (var i = 0; i < this.options.sponsored; i++) {
                this.appendCell();
            };

            this.bindClose();

            revUtils.append(document.body, that.revToaster);

            // window.addEventListener('scroll', this.move); // for debugging

            window.addEventListener('touchmove', this.move);
        };

        this.update = function(newOpts, oldOpts) {
            this.options = revUtils.extend(defaults, newOpts);
            this.options.sponsored = (this.options.sponsored > 2) ? 2 : this.options.sponsored;

            if (this.visible != newOpts.visible) {
                if (newOpts.visible) {
                    this.show();
                } else {
                    this.hide();
                }
            }

            if ((this.options.header !== oldOpts.header) || this.options.rev_position !== oldOpts.rev_position) {
                this.appendElements();
            }

            if (this.options.sponsored !== oldOpts.sponsored) {
                if (this.options.sponsored > oldOpts.sponsored) {
                    this.appendCell();
                } else {
                    var nodes = this.revToaster.querySelectorAll('.rev-content');
                    revUtils.remove(nodes[1]);
                }
                this.getData();
            }
        };

        this.appendElements = function() {
            if (this.header) {
                revUtils.remove(this.header);
            }

            this.header = document.createElement('div');
            this.header.className = 'rev-header';
            this.header.innerHTML = that.options.header;

            revUtils.append(that.revToaster, this.header);

            if (!this.closeButton) {
                this.closeButton = document.createElement('button');
                this.closeButton.className = 'rev-close';
                this.closeButton.innerHTML = '<div class="rev-icon">' +
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
                                    '</div>';

                revUtils.append(that.revToaster, this.closeButton);
            }

            if (this.sponsored) {
                revUtils.remove(this.sponsored);
            }
            this.sponsored = document.createElement('div');
            this.sponsored.className = 'rev-sponsored';
            this.sponsored.innerHTML = '<a href="javascript:;" onclick="revDialog.showDialog()">Sponsored by Revcontent</a>';

            if (this.options.rev_position == 'top_right') {
                revUtils.addClass(this.sponsored, 'top-right')
                revUtils.prepend(this.revToaster, this.sponsored);
            } else if (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right') {
                revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
                revUtils.append(this.revToaster, this.sponsored);
            }
        };

        this.move = function() {
            if (removed) {
                window.removeEventListener('touchmove', this.move);
                return;
            }

            if (scrollTimeout) {
                return;
            }

            function delayed() {

                var scrollTop = window.pageYOffset,
                    scrollDirection = (scrollTop < lastScrollTop) ? 'up' : 'down';

                if (scrollDirection === 'up') {
                    if (!loaded) {
                        that.getData(true);
                    } else {
                        that.show();
                    }
                } else if (scrollDirection === 'down') {
                    that.hide();

                }
                lastScrollTop = scrollTop;
                scrollTimeout = false;
            }

            scrollTimeout = setTimeout( delayed, 300);
        };

        this.appendCell = function() {
            var html = '<div class="rev-ad">' +
                        '<a href="" target="_blank">' +
                            '<div class="rev-image">' +
                                '<img src=""/>' +
                            '</div>' +
                            '<div class="rev-headline">' +
                                '<h3></h3>' +
                            '</div>' +
                            '<div class="rev-provider"></div>' +
                        '</a>' +
                    '</div>';
            var cell = document.createElement('div');

            revUtils.addClass(cell, 'rev-content');

            cell.innerHTML = html;

            that.containerElement.appendChild(cell);
        };

        this.getData = function(show) {
            loaded = true;
            var url = this.options.url + '?api_key='+ this.options.api_key +'&pub_id='+ this.options.pub_id +'&widget_id='+ this.options.widget_id +'&domain='+ this.options.domain +'&sponsored_count=' + this.options.sponsored + '&sponsored_offset=0&internal_count=0&api_source=toast';

            var that = this;

            revApi.request(url, function(resp) {

                var ads = that.containerElement.querySelectorAll('.rev-ad');

                for (var i = 0; i < resp.length; i++) {
                    var ad = ads[i],
                        data = resp[i];
                    ad.querySelectorAll('a')[0].setAttribute('href', data.url);
                    ad.querySelectorAll('img')[0].setAttribute('src', data.image);
                    ad.querySelectorAll('.rev-headline h3')[0].innerHTML = data.headline;
                    ad.querySelectorAll('.rev-provider')[0].innerHTML = data.brand;
                }
                if (show) {
                    that.show();
                }
            });
        };

        this.bindClose = function() {
            if (!this.options.closed_hours) {
                return false;
            }
            var that = this;

            this.closeButton.addEventListener('click', function(e) {
                revUtils.removeClass(document.body, 'rev-toaster-loaded');
                setTimeout(function() {
                    that.revToaster.parentNode.removeChild(that.revToaster);
                    removed = true;
                    revUtils.setCookie('revtoaster-closed', 1, (that.options.closed_hours / 24));
                }, 2000);
            });
        };

        this.show = function() {
            if (!loaded) {
                this.getData(true);
            } else {
                var that = this;
                imagesLoaded( this.containerElement, function() {
                    that.visible = true;
                    revUtils.addClass(document.body, 'rev-toaster-loaded');
                });
            }
        };

        this.hide = function() {
            this.visible = false;
            revUtils.removeClass(document.body, 'rev-toaster-loaded');
        };

        this.init();
    };

    return RevToaster;

}));