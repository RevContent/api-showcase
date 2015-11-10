

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevDialog = factory(window, window.revUtils);

}( window, function factory(window, revUtils) {
'use strict';

    var RevDialog = function(opts) {
        var that = this;
        this.options = opts;

        this.render();

        revUtils.addEventListener(window, 'resize', function() {
            that.resize();
        });
    };

    RevDialog.prototype.resize = function() {
        this.containerWidth = document.documentElement.clientWidth;
        this.containerHeight = document.documentElement.clientHeight;
        if (this.containerWidth < 585 || this.containerHeight < 455) {
            this.setFullHeight();
        } else if (this.containerWidth >= 585 && this.containerHeight >= 455) {
            this.setMinHeight();
        }
    };

    RevDialog.prototype.setFullHeight = function() {
        var dumbBox = document.querySelector('.dumbBox');
        revUtils.removeClass(dumbBox, 'normal');
        revUtils.addClass(dumbBox, 'full-screen');
    };

    RevDialog.prototype.setMinHeight = function() {
        var dumbBox = document.querySelector('.dumbBox');
        revUtils.removeClass(dumbBox, 'full-screen');
        revUtils.addClass(dumbBox, 'normal');

    };

    RevDialog.prototype.getContainerWidth = function() {
        var dumbBox = document.querySelector('.dumbBox');
        return dumbBox.offsetWidth;
    };

    RevDialog.prototype.getContainerHeight = function() {
        var dumbBox = document.querySelector('.dumbBox');
        return dumbBox.offsetWidth;
    };


    RevDialog.prototype.render = function() {
        var html = '<div class="dumbBoxWrap">' +
                        '<div class="dumbBoxOverlay"> &nbsp; </div>' +
                            '<div class="vertical-offset">' +
                                '<div class="dumbBox">' +
                                    '<div class="dumbHeader">' +
                                        '<a class="closeButton" onclick="revDialog.closeDialog()">' +
                                            '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>' +
                                        '</a>' +
                                    '</div>' +
                                    '<div class="dumbContent">' +
                                        '<iFrame id="dialogContent" src="' + this.options.url + '" width="100%" height="100%" frameborder="0">' +
                                        '</iFrame>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        var innerElement = document.getElementById(this.options.insertPoint);
        revUtils.append(innerElement, wrap);
    };

    RevDialog.prototype.showDialog = function() {
        this.resize();
        document.querySelector('.dumbBoxWrap').style.display = 'block';
        return false;
    };

    RevDialog.prototype.closeDialog = function() {
        document.querySelector('.dumbBoxWrap').style.display = 'none';
        return false;
    };

    return RevDialog;

}));