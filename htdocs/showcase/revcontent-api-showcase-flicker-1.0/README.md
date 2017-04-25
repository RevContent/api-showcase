#RevFlicker

RevFlicker is a touch enabled content carousel. Use it by placing an element along with the script and ad code definition on the page.

```
&lt;div id="rev-flicker"&gt;&lt;/div&gt;

&lt;script src="http://labs-cdn.revcontent.com/build/revflicker.min.js">&lt;/script&gt;

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

###domain(required)
your widget domain

###pub_id(required)
your pub id

###widget_id(required)
your widget id

###id(required if element is not used)
matches a div id on the page. For example to target ```&lt;div id="my-flicker">&lt;/div>```
```
id: 'my-flicker'
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

###square_border
Display square borders.
```
square_border: false
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
Text displayed above ads. Wrapped inside ```&lt;h2 class="rev-header">```.
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

###image_overlay
Key value image overlay object config where the key is the content type and the value is the icon to use. For example to use the ```video_rectangle``` icon for video content use ```video: 'video_rectangle'```. The icon will be appended to the ```.rev-image``` element.
```
image_overlay: false
```

###image\_overlay\_position
The position of the image overlay icon. Available options include ```center```, ```top_left```, ```top_right```, ```bottom_right``` and ```bottom_left```.
```
image_overlay_position: 'center'
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

###overlay_icons
Pass in custom icons where the key is the icon name and the value is the svg icon. For example ```{article_square: '&lt;svg>&lt;/svg>'}```. Default icons include ```video_rectangle```, ```video_square```, ```video_circle1```, ```video_circle2``` and ```video_triangle```.
```
overlay_icons: false
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

The example below demonstrates how to pass subid values. The resulting query parameters will be ```?revsub[key]=value```
```
query_params: {
    revsub: {
        key: 'value'
    }
}
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

###text_top
Text will be positioned above the image
```
text_top: false
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

###arrow_style
Next/Previous arrow style. Can be circle or square.
```
arrow_style: 'circle'
```

###trending
Show trending number count. 
```
trending: false
```

###trending_theme
Theme for trending. Can be default or social.
```
trending_theme: 'default'
```