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
    window.PowrVideo = factory(window, window.revUtils, window.revApi);

}( window, function factory(window, revUtils, revApi) {

    var PowrInitialized = false;
    var PowrPlayers = 0;
    /**
     * id : id of the div to attach.
     * tag : tag to use.
     * adserver : dfp | lkqd
     * custom_logo :
     * brand_logo :
     * autoplay : "none|load|focus" [ Whether to autoplay video ]
     * videos : [ { "id" , "thumbnail" , "sd_url", "hd_url" } ]
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
     * muted : "yes" or "no"
     * show_on_focus : "yes" or "no"
     * custom_css : ""
     * rc_widget_id : ""
     * url : ""
     */
    var PowrVideo = function(config) {
        this.config = config;
	this.mobile = false;
	this.safari = this.isSafari();
        if (navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/Android/i)) {
	    this.mobile = true;
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
	this.showOnFocus = "no";
	if (this.config.show_on_focus) {
	    this.showOnFocus = this.config.show_on_focus;
	}
	this.adtype = "preroll";
	if (this.config.adtype) {
	    this.adtype = this.config.adtype;
	}

	this.floatConflicts = {
	    "top" : [],
	    "bottom" : []
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
        var w = this.element.clientWidth;
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

	this.element.setAttribute("style", "width: 100%; height : " + hs + "; background-color : #EFEFEF; position : relative;");
	if (this.showOnFocus == "yes") {
	    revUtils.addClass(this.element, "powr_hidden");
	}

        this.currentContent = 0;

        this.options = {
            id : this.playerId,
            nativeControlForTouch: false,
	    prerollTimeout : 2000,
	    timeout : 10000,
	    adWillAutoPlay : this.autoplaySettings.autoplay

        };

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

    PowrVideo.prototype.getAdBreak = function(type, url, duration) {
	this.log("getAdBreak " + type + "," + url + "," + duration);
	var ret = "";
	if (type == "preroll") {
	    ret = ret + '<vmap:AdBreak timeOffset="start" breakType="linear" breakId="preroll"><vmap:AdSource id="preroll-ad-1" allowMultipleAds="false" followRedirects="true"><vmap:AdTagURI templateType="vast3">';
	}
	if (type == "midroll") {
	    var mins = duration / 60;
	    var seconds = duration - mins * 60;
	    if (seconds < 10) { seconds = "0" + seconds; }
	    if (mins < 10) { mins = "0" + mins; }
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

    PowrVideo.prototype.getAdsResponse = function(video) {
	var tag = this.getAdTag(video);
	var response = '<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">';
	if (this.adtype == 'preroll') {
	    response += this.getAdBreak('preroll', tag, 0);
	} else if (this.adtype == 'postroll') {
	    response += this.getAdBreak('postroll', tag, 0);
	} else {
	    var d = parseInt(parseFloat(this.adtype) * video.duration);
	    response += this.getAdBreak('midroll', tag, d);
	}

	response += '</vmap:VMAP>';
	return response;
    };

    PowrVideo.prototype.getAdTag = function(video) {
	var url = encodeURI(window.location.href);
	if (this.config.url) {
	    url = this.config.url;
	}
	var tag = this.config.tag;
	if (this.mobile) {
	    tag = this.config.mobile_tag;
	}
	if (this.config.adserver == "dfp") {
            var ret = "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=" + tag + "&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1"
		+ "&cust_params=p_width%3D" + parseInt(this.getPlayerWidth()) + "%26p_height%3D" + parseInt(this.getPlayerHeight())
	        + "%26secure%3D" + this.getProtocol();
	    if (this.config.url) {
		ret = ret + "%26p_url%3D" + url;
	    }
	    ret += "&description_url=" + encodeURI("http://www.powr.com/video/" + video.id);
	    return ret;
	} else if (this.config.adserver == "lkqd") {
	    var ret = "//v.lkqd.net/ad?pid=456&sid=" + tag + "&output=vastvpaid&support=html5flash&execution=any&placement=&playinit=auto&volume=100&width=" + parseInt(this.getPlayerWidth()) + "&height=" + parseInt(this.getPlayerHeight()) + "&dnt=0&pageurl=" + url + "&contentid=" + video.id + "&contenttitle=" + encodeURI(video.title) + "&contentlength=" + video.duration + "&contenturl=" + encodeURI("http://www.powr.com/video/" + video.id) + "&rnd=" + new Date().getTime();
	    return ret;
	} else if (this.config.adserver == "ss") {
	    var ret = "//vid.springserve.com/vast/" + tag + "?w=" + parseInt(this.getPlayerWidth()) + "&h=" + parseInt(this.getPlayerHeight()) + "&url=" + url + "&cb=" + new Date().getTime();
	    return ret;
	} else {
	    tag = tag.replace("REFERRER_URL", url);
	    tag = tag.replace("P_WIDTH", "" + parseInt(this.getPlayerWidth()));
	    tag = tag.replace("P_HEIGHT", "" + parseInt(this.getPlayerHeight()));
	    tag = tag.replace("CACHE_BUSTER", "" + new Date().getTime());
	    return tag;
	}
    };

    PowrVideo.prototype.getProtocol = function() {
	var ret = window.location.protocol;
	ret = ret.replace(":", "");
	return ret;
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

        var imaCss = document.createElement("link");
        imaCss.setAttribute("href", "//cdnjs.cloudflare.com/ajax/libs/videojs-ima/0.6.0/videojs.ima.css");
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

        this.adListeners = Array();
        window.addEventListener("message", this.receiveMessage.bind(this), false);
        window.parent.postMessage("player_ready", "*");
    };

    PowrVideo.prototype.onResize = function(shouldFloat) {
	var width = this.element.clientWidth;
        var height = parseInt(0.5625 * width);
	var hs = height + "px";

	if (this.config.fluid) {
	    height = this.element.clientHeight;
	    hs = "100%";
	}
	if (this.player && !this.floated) {
	    this.player.dimensions(width, height);
	}
        this.element.setAttribute("style", "width : 100%; height : " + hs + "; background-color : #EFEFEF");

        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var windowWidth = window.innerWidth|| document.documentElement.clientWidth || document.body.clientWidth;
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
	    var x = w/2 - 32;
	    var y = h/2 - 32;

	    var playDom = this.playOverlay.contentEl();
	    playDom.setAttribute("style", "left : " + x + "px; bottom : " + y + "px; top : auto;");

	}

    };


    PowrVideo.prototype.getPlayerHeight = function() {
	if (this.player) {
	    return this.player.height();
	} else {
	    return this.element.getBoundingClientRect().height;
	}
    };

    PowrVideo.prototype.getPlayerWidth = function() {
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
	revUtils.removeClass(this.element, "powr_hidden");
	// google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.INSECURE);

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

        this.container = document.createElement("div");
        this.container.className = 'powr_player';
        this.element.appendChild(this.container);

	if (this.permanentClose == "yes") {
	    this.container.className = 'powr_player powr_permanent_close';
	    this.crossButton = document.createElement("a");
	    this.crossButton.className = 'powr_perm_close';
	    // this.crossButton.style = "display : block; position : absolute; right : 5px; top : 5px; background-color : #333; z-index : 10000; border-radius : 20px; color : #FFF; padding : 4px 11px; font-weight : 700; font-size : 14px; ";
	    this.crossButton.setAttribute("href", "javascript: void(0)");
	    this.crossButton.innerHTML = "X";
	    // this.crossButton.style.display = "none";

	    this.container.appendChild(this.crossButton);

	    revUtils.addEventListener(this.crossButton, 'click', this.bind(this, this.onCrossClicked));
	}


        revUtils.addEventListener(window, 'resize', this.onResize.bind(this, true));
        this.orientation = 'none';
        this.onResize(true);

        var dumbPlayer = document.createElement('video');
        dumbPlayer.id = this.playerId;
        dumbPlayer.className = 'video-js vjs-default-skin vjs-big-play-centered vjs-fluid';
        dumbPlayer.setAttribute('width', this.getPlayerWidth() + 'px');
        dumbPlayer.setAttribute('height', this.getPlayerHeight() + 'px');
        dumbPlayer.setAttribute("controls", "true");
        dumbPlayer.setAttribute("preload", "auto");

	this.log("Setting up Video Element");
	if (!this.autoplaySettings.autoplay) {
            dumbPlayer.setAttribute("poster", this.videos[0].thumbnail);
	}
        dumbPlayer.setAttribute("playsinline", "true");

        if (this.autoplaySettings.autoplay && !this.autoplaySettings.audio) {
	    this.log("Setting player muted");
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

        this.player.logobrand({
	    image : "https://media.powr.com/rc_logo.png",
	    destination : "https://www.powr.com/" + (this.config.username ? this.config.username : "")
        });

        var me = this;

	// If we are autoplaying a muted version, let's toggle audio on first click
        this.player.ready(this.onReady.bind(this));

	// revutils.addEventListener(this.container, "touchstart",
    };

    PowrVideo.prototype.onReady = function() {
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
	this.player.on('loadeddata', function() {
	    // console.log("LOADED DATA");
	});
	this.player.on('waiting', function() {
	    // console.log("WAITING FOR DATA");
	});
	this.player.on("volumechange", this.bind(this, this.onVolumeChange));
	this.player.on('ended', this.bind(this, this.loadNextVideoWithTick));

        GlobalPlayer = this;

        this.closeButton = this.container.querySelector(".rc-video-close");
        this.titleDom = this.container.querySelector(".rc-video-title");

        revUtils.addEventListener(this.closeButton, 'click', function () {
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
		this.autoplayOnVisible = true;
		this.playOverlay.show();
	    } else {
		this.playOverlay.hide();
		this.player.loadingSpinner.lockShowing();
		this.start(true);
	    }
	} else {
	    this.playOverlay.show();
	}
    };

    PowrVideo.prototype.onUpdate = function() {
        if (this.currentContent >= this.videos.length)
            return;
	if (!this.config.hasOwnProperty("tracking_url"))
	    return;
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
	this.started = true;
        this.player.ima(this.options, this.bind(this, this.adsManagerLoadedCallback));
        this.player.ima.initializeAdDisplayContainer();
        // this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), playOnLoad);
	this.player.ima.setContentWithAdsResponse(this.videos[this.currentContent].sd_url, this.getAdsResponse(this.videos[this.currentContent]), playOnLoad)
	if (!this.autoplaySettings.autoplay) {
	    this.player.poster(this.videos[this.currentContent].thumbnail);
	}
	this.adsPlayed = 0;
        this.player.ima.requestAds();
	var me = this;
        //this.player.ima.addContentAndAdsEndedListener(function () {
	    //setTimeout(function () {
	//me.loadNextVideo();
	    //}, 100);
    //});
    };

    PowrVideo.prototype.loadNextVideoWithTick = function() {
	this.log("loadNextVideoWithTick");
	if (this.player.ads.isInAdMode()) {
	    return;
	}
	var me = this;
	setTimeout(function() {
	    me.loadNextVideo();
	}, 2000);
    };


    PowrVideo.prototype.loadNextVideo = function() {
        var video = this.videos[this.currentContent];
	if (this.config.hasOwnProperty("tracking_url")) {
            if (video.tracking['end']) {
		revApi.request(this.config.tracking_url + video.tracking['end'], function () { return ; });
		video.tracking['end'] = null;
            }
	}
        this.currentContent++;
        if (this.currentContent < this.videos.length) {
	    this.adsPlayed = 0;

	    this.player.ima.initializeAdDisplayContainer();
	    this.player.ima.setContentWithAdsResponse(this.videos[this.currentContent].sd_url, this.getAdsResponse(this.videos[this.currentContent]), false);
            // this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), false);
            var titleContent = this.videos[this.currentContent].title;
            this.titleDom.innerHTML = '<a target="_blank" href="' + this.getVideoLink(this.videos[this.currentContent]) + '">' + titleContent + "</a>";
	    this.player.ima.requestAds();
	    this.player.play();
        } else {
	    this.volumeOffOverlay.hide();
	    this.playOverlay.show();
            this.currentContent--;
        }
    };

    PowrVideo.prototype.getVideoLink = function(v) {
      var title = v.title;
      if(title.trim().length > 0) {
        title = title.toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/ /g, "-") + "-";
      }
	    return  "http://www.powr.com/video/" + title + v.id;
    };

    PowrVideo.prototype.attachVisibleListener = function() {
	if (this.visibleListenerAttached) return;
	if (this.floatSettings.landscape || this.floatSettings.portrait || this.autoplaySettings.focus || (this.showOnFocus == 'yes')) {
	    revUtils.addEventListener(window, 'scroll', this.checkVisible.bind(this));
	    this.checkVisible();
	}
	this.visibleListenerAttached = true;
    };

    PowrVideo.prototype.floatPlayer = function() {
        if (this.floated)
            return;
        if (this.orientation == "portrait" && !this.floatSettings.portrait)
            return;
	if (this.orientation == "landscape" && !this.floatSettings.landscape)
	    return;

	revUtils.addClass(document.body, 'powr_player_floating');
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
	    if (h > windowHeight/2) {
		h = windowHeight/2;
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

    PowrVideo.prototype.showConflicts = function(t) {
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

    PowrVideo.prototype.hideConflicts = function(t) {
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

    PowrVideo.prototype.getReferer = function() {
	var referer = "";
	try {
	    referer = document.referrer
	    if ("undefined" == typeof referer)
		throw "undefined"
	} catch (exception) {
	    referer = document.location.href;
	    if ("" ==referer || "undefined" == typeof referer)
		referer=document.URL;
	}
	referer=referer.substr(0,700);
	return referer;
    };

    PowrVideo.prototype.showRCAd = function(widgetId) {
	if (this.rcDiv)
	    return;
	this.rcDiv = document.createElement("div");
	revUtils.addClass(this.element, "rc_ad_showing");
	revUtils.addClass(this.rcDiv, "powr_rc_container");
	this.container.appendChild(this.rcDiv);

	var skipBtn = document.createElement("a");
	revUtils.addClass(skipBtn, "powr_skip");
	revUtils.addClass(skipBtn, "powr_disabled");
	skipBtn.innerHTML = "Loading ...";
	this.rcDiv.appendChild(skipBtn);


	var label = document.createElement("label");
	revUtils.addClass(label, "powr_by_rc");
	label.innerHTML = "Ads By Revcontent";
	this.rcDiv.appendChild(label);

	var referer = this.getReferer();

	var rcel = document.createElement("script");
	rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
	rcel.type = 'text/javascript';
	rcel.src = "https://video.powr.com/serve.js.php?w=" + widgetId + "&t="+rcel.id+"&c="+(new Date()).getTime()+"&width="+(window.outerWidth || document.documentElement.clientWidth)+"&referer="+referer;
	rcel.async = true;
	this.rcDiv.appendChild(rcel);

	this.player.pause();
	this.rcCountDownSeconds = 15;
	this.rcCountDownInterval = setInterval(this.rcAdCountdown.bind(this), 1000);
	//setTimeout(this.hideRCAd.bind(this), 5000);
    };

    PowrVideo.prototype.rcAdCountdown = function() {
	var totalPhotos = this.rcDiv.querySelectorAll(".rc-photo");
	if (totalPhotos.length == 0) return;

	this.rcCountDownSeconds--;
	if (this.rcCountDownSeconds == 10) {
	    var me = this;
	    revUtils.addEventListener(this.rcDiv, "click", function() {
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


    PowrVideo.prototype.hideRCAd = function() {
	revUtils.removeClass(this.element, "rc_ad_showing");
	this.container.removeChild(this.rcDiv);
	this.rcDiv = null;
	this.player.muted(false);
	this.player.play();
    }

    PowrVideo.prototype.unfloatPlayer = function() {
        if (this.floated) {
	    revUtils.removeClass(document.body, 'powr_player_floating');
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

    PowrVideo.prototype.orientationChanged = function() {
        if (this.floated) {
            this.floated = false;
            // refloat player if orientation has changed.
            this.floatPlayer();
        }
	this.onResize(true);
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

	    if (elementTop + that.getPlayerHeight() < 0) {
		if (that.visible) {
		    that.visible = false;
		    that.onHidden();
		}
	    } else if (elementTop + 30 < windowHeight) {
		if (!that.visible) {
		    that.visible = true;
		    that.onVisible();
		}
	    }
        });
    };

    PowrVideo.prototype.onVisible = function() {
	this.log("onVisible");
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
	} else if (this.pauseOnHidden && this.autoPaused && this.player.paused()) {
	    this.player.play();
	}

	this.registerView();
	this.unfloatPlayer();
    };

    PowrVideo.prototype.onHidden = function() {
	if (this.setupOnVisible) {
	    return;
	}
	this.floatPlayer();

	if (this.pauseOnHidden && !this.player.paused() && !this.floated) {
	    this.autoPaused = true;
	    this.player.pause();
	}

    };

    PowrVideo.prototype.adsManagerLoadedCallback = function() {
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

    PowrVideo.prototype.onAdEvent = function(event) {
	this.log("onAdEvent", event);
	if (event.type == google.ima.AdEvent.Type.LOADED) {
	    if (this.player.muted()) {
		this.player.ima.getAdsManager().setVolume(0);
	    }
	}
	if (event.type == google.ima.AdEvent.Type.STARTED) {
	    this.adsPlayed++;
      if(this.adListeners.length > 0) {
        this.adListeners.forEach(function(listener) {
          var response = {"id": listener.id, "listenerId": listener.listenerId, "flag": listener.flag, "msg": "ad_shown"};
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
	    }
	}
    };

    PowrVideo.prototype.registerView = function() {
	if (!this.config.hasOwnProperty("tracking_url"))
	    return;
        if (!this.viewed) {
            this.viewed = true;
            revApi.request(this.config.tracking_url + this.config.view_tracker, function() { return; });
        }
    };

    PowrVideo.prototype.getTitleContent = function() {
	var titleContent = "<a class='rc-video-close' href='javascript:void(0)' class='close'><span>CLOSE | </span>X</a>";
	if (this.config.custom_logo) {
	    titleContent += "<img src='" + this.config.custom_logo + "'>";
	}
	if (this.currentContent < this.videos.length) {
	    titleContent += "<span class='rc-video-title'><a target='_blank' href='" + this.getVideoLink(this.videos[this.currentContent]) + "'>" + this.videos[this.currentContent].title + "</a></span>";
	}
	return titleContent;
    };

    PowrVideo.prototype.setupOverlays = function() {

	this.player.overlay({
            showBackground: true,
            overlays: [{
		content: this.getTitleContent(),
                start: "custom1",
                end: "custom2",
		align: "top",
		class : "rc-video-overlay"
            }, {
		start : "custom1",
		end : "custom2",
		content : "",
		showBackground : false,
		class : "rc-play-button"
	    }, {
		start : "custom1",
		end : "custom2",
		content : "<div class='rc-bar'></div><div class='rc-bar'></div><div class='rc-bar'></div><div class='rc-bar'></div>",
		showBackground : false,
		class : "rc-volume-on-button",
		align : "bottom-right"
	    }, {
		start : "custom1",
		end : "custom2",
		content : "<div class='rc-bar'></div><div class='rc-bar'></div><div class='rc-bar'></div><div class='rc-bar'></div>",
		showBackground : false,
		class : "rc-volume-off-button",
		align : "bottom-right"
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

    PowrVideo.prototype.bind = function(thisObj, fn, argument) {
        return function() {
            fn.apply(thisObj, [argument]);
        };
    };

    PowrVideo.prototype.onMetadataLoaded = function() {
	this.player.loadingSpinner.unlockShowing();
    };

    PowrVideo.prototype.onTouchStart = function(e) {
	if (this.player.ima && this.player.ima.adPlaying) return;
	this.dragging = false;
	this.cancelEvent(e);
    };
    PowrVideo.prototype.onTouchMove = function(e) {
	if (this.player.ima && this.player.ima.adPlaying) return;
	this.dragging = true;
	this.cancelEvent(e);
    };
    PowrVideo.prototype.onTouchEnd = function(e) {
	if (this.player.ima && this.player.ima.adPlaying) return;
	if (this.dragging) return;
	this.onClick(e);
	this.cancelEvent(e);
    };

    PowrVideo.prototype.onVolumeChange = function() {
    }

    PowrVideo.prototype.onFullscreenChange = function() {
	this.onResize(true);
    };

    PowrVideo.prototype.onClick = function(e) {
	if (this.player.ima && this.player.ima.adPlaying) {
	    return;
	}
	if (!this.started) {
	    this.playOverlay.hide();
	    this.start(true);
	    this.cancelEvent(e);
	    return;
	}

	if (this.isClickedOnBar(e)) {
	    return;
	}

	this.player.controls(true);
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
	    this.player.play();
	    return;
	}
    };

    PowrVideo.prototype.onPlay = function() {
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

    PowrVideo.prototype.onPause = function(e) {
	this.titleOverlay.show();
    };

    PowrVideo.prototype.onActive = function() {
	this.titleOverlay.show();
	this.volumeOffOverlay.hide();
	if (this.crossButton)
	    this.crossButton.style.display = "block";
	// this.player.controlBar.show();
    };

    PowrVideo.prototype.onIdle = function() {
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

    PowrVideo.prototype.createFloatSettings = function() {
	var c = this.config;
	var ret = {
	    "landscape" : false,
	    "portrait" : false,
	    "min_width" : 400,
	    "max_width" : 480
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

    PowrVideo.prototype.createIframeSettings = function() {
	var c = this.config;
	var ret = {
	    iframe : false
	};
	if (!c.iframe_id) return ret;
	ret.iframe = true;
	ret.id = c.iframe_id;
	return ret;
    };

    PowrVideo.prototype.isClickedOnBar = function(e) {
	var t = e.target;
	if (t.nodeName.toLowerCase() == "video") {
	    return false;
	}
	if (t.className.indexOf("rc-play-button") > 0) {
	    return false;
	}
	return true;
    };

    PowrVideo.prototype.createAutoplaySettings = function() {
	var c = this.config;
	var ret = {
	    "autoplay" : false,
	    "focus" : false,
	    "audio" : false
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

    PowrVideo.prototype.isSafari = function() {
	var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
	var is_safari = navigator.userAgent.indexOf("Safari") > -1;
	if ((is_chrome)&&(is_safari)) {is_safari=false;}
	return is_safari;
    }


    PowrVideo.prototype.bind = function(thisObj, fn) {
	return function() {
	    fn.apply(thisObj, arguments);
	};
    };

    PowrVideo.prototype.onCrossClicked = function(e) {
	if (this.element.parentNode !== null) {
	    this.element.parentNode.removeChild(this.element);
	}
    };

    PowrVideo.prototype.cancelEvent = function(e) {
	if (typeof e.stopPropagation != "undefined") {
	    e.stopPropagation();
	} else if (typeof e.cancelBubble != "undefined") {
	    e.cancelBubble = true;
	}
    };

    PowrVideo.prototype.getVideoElement = function() {
	return this.element.querySelector("video");
    };

    PowrVideo.prototype.checkAutoplaySupport = function(callback) {
	if (!this.mobile) {
	    callback(true);
	    return;
	}
	// var old = revUtils.getCookie("p_a_s");
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
	video.onplay = function() {
	    this.playing = true;
	};
	// Video has loaded, check autoplay support
        video.oncanplay = function() {
	    if (video.playing) {
		// PowrVideo.setCookie('p_a_s', 'yes', 1);
		callback(true);
	    } else {
		// revUtils.setCookie('p_a_s', 'no', 1);
		callback(false);
	    }
	};
	video.load();
	video.play();
    };

  PowrVideo.prototype.receiveMessage = function(event) {
    var seperator = "###";
    if(event != null && event.data != null && event.data.indexOf(seperator) !== -1) {
      var response = {};
      var data = event.data.split(seperator);
      var player = this.player;

      if(data[0] === "play") {
        player.play();
        response['msg'] = "playing";
      } else if(data[0] === "pause") {
        player.pause();
        response['msg'] = "paused";
      } else if(data[0] === "update") {
        response['duration'] = player.currentTime();
      } else if(data[0] === "duration") {
        response['duration'] = player.currentTime();
      } else if(data[0] === "ping") {
        response['msg'] = "OK!";
      } else if(data[0] === "listen" && data.length == 3) {
        this.adListeners.push({"flag": data[0], "id": data[1], "listenerId": data[2], "source": event.source, "origin": event.origin});
        response['msg'] = "OK!";
      }

      response['flag'] = data[0];
      response['id'] = data[1];
      event.source.postMessage(JSON.stringify(response), event.origin);
    }
  };

    PowrVideo.setCookie = function(cname, cvalue, exminutes) {
	var d = new Date();
	d.setTime(d.getTime() + (exminutes*60*1000));
	var expires = "expires="+d.toUTCString();
	var cpath = "; path=/; domain=" + top.location.host;
	document.cookie = cname + "=" + cvalue + "; " + expires + cpath;
    };

    PowrVideo.prototype.log = function() {
	if ((typeof console) != "undefined") console.log(arguments);
    };

    return PowrVideo;
}));
