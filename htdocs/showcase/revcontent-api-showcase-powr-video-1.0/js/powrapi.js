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
      this.element = document.getElementById(this.config.id);
      this.window = this.element.contentWindow || this.element;
      this.callbackFunctions = {};

      this.init();
  };

  PowrApi.prototype.init = function() {
    window.addEventListener("message", this.processMessage.bind(this), false);
  }

  PowrApi.prototype.ping = function() {
    this.window.postMessage("ping", this.element.src);
  }

  PowrApi.prototype.log = function() {
    if ((typeof console) != "undefined") console.log(arguments);
  };

  PowrApi.prototype.play = function() {
    this.window.postMessage("play", this.element.src);
  }

  PowrApi.prototype.pause = function() {
    this.window.postMessage("pause", this.element.src);
  }

  PowrApi.prototype.duration = function(callback) {
    if(this.callbackFunctions.hasOwnProperty("duration")) {
      this.callbackFunctions["duration"].push(callback);
    } else {
      this.callbackFunctions["duration"] = Array();
    }
    this.callbackFunctions["duration"].push(callback);
    this.window.postMessage("duration", this.element.src);
  }

  PowrApi.prototype.requestUpdates = function (callback) {
    setInterval(function(me) {
      me.callbackFunctions["update"] = callback;
      me.window.postMessage("update", me.element.src);
    }, 5000, this);
  }

  PowrApi.prototype.processMessage = function(e) {
      var data = JSON.parse(e.data);
      if(data.hasOwnProperty("iframe_id") && data.iframe_id === this.config.id && data.hasOwnProperty("flag")) {
        if(data.flag === "update" && this.callbackFunctions.hasOwnProperty("update")) {
          this.callbackFunctions["update"](data);
        } else if(data.flag === "duration" && this.callbackFunctions.hasOwnProperty("duration") && this.callbackFunctions["duration"].length > 0) {
          this.callbackFunctions["duration"].shift()(data);
        }
      }
  }

  return PowrApi;
}));
