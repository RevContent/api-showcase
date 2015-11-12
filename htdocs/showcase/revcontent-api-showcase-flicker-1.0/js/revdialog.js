

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevDialog = factory(window);

}( window, function factory(window) {
'use strict';

    var RevDialog = function() {
        var that = this;
        this.id = 'opt-out';
        //this.url = url;

        this.render();

        this.addEventListener(window, 'resize', function() {
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
        this.removeClass(revDialogBox, 'normal');
        this.addClass(revDialogBox, 'full-screen');
        revDialogBox.style.left = '15px';
        revDialogBox.style.top = '15px';
    };

    RevDialog.prototype.setNormalHeight = function() {
        var revDialogBox = document.querySelector('.revDialogBox');
        this.removeClass(revDialogBox, 'full-screen');
        this.addClass(revDialogBox, 'normal');

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

        var el = document.querySelector('#'+this.id);
        if (el) {this.remove(el);}
        var wrap = document.createElement('div');
        wrap.id = this.id;
        wrap.innerHTML = html;
        this.append(document.getElementsByTagName("BODY")[0], wrap);

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

    RevDialog.prototype.addEventListener = function(el, eventName, handler) {
      if (el.addEventListener) {
        el.addEventListener(eventName, handler);
      } else {
        el.attachEvent('on' + eventName, function(){
          handler.call(el);
        });
      }
    };

    RevDialog.prototype.addClass = function(el, className) {
        if (!el) return false;
        if (el.classList)
          el.classList.add(className);
        else
          el.className += ' ' + className;
    };

    RevDialog.prototype.removeClass = function(el, className) {
        if (!el) return false;
        if (el.classList)
            el.classList.remove(className);
        else
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    };

    RevDialog.prototype.append = function(el, html) {
        el.appendChild(html);
    };

    RevDialog.prototype.remove = function(el) {
        el.parentNode.removeChild(el);
    };


    return RevDialog;

}));