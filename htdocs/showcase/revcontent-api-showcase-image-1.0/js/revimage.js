/*
ooooooooo.                         ooooo
`888   `Y88.                       `888'
 888   .d88'  .ooooo.  oooo    ooo  888  ooo. .oo.  .oo.    .oooo.    .oooooooo  .ooooo.
 888ooo88P'  d88' `88b  `88.  .8'   888  `888P"Y88bP"Y88b  `P  )88b  888' `88b  d88' `88b
 888`88b.    888ooo888   `88..8'    888   888   888   888   .oP"888  888   888  888ooo888
 888  `88b.  888    .o    `888'     888   888   888   888  d8(  888  `88bod8P'  888    .o
o888o  o888o `Y8bod8P'     `8'     o888o o888o o888o o888o `Y888""8o `8oooooo.  `Y8bod8P'
                                                                     d"     YD
                                                                     "Y88888P'
Project: RevImage
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevImage = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevImage = function(opts) {

        var defaults = {
            url: 'https://trends.revcontent.com/api/v1/',
            header: 'Trending',
            per_row: {
                xxs: 1,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 3,
                xl: 4,
                xxl: 5
            },
            rows: 1,
            max_headline: true,
            ad_border: false,
            text_right: true,
            text_right_height: {
                xxs: 70,
                xs: 70,
                sm: 80,
                md: 80,
                lg: 100,
                xl: 100,
                xxl: 120
            },
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            disclosure_text: 'Ads by Revcontent',
            disclosure_text_small: 'Ads',
            overlay: false, // pass key value object { content_type: icon }
            overlay_icons: false, // pass in custom icons or overrides
            overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            timeout: 1000, // timeout in ms for image ad
            show_transition: 600,
            multipliers: {
                margin: -3
            },
            buttons: {
                forward: true,
                back: true,
                size: 40,
                position: 'dual'
            },
            theme: 'light',
            query_params: false,
            selector: false
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

        if (revUtils.getCookie('rev-image-closed') && !this.options.testing) {
            return;
        }

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-image');

        if (this.options.selector) {
            this.queriedElements = document.querySelectorAll(this.options.selector);
        } else {
            this.queriedElements = [this.options.element ? this.options.element[0] : document.getElementById(this.options.id)];
        }

        this.elements = [];
        for (var i = 0; i < this.queriedElements.length; i++) {
            if (this.queriedElements[i].tagName === 'IMG') {
                this.elements.push(this.queriedElements[i]);
            }
        }

        if (!this.elements.length) {
            return;
        }

        this.items = [];
        for (var i = 0; i < this.elements.length; i++) {
            this.items.push(new Item(this.elements[i], this));
        }
    };

    var Item = function(element, manager) {
        this.element = element;
        this.options = manager.options;

        this.emitter = new EventEmitter();
        var that = this;
        revUtils.imagesLoaded([this.element]).once('done', function() {
            that.resetElementStyle();
            that.container();
            that.wrapper();
            that.wrapperWidth();
            that.innerWidget();
            that.bindResize();
            that.appendElements();
            that.checkSmall();
            that.attachCloseButtonEvent();
            that.addCss();
            that.attachScrollEvents();
            that.imageVisible();
        });
    }

    /*
    reset any styles that will cause issues and cache them to be placed on the element later
    */
    Item.prototype.resetElementStyle = function() {
        this.elementMargin = revUtils.getComputedStyle(this.element, 'margin');
        this.elementPadding = revUtils.getComputedStyle(this.element, 'padding');
        this.element.style.padding = 0;
        this.element.style.margin = 0;
    };

    Item.prototype.container = function() {
        this.container = document.createElement('div');
        this.container.id = 'rev-img';
        revUtils.addClass(this.container, 'rev-img');
        revUtils.addClass(this.container, 'rev-img-' + this.options.theme);
        revUtils.addClass(this.container, 'rev-img-buttons-' + this.options.buttons.position);
        revUtils.wrap(this.element, this.container);
        this.container.style.margin = this.elementMargin;
        this.container.style.padding = this.elementPadding;
    };

    Item.prototype.wrapper = function() {
        this.wrapper = document.createElement('div');
        revUtils.addClass(this.wrapper, 'rev-img-wrapper');
        revUtils.append(this.container, this.wrapper);
    };

    Item.prototype.wrapperWidth = function() {
        this.wrapper.style.maxWidth = this.element.offsetWidth + 'px';
    };

    Item.prototype.innerWidget = function() {
        this.innerWidget = new RevSlider({
            is_resize_bound: false, // need to listen to window resize so don't double bind
            api_source: 'image',
            visible: false,
            element: [this.wrapper],
            url: this.options.url,
            api_key : this.options.api_key,
            pub_id : this.options.pub_id,
            widget_id : this.options.widget_id,
            domain : this.options.domain,
            header : this.options.header,
            per_row: this.options.per_row,
            rows: this.options.rows,
            max_headline: this.options.max_headline,
            ad_border: this.options.ad_border,
            text_right: this.options.text_right,
            text_right_height: this.options.text_right_height,
            hide_header: true,
            hide_footer: true,
            multipliers: this.options.multipliers,
            pagination_dots: true,
            buttons: this.options.buttons,
            beacons: this.options.beacons,
            touch_direction: Hammer.DIRECTION_ALL, // prevent vertical scrolling
            overlay: this.options.overlay, // video: rectangle, square, circle1, circle2, triangle
            overlay_icons: this.options.overlay_icons, // pass in custom icons or overrides
            overlay_position: this.options.overlay_position, // center, top_left, top_right, bottom_right, bottom_left
            query_params: this.options.query_params
        });
    };

    Item.prototype.bindResize = function() {
        this.resizeListener = this.resize.bind(this);
        revUtils.addEventListener(window, 'resize', this.resizeListener);
    };

    Item.prototype.resize = function() {
        if ( this.resizeTimeout ) {
            clearTimeout( this.resizeTimeout );
        }

        var that = this;
        function delayed() {
            that.wrapperWidth();
            that.checkSmall();
            // manually handle the resize layout b/c is_resize_bound: false
            that.innerWidget.grid.isResizeBound = true;
            that.innerWidget.grid.resize();
            that.innerWidget.grid.isResizeBound = false;

            delete that.resizeTimeout;
        }

        this.resizeTimeout = setTimeout( delayed, 100 );
    }

    Item.prototype.isSmall = function() {
         return this.wrapper.offsetWidth < 400;
    };

    Item.prototype.appendElements = function() {

        this.headSpacer = document.createElement('div');
        revUtils.addClass(this.headSpacer, 'rev-head-spacer');

        this.head = document.createElement('div');
        revUtils.addClass(this.head, 'rev-head');

        this.header = document.createElement('div');
        this.header.innerHTML = '<div class="inner"><h2>' + this.options.header + '</h2></div>';
        revUtils.addClass(this.header, 'rev-header');

        this.sponsoredElement = document.createElement('div');
        revUtils.addClass(this.sponsoredElement, 'rev-sponsored');

        this.closeElement = document.createElement('div');
        this.closeElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>';
        revUtils.addClass(this.closeElement, 'rev-close');

        revUtils.append(this.head, this.headSpacer);
        revUtils.append(this.head, this.header);
        revUtils.append(this.head, this.sponsoredElement);
        revUtils.append(this.head, this.closeElement);

        revUtils.prepend(this.wrapper, this.head);
    };

    // disclosure and rev-img-small class depending on isSmall
    Item.prototype.checkSmall = function() {
        revUtils.removeClass(this.container, 'rev-img-small');
        var disclosureText = this.options.disclosure_text;
        if (this.isSmall()) {
            disclosureText = this.options.disclosure_text_small;
            revUtils.addClass(this.container, 'rev-img-small');
        }
        this.sponsoredElement.innerHTML = revDisclose.getDisclosure(disclosureText);
    };

    Item.prototype.addCss = function() {
        revUtils.transitionCss(this.wrapper, 'transform ' + this.options.show_transition + 'ms');
    };

    Item.prototype.imageVisible = function() {
        // did the user scroll past the bottom of the element
        if ((window.pageYOffset + window.innerHeight >= (this.container.getBoundingClientRect().top + document.body.scrollTop) + this.container.offsetHeight) &&
            this.container.getBoundingClientRect().top > 0) {
            this.emitter.emitEvent('visible');
        }

        if (window.pageYOffset + window.innerHeight < this.container.getBoundingClientRect().top + document.body.scrollTop ||
            this.container.getBoundingClientRect().top + this.container.offsetHeight <= 0) {
            this.emitter.emitEvent('hidden');
        }
    };

    Item.prototype.attachScrollEvents = function() {
        this.scrollListener = this.imageVisible.bind(this);
        revUtils.addEventListener(window, 'scroll', this.scrollListener);

        var that = this;

        this.emitter.on('hidden', function() {
            if (that.showing) {
                return;
            }
            revUtils.transformCss(that.wrapper, 'translateY(100%)');
        });

        this.emitter.on('visible', function() {
            that.showing = true;
            that.innerWidget.dataPromise.then(function() {
                that.innerWidget.registerImpressions();
                setTimeout(function() {
                    revUtils.transformCss(that.wrapper, 'none');
                    setTimeout(function() {
                        that.showing = false;
                    }, that.options.show_transition);
                }, that.options.timeout);
            });
        });
    };

    Item.prototype.update = function(newOpts, oldOpts) {

        this.options = revUtils.extend(defaults, newOpts);

        if (this.visible != newOpts.visible) {
            if (newOpts.visible) {
                this.show();
            } else {
                this.hide();
            }
        }

        if (this.options.width !== oldOpts.width) {
            this.element.style.width = this.options.width + 'px';
            this.innerWidget.grid.isResizeBound = true;
            this.innerWidget.grid.resize();
            this.innerWidget.grid.isResizeBound = false;
        }

        if ( (this.options.size !== oldOpts.size) ||
            (this.options.realSize !== oldOpts.realSize) ||
            (this.options.inner_widget_options.header !== oldOpts.inner_widget_options.header) ||
            (this.options.inner_widget_options.per_row !== oldOpts.inner_widget_options.per_row) ||
            (this.options.inner_widget_options.rows !== oldOpts.inner_widget_options.rows)) {
            this.innerWidget.update(this.options.inner_widget_options,  oldOpts.inner_widget_options);
        }
    };

    Item.prototype.hide = function() {
        revUtils.transformCss(this.wrapper, 'translateY(100%)');

        var that = this;
        setTimeout(function() {
            that.destroy();
        }, this.options.show_transition);
    };

    Item.prototype.attachCloseButtonEvent = function() {
        this.closeListener = this.hide.bind(this);
        revUtils.addEventListener(this.closeElement, 'click', this.closeListener);
    };

    Item.prototype.destroy = function() {
        this.innerWidget.destroy();
        revUtils.removeEventListener(window, 'scroll', this.scrollListener);
        revUtils.removeEventListener(window, 'resize', this.resizeListener);
        revUtils.removeEventListener(this.closeElement, 'click', this.closeListener);
        revUtils.remove(this.wrapper);
    };

    return RevImage;

}));