#RevShifter
RevShifter shows from the bottom or top of the page on scroll or pan. It's used by placing the script and ad code definition to a page.

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

###pub_id(required)
your pub id

###widget_id(required)
your widget id

###domain(required)
your widget domain

###closed_hours
Number of hours to keep closed
```
closed_hours: 24
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

###hide_footer
Set true to not display the disclosure text.
```
hide_footer: false
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

###scroll_natural
By default scrolling up will hide and scrolling down will show. Set to false for the opposite behavior.
```
scroll_natural: true
```

###inner\_widget\_options
Options passed to inner RevSlider. See RevSlider docs for details.
```
inner_widget_options: {
    header: 'Trending Now',
    per_row: {
        xxs: 1,
        xs: 1,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
        xxl: 5
    },
    rows: 1,
    max_headline: true,
    ad_border: false,
    text_right: true,
    text_right_height: 100
}
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


