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
      this.callbackFunction = null;
  };

  PowrApi.prototype.ping = function() {
    this.window.postMessage("ping", this.element.src);
  }

  PowrApi.prototype.play = function() {
    this.window.postMessage("play", this.element.src);
  }

  PowrApi.prototype.pause = function() {
    this.window.postMessage("pause", this.element.src);
  }

  PowrApi.prototype.duration = function(callback) {
    this.window.postMessage("duration", this.element.src);
    if(this.callbackFunction != null) {
      window.removeEventListener("message", this.callbackFunction, false);
    }
    this.callbackFunction = callback;
    window.addEventListener("message", callback, false);

  }

  PowrApi.prototype.requestUpdates = function (callback) {
    setInterval(function(window, src) {
      window.postMessage("duration", src);
    }, 5000, this.window, this.element.src);
    
    if(this.callbackFunction != null) {
      window.removeEventListener("message", this.callbackFunction, false);
    }
    this.callbackFunction = callback;
    window.addEventListener("message", callback, false);
  }

  PowrApi.prototype.log = function() {
    if ((typeof console) != "undefined") console.log(arguments);
  };

  return PowrApi;
}));
