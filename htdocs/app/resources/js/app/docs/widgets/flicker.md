#RevFlicker

RevFlicker is a touch enabled content carousel. Use it by placing an element along with the script and ad code definition on the page.

```
&lt;div id="rev-flicker"&gt;&lt;div&gt;

&lt;script src="http://labs-cdn.revcontent.com/build/revflicker.min.js">&lt;script&gt;

&lt;script&gt;
    new RevFlicker({
        id: 'rev-flicker',
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

###pub_id(required)
your pub id

###widget_id(required)
your widget id

###domain(required)
your widget domain

###id(required if element is not used)
matches a div id on the page. For example to target ```<div id="myFlicker"></div></div>```
```
id: 'myFlicker'
```

###element(required if id is not used)
A jQuery wrapped element, will be used instead of ```id``` option
```
element: false
```

###ad_border
Display a border around each ad
```
ad_border: true
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
    'tablet', 
    'desktop'
]
```

###disclosure_text
Text to display for disclosure. This text triggers the disclosure/interests dialog on click.
```
disclosure_text: 'Sponsored by Revcontent'
```

###dots
To show the pagination dots
```
dots: false
```

###header
Text displayed above ads. Wrapped inside ```<h2 class="rev-header">```.
```
header: 'Trending Now'
```

###headline_size
Number of lines that the headline can take up. Ignored if ```max_headline``` is set to true.
```
headline_size: 2
```

###hide_provider
Display the provider in the ads.
```
hide_provider: false
```

###image_ratio
Ratio of the images. Available options include ```wide_rectangle```, ```rectangle```, ```square```.
```
image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle')
```

###hide_disclosure
Set true to not display the disclosure text.
```
hide_disclosure: false
```

###hide_header
Set true to not display the headerl
```
hide_header: false
```

###internal
Number of internal ads to display. ```sponsored``` option is ignored and only internal ads are shown.
```
internal: false
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
    font_size: 0,
    margin: 0,
    padding: 0
}
```

###next_effect
Allows the next/halved ad to have a slight transition.
```
next_effect: true
```

###next_width
false
```
next_width: false
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

###per_row
Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
per_row: {
    xxs: 1,
    xs: 1,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
    xxl: 7
}
```

###query_params
Key value object for query params to send to server. Can be multidimensional
```
query_params: false
```

###rev_position
Position of the disclosure text if ```hide_disclosure``` is not enabled. Options include: ```'bottom_right'```, ```'top_right'```, ```'bottom_left'```.
```
rev_position: (revDetect.mobile() ? 'bottom_right' : 'top_right')
```

###show_arrows
Show paging arrows for mobile devices or desktop.
```
{
    mobile: false,
    desktop: true
}
```

###size
Set fixed size for various measurements.
```
{
    margin: false,
    image_height: false,
    headline_line_height: false,
    headline_margin_top: false,
    provider_line_height: false,
    provider_margin_top: false,
    provider_margin_bottom: false,
    inner_margin: false
}
```

###sponsored
Number of sponsored ads to show. ```internal``` option overrides this value to only show internal.
```
sponsored: 10
```

###text_overlay
Text will overlay the image rather than be position below it
```
text_overlay: false
```

###text_right
Text will be positioned to the right of the image
```
text_right: false
```

###text\_right\_height
Value in pixels of the ad image if ```text_right``` is enabled
```
text_right_height: 100
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