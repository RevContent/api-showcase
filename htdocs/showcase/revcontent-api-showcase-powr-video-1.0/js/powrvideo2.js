					  /*
 Project: PowrVideo
 Version: 1
 Author: harsh@revcontent.com
 */

// universal module definition
( function( window, factory ) {
    // browser global
    window.PowrVideo = factory(window, window.revUtils, window.revApi);

}( window, function factory(window, revUtils, revApi) {

    var PowrInitialized = false;

    var PowrVideo = function(config) {
        this.config = config;
        if (!this.config.floatSettings) {
            this.config.floatSettings = {
                style : "bottom-right",
                margin : 12,
                header : 0,
                width : 400,
                headerId : null
            };
        }
	this.inIFrame = false;
	if (this.config.hasOwnProperty("iframe_id")) {
	    this.inIFrame = true;
	}
        this.fixedHeight = -1;
        this.element = document.getElementById(this.config.id);

        this.playerId = "content_video";
        if (config.playerId) {
            this.playerId = config.playerId;
        }
        this.viewed = false;
        this.playerWidth = this.element.clientWidth;
	if (this.config.fluid) {
            this.playerHeight = document.body.clientHeight;
	} else {
	    this.playerHeight = 0.5625 * this.playerWidth;
	}

        this.element.setAttribute("style", "width: 100%; height : " + parseInt(this.playerHeight) + "px; background-color : #EFEFEF;");

        this.videos = config.videos;
        this.currentContent = 0;

        this.options = {
            id : this.playerId,
            nativeControlForTouch: false
        };

        if (config.hasOwnProperty('preloaded') && config.preloaded) {
            this.setup();
        } else {
            this.init();
        }
    };

    PowrVideo.prototype.getAdTag = function(videoId) {
        return "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=" + this.config.tag + "&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1"
            + "&cust_params=p_width%3D" + parseInt(this.playerWidth) + "%26p_height%3D" + parseInt(this.playerHeight)
            + "&description_url=" + encodeURI("http://alpha.powr.com/video/" + videoId);
    };

    PowrVideo.prototype.init = function() {
        this.emitter = new EvEmitter();

        if (PowrInitialized) {
            this.setup();
            return;
        }

        revUtils.appendStyle('/* inject:css */@charset "UTF-8";.rd-loading,.video-js .vjs-big-play-button:before,.video-js .vjs-control,.video-js .vjs-control:before,.vjs-menu li,.vjs-no-js{text-align:center}#rev-opt-out{display:none;z-index:2147483641}#rev-opt-out .rd-box-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;opacity:.5;filter:alpha(opacity=50);z-index:2147483641}#rev-opt-out .rd-vertical-offset{position:fixed;display:table-cell;top:0;width:100%;z-index:2147483642}#rev-opt-out .rd-box{position:absolute;vertical-align:middle;background-color:#fff;min-width:290px;max-width:500px;width:90%;margin:10px auto;border-radius:10px}#rev-opt-out.rev-interest-dialog .rd-box{max-width:1024px}#rev-opt-out .rd-modal-content{-webkit-overflow-scrolling:touch;overflow-y:auto;line-height:0;box-sizing:content-box}#rev-opt-out .rd-close-button{position:absolute;cursor:pointer;top:-15px!important;right:-15px!important;-webkit-transform:scale(.7)!important;transform:scale(.7)!important;transition:all .2s ease-in-out!important;width:35px!important;height:35px;border:1px solid #777;box-shadow:0 0 5px 0 rgba(0,0,0,.75);background:#efefef;border-radius:50%}#rev-opt-out .rd-close-button svg{fill:#bdbdbd;height:28px;width:28px;top:50%;position:absolute;margin-top:-14px;left:50%;margin-left:-14px}#rev-opt-out .rd-close-button:hover{-webkit-transform:scale(1)!important;transform:scale(1)!important}@-webkit-keyframes blink{0%,100%{opacity:.2}20%{opacity:1}}@keyframes blink{0%,100%{opacity:.2}20%{opacity:1}}.rd-loading{color:#00cb43;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:18px;line-height:22px;position:absolute;top:50%;width:100%;margin-top:-11px;margin-bottom:0}.video-js,.vjs-no-js{color:#fff;background-color:#000}.video-js .vjs-big-play-button,.video-js .vjs-captions-button,.video-js .vjs-chapters-button,.video-js .vjs-control.vjs-close-button,.video-js .vjs-fullscreen-control,.video-js .vjs-mouse-display,.video-js .vjs-mute-control,.video-js .vjs-mute-control.vjs-vol-0,.video-js .vjs-mute-control.vjs-vol-1,.video-js .vjs-mute-control.vjs-vol-2,.video-js .vjs-play-control,.video-js .vjs-play-control.vjs-playing,.video-js .vjs-play-progress,.video-js .vjs-subtitles-button,.video-js .vjs-volume-level,.video-js .vjs-volume-menu-button,.video-js .vjs-volume-menu-button.vjs-vol-0,.video-js .vjs-volume-menu-button.vjs-vol-1,.video-js .vjs-volume-menu-button.vjs-vol-2,.video-js.vjs-fullscreen .vjs-fullscreen-control,.vjs-icon-audio-description,.vjs-icon-cancel,.vjs-icon-captions,.vjs-icon-chapters,.vjs-icon-circle,.vjs-icon-circle-inner-circle,.vjs-icon-circle-outline,.vjs-icon-cog,.vjs-icon-facebook,.vjs-icon-fullscreen-enter,.vjs-icon-fullscreen-exit,.vjs-icon-gplus,.vjs-icon-hd,.vjs-icon-linkedin,.vjs-icon-pause,.vjs-icon-pinterest,.vjs-icon-play,.vjs-icon-play-circle,.vjs-icon-replay,.vjs-icon-spinner,.vjs-icon-square,.vjs-icon-subtitles,.vjs-icon-tumblr,.vjs-icon-twitter,.vjs-icon-volume-high,.vjs-icon-volume-low,.vjs-icon-volume-mid,.vjs-icon-volume-mute{font-family:VideoJS;font-weight:400;font-style:normal}.rd-loading span{-webkit-animation-name:blink;animation-name:blink;-webkit-animation-duration:1.4s;animation-duration:1.4s;-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite;-webkit-animation-fill-mode:both;animation-fill-mode:both}.rd-loading span:nth-child(2){-webkit-animation-delay:.2s;animation-delay:.2s}.rd-loading span:nth-child(3){-webkit-animation-delay:.4s;animation-delay:.4s}.video-js .vjs-big-play-button:before,.video-js .vjs-control:before,.video-js .vjs-modal-dialog,.vjs-modal-dialog .vjs-modal-dialog-content{position:absolute;top:0;left:0;width:100%;height:100%}@font-face{font-family:VideoJS;src:url(font/VideoJS.eot?#iefix) format("eot")}@font-face{font-family:VideoJS;src:url(data:application/font-woff;charset=utf-8;base64,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) format("woff"),url(data:application/x-font-ttf;charset=utf-8;base64,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ATcuAScjBh8BHgEXDgEFMz8BFTMRIwYDJRUnAxyEzZRbCA2rgketCAEBqlRoCglxYwF+IiEOIysBAkswHQEECiQ0AgE+YyIhDiIsAQJLMB4BBQokNAE/YyIhDiIsAQJLMB4BBQokNAEBPvmD7kHhqs0s0gEnjgHJAv0FD2a9gIrADwUFAwPDAlVMZ3MF/pUHwgc1HTyWV325PgsJED+oY3G9TAc1HTyWV325PgsJED+oY3G9TAc1HTyWV325PgsJED+oY3G9UmQBZQMMR/61g/kBAAAAAAAQAMYAAQAAAAAAAQAHAAAAAQAAAAAAAgAHAAcAAQAAAAAAAwAHAA4AAQAAAAAABAAHABUAAQAAAAAABQALABwAAQAAAAAABgAHACcAAQAAAAAACgArAC4AAQAAAAAACwATAFkAAwABBAkAAQAOAGwAAwABBAkAAgAOAHoAAwABBAkAAwAOAIgAAwABBAkABAAOAJYAAwABBAkABQAWAKQAAwABBAkABgAOALoAAwABBAkACgBWAMgAAwABBAkACwAmAR5WaWRlb0pTUmVndWxhclZpZGVvSlNWaWRlb0pTVmVyc2lvbiAxLjBWaWRlb0pTR2VuZXJhdGVkIGJ5IHN2ZzJ0dGYgZnJvbSBGb250ZWxsbyBwcm9qZWN0Lmh0dHA6Ly9mb250ZWxsby5jb20AVgBpAGQAZQBvAEoAUwBSAGUAZwB1AGwAYQByAFYAaQBkAGUAbwBKAFMAVgBpAGQAZQBvAEoAUwBWAGUAcgBzAGkAbwBuACAAMQAuADAAVgBpAGQAZQBvAEoAUwBHAGUAbgBlAHIAYQB0AGUAZAAgAGIAeQAgAHMAdgBnADIAdAB0AGYAIABmAHIAbwBtACAARgBvAG4AdABlAGwAbABvACAAcAByAG8AagBlAGMAdAAuAGgAdAB0AHAAOgAvAC8AZgBvAG4AdABlAGwAbABvAC4AYwBvAG0AAAACAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAECAQMBBAEFAQYBBwEIAQkBCgELAQwBDQEOAQ8BEAERARIBEwEUARUBFgEXARgBGQEaARsBHAEdAR4EcGxheQtwbGF5LWNpcmNsZQVwYXVzZQt2b2x1bWUtbXV0ZQp2b2x1bWUtbG93CnZvbHVtZS1taWQLdm9sdW1lLWhpZ2gQZnVsbHNjcmVlbi1lbnRlcg9mdWxsc2NyZWVuLWV4aXQGc3F1YXJlB3NwaW5uZXIJc3VidGl0bGVzCGNhcHRpb25zCGNoYXB0ZXJzBXNoYXJlA2NvZwZjaXJjbGUOY2lyY2xlLW91dGxpbmUTY2lyY2xlLWlubmVyLWNpcmNsZQJoZAZjYW5jZWwGcmVwbGF5CGZhY2Vib29rBWdwbHVzCGxpbmtlZGluB3R3aXR0ZXIGdHVtYmxyCXBpbnRlcmVzdBFhdWRpby1kZXNjcmlwdGlvbgAAAAAA) format("truetype");font-weight:400;font-style:normal}.video-js .vjs-big-play-button:before,.video-js .vjs-play-control:before,.vjs-icon-play:before{content:""}.vjs-icon-play-circle:before{content:""}.video-js .vjs-play-control.vjs-playing:before,.vjs-icon-pause:before{content:""}.video-js .vjs-mute-control.vjs-vol-0:before,.video-js .vjs-volume-menu-button.vjs-vol-0:before,.vjs-icon-volume-mute:before{content:""}.video-js .vjs-mute-control.vjs-vol-1:before,.video-js .vjs-volume-menu-button.vjs-vol-1:before,.vjs-icon-volume-low:before{content:""}.video-js .vjs-mute-control.vjs-vol-2:before,.video-js .vjs-volume-menu-button.vjs-vol-2:before,.vjs-icon-volume-mid:before{content:""}.video-js .vjs-mute-control:before,.video-js .vjs-volume-menu-button:before,.vjs-icon-volume-high:before{content:""}.video-js .vjs-fullscreen-control:before,.vjs-icon-fullscreen-enter:before{content:""}.video-js.vjs-fullscreen .vjs-fullscreen-control:before,.vjs-icon-fullscreen-exit:before{content:""}.vjs-icon-square:before{content:""}.vjs-icon-spinner:before{content:""}.video-js .vjs-subtitles-button:before,.vjs-icon-subtitles:before{content:""}.video-js .vjs-captions-button:before,.vjs-icon-captions:before{content:""}.video-js .vjs-chapters-button:before,.vjs-icon-chapters:before{content:""}.vjs-icon-share{font-family:VideoJS;font-weight:400;font-style:normal}.vjs-icon-share:before{content:""}.vjs-icon-cog:before{content:""}.video-js .vjs-mouse-display:before,.video-js .vjs-play-progress:before,.video-js .vjs-volume-level:before,.vjs-icon-circle:before{content:""}.vjs-icon-circle-outline:before{content:""}.vjs-icon-circle-inner-circle:before{content:""}.vjs-icon-hd:before{content:""}.video-js .vjs-control.vjs-close-button:before,.vjs-icon-cancel:before{content:""}.vjs-icon-replay:before{content:""}.vjs-icon-facebook:before{content:""}.vjs-icon-gplus:before{content:""}.vjs-icon-linkedin:before{content:""}.vjs-icon-twitter:before{content:""}.vjs-icon-tumblr:before{content:""}.vjs-icon-pinterest:before{content:""}.vjs-icon-audio-description:before{content:""}.video-js{display:block;vertical-align:top;box-sizing:border-box;position:relative;padding:0;font-size:10px;line-height:1;font-weight:400;font-style:normal;font-family:Arial,Helvetica,sans-serif;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.video-js:-moz-full-screen{position:absolute}.video-js:-webkit-full-screen{width:100%!important;height:100%!important}.video-js .vjs-tech,.video-js.vjs-fill{width:100%;height:100%}.video-js *,.video-js :after,.video-js :before{box-sizing:inherit}.video-js ul{font-family:inherit;font-size:inherit;line-height:inherit;list-style-position:outside;margin:0}.video-js.vjs-16-9,.video-js.vjs-4-3,.video-js.vjs-fluid{width:100%;max-width:100%;height:0}.video-js.vjs-16-9{padding-top:56.25%}.video-js.vjs-4-3{padding-top:75%}.video-js .vjs-tech{position:absolute;top:0;left:0}body.vjs-full-window{padding:0;margin:0;height:100%;overflow-y:auto}.vjs-full-window .video-js.vjs-fullscreen{position:fixed;overflow:hidden;z-index:1000;left:0;top:0;bottom:0;right:0}.video-js.vjs-fullscreen{width:100%!important;height:100%!important;padding-top:0!important}.video-js.vjs-fullscreen.vjs-user-inactive{cursor:none}.vjs-hidden{display:none!important}.video-js .vjs-offscreen{height:1px;left:-9999px;position:absolute;top:0;width:1px}.vjs-lock-showing{display:block!important;opacity:1;visibility:visible}.vjs-no-js{padding:20px;font-size:18px;font-family:Arial,Helvetica,sans-serif;width:300px;height:150px;margin:0 auto}.vjs-no-js a,.vjs-no-js a:visited{color:#66A8CC}.video-js .vjs-big-play-button{font-size:3em;line-height:1.5em;height:1.5em;width:3em;display:block;position:absolute;top:10px;left:10px;padding:0;cursor:pointer;opacity:1;border:.06666em solid #fff;background-color:#2B333F;background-color:rgba(43,51,63,.7);border-radius:.3em;transition:all .4s}.vjs-big-play-centered .vjs-big-play-button{top:50%;left:50%;margin-top:-.75em;margin-left:-1.5em}.video-js .vjs-big-play-button:focus,.video-js:hover .vjs-big-play-button{outline:0;border-color:#fff;background-color:#73859f;background-color:rgba(115,133,159,.5);transition:all 0s}.vjs-controls-disabled .vjs-big-play-button,.vjs-error .vjs-big-play-button,.vjs-has-started .vjs-big-play-button,.vjs-using-native-controls .vjs-big-play-button{display:none}.video-js button{background:0 0;border:none;color:inherit;display:inline-block;overflow:visible;font-size:inherit;line-height:inherit;text-transform:none;text-decoration:none;transition:none;-webkit-appearance:none;-moz-appearance:none;appearance:none}.video-js .vjs-control.vjs-close-button{cursor:pointer;height:3em;position:absolute;right:0;top:.5em;z-index:2}.vjs-menu-button{cursor:pointer}.vjs-menu .vjs-menu-content{display:block;padding:0;margin:0;overflow:auto}.vjs-scrubbing .vjs-menu-button:hover .vjs-menu{display:none}.vjs-menu li{list-style:none;margin:0;padding:.2em 0;line-height:1.4em;font-size:1.2em;text-transform:lowercase}.vjs-menu li:focus,.vjs-menu li:hover{outline:0;background-color:#73859f;background-color:rgba(115,133,159,.5)}.vjs-menu li.vjs-selected,.vjs-menu li.vjs-selected:focus,.vjs-menu li.vjs-selected:hover{background-color:#fff;color:#2B333F}.vjs-menu li.vjs-menu-title{text-align:center;text-transform:uppercase;font-size:1em;line-height:2em;padding:0;margin:0 0 .3em;font-weight:700;cursor:default}.vjs-menu-button-popup .vjs-menu{display:none;position:absolute;bottom:0;width:10em;left:-3em;height:0;margin-bottom:1.5em;border-top-color:rgba(43,51,63,.7)}.vjs-menu-button-popup .vjs-menu .vjs-menu-content{background-color:#2B333F;background-color:rgba(43,51,63,.7);position:absolute;width:100%;bottom:1.5em;max-height:15em}.vjs-menu-button-popup .vjs-menu.vjs-lock-showing,.vjs-menu-button-popup:hover .vjs-menu{display:block}.video-js .vjs-menu-button-inline{transition:all .4s;overflow:hidden}.video-js .vjs-menu-button-inline:before{width:2.222222222em}.video-js .vjs-menu-button-inline.vjs-slider-active,.video-js .vjs-menu-button-inline:focus,.video-js .vjs-menu-button-inline:hover,.video-js.vjs-no-flex .vjs-menu-button-inline{width:12em}.video-js .vjs-menu-button-inline.vjs-slider-active{transition:none}.vjs-menu-button-inline .vjs-menu{opacity:0;height:100%;width:auto;position:absolute;left:2.2222222em;top:0;padding:0;margin:0;transition:all .4s}.vjs-menu-button-inline.vjs-slider-active .vjs-menu,.vjs-menu-button-inline:focus .vjs-menu,.vjs-menu-button-inline:hover .vjs-menu{display:block;opacity:1}.vjs-no-flex .vjs-menu-button-inline .vjs-menu{display:block;opacity:1;position:relative;width:auto}.vjs-no-flex .vjs-menu-button-inline.vjs-slider-active .vjs-menu,.vjs-no-flex .vjs-menu-button-inline:focus .vjs-menu,.vjs-no-flex .vjs-menu-button-inline:hover .vjs-menu{width:auto}.vjs-menu-button-inline .vjs-menu-content{width:auto;height:100%;margin:0;overflow:hidden}.video-js .vjs-control-bar{display:none;width:100%;position:absolute;bottom:0;left:0;right:0;height:3em;background-color:#2B333F;background-color:rgba(43,51,63,.7)}.vjs-has-started .vjs-control-bar{display:-webkit-box;display:flex;visibility:visible;opacity:1;transition:visibility .1s,opacity .1s}.vjs-has-started.vjs-user-inactive.vjs-playing .vjs-control-bar{visibility:hidden;opacity:0;transition:visibility 1s,opacity 1s}.vjs-controls-disabled .vjs-control-bar,.vjs-error .vjs-control-bar,.vjs-using-native-controls .vjs-control-bar{display:none!important}.vjs-audio.vjs-has-started.vjs-user-inactive.vjs-playing .vjs-control-bar{opacity:1;visibility:visible}@media �screen{.vjs-user-inactive.vjs-playing .vjs-control-bar :before{content:""}}.vjs-has-started.vjs-no-flex .vjs-control-bar{display:table}.video-js .vjs-control{outline:0;position:relative;margin:0;padding:0;height:100%;width:4em;-webkit-box-flex:none;flex:none}.video-js .vjs-control:before{font-size:1.8em;line-height:1.67}.video-js .vjs-control:focus,.video-js .vjs-control:focus:before,.video-js .vjs-control:hover:before{text-shadow:0 0 1em #fff}.video-js .vjs-control-text{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}.vjs-no-flex .vjs-control{display:table-cell;vertical-align:middle}.video-js .vjs-custom-control-spacer{display:none}.video-js .vjs-progress-control{-webkit-box-flex:auto;flex:auto;display:-webkit-box;display:flex;-webkit-box-align:center;align-items:center}.vjs-live .vjs-progress-control{display:none}.video-js .vjs-progress-holder{-webkit-box-flex:auto;flex:auto;transition:all .2s;height:.3em}.video-js .vjs-progress-control:hover .vjs-progress-holder{font-size:1.666666666666666666em}.video-js .vjs-progress-control:hover .vjs-mouse-display:after,.video-js .vjs-progress-control:hover .vjs-play-progress:after{display:block;font-size:.6em}.video-js .vjs-progress-holder .vjs-load-progress,.video-js .vjs-progress-holder .vjs-load-progress div,.video-js .vjs-progress-holder .vjs-play-progress{position:absolute;display:block;height:.3em;margin:0;padding:0;width:0;left:0;top:0}.video-js .vjs-mouse-display:before{display:none}.video-js .vjs-play-progress{background-color:#fff}.video-js .vjs-play-progress:before{position:absolute;top:-.333333333333333em;right:-.5em;font-size:.9em}.video-js .vjs-mouse-display:after,.video-js .vjs-play-progress:after{display:none;position:absolute;top:-2.4em;right:-1.5em;font-size:.9em;color:#000;content:attr(data-current-time);padding:.2em .5em;background-color:#fff;background-color:rgba(255,255,255,.8);border-radius:.3em}.video-js .vjs-play-progress:after,.video-js .vjs-play-progress:before{z-index:1}.video-js .vjs-load-progress{background:ligthen(#73859f,25%);background:rgba(115,133,159,.5)}.video-js .vjs-load-progress div{background:ligthen(#73859f,50%);background:rgba(115,133,159,.75)}.video-js.vjs-no-flex .vjs-progress-control{width:auto}.video-js .vjs-progress-control .vjs-mouse-display{display:none;position:absolute;width:1px;height:100%;background-color:#000;z-index:1}.vjs-no-flex .vjs-progress-control .vjs-mouse-display{z-index:0}.video-js .vjs-progress-control:hover .vjs-mouse-display{display:block}.video-js.vjs-user-inactive .vjs-progress-control .vjs-mouse-display,.video-js.vjs-user-inactive .vjs-progress-control .vjs-mouse-display:after{visibility:hidden;opacity:0;transition:visibility 1s,opacity 1s}.video-js.vjs-user-inactive.vjs-no-flex .vjs-progress-control .vjs-mouse-display,.video-js.vjs-user-inactive.vjs-no-flex .vjs-progress-control .vjs-mouse-display:after{display:none}.video-js .vjs-progress-control .vjs-mouse-display:after{color:#fff;background-color:#000;background-color:rgba(0,0,0,.8)}.video-js .vjs-slider{outline:0;position:relative;cursor:pointer;padding:0;margin:0 .45em;background-color:#73859f;background-color:rgba(115,133,159,.5)}.video-js .vjs-slider:focus{text-shadow:0 0 1em #fff;box-shadow:0 0 1em #fff}.video-js .vjs-mute-control,.video-js .vjs-volume-menu-button{cursor:pointer;-webkit-box-flex:none;flex:none}.video-js .vjs-volume-control{width:5em;-webkit-box-flex:none;flex:none;display:-webkit-box;display:flex;-webkit-box-align:center;align-items:center}.video-js .vjs-volume-bar{margin:1.35em}.vjs-volume-bar.vjs-slider-horizontal{width:5em;height:.3em}.vjs-volume-bar.vjs-slider-vertical{width:.3em;height:5em}.video-js .vjs-volume-level{position:absolute;bottom:0;left:0;background-color:#fff}.video-js .vjs-volume-level:before{position:absolute;font-size:.9em}.vjs-slider-vertical .vjs-volume-level{width:.3em}.vjs-slider-vertical .vjs-volume-level:before{top:-.5em;left:-.3em}.vjs-slider-horizontal .vjs-volume-level{height:.3em}.vjs-slider-horizontal .vjs-volume-level:before{top:-.3em;right:-.5em}.vjs-volume-bar.vjs-slider-vertical .vjs-volume-level{height:100%}.vjs-volume-bar.vjs-slider-horizontal .vjs-volume-level{width:100%}.vjs-menu-button-popup.vjs-volume-menu-button .vjs-menu{display:block;width:0;height:0;border-top-color:transparent}.vjs-menu-button-popup.vjs-volume-menu-button-vertical .vjs-menu{left:.5em;height:8em}.vjs-menu-button-popup.vjs-volume-menu-button-horizontal .vjs-menu{left:-2em}.vjs-menu-button-popup.vjs-volume-menu-button .vjs-menu-content{height:0;width:0;overflow-x:hidden;overflow-y:hidden}.vjs-volume-menu-button-vertical .vjs-lock-showing .vjs-menu-content,.vjs-volume-menu-button-vertical:hover .vjs-menu-content{height:8em;width:2.9em}.vjs-volume-menu-button-horizontal .vjs-lock-showing .vjs-menu-content,.vjs-volume-menu-button-horizontal:hover .vjs-menu-content{height:2.9em;width:8em}.vjs-volume-menu-button.vjs-menu-button-inline .vjs-menu-content{background-color:transparent!important}.vjs-poster{display:inline-block;vertical-align:middle;background-repeat:no-repeat;background-position:50% 50%;background-size:contain;cursor:pointer;margin:0;padding:0;position:absolute;top:0;right:0;bottom:0;left:0;height:100%}.vjs-poster img{display:block;vertical-align:middle;margin:0 auto;max-height:100%;padding:0;width:100%}.vjs-has-started .vjs-poster{display:none}.vjs-audio.vjs-has-started .vjs-poster{display:block}.vjs-controls-disabled .vjs-poster,.vjs-using-native-controls .vjs-poster{display:none}.video-js .vjs-live-control{display:-webkit-box;display:flex;-webkit-box-align:flex-start;align-items:flex-start;-webkit-box-flex:auto;flex:auto;font-size:1em;line-height:3em}.vjs-no-flex .vjs-live-control{display:table-cell;width:auto;text-align:left}.video-js .vjs-current-time,.video-js .vjs-duration,.vjs-live .vjs-time-control,.vjs-live .vjs-time-divider,.vjs-no-flex .vjs-current-time,.vjs-no-flex .vjs-duration{display:none}.video-js .vjs-time-control{-webkit-box-flex:none;flex:none;font-size:1em;line-height:3em}.vjs-time-divider{display:none;line-height:3em}.video-js .vjs-play-control{cursor:pointer;-webkit-box-flex:none;flex:none}.vjs-text-track-display{position:absolute;bottom:3em;left:0;right:0;top:0;pointer-events:none}.video-js.vjs-user-inactive.vjs-playing .vjs-text-track-display{bottom:1em}.video-js .vjs-text-track{font-size:1.4em;text-align:center;margin-bottom:.1em;background-color:#000;background-color:rgba(0,0,0,.5)}.vjs-subtitles{color:#fff}.vjs-captions{color:#fc6}.vjs-tt-cue{display:block}video::-webkit-media-text-track-display{-webkit-transform:translateY(-3em);transform:translateY(-3em)}.video-js.vjs-user-inactive.vjs-playing video::-webkit-media-text-track-display{-webkit-transform:translateY(-1.5em);transform:translateY(-1.5em)}.video-js .vjs-fullscreen-control{width:3.8em;cursor:pointer;-webkit-box-flex:none;flex:none}.vjs-playback-rate .vjs-playback-rate-value{font-size:1.5em;line-height:2;position:absolute;top:0;left:0;width:100%;height:100%;text-align:center}.vjs-playback-rate .vjs-menu{width:4em;left:0}.vjs-error .vjs-error-display .vjs-modal-dialog-content{font-size:1.4em;text-align:center}.vjs-error .vjs-error-display:before{color:#fff;content:"X";font-family:Arial,Helvetica,sans-serif;font-size:4em;left:0;line-height:1;margin-top:-.5em;position:absolute;text-shadow:.05em .05em .1em #000;text-align:center;top:50%;vertical-align:middle;width:100%}.vjs-loading-spinner{display:none;position:absolute;top:50%;left:50%;margin:-25px 0 0 -25px;opacity:.85;text-align:left;border:6px solid rgba(43,51,63,.7);box-sizing:border-box;background-clip:padding-box;width:50px;height:50px;border-radius:25px}.vjs-seeking .vjs-loading-spinner,.vjs-waiting .vjs-loading-spinner{display:block}.vjs-loading-spinner:after,.vjs-loading-spinner:before{content:"";position:absolute;margin:-6px;box-sizing:inherit;width:inherit;height:inherit;border-radius:inherit;opacity:1;border:inherit;border-color:#fff transparent transparent}.vjs-seeking .vjs-loading-spinner:after,.vjs-seeking .vjs-loading-spinner:before,.vjs-waiting .vjs-loading-spinner:after,.vjs-waiting .vjs-loading-spinner:before{-webkit-animation:vjs-spinner-spin 1.1s cubic-bezier(.6,.2,0,.8) infinite,vjs-spinner-fade 1.1s linear infinite;animation:vjs-spinner-spin 1.1s cubic-bezier(.6,.2,0,.8) infinite,vjs-spinner-fade 1.1s linear infinite}.vjs-seeking .vjs-loading-spinner:before,.vjs-waiting .vjs-loading-spinner:before{border-top-color:#fff}.vjs-seeking .vjs-loading-spinner:after,.vjs-waiting .vjs-loading-spinner:after{border-top-color:#fff;-webkit-animation-delay:.44s;animation-delay:.44s}@keyframes vjs-spinner-spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@-webkit-keyframes vjs-spinner-spin{100%{-webkit-transform:rotate(360deg)}}@keyframes vjs-spinner-fade{0%,100%,20%,60%{border-top-color:#73859f}35%{border-top-color:#fff}}@-webkit-keyframes vjs-spinner-fade{0%,100%,20%,60%{border-top-color:#73859f}35%{border-top-color:#fff}}.vjs-chapters-button .vjs-menu{left:-10em;width:0}.vjs-chapters-button .vjs-menu ul{width:24em}.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-custom-control-spacer{-webkit-box-flex:auto;flex:auto}.video-js.vjs-layout-tiny:not(.vjs-fullscreen).vjs-no-flex .vjs-custom-control-spacer{width:auto}.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-captions-button,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-chapters-button,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-current-time,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-duration,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-mute-control,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-playback-rate,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-remaining-time,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-subtitles-button,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-time-divider,.video-js.vjs-layout-small:not(.vjs-fullscreen) .vjs-volume-control,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-captions-button,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-chapters-button,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-current-time,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-duration,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-mute-control,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-playback-rate,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-progress-control,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-remaining-time,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-subtitles-button,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-time-divider,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-volume-control,.video-js.vjs-layout-tiny:not(.vjs-fullscreen) .vjs-volume-menu-button,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-captions-button,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-chapters-button,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-current-time,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-duration,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-fullscreen-control,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-mute-control,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-playback-rate,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-remaining-time,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-subtitles-button,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-time-divider,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-volume-button,.video-js.vjs-layout-x-small:not(.vjs-fullscreen) .vjs-volume-control{display:none}.vjs-caption-settings{position:relative;top:1em;background-color:#2B333F;background-color:rgba(43,51,63,.75);color:#fff;margin:0 auto;padding:.5em;height:15em;font-size:12px;width:40em}.vjs-caption-settings .vjs-tracksettings{top:0;bottom:2em;left:0;right:0;position:absolute;overflow:auto}.vjs-caption-settings .vjs-tracksettings-colors,.vjs-caption-settings .vjs-tracksettings-font{float:left}.vjs-caption-settings .vjs-tracksettings-colors:after,.vjs-caption-settings .vjs-tracksettings-controls:after,.vjs-caption-settings .vjs-tracksettings-font:after{clear:both}.vjs-caption-settings .vjs-tracksettings-controls{position:absolute;bottom:1em;right:1em}.vjs-caption-settings .vjs-tracksetting{margin:5px;padding:3px;min-height:40px}.vjs-caption-settings .vjs-tracksetting label{display:block;width:100px;margin-bottom:5px}.vjs-caption-settings .vjs-tracksetting span{display:inline;margin-left:5px}.vjs-caption-settings .vjs-tracksetting>div{margin-bottom:5px;min-height:20px}.vjs-caption-settings .vjs-tracksetting>div:last-child{margin-bottom:0;padding-bottom:0;min-height:0}.vjs-caption-settings label>input{margin-right:10px}.vjs-caption-settings input[type=button]{width:40px;height:40px}.video-js .vjs-modal-dialog{background:rgba(0,0,0,.8);background:linear-gradient(180deg,rgba(0,0,0,.8),rgba(255,255,255,0))}.vjs-modal-dialog .vjs-modal-dialog-content{font-size:1.2em;line-height:1.5;padding:20px 24px;z-index:1}.vjs-ad-playing.vjs-ad-playing .vjs-progress-control{pointer-events:none}.vjs-ad-playing.vjs-ad-playing .vjs-play-progress{background-color:#ffe400}.vjs-ad-playing.vjs-ad-loading .vjs-loading-spinner{display:block}.vjs-ad-playing .vjs-audio-button,.vjs-ad-playing .vjs-captions-button{display:none}.video-js .vjs-overlay{color:#fff;position:absolute;text-align:center}.video-js .vjs-overlay-no-background{max-width:33%}.video-js .vjs-overlay-background{background-color:#646464;background-color:rgba(255,255,255,.4);border-radius:3px;padding:10px;width:33%}.video-js .vjs-overlay-top-left{top:5px;left:5px}.video-js .vjs-overlay-top{left:50%;margin-left:-16.5%;top:5px}.video-js .vjs-overlay-top-right{right:5px;top:5px}.video-js .vjs-overlay-right{margin-top:-15px;right:5px;top:50%}.video-js .vjs-overlay-bottom-right{bottom:3.5em;right:5px}.video-js .vjs-overlay-bottom{bottom:3.5em;left:50%;margin-left:-16.5%}.video-js .vjs-overlay-bottom-left{bottom:3.5em;left:5px}.video-js .vjs-overlay-left{left:5px;margin-top:-15px;top:50%}.powr_player h2.powr-video-player{font-family:Arial;font-size:20px}body .powr_player .video-js .rc-video-overlay{margin-left:0;left:0;top:0;font-size:13px;font-weight:700;text-align:left;border-radius:0;width:100%;background:linear-gradient(to bottom,rgba(0,0,0,.8) 0,rgba(0,0,0,.3) 30%,transparent 100%);filter:progid:DXImageTransform.Microsoft.gradient( startColorstr="#000000", endColorstr="#4d000000", GradientType=0 );transition:visibility 1.5s,opacity 1.5s}body .powr_player .video-js .rc-video-overlay img{max-height:30px;float:right}.powr_player .rc-video-overlay>small{float:right;text-align:center}.powr_player .rc-video-overlay>small small{font-size:12px}a.rc-video-close{display:none;position:absolute}.rc-video-title{display:block;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.rc-float-video{position:fixed;z-index:2147483647;box-shadow:0 0 4px #888}.rc-float-video a.rc-video-close{display:block;color:#EEE;background-color:#333;padding:5px;position:absolute;font-weight:700;font-size:13px;z-index:100}@media (orientation:portrait){.rc-float-video a.rc-video-close .label{display:none}.rc-float-video img{max-height:20px!important;margin-right:38px;margin-top:-2px}.rc-float-video a.rc-video-close{font-size:14px;padding-left:10px;padding-right:10px;border-radius:30px;margin-top:-3px!important}} .rc-volume-button {margin-right: 10px; margin-top: 10px;} /* endinject */', 'rev-powr-video');

        var that = this;

        this.floated = false;
        this.neverFloat = false;
        if (!this.config.should_float) {
            this.neverFloat = true;
        }

        var imaCss = document.createElement("link");
        imaCss.setAttribute("href", "//cdnjs.cloudflare.com/ajax/libs/videojs-ima/0.6.0/videojs.ima.css");
        imaCss.setAttribute("type", "text/css");
        imaCss.setAttribute("rel", "stylesheet");
        revUtils.append(this.element, imaCss);

        var imaScript = document.createElement('script');
        imaScript.setAttribute('src', '//imasdk.googleapis.com/js/sdkloader/ima3.js');
        imaScript.setAttribute('async', true);
        imaScript.setAttribute('type', 'text/javascript');

        revUtils.addEventListener(imaScript, "load", function () {
            that.setup();
        });
        revUtils.append(this.element, imaScript);
    };

    PowrVideo.prototype.onResize = function() {
        var width = this.element.clientWidth;
        var height = this.fixedHeight;
        if (height == -1) {
            height = parseInt(0.5625 * width);
        }
	if (this.config.fluid) {
	    height = document.body.clientHeight;
	}
        this.element.setAttribute("style", "width : 100%; height : " + height + "px; background-color : #EFEFEF");

        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var windowWidth = window.innerWidth|| document.documentElement.clientWidth || document.body.clientWidth;
        var newOrientation = '';
        if (windowWidth < windowHeight) {
            newOrientation = 'portrait';
        } else if (windowWidth > windowHeight && this.orientation == 'portrait') {
            newOrientation = 'landscape';
        }
        if (newOrientation != this.orientation) {
            this.orientation = newOrientation;
            this.orientationChanged();
        }
    }

    PowrVideo.prototype.setup = function () {
        var mobile = false;
        if (navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/Android/i)) {
            mobile = true;
        }

        this.container = document.createElement("div");
        this.container.className = 'powr_player';
        this.element.appendChild(this.container);

        this.attachVisibleListener();
        revUtils.addEventListener(window, 'resize', this.onResize.bind(this));
        this.orientation = 'none';
        this.onResize();

        var dumbPlayer = document.createElement('video');
        dumbPlayer.id = this.playerId;
        dumbPlayer.className = 'video-js vjs-default-skin vjs-big-play-centered vjs-fluid';
        dumbPlayer.setAttribute('width', this.playerWidth + 'px');
        dumbPlayer.setAttribute('height', this.playerHeight + 'px');
        dumbPlayer.setAttribute("controls", "true");
        dumbPlayer.setAttribute("preload", "auto");
        dumbPlayer.setAttribute("poster", this.videos[0].thumbnail);
        dumbPlayer.setAttribute("playsinline", "true");
        if ((mobile && this.config.autoplay) || this.inIFrame) {
            dumbPlayer.setAttribute("muted", "true");
        }
        var contentSrc = document.createElement('source');
        contentSrc.setAttribute('src', this.videos[0].sd_url);
        contentSrc.setAttribute('type', 'video/mp4');
        dumbPlayer.appendChild(contentSrc);

        this.container.appendChild(dumbPlayer);

        // videojs.support.requestFullScreen = false;

        this.player = videojs(this.playerId, {
            nativeControlForTouch: false
        });

        this.currentContent = 0;
	this.autoplaying = true;
        //
        //this.player.logobrand({
          //  image : this.config.custom_logo,
          //  destination : "http://alpha.powr.com/"
        //});

        var me = this;

        //revUtils.addEventListener(window, 'scroll', function () {
          //  if (me.player) {
          //      me.player.muted(false);
          //  }
        // });
	me.skipNextClick = false;
        if ((mobile && this.config.autoplay) || this.inIFrame) {
            this.player.one("touchend", function (e) {
                if (me.player && me.player.muted()) {
                    me.player.muted(false);
		    me.autoplaying = false;
		    me.skipNextClick = true;
                }
            });
            //revUtils.addEventListener(this.container, 'touchend', function () {
            //
            //});
        }


        this.player.ready(function () {
            var titleContent = me.videos[0].title;
            if (me.config.custom_logo) {
                titleContent = "<a class='rc-video-close' href='javascript:void(0)' class='close'><span class='label'>CLOSE | </span>X</a><img src='" + me.config.custom_logo + "'><span class='rc-video-title'>" + titleContent + "</span>";
            }

	    if (mobile) {
		me.player.on("touchend", function (e) {
		    if (me.skipNextClick) {
			me.skipNextClick = false;
			return;
		    }
		    if (!me.autoplaying) {
			if (me.player.paused()) {
			    me.player.play();
			} else {
			    me.player.pause();
			}
		    }
		});
	    }

            me.player.overlay({
                align: "top",
                showBackground: true,
                class: "rc-video-overlay",
                content: titleContent,
                overlays: [{
                    start: "custom1",
                    end: "custom2"
                }, {
		    start : "custom1",
		    end : "custom2",
		    content : "<img src='./img/volume.png'/ style='max-height : 20px;'>",
		    align : "top-right",
		    showBackground : false,
		    class : "rc-volume-button"
		}]
            });
	    if (me.config.fluid) {
		me.player.overlays_[0].hide();
		me.player.overlays_[1].hide();
	    } else {
		me.player.overlays_[0].show();
		me.player.overlays_[1].hide();
	    }

	    if (me.config.fluid) {
		me.player.fluid(false);
		me.player.dimensions(me.playerWidth, me.playerHeight);
	    }
	    
            me.player.on('timeupdate', me.onUpdate.bind(me));

            me.player.on('play', me.onPlay.bind(me));
            me.player.on('pause', me.onPause.bind(me));
            me.player.on('useractive', me.onActive.bind(me));
            me.player.on('userinactive', me.onIdle.bind(me));
	    
            GlobalPlayer = me;

            me.closeButton = me.container.querySelector(".rc-video-close");
            me.titleDom = me.container.querySelector(".rc-video-title");

            revUtils.addEventListener(me.closeButton, 'click', function () {
                me.neverFloat = true;
                me.player.pause();
                me.unfloatPlayer();
            });
//            if (navigator.userAgent.match(/iPhone/i) ||
//                navigator.userAgent.match(/iPad/i) ||
//                navigator.userAgent.match(/Android/i)) {
//                me.player.one('touchend', function () {
//                    me.start(true);
//                    me.player.play();
//                });
//            } else {
            me.start(me.config.autoplay);
            if (!me.config.autoplay) {
                me.player.one('click', function () {
                    me.player.play();
                });
            }
//            }
        });
    };

    PowrVideo.prototype.onUpdate = function() {
        if (this.currentContent >= this.videos.length)
            return;
        var video = this.videos[this.currentContent];
        var d = this.player.currentTime();
        d = (d * 1.0) / video.duration;
        if (video.tracking['start'] && (d > 0)) {
            revApi.request(this.config.tracking_url + video.tracking['start'], function () { return ; });
            video.tracking['start'] = null;
        } else if (video.tracking['q_1'] && (d > 0.25)) {
            revApi.request(this.config.tracking_url + video.tracking['q_1'], function () { return ; });
            video.tracking['q_1'] = null;
        } else if (video.tracking['q_2'] && (d > 0.5)) {
            revApi.request(this.config.tracking_url + video.tracking['q_2'], function () { return ; });
            video.tracking['q_2'] = null;
        } else if (video.tracking['q_3'] && (d > 0.75)) {
            revApi.request(this.config.tracking_url + video.tracking['q_3'], function () { return ; });
            video.tracking['q_3'] = null;
        }
    };
    
    PowrVideo.prototype.start = function(playOnLoad) {
        this.player.ima(this.options, this.bind(this, this.adsManagerLoadedCallback));
        this.player.ima.initializeAdDisplayContainer();
        this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), playOnLoad);
        this.player.poster(this.videos[this.currentContent].thumbnail);

        this.player.ima.requestAds();

        var me = this;
        this.player.ima.addContentEndedListener(function () {
            me.loadNextVideo();
        });
    };

    PowrVideo.prototype.loadNextVideo = function() {
        var video = this.videos[this.currentContent];
        if (video.tracking['end']) {
            revApi.request(this.config.tracking_url + video.tracking['end'], function () { return ; });
            video.tracking['end'] = null;
        }
        this.currentContent++;
        if (this.currentContent < this.videos.length) {
            this.player.ima.setContentWithAdTag(this.videos[this.currentContent].sd_url, this.getAdTag(this.videos[this.currentContent].id), true);
            this.player.poster(this.videos[this.currentContent].thumbnail);
            var titleContent = this.videos[this.currentContent].title;
            // this.player.overlays_[0].contentEl().innerHTML = titleContent;
            this.titleDom.innerHTML = titleContent;
            this.player.ima.requestAds();
        } else {
            this.currentContent--;
        }
    };

    PowrVideo.prototype.attachVisibleListener = function() {
	if (this.inIFrame) {
            revUtils.addEventListener(window.parent, 'scroll', this.checkVisible.bind(this));
	} else {
	    revUtils.addEventListener(window, 'scroll', this.checkVisible.bind(this));
	}
        this.checkVisible();
    };

    PowrVideo.prototype.floatPlayer = function() {
        if (this.floated)
            return;
        if (this.neverFloat)
            return;
	if (!this.hasOwnProperty("closeButton"))
	    return;
	
        this.container.className = "rc-float-video powr_player";
        var styleString = "";
        var fs = this.config.floatSettings;

        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

        if (this.orientation == 'portrait') {
            styleString += "top : 0px;";
            styleString += "left : 0px; right : 0px; width : 100%; height : 176px;";
            this.player.fluid(false);
            this.player.dimensions(windowWidth, 176);

            if (fs.headerId != null) {
                var h = document.getElementById(fs.headerId);
                this.oldZ = h.style.zIndex;
                h.style.zIndex = 0;
            }
            // this.closeButton.setAttribute("style", "margin-top : 166px; margin-left : " + (windowWidth - 60) + "px");
            this.closeButton.setAttribute("style", "margin-top : 0px; margin-left : " + (windowWidth - 50) + "px");

        } else {
            this.player.fluid(true);
            if (fs.style.startsWith("top")) {
                if (fs.header > 0) {
                    styleString += "top : " + (fs.header) + "px;";
                } else {
                    styleString += "top : " + (fs.margin) + "px;";
                }
            } else {
                styleString += "bottom : " + fs.margin + "px;";
            }

            if (fs.style.endsWith("right")) {
                styleString += "right : " + fs.margin + "px;";
            } else {
                styleString += "left : " + fs.margin + "px;";
            }

            var r = this.element.getBoundingClientRect();
            var w = windowWidth - r.right;
            w = w - 20;
            w = Math.min(480, w);
            styleString += "width : " + w + "px;";

            var h = parseInt(0.5625 * w);
            if (fs.style.startsWith("top")) {
                this.closeButton.setAttribute("style", "margin-top : " + (h - 10) + "px;");
            } else {
                this.closeButton.setAttribute("style", "margin-left : " + (w - 100) + "px; margin-top : -30px;");
            }
        }

        this.container.setAttribute("style", styleString);

        this.floated = true;
    };

    PowrVideo.prototype.unfloatPlayer = function() {
        if (this.floated) {
            this.container.className = 'powr_player';
            this.container.removeAttribute("style");
            this.floated = false;
            this.player.fluid(true);

            if (this.config.floatSettings.headerId != null) {
                var h = document.getElementById(this.config.floatSettings.headerId);
                h.style.zIndex = this.oldZ;
            }
        }
    };

    PowrVideo.prototype.setFixedHeight = function(h) {
        this.fixedHeight = h
    };


    PowrVideo.prototype.orientationChanged = function() {
        if (this.floated) {
            this.floated = false;
            // refloat player if orientation has changed.
            this.floatPlayer();
        }
    };

    PowrVideo.prototype.getTitle = function () {

    };

    PowrVideo.prototype.checkVisible = function() {
        var that = this;
        requestAnimationFrame(function() {
	    if (that.inIFrame) {
		var iid = that.config.iframe_id;
		var element = window.parent.document.getElementById(iid);
		var windowHeight = window.parent.innerHeight || window.parent.document.documentElement.clientHeight || window.parent.document.body.clientHeight;
		var elementHeight = element.getBoundingClientRect().height;
		var elementTop = element.getBoundingClientRect().top;
		var currentScroll = window.parent.pageYOffset || window.parent.document.documentElement.scrollTop || window.parent.document.body.scrollTop; 

		if (elementTop + elementHeight < 0) {
		    if (that.autoplaying && !that.player.paused()) {
			that.player.pause();
		    }
		} else if (elementTop + 30 < windowHeight) {
		    if (that.autoplaying && that.player.paused()) {
			that.player.play();
		    }
		}
	    } else {
		// what percentage of the element should be visible
		// var visibleHeightMultiplier = (typeof percentVisible === 'number') ? (parseInt(percentVisible) * .01) : 0;
		// fire if within buffer
		// var bufferPixels = (typeof buffer === 'number') ? buffer : 0;
		
		var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
		var elementTop = that.element.getBoundingClientRect().top;
		var elementBottom = that.element.getBoundingClientRect().bottom;
		var elementVisibleHeight = that.element.offsetHeight * 0.50;
		
		if ((elementTop + elementVisibleHeight) < windowHeight) {
                    that.registerView();
		}
		
		if (elementTop < 0 && (-1 * elementTop) > 0.2 * that.playerHeight) {
                    that.floatPlayer();
		} else {
                    that.unfloatPlayer();
		}
	    }
        });
    };



    PowrVideo.prototype.adsManagerLoadedCallback = function() {
        var me = this;
        this.player.ima.addEventListener(google.ima.AdEvent.Type.STARTED, function () {
            me.player.removeClass('vjs-ad-loading');
        });
        this.player.ima.startFromReadyCallback();
    };

    PowrVideo.prototype.registerView = function() {
        if (!this.viewed) {
            this.viewed = true;
            revApi.request(this.config.tracking_url + this.config.view_tracker, function() { return; });
        }
    };

    PowrVideo.prototype.bind = function(thisObj, fn, argument) {
        return function() {
            fn.apply(thisObj, [argument]);
        };
    };

    PowrVideo.prototype.onAdEvent = function (event) {

    };

        PowrVideo.prototype.onPlay = function() {

    };

    PowrVideo.prototype.onPause = function() {
	if (!this.config.fluid) {
            this.player.overlays_[0].show();
	}
    };

    PowrVideo.prototype.onActive = function() {
	if (!this.config.fluid) {
            this.player.overlays_[0].show();
	}
    };

    PowrVideo.prototype.onIdle = function() {
        if (!this.player.paused()) {
            this.player.overlays_[0].hide();
        }
    };

    return PowrVideo;
}));


					  

