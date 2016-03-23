/**
 * RevBeacon (Beacon Pushes for API Calls)
 *
 */

(function (window, document, dialog, undefined) {
    'use strict';
    var RevBeacon = function () {
        var self = this;
        self.push = true;
        self.enabledBeacons = ["quantcast", "comscore"];
        self.beacons = {
            get: function(beaconId){
                var beacons = this;
                return beacons.beaconId !== undefined ? beacons.beaconId : {enabled: false}
            },
            quantcast: {
                enabled: true,
                type: 'pixel',
                pixel_url: '//pixel.quantserve.com/pixel/p-aD1qr93XuF6aC.gif',
                script_url: false
            },
            comscore: {
                enabled: true,
                type: 'script',
                pixel_url: false,
                script_url: '//b.scorecardresearch.com/p?c1=7&c2=20310460&c3=12345&cv=2.0&cj=1'
            }
        };

        self.init();
    };

    RevBeacon.prototype.init = function () {
        var self = this;
        document.onreadystatechange = function () {
            if (document.readyState == "complete") {
                for(b=0; b<self.enabledBeacons.length;b++){
                    var beaconId = self.beacons[b];
                    var beacon = self.beacons.get(beaconId);
                    var beaconScript = '<script type="text/javascript">$1</script>';
                    var beaconImage = '<img src="$1" />';
                    var beaconEl = '';
                    if(beacon.enabled === true){
                        switch(beacon.type) {
                            case 'script':
                                beaconEl = beaconScript.replace('$1', beacon.script_url);
                                break;
                            case 'pixel':
                            case 'default':
                                beaconEl = beaconImage.replace('$1', beacon.pixel_url);
                                break;
                        }
                        document.body.insertAdjacentHTML('afterend', beaconEl);
                    }
                }
            }
        }
    };


    window.revBeacon = new RevBeacon();

    return window.revBeacon;

}(window, document));