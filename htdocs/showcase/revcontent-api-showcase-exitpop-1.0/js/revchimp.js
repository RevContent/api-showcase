/**
 * RevChimp.js
 *
 * @author     Julien Chinapen <julien@revcontent.com>
 * @copyright  2015 Integraclick Inc.
 * @license    http://www.integraclick.com Integraclick License
 * @link       http://www.revcontent.com
 * @todo       Remove console.logs
 * @todo       Integrate with Gulp build process
 * @todo       Finalize CDN Endpoint for Subscription URL!
 */
(function ($, window, document, undefined) {

    var RevChimp = {
        exitMask: $('#revexitmask'),
        exitUnit: $('#revexitunit'),
        formName: 'form_revsubscriber',
        endpoints: {
            production: '/* @echo CHIMP_PROD_URL */',
            dev: '/* @echo CHIMP_DEV_URL */',
            local: 'http://localhost/rx_subscribe.php?callback=revchimpCallback'
        },
        subscription_url: '',
        apiKey: null,
        listID: null,
        email: null,
        subscriberElement: $('.revexitsubscriber:first'),
        selectElement: $("#RevChimpInputSelect"),
        inputElement: $("#RevChimpInputEmail"),
        submitElement: $("#RevChimpSubscribeButton"),
        alertElement: null,
        spinnerElement: null,
        message: "",
        serviceUnavailable: "Server endpoint unavailable, please try again later.",
        subscriber: null,
        styles: '/* inject:css *//* endinject */',
        init: function () {
            console.log("RevChimp: Initializing Revchimp");
            window.RevChimp = RevChimp;
        },
        shutdown: function(){
            console.log("RevChimp: Shutting Down! Detaching nodes and cleaning up...");
            if(typeof this.subscriber === "object"){
                this.subscriber.detach();
            }
            if( typeof $('#revtaskbar') === "object" && $('#revtaskbar').length > 0){
                $('#revtaskbar').detach();
            }
            if( typeof $('#revexit_styles_alt') === "object" && $('#revexit_styles_alt').length > 0){
                $('revexit_styles_alt').detach();
            }
        },
        configureEndpoint: function(){
            this.subscription_url = /localhost/i.test(top.location.hostname) ? this.endpoints.dev : this.endpoints.production;
            console.log("Configuring JSONP Endpoint URL ... --> " + this.subscription_url);
        },
        loadSettings: function(subscription_settings){
            console.log("RevChimp: Loading Settings: ", subscription_settings);
            this.settings = subscription_settings;
        },
        selectUI: function(parent_node){
            console.log("RevChimp: Selecting UI Theme");
            switch(this.settings.theme){
                case "tile":
                    this.tileUI(parent_node);
                break;
                case "taskbar":
                default:
                    this.taskbarUI(parent_node);
                break;
            }

        },
        render: function(subscription_settings){
            console.log("RevChimp: Rendering UI ...");
            console.log("RevChimp: Associating Parent Node: " + $("#revexitunit").attr('id'));
            var that = this;
            that.loadSettings(subscription_settings);
            that.selectUI($("#revexitunit"));
            that.renderStyles();
            that.setupBindings();
            that.setProperties();
        },
        renderStyles: function(){
            console.log("RevChimp: Injecting Stylesheets..");
            $('#revexit_styles_alt').detach();
            var styles = $('<style type="text/css" id="revexit_styles_alt" />');
            styles.html(this.styles);
            $('body').append(styles);
        },
        setProperties: function () {
            console.log("RevChimp: Setup Internal Properties");
            this.configureEndpoint();
            this.email = this.inputElement.val();
            this.apiKey = this.subscriberElement.attr("data-apikey");
            this.listID = this.subscriberElement.attr("data-listid");
            this.message = this.subscriberElement.attr("data-message");
        },
        setupBindings: function () {
            console.log("RevChimp: Setup Event Bindings");
            this.exitMask = $('#revexitmask');
            this.exitUnit = $('#revexitunit');
            this.subscriberElement = $('.revexitsubscriber:first');
            this.selectElement = $("#RevChimpInputSelect");
            this.inputElement = $("#RevChimpInputEmail");
            this.submitElement = $("#RevChimpSubscribeButton");
            this.alertElement = this.subscriberElement.find('.subscribe-alert');
            this.spinnerElement = this.subscriberElement.find('.subscribe-loader');
            this.submitElement.on('click', this.subscribe);
        },
        subscribe: function () {
            console.log("RevChimp: Subscription Request Started...");
            var that = RevChimp;
            that.setProperties();
            var subscribe_ajax = $.ajax({
                url: that.subscription_url,
                xhrFields: {
                    withCredentials: true
                },
                timeout: 15000,
                crossDomain: true,
                dataType: 'jsonp',
                jsonp: false,
                jsonpCallback: "revchimpCallback",
                type: 'post',
                data: {api_key: that.apiKey, list_id: that.listID, email: that.email},
                beforeSend: function () {
                    that.submitElement.addClass("disabled").attr({disabled: true});
                    that.spinnerElement.fadeIn(300);
                },
                success: function (subscription_response) {
                    that.spinnerElement.fadeOut(300, function () {
                        if (subscription_response.subscribed == true) {
                            console.log("RevChimp: Completed subscription....");
                            that.subscriberElement.find('.subscribe-message').fadeOut(200);
                            that.inputElement.fadeOut(200);
                            that.selectElement.fadeOut(200);
                            that.submitElement.removeClass("disabled").attr({disabled: false}).fadeOut(200);
                            that.subscriberElement.removeClass("failed").addClass("successful");
                            that.alertElement.removeClass("failed-subscription").addClass("successful-subscription").text(subscription_response.message).fadeIn(200, function(){
                                $(this).delay(5000).fadeOut(200, function(){

                                });

                                setTimeout(function(){
                                    that.subscriber.addClass("detached");
                                    that.shutdown();
                                    $('#revexitmask').removeClass("taskbar-theme");
                                    $('.revexititem').animate({margin:'4px 4px'}, 500, function(){
                                        $('#revexitheader').addClass("white-bg");
                                        $('#revexitadpanel').addClass("white-bg");
                                    });

                                }, 3000);
                            });

                        } else {
                            console.log("RevChimp: Failed subscription....");
                            that.inputElement.fadeIn(200);
                            that.selectElement.fadeIn(200);
                            that.submitElement.removeClass("disabled").attr({disabled: false});
                            that.subscriberElement.removeClass("successful").addClass("failed");
                            that.subscriberElement.find('.subscribe-alert').removeClass("successful-subscription").addClass("failed-subscription").text(subscription_response.message).fadeIn(200).delay(3000).fadeOut();
                        }
                    });
                },
                error: function (subscription_response) {
                    console.log("RevChimp: Connection failed....");
                    that.spinnerElement.fadeOut(300, function () {
                        that.inputElement.fadeIn(200);
                        that.selectElement.fadeIn(200);
                        that.submitElement.removeClass("disabled").attr({disabled: false});
                        that.subscriberElement.addClass("failed");
                        that.subscriberElement.find('.subscribe-alert').removeClass("successful-subscription").addClass("failed-subscription").text(that.serviceUnavailable).fadeIn(200).delay(3000).fadeOut();
                    });
                },
                complete: function(xhrObj){
                    console.log("RevChimp: AJAX Completed....");
                }
            });
        },
        taskbarUI: function (parent_node) {
            console.log("RevChimp: Build Taskbar UI (Affix to Bottom of Modal)...");
            var that = this;
            $('.revexitsubscriber').detach();
            if (typeof parent_node == "object") {
                console.log("RevChimp: Attaching to Parent Node..." + parent_node.id);
                $('#revexitmask').removeClass("tile-theme").addClass("taskbar-theme");
                var subscriber_taskbar = $('<div />'),
                    subscriber_form = $('<form method="post" action="' + this.subscription_url + '" name="' + this.formName + '" id="' + this.formName + '" />'),
                    subscriber_padder = $('<div />').addClass('padder'),
                    subscriber_alert = $('<div />').addClass("subscribe-alert").hide(),
                    subscriber_choice = $('<select />').attr({id: "RevChimpInputSelect"}).append(['<option>Candidate A</option>', '<option>Candidate B</option>', '<option>Candidate B</option>']),
                    subscriber_loader = $('<div />').addClass("subscribe-loader").hide().append($('<ul />').addClass("chimploader").append(['<li></li>', '<li></li>', '<li></li>'])),
                    subscriber_message = $('<div />').addClass("subscribe-message").text(this.settings.message),

                    subscriber_input = $('<input />').addClass("subscribe-input").attr({
                        'id': 'RevChimpInputEmail',
                        'name': 'RevChimpInputEmail',
                        'type': 'text',
                        'placeholder': 'E-mail Address'
                    }),
                    subscriber_button = $('<button />').addClass("subscribe-button").attr({
                        'id': 'RevChimpSubscribeButton',
                        'name': 'RevChimpSubscribeButton',
                        'type': 'button'
                    }).text("Subscribe"),
                    clearfix = $('<div />').attr('style', 'clear:both;display:block;');
                    subscriber_taskbar.attr({"id": "revtaskbar"}).addClass("revtaskbar revexitsubscriber hidden").append([subscriber_alert, subscriber_loader, subscriber_padder.append([subscriber_form.append([subscriber_message, subscriber_choice, subscriber_input, subscriber_button])], clearfix)]).attr({
                        'data-apikey': this.settings.apiKey,
                        'data-listid': this.settings.listID
                    });

                this.subscriber = subscriber_taskbar;
                parent_node.append(this.subscriber);

                setTimeout(function () {
                    that.subscriber.removeClass("hidden");
                }, 2000);
            }
        },
        tileUI: function (parent_node) {
            console.log("RevChimp: Build Tile UI (Replace Last Ad Tile)...");
            var that = this;
            var $last_item = $('#revexitunit').find(".revexititem:last");
            console.log("Last Ad Item = ", $last_item );
            var $item_card = $last_item.length > 0 ? $($last_item[0]) : undefined;
            $('.revexitsubscriber').detach();
            console.log("Attaching to Item Card: ". $item_card);
            if($item_card !==  undefined && $item_card.length > 0) {
                $('#revexitmask').removeClass("taskbar-theme").addClass("tile-theme");
                var subscriber_alert = $('<div />').addClass("subscribe-alert").hide(),
                    subscriber_loader = $('<div />').addClass("subscribe-loader").append($('<ul />').addClass("chimploader").append(['<li></li>','<li></li>','<li></li>'])),
                    //subscriber_close = $('<span />').addClass("subscribe-close"),
                    subscriber_header = $('<div />').addClass("subscribe-header").text(this.settings.headline),
                    subscriber_message = $('<div />').addClass("subscribe-message").text(this.settings.message),
                    subscriber_input = $('<input />').addClass("subscribe-input").attr({
                        'id': 'RevChimpInputEmail',
                        'type': 'text',
                        'placeholder': 'E-mail Address'
                    }),
                    subscriber_button = $('<button />').addClass("subscribe-button").attr({
                        'id': 'RevChimpSubscribeButton',
                        'type': 'button'
                    }).text("Subscribe"),
                    subscriber = $('<div />').addClass("revexitsubscriber hidden").append([subscriber_alert, subscriber_loader,/*subscriber_close,*/ subscriber_header, subscriber_message, subscriber_input, subscriber_button]).attr({
                        'data-apikey': this.settings.apiKey,
                        'data-listid': this.settings.listID
                    });

                this.subscriber = subscriber;
                $item_card.prepend(this.subscriber).children('a:first').css({'visibility': 'hidden'});

                //setTimeout(function () {
                    that.subscriber.removeClass("hidden");
                //}, 1000);
            }
        }
    };

    $(window).load(RevChimp.init);


}(jQuery, window, document));


