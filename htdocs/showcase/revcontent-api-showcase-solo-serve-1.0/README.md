#Solo Serve Native

Solo Serve Native wraps a standard widget to show a button and engagement counter. Place the script and optional widget definition where the standard widget should appear.

```
&lt;script&gt;var RevContentSolo = { button_text: 'Find Out More'};&lt;/script&gt;
&lt;script type="text/javascript" id="revsoloserve" src="http://labs-cdn.revcontent.com/build/revsoloserve.min.js?w=43583">&lt;/script&gt;
```

##Standard widget dependencies
1. disclosure text and interest cog must be placed at the bottom
2. Widget must be a single ad

##Options
Default values are shown. ```w``` option is passed as query param all other options are used in widget definition.

###w(required)
widget id

###button_text
```
var RevContentSolo = { button_text: 'Find Out More'}
```

###query_params
Key value object for query params to send to server. Can be multidimensional
```
query_params: false
```

###theme
Theme available values ```default```, ```social```
```
var RevContentSolo = { theme: 'default'}
```

###url
```
var RevContentSolo = { url: 'trends.revcontent.com'}
```