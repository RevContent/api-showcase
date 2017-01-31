#RevToaster

RevToaster displays as the user scrolls back to the top of the page. It's used by placing the script and ad code definition on the page.

```
&lt;script src="http://labs-cdn.revcontent.com/build/revtoaster.min.js">&lt;script&gt;

&lt;script&gt;
    RevToaster({ 
        api_key: 'ap_key', 
        pub_id: 123, 
        widget_id: 456, 
        domain: 'mysite.com',
        sponsored: 2
    }); 
&lt;/script&gt;
```

##Options
Default values are shown.

###api_key(required)
your api key

###domain(required)
your widget domain

###pub_id(required)
your pub id

###widget_id(required)
your widget id

###closed_hours
Number of hours to keep closed
```
closed_hours: 24
```

###css
Additional CSS to append.
```
css: ''
```

###devices
Devices to show on. Options include ```phone```, ```tablet``` and ```desktop```.
```
devices: [
    'phone', 
    'tablet'
]
```

###disclosure_text
Text to display for disclosure. This text triggers the disclosure/interests dialog on click.
```
disclosure_text: 'Sponsored by Revcontent'
```

###header
Text displayed above ads. Wrapped inside ```<h2 class="rev-header">```.
```
header: 'Trending Now'
```

###hide_provider
Display the provider in the ads.
```
hide_provider: false
```

###overlay
Key value object where the key is the content type and the value is the icon to use. This key value will be concatenated to make up the icon name string. For example ```video: 'circle'``` will use the ```video_circle``` icon
```
overlay: false
```

###overlay_icons
Pass in custom icons where the key is the icon name and the value is the svg icon. For example ```{article_square: '<svg></svg>'}```
```
overlay_icons: false
```

###overlay_position
The position of the overlay icon. Available options include ```center```, ```top_left```, ```top_right```, ```bottom_right```, ```bottom_left```.
```
overlay_position: 'center'
```

###query_params
Key value object for query params to send to server. Can be multidimensional
```
query_params: false
```

###rev_position
Position of the disclosure text. Options include: ```'bottom_right'```, ```'top_right'```, ```'bottom_left'```.
```
rev_position: 'bottom_right'
```

###show\_visible\_selector
query selector for element that will trigger widget to show once visible
```
show_visible_selector: false
```

###sponsored
Number of sponsored ads to show. Max 2.
```
sponsored: 1
```

###testing
Ignores ```closed_hours``` if true
```
testing: false
```

###url
Use an alternate API url
```
url: 'https://trends.revcontent.com/api/v1/'
```

###user_agent
Pass user_agent param to API
```
user_agent: false
```

###user_ip
Pass user_ip to API
```
user_ip: false
```








