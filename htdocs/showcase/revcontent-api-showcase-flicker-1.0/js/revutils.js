/**
 * Revcontent utils
 */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition
    // browser global
    window.revUtils = factory(
      window
    );

}( window, function factory( window ) {

'use strict';

var utils = {};

utils.validateApiParams = function(params) {
    var errors = [];
    if (!params.api_key){
        errors.push('api_key');
    }

    if (params.rev_position) {
        var revPositions = ['top_right', 'bottom_left', 'bottom_right'];
        if (this.inArray(revPositions, params.rev_position) < 0) {
            errors.push('rev_position');
        }
    }

    if (!params.pub_id){
        errors.push('pub_id');
    }
    if (!params.widget_id){
        errors.push('widget_id');
    }
    if (!params.domain){
        errors.push('domain');
    }

    if (errors.length) {
        console.log(errors);
    }

    return errors;
};

utils.appendStyle = function(style, namespace) {
    var namespace = namespace + '-append-style';

    if (!document.getElementById(namespace)) {
        var el = document.createElement('style');
        el.type = 'text/css';
        el.id = namespace;
        el.innerHTML = style;
        document.getElementsByTagName('head')[0].appendChild(el);
    }
};

utils.extend = function( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
};

utils.inArray = function(array, item) {
    for (var i = 0; i < array.length; i++) {
    if (array[i] === item)
      return i;
    }
    return -1;
}

utils.setCookie = function(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
};

utils.getCookie = function(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
};

utils.prepend = function(el, html) {
    el.insertBefore(html, el.firstChild);
}

utils.append = function(el, html) {
    el.appendChild(html);
}

utils.remove = function(el) {
    el.parentNode.removeChild(el);
}

utils.next = function(el) {
    function nextElementSibling(el) {
        do { el = el.nextSibling; } while ( el && el.nodeType !== 1 );
        return el;
    }

    return el.nextElementSibling || nextElementSibling(el);
};

utils.hasClass = function(el, className) {
    if (!el) return false;
    if (el.classList)
      return el.classList.contains(className);
    else
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
}

utils.addClass = function(el, className) {
    if (!el) return false;
    if (el.classList)
      el.classList.add(className);
    else
      el.className += ' ' + className;
};

utils.removeClass = function(el, className) {
    if (!el) return false;
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
};

utils.addEventListener = function(el, eventName, handler) {
  if (el.addEventListener) {
    el.addEventListener(eventName, handler);
  } else {
    el.attachEvent('on' + eventName, function(){
      handler.call(el);
    });
  }
};

utils.addDialog = function(id, url){
    return new RevDialog(id, url);
};

// -----  ----- //
return utils;

}));