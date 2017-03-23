#RevMore Standard

RevMore Standard uses a standard widget inside the RevMore wrapper. Use it by placing an optional in article widget passing empty=1, top element, script and widget definition on the page.

```
&lt;div id="top-id"&gt;&lt;/div&gt;

&lt;div id="rcjsload_a122d7"&gt;&lt;/div&gt;
&lt;script type="text/javascript"&gt;
(function() {
var referer="";try{if(referer=document.referrer,"undefined"==typeof referer)throw"undefined"}catch(exception){referer=document.location.href,(""==referer||"undefined"==typeof referer)&&(referer=document.URL)}referer=referer.substr(0,700);
var rcel = document.createElement("script");
rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
rcel.type = 'text/javascript';
rcel.src = "//trends.revcontent.com/serve.js.php?empty=1&w=456&t="+rcel.id+"&c="+(new Date()).getTime()+"&width="+(window.outerWidth || document.documentElement.clientWidth)+"&referer="+referer;
rcel.async = true;
var rcds = document.getElementById("rcjsload_a122d7"); rcds.appendChild(rcel);

})();
&lt;/script&gt;

&lt;script src="http://labs-cdn.revcontent.com/build/revmore-standard.min.js">&lt;/script&gt;

&lt;script&gt;
    new RevMore({
        widget_id: 456,
        top_id: 'top-id'
    });
&lt;/script&gt;
```

##Options
Default values are shown.

###widget_id(required)
your widget id

###devices
Devices to show on. Options include ```phone```, ```tablet``` and ```desktop```.
```
devices: [
    'phone', 
    'tablet', 
    'desktop'
]
```

###distance
Number in pixels from the top of the page that the top of the gradient will start.
```
distance: 500
```

###gradient_height
Number in pixels for the height of the gradient.
```
gradient_height: 60
```

###hide_selectors
Pass an array of query selectors to look for. If/when these elements become visible they will be set to display: none. When the screen is unlocked, they return to previous display state.
```
hide_selectors: false
```

###query_params
Key value object for query params to send to server. Can be multidimensional
```
query_params: false
```

The example below demonstrates how to pass subid values. The resulting query parameters will be ```?revsub[key]=value```
```
query_params: {
    revsub: {
        key: 'value'
    }
}
```

###top_id
Id for element where the top of the gradient should start. This will override the ```distance``` option.
```
top_id: false
```

###unlock_text
Text for the unlock button.
```
unlock_text: 'Read More...'
```

###url
Use an alternate API url
```
url: 'https://trends.revcontent.com/api/v1/'
```