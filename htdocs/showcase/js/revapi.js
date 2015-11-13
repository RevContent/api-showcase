/**
 * Revcontent detect
 */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition
    // browser global
    window.revApi = factory(
      window
    );

}( window, function factory( window ) {

'use strict';

var api = {};

api.request = function(url, success, failure) {

    var request = new XMLHttpRequest();

    request.open('GET', url, true);

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

// -----  ----- //
return api;

}));