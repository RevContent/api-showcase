#RevSideShifter

RevSideShifter overlays the page when triggered with a swipe or button press. It's used by placing the script and ad code definition on the page.

```
&lt;script src="http://labs-cdn.revcontent.com/build/revsideshifter.min.js">&lt;/script&gt;

&lt;script&gt;
    new RevSideShifter({
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
api_source: 'side'
```

###button_devices
By default the button will only show on desktop. This option works and accepts the same array as ```devices``` option. Add ```tablet``` or ```phone``` to show the button on these devices as well.
```
button_devices: ['desktop']
```

###button_icon
By default the button icon will be a plus sign that transitions to a X when clicked. Other options include ```flame``` and ```bell```.
```
button_icon: 'plus'
```

###opened_hours
Number of hours to show 0 and empty bell after SideShifter is opened. (only used for bell icon)
```
opened_hours: 8
```

###css
Additional CSS to append.
```
css: ''
```

###column_spans
Array of objects that contain a ```spans``` and ```selector``` key value pairs. Where selector is the item to target and the spans is the number of spans. Can be boolean for all ads or an array of selectors with optional media to target sepecific ads. Define the spans on a per item basis using the spans key.
```
column_spans: [
    {
        selector: '.rev-slider-breakpoint-gt-xs .rev-content:nth-child(1), .rev-slider-breakpoint-gt-sm .rev-content:nth-child(n+6), .rev-slider-breakpoint-sm .rev-content',
        spans: 2
    },
    {
        selector: '.rev-slider-breakpoint-gt-md .rev-content:nth-child(n+6)',
        spans: 1
    }
]
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

###fit_height
By default the ads will continue until the entire height of the container is filled. Disable this functionality by setting this ```false```
```
fit_height: true
```

###header
Text displayed above ads. Wrapped inside ```<h2 class="rev-header">```.
```
header: 'Trending'
```

###headline_size
Number of lines that the headline can take up. Ignored if ```max_headline``` is set to true.
```
headline_size: 3
```

###height_percentage
Use a percentage of the window height rather than the full height.
```
height_percentage: false
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
Ratio of the images. Available options include ```wide_rectangle```, ```rectangle```, ```square``` and ```tall_rectangle```. Can be boolean for all ads or an array of selectors with optional media to target sepecific ads. Define image_ratio on a per item basis using the ratio key.
```
image_ratio: [
    {
        selector: '.rev-slider-breakpoint-gt-sm .rev-content:nth-child(n+6), .rev-slider-breakpoint-lt-md .rev-content:nth-child(n+3), .rev-slider-breakpoint-lt-sm .rev-content:nth-child(n+2)',
        ratio: 'tall_rectangle'
    },
    {
        media: '(orientation: landscape)',
        selector: '#rev-slider.rev-slider-breakpoint-lt-md .rev-content',
        ratio: 'rectangle'
    }
]
```

###max_headline
Show all of the headline for all ads. No ellipsis. This option overrides ```headline_size```
```
max_headline: false
```

###min_height
Don't allow the unit to be less than this value in pixels when using the ```height_percentage ``` option.
```
min_height: false
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

###overlay_icons
Pass in custom icons where the key is the icon name and the value is the svg icon. For example ```{article_square: '&lt;svg>&lt;/svg>'}```. Default icons include ```video_rectangle```, ```video_square```, ```video_circle1```, ```video_circle2``` and ```video_triangle```.
```
overlay_icons: false
```

###per_row
Number of ads per row. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
per_row: {
    xxs: 1,
    xs: 1,
    sm: 4,
    md: 4,
    lg: 4,
    xl: 4,
    xxl: 4
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
rev_position: 'top_right'
```

###rows
Number of rows to display. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
rows: 3
```

###show_visible_selector
Selector passed to ```document.querySelectorAll```. The first found element will be used to show the unit once it's reached and hide the unit when scrolling back the other way.
```
show_visible_selector: false
```

###side
By default the button position and transition will be from the right side. Change this to ```left``` to show from the other side.
```
side: 'right'
```

###stacked
If true each column will stack on top of each other without considering the max height for the row above. The default will provide a level top for each item in the row.
```
stacked: false
```

###text_overlay
Text will overlay the image rather than be position below it. Can be boolean for all ads or an array of selectors with optional media to target sepecific ads.
```
text_overlay: [
    {
        selector: '.rev-slider-breakpoint-gt-sm .rev-content:nth-child(-n+5)'
    },
    {
        media: '(orientation: landscape)',
        selector: '#rev-slider.rev-slider-breakpoint-lt-md .rev-content'
    }
]
```

###text_right
Text will be positioned to the right of the image. Can be boolean for all ads or an array of selectors with optional media to target sepecific ads.
```
text_right: [
    {
        selector: '.rev-slider-breakpoint-gt-sm .rev-content:nth-child(n+6), .rev-slider-breakpoint-lt-md .rev-content:nth-child(n+3), .rev-slider-breakpoint-lt-sm .rev-content:nth-child(n+2)'
    }
]
```

###touch_devices
By default the touch gestures are enabled on ```phone``` and ```tablet```. This option works and accepts the same array as ```devices``` option. Add ```desktop``` to show the button on these devices as well.
```
button_devices: ['phone', 'tablet']
```

###transition\_duration\_multiplier
Allows the transition duration to be modified. The distance of the transition will be multiplied by the ```transition_duration_multiplier``` to arrive at a value in milliseconds. For example, if the transition is 100 pixels the transition will take 200ms.
```
transition_duration_multiplier: 2
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