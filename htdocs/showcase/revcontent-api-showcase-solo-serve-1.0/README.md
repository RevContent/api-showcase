#Solo Serve Native

Solo Serve Native wraps a standard widget to show a button and engagement counter. Place the script and optional widget definition where the standard widget should appear.

```
&lt;script&gt;var RevContentSolo = { widget_id: 123, button_text: 'Find Out More'};&lt;/script&gt;
&lt;script type="text/javascript" id="revsoloserve" src="http://labs-cdn.revcontent.com/build/revsoloserve.min.js">&lt;/script&gt;
```

##Standard widget dependencies
1. disclosure text and interest cog must be placed at the bottom
2. Widget must be a single ad

##Options
Default values are shown.

###widget_id(required)
```
var RevContentSolo = { widget_id: 123 };
```

###button_text
```
var RevContentSolo = { button_text: 'Find Out More' };
```

###devices
Devices to show on. Options include ```phone```, ```tablet``` and ```desktop```.
```
var RevContentSolo = { devices: false }; // shows on all devices by default
```

###query_params
Key value object for query params to send to server. Can be multidimensional
```
var RevContentSolo = { query_params: false };
```

The example below demonstrates how to pass subid values. The resulting query parameters will be ```?revsub[key]=value```
```
var RevContentSolo = { 
    query_params: {
        revsub: {
            key: 'value'
        }
    }
};
```

###theme
Theme available values ```default```, ```social```
```
var RevContentSolo = { theme: 'default'};
```

###url
```
var RevContentSolo = { url: 'trends.revcontent.com'};
```