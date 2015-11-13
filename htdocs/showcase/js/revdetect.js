/**
 * Revcontent detect
 */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition
    // browser global
    window.revDetect = factory(
      window
    );

}( window, function factory( window ) {

'use strict';

var detect = new MobileDetect(window.navigator.userAgent);

detect.show = function(devices){

    // don't bother
    if (devices.length == 3) {
        return true;
    }

    if (detect.phone() && (devices.indexOf('phone') > -1)) {
        return true;
    }

    if (detect.tablet() && (devices.indexOf('tablet') > -1)) {
        return true;
    }

    if (!detect.mobile() && (devices.indexOf('desktop') > -1)) {
        return true;
    }

    return false;
};

// -----  ----- //
return detect;

}));