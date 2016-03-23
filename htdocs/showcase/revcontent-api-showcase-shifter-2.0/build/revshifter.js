/*
ooooooooo.                          .oooooo..o oooo         o8o   .o88o.     .
`888   `Y88.                       d8P'    `Y8 `888         `"'   888 `"   .o8
 888   .d88'  .ooooo.  oooo    ooo Y88bo.       888 .oo.   oooo  o888oo  .o888oo  .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'   `"Y8888o.   888P"Y88b  `888   888      888   d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        `"Y88b  888   888   888   888      888   888ooo888  888
 888  `88b.  888    .o    `888'    oo     .d8P  888   888   888   888      888 . 888    .o  888
o888o  o888o `Y8bod8P'     `8'     8""88888P'  o888o o888o o888o o888o     "888" `Y8bod8P' d888b


Project: RevShifter
Version: 1
Author: michael@revcontent.com

RevShifter({
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
    window.RevShifter = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevShifter;
    var instance;
    var defaults = {
        testing: false,
        size: 300,
        side: 'bottom',
        show_on_load: false,
        show_on_scroll: true,
        scroll_natural: true,
        inner_widget_options: {
            header: 'Trending Now',
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 4,
                xl: 5,
                xxl: 5
            },
            rows: 1,
            max_headline: true,
            ad_border: false,
            text_right: true,
            text_right_height: 100
        },
        closed_hours: 24,
        transition_duration: 2500,
        devices: [
            'phone', 'tablet', 'desktop'
        ],
        url: 'https://trends.revcontent.com/api/v1/',
        disclosure_text: revDisclose.defaultDisclosureText,
        hide_provider: false
    };

    RevShifter = function(opts) {
        if (instance) {
            instance.update(opts, instance.options);
            return instance;
        }

        // if it wasn't newed up
        if ( !( this instanceof RevShifter ) ) {
            instance = new RevShifter(opts);
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

        if (revUtils.getCookie('rev-shifter-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */body{margin-left:0;margin-right:0;-webkit-transition-property:margin-bottom,margin-top!important;transition-property:margin-bottom,margin-top!important}body.rev-shifter-no-transform #rev-shifter.rev-shifter{-webkit-transform:none;-ms-transform:none;transform:none;z-index:2147483647}#rev-shifter.rev-shifter{font-family:sans-serif;-ms-overflow-style:-ms-autohiding-scrollbar;-webkit-text-size-adjust:100%;text-size-adjust:100%;box-sizing:border-box;cursor:default;text-rendering:optimizeLegibility;background:#fff;position:fixed;width:100%;-webkit-transition-property:-webkit-transform,height;transition-property:transform,height;box-shadow:none;line-height:0}#rev-shifter.rev-shifter #rev-slider-container{background:#fff;padding:5px;z-index:100}#rev-shifter.rev-shifter.bottom{padding-bottom:15px}#rev-shifter.rev-shifter .rev-foot{position:absolute;right:10px;padding:2px 24px 2px 4px;background:#fff;border:1px solid #ccc;-webkit-transition:-webkit-transform .5s;transition:transform .5s}#rev-shifter.rev-shifter.bottom.rev-hidden .rev-foot{-webkit-transform:translateY(100%);-ms-transform:translateY(100%);transform:translateY(100%)}#rev-shifter.rev-shifter.top.rev-hidden .rev-foot{-webkit-transform:translateY(-100%);-ms-transform:translateY(-100%);transform:translateY(-100%)}#rev-shifter.rev-shifter.bottom .rev-foot{top:-28px;-webkit-transform:translateY(100%);-ms-transform:translateY(100%);transform:translateY(100%);border-radius:4px 4px 0 0}#rev-shifter.rev-shifter.top .rev-foot{bottom:-24px;-webkit-transform:translateY(-100%);-ms-transform:translateY(-100%);transform:translateY(-100%);border-radius:0 0 4px 4px}#rev-shifter.rev-shifter:hover .rev-foot{-webkit-transform:translateY(0);-ms-transform:translateY(0);transform:translateY(0)}#rev-shifter.rev-shifter .rev-close{position:absolute;top:2px;right:2px;cursor:pointer;fill:#555;z-index:1}#rev-shifter.rev-shifter.top{top:0;width:100%;-webkit-transform:translateY(-100%);-ms-transform:translateY(-100%);transform:translateY(-100%);box-shadow:0 -1px 7px 1px #999}#rev-shifter.rev-shifter.bottom{bottom:0;width:100%;-webkit-transform:translateY(100%);-ms-transform:translateY(100%);transform:translateY(100%);box-shadow:0 4px 6px 5px #999}#rev-shifter.rev-shifter.rev-hidden{-webkit-transition-property:-webkit-transform,height,box-shadow;transition-property:transform,height,box-shadow;box-shadow:none}#rev-shifter.rev-shifter .rev-content{border-right:1px solid #e3e3e3}#rev-shifter.rev-shifter .rev-content:last-child{border-right:none}#rev-shifter.rev-shifter #rev-slider .rev-image img,#rev-slider .rev-ad{border-radius:0!important}#rev-shifter.rev-shifter *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}#rev-shifter.rev-shifter a,#rev-shifter.rev-shifter a:focus,#rev-shifter.rev-shifter a:hover{text-decoration:none}#rev-shifter.rev-shifter .rev-toggle{position:absolute;z-index:10001;background-color:#000;text-align:center;line-height:0;cursor:pointer;opacity:.8}#rev-shifter.rev-shifter.right .rev-toggle{top:50%;height:100px;vertical-align:middle;left:-30px;margin-top:-50px}#rev-shifter.rev-shifter.top .rev-toggle{bottom:-30px;left:50%;width:100px;margin-left:-50px;border-radius:0 0 3px 3px}#rev-shifter.rev-shifter .rev-toggle svg{fill:#fff}#rev-shifter.rev-shifter.left .rev-toggle svg,#rev-shifter.rev-shifter.right .rev-toggle svg{top:50%;margin-top:-18px}#rev-shifter.rev-shifter.rev-mobile #rev-slider-container{padding-left:46px}#rev-shifter.rev-shifter.rev-mobile #rev-slider-container .rev-btn-dual{opacity:1}#rev-shifter.rev-shifter.rev-mobile .rev-foot{right:5px}#rev-shifter.rev-shifter.rev-mobile:not(.rev-hidden) .rev-foot{-webkit-transform:none;-ms-transform:none;transform:none}/* endinject */', 'rev-shifter');

        this.init = function() {
            this.element = document.createElement('div');
            this.element.style.zIndex = '10001';
            this.element.id = 'rev-shifter';
            revUtils.addClass(this.element, 'rev-shifter');
            revUtils.addClass(this.element, 'rev-hidden');
            revUtils.addClass(this.element, this.options.side);
            if (revDetect.mobile()) {
                revUtils.addClass(this.element, 'rev-mobile');
            }

            revUtils.append(document.body, this.element);

            this.innerWidget = new RevSlider({
                visible: this.options.show_on_load,
                element: [this.element],
                url: this.options.url,
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

            // scrolling
            var that = this;
            var move = function() {
                if (this.removed) {
                    window.removeEventListener('scroll', move);
                    return;
                }

                if (that.scrollTimeout) {
                    return;
                }

                function delayed() {
                    var scrollTop = window.pageYOffset;
                    var scrollDirection = false;
                    if (scrollTop < that.lastScrollTop) {
                        scrollDirection = 'up';
                    } else if(scrollTop > that.lastScrollTop) {
                        scrollDirection = 'down';
                    }

                    if (scrollDirection === 'up') {
                        that.options.scroll_natural ? that.hide() : that.show();
                    } else if (scrollDirection === 'down') {
                        that.options.scroll_natural ? that.show() : that.hide();
                    }
                    that.lastScrollTop = scrollTop;
                    that.scrollTimeout = false;
                }

                that.scrollTimeout = setTimeout( delayed, 300);
            };

            this.scrollTimeout;
            // wait a tick or two before doing the scroll b/c of auto scroll feature in some browsers
            if (this.options.show_on_scroll) {
                setTimeout(function() {
                    that.lastScrollTop = window.pageYOffset;
                    revUtils.addEventListener(window, 'scroll', move);
                }, 300);
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
            this.hideTimeout = clearTimeout(this.hideTimeout);
            revUtils.removeClass(this.element, 'rev-hidden');

            this.visible = true;

            this.innerWidget.registerImpressions();

            revUtils.addClass(document.body, 'rev-shifter-no-transform');

            if (!this.options.show_on_scroll) {
                document.body.style[this.options.side == 'bottom' ? 'marginBottom' : 'marginTop'] = this.size + 'px';
            }
        };

        this.hide = function() {
            this.visible = false;

            revUtils.removeClass(document.body, 'rev-shifter-no-transform');

            if (!this.options.show_on_scroll) {
                document.body.style[this.options.side == 'bottom' ? 'marginBottom' : 'marginTop'] = 0;
            }

            if (this.hideTimeout) {
                return;
            }

            var that = this;
            this.hideTimeout = setTimeout(function() {
                revUtils.addClass(that.element, 'rev-hidden');
                that.hideTimeout = false;
            }, this.options.transition_duration);
        };

        this.attachButtonEvents = function() {
            var that = this;
            this.closeElement.addEventListener('click', function() {
                that.hide();
                that.removed = true;
                revUtils.setCookie('rev-shifter-closed', 1, (that.options.closed_hours / 24));
            });
        };

        this.init();
    };

    return RevShifter;

}));