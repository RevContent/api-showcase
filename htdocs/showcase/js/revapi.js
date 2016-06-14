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
api.locationSearch = true;

api.request = function(url, success, failure) {

    var request = new XMLHttpRequest();

    request.open('GET', url + api.extractLocationSearch(), true);

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
};

api.extractLocationSearch = function(){
    var self = this;    
    var restrictedUrlKeys = ["api_key", "pub_id", "widget_id", "domain", "sponsored_count", "internal_count", "img_h", "img_w", "api_source"];
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

    return ((true === self.locationSearch && self.extraPayload.length > 0) ? self.extraPayload.join('&') : '');
};

// -----  ----- //
return api;

}));