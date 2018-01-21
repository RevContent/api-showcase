/*!
 * Flickity PACKAGED v2.0.9
 * Touch, responsive, flickable carousels
 *
 * Licensed GPLv3 for open source use
 * or Flickity Commercial License for commercial use
 *
 * http://flickity.metafizzy.co
 * Copyright 2017 Metafizzy
 */

/**
 * Bridget makes jQuery widgets
 * v2.0.1
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'jquery-bridget/jquery-bridget',[ 'jquery' ], function( jQuery ) {
      return factory( window, jQuery );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('jquery')
    );
  } else {
    // browser global
    window.jQueryBridget = factory(
      window,
      window.jQuery
    );
  }

}( window, function factory( window, jQuery ) {
'use strict';

// ----- utils ----- //

var arraySlice = Array.prototype.slice;

// helper function for logging errors
// $.error breaks jQuery chaining
var console = window.console;
var logError = typeof console == 'undefined' ? function() {} :
  function( message ) {
    console.error( message );
  };

// ----- jQueryBridget ----- //

function jQueryBridget( namespace, PluginClass, $ ) {
  $ = $ || jQuery || window.jQuery;
  if ( !$ ) {
    return;
  }

  // add option method -> $().plugin('option', {...})
  if ( !PluginClass.prototype.option ) {
    // option setter
    PluginClass.prototype.option = function( opts ) {
      // bail out if not an object
      if ( !$.isPlainObject( opts ) ){
        return;
      }
      this.options = $.extend( true, this.options, opts );
    };
  }

  // make jQuery plugin
  $.fn[ namespace ] = function( arg0 /*, arg1 */ ) {
    if ( typeof arg0 == 'string' ) {
      // method call $().plugin( 'methodName', { options } )
      // shift arguments by 1
      var args = arraySlice.call( arguments, 1 );
      return methodCall( this, arg0, args );
    }
    // just $().plugin({ options })
    plainCall( this, arg0 );
    return this;
  };

  // $().plugin('methodName')
  function methodCall( $elems, methodName, args ) {
    var returnValue;
    var pluginMethodStr = '$().' + namespace + '("' + methodName + '")';

    $elems.each( function( i, elem ) {
      // get instance
      var instance = $.data( elem, namespace );
      if ( !instance ) {
        logError( namespace + ' not initialized. Cannot call methods, i.e. ' +
          pluginMethodStr );
        return;
      }

      var method = instance[ methodName ];
      if ( !method || methodName.charAt(0) == '_' ) {
        logError( pluginMethodStr + ' is not a valid method' );
        return;
      }

      // apply method, get return value
      var value = method.apply( instance, args );
      // set return value if value is returned, use only first value
      returnValue = returnValue === undefined ? value : returnValue;
    });

    return returnValue !== undefined ? returnValue : $elems;
  }

  function plainCall( $elems, options ) {
    $elems.each( function( i, elem ) {
      var instance = $.data( elem, namespace );
      if ( instance ) {
        // set options & init
        instance.option( options );
        instance._init();
      } else {
        // initialize new instance
        instance = new PluginClass( elem, options );
        $.data( elem, namespace, instance );
      }
    });
  }

  updateJQuery( $ );

}

// ----- updateJQuery ----- //

// set $.bridget for v1 backwards compatibility
function updateJQuery( $ ) {
  if ( !$ || ( $ && $.bridget ) ) {
    return;
  }
  $.bridget = jQueryBridget;
}

updateJQuery( jQuery || window.jQuery );

// -----  ----- //

return jQueryBridget;

}));

/**
 * EvEmitter v1.1.0
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

( function( global, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, window */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'ev-emitter/ev-emitter',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }

}( typeof window != 'undefined' ? window : this, function() {



function EvEmitter() {}

var proto = EvEmitter.prototype;

proto.on = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // set events hash
  var events = this._events = this._events || {};
  // set listeners array
  var listeners = events[ eventName ] = events[ eventName ] || [];
  // only add once
  if ( listeners.indexOf( listener ) == -1 ) {
    listeners.push( listener );
  }

  return this;
};

proto.once = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // add event
  this.on( eventName, listener );
  // set once flag
  // set onceEvents hash
  var onceEvents = this._onceEvents = this._onceEvents || {};
  // set onceListeners object
  var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
  // set flag
  onceListeners[ listener ] = true;

  return this;
};

proto.off = function( eventName, listener ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var index = listeners.indexOf( listener );
  if ( index != -1 ) {
    listeners.splice( index, 1 );
  }

  return this;
};

proto.emitEvent = function( eventName, args ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  // copy over to avoid interference if .off() in listener
  listeners = listeners.slice(0);
  args = args || [];
  // once stuff
  var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

  for ( var i=0; i < listeners.length; i++ ) {
    var listener = listeners[i]
    var isOnce = onceListeners && onceListeners[ listener ];
    if ( isOnce ) {
      // remove listener
      // remove before trigger to prevent recursion
      this.off( eventName, listener );
      // unset once flag
      delete onceListeners[ listener ];
    }
    // trigger listener
    listener.apply( this, args );
  }

  return this;
};

proto.allOff = function() {
  delete this._events;
  delete this._onceEvents;
};

return EvEmitter;

}));

/*!
 * getSize v2.0.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false, console: false */

( function( window, factory ) {
  'use strict';

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'get-size/get-size',[],function() {
      return factory();
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }

})( window, function factory() {
'use strict';

// -------------------------- helpers -------------------------- //

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') == -1 && !isNaN( num );
  return isValid && num;
}

function noop() {}

var logError = typeof console == 'undefined' ? noop :
  function( message ) {
    console.error( message );
  };

// -------------------------- measurements -------------------------- //

var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

var measurementsLength = measurements.length;

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}

// -------------------------- getStyle -------------------------- //

/**
 * getStyle, get style of element, check for Firefox bug
 * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function getStyle( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    logError( 'Style returned ' + style +
      '. Are you running this code in a hidden iframe on Firefox? ' +
      'See http://bit.ly/getsizebug1' );
  }
  return style;
}

// -------------------------- setup -------------------------- //

var isSetup = false;

var isBoxSizeOuter;

/**
 * setup
 * check isBoxSizerOuter
 * do on first getSize() rather than on page load for Firefox bug
 */
function setup() {
  // setup once
  if ( isSetup ) {
    return;
  }
  isSetup = true;

  // -------------------------- box sizing -------------------------- //

  /**
   * WebKit measures the outer-width on style.width on border-box elems
   * IE & Firefox<29 measures the inner-width
   */
  var div = document.createElement('div');
  div.style.width = '200px';
  div.style.padding = '1px 2px 3px 4px';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px 2px 3px 4px';
  div.style.boxSizing = 'border-box';

  var body = document.body || document.documentElement;
  body.appendChild( div );
  var style = getStyle( div );

  getSize.isBoxSizeOuter = isBoxSizeOuter = getStyleSize( style.width ) == 200;
  body.removeChild( div );

}

// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  setup();

  // use querySeletor if elem is string
  if ( typeof elem == 'string' ) {
    elem = document.querySelector( elem );
  }

  // do not proceed on non-objects
  if ( !elem || typeof elem != 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display == 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

  // get all measurements
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    var num = parseFloat( value );
    // any 'auto', 'medium' value will be 0
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  // overwrite width and height if we can get it from style
  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

return getSize;

});

/**
 * matchesSelector v2.0.2
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  /*global define: false, module: false */
  'use strict';
  // universal module definition
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'desandro-matches-selector/matches-selector',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.matchesSelector = factory();
  }

}( window, function factory() {
  'use strict';

  var matchesMethod = ( function() {
    var ElemProto = window.Element.prototype;
    // check for the standard method name first
    if ( ElemProto.matches ) {
      return 'matches';
    }
    // check un-prefixed
    if ( ElemProto.matchesSelector ) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

    for ( var i=0; i < prefixes.length; i++ ) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if ( ElemProto[ method ] ) {
        return method;
      }
    }
  })();

  return function matchesSelector( elem, selector ) {
    return elem[ matchesMethod ]( selector );
  };

}));

/**
 * Fizzy UI utils v2.0.5
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'fizzy-ui-utils/utils',[
      'desandro-matches-selector/matches-selector'
    ], function( matchesSelector ) {
      return factory( window, matchesSelector );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('desandro-matches-selector')
    );
  } else {
    // browser global
    window.fizzyUIUtils = factory(
      window,
      window.matchesSelector
    );
  }

}( window, function factory( window, matchesSelector ) {



var utils = {};

// ----- extend ----- //

// extends objects
utils.extend = function( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
};

// ----- modulo ----- //

utils.modulo = function( num, div ) {
  return ( ( num % div ) + div ) % div;
};

// ----- makeArray ----- //

// turn element or nodeList into an array
utils.makeArray = function( obj ) {
  var ary = [];
  if ( Array.isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( obj && typeof obj == 'object' &&
    typeof obj.length == 'number' ) {
    // convert nodeList to array
    for ( var i=0; i < obj.length; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
};

// ----- removeFrom ----- //

utils.removeFrom = function( ary, obj ) {
  var index = ary.indexOf( obj );
  if ( index != -1 ) {
    ary.splice( index, 1 );
  }
};

// ----- getParent ----- //

utils.getParent = function( elem, selector ) {
  while ( elem.parentNode && elem != document.body ) {
    elem = elem.parentNode;
    if ( matchesSelector( elem, selector ) ) {
      return elem;
    }
  }
};

// ----- getQueryElement ----- //

// use element as selector string
utils.getQueryElement = function( elem ) {
  if ( typeof elem == 'string' ) {
    return document.querySelector( elem );
  }
  return elem;
};

// ----- handleEvent ----- //

// enable .ontype to trigger from .addEventListener( elem, 'type' )
utils.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// ----- filterFindElements ----- //

utils.filterFindElements = function( elems, selector ) {
  // make array of elems
  elems = utils.makeArray( elems );
  var ffElems = [];

  elems.forEach( function( elem ) {
    // check that elem is an actual element
    if ( !( elem instanceof HTMLElement ) ) {
      return;
    }
    // add elem if no selector
    if ( !selector ) {
      ffElems.push( elem );
      return;
    }
    // filter & find items if we have a selector
    // filter
    if ( matchesSelector( elem, selector ) ) {
      ffElems.push( elem );
    }
    // find children
    var childElems = elem.querySelectorAll( selector );
    // concat childElems to filterFound array
    for ( var i=0; i < childElems.length; i++ ) {
      ffElems.push( childElems[i] );
    }
  });

  return ffElems;
};

// ----- debounceMethod ----- //

utils.debounceMethod = function( _class, methodName, threshold ) {
  // original method
  var method = _class.prototype[ methodName ];
  var timeoutName = methodName + 'Timeout';

  _class.prototype[ methodName ] = function() {
    var timeout = this[ timeoutName ];
    if ( timeout ) {
      clearTimeout( timeout );
    }
    var args = arguments;

    var _this = this;
    this[ timeoutName ] = setTimeout( function() {
      method.apply( _this, args );
      delete _this[ timeoutName ];
    }, threshold || 100 );
  };
};

// ----- docReady ----- //

utils.docReady = function( callback ) {
  var readyState = document.readyState;
  if ( readyState == 'complete' || readyState == 'interactive' ) {
    // do async to allow for other scripts to run. metafizzy/flickity#441
    setTimeout( callback );
  } else {
    document.addEventListener( 'DOMContentLoaded', callback );
  }
};

// ----- htmlInit ----- //

// http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
utils.toDashed = function( str ) {
  return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
    return $1 + '-' + $2;
  }).toLowerCase();
};

var console = window.console;
/**
 * allow user to initialize classes via [data-namespace] or .js-namespace class
 * htmlInit( Widget, 'widgetName' )
 * options are parsed from data-namespace-options
 */
utils.htmlInit = function( WidgetClass, namespace ) {
  utils.docReady( function() {
    var dashedNamespace = utils.toDashed( namespace );
    var dataAttr = 'data-' + dashedNamespace;
    var dataAttrElems = document.querySelectorAll( '[' + dataAttr + ']' );
    var jsDashElems = document.querySelectorAll( '.js-' + dashedNamespace );
    var elems = utils.makeArray( dataAttrElems )
      .concat( utils.makeArray( jsDashElems ) );
    var dataOptionsAttr = dataAttr + '-options';
    var jQuery = window.jQuery;

    elems.forEach( function( elem ) {
      var attr = elem.getAttribute( dataAttr ) ||
        elem.getAttribute( dataOptionsAttr );
      var options;
      try {
        options = attr && JSON.parse( attr );
      } catch ( error ) {
        // log error, do not initialize
        if ( console ) {
          console.error( 'Error parsing ' + dataAttr + ' on ' + elem.className +
          ': ' + error );
        }
        return;
      }
      // initialize
      var instance = new WidgetClass( elem, options );
      // make available via $().data('namespace')
      if ( jQuery ) {
        jQuery.data( elem, namespace, instance );
      }
    });

  });
};

// -----  ----- //

return utils;

}));

// Flickity.Cell
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/cell',[
      'get-size/get-size'
    ], function( getSize ) {
      return factory( window, getSize );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('get-size')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.Cell = factory(
      window,
      window.getSize
    );
  }

}( window, function factory( window, getSize ) {



function Cell( elem, parent ) {
  this.element = elem;
  this.parent = parent;

  this.create();
}

var proto = Cell.prototype;

proto.create = function() {
  this.element.style.position = 'absolute';
  this.x = 0;
  this.shift = 0;
};

proto.destroy = function() {
  // reset style
  this.element.style.position = '';
  var side = this.parent.originSide;
  this.element.style[ side ] = '';
};

proto.getSize = function() {
  this.size = getSize( this.element );
};

proto.setPosition = function( x ) {
  this.x = x;
  this.updateTarget();
  this.renderPosition( x );
};

// setDefaultTarget v1 method, backwards compatibility, remove in v3
proto.updateTarget = proto.setDefaultTarget = function() {
  var marginProperty = this.parent.originSide == 'left' ? 'marginLeft' : 'marginRight';
  this.target = this.x + this.size[ marginProperty ] +
    this.size.width * this.parent.cellAlign;
};

proto.renderPosition = function( x ) {
  // render position of cell with in slider
  var side = this.parent.originSide;
  this.element.style[ side ] = this.parent.getPositionValue( x );
};

/**
 * @param {Integer} factor - 0, 1, or -1
**/
proto.wrapShift = function( shift ) {
  this.shift = shift;
  this.renderPosition( this.x + this.parent.slideableWidth * shift );
};

proto.remove = function() {
  this.element.parentNode.removeChild( this.element );
};

return Cell;

}));

// slide
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/slide',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.Slide = factory();
  }

}( window, function factory() {
'use strict';

function Slide( parent ) {
  this.parent = parent;
  this.isOriginLeft = parent.originSide == 'left';
  this.cells = [];
  this.outerWidth = 0;
  this.height = 0;
}

var proto = Slide.prototype;

proto.addCell = function( cell ) {
  this.cells.push( cell );
  this.outerWidth += cell.size.outerWidth;
  this.height = Math.max( cell.size.outerHeight, this.height );
  // first cell stuff
  if ( this.cells.length == 1 ) {
    this.x = cell.x; // x comes from first cell
    var beginMargin = this.isOriginLeft ? 'marginLeft' : 'marginRight';
    this.firstMargin = cell.size[ beginMargin ];
  }
};

proto.updateTarget = function() {
  var endMargin = this.isOriginLeft ? 'marginRight' : 'marginLeft';
  var lastCell = this.getLastCell();
  var lastMargin = lastCell ? lastCell.size[ endMargin ] : 0;
  var slideWidth = this.outerWidth - ( this.firstMargin + lastMargin );
  this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
};

proto.getLastCell = function() {
  return this.cells[ this.cells.length - 1 ];
};

proto.select = function() {
  this.changeSelectedClass('add');
};

proto.unselect = function() {
  this.changeSelectedClass('remove');
};

proto.changeSelectedClass = function( method ) {
  this.cells.forEach( function( cell ) {
    cell.element.classList[ method ]('is-selected');
  });
};

proto.getCellElements = function() {
  return this.cells.map( function( cell ) {
    return cell.element;
  });
};

return Slide;

}));

// animate
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/animate',[
      'fizzy-ui-utils/utils'
    ], function( utils ) {
      return factory( window, utils );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.animatePrototype = factory(
      window,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, utils ) {



// -------------------------- requestAnimationFrame -------------------------- //

// get rAF, prefixed, if present
var requestAnimationFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame;

// fallback to setTimeout
var lastTime = 0;
if ( !requestAnimationFrame )  {
  requestAnimationFrame = function( callback ) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
    var id = setTimeout( callback, timeToCall );
    lastTime = currTime + timeToCall;
    return id;
  };
}

// -------------------------- animate -------------------------- //

var proto = {};

proto.startAnimation = function() {
  if ( this.isAnimating ) {
    return;
  }

  this.isAnimating = true;
  this.restingFrames = 0;
  this.animate();
};

proto.animate = function() {
  this.applyDragForce();
  this.applySelectedAttraction();

  var previousX = this.x;

  this.integratePhysics();
  this.positionSlider();
  this.settle( previousX );
  // animate next frame
  if ( this.isAnimating ) {
    var _this = this;
    requestAnimationFrame( function animateFrame() {
      _this.animate();
    });
  }
};


var transformProperty = ( function () {
  var style = document.documentElement.style;
  if ( typeof style.transform == 'string' ) {
    return 'transform';
  }
  return 'WebkitTransform';
})();

proto.positionSlider = function() {
  var x = this.x;
  // wrap position around
  if ( this.options.wrapAround && this.cells.length > 1 ) {
    x = utils.modulo( x, this.slideableWidth );
    x = x - this.slideableWidth;
    this.shiftWrapCells( x );
  }

  x = x + this.cursorPosition;
  // reverse if right-to-left and using transform
  x = this.options.rightToLeft && transformProperty ? -x : x;
  var value = this.getPositionValue( x );
  // use 3D tranforms for hardware acceleration on iOS
  // but use 2D when settled, for better font-rendering
  this.slider.style[ transformProperty ] = this.isAnimating ?
    'translate3d(' + value + ',0,0)' : 'translateX(' + value + ')';

  // scroll event
  var firstSlide = this.slides[0];
  if ( firstSlide ) {
    var positionX = -this.x - firstSlide.target;
    var progress = positionX / this.slidesWidth;
    this.dispatchEvent( 'scroll', null, [ progress, positionX ] );
  }
};

proto.positionSliderAtSelected = function() {
  if ( !this.cells.length ) {
    return;
  }
  this.x = -this.selectedSlide.target;
  this.positionSlider();
};

proto.getPositionValue = function( position ) {
  if ( this.options.percentPosition ) {
    // percent position, round to 2 digits, like 12.34%
    return ( Math.round( ( position / this.size.innerWidth ) * 10000 ) * 0.01 )+ '%';
  } else {
    // pixel positioning
    return Math.round( position ) + 'px';
  }
};

proto.settle = function( previousX ) {
  // keep track of frames where x hasn't moved
  if ( !this.isPointerDown && Math.round( this.x * 100 ) == Math.round( previousX * 100 ) ) {
    this.restingFrames++;
  }
  // stop animating if resting for 3 or more frames
  if ( this.restingFrames > 2 ) {
    this.isAnimating = false;
    delete this.isFreeScrolling;
    // render position with translateX when settled
    this.positionSlider();
    this.dispatchEvent('settle');
  }
};

proto.shiftWrapCells = function( x ) {
  // shift before cells
  var beforeGap = this.cursorPosition + x;
  this._shiftCells( this.beforeShiftCells, beforeGap, -1 );
  // shift after cells
  var afterGap = this.size.innerWidth - ( x + this.slideableWidth + this.cursorPosition );
  this._shiftCells( this.afterShiftCells, afterGap, 1 );
};

proto._shiftCells = function( cells, gap, shift ) {
  for ( var i=0; i < cells.length; i++ ) {
    var cell = cells[i];
    var cellShift = gap > 0 ? shift : 0;
    cell.wrapShift( cellShift );
    gap -= cell.size.outerWidth;
  }
};

proto._unshiftCells = function( cells ) {
  if ( !cells || !cells.length ) {
    return;
  }
  for ( var i=0; i < cells.length; i++ ) {
    cells[i].wrapShift( 0 );
  }
};

// -------------------------- physics -------------------------- //

proto.integratePhysics = function() {
  this.x += this.velocity;
  this.velocity *= this.getFrictionFactor();
};

proto.applyForce = function( force ) {
  this.velocity += force;
};

proto.getFrictionFactor = function() {
  return 1 - this.options[ this.isFreeScrolling ? 'freeScrollFriction' : 'friction' ];
};

proto.getRestingPosition = function() {
  // my thanks to Steven Wittens, who simplified this math greatly
  return this.x + this.velocity / ( 1 - this.getFrictionFactor() );
};

proto.applyDragForce = function() {
  if ( !this.isPointerDown ) {
    return;
  }
  // change the position to drag position by applying force
  var dragVelocity = this.dragX - this.x;
  var dragForce = dragVelocity - this.velocity;
  this.applyForce( dragForce );
};

proto.applySelectedAttraction = function() {
  // do not attract if pointer down or no cells
  if ( this.isPointerDown || this.isFreeScrolling || !this.cells.length ) {
    return;
  }
  var distance = this.selectedSlide.target * -1 - this.x;
  var force = distance * this.options.selectedAttraction;
  this.applyForce( force );
};

return proto;

}));

// Flickity main
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/flickity',[
      'ev-emitter/ev-emitter',
      'get-size/get-size',
      'fizzy-ui-utils/utils',
      './cell',
      './slide',
      './animate'
    ], function( EvEmitter, getSize, utils, Cell, Slide, animatePrototype ) {
      return factory( window, EvEmitter, getSize, utils, Cell, Slide, animatePrototype );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('ev-emitter'),
      require('get-size'),
      require('fizzy-ui-utils'),
      require('./cell'),
      require('./slide'),
      require('./animate')
    );
  } else {
    // browser global
    var _Flickity = window.Flickity;

    window.Flickity = factory(
      window,
      window.EvEmitter,
      window.getSize,
      window.fizzyUIUtils,
      _Flickity.Cell,
      _Flickity.Slide,
      _Flickity.animatePrototype
    );
  }

}( window, function factory( window, EvEmitter, getSize,
  utils, Cell, Slide, animatePrototype ) {



// vars
var jQuery = window.jQuery;
var getComputedStyle = window.getComputedStyle;
var console = window.console;

function moveElements( elems, toElem ) {
  elems = utils.makeArray( elems );
  while ( elems.length ) {
    toElem.appendChild( elems.shift() );
  }
}

// -------------------------- Flickity -------------------------- //

// globally unique identifiers
var GUID = 0;
// internal store of all Flickity intances
var instances = {};

function Flickity( element, options ) {
  var queryElement = utils.getQueryElement( element );
  if ( !queryElement ) {
    if ( console ) {
      console.error( 'Bad element for Flickity: ' + ( queryElement || element ) );
    }
    return;
  }
  this.element = queryElement;
  // do not initialize twice on same element
  if ( this.element.flickityGUID ) {
    var instance = instances[ this.element.flickityGUID ];
    instance.option( options );
    return instance;
  }

  // add jQuery
  if ( jQuery ) {
    this.$element = jQuery( this.element );
  }
  // options
  this.options = utils.extend( {}, this.constructor.defaults );
  this.option( options );

  // kick things off
  this._create();
}

Flickity.defaults = {
  accessibility: true,
  // adaptiveHeight: false,
  cellAlign: 'center',
  // cellSelector: undefined,
  // contain: false,
  freeScrollFriction: 0.075, // friction when free-scrolling
  friction: 0.28, // friction when selecting
  namespaceJQueryEvents: true,
  // initialIndex: 0,
  percentPosition: true,
  resize: true,
  selectedAttraction: 0.025,
  setGallerySize: true
  // watchCSS: false,
  // wrapAround: false
};

// hash of methods triggered on _create()
Flickity.createMethods = [];

var proto = Flickity.prototype;
// inherit EventEmitter
utils.extend( proto, EvEmitter.prototype );

proto._create = function() {
  // add id for Flickity.data
  var id = this.guid = ++GUID;
  this.element.flickityGUID = id; // expando
  instances[ id ] = this; // associate via id
  // initial properties
  this.selectedIndex = 0;
  // how many frames slider has been in same position
  this.restingFrames = 0;
  // initial physics properties
  this.x = 0;
  this.velocity = 0;
  this.originSide = this.options.rightToLeft ? 'right' : 'left';
  // create viewport & slider
  this.viewport = document.createElement('div');
  this.viewport.className = 'flickity-viewport';
  this._createSlider();

  if ( this.options.resize || this.options.watchCSS ) {
    window.addEventListener( 'resize', this );
  }

  Flickity.createMethods.forEach( function( method ) {
    this[ method ]();
  }, this );

  if ( this.options.watchCSS ) {
    this.watchCSS();
  } else {
    this.activate();
  }

};

/**
 * set options
 * @param {Object} opts
 */
proto.option = function( opts ) {
  utils.extend( this.options, opts );
};

proto.activate = function() {
  if ( this.isActive ) {
    return;
  }
  this.isActive = true;
  this.element.classList.add('flickity-enabled');
  if ( this.options.rightToLeft ) {
    this.element.classList.add('flickity-rtl');
  }

  this.getSize();
  // move initial cell elements so they can be loaded as cells
  var cellElems = this._filterFindCellElements( this.element.children );
  moveElements( cellElems, this.slider );
  this.viewport.appendChild( this.slider );
  this.element.appendChild( this.viewport );
  // get cells from children
  this.reloadCells();

  if ( this.options.accessibility ) {
    // allow element to focusable
    this.element.tabIndex = 0;
    // listen for key presses
    this.element.addEventListener( 'keydown', this );
  }

  this.emitEvent('activate');

  var index;
  var initialIndex = this.options.initialIndex;
  if ( this.isInitActivated ) {
    index = this.selectedIndex;
  } else if ( initialIndex !== undefined ) {
    index = this.cells[ initialIndex ] ? initialIndex : 0;
  } else {
    index = 0;
  }
  // select instantly
  this.select( index, false, true );
  // flag for initial activation, for using initialIndex
  this.isInitActivated = true;
};

// slider positions the cells
proto._createSlider = function() {
  // slider element does all the positioning
  var slider = document.createElement('div');
  slider.className = 'flickity-slider';
  slider.style[ this.originSide ] = 0;
  this.slider = slider;
};

proto._filterFindCellElements = function( elems ) {
  return utils.filterFindElements( elems, this.options.cellSelector );
};

// goes through all children
proto.reloadCells = function() {
  // collection of item elements
  this.cells = this._makeCells( this.slider.children );
  this.positionCells();
  this._getWrapShiftCells();
  this.setGallerySize();
};

/**
 * turn elements into Flickity.Cells
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Flickity Cells
 */
proto._makeCells = function( elems ) {
  var cellElems = this._filterFindCellElements( elems );

  // create new Flickity for collection
  var cells = cellElems.map( function( cellElem ) {
    return new Cell( cellElem, this );
  }, this );

  return cells;
};

proto.getLastCell = function() {
  return this.cells[ this.cells.length - 1 ];
};

proto.getLastSlide = function() {
  return this.slides[ this.slides.length - 1 ];
};

// positions all cells
proto.positionCells = function() {
  // size all cells
  this._sizeCells( this.cells );
  // position all cells
  this._positionCells( 0 );
};

/**
 * position certain cells
 * @param {Integer} index - which cell to start with
 */
proto._positionCells = function( index ) {
  index = index || 0;
  // also measure maxCellHeight
  // start 0 if positioning all cells
  this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
  var cellX = 0;
  // get cellX
  if ( index > 0 ) {
    var startCell = this.cells[ index - 1 ];
    cellX = startCell.x + startCell.size.outerWidth;
  }
  var len = this.cells.length;
  for ( var i=index; i < len; i++ ) {
    var cell = this.cells[i];
    cell.setPosition( cellX );
    cellX += cell.size.outerWidth;
    this.maxCellHeight = Math.max( cell.size.outerHeight, this.maxCellHeight );
  }
  // keep track of cellX for wrap-around
  this.slideableWidth = cellX;
  // slides
  this.updateSlides();
  // contain slides target
  this._containSlides();
  // update slidesWidth
  this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
};

/**
 * cell.getSize() on multiple cells
 * @param {Array} cells
 */
proto._sizeCells = function( cells ) {
  cells.forEach( function( cell ) {
    cell.getSize();
  });
};

// --------------------------  -------------------------- //

proto.updateSlides = function() {
  this.slides = [];
  if ( !this.cells.length ) {
    return;
  }

  var slide = new Slide( this );
  this.slides.push( slide );
  var isOriginLeft = this.originSide == 'left';
  var nextMargin = isOriginLeft ? 'marginRight' : 'marginLeft';

  var canCellFit = this._getCanCellFit();

  this.cells.forEach( function( cell, i ) {
    // just add cell if first cell in slide
    if ( !slide.cells.length ) {
      slide.addCell( cell );
      return;
    }

    var slideWidth = ( slide.outerWidth - slide.firstMargin ) +
      ( cell.size.outerWidth - cell.size[ nextMargin ] );

    if ( canCellFit.call( this, i, slideWidth ) ) {
      slide.addCell( cell );
    } else {
      // doesn't fit, new slide
      slide.updateTarget();

      slide = new Slide( this );
      this.slides.push( slide );
      slide.addCell( cell );
    }
  }, this );
  // last slide
  slide.updateTarget();
  // update .selectedSlide
  this.updateSelectedSlide();
};

proto._getCanCellFit = function() {
  var groupCells = this.options.groupCells;
  if ( !groupCells ) {
    return function() {
      return false;
    };
  } else if ( typeof groupCells == 'number' ) {
    // group by number. 3 -> [0,1,2], [3,4,5], ...
    var number = parseInt( groupCells, 10 );
    return function( i ) {
      return ( i % number ) !== 0;
    };
  }
  // default, group by width of slide
  // parse '75%
  var percentMatch = typeof groupCells == 'string' &&
    groupCells.match(/^(\d+)%$/);
  var percent = percentMatch ? parseInt( percentMatch[1], 10 ) / 100 : 1;
  return function( i, slideWidth ) {
    return slideWidth <= ( this.size.innerWidth + 1 ) * percent;
  };
};

// alias _init for jQuery plugin .flickity()
proto._init =
proto.reposition = function() {
  this.positionCells();
  this.positionSliderAtSelected();
};

proto.getSize = function() {
  this.size = getSize( this.element );
  this.setCellAlign();
  this.cursorPosition = this.size.innerWidth * this.cellAlign;
};

var cellAlignShorthands = {
  // cell align, then based on origin side
  center: {
    left: 0.5,
    right: 0.5
  },
  left: {
    left: 0,
    right: 1
  },
  right: {
    right: 0,
    left: 1
  }
};

proto.setCellAlign = function() {
  var shorthand = cellAlignShorthands[ this.options.cellAlign ];
  this.cellAlign = shorthand ? shorthand[ this.originSide ] : this.options.cellAlign;
};

proto.setGallerySize = function() {
  if ( this.options.setGallerySize ) {
    var height = this.options.adaptiveHeight && this.selectedSlide ?
      this.selectedSlide.height : this.maxCellHeight;
    this.viewport.style.height = height + 'px';
  }
};

proto._getWrapShiftCells = function() {
  // only for wrap-around
  if ( !this.options.wrapAround ) {
    return;
  }
  // unshift previous cells
  this._unshiftCells( this.beforeShiftCells );
  this._unshiftCells( this.afterShiftCells );
  // get before cells
  // initial gap
  var gapX = this.cursorPosition;
  var cellIndex = this.cells.length - 1;
  this.beforeShiftCells = this._getGapCells( gapX, cellIndex, -1 );
  // get after cells
  // ending gap between last cell and end of gallery viewport
  gapX = this.size.innerWidth - this.cursorPosition;
  // start cloning at first cell, working forwards
  this.afterShiftCells = this._getGapCells( gapX, 0, 1 );
};

proto._getGapCells = function( gapX, cellIndex, increment ) {
  // keep adding cells until the cover the initial gap
  var cells = [];
  while ( gapX > 0 ) {
    var cell = this.cells[ cellIndex ];
    if ( !cell ) {
      break;
    }
    cells.push( cell );
    cellIndex += increment;
    gapX -= cell.size.outerWidth;
  }
  return cells;
};

// ----- contain ----- //

// contain cell targets so no excess sliding
proto._containSlides = function() {
  if ( !this.options.contain || this.options.wrapAround || !this.cells.length ) {
    return;
  }
  var isRightToLeft = this.options.rightToLeft;
  var beginMargin = isRightToLeft ? 'marginRight' : 'marginLeft';
  var endMargin = isRightToLeft ? 'marginLeft' : 'marginRight';
  var contentWidth = this.slideableWidth - this.getLastCell().size[ endMargin ];
  // content is less than gallery size
  var isContentSmaller = contentWidth < this.size.innerWidth;
  // bounds
  var beginBound = this.cursorPosition + this.cells[0].size[ beginMargin ];
  var endBound = contentWidth - this.size.innerWidth * ( 1 - this.cellAlign );
  // contain each cell target
  this.slides.forEach( function( slide ) {
    if ( isContentSmaller ) {
      // all cells fit inside gallery
      slide.target = contentWidth * this.cellAlign;
    } else {
      // contain to bounds
      slide.target = Math.max( slide.target, beginBound );
      slide.target = Math.min( slide.target, endBound );
    }
  }, this );
};

// -----  ----- //

/**
 * emits events via eventEmitter and jQuery events
 * @param {String} type - name of event
 * @param {Event} event - original event
 * @param {Array} args - extra arguments
 */
proto.dispatchEvent = function( type, event, args ) {
  var emitArgs = event ? [ event ].concat( args ) : args;
  this.emitEvent( type, emitArgs );

  if ( jQuery && this.$element ) {
    // default trigger with type if no event
    type += this.options.namespaceJQueryEvents ? '.flickity' : '';
    var $event = type;
    if ( event ) {
      // create jQuery event
      var jQEvent = jQuery.Event( event );
      jQEvent.type = type;
      $event = jQEvent;
    }
    this.$element.trigger( $event, args );
  }
};

// -------------------------- select -------------------------- //

/**
 * @param {Integer} index - index of the slide
 * @param {Boolean} isWrap - will wrap-around to last/first if at the end
 * @param {Boolean} isInstant - will immediately set position at selected cell
 */
proto.select = function( index, isWrap, isInstant ) {
  if ( !this.isActive ) {
    return;
  }
  index = parseInt( index, 10 );
  this._wrapSelect( index );

  if ( this.options.wrapAround || isWrap ) {
    index = utils.modulo( index, this.slides.length );
  }
  // bail if invalid index
  if ( !this.slides[ index ] ) {
    return;
  }
  this.selectedIndex = index;
  this.updateSelectedSlide();
  if ( isInstant ) {
    this.positionSliderAtSelected();
  } else {
    this.startAnimation();
  }
  if ( this.options.adaptiveHeight ) {
    this.setGallerySize();
  }

  this.dispatchEvent('select');
  // old v1 event name, remove in v3
  this.dispatchEvent('cellSelect');
};

// wraps position for wrapAround, to move to closest slide. #113
proto._wrapSelect = function( index ) {
  var len = this.slides.length;
  var isWrapping = this.options.wrapAround && len > 1;
  if ( !isWrapping ) {
    return index;
  }
  var wrapIndex = utils.modulo( index, len );
  // go to shortest
  var delta = Math.abs( wrapIndex - this.selectedIndex );
  var backWrapDelta = Math.abs( ( wrapIndex + len ) - this.selectedIndex );
  var forewardWrapDelta = Math.abs( ( wrapIndex - len ) - this.selectedIndex );
  if ( !this.isDragSelect && backWrapDelta < delta ) {
    index += len;
  } else if ( !this.isDragSelect && forewardWrapDelta < delta ) {
    index -= len;
  }
  // wrap position so slider is within normal area
  if ( index < 0 ) {
    this.x -= this.slideableWidth;
  } else if ( index >= len ) {
    this.x += this.slideableWidth;
  }
};

proto.previous = function( isWrap, isInstant ) {
  this.select( this.selectedIndex - 1, isWrap, isInstant );
};

proto.next = function( isWrap, isInstant ) {
  this.select( this.selectedIndex + 1, isWrap, isInstant );
};

proto.updateSelectedSlide = function() {
  var slide = this.slides[ this.selectedIndex ];
  // selectedIndex could be outside of slides, if triggered before resize()
  if ( !slide ) {
    return;
  }
  // unselect previous selected slide
  this.unselectSelectedSlide();
  // update new selected slide
  this.selectedSlide = slide;
  slide.select();
  this.selectedCells = slide.cells;
  this.selectedElements = slide.getCellElements();
  // HACK: selectedCell & selectedElement is first cell in slide, backwards compatibility
  // Remove in v3?
  this.selectedCell = slide.cells[0];
  this.selectedElement = this.selectedElements[0];
};

proto.unselectSelectedSlide = function() {
  if ( this.selectedSlide ) {
    this.selectedSlide.unselect();
  }
};

/**
 * select slide from number or cell element
 * @param {Element or Number} elem
 */
proto.selectCell = function( value, isWrap, isInstant ) {
  // get cell
  var cell;
  if ( typeof value == 'number' ) {
    cell = this.cells[ value ];
  } else {
    // use string as selector
    if ( typeof value == 'string' ) {
      value = this.element.querySelector( value );
    }
    // get cell from element
    cell = this.getCell( value );
  }
  // select slide that has cell
  for ( var i=0; cell && i < this.slides.length; i++ ) {
    var slide = this.slides[i];
    var index = slide.cells.indexOf( cell );
    if ( index != -1 ) {
      this.select( i, isWrap, isInstant );
      return;
    }
  }
};

// -------------------------- get cells -------------------------- //

/**
 * get Flickity.Cell, given an Element
 * @param {Element} elem
 * @returns {Flickity.Cell} item
 */
proto.getCell = function( elem ) {
  // loop through cells to get the one that matches
  for ( var i=0; i < this.cells.length; i++ ) {
    var cell = this.cells[i];
    if ( cell.element == elem ) {
      return cell;
    }
  }
};

/**
 * get collection of Flickity.Cells, given Elements
 * @param {Element, Array, NodeList} elems
 * @returns {Array} cells - Flickity.Cells
 */
proto.getCells = function( elems ) {
  elems = utils.makeArray( elems );
  var cells = [];
  elems.forEach( function( elem ) {
    var cell = this.getCell( elem );
    if ( cell ) {
      cells.push( cell );
    }
  }, this );
  return cells;
};

/**
 * get cell elements
 * @returns {Array} cellElems
 */
proto.getCellElements = function() {
  return this.cells.map( function( cell ) {
    return cell.element;
  });
};

/**
 * get parent cell from an element
 * @param {Element} elem
 * @returns {Flickit.Cell} cell
 */
proto.getParentCell = function( elem ) {
  // first check if elem is cell
  var cell = this.getCell( elem );
  if ( cell ) {
    return cell;
  }
  // try to get parent cell elem
  elem = utils.getParent( elem, '.flickity-slider > *' );
  return this.getCell( elem );
};

/**
 * get cells adjacent to a slide
 * @param {Integer} adjCount - number of adjacent slides
 * @param {Integer} index - index of slide to start
 * @returns {Array} cells - array of Flickity.Cells
 */
proto.getAdjacentCellElements = function( adjCount, index ) {
  if ( !adjCount ) {
    return this.selectedSlide.getCellElements();
  }
  index = index === undefined ? this.selectedIndex : index;

  var len = this.slides.length;
  if ( 1 + ( adjCount * 2 ) >= len ) {
    return this.getCellElements();
  }

  var cellElems = [];
  for ( var i = index - adjCount; i <= index + adjCount ; i++ ) {
    var slideIndex = this.options.wrapAround ? utils.modulo( i, len ) : i;
    var slide = this.slides[ slideIndex ];
    if ( slide ) {
      cellElems = cellElems.concat( slide.getCellElements() );
    }
  }
  return cellElems;
};

// -------------------------- events -------------------------- //

proto.uiChange = function() {
  this.emitEvent('uiChange');
};

proto.childUIPointerDown = function( event ) {
  this.emitEvent( 'childUIPointerDown', [ event ] );
};

// ----- resize ----- //

proto.onresize = function() {
  this.watchCSS();
  this.resize();
};

utils.debounceMethod( Flickity, 'onresize', 150 );

proto.resize = function() {
  if ( !this.isActive ) {
    return;
  }
  this.getSize();
  // wrap values
  if ( this.options.wrapAround ) {
    this.x = utils.modulo( this.x, this.slideableWidth );
  }
  this.positionCells();
  this._getWrapShiftCells();
  this.setGallerySize();
  this.emitEvent('resize');
  // update selected index for group slides, instant
  // TODO: position can be lost between groups of various numbers
  var selectedElement = this.selectedElements && this.selectedElements[0];
  this.selectCell( selectedElement, false, true );
};

// watches the :after property, activates/deactivates
proto.watchCSS = function() {
  var watchOption = this.options.watchCSS;
  if ( !watchOption ) {
    return;
  }

  var afterContent = getComputedStyle( this.element, ':after' ).content;
  // activate if :after { content: 'flickity' }
  if ( afterContent.indexOf('flickity') != -1 ) {
    this.activate();
  } else {
    this.deactivate();
  }
};

// ----- keydown ----- //

// go previous/next if left/right keys pressed
proto.onkeydown = function( event ) {
  // only work if element is in focus
  if ( !this.options.accessibility ||
    ( document.activeElement && document.activeElement != this.element ) ) {
    return;
  }

  if ( event.keyCode == 37 ) {
    // go left
    var leftMethod = this.options.rightToLeft ? 'next' : 'previous';
    this.uiChange();
    this[ leftMethod ]();
  } else if ( event.keyCode == 39 ) {
    // go right
    var rightMethod = this.options.rightToLeft ? 'previous' : 'next';
    this.uiChange();
    this[ rightMethod ]();
  }
};

// -------------------------- destroy -------------------------- //

// deactivate all Flickity functionality, but keep stuff available
proto.deactivate = function() {
  if ( !this.isActive ) {
    return;
  }
  this.element.classList.remove('flickity-enabled');
  this.element.classList.remove('flickity-rtl');
  // destroy cells
  this.cells.forEach( function( cell ) {
    cell.destroy();
  });
  this.unselectSelectedSlide();
  this.element.removeChild( this.viewport );
  // move child elements back into element
  moveElements( this.slider.children, this.element );
  if ( this.options.accessibility ) {
    this.element.removeAttribute('tabIndex');
    this.element.removeEventListener( 'keydown', this );
  }
  // set flags
  this.isActive = false;
  this.emitEvent('deactivate');
};

proto.destroy = function() {
  this.deactivate();
  window.removeEventListener( 'resize', this );
  this.emitEvent('destroy');
  if ( jQuery && this.$element ) {
    jQuery.removeData( this.element, 'flickity' );
  }
  delete this.element.flickityGUID;
  delete instances[ this.guid ];
};

// -------------------------- prototype -------------------------- //

utils.extend( proto, animatePrototype );

// -------------------------- extras -------------------------- //

/**
 * get Flickity instance from element
 * @param {Element} elem
 * @returns {Flickity}
 */
Flickity.data = function( elem ) {
  elem = utils.getQueryElement( elem );
  var id = elem && elem.flickityGUID;
  return id && instances[ id ];
};

utils.htmlInit( Flickity, 'flickity' );

if ( jQuery && jQuery.bridget ) {
  jQuery.bridget( 'flickity', Flickity );
}

// set internal jQuery, for Webpack + jQuery v3, #478
Flickity.setJQuery = function( jq ) {
  jQuery = jq;
};

Flickity.Cell = Cell;

return Flickity;

}));

/*!
 * Unipointer v2.2.0
 * base class for doing one thing with pointer event
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*global define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'unipointer/unipointer',[
      'ev-emitter/ev-emitter'
    ], function( EvEmitter ) {
      return factory( window, EvEmitter );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('ev-emitter')
    );
  } else {
    // browser global
    window.Unipointer = factory(
      window,
      window.EvEmitter
    );
  }

}( window, function factory( window, EvEmitter ) {



function noop() {}

function Unipointer() {}

// inherit EvEmitter
var proto = Unipointer.prototype = Object.create( EvEmitter.prototype );

proto.bindStartEvent = function( elem ) {
  this._bindStartEvent( elem, true );
};

proto.unbindStartEvent = function( elem ) {
  this._bindStartEvent( elem, false );
};

/**
 * works as unbinder, as you can ._bindStart( false ) to unbind
 * @param {Boolean} isBind - will unbind if falsey
 */
proto._bindStartEvent = function( elem, isBind ) {
  // munge isBind, default to true
  isBind = isBind === undefined ? true : !!isBind;
  var bindMethod = isBind ? 'addEventListener' : 'removeEventListener';

  if ( false ) {
    // Pointer Events. Chrome 55, IE11, Edge 14
    elem[ bindMethod ]( 'pointerdown', this );
  } else {
    // listen for both, for devices like Chrome Pixel
    elem[ bindMethod ]( 'mousedown', this );
    elem[ bindMethod ]( 'touchstart', this );
  }
};

// trigger handler methods for events
proto.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// returns the touch that we're keeping track of
proto.getTouch = function( touches ) {
  for ( var i=0; i < touches.length; i++ ) {
    var touch = touches[i];
    if ( touch.identifier == this.pointerIdentifier ) {
      return touch;
    }
  }
};

// ----- start event ----- //

proto.onmousedown = function( event ) {
  // dismiss clicks from right or middle buttons
  var button = event.button;
  if ( button && ( button !== 0 && button !== 1 ) ) {
    return;
  }
  this._pointerDown( event, event );
};

proto.ontouchstart = function( event ) {
  this._pointerDown( event, event.changedTouches[0] );
};

proto.onpointerdown = function( event ) {
  this._pointerDown( event, event );
};

/**
 * pointer start
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto._pointerDown = function( event, pointer ) {
  // dismiss other pointers
  if ( this.isPointerDown ) {
    return;
  }

  this.isPointerDown = true;
  // save pointer identifier to match up touch events
  this.pointerIdentifier = pointer.pointerId !== undefined ?
    // pointerId for pointer events, touch.indentifier for touch events
    pointer.pointerId : pointer.identifier;

  this.pointerDown( event, pointer );
};

proto.pointerDown = function( event, pointer ) {
  this._bindPostStartEvents( event );
  this.emitEvent( 'pointerDown', [ event, pointer ] );
};

// hash of events to be bound after start event
var postStartEvents = {
  mousedown: [ 'mousemove', 'mouseup' ],
  touchstart: [ 'touchmove', 'touchend', 'touchcancel' ],
  pointerdown: [ 'pointermove', 'pointerup', 'pointercancel' ],
};

proto._bindPostStartEvents = function( event ) {
  if ( !event ) {
    return;
  }
  // get proper events to match start event
  var events = postStartEvents[ event.type ];
  // bind events to node
  events.forEach( function( eventName ) {
    window.addEventListener( eventName, this );
  }, this );
  // save these arguments
  this._boundPointerEvents = events;
};

proto._unbindPostStartEvents = function() {
  // check for _boundEvents, in case dragEnd triggered twice (old IE8 bug)
  if ( !this._boundPointerEvents ) {
    return;
  }
  this._boundPointerEvents.forEach( function( eventName ) {
    window.removeEventListener( eventName, this );
  }, this );

  delete this._boundPointerEvents;
};

// ----- move event ----- //

proto.onmousemove = function( event ) {
  this._pointerMove( event, event );
};

proto.onpointermove = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerMove( event, event );
  }
};

proto.ontouchmove = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerMove( event, touch );
  }
};

/**
 * pointer move
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
proto._pointerMove = function( event, pointer ) {
  this.pointerMove( event, pointer );
};

// public
proto.pointerMove = function( event, pointer ) {
  this.emitEvent( 'pointerMove', [ event, pointer ] );
};

// ----- end event ----- //


proto.onmouseup = function( event ) {
  this._pointerUp( event, event );
};

proto.onpointerup = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerUp( event, event );
  }
};

proto.ontouchend = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerUp( event, touch );
  }
};

/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
proto._pointerUp = function( event, pointer ) {
  this._pointerDone();
  this.pointerUp( event, pointer );
};

// public
proto.pointerUp = function( event, pointer ) {
  this.emitEvent( 'pointerUp', [ event, pointer ] );
};

// ----- pointer done ----- //

// triggered on pointer up & pointer cancel
proto._pointerDone = function() {
  // reset properties
  this.isPointerDown = false;
  delete this.pointerIdentifier;
  // remove events
  this._unbindPostStartEvents();
  this.pointerDone();
};

proto.pointerDone = noop;

// ----- pointer cancel ----- //

proto.onpointercancel = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerCancel( event, event );
  }
};

proto.ontouchcancel = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerCancel( event, touch );
  }
};

/**
 * pointer cancel
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
proto._pointerCancel = function( event, pointer ) {
  this._pointerDone();
  this.pointerCancel( event, pointer );
};

// public
proto.pointerCancel = function( event, pointer ) {
  this.emitEvent( 'pointerCancel', [ event, pointer ] );
};

// -----  ----- //

// utility function for getting x/y coords from event
Unipointer.getPointerPoint = function( pointer ) {
  return {
    x: pointer.pageX,
    y: pointer.pageY
  };
};

// -----  ----- //

return Unipointer;

}));

/*!
 * Unidragger v2.2.3
 * Draggable base class
 * MIT license
 */

/*jshint browser: true, unused: true, undef: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'unidragger/unidragger',[
      'unipointer/unipointer'
    ], function( Unipointer ) {
      return factory( window, Unipointer );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('unipointer')
    );
  } else {
    // browser global
    window.Unidragger = factory(
      window,
      window.Unipointer
    );
  }

}( window, function factory( window, Unipointer ) {



// -------------------------- Unidragger -------------------------- //

function Unidragger() {}

// inherit Unipointer & EvEmitter
var proto = Unidragger.prototype = Object.create( Unipointer.prototype );

// ----- bind start ----- //

proto.bindHandles = function() {
  this._bindHandles( true );
};

proto.unbindHandles = function() {
  this._bindHandles( false );
};

/**
 * works as unbinder, as you can .bindHandles( false ) to unbind
 * @param {Boolean} isBind - will unbind if falsey
 */
proto._bindHandles = function( isBind ) {
  // munge isBind, default to true
  isBind = isBind === undefined ? true : !!isBind;
  // bind each handle
  var bindMethod = isBind ? 'addEventListener' : 'removeEventListener';
  for ( var i=0; i < this.handles.length; i++ ) {
    var handle = this.handles[i];
    this._bindStartEvent( handle, isBind );
    handle[ bindMethod ]( 'click', this );
    // touch-action: none to override browser touch gestures
    // metafizzy/flickity#540
    if ( window.PointerEvent ) {
      handle.style.touchAction = isBind ? this._touchActionValue : '';
    }
  }
};

// prototype so it can be overwriteable by Flickity
proto._touchActionValue = 'none';

// ----- start event ----- //

/**
 * pointer start
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.pointerDown = function( event, pointer ) {
  // dismiss range sliders
  if ( event.target.nodeName == 'INPUT' && event.target.type == 'range' ) {
    // reset pointerDown logic
    this.isPointerDown = false;
    delete this.pointerIdentifier;
    return;
  }

  this._dragPointerDown( event, pointer );
  // kludge to blur focused inputs in dragger
  var focused = document.activeElement;
  if ( focused && focused.blur ) {
    focused.blur();
  }
  // bind move and end events
  this._bindPostStartEvents( event );
  this.emitEvent( 'pointerDown', [ event, pointer ] );
};

// base pointer down logic
proto._dragPointerDown = function( event, pointer ) {
  // track to see when dragging starts
  this.pointerDownPoint = Unipointer.getPointerPoint( pointer );

  var canPreventDefault = this.canPreventDefaultOnPointerDown( event, pointer );
  if ( canPreventDefault ) {
    event.preventDefault();
  }
};

// overwriteable method so Flickity can prevent for scrolling
proto.canPreventDefaultOnPointerDown = function( event ) {
  // prevent default, unless touchstart or <select>
  return event.target.nodeName != 'SELECT';
};

// ----- move event ----- //

/**
 * drag move
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.pointerMove = function( event, pointer ) {
  var moveVector = this._dragPointerMove( event, pointer );
  this.emitEvent( 'pointerMove', [ event, pointer, moveVector ] );
  this._dragMove( event, pointer, moveVector );
};

// base pointer move logic
proto._dragPointerMove = function( event, pointer ) {
  var movePoint = Unipointer.getPointerPoint( pointer );
  var moveVector = {
    x: movePoint.x - this.pointerDownPoint.x,
    y: movePoint.y - this.pointerDownPoint.y
  };
  // start drag if pointer has moved far enough to start drag
  if ( !this.isDragging && this.hasDragStarted( moveVector ) ) {
    this._dragStart( event, pointer );
  }
  return moveVector;
};

// condition if pointer has moved far enough to start drag
proto.hasDragStarted = function( moveVector ) {
  return Math.abs( moveVector.x ) > 3 || Math.abs( moveVector.y ) > 3;
};


// ----- end event ----- //

/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.pointerUp = function( event, pointer ) {
  this.emitEvent( 'pointerUp', [ event, pointer ] );
  this._dragPointerUp( event, pointer );
};

proto._dragPointerUp = function( event, pointer ) {
  if ( this.isDragging ) {
    this._dragEnd( event, pointer );
  } else {
    // pointer didn't move enough for drag to start
    this._staticClick( event, pointer );
  }
};

// -------------------------- drag -------------------------- //

// dragStart
proto._dragStart = function( event, pointer ) {
  this.isDragging = true;
  this.dragStartPoint = Unipointer.getPointerPoint( pointer );
  // prevent clicks
  this.isPreventingClicks = true;

  this.dragStart( event, pointer );
};

proto.dragStart = function( event, pointer ) {
  this.emitEvent( 'dragStart', [ event, pointer ] );
};

// dragMove
proto._dragMove = function( event, pointer, moveVector ) {
  // do not drag if not dragging yet
  if ( !this.isDragging ) {
    return;
  }

  this.dragMove( event, pointer, moveVector );
};

proto.dragMove = function( event, pointer, moveVector ) {
  event.preventDefault();
  this.emitEvent( 'dragMove', [ event, pointer, moveVector ] );
};

// dragEnd
proto._dragEnd = function( event, pointer ) {
  // set flags
  this.isDragging = false;
  // re-enable clicking async
  setTimeout( function() {
    delete this.isPreventingClicks;
  }.bind( this ) );

  this.dragEnd( event, pointer );
};

proto.dragEnd = function( event, pointer ) {
  this.emitEvent( 'dragEnd', [ event, pointer ] );
};

// ----- onclick ----- //

// handle all clicks and prevent clicks when dragging
proto.onclick = function( event ) {
  if ( this.isPreventingClicks ) {
    event.preventDefault();
  }
};

// ----- staticClick ----- //

// triggered after pointer down & up with no/tiny movement
proto._staticClick = function( event, pointer ) {
  // ignore emulated mouse up clicks
  if ( this.isIgnoringMouseUp && event.type == 'mouseup' ) {
    return;
  }

  // allow click in <input>s and <textarea>s
  var nodeName = event.target.nodeName;
  if ( nodeName == 'INPUT' || nodeName == 'TEXTAREA' ) {
    event.target.focus();
  }
  this.staticClick( event, pointer );

  // set flag for emulated clicks 300ms after touchend
  if ( event.type != 'mouseup' ) {
    this.isIgnoringMouseUp = true;
    // reset flag after 300ms
    setTimeout( function() {
      delete this.isIgnoringMouseUp;
    }.bind( this ), 400 );
  }
};

proto.staticClick = function( event, pointer ) {
  this.emitEvent( 'staticClick', [ event, pointer ] );
};

// ----- utils ----- //

Unidragger.getPointerPoint = Unipointer.getPointerPoint;

// -----  ----- //

return Unidragger;

}));

// drag
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/drag',[
      './flickity',
      'unidragger/unidragger',
      'fizzy-ui-utils/utils'
    ], function( Flickity, Unidragger, utils ) {
      return factory( window, Flickity, Unidragger, utils );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('./flickity'),
      require('unidragger'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Flickity = factory(
      window,
      window.Flickity,
      window.Unidragger,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, Flickity, Unidragger, utils ) {



// ----- defaults ----- //

utils.extend( Flickity.defaults, {
  draggable: true,
  dragThreshold: 3,
});

// ----- create ----- //

Flickity.createMethods.push('_createDrag');

// -------------------------- drag prototype -------------------------- //

var proto = Flickity.prototype;
utils.extend( proto, Unidragger.prototype );
proto._touchActionValue = 'pan-y';

// --------------------------  -------------------------- //

var isTouch = 'createTouch' in document;
var isTouchmoveScrollCanceled = false;

proto._createDrag = function() {
  this.on( 'activate', this.bindDrag );
  this.on( 'uiChange', this._uiChangeDrag );
  this.on( 'childUIPointerDown', this._childUIPointerDownDrag );
  this.on( 'deactivate', this.unbindDrag );
  // HACK - add seemingly innocuous handler to fix iOS 10 scroll behavior
  // #457, RubaXa/Sortable#973
  if ( isTouch && !isTouchmoveScrollCanceled ) {
    window.addEventListener( 'touchmove', function() {});
    isTouchmoveScrollCanceled = true;
  }
};

proto.bindDrag = function() {
  if ( !this.options.draggable || this.isDragBound ) {
    return;
  }
  this.element.classList.add('is-draggable');
  this.handles = [ this.viewport ];
  this.bindHandles();
  this.isDragBound = true;
};

proto.unbindDrag = function() {
  if ( !this.isDragBound ) {
    return;
  }
  this.element.classList.remove('is-draggable');
  this.unbindHandles();
  delete this.isDragBound;
};

proto._uiChangeDrag = function() {
  delete this.isFreeScrolling;
};

proto._childUIPointerDownDrag = function( event ) {
  event.preventDefault();
  this.pointerDownFocus( event );
};

// -------------------------- pointer events -------------------------- //

// nodes that have text fields
var cursorNodes = {
  TEXTAREA: true,
  INPUT: true,
  OPTION: true,
};

// input types that do not have text fields
var clickTypes = {
  radio: true,
  checkbox: true,
  button: true,
  submit: true,
  image: true,
  file: true,
};

proto.pointerDown = function( event, pointer ) {
  // dismiss inputs with text fields. #403, #404
  var isCursorInput = cursorNodes[ event.target.nodeName ] &&
    !clickTypes[ event.target.type ];
  if ( isCursorInput ) {
    // reset pointerDown logic
    this.isPointerDown = false;
    delete this.pointerIdentifier;
    return;
  }

  this._dragPointerDown( event, pointer );

  // kludge to blur focused inputs in dragger
  var focused = document.activeElement;
  if ( focused && focused.blur && focused != this.element &&
    // do not blur body for IE9 & 10, #117
    focused != document.body ) {
    focused.blur();
  }
  this.pointerDownFocus( event );
  // stop if it was moving
  this.dragX = this.x;
  this.viewport.classList.add('is-pointer-down');
  // bind move and end events
  this._bindPostStartEvents( event );
  // track scrolling
  this.pointerDownScroll = getScrollPosition();
  window.addEventListener( 'scroll', this );

  this.dispatchEvent( 'pointerDown', event, [ pointer ] );
};

proto.pointerDownFocus = function( event ) {
  // focus element, if not touch, and its not an input or select
  var canPointerDown = getCanPointerDown( event );
  if ( !this.options.accessibility || canPointerDown ) {
    return;
  }
  var prevScrollY = window.pageYOffset;
  this.element.focus();
  // hack to fix scroll jump after focus, #76
  if ( window.pageYOffset != prevScrollY ) {
    window.scrollTo( window.pageXOffset, prevScrollY );
  }
};

var touchStartEvents = {
  touchstart: true,
  pointerdown: true,
};

var focusNodes = {
  INPUT: true,
  SELECT: true,
};

function getCanPointerDown( event ) {
  var isTouchStart = touchStartEvents[ event.type ];
  var isFocusNode = focusNodes[ event.target.nodeName ];
  return isTouchStart || isFocusNode;
}

proto.canPreventDefaultOnPointerDown = function( event ) {
  // prevent default, unless touchstart or input
  var canPointerDown = getCanPointerDown( event );
  return !canPointerDown;
};

// ----- move ----- //

proto.hasDragStarted = function( moveVector ) {
  return Math.abs( moveVector.x ) > this.options.dragThreshold;
};

// ----- up ----- //

proto.pointerUp = function( event, pointer ) {
  delete this.isTouchScrolling;
  this.viewport.classList.remove('is-pointer-down');
  this.dispatchEvent( 'pointerUp', event, [ pointer ] );
  this._dragPointerUp( event, pointer );
};

proto.pointerDone = function() {
  window.removeEventListener( 'scroll', this );
  delete this.pointerDownScroll;
};

// -------------------------- dragging -------------------------- //

proto.dragStart = function( event, pointer ) {
  this.dragStartPosition = this.x;
  this.startAnimation();
  window.removeEventListener( 'scroll', this );
  this.dispatchEvent( 'dragStart', event, [ pointer ] );
};

proto.pointerMove = function( event, pointer ) {
  var moveVector = this._dragPointerMove( event, pointer );
  this.dispatchEvent( 'pointerMove', event, [ pointer, moveVector ] );
  this._dragMove( event, pointer, moveVector );
};

proto.dragMove = function( event, pointer, moveVector ) {
  event.preventDefault();

  this.previousDragX = this.dragX;
  // reverse if right-to-left
  var direction = this.options.rightToLeft ? -1 : 1;
  var dragX = this.dragStartPosition + moveVector.x * direction;

  if ( !this.options.wrapAround && this.slides.length ) {
    // slow drag
    var originBound = Math.max( -this.slides[0].target, this.dragStartPosition );
    dragX = dragX > originBound ? ( dragX + originBound ) * 0.5 : dragX;
    var endBound = Math.min( -this.getLastSlide().target, this.dragStartPosition );
    dragX = dragX < endBound ? ( dragX + endBound ) * 0.5 : dragX;
  }

  this.dragX = dragX;

  this.dragMoveTime = new Date();
  this.dispatchEvent( 'dragMove', event, [ pointer, moveVector ] );
};

proto.dragEnd = function( event, pointer ) {
  if ( this.options.freeScroll ) {
    this.isFreeScrolling = true;
  }
  // set selectedIndex based on where flick will end up
  var index = this.dragEndRestingSelect();

  if ( this.options.freeScroll && !this.options.wrapAround ) {
    // if free-scroll & not wrap around
    // do not free-scroll if going outside of bounding slides
    // so bounding slides can attract slider, and keep it in bounds
    var restingX = this.getRestingPosition();
    this.isFreeScrolling = -restingX > this.slides[0].target &&
      -restingX < this.getLastSlide().target;
  } else if ( !this.options.freeScroll && index == this.selectedIndex ) {
    // boost selection if selected index has not changed
    index += this.dragEndBoostSelect();
  }
  delete this.previousDragX;
  // apply selection
  // TODO refactor this, selecting here feels weird
  // HACK, set flag so dragging stays in correct direction
  this.isDragSelect = this.options.wrapAround;
  this.select( index );
  delete this.isDragSelect;
  this.dispatchEvent( 'dragEnd', event, [ pointer ] );
};

proto.dragEndRestingSelect = function() {
  var restingX = this.getRestingPosition();
  // how far away from selected slide
  var distance = Math.abs( this.getSlideDistance( -restingX, this.selectedIndex ) );
  // get closet resting going up and going down
  var positiveResting = this._getClosestResting( restingX, distance, 1 );
  var negativeResting = this._getClosestResting( restingX, distance, -1 );
  // use closer resting for wrap-around
  var index = positiveResting.distance < negativeResting.distance ?
    positiveResting.index : negativeResting.index;
  return index;
};

/**
 * given resting X and distance to selected cell
 * get the distance and index of the closest cell
 * @param {Number} restingX - estimated post-flick resting position
 * @param {Number} distance - distance to selected cell
 * @param {Integer} increment - +1 or -1, going up or down
 * @returns {Object} - { distance: {Number}, index: {Integer} }
 */
proto._getClosestResting = function( restingX, distance, increment ) {
  var index = this.selectedIndex;
  var minDistance = Infinity;
  var condition = this.options.contain && !this.options.wrapAround ?
    // if contain, keep going if distance is equal to minDistance
    function( d, md ) { return d <= md; } : function( d, md ) { return d < md; };
  while ( condition( distance, minDistance ) ) {
    // measure distance to next cell
    index += increment;
    minDistance = distance;
    distance = this.getSlideDistance( -restingX, index );
    if ( distance === null ) {
      break;
    }
    distance = Math.abs( distance );
  }
  return {
    distance: minDistance,
    // selected was previous index
    index: index - increment
  };
};

/**
 * measure distance between x and a slide target
 * @param {Number} x
 * @param {Integer} index - slide index
 */
proto.getSlideDistance = function( x, index ) {
  var len = this.slides.length;
  // wrap around if at least 2 slides
  var isWrapAround = this.options.wrapAround && len > 1;
  var slideIndex = isWrapAround ? utils.modulo( index, len ) : index;
  var slide = this.slides[ slideIndex ];
  if ( !slide ) {
    return null;
  }
  // add distance for wrap-around slides
  var wrap = isWrapAround ? this.slideableWidth * Math.floor( index / len ) : 0;
  return x - ( slide.target + wrap );
};

proto.dragEndBoostSelect = function() {
  // do not boost if no previousDragX or dragMoveTime
  if ( this.previousDragX === undefined || !this.dragMoveTime ||
    // or if drag was held for 100 ms
    new Date() - this.dragMoveTime > 100 ) {
    return 0;
  }

  var distance = this.getSlideDistance( -this.dragX, this.selectedIndex );
  var delta = this.previousDragX - this.dragX;
  if ( distance > 0 && delta > 0 ) {
    // boost to next if moving towards the right, and positive velocity
    return 1;
  } else if ( distance < 0 && delta < 0 ) {
    // boost to previous if moving towards the left, and negative velocity
    return -1;
  }
  return 0;
};

// ----- staticClick ----- //

proto.staticClick = function( event, pointer ) {
  // get clickedCell, if cell was clicked
  var clickedCell = this.getParentCell( event.target );
  var cellElem = clickedCell && clickedCell.element;
  var cellIndex = clickedCell && this.cells.indexOf( clickedCell );
  this.dispatchEvent( 'staticClick', event, [ pointer, cellElem, cellIndex ] );
};

// ----- scroll ----- //

proto.onscroll = function() {
  var scroll = getScrollPosition();
  var scrollMoveX = this.pointerDownScroll.x - scroll.x;
  var scrollMoveY = this.pointerDownScroll.y - scroll.y;
  // cancel click/tap if scroll is too much
  if ( Math.abs( scrollMoveX ) > 3 || Math.abs( scrollMoveY ) > 3 ) {
    this._pointerDone();
  }
};

// ----- utils ----- //

function getScrollPosition() {
  return {
    x: window.pageXOffset,
    y: window.pageYOffset
  };
}

// -----  ----- //

return Flickity;

}));

/*!
 * Tap listener v2.0.0
 * listens to taps
 * MIT license
 */

/*jshint browser: true, unused: true, undef: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false*/ /*globals define, module, require */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'tap-listener/tap-listener',[
      'unipointer/unipointer'
    ], function( Unipointer ) {
      return factory( window, Unipointer );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('unipointer')
    );
  } else {
    // browser global
    window.TapListener = factory(
      window,
      window.Unipointer
    );
  }

}( window, function factory( window, Unipointer ) {



// --------------------------  TapListener -------------------------- //

function TapListener( elem ) {
  this.bindTap( elem );
}

// inherit Unipointer & EventEmitter
var proto = TapListener.prototype = Object.create( Unipointer.prototype );

/**
 * bind tap event to element
 * @param {Element} elem
 */
proto.bindTap = function( elem ) {
  if ( !elem ) {
    return;
  }
  this.unbindTap();
  this.tapElement = elem;
  this._bindStartEvent( elem, true );
};

proto.unbindTap = function() {
  if ( !this.tapElement ) {
    return;
  }
  this._bindStartEvent( this.tapElement, true );
  delete this.tapElement;
};

/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
proto.pointerUp = function( event, pointer ) {
  // ignore emulated mouse up clicks
  if ( this.isIgnoringMouseUp && event.type == 'mouseup' ) {
    return;
  }

  var pointerPoint = Unipointer.getPointerPoint( pointer );
  var boundingRect = this.tapElement.getBoundingClientRect();
  var scrollX = window.pageXOffset;
  var scrollY = window.pageYOffset;
  // calculate if pointer is inside tapElement
  var isInside = pointerPoint.x >= boundingRect.left + scrollX &&
    pointerPoint.x <= boundingRect.right + scrollX &&
    pointerPoint.y >= boundingRect.top + scrollY &&
    pointerPoint.y <= boundingRect.bottom + scrollY;
  // trigger callback if pointer is inside element
  if ( isInside ) {
    this.emitEvent( 'tap', [ event, pointer ] );
  }

  // set flag for emulated clicks 300ms after touchend
  if ( event.type != 'mouseup' ) {
    this.isIgnoringMouseUp = true;
    // reset flag after 300ms
    var _this = this;
    setTimeout( function() {
      delete _this.isIgnoringMouseUp;
    }, 400 );
  }
};

proto.destroy = function() {
  this.pointerDone();
  this.unbindTap();
};

// -----  ----- //

return TapListener;

}));

// prev/next buttons
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/prev-next-button',[
      './flickity',
      'tap-listener/tap-listener',
      'fizzy-ui-utils/utils'
    ], function( Flickity, TapListener, utils ) {
      return factory( window, Flickity, TapListener, utils );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('./flickity'),
      require('tap-listener'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    factory(
      window,
      window.Flickity,
      window.TapListener,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, Flickity, TapListener, utils ) {
'use strict';

var svgURI = 'http://www.w3.org/2000/svg';

// -------------------------- PrevNextButton -------------------------- //

function PrevNextButton( direction, parent ) {
  this.direction = direction;
  this.parent = parent;
  this._create();
}

PrevNextButton.prototype = new TapListener();

PrevNextButton.prototype._create = function() {
  // properties
  this.isEnabled = true;
  this.isPrevious = this.direction == -1;
  var leftDirection = this.parent.options.rightToLeft ? 1 : -1;
  this.isLeft = this.direction == leftDirection;

  var element = this.element = document.createElement('button');
  element.className = 'flickity-prev-next-button';
  element.className += this.isPrevious ? ' previous' : ' next';
  // prevent button from submitting form http://stackoverflow.com/a/10836076/182183
  element.setAttribute( 'type', 'button' );
  // init as disabled
  this.disable();

  element.setAttribute( 'aria-label', this.isPrevious ? 'previous' : 'next' );

  // create arrow
  var svg = this.createSVG();
  element.appendChild( svg );
  // events
  this.on( 'tap', this.onTap );
  this.parent.on( 'select', this.update.bind( this ) );
  this.on( 'pointerDown', this.parent.childUIPointerDown.bind( this.parent ) );
};

PrevNextButton.prototype.activate = function() {
  this.bindTap( this.element );
  // click events from keyboard
  this.element.addEventListener( 'click', this );
  // add to DOM
  this.parent.element.appendChild( this.element );
};

PrevNextButton.prototype.deactivate = function() {
  // remove from DOM
  this.parent.element.removeChild( this.element );
  // do regular TapListener destroy
  TapListener.prototype.destroy.call( this );
  // click events from keyboard
  this.element.removeEventListener( 'click', this );
};

PrevNextButton.prototype.createSVG = function() {
  var svg = document.createElementNS( svgURI, 'svg');
  svg.setAttribute( 'viewBox', '0 0 100 100' );
  var path = document.createElementNS( svgURI, 'path');
  var pathMovements = getArrowMovements( this.parent.options.arrowShape );
  path.setAttribute( 'd', pathMovements );
  path.setAttribute( 'class', 'arrow' );
  // rotate arrow
  if ( !this.isLeft ) {
    path.setAttribute( 'transform', 'translate(100, 100) rotate(180) ' );
  }
  svg.appendChild( path );
  return svg;
};

// get SVG path movmement
function getArrowMovements( shape ) {
  // use shape as movement if string
  if ( typeof shape == 'string' ) {
    return shape;
  }
  // create movement string
  return 'M ' + shape.x0 + ',50' +
    ' L ' + shape.x1 + ',' + ( shape.y1 + 50 ) +
    ' L ' + shape.x2 + ',' + ( shape.y2 + 50 ) +
    ' L ' + shape.x3 + ',50 ' +
    ' L ' + shape.x2 + ',' + ( 50 - shape.y2 ) +
    ' L ' + shape.x1 + ',' + ( 50 - shape.y1 ) +
    ' Z';
}

PrevNextButton.prototype.onTap = function() {
  if ( !this.isEnabled ) {
    return;
  }
  this.parent.uiChange();
  var method = this.isPrevious ? 'previous' : 'next';
  this.parent[ method ]();
};

PrevNextButton.prototype.handleEvent = utils.handleEvent;

PrevNextButton.prototype.onclick = function() {
  // only allow clicks from keyboard
  var focused = document.activeElement;
  if ( focused && focused == this.element ) {
    this.onTap();
  }
};

// -----  ----- //

PrevNextButton.prototype.enable = function() {
  if ( this.isEnabled ) {
    return;
  }
  this.element.disabled = false;
  this.isEnabled = true;
};

PrevNextButton.prototype.disable = function() {
  if ( !this.isEnabled ) {
    return;
  }
  this.element.disabled = true;
  this.isEnabled = false;
};

PrevNextButton.prototype.update = function() {
  // index of first or last slide, if previous or next
  var slides = this.parent.slides;
  // enable is wrapAround and at least 2 slides
  if ( this.parent.options.wrapAround && slides.length > 1 ) {
    this.enable();
    return;
  }
  var lastIndex = slides.length ? slides.length - 1 : 0;
  var boundIndex = this.isPrevious ? 0 : lastIndex;
  var method = this.parent.selectedIndex == boundIndex ? 'disable' : 'enable';
  this[ method ]();
};

PrevNextButton.prototype.destroy = function() {
  this.deactivate();
};

// -------------------------- Flickity prototype -------------------------- //

utils.extend( Flickity.defaults, {
  prevNextButtons: true,
  arrowShape: {
    x0: 10,
    x1: 60, y1: 50,
    x2: 70, y2: 40,
    x3: 30
  }
});

Flickity.createMethods.push('_createPrevNextButtons');
var proto = Flickity.prototype;

proto._createPrevNextButtons = function() {
  if ( !this.options.prevNextButtons ) {
    return;
  }

  this.prevButton = new PrevNextButton( -1, this );
  this.nextButton = new PrevNextButton( 1, this );

  this.on( 'activate', this.activatePrevNextButtons );
};

proto.activatePrevNextButtons = function() {
  this.prevButton.activate();
  this.nextButton.activate();
  this.on( 'deactivate', this.deactivatePrevNextButtons );
};

proto.deactivatePrevNextButtons = function() {
  this.prevButton.deactivate();
  this.nextButton.deactivate();
  this.off( 'deactivate', this.deactivatePrevNextButtons );
};

// --------------------------  -------------------------- //

Flickity.PrevNextButton = PrevNextButton;

return Flickity;

}));

// page dots
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/page-dots',[
      './flickity',
      'tap-listener/tap-listener',
      'fizzy-ui-utils/utils'
    ], function( Flickity, TapListener, utils ) {
      return factory( window, Flickity, TapListener, utils );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('./flickity'),
      require('tap-listener'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    factory(
      window,
      window.Flickity,
      window.TapListener,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, Flickity, TapListener, utils ) {

// -------------------------- PageDots -------------------------- //



function PageDots( parent ) {
  this.parent = parent;
  this._create();
}

PageDots.prototype = new TapListener();

PageDots.prototype._create = function() {
  // create holder element
  this.holder = document.createElement('ol');
  this.holder.className = 'flickity-page-dots';
  // create dots, array of elements
  this.dots = [];
  // events
  this.on( 'tap', this.onTap );
  this.on( 'pointerDown', this.parent.childUIPointerDown.bind( this.parent ) );
};

PageDots.prototype.activate = function() {
  this.setDots();
  this.bindTap( this.holder );
  // add to DOM
  this.parent.element.appendChild( this.holder );
};

PageDots.prototype.deactivate = function() {
  // remove from DOM
  this.parent.element.removeChild( this.holder );
  TapListener.prototype.destroy.call( this );
};

PageDots.prototype.setDots = function() {
  // get difference between number of slides and number of dots
  var delta = this.parent.slides.length - this.dots.length;
  if ( delta > 0 ) {
    this.addDots( delta );
  } else if ( delta < 0 ) {
    this.removeDots( -delta );
  }
};

PageDots.prototype.addDots = function( count ) {
  var fragment = document.createDocumentFragment();
  var newDots = [];
  while ( count ) {
    var dot = document.createElement('li');
    dot.className = 'dot';
    fragment.appendChild( dot );
    newDots.push( dot );
    count--;
  }
  this.holder.appendChild( fragment );
  this.dots = this.dots.concat( newDots );
};

PageDots.prototype.removeDots = function( count ) {
  // remove from this.dots collection
  var removeDots = this.dots.splice( this.dots.length - count, count );
  // remove from DOM
  removeDots.forEach( function( dot ) {
    this.holder.removeChild( dot );
  }, this );
};

PageDots.prototype.updateSelected = function() {
  // remove selected class on previous
  if ( this.selectedDot ) {
    this.selectedDot.className = 'dot';
  }
  // don't proceed if no dots
  if ( !this.dots.length ) {
    return;
  }
  this.selectedDot = this.dots[ this.parent.selectedIndex ];
  this.selectedDot.className = 'dot is-selected';
};

PageDots.prototype.onTap = function( event ) {
  var target = event.target;
  // only care about dot clicks
  if ( target.nodeName != 'LI' ) {
    return;
  }

  this.parent.uiChange();
  var index = this.dots.indexOf( target );
  this.parent.select( index );
};

PageDots.prototype.destroy = function() {
  this.deactivate();
};

Flickity.PageDots = PageDots;

// -------------------------- Flickity -------------------------- //

utils.extend( Flickity.defaults, {
  pageDots: true
});

Flickity.createMethods.push('_createPageDots');

var proto = Flickity.prototype;

proto._createPageDots = function() {
  if ( !this.options.pageDots ) {
    return;
  }
  this.pageDots = new PageDots( this );
  // events
  this.on( 'activate', this.activatePageDots );
  this.on( 'select', this.updateSelectedPageDots );
  this.on( 'cellChange', this.updatePageDots );
  this.on( 'resize', this.updatePageDots );
  this.on( 'deactivate', this.deactivatePageDots );
};

proto.activatePageDots = function() {
  this.pageDots.activate();
};

proto.updateSelectedPageDots = function() {
  this.pageDots.updateSelected();
};

proto.updatePageDots = function() {
  this.pageDots.setDots();
};

proto.deactivatePageDots = function() {
  this.pageDots.deactivate();
};

// -----  ----- //

Flickity.PageDots = PageDots;

return Flickity;

}));

// player & autoPlay
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/player',[
      'ev-emitter/ev-emitter',
      'fizzy-ui-utils/utils',
      './flickity'
    ], function( EvEmitter, utils, Flickity ) {
      return factory( EvEmitter, utils, Flickity );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('ev-emitter'),
      require('fizzy-ui-utils'),
      require('./flickity')
    );
  } else {
    // browser global
    factory(
      window.EvEmitter,
      window.fizzyUIUtils,
      window.Flickity
    );
  }

}( window, function factory( EvEmitter, utils, Flickity ) {



// -------------------------- Page Visibility -------------------------- //
// https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API

var hiddenProperty, visibilityEvent;
if ( 'hidden' in document ) {
  hiddenProperty = 'hidden';
  visibilityEvent = 'visibilitychange';
} else if ( 'webkitHidden' in document ) {
  hiddenProperty = 'webkitHidden';
  visibilityEvent = 'webkitvisibilitychange';
}

// -------------------------- Player -------------------------- //

function Player( parent ) {
  this.parent = parent;
  this.state = 'stopped';
  // visibility change event handler
  if ( visibilityEvent ) {
    this.onVisibilityChange = function() {
      this.visibilityChange();
    }.bind( this );
    this.onVisibilityPlay = function() {
      this.visibilityPlay();
    }.bind( this );
  }
}

Player.prototype = Object.create( EvEmitter.prototype );

// start play
Player.prototype.play = function() {
  if ( this.state == 'playing' ) {
    return;
  }
  // do not play if page is hidden, start playing when page is visible
  var isPageHidden = document[ hiddenProperty ];
  if ( visibilityEvent && isPageHidden ) {
    document.addEventListener( visibilityEvent, this.onVisibilityPlay );
    return;
  }

  this.state = 'playing';
  // listen to visibility change
  if ( visibilityEvent ) {
    document.addEventListener( visibilityEvent, this.onVisibilityChange );
  }
  // start ticking
  this.tick();
};

Player.prototype.tick = function() {
  // do not tick if not playing
  if ( this.state != 'playing' ) {
    return;
  }

  var time = this.parent.options.autoPlay;
  // default to 3 seconds
  time = typeof time == 'number' ? time : 3000;
  var _this = this;
  // HACK: reset ticks if stopped and started within interval
  this.clear();
  this.timeout = setTimeout( function() {
    _this.parent.next( true );
    _this.tick();
  }, time );
};

Player.prototype.stop = function() {
  this.state = 'stopped';
  this.clear();
  // remove visibility change event
  if ( visibilityEvent ) {
    document.removeEventListener( visibilityEvent, this.onVisibilityChange );
  }
};

Player.prototype.clear = function() {
  clearTimeout( this.timeout );
};

Player.prototype.pause = function() {
  if ( this.state == 'playing' ) {
    this.state = 'paused';
    this.clear();
  }
};

Player.prototype.unpause = function() {
  // re-start play if paused
  if ( this.state == 'paused' ) {
    this.play();
  }
};

// pause if page visibility is hidden, unpause if visible
Player.prototype.visibilityChange = function() {
  var isPageHidden = document[ hiddenProperty ];
  this[ isPageHidden ? 'pause' : 'unpause' ]();
};

Player.prototype.visibilityPlay = function() {
  this.play();
  document.removeEventListener( visibilityEvent, this.onVisibilityPlay );
};

// -------------------------- Flickity -------------------------- //

utils.extend( Flickity.defaults, {
  pauseAutoPlayOnHover: true
});

Flickity.createMethods.push('_createPlayer');
var proto = Flickity.prototype;

proto._createPlayer = function() {
  this.player = new Player( this );

  this.on( 'activate', this.activatePlayer );
  this.on( 'uiChange', this.stopPlayer );
  this.on( 'pointerDown', this.stopPlayer );
  this.on( 'deactivate', this.deactivatePlayer );
};

proto.activatePlayer = function() {
  if ( !this.options.autoPlay ) {
    return;
  }
  this.player.play();
  this.element.addEventListener( 'mouseenter', this );
};

// Player API, don't hate the ... thanks I know where the door is

proto.playPlayer = function() {
  this.player.play();
};

proto.stopPlayer = function() {
  this.player.stop();
};

proto.pausePlayer = function() {
  this.player.pause();
};

proto.unpausePlayer = function() {
  this.player.unpause();
};

proto.deactivatePlayer = function() {
  this.player.stop();
  this.element.removeEventListener( 'mouseenter', this );
};

// ----- mouseenter/leave ----- //

// pause auto-play on hover
proto.onmouseenter = function() {
  if ( !this.options.pauseAutoPlayOnHover ) {
    return;
  }
  this.player.pause();
  this.element.addEventListener( 'mouseleave', this );
};

// resume auto-play on hover off
proto.onmouseleave = function() {
  this.player.unpause();
  this.element.removeEventListener( 'mouseleave', this );
};

// -----  ----- //

Flickity.Player = Player;

return Flickity;

}));

// add, remove cell
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/add-remove-cell',[
      './flickity',
      'fizzy-ui-utils/utils'
    ], function( Flickity, utils ) {
      return factory( window, Flickity, utils );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('./flickity'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    factory(
      window,
      window.Flickity,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, Flickity, utils ) {



// append cells to a document fragment
function getCellsFragment( cells ) {
  var fragment = document.createDocumentFragment();
  cells.forEach( function( cell ) {
    fragment.appendChild( cell.element );
  });
  return fragment;
}

// -------------------------- add/remove cell prototype -------------------------- //

var proto = Flickity.prototype;

/**
 * Insert, prepend, or append cells
 * @param {Element, Array, NodeList} elems
 * @param {Integer} index
 */
proto.insert = function( elems, index ) {
  var cells = this._makeCells( elems );
  if ( !cells || !cells.length ) {
    return;
  }
  var len = this.cells.length;
  // default to append
  index = index === undefined ? len : index;
  // add cells with document fragment
  var fragment = getCellsFragment( cells );
  // append to slider
  var isAppend = index == len;
  if ( isAppend ) {
    this.slider.appendChild( fragment );
  } else {
    var insertCellElement = this.cells[ index ].element;
    this.slider.insertBefore( fragment, insertCellElement );
  }
  // add to this.cells
  if ( index === 0 ) {
    // prepend, add to start
    this.cells = cells.concat( this.cells );
  } else if ( isAppend ) {
    // append, add to end
    this.cells = this.cells.concat( cells );
  } else {
    // insert in this.cells
    var endCells = this.cells.splice( index, len - index );
    this.cells = this.cells.concat( cells ).concat( endCells );
  }

  this._sizeCells( cells );

  var selectedIndexDelta = index > this.selectedIndex ? 0 : cells.length;
  this._cellAddedRemoved( index, selectedIndexDelta );
};

proto.append = function( elems ) {
  this.insert( elems, this.cells.length );
};

proto.prepend = function( elems ) {
  this.insert( elems, 0 );
};

/**
 * Remove cells
 * @param {Element, Array, NodeList} elems
 */
proto.remove = function( elems ) {
  var cells = this.getCells( elems );
  var selectedIndexDelta = 0;
  var len = cells.length;
  var i, cell;
  // calculate selectedIndexDelta, easier if done in seperate loop
  for ( i=0; i < len; i++ ) {
    cell = cells[i];
    var wasBefore = this.cells.indexOf( cell ) < this.selectedIndex;
    selectedIndexDelta -= wasBefore ? 1 : 0;
  }

  for ( i=0; i < len; i++ ) {
    cell = cells[i];
    cell.remove();
    // remove item from collection
    utils.removeFrom( this.cells, cell );
  }

  if ( cells.length ) {
    // update stuff
    this._cellAddedRemoved( 0, selectedIndexDelta );
  }
};

// updates when cells are added or removed
proto._cellAddedRemoved = function( changedCellIndex, selectedIndexDelta ) {
  // TODO this math isn't perfect with grouped slides
  selectedIndexDelta = selectedIndexDelta || 0;
  this.selectedIndex += selectedIndexDelta;
  this.selectedIndex = Math.max( 0, Math.min( this.slides.length - 1, this.selectedIndex ) );

  this.cellChange( changedCellIndex, true );
  // backwards compatibility
  this.emitEvent( 'cellAddedRemoved', [ changedCellIndex, selectedIndexDelta ] );
};

/**
 * logic to be run after a cell's size changes
 * @param {Element} elem - cell's element
 */
proto.cellSizeChange = function( elem ) {
  var cell = this.getCell( elem );
  if ( !cell ) {
    return;
  }
  cell.getSize();

  var index = this.cells.indexOf( cell );
  this.cellChange( index );
};

/**
 * logic any time a cell is changed: added, removed, or size changed
 * @param {Integer} changedCellIndex - index of the changed cell, optional
 */
proto.cellChange = function( changedCellIndex, isPositioningSlider ) {
  var prevSlideableWidth = this.slideableWidth;
  this._positionCells( changedCellIndex );
  this._getWrapShiftCells();
  this.setGallerySize();
  this.emitEvent( 'cellChange', [ changedCellIndex ] );
  // position slider
  if ( this.options.freeScroll ) {
    // shift x by change in slideableWidth
    // TODO fix position shifts when prepending w/ freeScroll
    var deltaX = prevSlideableWidth - this.slideableWidth;
    this.x += deltaX * this.cellAlign;
    this.positionSlider();
  } else {
    // do not position slider after lazy load
    if ( isPositioningSlider ) {
      this.positionSliderAtSelected();
    }
    this.select( this.selectedIndex );
  }
};

// -----  ----- //

return Flickity;

}));

// lazyload
( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/lazyload',[
      './flickity',
      'fizzy-ui-utils/utils'
    ], function( Flickity, utils ) {
      return factory( window, Flickity, utils );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('./flickity'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    factory(
      window,
      window.Flickity,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, Flickity, utils ) {
'use strict';

Flickity.createMethods.push('_createLazyload');
var proto = Flickity.prototype;

proto._createLazyload = function() {
  this.on( 'select', this.lazyLoad );
};

proto.lazyLoad = function() {
  var lazyLoad = this.options.lazyLoad;
  if ( !lazyLoad ) {
    return;
  }
  // get adjacent cells, use lazyLoad option for adjacent count
  var adjCount = typeof lazyLoad == 'number' ? lazyLoad : 0;
  var cellElems = this.getAdjacentCellElements( adjCount );
  // get lazy images in those cells
  var lazyImages = [];
  cellElems.forEach( function( cellElem ) {
    var lazyCellImages = getCellLazyImages( cellElem );
    lazyImages = lazyImages.concat( lazyCellImages );
  });
  // load lazy images
  lazyImages.forEach( function( img ) {
    new LazyLoader( img, this );
  }, this );
};

function getCellLazyImages( cellElem ) {
  // check if cell element is lazy image
  if ( cellElem.nodeName == 'IMG' &&
    cellElem.getAttribute('data-flickity-lazyload') ) {
    return [ cellElem ];
  }
  // select lazy images in cell
  var imgs = cellElem.querySelectorAll('img[data-flickity-lazyload]');
  return utils.makeArray( imgs );
}

// -------------------------- LazyLoader -------------------------- //

/**
 * class to handle loading images
 */
function LazyLoader( img, flickity ) {
  this.img = img;
  this.flickity = flickity;
  this.load();
}

LazyLoader.prototype.handleEvent = utils.handleEvent;

LazyLoader.prototype.load = function() {
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  // load image
  this.img.src = this.img.getAttribute('data-flickity-lazyload');
  // remove attr
  this.img.removeAttribute('data-flickity-lazyload');
};

LazyLoader.prototype.onload = function( event ) {
  this.complete( event, 'flickity-lazyloaded' );
};

LazyLoader.prototype.onerror = function( event ) {
  this.complete( event, 'flickity-lazyerror' );
};

LazyLoader.prototype.complete = function( event, className ) {
  // unbind events
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );

  var cell = this.flickity.getParentCell( this.img );
  var cellElem = cell && cell.element;
  this.flickity.cellSizeChange( cellElem );

  this.img.classList.add( className );
  this.flickity.dispatchEvent( 'lazyLoad', event, cellElem );
};

// -----  ----- //

Flickity.LazyLoader = LazyLoader;

return Flickity;

}));

/*!
 * Flickity v2.0.9
 * Touch, responsive, flickable carousels
 *
 * Licensed GPLv3 for open source use
 * or Flickity Commercial License for commercial use
 *
 * http://flickity.metafizzy.co
 * Copyright 2017 Metafizzy
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity/js/index',[
      './flickity',
      './drag',
      './prev-next-button',
      './page-dots',
      './player',
      './add-remove-cell',
      './lazyload'
    ], factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('./flickity'),
      require('./drag'),
      require('./prev-next-button'),
      require('./page-dots'),
      require('./player'),
      require('./add-remove-cell'),
      require('./lazyload')
    );
  }

})( window, function factory( Flickity ) {
  /*jshint strict: false*/
  return Flickity;
});

/*!
 * Flickity asNavFor v2.0.1
 * enable asNavFor for Flickity
 */

/*jshint browser: true, undef: true, unused: true, strict: true*/

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'flickity-as-nav-for/as-nav-for',[
      'flickity/js/index',
      'fizzy-ui-utils/utils'
    ], factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('flickity'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Flickity = factory(
      window.Flickity,
      window.fizzyUIUtils
    );
  }

}( window, function factory( Flickity, utils ) {



// -------------------------- asNavFor prototype -------------------------- //

// Flickity.defaults.asNavFor = null;

Flickity.createMethods.push('_createAsNavFor');

var proto = Flickity.prototype;

proto._createAsNavFor = function() {
  this.on( 'activate', this.activateAsNavFor );
  this.on( 'deactivate', this.deactivateAsNavFor );
  this.on( 'destroy', this.destroyAsNavFor );

  var asNavForOption = this.options.asNavFor;
  if ( !asNavForOption ) {
    return;
  }
  // HACK do async, give time for other flickity to be initalized
  var _this = this;
  setTimeout( function initNavCompanion() {
    _this.setNavCompanion( asNavForOption );
  });
};

proto.setNavCompanion = function( elem ) {
  elem = utils.getQueryElement( elem );
  var companion = Flickity.data( elem );
  // stop if no companion or companion is self
  if ( !companion || companion == this ) {
    return;
  }

  this.navCompanion = companion;
  // companion select
  var _this = this;
  this.onNavCompanionSelect = function() {
    _this.navCompanionSelect();
  };
  companion.on( 'select', this.onNavCompanionSelect );
  // click
  this.on( 'staticClick', this.onNavStaticClick );

  this.navCompanionSelect( true );
};

proto.navCompanionSelect = function( isInstant ) {
  if ( !this.navCompanion ) {
    return;
  }
  // select slide that matches first cell of slide
  var selectedCell = this.navCompanion.selectedCells[0];
  var firstIndex = this.navCompanion.cells.indexOf( selectedCell );
  var lastIndex = firstIndex + this.navCompanion.selectedCells.length - 1;
  var selectIndex = Math.floor( lerp( firstIndex, lastIndex,
    this.navCompanion.cellAlign ) );
  this.selectCell( selectIndex, false, isInstant );
  // set nav selected class
  this.removeNavSelectedElements();
  // stop if companion has more cells than this one
  if ( selectIndex >= this.cells.length ) {
    return;
  }

  var selectedCells = this.cells.slice( firstIndex, lastIndex + 1 );
  this.navSelectedElements = selectedCells.map( function( cell ) {
    return cell.element;
  });
  this.changeNavSelectedClass('add');
};

function lerp( a, b, t ) {
  return ( b - a ) * t + a;
}

proto.changeNavSelectedClass = function( method ) {
  this.navSelectedElements.forEach( function( navElem ) {
    navElem.classList[ method ]('is-nav-selected');
  });
};

proto.activateAsNavFor = function() {
  this.navCompanionSelect( true );
};

proto.removeNavSelectedElements = function() {
  if ( !this.navSelectedElements ) {
    return;
  }
  this.changeNavSelectedClass('remove');
  delete this.navSelectedElements;
};

proto.onNavStaticClick = function( event, pointer, cellElement, cellIndex ) {
  if ( typeof cellIndex == 'number' ) {
    this.navCompanion.selectCell( cellIndex );
  }
};

proto.deactivateAsNavFor = function() {
  this.removeNavSelectedElements();
};

proto.destroyAsNavFor = function() {
  if ( !this.navCompanion ) {
    return;
  }
  this.navCompanion.off( 'select', this.onNavCompanionSelect );
  this.off( 'staticClick', this.onNavStaticClick );
  delete this.navCompanion;
};

// -----  ----- //

return Flickity;

}));

/*!
 * imagesLoaded v4.1.3
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

( function( window, factory ) { 'use strict';
  // universal module definition

  /*global define: false, module: false, require: false */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'imagesloaded/imagesloaded',[
      'ev-emitter/ev-emitter'
    ], function( EvEmitter ) {
      return factory( window, EvEmitter );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('ev-emitter')
    );
  } else {
    // browser global
    window.imagesLoaded = factory(
      window,
      window.EvEmitter
    );
  }

})( typeof window !== 'undefined' ? window : this,

// --------------------------  factory -------------------------- //

function factory( window, EvEmitter ) {



var $ = window.jQuery;
var console = window.console;

// -------------------------- helpers -------------------------- //

// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

// turn element or nodeList into an array
function makeArray( obj ) {
  var ary = [];
  if ( Array.isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( typeof obj.length == 'number' ) {
    // convert nodeList to array
    for ( var i=0; i < obj.length; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
}

// -------------------------- imagesLoaded -------------------------- //

/**
 * @param {Array, Element, NodeList, String} elem
 * @param {Object or Function} options - if function, use as callback
 * @param {Function} onAlways - callback function
 */
function ImagesLoaded( elem, options, onAlways ) {
  // coerce ImagesLoaded() without new, to be new ImagesLoaded()
  if ( !( this instanceof ImagesLoaded ) ) {
    return new ImagesLoaded( elem, options, onAlways );
  }
  // use elem as selector string
  if ( typeof elem == 'string' ) {
    elem = document.querySelectorAll( elem );
  }

  this.elements = makeArray( elem );
  this.options = extend( {}, this.options );

  if ( typeof options == 'function' ) {
    onAlways = options;
  } else {
    extend( this.options, options );
  }

  if ( onAlways ) {
    this.on( 'always', onAlways );
  }

  this.getImages();

  if ( $ ) {
    // add jQuery Deferred object
    this.jqDeferred = new $.Deferred();
  }

  // HACK check async to allow time to bind listeners
  setTimeout( function() {
    this.check();
  }.bind( this ));
}

ImagesLoaded.prototype = Object.create( EvEmitter.prototype );

ImagesLoaded.prototype.options = {};

ImagesLoaded.prototype.getImages = function() {
  this.images = [];

  // filter & find items if we have an item selector
  this.elements.forEach( this.addElementImages, this );
};

/**
 * @param {Node} element
 */
ImagesLoaded.prototype.addElementImages = function( elem ) {
  // filter siblings
  if ( elem.nodeName == 'IMG' ) {
    this.addImage( elem );
  }
  // get background image on element
  if ( this.options.background === true ) {
    this.addElementBackgroundImages( elem );
  }

  // find children
  // no non-element nodes, #143
  var nodeType = elem.nodeType;
  if ( !nodeType || !elementNodeTypes[ nodeType ] ) {
    return;
  }
  var childImgs = elem.querySelectorAll('img');
  // concat childElems to filterFound array
  for ( var i=0; i < childImgs.length; i++ ) {
    var img = childImgs[i];
    this.addImage( img );
  }

  // get child background images
  if ( typeof this.options.background == 'string' ) {
    var children = elem.querySelectorAll( this.options.background );
    for ( i=0; i < children.length; i++ ) {
      var child = children[i];
      this.addElementBackgroundImages( child );
    }
  }
};

var elementNodeTypes = {
  1: true,
  9: true,
  11: true
};

ImagesLoaded.prototype.addElementBackgroundImages = function( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    // Firefox returns null if in a hidden iframe https://bugzil.la/548397
    return;
  }
  // get url inside url("...")
  var reURL = /url\((['"])?(.*?)\1\)/gi;
  var matches = reURL.exec( style.backgroundImage );
  while ( matches !== null ) {
    var url = matches && matches[2];
    if ( url ) {
      this.addBackground( url, elem );
    }
    matches = reURL.exec( style.backgroundImage );
  }
};

/**
 * @param {Image} img
 */
ImagesLoaded.prototype.addImage = function( img ) {
  var loadingImage = new LoadingImage( img );
  this.images.push( loadingImage );
};

ImagesLoaded.prototype.addBackground = function( url, elem ) {
  var background = new Background( url, elem );
  this.images.push( background );
};

ImagesLoaded.prototype.check = function() {
  var _this = this;
  this.progressedCount = 0;
  this.hasAnyBroken = false;
  // complete if no images
  if ( !this.images.length ) {
    this.complete();
    return;
  }

  function onProgress( image, elem, message ) {
    // HACK - Chrome triggers event before object properties have changed. #83
    setTimeout( function() {
      _this.progress( image, elem, message );
    });
  }

  this.images.forEach( function( loadingImage ) {
    loadingImage.once( 'progress', onProgress );
    loadingImage.check();
  });
};

ImagesLoaded.prototype.progress = function( image, elem, message ) {
  this.progressedCount++;
  this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
  // progress event
  this.emitEvent( 'progress', [ this, image, elem ] );
  if ( this.jqDeferred && this.jqDeferred.notify ) {
    this.jqDeferred.notify( this, image );
  }
  // check if completed
  if ( this.progressedCount == this.images.length ) {
    this.complete();
  }

  if ( this.options.debug && console ) {
    console.log( 'progress: ' + message, image, elem );
  }
};

ImagesLoaded.prototype.complete = function() {
  var eventName = this.hasAnyBroken ? 'fail' : 'done';
  this.isComplete = true;
  this.emitEvent( eventName, [ this ] );
  this.emitEvent( 'always', [ this ] );
  if ( this.jqDeferred ) {
    var jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
    this.jqDeferred[ jqMethod ]( this );
  }
};

// --------------------------  -------------------------- //

function LoadingImage( img ) {
  this.img = img;
}

LoadingImage.prototype = Object.create( EvEmitter.prototype );

LoadingImage.prototype.check = function() {
  // If complete is true and browser supports natural sizes,
  // try to check for image status manually.
  var isComplete = this.getIsImageComplete();
  if ( isComplete ) {
    // report based on naturalWidth
    this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
    return;
  }

  // If none of the checks above matched, simulate loading on detached element.
  this.proxyImage = new Image();
  this.proxyImage.addEventListener( 'load', this );
  this.proxyImage.addEventListener( 'error', this );
  // bind to image as well for Firefox. #191
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  this.proxyImage.src = this.img.src;
};

LoadingImage.prototype.getIsImageComplete = function() {
  return this.img.complete && this.img.naturalWidth !== undefined;
};

LoadingImage.prototype.confirm = function( isLoaded, message ) {
  this.isLoaded = isLoaded;
  this.emitEvent( 'progress', [ this, this.img, message ] );
};

// ----- events ----- //

// trigger specified handler for event type
LoadingImage.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

LoadingImage.prototype.onload = function() {
  this.confirm( true, 'onload' );
  this.unbindEvents();
};

LoadingImage.prototype.onerror = function() {
  this.confirm( false, 'onerror' );
  this.unbindEvents();
};

LoadingImage.prototype.unbindEvents = function() {
  this.proxyImage.removeEventListener( 'load', this );
  this.proxyImage.removeEventListener( 'error', this );
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );
};

// -------------------------- Background -------------------------- //

function Background( url, element ) {
  this.url = url;
  this.element = element;
  this.img = new Image();
}

// inherit LoadingImage prototype
Background.prototype = Object.create( LoadingImage.prototype );

Background.prototype.check = function() {
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  this.img.src = this.url;
  // check if image is already complete
  var isComplete = this.getIsImageComplete();
  if ( isComplete ) {
    this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
    this.unbindEvents();
  }
};

Background.prototype.unbindEvents = function() {
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );
};

Background.prototype.confirm = function( isLoaded, message ) {
  this.isLoaded = isLoaded;
  this.emitEvent( 'progress', [ this, this.element, message ] );
};

// -------------------------- jQuery -------------------------- //

ImagesLoaded.makeJQueryPlugin = function( jQuery ) {
  jQuery = jQuery || window.jQuery;
  if ( !jQuery ) {
    return;
  }
  // set local variable
  $ = jQuery;
  // $().imagesLoaded()
  $.fn.imagesLoaded = function( options, callback ) {
    var instance = new ImagesLoaded( this, options, callback );
    return instance.jqDeferred.promise( $(this) );
  };
};
// try making plugin
ImagesLoaded.makeJQueryPlugin();

// --------------------------  -------------------------- //

return ImagesLoaded;

});

/*!
 * Flickity imagesLoaded v2.0.0
 * enables imagesLoaded option for Flickity
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'flickity/js/index',
      'imagesloaded/imagesloaded'
    ], function( Flickity, imagesLoaded ) {
      return factory( window, Flickity, imagesLoaded );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('flickity'),
      require('imagesloaded')
    );
  } else {
    // browser global
    window.Flickity = factory(
      window,
      window.Flickity,
      window.imagesLoaded
    );
  }

}( window, function factory( window, Flickity, imagesLoaded ) {
'use strict';

Flickity.createMethods.push('_createImagesLoaded');

var proto = Flickity.prototype;

proto._createImagesLoaded = function() {
  this.on( 'activate', this.imagesLoaded );
};

proto.imagesLoaded = function() {
  if ( !this.options.imagesLoaded ) {
    return;
  }
  var _this = this;
  function onImagesLoadedProgress( instance, image ) {
    var cell = _this.getParentCell( image.img );
    _this.cellSizeChange( cell && cell.element );
    if ( !_this.options.freeScroll ) {
      _this.positionSliderAtSelected();
    }
  }
  imagesLoaded( this.slider ).on( 'progress', onImagesLoadedProgress );
};

return Flickity;

}));


/*!
 * getStyleProperty v1.0.4
 * original by kangax
 * http://perfectionkills.com/feature-testing-css-properties/
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false, exports: false, module: false */

( function( window ) {

'use strict';

var prefixes = 'Webkit Moz ms Ms O'.split(' ');
var docElemStyle = document.documentElement.style;

function getStyleProperty( propName ) {
  if ( !propName ) {
    return;
  }

  // test standard property first
  if ( typeof docElemStyle[ propName ] === 'string' ) {
    return propName;
  }

  // capitalize
  propName = propName.charAt(0).toUpperCase() + propName.slice(1);

  // test vendor specific properties
  var prefixed;
  for ( var i=0, len = prefixes.length; i < len; i++ ) {
    prefixed = prefixes[i] + propName;
    if ( typeof docElemStyle[ prefixed ] === 'string' ) {
      return prefixed;
    }
  }
}

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( function() {
    return getStyleProperty;
  });
} else if ( typeof exports === 'object' ) {
  // CommonJS for Component
  module.exports = getStyleProperty;
} else {
  // browser global
  window.getStyleProperty = getStyleProperty;
}

})( window );

/*!
 * getSize v2.0.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false, console: false */

( function( window, factory ) {
  'use strict';

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( function() {
      return factory();
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }

})( window, function factory() {
'use strict';

// -------------------------- helpers -------------------------- //

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') == -1 && !isNaN( num );
  return isValid && num;
}

function noop() {}

var logError = typeof console == 'undefined' ? noop :
  function( message ) {
    console.error( message );
  };

// -------------------------- measurements -------------------------- //

var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

var measurementsLength = measurements.length;

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}

// -------------------------- getStyle -------------------------- //

/**
 * getStyle, get style of element, check for Firefox bug
 * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function getStyle( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    logError( 'Style returned ' + style +
      '. Are you running this code in a hidden iframe on Firefox? ' +
      'See http://bit.ly/getsizebug1' );
  }
  return style;
}

// -------------------------- setup -------------------------- //

var isSetup = false;

var isBoxSizeOuter;

/**
 * setup
 * check isBoxSizerOuter
 * do on first getSize() rather than on page load for Firefox bug
 */
function setup() {
  // setup once
  if ( isSetup ) {
    return;
  }
  isSetup = true;

  // -------------------------- box sizing -------------------------- //

  /**
   * WebKit measures the outer-width on style.width on border-box elems
   * IE & Firefox<29 measures the inner-width
   */
  var div = document.createElement('div');
  div.style.width = '200px';
  div.style.padding = '1px 2px 3px 4px';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px 2px 3px 4px';
  div.style.boxSizing = 'border-box';

  var body = document.body || document.documentElement;
  body.appendChild( div );
  var style = getStyle( div );

  getSize.isBoxSizeOuter = isBoxSizeOuter = getStyleSize( style.width ) == 200;
  body.removeChild( div );

}

// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  setup();

  // use querySeletor if elem is string
  if ( typeof elem == 'string' ) {
    elem = document.querySelector( elem );
  }

  // do not proceed on non-objects
  if ( !elem || typeof elem != 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display == 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

  // get all measurements
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    var num = parseFloat( value );
    // any 'auto', 'medium' value will be 0
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  // overwrite width and height if we can get it from style
  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

return getSize;

});

/**
 * matchesSelector v2.0.2
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  /*global define: false, module: false */
  'use strict';
  // universal module definition
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.matchesSelector = factory();
  }

}( window, function factory() {
  'use strict';

  var matchesMethod = ( function() {
    var ElemProto = window.Element.prototype;
    // check for the standard method name first
    if ( ElemProto.matches ) {
      return 'matches';
    }
    // check un-prefixed
    if ( ElemProto.matchesSelector ) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

    for ( var i=0; i < prefixes.length; i++ ) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if ( ElemProto[ method ] ) {
        return method;
      }
    }
  })();

  return function matchesSelector( elem, selector ) {
    return elem[ matchesMethod ]( selector );
  };

}));

/*!
 * EventEmitter v4.2.11 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

;(function () {
    'use strict';

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listenersMap = this.getListenersAsObject(evt);
        var listeners;
        var listener;
        var i;
        var key;
        var response;

        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);
                i = listeners.length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[i];

                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = EventEmitter;
    }
    else {
        exports.EventEmitter = EventEmitter;
    }
}.call(this));

/*!
 * eventie v1.0.6
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false, module: false */

( function( window ) {

'use strict';

var docElem = document.documentElement;

var bind = function() {};

function getIEEvent( obj ) {
  var event = window.event;
  // add event.target
  event.target = event.target || event.srcElement || obj;
  return event;
}

if ( docElem.addEventListener ) {
  bind = function( obj, type, fn ) {
    obj.addEventListener( type, fn, false );
  };
} else if ( docElem.attachEvent ) {
  bind = function( obj, type, fn ) {
    obj[ type + fn ] = fn.handleEvent ?
      function() {
        var event = getIEEvent( obj );
        fn.handleEvent.call( fn, event );
      } :
      function() {
        var event = getIEEvent( obj );
        fn.call( obj, event );
      };
    obj.attachEvent( "on" + type, obj[ type + fn ] );
  };
}

var unbind = function() {};

if ( docElem.removeEventListener ) {
  unbind = function( obj, type, fn ) {
    obj.removeEventListener( type, fn, false );
  };
} else if ( docElem.detachEvent ) {
  unbind = function( obj, type, fn ) {
    obj.detachEvent( "on" + type, obj[ type + fn ] );
    try {
      delete obj[ type + fn ];
    } catch ( err ) {
      // can't delete window object properties
      obj[ type + fn ] = undefined;
    }
  };
}

var eventie = {
  bind: bind,
  unbind: unbind
};

// ----- module definition ----- //

if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( eventie );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = eventie;
} else {
  // browser global
  window.eventie = eventie;
}

})( window );

/*!
 * docReady v1.0.4
 * Cross browser DOMContentLoaded event emitter
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true*/
/*global define: false, require: false, module: false */

( function( window ) {

'use strict';

var document = window.document;
// collection of functions to be triggered on ready
var queue = [];

function docReady( fn ) {
  // throw out non-functions
  if ( typeof fn !== 'function' ) {
    return;
  }

  if ( docReady.isReady ) {
    // ready now, hit it
    fn();
  } else {
    // queue function when ready
    queue.push( fn );
  }
}

docReady.isReady = false;

// triggered on various doc ready events
function onReady( event ) {
  // bail if already triggered or IE8 document is not ready just yet
  var isIE8NotReady = event.type === 'readystatechange' && document.readyState !== 'complete';
  if ( docReady.isReady || isIE8NotReady ) {
    return;
  }

  trigger();
}

function trigger() {
  docReady.isReady = true;
  // process queue
  for ( var i=0, len = queue.length; i < len; i++ ) {
    var fn = queue[i];
    fn();
  }
}

function defineDocReady( eventie ) {
  // trigger ready if page is ready
  if ( document.readyState === 'complete' ) {
    trigger();
  } else {
    // listen for events
    eventie.bind( document, 'DOMContentLoaded', onReady );
    eventie.bind( document, 'readystatechange', onReady );
    eventie.bind( window, 'load', onReady );
  }

  return docReady;
}

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( [ 'eventie/eventie' ], defineDocReady );
} else if ( typeof exports === 'object' ) {
  module.exports = defineDocReady( require('eventie') );
} else {
  // browser global
  window.docReady = defineDocReady( window.eventie );
}

})( window );

/**
 * Fizzy UI utils v2.0.5
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'desandro-matches-selector/matches-selector'
    ], function( matchesSelector ) {
      return factory( window, matchesSelector );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('desandro-matches-selector')
    );
  } else {
    // browser global
    window.fizzyUIUtils = factory(
      window,
      window.matchesSelector
    );
  }

}( window, function factory( window, matchesSelector ) {

'use strict';

var utils = {};

// ----- extend ----- //

// extends objects
utils.extend = function( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
};

// ----- modulo ----- //

utils.modulo = function( num, div ) {
  return ( ( num % div ) + div ) % div;
};

// ----- makeArray ----- //

// turn element or nodeList into an array
utils.makeArray = function( obj ) {
  var ary = [];
  if ( Array.isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( obj && typeof obj == 'object' &&
    typeof obj.length == 'number' ) {
    // convert nodeList to array
    for ( var i=0; i < obj.length; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
};

// ----- removeFrom ----- //

utils.removeFrom = function( ary, obj ) {
  var index = ary.indexOf( obj );
  if ( index != -1 ) {
    ary.splice( index, 1 );
  }
};

// ----- getParent ----- //

utils.getParent = function( elem, selector ) {
  while ( elem.parentNode && elem != document.body ) {
    elem = elem.parentNode;
    if ( matchesSelector( elem, selector ) ) {
      return elem;
    }
  }
};

// ----- getQueryElement ----- //

// use element as selector string
utils.getQueryElement = function( elem ) {
  if ( typeof elem == 'string' ) {
    return document.querySelector( elem );
  }
  return elem;
};

// ----- handleEvent ----- //

// enable .ontype to trigger from .addEventListener( elem, 'type' )
utils.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// ----- filterFindElements ----- //

utils.filterFindElements = function( elems, selector ) {
  // make array of elems
  elems = utils.makeArray( elems );
  var ffElems = [];

  elems.forEach( function( elem ) {
    // check that elem is an actual element
    if ( !( elem instanceof HTMLElement ) ) {
      return;
    }
    // add elem if no selector
    if ( !selector ) {
      ffElems.push( elem );
      return;
    }
    // filter & find items if we have a selector
    // filter
    if ( matchesSelector( elem, selector ) ) {
      ffElems.push( elem );
    }
    // find children
    var childElems = elem.querySelectorAll( selector );
    // concat childElems to filterFound array
    for ( var i=0; i < childElems.length; i++ ) {
      ffElems.push( childElems[i] );
    }
  });

  return ffElems;
};

// ----- debounceMethod ----- //

utils.debounceMethod = function( _class, methodName, threshold ) {
  // original method
  var method = _class.prototype[ methodName ];
  var timeoutName = methodName + 'Timeout';

  _class.prototype[ methodName ] = function() {
    var timeout = this[ timeoutName ];
    if ( timeout ) {
      clearTimeout( timeout );
    }
    var args = arguments;

    var _this = this;
    this[ timeoutName ] = setTimeout( function() {
      method.apply( _this, args );
      delete _this[ timeoutName ];
    }, threshold || 100 );
  };
};

// ----- docReady ----- //

utils.docReady = function( callback ) {
  var readyState = document.readyState;
  if ( readyState == 'complete' || readyState == 'interactive' ) {
    // do async to allow for other scripts to run. metafizzy/flickity#441
    setTimeout( callback );
  } else {
    document.addEventListener( 'DOMContentLoaded', callback );
  }
};

// ----- htmlInit ----- //

// http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
utils.toDashed = function( str ) {
  return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
    return $1 + '-' + $2;
  }).toLowerCase();
};

var console = window.console;
/**
 * allow user to initialize classes via [data-namespace] or .js-namespace class
 * htmlInit( Widget, 'widgetName' )
 * options are parsed from data-namespace-options
 */
utils.htmlInit = function( WidgetClass, namespace ) {
  utils.docReady( function() {
    var dashedNamespace = utils.toDashed( namespace );
    var dataAttr = 'data-' + dashedNamespace;
    var dataAttrElems = document.querySelectorAll( '[' + dataAttr + ']' );
    var jsDashElems = document.querySelectorAll( '.js-' + dashedNamespace );
    var elems = utils.makeArray( dataAttrElems )
      .concat( utils.makeArray( jsDashElems ) );
    var dataOptionsAttr = dataAttr + '-options';
    var jQuery = window.jQuery;

    elems.forEach( function( elem ) {
      var attr = elem.getAttribute( dataAttr ) ||
        elem.getAttribute( dataOptionsAttr );
      var options;
      try {
        options = attr && JSON.parse( attr );
      } catch ( error ) {
        // log error, do not initialize
        if ( console ) {
          console.error( 'Error parsing ' + dataAttr + ' on ' + elem.className +
          ': ' + error );
        }
        return;
      }
      // initialize
      var instance = new WidgetClass( elem, options );
      // make available via $().data('namespace')
      if ( jQuery ) {
        jQuery.data( elem, namespace, instance );
      }
    });

  });
};

// -----  ----- //

return utils;

}));

/**
 * Outlayer Item
 */

( function( window, factory ) {
  'use strict';
  // universal module definition
  if ( typeof define === 'function' && define.amd ) {
    // AMD
    define( [
        'eventEmitter/EventEmitter',
        'get-size/get-size',
        'get-style-property/get-style-property',
        'fizzy-ui-utils/utils'
      ],
      function( EventEmitter, getSize, getStyleProperty, utils ) {
        return factory( window, EventEmitter, getSize, getStyleProperty, utils );
      }
    );
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory(
      window,
      require('wolfy87-eventemitter'),
      require('get-size'),
      require('desandro-get-style-property'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Outlayer = {};
    window.Outlayer.Item = factory(
      window,
      window.EventEmitter,
      window.getSize,
      window.getStyleProperty,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, EventEmitter, getSize, getStyleProperty, utils ) {
'use strict';

// ----- helpers ----- //

var getComputedStyle = window.getComputedStyle;
var getStyle = getComputedStyle ?
  function( elem ) {
    return getComputedStyle( elem, null );
  } :
  function( elem ) {
    return elem.currentStyle;
  };


function isEmptyObj( obj ) {
  for ( var prop in obj ) {
    return false;
  }
  prop = null;
  return true;
}

// -------------------------- CSS3 support -------------------------- //

var transitionProperty = getStyleProperty('transition');
var transformProperty = getStyleProperty('transform');
var supportsCSS3 = transitionProperty && transformProperty;
var is3d = !!getStyleProperty('perspective');

var transitionEndEvent = {
  WebkitTransition: 'webkitTransitionEnd',
  MozTransition: 'transitionend',
  OTransition: 'otransitionend',
  transition: 'transitionend'
}[ transitionProperty ];

// properties that could have vendor prefix
var prefixableProperties = [
  'transform',
  'transition',
  'transitionDuration',
  'transitionProperty'
];

// cache all vendor properties
var vendorProperties = ( function() {
  var cache = {};
  for ( var i=0, len = prefixableProperties.length; i < len; i++ ) {
    var prop = prefixableProperties[i];
    var supportedProp = getStyleProperty( prop );
    if ( supportedProp && supportedProp !== prop ) {
      cache[ prop ] = supportedProp;
    }
  }
  return cache;
})();

// -------------------------- Item -------------------------- //

function Item( element, layout ) {
  if ( !element ) {
    return;
  }

  this.element = element;
  // parent layout class, i.e. Masonry, Isotope, or Packery
  this.layout = layout;
  this.position = {
    x: 0,
    y: 0
  };

  this._create();
}

// inherit EventEmitter
utils.extend( Item.prototype, EventEmitter.prototype );

Item.prototype._create = function() {
  // transition objects
  this._transn = {
    ingProperties: {},
    clean: {},
    onEnd: {}
  };

  this.css({
    position: 'absolute'
  });
};

// trigger specified handler for event type
Item.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

Item.prototype.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * apply CSS styles to element
 * @param {Object} style
 */
Item.prototype.css = function( style ) {
  var elemStyle = this.element.style;

  for ( var prop in style ) {
    // use vendor property if available
    var supportedProp = vendorProperties[ prop ] || prop;
    elemStyle[ supportedProp ] = style[ prop ];
  }
};

 // measure position, and sets it
Item.prototype.getPosition = function() {
  var style = getStyle( this.element );
  var layoutOptions = this.layout.options;
  var isOriginLeft = layoutOptions.isOriginLeft;
  var isOriginTop = layoutOptions.isOriginTop;
  var xValue = style[ isOriginLeft ? 'left' : 'right' ];
  var yValue = style[ isOriginTop ? 'top' : 'bottom' ];
  // convert percent to pixels
  var layoutSize = this.layout.size;
  var x = xValue.indexOf('%') != -1 ?
    ( parseFloat( xValue ) / 100 ) * layoutSize.width : parseInt( xValue, 10 );
  var y = yValue.indexOf('%') != -1 ?
    ( parseFloat( yValue ) / 100 ) * layoutSize.height : parseInt( yValue, 10 );

  // clean up 'auto' or other non-integer values
  x = isNaN( x ) ? 0 : x;
  y = isNaN( y ) ? 0 : y;
  // remove padding from measurement
  x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
  y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;

  this.position.x = x;
  this.position.y = y;
};

// set settled position, apply padding
Item.prototype.layoutPosition = function() {
  var layoutSize = this.layout.size;
  var layoutOptions = this.layout.options;
  var style = {};

  // x
  var xPadding = layoutOptions.isOriginLeft ? 'paddingLeft' : 'paddingRight';
  var xProperty = layoutOptions.isOriginLeft ? 'left' : 'right';
  var xResetProperty = layoutOptions.isOriginLeft ? 'right' : 'left';

  var x = this.position.x + layoutSize[ xPadding ];
  // set in percentage or pixels
  style[ xProperty ] = this.getXValue( x );
  // reset other property
  style[ xResetProperty ] = '';

  // y
  var yPadding = layoutOptions.isOriginTop ? 'paddingTop' : 'paddingBottom';
  var yProperty = layoutOptions.isOriginTop ? 'top' : 'bottom';
  var yResetProperty = layoutOptions.isOriginTop ? 'bottom' : 'top';

  var y = this.position.y + layoutSize[ yPadding ];
  // set in percentage or pixels
  style[ yProperty ] = this.getYValue( y );
  // reset other property
  style[ yResetProperty ] = '';

  this.css( style );
  this.emitEvent( 'layout', [ this ] );
};

Item.prototype.getXValue = function( x ) {
  var layoutOptions = this.layout.options;
  return layoutOptions.percentPosition && !layoutOptions.isHorizontal ?
    ( ( x / this.layout.size.width ) * 100 ) + '%' : x + 'px';
};

Item.prototype.getYValue = function( y ) {
  var layoutOptions = this.layout.options;
  return layoutOptions.percentPosition && layoutOptions.isHorizontal ?
    ( ( y / this.layout.size.height ) * 100 ) + '%' : y + 'px';
};


Item.prototype._transitionTo = function( x, y ) {
  this.getPosition();
  // get current x & y from top/left
  var curX = this.position.x;
  var curY = this.position.y;

  var compareX = parseInt( x, 10 );
  var compareY = parseInt( y, 10 );
  var didNotMove = compareX === this.position.x && compareY === this.position.y;

  // save end position
  this.setPosition( x, y );

  // if did not move and not transitioning, just go to layout
  if ( didNotMove && !this.isTransitioning ) {
    this.layoutPosition();
    return;
  }

  var transX = x - curX;
  var transY = y - curY;
  var transitionStyle = {};
  transitionStyle.transform = this.getTranslate( transX, transY );

  this.transition({
    to: transitionStyle,
    onTransitionEnd: {
      transform: this.layoutPosition
    },
    isCleaning: true
  });
};

Item.prototype.getTranslate = function( x, y ) {
  // flip cooridinates if origin on right or bottom
  var layoutOptions = this.layout.options;
  x = layoutOptions.isOriginLeft ? x : -x;
  y = layoutOptions.isOriginTop ? y : -y;

  if ( is3d ) {
    return 'translate3d(' + x + 'px, ' + y + 'px, 0)';
  }

  return 'translate(' + x + 'px, ' + y + 'px)';
};

// non transition + transform support
Item.prototype.goTo = function( x, y ) {
  this.setPosition( x, y );
  this.layoutPosition();
};

// use transition and transforms if supported
Item.prototype.moveTo = supportsCSS3 ?
  Item.prototype._transitionTo : Item.prototype.goTo;

Item.prototype.setPosition = function( x, y ) {
  this.position.x = parseInt( x, 10 );
  this.position.y = parseInt( y, 10 );
};

// ----- transition ----- //

/**
 * @param {Object} style - CSS
 * @param {Function} onTransitionEnd
 */

// non transition, just trigger callback
Item.prototype._nonTransition = function( args ) {
  this.css( args.to );
  if ( args.isCleaning ) {
    this._removeStyles( args.to );
  }
  for ( var prop in args.onTransitionEnd ) {
    args.onTransitionEnd[ prop ].call( this );
  }
};

/**
 * proper transition
 * @param {Object} args - arguments
 *   @param {Object} to - style to transition to
 *   @param {Object} from - style to start transition from
 *   @param {Boolean} isCleaning - removes transition styles after transition
 *   @param {Function} onTransitionEnd - callback
 */
Item.prototype._transition = function( args ) {
  // redirect to nonTransition if no transition duration
  if ( !parseFloat( this.layout.options.transitionDuration ) ) {
    this._nonTransition( args );
    return;
  }

  var _transition = this._transn;
  // keep track of onTransitionEnd callback by css property
  for ( var prop in args.onTransitionEnd ) {
    _transition.onEnd[ prop ] = args.onTransitionEnd[ prop ];
  }
  // keep track of properties that are transitioning
  for ( prop in args.to ) {
    _transition.ingProperties[ prop ] = true;
    // keep track of properties to clean up when transition is done
    if ( args.isCleaning ) {
      _transition.clean[ prop ] = true;
    }
  }

  // set from styles
  if ( args.from ) {
    this.css( args.from );
    // force redraw. http://blog.alexmaccaw.com/css-transitions
    var h = this.element.offsetHeight;
    // hack for JSHint to hush about unused var
    h = null;
  }
  // enable transition
  this.enableTransition( args.to );
  // set styles that are transitioning
  this.css( args.to );

  this.isTransitioning = true;

};

// dash before all cap letters, including first for
// WebkitTransform => -webkit-transform
function toDashedAll( str ) {
  return str.replace( /([A-Z])/g, function( $1 ) {
    return '-' + $1.toLowerCase();
  });
}

var transitionProps = 'opacity,' +
  toDashedAll( vendorProperties.transform || 'transform' );

Item.prototype.enableTransition = function(/* style */) {
  // HACK changing transitionProperty during a transition
  // will cause transition to jump
  if ( this.isTransitioning ) {
    return;
  }

  // make `transition: foo, bar, baz` from style object
  // HACK un-comment this when enableTransition can work
  // while a transition is happening
  // var transitionValues = [];
  // for ( var prop in style ) {
  //   // dash-ify camelCased properties like WebkitTransition
  //   prop = vendorProperties[ prop ] || prop;
  //   transitionValues.push( toDashedAll( prop ) );
  // }
  // enable transition styles
  this.css({
    transitionProperty: transitionProps,
    transitionDuration: this.layout.options.transitionDuration
  });
  // listen for transition end event
  this.element.addEventListener( transitionEndEvent, this, false );
};

Item.prototype.transition = Item.prototype[ transitionProperty ? '_transition' : '_nonTransition' ];

// ----- events ----- //

Item.prototype.onwebkitTransitionEnd = function( event ) {
  this.ontransitionend( event );
};

Item.prototype.onotransitionend = function( event ) {
  this.ontransitionend( event );
};

// properties that I munge to make my life easier
var dashedVendorProperties = {
  '-webkit-transform': 'transform',
  '-moz-transform': 'transform',
  '-o-transform': 'transform'
};

Item.prototype.ontransitionend = function( event ) {
  // disregard bubbled events from children
  if ( event.target !== this.element ) {
    return;
  }
  var _transition = this._transn;
  // get property name of transitioned property, convert to prefix-free
  var propertyName = dashedVendorProperties[ event.propertyName ] || event.propertyName;

  // remove property that has completed transitioning
  delete _transition.ingProperties[ propertyName ];
  // check if any properties are still transitioning
  if ( isEmptyObj( _transition.ingProperties ) ) {
    // all properties have completed transitioning
    this.disableTransition();
  }
  // clean style
  if ( propertyName in _transition.clean ) {
    // clean up style
    this.element.style[ event.propertyName ] = '';
    delete _transition.clean[ propertyName ];
  }
  // trigger onTransitionEnd callback
  if ( propertyName in _transition.onEnd ) {
    var onTransitionEnd = _transition.onEnd[ propertyName ];
    onTransitionEnd.call( this );
    delete _transition.onEnd[ propertyName ];
  }

  this.emitEvent( 'transitionEnd', [ this ] );
};

Item.prototype.disableTransition = function() {
  this.removeTransitionStyles();
  this.element.removeEventListener( transitionEndEvent, this, false );
  this.isTransitioning = false;
};

/**
 * removes style property from element
 * @param {Object} style
**/
Item.prototype._removeStyles = function( style ) {
  // clean up transition styles
  var cleanStyle = {};
  for ( var prop in style ) {
    cleanStyle[ prop ] = '';
  }
  this.css( cleanStyle );
};

var cleanTransitionStyle = {
  transitionProperty: '',
  transitionDuration: ''
};

Item.prototype.removeTransitionStyles = function() {
  // remove transition
  this.css( cleanTransitionStyle );
};

// ----- show/hide/remove ----- //

// remove element from DOM
Item.prototype.removeElem = function() {
  this.element.parentNode.removeChild( this.element );
  // remove display: none
  this.css({ display: '' });
  this.emitEvent( 'remove', [ this ] );
};

Item.prototype.remove = function() {
  // just remove element if no transition support or no transition
  if ( !transitionProperty || !parseFloat( this.layout.options.transitionDuration ) ) {
    this.removeElem();
    return;
  }

  // start transition
  var _this = this;
  this.once( 'transitionEnd', function() {
    _this.removeElem();
  });
  this.hide();
};

Item.prototype.reveal = function() {
  delete this.isHidden;
  // remove display: none
  this.css({ display: '' });

  var options = this.layout.options;

  var onTransitionEnd = {};
  var transitionEndProperty = this.getHideRevealTransitionEndProperty('visibleStyle');
  onTransitionEnd[ transitionEndProperty ] = this.onRevealTransitionEnd;

  this.transition({
    from: options.hiddenStyle,
    to: options.visibleStyle,
    isCleaning: true,
    onTransitionEnd: onTransitionEnd
  });
};

Item.prototype.onRevealTransitionEnd = function() {
  // check if still visible
  // during transition, item may have been hidden
  if ( !this.isHidden ) {
    this.emitEvent('reveal');
  }
};

/**
 * get style property use for hide/reveal transition end
 * @param {String} styleProperty - hiddenStyle/visibleStyle
 * @returns {String}
 */
Item.prototype.getHideRevealTransitionEndProperty = function( styleProperty ) {
  var optionStyle = this.layout.options[ styleProperty ];
  // use opacity
  if ( optionStyle.opacity ) {
    return 'opacity';
  }
  // get first property
  for ( var prop in optionStyle ) {
    return prop;
  }
};

Item.prototype.hide = function() {
  // set flag
  this.isHidden = true;
  // remove display: none
  this.css({ display: '' });

  var options = this.layout.options;

  var onTransitionEnd = {};
  var transitionEndProperty = this.getHideRevealTransitionEndProperty('hiddenStyle');
  onTransitionEnd[ transitionEndProperty ] = this.onHideTransitionEnd;

  this.transition({
    from: options.visibleStyle,
    to: options.hiddenStyle,
    // keep hidden stuff hidden
    isCleaning: true,
    onTransitionEnd: onTransitionEnd
  });
};

Item.prototype.onHideTransitionEnd = function() {
  // check if still hidden
  // during transition, item may have been un-hidden
  if ( this.isHidden ) {
    this.css({ display: 'none' });
    this.emitEvent('hide');
  }
};

Item.prototype.destroy = function() {
  this.css({
    position: '',
    left: '',
    right: '',
    top: '',
    bottom: '',
    transition: '',
    transform: ''
  });
};

return Item;

}));

/*!
 * Outlayer v1.4.2
 * the brains and guts of a layout library
 * MIT license
 */

( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
        'eventie/eventie',
        'eventEmitter/EventEmitter',
        'get-size/get-size',
        'fizzy-ui-utils/utils',
        './item'
      ],
      function( eventie, EventEmitter, getSize, utils, Item ) {
        return factory( window, eventie, EventEmitter, getSize, utils, Item);
      }
    );
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('eventie'),
      require('wolfy87-eventemitter'),
      require('get-size'),
      require('fizzy-ui-utils'),
      require('./item')
    );
  } else {
    // browser global
    window.Outlayer = factory(
      window,
      window.eventie,
      window.EventEmitter,
      window.getSize,
      window.fizzyUIUtils,
      window.Outlayer.Item
    );
  }

}( window, function factory( window, eventie, EventEmitter, getSize, utils, Item ) {
'use strict';

// ----- vars ----- //

var console = window.console;
var jQuery = window.jQuery;
var noop = function() {};

// -------------------------- Outlayer -------------------------- //

// globally unique identifiers
var GUID = 0;
// internal store of all Outlayer intances
var instances = {};


/**
 * @param {Element, String} element
 * @param {Object} options
 * @constructor
 */
function Outlayer( element, options ) {
  var queryElement = utils.getQueryElement( element );
  if ( !queryElement ) {
    if ( console ) {
      console.error( 'Bad element for ' + this.constructor.namespace +
        ': ' + ( queryElement || element ) );
    }
    return;
  }
  this.element = queryElement;
  // add jQuery
  if ( jQuery ) {
    this.$element = jQuery( this.element );
  }

  // options
  this.options = utils.extend( {}, this.constructor.defaults );
  this.option( options );

  // add id for Outlayer.getFromElement
  var id = ++GUID;
  this.element.outlayerGUID = id; // expando
  instances[ id ] = this; // associate via id

  // kick it off
  this._create();

  if ( this.options.isInitLayout ) {
    this.layout();
  }
}

// settings are for internal use only
Outlayer.namespace = 'outlayer';
Outlayer.Item = Item;

// default options
Outlayer.defaults = {
  containerStyle: {
    position: 'relative'
  },
  isInitLayout: true,
  isOriginLeft: true,
  isOriginTop: true,
  isResizeBound: true,
  isResizingContainer: true,
  // item options
  transitionDuration: '0.4s',
  hiddenStyle: {
    opacity: 0,
    transform: 'scale(0.001)'
  },
  visibleStyle: {
    opacity: 1,
    transform: 'scale(1)'
  }
};

// inherit EventEmitter
utils.extend( Outlayer.prototype, EventEmitter.prototype );

/**
 * set options
 * @param {Object} opts
 */
Outlayer.prototype.option = function( opts ) {
  utils.extend( this.options, opts );
};

Outlayer.prototype._create = function() {
  // get items from children
  this.reloadItems();
  // elements that affect layout, but are not laid out
  this.stamps = [];
  this.stamp( this.options.stamp );
  // set container style
  utils.extend( this.element.style, this.options.containerStyle );

  // bind resize method
  if ( this.options.isResizeBound ) {
    this.bindResize();
  }
};

// goes through all children again and gets bricks in proper order
Outlayer.prototype.reloadItems = function() {
  // collection of item elements
  this.items = this._itemize( this.element.children );
};


/**
 * turn elements into Outlayer.Items to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Outlayer Items
 */
Outlayer.prototype._itemize = function( elems ) {

  var itemElems = this._filterFindItemElements( elems );
  var Item = this.constructor.Item;

  // create new Outlayer Items for collection
  var items = [];
  for ( var i=0, len = itemElems.length; i < len; i++ ) {
    var elem = itemElems[i];
    var item = new Item( elem, this );
    items.push( item );
  }

  return items;
};

/**
 * get item elements to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - item elements
 */
Outlayer.prototype._filterFindItemElements = function( elems ) {
  return utils.filterFindElements( elems, this.options.itemSelector );
};

/**
 * getter method for getting item elements
 * @returns {Array} elems - collection of item elements
 */
Outlayer.prototype.getItemElements = function() {
  var elems = [];
  for ( var i=0, len = this.items.length; i < len; i++ ) {
    elems.push( this.items[i].element );
  }
  return elems;
};

// ----- init & layout ----- //

/**
 * lays out all items
 */
Outlayer.prototype.layout = function() {
  this._resetLayout();
  this._manageStamps();

  // don't animate first layout
  var isInstant = this.options.isLayoutInstant !== undefined ?
    this.options.isLayoutInstant : !this._isLayoutInited;
  this.layoutItems( this.items, isInstant );

  // flag for initalized
  this._isLayoutInited = true;
};

// _init is alias for layout
Outlayer.prototype._init = Outlayer.prototype.layout;

/**
 * logic before any new layout
 */
Outlayer.prototype._resetLayout = function() {
  this.getSize();
};


Outlayer.prototype.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * get measurement from option, for columnWidth, rowHeight, gutter
 * if option is String -> get element from selector string, & get size of element
 * if option is Element -> get size of element
 * else use option as a number
 *
 * @param {String} measurement
 * @param {String} size - width or height
 * @private
 */
Outlayer.prototype._getMeasurement = function( measurement, size ) {
  var option = this.options[ measurement ];
  var elem;
  if ( !option ) {
    // default to 0
    this[ measurement ] = 0;
  } else {
    // use option as an element
    if ( typeof option === 'string' ) {
      elem = this.element.querySelector( option );
    } else if ( utils.isElement( option ) ) {
      elem = option;
    }
    // use size of element, if element
    this[ measurement ] = elem ? getSize( elem )[ size ] : option;
  }
};

/**
 * layout a collection of item elements
 * @api public
 */
Outlayer.prototype.layoutItems = function( items, isInstant ) {
  items = this._getItemsForLayout( items );

  this._layoutItems( items, isInstant );

  this._postLayout();
};

/**
 * get the items to be laid out
 * you may want to skip over some items
 * @param {Array} items
 * @returns {Array} items
 */
Outlayer.prototype._getItemsForLayout = function( items ) {
  var layoutItems = [];
  for ( var i=0, len = items.length; i < len; i++ ) {
    var item = items[i];
    if ( !item.isIgnored ) {
      layoutItems.push( item );
    }
  }
  return layoutItems;
};

/**
 * layout items
 * @param {Array} items
 * @param {Boolean} isInstant
 */
Outlayer.prototype._layoutItems = function( items, isInstant ) {
  this._emitCompleteOnItems( 'layout', items );

  if ( !items || !items.length ) {
    // no items, emit event with empty array
    return;
  }

  var queue = [];

  for ( var i=0, len = items.length; i < len; i++ ) {
    var item = items[i];
    // get x/y object from method
    var position = this._getItemLayoutPosition( item );
    // enqueue
    position.item = item;
    position.isInstant = isInstant || item.isLayoutInstant;
    queue.push( position );
  }

  this._processLayoutQueue( queue );
};

/**
 * get item layout position
 * @param {Outlayer.Item} item
 * @returns {Object} x and y position
 */
Outlayer.prototype._getItemLayoutPosition = function( /* item */ ) {
  return {
    x: 0,
    y: 0
  };
};

/**
 * iterate over array and position each item
 * Reason being - separating this logic prevents 'layout invalidation'
 * thx @paul_irish
 * @param {Array} queue
 */
Outlayer.prototype._processLayoutQueue = function( queue ) {
  for ( var i=0, len = queue.length; i < len; i++ ) {
    var obj = queue[i];
    this._positionItem( obj.item, obj.x, obj.y, obj.isInstant );
  }
};

/**
 * Sets position of item in DOM
 * @param {Outlayer.Item} item
 * @param {Number} x - horizontal position
 * @param {Number} y - vertical position
 * @param {Boolean} isInstant - disables transitions
 */
Outlayer.prototype._positionItem = function( item, x, y, isInstant ) {
  if ( isInstant ) {
    // if not transition, just set CSS
    item.goTo( x, y );
  } else {
    item.moveTo( x, y );
  }
};

/**
 * Any logic you want to do after each layout,
 * i.e. size the container
 */
Outlayer.prototype._postLayout = function() {
  this.resizeContainer();
};

Outlayer.prototype.resizeContainer = function() {
  if ( !this.options.isResizingContainer ) {
    return;
  }
  var size = this._getContainerSize();
  if ( size ) {
    this._setContainerMeasure( size.width, true );
    this._setContainerMeasure( size.height, false );
  }
};

/**
 * Sets width or height of container if returned
 * @returns {Object} size
 *   @param {Number} width
 *   @param {Number} height
 */
Outlayer.prototype._getContainerSize = noop;

/**
 * @param {Number} measure - size of width or height
 * @param {Boolean} isWidth
 */
Outlayer.prototype._setContainerMeasure = function( measure, isWidth ) {
  if ( measure === undefined ) {
    return;
  }

  var elemSize = this.size;
  // add padding and border width if border box
  if ( elemSize.isBorderBox ) {
    measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight +
      elemSize.borderLeftWidth + elemSize.borderRightWidth :
      elemSize.paddingBottom + elemSize.paddingTop +
      elemSize.borderTopWidth + elemSize.borderBottomWidth;
  }

  measure = Math.max( measure, 0 );
  this.element.style[ isWidth ? 'width' : 'height' ] = measure + 'px';
};

/**
 * emit eventComplete on a collection of items events
 * @param {String} eventName
 * @param {Array} items - Outlayer.Items
 */
Outlayer.prototype._emitCompleteOnItems = function( eventName, items ) {
  var _this = this;
  function onComplete() {
    _this.dispatchEvent( eventName + 'Complete', null, [ items ] );
  }

  var count = items.length;
  if ( !items || !count ) {
    onComplete();
    return;
  }

  var doneCount = 0;
  function tick() {
    doneCount++;
    if ( doneCount === count ) {
      onComplete();
    }
  }

  // bind callback
  for ( var i=0, len = items.length; i < len; i++ ) {
    var item = items[i];
    item.once( eventName, tick );
  }
};

/**
 * emits events via eventEmitter and jQuery events
 * @param {String} type - name of event
 * @param {Event} event - original event
 * @param {Array} args - extra arguments
 */
Outlayer.prototype.dispatchEvent = function( type, event, args ) {
  // add original event to arguments
  var emitArgs = event ? [ event ].concat( args ) : args;
  this.emitEvent( type, emitArgs );

  if ( jQuery ) {
    // set this.$element
    this.$element = this.$element || jQuery( this.element );
    if ( event ) {
      // create jQuery event
      var $event = jQuery.Event( event );
      $event.type = type;
      this.$element.trigger( $event, args );
    } else {
      // just trigger with type if no event available
      this.$element.trigger( type, args );
    }
  }
};

// -------------------------- ignore & stamps -------------------------- //


/**
 * keep item in collection, but do not lay it out
 * ignored items do not get skipped in layout
 * @param {Element} elem
 */
Outlayer.prototype.ignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    item.isIgnored = true;
  }
};

/**
 * return item to layout collection
 * @param {Element} elem
 */
Outlayer.prototype.unignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    delete item.isIgnored;
  }
};

/**
 * adds elements to stamps
 * @param {NodeList, Array, Element, or String} elems
 */
Outlayer.prototype.stamp = function( elems ) {
  elems = this._find( elems );
  if ( !elems ) {
    return;
  }

  this.stamps = this.stamps.concat( elems );
  // ignore
  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    this.ignore( elem );
  }
};

/**
 * removes elements to stamps
 * @param {NodeList, Array, or Element} elems
 */
Outlayer.prototype.unstamp = function( elems ) {
  elems = this._find( elems );
  if ( !elems ){
    return;
  }

  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    // filter out removed stamp elements
    utils.removeFrom( this.stamps, elem );
    this.unignore( elem );
  }

};

/**
 * finds child elements
 * @param {NodeList, Array, Element, or String} elems
 * @returns {Array} elems
 */
Outlayer.prototype._find = function( elems ) {
  if ( !elems ) {
    return;
  }
  // if string, use argument as selector string
  if ( typeof elems === 'string' ) {
    elems = this.element.querySelectorAll( elems );
  }
  elems = utils.makeArray( elems );
  return elems;
};

Outlayer.prototype._manageStamps = function() {
  if ( !this.stamps || !this.stamps.length ) {
    return;
  }

  this._getBoundingRect();

  for ( var i=0, len = this.stamps.length; i < len; i++ ) {
    var stamp = this.stamps[i];
    this._manageStamp( stamp );
  }
};

// update boundingLeft / Top
Outlayer.prototype._getBoundingRect = function() {
  // get bounding rect for container element
  var boundingRect = this.element.getBoundingClientRect();
  var size = this.size;
  this._boundingRect = {
    left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
    top: boundingRect.top + size.paddingTop + size.borderTopWidth,
    right: boundingRect.right - ( size.paddingRight + size.borderRightWidth ),
    bottom: boundingRect.bottom - ( size.paddingBottom + size.borderBottomWidth )
  };
};

/**
 * @param {Element} stamp
**/
Outlayer.prototype._manageStamp = noop;

/**
 * get x/y position of element relative to container element
 * @param {Element} elem
 * @returns {Object} offset - has left, top, right, bottom
 */
Outlayer.prototype._getElementOffset = function( elem ) {
  var boundingRect = elem.getBoundingClientRect();
  var thisRect = this._boundingRect;
  var size = getSize( elem );
  var offset = {
    left: boundingRect.left - thisRect.left - size.marginLeft,
    top: boundingRect.top - thisRect.top - size.marginTop,
    right: thisRect.right - boundingRect.right - size.marginRight,
    bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
  };
  return offset;
};

// -------------------------- resize -------------------------- //

// enable event handlers for listeners
// i.e. resize -> onresize
Outlayer.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

/**
 * Bind layout to window resizing
 */
Outlayer.prototype.bindResize = function() {
  // bind just one listener
  if ( this.isResizeBound ) {
    return;
  }
  eventie.bind( window, 'resize', this );
  this.isResizeBound = true;
};

/**
 * Unbind layout to window resizing
 */
Outlayer.prototype.unbindResize = function() {
  if ( this.isResizeBound ) {
    eventie.unbind( window, 'resize', this );
  }
  this.isResizeBound = false;
};

// original debounce by John Hann
// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/

// this fires every resize
Outlayer.prototype.onresize = function() {
  if ( this.resizeTimeout ) {
    clearTimeout( this.resizeTimeout );
  }

  var _this = this;
  function delayed() {
    _this.resize();
    delete _this.resizeTimeout;
  }

  this.resizeTimeout = setTimeout( delayed, 100 );
};

// debounced, layout on resize
Outlayer.prototype.resize = function() {
  // don't trigger if size did not change
  // or if resize was unbound. See #9
  if ( !this.isResizeBound || !this.needsResizeLayout() ) {
    return;
  }

  this.layout();
};

/**
 * check if layout is needed post layout
 * @returns Boolean
 */
Outlayer.prototype.needsResizeLayout = function() {
  var size = getSize( this.element );
  // check that this.size and size are there
  // IE8 triggers resize on body size change, so they might not be
  var hasSizes = this.size && size;
  return hasSizes && size.innerWidth !== this.size.innerWidth;
};

// -------------------------- methods -------------------------- //

/**
 * add items to Outlayer instance
 * @param {Array or NodeList or Element} elems
 * @returns {Array} items - Outlayer.Items
**/
Outlayer.prototype.addItems = function( elems ) {
  var items = this._itemize( elems );
  // add items to collection
  if ( items.length ) {
    this.items = this.items.concat( items );
  }
  return items;
};

/**
 * Layout newly-appended item elements
 * @param {Array or NodeList or Element} elems
 */
Outlayer.prototype.appended = function( elems ) {
  var items = this.addItems( elems );
  if ( !items.length ) {
    return;
  }
  // layout and reveal just the new items
  this.layoutItems( items, true );
  this.reveal( items );
};

/**
 * Layout prepended elements
 * @param {Array or NodeList or Element} elems
 */
Outlayer.prototype.prepended = function( elems ) {
  var items = this._itemize( elems );
  if ( !items.length ) {
    return;
  }
  // add items to beginning of collection
  var previousItems = this.items.slice(0);
  this.items = items.concat( previousItems );
  // start new layout
  this._resetLayout();
  this._manageStamps();
  // layout new stuff without transition
  this.layoutItems( items, true );
  this.reveal( items );
  // layout previous items
  this.layoutItems( previousItems );
};

/**
 * reveal a collection of items
 * @param {Array of Outlayer.Items} items
 */
Outlayer.prototype.reveal = function( items ) {
  this._emitCompleteOnItems( 'reveal', items );

  var len = items && items.length;
  for ( var i=0; len && i < len; i++ ) {
    var item = items[i];
    item.reveal();
  }
};

/**
 * hide a collection of items
 * @param {Array of Outlayer.Items} items
 */
Outlayer.prototype.hide = function( items ) {
  this._emitCompleteOnItems( 'hide', items );

  var len = items && items.length;
  for ( var i=0; len && i < len; i++ ) {
    var item = items[i];
    item.hide();
  }
};

/**
 * reveal item elements
 * @param {Array}, {Element}, {NodeList} items
 */
Outlayer.prototype.revealItemElements = function( elems ) {
  var items = this.getItems( elems );
  this.reveal( items );
};

/**
 * hide item elements
 * @param {Array}, {Element}, {NodeList} items
 */
Outlayer.prototype.hideItemElements = function( elems ) {
  var items = this.getItems( elems );
  this.hide( items );
};

/**
 * get Outlayer.Item, given an Element
 * @param {Element} elem
 * @param {Function} callback
 * @returns {Outlayer.Item} item
 */
Outlayer.prototype.getItem = function( elem ) {
  // loop through items to get the one that matches
  for ( var i=0, len = this.items.length; i < len; i++ ) {
    var item = this.items[i];
    if ( item.element === elem ) {
      // return item
      return item;
    }
  }
};

/**
 * get collection of Outlayer.Items, given Elements
 * @param {Array} elems
 * @returns {Array} items - Outlayer.Items
 */
Outlayer.prototype.getItems = function( elems ) {
  elems = utils.makeArray( elems );
  var items = [];
  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    var item = this.getItem( elem );
    if ( item ) {
      items.push( item );
    }
  }

  return items;
};

/**
 * remove element(s) from instance and DOM
 * @param {Array or NodeList or Element} elems
 */
Outlayer.prototype.remove = function( elems ) {
  var removeItems = this.getItems( elems );

  this._emitCompleteOnItems( 'remove', removeItems );

  // bail if no items to remove
  if ( !removeItems || !removeItems.length ) {
    return;
  }

  for ( var i=0, len = removeItems.length; i < len; i++ ) {
    var item = removeItems[i];
    item.remove();
    // remove item from collection
    utils.removeFrom( this.items, item );
  }
};

// ----- destroy ----- //

// remove and disable Outlayer instance
Outlayer.prototype.destroy = function() {
  // clean up dynamic styles
  var style = this.element.style;
  style.height = '';
  style.position = '';
  style.width = '';
  // destroy items
  for ( var i=0, len = this.items.length; i < len; i++ ) {
    var item = this.items[i];
    item.destroy();
  }

  this.unbindResize();

  var id = this.element.outlayerGUID;
  delete instances[ id ]; // remove reference to instance by id
  delete this.element.outlayerGUID;
  // remove data for jQuery
  if ( jQuery ) {
    jQuery.removeData( this.element, this.constructor.namespace );
  }

};

// -------------------------- data -------------------------- //

/**
 * get Outlayer instance from element
 * @param {Element} elem
 * @returns {Outlayer}
 */
Outlayer.data = function( elem ) {
  elem = utils.getQueryElement( elem );
  var id = elem && elem.outlayerGUID;
  return id && instances[ id ];
};


// -------------------------- create Outlayer class -------------------------- //

/**
 * create a layout class
 * @param {String} namespace
 */
Outlayer.create = function( namespace, options ) {
  // sub-class Outlayer
  function Layout() {
    Outlayer.apply( this, arguments );
  }
  // inherit Outlayer prototype, use Object.create if there
  if ( Object.create ) {
    Layout.prototype = Object.create( Outlayer.prototype );
  } else {
    utils.extend( Layout.prototype, Outlayer.prototype );
  }
  // set contructor, used for namespace and Item
  Layout.prototype.constructor = Layout;

  Layout.defaults = utils.extend( {}, Outlayer.defaults );
  // apply new options
  utils.extend( Layout.defaults, options );
  // keep prototype.settings for backwards compatibility (Packery v1.2.0)
  Layout.prototype.settings = {};

  Layout.namespace = namespace;

  Layout.data = Outlayer.data;

  // sub-class Item
  Layout.Item = function LayoutItem() {
    Item.apply( this, arguments );
  };

  Layout.Item.prototype = new Item();

  // -------------------------- declarative -------------------------- //

  utils.htmlInit( Layout, namespace );

  // -------------------------- jQuery bridge -------------------------- //

  // make into jQuery plugin
  if ( jQuery && jQuery.bridget ) {
    jQuery.bridget( namespace, Layout );
  }

  return Layout;
};

// ----- fin ----- //

// back in global
Outlayer.Item = Item;

return Outlayer;

}));


( function( window, factory ) {
  'use strict';
    // browser global
    window.AnyGrid = factory(
      window.Outlayer
    );

}( window, function factory( Outlayer) {
'use strict';

var AnyGrid = Outlayer.create( 'anyGrid', {
    masonry: false,
    orderMasonry: true,
    stacked: false,
    perRow: {
        xxs: 1,
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 5,
        xxl: 6
    },
    breakpoints: {
        xxs: 0,
        xs: 250,
        sm: 500,
        md: 750,
        lg: 1000,
        xl: 1250,
        xxl: 1500
    },
    itemBreakpoints: {
        xxs: 200,
        xs: 275,
        sm: 350,
        md: 425,
        lg: 500,
        xl: 575,
        xxl: 650,
    },
    imageRatio: 'wide_rectangle',
    isLayoutInstant: true,
    hiddenStyle: {
        opacity: 0
    },
    visibleStyle: {
        opacity: 1
    },
    adjustGutter: false,
    removeVerticalGutters: false,
    column_spans: false
});

AnyGrid.prototype.getGreaterLessThanBreakPoints = function() {
  var breakpoints = [];
  var index = 0;
  var indexed = false;
  for (var key in this.options.breakpoints) {
    if (this.options.breakpoints.hasOwnProperty(key)) {
      breakpoints.push(key);
      if (this.getBreakPoint() == key) {
        indexed = true;
      }
      if (!indexed) {
        index++;
      }
    }
  }

  return {
    gt: breakpoints.slice(0, index),
    lt: breakpoints.slice(index + 1)
  }
};

AnyGrid.prototype.getBreakPoint = function() {
    return this.breakPoint;
};

AnyGrid.prototype.getPerRow = function() {
    return this.perRow;
};

/**
 * turn elements into Outlayer.Items to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Outlayer Items
 */
AnyGrid.prototype._itemize = function( elems ) {

  var itemElems = this._filterFindItemElements( elems );
  var Item = this.constructor.Item;

  // create new Outlayer Items for collection
  var items = [];
  for ( var i=0, len = itemElems.length; i < len; i++ ) {
    var elem = itemElems[i];
    var item = new Item( elem, this );
    item.span = 1;
    for (var j = 0; j < this.options.column_spans.length; j++) {
      if ((!this.options.column_spans[j].media || window.matchMedia(this.options.column_spans[j].media).matches)
        && (!this.options.column_spans[j].selector || matchesSelector(item.element, this.options.column_spans[j].selector))) {
        item.span = this.options.column_spans[j].spans;
      }
    }
    items.push( item );
  }

  return items;
};

AnyGrid.prototype.resize = function() {
    if ( !this.isResizeBound || !this.needsResizeLayout() ) {
        return;
    }
    // this._setUp();
    this._resetLayout();
    this.emitEvent( 'resize', [ this ] );
    // this.layout(6);
    // this.emitEvent( 'resized', [ this ] );
};

AnyGrid.prototype._resetLayout = function(check) {
    this.rows = {};
    this.nextRow = 0;
    this.row = 0;
    this.rowCounter = 0;
    this.spanCounter = 0;
    this.nextColumn = 0;
    this.heights = {};
    this.maxHeight = 0;
    this.index = 0;

    this.getSize();

    this.containerWidth = this.size.outerWidth;

    if (this.containerWidth >= this.options.breakpoints.xxl) {
        this.perRow = this.options.perRow.xxl;
        this.breakPoint = 'xxl';
    }else if (this.containerWidth >= this.options.breakpoints.xl) {
        this.perRow = this.options.perRow.xl;
        this.breakPoint = 'xl';
    }else if (this.containerWidth >= this.options.breakpoints.lg) {
        this.perRow = this.options.perRow.lg;
        this.breakPoint = 'lg';
    }else if (this.containerWidth >= this.options.breakpoints.md) {
        this.perRow = this.options.perRow.md;
        this.breakPoint = 'md';
    }else if (this.containerWidth >= this.options.breakpoints.sm) {
        this.perRow = this.options.perRow.sm;
        this.breakPoint = 'sm';
    }else if (this.containerWidth >= this.options.breakpoints.xs) {
        this.perRow = this.options.perRow.xs;
        this.breakPoint = 'xs';
    }else {
        this.perRow = this.options.perRow.xxs;
        this.breakPoint = 'xxs';
    }

    if (!this.perRow) { // try to just set it to what was passed
        this.perRow = parseInt(this.options.perRow);
    }

    if (this.options.masonry) {
      this.columns = [];
      this.rows = {};
      for (var i = 0; i < this.perRow; i++) {
          this.columns[i] = 0;
      }
    } else {
      this.columns = {};
    }

    this.rowCount = this.options.rows[this.breakPoint] ? this.options.rows[this.breakPoint] : this.options.rows;
};

AnyGrid.prototype._postLayout = function() {
  this.resizeContainer();
  this.emitEvent( 'postLayout', [ this ] );
};

AnyGrid.prototype._create = function() {
    this.items = [];
    // this.reloadItems();

    this.element.style.position = "relative";

    if ( this.options.isResizeBound ) {
        this.bindResize();
    }

    this._resetLayout('create');
};


AnyGrid.prototype.getComputedStyle = function (el) {
    if (getComputedStyle !== 'undefined') {
        return getComputedStyle(el, null);
    } else {
        return el.currentStyle;
    }
};


AnyGrid.prototype.getItemBreakpoint = function(width) {
    if (width >= this.options.itemBreakpoints.xxl) { // 650
        return 'xxl';
    }else if (width >= this.options.itemBreakpoints.xl) { // 575
        return 'xl';
    }else if (width >= this.options.itemBreakpoints.lg) { // 500
        return 'lg';
    }else if (width >= this.options.itemBreakpoints.md) { // 425
        return 'md';
    }else if (width >= this.options.itemBreakpoints.sm) { // 350
        return 'sm';
    }else if (width >= this.options.itemBreakpoints.xs) { // 275
        return 'xs';
    }else { // 200
        return 'xxs';
    }
};

AnyGrid.prototype.getGreaterLessThanBreakPoints = function(breakpoint) {
    var breakpoints = [];
    var index = 0;
    var indexed = false;
    for (var key in this.options.itemBreakpoints) {
        if (this.options.itemBreakpoints.hasOwnProperty(key)) {
        breakpoints.push(key);
        if (breakpoint == key) {
            indexed = true;
        }
        if (!indexed) {
            index++;
        }
    }
  }

  return {
    gt: breakpoints.slice(0, index),
    lt: breakpoints.slice(index + 1)
  }
};

AnyGrid.prototype.setImageSize = function(item) {
    var setImageSize = function(ratio) {
        switch(ratio) {
            case 'rectangle':
                item.imageHeight = 300;
                item.imageWidth = 400;
                break;
            case 'wide_rectangle':
                item.imageHeight = 450;
                item.imageWidth = 800;
                break;
            case 'tall_rectangle':
                item.imageHeight = 400;
                item.imageWidth = 300;
                break;
            case 'square':
                item.imageHeight = 400;
                item.imageWidth = 400;
            default:
                var ratioParts = ratio.split(':');
                if (ratioParts[0] && ratioParts[1]) {
                    item.imageWidth = ratio.split(':')[0];
                    item.imageHeight = ratio.split(':')[1];
                } else { // something went horribly wrong just do this
                    item.imageHeight = 300;
                    item.imageWidth = 400;
                }
        }
    }

    setImageSize(this.options.imageRatio);

    if (revUtils.isArray(this.options.imageRatio)) {
        for (var i = 0; i < this.options.imageRatio.length; i++) {
            if ((!this.options.imageRatio[i].media || window.matchMedia(this.options.imageRatio[i].media).matches)
                && (!this.options.imageRatio[i].selector || matchesSelector(item.element, this.options.imageRatio[i].selector))) {
                setImageSize(this.options.imageRatio[i].ratio);
            }
        }
    }
};

AnyGrid.prototype._getItemLayoutPosition = function( item ) {
    var computedStyle = this.getComputedStyle(item.element);
    var paddingLeft = parseInt(computedStyle.getPropertyValue('padding-left'));
    var paddingRight = parseInt(computedStyle.getPropertyValue('padding-right'));

    var width = ((this.containerWidth / this.perRow) + ((paddingLeft + paddingRight) / this.perRow)) * item.span;

    item.element.style.width = width + 'px';

    if (this.index == 0 && this.options.adjustGutter) {
      this.element.parentNode.style.marginLeft = (paddingLeft * -1) + 'px';
    }

    item.width = width;
    item.breakpoint = this.getItemBreakpoint(width);
    item.greaterLessThanBreakPoints = this.getGreaterLessThanBreakPoints(item.breakpoint);
    var image = item.element.querySelector('.rev-image');
    if (image) {
      this.setImageSize(item);
      var rect = image.getBoundingClientRect();
      var imageWidth = Number(Math.round((rect.width ? rect.width : (rect.right - rect.left)) + 'e2') + 'e-2');

      item.preloaderHeight = Number(Math.round((imageWidth * (item.imageHeight / item.imageWidth)) + 'e2') + 'e-2');
      item.preloaderWidth =  Number(Math.round((item.preloaderHeight * (item.imageWidth / item.imageHeight)) + 'e2') + 'e-2');

      image.style.height = item.preloaderHeight + 'px';
    }

    if (this.stacking) {
      var stacking = true;
    } else {
      var stacking = false;
    }

    var row = this.nextRow;
    this.row = row;

    var column = this.nextColumn;

    item.row = row;
    item.column = column;

    if (!this.rows[row]) {
      this.rows[row] = {
          top: 0,
          count: 0,
          maxHeight: 0
      };
    }

    if (!this.rows[row].perRow) {
      this.rows[row].perRow = this.perRow;
    }

    // revUtils.removeClass(item.element, 'rev-content-', true);

    var className = 'rev-content';

    className += ' rev-content-' + item.type;
    // revUtils.addClass(item.element, 'rev-content-' + item.type);

    className += ' rev-content-breakpoint-' + item.breakpoint;


    // revUtils.addClass(item.element, 'rev-content-breakpoint-' + item.breakpoint);
    // var greaterLessThanBreakPoints = this.getGreaterLessThanBreakPoints(breakpoint);
    for (var i = 0; i < item.greaterLessThanBreakPoints.gt.length; i++) {
      className += ' rev-content-breakpoint-gt-' + item.greaterLessThanBreakPoints.gt[i];
    }
    for (var i = 0; i < item.greaterLessThanBreakPoints.lt.length; i++) {
      className += ' rev-content-breakpoint-lt-' + item.greaterLessThanBreakPoints.lt[i];
    }

    className += ' rev-content-row-' + (row);

    item.element.className = className;

    item.index = this.index;


    if (this.perRow === 1) {

        this.rowCounter++;

        if (this.rowCounter == this.rows[row].perRow) {
            this.rowCounter = 0;
            this.spanCounter = 0;
            this.nextRow++;
        }

        this.index++;

        return {
            x: false,
            y: false
        }
    } else if (this.options.masonry) {
        item.getSize();

        var column = this.index % this.columns.length;

        var x = column * width;
        var y = this.columns[column];

        var itemHeight = (this.options.itemHeight ? this.options.itemHeight : item.size.height);

        this.rowsCount = (this.items.length / this.columns.length);

        if (this.options.orderMasonry) {
            this.columns[column] = this.columns[column] + item.size.height;
            this.maxHeight = Math.max(this.maxHeight, this.columns[column]);
        } else {
            var minimumY = Math.min.apply( Math, this.columns );
            var shortColIndex = this.columns.indexOf( minimumY );
            var x = width * shortColIndex;
            var y = minimumY;
            this.columns[ shortColIndex ] = minimumY + itemHeight;
            this.maxHeight = Math.max.apply( Math, this.columns );
        }

        this.rows[row] = this.rows[row] || {};
        if (!this.rows[row].maxHeight || (this.columns[column] > this.rows[row].maxHeight)) {
            this.rows[row].maxHeight = this.columns[column];
        }
        if (!this.rows[row].height || (itemHeight > this.rows[row].height)) {
            this.rows[row].height = itemHeight;
        }

        this.rowCounter++;

        if (this.rowCounter == this.rows[row].perRow) {
            this.rowCounter = 0;
            this.spanCounter = 0;
            this.nextRow++;
        }

        this.index++;

        return {
          x: x,
          y: y
        }
    }
};

Outlayer.prototype._positionItem = function( item, x, y, isInstant ) {

    if (x === false && y === false) {
        item.element.style.position = 'relative';
        item.element.style.top = null;
        item.element.style.left = null;
        return;
    }

    item.element.style.position = 'absolute';

    if ( isInstant ) {
        // if not transition, just set CSS
        item.goTo( x, y );
    } else {
        item.moveTo( x, y );
    }
};

AnyGrid.prototype._getContainerSize = function() {
    return {
        height: this.perRow === 1 ? 'auto' : this.maxHeight
    };
};

return AnyGrid;

}));
/*!
 * Waves v0.7.5
 * http://fian.my.id/Waves
 *
 * Copyright 2014-2016 Alfiana E. Sibuea and other contributors
 * Released under the MIT license
 * https://github.com/fians/Waves/blob/master/LICENSE
 */

;(function(window, factory) {
    'use strict';

    // AMD. Register as an anonymous module.  Wrap in function so we have access
    // to root via `this`.
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return factory.apply(window);
        });
    }

    // Node. Does not work with strict CommonJS, but only CommonJS-like
    // environments that support module.exports, like Node.
    else if (typeof exports === 'object') {
        module.exports = factory.call(window);
    }

    // Browser globals.
    else {
        window.Waves = factory.call(window);
    }
})(typeof global === 'object' ? global : this, function() {
    'use strict';

    var Waves            = Waves || {};
    var $$               = document.querySelectorAll.bind(document);
    var toString         = Object.prototype.toString;
    var isTouchAvailable = 'ontouchstart' in window;


    // Find exact position of element
    function isWindow(obj) {
        return obj !== null && obj === obj.window;
    }

    function getWindow(elem) {
        return isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
    }

    function isObject(value) {
        var type = typeof value;
        return type === 'function' || type === 'object' && !!value;
    }

    function isDOMNode(obj) {
        return isObject(obj) && obj.nodeType > 0;
    }

    function getWavesElements(nodes) {
        var stringRepr = toString.call(nodes);

        if (stringRepr === '[object String]') {
            return $$(nodes);
        } else if (isObject(nodes) && /^\[object (Array|HTMLCollection|NodeList|Object)\]$/.test(stringRepr) && nodes.hasOwnProperty('length')) {
            return nodes;
        } else if (isDOMNode(nodes)) {
            return [nodes];
        }

        return [];
    }

    function offset(elem) {
        var docElem, win,
            box = { top: 0, left: 0 },
            doc = elem && elem.ownerDocument;

        docElem = doc.documentElement;

        if (typeof elem.getBoundingClientRect !== typeof undefined) {
            box = elem.getBoundingClientRect();
        }
        win = getWindow(doc);
        return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    }

    function convertStyle(styleObj) {
        var style = '';

        for (var prop in styleObj) {
            if (styleObj.hasOwnProperty(prop)) {
                style += (prop + ':' + styleObj[prop] + ';');
            }
        }

        return style;
    }

    var Effect = {

        // Effect duration
        duration: 750,

        // Effect delay (check for scroll before showing effect)
        delay: 200,

        show: function(e, element, velocity) {

            // Disable right click
            if (e.button === 2) {
                return false;
            }

            element = element || this;

            // Create ripple
            var ripple = document.createElement('div');
            ripple.className = 'waves-ripple waves-rippling';
            element.appendChild(ripple);

            // Get click coordinate and element width
            var pos       = offset(element);
            var relativeY = 0;
            var relativeX = 0;
            // Support for touch devices
            if('touches' in e && e.touches.length) {
                relativeY   = (e.touches[0].pageY - pos.top);
                relativeX   = (e.touches[0].pageX - pos.left);
            }
            //Normal case
            else {
                relativeY   = (e.pageY - pos.top);
                relativeX   = (e.pageX - pos.left);
            }
            // Support for synthetic events
            relativeX = relativeX >= 0 ? relativeX : 0;
            relativeY = relativeY >= 0 ? relativeY : 0;

            var scale     = 'scale(' + ((element.clientWidth / 100) * 3) + ')';
            var translate = 'translate(0,0)';

            if (velocity) {
                translate = 'translate(' + (velocity.x) + 'px, ' + (velocity.y) + 'px)';
            }

            // Attach data to element
            ripple.setAttribute('data-hold', Date.now());
            ripple.setAttribute('data-x', relativeX);
            ripple.setAttribute('data-y', relativeY);
            ripple.setAttribute('data-scale', scale);
            ripple.setAttribute('data-translate', translate);

            // Set ripple position
            var rippleStyle = {
                top: relativeY + 'px',
                left: relativeX + 'px'
            };

            ripple.classList.add('waves-notransition');
            ripple.setAttribute('style', convertStyle(rippleStyle));
            ripple.classList.remove('waves-notransition');

            // Scale the ripple
            rippleStyle['-webkit-transform'] = scale + ' ' + translate;
            rippleStyle['-moz-transform'] = scale + ' ' + translate;
            rippleStyle['-ms-transform'] = scale + ' ' + translate;
            rippleStyle['-o-transform'] = scale + ' ' + translate;
            rippleStyle.transform = scale + ' ' + translate;
            rippleStyle.opacity = '1';

            var duration = e.type === 'mousemove' ? 2500 : Effect.duration;
            rippleStyle['-webkit-transition-duration'] = duration + 'ms';
            rippleStyle['-moz-transition-duration']    = duration + 'ms';
            rippleStyle['-o-transition-duration']      = duration + 'ms';
            rippleStyle['transition-duration']         = duration + 'ms';

            ripple.setAttribute('style', convertStyle(rippleStyle));
        },

        hide: function(e, element) {
            element = element || this;

            var ripples = element.getElementsByClassName('waves-rippling');

            for (var i = 0, len = ripples.length; i < len; i++) {
                removeRipple(e, element, ripples[i]);
            }
        }
    };

    /**
     * Collection of wrapper for HTML element that only have single tag
     * like <input> and <img>
     */
    var TagWrapper = {

        // Wrap <input> tag so it can perform the effect
        input: function(element) {

            var parent = element.parentNode;

            // If input already have parent just pass through
            if (parent.tagName.toLowerCase() === 'i' && parent.classList.contains('waves-effect')) {
                return;
            }

            // Put element class and style to the specified parent
            var wrapper       = document.createElement('i');
            wrapper.className = element.className + ' waves-input-wrapper';
            element.className = 'waves-button-input';

            // Put element as child
            parent.replaceChild(wrapper, element);
            wrapper.appendChild(element);

            // Apply element color and background color to wrapper
            var elementStyle    = window.getComputedStyle(element, null);
            var color           = elementStyle.color;
            var backgroundColor = elementStyle.backgroundColor;

            wrapper.setAttribute('style', 'color:' + color + ';background:' + backgroundColor);
            element.setAttribute('style', 'background-color:rgba(0,0,0,0);');

        },

        // Wrap <img> tag so it can perform the effect
        img: function(element) {

            var parent = element.parentNode;

            // If input already have parent just pass through
            if (parent.tagName.toLowerCase() === 'i' && parent.classList.contains('waves-effect')) {
                return;
            }

            // Put element as child
            var wrapper  = document.createElement('i');
            parent.replaceChild(wrapper, element);
            wrapper.appendChild(element);

        }
    };

    /**
     * Hide the effect and remove the ripple. Must be
     * a separate function to pass the JSLint...
     */
    function removeRipple(e, el, ripple) {

        // Check if the ripple still exist
        if (!ripple) {
            return;
        }

        ripple.classList.remove('waves-rippling');

        var relativeX = ripple.getAttribute('data-x');
        var relativeY = ripple.getAttribute('data-y');
        var scale     = ripple.getAttribute('data-scale');
        var translate = ripple.getAttribute('data-translate');

        // Get delay beetween mousedown and mouse leave
        var diff = Date.now() - Number(ripple.getAttribute('data-hold'));
        var delay = 350 - diff;

        if (delay < 0) {
            delay = 0;
        }

        if (e.type === 'mousemove') {
            delay = 150;
        }

        // Fade out ripple after delay
        var duration = e.type === 'mousemove' ? 2500 : Effect.duration;

        setTimeout(function() {

            var style = {
                top: relativeY + 'px',
                left: relativeX + 'px',
                opacity: '0',

                // Duration
                '-webkit-transition-duration': duration + 'ms',
                '-moz-transition-duration': duration + 'ms',
                '-o-transition-duration': duration + 'ms',
                'transition-duration': duration + 'ms',
                '-webkit-transform': scale + ' ' + translate,
                '-moz-transform': scale + ' ' + translate,
                '-ms-transform': scale + ' ' + translate,
                '-o-transform': scale + ' ' + translate,
                'transform': scale + ' ' + translate
            };

            ripple.setAttribute('style', convertStyle(style));

            setTimeout(function() {
                try {
                    el.removeChild(ripple);
                } catch (e) {
                    return false;
                }
            }, duration);

        }, delay);
    }


    /**
     * Disable mousedown event for 500ms during and after touch
     */
    var TouchHandler = {

        /* uses an integer rather than bool so there's no issues with
         * needing to clear timeouts if another touch event occurred
         * within the 500ms. Cannot mouseup between touchstart and
         * touchend, nor in the 500ms after touchend. */
        touches: 0,

        allowEvent: function(e) {

            var allow = true;

            if (/^(mousedown|mousemove)$/.test(e.type) && TouchHandler.touches) {
                allow = false;
            }

            return allow;
        },
        registerEvent: function(e) {
            var eType = e.type;

            if (eType === 'touchstart') {

                TouchHandler.touches += 1; // push

            } else if (/^(touchend|touchcancel)$/.test(eType)) {

                setTimeout(function() {
                    if (TouchHandler.touches) {
                        TouchHandler.touches -= 1; // pop after 500ms
                    }
                }, 500);

            }
        }
    };


    /**
     * Delegated click handler for .waves-effect element.
     * returns null when .waves-effect element not in "click tree"
     */
    function getWavesEffectElement(e) {

        if (TouchHandler.allowEvent(e) === false) {
            return null;
        }

        var element = null;
        var target = e.target || e.srcElement;

        while (target.parentElement !== null) {
            if (target.classList.contains('waves-effect') && (!(target instanceof SVGElement))) {
                element = target;
                break;
            }
            target = target.parentElement;
        }

        return element;
    }

    /**
     * Bubble the click and show effect if .waves-effect elem was found
     */
    function showEffect(e) {

        // Disable effect if element has "disabled" property on it
        // In some cases, the event is not triggered by the current element
        // if (e.target.getAttribute('disabled') !== null) {
        //     return;
        // }

        var element = getWavesEffectElement(e);

        if (element !== null) {

            // Make it sure the element has either disabled property, disabled attribute or 'disabled' class
            if (element.disabled || element.getAttribute('disabled') || element.classList.contains('disabled')) {
                return;
            }

            TouchHandler.registerEvent(e);

            if (e.type === 'touchstart' && Effect.delay) {

                var hidden = false;

                var timer = setTimeout(function () {
                    timer = null;
                    Effect.show(e, element);
                }, Effect.delay);

                var hideEffect = function(hideEvent) {

                    // if touch hasn't moved, and effect not yet started: start effect now
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                        Effect.show(e, element);
                    }
                    if (!hidden) {
                        hidden = true;
                        Effect.hide(hideEvent, element);
                    }
                };

                var touchMove = function(moveEvent) {
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    hideEffect(moveEvent);
                };

                element.addEventListener('touchmove', touchMove, false);
                element.addEventListener('touchend', hideEffect, false);
                element.addEventListener('touchcancel', hideEffect, false);

            } else {

                Effect.show(e, element);

                if (isTouchAvailable) {
                    element.addEventListener('touchend', Effect.hide, false);
                    element.addEventListener('touchcancel', Effect.hide, false);
                }

                element.addEventListener('mouseup', Effect.hide, false);
                element.addEventListener('mouseleave', Effect.hide, false);
            }
        }
    }

    Waves.init = function(options) {
        var body = document.body;

        options = options || {};

        if ('duration' in options) {
            Effect.duration = options.duration;
        }

        if ('delay' in options) {
            Effect.delay = options.delay;
        }

        if (isTouchAvailable) {
            body.addEventListener('touchstart', showEffect, false);
            body.addEventListener('touchcancel', TouchHandler.registerEvent, false);
            body.addEventListener('touchend', TouchHandler.registerEvent, false);
        }

        body.addEventListener('mousedown', showEffect, false);
    };


    /**
     * Attach Waves to dynamically loaded inputs, or add .waves-effect and other
     * waves classes to a set of elements. Set drag to true if the ripple mouseover
     * or skimming effect should be applied to the elements.
     */
    Waves.attach = function(elements, classes) {

        elements = getWavesElements(elements);

        if (toString.call(classes) === '[object Array]') {
            classes = classes.join(' ');
        }

        classes = classes ? ' ' + classes : '';

        var element, tagName;

        for (var i = 0, len = elements.length; i < len; i++) {

            element = elements[i];
            tagName = element.tagName.toLowerCase();

            if (['input', 'img'].indexOf(tagName) !== -1) {
                TagWrapper[tagName](element);
                element = element.parentElement;
            }

            if (element.className.indexOf('waves-effect') === -1) {
                element.className += ' waves-effect' + classes;
            }
        }
    };


    /**
     * Cause a ripple to appear in an element via code.
     */
    Waves.ripple = function(elements, options) {
        elements = getWavesElements(elements);
        var elementsLen = elements.length;

        options          = options || {};
        options.wait     = options.wait || 0;
        options.position = options.position || null; // default = centre of element


        if (elementsLen) {
            var element, pos, off, centre = {}, i = 0;
            var mousedown = {
                type: 'mousedown',
                button: 1
            };
            var hideRipple = function(mouseup, element) {
                return function() {
                    Effect.hide(mouseup, element);
                };
            };

            for (; i < elementsLen; i++) {
                element = elements[i];
                pos = options.position || {
                    x: element.clientWidth / 2,
                    y: element.clientHeight / 2
                };

                off      = offset(element);
                centre.x = off.left + pos.x;
                centre.y = off.top + pos.y;

                mousedown.pageX = centre.x;
                mousedown.pageY = centre.y;

                Effect.show(mousedown, element);

                if (options.wait >= 0 && options.wait !== null) {
                    var mouseup = {
                        type: 'mouseup',
                        button: 1
                    };

                    setTimeout(hideRipple(mouseup, element), options.wait);
                }
            }
        }
    };

    /**
     * Remove all ripples from an element.
     */
    Waves.calm = function(elements) {
        elements = getWavesElements(elements);
        var mouseup = {
            type: 'mouseup',
            button: 1
        };

        for (var i = 0, len = elements.length; i < len; i++) {
            Effect.hide(mouseup, elements[i]);
        }
    };

    /**
     * Deprecated API fallback
     */
    Waves.displayEffect = function(options) {
        console.error('Waves.displayEffect() has been deprecated and will be removed in future version. Please use Waves.init() to initialize Waves effect');
        Waves.init(options);
    };

    return Waves;
});

/*! Hammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean} [merge=false]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down
        if (!this.pressed) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */

var DEDUP_TIMEOUT = 2500;
var DEDUP_DISTANCE = 25;

function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);

    this.primaryTouch = null;
    this.lastTouches = [];
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {Hammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
        }

        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
        if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

function recordTouches(eventType, eventData) {
    if (eventType & INPUT_START) {
        this.primaryTouch = eventData.changedPointers[0].identifier;
        setLastTouch.call(this, eventData);
    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
        setLastTouch.call(this, eventData);
    }
}

function setLastTouch(eventData) {
    var touch = eventData.changedPointers[0];

    if (touch.identifier === this.primaryTouch) {
        var lastTouch = {x: touch.clientX, y: touch.clientY};
        this.lastTouches.push(lastTouch);
        var lts = this.lastTouches;
        var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
                lts.splice(i, 1);
            }
        };
        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
    }
}

function isSyntheticEvent(eventData) {
    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
    for (var i = 0; i < this.lastTouches.length; i++) {
        var t = this.lastTouches[i];
        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
        }
    }
    return false;
}

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';
var TOUCH_ACTION_MAP = getTouchActionProps();

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

function getTouchActionProps() {
    if (!NATIVE_TOUCH_ACTION) {
        return false;
    }
    var touchMap = {};
    var cssSupports = window.CSS && window.CSS.supports;
    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

        // If css.supports is not supported but there is native touch-action assume it supports
        // all values. This is the case for IE 10 and 11.
        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
    });
    return touchMap;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Hammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
Hammer.VERSION = '2.0.7';

/**
 * default settings
 * @namespace
 */
Hammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of Hammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, Hammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];
    this.oldCssProps = {};

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        if (events === undefined) {
            return;
        }
        if (handler === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        if (events === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    var prop;
    each(manager.options.cssProps, function(value, name) {
        prop = prefixed(element.style, name);
        if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
        } else {
            element.style[prop] = manager.oldCssProps[prop] || '';
        }
    });
    if (!add) {
        manager.oldCssProps = {};
    }
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');

/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   3.3.1
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  return function () {
    vertxNext(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

polyfill();
// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));
//# sourceMappingURL=es6-promise.map
/* Font Face Observer v2.0.13 - © Bram Stein. License: BSD-3-Clause */(function(){function l(a,b){document.addEventListener?a.addEventListener("scroll",b,!1):a.attachEvent("scroll",b)}function m(a){document.body?a():document.addEventListener?document.addEventListener("DOMContentLoaded",function c(){document.removeEventListener("DOMContentLoaded",c);a()}):document.attachEvent("onreadystatechange",function k(){if("interactive"==document.readyState||"complete"==document.readyState)document.detachEvent("onreadystatechange",k),a()})};function r(a){this.a=document.createElement("div");this.a.setAttribute("aria-hidden","true");this.a.appendChild(document.createTextNode(a));this.b=document.createElement("span");this.c=document.createElement("span");this.h=document.createElement("span");this.f=document.createElement("span");this.g=-1;this.b.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
this.f.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText="display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c)}
function t(a,b){a.a.style.cssText="max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;white-space:nowrap;font-synthesis:none;font:"+b+";"}function y(a){var b=a.a.offsetWidth,c=b+100;a.f.style.width=c+"px";a.c.scrollLeft=c;a.b.scrollLeft=a.b.scrollWidth+100;return a.g!==b?(a.g=b,!0):!1}function z(a,b){function c(){var a=k;y(a)&&a.a.parentNode&&b(a.g)}var k=a;l(a.b,c);l(a.c,c);y(a)};function A(a,b){var c=b||{};this.family=a;this.style=c.style||"normal";this.weight=c.weight||"normal";this.stretch=c.stretch||"normal"}var B=null,C=null,E=null,F=null;function G(){if(null===C)if(J()&&/Apple/.test(window.navigator.vendor)){var a=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/.exec(window.navigator.userAgent);C=!!a&&603>parseInt(a[1],10)}else C=!1;return C}function J(){null===F&&(F=!!document.fonts);return F}
function K(){if(null===E){var a=document.createElement("div");try{a.style.font="condensed 100px sans-serif"}catch(b){}E=""!==a.style.font}return E}function L(a,b){return[a.style,a.weight,K()?a.stretch:"","100px",b].join(" ")}
A.prototype.load=function(a,b){var c=this,k=a||"BESbswy",q=0,D=b||3E3,H=(new Date).getTime();return new Promise(function(a,b){if(J()&&!G()){var M=new Promise(function(a,b){function e(){(new Date).getTime()-H>=D?b():document.fonts.load(L(c,'"'+c.family+'"'),k).then(function(c){1<=c.length?a():setTimeout(e,25)},function(){b()})}e()}),N=new Promise(function(a,c){q=setTimeout(c,D)});Promise.race([N,M]).then(function(){clearTimeout(q);a(c)},function(){b(c)})}else m(function(){function u(){var b;if(b=-1!=
f&&-1!=g||-1!=f&&-1!=h||-1!=g&&-1!=h)(b=f!=g&&f!=h&&g!=h)||(null===B&&(b=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent),B=!!b&&(536>parseInt(b[1],10)||536===parseInt(b[1],10)&&11>=parseInt(b[2],10))),b=B&&(f==v&&g==v&&h==v||f==w&&g==w&&h==w||f==x&&g==x&&h==x)),b=!b;b&&(d.parentNode&&d.parentNode.removeChild(d),clearTimeout(q),a(c))}function I(){if((new Date).getTime()-H>=D)d.parentNode&&d.parentNode.removeChild(d),b(c);else{var a=document.hidden;if(!0===a||void 0===a)f=e.a.offsetWidth,
g=n.a.offsetWidth,h=p.a.offsetWidth,u();q=setTimeout(I,50)}}var e=new r(k),n=new r(k),p=new r(k),f=-1,g=-1,h=-1,v=-1,w=-1,x=-1,d=document.createElement("div");d.dir="ltr";t(e,L(c,"sans-serif"));t(n,L(c,"serif"));t(p,L(c,"monospace"));d.appendChild(e.a);d.appendChild(n.a);d.appendChild(p.a);document.body.appendChild(d);v=e.a.offsetWidth;w=n.a.offsetWidth;x=p.a.offsetWidth;I();z(e,function(a){f=a;u()});t(e,L(c,'"'+c.family+'",sans-serif'));z(n,function(a){g=a;u()});t(n,L(c,'"'+c.family+'",serif'));
z(p,function(a){h=a;u()});t(p,L(c,'"'+c.family+'",monospace'))})})};"object"===typeof module?module.exports=A:(window.FontFaceObserver=A,window.FontFaceObserver.prototype.load=A.prototype.load);}());

// Adapted from https://gist.github.com/paulirish/1579671 which derived from
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

if (!Date.now)
    Date.now = function() { return new Date().getTime(); };

(function() {
    'use strict';

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
        var vp = vendors[i];
        window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
        window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame']
                                   || window[vp+'CancelRequestAnimationFrame']);
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) // iOS6 is buggy
        || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
        var lastTime = 0;
        window.requestAnimationFrame = function(callback) {
            var now = Date.now();
            var nextTime = Math.max(lastTime + 16, now);
            return setTimeout(function() { callback(lastTime = nextTime); },
                              nextTime - now);
        };
        window.cancelAnimationFrame = clearTimeout;
    }
}());
/**
 * Revcontent utils
 */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition
    // browser global
    window.revUtils = factory(
      window,
      window.revOverlay
    );

}( window, function factory( window, revOverlay ) {

'use strict';

var utils = {};

utils.deprecateOptions = function(opts) {
    if (opts.overlay) {
        opts.image_overlay = opts.overlay;
    }

    if (opts.overlay_icons) {
        opts.image_overlay_icons = opts.overlay_icons;
    }

    if (opts.overlay_position) {
        opts.image_overlay_position = opts.overlay_position;
    }

    return opts;
};

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

utils.serialize = function(obj, prefix) {
    if (!obj) {
        return '';
    }
    var str = [];
    for(var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            var k = prefix ? prefix + "[" + prop + "]" : prop, v = obj[prop];
            str.push(typeof v == "object" &&
            (Object.prototype.toString.call(v) == "[object Object]") ? this.serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    return str.join("&");
};

utils.appendStyle = function(style, namespace, extra) {
    var namespace = namespace + '-append-style';

    if (!document.getElementById(namespace)) {
        var el = document.createElement('style');
        el.type = 'text/css';
        el.id = namespace;
        el.innerHTML = style;
        document.getElementsByTagName('head')[0].appendChild(el);
    }

    if (extra && typeof extra === 'string') {
        var namespaceExtra = namespace + '-extra'
        var extraStyleElement = document.getElementById(namespaceExtra);

        if (extraStyleElement) {
            extraStyleElement.innerHTML += extra;
        } else {
            var el = document.createElement('style');
            el.type = 'text/css';
            el.id = namespaceExtra;
            el.innerHTML = extra;
            document.getElementsByTagName('head')[0].appendChild(el);
        }
    }
};

//b overwrites a only one level :/
utils.extend = function( a, b ) {
    var c = {};
    for (var prop in a) {
        c[prop] = a[prop];
    }

    for ( var prop in b ) {
        if (typeof b[prop] == 'object' &&
        (Object.prototype.toString.call(b[prop]) == "[object Object]")) { // if the prop is an obj recurse
            c[prop] = this.extend(c[prop], b[prop]);
        } else {
            c[prop] = b[prop];
        }
    }
    return c;
};

utils.merge = function(a, b) {
    for (var prop in b) {
        a[prop] = b[prop];
    }
    return a;
};

utils.inArray = function(array, item) {
    for (var i = 0; i < array.length; i++) {
    if (array[i] === item)
      return i;
    }
    return -1;
};

utils.setCookie = function(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    var cpath = "; path=/; domain=" + top.location.host;
    document.cookie = cname + "=" + cvalue + "; " + expires + cpath;
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
};

utils.append = function(el, html) {
    el.appendChild(html);
};

utils.remove = function(el) {
    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
    }
};

utils.wrap = function(el, wrapper) {
    if (el.nextSibling) {
        el.parentNode.insertBefore(wrapper, el.nextSibling);
    } else {
        el.parentNode.appendChild(wrapper);
    }

    wrapper.appendChild(el);
};

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
};

utils.addClass = function(el, className) {
    if (!el) return false;

    if (el.classList) {
        el.classList.add(className);
    } else {
        this.removeClass(el, className); // make sure we don't double up
        el.className += ' ' + className;
    }
};

utils.removeClass = function(el, className, prefix) {
    if (!el) return false;

    var classes = el.className.trim().split(" ").filter(function(c) {
        if (prefix) {
            return c.lastIndexOf(className, 0) !== 0;
        }
        return c !== className;
    });

    el.className = classes.join(" ").trim();
};

utils.dispatchScrollbarResizeEvent = function() {
    var id = 'rc-scrollbar-resize-listener-frame';
    if (document.getElementById(id)) { // singleton
        return;
    }
    var iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.style.cssText = 'height: 0; background-color: transparent; margin: 0; padding: 0; overflow: hidden; border-width: 0; position: absolute; width: 100%;';

    var that = this;
    // Register our event when the iframe loads
    iframe.onload = function() {
        // trigger resize event once when the iframe resizes
        var callback = function() {
            try {
                if (Event.prototype.initEvent) { // deprecated
                    var evt = document.createEvent('UIEvents');
                    evt.initUIEvent('resize', true, false, window, 0);
                } else {
                    var evt = new UIEvent('resize');
                }
                window.dispatchEvent(evt);
                // only trigger once
                that.removeEventListener(iframe.contentWindow, 'resize', callback);
            } catch(e) {
            }
        };

        that.addEventListener(iframe.contentWindow, 'resize', callback);
    };

    // Stick the iframe somewhere out of the way
    document.body.appendChild(iframe);
}

utils.addEventListener = function(el, eventName, handler, options) {
    if (!handler) {
        return;
    }

    var defaultOptions = false; // useCapture defaults to false
    if (this.eventListenerPassiveSupported()) {
        // passive by default
        var defaultOptions = {
          passive: (options && typeof options.passive !== 'undefined' ? options.passive : true)
        };
    }
    if (el.addEventListener) {
        el.addEventListener(eventName, handler, defaultOptions);
    } else {
        el.attachEvent('on' + eventName, function(){
            handler.call(el);
        });
    }
};

// if event listener does not preventDefault it should be passive
utils.eventListenerPassiveSupported = function() {
    var supportsCaptureOption = false;
    try {
      addEventListener("test", null, Object.defineProperty({}, 'passive', {get: function () {
        supportsCaptureOption = true;
      }}));
    } catch(e) {}

    return supportsCaptureOption
};

utils.removeEventListener = function(el, eventName, handler) {
    if (!handler) {
        return;
    }
    if (el.removeEventListener) {
        el.removeEventListener(eventName, handler);
    } else {
        el.detachEvent('on' + eventName, handler);
    }
};

utils.transformCss = function(el, css) {
    el.style.transform = css;
    el.style.MsTransform = css;
    el.style.WebkitTransform = css;
    el.style.OTransform = css;
};

utils.transitionCss = function(el, css) {
    el.style.transition = css;
    el.style.MsTransition = css;
    el.style.WebkitTransition = css;
    el.style.OTransition = css;
};

utils.transitionDurationCss = function(el, css) {
    el.style.transitionDuration = css;
    el.style.WebkitTransitionDuration = css;
    el.style.MozTransitionDuration = css;
    el.style.OTransitionDuration = css;
};

utils.ellipsisText = function(headlines) {
    for (var i = 0; i < headlines.length; i++) {
        var text,
            container = headlines[i],
            headline = container.children[0];
        while(container.clientHeight < (container.scrollHeight > container.clientHeight ? (container.scrollHeight - 1) : container.scrollHeight)) {
            text = headline.innerHTML.trim();
            if(text.split(' ').length <= 1) {
                break;
            }
            headline.innerHTML = text.replace(/\W*\s(\S)*$/, '...');
        }
    }
};

utils.imagesLoaded = function(images, emitter) {
    // emit done event when all images have finished loading

    if (!images.length) {
        emitter.emitEvent('imagesLoaded');
    }

    var maxMilliseconds = 4000;

    // LoadingImage code from https://github.com/desandro/imagesloaded
    function LoadingImage( img ) {
        this.img = img;
    }

    LoadingImage.prototype = new EventEmitter();

    LoadingImage.prototype.check = function() {
        // If complete is true and browser supports natural sizes,
        // try to check for image status manually.
        var isComplete = this.getIsImageComplete();
        if ( isComplete ) {
            // HACK check async to allow time to bind listeners
            var that = this;
            setTimeout(function() {
                // report based on naturalWidth
                that.confirm( that.img.naturalWidth !== 0, 'naturalWidth' );
            });
            return;
        }

        // If none of the checks above matched, simulate loading on detached element.
        this.proxyImage = new Image();
        utils.addEventListener(this.proxyImage, 'load', this);
        utils.addEventListener(this.proxyImage, 'error', this);
        // bind to image as well for Firefox. #191
        utils.addEventListener(this.img, 'load', this);
        utils.addEventListener(this.img, 'error', this);
        this.proxyImage.src = this.img.src;
    };

    LoadingImage.prototype.getIsImageComplete = function() {
        return this.img.complete && this.img.naturalWidth !== undefined;
    };

    LoadingImage.prototype.confirm = function( isLoaded, message ) {
        this.isLoaded = isLoaded;
        this.emit( 'progress', this, this.img, message );
    };

    // ----- events ----- //

    // trigger specified handler for event type
    LoadingImage.prototype.handleEvent = function( event ) {
        var method = 'on' + event.type;
        if ( this[ method ] ) {
          this[ method ]( event );
        }
    };

    LoadingImage.prototype.onload = function() {
        this.confirm( true, 'onload' );
        this.unbindEvents();
    };

    LoadingImage.prototype.onerror = function() {
        this.confirm( false, 'onerror' );
        this.unbindEvents();
    };

    LoadingImage.prototype.unbindEvents = function() {
        utils.removeEventListener(this.proxyImage, 'load', this);
        utils.removeEventListener(this.proxyImage, 'error', this);
        utils.removeEventListener(this.img, 'load', this);
        utils.removeEventListener(this.img, 'error', this);
    };

    var progressedCount = 0;

    for (var i=0; i < images.length; i++ ) {
        var loadingImage = new LoadingImage(images[i]);
        loadingImage.once( 'progress', function() {
            progressedCount++;
            if (progressedCount == images.length) {
                emitter.emitEvent('imagesLoaded');
            }
        });
        loadingImage.check();
    }

    // don't wait longer than maxMilliseconds, this is a safety for network slowness or other issues
    setTimeout(function() {
        emitter.emitEvent('imagesLoaded');
    }, maxMilliseconds);
}

utils.getComputedStyle = function (el, prop, pseudoElt) {
    if (getComputedStyle !== 'undefined') {
        return getComputedStyle(el, pseudoElt).getPropertyValue(prop);
    } else {
        return el.currentStyle[prop];
    }
};

utils.setImage = function(wrapperElement, src) {
    var img = document.createElement('img');
    img.src = src;
    this.append(wrapperElement, img);
};

utils.mergeOverlayIcons = function(icons) {
    this.merge(revOverlay.icons, icons);
};

utils.imageOverlay = function(image, content_type, overlay, position) {
    revOverlay.image(image, content_type, overlay, position);
};

utils.adOverlay = function(ad, content_type, overlay, position) {
    revOverlay.ad(ad, content_type, overlay, position);
};

utils.checkVisible = function(element, callback, percentVisible, buffer) {
    var that = this;
    requestAnimationFrame(function() {
        // what percentage of the element should be visible
        var visibleHeightMultiplier = (typeof percentVisible === 'number') ? (parseInt(percentVisible) * .01) : 0;
        // fire if within buffer
        var bufferPixels = (typeof buffer === 'number') ? buffer : 0;

        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        var elementTop = element.getBoundingClientRect().top;
        var elementBottom = element.getBoundingClientRect().bottom;
        var elementVisibleHeight = element.offsetHeight * visibleHeightMultiplier;

        if ((scroll + windowHeight >= (elementTop + scroll + elementVisibleHeight - bufferPixels)) &&
            elementBottom > elementVisibleHeight) {
            callback.call(that);
        }
    });
};

utils.checkVisibleItem = function(item, callback, percentVisible, buffer, container) {
    var that = this;
    requestAnimationFrame(function() {

        if (container && ((container.offsetHeight) <= (item.element.offsetTop - container.scrollTop))) {
            callback.call(that, false, item)
            return;
        }
        // what percentage of the element should be visible
        var visibleHeightMultiplier = (typeof percentVisible === 'number') ? (parseInt(percentVisible) * .01) : 0;
        // fire if within buffer
        var bufferPixels = (typeof buffer === 'number') ? buffer : 0;

        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        var elementTop = item.element.getBoundingClientRect().top;
        var elementBottom = item.element.getBoundingClientRect().bottom;
        var elementVisibleHeight = item.element.offsetHeight * visibleHeightMultiplier;

        var containerBottom = container ? (scroll + windowHeight) - (container.getBoundingClientRect().top + scroll + container.offsetHeight) : 0;

        if ((scroll + windowHeight >= (elementTop + scroll + elementVisibleHeight - bufferPixels + (containerBottom > 0 ? containerBottom : 0) )) &&
            elementBottom > elementVisibleHeight) {
            callback.call(that, true, item);
        } else {
            callback.call(that, false, item);
        }
    });
};

utils.windowHeight = function() {
    return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

utils.windowWidth = function() {
    return document.documentElement.clientWidth || document.body.clientWidth;
}

utils.checkHidden = function(element, callback, percentHidden, checkBottom) {
    var that = this;
    requestAnimationFrame(function() {
        // what percentage of the element should be hidden
        var visibleHeightMultiplier = (typeof percentHidden === 'number') ? (parseInt(percentHidden) * .01) : 0;

        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

        if ((scroll + windowHeight < element.getBoundingClientRect().top + scroll ||
            (checkBottom !== false && element.getBoundingClientRect().top + (element.offsetHeight * visibleHeightMultiplier) <= 0))) {
            callback.call(that);
        }
    });
};

// get all images above an element
utils.imagesAbove = function(element) {
    // get all images
    var images = document.querySelectorAll('img');
    // top position of show visible element
    var elementTop = element.getBoundingClientRect().top;
    // if show visible element is below image add to imagesAboveElement array
    var imagesAboveElement = [];
    for (var i = 0; i < images.length; i++) {
        if (images[i].getBoundingClientRect().top < elementTop) {
            imagesAboveElement.push(images[i]);
        }
    }
    return imagesAboveElement;
};

utils.throttle = function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
        var context = scope || this;

        var now = +new Date,
            args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
};

utils.siblingIndex = function(el) {
    if (!el) {
        return false;
    }
    var i = 0;
    while( (el = el.previousSibling) != null ) {
      i++;
    }
    return i;
};

utils.storeUserOptions = function(options){
    var that = this;
    that.userOptions = options;
};

utils.retrieveUserOptions = function(){
    var that = this;
    return that.userOptions;
};

utils.isArray = function(param) {
    return Object.prototype.toString.call(param) === '[object Array]';
}

utils.docReady = function(fn) {
    if (document.readyState != 'loading'){
        fn();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        document.attachEvent('onreadystatechange', function() {
        if (document.readyState != 'loading')
            fn();
        });
    }
}

// -----  ----- //
return utils;

}));


// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.revDialog = factory(window, revUtils);

}( window, function factory(window, revUtils) {
// turn off strict for arguments.callee usage
// 'use strict';

    var RevDialog = function() {
        this.id = 'rev-opt-out';

        this.aboutFrame = null;
        this.aboutSrc = '//trends.revcontent.com/rc-about.php/%3Fdomain=http://code.revcontent.com&lg=//cdn.revcontent.com/assets/img/rc-logo.png';
        // this.aboutSrc = 'http://deelay.me/3000/http://trends.revcontent.com/rc-about.php/%3Fdomain=http://code.revcontent.com&lg=//cdn.revcontent.com/assets/img/rc-logo.png';
        this.aboutHeight = 455;
        this.aboutLoaded = false;

        this.interestFrame = null;
        this.interestSrc = '//trends.revcontent.com/rc-interests.php/?domain='+location.protocol + '//' + location.host+'&interests=1';
        // this.interestSrc = 'http://deelay.me/3000/http://trends.revcontent.com/rc-interests.php/?domain='+location.protocol + '//' + location.host+'&interests=1';
        this.interestHeight = 520;
        this.interestLoaded = false;
    };

    RevDialog.prototype.postMessage = function() {
        if (this.aboutFrame) {
            this.aboutFrame.contentWindow.postMessage({'msg': 'auth_me'}, '*');
        }
    };

    RevDialog.prototype.setActive = function(active) {
        this.active = active;

        switch (active) {
            case 'about':
                if (this.interestFrame) {
                    this.interestFrame.style.display = 'none';
                }
                // set height and class right away b/c is always first
                revUtils.removeClass(this.element, 'rev-interest-dialog');
                // wait for load before showing and centering
                if (!this.aboutLoaded) {
                    this.aboutFrame.style.opacity = 0;
                    this.modalContentContainer.style.overflow = 'hidden';
                    this.loading.style.display = 'block';
                    this.centerDialog(this.aboutHeight);
                    // create about iframe
                    var that = this;
                    revUtils.addEventListener(this.aboutFrame, 'load', function() {
                        that.loading.style.display = 'none';
                        that.modalContentContainer.style.overflow = 'visible';
                        that.aboutFrame.style.opacity = 1;
                        that.aboutLoaded = true;
                        revUtils.removeEventListener(that.aboutFrame, 'load', arguments.callee);
                        that.aboutFrame.contentWindow.postMessage({'msg': 'resize_me'}, '*');
                    });
                } else {
                    // this.aboutFrame.style.opacity = 1;
                    this.aboutFrame.style.display = 'block';
                    this.centerDialog();
                }
                break;
            case 'interest':
                this.aboutFrame.style.display = 'none';
                if (!this.interestLoaded) {
                    this.loading.style.display = 'block';
                    this.interestFrame = this.createFrame(this.interestSrc);
                    this.interestFrame.style.opacity = 0;
                    this.modalContentContainer.style.overflow = 'hidden';
                    this.modalContentContainer.appendChild(this.interestFrame);
                    var that = this;
                    revUtils.addEventListener(this.interestFrame, 'load', function() {
                        that.loading.style.display = 'none';
                        revUtils.addClass(that.element, 'rev-interest-dialog');
                        that.modalContentContainer.style.overflow = 'visible';
                        that.interestFrame.style.opacity = 1;
                        that.centerDialog(that.interestHeight);
                        that.interestLoaded = true;
                        revUtils.removeEventListener(that.interestFrame, 'load', arguments.callee);
                        that.interestFrame.contentWindow.postMessage({'msg': 'resize_me'}, '*');
                    });
                } else {
                    revUtils.addClass(this.element, 'rev-interest-dialog');
                    this.interestFrame.style.display = 'block';
                    this.centerDialog();
                }
                break;
        }
    };

    RevDialog.prototype.createFrame = function(src) {
        var frame = document.createElement('iframe');
        frame.setAttribute('class', 'rc-frame');
        frame.setAttribute('frameborder', 0);
        frame.setAttribute('width', '100%');
        frame.setAttribute('height', '100%');
        frame.setAttribute('src', src);
        return frame;
    }

    RevDialog.prototype.render = function() {
        var rendered = document.querySelector('#' + this.id);

        if (!rendered) {
            this.bodyOverflow = revUtils.getComputedStyle(document.body, 'overflow');

            this.element = document.createElement('div');
            this.element.className = 'revdialog';
            this.element.id = this.id;

            this.loading = document.createElement('p');
            this.loading.setAttribute('class', 'rd-loading');
            this.loading.innerHTML = 'Loading<span>.</span><span>.</span><span>.</span>';

            this.element.innerHTML = '<div class="rd-box-wrap">' +
                '<div class="rd-box-overlay" onclick="revDialog.closeDialog()"> &nbsp; </div>' +
                    '<div class="rd-vertical-offset">' +
                        '<div class="rd-box">' +
                            '<a class="rd-close-button" onclick="revDialog.closeDialog()">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>' +
                            '</a>' +
                            '<div class="rd-content">' +
                                '<div class="rd-modal-content"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(this.element);

            // cache the modal content container
            this.modalContentContainer = this.element.querySelector('.rd-modal-content');

            this.modalContentContainer.appendChild(this.loading);

            var frameSrc = this.aboutSrc;
            if (this.widget_id && this.pub_id) {
                frameSrc += '?widget_id=' + this.widget_id + '&pub_id=' + this.pub_id;
            }

            this.aboutFrame = this.createFrame(frameSrc);

            this.attachPostMesssage();

            // append iframe
            this.modalContentContainer.appendChild(this.aboutFrame);

            this.setActive('about');

            this.attachResize();
        }

        // set the body to overflow hidden
        document.body.style.overflow = 'hidden';

        return this.element;
    };

    RevDialog.prototype.showDialog = function(injectedDialog) {
        if (this.grid) {
            this.grid.unbindResize();
        }
        var that = injectedDialog || this;
        that.render().style.display = 'block';
        that.centerDialog();
        return false;
    };

    RevDialog.prototype.closeDialog = function() {
        this.aboutFrame.contentWindow.postMessage({'msg': 'close_me'}, '*');
        document.body.style.overflow = this.bodyOverflow;
        this.element.style.display = 'none';
        if (this.grid) {
            this.grid.bindResize();
        }
        // make sure we are ready for the about dialog if opened again
        this.setActive('about');
        return false;
    };

    RevDialog.prototype.centerDialog = function(height) {
        var containerWidth = document.documentElement.clientWidth;
        var containerHeight = document.documentElement.clientHeight;
        // do we need to go to compact mode?
        if (height) {
            this[this.active === 'about' ? 'aboutHeightActive' : 'interestHeightActive'] = height;
        }

        var frameHeight = this[this.active + 'HeightActive'];

        this.modalContentContainer.style.height = frameHeight + 'px';

        var availableSpace = containerHeight - 30;
        if (availableSpace < frameHeight) {
            this.modalContentContainer.style.height = availableSpace + 'px';
        }

        var left = Math.max(0, (containerWidth / 2) - (this.modalContentContainer.offsetWidth / 2));
        var top = Math.max(0, (containerHeight / 2) - (this.modalContentContainer.offsetHeight / 2));

        var db = document.querySelector('.rd-box');
        db.style.top = top+'px';
        db.style.left = left+'px';
    };

    RevDialog.prototype.attachPostMesssage = function() {
        var that = this;

        revUtils.addEventListener(window, 'message', function(e) {
            switch (e.data.msg) {
                case 'active_interest':
                    that.setActive('interest');
                    break;
                case 'close_me':
                    if (that.emitter) {
                        that.emitter.emitEvent('dialog_closed');
                    }
                    that.closeDialog();
                    break;
                case 'resize_me':
                    that.centerDialog(e.data.height);
                    break;
            }
        });
    };

    RevDialog.prototype.attachResize = function() {
        var resizeEnd;
        var that = this;
        revUtils.addEventListener(window, 'resize', function() {
            clearTimeout(resizeEnd);
            resizeEnd = setTimeout(function() {
                if (that.active == 'about') {
                    that.aboutFrame.contentWindow.postMessage({'msg': 'resize_me'}, '*');
                } else if (that.acvite == 'interest') {
                    that.interestFrame.contentWindow.postMessage({'msg': 'resize_me'}, '*');
                }
            }, 100);
        });
    };

    var rD = new RevDialog();

    return rD;

}));
/**
 * RevDisclose (Branding + Disclosure Options)
 *
 */

(function (window, document, dialog, undefined) {
    'use strict';
    var RevDisclose = function () {
        var self = this;
        self.dialog = dialog;
        self.plainText = false;
        self.disclosureText = null;
        self.disclosureHtml = '';
        self.defaultDisclosureText = 'Sponsored by Revcontent';
        self.disclosureTextLimit = 50;
        self.onClickHandler = false;
        self.onClickHandlerObject = null;
        self.defaultOnClick = function () {

        };
        self.hooks = [];
        self.init();
    };

    RevDisclose.prototype.init = function () {
        var self = this;
        document.onreadystatechange = function () {
            if (document.readyState == "complete") {

            }
        }
    };

    RevDisclose.prototype.setEmitter = function(emitter) {
        this.emitter = emitter;
    }

    RevDisclose.prototype.setDialog = function(dialog){
        var self = this;
        if(typeof dialog === "object"){
            self.dialog = dialog;
        }
    };

    RevDisclose.prototype.truncateDisclosure = function () {
        var self = this;
        self.disclosureText = self.disclosureText.toString().substring(0, self.disclosureTextLimit).replace(/['"]+/g, '');
    };

    RevDisclose.prototype.setDisclosureText = function(disclosure){
        var self = this;
        self.disclosureText = (disclosure.length > 1) ? disclosure.toString() : self.defaultDisclosureText;
        self.truncateDisclosure();
    };

    RevDisclose.prototype.setOnClickHandler = function (handler, handlerObject) {
        var self = this;
        if (typeof handler === 'function') {
            self.onClickHandler = handler;
        }
        if (typeof handlerObject === 'object') {
            self.onClickHandlerObject = handlerObject;
        }
    };

    RevDisclose.prototype.getSponsorTemplate = function () {
        var self = this;
        self.disclosureHtml = '<a href="javascript:;" onclick="revDisclose.onClickHandler(revDisclose.onClickHandlerObject ? revDisclose.onClickHandlerObject : null);">' + self.disclosureText + '</a>';
        return self.plainText ? self.disclosureText : self.disclosureHtml;
    };

    RevDisclose.prototype.setGrid = function (grid) {
        this.grid = grid;
    };

    RevDisclose.prototype.postMessage = function() {
        this.dialog.postMessage();
    };

    RevDisclose.prototype.getDisclosure = function (disclosureText, dialogOptions) {
        var self = this;
        self.setDisclosureText(disclosureText);

        if (this.emitter) {
            self.dialog.emitter = this.emitter;
        }

        if (typeof dialogOptions === 'object') {
            if (dialogOptions.aboutSrc) {
                self.dialog.aboutSrc = dialogOptions.aboutSrc;
            }
            if (dialogOptions.aboutHeight) {
                self.dialog.aboutHeight = dialogOptions.aboutHeight;
            }
            if (dialogOptions.interestSrc) {
                self.dialog.interestSrc = dialogOptions.interestSrc;
            }
            if (dialogOptions.interestHeight) {
                self.dialog.interestHeight = dialogOptions.interestHeight;
            }
            if (dialogOptions.widget_id) {
                self.dialog.widget_id = dialogOptions.widget_id;
            }
            if (dialogOptions.pub_id) {
                self.dialog.pub_id = dialogOptions.pub_id;
            }
        }

        if(typeof self.dialog === "object") {
            if (this.grid) {
                self.dialog.grid = this.grid;
            }
            self.setOnClickHandler(self.dialog.showDialog, self.dialog);
        } else {
            self.setOnClickHandler(self.defaultOnClick);
        }
        return self.getSponsorTemplate();
    };

    RevDisclose.prototype.getProviderTemplate = function(className, styles){
        var self = this;
        var providerHtml = '<div class="' + (className ? className.toString() : '') + '" style="' + (styles ? styles.toString() : '') + '"></div>';
        return providerHtml;
    };

    RevDisclose.prototype.getProvider = function(className, styles) {
        var self = this;
        return self.getProviderTemplate(className, styles);
    };

    window.revDisclose = new RevDisclose();

    return window.revDisclose;

}(window, document, window.revDialog));
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

var impl = {};

impl.mobileDetectRules = {
"phones": {
    "iPhone": "\\biPhone\\b|\\biPod\\b",
    "BlackBerry": "BlackBerry|\\bBB10\\b|rim[0-9]+",
    "HTC": "HTC|HTC.*(Sensation|Evo|Vision|Explorer|6800|8100|8900|A7272|S510e|C110e|Legend|Desire|T8282)|APX515CKT|Qtek9090|APA9292KT|HD_mini|Sensation.*Z710e|PG86100|Z715e|Desire.*(A8181|HD)|ADR6200|ADR6400L|ADR6425|001HT|Inspire 4G|Android.*\\bEVO\\b|T-Mobile G1|Z520m",
    "Nexus": "Nexus One|Nexus S|Galaxy.*Nexus|Android.*Nexus.*Mobile|Nexus 4|Nexus 5|Nexus 6",
    "Dell": "Dell.*Streak|Dell.*Aero|Dell.*Venue|DELL.*Venue Pro|Dell Flash|Dell Smoke|Dell Mini 3iX|XCD28|XCD35|\\b001DL\\b|\\b101DL\\b|\\bGS01\\b",
    "Motorola": "Motorola|DROIDX|DROID BIONIC|\\bDroid\\b.*Build|Android.*Xoom|HRI39|MOT-|A1260|A1680|A555|A853|A855|A953|A955|A956|Motorola.*ELECTRIFY|Motorola.*i1|i867|i940|MB200|MB300|MB501|MB502|MB508|MB511|MB520|MB525|MB526|MB611|MB612|MB632|MB810|MB855|MB860|MB861|MB865|MB870|ME501|ME502|ME511|ME525|ME600|ME632|ME722|ME811|ME860|ME863|ME865|MT620|MT710|MT716|MT720|MT810|MT870|MT917|Motorola.*TITANIUM|WX435|WX445|XT300|XT301|XT311|XT316|XT317|XT319|XT320|XT390|XT502|XT530|XT531|XT532|XT535|XT603|XT610|XT611|XT615|XT681|XT701|XT702|XT711|XT720|XT800|XT806|XT860|XT862|XT875|XT882|XT883|XT894|XT901|XT907|XT909|XT910|XT912|XT928|XT926|XT915|XT919|XT925|XT1021|\\bMoto E\\b",
    "Samsung": "\\bSamsung\\b|SM-G9250|GT-19300|SGH-I337|BGT-S5230|GT-B2100|GT-B2700|GT-B2710|GT-B3210|GT-B3310|GT-B3410|GT-B3730|GT-B3740|GT-B5510|GT-B5512|GT-B5722|GT-B6520|GT-B7300|GT-B7320|GT-B7330|GT-B7350|GT-B7510|GT-B7722|GT-B7800|GT-C3010|GT-C3011|GT-C3060|GT-C3200|GT-C3212|GT-C3212I|GT-C3262|GT-C3222|GT-C3300|GT-C3300K|GT-C3303|GT-C3303K|GT-C3310|GT-C3322|GT-C3330|GT-C3350|GT-C3500|GT-C3510|GT-C3530|GT-C3630|GT-C3780|GT-C5010|GT-C5212|GT-C6620|GT-C6625|GT-C6712|GT-E1050|GT-E1070|GT-E1075|GT-E1080|GT-E1081|GT-E1085|GT-E1087|GT-E1100|GT-E1107|GT-E1110|GT-E1120|GT-E1125|GT-E1130|GT-E1160|GT-E1170|GT-E1175|GT-E1180|GT-E1182|GT-E1200|GT-E1210|GT-E1225|GT-E1230|GT-E1390|GT-E2100|GT-E2120|GT-E2121|GT-E2152|GT-E2220|GT-E2222|GT-E2230|GT-E2232|GT-E2250|GT-E2370|GT-E2550|GT-E2652|GT-E3210|GT-E3213|GT-I5500|GT-I5503|GT-I5700|GT-I5800|GT-I5801|GT-I6410|GT-I6420|GT-I7110|GT-I7410|GT-I7500|GT-I8000|GT-I8150|GT-I8160|GT-I8190|GT-I8320|GT-I8330|GT-I8350|GT-I8530|GT-I8700|GT-I8703|GT-I8910|GT-I9000|GT-I9001|GT-I9003|GT-I9010|GT-I9020|GT-I9023|GT-I9070|GT-I9082|GT-I9100|GT-I9103|GT-I9220|GT-I9250|GT-I9300|GT-I9305|GT-I9500|GT-I9505|GT-M3510|GT-M5650|GT-M7500|GT-M7600|GT-M7603|GT-M8800|GT-M8910|GT-N7000|GT-S3110|GT-S3310|GT-S3350|GT-S3353|GT-S3370|GT-S3650|GT-S3653|GT-S3770|GT-S3850|GT-S5210|GT-S5220|GT-S5229|GT-S5230|GT-S5233|GT-S5250|GT-S5253|GT-S5260|GT-S5263|GT-S5270|GT-S5300|GT-S5330|GT-S5350|GT-S5360|GT-S5363|GT-S5369|GT-S5380|GT-S5380D|GT-S5560|GT-S5570|GT-S5600|GT-S5603|GT-S5610|GT-S5620|GT-S5660|GT-S5670|GT-S5690|GT-S5750|GT-S5780|GT-S5830|GT-S5839|GT-S6102|GT-S6500|GT-S7070|GT-S7200|GT-S7220|GT-S7230|GT-S7233|GT-S7250|GT-S7500|GT-S7530|GT-S7550|GT-S7562|GT-S7710|GT-S8000|GT-S8003|GT-S8500|GT-S8530|GT-S8600|SCH-A310|SCH-A530|SCH-A570|SCH-A610|SCH-A630|SCH-A650|SCH-A790|SCH-A795|SCH-A850|SCH-A870|SCH-A890|SCH-A930|SCH-A950|SCH-A970|SCH-A990|SCH-I100|SCH-I110|SCH-I400|SCH-I405|SCH-I500|SCH-I510|SCH-I515|SCH-I600|SCH-I730|SCH-I760|SCH-I770|SCH-I830|SCH-I910|SCH-I920|SCH-I959|SCH-LC11|SCH-N150|SCH-N300|SCH-R100|SCH-R300|SCH-R351|SCH-R400|SCH-R410|SCH-T300|SCH-U310|SCH-U320|SCH-U350|SCH-U360|SCH-U365|SCH-U370|SCH-U380|SCH-U410|SCH-U430|SCH-U450|SCH-U460|SCH-U470|SCH-U490|SCH-U540|SCH-U550|SCH-U620|SCH-U640|SCH-U650|SCH-U660|SCH-U700|SCH-U740|SCH-U750|SCH-U810|SCH-U820|SCH-U900|SCH-U940|SCH-U960|SCS-26UC|SGH-A107|SGH-A117|SGH-A127|SGH-A137|SGH-A157|SGH-A167|SGH-A177|SGH-A187|SGH-A197|SGH-A227|SGH-A237|SGH-A257|SGH-A437|SGH-A517|SGH-A597|SGH-A637|SGH-A657|SGH-A667|SGH-A687|SGH-A697|SGH-A707|SGH-A717|SGH-A727|SGH-A737|SGH-A747|SGH-A767|SGH-A777|SGH-A797|SGH-A817|SGH-A827|SGH-A837|SGH-A847|SGH-A867|SGH-A877|SGH-A887|SGH-A897|SGH-A927|SGH-B100|SGH-B130|SGH-B200|SGH-B220|SGH-C100|SGH-C110|SGH-C120|SGH-C130|SGH-C140|SGH-C160|SGH-C170|SGH-C180|SGH-C200|SGH-C207|SGH-C210|SGH-C225|SGH-C230|SGH-C417|SGH-C450|SGH-D307|SGH-D347|SGH-D357|SGH-D407|SGH-D415|SGH-D780|SGH-D807|SGH-D980|SGH-E105|SGH-E200|SGH-E315|SGH-E316|SGH-E317|SGH-E335|SGH-E590|SGH-E635|SGH-E715|SGH-E890|SGH-F300|SGH-F480|SGH-I200|SGH-I300|SGH-I320|SGH-I550|SGH-I577|SGH-I600|SGH-I607|SGH-I617|SGH-I627|SGH-I637|SGH-I677|SGH-I700|SGH-I717|SGH-I727|SGH-i747M|SGH-I777|SGH-I780|SGH-I827|SGH-I847|SGH-I857|SGH-I896|SGH-I897|SGH-I900|SGH-I907|SGH-I917|SGH-I927|SGH-I937|SGH-I997|SGH-J150|SGH-J200|SGH-L170|SGH-L700|SGH-M110|SGH-M150|SGH-M200|SGH-N105|SGH-N500|SGH-N600|SGH-N620|SGH-N625|SGH-N700|SGH-N710|SGH-P107|SGH-P207|SGH-P300|SGH-P310|SGH-P520|SGH-P735|SGH-P777|SGH-Q105|SGH-R210|SGH-R220|SGH-R225|SGH-S105|SGH-S307|SGH-T109|SGH-T119|SGH-T139|SGH-T209|SGH-T219|SGH-T229|SGH-T239|SGH-T249|SGH-T259|SGH-T309|SGH-T319|SGH-T329|SGH-T339|SGH-T349|SGH-T359|SGH-T369|SGH-T379|SGH-T409|SGH-T429|SGH-T439|SGH-T459|SGH-T469|SGH-T479|SGH-T499|SGH-T509|SGH-T519|SGH-T539|SGH-T559|SGH-T589|SGH-T609|SGH-T619|SGH-T629|SGH-T639|SGH-T659|SGH-T669|SGH-T679|SGH-T709|SGH-T719|SGH-T729|SGH-T739|SGH-T746|SGH-T749|SGH-T759|SGH-T769|SGH-T809|SGH-T819|SGH-T839|SGH-T919|SGH-T929|SGH-T939|SGH-T959|SGH-T989|SGH-U100|SGH-U200|SGH-U800|SGH-V205|SGH-V206|SGH-X100|SGH-X105|SGH-X120|SGH-X140|SGH-X426|SGH-X427|SGH-X475|SGH-X495|SGH-X497|SGH-X507|SGH-X600|SGH-X610|SGH-X620|SGH-X630|SGH-X700|SGH-X820|SGH-X890|SGH-Z130|SGH-Z150|SGH-Z170|SGH-ZX10|SGH-ZX20|SHW-M110|SPH-A120|SPH-A400|SPH-A420|SPH-A460|SPH-A500|SPH-A560|SPH-A600|SPH-A620|SPH-A660|SPH-A700|SPH-A740|SPH-A760|SPH-A790|SPH-A800|SPH-A820|SPH-A840|SPH-A880|SPH-A900|SPH-A940|SPH-A960|SPH-D600|SPH-D700|SPH-D710|SPH-D720|SPH-I300|SPH-I325|SPH-I330|SPH-I350|SPH-I500|SPH-I600|SPH-I700|SPH-L700|SPH-M100|SPH-M220|SPH-M240|SPH-M300|SPH-M305|SPH-M320|SPH-M330|SPH-M350|SPH-M360|SPH-M370|SPH-M380|SPH-M510|SPH-M540|SPH-M550|SPH-M560|SPH-M570|SPH-M580|SPH-M610|SPH-M620|SPH-M630|SPH-M800|SPH-M810|SPH-M850|SPH-M900|SPH-M910|SPH-M920|SPH-M930|SPH-N100|SPH-N200|SPH-N240|SPH-N300|SPH-N400|SPH-Z400|SWC-E100|SCH-i909|GT-N7100|GT-N7105|SCH-I535|SM-N900A|SGH-I317|SGH-T999L|GT-S5360B|GT-I8262|GT-S6802|GT-S6312|GT-S6310|GT-S5312|GT-S5310|GT-I9105|GT-I8510|GT-S6790N|SM-G7105|SM-N9005|GT-S5301|GT-I9295|GT-I9195|SM-C101|GT-S7392|GT-S7560|GT-B7610|GT-I5510|GT-S7582|GT-S7530E|GT-I8750|SM-G9006V|SM-G9008V|SM-G9009D|SM-G900A|SM-G900D|SM-G900F|SM-G900H|SM-G900I|SM-G900J|SM-G900K|SM-G900L|SM-G900M|SM-G900P|SM-G900R4|SM-G900S|SM-G900T|SM-G900V|SM-G900W8|SHV-E160K|SCH-P709|SCH-P729|SM-T2558|GT-I9205|SM-G9350|SM-J120F",
    "LG": "\\bLG\\b;|LG[- ]?(C800|C900|E400|E610|E900|E-900|F160|F180K|F180L|F180S|730|855|L160|LS740|LS840|LS970|LU6200|MS690|MS695|MS770|MS840|MS870|MS910|P500|P700|P705|VM696|AS680|AS695|AX840|C729|E970|GS505|272|C395|E739BK|E960|L55C|L75C|LS696|LS860|P769BK|P350|P500|P509|P870|UN272|US730|VS840|VS950|LN272|LN510|LS670|LS855|LW690|MN270|MN510|P509|P769|P930|UN200|UN270|UN510|UN610|US670|US740|US760|UX265|UX840|VN271|VN530|VS660|VS700|VS740|VS750|VS910|VS920|VS930|VX9200|VX11000|AX840A|LW770|P506|P925|P999|E612|D955|D802|MS323)",
    "Sony": "SonyST|SonyLT|SonyEricsson|SonyEricssonLT15iv|LT18i|E10i|LT28h|LT26w|SonyEricssonMT27i|C5303|C6902|C6903|C6906|C6943|D2533",
    "Asus": "Asus.*Galaxy|PadFone.*Mobile",
    "NokiaLumia": "Lumia [0-9]{3,4}",
    "GenericPhone": "Tapatalk|PDA;|SAGEM|\\bmmp\\b|pocket|\\bpsp\\b|symbian|Smartphone|smartfon|treo|up.browser|up.link|vodafone|\\bwap\\b|nokia|Series40|Series60|S60|SonyEricsson|N900|MAUI.*WAP.*Browser"
},
"tablets": {
    "iPad": "iPad|iPad.*Mobile",
    "NexusTablet": "Android.*Nexus[\\s]+(7|9|10)",
    "SamsungTablet": "SAMSUNG.*Tablet|Galaxy.*Tab|SC-01C|GT-P1000|GT-P1003|GT-P1010|GT-P3105|GT-P6210|GT-P6800|GT-P6810|GT-P7100|GT-P7300|GT-P7310|GT-P7500|GT-P7510|SCH-I800|SCH-I815|SCH-I905|SGH-I957|SGH-I987|SGH-T849|SGH-T859|SGH-T869|SPH-P100|GT-P3100|GT-P3108|GT-P3110|GT-P5100|GT-P5110|GT-P6200|GT-P7320|GT-P7511|GT-N8000|GT-P8510|SGH-I497|SPH-P500|SGH-T779|SCH-I705|SCH-I915|GT-N8013|GT-P3113|GT-P5113|GT-P8110|GT-N8010|GT-N8005|GT-N8020|GT-P1013|GT-P6201|GT-P7501|GT-N5100|GT-N5105|GT-N5110|SHV-E140K|SHV-E140L|SHV-E140S|SHV-E150S|SHV-E230K|SHV-E230L|SHV-E230S|SHW-M180K|SHW-M180L|SHW-M180S|SHW-M180W|SHW-M300W|SHW-M305W|SHW-M380K|SHW-M380S|SHW-M380W|SHW-M430W|SHW-M480K|SHW-M480S|SHW-M480W|SHW-M485W|SHW-M486W|SHW-M500W|GT-I9228|SCH-P739|SCH-I925|GT-I9200|GT-P5200|GT-P5210|GT-P5210X|SM-T311|SM-T310|SM-T310X|SM-T210|SM-T210R|SM-T211|SM-P600|SM-P601|SM-P605|SM-P900|SM-P901|SM-T217|SM-T217A|SM-T217S|SM-P6000|SM-T3100|SGH-I467|XE500|SM-T110|GT-P5220|GT-I9200X|GT-N5110X|GT-N5120|SM-P905|SM-T111|SM-T2105|SM-T315|SM-T320|SM-T320X|SM-T321|SM-T520|SM-T525|SM-T530NU|SM-T230NU|SM-T330NU|SM-T900|XE500T1C|SM-P605V|SM-P905V|SM-T337V|SM-T537V|SM-T707V|SM-T807V|SM-P600X|SM-P900X|SM-T210X|SM-T230|SM-T230X|SM-T325|GT-P7503|SM-T531|SM-T330|SM-T530|SM-T705|SM-T705C|SM-T535|SM-T331|SM-T800|SM-T700|SM-T537|SM-T807|SM-P907A|SM-T337A|SM-T537A|SM-T707A|SM-T807A|SM-T237|SM-T807P|SM-P607T|SM-T217T|SM-T337T|SM-T807T|SM-T116NQ|SM-P550|SM-T350|SM-T550|SM-T9000|SM-P9000|SM-T705Y|SM-T805|GT-P3113|SM-T710|SM-T810|SM-T815|SM-T360|SM-T533|SM-T113|SM-T335|SM-T715|SM-T560|SM-T670|SM-T677|SM-T377|SM-T567|SM-T357T|SM-T555|SM-T561|SM-T713|SM-T719|SM-T813|SM-T819|SM-T580|SM-T355Y|SM-T280",
    "Kindle": "Kindle|Silk.*Accelerated|Android.*\\b(KFOT|KFTT|KFJWI|KFJWA|KFOTE|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|WFJWAE|KFSAWA|KFSAWI|KFASWI|KFARWI)\\b",
    "SurfaceTablet": "Windows NT [0-9.]+; ARM;.*(Tablet|ARMBJS)",
    "HPTablet": "HP Slate (7|8|10)|HP ElitePad 900|hp-tablet|EliteBook.*Touch|HP 8|Slate 21|HP SlateBook 10",
    "AsusTablet": "^.*PadFone((?!Mobile).)*$|Transformer|TF101|TF101G|TF300T|TF300TG|TF300TL|TF700T|TF700KL|TF701T|TF810C|ME171|ME301T|ME302C|ME371MG|ME370T|ME372MG|ME172V|ME173X|ME400C|Slider SL101|\\bK00F\\b|\\bK00C\\b|\\bK00E\\b|\\bK00L\\b|TX201LA|ME176C|ME102A|\\bM80TA\\b|ME372CL|ME560CG|ME372CG|ME302KL| K010 | K011 | K017 | K01E |ME572C|ME103K|ME170C|ME171C|\\bME70C\\b|ME581C|ME581CL|ME8510C|ME181C|P01Y|PO1MA|P01Z",
    "BlackBerryTablet": "PlayBook|RIM Tablet",
    "HTCtablet": "HTC_Flyer_P512|HTC Flyer|HTC Jetstream|HTC-P715a|HTC EVO View 4G|PG41200|PG09410",
    "MotorolaTablet": "xoom|sholest|MZ615|MZ605|MZ505|MZ601|MZ602|MZ603|MZ604|MZ606|MZ607|MZ608|MZ609|MZ615|MZ616|MZ617",
    "NookTablet": "Android.*Nook|NookColor|nook browser|BNRV200|BNRV200A|BNTV250|BNTV250A|BNTV400|BNTV600|LogicPD Zoom2",
    "AcerTablet": "Android.*; \\b(A100|A101|A110|A200|A210|A211|A500|A501|A510|A511|A700|A701|W500|W500P|W501|W501P|W510|W511|W700|G100|G100W|B1-A71|B1-710|B1-711|A1-810|A1-811|A1-830)\\b|W3-810|\\bA3-A10\\b|\\bA3-A11\\b|\\bA3-A20\\b|\\bA3-A30",
    "ToshibaTablet": "Android.*(AT100|AT105|AT200|AT205|AT270|AT275|AT300|AT305|AT1S5|AT500|AT570|AT700|AT830)|TOSHIBA.*FOLIO",
    "LGTablet": "\\bL-06C|LG-V909|LG-V900|LG-V700|LG-V510|LG-V500|LG-V410|LG-V400|LG-VK810\\b",
    "FujitsuTablet": "Android.*\\b(F-01D|F-02F|F-05E|F-10D|M532|Q572)\\b",
    "PrestigioTablet": "PMP3170B|PMP3270B|PMP3470B|PMP7170B|PMP3370B|PMP3570C|PMP5870C|PMP3670B|PMP5570C|PMP5770D|PMP3970B|PMP3870C|PMP5580C|PMP5880D|PMP5780D|PMP5588C|PMP7280C|PMP7280C3G|PMP7280|PMP7880D|PMP5597D|PMP5597|PMP7100D|PER3464|PER3274|PER3574|PER3884|PER5274|PER5474|PMP5097CPRO|PMP5097|PMP7380D|PMP5297C|PMP5297C_QUAD|PMP812E|PMP812E3G|PMP812F|PMP810E|PMP880TD|PMT3017|PMT3037|PMT3047|PMT3057|PMT7008|PMT5887|PMT5001|PMT5002",
    "LenovoTablet": "Lenovo TAB|Idea(Tab|Pad)( A1|A10| K1|)|ThinkPad([ ]+)?Tablet|YT3-X90L|YT3-X90F|YT3-X90X|Lenovo.*(S2109|S2110|S5000|S6000|K3011|A3000|A3500|A1000|A2107|A2109|A1107|A5500|A7600|B6000|B8000|B8080)(-|)(FL|F|HV|H|)",
    "DellTablet": "Venue 11|Venue 8|Venue 7|Dell Streak 10|Dell Streak 7",
    "GenericTablet": "Android.*\\b97D\\b|Tablet(?!.*PC)|BNTV250A|MID-WCDMA|LogicPD Zoom2|\\bA7EB\\b|CatNova8|A1_07|CT704|CT1002|\\bM721\\b|rk30sdk|\\bEVOTAB\\b|M758A|ET904|ALUMIUM10|Smartfren Tab|Endeavour 1010|Tablet-PC-4|Tagi Tab|\\bM6pro\\b|CT1020W|arc 10HD|\\bTP750\\b"
}
};

// following patterns come from http://detectmobilebrowsers.com/
impl.detectMobileBrowsers = {
    fullPattern: /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i,
    shortPattern: /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i,
    tabletPattern: /android|ipad|playbook|silk/i
};

var hasOwnProp = Object.prototype.hasOwnProperty,
    isArray;

impl.FALLBACK_PHONE = 'UnknownPhone';
impl.FALLBACK_TABLET = 'UnknownTablet';
impl.FALLBACK_MOBILE = 'UnknownMobile';

isArray = ('isArray' in Array) ?
    Array.isArray : function (value) { return Object.prototype.toString.call(value) === '[object Array]'; };

function convertPropsToRegExp(object) {
    for (var key in object) {
        if (hasOwnProp.call(object, key)) {
            object[key] = new RegExp(object[key], 'i');
        }
    }
}

(function init() {
    convertPropsToRegExp(impl.mobileDetectRules.phones);
    convertPropsToRegExp(impl.mobileDetectRules.tablets);
}());

impl.findMatch = function(rules, userAgent) {
    for (var key in rules) {
        if (hasOwnProp.call(rules, key)) {
            if (rules[key].test(userAgent)) {
                return key;
            }
        }
    }
    return null;
};

impl.prepareVersionNo = function (version) {
    var numbers;

    numbers = version.split(/[a-z._ \/\-]/i);
    if (numbers.length === 1) {
        version = numbers[0];
    }
    if (numbers.length > 1) {
        version = numbers[0] + '.';
        numbers.shift();
        version += numbers.join('');
    }
    return Number(version);
};

impl.isMobileFallback = function (userAgent) {
    return impl.detectMobileBrowsers.fullPattern.test(userAgent) ||
        impl.detectMobileBrowsers.shortPattern.test(userAgent.substr(0,4));
};

impl.isTabletFallback = function (userAgent) {
    return impl.detectMobileBrowsers.tabletPattern.test(userAgent);
};

impl.prepareDetectionCache = function (cache, userAgent, maxPhoneWidth) {
    if (cache.mobile !== undefined) {
        return;
    }
    var phone, tablet, phoneSized;

    // first check for stronger tablet rules, then phone (see issue#5)
    tablet = impl.findMatch(impl.mobileDetectRules.tablets, userAgent);
    if (tablet) {
        cache.mobile = cache.tablet = tablet;
        cache.phone = null;
        return; // unambiguously identified as tablet
    }

    phone = impl.findMatch(impl.mobileDetectRules.phones, userAgent);
    if (phone) {
        cache.mobile = cache.phone = phone;
        cache.tablet = null;
        return; // unambiguously identified as phone
    }

    // our rules haven't found a match -> try more general fallback rules
    if (impl.isMobileFallback(userAgent)) {
        phoneSized = MobileDetect.isPhoneSized(maxPhoneWidth);
        if (phoneSized === undefined) {
            cache.mobile = impl.FALLBACK_MOBILE;
            cache.tablet = cache.phone = null;
        } else if (phoneSized) {
            cache.mobile = cache.phone = impl.FALLBACK_PHONE;
            cache.tablet = null;
        } else {
            cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
            cache.phone = null;
        }
    } else if (impl.isTabletFallback(userAgent)) {
        cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
        cache.phone = null;
    } else {
        // not mobile at all!
        cache.mobile = cache.tablet = cache.phone = null;
    }
};

impl.getDeviceSmallerSide = function () {
    return window.screen.width < window.screen.height ?
        window.screen.width :
        window.screen.height;
};

function MobileDetect(userAgent, maxPhoneWidth) {
    this.ua = userAgent || '';
    this._cache = {};
    //600dp is typical 7" tablet minimum width
    this.maxPhoneWidth = maxPhoneWidth || 600;
}

MobileDetect.prototype = {
    constructor: MobileDetect,

    mobile: function () {
        impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
        return this._cache.mobile;
    },
    phone: function () {
        impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
        return this._cache.phone;
    },
    tablet: function () {
        impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
        return this._cache.tablet;
    },
    isPhoneSized: function (maxPhoneWidth) {
        return MobileDetect.isPhoneSized(maxPhoneWidth || this.maxPhoneWidth);
    }
};

// environment-dependent
if (typeof window !== 'undefined' && window.screen) {
    MobileDetect.isPhoneSized = function (maxPhoneWidth) {
        return maxPhoneWidth < 0 ? undefined : impl.getDeviceSmallerSide() <= maxPhoneWidth;
    };
} else {
    MobileDetect.isPhoneSized = function () {};
}

// should not be replaced by a completely new object - just overwrite existing methods
MobileDetect._impl = impl;

var detect = new MobileDetect(window.navigator.userAgent);

// custom

detect.device = function() {
    var device = 'desktop';

    if (detect.phone() !== null) {
        device = 'phone';
    }

    if (detect.tablet() !== null) {
        device = 'tablet'
    }

    return device;
};

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
/**
 * RevBeacon (Beacon Pushes for API Calls)
 *
 */

( function( window, factory) {
    'use strict';
    window.revBeacon = factory(
        window,
        window.revApi,
        window.revUtils
    );

}( window, function factory( window, api, utilities ) {


    var RevBeacon = function () {
        var self = this;
        self.pluginSource = '';
        self.push = true;
        self.pushed = 0;
        self.enabledBeacons = ["quantcast", "comscore", "adscore"];
        self.renderedBeacons = [];
        self.beacons = {
            get: function(beaconId){
                var beacons = this;
                return beacons.beaconId !== undefined ? beacons.beaconId : {enabled: false}
            },
            quantcast: {
                name: "quantcast",
                enabled: true,
                type: 'pixel',
                pixel_url: '//pixel.quantserve.com/pixel/p-aD1qr93XuF6aC.gif',
                script_url: false,
                styles: 'display:none;border:0;width:1px;height:1px',
                noscript: false,
                traffic_percent: false
            },
            comscore: {
                name: "comscore",
                enabled: true,
                type: 'pixel',
                pixel_url: '//b.scorecardresearch.com/p?c1=7&c2=20310460&c3=12345&cv=2.0&cj=1',
                script_url: false,
                styles: '',
                noscript: false,
                traffic_percent: false
            },
            adscore: {
                name: "adscore",
                enabled: true,
                type: 'script',
                pixel_url: false,
                pixel_label: "AdScore",
                styles: false,
                script_url: '//js.ad-score.com/score.min.js?pid=1000177#&tid=display-ad&adid=rev-ad&uid=' + '{uid}' + '&uip=' + '{uip}' + '&ref=' + '{ref}' + '&pub_domain=' + '{fqdn}' + '&cb=' + '{cache}',
                noscript: false,
                traffic_percent: 2
            }
        };
    };

    RevBeacon.prototype.setPluginSource = function(pluginSource){
        var self = this;
        self.pluginSource = pluginSource.toString();
        return self;
    };

    RevBeacon.prototype.getPluginSource = function(){
        var self = this;
        return self.pluginSource.toString();
    };

    RevBeacon.prototype.enableBeacon = function(beaconName){
        var self = this;
        if(self.enabledBeacons[beaconName] == undefined && self.beacons[beaconName] !== undefined) {
            self.enabledBeacons.push(beaconName);
        }
        return self;
    };

    RevBeacon.prototype.disableBeacon = function(beaconName){
        var self = this;
        self.enabledBeacons = self.enabledBeacons.filter(function(entry){
            if(beaconName != entry) {
                return true;
            } else {
                return false;
            }
        });
        return self;
    };

    RevBeacon.prototype.offline = function(){
        var self = this;
        self.push = false;
        return self;
    };

    RevBeacon.prototype.createBeacon = function(beaconName, enabled, type, pixelUrl, scriptUrl, styles) {
        var self = this;
        if(self.beacons[beaconName] == undefined) {
            self.beacons[beaconName] = {
                enabled: enabled,
                type: type,
                pixel_url: pixelUrl,
                script_url: scriptUrl,
                styles: styles
            };
        }
        return self;
    };

    RevBeacon.prototype.setParent = function(parentNode){
        var self = this;
        self.parent = (typeof parentNode === 'object' ? parentNode : document.getElementsByTagName('body')[0]);
        return self;
    };

    RevBeacon.prototype.getParent = function() {
        var self = this;
        return (typeof self.parent === 'object' ? self.parent : document.getElementsByTagName('body')[0]);
    };

    RevBeacon.prototype.attach = function(){
        var self = this;
        if(true === self.push && !self.pushed) {
            for (var b = 0; b < self.enabledBeacons.length; b++) {
                var beaconId = self.enabledBeacons[b];
                var beacon = self.beacons[beaconId];
                var beaconScript = '<script id="$2" type="text/javascript" src="$1" class="beacon-tag beacon-script" data-source="' + self.pluginSource + '"></script>';
                var beaconImage = '<img src="$1" id="$2" class="beacon-tag beacon-pxl" style="' + beacon.styles + '" data-source="' + self.pluginSource + '" />';
                var beaconEl = '';
                var beaconDomId = 'beacon_' + Math.floor(Math.random() * 1000);
                if (document.getElementById(beaconDomId) !== null) {
                    beaconDomId = 'beacon_' + Math.floor(Math.random() * 2000);
                }
                if (beacon.enabled === true) {
                    switch (beacon.type) {
                        case 'script':
                            beaconEl = beaconScript.replace('$1', beacon.script_url).replace('$2', beaconDomId);
                            break;
                        case 'pixel':
                        case 'default':
                            beaconEl = beaconImage.replace('$1', beacon.pixel_url).replace('$2', beaconDomId);
                            break;
                    }
                    if(beacon.name === "adscore"){
                        var user_options = utilities.retrieveUserOptions();
                        if((user_options.developer !== undefined && user_options.developer === true) || Math.floor(Math.random()*(100)) < beacon.traffic_percent) {
                            // XHR to Delivery for Info Payload (endpoint = /v1/request-info)
                            var payload_url = user_options.url + '/request-info' +

                                '?api_key=' + user_options.api_key +
                                '&pub_id=' + user_options.pub_id +
                                '&widget_id=' + user_options.widget_id +
                                '&domain=' + user_options.domain +
                                '&api_source=' + user_options.api_source +
                                '&info=true';

                            revApi.request(payload_url, function(info_response){
                                self.getParent().insertAdjacentHTML('beforeend', self.configureAdScore(info_response, beaconEl));
                            }, function(error_response) {
                                console.log("Beacons > INFO-API Call Did not return HTTP/200", error_response);
                            }, revApi.generateCallback('adscore', 5000));

                            /**
                             * DISABLE IN FAVOR OF JSONP! (handled by revAPI Class)
                             * -- CORS Requests are being blocked by browsers
                             * @type {XMLHttpRequest}
                             *\/
                            var info_request = new XMLHttpRequest();
                            info_request.open('GET', payload_url, true);
                            info_request.onload = function() {
                                if (info_request.status >= 200 && info_request.status < 400) {
                                    try {
                                        var info_response = JSON.parse(info_request.responseText);
                                        self.getParent().insertAdjacentHTML('beforeend', self.configureAdScore(info_response, beaconEl));
                                    } catch(e) { }
                                } else {

                                }
                            };

                            info_request.onerror = function() {

                            };

                            info_request.send();
                            */

                        }
                    } else {
                        self.getParent().insertAdjacentHTML('beforeend', beaconEl);
                    }
                    self.renderedBeacons.push(document.getElementById(beaconDomId));
                }
            }
            self.pushed = self.renderedBeacons.length;
        }
        return self;
    };

    RevBeacon.prototype.detach = function(pluginSource){
        var self = this;
        for (var b = 0; b < self.renderedBeacons.length; b++) {
            if(self.renderedBeacons[b].parentNode){
                if(pluginSource !== undefined) {
                    if(self.renderedBeacons[b].getAttribute('data-source') == pluginSource.toString()){
                        self.renderedBeacons[b].parentNode.removeChild(self.renderedBeacons[b]);
                    }
                } else {
                    self.renderedBeacons[b].parentNode.removeChild(self.renderedBeacons[b]);
                }

            }
        }
        self.pushed = 0;
        return self;
    };

    RevBeacon.prototype.configureAdScore = function(response, beacon){
        var self = this;
        beacon = beacon.replace('{uid}', response.qid);
        beacon = beacon.replace('{uip}', response.uip);
        beacon = beacon.replace('{ref}', response.referer);
        beacon = beacon.replace('{fqdn}', response.domain);
        beacon = beacon.replace('{cache}', response.cache);
        //console.log("Parsed Beacon URL = ", beacon);
        return beacon;
    };

    var rB = new RevBeacon();

    return rB;

}));
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

api.xhr = function(url, success, failure, withCredentials) {
    var request = new XMLHttpRequest();

    if (withCredentials) {
        request.withCredentials = true;
    }

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
/*
ooooooooo.                          .oooooo..o oooo   o8o        .o8
`888   `Y88.                       d8P'    `Y8 `888   `"'       "888
 888   .d88'  .ooooo.  oooo    ooo Y88bo.       888  oooo   .oooo888   .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'   `"Y8888o.   888  `888  d88' `888  d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        `"Y88b  888   888  888   888  888ooo888  888
 888  `88b.  888    .o    `888'    oo     .d8P  888   888  888   888  888    .o  888
o888o  o888o `Y8bod8P'     `8'     8""88888P'  o888o o888o `Y8bod88P" `Y8bod8P' d888b

Project: RevSlider
Version: 1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevSlider = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDisclose);
}( window, function factory(window, revUtils, revDetect, revApi, revDisclose) {
'use strict';

    var RevSlider = function(opts) {

        var defaults = {
            impression_tracker: [],
            api_source: 'slide',
            element: false,
            item_breakpoints: {
                xxs: 200,
                xs: 275,
                sm: 350,
                md: 425,
                lg: 500,
                xl: 575,
                xxl: 650,
            },
            breakpoints: {
                xxs: 0,
                xs: 250,
                sm: 500,
                md: 750,
                lg: 1000,
                xl: 1250,
                xxl: 1500
            },
            rows: {
                xxs: 2,
                xs: 2,
                sm: 2,
                md: 2,
                lg: 2,
                xl: 2,
                xxl: 2
            },
            per_row: {
                xxs: 1,
                xs: 2,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            is_resize_bound: true,
            image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle'),
            header: 'Trending Now',
            rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right'),
            show_arrows: {
                mobile: true,
                desktop: true
            },
            internal: false,
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            url: 'https://trends.revcontent.com/api/v1/',
            host: 'https://trends.revcontent.com',
            headline_size: 3,
            max_headline: false,
            min_headline_height: 17,
            text_overlay: false,
            vertical: false,
            wrap_pages: true, //currently the only supported option
            wrap_reverse: true, //currently the only supported option
            show_padding: true,
            pages: 4,
            row_pages: false, // use rows for page count, overrides pages option
            text_right: false,
            text_right_height: 100,
            transition_duration: 0,
            multipliers: {
                line_height: 0,
                margin: 0,
                padding: 0
            },
            prevent_default_pan: true,
            buttons: {
                forward: true,
                back: true,
                size: 40,
                position: 'inside',
                style: 'default',
                dual: false
            },
            disclosure_text: 'by Revcontent',
            hide_provider: false,
            hide_header: false,
            hide_footer: false,
            beacons: true,
            pagination_dots: false,
            touch_direction: typeof Hammer !== 'undefined' ? Hammer.DIRECTION_HORIZONTAL : false, // don't prevent vertical scrolling
            overlay_icons: false, // pass in custom icons or overrides
            image_overlay: false, // pass key value object { content_type: icon }
            image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: false, // pass key value object { content_type: icon }
            ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
            query_params: false,
            register_views: true, // manage views or false to let someone else do it
            user_ip: false,
            user_agent: false,
            css: '',
            disable_pagination: false,
            register_impressions: true,
            visible_rows: false,
            column_spans: false,
            pagination_dots_vertical: false,
            stacked: false,
            destroy: false,
            fit_height: false,
            fit_height_clip: false,
            developer: false,
            headline_icon_selector: false,
            internal_selector: false,
            reactions_selector: false,
            headline_top_selector: false,
            brand_logo: false,
            brand_logo_secondary: false,
            comment_div: false,
            window_width_enabled: false,
            reactions: [ 'love', 'exciting', 'interesting', 'gross', 'sad', 'angry' ],
            initial_icon_colors: [
                'EF5350',
                'F06292',
                'BA68C8',
                '9575CD',
                '7986CB',
                '64B5F6',
                '4FC3F7',
                '4DD0E1',
                '4DB6AC',
                '81C784',
                '9CCC65',
                'D4E157',
                'FFF176',
                'FFD54F',
                'FFB74D',
                'FF8A65',
                'A1887F'
            ],
            reaction_id: 5,
            mobile_image_optimize: 1.2,
            trending_utm: false,
            keywords: false,
            disclosure_about_src: '//trends.engage.im/engage-about.php',
            disclosure_about_height: 575,
            disclosure_interest_src: '//trends.engage.im/engage-interests.php',
            disclosure_interest_height: 520
        };

        // merge options
        this.options = revUtils.extend(defaults, revUtils.deprecateOptions(opts));

        // store options
        revUtils.storeUserOptions(this.options);

        if (revUtils.validateApiParams(this.options).length) {
            return;
        }

        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        var that = this;

        this.emitter = new EventEmitter();

        revDisclose.setEmitter(this.emitter);

        this.emitter.on('dialog_closed', function() {
            that.isAuthenticated(function(response) {
                that.updateAuthElements();
                if (response === true) {
                    that.showPersonalizedTransition();
                }
            });
        });

        this.data = [];
        this.displayedItems = [];

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-slider2';

        this.innerContainerElement = document.createElement('div');
        this.innerContainerElement.id = 'rev-slider-container';

        this.innerElement = document.createElement('div');
        this.innerElement.id = 'rev-slider-inner';

        this.gridTransitionContainer = document.createElement('div');
        this.gridTransitionContainer.id = 'rev-slider-grid-transition-container';

        this.gridTransitionElement = document.createElement('div');
        this.gridTransitionElement.id = 'rev-slider-grid-transition';

        this.gridContainerElement = document.createElement('div');
        this.gridContainerElement.id = 'rev-slider-grid-container';

        var gridElement = document.createElement('div');
        gridElement.id = 'rev-slider-grid';

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);
        this.element.style.width = '100%';

        revUtils.append(this.containerElement, this.innerContainerElement);

        revUtils.append(this.innerContainerElement, this.innerElement);

        revUtils.append(this.innerElement, this.gridTransitionContainer);

        revUtils.append(this.gridTransitionContainer, this.gridTransitionElement);

        revUtils.append(this.gridTransitionElement, this.gridContainerElement);

        revUtils.append(this.gridContainerElement, gridElement);

        revUtils.append(this.element, this.containerElement);

        revUtils.dispatchScrollbarResizeEvent();

        this.grid = new AnyGrid(gridElement, this.gridOptions());

        this.setGridClasses();

        // SWIPE Feature (Explore Panel)
        // this.appendExplorePanel(this.grid);

        this.createCells(this.grid);

        if (this.limit == 0) {
            this.destroy();
            return;
        }

        this.grid.on('resize', function() {
            that.resize();
        });

        // inject:mock
        // endinject

        this.authenticated = false;

        this.interests = {
            list: [],
            subscribed: [],
            subscribed_ids: [],
            available: [],
            recommended: []
        };

        this.getData();

        var that = this;

        if (this.grid.perRow > 1) { // if more than one row relayout when font loads
            if (typeof FontFaceObserver !== 'undefined') {
                var fontNormal = new FontFaceObserver('Montserrat');
                var fontBold = new FontFaceObserver('Montserrat', { weight: 500 });

                Promise.all([fontNormal.load(), fontBold.load()]).then(function () {
                    that.grid.layout();
                }).catch(function(e) {
                    console.log(e);
                });
            }
        }

        this.dataPromise.then(function(data) {
            that.updateDisplayedItems(that.grid.items, data);
            if (that.options.beacons) {
                revApi.beacons.setPluginSource(that.options.api_source).attach();
            }
        }, function() {
            that.destroy();
        }).catch(function(e) {
            console.log(e);
        });

        this.offset = 0;

        this.appendElements();

        this.authenticated = false;

        var that = this;
        this.isAuthenticated(function(response) {
            if (response === true) {
                that.updateAuthElements();
            }
        });
    };

    RevSlider.prototype.setGridClasses = function() {
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.vertical ? 'vertical' : 'horizontal'));
        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

        if (revDetect.mobile()) {
            revUtils.addClass(this.containerElement, 'rev-slider-mobile');
        }

        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons ? (this.options.buttons.style ? this.options.buttons.style : 'none') : 'none'));

        if (this.options.disable_pagination) {
            revUtils.addClass(this.containerElement, 'rev-slider-pagination-disabled');
        }

        revUtils[this.options.disable_pagination ? 'removeClass' : 'addClass'](this.containerElement, 'rev-slider-pagination');

        if (this.options.window_width_enabled) {
            revUtils.addClass(this.containerElement, 'rev-slider-window-width');
        }

        revUtils.removeClass(this.containerElement, 'rev-slider-breakpoint', true);
        revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-' + this.grid.getBreakPoint());
        var greaterLessThanBreakPoints = this.grid.getGreaterLessThanBreakPoints();
        for (var i = 0; i < greaterLessThanBreakPoints.gt.length; i++) {
            revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-gt-' + greaterLessThanBreakPoints.gt[i]);
        }
        for (var i = 0; i < greaterLessThanBreakPoints.lt.length; i++) {
            revUtils.addClass(this.containerElement, 'rev-slider-breakpoint-lt-' + greaterLessThanBreakPoints.lt[i]);
        }

        revUtils.removeClass(this.containerElement, 'rev-slider-col', true);
        revUtils.removeClass(this.containerElement, 'rev-slider-row', true);
        revUtils.addClass(this.containerElement, 'rev-slider-col-' + this.grid.perRow);
        revUtils.addClass(this.containerElement, 'rev-slider-row-' + this.grid.nextRow);
    };

    RevSlider.prototype.createCells = function(grid) {
        var i = 0; // just in case
        this.limit = 0;
        this.internalLimit = 0;
        this.sponsoredLimit = 0;
        this.visibleLimit = 0;

        var rowData = this.createRows(grid, this.options.rows, true);

        this.viewableItems = rowData.items;
        this.limit = rowData.limit;
        this.internalLimit = rowData.internalLimit;
        this.sponsoredLimit = rowData.sponsoredLimit;
    };

    RevSlider.prototype.milliFormatter = function(value) {
        return value > 999 ? (value/1000).toFixed(1) + 'k' : value
    }

    RevSlider.prototype.createRows = function(grid, rows, initial) {
        var i = 0; // just in case
        var limit = 0;
        var internalLimit = 0;
        var sponsoredLimit = 0;
        var itemsArr = [];
        var rowLen = rows.length;
        // this.visibleLimit = 0;

        var total = this.options.rows * grid.perRow;

        // reactions
        var like_b64 = '<div class="rev-reaction rev-reaction-like">' +
                '<div class="rev-reaction-menu">' +
                    '<div class="rev-reaction-icon rev-reaction-icon-love">' +
                        '<div class="rev-reaction-menu-container">' +
                            '<div class="rev-reaction-menu-item rev-reaction-menu-item-count rev-reaction-menu-item-count-pos"><div class="rev-reaction-menu-item-count-inner"></div></div>' +
                            '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="'+ this.options.reactions[0] +'"><div data-icon="' + this.options.reactions[0] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[0] + '"></div></div>' +
                            '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[1] + '"><div data-icon="' + this.options.reactions[1] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[1] + '"></div></div>' +
                            '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[2] + '"><div data-icon="' + this.options.reactions[2] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[2] + '"></div></div>' +
                            '<div class="rev-reaction-menu-item rev-reaction-menu-item-count rev-reaction-menu-item-count-neg"><div class="rev-reaction-menu-item-count-inner"></div></div>' +
                            '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[3] + '"><div data-icon="' + this.options.reactions[3] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[3] + '"></div></div>' +
                            '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[4] + '"><div data-icon="' + this.options.reactions[4] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[4] + '"></div></div>' +
                            '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[5] + '"><div data-icon="' + this.options.reactions[5] + '" class="rev-reaction-menu-item-icon rev-reaction-menu-item-icon-' + this.options.reactions[5] + '"></div></div>' +
                            '<div class="rev-reaction-menu-mask"><div class="rev-reaction-menu-mask-inner">' + "<?xml version='1.0' ?><!DOCTYPE svg  PUBLIC '-//W3C//DTD SVG 1.1//EN'  'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'><svg enable-background='new 0 0 24 24' height='24px' id='Layer_1' version='1.1' viewBox='0 0 24 24' width='24px' xml:space='preserve' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><g><polygon points='17.5,1 11,7.5 15,7.5 15,17.75 15,21.5 15,22.5 16,22.5 19,22.5 20,22.5 20,21.5 20,17.75 20,7.5 24,7.5  '/><polygon points='9,6.25 9,2.5 9,1.5 8,1.5 5,1.5 4,1.5 4,2.5 4,6.25 4,16.5 0,16.5 6.5,23 13,16.5 9,16.5  '/></g></svg>" + '</div></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        var comment_b64 = '<a href="#' + (this.options.comment_div ? this.options.comment_div : this.options.feed_id) + '" class="rev-reaction rev-reaction-comment"><div class="rev-reaction-icon rev-reaction-icon-comment"></div></a>';
        var share_b64 = '<a href="https://www.facebook.com/sharer/sharer.php?u='+ this.options.domain +'" target="_blank" class="rev-reaction rev-reaction-share"><div class="rev-reaction-icon rev-reaction-icon-share"></div></a>';

        var items = [];
        var reactionHtml = []; // don't want to store this massive string

        // TODO: make this a 2 step process. first append single element then get type, second add innerhtml
        for (var i = 0; i < total; i++) {

            //  && i == patternTotal
            // @todo find replacement/correct var for patternTotal
            if (this.authenticated && !this.interestsCarouselVisible) {
                this.appendInterestsCarousel(grid);
            }

            var element = this.createNewCell();
            // items.push(item);
            grid.element.appendChild(element);

            var added = grid.addItems([element]);

            added[0].reactions = true; // everything has reactions

            // var reactionsContainer = document.createElement('div');

            if (this.options.internal_selector && matchesSelector(element, this.options.internal_selector)) {
                added[0].type = 'internal';
                internalLimit++;
                reactionHtml.push(like_b64 + comment_b64 + share_b64);
            } else {
                added[0].type = 'sponsored';
                sponsoredLimit++;

                reactionHtml.push(like_b64);
                revUtils.addClass(element.querySelector('.rev-reactions'), 'rev-reactions-single');
            }

            // reactionsContainer.innerHTML = '<div class="rev-reaction-bar">' + reactionHtml + '</div>';
            // revUtils.addClass(reactionsContainer, 'rev-reactions');
            // element.querySelector('.rev-content-inner').appendChild(reactionsContainer);

            // this.handleShareAction(added[0]);
            // this.handleReactionMenu(added[0]);

            items = items.concat(added);
            limit++;
        }

        grid.layoutItems(items, true);

        // strictly for perf
        for (var i = 0; i < items.length; i++) {
            items[i].element.querySelector('.rev-reaction-bar').innerHTML = reactionHtml[i];
            this.handleShareAction(items[i]);
            this.handleReactionMenu(items[i]);
            this.handleBookmarkAction(items[i]);
        }

        return {
            items: items,
            limit: limit,
            internalLimit: internalLimit,
            sponsoredLimit: sponsoredLimit
        }
    }

    RevSlider.prototype.handleReactionMenu = function(item) {
        var that = this;
        var likeReactionElement = item.element.querySelector('.rev-reaction-icon');

        if (revDetect.mobile()) {

            // TODO - see related todo in revfeed.scss
            // revUtils.addEventListener(item.element.querySelector('.rev-reactions'), 'mouseover', function(ev) {
            //     ev.preventDefault();
            //     revUtils.addClass(item.element, 'rev-user-select-none');
            // }, {passive: false});

            this.mc = new Hammer(likeReactionElement, {
                recognizers: [
                    [
                        Hammer.Press,
                        {
                            time: 200
                        }
                    ],
                    [
                        Hammer.Tap,
                        // {
                        //     threshold: 2
                        // }
                    ],

                ],
                // domEvents: true
            });

            revUtils.addEventListener(likeReactionElement, 'touchstart', function(ev) {
                ev.stopPropagation();
                ev.preventDefault();
            }, {passive: false});

            this.mc.on('tap', function(ev) {
                var iconName = ev.target.getAttribute('data-icon');

                // revUtils.removeClass(item.element, 'rev-menu-active');

                if (iconName) {

                    revApi.request( that.options.host + '/api/v1/engage/addreaction.php?r=' + iconName + '&url=' + encodeURI(item.data.url), function(data) {
                        return;
                    });
		    
                    likeReactionElement.setAttribute('data-active', 1);

                    var icon = item.element.querySelector('.rev-reaction-like .rev-reaction-icon');

                    revUtils.removeClass(icon, 'rev-reaction-icon-', true);
                    revUtils.addClass(icon, 'rev-reaction-icon-' + iconName);

                    revUtils.addClass(icon, 'rev-reaction-icon-selected'); // TODO: this should not be needed
                    revUtils.removeClass(item.element, 'rev-menu-active');

                    var count = item.element.querySelector('.rev-reaction-count');
                    count.style.marginLeft = null; // remove margin left

                    if (!item.element.querySelector('.rev-reactions-total-inner .rev-reaction.rev-reaction-'+ iconName)) {
                        var iconTotal = 0;
                        var icons = item.element.querySelectorAll('.rev-reactions-total-inner .rev-reaction');
                        if (icons) {
                            iconTotal = icons.length;
                        }
                        item.element.querySelector('.rev-reactions-total-inner').insertAdjacentHTML('afterbegin', '<div style="z-index:' + (100 + iconTotal) + ';" class="rev-reaction rev-reaction-'+ iconName +'"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-'+ iconName +'-full"></div></div></div>');
                    }

                    that.setReactionText(item);

                    that.reactionCount(item, iconName, true);

                    that.transitionLogin(item, 'reaction');

                    return;
                }

                // revUtils.removeClass(item.element, 'rev-menu-active');
                // clearTimeout(that.likeReactionIconShowTimeout);

                var iconName = 'love';

                if (parseInt(likeReactionElement.getAttribute('data-active'))) {
                    likeReactionElement.setAttribute('data-active', 0);

                    revUtils.removeClass(likeReactionElement, 'rev-reaction-icon-', true);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-love');

                    that.reactionCount(item, iconName, false);

                    // var count = item.element.querySelector('.rev-reaction-count');
                    // count.innerHTML = count.innerHTML.split(' ')[2];
                } else {
                    likeReactionElement.setAttribute('data-active', 1);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-like');

                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-selected'); // TODO: this should not be needed

                    var count = item.element.querySelector('.rev-reaction-count');
                    count.style.marginLeft = null; // remove margin left

                    if (!item.element.querySelector('.rev-reactions-total-inner .rev-reaction.rev-reaction-'+ iconName)) {
                        var iconTotal = 0;
                        var icons = item.element.querySelectorAll('.rev-reactions-total-inner .rev-reaction');
                        if (icons) {
                            iconTotal = icons.length;
                        }
                        item.element.querySelector('.rev-reactions-total-inner').insertAdjacentHTML('afterbegin', '<div style="z-index:' + (100 + iconTotal) + ';" class="rev-reaction rev-reaction-'+ iconName +'"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-'+ iconName +'-full"></div></div></div>');
                    }

                    that.reactionCount(item, iconName, true);

                    that.setReactionText(item);
                }

                that.transitionLogin(item, 'reaction');
            });

            this.mc.on('press', function(ev) {
                // TODO REMOVE THIS and shit
                var dataIcon = ev.target.getAttribute('data-icon');
                if (dataIcon) {
                    return;
                }
                // ev.srcEvent.stopPropagation();
                // ev.preventDefault();
                revUtils.addClass(item.element, 'rev-menu-active');

                var listener = function(ev) {
                    ev.stopPropagation();
                    revUtils.removeClass(item.element, 'rev-user-select-none');
                    revUtils.removeClass(item.element, 'rev-menu-active');

                    // ev.preventDefault(); // TODO
                    revUtils.removeEventListener(window, 'touchstart', listener);
                };

                revUtils.addEventListener(window, 'touchstart', listener, {passive: false});
            });
        } else {

            revUtils.addEventListener(likeReactionElement, 'mouseenter', function(ev) {
                revUtils.addClass(likeReactionElement, 'rev-reaction-icon-active');
                clearTimeout(that.likeReactionIconHideTimeout);
                clearTimeout(that.likeReactionIconHideTimeoutInner);

                that.likeReactionIconShowTimeout = setTimeout(function() {
                    revUtils.addClass(item.element, 'rev-menu-active');
                }, 200);
            });

            revUtils.addEventListener(likeReactionElement, 'mouseleave', function(ev) {
                clearTimeout(that.likeReactionIconShowTimeout);

                that.likeReactionIconHideTimeout = setTimeout(function() {
                    revUtils.removeClass(likeReactionElement, 'rev-reaction-icon-active');
                    that.likeReactionIconHideTimeoutInner = setTimeout(function() {
                        revUtils.removeClass(item.element, 'rev-menu-active');
                    }, 600);
                }, 400);
            });

            revUtils.addEventListener(item.element.querySelector('.rev-reaction-menu-container'), 'click', function(ev) {
                ev.stopPropagation();
                ev.preventDefault();
            }, {passive: false});

            revUtils.addEventListener(likeReactionElement, 'click', function(ev) {

                var iconName = 'love';

                revUtils.removeClass(item.element, 'rev-menu-active');
                clearTimeout(that.likeReactionIconShowTimeout);

                if (parseInt(likeReactionElement.getAttribute('data-active'))) {
                    likeReactionElement.setAttribute('data-active', 0);

                    revUtils.removeClass(likeReactionElement, 'rev-reaction-icon-', true);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-love');

                    that.reactionCount(item, iconName, false);
                } else {
                    likeReactionElement.setAttribute('data-active', 1);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-like');

                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-selected'); // TODO: this should not be needed

                    var count = item.element.querySelector('.rev-reaction-count');

                    count.style.marginLeft = null; // remove margin left

                    revApi.request( that.options.host + '/api/v1/engage/addreaction.php?r=' + iconName + '&url=' + encodeURI(item.data.url), function(data) {
                        return;
                    });

                    if (!item.element.querySelector('.rev-reactions-total-inner .rev-reaction.rev-reaction-'+ iconName)) {
                        var iconTotal = 0;
                        var icons = item.element.querySelectorAll('.rev-reactions-total-inner .rev-reaction');
                        if (icons) {
                            iconTotal = icons.length;
                        }

                        item.element.querySelector('.rev-reactions-total-inner').insertAdjacentHTML('afterbegin', '<div style="z-index:' + (100 + iconTotal) + ';" class="rev-reaction rev-reaction-'+ iconName +'"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-'+ iconName +'-full"></div></div></div>');
                    }

                    that.reactionCount(item, iconName, true);

                    that.setReactionText(item);
                }

                that.transitionLogin(item, 'reaction');
            });

            var menuItems = item.element.querySelectorAll('.rev-reaction-menu-item');

            for (var menuItemCount = 0; menuItemCount < menuItems.length; menuItemCount++) {
                revUtils.addEventListener(menuItems[menuItemCount], 'click', function(ev) {

                    ev.preventDefault();
                    ev.stopPropagation();

                    var iconName = ev.target.getAttribute('data-icon');

                    if (!iconName) {
                        return;
                    }

                    revApi.request( that.options.host + '/api/v1/engage/addreaction.php?r=' + iconName + '&url=' + encodeURI(item.data.url), function(data) {
                        return;
                    });

                    likeReactionElement.setAttribute('data-active', 1);

                    var icon = item.element.querySelector('.rev-reaction-like .rev-reaction-icon');

                    revUtils.removeClass(icon, 'rev-reaction-icon-', true);
                    revUtils.addClass(icon, 'rev-reaction-icon-' + iconName);

                    revUtils.addClass(icon, 'rev-reaction-icon-selected'); // TODO: this should not be needed

                    // revUtils.removeClass(el.target.parentNode.parentNode.parentNode, 'rev-active');
                    revUtils.removeClass(item.element, 'rev-menu-active');

                    var count = item.element.querySelector('.rev-reaction-count');

                    count.style.marginLeft = null; // remove margin left

                    if (!item.element.querySelector('.rev-reactions-total-inner .rev-reaction.rev-reaction-'+ iconName)) {
                        var iconTotal = 0;
                        var icons = item.element.querySelectorAll('.rev-reactions-total-inner .rev-reaction');
                        if (icons) {
                            iconTotal = icons.length;
                        }
                        item.element.querySelector('.rev-reactions-total-inner').insertAdjacentHTML('afterbegin', '<div style="z-index:' + (100 + iconTotal) + ';" class="rev-reaction rev-reaction-'+ iconName +'"><div class="rev-reaction-inner"><div class="rev-reaction-icon rev-reaction-icon-'+ iconName +'-full"></div></div></div>');
                    }

                    that.reactionCount(item, iconName, true);

                    that.setReactionText(item);

                    that.transitionLogin(item, 'reaction');

                }, {passive: false});
            }
        }
    };

    RevSlider.prototype.transitionLogin = function(item, engagetype) {
        var that = this;
        setTimeout(function() {
            var headline = item.element.querySelector('.rev-auth-headline');
            var engagetxt = item.element.querySelector('.rev-engage-type-txt');
            var lineHeight = parseInt(revUtils.getComputedStyle(headline, 'line-height'));
            var height = parseInt(revUtils.getComputedStyle(headline, 'height'));
            var fontSize = parseInt(revUtils.getComputedStyle(headline, 'font-size'));
            var lines = height / lineHeight;

            if (engagetxt) {
                if (engagetype == 'reaction') {
                    engagetxt.innerHTML = 'Almost Done! Login to save your reaction';
                } else if (engagetype == 'bookmark') {
                    engagetxt.innerHTML = 'Almost Done! Login to save your bookmark';
                }
            }

            var fallback = 0; // just in case
            while(lines >= 3 && fallback < 100) {
                fallback++;

                fontSize--;
                lineHeight--;

                headline.style.fontSize = fontSize + 'px';
                headline.style.lineHeight = lineHeight + 'px';

                height = parseInt(revUtils.getComputedStyle(headline, 'height'));

                lines = height / lineHeight;
            }

            var logo = item.element.querySelector('.rev-auth-site-logo');
            if (logo) {
                logo.style.width = logo.offsetHeight + 'px';
            }

            if (!that.authenticated) {
                revUtils.removeClass(document.querySelector('.rev-flipped'), 'rev-flipped');
                revUtils.addClass(item.element, 'rev-flipped');
            }
        }, 0);
    };

    RevSlider.prototype.reactionCount = function(item, iconName, increase) {
        if (this.options.reactions.indexOf(iconName) < 3) {
            if (increase) {
                item.reactionCountTotalPos++;
            } else {
                item.reactionCountTotalPos--;
            }
            item.element.querySelector('.rev-reaction-menu-item-count-pos .rev-reaction-menu-item-count-inner').innerText = this.milliFormatter(item.reactionCountTotalPos);
        } else {
            if (increase) {
                item.reactionCountTotalNeg++;
            } else {
                item.reactionCountTotalNeg--;
            }
            item.element.querySelector('.rev-reaction-menu-item-count-neg .rev-reaction-menu-item-count-inner').innerText = this.milliFormatter(item.reactionCountTotalNeg);
        }
    };

    RevSlider.prototype.setReactionText = function(item) {
        var count = item.element.querySelector('.rev-reaction-count');

        if (item.reactionCountTotal === 0) {
            count.innerHTML = 'You reacted!';
        } else {
            count.innerHTML = 'You and ' + item.reactionCountTotal + (item.reactionCountTotal === 1 ? ' other' : ' others');
        }
    };

    RevSlider.prototype.handleShareAction = function(item) {
        var share = item.element.querySelector('.rev-reaction-share');

        if (share) {
            revUtils.addEventListener(share, 'click', function(ev) {
                ev.preventDefault();
                if (!item.data) {
                    return;
                }

                // Fixes dual-screen position                         Most browsers      Firefox
                var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
                var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

                var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
                var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

                var w = width / 2;
                var h = height / 2;

                var left = ((width / 2) - (w / 2)) + dualScreenLeft;
                var top = ((height / 2) - (h / 2)) + dualScreenTop;
                var newWindow = window.open("https://www.facebook.com/sharer/sharer.php?u=" + item.data.target_url, "shareWindow", 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

                // Puts focus on the newWindow
                if (window.focus) {
                    newWindow.focus();
                }
            }, {passive: false});
        }
    }

    RevSlider.prototype.handleBookmarkAction = function(item) {
        var that = this;
        var handleSave = function(bookmark) {
            revUtils.addEventListener(bookmark, revDetect.mobile() ? 'touchstart' : 'click', function(e) {
                if (revUtils.hasClass(bookmark, 'rev-save-active')) {
                    revUtils.removeClass(bookmark, 'rev-save-active');
                } else {
                    revUtils.addClass(bookmark, 'rev-save-active');

                    if (that.options.window_width_enabled && item.index === 0) { // set overflows if window with for first element
                        that.element.parentNode.style.overflow = 'visible';
                        document.documentElement.style.overflow = 'hidden';
                        document.body.style.overflow = 'hidden';

                        var removeOverflow = function() {
                            document.documentElement.style.overflow = 'visible';
                            document.body.style.overflow = 'visible';
                            that.element.parentNode.style.overflow = 'hidden';
                            revUtils.removeEventListener(window, 'touchstart', removeOverflow);
                        }

                        revUtils.addEventListener(window, 'touchstart', removeOverflow);

                        that.onEndAnimation(bookmark, function() {
                            removeOverflow();
                        });
                    }
                    that.transitionLogin(item, 'bookmark');

                    //save bookmark
                    var url = item.data.target_url;
                    var title = item.data.headline;
                    revApi.request( that.options.host + '/api/v1/engage/addbookmark.php?callback=cb&url=' + url + '&title=' + title, function(data) {
                        return;
                    });

                }
                e.preventDefault();
                e.stopPropagation();

            }, {passive: false});
        }

        handleSave(item.element.querySelector('.rev-meta-inner .rev-save'));
    };

    RevSlider.prototype.onEndAnimation = function(el, callback) {
        // modified from https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Detecting_CSS_animation_support
        var animation = false,
            animationstring = 'animationend',
            domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
            pfx  = '',
            elem = document.createElement('div');

        if( elem.style.animationName !== undefined ) { animation = true; }

        if( animation === false ) {
            for( var i = 0; i < domPrefixes.length; i++ ) {
                if( elem.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
                    pfx = domPrefixes[ i ];
                    animationstring = pfx.toLowerCase() + 'AnimationEnd';
                    animation = true;
                    break;
                }
            }
        }

        var onEndCallbackFn = function( ev ) {
            if( animation ) {
                if( ev.target != this ) return;
                this.removeEventListener( animationstring, onEndCallbackFn );
            }
            if( callback && typeof callback === 'function' ) { callback.call(); }
        };
        if( animation ) {
            el.addEventListener( animationstring, onEndCallbackFn );
        } else {
            onEndCallbackFn();
        }
    };

    RevSlider.prototype.gridOptions = function() {
        return {
            isInitLayout: false,
            masonry: false,
            perRow: this.options.per_row,
            transitionDuration: this.options.transition_duration,
            isResizeBound: this.options.is_resize_bound,
            adjustGutter: true,
            // removeVerticalGutters: false,
            breakpoints: this.options.breakpoints,
            column_spans: this.options.column_spans,
            rows: this.options.rows,
            stacked: this.options.stacked,
            removeVerticalGutters: true,
            masonry: true,
            orderMasonry: false,
            itemBreakpoints: this.options.item_breakpoints,
            imageRatio: this.options.image_ratio
        };
    };

    RevSlider.prototype.createBrandLogo = function(className, square) {
        var char = square ? this.options.brand_logo_secondary.charAt(0) : this.options.brand_logo.charAt(0);

        var brandLogo = document.createElement('div');

        if (char === '<') {
            brandLogo.innerHTML = (square ? this.options.brand_logo_secondary : this.options.brand_logo);
        } else {
            // var brandLogo = document.createElement('img');
            brandLogo.innerHTML = '<img src="'+ (square ? this.options.brand_logo_secondary : this.options.brand_logo) +'"/>';
        }

        revUtils.addClass(brandLogo, className);

        return brandLogo;
    };

    RevSlider.prototype.appendElements = function() {

        if (!this.options.hide_header) {
            if (this.head) {
                revUtils.remove(this.head);
            }
            this.head = document.createElement('div');
            revUtils.addClass(this.head, 'rev-head');
            revUtils.prepend(this.containerElement, this.head);

            this.header = document.createElement('h2');
            this.header.innerHTML = this.options.header;
            revUtils.addClass(this.header, 'rev-header');
            revUtils.append(this.head, this.header);

            if (this.options.brand_logo) {
                var brandLogo = this.createBrandLogo('rev-header-logo');
                brandLogo.style.float = 'left';
                this.head.insertAdjacentElement('afterbegin', brandLogo);
            }
        }

        if (!this.options.hide_footer) {
            if (this.foot) {
                revUtils.remove(this.foot);
            }
            var sponsoredFoot = (this.options.rev_position == 'bottom_left' || this.options.rev_position == 'bottom_right');
            if (sponsoredFoot) {
                this.foot = document.createElement('div');
                revUtils.addClass(this.foot, 'rev-foot');
                revUtils.append(this.containerElement, this.foot);
            }

            this.sponsored = document.createElement('div');

            revUtils.addClass(this.sponsored, 'rev-sponsored');
            revDisclose.setGrid(this.grid);
            this.sponsored.innerHTML = this.getDisclosure();

            if (this.options.rev_position == 'top_right') {
                revUtils.addClass(this.sponsored, 'top-right');
                revUtils.append(this.head, this.sponsored);
            } else if (sponsoredFoot) {
                revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
                revUtils.append(this.foot, this.sponsored);
            }
        }
    };

    RevSlider.prototype.resize = function() {
        this.grid.layout();

        this.setGridClasses();

        this.resizeImageCheck(this.grid.items);

        this.emitter.emitEvent('resized');
    };

    RevSlider.prototype.resizeImageCheck = function(items) {
        for (var i = 0; i < items.length; i++) {
            var revImage = items[i].element.querySelector('.rev-image');
            if (items[i].preloaderHeight > parseInt(revImage.getAttribute('data-img-height')) ||  items[i].preloaderWidth > parseInt(revImage.getAttribute('data-img-width'))) {
                this.setImage(items[i], revImage);
            }
        }
    };

    RevSlider.prototype.setImage = function(item, revImage) {
        if (this.options.mobile_image_optimize && revDetect.mobile()) {
            var roundedPreloaderHeight = Math.round(item.preloaderHeight / this.options.mobile_image_optimize);
            var roundedPreloaderWidth = Math.round(item.preloaderWidth / this.options.mobile_image_optimize);
        } else {
            var roundedPreloaderHeight = Math.round(item.preloaderHeight);
            var roundedPreloaderWidth = Math.round(item.preloaderWidth);
        }
        var image = item.data.image;

        image = image.replace('h=315', 'h=' + roundedPreloaderHeight).replace('w=420', 'w=' + roundedPreloaderWidth) + '&h=' + roundedPreloaderHeight + '&w=' + roundedPreloaderWidth;

        revImage.setAttribute('data-img-height', roundedPreloaderHeight);
        revImage.setAttribute('data-img-width', roundedPreloaderWidth);

        if (!item.data.video_id) {
            revImage.style.backgroundImage = 'url('+ image +')';
            // revImage.innerHTML = '<img src=" ' + image + ' " />';
        } else {
	    var cb = new Date().getMilliseconds();
            var site_url = document.location.href;
            revImage.innerHTML = '<iframe id="rc_video' + item.data.video_id + '" src="//video.powr.com/video.js.php?if=true&v=' + item.data.video_id + '&uid='+this.options.pub_id+'&t=1&c='+cb+'&su='+ encodeURI(site_url) +'&adt=-1" style="border: none; width: '+ roundedPreloaderWidth +'px; height: ' + roundedPreloaderHeight + 'px;""></iframe>';
            // revImage.innerHTML = '<iframe id="rc_video' + item.data.video_id + '" src="http://code.revcontent.com/mock/feed4/video' + item.data.video_id + '.iframe.html" style="border: none; width: '+ roundedPreloaderWidth +'px; height: ' + roundedPreloaderHeight + 'px;""></iframe>';
        }
    };

    RevSlider.prototype.isAuthenticated = function(callback) {
        var that = this;
        revApi.xhr(this.options.host + '/feed.php?provider=facebook_engage&action=connected', function(response) {
            that.authenticated = response.success;
            callback.call(this, that.authenticated);
        }, function() {
            callback.call(this, -1);
        }, true);
    };

    RevSlider.prototype.createNewCell = function() {
        var that = this;

        var html = '<div class="rev-content-inner">' +
            '<div class="rev-flip">' +

                '<div class="rev-flip-front">' +
                    '<div class="rev-ad">' +
                        '<div class="rev-ad-container">' +
                            '<div class="rev-ad-outer">' +
                                '<a href="" target="_blank">' +
                                    '<div class="rev-ad-inner">' +
                                        '<div class="rev-before-image">' +
                                            '<div class="rev-meta">' +
                                                '<div class="rev-meta-inner">' +
                                                    '<div class="rev-headline-icon-container"><div class="rev-headline-icon"></div></div>' +
                                                    '<div style="overflow: hidden; display: inline-block">' +
                                                        '<div class="rev-provider"></div>' +
                                                        '<div class="rev-date"></div>' +
                                                    '</div>' +
                                                    '<div class="rev-save"><?xml version="1.0" ?><svg contentScriptType="text/ecmascript" contentStyleType="text/css" preserveAspectRatio="xMidYMid meet" version="1.0" viewBox="0 0 60.000000 60.000000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" zoomAndPan="magnify"><g><polygon fill="none" points="51.0,59.0 29.564941,45.130005 9.0,59.0 9.0,1.0 51.0,1.0" stroke="#231F20" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2"/></g></svg></div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +

                                        '<div class="rev-image"></div>' +

                                        '<div class="rev-after-image">' +
                                            '<div class="rev-headline-brand">' +
                                                '<div class="rev-headline-brand-inner">' +
                                                    '<div class="rev-headline"></div>' +
                                                    '<div class="rev-description"></div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</a>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="rev-flip-back">' +
                    '<div class="rev-auth-mask"></div>' +
                    '<div class="rev-auth">' +
                        '<a class="rev-auth-close-button">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" fit="" height="20" width="20" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M28.5 9.62L26.38 7.5 18 15.88 9.62 7.5 7.5 9.62 15.88 18 7.5 26.38l2.12 2.12L18 20.12l8.38 8.38 2.12-2.12L20.12 18z"/></svg>' +
                        '</a>' +
                        '<div class="rev-auth-box">' +

                            '<div class="rev-auth-box-inner">' +
                                '<div class="rev-auth-subline">'+ this.getDisclosure() +'</div>' +
                                '<div class="rev-auth-headline">' +
                                    (this.authenticated ? 'Currently logged in!' : '<span class="rev-engage-type-txt">Almost Done! Login to save your reaction</span> <br /> <strong>and</strong> personalize your experience') +
                                '</div>' +
                                '<div class="rev-auth-button">' +
                                    '<div class="rev-auth-button-icon">' +
                                        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 155.139 155.139" style="enable-background:new 0 0 155.139 155.139;" xml:space="preserve" class=""><g><g> <path id="f_1_" d="M89.584,155.139V84.378h23.742l3.562-27.585H89.584V39.184   c0-7.984,2.208-13.425,13.67-13.425l14.595-0.006V1.08C115.325,0.752,106.661,0,96.577,0C75.52,0,61.104,12.853,61.104,36.452   v20.341H37.29v27.585h23.814v70.761H89.584z" data-original="#000000" class="active-path" data-old_color="#ffffff" fill="#ffffff"/> </g></g> </svg>' +
                                    '</div>' +
                                    '<div class="rev-auth-button-text">' +
                                        (this.authenticated ? 'Log out' : 'Continue with facebook') +
                                    '</div>' +
                                '</div>' +
                                '<div class="rev-auth-terms">' +
                                    '<span>by signing up you agree to the <a href="#">Terms</a></span>' +
                                    // '<span>|</span>' +
                                    // '<a href="#">Privacy Policy</a>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' + // end back

            '</div>' +

            '<div class="rev-reactions">' +
                '<div class="rev-reaction-bar"></div>' +
            '</div>' +

            '<div class="rev-reactions-total">' +
                '<div class="rev-reactions-total-inner">' +
            '</div>' +

        '</div>';

        var cell = document.createElement('div');
        cell.className = 'rev-content';
        cell.innerHTML = html;

        if (this.options.brand_logo_secondary) {

            var brandLogoSquare = this.createBrandLogo('rev-auth-site-logo', true);

            revUtils.prepend(cell.querySelector('.rev-auth-box'), brandLogoSquare);
        }

        var close = cell.querySelector('.rev-auth-close-button');
        revUtils.addEventListener(close, 'click', function(e) {
            revUtils.removeClass(cell, 'rev-flipped');
        });

        var that = this;
        revUtils.addEventListener(cell.querySelector('.rev-auth-button'), 'click', function(e) {
            if (that.authenticated) {
                var url = that.options.host + "/feed.php?provider=facebook_engage&action=logout&w=" + that.options.widget_id + "&p=" + that.options.pub_id;
            } else {
                var url = that.options.host + "/feed.php?provider=facebook_engage&w=" + that.options.widget_id + "&p=" + that.options.pub_id;
            }

            var popup = window.open(url, 'Login', 'resizable,width=600,height=800');

            var closedCheckInterval = setInterval(function() {
                if (popup.closed) {
                    that.isAuthenticated(function(response) {
                        if (response === true) {
                            revUtils.removeClass(cell, 'rev-flipped');
                            that.updateAuthElements();

                            /* secondary auth page, deemed unnecessary for now
                            var headline = cell.querySelector('.rev-auth-headline');
                            var button = cell.querySelector('.rev-auth-button');
                            var image = cell.querySelector('.rev-auth-site-logo');
                            var container = cell.querySelector('.rev-auth-box');

                            if (image) {
                                image.innerHTML = "<img src='https://graph.facebook.com/758080600/picture?type=square' />";
                            } else {
                                container.insertAdjacentHTML('afterbegin',"<img src='https://graph.facebook.com/758080600/picture?type=square' />");
                            }

                            button.style.display = "none";
                            headline.innerHTML = "One Last Step, Please enter a password:<br/><input type='text' class='rev-engpass'/><input type='button' value='Sign Up'/>";*/
                            that.showPersonalizedTransition();
                        } else {
                            // TODO
                        }
                        revDisclose.postMessage();
                    });
                    clearInterval(closedCheckInterval);
                }
            }, 100);
        });

        /* secondary auth page, deemed unnecessary for now
        revUtils.addEventListener(cell.querySelector('.rev-auth-button'), 'click', function(e) {
            //revUtils.removeClass(cell, 'rev-flipped');
            //that.updateAuthElements();
        });
        */

        return cell;
    };



    RevSlider.prototype.getDisclosure = function() {
        return revDisclose.getDisclosure(this.options.disclosure_text, {
            aboutSrc: this.options.disclosure_about_src,
            aboutHeight: this.options.disclosure_about_height,
            interestSrc: this.options.disclosure_interest_src,
            interestHeight: this.options.disclosure_interest_height,
            widget_id: this.options.widget_id,
            pub_id: this.options.pub_id
        });
    };

    RevSlider.prototype.getSerializedQueryParams = function() {
         if (!this.serializedQueryParams) {
            var serialized = revUtils.serialize(this.options.query_params);
            this.serializedQueryParams = serialized ? '&' + serialized : '';
         }
         return this.serializedQueryParams;
    };

    RevSlider.prototype.generateUrl = function(offset, count, empty, viewed, internal, below_article, fill) {
        var url = (this.options.host ? this.options.host + '/api/v1/' : this.options.url) +
        '?api_key=' + this.options.api_key +
        this.getSerializedQueryParams() +
        '&pub_id=' + this.options.pub_id +
        '&widget_id=' + this.options.widget_id +
        '&domain=' + this.options.domain +
        '&api_source=' + this.options.api_source + (below_article ? 'ba' : '');

        url +=
        '&sponsored_count=' + (internal ? 0 : count) +
        '&internal_count=' + (internal ? count : 0) +
        '&sponsored_offset=' + (internal ? 0 : offset) +
        '&internal_offset=' + (internal ? offset : 0);

        if (internal) {
            url += '&show_comments=1';
        }

        if (this.options.keywords) {
            url += ('&keywords=' + this.options.keywords)
        }

        url += fill ? '&fill=true' : '';

        url += this.options.user_ip ? ('&user_ip=' + this.options.user_ip) : '';
        url += this.options.user_agent ? ('&user_agent=' + this.options.user_agent) : '';

        if (empty) {
            url += '&empty=true';
        }

        if (viewed) {
            url += '&viewed=true';
        }

        return url;
    };

    RevSlider.prototype.getData = function() {
        if (this.dataPromise) {
            return this.dataPromise;
        }

        var urls = [];

        if (this.internalLimit > 0) {
            var internalURL = this.generateUrl(0, this.internalLimit, false, false, true);
            urls.push({
                offset: 0,
                limit: this.internalLimit,
                url: internalURL,
                type: 'internal'
            });
        }

        if (this.sponsoredLimit > 0) {
            // don't register multiple widget impressions
            // var fill = urls.length > 0;
            var sponsoredURL = this.generateUrl(0, this.sponsoredLimit, false, false, false);
            urls.push({
                offset: 0,
                limit: this.sponsoredLimit,
                url: sponsoredURL,
                type: 'sponsored'
            });
        }

        this.promises = [];
        var that = this;
        for (var i = 0; i < urls.length; i++) {
            this.promises.push(new Promise(function(resolve, reject) {
                var url = urls[i];

                revApi.request(url.url, function(resp) {
                    if (!resp.length) {
                        reject();
                        return;
                    }
                    resolve({
                        type: url.type,
                        data: resp
                    });
                });
            }));
        }

        this.dataPromise = Promise.all(this.promises);

        return this.dataPromise;
    };

    RevSlider.prototype.updateDisplayedItems = function(items, data) {
        // if (!this.data.length) { // if no data remove the container and call it a day
        //     this.destroy();
        //     return;
        // }

        var itemTypes = {
            sponsored: [],
            internal: [],
            header: []
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            itemTypes[item.type].push(item);
        }

        this.removeItems = [];

        for (var i = 0; i < data.length; i++) {
            var dataType = data[i].type;
            var dataData = data[i].data;
            for (var j = 0; j < itemTypes[dataType].length; j++) {
                var item = itemTypes[dataType][j];
                var itemData = dataData[j];

                if (!itemData) {
                    this.removeItems.push(item);
                    continue;
                }

                item.viewIndex = j;
                item.data = itemData;

                var anchor = item.element.querySelector('a');
                var url = itemData.url;
                if (itemData.type == 'internal' && this.options.trending_utm) {
                    url += ('&' + this.options.trending_utm);
                }
                anchor.setAttribute('href', url);
                anchor.title = itemData.headline;

                this.setImage(item, item.element.querySelector('.rev-image'));

                var headline = item.element.querySelector('.rev-headline');
                headline.innerHTML = itemData.headline;

                var description = item.element.querySelector('.rev-description');
                if (description) {
                    description.innerHTML = itemData.description ? itemData.description : 'Read More';
                }

                var favicon = item.element.querySelector('.rev-headline-icon');
                if (favicon) {
                    if (item.type == 'internal' && !itemData.author) {
                        revUtils.remove(item.element.querySelector('.rev-before-image'));
                    } else {
                        if (itemData.favicon_url) {
                            favicon.innerHTML = '<span class="rev-headline-icon-image" style="background-repeat:no-repeat;background-image:url('+ itemData.favicon_url +')' + '"></span>';
                        } else {
                            var iconInitialsWords = itemData.author ? itemData.author.replace(/\(|\)/g, '').split(' ') : itemData.brand.replace(/\(|\)/g, '').split(' ');

                            var initials = '';
                            for (var initialsCount = 0; initialsCount < 2 && iconInitialsWords.length > initialsCount; initialsCount++) {
                                initials += iconInitialsWords[initialsCount].charAt(0).toUpperCase();
                            }

                            if (!this.initialIconColorsCopy || this.initialIconColorsCopy.length == 0) {
                                this.initialIconColorsCopy = this.options.initial_icon_colors.slice(0);
                            }

                            if (this.initialColors && this.initialColors[initials]) {
                                var initialColor = this.initialColors[initials];
                            } else {
                                var initialColor = this.initialIconColorsCopy[Math.floor(Math.random()*this.initialIconColorsCopy.length)];
                                var index = this.initialIconColorsCopy.indexOf(initialColor);
                                if (index > -1) {
                                    this.initialIconColorsCopy.splice(index, 1);
                                }
                                if (!this.initialColors) {
                                    this.initialColors = {};
                                }
                                this.initialColors[initials] = initialColor;
                            }
                            favicon.innerHTML = '<div style="background-color:#'+ initialColor +'" class="rev-author-initials">'+ initials +'</div>';
                        }

                        var date = item.element.querySelector('.rev-date');
                        if (date) {
                            if (item.type == 'sponsored') {
                                var icon = '<span class="rev-sponsored-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg enable-background="new 0 0 128 128" id="Layer_1" version="1.1" viewBox="0 0 128 128" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M72.259,38.978c0.148,0.021,0.797-0.38,1.041-0.506s0.979,0.295,1.208,0.38s1.28-0.13,1.45-0.295   c0.17-0.166,0.192-0.507,0.049-0.759s-0.709-0.947-0.935-0.991c-0.225-0.044-0.969-0.158-1.147-0.159s-0.724,0.1-0.81,0.225   c-0.085,0.125-0.345,0.559-0.386,0.685s-0.3,0.494-0.481,0.538c-0.181,0.043-0.628,0.281-0.588,0.428S72.11,38.957,72.259,38.978z"/><path d="M74.428,41.097c-0.13,0.172-0.572,1.036-0.692,1.535c-0.12,0.499,0.012,2.559,0.237,2.423   c0.226-0.136,0.81-0.779,0.799-1.129c-0.011-0.35,0.102-1.443,0.275-1.66s0.969-1.123,1.098-1.25   c0.128-0.127-0.023-0.232-0.336-0.233C75.497,40.782,74.559,40.925,74.428,41.097z"/><path d="M87.878,4.622c-0.026,0-0.293-0.108-0.849-0.334C79.882,1.528,72.121,0,64,0C28.654,0,0,28.654,0,64   c0,35.347,28.654,64,64,64c35.346,0,64-28.653,64-64C128,37.098,111.393,14.088,87.878,4.622z M83.076,6.278   c0.146,0.16,1.074,0.425,1.412,0.481c0.339,0.057,2.473,0.523,2.654,0.659s0.362,0.448,0.401,0.692   c0.039,0.245-1.719,0.042-2.532-0.18c-0.814-0.222-3.471-1.203-3.654-1.373s0.037-0.725,0.421-0.719   C82.162,5.845,82.929,6.118,83.076,6.278z M77.201,4.695c0.193-0.01,1.237-0.052,1.559-0.055c0.32-0.002,1.179,0.073,1.333,0.073   s1.465,0.086,1.528,0.165c0.064,0.079,0.004,0.163-0.134,0.188s-0.703,0.045-0.88,0.033c-0.178-0.012-0.589-0.131-0.475-0.158   c0.115-0.027,0.259-0.108,0.168-0.122c-0.092-0.014-0.423-0.044-0.537-0.042c-0.114,0.003-0.417,0.065-0.419,0.133   c-0.002,0.067-1.258,0.024-1.524-0.052c-0.268-0.076-1.187-0.138-1.117-0.144C76.771,4.706,77.008,4.705,77.201,4.695z    M72.222,4.825c0.531-0.002,0.991-0.01,1.001-0.011c0.009-0.001,0.562-0.014,0.708-0.018c0.146-0.003,0.542-0.009,0.626-0.008   c0.083,0.001,0.098,0.01,0.033,0.018c-0.065,0.008-1.856,0.101-2.477,0.101S71.69,4.828,72.222,4.825z M65.721,5.043   c0.182-0.004,0.916-0.024,1.232-0.037c0.315-0.012,0.872-0.026,0.973-0.027c0.1-0.001,0.491-0.004,0.748-0.011   c0.171-0.005,0.604-0.02,0.914-0.032c-0.034-0.001-0.078-0.004-0.1-0.004c-0.172-0.006,0.082-0.026,0.209-0.028   c0.127-0.002,0.339,0.007,0.217,0.017c-0.041,0.003-0.169,0.009-0.326,0.016c0.234,0.01,0.706,0.035,0.883,0.04   c0.202,0.004,0.832,0.106,0.916,0.088c0.083-0.019,0.609-0.108,0.801-0.127c0.192-0.02,0.917,0.005,0.974,0.033   c0.057,0.027,0.372,0.137,0.578,0.159s1.114-0.007,1.351-0.031c0.235-0.023,0.599-0.102,0.695-0.083   c0.096,0.02,0.47,0.082,0.617,0.087c0.148,0.005,1.246,0.061,1.562,0.082s0.801,0.099,0.901,0.139   c0.101,0.04-0.015,0.235-0.073,0.294c-0.059,0.059,0.196,0.256,0.492,0.355c0.296,0.099,1.132,0.628,0.947,0.654   s-0.472,0.002-0.639-0.051c-0.167-0.054-0.896-0.332-1.132-0.409c-0.236-0.077-1.123-0.247-1.348-0.294S75.937,5.5,75.658,5.413   c-0.278-0.086-0.992-0.208-1.084-0.204s-0.244,0.053-0.135,0.103c0.108,0.049-0.14,0.166-0.258,0.19   c-0.119,0.024-1.206,0.056-2.27,0.077s-2.958-0.071-3.58-0.165c-0.623-0.093-1.512-0.348-1.658-0.352s-0.625-0.01-0.74-0.013   c-0.086-0.002-0.285-0.003-0.391-0.004c-0.052,0-0.08-0.001-0.067-0.001c0.006,0,0.031,0,0.067,0.001   C65.585,5.045,65.641,5.045,65.721,5.043z M13.156,41.313c-0.009,0.027-0.011,0.054-0.011-0.008c0-0.062,0.018-0.136,0.021-0.102   S13.165,41.286,13.156,41.313z M13.367,40.05c-0.027,0.087-0.07,0.178-0.052,0.007c0.018-0.171,0.109-0.616,0.105-0.456   S13.394,39.963,13.367,40.05z M15.071,36.306c-0.396,0.745-1.131,2.144-1.107,1.946s0.142-0.502,0.17-0.522   c0.029-0.02,0.219-0.389,0.355-0.777c0.136-0.388,0.589-1.23,0.759-1.579s0.484-0.594,0.505-0.533   C15.775,34.901,15.468,35.561,15.071,36.306z M88.323,122.139c-0.253,0.126-1.378,0.228-1.232,0.1s1.444-0.466,1.608-0.49   C88.863,121.723,88.577,122.014,88.323,122.139z M102.949,86.24c-0.022,0.335-0.105,1.195-0.184,1.911   c-0.079,0.717-0.553,4.61-0.81,6.39s-0.806,4.162-0.979,4.402s-0.881,1.237-1.128,1.693c-0.246,0.456-0.88,1.484-1.112,1.806   s-0.81,1.846-0.763,1.884s-0.157,0.857-0.562,1.738c-0.404,0.881-1.234,2.521-1.337,2.609s-0.431,0.475-0.498,0.664   s-0.479,1.25-0.82,1.624s-1.835,1.689-1.853,1.821s-0.202,0.772-0.371,1.136c-0.17,0.364-1.824,1.766-2.025,1.85   c-0.202,0.085-0.812,0.407-0.896,0.533c-0.084,0.125-0.661,0.998-0.914,1.059c-0.254,0.06-0.932,0.444-1.026,0.541   c-0.095,0.098-0.19,0.333-0.001,0.314s0.678,0,0.679,0.08s-0.518,0.426-0.688,0.515s-0.479,0.332-0.552,0.497   c-0.073,0.164-1.095,0.892-1.393,1.082c-0.297,0.19-0.394,0.485-0.234,0.51s0.27,0.323-0.104,0.607   c-0.372,0.285-1.368,0.965-1.366,1.045s0.046,0.312,0.103,0.362c0.058,0.05,0.627,0.623,0.838,0.605   c0.211-0.019,0.812,0.205,0.65,0.243c-0.163,0.038-1.248,0.45-1.665,0.487s-1.485-0.207-1.826-0.203   c-0.341,0.005-1.262-0.788-1.544-0.806c-0.281-0.018-0.203-0.342-0.322-0.345s-0.355-0.081-0.257-0.169s0.286-0.374,0.2-0.396   c-0.085-0.023-0.22-0.17-0.104-0.266c0.117-0.097,0.744-0.45,0.812-0.471s0.325-0.182,0.387-0.268   c0.062-0.086-0.275-0.129-0.427-0.122s-0.555-0.081-0.529-0.175s0.529-0.788,0.659-0.877c0.131-0.09,0.511-0.464,0.553-0.627   c0.043-0.163,0.071-0.695-0.027-0.794c-0.098-0.099,0.07-0.776,0.186-0.975c0.114-0.198,0.799-0.903,0.972-1.151   c0.173-0.247,0.595-1.095,0.558-1.3s-0.104-1.044-0.059-1.382c0.045-0.337,0.499-2.082,0.66-2.649   c0.162-0.567,0.675-2.622,0.731-3.188s-0.284-2.2-0.532-2.598c-0.249-0.398-2.226-1.274-2.798-1.459s-1.465-0.615-1.826-0.84   s-1.503-1.317-1.788-1.703c-0.284-0.387-1.137-2.075-1.619-2.468s-1.257-1.458-1.172-1.761c0.085-0.304,1.138-2.479,1.082-3.051   c-0.055-0.573-0.021-2.418,0.198-2.654s1.855-2.153,2.305-2.761s0.704-2.521,0.525-3.306c-0.179-0.783-1.999-1.797-2.097-1.523   c-0.099,0.273-0.794,0.872-1.324,0.722s-3.383-1.343-3.902-1.531c-0.519-0.188-2.025-2.018-2.433-2.546s-2.306-1.296-3.365-1.577   c-1.061-0.281-5.067-1.191-6.517-1.374c-1.45-0.184-4.75-1.017-5.586-1.34s-3.341-2.303-3.393-3.068   c-0.052-0.766-0.899-2.46-1.449-3.165s-2.869-4.339-3.547-5.377c-0.678-1.038-2.225-2.364-2.193-1.812s1.119,3.063,1.476,3.784   c0.356,0.722,1.039,2.416,1.195,2.757c0.155,0.341,0.517,0.683,0.373,0.784c-0.143,0.103-0.882,0.077-1.324-0.281   c-0.442-0.359-1.663-2.329-1.98-2.875c-0.317-0.546-1.048-1.64-1.001-2.058s0.161-1.05-0.164-1.375   c-0.325-0.325-1.022-2.582-1.155-3.212c-0.132-0.63-0.918-2.466-1.459-2.688s-2.041-1.244-2.163-1.792   c-0.122-0.547-0.302-2.742-0.45-2.902s-0.486-0.71-0.569-0.854c-0.083-0.144-0.237-1.465-0.16-2.765   c0.076-1.3,0.643-4.438,0.906-5.312s1.583-4.077,1.64-4.353s0.119-1.635,0.255-1.778c0.137-0.143,0.304-0.863,0.067-1.285   c-0.237-0.422-2.156-1.414-2.092-1.743c0.064-0.33,0.583-0.983,0.759-1.121c0.176-0.138,0.549-1.063,0.438-1.813   c-0.111-0.75-1.356-2.485-1.485-2.387c-0.129,0.099-0.501,0.689-0.539,1.093c-0.039,0.403-0.241,1.209-0.369,0.872   c-0.128-0.338,0.146-1.549,0.352-1.843s1.268-0.709,1.282-0.854s-0.073-0.582-0.225-0.654c-0.153-0.072-0.561-0.755-0.573-1.362   s-0.446-1.994-0.379-2.36c0.067-0.366,0.112-1.052-0.092-1.341s-0.887-1.22-1.433-1.558c-0.546-0.338-2.719-0.801-2.614-0.996   s0.28-0.709,0.15-0.722c-0.13-0.012-1.204,0.643-2.101,1.48c-0.896,0.837-2.993,1.763-3,1.658c-0.008-0.104-0.177-0.284-0.361-0.17   s-0.746,0.803-0.892,1.026c-0.146,0.223-0.745,1.115-1.119,1.525c-0.373,0.411-2.23,2.098-2.912,2.786   c-0.683,0.688-2.835,3.095-3.395,3.719c-0.56,0.624-1.66,1.518-1.588,1.346c0.071-0.171,0.632-1.056,1.083-1.585   c0.451-0.53,1.494-1.661,1.774-1.965c0.281-0.305,1.589-1.819,1.997-2.296c0.409-0.477,1.446-1.814,1.419-1.936   c-0.026-0.121-0.463-0.27-0.913-0.068c-0.45,0.202-1.037,0.041-0.936-0.234s0.281-1.224,0.144-1.412   c-0.137-0.188-0.397-0.74-0.291-0.827c0.106-0.087,0.437-0.438,0.495-0.588s0.004-0.334-0.034-0.358s0.257-0.649,0.739-1.336   c0.482-0.687,1.936-1.902,2.426-2.113c0.49-0.21,1.743-0.985,2.085-1.323c0.342-0.339,0.295-0.822,0.167-0.828   c-0.128-0.006-0.832,0.244-1.037,0.333c-0.206,0.089-0.63,0.036-0.688-0.233c-0.058-0.27,0.887-1.727,1.285-1.958   s1.47-0.967,1.665-1.006s0.679-0.042,0.634,0.077c-0.045,0.119-0.071,0.491-0.006,0.541c0.065,0.05,0.953-0.467,1.206-0.72   s0.351-0.583,0.281-0.607s-0.192-0.217-0.119-0.377c0.073-0.16,0.538-0.987,0.708-1.211c0.169-0.225,1.021-0.689,1.365-0.828   s2.319-0.88,2.89-1.087s1.666-0.606,1.893-0.655c0.227-0.049,1.383-0.334,2.062-0.529c0.679-0.195,1.864-0.279,2.213-0.251   c0.349,0.029,1.977,0.162,2.521,0.208c0.544,0.046,2.54,0.227,2.843,0.232c0.304,0.005,1.541,0.266,1.876,0.351   c0.336,0.086,1.155,0.105,1.501,0.024c0.346-0.082,2.393-0.632,3-0.762c0.607-0.131,2.021-0.153,2.325-0.208   c0.304-0.055,1.099-0.15,1.096-0.097c-0.003,0.053,0.354,0.276,0.8,0.369c0.446,0.093,3.109,1.056,3.81,1.269   c0.701,0.212,2.485,0.315,2.56,0.275c0.076-0.041-0.012-0.287-0.361-0.459c-0.35-0.172-0.901-0.664-0.848-0.732   c0.054-0.068,0.98-0.295,1.054-0.329c0.073-0.034,0.016-0.246-0.286-0.398c-0.303-0.152-0.681-0.564-1.306-0.661   c-0.625-0.098-2.099,0.045-2.291-0.121c-0.192-0.166,0.327-0.525,0.829-0.729s1.981-0.476,2.033-0.534   c0.052-0.059,0.439-0.142,0.716-0.153s1.482-0.009,2.065,0.027c0.582,0.036,1.65,0.238,1.543,0.363   c-0.107,0.125-0.054,0.326,0.085,0.364s1.124,0.185,1.03,0.229c-0.093,0.044-0.028,0.224,0.357,0.293s1.301-0.023,1.721-0.149   c0.421-0.126,1.692-0.426,1.938-0.438c0.246-0.012,0.924,0.136,1.051,0.198c0.127,0.062-0.125,0.524-0.322,0.882   C72.079,7.562,71.776,8.845,72,9.07c0.225,0.225,0.771,0.86,0.581,0.85s-0.74,0.048-0.794,0.145   c-0.055,0.098-0.593,0.306-1.068,0.239c-0.477-0.067-1.899-0.17-2.091-0.028c-0.191,0.141,0.424,0.67,1.164,0.985   c0.74,0.314,3.101,0.549,3.327,0.431c0.228-0.118,0.559-0.49,0.613-0.59c0.054-0.1,0.571-0.512,1.017-0.735   c0.445-0.224,1.097-0.817,1.058-1.012s-0.494-1.091-0.41-1.149c0.085-0.058,0.174-0.473,0.012-0.797   c-0.162-0.325,0.769-1.04,0.939-1.029s0.703,0.081,0.806,0.128c0.103,0.047,0.481,0.166,0.585,0.192   c0.104,0.026,0.904,0.18,1.623,0.327c0.718,0.147,2.086,0.46,2.01,0.569c-0.075,0.108-0.535,0.292-0.721,0.316   s-1.155,0.041-1.41,0.088c-0.254,0.047-0.376,0.955-0.232,1.364c0.144,0.408,0.279,1.168,0.16,1.234   c-0.118,0.066-0.397,0.339-0.348,0.453s0.858,0.466,1.11,0.557s0.705,0.399,0.82,0.567c0.115,0.168,0.304,1.017,0.528,1.071   c0.224,0.054,0.818-0.31,0.959-0.453c0.142-0.143,0.441-0.51,0.508-0.598c0.065-0.087,0.249-0.309,0.297-0.37   c0.047-0.062-0.132-0.412-0.49-0.611c-0.357-0.2-1.418-0.482-1.451-0.585c-0.034-0.104-0.049-0.392,0.043-0.417   s0.197-0.233,0.035-0.407c-0.161-0.174-0.367-0.467-0.406-0.529c-0.04-0.062,0.039-0.421,0.389-0.618   c0.349-0.196,1.245-0.544,1.648-0.619c0.404-0.075,1.786,0.248,1.819,0.313s0.542,0.286,1.06,0.341s2.197,0.799,2.634,1.128   c0.437,0.33,1.465,1.998,1.733,2.19c0.27,0.192,1.131,0.701,1.14,0.885s0.705,0.779,0.812,0.794   c0.107,0.015,0.597,0.359,0.855,0.729s0.67,1.717,0.582,1.751c-0.087,0.034-0.143,0.399,0.078,0.732   c0.22,0.333,0.849,0.717,0.898,0.964c0.049,0.247,0.802,1.397,0.903,1.443s0.227,0.438,0.056,0.765   c-0.171,0.327-0.579,0.982-0.686,0.964c-0.105-0.018-0.65-0.727-0.804-0.943s-0.487-0.451-0.622-0.474s-0.216,0.38,0.122,0.947   c0.338,0.566,0.828,1.716,0.771,2.068c-0.057,0.353-1.132,0.663-1.18,0.706c-0.048,0.042-0.35,0.004-0.566-0.181   s-1.167-1.278-1.446-1.586s-1.194-1.041-1.584-1.38c-0.39-0.338-1.092-1.025-1.428-0.878s-1.432-0.83-1.46-0.975   c-0.028-0.145,0.013-0.542,0.155-0.567c0.144-0.025,1.095,0.134,1.252,0.277c0.157,0.144,0.682,0.306,0.823,0.035   c0.142-0.271,0.467-0.795,0.637-0.955s0.603-0.794,0.595-1.075c-0.008-0.281-0.928-1.371-1.272-1.69s-1.215-1.172-1.204-1.234   c0.01-0.063-0.12-0.228-0.315-0.23c-0.195-0.003-0.944-0.325-1.024-0.385c-0.081-0.06-0.405-0.256-0.545-0.305   s-0.54-0.035-0.627-0.009c-0.086,0.026-0.086,0.279-0.031,0.463s0.103,0.723-0.014,0.768c-0.115,0.045-0.359,0.587-0.281,1.099   c0.079,0.511-0.583,0.983-1.062,0.902c-0.479-0.081-1.723-0.138-1.789,0.014c-0.065,0.153,0.604,0.859,0.832,1.062   c0.228,0.203,0.829,0.816,1.287,1.113c0.459,0.297,1.041,0.747,0.951,0.816s-0.264,0.309-0.182,0.38   c0.083,0.072,0.087,0.224-0.174,0.179s-1.569-0.605-1.941-0.716c-0.372-0.111-1.118,0.269-1.27,0.25   c-0.152-0.019-0.506-0.417-0.445-0.843s0.833-1.616,0.779-1.703c-0.055-0.088-0.512-0.255-0.896-0.181   c-0.384,0.074-1.882,0.902-2.283,1.154s-1.045,0.653-1.103,0.794c-0.059,0.141-0.754,0.779-1.418,1.098s-2.024,1.606-2.189,2.052   c-0.164,0.446-0.524,1.86-0.419,2.103c0.105,0.243,0.396,1.034,0.41,1.209c0.014,0.174,0.447,0.785,0.931,0.963   c0.482,0.178,2.186,1.227,2.989,1.813c0.804,0.586,2.957,2.396,3.042,2.66c0.086,0.264,0.392,2.4,0.529,2.872   s1.148,0.801,1.338,0.669c0.19-0.133,0.42-1.645,0.438-2.102c0.019-0.456,0.431-1.434,0.95-1.836   c0.519-0.402,1.894-1.798,1.866-2.183c-0.027-0.384-1.216-1.496-1.238-1.667s0.152-0.776,0.435-0.966s0.695-0.985,0.633-1.523   c-0.062-0.538-0.039-2.047,0.094-2.138c0.132-0.09,1.283,0.271,1.668,0.432s1.529,0.859,1.771,1.248s0.796,0.877,0.921,0.877   s0.57,0.133,0.719,0.293c0.147,0.16,0.372,1.087,0.175,1.7c-0.197,0.614,0.662,1.702,1.128,1.805   c0.465,0.103,1.316-1.061,1.336-1.376c0.019-0.316,0.39-0.117,0.567,0.358c0.178,0.475,1,3.531,1.325,4.427   c0.326,0.896,1.644,2.559,1.676,2.933s0.667,2.401,0.758,3.216c0.09,0.815,0.452,2.548,0.602,2.703   c0.149,0.155,0.779,0.823,0.834,1.257s0.071,1.673-0.078,1.781c-0.148,0.107-0.267,0.496-0.296,0.38s-0.213-0.47-0.338-0.527   s-0.636-0.042-0.62-0.146c0.017-0.104-0.056-0.542-0.195-0.745s-0.85-0.535-1.07-0.607s-0.444-0.76-0.12-1.276   c0.324-0.517,1.094-1.956,1.087-2.027c-0.006-0.071-0.051-0.324-0.081-0.403s-0.508-0.125-0.988,0.077   c-0.48,0.201-2.045,0.735-2.247,0.646c-0.202-0.089-1.578-0.767-1.977-0.885s-0.724,0.582-0.498,0.75   c0.227,0.168,0.975,0.63,1.079,0.761c0.104,0.131,0.282,0.554,0.165,0.646c-0.116,0.093-0.287,0.489-0.116,0.669   c0.171,0.179,1.005,0.843,1.274,1.042c0.27,0.199,1.104,1.045,1.188,1.419c0.082,0.374-0.379,0.853-0.783,0.939   c-0.403,0.086-1.746,0.544-2.006,0.793s-0.996,0.052-1.33-0.223c-0.333-0.275-2.114-0.449-2.357-0.253   c-0.244,0.195-0.771,1.308-0.884,1.665s-0.533,1.24-0.801,1.229s-1.279,0.232-1.642,0.561s-1.445,2.167-1.733,2.751   s-0.98,2.459-1.011,2.991c-0.029,0.531-0.853,1.796-1.469,2.215c-0.615,0.418-2.251,1.567-2.669,1.912s-1.59,1.945-1.813,2.402   c-0.225,0.457,0.597,2.588,1.416,4.146c0,0,0,0,0,1.331c0,0.337,0,0.337,0,0.337c-0.068,0.3-0.208,0.617-0.309,0.705   s-0.896-0.224-1.17-0.526c-0.272-0.303-1.186-1.584-1.416-2.171c-0.23-0.586-1.058-2.198-1.314-2.275   c-0.258-0.077-0.98-0.395-1.193-0.522s-1.667-0.516-2.598-0.277c-0.932,0.239-2.504,1.727-3.501,1.646s-3.406,0.107-4.268,0.351   c-0.862,0.243-3.037,3.576-3.735,5.662c0,0-0.346,1.032-0.346,2.229c0,0.509,0,0.509,0,0.509c0,0.566,0.141,1.318,0.312,1.671   s0.705,1.447,0.964,1.723s2.382,0.783,3.081,0.83s2.497-0.503,2.691-0.7c0.194-0.198,0.885-1.546,1.093-1.923   s1.006-0.855,1.235-0.918c0.229-0.062,0.969-0.29,1.211-0.366c0.242-0.075,1.15-0.167,1.173,0.062s-0.413,2.034-0.536,2.531   c-0.124,0.496-1.245,1.94-1.418,2.508c-0.172,0.567,1.618,1.366,2.283,1.309s2.511-0.152,2.649-0.074   c0.139,0.079,0.378,0.947,0.224,1.754c-0.155,0.806-0.174,2.649-0.021,3.103c0.151,0.453,2.018,0.96,2.745,0.699   s2.476-0.356,2.907-0.282c0.432,0.075,1.864-0.559,2.795-1.356c0.932-0.798,2.71-2.553,3.176-2.444   c0.466,0.109,2.832,0.324,2.9,0.481s0.612,0.506,1.057,0.429c0.445-0.077,1.982-0.416,2.482-0.574   c0.501-0.159,1.537-0.552,1.577-0.721c0.04-0.17,0.25-0.542,0.38-0.449c0.13,0.094,0.145,0.81,0.127,1.034   c-0.019,0.225,0.399,1.075,0.81,1.562s1.493,1.227,1.806,1.304c0.312,0.076,1.554-0.01,1.862,0.125s1.281,1.809,1.278,2.123   c-0.004,0.314,0.416,1.177,0.941,1.222c0.526,0.045,1.271,0.421,1.383,0.366c0.111-0.054,0.6-0.566,0.719-0.701   c0.12-0.136,0.366-0.107,0.459-0.035C102.896,84.694,102.973,85.905,102.949,86.24z M93.49,73.909   c-0.011,0.329-0.119,0.448-0.241,0.264s-0.337-0.845-0.201-1.053C93.184,72.913,93.501,73.579,93.49,73.909z M90.076,72.218   c-0.396,0.138-1.197,0.202-0.857-0.162c0.341-0.364,1.287-0.409,1.391-0.295S90.474,72.08,90.076,72.218z M79.55,71.355   c-0.219-0.07-1.31-0.951-1.644-1.22c-0.333-0.269-1.74-0.679-2.52-0.757s-2.627,0.117-2.012-0.345   c0.615-0.463,3.881-0.825,4.42-0.593s2.432,0.997,3.039,1.192s2.167,1.056,2.164,1.234s-0.457,0.368-1.01,0.422   C81.435,71.344,79.769,71.426,79.55,71.355z M80.527,73.434c-0.058,0.163-0.652,0.568-0.842,0.655   c-0.189,0.086-0.571,0.033-0.656-0.138c-0.086-0.171,0.621-0.715,0.971-0.75C80.349,73.166,80.586,73.271,80.527,73.434z    M79.275,63.851c0.482-0.031,0.963-0.062,1.438-0.093C79.919,64.142,79.434,64.174,79.275,63.851z M79.75,66.8   c-0.002,0.408-0.074,0.488-0.161,0.177s-0.244-1.216-0.155-1.312C79.522,65.568,79.752,66.391,79.75,66.8z M81.453,65.728   c0.407,0.265,1.005,1.452,1.045,1.766c0.039,0.312-0.204,0.147-0.541-0.366C81.619,66.613,81.045,65.463,81.453,65.728z    M82.911,72.054c0.352-0.503,4.476-0.939,4.69-0.51c0.215,0.431-0.255,0.893-1.043,1.027c-0.788,0.134-2.051,0.6-2.629,0.62   S82.56,72.558,82.911,72.054z M103.025,83.868c-0.006,0.087-0.034-0.007-0.047-0.07c-0.012-0.062-0.016-0.183-0.009-0.268   s0.052-0.15,0.059-0.09C103.035,83.502,103.03,83.781,103.025,83.868z"/><path d="M77.699,41.569c0.05,0.171,0.26,0.798,0.357,1.013c0.097,0.214,0.488,0.644,0.656,0.473s0.596-0.79,0.587-1.002   c-0.009-0.213,0.301-0.989,0.425-1.071c0.125-0.082,0.084-0.221-0.092-0.309c-0.175-0.088-0.819-0.356-1.039-0.402   c-0.221-0.046-0.871-0.133-0.957-0.092c-0.086,0.042-0.27,0.291-0.217,0.46C77.472,40.809,77.648,41.398,77.699,41.569z"/><path d="M57.341,12.109c-0.083-0.006-0.461-0.144-0.664-0.219c-0.204-0.075-0.8-0.296-0.88-0.333s-0.424-0.086-0.588-0.027   c-0.164,0.058-0.533,0.245-0.454,0.282s0.318,0.246,0.354,0.379c0.036,0.133,0.267,0.481,0.431,0.467   c0.165-0.014,1.251-0.104,1.499-0.123c0.247-0.019,0.483-0.085,0.524-0.146C57.604,12.327,57.423,12.115,57.341,12.109z"/></g></svg></span>';
                            }
                            date.innerHTML = itemData.date ? this.timeAgo(itemData.date) : item.type == 'sponsored' ? 'Sponsored' : '&nbsp;';
                        }
                    }
                }

                var provider = item.element.querySelector('.rev-provider');
                if (provider) {
                    if (item.type == 'sponsored') {
                        provider.innerHTML = itemData.brand ? itemData.brand : this.extractRootDomain(itemData.target_url);
                    } else if (item.type == 'internal') {
                        provider.innerHTML = itemData.author ? itemData.author : authors[Math.floor(Math.random() * authors.length)];
                    }
                }

                var commentButton = item.element.querySelector('.rev-reaction-comment');

                if (commentButton) {
                    commentButton.setAttribute('href', itemData.target_url + commentButton.getAttribute('href'));
                }

                if (itemData.comments && itemData.comments.length) {

                    var commentsElement = document.createElement('div');
                    revUtils.addClass(commentsElement, 'rev-comments');
                    revUtils.addClass(commentsElement, 'rev-has-comments');

                    var commentHtml = '';

                    var comment = itemData.comments[0];

                    commentHtml += '<div class="rev-comment">' +
                            '<div class="rev-comment-image" style="background-image:url('+ (comment.comment_author_img) +')"></div>' +
                            '<div class="rev-comment-text">' +
                                '<span class="rev-comment-author">' + (comment.comment_author) + '</span>' +
                                ' · ' +
                                '<span class="rev-comment-date">' + this.timeAgo(itemData.comment_time, true) + '</span>  ' + comment.comment +
                            '</div>' +
                        '</div>' +
                        '</div>';

                    commentsElement.innerHTML = commentHtml;

                    item.element.querySelector('.rev-content-inner').appendChild(commentsElement);
                }

                if (item.reactions) {
		    var reactionHtml = '';

                    var reactionCountTotal = 0;
                    var reactionCountTotalPos = 0;
                    var reactionCountTotalNeg = 0;
                    var zIndex = 100;

                    var positiveReactions = this.options.reactions.slice(0, 3);
                    var negativeReactions = this.options.reactions.slice(3)

                    for (var reactionCounter = 0; reactionCounter < this.options.reactions.length; reactionCounter++) {

                        // console.log('here');
                        var reaction = this.options.reactions[reactionCounter];
			var reactionCount = 0;
			if (itemData.hasOwnProperty("reactions")) {
                            reactionCount = itemData.reactions[reaction];
			}

                        // console.log(reactionCounter);
                        if (reactionCount) {
                            if (reactionCounter < 3) {
                                reactionCountTotalPos += reactionCount;
                            } else {
                                reactionCountTotalNeg += reactionCount;
                            }

                            reactionCountTotal += reactionCount;
                            reactionHtml += '<div style="z-index:'+ zIndex +';" class="rev-reaction rev-reaction-' + reaction + '">' +
                                '<div class="rev-reaction-inner">' +
                                '<div class="rev-reaction-icon rev-reaction-icon-' + reaction + '-full"></div>' +
                                '</div>' +
                                '</div>';
                            zIndex--;
                        }
                    }
                    item.reactionCountTotalPos = reactionCountTotalPos;
                    item.reactionCountTotalNeg = reactionCountTotalNeg;
                    item.reactionCountTotal = reactionCountTotal;

                    item.element.querySelector('.rev-reaction-menu-item-count-pos .rev-reaction-menu-item-count-inner').innerText = this.milliFormatter(reactionCountTotalPos);
                    item.element.querySelector('.rev-reaction-menu-item-count-neg .rev-reaction-menu-item-count-inner').innerText = this.milliFormatter(reactionCountTotalNeg);

                    reactionHtml += '<div ' + (!reactionCountTotal ? 'style="margin-left: 0;"' : '') + ' class="rev-reaction-count">'+ (reactionCountTotal ? reactionCountTotal : 'Be the first to react') +'</div>';

                    item.element.querySelector('.rev-reactions-total-inner').innerHTML = reactionHtml;
                }
            }
        }

        if (this.grid.perRow > 1) { // relayout if not single column
            this.grid.layout();
        }


        if (this.removeItems.length) {
            this.emitter.emitEvent('removedItems', [this.removeItems]);
        }
    };

    RevSlider.prototype.updateAuthElements = function() {
        var authBoxes = document.querySelectorAll('.rev-auth-box');
        if (this.authenticated) {
            for (var i = 0; i < authBoxes.length; i++) {
                authBoxes[i].querySelector('.rev-auth-headline').innerText = 'Currently logged in!';
                authBoxes[i].querySelector('.rev-auth-button-text').innerText = 'Log out';
            }
        } else {
            for (var i = 0; i < authBoxes.length; i++) {
                authBoxes[i].querySelector('.rev-auth-headline').innerHTML = 'Almost Done! Login to save your reaction <br /> <strong>and</strong> personalize your experience';
                authBoxes[i].querySelector('.rev-auth-button-text').innerText = 'Continue with facebook';
            }
        }
    };

    RevSlider.prototype.closePersonalizedTransition = function(ev) {
        document.body.style.overflow = this.bodyOverflow;
        revUtils.removeClass(document.body, 'rev-blur');
        document.body.removeChild(this.personalizedMask);
        document.body.removeChild(this.personalizedContent);
        this.grid.bindResize();
        revUtils.removeEventListener(this.personalizedMask, revDetect.mobile() ? 'touchstart' : 'click', this.closePersonalizedTransitionMaskCb);
        ev.stopPropagation();
        ev.preventDefault();
    };

    RevSlider.prototype.showPersonalizedTransition = function() {

        var that = this;
        var show = function() {
            revUtils.addClass(document.body, 'rev-blur');
            that.grid.unbindResize();
            document.body.style.overflow = 'hidden';
            revUtils.addClass(document.body, 'rev-blur');
            document.body.appendChild(that.personalizedMask);
            document.body.appendChild(that.personalizedContent);

            that.closePersonalizedTransitionMaskCb = function(ev) {
                that.closePersonalizedTransition(ev);
            }
            revUtils.addEventListener(that.personalizedMask, revDetect.mobile() ? 'touchstart' : 'click', that.closePersonalizedTransitionMaskCb, {passive: false});
        }

        if (this.personalizedMask) {
            show();
            return;
        }

        this.bodyOverflow = revUtils.getComputedStyle(document.body, 'overflow');

        this.personalizedMask = document.createElement('div');
        this.personalizedMask.id = 'personalized-transition-mask';

        this.personalizedContent = document.createElement('div')
        this.personalizedContent.id = 'personalized-transition-wrapper';

        this.personalizedContent.innerHTML = '<div id="personalized-transition-animation"></div><div id="personalized-transition-text">Gathering personalized content...</div>';

        show();
    };

    RevSlider.prototype.fetchInterestsData = function(){
      // MOCK Data -- Replace with proper DB/service fetch
      // Return an array of Interest Objects.
      var interests = [];
      interests[0] = { id: 100, people: 1043201, title: "Technology", lightMode: false, slug: "technology", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/technology.png', subscribed: true, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[1] = { id: 200, people: 1235111, title: "Advertising", lightMode: true, slug: "advertising",image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/advertising.png', subscribed: true, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[2] = { id: 300, people: 2599710, title: "Ethereum", lightMode: false, slug: "ethereum", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/ethereum.png', subscribed: true, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[3] = { id: 400, people: 2599710, title: "Bitcoin Cash", lightMode: false, slug: "bch", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/bch.png', subscribed: true, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[4] = { id: 500, people: 3211233, title: "Cryptocurrency", lightMode: false, slug: "cryptocurrency", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/cryptocurrency.png', subscribed: true, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[5] = { id: 600, people: 4211233, title: "Aerospace Engineering", lightMode: false, slug: "aerospace-engineering", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/aerospace-engineering.png', subscribed: true, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[6] = { id: 700, people: 5211233, title: "Content Delivery", lightMode: false, slug: "cdn", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/cdn.png', subscribed: true, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[7] = { id: 800, people: 6898300, title: "Literature", lightMode: false, slug: "literature", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/literature.png', subscribed: false, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[8] = { id: 900, people: 2599710, title: "Basketball", lightMode: false, slug: "basketball", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/basketball.png', subscribed: false, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[9] = { id: 1000, people: 5211233, title: "Data Science", lightMode: false, slug: "data-science", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/data-science.png', subscribed: false, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};
      interests[10] = { id: 1001, people: 6079282, title: "Digital Arts", lightMode: false, slug: "digital-arts", image: 'http://labs.e2-fx.com/showcase/revcontent-api-showcase-feed-1.0/img/interests/digital-arts.png', subscribed: false, taxonomy: '/full/interest/taxonomy', description: '', icon: ''};


      //this.interests.list = interests;

      return interests;
    };

    RevSlider.prototype.subscribeToInterest = function(interestId){
        if(this.interests.subscribed_ids[interestId] == undefined) {
            this.interests.subscribed.push(this.interests.list[interestId]);
            this.interests.subscribed_ids.push(interestId);
            return interestId;
        } else {
            return false;
        }
    };

    RevSlider.prototype.unsubscribeFromInterest = function(interestId){
        if(this.interests.subscribed_ids[interestId] !== undefined) {
            var revised_interests = [];
            var revised_ids = [];
            for(var i=0;i<this.interests.subscribed;i++){
                if(this.interests.subscribed[i].id !== interestId){
                    revised_interests.push(this.interests.subscribed[i]);
                    revised_ids.push(this.interests.subscribed[i].id);
                }
            }
            this.interests.subscribed = revised_interests;
            this.interests.subscribed_ids = revised_ids;
            return interestId;
        } else {
            return false;
        }
    };

    RevSlider.prototype.appendInterestsCarousel = function (grid) {
        var that = this;
        this.interestsCarouselVisible = true;
        var interest_cells = '';
        var interests_data = this.fetchInterestsData();
        var interests_count = interests_data.length;
        for(var i=0;i<interests_count;i++){
            var interest = interests_data[i];
            var the_cell = '' +
            // Interest Image should be stored as CSS by slug/name ID interest-' + interest.slug.toLowerCase() + '
            // $image property in interest object could be used as override if non-empty.
            '<div style="' + (interest.image != '' ? 'background:transparent url(' + interest.image + ') top left no-repeat;background-size:cover;' : '') + '" class="carousel-cell interest-cell interest-' + interest.slug.toLowerCase() + ' selected-interest" data-people="' + interest.people + '" data-title="' + interest.title + '" data-interest="' + interest.slug.toLowerCase() + '">' +
                '<div class="cell-wrapper">' +
                    '<span class="selector ' + (interest.subscribed ? 'subscribed' : '') + '"></span>' +
                    '<div class="interest-title ' + (interest.lightMode ? ' light-mode' : '') + '">' + interest.title + '</div>' +
                '</div>' +
            '</div>';
            interest_cells += the_cell;
        }

        var interestsCarousel = document.createElement('div');
        interestsCarousel.className = 'rev-content';
        interestsCarousel.innerHTML = '<div><h1 style="font-size:17px;padding-left:9px">Content You Love' +
            '<small style="font-size:12px;font-weight:normal;padding-left:15px;color:#777777"><sup>SIMILAR TOPICS</sup></small>' +
            '</h1>' +
            '<div id="rev-feed-interests" class="feed-interests-carousel">' +

                interest_cells +

            '</div>' +
            '</div>';

        grid.element.appendChild(interestsCarousel);

        var interestsCarouselItemArr = grid.addItems([interestsCarousel]);

        grid.layoutItems(interestsCarouselItemArr, true);

        var carousel = interestsCarousel.querySelector('.feed-interests-carousel');

        var interests_flick = new Flickity( carousel, {
            wrapAround: false,
            prevNextButtons: false,
            pageDots: false,
            adaptiveHeight: true,
            freeScroll: true,
            selectedAttraction: 0.15,
            freeScrollFriction: 0.03,
            initialIndex: 3
        });

        interests_flick.on( 'staticClick', function( event, pointer, cellElement, cellIndex ) {
            var target = event.target || event.srcElement;
            if ( !cellElement ) {
                return;
            }
            if(target.classList.contains('selector')) {
                if (cellElement.classList.contains('selected-interest')) {
                    cellElement.classList.remove('selected-interest');
                    cellElement.querySelectorAll('span.selector')[0].classList.remove('subscribed');
                    // this.unsubscribeFromInterest();
                    that.notify('Topic removed from your feed.', {label: 'continue', link: '#'});
                } else {
                    cellElement.classList.add('selected-interest');
                    cellElement.querySelectorAll('span.selector')[0].classList.add('subscribed');
                    // this.subscribeToInterest();
                    that.notify('Topic added, new content available.', {label: 'continue', link: '#'});
                }
            }

            if(target.classList.contains('cell-wrapper')){
                // Load an Explore Panel in "TOPIC" mode to show articles in that interest category...
                // this.swipeToPanel('trending', target.getAttribute('data-slug'));
            }

        });

        interests_flick.on( 'dragStart', function( event, pointer ) {
            carousel.classList.add('is-dragging');
        });

        interests_flick.on( 'dragEnd', function( event, pointer ) {
            carousel.classList.remove('is-dragging');
        });


    };

    RevSlider.prototype.appendExplorePanel = function(grid){
        var explorePanel = document.createElement('div');
        explorePanel.id = 'revfeed-explore';
        explorePanel.classList.add('revfeed-explore');
        explorePanel.classList.add('revfeed-explore-panel');
        explorePanel.classList.add('revfeed-explore-panel--docked');
        explorePanel.innerHTML = '<div id="revfeed-explore-wrapper" class="revfeed-explore-wrapper">' +
            '<div><div style="line-height:32px;height:32px;border-bottom:1.0px solid #dddddd;padding:0 12px">' +
            '<strong style="font-family:Montserrat;letter-spacing:1px;color:#222222">EXPLORE &nbsp;<small style="color:#00a8ff">FEED</small></strong>' +
            '</div></div>' +
            '<div style="display:block;height:50vw;overflow:hidden;margin-bottom:2px">' +
            '<div style="display:block;float:left;width:33vw;height:100%;"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=1) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:34vw;height:100%"><div style="display:block;width:100%;height:100%;border-left:2px solid #ffffff;border-right:2px solid #ffffff;background:transparent url(http://placehold.it/106x200?text=2) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:33vw;height:100%"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=3) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="clear:both"></div>' +
            '</div>' +
            '<div style="display:block;height:50vw;overflow:hidden;margin-bottom:2px">' +
            '<div style="display:block;float:left;width:34vw;height:100%"><div style="display:block;width:100%;height:100%;border-right:2px solid #ffffff;background:transparent url(http://placehold.it/106x200?text=4) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:66vw;height:100%"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=5) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="clear:both"></div>' +
            '</div>' +
            '<div style="display:block;height:50vw;overflow:hidden;margin-bottom:2px">' +
            '<div style="display:block;float:left;width:50vw;height:100%"><div style="display:block;width:100%;height:100%;border-right:2px solid #ffffff;background:transparent url(http://placehold.it/106x200?text=6) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:50vw;height:100%"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/212x200?text=7) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="clear:both"></div>' +
            '</div>' +
            '<div style="display:block;height:50vw;overflow:hidden;margin-bottom:2px">' +
            '<div style="display:block;float:left;width:33vw;height:100%;"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=1) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:34vw;height:100%"><div style="display:block;width:100%;height:100%;border-left:2px solid #ffffff;border-right:2px solid #ffffff;background:transparent url(http://placehold.it/106x200?text=2) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="display:block;float:left;width:33vw;height:100%"><div style="display:block;width:100%;height:100%;background:transparent url(http://placehold.it/106x200?text=3) top left no-repeat;background-repeat: no-repeat;background-size:cover;">&nbsp;</div></div>' +
            '<div style="clear:both"></div>' +
            '</div>' +

            '</div>';

        if (this.options.brand_logo) {
            var brandLogo = this.createBrandLogo('rev-header-logo');
            brandLogo.style.textAlign = 'center';
            brandLogo.style.display = 'block';
            brandLogo.style.height = '48px';
            brandLogo.style.lineHeight = '48px';
            brandLogo.style.paddingTop = '9px';
            explorePanel.insertAdjacentElement('afterbegin', brandLogo);
        }
        grid.element.prepend(explorePanel);
        var SwipeFeed = new Hammer.Manager(document.getElementById('grid'), {

        });
        var is_scrolling;
        SwipeFeed.add( new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 50 }) );
        window.addEventListener('scroll', function() {
            is_scrolling = true;
        }, { passive: true });
        window.addEventListener('touchend', function() {
            is_scrolling = false;
        });
        SwipeFeed.on("panleft", function(ev) {
            if (is_scrolling) {
                return;
            }
            top.location.href = '#revfeed-explore';
            explorePanel.classList.remove('revfeed-explore-panel--docked');
            explorePanel.classList.add('revfeed-explore-panel--visible');
            document.body.classList.add('revfeed-is-exploring');

        });
        SwipeFeed.on("panright", function(ev) {
            if (is_scrolling) {
                return;
            }
            explorePanel.classList.remove('revfeed-explore-panel--visible');
            explorePanel.classList.add('revfeed-explore-panel--docked');
            document.body.classList.remove('revfeed-is-exploring');
        });

        revUtils.addEventListener(grid.element, 'touchstart', function(e){
            if(document.body.classList.contains('revfeed-is-exploring')){
                //e.preventDefault();
                //e.stopPropagation();
            }
        }, {passive: false});
    };

    RevSlider.prototype.extractRootDomain = function(url) {
        if (!url) {
            return '';
        }
        var domain;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        }
        else {
            domain = url.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];
        //find & remove "?"
        domain = domain.split('?')[0];

        var splitArr = domain.split('.'),
            arrLen = splitArr.length;

        //extracting the root domain here
        if (arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        }
        return domain;
    };

    RevSlider.prototype.timeAgo = function(time, output) {
        var templates = {
            prefix: "",
            suffix: "",
            seconds: "less than a minute",
            minute: "about a minute",
            minutes: "%d minutes",
            hour: "1 hr",
            hours: "%d hrs",
            day: "yesterday",
            days: "%d days",
            month: "1 month",
            months: "%d months",
            year: "1 year",
            years: "%d years"
        };
        var template = function(t, n) {
            return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
        };

        // random hrs
        if (!time)
            return '';
        if (typeof time === 'string') {
            time = time.replace(/\.\d+/, ""); // remove milliseconds
            time = time.replace(/-/, "/").replace(/-/, "/");
            time = time.replace(/T/, " ").replace(/Z/, " UTC");
            time = time.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
        }

        time = new Date(time * 1000 || time);

        var now = new Date();
        var seconds = ((now.getTime() - time) * .001) >> 0;
        var minutes = seconds / 60;
        var hours = minutes / 60;
        var days = hours / 24;
        var years = days / 365;

        return templates.prefix + (
                seconds < 45 && template('seconds', seconds) ||
                seconds < 90 && template('minute', 1) ||
                minutes < 45 && template('minutes', minutes) ||
                minutes < 90 && template('hour', 1) ||
                hours < 24 && template('hours', hours) ||
                hours < 42 && template('day', 1) ||
                days < 30 && template('days', days) ||
                days < 45 && template('month', 1) ||
                days < 365 && template('months', days / 30) ||
                years < 1.5 && template('year', 1) ||
                template('years', years)
                ) + templates.suffix;
    };

    RevSlider.prototype.notify = function(message, action){
        if(!message){
            return;
        }
        var notice_panel = document.getElementById('rev-notify-panel');
        if(typeof notice_panel == 'object' && notice_panel != null){
            notice_panel.remove();
        }
        var notice = document.createElement('div');
        notice.id = 'rev-notify-panel';
        notice.classList.add('rev-notify');
        notice.classList.add('rev-notify-alert');
        notice.classList.add('rev-notify-alert--default');
        notice.innerHTML = '<p style="margin:0;padding:0"><a class="notice-action" href="' + (action.link || '#') + '" style="text-transform:uppercase;float:right;font-weight:bold;padding-left:8px;">' + action.label + '</a> ' + message + '</p>';
        notice.setAttribute('style',';position:fixed;top:-48px;left:0;z-index:15000;width:100%;height:32px;line-height:32px;font-size:10px;font-family:"Montserrat";padding:0 9px;background-color:rgba(0,0,0,0.7);color:#ffffff;');

        document.body.appendChild(notice);
        notice.style.top = 0;
        setTimeout(function() {
            document.getElementById('rev-notify-panel').style.top = '-48px';
            var notice_panel = document.getElementById('rev-notify-panel');
            if(typeof notice_panel == 'object' && notice_panel != null){
                notice_panel.remove();
            }
        }, 2000);
    };

    RevSlider.prototype.destroy = function() {
        this.grid.remove();
        this.grid.destroy();
        revUtils.remove(this.containerElement);
        if (this.mc) {
            this.mc.set({enable: false});
            this.mc.destroy();
        }

        if (typeof this.options.destroy === 'function') {
            this.options.destroy();
        }
    };

    return RevSlider;
}));

/*
Project: Feed
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.Feed = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var Feed = function(opts) {

        var defaults = {
            api_source: 'feed',
            host: 'https://trends.engage.im',
            url: 'https://trends.engage.im/api/v1/',
            devices: [
                'phone', 'tablet', 'desktop'
            ],
            overlay_icons: false, // pass in custom icons or overrides
            image_overlay: false, // pass key value object { content_type: icon }
            image_overlay_position: 'center', // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: false, // pass key value object { content_type: icon }
            ad_overlay_position: 'bottom_right', // center, top_left, top_right, bottom_right, bottom_left
            header: 'Feed',
            // per_row: {
            //     sm: 2,
            //     md: 3
            // },
            // rows: 3,
            buttons: {
                forward: false,
                back: false
            },
            multipliers: {
                line_height: 0,
                margin: 0,
                padding: 0
            },
            css: '',
            headline_size: 3,
            max_headline: false,
            disclosure_text: 'by Engage.IM',
            query_params: false,
            user_ip: false,
            user_agent: false,
            transition_duration_multiplier: 3,
            auto_scroll: true,
            rev_position: 'top_right',
            developer: false,
            per_row: 1,
            breakpoints: {
                xxs: 0,
                xs: 100,
                sm: 549,
                md: 550,
                lg: 700,
                xl: 1001,
                xxl: 1500
            },
            rows: 4,
            infinite: true,
            column_spans: [],
            image_ratio: '6:3',
            internal_selector: false, // dynamic based on internal, sponsored, initial_internal and initial_sponsored options
            headline_top_selector: false,
            // headline_icon_selector: '.rev-content:nth-child(4n+10), .rev-content:nth-child(4n+11)',
            // headline_icon_selector: '.rev-content',
            viewable_percentage: 50,
            buffer: 500,
            brand_logo: false,
            brand_logo_secondary: false,
            window_width_devices: [
                'phone'
            ],
            mock: false,
            comment_div: false,
            reaction_id: 299,
            mobile_image_optimize: false,
            trending_utm: false,
            keywords: false,
            disclosure_about_src: '//trends.engage.im/engage-about.php',
            disclosure_about_height: 463,
            disclosure_interest_src: '//trends.engage.im/engage-interests.php',
            disclosure_interest_height: 1066,
            internal: 2,
            sponsored: 1,
            initial_internal: 2,
            initial_sponsored: 1
        };

        if (opts.masonry_layout) {
            defaults.per_row = {
                xxs: 1,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 2,
                xl: 3,
                xxl: 3
            };
        }

        // merge options
        this.options = revUtils.extend(defaults, opts);

        if (!this.options.internal_selector) {

            this.options.internal_selector = '';

            if (this.options.initial_sponsored || this.options.sponsored) { // we have sponsored, determine what should be internal

                for (var i = 1; i <= this.options.initial_internal; i++) { // initial internal using nth-child
                    this.options.internal_selector += '.rev-content:nth-child('+ i +'),';
                }

                // internal starts up again
                var start = (this.options.initial_internal + this.options.initial_sponsored + 1);

                if (this.options.sponsored) { // pattern for sponsored based on internal
                    for (var i = 1; i <= this.options.internal; i++) {
                        this.options.internal_selector += '.rev-content:nth-child('+ (this.options.internal + this.options.sponsored) +'n + '+ start +'),';
                        start++;
                    }
                } else if (this.options.initial_sponsored) { // only inital sponsored so everything after start will be internal
                    this.options.internal_selector += '.rev-content:nth-child(n+'+ start +'),';
                }
                // trim comma
                this.options.internal_selector = this.options.internal_selector.slice(0, -1);
            } else { // everything is internal
                this.options.internal_selector = '.rev-content';
            }
        }

        // store options
        revUtils.storeUserOptions(this.options);

        // param errors
        if (revUtils.validateApiParams(this.options).length) {
            return;
        }
        // don't show for this device
        if (!revDetect.show(this.options.devices)) {
            return;
        }

        revUtils.appendStyle('/* inject:css */#rev-slider2,.feed-interests-carousel *{box-sizing:border-box}#rev-slider2 a,#rev-slider2 a:hover{text-shadow:none;text-decoration:none}.flickity-enabled{position:relative}.flickity-enabled:focus{outline:0}.flickity-viewport{overflow:hidden;position:relative;height:100%}.flickity-slider{position:absolute;width:100%;height:100%}.flickity-enabled.is-draggable{-webkit-tap-highlight-color:transparent;tap-highlight-color:transparent;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.flickity-enabled.is-draggable .flickity-viewport{cursor:move;cursor:grab}.flickity-enabled.is-draggable .flickity-viewport.is-pointer-down{cursor:grabbing}.flickity-prev-next-button{position:absolute;top:50%;width:44px;height:44px;border:none;border-radius:50%;background:#fff;background:rgba(255,255,255,.75);cursor:pointer;-webkit-transform:translateY(-50%);transform:translateY(-50%)}.flickity-prev-next-button:hover{background:#fff}.flickity-prev-next-button:focus{outline:0;box-shadow:0 0 0 5px #09F}.flickity-prev-next-button:active{opacity:.6}.flickity-prev-next-button.previous{left:10px}.flickity-prev-next-button.next{right:10px}.flickity-rtl .flickity-prev-next-button.previous{left:auto;right:10px}.flickity-rtl .flickity-prev-next-button.next{right:auto;left:10px}.flickity-prev-next-button:disabled{opacity:.3;cursor:auto}.flickity-prev-next-button svg{position:absolute;left:20%;top:20%;width:60%;height:60%}.flickity-prev-next-button .arrow{fill:#333}.flickity-page-dots{position:absolute;width:100%;bottom:-25px;padding:0;margin:0;list-style:none;text-align:center;line-height:1}.flickity-rtl .flickity-page-dots{direction:rtl}.flickity-page-dots .dot{display:inline-block;width:10px;height:10px;margin:0 8px;background:#333;border-radius:50%;opacity:.25;cursor:pointer}.flickity-page-dots .dot.is-selected{opacity:1}.waves-effect{position:relative;cursor:pointer;display:inline-block;overflow:hidden;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}.waves-effect .waves-ripple{position:absolute;border-radius:50%;width:100px;height:100px;margin-top:-50px;margin-left:-50px;opacity:0;background:rgba(0,0,0,.2);background:radial-gradient(rgba(0,0,0,.2) 0,rgba(0,0,0,.3) 40%,rgba(0,0,0,.4) 50%,rgba(0,0,0,.5) 60%,rgba(255,255,255,0) 70%);transition:all .5s ease-out;transition-property:-webkit-transform,opacity;transition-property:transform,opacity;-webkit-transform:scale(0) translate(0,0);transform:scale(0) translate(0,0);pointer-events:none}.waves-effect.waves-light .waves-ripple{background:rgba(255,255,255,.4);background:radial-gradient(rgba(255,255,255,.2) 0,rgba(255,255,255,.3) 40%,rgba(255,255,255,.4) 50%,rgba(255,255,255,.5) 60%,rgba(255,255,255,0) 70%)}.waves-effect.waves-classic .waves-ripple{background:rgba(0,0,0,.2)}.waves-effect.waves-classic.waves-light .waves-ripple{background:rgba(255,255,255,.4)}.waves-notransition{transition:none!important}.waves-button,.waves-circle{-webkit-transform:translateZ(0);transform:translateZ(0);-webkit-mask-image:-webkit-radial-gradient(circle,#fff 100%,#000 100%)}.waves-button,.waves-button-input,.waves-button:hover,.waves-button:visited{white-space:nowrap;vertical-align:middle;cursor:pointer;border:none;outline:0;color:inherit;background-color:transparent;font-size:1em;line-height:1em;text-align:center;text-decoration:none;z-index:1}.waves-button{padding:.85em 1.1em;border-radius:.2em}.waves-button-input{margin:0;padding:.85em 1.1em}.waves-input-wrapper{border-radius:.2em;vertical-align:bottom}.waves-input-wrapper.waves-button{padding:0}.waves-input-wrapper .waves-button-input{position:relative;top:0;left:0;z-index:1}.waves-circle{text-align:center;width:2.5em;height:2.5em;line-height:2.5em;border-radius:50%}.waves-float{-webkit-mask-image:none;box-shadow:0 1px 1.5px 1px rgba(0,0,0,.12);transition:all .3s}.waves-float:active{box-shadow:0 8px 20px 1px rgba(0,0,0,.3)}.waves-block{display:block}@font-face{font-family:Montserrat;font-style:normal;font-weight:400;src:local("Montserrat Regular"),local("Montserrat-Regular"),url(https://fonts.gstatic.com/s/montserrat/v10/SKK6Nusyv8QPNMtI4j9J2wsYbbCjybiHxArTLjt7FRU.woff2) format("woff2");unicode-range:U+0102-0103,U+1EA0-1EF9,U+20AB}@font-face{font-family:Montserrat;font-style:normal;font-weight:400;src:local("Montserrat Regular"),local("Montserrat-Regular"),url(https://fonts.gstatic.com/s/montserrat/v10/gFXtEMCp1m_YzxsBpKl68gsYbbCjybiHxArTLjt7FRU.woff2) format("woff2");unicode-range:U+0100-024F,U+1E00-1EFF,U+20A0-20AB,U+20AD-20CF,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Montserrat;font-style:normal;font-weight:400;src:local("Montserrat Regular"),local("Montserrat-Regular"),url(https://fonts.gstatic.com/s/montserrat/v10/zhcz-_WihjSQC0oHJ9TCYAzyDMXhdD8sAj6OAJTFsBI.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2212,U+2215}@font-face{font-family:Montserrat;font-style:normal;font-weight:500;src:local("Montserrat Medium"),local("Montserrat-Medium"),url(https://fonts.gstatic.com/s/montserrat/v10/BYPM-GE291ZjIXBWrtCweiyNCiQPWMSUbZmR9GEZ2io.woff2) format("woff2");unicode-range:U+0102-0103,U+1EA0-1EF9,U+20AB}@font-face{font-family:Montserrat;font-style:normal;font-weight:500;src:local("Montserrat Medium"),local("Montserrat-Medium"),url(https://fonts.gstatic.com/s/montserrat/v10/BYPM-GE291ZjIXBWrtCwevfgCb1svrO3-Ym-Rpjvnho.woff2) format("woff2");unicode-range:U+0100-024F,U+1E00-1EFF,U+20A0-20AB,U+20AD-20CF,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Montserrat;font-style:normal;font-weight:500;src:local("Montserrat Medium"),local("Montserrat-Medium"),url(https://fonts.gstatic.com/s/montserrat/v10/BYPM-GE291ZjIXBWrtCweteM9fzAXBk846EtUMhet0E.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2212,U+2215}@font-face{font-family:Montserrat;font-style:normal;font-weight:600;src:local("Montserrat SemiBold"),local("Montserrat-SemiBold"),url(https://fonts.gstatic.com/s/montserrat/v10/q2OIMsAtXEkOulLQVdSl053YFo3oYz9Qj7-_6Ux-KkY.woff2) format("woff2");unicode-range:U+0102-0103,U+1EA0-1EF9,U+20AB}@font-face{font-family:Montserrat;font-style:normal;font-weight:600;src:local("Montserrat SemiBold"),local("Montserrat-SemiBold"),url(https://fonts.gstatic.com/s/montserrat/v10/q2OIMsAtXEkOulLQVdSl02tASdhiysHpWmctaYEsrdw.woff2) format("woff2");unicode-range:U+0100-024F,U+1E00-1EFF,U+20A0-20AB,U+20AD-20CF,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Montserrat;font-style:normal;font-weight:600;src:local("Montserrat SemiBold"),local("Montserrat-SemiBold"),url(https://fonts.gstatic.com/s/montserrat/v10/q2OIMsAtXEkOulLQVdSl03XcDWh-RbO457623Zi1kyw.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2212,U+2215}@font-face{font-family:Montserrat;font-style:normal;font-weight:700;src:local("Montserrat Bold"),local("Montserrat-Bold"),url(https://fonts.gstatic.com/s/montserrat/v10/IQHow_FEYlDC4Gzy_m8fcnv4bDVR720piddN5sbmjzs.woff2) format("woff2");unicode-range:U+0102-0103,U+1EA0-1EF9,U+20AB}@font-face{font-family:Montserrat;font-style:normal;font-weight:700;src:local("Montserrat Bold"),local("Montserrat-Bold"),url(https://fonts.gstatic.com/s/montserrat/v10/IQHow_FEYlDC4Gzy_m8fcjrEaqfC9P2pvLXik1Kbr9s.woff2) format("woff2");unicode-range:U+0100-024F,U+1E00-1EFF,U+20A0-20AB,U+20AD-20CF,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Montserrat;font-style:normal;font-weight:700;src:local("Montserrat Bold"),local("Montserrat-Bold"),url(https://fonts.gstatic.com/s/montserrat/v10/IQHow_FEYlDC4Gzy_m8fcmaVI6zN22yiurzcBKxPjFE.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2212,U+2215}@font-face{font-family:Montserrat;font-style:normal;font-weight:800;src:local("Montserrat ExtraBold"),local("Montserrat-ExtraBold"),url(https://fonts.gstatic.com/s/montserrat/v10/H8_7oktkjVeeX06kbAvc0DILJidW5jMaaXyfOecgwBY.woff2) format("woff2");unicode-range:U+0102-0103,U+1EA0-1EF9,U+20AB}@font-face{font-family:Montserrat;font-style:normal;font-weight:800;src:local("Montserrat ExtraBold"),local("Montserrat-ExtraBold"),url(https://fonts.gstatic.com/s/montserrat/v10/H8_7oktkjVeeX06kbAvc0E35xRr55vqc_g-KyS3KPQI.woff2) format("woff2");unicode-range:U+0100-024F,U+1E00-1EFF,U+20A0-20AB,U+20AD-20CF,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Montserrat;font-style:normal;font-weight:800;src:local("Montserrat ExtraBold"),local("Montserrat-ExtraBold"),url(https://fonts.gstatic.com/s/montserrat/v10/H8_7oktkjVeeX06kbAvc0GXcKQM3CJKNQg5O_z0AU2U.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2212,U+2215}@font-face{font-family:Montserrat;font-style:normal;font-weight:900;src:local("Montserrat Black"),local("Montserrat-Black"),url(https://fonts.gstatic.com/s/montserrat/v10/aEu-9ATAroJ1iN4zmQ55BqFJzo5GKYqmgW1FmO8t7jY.woff2) format("woff2");unicode-range:U+0102-0103,U+1EA0-1EF9,U+20AB}@font-face{font-family:Montserrat;font-style:normal;font-weight:900;src:local("Montserrat Black"),local("Montserrat-Black"),url(https://fonts.gstatic.com/s/montserrat/v10/aEu-9ATAroJ1iN4zmQ55BuQssvi-iD7OeGmZ-9cC-fk.woff2) format("woff2");unicode-range:U+0100-024F,U+1E00-1EFF,U+20A0-20AB,U+20AD-20CF,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Montserrat;font-style:normal;font-weight:900;src:local("Montserrat Black"),local("Montserrat-Black"),url(https://fonts.gstatic.com/s/montserrat/v10/aEu-9ATAroJ1iN4zmQ55Bi0ZNta1KZbpkb8Cqm6Z_co.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2212,U+2215}#rev-slider2{padding:0;width:100%;clear:both;position:relative}#rev-slider2.rev-slider-breakpoint-gt-xs .rev-content:nth-child(n+10),#rev-slider2.rev-slider-breakpoint-lt-sm .rev-content{padding-bottom:5px!important}#rev-slider2.rev-slider-mobile *{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}#rev-slider2.rev-slider-mobile .rev-reaction-menu-container{bottom:30px!important}#rev-slider2 *{user-drag:none;-webkit-user-drag:none;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;sx-font-smoothing:grayscale;box-sizing:border-box;font-family:Montserrat,"Helvetica Neue",Helvetica,Arial,sans-serif;position:relative}#rev-slider2 a{color:inherit}#rev-slider2 a:focus{text-decoration:none;outline:0}#rev-slider2 .rev-head{display:-webkit-box;display:flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;flex-direction:row;margin-bottom:10px;-webkit-box-align:baseline;align-items:baseline}#rev-slider2 .rev-head .rev-header{margin:0;line-height:16px;font-size:16px;font-weight:700;text-align:left;width:auto;letter-spacing:0;position:relative}#rev-slider2 .rev-head .rev-header-logo{background-size:contain;margin-right:6px}#rev-slider2 .rev-sponsored{line-height:12px;font-size:12px;font-weight:400;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}#rev-slider2 .rev-sponsored.top-right{margin-left:auto}#rev-slider2 .rev-sponsored a{color:#999;text-decoration:none;border-bottom:none}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-terms a:hover,#rev-slider2 .rev-content .rev-ad a:hover .rev-headline{text-decoration:underline}#rev-slider2 #rev-slider-container,#rev-slider2 #rev-slider-container #rev-slider-inner{width:100%;clear:both;position:relative}#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-transition-container{white-space:nowrap}#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-transition-container #rev-slider-grid-transition,#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-transition-container #rev-slider-next-grid-transition{transition:-webkit-transform;transition:transform;transition-timing-function:ease-in-out;white-space:normal;display:inline-block;width:100%}#rev-feed .rc-reaction-header,#rev-feed ul.rc-reaction-bar li .rc-reaction-name,#rev-slider2 .rev-content-header:last-child{display:none}#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-container{clear:both;position:relative;width:100%;transition:-webkit-transform;transition:transform;transition-timing-function:ease-in-out}#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-container #rev-slider-grid{padding:0}#rev-slider2 .rev-content-header{padding-bottom:0!important}#rev-slider2 .rev-content-header .rev-content-header-inner .rev-icon{line-height:0;float:left;margin:1px 5px 0 0}#rev-slider2 .rev-content-header .rev-content-header-inner .rev-icon svg{fill:#4cc93d}#rev-slider2 .rev-content-header .rev-content-header-inner h2{border-bottom:1px solid #e5e5e5;border-bottom-color:#e5e5e5;color:#90949c;line-height:15px;letter-spacing:.01em;margin-top:0;font-weight:400;margin-bottom:0;font-size:12px;padding-bottom:9px;padding-top:11px}#rev-slider2 .rev-content{text-align:left;transition-property:opacity;transition-duration:.5s;opacity:1;padding:4px 4px 5px!important;-webkit-perspective:1000px;perspective:1000px;z-index:1;font-weight:400}#rev-slider2 .rev-content.rev-content-row-0{padding-top:0!important}#rev-slider2 .rev-content.rev-content-breakpoint-lt-md .rev-auth .rev-auth-headline{font-size:18px;line-height:24px;margin-top:30px}#rev-slider2 .rev-content.rev-content-breakpoint-lt-md .rev-auth .rev-auth-site-logo{max-height:120px}#rev-slider2 .rev-content.rev-content-breakpoint-lt-md .rev-auth .rev-auth-button{margin-top:30px}#rev-slider2 .rev-content.rev-content-breakpoint-lt-md .rev-auth .rev-auth-terms{margin-top:40px}#rev-slider2 .rev-content a{border:none!important}#rev-slider2 .rev-content .rev-reaction-icon-comment{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDYwIDYwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA2MCA2MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPHBhdGggZD0iTTU1LjIzMiw0My4xMDRDNTguMzU0LDM4Ljc0Niw2MCwzMy43MDUsNjAsMjguNWMwLTE0Ljg4OC0xMy40NTgtMjctMzAtMjdTMCwxMy42MTIsMCwyOC41czEzLjQ1OCwyNywzMCwyNyAgIGM0LjI2MiwwLDguMzc4LTAuNzksMTIuMjQzLTIuMzQ4YzYuODA1LDMuOTI3LDE2LjIxMyw1LjI4MSwxNi42MTgsNS4zMzhjMC4wNDcsMC4wMDcsMC4wOTMsMC4wMSwwLjEzOSwwLjAxICAgYzAuMzc1LDAsMC43MjUtMC4yMTEsMC44OTUtMC41NTRjMC4xOTItMC4zODUsMC4xMTYtMC44NS0wLjE4OC0xLjE1M0M1Ny40MDcsNTQuNDkzLDU1LjgyMyw0OS42NDEsNTUuMjMyLDQzLjEwNHogTTQyLjgzOSw1MS4xODIgICBjLTAuMDAxLDAtMC4wMDEsMC0wLjAwMSwwYy0yLjExLTEuMzAzLTQuNDY2LTIuODE0LTUuMDE0LTMuMjQ5Yy0wLjI5Ny0wLjQzMy0wLjg4My0wLjU2My0xLjMzOC0wLjI5ICAgYy0wLjMsMC4xOC0wLjQ4OSwwLjUxMy0wLjQ5MSwwLjg2MWMtMC4wMDMsMC41ODksMC4wMDYsMC43Nyw0LjA4MSwzLjMxNkMzNi44NjUsNTIuOTMxLDMzLjQ4Nyw1My41LDMwLDUzLjUgICBjLTE1LjQzOSwwLTI4LTExLjIxNS0yOC0yNXMxMi41NjEtMjUsMjgtMjVzMjgsMTEuMjE1LDI4LDI1YzAsNC44OTctMS41OTEsOS42NDQtNC42MDEsMTMuNzI1ICAgYy0wLjE0NCwwLjE5NS0wLjIxMiwwLjQzNi0wLjE5MSwwLjY3N2MwLjM1LDQuMTc1LDEuMjM5LDkuNDkxLDMuNDQsMTMuMTYxQzUzLjMxNiw1NS4zODUsNDcuMzEsNTMuODgyLDQyLjgzOSw1MS4xODJ6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8cGF0aCBkPSJNMTYsMjQuNWMtMi4yMDYsMC00LDEuNzk0LTQsNHMxLjc5NCw0LDQsNHM0LTEuNzk0LDQtNFMxOC4yMDYsMjQuNSwxNiwyNC41eiBNMTYsMzAuNWMtMS4xMDMsMC0yLTAuODk3LTItMnMwLjg5Ny0yLDItMiAgIHMyLDAuODk3LDIsMlMxNy4xMDMsMzAuNSwxNiwzMC41eiIgZmlsbD0iIzAwMDAwMCIvPgoJPHBhdGggZD0iTTMwLDI0LjVjLTIuMjA2LDAtNCwxLjc5NC00LDRzMS43OTQsNCw0LDRzNC0xLjc5NCw0LTRTMzIuMjA2LDI0LjUsMzAsMjQuNXogTTMwLDMwLjVjLTEuMTAzLDAtMi0wLjg5Ny0yLTJzMC44OTctMiwyLTIgICBzMiwwLjg5NywyLDJTMzEuMTAzLDMwLjUsMzAsMzAuNXoiIGZpbGw9IiMwMDAwMDAiLz4KCTxwYXRoIGQ9Ik00NCwyNC41Yy0yLjIwNiwwLTQsMS43OTQtNCw0czEuNzk0LDQsNCw0czQtMS43OTQsNC00UzQ2LjIwNiwyNC41LDQ0LDI0LjV6IE00NCwzMC41Yy0xLjEwMywwLTItMC44OTctMi0yczAuODk3LTIsMi0yICAgczIsMC44OTcsMiwyUzQ1LjEwMywzMC41LDQ0LDMwLjV6IiBmaWxsPSIjMDAwMDAwIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reaction-icon-comment:hover{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU4IDU4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1OCA1ODsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzREQzk1QjsiIGQ9Ik0yOSwxLjVjMTYuMDE2LDAsMjksMTEuNjQxLDI5LDI2YzAsNS4yOTItMS43NjgsMTAuMjExLTQuNzk2LDE0LjMxOCAgIEM1My42MDIsNDYuNTYzLDU0Ljc0Niw1My4yNDYsNTgsNTYuNWMwLDAtOS45NDMtMS4zOTUtMTYuNjc3LTUuNDYyYy0wLjAwNywwLjAwMy0wLjAxNSwwLjAwNi0wLjAyMiwwLjAwOSAgIGMtMi43NjQtMS44MDEtNS41MzItMy42NTYtNi4xMDUtNC4xMjZjLTAuMy0wLjQyMS0wLjg3OS0wLjU0OC0xLjMzLTAuMjc3Yy0wLjI5NiwwLjE3OC0wLjQ4MywwLjUwMy0wLjQ4OSwwLjg0OCAgIGMtMC4wMSwwLjYyMiwwLjAwNSwwLjc4NCw1LjU4NSw0LjQyMUMzNS44NTQsNTIuOTMzLDMyLjUwMiw1My41LDI5LDUzLjVjLTE2LjAxNiwwLTI5LTExLjY0MS0yOS0yNkMwLDEzLjE0MSwxMi45ODQsMS41LDI5LDEuNXoiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSIxNSIgY3k9IjI3LjUiIHI9IjMiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSIyOSIgY3k9IjI3LjUiIHI9IjMiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI0MyIgY3k9IjI3LjUiIHI9IjMiLz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-reaction-icon-share{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8Zz4KCQkJPHBhdGggZD0iTTMzMS42OTYsMTA0LjY5NGM0LjQ2NC0wLjExOSw3Ljk4NS0zLjgzMyw3Ljg2Ny04LjI5N2MtMS4xNDYtNDMuMDc0LDMyLjk2NC03OS4wNTIsNzYuMDM5LTgwLjE5OSAgICAgYzIwLjg4NC0wLjU1OCw0MC43MDEsNy4wNDksNTUuODQ5LDIxLjQxczIzLjc5NiwzMy43NjMsMjQuMzUyLDU0LjYyOWMwLjU1NSwyMC44NjYtNy4wNDgsNDAuNjk5LTIxLjQxLDU1Ljg0NyAgICAgcy0zMy43NjMsMjMuNzk2LTU0LjYzLDI0LjM1MmMtMTkuNjQ2LDAuNTEzLTM4LjY3OC02LjMxNi01My40OTEtMTkuMjYzYy0zLjM2My0yLjkzOC04LjQ2OC0yLjU5Ny0xMS40MDcsMC43NjYgICAgIGMtMi45MzgsMy4zNjEtMi41OTQsOC40NjgsMC43NjcsMTEuNDA2YzE3LjI0MywxNS4wNywzOS4xNzcsMjMuMjg2LDYyLjAyMSwyMy4yODZjMC44NDQsMCwxLjY5My0wLjAxMiwyLjUzOS0wLjAzNCAgICAgYzI1LjE4NC0wLjY3LDQ4LjU5OS0xMS4xMDgsNjUuOTMzLTI5LjM4OWMxNy4zMzMtMTguMjgxLDI2LjUxLTQyLjIxOSwyNS44MzktNjcuNDAyYy0wLjY3LTI1LjE4My0xMS4xMDgtNDguNTk5LTI5LjM5LTY1LjkzMiAgICAgQzQ2NC4yOTEsOC41NDIsNDQwLjMyLTAuNjUxLDQxNS4xNzMsMC4wMzZjLTUxLjk4OCwxLjM4NC05My4xNTYsNDQuODA1LTkxLjc3Miw5Ni43OTIgICAgIEMzMjMuNTIsMTAxLjI5MSwzMjcuMjU5LDEwNC44MDgsMzMxLjY5NiwxMDQuNjk0eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNNDIyLjU3NSwzMjMuNDk2Yy0yMi45NjktMS4xOTUtNDUuNTMyLDYuMDItNjMuNTI3LDIwLjMxMmMtMy40OTYsMi43NzgtNC4wNzksNy44NjItMS4zMDIsMTEuMzU5ICAgICBjMi43NzYsMy40OTYsNy44NjEsNC4wNzgsMTEuMzU5LDEuMzAyYzE0LjkwNS0xMS44NDEsMzMuNjAzLTE3LjgxNSw1Mi42My0xNi44MjdjNDMuMDMzLDIuMjM2LDc2LjIyNCwzOS4wNjQsNzMuOTg5LDgyLjA5NiAgICAgYy0xLjA4MiwyMC44NDUtMTAuMjE3LDQwLjAyMi0yNS43MjQsNTMuOTk2Yy0xNS41MDcsMTMuOTc0LTM1LjUyMSwyMS4wNzctNTYuMzcyLDE5Ljk5MSAgICAgYy0yMC44NDUtMS4wODMtNDAuMDIyLTEwLjIyLTUzLjk5Ny0yNS43MjVjLTEzLjk3NC0xNS41MDYtMjEuMDc0LTM1LjUyNS0xOS45OTEtNTYuMzcxYzAuMjMxLTQuNDU5LTMuMTk2LTguMjYxLTcuNjU1LTguNDkzICAgICBjLTQuNDEyLTAuMjI4LTguMjYxLDMuMTk1LTguNDkzLDcuNjU0Yy0xLjMwNiwyNS4xNTgsNy4yNjMsNDkuMzIsMjQuMTI4LDY4LjAzM2MxNi44NjYsMTguNzE0LDQwLjAwOSwyOS43NCw2NS4xNjksMzEuMDQ3ICAgICBjMS42NzUsMC4wODcsMy4zNDMsMC4xMyw1LjAwNywwLjEzYzIzLjM0Mi0wLjAwMSw0NS41Ni04LjUxNCw2My4wMjgtMjQuMjU3YzE4LjcxNC0xNi44NjYsMjkuNzQtNDAuMDA5LDMxLjA0OC02NS4xNjcgICAgIEM1MTQuNTcsMzcwLjY0MSw0NzQuNTExLDMyNi4xOTMsNDIyLjU3NSwzMjMuNDk2eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNNDE3LjY4Miw0NjguODgxYzI4LjIzMSwwLDUxLjItMjIuOTY4LDUxLjItNTEuMTk5cy0yMi45NjktNTEuMi01MS4yLTUxLjJjLTE3LjEwOCwwLTMyLjI4NSw4LjQzOC00MS41ODcsMjEuMzY3ICAgICBsLTIzMi45NC0xMTYuNDY5YzEuNTM0LTQuODU3LDIuMzU5LTEwLjAyMywyLjM1OS0xNS4zOGMwLTUuMzU3LTAuODI4LTEwLjUyNS0yLjM1OS0xNS4zODJMMzc2LjA5NCwxMjQuMTUgICAgIGM5LjMwMiwxMi45MzEsMjQuNDc4LDIxLjM2Nyw0MS41ODgsMjEuMzY3YzI4LjIzMSwwLDUxLjItMjIuOTY4LDUxLjItNTEuMmMwLTI4LjIzMi0yMi45NjktNTEuMTk5LTUxLjItNTEuMTk5ICAgICBjLTI4LjIzMSwwLTUxLjE5OSwyMi45NjgtNTEuMTk5LDUxLjE5OWMwLDUuMzU3LDAuODI3LDEwLjUyMywyLjM2LDE1LjM4bC0yMzIuOTQsMTE2LjQ3ICAgICBjLTkuMzAyLTEyLjkyOS0yNC40NzktMjEuMzY3LTQxLjU4Ny0yMS4zNjdjLTI4LjIzMSwwLTUxLjIsMjIuOTY5LTUxLjIsNTEuMnMyMi45NjksNTEuMTk5LDUxLjIsNTEuMTk5ICAgICBjMTcuMTExLDAsMzIuMjg2LTguNDM2LDQxLjU4OC0yMS4zNjdsMjMyLjkzOCwxMTYuNDY5Yy0xLjUzMyw0Ljg1Ny0yLjM2LDEwLjAyNC0yLjM2LDE1LjM4MiAgICAgQzM2Ni40ODMsNDQ1LjkxNCwzODkuNDUxLDQ2OC44ODEsNDE3LjY4Miw0NjguODgxeiBNNDE3LjY4MiwzODIuNjUxYzE5LjMxNywwLDM1LjAzMiwxNS43MTUsMzUuMDMyLDM1LjAzMiAgICAgYzAsMTkuMzE3LTE1LjcxNSwzNS4wMzEtMzUuMDMyLDM1LjAzMWMtMTkuMzE2LDAtMzUuMDMtMTUuNzE1LTM1LjAzLTM1LjAzMUMzODIuNjUyLDM5OC4zNjcsMzk4LjM2NiwzODIuNjUxLDQxNy42ODIsMzgyLjY1MXogICAgICBNNDE3LjY4Miw1OS4yODdjMTkuMzE3LDAsMzUuMDMyLDE1LjcxNSwzNS4wMzIsMzUuMDMxYzAsMTkuMzE2LTE1LjcxNSwzNS4wMzItMzUuMDMyLDM1LjAzMiAgICAgYy0xOS4zMTYsMC0zNS4wMy0xNS43MTYtMzUuMDMtMzUuMDMyQzM4Mi42NTIsNzUuMDAxLDM5OC4zNjYsNTkuMjg3LDQxNy42ODIsNTkuMjg3eiBNOTQuMzE2LDI5MS4wMzEgICAgIGMtMTkuMzE3LDAtMzUuMDMyLTE1LjcxNS0zNS4wMzItMzUuMDMxczE1LjcxNS0zNS4wMzIsMzUuMDMyLTM1LjAzMmMxOS4zMTYsMCwzNS4wMzEsMTUuNzE2LDM1LjAzMSwzNS4wMzIgICAgIFMxMTMuNjMyLDI5MS4wMzEsOTQuMzE2LDI5MS4wMzF6IiBmaWxsPSIjMDAwMDAwIi8+CgkJCTxwYXRoIGQ9Ik0xMjkuMjU3LDMyNS44OTZjLTEwLjkyOCw1LjQ3NS0yMi42ODMsOC4yNS0zNC45NDEsOC4yNWMtNDMuMDkxLDAtNzguMTQ3LTM1LjA1Ni03OC4xNDctNzguMTQ2ICAgICBjMC00My4wOSwzNS4wNTYtNzguMTQ3LDc4LjE0Ny03OC4xNDdjMTIuMjU4LDAsMjQuMDEzLDIuNzc2LDM0Ljk0Miw4LjI1YzMuOTk0LDIuMDAyLDguODUsMC4zODUsMTAuODQ4LTMuNjA3ICAgICBjMi0zLjk5MSwwLjM4NS04Ljg1LTMuNjA3LTEwLjg0OWMtMTMuMTk2LTYuNjExLTI3LjM4OC05Ljk2My00Mi4xODMtOS45NjNDNDIuMzA5LDE2MS42ODUsMCwyMDMuOTk1LDAsMjU2ICAgICBzNDIuMzEsOTQuMzE1LDk0LjMxNSw5NC4zMTVjMTQuNzk1LDAsMjguOTg4LTMuMzUyLDQyLjE4My05Ljk2M2MzLjk5MS0yLjAwMSw1LjYwNi02Ljg1OCwzLjYwNy0xMC44NDkgICAgIEMxMzguMTA3LDMyNS41MTIsMTMzLjI1LDMyMy44OTgsMTI5LjI1NywzMjUuODk2eiIgZmlsbD0iIzAwMDAwMCIvPgoJCTwvZz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-reaction-icon-share:hover{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAiIHkxPSIyNTguMDAxIiB4Mj0iNTEyIiB5Mj0iMjU4LjAwMSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAtMSAwIDUxNC4wMDEpIj4KCTxzdG9wIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzgwRDhGRiIvPgoJPHN0b3Agb2Zmc2V0PSIwLjE2IiBzdHlsZT0ic3RvcC1jb2xvcjojODhEMUZGIi8+Cgk8c3RvcCBvZmZzZXQ9IjAuNDEzIiBzdHlsZT0ic3RvcC1jb2xvcjojOUZCRUZFIi8+Cgk8c3RvcCBvZmZzZXQ9IjAuNzI1IiBzdHlsZT0ic3RvcC1jb2xvcjojQzRBMEZEIi8+Cgk8c3RvcCBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiNFQTgwRkMiLz4KPC9saW5lYXJHcmFkaWVudD4KPHBhdGggc3R5bGU9ImZpbGw6dXJsKCNTVkdJRF8xXyk7IiBkPSJNNDIyLjk1NCwzMzMuOTA4Yy0yNy41ODcsMC01Mi4yODQsMTIuNjExLTY4LjYzLDMyLjM3bC0xNzguNzE4LTg5LjM1OSAgYzEuNjIyLTYuNzEyLDIuNDg4LTEzLjcxNSwyLjQ4OC0yMC45MThjMC03LjIwMy0wLjg2Ni0xNC4yMDctMi40ODgtMjAuOTE4bDE3OC43MTgtODkuMzU5YzE2LjM0NiwxOS43NTksNDEuMDQzLDMyLjM3LDY4LjYzLDMyLjM3ICBjNDkuMSwwLDg5LjA0Ni0zOS45NDYsODkuMDQ2LTg5LjA0NlM0NzIuMDU0LDAuMDAxLDQyMi45NTQsMC4wMDFzLTg5LjA0NiwzOS45NDYtODkuMDQ2LDg5LjA0NmMwLDcuMjAzLDAuODY2LDE0LjIwNywyLjQ4OCwyMC45MTggIGwtMTc4LjcxOCw4OS4zNTljLTE2LjM0Ni0xOS43NTktNDEuMDQzLTMyLjM3LTY4LjYzLTMyLjM3QzM5Ljk0NiwxNjYuOTU0LDAsMjA2LjksMCwyNTZzMzkuOTQ2LDg5LjA0Niw4OS4wNDYsODkuMDQ2ICBjMjcuNTg3LDAsNTIuMjg0LTEyLjYxMSw2OC42My0zMi4zN2wxNzguNzE4LDg5LjM1OWMtMS42MjIsNi43MTItMi40ODgsMTMuNzE1LTIuNDg4LDIwLjkxOGMwLDQ5LjEsMzkuOTQ2LDg5LjA0Niw4OS4wNDYsODkuMDQ2ICBTNTEyLDQ3Mi4wNTUsNTEyLDQyMi45NTVTNDcyLjA1NCwzMzMuOTA4LDQyMi45NTQsMzMzLjkwOHogTTQyMi45NTQsNDAuMDAxYzI3LjA0NCwwLDQ5LjA0NiwyMi4wMDIsNDkuMDQ2LDQ5LjA0NiAgcy0yMi4wMDIsNDkuMDQ2LTQ5LjA0Niw0OS4wNDZzLTQ5LjA0Ni0yMi4wMDItNDkuMDQ2LTQ5LjA0NlMzOTUuOTA5LDQwLjAwMSw0MjIuOTU0LDQwLjAwMXogTTg5LjA0NiwzMDUuMDQ3ICBDNjIuMDAyLDMwNS4wNDcsNDAsMjgzLjA0NCw0MCwyNTZzMjIuMDAyLTQ5LjA0Niw0OS4wNDYtNDkuMDQ2czQ5LjA0NiwyMi4wMDIsNDkuMDQ2LDQ5LjA0NlMxMTYuMDkxLDMwNS4wNDcsODkuMDQ2LDMwNS4wNDd6ICAgTTQyMi45NTQsNDcyYy0yNy4wNDQsMC00OS4wNDYtMjIuMDAyLTQ5LjA0Ni00OS4wNDZjMC0yNy4wNDQsMjIuMDAyLTQ5LjA0Niw0OS4wNDYtNDkuMDQ2UzQ3MiwzOTUuOTA5LDQ3Miw0MjIuOTU1ICBDNDcyLDQ1MCw0NDkuOTk4LDQ3Miw0MjIuOTU0LDQ3MnoiLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reaction-icon-love{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA0MDcuODkzIDQwNy44OTMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwNy44OTMgNDA3Ljg5MzsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPGc+CgkJPGc+CgkJCTxwYXRoIGQ9Ik0yODUuMjQ1LDE1LjI0MmMtMzAuMjU2LDAtNTguODQyLDEwLjg4NS04MS4yOTIsMzAuODAyYy0yMi40NDMtMTkuOTItNTEuMDI5LTMwLjgwMi04MS4yOTktMzAuODAyICAgICBDNTUuMDIzLDE1LjI0MiwwLDcwLjI2MiwwLDEzNy44OWMwLDMyLjgxNiwxMi43OTcsNjMuNjQ4LDM2LjAyNCw4Ni44MjJsMTY3LjkyOSwxNjcuOTM5bDE2OC4wMjUtMTY4LjAyOCAgICAgYzIzLjE1OS0yMy4xNTMsMzUuOTE1LTUzLjk1MSwzNS45MTUtODYuNzMzQzQwNy44OTMsNzAuMjYyLDM1Mi44NzQsMTUuMjQyLDI4NS4yNDUsMTUuMjQyeiBNMzYxLjExNywyMTMuNzY1TDIwMy45NTQsMzcwLjkyOSAgICAgTDQ2Ljg3NSwyMTMuODQ3Yy0yMC4zMjMtMjAuMjc1LTMxLjUxNS00Ny4yNTEtMzEuNTE1LTc1Ljk1M2MwLTU5LjE2LDQ4LjEzMS0xMDcuMjg4LDEwNy4yOTUtMTA3LjI4OCAgICAgYzI4LjY2MiwwLDU1LjYxLDExLjE1OCw3NS44NjUsMzEuNDJsNS40MjcsNS40MzFsNS40MzQtNS40MzFjMjAuMjY4LTIwLjI1OCw0Ny4yMTMtMzEuNDIsNzUuODY1LTMxLjQyICAgICBjNTkuMTU2LDAsMTA3LjI4OCw0OC4xMjgsMTA3LjI4OCwxMDcuMjg4QzM5Mi41MzMsMTY2LjU2OSwzODEuMzc5LDE5My41MTQsMzYxLjExNywyMTMuNzY1eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNNDAuOTYsMTM3Ljg5aDE1LjM2YzAtMzYuNTc0LDI5Ljc1Ny02Ni4zMzEsNjYuMzM4LTY2LjMzNXYtMTUuMzZDNzcuNjA5LDU2LjE5NSw0MC45Niw5Mi44NDQsNDAuOTYsMTM3Ljg5eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNMjAzLjUzLDEzNy44OWgxNS4zNmMwLTM2LjU3NCwyOS43NTctNjYuMzMxLDY2LjMzNS02Ni4zMzV2LTE1LjM2QzI0MC4xNzYsNTYuMTk1LDIwMy41Myw5Mi44NDQsMjAzLjUzLDEzNy44OXoiIGZpbGw9IiMwMDAwMDAiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reaction-icon-love-full,#rev-slider2 .rev-content .rev-reaction-icon-selected,#rev-slider2 .rev-content .rev-reaction-menu-item-icon{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8cGF0aCBzdHlsZT0iZmlsbDojRkY0RDVFOyIgZD0iTTI1Niw5Ni4yNDhjLTU2LjY5MS01Ni42OTEtMTQ4Ljc2Ny01Ni40MzItMjA1LjEzNSwwLjc3OCAgYy01NS45MjMsNTYuNzU4LTU0LjI4OCwxNDguNTI2LDIuMDU1LDIwNC44NjhsMTIzLjAyNCwxMjMuMDI0YzQ0LjIxNCw0NC4yMTQsMTE1Ljg5OSw0NC4yMTQsMTYwLjExNCwwbDEyMy4wMjQtMTIzLjAyNCAgYzU2LjM0My01Ni4zNDMsNTcuOTc4LTE0OC4xMSwyLjA1NS0yMDQuODY4QzQwNC43NjcsMzkuODE1LDMxMi42OTEsMzkuNTU3LDI1Niw5Ni4yNDh6Ii8+CjxwYXRoIGQ9Ik00NjguMTQ3LDkwLjExNWMtMjkuMS0yOS41MzQtNjcuOTQ5LTQ1Ljg4NC0xMDkuMzkxLTQ2LjAzN2MtMC4xOTgtMC4wMDEtMC4zOTItMC4wMDEtMC41OS0wLjAwMSAgYy0zOC4wMjUsMC03My45MzUsMTMuNjQ5LTEwMi4xNjcsMzguNjU1Yy0yOC4yMzUtMjUuMDA3LTY0LjEzOS0zOC42NTUtMTAyLjE2Ny0zOC42NTVjLTAuMTk0LDAtMC4zOTQsMC0wLjU5LDAuMDAxICBDMTExLjgsNDQuMjMyLDcyLjk1MSw2MC41ODEsNDMuODUyLDkwLjExNWMtNTkuMjg0LDYwLjE2OS01OC4zMzgsMTU4LjI5NCwyLjEwNiwyMTguNzRsMTIzLjAyNCwxMjMuMDIzICBjMjMuMjQzLDIzLjI0NCw1NC4xNDcsMzYuMDQ0LDg3LjAxOSwzNi4wNDRzNjMuNzc1LTEyLjgsODcuMDE5LTM2LjA0NGwxMjMuMDI0LTEyMy4wMjMgIEM1MjYuNDg2LDI0OC40MSw1MjcuNDMxLDE1MC4yODUsNDY4LjE0Nyw5MC4xMTV6IE00NTIuMTE5LDI5NC45MzJMMzI5LjA5NSw0MTcuOTU2Yy0xOS41MjUsMTkuNTI1LTQ1LjQ4MywzMC4yNzctNzMuMDk1LDMwLjI3NyAgYy0yNy42MTIsMC01My41Ny0xMC43NTMtNzMuMDk1LTMwLjI3N0w1OS44ODEsMjk0LjkzMkM3LjA1NywyNDIuMTA4LDYuMTU5LDE1Ni40MjcsNTcuODc3LDEwMy45MzUgIGMyNS4zODktMjUuNzY4LDU5LjI4NC00MC4wMzMsOTUuNDM4LTQwLjE2N2MwLjE3Mi0wLjAwMSwwLjM0My0wLjAwMSwwLjUxNC0wLjAwMWMzNS45NjcsMCw2OS43NjIsMTMuOTk2LDk1LjIwOCwzOS40NDIgIGMzLjg0NSwzLjg0MywxMC4wNzcsMy44NDMsMTMuOTI0LDBjMjUuNDQ3LTI1LjQ0Nyw1OS4yMzgtMzkuNDQyLDk1LjIwOC0zOS40NDJjMC4xNywwLDAuMzQ1LDAsMC41MTQsMC4wMDEgIGMzNi4xNTYsMC4xMzQsNzAuMDQ5LDE0LjM5OCw5NS40MzgsNDAuMTY3QzUwNS44NDEsMTU2LjQyNyw1MDQuOTQzLDI0Mi4xMDgsNDUyLjExOSwyOTQuOTMyeiIvPgo8cGF0aCBkPSJNMTQ3Ljc0Niw4OC4zNTljLTM3LjkyNSwwLTcxLjkzMywyMS4wMTQtODguNzUzLDU0Ljg0MmMtMi40MjEsNC44NjgtMC40MzYsMTAuNzc3LDQuNDMyLDEzLjE5OCAgYzEuNDA5LDAuNywyLjkwMiwxLjAzMiw0LjM3NSwxLjAzMmMzLjYxOSwwLDcuMTAyLTIuMDAzLDguODIzLTUuNDY0YzEzLjQ3MS0yNy4wOSw0MC43MjMtNDMuOTE4LDcxLjEyMy00My45MTggIGM1LjQzNiwwLDkuODQ1LTQuNDA4LDkuODQ1LTkuODQ1UzE1My4xODMsODguMzU5LDE0Ny43NDYsODguMzU5eiIvPgo8cGF0aCBkPSJNNjAuMzgyLDE2Ni45NzFjLTUuMzkzLTAuNjU1LTEwLjMwNCwzLjE5MS0xMC45NTgsOC41ODljLTAuMDAxLDAuMDEyLTAuMDIxLDAuMTc2LTAuMDIyLDAuMTkgIGMtMC42NTMsNS4zOTMsMy4xODYsMTAuMjk3LDguNTgxLDEwLjk1NmMwLjQwNSwwLjA0OSwwLjgwNiwwLjA3NCwxLjIwNiwwLjA3NGM0LjkwNCwwLDkuMTUtMy42Niw5Ljc1OS04LjY1MyAgYzAuMDAxLTAuMDAzLDAuMDIzLTAuMTk1LDAuMDI0LTAuMTk5QzY5LjYyNCwxNzIuNTMyLDY1Ljc3OSwxNjcuNjI1LDYwLjM4MiwxNjYuOTcxeiIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-reaction-icon-exciting-full,#rev-slider2 .rev-content .rev-reaction-icon-selected.rev-reaction-icon-exciting,#rev-slider2 .rev-content .rev-reaction-menu-item-icon-exciting{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk5IDUxMS45OTkiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTkgNTExLjk5OTsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZEREY2RDsiIGN4PSIyNTYuNiIgY3k9IjI1Ni4wMDEiIHI9IjI0NS45OTMiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0ZDQzU2QjsiIGQ9Ik0zMDkuMzEyLDQ2NS42NzdjLTEzNS44NTgsMC0yNDUuOTkyLTExMC4xMzQtMjQ1Ljk5Mi0yNDUuOTkyICBjMC03Mi41ODQsMzEuNDQzLTEzNy44MTYsODEuNDQ0LTE4Mi44NDJDNjUuMTI2LDc3LjU2MiwxMC42MDYsMTYwLjQxMywxMC42MDYsMjU1Ljk5OWMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkyLDI0NS45OTIsMjQ1Ljk5MiAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk3LDE2NC41NDgtNjMuMTQ5QzM4Ny41OTQsNDU1Ljk5OCwzNDkuNTg1LDQ2NS42NzcsMzA5LjMxMiw0NjUuNjc3eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNNDE3LjA1OCwyMzAuMzYzYy0zLjUxMywwLjAwMS02LjkyMS0xLjg1Mi04Ljc1Mi01LjE0Yy02LjQyMS0xMS41MjYtMTguNTk0LTE4LjY4Ni0zMS43NzEtMTguNjg2ICAgYy0xMi44NTEsMC0yNS4xODksNy4yNjUtMzIuMjAyLDE4Ljk2MmMtMi44NDIsNC43MzktOC45ODksNi4yNzgtMTMuNzI5LDMuNDM3Yy00Ljc0MS0yLjg0Mi02LjI3OS04Ljk4OC0zLjQzNy0xMy43MjkgICBjMTAuNjA4LTE3LjY5NCwyOS41MjQtMjguNjg1LDQ5LjM2OC0yOC42ODVjMjAuNDMyLDAsMzkuMzA2LDExLjA5Niw0OS4yNTYsMjguOTYxYzIuNjksNC44MjgsMC45NTUsMTAuOTIzLTMuODcyLDEzLjYxMSAgIEM0MjAuMzc4LDIyOS45NTYsNDE4LjcwNiwyMzAuMzYzLDQxNy4wNTgsMjMwLjM2M3oiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMjQ2LjMzLDIzMC4zNjNjLTMuNTEzLDAuMDAxLTYuOTIxLTEuODUyLTguNzUyLTUuMTRjLTYuNDIxLTExLjUyNi0xOC41OTQtMTguNjg2LTMxLjc3MS0xOC42ODYgICBjLTEyLjg0OSwwLTI1LjE4OSw3LjI2NS0zMi4yMDIsMTguOTYyYy0yLjg0MSw0LjczOS04Ljk4Nyw2LjI3OC0xMy43MjksMy40MzdjLTQuNzM5LTIuODQyLTYuMjc5LTguOTg5LTMuNDM2LTEzLjcyOSAgIGMxMC42MDgtMTcuNjk0LDI5LjUyNC0yOC42ODUsNDkuMzY4LTI4LjY4NWMyMC40MzIsMCwzOS4zMDYsMTEuMDk2LDQ5LjI1NiwyOC45NjFjMi42OSw0LjgyOCwwLjk1NSwxMC45MjMtMy44NzIsMTMuNjExICAgQzI0OS42NDksMjI5Ljk1NiwyNDcuOTc4LDIzMC4zNjMsMjQ2LjMzLDIzMC4zNjN6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTI5My41NDUsNDM3LjcwNkwyOTMuNTQ1LDQzNy43MDZjLTcwLjk4MSwwLTEyOC41MjItNTcuNTQxLTEyOC41MjItMTI4LjUyMmwwLDBoMjU3LjA0M2wwLDAgICBDNDIyLjA2NiwzODAuMTY0LDM2NC41MjUsNDM3LjcwNiwyOTMuNTQ1LDQzNy43MDZ6Ii8+CjwvZz4KPHBhdGggc3R5bGU9ImZpbGw6I0YyRjJGMjsiIGQ9Ik0xOTYuMzgyLDMwOS4xODR2MjAuMDYxYzAsOC40Niw2Ljg1NywxNS4zMTcsMTUuMzE3LDE1LjMxN2gxNjMuNjkzICBjOC40NTgsMCwxNS4zMTctNi44NTcsMTUuMzE3LTE1LjMxN3YtMjAuMDYxSDE5Ni4zODJMMTk2LjM4MiwzMDkuMTg0eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkM0QzU5OyIgZD0iTTI5Ni4yNDEsMzg0LjM4NWMtMzQuNzQtMTYuMTQtNzMuMjk0LTEzLjc5NS0xMDQuNTU0LDIuOTQ1ICBjMjMuNDkyLDMwLjYxNyw2MC40MzIsNTAuMzc0LDEwMi4wMDcsNTAuMzc0bDAsMGMxOC4zMiwwLDM1LjczMS0zLjg1OSw1MS41MDMtMTAuNzY3ICBDMzMzLjYyNiw0MDkuMDM0LDMxNy4wMzQsMzk0LjA0NiwyOTYuMjQxLDM4NC4zODV6Ii8+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzNGQTlGNTsiIGQ9Ik0xNTEuMTE5LDMzNS41NDNjLTE1LjAxNiwxNi40MjMtNDAuNTAyLDE3LjU2NS01Ni45MjYsMi41NDlzLTE3LjU2NS00MC41MDItMi41NDktNTYuOTI2ICAgYzE1LjAxNi0xNi40MjMsODMuOTExLTMyLjA2Myw4My45MTEtMzIuMDYzUzE2Ni4xMzYsMzE5LjExOSwxNTEuMTE5LDMzNS41NDN6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojM0ZBOUY1OyIgZD0iTTQyNy42NjcsMzI2LjU2NGMxNS4wMTYsMTYuNDIzLDQwLjUwMiwxNy41NjUsNTYuOTI2LDIuNTQ5czE3LjU2NS00MC41MDIsMi41NDktNTYuOTI2ICAgYy0xNS4wMTYtMTYuNDIzLTgzLjkxMS0zMi4wNjMtODMuOTExLTMyLjA2M1M0MTIuNjUyLDMxMC4xNDIsNDI3LjY2NywzMjYuNTY0eiIvPgo8L2c+CjxwYXRoIGQ9Ik0zNzYuNTM1LDE4Ni41MjZjLTE5Ljg0NCwwLTM4Ljc2LDEwLjk5MS00OS4zNjgsMjguNjg1Yy0yLjg0Miw0Ljc0MS0xLjMwNCwxMC44ODcsMy40MzcsMTMuNzI5ICBjNC43MzksMi44NDEsMTAuODg3LDEuMzA0LDEzLjcyOS0zLjQzN2M3LjAxMi0xMS42OTcsMTkuMzUxLTE4Ljk2MiwzMi4yMDItMTguOTYyYzEzLjE3NiwwLDI1LjM1MSw3LjE2LDMxLjc3MSwxOC42ODYgIGMxLjgzMSwzLjI4OCw1LjIzOCw1LjE0MSw4Ljc1Miw1LjE0YzEuNjQ4LDAsMy4zMi0wLjQwOCw0Ljg2MS0xLjI2NmM0LjgyOS0yLjY5LDYuNTYyLTguNzg0LDMuODcyLTEzLjYxMSAgQzQxNS44NDEsMTk3LjYyMiwzOTYuOTY3LDE4Ni41MjYsMzc2LjUzNSwxODYuNTI2eiIvPgo8cGF0aCBkPSJNMjA1LjgwNywxODYuNTI2Yy0xOS44NDMsMC0zOC43NTksMTAuOTkxLTQ5LjM2OCwyOC42ODVjLTIuODQyLDQuNzM5LTEuMzA0LDEwLjg4NywzLjQzNiwxMy43MjkgIGM0Ljc0MiwyLjg0MSwxMC44ODgsMS4zMDQsMTMuNzI5LTMuNDM3YzcuMDEzLTExLjY5NywxOS4zNTMtMTguOTYyLDMyLjIwMi0xOC45NjJjMTMuMTc2LDAsMjUuMzUxLDcuMTYsMzEuNzcxLDE4LjY4NiAgYzEuODMxLDMuMjg4LDUuMjM4LDUuMTQxLDguNzUyLDUuMTRjMS42NDgsMCwzLjMyLTAuNDA4LDQuODYxLTEuMjY2YzQuODI5LTIuNjksNi41NjItOC43ODQsMy44NzItMTMuNjExICBDMjQ1LjExMywxOTcuNjIyLDIyNi4yNCwxODYuNTI2LDIwNS44MDcsMTg2LjUyNnoiLz4KPHBhdGggZD0iTTQ5NC41MjcsMjY1LjQzNmMtMTYuMzA0LTE3LjgzMy03Ny4wNjYtMzIuMzQyLTg5LjA4MS0zNS4wN2MtMy4xOTYtMC43MjYtNi41NDcsMC4xNi04Ljk2OCwyLjM3MiAgYy0yLjQxOSwyLjIxMi0zLjYwMyw1LjQ3MS0zLjE2NSw4LjcyYzEuMDIxLDcuNTgzLDQuODg5LDM0LjI4OSwxMS41NzYsNTcuNzE4SDE3Ni4yOTJjNS4yMjEtMjAuODgzLDguMjktNDIuMTEzLDkuMTgxLTQ4LjczOCAgYzAuNDM4LTMuMjUtMC43NDYtNi41MDctMy4xNjUtOC43MmMtMi40Mi0yLjIxMi01Ljc3NC0zLjA5OC04Ljk2OC0yLjM3MmMtMTIuMDE1LDIuNzI3LTcyLjc3NywxNy4yMzctODkuMDgxLDM1LjA2OCAgYy0xOC43MTUsMjAuNDY4LTE3LjI4Nyw1Mi4zNDgsMy4xODIsNzEuMDYzYzkuMzQ3LDguNTQ2LDIxLjMwMiwxMy4xNzksMzMuODg2LDEzLjE3OWMwLjc2NiwwLDEuNTM0LTAuMDE3LDIuMzA0LTAuMDUyICBjMTMuNDIyLTAuNiwyNS44MDctNi4zOTMsMzQuODcyLTE2LjMwOWMwLjEzNi0wLjE0OCwwLjI2Ny0wLjMyNiwwLjQwMi0wLjQ3OWMxNC43MTEsNjAuNjksNjkuNDksMTA1Ljg5NywxMzQuNjM3LDEwNS44OTcgIGM2NS4yNjgsMCwxMjAuNjc4LTQ1LjUyNywxMzQuOTU2LTEwNy4xNjljOC42MSw2LjA0NywxOC43NTQsOS4xMDksMjguOTI1LDkuMTA5YzUuNzc0LDAsMTEuNTUyLTAuOTk4LDE3LjA2Ni0yLjk4MSAgYy0xNS4xNzksMzYuMzE1LTM5LjQzMyw2OC43MzgtNzAuNDQ5LDkzLjU5MWMtNDIuMjI4LDMzLjgzNy05My4yMTQsNTEuNzIyLTE0Ny40NDQsNTEuNzIyICBjLTEzMC4xMjMsMC0yMzUuOTg1LTEwNS44NjMtMjM1Ljk4NS0yMzUuOTg1UzEyNi40NzUsMjAuMDE1LDI1Ni41OTgsMjAuMDE1YzEwNy4zNjUsMCwyMDEuMjY1LDcyLjQ1NywyMjguMzQ4LDE3Ni4yMDIgIGMxLjM5Niw1LjM0OSw2Ljg2Miw4LjU1MywxMi4yMSw3LjE1NWM1LjM0OC0xLjM5Niw4LjU1Mi02Ljg2NCw3LjE1NS0xMi4yMUM0NzQuOTI4LDc4LjYwOCwzNzMuMDY2LDAsMjU2LjU5OCwwICBDMTE1LjQzOCwwLDAuNTk4LDExNC44NCwwLjU5OCwyNTUuOTk5czExNC44NCwyNTUuOTk5LDI1NS45OTksMjU1Ljk5OWM1Ny45ODgsMCwxMTQuNzk2LTE5LjkyOSwxNTkuOTU4LTU2LjExNyAgYzQ0LjQ3NS0zNS42MzUsNzYuMTQ2LTg1LjYzMyw4OS4xODEtMTQwLjc4YzAuMjIzLTAuOTQ1LDAuMjk4LTEuODg4LDAuMjUxLTIuODExQzUxMC4yMTQsMjk2LjI5Miw1MDYuNDk5LDI3OC41MjksNDk0LjUyNywyNjUuNDM2eiAgIE0xMjIuNzM3LDMzOC42MDljLTguMDcsMC4zNjctMTUuODE4LTIuNDQ2LTIxLjc4OS03LjkwNGMtMTIuMzI1LTExLjI2OC0xMy4xODQtMzAuNDYyLTEuOTE2LTQyLjc4NyAgYzcuNDM3LTguMTM0LDM4LjQyLTE4LjY1Miw2NC4zNTktMjUuNTA4Yy00LjUxMSwyNi40NDYtMTIuMjE4LDU4LjI0NC0xOS42NTYsNjYuMzgxICBDMTM4LjI3NSwzMzQuNzYxLDEzMC44MTgsMzM4LjI0OCwxMjIuNzM3LDMzOC42MDl6IE0yOTMuNTQzLDQyNy42OThjLTYxLjk3OSwwLTExMi45OTktNDcuODI0LTExOC4wOTYtMTA4LjUwN2gyMzYuMTk0ICBDNDA2LjU0LDM4MC4yNSwzNTUuMTc3LDQyNy42OTgsMjkzLjU0Myw0MjcuNjk4eiBNNDU2LjA0OSwzMjkuNjMyYy04LjA4Mi0wLjM2Mi0xNS41MzgtMy44NDktMjAuOTk3LTkuODE5ICBjLTEuMjkyLTEuNDEzLTIuNTkxLTMuNTUzLTMuODgtNi4yNDFjLTAuMTc5LTAuNDcxLTAuMzg2LTAuOTI5LTAuNjMyLTEuMzYyYy0wLjgwMi0xLjc4OC0xLjU5OS0zLjc3Ni0yLjM4Ny01Ljk0NCAgYy0wLjA2NS0wLjIxNi0wLjE0Ny0wLjQyNy0wLjIyNy0wLjYzNmMtNC45MjgtMTMuODEtOS40NjctMzQuMjM2LTEyLjUzLTUyLjJjMjUuOTM0LDYuODUzLDU2LjkxMiwxNy4zNjcsNjQuMzU5LDI1LjUxMiAgYzExLjI2OCwxMi4zMjQsMTAuNDA5LDMxLjUxOS0xLjkxNiw0Mi43ODdDNDcxLjg3LDMyNy4xODcsNDY0LjEzNSwzMjkuOTk2LDQ1Ni4wNDksMzI5LjYzMnoiLz4KPGNpcmNsZSBjeD0iNTAxLjM5MyIgY3k9IjIyNi4wMzIiIHI9IjEwLjAwNyIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-reaction-icon-interesting-full,#rev-slider2 .rev-content .rev-reaction-icon-selected.rev-reaction-icon-interesting,#rev-slider2 .rev-content .rev-reaction-menu-item-icon-interesting{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk3IDUxMS45OTciIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTcgNTExLjk5NzsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGREI2QzsiIGN4PSIyNDguMTA2IiBjeT0iMjU1Ljk5NCIgcj0iMjM4LjQwNyIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkZCMDRDOyIgZD0iTTI5OS4xOTQsNDU5LjIxYy0xMzEuNjY4LDAtMjM4LjQwNi0xMDYuNzM4LTIzOC40MDYtMjM4LjQwNmMwLTcwLjM0NSwzMC40NzMtMTMzLjU2NSw3OC45MzItMTc3LjIwMyAgQzYyLjUzNyw4My4wNjQsOS42OTksMTYzLjM2MSw5LjY5OSwyNTUuOTk5YzAsMTMxLjY2OCwxMDYuNzM4LDIzOC40MDYsMjM4LjQwNiwyMzguNDA2YzYxLjMyMywwLDExNy4yMzEtMjMuMTYxLDE1OS40NzQtNjEuMjAxICBDMzc1LjA2MSw0NDkuODI5LDMzOC4yMjQsNDU5LjIxLDI5OS4xOTQsNDU5LjIxeiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGOUE4ODA7IiBkPSJNMTQ1LjY1MSwyNTkuNDE3Yy0xNy43MDUsMC0zMi4wNTksMTQuMzUzLTMyLjA1OSwzMi4wNTdoNjQuMTE2ICAgQzE3Ny43MSwyNzMuNzY5LDE2My4zNTcsMjU5LjQxNywxNDUuNjUxLDI1OS40MTd6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjlBODgwOyIgZD0iTTQyNS4yODEsMjU5LjQxN2MtMTcuNzA1LDAtMzIuMDU5LDE0LjM1My0zMi4wNTksMzIuMDU3aDY0LjExNiAgIEM0NTcuMzM4LDI3My43NjksNDQyLjk4NSwyNTkuNDE3LDQyNS4yODEsMjU5LjQxN3oiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojNTY1ODZGOyIgZD0iTTExMC44OCwxMjYuOTc0YzYyLjI1LTE0LjI4NywxMTIuNjQzLTkuMzcsMTY4LjQ2NCwzLjYzOWM4LjI3OCwxLjkyOCwxNy4wMjIsNC4wNzksMjYuMjU4LDQuMzYxICBjMTUuMzgsMC40NzEsMzIuNjY5LTMuMzU3LDQ3LjU3NS03LjEwMmM1OC44NS0xNC43ODMsMTA0LjgyMi03LjA5NCwxNDkuMTIzLDIuMzcybC0zLjI3MywyNi4xOCAgYy02LjkxNiwwLjE1My05LjA5MSwzLjM3OC0xMS4wNjcsOS42NzNjLTEwLjM0LDMyLjk0NS0xLjUzNCw4OS42My03Ny45NzgsODIuOTY1Yy01MC4yOS00LjM4NS02NC42OTItMTguMTY0LTg4LjY2LTc4Ljc0NiAgYy0yLjAzOS01LjE1My0zLjM2NS0xMy42NjktMTUuMDExLTEzLjM1NGMtNi41NzYsMC4xNzctMTIuNDU3LDEuMzQtMTQuNTA4LDEyLjc2NWMtMy44MjMsMjEuMjg4LTMyLjg5Myw3OS4xMjktOTEuOTE1LDc5LjA2NSAgYy01Mi4xMzItMC4wNTYtNzIuMDE5LTI3LjExNi03NC4zOTMtODYuNzQzYy0wLjI5NS03LjQwMy02Ljc0Ni04LjgwOS0xMC42MTctOC44OTZMMTEwLjg4LDEyNi45NzRMMTEwLjg4LDEyNi45NzR6Ii8+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzczNzg5MTsiIGQ9Ik0yMDEuMjgxLDExOC43MzRsLTM2LjQwNiwxMjQuMTU1YzkuNTgxLDMuOTQyLDIxLjE0Niw1Ljg4OCwzNS4wMTQsNS45MDIgICBjMC4yNDQsMCwwLjQ4NS0wLjAwOSwwLjcyOS0wLjAxbDM3LjA0LTEyNi4zMTdDMjI1LjU0NCwxMjAuNjMyLDIxMy40ODMsMTE5LjM1LDIwMS4yODEsMTE4LjczNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3Mzc4OTE7IiBkPSJNNDI3LjY3NywxMTkuNzRjLTEyLjExNi0wLjM4OC0yNC42OTMsMC0zNy45MDMsMS40NzVsLTMyLjUwMSwxMTAuODM3ICAgYzguODg4LDcuNDY0LDE5LjM4MSwxMS43OTksMzMuMjM0LDE0LjQ0N0w0MjcuNjc3LDExOS43NHoiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTI5Ny43NjgsNDMwLjY1NkwyOTcuNzY4LDQzMC42NTZjLTUzLjI5NiwwLTk2LjUwMi00My4yMDYtOTYuNTAyLTk2LjUwMmwwLDBoMTkzLjAwNGwwLDAgIEMzOTQuMjcxLDM4Ny40NSwzNTEuMDY1LDQzMC42NTYsMjk3Ljc2OCw0MzAuNjU2eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRjJGMkYyOyIgZD0iTTIyNC44MTIsMzM0LjE1MnYxNS4wNjRjMCw2LjM1Miw1LjE0OSwxMS41LDExLjUsMTEuNWgxMjIuOTExYzYuMzUyLDAsMTEuNS01LjE0OSwxMS41LTExLjV2LTE1LjA2NCAgSDIyNC44MTJ6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGQzRDNTk7IiBkPSJNMjk5Ljc5NCwzOTAuNjE5Yy0yNi4wODYtMTIuMTItNTUuMDMzLTEwLjM1OC03OC41MDcsMi4yMTEgIGMxNy42MzksMjIuOTksNDUuMzc3LDM3LjgyNSw3Ni41OTMsMzcuODI1bDAsMGMxMy43NTcsMCwyNi44MjktMi44OTgsMzguNjcyLTguMDg1ICBDMzI3Ljg2NCw0MDkuMTI3LDMxNS40MDYsMzk3Ljg3MywyOTkuNzk0LDM5MC42MTl6Ii8+CjxwYXRoIGQ9Ik01MDQuMzI2LDEyMC43NTljLTQ2LjMxNi05Ljg5NS05Mi45MDYtMTcuNTE3LTE1My41MTQtMi4yOTNjLTE1LjA5MSwzLjc5Mi0zMC45OTcsNy4yMzctNDQuOTE1LDYuODE1ICBjLTcuNzc2LTAuMjM4LTE1LjUyNi0yLjA0OC0yMy4wMjEtMy44MDFsLTEuMzMyLTAuMzEyYy00OC42MzMtMTEuMzM1LTEwMy4yMzItMTkuNjIxLTE3Mi44MzUtMy42NDcgIGMtNC45NDksMS4xMzUtOC4xODQsNS44OTctNy40MTgsMTAuOTE3bDQsMjYuMThjMC43MTEsNC42NTUsNC42NjMsOC4xMjYsOS4zNyw4LjIzMWMwLjQ3NSwwLjAxLDAuODY1LDAuMDU4LDEuMTY0LDAuMTE1ICBjMS4zNzUsMzMuMDA0LDcuOTY4LDU1LjU2OCwyMC43MzgsNzAuOTgyYzEzLjY1NywxNi40ODQsMzQuMzY3LDI0LjUxMyw2My4zMTQsMjQuNTQzYzAuMDM2LDAsMC4wNzEsMCwwLjEwOSwwICBjMzUuNTk0LDAsNTkuNzkyLTE4LjkyLDczLjgyNy0zNC44MDJjMTUuNzM5LTE3LjgwOSwyNS4xNzEtMzkuMDc0LDI3LjUzNy01Mi4yNDljMC42MTktMy40NDYsMS40NzgtNC4zMDEsMS40ODItNC4zMDUgIGMwLjE0MS0wLjA5MiwwLjgzLTAuNCwzLjc0NS0wLjQ3OGMzLjAyLTAuMDc5LDMuMTMxLTAuMDgxLDQuODUxLDQuODIzYzAuMjk2LDAuODQ0LDAuNTgyLDEuNjU0LDAuODc5LDIuNDAzICBjMTEuNjk3LDI5LjU2NiwyMS45NjYsNTAuNiwzNi45OTksNjQuMDk2YzE1Ljg5NywxNC4yNzMsMzUuNDE4LDE4LjYxNSw1OS44MzYsMjAuNzQ0YzQuNDAxLDAuMzg0LDguNjE0LDAuNTc3LDEyLjY0MiwwLjU3NyAgYzI0LjI0NywwLDQxLjc4Ni02Ljk3NSw1My4zOTUtMjEuMTY5YzAuMjk1LTAuMzYxLDAuNTYxLTAuNzM1LDAuODQ0LTEuMWMwLjUxNyw2LjI5OSwwLjc4OSwxMi42MjksMC43ODksMTguOTY5ICBjMCwxMjYuMTEtMTAyLjU5OCwyMjguNzA3LTIyOC43MDcsMjI4LjcwN1MxOS4zOTcsMzgyLjEwOSwxOS4zOTcsMjU1Ljk5OVMxMjEuOTk0LDI3LjI5MiwyNDguMTAzLDI3LjI5MiAgYzUwLjUzLDAsOTguNDIzLDE2LjE0NSwxMzguNTAxLDQ2LjY5YzQuMjYsMy4yNDcsMTAuMzQ3LDIuNDI1LDEzLjU5Mi0xLjgzNWMzLjI0Ny00LjI2MSwyLjQyNi0xMC4zNDctMS44MzUtMTMuNTk0ICBjLTQzLjQ4NS0zMy4xNC05NS40NDQtNTAuNjU4LTE1MC4yNTktNTAuNjU4QzExMS4yOTksNy44OTQsMCwxMTkuMTk0LDAsMjU1Ljk5OXMxMTEuMjk5LDI0OC4xMDUsMjQ4LjEwMywyNDguMTA1ICBjMTM2LjgwNiwwLDI0OC4xMDUtMTExLjI5OSwyNDguMTA1LTI0OC4xMDVjMC0xOC4wOS0xLjk4LTM2LjEwOS01Ljg0MS01My42MjZjMC45NTgtNC40OTksMS43NS04Ljk2NywyLjUwNy0xMy4yODIgIGMxLjI5Mi03LjM0LDIuNTExLTE0LjI3NCw0LjMzNy0yMC4wODljMC40OTQtMS41NzEsMC44NDgtMi4zOTYsMS4wNi0yLjgxNGMwLjIyLTAuMDMsMC41MzctMC4wNTksMC45NjktMC4wNjkgIGM0LjgwOS0wLjEwNyw4LjgxMi0zLjcyLDkuNDA5LTguNDkzbDMuMjcyLTI2LjE4QzUxMi41NDgsMTI2LjQ1Miw1MDkuMjQ4LDEyMS44MSw1MDQuMzI2LDEyMC43NTl6IE00OTAuMjUsMTQ4LjQzOSAgYy03Ljk4MywzLjQxLTEwLjM3MiwxMS4wMTktMTEuNTQ1LDE0Ljc1NGMtMi4yMDIsNy4wMjEtMy41MjksMTQuNTU4LTQuOTMyLDIyLjUzOWMtMC42NDEsMy42NDUtMS4yNzYsNy4yMjktMS45NzUsMTAuNzE0ICBjLTAuOTc1LDEuNjk3LTEuNDQxLDMuNjg3LTEuMjQ3LDUuNzMzYy01LjU5NywyMy41NzgtMTYuNjE2LDQwLjk4LTU5LjcyNywzNy4yMjJjLTQ1LjU3NS0zLjk3NC01Ny42MS0xNC44MzgtODAuNDg0LTcyLjY1MiAgYy0wLjIwNy0wLjUyNC0wLjQwMy0xLjA5LTAuNjA5LTEuNjhjLTEuODgyLTUuMzY5LTYuMjM5LTE3LjgxMi0yMi43NjYtMTcuODEyYy0wLjMsMC0wLjYwNiwwLjAwNC0wLjkxNCwwLjAxMyAgYy01LjUxNywwLjE0OS0yMC4xNjgsMC41NDMtMjMuNzkzLDIwLjc0NWMtMy4yNzMsMTguMjI4LTI5Ljg3NSw3MS4wODEtODIuMjc1LDcxLjA4MWMtMC4wMjYsMC0wLjA1OCwwLTAuMDg0LDAgIGMtNDQuOTI4LTAuMDQ5LTYyLjQ2Ny0yMS4wMzUtNjQuNzEyLTc3LjQyOWMtMC4zMS03LjgyOS00Ljc3LTEzLjg2LTExLjczMi0xNi41OTlsLTEuNjEtMTAuNTM3ICBjNjEuNjMyLTEyLjQ3NSwxMTEuMDItNC43ODcsMTU1LjI5OCw1LjUzMWwxLjMyLDAuMzA4YzguMDI5LDEuODc4LDE3LjEzLDQuMDA1LDI2Ljg0Miw0LjMwMmMxNi4zMjIsMC40OTUsMzMuNzg1LTMuMjU3LDUwLjIzNS03LjM5ICBjNTIuODQxLTEzLjI3NCw5NC44NjUtNy44MTMsMTM2LjAyOSwwLjYyNUw0OTAuMjUsMTQ4LjQzOXoiLz4KPHBhdGggZD0iTTQwMy45NjksMzM0LjE1MmMwLTUuMzU2LTQuMzQxLTkuNjk5LTkuNjk5LTkuNjk5SDIwMS4yNjZjLTUuMzU4LDAtOS42OTksNC4zNDItOS42OTksOS42OTkgIGMwLDU4LjU2LDQ3LjY0MSwxMDYuMjAxLDEwNi4yMDEsMTA2LjIwMVM0MDMuOTY5LDM5Mi43MTIsNDAzLjk2OSwzMzQuMTUyeiBNMjExLjUwMywzNDMuODUxaDE3Mi41MzEgIGMtNC44MzYsNDMuMzE3LTQxLjY3OSw3Ny4xMDUtODYuMjY1LDc3LjEwNVMyMTYuMzM5LDM4Ny4xNjgsMjExLjUwMywzNDMuODUxeiIvPgo8Y2lyY2xlIGN4PSI0MTYuMzIiIGN5PSI4Ny4xMiIgcj0iOS42OTkiLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reaction-icon-gross-full,#rev-slider2 .rev-content .rev-reaction-icon-selected.rev-reaction-icon-gross,#rev-slider2 .rev-content .rev-reaction-menu-item-icon-gross{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPHBhdGggc3R5bGU9ImZpbGw6I0Y3OENDMjsiIGQ9Ik0yNDEuNjMzLDI4LjMyNGMtMjMuOTMsMC00Ni43MDQsNC45NDItNjcuMzY4LDEzLjg0OWMtMTAuMDgtMTIuNzAxLTI1LjY0LTIwLjg1Ny00My4xMTMtMjAuODU3ICBjLTMwLjM4OSwwLTU1LjAyNSwyNC42MzYtNTUuMDI1LDU1LjAyNWMwLDIuNDIsMC4xNzMsNC43OTgsMC40NzYsNy4xMzVjLTIuOTU0LTAuODc3LTYuMDc5LTEuMzU1LTkuMzE4LTEuMzU1ICBjLTE4LjA1NywwLTMyLjY5NCwxNC42MzgtMzIuNjk0LDMyLjY5M2MwLDE0LjI5OCw5LjE4MywyNi40NDQsMjEuOTY4LDMwLjg4NGMtMy4xMTMsNS4wMDUtNC45MTYsMTAuOTEtNC45MTYsMTcuMjM3ICBjMCwxMy40NDksOC4xMjMsMjQuOTk2LDE5LjcyOCwzMC4wMTZjLTAuMDYzLDEuOTA2LTAuMTA2LDMuODE3LTAuMTA2LDUuNzM4YzAsOTQuMDkxLDc2LjI3NiwxNzAuMzY4LDE3MC4zNjgsMTcwLjM2OCAgUzQxMiwyOTIuNzgyLDQxMiwxOTguNjkxQzQxMi4wMDEsMTA0LjYwMSwzMzUuNzI0LDI4LjMyNCwyNDEuNjMzLDI4LjMyNHoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0NDRTdBMDsiIGQ9Ik0yNjQuNDEsOC42NTdjLTE3Ljc4LDAtMzUuMDQ1LDIuMTk0LTUxLjU1NCw2LjMwMmMwLjQ4MSw1LjU3NCwwLjc0MSwxMS4yMTEsMC43NDEsMTYuOTEgIGMwLDk2LjI0My03MC4wNTcsMTc2LjExLTE2MS45NTQsMTkxLjQyMmMwLjk5MywxMTYuNjY5LDk1Ljg2MiwyMTAuOTQ1LDIxMi43NjcsMjEwLjk0NWMxMTcuNTIxLDAsMjEyLjc5LTk1LjI3LDIxMi43OS0yMTIuNzkgIEM0NzcuMiwxMDMuOTI1LDM4MS45Myw4LjY1NywyNjQuNDEsOC42NTd6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNBRUQ4OTM7IiBkPSJNMzEwLjAxLDQwMi44MjJjLTExMS4wMDEsMC0yMDIuMTM0LTg0Ljk5Ni0yMTEuOTA2LTE5My40NTMgIGMtMTQuNjI1LDYuNDg2LTMwLjIwMSwxMS4yMTItNDYuNDYxLDEzLjkyMWMwLjk5MywxMTYuNjY5LDk1Ljg2MiwyMTAuOTQ1LDIxMi43NjcsMjEwLjk0NWM1NC43MzQsMCwxMDQuNjM1LTIwLjY3MiwxNDIuMzM5LTU0LjYyNyAgQzM3Ny43MjUsMzk0LjQ1LDM0NC44NDUsNDAyLjgyMiwzMTAuMDEsNDAyLjgyMnoiLz4KPHBhdGggc3R5bGU9ImZpbGw6IzdGMTg0QzsiIGQ9Ik0zMTIuMzQ4LDI0Ny4xMTVMMzEyLjM0OCwyNDcuMTE1YzQ1LjkzLDAsODMuMTYzLDM3LjIzNCw4My4xNjMsODMuMTYzdjI1LjI5NUgyMjkuMTg1di0yNS4yOTUgIEMyMjkuMTg1LDI4NC4zNDksMjY2LjQxOSwyNDcuMTE1LDMxMi4zNDgsMjQ3LjExNXoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0I1RTU4OTsiIGQ9Ik0zMTIuMzQ4LDI4NS4yM0wzMTIuMzQ4LDI4NS4yM2MtMjYuOTUsMC00OC43OTYsMjEuODQ3LTQ4Ljc5Niw0OC43OTZ2NTUuOTE1djM3LjUxMnYyMS44MjQgIGMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1bDAsMGM4Ljk4MywwLDE2LjI2NS03LjI4MiwxNi4yNjUtMTYuMjY1djM3LjgwMmMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1ICBjOC45ODMsMCwxNi4yNjUtNy4yODIsMTYuMjY1LTE2LjI2NXYtMjMuMzczYzAsOC45ODMsNy4yODIsMTYuMjY1LDE2LjI2NSwxNi4yNjVjOC45ODMsMCwxNi4yNjUtNy4yODIsMTYuMjY1LTE2LjI2NXYtMzYuMjUyICBWNDA0LjM3di03MC4zNDJDMzYxLjE0NCwzMDcuMDc3LDMzOS4yOTgsMjg1LjIzLDMxMi4zNDgsMjg1LjIzeiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM4QkM2NzM7IiBkPSJNMzQ0Ljg3OCwzOTUuMTljLTE2LjA2MywwLTE2LjI2NSw3LjEwOC0xNi4yNjUsNy4xMDhjLTIuMjM1LDguMjMxLTcuMjgyLDE2LjI2NS0xNi4yNjUsMTYuMjY1ICAgcy0xNi4yNjUtNy4yODItMTYuMjY1LTE2LjI2NWMwLDAsMi43MjQtMjEuNTM1LTE2LjI2NS0yMS41MzVjLTguOTgzLDAtMTYuMjY1LTcuMjgyLTE2LjI2NS0xNi4yNjV2MjYuMDc2djM3LjUxMnYyMS44MjQgICBjMCw4Ljk4Myw3LjI4MiwxNi4yNjUsMTYuMjY1LDE2LjI2NWM4Ljk4MywwLDE2LjI2NS03LjI4MiwxNi4yNjUtMTYuMjY1djM3LjgwMWMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1ICAgYzguOTgzLDAsMTYuMjY1LTcuMjgyLDE2LjI2NS0xNi4yNjV2LTIzLjM3M2MwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1YzguOTgzLDAsMTYuMjY1LTcuMjgyLDE2LjI2NS0xNi4yNjV2LTM2LjI1MiAgIHYtMjMuMDg0di0yNi4wNzZDMzYxLjE0NCwzODcuOTA3LDM1My44NjIsMzk1LjE5LDM0NC44NzgsMzk1LjE5eiIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjMyNi4wNzYiIGN5PSIzNTEuMTM1IiByPSI4LjY1NyIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjMxNC4xMDciIGN5PSIzODcuMTU4IiByPSI4LjY1NyIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjI5MC4yOTYiIGN5PSIzNDIuNDc4IiByPSI4LjY1NyIvPgo8L2c+CjxwYXRoIGQ9Ik0yNjQuNDEsMGMtMTguMTEsMC0zNi4xNTgsMi4yMDctNTMuNjQ0LDYuNTU4Yy00LjEzLDEuMDI4LTYuOSw0LjkwNS02LjUzNCw5LjE0NmMwLjQ3MSw1LjQ0NiwwLjcwOSwxMC44ODQsMC43MDksMTYuMTY2ICBjMCw0NC4xNTYtMTUuNzgyLDg2LjkyNi00NC40MzcsMTIwLjQzM2MtMjEuNTM2LDI1LjE4My00OS4zMjIsNDQuMDI2LTgwLjE4Niw1NC43NTZjLTAuMTI2LTIuNjE1LTAuMTg3LTUuMzM0LTAuMTg3LTguMzY3ICBjMC0xLjYzNCwwLjAzMi0zLjM2NywwLjEwMi01LjQ1MmMwLjExOC0zLjU1NS0xLjk1MS02LjgxOS01LjIxNi04LjIzMmMtOC44MTQtMy44MTEtMTQuNTA3LTEyLjQ3Ni0xNC41MDctMjIuMDcxICBjMC00LjQ5LDEuMjQ4LTguODY5LDMuNjA5LTEyLjY2NGMxLjM5LTIuMjM1LDEuNjg5LTQuOTc5LDAuODEtNy40NjFjLTAuODc3LTIuNDc5LTIuODM2LTQuNDI2LTUuMzIxLTUuMjkgIGMtOS42NjEtMy4zNTQtMTYuMTUyLTEyLjQ4MS0xNi4xNTItMjIuNzA3YzAtMTMuMjU0LDEwLjc4NC0yNC4wMzYsMjQuMDM4LTI0LjAzNmMyLjMyLDAsNC42MjYsMC4zMzYsNi44NTQsMC45OTYgIGMyLjgwOCwwLjgzNyw1Ljg0NywwLjE5LDguMDc3LTEuNzA4YzIuMjMxLTEuOSwzLjM0Ny00Ljc5NywyLjk3MS03LjcwM2MtMC4yNzEtMi4wOTQtMC40MDQtNC4wNjQtMC40MDQtNi4wMjMgIGMwLTI1LjU2NiwyMC44LTQ2LjM2Nyw0Ni4zNjgtNDYuMzY3YzE0LjIyNSwwLDI3LjQ2OCw2LjQwOCwzNi4zMzMsMTcuNThjMi45NzEsMy43NDUsOC40MTcsNC4zNzEsMTIuMTYyLDEuNCAgYzMuNzQ0LTIuOTcxLDQuMzcyLTguNDE3LDEuNC0xMi4xNjJjLTEyLjE2OS0xNS4zMzYtMzAuMzU2LTI0LjEzMS00OS44OTYtMjQuMTMxYy0zNC4xNTIsMC02Mi4xMTEsMjcuMDE5LTYzLjYxNyw2MC44MDYgIGMtMC4wODMtMC4wMDEtMC4xNjYtMC4wMDEtMC4yNDktMC4wMDFjLTIyLjgwMSwwLTQxLjM1MSwxOC41NDktNDEuMzUxLDQxLjM1YzAsMTQuMzYxLDcuNDM5LDI3LjQ1OSwxOS4yMTMsMzQuOTI1ICBjLTEuNDIzLDQuMjI3LTIuMTU4LDguNjgxLTIuMTU4LDEzLjE5NmMwLDE0LjQ4Miw3LjUzOCwyNy43MjgsMTkuNjIzLDM1LjE4NmMtMC4wMDEsMC4xOS0wLjAwMSwwLjM4LTAuMDAxLDAuNTY4ICBjMCw0Ljg4MSwwLjE0NSw5LjE1NCwwLjQ2NCwxMy4zODJjLTQuMzExLDEuMDQ2LTguNjY2LDEuOTQ2LTEzLjA2LDIuNjc4Yy00LjIwMiwwLjcwMS03LjI3LDQuMzUzLTcuMjM1LDguNjEzICBjMC40OTcsNTguNDM0LDIzLjU0LDExMy4zNzcsNjQuODgyLDE1NC43MDRjMzkuNTIxLDM5LjUwOCw5MS40OCw2Mi4yNjksMTQ3LjAyNiw2NC42MDh2Ni42YzAsMTMuNzQyLDExLjE4MSwyNC45MjMsMjQuOTIzLDI0LjkyMyAgYzIuNjUyLDAsNS4yMDktMC40MTcsNy42MDktMS4xODd2MTQuMDY1YzAsMTMuNzQyLDExLjE4MSwyNC45MjMsMjQuOTIyLDI0LjkyM2MxMy42MjIsMCwyNC43MjYtMTAuOTg2LDI0LjkyMS0yNC41NiAgYzIuNCwwLjc3MSw0Ljk1NywxLjE4OCw3LjYxMSwxLjE4OGMxMy43NDIsMCwyNC45MjItMTEuMTgxLDI0LjkyMi0yNC45MjN2LTk5LjQ3NWgyNS43MTFjNC43ODIsMCw4LjY1Ny0zLjg3NSw4LjY1Ny04LjY1N3YtMjUuMjk1ICBjMC01MC42My00MS4xOTItOTEuODItOTEuODIxLTkxLjgycy05MS44Miw0MS4xOS05MS44Miw5MS44MnYyNS4yOTVjMCw0Ljc4MiwzLjg3NSw4LjY1Nyw4LjY1Nyw4LjY1N2gyNS43MXY2MS4xMTcgIGMtNTAuOTIyLTIuMzI4LTk4LjUzMS0yMy4yODEtMTM0Ljc4Ni01OS41MjNjLTM2LjQtMzYuMzg4LTU3LjQxMS04NC4yMjEtNTkuNjIxLTEzNS4zNzRjNDMuODc2LTkuMDI0LDgzLjgzMi0zMi41ODUsMTEzLjE3My02Ni44OTQgIGMzMS4zMzYtMzYuNjQxLDQ4LjU5NC04My40MDgsNDguNTk0LTEzMS42ODdjMC0zLjMzMy0wLjA4Ny02LjcyMS0wLjI1OS0xMC4xMzJjMTMuODk5LTIuOTM3LDI4LjEzMy00LjQyNCw0Mi40MTMtNC40MjQgIGMxMTIuNTYsMCwyMDQuMTMzLDkxLjU3MywyMDQuMTMzLDIwNC4xMzJjMCw1MS41MTktMTkuMjQ2LDEwMC43MTYtNTQuMTkzLDEzOC41MjRjLTMuMjQ2LDMuNTExLTMuMDMsOC45ODgsMC40ODEsMTIuMjMzICBjMy41MTEsMy4yNDYsOC45ODksMy4wMzEsMTIuMjM0LTAuNDgxYzM3LjkxMi00MS4wMTcsNTguNzkyLTk0LjM4Niw1OC43OTItMTUwLjI3NUM0ODUuODU2LDk5LjM0LDM4Ni41MTcsMCwyNjQuNDEsMHogICBNMzUyLjQ4Nyw0NjMuNzA0YzAsNC4xOTctMy40MTMsNy42MS03LjYwOSw3LjYxYy00LjE5NiwwLTcuNjA5LTMuNDEzLTcuNjA5LTcuNjFjMC00Ljc4Mi0zLjg3NS04LjY1Ny04LjY1Ny04LjY1NyAgYy00Ljc4MiwwLTguNjU3LDMuODc1LTguNjU3LDguNjU3djIzLjM3M2MwLDQuMTk3LTMuNDE0LDcuNjEtNy42MSw3LjYxYy00LjE5NiwwLTcuNjA5LTMuNDEzLTcuNjA5LTcuNjF2LTM3LjgwMSAgYzAtNC43ODItMy44NzUtOC42NTctOC42NTctOC42NTdzLTguNjU3LDMuODc1LTguNjU3LDguNjU3YzAsNC4xOTctMy40MTMsNy42MS03LjYwOSw3LjYxYy00LjE5NywwLTcuNjEtMy40MTMtNy42MS03LjYxVjMzNC4wMjYgIGMwLTIyLjEzMywxOC4wMDctNDAuMTM5LDQwLjEzOS00MC4xMzljMjIuMTMyLDAsNDAuMTM5LDE4LjAwNyw0MC4xMzksNDAuMTM5djEyOS42NzhIMzUyLjQ4N3ogTTIzNy44NDEsMzQ2LjkxNnYtMTYuNjM4ICBjMC00MS4wODMsMzMuNDI0LTc0LjUwNyw3NC41MDctNzQuNTA3YzQxLjA4NCwwLDc0LjUwOCwzMy40MjQsNzQuNTA4LDc0LjUwN3YxNi42MzhoLTE3LjA1NXYtMTIuODkgIGMwLTMxLjY3OS0yNS43NzItNTcuNDUyLTU3LjQ1Mi01Ny40NTJzLTU3LjQ1MiwyNS43NzQtNTcuNDUyLDU3LjQ1MnYxMi44OUgyMzcuODQxeiIvPgo8cGF0aCBkPSJNMjUyLjI0NCwxNzAuMDIzYy0zLjM4Mi0zLjM4LTguODYyLTMuMzgtMTIuMjQzLDBsLTE2LjQ1OSwxNi40NTlsLTE2LjQ1OS0xNi40NTljLTMuMzgyLTMuMzgtOC44NjItMy4zOC0xMi4yNDMsMCAgYy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0M2wxNi40NTksMTYuNDU5bC0xNi40NTksMTYuNDU5Yy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0MyAgYzEuNjkxLDEuNjksMy45MDcsMi41MzUsNi4xMjIsMi41MzVjMi4yMTUsMCw0LjQzMS0wLjg0NSw2LjEyMi0yLjUzNWwxNi40NTktMTYuNDU5bDE2LjQ1OSwxNi40NTkgIGMxLjY5MSwxLjY5LDMuOTA3LDIuNTM1LDYuMTIyLDIuNTM1czQuNDMxLTAuODQ1LDYuMTIyLTIuNTM1YzMuMzgxLTMuMzgyLDMuMzgxLTguODYyLDAtMTIuMjQzbC0xNi40NTktMTYuNDU5bDE2LjQ1OS0xNi40NTkgIEMyNTUuNjI0LDE3OC44ODQsMjU1LjYyNCwxNzMuNDAzLDI1Mi4yNDQsMTcwLjAyM3oiLz4KPHBhdGggZD0iTTQxNi4xNDIsMjE1LjE4NGwtMTYuNDU5LTE2LjQ1OWwxNi40NTktMTYuNDU5YzMuMzgxLTMuMzgyLDMuMzgxLTguODYyLDAtMTIuMjQzYy0zLjM4Mi0zLjM4LTguODYyLTMuMzgtMTIuMjQzLDAgIGwtMTYuNDU5LDE2LjQ1OWwtMTYuNDU5LTE2LjQ1OWMtMy4zODItMy4zOC04Ljg2Mi0zLjM4LTEyLjI0MywwYy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0M2wxNi40NTksMTYuNDU5bC0xNi40NTksMTYuNDU5ICBjLTMuMzgxLDMuMzgyLTMuMzgxLDguODYyLDAsMTIuMjQzYzEuNjkxLDEuNjksMy45MDcsMi41MzUsNi4xMjIsMi41MzVjMi4yMTUsMCw0LjQzMS0wLjg0NSw2LjEyMi0yLjUzNWwxNi40NTktMTYuNDU5ICBsMTYuNDU5LDE2LjQ1OWMxLjY5MSwxLjY5LDMuOTA3LDIuNTM1LDYuMTIyLDIuNTM1czQuNDMxLTAuODQ1LDYuMTIyLTIuNTM1QzQxOS41MjMsMjI0LjA0NCw0MTkuNTIzLDIxOC41NjQsNDE2LjE0MiwyMTUuMTg0eiIvPgo8cGF0aCBkPSJNMTU3LjA2Myw5NC40MDhjMS41ODQsMi44NDQsNC41MzEsNC40NDcsNy41Nyw0LjQ0NmMxLjQyNCwwLDIuODcxLTAuMzUzLDQuMjA1LTEuMDk1YzQuMTc3LTIuMzI3LDUuNjc2LTcuNTk4LDMuMzUtMTEuNzc0ICBjLTUuMTgtOS4zMDItMTUuMDA4LTE1LjA3OS0yNS42NDktMTUuMDc5Yy0xMC4zMjIsMC0yMC4xNDQsNS42ODctMjUuNjMyLDE0Ljg0Yy0yLjQ1OCw0LjEwMS0xLjEyOCw5LjQxNywyLjk3MywxMS44NzYgIGM0LjEwMiwyLjQ1Nyw5LjQxNiwxLjEyNywxMS44NzYtMi45NzNjMi4zNzgtMy45NjYsNi41MS02LjQyOSwxMC43ODMtNi40MjlDMTUwLjkwMiw4OC4yMTgsMTU0LjkzNSw5MC41OSwxNTcuMDYzLDk0LjQwOHoiLz4KPHBhdGggZD0iTTEwNy44MzksMTI0LjgwNGMtOC43NDksNS40NzktMTQuMDU0LDE1LjUxMS0xMy44NDUsMjYuMTg1YzAuMDkzLDQuNzIzLDMuOTUsOC40ODgsOC42NTIsOC40ODggIGMwLjA1OCwwLDAuMTE1LDAsMC4xNzItMC4wMDFjNC43ODEtMC4wOTUsOC41OC00LjA0Niw4LjQ4Ny04LjgyNWMtMC4wOTEtNC42MjQsMi4xMDItOC45MDUsNS43MjQtMTEuMTc0ICBjMy42OTgtMi4zMTUsOC4zNzMtMi40NDcsMTIuMjA1LTAuMzM5YzQuMTg3LDIuMzA0LDkuNDUyLDAuNzc3LDExLjc1OC0zLjQxMmMyLjMwNC00LjE4OSwwLjc3Ny05LjQ1Mi0zLjQxMi0xMS43NTggIEMxMjguMjUsMTE4LjgzMywxMTYuODUyLDExOS4xNTQsMTA3LjgzOSwxMjQuODA0eiIvPgo8Y2lyY2xlIGN4PSIzOTguMDg4IiBjeT0iMzg1LjYzNCIgcj0iOC42NTciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reaction-icon-sad-full,#rev-slider2 .rev-content .rev-reaction-icon-selected.rev-reaction-icon-sad,#rev-slider2 .rev-content .rev-reaction-menu-item-icon-sad{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRkRERjZEOyIgY3g9IjI1Ni4wMDIiIGN5PSIyNTYuMDAxIiByPSIyNDUuOTk0Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGQ0M1NkI7IiBkPSJNMzA4LjcxNSw0NjUuNjc3Yy0xMzUuODU4LDAtMjQ1Ljk5My0xMTAuMTM0LTI0NS45OTMtMjQ1Ljk5MyAgYzAtNzIuNTg0LDMxLjQ0My0xMzcuODE2LDgxLjQ0NC0xODIuODQyQzY0LjUyOCw3Ny41NjIsMTAuMDA4LDE2MC40MTIsMTAuMDA4LDI1NmMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkzLDI0NS45OTMsMjQ1Ljk5MyAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk4LDE2NC41NDktNjMuMTQ5QzM4Ni45OTcsNDU1Ljk5OCwzNDguOTg4LDQ2NS42NzcsMzA4LjcxNSw0NjUuNjc3eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMzY3LjkxNCw0MTcuMjM2SDI0OC40NTZjLTUuNTI4LDAtMTAuMDA3LTQuNDc5LTEwLjAwNy0xMC4wMDdzNC40NzktMTAuMDA3LDEwLjAwNy0xMC4wMDdoMTE5LjQ1NyAgIGM1LjUyOCwwLDEwLjAwNyw0LjQ3OSwxMC4wMDcsMTAuMDA3UzM3My40NDIsNDE3LjIzNiwzNjcuOTE0LDQxNy4yMzZ6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTIyMS4wODYsMzE0LjI0OWMtMjQuMzM3LDAtNDYuMzI1LTYuMjI3LTU4LjgxNy0xNi42NThjLTQuMjQzLTMuNTQxLTQuODEtOS44NTMtMS4yNjgtMTQuMDk0ICAgYzMuNTQxLTQuMjQyLDkuODUxLTQuODEsMTQuMDk0LTEuMjY4YzguNzM2LDcuMjkzLDI2Ljc4OCwxMi4wMDYsNDUuOTksMTIuMDA2YzE4Ljc0MywwLDM3LjA0My00LjgwMiw0Ni42MjEtMTIuMjMyICAgYzQuMzY2LTMuMzg4LDEwLjY1LTIuNTk0LDE0LjA0LDEuNzczYzMuMzg4LDQuMzY2LDIuNTk0LDEwLjY1Mi0xLjc3MywxNC4wNEMyNjYuNzExLDMwOC4xMDYsMjQ0LjY5NiwzMTQuMjQ5LDIyMS4wODYsMzE0LjI0OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMzk0LjY3MywzMTQuMjQ5Yy0yNC4zMzcsMC00Ni4zMjUtNi4yMjctNTguODE3LTE2LjY1OGMtNC4yNDMtMy41NDEtNC44MS05Ljg1My0xLjI2OC0xNC4wOTQgICBzOS44NTMtNC44MSwxNC4wOTQtMS4yNjhjOC43MzYsNy4yOTMsMjYuNzg4LDEyLjAwNiw0NS45OSwxMi4wMDZjMTguNzQzLDAsMzcuMDQzLTQuODAyLDQ2LjYyMS0xMi4yMzIgICBjNC4zNjUtMy4zODgsMTAuNjUyLTIuNTk0LDE0LjA0LDEuNzczYzMuMzg4LDQuMzY2LDIuNTk0LDEwLjY1Mi0xLjc3MywxNC4wNEM0NDAuMjk3LDMwOC4xMDYsNDE4LjI4MywzMTQuMjQ5LDM5NC42NzMsMzE0LjI0OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMTczLjY5MSwyNjMuMDRjLTMuNzE5LDAtNy4xOC0wLjQxOC0xMC4yNjUtMS4yNzJjLTUuMzI3LTEuNDczLTguNDUtNi45ODYtNi45NzctMTIuMzE0ICAgYzEuNDc0LTUuMzI3LDYuOTkyLTguNDUyLDEyLjMxNC02Ljk3N2M0LjkyNiwxLjM2NSwxNS4wMzYsMC40MDcsMjYuNTIyLTQuODA0YzExLjI0My01LjA5NywxOC44NzUtMTIuMzEsMjEuNDUyLTE3LjE5NSAgIGMyLjU3OC00Ljg5LDguNjMtNi43NjQsMTMuNTE5LTQuMTg0YzQuODg5LDIuNTc4LDYuNzYyLDguNjMyLDQuMTg0LDEzLjUxOWMtNS4yNDQsOS45NDMtMTYuNzkxLDE5LjY5Ni0zMC44ODksMjYuMDg5ICAgQzE5My4yNDcsMjYwLjU3NSwxODIuNzE1LDI2My4wNCwxNzMuNjkxLDI2My4wNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNNDM5LjQ5LDI2My4wNGMtOS4wMjUsMC0xOS41NTQtMi40NjQtMjkuODYyLTcuMTM5Yy0xNC4wOTctNi4zOTEtMjUuNjQ0LTE2LjE0NC0zMC44ODctMjYuMDg3ICAgYy0yLjU3OS00Ljg4OC0wLjcwNS0xMC45NDEsNC4xODQtMTMuNTE5YzQuODg5LTIuNTgyLDEwLjk0MS0wLjcwMywxMy41MTksNC4xODRjMi41NzgsNC44ODUsMTAuMjA5LDEyLjA5NywyMS40NDksMTcuMTk0ICAgYzExLjQ4Nyw1LjIxLDIxLjYsNi4xNjksMjYuNTIyLDQuODA1YzUuMzMzLTEuNDY5LDEwLjg0LDEuNjQ5LDEyLjMxNCw2Ljk3NmMxLjQ3Myw1LjMyNy0xLjY0OSwxMC44NC02Ljk3NiwxMi4zMTQgICBDNDQ2LjY3LDI2Mi42MjEsNDQzLjIwOCwyNjMuMDQsNDM5LjQ5LDI2My4wNHoiLz4KPC9nPgo8cGF0aCBkPSJNMzU1LjU2MiwyMC4wODRjLTUuMDg4LTIuMTUyLTEwLjk2MSwwLjIzMi0xMy4xMTIsNS4zMjNzMC4yMzIsMTAuOTYzLDUuMzIzLDEzLjExMiAgYzg3LjYwNiwzNy4wMTUsMTQ0LjIxNCwxMjIuMzgyLDE0NC4yMTQsMjE3LjQ4YzAsMTMwLjEyNC0xMDUuODYyLDIzNS45ODUtMjM1Ljk4NCwyMzUuOTg1UzIwLjAxNSwzODYuMTIyLDIwLjAxNSwyNTUuOTk5ICBTMTI1Ljg3OCwyMC4wMTUsMjU2LjAwMSwyMC4wMTVjNS41MjgsMCwxMC4wMDctNC40NzksMTAuMDA3LTEwLjAwN1MyNjEuNTI5LDAsMjU2LjAwMSwwYy0xNDEuMTYsMC0yNTYsMTE0Ljg0LTI1NiwyNTUuOTk5ICBjMCwxNDEuMTYsMTE0Ljg0LDI1Ni4wMDEsMjU2LDI1Ni4wMDFjMTQxLjE1OCwwLDI1NS45OTktMTE0Ljg0LDI1NS45OTktMjU2QzUxMi4wMDEsMTUyLjgzOSw0NTAuNTk0LDYwLjIzNiwzNTUuNTYyLDIwLjA4NHoiLz4KPHBhdGggZD0iTTI0OC40NTYsMzk3LjIyMmMtNS41MjgsMC0xMC4wMDcsNC40NzktMTAuMDA3LDEwLjAwN3M0LjQ3OSwxMC4wMDcsMTAuMDA3LDEwLjAwN2gxMTkuNDU3ICBjNS41MjgsMCwxMC4wMDctNC40NzksMTAuMDA3LTEwLjAwN3MtNC40NzktMTAuMDA3LTEwLjAwNy0xMC4wMDdIMjQ4LjQ1NnoiLz4KPHBhdGggZD0iTTE3NS4wOTcsMjgyLjIzYy00LjI0NC0zLjU0NC0xMC41NTMtMi45NzQtMTQuMDk0LDEuMjY4Yy0zLjU0Myw0LjI0My0yLjk3NCwxMC41NTMsMS4yNjgsMTQuMDk0ICBjMTIuNDkyLDEwLjQzLDM0LjQ4LDE2LjY1OCw1OC44MTcsMTYuNjU4YzIzLjYwOSwwLDQ1LjYyNC02LjE0Myw1OC44ODktMTYuNDMyYzQuMzY3LTMuMzg4LDUuMTYxLTkuNjc0LDEuNzczLTE0LjA0ICBjLTMuMzg5LTQuMzY5LTkuNjc0LTUuMTYtMTQuMDQtMS43NzNjLTkuNTc5LDcuNDI5LTI3Ljg3OSwxMi4yMzItNDYuNjIxLDEyLjIzMkMyMDEuODg1LDI5NC4yMzYsMTgzLjgzMiwyODkuNTIyLDE3NS4wOTcsMjgyLjIzeiIvPgo8cGF0aCBkPSJNMzM1Ljg1NywyOTcuNTkyYzEyLjQ5MiwxMC40MywzNC40OCwxNi42NTgsNTguODE3LDE2LjY1OGMyMy42MDksMCw0NS42MjQtNi4xNDMsNTguODg5LTE2LjQzMiAgYzQuMzY3LTMuMzg4LDUuMTYxLTkuNjc0LDEuNzczLTE0LjA0Yy0zLjM4OC00LjM2OS05LjY3NS01LjE2LTE0LjA0LTEuNzczYy05LjU3OSw3LjQyOS0yNy44NzksMTIuMjMyLTQ2LjYyMSwxMi4yMzIgIGMtMTkuMjAyLDAtMzcuMjU0LTQuNzEzLTQ1Ljk5LTEyLjAwNmMtNC4yNDMtMy41NDQtMTAuNTUyLTIuOTc0LTE0LjA5NCwxLjI2OEMzMzEuMDQ2LDI4Ny43MzksMzMxLjYxNCwyOTQuMDUxLDMzNS44NTcsMjk3LjU5MnoiLz4KPHBhdGggZD0iTTE3My42OTEsMjYzLjA0YzkuMDI0LDAsMTkuNTU0LTIuNDYzLDI5Ljg1OS03LjEzNmMxNC4wOTgtNi4zOTMsMjUuNjQ3LTE2LjE0NSwzMC44ODktMjYuMDg4ICBjMi41NzktNC44ODgsMC43MDUtMTAuOTQxLTQuMTg0LTEzLjUxOWMtNC44ODktMi41ODItMTAuOTQxLTAuNzA1LTEzLjUxOSw0LjE4NGMtMi41NzgsNC44ODUtMTAuMjA5LDEyLjA5Ny0yMS40NTIsMTcuMTk0ICBjLTExLjQ4Niw1LjIxLTIxLjU5NSw2LjE3LTI2LjUyMSw0LjgwNGMtNS4zMjMtMS40NjgtMTAuODQsMS42NDktMTIuMzE0LDYuOTc2Yy0xLjQ3Myw1LjMyNSwxLjY0OCwxMC44NCw2Ljk3NiwxMi4zMTQgIEMxNjYuNTEsMjYyLjYyMSwxNjkuOTcyLDI2My4wNCwxNzMuNjkxLDI2My4wNHoiLz4KPHBhdGggZD0iTTQwOS42MywyNTUuOTA0YzEwLjMwOCw0LjY3MywyMC44MzcsNy4xMzYsMjkuODYxLDcuMTM2YzMuNzE3LDAsNy4xODEtMC40MTgsMTAuMjY2LTEuMjczICBjNS4zMjUtMS40NzQsOC40NDgtNi45ODgsNi45NzMtMTIuMzE0Yy0xLjQ3NC01LjMyNS02Ljk4LTguNDUtMTIuMzE0LTYuOTczYy00LjkyMSwxLjM1Ny0xNS4wMzEsMC40MDYtMjYuNTIxLTQuODA1ICBjLTExLjI0LTUuMDk2LTE4Ljg3My0xMi4zMDktMjEuNDQ5LTE3LjE5NGMtMi41NzgtNC44ODktOC42My02Ljc2NS0xMy41MTktNC4xODRjLTQuODg5LDIuNTc4LTYuNzYyLDguNjMyLTQuMTg0LDEzLjUxOSAgQzM4My45ODQsMjM5Ljc2LDM5NS41MzEsMjQ5LjUxMSw0MDkuNjMsMjU1LjkwNHoiLz4KPGNpcmNsZSBjeD0iMzE5LjEwMiIgY3k9IjE4Ljg0MSIgcj0iMTAuMDA3Ii8+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=)}#rev-slider2 .rev-content .rev-reaction-icon-angry-full,#rev-slider2 .rev-content .rev-reaction-icon-selected.rev-reaction-icon-angry,#rev-slider2 .rev-content .rev-reaction-menu-item-icon-angry{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRkM0QzU5OyIgY3g9IjI1Ni4wMDEiIGN5PSIyNTYuMDAxIiByPSIyNDUuOTk0Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNCQzNCNEE7IiBkPSJNMzA4LjcxNiw0NjUuNjc4Yy0xMzUuODU4LDAtMjQ1Ljk5My0xMTAuMTM0LTI0NS45OTMtMjQ1Ljk5MyAgYzAtNzIuNTg0LDMxLjQ0My0xMzcuODE2LDgxLjQ0NC0xODIuODQyQzY0LjUyNyw3Ny41NjIsMTAuMDA3LDE2MC40MTQsMTAuMDA3LDI1NmMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkzLDI0NS45OTMsMjQ1Ljk5MyAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk4LDE2NC41NDktNjMuMTQ5QzM4Ni45OTgsNDU1Ljk5OSwzNDguOTg3LDQ2NS42NzgsMzA4LjcxNiw0NjUuNjc4eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojN0MxNTJFOyIgZD0iTTQwMS41NTksNDA2LjExNGMtMy41MTMsMC4wMDEtNi45MjEtMS44NTItOC43NTItNS4xNGMtMTIuMjMtMjEuOTUzLTM1LjQyMS0zNS41OTMtNjAuNTItMzUuNTkzICBjLTI0LjQ1MSwwLTQ3Ljg4MiwxMy43NDUtNjEuMTQ2LDM1Ljg2OWMtMi44NDMsNC43MzktOC45OTIsNi4yNzUtMTMuNzI5LDMuNDM3Yy00Ljc0MS0yLjg0Mi02LjI3OS04Ljk4OC0zLjQzNy0xMy43MjkgIGMxNi44NjItMjguMTIyLDQ2Ljg2OS00NS41OTIsNzguMzEyLTQ1LjU5MmMzMi4zNTYsMCw2Mi4yNDYsMTcuNTc2LDc4LjAwNSw0NS44NjhjMi42OSw0LjgyOCwwLjk1NywxMC45MjMtMy44NzIsMTMuNjExICBDNDA0Ljg3Nyw0MDUuNzA2LDQwMy4yMDUsNDA2LjExNCw0MDEuNTU5LDQwNi4xMTR6Ii8+CjxnPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojRkZGRkZGOyIgY3g9IjI1NS40ODEiIGN5PSIyNTAuNTcxIiByPSIyNy4yOTYiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI0MDEuNTQ4IiBjeT0iMjQzLjE5MiIgcj0iMjcuMjk2Ii8+CjwvZz4KPGc+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0MxNTJFOyIgZD0iTTI1NS45NjUsMjg3Ljg5NGMtNC41NDksMC05LjEwOS0wLjgxNC0xMy41MDEtMi40NWMtOS42NjgtMy42MDEtMTcuMzU1LTEwLjc1Mi0yMS42NDUtMjAuMTMzICAgYy00LjMyNy05LjQ2My00LjQwNy0yMC43ODktMC4yMjEtMzEuMDc1YzIuMjc2LTUuNTkyLDUuNzExLTEwLjU2OCw5Ljk4NS0xNC42MDdjLTEuNzkxLTAuOTE5LTMuNjA4LTEuODU3LTUuNDQ5LTIuODEzICAgYy02LjgzNC0zLjU0OC0xMi4zMjgtNi43OTItMTcuNjQtOS45MjdjLTYuMjgxLTMuNzA3LTEyLjc3Ni03LjU0LTIyLjAwNS0xMi4yMTZjLTQuOTMtMi40OTctNi45MDQtOC41MTgtNC40MDYtMTMuNDQ5ICAgYzIuNDk4LTQuOTMyLDguNTE4LTYuOTA1LDEzLjQ1LTQuNDA2YzkuODA1LDQuOTY1LDE2LjU4Miw4Ljk2NywyMy4xMzYsMTIuODM1YzUuMzE2LDMuMTM4LDEwLjMzOCw2LjEwMiwxNi42OSw5LjQgICBjNC4yNzEsMi4yMTgsOC40MTIsNC4zMzMsMTIuMzkzLDYuMzY2YzE3LjAzLDguNywzMS43MzgsMTYuMjEzLDQxLjUyOCwyNC4xNTZjMS4xOTcsMC45NzMsMi4xNTQsMi4yMDcsMi43OTUsMy42MDkgICBjNC4yOTEsOS4zODMsNC42NywxOS44NzYsMS4wNywyOS41NDRjLTMuNjAxLDkuNjY3LTEwLjc1MywxNy4zNTUtMjAuMTM1LDIxLjY0NUMyNjYuODg1LDI4Ni43MTcsMjYxLjQzMywyODcuODk0LDI1NS45NjUsMjg3Ljg5NHogICAgTTI1MC44MDQsMjMwLjAyNGMtNS4yODksMi4wODYtOS40Myw2LjI1NS0xMS42NjksMTEuNzU4Yy0yLjExNSw1LjE5OC0yLjE1OCwxMC43NDEtMC4xMTUsMTUuMjA2ICAgYzIuMDY3LDQuNTIxLDUuNzcxLDcuOTY2LDEwLjQyOSw5LjcwMmM0LjY1NCwxLjczMiw5LjcxLDEuNTUyLDE0LjIzMy0wLjUxNWM0LjUyMi0yLjA2OCw3Ljk2Ny01Ljc3Miw5LjcwMi0xMC40MyAgIGMxLjQ3NC0zLjk2LDEuNTY0LTguMjA2LDAuMjg3LTEyLjE2OUMyNjcuOTM5LDIzOS4zMTgsMjYwLjAxOCwyMzQuODU4LDI1MC44MDQsMjMwLjAyNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3QzE1MkU7IiBkPSJNNDAyLjg1OSwyODEuMDgyYy01LjQ2OSwwLTEwLjkyMS0xLjE3Ny0xNi4wNDItMy41MmMtOS4zODItNC4yOS0xNi41MzMtMTEuOTc4LTIwLjEzNS0yMS42NDUgICBjLTMuNi05LjY2OC0zLjIyMS0yMC4xNiwxLjA3LTI5LjU0NGMwLjcwNS0xLjU0MSwxLjc5MS0yLjg3OSwzLjE1NC0zLjg4N2MxMC41MTgtNy43NywyNC40MS0xNS44NDgsNDEuMjg2LTI0LjAwNyAgIGMyNS4zMjgtMTIuMjQ2LDI3LjAxMi0xMy4yMzQsNDcuNjA4LTI1LjMxNmwzLjEyOS0xLjgzNWM0Ljc2Ny0yLjc5NywxMC44OTktMS4xOTcsMTMuNjk1LDMuNTcxICAgYzIuNzk3LDQuNzY3LDEuMTk3LDEwLjktMy41NzEsMTMuNjk1bC0zLjEyNiwxLjgzM2MtMTguMjY1LDEwLjcxNS0yMi4xNjcsMTMuMDAzLTQwLjQ5OCwyMS45MzUgICBjMy42NTIsMy40OCw2LjU5OCw3LjYzOSw4LjY5LDEyLjM0NWM0LjczNCwxMC42NDYsNC42OSwyMy4yNzgtMC4xMTYsMzMuNzg5Yy00LjI5LDkuMzgyLTExLjk3OCwxNi41MzQtMjEuNjQ1LDIwLjEzNSAgIEM0MTEuOTY5LDI4MC4yNjgsNDA3LjQwOSwyODEuMDgyLDQwMi44NTksMjgxLjA4MnogTTM4NS4xLDIzNi45MjNjLTEuMjI0LDMuOTE4LTEuMTE4LDguMTAyLDAuMzM4LDEyLjAwOSAgIGMxLjczNiw0LjY1OCw1LjE4MSw4LjM2Myw5LjcwMiwxMC40M2M0LjUyMSwyLjA2Niw5LjU3OCwyLjI0NywxNC4yMzMsMC41MTVjNC42NTgtMS43MzYsOC4zNjMtNS4xODEsMTAuNDMtOS43MDIgICBjMi40MTktNS4yOTEsMi40My0xMS45MzMsMC4wMjgtMTcuMzM1Yy0xLjQ4OS0zLjM0OS00LjU4Ni03LjcxMi0xMC45NjUtMTAuMjU2QzM5OS42MTUsMjI3LjQ4OCwzOTEuNjYsMjMyLjI4NywzODUuMSwyMzYuOTIzeiIvPgo8L2c+CjxwYXRoIGQ9Ik00NzAuNDU2LDExNi4xNDVDNDQzLjk3OCw3NS42MjUsNDA2LjgsNDMuNTMzLDM2Mi45NCwyMy4zNDFjLTUuMDI0LTIuMzEtMTAuOTY0LTAuMTE1LTEzLjI3NSw0LjkwNSAgYy0yLjMxMSw1LjAyMS0wLjExNSwxMC45NjUsNC45MDUsMTMuMjc1YzQwLjQzOCwxOC42MTUsNzQuNzE2LDQ4LjIwNiw5OS4xMzMsODUuNTcyQzQ3OC43NDksMTY1LjQyNSw0OTEuOTg3LDIxMCw0OTEuOTg3LDI1NiAgYzAsMTMwLjEyNC0xMDUuODYzLDIzNS45ODQtMjM1Ljk4NSwyMzUuOTg0UzIwLjAxNSwzODYuMTI0LDIwLjAxNSwyNTYuMDAxUzEyNS44NzYsMjAuMDE1LDI1NiwyMC4wMTUgIGM1LjUyOCwwLDEwLjAwNy00LjQ3OSwxMC4wMDctMTAuMDA3UzI2MS41MjgsMCwyNTYsMEMxMTQuODQsMCwwLDExNC44NDIsMCwyNTYuMDAxQzAsMzk3LjE2LDExNC44NCw1MTIsMjU2LDUxMiAgczI1Ni0xMTQuODQsMjU2LTI1NS45OTlDNTEyLDIwNi4xMDEsNDk3LjYzNSwxNTcuNzQsNDcwLjQ1NiwxMTYuMTQ1eiIvPgo8cGF0aCBkPSJNMjUzLjk3MywzOTAuOTZjLTIuODQyLDQuNzQxLTEuMzA0LDEwLjg4NywzLjQzNywxMy43MjljNC43MzcsMi44MzksMTAuODg1LDEuMzAyLDEzLjcyOS0zLjQzNyAgYzEzLjI2NC0yMi4xMjQsMzYuNjk1LTM1Ljg2OSw2MS4xNDYtMzUuODY5YzI1LjEwMSwwLDQ4LjI5LDEzLjYzOSw2MC41MiwzNS41OTNjMS44MzEsMy4yODgsNS4yMzgsNS4xNDEsOC43NTIsNS4xNCAgYzEuNjQ3LDAsMy4zMTgtMC40MDgsNC44NjEtMS4yNjZjNC44MjktMi42OSw2LjU2Mi04Ljc4NCwzLjg3Mi0xMy42MTFjLTE1Ljc2LTI4LjI5My00NS42NS00NS44NjgtNzguMDA1LTQ1Ljg2OCAgQzMwMC44NDIsMzQ1LjM2OCwyNzAuODM1LDM2Mi44MzgsMjUzLjk3MywzOTAuOTZ6Ii8+CjxwYXRoIGQ9Ik0yMzQuMzU3LDE5OS4wNTNjLTYuMzUxLTMuMjk4LTExLjM3Mi02LjI2Mi0xNi42OS05LjRjLTYuNTU0LTMuODY4LTEzLjMzMS03Ljg3LTIzLjEzNi0xMi44MzUgIGMtNC45My0yLjQ5OS0xMC45NTItMC41MjctMTMuNDUsNC40MDZjLTIuNDk4LDQuOTMtMC41MjQsMTAuOTUyLDQuNDA2LDEzLjQ0OWM5LjIyOSw0LjY3NSwxNS43MjUsOC41MDksMjIuMDA2LDEyLjIxNiAgYzUuMzEyLDMuMTM3LDEwLjgwNyw2LjM3OSwxNy42NCw5LjkyN2MxLjg0MSwwLjk1NywzLjY1OSwxLjg5Myw1LjQ0OSwyLjgxM2MtNC4yNzQsNC4wMzktNy43MSw5LjAxNS05Ljk4NSwxNC42MDcgIGMtNC4xODYsMTAuMjg2LTQuMTA2LDIxLjYxMiwwLjIyMSwzMS4wNzVjNC4yOSw5LjM4MiwxMS45NzcsMTYuNTMyLDIxLjY0NSwyMC4xMzNjNC4zOTEsMS42MzYsOC45NTEsMi40NSwxMy41MDEsMi40NSAgYzUuNDY5LDAsMTAuOTIxLTEuMTc3LDE2LjA0Mi0zLjUyYzkuMzgyLTQuMjksMTYuNTM0LTExLjk3OCwyMC4xMzUtMjEuNjQ1YzMuNi05LjY2OCwzLjIyMS0yMC4xNi0xLjA3LTI5LjU0NCAgYy0wLjY0LTEuNDAyLTEuNTk3LTIuNjM4LTIuNzk1LTMuNjA5Yy05Ljc5LTcuOTQzLTI0LjQ5OC0xNS40NTgtNDEuNTI4LTI0LjE1NkMyNDIuNzY5LDIwMy4zODUsMjM4LjYyOSwyMDEuMjcsMjM0LjM1NywxOTkuMDUzeiAgIE0yNzMuNjczLDI0My41NzRjMS4yNzcsMy45NjMsMS4xODksOC4yMDktMC4yODcsMTIuMTY5Yy0xLjczNiw0LjY1OC01LjE4MSw4LjM2My05LjcwMiwxMC40MyAgYy00LjUyMywyLjA2Ny05LjU3OSwyLjI0Ny0xNC4yMzMsMC41MTVjLTQuNjU4LTEuNzM2LTguMzYzLTUuMTgxLTEwLjQyOS05LjcwMmMtMi4wNDMtNC40NjYtMi4wMDEtMTAuMDA5LDAuMTE1LTE1LjIwNiAgYzIuMjM5LTUuNTAxLDYuMzc5LTkuNjcyLDExLjY2OS0xMS43NThDMjYwLjAxOCwyMzQuODU4LDI2Ny45MzksMjM5LjMxOCwyNzMuNjczLDI0My41NzR6Ii8+CjxwYXRoIGQ9Ik00NzMuMDU0LDE4OC41OTZjNC43NjctMi43OTUsNi4zNjYtOC45MjcsMy41NzEtMTMuNjk1Yy0yLjc5NS00Ljc2OS04LjkyNy02LjM2Ni0xMy42OTUtMy41NzFsLTMuMTI5LDEuODM1ICBjLTIwLjU5NiwxMi4wODItMjIuMjc5LDEzLjA3LTQ3LjYwOCwyNS4zMTZjLTE2Ljg3Niw4LjE1OS0zMC43NjksMTYuMjM3LTQxLjI4NiwyNC4wMDdjLTEuMzY0LDEuMDA3LTIuNDUsMi4zNDYtMy4xNTQsMy44ODcgIGMtNC4yOTEsOS4zODMtNC42NywxOS44NzYtMS4wNywyOS41NDRjMy42MDEsOS42NjcsMTAuNzUzLDE3LjM1NSwyMC4xMzUsMjEuNjQ1YzUuMTIyLDIuMzQzLDEwLjU3NCwzLjUyLDE2LjA0MiwzLjUyICBjNC41NDksMCw5LjEwOS0wLjgxNCwxMy41MDEtMi40NWM5LjY2Ny0zLjYwMSwxNy4zNTUtMTAuNzUzLDIxLjY0NS0yMC4xMzVjNC44MDYtMTAuNTEsNC44NS0yMy4xNDIsMC4xMTYtMzMuNzg5ICBjLTIuMDkxLTQuNzA2LTUuMDM3LTguODY1LTguNjktMTIuMzQ1YzE4LjMyOS04LjkzMiwyMi4yMzEtMTEuMjIsNDAuNDk4LTIxLjkzNUw0NzMuMDU0LDE4OC41OTZ6IE00MTkuODA0LDI1MC4xNzQgIGMtMi4wNjgsNC41MjItNS43NzIsNy45NjctMTAuNDMsOS43MDJjLTQuNjU1LDEuNzMyLTkuNzEyLDEuNTUtMTQuMjMzLTAuNTE1Yy00LjUyMi0yLjA2OC03Ljk2Ny01Ljc3Mi05LjcwMi0xMC40MyAgYy0xLjQ1Ni0zLjkwNy0xLjU2MS04LjA5MS0wLjMzOC0xMi4wMDljNi41NTktNC42MzcsMTQuNTE1LTkuNDM0LDIzLjc2OC0xNC4zMzljNi4zNzksMi41NDIsOS40NzYsNi45MDYsMTAuOTY1LDEwLjI1NiAgQzQyMi4yMzQsMjM4LjI0Miw0MjIuMjIyLDI0NC44ODUsNDE5LjgwNCwyNTAuMTc0eiIvPgo8Y2lyY2xlIGN4PSIzMjMuMTMxIiBjeT0iMjAuMDE1IiByPSIxMC4wMDciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-content-inner{background:#fff}#rev-slider2 .rev-content.rev-flipped .rev-flip{-webkit-transform:rotateY(180deg);transform:rotateY(180deg)}@media all and (-ms-high-contrast:none),(-ms-high-contrast:active){#rev-slider2 .rev-content.rev-flipped .rev-flip{-webkit-transform:none;transform:none;overflow:hidden}#rev-slider2 .rev-content.rev-flipped .rev-flip-front{-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0);transition-duration:.5s;transition-property:-webkit-transform;transition-property:transform;transition-timing-function:ease-in-out}#rev-slider2 .rev-content.rev-flipped .rev-flip-back{-webkit-transform:none;transform:none}}#rev-slider2 .rev-content .rev-flip{width:100%;transition:.8s;-webkit-transform-style:preserve-3d;transform-style:preserve-3d;position:relative}#rev-slider2 .rev-content .rev-flip-back,#rev-slider2 .rev-content .rev-flip-front{border-top-left-radius:4px;border-top-right-radius:4px;-webkit-backface-visibility:hidden;backface-visibility:hidden}#rev-slider2 .rev-content .rev-flip-back:after,#rev-slider2 .rev-content .rev-flip-front:after{border-bottom:1px solid #e5e5e5;border-bottom-color:#e5e5e5;content:"";clear:both;display:block}#rev-slider2 .rev-content .rev-flip-front{background:#fff;z-index:2;-webkit-transform:rotateY(0);transform:rotateY(0)}#rev-slider2 .rev-content .rev-flip-back{top:0;left:0;height:100%;-webkit-transform:rotateY(-180deg);transform:rotateY(-180deg);width:100%;-webkit-box-pack:center;justify-content:center;-webkit-box-align:center;align-items:center;position:absolute!important}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu{position:relative;z-index:10000}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-icon{cursor:pointer}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container{visibility:visible}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item{opacity:1;transition:all .5s cubic-bezier(.175,.885,.32,1.275)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(1),#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(5){transition-timing-function:cubic-bezier(.19,1,.22,1)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(1){-webkit-transform:translate3d(59px,19px,0);transform:translate3d(59px,19px,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(2){-webkit-transform:translate3d(104.5px,13.5px,0);transform:translate3d(104.5px,13.5px,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(3){-webkit-transform:translate3d(118px,59px,0);transform:translate3d(118px,59px,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(4){-webkit-transform:translate3d(104.5px,104.5px,0);transform:translate3d(104.5px,104.5px,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(5){-webkit-transform:translate3d(59px,99px,0);transform:translate3d(59px,99px,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(6){-webkit-transform:translate3d(13.5px,104.5px,0);transform:translate3d(13.5px,104.5px,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(7){-webkit-transform:translate3d(0,59px,0);transform:translate3d(0,59px,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(8){-webkit-transform:translate3d(13.5px,13.5px,0);transform:translate3d(13.5px,13.5px,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu-mask{opacity:1!important}#rev-slider2 .rev-content .rev-ad a{display:block;height:100%;color:#222;width:100%;z-index:1000000}#rev-slider2 .rev-content .rev-image{width:100%;position:relative;background-size:cover;background-repeat:no-repeat;background-color:#eee;overflow:hidden;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}#rev-slider2 .rev-content .rev-image img{position:absolute;top:0;left:0;width:100%;display:block;max-width:100%;height:auto}#rev-slider2 .rev-content .rev-headline-icon-container{float:left;display:inline-block;margin-right:7px}#rev-slider2 .rev-content .rev-headline-icon-container .rev-headline-icon{height:34px;width:34px;background-size:contain}#rev-slider2 .rev-content .rev-headline-icon-container .rev-headline-icon .rev-author-initials,#rev-slider2 .rev-content .rev-headline-icon-container .rev-headline-icon .rev-headline-icon-image{border-radius:50%}#rev-slider2 .rev-content .rev-headline-icon-container .rev-headline-icon .rev-headline-icon-image{width:100%;height:100%;display:inline-block;background-size:contain}#rev-slider2 .rev-content .rev-headline-icon-container .rev-headline-icon .rev-author-initials{line-height:34px;text-align:center;font-size:18px;color:#fff}#rev-slider2 .rev-content .rev-description,#rev-slider2 .rev-content .rev-headline{margin-bottom:0}#rev-slider2 .rev-content .rev-headline{color:rgba(0,0,0,.8);font-size:16px;line-height:22px;margin-top:5px}#rev-slider2 .rev-content .rev-description{color:rgba(0,0,0,.44);font-size:12px;line-height:17px;margin-top:8px}#rev-slider2 .rev-content.rev-content-breakpoint-gt-sm .rev-headline{margin-top:14px;font-size:22px;line-height:28px}#rev-slider2 .rev-content.rev-content-breakpoint-gt-sm .rev-description{margin-top:8px;font-size:14px;line-height:20px}#rev-slider2 .rev-content .rev-date,#rev-slider2 .rev-content .rev-headline,#rev-slider2 .rev-content .rev-headline-max-check,#rev-slider2 .rev-content .rev-provider{text-align:left}#rev-slider2 .rev-content .rev-description,#rev-slider2 .rev-content .rev-headline,#rev-slider2 .rev-content .rev-headline-max-check{overflow:hidden}#rev-slider2 .rev-content .rev-description,#rev-slider2 .rev-content .rev-headline-max-check,#rev-slider2 .rev-content .rev-provider{font-weight:400;text-transform:none}#rev-slider2 .rev-content .rev-headline,#rev-slider2 .rev-content .rev-headline-max-check{font-weight:700;letter-spacing:.2px}#rev-slider2 .rev-content .rev-date,#rev-slider2 .rev-content .rev-provider{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}#rev-slider2 .rev-content .rev-provider{color:#888;margin-top:2px;font-size:11px;line-height:16px;height:16px;position:relative;top:-2.5px}#rev-slider2 .rev-content .rev-provider:first-letter{text-transform:uppercase}#rev-slider2 .rev-content .rev-date{color:#b2b2b2;line-height:16px;font-size:12px;font-weight:400;position:relative;display:inline-block}#rev-slider2 .rev-content .rev-date .rev-sponsored-icon{float:right;margin-left:5px;display:inline-block;height:14px}#rev-slider2 .rev-content .rev-date .rev-sponsored-icon svg{fill:#95a2ab;height:100%;width:auto}#rev-slider2 .rev-content .rev-ad{z-index:1}#rev-slider2 .rev-content .rev-ad .rev-ad-container,#rev-slider2 .rev-content .rev-ad .rev-ad-container .rev-ad-outer,#rev-slider2 .rev-content .rev-ad .rev-ad-container .rev-ad-outer .rev-ad-inner{height:100%}#rev-slider2 .rev-content .rev-reactions{padding:9px 0;line-height:0}#rev-slider2 .rev-content .rev-reactions.rev-reactions-single .rev-reaction-bar{-webkit-box-pack:justify;justify-content:space-between}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar{height:20px;display:-webkit-box;display:flex;justify-content:space-around}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction{position:relative;cursor:pointer;line-height:24px;margin-left:33px;display:inline-block}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction:first-child{margin-left:0}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon{background-repeat:no-repeat;line-height:20px;height:20px;min-width:20px;min-height:20px;transition:-webkit-transform .5s;transition:transform .5s}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon:after{line-height:20px;margin-left:28px;clear:both;display:table;color:rgba(90,90,90,.86);font-size:12px}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon.rev-reaction-icon-active,#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon:hover{-webkit-transform:scale(1.04);transform:scale(1.04)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon.rev-reaction-icon-active:after,#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon:hover:after{text-decoration:underline;font-weight:500;color:#2670ff}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon svg{height:100%;width:auto}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon svg path{fill:#95a2ab!important}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-count .rev-reaction-count-inner{font-size:11px;line-height:24px;margin-left:2px;color:rgba(90,90,90,.86)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon{background-size:contain;background-repeat:no-repeat}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon:after{content:"Love"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-exciting:after{content:"Exciting"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-interesting:after{content:"Interesting"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-gross:after{content:"Gross"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-sad:after{content:"Sad"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-angry:after{content:"Angry"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-comment .rev-reaction-icon{background-size:contain}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-comment .rev-reaction-icon:after{content:"Comment"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-share .rev-reaction-icon{background-size:contain}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-share .rev-reaction-icon:after{content:"Share"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container{position:absolute;cursor:default;visibility:hidden;bottom:-66px;left:28px;width:150px;height:150px;border-radius:50%;z-index:100000;z-index:1000000000}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item{position:absolute;cursor:pointer;opacity:0;z-index:100000233}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item.rev-reaction-tip .rev-reaction-menu-item-icon:hover:after{background:rgba(0,0,0,.8);border-radius:5px;bottom:32px;color:#fff;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:500;font-size:11px;letter-spacing:.4px;line-height:18px;padding:0 4px;position:absolute;z-index:1000000000000}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item.rev-reaction-menu-item-count{cursor:default}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item.rev-reaction-menu-item-count .rev-reaction-menu-item-count-inner{width:32px;height:32px;line-height:32px;text-align:center;vertical-align:middle;color:#666;font-size:12px}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item .rev-reaction-menu-item-icon{background-size:cover;width:32px;height:32px;transition:-webkit-transform .2s;transition:transform .2s}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item .rev-reaction-menu-item-icon:hover{-webkit-transform:scale(1.1) translateY(-3px);transform:scale(1.1) translateY(-3px)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-mask{width:100%;height:100%;z-index:1000000;background:rgba(255,255,255,.85);background:radial-gradient(ellipse at center,#fff 0,rgba(255,255,255,.6) 100%);border-radius:50%;opacity:0;transition:opacity .5s}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-mask .rev-reaction-menu-mask-inner{position:absolute;top:50%;left:50%;width:28px;height:28px;line-height:28px;text-align:center;margin-left:-25px;padding:10px;margin-top:-24px;box-sizing:content-box;border-radius:50%}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-mask .rev-reaction-menu-mask-inner svg{fill:#666}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(1),#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(5){text-align:center}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(1){-webkit-transform:translate3d(59px,39px,0);transform:translate3d(59px,39px,0)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(2){-webkit-transform:translate3d(84.5px,33.5px,0);transform:translate3d(84.5px,33.5px,0)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(2) .rev-reaction-menu-item-icon:hover:after{content:"Love"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(3){-webkit-transform:translate3d(98px,59px,0);transform:translate3d(98px,59px,0)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(3) .rev-reaction-menu-item-icon:hover:after{content:"Exciting"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(4){-webkit-transform:translate3d(84.5px,84.5px,0);transform:translate3d(84.5px,84.5px,0)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(4) .rev-reaction-menu-item-icon:hover:after{content:"Interesting"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(5){-webkit-transform:translate3d(59px,79px,0);transform:translate3d(59px,79px,0)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(6){-webkit-transform:translate3d(33.5px,84.5px,0);transform:translate3d(33.5px,84.5px,0);z-index:1000000112}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(6) .rev-reaction-menu-item-icon:hover:after{content:"Gross"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(7){-webkit-transform:translate3d(20px,59px,0);transform:translate3d(20px,59px,0);z-index:1000000111}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(7) .rev-reaction-menu-item-icon:hover:after{content:"Sad"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(8){-webkit-transform:translate3d(33.5px,33.5px,0);transform:translate3d(33.5px,33.5px,0)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(8) .rev-reaction-menu-item-icon:hover:after{content:"Angry"}#rev-slider2 .rev-content .rev-reactions-total{line-height:0;padding:9px 0;background:#f6f7f9;border-top:1px solid #e5e5e5;border-top-color:#e5e5e5;border-bottom-left-radius:4px;border-bottom-right-radius:4px}#rev-slider2 .rev-content .rev-reactions-total .rev-reactions-total-inner{display:inline-block;height:20px}#rev-slider2 .rev-content .rev-reactions-total .rev-reactions-total-inner .rev-reaction{display:inline-block;position:relative;border-radius:10px;background:#f6f7f9;margin-left:-4px;height:20px;padding:2px}#rev-slider2 .rev-content .rev-reactions-total .rev-reactions-total-inner .rev-reaction:first-child{margin-left:0}#rev-slider2 .rev-content .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner{width:16px;height:16px}#rev-slider2 .rev-content .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner .rev-reaction-icon{position:absolute;width:16px;height:16px;background-size:cover}#rev-slider2 .rev-content .rev-reactions-total .rev-reactions-total-inner .rev-reaction-count{display:inline-block;float:right;font-size:12px;line-height:20px;margin-left:4px;color:rgba(90,90,90,.86)}#rev-slider2 .rev-content .rev-comments .rev-comment:after,#rev-slider2 .rev-content .rev-comments:after{clear:both;display:table;content:""}#rev-slider2 .rev-content .rev-comments{background:#f6f7f9;border-top:1px solid #e5e5e5;border-top-color:#e5e5e5;border-bottom-right-radius:4px;border-bottom-left-radius:4px}#rev-slider2 .rev-content .rev-comments.rev-has-comments .rev-reactions-total{margin-bottom:9px;border-bottom:1px solid #e5e5e5}#rev-slider2 .rev-content .rev-comments .rev-comment{padding-bottom:12px}#rev-slider2 .rev-content .rev-comments .rev-comment:first-child{padding-top:12px}#rev-slider2 .rev-content .rev-comments .rev-comment .rev-comment-image{float:left;background-repeat:no-repeat;border-radius:24px;width:24px;height:24px;background-size:cover}#rev-slider2 .rev-auth,#rev-slider2 .rev-auth-mask{width:100%;height:100%;border-top-right-radius:4px;border-top-left-radius:4px}#rev-slider2 .rev-content .rev-comments .rev-comment .rev-comment-text{font-size:12px;line-height:1.34;padding-left:10px;overflow:hidden}#rev-slider2 .rev-content .rev-comments .rev-comment .rev-comment-text .rev-comment-author{font-weight:600}#rev-slider2 .rev-content .rev-comments .rev-comment .rev-comment-text .rev-comment-date{color:#90949c}#rev-slider2 .rev-auth-mask{position:absolute;background:radial-gradient(ellipse at center 100%,rgba(255,255,255,0) 55%,rgba(0,0,0,.2) 118%)}#rev-slider2 .rev-auth{-webkit-box-orient:vertical;-webkit-box-direction:normal;display:flex;flex-direction:column;color:#222;text-shadow:1px 1px rgba(255,255,255,.15)}#rev-slider2 .rev-auth .rev-auth-close-button{display:inline-block;cursor:pointer;transition:all .2s ease-in-out!important;width:35px!important;height:35px;margin-left:auto}#rev-slider2 .rev-auth .rev-auth-close-button:hover{-webkit-transform:scale(1.2)!important;transform:scale(1.2)!important}#rev-slider2 .rev-auth .rev-auth-close-button svg{fill:#bdbdbd;width:100%;height:100%}#rev-slider2 .rev-auth .rev-auth-box{-webkit-box-orient:vertical;-webkit-box-direction:normal;flex-direction:column;display:-webkit-box;display:flex;-webkit-box-align:center;align-items:center;-webkit-box-pack:end;justify-content:flex-end;height:100%}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-box-inner{min-width:320px;max-width:420px;margin-bottom:3%}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-site-logo{max-height:184px;box-shadow:rgba(0,0,0,.3) 1px 1px 9px;display:-webkit-box;display:flex;-webkit-box-flex:1;flex-grow:1;-webkit-box-align:center;align-items:center}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-site-logo img,#rev-slider2 .rev-auth .rev-auth-box .rev-auth-site-logo svg{width:100%}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-button{height:50px;line-height:0;display:-webkit-box;display:flex;-webkit-box-pack:center;justify-content:center;background-color:#3A559F;cursor:pointer;margin-top:32px;border-radius:4px;max-width:295px;margin-left:auto;margin-right:auto;text-shadow:none;position:relative;-webkit-box-align:end;align-items:flex-end}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-button:after,#rev-slider2 .rev-auth .rev-auth-box .rev-auth-button:before{z-index:-1;position:absolute;content:"";bottom:15px;left:10px;width:50%;top:8%;background:0 0;box-shadow:0 15px 10px rgba(0,0,0,.3);-webkit-transform:rotate(-2deg);transform:rotate(-2deg)}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-button:after{-webkit-transform:rotate(2deg);transform:rotate(2deg);right:10px;left:auto}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-button .rev-auth-button-icon{width:42px;height:42px;background-color:#3A559F}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-button .rev-auth-button-text{color:#fff;line-height:50px;padding-left:5px;padding-right:20px;font-size:16px}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-terms{display:-webkit-box;display:flex;justify-content:space-around;margin-top:42px;opacity:.8}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-terms a,#rev-slider2 .rev-auth .rev-auth-box .rev-auth-terms span{font-size:14px;line-height:14px;letter-spacing:.7px;font-weight:300}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-terms a{cursor:pointer}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-headline{text-align:center;font-size:20px;line-height:26px;margin-top:32px}#rev-slider2 .rev-auth .rev-auth-box .rev-auth-headline strong{font-weight:500}#rev-slider2 .rev-auth .rev-auth-subline{font-size:12px;line-height:12px;font-weight:400;text-align:center;margin-top:15px}#rev-feed #rev-slider2 .rev-content.rev-colspan-2 .rev-headline{font-size:14px}#rev-feed #rev-slider2.rev-slider-window-width .rev-head{margin-left:3px!important;margin-right:3px!important}#rev-feed #rev-slider2.rev-slider-window-width #rev-slider-inner{background-color:#f2f2f2}#rev-feed #rev-slider2.rev-slider-window-width #rev-slider-inner .rev-content-inner{border-radius:0}#rev-feed .rev-content.rev-colspan-2 .rev-after-image{margin:0!important}.rev-slider-breakpoint-lt-sm #rev-feed .rev-content.rev-colspan-3,.rev-slider-breakpoint-lt-sm #rev-feed .rev-content.rev-colspan-6{padding-bottom:5px}#rev-feed .rev-content.rev-headline-top .rev-after-image{padding-top:1.7%}#rev-feed .rev-content.rev-headline-top .rev-headline{margin-left:4px;margin-right:4px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-before-image{border-top-left-radius:2px;border-top-right-radius:2px}#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner{box-shadow:0 2px 8px -4px #000}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner{border:1px solid #ddd;border-radius:4px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-after-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-before-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-content-header,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-flip-front:after,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-reactions,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-before-image,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-content-header,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-flip-front:after,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-reactions{margin-left:8px;margin-right:8px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-comments,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-reactions-total,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-comments,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-reactions-total{padding-left:8px;padding-right:8px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-after-image{margin-bottom:8px;padding:9px 0}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-after-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-before-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-content-header,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-flip-front:after,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-reactions,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-before-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-content-header,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-flip-front:after,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-reactions{margin-left:10px;margin-right:10px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-comments,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-reactions-total,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-comments,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-reactions-total{padding-left:10px;padding-right:10px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-after-image{margin-bottom:10px;padding:9px 0}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-after-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-before-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-content-header,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-flip-front:after,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-reactions,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-before-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-content-header,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-flip-front:after,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-reactions{margin-left:14px;margin-right:14px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-comments,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-reactions-total,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-comments,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-reactions-total{padding-left:14px;padding-right:14px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-after-image{margin-bottom:14px;padding:9px 0}#rev-feed .rev-content .rev-meta{padding-top:11px;margin-bottom:10px}#rev-feed .rev-content .rev-meta .rev-meta-inner{height:34px;line-height:0}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-meta-content{overflow:hidden;line-height:16px}@-webkit-keyframes anim-effect-novak{0%{opacity:1;-webkit-transform:scale3d(.1,.1,1);transform:scale3d(.1,.1,1)}100%{opacity:0;-webkit-transform:scale3d(8,8,1);transform:scale3d(8,8,1)}}@keyframes anim-effect-novak{0%{opacity:1;-webkit-transform:scale3d(.1,.1,1);transform:scale3d(.1,.1,1)}100%{opacity:0;-webkit-transform:scale3d(8,8,1);transform:scale3d(8,8,1)}}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save{position:relative;display:inline-block;padding:0;border:none;background:0 0;color:#286aab;font-size:1.4em;overflow:visible;transition:color .7s;-webkit-tap-highlight-color:transparent;float:right;margin:0;width:34px;z-index:10000}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save.rev-save-active svg polygon{fill:rgba(90,90,90,.25)}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save.rev-save-active::after{-webkit-animation:anim-effect-novak .5s forwards;animation:anim-effect-novak .5s forwards}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save.rev-save-active,#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save:focus{outline:0}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save::after{position:absolute;top:50%;left:50%;margin:-35px 0 0 -35px;width:70px;height:70px;border-radius:50%;content:"";opacity:0;pointer-events:none;background:rgba(111,148,182,.25)}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save svg polygon{stroke:rgba(90,90,90,.86)}#rev-feed .rev-content .rev-meta svg path{fill:#95a2ab!important}#rev-feed .rev-content .rev-meta .rev-provider{margin-top:0!important;margin-left:0!important;font-size:13px;line-height:18px;top:-2.5px;height:auto;letter-spacing:.3px;font-weight:700;color:#333}#rev-feed .rev-content.rev-headline-top .rev-headline{margin-top:0;padding-bottom:.5%}#rev-feed ul.rc-reaction-bar li{width:24px;height:24px;margin-right:3px}#rev-feed ul.rc-reaction-bar{padding:0;line-height:0;margin:0}#rev-feed section.rc-reaction-bar-rounded ul li.rc-react{margin-bottom:9px}#rev-feed ul.rc-reaction-bar li div.rc-face{height:inherit}#rev-feed ul.rc-reaction-bar li span.rc-count{width:20px;height:20px;line-height:16px;left:15px;bottom:-9px}body.rev-blur>*{-webkit-filter:blur(5px)!important;filter:blur(5px)!important}@-webkit-keyframes spin{100%{-webkit-transform:rotate(-360deg);transform:rotate(-360deg)}}@keyframes spin{100%{-webkit-transform:rotate(-360deg);transform:rotate(-360deg)}}#personalized-transition-mask{position:fixed;top:0;bottom:0;height:100%;opacity:.25;width:100%;background:#fff;-webkit-filter:none!important;filter:none!important}#personalized-transition-wrapper{position:fixed;-webkit-filter:none!important;filter:none!important;width:70%;left:50%;top:50%;margin-top:-35%;margin-left:-35%;z-index:1000;padding-top:70%}#personalized-transition-wrapper #personalized-transition-animation{-webkit-animation:spin 15s linear infinite;animation:spin 15s linear infinite;width:100%;height:100%;position:absolute;top:0;z-index:10001;background-size:cover;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI0MzkuMjE4cHgiIGhlaWdodD0iNDQwLjcxM3B4IiB2aWV3Qm94PSIwIDAgNDM5LjIxOCA0NDAuNzEzIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA0MzkuMjE4IDQ0MC43MTMiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxnPjxnPjxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik0zMTguMTM0LDI3My40MDlsMjUuMTY3LDQuNDRsMTEuMzIzLTM0Ljc4OGwtMjMuMDk3LTEwLjc5OWMxLjczNy0xNC43NzEsMC40MDktMjkuNDMzLTMuNjItNDMuMjNsMjAuOTc4LTE0LjM4M2wtMTYuOTY1LTMyLjQ4NWwtMjQuMDgsOC40NDZjLTkuMDUzLTExLjI1Mi0yMC4zOTItMjAuODQyLTMzLjYwNS0yOC4wMzlsNC41MDktMjQuNzg5TDI0My40MjYsODYuNjNsLTEwLjk2NywyMi43NDhjLTE1LjAwMS0xLjcxMy0yOS44ODktMC40MDUtNDMuODk4LDMuNTY2bC0xNC42MDMtMjAuNjYxbC0zMi45ODEsMTYuNzExbDguNTc2LDIzLjcxNWMtMTEuNDI0LDguOTE3LTIxLjE2LDIwLjA4Ny0yOC40NjgsMzMuMWwtMjUuMTY2LTQuNDM5bC0xMS4zMjQsMzQuNzg4bDIzLjA5NywxMC43OTljLTEuNzM3LDE0Ljc3My0wLjQwOSwyOS40MzYsMy42MjEsNDMuMjMzbC0yMC45NzcsMTQuMzgzbDE2Ljk2OCwzMi40ODNsMjQuMDc4LTguNDQ2YzkuMDU0LDExLjI1MSwyMC4zOTQsMjAuODQxLDMzLjYwNiwyOC4wMzhsLTQuNTA4LDI0Ljc4N2wzNS4zMTksMTEuMTUzbDEwLjk2Ni0yMi43NDljMTQuOTk4LDEuNzExLDI5Ljg4NSwwLjQwMyw0My44OTMtMy41NjVsMTQuNjA0LDIwLjY2bDMyLjk4MS0xNi43MTJsLTguNTc2LTIzLjcxNUMzMDEuMDg5LDI5Ny41ODksMzEwLjgyNiwyODYuNDIyLDMxOC4xMzQsMjczLjQwOXoiLz48L2c+PGc+PHBhdGggZmlsbD0iIzE5MzY1MSIgZD0iTTIwMC41MDIsMzYzLjQ3bC01MC4yNTEtMTUuODdsNC43OTQtMjYuMzYzYy05Ljg5OS02LjA5NC0xOC43NzktMTMuNTEyLTI2LjUwMy0yMi4xMzhsLTI1LjU4OSw4Ljk3NmwtMjQuMjMzLTQ2LjM5N2wyMi4zMzEtMTUuMzFjLTIuNjAzLTExLjE1NC0zLjU1Ny0yMi41MjgtMi44NDQtMzMuOTU3bC0yNC41ODMtMTEuNDkybDE2LjE4NC00OS43MjFsMjYuNzUzLDQuNzE5YzYuMTgxLTkuNzUsMTMuNjkyLTE4LjQ5NCwyMi40MTgtMjYuMDk3bC05LjEyMS0yNS4yMzVsNDYuOTUzLTIzLjc4NmwxNS41MDcsMjEuOTQxYzExLjM2OC0yLjU4NSwyMy4wNDctMy41NTcsMzQuNzU4LTIuODIybDExLjY0OC0yNC4xNjdsNTAuMjQ2LDE1Ljg3bC00Ljc5MywyNi4zNjNjOS45MDIsNi4wOTMsMTguNzgzLDEzLjUxMiwyNi41MDgsMjIuMTM4bDI1LjU4NC04Ljk3NmwyNC4yMzQsNDYuNDAybC0yMi4zMzYsMTUuMzEzYzIuNjA0LDExLjE1LDMuNTU3LDIyLjUxOSwyLjg0NCwzMy45NDRsMjQuNTg0LDExLjQ5NmwtMTYuMTg2LDQ5LjcyMmwtMjYuNzUzLTQuNzJjLTYuMTc3LDkuNzQ2LTEzLjY4NywxOC40OS0yMi40MTgsMjYuMDk3bDkuMTIsMjUuMjNsLTQ2Ljk1MywyMy43OTJsLTE1LjUwNy0yMS45NDVjLTExLjM1NCwyLjU4NS0yMy4wMTcsMy41MzgtMzQuNzQ5LDIuODI1TDIwMC41MDIsMzYzLjQ3eiBNMTcwLjcwNSwzMzUuMjczbDIwLjM5Myw2LjQzOWwxMC4zNjMtMjEuNDk2bDYuMzIsMC43MjJjMTMuNTQ3LDEuNTU3LDI3LjM0OCwwLjQyLDQwLjQzNi0zLjI4MWw2LjA5OC0xLjcyOGwxMy43OTYsMTkuNTE3bDE5LjAxMS05LjYzNWwtOC4wODgtMjIuMzY1bDUuMTE4LTMuOTk5YzEwLjczNC04LjM4MSwxOS41MzktMTguNjIxLDI2LjE3LTMwLjQyN2wzLjExNS01LjUzOGwyMy43NTMsNC4xOWw2LjQ2NC0xOS44NTRsLTIxLjc3OS0xMC4xODNsMC43NTgtNi40MjFjMS41NzMtMTMuMzgxLDAuNDU0LTI2LjczMS0zLjMyNS0zOS42N2wtMS44Mi02LjIzbDE5Ljc4MS0xMy41NTlsLTkuNzAzLTE4LjU3NGwtMjIuNzMyLDcuOTc5bC0zLjk3Mi00LjkzNGMtOC41MDMtMTAuNTc4LTE4LjkwNS0xOS4yNTEtMzAuOTA4LTI1Ljc4NmwtNS42OTEtMy4xMDJsNC4yNTctMjMuMzk0bC0yMC4zODktNi40MzlsLTEwLjM2MiwyMS40OTVsLTYuMzI1LTAuNzIyYy0xMy41NDctMS41NDgtMjcuMzQ4LTAuNDMzLTQwLjQzNiwzLjI4MWwtNi4xMDMsMS43MzJsLTEzLjc5Ni0xOS41MjJsLTE5LjAxMSw5LjYzMmw4LjA4OSwyMi4zNzVsLTUuMTIzLDMuOTkzYy0xMC43Myw4LjM3Ni0xOS41MzEsMTguNjEyLTI2LjE2NywzMC40MjdsLTMuMTE1LDUuNTM4bC0yMy43NTEtNC4xOTFsLTYuNDY1LDE5Ljg1NGwyMS43NzksMTAuMThsLTAuNzU2LDYuNDIyYy0xLjU3NSwxMy4zODktMC40NTUsMjYuNzM0LDMuMzI0LDM5LjY3OGwxLjgyLDYuMjI5bC0xOS43NzYsMTMuNTYxbDkuNzAyLDE4LjU2OGwyMi43MzMtNy45NzlsMy45NjcsNC45MzVjOC41MTIsMTAuNTcyLDE4LjkxNSwxOS4yNSwzMC45MTcsMjUuNzlsNS42ODcsMy4wOTdMMTcwLjcwNSwzMzUuMjczeiIvPjwvZz48Zz48cGF0aCBmaWxsPSIjMjdBMkRFIiBkPSJNMjQ0LjUxNCwxNDMuMDk4Yy00Mi45MDItMTMuNTQ3LTg4LjgzMSw5LjcyNy0xMDIuNTg1LDUxLjk4M2MtMTMuNzU1LDQyLjI1Nyw5Ljg3NCw4Ny40OTIsNTIuNzc2LDEwMS4wNGM0Mi45MDEsMTMuNTQ4LDg4LjgzMS05LjcyNiwxMDIuNTg2LTUxLjk4M0MzMTEuMDQ1LDIwMS44ODYsMjg3LjQxNiwxNTYuNjQ1LDI0NC41MTQsMTQzLjA5OHoiLz48L2c+PGc+PHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0iTTIzMC41NjksMTg1LjkzOGMtMTguODgtNS45NjItMzkuMDkzLDQuMjgtNDUuMTQ2LDIyLjg3N2MtNi4wNTIsMTguNTk2LDQuMzQ2LDM4LjUwMywyMy4yMjcsNDQuNDY1YzE4Ljg4LDUuOTYyLDM5LjA5My00LjI4MSw0NS4xNDYtMjIuODc2QzI1OS44NDksMjExLjgxLDI0OS40NSwxOTEuOSwyMzAuNTY5LDE4NS45Mzh6Ii8+PC9nPjxnPjxwYXRoIGZpbGw9IiMxOTM2NTEiIGQ9Ik0yMTkuNjI2LDI2My45MzhjLTAuMDA0LDAsMCwwLTAuMDA0LDBjLTQuNjI4LDAtOS4yMjktMC43MTMtMTMuNjctMi4xMTdjLTExLjUwMy0zLjYzMS0yMC44NTYtMTEuNDkxLTI2LjMzMy0yMi4xMjljLTUuMzk3LTEwLjQ5NC02LjM2LTIyLjQ0NC0yLjcxMS0zMy42NTFjNS45ODgtMTguMzk4LDIzLjE0Ny0zMC43Niw0Mi42OTItMzAuNzZjNC42MjgsMCw5LjIyNiwwLjcwOCwxMy42NjksMi4xMTNjMTEuNTA0LDMuNjM0LDIwLjg1NiwxMS40OTUsMjYuMzI4LDIyLjEzOGM1LjM5OCwxMC40OTMsNi4zNjEsMjIuNDM5LDIuNzEzLDMzLjY0NkMyNTYuMzI2LDI1MS41NzIsMjM5LjE3MSwyNjMuOTM4LDIxOS42MjYsMjYzLjkzOHogTTIxOS42MDEsMTkzLjE5OGMtMTEuNzY3LDAtMjIuMDc3LDcuMzg4LTI1LjY2LDE4LjM5Yy0yLjE1Nyw2LjYyNi0xLjU4MywxMy42OTUsMS42MSwxOS45MDZjMy4yNzEsNi4zNTYsOC44ODQsMTEuMDU4LDE1Ljc5NSwxMy4yNDJjMi42OTksMC44NTMsNS40ODEsMS4yODUsOC4yNzYsMS4yODVjMTEuNzY3LDAsMjIuMDc3LTcuMzkzLDI1LjY1LTE4LjM4OWMyLjE2MS02LjYyNywxLjU4OS0xMy42OTUtMS42MDUtMTkuOTA3Yy0zLjI3MS02LjM1Ni04Ljg4LTExLjA2My0xNS43OTUtMTMuMjQ1QzIyNS4xODIsMTkzLjYzMSwyMjIuMzk2LDE5My4xOTgsMjE5LjYwMSwxOTMuMTk4eiIvPjwvZz48Zz48cGF0aCBmaWxsPSIjMTkzNjUxIiBkPSJNMjE3LjM4Nyw0MzIuMjE1Yy0zMS40MTYsMC02Mi44MjMtNi44NzEtOTEuNDU3LTIwLjYybDcuNzUyLTE2LjE0OWM1Mi40MTYsMjUuMTUyLDExNC45OTksMjUuMTY1LDE2Ny40MTYtMC4wMDRsNy43NSwxNi4xNDhDMjgwLjIxNCw0MjUuMzM5LDI0OC43OTksNDMyLjIxNSwyMTcuMzg3LDQzMi4yMTV6Ii8+PC9nPjxnPjxwb2x5Z29uIGZpbGw9IiMxOTM2NTEiIHBvaW50cz0iMzAyLjU0LDQzOS4yMTggMjg2LjI5NCw0MzEuNjYgMjk3LjUxLDQwNy41NjYgMjczLjQxMiwzOTYuMzUyIDI4MC45NzEsMzgwLjEwNSAzMjEuMzE0LDM5OC44ODkgIi8+PC9nPjxnPjxwYXRoIGZpbGw9IiMxOTM2NTEiIGQ9Ik0zMDUuNTM3LDQzLjc3OGMtNTIuNDI2LTI1LjE2NS0xMTUuMDAzLTI1LjE2MS0xNjcuNDExLTAuMDA0bC03Ljc1Mi0xNi4xNDlDMTg3LjY0MiwwLjEzNiwyNTYuMDIsMC4xMjgsMzEzLjI4OCwyNy42MjlMMzA1LjUzNyw0My43Nzh6Ii8+PC9nPjxnPjxwb2x5Z29uIGZpbGw9IiMxOTM2NTEiIHBvaW50cz0iMTU4LjI1MSw1OS4xMTQgMTE3LjkwOCw0MC4zMzIgMTM2LjY3OCwwIDE1Mi45MjQsNy41NiAxNDEuNzEyLDMxLjY1MiAxNjUuODExLDQyLjg2OSAiLz48L2c+PGc+PHBhdGggZmlsbD0iIzE5MzY1MSIgZD0iTTQxMS41OTQsMzEzLjI4OGwtMTYuMTQ4LTcuNzUxYzI1LjE2LTUyLjQyMSwyNS4xNi0xMTUuMDAzLTAuMDA1LTE2Ny40MTFsMTYuMTQ5LTcuNzZDNDM5LjA4NywxODcuNjM0LDQzOS4wOTEsMjU2LjAxMiw0MTEuNTk0LDMxMy4yODh6Ii8+PC9nPjxnPjxwb2x5Z29uIGZpbGw9IiMxOTM2NTEiIHBvaW50cz0iMzk2LjM1MSwxNjUuODA2IDM4MC4xMDQsMTU4LjI0OCAzOTguODg4LDExNy45MDMgNDM5LjIxOCwxMzYuNjc4IDQzMS42NTksMTUyLjkyNCA0MDcuNTY1LDE0MS43MDkgIi8+PC9nPjxnPjxwYXRoIGZpbGw9IiMxOTM2NTEiIGQ9Ik0yNy42MjgsMzA4Ljg0OGMtMjcuNDk3LTU3LjI2OC0yNy40OTctMTI1LjY1LDAtMTgyLjkxOGwxNi4xNDksNy43NTJjLTI1LjE2NSw1Mi40MTYtMjUuMTY1LDExNC45OTksMCwxNjcuNDE2TDI3LjYyOCwzMDguODQ4eiIvPjwvZz48Zz48cG9seWdvbiBmaWxsPSIjMTkzNjUxIiBwb2ludHM9IjQwLjMzMSwzMjEuMzE1IDAsMzAyLjU0MSA3LjU2LDI4Ni4yOTQgMzEuNjUyLDI5Ny41MTEgNDIuODY4LDI3My40MTIgNTkuMTEzLDI4MC45NzIgIi8+PC9nPjxnPjxwYXRoIGZpbGw9IiMxOTM2NTEiIGQ9Ik00MzguMjgxLDYzLjQ3NiIvPjwvZz48Zz48cGF0aCBmaWxsPSIjMTkzNjUxIiBkPSJNNDM4LjI4MSw2My40NzYiLz48L2c+PGc+PHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0iTTMxOC4xMzQsMjczLjQwOWwyNS4xNjcsNC40NGwxMS4zMjMtMzQuNzg4bC0yMy4wOTctMTAuNzk5YzEuNzM3LTE0Ljc3MSwwLjQwOS0yOS40MzMtMy42Mi00My4yM2wyMC45NzgtMTQuMzgzbC0xNi45NjUtMzIuNDg1bC0yNC4wOCw4LjQ0NmMtOS4wNTMtMTEuMjUyLTIwLjM5Mi0yMC44NDItMzMuNjA1LTI4LjAzOWw0LjUwOS0yNC43ODlMMjQzLjQyNiw4Ni42M2wtMTAuOTY3LDIyLjc0OGMtMTUuMDAxLTEuNzEzLTI5Ljg4OS0wLjQwNS00My44OTgsMy41NjZsLTE0LjYwMy0yMC42NjFsLTMyLjk4MSwxNi43MTFsOC41NzYsMjMuNzE1Yy0xMS40MjQsOC45MTctMjEuMTYsMjAuMDg3LTI4LjQ2OCwzMy4xbC0yNS4xNjYtNC40MzlsLTExLjMyNCwzNC43ODhsMjMuMDk3LDEwLjc5OWMtMS43MzcsMTQuNzczLTAuNDA5LDI5LjQzNiwzLjYyMSw0My4yMzNsLTIwLjk3NywxNC4zODNsMTYuOTY4LDMyLjQ4M2wyNC4wNzgtOC40NDZjOS4wNTQsMTEuMjUxLDIwLjM5NCwyMC44NDEsMzMuNjA2LDI4LjAzOGwtNC41MDgsMjQuNzg3bDM1LjMxOSwxMS4xNTNsMTAuOTY2LTIyLjc0OWMxNC45OTgsMS43MTEsMjkuODg1LDAuNDAzLDQzLjg5My0zLjU2NWwxNC42MDQsMjAuNjZsMzIuOTgxLTE2LjcxMmwtOC41NzYtMjMuNzE1QzMwMS4wODksMjk3LjU4OSwzMTAuODI2LDI4Ni40MjIsMzE4LjEzNCwyNzMuNDA5eiIvPjwvZz48Zz48cGF0aCBmaWxsPSIjMTkzNjUxIiBkPSJNMzQxLjAxMiwyMjYuODA1YzAuNzEzLTExLjQyNi0wLjI0LTIyLjc5NC0yLjg0NC0zMy45NDRsMjIuMzM2LTE1LjMxM2wtMjQuMjM0LTQ2LjQwMmwtMjUuNTg0LDguOTc2Yy03LjcyNS04LjYyNi0xNi42MDUtMTYuMDQ0LTI2LjUwOC0yMi4xMzhsNC43OTMtMjYuMzYzbC01MC4yNDYtMTUuODdsLTExLjY0OCwyNC4xNjdjLTExLjcxLTAuNzM1LTIzLjM5LDAuMjM2LTM0Ljc1OCwyLjgyMmwtMTUuNTA3LTIxLjk0MWwtNDYuOTUzLDIzLjc4Nmw5LjEyMSwyNS4yMzVjLTguNzI3LDcuNjAzLTE2LjIzNywxNi4zNDYtMjIuNDE4LDI2LjA5N2wtMjYuNzUzLTQuNzE5bC0xNi4xODQsNDkuNzIxbDI0LjU4MywxMS40OTJjLTAuNzEzLDExLjQyOSwwLjI0MSwyMi44MDMsMi44NDQsMzMuOTU3bC0yMi4zMzEsMTUuMzFsMjQuMjMzLDQ2LjM5N2wyNS41ODktOC45NzZjNy43MjUsOC42MjYsMTYuNjA0LDE2LjA0NCwyNi41MDMsMjIuMTM4bC00Ljc5NCwyNi4zNjNsNTAuMjUxLDE1Ljg3bDExLjY0OC0yNC4xNjhjMTEuNzMyLDAuNzEzLDIzLjM5NS0wLjI0LDM0Ljc0OS0yLjgyNWwxNS41MDcsMjEuOTQ1bDQ2Ljk1My0yMy43OTJsLTkuMTItMjUuMjNjOC43MzEtNy42MDYsMTYuMjQxLTE2LjM1MSwyMi40MTgtMjYuMDk3bDI2Ljc1Myw0LjcybDE2LjE4Ni00OS43MjJMMzQxLjAxMiwyMjYuODA1eiBNMzM3LjE4OSwyNjcuNjczbC0yMy43NTMtNC4xOWMtOC4yNjUsMTUuMjk3LTE5LjA1MywyOS4wMzYtMzQuNDAzLDM5Ljk2NGw4LjA4OCwyMi4zNjVsLTE5LjAxMSw5LjYzNWwtMTMuNzk2LTE5LjUxN2MtMTcuOTI0LDUuMjI3LTM1LjU2NCw2LjkyMi01Mi44NTQsNC4yODdsLTEwLjM2MywyMS40OTZsLTIwLjM5My02LjQzOWw0LjI1Ni0yMy4zOTRjLTE1LjQ3LTcuMTk1LTI5LjA5OC0xOC4yNTItNDAuNTcxLTMzLjgyMmwtMjIuNzMzLDcuOTc5bC05LjcwMi0xOC41NjhsMTkuNzc2LTEzLjU2MWMtNS41MTktMTcuODg1LTcuMDUyLTM1LjMzOC00LjM4OC01Mi4zMjlsLTIxLjc3OS0xMC4xOGw2LjQ2NS0xOS44NTRsMjMuNzUxLDQuMTkxYzcuOTM4LTE1LjY2MiwxOS43MTYtMjguNzc1LDM0LjQwNC0zOS45NThsLTguMDg5LTIyLjM3NWwxOS4wMTEtOS42MzJsMTMuNzk2LDE5LjUyMmMxNy42NjMtNS41NzUsMzUuMjg1LTcuMTYxLDUyLjg2My00LjI5MWwxMC4zNjItMjEuNDk1bDIwLjM4OSw2LjQzOWwtNC4yNTcsMjMuMzk0YzE1LjkyNyw3Ljk4MywyOS42MDEsMTkuMDQ5LDQwLjU3MSwzMy44MjJsMjIuNzMyLTcuOTc5bDkuNzAzLDE4LjU3NGwtMTkuNzgxLDEzLjU1OWM1LjYyOSwxNy44NTksNy43NjQsMzUuMzY2LDQuMzg4LDUyLjMyMWwyMS43NzksMTAuMTgzTDMzNy4xODksMjY3LjY3M3oiLz48L2c+PGc+PHBhdGggZmlsbD0iIzI3QTJERSIgZD0iTTI0NC41MTQsMTQzLjA5OGMtNDIuOTAyLTEzLjU0Ny04OC44MzEsOS43MjctMTAyLjU4NSw1MS45ODNjLTEzLjc1NSw0Mi4yNTcsOS44NzQsODcuNDkyLDUyLjc3NiwxMDEuMDRjNDIuOTAxLDEzLjU0OCw4OC44MzEtOS43MjYsMTAyLjU4Ni01MS45ODNDMzExLjA0NSwyMDEuODg2LDI4Ny40MTYsMTU2LjY0NSwyNDQuNTE0LDE0My4wOTh6Ii8+PC9nPjxnPjxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik0yMzAuNTY5LDE4NS45MzhjLTE4Ljg4LTUuOTYyLTM5LjA5Myw0LjI4LTQ1LjE0NiwyMi44NzdjLTYuMDUyLDE4LjU5Niw0LjM0NiwzOC41MDMsMjMuMjI3LDQ0LjQ2NWMxOC44OCw1Ljk2MiwzOS4wOTMtNC4yODEsNDUuMTQ2LTIyLjg3NkMyNTkuODQ5LDIxMS44MSwyNDkuNDUsMTkxLjksMjMwLjU2OSwxODUuOTM4eiIvPjwvZz48Zz48cGF0aCBmaWxsPSIjMTkzNjUxIiBkPSJNMjE5LjYyNiwyNjMuOTM4Yy0wLjAwNCwwLDAsMC0wLjAwNCwwYy00LjYyOCwwLTkuMjI5LTAuNzEzLTEzLjY3LTIuMTE3Yy0xMS41MDMtMy42MzEtMjAuODU2LTExLjQ5MS0yNi4zMzMtMjIuMTI5Yy01LjM5Ny0xMC40OTQtNi4zNi0yMi40NDQtMi43MTEtMzMuNjUxYzUuOTg4LTE4LjM5OCwyMy4xNDctMzAuNzYsNDIuNjkyLTMwLjc2YzQuNjI4LDAsOS4yMjYsMC43MDgsMTMuNjY5LDIuMTEzYzExLjUwNCwzLjYzNCwyMC44NTYsMTEuNDk1LDI2LjMyOCwyMi4xMzhjNS4zOTgsMTAuNDkzLDYuMzYxLDIyLjQzOSwyLjcxMywzMy42NDZDMjU2LjMyNiwyNTEuNTcyLDIzOS4xNzEsMjYzLjkzOCwyMTkuNjI2LDI2My45Mzh6IE0yMTkuNjAxLDE5My4xOThjLTExLjc2NywwLTIyLjA3Nyw3LjM4OC0yNS42NiwxOC4zOWMtMi4xNTcsNi42MjYtMS41ODMsMTMuNjk1LDEuNjEsMTkuOTA2YzMuMjcxLDYuMzU2LDguODg0LDExLjA1OCwxNS43OTUsMTMuMjQyYzIuNjk5LDAuODUzLDUuNDgxLDEuMjg1LDguMjc2LDEuMjg1YzExLjc2NywwLDIyLjA3Ny03LjM5MywyNS42NS0xOC4zODljMi4xNjEtNi42MjcsMS41ODktMTMuNjk1LTEuNjA1LTE5LjkwN2MtMy4yNzEtNi4zNTYtOC44OC0xMS4wNjMtMTUuNzk1LTEzLjI0NUMyMjUuMTgyLDE5My42MzEsMjIyLjM5NiwxOTMuMTk4LDIxOS42MDEsMTkzLjE5OHoiLz48L2c+PGc+PHBhdGggZmlsbD0iIzE5MzY1MSIgZD0iTTI3Ni40OTIsMzgxLjU5OGwtNy41NiwxNi4yNDZsMTIuMzUzLDUuNzQ4Yy00Ny44ODIsMTYuNjI1LTEwMS42NDgsMTMuOTA0LTE0Ny42MDQtOC4xNDZsLTcuNzUyLDE2LjE0OWMyOC42MzQsMTMuNzQ5LDYwLjA0MiwyMC42Miw5MS40NTcsMjAuNjJjMjMuODg0LDAsNDcuNzY0LTQsNzAuNDI4LTExLjk1bC01Ljk5OSwxMi44ODlsMTYuMjQ2LDcuNTZsMTguNzc0LTQwLjMzMkwyNzYuNDkyLDM4MS41OTh6Ii8+PC9nPjxnPjxwYXRoIGZpbGw9IiMxOTM2NTEiIGQ9Ik0xNDYuODE2LDIwLjY4N2w2LjEwOC0xMy4xMjdMMTM2LjY3OCwwbC0xOC43Nyw0MC4zMzFsNDAuMzQzLDE4Ljc4Mmw3LjU2LTE2LjI0NWwtMTIuMTItNS42NDFjNDguOTI4LTE4LjMsMTA0LjUxNC0xNi4xNjksMTUxLjg0Nyw2LjU1bDcuNzUxLTE2LjE0OUMyNjEuMzk5LDIuNzEsMjAwLjQxNywwLjQ1OCwxNDYuODE2LDIwLjY4N3oiLz48L2c+PGc+PHBhdGggZmlsbD0iIzE5MzY1MSIgZD0iTTQzMS42NTksMTUyLjkyNGw3LjU1OS0xNi4yNDZsLTQwLjMzLTE4Ljc3NGwtMTguNzgzLDQwLjM0NWwxNi4yNDYsNy41NThsNS42MzktMTIuMTE0YzE4LjMwNyw0OC45MjgsMTYuMTczLDEwNC41MTYtNi41NDQsMTUxLjg0NWwxNi4xNDgsNy43NTFjMjQuOTEzLTUxLjg5NCwyNy4xNzEtMTEyLjg3NSw2LjkzOS0xNjYuNDc1TDQzMS42NTksMTUyLjkyNHoiLz48L2c+PGc+PHBhdGggZmlsbD0iIzE5MzY1MSIgZD0iTTQyLjg2OCwyNzMuNDEybC01LjYzOSwxMi4xMThjLTE4LjMwNy00OC45MzUtMTYuMTcyLTEwNC41MjMsNi41NDgtMTUxLjg0OGwtMTYuMTQ5LTcuNzUyQzIuNzE1LDE3Ny44MTgsMC40NTUsMjM4LjgwNCwyMC42ODYsMjkyLjQwNUw3LjU2LDI4Ni4yOTRMMCwzMDIuNTQxbDQwLjMzMSwxOC43NzRsMTguNzgyLTQwLjM0M0w0Mi44NjgsMjczLjQxMnoiLz48L2c+PGc+PHBhdGggZmlsbD0iIzE5MzY1MSIgZD0iTTQzOC4yODEsNjMuNDc2Ii8+PC9nPjxnPjxwYXRoIGZpbGw9IiMxOTM2NTEiIGQ9Ik00MzguMjgxLDYzLjQ3NiIvPjwvZz48L2c+PC9zdmc+)}#personalized-transition-wrapper #personalized-transition-text{font-family:Montserrat;position:absolute;padding:10px 5px;border-radius:4px;font-size:18px;text-align:center;width:130%;margin-left:-15%;background:rgba(255,255,255,.8);border:1px solid rgba(230,230,230,.67);color:#1a3751}@media all and (min-width:600px) and (max-width:960px) and (orientation:landscape){#personalized-transition-wrapper{width:60%;margin-top:-30%;margin-left:-30%;padding-top:60%}#personalized-transition-wrapper #personalized-transition-text{width:100%;margin-left:0;color:red}}@media all and (min-width:510px){#personalized-transition-wrapper #personalized-transition-text{width:100%;margin-left:0}}@media all and (min-width:481px) and (max-width:840px) and (max-aspect-ratio:4 / 3){#personalized-transition-wrapper{width:60%;margin-top:-30%;margin-left:-30%;padding-top:60%}}@media all and (min-width:841px) and (max-width:1280px) and (max-aspect-ratio:4 / 3){#personalized-transition-wrapper{width:50%;margin-top:-25%;margin-left:-25%;padding-top:50%}}@media all and (min-width:1281px) and (max-width:1600px){#personalized-transition-wrapper{width:40%;margin-top:-20%;margin-left:-20%;padding-top:40%}}@media all and (min-width:1601px) and (max-width:1920px){#personalized-transition-wrapper{width:30%;margin-top:-15%;margin-left:-15%;padding-top:30%}}#rev-corner-button-container{position:fixed;line-height:0;bottom:10px;z-index:1000;left:10px;margin:0;padding:0}#rev-corner-button-container .rev-button-menu{visibility:hidden;position:absolute;transition:visibility;transition-delay:.2s;margin:0;padding:0}#rev-corner-button-container .rev-button-menu button{position:absolute;transition:-webkit-transform .5s cubic-bezier(.175,.885,.32,1.275);transition:transform .5s cubic-bezier(.175,.885,.32,1.275);opacity:.5;background:rgba(35,35,35,.839216)}#rev-corner-button-container .rev-button-menu button:nth-child(1){bottom:calc(56px + 15px - 10px)}#rev-corner-button-container .rev-button-menu button:nth-child(2){bottom:calc(56px - 10px);left:calc(56px - 10px)}#rev-corner-button-container .rev-button-menu button:nth-child(3){bottom:0;left:calc(56px + 15px - 10px)}#rev-corner-button-container.visible .rev-button-menu{visibility:visible;transition-delay:0s}#rev-corner-button-container.visible .rev-button-menu button{opacity:1;transition:-webkit-transform .5s cubic-bezier(.175,.885,.32,1.275),opacity .2s;transition:transform .5s cubic-bezier(.175,.885,.32,1.275),opacity .2s}#rev-corner-button-container.visible .rev-button-menu button:nth-child(1){-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}#rev-corner-button-container.visible .rev-button-menu button:nth-child(2){-webkit-transform:translate3d(10px,-10px,0);transform:translate3d(10px,-10px,0)}#rev-corner-button-container.visible .rev-button-menu button:nth-child(3){-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}#rev-corner-button-container.visible #rev-corner-button svg{transition-delay:.2s;-webkit-transform:rotate(45deg);transform:rotate(45deg)}#rev-corner-button-container #rev-corner-button,#rev-corner-button-container .menu-button{white-space:nowrap;text-decoration:none;vertical-align:baseline;font-weight:500;line-height:36px;box-shadow:0 3px 5px -1px rgba(0,0,0,.2),0 6px 10px 0 rgba(0,0,0,.14),0 1px 18px 0 rgba(0,0,0,.12);padding:0;transition:background .4s cubic-bezier(.25,.8,.25,1),box-shadow 280ms cubic-bezier(.4,0,.2,1);min-width:0;text-align:center;cursor:pointer}#rev-corner-button-container .menu-button{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;outline:0;border:none;display:inline-block;margin:0;border-radius:50%;width:40px;height:40px;background:#F44336}#rev-corner-button-container .menu-button svg{fill:#fff;position:absolute;text-align:center;width:20px;height:20px;left:50%;top:50%;margin-left:-10px;margin-top:-10px}#rev-corner-button-container #rev-corner-button{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;outline:0;border:none;display:inline-block;margin:0;border-radius:22%;width:56px;height:56px;-webkit-transform:none!important;transform:none!important;background:rgba(80,66,65,.7)}#rev-corner-button-container #rev-corner-button svg{transition:-webkit-transform .2s;transition:transform .2s;fill:#fff;position:absolute;text-align:center;width:36px;height:36px;left:50%;top:50%;margin-left:-18px;margin-top:-18px}.rd-loading{color:#00a8ff!important}.feed-interests-carousel{background-color:transparent;font-family:Montserrat,sans-serif;box-sizing:border-box}.feed-interests-carousel.is-dragging .carousel-cell.is-selected{opacity:.9;box-shadow:0 1px 7px 0 rgba(24,238,67,.8)}.feed-interests-carousel .carousel-cell{width:42%;height:100px;margin-right:8px;margin-bottom:15px;background:#eee;border-radius:5px;font-size:9px;text-align:left;opacity:.7;overflow:hidden;box-shadow:0 1px 1px 0 rgba(12,12,13,.15);transition:opacity .5s}.feed-interests-carousel .carousel-cell.is-selected{opacity:.9}.feed-interests-carousel .carousel-cell.selected-interest{opacity:1}.feed-interests-carousel .carousel-cell .interest-title{font-size:11px!important;line-height:14px!important;min-height:16px;height:16px;margin:0!important;padding:0!important;text-transform:capitalize;letter-spacing:0;font-weight:400;width:80%;text-overflow:ellipsis;overflow:hidden;color:#fff;text-shadow:0 0 1px rgba(0,0,0,.6);transition:all .5s ease;position:absolute!important;left:12px;bottom:12px;z-index:200}.feed-interests-carousel .carousel-cell .interest-title.light-mode{color:#111!important;text-shadow:0 0 1px rgba(100,100,100,.6)}.feed-interests-carousel .carousel-cell .cell-wrapper{width:100%;padding:18px;border-radius:4px;height:100%;display:block;background:linear-gradient(to bottom,rgba(0,0,0,.65) 0,transparent 100%)}.feed-interests-carousel .carousel-cell .selector{width:20px;height:20px;display:block;border-radius:3px;position:absolute!important;top:16px;right:16px;overflow:hidden;text-align:center;background:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNDM5LjAyNiwwSDcyLjk3NUMzMi43MzcsMCwwLDMyLjczNywwLDcyLjk3NXYzNjYuMDVDMCw0NzkuMjY0LDMyLjczNyw1MTIsNzIuOTc1LDUxMmgzNjYuMDUgICAgQzQ3OS4yNjQsNTEyLDUxMiw0NzkuMjY0LDUxMiw0MzkuMDI2VjcyLjk3NUM1MTIsMzIuNzM3LDQ3OS4yNjQsMCw0MzkuMDI2LDB6IE00NzAuNjM2LDQzOS4wMjUgICAgYzAsMTcuNDMtMTQuMTgxLDMxLjYxMS0zMS42MSwzMS42MTFINzIuOTc1Yy0xNy40MywwLTMxLjYxMS0xNC4xODEtMzEuNjExLTMxLjYxVjcyLjk3NWMwLTE3LjQzLDE0LjE4MS0zMS42MTEsMzEuNjExLTMxLjYxMSAgICBoMzY2LjA1YzE3LjQzLDAsMzEuNjExLDE0LjE4MSwzMS42MTEsMzEuNjExVjQzOS4wMjV6IiBmaWxsPSIjRkZGRkZGIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMjU2LDEzMC43MzJjLTExLjQyMiwwLTIwLjY4Miw5LjI2LTIwLjY4MiwyMC42ODJ2MjA5LjE3MWMwLDExLjQyMyw5LjI2LDIwLjY4MiwyMC42ODIsMjAuNjgyICAgIGMxMS40MjMsMCwyMC42ODItOS4yNTksMjAuNjgyLTIwLjY4MlYxNTEuNDE0QzI3Ni42ODIsMTM5Ljk5MiwyNjcuNDIzLDEzMC43MzIsMjU2LDEzMC43MzJ6IiBmaWxsPSIjRkZGRkZGIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMzYwLjU4NSwyMzUuMzE4SDE1MS40MTRjLTExLjQyMiwwLTIwLjY4Miw5LjI2LTIwLjY4MiwyMC42ODJjMCwxMS40MjMsOS4yNiwyMC42ODIsMjAuNjgyLDIwLjY4MmgyMDkuMTcxICAgIGMxMS40MjMsMCwyMC42ODItOS4yNTksMjAuNjgyLTIwLjY4MkMzODEuMjY3LDI0NC41NzgsMzcyLjAwOCwyMzUuMzE4LDM2MC41ODUsMjM1LjMxOHoiIGZpbGw9IiNGRkZGRkYiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K) top left no-repeat;background-size:contain}.feed-interests-carousel .carousel-cell .selector.subscribed{background:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ2OS4zMzMgNDY5LjMzMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDY5LjMzMyA0NjkuMzMzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNDI2LjY2NywwaC0zODRDMTkuMTQ2LDAsMCwxOS4xMzUsMCw0Mi42Njd2Mzg0YzAsMjMuNTMxLDE5LjE0Niw0Mi42NjcsNDIuNjY3LDQyLjY2N2gzODQgICAgYzIzLjUyMSwwLDQyLjY2Ny0xOS4xMzUsNDIuNjY3LTQyLjY2N3YtMzg0QzQ2OS4zMzMsMTkuMTM1LDQ1MC4xODgsMCw0MjYuNjY3LDB6IE0zOTEuNTM5LDE1MC42MjRMMjA3LjA4MiwzMzUuMDgyICAgIGMtNC4xNjcsNC4xNjctOS42MjUsNi4yNS0xNS4wODMsNi4yNXMtMTAuOTE3LTIuMDgzLTE1LjA4My02LjI1TDc3Ljc5LDIzNS45NTdjLTQuMTY1LTQuMTY1LTQuMTY1LTEwLjkxOSwwLTE1LjA4NWwxNS4wODItMTUuMDgyICAgIGM0LjE2NS00LjE2NSwxMC45MTktNC4xNjUsMTUuMDg1LDBsODQuMDQyLDg0LjA0MmwxNjkuMzc0LTE2OS4zNzVjNC4xNjUtNC4xNjUsMTAuOTE5LTQuMTY1LDE1LjA4NSwwbDE1LjA4MiwxNS4wODIgICAgQzM5NS43MDQsMTM5LjcwNCwzOTUuNzA0LDE0Ni40NTgsMzkxLjUzOSwxNTAuNjI0eiIgZmlsbD0iIzkxREM1QSIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=) top left no-repeat;background-size:contain}.feed-interests-carousel .carousel-cell.interest-technology{background:url(../img/interests/technology.png) top left no-repeat;background-size:cover}.feed-interests-carousel .carousel-cell.interest-advertising{background:url(../img/interests/advertising.png) top left no-repeat;background-size:cover}.feed-interests-carousel .carousel-cell.interest-literature{background:url(../img/interests/literature.png) top left no-repeat;background-size:cover}.feed-interests-carousel .carousel-cell.interest-aerospace-engineering{background:url(../img/interests/aerospace-engineering.png) top left no-repeat;background-size:cover}.feed-interests-carousel .carousel-cell.interest-cdn{background:url(../img/interests/cdn.png) top left no-repeat;background-size:cover}.feed-interests-carousel .carousel-cell.interest-ethereum{background:url(../img/interests/ethereum.png) top left no-repeat;background-size:cover}.feed-interests-carousel .carousel-cell.interest-bch{background:url(../img/interests/bch.png) top left no-repeat;background-size:cover}.feed-interests-carousel .carousel-cell:before{display:block;text-align:center;line-height:200px;font-size:80px;color:#fff}.rev-notify{transition:all .5s ease}.revfeed-explore{position:fixed!important;z-index:20000;top:0;left:0;width:103vw;height:100vh;background-color:#fff;box-shadow:0 6px 10px 0 rgba(0,0,0,.14),0 1px 18px 0 rgba(0,0,0,.12),0 3px 5px -1px rgba(0,0,0,.3);border:1px solid #aaa;overflow:hidden}.revfeed-explore.revfeed-explore-panel{transition:all .5s;opacity:1;display:block;border-radius:8px}.revfeed-explore.revfeed-explore-panel.revfeed-explore-panel--docked{left:110vw;opacity:.9}.revfeed-explore.revfeed-explore-panel.revfeed-explore-panel--active{left:1vw;opacity:1}.revfeed-explore.revfeed-explore-panel .revfeed-explore-wrapper{overflow-x:hidden;overflow-y:auto;min-height:150vh;height:300vh}#rev-opt-out{display:none;z-index:2147483641}#rev-opt-out .rd-box-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;opacity:.5;filter:alpha(opacity=50);z-index:2147483641}#rev-opt-out .rd-vertical-offset{position:fixed;display:table-cell;top:0;width:100%;z-index:2147483642}#rev-opt-out .rd-box{position:absolute;vertical-align:middle;background-color:#fff;min-width:290px;max-width:500px;width:90%;margin:0 auto;border-radius:10px}#rev-opt-out.rev-interest-dialog .rd-box{max-width:1024px}#rev-opt-out .rd-modal-content{-webkit-overflow-scrolling:touch;overflow-y:auto;line-height:0;box-sizing:content-box}#rev-opt-out .rd-close-button{position:absolute;cursor:pointer;top:-15px!important;right:-15px!important;-webkit-transform:scale(.7)!important;transform:scale(.7)!important;transition:all .2s ease-in-out!important;width:35px!important;height:35px;border:1px solid #777;box-shadow:0 0 5px 0 rgba(0,0,0,.75);background:#efefef;border-radius:50%}#rev-opt-out .rd-close-button svg{fill:#bdbdbd;height:28px;width:28px;top:50%;position:absolute;margin-top:-14px;left:50%;margin-left:-14px}#rev-opt-out .rd-close-button:hover{-webkit-transform:scale(1)!important;transform:scale(1)!important}@-webkit-keyframes blink{0%,100%{opacity:.2}20%{opacity:1}}@keyframes blink{0%,100%{opacity:.2}20%{opacity:1}}.rd-loading{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:18px;line-height:22px;position:absolute;text-align:center;top:50%;width:100%;margin-top:-11px;margin-bottom:0}.rd-loading span{-webkit-animation-name:blink;animation-name:blink;-webkit-animation-duration:1.4s;animation-duration:1.4s;-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite;-webkit-animation-fill-mode:both;animation-fill-mode:both}.rd-loading span:nth-child(2){-webkit-animation-delay:.2s;animation-delay:.2s}.rd-loading span:nth-child(3){-webkit-animation-delay:.4s;animation-delay:.4s}/* endinject */', 'rev-feed',  this.options.css);

        this.init();
    };

    Feed.prototype.init = function() {
        this.emitter = new EventEmitter();

        this.element = this.options.element ? this.options.element[0] : document.getElementById(this.options.id);

        this.containerElement = document.createElement('div');
        this.containerElement.id = 'rev-feed';

        revUtils.append(this.element, this.containerElement);

        this.windowWidth();

        this.createInnerWidget();

        var self = this;

        if (!this.innerWidget.dataPromise) {
            return;
        }

        this.innerWidget.dataPromise.then(function() {
            self.viewability().then(function() {

                self.initCornerButton();

                if (self.options.infinite) {
                    self.infinite();
                }

                if (self.viewed.length) {
                    self.registerView(self.viewed);
                }
                self.visibleListener = self.checkVisible.bind(self);
                revUtils.addEventListener(window, 'scroll', self.visibleListener);
            }, function() {
                console.log('someething went wrong');
            });
        }, function() {
        }).catch(function(e) {
            console.log(e);
        });
    };

    Feed.prototype.initCornerButton = function() {
        this.buttonContainerElement = document.createElement('div');
        this.buttonContainerElement.id = 'rev-corner-button-container';

        this.buttonElement = document.createElement('a');
        this.buttonElement.id = 'rev-corner-button';

        var svg;

        svg = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
        this.buttonElement.classList.add('rev-corner-button-plus');

        this.buttonElement.innerHTML = svg;

        revUtils.append(this.buttonContainerElement, this.buttonElement);

        this.buttonMenu = document.createElement('menu');
        this.buttonMenu.className = 'rev-button-menu';

        this.button1 = document.createElement('button');
        this.button1.innerHTML = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
        this.button1.className = 'menu-button';
        Waves.attach(this.button1, ['waves-circle', 'waves-float']);

        this.button2 = document.createElement('button');
        this.button2.innerHTML = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
        this.button2.className = 'menu-button';
        Waves.attach(this.button2, ['waves-circle', 'waves-float']);

        this.button3 = document.createElement('button');
        this.button3.innerHTML = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
        this.button3.className = 'menu-button';
        Waves.attach(this.button3, ['waves-circle', 'waves-float']);

        revUtils.append(this.buttonMenu, this.button1);
        revUtils.append(this.buttonMenu, this.button2);
        revUtils.append(this.buttonMenu, this.button3);
        revUtils.append(this.buttonContainerElement, this.buttonMenu);

        Waves.attach(this.buttonElement, ['waves-circle', 'waves-float']);
        Waves.init();

        var that = this;
        revUtils.addEventListener(this.buttonElement, revDetect.mobile() ? 'touchstart' : 'click', function() {
            if (revUtils.hasClass(that.buttonContainerElement, 'visible')) {
                revUtils.removeClass(that.buttonContainerElement, 'visible')
            } else {
                revUtils.addClass(that.buttonContainerElement, 'visible')
            }
        });

        revUtils.append(document.body, this.buttonContainerElement);
    };


    Feed.prototype.windowWidth = function() {

        if (this.options.window_width_devices && revDetect.show(this.options.window_width_devices)) {
            this.windowWidthEnabled = true;

            var that = this;

            revUtils.addEventListener(window, 'resize', function() {
                setElementWindowWidth();
            });

            var setElementWindowWidth = function() {
                revUtils.transformCss(that.element, 'none');
                that.element.style.width = document.body.offsetWidth + 'px';
                that.element.style.overflow = 'hidden';
                revUtils.transformCss(that.element, 'translateX(-' + that.element.getBoundingClientRect().left + 'px)');
            };

            setElementWindowWidth();
        }
    };

    Feed.prototype.createInnerWidget = function() {
        this.innerWidget = new RevSlider({
            mock: this.options.mock,
            api_source:   this.options.api_source,
            element:      [this.containerElement],
            url:          this.options.url,
            host:          this.options.host,
            api_key:      this.options.api_key,
            pub_id:       this.options.pub_id,
            widget_id:    this.options.widget_id,
            domain:       this.options.domain,
            overlay_icons: this.options.overlay_icons, // pass in custom icons or overrides
            image_overlay: this.options.image_overlay, // pass key value object { content_type: icon }
            image_overlay_position: this.options.image_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
            ad_overlay: this.options.ad_overlay, // pass key value object { content_type: icon }
            ad_overlay_position: this.options.ad_overlay_position, // center, top_left, top_right, bottom_right, bottom_left
            rev_position: this.options.rev_position,
            header:       this.options.header,
            per_row:      this.options.per_row,
            rows:         this.options.rows,
            buttons:      this.options.buttons,
            multipliers:  this.options.multipliers,
            css:          this.options.css,
            column_spans: this.options.column_spans,
            image_ratio:  this.options.image_ratio,
            headline_icon_selector:  this.options.headline_icon_selector,
            headline_size: this.options.headline_size,
            max_headline: this.options.max_headline,
            disclosure_text: this.options.disclosure_text,
            query_params: this.options.query_params,
            user_ip:      this.options.user_ip,
            user_agent:   this.options.user_agent,
            disable_pagination: true,
            // pagination_dots: true,
            // pagination_dots_vertical: true,
            register_impressions: false,
            register_views: false,
            row_pages: true,
            visible_rows: 1,
            brand_logo: this.options.brand_logo,
            brand_logo_secondary: this.options.brand_logo_secondary,
            comment_div: this.options.comment_div,
            reaction_id: this.options.reaction_id,
            mobile_image_optimize: this.options.mobile_image_optimize,
            trending_utm: this.options.trending_utm,
            keywords: this.options.keywords,
            developer: this.options.developer,
            internal_selector: this.options.internal_selector,
            headline_top_selector: this.options.headline_top_selector,
            window_width_enabled: this.windowWidthEnabled,
            disclosure_about_src: this.options.disclosure_about_src,
            disclosure_about_height: this.options.disclosure_about_height,
            disclosure_interest_src: this.options.disclosure_interest_src,
            disclosure_interest_height: this.options.disclosure_interest_height,
            breakpoints: this.options.breakpoints
        });
    };

    Feed.prototype.viewability = function() {
        this.viewed = [];

        var self = this;

        return new Promise(function(resolve, reject) {
            var total = self.innerWidget.viewableItems.length;
            var count = 0;
            for (var i = 0; i < self.innerWidget.viewableItems.length; i++) {
                revUtils.checkVisibleItem(self.innerWidget.viewableItems[i], function(viewed, item) {
                    count++;
                    if (count == total) {
                        resolve();
                    }
                    if (viewed) {
                        var index = self.innerWidget.viewableItems.indexOf(item);
                        if(index != -1) {
                            self.innerWidget.viewableItems.splice(index, 1);
                        }
                        self.viewed.push(item);
                    }
                }, self.options.viewable_percentage);
            }
        });
    };

    Feed.prototype.infinite = function() {
        var self = this;

        this.scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

        this.scrollListener = function() {
            if (self.doing) {
                return;
            }

            var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var height = self.innerWidget.grid.maxHeight
            var top = self.innerWidget.grid.element.getBoundingClientRect().top;
            var bottom = self.innerWidget.grid.element.getBoundingClientRect().bottom;

            if (scrollTop >= self.scrollTop && bottom > 0 && (scrollTop + windowHeight) >= (top + scrollTop + height - self.options.buffer)) {
                self.doing = true;

                var moreRowCount = self.innerWidget.grid.nextRow + self.options.rows;

                // var offset = self.innerWidget.limit;

                // var count = 0;

                // self.internalLimit = 0;
                // self.sponsoredLimit = 0;

                self.internalOffset = self.internalOffset ? self.internalOffset : self.innerWidget.internalLimit;
                self.sponsoredOffset = self.sponsoredOffset ? self.sponsoredOffset : self.innerWidget.sponsoredLimit;

                var rowData = self.innerWidget.createRows(self.innerWidget.grid, moreRowCount);

                var urls = [];

                if (rowData.internalLimit > 0) {
                    var internalURL = self.innerWidget.generateUrl(self.internalOffset, rowData.internalLimit, false, false, true);
                    urls.push({
                        offset: self.internalOffset,
                        limit: rowData.internalLimit,
                        url: internalURL,
                        type: 'internal'
                    });
                    self.internalOffset += rowData.internalLimit;
                }

                if (rowData.sponsoredLimit > 0) {
                    var sponsoredURL = self.innerWidget.generateUrl(self.sponsoredOffset, rowData.sponsoredLimit, false, false, false);
                    urls.push({
                        offset: self.sponsoredOffset,
                        limit: rowData.sponsoredLimit,
                        url: sponsoredURL,
                        type: 'sponsored'
                    });
                    self.sponsoredOffset += rowData.sponsoredLimit;
                }

                this.promises = [];
                for (var i = 0; i < urls.length; i++) {
                    this.promises.push(new Promise(function(resolve, reject) {
                        var url = urls[i];
                        revApi.request(url.url, function(resp) {
                            resolve({
                                type: url.type,
                                data: resp
                            });
                        });
                    }));
                }

                Promise.all(this.promises).then(function(data) {
                    self.innerWidget.updateDisplayedItems(rowData.items, data);
                    self.innerWidget.viewableItems = self.innerWidget.viewableItems.concat(rowData.items);
                    self.doing = false; // TODO should this be moved up and out
                }, function(e) {
                }).catch(function(e) {
                    console.log(e);
                });
            }

            self.scrollTop = scrollTop;
        }

        this.innerWidget.emitter.on('removedItems', function(items) {
            revUtils.removeEventListener(window, 'scroll', self.visibleListener);
            revUtils.removeEventListener(window, 'scroll', self.scrollListener);

            var el = items[0].element;
            var remove = [el];
            while (el= el.nextSibling) {
                remove.push(el);
            }

            self.innerWidget.grid.remove(remove);

            self.innerWidget.grid.layout();
        });

        revUtils.addEventListener(window, 'scroll', this.scrollListener);
    };

    Feed.prototype.checkVisible = function() {
        var self = this;
        for (var i = 0; i < this.innerWidget.viewableItems.length; i++) {
            revUtils.checkVisibleItem(this.innerWidget.viewableItems[i], function(viewed, item) {
                if (viewed) {
                    var index = self.innerWidget.viewableItems.indexOf(item);
                    if(index != -1) {
                        self.innerWidget.viewableItems.splice(index, 1);

                        // if (!self.viewable.length) {
                        //     revUtils.removeEventListener(window, 'scroll', self.visibleListener);
                        // }
                        self.registerView([item]);
                    }
                }
            }, self.options.viewable_percentage);
        }
    };

    Feed.prototype.registerView = function(viewed) {

        var view = viewed[0].data.view;

        if (!view) { // safety first, if the first one doesn't have data none should
            return;
        }

        // var params = 'api_source=' + (viewed[0].initial ? 'ba_' : '') + this.options.api_source;

        // params += 'id=' + encodeURIComponent(this.options.id); // debug/test

        var params = 'view=' + view;

        for (var i = 0; i < viewed.length; i++) {
            params += '&' + encodeURIComponent('p[]') + '=' + viewed[i].viewIndex;
        }

        revApi.request(this.options.host + '/view.php?' + params, function() {

        });
    };

    return Feed;

}));