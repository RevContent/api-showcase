/*
 Project: PowrVideo
 Version: 1
 Author: harsh@revcontent.com
 */

if (!String.prototype.startsWithPowr) {
  String.prototype.startsWithPowr = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

if (!String.prototype.endsWithPowr) {
    String.prototype.endsWithPowr = function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

// universal module definition
( function( window, factory ) {
    // browser global
    window.PowrVideo = factory(window, window.powrUtils, window.powrApiOriginal);

}( window, function factory(window, powrUtils, powrApiOriginal) {

    var PowrInitialized = false;
    var PowrPlayers = 0;
    /**
     * id : id of the div to attach.
     * tag : tag to use.
     * adserver : dfp | lkqd
     * custom_logo :
     * brand_logo :
     * autoplay : "none|load|focus" [ Whether to autoplay video ]
     * videos : [ { "id" , "thumbnail" , "sd_url", "hd_url", "mobile_url" } ]
     * float : {
          "desktop" : "bottom-right|none",
	  "mobile" : "top|none",
	  "minWidth" : 100,
	  "maxWidth" : 200
     * },
     * player_id : id to give the player we creating.
     * controls : "custom"
     * float_conflicts : [ "" ]
     * permanent_close : "yes" or "no"
     * cross_delay: 0
     * muted : "yes" or "no"
     * show_on_focus : "yes" or "no"
     * custom_css : ""
     * rc_widget_id : ""
     * url : ""
     */
    var PowrVideo = function (config) {
        this.config = config;
        this.mobile = false;
        this.safari = this.isSafari();
        if (navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/Android/i)) {
            this.mobile = true;
        }

        this.fbiaios = false;

        if (navigator.userAgent.match(/FBIOS/i)) {
            this.fbiaios = true;
        }

        this.log("Mobile Mode " + this.mobile);
        if (this.config.dfp) {
            this.config.adserver = "dfp";
        }

        this.floatSettings = this.createFloatSettings();

        this.autoplaySettings = this.createAutoplaySettings();
        this.permanentClose = "no";
        if (this.config.permanent_cross) {
            this.permanentClose = this.config.permanent_cross;
        }

        this.crossDelay = 0;
        if (this.config.cross_delay) {
            this.crossDelay = this.config.cross_delay;
        }

        this.showOnFocus = "no";
        if (this.config.show_on_focus) {
            this.showOnFocus = this.config.show_on_focus;
        }
        this.adtype = "preroll";
        if (this.config.adtype) {
            this.adtype = this.config.adtype;
        }

        this.floatConflicts = {
            "top": [],
            "bottom": []
        };
        if (this.config.float_conflicts) {
            this.floatConflicts = this.config.float_conflicts;
        }
        if (!this.config.mobile_tag) {
            this.config.mobile_tag = this.config.tag;
        }

        this.element = document.getElementById(this.config.id);

        this.playerId = "content_video_" + (++PowrPlayers);
        if (config.playerId) {
            this.playerId = config.playerId;
        }
        this.viewed = false;

        var w;
        if (this.config.showhide == 'yes') {
            if (this.config.pub_id == 100010295) {
                w = 640;
                this.config.width = w;
            } else if (this.config.pub_id == 98997) {
                w = window.innerWidth;
            } else {
                w = this.config.width;
            }
        } else {
            w = this.element.clientWidth;
        }

        var h = this.element.clientHeight;
        var hs = "100%";
        if (!this.config.fluid) {
            h = 0.5625 * w;
            hs = parseInt(h) + "px";
        }

        this.videos = config.videos;

        if (this.videos.length == 0) {
            this.onCrossClicked(null);
            return;
        }

        this.showControls = true;
        if (this.config.showhide == "yes") {
            if (this.autoplaySettings.focus) {
                var focusCheck = document.createElement("img");
                this.showhideHeight = h;
                this.showhideWidth = w;
                focusCheck.id = "powr-focus-check";
                focusCheck.style.cssText = "width: 1px!important; height:1px!important; position: absolute;";
                focusCheck.src= "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6Xw4AAn4BedMp3VYAAAAASUVORK5CYII=";
                this.element.parentNode.insertBefore(focusCheck, this.element);
                this.focusPixel = document.getElementById('powr-focus-check');
            }

            this.showControls = false;
            powrUtils.addClass(this.element, "showhide");
        }

        this.element.setAttribute("style", "width: 100%; height : 100%; background-color : #EFEFEF; position : relative;");

        if (this.showOnFocus == "yes") {
            powrUtils.addClass(this.element, "powr_hidden");
        }

        this.currentContent = 0;

        this.abp = false;
        this.disposed = false;
        var me = this;
        me.autoplayDetected = false;
        this.checkAutoplaySupport(function (b) {
            me.autoplayDetected = true;
            me.autoplaySettings.autoplay = (me.autoplaySettings.autoplay && b);
            // We support audio
            if (!me.config.hasOwnProperty("muted") || me.config.muted == "no") {
            // And we are not autoplaying
            if (!me.autoplaySettings.autoplay) {
                me.autoplaySettings.audio = true;
            }
            }
            if (me.config.hasOwnProperty('preloaded') && me.config.preloaded) {
            me.setup();
            } else {
                me.init();
            }
        });
    };

    PowrVideo.prototype.getAdBreak = function (type, url, duration) {
        this.log("getAdBreak " + type + "," + url + "," + duration);
        var ret = "";
        if (type == "preroll") {
            ret = ret + '<vmap:AdBreak timeOffset="start" breakType="linear" breakId="preroll"><vmap:AdSource id="preroll-ad-1" allowMultipleAds="false" followRedirects="true"><vmap:AdTagURI templateType="vast3">';
        }
        if (type == "midroll") {
            var mins = duration / 60;
            var seconds = duration - mins * 60;
            if (seconds < 10) {
                seconds = "0" + seconds;
            }
            if (mins < 10) {
                mins = "0" + mins;
            }
            ret = ret + '<vmap:AdBreak timeOffset="00:' + mins + ':' + seconds + '.000" breakType="linear" breakId="midroll-1">';
            ret = ret + '<vmap:AdSource id="midroll-1-ad-1" allowMultipleAds="false" followRedirects="true"><vmap:AdTagURI templateType="vast3">';
        }
        if (type == "postroll") {
            var ret = '<vmap:AdBreak timeOffset="end" breakType="linear" breakId="postroll"><vmap:AdSource id="postroll-ad-1" allowMultipleAds="false" followRedirects="true"><vmap:AdTagURI templateType="vast3">';
        }
        ret = ret + "\n";
        ret = ret + '<![CDATA[' + "\n";
        ret = ret + url;
        ret = ret + "\n]]>\n";
        ret = ret + '</vmap:AdTagURI></vmap:AdSource></vmap:AdBreak>';
        return ret;
    };

    PowrVideo.prototype.getAdsResponse = function (video) {
        var tag = this.getAdTag(video);
        var response = '<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">';
        if (this.adtype == 'preroll') {
            response += this.getAdBreak('preroll', tag, 0);
        } else if (this.adtype == 'postroll') {
            response += this.getAdBreak('postroll', tag, 0);
        } else {
            var d = parseInt(parseFloat(this.adtype) * video.duration);
            if (d >= 0) {
                response += this.getAdBreak('midroll', tag, d);
            }
        }

        response += '</vmap:VMAP>';
        return response;
    };

    PowrVideo.prototype.getAdTag = function (video) {
        var url = encodeURI(window.location.href);
        if (this.config.url) {
            url = this.config.url;
        }
        var tag = this.config.tag;
        if (this.mobile) {
            tag = this.config.mobile_tag;
        }

        var volume = "0";
        var muted = this.player.muted();
        if (muted != true) {
            volume = "100";
        }

        var width, height, execution, placement;
        if (this.config.showhide == "yes") {
            if ((this.config.pub_id == 100010295 || this.config.pub_id == 98997) && window.location.href.indexOf("powrtest=1") > 0) {
                tag = 919192;
            }
            if (this.config.pub_id == 100010295) {
                width = 640;
            } else if (this.config.pub_id == 98997) {
                width = window.innerWidth;
            } else {
                width = parseInt(this.config.width);
            }
            height = parseInt(0.5625 * width);
            execution = "outstream";
            placement = "incontent";
        } else {
            width = parseInt(this.getPlayerWidth());
            height = parseInt(0.5625 * width);
            execution = "any";
            placement = "";
        }

        if (this.config.pub_id == 1281) {
            var ret = "https://googleads.g.doubleclick.net/pagead/ads?ad_type=video&client=ca-video-pub-4968145218643279&videoad_start_delay=0&description_url=http%3A%2F%2Fwww.google.com&max_ad_duration=40000&adtest=on";
            return ret;
        // } else if (this.config.pub_id == 10005097) {
        //     var ret = "https://googleads.g.doubleclick.net/pagead/ads?client=ca-video-pub-5278973888786334&slotname=powr.com_NP%2Fpowr.com%2Fpowr.com_640x480_preroll&ad_type=video&description_url=https%3A%2F%2Fwww.keepandbear.com&max_ad_duration=30000&videoad_start_delay=0&type=js&vad_format=linear&vpmute=0&vpa=0";
        //     return ret;
        } else if (this.config.adserver == "custom") {
            var ret = tag;
            return ret;
        } else if (this.config.adserver == "dfp") {
            var ret = "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=" + tag + "&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1"
                + "&cust_params=p_width%3D" + width + "%26p_height%3D" + height
                + "%26secure%3D" + this.getProtocol();
            if (this.config.url) {
                ret = ret + "%26p_url%3D" + url;
            }
            ret += "&description_url=" + encodeURI("http://www.powr.com/video/" + video.id);
            return ret;
        } else if (this.config.adserver == "lkqd") {
            var subid = (this.config.subid && this.config.subid != '') ? "&c3=" + this.config.subid : "";
            var ret = "//v.lkqd.net/ad?pid=505&sid=" + tag + "&output=vastvpaid&support=html5&execution=" + execution + "&placement=" + placement + "&playinit=auto&volume=" + volume + "&width=" + width + "&height=" + height + "&dnt=0&gdpr=0&gdprcs&pageurl=" + url + "&contentid=" + video.id + "&contenttitle=" + encodeURI(video.title) + "&contentlength=" + video.duration + "&contenturl=" + encodeURI("http://www.powr.com/video/" + video.id) + "&rnd=" + new Date().getTime() + "&c1=u_" + this.config.pub_id + "&c2=v_" + video.id + subid;
            return ret;
        } else if (this.config.adserver == "ss") {
	        var syndicationid = (this.config.syndication_id && this.config.syndication_id != '') ? "&syid=" + this.config.syndication_id : "";
            var subid = (this.config.subid && this.config.subid != '') ? "&suid=" + this.config.subid : "";
            var uid = (this.config.pub_id && this.config.pub_id != '') ? "&uid=" + this.config.pub_id : "&uid=0";
            var yid = (video.id && video.id != '' && this.config.showhide != 'yes') ? "&yid=" + video.id : "&yid=0";
            var ret = "//vid.springserve.com/vast/" + tag + "?w=" + width + "&h=" + height + "&url=" + url + "&cb=" + new Date().getTime() + syndicationid + subid + uid + yid;
            return ret;
        } else {
            tag = tag.replace("REFERRER_URL", url);
            tag = tag.replace("P_WIDTH", "" + width);
            tag = tag.replace("P_HEIGHT", "" + height);
            tag = tag.replace("CACHE_BUSTER", "" + new Date().getTime());
            return tag;
        }
    };

    PowrVideo.prototype.getProtocol = function () {
        var ret = window.location.protocol;
        ret = ret.replace(":", "");
        return ret;
    };

    PowrVideo.prototype.init = function () {
        this.emitter = new EvEmitter();
        if (PowrInitialized) {
            this.setup();
            return;
        }

        powrUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-powr-video');

        var that = this;

        this.floated = false;

        var imaCss = document.createElement("link");
        imaCss.setAttribute("href", "//cdnjs.cloudflare.com/ajax/libs/videojs-ima/0.6.0/videojs.ima.css");
        imaCss.setAttribute("type", "text/css");
        imaCss.setAttribute("rel", "stylesheet");
        powrUtils.append(this.element, imaCss);

        var imaScript = document.createElement('script');
        imaScript.setAttribute('src', '//imasdk.googleapis.com/js/sdkloader/ima3.js');
        imaScript.setAttribute('async', true);
        imaScript.setAttribute('type', 'text/javascript');

        powrUtils.addEventListener(imaScript, "load", function () {
            that.setup();
        });
        powrUtils.addEventListener(imaScript, "error", function () {
            that.abp = true;
            that.setup();
        });
        powrUtils.append(this.element, imaScript);

        this.adListeners = Array();
        this.player_ready = 0;
        window.addEventListener("message", this.receiveMessage.bind(this), false);
    };

    PowrVideo.prototype.onResize = function (shouldFloat) {

        var elementCheck = document.getElementById(this.config.id);
        if (elementCheck == null) {
            return;
        }

        var width = this.element.clientWidth;
        var height;
        if ((width == null || width <= 0) && this.config.showhide == "yes") {
            width = parseInt(this.config.width);
        }

        if (this.config.pub_id == 98997 && this.config.showhide == "yes") {
            width = window.innerWidth;
        }

        height = parseInt(0.5625 * width);
        var hs = height + "px";

        if (this.config.fluid) {
            height = this.element.clientHeight;
            hs = "100%";
        } else if (this.config.showhide == "yes") {
            hs = "100%";
        }

        if (this.player && !this.floated) {
            this.player.dimensions(width, height);
        }
        this.element.setAttribute("style", "width : 100%; height : " + hs + "; background-color : #EFEFEF");

        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var newOrientation = '';
        if (windowWidth < windowHeight) {
            newOrientation = 'portrait';
        } else if (windowWidth > windowHeight) {
            newOrientation = 'landscape';
        }
        if (newOrientation != this.orientation) {
            this.orientation = newOrientation;
            this.orientationChanged();
        } else {
            if (shouldFloat && this.floated) {
                this.floated = false;
                this.floatPlayer();
            }
        }

        if (this.player) {
            var w = this.getPlayerWidth();
            var h = this.getPlayerHeight();
            if (this.player.isFullscreen()) {
                w = windowWidth;
                h = windowHeight;
            }
            var x = w / 2 - 32;
            var y = h / 2 - 32;

            var playDom = this.playOverlay.contentEl();
            playDom.setAttribute("style", "left : " + x + "px; bottom : " + y + "px; top : auto;");

        }

    };


    PowrVideo.prototype.getPlayerHeight = function () {
        if (this.player) {
            return this.player.height();
        } else {
            return this.element.getBoundingClientRect().height;
        }
    };

    PowrVideo.prototype.getPlayerWidth = function () {
        if (this.player) {
            return this.player.width();
        } else {
            return this.element.getBoundingClientRect().width;
        }
    };

    PowrVideo.prototype.setup = function () {
	this.attachVisibleListener();
	if (this.showOnFocus == "yes" && !this.hasOwnProperty("setupOnVisible")) {
	    this.setupOnVisible = true;
	    return;
	}
	powrUtils.removeClass(this.element, "powr_hidden");

    if (this.abp !== true) {
        this.events = [google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
            google.ima.AdEvent.Type.CLICK,
            google.ima.AdEvent.Type.COMPLETE,
            google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
            google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
            google.ima.AdEvent.Type.FIRST_QUARTILE,
            google.ima.AdEvent.Type.LOADED,
            google.ima.AdEvent.Type.MIDPOINT,
            google.ima.AdEvent.Type.PAUSED,
            google.ima.AdEvent.Type.STARTED,
            google.ima.AdEvent.Type.VOLUME_CHANGED,
            google.ima.AdEvent.Type.VOLUME_MUTED,
            google.ima.AdEvent.Type.THIRD_QUARTILE,
            google.ima.AdEvent.Type.LOG,
            google.ima.AdErrorEvent.Type.AD_ERROR
        ];

        google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true);
    }

        this.container = document.createElement("div");
        this.container.className = "powr_player";

        if (this.config.pub_id == 98997) {
            document.body.appendChild(this.container);
        } else {
            this.element.appendChild(this.container);
        }

        if (this.permanentClose == "yes") {
            this.container.className = 'powr_player powr_permanent_close';
            this.crossButton = document.createElement("a");
            this.crossButton.id = this.playerId + '_close_button';
            this.crossButton.className = 'powr_perm_close ' + (this.crossDelay > 0 ? ' powr_close_hide' : '');
            // this.crossButton.style = "display : block; position : absolute; right : 5px; top : 5px; background-color : #333; z-index : 10000; border-radius : 20px; color : #FFF; padding : 4px 11px; font-weight : 700; font-size : 14px; ";
            this.crossButton.setAttribute("href", "javascript: void(0)");
            this.crossButton.innerHTML = "X";
            // this.crossButton.style.display = "none";

            this.container.appendChild(this.crossButton);

            if (this.crossDelay > 0) {
                var that = this;
                setTimeout(function () {
                    that.playerId;
                    me.showCrossButton(that.crossButton.id);
                }, this.crossDelay);
            }

            powrUtils.addEventListener(this.crossButton, 'click', this.bind(this, this.onCrossClicked));
        }


        powrUtils.addEventListener(window, 'resize', this.onResize.bind(this, true));
        this.orientation = 'none';
        this.onResize(true);

        var dumbPlayer = document.createElement('video');
        dumbPlayer.id = this.playerId;
        var aspectRatio;
        var outstreamWidth;
        if (this.config.showhide == "yes") {
            aspectRatio = "vjs-16-9";
            if (this.config.pub_id == 98997) {
                outstreamWidth = window.innerWidth;
            } else {
                outstreamWidth = this.config.width;
            }

        } else {
            aspectRatio = "vjs-fluid";
        }


        dumbPlayer.className = 'video-js vjs-default-skin vjs-big-play-centered ' + aspectRatio;
        dumbPlayer.setAttribute('width', this.getPlayerWidth() + 'px');

        if (this.config.showhide == "yes") {
            dumbPlayer.setAttribute("style", "width:" + outstreamWidth + "px;");
        }

        dumbPlayer.setAttribute('height', this.getPlayerHeight() + 'px');
        dumbPlayer.setAttribute("controls", "true");
        if (this.config.video_preload == null) {
            this.config.video_preload = "auto";
        }
        dumbPlayer.setAttribute("preload", this.config.video_preload);

        this.log("Setting up Video Element");
        if (!this.autoplaySettings.autoplay) {
            dumbPlayer.setAttribute("muted", "true");
            dumbPlayer.setAttribute("poster", this.videos[0].thumbnail);
        }
        dumbPlayer.setAttribute("playsinline", "");

        dumbPlayer.setAttribute("webkit-playsinline", "");

        if (this.autoplaySettings.autoplay && !this.autoplaySettings.audio) {
            this.log("Setting player muted");
            dumbPlayer.setAttribute("muted", "true");
        }

        var contentSrc = document.createElement('source');
        contentSrc.setAttribute('src', this.getVideoFromResolution(this.videos[0]));
        contentSrc.setAttribute('type', 'video/mp4');
        dumbPlayer.appendChild(contentSrc);
        this.container.appendChild(dumbPlayer);

        if (document.URL.indexOf('debug=powr') !== -1) {

            var openvv = new OpenVV(), element = document.getElementById(this.playerId);

            openvv
                .measureElement(element)
                .onViewableStart(function (args) {
                    // element has started being viewable according to the default threshold of 50% in view
                    console.log('Viewable Start', new Date().toString(), args);
                })
                .onViewableStop(function (args) {
                    // element has stopped being viewable as it has dropped below the default 50% in view threshold
                    console.log('Viewable Stop', new Date().toString(), args);
                })
                .onViewableChange(function (args) {
                    // element's in view percentage has changed. Will be called whenever element's in view percentage changes
                    console.log('Viewable Change', new Date().toString(), args);
                })
                .onViewableComplete(function (args) {
                    // element has been in view above the viewable threshold for atleast 2 continuous seconds
                    console.log('Viewable Complete', new Date().toString(), args);
                })
                .onUnmeasureable(function () {
                    // no measurement techniques were found that are capable of measuring in the current enviroment (browser + iframe context)
                    console.log('Unmeasureable');
                });
        }

        this.player = videojs(this.playerId, {
            nativeControlForTouch: false
        });

        if (this.autoplaySettings.autoplay && !this.autoplaySettings.audio) {
            this.log("Setting player muted");
            this.player.muted(true);
        }


        this.currentContent = 0;

        this.player.logobrand({
            image: "https://media.powr.com/rc_logo.png",
            destination: "https://www.powr.com/" + (this.config.username ? this.config.username : "")
        });

        var me = this;

        // If we are autoplaying a muted version, let's toggle audio on first click
        this.player.ready(this.onReady.bind(this));

        // powrUtils.addEventListener(this.container, "touchstart",
    };

    PowrVideo.prototype.onReady = function () {
        var me = this;
        this.player.controls(true);
        this.player.enableTouchActivity();

        // Setup overlays
        this.setupOverlays();

        if (this.config.fluid) {
            this.player.fluid(false);
        }

        // Manually invoke resize so it sts up play/apuse buttons.
        this.onResize(true);

        if (!this.autoplaySettings.audio) {
            // this.volumeOffOverlay.show();
        }

        this.player.on('timeupdate', this.onUpdate.bind(this));

        this.player.on('play', this.onPlay.bind(this));
        this.player.on('pause', this.onPause.bind(this));
        this.player.on('useractive', this.onActive.bind(this));
        this.player.on('userinactive', this.onIdle.bind(this));
        this.player.on('loadedmetadata', this.onMetadataLoaded.bind(this));
        if (this.mobile) {
            this.player.on('touchstart', this.bind(this, this.onTouchStart));
            this.player.on('touchmove', this.bind(this, this.onTouchMove));
            this.player.on('touchend', this.bind(this, this.onTouchEnd));
        } else {
            this.player.on('click', this.bind(this, this.onClick));
        }
        this.player.on('fullscreenchange', this.onFullscreenChange.bind(this));
        this.player.on('loadeddata', function () {
            // console.log("LOADED DATA");
        });
        this.player.on('waiting', function () {
            // console.log("WAITING FOR DATA");
        });
        this.player.on("volumechange", this.bind(this, this.onVolumeChange));
        this.player.on('ended', this.bind(this, this.loadNextVideoWithTick));

        GlobalPlayer = this;

        this.closeButton = this.container.querySelector(".rc-video-close");
        this.titleDom = this.container.querySelector(".rc-video-title");

        powrUtils.addEventListener(this.closeButton, 'click', function () {
            me.floatSettings.landscape = false;//neverFloat = true;
            me.floatSettings.portrait = false;

            me.player.pause();
            me.unfloatPlayer();
        });

        // Don't show big button. we have our own.
        this.player.bigPlayButton.hide();
        this.player.controlBar.volumeMenuButton.hide();

        this.started = false;

        if (me.autoplaySettings.autoplay) {
            if (me.autoplaySettings.focus) {
                this.checkVisible();
                this.autoplayOnVisible = true;
                if (this.visible === true) {
                    this.onVisible();
                } else if (this.config.showhide != "yes") {
                    this.playOverlay.show();
                }
            } else {
                this.playOverlay.hide();
                this.player.loadingSpinner.lockShowing();
                this.start(true);
            }
        } else {
            this.playOverlay.show();
        }
    };

    PowrVideo.prototype.onUpdate = function () {
        if (this.currentContent >= this.videos.length)
            return;
        if (!this.config.hasOwnProperty("tracking_url") || this.config.showhide == 'yes')
            return;
        var video = this.videos[this.currentContent];
        var d = this.player.currentTime();
        d = (d * 1.0) / video.duration;
        if (video.tracking['start'] && (d > 0)) {
            powrApiOriginal.request(this.config.tracking_url + video.tracking['start'], function () {
                return;
            });
            video.tracking['start'] = null;
        } else if (video.tracking['q_1'] && (d > 0.25)) {
            powrApiOriginal.request(this.config.tracking_url + video.tracking['q_1'], function () {
                return;
            });
            video.tracking['q_1'] = null;
        } else if (video.tracking['q_2'] && (d > 0.5)) {
            powrApiOriginal.request(this.config.tracking_url + video.tracking['q_2'], function () {
                return;
            });
            video.tracking['q_2'] = null;
        } else if (video.tracking['q_3'] && (d > 0.75)) {
            powrApiOriginal.request(this.config.tracking_url + video.tracking['q_3'], function () {
                return;
            });
            video.tracking['q_3'] = null;
        }
    };

    PowrVideo.prototype.start = function(playOnLoad) {
    	this.started = true;
        var debugIma = false;
        if (window.location.href.indexOf("powrtest=1") > 0) {
            debugIma = true;
        }
        if (this.abp !== true) {
            this.options = {

                id: this.playerId,
                nativeControlForTouch: false,
                prerollTimeout: 15000,
                timeout: 20000,
                adWillAutoPlay: this.autoplaySettings.autoplay,
                showControlsForJSAds: this.showControls,
                showCountdown: true,
                vpaidMode: google.ima.ImaSdkSettings.VpaidMode.INSECURE,
                debug: debugIma
            };
            this.player.ima(this.options, this.bind(this, this.adsManagerLoadedCallback));
            this.player.ima.initializeAdDisplayContainer();
            // this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), playOnLoad);
            this.player.ima.setContentWithAdsResponse(this.getVideoFromResolution(this.videos[this.currentContent]), this.getAdsResponse(this.videos[this.currentContent]), playOnLoad);

            if (!this.autoplaySettings.autoplay) {
                this.player.poster(this.videos[this.currentContent].thumbnail);
            }
            this.adsPlayed = 0;

            if (this.config.showhide != 'yes') {
                this.player.trigger("nopreroll");

                // remove the videojs-ima content pause listener so we continue to show the content video while the ad is loading
                this.originalImaOnContentPauseRequested_ = this.player.ima.onContentPauseRequested_;
                this.player.ima.onContentPauseRequested_ = function(adData) {
                    console.log("overloaded onContentPauseRequested", adData);

                    this.originalAdData = adData;
                    // this.player.removeClass('vjs-ad-loading');
                    this.player.ima.adContainerDiv.style.display = 'none';
                }.bind(this);
            } else {
                this.originalImaOnContentPauseRequested_ = function() {};
            }

            this.player.ima.requestAds();

            powrApiOriginal.request("https://api.powr.com/p0/ads/requested?account=" + this.config.pub_id, function () {
                 return;
             });

        } else {
            if (!this.autoplaySettings.autoplay) {
                this.player.poster(this.videos[this.currentContent].thumbnail);
            } else {
                this.playOverlay.hide();
                this.player.loadingSpinner.unlockShowing();
                var playPromise = this.player.play();
                playPromise.catch(function(error) {});
            }
        }

        var me = this;
        //this.player.ima.addContentAndAdsEndedListener(function () {
        //setTimeout(function () {
        //me.loadNextVideo();
        //}, 100);
        //});
    };

    PowrVideo.prototype.loadNextVideoWithTick = function() {
        this.log("loadNextVideoWithTick");
        if (this.abp !== true && this.player.ads.isInAdMode()) {
            return;
        }


        if (this.config.showhide == 'yes') {
            this.animateDispose(this.player, this.element);
            return;
        }

        var me = this;
        setTimeout(function () {
            me.loadNextVideo();
        }, 2000);
    };

    PowrVideo.prototype.loadNextVideo = function () {
        var video = this.videos[this.currentContent];
        if (this.config.hasOwnProperty("tracking_url")) {
            if (video.tracking['end']) {
                powrApiOriginal.request(this.config.tracking_url + video.tracking['end'], function () {
                    return;
                });
                video.tracking['end'] = null;
            }
        }
        this.currentContent = (this.currentContent + 1) % this.videos.length;
        if (this.currentContent < this.videos.length) {
            if (this.abp !== true) {
                this.adsPlayed = 0;

                this.player.ima.initializeAdDisplayContainer();
                this.player.ima.setContentWithAdsResponse(this.getVideoFromResolution(this.videos[this.currentContent]), this.getAdsResponse(this.videos[this.currentContent]), false);
                // this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), false);
                var titleContent = this.videos[this.currentContent].title;
                this.titleDom.innerHTML = '<a target="_blank" href="' + this.getVideoLink(this.videos[this.currentContent]) + '">' + titleContent + "</a>";
                this.player.ima.requestAds();
                if (this.config.pub_id == "10004590") {
                    powrApiOriginal.request("https://api.powr.com/p0/ads/requested?pub_id=" + this.config.pub_id, function () {
                        return;
                    });
                }

                if (this.config.showhide != "yes") {
                    this.player.play();
                }
            } else {
                var titleContent = this.videos[this.currentContent].title;
                this.titleDom.innerHTML = '<a target="_blank" href="' + this.getVideoLink(this.videos[this.currentContent]) + '">' + titleContent + "</a>";
                if (this.config.showhide != "yes") {
                    this.player.play();
                }
            }
        }
	};

    PowrVideo.prototype.getVideoLink = function (v) {
        var title = v.title;
        if (title.trim().length > 0) {
            title = title.toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/ /g, "-") + "-";
        }
        return "http://www.powr.com/video/" + title + v.id;
    };

    PowrVideo.prototype.attachVisibleListener = function () {
        if (this.visibleListenerAttached) return;
        if (this.floatSettings.landscape || this.floatSettings.portrait || this.autoplaySettings.focus || (this.showOnFocus == 'yes')) {
            if (this.config.pub_id == 98997) {
                powrUtils.addEventListener(window.parent, 'scroll', this.checkVisible.bind(this));
            } else {
                powrUtils.addEventListener(window, 'scroll', this.checkVisible.bind(this));
            }
            this.checkVisible();
        }
        this.visibleListenerAttached = true;
    };

    PowrVideo.prototype.floatPlayer = function () {
        if (this.floated)
            return;
        if (this.orientation == "portrait" && !this.floatSettings.portrait)
            return;
        if (this.orientation == "landscape" && !this.floatSettings.landscape)
            return;

        powrUtils.addClass(document.body, 'powr_player_floating');
        this.container.className = "rc-float-video powr_player " + (this.permanentClose == "yes" ? "powr_permanent_close" : "");
        var styleString = "";
        var fs = this.floatSettings;

        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        this.showConflicts("top");
        this.showConflicts("bottom");

        if (this.orientation == 'portrait') {
            styleString += "top : 0px;";
            styleString += "left : 0px; right : 0px; width : 100%; height : 176px;";
            this.player.fluid(false);
            this.player.dimensions(windowWidth, 176);

            // this.closeButton.setAttribute("style", "margin-top : 166px; margin-left : " + (windowWidth - 60) + "px");
            this.closeButton.setAttribute("style", "margin-top : 0px; margin-left : " + (windowWidth - 50) + "px");

            this.hideConflicts("top");

        } else {
            this.player.fluid(true);
            if (fs.landscape_style.startsWithPowr("top")) {
                styleString += "top : 10px;";
            } else {
                styleString += "bottom : 10px;";
            }

            if (fs.landscape_style.endsWithPowr("right")) {
                styleString += "right : 10px;";
            } else {
                styleString += "left : 10px;";
            }

            var r = this.element.getBoundingClientRect();
            var w = windowWidth - r.right;
            w = w - 20;
            if (w < fs.min_width) {
                w = fs.min_width;
            }
            if (w > fs.max_width) {
                w = fs.max_width;
            }

            var h = parseInt(0.5625 * w);
            if (h > windowHeight / 2) {
                h = windowHeight / 2;
                w = parseInt(h / 0.5625);
                h = parseInt(h);
            }

            styleString += "width : " + w + "px;";

            if (fs.landscape_style.startsWithPowr("top")) {
                this.closeButton.setAttribute("style", "margin-top : " + (h - 10) + "px;");
            } else {
                this.closeButton.setAttribute("style", "margin-left : " + (w - 100) + "px; margin-top : -32px; z-index : -10 !important;");
            }
            this.player.dimensions(w, parseInt(h));

            this.hideConflicts("bottom");
        }

        this.container.setAttribute("style", styleString);
        this.floated = true;

        this.onResize(false);
    };

    PowrVideo.prototype.showConflicts = function (t) {
        try {
            for (var i = 0; i < this.floatConflicts[t].length; i++) {
                try {
                    var f = this.floatConflicts[t][i];
                    var d = document.body.querySelector(f);
                    d.style.display = "block";
                } catch (e) {
                }
            }
        } catch (e) {
        }
    };

    PowrVideo.prototype.hideConflicts = function (t) {
        try {
            for (var i = 0; i < this.floatConflicts[t].length; i++) {
                try {
                    var f = this.floatConflicts[t][i];
                    var d = document.body.querySelector(f);
                    d.style.display = "none";
                } catch (e) {
                }
            }
        } catch (e) {
        }
    };

    PowrVideo.prototype.getReferer = function () {
        var referer = "";
        try {
            referer = document.referrer
            if ("undefined" == typeof referer)
                throw "undefined"
        } catch (exception) {
            referer = document.location.href;
            if ("" == referer || "undefined" == typeof referer)
                referer = document.URL;
        }
        referer = referer.substr(0, 700);
        return referer;
    };

    PowrVideo.prototype.showRCAd = function (widgetId) {
        if (this.rcDiv)
            return;
        this.rcDiv = document.createElement("div");
        powrUtils.addClass(this.element, "rc_ad_showing");
        powrUtils.addClass(this.rcDiv, "powr_rc_container");
        this.container.appendChild(this.rcDiv);

        var skipBtn = document.createElement("a");
        powrUtils.addClass(skipBtn, "powr_skip");
        powrUtils.addClass(skipBtn, "powr_disabled");
        skipBtn.innerHTML = "Loading ...";
        this.rcDiv.appendChild(skipBtn);


        var label = document.createElement("label");
        powrUtils.addClass(label, "powr_by_rc");
        label.innerHTML = "Ads By Revcontent";
        this.rcDiv.appendChild(label);

        var referer = this.getReferer();

        var rcel = document.createElement("script");
        rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
        rcel.type = 'text/javascript';
        rcel.src = "https://video.powr.com/serve.js.php?w=" + widgetId + "&t=" + rcel.id + "&c=" + (new Date()).getTime() + "&width=" + (window.outerWidth || document.documentElement.clientWidth) + "&referer=" + referer;
        rcel.async = true;
        this.rcDiv.appendChild(rcel);

        this.player.pause();
        this.rcCountDownSeconds = 15;
        this.rcCountDownInterval = setInterval(this.rcAdCountdown.bind(this), 1000);
        //setTimeout(this.hideRCAd.bind(this), 5000);
    };

    PowrVideo.prototype.rcAdCountdown = function () {
        var totalPhotos = this.rcDiv.querySelectorAll(".rc-photo");
        if (totalPhotos.length == 0) return;

        this.rcCountDownSeconds--;
        if (this.rcCountDownSeconds == 10) {
            var me = this;
            powrUtils.addEventListener(this.rcDiv, "click", function () {
                clearInterval(me.rcCountDownInterval);
                me.rcCountDownInterval = null;
                me.hideRCAd();
            });

            this.rcDiv.querySelector(".powr_skip").innerHTML = "Skip Ad";
        } else if (this.rcCountDownSeconds == 0) {
            clearInterval(this.rcCountDownInterval);
            this.rcCountDownInterval = null;
            this.hideRCAd();
        } else if (this.rcCountDownSeconds > 10) {
            this.rcDiv.querySelector(".powr_skip").innerHTML = "Wait " + (this.rcCountDownSeconds - 10);
        }
    }


    PowrVideo.prototype.hideRCAd = function () {
        powrUtils.removeClass(this.element, "rc_ad_showing");
        this.container.removeChild(this.rcDiv);
        this.rcDiv = null;
        this.player.muted(false);
        this.player.play();
    }

    PowrVideo.prototype.unfloatPlayer = function () {
        if (this.floated) {
            powrUtils.removeClass(document.body, 'powr_player_floating');
            this.container.className = 'powr_player ' + (this.permanentClose == "yes" ? 'powr_permanent_close' : '');
            this.container.removeAttribute("style");
            this.floated = false;
            this.player.fluid(true);
            var w = this.element.getBoundingClientRect().width;
            var h = this.element.getBoundingClientRect().height;
            this.player.dimensions(w, h);
            this.onResize(false);

            this.showConflicts("top");
            this.showConflicts("bottom");
        }
    };

    PowrVideo.prototype.orientationChanged = function () {
        if (this.floated) {
            this.floated = false;
            // refloat player if orientation has changed.
            this.floatPlayer();
        }
        this.onResize(true);
    };

    PowrVideo.prototype.getTitle = function () {

    };

    PowrVideo.prototype.checkVisible = function () {
        var that = this;
        requestAnimationFrame(function () {
            // what percentage of the element should be visible
            // var visibleHeightMultiplier = (typeof percentVisible === 'number') ? (parseInt(percentVisible) * .01) : 0;
            // fire if within buffer
            // var bufferPixels = (typeof buffer === 'number') ? buffer : 0;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var elementTop, elementBottom, elementVisibleHeight, elementDelta;
            if (that.config.showhide == "yes") {
                if (that.config.pub_id == 98997) {
                    windowHeight = window.top.innerHeight;
                    elementTop = parent.document.getElementById(frameElement.id).getBoundingClientRect().top;
                    elementBottom = parent.document.getElementById(frameElement.id).getBoundingClientRect().bottom;
                    elementVisibleHeight = that.showhideHeight * 0.50;
                } else {
                    elementTop = that.focusPixel.getBoundingClientRect().top;
                    elementBottom = that.focusPixel.getBoundingClientRect().bottom;
                    elementVisibleHeight = that.showhideHeight * 0.50;
                }

                elementDelta = 150;
            } else {
                elementTop = that.element.getBoundingClientRect().top;
                elementBottom = that.element.getBoundingClientRect().bottom;
                elementVisibleHeight = that.element.offsetHeight * 0.50;
                elementDelta = 0;
            }

            // var pixelsShown = Math.min(Math.max(elementTop > 0 ? windowHeight - elementTop : that.getPlayerHeight() + elementTop, 0), that.getPlayerHeight());
            if (elementTop + (that.getPlayerHeight() * 0.4) < 0) {
                if (that.visible) {
                    that.visible = false;
                    that.onHidden();
                }
            } else if (elementTop + 30 < windowHeight + elementDelta) {
                if (!that.visible) {
                    that.visible = true;
                    that.onVisible();
                }
            }

            if (window.location.href.indexOf("powrtest=1") > 0) {
                that.log("element top: " + elementTop);
                that.log("player height: " + that.getPlayerHeight());
                that.log("window height: " + windowHeight);
            }
        });
    };

    PowrVideo.prototype.onVisible = function () {
        this.log("onVisible");
        if (this.config.showhide == "yes") {
            if (this.disposed == true) {
                return;
            }
        }
        if (this.setupOnVisible) {
            this.setupOnVisible = false;
            this.setup();
        }

        if (this.autoplayOnVisible) {
            this.autoplayOnVisible = false;
            this.playOverlay.hide();
            this.player.loadingSpinner.lockShowing();
            this.start(true);
            this.pauseOnHidden = true;
        } else if (this.pauseOnHidden && this.autoPaused && this.player.paused() && this.config.showhide != "yes") {
            this.player.play();
        }

        this.registerView();
        this.unfloatPlayer();
    };

    PowrVideo.prototype.onHidden = function () {
        if (this.config.showhide == "yes") {
            if (this.disposed == true) {
                return;
            }
        }

        if (window.location.href.indexOf("powrtest=1") > 0) {
            this.log("onHidden");

            if (this.config.showhide == "yes") {
                if (this.disposed == true) {
                    this.log("hidden but already disposed.");

                }
                this.player.ima.getAdsManager().pause();
                return;
            }
        }

        if (this.setupOnVisible) {
            return;
        }
        this.floatPlayer();

        if (this.pauseOnHidden && !this.player.paused() && !this.floated) {
            this.autoPaused = true;
            this.player.pause();
        }

    };

    PowrVideo.prototype.adsManagerLoadedCallback = function () {
        var me = this;
        for (var index = 0; index < this.events.length; index++) {
            this.player.ima.addEventListener(
                this.events[index],
                this.bind(this, this.onAdEvent));
        }

        this.player.ima.addEventListener(google.ima.AdEvent.Type.STARTED, function () {
            me.player.removeClass('vjs-ad-loading');
            me.player.loadingSpinner.unlockShowing();
        });
        this.player.ima.startFromReadyCallback();
    };

    PowrVideo.prototype.onAdEvent = function (event) {
        this.log("onAdEvent", event);

        if (event.type == google.ima.AdEvent.Type.LOADED) {
            if (this.player.muted()) {
                this.player.ima.getAdsManager().setVolume(0);
            }
        }
        if (event.type == google.ima.AdEvent.Type.STARTED) {
            if (document.URL.indexOf('debug=adspowr') !== -1) {

                var openvv = new OpenVV(), element = document.getElementById(this.playerId);

                openvv
                    .measureElement(element)
                    .onViewableStart(function (args) {
                        // element has started being viewable according to the default threshold of 50% in view
                        console.log('Viewable Start', new Date().toString(), args);
                    })
                    .onViewableStop(function (args) {
                        // element has stopped being viewable as it has dropped below the default 50% in view threshold
                        console.log('Viewable Stop', new Date().toString(), args);
                    })
                    .onViewableChange(function (args) {
                        // element's in view percentage has changed. Will be called whenever element's in view percentage changes
                        console.log('Viewable Change', new Date().toString(), args);
                    })
                    .onViewableComplete(function (args) {
                        // element has been in view above the viewable threshold for atleast 2 continuous seconds
                        console.log('Viewable Complete', new Date().toString(), args);
                    })
                    .onUnmeasureable(function () {
                        // no measurement techniques were found that are capable of measuring in the current enviroment (browser + iframe context)
                        console.log('Unmeasureable');
                    });
            }

            this.originalImaOnContentPauseRequested_(this.originalAdData);
            this.adsPlayed++;
            if (this.config.showhide == "yes") {
                this.animateShow();
            }
            if (this.adListeners.length > 0) {
                this.adListeners.forEach(function (listener) {
                    var response = {
                        "id": listener.id,
                        "listenerId": listener.listenerId,
                        "flag": listener.flag,
                        "msg": "ad_shown"
                    };
                    listener.source.postMessage(JSON.stringify(response), listener.origin);
                });
            }
        }
        if (event.type == google.ima.AdEvent.Type.ALL_ADS_COMPLETED) {
            if (this.adsPlayed == 0) {
                this.log("No ads shown. Backfill");
                if (this.config.widget_id && this.config.widget_id != -1) {
                    this.showRCAd(this.config.widget_id);
                }

                if (this.config.showhide == 'yes') {
                    this.element.setAttribute("style", "width: 0px; height : 0px; position : relative;");
                    powrUtils.removeEventListener(window, 'resize');
                    this.player.dispose();
                    this.element.parentNode.removeChild(this.element);
                    return;
                }
            }

            if (this.config.showhide == 'yes') {
                this.animateDispose(this.player, this.element);
                return;
            }
        }
    };

    PowrVideo.prototype.registerView = function () {
        if (!this.config.hasOwnProperty("tracking_url"))
            return;
        if (!this.viewed) {
            this.viewed = true;
            powrApiOriginal.request(this.config.tracking_url + this.config.view_tracker, function () {
                return;
            });
        }
    };

    PowrVideo.prototype.getTitleContent = function () {
        var titleContent = "<a class='rc-video-close' href='javascript:void(0)' class='close'><span>CLOSE | </span>X</a>";
        if (this.config.custom_logo) {
            titleContent += "<img src='" + this.config.custom_logo + "'>";
        }
        if (this.currentContent < this.videos.length) {
            titleContent += "<span class='rc-video-title'><a target='_blank' href='" + this.getVideoLink(this.videos[this.currentContent]) + "'>" + this.videos[this.currentContent].title + "</a></span>";
        }
        return titleContent;
    };

    PowrVideo.prototype.setupOverlays = function () {

        this.player.overlay({
            showBackground: true,
            overlays: [{
                content: this.getTitleContent(),
                start: "custom1",
                end: "custom2",
                align: "top",
                class: "rc-video-overlay"
            }, {
                start: "custom1",
                end: "custom2",
                content: "",
                showBackground: false,
                class: "rc-play-button"
            }, {
                start: "custom1",
                end: "custom2",
                content: "<div class='rc-bar'></div><div class='rc-bar'></div><div class='rc-bar'></div><div class='rc-bar'></div>",
                showBackground: false,
                class: "rc-volume-on-button",
                align: "bottom-right"
            }, {
                start: "custom1",
                end: "custom2",
                content: "<div class='rc-bar'></div><div class='rc-bar'></div><div class='rc-bar'></div><div class='rc-bar'></div>",
                showBackground: false,
                class: "rc-volume-off-button",
                align: "bottom-right"
            }]
        });

        this.titleOverlay = this.player.overlays_[0];
        this.playOverlay = this.player.overlays_[1];
        this.volumeOnOverlay = this.player.overlays_[2];
        this.volumeOffOverlay = this.player.overlays_[3];
        this.titleOverlay.show();
        this.playOverlay.hide();
        this.volumeOnOverlay.hide();
        this.volumeOffOverlay.hide();
    };

    PowrVideo.prototype.bind = function (thisObj, fn, argument) {
        return function () {
            fn.apply(thisObj, [argument]);
        };
    };

    PowrVideo.prototype.onMetadataLoaded = function () {
        this.player.loadingSpinner.unlockShowing();
    };

    PowrVideo.prototype.onTouchStart = function (e) {
        if (this.player.ima && this.player.ima.adPlaying) return;
        this.dragging = false;
        this.cancelEvent(e);
    };
    PowrVideo.prototype.onTouchMove = function (e) {
        if (this.player.ima && this.player.ima.adPlaying) return;
        this.dragging = true;
        this.cancelEvent(e);
    };
    PowrVideo.prototype.onTouchEnd = function (e) {
        if (this.player.ima && this.player.ima.adPlaying) return;
        if (this.dragging) return;
        this.onClick(e);
        this.cancelEvent(e);
    };

    PowrVideo.prototype.onVolumeChange = function () {
    }

    PowrVideo.prototype.onFullscreenChange = function () {
        this.onResize(true);
    };

    PowrVideo.prototype.onClick = function (e) {
        if ((this.player.ima && this.player.ima.adPlaying) || this.config.showhide == 'yes') {
            return;
        }
        if (!this.started) {
            this.player.muted(false);
            this.playOverlay.hide();
            this.start(true);
            this.cancelEvent(e);
            return;
        }

        if (this.isClickedOnBar(e)) {
            return;
        }

        if (this.fbiaios === true) {
            this.player.controls(false);
        } else {
            this.player.controls(true);
        }

        var v = this.getVideoElement();
        v.removeAttribute("muted");

        if (this.player.muted()) {
            this.player.muted(false);
            this.player.volume(1);
            this.volumeOffOverlay.hide();
            this.cancelEvent(e);
            return;
        }

        if (this.player.ended()) {
            this.player.ima.requestAds();

            if (this.config.showhide == "yes") {
                this.animateDispose(this.player, this.element);
            } else {
                this.player.play();
            }

            return;
        }
    };

    PowrVideo.prototype.onPlay = function () {
        if (this.rcDiv) {
            this.player.pause();
            return;
        }
        this.autoPaused = false;
        this.playOverlay.hide();
        // this.player.controlBar.volumeMenuButton.hide();

        if (this.player.muted()) {
            this.volumeOffOverlay.show();
            // this.player.controlBar.hide();
            this.player.controls(false);
        }
    };

    PowrVideo.prototype.onPause = function (e) {
        this.titleOverlay.show();
    };

    PowrVideo.prototype.onActive = function () {
        this.titleOverlay.show();
        this.volumeOffOverlay.hide();
        if (this.crossButton)
            this.crossButton.style.display = "block";
        // this.player.controlBar.show();
    };

    PowrVideo.prototype.onIdle = function () {
        if (!this.player.paused()) {
            this.titleOverlay.hide();
            this.playOverlay.hide();
            // this.player.controlBar.hide();
            // this.player.controls(false);
            // this.volumeOnOverlay.hide();
            if (this.player.muted() || this.player.volume() == 0) {
                this.volumeOffOverlay.show();
            }
        }
    };

    PowrVideo.prototype.createFloatSettings = function () {
        var c = this.config;
        var ret = {
            "landscape": false,
            "portrait": false,
            "min_width": 400,
            "max_width": 480
        };
        if (!c.float) return ret;
        if (typeof c.float == 'string' && c.float == 'none') {
            return ret;
        }
        if (typeof c.float == 'string' && c.float == 'default') {
            ret.landscape = true;
            ret.portrait = true;
            ret.landscape_style = "bottom-right";
            ret.portrait_style = "top";
            return ret;
        }
        if (c.float.desktop && c.float.desktop != "none") {
            ret.landscape = true;
            ret.landscape_style = c.float.desktop;
        }
        if (c.float.mobile && c.float.mobile != "none") {
            ret.portrait = true;
            ret.portrait_style = c.float.mobile;
        }
        return ret;
    };

    PowrVideo.prototype.createIframeSettings = function () {
        var c = this.config;
        var ret = {
            iframe: false
        };
        if (!c.iframe_id) return ret;
        ret.iframe = true;
        ret.id = c.iframe_id;
        return ret;
    };

    PowrVideo.prototype.isClickedOnBar = function (e) {
        var t = e.target;
        if (t.nodeName.toLowerCase() == "video") {
            return false;
        }
        if (t.className.indexOf("rc-play-button") > 0) {
            return false;
        }
        return true;
    };

    PowrVideo.prototype.createAutoplaySettings = function () {
        var c = this.config;
        var ret = {
            "autoplay": false,
            "focus": false,
            "audio": false
        };

        if (typeof c.autoplay == "string") {
            if (c.autoplay == "none") return ret;
            ret.autoplay = true;
            if (c.autoplay == "load") {
                ret.audio = (!this.mobile && !this.safari);
                if (ret.audio && this.config.hasOwnProperty("muted")) {
                    ret.audio = (this.config.muted == "no");
                }
                return ret;
            }
            if (c.autoplay == "focus") {
                ret.focus = true;
                ret.audio = false;
                if (this.config.hasOwnProperty("muted")) {
                    ret.audio = (this.config.muted == "no");
                }
                return ret;
            }
        } else {
            if (this.mobile) {
                ret = c.autoplay.mobile;
            } else {
                ret = c.autoplay.desktop;
            }
        }

        return ret;
    };

    PowrVideo.prototype.isSafari = function () {
        var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
        var is_safari = navigator.userAgent.indexOf("Safari") > -1;
        if ((is_chrome) && (is_safari)) {
            is_safari = false;
        }
        return is_safari;
    }


    PowrVideo.prototype.bind = function (thisObj, fn) {
        return function () {
            fn.apply(thisObj, arguments);
        };
    };

    PowrVideo.prototype.onCrossClicked = function (e) {
        if (this.element.parentNode !== null) {
            this.element.parentNode.removeChild(this.element);
        }
    };

    PowrVideo.prototype.cancelEvent = function (e) {
        if (typeof e.stopPropagation != "undefined") {
            e.stopPropagation();
        } else if (typeof e.cancelBubble != "undefined") {
            e.cancelBubble = true;
        }
    };

    PowrVideo.prototype.getVideoElement = function () {
        return this.element.querySelector("video");
    };

    PowrVideo.prototype.checkAutoplaySupport = function (callback) {
        if (!this.mobile) {
            callback(true);
            return;
        }
        // var old = powrUtils.getCookie("p_a_s");
        // if (old != "") {
        // callback(old == "yes");
        // return;
        // }

        var video = document.createElement('video');
        video.autoplay = true;

        video.src = 'data:video/mp4;base64,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';
        video.muted = true;
        video.setAttribute('webkit-playsinline', 'webkit-playsinline');
        video.setAttribute('playsinline', 'playsinline');
        video.style.display = 'none';
        video.playing = false;

        var me = this;

        setTimeout(function () {
            if (!me.autoplayDetected) {
                callback(false);
            }
        }, 5000);

        // Check if video plays
        video.onplay = function () {
            this.playing = true;
        };
        // Video has loaded, check autoplay support
        video.oncanplay = function () {
            if (video.playing) {
                // PowrVideo.setCookie('p_a_s', 'yes', 1);
                callback(true);
            } else {
                // powrUtils.setCookie('p_a_s', 'no', 1);
                callback(false);
            }
        };
        video.load();
        var playPromise = video.play();
        playPromise.catch(function(error) {});
    };

    PowrVideo.prototype.videoEnd = function (data) {
        var response = {};
        response['flag'] = data.flag;
        response['id'] = data.id;
        data.source.postMessage(JSON.stringify(response), data.origin);
    };

    PowrVideo.prototype.receiveMessage = function (event) {
        try {
            var seperator = "###";
            if (event != null && event.data != null && (typeof event.data === 'string' || event.data instanceof String) && event.data.indexOf(seperator) !== -1) {
                var response = {};
                var data = event.data.split(seperator);
                var player = this.player;

                if (data[0] === "play") {
                    var playPromise = player.play();
                    playPromise.catch(function(error) {});
                    response['msg'] = "playing";
                } else if (data[0] === "pause") {
                    player.pause();
                    response['msg'] = "paused";
                } else if (data[0] === "update") {
                    response['duration'] = player.currentTime();
                } else if (data[0] === "duration") {
                    response['duration'] = player.currentTime();
                } else if (data[0] === "ping") {
                    response['msg'] = "OK!";
                } else if (data[0] === "listen" && data.length == 3) {
                    this.adListeners.push({
                        "flag": data[0],
                        "id": data[1],
                        "listenerId": data[2],
                        "source": event.source,
                        "origin": event.origin
                    });
                    response['msg'] = "OK!";
                } else if (data[0] === "adtype") {
                    this.adtype = data[2];
                    response['msg'] = "updated adtype: " + data[2];
                } else if (data[0] === "get_adtype") {
                    response['msg'] = this.adtype;
                } else if (data[0] === "end") {
                    player.on('ended', this.videoEnd.bind(this, {
                        "flag": "video_ended",
                        "id": data[1],
                        "source": event.source,
                        "origin": event.origin
                    }));
                    response['msg'] = "added video end listener";
                } else if (data[0] === "player_ready") {
                    response['msg'] = this.player_ready++;
                }

                response['flag'] = data[0];
                response['id'] = data[1];
                event.source.postMessage(JSON.stringify(response), event.origin);
            }
        } catch (e) {
            this.log(e, event);
        }
    };

    PowrVideo.prototype.getVideoFromResolution = function (video) {
        var url = video.sd_url;
        if (this.mobile && video.mobile_url != null) {
            url = video.mobile_url;
        } else if (this.config.resolution != null) {
            switch (this.config.resolution) {
                case "hd": {
                    url = video.hd_url;
                    break;
                }
                case "mobile": {
                    if (video.mobile_url != null) url = video.mobile_url;
                    break;
                }
                case "sd":
                default: {
                    url = video.sd_url;
                }
            }
        }
        return url;
    }

    PowrVideo.setCookie = function (cname, cvalue, exminutes) {
        var d = new Date();
        d.setTime(d.getTime() + (exminutes * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        var cpath = "; path=/; domain=" + top.location.host;
        document.cookie = cname + "=" + cvalue + "; " + expires + cpath;
    };

    PowrVideo.prototype.log = function () {
        if ((typeof console) != "undefined") console.log(arguments);
    };

    PowrVideo.prototype.showCrossButton = function (close_id) {
        var closeButton = document.getElementById(close_id);
        closeButton.classList.remove('powr_close_hide');
    };

    PowrVideo.prototype.animateShow = (function (playerInstance) {
        var animationEnd = (function(el) {
            var animations = {
                animation: 'animationend',
                OAnimation: 'oAnimationEnd',
                MozAnimation: 'mozAnimationEnd',
                WebkitAnimation: 'webkitAnimationEnd'
            };

            for (var t in animations) {
                if (el.style[t] !== undefined) {
                    return animations[t];
                }
            }
        })(document.createElement('div'));
        powrUtils.removeClass(this.element, "showhide");
        if (window.location.href.indexOf("powrtest=1") > 0) {
            if (this.config.pub_id == 100010295) {
                parent.document.getElementById("ad-outstream").style.height = "";
                parent.document.getElementById("ad-outstream").style.width = "";
                parent.document.getElementById(frameElement.id).width = this.config.width;
                parent.document.getElementById(frameElement.id).height = this.config.width * 0.5625;
            }
        }

        if (this.config.pub_id == 98997 || window.location.href.indexOf("overlay=1") > 0) {
            document.getElementsByClassName("powr_player")[0].style.position = "absolute";
            document.getElementsByClassName("powr_player")[0].style.zIndex = "9999999";
            document.getElementsByClassName("powr_player")[0].style.top = "50%";
            document.getElementsByClassName("powr_player")[0].style.transform = "translate(0%, -50%)";
            document.getElementsByClassName("rc-modal-shade")[0].style.background = "rgba(0,0,0,.85)";
            document.getElementsByClassName('rc-modal-shade')[0].style.height = '97%';
            document.getElementsByClassName('rc-modal-shade')[0].style.display = 'block';
        }

        this.element.parentNode.classList.add("animated", "zoomIn");
        this.element.addEventListener(animationEnd, function(e) {
            e.target.removeEventListener(e.type, arguments.callee);

        });
    });

    PowrVideo.prototype.animateDispose = (function (playerInstance, elementId) {
        if (this.disposed == true) {
            return;
        }

        this.disposed = true;
        var that = this;
        var animationEnd = (function(el) {
            var animations = {
                animation: 'animationend',
                OAnimation: 'oAnimationEnd',
                MozAnimation: 'mozAnimationEnd',
                WebkitAnimation: 'webkitAnimationEnd'
            };

            for (var t in animations) {
                if (el.style[t] !== undefined) {
                    return animations[t];
                }
            }
        })(document.createElement('div'));

        this.element.parentNode.classList.add("animated", "zoomOut");
        this.element.classList.add("animated", "zoomOut");
        this.element.parentNode.addEventListener(animationEnd, function(e) {
            e.target.removeEventListener(e.type, arguments.callee);
            elementId.setAttribute("style", "width: 0px; height : 0px; position : relative;");
            playerInstance.dispose();
            elementId.parentNode.removeChild(elementId);
            if (that.config.pub_id == 98997 || window.location.href.indexOf("overlay=1") > 0) {
                document.getElementsByClassName("powr_player")[0].style.display = "none";
                document.getElementsByClassName('rc-modal-shade')[0].style.display = 'none';
                document.getElementsByClassName("rc-modal-shade")[0].style.background = "rgba(0,0,0,.5)";
                document.getElementsByClassName('rc-modal-shade')[0].style.height = '100%';
            }
        });
	});
    return PowrVideo;
}));
