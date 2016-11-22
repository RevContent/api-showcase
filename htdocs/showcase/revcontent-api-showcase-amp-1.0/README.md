#AMP

The Accelerated Mobile Pages (AMP) Project is an open source initiative that embodies the vision that publishers can create mobile optimized content once and have it load instantly everywhere. Learn more at [www.ampproject.org](http://www.ampproject.org)

```
&lt;amp-ad width="320" height="470"
        layout="responsive"
        heights="(min-width:320px) and (max-width:480px) 440vw, (min-width:480px) and (max-width:768px) 110vw, (min-width:768px) and (max-width:1280px) 70vw, (min-width: 1280px) and (max-width: 1600px) 45vw, (min-width: 1600px) 40vw, 150vh"
        type="revcontent"
        data-wrapper="rcjsload_2ff711"
        data-endpoint="trends.revcontent.com"
        data-ssl="true"
        data-id="2723">

    <div placeholder>200 Billion Content recommendations!</div>
    <div fallback>200 Billion Content recommendations!</div>
&lt;/amp-ad>
```

##Options

###Widget ID
The Widget ID to load.

###Widget Width
The Width of the AMP Ad

###Widget Height
The Height of the AMP Ad

###Wrapper
Load container ID, defaults to rcjsload_2ff711

###SSL Mode
Turn ON/OFF ssl, defaults to true.

###Endpoint
Use a custom delivery endpoint/server.