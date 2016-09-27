/**
 * Revcontent Ad Network Service
 * (For AMPHTML)
 */

(function (window, document, undefined) {
    'use_strict';

    var RevAMP = function () {
        var self = this;
        self.data = window.data;
        self.defaultHost = "trends.revcontent.com";
        self.isSecure = ((self.data.ssl !== undefined && self.data.ssl != "true") ? false : true);
        self.serveProtocol = (self.isSecure === true ? 'https://' : 'http://');
        self.serveHost = ((self.data.endpoint !== undefined) ? self.data.endpoint : self.defaultHost);
        self.serveScript = '/serve.js.php';
        self.serveUrl = null;
        self.forceWidth = ((self.data.width !== undefined) ? self.data.width : undefined);
        self.defaultWrapperId = "rcjsload_2ff711";
        self.viewportWidth = self.forceWidth || (window.outerWidth || document.documentElement.clientWidth);
        self.rcjsload = null;
        self.rcel = null;
        self.serveParameters = null;
        self.testing = ((self.data.testing !== undefined) ? true : false);
        self.unlisten = window.context.onResizeSuccess(function (requestedHeight) {

            console.log("RESIZE SUCCESS!");
        });
    };

    RevAMP.prototype.createWrapper = function () {
        var self = this;
        self.rcjsload = document.createElement("div");
        self.rcjsload.id = self.data.wrapper !== undefined ? self.data.wrapper : self.defaultWrapperId;
        document.body.appendChild(self.rcjsload);
        return self;
    };

    RevAMP.prototype.createScript = function () {
        var self = this;
        self.rcel = document.createElement("script");
        self.rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
        self.rcel.type = 'text/javascript';
        self.serveParameters = '?' + (self.testing === true ? 'uitm=1&' : '') + "w=" + self.data.id + "&t=" + self.rcel.id + "&c=" + (new Date()).getTime() + "&width=" + (self.forceWidth || self.viewportWidth);
        self.serveUrl = self.serveProtocol + self.serveHost + self.serveScript + self.serveParameters;
        self.rcel.src = self.serveUrl;
        self.rcel.async = true;
        var rcds = document.getElementById(self.rcjsload.id);
        rcds.appendChild(self.rcel);
        return self;
    };

    RevAMP.prototype.renderStart = function (timeout) {
        console.log("RENDER START!");

        var self = this;
        if (!timeout || isNaN(timeout)) {
            var timeout = 3000;
        }
        window.context.renderStart({width: document.body.clientWidth, height: document.body.clientHeight});

        setTimeout(function () {
            self.adjustHeight();
            console.log("ADJUSTED HEIGHT!", {width: document.body.clientWidth, height: self.widgetEl.clientHeight});
        }, timeout);

        window.addEventListener('resize', function (event) {
            setTimeout(function () {
                console.log("Resizing!!!! RE-ADJUSTING HEIGHT!");
                self.adjustHeight();
            }, timeout);
        });

        window.addEventListener('orientationchange', function (event) {
            console.log(event);
            console.log("Resizing!!!! RE-ADJUSTING HEIGHT!");
            setTimeout(function () {
                console.log("Resizing!!!! RE-ADJUSTING HEIGHT!");
                self.adjustHeight();
            }, timeout);
        });

        return self;
    };

    RevAMP.prototype.adjustHeight = function () {
        var self = this;
        /*
         console.log(window.context, window.parent.postMessage);
         window.parent.postMessage({
         sentinel: 'amp',
         type: 'embed-size',
         height: h
         }, '*');
         */
        //window.context.renderStart({width:w, height: h});\\
        self.widgetEl = document.getElementById(self.rcjsload.id);
        window.context.requestResize(self.widgetEl.clientWidth, Math.max(400, self.widgetEl.clientHeight));
    };

    RevAMP.prototype.noContentAvailable = function () {
        var self = this;

        return self;
    };

    RevAMP.prototype.init = function () {
        console.log("INIT!");
        var self = this;
        self.createWrapper();
        self.createScript();
        self.renderStart(3000);
        return self;
    };

    var RevcontentNetwork = new RevAMP();
    document.onreadystatechange = function () {
        if (document.readyState === "complete") {
            RevcontentNetwork.init();
            console.log("Done!");


        }
    }

}(window, document));