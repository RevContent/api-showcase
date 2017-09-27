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
    /**
     * id : id of the div to attach.
     * tag : tag to use.
     * dfp : true/false
     * custom_logo : 
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
     */
    var PowrVideo = function(config) {
        this.config = config;

	this.mobile = false;
        if (navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/Android/i)) {
	    this.mobile = true;
        }
	
	this.floatSettings = this.createFloatSettings();
	this.iframeSettings = this.createIframeSettings();
	this.autoplaySettings = this.createAutoplaySettings();
	this.controlSettings = this.createControlSettings();
	
        this.element = document.getElementById(this.config.id);
	
        this.playerId = "content_video";
        if (config.playerId) {
            this.playerId = config.playerId;
        }
        this.viewed = false;
        this.playerWidth = this.element.clientWidth;
	if (this.config.fluid) {
            this.playerHeight = this.element.clientHeight;
	} else {
	    this.playerHeight = 0.5625 * this.playerWidth;
	}

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
	if (this.config.dfp) {
            return "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=" + this.config.tag + "&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1"
		+ "&cust_params=p_width%3D" + parseInt(this.playerWidth) + "%26p_height%3D" + parseInt(this.playerHeight)
		+ "&description_url=" + encodeURI("http://alpha.powr.com/video/" + videoId);
	} else {
	    var tag = this.config.tag;
	    tag = tag.replace("REFERRER_URL", encodeURI(window.location.href));
	    tag = tag.replace("P_WIDTH", "" + parseInt(this.playerWidth));
	    tag = tag.replace("P_HEIGHT", "" + parseInt(this.playerHeight));
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

    PowrVideo.prototype.onResize = function() {
	var width = this.element.clientWidth;
        var height = parseInt(0.5625 * width);
	
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
	    if (this.floated) {
		this.floated = false;
		this.floatPlayer();
	    }
	}
	if (this.player) {
	    var x = this.player.width()/2 - 64;
	    var y = this.player.height()/2 - 64;

	    var playDom = this.playOverlay.contentEl();
	    var pauseDom = this.pauseOverlay.contentEl();
	    playDom.setAttribute("style", "left : " + x + "px; bottom : " + y + "px; top : auto;");
	    pauseDom.setAttribute("style", "left : " + x + "px; bottom : " + y + "px; top : auto;"); 
	}
    }

    PowrVideo.prototype.setup = function () {

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
        dumbPlayer.setAttribute("controls", "" + (this.controlSettings.type == 'default'));
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
        //
        //this.player.logobrand({
          //  image : this.config.custom_logo,
          //  destination : "http://alpha.powr.com/"
        //});

        var me = this;

	// If we are autoplaying a muted version, let's toggle audio on first click
        this.player.ready(this.onReady.bind(this));
    };

    PowrVideo.prototype.onReady = function() {
	var me = this;
	
	this.player.controls((this.controlSettings.type == "default"));
	this.player.enableTouchActivity();
	
	// Setup overlays
        this.setupOverlays();

	// Manually invoke resize so it sts up play/apuse buttons.
	this.onResize();
	
	if (this.controlSettings.type == "custom") {
	    if (this.autoplaySettings.autoplay) {
		this.pauseOverlay.show();
	    } else {
		this.playOverlay.show();
	    }
	} 
	
        this.player.on('timeupdate', this.onUpdate.bind(this));
	
        this.player.on('play', this.onPlay.bind(this));
        this.player.on('pause', this.onPause.bind(this));
        this.player.on('useractive', this.onActive.bind(this));
        this.player.on('userinactive', this.onIdle.bind(this));
	this.player.on('loadedmetadata', this.onMetadataLoaded.bind(this));
	if (this.mobile) {
	    this.player.on('touchstart', this.onTouchStart.bind(this));
	    this.player.on('touchmove', this.onTouchMove.bind(this));
	    this.player.on('touchend', this.onTouchEnd.bind(this));
	} else {
	    this.player.on('click', this.onClick.bind(this));
	}
	
        GlobalPlayer = this;
	
        this.closeButton = this.container.querySelector(".rc-video-close");
        this.titleDom = this.container.querySelector(".rc-video-title");
	
        revUtils.addEventListener(this.closeButton, 'click', function () {
            me.floatSettings.landscape = false;//neverFloat = true;
	    me.floatSettings.portrait = false;
	    
            me.player.pause();
            me.unfloatPlayer();
        });
	
	if (me.autoplaySettings.autoplay) {
	    this.player.bigPlayButton.hide();
	    this.player.loadingSpinner.lockShowing();
	    this.start(true);
	} else {
	    me.player.one('click', function() {
		me.start(true);
	    });
	}
	/*
          if (!me.autoplaySettings.) {
          me.player.one('click', function () {
          me.player.play();
          });
          }
	*/
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
        this.player.ima(this.options, this.bind(this, this.adsManagerLoadedCallback));
        this.player.ima.initializeAdDisplayContainer();
        this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), playOnLoad);
	if (!this.autoplaySettings.autoplay) {
            this.player.poster(this.videos[this.currentContent].thumbnail);
	}

        this.player.ima.requestAds();

        var me = this;
        this.player.ima.addContentEndedListener(function () {
            me.loadNextVideo();
        });
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
            this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), true);
            // this.player.poster(this.videos[this.currentContent].thumbnail);
            var titleContent = this.videos[this.currentContent].title;
            // this.player.overlays_[0].contentEl().innerHTML = titleContent;
            this.titleDom.innerHTML = titleContent;
            this.player.ima.requestAds();
        } else {
            this.currentContent--;
        }
    };

    PowrVideo.prototype.attachVisibleListener = function() {
        revUtils.addEventListener(window, 'scroll', this.checkVisible.bind(this));
        this.checkVisible();
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

        if (this.orientation == 'portrait') {
            styleString += "top : 0px;";
            styleString += "left : 0px; right : 0px; width : 100%; height : 176px;";
            this.player.fluid(false);
            this.player.dimensions(windowWidth, 176);

            // this.closeButton.setAttribute("style", "margin-top : 166px; margin-left : " + (windowWidth - 60) + "px");
            this.closeButton.setAttribute("style", "margin-top : 0px; margin-left : " + (windowWidth - 50) + "px");

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
            styleString += "width : " + w + "px;";
	    
            var h = parseInt(0.5625 * w);
            if (fs.landscape_style.startsWith("top")) {
                this.closeButton.setAttribute("style", "margin-top : " + (h - 10) + "px;");            } else {
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

		if (elementTop + that.playerHeight < 0) {
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
        this.player.ima.addEventListener(google.ima.AdEvent.Type.STARTED, function () {
            me.player.removeClass('vjs-ad-loading');
	    me.player.loadingSpinner.unlockShowing();
        });
        this.player.ima.startFromReadyCallback();
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
		content : "<img src='./img/play-orange.png'>",
		showBackground : false,
		class : "rc-play-button"
	    }, {
		start : "custom1",
		end : "custom2",
		content : "<img src='./img/pause-orange.png'>",
		showBackground : false,
		class : "rc-play-button"
	    }, {
		start : "custom1",
		end : "custom2",
		content : "<img src='./img/volume-on.png'>",
		showBackground : false,
		class : "rc-volume-button",
		align : "bottom-right"
	    }]
        });
	
	this.titleOverlay = this.player.overlays_[0];
	this.playOverlay = this.player.overlays_[1];
	this.pauseOverlay = this.player.overlays_[2];
	this.volumeOverlay = this.player.overlays_[3];
	this.titleOverlay.show();
	this.playOverlay.hide();
	this.pauseOverlay.hide();
	this.volumeOverlay.hide();
	
	var ce = 'click';
	if (this.mobile) ce = 'touchend';

	revUtils.addEventListener(this.playOverlay.contentEl(), ce, this.onCustomPlay.bind(this));
	revUtils.addEventListener(this.pauseOverlay.contentEl(), ce, this.onCustomPause.bind(this));
    };

    PowrVideo.prototype.bind = function(thisObj, fn, argument) {
        return function() {
            fn.apply(thisObj, [argument]);
        };
    };

    PowrVideo.prototype.onMetadataLoaded = function() {
	this.player.loadingSpinner.unlockShowing();
    };

    PowrVideo.prototype.onTouchStart = function() {
	this.dragging = false;
    };
    PowrVideo.prototype.onTouchMove = function() {
	this.dragging = true;
    };
    PowrVideo.prototype.onTouchEnd = function() {
	if (this.dragging) return;
	this.onClick();
    };
    
    PowrVideo.prototype.onClick = function() {
	if (this.autoplaySettings.autoplay && this.player.muted()) {
	    this.player.muted(false);
	    return;
	}

	// If floated player, let's make sure we first 
	if (this.floated) {
	    if (!this.player.paused() && !this.player.userActive()) {
		this.player.reportUserActivity();
		return;
	    }
	}
	
	if (this.controlSettings.type == "default")
	    return;
	
	if (this.controlSettings.type == "none") {
	    if (this.player.paused()) {
		this.player.play();
	    } else {
		this.player.pause();
	    }
	} else if (this.controlSettings.type == "custom") {
	    if (this.player.paused()) {
		this.playOverlay.show();
		this.pauseOverlay.hide();
	    } else {
		this.playOverlay.hide();
		this.pauseOverlay.show();
	    }
	}
    };

    PowrVideo.prototype.onCustomPlay = function() {
	this.player.play();
	this.playOverlay.hide();
	this.pauseOverlay.hide();
    };

    PowrVideo.prototype.onCustomPause = function() {
	this.player.pause();
	this.pauseOverlay.hide();
	this.playOverlay.show();
    };
    
    PowrVideo.prototype.onPlay = function() {
	if (this.controlSettings.type == "custom") {
	    this.pauseOverlay.hide();
	    this.playOverlay.hide();
	}
    };

    PowrVideo.prototype.onPause = function() {
	this.titleOverlay.show();
	if (this.controlSettings.type == "custom") {
	    this.playOverlay.show();
	    this.pauseOverlay.hide();
	}

    };

    PowrVideo.prototype.onActive = function() {
	this.titleOverlay.show();
    };

    PowrVideo.prototype.onIdle = function() {
        if (!this.player.paused()) {
	    this.titleOverlay.hide();
	    this.playOverlay.hide();
	    this.pauseOverlay.hide();
        }
    };

    PowrVideo.prototype.createFloatSettings = function() {
	var c = this.config;
	var ret = {
	    "landscape" : false,
	    "portrait" : false,
	    "min_width" : 400,
	    "max_width" : 400
	};
	if (!c.float) return ret;
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

    PowrVideo.prototype.createControlSettings = function() {
	var c = this.config;
	if (typeof c.controls == "undefined")
	    c.controls = "default";
	if (typeof c.controls == "string") {
	    if (c.controls == "default") {
		if (this.mobile) {
		    return {
			type : "custom"
		    };
		} else {
		    return {
			type : "default"
		    };
		}
	    } else {
		return { type : c.controls };
	    }
	} else {
	    if (this.mobile) return { type : c.mobile };
	    else return { type : c.desktop };
	}
	return ret;
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
		ret.audio = !this.mobile;
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
    
    return PowrVideo;
}));
