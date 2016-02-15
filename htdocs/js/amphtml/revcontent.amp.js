/**
 * Revcontent Ad Network Service
 * (For AMPHTML)
 */

(function(window, document, undefined){
    'use_strict';

    var RevAMP = function(){
      var self = this;
        self.data = window.data;
        self.defaultHost = "trends.revcontent.com";
        self.isSecure = ((self.data.ssl !== undefined) ? true : false);
        self.serveProtocol = (self.isSecure === true ? 'https://' : 'http://');
        self.serveHost = (self.data.endpoint !== undefined ? self.data.endpoint : self.defaultHost);
        self.serveScript = '/serve.js.php';
        self.serveUrl = null;
        self.defaultWrapperId = "rcjsload_2ff711";
        self.rcjsload = null;
        self.rcel = null;
        self.serveParameters = null;
        self.testing = (self.data.testing !== undefined ? true : false);
        self.unlisten = window.context.onResizeSuccess(function(requestedHeight) {


        });
    };

    RevAMP.prototype.createWrapper = function(){
        var self = this;
        self.rcjsload = document.createElement("div");
        self.rcjsload.id = self.data.wrapper !== undefined ? self.data.wrapper : self.defaultWrapperId;
        document.body.appendChild(self.rcjsload);
    };

    RevAMP.prototype.createScript = function(){
        var self = this;
        self.rcel = document.createElement("script");
        self.rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
        self.rcel.type = 'text/javascript';
        self.serveParameters = '?' + (self.testing === true ? 'uitm=1&' : '') + "w=" + self.data.id + "&t=" + self.rcel.id + "&c=" + (new Date()).getTime() + "&width=" + (window.outerWidth || document.documentElement.clientWidth);
        self.serveUrl = self.serveProtocol + self.serveHost + self.serveScript + self.serveParameters;
        self.rcel.src = self.serveUrl;
        self.rcel.async = true;
        var rcds = document.getElementById(self.rcjsload.id);
        rcds.appendChild(self.rcel);
    };

    RevAMP.prototype.init = function(){
        var self = this;
        self.createWrapper();
        self.createScript();

    };

    var RevcontentNetwork = new RevAMP();
    RevcontentNetwork.init();


}(window, document));