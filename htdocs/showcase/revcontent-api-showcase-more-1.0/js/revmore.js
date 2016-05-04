/*
ooooooooo.                         ooo        ooooo
`888   `Y88.                       `88.       .888'
 888   .d88'  .ooooo.  oooo    ooo  888b     d'888   .ooooo.  oooo d8b  .ooooo.
 888ooo88P'  d88' `88b  `88.  .8'   8 Y88. .P  888  d88' `88b `888""8P d88' `88b
 888`88b.    888ooo888   `88..8'    8  `888'   888  888   888  888     888ooo888
 888  `88b.  888    .o    `888'     8    Y     888  888   888  888     888    .o
o888o  o888o `Y8bod8P'     `8'     o8o        o888o `Y8bod8P' d888b    `Y8bod8P'

Project: RevMore
Version: 1
Author: michael@revcontent.com

RevMore({
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
    window.RevMore = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDialog);

}( window, function factory(window, revUtils, revDetect, revApi, revDialog) {
'use strict';

    var RevMore = function(opts) {
        var defaults = {
            id: false,
            url: 'https://trends.revcontent.com/api/v1/',
            distance: 500,
            element: false,
            unlock_text: 'Read More...',
            header: 'Trending Now',
            rev_position: 'top_right',
            image_ratio: 'rectangle',
            pagination_dots: true,
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

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-more');

        this.init = function() {

            this.checkPadding();

            this.createElements();

            this.setPadding();

            this.setTop();

            this.appendElements();

            this.innerWidget();

            this.wrapperHeight();

            this.attachButtonEvents();

            this.attachResizedEvents();
        };

        // we don't want any padding on the body
        this.checkPadding = function() {
            //IE9+
            this.padding = {
                top: getComputedStyle(document.body)['padding-top'],
                right: getComputedStyle(document.body)['padding-right'],
                bottom: getComputedStyle(document.body)['padding-bottom'],
                left: getComputedStyle(document.body)['padding-left']
            }
            //make sure we don't have any strange paddings
            document.body.style.paddingBottom = '0';
            document.body.style.paddingLeft = '0';
            document.body.style.paddingRight = '0';
        };

        this.setPadding = function() {
            if (this.padding.top == '0px') { // if there is not padding move along
                return;
            }
            this.wrapper.style.paddingTop = this.padding.top;
            this.wrapper.style.marginTop = '-' + this.padding.top;
        };

        // create the elements
        this.createElements = function() {
            this.wrapper = document.createElement("div");
            this.wrapper.id = "rev-more-wrapper";
            while (document.body.firstChild) {
                this.wrapper.appendChild(document.body.firstChild);
            }
            document.body.appendChild(this.wrapper);

            this.element = document.createElement('div');
            this.element.id = 'rev-more';
            this.element.innerHTML = '<div id="rev-more-gradient"></div>';
            this.element.setAttribute('class', 'rev-more');

            this.unlockBtn = document.createElement('div');
            this.unlockBtn.id = 'rev-more-unlock';
            this.unlockBtn.innerHTML = this.options.unlock_text;

            this.containerElement = document.createElement('div');
            this.containerElement.className = 'rev-more-inner';

            this.innerWidgetElement = document.createElement('div');
        };

        // get the top position using marker if it exists or distance option
        this.setTop = function() {
            var marker = document.getElementById(this.options.id);

            this.top = marker ? marker.getBoundingClientRect().top : this.options.distance;

            this.element.style.top = this.top + 'px';
        };

        this.appendElements = function() {
            revUtils.append(this.containerElement, this.innerWidgetElement);
            revUtils.append(this.element, this.unlockBtn);
            revUtils.append(this.element, this.containerElement);

            revUtils.append(document.body, this.element);
        };

        this.innerWidget = function() {
            this.innerWidget = new RevSlider({
                api_source:   'more',
                element:      [this.innerWidgetElement],
                pagination_dots: this.options.pagination_dots,
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
        };

        // set the wrapper equal to top + the element height
        this.wrapperHeight = function() {
            // subtract 20 to make up for bottom zone
            this.wrapper.style.height = (this.top - 20) + this.element.offsetHeight + 'px';
        };

        // unlock button
        this.attachButtonEvents = function() {
            var that = this;
            this.unlockBtn.addEventListener('click', function() {
                that.wrapper.style.height = 'auto';
                that.wrapper.style.marginBottom = '0'; // remove buffer margin
                // reset any padding or margin set
                document.body.style.paddingBottom = that.padding.bottom;
                document.body.style.paddingLeft = that.padding.left;
                document.body.style.paddingRight = that.padding.right;
                that.wrapper.style.paddingTop = 0;
                that.wrapper.style.marginTop = 0;

                revUtils.addClass(that.element, 'unlocked');

                setTimeout(function() {
                    that.innerWidget.grid.remove();
                    that.innerWidget.grid.destroy();
                    that.innerWidget.mc.set({enable: false});
                    that.innerWidget.mc.destroy();
                    revUtils.remove(that.element);
                    that.wrapper.style.height = 'auto';
                    revApi.beacons.detach('more');
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

    return RevMore;
}));
