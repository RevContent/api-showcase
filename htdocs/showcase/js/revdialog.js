

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.revDialog = factory(window, revUtils);

}( window, function factory(window, revUtils) {
// turn off strict for arguments.callee usage
// 'use strict';

    var RevDialog = function() {
        this.id = 'rev-opt-out';

        this.aboutFrame = null;
        this.aboutSrc = '//trends.revcontent.com/rc-about.php/%3Fdomain=http://code.revcontent.com&lg=//cdn.revcontent.com/assets/img/rc-logo.png';
        // this.aboutSrc = 'http://deelay.me/3000/http://trends.revcontent.com/rc-about.php/%3Fdomain=http://code.revcontent.com&lg=//cdn.revcontent.com/assets/img/rc-logo.png';
        this.aboutHeight = 455;
        this.aboutLoaded = false;

        this.interestFrame = null;
        this.interestSrc = '//trends.revcontent.com/rc-interests.php/?domain='+location.protocol + '//' + location.host+'&interests=1';
        // this.interestSrc = 'http://deelay.me/3000/http://trends.revcontent.com/rc-interests.php/?domain='+location.protocol + '//' + location.host+'&interests=1';
        this.interestHeight = 520;
        this.interestLoaded = false;
    };

    RevDialog.prototype.setActive = function(active) {
        this.active = active;

        // hide the frames
        this.aboutFrame.style.display = 'none';
        if (this.interestFrame) {
            this.interestFrame.style.display = 'none';
        }

        switch (active) {
            case 'about':
                // set height and class right away b/c is always first
                revUtils.removeClass(this.element, 'rev-interest-dialog');
                // wait for load before showing and centering
                if (!this.aboutLoaded) {
                    this.loading.style.display = 'block';
                    // create about iframe
                    var that = this;
                    revUtils.addEventListener(this.aboutFrame, 'load', function() {
                        that.loading.style.display = 'none';
                        that.aboutFrame.style.display = 'block';
                        that.centerDialog();
                        that.aboutLoaded = true;
                        revUtils.removeEventListener(that.aboutFrame, 'load', arguments.callee);
                    });
                } else {
                    this.aboutFrame.style.display = 'block';
                    this.centerDialog();
                }
                break;
            case 'interest':
                if (!this.interestLoaded) {
                    this.loading.style.display = 'block';
                    this.interestFrame = this.createFrame(this.interestSrc);
                    this.interestFrame.style.display = 'none';
                    this.modalContentContainer.appendChild(this.interestFrame);
                    var that = this;
                    revUtils.addEventListener(this.interestFrame, 'load', function() {
                        that.loading.style.display = 'none';
                        revUtils.addClass(that.element, 'rev-interest-dialog');
                        that.interestFrame.style.display = 'block';
                        that.centerDialog();
                        that.interestLoaded = true;
                        revUtils.removeEventListener(that.interestFrame, 'load', arguments.callee);
                    });
                } else {
                    revUtils.addClass(this.element, 'rev-interest-dialog');
                    this.interestFrame.style.display = 'block';
                    this.centerDialog();
                }
                break;
        }
    };

    RevDialog.prototype.createFrame = function(src) {
        var frame = document.createElement('iframe');
        frame.setAttribute('class', 'rc-frame');
        frame.setAttribute('frameborder', 0);
        frame.setAttribute('width', '100%');
        frame.setAttribute('height', '100%');
        frame.setAttribute('src', src);
        return frame;
    }

    RevDialog.prototype.render = function() {
        var rendered = document.querySelector('#' + this.id);

        if (!rendered) {
            this.bodyOverflow = revUtils.getComputedStyle(document.body, 'overflow');

            this.element = document.createElement('div');
            this.element.className = 'revdialog';
            this.element.id = this.id;

            this.loading = document.createElement('p');
            this.loading.setAttribute('class', 'rd-loading');
            this.loading.innerHTML = 'Loading<span>.</span><span>.</span><span>.</span>';

            this.element.innerHTML = '<div class="rd-box-wrap">' +
                '<div class="rd-box-overlay" onclick="revDialog.closeDialog()"> &nbsp; </div>' +
                    '<div class="rd-vertical-offset">' +
                        '<div class="rd-box">' +
                            '<a class="rd-close-button" onclick="revDialog.closeDialog()">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>' +
                            '</a>' +
                            '<div class="rd-content">' +
                                '<div class="rd-modal-content"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(this.element);

            // cache the modal content container
            this.modalContentContainer = this.element.querySelectorAll('.rd-modal-content')[0]

            this.modalContentContainer.appendChild(this.loading);

            this.aboutFrame = this.createFrame(this.aboutSrc);
            this.setActive('about');
            // append iframe
            this.modalContentContainer.appendChild(this.aboutFrame);

            this.attachPostMesssage();
            this.attachResize();
        }

        // set the body to overflow hidden
        document.body.style.overflow = 'hidden';

        return this.element;
    };

    RevDialog.prototype.showDialog = function(injectedDialog) {
        var that = injectedDialog || this;
        that.render().style.display = 'block';
        that.centerDialog();
        return false;
    };

    RevDialog.prototype.closeDialog = function() {
        document.body.style.overflow = this.bodyOverflow;
        this.element.style.display = 'none';
        // make sure we are ready for the about dialog if opened again
        this.setActive('about');
        return false;
    };

    RevDialog.prototype.centerDialog = function(context) {
        var containerWidth = document.documentElement.clientWidth;
        var containerHeight = document.documentElement.clientHeight;

        // do we need to go to compact mode?
        this.frameHeight = this.active == 'about' ? this.aboutHeight : this.interestHeight;

        this.modalContentContainer.style.height = this.frameHeight + 'px';

        var availableSpace = containerHeight - 20;
        if (availableSpace < this.frameHeight) {
            var compact = true;
            this.modalContentContainer.style.height = availableSpace + 'px';
        }

        var left = Math.max(0, (containerWidth / 2) - (this.modalContentContainer.offsetWidth / 2));
        var top = compact ? 0 : Math.max(0, (containerHeight / 2) - (this.modalContentContainer.offsetHeight / 2));

        var db = document.querySelector('.rd-box');
        db.style.top = top+'px';
        db.style.left = left+'px';
    };

    RevDialog.prototype.attachPostMesssage = function() {
        var that = this;
        revUtils.addEventListener(window, 'message', function(e) {
            switch (e.data.msg) {
                case 'open_me':
                    that.setActive('interest');
                    break;
                case 'close_me':
                    that.closeDialog();
                    break;
            }
        });
    };

    RevDialog.prototype.attachResize = function() {
        var resizeEnd;
        var that = this;
        revUtils.addEventListener(window, 'resize', function() {
            clearTimeout(resizeEnd);
            resizeEnd = setTimeout(function() {
                that.centerDialog('resize');
            }, 100);
        });
    };

    var rD = new RevDialog();

    return rD;

}));