#RevExit

RevExit comes to view as the user mouses off the page on desktop or remains idle on mobile. It's used by placing a script like shown below.

```
&lt;script id="rev2exit" src="http://labs-cdn.revcontent.com/build/revexit.min.js?w=123&p=456&k=123abc&d=mysite.com&x=both" type="text/javascript"&gt;&lt;/script&gt;
```

##Options
Default values are shown.

All options are passed in to the script as query parameters.

###w
widget id

###p
publisher id

###k
api key

###d
domain

###t
testing (set value to true to always pop onload, no cookie check!) default is false

###i
internal (none, rndm, top, btm, or all) default is none, internal ads will have provider labels attached, set to "all" for internal only

###s
change api end point server, ex: s=trends-stg.revcontent.com, default is production (trends.revcontent.com)

###x
"both" or "true", default is "both", can also can be set to "mobileonly" or "mobile" if enabled will pop on mobile/tablet after "z" seconds of inactivity, for Desktop only use "desktop" or "false"

###z
inactivity trigger duration in seconds, defaults to 6 seconds if not provided, minimum of 6 seconds allowed

###j
background mode, defaults to "default", options are "classic", "default" OR custom RGBA OR Hexadecimal color OR a handful of HTML color names (red, blue etc.)

###ps
Panel Size, choices are "3x2" or "4x2" defaults to 4x2, NOTE: for HD modes only!

###ml
"Mailing List" Feature, multi-key parameter for Mailchimp Integration, ml=API_KEY;LIST_ID;HEADLINE;MESSAGE;BUTTON;THEME;CHOICES, default = disabled, THEME options are "taskbar" or "tile", CHOICES is comma separated list of options.

###ch
"Closed Hours", The interval at which RevExit will remain closed for. Defaults to 24 Hours or 1-day if not provided.

###r
"Regions" or zones that RevExit will trigger once departed, default = "all", can be set to "top", "bottom", "left" or "right". Combinations are also accepted, ex. "left,right"

###dl
"Disclosure Label", allows custom branding label to meet FTC guidelines, defaults to "Sponsored by Revcontent", 50 Character limit

###po
"Provider Options", control display of provider label on ad units. Choices are "disabled", "all", "sponsored" or "internal" (Default)

###q
"query_params", key value object for query params to send to server. Can be multidimensional