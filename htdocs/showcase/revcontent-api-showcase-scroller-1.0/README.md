#RevScroller

RevScroller is a scroll activated widget. As the user scrolls the page the widget will automatically paginate. Use it by placing an element along with the script and ad code definition on the page

```
&lt;div id="rev-scroller"&gt;&lt;/div&gt;

&lt;script src="http://labs-cdn.revcontent.com/build/revscroller.min.js">&lt;/script&gt;

&lt;script&gt;
    new RevScroller({
        id: 'rev-scroller',
        api_key: 'api_key',
        pub_id: 123,
        widget_id: 456,
        domain: 'mysite.com'
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

###id(required if element is not used)
matches a div id on the page. For example to target ```&lt;div id="my-slider">&lt;/div>```
```
id: 'my-slider'
```

###element(required if id is not used)
A jQuery wrapped element, will be used instead of ```id``` option
```
element: false
```

###ad_overlay
Key value ad overlay config object where the key is the content type and the value is the icon to use. For example to use the ```video_rectangle``` icon for video content use ```video: 'video_rectangle'```. The icon will be appended to the ```.rev-ad``` element.
```
ad_overlay: false
```

###ad\_overlay\_position
The position of the ad overlay icon. Available options include ```center```, ```top_left```, ```top_right```, ```bottom_right``` and ```bottom_left```.
```
ad_overlay_position: 'bottom_right'
```

###api_source
api_source used for tracking.
```
api_source: 'scrol'
```

###auto_scroll
Paginate the widget as the page scrolls.
```
auto_scroll: true
```

###css
Additional CSS to append.
```
css: ''
```

###column_spans
Array of objects that contain a ```spans``` and ```selector``` key value pairs. Where selector is the item to target and the spans is the number of spans. 
```
column_spans: false
```
For example to have the 4th child of the md layout to be 2 spans use the following:
```
column_spans: [
    {
        spans: 2,
        selector: "#rev-slider.rev-slider-breakpoint-md .rev-content:nth-child(4)",
    }
]
```

###devices
Devices to show on. Options include ```phone```, ```tablet``` and ```desktop```.
```
devices: [
    'phone', 
    'tablet', 
    'desktop'
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

###headline_size
Number of lines that the headline can take up. Ignored if ```max_headline``` is set to true.
```
headline_size: 3
```

###max_headline
Show all of the headline for all ads. No ellipsis. This option overrides ```headline_size```
```
max_headline: false
```

###multipliers
Tweak sizing relative to the ad size. Can be negative values.
```
{
    line_height: 0,
    margin: 0,
    padding: 0
}
```

###per_row
Number of ads per row. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
per_row: {
    xxs: 1,
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    xxl: 5
}
```

###query_params
Key value object for query params to send to server. Can be multidimensional
```
query_params: false
```

###rev_position
Position of the disclosure text if ```hide_disclosure``` is not enabled. Options include: ```'bottom_right'```, ```'top_right'``` and ```'bottom_left'```.
```
rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right')
```

###rows
Number of rows to display. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
rows: {
    xxs: 2,
    xs: 2,
    sm: 2,
    md: 2,
    lg: 2,
    xl: 2,
    xxl: 2
}
```

###transition_duration_multiplier
Allows the transition duration to be modified. The distance of the transition will be multiplied by the ```transition_duration_multiplier``` to arrive at a value in milliseconds. For example, if the transition is 100 pixels the transition will take 300ms.
```
transition_duration_multiplier: 3
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