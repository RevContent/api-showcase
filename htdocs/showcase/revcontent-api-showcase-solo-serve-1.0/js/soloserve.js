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

if (typeof RevContentSolo != 'undefined') {

    if (RevContentSolo.button_text === undefined) {
        RevContentSolo.button_text = "Find Out More";
    }

    if (RevContentSolo.theme === undefined) {
        RevContentSolo.theme = "default";
    }
}

console.log(RevContentSolo.theme);

var css = '<style>'+
'#rc-solo {' +
    'border: 1px solid #dedede;'+
    'border-radius: 3px;'+
    'max-width: 550px;'+
    'position: relative;'+
    'margin: 0 auto;'+
    'cursor: pointer;'+
'}'+

'#rc-solo * {'+
    '-webkit-box-sizing: border-box;'+
    '-moz-box-sizing: border-box;'+
    'box-sizing: border-box;'+
    'font-size:inherit;'+
    'line-height:1;'+
    'font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;'+
    'margin:0;'+
    'padding:0;'+
    'position:relative;'+
'}'+
'#rc-solo .rc-w-'+solo_widget_id+' .rc-headline {'+
    'font-family: Hind, Arial, sans-serif!important;'+
    'font-size: 24px!important;'+
    'line-height: 28px!important;'+
    'margin: 14px 4% 0px 4%!important;'+
    'width: 92%!important;'+
'}'+
'#rc-solo .rc-w-'+solo_widget_id+' .rc-provider {'+
    'margin: 1px 4%!important;'+
    'width: 92%!important;'+
    'font-size: 12px!important;'+
'}'+
'#rc-solo .rc-w-'+solo_widget_id+' .rc-item-wrapper {'+
    'margin: 0!important;'+
'}'+
'#rc-solo .rc-w-'+solo_widget_id+' .rc-photo {'+
    'border-top-left-radius: 3px;'+
    'border-top-right-radius: 3px;'+
'}'+
'#rc-solo .rc-uid-'+solo_widget_id+' .rc-branding-label {'+
    'position: relative;'+
    'top: 77px;'+
'}'+
'#rc-solo .rc-solo-more-button {'+
    'box-shadow: none;'+
    'background: #0785f2;'+
    'cursor: pointer;'+
    'box-shadow: 0 0 3px rgba(0,0,0,0.4);'+
    'position: relative;'+
    'text-align: center;'+
    'border-radius: 3px;'+
    'display: block;'+
    'width: 155px;'+
    'margin: 17px 0 16px 4%;'+
    'height: 40px;'+
    'overflow: hidden;'+
'}'+
'#rc-solo .rc-solo-more-button:hover {'+
    'background: #0862b0;'+
'}'+
'#rc-solo .rc-solo-more-buttontext {'+
    'display: inline;'+
    'color: #fff;'+
    'font-size: 16px;'+
    'line-height: 26px;'+
    'font-weight: 500;'+
    'margin-right: 8px;'+
    'margin-left: 0px;'+
    'line-height: 40px;'+
'}'+
'#rc-solo .rc-hot-holder {'+
    'position: relative;'+
    'display: table;'+
    'float: right;'+
    'margin-top: -45px;'+
    'margin-right: 18px;'+
'}'+
'#rc-solo #hotnum {'+
    'display: table-cell;'+
    'vertical-align: bottom;'+
    'color:#e63e3e;'+
    'cursor:pointer;'+
    'font-size: 18px;'+
    'font-family:helvetica;'+
    'position: relative;'+
    'line-height:20px;'+
    'left:0px;'+
'}'+
'#rc-solo .rc-hot-holder-icon {'+
    'height:20px;'+
    'margin-right:3px;'+
    'vertical-align:baseline;'+
'}'+
'#rc-solo .rc-block-for-well {'+
    'width: 100%;'+
    'height: 56px;'+
'}'+
'#rc-solo.social_rc_theme {'+
    'border-radius: 0px!important;'+
    'box-shadow: rgba(0, 0, 0, 0.0980392) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.0470588) 0px 1px 1px 0px;'+
'}'+
'#rc-solo.social_rc_theme .rc-w-43583 .rc-photo {'+
    'border-top-left-radius: 0px!important;'+
    'border-top-right-radius: 0px!important;'+
    'border-bottom: 1px solid #dedede;'+
'}'+
'#rc-solo.social_rc_theme .rc-hot-holder .rc-hot-flame {'+
    'display:none;'+
'}'+
'#rc-solo .rc-hot-holder .rc-hot-social {'+
    'display:none;'+
'}'+
'#rc-solo.social_rc_theme .rc-hot-holder .rc-hot-social {'+
    'display:block;'+
'}'+
'#rc-solo.social_rc_theme .rc-solo-more-button {'+
    'background: #E9EBEE;'+
    'border: 1px solid #dedede;'+
    'box-shadow:none;'+
'}'+
'#rc-solo.social_rc_theme .rc-solo-more-button:hover {'+
    'background: #dedede;'+
'}'+
'#rc-solo.social_rc_theme .rc-solo-more-buttontext {'+
    'color:#333;'+
'}'+
'#rc-solo.social_rc_theme #hotnum {'+
    'color:#898F9C!important;'+
'}'+
'@media only screen and (max-width : 400px) {'+
    '#rc-solo .rc-hot-holder {'+
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
        'rcel.src = "//trends.revcontent.com/serve.js.php?w='+solo_widget_id+'&t="+rcel.id+"&c="+(new Date()).getTime()+"&width="+(window.outerWidth || document.documentElement.clientWidth)+"&referer="+referer;'+
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

var html = '<div id="rc-solo" class="'+RevContentSolo.theme+'_rc_theme">'+
    '<div id="rcjsload_soloserve_'+solo_widget_id+'"></div>'+
    '<div class="rc-block-for-well" onclick="rcclickfnc()">'+
        '<div class="rc-solo-more-button"><span class="rc-solo-more-buttontext">'+RevContentSolo.button_text+' ></span></div>'+
        '<div class="rc-hot-holder">'+
            '<img class="rc-hot-holder-icon rc-hot-flame" src="data:image/png;base64,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">'+
            '<img class="rc-hot-holder-icon rc-hot-social" src="data:image/png;base64,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">'+
            '<div id="hotnum"></div>' +
        '</div>'+
    '</div>'+js+
'</div>';


document.write(css);
document.write(html);