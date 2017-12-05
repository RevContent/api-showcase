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
    this.callbackFunction = callback;
    this.window.postMessage("duration", this.element.src);
  }

  PowrApi.prototype.requestUpdates = function (callback) {
    setInterval(function(me) {
      me.callbackFunction = callback;
      me.window.postMessage("duration", me.element.src);
    }, 5000, this);
  }

  PowrApi.prototype.processMessage = function(e) {
    if(this.callbackFunction != null) {
      var data = JSON.parse(e.data);
      if(data.iframe_id === this.config.id) {
        this.callbackFunction(data);
      }
    }
  };

  return PowrApi;
}));
