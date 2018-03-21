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
        JSONPCallback = JSONPCallback ? JSONPCallback : this.generateCallback();
        window[JSONPCallback] = success;
        var script = document.createElement('script');
        script.src = url + this.getReferer() + '&callback=' + JSONPCallback;
        document.body.appendChild(script);
    } else {
        this.xhr(url, success, failure);
    }
};

api.xhr = function(url, success, failure, withCredentials, opts) {
    var defaults = {
        method: "GET"
    };
    var options = revUtils.extend(defaults, opts);
    var request = new XMLHttpRequest();

     if (withCredentials) {
         request.withCredentials = true;
     }

    request.open(options.method, url, true);

    if (options.hasOwnProperty("jwt") && options.jwt !== undefined  && options.jwt !== "") {
        var authtoken = 'Bearer ' + options.jwt;
        request.setRequestHeader('authorization', authtoken);
    } else if (localStorage.engage_jwt) {
        var authtoken = 'Bearer ' + localStorage.engage_jwt;
        request.setRequestHeader('authorization', authtoken);
    }
    
    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var responseText = '';
            try {
                responseText = JSON.parse(request.responseText);
            } catch(e) {
                console.log(e.message);
                responseText = request.status;
            }
            success(responseText);
        } else if(failure) {
            failure(request);
        }
    };

    request.onerror = function() {
        if (failure) {
            failure(request);
        }
    };

    if (options.method === "POST" && options.hasOwnProperty('data')) {
        request.send(options.data);
    } else {
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

    return +time();
};

api.generateCallback = function(prefix, entropy){
    var cb = ((prefix !== undefined && isNaN(prefix) && prefix.length > 2) ? prefix : 'success') + this.getTimestamp() + '_' + this.createEntropy((!isNaN(entropy) ? entropy : 1000));
    return cb;
};

api.createEntropy = function(range){
    var entropy = Math.floor(Math.random() * (!isNaN(range) ? range : 1000));
    return entropy;
};

// -----  ----- //
return api;

}));