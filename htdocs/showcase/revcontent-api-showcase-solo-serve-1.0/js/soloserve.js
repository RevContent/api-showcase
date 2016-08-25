/*********************************************

 _____       _       _____
/  ___|     | |     /  ___|
\ `--.  ___ | | ___ \ `--.  ___ _ ____   _____
 `--. \/ _ \| |/ _ \ `--. \/ _ \ '__\ \ / / _ \
/\__/ / (_) | | (_) /\__/ /  __/ |   \ V /  __/
\____/ \___/|_|\___/\____/ \___|_|    \_/ \___|


Project: SoloServe Native
Version: 1
Author: chris@revcontent.com

 Query String Parameters:
 w = widget id

 Object Vars
 var RevContentSolo = { button_text: 'Find Out More'}

*********************************************/

var revcontentsolourl = document.getElementById('revsoloserve').src,
    revcontentsolovars = [], revcontentsolohash,
    revcontentsolohashes = revcontentsolourl.slice(revcontentsolourl.indexOf('?') + 1).split('&');

    for (var i = 0; i < revcontentsolohashes.length; i++) {
        revcontentsolohash = revcontentsolohashes[i].split('=');
        revcontentsolovars.push(revcontentsolohash[0]);
        revcontentsolovars[revcontentsolohash[0]] = revcontentsolohash[1];
    }

if (revcontentsolovars.w === undefined || isNaN(revcontentsolovars.w)) {
    console.log("soloserve requires a widget id to be passed in, ex. ?w=3023222 ")
} else {
    var solo_widget_id = revcontentsolovars.w;
}

if (RevContentSolo.button_text === undefined) {
    RevContentSolo.button_text = "Find Out More";
}

var css = '<style>'+
'#rc-solo-border {'+
    'border: 1px solid #dedede;'+
    'border-radius: 3px;'+
    'max-width: 550px;'+
    'position: relative;'+
    'margin: 0 auto;'+
    'cursor: pointer;'+
'}'+
'.rc-w-'+solo_widget_id+' .rc-headline {'+
    'font-family: Hind, Arial, sans-serif!important;'+
    'font-size: 24px!important;'+
    'line-height: 28px!important;'+
    'margin: 14px 4% 0px 4%!important;'+
    'width: 92%!important;'+
'}'+
'.rc-w-'+solo_widget_id+' .rc-provider {'+
    'margin: 1px 4%!important;'+
    'width: 92%!important;'+
    'font-size: 12px!important;'+
'}'+
'.rc-w-'+solo_widget_id+' .rc-item-wrapper {'+
    'margin: 0!important;'+
'}'+
'.rc-w-'+solo_widget_id+' .rc-photo {'+
    'border-top-left-radius: 3px;'+
    'border-top-right-radius: 3px;'+
'}'+
'.rc-uid-'+solo_widget_id+' .rc-branding-label {'+
    'position: relative;'+
    'top: 77px;'+
'}'+
'.rc-solo-more-button {'+
    'box-shadow: none;'+
    'background: #0785f2;'+
    'padding: 9px 23px 7px 33px;'+
    'cursor: pointer;'+
    'box-shadow: 0 0 3px rgba(0,0,0,0.4);'+
    'position: relative;'+
    'text-align: center;'+
    'border-radius: 3px;'+
    'display: block;'+
    'width: 130px;'+
    'margin: 17px 0 16px 4%;'+
    'height: 24px;'+
    'overflow: hidden;'+
'}'+
'.rc-solo-more-button:hover {'+
    'background: #0862b0;'+
'}'+
'.rc-solo-more-buttontext {'+
    'display: inline;'+
    'color: #fff;'+
    'font-size: 16px;'+
    'line-height: 26px;'+
    'font-weight: 500;'+
    'margin-right: 8px;'+
    'margin-left: 0px;'+
'}'+
'.rc-hot-holder {'+
    'position: relative;'+
    'float: right;'+
    'margin-top: -45px;'+
    'margin-right: 18px;'+
'}'+
'.rc-block-for-well {'+
    'width: 100%;'+
    'height: 56px;'+
'}'+
'@media only screen and (max-width : 320px) {'+
    '.rc-hot-holder {'+
        'display: none;'+
    '}'+
'}'+
'</style>';

var js = '<script type="text/javascript">'+
    '(function() {'+
        'var rcruntime = document.getElementById("hotnum");'+
        'var referer="";try{if(referer=document.referrer,"undefined"==typeof referer)throw"undefined"}catch(exception){referer=document.location.href,(""==referer||"undefined"==typeof referer)&&(referer=document.URL)}referer=referer.substr(0,700);'+
        'var rcel = document.createElement("script");'+
        'rcel.id = "rc_" + Math.floor(Math.random() * 1000);'+
        'rcel.type = "text/javascript";'+
        'rcel.src = "http://trends.revcontent.com/serve.js.php?w='+solo_widget_id+'&t="+rcel.id+"&c="+(new Date()).getTime()+"&width="+(window.outerWidth || document.documentElement.clientWidth)+"&referer="+referer;'+
        'rcel.async = true;'+
        'var rcds = document.getElementById("rcjsload_soloserve_'+solo_widget_id+'"); rcds.appendChild(rcel);'+
        'rcruntime.innerHTML = rcruntime.innerHTML + rcruntimec();'+
    '})();'+

    'function rcclickfnc()'+
    '{'+
        'document.getElementById("rcjsload_soloserve_'+solo_widget_id+'").querySelectorAll(".rc-cta")[0].click();'+
    '}'+
    'function rcruntimec()'+
    '{'+
        'var runtime = new Date().getTime().toString().substr(7,5);'+
        'var newruntime = runtime.indexOf("0") == 0 ? 1 + runtime.substr(1) : runtime;'+

        'return newruntime.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");'+
    '}'+
'</script>';

var html = '<div id="rc-solo-border">'+
    '<div id="rcjsload_soloserve_'+solo_widget_id+'"></div>'+
    '<div class="rc-block-for-well" onclick="rcclickfnc()">'+
        '<div class="rc-solo-more-button"><span class="rc-solo-more-buttontext">'+RevContentSolo.button_text+'></span></div>'+
        '<div class="rc-hot-holder"><img src="data:image/png;base64,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" style="height: 20px;"> <span id="hotnum" style="color:#e63e3e; cursor:pointer; font-size: 18px; font-family:helvetica; position: relative; bottom: 3px; left:0px;"></span></div>'+
    '</div>'+js+
'</div>';


document.write(css);
document.write(html);