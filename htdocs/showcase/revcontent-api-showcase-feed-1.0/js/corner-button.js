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

        this.init();
    };

    EngageCornerButton.prototype.init = function() {
        var that = this;

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

        var updateButtonElementInnerIcon = function(reset) {
            if (reset) {
                revApi.request(that.options.host + '/api/v1/engage/profile.php?', function(data) {
                    revUtils.addClass(that.buttonElementInnerIcon, 'eng-default-profile');
                    that.buttonElementInnerIcon.style.backgroundImage = null;
                    if (data && data.profile_url) {
                        that.buttonElementInnerIcon.style.backgroundImage = 'url(' + data.profile_url + ')';
                    }
                });
            } else if (that.options.user && that.options.user.profile_url) {
                that.buttonElementInnerIcon.style.backgroundImage = 'url(' + that.options.user.profile_url + ')';
            } else {
                revUtils.addClass(that.buttonElementInnerIcon, 'eng-default-profile');
            }
        }

        // TODO get this working right
        this.options.emitter.on('updateButtonElementInnerIcon', function() {
            updateButtonElementInnerIcon(true);
        });
        // TODO: need this?
        updateButtonElementInnerIcon();

        revUtils.append(this.buttonElementInner, this.buttonElementInnerIcon);
        revUtils.append(this.buttonElementInner, this.buttonElementInnerWave);
        revUtils.append(this.buttonElement, this.buttonElementInner);
        revUtils.append(this.buttonContainerElement, this.buttonElement);

        this.buttonMenu = document.createElement('menu');
        this.buttonMenu.className = 'rev-button-menu';

        for (var i = 0; i < this.options.buttons.length; i++) {
            var button = document.createElement('button');
            button.className = 'menu-button menu-button-' + this.options.buttons[i].name.toLowerCase();
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

                    if (!that.panel) { // get the panel set at this point
                        that.panel = new EngagePanel(that.options);
                    }

                    if (!button.slider) {
                        button.options = Object.assign(button.options, that.options);
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

        Waves.attach(this.buttonElementInnerWave, ['waves-circle']);
        Waves.init();

        var userProfile = document.createElement('div');
        userProfile.id = 'rev-user-profile';

        var userProfileImage = document.createElement('div');
        userProfileImage.id = 'profile-image';

        revUtils.append(userProfile, userProfileImage);

        this.mc = new Hammer(this.buttonElement, {
            recognizers: [
                [
                    Hammer.Press,
                    {
                        time: 200
                    }
                ],
            ],
            // domEvents: true
        });

        this.mc.on('press', function(ev) {
            if (!revUtils.hasClass(document.body, 'animate-user-profile')) {

                // revUtils.removeClass(that.buttonContainerElement, 'visible'); // just in case touch was triggered and buttons visible

                if (!that.userProfileAppended) {
                    revUtils.append(document.body, userProfile);
                    revUtils.append(document.body, that.profileMask);
                    that.userProfileAppended = true;
                }

                revUtils.addClass(document.body, 'profile-mask-show');
                setTimeout(function() {
                    revUtils.addClass(document.body, 'animate-user-profile');
                });
            }
        });

        this.profileMask = document.createElement('div');
        this.profileMask.id = 'profile-mask';

        revUtils.addEventListener(this.profileMask, 'transitionend', function(ev) {
            if (ev.propertyName === 'transform') {
                if (!revUtils.hasClass(document.body, 'animate-user-profile')) {
                    revUtils.removeClass(document.body, 'profile-mask-show');
                }
            }
        });

        // TODO TBD
        // revUtils.append(document.body, userProfile);
        // revUtils.append(document.body, this.profileMask);

        if (this.options.user && this.options.user.profile_url) {
            userProfileImage.style.backgroundImage = 'url(' + this.options.user.profile_url + ')';
        } else {
            revUtils.addClass(userProfileImage, 'eng-default-profile');
        }

        revUtils.addEventListener(userProfile, revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
            ev.preventDefault();
        }, {passive: false});

        revUtils.addEventListener(this.profileMask, revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
            revUtils.removeClass(document.body, 'animate-user-profile');
        });

        var leaveTimeout;

        var buttonsVisible = function() {
            revUtils.addClass(that.buttonContainerElement, 'visible');

            var removeVisible = function() {
                setTimeout(function() { // everythinks a ripple
                    revUtils.removeClass(that.buttonContainerElement, 'visible');
                }, 200);
                revUtils.removeEventListener(window, revDetect.mobile() ? 'touchstart' : 'scroll', removeVisible);
            }

            revUtils.addEventListener(window, revDetect.mobile() ? 'touchstart' : 'scroll', removeVisible);
        }

        revUtils.addEventListener(this.buttonElement,  revDetect.mobile() ? 'touchstart' : 'click', function(ev) {
            clearTimeout(leaveTimeout);

            if (revUtils.hasClass(that.buttonElement, 'eng-back')) {
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
                    revUtils.append(document.body, userProfile);
                    revUtils.append(document.body, that.profileMask);
                    that.userProfileAppended = true;
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
                    buttonsVisible();
                }
            }, 201);
        });

        // TODO
        // revUtils.addEventListener(this.buttonElement, 'mouseleave', function(ev) {
        //     if (revUtils.hasClass(that.buttonContainerElement, 'visible')) {
        //         leaveTimeout = setTimeout(function() {
        //             revUtils.removeClass(that.buttonContainerElement, 'visible');
        //         }, 2000);
        //     }
        // });

        revUtils.append(document.body, this.buttonContainerElement);
    };

    return EngageCornerButton;

}));