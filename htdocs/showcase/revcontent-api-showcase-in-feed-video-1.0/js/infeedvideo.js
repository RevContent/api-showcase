/*
Project: RevVideo
Version: 1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevVideo = factory(window, window.revUtils, window.revDetect, window.revApi, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revApi, revDisclose) {
'use strict';

    var RevVideo = function(config) {
        this.config = config;
        this.element = document.getElementById(this.config.id);
        this.init();
    };

    RevVideo.prototype.init = function() {
        this.emitter = new EvEmitter();

        revUtils.appendStyle('/* inject:css */[inject]/* endinject */', 'rev-util');

        var that = this;
        window[this.config.id + '_callback'] = function(unit) {
            unit.on('ready',function(){
                var brandingContainer = document.createElement('div');
                brandingContainer.className = 'rc-branding-container';

                var branding = document.createElement('div');
                branding.className = 'rc-text-bottom rc-text-center rc-branding rc-bl-ads-by-revcontent';
                branding.innerHTML = '<div class=\"rc-branding-label\">Ads by Revcontent</div><div class=\"rc-brand-content\"><img src=\"//serve.revcontent.com/assets/img/adchoices_icon.png\" id=\"rc-adchoices\" class=\"rc-adchoices\"/></div>';

                revUtils.append(brandingContainer, branding);
                revUtils.append(that.element, brandingContainer);

                revUtils.addEventListener(branding, 'click', function() {
                    window.revDialog.showDialog();
                });

                that.registerViewOnceVisible();
                that.attachVisibleListener();
                revUtils.checkVisible.bind(that, that.element, that.visible, 50)();
            })
            .init();
        }

        var connatixScript = document.createElement('script');
        connatixScript.setAttribute('src', 'https://cdn.connatix.com/min/connatix.renderer.infeed.min.js');
        connatixScript.setAttribute('async', true);
        connatixScript.setAttribute('type', 'text/javascript');
        connatixScript.setAttribute('data-connatix-token', this.config.token);
        connatixScript.setAttribute('ext-interface-callback', this.config.id + '_callback');
        connatixScript.setAttribute('pcp1', this.config.widget_id);
        connatixScript.setAttribute('pcp2', this.config.pub_id);
        if ('custom_logo' in this.config && this.config.custom_logo != '') {
            connatixScript.setAttribute('customlogo', this.config.custom_logo);
        } else {
            connatixScript.setAttribute('customlogo', 'https://i.connatix.com/s3/connatix-uploads/assets/RCIcon3.png?mode=pad&height=18');
        }
        if ('video_id' in this.config && this.config.video_id > 0) {
            connatixScript.setAttribute('cnx-video-id', this.config.video_id);
        }
        revUtils.append(this.element, connatixScript);
    }

    RevVideo.prototype.visible = function() {
        this.emitter.emitEvent('visible');
    };

    RevVideo.prototype.attachVisibleListener = function() {
        this.visibleListener = revUtils.throttle(revUtils.checkVisible.bind(this, this.element, this.visible), 60);
        revUtils.addEventListener(window, 'scroll', this.visibleListener);
    };

    RevVideo.prototype.registerViewOnceVisible = function() {
        var that = this;
        this.emitter.once('visible', function() {
            revUtils.removeEventListener(window, 'scroll', that.visibleListener);
            that.registerView();
        });
    };

    RevVideo.prototype.registerView = function() {
        if (!this.viewed) {
            this.viewed = true;
            revApi.request(this.config.view_url + '?view=' + this.config.view + '&p[]=0', function() { return; });
        }
    };

    return RevVideo;
}));