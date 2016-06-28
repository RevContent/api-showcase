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
        script.src = url + api.extractLocationSearch(url) + '&callback=' + JSONPCallback;
        document.body.appendChild(script);
    } else {
        var request = new XMLHttpRequest();

        request.open('GET', url + api.extractLocationSearch(url), true);

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

api.getTimestamp = function() {
    var time = Date.now || function() {
      return +new Date;
    };

    return time();
};

api.extractLocationSearch = function(url) {
    var restrictedUrlKeys = [
        "api_key",
        "pub_id",
        "widget_id",
        "domain",
        "sponsored_count",
        "internal_count",
        "img_h",
        "img_w",
        "api_source"
    ];
    var self = this;
    var queryPrefix = (url.indexOf('?') == -1 ? '?' : '&');
    self.extraPayload = [];
    self.searchQuery = top.location.search.split('?')[1];
    if(self.searchQuery !== undefined && self.searchQuery.length > 0) {
        self.searchPairs = self.searchQuery.split('&');
        for (var i = 0; i < self.searchPairs.length; i++) {
            var parameterPair = self.searchPairs[i].split('=');
            if(restrictedUrlKeys.indexOf(parameterPair[0]) == -1) {
                self.extraPayload.push(parameterPair[0] + '=' + parameterPair[1]);
            }
        }
    }

    return (self.extraPayload.length > 0 ? queryPrefix + self.extraPayload.join('&') : '');
};

// -----  ----- //
return api;

}));