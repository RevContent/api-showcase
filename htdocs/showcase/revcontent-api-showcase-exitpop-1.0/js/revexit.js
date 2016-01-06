/**
 /$$$$$$$                       /$$$$$$$$           /$$   /$$
 | $$__  $$                     | $$_____/          |__/  | $$
 | $$  \ $$  /$$$$$$  /$$    /$$| $$       /$$   /$$ /$$ /$$$$$$
 | $$$$$$$/ /$$__  $$|  $$  /$$/| $$$$$   |  $$ /$$/| $$|_  $$_/
 | $$__  $$| $$$$$$$$ \  $$/$$/ | $$__/    \  $$$$/ | $$  | $$
 | $$  \ $$| $$_____/  \  $$$/  | $$        >$$  $$ | $$  | $$ /$$
 | $$  | $$|  $$$$$$$   \  $/   | $$$$$$$$ /$$/\  $$| $$  |  $$$$/
 |__/  |__/ \_______/    \_/    |________/|__/  \__/|__/   \___/

 Project: RevExit
 Version: 2
 Author: chris@revcontent.com

 Query String Parameters:
 w = widget id
 p = publisher id
 k = api key
 d = domain
 t = testing (set value to true to always pop onload, no cookie check!) default is false
 i = internal (none, rndm, top, btm, or all) default is none, internal ads will have provider labels attached, set to "all" for internal only
 s = change api end point server, ex: s=trends-stg.revcontent.com, default is production (trends.revcontent.com)
 x = "both" or "true", default is "both", can also can be set to "mobileonly" or "mobile" if enabled will pop on mobile/tablet after "z" seconds of inactivity, for Desktop only use "desktop" or "false"
 z = inactivity trigger duration in seconds, defaults to 6 seconds if not provided, minimum of 6 seconds allowed
 j = background mode, defaults to "default", options are "classic", "default" OR custom RGBA OR Hexadecimal color OR a handful of HTML color names (red, blue etc.)
 ps = Panel Size, choices are "3x2" or "4x2" defaults to 4x2, NOTE: for HD modes only!
 ml = "Mailing List" Feature, multi-key parameter for Mailchimp Integration, ml=API_KEY;LIST_ID;HEADLINE;MESSAGE;BUTTON;THEME;CHOICES, default = disabled, THEME options are "taskbar" or "tile", CHOICES is comma separated list of options.
 ch = "Closed Hours", The interval at which RevExit will remain closed for. Defaults to 24 Hours or 1-day if not provided.
 r = "Regions" or zones that RevExit will trigger once departed, default = "all", can be set to "top", "bottom", "left" or "right". Combinations are also accepted, ex. "left,right"

 **/
