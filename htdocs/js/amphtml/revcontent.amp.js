/**
 * Revcontent Ad Network Service
 * (For AMPHTML)
 */

(function(window, document, undefind){
    'use_strict';

    var RevAMP = function(){
      var self = this;
        self.data = window.data;
        self.serve_protocol = self.data.ssl === 'true' ? 'https://' : 'http://';
        self.serve_host = self.data.endpoint;
        self.serve_script = '/serve.js.php';
        self.serve_url = null;
        self.defaultWrapperId = "rcjsload_2ff711";
        self.rcjsload = null;
        self.rcel = null;
        self.serveParameters = null;
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
        self.serveParameters = "?uitm=1&w=" + self.data.id + "&t=" + self.rcel.id + "&c=" + (new Date()).getTime() + "&width=" + (window.outerWidth || document.documentElement.clientWidth);
        self.serve_url = self.serve_protocol + self.serve_host + self.serve_script + self.serveParameters;
        self.rcel.src = serve_url;
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