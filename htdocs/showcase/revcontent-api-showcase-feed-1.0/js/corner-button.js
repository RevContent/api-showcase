/*
Project: EngageCornerButton
Version: 0.0.1
Author: michael@revcontent.com
*/

( function( window, factory ) {
    'use strict';
    // browser global
    window.EngageCornerButton = factory(window, window.revUtils, window.revDetect);

}( window, function factory(window, revUtils, revDetect) {
'use strict';

    var EngageCornerButton = function(opts) {

        var defaults = {
            buttons: [
                {
                    name: 'Personalized',
                    auth_required: true,
                    auth_name: 'Recommended',
                    auth_options: {
                        feed_type: 'contextual'
                    },
                    options: {

                    }
                },
                {
                    name: 'Latest',
                    options: {
                        feed_type: 'latest'
                    }
                },
                {
                    name: 'Trending',
                    options: {
                        feed_type: 'trending'
                    }
                }
            ],
        };

        // merge options
        this.options = Object.assign(defaults, opts);

        this.initProfile();

        this.init();
    };

    EngageCornerButton.prototype.initProfile = function() {
        this.profileMask = document.createElement('div');
        this.profileMask.id = 'profile-mask';

        this.userProfile = document.createElement('div');
        this.userProfile.id = 'rev-user-profile';

        this.userProfileImage = document.createElement('div');
        this.userProfileImage.id = 'profile-image';

        var userProfileFake = document.createElement('div');
        userProfileFake.id = 'profile-fake';

        revUtils.append(this.userProfile, this.userProfileImage);
        revUtils.append(this.userProfile, userProfileFake);
    }

    EngageCornerButton.prototype.appendProfile = function() {
        revUtils.append(document.body, this.userProfile);
        revUtils.append(document.body, this.profileMask);

        revUtils.addEventListener(this.profileMask, 'transitionend', function(ev) {
            if (ev.propertyName === 'transform') {
                if (!revUtils.hasClass(document.body, 'animate-user-profile')) {
                    revUtils.removeClass(document.body, 'profile-mask-show');
                }
            }
        });

        revUtils.addEventListener(this.profileMask, revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
            revUtils.removeClass(document.body, 'animate-user-profile');
        });

        revUtils.addEventListener(this.userProfile, revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
            ev.preventDefault();
        }, {passive: false});

        this.userProfileAppended = true;
    }

    EngageCornerButton.prototype.init = function() {
        var that = this;

        // corner button

        this.buttonContainerElement = document.createElement('div');
        this.buttonContainerElement.id = 'rev-corner-button-container';

        this.buttonElement = document.createElement('a');
        this.buttonElement.id = 'rev-corner-button';

        this.buttonElementInner = document.createElement('div');
        this.buttonElementInner.className = 'eng-corner-button-inner';

        this.buttonElementInnerIcon = document.createElement('div');
        this.buttonElementInnerIcon.className = 'eng-corner-button-inner-icon';

        this.buttonElementInnerWave = document.createElement('div');
        this.buttonElementInnerWave.className = 'eng-corner-button-inner-wave';

        revUtils.append(this.buttonElementInner, this.buttonElementInnerIcon);
        revUtils.append(this.buttonElementInner, this.buttonElementInnerWave);
        revUtils.append(this.buttonElement, this.buttonElementInner);
        revUtils.append(this.buttonContainerElement, this.buttonElement);

        revUtils.append(document.body, this.buttonContainerElement);

        Waves.attach(this.buttonElementInnerWave, ['waves-circle']);
        Waves.init();

        var updateButtonElementInnerIcon = function(reset) {
            if (reset) {
                revApi.request(that.options.host + '/api/v1/engage/profile.php?', function(data) {
                    revUtils.addClass(that.buttonElementInnerIcon, 'eng-default-profile');
                    that.buttonElementInnerIcon.style.backgroundImage = null;

                    revUtils.addClass(that.userProfileImage, 'eng-default-profile');
                    that.userProfileImage.style.backgroundImage = null;

                    that.options.user = data ? data : null;

                    if (data && data.picture) {
                        that.buttonElementInnerIcon.style.backgroundImage = 'url(' + data.picture + ')';
                        that.userProfileImage.style.backgroundImage = 'url(' + data.picture + ')';
                    }
                });
            } else if (that.options.user && that.options.user.picture) {
                that.buttonElementInnerIcon.style.backgroundImage = 'url(' + that.options.user.picture + ')';
                that.userProfileImage.style.backgroundImage = 'url(' + that.options.user.picture + ')';
            } else {
                revUtils.addClass(that.buttonElementInnerIcon, 'eng-default-profile');
                revUtils.addClass(that.userProfileImage, 'eng-default-profile');
            }
        }

        updateButtonElementInnerIcon();

        this.options.emitter.on('updateButtonElementInnerIcon', function() {
            updateButtonElementInnerIcon(true);
        });

        this.options.emitter.on('updateButtons', function(authenticated) {
            that.options.authenticated = authenticated;

            for (var i = 0; i < that.options.buttons.length; i++) {
                that.options.buttons[i].element.className = 'menu-button menu-button-' + (authenticated && that.options.buttons[i].auth_name ? that.options.buttons[i].auth_name.toLowerCase() : that.options.buttons[i].name.toLowerCase());
            }
        });

        // buttonElement press and touch

        this.mc = new Hammer(this.buttonElement, {
            recognizers: [
                [
                    Hammer.Press,
                    {
                        time: 150
                    }
                ],
            ],
            // domEvents: true
        });

        this.mc.on('press', function(ev) {
            if (!revUtils.hasClass(document.body, 'animate-user-profile')) {

                // revUtils.removeClass(that.buttonContainerElement, 'visible'); // just in case touch was triggered and buttons visible

                if (!that.userProfileAppended) {
                    that.appendProfile();
                }

                revUtils.addClass(document.body, 'profile-mask-show');
                setTimeout(function() {
                    revUtils.addClass(document.body, 'animate-user-profile');
                });
            }
        });

        var leaveTimeout;

        revUtils.addEventListener(this.buttonElement,  revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
            clearTimeout(leaveTimeout);

            if (revUtils.hasClass(that.buttonElement, 'eng-back')) {

                that.deactivatePanelGrids(true);

                setTimeout(function() { // let it ripple
                    updateButtonElementInnerIcon();
                    revUtils.removeClass(that.buttonElement, 'eng-back');
                }, 200);
                that.options.emitter.emitEvent('addScrollListener');
                that.panel.transition();
                return;
            }

            if (revUtils.hasClass(that.buttonContainerElement, 'visible')) {
                // revUtils.removeClass(that.buttonContainerElement, 'visible');

                if (!that.userProfileAppended) {
                    that.appendProfile();
                }

                // that.innerWidget.grid.unbindResize();
                // document.body.style.overflow = 'hidden';

                revUtils.addClass(document.body, 'profile-mask-show');

                setTimeout(function() {
                    if (revUtils.hasClass(document.body, 'animate-user-profile')) {
                        revUtils.removeClass(document.body, 'animate-user-profile');
                    } else {
                        revUtils.addClass(document.body, 'animate-user-profile');
                    }
                });
                return;
            }

            if (revUtils.hasClass(document.body, 'animate-user-profile')) {
                revUtils.removeClass(document.body, 'animate-user-profile');
                return;
            }

            setTimeout(function() { // wait for long press this.mc.on('press'
                if (!revUtils.hasClass(document.body, 'profile-mask-show')) {
                    revUtils.addClass(that.buttonContainerElement, 'visible');

                    var removeVisible = function() {
                        setTimeout(function() { // everythinks a ripple
                            revUtils.removeClass(that.buttonContainerElement, 'visible');
                        }, 200);
                        revUtils.removeEventListener(window, revDetect.mobile() ? 'touchstart' : 'scroll', removeVisible);
                    }

                    revUtils.addEventListener(window, revDetect.mobile() ? 'touchstart' : 'scroll', removeVisible);
                }
            }, 201);
        });

        // corner button menu

        this.buttonMenu = document.createElement('menu');
        this.buttonMenu.className = 'rev-button-menu';

        for (var i = 0; i < this.options.buttons.length; i++) {
            var button = document.createElement('button');
            button.className = 'menu-button menu-button-' + (this.options.authenticated && this.options.buttons[i].auth_name ? this.options.buttons[i].auth_name.toLowerCase() : this.options.buttons[i].name.toLowerCase());
            var buttonIcon = document.createElement('div');
            buttonIcon.className = 'menu-button-icon';
            var buttonWave = document.createElement('div');
            buttonWave.className = 'menu-button-wave';

            revUtils.append(button, buttonIcon);
            revUtils.append(button, buttonWave);

            Waves.attach(buttonWave, ['waves-circle']);

            revUtils.append(this.buttonMenu, button);

            this.options.buttons[i].element = button;

            var handleButton = function(button) {
                revUtils.addEventListener(button.element, revDetect.mobile() ? 'touchstart' : 'click', function(ev) {

                    if (button.auth_required && !that.options.authenticated && that.options.innerWidget.feedAuthButton) {
                        that.options.innerWidget.feedAuthButton.scrollIntoView(true);
                        return;
                    }

                    if (!that.panel) { // get the panel set at this point
                        that.panel = new EngagePanel(that.options);
                    }

                    that.deactivatePanelGrids();

                    button.options.active = true;

                    if (!button.slider) {
                        button.options = Object.assign((that.options.authenticated && button.auth_options ? button.auth_options : button.options), that.options);
                        button.options.element = that.panel.innerElement;
                        button.options.infinite_element = that.panel.innerElement;
                        button.options.infinite_container = true;
                        // HACK to avoid thrash
                        // TODO: get this out of here, this is a hack
                        var removeMe = document.querySelector('.feed-auth-button-size-remove-me');
                        if (removeMe) {
                            button.options.auth_height = removeMe.offsetHeight + 'px';
                        }
                        button.slider = new RevSlider(button.options);
                    } else {
                        that.panel.innerElement.replaceChild(button.slider.containerElement, that.panel.innerElement.firstChild);
                    }

                    setTimeout(function() {
                        that.panel.transition();
                        // revUtils.removeClass(that.buttonContainerElement, 'visible');
                        that.buttonElementInnerIcon.style.backgroundImage = null;
                        revUtils.addClass(that.buttonElement, 'eng-back');
                        // TODO get this working on a single unit
                        that.options.emitter.emitEvent('removeScrollListener');
                    });
                });

                // TODO
                // if (!revDetect.mobile()) {
                //     revUtils.addEventListener(button.element, 'mouseenter', function(ev) {
                //         clearTimeout(leaveTimeout);
                //     });

                //     revUtils.addEventListener(button.element, 'mouseleave', function(ev) {
                //         if (revUtils.hasClass(that.buttonContainerElement, 'visible')) {
                //             leaveTimeout = setTimeout(function() {
                //                 revUtils.removeClass(that.buttonContainerElement, 'visible');
                //             }, 2000);
                //         }
                //     });
                // }
            }(this.options.buttons[i]);
        }

        revUtils.append(this.buttonContainerElement, this.buttonMenu);

        // TODO
        // revUtils.addEventListener(this.buttonElement, 'mouseleave', function(ev) {
        //     if (revUtils.hasClass(that.buttonContainerElement, 'visible')) {
        //         leaveTimeout = setTimeout(function() {
        //             revUtils.removeClass(that.buttonContainerElement, 'visible');
        //         }, 2000);
        //     }
        // });
    };


    EngageCornerButton.prototype.deactivatePanelGrids = function(activateInnerWidget) {
        this.options.innerWidget.options.active = activateInnerWidget ? true : false;

        for (var i = 0; i < this.options.buttons.length; i++) {
            if (this.options.buttons[i].slider) {
                this.options.buttons[i].slider.options.active = false;
            }
        }
    }

    return EngageCornerButton;

}));