(function(j,q,u,e,r,y,R,o,x){try{o=jQuery;if(o&&(!R||(R&&o.fn.jquery==R))){x=true}}catch(er){}if(!x||(R&&o.fn.jquery!=R)){(q=j.createElement(q)).type='text/javascript';if(r){q.async=true}q.src='//ajax.googleapis.com/ajax/libs/jquery/'+(R||1)+'/jquery.min.js';u=j.getElementsByTagName(u)[0];q.onload=q.onreadystatechange=(function(){if(!e&&(!this.readyState||this.readyState=='loaded'||this.readyState=='complete')){e=true;x=jQuery;jQuery.noConflict(true)(function(){y(x)});q.onload=q.onreadystatechange=null;u.removeChild(q)}});u.appendChild(q)}else{y(o)}})(document,'script','head',false,false,(function($){$(function(){

    $(document).ready(function() {

        revcontentInit({"fastclick":{enabled: true}});

        $(document).on("click","#revexitcloseme, #revexitmask",function(e){
            var target_el = e.relatedTarget ? e.relatedTarget : (e.toElement ? e.toElement : e.target);
            if(typeof target_el == "object" && (target_el.id == "revexitcloseme" || target_el.id == "revexitmask")) {
                $('#revexitmask').hide().detach();
                $('#revexitunit').hide().detach();
                $('.revexitmaskwrap').hide().detach();
                $('.revexitunitwrap').hide().detach();
                $('#revexit_style').detach();
                $('body.revexit-open').css({'overflow-y': 'inherit', 'height': 'auto'}).removeClass("revexit-open");
                $('html').css({'overflow-y': 'visible'}).removeClass("revexit-open");
                var viewport_meta = $('meta[name="viewport"]:first-of-type');
                if(viewport_meta.length === 1) {
                    viewport_meta.attr({
                        'content': viewport_meta.attr('data-originalcontent')
                    });
                }
            }
        });

        //get the api vars from the script tag
        var revcontentexiturl = document.getElementById('rev2exit').src,
            revcontentexitvars = [], revcontentexithash,
            revcontentexithashes = revcontentexiturl.slice(revcontentexiturl.indexOf('?') + 1).split('&');

        for (var i = 0; i < revcontentexithashes.length; i++) {
            revcontentexithash = revcontentexithashes[i].split('=');
            revcontentexitvars.push(revcontentexithash[0]);
            revcontentexitvars[revcontentexithash[0]] = revcontentexithash[1];
        }

        // Closed Hours
        if(revcontentexitvars.ch === undefined || isNaN(revcontentexitvars.ch)) {
            revcontentexitvars.ch = 24;
        } else if(revcontentexitvars.ch < 1) {
            revcontentexitvars.ch = 24;
        }

        // Exit Regions
        var exit_regions = ["all"];
        if(revcontentexitvars.r === undefined) {
            revcontentexitvars.r = "all";
        } else if(revcontentexitvars.r.length === 0){
            revcontentexitvars.r = "all";
        } else {
            exit_regions = revcontentexitvars.r.split(",");
        }

        // Setup Exit Mode
        var exitMode = "desktop";
        switch(revcontentexitvars.x) {
            case "mobile":
            case "mobileonly":
                exitMode = "mobile";
                break;
            case "both":
            case "true":
                exitMode = "desktop+mobile";
                break;
            case undefined:
            case "false":
            case "desktop":
            case "default":
                exitMode = "desktop";
                break;
        }

        // Mailing List Feature
        var enableSubscriptions = false;
        if(revcontentexitvars.ml !== undefined){
            enableSubscriptions = true;
        }

        $('body').attr({'data-revexitmode': exitMode });
        var userHasRevcontent = revcontentGetCookie("revcontentapibeforego_" + revcontentexitvars.w);
        var revExitMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        var revExitIPhone = /iPhone|Android|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        var revExitIPad = /iPad/i.test(navigator.userAgent);

        if (userHasRevcontent != "" && revcontentexitvars.t != "true") {
            $('body').attr({'data-revexit': 'expired'});
        } else {
            var exit_expired = $('body').attr('data-revexit') == 'expired' ? true : false;
            if (false == exit_expired && revExitMobile == false && exitMode != "mobileonly" && (exitMode == "desktop" || exitMode == "desktop+mobile")) {
                //console.log("event1");
                revcontentAddEvent(document, "mouseout", function(e) {
                    e = e ? e : window.event;
                    var revcontentfrom = e.relatedTarget || e.toElement;
                    var mouse_x = e.clientX;
                    var mouse_y = e.clientY;
                    var viewport_dimensions = {width: $(window).width(), height: $(window).height()};

                    var fire_rx = false;

                    // Exit on ALL regions
                    if(exit_regions.indexOf("all") !== -1) {
                        if (mouse_x <= 0 || (mouse_x >= viewport_dimensions.width) || mouse_y <= 0 || mouse_y >= viewport_dimensions.height) {
                            console.log("Exiting from ALL zones");
                            fire_rx = true;
                        }
                    }

                    // Exit on TOP
                    if(exit_regions.indexOf("all") === -1 && exit_regions.indexOf("top") !== -1) {
                        if (mouse_y <= 0 && mouse_y < viewport_dimensions.height) {
                            console.log("Exiting from TOP zone");
                            fire_rx = true;
                        }
                    }

                    // Exit on LEFT
                    if(exit_regions.indexOf("all") === -1 && exit_regions.indexOf("left") !== -1) {
                        if (mouse_x <= 0 && mouse_x < viewport_dimensions.width) {
                            console.log("Exiting from LEFT zone");
                            fire_rx = true;
                        }
                    }

                    // Exit on BOTTOM
                    if(exit_regions.indexOf("all") === -1 && exit_regions.indexOf("bottom") !== -1) {
                        if (mouse_y > 0 && mouse_y >= viewport_dimensions.height) {
                            console.log("Exiting from BOTTOM zone");
                            fire_rx = true;
                        }
                    }

                    // Exit on RIGHT
                    if(exit_regions.indexOf("all") === -1 && exit_regions.indexOf("right") !== -1) {
                        if (mouse_x > 0 && mouse_x >= viewport_dimensions.width) {
                            console.log("Exiting from RIGHT zone");
                            fire_rx = true;
                        }
                    }

                    if(true === fire_rx){
                        if ($('body').attr('data-revexit') === undefined || revcontentexitvars.t == "true") {
                            revcontentExecute(revcontentexitvars, revExitMobile, revExitIPhone, revExitIPad, enableSubscriptions);
                        }
                    }

                });
            } else if (false === exit_expired && revExitMobile == true && exitMode != "desktop" && (exitMode == "desktop+mobile" || exitMode == "mobileonly" || exitMode == "mobile")) {
                //console.log("event2");
                var idleTimer = null;
                var idleState = false;
                var idleWait  = ((revcontentexitvars.z !== undefined && parseInt(revcontentexitvars.z, 10) >= 6) ? parseInt(revcontentexitvars.z, 10) * 1000 : 6000);

                $('*').bind('mousemove keydown scroll touchmove', function () {

                    clearTimeout(idleTimer);
                    idleState = false;

                    idleTimer = setTimeout(function () {
                        revcontentExecute(revcontentexitvars, revExitMobile, revExitIPhone, revExitIPad, enableSubscriptions);
                        idleState = true;
                    }, idleWait);
                });

                $("body").trigger("mousemove touchmove");
            }
        }

        // Initialize RevDialog (OPT-Out feature)
        if(typeof RevDialog === "function") {
            window.revDialog = new RevDialog();
        }

    });

    function revcontentInitChimpanzee(subscription_settings){
        if(window.RevChimp !== undefined){
            if(typeof window.RevChimp.render === "function" && !$("#revexitunit").hasClass("chimp-initialized")) {
                window.RevChimp.render(subscription_settings);
            }
        }
    }

    function revcontentDetachChimpanzee(){
        if(window.RevChimp !== undefined){
            if(typeof window.RevChimp.shutdown === "function") {
                window.RevChimp.shutdown();
            }
        }
    }

    function revcontentInit(modules){
        if(!modules){ modules = {}; }
        if(modules["fastclick"] !== undefined && modules["fastclick"].enabled === true) {
            if (typeof FastClick === "function" && 'addEventListener' in document) {
                document.addEventListener('DOMContentLoaded', function() {
                    FastClick.attach(document.body);
                }, false);
            }
        }
    }

    function revcontentAddEvent(obj, evt, fn) {

        if (obj.addEventListener) {
            obj.addEventListener(evt, fn, false);
        }
        else if (obj.attachEvent) {
            obj.attachEvent("on" + evt, fn);
        }

    }

    function revcontentSetCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        var cpath = "; path=/; domain=" + top.location.host;
        document.cookie = cname + "=" + cvalue + "; " + expires + cpath;
        $('body').attr({'data-revexit': "expired"});
    }

    function revcontentGetCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }

    function revcontentExtractRandom(arr) {
        var index = Math.floor(Math.random() * arr.length);
        var result = arr[index];

        arr.splice(index, 1);
        return(result);
    }

    function revcontentBGControl(revcontentexitvars, revExitMobile, revExitIPhone, revExitIPad){
        // Setup BG Control
        var backgroundMode = "default";
        var backgroundMask = "rgba(0,0,0,0.75)";
        var backgroundUnit = "rgba(255,255,255,0.85)";
        var backgroundCustom = revcontentexitvars.j;
        var bgPatternRgba = /^rgba\(([0-255]){1,3}\,([0-255]){1,3}\,([0-255]){1,3}\,(0|1)?(\.)?([1-999]){0,4}?\)/i;
        var bgPatternHex = /^#[a-f0-9]{3,6}/i;
        var bgPatternNames = /(gold|deepskyblue|aqua|aquamarine|darkorange|lightgreen|tomato|silver|blue|green|red|orange|yellow|cyan|pink|purple|magenta|teal|white|black|dodgerblue|seagreen|darkseagreen|gray|ivory|khaki|royalblue)/i;
        switch(revcontentexitvars.j) {
            case "classic":
            backgroundMask = "rgba(255,255,255,1)";
            backgroundUnit = "rgba(255,255,255,1)";
            break;
            case "default":
            backgroundMask = "rgba(0,0,0,0.75)";
            backgroundUnit = "rgba(255,255,255,0.85)";
            break;
        }

        if(bgPatternRgba.test(backgroundCustom) || bgPatternHex.test(backgroundCustom) || bgPatternNames.test(backgroundCustom)){
            backgroundMask = backgroundCustom;
        }

        $(document).ready(function(){
            $('#revexitmask').css({'background-color': backgroundMask});
            $('#revexitunit').css({'background-color': backgroundUnit});
        });
    }

    function revcontentSetupViewport(revExitMobile, revExitIPhone, revExitIPad, revcontentexitvars){
        if(!revExitMobile){ revExitMobile = false; }
        if(!revExitIPhone){ revExitIPhone   = false;   }
        if(!revExitIPad)  { revExitIPad   = false;   }
        if(!revcontentexitvars) { revcontentexitvars = false; }
        var revPanelSize = revcontentexitvars ? revcontentexitvars.ps : "4x2";

        var enableSubscriptions = false;
        if(revcontentexitvars.ml !== undefined){
            enableSubscriptions = true;
            var default_headline = "Get Daily News";
            var default_message =  "Enter your e-mail to get started.";
            var default_theme = "taskbar";
            var default_button = "subscribe";
            var default_choices = "";
            var subscription_settings = {apiKey: null, listID: null, headline: default_headline, message: default_message, button: default_button, theme: default_theme, choices: default_choices };
            var extracted_settings = revcontentexitvars.ml.split(";");
            subscription_settings.apiKey = extracted_settings[0] !== undefined && extracted_settings[0].length > 0 ? extracted_settings[0] : null;
            subscription_settings.listID = extracted_settings[1] !== undefined && extracted_settings[1].length > 0 ? extracted_settings[1] : null;
            subscription_settings.headline = extracted_settings[2] !== undefined &&  extracted_settings[2].length > 0 ? decodeURI(extracted_settings[2]) : default_headline;
            subscription_settings.message = extracted_settings[3] !== undefined &&  extracted_settings[3].length > 0 ? decodeURI(extracted_settings[3]) : default_message;
            subscription_settings.button = extracted_settings[4] !== undefined &&  extracted_settings[4].length > 0 ? decodeURI(extracted_settings[4]).toLowerCase() : default_button;
            subscription_settings.theme = extracted_settings[5] !== undefined &&  extracted_settings[5].length > 0 ? decodeURI(extracted_settings[5]).toLowerCase() : default_theme;
            subscription_settings.choices = extracted_settings[6] !== undefined &&  extracted_settings[6].length > 0 ? decodeURI(extracted_settings[6]) : default_choices;


        }

        var $mask_n_wrap   = $('#revexitmask, #revexitunit');
        var $exit_mask     = $('#revexitmask');
        var $exit_wrap     = $('#revexitunit');
        var $ad_items      = $exit_wrap.find('.revexititem');
        var $total_height  = parseInt(($($ad_items[0]).height() * $ad_items.length), 10);
        var $wrap_height   = ($exit_wrap.height() > 0 ? $exit_wrap.height() : 1024);
        var viewport_meta  = $('meta[name="viewport"]:first-of-type');
        var viewport_width = parseInt($(window).width(), 10);

        if(viewport_meta.length === 1) {
            var vpm_initial   = viewport_meta.attr('content');
            viewport_meta.attr({
                'data-originalcontent': vpm_initial,
                'content': 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0'
            });
        }

        $('html,body').addClass("revexit-open");
        $exit_mask.removeClass("modal-hd modal-lg modal-md modal-sm fullscreen");
        $exit_wrap.scrollTop(0);

        if(true === revExitMobile){
            $('html.revexit-open').css({'overflow-y': 'hidden'/*, '-webkit-overflow-scrolling': 'none'*/});
            $('body.revexit-open').css({'overflow-y': 'hidden', 'height': $wrap_height/*, '-webkit-overflow-scrolling': 'none'*/});
            $mask_n_wrap.css({'overflow-y': 'hidden', 'height': $wrap_height, 'position': 'fixed'/*, '-webkit-overflow-scrolling': 'none'*/});
            $exit_wrap.css({'overflow-y': 'scroll'});
            $exit_mask.addClass("modal-mobile");
            if(true === revExitIPhone) {
                $wrap_height = '100%' || 480;
                $exit_mask.addClass("modal-phone");
            }
            else if (true === revExitIPad) {
                $wrap_height = '100%' || 768;
                $exit_mask.addClass("modal-tablet");
                $('#revexitsponsor').css({'padding': '0 0 0 18px', 'color':'rgba(0,0,0,0.5)', 'margin':'0 0 !important', 'position':'absolute', 'top': 0, 'right': '80px', 'display':'inline-block', 'width': 'auto','text-align': 'right', 'max-width': $('#revexitunit').width() + 'px'});

            } else {
                $wrap_height = $total_height;
            }
            $exit_mask.css({'height': '100%', 'position': 'fixed',/*'z-index': '10000',*/ 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch'});
            $exit_wrap.css({'height': $wrap_height, 'position': 'relative', /*'z-index': '11000',*/ '-webkit-overflow-scrolling': 'touch'});
            //$('body.revexit-open > div:not(".revexitunitwrap, .revexitmaskwrap")').css({'height':0, 'overflow':'hidden'});
            //console.log("Mobile / Tablet case!");
        }
        else if(false === revExitMobile && (viewport_width > 768) && (viewport_width <= 1024)) {
            $('body.revexit-open').css({'overflow-y': 'hidden', 'height': $wrap_height});
            $mask_n_wrap.css({'height': $wrap_height, 'position': 'fixed'});
            $exit_mask.css({'overflow-y': 'hidden', 'height': '100%'/*,'padding': '0 36px 0 0'*/}).addClass("modal-lg");
            $exit_wrap.css({'position': 'static', /*'padding': '18px',*/ 'height': $(window).height() - (0.12 * $(window).height()), 'width': '80%' /*$('#revexitadpanel').innerWidth()*/});
            //console.log("Large Desktop case >= 768 & <= 992");
            var spnsr_mrgns = (100 * ((($(window).width() - $('#revexitunit').width()) / 2) / $(window).width())) || 5;    
            $('#revexitsponsor').css({'padding': '0 0 0 18px', 'color':'rgba(0,0,0,0.5)', 'margin':'0 0 !important', 'position':'absolute', 'top': '11px', 'right': '40px', 'display':'inline-block', 'width': 'auto','text-align': 'right', 'max-width': $('#revexitunit').width() + 'px'});
        }
        else if(false === revExitMobile && (viewport_width > 480) && (viewport_width <= 768)) {
            $('body.revexit-open').css({'overflow-y': 'hidden', 'height': $wrap_height});
            $mask_n_wrap.css({'height': $wrap_height, 'position': 'fixed'});
            $exit_mask.css({'overflow-y': 'hidden', 'height': '100%'/*,'padding': '0 36px 0 0'*/}).addClass("modal-md");
            $exit_wrap.css({'overflow-y': 'scroll', 'position': 'static', /*'padding': '18px',*/ 'height': $(window).height() - (0.12 * $(window).height()), 'width': '80%' /*$('#revexitadpanel').innerWidth()*/});
            //console.log("Desktop case >= 480 & <= 768");
            $('#revexitsponsor').css({'padding': '0 0 0 18px', 'color':'rgba(0,0,0,0.5)', 'margin':'0 0 !important', 'position':'absolute', 'top': '1.85em', 'right': '0px', 'left': '0px', 'left': '0px', 'display':'inline-block', 'width': 'auto','text-align': 'left', 'max-width': $('#revexitunit').width() + 'px'});
        }
        else if(false === revExitMobile && viewport_width <= 480) {
            $('body.revexit-open').css({'overflow-y': 'hidden', 'height': $wrap_height});
            $mask_n_wrap.css({'height': $wrap_height, 'position': 'fixed'});
            $exit_mask.css({'overflow-y': 'hidden', 'height': '100%'/*,'padding': '0 36px 0 0'*/}).addClass("modal-sm");
            $exit_wrap.css({'overflow-y': 'scroll', 'position': 'static'/*, 'padding': '18px'*/, 'height': '80%', 'width': '80%'});
            //console.log("Small Desktop case <= 480");
            $('#revexitsponsor').css({'padding': '0 0 0 18px', 'color':'rgba(0,0,0,0.5)', 'margin':'0 0 !important', 'position':'absolute', 'top': '1.55em', 'right': '0px', 'left': '0px', 'left': '0px', 'display':'inline-block', 'width': 'auto','text-align': 'left', 'max-width': $('#revexitunit').width() + 'px'});
        }
        else if(false === revExitMobile && viewport_width >= 1024) {
            $('body.revexit-open').css({'overflow': 'hidden', 'height': '100%'});
            $exit_mask.css({'height': '100%', 'position': 'fixed', 'overflow': 'hidden'}).addClass("modal-hd");
            $exit_wrap.css({'position': 'static', 'overflow': 'hidden', 'height': 'auto', 'width': $('#revexitadpanel').innerWidth() || 992 });
            //console.log("HD Desktop case");
            var spnsr_mrgns = (100 * ((($(window).width() - $('#revexitunit').width()) / 2) / $(window).width())) || 5;    
            //$('#revexitsponsor').css({'text-shadow':'0 0 2px rgba(30,30,30, 0.8)', 'border': '0', 'margin':'0 ' + spnsr_mrgns + '%' ,'position':'fixed','top':'4%','left':0,'display':'block','width': $('#revexitunit').width(),'text-align': 'right','max-width': $('#revexitunit').width() + 'px'});    
            $('#revexitsponsor').css({'padding': '0 18px 0 0', 'color':'rgba(0,0,0,0.5)', 'margin': '0', 'margin':'0 0 !important', 'position':'absolute', 'top': '11px', 'right': '50px', 'display':'inline-block', 'width': 'auto','text-align': 'right', 'max-width': $('#revexitunit').width() + 'px'});
            if(false === enableSubscriptions && (($exit_wrap.outerHeight() + ($(window).height() * 0.10)) > $(window).height())) {
                $exit_mask.addClass('fullscreen');
            }
            switch(revPanelSize) {
                case "3x2":
                    $exit_mask.addClass("panel-3x2");
                    break;
                case "4x2":
                case "default":
                    break;
            }
        }
        else {
            $('body.revexit-open').css({'overflow-y': 'hidden', 'height': '100%'});
            $mask_n_wrap.css({'height': '100%', 'position': 'fixed', 'overflow': 'hidden'});
            //console.log("ELSE VIEWPORT case!");
            $('#revexitsponsor').attr({'style':''});
        }

        $('#revexitunit').fadeIn(400);
        $( ".revexititem .revexitheadline" ).slideDown( "slow" );
        if($(window).innerWidth() >= $(window).innerHeight()) {
            $('#revexitmask').attr({'data-orientation': 'landscape'});
        } else {
            $('#revexitmask').attr({'data-orientation': 'portrait'});
        }

        if(!$exit_mask.hasClass('modal-mobile') && !$exit_mask.hasClass('modal-phone') && !$exit_mask.hasClass('modal-tablet')) {
            $('#revexitunit, .revexitunitwrap').css({'box-sizing':'content-box'});
            $('#revexitunit > *, #revexitunit > *:before, #revexitunit > *:after').css({'box-sizing':'inherit'});
        }

        if(true === enableSubscriptions && $exit_mask.hasClass("modal-hd")){
            revcontentInitChimpanzee(subscription_settings);
        } else {
            revcontentDetachChimpanzee();
        }
    }

    function revcontentExecute(revcontentexitvars, revExitMobile, revExitIPhone, revExitIPad, enableSubscriptions) {
        if($('body').hasClass('revexit-open')){ return; }
        if(!revExitMobile){ revExitMobile = false; }
        if(!revExitIPhone){ revExitIPhone = false; }
        if(!revExitIPad){ revExitIPad = false; }
        if(!enableSubscriptions){ enableSubscriptions = false; }

        // exit on expired exit (except for test mode) ...
        var exit_expired = $('body').attr('data-revexit') == 'expired' ? true : false;
        if(true === exit_expired && revcontentexitvars.t != "true") { return; }

        //make revcontent api call first
        var revcontentexitendpoint = 'https://trends.revcontent.com/api/v1/?', sponsored_count = 8, internal_count = 0;

        if (revcontentexitvars.i == "btm" || revcontentexitvars.i == "top") {
            sponsored_count = 4;
            internal_count = 4;
        } else if (revcontentexitvars.i == "rndm") {
            internal_count = Math.floor(Math.random() * 4) + 1  ;
            sponsored_count = 8 - internal_count;
        } else if (revcontentexitvars.i == "all") {
            internal_count = 8;
            sponsored_count = 0;
        }

        if (typeof revcontentexitvars.s !== "undefined" && revcontentexitvars.s != "" && revcontentexitvars.s != null) {
            revcontentexitendpoint = 'https://'+revcontentexitvars.s+'/api/v1/?';
        }

        // Ad Bypass for "Tile" UI Theme
        var subscriber_theme = "taskbar";
        if(true === enableSubscriptions && revcontentexitvars.ml !== undefined) {
            var ml_vars = revcontentexitvars.ml.split(";");
            subscriber_theme = ml_vars[4] !== undefined ? ml_vars[4].toLowerCase() : "taskbar";
            if(subscriber_theme === "tile"){
                if(internal_count === 8) {
                    internal_count--;
                } else {
                    sponsored_count--;
                }
            }

        }

        var revcontentexitdata = {
            'api_key' : revcontentexitvars.k,
            'pub_id' : revcontentexitvars.p,
            'widget_id' : revcontentexitvars.w,
            'domain' : revcontentexitvars.d,
            'sponsored_count' : sponsored_count,
            'internal_count' : internal_count,
            'img_h':   274,
            'img_w': 239,
            'api_source': 'exit'
        };

        var clientCall = $.getJSON(revcontentexitendpoint, revcontentexitdata, function(revcontentexitdata) {
            var styles_panel3x2 = " #revexitmask.modal-hd.panel-3x2 #revexititem_3{margin-right:1%}#revexitmask.modal-hd.panel-3x2 .revexititem{width:32%}#revexitmask.modal-hd.panel-3x2 #revexititem_6,#revexitmask.modal-hd.panel-3x2 #revexititem_7{display:none} ";
            var styles_hd = " #revexitmask.modal-hd {background-color: rgba(0,0,0,0.75)} #revexitmask.modal-hd > #revexitunit.revexitunitwrap {position:static;width: auto;height:auto;/*min-height:600px;*/background:rgba(255,255,255,0.95);margin:5% auto;padding: 0 36px;overflow:hidden;box-shadow: 0px 1px 5px rgba(100,100,100,0,3);-moz-box-shadow: 0px 1px 5px rgba(100,100,100,0,3); } #revexitmask.modal-hd #revexitunit #revexitheader {font-size: 25px;height:45px;line-height:45px} ";
            var styles_lg = " #revexitmask.modal-lg {background-color: rgba(0,0,0,0.75)} #revexitmask.modal-lg #revexitunit {position:static;width: auto;height:auto;/*min-height:480px;*/background:rgba(255,255,255,0.95);margin:5% auto!important;padding: 0 36px 0 0!important;overflow:hidden;box-shadow: 0px 1px 5px rgba(100,100,100,0,3);-moz-box-shadow: 0px 1px 5px rgba(100,100,100,0,3); } #revexitmask.modal-lg #revexitunit #revexitadpanel {padding: 18px!important} #revexitmask.modal-lg #revexitunit #revexitheader {font-size: 22px;padding-left: 18px;} ";
            var styles_md = " #revexitmask.modal-md {background-color: rgba(0,0,0,0.75)} #revexitmask.modal-md #revexitunit {position:static;width: auto;height:auto;/*min-height:480px;*/background:rgba(255,255,255,0.95);margin:5% auto!important;padding: 0 36px 0 0!important;overflow:hidden;box-shadow: 0px 1px 5px rgba(100,100,100,0,3);-moz-box-shadow: 0px 1px 5px rgba(100,100,100,0,3); } #revexitmask.modal-md #revexitunit #revexitadpanel {padding: 18px!important} #revexitmask.modal-md #revexitunit #revexitheader {font-size: 18px;padding-left: 18px;} ";
            var styles_sm = " #revexitmask.modal-sm {background-color: rgba(0,0,0,0.75)} #revexitmask.modal-sm #revexitunit {position:static;width: auto;height:auto;/*min-height:480px;*/background:rgba(255,255,255,0.95);margin:5% auto!important;padding: 0 36px 0 0!important;overflow:hidden;box-shadow: 0px 1px 5px rgba(100,100,100,0,3);-moz-box-shadow: 0px 1px 5px rgba(100,100,100,0,3); } #revexitmask.modal-sm #revexitunit #revexitadpanel {padding: 18px!important} #revexitmask.modal-sm #revexitunit #revexitheader {padding-top: 5px; font-size: 14px;padding-left: 18px;height:20px!important;line-height:20px!important}  #revexitmask.modal-sm #revexitcloseme {right: 0;margin: 10px -10px 0 5px;background-size:contain;width:14px;height:14px} ";
            var styles_mobile = " #revexitmask.modal-mobile #revexitunit #revexitheader {transform:all 0.5s ease;} #revexitmask.modal-mobile #revexitunit {width:90%;} #revexitmask.modal-mobile #revexitcloseme {margin-right: 0;margin-top:0;background-size:contain;width:14px;height:14px} #revexitmask.modal-mobile #revexitadpanel {margin-top:10px;clear:both;} ";
            var styles_tablet = " #revexitmask.modal-tablet {background: rgba(0,0,0,0.5);} #revexitmask.modal-tablet #revexitheader {padding: 0 0 0 18px;} #revexitmask.modal-tablet #revexitheader #revexitcloseme {margin-right: 30px} #revexitmask.modal-tablet #revexitunit {margin:0;width:100%;background-color:rgba(255,255,255,0.82);overflow-x:hidden} ";
            var styles_phone = " #revexitmask.modal-phone[data-orientation=\"landscape\"] #revexitheader.docked #revexitcloseme {margin-right: 15px;} body.revheader-docked #revexitmask.modal-phone #revexitadpanel {margin-top:52px;} #revexitmask.modal-phone[data-orientation=\"landscape\"] #revexitunit #revexitheader {padding: 2px 0 0 10px;} #revexitmask.modal-phone[data-orientation=\"landscape\"] #revexitunit #revexitheader  > span.rxlabel {font-size:17px;max-width:80%;line-height:160%} #revexitmask.modal-phone #revexitheader.docked #revexitsponsor em {display:block} #revexitmask.modal-phone #revexitheader #revexitsponsor {display:none;font-size:8px} #revexitmask.modal-phone #revexitheader #revexitsponsor em {display:none}  #revexitmask.modal-phone #revexitunit > #revexitheader.docked > span.rxlabel {font-size: inherit; max-width:100%;} #revexitmask.modal-phone #revexitheader.docked #revexitcloseme {margin-top: 18px;margin-right:5px} #revexitmask.modal-phone #revexitheader #revexitcloseme {margin-top: 5px;margin-right:11px} #revexitmask.modal-phone #revexitunit #revexitheader {line-height:140%;font-size: 10px;padding: 7px 0 0 10px;height:auto;font-weight:bold} #revexitmask.modal-phone #revexitunit #revexitheader > span.rxlabel {display:inline-block;font-size:14px;max-width:55%} #revexitmask.modal-phone #revexitunit #revexitsponsor {float:right;clear:both;display: inline-block;clear:both; padding: 0 0;opacity:1;margin-right:12px;margin-top:17px} #revexitmask.modal-phone #revexitunit #revexitheader.docked #revexitsponsor {opacity:0;display:none} ";
            var styles_dock_header = " #revexitheader.docked #revexitcloseme {width:11px;height:11px;background-size:contain;margin-top:15px;margin-right:0;right:40px} #revexitunit > #revexitheader.docked {overflow:hidden;font-size: 12px;padding: 0 0 0 10px;margin:4% 0 0 0;z-index:2147483620;position:fixed;width:100%;display:block;top:0;left: 0px;text-indent: 4%;background-color:rgba(255,255,255,0.95);height:42px!important;line-height:42px!important;box-shadow: 0 3px 20px -5px rgba(0,0,0,0.6);-webkit-box-shadow: 0 3px 20px -5px rgba(0,0,0,0.6);-moz-box-shadow: 0 3px 20px -5px rgba(0,0,0,0.6);-o-box-shadow: 0 3px 20px -5px rgba(0,0,0,0.6);} ";
            var styles_fullscreen = " body.revexit-open > #revexitmask.fullscreen > #revexitunit {width:100%!important;max-width: 992px;height:88%!important;margin:3% auto!important;padding:0 2%!important;background:rgba(255,255,255,0.85)} body.revexit-open > #revexitmask.fullscreen > #revexitunit > #revexitheader {margin: 10px auto;max-width:992px} body.revexit-open > #revexitmask.fullscreen > #revexitunit .revexititem {height: 40%} body.revexit-open > #revexitmask.fullscreen > #revexitunit .revexititem .revexitheadline {font-size: 17px}  body.revexit-open > #revexitmask.fullscreen > #revexitunit .revexititem .revexitheadlinewrap {height: 90%} ";
            var styles_boxdefense = " .revexititemmask *, .revexititemmask *::after, .revexititemmask *::before { box-sizing: content-box; } ";
            var styles_injected = " /* inject:css *//* endinject */ ";
            var revpayload1 = "", revpayload = [], internalArray = [], sponsoredArray = [], revstyle = "body.revexit-open{padding:0!important;margin:0!important;overflow:hidden;width:100%;height:100%;-webkit-overflow-scrolling: touch;}body.revexit-open > #revexitunit,body.revexit-open > .revexitunitwrap {min-height:100%;height: auto}#revexitmask,#revexitunit{top:0;width:100%;position:fixed;left:0}#revexitheader{position:relative;} #revexitsponsor {font-family:Arial,Tahoma,Helvetica,sans-serif;font-weight:normal!important;line-height: 18px;font-size: 12px;color:#737373;text-decoration:none!important;text-transform:none!important;} #revexitsponsor > span {text-transform:none!important} #revexitheader,.revexitheadline{font-family:Montserrat,Helvetica,sans-serif;text-transform:uppercase}#revexit,.revexitheadline{position:absolute;cursor:pointer}#revexitmask{height:100%;background:rgba(0,0,0,0.8);z-index:2147483600}#revexitunit{height:750px;background-color:#fff;display:block;z-index:2147483600;margin:5% auto;overflow-y:scroll;overflow-x:hidden} .revexitprovider{margin-top:4px;color:#ffffff;opacity:0.75;text-decoration:none;display:block;clear:both;font-size: 11px;text-align:left;} #revexitheader{color:#202526;display:block;/*font-size:26px;*/font-weight:400;/*height:42px;line-height:42px;*/text-align:left;margin:2% 0 0 0;-webkit-font-smoothing:antialiased}#revexitadpanel{height:100%;top:0;width:992px;margin:16px auto;position:relative}.revexititem{display:block;float:left;cursor:pointer;width:239px;height:274px;margin-right:12px;margin-bottom:20px}#revexititem_3,#revexititem_7{margin-right:0}.revexititem .revexititemmask{width:100%;height:100%;background-image:url(data:image/png;base64,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);background-position-y:274px;background-size:cover}.revexititem .revexititemmask:hover{background-image:none;background-color:rgba(88,86,214,.5);transition:all .6s ease-in-out}.revexitheadlinewrap{width:214px;padding:13px;height:244px;position:relative}.revexititem .revexititemmask:hover .revexitheadline{bottom:10px;transition:all .4s ease}.revexitheadline{line-height:24px;color:#fff;font-size:20px;font-weight:700;text-align:left;display:none;bottom:5px;word-wrap:break-word;width:218px}.revexitimgholder{width:100%;height:100%;background-size:cover}#revexitsponsor{font-size:10px;font-family:arial;text-decoration:none} #revexitcloseme{cursor:pointer;position:absolute;z-index:2147483601;display:block;margin-top:10px;top:0;right:0;width:20px;height:20px;text-decoration:none!important;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAOdJREFUeNq0lMEKwjAMhrPsRfTgfKYJDm/D5/EwdhiMHewz6cUXUWYiEWR26T/QwE+zpXxNy99mq01xIqKjqBfVt+vlQQtiXWxzGVrRQdRkArxLklv9LKpQqMEG0c5+Pdg6e4cWBpu4FKbRK7C2zmDoDEwZNdv2KhTqwF5HpR0SCk3B9CMbxxFa3XIX9gV0oMHG0oNFgQ6UUjANjs3+ONMQKQfPq0w/Dk74rIyUS8+nDJ5fmGx/1qcMmnZvSpqfUdOi5mf0BqA3Sp8vCIbeZ7bHEYYlOm3/8sA2moi6JbBJp50xmqcAAwCU66Sx7jStPgAAAABJRU5ErkJggg==);opacity:.2}#revexitcloseme:hover{opacity:1;transition:all .6s ease-in-out}@media only screen and (max-width :320px){#revexitheader{/*font-size:14px!important;height:16px!important;line-height:16px!important*/}#revexitadpanel{width:100%!important}.revexititem{display:block;float:left;cursor:pointer;width:96%!important;height:274px;margin:2% 2% 0}.revexititem .revexititemmask{background-position-y:330px}#revexitunit{height:2228px}#revexitsponsor{/*top:2386px!important;width:100%;left:0;padding-bottom: 40px; margin-bottom: 40px;*/ }#revexitcloseme{/*right:13px!important*/}}@media only screen and (max-width :480px){#revexitheader{/*font-size:16px!important;height:16px!important;line-height:16px!important*/}.revexititem .revexititemmask{background-position-y:330px}#revexitadpanel{width:100%!important; }.revexititem{display:block;float:left;cursor:pointer;width:96%!important;height:274px;margin:0 2% 2%}#revexitsponsor{/*top:2386px!important;width:100%;left:0; padding-bottom: 40px; margin-bottom: 40px;*/}#revexitsponsor span {/*top: -20px; position: relative;*/}#revexitcloseme{/*right:13px!important*/}}@media only screen and (max-width :1004px){#revexitadpanel{width:754px}#revexititem_3,#revexititem_7{margin-right:12px}#revexititem_0{width:488px}#revexititem_0 .revexitheadline,#revexititem_0 .revexitheadlinewrap{width:400px}#revexitunit{height:950px}.revexititem{margin-bottom:14px} #revexitsponsor{/*top:935px;width:100%;left:0*/}}@media only screen and (max-width :747px){#revexititem_0{width:239px}#revexititem_0 .revexitheadline,#revexititem_0 .revexitheadlinewrap{width:218px}#revexitadpanel{width:490px}#revexititem_1,#revexititem_3,#revexititem_5,#revexititem_7{margin-right:0}#revexitheader{/*font-size:23px*/}#revexitcloseme{right:1px}#revexitsponsor{/*top:1235px;width:100%;left:0;padding-bottom: 40px; margin-bottom: 40px;*/}}@media only screen and (min-device-width : 320px) and (max-device-width : 480px) and (orientation : portrait) { #revexitheader{/*font-size:12px!important*/}}@media only screen and (min-device-width : 320px) and (max-device-width : 480px) and (orientation : landscape) { #revexitheader{/*font-size:12px!important*/}}" +  ' ' + styles_hd + ' ' + styles_lg + ' ' + styles_md + ' ' + styles_sm + ' ' + styles_mobile+ ' ' + styles_tablet + ' ' + styles_phone + ' ' + styles_dock_header + ' ' + styles_fullscreen + ' ' + styles_boxdefense;
            revstyle += (' ' + styles_injected + ' ');
            //seperate types
            for (i = 0; i < revcontentexitdata.length; i++) {
                if (revcontentexitdata[i].type == "internal") {
                    internalArray.push(revcontentexitdata[i]);
                } else {
                    sponsoredArray.push(revcontentexitdata[i]);
                }
            }

            //fun with sortin
            if (revcontentexitvars.i == "btm" ) {
                revpayload = sponsoredArray.concat(internalArray);
            } else if (revcontentexitvars.i == "top") {
                revpayload = internalArray.concat(sponsoredArray);
            } else if (revcontentexitvars.i == "rndm") {
                while (internalArray.length || sponsoredArray.length) {
                    if (sponsoredArray.length) {
                        revpayload.push(revcontentExtractRandom(sponsoredArray));
                    }
                    if (internalArray.length){
                        revpayload.push(revcontentExtractRandom(internalArray));
                    }
                }
            } else if (revcontentexitvars.i == "all") {
                while (internalArray.length) {
                    revpayload.push(revcontentExtractRandom(internalArray));
                }
            } else {
                revpayload = sponsoredArray;
            }

            // Pseudo-tile for Mailing List Feature: "Tile Theme"
            if(subscriber_theme === "tile" && true === enableSubscriptions && typeof revcontentexitvars.ml !== undefined) {
                var fake_payload = {
                    headline: "",
                    url: "#",
                    image: "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=",
                    brand: "RevContent",
                    type: "sponsored",
                    uid: null
                }
                revpayload.push(fake_payload);
            }

            for (i = 0; i < revpayload.length; i++) {
                revpayload1 = revpayload1 + "<div class='revexititem' id='revexititem_"+i+"'><a rel='nofollow' title='"+revpayload[i].headline+"' href='"+revpayload[i].url+"' target='_blank'><div class='revexitimgholder' style='background-image: url(http:"+ revpayload[i].image +");'><div class='revexititemmask'><div class='revexitheadlinewrap'><div class='revexitheadline'>"+ revpayload[i].headline + ((revpayload[i].type.toLowerCase() === 'internal') ? "<span class='revexitprovider'>" + revpayload[i].brand + "</span>" : "") + "</div></div></div></div></a></div>";
            }

            var revexit_package = "<style id='revexit_style'>" + revstyle + styles_panel3x2 + "</style><div id='revexitmask' class='revexitmaskwrap'><div id='revexitunit' class='revexitunitwrap' style='display:none;'><div id='revexitheader'><span href='#' id='revexitcloseme'></span><span class='rxlabel'>BEFORE YOU GO, CHECK OUT MORE</span> <a href='javascript:;' rel='nofollow' id='revexitsponsor' onclick='revDialog.showDialog();'><span>Sponsored <em class='sponsor-noshow' style='font-style:normal!important'>By Revcontent</em></span></a></div><div id='revexitadpanel'>"+revpayload1+"<div style='clear:both;display:block;'></div></div></div>";
            $('#revexitmask, #revexitunit, .revexitmaskwrap, .revexitunitwrap, #revexit_style').detach();

            if(true === revExitIPhone) {
                $(revexit_package).prependTo('body');
            } else {
                $("body").append(function() {
                    $('#revexitmask, #revexitunit, .revexitmaskwrap, .revexitunitwrap, #revexit_style').detach();
                    return revexit_package;
                });
            }

            $("html, body").animate({ scrollTop: 0 }, "fast");
            revcontentBGControl(revcontentexitvars, revExitMobile, revExitIPhone, revExitIPad);

            //$( "#revexitunit" ).fadeIn( "slow", function() {
                revcontentSetupViewport(revExitMobile, revExitIPhone, revExitIPad, revcontentexitvars);
                $(window).on('resize', function(){
                   if($('body').hasClass('revexit-open')){
                       clearTimeout(viewportSetupTimeout);
                       var viewportSetupTimeout = setTimeout(function(){
                           revcontentSetupViewport(revExitMobile, revExitIPhone, revExitIPad, revcontentexitvars);
                       }, 900);
                   }
                });
                if($('#revexitmask').hasClass('modal-mobile') && !$('#revexitmask').hasClass('modal-tablet')){
                    $('#revexitunit').on('touchstart', function(ev){
                       var rvx_hdr = $(ev.target).closest('#revexitheader');
                       if(rvx_hdr.length === 0 && parseInt($('#revexitunit').scrollTop(), 10) > 48){ $('#revexitheader').hide(); }
                    });

                    $('#revexitunit').on('touchend', function(){
                        var dockInterval = setInterval(function(){
                            var current_pos = $('#revexitunit').scrollTop();
                            setTimeout(function(){
                                var rxunit_pos = parseInt($('#revexitunit').scrollTop(), 10);
                                if(rxunit_pos >= 48 && current_pos === parseInt($('#revexitunit').scrollTop(), 10)) {
                                    $('#revexitheader').addClass('docked');
                                    $('body').addClass('revheader-docked');
                                    if($('#revexitheader').css('display') == 'none'){
                                        $('#revexitheader').dequeue().fadeIn(800);
                                    }
                                } else if(rxunit_pos < 48) {
                                    $('#revexitheader').removeClass('docked');
                                    $('body').removeClass('revheader-docked');
                                    $('#revexitheader').dequeue().fadeIn(800);
                                } else {

                                }
                            }, 900);

                            clearInterval(this);

                        }, 4000);
                    });
                }
            //});

        });

        revcontentSetCookie("revcontentapibeforego_" + revcontentexitvars.w, 1, revcontentexitvars.ch/24);
    }

})}),'2.1.4');