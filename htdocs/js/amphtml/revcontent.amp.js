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
        self.useAutoSizer = ((self.data.sizer !== undefined && self.data.sizer != "true") ? false : true);
        self.ENTITY_ID = "rev2-wid-" + self.data.id.toString();
    };

    RevAMP.prototype.createWrapper = function () {
        var self = this;
        self.rcjsload = document.createElement("div");
        self.rcjsload.id = self.getWrapperId();
        document.body.appendChild(self.rcjsload);
        return self;
    };

    RevAMP.prototype.getWrapperId = function(){
        var self  = this;
        return self.data.wrapper !== undefined ? self.data.wrapper : self.defaultWrapperId;
    };

    RevAMP.prototype.createScript = function () {
        var self = this;
        self.rcel = document.createElement("script");
        self.rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
        self.rcel.type = 'text/javascript';
        self.serveParameters = '?' + (self.testing === true ? 'uitm=1&' : '') + "w=" + self.data.id + "&t=" + self.rcel.id + "&c=" + (new Date()).getTime() + "&width=" + (self.forceWidth || self.viewportWidth);
        self.serveUrl = self.serveProtocol + self.serveHost + self.serveScript + self.serveParameters;
        self.rcel.src = self.serveUrl;
        self.rcel.async = false;
        var rcds = document.getElementById(self.rcjsload.id);
        rcds.appendChild(self.rcel);
        return self;
    };

    RevAMP.prototype.renderStart = function (timeout) {

        var self = this;
        if (!timeout || isNaN(timeout)) {
            var timeout = 3000;
        }
        window.context.renderStart();

        if(self.useAutoSizer) {
            self.adjustHeight();
            setTimeout(function () {
                self.adjustHeight();
            }, timeout);
            window.addEventListener('resize', function (event) {
                setTimeout(function () {
                    self.adjustHeight();
                }, timeout);
            });
        }

        return self;
    };

    RevAMP.prototype.adjustHeight = function () {
        var self = this;
        var providerHeight = 0;
        self.widgetEl = document.getElementById(self.getWrapperId());
        self.providerEl = self.widgetEl.querySelector('.rc-branding');
        if(self.providerEl && self.providerEl.length > 0 && self.providerEl.classList.contains('rc-text-bottom')){
            providerHeight = self.providerEl.clientHeight;
        }
        window.context.requestResize(document.clientWidth, Math.max(320, providerHeight + Math.max(document.body.offsetHeight, self.widgetEl.clientHeight)));
    };

    RevAMP.prototype.noContentAvailable = function () {
        var self = this;
        setTimeout(function(){
            if(typeof RevContentLoader !== "object") {
                self.stopObservingIntersection();
                window.context.noContentAvailable();
            }
        }, 2 * (60 * 1000));
        return self;
    };

    RevAMP.prototype.init = function () {
        var self = this;
        self.createWrapper();
        self.createScript();
        self.renderStart(3000);
        self.noContentAvailable();
        window.context.reportRenderedEntityIdentifier(self.ENTITY_ID);
        self.stopObservingIntersection = window.context.observeIntersection(function(changes) {
            changes.forEach(function(c) {
                setTimeout(function(){
                    self.adjustHeight();
                }, 125);
            });
        });
        return self;
    };

    var RevcontentNetwork = new RevAMP();
    document.onreadystatechange = function () {
        if (document.readyState === "complete") {
            RevcontentNetwork.init();
        }
    }

}(window, document));
