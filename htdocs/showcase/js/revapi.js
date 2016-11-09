/**
 * Revcontent detect
 */

( function( window, factory) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition
    // browser global
    window.revApi = factory(
      window,
      window.revBeacon
    );

}( window, function factory( window, revBeacon ) {

'use strict';

var api = {};
api.beacons = revBeacon || {attach: function(){}};

api.forceJSONP = true;

api.request = function(url, success, failure, JSONPCallback) {

    if (this.forceJSONP || window.XDomainRequest) {
        JSONPCallback = JSONPCallback ? JSONPCallback : ('success' + this.getTimestamp());
        window[JSONPCallback] = success;
        var script = document.createElement('script');
        script.src = url + this.getReferer() + '&callback=' + JSONPCallback;
        document.body.appendChild(script);
    } else {
        var request = new XMLHttpRequest();

        request.open('GET', url + this.getReferer(), true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                try {
                    success(JSON.parse(request.responseText));
                } catch(e) { }
            } else if(failure) {
                failure(request);
            }
        };

        request.onerror = function() {
            if (failure) {
                failure(request);
            }
        };

        request.send();
    }
};

api.getReferer = function() {
    var referer = "";
    try { // from standard widget
        referer = document.referrer;
        if ("undefined" == typeof referer) {
            throw "undefined";
        }
    } catch(e) {
        referer = document.location.href, (""==referer||"undefined"==typeof referer)&&(referer=document.URL);
    }
    referer = encodeURIComponent(referer.substr(0,700));
    return '&referer=' + referer;
};

api.getTimestamp = function() {
    var time = Date.now || function() {
      return +new Date;
    };

    return time();
};

// -----  ----- //
return api;

}));