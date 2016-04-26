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
    domain: 'widget domain'
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
            url: 'https://trends.revcontent.com/api/v1/',
            distance: 500,
            element: false,
            unlock_text: 'Read More...',
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
                forward: false,
                back: false
            },
            rows: 2,
            headline_size: 3,
            disclosure_text: 'Ads by Revcontent',
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            beacons: true
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

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-lock');

        this.init = function() {

            this.setTop();

            this.wrapperHeight();

            this.attachResizedEvents();
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

        // get the top position using marker if it exists or distance option
        this.setTop = function() {
            var marker = document.getElementById(this.options.id);
            this.top = marker ? marker.getBoundingClientRect().top : this.options.distance;

            this.element.style.top = this.top + 'px';
        }

            revUtils.append(this.containerElement, this.innerWidgetElement);
            revUtils.append(this.element, this.unlockBtn);
            revUtils.append(this.element, this.containerElement);

            revUtils.append(document.body, this.element);

            this.innerWidget = new RevSlider({
                api_source:   'lock',
                element:      [this.innerWidgetElement],
                url:          this.options.url,
                api_key:      this.options.api_key,
                pub_id:       this.options.pub_id,
                widget_id:    this.options.widget_id,
                domain:       this.options.domain,
                rev_position: this.options.rev_position,
                header:       this.options.header,
                per_row:      this.options.per_row,
                rows:         this.options.rows,
                image_ratio:  this.options.image_ratio,
                headline_size: this.options.headline_size,
                buttons:      this.options.buttons,
                beacons:      this.options.beacons,
                prevent_default_pan: false,
                disclosure_text: this.options.disclosure_text,
                multipliers: {
                    font_size: 3,
                    margin: -2.2,
                    padding: 2
                }
            });

        // set the wrapper equal to top + the element height
        this.wrapperHeight = function() {
            this.wrapper.style.height = this.top + this.element.offsetHeight + 'px';
        }

        this.attachButtonEvents = function() {
            var that = this;
            this.unlockBtn.addEventListener('click', function() {
                that.wrapper.style.height = 'auto';
                document.body.style.padding = that.bodyPadding;// reset any body padding
                revUtils.addClass(that.element, 'unlocked');
                setTimeout(function() {
                    revUtils.remove(that.element);
                    revApi.beacons.detach('lock');
                }, 1000);
            });
        };

        // reset the wrapper height on resize
        this.attachResizedEvents = function() {
            var that = this;
            this.innerWidget.emitter.on( 'resized', function() {
                that.wrapperHeight();
            });
        };

        this.init();
    };

    return RevLock;
}));
