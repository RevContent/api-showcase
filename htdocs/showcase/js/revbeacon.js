/**
 * RevBeacon (Beacon Pushes for API Calls)
 *
 */

(function (window, document, undefined) {
    'use strict';
    var RevBeacon = function () {
        var self = this;
        self.parent = document.getElementsByTagName('body')[0];
        self.pluginSource = '';
        self.push = true;
        self.pushed = 0;
        self.enabledBeacons = ["quantcast", "comscore"];
        self.renderedBeacons = [];
        self.beacons = {
            get: function(beaconId){
                var beacons = this;
                return beacons.beaconId !== undefined ? beacons.beaconId : {enabled: false}
            },
            quantcast: {
                enabled: true,
                type: 'pixel',
                pixel_url: '//pixel.quantserve.com/pixel/p-aD1qr93XuF6aC.gif',
                script_url: false,
                styles: 'display:none;border:0;width:1px;height:1px'
            },
            comscore: {
                enabled: true,
                type: 'script',
                pixel_url: false,
                script_url: '//b.scorecardresearch.com/p?c1=7&c2=20310460&c3=12345&cv=2.0&cj=1',
                styles: ''
            }
        };

        self.init();
    };

    RevBeacon.prototype.init = function () {
        var self = this;
        document.onreadystatechange = function () {
            if (document.readyState == "complete") {

            }
        }
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
                    self.parent.insertAdjacentHTML('beforeend', beaconEl);
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

    window.revBeacon = new RevBeacon();

    return window.revBeacon;

}(window, document));