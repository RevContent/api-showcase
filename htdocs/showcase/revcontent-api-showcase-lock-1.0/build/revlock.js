/*
ooooooooo.                         ooooo                            oooo
`888   `Y88.                       `888'                            `888
 888   .d88'  .ooooo.  oooo    ooo  888          .ooooo.   .ooooo.   888  oooo
 888ooo88P'  d88' `88b  `88.  .8'   888         d88' `88b d88' `"Y8  888 .8P'
 888`88b.    888ooo888   `88..8'    888         888   888 888        888888.
 888  `88b.  888    .o    `888'     888       o 888   888 888   .o8  888 `88b.
o888o  o888o `Y8bod8P'     `8'     o888ooooood8 `Y8bod8P' `Y8bod8P' o888o o888o

Project: RevLock
Version: 1
Author: michael@revcontent.com

RevLock({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevLock = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDialog);

}( window, function factory(window, revUtils, revDetect, revApi, revDialog) {
'use strict';

    var RevLock = function(opts) {

        var defaults = {
            id: false,
            distance: 500,
            element: false,
            unlock_text: 'Read More...',
            inner_widget_options: {
                header: 'Trending Now',
                rev_position: 'top_right',
                image_ratio: 'rectangle',
                per_row: {
                    xxs: 2,
                    xs: 2,
                    sm: 3,
                    md: 4,
                    lg: 5,
                    xl: 6,
                    xxl: 7
                },
                buttons: {
                    forward: true,
                    back: false,
                    size: 40,
                    position: 'outside',
                },
                rows: 2
            },
            devices: [
                'phone', 'tablet', 'desktop'
            ]
        };

        // merge options
        this.options = revUtils.extend(defaults, opts);

        this.options.inner_widget_options = revUtils.extend(defaults.inner_widget_options, opts.inner_widget_options);

        if (revUtils.validateApiParams(this.options).length) {
            return;
        }

        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        var that = this;

        revUtils.appendStyle('/* inject:css */body{margin:0}#rev-lock{z-index:100000000;position:absolute;width:100%;background-color:#fff;left:0;-webkit-transition:all;transition:all;-webkit-transition-duration:1s;transition-duration:1s;opacity:1;-webkit-transform:none;-ms-transform:none;transform:none}#rev-lock-wrapper{overflow:hidden}#rev-lock.unlocked{opacity:.8;-webkit-transform:translateY(100%);-ms-transform:translateY(100%);transform:translateY(100%)}#rev-lock-unlock{border-radius:6px;font-family:Arial;color:#1f628d;font-size:18;padding:6px 0;border:2px solid #1f628d;text-decoration:none;margin:0 40px 10px;text-align:center;cursor:pointer}#rev-lock-gradient{width:100%;height:60px;position:absolute;top:-60px;background:-webkit-linear-gradient(top,rgba(255,255,255,.35) 0,rgba(255,255,255,1) 100%);background:linear-gradient(to bottom,rgba(255,255,255,.35) 0,rgba(255,255,255,1) 100%)}#rev-lock #rev-slider #rev-slider-container .rev-btn-container{border-radius:0}#rev-opt-out .rd-close-button{position:absolute;cursor:pointer;right:10px;z-index:10}#rev-opt-out a{cursor:pointer!important}#rev-opt-out .rd-box-wrap{display:none;z-index:2147483641}#rev-opt-out .rd-box-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;opacity:.5;filter:alpha(opacity=50);z-index:2147483641}#rev-opt-out .rd-vertical-offset{position:fixed;display:table-cell;top:0;width:100%;z-index:2147483642}#rev-opt-out .rd-box{position:absolute;vertical-align:middle;background-color:#fff;padding:10px;border:1px solid #555;border-radius:12px;-webkit-border-radius:12px;-moz-border-radius:12px;overflow:auto;box-shadow:3px 3px 10px 4px #555}#rev-opt-out .rd-normal{min-width:270px;max-width:435px;width:90%;margin:10px auto}#rev-opt-out .rd-full-screen{position:fixed;right:15px;left:15px;top:15px;bottom:15px}#rev-opt-out .rd-header{height:20px;position:absolute;right:0}#rev-opt-out .rd-about{font-family:Arial,sans-serif;font-size:14px;text-align:left;box-sizing:content-box;color:#333;padding:15px}#rev-opt-out .rd-about .rd-logo{background:url(https://serve.revcontent.com/assets/img/rc-logo.png) bottom center no-repeat;width:220px;height:48px;display:block;margin:0 auto}#rev-opt-out .rd-about p{margin:16px 0;color:#555;font-size:14px;line-height:16px}#rev-opt-out .rd-about p#main{text-align:left}#rev-opt-out .rd-about h2{color:#777;font-family:Arial,sans-serif;font-size:16px;line-height:18px}#rev-opt-out .rd-about a{color:#00cb43}#rev-opt-out .rd-well{border:1px solid #E0E0E0;padding:20px;text-align:center;border-radius:2px;margin:20px 0 0}#rev-opt-out .rd-well h2{margin-top:0}#rev-opt-out .rd-well p{margin-bottom:0}#rev-opt-out .rd-opt-out{text-align:center}#rev-opt-out .rd-opt-out a{margin-top:6px;display:inline-block}/* endinject */', 'rev-lock');

        this.init = function() {

            this.wrapper = document.createElement("div");
            this.wrapper.id = "rev-lock-wrapper";
            while (document.body.firstChild) {
                this.wrapper.appendChild(document.body.firstChild);
            }
            document.body.appendChild(this.wrapper);

            this.element = document.createElement('div');
            this.element.id = 'rev-lock';
            this.element.innerHTML = '<div id="rev-lock-gradient"></div>';
            this.element.setAttribute('class', 'rev-lock');

            this.unlockBtn = document.createElement('div');
            this.unlockBtn.id = 'rev-lock-unlock';
            this.unlockBtn.innerHTML = this.options.unlock_text;

            this.containerElement = document.createElement('div');
            this.containerElement.className = 'rev-lock-inner';

            this.innerWidgetElement = document.createElement('div');

            var marker = document.getElementById(this.options.id);
            var top = marker ? marker.getBoundingClientRect().top : this.options.distance;

            top = top + document.body.scrollTop;

            this.element.style.top = top + 'px';

            revUtils.append(this.containerElement, this.innerWidgetElement);
            revUtils.append(this.element, this.unlockBtn);
            revUtils.append(this.element, this.containerElement);

            revUtils.append(document.body, this.element);

            this.innerWidget = new RevSlider({
                element:      [this.innerWidgetElement],
                url:          'https://trends.revcontent.com/api/v1/',
                api_key:      'bf3f270aa50d127f0f8b8c92a979d76aa1391d38',
                pub_id:       7846,
                widget_id:    13523,
                domain:       'bustle.com',
                rev_position: this.options.inner_widget_options.rev_position,
                header:       this.options.inner_widget_options.header,
                per_row:      this.options.inner_widget_options.per_row,
                rows:         this.options.inner_widget_options.rows,
                image_ratio:  this.options.inner_widget_options.image_ratio,
                buttons:      this.options.inner_widget_options.buttons,
                vertical:     true,
            });

            this.totalHeight = top + this.element.offsetHeight + 'px';

            this.wrapper.style.height = this.totalHeight;

            this.attachButtonEvents();
        };

        this.attachButtonEvents = function() {
            var that = this;
            this.unlockBtn.addEventListener('click', function() {
                that.wrapper.style.height = 'auto';
                revUtils.addClass(that.element, 'unlocked');
                setTimeout(function() {
                    revUtils.remove(that.element);
                }, 1000);
            });
        };

        this.init();
    };

    return RevLock;
}));
