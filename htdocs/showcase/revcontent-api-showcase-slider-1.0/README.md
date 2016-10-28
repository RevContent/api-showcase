#RevSlider

RevSlider is a touch enabled content slider. Use it by placing an element along with the script and ad code definition on the page

```
&lt;div id="rev-slider"&gt;&lt;div&gt;

&lt;script src="http://labs-cdn.revcontent.com/build/revslider.min.js">&lt;script&gt;

&lt;script&gt;
    new RevSlider({
        id: 'rev-slider',
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

###api_source
api_source used for tracking.
```
api_source: 'slide'
```

###buttons
Button config. Enable/disable forward/back, size, position(```dots```, ```inside```, ```outside```, ```dual```), and style(```default```, ```fly-out```).
```
{
    forward: true,
    back: true,
    size: 40,
    position: 'inside',
    style: 'default'
}
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
Number of internal ads to display. ```sponsored``` option is ignored and only internal ads are shown.
```
internal: false
```

###is_resize_bound
Determines if the inner grid will update on resize.
```
is_resize_bound: true
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

###max_headline
Show all of the headline for all ads. No ellipsis. This option overrides ```headline_size```
```
max_headline: false
```

###min_headline_height
Headline line height can not be less than this value in pixels
```
min_headline_height: 17
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

###pages
Number of pages available to paginate.
```
pages: 4
```

###pagination_dots
To show the pagination dots
```
pagination_dots: false
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

###prevent_default_pan
If the user is paning over the ad prevent the default browser behavior.
```
prevent_default_pan: true
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

###show_arrows
Show paging arrows for mobile devices or desktop.
```
{
    mobile: true,
    desktop: true
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

###touch_direction
Touch direction to listen to for pagination.
```
touch_direction: Hammer.DIRECTION_HORIZONTAL
```

###transition_duration
duration of transition when ads are rearranged on resize.
```
transition_duration: 0
```

###url
Use an alternate API url
```
url: 'https://trends.revcontent.com/api/v1/'
```

###vertical
Slide vertical rather than horizontal
```
vertical: false
```

###visible
If the widget is immediately visible. Determines if impressions will be registerred right away or if they are managed when the widget is shown.
```
visible: true
```







































