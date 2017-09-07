/*
 Project: PowrVideo
 Version: 1
 Author: harsh@revcontent.com
 */

// universal module definition
( function( window, factory ) {
    // browser global
    window.PowrVideo = factory(window, window.revUtils, window.revApi);

}( window, function factory(window, revUtils, revApi) {

    var PowrInitialized = false;

    var PowrVideo = function(config) {
        this.config = config;
        if (!this.config.floatSettings) {
            this.config.floatSettings = {
                style : "bottom-right",
                margin : 12,
                header : 0,
                width : 400
            };
        }

        this.fixedHeight = -1;
        this.element = document.getElementById(this.config.id);

        this.playerId = "content_video";
        if (config.playerId) {
            this.playerId = config.playerId;
        }
        this.viewed = false;
        this.playerWidth = this.element.clientWidth;
        this.playerHeight = 0.5625 * this.playerWidth;

        this.element.setAttribute("style", "width: 100%; height : " + parseInt(this.playerHeight) + "px; background-color : #EFEFEF;");

        this.videos = config.videos;
        this.currentContent = 0;

        this.options = {
            id : this.playerId,
            nativeControlForTouch: false
        };

        if (config.hasOwnProperty('preloaded') && config.preloaded) {
            this.setup();
        } else {
            this.init();
        }
    };

    PowrVideo.prototype.getAdTag = function(videoId) {
        return "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=" + this.config.tag + "&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1"
            + "&cust_params=p_width%3D" + parseInt(this.playerWidth) + "%26p_height%3D" + parseInt(this.playerHeight)
            + "&description_url=" + encodeURI("http://alpha.powr.com/video/" + videoId);
    };

    PowrVideo.prototype.init = function() {
        this.emitter = new EvEmitter();

        if (PowrInitialized) {
            this.setup();
            return;
        }

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-powr-video');

        var that = this;

        this.floated = false;
        this.neverFloat = false || this.config.should_float;

        var imaCss = document.createElement("link");
        imaCss.setAttribute("href", "//alpha.powr.com/css/videojs.ima.css");
        imaCss.setAttribute("type", "text/css");
        imaCss.setAttribute("rel", "stylesheet");
        revUtils.append(this.element, imaCss);

        var imaScript = document.createElement('script');
        imaScript.setAttribute('src', '//imasdk.googleapis.com/js/sdkloader/ima3.js');
        imaScript.setAttribute('async', true);
        imaScript.setAttribute('type', 'text/javascript');

        revUtils.addEventListener(imaScript, "load", function () {
            that.setup();
        });
        revUtils.append(this.element, imaScript);
    };

    PowrVideo.prototype.onResize = function() {
        var width = this.element.clientWidth;
        var height = this.fixedHeight;
        if (height == -1) {
            height = parseInt(0.5625 * width);
        }
        this.element.setAttribute("style", "width : 100%; height : " + height + "px; background-color : #EFEFEF");

        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var windowWidth = window.innerWidth|| document.documentElement.clientWidth || document.body.clientWidth;
        var newOrientation = '';
        if (windowWidth < windowHeight) {
            newOrientation = 'portrait';
        } else if (windowWidth > windowHeight && this.orientation == 'portrait') {
            newOrientation = 'landscape';
        }
        if (newOrientation != this.orientation) {
            this.orientation = newOrientation;
            this.orientationChanged();
        }
    }

    PowrVideo.prototype.setup = function () {
        var mobile = false;
        if (navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/Android/i)) {
            mobile = true;
        }

        this.container = document.createElement("div");
        this.container.className = 'powr_player';
        this.element.appendChild(this.container);

        this.attachVisibleListener();
        revUtils.addEventListener(window, 'resize', this.onResize.bind(this));
        this.orientation = 'none';
        this.onResize();

        var dumbPlayer = document.createElement('video');
        dumbPlayer.id = this.playerId;
        dumbPlayer.className = 'video-js vjs-default-skin vjs-big-play-centered vjs-fluid';
        dumbPlayer.setAttribute('width', this.playerWidth + 'px');
        dumbPlayer.setAttribute('height', this.playerHeight + 'px');
        dumbPlayer.setAttribute("controls", "true");
        dumbPlayer.setAttribute("preload", "auto");
        dumbPlayer.setAttribute("poster", this.videos[0].thumbnail);
        dumbPlayer.setAttribute("playsinline", "true");
        if (mobile && this.config.autoplay) {
            dumbPlayer.setAttribute("muted", "true");
        }
        var contentSrc = document.createElement('source');
        contentSrc.setAttribute('src', this.videos[0].sd_url);
        contentSrc.setAttribute('type', 'video/mp4');
        dumbPlayer.appendChild(contentSrc);

        this.container.appendChild(dumbPlayer);

        this.player = videojs(this.playerId, {
            nativeControlForTouch: false
        });

        this.currentContent = 0;
        //
        //this.player.logobrand({
          //  image : this.config.custom_logo,
          //  destination : "http://alpha.powr.com/"
        //});

        var me = this;
        this.player.ready(function () {
            var titleContent = me.videos[0].title;
            if (me.config.custom_logo) {
                titleContent = "<a class='rc-video-close' href='javascript:void(0)' class='close'><span class='label'>CLOSE | </span>X</a><img src='" + me.config.custom_logo + "'><span class='rc-video-title'>" + titleContent + "</span>";
            }

            me.player.overlay({
                align: "top",
                showBackground: true,
                class: "rc-video-overlay",
                content: titleContent,
                overlays: [{
                    start: 0,
                    end: Infinity
                }]
            });
            me.player.overlays_[0].show();
            me.player.on('timeupdate', me.onUpdate.bind(me));

            GlobalPlayer = me.player;

            me.closeButton = me.container.querySelector(".rc-video-close");
            me.titleDom = me.closeButton.querySelector(".rc-video-title");

            revUtils.addEventListener(me.closeButton, 'click', function () {
                me.neverFloat = true;
                me.player.pause();
                me.unfloatPlayer();
            });
//            if (navigator.userAgent.match(/iPhone/i) ||
//                navigator.userAgent.match(/iPad/i) ||
//                navigator.userAgent.match(/Android/i)) {
//                me.player.one('touchend', function () {
//                    me.start(true);
//                    me.player.play();
//                });
//            } else {
            me.start(me.config.autoplay);
            if (!me.config.autoplay) {
                me.player.one('click', function () {
                    me.player.play();
                });
            }
//            }
        });
    };

    PowrVideo.prototype.onUpdate = function() {
        var video = this.videos[this.currentContent];
        var d = this.player.currentTime();
        d = (d * 1.0) / video.duration;
        if (video.tracking['start'] && (d > 0)) {
            revApi.request(this.config.tracking_url + video.tracking['start'], function () { return ; });
            video.tracking['start'] = null;
        } else if (video.tracking['q_1'] && (d > 0.25)) {
            revApi.request(this.config.tracking_url + video.tracking['q_1'], function () { return ; });
            video.tracking['q_1'] = null;
        } else if (video.tracking['q_2'] && (d > 0.5)) {
            revApi.request(this.config.tracking_url + video.tracking['q_2'], function () { return ; });
            video.tracking['q_2'] = null;
        } else if (video.tracking['q_3'] && (d > 0.75)) {
            revApi.request(this.config.tracking_url + video.tracking['q_3'], function () { return ; });
            video.tracking['q_3'] = null;
        }
    };
    
    PowrVideo.prototype.start = function(playOnLoad) {
        this.player.ima(this.options, this.bind(this, this.adsManagerLoadedCallback));
        this.player.ima.initializeAdDisplayContainer();
        this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), playOnLoad);
        this.player.poster(this.videos[this.currentContent].thumbnail);

        this.player.ima.requestAds();

        var me = this;
        this.player.ima.addContentEndedListener(function () {
            me.loadNextVideo();
        });
    };

    PowrVideo.prototype.loadNextVideo = function() {
        var video = this.videos[this.currentContent];
        if (video.tracking['end']) {
            revApi.request(this.config.tracking_url + video.tracking['end'], function () { return ; });
            video.tracking['end'] = null;
        }
        this.currentContent++;
        if (this.currentContent < this.videos.length) {
            this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), true);
            this.player.poster(this.videos[this.currentContent].thumbnail);
            var titleContent = this.videos[this.currentContent].title;
            // this.player.overlays_[0].contentEl().innerHTML = titleContent;
            this.titleDom.innerHTML = titleContent;
            this.player.ima.requestAds();
        }
    };

    PowrVideo.prototype.attachVisibleListener = function() {
        revUtils.addEventListener(window, 'scroll', this.checkVisible.bind(this));
        this.checkVisible();
    };

    PowrVideo.prototype.floatPlayer = function() {
        if (this.floated)
            return;
        if (this.neverFloat)
            return;
        this.container.className = "rc-float-video powr_player";
        var styleString = "";
        var fs = this.config.floatSettings;

        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

        if (this.orientation == 'portrait') {
            styleString += "top : 0px;";
            styleString += "left : 0px; right : 0px; width : 100%; height : 176px;";
            this.player.fluid(false);
            this.player.dimensions(windowWidth, 176);

            this.closeButton.setAttribute("style", "margin-top : 166px; margin-left : " + (windowWidth - 50) + "px");

        } else {
            this.player.fluid(true);
            if (fs.style.startsWith("top")) {
                if (fs.header > 0) {
                    styleString += "top : " + (fs.header) + "px;";
                } else {
                    styleString += "top : " + (fs.margin) + "px;";
                }
            } else {
                styleString += "bottom : " + fs.margin + "px;";
            }

            if (fs.style.endsWith("right")) {
                styleString += "right : " + fs.margin + "px;";
            } else {
                styleString += "left : " + fs.margin + "px;";
            }

            var r = this.element.getBoundingClientRect();
            var w = windowWidth - r.right;
            w = w - 20;
            w = Math.min(480, w);
            styleString += "width : " + w + "px;";

            var h = parseInt(0.5625 * w);
            if (fs.style.startsWith("top")) {
                this.closeButton.setAttribute("style", "margin-top : " + (h - 10) + "px;");
            } else {
                this.closeButton.setAttribute("style", "margin-left : " + (w - 100) + "px; margin-top : -30px;");
            }
        }

        this.container.setAttribute("style", styleString);

        this.floated = true;
    };

    PowrVideo.prototype.unfloatPlayer = function() {
        if (this.floated) {
            this.container.className = 'powr_player';
            this.container.removeAttribute("style");
            this.floated = false;
            this.player.fluid(true);
        }
    };

    PowrVideo.prototype.setFixedHeight = function(h) {
        this.fixedHeight = h
    };


    PowrVideo.prototype.orientationChanged = function() {
        if (this.floated) {
            this.floated = false;
            // refloat player if orientation has changed.
            this.floatPlayer();
        }
    };

    PowrVideo.prototype.getTitle = function () {

    };

    PowrVideo.prototype.checkVisible = function() {
        var that = this;
        requestAnimationFrame(function() {

            // what percentage of the element should be visible
            // var visibleHeightMultiplier = (typeof percentVisible === 'number') ? (parseInt(percentVisible) * .01) : 0;
            // fire if within buffer
            // var bufferPixels = (typeof buffer === 'number') ? buffer : 0;

            var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var elementTop = that.element.getBoundingClientRect().top;
            var elementBottom = that.element.getBoundingClientRect().bottom;
            var elementVisibleHeight = that.element.offsetHeight * 0.50;

            if ((elementTop + elementVisibleHeight) < windowHeight) {
                that.registerView();
            }

            if (elementTop < 0 && (-1 * elementTop) > 0.2 * that.playerHeight) {
                that.floatPlayer();
            } else {
                that.unfloatPlayer();
            }
        });
    };


    PowrVideo.prototype.adsManagerLoadedCallback = function() {
        var me = this;
        this.player.ima.addEventListener(google.ima.AdEvent.Type.STARTED, function () {
            me.player.removeClass('vjs-ad-loading');
        });
        this.player.ima.startFromReadyCallback();
    };

    PowrVideo.prototype.registerView = function() {
        if (!this.viewed) {
            this.viewed = true;
            revApi.request(this.config.tracking_url + this.config.view_tracker, function() { return; });
        }
    };

    PowrVideo.prototype.bind = function(thisObj, fn, argument) {
        return function() {
            fn.apply(thisObj, [argument]);
        };
    };

    PowrVideo.prototype.onAdEvent = function (event) {

    };

    return PowrVideo;
}));
