/*
 Project: PowrVideo
 Version: 1
 Author: harsh@revcontent.com
 */

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

// universal module definition
( function( window, factory ) {
    // browser global
    window.PowrVideo = factory(window, window.revUtils, window.revApi);

}( window, function factory(window, revUtils, revApi) {

    var PowrInitialized = false;
    /**
     * id : id of the div to attach.
     * tag : tag to use.
     * dfp : true/false
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
     * iframe_id : "id" // Incase we are inside an iframe. 
     * player_id : id to give the player we creating. 
     * controls : "custom"
     * float_conflicts : [ "" ]
     * permanent_close : true
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
	
	this.floatSettings = this.createFloatSettings();
	this.iframeSettings = this.createIframeSettings();
	this.autoplaySettings = this.createAutoplaySettings();
	
	this.floatConflicts = {
	    "top" : [],
	    "bottom" : []
	};
	if (this.config.float_conflicts) {
	    this.floatConflicts = this.config.float_conflicts;
	}
	
        this.element = document.getElementById(this.config.id);
	
        this.playerId = "content_video";
        if (config.playerId) {
            this.playerId = config.playerId;
        }
        this.viewed = false;
        var w = this.element.clientWidth;
	var h = this.element.clientHeight;
	if (!this.config.fluid) {
	    h = 0.5625 * w;
	}
	
	this.element.setAttribute("style", "width: 100%; height : " + parseInt(h) + "px; background-color : #EFEFEF;");
	
        this.videos = config.videos;
        this.currentContent = 0;
	
        this.options = {
            id : this.playerId,
            nativeControlForTouch: false,
	    adWillAutoPlay : this.autoplaySettings.autoplay
        };

        if (config.hasOwnProperty('preloaded') && config.preloaded) {
            this.setup();
        } else {
            this.init();
        }
    };

    PowrVideo.prototype.getAdTag = function(videoId) {
	if (this.config.dfp) {
            return "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=" + this.config.tag + "&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1"
		+ "&cust_params=p_width%3D" + parseInt(this.getPlayerWidth()) + "%26p_height%3D" + parseInt(this.getPlayerHeight())
		+ "&description_url=" + encodeURI("http://www.powr.com/video/" + videoId);
	} else {
	    var tag = this.config.tag;
	    tag = tag.replace("REFERRER_URL", encodeURI(window.location.href));
	    tag = tag.replace("P_WIDTH", "" + parseInt(this.getPlayerWidth()));
	    tag = tag.replace("P_HEIGHT", "" + parseInt(this.getPlayerHeight()));
	    tag = tag.replace("CACHE_BUSTER", "" + new Date().getTime());
	    return tag;
	}
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
    };

    PowrVideo.prototype.onResize = function(shouldFloat) {
	var width = this.element.clientWidth;
        var height = parseInt(0.5625 * width);
	if (this.config.fluid) {
	    height = this.element.clientHeight;
	}
	if (this.player && !this.floated) {
	    this.player.dimensions(width, height);
	}
        this.element.setAttribute("style", "width : 100%; height : " + height + "px; background-color : #EFEFEF");
	
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
	google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.INSECURE);

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
                google.ima.AdEvent.Type.THIRD_QUARTILE];
	
	google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true);
	
        this.container = document.createElement("div");
        this.container.className = 'powr_player';
        this.element.appendChild(this.container);

        this.attachVisibleListener();
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
	if (!this.autoplaySettings.autoplay) {
            dumbPlayer.setAttribute("poster", this.videos[0].thumbnail);
	}
        dumbPlayer.setAttribute("playsinline", "true");

        if (this.autoplaySettings.autoplay && !this.autoplaySettings.audio) {
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
	    image : "http://media.powr.com/powr_logo.png",
	    destination : "http://www.powr.com/" + (this.config.username ? this.config.username : "")
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
	    this.volumeOffOverlay.show();
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
	    this.playOverlay.hide();
	    this.player.loadingSpinner.lockShowing();
	    this.start(true);
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
        this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), playOnLoad);
	if (!this.autoplaySettings.autoplay) {
            this.player.poster(this.videos[this.currentContent].thumbnail);
	}
	
        this.player.ima.requestAds();
	
        var me = this;
        // this.player.ima.addContentEndedListener(function () {
        //    me.loadNextVideo();
        //});
    };

    PowrVideo.prototype.loadNextVideoWithTick = function() {
	if (this.player.ads.isInAdMode()) {
	    return;
	}
	var me = this;
	setTimeout(function() {
	    me.loadNextVideo();
	}, 100);
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
	    if (!this.autoplaySettings.audio) {
		// this.player.muted(true);
	    }
	    
	    this.player.ima.initializeAdDisplayContainer();
            this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), false);
            var titleContent = this.videos[this.currentContent].title;
            this.titleDom.innerHTML = titleContent;
	    var me = this;
	    me.player.ima.requestAds();
	    me.player.play();
        } else {
            this.currentContent--;
        }
    };

    PowrVideo.prototype.attachVisibleListener = function() {
	if (!this.iframeSettings.iframe) {
            // revUtils.addEventListener(window.parent, 'scroll', this.checkVisible.bind(this));
	    //} else {
	    revUtils.addEventListener(window, 'scroll', this.checkVisible.bind(this));
	    this.checkVisible();
	}
        // revUtils.addEventListener(window, 'scroll', this.checkVisible.bind(this));
    };

    PowrVideo.prototype.floatPlayer = function() {
        if (this.floated)
            return;
        if (this.orientation == "portrait" && !this.floatSettings.portrait)
            return;
	if (this.orientation == "landscape" && !this.floatSettings.landscape)
	    return;
	
        this.container.className = "rc-float-video powr_player";
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
            if (fs.landscape_style.startsWith("top")) {
                styleString += "top : 0px;";
            } else {
                styleString += "bottom : 0px;";
            }

            if (fs.landscape_style.endsWith("right")) {
                styleString += "right : 0px;";
            } else {
                styleString += "left : 0px;";
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
	    
            if (fs.landscape_style.startsWith("top")) {
                this.closeButton.setAttribute("style", "margin-top : " + (h - 10) + "px;");            } else {
                this.closeButton.setAttribute("style", "margin-left : " + (w - 100) + "px; margin-top : -30px;");
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

    
    PowrVideo.prototype.unfloatPlayer = function() {
        if (this.floated) {
            this.container.className = 'powr_player';
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
	    var ifs = that.iframeSettings;
	    if (ifs.true) {
		var element = window.parent.document.getElementById(ifs.id);
		var windowHeight = window.parent.innerHeight || window.parent.document.documentElement.clientHeight || window.parent.document.body.clientHeight;
		var elementHeight = element.getBoundingClientRect().height;
		var elementTop = element.getBoundingClientRect().top;
		var currentScroll = window.parent.pageYOffset || window.parent.document.documentElement.scrollTop || window.parent.document.body.scrollTop; 
		
		if (elementTop + elementHeight < 0) {
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
		
	    } else {
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
	    }
        });
    };

    PowrVideo.prototype.onVisible = function() {
	this.registerView();
	this.unfloatPlayer();
    };

    PowrVideo.prototype.onHidden = function() {
	this.floatPlayer();
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
	var titleContent = "<a class='rc-video-close' href='javascript:void(0)' class='close'><span class='label'>CLOSE | </span>X</a>";
	if (this.config.custom_logo) {
	    titleContent += "<img src='" + this.config.custom_logo + "'>";
	}
	if (this.currentContent < this.videos.length) {
	    titleContent += "<span class='rc-video-title'>" + this.videos[this.currentContent].title + "</span>";
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
	this.dragging = false;
	this.cancelEvent(e);
    };
    PowrVideo.prototype.onTouchMove = function(e) {
	this.dragging = true;
	this.cancelEvent(e);
    };
    PowrVideo.prototype.onTouchEnd = function(e) {
	if (this.dragging) return;
	this.onClick(e);
	this.cancelEvent(e);
    };

    PowrVideo.prototype.onVolumeChange = function() {
    }

    PowrVideo.prototype.onFullscreenChange = function() {
	if (!this.player.isFullscreen()) {
	    this.playOverlay.hide();
	}
    };

    
    PowrVideo.prototype.onClick = function(e) {
	if (!this.started) {
	    this.playOverlay.hide();
	    this.start(true);
	    this.cancelEvent(e);
	    return;
	}

	if (this.isClickedOnBar(e)) {
	    return;
	}

	if (this.player.muted()) {
	    this.player.muted(false);
	    this.volumeOffOverlay.hide();
	    this.cancelEvent(e);
	    return;
	}
    };
    
    PowrVideo.prototype.onPlay = function() {
	this.playOverlay.hide();
	// this.player.controlBar.volumeMenuButton.hide();

	if (this.player.muted()) {
	    this.volumeOffOverlay.show();
	}
    };

    PowrVideo.prototype.onPause = function() {
	this.titleOverlay.show();
    };

    PowrVideo.prototype.onActive = function() {
	this.titleOverlay.show();
	this.volumeOffOverlay.hide();
    };

    PowrVideo.prototype.onIdle = function() {
        if (!this.player.paused()) {
	    this.titleOverlay.hide();
	    this.playOverlay.hide();
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
		return ret;
	    }
	    if (c.autoplay == "focus") {
		ret.focus = true;
		ret.audio = false;
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

    PowrVideo.prototype.cancelEvent = function(e) {
	if (typeof e.stopPropagation != "undefined") {
	    e.stopPropagation();
	} else if (typeof e.cancelBubble != "undefined") {
	    e.cancelBubble = true;
	}
    };
    
    return PowrVideo;
}));
