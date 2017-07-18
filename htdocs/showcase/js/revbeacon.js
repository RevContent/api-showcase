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
                script_url: '//js.ad-score.com/score.min.js?pid=1000177#&tid=display-ad&uid=' + '{uid}' + '&uip=' + '{uip}' + '&ref=' + '{ref}' + '&pub_domain=' + '{fqdn}' + '&cb=' + '{cache}',
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
                            //var payload_url = 'http://api-showcase.localhost/fake-api.php' +
                            var payload_url = user_options.url + '/request-info' +

                                '?api_key=' + user_options.api_key +
                                '&pub_id=' + user_options.pub_id +
                                '&widget_id=' + user_options.widget_id +
                                '&domain=' + user_options.domain +
                                '&api_source=' + user_options.api_source;

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
        beacon = beacon.replace('{ref}', response.referrer);
        beacon = beacon.replace('{fqdn}', response.domain);
        beacon = beacon.replace('{cache}', response.cache);
        console.log("Parsed Beacon URL = ", beacon);
        return beacon;
    };

    var rB = new RevBeacon();

    return rB;

}));