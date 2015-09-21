# Flicker


With responsive styling and touch enabled gestures Flicker puts the fun into your content slider. You can configure the Flicker widget to show on phone, tablet and desktop and you can even decide how many units to display at various breakpoints. Include Flicker on your page and let the engagement begin!

## How to use

Add the packaged or minified revtoaster script before the closing ```</body>``` tag

    <script src="js/revflicker.min.js"></script>

Insert the proper values for your widget and set any optional options

    <script>
        new RevFlicker({
            id: 'rev-flicker',
            api_key: 'your api_key',
            pub_id: pub_id,
            widget_id: widget_id,
            domain: 'widget domain'
        });
    </script>

Add the html div to the page with matching id

    <div id="rev-flicker"></div>

## Optional options

**per_row** - defines how many ads are visible at various breakpoints

    per_row: {
        xxs: 1,
        xs: 1,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
        xxl: 7
    }

**devices** - Determines what devices the widget will be displayed on. Default is all devices

    devices:  ['phone', 'tablet', 'desktop']

**header** - Header text value

    header: 'Trending Now',

**rev_position** - position of Revcontent link, options include ```top_right```, ```bottom_left``` and ```bottom_right```. Default is ```bottom_right``` for mobile and ```top_right``` otherwise

    rev_position:  (revDetect.mobile() ? 'bottom_right' : 'top_right'

**next_width** - the width of the next/halved ad

    next_width: 60

**next_effect** - whether or not to add an effect to the next/halved ad

    next_effect: true

**sponsored** - number of ads to display

    sponsored: 10

## Building
Gulp is used to embed css, concat and uglify the revtoaster script. To build the scripts:
1. change directory to the revcontent-api-showcase-toaster-1.0 directory
2. run ```npm install``` to get the gulp dependencies
3. run ```gulp``` this will run the default task and populate the build directory

## Watch
During development it can be useful to build the files on the fly when modifications are made. To have gulp watch the ./js/revtoaster and ./css/example.css files run ```gulp watch```
