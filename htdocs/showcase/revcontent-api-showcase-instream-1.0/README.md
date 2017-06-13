#In-stream

In-stream is a full container width or full viewport width widget. Use it by placing an element along with the script and ad code definition on the page.

```
&lt;div id="rev-instream"&gt;&lt;/div&gt;

&lt;script src="http://labs-cdn.revcontent.com/build/revinstream.min.js">&lt;/script&gt;

&lt;script&gt;
    new RevSlider({
        id: 'rev-instream',
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
matches a div id on the page. For example to target ```&lt;div id="my-widget">&lt;/div>```
```
id: 'my-widget'
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
api_source: 'instr'
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

###header
Text displayed above ads. Wrapped inside ```&lt;h2 class="rev-header">```.
```
header: 'Trending Now'
```

###headline_size
Number of lines that the headline can take up. Ignored if ```max_headline``` is set to true.
```
headline_size: 3
```

###hide_provider
Display the provider in the ads.
```
hide_provider: false
```

###hide_header
Set true to not display the headerl
```
hide_header: false
```

###hide_footer
Set true to not display the disclosure text.
```
hide_footer: false
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

###image_ratio
Ratio of the images. Available options include ```wide_rectangle```, ```rectangle```, ```square```.
```
image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle')
```

###impression_tracker
Pass in a variable array reference to use as the impression tracker. Allows for 2 widgets to share the same impressions.
```
impression_tracker: []
```

###internal
Display internal ads. The ```sponsored``` option is ignored and only internal ads are shown.
```
internal: false
```

###is\_resize\_bound
Determines if the inner grid will update on resize.
```
is_resize_bound: true
```

###overlay_icons
Pass in custom icons where the key is the icon name and the value is the svg icon. For example ```{article_square: '&lt;svg>&lt;/svg>'}```. Default icons include ```video_rectangle```, ```video_square```, ```video_circle1```, ```video_circle2``` and ```video_triangle```.
```
overlay_icons: false
```

###lazy_load_images
Load images when the widget gets close to entering the viewport. Uses the ```lazy_load_images_buffer``` to determine when the images should load.
```
lazy_load_images: true
```

###lazy\_load\_images_buffer
The buffer distance for determining when images will be loaded. This gives the images time to load before the widget comes to view.
```
lazy_load_images_buffer: 500
```

###link_button
Append a link button(```&lt;div class="rev-link-button" style="line-height: 16px; height: 16px;">Visit Site&lt;/div>```) to the ```.rev-ad-inner``` element
```
link_button: false
```

###link\_button_text

```
link_button_text: 'Visit Site'
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

###window_width_devices
Devices to enable the full viewport/window width feature where the widget will stretch the entire viewport width.
```
window_width_devices: [
    'phone'
]
```







































