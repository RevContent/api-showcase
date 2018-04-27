/*
Project: EngagePanel
Version: 0.0.1
Author: michael@revcontent.com
*/

( function( window, factory ) {
    'use strict';
    // browser global
    window.EngagePanel = factory(window, window.revUtils, window.revDetect, window.revDisclose);

}( window, function factory(window, revUtils, revDetect, revDisclose) {
'use strict';

    var EngagePanel = function(opts) {

        var defaults = {
            transition_duration_multiplier: 2,
            side: 'right'
        };

        // merge options
        this.options = Object.assign(defaults, opts);

        this.init();
    };

    EngagePanel.prototype.init = function() {
        this.open = false;
        this.createContainer();
        this.positionContainer();
    };

    EngagePanel.prototype.createContainer = function() {
        this.fullPageContainer = document.createElement('div');

        this.fullPageContainer.id = 'rev-side-shifter';

        this.containerElement = document.createElement('div');
        revUtils.addClass(this.containerElement, 'rev-side-shifter-container');
        // this.containerElement.id = 'rev-feed';

        this.innerElement = document.createElement('div');
        revUtils.addClass(this.innerElement, 'rev-side-shifter-inner');

        revUtils.append(this.containerElement, this.innerElement);

        revUtils.append(this.fullPageContainer, this.containerElement);

        revUtils.prepend((revDetect.mobile() ? document.body : this.options.containerElement), this.fullPageContainer);
    };

    EngagePanel.prototype.positionContainer = function() {
        if (this.options.side == 'left') {
            revUtils.transformCss(this.fullPageContainer, 'translateX(-100%)');
            revUtils.addClass(this.fullPageContainer, 'rev-side-shifter-left');
            this.fullPageContainer.style.left = '0';
        } else {
            revUtils.transformCss(this.fullPageContainer, 'translateX(100%)');
            revUtils.addClass(this.fullPageContainer, 'rev-side-shifter-right');
            this.fullPageContainer.style.right = '0';
        }
    };

    EngagePanel.prototype.transition = function(button) {
        this.transitionDuration = this.fullPageContainer.offsetWidth * this.options.transition_duration_multiplier

        this.transitionTransformShadow(this.transitionDuration);

        if (this.buttonElement) {
            revUtils.transitionDurationCss(this.buttonElement.children[0], (this.transitionDuration / 4) + 'ms');
        }

        if (!revDetect.mobile()) {
            // this gets removed in cornerbutton transitionend callback
            this.options.innerWidget.element.style.overflow = 'hidden';
        }

        if (this.open) {
            document.documentElement.style.overflow = 'visible';
            document.documentElement.style.height = 'auto';

            if (this.options.side == 'left') {
                revUtils.transformCss(this.fullPageContainer, 'translateX(-100%)');
            } else {
                revUtils.transformCss(this.fullPageContainer, 'translateX(100%)');
            }
            this.open = false;
            revUtils.removeClass(this.buttonElement, 'rev-close');

            var that = this;
            setTimeout(function() {
                revUtils.removeClass(that.fullPageContainer, 'rev-side-shifter-animating');
            }, Math.max(0, this.transitionDuration - 300));
        } else {

            if (revDetect.mobile()) {
                document.documentElement.style.overflow = 'hidden';
                document.documentElement.style.height = '100%';
            }

            revUtils.addClass(this.fullPageContainer, 'rev-side-shifter-animating');

            // revUtils.transformCss(this.fullPageContainer, 'translateX(0%)');
            this.fullPageContainer.style.transform = null; // ENG-412

            this.open = true;
            revUtils.addClass(this.buttonElement, 'rev-close');
        }

        this.transitioning = true;

        var that = this;
        setTimeout(function() {
            that.transitioning = false;
        }, this.transitionDuration);
    };

    EngagePanel.prototype.transitionTransformShadow = function(duration) {
        revUtils.transitionCss(this.fullPageContainer, 'transform ' + duration + 'ms cubic-bezier(.06, 1, .6, 1), box-shadow 300ms');
    };

    return EngagePanel;

}));