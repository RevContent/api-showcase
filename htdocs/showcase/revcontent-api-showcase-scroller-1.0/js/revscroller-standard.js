/*
Project: RevScroller
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevScroller = factory(window, window.revUtils, window.revApi);

}( window, function factory(window, revUtils, revApi) {
'use strict';

    var RevScroller = function(opts) {

        var defaults = {
            host: 'https://trends.revcontent.com',
            cols: 3,
            rows: 6,
            developer: false,
            viewable_percentage: 50,
            visible_rows: 3,
            query_params: false
        };

        // merge options
        this.options = revUtils.extend(defaults, opts);

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-scroll');

        this.init();
    };

    RevScroller.prototype.init = function() {
        // properties
        this.currentRow = 0;
        this.transform = 0;
        this.heights = [];

        // grab elements
        this.createElements();
        this.setHeight();

        // init viewability
        this.initViewability();

        // can trigger views
        this.mouseWheel();
        this.button();

        // just in case
        var fallbacks = [500, 1000, 2000, 5000];
        var that = this;
        for (var i = 0; i < fallbacks.length; i++) {
            setTimeout(function() {
                that.setHeight();
            }, fallbacks[i])
        }
    };

    // create the elements
    RevScroller.prototype.createElements = function() {

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);        

        this.containerElement = this.element.parentNode;

        this.elements = this.element.querySelectorAll('.rc-item');
    };

    RevScroller.prototype.setHeight = function () {
        this.heights = [];

        var height = 0;
        for (var i = 0; i < this.elements.length; i++) {
            var element = this.elements[i];
            height = Math.max(height, element.offsetHeight);
            if (((i + 1) % this.options.cols) == 0) {
                this.heights.push(height);
                height = 0;
            }
        }

        var height = 0;
        this.scrollSpace = 0;

        for (var i = 0; i < this.heights.length; i++) {
            if (i < this.options.visible_rows) {
                if (i === (this.options.visible_rows - 1)) {
                    var half = (this.heights[i] / 2)
                    height += half;
                    this.scrollSpace += half;
                } else {
                    height += this.heights[i];
                }
            } else {
                this.scrollSpace += this.heights[i];
            }
        }

        if (height > 0) {
            revUtils.addClass(this.containerElement, 'rev-scroller');
            this.containerElement.style.height = height + 'px';
        }
    };

    RevScroller.prototype.mouseWheel = function () {
        var that = this;
        var direction;

        var hovering = false;

        revUtils.addEventListener(this.containerElement, 'mouseenter', function () {
            hovering = true;
        });

        revUtils.addEventListener(this.containerElement, 'mouseleave', function () {
            hovering = false;
        });

        // TODO - shoudl this be a scroll box?
        window.addWheelListener(this.containerElement, function (event) {
            if (hovering) {

                if (event.deltaY > 0) {
                    direction = 'down';
                    that.transform -= event.deltaY;
                } else {
                    direction = 'up';
                    that.transform -= event.deltaY;
                }

                if (that.transform > 0) {
                    that.transform = 0;
                }

                if (that.viewableItems.length) {
                    that.checkVisible(false);
                }

                var holdIt = false;

                if (Math.abs(that.transform) > that.scrollSpace) {
                    holdIt = true;
                    that.transform = (that.scrollSpace * -1);
                }

                revUtils.transitionDurationCss(that.element, '0ms');
                revUtils.transformCss(that.element, 'translate3d(0, ' + that.transform + 'px, 0)');

                if (that.transform !== 0 && !holdIt) {
                    event.preventDefault();
                }
            }
        });
    };

    RevScroller.prototype.button = function () {
        this.button = document.createElement('div');
        this.button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M24.88 12.88L18 19.76l-6.88-6.88L9 15l9 9 9-9z"/><path d="M0 0h36v36H0z" fill="none"/></svg>';
        revUtils.addClass(this.button, 'rev-scroller-button');
        revUtils.append(this.containerElement, this.button);

        var bottom = false;
        var that = this;
        revUtils.addEventListener(this.button, 'click', function () {

            if (bottom) {
                that.transform = 0;
                bottom = false;
                that.currentRow = 0;
                that.button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M24.88 12.88L18 19.76l-6.88-6.88L9 15l9 9 9-9z"/><path d="M0 0h36v36H0z" fill="none"/></svg>';
            } else {
                that.currentRow++;

                that.transform = 0;

                for (var i = 0; i < that.currentRow; i++) {
                    that.transform += that.heights[i];
                }

                that.transform = (that.transform * -1);

                if (Math.abs(that.transform) > that.scrollSpace) {
                    that.transform = (that.scrollSpace * -1);
                    that.button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M18 12l-9 9 2.12 2.12L18 16.24l6.88 6.88L27 21z" /></svg>';
                    bottom = true;
                }
            }
            revUtils.transitionDurationCss(that.element, '1000ms');
            revUtils.transformCss(that.element, 'translate3d(0, ' + that.transform + 'px, 0)');

            if (that.viewableItems.length) {
                that.checkVisible(false);
            }
        });
    };

    RevScroller.prototype.initViewability = function () {
        this.viewableItems = [];

        for (var i = 0; i < this.elements.length; i++) {
            this.viewableItems.push({ 
                index: i, 
                element: this.elements[i] 
            });
        }

        var that = this;

        this.viewability().then(function () {

            if (that.viewed.length) {
                that.registerView(that.viewed);
            }

            that.visibleListener = that.checkVisible.bind(that, true);
            revUtils.addEventListener(window, 'scroll', that.visibleListener);
        }, function (e) {
            console.log(e, 'someething went wrong');
        });
    };

    RevScroller.prototype.viewability = function () {
        var that = this;
        this.viewed = [];

        return new Promise(function (resolve, reject) {
            var total = that.viewableItems.length;
            var count = 0;
            for (var i = 0; i < that.viewableItems.length; i++) {
                revUtils.checkVisibleItem(that.viewableItems[i], function (viewed, item) {
                    count++;
                    if (count == total) {
                        resolve();
                    }
                    if (viewed) {
                        var index = that.viewableItems.indexOf(item);
                        if (index != -1) {
                            that.viewableItems.splice(index, 1);
                        }
                        that.viewed.push(item);
                    }
                }, that.options.viewable_percentage, false, that.containerElement);
            }
        });
    };

    RevScroller.prototype.checkVisible = function (container) {
        if (!this.viewableItems.length) {
            revUtils.removeEventListener(window, 'scroll', this.visibleListener);
        }

        var self = this;
        for (var i = 0; i < this.viewableItems.length; i++) {
            revUtils.checkVisibleItem(this.viewableItems[i], function (viewed, item) {
                if (viewed) {
                    var index = self.viewableItems.indexOf(item);
                    if (index != -1) {
                        self.viewableItems.splice(index, 1);

                        if (!self.viewableItems.length) {
                            revUtils.removeEventListener(window, 'scroll', self.visibleListener);
                        }
                        self.registerView([item]);
                    }
                }
            }, self.options.viewable_percentage, false, (container ? this.containerElement : false));
        }
    };

    RevScroller.prototype.registerView = function (viewed) {
        if (!this.view) {
            this.view = this.element.querySelector('.rc-wc').getAttribute('data-view');
            if (!this.view) {
                return;
            }
        }

        var params = 'view=' + encodeURIComponent(this.view);

        for (var i = 0; i < viewed.length; i++) {
            params += '&' + encodeURIComponent('p[]') + '=' + viewed[i].index;
        }

        revApi.request(this.options.host + '/view.php?' + params, function () {

        });
    };

    return RevScroller;

}));