/*
ooooooooo.                          .oooooo..o  o8o        .o8
`888   `Y88.                       d8P'    `Y8  `"'       "888
 888   .d88'  .ooooo.  oooo    ooo Y88bo.      oooo   .oooo888   .ooooo.  ooo. .oo.    .oooo.   oooo    ooo
 888ooo88P'  d88' `88b  `88.  .8'   `"Y8888o.  `888  d88' `888  d88' `88b `888P"Y88b  `P  )88b   `88.  .8'
 888`88b.    888ooo888   `88..8'        `"Y88b  888  888   888  888ooo888  888   888   .oP"888    `88..8'
 888  `88b.  888    .o    `888'    oo     .d8P  888  888   888  888    .o  888   888  d8(  888     `888'
o888o  o888o `Y8bod8P'     `8'     8""88888P'  o888o `Y8bod88P" `Y8bod8P' o888o o888o `Y888""8o     `8'


Project: RevSidenav
Version: 1
Author: michael@revcontent.com

RevSidenav({
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
    window.RevSidenav = factory(window, window.revUtils, window.revDetect);

}( window, function factory(window, revUtils, revDetect) {
'use strict';

    var RevSidenav;
    var instance;
    var defaults = {
        testing: false,
        width: 300,
        inner_widget: 'slider',
        inner_widget_options: {
            header: 'Trending Now',
            per_row: {
                xxs: 2,
                xs: 2,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            rows: 10
        },
        rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
        sponsored: 10,
        internal: false,
        devices: [
            'phone', 'tablet', 'desktop'
        ],
        url: 'https://trends.revcontent.com/api/v1/'
    };

    RevSidenav = function(opts) {
        if (instance) {
            instance.update(opts, instance.options);
            return instance;
        }

        // if it wasn't newed up
        if ( !( this instanceof RevSidenav ) ) {
            instance = new RevSidenav(opts);
            return instance;
        } else {
            instance = this;
        }

        // merge options
        this.options = revUtils.extend(defaults, opts);
        //a hack to make up for revUtils shortcomings
        this.options.inner_widget_options = revUtils.extend(defaults.inner_widget_options, opts.inner_widget_options);

        // param errors
        if (revUtils.validateApiParams(this.options).length) {
            return;
        }
        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        if (revUtils.getCookie('revsidenav-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */.rev-sidenav{-ms-overflow-style:-ms-autohiding-scrollbar;-webkit-text-size-adjust:100%;text-size-adjust:100%;box-sizing:border-box;cursor:default;text-rendering:optimizeLegibility;background:#fff;position:fixed;-webkit-transition:.5s;transition:.5s;width:100%;padding:30px 10px 10px;bottom:0;right:0;-webkit-transition-property:-webkit-transform;transition-property:transform;transform:translateX(100%);-ms-transform:translateX(100%);-moz-transform:translateX(100%);-o-transform:translateX(100%);-webkit-transform:translateX(100%);overflow-y:scroll;border-left:1px solid #dcdcdc}.rev-sidenav .rev-close{position:absolute;top:0;right:0;cursor:pointer;padding:10px;fill:#555}.rev-sidenav *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}.rev-sidenav a,.rev-sidenav a:focus,.rev-sidenav a:hover{text-decoration:none}body.rev-sidenav-loaded{margin:0}body.rev-sidenav-open .rev-sidenav{top:0;right:0;transform:none;-ms-transform:none;-moz-transform:none;-o-transform:none;-webkit-transform:none;z-index:2147483647}/* endinject */', 'rev-sidenav');

        this.init = function() {
            this.sidenavElement = document.createElement('div');
            this.innerWidgetElement = document.createElement('div');
            this.sidenavElement.style.width = this.options.width + 'px';
            this.sidenavElement.style.zIndex = '10001';
            this.sidenavElement.style.height = '100%';
            this.sidenavElement.id = 'rev-sidenav';
            this.sidenavElement.setAttribute('class', 'rev-sidenav');

            this.closeElement = document.createElement('div');
            this.closeElement.setAttribute('class', 'rev-close');
            this.closeElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>';
            revUtils.append(this.sidenavElement, this.closeElement);

            revUtils.append(this.sidenavElement, this.innerWidgetElement);

            revUtils.append(document.body, this.sidenavElement);

            this.innerWidget = new RevSlider({
                element: [this.innerWidgetElement],
                url: 'http://trends.revcontent.com/api/v1/',
                api_key : 'bf3f270aa50d127f0f8b8c92a979d76aa1391d38',
                pub_id : 7846,
                widget_id : 13523,
                domain : 'bustle.com',
                rev_position: 'top_right',
                per_row: this.options.inner_widget_options.per_row,
                rows: this.options.inner_widget_options.rows
            });

            this.attachButtonEvents();
        };

        this.update = function(newOpts, oldOpts) {
            this.options = revUtils.extend(defaults, newOpts);

            if (this.visible != newOpts.visible) {
                if (newOpts.visible) {
                    this.show();
                } else {
                    this.hide();
                }
            }

            if (this.options.width !== oldOpts.width) {
                this.sidenavElement.style.width = this.options.width + 'px';
            }

            if (this.options.width !== oldOpts.width) {
                this.innerWidget.resize();
            }

            if ( (this.options.size !== oldOpts.size) ||
                (this.options.realSize !== oldOpts.realSize) ||
                (this.options.inner_widget_options.per_row !== oldOpts.inner_widget_options.per_row) ||
                (this.options.inner_widget_options.rows !== oldOpts.inner_widget_options.rows)) {
                this.innerWidget.update(this.options.inner_widget_options,  oldOpts.inner_widget_options);
            }
        };


        this.show = function() {
            this.visible = true;
            revUtils.addClass(document.body, 'rev-sidenav-open');
        }

        this.hide = function() {
            this.visible = false;
            revUtils.removeClass(document.body, 'rev-sidenav-open');
        }

        this.attachButtonEvents = function() {
            var that = this;
            this.closeElement.addEventListener('click', function() {
                that.hide();
            });
        }

        this.init();
    };

    return RevSidenav;

}));