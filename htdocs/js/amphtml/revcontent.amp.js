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
        self.api = {
            enabled: ((self.data.api !== undefined) ? true : false),
            key: self.data.key !== undefined ? self.data.key : '3eeb00d786e9a77bbd630595ae0be7e9aa7aff3b',
            endpoint: self.data.labs !== undefined ? self.data.labs : "https://trends.revcontent.com/api/v1/",
            publisher : self.data.publisher !== undefined ? self.data.publisher : 945,
            widget : self.data.id,
            domain : self.data.domain !== undefined ? self.data.domain : 'apiexamples.powr.com',
            testing: self.testing,
            dimensions: {
                rows: !isNaN(self.data.rows) ? self.data.rows : 4,
                cols: !isNaN(self.data.cols) ? self.data.cols : 1
            },
            useJSONP: true,
            JSONPCallbackName: 'revcontentAds',
            JSONPCallback: '',
            ads: {
                size: {
                    width: !isNaN(self.data.adxw) ? self.data.adxw : 239,
                    height: !isNaN(self.data.adxh) ? self.data.adxh : 274,
                }
            }
        };
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
        if(self.api.enabled) { return; }
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
        self.fetchAds();
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

    RevAMP.prototype.fetchAds = function(){
        var self = this;
        if(self.api.enabled && self.validateApiSettings()) {
            
            self.api.parameters = [];
            self.api.parameters.push("api_key=" + self.api.key);
            self.api.parameters.push("pub_id=" + self.api.publisher);
            self.api.parameters.push("widget_id=" + self.api.widget);
            self.api.parameters.push("domain=" + self.api.domain);
            self.api.parameters.push("sponsored_count=" + (self.api.dimensions.rows * self.api.dimensions.cols) + "&internal_count=0&img_h=" + self.api.ads.size.height + "&img_w=" + self.api.ads.size.width + "&api_source=amp");
            
            if(self.api.useJSONP){
                self.api.JSONPCallback = self.api.JSONPCallbackName ? self.api.JSONPCallbackName : ('success' + self.getTimestamp());
                window[self.api.JSONPCallback] = function(ads){
                    self.renderNative(ads);
                };
                self.ApiJSONScript = document.createElement('script');
                self.ApiJSONScript.type = "text/javascript";
                self.ApiJSONScript.async = false;
                self.ApiJSONScript.src = self.api.endpoint + '?' + self.api.parameters.join('&') + '&callback=' + self.api.JSONPCallback;
                //document.body.appendChild(self.ApiJSONScript);
                var rcds = document.getElementById(self.rcjsload.id);
                rcds.appendChild(self.ApiJSONScript);
            } else {
                self.api.request = new XMLHttpRequest();    
                self.api.request.open('GET', self.api.endpoint + '?' + self.api.parameters.join('&'), true);
                self.api.request.onload = function() {
                    if (self.api.request.status >= 200 && self.api.request.status < 400) {
                        try {
                            self.renderNative(JSON.parse(self.api.request.responseText));
                        } catch(e) { }
                    }
                };
                self.api.request.onerror = function() {
                    self.apiError();
                };
                self.api.request.send();
            }
        }
    };

    RevAMP.prototype.validateApiSettings = function(){
        var self = this;
        var errs = [];
        var isValid = false;

        if(errs.length == 0) {
            isValid = true;
        } else {
            isValid = false;
        }

        return isValid;
    };

    RevAMP.prototype.renderNative = function(ads){
        var self = this;
        self.createAMPDocument();
        var adRow = '<div class="rc-amp-row" data-rows="' + self.api.dimensions.rows + '" data-cols="' + self.api.dimensions.cols + '"></div>';
        self.rcjsload.insertAdjacentHTML('beforeend', adRow);
        var adMarkup = '';
        for(var a =0; a < ads.length; a++){
            adMarkup = '<div class="rc-amp-ad-item"><div class="rc-amp-ad-wrapper">';
            adMarkup += '<a href="' + ads[a].url + '" class="rc-cta" target="_blank">';
            adMarkup += self.generateAMPImage(ads[a].image, self.api.ads.size.width, self.api.ads.size.height, ads[a].headline, "responsive");
            adMarkup += '<h2 class="rc-headline">' + ads[a].headline + '</h2>'
            adMarkup += '</a>';
            adMarkup += '</div></div>';
            self.rcjsload.querySelector('.rc-amp-row').insertAdjacentHTML('beforeend', adMarkup);
        };
    };

    RevAMP.prototype.generateAMPImage = function(src, width, height, alt, layout){
        if(!layout){ layout = responsive; }
        if(!src || src.length == 0){ return; }
        return '<amp-img class="rc-img" alt="' + alt + '" src="' + src + '" width="' + width + '" height="' + height + '" layout="responsive"></amp-img>';
    };

    RevAMP.prototype.createAMPDocument = function(){
        var self = this;
        self.createAMPStyles();
    };

    RevAMP.prototype.createAMPStyles = function () {
        var self = this;
        self.styles = document.createElement("style");
        self.styles.setAttribute("amp-custom","");
        var cssBaseStyles = `
        @font-face {
            font-family: "Tangerine";
            src: url("https://fonts.googleapis.com/css?family=Tangerine");
        }

        body {
            margin: 0;
            padding: 0;
        }

        .rc-amp-row {

        }

        .rc-cta {
            text-decoration: none;
            outline: none;
            font-family: "Tangerine", sans-serif;
            color: #000000;

        }
        .rc-cta:hover {
            text-decoration: underline;
        }

        .rc-amp-ad-item {
            font-family: "Tangerine", sans-serif;
        }

        .rc-headline {
            font-family: "Tangerine", sans-serif;
            font-size: 12px;
        }

        @media screen and (min-width: 568px) {
            .rc-amp-row[data-rows="2"] .rc-amp-ad-item {
                width: 50%;
                float: left;
            }
            .rc-amp-row[data-rows="3"] .rc-amp-ad-item {
                width: 33.3333333333%;
                float: left;
            }
            .rc-amp-row[data-rows="4"] .rc-amp-ad-item {
                width: 25%;
                float: left;
            }
            .rc-amp-row .rc-amp-ad-item .rc-amp-ad-wrapper {
                padding-right: 10px;
            }
            .rc-amp-row .rc-amp-ad-item:last-child  .rc-amp-ad-wrapper {
                padding-right: 0;
            }
            .rc-headline {
                font-family: "Tangerine", sans-serif;
                font-size: 14px;
            }
        }

        @media screen and (min-width: 732px) {
            .rc-headline {
                font-size: 14px;
            }
        }
        `;
        var cssStyles = cssBaseStyles + ' ' + '/* inject:css *//* endinject */';
        self.styles.insertAdjacentHTML('afterbegin', cssStyles);
        document.body.appendChild(self.styles);
        /*<style amp-custom>
          @font-face {
            font-family: "Tangerine";
            src: url("https://fonts.googleapis.com/css?family=Tangerine");
          }

          body {
            font-family: "Tangerine", serif;
          }
        </style>*/
    };

    RevAMP.prototype.apiError = function(){

    };

    RevAMP.prototype.getTimestamp = function() {
        var time = Date.now || function() {
          return +new Date;
        };

        return time();
    };

    var RevcontentNetwork = new RevAMP();
    document.onreadystatechange = function () {
        if (document.readyState === "complete") {
            RevcontentNetwork.init();
        }
    }

}(window, document));
