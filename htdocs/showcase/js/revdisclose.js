/**
 * RevDisclose (Branding + Disclosure Options)
 *
 */

(function (window, document, dialog, undefined) {
    'use strict';
    var RevDisclose = function () {
        var self = this;
        self.dialog = dialog;
        self.plainText = false;
        self.disclosureText = null;
        self.disclosureHtml = '';
        self.defaultDisclosureText = 'Sponsored by Revcontent';
        self.disclosureTextLimit = 50;
        self.onClickHandler = false;
        self.onClickHandlerObject = null;
        self.defaultOnClick = function () {

        };
        self.hooks = [];
        self.init();
    };

    RevDisclose.prototype.init = function () {
        var self = this;
        document.onreadystatechange = function () {
            if (document.readyState == "complete") {

            }
        }
    };

    RevDisclose.prototype.setEmitter = function(emitter) {
        this.emitter = emitter;
    }

    RevDisclose.prototype.setDialog = function(dialog){
        var self = this;
        if(typeof dialog === "object"){
            self.dialog = dialog;
        }
    };

    RevDisclose.prototype.truncateDisclosure = function () {
        var self = this;
        self.disclosureText = self.disclosureText.toString().substring(0, self.disclosureTextLimit).replace(/['"]+/g, '');
    };

    RevDisclose.prototype.setDisclosureText = function(disclosure){
        var self = this;
        self.disclosureText = (disclosure.length > 1) ? disclosure.toString() : self.defaultDisclosureText;
        self.truncateDisclosure();
    };

    RevDisclose.prototype.setOnClickHandler = function (handler, handlerObject) {
        var self = this;
        if (typeof handler === 'function') {
            self.onClickHandler = handler;
        }
        if (typeof handlerObject === 'object') {
            self.onClickHandlerObject = handlerObject;
        }
    };

    RevDisclose.prototype.getSponsorTemplate = function () {
        var self = this;
        self.disclosureHtml = '<a href="javascript:;" onclick="revDisclose.onClickHandler(revDisclose.onClickHandlerObject ? revDisclose.onClickHandlerObject : null);">' + self.disclosureText + '</a>';
        return self.plainText ? self.disclosureText : self.disclosureHtml;
    };

    RevDisclose.prototype.setGrid = function (grid) {
        this.grid = grid;
    };

    RevDisclose.prototype.postMessage = function() {
        this.dialog.postMessage();
    };

    RevDisclose.prototype.getDisclosure = function (disclosureText, dialogOptions) {
        var self = this;
        self.setDisclosureText(disclosureText);

        if (this.emitter) {
            self.dialog.emitter = this.emitter;
        }

        if (typeof dialogOptions === 'object') {
            if (dialogOptions.aboutSrc) {
                self.dialog.aboutSrc = dialogOptions.aboutSrc;
            }
            if (dialogOptions.aboutHeight) {
                self.dialog.aboutHeight = dialogOptions.aboutHeight;
            }
            if (dialogOptions.interestSrc) {
                self.dialog.interestSrc = dialogOptions.interestSrc;
            }
            if (dialogOptions.interestHeight) {
                self.dialog.interestHeight = dialogOptions.interestHeight;
            }
            if (dialogOptions.widget_id) {
                self.dialog.widget_id = dialogOptions.widget_id;
            }
            if (dialogOptions.pub_id) {
                self.dialog.pub_id = dialogOptions.pub_id;
            }
        }

        if(typeof self.dialog === "object") {
            if (this.grid) {
                self.dialog.grid = this.grid;
            }
            self.setOnClickHandler(self.dialog.showDialog, self.dialog);
        } else {
            self.setOnClickHandler(self.defaultOnClick);
        }
        return self.getSponsorTemplate();
    };

    RevDisclose.prototype.getProviderTemplate = function(className, styles){
        var self = this;
        var providerHtml = '<div class="' + (className ? className.toString() : '') + '" style="' + (styles ? styles.toString() : '') + '"></div>';
        return providerHtml;
    };

    RevDisclose.prototype.getProvider = function(className, styles) {
        var self = this;
        return self.getProviderTemplate(className, styles);
    };

    window.revDisclose = new RevDisclose();

    return window.revDisclose;

}(window, document, window.revDialog));