/**
 * Revcontent Ad Network Service
 * (For AMPHTML)
 *
 * @todo Validate API Settings
 * @todo UI Messaging for validation and/or network errors
 * @todo Add <amp-carousel> and <amp-video> support
 * @todo A4A Extension Support (Milestone 3)
 * @todo API Showcase Plugin Extensions (Milestone 4)
 * @todo Add DEBUG support
 */

( function (window, factory) {
    'use strict';
    window.RevcontentAMP = factory(
        window,
        document
    );

}(window, function factory(window, document) {

    'use strict';

    /**
     * Revcontent Network Ad Service (Constructor)
     * @constructor
     */
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
        self.isObserving = false;
        self.ENTITY_ID = "rev2-wid-" + self.data.id.toString();
        self.api = {
            enabled: ((self.data.api !== undefined) ? true : false),
            key: self.data.key !== undefined ? self.data.key : '3eeb00d786e9a77bbd630595ae0be7e9aa7aff3b',
            endpoint: self.data.labs !== undefined ? self.data.labs : "https://trends.revcontent.com/api/v1/",
            publisher: self.data.publisher !== undefined ? self.data.publisher : 945,
            widget: self.data.id,
            domain: self.data.domain !== undefined ? self.data.domain : 'apiexamples.powr.com',
            testing: self.testing,
            branding: ((self.data.branding !== undefined && self.data.branding != "true") ? false : true),
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
            },
            cssOverrides: (self.data.css !== undefined && self.data.css.length > 0) ? self.data.css : ''
        };
        self.timeouts = {
            resize: 0
        };
        // This element should be present in the 3p/remote.html
        // div#c , style="position:absolute;top:0;left:0;bottom:0;right:0;"
        // IMPORTANT: Our outermost wrapper should be embedded as a child of this absolute element...
        self.remote3p = {
            domId: 'c'
        };
    };


    /**
     * Create Outer DIV.wrapper
     * -- i.e creates div#rcjsload_2ff711
     * NOTE: We attach to first absolute positioned DIV in the 3p/remote.html template
     * as a precaution we'll attach to document.body if this element does not exist...
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.createWrapper = function () {
        var self = this;
        self.rcjsload = document.createElement("div");
        self.rcjsload.id = self.getWrapperId();
        self.remote3p.node = document.getElementById(self.remote3p.domId);
        if(self.remote3p.node !== undefined && self.remote3p.node !== null){
            self.remote3p.node.appendChild(self.rcjsload);
        } else {
            document.body.appendChild(self.rcjsload);
        }
        return self;
    };

    /**
     * Get Outer Wrapper Element.ID
     * @returns {String} of wrapper Dom Id
     */
    RevAMP.prototype.getWrapperId = function () {
        var self = this;
        return self.data.wrapper !== undefined ? self.data.wrapper : self.defaultWrapperId;
    };

    /**
     * Create Serve.js script (ASYNC = false)
     * NOTE: When native API is requested this operation is aborted.
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.createScript = function () {
        var self = this;
        if (self.api.enabled) {
            return;
        }
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

    /**
     * Viewport Observer/Handler
     * -------------------------
     * Callback for triggering resize requests.
     * NOTE: As AMP only honors resizes when ads are OUTSIDE viewport scope, i.e not in the visible region,
     * resizing is only engaged when the "Intersection Ratio" equals "0", this means user must not be viewing
     * the ad panel when the request is received.
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.startObservingIntersection = function () {
        var self = this;
        self.isObserving = true;
        self.stopObservingIntersection = window.context.observeIntersection(function (changes) {
            changes.forEach(function (c) {
                if (c.intersectionRatio == 0) {
                    self.adjustHeight();
                }
            });
        });
        return self;
    };

    /**
     * Startup Hooks
     * 1. Trigger window.context.renderStart() API Call
     * 2. Enable Auto-sizer by default and bind for "resize" and "orientationchange"
     *
     * See #5234 on Github - https://github.com/ampproject/amphtml/issues/5234
     * @param {Integer} timeout
     * @returns {RevAMP}
     */
    RevAMP.prototype.renderStart = function (timeout) {

        var self = this;
        if (!timeout || isNaN(timeout)) {
            timeout = 3000;
        }
        window.context.renderStart();

        if (self.useAutoSizer) {
            self.adjustHeight();
            window.addEventListener('resize', function (event) {
                if (!self.isObserving) {
                    self.startObservingIntersection();
                }
            });
            window.addEventListener('orientationchange', function (event) {
                var orientationHandler = function (e) {
                    self.startObservingIntersection();
                    window.removeEventListener('resize', orientationHandler);
                };
                window.addEventListener('resize', orientationHandler);
            });
        }

        return self;
    };

    /**
     * Dynamic Height Adjustment
     * -------------------------
     * This resize handler is triggered by the intersection observer in order to set optimal height of the ad panel.
     * NOTE: Observers are STOPPED once a successful resize request occurs, they are re-engaged automatically.
     *
     * @param {Integer} specificHeight to use instead of the "frame height" from a set of compatible values...
     * @returns {RevAMP}
     */
    RevAMP.prototype.adjustHeight = function (specificHeight) {
        var self = this;
        var providerHeight = 0;
        self.widgetEl = document.getElementById(self.getWrapperId());
        self.providerEl = self.widgetEl.querySelector('.rc-branding');
        if (self.providerEl && self.providerEl.length > 0 && self.providerEl.classList.contains('rc-text-bottom')) {
            providerHeight = self.providerEl.clientHeight;
        }

        // Start with element's content height as optimal value
        var frameHeight = self.widgetEl.offsetHeight;

        /**
         * Dynamic Frameheight calculations (DISABLED!!)
         * -- could be used in the future, relying on Element.offsetHeight for now
         * var frameHeight = Math.max(
         *   document.body.scrollHeight, document.documentElement.scrollHeight,
         *   document.body.offsetHeight, document.documentElement.offsetHeight,
         *   document.body.clientHeight, document.documentElement.clientHeight
         * );
         *
         * if (self.widgetEl.offsetHeight > 0 && frameHeight > self.widgetEl.offsetHeight) {
         *  frameHeight = self.widgetEl.offsetHeight;
         * }
         *
         */

        //clearTimeout(self.timeouts.resize);
        //self.timeouts.resize = setTimeout(function () {
        // -- DISABLE Timeoout in order to avoid losing scope or causing conflicts with the sizing rules...
        window.context.requestResize(document.clientWidth, (!isNaN(specificHeight) ? specificHeight : Math.max(50, providerHeight + frameHeight)));
        //}, 125);

        window.context.onResizeDenied(function () {
            // Conditionally Start Observing again...
        });

        window.context.onResizeSuccess(function () {
            document.body.classList.remove("resize-denied");
            document.body.classList.add("resize-success");
            self.stopObservingIntersection();
            self.isObserving = false;
        });

        return self;
    };

    /**
     * No Content Available Hook
     * --------------------------
     * After 2 minutes of no network activity, window.context.noContentAvailable() API is triggered, observers
     * are also stopped.
     *
     * See #5234 on Github - https://github.com/ampproject/amphtml/issues/5234
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.noContentAvailable = function () {
        var self = this;
        setTimeout(function () {
            if (typeof RevContentLoader !== "object") {
                self.stopObservingIntersection();
                self.isObserving = false;
                //console.log("STOP Observing...");
                window.context.noContentAvailable();
            }
        }, 2 * (60 * 1000));
        return self;
    };

    /**
     * Service INIT
     * ----------
     * Create Wrapper, Embed serve.js, Run startup hooks, Allow API Support, Report Entity Identifier, Start Observers
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.init = function () {
        var self = this;
        self.createWrapper();
        self.createScript();
        self.renderStart(3000);
        self.fetchAds();
        self.noContentAvailable();
        window.context.reportRenderedEntityIdentifier(self.ENTITY_ID);
        self.startObservingIntersection();
        return self;
    };

    /**
     * Native API Support
     * ------------------
     * data-api="true" must be set to allow API Access
     * Required amp-ad tag parameters are:
     *
     * data-api="true"
     * data-key="API_KEY"
     * data-publisher="PUBLISHER_ID"
     * data-domain="DOMAIN"
     * data-rows="1"
     * data-cols="4"
     * data-adxw="320"
     * data-adxh="240"
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.fetchAds = function () {
        var self = this;
        if (self.api.enabled && self.validateApiSettings()) {

            self.api.parameters = [];
            self.api.parameters.push("api_key=" + self.api.key);
            self.api.parameters.push("pub_id=" + self.api.publisher);
            self.api.parameters.push("widget_id=" + self.api.widget);
            self.api.parameters.push("domain=" + self.api.domain);
            self.api.parameters.push("sponsored_count=" + (self.api.dimensions.rows * self.api.dimensions.cols) + "&internal_count=0&img_h=" + self.api.ads.size.height + "&img_w=" + self.api.ads.size.width + "&api_source=amp");

            if (self.api.useJSONP) {
                self.api.JSONPCallback = self.api.JSONPCallbackName ? self.api.JSONPCallbackName : ('success' + self.getTimestamp());
                window[self.api.JSONPCallback] = function (ads) {
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
                self.api.request.onload = function () {
                    if (self.api.request.status >= 200 && self.api.request.status < 400) {
                        try {
                            self.renderNative(JSON.parse(self.api.request.responseText));
                        } catch (e) {
                        }
                    }
                };
                self.api.request.onerror = function () {
                    self.apiError();
                };
                self.api.request.send();
            }
        }
        return self;
    };

    /**
     * Validate API Settings
     * @returns {Boolean}
     */
    RevAMP.prototype.validateApiSettings = function () {
        var self = this;
        var errs = [];
        var isValid = false;

        if(errs.length == 0) {
            isValid = true;
        }

        return isValid;
    };

    /**
     * Render Native AMP Creatives
     * ---------------------------
     * Generate AMP-IMG Elements for improved loading.
     *
     * @param {Object} ads collection of items from our Native API, JSON
     * @returns {RevAMP}
     */
    RevAMP.prototype.renderNative = function (ads) {
        var self = this;
        self.createAMPDocument();
        var adPanel = '<div class="rc-amp-panel rc-amp-panel-' + self.data.id + '"></div>';
        var adRow = '<div class="rc-amp-row" data-rows="' + self.api.dimensions.rows + '" data-cols="' + self.api.dimensions.cols + '"></div>';
        self.rcjsload.insertAdjacentHTML('beforeend', adRow);
        var adMarkup = '';

        self.rcjsload.insertAdjacentHTML('beforeend', adPanel);
        self.rcjsload.querySelector('.rc-amp-panel').insertAdjacentHTML('beforeend', adRow);

        for (var a = 0; a < ads.length; a++) {
            adMarkup = '<div class="rc-amp-ad-item"><div class="rc-amp-ad-wrapper">';
            adMarkup += '<a href="' + ads[a].url + '" class="rc-cta" target="_blank">';
            adMarkup += self.generateAMPImage(ads[a].image, self.api.ads.size.width, self.api.ads.size.height, ads[a].headline, "responsive");
            adMarkup += '<h2 class="rc-headline">' + ads[a].headline + '</h2>'
            adMarkup += (self.api.branding ? '<span class="rc-brand-label">' + ads[a].brand + '</span>' : '')
            adMarkup += '</a>';
            adMarkup += '</div></div>';
            self.rcjsload.querySelector('.rc-amp-row').insertAdjacentHTML('beforeend', adMarkup);
        }
        self.rcjsload.querySelector('.rc-amp-row').insertAdjacentHTML('beforeend', '<div style="clear:both">&nbsp;</div>');
        // To set a reliable height for initial render we have to send a height request immediately after
        // adding these elements to the DOM.
        self.adjustHeight(self.widgetEl.offsetHeight);
        return self;
    };

    /**
     * Generate AMP Image Element
     * @param {String} src
     * @param {Integer} width
     * @param {Integer} height
     * @param {String} alt
     * @param {String} layout
     * @returns {String}
     */
    RevAMP.prototype.generateAMPImage = function (src, width, height, alt, layout) {
        if (!layout) {
            layout = responsive;
        }
        if (!src || src.length == 0) {
            return;
        }
        return '<amp-img class="rc-img" alt="' + alt + '" src="' + src + '" width="' + width + '" height="' + height + '" layout="responsive"></amp-img>';
    };

    /**
     * Create AMP Document Elements
     * @returns {RevAMP}
     */
    RevAMP.prototype.createAMPDocument = function () {
        var self = this;
        self.createAMPStyles();
        return self;
    };

    /**
     * Create AMP Styles
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.createAMPStyles = function () {
        var self = this;
        self.styles = document.createElement("style");
        self.styles.setAttribute("amp-custom", "");
        var cssBaseStyles = '';
        var cssStyles = cssBaseStyles + ' ' + '/* inject:css *//* endinject */';
        cssStyles += '   ' + self.api.cssOverrides.toString();
        self.styles.insertAdjacentHTML('afterbegin', cssStyles);
        document.head.appendChild(self.styles);
        return self;
    };

    /**
     * Create AMP Fonts
     * @returns {RevAMP}
     */
    RevAMP.prototype.createFontTags = function(){
        var self = this;
        self.fonts = {};
        self.fonts.roboto = document.createElement("style");
        self.fonts.roboto.setAttribute("layout", "nodisplay");
        self.fonts.roboto.setAttribute("font-family", "Roboto");
        self.fonts.roboto.setAttribute("timeout", "2000");
        self.fonts.roboto.setAttribute("on-error-remove-class", "unavailable-font-loading");
        self.fonts.roboto.setAttribute("on-error-add-class", "unavailable-font-missing");
        self.fonts.roboto.setAttribute("on-load-remove-class", "unavailable-font-loading");
        self.fonts.roboto.setAttribute("on-load-add-class", "unavailable-font-loaded");
        document.body.appendChild(self.fonts.roboto);
        return self;
    };

    /**
     * Native API Error Handler
     */
    RevAMP.prototype.apiError = function () {

    };

    /**
     * Utility: Get Timestamp
     * @returns {*}
     */
    RevAMP.prototype.getTimestamp = function () {
        var time = Date.now || function () {
                return +new Date;
            };

        return time();
    };

    /**
     * Revcontent AMP Service Instance
     * @type {RevAMP}
     */
    var RevcontentNetwork = new RevAMP();
    document.onreadystatechange = function () {
        if (document.readyState === "complete") {
            RevcontentNetwork.init();
        }
    };

    return RevcontentNetwork;

}));
