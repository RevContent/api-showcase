# Exit Pop

Exit Pop is an API implementation that pops up on a user's first impression every 24 hours for non-touch enabled devices (e.g. desktops). When the user mouses off the page they are usually trying to close the window or navigate away from the page. Exit Pop is a great way to give these users one more chance to view your Revcontent API widget.

### Query string parameters:

**w** = widget id

**p** = publisher id

**k** = api key

**d** = domain

**t** = testing 

- "true" - ignores cookie and pops on every load
- "false" - (default) fires once per user every 24 hours

**i** = internal 

- "none" - (default)
- "rndm" - random assortment
- "top" - top row is internal content
- "btm"  - bottom row is internal content

**x** = device - if enabled will pop on mobile/tablet after "z" seconds of - inactivity. On mobile/tablet the user must scroll on or "engage" the site first before the timer starts

- "desktop" or "false" - (default) desktop only
- "mobile" or "mobileonly" - mobile/tablet only
- "both" or "true" - all devices enabled

**z** = numerical value, inactivity trigger duration in seconds

- defaults to 15 seconds if not provided
- minimum of 6 seconds allowed

### Example:
```<script type="text/javascript" id="rev2exit" src="http://cdn.revcontent.com/build/js/revexit.min.js?w=7609&p=3393&k=59297cd34b3bb7521d071bce3179fff434dec68a&d=pettyandposh.com&t=false&i=none&x=true&z=15"></script>```


#### Developing with RevExit

Before getting started, install all the necessary Node dependencies.

##### Install NPM Dependencies
```
$ npm install
```

##### Install Gulp (Globally)
```
$ sudo npm install -g gulp
```

In the index.html demo file, replace the script tag with the Pkgd version of revexit.js.

```
    <script id="rev2exit" src="./build/revexit.pkgd.js?w=6181&p=945&k=3eeb00d786e9a77bbd630595ae0be7e9aa7aff3b&d=apiexamples.powr.com&x=both&t=true&ml=264a750c769cda934aac822bba33c4b9-us5;a73dfe376f;;"></script>

```

###### Source Files

###### Building Sources (Minify, Production-ready assets)



##### Gulp Build Output

```
➜  revcontent-api-showcase-exitpop-1.0 git:(feature/revexit-migration) ✗ gulp
[22:44:08] Using gulpfile ~/htdocs/showcase/revcontent-api-showcase-exitpop-1.0/gulpfile.js
[22:44:08] Starting 'revexit-css'...
[22:44:08] Starting 'revchimp-css'...
[22:44:08] Finished 'revexit-css' after 238 ms
[22:44:08] Finished 'revchimp-css' after 223 ms
[22:44:08] Starting 'revchimp-inject'...
[22:44:08] gulp-inject 1 files into revchimp.js.
[22:44:08] Finished 'revchimp-inject' after 19 ms
[22:44:08] Starting 'build-rx'...
[22:44:08] Finished 'build-rx' after 511 ms
[22:44:08] Starting 'default'...
[22:44:08] Finished 'default' after 28 μs
```
