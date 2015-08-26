# Exit Pop

Exit Pop is an API implementation that pops up on a user's first impression every 24 hours for non-touch enabled devices (e.g. desktops). When the user mouses off the page they are usually trying to close the window or navigate away from the page. Exit Pop is a great way to give these users one more chance to view your Revcontent API widget.

## With RevExit 2.0 we have a couple sweet features/variables at our disposal

- Ability to deliver internal content
- Ability to deliver on touch-enabled devices (mobile/tablet) after a defined - Period of user inactivity (minimum 6 seconds, default 15 seconds)
- Ability to adjust frequency of deliver (once every 24 hours or once every visit)

### Query string parameters you can use:
**w** = widget id

**p** = publisher id

**k** = api key

**d** = domain

**t** = testing 

"true" - ignores cookie and pops on every load
"false" - (default) fires once per user every 24 hours

**i** = internal 
"none" - (default)
"rndm" - random assortment
"top" - top row is internal content
"btm"  - bottom row is internal content

**x** = device - if enabled will pop on mobile/tablet after "z" seconds of inactivity. On mobile/tablet the user must scroll on or "engage" the site first before the timer starts
"desktop" or "false" - (default) desktop only
"mobile" or "mobileonly" - mobile/tablet only
"both" or "true" - all devices enabled

**z** = numerical value, inactivity trigger duration in seconds
defaults to 15 seconds if not provided
minimum of 6 seconds allowed

### Example:
```<script type="text/javascript" id="rev2exit" src="http://cdn.revcontent.com/build/js/revexit.min.js?w=7609&p=3393&k=59297cd34b3bb7521d071bce3179fff434dec68a&d=pettyandposh.com&t=false&i=none&x=true&z=15"></script>```