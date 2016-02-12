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

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-lock');

        this.init = function() {

            this.bodyPadding = getComputedStyle(document.body)['padding'];//IE9+
            document.body.style.padding = '0';//make sure we don't have any strange paddings

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
                document.body.style.padding = that.bodyPadding;// reset any body padding
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
