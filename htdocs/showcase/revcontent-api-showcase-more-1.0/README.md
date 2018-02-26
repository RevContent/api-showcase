#RevMore

RevMore locks the page to display a widget. It can optionally share impressions with an in article widget. Use it by placing an optional in article element, top element, script and ad code definition on the page.

```
&lt;div id="top-id"&gt;&lt;/div&gt;

&lt;div id="in-article"&gt;&lt;/div&gt;

&lt;script src="http://labs-cdn.revcontent.com/build/revmore.min.js">&lt;/script&gt;

&lt;script&gt;
    new RevMore({
        top_id: 'top-id',
        id: 'in-article',
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

###buttons
Button config. Enable/disable forward/back, size, position(```dots```, ```inside```, ```outside```, ```dual```), and style(```default```, ```fly-out```).
```
{
    forward: true,
    back: true
}
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

###hide_selectors
Pass an array of query selectors to look for. If/when these elements become visible they will be set to display: none. When the screen is unlocked, they return to previous display state.
```
hide_selectors: false
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

###id
Id for in article/page widget to share impressions with.
```
id: false
```

###image_ratio
Ratio of the images. Available options include ```wide_rectangle```, ```rectangle```, ```square```.
```
image_ratio: (revDetect.mobile() ? 'wide_rectangle' : 'rectangle')
```

###overlay_icons
Pass in custom icons where the key is the icon name and the value is the svg icon. For example ```{article_square: '&lt;svg>&lt;/svg>'}```. Default icons include ```video_rectangle```, ```video_square```, ```video_circle1```, ```video_circle2``` and ```video_triangle```.
```
overlay_icons: false
```

###pagination_dots
To show the pagination dots
```
pagination_dots: true
```

###per_row
Number of ads per row. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
per_row: {
    xxs: 2,
    xs: 2,
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
rev_position: 'top_right'
```

###rows
Number of rows to display. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
rows: 2
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

###wrapper_id
Existing outermost page container div
```
wrapper_id: 'global_wrapper'
```