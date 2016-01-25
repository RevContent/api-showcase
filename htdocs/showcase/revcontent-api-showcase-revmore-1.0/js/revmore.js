/*
 ____            __  __
|  _ \ _____   _|  \/  | ___  _ __ ___
| |_) / _ \ \ / / |\/| |/ _ \| '__/ _ \
|  _ <  __/\ V /| |  | | (_) | | |  __/
|_| \_\___| \_/ |_|  |_|\___/|_|  \___|

@Author: chris@revcontent.com
@Project: RevMore
@Usage:
    <script type="text/javascript" src="revmore.js"></script>
    <script>
    var RevMore = {
        widget_id : 30, //widget to pop inside revmore container
        button_text : 'Read Full Article', //text on the revmore button (any words)
        mobile_only : false, //only use revmore on mobile devices (true/false)
        top_pixels : 220,  //distance from top of visible window to start revmore (integer in pixels)
        environment : 'http://trends.revcontent.com/'
    };
    </script>
*/

(function(j,q,u,e,r,y,R,o,x){try{o=jQuery;if(o&&(!R||(R&&o.fn.jquery==R))){x=true}}catch(er){}if(!x||(R&&o.fn.jquery!=R)){(q=j.createElement(q)).type='text/javascript';if(r){q.async=true}q.src='//ajax.googleapis.com/ajax/libs/jquery/'+(R||1)+'/jquery.min.js';u=j.getElementsByTagName(u)[0];q.onload=q.onreadystatechange=(function(){if(!e&&(!this.readyState||this.readyState=='loaded'||this.readyState=='complete')){e=true;x=jQuery;jQuery.noConflict(true)(function(){y(x)});q.onload=q.onreadystatechange=null;u.removeChild(q)}});u.appendChild(q)}else{y(o)}})(document,'script','head',false,false,(function($){$(function(){

    $(document).ready(function() {

        var revMoreMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        var revMoreButton = typeof RevMore.button_text === 'undefined' ? "Read Full Article" : RevMore.button_text;

        if ((revMoreMobile == true && RevMore.mobile_only == true) || RevMore.mobile_only == false) {

            window.scrollTo(0, 0);

            var revMorePayload = '<div id="rcjsload_revmore"></div><script type="text/javascript">(function() {var rcel = document.createElement("script");rcel.id = "rc_" + Math.floor(Math.random() * 1000);rcel.type = "text/javascript";rcel.src ="'+RevMore.environment+'/serve.js.php?w='+RevMore.widget_id+'&t=" + rcel.id + "&c=" + (new Date()).getTime() + "&width=" + (window.outerWidth || document.documentElement.clientWidth); rcel.async = true;var rcds = document.getElementById("rcjsload_revmore"); rcds.appendChild(rcel);})();</script>';
            var revMoreStyle = "";

            revMoreStyle += "#revoverlay {position:absolute;top:"+RevMore.top_pixels+"px;left:0;height:auto;width:100%;z-index:9999999999999;}";
            revMoreStyle += "#revgradhead{position:absolute;left:0;z-index:999999999999;height:100px;width:100%;background:-moz-linear-gradient(top, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 45, rgba(255,255,255,1) 100%);background:-webkit-linear-gradient(top,  rgba(255,255,255,0) 0%,rgba(255,255,255,1) 45%,rgba(255,255,255,1) 100%);background:linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,1) 45%,rgba(255,255,255,1) 100%);filter:progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ffffff', endColorstr='#ffffff',GradientType=0 );}";
            revMoreStyle += "#revmorebody {background:#fff;position:relative;left:0;z-index:9999999999999;width:100%;top:100px;}";
            revMoreStyle += "#revmorebut{-webkit-border-radius:10;-moz-border-radius:10;border-radius:10px;font-family:'Arial'; color: #1f628d;font-size:20px;padding:10px 20px 10px 20px;border:solid #1f628d 2px;text-decoration:none;margin:0 20px 10px 20px;text-align:center;cursor:pointer;}";
            revMoreStyle += "#revmorepayloadwrap{margin-top: 10px;} #revmorebody #rcjsload_revmore {background:#fff; padding-bottom: 20px;}#revmorebottombeacon{width: 100%;height:1px;background: #fff;}";

            $("body").after(function() {
                return "<style>"+revMoreStyle+"</style><div id='revoverlay' onmousedown='return false'><div id='revgradhead'></div><div id='revmorebody'><div id='revmorebut'>"+revMoreButton+"</div><div id='revmorepayloadwrap'>"+revMorePayload+"</div><div id='revmorebottombeacon'></div></div></div>";
            });

            var revMoreScrollHandler = function(){
                if (window.pageYOffset < 20) {
                    $("body").css({'position': 'relative'});
                } else {
                    $("body").css({'position': 'fixed'});
                }
            }

            if (revMoreMobile == true) {
                $("body").css({'position': 'fixed'});
            } else {
                $(window).scroll(revMoreScrollHandler);
            }

            $("#revmorebody").css({'min-height': $(window.top).height() - RevMore.top_pixels + 30 });

            $(document).on( "click", "#revmorebut", function() {
                $("#revoverlay").remove();
                $("body").css({'overflow': 'visible', 'position': 'relative'});
                $(window).off("scroll", revMoreScrollHandler);
            });
        }
    });

})}),'2.1.4');
