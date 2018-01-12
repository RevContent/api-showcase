/*
 Project: PowrApi
 Version: 1
 Author: deepak@revcontent.com
 */

 // universal module definition
( function( window, factory ) {
  // browser global
  window.PowrApi = factory(window, window.revUtils, window.revApi);
}( window, function factory(window, revUtils, revApi) {

  /**
   * id : id of the iframe to attach.
   */
  var PowrApi = function(config) {
      this.config = config;
      this.seperator = "###";
      this.element = document.getElementById(this.config.iframe_id);
      this.window = this.element.contentWindow || this.element;
      this.config.id = this.config.iframe_id + Date.now();

      this.visibleListener = null;
      this.callbackFunctions = {};
      this.adListeners = Array();
      this.endListeners = Array();

      this.init();
  };

  PowrApi.prototype.init = function() {
    window.addEventListener("message" , this.processMessage.bind(this), false);
  }

  PowrApi.prototype.ping = function() {
    this.window.postMessage("ping" + this.seperator + this.config.id, this.element.src);
  }

  PowrApi.prototype.log = function() {
    if ((typeof console) != "undefined") console.log(arguments);
  };

  PowrApi.prototype.playerState = function(play) {
    if(play) {
      this.window.postMessage("play" + this.seperator + this.config.id, this.element.src);
    } else {
      this.window.postMessage("pause" + this.seperator + this.config.id, this.element.src);
    }
  }

  PowrApi.prototype.duration = function(callback) {
    if(!this.callbackFunctions.hasOwnProperty("duration")) {
      this.callbackFunctions["duration"] = Array();
    }
    this.callbackFunctions["duration"].push(callback);
    this.window.postMessage("duration" + this.seperator + this.config.id, this.element.src);
  }

  PowrApi.prototype.requestUpdates = function (callback) {
    setInterval(function(me) {
      me.callbackFunctions["update"] = callback;
      me.window.postMessage("update" + me.seperator + me.config.id, me.element.src);
    }, 5000, this);
  }

  PowrApi.prototype.adListener = function() {
    var listenerId = "listener_" + Date.now();
    this.adListeners.push(listenerId)
    this.window.postMessage("listen" + this.seperator + this.config.id + this.seperator + listenerId, this.element.src);
  }

  PowrApi.prototype.setVideoAutoplayOnFocus = function (play_on_focus) {
    if(play_on_focus && this.visibleListener == null) {
      var element = document.getElementsByClassName("powr_embed");
      if(element.length > 0) {
        this.visibleListener = this.checkVisible.bind(this, element[0], this.playerState);
        revUtils.addEventListener(window.parent, 'scroll', this.visibleListener);
      }
      this.log("added onfocus video autoplay listener");
    } else if(this.visibleListener != null) {
      revUtils.removeEventListener(window.parent, 'scroll', this.visibleListener);
      this.visibleListener = null;
      this.log("removed onfocus video autoplay listeners");
    }
  }

  PowrApi.prototype.checkVisible = function(element, callback, percentVisible, buffer) {
    // what percentage of the element should be visible
    var visibleHeightMultiplier = (typeof percentVisible === 'number') ? (parseInt(percentVisible) * .01) : 0;
    // fire if within buffer
    var bufferPixels = (typeof buffer === 'number') ? buffer : 0;

    var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    var elementTop = element.getBoundingClientRect().top;
    var elementBottom = element.getBoundingClientRect().bottom;
    var elementVisibleHeight = element.offsetHeight * visibleHeightMultiplier;

    if ((scroll + windowHeight >= (elementTop + scroll + elementVisibleHeight - bufferPixels)) &&
        elementBottom > elementVisibleHeight) {
        callback.call(this, true);
    } else {
        callback.call(this, false);
    }
  }

  PowrApi.prototype.setAdType = function(adtype) {
    this.window.postMessage("adtype" + this.seperator + this.config.id + this.seperator + adtype, this.element.src);
  }

  PowrApi.prototype.getAdType = function(adtype) {
    this.window.postMessage("get_adtype" + this.seperator + this.config.id, this.element.src);
  }

  PowrApi.prototype.endListener = function(func) {
    this.endListeners.push(func);
    if(this.endListeners.length == 1) {
      this.window.postMessage("end" + this.seperator + this.config.id, this.element.src);
    }
  }

  PowrApi.prototype.processMessage = function(e) {
    try {
      var data = JSON.parse(e.data);
      if(data.hasOwnProperty("id") && data.id === this.config.id && data.hasOwnProperty("flag")) {
        if(data.flag === "update" && this.callbackFunctions.hasOwnProperty("update")) {
          this.callbackFunctions["update"](data);
        } else if(data.flag === "duration" && this.callbackFunctions.hasOwnProperty("duration") && this.callbackFunctions["duration"].length > 0) {
          this.callbackFunctions["duration"].shift()(data);
        } else if(data.flag === "listen" && this.adListeners.length > 0 && data.hasOwnProperty("listenerId") && data.hasOwnProperty("msg") && data.msg === "ad_shown") {
          var index = this.adListeners.indexOf(data.listenerId);
          if(index != -1) {
            document.cookie = "tduration=0;path=/;expires=" + Number.MAX_SAFE_INTEGER;
            this.setAdType(-1);
          }
        } else if(data.flag === "ping") {
          this.log(data.msg);
        } else if(data.flag === "video_ended") {
          for (var index in this.endListeners) {
            this.endListeners[index]();
          }
        } else if(data.flag === "adtype") {
          this.log(data.msg);
        } else if(data.flag === "get_adtype") {
          this.log("adtype: " + data.msg);
        } else if(data.flag === "end") {
          this.log(data.msg);
        }
      }
    } catch (e) {
      return;
    }
  }

  return PowrApi;
}));
