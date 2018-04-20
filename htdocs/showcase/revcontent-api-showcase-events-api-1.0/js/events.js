/*
 Project: PowrVideo
 Version: 1
 Author: harsh@revcontent.com
 */
// universal module definition

var API_KEY = null;

(function (window) {
  window.rceInit = function(apiKey) {
    API_KEY = apiKey;
  }

  window.rceTrack = function(eventName, props) {
    alert("Tracking event " + eventName + " with api key " + API_KEY);
  }

}( window ));
