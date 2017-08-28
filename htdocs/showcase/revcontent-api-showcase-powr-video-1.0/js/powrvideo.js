/*
 Project: PowrVideo
 Version: 1
 Author: harsh@revcontent.com
 */

// universal module definition
( function( window, factory ) {
    // browser global
    window.PowrVideo = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revApi, revDisclose) {

    var PowrInitialized = false;

    var PowrVideo = function(config) {
        this.config = config;

        this.element = document.getElementById(this.config.id);

        this.playerId = "content_video";
        if (config.playerId) {
            this.playerId = config.playerId;
        }
        this.playerWidth = this.element.clientWidth;
        this.playerHeight = 0.5625 * this.playerWidth;

        this.element.setAttribute("style", "width: 100%; height : " + parseInt(this.playerHeight) + "px; background-color : #EFEFEF;");
        var elem = this.element;
        revUtils.addEventListener(window, 'resize', function () {
            var width = elem.clientWidth;
            var height = parseInt(0.5625 * width);
            elem.setAttribute("style", "width : 100%; height : " + height + "px; background-color : #EFEFEF");
        });

        this.attachVisibleListener();

        this.videos = config.videos;
        this.currentContent = 0;

        this.options = {
            id : this.playerId,
            nativeControlsForTouch: false
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

    PowrVideo.prototype.setup = function () {
        this.container = document.createElement("div");
        this.element.appendChild(this.container);

        var dumbPlayer = document.createElement('video');
        dumbPlayer.id = this.playerId;
        dumbPlayer.className = 'video-js vjs-default-skin vjs-big-play-centered vjs-fluid';
        dumbPlayer.setAttribute('width', this.playerWidth + 'px');
        dumbPlayer.setAttribute('height', this.playerHeight + 'px');
        dumbPlayer.setAttribute("controls", "true");
        dumbPlayer.setAttribute("preload", "auto");
        dumbPlayer.setAttribute("poster", this.videos[0].thumbnail);
        dumbPlayer.setAttribute("playsinline", "true");
        var contentSrc = document.createElement('source');
        contentSrc.setAttribute('src', this.videos[0].sd_url);
        contentSrc.setAttribute('type', 'video/mp4');
        dumbPlayer.appendChild(contentSrc);

        this.container.appendChild(dumbPlayer);

        this.player = videojs(this.playerId);

        this.currentContent = 0;

        this.player.logobrand({
            image : this.config.custom_logo,
            destination : "http://alpha.powr.com/"
        });

        var me = this;
        this.player.ready(function () {
            var titleContent = me.videos[0].title;
            if (me.videos[0].total_views) {
                titleContent = titleContent + "<small>" + me.videos[0].total_views + " views</small>";
            }

            me.player.overlay({
                align: "top",
                showBackground: true,
                class: "rc-video-overlay",
                content: titleContent,
                overlays: [{
                    start: "useractive",
                    end: "userinactive"
                }]
            });
            me.player.overlays_[0].show();


            if (navigator.userAgent.match(/iPhone/i) ||
                navigator.userAgent.match(/iPad/i) ||
                navigator.userAgent.match(/Android/i)) {
                me.player.one('touchend', function () {
                    me.start(true);
                });
            } else {
                me.start(me.config.autoplay);
                if (!me.config.autoplay) {
                    me.player.one('click', function () {
                        me.player.play();
                    });
                }
            }
        });
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
        this.currentContent++;
        if (this.currentContent < this.videos.length) {
            this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), true);
            this.player.poster(this.videos[this.currentContent].thumbnail);
            var titleContent = this.videos[this.currentContent].title;
            if (this.videos[this.currentContent].total_views) {
                titleContent = titleContent + "<small>" + this.videos[this.currentContent].total_views + " views</small>";
            }
            this.player.overlays_[0].contentEl().innerHTML = titleContent;
            this.player.ima.requestAds();
        }
    };

    PowrVideo.prototype.visible = function(percentage) {
        // console.log("WE ARE VISIBLE " + percentage);
    };

    PowrVideo.prototype.attachVisibleListener = function() {
        // this.visibleListener = revUtils.throttle(this.checkVisible.bind(this, this.element, this.visible), 60);
        revUtils.addEventListener(window, 'scroll', this.checkVisible.bind(this));
    };

    PowrVideo.prototype.floatPlayer = function() {
        this.container.className = "rc-float-video";
    };

    PowrVideo.prototype.unfloatPlayer = function() {
        this.container.className = '';
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

            console.log(scroll + "," + elementTop + "," + elementBottom);
            if (elementTop < 0 && (-1 * elementTop) > 0.2 * that.playerHeight) {
                that.floatPlayer();
            } else {
                that.unfloatPlayer();
            }
        });
    };


    PowrVideo.prototype.registerViewOnceVisible = function() {
        var that = this;
        this.emitter.once('visible', function() {
            revUtils.removeEventListener(window, 'scroll', that.visibleListener);
            that.registerView();
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
            revApi.request(this.config.view_url + '?view=' + this.config.view + '&p[]=0', function() { return; });
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
