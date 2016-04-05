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
    hide_provider: false,
    beacons: true
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevShifter = factory(window, window.revUtils, window.revDetect, window.revDisclose, window.revApi);

}( window, function factory(window, revUtils, revDetect, revDisclose, revApi) {
'use strict';

    var RevShifter;
    var instance;
    var defaults = {
        testing: false,
        size: 300,
        inner_widget: 'slider',
        side: 'top',
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
        show_on_load: false,
        retract_on_load: true,
        retract_time: 4000,
        retract_duration: 2500,
        rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
        sponsored: 10,
        internal: false,
        devices: [
            'phone', 'tablet', 'desktop'
        ],
        url: 'https://trends.revcontent.com/api/v1/',
        disclosure_text: revDisclose.defaultDisclosureText,
        hide_provider: false,
        beacons: true
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

        if (revUtils.getCookie('revshifter-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */.rev-shifter{-ms-overflow-style:-ms-autohiding-scrollbar;-webkit-text-size-adjust:100%;text-size-adjust:100%;box-sizing:border-box;cursor:default;text-rendering:optimizeLegibility;background:#fff;position:fixed;width:100%;padding:30px 10px 10px;-webkit-transition-property:-webkit-transform,height;transition-property:transform,height;box-shadow:none}body .rev-shifter.top{box-shadow:inset 0 -7px 9px -7px #000}.rev-shifter #rev-slider-grid,.rev-shifter.top .rev-content .rev-ad{-webkit-transition-property:height;transition-property:height}.rev-shifter.top .rev-content{-webkit-transition-property:width,height;transition-property:width,height}.rev-shifter.right{right:0;bottom:0;height:100%;border-left:1px solid #dcdcdc;-webkit-transform:translateX(100%);transform:translateX(100%)}.rev-shifter.left{left:0;bottom:0;height:100%;border-right:1px solid #dcdcdc;-webkit-transform:translateX(-100%);transform:translateX(-100%)}.rev-shifter.top{top:0;width:100%;-webkit-transform:translateY(-100%);transform:translateY(-100%)}.rev-shifter.top #rev-slider{display:inline-block}body.retracted .rev-shifter.top #rev-slider{margin-top:-28px}body.retracted .rev-shifter.top #rev-slider .rev-sponsored{margin-top:-24px}.rev-shifter .rev-close{position:absolute;top:0;right:0;cursor:pointer;padding:10px;fill:#555;z-index:1}.rev-shifter *{box-sizing:border-box;font-size:inherit;line-height:inherit;margin:0;padding:0}.rev-shifter a,.rev-shifter a:focus,.rev-shifter a:hover{text-decoration:none}.rev-shifter .rev-toggle{position:absolute;z-index:10001;background-color:#000;text-align:center;line-height:0;cursor:pointer;opacity:.8}.rev-shifter.right .rev-toggle{top:50%;height:100px;vertical-align:middle;left:-30px;margin-top:-50px}.rev-shifter.top .rev-toggle{bottom:-30px;left:50%;width:100px;margin-left:-50px;border-radius:0 0 3px 3px}.rev-shifter .rev-toggle svg{fill:#fff}.rev-shifter.left .rev-toggle svg,.rev-shifter.right .rev-toggle svg{top:50%;margin-top:-18px}body.rev-shifter-loaded{margin:0}body{-webkit-transition-property:margin-top!important;transition-property:margin-top!important}body.rev-shifter-open{margin-top:0}body.rev-shifter-no-transform .rev-shifter{-webkit-transform:none;transform:none;z-index:2147483647}body.rev-shifter-open .rev-shifter{top:0;right:0;-webkit-transform:none!important;transform:none!important;z-index:2147483647}/* endinject */', 'rev-shifter');

        this.init = function() {
            this.element = document.createElement('div');
            this.innerWidgetElement = document.createElement('div');
            this.element.style.zIndex = '10001';
            this.element.id = 'rev-shifter';
            revUtils.addClass(this.element, 'rev-shifter');
            revUtils.addClass(this.element, this.options.side);

            this.closeElement = document.createElement('div');
            this.closeElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>';
            revUtils.addClass(this.closeElement, 'rev-close');
            revUtils.append(this.element, this.closeElement);

            revUtils.append(this.element, this.innerWidgetElement);

            this.toggleElement = document.createElement('div');
            revUtils.addClass(this.toggleElement, 'rev-toggle');
            revUtils.append(this.element, this.toggleElement);

            revUtils.append(document.body, this.element);

            if (this.options.side == 'top') {
                this.options.inner_widget_options.rows = 2;
            }

            if(typeof revApi === 'object'
                && typeof revApi.beacons === 'object'
                && typeof revApi.beacons.setPluginSource === 'function') {
                revApi.beacons.setPluginSource('shifter');
            }

            this.innerWidget = new RevSlider({
                element: [this.innerWidgetElement],
                api_key : this.options.api_key,
                pub_id : this.options.pub_id,
                widget_id : this.options.widget_id,
                domain : this.options.domain,
                rev_position: 'bottom_right',
                header : this.options.inner_widget_options.header,
                per_row: this.options.inner_widget_options.per_row,
                rows: this.options.inner_widget_options.rows,
                text_overlay: true,
                max_headline: true,
                stacked: true,
                transition_duration: this.options.retract_duration + 'ms',
                is_layout_instant: true,
                disclosure_text: this.options.disclosure_text,
                hide_provider: this.options.hide_provider,
                beacons: this.options.beacons
            });

            this.size = this.element.clientHeight;
            this.difference = (this.size - this.innerWidget.grid.maxHeight);
            this.showSize = this.innerWidget.grid.rows[this.innerWidget.grid.getBreakPoint()];

            if (typeof this.options.inner_widget_options.per_row === 'object') {
                this.options.single_per_row = {};
                for (var prop in this.options.inner_widget_options.per_row) {
                    this.options.single_per_row[prop] = (this.options.inner_widget_options.per_row[prop] * this.options.inner_widget_options.rows);
                }
            } else {
                this.options.single_per_row = (this.options.inner_widget_options.per_row * this.options.inner_widget_options.rows);
            }

            if (this.options.side == 'left' || this.options.side == 'right') {
                this.element.style.width = this.options.size + 'px';
            }

            this.handleTransform();

            this.toggleElementInnerHtml();

            this.attachButtonEvents();

            if (this.options.show_on_load) {
                this.show(this.options.retract_on_load);
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
            element.style.transitionDuration = this.options.retract_duration + 'ms';
            element.style.WebkitTransitionDuration = this.options.retract_duration + 'ms';
            element.style.MozTransitionDuration = this.options.retract_duration + 'ms';
            element.style.OTransitionDuration = this.options.retract_duration + 'ms';
        };

        this.handleTransform = function() {
            this.applyTransitionCss(this.element);
            this.applyTransitionCss(document.body);
            this.applyTransitionCss(this.innerWidget.gridElement);
            this.applyTransitionCss(this.element.querySelector('#rev-slider'));
            this.applyTransitionCss(this.element.querySelector('#rev-slider .rev-sponsored'));

            var content = this.element.querySelectorAll('.rev-content');
            for (var i = 0; i < content.length; i++) {
                this.applyTransitionCss(content[i]);
            }

            var ads = this.element.querySelectorAll('.rev-ad');
            for (var i = 0; i < ads.length; i++) {
                this.applyTransitionCss(ads[i]);
            }

            var imgs = this.element.querySelectorAll('.rev-image');
            for (var i = 0; i < imgs.length; i++) { // special case that also needs background transitioned
                imgs[i].style.transition = 'background .5s ease-in-out, height ' + this.options.retract_duration + 'ms';
                imgs[i].style.WebkitTransition = 'background .5s ease-in-out, height ' + this.options.retract_duration + 'ms';
                imgs[i].style.MozTransition = 'background .5s ease-in-out, height ' + this.options.retract_duration + 'ms';
                imgs[i].style.OTransition = 'background .5s ease-in-out, height ' + this.options.retract_duration + 'ms';
            }
        };

        this.transformBody = function(retract) {
            if (this.options.side !== 'top') {
                return;
            }
            if (retract) {
                document.body.style.marginTop = (this.innerWidget.grid.maxHeight + this.difference - 28 - 18) + 'px';
            } else {
                document.body.style.marginTop = this.size + 'px';
            }
        };

        this.retract = function() {
            if (this.options.side !== 'top') {
                return;
            }
            this.retracted = true;
            revUtils.addClass(document.body, 'retracted');
            this.toggleElementInnerHtml();

            this.innerWidget.grid.option({ // not instant
                isLayoutInstant: false,
                itemHeight: (this.showSize / 2)
            });

            this.innerWidget.update({ // one row
                per_row: this.options.single_per_row,
                rows: 1
            });

            this.innerWidget.grid.option({ // back to instant
                isLayoutInstant: true
            });

            this.transformBody(true);
        };

        this.show = function(retract) {
            this.visible = true;
            this.retracted = false;

            revUtils.addClass(document.body, 'rev-shifter-no-transform');

            this.transformBody();

            revUtils.removeClass(document.body, 'retracted');

            this.toggleElementInnerHtml();

            this.innerWidget.grid.option({ // not instant
                isLayoutInstant: false,
                itemHeight: this.showSize
            });

            this.innerWidget.update({ // back to default rows
                per_row: this.options.inner_widget_options.per_row,
                rows: this.options.inner_widget_options.rows
            });

            this.innerWidget.grid.option({ // back to instant
                isLayoutInstant: true
            });

            if (retract) {
                var that = this;
                setTimeout(function() {
                    that.retract();
                }, this.options.retract_time);
            }
        };

        this.hide = function() {
            this.visible = false;
            revUtils.removeClass(document.body, 'rev-shifter-no-transform');
            document.body.style.marginTop = 0;
            this.toggleElementInnerHtml();
        };

        this.toggle = function() {
            if (this.retracted || !this.visible) {
                this.show();
            } else {
                if (this.options.side == 'top') {
                    this.retract();
                } else {
                    this.hide();
                }

            }
        };

        this.toggleElementInnerHtml = function() {
            switch(this.options.side){
                case 'top':
                    if (this.retracted || !this.visible) { // down arrow
                        this.toggleElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path d="M24.88 12.88L18 19.76l-6.88-6.88L9 15l9 9 9-9z"/></svg>';
                    } else { // up arrow
                        this.toggleElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path d="M18 12l-9 9 2.12 2.12L18 16.24l6.88 6.88L27 21z"/></svg>';
                    }
                    break;
                case 'right':
                    if (this.retracted || !this.visible) { // left arrow
                        this.toggleElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path d="M23.12 11.12L21 9l-9 9 9 9 2.12-2.12L16.24 18z"/></svg>';
                    } else { // right arrow
                        this.toggleElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path d="M15 9l-2.12 2.12L19.76 18l-6.88 6.88L15 27l9-9z"/></svg>';
                    }
                    break;
            }
        };

        this.attachButtonEvents = function() {
            var that = this;
            this.closeElement.addEventListener('click', function() {
                that.hide();
            });

            this.toggleElement.addEventListener('click', function() {
                that.toggle();
            });
        };

        this.init();
    };

    return RevShifter;

}));