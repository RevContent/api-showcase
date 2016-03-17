/*
ooooooooo.                          .oooooo..o oooo         o8o   .o88o.     .
`888   `Y88.                       d8P'    `Y8 `888         `"'   888 `"   .o8
 888   .d88'  .ooooo.  oooo    ooo Y88bo.       888 .oo.   oooo  o888oo  .o888oo  .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'   `"Y8888o.   888P"Y88b  `888   888      888   d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        `"Y88b  888   888   888   888      888   888ooo888  888
 888  `88b.  888    .o    `888'    oo     .d8P  888   888   888   888      888 . 888    .o  888
o888o  o888o `Y8bod8P'     `8'     8""88888P'  o888o o888o o888o o888o     "888" `Y8bod8P' d888b


Project: RevSofia
Version: 1
Author: michael@revcontent.com

RevSofia({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    header: 'Trending Today',
    closed_hours: 24,
    sponsored: 2,
    disclosure_text: revDisclose.defaultDisclosureText,
    hide_provider: false
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevSofia = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevSofia;
    var instance;
    var defaults = {
        testing: false,
        size: 300,
        side: 'bottom',
        inner_widget_options: {
            header: 'Trending Now',
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 3,
                md: 4,
                lg: 4,
                xl: 5,
                xxl: 5
            },
            rows: 1,
            max_headline: false,
            ad_border: false,
            text_right: true,
            text_right_height: 100
        },
        closed_hours: 24,
        show_on_load: false,
        transition_duration: 2500,
        devices: [
            'phone', 'tablet', 'desktop'
        ],
        url: 'https://trends.revcontent.com/api/v1/',
        disclosure_text: revDisclose.defaultDisclosureText,
        hide_provider: false
    };

    RevSofia = function(opts) {
        if (instance) {
            instance.update(opts, instance.options);
            return instance;
        }

        // if it wasn't newed up
        if ( !( this instanceof RevSofia ) ) {
            instance = new RevSofia(opts);
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

        if (revUtils.getCookie('rev-sofia-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */#rev-sofia.rev-sofia{-ms-overflow-style:-ms-autohiding-scrollbar;-webkit-text-size-adjust:100%;text-size-adjust:100%;box-sizing:border-box;cursor:default;text-rendering:optimizeLegibility;background:#fff;position:fixed;width:100%;-webkit-transition-property:-webkit-transform,height;transition-property:transform,height;box-shadow:none;line-height:0}#rev-sofia.rev-sofia #rev-slider-container{background:#fff;padding:5px;z-index:100}#rev-sofia.rev-sofia .rev-foot{position:absolute;right:10px;padding:2px 24px 2px 4px;background:#fff;border:1px solid #ccc;-webkit-transition:-webkit-transform .5s;transition:transform .5s}#rev-sofia.rev-sofia.bottom.rev-hidden .rev-foot{-webkit-transform:translateY(100%);-ms-transform:translateY(100%);transform:translateY(100%)}#rev-sofia.rev-sofia.top.rev-hidden .rev-foot{-webkit-transform:translateY(-100%);-ms-transform:translateY(-100%);transform:translateY(-100%)}#rev-sofia.rev-sofia:hover .rev-foot{-webkit-transform:translateY(0);-ms-transform:translateY(0);transform:translateY(0)}#rev-sofia.rev-sofia.bottom .rev-foot{top:-28px;-webkit-transform:translateY(100%);-ms-transform:translateY(100%);transform:translateY(100%);border-radius:4px 4px 0 0}#rev-sofia.rev-sofia.top .rev-foot{bottom:-24px;-webkit-transform:translateY(-100%);-ms-transform:translateY(-100%);transform:translateY(-100%);border-radius:0 0 4px 4px}#rev-sofia.rev-sofia .rev-close{position:absolute;top:2px;right:2px;cursor:pointer;fill:#555;z-index:1}#rev-sofia.rev-sofia.top{top:0;width:100%;-webkit-transform:translateY(-100%);-ms-transform:translateY(-100%);transform:translateY(-100%);box-shadow:inset 0 -7px 9px -7px #999}#rev-sofia.rev-sofia.bottom{bottom:0;width:100%;-webkit-transform:translateY(100%);-ms-transform:translateY(100%);transform:translateY(100%);box-shadow:0 -7px 9px -7px #999}#rev-sofia.rev-sofia .rev-content{border-right:1px solid #e3e3e3}#rev-sofia.rev-sofia .rev-content:last-child{border-right:none}#rev-slider .rev-ad,#rev-sofia.rev-sofia #rev-slider .rev-image img{border-radius:0!important}body.retracted #rev-sofia.rev-sofia.top #rev-slider{margin-top:-28px}body.retracted #rev-sofia.rev-sofia.top #rev-slider .rev-sponsored{margin-top:-24px}#rev-sofia.rev-sofia *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}#rev-sofia.rev-sofia a,#rev-sofia.rev-sofia a:focus,#rev-sofia.rev-sofia a:hover{text-decoration:none}#rev-sofia.rev-sofia .rev-toggle{position:absolute;z-index:10001;background-color:#000;text-align:center;line-height:0;cursor:pointer;opacity:.8}#rev-sofia.rev-sofia.right .rev-toggle{top:50%;height:100px;vertical-align:middle;left:-30px;margin-top:-50px}#rev-sofia.rev-sofia.top .rev-toggle{bottom:-30px;left:50%;width:100px;margin-left:-50px;border-radius:0 0 3px 3px}#rev-sofia.rev-sofia .rev-toggle svg{fill:#fff}#rev-sofia.rev-sofia.left .rev-toggle svg,#rev-sofia.rev-sofia.right .rev-toggle svg{top:50%;margin-top:-18px}#rev-sofia.rev-sofia.rev-mobile #rev-slider-container{padding-left:46px}#rev-sofia.rev-sofia.rev-mobile #rev-slider-container .rev-btn-dual{opacity:1}#rev-sofia.rev-sofia.rev-mobile .rev-foot{right:5px}#rev-sofia.rev-sofia.rev-mobile:not(.rev-hidden) .rev-foot{-webkit-transform:none;-ms-transform:none;transform:none}body.rev-sofia-loaded{margin:0}body{-webkit-transition-property:margin-bottom,margin-top!important;transition-property:margin-bottom,margin-top!important}body.rev-sofia-no-transform #rev-sofia.rev-sofia{-webkit-transform:none;-ms-transform:none;transform:none;z-index:2147483647}body.rev-sofia-open #rev-sofia.rev-sofia{top:0;right:0;-webkit-transform:none!important;-ms-transform:none!important;transform:none!important;z-index:2147483647}/* endinject */', 'rev-sofia');

        this.init = function() {
            this.element = document.createElement('div');
            this.element.style.zIndex = '10001';
            this.element.id = 'rev-sofia';
            revUtils.addClass(this.element, 'rev-sofia');
            revUtils.addClass(this.element, this.options.side);
            if (revDetect.mobile()) {
                revUtils.addClass(this.element, 'rev-mobile');
            }

            revUtils.append(document.body, this.element);

            this.innerWidget = new RevSlider({
                element: [this.element],
                api_key : this.options.api_key,
                pub_id : this.options.pub_id,
                widget_id : this.options.widget_id,
                domain : this.options.domain,
                rev_position: 'bottom_right',
                header : this.options.inner_widget_options.header,
                per_row: this.options.inner_widget_options.per_row,
                rows: this.options.inner_widget_options.rows,
                max_headline: this.options.inner_widget_options.max_headline,
                ad_border: this.options.inner_widget_options.ad_border,
                text_right: this.options.inner_widget_options.text_right,
                text_right_height: this.options.inner_widget_options.text_right_height,
                transition_duration: this.options.transition_duration + 'ms',
                is_layout_instant: true,
                disclosure_text: this.options.disclosure_text,
                hide_provider: this.options.hide_provider,
                hide_header: true,
                buttons: {
                    forward: true,
                    back: true,
                    size: 40,
                    position: 'inside',
                    dual: true
                }
            });

            this.closeElement = document.createElement('div');
            this.closeElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>';
            revUtils.addClass(this.closeElement, 'rev-close');

            revUtils.append(this.innerWidget.foot, this.closeElement);

            this.size = this.element.clientHeight;
            this.difference = (this.size - this.innerWidget.grid.maxHeight);
            this.showSize = this.innerWidget.grid.rows[1].height;

            if (typeof this.options.inner_widget_options.per_row === 'object') {
                this.options.single_per_row = {};
                for (var prop in this.options.inner_widget_options.per_row) {
                    this.options.single_per_row[prop] = (this.options.inner_widget_options.per_row[prop] * this.options.inner_widget_options.rows);
                }
            } else {
                this.options.single_per_row = (this.options.inner_widget_options.per_row * this.options.inner_widget_options.rows);
            }

            this.handleTransform();

            this.attachButtonEvents();

            if (this.options.show_on_load) {
                this.show();
            }
        };

        this.update = function(newOpts, oldOpts) {
            this.options = revUtils.extend(defaults, newOpts);
            //a hack to make up for revUtils shortcomings
            this.options.inner_widget_options = revUtils.extend(defaults.inner_widget_options, newOpts.inner_widget_options);

            if (this.visible != newOpts.visible) {
                if (newOpts.visible) {
                    this.show();
                } else {
                    this.hide();
                }
            }

            if (this.options.width !== oldOpts.width) {
                this.element.style.width = this.options.width + 'px';
                this.innerWidget.resize();
            }

            if ( (this.options.size !== oldOpts.size) ||
                (this.options.realSize !== oldOpts.realSize) ||
                (this.options.inner_widget_options.header !== oldOpts.inner_widget_options.header) ||
                (this.options.inner_widget_options.per_row !== oldOpts.inner_widget_options.per_row) ||
                (this.options.inner_widget_options.rows !== oldOpts.inner_widget_options.rows)) {
                this.innerWidget.update(this.options.inner_widget_options,  oldOpts.inner_widget_options);
            }
        };

        this.applyTransitionCss = function(element) {
            element.style.transitionDuration = this.options.transition_duration + 'ms';
            element.style.WebkitTransitionDuration = this.options.transition_duration + 'ms';
            element.style.MozTransitionDuration = this.options.transition_duration + 'ms';
            element.style.OTransitionDuration = this.options.transition_duration + 'ms';
        };

        this.handleTransform = function() {
            this.applyTransitionCss(this.element);
            this.applyTransitionCss(document.body);
        };

        this.show = function() {
            this.visible = true;
            revUtils.addClass(document.body, 'rev-sofia-no-transform');
            document.body.style[this.options.side == 'bottom' ? 'marginBottom' : 'marginTop'] = this.size + 'px';
        };

        this.hide = function() {
            this.visible = false;
            revUtils.removeClass(document.body, 'rev-sofia-no-transform');
            document.body.style[this.options.side == 'bottom' ? 'marginBottom' : 'marginTop'] = 0;
            var that = this;
            setTimeout(function() {
                revUtils.addClass(that.element, 'rev-hidden');
            }, this.options.transition_duration);
        };

        this.attachButtonEvents = function() {
            var that = this;
            this.closeElement.addEventListener('click', function() {
                that.hide();
                revUtils.setCookie('rev-sofia-closed', 1, (that.options.closed_hours / 24));
            });
        };

        this.init();
    };

    return RevSofia;

}));