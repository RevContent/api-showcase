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
 * @todo Additional Font support
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
        self.viewportWidth = window.outerWidth || document.documentElement.clientWidth;
        self.rcjsload = null;
        self.rcel = null;
        self.serveParameters = null;
        self.testing = ((self.data.testing !== undefined) ? true : false);
        self.useAutoSizer = ((self.data.sizer !== undefined && self.data.sizer != "true") ? false : true);
        self.isObserving = false;
        self.isResizing = false;
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
            cssOverrides: (self.data.css !== undefined && self.data.css.length > 0) ? self.data.css.toString().trim() : '',
            amp: {
                useAmpImage: true
            }
        };
        self.timeouts = {
            resize: 0,
            orientation: 0
        };
        // This element should be present in the 3p/remote.html
        // div#c , style="position:absolute;top:0;left:0;bottom:0;right:0;"
        // IMPORTANT: Our outermost wrapper should be embedded as a child of this absolute element...
        self.remote3p = {
            domId: 'c'
        };
        self.fonts = {
            default: 'openSans',
            selected: (self.data.font !== undefined && self.data.font.length > 0) ? self.data.font : 'openSans',
            available: {
                roboto: {
                    family: 'Roboto',
                    stylesheet: '<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">'
                },
                openSans: {
                    family: 'Open Sans',
                    stylesheet: '<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">'
                },
                montserrat: {
                    family: 'Montserrat',
                    stylesheet: '<link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet">'
                }
            }
        };
        self.observers = {
            config: {attributes: true, childList: true, characterData: true},
            wrapper: null
        };
        self.debug = {
            on: (window.DEBUG || (self.data.debug !== undefined)) ? true : false,
            log: function (msg, level) {
                if (!level) {
                    level = 'notice';
                }
                if (typeof console == "object") {
                    console.log(level.toUpperCase() + " -  Revcontent.AMP : " + msg);
                }
            }
        };
        self.preload = {
            on: true
        };
        self.branding = {
            sponsorText: 'Ads by Revcontent'
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
        self.dispatch("Creating Outer DOM Wrapper with ID of. #" + self.rcjsload.id);
        self.remote3p.node = document.getElementById(self.remote3p.domId);
        self.dispatch("Obtained 3p-frame node element (Used for embedding): " + self.remote3p.node);
        if (self.remote3p.node !== undefined && self.remote3p.node !== null) {
            self.dispatch("3P Node frame found! Attaching our load wrapper now, div#" + self.rcjsload.id);
            self.remote3p.node.appendChild(self.rcjsload);
        } else {
            self.dispatch("3P node frame element (div#c) is MISSING! attaching to body as a failsafe, please verify the 3p frame source file is functional!" + self.rcjsload.id, 'warn');
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
        self.dispatch("Attempting to create Serve.js embed script.");
        if (self.api.enabled) {
            self.dispatch("API Mode Detected!! Aborting script embed, this must mean data-api is TRUE. Rendering Native Ads instead (3p amp-img creatives), ", 'warn');
            return;
        }
        self.rcel = document.createElement("script");
        self.rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
        self.rcel.type = 'text/javascript';
        self.serveParameters = '?' + (self.testing === true ? 'uitm=1&' : '') + "w=" + self.data.id + "&t=" + self.rcel.id + "&c=" + (new Date()).getTime() + "&width=" + self.viewportWidth;
        self.serveUrl = self.serveProtocol + self.serveHost + self.serveScript + self.serveParameters;
        self.rcel.src = self.serveUrl;
        self.rcel.async = true;
        self.dispatch("Serve.js URL has been generated! Please verify for accuracy: " + self.serveUrl);
        var rcds = document.getElementById(self.rcjsload.id);
        rcds.appendChild(self.rcel);
        self.dispatch("Triggering renderStart with NO size payload (height adjustment will follow)");
        //window.context.renderStart();
        //rcds.insertAdjacentHTML('afterend', '<div style="clear:both">&nbsp;</div>');
        self.dispatch("--- INJECTING SERVE.JS (Triggers load of rev2.js/rev2.css) --- ", 'warn');
        self.observers.wrapper = new MutationObserver(function (mutations) {
            self.dispatch("Setup a Mutation Observer to check for fill data to be added... ");
            mutations.forEach(function (mutation) {
                var panel = rcds.querySelector('.rc-uid-' + self.data.id);
                if (panel !== undefined && panel !== null) {
                    //window.context.renderStart();
                    panel.insertAdjacentHTML('afterend', '<div style="clear:both">&nbsp;</div>');
                    self.dispatch("Mutation Received!! Triggering a call for height resize with a value of: " + panel.offsetHeight + 'px');
                    self.dispatch("Begin RENDER: Firing context.renderStart() NOW! for standard amp-tag (Serve.js fill), height = " + panel.offsetHeight, "warn");
                    if (typeof rcel == "object") {
                        if (self.preload.on) {
                            self.dispatch("Got RCEL OBJECT! Serve.js should have been loaded at this point... preparing to preload creatives and trigger renderStart()!!", 'important');
                            var adPhotos = rcel.querySelectorAll('.rc-photo');
                            if (adPhotos.length > 0) {
                                self.preloader(adPhotos, function () {
                                    // window.context.renderStart({width: self.viewportWidth, height: rcel.scrollHeight});
                                    // ***************
                                    self.adjustHeight(panel.scrollHeight);
                                    // ***************
                                });
                            } else {
                                self.dispatch("PRELOADER: No RC-PHOTO Items have been found in the DOM!!", 'severe');
                            }
                        }
                    }

                    //window.context.renderStart({
                    //    width: document.clientWidth,
                    //    height: panel.offsetHeight
                    //});
                    //self.adjustHeight(panel.offsetHeight);
                    self.isResizing = true;

                }
                // -- DISABLING -- the Size by the 3P Node, as it's absolute with 0,0,0,0 boundaries,
                // it will always be too tall, preferring the panel's offsetHeight above.
                //if(self.remote3p.node !== undefined && self.remote3p.node !== null){
                //    self.dispatch("Mutation Received!! Triggering a call for height resize with a value of: " + self.remote3p.node.scrollHeight + 'px');
                //    self.adjustHeight(self.remote3p.node.scrollHeight);
                //}
            });
        });
        //self.rev2ObserverConfig = { attributes: true, childList: true, characterData: true };
        self.observers.wrapper.observe(rcds, self.observers.config);
        // DISABLE manual height adjust here, rely on the Mutation Observer above for more accuracy...
        //self.adjustHeight(self.remote3p.node.scrollHeight);
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
        document.body.classList.add("is-observing-intersection");
        self.dispatch("Starting Intersection Observer, resizes are requested only when the ratio is 0 (Ad is NOT in viewport)");
        self.stopObservingIntersection = window.context.observeIntersection(function (changes) {
            changes.forEach(function (c) {
                if (c.intersectionRatio == 0 || c.intersectionRatio <= 0.5) {
                    self.dispatch("INTERSECTION EVENT: Ratio is at 0 or less than or equal to 0.5, requesting height resize....", 'warn');
                    self.adjustHeight();
                }
                /*else if (c.intersectionRatio == 1) {
                 self.dispatch("INTERSECTION EVENT: Ratio is 1+ --- STOPPING INTERSECTION OBSERVERS!", 'warn');
                 self.stopObservingIntersection();
                 }*/
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
        // RELOCATE renderStart() to optimial locations....
        // API and non-api tags will need to invoke this at different times
        //self.dispatch("Begin RENDER: window.context.renderStart() is being called now.", "warn");
        if(!self.api.enabled) {
            window.context.renderStart({width: document.clientWidth});
        }

        if (self.useAutoSizer) {
            self.dispatch("Auto-Sizer is turned ON (Default setting, to disable set data-sizer=false on your amp tag)");
            self.adjustHeight();
            window.addEventListener('resize', function (event) {
                self.dispatch("-- RESIZE.event -- if not already listening START OBSERVING...", 'warn');
                //self.adjustHeight();
                if (!self.isObserving) {
                    self.startObservingIntersection();
                }
                clearTimeout(self.timeouts.resize);
                self.timeouts.resize = setTimeout(function () {
                    self.adjustHeight();
                }, 250);
            });
            window.addEventListener('orientationchange', function (event) {
                self.dispatch("-- ORIENTATION-CHANGE.event -- if not already listening START OBSERVING...", 'warn');
                if (!self.isObserving) {
                    self.startObservingIntersection();
                }
                clearTimeout(self.timeouts.orientation);
                self.timeouts.orientation = setTimeout(function () {
                    self.adjustHeight();
                }, 250);
                //clearTimeout(self.timeouts.orientation);
                //self.timeouts.orientation = setTimeout(function(){
                //    self.dispatch("Optimizing height after 125ms Delay (from previous Orientation change)", 'warn');
                //    self.adjustHeight();
                //}, 125);
                //var orientationHandler = function (e) {
                //    if (!self.isObserving) {
                //        self.startObservingIntersection();
                //    }
                //    window.removeEventListener('resize', orientationHandler);
                //};
                //window.addEventListener('resize', orientationHandler);
            });
            window.addEventListener('amp:visibilitychange', function(){
                self.dispatch("AMP Visibility Change Detected! Requesting resize...", 'special');
                self.adjustHeight();
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
        //if(document.body.classList.contains('is-resizing')){
        //if(self.isResizing){
        //    self.dispatch("-- RESIZE IN PROGRESS, SKIPPING UNTIL LAST ONE COMPLETES --", "warn");
        //    return;
        //}
        //document.body.classList.add("is-resizing");
        self.isResizing = true;
        self.dispatch("AUTO-SIZER - Starting Resize, user provided height = " + specificHeight);
        self.widgetEl = document.getElementById(self.getWrapperId());
        self.providerEl = self.widgetEl.querySelector('.rc-branding');
        if (self.providerEl && self.providerEl.length > 0 && self.providerEl.classList.contains('rc-text-bottom')) {
            self.dispatch("AUTO-SIZER - Detected floating provider label, incorporating extra height.");
            providerHeight = self.providerEl.clientHeight;
        }

        // Start with element's content height as optimal value
        // For non-api tags we want scrollHeight instead
        var frameHeight = (self.api.enabled ? self.widgetEl.offsetHeight : self.widgetEl.scrollHeight);
        var adHeight = providerHeight + frameHeight;
        if (adHeight == 0 || (specificHeight !== undefined && specificHeight == 0)) {
            self.dispatch("AUTO-SIZER: ABORTING!!! Invalid Height received", "severe");
            return;
        }
        self.dispatch("AUTO-SIZER - Optimal Frame height = " + frameHeight + ", the provided height value will override this value! Fallback height of 50PX is used.");
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
        window.context.requestResize(document.clientWidth, (!isNaN(specificHeight) ? specificHeight : adHeight));
        self.dispatch("AUTO-SIZER - Final API Call for resize: window.context.requestResize(" + document.clientWidth + "," + (!isNaN(specificHeight) ? specificHeight : Math.max(50, providerHeight + frameHeight)));
        //}, 125);

        window.context.onResizeDenied(function (h, w) {
            // Conditionally Start Observing again...
            self.dispatch("AUTO-SIZER - Resize was DENIED (" + w + "x" + h + "), this is expected if called too early, repeated denials indicates a real problem.", 'error');
            //document.body.classList.remove("is-resizing");
            document.body.classList.remove("resize-success");
            self.isResizing = false;
        });

        window.context.onResizeSuccess(function (h, w) {
            self.widgetEl = document.getElementById(self.getWrapperId());
            self.dispatch("AUTO-SIZER - RESIZE SUCCESS! (" + w + "x" + h + ") Panel should be scaled to an requested size of: " + h + 'px, optimal size = ' + self.widgetEl.offsetHeight + 'px');
            document.body.classList.remove("resize-denied");
            //document.body.classList.remove("is-resizing");
            self.isResizing = false;
            if (!document.body.classList.contains("resize-success")) {
                document.body.classList.add("resize-success");
            }
            // Ony stop listening for API based tags
            if (self.api.enabled) {
                self.stopObservingIntersection();
                self.isObserving = false;
                document.body.classList.remove("is-observing-intersection");
                self.dispatch("AUTO-SIZER - Stopping Intersection Observers (Will be restarted automatically when triggered)", 'warn');
            }

            //if(h > 0 && self.widgetEl.offsetHeight > 0 && (h < self.widgetEl.offsetHeight || h > self.widgetEl.offsetHeight)) {
            //    self.dispatch("AUTO-SIZER - UNDERSIZE OR OVERSIZE DETECTED! Requesting another resize to the panel's offsetHeight of: "  + self.widgetEl.offsetHeight + 'px to correct the problem!', 'special');
            //    self.adjustHeight(self.widgetEl.offsetHeight);
            //}
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
                document.body.classList.add("is-observing-intersection");
                document.body.classList.add("no-content-available");
                self.dispatch("NO CONTENT AVAILABLE AFTER ~2 MINUTES, THIS AMP TAG WILL BE COLLAPSED. CHECK API AND/OR DATA STREAM", 'severe');
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
        self.dispatch("Starting Up...");
        self.dispatch("Tag property configuration: ");
        self.dispatch(self.data);
        self.createWrapper();
        self.createScript();
        self.renderStart(3000);
        self.fetchAds();
        self.noContentAvailable();
        window.context.reportRenderedEntityIdentifier(self.ENTITY_ID);
        self.dispatch("Reporting Entity Identifier AS: " + self.ENTITY_ID);
        self.startObservingIntersection();
        self.dispatch("Init sequence completed. ");
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
            self.dispatch("API Parameters are: ", self.api.parameters.join(', '));
            if (self.api.useJSONP) {
                self.dispatch("API Access Enabled, fetching ads using JSONP for a Native render");
                self.dispatch("Using Endpoint: " + self.api.endpoint);
                self.api.JSONPCallback = self.api.JSONPCallbackName ? self.api.JSONPCallbackName : ('success' + self.getTimestamp());
                window[self.api.JSONPCallback] = function (ads) {
                    self.dispatch("JSONP Callback is Running NOW!!", 'success');
                    self.renderNative(ads);
                };
                self.ApiJSONScript = document.createElement('script');
                self.ApiJSONScript.type = "text/javascript";
                self.ApiJSONScript.async = true;
                self.ApiJSONScript.src = self.api.endpoint + '?' + self.api.parameters.join('&') + '&callback=' + self.api.JSONPCallback;
                //document.body.appendChild(self.ApiJSONScript);
                var rcds = document.getElementById(self.rcjsload.id);
                rcds.appendChild(self.ApiJSONScript);
            } else {
                self.dispatch("API Access ENABLED, fetching Ads using XHR with Native render");
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

        if (errs.length == 0) {
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
        var adSponsor = '<span class="rc-sponsored-by">' + self.branding.sponsorText + '</span>';
        var adRow = '<div class="rc-amp-row" data-rows="' + self.api.dimensions.rows + '" data-cols="' + self.api.dimensions.cols + '"></div>';
        self.rcjsload.insertAdjacentHTML('beforeend', adRow);
        var adMarkup = '';

        self.rcjsload.insertAdjacentHTML('beforeend', adPanel);
        self.rcjsload.insertAdjacentHTML('afterbegin', adSponsor);
        self.rcjsload.querySelector('.rc-amp-panel').insertAdjacentHTML('beforeend', adRow);

        for (var a = 0; a < ads.length; a++) {
            adMarkup = '<div class="rc-amp-ad-item"><div class="rc-amp-ad-wrapper">';
            adMarkup += '<a href="' + ads[a].url + '" class="rc-cta" target="_blank">';
            if(self.api.amp.useAmpImage) {
                adMarkup += self.generateAMPImage(ads[a].image, self.api.ads.size.width, self.api.ads.size.height, ads[a].headline, "responsive");
            } else {
                adMarkup += self.generateHtmlImage(ads[a].image, self.api.ads.size.width, self.api.ads.size.height, ads[a].headline);
            }
            adMarkup += '<h2 class="rc-headline">' + ads[a].headline + '</h2>';
            adMarkup += (self.api.branding ? '<span class="rc-brand-label">' + ads[a].brand + '</span>' : '');
            adMarkup += '</a>';
            adMarkup += '</div></div>';
            self.rcjsload.querySelector('.rc-amp-row').insertAdjacentHTML('beforeend', adMarkup);
        }
        self.rcjsload.querySelector('.rc-amp-row').insertAdjacentHTML('beforeend', '<div style="clear:both">&nbsp;</div>');
        // To set a reliable height for initial render we have to send a height request immediately after
        // adding these elements to the DOM.
        self.adjustHeight(self.widgetEl.offsetHeight);
        //self.dispatch("Begin RENDER: Firing context.renderStart() NOW! for API-based amp-tag: height = " + self.widgetEl.offsetHeight);
        window.context.renderStart({
            width: document.clientWidth,
            height: self.widgetEl.offsetHeight
        });
        self.isResizing = true;
        self.dispatch("Rendering Native Ads COMPLETE, requesting a resize of panel to height: " + self.widgetEl.offsetHeight, 'success');
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
     * Generate HTML Image Element
     * @param {String} src
     * @param {Integer} width
     * @param {Integer} height
     * @param {String} alt
     * @returns {String}
     */
    RevAMP.prototype.generateHtmlImage = function (src, width, height, alt) {
        if (!src || src.length == 0) {
            return;
        }
        return '<img class="rc-img" alt="' + alt + '" src="' + src + '" width="' + width + '" height="' + height + '" />';
    };

    /**
     * Create AMP Document Elements
     * @returns {RevAMP}
     */
    RevAMP.prototype.createAMPDocument = function () {
        var self = this;
        if(self.api.amp.useAmpImage){
            self.createAMPStyles();
        }
        return self;
    };

    /**
     * Create AMP Styles
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.createAMPStyles = function () {
        var self = this;
        self.dispatch("Attaching AMP custom styles to document.");
        self.dispatch("Using a font family selection of: " + self.fonts.available[self.fonts.selected].family);
        self.styles = document.createElement("style");
        self.styles.setAttribute("amp-custom", "");
        var cssBaseStyles = '';
        var cssStyles = cssBaseStyles + ' ' + '/* inject:css *//* endinject */';
        if (self.fonts.selected != self.fonts.default) {
            cssStyles += '   ' + ' body {font-family: "' + self.fonts.available[self.fonts.selected].family + '", Arial, Helvetica, sans-serif;} ';
        }
        cssStyles += '   ' + self.api.cssOverrides.toString();
        self.styles.insertAdjacentHTML('afterbegin', cssStyles);
        self.createFontTags();
        document.head.appendChild(self.styles);

        return self;
    };

    /**
     * Create AMP Fonts
     * Links stylesheet for Whitelisted font providers, choices are:
     *
     * - data-font="openSans"     : "Open Sans" (Default)***
     * - data-font-"roboto"       : Roboto
     * - data-font="montserrat"   : Montserrat
     *
     * @returns {RevAMP}
     */
    RevAMP.prototype.createFontTags = function () {
        var self = this;
        self.dispatch("Injecting font stylesheet from Google Font APIs...");
        self.dispatch("Linking: " + self.fonts.available[self.fonts.selected].stylesheet);
        document.head.insertAdjacentHTML('beforeend', self.fonts.available[self.fonts.selected].stylesheet);
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
     * Debug Dispatch (Basic logging via console.log)
     *
     * @param msg
     * @param level
     * @returns {RevAMP}
     */
    RevAMP.prototype.dispatch = function (msg, level) {
        var self = this;
        if (!level) {
            level = 'notice';
        }
        if (self.debug.on) {
            self.debug.log(msg, level);
        }
        return self;
    };


    /**
     * Preloader for Ad Items
     * NOTE: This Expects a collection of rc-photo elements found on a standard serve.js fill, and extracts the
     * creative from the background-image definition.
     *
     * @param images collection of rc-photo items
     * @param callback to execute once last creative loads...
     * @param rawStack if set this means a raw array of images are provided, no bg extraction required
     * @returns {RevAMP}
     * @todo    Research the implications of preloading with respect to CDN hit metrics
     */
    RevAMP.prototype.preloader = function (images, callback, rawStack) {
        var self = this;
        if (!rawStack) {
            rawStack = false;
        }
        for (var a = 0; a < images.length; a++) {
            var photo = images[a];
            var imageUrl = '';
            if (!rawStack) {
                imageUrl = photo;
            } else {
                imageUrl = photo.style["background-image"].split('"')[1];
            }
            self.loadCreative(imageUrl, a, images.length - 1, callback);
        }
        return self;
    };

    /**
     * Preloader: Load Creative
     * NOTE: The callback function is executed only once the final creative has loaded (After hardset 250ms delay).
     *
     * @param imageUrl   Image URL to preload
     * @param index      current image Index
     * @param lastIndex  last image Index
     * @returns {RevAMP}
     */
    RevAMP.prototype.loadCreative = function (imageUrl, index, lastIndex) {
        var self = this;
        self.dispatch("Preloading Creative Image Source from CDN.." + imageUrl, 'special');
        var creative = new Image();
        creative.src = imageUrl;
        if (index == lastIndex) {
            creative.onload = function () {
                self.dispatch("Final Image Preloaded, " + imageUrl + ", firing callback after 250ms delay.... ", 'special');
                setTimeout(function () {
                    if (typeof callback == "function") {
                        self.dispatch("PRELOADER Callback Executing NOW!", 'special');
                        callback();
                    }
                }, 250);
            };
        }
        return self;
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
