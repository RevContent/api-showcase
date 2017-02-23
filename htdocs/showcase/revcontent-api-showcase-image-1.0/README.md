#RevImage

RevImage displays from the bottom of an image. Use it by placing an id on your image along with the script and widget definition.

```
&lt;img id="rev-image-demo" src="http://goo.gl/O5NR1C"&gt;

&lt;script src="https://labs-cdn.revcontent.com/build/revimage.min.js">&lt;/script&gt;

&lt;script&gt;
var revImage = new RevImage({
    api_key : 'api_key',
    id: 'rev-image-demo',
    pub_id : 123,
    widget_id : 456,
    domain : 'mysite.com',
    buttons: {
        position: 'dots',
        size: 30
    }
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
matches a div id on the page. For example to target ```&lt;div id="my-image">&lt;/div>```
```
id: 'my-image'
```

###selector(required if id or element is not used)
query selector used to target multiple elements
```
selector: false
```

###element(required if id or selector is not used)
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

###header
Text displayed above ads. Wrapped inside ```&lt;h2 class="rev-header">```.
```
header: 'Trending'
```

###max_headline
Show all of the headline for all ads. No ellipsis. This option overrides ```headline_size```
```
max_headline: false
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

###rows
Number of rows to display. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
rows: 1
```

###text_right
Text will be positioned to the right of the image
```
text_right: false
```

###text\_right\_height
Value in pixels of the ad image if ```text_right``` is enabled. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
text_right_height: {
    xxs: 70,
    xs: 70,
    sm: 80,
    md: 80,
    lg: 100,
    xl: 100,
    xxl: 120
}
```


###url
Use an alternate API url
```
url: 'https://trends.revcontent.com/api/v1/'
```

###buttons
Button config. Enable/disable forward/back, size, position(```dots```, ```inside```, ```outside```, ```dual```), and style(```default```, ```fly-out```).
```
{
    forward: true,
    back: true
}
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


###headline_size
Number of lines that the headline can take up. Ignored if ```max_headline``` is set to true.
```
headline_size: 3
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

###overlay
Key value object where the key is the content type and the value is the icon to use. This key value will be concatenated to make up the icon name string. For example ```video: 'circle'``` will use the ```video_circle``` icon
```
overlay: false
```

###overlay_icons
Pass in custom icons where the key is the icon name and the value is the svg icon. For example ```{article_square: '&lt;svg>&lt;/svg>'}```
```
overlay_icons: false
```

###overlay_position
The position of the overlay icon. Available options include ```center```, ```top_left```, ```top_right```, ```bottom_right```, ```bottom_left```.
```
overlay_position: 'center'
```

###pagination_dots
To show the pagination dots
```
pagination_dots: true
```

###query_params
Key value object for query params to send to server. Can be multidimensional
```
query_params: false
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