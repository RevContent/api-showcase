#RevShifter
RevShifter shows from the bottom or top of the page on scroll or pan. It's used by placing the script and ad code definition on the page.

```
&lt;script src="http://labs-cdn.revcontent.com/build/revshifter.min.js">&lt;script&gt;

&lt;script&gt;
    new RevShifter({
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

###ad_border
Display a border around each ad
```
ad_border: false
```

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

###hide_footer
Set true to not display the disclosure text.
```
hide_footer: false
```

###hide_header
Set true to not display the headerl
```
hide_header: true
```

###hide\_on\_show\_transition
Set false to prevent RevShifter from hiding while it is still in a show transition.
```
hide_on_show_transition: true
```

###hide_provider
Display the provider in the ads.
```
hide_provider: false
```

###max_headline
Show all of the headline for all ads. No ellipsis. This option overrides ```headline_size```
```
max_headline: true
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
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    xxl: 5
}
```

###side
Show from the top or bottom of the page
```
side: 'bottom'
```

###show\_on\_load
Show right away on page load without waiting for a user scroll.
```
show_on_load: false
```

###show\_on\_scroll
Show on vertical scroll event
```
show_on_scroll: true
```

###show\_on\_touch
Show on vertical pan touch gesture
```
show_on_touch: true
```

###show\_visible\_selector
query selector for element that will trigger widget to show once visible
```
show_visible_selector: false
```

###scroll_natural
By default scrolling up will hide and scrolling down will show. Set to false for the opposite behavior.
```
scroll_natural: true
```

###query_params
Key value object for query params to send to server. Can be multidimensional
```
query_params: false
```

###rows
Number of rows to display. Object or single value. Pass a single number to be used for every breakpoint or provide a value for each breakpoint.
```
rows: 1
```

###touch_simulation
Shows an animation with a finger icon showing that the grid can be paginated.
```
touch_simulation: false
```

###testing
Ignores ```closed_hours``` if true
```
testing: false
```

###text_right
Text will be positioned to the right of the image
```
text_right: true
```

###text\_right\_height
Value in pixels of the ad image if ```text_right``` is enabled
```
text_right_height: 100
```

###transition_duration
Duration in milliseconds that it takes for RevShifter to show from the bottom/top of the page.
```
transition_duration: 1200
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
