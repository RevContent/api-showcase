

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
        if (this.containerHeight < 455) {
            this.setFullHeight();
        } else if (this.containerHeight >= 455) {
            this.setNormalHeight();
            this.centerDialog();
        }
    };

    RevDialog.prototype.setFullHeight = function() {
        var revDialogBox = document.querySelector('.revDialogBox');
        revUtils.removeClass(revDialogBox, 'normal');
        revUtils.addClass(revDialogBox, 'full-screen');
        revDialogBox.style.left = '15px';
        revDialogBox.style.top = '15px';
    };

    RevDialog.prototype.setNormalHeight = function() {
        var revDialogBox = document.querySelector('.revDialogBox');
        revUtils.removeClass(revDialogBox, 'full-screen');
        revUtils.addClass(revDialogBox, 'normal');

    };

    RevDialog.prototype.getContainerWidth = function() {
        var revDialogBox = document.querySelector('.revDialogBox');
        return revDialogBox.offsetWidth;
    };

    RevDialog.prototype.getContainerHeight = function() {
        var revDialogBox = document.querySelector('.revDialogBox');
        return revDialogBox.offsetWidth;
    };


    RevDialog.prototype.render = function() {
        var html = '<div class="revDialogBoxWrap">' +
                        '<div class="revDialogBoxOverlay" onclick="revDialog.closeDialog()"> &nbsp; </div>' +
                        '<div class="vertical-offset" >' +
                            '<div class="revDialogBox normal">' +
                                '<div class="revDialogHeader">' +
                                    '<a class="closeButton" onclick="revDialog.closeDialog()">' +
                                        '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>' +
                                    '</a>' +
                                '</div>' +
                                '<div class="revDialogContent">' +
                                    '<div class="rc-about rc-modal-content">' +
                                        '<a href="http://www.revcontent.com" target="_blank" class="rc-logo"></a>' +
                                        '<p id="main">The content you see here is paid for by the advertiser or content provider whose link you click on, and is recommended to you by <a href="http://www.revcontent.com" target="_blank">Revcontent</a>. As the leading platform for native advertising and content recommendation, <a href="http://www.revcontent.com" target="_blank">Revcontent</a> uses interest based targeting to select content that we think will be of particular interest to you. We encourage you to view our <a href="http://faq.revcontent.com/support/solutions/articles/5000615200-revcontent-s-privacy-policy">Privacy Policy</a> and your opt out options here: <a class="rc-opt-out-link" href="http://faq.revcontent.com/support/solutions/articles/5000615200" target="_blank">Opt Out Options</a></p>' +
                                        '<div class="rc-well">' +
                                    	'<h2>Want your content to appear on sites like this?</h2>' +
                                    	'<p><a href="http://www.revcontent.com" target="_blank">Increase your visitor engagement now!</a></p>' +
                                        '</div>' +
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
        document.querySelector('.revDialogBoxWrap').style.display = 'block';
        this.resize();
        return false;
    };

    RevDialog.prototype.closeDialog = function() {
        document.querySelector('.revDialogBoxWrap').style.display = 'none';
        return false;
    };

    RevDialog.prototype.centerDialog = function() {
        var db = document.querySelector('.revDialogBox');
        var w = db.offsetWidth;
        var h = db.offsetHeight;

        var left = (this.containerWidth/2)-(w/2);
        var top = (this.containerHeight/2)-(h/2);

        db.style.top = top+'px';
        db.style.left = left+'px';
    };


    return RevDialog;

}));