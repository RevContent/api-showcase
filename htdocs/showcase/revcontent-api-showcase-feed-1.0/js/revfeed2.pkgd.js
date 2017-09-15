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
// THIS FILE IS GENERATED - DO NOT EDIT!
/*!mobile-detect v1.3.6 2017-04-05*/
/*global module:false, define:false*/
/*jshint latedef:false*/
/*!@license Copyright 2013, Heinrich Goebl, License: MIT, see https://github.com/hgoebl/mobile-detect.js*/
(function (define, undefined) {
define(function () {
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
        "Samsung": "\\bSamsung\\b|SM-G9250|GT-19300|SGH-I337|BGT-S5230|GT-B2100|GT-B2700|GT-B2710|GT-B3210|GT-B3310|GT-B3410|GT-B3730|GT-B3740|GT-B5510|GT-B5512|GT-B5722|GT-B6520|GT-B7300|GT-B7320|GT-B7330|GT-B7350|GT-B7510|GT-B7722|GT-B7800|GT-C3010|GT-C3011|GT-C3060|GT-C3200|GT-C3212|GT-C3212I|GT-C3262|GT-C3222|GT-C3300|GT-C3300K|GT-C3303|GT-C3303K|GT-C3310|GT-C3322|GT-C3330|GT-C3350|GT-C3500|GT-C3510|GT-C3530|GT-C3630|GT-C3780|GT-C5010|GT-C5212|GT-C6620|GT-C6625|GT-C6712|GT-E1050|GT-E1070|GT-E1075|GT-E1080|GT-E1081|GT-E1085|GT-E1087|GT-E1100|GT-E1107|GT-E1110|GT-E1120|GT-E1125|GT-E1130|GT-E1160|GT-E1170|GT-E1175|GT-E1180|GT-E1182|GT-E1200|GT-E1210|GT-E1225|GT-E1230|GT-E1390|GT-E2100|GT-E2120|GT-E2121|GT-E2152|GT-E2220|GT-E2222|GT-E2230|GT-E2232|GT-E2250|GT-E2370|GT-E2550|GT-E2652|GT-E3210|GT-E3213|GT-I5500|GT-I5503|GT-I5700|GT-I5800|GT-I5801|GT-I6410|GT-I6420|GT-I7110|GT-I7410|GT-I7500|GT-I8000|GT-I8150|GT-I8160|GT-I8190|GT-I8320|GT-I8330|GT-I8350|GT-I8530|GT-I8700|GT-I8703|GT-I8910|GT-I9000|GT-I9001|GT-I9003|GT-I9010|GT-I9020|GT-I9023|GT-I9070|GT-I9082|GT-I9100|GT-I9103|GT-I9220|GT-I9250|GT-I9300|GT-I9305|GT-I9500|GT-I9505|GT-M3510|GT-M5650|GT-M7500|GT-M7600|GT-M7603|GT-M8800|GT-M8910|GT-N7000|GT-S3110|GT-S3310|GT-S3350|GT-S3353|GT-S3370|GT-S3650|GT-S3653|GT-S3770|GT-S3850|GT-S5210|GT-S5220|GT-S5229|GT-S5230|GT-S5233|GT-S5250|GT-S5253|GT-S5260|GT-S5263|GT-S5270|GT-S5300|GT-S5330|GT-S5350|GT-S5360|GT-S5363|GT-S5369|GT-S5380|GT-S5380D|GT-S5560|GT-S5570|GT-S5600|GT-S5603|GT-S5610|GT-S5620|GT-S5660|GT-S5670|GT-S5690|GT-S5750|GT-S5780|GT-S5830|GT-S5839|GT-S6102|GT-S6500|GT-S7070|GT-S7200|GT-S7220|GT-S7230|GT-S7233|GT-S7250|GT-S7500|GT-S7530|GT-S7550|GT-S7562|GT-S7710|GT-S8000|GT-S8003|GT-S8500|GT-S8530|GT-S8600|SCH-A310|SCH-A530|SCH-A570|SCH-A610|SCH-A630|SCH-A650|SCH-A790|SCH-A795|SCH-A850|SCH-A870|SCH-A890|SCH-A930|SCH-A950|SCH-A970|SCH-A990|SCH-I100|SCH-I110|SCH-I400|SCH-I405|SCH-I500|SCH-I510|SCH-I515|SCH-I600|SCH-I730|SCH-I760|SCH-I770|SCH-I830|SCH-I910|SCH-I920|SCH-I959|SCH-LC11|SCH-N150|SCH-N300|SCH-R100|SCH-R300|SCH-R351|SCH-R400|SCH-R410|SCH-T300|SCH-U310|SCH-U320|SCH-U350|SCH-U360|SCH-U365|SCH-U370|SCH-U380|SCH-U410|SCH-U430|SCH-U450|SCH-U460|SCH-U470|SCH-U490|SCH-U540|SCH-U550|SCH-U620|SCH-U640|SCH-U650|SCH-U660|SCH-U700|SCH-U740|SCH-U750|SCH-U810|SCH-U820|SCH-U900|SCH-U940|SCH-U960|SCS-26UC|SGH-A107|SGH-A117|SGH-A127|SGH-A137|SGH-A157|SGH-A167|SGH-A177|SGH-A187|SGH-A197|SGH-A227|SGH-A237|SGH-A257|SGH-A437|SGH-A517|SGH-A597|SGH-A637|SGH-A657|SGH-A667|SGH-A687|SGH-A697|SGH-A707|SGH-A717|SGH-A727|SGH-A737|SGH-A747|SGH-A767|SGH-A777|SGH-A797|SGH-A817|SGH-A827|SGH-A837|SGH-A847|SGH-A867|SGH-A877|SGH-A887|SGH-A897|SGH-A927|SGH-B100|SGH-B130|SGH-B200|SGH-B220|SGH-C100|SGH-C110|SGH-C120|SGH-C130|SGH-C140|SGH-C160|SGH-C170|SGH-C180|SGH-C200|SGH-C207|SGH-C210|SGH-C225|SGH-C230|SGH-C417|SGH-C450|SGH-D307|SGH-D347|SGH-D357|SGH-D407|SGH-D415|SGH-D780|SGH-D807|SGH-D980|SGH-E105|SGH-E200|SGH-E315|SGH-E316|SGH-E317|SGH-E335|SGH-E590|SGH-E635|SGH-E715|SGH-E890|SGH-F300|SGH-F480|SGH-I200|SGH-I300|SGH-I320|SGH-I550|SGH-I577|SGH-I600|SGH-I607|SGH-I617|SGH-I627|SGH-I637|SGH-I677|SGH-I700|SGH-I717|SGH-I727|SGH-i747M|SGH-I777|SGH-I780|SGH-I827|SGH-I847|SGH-I857|SGH-I896|SGH-I897|SGH-I900|SGH-I907|SGH-I917|SGH-I927|SGH-I937|SGH-I997|SGH-J150|SGH-J200|SGH-L170|SGH-L700|SGH-M110|SGH-M150|SGH-M200|SGH-N105|SGH-N500|SGH-N600|SGH-N620|SGH-N625|SGH-N700|SGH-N710|SGH-P107|SGH-P207|SGH-P300|SGH-P310|SGH-P520|SGH-P735|SGH-P777|SGH-Q105|SGH-R210|SGH-R220|SGH-R225|SGH-S105|SGH-S307|SGH-T109|SGH-T119|SGH-T139|SGH-T209|SGH-T219|SGH-T229|SGH-T239|SGH-T249|SGH-T259|SGH-T309|SGH-T319|SGH-T329|SGH-T339|SGH-T349|SGH-T359|SGH-T369|SGH-T379|SGH-T409|SGH-T429|SGH-T439|SGH-T459|SGH-T469|SGH-T479|SGH-T499|SGH-T509|SGH-T519|SGH-T539|SGH-T559|SGH-T589|SGH-T609|SGH-T619|SGH-T629|SGH-T639|SGH-T659|SGH-T669|SGH-T679|SGH-T709|SGH-T719|SGH-T729|SGH-T739|SGH-T746|SGH-T749|SGH-T759|SGH-T769|SGH-T809|SGH-T819|SGH-T839|SGH-T919|SGH-T929|SGH-T939|SGH-T959|SGH-T989|SGH-U100|SGH-U200|SGH-U800|SGH-V205|SGH-V206|SGH-X100|SGH-X105|SGH-X120|SGH-X140|SGH-X426|SGH-X427|SGH-X475|SGH-X495|SGH-X497|SGH-X507|SGH-X600|SGH-X610|SGH-X620|SGH-X630|SGH-X700|SGH-X820|SGH-X890|SGH-Z130|SGH-Z150|SGH-Z170|SGH-ZX10|SGH-ZX20|SHW-M110|SPH-A120|SPH-A400|SPH-A420|SPH-A460|SPH-A500|SPH-A560|SPH-A600|SPH-A620|SPH-A660|SPH-A700|SPH-A740|SPH-A760|SPH-A790|SPH-A800|SPH-A820|SPH-A840|SPH-A880|SPH-A900|SPH-A940|SPH-A960|SPH-D600|SPH-D700|SPH-D710|SPH-D720|SPH-I300|SPH-I325|SPH-I330|SPH-I350|SPH-I500|SPH-I600|SPH-I700|SPH-L700|SPH-M100|SPH-M220|SPH-M240|SPH-M300|SPH-M305|SPH-M320|SPH-M330|SPH-M350|SPH-M360|SPH-M370|SPH-M380|SPH-M510|SPH-M540|SPH-M550|SPH-M560|SPH-M570|SPH-M580|SPH-M610|SPH-M620|SPH-M630|SPH-M800|SPH-M810|SPH-M850|SPH-M900|SPH-M910|SPH-M920|SPH-M930|SPH-N100|SPH-N200|SPH-N240|SPH-N300|SPH-N400|SPH-Z400|SWC-E100|SCH-i909|GT-N7100|GT-N7105|SCH-I535|SM-N900A|SGH-I317|SGH-T999L|GT-S5360B|GT-I8262|GT-S6802|GT-S6312|GT-S6310|GT-S5312|GT-S5310|GT-I9105|GT-I8510|GT-S6790N|SM-G7105|SM-N9005|GT-S5301|GT-I9295|GT-I9195|SM-C101|GT-S7392|GT-S7560|GT-B7610|GT-I5510|GT-S7582|GT-S7530E|GT-I8750|SM-G9006V|SM-G9008V|SM-G9009D|SM-G900A|SM-G900D|SM-G900F|SM-G900H|SM-G900I|SM-G900J|SM-G900K|SM-G900L|SM-G900M|SM-G900P|SM-G900R4|SM-G900S|SM-G900T|SM-G900V|SM-G900W8|SHV-E160K|SCH-P709|SCH-P729|SM-T2558|GT-I9205|SM-G9350|SM-J120F|SM-G920F|SM-G920V|SM-G930F|SM-N910C",
        "LG": "\\bLG\\b;|LG[- ]?(C800|C900|E400|E610|E900|E-900|F160|F180K|F180L|F180S|730|855|L160|LS740|LS840|LS970|LU6200|MS690|MS695|MS770|MS840|MS870|MS910|P500|P700|P705|VM696|AS680|AS695|AX840|C729|E970|GS505|272|C395|E739BK|E960|L55C|L75C|LS696|LS860|P769BK|P350|P500|P509|P870|UN272|US730|VS840|VS950|LN272|LN510|LS670|LS855|LW690|MN270|MN510|P509|P769|P930|UN200|UN270|UN510|UN610|US670|US740|US760|UX265|UX840|VN271|VN530|VS660|VS700|VS740|VS750|VS910|VS920|VS930|VX9200|VX11000|AX840A|LW770|P506|P925|P999|E612|D955|D802|MS323)",
        "Sony": "SonyST|SonyLT|SonyEricsson|SonyEricssonLT15iv|LT18i|E10i|LT28h|LT26w|SonyEricssonMT27i|C5303|C6902|C6903|C6906|C6943|D2533",
        "Asus": "Asus.*Galaxy|PadFone.*Mobile",
        "NokiaLumia": "Lumia [0-9]{3,4}",
        "Micromax": "Micromax.*\\b(A210|A92|A88|A72|A111|A110Q|A115|A116|A110|A90S|A26|A51|A35|A54|A25|A27|A89|A68|A65|A57|A90)\\b",
        "Palm": "PalmSource|Palm",
        "Vertu": "Vertu|Vertu.*Ltd|Vertu.*Ascent|Vertu.*Ayxta|Vertu.*Constellation(F|Quest)?|Vertu.*Monika|Vertu.*Signature",
        "Pantech": "PANTECH|IM-A850S|IM-A840S|IM-A830L|IM-A830K|IM-A830S|IM-A820L|IM-A810K|IM-A810S|IM-A800S|IM-T100K|IM-A725L|IM-A780L|IM-A775C|IM-A770K|IM-A760S|IM-A750K|IM-A740S|IM-A730S|IM-A720L|IM-A710K|IM-A690L|IM-A690S|IM-A650S|IM-A630K|IM-A600S|VEGA PTL21|PT003|P8010|ADR910L|P6030|P6020|P9070|P4100|P9060|P5000|CDM8992|TXT8045|ADR8995|IS11PT|P2030|P6010|P8000|PT002|IS06|CDM8999|P9050|PT001|TXT8040|P2020|P9020|P2000|P7040|P7000|C790",
        "Fly": "IQ230|IQ444|IQ450|IQ440|IQ442|IQ441|IQ245|IQ256|IQ236|IQ255|IQ235|IQ245|IQ275|IQ240|IQ285|IQ280|IQ270|IQ260|IQ250",
        "Wiko": "KITE 4G|HIGHWAY|GETAWAY|STAIRWAY|DARKSIDE|DARKFULL|DARKNIGHT|DARKMOON|SLIDE|WAX 4G|RAINBOW|BLOOM|SUNSET|GOA(?!nna)|LENNY|BARRY|IGGY|OZZY|CINK FIVE|CINK PEAX|CINK PEAX 2|CINK SLIM|CINK SLIM 2|CINK +|CINK KING|CINK PEAX|CINK SLIM|SUBLIM",
        "iMobile": "i-mobile (IQ|i-STYLE|idea|ZAA|Hitz)",
        "SimValley": "\\b(SP-80|XT-930|SX-340|XT-930|SX-310|SP-360|SP60|SPT-800|SP-120|SPT-800|SP-140|SPX-5|SPX-8|SP-100|SPX-8|SPX-12)\\b",
        "Wolfgang": "AT-B24D|AT-AS50HD|AT-AS40W|AT-AS55HD|AT-AS45q2|AT-B26D|AT-AS50Q",
        "Alcatel": "Alcatel",
        "Nintendo": "Nintendo 3DS",
        "Amoi": "Amoi",
        "INQ": "INQ",
        "GenericPhone": "Tapatalk|PDA;|SAGEM|\\bmmp\\b|pocket|\\bpsp\\b|symbian|Smartphone|smartfon|treo|up.browser|up.link|vodafone|\\bwap\\b|nokia|Series40|Series60|S60|SonyEricsson|N900|MAUI.*WAP.*Browser"
    },
    "tablets": {
        "iPad": "iPad|iPad.*Mobile",
        "NexusTablet": "Android.*Nexus[\\s]+(7|9|10)",
        "SamsungTablet": "SAMSUNG.*Tablet|Galaxy.*Tab|SC-01C|GT-P1000|GT-P1003|GT-P1010|GT-P3105|GT-P6210|GT-P6800|GT-P6810|GT-P7100|GT-P7300|GT-P7310|GT-P7500|GT-P7510|SCH-I800|SCH-I815|SCH-I905|SGH-I957|SGH-I987|SGH-T849|SGH-T859|SGH-T869|SPH-P100|GT-P3100|GT-P3108|GT-P3110|GT-P5100|GT-P5110|GT-P6200|GT-P7320|GT-P7511|GT-N8000|GT-P8510|SGH-I497|SPH-P500|SGH-T779|SCH-I705|SCH-I915|GT-N8013|GT-P3113|GT-P5113|GT-P8110|GT-N8010|GT-N8005|GT-N8020|GT-P1013|GT-P6201|GT-P7501|GT-N5100|GT-N5105|GT-N5110|SHV-E140K|SHV-E140L|SHV-E140S|SHV-E150S|SHV-E230K|SHV-E230L|SHV-E230S|SHW-M180K|SHW-M180L|SHW-M180S|SHW-M180W|SHW-M300W|SHW-M305W|SHW-M380K|SHW-M380S|SHW-M380W|SHW-M430W|SHW-M480K|SHW-M480S|SHW-M480W|SHW-M485W|SHW-M486W|SHW-M500W|GT-I9228|SCH-P739|SCH-I925|GT-I9200|GT-P5200|GT-P5210|GT-P5210X|SM-T311|SM-T310|SM-T310X|SM-T210|SM-T210R|SM-T211|SM-P600|SM-P601|SM-P605|SM-P900|SM-P901|SM-T217|SM-T217A|SM-T217S|SM-P6000|SM-T3100|SGH-I467|XE500|SM-T110|GT-P5220|GT-I9200X|GT-N5110X|GT-N5120|SM-P905|SM-T111|SM-T2105|SM-T315|SM-T320|SM-T320X|SM-T321|SM-T520|SM-T525|SM-T530NU|SM-T230NU|SM-T330NU|SM-T900|XE500T1C|SM-P605V|SM-P905V|SM-T337V|SM-T537V|SM-T707V|SM-T807V|SM-P600X|SM-P900X|SM-T210X|SM-T230|SM-T230X|SM-T325|GT-P7503|SM-T531|SM-T330|SM-T530|SM-T705|SM-T705C|SM-T535|SM-T331|SM-T800|SM-T700|SM-T537|SM-T807|SM-P907A|SM-T337A|SM-T537A|SM-T707A|SM-T807A|SM-T237|SM-T807P|SM-P607T|SM-T217T|SM-T337T|SM-T807T|SM-T116NQ|SM-P550|SM-T350|SM-T550|SM-T9000|SM-P9000|SM-T705Y|SM-T805|GT-P3113|SM-T710|SM-T810|SM-T815|SM-T360|SM-T533|SM-T113|SM-T335|SM-T715|SM-T560|SM-T670|SM-T677|SM-T377|SM-T567|SM-T357T|SM-T555|SM-T561|SM-T713|SM-T719|SM-T813|SM-T819|SM-T580|SM-T355Y|SM-T280|SM-T817A|SM-T820|SM-W700|SM-P580|SM-T587",
        "Kindle": "Kindle|Silk.*Accelerated|Android.*\\b(KFOT|KFTT|KFJWI|KFJWA|KFOTE|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|WFJWAE|KFSAWA|KFSAWI|KFASWI|KFARWI|KFFOWI|KFGIWI|KFMEWI)\\b|Android.*Silk\/[0-9.]+ like Chrome\/[0-9.]+ (?!Mobile)",
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
        "YarvikTablet": "Android.*\\b(TAB210|TAB211|TAB224|TAB250|TAB260|TAB264|TAB310|TAB360|TAB364|TAB410|TAB411|TAB420|TAB424|TAB450|TAB460|TAB461|TAB464|TAB465|TAB467|TAB468|TAB07-100|TAB07-101|TAB07-150|TAB07-151|TAB07-152|TAB07-200|TAB07-201-3G|TAB07-210|TAB07-211|TAB07-212|TAB07-214|TAB07-220|TAB07-400|TAB07-485|TAB08-150|TAB08-200|TAB08-201-3G|TAB08-201-30|TAB09-100|TAB09-211|TAB09-410|TAB10-150|TAB10-201|TAB10-211|TAB10-400|TAB10-410|TAB13-201|TAB274EUK|TAB275EUK|TAB374EUK|TAB462EUK|TAB474EUK|TAB9-200)\\b",
        "MedionTablet": "Android.*\\bOYO\\b|LIFE.*(P9212|P9514|P9516|S9512)|LIFETAB",
        "ArnovaTablet": "97G4|AN10G2|AN7bG3|AN7fG3|AN8G3|AN8cG3|AN7G3|AN9G3|AN7dG3|AN7dG3ST|AN7dG3ChildPad|AN10bG3|AN10bG3DT|AN9G2",
        "IntensoTablet": "INM8002KP|INM1010FP|INM805ND|Intenso Tab|TAB1004",
        "IRUTablet": "M702pro",
        "MegafonTablet": "MegaFon V9|\\bZTE V9\\b|Android.*\\bMT7A\\b",
        "EbodaTablet": "E-Boda (Supreme|Impresspeed|Izzycomm|Essential)",
        "AllViewTablet": "Allview.*(Viva|Alldro|City|Speed|All TV|Frenzy|Quasar|Shine|TX1|AX1|AX2)",
        "ArchosTablet": "\\b(101G9|80G9|A101IT)\\b|Qilive 97R|Archos5|\\bARCHOS (70|79|80|90|97|101|FAMILYPAD|)(b|c|)(G10| Cobalt| TITANIUM(HD|)| Xenon| Neon|XSK| 2| XS 2| PLATINUM| CARBON|GAMEPAD)\\b",
        "AinolTablet": "NOVO7|NOVO8|NOVO10|Novo7Aurora|Novo7Basic|NOVO7PALADIN|novo9-Spark",
        "NokiaLumiaTablet": "Lumia 2520",
        "SonyTablet": "Sony.*Tablet|Xperia Tablet|Sony Tablet S|SO-03E|SGPT12|SGPT13|SGPT114|SGPT121|SGPT122|SGPT123|SGPT111|SGPT112|SGPT113|SGPT131|SGPT132|SGPT133|SGPT211|SGPT212|SGPT213|SGP311|SGP312|SGP321|EBRD1101|EBRD1102|EBRD1201|SGP351|SGP341|SGP511|SGP512|SGP521|SGP541|SGP551|SGP621|SGP612|SOT31",
        "PhilipsTablet": "\\b(PI2010|PI3000|PI3100|PI3105|PI3110|PI3205|PI3210|PI3900|PI4010|PI7000|PI7100)\\b",
        "CubeTablet": "Android.*(K8GT|U9GT|U10GT|U16GT|U17GT|U18GT|U19GT|U20GT|U23GT|U30GT)|CUBE U8GT",
        "CobyTablet": "MID1042|MID1045|MID1125|MID1126|MID7012|MID7014|MID7015|MID7034|MID7035|MID7036|MID7042|MID7048|MID7127|MID8042|MID8048|MID8127|MID9042|MID9740|MID9742|MID7022|MID7010",
        "MIDTablet": "M9701|M9000|M9100|M806|M1052|M806|T703|MID701|MID713|MID710|MID727|MID760|MID830|MID728|MID933|MID125|MID810|MID732|MID120|MID930|MID800|MID731|MID900|MID100|MID820|MID735|MID980|MID130|MID833|MID737|MID960|MID135|MID860|MID736|MID140|MID930|MID835|MID733|MID4X10",
        "MSITablet": "MSI \\b(Primo 73K|Primo 73L|Primo 81L|Primo 77|Primo 93|Primo 75|Primo 76|Primo 73|Primo 81|Primo 91|Primo 90|Enjoy 71|Enjoy 7|Enjoy 10)\\b",
        "SMiTTablet": "Android.*(\\bMID\\b|MID-560|MTV-T1200|MTV-PND531|MTV-P1101|MTV-PND530)",
        "RockChipTablet": "Android.*(RK2818|RK2808A|RK2918|RK3066)|RK2738|RK2808A",
        "FlyTablet": "IQ310|Fly Vision",
        "bqTablet": "Android.*(bq)?.*(Elcano|Curie|Edison|Maxwell|Kepler|Pascal|Tesla|Hypatia|Platon|Newton|Livingstone|Cervantes|Avant|Aquaris [E|M]10)|Maxwell.*Lite|Maxwell.*Plus",
        "HuaweiTablet": "MediaPad|MediaPad 7 Youth|IDEOS S7|S7-201c|S7-202u|S7-101|S7-103|S7-104|S7-105|S7-106|S7-201|S7-Slim",
        "NecTablet": "\\bN-06D|\\bN-08D",
        "PantechTablet": "Pantech.*P4100",
        "BronchoTablet": "Broncho.*(N701|N708|N802|a710)",
        "VersusTablet": "TOUCHPAD.*[78910]|\\bTOUCHTAB\\b",
        "ZyncTablet": "z1000|Z99 2G|z99|z930|z999|z990|z909|Z919|z900",
        "PositivoTablet": "TB07STA|TB10STA|TB07FTA|TB10FTA",
        "NabiTablet": "Android.*\\bNabi",
        "KoboTablet": "Kobo Touch|\\bK080\\b|\\bVox\\b Build|\\bArc\\b Build",
        "DanewTablet": "DSlide.*\\b(700|701R|702|703R|704|802|970|971|972|973|974|1010|1012)\\b",
        "TexetTablet": "NaviPad|TB-772A|TM-7045|TM-7055|TM-9750|TM-7016|TM-7024|TM-7026|TM-7041|TM-7043|TM-7047|TM-8041|TM-9741|TM-9747|TM-9748|TM-9751|TM-7022|TM-7021|TM-7020|TM-7011|TM-7010|TM-7023|TM-7025|TM-7037W|TM-7038W|TM-7027W|TM-9720|TM-9725|TM-9737W|TM-1020|TM-9738W|TM-9740|TM-9743W|TB-807A|TB-771A|TB-727A|TB-725A|TB-719A|TB-823A|TB-805A|TB-723A|TB-715A|TB-707A|TB-705A|TB-709A|TB-711A|TB-890HD|TB-880HD|TB-790HD|TB-780HD|TB-770HD|TB-721HD|TB-710HD|TB-434HD|TB-860HD|TB-840HD|TB-760HD|TB-750HD|TB-740HD|TB-730HD|TB-722HD|TB-720HD|TB-700HD|TB-500HD|TB-470HD|TB-431HD|TB-430HD|TB-506|TB-504|TB-446|TB-436|TB-416|TB-146SE|TB-126SE",
        "PlaystationTablet": "Playstation.*(Portable|Vita)",
        "TrekstorTablet": "ST10416-1|VT10416-1|ST70408-1|ST702xx-1|ST702xx-2|ST80208|ST97216|ST70104-2|VT10416-2|ST10216-2A|SurfTab",
        "PyleAudioTablet": "\\b(PTBL10CEU|PTBL10C|PTBL72BC|PTBL72BCEU|PTBL7CEU|PTBL7C|PTBL92BC|PTBL92BCEU|PTBL9CEU|PTBL9CUK|PTBL9C)\\b",
        "AdvanTablet": "Android.* \\b(E3A|T3X|T5C|T5B|T3E|T3C|T3B|T1J|T1F|T2A|T1H|T1i|E1C|T1-E|T5-A|T4|E1-B|T2Ci|T1-B|T1-D|O1-A|E1-A|T1-A|T3A|T4i)\\b ",
        "DanyTechTablet": "Genius Tab G3|Genius Tab S2|Genius Tab Q3|Genius Tab G4|Genius Tab Q4|Genius Tab G-II|Genius TAB GII|Genius TAB GIII|Genius Tab S1",
        "GalapadTablet": "Android.*\\bG1\\b",
        "MicromaxTablet": "Funbook|Micromax.*\\b(P250|P560|P360|P362|P600|P300|P350|P500|P275)\\b",
        "KarbonnTablet": "Android.*\\b(A39|A37|A34|ST8|ST10|ST7|Smart Tab3|Smart Tab2)\\b",
        "AllFineTablet": "Fine7 Genius|Fine7 Shine|Fine7 Air|Fine8 Style|Fine9 More|Fine10 Joy|Fine11 Wide",
        "PROSCANTablet": "\\b(PEM63|PLT1023G|PLT1041|PLT1044|PLT1044G|PLT1091|PLT4311|PLT4311PL|PLT4315|PLT7030|PLT7033|PLT7033D|PLT7035|PLT7035D|PLT7044K|PLT7045K|PLT7045KB|PLT7071KG|PLT7072|PLT7223G|PLT7225G|PLT7777G|PLT7810K|PLT7849G|PLT7851G|PLT7852G|PLT8015|PLT8031|PLT8034|PLT8036|PLT8080K|PLT8082|PLT8088|PLT8223G|PLT8234G|PLT8235G|PLT8816K|PLT9011|PLT9045K|PLT9233G|PLT9735|PLT9760G|PLT9770G)\\b",
        "YONESTablet": "BQ1078|BC1003|BC1077|RK9702|BC9730|BC9001|IT9001|BC7008|BC7010|BC708|BC728|BC7012|BC7030|BC7027|BC7026",
        "ChangJiaTablet": "TPC7102|TPC7103|TPC7105|TPC7106|TPC7107|TPC7201|TPC7203|TPC7205|TPC7210|TPC7708|TPC7709|TPC7712|TPC7110|TPC8101|TPC8103|TPC8105|TPC8106|TPC8203|TPC8205|TPC8503|TPC9106|TPC9701|TPC97101|TPC97103|TPC97105|TPC97106|TPC97111|TPC97113|TPC97203|TPC97603|TPC97809|TPC97205|TPC10101|TPC10103|TPC10106|TPC10111|TPC10203|TPC10205|TPC10503",
        "GUTablet": "TX-A1301|TX-M9002|Q702|kf026",
        "PointOfViewTablet": "TAB-P506|TAB-navi-7-3G-M|TAB-P517|TAB-P-527|TAB-P701|TAB-P703|TAB-P721|TAB-P731N|TAB-P741|TAB-P825|TAB-P905|TAB-P925|TAB-PR945|TAB-PL1015|TAB-P1025|TAB-PI1045|TAB-P1325|TAB-PROTAB[0-9]+|TAB-PROTAB25|TAB-PROTAB26|TAB-PROTAB27|TAB-PROTAB26XL|TAB-PROTAB2-IPS9|TAB-PROTAB30-IPS9|TAB-PROTAB25XXL|TAB-PROTAB26-IPS10|TAB-PROTAB30-IPS10",
        "OvermaxTablet": "OV-(SteelCore|NewBase|Basecore|Baseone|Exellen|Quattor|EduTab|Solution|ACTION|BasicTab|TeddyTab|MagicTab|Stream|TB-08|TB-09)",
        "HCLTablet": "HCL.*Tablet|Connect-3G-2.0|Connect-2G-2.0|ME Tablet U1|ME Tablet U2|ME Tablet G1|ME Tablet X1|ME Tablet Y2|ME Tablet Sync",
        "DPSTablet": "DPS Dream 9|DPS Dual 7",
        "VistureTablet": "V97 HD|i75 3G|Visture V4( HD)?|Visture V5( HD)?|Visture V10",
        "CrestaTablet": "CTP(-)?810|CTP(-)?818|CTP(-)?828|CTP(-)?838|CTP(-)?888|CTP(-)?978|CTP(-)?980|CTP(-)?987|CTP(-)?988|CTP(-)?989",
        "MediatekTablet": "\\bMT8125|MT8389|MT8135|MT8377\\b",
        "ConcordeTablet": "Concorde([ ]+)?Tab|ConCorde ReadMan",
        "GoCleverTablet": "GOCLEVER TAB|A7GOCLEVER|M1042|M7841|M742|R1042BK|R1041|TAB A975|TAB A7842|TAB A741|TAB A741L|TAB M723G|TAB M721|TAB A1021|TAB I921|TAB R721|TAB I720|TAB T76|TAB R70|TAB R76.2|TAB R106|TAB R83.2|TAB M813G|TAB I721|GCTA722|TAB I70|TAB I71|TAB S73|TAB R73|TAB R74|TAB R93|TAB R75|TAB R76.1|TAB A73|TAB A93|TAB A93.2|TAB T72|TAB R83|TAB R974|TAB R973|TAB A101|TAB A103|TAB A104|TAB A104.2|R105BK|M713G|A972BK|TAB A971|TAB R974.2|TAB R104|TAB R83.3|TAB A1042",
        "ModecomTablet": "FreeTAB 9000|FreeTAB 7.4|FreeTAB 7004|FreeTAB 7800|FreeTAB 2096|FreeTAB 7.5|FreeTAB 1014|FreeTAB 1001 |FreeTAB 8001|FreeTAB 9706|FreeTAB 9702|FreeTAB 7003|FreeTAB 7002|FreeTAB 1002|FreeTAB 7801|FreeTAB 1331|FreeTAB 1004|FreeTAB 8002|FreeTAB 8014|FreeTAB 9704|FreeTAB 1003",
        "VoninoTablet": "\\b(Argus[ _]?S|Diamond[ _]?79HD|Emerald[ _]?78E|Luna[ _]?70C|Onyx[ _]?S|Onyx[ _]?Z|Orin[ _]?HD|Orin[ _]?S|Otis[ _]?S|SpeedStar[ _]?S|Magnet[ _]?M9|Primus[ _]?94[ _]?3G|Primus[ _]?94HD|Primus[ _]?QS|Android.*\\bQ8\\b|Sirius[ _]?EVO[ _]?QS|Sirius[ _]?QS|Spirit[ _]?S)\\b",
        "ECSTablet": "V07OT2|TM105A|S10OT1|TR10CS1",
        "StorexTablet": "eZee[_']?(Tab|Go)[0-9]+|TabLC7|Looney Tunes Tab",
        "VodafoneTablet": "SmartTab([ ]+)?[0-9]+|SmartTabII10|SmartTabII7|VF-1497",
        "EssentielBTablet": "Smart[ ']?TAB[ ]+?[0-9]+|Family[ ']?TAB2",
        "RossMoorTablet": "RM-790|RM-997|RMD-878G|RMD-974R|RMT-705A|RMT-701|RME-601|RMT-501|RMT-711",
        "iMobileTablet": "i-mobile i-note",
        "TolinoTablet": "tolino tab [0-9.]+|tolino shine",
        "AudioSonicTablet": "\\bC-22Q|T7-QC|T-17B|T-17P\\b",
        "AMPETablet": "Android.* A78 ",
        "SkkTablet": "Android.* (SKYPAD|PHOENIX|CYCLOPS)",
        "TecnoTablet": "TECNO P9",
        "JXDTablet": "Android.* \\b(F3000|A3300|JXD5000|JXD3000|JXD2000|JXD300B|JXD300|S5800|S7800|S602b|S5110b|S7300|S5300|S602|S603|S5100|S5110|S601|S7100a|P3000F|P3000s|P101|P200s|P1000m|P200m|P9100|P1000s|S6600b|S908|P1000|P300|S18|S6600|S9100)\\b",
        "iJoyTablet": "Tablet (Spirit 7|Essentia|Galatea|Fusion|Onix 7|Landa|Titan|Scooby|Deox|Stella|Themis|Argon|Unique 7|Sygnus|Hexen|Finity 7|Cream|Cream X2|Jade|Neon 7|Neron 7|Kandy|Scape|Saphyr 7|Rebel|Biox|Rebel|Rebel 8GB|Myst|Draco 7|Myst|Tab7-004|Myst|Tadeo Jones|Tablet Boing|Arrow|Draco Dual Cam|Aurix|Mint|Amity|Revolution|Finity 9|Neon 9|T9w|Amity 4GB Dual Cam|Stone 4GB|Stone 8GB|Andromeda|Silken|X2|Andromeda II|Halley|Flame|Saphyr 9,7|Touch 8|Planet|Triton|Unique 10|Hexen 10|Memphis 4GB|Memphis 8GB|Onix 10)",
        "FX2Tablet": "FX2 PAD7|FX2 PAD10",
        "XoroTablet": "KidsPAD 701|PAD[ ]?712|PAD[ ]?714|PAD[ ]?716|PAD[ ]?717|PAD[ ]?718|PAD[ ]?720|PAD[ ]?721|PAD[ ]?722|PAD[ ]?790|PAD[ ]?792|PAD[ ]?900|PAD[ ]?9715D|PAD[ ]?9716DR|PAD[ ]?9718DR|PAD[ ]?9719QR|PAD[ ]?9720QR|TelePAD1030|Telepad1032|TelePAD730|TelePAD731|TelePAD732|TelePAD735Q|TelePAD830|TelePAD9730|TelePAD795|MegaPAD 1331|MegaPAD 1851|MegaPAD 2151",
        "ViewsonicTablet": "ViewPad 10pi|ViewPad 10e|ViewPad 10s|ViewPad E72|ViewPad7|ViewPad E100|ViewPad 7e|ViewSonic VB733|VB100a",
        "OdysTablet": "LOOX|XENO10|ODYS[ -](Space|EVO|Xpress|NOON)|\\bXELIO\\b|Xelio10Pro|XELIO7PHONETAB|XELIO10EXTREME|XELIOPT2|NEO_QUAD10",
        "CaptivaTablet": "CAPTIVA PAD",
        "IconbitTablet": "NetTAB|NT-3702|NT-3702S|NT-3702S|NT-3603P|NT-3603P|NT-0704S|NT-0704S|NT-3805C|NT-3805C|NT-0806C|NT-0806C|NT-0909T|NT-0909T|NT-0907S|NT-0907S|NT-0902S|NT-0902S",
        "TeclastTablet": "T98 4G|\\bP80\\b|\\bX90HD\\b|X98 Air|X98 Air 3G|\\bX89\\b|P80 3G|\\bX80h\\b|P98 Air|\\bX89HD\\b|P98 3G|\\bP90HD\\b|P89 3G|X98 3G|\\bP70h\\b|P79HD 3G|G18d 3G|\\bP79HD\\b|\\bP89s\\b|\\bA88\\b|\\bP10HD\\b|\\bP19HD\\b|G18 3G|\\bP78HD\\b|\\bA78\\b|\\bP75\\b|G17s 3G|G17h 3G|\\bP85t\\b|\\bP90\\b|\\bP11\\b|\\bP98t\\b|\\bP98HD\\b|\\bG18d\\b|\\bP85s\\b|\\bP11HD\\b|\\bP88s\\b|\\bA80HD\\b|\\bA80se\\b|\\bA10h\\b|\\bP89\\b|\\bP78s\\b|\\bG18\\b|\\bP85\\b|\\bA70h\\b|\\bA70\\b|\\bG17\\b|\\bP18\\b|\\bA80s\\b|\\bA11s\\b|\\bP88HD\\b|\\bA80h\\b|\\bP76s\\b|\\bP76h\\b|\\bP98\\b|\\bA10HD\\b|\\bP78\\b|\\bP88\\b|\\bA11\\b|\\bA10t\\b|\\bP76a\\b|\\bP76t\\b|\\bP76e\\b|\\bP85HD\\b|\\bP85a\\b|\\bP86\\b|\\bP75HD\\b|\\bP76v\\b|\\bA12\\b|\\bP75a\\b|\\bA15\\b|\\bP76Ti\\b|\\bP81HD\\b|\\bA10\\b|\\bT760VE\\b|\\bT720HD\\b|\\bP76\\b|\\bP73\\b|\\bP71\\b|\\bP72\\b|\\bT720SE\\b|\\bC520Ti\\b|\\bT760\\b|\\bT720VE\\b|T720-3GE|T720-WiFi",
        "OndaTablet": "\\b(V975i|Vi30|VX530|V701|Vi60|V701s|Vi50|V801s|V719|Vx610w|VX610W|V819i|Vi10|VX580W|Vi10|V711s|V813|V811|V820w|V820|Vi20|V711|VI30W|V712|V891w|V972|V819w|V820w|Vi60|V820w|V711|V813s|V801|V819|V975s|V801|V819|V819|V818|V811|V712|V975m|V101w|V961w|V812|V818|V971|V971s|V919|V989|V116w|V102w|V973|Vi40)\\b[\\s]+",
        "JaytechTablet": "TPC-PA762",
        "BlaupunktTablet": "Endeavour 800NG|Endeavour 1010",
        "DigmaTablet": "\\b(iDx10|iDx9|iDx8|iDx7|iDxD7|iDxD8|iDsQ8|iDsQ7|iDsQ8|iDsD10|iDnD7|3TS804H|iDsQ11|iDj7|iDs10)\\b",
        "EvolioTablet": "ARIA_Mini_wifi|Aria[ _]Mini|Evolio X10|Evolio X7|Evolio X8|\\bEvotab\\b|\\bNeura\\b",
        "LavaTablet": "QPAD E704|\\bIvoryS\\b|E-TAB IVORY|\\bE-TAB\\b",
        "AocTablet": "MW0811|MW0812|MW0922|MTK8382|MW1031|MW0831|MW0821|MW0931|MW0712",
        "MpmanTablet": "MP11 OCTA|MP10 OCTA|MPQC1114|MPQC1004|MPQC994|MPQC974|MPQC973|MPQC804|MPQC784|MPQC780|\\bMPG7\\b|MPDCG75|MPDCG71|MPDC1006|MP101DC|MPDC9000|MPDC905|MPDC706HD|MPDC706|MPDC705|MPDC110|MPDC100|MPDC99|MPDC97|MPDC88|MPDC8|MPDC77|MP709|MID701|MID711|MID170|MPDC703|MPQC1010",
        "CelkonTablet": "CT695|CT888|CT[\\s]?910|CT7 Tab|CT9 Tab|CT3 Tab|CT2 Tab|CT1 Tab|C820|C720|\\bCT-1\\b",
        "WolderTablet": "miTab \\b(DIAMOND|SPACE|BROOKLYN|NEO|FLY|MANHATTAN|FUNK|EVOLUTION|SKY|GOCAR|IRON|GENIUS|POP|MINT|EPSILON|BROADWAY|JUMP|HOP|LEGEND|NEW AGE|LINE|ADVANCE|FEEL|FOLLOW|LIKE|LINK|LIVE|THINK|FREEDOM|CHICAGO|CLEVELAND|BALTIMORE-GH|IOWA|BOSTON|SEATTLE|PHOENIX|DALLAS|IN 101|MasterChef)\\b",
        "MiTablet": "\\bMI PAD\\b|\\bHM NOTE 1W\\b",
        "NibiruTablet": "Nibiru M1|Nibiru Jupiter One",
        "NexoTablet": "NEXO NOVA|NEXO 10|NEXO AVIO|NEXO FREE|NEXO GO|NEXO EVO|NEXO 3G|NEXO SMART|NEXO KIDDO|NEXO MOBI",
        "LeaderTablet": "TBLT10Q|TBLT10I|TBL-10WDKB|TBL-10WDKBO2013|TBL-W230V2|TBL-W450|TBL-W500|SV572|TBLT7I|TBA-AC7-8G|TBLT79|TBL-8W16|TBL-10W32|TBL-10WKB|TBL-W100",
        "UbislateTablet": "UbiSlate[\\s]?7C",
        "PocketBookTablet": "Pocketbook",
        "KocasoTablet": "\\b(TB-1207)\\b",
        "HisenseTablet": "\\b(F5281|E2371)\\b",
        "Hudl": "Hudl HT7S3|Hudl 2",
        "TelstraTablet": "T-Hub2",
        "GenericTablet": "Android.*\\b97D\\b|Tablet(?!.*PC)|BNTV250A|MID-WCDMA|LogicPD Zoom2|\\bA7EB\\b|CatNova8|A1_07|CT704|CT1002|\\bM721\\b|rk30sdk|\\bEVOTAB\\b|M758A|ET904|ALUMIUM10|Smartfren Tab|Endeavour 1010|Tablet-PC-4|Tagi Tab|\\bM6pro\\b|CT1020W|arc 10HD|\\bTP750\\b"
    },
    "oss": {
        "AndroidOS": "Android",
        "BlackBerryOS": "blackberry|\\bBB10\\b|rim tablet os",
        "PalmOS": "PalmOS|avantgo|blazer|elaine|hiptop|palm|plucker|xiino",
        "SymbianOS": "Symbian|SymbOS|Series60|Series40|SYB-[0-9]+|\\bS60\\b",
        "WindowsMobileOS": "Windows CE.*(PPC|Smartphone|Mobile|[0-9]{3}x[0-9]{3})|Window Mobile|Windows Phone [0-9.]+|WCE;",
        "WindowsPhoneOS": "Windows Phone 10.0|Windows Phone 8.1|Windows Phone 8.0|Windows Phone OS|XBLWP7|ZuneWP7|Windows NT 6.[23]; ARM;",
        "iOS": "\\biPhone.*Mobile|\\biPod|\\biPad",
        "MeeGoOS": "MeeGo",
        "MaemoOS": "Maemo",
        "JavaOS": "J2ME\/|\\bMIDP\\b|\\bCLDC\\b",
        "webOS": "webOS|hpwOS",
        "badaOS": "\\bBada\\b",
        "BREWOS": "BREW"
    },
    "uas": {
        "Chrome": "\\bCrMo\\b|CriOS|Android.*Chrome\/[.0-9]* (Mobile)?",
        "Dolfin": "\\bDolfin\\b",
        "Opera": "Opera.*Mini|Opera.*Mobi|Android.*Opera|Mobile.*OPR\/[0-9.]+|Coast\/[0-9.]+",
        "Skyfire": "Skyfire",
        "Edge": "Mobile Safari\/[.0-9]* Edge",
        "IE": "IEMobile|MSIEMobile",
        "Firefox": "fennec|firefox.*maemo|(Mobile|Tablet).*Firefox|Firefox.*Mobile|FxiOS",
        "Bolt": "bolt",
        "TeaShark": "teashark",
        "Blazer": "Blazer",
        "Safari": "Version.*Mobile.*Safari|Safari.*Mobile|MobileSafari",
        "UCBrowser": "UC.*Browser|UCWEB",
        "baiduboxapp": "baiduboxapp",
        "baidubrowser": "baidubrowser",
        "DiigoBrowser": "DiigoBrowser",
        "Puffin": "Puffin",
        "Mercury": "\\bMercury\\b",
        "ObigoBrowser": "Obigo",
        "NetFront": "NF-Browser",
        "GenericBrowser": "NokiaBrowser|OviBrowser|OneBrowser|TwonkyBeamBrowser|SEMC.*Browser|FlyFlow|Minimo|NetFront|Novarra-Vision|MQQBrowser|MicroMessenger",
        "PaleMoon": "Android.*PaleMoon|Mobile.*PaleMoon"
    },
    "props": {
        "Mobile": "Mobile\/[VER]",
        "Build": "Build\/[VER]",
        "Version": "Version\/[VER]",
        "VendorID": "VendorID\/[VER]",
        "iPad": "iPad.*CPU[a-z ]+[VER]",
        "iPhone": "iPhone.*CPU[a-z ]+[VER]",
        "iPod": "iPod.*CPU[a-z ]+[VER]",
        "Kindle": "Kindle\/[VER]",
        "Chrome": [
            "Chrome\/[VER]",
            "CriOS\/[VER]",
            "CrMo\/[VER]"
        ],
        "Coast": [
            "Coast\/[VER]"
        ],
        "Dolfin": "Dolfin\/[VER]",
        "Firefox": [
            "Firefox\/[VER]",
            "FxiOS\/[VER]"
        ],
        "Fennec": "Fennec\/[VER]",
        "Edge": "Edge\/[VER]",
        "IE": [
            "IEMobile\/[VER];",
            "IEMobile [VER]",
            "MSIE [VER];",
            "Trident\/[0-9.]+;.*rv:[VER]"
        ],
        "NetFront": "NetFront\/[VER]",
        "NokiaBrowser": "NokiaBrowser\/[VER]",
        "Opera": [
            " OPR\/[VER]",
            "Opera Mini\/[VER]",
            "Version\/[VER]"
        ],
        "Opera Mini": "Opera Mini\/[VER]",
        "Opera Mobi": "Version\/[VER]",
        "UC Browser": "UC Browser[VER]",
        "MQQBrowser": "MQQBrowser\/[VER]",
        "MicroMessenger": "MicroMessenger\/[VER]",
        "baiduboxapp": "baiduboxapp\/[VER]",
        "baidubrowser": "baidubrowser\/[VER]",
        "SamsungBrowser": "SamsungBrowser\/[VER]",
        "Iron": "Iron\/[VER]",
        "Safari": [
            "Version\/[VER]",
            "Safari\/[VER]"
        ],
        "Skyfire": "Skyfire\/[VER]",
        "Tizen": "Tizen\/[VER]",
        "Webkit": "webkit[ \/][VER]",
        "PaleMoon": "PaleMoon\/[VER]",
        "Gecko": "Gecko\/[VER]",
        "Trident": "Trident\/[VER]",
        "Presto": "Presto\/[VER]",
        "Goanna": "Goanna\/[VER]",
        "iOS": " \\bi?OS\\b [VER][ ;]{1}",
        "Android": "Android [VER]",
        "BlackBerry": [
            "BlackBerry[\\w]+\/[VER]",
            "BlackBerry.*Version\/[VER]",
            "Version\/[VER]"
        ],
        "BREW": "BREW [VER]",
        "Java": "Java\/[VER]",
        "Windows Phone OS": [
            "Windows Phone OS [VER]",
            "Windows Phone [VER]"
        ],
        "Windows Phone": "Windows Phone [VER]",
        "Windows CE": "Windows CE\/[VER]",
        "Windows NT": "Windows NT [VER]",
        "Symbian": [
            "SymbianOS\/[VER]",
            "Symbian\/[VER]"
        ],
        "webOS": [
            "webOS\/[VER]",
            "hpwOS\/[VER];"
        ]
    },
    "utils": {
        "Bot": "Googlebot|facebookexternalhit|AdsBot-Google|Google Keyword Suggestion|Facebot|YandexBot|YandexMobileBot|bingbot|ia_archiver|AhrefsBot|Ezooms|GSLFbot|WBSearchBot|Twitterbot|TweetmemeBot|Twikle|PaperLiBot|Wotbox|UnwindFetchor|Exabot|MJ12bot|YandexImages|TurnitinBot|Pingdom",
        "MobileBot": "Googlebot-Mobile|AdsBot-Google-Mobile|YahooSeeker\/M1A1-R2D2",
        "DesktopMode": "WPDesktop",
        "TV": "SonyDTV|HbbTV",
        "WebKit": "(webkit)[ \/]([\\w.]+)",
        "Console": "\\b(Nintendo|Nintendo WiiU|Nintendo 3DS|PLAYSTATION|Xbox)\\b",
        "Watch": "SM-V700"
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

    function equalIC(a, b) {
        return a != null && b != null && a.toLowerCase() === b.toLowerCase();
    }

    function containsIC(array, value) {
        var valueLC, i, len = array.length;
        if (!len || !value) {
            return false;
        }
        valueLC = value.toLowerCase();
        for (i = 0; i < len; ++i) {
            if (valueLC === array[i].toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    function convertPropsToRegExp(object) {
        for (var key in object) {
            if (hasOwnProp.call(object, key)) {
                object[key] = new RegExp(object[key], 'i');
            }
        }
    }

    (function init() {
        var key, values, value, i, len, verPos, mobileDetectRules = impl.mobileDetectRules;
        for (key in mobileDetectRules.props) {
            if (hasOwnProp.call(mobileDetectRules.props, key)) {
                values = mobileDetectRules.props[key];
                if (!isArray(values)) {
                    values = [values];
                }
                len = values.length;
                for (i = 0; i < len; ++i) {
                    value = values[i];
                    verPos = value.indexOf('[VER]');
                    if (verPos >= 0) {
                        value = value.substring(0, verPos) + '([\\w._\\+]+)' + value.substring(verPos + 5);
                    }
                    values[i] = new RegExp(value, 'i');
                }
                mobileDetectRules.props[key] = values;
            }
        }
        convertPropsToRegExp(mobileDetectRules.oss);
        convertPropsToRegExp(mobileDetectRules.phones);
        convertPropsToRegExp(mobileDetectRules.tablets);
        convertPropsToRegExp(mobileDetectRules.uas);
        convertPropsToRegExp(mobileDetectRules.utils);

        // copy some patterns to oss0 which are tested first (see issue#15)
        mobileDetectRules.oss0 = {
            WindowsPhoneOS: mobileDetectRules.oss.WindowsPhoneOS,
            WindowsMobileOS: mobileDetectRules.oss.WindowsMobileOS
        };
    }());

    /**
     * Test userAgent string against a set of rules and find the first matched key.
     * @param {Object} rules (key is String, value is RegExp)
     * @param {String} userAgent the navigator.userAgent (or HTTP-Header 'User-Agent').
     * @returns {String|null} the matched key if found, otherwise <tt>null</tt>
     * @private
     */
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

    /**
     * Test userAgent string against a set of rules and return an array of matched keys.
     * @param {Object} rules (key is String, value is RegExp)
     * @param {String} userAgent the navigator.userAgent (or HTTP-Header 'User-Agent').
     * @returns {Array} an array of matched keys, may be empty when there is no match, but not <tt>null</tt>
     * @private
     */
    impl.findMatches = function(rules, userAgent) {
        var result = [];
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    result.push(key);
                }
            }
        }
        return result;
    };

    /**
     * Check the version of the given property in the User-Agent.
     *
     * @param {String} propertyName
     * @param {String} userAgent
     * @return {String} version or <tt>null</tt> if version not found
     * @private
     */
    impl.getVersionStr = function (propertyName, userAgent) {
        var props = impl.mobileDetectRules.props, patterns, i, len, match;
        if (hasOwnProp.call(props, propertyName)) {
            patterns = props[propertyName];
            len = patterns.length;
            for (i = 0; i < len; ++i) {
                match = patterns[i].exec(userAgent);
                if (match !== null) {
                    return match[1];
                }
            }
        }
        return null;
    };

    /**
     * Check the version of the given property in the User-Agent.
     * Will return a float number. (eg. 2_0 will return 2.0, 4.3.1 will return 4.31)
     *
     * @param {String} propertyName
     * @param {String} userAgent
     * @return {Number} version or <tt>NaN</tt> if version not found
     * @private
     */
    impl.getVersion = function (propertyName, userAgent) {
        var version = impl.getVersionStr(propertyName, userAgent);
        return version ? impl.prepareVersionNo(version) : NaN;
    };

    /**
     * Prepare the version number.
     *
     * @param {String} version
     * @return {Number} the version number as a floating number
     * @private
     */
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

    // t is a reference to a MobileDetect instance
    impl.mobileGrade = function (t) {
        // impl note:
        // To keep in sync w/ Mobile_Detect.php easily, the following code is tightly aligned to the PHP version.
        // When changes are made in Mobile_Detect.php, copy this method and replace:
        //     $this-> / t.
        //     self::MOBILE_GRADE_(.) / '$1'
        //     , self::VERSION_TYPE_FLOAT / (nothing)
        //     isIOS() / os('iOS')
        //     [reg] / (nothing)   <-- jsdelivr complaining about unescaped unicode character U+00AE
        var $isMobile = t.mobile() !== null;

        if (
            // Apple iOS 3.2-5.1 - Tested on the original iPad (4.3 / 5.0), iPad 2 (4.3), iPad 3 (5.1), original iPhone (3.1), iPhone 3 (3.2), 3GS (4.3), 4 (4.3 / 5.0), and 4S (5.1)
            t.os('iOS') && t.version('iPad')>=4.3 ||
            t.os('iOS') && t.version('iPhone')>=3.1 ||
            t.os('iOS') && t.version('iPod')>=3.1 ||

            // Android 2.1-2.3 - Tested on the HTC Incredible (2.2), original Droid (2.2), HTC Aria (2.1), Google Nexus S (2.3). Functional on 1.5 & 1.6 but performance may be sluggish, tested on Google G1 (1.5)
            // Android 3.1 (Honeycomb)  - Tested on the Samsung Galaxy Tab 10.1 and Motorola XOOM
            // Android 4.0 (ICS)  - Tested on a Galaxy Nexus. Note: transition performance can be poor on upgraded devices
            // Android 4.1 (Jelly Bean)  - Tested on a Galaxy Nexus and Galaxy 7
            ( t.version('Android')>2.1 && t.is('Webkit') ) ||

            // Windows Phone 7-7.5 - Tested on the HTC Surround (7.0) HTC Trophy (7.5), LG-E900 (7.5), Nokia Lumia 800
            t.version('Windows Phone OS')>=7.0 ||

            // Blackberry 7 - Tested on BlackBerry Torch 9810
            // Blackberry 6.0 - Tested on the Torch 9800 and Style 9670
            t.is('BlackBerry') && t.version('BlackBerry')>=6.0 ||
            // Blackberry Playbook (1.0-2.0) - Tested on PlayBook
            t.match('Playbook.*Tablet') ||

            // Palm WebOS (1.4-2.0) - Tested on the Palm Pixi (1.4), Pre (1.4), Pre 2 (2.0)
            ( t.version('webOS')>=1.4 && t.match('Palm|Pre|Pixi') ) ||
            // Palm WebOS 3.0  - Tested on HP TouchPad
            t.match('hp.*TouchPad') ||

            // Firefox Mobile (12 Beta) - Tested on Android 2.3 device
            ( t.is('Firefox') && t.version('Firefox')>=12 ) ||

            // Chrome for Android - Tested on Android 4.0, 4.1 device
            ( t.is('Chrome') && t.is('AndroidOS') && t.version('Android')>=4.0 ) ||

            // Skyfire 4.1 - Tested on Android 2.3 device
            ( t.is('Skyfire') && t.version('Skyfire')>=4.1 && t.is('AndroidOS') && t.version('Android')>=2.3 ) ||

            // Opera Mobile 11.5-12: Tested on Android 2.3
            ( t.is('Opera') && t.version('Opera Mobi')>11 && t.is('AndroidOS') ) ||

            // Meego 1.2 - Tested on Nokia 950 and N9
            t.is('MeeGoOS') ||

            // Tizen (pre-release) - Tested on early hardware
            t.is('Tizen') ||

            // Samsung Bada 2.0 - Tested on a Samsung Wave 3, Dolphin browser
            // @todo: more tests here!
            t.is('Dolfin') && t.version('Bada')>=2.0 ||

            // UC Browser - Tested on Android 2.3 device
            ( (t.is('UC Browser') || t.is('Dolfin')) && t.version('Android')>=2.3 ) ||

            // Kindle 3 and Fire  - Tested on the built-in WebKit browser for each
            ( t.match('Kindle Fire') ||
                t.is('Kindle') && t.version('Kindle')>=3.0 ) ||

            // Nook Color 1.4.1 - Tested on original Nook Color, not Nook Tablet
            t.is('AndroidOS') && t.is('NookTablet') ||

            // Chrome Desktop 11-21 - Tested on OS X 10.7 and Windows 7
            t.version('Chrome')>=11 && !$isMobile ||

            // Safari Desktop 4-5 - Tested on OS X 10.7 and Windows 7
            t.version('Safari')>=5.0 && !$isMobile ||

            // Firefox Desktop 4-13 - Tested on OS X 10.7 and Windows 7
            t.version('Firefox')>=4.0 && !$isMobile ||

            // Internet Explorer 7-9 - Tested on Windows XP, Vista and 7
            t.version('MSIE')>=7.0 && !$isMobile ||

            // Opera Desktop 10-12 - Tested on OS X 10.7 and Windows 7
            // @reference: http://my.opera.com/community/openweb/idopera/
            t.version('Opera')>=10 && !$isMobile

            ){
            return 'A';
        }

        if (
            t.os('iOS') && t.version('iPad')<4.3 ||
            t.os('iOS') && t.version('iPhone')<3.1 ||
            t.os('iOS') && t.version('iPod')<3.1 ||

            // Blackberry 5.0: Tested on the Storm 2 9550, Bold 9770
            t.is('Blackberry') && t.version('BlackBerry')>=5 && t.version('BlackBerry')<6 ||

            //Opera Mini (5.0-6.5) - Tested on iOS 3.2/4.3 and Android 2.3
            ( t.version('Opera Mini')>=5.0 && t.version('Opera Mini')<=6.5 &&
                (t.version('Android')>=2.3 || t.is('iOS')) ) ||

            // Nokia Symbian^3 - Tested on Nokia N8 (Symbian^3), C7 (Symbian^3), also works on N97 (Symbian^1)
            t.match('NokiaN8|NokiaC7|N97.*Series60|Symbian/3') ||

            // @todo: report this (tested on Nokia N71)
            t.version('Opera Mobi')>=11 && t.is('SymbianOS')
            ){
            return 'B';
        }

        if (
        // Blackberry 4.x - Tested on the Curve 8330
            t.version('BlackBerry')<5.0 ||
            // Windows Mobile - Tested on the HTC Leo (WinMo 5.2)
            t.match('MSIEMobile|Windows CE.*Mobile') || t.version('Windows Mobile')<=5.2

            ){
            return 'C';
        }

        //All older smartphone platforms and featurephones - Any device that doesn't support media queries
        //will receive the basic, C grade experience.
        return 'C';
    };

    impl.detectOS = function (ua) {
        return impl.findMatch(impl.mobileDetectRules.oss0, ua) ||
            impl.findMatch(impl.mobileDetectRules.oss, ua);
    };

    impl.getDeviceSmallerSide = function () {
        return window.screen.width < window.screen.height ?
            window.screen.width :
            window.screen.height;
    };

    /**
     * Constructor for MobileDetect object.
     * <br>
     * Such an object will keep a reference to the given user-agent string and cache most of the detect queries.<br>
     * <div style="background-color: #d9edf7; border: 1px solid #bce8f1; color: #3a87ad; padding: 14px; border-radius: 2px; margin-top: 20px">
     *     <strong>Find information how to download and install:</strong>
     *     <a href="https://github.com/hgoebl/mobile-detect.js/">github.com/hgoebl/mobile-detect.js/</a>
     * </div>
     *
     * @example <pre>
     *     var md = new MobileDetect(window.navigator.userAgent);
     *     if (md.mobile()) {
     *         location.href = (md.mobileGrade() === 'A') ? '/mobile/' : '/lynx/';
     *     }
     * </pre>
     *
     * @param {string} userAgent typically taken from window.navigator.userAgent or http_header['User-Agent']
     * @param {number} [maxPhoneWidth=600] <strong>only for browsers</strong> specify a value for the maximum
     *        width of smallest device side (in logical "CSS" pixels) until a device detected as mobile will be handled
     *        as phone.
     *        This is only used in cases where the device cannot be classified as phone or tablet.<br>
     *        See <a href="http://developer.android.com/guide/practices/screens_support.html">Declaring Tablet Layouts
     *        for Android</a>.<br>
     *        If you provide a value < 0, then this "fuzzy" check is disabled.
     * @constructor
     * @global
     */
    function MobileDetect(userAgent, maxPhoneWidth) {
        this.ua = userAgent || '';
        this._cache = {};
        //600dp is typical 7" tablet minimum width
        this.maxPhoneWidth = maxPhoneWidth || 600;
    }

    MobileDetect.prototype = {
        constructor: MobileDetect,

        /**
         * Returns the detected phone or tablet type or <tt>null</tt> if it is not a mobile device.
         * <br>
         * For a list of possible return values see {@link MobileDetect#phone} and {@link MobileDetect#tablet}.<br>
         * <br>
         * If the device is not detected by the regular expressions from Mobile-Detect, a test is made against
         * the patterns of <a href="http://detectmobilebrowsers.com/">detectmobilebrowsers.com</a>. If this test
         * is positive, a value of <code>UnknownPhone</code>, <code>UnknownTablet</code> or
         * <code>UnknownMobile</code> is returned.<br>
         * When used in browser, the decision whether phone or tablet is made based on <code>screen.width/height</code>.<br>
         * <br>
         * When used server-side (node.js), there is no way to tell the difference between <code>UnknownTablet</code>
         * and <code>UnknownMobile</code>, so you will get <code>UnknownMobile</code> here.<br>
         * Be aware that since v1.0.0 in this special case you will get <code>UnknownMobile</code> only for:
         * {@link MobileDetect#mobile}, not for {@link MobileDetect#phone} and {@link MobileDetect#tablet}.
         * In versions before v1.0.0 all 3 methods returned <code>UnknownMobile</code> which was tedious to use.
         * <br>
         * In most cases you will use the return value just as a boolean.
         *
         * @returns {String} the key for the phone family or tablet family, e.g. "Nexus".
         * @function MobileDetect#mobile
         */
        mobile: function () {
            impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
            return this._cache.mobile;
        },

        /**
         * Returns the detected phone type/family string or <tt>null</tt>.
         * <br>
         * The returned tablet (family or producer) is one of following keys:<br>
         * <br><tt>iPhone, BlackBerry, HTC, Nexus, Dell, Motorola, Samsung, LG, Sony, Asus,
         * NokiaLumia, Micromax, Palm, Vertu, Pantech, Fly, Wiko, iMobile, SimValley,
         * Wolfgang, Alcatel, Nintendo, Amoi, INQ, GenericPhone</tt><br>
         * <br>
         * If the device is not detected by the regular expressions from Mobile-Detect, a test is made against
         * the patterns of <a href="http://detectmobilebrowsers.com/">detectmobilebrowsers.com</a>. If this test
         * is positive, a value of <code>UnknownPhone</code> or <code>UnknownMobile</code> is returned.<br>
         * When used in browser, the decision whether phone or tablet is made based on <code>screen.width/height</code>.<br>
         * <br>
         * When used server-side (node.js), there is no way to tell the difference between <code>UnknownTablet</code>
         * and <code>UnknownMobile</code>, so you will get <code>null</code> here, while {@link MobileDetect#mobile}
         * will return <code>UnknownMobile</code>.<br>
         * Be aware that since v1.0.0 in this special case you will get <code>UnknownMobile</code> only for:
         * {@link MobileDetect#mobile}, not for {@link MobileDetect#phone} and {@link MobileDetect#tablet}.
         * In versions before v1.0.0 all 3 methods returned <code>UnknownMobile</code> which was tedious to use.
         * <br>
         * In most cases you will use the return value just as a boolean.
         *
         * @returns {String} the key of the phone family or producer, e.g. "iPhone"
         * @function MobileDetect#phone
         */
        phone: function () {
            impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
            return this._cache.phone;
        },

        /**
         * Returns the detected tablet type/family string or <tt>null</tt>.
         * <br>
         * The returned tablet (family or producer) is one of following keys:<br>
         * <br><tt>iPad, NexusTablet, SamsungTablet, Kindle, SurfaceTablet, HPTablet, AsusTablet,
         * BlackBerryTablet, HTCtablet, MotorolaTablet, NookTablet, AcerTablet,
         * ToshibaTablet, LGTablet, FujitsuTablet, PrestigioTablet, LenovoTablet,
         * DellTablet, YarvikTablet, MedionTablet, ArnovaTablet, IntensoTablet, IRUTablet,
         * MegafonTablet, EbodaTablet, AllViewTablet, ArchosTablet, AinolTablet,
         * NokiaLumiaTablet, SonyTablet, PhilipsTablet, CubeTablet, CobyTablet, MIDTablet,
         * MSITablet, SMiTTablet, RockChipTablet, FlyTablet, bqTablet, HuaweiTablet,
         * NecTablet, PantechTablet, BronchoTablet, VersusTablet, ZyncTablet,
         * PositivoTablet, NabiTablet, KoboTablet, DanewTablet, TexetTablet,
         * PlaystationTablet, TrekstorTablet, PyleAudioTablet, AdvanTablet,
         * DanyTechTablet, GalapadTablet, MicromaxTablet, KarbonnTablet, AllFineTablet,
         * PROSCANTablet, YONESTablet, ChangJiaTablet, GUTablet, PointOfViewTablet,
         * OvermaxTablet, HCLTablet, DPSTablet, VistureTablet, CrestaTablet,
         * MediatekTablet, ConcordeTablet, GoCleverTablet, ModecomTablet, VoninoTablet,
         * ECSTablet, StorexTablet, VodafoneTablet, EssentielBTablet, RossMoorTablet,
         * iMobileTablet, TolinoTablet, AudioSonicTablet, AMPETablet, SkkTablet,
         * TecnoTablet, JXDTablet, iJoyTablet, FX2Tablet, XoroTablet, ViewsonicTablet,
         * OdysTablet, CaptivaTablet, IconbitTablet, TeclastTablet, OndaTablet,
         * JaytechTablet, BlaupunktTablet, DigmaTablet, EvolioTablet, LavaTablet,
         * AocTablet, MpmanTablet, CelkonTablet, WolderTablet, MiTablet, NibiruTablet,
         * NexoTablet, LeaderTablet, UbislateTablet, PocketBookTablet, KocasoTablet,
         * HisenseTablet, Hudl, TelstraTablet, GenericTablet</tt><br>
         * <br>
         * If the device is not detected by the regular expressions from Mobile-Detect, a test is made against
         * the patterns of <a href="http://detectmobilebrowsers.com/">detectmobilebrowsers.com</a>. If this test
         * is positive, a value of <code>UnknownTablet</code> or <code>UnknownMobile</code> is returned.<br>
         * When used in browser, the decision whether phone or tablet is made based on <code>screen.width/height</code>.<br>
         * <br>
         * When used server-side (node.js), there is no way to tell the difference between <code>UnknownTablet</code>
         * and <code>UnknownMobile</code>, so you will get <code>null</code> here, while {@link MobileDetect#mobile}
         * will return <code>UnknownMobile</code>.<br>
         * Be aware that since v1.0.0 in this special case you will get <code>UnknownMobile</code> only for:
         * {@link MobileDetect#mobile}, not for {@link MobileDetect#phone} and {@link MobileDetect#tablet}.
         * In versions before v1.0.0 all 3 methods returned <code>UnknownMobile</code> which was tedious to use.
         * <br>
         * In most cases you will use the return value just as a boolean.
         *
         * @returns {String} the key of the tablet family or producer, e.g. "SamsungTablet"
         * @function MobileDetect#tablet
         */
        tablet: function () {
            impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
            return this._cache.tablet;
        },

        /**
         * Returns the (first) detected user-agent string or <tt>null</tt>.
         * <br>
         * The returned user-agent is one of following keys:<br>
         * <br><tt>Chrome, Dolfin, Opera, Skyfire, Edge, IE, Firefox, Bolt, TeaShark, Blazer,
         * Safari, UCBrowser, baiduboxapp, baidubrowser, DiigoBrowser, Puffin, Mercury,
         * ObigoBrowser, NetFront, GenericBrowser, PaleMoon</tt><br>
         * <br>
         * In most cases calling {@link MobileDetect#userAgent} will be sufficient. But there are rare
         * cases where a mobile device pretends to be more than one particular browser. You can get the
         * list of all matches with {@link MobileDetect#userAgents} or check for a particular value by
         * providing one of the defined keys as first argument to {@link MobileDetect#is}.
         *
         * @returns {String} the key for the detected user-agent or <tt>null</tt>
         * @function MobileDetect#userAgent
         */
        userAgent: function () {
            if (this._cache.userAgent === undefined) {
                this._cache.userAgent = impl.findMatch(impl.mobileDetectRules.uas, this.ua);
            }
            return this._cache.userAgent;
        },

        /**
         * Returns all detected user-agent strings.
         * <br>
         * The array is empty or contains one or more of following keys:<br>
         * <br><tt>Chrome, Dolfin, Opera, Skyfire, Edge, IE, Firefox, Bolt, TeaShark, Blazer,
         * Safari, UCBrowser, baiduboxapp, baidubrowser, DiigoBrowser, Puffin, Mercury,
         * ObigoBrowser, NetFront, GenericBrowser, PaleMoon</tt><br>
         * <br>
         * In most cases calling {@link MobileDetect#userAgent} will be sufficient. But there are rare
         * cases where a mobile device pretends to be more than one particular browser. You can get the
         * list of all matches with {@link MobileDetect#userAgents} or check for a particular value by
         * providing one of the defined keys as first argument to {@link MobileDetect#is}.
         *
         * @returns {Array} the array of detected user-agent keys or <tt>[]</tt>
         * @function MobileDetect#userAgents
         */
        userAgents: function () {
            if (this._cache.userAgents === undefined) {
                this._cache.userAgents = impl.findMatches(impl.mobileDetectRules.uas, this.ua);
            }
            return this._cache.userAgents;
        },

        /**
         * Returns the detected operating system string or <tt>null</tt>.
         * <br>
         * The operating system is one of following keys:<br>
         * <br><tt>AndroidOS, BlackBerryOS, PalmOS, SymbianOS, WindowsMobileOS, WindowsPhoneOS,
         * iOS, MeeGoOS, MaemoOS, JavaOS, webOS, badaOS, BREWOS</tt><br>
         *
         * @returns {String} the key for the detected operating system.
         * @function MobileDetect#os
         */
        os: function () {
            if (this._cache.os === undefined) {
                this._cache.os = impl.detectOS(this.ua);
            }
            return this._cache.os;
        },

        /**
         * Get the version (as Number) of the given property in the User-Agent.
         * <br>
         * Will return a float number. (eg. 2_0 will return 2.0, 4.3.1 will return 4.31)
         *
         * @param {String} key a key defining a thing which has a version.<br>
         *        You can use one of following keys:<br>
         * <br><tt>Mobile, Build, Version, VendorID, iPad, iPhone, iPod, Kindle, Chrome, Coast,
         * Dolfin, Firefox, Fennec, Edge, IE, NetFront, NokiaBrowser, Opera, Opera Mini,
         * Opera Mobi, UC Browser, MQQBrowser, MicroMessenger, baiduboxapp, baidubrowser,
         * SamsungBrowser, Iron, Safari, Skyfire, Tizen, Webkit, PaleMoon, Gecko, Trident,
         * Presto, Goanna, iOS, Android, BlackBerry, BREW, Java, Windows Phone OS, Windows
         * Phone, Windows CE, Windows NT, Symbian, webOS</tt><br>
         *
         * @returns {Number} the version as float or <tt>NaN</tt> if User-Agent doesn't contain this version.
         *          Be careful when comparing this value with '==' operator!
         * @function MobileDetect#version
         */
        version: function (key) {
            return impl.getVersion(key, this.ua);
        },

        /**
         * Get the version (as String) of the given property in the User-Agent.
         * <br>
         *
         * @param {String} key a key defining a thing which has a version.<br>
         *        You can use one of following keys:<br>
         * <br><tt>Mobile, Build, Version, VendorID, iPad, iPhone, iPod, Kindle, Chrome, Coast,
         * Dolfin, Firefox, Fennec, Edge, IE, NetFront, NokiaBrowser, Opera, Opera Mini,
         * Opera Mobi, UC Browser, MQQBrowser, MicroMessenger, baiduboxapp, baidubrowser,
         * SamsungBrowser, Iron, Safari, Skyfire, Tizen, Webkit, PaleMoon, Gecko, Trident,
         * Presto, Goanna, iOS, Android, BlackBerry, BREW, Java, Windows Phone OS, Windows
         * Phone, Windows CE, Windows NT, Symbian, webOS</tt><br>
         *
         * @returns {String} the "raw" version as String or <tt>null</tt> if User-Agent doesn't contain this version.
         *
         * @function MobileDetect#versionStr
         */
        versionStr: function (key) {
            return impl.getVersionStr(key, this.ua);
        },

        /**
         * Global test key against userAgent, os, phone, tablet and some other properties of userAgent string.
         *
         * @param {String} key the key (case-insensitive) of a userAgent, an operating system, phone or
         *        tablet family.<br>
         *        For a complete list of possible values, see {@link MobileDetect#userAgent},
         *        {@link MobileDetect#os}, {@link MobileDetect#phone}, {@link MobileDetect#tablet}.<br>
         *        Additionally you have following keys:<br>
         * <br><tt>Bot, MobileBot, DesktopMode, TV, WebKit, Console, Watch</tt><br>
         *
         * @returns {boolean} <tt>true</tt> when the given key is one of the defined keys of userAgent, os, phone,
         *                    tablet or one of the listed additional keys, otherwise <tt>false</tt>
         * @function MobileDetect#is
         */
        is: function (key) {
            return containsIC(this.userAgents(), key) ||
                   equalIC(key, this.os()) ||
                   equalIC(key, this.phone()) ||
                   equalIC(key, this.tablet()) ||
                   containsIC(impl.findMatches(impl.mobileDetectRules.utils, this.ua), key);
        },

        /**
         * Do a quick test against navigator::userAgent.
         *
         * @param {String|RegExp} pattern the pattern, either as String or RegExp
         *                        (a string will be converted to a case-insensitive RegExp).
         * @returns {boolean} <tt>true</tt> when the pattern matches, otherwise <tt>false</tt>
         * @function MobileDetect#match
         */
        match: function (pattern) {
            if (!(pattern instanceof RegExp)) {
                pattern = new RegExp(pattern, 'i');
            }
            return pattern.test(this.ua);
        },

        /**
         * Checks whether the mobile device can be considered as phone regarding <code>screen.width</code>.
         * <br>
         * Obviously this method makes sense in browser environments only (not for Node.js)!
         * @param {number} [maxPhoneWidth] the maximum logical pixels (aka. CSS-pixels) to be considered as phone.<br>
         *        The argument is optional and if not present or falsy, the value of the constructor is taken.
         * @returns {boolean|undefined} <code>undefined</code> if screen size wasn't detectable, else <code>true</code>
         *          when screen.width is less or equal to maxPhoneWidth, otherwise <code>false</code>.<br>
         *          Will always return <code>undefined</code> server-side.
         */
        isPhoneSized: function (maxPhoneWidth) {
            return MobileDetect.isPhoneSized(maxPhoneWidth || this.maxPhoneWidth);
        },

        /**
         * Returns the mobile grade ('A', 'B', 'C').
         *
         * @returns {String} one of the mobile grades ('A', 'B', 'C').
         * @function MobileDetect#mobileGrade
         */
        mobileGrade: function () {
            if (this._cache.grade === undefined) {
                this._cache.grade = impl.mobileGrade(this);
            }
            return this._cache.grade;
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
    
    MobileDetect.version = '1.3.6 2017-04-05';

    return MobileDetect;
}); // end of call of define()
})((function (undefined) {
    if (typeof module !== 'undefined' && module.exports) {
        return function (factory) { module.exports = factory(); };
    } else if (typeof define === 'function' && define.amd) {
        return define;
    } else if (typeof window !== 'undefined') {
        return function (factory) { window.MobileDetect = factory(); };
    } else {
        // please file a bug if you get this error!
        throw new Error('unknown environment');
    }
})());
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
 * getSize v1.2.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, exports: false, require: false, module: false, console: false */

( function( window, undefined ) {

'use strict';

// -------------------------- helpers -------------------------- //

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') === -1 && !isNaN( num );
  return isValid && num;
}

function noop() {}

var logError = typeof console === 'undefined' ? noop :
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

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0, len = measurements.length; i < len; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}



function defineGetSize( getStyleProperty ) {

// -------------------------- setup -------------------------- //

var isSetup = false;

var getStyle, boxSizingProp, isBoxSizeOuter;

/**
 * setup vars and functions
 * do it on initial getSize(), rather than on script load
 * For Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function setup() {
  // setup once
  if ( isSetup ) {
    return;
  }
  isSetup = true;

  var getComputedStyle = window.getComputedStyle;
  getStyle = ( function() {
    var getStyleFn = getComputedStyle ?
      function( elem ) {
        return getComputedStyle( elem, null );
      } :
      function( elem ) {
        return elem.currentStyle;
      };

      return function getStyle( elem ) {
        var style = getStyleFn( elem );
        if ( !style ) {
          logError( 'Style returned ' + style +
            '. Are you running this code in a hidden iframe on Firefox? ' +
            'See http://bit.ly/getsizebug1' );
        }
        return style;
      };
  })();

  // -------------------------- box sizing -------------------------- //

  boxSizingProp = getStyleProperty('boxSizing');

  /**
   * WebKit measures the outer-width on style.width on border-box elems
   * IE & Firefox measures the inner-width
   */
  if ( boxSizingProp ) {
    var div = document.createElement('div');
    div.style.width = '200px';
    div.style.padding = '1px 2px 3px 4px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '1px 2px 3px 4px';
    div.style[ boxSizingProp ] = 'border-box';

    var body = document.body || document.documentElement;
    body.appendChild( div );
    var style = getStyle( div );

    isBoxSizeOuter = getStyleSize( style.width ) === 200;
    body.removeChild( div );
  }

}

// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  setup();

  // use querySeletor if elem is string
  if ( typeof elem === 'string' ) {
    elem = document.querySelector( elem );
  }

  // do not proceed on non-objects
  if ( !elem || typeof elem !== 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display === 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = !!( boxSizingProp &&
    style[ boxSizingProp ] && style[ boxSizingProp ] === 'border-box' );

  // get all measurements
  for ( var i=0, len = measurements.length; i < len; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    value = mungeNonPixel( elem, value );
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

// IE8 returns percent values, not pixels
// taken from jQuery's curCSS
function mungeNonPixel( elem, value ) {
  // IE8 and has percent value
  if ( window.getComputedStyle || value.indexOf('%') === -1 ) {
    return value;
  }
  var style = elem.style;
  // Remember the original values
  var left = style.left;
  var rs = elem.runtimeStyle;
  var rsLeft = rs && rs.left;

  // Put in the new values to get a computed value out
  if ( rsLeft ) {
    rs.left = elem.currentStyle.left;
  }
  style.left = value;
  value = style.pixelLeft;

  // Revert the changed values
  style.left = left;
  if ( rsLeft ) {
    rs.left = rsLeft;
  }

  return value;
}

return getSize;

}

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD for RequireJS
  define( [ 'get-style-property/get-style-property' ], defineGetSize );
} else if ( typeof exports === 'object' ) {
  // CommonJS for Component
  module.exports = defineGetSize( require('desandro-get-style-property') );
} else {
  // browser global
  window.getSize = defineGetSize( window.getStyleProperty );
}

})( window );

/**
 * matchesSelector v1.0.3
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false */

( function( ElemProto ) {

  'use strict';

  var matchesMethod = ( function() {
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

    for ( var i=0, len = prefixes.length; i < len; i++ ) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if ( ElemProto[ method ] ) {
        return method;
      }
    }
  })();

  // ----- match ----- //

  function match( elem, selector ) {
    return elem[ matchesMethod ]( selector );
  }

  // ----- appendToFragment ----- //

  function checkParent( elem ) {
    // not needed if already has parent
    if ( elem.parentNode ) {
      return;
    }
    var fragment = document.createDocumentFragment();
    fragment.appendChild( elem );
  }

  // ----- query ----- //

  // fall back to using QSA
  // thx @jonathantneal https://gist.github.com/3062955
  function query( elem, selector ) {
    // append to fragment if no parent
    checkParent( elem );

    // match elem with all selected elems of parent
    var elems = elem.parentNode.querySelectorAll( selector );
    for ( var i=0, len = elems.length; i < len; i++ ) {
      // return true if match
      if ( elems[i] === elem ) {
        return true;
      }
    }
    // otherwise return false
    return false;
  }

  // ----- matchChild ----- //

  function matchChild( elem, selector ) {
    checkParent( elem );
    return match( elem, selector );
  }

  // ----- matchesSelector ----- //

  var matchesSelector;

  if ( matchesMethod ) {
    // IE9 supports matchesSelector, but doesn't work on orphaned elems
    // check for that
    var div = document.createElement('div');
    var supportsOrphans = match( div, 'div' );
    matchesSelector = supportsOrphans ? match : matchChild;
  } else {
    matchesSelector = query;
  }

  // transport
  if ( typeof define === 'function' && define.amd ) {
    // AMD
    define( function() {
      return matchesSelector;
    });
  } else if ( typeof exports === 'object' ) {
    module.exports = matchesSelector;
  }
  else {
    // browser global
    window.matchesSelector = matchesSelector;
  }

})( Element.prototype );

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
 * Fizzy UI utils v1.0.1
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'doc-ready/doc-ready',
      'matches-selector/matches-selector'
    ], function( docReady, matchesSelector ) {
      return factory( window, docReady, matchesSelector );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('doc-ready'),
      require('desandro-matches-selector')
    );
  } else {
    // browser global
    window.fizzyUIUtils = factory(
      window,
      window.docReady,
      window.matchesSelector
    );
  }

}( window, function factory( window, docReady, matchesSelector ) {

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

// ----- isArray ----- //
  
var objToString = Object.prototype.toString;
utils.isArray = function( obj ) {
  return objToString.call( obj ) == '[object Array]';
};

// ----- makeArray ----- //

// turn element or nodeList into an array
utils.makeArray = function( obj ) {
  var ary = [];
  if ( utils.isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( obj && typeof obj.length == 'number' ) {
    // convert nodeList to array
    for ( var i=0, len = obj.length; i < len; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
};

// ----- indexOf ----- //

// index of helper cause IE8
utils.indexOf = Array.prototype.indexOf ? function( ary, obj ) {
    return ary.indexOf( obj );
  } : function( ary, obj ) {
    for ( var i=0, len = ary.length; i < len; i++ ) {
      if ( ary[i] === obj ) {
        return i;
      }
    }
    return -1;
  };

// ----- removeFrom ----- //

utils.removeFrom = function( ary, obj ) {
  var index = utils.indexOf( ary, obj );
  if ( index != -1 ) {
    ary.splice( index, 1 );
  }
};

// ----- isElement ----- //

// http://stackoverflow.com/a/384380/182183
utils.isElement = ( typeof HTMLElement == 'function' || typeof HTMLElement == 'object' ) ?
  function isElementDOM2( obj ) {
    return obj instanceof HTMLElement;
  } :
  function isElementQuirky( obj ) {
    return obj && typeof obj == 'object' &&
      obj.nodeType == 1 && typeof obj.nodeName == 'string';
  };

// ----- setText ----- //

utils.setText = ( function() {
  var setTextProperty;
  function setText( elem, text ) {
    // only check setTextProperty once
    setTextProperty = setTextProperty || ( document.documentElement.textContent !== undefined ? 'textContent' : 'innerText' );
    elem[ setTextProperty ] = text;
  }
  return setText;
})();

// ----- getParent ----- //

utils.getParent = function( elem, selector ) {
  while ( elem != document.body ) {
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

  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    // check that elem is an actual element
    if ( !utils.isElement( elem ) ) {
      continue;
    }
    // filter & find items if we have a selector
    if ( selector ) {
      // filter siblings
      if ( matchesSelector( elem, selector ) ) {
        ffElems.push( elem );
      }
      // find children
      var childElems = elem.querySelectorAll( selector );
      // concat childElems to filterFound array
      for ( var j=0, jLen = childElems.length; j < jLen; j++ ) {
        ffElems.push( childElems[j] );
      }
    } else {
      ffElems.push( elem );
    }
  }

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

// ----- htmlInit ----- //

// http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
utils.toDashed = function( str ) {
  return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
    return $1 + '-' + $2;
  }).toLowerCase();
};

var console = window.console;
/**
 * allow user to initialize classes via .js-namespace class
 * htmlInit( Widget, 'widgetName' )
 * options are parsed from data-namespace-option attribute
 */
utils.htmlInit = function( WidgetClass, namespace ) {
  docReady( function() {
    var dashedNamespace = utils.toDashed( namespace );
    var elems = document.querySelectorAll( '.js-' + dashedNamespace );
    var dataAttr = 'data-' + dashedNamespace + '-options';

    for ( var i=0, len = elems.length; i < len; i++ ) {
      var elem = elems[i];
      var attr = elem.getAttribute( dataAttr );
      var options;
      try {
        options = attr && JSON.parse( attr );
      } catch ( error ) {
        // log error, do not initialize
        if ( console ) {
          console.error( 'Error parsing ' + dataAttr + ' on ' +
            elem.nodeName.toLowerCase() + ( elem.id ? '#' + elem.id : '' ) + ': ' +
            error );
        }
        continue;
      }
      // initialize
      var instance = new WidgetClass( elem, options );
      // make available via $().data('layoutname')
      var jQuery = window.jQuery;
      if ( jQuery ) {
        jQuery.data( elem, namespace, instance );
      }
    }
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
    // console.log('reset', check);
    this.columns = {};
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

    this.rowCount = this.options.rows[this.breakPoint] ? this.options.rows[this.breakPoint] : this.options.rows;
};

AnyGrid.prototype._postLayout = function() {
  this.resizeContainer();
  this.emitEvent( 'postLayout', [ this ] );
};

AnyGrid.prototype._create = function() {
    this.reloadItems();

    this.element.style.position = "relative";

    if ( this.options.isResizeBound ) {
        this.bindResize();
    }

    this._resetLayout('create');
};

/**
 * layout a collection of item elements
 * @api public
 */
// AnyGrid.prototype.layoutItems = function( items, isInstant ) {
//   items = this._getItemsForLayout( items );
//   // console.log('layout');
//   // this.columns = {};
//   // this.rows = {};
//   // this.nextRow = 0;
//   // this.rowCounter = 0;
//   // this.nextColumn = 0;

//   // this.totalRows = Math.ceil(items.length / this.perRow);
//   // this.totalRows++;
//   // this.totalRows++;
//   // this.totalRows++;
//   // // var max = Math.max(this.perRow, this.totalRows); // TODO

//   // for (var i = 0; i < this.totalRows; i++) {
//   //     this.columns[i] = {
//   //       left: 0,
//   //     };

//   //     this.rows[i] = {
//   //       top: 0,
//   //       count: 0,
//   //       maxHeight: 0
//   //     };
//   // }

//   // console.log('do itaaaa', this.rows, this.columns);
//   this._layoutItems( items, isInstant );

//   this._postLayout();
// };

/**
 * get the items to be laid out
 * you may want to skip over some items
 * @param {Array} items
 * @returns {Array} items
 */
// AnyGrid.prototype._getItemsForLayout = function( items ) {
//   var layoutItems = [];

//   this.limit = 0;

//   for ( var i=0, len = items.length; i < len; i++ ) {
//     var item = items[i];
//     var span = item.setSpan((i+1), this.options.column_spans, this.perRow);
//     if ( !item.isIgnored ) {
//       layoutItems.push( item );
//     }
//   }
//   return layoutItems;
// };


AnyGrid.prototype.getComputedStyle = function (el, prop) {
    if (getComputedStyle !== 'undefined') {
        return getComputedStyle(el, null).getPropertyValue(prop);
    } else {
        return el.currentStyle[prop];
    }
};

AnyGrid.prototype._getItemLayoutPosition = function( item ) {
    // item.element.style.width = (this.containerWidth / this.columns.length) + 'px';

    var paddingTop = parseFloat(this.getComputedStyle(item.element, 'padding-top'));
    var paddingRight = parseFloat(this.getComputedStyle(item.element, 'padding-right'));
    var paddingBottom = parseFloat(this.getComputedStyle(item.element, 'padding-bottom'));
    var paddingLeft = parseFloat(this.getComputedStyle(item.element, 'padding-left'));

    //promote child padding $$$
    var child = item.element.children[0];
    var childPaddingTop = parseFloat(this.getComputedStyle(child, 'padding-top'));
    var childPaddingRight = parseFloat(this.getComputedStyle(child, 'padding-right'));
    var childPaddingBottom = parseFloat(this.getComputedStyle(child, 'padding-bottom'));
    var childPaddingLeft = parseFloat(this.getComputedStyle(child, 'padding-left'));

    item.element.style.paddingTop = paddingTop + childPaddingTop + 'px';
    item.element.style.paddingRight = paddingRight + childPaddingRight + 'px';
    item.element.style.paddingBottom = paddingBottom + childPaddingBottom + 'px';
    item.element.style.paddingLeft = paddingLeft + childPaddingLeft + 'px';

    child.style.padding = '0';

    var paddingLeft = parseInt(this.getComputedStyle(item.element, 'padding-left'));
    var paddingRight = parseInt(this.getComputedStyle(item.element, 'padding-right'));

    var width = ((this.containerWidth / this.perRow) + ((paddingLeft + paddingRight) / this.perRow)) * item.span;

    item.element.style.width = width + 'px';

    if (this.index == 0 && this.options.adjustGutter) {
      this.element.parentNode.style.marginLeft = (paddingLeft * -1) + 'px';
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

    if (!this.rows[column]) {
      this.rows[column] = {
          top: 0,
          count: 0,
          maxHeight: 0
      };
    }

    if (!this.columns[row]) {
      this.columns[row] = {
        left: 0
      };
    }

    if (!this.heights[row]) {
      this.heights[row] = {};
    }

    if (!this.heights[row][column]) {
      this.heights[row][column] = {
        height: 0
      };
    }

    if (!this.rows[row].perRow) {
      this.rows[row].perRow = this.perRow;
    }

    if (!this.rows[row].items) {
      this.rows[row].items = [];
    }

    this.rows[row].items.push(item);
    item.index = this.index;
    this.index++;

    if (item.span > 1) {
      this.rows[row].perRow = ((this.rows[row].perRow - item.span) * 2) + 1;

      if ((this.spanCounter + item.span) == this.perRow) {
        this.rows[row].perRow = (this.rowCounter + 1);
      }

      this.stacking = true;

      this.rows[row].spans = { //TODO
        leftReset: width,
        span: item.span
      };
    }

    this.spanCounter += item.span;
    this.rowCounter++;

    if (this.rowCounter == this.rows[row].perRow) {
        this.rowCounter = 0;
        this.spanCounter = 0;
        this.nextRow++;
    }

    this.rows[row].count++;

    this.nextColumn += item.span;

    // if the row count matches perRow reset to 0
    if (this.rows[row].count == this.rows[row].perRow) {
        this.nextColumn = 0;
    }

    if (this.nextStacked) {
      item.stacked = true;
    }

    // if the nextColumn is >= perRow or next is stacked use the same row
    if (this.nextColumn >= this.perRow || this.nextStacked) {
        this.nextColumn = this.rows[row].spans.span;
        this.rows[row].spans.span = this.rows[row].spans.span + item.span;
        this.stacking = false;

        if (this.rows[row].count >= this.rows[row].perRow) {
          this.nextStacked = false;
          this.nextColumn = 0;
        } else {
          this.nextStacked = true;
        }
    } else {
      this.nextStacked = false;
    }

    if (this.options.removeVerticalGutters && (row + 1) == this.rowCount && !stacking) {
      item.element.style.setProperty('padding-bottom', '0', 'important');
    }

    if (this.options.removeVerticalGutters && row === 0 && item.stacked !== true) {
      item.element.style.setProperty('padding-top', '0', 'important');
    }

    item.getSize();

    var x = this.columns[row].left;

    var y = this.rows[column].top; // set the top to the row column top

    // prepare for next time
    if (this.heights[row][column].height > 0) {
       this.heights[row][column].height = this.heights[row][column].height + item.size.height;
    } else {
      this.heights[row][column].height = item.size.height;
    }

    this.rows[column].top = this.rows[column].top + item.size.height;

    // increae top for all row columns
    for (var i = 1; i < item.span; i++) {
      if (!this.rows[column + i]) {
        this.rows[column + i] = {
            top: 0,
            count: 0,
            maxHeight: 0
        };
      }
      this.rows[column + i].top = this.rows[column + i].top + item.size.height;
    }

    // if not in the first column, same column and not stacked
    if (this.nextColumn === 0 || (this.nextColumn != column && !this.nextStacked)) {
      // increase the left
      this.columns[row].left = this.columns[row].left + width;
      // all done for this row? make sure things are maxed out
      if ((column + 1) == this.perRow || this.nextColumn == 0) {
        var max = 0;
        for (var key in this.rows) { // get max
          if (this.rows.hasOwnProperty(key) && this.rows[key].top > max) {
            max = this.rows[key].top;
          }
        }

        if (this.options.stacked === false) {
          for (var key in this.rows) {
            if (this.rows.hasOwnProperty(key)) {
              this.rows[key].top = max;
            }
          }
        }
      }
    } else {
      if (!this.columns[row].leftReset) {
        this.columns[row].leftReset = this.rows[row].spans.leftReset;
      } else {
        this.columns[row].leftReset = this.columns[row].leftReset + width;
      }
      this.columns[row].left = this.columns[row].leftReset;
    }

    // maxHeight
    this.maxHeight = Math.max(this.maxHeight, this.rows[column].top);

    // if last item in the row calculate heights
    if (this.rows[row].count == this.rows[row].perRow) {
      var maxHeight = 0;
      for (var key in this.heights[row]) { // get max
        if (this.heights[row].hasOwnProperty(key) && this.heights[row][key].height > maxHeight) {
          maxHeight = this.heights[row][key].height;
        }
      }
      this.heights[row].maxHeight = maxHeight;
    }

    this.rows[row].maxHeight = this.maxHeight;

    return {
      x: x,
      y: y
    };
};

AnyGrid.prototype._getContainerSize = function() {
    return {
        height: this.maxHeight
    };
};

return AnyGrid;

}));
//Overriding to add height and width to transitionProps.
( function( window, factory ) {
'use strict';
  // universal module definition
    // browser global
    window.AnyGrid = window.AnyGrid || {};
    window.AnyGrid.Item = factory(
      window.Outlayer
    );

}( window, function factory( Outlayer ) {
'use strict';

// -------------------------- Item -------------------------- //

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


// sub-class Outlayer Item
function Item() {
  Outlayer.Item.apply( this, arguments );
}

Item.prototype = new Outlayer.Item();

// dash before all cap letters, including first for
// WebkitTransform => -webkit-transform
function toDashedAll( str ) {
  return str.replace( /([A-Z])/g, function( $1 ) {
    return '-' + $1.toLowerCase();
  });
}

var transitionProps = 'opacity, height, width, padding,' +
  toDashedAll( vendorProperties.transform || 'transform' );

Item.prototype.moveTo = function( x, y, force) {

  if (!supportsCSS3) {
    this.goTo(x, y);
    return;
  }

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
  if ( !force && didNotMove && !this.isTransitioning ) {
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

Item.prototype.setPosition = function( x, y ) {
  this.position.x = Number(Math.round(x + 'e2') + 'e-2');
  this.position.y = Number(Math.round(y + 'e2') + 'e-2')
};

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


// Item.prototype._create = function() {
//   // assign id, used for original-order sorting
//   this.id = this.layout.itemGUID++;
//   Outlayer.Item.prototype._create.call( this );
//   this.sortData = {};
// };

return Item;

}));
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
 * Revcontent overlay
 */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition
    // browser global
    window.revOverlay = factory(
      window
    );

}( window, function factory( window ) {

'use strict';

var overlay = {};

// used for reusing icons that just need a new id/class swapped in
overlay.iconTemplates = {
    videoCircle: '<svg class="rc-icon-video" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"' +
                             'id="{{id}}-video-icon" width="100%" viewBox="0 0 440 440">' +
                            '<circle id="{{id}}" cx="220" cy="220" r="200" style=""></circle>' +
                            '<path class="rc-icon-video-arrow" style="stroke-linejoin:miter;"' +
                                  'd="m 175,150 0,150 120,-75 z" ></path>' +
                            '<image width="100%" src="//serve.revcontent.com/assets/img/{{id}}-video-icon.png" xlink:href="">' +
                        '</svg>'
};

overlay.icons = {
    video_rectangle: '<svg class="rc-icon-video" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"' +
                            'id="rectangle-video-icon" viewBox="0 0 640 448">' +
                            '<rect id="rect1" width="640" height="448" x="0" y="0" ry="110" rx="110"></rect>' +
                            '<path class="rc-icon-video-arrow" d="m 250,127 0,187.125 182.59375,-93.5625 z"></path>' +
                            '<image width="100%" src="//serve.revcontent.com/assets/img/rect-video-icon.png" xlink:href="">' +
                          '</svg>',
    video_square: '<svg class="rc-icon-video" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"' +
                             'id="square-video-icon" width="100%" viewBox="0 0 440 440">' +
                            '<rect id="square1" width="400" height="400" x="20" y="20"></rect>' +
                            '<path class="rc-icon-video-arrow" style="stroke-linejoin:miter;"' +
                                  'd="m 175,150 0,150 120,-75 z" ></path>' +
                            '<image width="100%" src="//serve.revcontent.com/assets/img/square-video-icon.png" xlink:href="">' +
                        '</svg>',
    video_circle1: overlay.iconTemplates.videoCircle.replace(/{{id}}/g, 'circle1'),
    video_circle2: overlay.iconTemplates.videoCircle.replace(/{{id}}/g, 'circle2'),
    video_triangle: '<svg class="rc-icon-video" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"' +
                             'id="triangle-video-icon" width="100%" viewBox="0 0 400 340">' +
                            '<defs>' +
                                '<filter id="shadow" x="0" y="0" width="200%" height="200%">' +
                                    '<feOffset result="offOut" in="SourceAlpha" dx="3" dy="4" />' +
                                    '<feGaussianBlur result="blurOut" in="offOut" stdDeviation="7" />' +
                                    '<feBlend in="SourceGraphic" in2="blurOut" mode="normal" />' +
                                '</filter>' +
                            '</defs>' +
                            '<path class="rc-icon-video-arrow" style="stroke-linejoin:miter;"' +
                                  'd="m 100,50 0,250 220,-125 z" ></path>' +
                            '<image width="100%" src="//serve.revcontent.com/assets/img/tri-video-icon.png" xlink:href="">' +
                        '</svg>'
};

overlay.image = function(image, content_type, overlay, position) {
    if (!overlay[content_type]) { // is there a config passed for this content_type?
        return;
    }

    var icon = this.icons[overlay[content_type]];
    if (!icon) { // does this icon exist
        return;
    }

    image.insertAdjacentHTML('beforeend', '<div class="rc-icon rc-image-icon rc-icon-'+ position +'">' + icon + '</div>');
};

overlay.ad = function(container, content_type, overlay, position) {
    if (!overlay[content_type]) { // is there a config passed for this content_type?
        return;
    }

    var icon = this.icons[overlay[content_type]];
    if (!icon) { // does this icon exist
        return;
    }

  container.insertAdjacentHTML('beforeend', '<div class="rc-icon rc-ad-icon rc-icon-'+ position +'">' + icon + '</div>');
};

// -----  ----- //
return overlay;

}));
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

utils.checkVisibleItem = function(item, callback, percentVisible, buffer) {
    var that = this;
    requestAnimationFrame(function() {
        // what percentage of the element should be visible
        var visibleHeightMultiplier = (typeof percentVisible === 'number') ? (parseInt(percentVisible) * .01) : 0;
        // fire if within buffer
        var bufferPixels = (typeof buffer === 'number') ? buffer : 0;

        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        var elementTop = item.element.getBoundingClientRect().top;
        var elementBottom = item.element.getBoundingClientRect().bottom;
        var elementVisibleHeight = item.element.offsetHeight * visibleHeightMultiplier;

        if ((scroll + windowHeight >= (elementTop + scroll + elementVisibleHeight - bufferPixels)) &&
            elementBottom > elementVisibleHeight) {
            callback.call(that, true, item);
        } else {
            callback.call(that, false, item)
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

    RevDialog.prototype.setActive = function(active) {
        this.active = active;

        // hide the frames
        this.aboutFrame.style.display = 'none';
        if (this.interestFrame) {
            this.interestFrame.style.display = 'none';
        }

        switch (active) {
            case 'about':
                // set height and class right away b/c is always first
                revUtils.removeClass(this.element, 'rev-interest-dialog');
                // wait for load before showing and centering
                if (!this.aboutLoaded) {
                    this.loading.style.display = 'block';
                    // create about iframe
                    var that = this;
                    revUtils.addEventListener(this.aboutFrame, 'load', function() {
                        that.loading.style.display = 'none';
                        that.aboutFrame.style.display = 'block';
                        that.centerDialog();
                        that.aboutLoaded = true;
                        revUtils.removeEventListener(that.aboutFrame, 'load', arguments.callee);
                    });
                } else {
                    this.aboutFrame.style.display = 'block';
                    this.centerDialog();
                }
                break;
            case 'interest':
                if (!this.interestLoaded) {
                    this.loading.style.display = 'block';
                    this.interestFrame = this.createFrame(this.interestSrc);
                    this.interestFrame.style.display = 'none';
                    this.modalContentContainer.appendChild(this.interestFrame);
                    var that = this;
                    revUtils.addEventListener(this.interestFrame, 'load', function() {
                        that.loading.style.display = 'none';
                        revUtils.addClass(that.element, 'rev-interest-dialog');
                        that.interestFrame.style.display = 'block';
                        that.centerDialog();
                        that.interestLoaded = true;
                        revUtils.removeEventListener(that.interestFrame, 'load', arguments.callee);
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
            this.modalContentContainer = this.element.querySelectorAll('.rd-modal-content')[0]

            this.modalContentContainer.appendChild(this.loading);

            this.aboutFrame = this.createFrame(this.aboutSrc);
            this.setActive('about');
            // append iframe
            this.modalContentContainer.appendChild(this.aboutFrame);

            this.attachPostMesssage();
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
        document.body.style.overflow = this.bodyOverflow;
        this.element.style.display = 'none';
        if (this.grid) {
            this.grid.bindResize();
        }
        // make sure we are ready for the about dialog if opened again
        this.setActive('about');
        return false;
    };

    RevDialog.prototype.centerDialog = function(context) {
        var containerWidth = document.documentElement.clientWidth;
        var containerHeight = document.documentElement.clientHeight;

        // do we need to go to compact mode?
        this.frameHeight = this.active == 'about' ? this.aboutHeight : this.interestHeight;

        this.modalContentContainer.style.height = this.frameHeight + 'px';

        var availableSpace = containerHeight - 20;
        if (availableSpace < this.frameHeight) {
            var compact = true;
            this.modalContentContainer.style.height = availableSpace + 'px';
        }

        var left = Math.max(0, (containerWidth / 2) - (this.modalContentContainer.offsetWidth / 2));
        var top = compact ? 0 : Math.max(0, (containerHeight / 2) - (this.modalContentContainer.offsetHeight / 2));

        var db = document.querySelector('.rd-box');
        db.style.top = top+'px';
        db.style.left = left+'px';
    };

    RevDialog.prototype.attachPostMesssage = function() {
        var that = this;
        revUtils.addEventListener(window, 'message', function(e) {
            switch (e.data.msg) {
                case 'open_me':
                    that.setActive('interest');
                    break;
                case 'close_me':
                    that.closeDialog();
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
                that.centerDialog('resize');
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

    RevDisclose.prototype.getDisclosure = function (disclosureText) {
        var self = this;
        self.setDisclosureText(disclosureText);
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

var detect = new MobileDetect(window.navigator.userAgent);

detect.device = function() {
    var device = 'desktop';

    if (detect.phone() !== null) {
        device = 'phone';
    }

    if (detect.tablet() !== null) {
        device = 'tablet'
    }

    return device;
}

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

api.xhr = function(url, success, failure) {
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
            header_selector: false,
            headline_icon_selector: false,
            internal_selector: false,
            reactions_selector: false,
            headline_top_selector: false,
            header_logo: false,
            window_width_enabled: false,
            reactions: [ 'love', 'laugh', 'cool', 'idiotic', 'sad', 'angry' ]
        };

        this.mockSponsored = {
            espn: [
                {
                    "headline": "2017 New York Yankees Game Used Baseball",
                    "target_url": "https://ad.atdmt.com/c/go;p=11252201020181;ev.a=1;idfa=;idfa_lat=;aaid=;aaid_lat=;cache=",
                    "url": "https://ad.atdmt.com/c/go;p=11252201020181;ev.a=1;idfa=;idfa_lat=;aaid=;aaid_lat=;cache=",
                    // "date": "2016-08-25 16:52:35",
                    "image": "https://cdn.shopify.com/s/files/1/1161/1250/products/2017nyybau000027_01_grande_89c36092-682b-47ff-a5d1-74c7cc7a03f7.jpg?v=1505256128",
                    "brand": "Steiner Sports",
                    "favicon_url": "https://pbs.twimg.com/profile_images/806621571842527232/RLB5SEau.jpg",
                    "type": "sponsored"
                },
                {
                    "headline": "Jim Kelly Signed Buffalo Bills White Mini Helmet w/ HOF Inscription",
                    "target_url": "http://247sports.com/Gallery/NBA-brother-duos-ranked-from-awful-to-pretty-great-52872696/GallerySlides/561038?ftag=ACQ-00-10aaj0a",
                    "url": "http://247sports.com/Gallery/NBA-brother-duos-ranked-from-awful-to-pretty-great-52872696/GallerySlides/561038?ftag=ACQ-00-10aaj0a",
                    // "date": "2017-06-23 15:03:56",
                    "image": "https://ii.modells.com/fcgi-bin/iipsrv.fcgi?FIF=/images/modells//source/10000009/912d9b4eccfd249eb28968f662a718048f1b0f3038e2d15615e325efb4c9fce4_1152-976.tif&wid=446=&cvt=jpeg",
                    "brand": "Modells",
                    "favicon_url": "https://d2qbxixihjvzn0.cloudfront.net/ps/getCropped/7owbwtW000?res=225x225&index=us",
                    "type": "sponsored"
                },
                {
                    "headline": "Nike Sportswear Womens Fleece Pant",
                    "target_url": "http://myvoteitup.com/?utm_source=revcontent&utm_campaign=us-rc-direct-suv-mob&adgroup=native&utm_content=405df2",
                    "url": "http://myvoteitup.com/?utm_source=revcontent&utm_campaign=us-rc-direct-suv-mob&adgroup=native&utm_content=405df2",
                    // "date": "2017-05-15 22:04:46",
                    "image": "https://ii.modells.com/fcgi-bin/iipsrv.fcgi?FIF=/images/modells//source/90000064/803660_2.tif&wid=446=&cvt=jpeg",
                    "brand": "Modells",
                    "favicon_url": "https://d2qbxixihjvzn0.cloudfront.net/ps/getCropped/7owbwtW000?res=225x225&index=us",
                    "type": "sponsored"
                },
                {
                    "headline": "Check out this amazing Medicine ball",
                    "target_url": "https://www.modells.com/product/impex_5_lb_d_shaped_hand_weight-idw-005.do?sortby=bestSellers&refType=&from=fn&ecList=7&ecCategory=110271",
                    "url": "http://www.libertyproject.com/well-being/how-hellofresh-makes-home-cooking-easy-and-fun/",
                    // "date": "2017-01-11 19:52:10",
                    "image": "https://ii.modells.com/fcgi-bin/iipsrv.fcgi?FIF=/images/modells//source/90000078/idw-005_nc.tif&wid=446=&cvt=jpeg",
                    "brand": "Modells",
                    "favicon_url": "https://d2qbxixihjvzn0.cloudfront.net/ps/getCropped/7owbwtW000?res=225x225&index=us",
                    "type": "sponsored"
                },
                {
                    "headline": "Gary Sanchez Signed 'Swinging' 8x10 Photo",
                    "target_url": "https://www.steinersports.com/collections/signed-baseball-photos/products/gary-sanchez-signed-swinging-8x10-photo?sort=desc-bestselling",
                    "url": "http://247sports.com/Gallery/Predicting-the-2017-records-of-every-NFL-team--52256885/GallerySlides/522808?ftag=ACQ-00-10aaj0a",
                    // "date": "2017-06-26 17:20:39",
                    "image": "//cdn.shopify.com/s/files/1/1161/1250/products/SANCPHS008004_182ecd35-ffdb-453d-b260-f2bcce395f73_grande.jpg?v=1497453132",
                    "brand": "Steiner Sports",
                    "favicon_url": "https://pbs.twimg.com/profile_images/806621571842527232/RLB5SEau.jpg",
                    "type": "sponsored"
                },
                {
                    "headline": "Jim Kelly Buffalo Bills Red Mini Helmet w/ HOF Inscription",
                    "target_url": "https://ff.zone/?flux_fts=xtxlataqlqalcqzzqeqpqlotaiqptxztaaoad52e&amp;flux_cost=0.01&amp;target={adv_targets}&amp;campaign={boost_id}&amp;content={content_id}&amp;widget={widget_id}",
                    "url": "https://ff.zone/?flux_fts=xtxlataqlqalcqzzqeqpqlotaiqptxztaaoad52e&amp;flux_cost=0.01&amp;target={adv_targets}&amp;campaign={boost_id}&amp;content={content_id}&amp;widget={widget_id}",
                    // "date": "2017-07-08 06:35:25",
                    "image": "https://ii.modells.com/fcgi-bin/iipsrv.fcgi?FIF=/images/modells//source/10000010/038c75468fdf49f8adb750ce57b29593d187d66bc7f1c94aca4a285508efd8c7_1194-1064.tif&wid=446=&cvt=jpeg",
                    "brand": "Modells",
                    "favicon_url": "https://d2qbxixihjvzn0.cloudfront.net/ps/getCropped/7owbwtW000?res=225x225&index=us",
                    "type": "sponsored"
                },
                {
                    "headline": "Jim Kelly & Thurman Thomas Dual Signed NFL Football w/ \"No One Circles the Wagons Like the Buffalo Bills\" Insc. (Inscribed by Thomas)",
                    "target_url": "http://adv.123trackingurl.com/aff_c?offer_id=8&amp;aff_id=1002",
                    "url": "http://adv.123trackingurl.com/aff_c?offer_id=8&amp;aff_id=1002",
                    // "date": "2016-10-20 08:44:36",
                    "image": "//cdn.shopify.com/s/files/1/1161/1250/products/eec1ffdb7a580941988f35b910fc4602_grande.jpg?v=1479630823",
                    "brand": "Steiner Sports",
                    "favicon_url": "https://pbs.twimg.com/profile_images/806621571842527232/RLB5SEau.jpg",
                    "type": "sponsored"
                },
                {
                    "headline": "Milwaukee Bucks Adult Fortune Quarter Zip Pullover",
                    "target_url": "http://247sports.com/Gallery/Predicting-the-2017-records-of-every-NFL-team--52256885/GallerySlides/522808?ftag=ACQ-00-10aaj0a",
                    "url": "http://247sports.com/Gallery/Predicting-the-2017-records-of-every-NFL-team--52256885/GallerySlides/522808?ftag=ACQ-00-10aaj0a",
                    // "date": "2017-06-26 17:20:43",
                    "image": "https://ii.modells.com/fcgi-bin/iipsrv.fcgi?FIF=/images/modells//source/10000007/f4b0a5f3b3032a228383225704d15bb95448c20db0e01361448ea2797db08ed9_1200-1200.tif&wid=446=&cvt=jpeg",
                    "brand": "Modells",
                    "favicon_url": "https://d2qbxixihjvzn0.cloudfront.net/ps/getCropped/7owbwtW000?res=225x225&index=us",
                    "type": "sponsored"
                },
                {
                    "headline": "OJ Anderson SB XXV Rushing 8x10 Photo",
                    "target_url": "http://buynewpickuptruck.com",
                    "url": "http://buynewpickuptruck.com",
                    // "date": "2017-03-06 12:05:06",
                    "image": "//cdn.shopify.com/s/files/1/1161/1250/products/ANDEPHS008016_01_grande.jpg?v=1492445494",
                    "brand": "Steiner Sports",
                    "favicon_url": "https://pbs.twimg.com/profile_images/806621571842527232/RLB5SEau.jpg",
                    "type": "sponsored"
                },
                {
                    "headline": "Bollinger Cross Training Mat",
                    "target_url": "http://video.golfdigest.com/watch/golf-all-night-in-the-heart-of-dubai-at-emirates-golf-club?mbid=marketing_paid_revcontent_golf_Ejcpv",
                    "url": "http://video.golfdigest.com/watch/golf-all-night-in-the-heart-of-dubai-at-emirates-golf-club?mbid=marketing_paid_revcontent_golf_Ejcpv",
                    // "date": "2017-05-12 16:10:00",
                    "image": "https://ii.modells.com/fcgi-bin/iipsrv.fcgi?FIF=/images/modells//source/90000071/6533_400.tif&wid=446=&cvt=jpeg",
                    "brand": "Modells",
                    "favicon_url": "https://d2qbxixihjvzn0.cloudfront.net/ps/getCropped/7owbwtW000?res=225x225&index=us",
                    "type": "sponsored"
                },
                {
                    "headline": "New York Yankees Adult Aaron Judge Jersey",
                    "target_url": "http://247sports.com/Gallery/NBA-brother-duos-ranked-from-awful-to-pretty-great-52872696/GallerySlides/561038?ftag=ACQ-00-10aaj0a",
                    "url": "http://247sports.com/Gallery/NBA-brother-duos-ranked-from-awful-to-pretty-great-52872696/GallerySlides/561038?ftag=ACQ-00-10aaj0a",
                    // "date": "2017-06-26 17:43:34",
                    "image": "https://ii.modells.com/fcgi-bin/iipsrv.fcgi?FIF=/images/modells//source/90000077/7700yaasnk7j99_410.tif&wid=446=&cvt=jpeg",
                    "brand": "Steiner Sports",
                    "favicon_url": "https://pbs.twimg.com/profile_images/806621571842527232/RLB5SEau.jpg",
                    "type": "sponsored"
                },
                {
                    "headline": "Tom Hardy Signed The Dark Knight Rises At the Stock Exchange 8x10 Photo",
                    "target_url": "http://www.maxworkouts.com/lp/how-to-get-ripped-abs-after-40-pg-1",
                    "url": "http://www.maxworkouts.com/lp/how-to-get-ripped-abs-after-40-pg-1",
                    // "date": "2017-05-10 17:15:28",
                    "image": "//cdn.shopify.com/s/files/1/1161/1250/products/96d0d11b10c8e2e44a291fdeae92902a_grande.jpg?v=1477992521",
                    "brand": "Steiner Sports",
                    "favicon_url": "https://pbs.twimg.com/profile_images/806621571842527232/RLB5SEau.jpg",
                    "type": "sponsored"
                },
                {
                    "headline": "Kevin Seraphin New York Knicks 2015-16 Game Used #1 Blue Warmup Jacket (3XL)",
                    "target_url": "http://247sports.com/Gallery/NBA-brother-duos-ranked-from-awful-to-pretty-great-52872696/GallerySlides/561038?ftag=ACQ-00-10aaj0a",
                    "url": "http://247sports.com/Gallery/NBA-brother-duos-ranked-from-awful-to-pretty-great-52872696/GallerySlides/561038?ftag=ACQ-00-10aaj0a",
                    // "date": "2017-06-26 17:43:36",
                    "image": "//cdn.shopify.com/s/files/1/1161/1250/products/7826e4bd11dc857cb2750e0b9dc4bd7f_6c19db25-586b-4e79-91f5-eafa8ba1211c_grande.jpg?v=1478077410",
                    "brand": "Steiner Sports",
                    "favicon_url": "https://pbs.twimg.com/profile_images/806621571842527232/RLB5SEau.jpg",
                    "type": "sponsored"
                },
                {
                    "headline": "Chicago Bulls Adult City Gym Basketball Socks",
                    "target_url": "http://247sports.com/Gallery/Madden-17-ratings-released-for-NFL-first-round-draft-choices-52579234/GallerySlides/543715?ftag=ACQ-00-10aaj0a",
                    "url": "http://247sports.com/Gallery/Madden-17-ratings-released-for-NFL-first-round-draft-choices-52579234/GallerySlides/543715?ftag=ACQ-00-10aaj0a",
                    // "date": "2017-06-26 17:43:43",
                    "image": "https://ii.modells.com/fcgi-bin/iipsrv.fcgi?FIF=/images/modells//source/90000071/m558a17cbu_nc.tif&wid=446=&cvt=jpeg",
                    "brand": "Modells",
                    "favicon_url": "https://d2qbxixihjvzn0.cloudfront.net/ps/getCropped/7owbwtW000?res=225x225&index=us",
                    "type": "sponsored"
                }
            ],
            newsweek: [
                {
                    "headline": "Learn About The Razor Causing So Many Guys To Switch",
                    "target_url": "https://ad.atdmt.com/c/go;p=11252201476526;ev.a=1;idfa=;idfa_lat=;aaid=;aaid_lat=;cache=",
                    "url": "https://ad.atdmt.com/c/go;p=11252201476526;ev.a=1;idfa=;idfa_lat=;aaid=;aaid_lat=;cache=",
                    // "date": "2016-08-25 16:57:15",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1474992575.png",
                    "brand": "Harry's",
                    "favicon_url": null,
                    "type": "Sponsored"
                },
                {
                    "headline": "Eva Longoria&#39;s Surprising DNA Test",
                    "target_url": "http://www.ancestry.com/s74266/t35312/rd.ashx",
                    "url": "http://www.ancestry.com/s74266/t35312/rd.ashx",
                    // "date": "2016-10-31 15:21:09",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1480975468.jpg",
                    "brand": "Ancestry",
                    "favicon_url": null,
                    "type": "Sponsored"
                },
                {
                    "headline": "The Most Liberal City In America Will Shock You",
                    "target_url": "http://www3.forbes.com/lifestyle/the-most-conservative-and-most-liberal-cities-in-america",
                    "url": "http://www3.forbes.com/lifestyle/the-most-conservative-and-most-liberal-cities-in-america",
                    // "date": "2016-11-03 16:56:48",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1477944994.jpg",
                    "brand": "Forbes",
                    "favicon_url": null,
                    "type": "Sponsored"
                },
                {
                    "headline": "This Course is Unlike Anything You've Experienced",
                    "target_url": "http://video.golfdigest.com/watch/golf-all-night-in-the-heart-of-dubai-at-emirates-golf-club?mbid=marketing_paid_revcontent_golf_Ejcpv",
                    "url": "http://video.golfdigest.com/watch/golf-all-night-in-the-heart-of-dubai-at-emirates-golf-club?mbid=marketing_paid_revcontent_golf_Ejcpv",
                    // "date": "2017-05-12 16:10:00",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1494619794.png",
                    "brand": "Golf Digest",
                    "favicon_url": "http://video.golfdigest.com/favicon.ico",
                    "type": "Sponsored"
                },
                {
                    "headline": "We Tried Blue Apron: Here's What Happened",
                    "target_url": "http://www.libertyproject.com/culture/why-everyone-talking-about-blue-apron/",
                    "url": "http://www.libertyproject.com/culture/why-everyone-talking-about-blue-apron/",
                    // "date": "2016-09-01 15:23:09",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1470861635.png",
                    "brand": "The Liberty Project",
                    "favicon_url": null,
                    "type": "Sponsored"
                },
                {
                    "headline": "Jaw-Dropping New SUVs Offer More Than Ever",
                    "target_url": "http://myvoteitup.com/?utm_source=revcontent&utm_campaign=us-rc-direct-suv-mob&adgroup=native&utm_content=405df2",
                    "url": "http://myvoteitup.com/?utm_source=revcontent&utm_campaign=us-rc-direct-suv-mob&adgroup=native&utm_content=405df2",
                    // "date": "2017-05-15 22:04:46",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/00365660ca0b0f8bfcf13802f6f09644.png",
                    "brand": "SUV Sponsored Ads ",
                    "favicon_url": null,
                    "type": "Sponsored"
                },
                {
                    "headline": "We Tried Blue Apron: Here's What Happened",
                    "target_url": "http://www.popdust.com/why-everyone-is-talking-about-blue-apron-1891153755.html",
                    "url": "http://www.popdust.com/why-everyone-is-talking-about-blue-apron-1891153755.html",
                    // "date": "2016-11-08 11:52:51",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1478623971.jpg",
                    "brand": "Popdust",
                    "favicon_url": null,
                    "type": "Sponsored"
                },
                {
                    "headline": "3 Simple Steps to Shed Belly Fat over 40",
                    "target_url": "http://www.maxworkouts.com/lp/how-to-get-ripped-abs-after-40-pg-1",
                    "url": "http://www.maxworkouts.com/lp/how-to-get-ripped-abs-after-40-pg-1",
                    // "date": "2017-05-10 17:15:28",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1494450763.jpg",
                    "brand": "MAX Workouts",
                    "favicon_url": "http://www.maxworkouts.com/design/images/favicon.png",
                    "type": "Sponsored"
                },
                {
                    "headline": "The Best Affordable Car Under $20,000",
                    "target_url": "http://adv.123trackingurl.com/aff_c?offer_id=6&amp;aff_id=1002",
                    "url": "http://adv.123trackingurl.com/aff_c?offer_id=6&amp;aff_id=1002",
                    // "date": "2016-10-20 08:56:00",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1476316214.jpg",
                    "brand": "Kelley Blue Book",
                    "favicon_url": null,
                    "type": "Sponsored"
                },
                {
                    "headline": "They Could Be Headed To The Hall Of Fame, But Are They The Best?",
                    "target_url": "http://247sports.com/Gallery/NBA-brother-duos-ranked-from-awful-to-pretty-great-52872696/GallerySlides/561038?ftag=ACQ-00-10aaj0a",
                    "url": "http://247sports.com/Gallery/NBA-brother-duos-ranked-from-awful-to-pretty-great-52872696/GallerySlides/561038?ftag=ACQ-00-10aaj0a",
                    // "date": "2017-06-26 17:43:36",
                    "image": "https://revcontent-p0.s3.amazonaws.com/content/images/1498514024.png",
                    "brand": "247Sports",
                    "favicon_url": "http://247sports.com/favicon.ico",
                    "type": "Sponsored"
                },
            ]
        };

        this.mockInternal =
         {
            espn: [
                {
                    "headline": "New York Yankees' Todd Frazier gives a big thumbs up to thumbs down",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20706691\/new-york-yankees-todd-frazier-gives-big-thumbs-thumbs-down",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20706691\/new-york-yankees-todd-frazier-gives-big-thumbs-thumbs-down",
                    "description": "While a fan gave Todd Frazier's homer on Monday night a thumbs down, the Yankees' third baseman has decided to make the gesture his own when there's reason to celebrate.",
                    "date": "2017-09-15T00:43:04Z",
                    "image": "http:\/\/a.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0813%2Fr243868_1296x729_16%2D9.jpg",
                    "author": "Jay Crawford",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Judge hits pair of 3-run homers, Yanks rout Orioles 13-5",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370914110",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370914110",
                    "description": "Aaron Judge had a pair of three-run homers for a career-best six RBI, Todd Frazier hit a three-run homer that chased Wade Miley with one out in a six-run first inning and the New York Yankees routed the fading Baltimore Orioles 13-5 on Thursday night.",
                    "date": "2017-09-15T02:32:08Z",
                    "image": "http:\/\/a4.espncdn.com\/combiner\/i?img=%2Fmedia%2Fmotion%2F2017%2F0914%2Fdm_170914_MLB_YANKEES_SANCHEZ_HR%2Fdm_170914_MLB_YANKEES_SANCHEZ_HR.jpg",
                    "author": "Jayson Stark",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "video_id": 1,
                    "type": "internal"
                },
                {
                    "headline": "Yankee Stadium sound system fails for first inning of New York Yankees-Baltimore Orioles game",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20706653\/yankee-stadium-sound-system-fails-first-inning-new-york-yankees-baltimore-orioles-game",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20706653\/yankee-stadium-sound-system-fails-first-inning-new-york-yankees-baltimore-orioles-game",
                    "description": "Yankee Stadium's sound system failed before New York took the field against the Baltimore Orioles on Thursday night. There was no introduction of players or national anthem, and a pregame tribute to the late Gene Michael was scrapped.",
                    "date": "2017-09-15T00:36:04Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0807%2Fr241124_1296x729_16%2D9.jpg",
                    "author": "Pierre LeBrun",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "New York Yankees reliever Dellin Betances still upset over Joe Girardi bringing in Aroldis Chapman",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20705971\/new-york-yankees-reliever-dellin-betances-upset-joe-girardi-bringing-aroldis-chapman",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20705971\/new-york-yankees-reliever-dellin-betances-upset-joe-girardi-bringing-aroldis-chapman",
                    "description": "Dellin Betances isn't happy that Yankees manager Joe Girardi lifted him in favor of Aroldis Chapman on Wednesday. Girardi says that's a sign Betances believes in himself and he's fine if players are mad at him.",
                    "date": "2017-09-14T22:42:10Z",
                    "image": "http:\/\/a.espncdn.com\/combiner\/i?img=%2Fphoto%2F2015%2F0707%2Fmlb_betancesd_st_1296x729.jpg",
                    "author": "Jemele Hill",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Yankees beat Rays 3-2, take 2 of 3 at Citi Field",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370913130",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370913130",
                    "description": "A disappointed Jaime Garcia didn't say a word to manager Joe Girardi when he was removed one out shy of qualifying for his first win with the Yankees, and New York beat the Tampa Bay Rays 3-2 Wednesday to take two of three games in the displaced series.",
                    "date": "2017-09-13T21:08:44Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fmedia%2Fmotion%2F2017%2F0913%2Fdm_170913_MLB_Yankees_Frazier_2_run_single%2Fdm_170913_MLB_Yankees_Frazier_2_run_single.jpg",
                    "author": "Marc Stein",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Shohei Otani and why being Babe Ruth isn't all it's cracked up to be",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/19635864\/shohei-otani-why-being-babe-ruth-all-cracked-be",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/19635864\/shohei-otani-why-being-babe-ruth-all-cracked-be",
                    "description": "The Japanese sensation has teams dreaming of an elite pitcher and an All-Star slugger wrapped into one. But there's a catch: Two-way stars might hurt more than they help.",
                    "date": "2017-09-13T12:45:00Z",
                    "image": "http:\/\/a.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0616%2Fr220033_2_1296x729_16%2D9.jpg",
                    "author": "Buster Olney",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Hechavarria HR leads Rays over Yankees 2-1 at Mets' park",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370912130",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370912130",
                    "description": "Adeiny Hechavarria hit a tiebreaking home run in the eighth inning off Sonny Gray and the Tampa Bay Rays, playing as the home team in a series relocated to Citi Field because of Hurricane Irma, beat the New York Yankees 2-1 on Tuesday night.",
                    "date": "2017-09-13T01:58:12Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png",
                    "author": "Stephen A. Smith",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "New York Yankees play at Citi Field with Tampa Bay Rays displaced",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20669784\/new-york-yankees-play-citi-field-tampa-bay-rays-displaced",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20669784\/new-york-yankees-play-citi-field-tampa-bay-rays-displaced",
                    "description": "Hurricane Irma forced Tampa Bay to host its home series in its opponent's backyard. Though, perhaps, it wasn't much different than being at Tropicana Field, Yankees fans outnumbered Rays fans on a strange night in Queens.",
                    "date": "2017-09-12T12:45:00Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0911%2Fr257248_1296x729_16%2D9.jpg",
                    "author": "John Clayton",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Yanks top Rays 5-1 as Frazier homers in series moved to Mets",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370911130",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370911130",
                    "description": "In the start of a series moved from Florida to Citi Field because of Hurricane Irma, Todd Frazier capitalized on Trevor Plouffe's two-out error with a three-run homer that led the New York Yankees over the Tampa Bay Rays 5-1 on Monday.",
                    "date": "2017-09-12T02:49:41Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png",
                    "author": "Jayson Stark",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
				{
                    "headline": "Machado's 2-run HR in 9th lifts Orioles past Yankees 7-6",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370905101",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370905101",
                    "description": "Manny Machado hit a two-run homer off Dellin Betances with two outs in the bottom of the ninth inning, capping a comeback that lifted the Baltimore Orioles past the New York Yankees 7-6 on Tuesday night.",
                    "date": "2017-09-06T05:13:22Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png",
                    "author": "Jayson Stark",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal",
		    "video_id" : 2
                },

                {
                    "headline": "Jacoby Ellsbury of New York Yankees sets catcher's interference mark on birthday",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20675120\/jacoby-ellsbury-new-york-yankees-sets-catcher-interference-mark-birthday",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20675120\/jacoby-ellsbury-new-york-yankees-sets-catcher-interference-mark-birthday",
                    "description": "On his 34th birthday, Yankees OF Jacoby Ellsbury set an obscure major league record.",
                    "date": "2017-09-12T01:09:41Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fphoto%2F2016%2F0720%2Fr105672_1296x729_16%2D9.jpg",
                    "author": "Jay Crawford",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "New York Yankees activate outfielder Clint Frazier",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20672763\/new-york-yankees-activate-outfielder-clint-frazier",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20672763\/new-york-yankees-activate-outfielder-clint-frazier",
                    "description": "The New York Yankees activated outfielder Clint Frazier, who was on the disabled list with an oblique strain.",
                    "date": "2017-09-11T19:55:29Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0709%2Fr229087_1296x729_16%2D9.jpg",
                    "author": "Pierre LeBrun",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Judge, Sanchez 2 homers each in Yankees' 16-7 win at Texas",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370910113",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370910113",
                    "description": "Aaron Judge became the second major league rookie with a 40-homer season, going deep twice as the AL wild card-leading New York Yankees got a series clinching 16-7 win over the Texas Rangers on Sunday.",
                    "date": "2017-09-10T23:00:22Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png",
                    "author": "Jemele Hill",
                    "author_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAHgAeAMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAGAQMEBQcAAv/EADoQAAIBAwMCBAQCCAUFAAAAAAECAwAEEQUSITFBBhMiUTJhcYFSoRQVIzNCkbHxByTB4fAlcoKS0f/EABsBAAIDAQEBAAAAAAAAAAAAAAQFAgMGAQcA/8QALBEAAgICAgECBAUFAAAAAAAAAAECAxEhBBIFIjEyQVFxExQjYaEGJDPB4f/aAAwDAQACEQMRAD8AEaQ9K9ikYcV6aZPIy9InSvTCvKnqDUH7lnyPL02kqRndIwVfc1G1K/S2PlxkNL7e1Vj3u0FpA5Y984pHzvLQ48usF2l/Ax4/ClZHMtIJkug52JG7DHxkYWre21CGJI0nVl3DCkcg1n/6wLrtWRs/hY8H+VJb30oYoXbyyTwe3vWfv8nyL36sY+wy4/FqoeYe5plv4i0cbRJdiPPd1IH8+lWtw0VxaLLBIkkbDKshyD96x64miJ2nCqPhz1qZoetz6ROTFIz2z/vIs8H5ge9LLIuexvTy8PEkaFAgD1eWq5joesp0uVjmhYNG43KaIbX93Qz+IZPcdDV+npFVc68VbXvwiqy4HFH8Z7BLvYqLletLS3XOaStLQ/QZzkfGQFpcVwr1itQZtjRXmoN7cC1t5Jf4hwo9zVmBzQx4mmw8cQ6D1H69qB8hf+Bx5WL3C+HBWWqLKhpHLsxJLHlmPevMZklbZyd3zpUXdDxyztgY70YeHdJjRFkkQbj2Irzyyzrtmqqqc3hFJb6JO+DGhB6+odalQaBPIxUowbbnGPatDsbFSBtAA+QqxSwA5OP5UF+ZkMPycF7sym90CRVyUIPuapZ7Zrd8ITn2JrZdQtlUdA2aCNf0NZcywqd+eRVlXIy8Mqu4iSzEa8A3/wDmGsJG4bLxg9iOo/1rTrVMx1hVtPLYX6TxZEkLhwCfatz02ZLiziniOUkQOv0NduWJJl/Dscq3B/IS9j9NVs65FWt2TtqBKvFX0SwyVy0UlymDXU7djmup9VbiIjurzIqFFOBc15SnhWybMfJibRignxQ3/Uivsoo7HTFZ5r7btVn/AO7FI/OT/tcfVoY+K3a3+w/4eiE12oblU5o+tYiANo4+VA/hUftpXPRQKKor+B9qSXksbseBFj0/lmsJenJ4NlxWoxyGWlxsV5q3WIFev50E2uo3drcRpJdmSJh6S6bd4+XY9aIUv2WBpBkDHWgpJwew+L7rKPeoW7k8/D2NU17b7UOcE/Lmqy/1aN7jde38wj5IiV9u4fQc1HtdTt7q62WiOOxw5YMPuamqml2K/wAZZ6gZq6hNYdDwD1+4rUvAFwbjw9FGfigJjP06j8jWY+KF264+PlRf/h5qYtdQfT5TgXChkyf4h/t/SjZrtWmA0y6XNB7dRnbUR4iRVhK25RSFRt6VyrTDbW8A3exHdSVY3iDd0711Oan6RbOLyCKU8tMpTqnmt5Iwch3HIrNtUJOoT567zWkk+k1m16N+oz47yt/Ws555/pQX7jXw/wAUi58HgefIpHXHFEj+GVmmaeGJJdwwY5Dx9aGNHkFteI4+F0GaPNN1qJABuX71ir3KMsxNjxYQshhiW+hpb2axtBHFjn9mT6m9yT1q8iCfoRhIziqq/wBUe4RDAhkVWyVUgEivVrq941u0a6VJuz/HtA/9s0HLvPbDoqMNIWXQ1l/cBdhbcVKg+r3r1+qI7F5bhgDPKcu+Otcuoz2y+Yy7ectEDnbTOoa6lxF8WSRxipJzejirhnsA3iONf1skj9Ch/I1DV5YJbe9tiBLCQwb2IapOuzrNqccPq3Ip3Z6DODTeQkUa4yMHd+VMa0+qFFr/AFG0bJa3C3ljDcxfBKgYD2z2qSoyozQt/h5fefYtYuRuQllH9aN1tTtqKjhhkrcwTKDUQARSVL1a0JxXUfCWIkEsgAlPLTSU8K9DkedSPecDnpWf20YmMk7fE0mf9aPLk/5eUjsh/pQJbMfKkFZf+oH/AI19/wDQ68Mlib+w6ji1eIufSjgMPkRRGlpCHR1YbXxhvbNCF1uKyE+4NTdJ1Ro0EE59H8Le1ZW2DayjSce1RfVhhaWupJdNFDPblD6hJIpJHyxRXaaBqz22f11paqVY7tucYNB9uJL2EGCT9qnKkHBxVhHc+IhD5PkqU7uSv86FaXzGsGsalj+R3U7K7ilMJ1WCdeeUhx345qrKW8O5x8K/nUmaN7aJ3uX/AGjctk0Ja3fSSwnyuIAwGfxGuxj2eEVXWRhllbJcG5v5rjGN78D2H9qfaXoCeMc/c1BjkOd7clmJNehJ+02++BzR+BPnOwn8J6vJY+IoVcAJ5gjf7nFbpGylBzWAW1s6X17GWWSZVWYyJyMjDcfcYrb7Nma3jLfEVGai9MJhFuODzqrIAOe9LVdrTHbxmlq6EtBMK9AIlPj2707YWDzoZn3rAp5YLnP0FWa+RDGPJUbccN1z962vM8pVQ+q2zH8Pw13KXd+mP1/4VT20rQtlcKR1bis+J8mSeI9UYgfSjzW5ZpYTsfCnsKzyYtHOWbqeDmsz5Dmz5WHJYSHdfjocKPpbefcdklSW3ZONxX8xTNvBIYi+wlO5pjOGx2q80GRRuQ4PuD3pVN9UXVJSlgSxvLmxYPbueD0NWLeKbzoEbOOmeKeGhtI262YCNucMfhqfZ6FDGQZ23HvtoSU4PbGEIWLSZCs4rzWHLXbERDqo6f3qu8XhIo4YYxhQego0fy7a32xqFVRwBWf+KWY3ihzk4ya+pfaZHkrpW/qVC5wBSZ9amuB4Hyp60iE1xGDypPNHCxJt4Lzw/Ys0oupm25wVVe/1rRNP126jKRlwyjru54oUtEwqqo4xxU9TtBOaIUFjY3rrUY4DG9uob233xHBHVT2rqGLW6aJwc5U8EfKuqt1NfCS649ixlvQqBEG1FGAB0FV3nlZGyPSxzimzJ3PSm9wPf6H3FEPfuW6xhDtyscsToDncO4oE1+2Mb+b+I8/WjhjjbjvQ54rhxZFgOjg1XNaB+THMGCfWr3w08AnKToWzyrdwfaqJeuDVro4xcAe5x9DQ+E9MW0amg+svLVtgkBU9N3GKtfIhCbmkjX6sKGYtxUZB6c4NS4XjSKVTGrF8FSeqY5OKqlwYt6Y5i8DupXESLthO5gc7sdPpWfa82/UGz2AGaMXUkE9OPuaEtQiH6SxbruPAq1VRqjhAnL3ArCuB96escpKsn4Dur06gMS3Qcn6+1StNQzLM2BtWMj7mvltgNccySC2yIAZv/EU5K/QfPoO5pi3O2OIH8OTTq+pt579B7CikN09D6H0jNLXgHArqkdHd3FRif0eTd1hY+ofgPv8ASurq+Oscu32qhB5BFVfiYbrNvwqpP3x/ekrqhL2K7dwYF9asLScQTQOcgE8n5V1dQyFEHjYWXu/9BbymwwGSRnOO+MV5jupZmTgKvIJPB9s8/wDylrqvYznnsiUSSuD1oW1eNkuD23E11dXJrKPr1mBTysS20npRPoVsEsVLDlzk/SlrqjWtgnEWbGTrhis6xqM+kden/OKkKT0wfqe9dXVcg9HoGurq6unT/9k=",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Chapman gets save to finish Yanks' one-hittter",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370909113",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370909113",
                    "description": "Aroldis Chapman earned his first save since being removed as closer to finish a one-hitter in the New York Yankees' 3-1 win over the Texas Rangers on Saturday.",
                    "date": "2017-09-09T20:18:02Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png",
                    "author": "Buster Olney",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },

                {
                    "headline": "Perez wins 7th in a row; Rangers rally to beat Yankees 11-5",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370908113",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370908113",
                    "description": "Martin Perez won his seventh straight start after the playoff-hopeful Texas Rangers rallied from an early four-run deficit and beat the AL wild card-leading New York Yankees 11-5 on Friday night.",
                    "date": "2017-09-09T03:40:22Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png",
                    "author": "Stephen A. Smith",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "New York Yankees-Tampa Bay Rays series will be at Citi Field due to potential impact of Hurricane Irma",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20636736\/new-york-yankees-tampa-bay-rays-series-citi-field-due-potential-impact-hurricane-irma",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20636736\/new-york-yankees-tampa-bay-rays-series-citi-field-due-potential-impact-hurricane-irma",
                    "description": "With Hurricane Irma bearing down on Florida, next week's series between the New York Yankees and Tampa Bay Rays will be played at Citi Field. The Rays will be considered the home team.",
                    "date": "2017-09-08T19:04:58Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fphoto%2F2014%2F0331%2Fmlb_g_mets11_1296x729.jpg",
                    "author": "Jayson Stark",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Yankees hit 4 HRs, beat Orioles 9-1 to win 3-game series",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370907101",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370907101",
                    "description": "Aaron Judge and Chase Headley hit two-run homers, Starlin Castro and Todd Frazier added solo shots and the New York Yankees beat the Baltimore Orioles 9-1 Thursday for their first series win at Camden Yards in four years.",
                    "date": "2017-09-07T21:08:53Z",
                    "image": "http:\/\/a4.espncdn.com\/combiner\/i?img=%2Fmedia%2Fmotion%2F2017%2F0908%2Fdm_170908_sc_AFRICA_judge%2Fdm_170908_sc_AFRICA_judge.jpg",
                    "author": "Jay Crawford",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Former New York Yankees executive Gene 'Stick' Michael dies at 79",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20617536\/former-new-york-yankees-executive-gene-stick-michael-dies-79",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20617536\/former-new-york-yankees-executive-gene-stick-michael-dies-79",
                    "description": "Gene &quot;Stick&quot; Michael, the New York Yankees executive who helped build the club's late-1990s dynasty teams and drafted Derek Jeter, has died at 79.",
                    "date": "2017-09-07T14:45:58Z",
                    "author": "Pierre LeBrun",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Dustin Pedroia of Boston Red Sox insists sign stealing 'part of the game'",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20609320\/dustin-pedroia-boston-red-sox-insists-sign-stealing-part-game",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20609320\/dustin-pedroia-boston-red-sox-insists-sign-stealing-part-game",
                    "description": "Boston players and staff members remained wholly unapologetic Wednesday over allegations of sign stealing, even making light of the situation.",
                    "date": "2017-09-06T23:32:49Z",
                    "image": "http:\/\/a3.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0615%2Fr220356_2_1296x864_3%2D2.jpg",
                    "author": "Jemele Hill",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Boston Red Sox say they have video evidence of Yanks using YES camera to steal signs",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20608951\/boston-red-sox-say-video-evidence-yanks-using-yes-camera-steal-signs",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20608951\/boston-red-sox-say-video-evidence-yanks-using-yes-camera-steal-signs",
                    "description": "The Red Sox said their complaint to the commissioner's office about the Yankees includes video evidence of the YES Network maintaining a fixed camera on bench coach Gary DiSarcina during a recent game at Yankee Stadium, a source told ESPN's Buster Olney.",
                    "date": "2017-09-06T22:27:19Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0818%2Fr246028_1296x729_16%2D9.jpg",
                    "author": "Jayson Stark",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Boston Red Sox stole signs electronically against New York Yankees, other teams",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20593927\/boston-red-sox-stole-signs-electronically-new-york-yankees-other-teams",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20593927\/boston-red-sox-stole-signs-electronically-new-york-yankees-other-teams",
                    "description": "Commissioner Rob Manfred confirmed Tuesday that the Red Sox used electronic communication from the dugout to steal opponents' signs and relay them to Boston players during games.",
                    "date": "2017-09-05T20:59:22Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0818%2Fr246028_1296x729_16%2D9.jpg",
                    "author": "Pierre LeBrun",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Aaron Judge of New York Yankees walked for 100th time in rookie season",
                    "target_url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20578927\/aaron-judge-new-york-yankees-walked-100th-rookie-season",
                    "url": "http:\/\/www.espn.com\/mlb\/story\/_\/id\/20578927\/aaron-judge-new-york-yankees-walked-100th-rookie-season",
                    "description": "Yankees outfielder Aaron Judge has been walked 103 times this season, putting him on track to break a 75-year-old rookie record.",
                    "date": "2017-09-04T19:16:23Z",
                    "image": "http:\/\/a3.espncdn.com\/combiner\/i?img=%2Fphoto%2F2017%2F0710%2Fr229532_1296x729_16%2D9.jpg",
                    "author": "Jay Crawford",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                },
                {
                    "headline": "Castro, Gregorius HRs help Yankees beat Orioles 7-4",
                    "target_url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370904101",
                    "url": "http:\/\/www.espn.com\/mlb\/recap?gameId=370904101",
                    "description": "Starlin Castro homered and drove in three runs, Didi Gregorius also went deep and the New York Yankees fueled their playoff push with a 7-4 victory over the Baltimore Orioles on Monday.",
                    "date": "2017-09-04T21:45:53Z",
                    "image": "http:\/\/a1.espncdn.com\/combiner\/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png",
                    "author": "Stephen A. Smith",
                    "author_image": "data:image/jpeg;base64,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",
                    "favicon_url": "http:\/\/a.espncdn.com\/favicon.ico",
                    "type": "internal"
                }
            ],
            newsweek: [
                {
                    "headline": "Stephen Hawking Is Stumped by the Rise of Trump",
                    "target_url": "http:\/\/www.newsweek.com\/trump-stephen-hawking-brexit-464881",
                    "url": "http:\/\/www.newsweek.com\/trump-stephen-hawking-brexit-464881",
                    "description": "Hawking is also pushing for a 'Remain' vote in Britain's EU referendum.",
                    "date": "2016-05-31",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2016\/05\/31\/rtx29n6o.jpg",
                    "author": "Josh Lowe",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Ivanka Trump Has Explained Why She Won't Stand Up to Her 'Daddy'",
                    "target_url": "http:\/\/www.newsweek.com\/ivanka-trump-has-explained-why-she-wont-stand-her-daddy-664829",
                    "url": "http:\/\/www.newsweek.com\/ivanka-trump-has-explained-why-she-wont-stand-her-daddy-664829",
                    "description": "The first daughter also believes \"some people\"\u00a0have \"unrealistic expectations\" of her when it comes to influencing the president.",
                    "date": "2017-09-14",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/09\/14\/1409ivankatrump.jpg",
                    "author": "John Haltiwanger",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Trump Says He Likes That White House Adviser Ivanka Calls Him Daddy and Asks if She Can Tag Along to Events",
                    "target_url": "http:\/\/www.newsweek.com\/trump-says-he-likes-white-house-adviser-ivanka-calls-him-daddy-and-asks-if-she-660683",
                    "url": "http:\/\/www.newsweek.com\/trump-says-he-likes-white-house-adviser-ivanka-calls-him-daddy-and-asks-if-she-660683",
                    "description": "The president has previously raised eyebrows with comments about his daughter.",
                    "date": "2017-09-06",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/08\/25\/donald-trump-ivanka.JPG",
                    "author": "Harriet Sinclair",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Donald Trump's Son Says Media Coverage of President Would Drive Anyone to Suicide ",
                    "target_url": "http:\/\/www.newsweek.com\/donald-trumps-son-says-media-coverage-president-would-drive-person-suicide-657451",
                    "url": "http:\/\/www.newsweek.com\/donald-trumps-son-says-media-coverage-president-would-drive-person-suicide-657451",
                    "description": "The 33-year-old businessman said the president had to tune out negative coverage from the mainstream media.",
                    "date": "2017-08-31",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/08\/31\/gettyimages-815147102.jpg",
                    "author": "Callum Paton",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Ivanka and Donald Trump Finally Condemn Nazis, but Not Really, a Day After Charlottesville Violence ",
                    "target_url": "http:\/\/www.newsweek.com\/ivanka-and-donald-trump-finally-condemn-nazis-650218",
                    "url": "http:\/\/www.newsweek.com\/ivanka-and-donald-trump-finally-condemn-nazis-650218",
                    "description": "Neo-Nazi publication 'The Daily Stormer' praised Trump's comments as \"good.\" \"He didn't attack us. He just said the nation should come together. Nothing specific against us,\" the site wrote. ",
                    "date": "2017-08-13",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/08\/13\/rts1bibl.jpg",
                    "author": "Cristina Silva",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Ivanka Trump Is Opening A New Store Somewhere That Will Never Ban Her Clothing Line",
                    "target_url": "http:\/\/www.newsweek.com\/ivanka-trump-opening-new-store-trump-tower-649002",
                    "url": "http:\/\/www.newsweek.com\/ivanka-trump-opening-new-store-trump-tower-649002",
                    "description": "The first daughter's new boutique is set to open in New York this fall.",
                    "date": "2017-08-09",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/07\/19\/rtx3amkv.jpg",
                    "author": "Harriet Sinclair",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "What Does Melania Trump Do at the White House? First Lady Tweets About Drug Addiction, Not Cyberbullying Campaign",
                    "target_url": "http:\/\/www.newsweek.com\/melania-trump-cyberbullying-opioid-addiction-white-house-first-lady-648902",
                    "url": "http:\/\/www.newsweek.com\/melania-trump-cyberbullying-opioid-addiction-white-house-first-lady-648902",
                    "description": "The first lady initially said she planned to fight cyberbullying in a pledge that prompted criticism over her husband's Twitter use.",
                    "date": "2017-08-09",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/07\/28\/7-28-17-melania-trump.jpeg",
                    "author": "Harriet Sinclair",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Why Does Eric Trump Want People to be Nicer to His Dad? ",
                    "target_url": "http:\/\/www.newsweek.com\/why-does-eric-trump-want-people-be-nicer-his-dad-644616",
                    "url": "http:\/\/www.newsweek.com\/why-does-eric-trump-want-people-be-nicer-his-dad-644616",
                    "description": "The president's son said lawmakers should be fighting for his father.",
                    "date": "2017-08-01",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/07\/30\/donald-trump.jpg",
                    "author": "Harriet Sinclair",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Trump Sees Women As Business Animals or 'Secretaries'",
                    "target_url": "http:\/\/www.newsweek.com\/trump-sees-woman-business-animals-or-secretaries-645552",
                    "url": "http:\/\/www.newsweek.com\/trump-sees-woman-business-animals-or-secretaries-645552",
                    "description": "A former construction executive who worked for The Trump Organization said the president only saw the secretaries as women.",
                    "date": "2017-08-03",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/08\/01\/trump.jpg",
                    "author": "Harriet Sinclair",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Donald Trump Isn't Happy About New Poll Showing He Is the President With Lowest Approval Rating in 70 Years",
                    "target_url": "http:\/\/www.newsweek.com\/trump-has-lowest-6-month-approval-rating-70-years-poll-shows-and-hes-not-happy-637430",
                    "url": "http:\/\/www.newsweek.com\/trump-has-lowest-6-month-approval-rating-70-years-poll-shows-and-hes-not-happy-637430",
                    "description": "The president shared his views on Twitter after the poll was released.",
                    "date": "2017-07-16",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/07\/14\/trump.JPG",
                    "author": "Harriet Sinclair",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "War on ISIS Under Trump Set to Double Civilian Death Toll Compared to Obama",
                    "target_url": "http:\/\/www.newsweek.com\/president-trumps-isis-war-course-double-obamas-civilian-deaths-637538",
                    "url": "http:\/\/www.newsweek.com\/president-trumps-isis-war-course-double-obamas-civilian-deaths-637538",
                    "description": "The president's campaign against ISIS is killing 12 civilians a day, new investigation shows.",
                    "date": "2017-07-17",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/07\/17\/u.s.-coalition-strikes-mosul.jpg",
                    "author": "Jack Moore",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Melania Trump Is Still Not As Popular As Michelle Obama, but She Beats Hillary Clinton in First Lady Rankings",
                    "target_url": "http:\/\/www.newsweek.com\/michelle-obama-melania-trump-popular-ratings-michelle-obama-hillary-clinton-633792",
                    "url": "http:\/\/www.newsweek.com\/michelle-obama-melania-trump-popular-ratings-michelle-obama-hillary-clinton-633792",
                    "description": "Melania Trump is roughly as popular\u00a0as Hillary Clinton was when she was a few months into her husband's White House term in 1995.",
                    "date": "2017-07-08",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/07\/07\/rtswkjn.jpg",
                    "author": "Cristina Silva",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Could Trump Go on Trial? Lawyer Says It Is a \u2018Real Possibility\u2019 President Could Face Jury Over University Fraud Case",
                    "target_url": "http:\/\/www.newsweek.com\/trump-trial-university-lawsuit-settlement-631462",
                    "url": "http:\/\/www.newsweek.com\/trump-trial-university-lawsuit-settlement-631462",
                    "description": "Despite reaching a settlement over a lawsuit against Trump University, the president could yet face further action.",
                    "date": "2017-07-03",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/07\/03\/trump_0.jpg",
                    "author": "Jason Le Miere",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Trump Funneled Cancer Charity Money to His Businesses, Associates: Report",
                    "target_url": "http:\/\/www.newsweek.com\/donald-trump-funneled-kids-cancer-charity-money-businesses-621927",
                    "url": "http:\/\/www.newsweek.com\/donald-trump-funneled-kids-cancer-charity-money-businesses-621927",
                    "description": "Forbes has reported that Trump charged his son's charity to use Trump Organization golf courses.",
                    "date": "2017-06-06",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/06\/06\/donald-trump.jpg",
                    "author": "Ryan Bort",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "What Ivanka Trump Thinks of James Comey, the President and the 'Viciousness' of Washington",
                    "target_url": "http:\/\/www.newsweek.com\/ivanka-trump-comey-testimony-624336",
                    "url": "http:\/\/www.newsweek.com\/ivanka-trump-comey-testimony-624336",
                    "description": "The president's daughter sat down with the hosts of 'Fox & Friends' on Monday morning.",
                    "date": "2017-06-12",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/06\/12\/ivanka-trump.jpg",
                    "author": "Ryan Bort",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Melania Trump Says Kathy Griffin May Be Mentally Ill After Beheaded President Photo ",
                    "target_url": "http:\/\/www.newsweek.com\/melania-trump-kathy-griffin-photo-618401",
                    "url": "http:\/\/www.newsweek.com\/melania-trump-kathy-griffin-photo-618401",
                    "description": "Melania Trump has joined the chorus of criticism of Kathy Griffin.",
                    "date": "2017-05-31",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/05\/31\/melania-donald-trump.JPG",
                    "author": "Jason Le Miere",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "After Hand Swat, Melania Trump Again Avoids Holding Donald\u2019s Hand as They Land in Rome",
                    "target_url": "http:\/\/www.newsweek.com\/melania-trump-hand-hold-president-donald-614300",
                    "url": "http:\/\/www.newsweek.com\/melania-trump-hand-hold-president-donald-614300",
                    "description": "For the second time in as many days, Melania Trump has been spotted apparently avoiding her husband's hand-holding attempts.",
                    "date": "2017-05-23",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/05\/23\/donald-trump-melania.JPG",
                    "author": "Jason Le Miere",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Ivanka Trump\u2019s First 100 Days Have Definitely Benefited One Group: The Trumps",
                    "target_url": "http:\/\/www.newsweek.com\/ivanka-trump-fashion-policies-white-house-what-she-doing-592498",
                    "url": "http:\/\/www.newsweek.com\/ivanka-trump-fashion-policies-white-house-what-she-doing-592498",
                    "description": "Often cited as a moderating influence on the president, there isn't a single successful policy attributable to Ivanka Trump.",
                    "date": "2017-05-01",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/05\/01\/rts13pen.jpg",
                    "author": "Chris Riotta",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "A Question of Trust: The Trump Family's Conflicts of Interest Aren't Going Away",
                    "target_url": "http:\/\/www.newsweek.com\/donald-trump-ivanka-conflicts-interest-586814",
                    "url": "http:\/\/www.newsweek.com\/donald-trump-ivanka-conflicts-interest-586814",
                    "description": "With his daughter Ivanka as adviser, the U.S. president draws attention to the family's potential conflicts of interest once again.",
                    "date": "2017-04-20",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2017\/04\/20\/rts11crc.jpg",
                    "author": "Beth A. Rosenson",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                },
                {
                    "headline": "Judge to Consider Student's Objection to Trump University Settlement",
                    "target_url": "http:\/\/www.newsweek.com\/donald-trump-trump-university-trump-university-settlement-576443",
                    "url": "http:\/\/www.newsweek.com\/donald-trump-trump-university-trump-university-settlement-576443",
                    "description": "The objection raises the possibility the litigation could continue to dog Trump's presidency.",
                    "date": "2017-03-29",
                    "image": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/files\/styles\/full\/public\/2016\/11\/19\/1119trumpuniversity01.JPG",
                    "author": "Reuters",
                    "favicon_url": "http:\/\/s.newsweek.com\/sites\/www.newsweek.com\/themes\/newsweek\/favicons\/favicon-32x32.png",
                    "type": "internal"
                }
            ]
         };

         this.mockComments = {
            espn: [
                {
                    name: "Eric Gundel",
                    icon: "https://scontent.fbna1-2.fna.fbcdn.net/v/t1.0-1/c17.0.100.100/p100x100/14495357_10207244418403959_8590106024589896961_n.jpg?oh=4075213756b85906b400a18b9c47fe00&oe=5A60BFF8",
                    comment: "Sale, Pomeranz, Fister. With his inability to pitch deep Pomeranz should either go 2 or 4 so that he is right before or after Sale. Only Fister's performance gives him a credible argument for going ahead of him so holding off until Game 4 is silly. Fister also has been going deep so he is the logical guy to follow Pomeranz."
                },
                {
                    name: "Daniel Canny",
                    icon: "https://scontent.fbna1-2.fna.fbcdn.net/v/t1.0-1/p100x100/12745519_10153828730110991_8288934923335204537_n.jpg?oh=31bf110189004eef484008d8c0fe0014&oe=5A1462A1",
                    comment: "I want no part of Price in these playoffs. Even if he was piching well right now and not on the DL. I think it should go Sale, Pomeranz 1-2 with Fister and Porcello as the 3/4 in some order. Pomeranz has earned the 2 spot. I like Fister but let' see what everybody thinks when someone roughs him up for 7 or 8 runs in 2 innings-which I predict will happen before the end of the season. It's an interesting call but I hope the Sox shut Price down. Make him earn that 30 million next year."
                },
                {
                    name: "Vinnie Bredice",
                    icon: "https://scontent.fbna1-2.fna.fbcdn.net/v/t1.0-1/p100x100/19105596_10211587788722367_8573624180233364817_n.jpg?oh=aa9da14633edb282a4887c7b11f73c29&oe=5A51FCD5",
                    comment: "It's bad enough the Yankees replica jerseys have the player last names on the back of them, now this? Chief for Ellsbury??? When has anyone ever heard him called Chief??? And A-A-Ron for Hicks??? When just about everyone on the team and his manager call him Hicksy? A lot of these nicknames sound forced or contrived. Glad to see that Gardner refused a nickname and went with his last name. Just a dumb idea all around and another way for MLB to suck the almighty dollar away from the fans."
                },
                {
                    name: "Michael Rinella",
                    icon: "https://scontent.fbna1-2.fna.fbcdn.net/v/t1.0-1/p100x100/14440758_10209944849559243_3334370350088150485_n.jpg?oh=4304b9cb6e6855e3d3d26013a51776fd&oe=5A12DCF9",
                    comment: "What is it with today's players oblique strains? Nobody and I mean nobody went on the DL with a flippin' oblique anything thirty or forty years ago."
                },
                {
                    name: "Lee Fogel",
                    icon: "https://scontent.fbna1-2.fna.fbcdn.net/v/t1.0-1/p100x100/18033393_1493137037424397_5285712530195291564_n.jpg?oh=e9b8d3ae7305d913e720612a26cb61cc&oe=5A13EB8A",
                    comment: "People ridiculed his signing but he put dollars in pockets and butts in seats. And, although he didn't blow anyone away, his results overall were better than just about anyone figured he would put up."
                },
                {
                    name: "Dennis Lio",
                    icon: "https://scontent.fbna1-2.fna.fbcdn.net/v/t1.0-1/p100x100/15965322_581838418669301_6626437843902271848_n.jpg?oh=844bd7dbf1d62d6316322ff40db53078&oe=5A12C32D",
                    comment: "When jealousy rears its ugly head in the realm of baseball, it is a terrible thing. Tim Tebow is what baseball is all about."
                }
            ],
            newsweek: [
                {
                    name: "Katona Johnson",
                    icon: "https://scontent-mia3-2.xx.fbcdn.net/v/t1.0-1/p48x48/14457545_561653840701620_6308988878381143782_n.jpg?oh=3f72461276b7e15a0327dbce2f793eae&oe=5A5A2304",
                    comment: "All she is showing is that she has not grown into womanhood yet. She still depends on her daddy. Remember she has not gone on her own. She has never really held a job outside her father's structure. Look at Jared, he looks like he has not had a separate thought from this family. She needs to leave DC and find her way to maturity. I bet Tiffany is more independent, smarter because her mother had total control of her upbringing."
                },
                {
                    name: "Nancy Clifford",
                    icon: "https://scontent-mia3-2.xx.fbcdn.net/v/t1.0-1/p48x48/13873033_10153831008331732_6356865474546752624_n.jpg?oh=41532f41615c9a4e6f6e9ecb78ba01aa&oe=5A4CC060",
                    comment: "If trump was. not A thief and traitor we might give him a chance. He is destroying our country and reputation. RESIGN if he can't take it. What will he do when he goes to jail for treason"
                },
                {
                    name: "Chelsea Doors",
                    icon: "https://scontent-mia3-2.xx.fbcdn.net/v/t1.0-1/p48x48/21314293_1470408896387318_2143304306498232083_n.jpg?oh=483e3672928841df361285a486c74f7c&oe=5A47239F",
                    comment: "Great place to buy Over Priced Polyester made in sweat shops throughout Asia, even though her daddy's administration celebrates \"Made in America Week\"."
                },
                {
                    name: "John W Bletsch",
                    icon: "https://scontent-mia3-2.xx.fbcdn.net/v/t1.0-1/p48x48/15698201_10207747359346750_4195257972201186511_n.jpg?oh=e5f37eccae878608529da6f7128aaffa&oe=5A5429AA",
                    comment: "Again, it all depends upon whom is surveyed. Try a random survey and you will find that Michelle (Michael) Obama is roundly disliked for her faux haughty air and pretentious attitude while she is spending $millions of taxpayers' dollars as though her own on opulent affairs and vacations monthly. Truly an attitude of lottery rich trailer trash using her race to force acceptance among the moneyed elete."
                },
                {
                    name: "Palin Smith",
                    icon: "https://scontent-mia3-2.xx.fbcdn.net/v/t1.0-1/p48x48/17352341_10210518225049889_2739499951961938623_n.jpg?oh=4fb96860c3aaadfa83d6aeb9941ccbcd&oe=5A4E8A95",
                    comment: "If Melania was black she would get a 98% approval rating.....if her hubby was a Democrat."
                }
            ]
         }






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

        this.logoURI = 'data:image/png;base64,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';

        this.emitter = new EventEmitter();

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

        // this.nextGridTransitionElement = this.gridTransitionElement.cloneNode(true);
        // this.nextGridTransitionElement.id = 'rev-slider-next-grid-transition';

        // this.nextGridElement = this.nextGridTransitionElement.children[0].children[0];
        // this.nextGridElement = this.nextGridTransitionElement.querySelector('#rev-slider-grid');

        // revUtils.append(this.gridTransitionContainer, this.nextGridTransitionElement);

        revUtils.append(this.element, this.containerElement);

        revUtils.dispatchScrollbarResizeEvent();

        this.grid = new AnyGrid(gridElement, this.gridOptions());

        this.paginationDots();

        this.initButtons();

        this.setGridClasses();

        this.setMultipliers();

        this.createCells(this.grid);

        if (this.limit == 0) {
            this.destroy();
            return;
        }

        this.setUp(this.grid.items);

        this.getPadding(this.grid.items);

        this.setContentPadding(this.grid.items);

        this.setSize(this.grid.items);

        this.grid.layout(9);

        this.setUp(this.grid.items);

        this.setSize(this.grid.items);

        this.grid.layout(10);

        this.grid.on('resize', function() {
            that.resize();
        });

        this.getData();

        var that = this;

        this.dataPromise.then(function(data){
            that.updateDisplayedItems(that.grid.items, data);
            setTimeout(function() {
                that.grid.layout();
            }, 500);

            setTimeout(function() {
                that.grid.layout();
            }, 2000);

            if (that.options.beacons) {
                revApi.beacons.setPluginSource(that.options.api_source).attach();
            }
        }, function() {
            that.destroy();
        }).catch(function(e) {
            console.log(e);
        });

        this.offset = 0;
        this.page = 1;
        this.previousPage = 1;

        this.appendElements();

        this.getAnimationDuration();

        if (this.options.vertical && this.options.buttons.position == 'outside') { // buttons outside for vertical only
            this.innerContainerElement.style.padding = (this.options.buttons.back ? (this.options.buttons.size + 'px') : '0') + ' 0 ' + (this.options.buttons.forward ? (this.options.buttons.size + 'px') : '0');
        }

        // custom icons passed? merge with default
        if (this.options.overlay_icons !== false) {
            revUtils.mergeOverlayIcons(this.options.overlay_icons);
        }

        // manage views
        if (this.options.register_views) { // widgets that use revSlider might need to do this on their own
            that.registerViewOnceVisible();
            that.attachVisibleListener();
            revUtils.checkVisible.bind(this, this.containerElement, this.visible)();
        }

        // pagination
        if (that.options.disable_pagination === false) {
            this.initTouch();
            this.dataPromise.then(function() {
                that.prepareNextGrid();
                that.attachTouchEvents();
                that.attachButtonEvents();
            });
        }
    };

    RevSlider.prototype.createHeader = function() {
        var header = document.createElement('div');
        header.className = 'rev-content-header';
        header.innerHTML = '<div class="rev-content-header-inner">' +
            // '<span class="rev-icon">' +
            //     '<?xml version="1.0" ?><svg enable-background="new 0 0 32 32" height="32px" id="svg2" version="1.1" viewBox="0 0 32 32" width="32px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg"><g id="background"><rect fill="none" height="32" width="32"/></g><g id="arrow_x5F_full_x5F_upperright"><polygon points="28,24 22,18 12,28 4,20 14,10 8,4 28,4  "/></g></svg>' +
            // '</span>' +
            '<h2>Trending Now</h2>' +
            '</div>';
        return header;
    };

    RevSlider.prototype.setGridClasses = function() {
        revUtils.addClass(this.containerElement, 'rev-slider-' + (this.options.vertical ? 'vertical' : 'horizontal'));
        revUtils.addClass(this.containerElement, 'rev-slider-buttons-' + (this.options.buttons.style));

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

    RevSlider.prototype.registerViewOnceVisible = function() {
        var that = this;
        this.emitter.once('visible', function() {
            revUtils.removeEventListener(window, 'scroll', that.visibleListener);
            that.registerView();
        });
    };

    RevSlider.prototype.visible = function() {
        this.emitter.emitEvent('visible');
    };

    RevSlider.prototype.attachVisibleListener = function() {
        this.visibleListener = revUtils.checkVisible.bind(this, this.containerElement, this.visible);
        revUtils.addEventListener(window, 'scroll', this.visibleListener);
    };

    RevSlider.prototype.createCells = function(grid) {

        var i = 0; // just in case
        this.limit = 0;
        this.internalLimit = 0;
        this.sponsoredLimit = 0;
        this.visibleLimit = 0;

        if (this.options.fit_height) {

            var that = this;
            var fitCheck = function() {
                if (that.options.fit_height_clip) {
                    return that.containerElement.offsetHeight < that.element.offsetHeight || grid.rows[grid.row].count < grid.rows[grid.row].perRow;
                } else {
                    return that.containerElement.offsetHeight < that.element.offsetHeight;
                }
            }

            while (fitCheck() && i < 100) {
                // if (grid.rows[grid.nextRow]) {
                    // console.log(grid.rows);
                // }

                // console.log(grid.nextRow, grid.rows[grid.nextRow].count);

                var cell = this.createNewCell();
                grid.element.appendChild(cell);
                grid.appended([cell]);

                if (i == 0) {
                    this.getPadding();
                }

                this.setContentPadding(grid.items);

                this.setUp(grid.items);

                this.setSize(grid.items);

                grid.layout(9);

                // console.log(that.containerElement, that.element, that.containerElement.offsetHeight, that.element.offsetHeight);

                // TODO improve this to account for situation where element can be in view but not registered
                if (that.containerElement.offsetHeight < that.element.offsetHeight) {
                    this.visibleLimit++;
                }

                // revUtils.checkHidden(cell, function() {
                //     console.log('hidden');
                // })

                // lower the limit

                // console.log(this.containerElement.offsetHeight < this.element.offsetHeight, cell);

                this.limit++;
                i++;

                // console.log(grid.row, this.grid.items[this.grid.items.length - 1].row);
                // console.log(grid.rows[grid.row].count, grid.rows[grid.row].perRow);
                // console.log(grid.nextRow, grid.rows[grid.nextRow]);
            }

            // this.visibleLimit = this.limit;

            // // console.log(this.grid);

            // this.visibleLimit = this.limit;
            // for (var key in this.grid.rows) {
            //   if (this.grid.rows.hasOwnProperty(key)) {
            //     if (this.grid.rows)
            //     console.log('row', this.element.offsetHeight, this.grid.rows[key].maxHeight);
            //     // if (this.grid.rows[key].items) {
            //     //     for (var i = 0; i < this.grid.rows[key].items.length; i++) {
            //     //         console.log(this.grid.rows[key].items[i]);
            //     //     }
            //     // }
            //   }
            // }

            // console.log(this.containerElement, this.element, this.containerElement.offsetHeight, this.element.offsetHeight);

            // if (this.containerElement.offsetHeight > this.element.offsetHeight) {
            //     // console.log('hiiin');
            //     // for (var i = 0; i < this.grid.items.length; i++) {
            //     //     console.log(this.grid.items[i].element);
            //     // }
            //     grid.remove(cell);
            //     grid.layout();
            //     this.limit--;
            // }
        } else {

            var rowData = this.createRows(grid, this.options.rows, true);
            this.viewableItems = rowData.items;
            this.limit = rowData.limit;
            this.internalLimit = rowData.internalLimit;
            this.sponsoredLimit = rowData.sponsoredLimit;
        }
    };

    RevSlider.prototype.createRows = function(grid, rows, initial) {
        var i = 0; // just in case
        var limit = 0;
        var internalLimit = 0;
        var sponsoredLimit = 0;
        var itemsArr = [];
        // this.visibleLimit = 0;

        var random = function(max) {
            return (Math.floor(Math.random() * (max - 30 + 1)) + 30).toLocaleString();
        }

        function kFormatter(max) {
            var random = (Math.floor(Math.random() * (max - 30 + 1)) + 30)
            return random > 999 ? (random/1000).toFixed(1) + 'k' : random
        }

        while (grid.nextRow < rows && i < 100) {
            var cell = this.createNewCell();
            grid.element.appendChild(cell);
            var items = grid.addItems([cell]);
            grid.layoutItems(items, true);
            grid.reveal(items);
            // var items = grid.appended([cell]);
            items[0].initial = initial;
            itemsArr.push(items[0]);

            if (items[0].element.matches(this.options.meta_selector)) {
                var meta = document.createElement('div');
                revUtils.addClass(meta, 'rev-meta');

                items[0].meta = true;

                // meta
                meta.innerHTML = '<div class="rev-meta-inner">' +
                                    '<div style="overflow: hidden; display: inline-block">' +
                                        '<div class="rev-provider"></div>' +
                                        '<div class="rev-date"></div>' +
                                    '</div>' +
                                    '<div class="rev-save"><?xml version="1.0" ?><svg contentScriptType="text/ecmascript" contentStyleType="text/css" preserveAspectRatio="xMidYMid meet" version="1.0" viewBox="0 0 60.000000 60.000000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" zoomAndPan="magnify"><g><polygon fill="none" points="51.0,59.0 29.564941,45.130005 9.0,59.0 9.0,1.0 51.0,1.0" stroke="#231F20" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2"/></g></svg>' +
                                    '</div>' +
                                '</div>';

                items[0].element.querySelector('.rev-before-image').appendChild(meta);

                // items[0].element.querySelector('.rev-meta-inner').insertAdjacentHTML('beforeend', '<div>test</div>');

                // if (this.options.headline_icon_selector && items[0].element.matches(this.options.headline_icon_selector)) {
                meta.querySelector('.rev-meta-inner').insertAdjacentHTML('afterbegin', '<div class="rev-headline-icon-container"><div class="rev-headline-icon"></div></div>');

                var save = meta.querySelector('.rev-meta-inner .rev-save');
                var handleSave = function(save) {
                    revUtils.addEventListener(save, revDetect.mobile() ? 'touchstart' : 'click', function(e) {
                        revUtils.addClass(save, 'rev-save-active');
                        e.preventDefault();
                        e.stopPropagation();
                    }, {passive: false});
                }
                handleSave(save);
            }

            if (this.options.internal_selector && items[0].element.matches(this.options.internal_selector)) {
                items[0].type = 'internal';
                internalLimit++;
                // }

                var description = '<div class="rev-description">' +
                                    '<h4></h4>' +
                                '</div>';

                items[0].element.querySelector('.rev-headline-brand-inner').insertAdjacentHTML('beforeend', description);
            } else {
                if (!items[0].meta) {
                    items[0].element.querySelector('.rev-headline-brand-inner').insertAdjacentHTML('beforeend', '<div class="rev-provider"></div>');
                }

                items[0].type = 'sponsored';
                sponsoredLimit++;
            }

            if (items[0].element.matches(this.options.reactions_selector)) {
                // reactions
                // var like = '<div class="rev-reaction rev-reaction-like"><div class="rev-reaction-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M1271 474c415,0 773,246 935,601 162,-354 519,-601 935,-601 472,0 870,319 990,753l0 0c161,332 110,1036 -543,1785 -507,582 -1115,974 -1362,1120l0 23 -20 -12 -20 12 0 -23c-247,-146 -855,-539 -1362,-1120 -653,-749 -704,-1453 -543,-1785l0 0c120,-434 518,-753 990,-753z"/></g></svg></div></div>';
                //var like_b64 = '<div class="rev-reaction rev-reaction-like"><div class="rev-reaction-icon"><img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk4IDUxMS45OTgiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTggNTExLjk5ODsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTI3MS43NDMsNjYuNzg5Yy0xMC4yNTQtMzMuMzA3LTQzLjk4Ni01NC42MzctNzguNDY2LTQ5LjYxOGMtMjcuOTY1LDQuMDcyLTUwLjc0OSwyNC4xMzQtNTguNTMxLDUwLjgxOSAgICBjLTE4LjQ5Ni0yMC43MDktNDcuNjcyLTI5LjAwMy03NC42NC0yMC42NjZDMjYuNTI0LDU3LjcwNyw1LjI3Nyw5MS43NCwxMC42ODYsMTI2LjQ4OWMzLjE0MiwyMC4xNzgsMTQuNzM3LDM4LjA4MSwzMS44Miw0OS4xNDUgICAgbDEwMS44ODMsNzAuNTAzYzYuODM5LDQuNzMzLDE0Ljk0OSw3LjIxNCwyMy4xNTIsNy4yMTRjMi45OTIsMCw1Ljk5OC0wLjMzMSw4Ljk1Ny0xLjAwMmMxMS4wNy0yLjUxMiwyMC42NTEtOS42MDYsMjYuMjgzLTE5LjQ2MyAgICBsNjAuMTk5LTEwNS4zNDJDMjc0LjkxMywxMDkuNTg1LDI3OC4xMDksODcuNDYxLDI3MS43NDMsNjYuNzg5eiBNMjQ3LjkzNywxMTcuODQ3Yy0wLjEyMSwwLjE3OC0wLjIzMywwLjM2LTAuMzM5LDAuNTQ2ICAgIGwtNjAuMzU0LDEwNS42MTNjLTMuMTk4LDUuNTk2LTguNDIsOS40NjMtMTQuNzA1LDEwLjg4OWMtNi4yODgsMS40MjYtMTIuNjY1LDAuMTkxLTE3Ljk2NS0zLjQ3Nkw1Mi41NzcsMTYwLjgzNiAgICBjLTAuMDgtMC4wNTUtMC4xNjItMC4xMS0wLjI0My0wLjE2M2MtMTIuODY0LTguMjktMjEuNTk3LTIxLjc1My0yMy45Ni0zNi45MzZjLTQuMDU2LTI2LjAzNiwxMS44NjEtNTEuNTM1LDM3LjAxOS01OS4zMTIgICAgYzUuMjUtMS42MjMsMTAuNjEtMi40MDcsMTUuOTEzLTIuNDA3YzE2Ljc3MywwLDMyLjk3MSw3Ljg0NCw0My4yNTMsMjEuNzgyYzMuNDYxLDQuNjkzLDkuMzYzLDYuODkyLDE1LjAzOSw1LjYwOSAgICBjNS42NzctMS4yODUsMTAuMDU3LTUuODE4LDExLjE1Ny0xMS41NDNjNC4zMTMtMjIuNDExLDIyLjQ0LTM5LjY4NSw0NS4xMDMtNDIuOTg1YzI1LjgxOS0zLjc1Nyw1MS4xLDEyLjIxOSw1OC43ODEsMzcuMTczICAgIEMyNTkuNDQyLDg3LjY1MSwyNTYuOTk5LDEwNC4zNDIsMjQ3LjkzNywxMTcuODQ3eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTQ2OC4xOTUsNzEuNzQ1Yy0yMS4yMzItNS4zOS00My40NTEsMS41ODMtNTcuNzY3LDE3LjQ4NWMtOC4xNy0xOS43NS0yNi43NTQtMzMuNzQ2LTQ4LjUzNy0zNS43ODQgICAgYy0yOC41MDUtMi42NzEtNTUuMTA2LDE2LjMwNi02MS44NzksNDQuMTM1Yy0zLjkzLDE2LjE0Ni0wLjc5OSwzMy4yMTksOC41ODcsNDYuODdsNTIuODQ4LDgyLjAzMiAgICBjNS4xMzIsNy45NjQsMTMuNDMsMTMuNDUyLDIyLjc2OCwxNS4wNTVjMS44OTcsMC4zMjYsMy44MDUsMC40ODYsNS43MDcsMC40ODZjNy40NjIsMCwxNC44MDYtMi40NjYsMjAuNzc3LTcuMDg1bDIzLjMzNi0xOC4wNTQgICAgYzMuOTE3LDE2LjIxNCw1LjkwNSwzMi44OTYsNS45MDUsNDkuNzU0YzAsMTE2LjM1OS05NC42NjQsMjExLjAyMi0yMTEuMDIyLDIxMS4wMjJTMTcuODk3LDM4Mi45OTUsMTcuODk3LDI2Ni42MzcgICAgYzAtOC4yODEsMC40ODQtMTYuNjIxLDEuNDM5LTI0Ljc4OGMwLjU3NC00LjkwOS0yLjk0LTkuMzUzLTcuODQ5LTkuOTI3Yy00LjkwNC0wLjU3Ni05LjM1MywyLjkzOS05LjkyNyw3Ljg0OSAgICBDMC41MjQsMjQ4LjYyNSwwLDI1Ny42NjUsMCwyNjYuNjM3YzAsMTI2LjIyNywxMDIuNjkyLDIyOC45MTksMjI4LjkxOCwyMjguOTE5YzEyNi4yMjcsMCwyMjguOTE5LTEwMi42OTIsMjI4LjkxOS0yMjguOTE5ICAgIGMwLTIwLjk1Ny0yLjgzNC00MS42NjktOC40MTMtNjEuNjZsMzYuODI3LTI4LjQ5M2MxNC41NDctOS43ODksMjMuODMzLTI1LjQxNywyNS40OTItNDIuOTMgICAgQzUxNC40MjMsMTA1LjI5OSw0OTUuNzAxLDc4LjcyNiw0NjguMTk1LDcxLjc0NXogTTQ5My45MjcsMTMxLjg2NmMtMS4xNTksMTIuMjI4LTcuNjY4LDIzLjEyNS0xNy44NTksMjkuODk5ICAgIGMtMC4xNzksMC4xMTktMC4zNTMsMC4yNDMtMC41MjMsMC4zNzVMMzk5Ljc1LDIyMC43OGMtMy41OTMsMi43NzktOC4wMzYsMy44ODMtMTIuNTA0LDMuMTE3ICAgIGMtNC40NzQtMC43NjgtOC4yOTItMy4yOTMtMTAuNzUyLTcuMTA5bC01Mi45MjItODIuMTUyYy0wLjA1Mi0wLjA4Mi0wLjEwNy0wLjE2My0wLjE2My0wLjI0NSAgICBjLTYuNjQ3LTkuNjExLTguNzc5LTIxLjE4MS02LjAwNS0zMi41ODFjNC4zOTQtMTguMDUzLDIwLjgzOS0zMC43MjIsMzkuMTI1LTMwLjcyMmMxLjIyMywwLDIuNDU5LDAuMDU2LDMuNjk2LDAuMTczICAgIGMxNy4xNDEsMS42MDUsMzEuNDI0LDEzLjg3MSwzNS41NDIsMzAuNTIyYzEuMjg0LDUuMTkxLDUuNTEyLDkuMTMxLDEwLjc3NSwxMC4wMzhjNS4yNjMsMC45MDEsMTAuNTY0LTEuMzk1LDEzLjUwOC01Ljg2ICAgIGM5LjQ1OC0xNC4zMzIsMjcuMDM0LTIxLjExMyw0My43NDQtMTYuODc0QzQ4Mi44MjYsOTMuOTIyLDQ5NS43ODEsMTEyLjMxMiw0OTMuOTI3LDEzMS44NjZ6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMzY4LjQsMzE3LjU0NEgxOTAuMzE5Yy00Ljk0MywwLTguOTQ5LDQuMDA3LTguOTQ5LDguOTQ5YzAsNTQuMDMxLDQzLjk1Nyw5Ny45ODksOTcuOTg5LDk3Ljk4OSAgICBzOTcuOTktNDMuOTU3LDk3Ljk5LTk3Ljk4OUMzNzcuMzQ5LDMyMS41NSwzNzMuMzQ0LDMxNy41NDQsMzY4LjQsMzE3LjU0NHogTTI3OS4zNTksNDA2LjU4NCAgICBjLTQxLjEzOSwwLTc1LjEzMi0zMS4xNzUtNzkuNTk1LTcxLjE0MmgxNTkuMTkxQzM1NC40OTMsMzc1LjQwOSwzMjAuNDk4LDQwNi41ODQsMjc5LjM1OSw0MDYuNTg0eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPGNpcmNsZSBjeD0iMjkxLjg4NCIgY3k9IjU1LjYxNSIgcj0iOC45NDkiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KCTxnPgoJCTxjaXJjbGUgY3g9IjE2LjM4OSIgY3k9IjIxMC45ODYiIHI9IjguOTQ5IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==" /></div></div>';
                var like_b64 = '<div class="rev-reaction rev-reaction-like">' +
                        '<div class="rev-reaction-menu">' +
                            '<div class="rev-reaction-icon">' +
                                '<div class="rev-reaction-menu-container">' +
                                    '<div class="rev-reaction-menu-item"><div class="rev-reaction-menu-item-count">'+ kFormatter(10000) +'</div></div>' +
                                    '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="'+ this.options.reactions[0] +'"></div>' +
                                    '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[1] + '"></div>' +
                                    '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[2] + '"></div>' +
                                    '<div class="rev-reaction-menu-item"><div class="rev-reaction-menu-item-count">'+ kFormatter(1000) +'</div></div>' +
                                    '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[3] + '"></div>' +
                                    '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[4] + '"></div>' +
                                    '<div class="rev-reaction-menu-item rev-reaction-tip" data-icon="' + this.options.reactions[5] + '"></div>' +
                                    '<div class="rev-reaction-menu-mask"><div class="rev-reaction-menu-mask-inner">' + "<?xml version='1.0' ?><!DOCTYPE svg  PUBLIC '-//W3C//DTD SVG 1.1//EN'  'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'><svg enable-background='new 0 0 24 24' height='24px' id='Layer_1' version='1.1' viewBox='0 0 24 24' width='24px' xml:space='preserve' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><g><polygon points='17.5,1 11,7.5 15,7.5 15,17.75 15,21.5 15,22.5 16,22.5 19,22.5 20,22.5 20,21.5 20,17.75 20,7.5 24,7.5  '/><polygon points='9,6.25 9,2.5 9,1.5 8,1.5 5,1.5 4,1.5 4,2.5 4,6.25 4,16.5 0,16.5 6.5,23 13,16.5 9,16.5  '/></g></svg>" + '</div></div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                // var comment = '<div class="rev-reaction rev-reaction-comment"><div class="rev-reaction-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg enable-background="new 0 0 24 24" id="Layer_1" version="1.1" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path class="fil0" clip-rule="evenodd" d="M10.718,18.561l6.78,5.311C17.609,23.957,17.677,24,17.743,24  c0.188,0,0.244-0.127,0.244-0.338v-5.023c0-0.355,0.233-0.637,0.548-0.637L21,18c2.219,0,3-1.094,3-2s0-13,0-14s-0.748-2-3.014-2  H2.989C0.802,0,0,0.969,0,2s0,13.031,0,14s0.828,2,3,2h6C9,18,10.255,18.035,10.718,18.561z" fill-rule="evenodd"/></svg></div></div>';
                //var comment_b64 = '<div class="rev-reaction rev-reaction-comment"><div class="rev-reaction-icon"><img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDYwIDYwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA2MCA2MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPHBhdGggZD0iTTU1LjIzMiw0My4xMDRDNTguMzU0LDM4Ljc0Niw2MCwzMy43MDUsNjAsMjguNWMwLTE0Ljg4OC0xMy40NTgtMjctMzAtMjdTMCwxMy42MTIsMCwyOC41czEzLjQ1OCwyNywzMCwyNyAgIGM0LjI2MiwwLDguMzc4LTAuNzksMTIuMjQzLTIuMzQ4YzYuODA1LDMuOTI3LDE2LjIxMyw1LjI4MSwxNi42MTgsNS4zMzhjMC4wNDcsMC4wMDcsMC4wOTMsMC4wMSwwLjEzOSwwLjAxICAgYzAuMzc1LDAsMC43MjUtMC4yMTEsMC44OTUtMC41NTRjMC4xOTItMC4zODUsMC4xMTYtMC44NS0wLjE4OC0xLjE1M0M1Ny40MDcsNTQuNDkzLDU1LjgyMyw0OS42NDEsNTUuMjMyLDQzLjEwNHogTTQyLjgzOSw1MS4xODIgICBjLTAuMDAxLDAtMC4wMDEsMC0wLjAwMSwwYy0yLjExLTEuMzAzLTQuNDY2LTIuODE0LTUuMDE0LTMuMjQ5Yy0wLjI5Ny0wLjQzMy0wLjg4My0wLjU2My0xLjMzOC0wLjI5ICAgYy0wLjMsMC4xOC0wLjQ4OSwwLjUxMy0wLjQ5MSwwLjg2MWMtMC4wMDMsMC41ODksMC4wMDYsMC43Nyw0LjA4MSwzLjMxNkMzNi44NjUsNTIuOTMxLDMzLjQ4Nyw1My41LDMwLDUzLjUgICBjLTE1LjQzOSwwLTI4LTExLjIxNS0yOC0yNXMxMi41NjEtMjUsMjgtMjVzMjgsMTEuMjE1LDI4LDI1YzAsNC44OTctMS41OTEsOS42NDQtNC42MDEsMTMuNzI1ICAgYy0wLjE0NCwwLjE5NS0wLjIxMiwwLjQzNi0wLjE5MSwwLjY3N2MwLjM1LDQuMTc1LDEuMjM5LDkuNDkxLDMuNDQsMTMuMTYxQzUzLjMxNiw1NS4zODUsNDcuMzEsNTMuODgyLDQyLjgzOSw1MS4xODJ6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8cGF0aCBkPSJNMTYsMjQuNWMtMi4yMDYsMC00LDEuNzk0LTQsNHMxLjc5NCw0LDQsNHM0LTEuNzk0LDQtNFMxOC4yMDYsMjQuNSwxNiwyNC41eiBNMTYsMzAuNWMtMS4xMDMsMC0yLTAuODk3LTItMnMwLjg5Ny0yLDItMiAgIHMyLDAuODk3LDIsMlMxNy4xMDMsMzAuNSwxNiwzMC41eiIgZmlsbD0iIzAwMDAwMCIvPgoJPHBhdGggZD0iTTMwLDI0LjVjLTIuMjA2LDAtNCwxLjc5NC00LDRzMS43OTQsNCw0LDRzNC0xLjc5NCw0LTRTMzIuMjA2LDI0LjUsMzAsMjQuNXogTTMwLDMwLjVjLTEuMTAzLDAtMi0wLjg5Ny0yLTJzMC44OTctMiwyLTIgICBzMiwwLjg5NywyLDJTMzEuMTAzLDMwLjUsMzAsMzAuNXoiIGZpbGw9IiMwMDAwMDAiLz4KCTxwYXRoIGQ9Ik00NCwyNC41Yy0yLjIwNiwwLTQsMS43OTQtNCw0czEuNzk0LDQsNCw0czQtMS43OTQsNC00UzQ2LjIwNiwyNC41LDQ0LDI0LjV6IE00NCwzMC41Yy0xLjEwMywwLTItMC44OTctMi0yczAuODk3LTIsMi0yICAgczIsMC44OTcsMiwyUzQ1LjEwMywzMC41LDQ0LDMwLjV6IiBmaWxsPSIjMDAwMDAwIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==" /></div></div>';
                var comment_b64 = '<a href="#rev-feed" class="rev-reaction rev-reaction-comment"><div class="rev-reaction-icon"></div></a>';

                // var share = '<div class="rev-reaction rev-reaction-share"><div class="rev-reaction-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg id="Livello_1" style="enable-background:new 0 0 50 50;" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path class="fil0" d="M341.928,459.383c-0.113-0.346-0.402-0.61-0.76-0.693l-12.822-2.878l-6.707-11.301c-0.364-0.617-1.425-0.612-1.788,0  l-6.7,11.305l-12.82,2.884c-0.355,0.078-0.646,0.343-0.763,0.694c-0.112,0.349-0.032,0.736,0.208,1.006l8.682,9.865l-1.219,13.09  c-0.033,0.365,0.131,0.726,0.423,0.932c0.179,0.132,0.391,0.202,0.613,0.202c0.144,0,0.283-0.029,0.411-0.085l12.066-5.208  l12.068,5.202c0.333,0.146,0.736,0.099,1.023-0.113c0.295-0.214,0.457-0.573,0.424-0.938l-1.223-13.086l8.676-9.872  C341.963,460.114,342.041,459.729,341.928,459.383z M327.678,475.8l-6.734-2.902c-0.123-0.054-0.264-0.054-0.387,0l-6.729,2.905  l0.68-7.302c0.013-0.134-0.031-0.266-0.12-0.367l-4.842-5.502l7.152-1.608c0.131-0.03,0.244-0.113,0.312-0.229l3.738-6.306  l3.74,6.304c0.068,0.116,0.182,0.198,0.313,0.229l7.152,1.604l-4.84,5.506c-0.089,0.102-0.132,0.233-0.12,0.368L327.678,475.8z"/><path d="M489.378,472.354c-0.184-0.263-0.483-0.369-0.872-0.417l-0.225,0.016c-0.347,0.024-0.693,0.05-1.046,0.05  c-10.438,0-18.931-8.492-18.931-18.931c0-2.634,0.542-5.197,1.609-7.621c0.139-0.312,0.103-0.68-0.094-0.962  c-0.182-0.26-0.476-0.416-0.858-0.416c-0.003,0-0.007,0-0.011,0c-10.932,0.729-19.494,9.876-19.494,20.826  c0,11.522,9.374,20.896,20.896,20.896c8.271,0,15.776-4.899,19.119-12.481C489.609,473.002,489.573,472.634,489.378,472.354z   M479.384,476.735c-2.59,1.979-5.762,3.06-9.03,3.06c-8.214,0-14.896-6.683-14.896-14.896c0-5.064,2.605-9.778,6.857-12.513  c-0.007,0.228-0.01,0.456-0.01,0.686C462.305,463.776,469.281,473.374,479.384,476.735z"/><path d="M557.998,461.126c-3.972-7.729-13.083-17.287-13.175-17.384c-0.093-0.097-0.221-0.152-0.356-0.154c-0.003,0-0.005,0-0.008,0  c-0.004,0-0.006,0-0.01,0c-0.003,0-0.005,0-0.008,0c-0.136,0.002-0.264,0.058-0.356,0.154c-0.092,0.097-9.203,9.654-13.193,17.418  c-1.506,2.425-2.312,5.233-2.312,8.087c0,8.573,7.12,15.604,15.871,15.673c8.759-0.068,15.879-7.1,15.879-15.673  C560.329,466.394,559.522,463.585,557.998,461.126z M546.153,478.451c-1.902,0-3.695-0.551-5.185-1.594  c-0.189-0.132-0.263-0.377-0.178-0.593c0.085-0.215,0.308-0.339,0.535-0.312c0.516,0.073,0.977,0.108,1.41,0.108  c4.922,0,8.927-3.526,8.927-7.86c0-0.479-0.055-0.977-0.163-1.479c-0.046-0.216,0.055-0.437,0.247-0.543s0.432-0.074,0.592,0.079  c1.38,1.347,2.14,3.081,2.14,4.883C554.479,475.172,550.744,478.451,546.153,478.451z"/><path d="M710.062,520.14h-29.015c-0.233,0-0.422,0.188-0.422,0.422v37.303c0,0.232,0.188,0.421,0.422,0.421h29.015  c0.231,0,0.42-0.188,0.42-0.421v-37.303C710.481,520.328,710.293,520.14,710.062,520.14z M695.554,556.459  c-1.124,0-2.034-0.911-2.034-2.034s0.91-2.035,2.034-2.035s2.034,0.912,2.034,2.035S696.678,556.459,695.554,556.459z   M707.322,549.676c0,0.224-0.181,0.404-0.405,0.404h-22.728c-0.225,0-0.406-0.181-0.406-0.404v-25.932  c0-0.225,0.182-0.404,0.406-0.404h22.728c0.225,0,0.405,0.18,0.405,0.404V549.676z"/><g><path d="M782.984,559.927h-4.75l-1.61-5.653c0-0.234-0.189-0.425-0.425-0.425h-12.61c-0.235,0-0.424,0.19-0.424,0.425l-1.611,5.653   h-4.75c-0.235,0-0.425,0.19-0.425,0.424v1.188h27.03v-1.188C783.409,560.117,783.22,559.927,782.984,559.927z"/><path d="M793.289,518.736H746.5c-0.235,0-0.425,0.189-0.425,0.426v32.511c0,0.234,0.189,0.426,0.425,0.426h46.789   c0.234,0,0.425-0.191,0.425-0.426v-32.511C793.714,518.926,793.523,518.736,793.289,518.736z M769.895,550.23   c-1.053,0-1.906-0.853-1.906-1.905s0.854-1.907,1.906-1.907s1.906,0.854,1.906,1.907S770.947,550.23,769.895,550.23z    M790.019,544.404h-40.246v-22.772h40.246V544.404z"/></g><path d="M258.563,70.629h-45.947c-0.276,0-0.5,0.224-0.5,0.5v28.14c0,0.276,0.224,0.5,0.5,0.5h9.589l-0.001,7.894  c0.095,0.098,0.224,0.152,0.359,0.152s0.265-0.055,0.359-0.152l15.31-7.894h20.331c0.276,0,0.5-0.224,0.5-0.5v-28.14  C259.063,70.853,258.84,70.629,258.563,70.629z M226.798,99.63l0.031-5.559c-0.095-0.097-0.224-0.151-0.359-0.151h-8.504V76.479  h35.249V93.92h-15.247c-0.136,0-0.265,0.055-0.359,0.151L226.798,99.63z"/><g><path d="M626.614,166.73l5.318-17.658c0.042-0.139,0.016-0.289-0.071-0.406c-0.087-0.116-0.223-0.186-0.368-0.186h-31.849   l-1.124-4.828c-0.05-0.207-0.234-0.354-0.447-0.354h-8.769c-0.253,0-0.458,0.205-0.458,0.459v3.669   c0,0.253,0.205,0.459,0.458,0.459h5.49l5.866,26.171c0.049,0.209,0.234,0.355,0.447,0.355h27.915c0.254,0,0.459-0.206,0.459-0.459   v-3.67c0-0.254-0.205-0.459-0.459-0.459h-24.637l-0.421-2.766h22.209C626.378,167.059,626.556,166.925,626.614,166.73z"/><circle cx="603.469" cy="179.187" r="3.399"/><circle cx="625.624" cy="179.187" r="3.399"/></g><path d="M44.504,20.72L27.944,6.035c-0.142-0.117-0.352-0.153-0.535-0.089  c-0.184,0.061-0.303,0.208-0.303,0.372l0.025,6.986c-8.369,0.13-21.768,7.379-21.768,30.324c0,0.229,0.166,0.422,0.394,0.454  c0.021,0.003,0.044,0.005,0.064,0.005c0.202,0,0.383-0.131,0.442-0.328C9.269,33.696,19.763,28.725,25.79,28.725  c0.568,0,1.026,0.015,1.342,0.025l-0.025,7.066c0,0.164,0.12,0.312,0.303,0.373c0.187,0.062,0.396,0.027,0.535-0.09l16.562-14.735  C44.681,21.186,44.681,20.898,44.504,20.72z" style="fill:#010202;"/></svg></div></div>';
                //var share_b64 = '<div class="rev-reaction rev-reaction-share"><div class="rev-reaction-icon"><img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8Zz4KCQkJPHBhdGggZD0iTTMzMS42OTYsMTA0LjY5NGM0LjQ2NC0wLjExOSw3Ljk4NS0zLjgzMyw3Ljg2Ny04LjI5N2MtMS4xNDYtNDMuMDc0LDMyLjk2NC03OS4wNTIsNzYuMDM5LTgwLjE5OSAgICAgYzIwLjg4NC0wLjU1OCw0MC43MDEsNy4wNDksNTUuODQ5LDIxLjQxczIzLjc5NiwzMy43NjMsMjQuMzUyLDU0LjYyOWMwLjU1NSwyMC44NjYtNy4wNDgsNDAuNjk5LTIxLjQxLDU1Ljg0NyAgICAgcy0zMy43NjMsMjMuNzk2LTU0LjYzLDI0LjM1MmMtMTkuNjQ2LDAuNTEzLTM4LjY3OC02LjMxNi01My40OTEtMTkuMjYzYy0zLjM2My0yLjkzOC04LjQ2OC0yLjU5Ny0xMS40MDcsMC43NjYgICAgIGMtMi45MzgsMy4zNjEtMi41OTQsOC40NjgsMC43NjcsMTEuNDA2YzE3LjI0MywxNS4wNywzOS4xNzcsMjMuMjg2LDYyLjAyMSwyMy4yODZjMC44NDQsMCwxLjY5My0wLjAxMiwyLjUzOS0wLjAzNCAgICAgYzI1LjE4NC0wLjY3LDQ4LjU5OS0xMS4xMDgsNjUuOTMzLTI5LjM4OWMxNy4zMzMtMTguMjgxLDI2LjUxLTQyLjIxOSwyNS44MzktNjcuNDAyYy0wLjY3LTI1LjE4My0xMS4xMDgtNDguNTk5LTI5LjM5LTY1LjkzMiAgICAgQzQ2NC4yOTEsOC41NDIsNDQwLjMyLTAuNjUxLDQxNS4xNzMsMC4wMzZjLTUxLjk4OCwxLjM4NC05My4xNTYsNDQuODA1LTkxLjc3Miw5Ni43OTIgICAgIEMzMjMuNTIsMTAxLjI5MSwzMjcuMjU5LDEwNC44MDgsMzMxLjY5NiwxMDQuNjk0eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNNDIyLjU3NSwzMjMuNDk2Yy0yMi45NjktMS4xOTUtNDUuNTMyLDYuMDItNjMuNTI3LDIwLjMxMmMtMy40OTYsMi43NzgtNC4wNzksNy44NjItMS4zMDIsMTEuMzU5ICAgICBjMi43NzYsMy40OTYsNy44NjEsNC4wNzgsMTEuMzU5LDEuMzAyYzE0LjkwNS0xMS44NDEsMzMuNjAzLTE3LjgxNSw1Mi42My0xNi44MjdjNDMuMDMzLDIuMjM2LDc2LjIyNCwzOS4wNjQsNzMuOTg5LDgyLjA5NiAgICAgYy0xLjA4MiwyMC44NDUtMTAuMjE3LDQwLjAyMi0yNS43MjQsNTMuOTk2Yy0xNS41MDcsMTMuOTc0LTM1LjUyMSwyMS4wNzctNTYuMzcyLDE5Ljk5MSAgICAgYy0yMC44NDUtMS4wODMtNDAuMDIyLTEwLjIyLTUzLjk5Ny0yNS43MjVjLTEzLjk3NC0xNS41MDYtMjEuMDc0LTM1LjUyNS0xOS45OTEtNTYuMzcxYzAuMjMxLTQuNDU5LTMuMTk2LTguMjYxLTcuNjU1LTguNDkzICAgICBjLTQuNDEyLTAuMjI4LTguMjYxLDMuMTk1LTguNDkzLDcuNjU0Yy0xLjMwNiwyNS4xNTgsNy4yNjMsNDkuMzIsMjQuMTI4LDY4LjAzM2MxNi44NjYsMTguNzE0LDQwLjAwOSwyOS43NCw2NS4xNjksMzEuMDQ3ICAgICBjMS42NzUsMC4wODcsMy4zNDMsMC4xMyw1LjAwNywwLjEzYzIzLjM0Mi0wLjAwMSw0NS41Ni04LjUxNCw2My4wMjgtMjQuMjU3YzE4LjcxNC0xNi44NjYsMjkuNzQtNDAuMDA5LDMxLjA0OC02NS4xNjcgICAgIEM1MTQuNTcsMzcwLjY0MSw0NzQuNTExLDMyNi4xOTMsNDIyLjU3NSwzMjMuNDk2eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNNDE3LjY4Miw0NjguODgxYzI4LjIzMSwwLDUxLjItMjIuOTY4LDUxLjItNTEuMTk5cy0yMi45NjktNTEuMi01MS4yLTUxLjJjLTE3LjEwOCwwLTMyLjI4NSw4LjQzOC00MS41ODcsMjEuMzY3ICAgICBsLTIzMi45NC0xMTYuNDY5YzEuNTM0LTQuODU3LDIuMzU5LTEwLjAyMywyLjM1OS0xNS4zOGMwLTUuMzU3LTAuODI4LTEwLjUyNS0yLjM1OS0xNS4zODJMMzc2LjA5NCwxMjQuMTUgICAgIGM5LjMwMiwxMi45MzEsMjQuNDc4LDIxLjM2Nyw0MS41ODgsMjEuMzY3YzI4LjIzMSwwLDUxLjItMjIuOTY4LDUxLjItNTEuMmMwLTI4LjIzMi0yMi45NjktNTEuMTk5LTUxLjItNTEuMTk5ICAgICBjLTI4LjIzMSwwLTUxLjE5OSwyMi45NjgtNTEuMTk5LDUxLjE5OWMwLDUuMzU3LDAuODI3LDEwLjUyMywyLjM2LDE1LjM4bC0yMzIuOTQsMTE2LjQ3ICAgICBjLTkuMzAyLTEyLjkyOS0yNC40NzktMjEuMzY3LTQxLjU4Ny0yMS4zNjdjLTI4LjIzMSwwLTUxLjIsMjIuOTY5LTUxLjIsNTEuMnMyMi45NjksNTEuMTk5LDUxLjIsNTEuMTk5ICAgICBjMTcuMTExLDAsMzIuMjg2LTguNDM2LDQxLjU4OC0yMS4zNjdsMjMyLjkzOCwxMTYuNDY5Yy0xLjUzMyw0Ljg1Ny0yLjM2LDEwLjAyNC0yLjM2LDE1LjM4MiAgICAgQzM2Ni40ODMsNDQ1LjkxNCwzODkuNDUxLDQ2OC44ODEsNDE3LjY4Miw0NjguODgxeiBNNDE3LjY4MiwzODIuNjUxYzE5LjMxNywwLDM1LjAzMiwxNS43MTUsMzUuMDMyLDM1LjAzMiAgICAgYzAsMTkuMzE3LTE1LjcxNSwzNS4wMzEtMzUuMDMyLDM1LjAzMWMtMTkuMzE2LDAtMzUuMDMtMTUuNzE1LTM1LjAzLTM1LjAzMUMzODIuNjUyLDM5OC4zNjcsMzk4LjM2NiwzODIuNjUxLDQxNy42ODIsMzgyLjY1MXogICAgICBNNDE3LjY4Miw1OS4yODdjMTkuMzE3LDAsMzUuMDMyLDE1LjcxNSwzNS4wMzIsMzUuMDMxYzAsMTkuMzE2LTE1LjcxNSwzNS4wMzItMzUuMDMyLDM1LjAzMiAgICAgYy0xOS4zMTYsMC0zNS4wMy0xNS43MTYtMzUuMDMtMzUuMDMyQzM4Mi42NTIsNzUuMDAxLDM5OC4zNjYsNTkuMjg3LDQxNy42ODIsNTkuMjg3eiBNOTQuMzE2LDI5MS4wMzEgICAgIGMtMTkuMzE3LDAtMzUuMDMyLTE1LjcxNS0zNS4wMzItMzUuMDMxczE1LjcxNS0zNS4wMzIsMzUuMDMyLTM1LjAzMmMxOS4zMTYsMCwzNS4wMzEsMTUuNzE2LDM1LjAzMSwzNS4wMzIgICAgIFMxMTMuNjMyLDI5MS4wMzEsOTQuMzE2LDI5MS4wMzF6IiBmaWxsPSIjMDAwMDAwIi8+CgkJCTxwYXRoIGQ9Ik0xMjkuMjU3LDMyNS44OTZjLTEwLjkyOCw1LjQ3NS0yMi42ODMsOC4yNS0zNC45NDEsOC4yNWMtNDMuMDkxLDAtNzguMTQ3LTM1LjA1Ni03OC4xNDctNzguMTQ2ICAgICBjMC00My4wOSwzNS4wNTYtNzguMTQ3LDc4LjE0Ny03OC4xNDdjMTIuMjU4LDAsMjQuMDEzLDIuNzc2LDM0Ljk0Miw4LjI1YzMuOTk0LDIuMDAyLDguODUsMC4zODUsMTAuODQ4LTMuNjA3ICAgICBjMi0zLjk5MSwwLjM4NS04Ljg1LTMuNjA3LTEwLjg0OWMtMTMuMTk2LTYuNjExLTI3LjM4OC05Ljk2My00Mi4xODMtOS45NjNDNDIuMzA5LDE2MS42ODUsMCwyMDMuOTk1LDAsMjU2ICAgICBzNDIuMzEsOTQuMzE1LDk0LjMxNSw5NC4zMTVjMTQuNzk1LDAsMjguOTg4LTMuMzUyLDQyLjE4My05Ljk2M2MzLjk5MS0yLjAwMSw1LjYwNi02Ljg1OCwzLjYwNy0xMC44NDkgICAgIEMxMzguMTA3LDMyNS41MTIsMTMzLjI1LDMyMy44OTgsMTI5LjI1NywzMjUuODk2eiIgZmlsbD0iIzAwMDAwMCIvPgoJCTwvZz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K" /></div></div>';
                var share_b64 = '<a href="https://www.facebook.com/sharer/sharer.php?u='+ this.options.domain +'" target="_blank" class="rev-reaction rev-reaction-share"><div class="rev-reaction-icon"></div></a>';

                // var dislike = '<div class="rev-reaction rev-reaction-dislike"><div class="rev-reaction-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M1335 709l0 0c5,0 10,0 15,0l0 0c5,0 10,0 15,0l0 0c5,0 10,0 15,1l0 0c5,0 10,1 15,1 308,23 569,215 690,485 121,-269 382,-462 690,-485 5,0 10,-1 15,-1l0 0c5,0 10,-1 15,-1l0 0c5,0 10,0 15,0l0 0c5,0 10,0 15,0l0 0c7,0 14,0 21,0l0 0c7,0 14,0 21,1l0 0c7,0 14,1 21,1 60,5 118,15 173,32l-2087 2087c-471,-589 -477,-1224 -476,-1292l0 -6c0,-434 335,-789 760,-821 7,-1 14,-1 21,-1l0 0c7,0 14,-1 21,-1l0 0c7,0 14,0 21,0zm911 1057l-637 637 -616 616 -451 451 256 256 451 -451 616 -616 637 -637 1067 -1067 451 -451 -256 -256 -451 451 -1067 1067zm1322 -616c60,114 94,244 94,382l0 6c1,74 -5,810 -600,1434 -421,443 -746,614 -913,679l0 2 -126 0 0 -2c-121,-47 -324,-150 -587,-371l2131 -2131z"/></g></svg></div></div>';
                // dislike = '';

                var reactionsContainer = document.createElement('div');

                // if (items[0].type === 'internal') {
                    var html = like_b64 + comment_b64 + share_b64;
                // } else {
                //     var html = like_b64;
                // }

                reactionsContainer.innerHTML = '<div class="rev-reaction-bar">' + html + '</div>';
                revUtils.addClass(reactionsContainer, 'rev-reactions');
                items[0].element.querySelector('.rev-content-inner').appendChild(reactionsContainer);

                // var reactions = items[0].element.querySelectorAll('.rev-reaction');
                // if (reactions[0]) {
                //     reactions[0].insertAdjacentHTML('beforeend', '<div class="rev-reaction-count"><div class="rev-reaction-count-inner">Love</div></div>');
                // }

                // if (reactions[1]) {
                //     reactions[1].insertAdjacentHTML('beforeend', '<div class="rev-reaction-count"><div class="rev-reaction-count-inner">Comment</div></div>');
                // }

                // if (reactions[2]) {
                //     reactions[2].insertAdjacentHTML('beforeend', '<div class="rev-reaction-count"><div class="rev-reaction-count-inner">Share</div></div>');
                // }

                // reactions[3].insertAdjacentHTML('beforeend', '<div class="rev-reaction-count"><div class="rev-reaction-count-inner">'+ random(1800) +'</div></div>');

                // var menu = items[0].element.querySelector('.rev-reaction-menu');

                // revUtils.addEventListener(menu, 'mouseenter', function(el) {
                //     console.log('on');
                //     // revUtils.addClass(el.target, 'rev-active');
                //     // that.likeReactionTimeout = setTimeout(function() {
                //     //     revUtils.addClass(el.target, 'rev-menu-active');
                //     // }, 500);
                // });

                // revUtils.addEventListener(menu, 'mouseleave', function() {
                //     console.log('off');
                //     // console.log('out');
                //     // clearTimeout(that.likeReactionTimeout);
                // });
                this.handleShareAction(items[0]);
                this.handleReactionMenu(items[0]);
            }

            var headline = '<div class="rev-headline">' +
                        '<h3></h3>' +
                    '</div>';

            if (items[0].element.matches(this.options.headline_top_selector)) {
                revUtils.addClass(items[0].element, 'rev-headline-top');
                items[0].element.querySelector('.rev-before-image').insertAdjacentHTML('beforeend', headline);
            } else {
                items[0].element.querySelector('.rev-headline-brand-inner').insertAdjacentHTML('afterbegin', headline);
            }

            if (this.options.header_selector && items[0].element.matches(this.options.header_selector)) {
                var header = this.createHeader();
                items[0].element.querySelector('.rev-ad-container').insertAdjacentElement('afterbegin', header);
                // this.grid.element.appendChild(cell);

                // var headers = this.grid.addItems([cell]);
                // this.grid.layoutItems(headers, true);
                // this.grid.reveal(headers);

                // // var headers = this.grid.appended([cell]);
                // headers[0].type = 'header';
            }

            limit++;
            i++;
        }

        return {
            items: itemsArr,
            limit: limit,
            internalLimit: internalLimit,
            sponsoredLimit: sponsoredLimit
        }
    }

    RevSlider.prototype.handleReactionMenu = function(item) {

        // console.log(revDetect.mobile());

        var that = this;
        var likeReactionElement = item.element.querySelector('.rev-reaction-icon');

        if (revDetect.mobile()) {
            revUtils.addEventListener(likeReactionElement, 'click', function(el) {
                clearTimeout(that.likeReactionIconHideTimeout);

                that.likeReactionIconShowTimeout = setTimeout(function() {
                    revUtils.addClass(item.element, 'rev-menu-active');
                }, 750);
            });
        } else {

            revUtils.addEventListener(likeReactionElement, 'mouseenter', function(el) {
                clearTimeout(that.likeReactionIconHideTimeout);

                that.likeReactionIconShowTimeout = setTimeout(function() {
                    revUtils.addClass(item.element, 'rev-menu-active');
                }, 750);
            });

            revUtils.addEventListener(likeReactionElement, 'mouseleave', function(el) {
                clearTimeout(that.likeReactionIconShowTimeout);

                that.likeReactionIconHideTimeout = setTimeout(function() {
                    // revUtils.addClass(el.target.parentNode.parentNode, 'rev-menu-active');
                    revUtils.removeClass(item.element, 'rev-menu-active');
                }, 750);
            });

            revUtils.addEventListener(likeReactionElement, 'click', function(el) {

                revUtils.removeClass(item.element, 'rev-menu-active');
                clearTimeout(that.likeReactionIconShowTimeout);

                if (parseInt(likeReactionElement.getAttribute('data-active'))) {
                    likeReactionElement.setAttribute('data-active', 0);

                    revUtils.removeClass(likeReactionElement, 'rev-reaction-icon-', true);

                    var count = item.element.querySelector('.rev-reaction-count');
                    count.innerHTML = count.innerHTML.split(' ')[2];
                } else {
                    likeReactionElement.setAttribute('data-active', 1);
                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-like');

                    revUtils.addClass(likeReactionElement, 'rev-reaction-icon-selected'); // TODO: this should not be needed

                    var count = item.element.querySelector('.rev-reaction-count');
                    count.innerHTML = 'You and ' + count.innerHTML + ' others';
                }
            });
        }

        var menuItems = item.element.querySelectorAll('.rev-reaction-menu-item');

        for (var menuItemCount = 0; menuItemCount < menuItems.length; menuItemCount++) {
            revUtils.addEventListener(menuItems[menuItemCount], revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
                ev.preventDefault();
                ev.stopPropagation();

                likeReactionElement.setAttribute('data-active', 1);

                var icon = item.element.querySelector('.rev-reaction-like .rev-reaction-icon');

                revUtils.removeClass(icon, 'rev-reaction-icon-', true);
                revUtils.addClass(icon, 'rev-reaction-icon-' + ev.target.getAttribute('data-icon'));

                revUtils.addClass(icon, 'rev-reaction-icon-selected'); // TODO: this should not be needed

                // revUtils.removeClass(el.target.parentNode.parentNode.parentNode, 'rev-active');
                revUtils.removeClass(item.element, 'rev-menu-active');

                var count = item.element.querySelector('.rev-reaction-count');

                var words = count.innerHTML.split(' ');

                if (words.length == 1) {
                    count.innerHTML = 'You and ' + count.innerHTML + ' others';
                }
            }, {passive: false});
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

                // var windowRef = window.open(
                //     "https://www.facebook.com/sharer/sharer.php?u=" + item.data.target_url,
                //     "shareWindow",
                //     "resizable,scrollbars,status"
                // );
            }, {passive: false});
        }
    }

    RevSlider.prototype.getPadding = function(resetItems) {
        if (resetItems) {
            for (var i = 0; i < resetItems.length; i++) {
                resetItems[i].element.style.paddingTop = null;
                resetItems[i].element.style.paddingRight = null;
                resetItems[i].element.style.paddingBottom = null;
                resetItems[i].element.style.paddingLeft = null;

                resetItems[i].element.children[0].style.paddingTop = null;
                resetItems[i].element.children[0].style.paddingRight = null;
                resetItems[i].element.children[0].style.paddingBottom = null;
                resetItems[i].element.children[0].style.paddingLeft = null;
            }
            // this.grid.layout(11);
        }
        // use last element for padding-top
        var paddingTop = parseFloat(revUtils.getComputedStyle(this.grid.items[(this.grid.items.length - 1)].element, 'padding-top'));
        var paddingRight = parseFloat(revUtils.getComputedStyle(this.grid.items[0].element, 'padding-right'));
        var paddingBottom = parseFloat(revUtils.getComputedStyle(this.grid.items[0].element, 'padding-bottom'));
        var paddingLeft = parseFloat(revUtils.getComputedStyle(this.grid.items[0].element, 'padding-left'));

        var adInner = this.grid.element.querySelectorAll('.rev-ad-inner')[0];
        var calculatedPadding = Math.round((adInner.offsetWidth * this.marginMultiplier).toFixed(2) / 1);

        // console.log(calculatedPadding);

        this.padding = {
            top: paddingTop ? false : calculatedPadding,
            right: paddingRight ? false : calculatedPadding,
            bottom: paddingBottom ? false : calculatedPadding,
            left: paddingLeft ? false : calculatedPadding,
        };
    };

    RevSlider.prototype.setContentPadding = function(items) {

        // console.log('hree', this.padding);
        // var content = this.grid.element.querySelectorAll('.rev-content');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (this.padding.top) {
                item.element.style.paddingTop = this.padding.top + 'px';
            }
            if (this.padding.right) {
                item.element.style.paddingRight = this.padding.right + 'px';
            }
            if (this.padding.bottom) {
                item.element.style.paddingBottom = this.padding.bottom + 'px';
            }
            if (this.padding.left) {
                item.element.style.paddingLeft = this.padding.left + 'px';
            }
        }
    };

    RevSlider.prototype.setMultipliers = function() {
        this.lineHeightMultiplier = Math.round( (.05856 + Number((this.options.multipliers.line_height * .01).toFixed(2))) * 10000 ) / 10000;
        // used for padding around elements
        this.marginMultiplier = Math.round( (.05 + Number((this.options.multipliers.margin * .01).toFixed(2))) * 1000 ) / 1000;
        // used for margins on headlines inside
        this.paddingMultiplier = Math.round( (.02 + Number((this.options.multipliers.padding * .01).toFixed(2))) * 1000 ) / 1000;
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
            removeVerticalGutters: true
        };
    };

    RevSlider.prototype.getAnimationDuration = function() {
        this.animationDuration = 0.5;

        if (this.options.vertical) {
            var gridRows = this.grid.rowsCount;
            if (gridRows >= 7) {
                this.animationDuration = 2;
            } else if (gridRows >= 6) {
                this.animationDuration = 1.75;
            } else if (gridRows >= 5) {
                this.animationDuration = 1.5;
            } else if (gridRows >= 4) {
                this.animationDuration = 1.25;
            } else if (gridRows >= 3) {
                this.animationDuration = 1;
            } else if (gridRows >= 2) {
                this.animationDuration = 0.75;
            }
        } else {
            switch (this.grid.breakPoint) {
                case 'xxs':
                    this.animationDuration = .6;
                    break;
                case 'xs':
                    this.animationDuration = .7;
                    break;
                case 'sm':
                    this.animationDuration = .8;
                    break;
                case 'md':
                    this.animationDuration = .9;
                    break;
                case 'lg':
                    this.animationDuration = 1;
                    break;
                case 'xl':
                    this.animationDuration = 1.1;
                    break;
                case 'xxl':
                    this.animationDuration = 1.2;
                    break;
            }
        }
        return this.animationDuration;
    };

    RevSlider.prototype.prepareNextGrid = function() {
        // return;
        // var gridElement = document.createElement('div');//something up here
        // gridElement.id = 'rev-slider-grid';
        // gridElement.style.width = this.innerElement.offsetWidth + 'px';

        // revUtils.append(this.gridContainerElement, gridElement);

        this.nextGrid = new AnyGrid(this.nextGridElement, this.gridOptions());

        this.createCells(this.nextGrid);

        this.setContentPadding(this.nextGrid.items);

        this.setSize(this.nextGrid.items);

        this.nextGrid.layout();

        this.nextGrid.bindResize();

        var that = this;
        this.nextGrid.on('resize', function() {
            that.resize();
        });
    };

    RevSlider.prototype.createNextPageGrid = function() {
        console.log('info', 'createNextPageGrid');
        var containerWidth = this.innerElement.offsetWidth;
        var containerHeight = this.innerElement.offsetHeight;

        var prepend = false;
        // var margin;

        if (this.direction == 'next') { // slide left or up
            this.nextGridZindex = 0;
            // var insert = 'append';
            if (this.options.vertical) { // up
                // margin = 'marginBottom';
                this.gridContainerTransform = 'translate3d(0, -'+ (containerHeight + (this.padding.left * 2)) +'px, 0)';
            } else { // left
                // margin = 'marginRight';
                // this.gridContainerTransform = 'translate3d(-'+ (containerWidth + (this.padding.left * 2)) +'px, 0, 0)';
                // this.gridContainerTransform = 'translate3d(-100%, 0, 0)';
                this.nextGridTransform = 'translate3d(-100%, 0, 0)';
                this.gridTransform = 'scale(.8)';
            }
        } else { // Slide right or down
            // var insert = 'prepend';
            prepend = true;
            this.nextGridZindex = 1000;
            if (this.options.vertical) { // down
                // margin = 'marginTop';
                revUtils.transformCss(this.gridContainerElement, 'translate3d(0, -'+ (containerHeight + (this.padding.left * 2)) +'px, 0)');
                this.gridContainerTransform = 'translate3d(0, 0, 0)';
            } else { // right
                // margin = 'marginLeft';
                revUtils.transformCss(this.gridTransitionContainer, 'translate3d(-100%, 0, 0)');
                // revUtils.transformCss(this.gridContainerElement, 'translate3d(-100%, 0, 0)');
                // this.gridContainerTransform = 'translate3d(0, 0, 0)';
                this.nextGridTransform = 'translate3d(100%, 0, 0)';
                this.gridTransform = 'scale(.8)';
            }
        }

        // this.grid.element.style[margin] = (this.padding.left * 2) + 'px';

        // already appended, should we prepend instead
        if (prepend) {
            revUtils.prepend(this.gridTransitionContainer, this.nextGridTransitionElement);
            // revUtils.prepend(this.gridContainerElement, this.nextGrid.element);
        }

        // revUtils[insert](this.gridContainerElement, this.nextGrid.element);

        // if (!this.options.vertical) {
        //     this.grid.element.style.width = containerWidth + 'px';
        //     this.grid.element.style.float = 'left';

        //     this.nextGrid.element.style.width = containerWidth + 'px';
        //     this.nextGrid.element.style.float = 'left';

        //     this.gridContainerElement.style.width = (containerWidth * 2) + (this.padding.left * 2) + 'px';
        // }

        this.oldGrid = this.grid;

        var nextGrid = this.grid;

        this.grid = this.nextGrid;

        this.nextGrid = nextGrid;

        this.updateDisplayedItems(this.grid.items);

        // this.prepareNextGrid();




        // this.oldGrid = this.grid;

        // this.grid.element.style[margin] = (this.padding.left * 2) + 'px';

        // var gridElement = document.createElement('div');//something up here
        // gridElement.id = 'rev-slider-grid';

        // revUtils[insert](this.gridContainerElement, gridElement);

        // var options = this.gridOptions();
        // options.isResizeBound = false;
        // this.grid = new AnyGrid(gridElement, options);

        // if (!this.options.vertical) {
        //     this.oldGrid.element.style.width = containerWidth + 'px';
        //     this.oldGrid.element.style.float = 'left';

        //     this.grid.element.style.width = containerWidth + 'px';
        //     this.grid.element.style.float = 'left';

        //     this.gridContainerElement.style.width = (containerWidth * 2) + (this.padding.left * 2) + 'px';
        // }

        // this.setGridClasses();

        // this.createCells(this.grid);

        // // this.grid.reloadItems();
        // // this.grid.layout(1);

        // // this.getPadding();

        // this.setContentPadding(this.grid);

        // // this.grid.option({removeVerticalGutters: true});

        // // this.grid.layout(2);

        // this.updateDisplayedItems(true);
    };

    RevSlider.prototype.transitionClass = function(transitioning) {
        revUtils[transitioning ? 'addClass' : 'removeClass'](this.element, 'rev-transitioning');
    };

    RevSlider.prototype.animateGrid = function() {
        console.log('info', 'animateGrid');
        // return;
        this.transitioning = true;
        this.transitionClass(true);

        this.nextGridTransitionElement.style.zIndex = this.nextGridZindex;

        // console.log(this.gridContainerTransform);

        // revUtils.transitionDurationCss(this.gridContainerElement, this.animationDuration + 's');
        // revUtils.transformCss(this.gridContainerElement, this.gridContainerTransform);
        // console.log('animate', this.gridTransitionElement, this.nextGridTransitionElement);

        revUtils.transitionDurationCss(this.gridTransitionElement, this.animationDuration + 's');
        revUtils.transitionDurationCss(this.nextGridTransitionElement, this.animationDuration + 's');

        // revUtils.transformCss(this.oldGrid.element, this.gridTransform);
        revUtils.transformCss(this.gridTransitionElement, this.gridTransform);
        revUtils.transformCss(this.nextGridTransitionElement, this.nextGridTransform);

        var that = this;
        setTimeout(function() {
            that.updateGrids();
            that.transitioning = false;
        }, this.animationDuration * 1000);

        return;

        this.transitioning = true;
        this.transitionClass(true);

        revUtils.transitionDurationCss(this.gridContainerElement, this.animationDuration + 's');
        revUtils.transformCss(this.gridContainerElement, this.gridContainerTransform);

        var that = this;
        setTimeout(function() {
            that.updateGrids();
            that.transitioning = false;
        }, this.animationDuration * 1000);
    };

    RevSlider.prototype.updateGrids = function(revert) {
        console.log('updateGrids');
        // console.log(this.gridTransitionElement);
        // console.log(this.nextGridTransitionElement);

        revUtils.transitionDurationCss(this.gridTransitionElement,  '0s');
        revUtils.transitionDurationCss(this.nextGridTransitionElement,  '0s');

        revUtils.transformCss(this.gridTransitionElement, 'none');
        revUtils.transformCss(this.nextGridTransitionElement, 'none');

        // revUtils.transitionDurationCss(this.innerElement,  '0s');

        revUtils.transformCss(this.gridTransitionContainer, 'none');

        revUtils.append(this.gridTransitionContainer, this.gridTransitionElement);

        var nextGridTransitionElement = this.gridTransitionElement;
        this.gridTransitionElement = this.nextGridTransitionElement;
        this.nextGridTransitionElement = nextGridTransitionElement;

        this.gridTransitionElement.style.zIndex = 'auto';
        // this.gridTransitionElement.style.transform = 'none';
        // this.nextGridTransitionElement.style.transform = 'none';

        this.updating = false;
        // revUtils.transitionDurationCss(this.gridTransitionElement, '0s');
        // revUtils.transitionDurationCss(this.nextGridTransitionElement, '0s');

        // // revUtils.transformCss(this.oldGrid.element, this.gridTransform);
        // revUtils.transformCss(this.gridTransitionElement, 'none');
        // revUtils.transformCss(this.nextGridTransitionElement, 'none');



        return;

        if (revert === true) {
            var removeGrid = this.grid;
            var transitionGrid = this.oldGrid;
        } else {
            var removeGrid = this.oldGrid;
            var transitionGrid = this.grid;
        }

        revUtils.transformCss(transitionGrid.element, 'none');
        transitionGrid.element.style.marginLeft = '0';
        transitionGrid.element.style.marginRight = '0';
        transitionGrid.element.className = '';

        revUtils.transitionDurationCss(this.gridContainerElement,  '0s');

        revUtils.transformCss(this.gridContainerElement, 'none');

        removeGrid.remove();
        removeGrid.destroy();
        revUtils.remove(removeGrid.element);

        if (revert) {
            this.grid = transitionGrid;
            this.offset = this.oldOffset;
        }

        if (!this.options.vertical) {
            this.grid.element.style.width = 'auto';
            this.grid.element.style.float = 'none';

            this.gridContainerElement.style.width = '100%';
        }

        this.grid.bindResize();

        var that = this;
        this.grid.on('resize', function() {
            that.resize();
        });

        that.transitionClass(false);
        this.updating = false;
    };

    RevSlider.prototype.setUp = function(items) {
        // hard code provider

        var that = this;
        var setUp = function(item) {

            // var index = revUtils.siblingIndex(item.element);
            // // that.setImageSize(index, item.element);

            // var row = Math.floor( index / that.grid.perRow );

            that.setImageSize(item); // TODO: multiple image ratios

            // that.setTextRight(item);

            // that.setTextOverlay(item);

            that.setItemClasses(item);

            // that.setInnerMargin(item);

            that.setPreloaderHeight(item);

            // that.setUpProvider(item);

            // headline calculation based on text_right_height or grid columnWidth and lineHeightMultiplier
            // that.setHeadlineLineHeight(item);
            // that.setHeadlineFontSize(item);
            // that.setHeadlineMarginTop(item);

            // that.setHeadlineMaxHeight(item.element, item.span, item.row, item.index, item.stacked, item);
            // if (item.type == 'internal') {
            //     that.setDescriptionLineHeight(item);
            //     that.setDescriptionFontSize(item);
            //     that.setDescriptionMarginTop(item);
            // }
        };

        // if (item) { // if ad is passed do that one
        //     setUp(item);
        // } else { // otherwise do them all
        for (var i = 0; i < items.length; i++) {
            if (revUtils.hasClass(items[i].element, 'rev-content')) {
                setUp(items[i]);
            }
        }
        // }
    };

    RevSlider.prototype.setSize = function(items) {

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.type == 'sponsored' || item.type == 'internal') {
                this.resizeImage(item.element.querySelector('.rev-image'), item);
                // this.resizeAfterImage(item);
                // this.resizeHeader(item);
                // this.resizeHeadline(item.element.querySelector('.rev-headline'), item.row, item.index, item);
                // if (item.type == 'internal') {
                //     this.resizeDescription(item.element.querySelector('.rev-description'), item.row, item.index, item);
                // }
                // this.resizeProvider(item.element.querySelector('.rev-provider'), item);
                // this.resizeReactions(item);
                // this.resizeComments(item);
                // this.resizeHeadlineIcon(item.element.querySelector('.rev-headline-icon-container'), item.row, item.index, item);
                this.resizeHeadlineBrand(item);
            }
        }

        // var that = this;

        // var setSize = function(item) {

        //     var index = revUtils.siblingIndex(item.element);

        //     var row = Math.floor( index / grid.perRow );

        //     console.log(item.index, index)

        //     that.resizeImage(item.element.querySelector('.rev-image'), item);
        //     that.resizeHeadline(item.element.querySelector('.rev-headline'), row, index, item);
        //     that.resizeProvider(item.element.querySelector('.rev-provider'), item);
        //     that.resizeHeadlineBrand(item);
        // };

        // if (item) { // if ad is passed do that one
        //     setSize(item);
        // } else { // otherwise do them all
        //     for (var i = 0; i < grid.items.length; i++) {
        //         setSize(grid.items[i]);
        //     }
        // }
    };

    RevSlider.prototype.getTextRightHeight = function() {
        return this.options.text_right_height[this.grid.getBreakPoint()] ? this.options.text_right_height[this.grid.getBreakPoint()] : this.options.text_right_height;
    };

    RevSlider.prototype.setImageSize = function(item) {
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

        setImageSize((revDetect.mobile() ? 'wide_rectangle' : 'rectangle'));

        if (revUtils.isArray(this.options.image_ratio)) {
            for (var i = 0; i < this.options.image_ratio.length; i++) {
                if ((!this.options.image_ratio[i].media || window.matchMedia(this.options.image_ratio[i].media).matches)
                    && (!this.options.image_ratio[i].selector || matchesSelector(item.element, this.options.image_ratio[i].selector))) {
                    setImageSize(this.options.image_ratio[i].ratio);
                }
            }
        }
    };

    RevSlider.prototype.setPreloaderHeight = function(item) {
        item.preloaderHeight = false;
        item.preloaderWidth = false;
        if (item.textRight) { // base off text_right_height
            item.preloaderHeight = this.getTextRightHeight();
            item.preloaderWidth = item.preloaderHeight * (item.imageWidth / item.imageHeight);
        } else {
            // var adInner = item.element.querySelector('.rev-ad-inner');
            // console.log();
            var rect = item.element.querySelector('.rev-image').getBoundingClientRect();
            var width = Number(Math.round((rect.width ? rect.width : (rect.right - rect.left)) + 'e2') + 'e-2');
            // console.log(width);

            // console.log(width);

            // item.preloaderHeight = Math.floor(adInner.offsetWidth * (item.imageHeight / item.imageWidth));
            // item.preloaderWidth = Math.ceil(item.preloaderHeight * (item.imageWidth / item.imageHeight));

            item.preloaderHeight = Number(Math.round((width * (item.imageHeight / item.imageWidth)) + 'e2') + 'e-2');
            item.preloaderWidth =  Number(Math.round((item.preloaderHeight * (item.imageWidth / item.imageHeight)) + 'e2') + 'e-2');
        }
    };

    RevSlider.prototype.setTextRight = function(item) {
        item.textRight = false;
        if (this.options.text_right !== false) {
            if (this.options.text_right === true) {
                item.textRight = true;
            } else {
                for (var i = 0; i < this.options.text_right.length; i++) {
                    if ((!this.options.text_right[i].media || window.matchMedia(this.options.text_right[i].media).matches)
                        && (!this.options.text_right[i].selector || matchesSelector(item.element, this.options.text_right[i].selector))) {
                        item.textRight = true;
                    }
                }
            }
        }
    };

    RevSlider.prototype.setTextOverlay = function(item) {
        item.textOverlay = false;
        if (this.options.text_overlay !== false) {
            if (this.options.text_overlay === true) {
                item.textOverlay = true;
            } else {
                for (var i = 0; i < this.options.text_overlay.length; i++) {
                    if ((!this.options.text_overlay[i].media || window.matchMedia(this.options.text_overlay[i].media).matches)
                        && (!this.options.text_overlay[i].selector || matchesSelector(item.element, this.options.text_overlay[i].selector))) {
                        item.textOverlay = true;
                    }
                }
            }
        }
    };

    RevSlider.prototype.getItemBreakpoint = function(item) {
        var width = item.element.offsetWidth;

        if (width >= this.options.item_breakpoints.xxl) { // 650
            return 'xxl';
        }else if (width >= this.options.item_breakpoints.xl) { // 575
            return 'xl';
        }else if (width >= this.options.item_breakpoints.lg) { // 500
            return 'lg';
        }else if (width >= this.options.item_breakpoints.md) { // 425
            return 'md';
        }else if (width >= this.options.item_breakpoints.sm) { // 350
            return 'sm';
        }else if (width >= this.options.item_breakpoints.xs) { // 275
            return 'xs';
        }else { // 200
            return 'xxs';
        }
    };

    RevSlider.prototype.getGreaterLessThanBreakPoints = function(breakpoint) {
        var breakpoints = [];
        var index = 0;
        var indexed = false;
        for (var key in this.options.item_breakpoints) {
            if (this.options.item_breakpoints.hasOwnProperty(key)) {
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

    RevSlider.prototype.setItemClasses = function(item) {
        revUtils.removeClass(item.element, 'rev-text-right');

        var breakpoint = this.getItemBreakpoint(item);

        revUtils.removeClass(item.element, 'rev-content-', true);
        revUtils.addClass(item.element, 'rev-content-' + item.type);

        revUtils.addClass(item.element, 'rev-content-breakpoint-' + breakpoint);
        var greaterLessThanBreakPoints = this.getGreaterLessThanBreakPoints(breakpoint);
        for (var i = 0; i < greaterLessThanBreakPoints.gt.length; i++) {
            revUtils.addClass(item.element, 'rev-content-breakpoint-gt-' + greaterLessThanBreakPoints.gt[i]);
        }
        for (var i = 0; i < greaterLessThanBreakPoints.lt.length; i++) {
            revUtils.addClass(item.element, 'rev-content-breakpoint-lt-' + greaterLessThanBreakPoints.lt[i]);
        }

        if (item.textRight) {
            revUtils.addClass(item.element, 'rev-text-right');
        } else {
            revUtils.removeClass(item.element, 'rev-text-right');
        }

        if (item.textOverlay) {
            revUtils.addClass(item.element, 'rev-text-overlay');
        } else {
            revUtils.removeClass(item.element, 'rev-text-overlay');
        }

        // if (item.stacked) {
        //     revUtils.addClass(item.element, 'rev-stacked');
        // } else {
        //     revUtils.removeClass(item.element, 'rev-stacked');
        // }

        revUtils.removeClass(item.element, 'rev-colspan', true);
        revUtils.addClass(item.element, 'rev-colspan-' + item.span);

        revUtils.removeClass(item.element, 'rev-row', true);
        revUtils.addClass(item.element, 'rev-row-' + (item.row + 1));
    };

    RevSlider.prototype.setInnerMargin = function(item) {
        var element = item.element.querySelector('.rev-after-image');
        element.removeAttribute('style');
        var computedInnerMargin = parseInt(revUtils.getComputedStyle(element, 'margin-left'));

        if (computedInnerMargin > -1) {
            item.innerMargin = computedInnerMargin;
            return;
        }

        var adInner = item.element.querySelector('.rev-ad-inner');
        item.innerMargin = Math.round(Math.max(0, ((adInner.offsetWidth * this.paddingMultiplier).toFixed(2) / 1)));

        if (item.innerMargin > 14) {
            item.innerMargin = 14;
        }
    };

    RevSlider.prototype.setDescriptionLineHeight = function(item) {
        var description = item.element.querySelector('.rev-description h4');
        description.removeAttribute('style');
        if (!description) {
            return;
        }
        var computedLineHeight = parseInt(revUtils.getComputedStyle(description, 'line-height'));

        if (computedLineHeight) {
            item.descriptionLineHeight = computedLineHeight;
            return;
        }

        item.descriptionLineHeight = item.headlineLineHeight - 4
    };

    RevSlider.prototype.setDescriptionFontSize = function(item) {
        var description = item.element.querySelector('.rev-description h4');
        description.removeAttribute('style');
        if (!description) {
            return;
        }
        var computedFontSize = parseInt(revUtils.getComputedStyle(description, 'font-size'));

        if (computedFontSize) {
            item.descriptionFontSize = computedFontSize;
            return;
        }

        item.descriptionFontSize = Math.max(12, (item.descriptionLineHeight * .8).toFixed(2) / 1);
    };

    RevSlider.prototype.setUpProvider = function(item) {

        item.providerFontSize = 11;
        item.providerLineHeight = 16;
        item.providerMarginTop = 2;

        var provider = item.element.querySelector('.rev-provider');
        if (!provider) {
            return;
        }
        provider.removeAttribute('style');

        var computedFontSize = parseInt(revUtils.getComputedStyle(provider, 'font-size'));

        if (computedFontSize) {
            item.providerFontSize = computedFontSize;
        }

        var computedLineHeight = parseInt(revUtils.getComputedStyle(provider, 'line-height'));

        if (computedLineHeight) {
            item.providerLineHeight = computedLineHeight;
        }

        var computedMarginTop = parseInt(revUtils.getComputedStyle(provider, 'margin-top'));

        if (computedMarginTop > -1) {
            item.providerMarginTop = computedMarginTop;
        }
    };

    RevSlider.prototype.setHeadlineLineHeight = function(item) {
        var headline = item.element.querySelector('.rev-headline h3');
        headline.style.lineHeight = null;

        var computedLineHeight = parseInt(revUtils.getComputedStyle(headline, 'line-height'));

        if (computedLineHeight) {
            item.headlineLineHeight = computedLineHeight;
            return;
        }

        var calculateWidth = item.element.querySelector('.rev-ad-inner').offsetWidth;
        // if (item.textRight) {
        //     calculateWidth -= (item.preloaderWidth + parseInt(revUtils.getComputedStyle(item.element.querySelector('.rev-image'), 'margin-right')));
        // }
        // something between 18 and 28 for headlineHeight
        item.headlineLineHeight = Math.max(18, Math.round(calculateWidth * this.lineHeightMultiplier));
        if (item.headlineLineHeight > 28) {
            item.headlineLineHeight = 28;
        }
    };

    RevSlider.prototype.setHeadlineFontSize = function(item) {
        var headline = item.element.querySelector('.rev-headline h3');
        headline.style.fontSize = null;
        var computedFontSize = parseInt(revUtils.getComputedStyle(headline, 'font-size'));

        if (computedFontSize) {
            item.headlineFontSize = computedFontSize;
            return;
        }

        item.headlineFontSize = (item.headlineLineHeight * .75).toFixed(2) / 1;
    };

    RevSlider.prototype.setHeadlineMarginTop = function(item) {
        var headline = item.element.querySelector('.rev-headline h3');
        headline.style.marginTop = null;
        var computedMarginTop = parseInt(revUtils.getComputedStyle(headline, 'margin-top'));

        if (computedMarginTop > -1) {
            item.headlineMarginTop = computedMarginTop;
            return;
        }

        item.headlineMarginTop = 0;
        if (!item.textRight) { // give some space between bottom of image and headline
            var adInner = item.element.querySelector('.rev-ad-inner');
            item.headlineMarginTop = Math.round(Math.max(0, ((adInner.offsetWidth * this.paddingMultiplier).toFixed(2) / 1)));

            if (item.headlineMarginTop > 15) {
                item.headlineMarginTop = 15;
            }
        }


        // if (!item.textRight) { // give some space between bottom of image and headline
        //     var headlineMarginTop = ((item.headlineLineHeight * .18).toFixed(2) / 1);
        //     item.headlineMarginTop = headlineMarginTop > 4 ? 4 : headlineMarginTop;
        // }
    };

    RevSlider.prototype.setDescriptionMarginTop = function(item) {
        var description = item.element.querySelector('.rev-description h4');
        if (!description) {
            return;
        }
        description.style.marginTop = null;
        var computedMarginTop = parseInt(revUtils.getComputedStyle(description, 'margin-top'));

        // console.log('sup', computedMarginTop);

        if (computedMarginTop > -1) {
            item.descriptionMarginTop = computedMarginTop;
            return;
        }

        // var adInner = item.element.querySelector('.rev-ad-inner');
        item.descriptionMarginTop = item.headlineMarginTop * .6;
    };

    // RevSlider.prototype.setHeadlineMaxHeight = function(element, colSpan, row, index, stacked, item) {
    //     var maxHeight = 0;

    //     if (!this.headlineMaxHeights) {
    //         this.headlineMaxHeights = {};
    //     }

    //     if (!this.headlineMaxHeights[row]) {
    //         this.headlineMaxHeights[row] = {};
    //     }

    //     if (!this.headlineMaxHeights[row][colSpan]) {
    //         this.headlineMaxHeights[row][colSpan] = {};
    //     }

    //     if (item.textRight) { // based on preloaderHeight/ ad height
    //         var verticalSpace = item.preloaderHeight - item.providerLineHeight;
    //         var headlines = Math.floor(verticalSpace / item.headlineLineHeight);
    //         maxHeight = headlines * item.headlineLineHeight;
    //         this.headlineMaxHeights[row][colSpan][index] = { maxHeight: maxHeight };
    //     } else {

    //         var getHeadlineSizeMax = function(lineHeight, headlineSize) {
    //             return ((lineHeight * headlineSize).toFixed(2) / 1);
    //         }

    //         // var adsInner = this.grid.element.querySelectorAll('.rev-ad-inner');
    //         // if (this.options.max_headline && this.displayedItems.length && adsInner.length) { // max_headline and we have some ads otherwise just use the headline_size
    //         if (this.displayedItems.length && this.displayedItems[index]) { // max_headline and we have some ads otherwise just use the headline_size
    //             var adInner = element.querySelector('.rev-ad-inner');
    //             var el = document.createElement('div');
    //             revUtils.addClass(el, 'rev-headline-max-check');
    //             el.style.position = 'absolute';
    //             el.style.textAlign = revUtils.getComputedStyle(adInner.querySelectorAll('.rev-headline')[0], 'text-align');
    //             el.style.zIndex = '100';
    //             el.style.margin = item.headlineMarginTop +'px ' + item.innerMargin + 'px 0';
    //             el.innerHTML = '<h3 style="font-size:'+ item.headlineFontSize + 'px;line-height:'+ item.headlineLineHeight +'px">'+ this.displayedItems[index].headline + '</h3>';
    //             revUtils.prepend(adInner, el); // do it this way b/c changin the element height on the fly needs a repaint and requestAnimationFrame is not avail in IE9

    //             var height = el.clientHeight;

    //             revUtils.remove(el);

    //             if (stacked) {
    //                 if (this.options.max_headline) {
    //                     this.headlineMaxHeights[row][colSpan][index] = { maxHeight: height };
    //                 } else {
    //                     this.headlineMaxHeights[row][colSpan][index] = { maxHeight: Math.min(getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size), height) };
    //                 }
    //             } else {
    //                 if (this.options.max_headline) {
    //                     maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, height);
    //                     this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
    //                 } else {
    //                     maxHeight = Math.min(getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size), height);
    //                     maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, maxHeight);
    //                     this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
    //                 }
    //             }
    //         } else {
    //             maxHeight = Math.max(this.headlineMaxHeights[row][colSpan].maxHeight ? this.headlineMaxHeights[row][colSpan].maxHeight : 0, getHeadlineSizeMax(item.headlineLineHeight, this.options.headline_size));
    //             this.headlineMaxHeights[row][colSpan] = { maxHeight: maxHeight };
    //         }
    //     }
    // };

    RevSlider.prototype.updatePagination = function(checkPage) {

        if (!this.data.length || (this.options.disable_pagination && !this.options.row_pages)) { // need data to determine max pages
            return;
        }

        if (this.options.disable_pagination === false) {
            if (this.maxPages() <= 1) {
                this.backBtn.style.display = 'none';
                this.forwardBtn.style.display = 'none';
                this.mc.set({enable: false}); // disable touch events
                if (this.options.pagination_dots) {
                    revUtils.remove(this.paginationDotsContainer); // remove the pagination dots all together
                }
            } else {
                this.backBtn.style.display = 'block';
                this.forwardBtn.style.display = 'block';
                this.mc.set({enable: true});// make sure touch events are enabled
                if (this.options.pagination_dots && !this.paginationDotsContainer.parentNode) { // add pagination dots if not there
                    revUtils.prepend(this.innerContainerElement, this.paginationDotsContainer);
                }
            }
        }

        if (!this.options.pagination_dots) { // if no pagination dots we can return now
            return;
        }

        var children = this.paginationDots.childNodes;

        // make sure we don't have too many or too few dots
        var difference = (this.maxPages() - children.length);

        if (difference < 0) {
            var remove = [];
            for (var i = 0; i < this.options.pages; i++) {
                if (i >= this.maxPages()) {
                    remove.push(children[i]);
                }
            }
            for (var i = 0; i <= remove.length; i++) {
                revUtils.remove(remove[i]);
            }
        } else if (difference > 0) {
            for (var i = 0; i < difference; i++) {
                this.appendDot();
            }
        }

        // check the page on resize in case the offset changes
        if (checkPage) {
            this.page = (this.offset / this.limit) + 1;
            this.previousPage = Math.max(0, this.page - 1);
        }

        var children = this.paginationDots.childNodes

        // update the active dot
        for (var i = 0; i < children.length; i++) {
            revUtils.removeClass(children[i], 'rev-active');
            if ((i+1) == this.page) {
                revUtils.addClass(children[i], 'rev-active');
            }
        }
    };

    RevSlider.prototype.appendDot = function(active) {
        var dot = document.createElement('div');
        revUtils.addClass(dot, 'rev-pagination-dot');
        dot.innerHTML = '<div></div>';
        if (active) {
            revUtils.addClass(dot, 'rev-active');
        }
        revUtils.append(this.paginationDots, dot);
    };

    RevSlider.prototype.paginationDots = function() {
        if (!this.options.pagination_dots) {
            return;
        }

        this.paginationDots = document.createElement('div');
        revUtils.addClass(this.paginationDots, 'rev-pagination-dots');

        var pages = this.options.row_pages ? this.grid.rowCount : this.options.pages;

        for (var i = 0; i < pages; i++) {
            this.appendDot(i===0);
        }

        this.paginationDotsWrapper = document.createElement('div');
        revUtils.addClass(this.paginationDotsWrapper, 'rev-pagination-dots-wrapper');
        if (this.options.buttons.position == 'dots') {
            revUtils.addClass(this.paginationDotsWrapper, 'rev-pagination-dots-wrapper-buttons');
        }

        if (this.options.pagination_dots_vertical) {
            revUtils.addClass(this.paginationDotsWrapper, 'rev-pagination-dots-wrapper-vertical');
        }

        this.paginationDotsContainer = document.createElement('div');
        revUtils.addClass(this.paginationDotsContainer, 'rev-pagination-dots-container');

        revUtils.append(this.paginationDotsWrapper, this.paginationDotsContainer);

        revUtils.append(this.paginationDotsContainer, this.paginationDots);

        revUtils.prepend(this.innerContainerElement, this.paginationDotsWrapper);
    };

    //added to prevent default drag functionality in FF
    RevSlider.prototype.preventDefault = function() {
        revUtils.addEventListener(this.element, 'mousedown', function(e) {
            e.preventDefault();
        }, {passive: false});

        revUtils.addEventListener(this.element, 'dragstart', function(e) {
            e.preventDefault();
        }, {passive: false});
    };

    RevSlider.prototype.initButtons = function() {
        if (this.options.buttons === false || this.options.disable_pagination === true) {
            return;
        }

        var chevronUp    = '<path d="M18 12l-9 9 2.12 2.12L18 16.24l6.88 6.88L27 21z"/>';
        var chevronDown  = '<path d="M24.88 12.88L18 19.76l-6.88-6.88L9 15l9 9 9-9z"/><path d="M0 0h36v36H0z" fill="none"/>';
        var chevronLeft  = '<path d="M23.12 11.12L21 9l-9 9 9 9 2.12-2.12L16.24 18z"/>';
        var chevronRight = '<path d="M15 9l-2.12 2.12L19.76 18l-6.88 6.88L15 27l9-9z"/>';

        var btnHeight = this.options.buttons.position == 'dual' ? 'auto' : (this.options.vertical ? this.options.buttons.size + 'px' : '100%');

        this.backBtnWrapper = document.createElement('div');
        this.backBtnWrapper.id = "back-wrapper";
        this.backBtnWrapper.setAttribute('class', 'rev-btn-wrapper rev-btn-wrapper-back rev-btn-style-' + this.options.buttons.style);
        this.backBtnWrapper.style.height = btnHeight;
        this.backBtnWrapper.style.left = this.options.buttons.position == 'dual' ? 'auto' : '0';

        this.backBtnContainer = document.createElement('div');
        this.backBtnContainer.id = 'back-btn-container';
        revUtils.addClass(this.backBtnContainer, 'rev-btn-container');
        this.backBtnContainer.style.right = this.options.buttons.position == 'dual' ? 'auto' : '0px';

        this.backBtn = document.createElement('button');
        revUtils.addClass(this.backBtn, 'rev-chevron');
        this.backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">' + (this.options.vertical ? chevronUp : chevronLeft) + '</svg>';

        this.backBtnContainer.appendChild(this.backBtn);
        this.backBtnWrapper.appendChild(this.backBtnContainer);

        this.forwardBtnWrapper = document.createElement('div');
        this.forwardBtnWrapper.id = "forward-wrapper";
        this.forwardBtnWrapper.setAttribute('class', 'rev-btn-wrapper rev-btn-wrapper-forward rev-btn-style-' + this.options.buttons.style);
        this.forwardBtnWrapper.style.height = btnHeight;
        this.forwardBtnWrapper.style.right = this.options.buttons.position == 'dual' ? 'auto' : '0';

        this.forwardBtnContainer = document.createElement('div');
        this.forwardBtnContainer.id = 'back-btn-container';
        revUtils.addClass(this.forwardBtnContainer, 'rev-btn-container');
        this.forwardBtnContainer.style.right = this.options.buttons.position == 'dual' ? 'auto' : '0px';

        this.forwardBtn = document.createElement('button');
        revUtils.addClass(this.forwardBtn, 'rev-chevron');
        this.forwardBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">' + (this.options.vertical ? chevronDown : chevronRight) + '</svg>';

        this.forwardBtnContainer.appendChild(this.forwardBtn);
        this.forwardBtnWrapper.appendChild(this.forwardBtnContainer);

        if (this.options.buttons.position == 'dual') {
            this.btnContainer = document.createElement('div');
            this.btnContainer.setAttribute('class', 'rev-btn-dual');
            revUtils.append(this.btnContainer, this.backBtnWrapper);
            revUtils.append(this.btnContainer, this.forwardBtnWrapper);
            revUtils.append(this.innerContainerElement, this.btnContainer);
        } else if (this.options.buttons.position == 'dots') {
            if (!this.paginationDotsContainer) {
                return;
            }

            this.paginationDots.style.height = this.options.buttons.size + 'px';
            this.paginationDots.style.margin = '0 24px';

            this.backBtnWrapper.style.height = this.options.buttons.size + 'px';
            this.backBtnWrapper.style.width = this.options.buttons.size + 'px';
            this.backBtnWrapper.style.display = 'inline-block';
            this.backBtnContainer.style.height = '100%';
            this.backBtn.style.height = '100%';
            this.backBtn.style.width = '100%';

            this.forwardBtnWrapper.style.height = this.options.buttons.size + 'px';
            this.forwardBtnWrapper.style.width = this.options.buttons.size + 'px';
            this.forwardBtnWrapper.style.display = 'inline-block';
            this.forwardBtnContainer.style.height = '100%';
            this.forwardBtn.style.height = '100%';
            this.forwardBtn.style.width = '100%';

            revUtils.prepend(this.paginationDotsContainer, this.backBtnWrapper);
            revUtils.append(this.paginationDotsContainer, this.forwardBtnWrapper);
        } else {
            if (this.options.buttons.back) {
                revUtils.append(this.innerContainerElement, this.backBtnWrapper);
            }

            if (this.options.buttons.forward) {
                revUtils.append(this.innerContainerElement, this.forwardBtnWrapper);
            }

            if (this.options.buttons.position == 'outside') { // buttons outside for vertical only
                if (this.options.vertical) {
                    this.innerContainerElement.style.padding = (this.options.buttons.back ? (this.options.buttons.size + 'px') : '0') + ' 0 ' + (this.options.buttons.forward ? (this.options.buttons.size + 'px') : '0');
                } else {

                    // THIS NEEDS TO BE DYNAMIC
                    this.containerElement.style.paddingLeft = this.options.buttons.size + 'px';
                    this.containerElement.style.paddingRight = this.options.buttons.size + 'px';

                    if (this.options.buttons.style == 'fly-out') {
                        this.forwardBtnWrapper.style.width = (this.options.buttons.size * .8) + 'px';
                        this.backBtnWrapper.style.width = (this.options.buttons.size * .8) + 'px';
                    } else {
                        this.forwardBtnWrapper.style.width = this.options.buttons.size + 'px';
                        this.backBtnWrapper.style.width = this.options.buttons.size + 'px';
                    }

                    revUtils.transformCss(this.backBtnWrapper, 'translateX(-100%)');
                    revUtils.transformCss(this.forwardBtnWrapper, 'translateX(100%)');
                }
            }
        }
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

            if (this.options.header_logo) {
                var headLogo = document.createElement('img');
                revUtils.addClass(headLogo, 'rev-header-logo')
                // headLogo.style.backgroundRepeat = 'no-repeat';
                headLogo.style.float = 'left';
                // headLogo.style.backgroundSize = 'contain';
                headLogo.src = this.options.header_logo;
                // headLogo.style.backgroundImage = 'url('+ this.logoURI +')';
                // headLogo.style.backgroundImage = "url('" + this.options.header_logo + "')";

                // headLogo.style.height = this.head.offsetHeight + 'px';
                // headLogo.style.height = '28px';
                // // headLogo.style.width = this.head.offsetHeight + 'px';
                // headLogo.style.width = '184px';

                this.head.insertAdjacentElement('afterbegin', headLogo);
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
            this.sponsored.innerHTML = revDisclose.getDisclosure(this.options.disclosure_text);

            if (this.options.rev_position == 'top_right') {
                revUtils.addClass(this.sponsored, 'top-right');
                revUtils.prepend(this.head, this.sponsored);
            } else if (sponsoredFoot) {
                revUtils.addClass(this.sponsored, this.options.rev_position.replace('_', '-'));
                revUtils.append(this.foot, this.sponsored);
            }
        }
    };

    // RevSlider.prototype.getCellHeight = function(row, index, item) {
    //     var ad = item.element.children[0]; //TODO

    //     var cellHeight = item.preloaderHeight;

    //     cellHeight += ad.offsetHeight - ad.children[0].offsetHeight; // padding ad - ad-container
    //     cellHeight += ad.children[0].offsetHeight - ad.children[0].children[0].offsetHeight; // padding ad-container - ad-outer

    //     if (!item.textRight && !item.textOverlay) {
    //         cellHeight += (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) +
    //             item.headlineMarginTop +
    //             this.providerLineHeight +
    //             this.providerMarginTop;
    //     }

    //     return Math.floor(cellHeight);
    // };

    RevSlider.prototype.resize = function() {
        // while (this.grid.element.firstChild) {
        //     this.grid.element.removeChild(this.grid.element.firstChild);
        // }

        // this.grid._resetLayout();

        // this.grid.reloadItems();

        this.grid.layout();

        this.setGridClasses();

        // this.displayedItems = [];

        // this.createCells(this.grid);

        // this.setDisplayedItems();

        this.getPadding(this.grid.items);

        this.setContentPadding(this.grid.items);

        this.setUp(this.grid.items);

        this.setSize(this.grid.items);

        this.grid.layout();

        this.setUp(this.grid.items);

        this.setSize(this.grid.items);

        this.grid.layout();

        // this.updateDisplayedItems(this.grid.items);

        // this.checkEllipsis(true);

        // this.getAnimationDuration();

        // this.updatePagination(true);

        this.emitter.emitEvent('resized');
    };

    RevSlider.prototype.resizeImage = function(el, item) {
        el.style.height = item.preloaderHeight + 'px';
        el.style.width = '100%';
        // el.style.width = typeof item.preloaderWidth === false ? 'auto' : item.preloaderWidth + 'px';
    };

    RevSlider.prototype.resizeHeadline = function(el, row, index, item) {
        // console.log(this.headlineMaxHeights, item.row, item.element);
        // el.style.maxHeight = (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) + 'px';
        // el.querySelector('h3').style.margin = item.headlineMarginTop +'px ' + item.innerMargin + 'px 0';
        el.querySelector('h3').style.marginTop = item.headlineMarginTop +'px';
        el.querySelector('h3').style.fontSize = item.headlineFontSize + 'px';
        el.querySelector('h3').style.lineHeight = item.headlineLineHeight + 'px';
    };

    RevSlider.prototype.resizeAfterImage = function(item) {
        item.element.querySelector('.rev-after-image').style.marginLeft = item.innerMargin + 'px';
        item.element.querySelector('.rev-after-image').style.marginRight = item.innerMargin + 'px';
        item.element.querySelector('.rev-after-image').style.marginBottom = item.innerMargin + 'px';

        var image = item.element.querySelector('.rev-image');

        // image.style.marginLeft = item.innerMargin + 'px';
        // image.style.marginRight = item.innerMargin + 'px';

        var meta = item.element.querySelector('.rev-meta');
        if (meta) {
            meta.style.marginLeft = item.innerMargin + 'px';
            meta.style.marginRight = item.innerMargin + 'px';
        }
        // item.element.querySelector('.rev-after-image').style.marginBottom = item.innerMargin + 'px';
    };


    RevSlider.prototype.resizeHeader = function(item) {
        var header = item.element.querySelector('.rev-content-header');
        if (header) {
            header.style.marginLeft = item.innerMargin + 'px';
            header.style.marginRight = item.innerMargin + 'px';
        }
        // item.element.querySelector('.rev-after-image').style.marginBottom = item.innerMargin + 'px';
    };

    RevSlider.prototype.resizeDescription = function(el, row, index, item) {
        if (!el) {
            return;
        }
        // el.style.maxHeight = (this.headlineMaxHeights[row][item.span][index] ? this.headlineMaxHeights[row][item.span][index].maxHeight : this.headlineMaxHeights[row][item.span].maxHeight) + 'px';
        // el.querySelector('h4').style.margin = item.descriptionMarginTop +'px ' + item.innerMargin + 'px 0';
        el.querySelector('h4').style.marginTop = item.descriptionMarginTop +'px';
        el.querySelector('h4').style.fontSize = item.descriptionFontSize + 'px';
        el.querySelector('h4').style.lineHeight = item.descriptionLineHeight + 'px';
    };

    RevSlider.prototype.resizeHeadlineIcon = function(el, row, index, item) {
        if (!el) {
            return;
        }

        // console.log(item.element.querySelector('.rev-meta-inner'));
        var height = item.element.querySelector('.rev-meta-inner').offsetHeight;

        el.style.height = height + 'px';
        el.style.width = height + 'px';
    };

    RevSlider.prototype.resizeProvider = function(el, item) {
        if(this.options.hide_provider || !el) {
            return;
        }
        // console.log(this.providerMarginTop + 'px ' + item.innerMargin + 'px 0', item.innerMargin);
        el.style.marginTop = item.providerMarginTop + 'px';
        el.style.fontSize = item.providerFontSize + 'px';
        el.style.lineHeight = item.providerLineHeight + 'px';
        el.style.height = item.providerLineHeight + 'px';
        el.style.position = 'relative';
        el.style.top = '-' + (item.providerLineHeight - item.providerFontSize) / 2 + 'px';
    };

    RevSlider.prototype.resizeReactions = function(item) {
        var el = item.element.querySelector('.rev-reactions');
        if(!el) {
            return;
        }
        el.style.marginLeft = item.innerMargin + 'px';
        el.style.marginRight = item.innerMargin + 'px';

        // el.style.paddingLeft = item.innerMargin + 'px';
        // el.style.paddingRight = item.innerMargin + 'px';
    }

    RevSlider.prototype.resizeComments = function(item) {
        var el = item.element.querySelector('.rev-comments');
        if(!el) {
            return;
        }
        el.style.paddingLeft = item.innerMargin + 'px';
        el.style.paddingRight = item.innerMargin + 'px';

        // el.style.paddingLeft = item.innerMargin + 'px';
        // el.style.paddingRight = item.innerMargin + 'px';
    }

    RevSlider.prototype.resizeHeadlineBrand = function(item) {

        // if (!this.dataPromise || item.textOverlay)
        //     return;

        if (revDetect.mobile()) {
            return;
        }

        if (item.textOverlay)
            return;

        var that = this;
        // TODO: make sure headlines have text
        // this.dataPromise.then(function() {
            var rowItems = that.grid.rows[item.row].items;
            var maxHeight = 0;

            for (var i = 0; i < rowItems.length; i++) {
                var headlineBrand = rowItems[i].element.querySelector('.rev-after-image');
                headlineBrand.style.height = 'auto';
                var height = headlineBrand.offsetHeight;
                if (height > maxHeight) {
                    maxHeight = height;
                }
            }

            // if (item.type == 'internal') {
            //     console.log(item.element, maxHeight);
            // }

            for (var i = 0; i < rowItems.length; i++) {
                rowItems[i].element.querySelector('.rev-after-image').style.height = maxHeight + 'px';
            }
        // });

        // if (this.displayedItems.length && !item.textOverlay) {
        //     var rowItems = this.grid.rows[item.row].items;
        //     var maxHeight = 0;

        //     for (var i = 0; i < rowItems.length; i++) {
        //         var headlineBrand = rowItems[i].element.querySelector('.rev-headline-brand');
        //         // console.log(item, headlineBrand);
        //         headlineBrand.style.height = 'auto';
        //         var height = headlineBrand.offsetHeight;
        //         if (height > maxHeight) {
        //             maxHeight = height;
        //         }
        //     }

        //     for (var i = 0; i < rowItems.length; i++) {
        //         rowItems[i].element.querySelector('.rev-headline-brand').style.height = maxHeight + 'px';
        //     }
        // }
    }

    RevSlider.prototype.checkEllipsis = function(reset) {
        // if (this.options.max_headline && !this.options.text_right) { // text_right should be limited, but don't waste for max_headline only
        //     return;
        // }
        // reset headlines
        if (reset) {
            var ads = this.element.querySelectorAll('.rev-ad');
            for (var i = 0; i < ads.length; i++) {
                var ad = ads[i];

                if (this.displayedItems[i]) { // reset headlines for new ellipsis check
                    ad.querySelectorAll('.rev-headline h3')[0].innerHTML = this.displayedItems[i].headline;
                }
            }
        }

        revUtils.ellipsisText(this.grid.element.querySelectorAll('.rev-content .rev-headline'));
    };

    RevSlider.prototype.createNewCell = function() {
        var html = '<div class="rev-content-inner">' +
            '<div class="rev-ad">' +
                '<div class="rev-ad-container">' +
                    '<div class="rev-ad-outer">' +
                        '<a href="" target="_blank">' +
                            '<div class="rev-ad-inner">' +

                                // favicon, headline, description, provider and date

                                // '<div class="rev-meta">' +
                                //     '<div class="rev-provider"></div>' +
                                //     '<div class="rev-date">15 hrs</div>' +
                                //     // '<div class="rev-headline">' +
                                //     //     '<h3></h3>' +
                                //     // '</div>' +
                                // '</div>' +

                                '<div class="rev-before-image"></div>' +

                                '<div class="rev-image">' +
                                    // '<img src=""/>' +
                                '</div>' +

                                '<div class="rev-after-image">' +
                                    '<div class="rev-headline-brand">' +
                                        '<div class="rev-headline-brand-inner">' +
                                            // '<div class="rev-headline">' +
                                            //     '<h3></h3>' +
                                            // '</div>' +
                                            // '<div class="rev-description">' +
                                            //     '<h4></h4>' +
                                            // '</div>' +
                                        '</div>' +
                                        // '<div class="rev-provider"></div>' +
                                    '</div>' +
                                '</div>' +



                            /* '<div class="rev-feelings">' +
                                    '<div class="rev-feelings-inner">' +

                                        '<ul class="reactions-list">' +
                                        '<li class="reaction-type reaction-type-love">' + '<span class="reaction-icon love"></span>' + '<span class="reaction-label"></span>' +
                                        '<li class="reaction-type reaction-type-sad">' + '<span class="reaction-icon sad"></span>' + '<span class="reaction-label"></span>' +
                                        '<li class="reaction-type reaction-type-angry">' + '<span class="reaction-icon angry"></span>' + '<span class="reaction-label"></span>' +
                                        '</ul><div style="clear:both"></div>' +

                                    '</div>' +
                                '</div>' +



                               '<div class="rev-actions">' +
                                    '<div class="rev-actions-inner">' +

                                        '<div class="rev-action-block rev-action-like"><a class="rev-action-trigger"><span class="rev-action-icon rev-action-icon-like"></span> Love</a></div>' +
                                        //'<div class="rev-action-block rev-action-dislike"><a class="rev-action-trigger"><span class="rev-action-icon rev-action-icon-dislike"></span> Dislike</a></div>' +
                                        '<div class="rev-action-block rev-action-comment"><a class="rev-action-trigger"><span class="rev-action-icon rev-action-icon-comment"></span> Comment</a></div>' +
                                        '<div class="rev-action-block rev-action-share"><a class="rev-action-trigger"><span class="rev-action-icon rev-action-icon-share"></span> Share</a></div>' +

                                    '</div>' +
                                '</div><div style="clear:both"></div>' +*/




                                // '<div class="rev-headline-brand">' +
                                //     '<div class="rev-headline">' +
                                //         '<h3></h3>' +
                                //     '</div>' +
                                //     '<div class="rev-provider"></div>' +
                                // '</div>' +
                            '</div>' +
                        '</a>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

            var cell = document.createElement('div');
            cell.className = 'rev-content';
            cell.innerHTML = html;

            return cell;
    };

    RevSlider.prototype.getSerializedQueryParams = function() {
         if (!this.serializedQueryParams) {
            var serialized = revUtils.serialize(this.options.query_params);
            this.serializedQueryParams = serialized ? '&' + serialized : '';
         }
         return this.serializedQueryParams;
    };

    RevSlider.prototype.generateUrl = function(offset, count, empty, viewed, internal, below_article, fill) {
        var url = (this.options.host ? this.options.host + '/api/v1' : this.options.url) +
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
            // if the first internal is greater than 0 there is a ba
            var firstInternal = revUtils.siblingIndex(this.grid.element.querySelector(this.options.internal_selector));
            // don't register multiple widget impressions
            var fill = urls.length > 0;
            var sponsoredURL = this.generateUrl(0, this.sponsoredLimit, false, false, false, (firstInternal > 0), fill);
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
                if (url.type == 'internal') {
                    var resp = that.mockInternal[that.options.mock].slice(url.offset, url.limit);
                    if (!resp.length) {
                        reject();
                        return;
                    }
                    resolve({
                        type: url.type,
                        data: resp
                    });
                    return;
                }

                if (url.type == 'sponsored') {
                    var resp = that.mockSponsored[that.options.mock].slice(url.offset, url.limit);
                    if (!resp.length) {
                        reject();
                        return;
                    }
                    resolve({
                        type: url.type,
                        data: resp
                    });
                    return;
                }

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

        // var that = this;

        // this.dataPromise = new Promise(function(resolve, reject) {

        //     // prime data - empty and not viewed
        //     var url = that.generateUrl(0, that.getMaxCount(), true, false);

        //     revApi.request(url, function(resp) {

        //         if (!resp.length) {
        //             resolve(resp);
        //             that.destroy();
        //             return;
        //         }

        //         that.data = resp;

        //         revUtils.addClass(that.containerElement, 'rev-slider-has-data');

        //         that.setDisplayedItems();

        //         that.setUp(that.grid.items);

        //         that.updateDisplayedItems(that.grid.items);

        //         that.emitter.emitEvent('ready');
        //         that.ready = true;

        //         that.emitter.once('imagesLoaded', function() {
        //             revUtils.addClass(that.containerElement, 'loaded');
        //         });

        //         revUtils.imagesLoaded(that.grid.element.querySelectorAll('img'), that.emitter);

        //         resolve(resp);
        //     });
        // });

        // return this.dataPromise;
    };

    RevSlider.prototype.registerImpressions = function(viewed, offset, limit) {

        // console.log(this.viewed);

        if (!this.options.impression_tracker.length && this.options.beacons) {
            revApi.beacons.setPluginSource(this.options.api_source).attach();
        }

        // check to see if we have not already registered for the offset
        var register = [];

        if (typeof offset === 'undefined') {
            var offset = this.offset;
            // var limit = this.limit;
        } else {
            offset = offset;
        }
        if (typeof limit === 'undefined') {
            // var offset = this.offset;
            var limit = this.limit;
        } else {
            limit = limit;
        }
        // if (false) {
        //     console.log(this.grid.rows[row].perRow);
        //     console.log('hinn');
        //     var offset = this.offset;
        //     var limit = this.limit;
        // }

        for (var i = offset; i < (offset + limit); i++) {
            if (!this.options.impression_tracker[i]) {
                register.push(i);
            }
            this.options.impression_tracker[i] = true;
        }

        // do we have impressions to register
        if (register.length) {
            // compress into single call
            var offset = register[0];
            var count = (register[(register.length - 1)] + 1) - offset;
            // register impression - not empty and viewed on pagination
            var url = this.generateUrl(offset, count, false, viewed);

            revApi.request(url, function() { return; });
        }
    };

    RevSlider.prototype.registerView = function() {
        if (!this.viewed) {
            this.viewed = true;
            var count;
            if (this.options.visible_rows) {
                count = 0;
                for (var i = 0; i < this.options.visible_rows; i++) {
                    count += this.grid.rows[i].perRow;
                }
            } else {
                count = this.limit;
            }

            // register a view without impressions(empty)
            var url = this.generateUrl(0, count, true, true);

            revApi.request(url, function() { return; });

            var that = this;
            // make sure we have some data
            this.dataPromise.then(function() {
                var anchors = that.element.querySelectorAll('.rev-ad a');
                for (var i = 0; i < anchors.length; i++) {
                    anchors[i].setAttribute('href', anchors[i].getAttribute('href') + '&viewed=true');
                }
            });
        }
    };

    RevSlider.prototype.setDisplayedItems = function() {
        this.displayedItems = [];
        var dataIndex = this.offset;

        for (var i = 0; i < this.limit; i++) {
            if (!this.data[dataIndex]) { // go back to the beginning if there are more ads than data
                dataIndex = 0;
            }
            this.displayedItems.push(this.data[dataIndex]);
            dataIndex++;
        }
    };

    RevSlider.prototype.updateDisplayedItems = function(items, data) {
        // if (!this.data.length) { // if no data remove the container and call it a day
        //     this.destroy();
        //     return;
        // }

        // console.log(items, data);

        var authors = ['Scottie Pippen', 'Hakeem Olajuwon', 'John Stockton', 'Charles Barkley', 'Michael Jordan', 'Larry Bird', 'Dominique Wilkins', 'Magic Johnson', 'Karl Malone', 'Kareem Abdul Jabar']

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

                // if (this.options.image_overlay !== false) { // TODO: ad does not exist
                //     revUtils.imageOverlay(ad.querySelector('.rev-image'), itemData.content_type, this.options.image_overlay, this.options.image_overlay_position);
                // }

                // if (this.options.ad_overlay !== false) { // TODO: ad does not exist
                //     revUtils.adOverlay(ad.querySelector('.rev-ad-inner'), itemData.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
                // }

                // var reactions = item.element.querySelector('.rev-reactions');
                // if (reactions) {
                //     var js = document.createElement('script');
                //     js.type = 'text/javascript';
                //     js.src = this.options.host + '/reactions.js.php?r=199&url=' + itemData.url;
                //     js.id = 'rc-react';
                //     reactions.appendChild(js);
                // }

                var anchor = item.element.querySelector('a');
                anchor.setAttribute('href', itemData.url.replace('&uitm=1', '').replace('uitm=1', '') + (this.viewed ? '&viewed=true' : ''));
                anchor.title = itemData.headline;

                var roundedPreloaderHeight = Math.round(item.preloaderHeight);
                var roundedPreloaderWidth = Math.round(item.preloaderWidth);
                var image = itemData.image;
                // if (itemData.type == 'sponsored') {
                //     image = image.replace('h=315', 'h=' + roundedPreloaderHeight).replace('w=420', 'w=' + roundedPreloaderWidth) + '&h=' + roundedPreloaderHeight + '&w=' + roundedPreloaderWidth;
                // }

                var revImage = item.element.querySelector('.rev-image');

                if (!itemData.video_id) {
                    revImage.innerHTML = '<img src=" ' + image + ' " />';
                } else {
                    revImage.innerHTML = '<iframe id="rc_video' + itemData.video_id + '" src="http://code.revcontent.com/mock/feed4/video' + itemData.video_id + '.iframe.html" style="border: none; width: '+ roundedPreloaderWidth +'px; height: ' + roundedPreloaderHeight + 'px;""></iframe>';
                }


                // item.element.querySelector('img').setAttribute('src', image);

                var headline = item.element.querySelector('.rev-headline h3');
                headline.innerHTML = itemData.headline;

                var description = item.element.querySelector('.rev-description');
                if (description) {
                    description.children[0].innerHTML = itemData.description ? itemData.description : 'Read More';
                }

                var favicon = item.element.querySelector('.rev-headline-icon');
                if (favicon) {
                    if (item.type == 'internal' && !itemData.author) {
                        revUtils.remove(item.element.querySelector('.rev-before-image'));
                    } else {
                        // favicon.innerHTML = item.type == 'sponsored' ? '<span class="rev-headline-icon-image" style="background-repeat:no-repeat;background-image:url('+ this.logoURI +')' + '"></span>' : '<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M2121 179c1065,0 1929,864 1929,1929 0,1065 -864,1929 -1929,1929 -1065,0 -1929,-864 -1929,-1929 0,-1065 864,-1929 1929,-1929zm1059 3099c-92,-307 -377,-1047 -982,-1047 -21,0 -40,1 -59,2 -19,-1 -38,-2 -59,-2 -622,0 -906,783 -989,1072 -335,-289 -548,-718 -548,-1195 0,-872 707,-1578 1578,-1578 872,0 1578,707 1578,1578 0,464 -200,881 -519,1170zm-1053 408c4,-4 8,-8 12,-13 4,4 8,8 12,12 -8,0 -16,0 -24,0zm12 -2806c293,0 530,269 530,601 0,332 -237,601 -530,601 -293,0 -530,-269 -530,-601 0,-332 237,-601 530,-601z"/></g></svg>';

                        if (item.type == 'sponsored') {
                            favicon.innerHTML = '<span class="rev-headline-icon-image" style="background-repeat:no-repeat;background-image:url('+ itemData.favicon_url +')' + '"></span>';
                        } else {
                            var names = itemData.author.split(' ');
                            if (itemData.author_image) {
                                favicon.innerHTML = '<span class="rev-headline-icon-image" style="border-radius: 50%;background-repeat:no-repeat;background-image:url('+ itemData.author_image +')' + '"></span>';
                            } else if (itemData.author.indexOf('.com') === -1 && names[0] && names[1]) {
                                var initials = names[0].charAt(0) + names[1].charAt(0);
                                favicon.innerHTML = '<div class="rev-author-initials">'+ initials +'</div>';
                            } else {
                                favicon.innerHTML = '<span class="rev-headline-icon-image" style="background-repeat:no-repeat;background-image:url('+ itemData.favicon_url +')' + '"></span>';
                            }
                        }

                        // favicon.innerHTML = item.type == 'sponsored' ? '<span class="rev-headline-icon-image" style="background-repeat:no-repeat;background-image:url('+ this.logoURI +')' + '"></span>' : '<div class="rev-author-initials">AR</div>';

                        var date = item.element.querySelector('.rev-date');
                        if (date) {
                            if (item.type == 'sponsored') {
                                var icon = '<span class="rev-sponsored-icon"><?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg enable-background="new 0 0 128 128" id="Layer_1" version="1.1" viewBox="0 0 128 128" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M72.259,38.978c0.148,0.021,0.797-0.38,1.041-0.506s0.979,0.295,1.208,0.38s1.28-0.13,1.45-0.295   c0.17-0.166,0.192-0.507,0.049-0.759s-0.709-0.947-0.935-0.991c-0.225-0.044-0.969-0.158-1.147-0.159s-0.724,0.1-0.81,0.225   c-0.085,0.125-0.345,0.559-0.386,0.685s-0.3,0.494-0.481,0.538c-0.181,0.043-0.628,0.281-0.588,0.428S72.11,38.957,72.259,38.978z"/><path d="M74.428,41.097c-0.13,0.172-0.572,1.036-0.692,1.535c-0.12,0.499,0.012,2.559,0.237,2.423   c0.226-0.136,0.81-0.779,0.799-1.129c-0.011-0.35,0.102-1.443,0.275-1.66s0.969-1.123,1.098-1.25   c0.128-0.127-0.023-0.232-0.336-0.233C75.497,40.782,74.559,40.925,74.428,41.097z"/><path d="M87.878,4.622c-0.026,0-0.293-0.108-0.849-0.334C79.882,1.528,72.121,0,64,0C28.654,0,0,28.654,0,64   c0,35.347,28.654,64,64,64c35.346,0,64-28.653,64-64C128,37.098,111.393,14.088,87.878,4.622z M83.076,6.278   c0.146,0.16,1.074,0.425,1.412,0.481c0.339,0.057,2.473,0.523,2.654,0.659s0.362,0.448,0.401,0.692   c0.039,0.245-1.719,0.042-2.532-0.18c-0.814-0.222-3.471-1.203-3.654-1.373s0.037-0.725,0.421-0.719   C82.162,5.845,82.929,6.118,83.076,6.278z M77.201,4.695c0.193-0.01,1.237-0.052,1.559-0.055c0.32-0.002,1.179,0.073,1.333,0.073   s1.465,0.086,1.528,0.165c0.064,0.079,0.004,0.163-0.134,0.188s-0.703,0.045-0.88,0.033c-0.178-0.012-0.589-0.131-0.475-0.158   c0.115-0.027,0.259-0.108,0.168-0.122c-0.092-0.014-0.423-0.044-0.537-0.042c-0.114,0.003-0.417,0.065-0.419,0.133   c-0.002,0.067-1.258,0.024-1.524-0.052c-0.268-0.076-1.187-0.138-1.117-0.144C76.771,4.706,77.008,4.705,77.201,4.695z    M72.222,4.825c0.531-0.002,0.991-0.01,1.001-0.011c0.009-0.001,0.562-0.014,0.708-0.018c0.146-0.003,0.542-0.009,0.626-0.008   c0.083,0.001,0.098,0.01,0.033,0.018c-0.065,0.008-1.856,0.101-2.477,0.101S71.69,4.828,72.222,4.825z M65.721,5.043   c0.182-0.004,0.916-0.024,1.232-0.037c0.315-0.012,0.872-0.026,0.973-0.027c0.1-0.001,0.491-0.004,0.748-0.011   c0.171-0.005,0.604-0.02,0.914-0.032c-0.034-0.001-0.078-0.004-0.1-0.004c-0.172-0.006,0.082-0.026,0.209-0.028   c0.127-0.002,0.339,0.007,0.217,0.017c-0.041,0.003-0.169,0.009-0.326,0.016c0.234,0.01,0.706,0.035,0.883,0.04   c0.202,0.004,0.832,0.106,0.916,0.088c0.083-0.019,0.609-0.108,0.801-0.127c0.192-0.02,0.917,0.005,0.974,0.033   c0.057,0.027,0.372,0.137,0.578,0.159s1.114-0.007,1.351-0.031c0.235-0.023,0.599-0.102,0.695-0.083   c0.096,0.02,0.47,0.082,0.617,0.087c0.148,0.005,1.246,0.061,1.562,0.082s0.801,0.099,0.901,0.139   c0.101,0.04-0.015,0.235-0.073,0.294c-0.059,0.059,0.196,0.256,0.492,0.355c0.296,0.099,1.132,0.628,0.947,0.654   s-0.472,0.002-0.639-0.051c-0.167-0.054-0.896-0.332-1.132-0.409c-0.236-0.077-1.123-0.247-1.348-0.294S75.937,5.5,75.658,5.413   c-0.278-0.086-0.992-0.208-1.084-0.204s-0.244,0.053-0.135,0.103c0.108,0.049-0.14,0.166-0.258,0.19   c-0.119,0.024-1.206,0.056-2.27,0.077s-2.958-0.071-3.58-0.165c-0.623-0.093-1.512-0.348-1.658-0.352s-0.625-0.01-0.74-0.013   c-0.086-0.002-0.285-0.003-0.391-0.004c-0.052,0-0.08-0.001-0.067-0.001c0.006,0,0.031,0,0.067,0.001   C65.585,5.045,65.641,5.045,65.721,5.043z M13.156,41.313c-0.009,0.027-0.011,0.054-0.011-0.008c0-0.062,0.018-0.136,0.021-0.102   S13.165,41.286,13.156,41.313z M13.367,40.05c-0.027,0.087-0.07,0.178-0.052,0.007c0.018-0.171,0.109-0.616,0.105-0.456   S13.394,39.963,13.367,40.05z M15.071,36.306c-0.396,0.745-1.131,2.144-1.107,1.946s0.142-0.502,0.17-0.522   c0.029-0.02,0.219-0.389,0.355-0.777c0.136-0.388,0.589-1.23,0.759-1.579s0.484-0.594,0.505-0.533   C15.775,34.901,15.468,35.561,15.071,36.306z M88.323,122.139c-0.253,0.126-1.378,0.228-1.232,0.1s1.444-0.466,1.608-0.49   C88.863,121.723,88.577,122.014,88.323,122.139z M102.949,86.24c-0.022,0.335-0.105,1.195-0.184,1.911   c-0.079,0.717-0.553,4.61-0.81,6.39s-0.806,4.162-0.979,4.402s-0.881,1.237-1.128,1.693c-0.246,0.456-0.88,1.484-1.112,1.806   s-0.81,1.846-0.763,1.884s-0.157,0.857-0.562,1.738c-0.404,0.881-1.234,2.521-1.337,2.609s-0.431,0.475-0.498,0.664   s-0.479,1.25-0.82,1.624s-1.835,1.689-1.853,1.821s-0.202,0.772-0.371,1.136c-0.17,0.364-1.824,1.766-2.025,1.85   c-0.202,0.085-0.812,0.407-0.896,0.533c-0.084,0.125-0.661,0.998-0.914,1.059c-0.254,0.06-0.932,0.444-1.026,0.541   c-0.095,0.098-0.19,0.333-0.001,0.314s0.678,0,0.679,0.08s-0.518,0.426-0.688,0.515s-0.479,0.332-0.552,0.497   c-0.073,0.164-1.095,0.892-1.393,1.082c-0.297,0.19-0.394,0.485-0.234,0.51s0.27,0.323-0.104,0.607   c-0.372,0.285-1.368,0.965-1.366,1.045s0.046,0.312,0.103,0.362c0.058,0.05,0.627,0.623,0.838,0.605   c0.211-0.019,0.812,0.205,0.65,0.243c-0.163,0.038-1.248,0.45-1.665,0.487s-1.485-0.207-1.826-0.203   c-0.341,0.005-1.262-0.788-1.544-0.806c-0.281-0.018-0.203-0.342-0.322-0.345s-0.355-0.081-0.257-0.169s0.286-0.374,0.2-0.396   c-0.085-0.023-0.22-0.17-0.104-0.266c0.117-0.097,0.744-0.45,0.812-0.471s0.325-0.182,0.387-0.268   c0.062-0.086-0.275-0.129-0.427-0.122s-0.555-0.081-0.529-0.175s0.529-0.788,0.659-0.877c0.131-0.09,0.511-0.464,0.553-0.627   c0.043-0.163,0.071-0.695-0.027-0.794c-0.098-0.099,0.07-0.776,0.186-0.975c0.114-0.198,0.799-0.903,0.972-1.151   c0.173-0.247,0.595-1.095,0.558-1.3s-0.104-1.044-0.059-1.382c0.045-0.337,0.499-2.082,0.66-2.649   c0.162-0.567,0.675-2.622,0.731-3.188s-0.284-2.2-0.532-2.598c-0.249-0.398-2.226-1.274-2.798-1.459s-1.465-0.615-1.826-0.84   s-1.503-1.317-1.788-1.703c-0.284-0.387-1.137-2.075-1.619-2.468s-1.257-1.458-1.172-1.761c0.085-0.304,1.138-2.479,1.082-3.051   c-0.055-0.573-0.021-2.418,0.198-2.654s1.855-2.153,2.305-2.761s0.704-2.521,0.525-3.306c-0.179-0.783-1.999-1.797-2.097-1.523   c-0.099,0.273-0.794,0.872-1.324,0.722s-3.383-1.343-3.902-1.531c-0.519-0.188-2.025-2.018-2.433-2.546s-2.306-1.296-3.365-1.577   c-1.061-0.281-5.067-1.191-6.517-1.374c-1.45-0.184-4.75-1.017-5.586-1.34s-3.341-2.303-3.393-3.068   c-0.052-0.766-0.899-2.46-1.449-3.165s-2.869-4.339-3.547-5.377c-0.678-1.038-2.225-2.364-2.193-1.812s1.119,3.063,1.476,3.784   c0.356,0.722,1.039,2.416,1.195,2.757c0.155,0.341,0.517,0.683,0.373,0.784c-0.143,0.103-0.882,0.077-1.324-0.281   c-0.442-0.359-1.663-2.329-1.98-2.875c-0.317-0.546-1.048-1.64-1.001-2.058s0.161-1.05-0.164-1.375   c-0.325-0.325-1.022-2.582-1.155-3.212c-0.132-0.63-0.918-2.466-1.459-2.688s-2.041-1.244-2.163-1.792   c-0.122-0.547-0.302-2.742-0.45-2.902s-0.486-0.71-0.569-0.854c-0.083-0.144-0.237-1.465-0.16-2.765   c0.076-1.3,0.643-4.438,0.906-5.312s1.583-4.077,1.64-4.353s0.119-1.635,0.255-1.778c0.137-0.143,0.304-0.863,0.067-1.285   c-0.237-0.422-2.156-1.414-2.092-1.743c0.064-0.33,0.583-0.983,0.759-1.121c0.176-0.138,0.549-1.063,0.438-1.813   c-0.111-0.75-1.356-2.485-1.485-2.387c-0.129,0.099-0.501,0.689-0.539,1.093c-0.039,0.403-0.241,1.209-0.369,0.872   c-0.128-0.338,0.146-1.549,0.352-1.843s1.268-0.709,1.282-0.854s-0.073-0.582-0.225-0.654c-0.153-0.072-0.561-0.755-0.573-1.362   s-0.446-1.994-0.379-2.36c0.067-0.366,0.112-1.052-0.092-1.341s-0.887-1.22-1.433-1.558c-0.546-0.338-2.719-0.801-2.614-0.996   s0.28-0.709,0.15-0.722c-0.13-0.012-1.204,0.643-2.101,1.48c-0.896,0.837-2.993,1.763-3,1.658c-0.008-0.104-0.177-0.284-0.361-0.17   s-0.746,0.803-0.892,1.026c-0.146,0.223-0.745,1.115-1.119,1.525c-0.373,0.411-2.23,2.098-2.912,2.786   c-0.683,0.688-2.835,3.095-3.395,3.719c-0.56,0.624-1.66,1.518-1.588,1.346c0.071-0.171,0.632-1.056,1.083-1.585   c0.451-0.53,1.494-1.661,1.774-1.965c0.281-0.305,1.589-1.819,1.997-2.296c0.409-0.477,1.446-1.814,1.419-1.936   c-0.026-0.121-0.463-0.27-0.913-0.068c-0.45,0.202-1.037,0.041-0.936-0.234s0.281-1.224,0.144-1.412   c-0.137-0.188-0.397-0.74-0.291-0.827c0.106-0.087,0.437-0.438,0.495-0.588s0.004-0.334-0.034-0.358s0.257-0.649,0.739-1.336   c0.482-0.687,1.936-1.902,2.426-2.113c0.49-0.21,1.743-0.985,2.085-1.323c0.342-0.339,0.295-0.822,0.167-0.828   c-0.128-0.006-0.832,0.244-1.037,0.333c-0.206,0.089-0.63,0.036-0.688-0.233c-0.058-0.27,0.887-1.727,1.285-1.958   s1.47-0.967,1.665-1.006s0.679-0.042,0.634,0.077c-0.045,0.119-0.071,0.491-0.006,0.541c0.065,0.05,0.953-0.467,1.206-0.72   s0.351-0.583,0.281-0.607s-0.192-0.217-0.119-0.377c0.073-0.16,0.538-0.987,0.708-1.211c0.169-0.225,1.021-0.689,1.365-0.828   s2.319-0.88,2.89-1.087s1.666-0.606,1.893-0.655c0.227-0.049,1.383-0.334,2.062-0.529c0.679-0.195,1.864-0.279,2.213-0.251   c0.349,0.029,1.977,0.162,2.521,0.208c0.544,0.046,2.54,0.227,2.843,0.232c0.304,0.005,1.541,0.266,1.876,0.351   c0.336,0.086,1.155,0.105,1.501,0.024c0.346-0.082,2.393-0.632,3-0.762c0.607-0.131,2.021-0.153,2.325-0.208   c0.304-0.055,1.099-0.15,1.096-0.097c-0.003,0.053,0.354,0.276,0.8,0.369c0.446,0.093,3.109,1.056,3.81,1.269   c0.701,0.212,2.485,0.315,2.56,0.275c0.076-0.041-0.012-0.287-0.361-0.459c-0.35-0.172-0.901-0.664-0.848-0.732   c0.054-0.068,0.98-0.295,1.054-0.329c0.073-0.034,0.016-0.246-0.286-0.398c-0.303-0.152-0.681-0.564-1.306-0.661   c-0.625-0.098-2.099,0.045-2.291-0.121c-0.192-0.166,0.327-0.525,0.829-0.729s1.981-0.476,2.033-0.534   c0.052-0.059,0.439-0.142,0.716-0.153s1.482-0.009,2.065,0.027c0.582,0.036,1.65,0.238,1.543,0.363   c-0.107,0.125-0.054,0.326,0.085,0.364s1.124,0.185,1.03,0.229c-0.093,0.044-0.028,0.224,0.357,0.293s1.301-0.023,1.721-0.149   c0.421-0.126,1.692-0.426,1.938-0.438c0.246-0.012,0.924,0.136,1.051,0.198c0.127,0.062-0.125,0.524-0.322,0.882   C72.079,7.562,71.776,8.845,72,9.07c0.225,0.225,0.771,0.86,0.581,0.85s-0.74,0.048-0.794,0.145   c-0.055,0.098-0.593,0.306-1.068,0.239c-0.477-0.067-1.899-0.17-2.091-0.028c-0.191,0.141,0.424,0.67,1.164,0.985   c0.74,0.314,3.101,0.549,3.327,0.431c0.228-0.118,0.559-0.49,0.613-0.59c0.054-0.1,0.571-0.512,1.017-0.735   c0.445-0.224,1.097-0.817,1.058-1.012s-0.494-1.091-0.41-1.149c0.085-0.058,0.174-0.473,0.012-0.797   c-0.162-0.325,0.769-1.04,0.939-1.029s0.703,0.081,0.806,0.128c0.103,0.047,0.481,0.166,0.585,0.192   c0.104,0.026,0.904,0.18,1.623,0.327c0.718,0.147,2.086,0.46,2.01,0.569c-0.075,0.108-0.535,0.292-0.721,0.316   s-1.155,0.041-1.41,0.088c-0.254,0.047-0.376,0.955-0.232,1.364c0.144,0.408,0.279,1.168,0.16,1.234   c-0.118,0.066-0.397,0.339-0.348,0.453s0.858,0.466,1.11,0.557s0.705,0.399,0.82,0.567c0.115,0.168,0.304,1.017,0.528,1.071   c0.224,0.054,0.818-0.31,0.959-0.453c0.142-0.143,0.441-0.51,0.508-0.598c0.065-0.087,0.249-0.309,0.297-0.37   c0.047-0.062-0.132-0.412-0.49-0.611c-0.357-0.2-1.418-0.482-1.451-0.585c-0.034-0.104-0.049-0.392,0.043-0.417   s0.197-0.233,0.035-0.407c-0.161-0.174-0.367-0.467-0.406-0.529c-0.04-0.062,0.039-0.421,0.389-0.618   c0.349-0.196,1.245-0.544,1.648-0.619c0.404-0.075,1.786,0.248,1.819,0.313s0.542,0.286,1.06,0.341s2.197,0.799,2.634,1.128   c0.437,0.33,1.465,1.998,1.733,2.19c0.27,0.192,1.131,0.701,1.14,0.885s0.705,0.779,0.812,0.794   c0.107,0.015,0.597,0.359,0.855,0.729s0.67,1.717,0.582,1.751c-0.087,0.034-0.143,0.399,0.078,0.732   c0.22,0.333,0.849,0.717,0.898,0.964c0.049,0.247,0.802,1.397,0.903,1.443s0.227,0.438,0.056,0.765   c-0.171,0.327-0.579,0.982-0.686,0.964c-0.105-0.018-0.65-0.727-0.804-0.943s-0.487-0.451-0.622-0.474s-0.216,0.38,0.122,0.947   c0.338,0.566,0.828,1.716,0.771,2.068c-0.057,0.353-1.132,0.663-1.18,0.706c-0.048,0.042-0.35,0.004-0.566-0.181   s-1.167-1.278-1.446-1.586s-1.194-1.041-1.584-1.38c-0.39-0.338-1.092-1.025-1.428-0.878s-1.432-0.83-1.46-0.975   c-0.028-0.145,0.013-0.542,0.155-0.567c0.144-0.025,1.095,0.134,1.252,0.277c0.157,0.144,0.682,0.306,0.823,0.035   c0.142-0.271,0.467-0.795,0.637-0.955s0.603-0.794,0.595-1.075c-0.008-0.281-0.928-1.371-1.272-1.69s-1.215-1.172-1.204-1.234   c0.01-0.063-0.12-0.228-0.315-0.23c-0.195-0.003-0.944-0.325-1.024-0.385c-0.081-0.06-0.405-0.256-0.545-0.305   s-0.54-0.035-0.627-0.009c-0.086,0.026-0.086,0.279-0.031,0.463s0.103,0.723-0.014,0.768c-0.115,0.045-0.359,0.587-0.281,1.099   c0.079,0.511-0.583,0.983-1.062,0.902c-0.479-0.081-1.723-0.138-1.789,0.014c-0.065,0.153,0.604,0.859,0.832,1.062   c0.228,0.203,0.829,0.816,1.287,1.113c0.459,0.297,1.041,0.747,0.951,0.816s-0.264,0.309-0.182,0.38   c0.083,0.072,0.087,0.224-0.174,0.179s-1.569-0.605-1.941-0.716c-0.372-0.111-1.118,0.269-1.27,0.25   c-0.152-0.019-0.506-0.417-0.445-0.843s0.833-1.616,0.779-1.703c-0.055-0.088-0.512-0.255-0.896-0.181   c-0.384,0.074-1.882,0.902-2.283,1.154s-1.045,0.653-1.103,0.794c-0.059,0.141-0.754,0.779-1.418,1.098s-2.024,1.606-2.189,2.052   c-0.164,0.446-0.524,1.86-0.419,2.103c0.105,0.243,0.396,1.034,0.41,1.209c0.014,0.174,0.447,0.785,0.931,0.963   c0.482,0.178,2.186,1.227,2.989,1.813c0.804,0.586,2.957,2.396,3.042,2.66c0.086,0.264,0.392,2.4,0.529,2.872   s1.148,0.801,1.338,0.669c0.19-0.133,0.42-1.645,0.438-2.102c0.019-0.456,0.431-1.434,0.95-1.836   c0.519-0.402,1.894-1.798,1.866-2.183c-0.027-0.384-1.216-1.496-1.238-1.667s0.152-0.776,0.435-0.966s0.695-0.985,0.633-1.523   c-0.062-0.538-0.039-2.047,0.094-2.138c0.132-0.09,1.283,0.271,1.668,0.432s1.529,0.859,1.771,1.248s0.796,0.877,0.921,0.877   s0.57,0.133,0.719,0.293c0.147,0.16,0.372,1.087,0.175,1.7c-0.197,0.614,0.662,1.702,1.128,1.805   c0.465,0.103,1.316-1.061,1.336-1.376c0.019-0.316,0.39-0.117,0.567,0.358c0.178,0.475,1,3.531,1.325,4.427   c0.326,0.896,1.644,2.559,1.676,2.933s0.667,2.401,0.758,3.216c0.09,0.815,0.452,2.548,0.602,2.703   c0.149,0.155,0.779,0.823,0.834,1.257s0.071,1.673-0.078,1.781c-0.148,0.107-0.267,0.496-0.296,0.38s-0.213-0.47-0.338-0.527   s-0.636-0.042-0.62-0.146c0.017-0.104-0.056-0.542-0.195-0.745s-0.85-0.535-1.07-0.607s-0.444-0.76-0.12-1.276   c0.324-0.517,1.094-1.956,1.087-2.027c-0.006-0.071-0.051-0.324-0.081-0.403s-0.508-0.125-0.988,0.077   c-0.48,0.201-2.045,0.735-2.247,0.646c-0.202-0.089-1.578-0.767-1.977-0.885s-0.724,0.582-0.498,0.75   c0.227,0.168,0.975,0.63,1.079,0.761c0.104,0.131,0.282,0.554,0.165,0.646c-0.116,0.093-0.287,0.489-0.116,0.669   c0.171,0.179,1.005,0.843,1.274,1.042c0.27,0.199,1.104,1.045,1.188,1.419c0.082,0.374-0.379,0.853-0.783,0.939   c-0.403,0.086-1.746,0.544-2.006,0.793s-0.996,0.052-1.33-0.223c-0.333-0.275-2.114-0.449-2.357-0.253   c-0.244,0.195-0.771,1.308-0.884,1.665s-0.533,1.24-0.801,1.229s-1.279,0.232-1.642,0.561s-1.445,2.167-1.733,2.751   s-0.98,2.459-1.011,2.991c-0.029,0.531-0.853,1.796-1.469,2.215c-0.615,0.418-2.251,1.567-2.669,1.912s-1.59,1.945-1.813,2.402   c-0.225,0.457,0.597,2.588,1.416,4.146c0,0,0,0,0,1.331c0,0.337,0,0.337,0,0.337c-0.068,0.3-0.208,0.617-0.309,0.705   s-0.896-0.224-1.17-0.526c-0.272-0.303-1.186-1.584-1.416-2.171c-0.23-0.586-1.058-2.198-1.314-2.275   c-0.258-0.077-0.98-0.395-1.193-0.522s-1.667-0.516-2.598-0.277c-0.932,0.239-2.504,1.727-3.501,1.646s-3.406,0.107-4.268,0.351   c-0.862,0.243-3.037,3.576-3.735,5.662c0,0-0.346,1.032-0.346,2.229c0,0.509,0,0.509,0,0.509c0,0.566,0.141,1.318,0.312,1.671   s0.705,1.447,0.964,1.723s2.382,0.783,3.081,0.83s2.497-0.503,2.691-0.7c0.194-0.198,0.885-1.546,1.093-1.923   s1.006-0.855,1.235-0.918c0.229-0.062,0.969-0.29,1.211-0.366c0.242-0.075,1.15-0.167,1.173,0.062s-0.413,2.034-0.536,2.531   c-0.124,0.496-1.245,1.94-1.418,2.508c-0.172,0.567,1.618,1.366,2.283,1.309s2.511-0.152,2.649-0.074   c0.139,0.079,0.378,0.947,0.224,1.754c-0.155,0.806-0.174,2.649-0.021,3.103c0.151,0.453,2.018,0.96,2.745,0.699   s2.476-0.356,2.907-0.282c0.432,0.075,1.864-0.559,2.795-1.356c0.932-0.798,2.71-2.553,3.176-2.444   c0.466,0.109,2.832,0.324,2.9,0.481s0.612,0.506,1.057,0.429c0.445-0.077,1.982-0.416,2.482-0.574   c0.501-0.159,1.537-0.552,1.577-0.721c0.04-0.17,0.25-0.542,0.38-0.449c0.13,0.094,0.145,0.81,0.127,1.034   c-0.019,0.225,0.399,1.075,0.81,1.562s1.493,1.227,1.806,1.304c0.312,0.076,1.554-0.01,1.862,0.125s1.281,1.809,1.278,2.123   c-0.004,0.314,0.416,1.177,0.941,1.222c0.526,0.045,1.271,0.421,1.383,0.366c0.111-0.054,0.6-0.566,0.719-0.701   c0.12-0.136,0.366-0.107,0.459-0.035C102.896,84.694,102.973,85.905,102.949,86.24z M93.49,73.909   c-0.011,0.329-0.119,0.448-0.241,0.264s-0.337-0.845-0.201-1.053C93.184,72.913,93.501,73.579,93.49,73.909z M90.076,72.218   c-0.396,0.138-1.197,0.202-0.857-0.162c0.341-0.364,1.287-0.409,1.391-0.295S90.474,72.08,90.076,72.218z M79.55,71.355   c-0.219-0.07-1.31-0.951-1.644-1.22c-0.333-0.269-1.74-0.679-2.52-0.757s-2.627,0.117-2.012-0.345   c0.615-0.463,3.881-0.825,4.42-0.593s2.432,0.997,3.039,1.192s2.167,1.056,2.164,1.234s-0.457,0.368-1.01,0.422   C81.435,71.344,79.769,71.426,79.55,71.355z M80.527,73.434c-0.058,0.163-0.652,0.568-0.842,0.655   c-0.189,0.086-0.571,0.033-0.656-0.138c-0.086-0.171,0.621-0.715,0.971-0.75C80.349,73.166,80.586,73.271,80.527,73.434z    M79.275,63.851c0.482-0.031,0.963-0.062,1.438-0.093C79.919,64.142,79.434,64.174,79.275,63.851z M79.75,66.8   c-0.002,0.408-0.074,0.488-0.161,0.177s-0.244-1.216-0.155-1.312C79.522,65.568,79.752,66.391,79.75,66.8z M81.453,65.728   c0.407,0.265,1.005,1.452,1.045,1.766c0.039,0.312-0.204,0.147-0.541-0.366C81.619,66.613,81.045,65.463,81.453,65.728z    M82.911,72.054c0.352-0.503,4.476-0.939,4.69-0.51c0.215,0.431-0.255,0.893-1.043,1.027c-0.788,0.134-2.051,0.6-2.629,0.62   S82.56,72.558,82.911,72.054z M103.025,83.868c-0.006,0.087-0.034-0.007-0.047-0.07c-0.012-0.062-0.016-0.183-0.009-0.268   s0.052-0.15,0.059-0.09C103.035,83.502,103.03,83.781,103.025,83.868z"/><path d="M77.699,41.569c0.05,0.171,0.26,0.798,0.357,1.013c0.097,0.214,0.488,0.644,0.656,0.473s0.596-0.79,0.587-1.002   c-0.009-0.213,0.301-0.989,0.425-1.071c0.125-0.082,0.084-0.221-0.092-0.309c-0.175-0.088-0.819-0.356-1.039-0.402   c-0.221-0.046-0.871-0.133-0.957-0.092c-0.086,0.042-0.27,0.291-0.217,0.46C77.472,40.809,77.648,41.398,77.699,41.569z"/><path d="M57.341,12.109c-0.083-0.006-0.461-0.144-0.664-0.219c-0.204-0.075-0.8-0.296-0.88-0.333s-0.424-0.086-0.588-0.027   c-0.164,0.058-0.533,0.245-0.454,0.282s0.318,0.246,0.354,0.379c0.036,0.133,0.267,0.481,0.431,0.467   c0.165-0.014,1.251-0.104,1.499-0.123c0.247-0.019,0.483-0.085,0.524-0.146C57.604,12.327,57.423,12.115,57.341,12.109z"/></g></svg></span>';
                            }
                            // date.innerHTML = itemData.date ? this.timeAgo(itemData.date) : item.type == 'sponsored' ? 'Sponsored  ·  · ' + icon : '&nbsp;';
                            date.innerHTML = itemData.date ? this.timeAgo(itemData.date) : item.type == 'sponsored' ? 'Sponsored' : '&nbsp;';
                        }
                    }
                }
                // if (favicon && itemData.favicon_url) {
                //     favicon.style.backgroundImage = 'url("' + itemData.favicon_url + '")';

                //     var date = item.element.querySelector('.rev-date');
                //     if (date && itemData.date) {
                //         date.innerHTML = this.timeAgo(itemData.date);
                //     }
                // } else { // no meta
                //     revUtils.remove(item.element.querySelector('.rev-meta'))
                // }

                var provider = item.element.querySelector('.rev-provider');
                if (provider) {
                    if (item.type == 'sponsored') {
                        provider.innerHTML = itemData.brand ? itemData.brand : this.extractRootDomain(itemData.target_url);
                    } else if (item.type == 'internal') {
                        provider.innerHTML = itemData.author ? itemData.author : authors[Math.floor(Math.random() * authors.length)];
                    }
                    // console.log(item.type);
                    // provider.innerHTML = itemData.brand ? itemData.brand : this.extractRootDomain(itemData.target_url);
                }

                var reactions = item.element.querySelector('.rev-reactions');
                if (reactions) {

                    var texts = [
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
                    ]

                    var random = function(max, min) {
                        min = min ? min : 1;
                        return Math.floor(Math.random()*(max-min+1)+min);
                    }

                    var comments = document.createElement('div');
                    revUtils.addClass(comments, 'rev-comments');

                    if (item.type === 'internal') {
                        revUtils.addClass(comments, 'rev-has-comments');
                    }

                    // comments.innerHTML = '<div class="rev-comment">' +
                    //         '<div class="rev-comment-image">' +
                    //             '<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M2121 179c1065,0 1929,864 1929,1929 0,1065 -864,1929 -1929,1929 -1065,0 -1929,-864 -1929,-1929 0,-1065 864,-1929 1929,-1929zm1059 3099c-92,-307 -377,-1047 -982,-1047 -21,0 -40,1 -59,2 -19,-1 -38,-2 -59,-2 -622,0 -906,783 -989,1072 -335,-289 -548,-718 -548,-1195 0,-872 707,-1578 1578,-1578 872,0 1578,707 1578,1578 0,464 -200,881 -519,1170zm-1053 408c4,-4 8,-8 12,-13 4,4 8,8 12,12 -8,0 -16,0 -24,0zm12 -2806c293,0 530,269 530,601 0,332 -237,601 -530,601 -293,0 -530,-269 -530,-601 0,-332 237,-601 530,-601z"/></g></svg>' +
                    //         '</div>' +
                    //         '<div class="rev-comment-text">' +
                    //         '<span class="rev-comment-author">' + authors[Math.floor(Math.random() * authors.length)] + '</span>' +
                    //         ' · <span class="rev-comment-date">' + this.timeAgo(new Date(Date.now() - (random(120) * 60000)), true) + '</span>  ' + texts[Math.floor(Math.random() * texts.length)]
                    //         '</div>' +
                    //     '</div>' +
                    // '</div>';

                    var reactionHtml = '<div class="rev-reactions-total"><div class="rev-reactions-total-inner">';

                    var reactionCount = random(5);
                    var start = random(3);
                    start--;
                    var zIndex = 100;
                    for (var reactionId = 0; reactionId < reactionCount; reactionId++) {
                        if (this.options.reactions[start]) {
                            reactionHtml += '<div style="z-index:'+ zIndex +';" class="rev-reaction rev-reaction-' + this.options.reactions[start] + '">' +
                                    '<div class="rev-reaction-inner">' +
                                        '<div class="rev-reaction-icon rev-reaction-icon-' + this.options.reactions[start] + '"></div>' +
                                    '</div>' +
                                '</div>';
                        }
                        zIndex--;
                        start++;
                    }

                    reactionHtml += '<div class="rev-reaction-count">'+ random(168, reactionCount) +'</div>';

                    // for (var reactionId = 0; reactionId < reactions.length; reactionId++) {
                    //     if (reactions[reactionId]) {
                    //         reactionHtml += '<div class="rev-reaction rev-reaction-' + reactions[reactionId] + '"></div>';
                    //     }
                    //     start++;
                    // }

                    reactionHtml += '</div></div>';

                    var commentHtml = ''

                    // var commentCount = random(3);
                    var commentCount = 1;
                    for (var commentId = 0; commentId < commentCount; commentId++) {

                        var randomComment = this.mockComments[this.options.mock][Math.floor(Math.random() * this.mockComments[this.options.mock].length)];

                        // var author = authors[Math.floor(Math.random() * authors.length)];
                        // var authorNames = author.split(' ');
                        // var authorImageString = author.split(' ')[authorNames.length - 1].toLowerCase();
                        // var authorImage = '/app/resources/img/' + authorImageString + '.png';

                        commentHtml += '<div class="rev-comment">' +
                                '<div class="rev-comment-image" style="background-image:url('+ randomComment.icon +')">' +
                                    // '<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC "-//W3C//DTD SVG 1.1//EN"  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" version="1.1" viewBox="0 0 4335 4335" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css"> <![CDATA[.fil0 {fill:black} ]]> </style></defs><g id="Layer_x0020_1"><path class="fil0" d="M2121 179c1065,0 1929,864 1929,1929 0,1065 -864,1929 -1929,1929 -1065,0 -1929,-864 -1929,-1929 0,-1065 864,-1929 1929,-1929zm1059 3099c-92,-307 -377,-1047 -982,-1047 -21,0 -40,1 -59,2 -19,-1 -38,-2 -59,-2 -622,0 -906,783 -989,1072 -335,-289 -548,-718 -548,-1195 0,-872 707,-1578 1578,-1578 872,0 1578,707 1578,1578 0,464 -200,881 -519,1170zm-1053 408c4,-4 8,-8 12,-13 4,4 8,8 12,12 -8,0 -16,0 -24,0zm12 -2806c293,0 530,269 530,601 0,332 -237,601 -530,601 -293,0 -530,-269 -530,-601 0,-332 237,-601 530,-601z"/></g></svg>' +
                                '</div>' +
                                '<div class="rev-comment-text">' +
                                    '<span class="rev-comment-author">' + randomComment.name + '</span>' +
                                    ' · ' +
                                    '<span class="rev-comment-date">' + this.timeAgo(new Date(Date.now() - (random(120) * 60000)), true) + '</span>  ' + randomComment.comment +
                                '</div>' +
                            '</div>' +
                            '</div>';
                    }
                    // console.log(item.type);
                    comments.innerHTML = reactionHtml + (item.type == 'internal' ? commentHtml : '');
                    item.element.querySelector('.rev-content-inner').appendChild(comments);
                }

                // make sure the text-decoration is the same as the headline
                anchor.style.color = revUtils.getComputedStyle(headline, 'color');

                this.setSize([item]);
            }
        }

        // if (this.options.register_impressions) {
        //     this.registerImpressions(viewed);
        // }

        // console.log('remove', this.removeItems); // HERE. REMOVE THESE and HALT THIS THING


        // this.grid.reloadItems();
        this.grid.layout(3);

        // console.log(this.removeItems);

        if (this.removeItems.length) {

            this.emitter.emitEvent('removedItems', [this.removeItems]);

            // for (var i = 0; i < this.removeItems.length; i++) {
            //     var item = this.removeItems[i];
            //     item.remove();
            //     var index = this.grid.items.indexOf(item);
            //     if ( index != -1 ) {
            //        this.grid.items.splice(index, 1);
            //     } else {
            //         console.log('dafuqqq');
            //     }
            // }
        }
        // this.checkEllipsis();
        // this.updatePagination();
        // this.fitHeight();

        // return;

        // this.oldOffset = this.offset;

        // this.offset = ((this.page - 1) * this.limit);

        // this.setDisplayedItems();

        // for (var i = 0; i < items.length; i++) {
        //     var item = items[i];

        //     if (!revUtils.hasClass(item.element, 'rev-content')) {
        //         continue;
        //     }

        //     var data = this.displayedItems[item.index];

        //     if (this.options.image_overlay !== false) { // TODO: ad does not exist
        //         revUtils.imageOverlay(ad.querySelector('.rev-image'), data.content_type, this.options.image_overlay, this.options.image_overlay_position);
        //     }

        //     if (this.options.ad_overlay !== false) { // TODO: ad does not exist
        //         revUtils.adOverlay(ad.querySelector('.rev-ad-inner'), data.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
        //     }

        //     var anchor = item.element.querySelector('a');
        //     anchor.setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', '') + (this.viewed ? '&viewed=true' : ''));
        //     anchor.title = data.headline;

        //     var roundedPreloaderHeight = Math.round(item.preloaderHeight);
        //     var roundedPreloaderWidth = Math.round(item.preloaderWidth);
        //     var image = data.image.replace('h=315', 'h=' + roundedPreloaderHeight).replace('w=420', 'w=' + roundedPreloaderWidth) + '&h=' + roundedPreloaderHeight + '&w=' + roundedPreloaderWidth;
        //     item.element.querySelector('img').setAttribute('src', image);

        //     var headline = item.element.querySelector('.rev-headline h3');
        //     headline.innerHTML = data.headline;

        //     item.element.querySelector('.rev-provider').innerHTML = data.brand;

        //     // make sure the text-decoration is the same as the headline
        //     anchor.style.color = revUtils.getComputedStyle(headline, 'color');

        //     this.setSize([item]);
        // }

        // this.setUp(4);

        // var ads = this.grid.element.querySelectorAll('.rev-content');
        // for (var i = 0; i < this.displayedItems.length; i++) {
        //     var item = this.grid.items[i],
        //         data = this.displayedItems[i];

        //     // ad.style.height = this.getCellHeight(ad) + 'px';

        //     if (this.options.image_overlay !== false) { // TODO: ad does not exist
        //         revUtils.imageOverlay(ad.querySelector('.rev-image'), data.content_type, this.options.image_overlay, this.options.image_overlay_position);
        //     }

        //     if (this.options.ad_overlay !== false) { // TODO: ad does not exist
        //         revUtils.adOverlay(ad.querySelector('.rev-ad-inner'), data.content_type, this.options.ad_overlay, this.options.ad_overlay_position);
        //     }

        //     var anchor = item.element.querySelector('a');
        //     anchor.setAttribute('href', data.url.replace('&uitm=1', '').replace('uitm=1', '') + (this.viewed ? '&viewed=true' : ''));
        //     anchor.title = data.headline;

        //     var roundedPreloaderHeight = Math.round(item.preloaderHeight);
        //     var roundedPreloaderWidth = Math.round(item.preloaderWidth);
        //     var image = data.image.replace('h=315', 'h=' + roundedPreloaderHeight).replace('w=420', 'w=' + roundedPreloaderWidth) + '&h=' + roundedPreloaderHeight + '&w=' + roundedPreloaderWidth;
        //     item.element.querySelector('img').setAttribute('src', image);

        //     var headline = item.element.querySelector('.rev-headline h3');
        //     headline.innerHTML = data.headline;

        //     item.element.querySelector('.rev-provider').innerHTML = data.brand;

        //     // make sure the text-decoration is the same as the headline
        //     anchor.style.color = revUtils.getComputedStyle(headline, 'color');

        //     this.setSize([item]);
        // }

        // if (this.options.register_impressions) {
        //     this.registerImpressions(viewed);
        // }

        // // this.grid.reloadItems();
        // this.grid.layout(3);
        // this.checkEllipsis();
        // this.updatePagination();
        // this.fitHeight();
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
    }

    RevSlider.prototype.timeAgo = function(time, output) {
        var templates = {
            prefix: "",
            suffix: "",
            seconds: "less than a minute",
            minute: "about a minute",
            minutes: "%d minutes",
            hour: "1 hr",
            hours: "%d hrs",
            day: "a day",
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
            time = new Date(time * 1000 || time);
        }

        // if (true) {
        //     console.log(time.toString());
        // }

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

    RevSlider.prototype.fitHeight = function() {
        return;
        if (!this.options.fit_height) {
            return;
        }
        var i = 0;
        while (this.containerElement.offsetHeight > this.element.offsetHeight && this.grid.items.length && i < 100) {
            this.grid.remove(this.grid.items[this.grid.items.length - 1].element);
            this.grid.layout();
            this.limit--;
            i++
        }

        // if (this.grid.rows[this.grid.nextRow] && this.grid.rows[this.grid.nextRow].count < this.grid.rows[this.grid.nextRow].perRow) {
        //     var count = this.grid.rows[this.grid.nextRow].count;
        //     for (var i = 0; i < count; i++) {
        //         this.grid.remove(this.grid.items[this.grid.items.length - 1].element);
        //         this.grid.layout();
        //         this.limit--;
        //     }
        // }

        this.setGridClasses();
    };

    RevSlider.prototype.getMaxCount = function() {
        // if pagination is disabled multiply maxLimit by 1 page otherwise by configed pages
        return (this.options.disable_pagination || this.options.row_pages ? 1 : this.options.pages) * this.limit;
    };

    RevSlider.prototype.maxPages = function() {
        if (this.options.row_pages) {
            return this.grid.rowCount;
        }
        var maxPages = Math.ceil(this.data.length / this.limit);
        if (maxPages > this.options.pages) {
            maxPages = this.options.pages;
        }
        return maxPages;
    };

    RevSlider.prototype.attachButtonEvents = function() {
        var that = this;

        if (revDetect.mobile()) { // if mobile detect tap TODO: see if hammer can accept multiple elements somehow(array does not work :( )
            var mcForwardBtn = new Hammer(this.forwardBtn);
            mcForwardBtn.add(new Hammer.Tap());

            mcForwardBtn.on('tap', function(e) {
                that.showNextPage(true);
            });

            var mcBackBtn = new Hammer(this.backBtn);
            mcBackBtn.add(new Hammer.Tap());

            mcBackBtn.on('tap', function(e) {
                that.showPreviousPage(true);
            });
        } else {
            // dual button mouse move position
            if (this.options.buttons.position == 'dual') {
                this.element.addEventListener('mousemove', function(e) {
                    // get left or right cursor position
                    if ((e.clientX - that.element.getBoundingClientRect().left) > (that.element.offsetWidth / 2)) {
                        revUtils.addClass(that.btnContainer, 'rev-btn-dual-right');
                    } else {
                        revUtils.removeClass(that.btnContainer, 'rev-btn-dual-right');
                    }
                });
            }

            // button events
            revUtils.addEventListener(this.forwardBtn, 'click', function() {
                that.showNextPage(true);
            });

            revUtils.addEventListener(this.backBtn, 'click', function() {
                that.showPreviousPage(true);
            });

            revUtils.addEventListener(that.element, 'mouseenter', function() {
                revUtils.removeClass(that.containerElement, 'off');
                revUtils.addClass(that.containerElement, 'on');
                if (that.options.buttons.style == 'fly-out') {
                    that.forwardBtnWrapper.style.width = that.options.buttons.size + 'px';
                    that.backBtnWrapper.style.width = that.options.buttons.size + 'px';
                }
            });
            revUtils.addEventListener(that.element, 'mouseleave', function() {
                revUtils.removeClass(that.containerElement, 'on');
                revUtils.addClass(that.containerElement, 'off');
                if (that.options.buttons.style == 'fly-out') {
                    that.forwardBtnWrapper.style.width = (that.options.buttons.size * .8) + 'px';
                    that.backBtnWrapper.style.width = (that.options.buttons.size * .8) + 'px';
                }
            });
        }
    };

    RevSlider.prototype.initTouch = function() {
        this.moving = 'forward'; // always start off moving forward no matter the direction

        this.preventDefault(); // prevent default touch/click events



        this.mc = new Hammer(this.element, {
            recognizers: [
                [
                    Hammer.Pan,
                    {
                        threshold: 2
                    }
                ]
            ]
        });

        // this.mc = new Hammer(this.element);
        // this.mc.add(new Hammer.Swipe({ threshold: 5, velocity: 0, direction: this.options.touch_direction }));
        // this.mc.add(new Hammer.Pan({ threshold: 2, direction: this.options.touch_direction })).recognizeWith(this.mc.get('swipe'));

        this.movement = 0;
        this.currentX = 0;
        this.lastTranslateX = 0;
        this.made = false;
        this.panDirection = false;
        this.updown = false;
    };

    RevSlider.prototype.attachTouchEvents = function() {
        var that = this;

        // revUtils.addEventListener(this.element, 'click', function(e) {
        //     if (that.made || that.movement) {
        //         e.stopPropagation();
        //         e.preventDefault();
        //     }
        // }, {passive: false});

        // this.mc.on('pan swipe', function(e) {
        //     // prevent default on pan by default, or atleast if the thing is moving
        //     // Lock needs to pass false for example so the user can scroll the page
        //     if (that.options.prevent_default_pan || that.made || that.transitioning || that.movement) {
        //         e.preventDefault(); // don't go scrolling the page or any other funny business
        //     }
        // });

        // this.mc.on('swipeleft', function(ev) {
        //     return;
        //     if (that.made || that.transitioning || !that.movement || that.panDirection == 'right') {
        //         return;
        //     }
        //     that.made = true;
        //     revUtils.transitionDurationCss(that.gridContainerElement, (that.animationDuration / 1.5) + 's');
        //     revUtils.transformCss(that.gridContainerElement, 'translate3d(-'+ (that.innerElement.offsetWidth + (that.padding.left * 2)) +'px, 0, 0)');
        //     setTimeout(function() {
        //         that.updateGrids();
        //         that.made = false;
        //         that.panDirection = false;
        //     }, (that.animationDuration / 1.5) * 1000);
        //     that.movement = 0;
        // });

        // this.mc.on('swiperight', function(e) {
        //     if (that.made || that.transitioning || !that.movement || that.panDirection == 'left') {
        //         return;
        //     }
        //     that.made = true;
        //     revUtils.transitionDurationCss(that.gridContainerElement, (that.animationDuration / 1.5) + 's');
        //     revUtils.transformCss(that.gridContainerElement, 'translate3d(0, 0, 0)');
        //     setTimeout(function() {
        //         that.updateGrids();
        //         that.made = false;
        //         that.panDirection = false;
        //     }, (that.animationDuration / 1.5) * 1000);
        //     that.movement = 0;
        // });

        this.mc.on('panstart', function(e) {

            that.panStartTimeStamp = e.timeStamp;

            // eventEmitter.trigger('dragstart', {
            //     target: targetElement
            // });

            that.currentX = 0;
            // currentY = 0;

            that.isDraging = true;
            // var that = this;

            revUtils.transitionDurationCss(that.gridTransitionElement, '0s');
            revUtils.transitionDurationCss(that.nextGridTransitionElement, '0s');

            that.nextGridTransitionElement.style.zIndex = 1000; // TODO

            (function animation () {
                if (that.isDraging) {
                    that.doMove();

                    requestAnimationFrame(animation);
                }
            })();
        });

        this.mc.on('panleft', function(e) {
            that.showNextPage();
            that.pann(e);
            // console.log('pan', e.deltaX);
            // if (that.made || that.transitioning || that.panDirection == 'right') {
            //     return;
            // }
            // that.pan('left', e.deltaX);
        });

        this.mc.on('panright', function(e) {
            that.showPreviousPage();
            that.pann(e);
            // if (that.made || that.transitioning || that.panDirection == 'left') {
            //     return;
            // }
            // that.pan('right', e.distance / 10);
        });

        this.mc.on('panup pandown', function(e) {
            that.updown = true;
        });

        this.mc.on('panend', function(e) {
            // console.log('checkk', e.distance / (e.timeStamp - that.panStartTimeStamp));

            // console.log('check', e.distance / (e.timeStamp - that.panStartTimeStamp));

            // console.log('check', e, e.velocityX, e.distance, e.timeStamp - that.panStartTimeStamp);
            that.isDraging = false;
            that.finish(e.distance / (e.timeStamp - that.panStartTimeStamp), e.deltaX, Math.abs(e.velocityX), that.nextGridTransitionElement.offsetWidth, 0);
            that.currentX = 0;

            // console.log('panend', Math.abs(e.velocityX), Math.abs(e.velocityX) > .2);

            // console.log('check', e);
            // if (Math.abs(e.velocityX) > .2) {
            //     console.log('panend', 'oh yeah');
            // }
            // if (that.made || that.transitioning || (that.updown && !that.movement)) {
            //     return;
            // }
            // that.resetShowPage();
        });
    };

    RevSlider.prototype.pann = function(e) {
        this.currentX = e.deltaX;
        this.scale = Math.max((1 - (Math.abs(e.deltaX) / 1000)), .8);
        // this.currentDirection = e.direction;
    };

    RevSlider.prototype.doMove = function(direction, movement, reset) {
        // let r,
        //     x,
        //     y;

        if (this.currentX === this.lastX) {
            return;
        }

        this.lastX = this.currentX;

        // var x = this.lastTranslateX + this.currentX;
        // y = lastTranslate.y + currentY;
        // r = config.rotation(x, y, targetElement, config.maxRotation);

        // var scale = Math.max((1 - (Math.abs(this.currentX) / 1000)), .8);
        // revUtils.transformCss(this.gridTransitionElement, 'scale(' + this.scale + ')');

        console.log(this.nextGridTransitionElement);

        revUtils.transformCss(this.nextGridTransitionElement, 'translate3d('+ this.currentX +'px, 0, 0)');




        // eventEmitter.trigger('dragmove', {
        //     target: targetElement,
        //     throwOutConfidence: config.throwOutConfidence(x, targetElement),
        //     throwDirection: x < 0 ? Card.DIRECTION_LEFT : Card.DIRECTION_RIGHT
        // });
    };

    RevSlider.prototype.finish = function(pixelsPerMs, distance, velocity, containerWidth, counter) {

        console.log('fin', velocity);
        // console.log(pixelsPerMs, distance, containerWidth);

        // console.log( (containerWidth - Math.abs(distance)), (containerWidth - Math.abs(distance)) / pixelsPerMs );

        var duration = ((containerWidth - Math.abs(distance)) / velocity);

        revUtils.transitionCss(this.nextGridTransitionElement, 'all ' + duration + 'ms cubic-bezier(.06, 1, .6, 1)');
        revUtils.transformCss(this.nextGridTransitionElement, 'translate3d('+ (containerWidth * -1) +'px, 0, 0)');

        // revUtils.transitionCss(this.gridTransitionElement, 'all ' + (duration * 2) + 'ms');
        // revUtils.transformCss(this.gridTransitionElement, 'scale(0)');

        var that = this;
        setTimeout(function() {
            that.updateGrids();
        }, duration);

        return;


        var duration;
        if (true || velocity > .1) {
            duration = ((containerWidth - this.currentX) / pixelsPerMs);
            // if (this.sent) {
            //     duration *= 100;
            // } else {
            //     // duration *= 20;
            // }
            console.log('fin', this.scale, this.nextGridTransitionElement, this.gridTransitionElement);
            // var bez = [0,1,.31,1];
            // var bez = [.06,.92,.58,1];
            var bez = [.06,1,.6,1];
            // var bez = [0, 1, .06, 1];

            // do this
            Velocity(this.nextGridTransitionElement, { scale: [1, 1], translateZ: 0, translateX: [containerWidth * (this.currentX < 0 ? -1 : 1), this.currentX] }, {duration: duration, easing: bez});
            Velocity(this.gridTransitionElement, { translateX: [0, 0], scale: [0, this.scale] }, {duration: duration} );
        } else {
            duration = ((containerWidth - this.currentX) / pixelsPerMs) / 2;
            Velocity(this.nextGridTransitionElement, { translateZ: 0, translateX: [0, this.currentX] }, {duration: duration} );
            Velocity(this.gridTransitionElement, { scale: [1, this.scale] }, {duration: duration} );
        }

        var that = this;
        setTimeout(function() {
            that.sent = true;
            that.updateGrids();
        }, duration);

        // console.log('check', pixelsPerMs, containerWidth - this.currentX, (containerWidth - this.currentX) / pixelsPerMs);

        // return;

        // if (Math.abs(distance) < containerWidth) {
        //     if (distance < 0) {
        //         distance -= (pixelsPerMs + counter) * 15;
        //         counter += velocity;
        //     } else {
        //         distance += (pixelsPerMs + counter) * 15;
        //         counter += velocity;
        //     }
        //     var that = this;
        //     // requestAnimationFrame(function() {
        //         console.log(distance);
        //         revUtils.transformCss(that.nextGridTransitionElement, 'translate3d('+ distance +'px, 0, 0)');
        //         setTimeout(function() {
        //             that.finish(pixelsPerMs, distance, velocity, containerWidth, counter);
        //         }, 15);
        //     // });

        // }


        // if (counter < 1000) {
        //     counter++;
        //     console.log('check', pixelsPerMs, distance, containerWidth, counter);
        //     this.finish(pixelsPerMs, distance, containerWidth, counter);
        // }

        // this.currentX = e.deltaX;
        // this.currentDirection = e.direction;
    };

    // get this to dod the same as animateGrid
    RevSlider.prototype.pan = function(direction, movement, reset) {
        console.log('pan2', movement);
        this.updown = false;

        this.transitionClass(true);

        this.panDirection = direction;
        if (direction == 'left') {
            this.showNextPage();
        } else if (direction == 'right') {
            this.showPreviousPage();
        }

        // console.log('pan3', this.movement);
        // this.movement = this.movement + movement;
        this.movement = movement;
        // console.log('pan34', this.movement);

        if (this.movement > this.grid.containerWidth) {
            console.log('panupdate');
            this.updateGrids();
            this.panDirection = false;
            this.movement = 0;
        } else {
            // if (reset) { // used for touch simulation
            //     revUtils.transitionDurationCss(this.gridContainerElement,  this.animationDuration + 's');
            //     var that = this;
            //     setTimeout(function() {
            //         that.resetShowPage(reset);
            //     }, this.animationDuration * 1000);
            // } else {
                // revUtils.transitionDurationCss(this.gridContainerElement,  '0s');
                revUtils.transitionDurationCss(this.gridTransitionElement, '0s');
                revUtils.transitionDurationCss(this.nextGridTransitionElement, '0s');
            // }

            this.nextGridTransitionElement.style.zIndex = 1000; // TODO

            var scale = Math.max((1 - (Math.abs(this.movement) / 1000)), .8);
            revUtils.transformCss(this.gridTransitionElement, 'scale(' + scale + ')');

            // if (direction == 'left') {
                console.log('movement', this.movement);
                revUtils.transformCss(this.nextGridTransitionElement, 'translate3d('+ this.movement +'px, 0, 0)');
                // revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ this.movement +'px, 0, 0)');
            // } else if (direction == 'right') {
            //     revUtils.transformCss(this.nextGridTransitionElement, 'translate3d('+ this.movement +'px, 0, 0)');
            //     // revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ ( (this.grid.containerWidth + (this.padding.left * 2)) - this.movement ) +'px, 0, 0)');
            // }
        }
    };

    RevSlider.prototype.resetShowPage = function(ms) {
        ms = ms ? ms : 300;
        // revUtils.transitionDurationCss(this.gridContainerElement, ms + 'ms');
        // if (this.panDirection == 'left') {
        //     revUtils.transformCss(this.gridContainerElement, 'none');
        // } else {
        //     revUtils.transformCss(this.gridContainerElement, 'translate3d(-'+ ( (this.grid.containerWidth + (this.padding.left * 2))) +'px, 0, 0)');
        // }

        this.page = this.previousPage;
        this.direction = this.previousDirection;
        this.previousPage = this.lastPage;

        this.updatePagination();

        var that = this;
        setTimeout(function() {
            that.updateGrids(true);
            that.movement = 0;
            that.made = false;
            that.panDirection = false;
        }, ms);
    };

    RevSlider.prototype.showNextPage = function(click) {
        if (!this.updating) {
            this.updating = true;

            var previousPage = this.page;

            this.page = this.page + 1;
            this.moving = 'forward';

            if (this.page > this.maxPages()) {
                this.page = 1;
            }else if (this.page === 0) {
                this.page = this.maxPages();
            }

            this.lastPage = this.previousPage;
            this.previousPage = previousPage;
            this.previousDirection = this.direction;

            this.direction = 'next';
            this.createNextPageGrid();

            if (click) { // animate right away on click
                this.animateGrid();
            }
        }
    };

    RevSlider.prototype.showPreviousPage = function(click) {
        if (!this.updating) {
            this.updating = true;

            var previousPage = this.page;

            if (this.direction == 'next') {
                this.page = this.previousPage;
                this.moving = 'back';
            } else {
                if (this.moving == 'back') {
                    this.page = this.page - 1;
                } else {
                    this.page = this.page + 1;
                    this.moving = 'forward';
                }
            }

            if (this.page > this.maxPages()) {
                this.page = 1;
            }else if (this.page === 0) {
                this.page = this.maxPages();
            }

            this.lastPage = this.previousPage;
            this.previousPage = previousPage;
            this.previousDirection = this.direction;

            this.direction = 'previous';

            this.createNextPageGrid();

            if (click) {
                this.animateGrid();
            }
        }
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
Project: RevFeed
Version: 0.0.1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevFeed = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var RevFeed = function(opts) {

        var below_article = (typeof opts.below_article !== 'undefined') ? opts.below_article : true;

        var defaults = {
            api_source: 'rcfeed',
            url: 'https://trends.revcontent.com/api/v1/',
            host: 'https://trends.revcontent.com',
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
            per_row: 6,
            rows: below_article ? 5 : 4,
            infinite: true,
            column_spans: below_article ? [
                {
                    selector: '.rev-content-header, .rev-content',
                    spans: 6
                },
                {
                    selector: '.rev-slider-breakpoint-gt-xs .rev-content:nth-child(-n+9)',
                    spans: 2
                },
            ] : [
                {
                    selector: '.rev-content-header, .rev-content',
                    spans: 6
                },
            ],
            image_ratio: below_article ? [
                {
                    selector: '.rev-slider-breakpoint-lt-sm .rev-content, .rev-content:nth-child(n+10)',
                    ratio: '6:3'
                }
            ] : [
                {
                    selector: '.rev-content',
                    ratio: '12:6'
                }
            ],
            header_selector: below_article ? '.rev-slider-breakpoint-lt-sm .rev-content:nth-child(3n + 6),' +
                ' .rev-slider-breakpoint-gt-xs .rev-content:nth-child(3n+12)' :
                '.rev-content:nth-child(4n + 2)', // goes after this selector
            internal_selector: below_article ? '.rev-slider-breakpoint-lt-sm .rev-content:nth-child(3n + 4), .rev-slider-breakpoint-lt-sm .rev-content:nth-child(3n + 5),' +
                '.rev-slider-breakpoint-gt-xs .rev-content:nth-child(3n+10), .rev-slider-breakpoint-gt-xs .rev-content:nth-child(3n+11)' :
                '.rev-content:nth-child(4n+1), .rev-content:nth-child(4n+2)',
            reactions_selector: '.rev-slider-breakpoint-lt-sm .rev-content, .rev-slider-breakpoint-gt-xs .rev-content:nth-child(n+10)',
            meta_selector: '.rev-slider-breakpoint-lt-sm .rev-content, .rev-slider-breakpoint-gt-xs .rev-content:nth-child(n+10)',
            headline_top_selector: false,
            // headline_icon_selector: '.rev-content:nth-child(4n+10), .rev-content:nth-child(4n+11)',
            // headline_icon_selector: '.rev-content',
            viewable_percentage: 50,
            buffer: 500,
            header_logo: false,
            window_width_devices: [
                'phone'
            ],
            mock: false
        };

        // merge options
        this.options = revUtils.extend(defaults, opts);

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

        revUtils.appendStyle('/* inject:css */#rev-slider2 a,#rev-slider2 a:focus,#rev-slider2 a:hover{text-decoration:none}#rev-slider2 *,#rev-slider2 .rev-head .rev-header{font-family:Montserrat,"Helvetica Neue",Helvetica,Arial,sans-serif;position:relative}#rev-slider2{padding:0;width:100%;clear:both;box-sizing:border-box;position:relative}#rev-slider2.rev-slider-breakpoint-lt-sm .rev-content{padding-bottom:12px!important}#rev-slider2.rev-slider-breakpoint-gt-xs .rev-content:nth-child(n+10){padding-bottom:20px!important}#rev-slider2 *{user-drag:none;-webkit-user-drag:none;box-sizing:border-box}#rev-slider2 a{color:inherit}#rev-slider2 a:focus{outline:0}#rev-slider2 .rev-content .rev-ad a:hover .rev-headline,#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon:hover:after{text-decoration:underline}#rev-slider2 .rev-head{position:relative;margin-bottom:10px}#rev-slider2 .rev-head .rev-header{line-height:28px;font-size:16px;font-weight:700;margin-bottom:0;text-align:left;width:auto;letter-spacing:0;bottom:-6px}#rev-slider2 .rev-sponsored,.rd-loading{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}#rev-slider2 .rev-head .rev-header-logo{display:inline-block;float:left;background-size:contain;margin-right:6px}#rev-slider2 .rev-sponsored{line-height:20px;font-size:12px;font-weight:400}#rev-slider2 .rev-sponsored.top-right{position:absolute;right:0;bottom:0;z-index:1}#rev-slider2 .rev-sponsored.bottom-right{float:right}#rev-slider2 .rev-sponsored a{color:#999}#rev-slider2 #rev-slider-container,#rev-slider2 #rev-slider-container #rev-slider-inner{width:100%;clear:both;position:relative}#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-transition-container{white-space:nowrap}#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-transition-container #rev-slider-grid-transition,#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-transition-container #rev-slider-next-grid-transition{transition:-webkit-transform;transition:transform;transition-timing-function:ease-in-out;white-space:normal;display:inline-block;width:100%}#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-container{clear:both;position:relative;width:100%;transition:-webkit-transform;transition:transform;transition-timing-function:ease-in-out}#rev-slider2 #rev-slider-container #rev-slider-inner #rev-slider-grid-container #rev-slider-grid{padding:0}#rev-slider2 .rev-content-header{padding-bottom:0!important}#rev-slider2 .rev-content-header:last-child{display:none}#rev-slider2 .rev-content-header .rev-content-header-inner .rev-icon{line-height:0;float:left;margin:1px 5px 0 0}#rev-slider2 .rev-content-header .rev-content-header-inner .rev-icon svg{fill:#4cc93d}#rev-slider2 .rev-content-header .rev-content-header-inner h2{border-bottom:1px solid #e5e5e5;border-bottom-color:#e5e5e5;color:#90949c;line-height:15px;letter-spacing:.01em;margin-top:0;font-weight:400;margin-bottom:0;font-size:12px;padding-bottom:9px;padding-top:11px}#rev-slider2 .rev-content{transition-property:opacity;transition-duration:.5s;opacity:1;padding:4px 4px 12px!important}#rev-slider2 .rev-content .rev-content-inner{background:#fff}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu{position:relative}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-icon{cursor:pointer}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container{visibility:visible}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item{opacity:1;transition:all .4s ease-in}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item .rev-reaction-menu-item-count{display:table-cell;text-align:center;vertical-align:middle;color:#666;font-size:12px}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(1){-webkit-transform:translate3d(0,-120%,0);transform:translate3d(0,-120%,0);display:table;transition-delay:.25s}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(2){-webkit-transform:translate3d(130%,-130%,0);transform:translate3d(130%,-130%,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(3){-webkit-transform:translate3d(180%,0,0);transform:translate3d(180%,0,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(4){-webkit-transform:translate3d(130%,130%,0);transform:translate3d(130%,130%,0)}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(5){-webkit-transform:translate3d(0,120%,0);transform:translate3d(0,120%,0);display:table;transition-delay:1s}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(6){-webkit-transform:translate3d(-130%,130%,0);transform:translate3d(-130%,130%,0);transition-delay:.75s}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(7){-webkit-transform:translate3d(-180%,0,0);transform:translate3d(-180%,0,0);transition-delay:.75s}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(8){-webkit-transform:translate3d(-130%,-130%,0);transform:translate3d(-130%,-130%,0);transition-delay:.75s}#rev-slider2 .rev-content.rev-menu-active .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu-mask{opacity:1!important}#rev-slider2 .rev-content:hover.rev-text-overlay .rev-ad-inner:after{background:linear-gradient(to bottom,transparent 0,rgba(0,0,0,.4) 100%)}#rev-slider2 .rev-content.rev-text-right .rev-image{float:left;margin-right:5px}#rev-slider2 .rev-content.rev-text-overlay .rev-ad{position:relative}#rev-slider2 .rev-content.rev-text-overlay .rev-ad a{height:100%}#rev-slider2 .rev-content.rev-text-overlay .rev-ad .rev-headline-brand{position:absolute;bottom:4px;z-index:100}#rev-slider2 .rev-content.rev-text-overlay .rev-ad .rev-headline-brand .rev-provider,#rev-slider2 .rev-content.rev-text-overlay .rev-ad .rev-headline-brand h3{color:#fff;text-shadow:1px 1px rgba(0,0,0,.8)}#rev-slider2 .rev-content.rev-text-overlay .rev-ad .rev-headline-brand .rev-provider{display:none}#rev-slider2 .rev-content.rev-text-overlay .rev-ad-inner:after{transition:background .5s linear;position:absolute;top:0;height:100%;width:100%;content:"";display:block;background:linear-gradient(to bottom,rgba(0,0,0,.1) 0,rgba(0,0,0,.65) 100%)}#rev-slider2 .rev-content .rev-ad a{display:block;height:100%;color:#222;width:100%;z-index:1000000}#rev-slider2 .rev-content .rev-image{position:relative;background-size:cover;background-repeat:no-repeat;background-color:#eee;overflow:hidden;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}#rev-slider2 .rev-content .rev-image img{position:absolute;top:0;left:0;width:100%;display:block;max-width:100%;height:auto}#rev-slider2 .rev-content .rev-headline-icon-container{float:left;display:inline-block;margin-right:7px}#rev-slider2 .rev-content .rev-headline-icon-container .rev-headline-icon{height:34px;width:34px;background-size:contain}#rev-slider2 .rev-content .rev-headline-icon-container .rev-headline-icon .rev-headline-icon-image{width:100%;height:100%;display:inline-block;background-size:contain}#rev-slider2 .rev-content .rev-headline-icon-container .rev-headline-icon .rev-author-initials{line-height:32px;text-align:center;font-size:18px;border:1px solid rgba(0,0,0,.3);color:rgba(0,0,0,.67);border-radius:4px}#rev-slider2 .rev-content .rev-description h4,#rev-slider2 .rev-content .rev-headline h3{margin-bottom:0}#rev-slider2 .rev-content .rev-headline h3{color:rgba(0,0,0,.8);font-size:16px;line-height:22px;margin-top:5px}#rev-slider2 .rev-content .rev-description h4{color:rgba(0,0,0,.44);font-size:12px;line-height:17px;margin-top:8px}#rev-slider2 .rev-content.rev-content-breakpoint-gt-sm .rev-headline h3{margin-top:14px;font-size:22px;line-height:28px}#rev-slider2 .rev-content.rev-content-breakpoint-gt-sm .rev-description h4{margin-top:8px;font-size:14px;line-height:20px}#rev-slider2 .rev-content .rev-after-image{padding:9px 0}#rev-slider2 .rev-content .rev-after-image .rev-headline-brand-inner{padding:2px 9px}#rev-slider2 .rev-content .rev-date,#rev-slider2 .rev-content .rev-headline,#rev-slider2 .rev-content .rev-headline-max-check,#rev-slider2 .rev-content .rev-provider{text-align:left}#rev-slider2 .rev-content .rev-description,#rev-slider2 .rev-content .rev-headline,#rev-slider2 .rev-content .rev-headline-max-check{overflow:hidden}#rev-slider2 .rev-content .rev-description h4,#rev-slider2 .rev-content .rev-headline-max-check h3,#rev-slider2 .rev-content .rev-provider{font-weight:400;text-transform:none}#rev-slider2 .rev-content .rev-headline h3,#rev-slider2 .rev-content .rev-headline-max-check h3{font-weight:700;letter-spacing:.2px}#rev-slider2 .rev-content .rev-date,#rev-slider2 .rev-content .rev-provider{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}#rev-slider2 .rev-content .rev-provider{color:#888;margin-top:2px;font-size:11px;line-height:16px;height:16px;position:relative;top:-2.5px}#rev-slider2 .rev-content .rev-provider:first-letter{text-transform:uppercase}#rev-slider2 .rev-content .rev-date{color:#b2b2b2;line-height:16px;font-size:12px;font-weight:400;position:relative;display:inline-block}#rev-slider2 .rev-content .rev-date .rev-sponsored-icon{float:right;margin-left:5px;display:inline-block;height:14px}#rev-slider2 .rev-content .rev-date .rev-sponsored-icon svg{fill:#95a2ab;height:100%;width:auto}#rev-slider2 .rev-content .rev-ad{z-index:1}#rev-slider2 .rev-content .rev-ad .rev-ad-container,#rev-slider2 .rev-content .rev-ad .rev-ad-container .rev-ad-outer,#rev-slider2 .rev-content .rev-ad .rev-ad-container .rev-ad-outer .rev-ad-inner{height:100%}#rev-slider2 .rev-content .rev-reactions{margin-left:0!important;margin-right:0!important;padding:9px;border-top:1px solid #e5e5e5;border-top-color:#e5e5e5;line-height:0}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar{display:-webkit-box;display:flex;-webkit-box-pack:justify;justify-content:space-between}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction{position:relative;cursor:pointer;line-height:24px;margin-left:33px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;display:inline-block}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction:first-child{margin-left:0}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon{background-repeat:no-repeat;line-height:16px;height:16px;min-width:16px;min-height:16px;transition:-webkit-transform .5s;transition:transform .5s}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon:hover{-webkit-transform:scale(1.04);transform:scale(1.04)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon svg{height:100%;width:auto}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-icon svg path{fill:#95a2ab!important}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-count .rev-reaction-count-inner{font-size:11px;line-height:24px;margin-left:2px;color:rgba(90,90,90,.86)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA0MDcuODkzIDQwNy44OTMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwNy44OTMgNDA3Ljg5MzsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPGc+CgkJPGc+CgkJCTxwYXRoIGQ9Ik0yODUuMjQ1LDE1LjI0MmMtMzAuMjU2LDAtNTguODQyLDEwLjg4NS04MS4yOTIsMzAuODAyYy0yMi40NDMtMTkuOTItNTEuMDI5LTMwLjgwMi04MS4yOTktMzAuODAyICAgICBDNTUuMDIzLDE1LjI0MiwwLDcwLjI2MiwwLDEzNy44OWMwLDMyLjgxNiwxMi43OTcsNjMuNjQ4LDM2LjAyNCw4Ni44MjJsMTY3LjkyOSwxNjcuOTM5bDE2OC4wMjUtMTY4LjAyOCAgICAgYzIzLjE1OS0yMy4xNTMsMzUuOTE1LTUzLjk1MSwzNS45MTUtODYuNzMzQzQwNy44OTMsNzAuMjYyLDM1Mi44NzQsMTUuMjQyLDI4NS4yNDUsMTUuMjQyeiBNMzYxLjExNywyMTMuNzY1TDIwMy45NTQsMzcwLjkyOSAgICAgTDQ2Ljg3NSwyMTMuODQ3Yy0yMC4zMjMtMjAuMjc1LTMxLjUxNS00Ny4yNTEtMzEuNTE1LTc1Ljk1M2MwLTU5LjE2LDQ4LjEzMS0xMDcuMjg4LDEwNy4yOTUtMTA3LjI4OCAgICAgYzI4LjY2MiwwLDU1LjYxLDExLjE1OCw3NS44NjUsMzEuNDJsNS40MjcsNS40MzFsNS40MzQtNS40MzFjMjAuMjY4LTIwLjI1OCw0Ny4yMTMtMzEuNDIsNzUuODY1LTMxLjQyICAgICBjNTkuMTU2LDAsMTA3LjI4OCw0OC4xMjgsMTA3LjI4OCwxMDcuMjg4QzM5Mi41MzMsMTY2LjU2OSwzODEuMzc5LDE5My41MTQsMzYxLjExNywyMTMuNzY1eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNNDAuOTYsMTM3Ljg5aDE1LjM2YzAtMzYuNTc0LDI5Ljc1Ny02Ni4zMzEsNjYuMzM4LTY2LjMzNXYtMTUuMzZDNzcuNjA5LDU2LjE5NSw0MC45Niw5Mi44NDQsNDAuOTYsMTM3Ljg5eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNMjAzLjUzLDEzNy44OWgxNS4zNmMwLTM2LjU3NCwyOS43NTctNjYuMzMxLDY2LjMzNS02Ni4zMzV2LTE1LjM2QzI0MC4xNzYsNTYuMTk1LDIwMy41Myw5Mi44NDQsMjAzLjUzLDEzNy44OXoiIGZpbGw9IiMwMDAwMDAiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==);background-size:contain;background-repeat:no-repeat}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon:after{content:"Love";margin-left:24px;clear:both;display:table;color:rgba(90,90,90,.86);font-size:12px}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8cGF0aCBzdHlsZT0iZmlsbDojRkY0RDVFOyIgZD0iTTI1Niw5Ni4yNDhjLTU2LjY5MS01Ni42OTEtMTQ4Ljc2Ny01Ni40MzItMjA1LjEzNSwwLjc3OCAgYy01NS45MjMsNTYuNzU4LTU0LjI4OCwxNDguNTI2LDIuMDU1LDIwNC44NjhsMTIzLjAyNCwxMjMuMDI0YzQ0LjIxNCw0NC4yMTQsMTE1Ljg5OSw0NC4yMTQsMTYwLjExNCwwbDEyMy4wMjQtMTIzLjAyNCAgYzU2LjM0My01Ni4zNDMsNTcuOTc4LTE0OC4xMSwyLjA1NS0yMDQuODY4QzQwNC43NjcsMzkuODE1LDMxMi42OTEsMzkuNTU3LDI1Niw5Ni4yNDh6Ii8+CjxwYXRoIGQ9Ik00NjguMTQ3LDkwLjExNWMtMjkuMS0yOS41MzQtNjcuOTQ5LTQ1Ljg4NC0xMDkuMzkxLTQ2LjAzN2MtMC4xOTgtMC4wMDEtMC4zOTItMC4wMDEtMC41OS0wLjAwMSAgYy0zOC4wMjUsMC03My45MzUsMTMuNjQ5LTEwMi4xNjcsMzguNjU1Yy0yOC4yMzUtMjUuMDA3LTY0LjEzOS0zOC42NTUtMTAyLjE2Ny0zOC42NTVjLTAuMTk0LDAtMC4zOTQsMC0wLjU5LDAuMDAxICBDMTExLjgsNDQuMjMyLDcyLjk1MSw2MC41ODEsNDMuODUyLDkwLjExNWMtNTkuMjg0LDYwLjE2OS01OC4zMzgsMTU4LjI5NCwyLjEwNiwyMTguNzRsMTIzLjAyNCwxMjMuMDIzICBjMjMuMjQzLDIzLjI0NCw1NC4xNDcsMzYuMDQ0LDg3LjAxOSwzNi4wNDRzNjMuNzc1LTEyLjgsODcuMDE5LTM2LjA0NGwxMjMuMDI0LTEyMy4wMjMgIEM1MjYuNDg2LDI0OC40MSw1MjcuNDMxLDE1MC4yODUsNDY4LjE0Nyw5MC4xMTV6IE00NTIuMTE5LDI5NC45MzJMMzI5LjA5NSw0MTcuOTU2Yy0xOS41MjUsMTkuNTI1LTQ1LjQ4MywzMC4yNzctNzMuMDk1LDMwLjI3NyAgYy0yNy42MTIsMC01My41Ny0xMC43NTMtNzMuMDk1LTMwLjI3N0w1OS44ODEsMjk0LjkzMkM3LjA1NywyNDIuMTA4LDYuMTU5LDE1Ni40MjcsNTcuODc3LDEwMy45MzUgIGMyNS4zODktMjUuNzY4LDU5LjI4NC00MC4wMzMsOTUuNDM4LTQwLjE2N2MwLjE3Mi0wLjAwMSwwLjM0My0wLjAwMSwwLjUxNC0wLjAwMWMzNS45NjcsMCw2OS43NjIsMTMuOTk2LDk1LjIwOCwzOS40NDIgIGMzLjg0NSwzLjg0MywxMC4wNzcsMy44NDMsMTMuOTI0LDBjMjUuNDQ3LTI1LjQ0Nyw1OS4yMzgtMzkuNDQyLDk1LjIwOC0zOS40NDJjMC4xNywwLDAuMzQ1LDAsMC41MTQsMC4wMDEgIGMzNi4xNTYsMC4xMzQsNzAuMDQ5LDE0LjM5OCw5NS40MzgsNDAuMTY3QzUwNS44NDEsMTU2LjQyNyw1MDQuOTQzLDI0Mi4xMDgsNDUyLjExOSwyOTQuOTMyeiIvPgo8cGF0aCBkPSJNMTQ3Ljc0Niw4OC4zNTljLTM3LjkyNSwwLTcxLjkzMywyMS4wMTQtODguNzUzLDU0Ljg0MmMtMi40MjEsNC44NjgtMC40MzYsMTAuNzc3LDQuNDMyLDEzLjE5OCAgYzEuNDA5LDAuNywyLjkwMiwxLjAzMiw0LjM3NSwxLjAzMmMzLjYxOSwwLDcuMTAyLTIuMDAzLDguODIzLTUuNDY0YzEzLjQ3MS0yNy4wOSw0MC43MjMtNDMuOTE4LDcxLjEyMy00My45MTggIGM1LjQzNiwwLDkuODQ1LTQuNDA4LDkuODQ1LTkuODQ1UzE1My4xODMsODguMzU5LDE0Ny43NDYsODguMzU5eiIvPgo8cGF0aCBkPSJNNjAuMzgyLDE2Ni45NzFjLTUuMzkzLTAuNjU1LTEwLjMwNCwzLjE5MS0xMC45NTgsOC41ODljLTAuMDAxLDAuMDEyLTAuMDIxLDAuMTc2LTAuMDIyLDAuMTkgIGMtMC42NTMsNS4zOTMsMy4xODYsMTAuMjk3LDguNTgxLDEwLjk1NmMwLjQwNSwwLjA0OSwwLjgwNiwwLjA3NCwxLjIwNiwwLjA3NGM0LjkwNCwwLDkuMTUtMy42Niw5Ljc1OS04LjY1MyAgYzAuMDAxLTAuMDAzLDAuMDIzLTAuMTk1LDAuMDI0LTAuMTk5QzY5LjYyNCwxNzIuNTMyLDY1Ljc3OSwxNjcuNjI1LDYwLjM4MiwxNjYuOTcxeiIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-laugh{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk5IDUxMS45OTkiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTkgNTExLjk5OTsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZEREY2RDsiIGN4PSIyNTYuNiIgY3k9IjI1Ni4wMDEiIHI9IjI0NS45OTMiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0ZDQzU2QjsiIGQ9Ik0zMDkuMzEyLDQ2NS42NzdjLTEzNS44NTgsMC0yNDUuOTkyLTExMC4xMzQtMjQ1Ljk5Mi0yNDUuOTkyICBjMC03Mi41ODQsMzEuNDQzLTEzNy44MTYsODEuNDQ0LTE4Mi44NDJDNjUuMTI2LDc3LjU2MiwxMC42MDYsMTYwLjQxMywxMC42MDYsMjU1Ljk5OWMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkyLDI0NS45OTIsMjQ1Ljk5MiAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk3LDE2NC41NDgtNjMuMTQ5QzM4Ny41OTQsNDU1Ljk5OCwzNDkuNTg1LDQ2NS42NzcsMzA5LjMxMiw0NjUuNjc3eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNNDE3LjA1OCwyMzAuMzYzYy0zLjUxMywwLjAwMS02LjkyMS0xLjg1Mi04Ljc1Mi01LjE0Yy02LjQyMS0xMS41MjYtMTguNTk0LTE4LjY4Ni0zMS43NzEtMTguNjg2ICAgYy0xMi44NTEsMC0yNS4xODksNy4yNjUtMzIuMjAyLDE4Ljk2MmMtMi44NDIsNC43MzktOC45ODksNi4yNzgtMTMuNzI5LDMuNDM3Yy00Ljc0MS0yLjg0Mi02LjI3OS04Ljk4OC0zLjQzNy0xMy43MjkgICBjMTAuNjA4LTE3LjY5NCwyOS41MjQtMjguNjg1LDQ5LjM2OC0yOC42ODVjMjAuNDMyLDAsMzkuMzA2LDExLjA5Niw0OS4yNTYsMjguOTYxYzIuNjksNC44MjgsMC45NTUsMTAuOTIzLTMuODcyLDEzLjYxMSAgIEM0MjAuMzc4LDIyOS45NTYsNDE4LjcwNiwyMzAuMzYzLDQxNy4wNTgsMjMwLjM2M3oiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMjQ2LjMzLDIzMC4zNjNjLTMuNTEzLDAuMDAxLTYuOTIxLTEuODUyLTguNzUyLTUuMTRjLTYuNDIxLTExLjUyNi0xOC41OTQtMTguNjg2LTMxLjc3MS0xOC42ODYgICBjLTEyLjg0OSwwLTI1LjE4OSw3LjI2NS0zMi4yMDIsMTguOTYyYy0yLjg0MSw0LjczOS04Ljk4Nyw2LjI3OC0xMy43MjksMy40MzdjLTQuNzM5LTIuODQyLTYuMjc5LTguOTg5LTMuNDM2LTEzLjcyOSAgIGMxMC42MDgtMTcuNjk0LDI5LjUyNC0yOC42ODUsNDkuMzY4LTI4LjY4NWMyMC40MzIsMCwzOS4zMDYsMTEuMDk2LDQ5LjI1NiwyOC45NjFjMi42OSw0LjgyOCwwLjk1NSwxMC45MjMtMy44NzIsMTMuNjExICAgQzI0OS42NDksMjI5Ljk1NiwyNDcuOTc4LDIzMC4zNjMsMjQ2LjMzLDIzMC4zNjN6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTI5My41NDUsNDM3LjcwNkwyOTMuNTQ1LDQzNy43MDZjLTcwLjk4MSwwLTEyOC41MjItNTcuNTQxLTEyOC41MjItMTI4LjUyMmwwLDBoMjU3LjA0M2wwLDAgICBDNDIyLjA2NiwzODAuMTY0LDM2NC41MjUsNDM3LjcwNiwyOTMuNTQ1LDQzNy43MDZ6Ii8+CjwvZz4KPHBhdGggc3R5bGU9ImZpbGw6I0YyRjJGMjsiIGQ9Ik0xOTYuMzgyLDMwOS4xODR2MjAuMDYxYzAsOC40Niw2Ljg1NywxNS4zMTcsMTUuMzE3LDE1LjMxN2gxNjMuNjkzICBjOC40NTgsMCwxNS4zMTctNi44NTcsMTUuMzE3LTE1LjMxN3YtMjAuMDYxSDE5Ni4zODJMMTk2LjM4MiwzMDkuMTg0eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkM0QzU5OyIgZD0iTTI5Ni4yNDEsMzg0LjM4NWMtMzQuNzQtMTYuMTQtNzMuMjk0LTEzLjc5NS0xMDQuNTU0LDIuOTQ1ICBjMjMuNDkyLDMwLjYxNyw2MC40MzIsNTAuMzc0LDEwMi4wMDcsNTAuMzc0bDAsMGMxOC4zMiwwLDM1LjczMS0zLjg1OSw1MS41MDMtMTAuNzY3ICBDMzMzLjYyNiw0MDkuMDM0LDMxNy4wMzQsMzk0LjA0NiwyOTYuMjQxLDM4NC4zODV6Ii8+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzNGQTlGNTsiIGQ9Ik0xNTEuMTE5LDMzNS41NDNjLTE1LjAxNiwxNi40MjMtNDAuNTAyLDE3LjU2NS01Ni45MjYsMi41NDlzLTE3LjU2NS00MC41MDItMi41NDktNTYuOTI2ICAgYzE1LjAxNi0xNi40MjMsODMuOTExLTMyLjA2Myw4My45MTEtMzIuMDYzUzE2Ni4xMzYsMzE5LjExOSwxNTEuMTE5LDMzNS41NDN6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojM0ZBOUY1OyIgZD0iTTQyNy42NjcsMzI2LjU2NGMxNS4wMTYsMTYuNDIzLDQwLjUwMiwxNy41NjUsNTYuOTI2LDIuNTQ5czE3LjU2NS00MC41MDIsMi41NDktNTYuOTI2ICAgYy0xNS4wMTYtMTYuNDIzLTgzLjkxMS0zMi4wNjMtODMuOTExLTMyLjA2M1M0MTIuNjUyLDMxMC4xNDIsNDI3LjY2NywzMjYuNTY0eiIvPgo8L2c+CjxwYXRoIGQ9Ik0zNzYuNTM1LDE4Ni41MjZjLTE5Ljg0NCwwLTM4Ljc2LDEwLjk5MS00OS4zNjgsMjguNjg1Yy0yLjg0Miw0Ljc0MS0xLjMwNCwxMC44ODcsMy40MzcsMTMuNzI5ICBjNC43MzksMi44NDEsMTAuODg3LDEuMzA0LDEzLjcyOS0zLjQzN2M3LjAxMi0xMS42OTcsMTkuMzUxLTE4Ljk2MiwzMi4yMDItMTguOTYyYzEzLjE3NiwwLDI1LjM1MSw3LjE2LDMxLjc3MSwxOC42ODYgIGMxLjgzMSwzLjI4OCw1LjIzOCw1LjE0MSw4Ljc1Miw1LjE0YzEuNjQ4LDAsMy4zMi0wLjQwOCw0Ljg2MS0xLjI2NmM0LjgyOS0yLjY5LDYuNTYyLTguNzg0LDMuODcyLTEzLjYxMSAgQzQxNS44NDEsMTk3LjYyMiwzOTYuOTY3LDE4Ni41MjYsMzc2LjUzNSwxODYuNTI2eiIvPgo8cGF0aCBkPSJNMjA1LjgwNywxODYuNTI2Yy0xOS44NDMsMC0zOC43NTksMTAuOTkxLTQ5LjM2OCwyOC42ODVjLTIuODQyLDQuNzM5LTEuMzA0LDEwLjg4NywzLjQzNiwxMy43MjkgIGM0Ljc0MiwyLjg0MSwxMC44ODgsMS4zMDQsMTMuNzI5LTMuNDM3YzcuMDEzLTExLjY5NywxOS4zNTMtMTguOTYyLDMyLjIwMi0xOC45NjJjMTMuMTc2LDAsMjUuMzUxLDcuMTYsMzEuNzcxLDE4LjY4NiAgYzEuODMxLDMuMjg4LDUuMjM4LDUuMTQxLDguNzUyLDUuMTRjMS42NDgsMCwzLjMyLTAuNDA4LDQuODYxLTEuMjY2YzQuODI5LTIuNjksNi41NjItOC43ODQsMy44NzItMTMuNjExICBDMjQ1LjExMywxOTcuNjIyLDIyNi4yNCwxODYuNTI2LDIwNS44MDcsMTg2LjUyNnoiLz4KPHBhdGggZD0iTTQ5NC41MjcsMjY1LjQzNmMtMTYuMzA0LTE3LjgzMy03Ny4wNjYtMzIuMzQyLTg5LjA4MS0zNS4wN2MtMy4xOTYtMC43MjYtNi41NDcsMC4xNi04Ljk2OCwyLjM3MiAgYy0yLjQxOSwyLjIxMi0zLjYwMyw1LjQ3MS0zLjE2NSw4LjcyYzEuMDIxLDcuNTgzLDQuODg5LDM0LjI4OSwxMS41NzYsNTcuNzE4SDE3Ni4yOTJjNS4yMjEtMjAuODgzLDguMjktNDIuMTEzLDkuMTgxLTQ4LjczOCAgYzAuNDM4LTMuMjUtMC43NDYtNi41MDctMy4xNjUtOC43MmMtMi40Mi0yLjIxMi01Ljc3NC0zLjA5OC04Ljk2OC0yLjM3MmMtMTIuMDE1LDIuNzI3LTcyLjc3NywxNy4yMzctODkuMDgxLDM1LjA2OCAgYy0xOC43MTUsMjAuNDY4LTE3LjI4Nyw1Mi4zNDgsMy4xODIsNzEuMDYzYzkuMzQ3LDguNTQ2LDIxLjMwMiwxMy4xNzksMzMuODg2LDEzLjE3OWMwLjc2NiwwLDEuNTM0LTAuMDE3LDIuMzA0LTAuMDUyICBjMTMuNDIyLTAuNiwyNS44MDctNi4zOTMsMzQuODcyLTE2LjMwOWMwLjEzNi0wLjE0OCwwLjI2Ny0wLjMyNiwwLjQwMi0wLjQ3OWMxNC43MTEsNjAuNjksNjkuNDksMTA1Ljg5NywxMzQuNjM3LDEwNS44OTcgIGM2NS4yNjgsMCwxMjAuNjc4LTQ1LjUyNywxMzQuOTU2LTEwNy4xNjljOC42MSw2LjA0NywxOC43NTQsOS4xMDksMjguOTI1LDkuMTA5YzUuNzc0LDAsMTEuNTUyLTAuOTk4LDE3LjA2Ni0yLjk4MSAgYy0xNS4xNzksMzYuMzE1LTM5LjQzMyw2OC43MzgtNzAuNDQ5LDkzLjU5MWMtNDIuMjI4LDMzLjgzNy05My4yMTQsNTEuNzIyLTE0Ny40NDQsNTEuNzIyICBjLTEzMC4xMjMsMC0yMzUuOTg1LTEwNS44NjMtMjM1Ljk4NS0yMzUuOTg1UzEyNi40NzUsMjAuMDE1LDI1Ni41OTgsMjAuMDE1YzEwNy4zNjUsMCwyMDEuMjY1LDcyLjQ1NywyMjguMzQ4LDE3Ni4yMDIgIGMxLjM5Niw1LjM0OSw2Ljg2Miw4LjU1MywxMi4yMSw3LjE1NWM1LjM0OC0xLjM5Niw4LjU1Mi02Ljg2NCw3LjE1NS0xMi4yMUM0NzQuOTI4LDc4LjYwOCwzNzMuMDY2LDAsMjU2LjU5OCwwICBDMTE1LjQzOCwwLDAuNTk4LDExNC44NCwwLjU5OCwyNTUuOTk5czExNC44NCwyNTUuOTk5LDI1NS45OTksMjU1Ljk5OWM1Ny45ODgsMCwxMTQuNzk2LTE5LjkyOSwxNTkuOTU4LTU2LjExNyAgYzQ0LjQ3NS0zNS42MzUsNzYuMTQ2LTg1LjYzMyw4OS4xODEtMTQwLjc4YzAuMjIzLTAuOTQ1LDAuMjk4LTEuODg4LDAuMjUxLTIuODExQzUxMC4yMTQsMjk2LjI5Miw1MDYuNDk5LDI3OC41MjksNDk0LjUyNywyNjUuNDM2eiAgIE0xMjIuNzM3LDMzOC42MDljLTguMDcsMC4zNjctMTUuODE4LTIuNDQ2LTIxLjc4OS03LjkwNGMtMTIuMzI1LTExLjI2OC0xMy4xODQtMzAuNDYyLTEuOTE2LTQyLjc4NyAgYzcuNDM3LTguMTM0LDM4LjQyLTE4LjY1Miw2NC4zNTktMjUuNTA4Yy00LjUxMSwyNi40NDYtMTIuMjE4LDU4LjI0NC0xOS42NTYsNjYuMzgxICBDMTM4LjI3NSwzMzQuNzYxLDEzMC44MTgsMzM4LjI0OCwxMjIuNzM3LDMzOC42MDl6IE0yOTMuNTQzLDQyNy42OThjLTYxLjk3OSwwLTExMi45OTktNDcuODI0LTExOC4wOTYtMTA4LjUwN2gyMzYuMTk0ICBDNDA2LjU0LDM4MC4yNSwzNTUuMTc3LDQyNy42OTgsMjkzLjU0Myw0MjcuNjk4eiBNNDU2LjA0OSwzMjkuNjMyYy04LjA4Mi0wLjM2Mi0xNS41MzgtMy44NDktMjAuOTk3LTkuODE5ICBjLTEuMjkyLTEuNDEzLTIuNTkxLTMuNTUzLTMuODgtNi4yNDFjLTAuMTc5LTAuNDcxLTAuMzg2LTAuOTI5LTAuNjMyLTEuMzYyYy0wLjgwMi0xLjc4OC0xLjU5OS0zLjc3Ni0yLjM4Ny01Ljk0NCAgYy0wLjA2NS0wLjIxNi0wLjE0Ny0wLjQyNy0wLjIyNy0wLjYzNmMtNC45MjgtMTMuODEtOS40NjctMzQuMjM2LTEyLjUzLTUyLjJjMjUuOTM0LDYuODUzLDU2LjkxMiwxNy4zNjcsNjQuMzU5LDI1LjUxMiAgYzExLjI2OCwxMi4zMjQsMTAuNDA5LDMxLjUxOS0xLjkxNiw0Mi43ODdDNDcxLjg3LDMyNy4xODcsNDY0LjEzNSwzMjkuOTk2LDQ1Ni4wNDksMzI5LjYzMnoiLz4KPGNpcmNsZSBjeD0iNTAxLjM5MyIgY3k9IjIyNi4wMzIiIHI9IjEwLjAwNyIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-laugh:after{content:"LOL"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-cool{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk3IDUxMS45OTciIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTcgNTExLjk5NzsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGREI2QzsiIGN4PSIyNDguMTA2IiBjeT0iMjU1Ljk5NCIgcj0iMjM4LjQwNyIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkZCMDRDOyIgZD0iTTI5OS4xOTQsNDU5LjIxYy0xMzEuNjY4LDAtMjM4LjQwNi0xMDYuNzM4LTIzOC40MDYtMjM4LjQwNmMwLTcwLjM0NSwzMC40NzMtMTMzLjU2NSw3OC45MzItMTc3LjIwMyAgQzYyLjUzNyw4My4wNjQsOS42OTksMTYzLjM2MSw5LjY5OSwyNTUuOTk5YzAsMTMxLjY2OCwxMDYuNzM4LDIzOC40MDYsMjM4LjQwNiwyMzguNDA2YzYxLjMyMywwLDExNy4yMzEtMjMuMTYxLDE1OS40NzQtNjEuMjAxICBDMzc1LjA2MSw0NDkuODI5LDMzOC4yMjQsNDU5LjIxLDI5OS4xOTQsNDU5LjIxeiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGOUE4ODA7IiBkPSJNMTQ1LjY1MSwyNTkuNDE3Yy0xNy43MDUsMC0zMi4wNTksMTQuMzUzLTMyLjA1OSwzMi4wNTdoNjQuMTE2ICAgQzE3Ny43MSwyNzMuNzY5LDE2My4zNTcsMjU5LjQxNywxNDUuNjUxLDI1OS40MTd6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjlBODgwOyIgZD0iTTQyNS4yODEsMjU5LjQxN2MtMTcuNzA1LDAtMzIuMDU5LDE0LjM1My0zMi4wNTksMzIuMDU3aDY0LjExNiAgIEM0NTcuMzM4LDI3My43NjksNDQyLjk4NSwyNTkuNDE3LDQyNS4yODEsMjU5LjQxN3oiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojNTY1ODZGOyIgZD0iTTExMC44OCwxMjYuOTc0YzYyLjI1LTE0LjI4NywxMTIuNjQzLTkuMzcsMTY4LjQ2NCwzLjYzOWM4LjI3OCwxLjkyOCwxNy4wMjIsNC4wNzksMjYuMjU4LDQuMzYxICBjMTUuMzgsMC40NzEsMzIuNjY5LTMuMzU3LDQ3LjU3NS03LjEwMmM1OC44NS0xNC43ODMsMTA0LjgyMi03LjA5NCwxNDkuMTIzLDIuMzcybC0zLjI3MywyNi4xOCAgYy02LjkxNiwwLjE1My05LjA5MSwzLjM3OC0xMS4wNjcsOS42NzNjLTEwLjM0LDMyLjk0NS0xLjUzNCw4OS42My03Ny45NzgsODIuOTY1Yy01MC4yOS00LjM4NS02NC42OTItMTguMTY0LTg4LjY2LTc4Ljc0NiAgYy0yLjAzOS01LjE1My0zLjM2NS0xMy42NjktMTUuMDExLTEzLjM1NGMtNi41NzYsMC4xNzctMTIuNDU3LDEuMzQtMTQuNTA4LDEyLjc2NWMtMy44MjMsMjEuMjg4LTMyLjg5Myw3OS4xMjktOTEuOTE1LDc5LjA2NSAgYy01Mi4xMzItMC4wNTYtNzIuMDE5LTI3LjExNi03NC4zOTMtODYuNzQzYy0wLjI5NS03LjQwMy02Ljc0Ni04LjgwOS0xMC42MTctOC44OTZMMTEwLjg4LDEyNi45NzRMMTEwLjg4LDEyNi45NzR6Ii8+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzczNzg5MTsiIGQ9Ik0yMDEuMjgxLDExOC43MzRsLTM2LjQwNiwxMjQuMTU1YzkuNTgxLDMuOTQyLDIxLjE0Niw1Ljg4OCwzNS4wMTQsNS45MDIgICBjMC4yNDQsMCwwLjQ4NS0wLjAwOSwwLjcyOS0wLjAxbDM3LjA0LTEyNi4zMTdDMjI1LjU0NCwxMjAuNjMyLDIxMy40ODMsMTE5LjM1LDIwMS4yODEsMTE4LjczNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3Mzc4OTE7IiBkPSJNNDI3LjY3NywxMTkuNzRjLTEyLjExNi0wLjM4OC0yNC42OTMsMC0zNy45MDMsMS40NzVsLTMyLjUwMSwxMTAuODM3ICAgYzguODg4LDcuNDY0LDE5LjM4MSwxMS43OTksMzMuMjM0LDE0LjQ0N0w0MjcuNjc3LDExOS43NHoiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTI5Ny43NjgsNDMwLjY1NkwyOTcuNzY4LDQzMC42NTZjLTUzLjI5NiwwLTk2LjUwMi00My4yMDYtOTYuNTAyLTk2LjUwMmwwLDBoMTkzLjAwNGwwLDAgIEMzOTQuMjcxLDM4Ny40NSwzNTEuMDY1LDQzMC42NTYsMjk3Ljc2OCw0MzAuNjU2eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRjJGMkYyOyIgZD0iTTIyNC44MTIsMzM0LjE1MnYxNS4wNjRjMCw2LjM1Miw1LjE0OSwxMS41LDExLjUsMTEuNWgxMjIuOTExYzYuMzUyLDAsMTEuNS01LjE0OSwxMS41LTExLjV2LTE1LjA2NCAgSDIyNC44MTJ6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGQzRDNTk7IiBkPSJNMjk5Ljc5NCwzOTAuNjE5Yy0yNi4wODYtMTIuMTItNTUuMDMzLTEwLjM1OC03OC41MDcsMi4yMTEgIGMxNy42MzksMjIuOTksNDUuMzc3LDM3LjgyNSw3Ni41OTMsMzcuODI1bDAsMGMxMy43NTcsMCwyNi44MjktMi44OTgsMzguNjcyLTguMDg1ICBDMzI3Ljg2NCw0MDkuMTI3LDMxNS40MDYsMzk3Ljg3MywyOTkuNzk0LDM5MC42MTl6Ii8+CjxwYXRoIGQ9Ik01MDQuMzI2LDEyMC43NTljLTQ2LjMxNi05Ljg5NS05Mi45MDYtMTcuNTE3LTE1My41MTQtMi4yOTNjLTE1LjA5MSwzLjc5Mi0zMC45OTcsNy4yMzctNDQuOTE1LDYuODE1ICBjLTcuNzc2LTAuMjM4LTE1LjUyNi0yLjA0OC0yMy4wMjEtMy44MDFsLTEuMzMyLTAuMzEyYy00OC42MzMtMTEuMzM1LTEwMy4yMzItMTkuNjIxLTE3Mi44MzUtMy42NDcgIGMtNC45NDksMS4xMzUtOC4xODQsNS44OTctNy40MTgsMTAuOTE3bDQsMjYuMThjMC43MTEsNC42NTUsNC42NjMsOC4xMjYsOS4zNyw4LjIzMWMwLjQ3NSwwLjAxLDAuODY1LDAuMDU4LDEuMTY0LDAuMTE1ICBjMS4zNzUsMzMuMDA0LDcuOTY4LDU1LjU2OCwyMC43MzgsNzAuOTgyYzEzLjY1NywxNi40ODQsMzQuMzY3LDI0LjUxMyw2My4zMTQsMjQuNTQzYzAuMDM2LDAsMC4wNzEsMCwwLjEwOSwwICBjMzUuNTk0LDAsNTkuNzkyLTE4LjkyLDczLjgyNy0zNC44MDJjMTUuNzM5LTE3LjgwOSwyNS4xNzEtMzkuMDc0LDI3LjUzNy01Mi4yNDljMC42MTktMy40NDYsMS40NzgtNC4zMDEsMS40ODItNC4zMDUgIGMwLjE0MS0wLjA5MiwwLjgzLTAuNCwzLjc0NS0wLjQ3OGMzLjAyLTAuMDc5LDMuMTMxLTAuMDgxLDQuODUxLDQuODIzYzAuMjk2LDAuODQ0LDAuNTgyLDEuNjU0LDAuODc5LDIuNDAzICBjMTEuNjk3LDI5LjU2NiwyMS45NjYsNTAuNiwzNi45OTksNjQuMDk2YzE1Ljg5NywxNC4yNzMsMzUuNDE4LDE4LjYxNSw1OS44MzYsMjAuNzQ0YzQuNDAxLDAuMzg0LDguNjE0LDAuNTc3LDEyLjY0MiwwLjU3NyAgYzI0LjI0NywwLDQxLjc4Ni02Ljk3NSw1My4zOTUtMjEuMTY5YzAuMjk1LTAuMzYxLDAuNTYxLTAuNzM1LDAuODQ0LTEuMWMwLjUxNyw2LjI5OSwwLjc4OSwxMi42MjksMC43ODksMTguOTY5ICBjMCwxMjYuMTEtMTAyLjU5OCwyMjguNzA3LTIyOC43MDcsMjI4LjcwN1MxOS4zOTcsMzgyLjEwOSwxOS4zOTcsMjU1Ljk5OVMxMjEuOTk0LDI3LjI5MiwyNDguMTAzLDI3LjI5MiAgYzUwLjUzLDAsOTguNDIzLDE2LjE0NSwxMzguNTAxLDQ2LjY5YzQuMjYsMy4yNDcsMTAuMzQ3LDIuNDI1LDEzLjU5Mi0xLjgzNWMzLjI0Ny00LjI2MSwyLjQyNi0xMC4zNDctMS44MzUtMTMuNTk0ICBjLTQzLjQ4NS0zMy4xNC05NS40NDQtNTAuNjU4LTE1MC4yNTktNTAuNjU4QzExMS4yOTksNy44OTQsMCwxMTkuMTk0LDAsMjU1Ljk5OXMxMTEuMjk5LDI0OC4xMDUsMjQ4LjEwMywyNDguMTA1ICBjMTM2LjgwNiwwLDI0OC4xMDUtMTExLjI5OSwyNDguMTA1LTI0OC4xMDVjMC0xOC4wOS0xLjk4LTM2LjEwOS01Ljg0MS01My42MjZjMC45NTgtNC40OTksMS43NS04Ljk2NywyLjUwNy0xMy4yODIgIGMxLjI5Mi03LjM0LDIuNTExLTE0LjI3NCw0LjMzNy0yMC4wODljMC40OTQtMS41NzEsMC44NDgtMi4zOTYsMS4wNi0yLjgxNGMwLjIyLTAuMDMsMC41MzctMC4wNTksMC45NjktMC4wNjkgIGM0LjgwOS0wLjEwNyw4LjgxMi0zLjcyLDkuNDA5LTguNDkzbDMuMjcyLTI2LjE4QzUxMi41NDgsMTI2LjQ1Miw1MDkuMjQ4LDEyMS44MSw1MDQuMzI2LDEyMC43NTl6IE00OTAuMjUsMTQ4LjQzOSAgYy03Ljk4MywzLjQxLTEwLjM3MiwxMS4wMTktMTEuNTQ1LDE0Ljc1NGMtMi4yMDIsNy4wMjEtMy41MjksMTQuNTU4LTQuOTMyLDIyLjUzOWMtMC42NDEsMy42NDUtMS4yNzYsNy4yMjktMS45NzUsMTAuNzE0ICBjLTAuOTc1LDEuNjk3LTEuNDQxLDMuNjg3LTEuMjQ3LDUuNzMzYy01LjU5NywyMy41NzgtMTYuNjE2LDQwLjk4LTU5LjcyNywzNy4yMjJjLTQ1LjU3NS0zLjk3NC01Ny42MS0xNC44MzgtODAuNDg0LTcyLjY1MiAgYy0wLjIwNy0wLjUyNC0wLjQwMy0xLjA5LTAuNjA5LTEuNjhjLTEuODgyLTUuMzY5LTYuMjM5LTE3LjgxMi0yMi43NjYtMTcuODEyYy0wLjMsMC0wLjYwNiwwLjAwNC0wLjkxNCwwLjAxMyAgYy01LjUxNywwLjE0OS0yMC4xNjgsMC41NDMtMjMuNzkzLDIwLjc0NWMtMy4yNzMsMTguMjI4LTI5Ljg3NSw3MS4wODEtODIuMjc1LDcxLjA4MWMtMC4wMjYsMC0wLjA1OCwwLTAuMDg0LDAgIGMtNDQuOTI4LTAuMDQ5LTYyLjQ2Ny0yMS4wMzUtNjQuNzEyLTc3LjQyOWMtMC4zMS03LjgyOS00Ljc3LTEzLjg2LTExLjczMi0xNi41OTlsLTEuNjEtMTAuNTM3ICBjNjEuNjMyLTEyLjQ3NSwxMTEuMDItNC43ODcsMTU1LjI5OCw1LjUzMWwxLjMyLDAuMzA4YzguMDI5LDEuODc4LDE3LjEzLDQuMDA1LDI2Ljg0Miw0LjMwMmMxNi4zMjIsMC40OTUsMzMuNzg1LTMuMjU3LDUwLjIzNS03LjM5ICBjNTIuODQxLTEzLjI3NCw5NC44NjUtNy44MTMsMTM2LjAyOSwwLjYyNUw0OTAuMjUsMTQ4LjQzOXoiLz4KPHBhdGggZD0iTTQwMy45NjksMzM0LjE1MmMwLTUuMzU2LTQuMzQxLTkuNjk5LTkuNjk5LTkuNjk5SDIwMS4yNjZjLTUuMzU4LDAtOS42OTksNC4zNDItOS42OTksOS42OTkgIGMwLDU4LjU2LDQ3LjY0MSwxMDYuMjAxLDEwNi4yMDEsMTA2LjIwMVM0MDMuOTY5LDM5Mi43MTIsNDAzLjk2OSwzMzQuMTUyeiBNMjExLjUwMywzNDMuODUxaDE3Mi41MzEgIGMtNC44MzYsNDMuMzE3LTQxLjY3OSw3Ny4xMDUtODYuMjY1LDc3LjEwNVMyMTYuMzM5LDM4Ny4xNjgsMjExLjUwMywzNDMuODUxeiIvPgo8Y2lyY2xlIGN4PSI0MTYuMzIiIGN5PSI4Ny4xMiIgcj0iOS42OTkiLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-cool:after{content:"Cool"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-idiotic{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPHBhdGggc3R5bGU9ImZpbGw6I0Y3OENDMjsiIGQ9Ik0yNDEuNjMzLDI4LjMyNGMtMjMuOTMsMC00Ni43MDQsNC45NDItNjcuMzY4LDEzLjg0OWMtMTAuMDgtMTIuNzAxLTI1LjY0LTIwLjg1Ny00My4xMTMtMjAuODU3ICBjLTMwLjM4OSwwLTU1LjAyNSwyNC42MzYtNTUuMDI1LDU1LjAyNWMwLDIuNDIsMC4xNzMsNC43OTgsMC40NzYsNy4xMzVjLTIuOTU0LTAuODc3LTYuMDc5LTEuMzU1LTkuMzE4LTEuMzU1ICBjLTE4LjA1NywwLTMyLjY5NCwxNC42MzgtMzIuNjk0LDMyLjY5M2MwLDE0LjI5OCw5LjE4MywyNi40NDQsMjEuOTY4LDMwLjg4NGMtMy4xMTMsNS4wMDUtNC45MTYsMTAuOTEtNC45MTYsMTcuMjM3ICBjMCwxMy40NDksOC4xMjMsMjQuOTk2LDE5LjcyOCwzMC4wMTZjLTAuMDYzLDEuOTA2LTAuMTA2LDMuODE3LTAuMTA2LDUuNzM4YzAsOTQuMDkxLDc2LjI3NiwxNzAuMzY4LDE3MC4zNjgsMTcwLjM2OCAgUzQxMiwyOTIuNzgyLDQxMiwxOTguNjkxQzQxMi4wMDEsMTA0LjYwMSwzMzUuNzI0LDI4LjMyNCwyNDEuNjMzLDI4LjMyNHoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0NDRTdBMDsiIGQ9Ik0yNjQuNDEsOC42NTdjLTE3Ljc4LDAtMzUuMDQ1LDIuMTk0LTUxLjU1NCw2LjMwMmMwLjQ4MSw1LjU3NCwwLjc0MSwxMS4yMTEsMC43NDEsMTYuOTEgIGMwLDk2LjI0My03MC4wNTcsMTc2LjExLTE2MS45NTQsMTkxLjQyMmMwLjk5MywxMTYuNjY5LDk1Ljg2MiwyMTAuOTQ1LDIxMi43NjcsMjEwLjk0NWMxMTcuNTIxLDAsMjEyLjc5LTk1LjI3LDIxMi43OS0yMTIuNzkgIEM0NzcuMiwxMDMuOTI1LDM4MS45Myw4LjY1NywyNjQuNDEsOC42NTd6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNBRUQ4OTM7IiBkPSJNMzEwLjAxLDQwMi44MjJjLTExMS4wMDEsMC0yMDIuMTM0LTg0Ljk5Ni0yMTEuOTA2LTE5My40NTMgIGMtMTQuNjI1LDYuNDg2LTMwLjIwMSwxMS4yMTItNDYuNDYxLDEzLjkyMWMwLjk5MywxMTYuNjY5LDk1Ljg2MiwyMTAuOTQ1LDIxMi43NjcsMjEwLjk0NWM1NC43MzQsMCwxMDQuNjM1LTIwLjY3MiwxNDIuMzM5LTU0LjYyNyAgQzM3Ny43MjUsMzk0LjQ1LDM0NC44NDUsNDAyLjgyMiwzMTAuMDEsNDAyLjgyMnoiLz4KPHBhdGggc3R5bGU9ImZpbGw6IzdGMTg0QzsiIGQ9Ik0zMTIuMzQ4LDI0Ny4xMTVMMzEyLjM0OCwyNDcuMTE1YzQ1LjkzLDAsODMuMTYzLDM3LjIzNCw4My4xNjMsODMuMTYzdjI1LjI5NUgyMjkuMTg1di0yNS4yOTUgIEMyMjkuMTg1LDI4NC4zNDksMjY2LjQxOSwyNDcuMTE1LDMxMi4zNDgsMjQ3LjExNXoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0I1RTU4OTsiIGQ9Ik0zMTIuMzQ4LDI4NS4yM0wzMTIuMzQ4LDI4NS4yM2MtMjYuOTUsMC00OC43OTYsMjEuODQ3LTQ4Ljc5Niw0OC43OTZ2NTUuOTE1djM3LjUxMnYyMS44MjQgIGMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1bDAsMGM4Ljk4MywwLDE2LjI2NS03LjI4MiwxNi4yNjUtMTYuMjY1djM3LjgwMmMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1ICBjOC45ODMsMCwxNi4yNjUtNy4yODIsMTYuMjY1LTE2LjI2NXYtMjMuMzczYzAsOC45ODMsNy4yODIsMTYuMjY1LDE2LjI2NSwxNi4yNjVjOC45ODMsMCwxNi4yNjUtNy4yODIsMTYuMjY1LTE2LjI2NXYtMzYuMjUyICBWNDA0LjM3di03MC4zNDJDMzYxLjE0NCwzMDcuMDc3LDMzOS4yOTgsMjg1LjIzLDMxMi4zNDgsMjg1LjIzeiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM4QkM2NzM7IiBkPSJNMzQ0Ljg3OCwzOTUuMTljLTE2LjA2MywwLTE2LjI2NSw3LjEwOC0xNi4yNjUsNy4xMDhjLTIuMjM1LDguMjMxLTcuMjgyLDE2LjI2NS0xNi4yNjUsMTYuMjY1ICAgcy0xNi4yNjUtNy4yODItMTYuMjY1LTE2LjI2NWMwLDAsMi43MjQtMjEuNTM1LTE2LjI2NS0yMS41MzVjLTguOTgzLDAtMTYuMjY1LTcuMjgyLTE2LjI2NS0xNi4yNjV2MjYuMDc2djM3LjUxMnYyMS44MjQgICBjMCw4Ljk4Myw3LjI4MiwxNi4yNjUsMTYuMjY1LDE2LjI2NWM4Ljk4MywwLDE2LjI2NS03LjI4MiwxNi4yNjUtMTYuMjY1djM3LjgwMWMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1ICAgYzguOTgzLDAsMTYuMjY1LTcuMjgyLDE2LjI2NS0xNi4yNjV2LTIzLjM3M2MwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1YzguOTgzLDAsMTYuMjY1LTcuMjgyLDE2LjI2NS0xNi4yNjV2LTM2LjI1MiAgIHYtMjMuMDg0di0yNi4wNzZDMzYxLjE0NCwzODcuOTA3LDM1My44NjIsMzk1LjE5LDM0NC44NzgsMzk1LjE5eiIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjMyNi4wNzYiIGN5PSIzNTEuMTM1IiByPSI4LjY1NyIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjMxNC4xMDciIGN5PSIzODcuMTU4IiByPSI4LjY1NyIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjI5MC4yOTYiIGN5PSIzNDIuNDc4IiByPSI4LjY1NyIvPgo8L2c+CjxwYXRoIGQ9Ik0yNjQuNDEsMGMtMTguMTEsMC0zNi4xNTgsMi4yMDctNTMuNjQ0LDYuNTU4Yy00LjEzLDEuMDI4LTYuOSw0LjkwNS02LjUzNCw5LjE0NmMwLjQ3MSw1LjQ0NiwwLjcwOSwxMC44ODQsMC43MDksMTYuMTY2ICBjMCw0NC4xNTYtMTUuNzgyLDg2LjkyNi00NC40MzcsMTIwLjQzM2MtMjEuNTM2LDI1LjE4My00OS4zMjIsNDQuMDI2LTgwLjE4Niw1NC43NTZjLTAuMTI2LTIuNjE1LTAuMTg3LTUuMzM0LTAuMTg3LTguMzY3ICBjMC0xLjYzNCwwLjAzMi0zLjM2NywwLjEwMi01LjQ1MmMwLjExOC0zLjU1NS0xLjk1MS02LjgxOS01LjIxNi04LjIzMmMtOC44MTQtMy44MTEtMTQuNTA3LTEyLjQ3Ni0xNC41MDctMjIuMDcxICBjMC00LjQ5LDEuMjQ4LTguODY5LDMuNjA5LTEyLjY2NGMxLjM5LTIuMjM1LDEuNjg5LTQuOTc5LDAuODEtNy40NjFjLTAuODc3LTIuNDc5LTIuODM2LTQuNDI2LTUuMzIxLTUuMjkgIGMtOS42NjEtMy4zNTQtMTYuMTUyLTEyLjQ4MS0xNi4xNTItMjIuNzA3YzAtMTMuMjU0LDEwLjc4NC0yNC4wMzYsMjQuMDM4LTI0LjAzNmMyLjMyLDAsNC42MjYsMC4zMzYsNi44NTQsMC45OTYgIGMyLjgwOCwwLjgzNyw1Ljg0NywwLjE5LDguMDc3LTEuNzA4YzIuMjMxLTEuOSwzLjM0Ny00Ljc5NywyLjk3MS03LjcwM2MtMC4yNzEtMi4wOTQtMC40MDQtNC4wNjQtMC40MDQtNi4wMjMgIGMwLTI1LjU2NiwyMC44LTQ2LjM2Nyw0Ni4zNjgtNDYuMzY3YzE0LjIyNSwwLDI3LjQ2OCw2LjQwOCwzNi4zMzMsMTcuNThjMi45NzEsMy43NDUsOC40MTcsNC4zNzEsMTIuMTYyLDEuNCAgYzMuNzQ0LTIuOTcxLDQuMzcyLTguNDE3LDEuNC0xMi4xNjJjLTEyLjE2OS0xNS4zMzYtMzAuMzU2LTI0LjEzMS00OS44OTYtMjQuMTMxYy0zNC4xNTIsMC02Mi4xMTEsMjcuMDE5LTYzLjYxNyw2MC44MDYgIGMtMC4wODMtMC4wMDEtMC4xNjYtMC4wMDEtMC4yNDktMC4wMDFjLTIyLjgwMSwwLTQxLjM1MSwxOC41NDktNDEuMzUxLDQxLjM1YzAsMTQuMzYxLDcuNDM5LDI3LjQ1OSwxOS4yMTMsMzQuOTI1ICBjLTEuNDIzLDQuMjI3LTIuMTU4LDguNjgxLTIuMTU4LDEzLjE5NmMwLDE0LjQ4Miw3LjUzOCwyNy43MjgsMTkuNjIzLDM1LjE4NmMtMC4wMDEsMC4xOS0wLjAwMSwwLjM4LTAuMDAxLDAuNTY4ICBjMCw0Ljg4MSwwLjE0NSw5LjE1NCwwLjQ2NCwxMy4zODJjLTQuMzExLDEuMDQ2LTguNjY2LDEuOTQ2LTEzLjA2LDIuNjc4Yy00LjIwMiwwLjcwMS03LjI3LDQuMzUzLTcuMjM1LDguNjEzICBjMC40OTcsNTguNDM0LDIzLjU0LDExMy4zNzcsNjQuODgyLDE1NC43MDRjMzkuNTIxLDM5LjUwOCw5MS40OCw2Mi4yNjksMTQ3LjAyNiw2NC42MDh2Ni42YzAsMTMuNzQyLDExLjE4MSwyNC45MjMsMjQuOTIzLDI0LjkyMyAgYzIuNjUyLDAsNS4yMDktMC40MTcsNy42MDktMS4xODd2MTQuMDY1YzAsMTMuNzQyLDExLjE4MSwyNC45MjMsMjQuOTIyLDI0LjkyM2MxMy42MjIsMCwyNC43MjYtMTAuOTg2LDI0LjkyMS0yNC41NiAgYzIuNCwwLjc3MSw0Ljk1NywxLjE4OCw3LjYxMSwxLjE4OGMxMy43NDIsMCwyNC45MjItMTEuMTgxLDI0LjkyMi0yNC45MjN2LTk5LjQ3NWgyNS43MTFjNC43ODIsMCw4LjY1Ny0zLjg3NSw4LjY1Ny04LjY1N3YtMjUuMjk1ICBjMC01MC42My00MS4xOTItOTEuODItOTEuODIxLTkxLjgycy05MS44Miw0MS4xOS05MS44Miw5MS44MnYyNS4yOTVjMCw0Ljc4MiwzLjg3NSw4LjY1Nyw4LjY1Nyw4LjY1N2gyNS43MXY2MS4xMTcgIGMtNTAuOTIyLTIuMzI4LTk4LjUzMS0yMy4yODEtMTM0Ljc4Ni01OS41MjNjLTM2LjQtMzYuMzg4LTU3LjQxMS04NC4yMjEtNTkuNjIxLTEzNS4zNzRjNDMuODc2LTkuMDI0LDgzLjgzMi0zMi41ODUsMTEzLjE3My02Ni44OTQgIGMzMS4zMzYtMzYuNjQxLDQ4LjU5NC04My40MDgsNDguNTk0LTEzMS42ODdjMC0zLjMzMy0wLjA4Ny02LjcyMS0wLjI1OS0xMC4xMzJjMTMuODk5LTIuOTM3LDI4LjEzMy00LjQyNCw0Mi40MTMtNC40MjQgIGMxMTIuNTYsMCwyMDQuMTMzLDkxLjU3MywyMDQuMTMzLDIwNC4xMzJjMCw1MS41MTktMTkuMjQ2LDEwMC43MTYtNTQuMTkzLDEzOC41MjRjLTMuMjQ2LDMuNTExLTMuMDMsOC45ODgsMC40ODEsMTIuMjMzICBjMy41MTEsMy4yNDYsOC45ODksMy4wMzEsMTIuMjM0LTAuNDgxYzM3LjkxMi00MS4wMTcsNTguNzkyLTk0LjM4Niw1OC43OTItMTUwLjI3NUM0ODUuODU2LDk5LjM0LDM4Ni41MTcsMCwyNjQuNDEsMHogICBNMzUyLjQ4Nyw0NjMuNzA0YzAsNC4xOTctMy40MTMsNy42MS03LjYwOSw3LjYxYy00LjE5NiwwLTcuNjA5LTMuNDEzLTcuNjA5LTcuNjFjMC00Ljc4Mi0zLjg3NS04LjY1Ny04LjY1Ny04LjY1NyAgYy00Ljc4MiwwLTguNjU3LDMuODc1LTguNjU3LDguNjU3djIzLjM3M2MwLDQuMTk3LTMuNDE0LDcuNjEtNy42MSw3LjYxYy00LjE5NiwwLTcuNjA5LTMuNDEzLTcuNjA5LTcuNjF2LTM3LjgwMSAgYzAtNC43ODItMy44NzUtOC42NTctOC42NTctOC42NTdzLTguNjU3LDMuODc1LTguNjU3LDguNjU3YzAsNC4xOTctMy40MTMsNy42MS03LjYwOSw3LjYxYy00LjE5NywwLTcuNjEtMy40MTMtNy42MS03LjYxVjMzNC4wMjYgIGMwLTIyLjEzMywxOC4wMDctNDAuMTM5LDQwLjEzOS00MC4xMzljMjIuMTMyLDAsNDAuMTM5LDE4LjAwNyw0MC4xMzksNDAuMTM5djEyOS42NzhIMzUyLjQ4N3ogTTIzNy44NDEsMzQ2LjkxNnYtMTYuNjM4ICBjMC00MS4wODMsMzMuNDI0LTc0LjUwNyw3NC41MDctNzQuNTA3YzQxLjA4NCwwLDc0LjUwOCwzMy40MjQsNzQuNTA4LDc0LjUwN3YxNi42MzhoLTE3LjA1NXYtMTIuODkgIGMwLTMxLjY3OS0yNS43NzItNTcuNDUyLTU3LjQ1Mi01Ny40NTJzLTU3LjQ1MiwyNS43NzQtNTcuNDUyLDU3LjQ1MnYxMi44OUgyMzcuODQxeiIvPgo8cGF0aCBkPSJNMjUyLjI0NCwxNzAuMDIzYy0zLjM4Mi0zLjM4LTguODYyLTMuMzgtMTIuMjQzLDBsLTE2LjQ1OSwxNi40NTlsLTE2LjQ1OS0xNi40NTljLTMuMzgyLTMuMzgtOC44NjItMy4zOC0xMi4yNDMsMCAgYy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0M2wxNi40NTksMTYuNDU5bC0xNi40NTksMTYuNDU5Yy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0MyAgYzEuNjkxLDEuNjksMy45MDcsMi41MzUsNi4xMjIsMi41MzVjMi4yMTUsMCw0LjQzMS0wLjg0NSw2LjEyMi0yLjUzNWwxNi40NTktMTYuNDU5bDE2LjQ1OSwxNi40NTkgIGMxLjY5MSwxLjY5LDMuOTA3LDIuNTM1LDYuMTIyLDIuNTM1czQuNDMxLTAuODQ1LDYuMTIyLTIuNTM1YzMuMzgxLTMuMzgyLDMuMzgxLTguODYyLDAtMTIuMjQzbC0xNi40NTktMTYuNDU5bDE2LjQ1OS0xNi40NTkgIEMyNTUuNjI0LDE3OC44ODQsMjU1LjYyNCwxNzMuNDAzLDI1Mi4yNDQsMTcwLjAyM3oiLz4KPHBhdGggZD0iTTQxNi4xNDIsMjE1LjE4NGwtMTYuNDU5LTE2LjQ1OWwxNi40NTktMTYuNDU5YzMuMzgxLTMuMzgyLDMuMzgxLTguODYyLDAtMTIuMjQzYy0zLjM4Mi0zLjM4LTguODYyLTMuMzgtMTIuMjQzLDAgIGwtMTYuNDU5LDE2LjQ1OWwtMTYuNDU5LTE2LjQ1OWMtMy4zODItMy4zOC04Ljg2Mi0zLjM4LTEyLjI0MywwYy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0M2wxNi40NTksMTYuNDU5bC0xNi40NTksMTYuNDU5ICBjLTMuMzgxLDMuMzgyLTMuMzgxLDguODYyLDAsMTIuMjQzYzEuNjkxLDEuNjksMy45MDcsMi41MzUsNi4xMjIsMi41MzVjMi4yMTUsMCw0LjQzMS0wLjg0NSw2LjEyMi0yLjUzNWwxNi40NTktMTYuNDU5ICBsMTYuNDU5LDE2LjQ1OWMxLjY5MSwxLjY5LDMuOTA3LDIuNTM1LDYuMTIyLDIuNTM1czQuNDMxLTAuODQ1LDYuMTIyLTIuNTM1QzQxOS41MjMsMjI0LjA0NCw0MTkuNTIzLDIxOC41NjQsNDE2LjE0MiwyMTUuMTg0eiIvPgo8cGF0aCBkPSJNMTU3LjA2Myw5NC40MDhjMS41ODQsMi44NDQsNC41MzEsNC40NDcsNy41Nyw0LjQ0NmMxLjQyNCwwLDIuODcxLTAuMzUzLDQuMjA1LTEuMDk1YzQuMTc3LTIuMzI3LDUuNjc2LTcuNTk4LDMuMzUtMTEuNzc0ICBjLTUuMTgtOS4zMDItMTUuMDA4LTE1LjA3OS0yNS42NDktMTUuMDc5Yy0xMC4zMjIsMC0yMC4xNDQsNS42ODctMjUuNjMyLDE0Ljg0Yy0yLjQ1OCw0LjEwMS0xLjEyOCw5LjQxNywyLjk3MywxMS44NzYgIGM0LjEwMiwyLjQ1Nyw5LjQxNiwxLjEyNywxMS44NzYtMi45NzNjMi4zNzgtMy45NjYsNi41MS02LjQyOSwxMC43ODMtNi40MjlDMTUwLjkwMiw4OC4yMTgsMTU0LjkzNSw5MC41OSwxNTcuMDYzLDk0LjQwOHoiLz4KPHBhdGggZD0iTTEwNy44MzksMTI0LjgwNGMtOC43NDksNS40NzktMTQuMDU0LDE1LjUxMS0xMy44NDUsMjYuMTg1YzAuMDkzLDQuNzIzLDMuOTUsOC40ODgsOC42NTIsOC40ODggIGMwLjA1OCwwLDAuMTE1LDAsMC4xNzItMC4wMDFjNC43ODEtMC4wOTUsOC41OC00LjA0Niw4LjQ4Ny04LjgyNWMtMC4wOTEtNC42MjQsMi4xMDItOC45MDUsNS43MjQtMTEuMTc0ICBjMy42OTgtMi4zMTUsOC4zNzMtMi40NDcsMTIuMjA1LTAuMzM5YzQuMTg3LDIuMzA0LDkuNDUyLDAuNzc3LDExLjc1OC0zLjQxMmMyLjMwNC00LjE4OSwwLjc3Ny05LjQ1Mi0zLjQxMi0xMS43NTggIEMxMjguMjUsMTE4LjgzMywxMTYuODUyLDExOS4xNTQsMTA3LjgzOSwxMjQuODA0eiIvPgo8Y2lyY2xlIGN4PSIzOTguMDg4IiBjeT0iMzg1LjYzNCIgcj0iOC42NTciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-idiotic:after{content:"Idiotic"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-sad{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRkRERjZEOyIgY3g9IjI1Ni4wMDIiIGN5PSIyNTYuMDAxIiByPSIyNDUuOTk0Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGQ0M1NkI7IiBkPSJNMzA4LjcxNSw0NjUuNjc3Yy0xMzUuODU4LDAtMjQ1Ljk5My0xMTAuMTM0LTI0NS45OTMtMjQ1Ljk5MyAgYzAtNzIuNTg0LDMxLjQ0My0xMzcuODE2LDgxLjQ0NC0xODIuODQyQzY0LjUyOCw3Ny41NjIsMTAuMDA4LDE2MC40MTIsMTAuMDA4LDI1NmMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkzLDI0NS45OTMsMjQ1Ljk5MyAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk4LDE2NC41NDktNjMuMTQ5QzM4Ni45OTcsNDU1Ljk5OCwzNDguOTg4LDQ2NS42NzcsMzA4LjcxNSw0NjUuNjc3eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMzY3LjkxNCw0MTcuMjM2SDI0OC40NTZjLTUuNTI4LDAtMTAuMDA3LTQuNDc5LTEwLjAwNy0xMC4wMDdzNC40NzktMTAuMDA3LDEwLjAwNy0xMC4wMDdoMTE5LjQ1NyAgIGM1LjUyOCwwLDEwLjAwNyw0LjQ3OSwxMC4wMDcsMTAuMDA3UzM3My40NDIsNDE3LjIzNiwzNjcuOTE0LDQxNy4yMzZ6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTIyMS4wODYsMzE0LjI0OWMtMjQuMzM3LDAtNDYuMzI1LTYuMjI3LTU4LjgxNy0xNi42NThjLTQuMjQzLTMuNTQxLTQuODEtOS44NTMtMS4yNjgtMTQuMDk0ICAgYzMuNTQxLTQuMjQyLDkuODUxLTQuODEsMTQuMDk0LTEuMjY4YzguNzM2LDcuMjkzLDI2Ljc4OCwxMi4wMDYsNDUuOTksMTIuMDA2YzE4Ljc0MywwLDM3LjA0My00LjgwMiw0Ni42MjEtMTIuMjMyICAgYzQuMzY2LTMuMzg4LDEwLjY1LTIuNTk0LDE0LjA0LDEuNzczYzMuMzg4LDQuMzY2LDIuNTk0LDEwLjY1Mi0xLjc3MywxNC4wNEMyNjYuNzExLDMwOC4xMDYsMjQ0LjY5NiwzMTQuMjQ5LDIyMS4wODYsMzE0LjI0OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMzk0LjY3MywzMTQuMjQ5Yy0yNC4zMzcsMC00Ni4zMjUtNi4yMjctNTguODE3LTE2LjY1OGMtNC4yNDMtMy41NDEtNC44MS05Ljg1My0xLjI2OC0xNC4wOTQgICBzOS44NTMtNC44MSwxNC4wOTQtMS4yNjhjOC43MzYsNy4yOTMsMjYuNzg4LDEyLjAwNiw0NS45OSwxMi4wMDZjMTguNzQzLDAsMzcuMDQzLTQuODAyLDQ2LjYyMS0xMi4yMzIgICBjNC4zNjUtMy4zODgsMTAuNjUyLTIuNTk0LDE0LjA0LDEuNzczYzMuMzg4LDQuMzY2LDIuNTk0LDEwLjY1Mi0xLjc3MywxNC4wNEM0NDAuMjk3LDMwOC4xMDYsNDE4LjI4MywzMTQuMjQ5LDM5NC42NzMsMzE0LjI0OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMTczLjY5MSwyNjMuMDRjLTMuNzE5LDAtNy4xOC0wLjQxOC0xMC4yNjUtMS4yNzJjLTUuMzI3LTEuNDczLTguNDUtNi45ODYtNi45NzctMTIuMzE0ICAgYzEuNDc0LTUuMzI3LDYuOTkyLTguNDUyLDEyLjMxNC02Ljk3N2M0LjkyNiwxLjM2NSwxNS4wMzYsMC40MDcsMjYuNTIyLTQuODA0YzExLjI0My01LjA5NywxOC44NzUtMTIuMzEsMjEuNDUyLTE3LjE5NSAgIGMyLjU3OC00Ljg5LDguNjMtNi43NjQsMTMuNTE5LTQuMTg0YzQuODg5LDIuNTc4LDYuNzYyLDguNjMyLDQuMTg0LDEzLjUxOWMtNS4yNDQsOS45NDMtMTYuNzkxLDE5LjY5Ni0zMC44ODksMjYuMDg5ICAgQzE5My4yNDcsMjYwLjU3NSwxODIuNzE1LDI2My4wNCwxNzMuNjkxLDI2My4wNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNNDM5LjQ5LDI2My4wNGMtOS4wMjUsMC0xOS41NTQtMi40NjQtMjkuODYyLTcuMTM5Yy0xNC4wOTctNi4zOTEtMjUuNjQ0LTE2LjE0NC0zMC44ODctMjYuMDg3ICAgYy0yLjU3OS00Ljg4OC0wLjcwNS0xMC45NDEsNC4xODQtMTMuNTE5YzQuODg5LTIuNTgyLDEwLjk0MS0wLjcwMywxMy41MTksNC4xODRjMi41NzgsNC44ODUsMTAuMjA5LDEyLjA5NywyMS40NDksMTcuMTk0ICAgYzExLjQ4Nyw1LjIxLDIxLjYsNi4xNjksMjYuNTIyLDQuODA1YzUuMzMzLTEuNDY5LDEwLjg0LDEuNjQ5LDEyLjMxNCw2Ljk3NmMxLjQ3Myw1LjMyNy0xLjY0OSwxMC44NC02Ljk3NiwxMi4zMTQgICBDNDQ2LjY3LDI2Mi42MjEsNDQzLjIwOCwyNjMuMDQsNDM5LjQ5LDI2My4wNHoiLz4KPC9nPgo8cGF0aCBkPSJNMzU1LjU2MiwyMC4wODRjLTUuMDg4LTIuMTUyLTEwLjk2MSwwLjIzMi0xMy4xMTIsNS4zMjNzMC4yMzIsMTAuOTYzLDUuMzIzLDEzLjExMiAgYzg3LjYwNiwzNy4wMTUsMTQ0LjIxNCwxMjIuMzgyLDE0NC4yMTQsMjE3LjQ4YzAsMTMwLjEyNC0xMDUuODYyLDIzNS45ODUtMjM1Ljk4NCwyMzUuOTg1UzIwLjAxNSwzODYuMTIyLDIwLjAxNSwyNTUuOTk5ICBTMTI1Ljg3OCwyMC4wMTUsMjU2LjAwMSwyMC4wMTVjNS41MjgsMCwxMC4wMDctNC40NzksMTAuMDA3LTEwLjAwN1MyNjEuNTI5LDAsMjU2LjAwMSwwYy0xNDEuMTYsMC0yNTYsMTE0Ljg0LTI1NiwyNTUuOTk5ICBjMCwxNDEuMTYsMTE0Ljg0LDI1Ni4wMDEsMjU2LDI1Ni4wMDFjMTQxLjE1OCwwLDI1NS45OTktMTE0Ljg0LDI1NS45OTktMjU2QzUxMi4wMDEsMTUyLjgzOSw0NTAuNTk0LDYwLjIzNiwzNTUuNTYyLDIwLjA4NHoiLz4KPHBhdGggZD0iTTI0OC40NTYsMzk3LjIyMmMtNS41MjgsMC0xMC4wMDcsNC40NzktMTAuMDA3LDEwLjAwN3M0LjQ3OSwxMC4wMDcsMTAuMDA3LDEwLjAwN2gxMTkuNDU3ICBjNS41MjgsMCwxMC4wMDctNC40NzksMTAuMDA3LTEwLjAwN3MtNC40NzktMTAuMDA3LTEwLjAwNy0xMC4wMDdIMjQ4LjQ1NnoiLz4KPHBhdGggZD0iTTE3NS4wOTcsMjgyLjIzYy00LjI0NC0zLjU0NC0xMC41NTMtMi45NzQtMTQuMDk0LDEuMjY4Yy0zLjU0Myw0LjI0My0yLjk3NCwxMC41NTMsMS4yNjgsMTQuMDk0ICBjMTIuNDkyLDEwLjQzLDM0LjQ4LDE2LjY1OCw1OC44MTcsMTYuNjU4YzIzLjYwOSwwLDQ1LjYyNC02LjE0Myw1OC44ODktMTYuNDMyYzQuMzY3LTMuMzg4LDUuMTYxLTkuNjc0LDEuNzczLTE0LjA0ICBjLTMuMzg5LTQuMzY5LTkuNjc0LTUuMTYtMTQuMDQtMS43NzNjLTkuNTc5LDcuNDI5LTI3Ljg3OSwxMi4yMzItNDYuNjIxLDEyLjIzMkMyMDEuODg1LDI5NC4yMzYsMTgzLjgzMiwyODkuNTIyLDE3NS4wOTcsMjgyLjIzeiIvPgo8cGF0aCBkPSJNMzM1Ljg1NywyOTcuNTkyYzEyLjQ5MiwxMC40MywzNC40OCwxNi42NTgsNTguODE3LDE2LjY1OGMyMy42MDksMCw0NS42MjQtNi4xNDMsNTguODg5LTE2LjQzMiAgYzQuMzY3LTMuMzg4LDUuMTYxLTkuNjc0LDEuNzczLTE0LjA0Yy0zLjM4OC00LjM2OS05LjY3NS01LjE2LTE0LjA0LTEuNzczYy05LjU3OSw3LjQyOS0yNy44NzksMTIuMjMyLTQ2LjYyMSwxMi4yMzIgIGMtMTkuMjAyLDAtMzcuMjU0LTQuNzEzLTQ1Ljk5LTEyLjAwNmMtNC4yNDMtMy41NDQtMTAuNTUyLTIuOTc0LTE0LjA5NCwxLjI2OEMzMzEuMDQ2LDI4Ny43MzksMzMxLjYxNCwyOTQuMDUxLDMzNS44NTcsMjk3LjU5MnoiLz4KPHBhdGggZD0iTTE3My42OTEsMjYzLjA0YzkuMDI0LDAsMTkuNTU0LTIuNDYzLDI5Ljg1OS03LjEzNmMxNC4wOTgtNi4zOTMsMjUuNjQ3LTE2LjE0NSwzMC44ODktMjYuMDg4ICBjMi41NzktNC44ODgsMC43MDUtMTAuOTQxLTQuMTg0LTEzLjUxOWMtNC44ODktMi41ODItMTAuOTQxLTAuNzA1LTEzLjUxOSw0LjE4NGMtMi41NzgsNC44ODUtMTAuMjA5LDEyLjA5Ny0yMS40NTIsMTcuMTk0ICBjLTExLjQ4Niw1LjIxLTIxLjU5NSw2LjE3LTI2LjUyMSw0LjgwNGMtNS4zMjMtMS40NjgtMTAuODQsMS42NDktMTIuMzE0LDYuOTc2Yy0xLjQ3Myw1LjMyNSwxLjY0OCwxMC44NCw2Ljk3NiwxMi4zMTQgIEMxNjYuNTEsMjYyLjYyMSwxNjkuOTcyLDI2My4wNCwxNzMuNjkxLDI2My4wNHoiLz4KPHBhdGggZD0iTTQwOS42MywyNTUuOTA0YzEwLjMwOCw0LjY3MywyMC44MzcsNy4xMzYsMjkuODYxLDcuMTM2YzMuNzE3LDAsNy4xODEtMC40MTgsMTAuMjY2LTEuMjczICBjNS4zMjUtMS40NzQsOC40NDgtNi45ODgsNi45NzMtMTIuMzE0Yy0xLjQ3NC01LjMyNS02Ljk4LTguNDUtMTIuMzE0LTYuOTczYy00LjkyMSwxLjM1Ny0xNS4wMzEsMC40MDYtMjYuNTIxLTQuODA1ICBjLTExLjI0LTUuMDk2LTE4Ljg3My0xMi4zMDktMjEuNDQ5LTE3LjE5NGMtMi41NzgtNC44ODktOC42My02Ljc2NS0xMy41MTktNC4xODRjLTQuODg5LDIuNTc4LTYuNzYyLDguNjMyLTQuMTg0LDEzLjUxOSAgQzM4My45ODQsMjM5Ljc2LDM5NS41MzEsMjQ5LjUxMSw0MDkuNjMsMjU1LjkwNHoiLz4KPGNpcmNsZSBjeD0iMzE5LjEwMiIgY3k9IjE4Ljg0MSIgcj0iMTAuMDA3Ii8+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-sad:after{content:"Sad"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-angry{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRkM0QzU5OyIgY3g9IjI1Ni4wMDEiIGN5PSIyNTYuMDAxIiByPSIyNDUuOTk0Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNCQzNCNEE7IiBkPSJNMzA4LjcxNiw0NjUuNjc4Yy0xMzUuODU4LDAtMjQ1Ljk5My0xMTAuMTM0LTI0NS45OTMtMjQ1Ljk5MyAgYzAtNzIuNTg0LDMxLjQ0My0xMzcuODE2LDgxLjQ0NC0xODIuODQyQzY0LjUyNyw3Ny41NjIsMTAuMDA3LDE2MC40MTQsMTAuMDA3LDI1NmMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkzLDI0NS45OTMsMjQ1Ljk5MyAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk4LDE2NC41NDktNjMuMTQ5QzM4Ni45OTgsNDU1Ljk5OSwzNDguOTg3LDQ2NS42NzgsMzA4LjcxNiw0NjUuNjc4eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojN0MxNTJFOyIgZD0iTTQwMS41NTksNDA2LjExNGMtMy41MTMsMC4wMDEtNi45MjEtMS44NTItOC43NTItNS4xNGMtMTIuMjMtMjEuOTUzLTM1LjQyMS0zNS41OTMtNjAuNTItMzUuNTkzICBjLTI0LjQ1MSwwLTQ3Ljg4MiwxMy43NDUtNjEuMTQ2LDM1Ljg2OWMtMi44NDMsNC43MzktOC45OTIsNi4yNzUtMTMuNzI5LDMuNDM3Yy00Ljc0MS0yLjg0Mi02LjI3OS04Ljk4OC0zLjQzNy0xMy43MjkgIGMxNi44NjItMjguMTIyLDQ2Ljg2OS00NS41OTIsNzguMzEyLTQ1LjU5MmMzMi4zNTYsMCw2Mi4yNDYsMTcuNTc2LDc4LjAwNSw0NS44NjhjMi42OSw0LjgyOCwwLjk1NywxMC45MjMtMy44NzIsMTMuNjExICBDNDA0Ljg3Nyw0MDUuNzA2LDQwMy4yMDUsNDA2LjExNCw0MDEuNTU5LDQwNi4xMTR6Ii8+CjxnPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojRkZGRkZGOyIgY3g9IjI1NS40ODEiIGN5PSIyNTAuNTcxIiByPSIyNy4yOTYiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI0MDEuNTQ4IiBjeT0iMjQzLjE5MiIgcj0iMjcuMjk2Ii8+CjwvZz4KPGc+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0MxNTJFOyIgZD0iTTI1NS45NjUsMjg3Ljg5NGMtNC41NDksMC05LjEwOS0wLjgxNC0xMy41MDEtMi40NWMtOS42NjgtMy42MDEtMTcuMzU1LTEwLjc1Mi0yMS42NDUtMjAuMTMzICAgYy00LjMyNy05LjQ2My00LjQwNy0yMC43ODktMC4yMjEtMzEuMDc1YzIuMjc2LTUuNTkyLDUuNzExLTEwLjU2OCw5Ljk4NS0xNC42MDdjLTEuNzkxLTAuOTE5LTMuNjA4LTEuODU3LTUuNDQ5LTIuODEzICAgYy02LjgzNC0zLjU0OC0xMi4zMjgtNi43OTItMTcuNjQtOS45MjdjLTYuMjgxLTMuNzA3LTEyLjc3Ni03LjU0LTIyLjAwNS0xMi4yMTZjLTQuOTMtMi40OTctNi45MDQtOC41MTgtNC40MDYtMTMuNDQ5ICAgYzIuNDk4LTQuOTMyLDguNTE4LTYuOTA1LDEzLjQ1LTQuNDA2YzkuODA1LDQuOTY1LDE2LjU4Miw4Ljk2NywyMy4xMzYsMTIuODM1YzUuMzE2LDMuMTM4LDEwLjMzOCw2LjEwMiwxNi42OSw5LjQgICBjNC4yNzEsMi4yMTgsOC40MTIsNC4zMzMsMTIuMzkzLDYuMzY2YzE3LjAzLDguNywzMS43MzgsMTYuMjEzLDQxLjUyOCwyNC4xNTZjMS4xOTcsMC45NzMsMi4xNTQsMi4yMDcsMi43OTUsMy42MDkgICBjNC4yOTEsOS4zODMsNC42NywxOS44NzYsMS4wNywyOS41NDRjLTMuNjAxLDkuNjY3LTEwLjc1MywxNy4zNTUtMjAuMTM1LDIxLjY0NUMyNjYuODg1LDI4Ni43MTcsMjYxLjQzMywyODcuODk0LDI1NS45NjUsMjg3Ljg5NHogICAgTTI1MC44MDQsMjMwLjAyNGMtNS4yODksMi4wODYtOS40Myw2LjI1NS0xMS42NjksMTEuNzU4Yy0yLjExNSw1LjE5OC0yLjE1OCwxMC43NDEtMC4xMTUsMTUuMjA2ICAgYzIuMDY3LDQuNTIxLDUuNzcxLDcuOTY2LDEwLjQyOSw5LjcwMmM0LjY1NCwxLjczMiw5LjcxLDEuNTUyLDE0LjIzMy0wLjUxNWM0LjUyMi0yLjA2OCw3Ljk2Ny01Ljc3Miw5LjcwMi0xMC40MyAgIGMxLjQ3NC0zLjk2LDEuNTY0LTguMjA2LDAuMjg3LTEyLjE2OUMyNjcuOTM5LDIzOS4zMTgsMjYwLjAxOCwyMzQuODU4LDI1MC44MDQsMjMwLjAyNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3QzE1MkU7IiBkPSJNNDAyLjg1OSwyODEuMDgyYy01LjQ2OSwwLTEwLjkyMS0xLjE3Ny0xNi4wNDItMy41MmMtOS4zODItNC4yOS0xNi41MzMtMTEuOTc4LTIwLjEzNS0yMS42NDUgICBjLTMuNi05LjY2OC0zLjIyMS0yMC4xNiwxLjA3LTI5LjU0NGMwLjcwNS0xLjU0MSwxLjc5MS0yLjg3OSwzLjE1NC0zLjg4N2MxMC41MTgtNy43NywyNC40MS0xNS44NDgsNDEuMjg2LTI0LjAwNyAgIGMyNS4zMjgtMTIuMjQ2LDI3LjAxMi0xMy4yMzQsNDcuNjA4LTI1LjMxNmwzLjEyOS0xLjgzNWM0Ljc2Ny0yLjc5NywxMC44OTktMS4xOTcsMTMuNjk1LDMuNTcxICAgYzIuNzk3LDQuNzY3LDEuMTk3LDEwLjktMy41NzEsMTMuNjk1bC0zLjEyNiwxLjgzM2MtMTguMjY1LDEwLjcxNS0yMi4xNjcsMTMuMDAzLTQwLjQ5OCwyMS45MzUgICBjMy42NTIsMy40OCw2LjU5OCw3LjYzOSw4LjY5LDEyLjM0NWM0LjczNCwxMC42NDYsNC42OSwyMy4yNzgtMC4xMTYsMzMuNzg5Yy00LjI5LDkuMzgyLTExLjk3OCwxNi41MzQtMjEuNjQ1LDIwLjEzNSAgIEM0MTEuOTY5LDI4MC4yNjgsNDA3LjQwOSwyODEuMDgyLDQwMi44NTksMjgxLjA4MnogTTM4NS4xLDIzNi45MjNjLTEuMjI0LDMuOTE4LTEuMTE4LDguMTAyLDAuMzM4LDEyLjAwOSAgIGMxLjczNiw0LjY1OCw1LjE4MSw4LjM2Myw5LjcwMiwxMC40M2M0LjUyMSwyLjA2Niw5LjU3OCwyLjI0NywxNC4yMzMsMC41MTVjNC42NTgtMS43MzYsOC4zNjMtNS4xODEsMTAuNDMtOS43MDIgICBjMi40MTktNS4yOTEsMi40My0xMS45MzMsMC4wMjgtMTcuMzM1Yy0xLjQ4OS0zLjM0OS00LjU4Ni03LjcxMi0xMC45NjUtMTAuMjU2QzM5OS42MTUsMjI3LjQ4OCwzOTEuNjYsMjMyLjI4NywzODUuMSwyMzYuOTIzeiIvPgo8L2c+CjxwYXRoIGQ9Ik00NzAuNDU2LDExNi4xNDVDNDQzLjk3OCw3NS42MjUsNDA2LjgsNDMuNTMzLDM2Mi45NCwyMy4zNDFjLTUuMDI0LTIuMzEtMTAuOTY0LTAuMTE1LTEzLjI3NSw0LjkwNSAgYy0yLjMxMSw1LjAyMS0wLjExNSwxMC45NjUsNC45MDUsMTMuMjc1YzQwLjQzOCwxOC42MTUsNzQuNzE2LDQ4LjIwNiw5OS4xMzMsODUuNTcyQzQ3OC43NDksMTY1LjQyNSw0OTEuOTg3LDIxMCw0OTEuOTg3LDI1NiAgYzAsMTMwLjEyNC0xMDUuODYzLDIzNS45ODQtMjM1Ljk4NSwyMzUuOTg0UzIwLjAxNSwzODYuMTI0LDIwLjAxNSwyNTYuMDAxUzEyNS44NzYsMjAuMDE1LDI1NiwyMC4wMTUgIGM1LjUyOCwwLDEwLjAwNy00LjQ3OSwxMC4wMDctMTAuMDA3UzI2MS41MjgsMCwyNTYsMEMxMTQuODQsMCwwLDExNC44NDIsMCwyNTYuMDAxQzAsMzk3LjE2LDExNC44NCw1MTIsMjU2LDUxMiAgczI1Ni0xMTQuODQsMjU2LTI1NS45OTlDNTEyLDIwNi4xMDEsNDk3LjYzNSwxNTcuNzQsNDcwLjQ1NiwxMTYuMTQ1eiIvPgo8cGF0aCBkPSJNMjUzLjk3MywzOTAuOTZjLTIuODQyLDQuNzQxLTEuMzA0LDEwLjg4NywzLjQzNywxMy43MjljNC43MzcsMi44MzksMTAuODg1LDEuMzAyLDEzLjcyOS0zLjQzNyAgYzEzLjI2NC0yMi4xMjQsMzYuNjk1LTM1Ljg2OSw2MS4xNDYtMzUuODY5YzI1LjEwMSwwLDQ4LjI5LDEzLjYzOSw2MC41MiwzNS41OTNjMS44MzEsMy4yODgsNS4yMzgsNS4xNDEsOC43NTIsNS4xNCAgYzEuNjQ3LDAsMy4zMTgtMC40MDgsNC44NjEtMS4yNjZjNC44MjktMi42OSw2LjU2Mi04Ljc4NCwzLjg3Mi0xMy42MTFjLTE1Ljc2LTI4LjI5My00NS42NS00NS44NjgtNzguMDA1LTQ1Ljg2OCAgQzMwMC44NDIsMzQ1LjM2OCwyNzAuODM1LDM2Mi44MzgsMjUzLjk3MywzOTAuOTZ6Ii8+CjxwYXRoIGQ9Ik0yMzQuMzU3LDE5OS4wNTNjLTYuMzUxLTMuMjk4LTExLjM3Mi02LjI2Mi0xNi42OS05LjRjLTYuNTU0LTMuODY4LTEzLjMzMS03Ljg3LTIzLjEzNi0xMi44MzUgIGMtNC45My0yLjQ5OS0xMC45NTItMC41MjctMTMuNDUsNC40MDZjLTIuNDk4LDQuOTMtMC41MjQsMTAuOTUyLDQuNDA2LDEzLjQ0OWM5LjIyOSw0LjY3NSwxNS43MjUsOC41MDksMjIuMDA2LDEyLjIxNiAgYzUuMzEyLDMuMTM3LDEwLjgwNyw2LjM3OSwxNy42NCw5LjkyN2MxLjg0MSwwLjk1NywzLjY1OSwxLjg5Myw1LjQ0OSwyLjgxM2MtNC4yNzQsNC4wMzktNy43MSw5LjAxNS05Ljk4NSwxNC42MDcgIGMtNC4xODYsMTAuMjg2LTQuMTA2LDIxLjYxMiwwLjIyMSwzMS4wNzVjNC4yOSw5LjM4MiwxMS45NzcsMTYuNTMyLDIxLjY0NSwyMC4xMzNjNC4zOTEsMS42MzYsOC45NTEsMi40NSwxMy41MDEsMi40NSAgYzUuNDY5LDAsMTAuOTIxLTEuMTc3LDE2LjA0Mi0zLjUyYzkuMzgyLTQuMjksMTYuNTM0LTExLjk3OCwyMC4xMzUtMjEuNjQ1YzMuNi05LjY2OCwzLjIyMS0yMC4xNi0xLjA3LTI5LjU0NCAgYy0wLjY0LTEuNDAyLTEuNTk3LTIuNjM4LTIuNzk1LTMuNjA5Yy05Ljc5LTcuOTQzLTI0LjQ5OC0xNS40NTgtNDEuNTI4LTI0LjE1NkMyNDIuNzY5LDIwMy4zODUsMjM4LjYyOSwyMDEuMjcsMjM0LjM1NywxOTkuMDUzeiAgIE0yNzMuNjczLDI0My41NzRjMS4yNzcsMy45NjMsMS4xODksOC4yMDktMC4yODcsMTIuMTY5Yy0xLjczNiw0LjY1OC01LjE4MSw4LjM2My05LjcwMiwxMC40MyAgYy00LjUyMywyLjA2Ny05LjU3OSwyLjI0Ny0xNC4yMzMsMC41MTVjLTQuNjU4LTEuNzM2LTguMzYzLTUuMTgxLTEwLjQyOS05LjcwMmMtMi4wNDMtNC40NjYtMi4wMDEtMTAuMDA5LDAuMTE1LTE1LjIwNiAgYzIuMjM5LTUuNTAxLDYuMzc5LTkuNjcyLDExLjY2OS0xMS43NThDMjYwLjAxOCwyMzQuODU4LDI2Ny45MzksMjM5LjMxOCwyNzMuNjczLDI0My41NzR6Ii8+CjxwYXRoIGQ9Ik00NzMuMDU0LDE4OC41OTZjNC43NjctMi43OTUsNi4zNjYtOC45MjcsMy41NzEtMTMuNjk1Yy0yLjc5NS00Ljc2OS04LjkyNy02LjM2Ni0xMy42OTUtMy41NzFsLTMuMTI5LDEuODM1ICBjLTIwLjU5NiwxMi4wODItMjIuMjc5LDEzLjA3LTQ3LjYwOCwyNS4zMTZjLTE2Ljg3Niw4LjE1OS0zMC43NjksMTYuMjM3LTQxLjI4NiwyNC4wMDdjLTEuMzY0LDEuMDA3LTIuNDUsMi4zNDYtMy4xNTQsMy44ODcgIGMtNC4yOTEsOS4zODMtNC42NywxOS44NzYtMS4wNywyOS41NDRjMy42MDEsOS42NjcsMTAuNzUzLDE3LjM1NSwyMC4xMzUsMjEuNjQ1YzUuMTIyLDIuMzQzLDEwLjU3NCwzLjUyLDE2LjA0MiwzLjUyICBjNC41NDksMCw5LjEwOS0wLjgxNCwxMy41MDEtMi40NWM5LjY2Ny0zLjYwMSwxNy4zNTUtMTAuNzUzLDIxLjY0NS0yMC4xMzVjNC44MDYtMTAuNTEsNC44NS0yMy4xNDIsMC4xMTYtMzMuNzg5ICBjLTIuMDkxLTQuNzA2LTUuMDM3LTguODY1LTguNjktMTIuMzQ1YzE4LjMyOS04LjkzMiwyMi4yMzEtMTEuMjIsNDAuNDk4LTIxLjkzNUw0NzMuMDU0LDE4OC41OTZ6IE00MTkuODA0LDI1MC4xNzQgIGMtMi4wNjgsNC41MjItNS43NzIsNy45NjctMTAuNDMsOS43MDJjLTQuNjU1LDEuNzMyLTkuNzEyLDEuNTUtMTQuMjMzLTAuNTE1Yy00LjUyMi0yLjA2OC03Ljk2Ny01Ljc3Mi05LjcwMi0xMC40MyAgYy0xLjQ1Ni0zLjkwNy0xLjU2MS04LjA5MS0wLjMzOC0xMi4wMDljNi41NTktNC42MzcsMTQuNTE1LTkuNDM0LDIzLjc2OC0xNC4zMzljNi4zNzksMi41NDIsOS40NzYsNi45MDYsMTAuOTY1LDEwLjI1NiAgQzQyMi4yMzQsMjM4LjI0Miw0MjIuMjIyLDI0NC44ODUsNDE5LjgwNCwyNTAuMTc0eiIvPgo8Y2lyY2xlIGN4PSIzMjMuMTMxIiBjeT0iMjAuMDE1IiByPSIxMC4wMDciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-like .rev-reaction-icon.rev-reaction-icon-selected.rev-reaction-icon-angry:after{content:"Angry"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-comment .rev-reaction-icon{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDYwIDYwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA2MCA2MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPHBhdGggZD0iTTU1LjIzMiw0My4xMDRDNTguMzU0LDM4Ljc0Niw2MCwzMy43MDUsNjAsMjguNWMwLTE0Ljg4OC0xMy40NTgtMjctMzAtMjdTMCwxMy42MTIsMCwyOC41czEzLjQ1OCwyNywzMCwyNyAgIGM0LjI2MiwwLDguMzc4LTAuNzksMTIuMjQzLTIuMzQ4YzYuODA1LDMuOTI3LDE2LjIxMyw1LjI4MSwxNi42MTgsNS4zMzhjMC4wNDcsMC4wMDcsMC4wOTMsMC4wMSwwLjEzOSwwLjAxICAgYzAuMzc1LDAsMC43MjUtMC4yMTEsMC44OTUtMC41NTRjMC4xOTItMC4zODUsMC4xMTYtMC44NS0wLjE4OC0xLjE1M0M1Ny40MDcsNTQuNDkzLDU1LjgyMyw0OS42NDEsNTUuMjMyLDQzLjEwNHogTTQyLjgzOSw1MS4xODIgICBjLTAuMDAxLDAtMC4wMDEsMC0wLjAwMSwwYy0yLjExLTEuMzAzLTQuNDY2LTIuODE0LTUuMDE0LTMuMjQ5Yy0wLjI5Ny0wLjQzMy0wLjg4My0wLjU2My0xLjMzOC0wLjI5ICAgYy0wLjMsMC4xOC0wLjQ4OSwwLjUxMy0wLjQ5MSwwLjg2MWMtMC4wMDMsMC41ODksMC4wMDYsMC43Nyw0LjA4MSwzLjMxNkMzNi44NjUsNTIuOTMxLDMzLjQ4Nyw1My41LDMwLDUzLjUgICBjLTE1LjQzOSwwLTI4LTExLjIxNS0yOC0yNXMxMi41NjEtMjUsMjgtMjVzMjgsMTEuMjE1LDI4LDI1YzAsNC44OTctMS41OTEsOS42NDQtNC42MDEsMTMuNzI1ICAgYy0wLjE0NCwwLjE5NS0wLjIxMiwwLjQzNi0wLjE5MSwwLjY3N2MwLjM1LDQuMTc1LDEuMjM5LDkuNDkxLDMuNDQsMTMuMTYxQzUzLjMxNiw1NS4zODUsNDcuMzEsNTMuODgyLDQyLjgzOSw1MS4xODJ6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8cGF0aCBkPSJNMTYsMjQuNWMtMi4yMDYsMC00LDEuNzk0LTQsNHMxLjc5NCw0LDQsNHM0LTEuNzk0LDQtNFMxOC4yMDYsMjQuNSwxNiwyNC41eiBNMTYsMzAuNWMtMS4xMDMsMC0yLTAuODk3LTItMnMwLjg5Ny0yLDItMiAgIHMyLDAuODk3LDIsMlMxNy4xMDMsMzAuNSwxNiwzMC41eiIgZmlsbD0iIzAwMDAwMCIvPgoJPHBhdGggZD0iTTMwLDI0LjVjLTIuMjA2LDAtNCwxLjc5NC00LDRzMS43OTQsNCw0LDRzNC0xLjc5NCw0LTRTMzIuMjA2LDI0LjUsMzAsMjQuNXogTTMwLDMwLjVjLTEuMTAzLDAtMi0wLjg5Ny0yLTJzMC44OTctMiwyLTIgICBzMiwwLjg5NywyLDJTMzEuMTAzLDMwLjUsMzAsMzAuNXoiIGZpbGw9IiMwMDAwMDAiLz4KCTxwYXRoIGQ9Ik00NCwyNC41Yy0yLjIwNiwwLTQsMS43OTQtNCw0czEuNzk0LDQsNCw0czQtMS43OTQsNC00UzQ2LjIwNiwyNC41LDQ0LDI0LjV6IE00NCwzMC41Yy0xLjEwMywwLTItMC44OTctMi0yczAuODk3LTIsMi0yICAgczIsMC44OTcsMiwyUzQ1LjEwMywzMC41LDQ0LDMwLjV6IiBmaWxsPSIjMDAwMDAwIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==);background-size:contain}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-comment .rev-reaction-icon:after{content:"Comment";margin-left:24px;clear:both;display:table;color:rgba(90,90,90,.86);font-size:12px}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-comment:hover .rev-reaction-icon{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU4IDU4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1OCA1ODsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzREQzk1QjsiIGQ9Ik0yOSwxLjVjMTYuMDE2LDAsMjksMTEuNjQxLDI5LDI2YzAsNS4yOTItMS43NjgsMTAuMjExLTQuNzk2LDE0LjMxOCAgIEM1My42MDIsNDYuNTYzLDU0Ljc0Niw1My4yNDYsNTgsNTYuNWMwLDAtOS45NDMtMS4zOTUtMTYuNjc3LTUuNDYyYy0wLjAwNywwLjAwMy0wLjAxNSwwLjAwNi0wLjAyMiwwLjAwOSAgIGMtMi43NjQtMS44MDEtNS41MzItMy42NTYtNi4xMDUtNC4xMjZjLTAuMy0wLjQyMS0wLjg3OS0wLjU0OC0xLjMzLTAuMjc3Yy0wLjI5NiwwLjE3OC0wLjQ4MywwLjUwMy0wLjQ4OSwwLjg0OCAgIGMtMC4wMSwwLjYyMiwwLjAwNSwwLjc4NCw1LjU4NSw0LjQyMUMzNS44NTQsNTIuOTMzLDMyLjUwMiw1My41LDI5LDUzLjVjLTE2LjAxNiwwLTI5LTExLjY0MS0yOS0yNkMwLDEzLjE0MSwxMi45ODQsMS41LDI5LDEuNXoiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSIxNSIgY3k9IjI3LjUiIHI9IjMiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSIyOSIgY3k9IjI3LjUiIHI9IjMiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI0MyIgY3k9IjI3LjUiIHI9IjMiLz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K);background-size:contain}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-share .rev-reaction-icon{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8Zz4KCQkJPHBhdGggZD0iTTMzMS42OTYsMTA0LjY5NGM0LjQ2NC0wLjExOSw3Ljk4NS0zLjgzMyw3Ljg2Ny04LjI5N2MtMS4xNDYtNDMuMDc0LDMyLjk2NC03OS4wNTIsNzYuMDM5LTgwLjE5OSAgICAgYzIwLjg4NC0wLjU1OCw0MC43MDEsNy4wNDksNTUuODQ5LDIxLjQxczIzLjc5NiwzMy43NjMsMjQuMzUyLDU0LjYyOWMwLjU1NSwyMC44NjYtNy4wNDgsNDAuNjk5LTIxLjQxLDU1Ljg0NyAgICAgcy0zMy43NjMsMjMuNzk2LTU0LjYzLDI0LjM1MmMtMTkuNjQ2LDAuNTEzLTM4LjY3OC02LjMxNi01My40OTEtMTkuMjYzYy0zLjM2My0yLjkzOC04LjQ2OC0yLjU5Ny0xMS40MDcsMC43NjYgICAgIGMtMi45MzgsMy4zNjEtMi41OTQsOC40NjgsMC43NjcsMTEuNDA2YzE3LjI0MywxNS4wNywzOS4xNzcsMjMuMjg2LDYyLjAyMSwyMy4yODZjMC44NDQsMCwxLjY5My0wLjAxMiwyLjUzOS0wLjAzNCAgICAgYzI1LjE4NC0wLjY3LDQ4LjU5OS0xMS4xMDgsNjUuOTMzLTI5LjM4OWMxNy4zMzMtMTguMjgxLDI2LjUxLTQyLjIxOSwyNS44MzktNjcuNDAyYy0wLjY3LTI1LjE4My0xMS4xMDgtNDguNTk5LTI5LjM5LTY1LjkzMiAgICAgQzQ2NC4yOTEsOC41NDIsNDQwLjMyLTAuNjUxLDQxNS4xNzMsMC4wMzZjLTUxLjk4OCwxLjM4NC05My4xNTYsNDQuODA1LTkxLjc3Miw5Ni43OTIgICAgIEMzMjMuNTIsMTAxLjI5MSwzMjcuMjU5LDEwNC44MDgsMzMxLjY5NiwxMDQuNjk0eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNNDIyLjU3NSwzMjMuNDk2Yy0yMi45NjktMS4xOTUtNDUuNTMyLDYuMDItNjMuNTI3LDIwLjMxMmMtMy40OTYsMi43NzgtNC4wNzksNy44NjItMS4zMDIsMTEuMzU5ICAgICBjMi43NzYsMy40OTYsNy44NjEsNC4wNzgsMTEuMzU5LDEuMzAyYzE0LjkwNS0xMS44NDEsMzMuNjAzLTE3LjgxNSw1Mi42My0xNi44MjdjNDMuMDMzLDIuMjM2LDc2LjIyNCwzOS4wNjQsNzMuOTg5LDgyLjA5NiAgICAgYy0xLjA4MiwyMC44NDUtMTAuMjE3LDQwLjAyMi0yNS43MjQsNTMuOTk2Yy0xNS41MDcsMTMuOTc0LTM1LjUyMSwyMS4wNzctNTYuMzcyLDE5Ljk5MSAgICAgYy0yMC44NDUtMS4wODMtNDAuMDIyLTEwLjIyLTUzLjk5Ny0yNS43MjVjLTEzLjk3NC0xNS41MDYtMjEuMDc0LTM1LjUyNS0xOS45OTEtNTYuMzcxYzAuMjMxLTQuNDU5LTMuMTk2LTguMjYxLTcuNjU1LTguNDkzICAgICBjLTQuNDEyLTAuMjI4LTguMjYxLDMuMTk1LTguNDkzLDcuNjU0Yy0xLjMwNiwyNS4xNTgsNy4yNjMsNDkuMzIsMjQuMTI4LDY4LjAzM2MxNi44NjYsMTguNzE0LDQwLjAwOSwyOS43NCw2NS4xNjksMzEuMDQ3ICAgICBjMS42NzUsMC4wODcsMy4zNDMsMC4xMyw1LjAwNywwLjEzYzIzLjM0Mi0wLjAwMSw0NS41Ni04LjUxNCw2My4wMjgtMjQuMjU3YzE4LjcxNC0xNi44NjYsMjkuNzQtNDAuMDA5LDMxLjA0OC02NS4xNjcgICAgIEM1MTQuNTcsMzcwLjY0MSw0NzQuNTExLDMyNi4xOTMsNDIyLjU3NSwzMjMuNDk2eiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8cGF0aCBkPSJNNDE3LjY4Miw0NjguODgxYzI4LjIzMSwwLDUxLjItMjIuOTY4LDUxLjItNTEuMTk5cy0yMi45NjktNTEuMi01MS4yLTUxLjJjLTE3LjEwOCwwLTMyLjI4NSw4LjQzOC00MS41ODcsMjEuMzY3ICAgICBsLTIzMi45NC0xMTYuNDY5YzEuNTM0LTQuODU3LDIuMzU5LTEwLjAyMywyLjM1OS0xNS4zOGMwLTUuMzU3LTAuODI4LTEwLjUyNS0yLjM1OS0xNS4zODJMMzc2LjA5NCwxMjQuMTUgICAgIGM5LjMwMiwxMi45MzEsMjQuNDc4LDIxLjM2Nyw0MS41ODgsMjEuMzY3YzI4LjIzMSwwLDUxLjItMjIuOTY4LDUxLjItNTEuMmMwLTI4LjIzMi0yMi45NjktNTEuMTk5LTUxLjItNTEuMTk5ICAgICBjLTI4LjIzMSwwLTUxLjE5OSwyMi45NjgtNTEuMTk5LDUxLjE5OWMwLDUuMzU3LDAuODI3LDEwLjUyMywyLjM2LDE1LjM4bC0yMzIuOTQsMTE2LjQ3ICAgICBjLTkuMzAyLTEyLjkyOS0yNC40NzktMjEuMzY3LTQxLjU4Ny0yMS4zNjdjLTI4LjIzMSwwLTUxLjIsMjIuOTY5LTUxLjIsNTEuMnMyMi45NjksNTEuMTk5LDUxLjIsNTEuMTk5ICAgICBjMTcuMTExLDAsMzIuMjg2LTguNDM2LDQxLjU4OC0yMS4zNjdsMjMyLjkzOCwxMTYuNDY5Yy0xLjUzMyw0Ljg1Ny0yLjM2LDEwLjAyNC0yLjM2LDE1LjM4MiAgICAgQzM2Ni40ODMsNDQ1LjkxNCwzODkuNDUxLDQ2OC44ODEsNDE3LjY4Miw0NjguODgxeiBNNDE3LjY4MiwzODIuNjUxYzE5LjMxNywwLDM1LjAzMiwxNS43MTUsMzUuMDMyLDM1LjAzMiAgICAgYzAsMTkuMzE3LTE1LjcxNSwzNS4wMzEtMzUuMDMyLDM1LjAzMWMtMTkuMzE2LDAtMzUuMDMtMTUuNzE1LTM1LjAzLTM1LjAzMUMzODIuNjUyLDM5OC4zNjcsMzk4LjM2NiwzODIuNjUxLDQxNy42ODIsMzgyLjY1MXogICAgICBNNDE3LjY4Miw1OS4yODdjMTkuMzE3LDAsMzUuMDMyLDE1LjcxNSwzNS4wMzIsMzUuMDMxYzAsMTkuMzE2LTE1LjcxNSwzNS4wMzItMzUuMDMyLDM1LjAzMiAgICAgYy0xOS4zMTYsMC0zNS4wMy0xNS43MTYtMzUuMDMtMzUuMDMyQzM4Mi42NTIsNzUuMDAxLDM5OC4zNjYsNTkuMjg3LDQxNy42ODIsNTkuMjg3eiBNOTQuMzE2LDI5MS4wMzEgICAgIGMtMTkuMzE3LDAtMzUuMDMyLTE1LjcxNS0zNS4wMzItMzUuMDMxczE1LjcxNS0zNS4wMzIsMzUuMDMyLTM1LjAzMmMxOS4zMTYsMCwzNS4wMzEsMTUuNzE2LDM1LjAzMSwzNS4wMzIgICAgIFMxMTMuNjMyLDI5MS4wMzEsOTQuMzE2LDI5MS4wMzF6IiBmaWxsPSIjMDAwMDAwIi8+CgkJCTxwYXRoIGQ9Ik0xMjkuMjU3LDMyNS44OTZjLTEwLjkyOCw1LjQ3NS0yMi42ODMsOC4yNS0zNC45NDEsOC4yNWMtNDMuMDkxLDAtNzguMTQ3LTM1LjA1Ni03OC4xNDctNzguMTQ2ICAgICBjMC00My4wOSwzNS4wNTYtNzguMTQ3LDc4LjE0Ny03OC4xNDdjMTIuMjU4LDAsMjQuMDEzLDIuNzc2LDM0Ljk0Miw4LjI1YzMuOTk0LDIuMDAyLDguODUsMC4zODUsMTAuODQ4LTMuNjA3ICAgICBjMi0zLjk5MSwwLjM4NS04Ljg1LTMuNjA3LTEwLjg0OWMtMTMuMTk2LTYuNjExLTI3LjM4OC05Ljk2My00Mi4xODMtOS45NjNDNDIuMzA5LDE2MS42ODUsMCwyMDMuOTk1LDAsMjU2ICAgICBzNDIuMzEsOTQuMzE1LDk0LjMxNSw5NC4zMTVjMTQuNzk1LDAsMjguOTg4LTMuMzUyLDQyLjE4My05Ljk2M2MzLjk5MS0yLjAwMSw1LjYwNi02Ljg1OCwzLjYwNy0xMC44NDkgICAgIEMxMzguMTA3LDMyNS41MTIsMTMzLjI1LDMyMy44OTgsMTI5LjI1NywzMjUuODk2eiIgZmlsbD0iIzAwMDAwMCIvPgoJCTwvZz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K);background-size:contain}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-share .rev-reaction-icon:after{content:"Share";margin-left:24px;clear:both;display:table;color:rgba(90,90,90,.86);font-size:12px}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction.rev-reaction-share:hover .rev-reaction-icon{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAiIHkxPSIyNTguMDAxIiB4Mj0iNTEyIiB5Mj0iMjU4LjAwMSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAtMSAwIDUxNC4wMDEpIj4KCTxzdG9wIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzgwRDhGRiIvPgoJPHN0b3Agb2Zmc2V0PSIwLjE2IiBzdHlsZT0ic3RvcC1jb2xvcjojODhEMUZGIi8+Cgk8c3RvcCBvZmZzZXQ9IjAuNDEzIiBzdHlsZT0ic3RvcC1jb2xvcjojOUZCRUZFIi8+Cgk8c3RvcCBvZmZzZXQ9IjAuNzI1IiBzdHlsZT0ic3RvcC1jb2xvcjojQzRBMEZEIi8+Cgk8c3RvcCBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiNFQTgwRkMiLz4KPC9saW5lYXJHcmFkaWVudD4KPHBhdGggc3R5bGU9ImZpbGw6dXJsKCNTVkdJRF8xXyk7IiBkPSJNNDIyLjk1NCwzMzMuOTA4Yy0yNy41ODcsMC01Mi4yODQsMTIuNjExLTY4LjYzLDMyLjM3bC0xNzguNzE4LTg5LjM1OSAgYzEuNjIyLTYuNzEyLDIuNDg4LTEzLjcxNSwyLjQ4OC0yMC45MThjMC03LjIwMy0wLjg2Ni0xNC4yMDctMi40ODgtMjAuOTE4bDE3OC43MTgtODkuMzU5YzE2LjM0NiwxOS43NTksNDEuMDQzLDMyLjM3LDY4LjYzLDMyLjM3ICBjNDkuMSwwLDg5LjA0Ni0zOS45NDYsODkuMDQ2LTg5LjA0NlM0NzIuMDU0LDAuMDAxLDQyMi45NTQsMC4wMDFzLTg5LjA0NiwzOS45NDYtODkuMDQ2LDg5LjA0NmMwLDcuMjAzLDAuODY2LDE0LjIwNywyLjQ4OCwyMC45MTggIGwtMTc4LjcxOCw4OS4zNTljLTE2LjM0Ni0xOS43NTktNDEuMDQzLTMyLjM3LTY4LjYzLTMyLjM3QzM5Ljk0NiwxNjYuOTU0LDAsMjA2LjksMCwyNTZzMzkuOTQ2LDg5LjA0Niw4OS4wNDYsODkuMDQ2ICBjMjcuNTg3LDAsNTIuMjg0LTEyLjYxMSw2OC42My0zMi4zN2wxNzguNzE4LDg5LjM1OWMtMS42MjIsNi43MTItMi40ODgsMTMuNzE1LTIuNDg4LDIwLjkxOGMwLDQ5LjEsMzkuOTQ2LDg5LjA0Niw4OS4wNDYsODkuMDQ2ICBTNTEyLDQ3Mi4wNTUsNTEyLDQyMi45NTVTNDcyLjA1NCwzMzMuOTA4LDQyMi45NTQsMzMzLjkwOHogTTQyMi45NTQsNDAuMDAxYzI3LjA0NCwwLDQ5LjA0NiwyMi4wMDIsNDkuMDQ2LDQ5LjA0NiAgcy0yMi4wMDIsNDkuMDQ2LTQ5LjA0Niw0OS4wNDZzLTQ5LjA0Ni0yMi4wMDItNDkuMDQ2LTQ5LjA0NlMzOTUuOTA5LDQwLjAwMSw0MjIuOTU0LDQwLjAwMXogTTg5LjA0NiwzMDUuMDQ3ICBDNjIuMDAyLDMwNS4wNDcsNDAsMjgzLjA0NCw0MCwyNTZzMjIuMDAyLTQ5LjA0Niw0OS4wNDYtNDkuMDQ2czQ5LjA0NiwyMi4wMDIsNDkuMDQ2LDQ5LjA0NlMxMTYuMDkxLDMwNS4wNDcsODkuMDQ2LDMwNS4wNDd6ICAgTTQyMi45NTQsNDcyYy0yNy4wNDQsMC00OS4wNDYtMjIuMDAyLTQ5LjA0Ni00OS4wNDZjMC0yNy4wNDQsMjIuMDAyLTQ5LjA0Niw0OS4wNDYtNDkuMDQ2UzQ3MiwzOTUuOTA5LDQ3Miw0MjIuOTU1ICBDNDcyLDQ1MCw0NDkuOTk4LDQ3Miw0MjIuOTU0LDQ3MnoiLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==);background-size:contain}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu{z-index:10000}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container{position:absolute;visibility:hidden;bottom:0;width:48px;height:48px;border-radius:50%;top:-16px;left:75px;z-index:1000000000}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item{position:absolute;top:8px;right:0;bottom:0;left:8px;width:32px;height:32px;opacity:0;z-index:100000233;background-size:cover}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item.rev-reaction-tip:hover:after{background:#333;background:rgba(0,0,0,.8);border-radius:5px;bottom:26px;color:#fff;content:"Like";left:20%;font-size:12px;line-height:20px;padding:0 4px;position:absolute;z-index:1000000000000}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-mask{width:150px;height:150px;z-index:1000000;background:rgba(255,255,255,.85);top:50%;left:50%;-webkit-transform:translate3d(-50%,-50%,0);transform:translate3d(-50%,-50%,0);border-radius:50%;opacity:0;transition:opacity .5s}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-mask .rev-reaction-menu-mask-inner{position:absolute;top:50%;left:50%;width:28px;height:28px;line-height:28px;text-align:center;margin-left:-25px;padding:10px;margin-top:-24px;background:#fff;box-sizing:content-box}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-mask .rev-reaction-menu-mask-inner svg{fill:#666}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(1),#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(5){background-image:none;box-shadow:none;text-align:center}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(2){background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8cGF0aCBzdHlsZT0iZmlsbDojRkY0RDVFOyIgZD0iTTI1Niw5Ni4yNDhjLTU2LjY5MS01Ni42OTEtMTQ4Ljc2Ny01Ni40MzItMjA1LjEzNSwwLjc3OCAgYy01NS45MjMsNTYuNzU4LTU0LjI4OCwxNDguNTI2LDIuMDU1LDIwNC44NjhsMTIzLjAyNCwxMjMuMDI0YzQ0LjIxNCw0NC4yMTQsMTE1Ljg5OSw0NC4yMTQsMTYwLjExNCwwbDEyMy4wMjQtMTIzLjAyNCAgYzU2LjM0My01Ni4zNDMsNTcuOTc4LTE0OC4xMSwyLjA1NS0yMDQuODY4QzQwNC43NjcsMzkuODE1LDMxMi42OTEsMzkuNTU3LDI1Niw5Ni4yNDh6Ii8+CjxwYXRoIGQ9Ik00NjguMTQ3LDkwLjExNWMtMjkuMS0yOS41MzQtNjcuOTQ5LTQ1Ljg4NC0xMDkuMzkxLTQ2LjAzN2MtMC4xOTgtMC4wMDEtMC4zOTItMC4wMDEtMC41OS0wLjAwMSAgYy0zOC4wMjUsMC03My45MzUsMTMuNjQ5LTEwMi4xNjcsMzguNjU1Yy0yOC4yMzUtMjUuMDA3LTY0LjEzOS0zOC42NTUtMTAyLjE2Ny0zOC42NTVjLTAuMTk0LDAtMC4zOTQsMC0wLjU5LDAuMDAxICBDMTExLjgsNDQuMjMyLDcyLjk1MSw2MC41ODEsNDMuODUyLDkwLjExNWMtNTkuMjg0LDYwLjE2OS01OC4zMzgsMTU4LjI5NCwyLjEwNiwyMTguNzRsMTIzLjAyNCwxMjMuMDIzICBjMjMuMjQzLDIzLjI0NCw1NC4xNDcsMzYuMDQ0LDg3LjAxOSwzNi4wNDRzNjMuNzc1LTEyLjgsODcuMDE5LTM2LjA0NGwxMjMuMDI0LTEyMy4wMjMgIEM1MjYuNDg2LDI0OC40MSw1MjcuNDMxLDE1MC4yODUsNDY4LjE0Nyw5MC4xMTV6IE00NTIuMTE5LDI5NC45MzJMMzI5LjA5NSw0MTcuOTU2Yy0xOS41MjUsMTkuNTI1LTQ1LjQ4MywzMC4yNzctNzMuMDk1LDMwLjI3NyAgYy0yNy42MTIsMC01My41Ny0xMC43NTMtNzMuMDk1LTMwLjI3N0w1OS44ODEsMjk0LjkzMkM3LjA1NywyNDIuMTA4LDYuMTU5LDE1Ni40MjcsNTcuODc3LDEwMy45MzUgIGMyNS4zODktMjUuNzY4LDU5LjI4NC00MC4wMzMsOTUuNDM4LTQwLjE2N2MwLjE3Mi0wLjAwMSwwLjM0My0wLjAwMSwwLjUxNC0wLjAwMWMzNS45NjcsMCw2OS43NjIsMTMuOTk2LDk1LjIwOCwzOS40NDIgIGMzLjg0NSwzLjg0MywxMC4wNzcsMy44NDMsMTMuOTI0LDBjMjUuNDQ3LTI1LjQ0Nyw1OS4yMzgtMzkuNDQyLDk1LjIwOC0zOS40NDJjMC4xNywwLDAuMzQ1LDAsMC41MTQsMC4wMDEgIGMzNi4xNTYsMC4xMzQsNzAuMDQ5LDE0LjM5OCw5NS40MzgsNDAuMTY3QzUwNS44NDEsMTU2LjQyNyw1MDQuOTQzLDI0Mi4xMDgsNDUyLjExOSwyOTQuOTMyeiIvPgo8cGF0aCBkPSJNMTQ3Ljc0Niw4OC4zNTljLTM3LjkyNSwwLTcxLjkzMywyMS4wMTQtODguNzUzLDU0Ljg0MmMtMi40MjEsNC44NjgtMC40MzYsMTAuNzc3LDQuNDMyLDEzLjE5OCAgYzEuNDA5LDAuNywyLjkwMiwxLjAzMiw0LjM3NSwxLjAzMmMzLjYxOSwwLDcuMTAyLTIuMDAzLDguODIzLTUuNDY0YzEzLjQ3MS0yNy4wOSw0MC43MjMtNDMuOTE4LDcxLjEyMy00My45MTggIGM1LjQzNiwwLDkuODQ1LTQuNDA4LDkuODQ1LTkuODQ1UzE1My4xODMsODguMzU5LDE0Ny43NDYsODguMzU5eiIvPgo8cGF0aCBkPSJNNjAuMzgyLDE2Ni45NzFjLTUuMzkzLTAuNjU1LTEwLjMwNCwzLjE5MS0xMC45NTgsOC41ODljLTAuMDAxLDAuMDEyLTAuMDIxLDAuMTc2LTAuMDIyLDAuMTkgIGMtMC42NTMsNS4zOTMsMy4xODYsMTAuMjk3LDguNTgxLDEwLjk1NmMwLjQwNSwwLjA0OSwwLjgwNiwwLjA3NCwxLjIwNiwwLjA3NGM0LjkwNCwwLDkuMTUtMy42Niw5Ljc1OS04LjY1MyAgYzAuMDAxLTAuMDAzLDAuMDIzLTAuMTk1LDAuMDI0LTAuMTk5QzY5LjYyNCwxNzIuNTMyLDY1Ljc3OSwxNjcuNjI1LDYwLjM4MiwxNjYuOTcxeiIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(2):hover:after{content:"Love"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(3){background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk5IDUxMS45OTkiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTkgNTExLjk5OTsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZEREY2RDsiIGN4PSIyNTYuNiIgY3k9IjI1Ni4wMDEiIHI9IjI0NS45OTMiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0ZDQzU2QjsiIGQ9Ik0zMDkuMzEyLDQ2NS42NzdjLTEzNS44NTgsMC0yNDUuOTkyLTExMC4xMzQtMjQ1Ljk5Mi0yNDUuOTkyICBjMC03Mi41ODQsMzEuNDQzLTEzNy44MTYsODEuNDQ0LTE4Mi44NDJDNjUuMTI2LDc3LjU2MiwxMC42MDYsMTYwLjQxMywxMC42MDYsMjU1Ljk5OWMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkyLDI0NS45OTIsMjQ1Ljk5MiAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk3LDE2NC41NDgtNjMuMTQ5QzM4Ny41OTQsNDU1Ljk5OCwzNDkuNTg1LDQ2NS42NzcsMzA5LjMxMiw0NjUuNjc3eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNNDE3LjA1OCwyMzAuMzYzYy0zLjUxMywwLjAwMS02LjkyMS0xLjg1Mi04Ljc1Mi01LjE0Yy02LjQyMS0xMS41MjYtMTguNTk0LTE4LjY4Ni0zMS43NzEtMTguNjg2ICAgYy0xMi44NTEsMC0yNS4xODksNy4yNjUtMzIuMjAyLDE4Ljk2MmMtMi44NDIsNC43MzktOC45ODksNi4yNzgtMTMuNzI5LDMuNDM3Yy00Ljc0MS0yLjg0Mi02LjI3OS04Ljk4OC0zLjQzNy0xMy43MjkgICBjMTAuNjA4LTE3LjY5NCwyOS41MjQtMjguNjg1LDQ5LjM2OC0yOC42ODVjMjAuNDMyLDAsMzkuMzA2LDExLjA5Niw0OS4yNTYsMjguOTYxYzIuNjksNC44MjgsMC45NTUsMTAuOTIzLTMuODcyLDEzLjYxMSAgIEM0MjAuMzc4LDIyOS45NTYsNDE4LjcwNiwyMzAuMzYzLDQxNy4wNTgsMjMwLjM2M3oiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMjQ2LjMzLDIzMC4zNjNjLTMuNTEzLDAuMDAxLTYuOTIxLTEuODUyLTguNzUyLTUuMTRjLTYuNDIxLTExLjUyNi0xOC41OTQtMTguNjg2LTMxLjc3MS0xOC42ODYgICBjLTEyLjg0OSwwLTI1LjE4OSw3LjI2NS0zMi4yMDIsMTguOTYyYy0yLjg0MSw0LjczOS04Ljk4Nyw2LjI3OC0xMy43MjksMy40MzdjLTQuNzM5LTIuODQyLTYuMjc5LTguOTg5LTMuNDM2LTEzLjcyOSAgIGMxMC42MDgtMTcuNjk0LDI5LjUyNC0yOC42ODUsNDkuMzY4LTI4LjY4NWMyMC40MzIsMCwzOS4zMDYsMTEuMDk2LDQ5LjI1NiwyOC45NjFjMi42OSw0LjgyOCwwLjk1NSwxMC45MjMtMy44NzIsMTMuNjExICAgQzI0OS42NDksMjI5Ljk1NiwyNDcuOTc4LDIzMC4zNjMsMjQ2LjMzLDIzMC4zNjN6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTI5My41NDUsNDM3LjcwNkwyOTMuNTQ1LDQzNy43MDZjLTcwLjk4MSwwLTEyOC41MjItNTcuNTQxLTEyOC41MjItMTI4LjUyMmwwLDBoMjU3LjA0M2wwLDAgICBDNDIyLjA2NiwzODAuMTY0LDM2NC41MjUsNDM3LjcwNiwyOTMuNTQ1LDQzNy43MDZ6Ii8+CjwvZz4KPHBhdGggc3R5bGU9ImZpbGw6I0YyRjJGMjsiIGQ9Ik0xOTYuMzgyLDMwOS4xODR2MjAuMDYxYzAsOC40Niw2Ljg1NywxNS4zMTcsMTUuMzE3LDE1LjMxN2gxNjMuNjkzICBjOC40NTgsMCwxNS4zMTctNi44NTcsMTUuMzE3LTE1LjMxN3YtMjAuMDYxSDE5Ni4zODJMMTk2LjM4MiwzMDkuMTg0eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkM0QzU5OyIgZD0iTTI5Ni4yNDEsMzg0LjM4NWMtMzQuNzQtMTYuMTQtNzMuMjk0LTEzLjc5NS0xMDQuNTU0LDIuOTQ1ICBjMjMuNDkyLDMwLjYxNyw2MC40MzIsNTAuMzc0LDEwMi4wMDcsNTAuMzc0bDAsMGMxOC4zMiwwLDM1LjczMS0zLjg1OSw1MS41MDMtMTAuNzY3ICBDMzMzLjYyNiw0MDkuMDM0LDMxNy4wMzQsMzk0LjA0NiwyOTYuMjQxLDM4NC4zODV6Ii8+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzNGQTlGNTsiIGQ9Ik0xNTEuMTE5LDMzNS41NDNjLTE1LjAxNiwxNi40MjMtNDAuNTAyLDE3LjU2NS01Ni45MjYsMi41NDlzLTE3LjU2NS00MC41MDItMi41NDktNTYuOTI2ICAgYzE1LjAxNi0xNi40MjMsODMuOTExLTMyLjA2Myw4My45MTEtMzIuMDYzUzE2Ni4xMzYsMzE5LjExOSwxNTEuMTE5LDMzNS41NDN6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojM0ZBOUY1OyIgZD0iTTQyNy42NjcsMzI2LjU2NGMxNS4wMTYsMTYuNDIzLDQwLjUwMiwxNy41NjUsNTYuOTI2LDIuNTQ5czE3LjU2NS00MC41MDIsMi41NDktNTYuOTI2ICAgYy0xNS4wMTYtMTYuNDIzLTgzLjkxMS0zMi4wNjMtODMuOTExLTMyLjA2M1M0MTIuNjUyLDMxMC4xNDIsNDI3LjY2NywzMjYuNTY0eiIvPgo8L2c+CjxwYXRoIGQ9Ik0zNzYuNTM1LDE4Ni41MjZjLTE5Ljg0NCwwLTM4Ljc2LDEwLjk5MS00OS4zNjgsMjguNjg1Yy0yLjg0Miw0Ljc0MS0xLjMwNCwxMC44ODcsMy40MzcsMTMuNzI5ICBjNC43MzksMi44NDEsMTAuODg3LDEuMzA0LDEzLjcyOS0zLjQzN2M3LjAxMi0xMS42OTcsMTkuMzUxLTE4Ljk2MiwzMi4yMDItMTguOTYyYzEzLjE3NiwwLDI1LjM1MSw3LjE2LDMxLjc3MSwxOC42ODYgIGMxLjgzMSwzLjI4OCw1LjIzOCw1LjE0MSw4Ljc1Miw1LjE0YzEuNjQ4LDAsMy4zMi0wLjQwOCw0Ljg2MS0xLjI2NmM0LjgyOS0yLjY5LDYuNTYyLTguNzg0LDMuODcyLTEzLjYxMSAgQzQxNS44NDEsMTk3LjYyMiwzOTYuOTY3LDE4Ni41MjYsMzc2LjUzNSwxODYuNTI2eiIvPgo8cGF0aCBkPSJNMjA1LjgwNywxODYuNTI2Yy0xOS44NDMsMC0zOC43NTksMTAuOTkxLTQ5LjM2OCwyOC42ODVjLTIuODQyLDQuNzM5LTEuMzA0LDEwLjg4NywzLjQzNiwxMy43MjkgIGM0Ljc0MiwyLjg0MSwxMC44ODgsMS4zMDQsMTMuNzI5LTMuNDM3YzcuMDEzLTExLjY5NywxOS4zNTMtMTguOTYyLDMyLjIwMi0xOC45NjJjMTMuMTc2LDAsMjUuMzUxLDcuMTYsMzEuNzcxLDE4LjY4NiAgYzEuODMxLDMuMjg4LDUuMjM4LDUuMTQxLDguNzUyLDUuMTRjMS42NDgsMCwzLjMyLTAuNDA4LDQuODYxLTEuMjY2YzQuODI5LTIuNjksNi41NjItOC43ODQsMy44NzItMTMuNjExICBDMjQ1LjExMywxOTcuNjIyLDIyNi4yNCwxODYuNTI2LDIwNS44MDcsMTg2LjUyNnoiLz4KPHBhdGggZD0iTTQ5NC41MjcsMjY1LjQzNmMtMTYuMzA0LTE3LjgzMy03Ny4wNjYtMzIuMzQyLTg5LjA4MS0zNS4wN2MtMy4xOTYtMC43MjYtNi41NDcsMC4xNi04Ljk2OCwyLjM3MiAgYy0yLjQxOSwyLjIxMi0zLjYwMyw1LjQ3MS0zLjE2NSw4LjcyYzEuMDIxLDcuNTgzLDQuODg5LDM0LjI4OSwxMS41NzYsNTcuNzE4SDE3Ni4yOTJjNS4yMjEtMjAuODgzLDguMjktNDIuMTEzLDkuMTgxLTQ4LjczOCAgYzAuNDM4LTMuMjUtMC43NDYtNi41MDctMy4xNjUtOC43MmMtMi40Mi0yLjIxMi01Ljc3NC0zLjA5OC04Ljk2OC0yLjM3MmMtMTIuMDE1LDIuNzI3LTcyLjc3NywxNy4yMzctODkuMDgxLDM1LjA2OCAgYy0xOC43MTUsMjAuNDY4LTE3LjI4Nyw1Mi4zNDgsMy4xODIsNzEuMDYzYzkuMzQ3LDguNTQ2LDIxLjMwMiwxMy4xNzksMzMuODg2LDEzLjE3OWMwLjc2NiwwLDEuNTM0LTAuMDE3LDIuMzA0LTAuMDUyICBjMTMuNDIyLTAuNiwyNS44MDctNi4zOTMsMzQuODcyLTE2LjMwOWMwLjEzNi0wLjE0OCwwLjI2Ny0wLjMyNiwwLjQwMi0wLjQ3OWMxNC43MTEsNjAuNjksNjkuNDksMTA1Ljg5NywxMzQuNjM3LDEwNS44OTcgIGM2NS4yNjgsMCwxMjAuNjc4LTQ1LjUyNywxMzQuOTU2LTEwNy4xNjljOC42MSw2LjA0NywxOC43NTQsOS4xMDksMjguOTI1LDkuMTA5YzUuNzc0LDAsMTEuNTUyLTAuOTk4LDE3LjA2Ni0yLjk4MSAgYy0xNS4xNzksMzYuMzE1LTM5LjQzMyw2OC43MzgtNzAuNDQ5LDkzLjU5MWMtNDIuMjI4LDMzLjgzNy05My4yMTQsNTEuNzIyLTE0Ny40NDQsNTEuNzIyICBjLTEzMC4xMjMsMC0yMzUuOTg1LTEwNS44NjMtMjM1Ljk4NS0yMzUuOTg1UzEyNi40NzUsMjAuMDE1LDI1Ni41OTgsMjAuMDE1YzEwNy4zNjUsMCwyMDEuMjY1LDcyLjQ1NywyMjguMzQ4LDE3Ni4yMDIgIGMxLjM5Niw1LjM0OSw2Ljg2Miw4LjU1MywxMi4yMSw3LjE1NWM1LjM0OC0xLjM5Niw4LjU1Mi02Ljg2NCw3LjE1NS0xMi4yMUM0NzQuOTI4LDc4LjYwOCwzNzMuMDY2LDAsMjU2LjU5OCwwICBDMTE1LjQzOCwwLDAuNTk4LDExNC44NCwwLjU5OCwyNTUuOTk5czExNC44NCwyNTUuOTk5LDI1NS45OTksMjU1Ljk5OWM1Ny45ODgsMCwxMTQuNzk2LTE5LjkyOSwxNTkuOTU4LTU2LjExNyAgYzQ0LjQ3NS0zNS42MzUsNzYuMTQ2LTg1LjYzMyw4OS4xODEtMTQwLjc4YzAuMjIzLTAuOTQ1LDAuMjk4LTEuODg4LDAuMjUxLTIuODExQzUxMC4yMTQsMjk2LjI5Miw1MDYuNDk5LDI3OC41MjksNDk0LjUyNywyNjUuNDM2eiAgIE0xMjIuNzM3LDMzOC42MDljLTguMDcsMC4zNjctMTUuODE4LTIuNDQ2LTIxLjc4OS03LjkwNGMtMTIuMzI1LTExLjI2OC0xMy4xODQtMzAuNDYyLTEuOTE2LTQyLjc4NyAgYzcuNDM3LTguMTM0LDM4LjQyLTE4LjY1Miw2NC4zNTktMjUuNTA4Yy00LjUxMSwyNi40NDYtMTIuMjE4LDU4LjI0NC0xOS42NTYsNjYuMzgxICBDMTM4LjI3NSwzMzQuNzYxLDEzMC44MTgsMzM4LjI0OCwxMjIuNzM3LDMzOC42MDl6IE0yOTMuNTQzLDQyNy42OThjLTYxLjk3OSwwLTExMi45OTktNDcuODI0LTExOC4wOTYtMTA4LjUwN2gyMzYuMTk0ICBDNDA2LjU0LDM4MC4yNSwzNTUuMTc3LDQyNy42OTgsMjkzLjU0Myw0MjcuNjk4eiBNNDU2LjA0OSwzMjkuNjMyYy04LjA4Mi0wLjM2Mi0xNS41MzgtMy44NDktMjAuOTk3LTkuODE5ICBjLTEuMjkyLTEuNDEzLTIuNTkxLTMuNTUzLTMuODgtNi4yNDFjLTAuMTc5LTAuNDcxLTAuMzg2LTAuOTI5LTAuNjMyLTEuMzYyYy0wLjgwMi0xLjc4OC0xLjU5OS0zLjc3Ni0yLjM4Ny01Ljk0NCAgYy0wLjA2NS0wLjIxNi0wLjE0Ny0wLjQyNy0wLjIyNy0wLjYzNmMtNC45MjgtMTMuODEtOS40NjctMzQuMjM2LTEyLjUzLTUyLjJjMjUuOTM0LDYuODUzLDU2LjkxMiwxNy4zNjcsNjQuMzU5LDI1LjUxMiAgYzExLjI2OCwxMi4zMjQsMTAuNDA5LDMxLjUxOS0xLjkxNiw0Mi43ODdDNDcxLjg3LDMyNy4xODcsNDY0LjEzNSwzMjkuOTk2LDQ1Ni4wNDksMzI5LjYzMnoiLz4KPGNpcmNsZSBjeD0iNTAxLjM5MyIgY3k9IjIyNi4wMzIiIHI9IjEwLjAwNyIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(3):hover:after{content:"LOL"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(4){background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk3IDUxMS45OTciIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTcgNTExLjk5NzsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGREI2QzsiIGN4PSIyNDguMTA2IiBjeT0iMjU1Ljk5NCIgcj0iMjM4LjQwNyIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkZCMDRDOyIgZD0iTTI5OS4xOTQsNDU5LjIxYy0xMzEuNjY4LDAtMjM4LjQwNi0xMDYuNzM4LTIzOC40MDYtMjM4LjQwNmMwLTcwLjM0NSwzMC40NzMtMTMzLjU2NSw3OC45MzItMTc3LjIwMyAgQzYyLjUzNyw4My4wNjQsOS42OTksMTYzLjM2MSw5LjY5OSwyNTUuOTk5YzAsMTMxLjY2OCwxMDYuNzM4LDIzOC40MDYsMjM4LjQwNiwyMzguNDA2YzYxLjMyMywwLDExNy4yMzEtMjMuMTYxLDE1OS40NzQtNjEuMjAxICBDMzc1LjA2MSw0NDkuODI5LDMzOC4yMjQsNDU5LjIxLDI5OS4xOTQsNDU5LjIxeiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGOUE4ODA7IiBkPSJNMTQ1LjY1MSwyNTkuNDE3Yy0xNy43MDUsMC0zMi4wNTksMTQuMzUzLTMyLjA1OSwzMi4wNTdoNjQuMTE2ICAgQzE3Ny43MSwyNzMuNzY5LDE2My4zNTcsMjU5LjQxNywxNDUuNjUxLDI1OS40MTd6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjlBODgwOyIgZD0iTTQyNS4yODEsMjU5LjQxN2MtMTcuNzA1LDAtMzIuMDU5LDE0LjM1My0zMi4wNTksMzIuMDU3aDY0LjExNiAgIEM0NTcuMzM4LDI3My43NjksNDQyLjk4NSwyNTkuNDE3LDQyNS4yODEsMjU5LjQxN3oiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojNTY1ODZGOyIgZD0iTTExMC44OCwxMjYuOTc0YzYyLjI1LTE0LjI4NywxMTIuNjQzLTkuMzcsMTY4LjQ2NCwzLjYzOWM4LjI3OCwxLjkyOCwxNy4wMjIsNC4wNzksMjYuMjU4LDQuMzYxICBjMTUuMzgsMC40NzEsMzIuNjY5LTMuMzU3LDQ3LjU3NS03LjEwMmM1OC44NS0xNC43ODMsMTA0LjgyMi03LjA5NCwxNDkuMTIzLDIuMzcybC0zLjI3MywyNi4xOCAgYy02LjkxNiwwLjE1My05LjA5MSwzLjM3OC0xMS4wNjcsOS42NzNjLTEwLjM0LDMyLjk0NS0xLjUzNCw4OS42My03Ny45NzgsODIuOTY1Yy01MC4yOS00LjM4NS02NC42OTItMTguMTY0LTg4LjY2LTc4Ljc0NiAgYy0yLjAzOS01LjE1My0zLjM2NS0xMy42NjktMTUuMDExLTEzLjM1NGMtNi41NzYsMC4xNzctMTIuNDU3LDEuMzQtMTQuNTA4LDEyLjc2NWMtMy44MjMsMjEuMjg4LTMyLjg5Myw3OS4xMjktOTEuOTE1LDc5LjA2NSAgYy01Mi4xMzItMC4wNTYtNzIuMDE5LTI3LjExNi03NC4zOTMtODYuNzQzYy0wLjI5NS03LjQwMy02Ljc0Ni04LjgwOS0xMC42MTctOC44OTZMMTEwLjg4LDEyNi45NzRMMTEwLjg4LDEyNi45NzR6Ii8+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzczNzg5MTsiIGQ9Ik0yMDEuMjgxLDExOC43MzRsLTM2LjQwNiwxMjQuMTU1YzkuNTgxLDMuOTQyLDIxLjE0Niw1Ljg4OCwzNS4wMTQsNS45MDIgICBjMC4yNDQsMCwwLjQ4NS0wLjAwOSwwLjcyOS0wLjAxbDM3LjA0LTEyNi4zMTdDMjI1LjU0NCwxMjAuNjMyLDIxMy40ODMsMTE5LjM1LDIwMS4yODEsMTE4LjczNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3Mzc4OTE7IiBkPSJNNDI3LjY3NywxMTkuNzRjLTEyLjExNi0wLjM4OC0yNC42OTMsMC0zNy45MDMsMS40NzVsLTMyLjUwMSwxMTAuODM3ICAgYzguODg4LDcuNDY0LDE5LjM4MSwxMS43OTksMzMuMjM0LDE0LjQ0N0w0MjcuNjc3LDExOS43NHoiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTI5Ny43NjgsNDMwLjY1NkwyOTcuNzY4LDQzMC42NTZjLTUzLjI5NiwwLTk2LjUwMi00My4yMDYtOTYuNTAyLTk2LjUwMmwwLDBoMTkzLjAwNGwwLDAgIEMzOTQuMjcxLDM4Ny40NSwzNTEuMDY1LDQzMC42NTYsMjk3Ljc2OCw0MzAuNjU2eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRjJGMkYyOyIgZD0iTTIyNC44MTIsMzM0LjE1MnYxNS4wNjRjMCw2LjM1Miw1LjE0OSwxMS41LDExLjUsMTEuNWgxMjIuOTExYzYuMzUyLDAsMTEuNS01LjE0OSwxMS41LTExLjV2LTE1LjA2NCAgSDIyNC44MTJ6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGQzRDNTk7IiBkPSJNMjk5Ljc5NCwzOTAuNjE5Yy0yNi4wODYtMTIuMTItNTUuMDMzLTEwLjM1OC03OC41MDcsMi4yMTEgIGMxNy42MzksMjIuOTksNDUuMzc3LDM3LjgyNSw3Ni41OTMsMzcuODI1bDAsMGMxMy43NTcsMCwyNi44MjktMi44OTgsMzguNjcyLTguMDg1ICBDMzI3Ljg2NCw0MDkuMTI3LDMxNS40MDYsMzk3Ljg3MywyOTkuNzk0LDM5MC42MTl6Ii8+CjxwYXRoIGQ9Ik01MDQuMzI2LDEyMC43NTljLTQ2LjMxNi05Ljg5NS05Mi45MDYtMTcuNTE3LTE1My41MTQtMi4yOTNjLTE1LjA5MSwzLjc5Mi0zMC45OTcsNy4yMzctNDQuOTE1LDYuODE1ICBjLTcuNzc2LTAuMjM4LTE1LjUyNi0yLjA0OC0yMy4wMjEtMy44MDFsLTEuMzMyLTAuMzEyYy00OC42MzMtMTEuMzM1LTEwMy4yMzItMTkuNjIxLTE3Mi44MzUtMy42NDcgIGMtNC45NDksMS4xMzUtOC4xODQsNS44OTctNy40MTgsMTAuOTE3bDQsMjYuMThjMC43MTEsNC42NTUsNC42NjMsOC4xMjYsOS4zNyw4LjIzMWMwLjQ3NSwwLjAxLDAuODY1LDAuMDU4LDEuMTY0LDAuMTE1ICBjMS4zNzUsMzMuMDA0LDcuOTY4LDU1LjU2OCwyMC43MzgsNzAuOTgyYzEzLjY1NywxNi40ODQsMzQuMzY3LDI0LjUxMyw2My4zMTQsMjQuNTQzYzAuMDM2LDAsMC4wNzEsMCwwLjEwOSwwICBjMzUuNTk0LDAsNTkuNzkyLTE4LjkyLDczLjgyNy0zNC44MDJjMTUuNzM5LTE3LjgwOSwyNS4xNzEtMzkuMDc0LDI3LjUzNy01Mi4yNDljMC42MTktMy40NDYsMS40NzgtNC4zMDEsMS40ODItNC4zMDUgIGMwLjE0MS0wLjA5MiwwLjgzLTAuNCwzLjc0NS0wLjQ3OGMzLjAyLTAuMDc5LDMuMTMxLTAuMDgxLDQuODUxLDQuODIzYzAuMjk2LDAuODQ0LDAuNTgyLDEuNjU0LDAuODc5LDIuNDAzICBjMTEuNjk3LDI5LjU2NiwyMS45NjYsNTAuNiwzNi45OTksNjQuMDk2YzE1Ljg5NywxNC4yNzMsMzUuNDE4LDE4LjYxNSw1OS44MzYsMjAuNzQ0YzQuNDAxLDAuMzg0LDguNjE0LDAuNTc3LDEyLjY0MiwwLjU3NyAgYzI0LjI0NywwLDQxLjc4Ni02Ljk3NSw1My4zOTUtMjEuMTY5YzAuMjk1LTAuMzYxLDAuNTYxLTAuNzM1LDAuODQ0LTEuMWMwLjUxNyw2LjI5OSwwLjc4OSwxMi42MjksMC43ODksMTguOTY5ICBjMCwxMjYuMTEtMTAyLjU5OCwyMjguNzA3LTIyOC43MDcsMjI4LjcwN1MxOS4zOTcsMzgyLjEwOSwxOS4zOTcsMjU1Ljk5OVMxMjEuOTk0LDI3LjI5MiwyNDguMTAzLDI3LjI5MiAgYzUwLjUzLDAsOTguNDIzLDE2LjE0NSwxMzguNTAxLDQ2LjY5YzQuMjYsMy4yNDcsMTAuMzQ3LDIuNDI1LDEzLjU5Mi0xLjgzNWMzLjI0Ny00LjI2MSwyLjQyNi0xMC4zNDctMS44MzUtMTMuNTk0ICBjLTQzLjQ4NS0zMy4xNC05NS40NDQtNTAuNjU4LTE1MC4yNTktNTAuNjU4QzExMS4yOTksNy44OTQsMCwxMTkuMTk0LDAsMjU1Ljk5OXMxMTEuMjk5LDI0OC4xMDUsMjQ4LjEwMywyNDguMTA1ICBjMTM2LjgwNiwwLDI0OC4xMDUtMTExLjI5OSwyNDguMTA1LTI0OC4xMDVjMC0xOC4wOS0xLjk4LTM2LjEwOS01Ljg0MS01My42MjZjMC45NTgtNC40OTksMS43NS04Ljk2NywyLjUwNy0xMy4yODIgIGMxLjI5Mi03LjM0LDIuNTExLTE0LjI3NCw0LjMzNy0yMC4wODljMC40OTQtMS41NzEsMC44NDgtMi4zOTYsMS4wNi0yLjgxNGMwLjIyLTAuMDMsMC41MzctMC4wNTksMC45NjktMC4wNjkgIGM0LjgwOS0wLjEwNyw4LjgxMi0zLjcyLDkuNDA5LTguNDkzbDMuMjcyLTI2LjE4QzUxMi41NDgsMTI2LjQ1Miw1MDkuMjQ4LDEyMS44MSw1MDQuMzI2LDEyMC43NTl6IE00OTAuMjUsMTQ4LjQzOSAgYy03Ljk4MywzLjQxLTEwLjM3MiwxMS4wMTktMTEuNTQ1LDE0Ljc1NGMtMi4yMDIsNy4wMjEtMy41MjksMTQuNTU4LTQuOTMyLDIyLjUzOWMtMC42NDEsMy42NDUtMS4yNzYsNy4yMjktMS45NzUsMTAuNzE0ICBjLTAuOTc1LDEuNjk3LTEuNDQxLDMuNjg3LTEuMjQ3LDUuNzMzYy01LjU5NywyMy41NzgtMTYuNjE2LDQwLjk4LTU5LjcyNywzNy4yMjJjLTQ1LjU3NS0zLjk3NC01Ny42MS0xNC44MzgtODAuNDg0LTcyLjY1MiAgYy0wLjIwNy0wLjUyNC0wLjQwMy0xLjA5LTAuNjA5LTEuNjhjLTEuODgyLTUuMzY5LTYuMjM5LTE3LjgxMi0yMi43NjYtMTcuODEyYy0wLjMsMC0wLjYwNiwwLjAwNC0wLjkxNCwwLjAxMyAgYy01LjUxNywwLjE0OS0yMC4xNjgsMC41NDMtMjMuNzkzLDIwLjc0NWMtMy4yNzMsMTguMjI4LTI5Ljg3NSw3MS4wODEtODIuMjc1LDcxLjA4MWMtMC4wMjYsMC0wLjA1OCwwLTAuMDg0LDAgIGMtNDQuOTI4LTAuMDQ5LTYyLjQ2Ny0yMS4wMzUtNjQuNzEyLTc3LjQyOWMtMC4zMS03LjgyOS00Ljc3LTEzLjg2LTExLjczMi0xNi41OTlsLTEuNjEtMTAuNTM3ICBjNjEuNjMyLTEyLjQ3NSwxMTEuMDItNC43ODcsMTU1LjI5OCw1LjUzMWwxLjMyLDAuMzA4YzguMDI5LDEuODc4LDE3LjEzLDQuMDA1LDI2Ljg0Miw0LjMwMmMxNi4zMjIsMC40OTUsMzMuNzg1LTMuMjU3LDUwLjIzNS03LjM5ICBjNTIuODQxLTEzLjI3NCw5NC44NjUtNy44MTMsMTM2LjAyOSwwLjYyNUw0OTAuMjUsMTQ4LjQzOXoiLz4KPHBhdGggZD0iTTQwMy45NjksMzM0LjE1MmMwLTUuMzU2LTQuMzQxLTkuNjk5LTkuNjk5LTkuNjk5SDIwMS4yNjZjLTUuMzU4LDAtOS42OTksNC4zNDItOS42OTksOS42OTkgIGMwLDU4LjU2LDQ3LjY0MSwxMDYuMjAxLDEwNi4yMDEsMTA2LjIwMVM0MDMuOTY5LDM5Mi43MTIsNDAzLjk2OSwzMzQuMTUyeiBNMjExLjUwMywzNDMuODUxaDE3Mi41MzEgIGMtNC44MzYsNDMuMzE3LTQxLjY3OSw3Ny4xMDUtODYuMjY1LDc3LjEwNVMyMTYuMzM5LDM4Ny4xNjgsMjExLjUwMywzNDMuODUxeiIvPgo8Y2lyY2xlIGN4PSI0MTYuMzIiIGN5PSI4Ny4xMiIgcj0iOS42OTkiLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(4):hover:after{content:"Cool"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(6){z-index:1000000112;background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPHBhdGggc3R5bGU9ImZpbGw6I0Y3OENDMjsiIGQ9Ik0yNDEuNjMzLDI4LjMyNGMtMjMuOTMsMC00Ni43MDQsNC45NDItNjcuMzY4LDEzLjg0OWMtMTAuMDgtMTIuNzAxLTI1LjY0LTIwLjg1Ny00My4xMTMtMjAuODU3ICBjLTMwLjM4OSwwLTU1LjAyNSwyNC42MzYtNTUuMDI1LDU1LjAyNWMwLDIuNDIsMC4xNzMsNC43OTgsMC40NzYsNy4xMzVjLTIuOTU0LTAuODc3LTYuMDc5LTEuMzU1LTkuMzE4LTEuMzU1ICBjLTE4LjA1NywwLTMyLjY5NCwxNC42MzgtMzIuNjk0LDMyLjY5M2MwLDE0LjI5OCw5LjE4MywyNi40NDQsMjEuOTY4LDMwLjg4NGMtMy4xMTMsNS4wMDUtNC45MTYsMTAuOTEtNC45MTYsMTcuMjM3ICBjMCwxMy40NDksOC4xMjMsMjQuOTk2LDE5LjcyOCwzMC4wMTZjLTAuMDYzLDEuOTA2LTAuMTA2LDMuODE3LTAuMTA2LDUuNzM4YzAsOTQuMDkxLDc2LjI3NiwxNzAuMzY4LDE3MC4zNjgsMTcwLjM2OCAgUzQxMiwyOTIuNzgyLDQxMiwxOTguNjkxQzQxMi4wMDEsMTA0LjYwMSwzMzUuNzI0LDI4LjMyNCwyNDEuNjMzLDI4LjMyNHoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0NDRTdBMDsiIGQ9Ik0yNjQuNDEsOC42NTdjLTE3Ljc4LDAtMzUuMDQ1LDIuMTk0LTUxLjU1NCw2LjMwMmMwLjQ4MSw1LjU3NCwwLjc0MSwxMS4yMTEsMC43NDEsMTYuOTEgIGMwLDk2LjI0My03MC4wNTcsMTc2LjExLTE2MS45NTQsMTkxLjQyMmMwLjk5MywxMTYuNjY5LDk1Ljg2MiwyMTAuOTQ1LDIxMi43NjcsMjEwLjk0NWMxMTcuNTIxLDAsMjEyLjc5LTk1LjI3LDIxMi43OS0yMTIuNzkgIEM0NzcuMiwxMDMuOTI1LDM4MS45Myw4LjY1NywyNjQuNDEsOC42NTd6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNBRUQ4OTM7IiBkPSJNMzEwLjAxLDQwMi44MjJjLTExMS4wMDEsMC0yMDIuMTM0LTg0Ljk5Ni0yMTEuOTA2LTE5My40NTMgIGMtMTQuNjI1LDYuNDg2LTMwLjIwMSwxMS4yMTItNDYuNDYxLDEzLjkyMWMwLjk5MywxMTYuNjY5LDk1Ljg2MiwyMTAuOTQ1LDIxMi43NjcsMjEwLjk0NWM1NC43MzQsMCwxMDQuNjM1LTIwLjY3MiwxNDIuMzM5LTU0LjYyNyAgQzM3Ny43MjUsMzk0LjQ1LDM0NC44NDUsNDAyLjgyMiwzMTAuMDEsNDAyLjgyMnoiLz4KPHBhdGggc3R5bGU9ImZpbGw6IzdGMTg0QzsiIGQ9Ik0zMTIuMzQ4LDI0Ny4xMTVMMzEyLjM0OCwyNDcuMTE1YzQ1LjkzLDAsODMuMTYzLDM3LjIzNCw4My4xNjMsODMuMTYzdjI1LjI5NUgyMjkuMTg1di0yNS4yOTUgIEMyMjkuMTg1LDI4NC4zNDksMjY2LjQxOSwyNDcuMTE1LDMxMi4zNDgsMjQ3LjExNXoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0I1RTU4OTsiIGQ9Ik0zMTIuMzQ4LDI4NS4yM0wzMTIuMzQ4LDI4NS4yM2MtMjYuOTUsMC00OC43OTYsMjEuODQ3LTQ4Ljc5Niw0OC43OTZ2NTUuOTE1djM3LjUxMnYyMS44MjQgIGMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1bDAsMGM4Ljk4MywwLDE2LjI2NS03LjI4MiwxNi4yNjUtMTYuMjY1djM3LjgwMmMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1ICBjOC45ODMsMCwxNi4yNjUtNy4yODIsMTYuMjY1LTE2LjI2NXYtMjMuMzczYzAsOC45ODMsNy4yODIsMTYuMjY1LDE2LjI2NSwxNi4yNjVjOC45ODMsMCwxNi4yNjUtNy4yODIsMTYuMjY1LTE2LjI2NXYtMzYuMjUyICBWNDA0LjM3di03MC4zNDJDMzYxLjE0NCwzMDcuMDc3LDMzOS4yOTgsMjg1LjIzLDMxMi4zNDgsMjg1LjIzeiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM4QkM2NzM7IiBkPSJNMzQ0Ljg3OCwzOTUuMTljLTE2LjA2MywwLTE2LjI2NSw3LjEwOC0xNi4yNjUsNy4xMDhjLTIuMjM1LDguMjMxLTcuMjgyLDE2LjI2NS0xNi4yNjUsMTYuMjY1ICAgcy0xNi4yNjUtNy4yODItMTYuMjY1LTE2LjI2NWMwLDAsMi43MjQtMjEuNTM1LTE2LjI2NS0yMS41MzVjLTguOTgzLDAtMTYuMjY1LTcuMjgyLTE2LjI2NS0xNi4yNjV2MjYuMDc2djM3LjUxMnYyMS44MjQgICBjMCw4Ljk4Myw3LjI4MiwxNi4yNjUsMTYuMjY1LDE2LjI2NWM4Ljk4MywwLDE2LjI2NS03LjI4MiwxNi4yNjUtMTYuMjY1djM3LjgwMWMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1ICAgYzguOTgzLDAsMTYuMjY1LTcuMjgyLDE2LjI2NS0xNi4yNjV2LTIzLjM3M2MwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1YzguOTgzLDAsMTYuMjY1LTcuMjgyLDE2LjI2NS0xNi4yNjV2LTM2LjI1MiAgIHYtMjMuMDg0di0yNi4wNzZDMzYxLjE0NCwzODcuOTA3LDM1My44NjIsMzk1LjE5LDM0NC44NzgsMzk1LjE5eiIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjMyNi4wNzYiIGN5PSIzNTEuMTM1IiByPSI4LjY1NyIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjMxNC4xMDciIGN5PSIzODcuMTU4IiByPSI4LjY1NyIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjI5MC4yOTYiIGN5PSIzNDIuNDc4IiByPSI4LjY1NyIvPgo8L2c+CjxwYXRoIGQ9Ik0yNjQuNDEsMGMtMTguMTEsMC0zNi4xNTgsMi4yMDctNTMuNjQ0LDYuNTU4Yy00LjEzLDEuMDI4LTYuOSw0LjkwNS02LjUzNCw5LjE0NmMwLjQ3MSw1LjQ0NiwwLjcwOSwxMC44ODQsMC43MDksMTYuMTY2ICBjMCw0NC4xNTYtMTUuNzgyLDg2LjkyNi00NC40MzcsMTIwLjQzM2MtMjEuNTM2LDI1LjE4My00OS4zMjIsNDQuMDI2LTgwLjE4Niw1NC43NTZjLTAuMTI2LTIuNjE1LTAuMTg3LTUuMzM0LTAuMTg3LTguMzY3ICBjMC0xLjYzNCwwLjAzMi0zLjM2NywwLjEwMi01LjQ1MmMwLjExOC0zLjU1NS0xLjk1MS02LjgxOS01LjIxNi04LjIzMmMtOC44MTQtMy44MTEtMTQuNTA3LTEyLjQ3Ni0xNC41MDctMjIuMDcxICBjMC00LjQ5LDEuMjQ4LTguODY5LDMuNjA5LTEyLjY2NGMxLjM5LTIuMjM1LDEuNjg5LTQuOTc5LDAuODEtNy40NjFjLTAuODc3LTIuNDc5LTIuODM2LTQuNDI2LTUuMzIxLTUuMjkgIGMtOS42NjEtMy4zNTQtMTYuMTUyLTEyLjQ4MS0xNi4xNTItMjIuNzA3YzAtMTMuMjU0LDEwLjc4NC0yNC4wMzYsMjQuMDM4LTI0LjAzNmMyLjMyLDAsNC42MjYsMC4zMzYsNi44NTQsMC45OTYgIGMyLjgwOCwwLjgzNyw1Ljg0NywwLjE5LDguMDc3LTEuNzA4YzIuMjMxLTEuOSwzLjM0Ny00Ljc5NywyLjk3MS03LjcwM2MtMC4yNzEtMi4wOTQtMC40MDQtNC4wNjQtMC40MDQtNi4wMjMgIGMwLTI1LjU2NiwyMC44LTQ2LjM2Nyw0Ni4zNjgtNDYuMzY3YzE0LjIyNSwwLDI3LjQ2OCw2LjQwOCwzNi4zMzMsMTcuNThjMi45NzEsMy43NDUsOC40MTcsNC4zNzEsMTIuMTYyLDEuNCAgYzMuNzQ0LTIuOTcxLDQuMzcyLTguNDE3LDEuNC0xMi4xNjJjLTEyLjE2OS0xNS4zMzYtMzAuMzU2LTI0LjEzMS00OS44OTYtMjQuMTMxYy0zNC4xNTIsMC02Mi4xMTEsMjcuMDE5LTYzLjYxNyw2MC44MDYgIGMtMC4wODMtMC4wMDEtMC4xNjYtMC4wMDEtMC4yNDktMC4wMDFjLTIyLjgwMSwwLTQxLjM1MSwxOC41NDktNDEuMzUxLDQxLjM1YzAsMTQuMzYxLDcuNDM5LDI3LjQ1OSwxOS4yMTMsMzQuOTI1ICBjLTEuNDIzLDQuMjI3LTIuMTU4LDguNjgxLTIuMTU4LDEzLjE5NmMwLDE0LjQ4Miw3LjUzOCwyNy43MjgsMTkuNjIzLDM1LjE4NmMtMC4wMDEsMC4xOS0wLjAwMSwwLjM4LTAuMDAxLDAuNTY4ICBjMCw0Ljg4MSwwLjE0NSw5LjE1NCwwLjQ2NCwxMy4zODJjLTQuMzExLDEuMDQ2LTguNjY2LDEuOTQ2LTEzLjA2LDIuNjc4Yy00LjIwMiwwLjcwMS03LjI3LDQuMzUzLTcuMjM1LDguNjEzICBjMC40OTcsNTguNDM0LDIzLjU0LDExMy4zNzcsNjQuODgyLDE1NC43MDRjMzkuNTIxLDM5LjUwOCw5MS40OCw2Mi4yNjksMTQ3LjAyNiw2NC42MDh2Ni42YzAsMTMuNzQyLDExLjE4MSwyNC45MjMsMjQuOTIzLDI0LjkyMyAgYzIuNjUyLDAsNS4yMDktMC40MTcsNy42MDktMS4xODd2MTQuMDY1YzAsMTMuNzQyLDExLjE4MSwyNC45MjMsMjQuOTIyLDI0LjkyM2MxMy42MjIsMCwyNC43MjYtMTAuOTg2LDI0LjkyMS0yNC41NiAgYzIuNCwwLjc3MSw0Ljk1NywxLjE4OCw3LjYxMSwxLjE4OGMxMy43NDIsMCwyNC45MjItMTEuMTgxLDI0LjkyMi0yNC45MjN2LTk5LjQ3NWgyNS43MTFjNC43ODIsMCw4LjY1Ny0zLjg3NSw4LjY1Ny04LjY1N3YtMjUuMjk1ICBjMC01MC42My00MS4xOTItOTEuODItOTEuODIxLTkxLjgycy05MS44Miw0MS4xOS05MS44Miw5MS44MnYyNS4yOTVjMCw0Ljc4MiwzLjg3NSw4LjY1Nyw4LjY1Nyw4LjY1N2gyNS43MXY2MS4xMTcgIGMtNTAuOTIyLTIuMzI4LTk4LjUzMS0yMy4yODEtMTM0Ljc4Ni01OS41MjNjLTM2LjQtMzYuMzg4LTU3LjQxMS04NC4yMjEtNTkuNjIxLTEzNS4zNzRjNDMuODc2LTkuMDI0LDgzLjgzMi0zMi41ODUsMTEzLjE3My02Ni44OTQgIGMzMS4zMzYtMzYuNjQxLDQ4LjU5NC04My40MDgsNDguNTk0LTEzMS42ODdjMC0zLjMzMy0wLjA4Ny02LjcyMS0wLjI1OS0xMC4xMzJjMTMuODk5LTIuOTM3LDI4LjEzMy00LjQyNCw0Mi40MTMtNC40MjQgIGMxMTIuNTYsMCwyMDQuMTMzLDkxLjU3MywyMDQuMTMzLDIwNC4xMzJjMCw1MS41MTktMTkuMjQ2LDEwMC43MTYtNTQuMTkzLDEzOC41MjRjLTMuMjQ2LDMuNTExLTMuMDMsOC45ODgsMC40ODEsMTIuMjMzICBjMy41MTEsMy4yNDYsOC45ODksMy4wMzEsMTIuMjM0LTAuNDgxYzM3LjkxMi00MS4wMTcsNTguNzkyLTk0LjM4Niw1OC43OTItMTUwLjI3NUM0ODUuODU2LDk5LjM0LDM4Ni41MTcsMCwyNjQuNDEsMHogICBNMzUyLjQ4Nyw0NjMuNzA0YzAsNC4xOTctMy40MTMsNy42MS03LjYwOSw3LjYxYy00LjE5NiwwLTcuNjA5LTMuNDEzLTcuNjA5LTcuNjFjMC00Ljc4Mi0zLjg3NS04LjY1Ny04LjY1Ny04LjY1NyAgYy00Ljc4MiwwLTguNjU3LDMuODc1LTguNjU3LDguNjU3djIzLjM3M2MwLDQuMTk3LTMuNDE0LDcuNjEtNy42MSw3LjYxYy00LjE5NiwwLTcuNjA5LTMuNDEzLTcuNjA5LTcuNjF2LTM3LjgwMSAgYzAtNC43ODItMy44NzUtOC42NTctOC42NTctOC42NTdzLTguNjU3LDMuODc1LTguNjU3LDguNjU3YzAsNC4xOTctMy40MTMsNy42MS03LjYwOSw3LjYxYy00LjE5NywwLTcuNjEtMy40MTMtNy42MS03LjYxVjMzNC4wMjYgIGMwLTIyLjEzMywxOC4wMDctNDAuMTM5LDQwLjEzOS00MC4xMzljMjIuMTMyLDAsNDAuMTM5LDE4LjAwNyw0MC4xMzksNDAuMTM5djEyOS42NzhIMzUyLjQ4N3ogTTIzNy44NDEsMzQ2LjkxNnYtMTYuNjM4ICBjMC00MS4wODMsMzMuNDI0LTc0LjUwNyw3NC41MDctNzQuNTA3YzQxLjA4NCwwLDc0LjUwOCwzMy40MjQsNzQuNTA4LDc0LjUwN3YxNi42MzhoLTE3LjA1NXYtMTIuODkgIGMwLTMxLjY3OS0yNS43NzItNTcuNDUyLTU3LjQ1Mi01Ny40NTJzLTU3LjQ1MiwyNS43NzQtNTcuNDUyLDU3LjQ1MnYxMi44OUgyMzcuODQxeiIvPgo8cGF0aCBkPSJNMjUyLjI0NCwxNzAuMDIzYy0zLjM4Mi0zLjM4LTguODYyLTMuMzgtMTIuMjQzLDBsLTE2LjQ1OSwxNi40NTlsLTE2LjQ1OS0xNi40NTljLTMuMzgyLTMuMzgtOC44NjItMy4zOC0xMi4yNDMsMCAgYy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0M2wxNi40NTksMTYuNDU5bC0xNi40NTksMTYuNDU5Yy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0MyAgYzEuNjkxLDEuNjksMy45MDcsMi41MzUsNi4xMjIsMi41MzVjMi4yMTUsMCw0LjQzMS0wLjg0NSw2LjEyMi0yLjUzNWwxNi40NTktMTYuNDU5bDE2LjQ1OSwxNi40NTkgIGMxLjY5MSwxLjY5LDMuOTA3LDIuNTM1LDYuMTIyLDIuNTM1czQuNDMxLTAuODQ1LDYuMTIyLTIuNTM1YzMuMzgxLTMuMzgyLDMuMzgxLTguODYyLDAtMTIuMjQzbC0xNi40NTktMTYuNDU5bDE2LjQ1OS0xNi40NTkgIEMyNTUuNjI0LDE3OC44ODQsMjU1LjYyNCwxNzMuNDAzLDI1Mi4yNDQsMTcwLjAyM3oiLz4KPHBhdGggZD0iTTQxNi4xNDIsMjE1LjE4NGwtMTYuNDU5LTE2LjQ1OWwxNi40NTktMTYuNDU5YzMuMzgxLTMuMzgyLDMuMzgxLTguODYyLDAtMTIuMjQzYy0zLjM4Mi0zLjM4LTguODYyLTMuMzgtMTIuMjQzLDAgIGwtMTYuNDU5LDE2LjQ1OWwtMTYuNDU5LTE2LjQ1OWMtMy4zODItMy4zOC04Ljg2Mi0zLjM4LTEyLjI0MywwYy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0M2wxNi40NTksMTYuNDU5bC0xNi40NTksMTYuNDU5ICBjLTMuMzgxLDMuMzgyLTMuMzgxLDguODYyLDAsMTIuMjQzYzEuNjkxLDEuNjksMy45MDcsMi41MzUsNi4xMjIsMi41MzVjMi4yMTUsMCw0LjQzMS0wLjg0NSw2LjEyMi0yLjUzNWwxNi40NTktMTYuNDU5ICBsMTYuNDU5LDE2LjQ1OWMxLjY5MSwxLjY5LDMuOTA3LDIuNTM1LDYuMTIyLDIuNTM1czQuNDMxLTAuODQ1LDYuMTIyLTIuNTM1QzQxOS41MjMsMjI0LjA0NCw0MTkuNTIzLDIxOC41NjQsNDE2LjE0MiwyMTUuMTg0eiIvPgo8cGF0aCBkPSJNMTU3LjA2Myw5NC40MDhjMS41ODQsMi44NDQsNC41MzEsNC40NDcsNy41Nyw0LjQ0NmMxLjQyNCwwLDIuODcxLTAuMzUzLDQuMjA1LTEuMDk1YzQuMTc3LTIuMzI3LDUuNjc2LTcuNTk4LDMuMzUtMTEuNzc0ICBjLTUuMTgtOS4zMDItMTUuMDA4LTE1LjA3OS0yNS42NDktMTUuMDc5Yy0xMC4zMjIsMC0yMC4xNDQsNS42ODctMjUuNjMyLDE0Ljg0Yy0yLjQ1OCw0LjEwMS0xLjEyOCw5LjQxNywyLjk3MywxMS44NzYgIGM0LjEwMiwyLjQ1Nyw5LjQxNiwxLjEyNywxMS44NzYtMi45NzNjMi4zNzgtMy45NjYsNi41MS02LjQyOSwxMC43ODMtNi40MjlDMTUwLjkwMiw4OC4yMTgsMTU0LjkzNSw5MC41OSwxNTcuMDYzLDk0LjQwOHoiLz4KPHBhdGggZD0iTTEwNy44MzksMTI0LjgwNGMtOC43NDksNS40NzktMTQuMDU0LDE1LjUxMS0xMy44NDUsMjYuMTg1YzAuMDkzLDQuNzIzLDMuOTUsOC40ODgsOC42NTIsOC40ODggIGMwLjA1OCwwLDAuMTE1LDAsMC4xNzItMC4wMDFjNC43ODEtMC4wOTUsOC41OC00LjA0Niw4LjQ4Ny04LjgyNWMtMC4wOTEtNC42MjQsMi4xMDItOC45MDUsNS43MjQtMTEuMTc0ICBjMy42OTgtMi4zMTUsOC4zNzMtMi40NDcsMTIuMjA1LTAuMzM5YzQuMTg3LDIuMzA0LDkuNDUyLDAuNzc3LDExLjc1OC0zLjQxMmMyLjMwNC00LjE4OSwwLjc3Ny05LjQ1Mi0zLjQxMi0xMS43NTggIEMxMjguMjUsMTE4LjgzMywxMTYuODUyLDExOS4xNTQsMTA3LjgzOSwxMjQuODA0eiIvPgo8Y2lyY2xlIGN4PSIzOTguMDg4IiBjeT0iMzg1LjYzNCIgcj0iOC42NTciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(6):hover:after{content:"Idiotic"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(7){z-index:1000000111;background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRkRERjZEOyIgY3g9IjI1Ni4wMDIiIGN5PSIyNTYuMDAxIiByPSIyNDUuOTk0Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGQ0M1NkI7IiBkPSJNMzA4LjcxNSw0NjUuNjc3Yy0xMzUuODU4LDAtMjQ1Ljk5My0xMTAuMTM0LTI0NS45OTMtMjQ1Ljk5MyAgYzAtNzIuNTg0LDMxLjQ0My0xMzcuODE2LDgxLjQ0NC0xODIuODQyQzY0LjUyOCw3Ny41NjIsMTAuMDA4LDE2MC40MTIsMTAuMDA4LDI1NmMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkzLDI0NS45OTMsMjQ1Ljk5MyAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk4LDE2NC41NDktNjMuMTQ5QzM4Ni45OTcsNDU1Ljk5OCwzNDguOTg4LDQ2NS42NzcsMzA4LjcxNSw0NjUuNjc3eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMzY3LjkxNCw0MTcuMjM2SDI0OC40NTZjLTUuNTI4LDAtMTAuMDA3LTQuNDc5LTEwLjAwNy0xMC4wMDdzNC40NzktMTAuMDA3LDEwLjAwNy0xMC4wMDdoMTE5LjQ1NyAgIGM1LjUyOCwwLDEwLjAwNyw0LjQ3OSwxMC4wMDcsMTAuMDA3UzM3My40NDIsNDE3LjIzNiwzNjcuOTE0LDQxNy4yMzZ6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTIyMS4wODYsMzE0LjI0OWMtMjQuMzM3LDAtNDYuMzI1LTYuMjI3LTU4LjgxNy0xNi42NThjLTQuMjQzLTMuNTQxLTQuODEtOS44NTMtMS4yNjgtMTQuMDk0ICAgYzMuNTQxLTQuMjQyLDkuODUxLTQuODEsMTQuMDk0LTEuMjY4YzguNzM2LDcuMjkzLDI2Ljc4OCwxMi4wMDYsNDUuOTksMTIuMDA2YzE4Ljc0MywwLDM3LjA0My00LjgwMiw0Ni42MjEtMTIuMjMyICAgYzQuMzY2LTMuMzg4LDEwLjY1LTIuNTk0LDE0LjA0LDEuNzczYzMuMzg4LDQuMzY2LDIuNTk0LDEwLjY1Mi0xLjc3MywxNC4wNEMyNjYuNzExLDMwOC4xMDYsMjQ0LjY5NiwzMTQuMjQ5LDIyMS4wODYsMzE0LjI0OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMzk0LjY3MywzMTQuMjQ5Yy0yNC4zMzcsMC00Ni4zMjUtNi4yMjctNTguODE3LTE2LjY1OGMtNC4yNDMtMy41NDEtNC44MS05Ljg1My0xLjI2OC0xNC4wOTQgICBzOS44NTMtNC44MSwxNC4wOTQtMS4yNjhjOC43MzYsNy4yOTMsMjYuNzg4LDEyLjAwNiw0NS45OSwxMi4wMDZjMTguNzQzLDAsMzcuMDQzLTQuODAyLDQ2LjYyMS0xMi4yMzIgICBjNC4zNjUtMy4zODgsMTAuNjUyLTIuNTk0LDE0LjA0LDEuNzczYzMuMzg4LDQuMzY2LDIuNTk0LDEwLjY1Mi0xLjc3MywxNC4wNEM0NDAuMjk3LDMwOC4xMDYsNDE4LjI4MywzMTQuMjQ5LDM5NC42NzMsMzE0LjI0OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMTczLjY5MSwyNjMuMDRjLTMuNzE5LDAtNy4xOC0wLjQxOC0xMC4yNjUtMS4yNzJjLTUuMzI3LTEuNDczLTguNDUtNi45ODYtNi45NzctMTIuMzE0ICAgYzEuNDc0LTUuMzI3LDYuOTkyLTguNDUyLDEyLjMxNC02Ljk3N2M0LjkyNiwxLjM2NSwxNS4wMzYsMC40MDcsMjYuNTIyLTQuODA0YzExLjI0My01LjA5NywxOC44NzUtMTIuMzEsMjEuNDUyLTE3LjE5NSAgIGMyLjU3OC00Ljg5LDguNjMtNi43NjQsMTMuNTE5LTQuMTg0YzQuODg5LDIuNTc4LDYuNzYyLDguNjMyLDQuMTg0LDEzLjUxOWMtNS4yNDQsOS45NDMtMTYuNzkxLDE5LjY5Ni0zMC44ODksMjYuMDg5ICAgQzE5My4yNDcsMjYwLjU3NSwxODIuNzE1LDI2My4wNCwxNzMuNjkxLDI2My4wNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNNDM5LjQ5LDI2My4wNGMtOS4wMjUsMC0xOS41NTQtMi40NjQtMjkuODYyLTcuMTM5Yy0xNC4wOTctNi4zOTEtMjUuNjQ0LTE2LjE0NC0zMC44ODctMjYuMDg3ICAgYy0yLjU3OS00Ljg4OC0wLjcwNS0xMC45NDEsNC4xODQtMTMuNTE5YzQuODg5LTIuNTgyLDEwLjk0MS0wLjcwMywxMy41MTksNC4xODRjMi41NzgsNC44ODUsMTAuMjA5LDEyLjA5NywyMS40NDksMTcuMTk0ICAgYzExLjQ4Nyw1LjIxLDIxLjYsNi4xNjksMjYuNTIyLDQuODA1YzUuMzMzLTEuNDY5LDEwLjg0LDEuNjQ5LDEyLjMxNCw2Ljk3NmMxLjQ3Myw1LjMyNy0xLjY0OSwxMC44NC02Ljk3NiwxMi4zMTQgICBDNDQ2LjY3LDI2Mi42MjEsNDQzLjIwOCwyNjMuMDQsNDM5LjQ5LDI2My4wNHoiLz4KPC9nPgo8cGF0aCBkPSJNMzU1LjU2MiwyMC4wODRjLTUuMDg4LTIuMTUyLTEwLjk2MSwwLjIzMi0xMy4xMTIsNS4zMjNzMC4yMzIsMTAuOTYzLDUuMzIzLDEzLjExMiAgYzg3LjYwNiwzNy4wMTUsMTQ0LjIxNCwxMjIuMzgyLDE0NC4yMTQsMjE3LjQ4YzAsMTMwLjEyNC0xMDUuODYyLDIzNS45ODUtMjM1Ljk4NCwyMzUuOTg1UzIwLjAxNSwzODYuMTIyLDIwLjAxNSwyNTUuOTk5ICBTMTI1Ljg3OCwyMC4wMTUsMjU2LjAwMSwyMC4wMTVjNS41MjgsMCwxMC4wMDctNC40NzksMTAuMDA3LTEwLjAwN1MyNjEuNTI5LDAsMjU2LjAwMSwwYy0xNDEuMTYsMC0yNTYsMTE0Ljg0LTI1NiwyNTUuOTk5ICBjMCwxNDEuMTYsMTE0Ljg0LDI1Ni4wMDEsMjU2LDI1Ni4wMDFjMTQxLjE1OCwwLDI1NS45OTktMTE0Ljg0LDI1NS45OTktMjU2QzUxMi4wMDEsMTUyLjgzOSw0NTAuNTk0LDYwLjIzNiwzNTUuNTYyLDIwLjA4NHoiLz4KPHBhdGggZD0iTTI0OC40NTYsMzk3LjIyMmMtNS41MjgsMC0xMC4wMDcsNC40NzktMTAuMDA3LDEwLjAwN3M0LjQ3OSwxMC4wMDcsMTAuMDA3LDEwLjAwN2gxMTkuNDU3ICBjNS41MjgsMCwxMC4wMDctNC40NzksMTAuMDA3LTEwLjAwN3MtNC40NzktMTAuMDA3LTEwLjAwNy0xMC4wMDdIMjQ4LjQ1NnoiLz4KPHBhdGggZD0iTTE3NS4wOTcsMjgyLjIzYy00LjI0NC0zLjU0NC0xMC41NTMtMi45NzQtMTQuMDk0LDEuMjY4Yy0zLjU0Myw0LjI0My0yLjk3NCwxMC41NTMsMS4yNjgsMTQuMDk0ICBjMTIuNDkyLDEwLjQzLDM0LjQ4LDE2LjY1OCw1OC44MTcsMTYuNjU4YzIzLjYwOSwwLDQ1LjYyNC02LjE0Myw1OC44ODktMTYuNDMyYzQuMzY3LTMuMzg4LDUuMTYxLTkuNjc0LDEuNzczLTE0LjA0ICBjLTMuMzg5LTQuMzY5LTkuNjc0LTUuMTYtMTQuMDQtMS43NzNjLTkuNTc5LDcuNDI5LTI3Ljg3OSwxMi4yMzItNDYuNjIxLDEyLjIzMkMyMDEuODg1LDI5NC4yMzYsMTgzLjgzMiwyODkuNTIyLDE3NS4wOTcsMjgyLjIzeiIvPgo8cGF0aCBkPSJNMzM1Ljg1NywyOTcuNTkyYzEyLjQ5MiwxMC40MywzNC40OCwxNi42NTgsNTguODE3LDE2LjY1OGMyMy42MDksMCw0NS42MjQtNi4xNDMsNTguODg5LTE2LjQzMiAgYzQuMzY3LTMuMzg4LDUuMTYxLTkuNjc0LDEuNzczLTE0LjA0Yy0zLjM4OC00LjM2OS05LjY3NS01LjE2LTE0LjA0LTEuNzczYy05LjU3OSw3LjQyOS0yNy44NzksMTIuMjMyLTQ2LjYyMSwxMi4yMzIgIGMtMTkuMjAyLDAtMzcuMjU0LTQuNzEzLTQ1Ljk5LTEyLjAwNmMtNC4yNDMtMy41NDQtMTAuNTUyLTIuOTc0LTE0LjA5NCwxLjI2OEMzMzEuMDQ2LDI4Ny43MzksMzMxLjYxNCwyOTQuMDUxLDMzNS44NTcsMjk3LjU5MnoiLz4KPHBhdGggZD0iTTE3My42OTEsMjYzLjA0YzkuMDI0LDAsMTkuNTU0LTIuNDYzLDI5Ljg1OS03LjEzNmMxNC4wOTgtNi4zOTMsMjUuNjQ3LTE2LjE0NSwzMC44ODktMjYuMDg4ICBjMi41NzktNC44ODgsMC43MDUtMTAuOTQxLTQuMTg0LTEzLjUxOWMtNC44ODktMi41ODItMTAuOTQxLTAuNzA1LTEzLjUxOSw0LjE4NGMtMi41NzgsNC44ODUtMTAuMjA5LDEyLjA5Ny0yMS40NTIsMTcuMTk0ICBjLTExLjQ4Niw1LjIxLTIxLjU5NSw2LjE3LTI2LjUyMSw0LjgwNGMtNS4zMjMtMS40NjgtMTAuODQsMS42NDktMTIuMzE0LDYuOTc2Yy0xLjQ3Myw1LjMyNSwxLjY0OCwxMC44NCw2Ljk3NiwxMi4zMTQgIEMxNjYuNTEsMjYyLjYyMSwxNjkuOTcyLDI2My4wNCwxNzMuNjkxLDI2My4wNHoiLz4KPHBhdGggZD0iTTQwOS42MywyNTUuOTA0YzEwLjMwOCw0LjY3MywyMC44MzcsNy4xMzYsMjkuODYxLDcuMTM2YzMuNzE3LDAsNy4xODEtMC40MTgsMTAuMjY2LTEuMjczICBjNS4zMjUtMS40NzQsOC40NDgtNi45ODgsNi45NzMtMTIuMzE0Yy0xLjQ3NC01LjMyNS02Ljk4LTguNDUtMTIuMzE0LTYuOTczYy00LjkyMSwxLjM1Ny0xNS4wMzEsMC40MDYtMjYuNTIxLTQuODA1ICBjLTExLjI0LTUuMDk2LTE4Ljg3My0xMi4zMDktMjEuNDQ5LTE3LjE5NGMtMi41NzgtNC44ODktOC42My02Ljc2NS0xMy41MTktNC4xODRjLTQuODg5LDIuNTc4LTYuNzYyLDguNjMyLTQuMTg0LDEzLjUxOSAgQzM4My45ODQsMjM5Ljc2LDM5NS41MzEsMjQ5LjUxMSw0MDkuNjMsMjU1LjkwNHoiLz4KPGNpcmNsZSBjeD0iMzE5LjEwMiIgY3k9IjE4Ljg0MSIgcj0iMTAuMDA3Ii8+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(7):hover:after{content:"Sad"}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(8){background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRkM0QzU5OyIgY3g9IjI1Ni4wMDEiIGN5PSIyNTYuMDAxIiByPSIyNDUuOTk0Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNCQzNCNEE7IiBkPSJNMzA4LjcxNiw0NjUuNjc4Yy0xMzUuODU4LDAtMjQ1Ljk5My0xMTAuMTM0LTI0NS45OTMtMjQ1Ljk5MyAgYzAtNzIuNTg0LDMxLjQ0My0xMzcuODE2LDgxLjQ0NC0xODIuODQyQzY0LjUyNyw3Ny41NjIsMTAuMDA3LDE2MC40MTQsMTAuMDA3LDI1NmMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkzLDI0NS45OTMsMjQ1Ljk5MyAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk4LDE2NC41NDktNjMuMTQ5QzM4Ni45OTgsNDU1Ljk5OSwzNDguOTg3LDQ2NS42NzgsMzA4LjcxNiw0NjUuNjc4eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojN0MxNTJFOyIgZD0iTTQwMS41NTksNDA2LjExNGMtMy41MTMsMC4wMDEtNi45MjEtMS44NTItOC43NTItNS4xNGMtMTIuMjMtMjEuOTUzLTM1LjQyMS0zNS41OTMtNjAuNTItMzUuNTkzICBjLTI0LjQ1MSwwLTQ3Ljg4MiwxMy43NDUtNjEuMTQ2LDM1Ljg2OWMtMi44NDMsNC43MzktOC45OTIsNi4yNzUtMTMuNzI5LDMuNDM3Yy00Ljc0MS0yLjg0Mi02LjI3OS04Ljk4OC0zLjQzNy0xMy43MjkgIGMxNi44NjItMjguMTIyLDQ2Ljg2OS00NS41OTIsNzguMzEyLTQ1LjU5MmMzMi4zNTYsMCw2Mi4yNDYsMTcuNTc2LDc4LjAwNSw0NS44NjhjMi42OSw0LjgyOCwwLjk1NywxMC45MjMtMy44NzIsMTMuNjExICBDNDA0Ljg3Nyw0MDUuNzA2LDQwMy4yMDUsNDA2LjExNCw0MDEuNTU5LDQwNi4xMTR6Ii8+CjxnPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojRkZGRkZGOyIgY3g9IjI1NS40ODEiIGN5PSIyNTAuNTcxIiByPSIyNy4yOTYiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI0MDEuNTQ4IiBjeT0iMjQzLjE5MiIgcj0iMjcuMjk2Ii8+CjwvZz4KPGc+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0MxNTJFOyIgZD0iTTI1NS45NjUsMjg3Ljg5NGMtNC41NDksMC05LjEwOS0wLjgxNC0xMy41MDEtMi40NWMtOS42NjgtMy42MDEtMTcuMzU1LTEwLjc1Mi0yMS42NDUtMjAuMTMzICAgYy00LjMyNy05LjQ2My00LjQwNy0yMC43ODktMC4yMjEtMzEuMDc1YzIuMjc2LTUuNTkyLDUuNzExLTEwLjU2OCw5Ljk4NS0xNC42MDdjLTEuNzkxLTAuOTE5LTMuNjA4LTEuODU3LTUuNDQ5LTIuODEzICAgYy02LjgzNC0zLjU0OC0xMi4zMjgtNi43OTItMTcuNjQtOS45MjdjLTYuMjgxLTMuNzA3LTEyLjc3Ni03LjU0LTIyLjAwNS0xMi4yMTZjLTQuOTMtMi40OTctNi45MDQtOC41MTgtNC40MDYtMTMuNDQ5ICAgYzIuNDk4LTQuOTMyLDguNTE4LTYuOTA1LDEzLjQ1LTQuNDA2YzkuODA1LDQuOTY1LDE2LjU4Miw4Ljk2NywyMy4xMzYsMTIuODM1YzUuMzE2LDMuMTM4LDEwLjMzOCw2LjEwMiwxNi42OSw5LjQgICBjNC4yNzEsMi4yMTgsOC40MTIsNC4zMzMsMTIuMzkzLDYuMzY2YzE3LjAzLDguNywzMS43MzgsMTYuMjEzLDQxLjUyOCwyNC4xNTZjMS4xOTcsMC45NzMsMi4xNTQsMi4yMDcsMi43OTUsMy42MDkgICBjNC4yOTEsOS4zODMsNC42NywxOS44NzYsMS4wNywyOS41NDRjLTMuNjAxLDkuNjY3LTEwLjc1MywxNy4zNTUtMjAuMTM1LDIxLjY0NUMyNjYuODg1LDI4Ni43MTcsMjYxLjQzMywyODcuODk0LDI1NS45NjUsMjg3Ljg5NHogICAgTTI1MC44MDQsMjMwLjAyNGMtNS4yODksMi4wODYtOS40Myw2LjI1NS0xMS42NjksMTEuNzU4Yy0yLjExNSw1LjE5OC0yLjE1OCwxMC43NDEtMC4xMTUsMTUuMjA2ICAgYzIuMDY3LDQuNTIxLDUuNzcxLDcuOTY2LDEwLjQyOSw5LjcwMmM0LjY1NCwxLjczMiw5LjcxLDEuNTUyLDE0LjIzMy0wLjUxNWM0LjUyMi0yLjA2OCw3Ljk2Ny01Ljc3Miw5LjcwMi0xMC40MyAgIGMxLjQ3NC0zLjk2LDEuNTY0LTguMjA2LDAuMjg3LTEyLjE2OUMyNjcuOTM5LDIzOS4zMTgsMjYwLjAxOCwyMzQuODU4LDI1MC44MDQsMjMwLjAyNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3QzE1MkU7IiBkPSJNNDAyLjg1OSwyODEuMDgyYy01LjQ2OSwwLTEwLjkyMS0xLjE3Ny0xNi4wNDItMy41MmMtOS4zODItNC4yOS0xNi41MzMtMTEuOTc4LTIwLjEzNS0yMS42NDUgICBjLTMuNi05LjY2OC0zLjIyMS0yMC4xNiwxLjA3LTI5LjU0NGMwLjcwNS0xLjU0MSwxLjc5MS0yLjg3OSwzLjE1NC0zLjg4N2MxMC41MTgtNy43NywyNC40MS0xNS44NDgsNDEuMjg2LTI0LjAwNyAgIGMyNS4zMjgtMTIuMjQ2LDI3LjAxMi0xMy4yMzQsNDcuNjA4LTI1LjMxNmwzLjEyOS0xLjgzNWM0Ljc2Ny0yLjc5NywxMC44OTktMS4xOTcsMTMuNjk1LDMuNTcxICAgYzIuNzk3LDQuNzY3LDEuMTk3LDEwLjktMy41NzEsMTMuNjk1bC0zLjEyNiwxLjgzM2MtMTguMjY1LDEwLjcxNS0yMi4xNjcsMTMuMDAzLTQwLjQ5OCwyMS45MzUgICBjMy42NTIsMy40OCw2LjU5OCw3LjYzOSw4LjY5LDEyLjM0NWM0LjczNCwxMC42NDYsNC42OSwyMy4yNzgtMC4xMTYsMzMuNzg5Yy00LjI5LDkuMzgyLTExLjk3OCwxNi41MzQtMjEuNjQ1LDIwLjEzNSAgIEM0MTEuOTY5LDI4MC4yNjgsNDA3LjQwOSwyODEuMDgyLDQwMi44NTksMjgxLjA4MnogTTM4NS4xLDIzNi45MjNjLTEuMjI0LDMuOTE4LTEuMTE4LDguMTAyLDAuMzM4LDEyLjAwOSAgIGMxLjczNiw0LjY1OCw1LjE4MSw4LjM2Myw5LjcwMiwxMC40M2M0LjUyMSwyLjA2Niw5LjU3OCwyLjI0NywxNC4yMzMsMC41MTVjNC42NTgtMS43MzYsOC4zNjMtNS4xODEsMTAuNDMtOS43MDIgICBjMi40MTktNS4yOTEsMi40My0xMS45MzMsMC4wMjgtMTcuMzM1Yy0xLjQ4OS0zLjM0OS00LjU4Ni03LjcxMi0xMC45NjUtMTAuMjU2QzM5OS42MTUsMjI3LjQ4OCwzOTEuNjYsMjMyLjI4NywzODUuMSwyMzYuOTIzeiIvPgo8L2c+CjxwYXRoIGQ9Ik00NzAuNDU2LDExNi4xNDVDNDQzLjk3OCw3NS42MjUsNDA2LjgsNDMuNTMzLDM2Mi45NCwyMy4zNDFjLTUuMDI0LTIuMzEtMTAuOTY0LTAuMTE1LTEzLjI3NSw0LjkwNSAgYy0yLjMxMSw1LjAyMS0wLjExNSwxMC45NjUsNC45MDUsMTMuMjc1YzQwLjQzOCwxOC42MTUsNzQuNzE2LDQ4LjIwNiw5OS4xMzMsODUuNTcyQzQ3OC43NDksMTY1LjQyNSw0OTEuOTg3LDIxMCw0OTEuOTg3LDI1NiAgYzAsMTMwLjEyNC0xMDUuODYzLDIzNS45ODQtMjM1Ljk4NSwyMzUuOTg0UzIwLjAxNSwzODYuMTI0LDIwLjAxNSwyNTYuMDAxUzEyNS44NzYsMjAuMDE1LDI1NiwyMC4wMTUgIGM1LjUyOCwwLDEwLjAwNy00LjQ3OSwxMC4wMDctMTAuMDA3UzI2MS41MjgsMCwyNTYsMEMxMTQuODQsMCwwLDExNC44NDIsMCwyNTYuMDAxQzAsMzk3LjE2LDExNC44NCw1MTIsMjU2LDUxMiAgczI1Ni0xMTQuODQsMjU2LTI1NS45OTlDNTEyLDIwNi4xMDEsNDk3LjYzNSwxNTcuNzQsNDcwLjQ1NiwxMTYuMTQ1eiIvPgo8cGF0aCBkPSJNMjUzLjk3MywzOTAuOTZjLTIuODQyLDQuNzQxLTEuMzA0LDEwLjg4NywzLjQzNywxMy43MjljNC43MzcsMi44MzksMTAuODg1LDEuMzAyLDEzLjcyOS0zLjQzNyAgYzEzLjI2NC0yMi4xMjQsMzYuNjk1LTM1Ljg2OSw2MS4xNDYtMzUuODY5YzI1LjEwMSwwLDQ4LjI5LDEzLjYzOSw2MC41MiwzNS41OTNjMS44MzEsMy4yODgsNS4yMzgsNS4xNDEsOC43NTIsNS4xNCAgYzEuNjQ3LDAsMy4zMTgtMC40MDgsNC44NjEtMS4yNjZjNC44MjktMi42OSw2LjU2Mi04Ljc4NCwzLjg3Mi0xMy42MTFjLTE1Ljc2LTI4LjI5My00NS42NS00NS44NjgtNzguMDA1LTQ1Ljg2OCAgQzMwMC44NDIsMzQ1LjM2OCwyNzAuODM1LDM2Mi44MzgsMjUzLjk3MywzOTAuOTZ6Ii8+CjxwYXRoIGQ9Ik0yMzQuMzU3LDE5OS4wNTNjLTYuMzUxLTMuMjk4LTExLjM3Mi02LjI2Mi0xNi42OS05LjRjLTYuNTU0LTMuODY4LTEzLjMzMS03Ljg3LTIzLjEzNi0xMi44MzUgIGMtNC45My0yLjQ5OS0xMC45NTItMC41MjctMTMuNDUsNC40MDZjLTIuNDk4LDQuOTMtMC41MjQsMTAuOTUyLDQuNDA2LDEzLjQ0OWM5LjIyOSw0LjY3NSwxNS43MjUsOC41MDksMjIuMDA2LDEyLjIxNiAgYzUuMzEyLDMuMTM3LDEwLjgwNyw2LjM3OSwxNy42NCw5LjkyN2MxLjg0MSwwLjk1NywzLjY1OSwxLjg5Myw1LjQ0OSwyLjgxM2MtNC4yNzQsNC4wMzktNy43MSw5LjAxNS05Ljk4NSwxNC42MDcgIGMtNC4xODYsMTAuMjg2LTQuMTA2LDIxLjYxMiwwLjIyMSwzMS4wNzVjNC4yOSw5LjM4MiwxMS45NzcsMTYuNTMyLDIxLjY0NSwyMC4xMzNjNC4zOTEsMS42MzYsOC45NTEsMi40NSwxMy41MDEsMi40NSAgYzUuNDY5LDAsMTAuOTIxLTEuMTc3LDE2LjA0Mi0zLjUyYzkuMzgyLTQuMjksMTYuNTM0LTExLjk3OCwyMC4xMzUtMjEuNjQ1YzMuNi05LjY2OCwzLjIyMS0yMC4xNi0xLjA3LTI5LjU0NCAgYy0wLjY0LTEuNDAyLTEuNTk3LTIuNjM4LTIuNzk1LTMuNjA5Yy05Ljc5LTcuOTQzLTI0LjQ5OC0xNS40NTgtNDEuNTI4LTI0LjE1NkMyNDIuNzY5LDIwMy4zODUsMjM4LjYyOSwyMDEuMjcsMjM0LjM1NywxOTkuMDUzeiAgIE0yNzMuNjczLDI0My41NzRjMS4yNzcsMy45NjMsMS4xODksOC4yMDktMC4yODcsMTIuMTY5Yy0xLjczNiw0LjY1OC01LjE4MSw4LjM2My05LjcwMiwxMC40MyAgYy00LjUyMywyLjA2Ny05LjU3OSwyLjI0Ny0xNC4yMzMsMC41MTVjLTQuNjU4LTEuNzM2LTguMzYzLTUuMTgxLTEwLjQyOS05LjcwMmMtMi4wNDMtNC40NjYtMi4wMDEtMTAuMDA5LDAuMTE1LTE1LjIwNiAgYzIuMjM5LTUuNTAxLDYuMzc5LTkuNjcyLDExLjY2OS0xMS43NThDMjYwLjAxOCwyMzQuODU4LDI2Ny45MzksMjM5LjMxOCwyNzMuNjczLDI0My41NzR6Ii8+CjxwYXRoIGQ9Ik00NzMuMDU0LDE4OC41OTZjNC43NjctMi43OTUsNi4zNjYtOC45MjcsMy41NzEtMTMuNjk1Yy0yLjc5NS00Ljc2OS04LjkyNy02LjM2Ni0xMy42OTUtMy41NzFsLTMuMTI5LDEuODM1ICBjLTIwLjU5NiwxMi4wODItMjIuMjc5LDEzLjA3LTQ3LjYwOCwyNS4zMTZjLTE2Ljg3Niw4LjE1OS0zMC43NjksMTYuMjM3LTQxLjI4NiwyNC4wMDdjLTEuMzY0LDEuMDA3LTIuNDUsMi4zNDYtMy4xNTQsMy44ODcgIGMtNC4yOTEsOS4zODMtNC42NywxOS44NzYtMS4wNywyOS41NDRjMy42MDEsOS42NjcsMTAuNzUzLDE3LjM1NSwyMC4xMzUsMjEuNjQ1YzUuMTIyLDIuMzQzLDEwLjU3NCwzLjUyLDE2LjA0MiwzLjUyICBjNC41NDksMCw5LjEwOS0wLjgxNCwxMy41MDEtMi40NWM5LjY2Ny0zLjYwMSwxNy4zNTUtMTAuNzUzLDIxLjY0NS0yMC4xMzVjNC44MDYtMTAuNTEsNC44NS0yMy4xNDIsMC4xMTYtMzMuNzg5ICBjLTIuMDkxLTQuNzA2LTUuMDM3LTguODY1LTguNjktMTIuMzQ1YzE4LjMyOS04LjkzMiwyMi4yMzEtMTEuMjIsNDAuNDk4LTIxLjkzNUw0NzMuMDU0LDE4OC41OTZ6IE00MTkuODA0LDI1MC4xNzQgIGMtMi4wNjgsNC41MjItNS43NzIsNy45NjctMTAuNDMsOS43MDJjLTQuNjU1LDEuNzMyLTkuNzEyLDEuNTUtMTQuMjMzLTAuNTE1Yy00LjUyMi0yLjA2OC03Ljk2Ny01Ljc3Mi05LjcwMi0xMC40MyAgYy0xLjQ1Ni0zLjkwNy0xLjU2MS04LjA5MS0wLjMzOC0xMi4wMDljNi41NTktNC42MzcsMTQuNTE1LTkuNDM0LDIzLjc2OC0xNC4zMzljNi4zNzksMi41NDIsOS40NzYsNi45MDYsMTAuOTY1LDEwLjI1NiAgQzQyMi4yMzQsMjM4LjI0Miw0MjIuMjIyLDI0NC44ODUsNDE5LjgwNCwyNTAuMTc0eiIvPgo8Y2lyY2xlIGN4PSIzMjMuMTMxIiBjeT0iMjAuMDE1IiByPSIxMC4wMDciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-reactions .rev-reaction-bar .rev-reaction .rev-reaction-menu .rev-reaction-menu-container .rev-reaction-menu-item:nth-of-type(8):hover:after{content:"Angry"}#rev-slider2 .rev-content .rev-comments{background:#f6f7f9;border-top:1px solid #e5e5e5;border-top-color:#e5e5e5;border-bottom-right-radius:4px;border-bottom-left-radius:4px}#rev-slider2 .rev-content .rev-comments.rev-has-comments .rev-reactions-total{margin-bottom:9px;border-bottom:1px solid #e5e5e5}#rev-slider2 .rev-content .rev-comments .rev-reactions-total{line-height:0;padding:9px}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner{display:inline-block}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction{display:inline-block;position:relative;border-radius:10px;background:#f6f7f9;margin-left:-4px;height:20px;padding:2px}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction:first-child{margin-left:0}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner{width:16px;height:16px}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner .rev-reaction-icon{position:absolute;width:16px;height:16px;background-size:cover}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner .rev-reaction-icon.rev-reaction-icon-love{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8cGF0aCBzdHlsZT0iZmlsbDojRkY0RDVFOyIgZD0iTTI1Niw5Ni4yNDhjLTU2LjY5MS01Ni42OTEtMTQ4Ljc2Ny01Ni40MzItMjA1LjEzNSwwLjc3OCAgYy01NS45MjMsNTYuNzU4LTU0LjI4OCwxNDguNTI2LDIuMDU1LDIwNC44NjhsMTIzLjAyNCwxMjMuMDI0YzQ0LjIxNCw0NC4yMTQsMTE1Ljg5OSw0NC4yMTQsMTYwLjExNCwwbDEyMy4wMjQtMTIzLjAyNCAgYzU2LjM0My01Ni4zNDMsNTcuOTc4LTE0OC4xMSwyLjA1NS0yMDQuODY4QzQwNC43NjcsMzkuODE1LDMxMi42OTEsMzkuNTU3LDI1Niw5Ni4yNDh6Ii8+CjxwYXRoIGQ9Ik00NjguMTQ3LDkwLjExNWMtMjkuMS0yOS41MzQtNjcuOTQ5LTQ1Ljg4NC0xMDkuMzkxLTQ2LjAzN2MtMC4xOTgtMC4wMDEtMC4zOTItMC4wMDEtMC41OS0wLjAwMSAgYy0zOC4wMjUsMC03My45MzUsMTMuNjQ5LTEwMi4xNjcsMzguNjU1Yy0yOC4yMzUtMjUuMDA3LTY0LjEzOS0zOC42NTUtMTAyLjE2Ny0zOC42NTVjLTAuMTk0LDAtMC4zOTQsMC0wLjU5LDAuMDAxICBDMTExLjgsNDQuMjMyLDcyLjk1MSw2MC41ODEsNDMuODUyLDkwLjExNWMtNTkuMjg0LDYwLjE2OS01OC4zMzgsMTU4LjI5NCwyLjEwNiwyMTguNzRsMTIzLjAyNCwxMjMuMDIzICBjMjMuMjQzLDIzLjI0NCw1NC4xNDcsMzYuMDQ0LDg3LjAxOSwzNi4wNDRzNjMuNzc1LTEyLjgsODcuMDE5LTM2LjA0NGwxMjMuMDI0LTEyMy4wMjMgIEM1MjYuNDg2LDI0OC40MSw1MjcuNDMxLDE1MC4yODUsNDY4LjE0Nyw5MC4xMTV6IE00NTIuMTE5LDI5NC45MzJMMzI5LjA5NSw0MTcuOTU2Yy0xOS41MjUsMTkuNTI1LTQ1LjQ4MywzMC4yNzctNzMuMDk1LDMwLjI3NyAgYy0yNy42MTIsMC01My41Ny0xMC43NTMtNzMuMDk1LTMwLjI3N0w1OS44ODEsMjk0LjkzMkM3LjA1NywyNDIuMTA4LDYuMTU5LDE1Ni40MjcsNTcuODc3LDEwMy45MzUgIGMyNS4zODktMjUuNzY4LDU5LjI4NC00MC4wMzMsOTUuNDM4LTQwLjE2N2MwLjE3Mi0wLjAwMSwwLjM0My0wLjAwMSwwLjUxNC0wLjAwMWMzNS45NjcsMCw2OS43NjIsMTMuOTk2LDk1LjIwOCwzOS40NDIgIGMzLjg0NSwzLjg0MywxMC4wNzcsMy44NDMsMTMuOTI0LDBjMjUuNDQ3LTI1LjQ0Nyw1OS4yMzgtMzkuNDQyLDk1LjIwOC0zOS40NDJjMC4xNywwLDAuMzQ1LDAsMC41MTQsMC4wMDEgIGMzNi4xNTYsMC4xMzQsNzAuMDQ5LDE0LjM5OCw5NS40MzgsNDAuMTY3QzUwNS44NDEsMTU2LjQyNyw1MDQuOTQzLDI0Mi4xMDgsNDUyLjExOSwyOTQuOTMyeiIvPgo8cGF0aCBkPSJNMTQ3Ljc0Niw4OC4zNTljLTM3LjkyNSwwLTcxLjkzMywyMS4wMTQtODguNzUzLDU0Ljg0MmMtMi40MjEsNC44NjgtMC40MzYsMTAuNzc3LDQuNDMyLDEzLjE5OCAgYzEuNDA5LDAuNywyLjkwMiwxLjAzMiw0LjM3NSwxLjAzMmMzLjYxOSwwLDcuMTAyLTIuMDAzLDguODIzLTUuNDY0YzEzLjQ3MS0yNy4wOSw0MC43MjMtNDMuOTE4LDcxLjEyMy00My45MTggIGM1LjQzNiwwLDkuODQ1LTQuNDA4LDkuODQ1LTkuODQ1UzE1My4xODMsODguMzU5LDE0Ny43NDYsODguMzU5eiIvPgo8cGF0aCBkPSJNNjAuMzgyLDE2Ni45NzFjLTUuMzkzLTAuNjU1LTEwLjMwNCwzLjE5MS0xMC45NTgsOC41ODljLTAuMDAxLDAuMDEyLTAuMDIxLDAuMTc2LTAuMDIyLDAuMTkgIGMtMC42NTMsNS4zOTMsMy4xODYsMTAuMjk3LDguNTgxLDEwLjk1NmMwLjQwNSwwLjA0OSwwLjgwNiwwLjA3NCwxLjIwNiwwLjA3NGM0LjkwNCwwLDkuMTUtMy42Niw5Ljc1OS04LjY1MyAgYzAuMDAxLTAuMDAzLDAuMDIzLTAuMTk1LDAuMDI0LTAuMTk5QzY5LjYyNCwxNzIuNTMyLDY1Ljc3OSwxNjcuNjI1LDYwLjM4MiwxNjYuOTcxeiIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner .rev-reaction-icon.rev-reaction-icon-laugh{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk5IDUxMS45OTkiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTkgNTExLjk5OTsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZEREY2RDsiIGN4PSIyNTYuNiIgY3k9IjI1Ni4wMDEiIHI9IjI0NS45OTMiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0ZDQzU2QjsiIGQ9Ik0zMDkuMzEyLDQ2NS42NzdjLTEzNS44NTgsMC0yNDUuOTkyLTExMC4xMzQtMjQ1Ljk5Mi0yNDUuOTkyICBjMC03Mi41ODQsMzEuNDQzLTEzNy44MTYsODEuNDQ0LTE4Mi44NDJDNjUuMTI2LDc3LjU2MiwxMC42MDYsMTYwLjQxMywxMC42MDYsMjU1Ljk5OWMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkyLDI0NS45OTIsMjQ1Ljk5MiAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk3LDE2NC41NDgtNjMuMTQ5QzM4Ny41OTQsNDU1Ljk5OCwzNDkuNTg1LDQ2NS42NzcsMzA5LjMxMiw0NjUuNjc3eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNNDE3LjA1OCwyMzAuMzYzYy0zLjUxMywwLjAwMS02LjkyMS0xLjg1Mi04Ljc1Mi01LjE0Yy02LjQyMS0xMS41MjYtMTguNTk0LTE4LjY4Ni0zMS43NzEtMTguNjg2ICAgYy0xMi44NTEsMC0yNS4xODksNy4yNjUtMzIuMjAyLDE4Ljk2MmMtMi44NDIsNC43MzktOC45ODksNi4yNzgtMTMuNzI5LDMuNDM3Yy00Ljc0MS0yLjg0Mi02LjI3OS04Ljk4OC0zLjQzNy0xMy43MjkgICBjMTAuNjA4LTE3LjY5NCwyOS41MjQtMjguNjg1LDQ5LjM2OC0yOC42ODVjMjAuNDMyLDAsMzkuMzA2LDExLjA5Niw0OS4yNTYsMjguOTYxYzIuNjksNC44MjgsMC45NTUsMTAuOTIzLTMuODcyLDEzLjYxMSAgIEM0MjAuMzc4LDIyOS45NTYsNDE4LjcwNiwyMzAuMzYzLDQxNy4wNTgsMjMwLjM2M3oiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMjQ2LjMzLDIzMC4zNjNjLTMuNTEzLDAuMDAxLTYuOTIxLTEuODUyLTguNzUyLTUuMTRjLTYuNDIxLTExLjUyNi0xOC41OTQtMTguNjg2LTMxLjc3MS0xOC42ODYgICBjLTEyLjg0OSwwLTI1LjE4OSw3LjI2NS0zMi4yMDIsMTguOTYyYy0yLjg0MSw0LjczOS04Ljk4Nyw2LjI3OC0xMy43MjksMy40MzdjLTQuNzM5LTIuODQyLTYuMjc5LTguOTg5LTMuNDM2LTEzLjcyOSAgIGMxMC42MDgtMTcuNjk0LDI5LjUyNC0yOC42ODUsNDkuMzY4LTI4LjY4NWMyMC40MzIsMCwzOS4zMDYsMTEuMDk2LDQ5LjI1NiwyOC45NjFjMi42OSw0LjgyOCwwLjk1NSwxMC45MjMtMy44NzIsMTMuNjExICAgQzI0OS42NDksMjI5Ljk1NiwyNDcuOTc4LDIzMC4zNjMsMjQ2LjMzLDIzMC4zNjN6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTI5My41NDUsNDM3LjcwNkwyOTMuNTQ1LDQzNy43MDZjLTcwLjk4MSwwLTEyOC41MjItNTcuNTQxLTEyOC41MjItMTI4LjUyMmwwLDBoMjU3LjA0M2wwLDAgICBDNDIyLjA2NiwzODAuMTY0LDM2NC41MjUsNDM3LjcwNiwyOTMuNTQ1LDQzNy43MDZ6Ii8+CjwvZz4KPHBhdGggc3R5bGU9ImZpbGw6I0YyRjJGMjsiIGQ9Ik0xOTYuMzgyLDMwOS4xODR2MjAuMDYxYzAsOC40Niw2Ljg1NywxNS4zMTcsMTUuMzE3LDE1LjMxN2gxNjMuNjkzICBjOC40NTgsMCwxNS4zMTctNi44NTcsMTUuMzE3LTE1LjMxN3YtMjAuMDYxSDE5Ni4zODJMMTk2LjM4MiwzMDkuMTg0eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkM0QzU5OyIgZD0iTTI5Ni4yNDEsMzg0LjM4NWMtMzQuNzQtMTYuMTQtNzMuMjk0LTEzLjc5NS0xMDQuNTU0LDIuOTQ1ICBjMjMuNDkyLDMwLjYxNyw2MC40MzIsNTAuMzc0LDEwMi4wMDcsNTAuMzc0bDAsMGMxOC4zMiwwLDM1LjczMS0zLjg1OSw1MS41MDMtMTAuNzY3ICBDMzMzLjYyNiw0MDkuMDM0LDMxNy4wMzQsMzk0LjA0NiwyOTYuMjQxLDM4NC4zODV6Ii8+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzNGQTlGNTsiIGQ9Ik0xNTEuMTE5LDMzNS41NDNjLTE1LjAxNiwxNi40MjMtNDAuNTAyLDE3LjU2NS01Ni45MjYsMi41NDlzLTE3LjU2NS00MC41MDItMi41NDktNTYuOTI2ICAgYzE1LjAxNi0xNi40MjMsODMuOTExLTMyLjA2Myw4My45MTEtMzIuMDYzUzE2Ni4xMzYsMzE5LjExOSwxNTEuMTE5LDMzNS41NDN6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojM0ZBOUY1OyIgZD0iTTQyNy42NjcsMzI2LjU2NGMxNS4wMTYsMTYuNDIzLDQwLjUwMiwxNy41NjUsNTYuOTI2LDIuNTQ5czE3LjU2NS00MC41MDIsMi41NDktNTYuOTI2ICAgYy0xNS4wMTYtMTYuNDIzLTgzLjkxMS0zMi4wNjMtODMuOTExLTMyLjA2M1M0MTIuNjUyLDMxMC4xNDIsNDI3LjY2NywzMjYuNTY0eiIvPgo8L2c+CjxwYXRoIGQ9Ik0zNzYuNTM1LDE4Ni41MjZjLTE5Ljg0NCwwLTM4Ljc2LDEwLjk5MS00OS4zNjgsMjguNjg1Yy0yLjg0Miw0Ljc0MS0xLjMwNCwxMC44ODcsMy40MzcsMTMuNzI5ICBjNC43MzksMi44NDEsMTAuODg3LDEuMzA0LDEzLjcyOS0zLjQzN2M3LjAxMi0xMS42OTcsMTkuMzUxLTE4Ljk2MiwzMi4yMDItMTguOTYyYzEzLjE3NiwwLDI1LjM1MSw3LjE2LDMxLjc3MSwxOC42ODYgIGMxLjgzMSwzLjI4OCw1LjIzOCw1LjE0MSw4Ljc1Miw1LjE0YzEuNjQ4LDAsMy4zMi0wLjQwOCw0Ljg2MS0xLjI2NmM0LjgyOS0yLjY5LDYuNTYyLTguNzg0LDMuODcyLTEzLjYxMSAgQzQxNS44NDEsMTk3LjYyMiwzOTYuOTY3LDE4Ni41MjYsMzc2LjUzNSwxODYuNTI2eiIvPgo8cGF0aCBkPSJNMjA1LjgwNywxODYuNTI2Yy0xOS44NDMsMC0zOC43NTksMTAuOTkxLTQ5LjM2OCwyOC42ODVjLTIuODQyLDQuNzM5LTEuMzA0LDEwLjg4NywzLjQzNiwxMy43MjkgIGM0Ljc0MiwyLjg0MSwxMC44ODgsMS4zMDQsMTMuNzI5LTMuNDM3YzcuMDEzLTExLjY5NywxOS4zNTMtMTguOTYyLDMyLjIwMi0xOC45NjJjMTMuMTc2LDAsMjUuMzUxLDcuMTYsMzEuNzcxLDE4LjY4NiAgYzEuODMxLDMuMjg4LDUuMjM4LDUuMTQxLDguNzUyLDUuMTRjMS42NDgsMCwzLjMyLTAuNDA4LDQuODYxLTEuMjY2YzQuODI5LTIuNjksNi41NjItOC43ODQsMy44NzItMTMuNjExICBDMjQ1LjExMywxOTcuNjIyLDIyNi4yNCwxODYuNTI2LDIwNS44MDcsMTg2LjUyNnoiLz4KPHBhdGggZD0iTTQ5NC41MjcsMjY1LjQzNmMtMTYuMzA0LTE3LjgzMy03Ny4wNjYtMzIuMzQyLTg5LjA4MS0zNS4wN2MtMy4xOTYtMC43MjYtNi41NDcsMC4xNi04Ljk2OCwyLjM3MiAgYy0yLjQxOSwyLjIxMi0zLjYwMyw1LjQ3MS0zLjE2NSw4LjcyYzEuMDIxLDcuNTgzLDQuODg5LDM0LjI4OSwxMS41NzYsNTcuNzE4SDE3Ni4yOTJjNS4yMjEtMjAuODgzLDguMjktNDIuMTEzLDkuMTgxLTQ4LjczOCAgYzAuNDM4LTMuMjUtMC43NDYtNi41MDctMy4xNjUtOC43MmMtMi40Mi0yLjIxMi01Ljc3NC0zLjA5OC04Ljk2OC0yLjM3MmMtMTIuMDE1LDIuNzI3LTcyLjc3NywxNy4yMzctODkuMDgxLDM1LjA2OCAgYy0xOC43MTUsMjAuNDY4LTE3LjI4Nyw1Mi4zNDgsMy4xODIsNzEuMDYzYzkuMzQ3LDguNTQ2LDIxLjMwMiwxMy4xNzksMzMuODg2LDEzLjE3OWMwLjc2NiwwLDEuNTM0LTAuMDE3LDIuMzA0LTAuMDUyICBjMTMuNDIyLTAuNiwyNS44MDctNi4zOTMsMzQuODcyLTE2LjMwOWMwLjEzNi0wLjE0OCwwLjI2Ny0wLjMyNiwwLjQwMi0wLjQ3OWMxNC43MTEsNjAuNjksNjkuNDksMTA1Ljg5NywxMzQuNjM3LDEwNS44OTcgIGM2NS4yNjgsMCwxMjAuNjc4LTQ1LjUyNywxMzQuOTU2LTEwNy4xNjljOC42MSw2LjA0NywxOC43NTQsOS4xMDksMjguOTI1LDkuMTA5YzUuNzc0LDAsMTEuNTUyLTAuOTk4LDE3LjA2Ni0yLjk4MSAgYy0xNS4xNzksMzYuMzE1LTM5LjQzMyw2OC43MzgtNzAuNDQ5LDkzLjU5MWMtNDIuMjI4LDMzLjgzNy05My4yMTQsNTEuNzIyLTE0Ny40NDQsNTEuNzIyICBjLTEzMC4xMjMsMC0yMzUuOTg1LTEwNS44NjMtMjM1Ljk4NS0yMzUuOTg1UzEyNi40NzUsMjAuMDE1LDI1Ni41OTgsMjAuMDE1YzEwNy4zNjUsMCwyMDEuMjY1LDcyLjQ1NywyMjguMzQ4LDE3Ni4yMDIgIGMxLjM5Niw1LjM0OSw2Ljg2Miw4LjU1MywxMi4yMSw3LjE1NWM1LjM0OC0xLjM5Niw4LjU1Mi02Ljg2NCw3LjE1NS0xMi4yMUM0NzQuOTI4LDc4LjYwOCwzNzMuMDY2LDAsMjU2LjU5OCwwICBDMTE1LjQzOCwwLDAuNTk4LDExNC44NCwwLjU5OCwyNTUuOTk5czExNC44NCwyNTUuOTk5LDI1NS45OTksMjU1Ljk5OWM1Ny45ODgsMCwxMTQuNzk2LTE5LjkyOSwxNTkuOTU4LTU2LjExNyAgYzQ0LjQ3NS0zNS42MzUsNzYuMTQ2LTg1LjYzMyw4OS4xODEtMTQwLjc4YzAuMjIzLTAuOTQ1LDAuMjk4LTEuODg4LDAuMjUxLTIuODExQzUxMC4yMTQsMjk2LjI5Miw1MDYuNDk5LDI3OC41MjksNDk0LjUyNywyNjUuNDM2eiAgIE0xMjIuNzM3LDMzOC42MDljLTguMDcsMC4zNjctMTUuODE4LTIuNDQ2LTIxLjc4OS03LjkwNGMtMTIuMzI1LTExLjI2OC0xMy4xODQtMzAuNDYyLTEuOTE2LTQyLjc4NyAgYzcuNDM3LTguMTM0LDM4LjQyLTE4LjY1Miw2NC4zNTktMjUuNTA4Yy00LjUxMSwyNi40NDYtMTIuMjE4LDU4LjI0NC0xOS42NTYsNjYuMzgxICBDMTM4LjI3NSwzMzQuNzYxLDEzMC44MTgsMzM4LjI0OCwxMjIuNzM3LDMzOC42MDl6IE0yOTMuNTQzLDQyNy42OThjLTYxLjk3OSwwLTExMi45OTktNDcuODI0LTExOC4wOTYtMTA4LjUwN2gyMzYuMTk0ICBDNDA2LjU0LDM4MC4yNSwzNTUuMTc3LDQyNy42OTgsMjkzLjU0Myw0MjcuNjk4eiBNNDU2LjA0OSwzMjkuNjMyYy04LjA4Mi0wLjM2Mi0xNS41MzgtMy44NDktMjAuOTk3LTkuODE5ICBjLTEuMjkyLTEuNDEzLTIuNTkxLTMuNTUzLTMuODgtNi4yNDFjLTAuMTc5LTAuNDcxLTAuMzg2LTAuOTI5LTAuNjMyLTEuMzYyYy0wLjgwMi0xLjc4OC0xLjU5OS0zLjc3Ni0yLjM4Ny01Ljk0NCAgYy0wLjA2NS0wLjIxNi0wLjE0Ny0wLjQyNy0wLjIyNy0wLjYzNmMtNC45MjgtMTMuODEtOS40NjctMzQuMjM2LTEyLjUzLTUyLjJjMjUuOTM0LDYuODUzLDU2LjkxMiwxNy4zNjcsNjQuMzU5LDI1LjUxMiAgYzExLjI2OCwxMi4zMjQsMTAuNDA5LDMxLjUxOS0xLjkxNiw0Mi43ODdDNDcxLjg3LDMyNy4xODcsNDY0LjEzNSwzMjkuOTk2LDQ1Ni4wNDksMzI5LjYzMnoiLz4KPGNpcmNsZSBjeD0iNTAxLjM5MyIgY3k9IjIyNi4wMzIiIHI9IjEwLjAwNyIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K)}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner .rev-reaction-icon.rev-reaction-icon-cool{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTEuOTk3IDUxMS45OTciIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMS45OTcgNTExLjk5NzsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGREI2QzsiIGN4PSIyNDguMTA2IiBjeT0iMjU1Ljk5NCIgcj0iMjM4LjQwNyIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkZCMDRDOyIgZD0iTTI5OS4xOTQsNDU5LjIxYy0xMzEuNjY4LDAtMjM4LjQwNi0xMDYuNzM4LTIzOC40MDYtMjM4LjQwNmMwLTcwLjM0NSwzMC40NzMtMTMzLjU2NSw3OC45MzItMTc3LjIwMyAgQzYyLjUzNyw4My4wNjQsOS42OTksMTYzLjM2MSw5LjY5OSwyNTUuOTk5YzAsMTMxLjY2OCwxMDYuNzM4LDIzOC40MDYsMjM4LjQwNiwyMzguNDA2YzYxLjMyMywwLDExNy4yMzEtMjMuMTYxLDE1OS40NzQtNjEuMjAxICBDMzc1LjA2MSw0NDkuODI5LDMzOC4yMjQsNDU5LjIxLDI5OS4xOTQsNDU5LjIxeiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNGOUE4ODA7IiBkPSJNMTQ1LjY1MSwyNTkuNDE3Yy0xNy43MDUsMC0zMi4wNTksMTQuMzUzLTMyLjA1OSwzMi4wNTdoNjQuMTE2ICAgQzE3Ny43MSwyNzMuNzY5LDE2My4zNTcsMjU5LjQxNywxNDUuNjUxLDI1OS40MTd6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRjlBODgwOyIgZD0iTTQyNS4yODEsMjU5LjQxN2MtMTcuNzA1LDAtMzIuMDU5LDE0LjM1My0zMi4wNTksMzIuMDU3aDY0LjExNiAgIEM0NTcuMzM4LDI3My43NjksNDQyLjk4NSwyNTkuNDE3LDQyNS4yODEsMjU5LjQxN3oiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojNTY1ODZGOyIgZD0iTTExMC44OCwxMjYuOTc0YzYyLjI1LTE0LjI4NywxMTIuNjQzLTkuMzcsMTY4LjQ2NCwzLjYzOWM4LjI3OCwxLjkyOCwxNy4wMjIsNC4wNzksMjYuMjU4LDQuMzYxICBjMTUuMzgsMC40NzEsMzIuNjY5LTMuMzU3LDQ3LjU3NS03LjEwMmM1OC44NS0xNC43ODMsMTA0LjgyMi03LjA5NCwxNDkuMTIzLDIuMzcybC0zLjI3MywyNi4xOCAgYy02LjkxNiwwLjE1My05LjA5MSwzLjM3OC0xMS4wNjcsOS42NzNjLTEwLjM0LDMyLjk0NS0xLjUzNCw4OS42My03Ny45NzgsODIuOTY1Yy01MC4yOS00LjM4NS02NC42OTItMTguMTY0LTg4LjY2LTc4Ljc0NiAgYy0yLjAzOS01LjE1My0zLjM2NS0xMy42NjktMTUuMDExLTEzLjM1NGMtNi41NzYsMC4xNzctMTIuNDU3LDEuMzQtMTQuNTA4LDEyLjc2NWMtMy44MjMsMjEuMjg4LTMyLjg5Myw3OS4xMjktOTEuOTE1LDc5LjA2NSAgYy01Mi4xMzItMC4wNTYtNzIuMDE5LTI3LjExNi03NC4zOTMtODYuNzQzYy0wLjI5NS03LjQwMy02Ljc0Ni04LjgwOS0xMC42MTctOC44OTZMMTEwLjg4LDEyNi45NzRMMTEwLjg4LDEyNi45NzR6Ii8+CjxnPgoJPHBhdGggc3R5bGU9ImZpbGw6IzczNzg5MTsiIGQ9Ik0yMDEuMjgxLDExOC43MzRsLTM2LjQwNiwxMjQuMTU1YzkuNTgxLDMuOTQyLDIxLjE0Niw1Ljg4OCwzNS4wMTQsNS45MDIgICBjMC4yNDQsMCwwLjQ4NS0wLjAwOSwwLjcyOS0wLjAxbDM3LjA0LTEyNi4zMTdDMjI1LjU0NCwxMjAuNjMyLDIxMy40ODMsMTE5LjM1LDIwMS4yODEsMTE4LjczNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3Mzc4OTE7IiBkPSJNNDI3LjY3NywxMTkuNzRjLTEyLjExNi0wLjM4OC0yNC42OTMsMC0zNy45MDMsMS40NzVsLTMyLjUwMSwxMTAuODM3ICAgYzguODg4LDcuNDY0LDE5LjM4MSwxMS43OTksMzMuMjM0LDE0LjQ0N0w0MjcuNjc3LDExOS43NHoiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTI5Ny43NjgsNDMwLjY1NkwyOTcuNzY4LDQzMC42NTZjLTUzLjI5NiwwLTk2LjUwMi00My4yMDYtOTYuNTAyLTk2LjUwMmwwLDBoMTkzLjAwNGwwLDAgIEMzOTQuMjcxLDM4Ny40NSwzNTEuMDY1LDQzMC42NTYsMjk3Ljc2OCw0MzAuNjU2eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRjJGMkYyOyIgZD0iTTIyNC44MTIsMzM0LjE1MnYxNS4wNjRjMCw2LjM1Miw1LjE0OSwxMS41LDExLjUsMTEuNWgxMjIuOTExYzYuMzUyLDAsMTEuNS01LjE0OSwxMS41LTExLjV2LTE1LjA2NCAgSDIyNC44MTJ6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGQzRDNTk7IiBkPSJNMjk5Ljc5NCwzOTAuNjE5Yy0yNi4wODYtMTIuMTItNTUuMDMzLTEwLjM1OC03OC41MDcsMi4yMTEgIGMxNy42MzksMjIuOTksNDUuMzc3LDM3LjgyNSw3Ni41OTMsMzcuODI1bDAsMGMxMy43NTcsMCwyNi44MjktMi44OTgsMzguNjcyLTguMDg1ICBDMzI3Ljg2NCw0MDkuMTI3LDMxNS40MDYsMzk3Ljg3MywyOTkuNzk0LDM5MC42MTl6Ii8+CjxwYXRoIGQ9Ik01MDQuMzI2LDEyMC43NTljLTQ2LjMxNi05Ljg5NS05Mi45MDYtMTcuNTE3LTE1My41MTQtMi4yOTNjLTE1LjA5MSwzLjc5Mi0zMC45OTcsNy4yMzctNDQuOTE1LDYuODE1ICBjLTcuNzc2LTAuMjM4LTE1LjUyNi0yLjA0OC0yMy4wMjEtMy44MDFsLTEuMzMyLTAuMzEyYy00OC42MzMtMTEuMzM1LTEwMy4yMzItMTkuNjIxLTE3Mi44MzUtMy42NDcgIGMtNC45NDksMS4xMzUtOC4xODQsNS44OTctNy40MTgsMTAuOTE3bDQsMjYuMThjMC43MTEsNC42NTUsNC42NjMsOC4xMjYsOS4zNyw4LjIzMWMwLjQ3NSwwLjAxLDAuODY1LDAuMDU4LDEuMTY0LDAuMTE1ICBjMS4zNzUsMzMuMDA0LDcuOTY4LDU1LjU2OCwyMC43MzgsNzAuOTgyYzEzLjY1NywxNi40ODQsMzQuMzY3LDI0LjUxMyw2My4zMTQsMjQuNTQzYzAuMDM2LDAsMC4wNzEsMCwwLjEwOSwwICBjMzUuNTk0LDAsNTkuNzkyLTE4LjkyLDczLjgyNy0zNC44MDJjMTUuNzM5LTE3LjgwOSwyNS4xNzEtMzkuMDc0LDI3LjUzNy01Mi4yNDljMC42MTktMy40NDYsMS40NzgtNC4zMDEsMS40ODItNC4zMDUgIGMwLjE0MS0wLjA5MiwwLjgzLTAuNCwzLjc0NS0wLjQ3OGMzLjAyLTAuMDc5LDMuMTMxLTAuMDgxLDQuODUxLDQuODIzYzAuMjk2LDAuODQ0LDAuNTgyLDEuNjU0LDAuODc5LDIuNDAzICBjMTEuNjk3LDI5LjU2NiwyMS45NjYsNTAuNiwzNi45OTksNjQuMDk2YzE1Ljg5NywxNC4yNzMsMzUuNDE4LDE4LjYxNSw1OS44MzYsMjAuNzQ0YzQuNDAxLDAuMzg0LDguNjE0LDAuNTc3LDEyLjY0MiwwLjU3NyAgYzI0LjI0NywwLDQxLjc4Ni02Ljk3NSw1My4zOTUtMjEuMTY5YzAuMjk1LTAuMzYxLDAuNTYxLTAuNzM1LDAuODQ0LTEuMWMwLjUxNyw2LjI5OSwwLjc4OSwxMi42MjksMC43ODksMTguOTY5ICBjMCwxMjYuMTEtMTAyLjU5OCwyMjguNzA3LTIyOC43MDcsMjI4LjcwN1MxOS4zOTcsMzgyLjEwOSwxOS4zOTcsMjU1Ljk5OVMxMjEuOTk0LDI3LjI5MiwyNDguMTAzLDI3LjI5MiAgYzUwLjUzLDAsOTguNDIzLDE2LjE0NSwxMzguNTAxLDQ2LjY5YzQuMjYsMy4yNDcsMTAuMzQ3LDIuNDI1LDEzLjU5Mi0xLjgzNWMzLjI0Ny00LjI2MSwyLjQyNi0xMC4zNDctMS44MzUtMTMuNTk0ICBjLTQzLjQ4NS0zMy4xNC05NS40NDQtNTAuNjU4LTE1MC4yNTktNTAuNjU4QzExMS4yOTksNy44OTQsMCwxMTkuMTk0LDAsMjU1Ljk5OXMxMTEuMjk5LDI0OC4xMDUsMjQ4LjEwMywyNDguMTA1ICBjMTM2LjgwNiwwLDI0OC4xMDUtMTExLjI5OSwyNDguMTA1LTI0OC4xMDVjMC0xOC4wOS0xLjk4LTM2LjEwOS01Ljg0MS01My42MjZjMC45NTgtNC40OTksMS43NS04Ljk2NywyLjUwNy0xMy4yODIgIGMxLjI5Mi03LjM0LDIuNTExLTE0LjI3NCw0LjMzNy0yMC4wODljMC40OTQtMS41NzEsMC44NDgtMi4zOTYsMS4wNi0yLjgxNGMwLjIyLTAuMDMsMC41MzctMC4wNTksMC45NjktMC4wNjkgIGM0LjgwOS0wLjEwNyw4LjgxMi0zLjcyLDkuNDA5LTguNDkzbDMuMjcyLTI2LjE4QzUxMi41NDgsMTI2LjQ1Miw1MDkuMjQ4LDEyMS44MSw1MDQuMzI2LDEyMC43NTl6IE00OTAuMjUsMTQ4LjQzOSAgYy03Ljk4MywzLjQxLTEwLjM3MiwxMS4wMTktMTEuNTQ1LDE0Ljc1NGMtMi4yMDIsNy4wMjEtMy41MjksMTQuNTU4LTQuOTMyLDIyLjUzOWMtMC42NDEsMy42NDUtMS4yNzYsNy4yMjktMS45NzUsMTAuNzE0ICBjLTAuOTc1LDEuNjk3LTEuNDQxLDMuNjg3LTEuMjQ3LDUuNzMzYy01LjU5NywyMy41NzgtMTYuNjE2LDQwLjk4LTU5LjcyNywzNy4yMjJjLTQ1LjU3NS0zLjk3NC01Ny42MS0xNC44MzgtODAuNDg0LTcyLjY1MiAgYy0wLjIwNy0wLjUyNC0wLjQwMy0xLjA5LTAuNjA5LTEuNjhjLTEuODgyLTUuMzY5LTYuMjM5LTE3LjgxMi0yMi43NjYtMTcuODEyYy0wLjMsMC0wLjYwNiwwLjAwNC0wLjkxNCwwLjAxMyAgYy01LjUxNywwLjE0OS0yMC4xNjgsMC41NDMtMjMuNzkzLDIwLjc0NWMtMy4yNzMsMTguMjI4LTI5Ljg3NSw3MS4wODEtODIuMjc1LDcxLjA4MWMtMC4wMjYsMC0wLjA1OCwwLTAuMDg0LDAgIGMtNDQuOTI4LTAuMDQ5LTYyLjQ2Ny0yMS4wMzUtNjQuNzEyLTc3LjQyOWMtMC4zMS03LjgyOS00Ljc3LTEzLjg2LTExLjczMi0xNi41OTlsLTEuNjEtMTAuNTM3ICBjNjEuNjMyLTEyLjQ3NSwxMTEuMDItNC43ODcsMTU1LjI5OCw1LjUzMWwxLjMyLDAuMzA4YzguMDI5LDEuODc4LDE3LjEzLDQuMDA1LDI2Ljg0Miw0LjMwMmMxNi4zMjIsMC40OTUsMzMuNzg1LTMuMjU3LDUwLjIzNS03LjM5ICBjNTIuODQxLTEzLjI3NCw5NC44NjUtNy44MTMsMTM2LjAyOSwwLjYyNUw0OTAuMjUsMTQ4LjQzOXoiLz4KPHBhdGggZD0iTTQwMy45NjksMzM0LjE1MmMwLTUuMzU2LTQuMzQxLTkuNjk5LTkuNjk5LTkuNjk5SDIwMS4yNjZjLTUuMzU4LDAtOS42OTksNC4zNDItOS42OTksOS42OTkgIGMwLDU4LjU2LDQ3LjY0MSwxMDYuMjAxLDEwNi4yMDEsMTA2LjIwMVM0MDMuOTY5LDM5Mi43MTIsNDAzLjk2OSwzMzQuMTUyeiBNMjExLjUwMywzNDMuODUxaDE3Mi41MzEgIGMtNC44MzYsNDMuMzE3LTQxLjY3OSw3Ny4xMDUtODYuMjY1LDc3LjEwNVMyMTYuMzM5LDM4Ny4xNjgsMjExLjUwMywzNDMuODUxeiIvPgo8Y2lyY2xlIGN4PSI0MTYuMzIiIGN5PSI4Ny4xMiIgcj0iOS42OTkiLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner .rev-reaction-icon.rev-reaction-icon-idiotic{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPHBhdGggc3R5bGU9ImZpbGw6I0Y3OENDMjsiIGQ9Ik0yNDEuNjMzLDI4LjMyNGMtMjMuOTMsMC00Ni43MDQsNC45NDItNjcuMzY4LDEzLjg0OWMtMTAuMDgtMTIuNzAxLTI1LjY0LTIwLjg1Ny00My4xMTMtMjAuODU3ICBjLTMwLjM4OSwwLTU1LjAyNSwyNC42MzYtNTUuMDI1LDU1LjAyNWMwLDIuNDIsMC4xNzMsNC43OTgsMC40NzYsNy4xMzVjLTIuOTU0LTAuODc3LTYuMDc5LTEuMzU1LTkuMzE4LTEuMzU1ICBjLTE4LjA1NywwLTMyLjY5NCwxNC42MzgtMzIuNjk0LDMyLjY5M2MwLDE0LjI5OCw5LjE4MywyNi40NDQsMjEuOTY4LDMwLjg4NGMtMy4xMTMsNS4wMDUtNC45MTYsMTAuOTEtNC45MTYsMTcuMjM3ICBjMCwxMy40NDksOC4xMjMsMjQuOTk2LDE5LjcyOCwzMC4wMTZjLTAuMDYzLDEuOTA2LTAuMTA2LDMuODE3LTAuMTA2LDUuNzM4YzAsOTQuMDkxLDc2LjI3NiwxNzAuMzY4LDE3MC4zNjgsMTcwLjM2OCAgUzQxMiwyOTIuNzgyLDQxMiwxOTguNjkxQzQxMi4wMDEsMTA0LjYwMSwzMzUuNzI0LDI4LjMyNCwyNDEuNjMzLDI4LjMyNHoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0NDRTdBMDsiIGQ9Ik0yNjQuNDEsOC42NTdjLTE3Ljc4LDAtMzUuMDQ1LDIuMTk0LTUxLjU1NCw2LjMwMmMwLjQ4MSw1LjU3NCwwLjc0MSwxMS4yMTEsMC43NDEsMTYuOTEgIGMwLDk2LjI0My03MC4wNTcsMTc2LjExLTE2MS45NTQsMTkxLjQyMmMwLjk5MywxMTYuNjY5LDk1Ljg2MiwyMTAuOTQ1LDIxMi43NjcsMjEwLjk0NWMxMTcuNTIxLDAsMjEyLjc5LTk1LjI3LDIxMi43OS0yMTIuNzkgIEM0NzcuMiwxMDMuOTI1LDM4MS45Myw4LjY1NywyNjQuNDEsOC42NTd6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNBRUQ4OTM7IiBkPSJNMzEwLjAxLDQwMi44MjJjLTExMS4wMDEsMC0yMDIuMTM0LTg0Ljk5Ni0yMTEuOTA2LTE5My40NTMgIGMtMTQuNjI1LDYuNDg2LTMwLjIwMSwxMS4yMTItNDYuNDYxLDEzLjkyMWMwLjk5MywxMTYuNjY5LDk1Ljg2MiwyMTAuOTQ1LDIxMi43NjcsMjEwLjk0NWM1NC43MzQsMCwxMDQuNjM1LTIwLjY3MiwxNDIuMzM5LTU0LjYyNyAgQzM3Ny43MjUsMzk0LjQ1LDM0NC44NDUsNDAyLjgyMiwzMTAuMDEsNDAyLjgyMnoiLz4KPHBhdGggc3R5bGU9ImZpbGw6IzdGMTg0QzsiIGQ9Ik0zMTIuMzQ4LDI0Ny4xMTVMMzEyLjM0OCwyNDcuMTE1YzQ1LjkzLDAsODMuMTYzLDM3LjIzNCw4My4xNjMsODMuMTYzdjI1LjI5NUgyMjkuMTg1di0yNS4yOTUgIEMyMjkuMTg1LDI4NC4zNDksMjY2LjQxOSwyNDcuMTE1LDMxMi4zNDgsMjQ3LjExNXoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0I1RTU4OTsiIGQ9Ik0zMTIuMzQ4LDI4NS4yM0wzMTIuMzQ4LDI4NS4yM2MtMjYuOTUsMC00OC43OTYsMjEuODQ3LTQ4Ljc5Niw0OC43OTZ2NTUuOTE1djM3LjUxMnYyMS44MjQgIGMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1bDAsMGM4Ljk4MywwLDE2LjI2NS03LjI4MiwxNi4yNjUtMTYuMjY1djM3LjgwMmMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1ICBjOC45ODMsMCwxNi4yNjUtNy4yODIsMTYuMjY1LTE2LjI2NXYtMjMuMzczYzAsOC45ODMsNy4yODIsMTYuMjY1LDE2LjI2NSwxNi4yNjVjOC45ODMsMCwxNi4yNjUtNy4yODIsMTYuMjY1LTE2LjI2NXYtMzYuMjUyICBWNDA0LjM3di03MC4zNDJDMzYxLjE0NCwzMDcuMDc3LDMzOS4yOTgsMjg1LjIzLDMxMi4zNDgsMjg1LjIzeiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM4QkM2NzM7IiBkPSJNMzQ0Ljg3OCwzOTUuMTljLTE2LjA2MywwLTE2LjI2NSw3LjEwOC0xNi4yNjUsNy4xMDhjLTIuMjM1LDguMjMxLTcuMjgyLDE2LjI2NS0xNi4yNjUsMTYuMjY1ICAgcy0xNi4yNjUtNy4yODItMTYuMjY1LTE2LjI2NWMwLDAsMi43MjQtMjEuNTM1LTE2LjI2NS0yMS41MzVjLTguOTgzLDAtMTYuMjY1LTcuMjgyLTE2LjI2NS0xNi4yNjV2MjYuMDc2djM3LjUxMnYyMS44MjQgICBjMCw4Ljk4Myw3LjI4MiwxNi4yNjUsMTYuMjY1LDE2LjI2NWM4Ljk4MywwLDE2LjI2NS03LjI4MiwxNi4yNjUtMTYuMjY1djM3LjgwMWMwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1ICAgYzguOTgzLDAsMTYuMjY1LTcuMjgyLDE2LjI2NS0xNi4yNjV2LTIzLjM3M2MwLDguOTgzLDcuMjgyLDE2LjI2NSwxNi4yNjUsMTYuMjY1YzguOTgzLDAsMTYuMjY1LTcuMjgyLDE2LjI2NS0xNi4yNjV2LTM2LjI1MiAgIHYtMjMuMDg0di0yNi4wNzZDMzYxLjE0NCwzODcuOTA3LDM1My44NjIsMzk1LjE5LDM0NC44NzgsMzk1LjE5eiIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjMyNi4wNzYiIGN5PSIzNTEuMTM1IiByPSI4LjY1NyIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjMxNC4xMDciIGN5PSIzODcuMTU4IiByPSI4LjY1NyIvPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojOEJDNjczOyIgY3g9IjI5MC4yOTYiIGN5PSIzNDIuNDc4IiByPSI4LjY1NyIvPgo8L2c+CjxwYXRoIGQ9Ik0yNjQuNDEsMGMtMTguMTEsMC0zNi4xNTgsMi4yMDctNTMuNjQ0LDYuNTU4Yy00LjEzLDEuMDI4LTYuOSw0LjkwNS02LjUzNCw5LjE0NmMwLjQ3MSw1LjQ0NiwwLjcwOSwxMC44ODQsMC43MDksMTYuMTY2ICBjMCw0NC4xNTYtMTUuNzgyLDg2LjkyNi00NC40MzcsMTIwLjQzM2MtMjEuNTM2LDI1LjE4My00OS4zMjIsNDQuMDI2LTgwLjE4Niw1NC43NTZjLTAuMTI2LTIuNjE1LTAuMTg3LTUuMzM0LTAuMTg3LTguMzY3ICBjMC0xLjYzNCwwLjAzMi0zLjM2NywwLjEwMi01LjQ1MmMwLjExOC0zLjU1NS0xLjk1MS02LjgxOS01LjIxNi04LjIzMmMtOC44MTQtMy44MTEtMTQuNTA3LTEyLjQ3Ni0xNC41MDctMjIuMDcxICBjMC00LjQ5LDEuMjQ4LTguODY5LDMuNjA5LTEyLjY2NGMxLjM5LTIuMjM1LDEuNjg5LTQuOTc5LDAuODEtNy40NjFjLTAuODc3LTIuNDc5LTIuODM2LTQuNDI2LTUuMzIxLTUuMjkgIGMtOS42NjEtMy4zNTQtMTYuMTUyLTEyLjQ4MS0xNi4xNTItMjIuNzA3YzAtMTMuMjU0LDEwLjc4NC0yNC4wMzYsMjQuMDM4LTI0LjAzNmMyLjMyLDAsNC42MjYsMC4zMzYsNi44NTQsMC45OTYgIGMyLjgwOCwwLjgzNyw1Ljg0NywwLjE5LDguMDc3LTEuNzA4YzIuMjMxLTEuOSwzLjM0Ny00Ljc5NywyLjk3MS03LjcwM2MtMC4yNzEtMi4wOTQtMC40MDQtNC4wNjQtMC40MDQtNi4wMjMgIGMwLTI1LjU2NiwyMC44LTQ2LjM2Nyw0Ni4zNjgtNDYuMzY3YzE0LjIyNSwwLDI3LjQ2OCw2LjQwOCwzNi4zMzMsMTcuNThjMi45NzEsMy43NDUsOC40MTcsNC4zNzEsMTIuMTYyLDEuNCAgYzMuNzQ0LTIuOTcxLDQuMzcyLTguNDE3LDEuNC0xMi4xNjJjLTEyLjE2OS0xNS4zMzYtMzAuMzU2LTI0LjEzMS00OS44OTYtMjQuMTMxYy0zNC4xNTIsMC02Mi4xMTEsMjcuMDE5LTYzLjYxNyw2MC44MDYgIGMtMC4wODMtMC4wMDEtMC4xNjYtMC4wMDEtMC4yNDktMC4wMDFjLTIyLjgwMSwwLTQxLjM1MSwxOC41NDktNDEuMzUxLDQxLjM1YzAsMTQuMzYxLDcuNDM5LDI3LjQ1OSwxOS4yMTMsMzQuOTI1ICBjLTEuNDIzLDQuMjI3LTIuMTU4LDguNjgxLTIuMTU4LDEzLjE5NmMwLDE0LjQ4Miw3LjUzOCwyNy43MjgsMTkuNjIzLDM1LjE4NmMtMC4wMDEsMC4xOS0wLjAwMSwwLjM4LTAuMDAxLDAuNTY4ICBjMCw0Ljg4MSwwLjE0NSw5LjE1NCwwLjQ2NCwxMy4zODJjLTQuMzExLDEuMDQ2LTguNjY2LDEuOTQ2LTEzLjA2LDIuNjc4Yy00LjIwMiwwLjcwMS03LjI3LDQuMzUzLTcuMjM1LDguNjEzICBjMC40OTcsNTguNDM0LDIzLjU0LDExMy4zNzcsNjQuODgyLDE1NC43MDRjMzkuNTIxLDM5LjUwOCw5MS40OCw2Mi4yNjksMTQ3LjAyNiw2NC42MDh2Ni42YzAsMTMuNzQyLDExLjE4MSwyNC45MjMsMjQuOTIzLDI0LjkyMyAgYzIuNjUyLDAsNS4yMDktMC40MTcsNy42MDktMS4xODd2MTQuMDY1YzAsMTMuNzQyLDExLjE4MSwyNC45MjMsMjQuOTIyLDI0LjkyM2MxMy42MjIsMCwyNC43MjYtMTAuOTg2LDI0LjkyMS0yNC41NiAgYzIuNCwwLjc3MSw0Ljk1NywxLjE4OCw3LjYxMSwxLjE4OGMxMy43NDIsMCwyNC45MjItMTEuMTgxLDI0LjkyMi0yNC45MjN2LTk5LjQ3NWgyNS43MTFjNC43ODIsMCw4LjY1Ny0zLjg3NSw4LjY1Ny04LjY1N3YtMjUuMjk1ICBjMC01MC42My00MS4xOTItOTEuODItOTEuODIxLTkxLjgycy05MS44Miw0MS4xOS05MS44Miw5MS44MnYyNS4yOTVjMCw0Ljc4MiwzLjg3NSw4LjY1Nyw4LjY1Nyw4LjY1N2gyNS43MXY2MS4xMTcgIGMtNTAuOTIyLTIuMzI4LTk4LjUzMS0yMy4yODEtMTM0Ljc4Ni01OS41MjNjLTM2LjQtMzYuMzg4LTU3LjQxMS04NC4yMjEtNTkuNjIxLTEzNS4zNzRjNDMuODc2LTkuMDI0LDgzLjgzMi0zMi41ODUsMTEzLjE3My02Ni44OTQgIGMzMS4zMzYtMzYuNjQxLDQ4LjU5NC04My40MDgsNDguNTk0LTEzMS42ODdjMC0zLjMzMy0wLjA4Ny02LjcyMS0wLjI1OS0xMC4xMzJjMTMuODk5LTIuOTM3LDI4LjEzMy00LjQyNCw0Mi40MTMtNC40MjQgIGMxMTIuNTYsMCwyMDQuMTMzLDkxLjU3MywyMDQuMTMzLDIwNC4xMzJjMCw1MS41MTktMTkuMjQ2LDEwMC43MTYtNTQuMTkzLDEzOC41MjRjLTMuMjQ2LDMuNTExLTMuMDMsOC45ODgsMC40ODEsMTIuMjMzICBjMy41MTEsMy4yNDYsOC45ODksMy4wMzEsMTIuMjM0LTAuNDgxYzM3LjkxMi00MS4wMTcsNTguNzkyLTk0LjM4Niw1OC43OTItMTUwLjI3NUM0ODUuODU2LDk5LjM0LDM4Ni41MTcsMCwyNjQuNDEsMHogICBNMzUyLjQ4Nyw0NjMuNzA0YzAsNC4xOTctMy40MTMsNy42MS03LjYwOSw3LjYxYy00LjE5NiwwLTcuNjA5LTMuNDEzLTcuNjA5LTcuNjFjMC00Ljc4Mi0zLjg3NS04LjY1Ny04LjY1Ny04LjY1NyAgYy00Ljc4MiwwLTguNjU3LDMuODc1LTguNjU3LDguNjU3djIzLjM3M2MwLDQuMTk3LTMuNDE0LDcuNjEtNy42MSw3LjYxYy00LjE5NiwwLTcuNjA5LTMuNDEzLTcuNjA5LTcuNjF2LTM3LjgwMSAgYzAtNC43ODItMy44NzUtOC42NTctOC42NTctOC42NTdzLTguNjU3LDMuODc1LTguNjU3LDguNjU3YzAsNC4xOTctMy40MTMsNy42MS03LjYwOSw3LjYxYy00LjE5NywwLTcuNjEtMy40MTMtNy42MS03LjYxVjMzNC4wMjYgIGMwLTIyLjEzMywxOC4wMDctNDAuMTM5LDQwLjEzOS00MC4xMzljMjIuMTMyLDAsNDAuMTM5LDE4LjAwNyw0MC4xMzksNDAuMTM5djEyOS42NzhIMzUyLjQ4N3ogTTIzNy44NDEsMzQ2LjkxNnYtMTYuNjM4ICBjMC00MS4wODMsMzMuNDI0LTc0LjUwNyw3NC41MDctNzQuNTA3YzQxLjA4NCwwLDc0LjUwOCwzMy40MjQsNzQuNTA4LDc0LjUwN3YxNi42MzhoLTE3LjA1NXYtMTIuODkgIGMwLTMxLjY3OS0yNS43NzItNTcuNDUyLTU3LjQ1Mi01Ny40NTJzLTU3LjQ1MiwyNS43NzQtNTcuNDUyLDU3LjQ1MnYxMi44OUgyMzcuODQxeiIvPgo8cGF0aCBkPSJNMjUyLjI0NCwxNzAuMDIzYy0zLjM4Mi0zLjM4LTguODYyLTMuMzgtMTIuMjQzLDBsLTE2LjQ1OSwxNi40NTlsLTE2LjQ1OS0xNi40NTljLTMuMzgyLTMuMzgtOC44NjItMy4zOC0xMi4yNDMsMCAgYy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0M2wxNi40NTksMTYuNDU5bC0xNi40NTksMTYuNDU5Yy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0MyAgYzEuNjkxLDEuNjksMy45MDcsMi41MzUsNi4xMjIsMi41MzVjMi4yMTUsMCw0LjQzMS0wLjg0NSw2LjEyMi0yLjUzNWwxNi40NTktMTYuNDU5bDE2LjQ1OSwxNi40NTkgIGMxLjY5MSwxLjY5LDMuOTA3LDIuNTM1LDYuMTIyLDIuNTM1czQuNDMxLTAuODQ1LDYuMTIyLTIuNTM1YzMuMzgxLTMuMzgyLDMuMzgxLTguODYyLDAtMTIuMjQzbC0xNi40NTktMTYuNDU5bDE2LjQ1OS0xNi40NTkgIEMyNTUuNjI0LDE3OC44ODQsMjU1LjYyNCwxNzMuNDAzLDI1Mi4yNDQsMTcwLjAyM3oiLz4KPHBhdGggZD0iTTQxNi4xNDIsMjE1LjE4NGwtMTYuNDU5LTE2LjQ1OWwxNi40NTktMTYuNDU5YzMuMzgxLTMuMzgyLDMuMzgxLTguODYyLDAtMTIuMjQzYy0zLjM4Mi0zLjM4LTguODYyLTMuMzgtMTIuMjQzLDAgIGwtMTYuNDU5LDE2LjQ1OWwtMTYuNDU5LTE2LjQ1OWMtMy4zODItMy4zOC04Ljg2Mi0zLjM4LTEyLjI0MywwYy0zLjM4MSwzLjM4Mi0zLjM4MSw4Ljg2MiwwLDEyLjI0M2wxNi40NTksMTYuNDU5bC0xNi40NTksMTYuNDU5ICBjLTMuMzgxLDMuMzgyLTMuMzgxLDguODYyLDAsMTIuMjQzYzEuNjkxLDEuNjksMy45MDcsMi41MzUsNi4xMjIsMi41MzVjMi4yMTUsMCw0LjQzMS0wLjg0NSw2LjEyMi0yLjUzNWwxNi40NTktMTYuNDU5ICBsMTYuNDU5LDE2LjQ1OWMxLjY5MSwxLjY5LDMuOTA3LDIuNTM1LDYuMTIyLDIuNTM1czQuNDMxLTAuODQ1LDYuMTIyLTIuNTM1QzQxOS41MjMsMjI0LjA0NCw0MTkuNTIzLDIxOC41NjQsNDE2LjE0MiwyMTUuMTg0eiIvPgo8cGF0aCBkPSJNMTU3LjA2Myw5NC40MDhjMS41ODQsMi44NDQsNC41MzEsNC40NDcsNy41Nyw0LjQ0NmMxLjQyNCwwLDIuODcxLTAuMzUzLDQuMjA1LTEuMDk1YzQuMTc3LTIuMzI3LDUuNjc2LTcuNTk4LDMuMzUtMTEuNzc0ICBjLTUuMTgtOS4zMDItMTUuMDA4LTE1LjA3OS0yNS42NDktMTUuMDc5Yy0xMC4zMjIsMC0yMC4xNDQsNS42ODctMjUuNjMyLDE0Ljg0Yy0yLjQ1OCw0LjEwMS0xLjEyOCw5LjQxNywyLjk3MywxMS44NzYgIGM0LjEwMiwyLjQ1Nyw5LjQxNiwxLjEyNywxMS44NzYtMi45NzNjMi4zNzgtMy45NjYsNi41MS02LjQyOSwxMC43ODMtNi40MjlDMTUwLjkwMiw4OC4yMTgsMTU0LjkzNSw5MC41OSwxNTcuMDYzLDk0LjQwOHoiLz4KPHBhdGggZD0iTTEwNy44MzksMTI0LjgwNGMtOC43NDksNS40NzktMTQuMDU0LDE1LjUxMS0xMy44NDUsMjYuMTg1YzAuMDkzLDQuNzIzLDMuOTUsOC40ODgsOC42NTIsOC40ODggIGMwLjA1OCwwLDAuMTE1LDAsMC4xNzItMC4wMDFjNC43ODEtMC4wOTUsOC41OC00LjA0Niw4LjQ4Ny04LjgyNWMtMC4wOTEtNC42MjQsMi4xMDItOC45MDUsNS43MjQtMTEuMTc0ICBjMy42OTgtMi4zMTUsOC4zNzMtMi40NDcsMTIuMjA1LTAuMzM5YzQuMTg3LDIuMzA0LDkuNDUyLDAuNzc3LDExLjc1OC0zLjQxMmMyLjMwNC00LjE4OSwwLjc3Ny05LjQ1Mi0zLjQxMi0xMS43NTggIEMxMjguMjUsMTE4LjgzMywxMTYuODUyLDExOS4xNTQsMTA3LjgzOSwxMjQuODA0eiIvPgo8Y2lyY2xlIGN4PSIzOTguMDg4IiBjeT0iMzg1LjYzNCIgcj0iOC42NTciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner .rev-reaction-icon.rev-reaction-icon-sad{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRkRERjZEOyIgY3g9IjI1Ni4wMDIiIGN5PSIyNTYuMDAxIiByPSIyNDUuOTk0Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGQ0M1NkI7IiBkPSJNMzA4LjcxNSw0NjUuNjc3Yy0xMzUuODU4LDAtMjQ1Ljk5My0xMTAuMTM0LTI0NS45OTMtMjQ1Ljk5MyAgYzAtNzIuNTg0LDMxLjQ0My0xMzcuODE2LDgxLjQ0NC0xODIuODQyQzY0LjUyOCw3Ny41NjIsMTAuMDA4LDE2MC40MTIsMTAuMDA4LDI1NmMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkzLDI0NS45OTMsMjQ1Ljk5MyAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk4LDE2NC41NDktNjMuMTQ5QzM4Ni45OTcsNDU1Ljk5OCwzNDguOTg4LDQ2NS42NzcsMzA4LjcxNSw0NjUuNjc3eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMzY3LjkxNCw0MTcuMjM2SDI0OC40NTZjLTUuNTI4LDAtMTAuMDA3LTQuNDc5LTEwLjAwNy0xMC4wMDdzNC40NzktMTAuMDA3LDEwLjAwNy0xMC4wMDdoMTE5LjQ1NyAgIGM1LjUyOCwwLDEwLjAwNyw0LjQ3OSwxMC4wMDcsMTAuMDA3UzM3My40NDIsNDE3LjIzNiwzNjcuOTE0LDQxNy4yMzZ6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0YxODRDOyIgZD0iTTIyMS4wODYsMzE0LjI0OWMtMjQuMzM3LDAtNDYuMzI1LTYuMjI3LTU4LjgxNy0xNi42NThjLTQuMjQzLTMuNTQxLTQuODEtOS44NTMtMS4yNjgtMTQuMDk0ICAgYzMuNTQxLTQuMjQyLDkuODUxLTQuODEsMTQuMDk0LTEuMjY4YzguNzM2LDcuMjkzLDI2Ljc4OCwxMi4wMDYsNDUuOTksMTIuMDA2YzE4Ljc0MywwLDM3LjA0My00LjgwMiw0Ni42MjEtMTIuMjMyICAgYzQuMzY2LTMuMzg4LDEwLjY1LTIuNTk0LDE0LjA0LDEuNzczYzMuMzg4LDQuMzY2LDIuNTk0LDEwLjY1Mi0xLjc3MywxNC4wNEMyNjYuNzExLDMwOC4xMDYsMjQ0LjY5NiwzMTQuMjQ5LDIyMS4wODYsMzE0LjI0OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMzk0LjY3MywzMTQuMjQ5Yy0yNC4zMzcsMC00Ni4zMjUtNi4yMjctNTguODE3LTE2LjY1OGMtNC4yNDMtMy41NDEtNC44MS05Ljg1My0xLjI2OC0xNC4wOTQgICBzOS44NTMtNC44MSwxNC4wOTQtMS4yNjhjOC43MzYsNy4yOTMsMjYuNzg4LDEyLjAwNiw0NS45OSwxMi4wMDZjMTguNzQzLDAsMzcuMDQzLTQuODAyLDQ2LjYyMS0xMi4yMzIgICBjNC4zNjUtMy4zODgsMTAuNjUyLTIuNTk0LDE0LjA0LDEuNzczYzMuMzg4LDQuMzY2LDIuNTk0LDEwLjY1Mi0xLjc3MywxNC4wNEM0NDAuMjk3LDMwOC4xMDYsNDE4LjI4MywzMTQuMjQ5LDM5NC42NzMsMzE0LjI0OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNMTczLjY5MSwyNjMuMDRjLTMuNzE5LDAtNy4xOC0wLjQxOC0xMC4yNjUtMS4yNzJjLTUuMzI3LTEuNDczLTguNDUtNi45ODYtNi45NzctMTIuMzE0ICAgYzEuNDc0LTUuMzI3LDYuOTkyLTguNDUyLDEyLjMxNC02Ljk3N2M0LjkyNiwxLjM2NSwxNS4wMzYsMC40MDcsMjYuNTIyLTQuODA0YzExLjI0My01LjA5NywxOC44NzUtMTIuMzEsMjEuNDUyLTE3LjE5NSAgIGMyLjU3OC00Ljg5LDguNjMtNi43NjQsMTMuNTE5LTQuMTg0YzQuODg5LDIuNTc4LDYuNzYyLDguNjMyLDQuMTg0LDEzLjUxOWMtNS4yNDQsOS45NDMtMTYuNzkxLDE5LjY5Ni0zMC44ODksMjYuMDg5ICAgQzE5My4yNDcsMjYwLjU3NSwxODIuNzE1LDI2My4wNCwxNzMuNjkxLDI2My4wNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3RjE4NEM7IiBkPSJNNDM5LjQ5LDI2My4wNGMtOS4wMjUsMC0xOS41NTQtMi40NjQtMjkuODYyLTcuMTM5Yy0xNC4wOTctNi4zOTEtMjUuNjQ0LTE2LjE0NC0zMC44ODctMjYuMDg3ICAgYy0yLjU3OS00Ljg4OC0wLjcwNS0xMC45NDEsNC4xODQtMTMuNTE5YzQuODg5LTIuNTgyLDEwLjk0MS0wLjcwMywxMy41MTksNC4xODRjMi41NzgsNC44ODUsMTAuMjA5LDEyLjA5NywyMS40NDksMTcuMTk0ICAgYzExLjQ4Nyw1LjIxLDIxLjYsNi4xNjksMjYuNTIyLDQuODA1YzUuMzMzLTEuNDY5LDEwLjg0LDEuNjQ5LDEyLjMxNCw2Ljk3NmMxLjQ3Myw1LjMyNy0xLjY0OSwxMC44NC02Ljk3NiwxMi4zMTQgICBDNDQ2LjY3LDI2Mi42MjEsNDQzLjIwOCwyNjMuMDQsNDM5LjQ5LDI2My4wNHoiLz4KPC9nPgo8cGF0aCBkPSJNMzU1LjU2MiwyMC4wODRjLTUuMDg4LTIuMTUyLTEwLjk2MSwwLjIzMi0xMy4xMTIsNS4zMjNzMC4yMzIsMTAuOTYzLDUuMzIzLDEzLjExMiAgYzg3LjYwNiwzNy4wMTUsMTQ0LjIxNCwxMjIuMzgyLDE0NC4yMTQsMjE3LjQ4YzAsMTMwLjEyNC0xMDUuODYyLDIzNS45ODUtMjM1Ljk4NCwyMzUuOTg1UzIwLjAxNSwzODYuMTIyLDIwLjAxNSwyNTUuOTk5ICBTMTI1Ljg3OCwyMC4wMTUsMjU2LjAwMSwyMC4wMTVjNS41MjgsMCwxMC4wMDctNC40NzksMTAuMDA3LTEwLjAwN1MyNjEuNTI5LDAsMjU2LjAwMSwwYy0xNDEuMTYsMC0yNTYsMTE0Ljg0LTI1NiwyNTUuOTk5ICBjMCwxNDEuMTYsMTE0Ljg0LDI1Ni4wMDEsMjU2LDI1Ni4wMDFjMTQxLjE1OCwwLDI1NS45OTktMTE0Ljg0LDI1NS45OTktMjU2QzUxMi4wMDEsMTUyLjgzOSw0NTAuNTk0LDYwLjIzNiwzNTUuNTYyLDIwLjA4NHoiLz4KPHBhdGggZD0iTTI0OC40NTYsMzk3LjIyMmMtNS41MjgsMC0xMC4wMDcsNC40NzktMTAuMDA3LDEwLjAwN3M0LjQ3OSwxMC4wMDcsMTAuMDA3LDEwLjAwN2gxMTkuNDU3ICBjNS41MjgsMCwxMC4wMDctNC40NzksMTAuMDA3LTEwLjAwN3MtNC40NzktMTAuMDA3LTEwLjAwNy0xMC4wMDdIMjQ4LjQ1NnoiLz4KPHBhdGggZD0iTTE3NS4wOTcsMjgyLjIzYy00LjI0NC0zLjU0NC0xMC41NTMtMi45NzQtMTQuMDk0LDEuMjY4Yy0zLjU0Myw0LjI0My0yLjk3NCwxMC41NTMsMS4yNjgsMTQuMDk0ICBjMTIuNDkyLDEwLjQzLDM0LjQ4LDE2LjY1OCw1OC44MTcsMTYuNjU4YzIzLjYwOSwwLDQ1LjYyNC02LjE0Myw1OC44ODktMTYuNDMyYzQuMzY3LTMuMzg4LDUuMTYxLTkuNjc0LDEuNzczLTE0LjA0ICBjLTMuMzg5LTQuMzY5LTkuNjc0LTUuMTYtMTQuMDQtMS43NzNjLTkuNTc5LDcuNDI5LTI3Ljg3OSwxMi4yMzItNDYuNjIxLDEyLjIzMkMyMDEuODg1LDI5NC4yMzYsMTgzLjgzMiwyODkuNTIyLDE3NS4wOTcsMjgyLjIzeiIvPgo8cGF0aCBkPSJNMzM1Ljg1NywyOTcuNTkyYzEyLjQ5MiwxMC40MywzNC40OCwxNi42NTgsNTguODE3LDE2LjY1OGMyMy42MDksMCw0NS42MjQtNi4xNDMsNTguODg5LTE2LjQzMiAgYzQuMzY3LTMuMzg4LDUuMTYxLTkuNjc0LDEuNzczLTE0LjA0Yy0zLjM4OC00LjM2OS05LjY3NS01LjE2LTE0LjA0LTEuNzczYy05LjU3OSw3LjQyOS0yNy44NzksMTIuMjMyLTQ2LjYyMSwxMi4yMzIgIGMtMTkuMjAyLDAtMzcuMjU0LTQuNzEzLTQ1Ljk5LTEyLjAwNmMtNC4yNDMtMy41NDQtMTAuNTUyLTIuOTc0LTE0LjA5NCwxLjI2OEMzMzEuMDQ2LDI4Ny43MzksMzMxLjYxNCwyOTQuMDUxLDMzNS44NTcsMjk3LjU5MnoiLz4KPHBhdGggZD0iTTE3My42OTEsMjYzLjA0YzkuMDI0LDAsMTkuNTU0LTIuNDYzLDI5Ljg1OS03LjEzNmMxNC4wOTgtNi4zOTMsMjUuNjQ3LTE2LjE0NSwzMC44ODktMjYuMDg4ICBjMi41NzktNC44ODgsMC43MDUtMTAuOTQxLTQuMTg0LTEzLjUxOWMtNC44ODktMi41ODItMTAuOTQxLTAuNzA1LTEzLjUxOSw0LjE4NGMtMi41NzgsNC44ODUtMTAuMjA5LDEyLjA5Ny0yMS40NTIsMTcuMTk0ICBjLTExLjQ4Niw1LjIxLTIxLjU5NSw2LjE3LTI2LjUyMSw0LjgwNGMtNS4zMjMtMS40NjgtMTAuODQsMS42NDktMTIuMzE0LDYuOTc2Yy0xLjQ3Myw1LjMyNSwxLjY0OCwxMC44NCw2Ljk3NiwxMi4zMTQgIEMxNjYuNTEsMjYyLjYyMSwxNjkuOTcyLDI2My4wNCwxNzMuNjkxLDI2My4wNHoiLz4KPHBhdGggZD0iTTQwOS42MywyNTUuOTA0YzEwLjMwOCw0LjY3MywyMC44MzcsNy4xMzYsMjkuODYxLDcuMTM2YzMuNzE3LDAsNy4xODEtMC40MTgsMTAuMjY2LTEuMjczICBjNS4zMjUtMS40NzQsOC40NDgtNi45ODgsNi45NzMtMTIuMzE0Yy0xLjQ3NC01LjMyNS02Ljk4LTguNDUtMTIuMzE0LTYuOTczYy00LjkyMSwxLjM1Ny0xNS4wMzEsMC40MDYtMjYuNTIxLTQuODA1ICBjLTExLjI0LTUuMDk2LTE4Ljg3My0xMi4zMDktMjEuNDQ5LTE3LjE5NGMtMi41NzgtNC44ODktOC42My02Ljc2NS0xMy41MTktNC4xODRjLTQuODg5LDIuNTc4LTYuNzYyLDguNjMyLTQuMTg0LDEzLjUxOSAgQzM4My45ODQsMjM5Ljc2LDM5NS41MzEsMjQ5LjUxMSw0MDkuNjMsMjU1LjkwNHoiLz4KPGNpcmNsZSBjeD0iMzE5LjEwMiIgY3k9IjE4Ljg0MSIgcj0iMTAuMDA3Ii8+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=)}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction .rev-reaction-inner .rev-reaction-icon.rev-reaction-icon-angry{background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRkM0QzU5OyIgY3g9IjI1Ni4wMDEiIGN5PSIyNTYuMDAxIiByPSIyNDUuOTk0Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNCQzNCNEE7IiBkPSJNMzA4LjcxNiw0NjUuNjc4Yy0xMzUuODU4LDAtMjQ1Ljk5My0xMTAuMTM0LTI0NS45OTMtMjQ1Ljk5MyAgYzAtNzIuNTg0LDMxLjQ0My0xMzcuODE2LDgxLjQ0NC0xODIuODQyQzY0LjUyNyw3Ny41NjIsMTAuMDA3LDE2MC40MTQsMTAuMDA3LDI1NmMwLDEzNS44NTgsMTEwLjEzNCwyNDUuOTkzLDI0NS45OTMsMjQ1Ljk5MyAgYzYzLjI3NCwwLDEyMC45NjItMjMuODk4LDE2NC41NDktNjMuMTQ5QzM4Ni45OTgsNDU1Ljk5OSwzNDguOTg3LDQ2NS42NzgsMzA4LjcxNiw0NjUuNjc4eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojN0MxNTJFOyIgZD0iTTQwMS41NTksNDA2LjExNGMtMy41MTMsMC4wMDEtNi45MjEtMS44NTItOC43NTItNS4xNGMtMTIuMjMtMjEuOTUzLTM1LjQyMS0zNS41OTMtNjAuNTItMzUuNTkzICBjLTI0LjQ1MSwwLTQ3Ljg4MiwxMy43NDUtNjEuMTQ2LDM1Ljg2OWMtMi44NDMsNC43MzktOC45OTIsNi4yNzUtMTMuNzI5LDMuNDM3Yy00Ljc0MS0yLjg0Mi02LjI3OS04Ljk4OC0zLjQzNy0xMy43MjkgIGMxNi44NjItMjguMTIyLDQ2Ljg2OS00NS41OTIsNzguMzEyLTQ1LjU5MmMzMi4zNTYsMCw2Mi4yNDYsMTcuNTc2LDc4LjAwNSw0NS44NjhjMi42OSw0LjgyOCwwLjk1NywxMC45MjMtMy44NzIsMTMuNjExICBDNDA0Ljg3Nyw0MDUuNzA2LDQwMy4yMDUsNDA2LjExNCw0MDEuNTU5LDQwNi4xMTR6Ii8+CjxnPgoJPGNpcmNsZSBzdHlsZT0iZmlsbDojRkZGRkZGOyIgY3g9IjI1NS40ODEiIGN5PSIyNTAuNTcxIiByPSIyNy4yOTYiLz4KCTxjaXJjbGUgc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGN4PSI0MDEuNTQ4IiBjeT0iMjQzLjE5MiIgcj0iMjcuMjk2Ii8+CjwvZz4KPGc+Cgk8cGF0aCBzdHlsZT0iZmlsbDojN0MxNTJFOyIgZD0iTTI1NS45NjUsMjg3Ljg5NGMtNC41NDksMC05LjEwOS0wLjgxNC0xMy41MDEtMi40NWMtOS42NjgtMy42MDEtMTcuMzU1LTEwLjc1Mi0yMS42NDUtMjAuMTMzICAgYy00LjMyNy05LjQ2My00LjQwNy0yMC43ODktMC4yMjEtMzEuMDc1YzIuMjc2LTUuNTkyLDUuNzExLTEwLjU2OCw5Ljk4NS0xNC42MDdjLTEuNzkxLTAuOTE5LTMuNjA4LTEuODU3LTUuNDQ5LTIuODEzICAgYy02LjgzNC0zLjU0OC0xMi4zMjgtNi43OTItMTcuNjQtOS45MjdjLTYuMjgxLTMuNzA3LTEyLjc3Ni03LjU0LTIyLjAwNS0xMi4yMTZjLTQuOTMtMi40OTctNi45MDQtOC41MTgtNC40MDYtMTMuNDQ5ICAgYzIuNDk4LTQuOTMyLDguNTE4LTYuOTA1LDEzLjQ1LTQuNDA2YzkuODA1LDQuOTY1LDE2LjU4Miw4Ljk2NywyMy4xMzYsMTIuODM1YzUuMzE2LDMuMTM4LDEwLjMzOCw2LjEwMiwxNi42OSw5LjQgICBjNC4yNzEsMi4yMTgsOC40MTIsNC4zMzMsMTIuMzkzLDYuMzY2YzE3LjAzLDguNywzMS43MzgsMTYuMjEzLDQxLjUyOCwyNC4xNTZjMS4xOTcsMC45NzMsMi4xNTQsMi4yMDcsMi43OTUsMy42MDkgICBjNC4yOTEsOS4zODMsNC42NywxOS44NzYsMS4wNywyOS41NDRjLTMuNjAxLDkuNjY3LTEwLjc1MywxNy4zNTUtMjAuMTM1LDIxLjY0NUMyNjYuODg1LDI4Ni43MTcsMjYxLjQzMywyODcuODk0LDI1NS45NjUsMjg3Ljg5NHogICAgTTI1MC44MDQsMjMwLjAyNGMtNS4yODksMi4wODYtOS40Myw2LjI1NS0xMS42NjksMTEuNzU4Yy0yLjExNSw1LjE5OC0yLjE1OCwxMC43NDEtMC4xMTUsMTUuMjA2ICAgYzIuMDY3LDQuNTIxLDUuNzcxLDcuOTY2LDEwLjQyOSw5LjcwMmM0LjY1NCwxLjczMiw5LjcxLDEuNTUyLDE0LjIzMy0wLjUxNWM0LjUyMi0yLjA2OCw3Ljk2Ny01Ljc3Miw5LjcwMi0xMC40MyAgIGMxLjQ3NC0zLjk2LDEuNTY0LTguMjA2LDAuMjg3LTEyLjE2OUMyNjcuOTM5LDIzOS4zMTgsMjYwLjAxOCwyMzQuODU4LDI1MC44MDQsMjMwLjAyNHoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM3QzE1MkU7IiBkPSJNNDAyLjg1OSwyODEuMDgyYy01LjQ2OSwwLTEwLjkyMS0xLjE3Ny0xNi4wNDItMy41MmMtOS4zODItNC4yOS0xNi41MzMtMTEuOTc4LTIwLjEzNS0yMS42NDUgICBjLTMuNi05LjY2OC0zLjIyMS0yMC4xNiwxLjA3LTI5LjU0NGMwLjcwNS0xLjU0MSwxLjc5MS0yLjg3OSwzLjE1NC0zLjg4N2MxMC41MTgtNy43NywyNC40MS0xNS44NDgsNDEuMjg2LTI0LjAwNyAgIGMyNS4zMjgtMTIuMjQ2LDI3LjAxMi0xMy4yMzQsNDcuNjA4LTI1LjMxNmwzLjEyOS0xLjgzNWM0Ljc2Ny0yLjc5NywxMC44OTktMS4xOTcsMTMuNjk1LDMuNTcxICAgYzIuNzk3LDQuNzY3LDEuMTk3LDEwLjktMy41NzEsMTMuNjk1bC0zLjEyNiwxLjgzM2MtMTguMjY1LDEwLjcxNS0yMi4xNjcsMTMuMDAzLTQwLjQ5OCwyMS45MzUgICBjMy42NTIsMy40OCw2LjU5OCw3LjYzOSw4LjY5LDEyLjM0NWM0LjczNCwxMC42NDYsNC42OSwyMy4yNzgtMC4xMTYsMzMuNzg5Yy00LjI5LDkuMzgyLTExLjk3OCwxNi41MzQtMjEuNjQ1LDIwLjEzNSAgIEM0MTEuOTY5LDI4MC4yNjgsNDA3LjQwOSwyODEuMDgyLDQwMi44NTksMjgxLjA4MnogTTM4NS4xLDIzNi45MjNjLTEuMjI0LDMuOTE4LTEuMTE4LDguMTAyLDAuMzM4LDEyLjAwOSAgIGMxLjczNiw0LjY1OCw1LjE4MSw4LjM2Myw5LjcwMiwxMC40M2M0LjUyMSwyLjA2Niw5LjU3OCwyLjI0NywxNC4yMzMsMC41MTVjNC42NTgtMS43MzYsOC4zNjMtNS4xODEsMTAuNDMtOS43MDIgICBjMi40MTktNS4yOTEsMi40My0xMS45MzMsMC4wMjgtMTcuMzM1Yy0xLjQ4OS0zLjM0OS00LjU4Ni03LjcxMi0xMC45NjUtMTAuMjU2QzM5OS42MTUsMjI3LjQ4OCwzOTEuNjYsMjMyLjI4NywzODUuMSwyMzYuOTIzeiIvPgo8L2c+CjxwYXRoIGQ9Ik00NzAuNDU2LDExNi4xNDVDNDQzLjk3OCw3NS42MjUsNDA2LjgsNDMuNTMzLDM2Mi45NCwyMy4zNDFjLTUuMDI0LTIuMzEtMTAuOTY0LTAuMTE1LTEzLjI3NSw0LjkwNSAgYy0yLjMxMSw1LjAyMS0wLjExNSwxMC45NjUsNC45MDUsMTMuMjc1YzQwLjQzOCwxOC42MTUsNzQuNzE2LDQ4LjIwNiw5OS4xMzMsODUuNTcyQzQ3OC43NDksMTY1LjQyNSw0OTEuOTg3LDIxMCw0OTEuOTg3LDI1NiAgYzAsMTMwLjEyNC0xMDUuODYzLDIzNS45ODQtMjM1Ljk4NSwyMzUuOTg0UzIwLjAxNSwzODYuMTI0LDIwLjAxNSwyNTYuMDAxUzEyNS44NzYsMjAuMDE1LDI1NiwyMC4wMTUgIGM1LjUyOCwwLDEwLjAwNy00LjQ3OSwxMC4wMDctMTAuMDA3UzI2MS41MjgsMCwyNTYsMEMxMTQuODQsMCwwLDExNC44NDIsMCwyNTYuMDAxQzAsMzk3LjE2LDExNC44NCw1MTIsMjU2LDUxMiAgczI1Ni0xMTQuODQsMjU2LTI1NS45OTlDNTEyLDIwNi4xMDEsNDk3LjYzNSwxNTcuNzQsNDcwLjQ1NiwxMTYuMTQ1eiIvPgo8cGF0aCBkPSJNMjUzLjk3MywzOTAuOTZjLTIuODQyLDQuNzQxLTEuMzA0LDEwLjg4NywzLjQzNywxMy43MjljNC43MzcsMi44MzksMTAuODg1LDEuMzAyLDEzLjcyOS0zLjQzNyAgYzEzLjI2NC0yMi4xMjQsMzYuNjk1LTM1Ljg2OSw2MS4xNDYtMzUuODY5YzI1LjEwMSwwLDQ4LjI5LDEzLjYzOSw2MC41MiwzNS41OTNjMS44MzEsMy4yODgsNS4yMzgsNS4xNDEsOC43NTIsNS4xNCAgYzEuNjQ3LDAsMy4zMTgtMC40MDgsNC44NjEtMS4yNjZjNC44MjktMi42OSw2LjU2Mi04Ljc4NCwzLjg3Mi0xMy42MTFjLTE1Ljc2LTI4LjI5My00NS42NS00NS44NjgtNzguMDA1LTQ1Ljg2OCAgQzMwMC44NDIsMzQ1LjM2OCwyNzAuODM1LDM2Mi44MzgsMjUzLjk3MywzOTAuOTZ6Ii8+CjxwYXRoIGQ9Ik0yMzQuMzU3LDE5OS4wNTNjLTYuMzUxLTMuMjk4LTExLjM3Mi02LjI2Mi0xNi42OS05LjRjLTYuNTU0LTMuODY4LTEzLjMzMS03Ljg3LTIzLjEzNi0xMi44MzUgIGMtNC45My0yLjQ5OS0xMC45NTItMC41MjctMTMuNDUsNC40MDZjLTIuNDk4LDQuOTMtMC41MjQsMTAuOTUyLDQuNDA2LDEzLjQ0OWM5LjIyOSw0LjY3NSwxNS43MjUsOC41MDksMjIuMDA2LDEyLjIxNiAgYzUuMzEyLDMuMTM3LDEwLjgwNyw2LjM3OSwxNy42NCw5LjkyN2MxLjg0MSwwLjk1NywzLjY1OSwxLjg5Myw1LjQ0OSwyLjgxM2MtNC4yNzQsNC4wMzktNy43MSw5LjAxNS05Ljk4NSwxNC42MDcgIGMtNC4xODYsMTAuMjg2LTQuMTA2LDIxLjYxMiwwLjIyMSwzMS4wNzVjNC4yOSw5LjM4MiwxMS45NzcsMTYuNTMyLDIxLjY0NSwyMC4xMzNjNC4zOTEsMS42MzYsOC45NTEsMi40NSwxMy41MDEsMi40NSAgYzUuNDY5LDAsMTAuOTIxLTEuMTc3LDE2LjA0Mi0zLjUyYzkuMzgyLTQuMjksMTYuNTM0LTExLjk3OCwyMC4xMzUtMjEuNjQ1YzMuNi05LjY2OCwzLjIyMS0yMC4xNi0xLjA3LTI5LjU0NCAgYy0wLjY0LTEuNDAyLTEuNTk3LTIuNjM4LTIuNzk1LTMuNjA5Yy05Ljc5LTcuOTQzLTI0LjQ5OC0xNS40NTgtNDEuNTI4LTI0LjE1NkMyNDIuNzY5LDIwMy4zODUsMjM4LjYyOSwyMDEuMjcsMjM0LjM1NywxOTkuMDUzeiAgIE0yNzMuNjczLDI0My41NzRjMS4yNzcsMy45NjMsMS4xODksOC4yMDktMC4yODcsMTIuMTY5Yy0xLjczNiw0LjY1OC01LjE4MSw4LjM2My05LjcwMiwxMC40MyAgYy00LjUyMywyLjA2Ny05LjU3OSwyLjI0Ny0xNC4yMzMsMC41MTVjLTQuNjU4LTEuNzM2LTguMzYzLTUuMTgxLTEwLjQyOS05LjcwMmMtMi4wNDMtNC40NjYtMi4wMDEtMTAuMDA5LDAuMTE1LTE1LjIwNiAgYzIuMjM5LTUuNTAxLDYuMzc5LTkuNjcyLDExLjY2OS0xMS43NThDMjYwLjAxOCwyMzQuODU4LDI2Ny45MzksMjM5LjMxOCwyNzMuNjczLDI0My41NzR6Ii8+CjxwYXRoIGQ9Ik00NzMuMDU0LDE4OC41OTZjNC43NjctMi43OTUsNi4zNjYtOC45MjcsMy41NzEtMTMuNjk1Yy0yLjc5NS00Ljc2OS04LjkyNy02LjM2Ni0xMy42OTUtMy41NzFsLTMuMTI5LDEuODM1ICBjLTIwLjU5NiwxMi4wODItMjIuMjc5LDEzLjA3LTQ3LjYwOCwyNS4zMTZjLTE2Ljg3Niw4LjE1OS0zMC43NjksMTYuMjM3LTQxLjI4NiwyNC4wMDdjLTEuMzY0LDEuMDA3LTIuNDUsMi4zNDYtMy4xNTQsMy44ODcgIGMtNC4yOTEsOS4zODMtNC42NywxOS44NzYtMS4wNywyOS41NDRjMy42MDEsOS42NjcsMTAuNzUzLDE3LjM1NSwyMC4xMzUsMjEuNjQ1YzUuMTIyLDIuMzQzLDEwLjU3NCwzLjUyLDE2LjA0MiwzLjUyICBjNC41NDksMCw5LjEwOS0wLjgxNCwxMy41MDEtMi40NWM5LjY2Ny0zLjYwMSwxNy4zNTUtMTAuNzUzLDIxLjY0NS0yMC4xMzVjNC44MDYtMTAuNTEsNC44NS0yMy4xNDIsMC4xMTYtMzMuNzg5ICBjLTIuMDkxLTQuNzA2LTUuMDM3LTguODY1LTguNjktMTIuMzQ1YzE4LjMyOS04LjkzMiwyMi4yMzEtMTEuMjIsNDAuNDk4LTIxLjkzNUw0NzMuMDU0LDE4OC41OTZ6IE00MTkuODA0LDI1MC4xNzQgIGMtMi4wNjgsNC41MjItNS43NzIsNy45NjctMTAuNDMsOS43MDJjLTQuNjU1LDEuNzMyLTkuNzEyLDEuNTUtMTQuMjMzLTAuNTE1Yy00LjUyMi0yLjA2OC03Ljk2Ny01Ljc3Mi05LjcwMi0xMC40MyAgYy0xLjQ1Ni0zLjkwNy0xLjU2MS04LjA5MS0wLjMzOC0xMi4wMDljNi41NTktNC42MzcsMTQuNTE1LTkuNDM0LDIzLjc2OC0xNC4zMzljNi4zNzksMi41NDIsOS40NzYsNi45MDYsMTAuOTY1LDEwLjI1NiAgQzQyMi4yMzQsMjM4LjI0Miw0MjIuMjIyLDI0NC44ODUsNDE5LjgwNCwyNTAuMTc0eiIvPgo8Y2lyY2xlIGN4PSIzMjMuMTMxIiBjeT0iMjAuMDE1IiByPSIxMC4wMDciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==)}#rev-slider2 .rev-content .rev-comments .rev-reactions-total .rev-reactions-total-inner .rev-reaction-count{display:inline-block;float:right;font-size:12px;line-height:20px;margin-left:4px;color:rgba(90,90,90,.86)}#rev-slider2 .rev-content .rev-comments .rev-comment:after,#rev-slider2 .rev-content .rev-comments:after{content:"";clear:both;display:table}#rev-slider2 .rev-content .rev-comments .rev-comment{padding:0 10px 12px 9px}#rev-slider2 .rev-content .rev-comments .rev-comment:first-child{padding-top:12px}#rev-slider2 .rev-content .rev-comments .rev-comment .rev-comment-image{float:left;background-repeat:no-repeat;border-radius:24px;width:24px;height:24px;background-size:cover}#rev-slider2 .rev-content .rev-comments .rev-comment .rev-comment-text{font-size:12px;line-height:1.34;padding-left:10px;overflow:hidden}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-comments,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-comments,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-comments,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-comments,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-comments,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-comments{padding-left:0;padding-right:0}#rev-slider2 .rev-content .rev-comments .rev-comment .rev-comment-text .rev-comment-author{font-weight:600}#rev-slider2 .rev-content .rev-comments .rev-comment .rev-comment-text .rev-comment-date{color:#90949c}#rev-feed .rc-reaction-header,#rev-feed ul.rc-reaction-bar li .rc-reaction-name,#rev-opt-out{display:none}#rev-feed #rev-slider2 .rev-content.rev-colspan-2 .rev-headline h3{font-size:14px}#rev-feed #rev-slider2.rev-slider-window-width .rev-head{margin-left:3px!important;margin-right:3px!important}#rev-feed #rev-slider2.rev-slider-window-width #rev-slider-inner{background-color:#f2f2f2}#rev-feed #rev-slider2.rev-slider-window-width #rev-slider-inner .rev-content-inner{border-radius:0}#rev-feed .rev-content.rev-colspan-2 .rev-after-image{margin:0!important}.rev-slider-breakpoint-lt-sm #rev-feed .rev-content.rev-colspan-3,.rev-slider-breakpoint-lt-sm #rev-feed .rev-content.rev-colspan-6{padding-bottom:16px}#rev-feed .rev-content.rev-headline-top .rev-after-image{padding-top:1.7%}#rev-feed .rev-content.rev-headline-top .rev-headline h3{margin-left:4px;margin-right:4px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-before-image{border-top-left-radius:2px;border-top-right-radius:2px}#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner{box-shadow:0 2px 8px -4px #000}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner{border:1px solid #ddd;border-radius:4px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-after-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-content-header,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-meta,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-reactions,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-content-header,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-meta,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-reactions{margin-left:8px;margin-right:8px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2) .rev-content-inner .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2) .rev-content-inner .rev-after-image{margin-bottom:8px;margin-left:0;margin-right:0}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-after-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-content-header,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-meta,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-reactions,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-content-header,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-meta,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-reactions{margin-left:10px;margin-right:10px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-sm .rev-after-image{margin-bottom:10px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-after-image,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-content-header,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-meta,#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-reactions,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-content-header,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-meta,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-reactions{margin-left:14px;margin-right:14px}#rev-feed .rev-content.rev-content-internal:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-after-image,#rev-feed .rev-content:not(.rev-colspan-2).rev-content-breakpoint-gt-md .rev-after-image{margin-bottom:14px}#rev-feed .rev-content .rev-meta{padding-top:11px;margin-bottom:10px}#rev-feed .rev-content .rev-meta .rev-meta-inner{line-height:0}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-meta-content{overflow:hidden;line-height:16px}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save{float:right;width:34px}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save.rev-save-active svg polygon{fill:rgba(90,90,90,.25)}#rev-feed .rev-content .rev-meta .rev-meta-inner .rev-save svg polygon{stroke:rgba(90,90,90,.86)}#rev-feed .rev-content .rev-meta svg path{fill:#95a2ab!important}#rev-feed .rev-content .rev-meta .rev-provider{margin-top:0!important;margin-left:0!important;font-size:13px;line-height:18px;top:-2.5px;height:auto;letter-spacing:.3px;font-weight:700;color:#333}#rev-feed .rev-content.rev-headline-top .rev-headline h3{margin-top:0;padding-bottom:.5%}#rev-feed ul.rc-reaction-bar li{width:24px;height:24px;margin-right:3px}#rev-feed ul.rc-reaction-bar{padding:0;line-height:0;margin:0}#rev-feed section.rc-reaction-bar-rounded ul li.rc-react{margin-bottom:9px}#rev-feed ul.rc-reaction-bar li div.rc-face{height:inherit}#rev-feed ul.rc-reaction-bar li span.rc-count{width:20px;height:20px;line-height:16px;left:15px;bottom:-9px}#rev-slider2 .rev-image{position:relative}#rev-slider2 .rc-icon{position:absolute;line-height:0;border-width:0}#rev-slider2 .rc-icon.rc-icon-center{left:50%;top:50%;-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);width:30%}#rev-slider2 .rc-icon.rc-icon-bottom_left,#rev-slider2 .rc-icon.rc-icon-top_left{left:10px}#rev-slider2 .rc-icon.rc-icon-bottom_left,#rev-slider2 .rc-icon.rc-icon-bottom_right,#rev-slider2 .rc-icon.rc-icon-top_left,#rev-slider2 .rc-icon.rc-icon-top_right{width:12.5%;min-width:40px}#rev-slider2 .rc-icon.rc-icon-top_left,#rev-slider2 .rc-icon.rc-icon-top_right{top:10px}#rev-slider2 .rc-icon.rc-icon-bottom_left,#rev-slider2 .rc-icon.rc-icon-bottom_right{bottom:10px}#rev-slider2 .rc-icon.rc-icon-bottom_right,#rev-slider2 .rc-icon.rc-icon-top_right{right:10px}#rev-slider2 .rc-icon.rc-ad-icon{width:20px!important;height:20px!important;min-width:0}#rev-slider2 .rc-icon.rc-ad-icon.rc-icon-bottom_right{bottom:0}#rev-slider2 .rc-icon img{border-width:0}#rev-slider2 .rc-icon .rc-icon-video{fill:rgba(96,96,96,.85)}#rev-slider2 .rc-icon .rc-icon-video .rc-icon-video-arrow{fill:#fff}#rev-slider2 .rc-icon .rc-icon-video #circle2{fill:transparent;stroke:#fff;stroke-width:40}#rev-opt-out{z-index:2147483641}#rev-opt-out .rd-box-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;opacity:.5;filter:alpha(opacity=50);z-index:2147483641}#rev-opt-out .rd-vertical-offset{position:fixed;display:table-cell;top:0;width:100%;z-index:2147483642}#rev-opt-out .rd-box{position:absolute;vertical-align:middle;background-color:#fff;min-width:290px;max-width:500px;width:90%;margin:10px auto;border-radius:10px}#rev-opt-out.rev-interest-dialog .rd-box{max-width:1024px}#rev-opt-out .rd-modal-content{-webkit-overflow-scrolling:touch;overflow-y:auto;line-height:0;box-sizing:content-box}#rev-opt-out .rd-close-button{position:absolute;cursor:pointer;top:-15px!important;right:-15px!important;-webkit-transform:scale(.7)!important;transform:scale(.7)!important;transition:all .2s ease-in-out!important;width:35px!important;height:35px;border:1px solid #777;box-shadow:0 0 5px 0 rgba(0,0,0,.75);background:#efefef;border-radius:50%}#rev-opt-out .rd-close-button svg{fill:#bdbdbd;height:28px;width:28px;top:50%;position:absolute;margin-top:-14px;left:50%;margin-left:-14px}#rev-opt-out .rd-close-button:hover{-webkit-transform:scale(1)!important;transform:scale(1)!important}@-webkit-keyframes blink{0%,100%{opacity:.2}20%{opacity:1}}@keyframes blink{0%,100%{opacity:.2}20%{opacity:1}}.rd-loading{color:#00cb43;font-size:18px;line-height:22px;position:absolute;text-align:center;top:50%;width:100%;margin-top:-11px;margin-bottom:0}.rd-loading span{-webkit-animation-name:blink;animation-name:blink;-webkit-animation-duration:1.4s;animation-duration:1.4s;-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite;-webkit-animation-fill-mode:both;animation-fill-mode:both}.rd-loading span:nth-child(2){-webkit-animation-delay:.2s;animation-delay:.2s}.rd-loading span:nth-child(3){-webkit-animation-delay:.4s;animation-delay:.4s}/* endinject */', 'rev-feed');

        this.init();
    };

    RevFeed.prototype.init = function() {
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

    RevFeed.prototype.windowWidth = function() {

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

    RevFeed.prototype.createInnerWidget = function() {
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
            header_logo: this.options.header_logo,
            developer: this.options.developer,
            internal_selector: this.options.internal_selector,
            header_selector: this.options.header_selector,
            reactions_selector: this.options.reactions_selector,
            meta_selector: this.options.meta_selector,
            headline_top_selector: this.options.headline_top_selector,
            window_width_enabled: this.windowWidthEnabled
        });
    };

    RevFeed.prototype.viewability = function() {
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

    RevFeed.prototype.infinite = function() {
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

                self.innerWidget.setUp(rowData.items);

                self.innerWidget.getPadding(rowData.items, true);

                self.innerWidget.setContentPadding(rowData.items);

                self.innerWidget.setSize(rowData.items);

                self.innerWidget.setUp(rowData.items);

                self.innerWidget.grid.layout();

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

                        if (url.type == 'internal') {
                            var resp = self.innerWidget.mockInternal[self.options.mock].slice(url.offset, url.offset + url.limit);
                            resolve({
                                type: url.type,
                                data: resp
                            });
                            return;
                        }

                        if (url.type == 'sponsored') {
                            var resp = self.innerWidget.mockSponsored[self.options.mock].slice(url.offset, url.offset + url.limit);
                            resolve({
                                type: url.type,
                                data: resp
                            });
                            return;
                        }
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

    RevFeed.prototype.checkVisible = function() {
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

    RevFeed.prototype.registerView = function(viewed) {

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

    return RevFeed;

}));