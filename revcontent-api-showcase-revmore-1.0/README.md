# Mobile RevMore

Studies show that Facebook-referred mobile users never reach the bottom of the article. By truncating the page, RevMore increase the visibility of content recommendations from standard Revcontent widgets. The new page layout also improves the user experience for mobile users by allowing people to engage with as much of the article as they wish.

## How to use

Add the revmore script before the closing ```</body>``` tag

    <script type="text/javascript" src="http://cdn.revcontent.com/build/js/revmore.min.js"></script>

    <script>
        var RevMore = {
           widget_id : 222, //widget to pop inside revmore container
           button_text : 'Read Full Article', //text on the revmore button (any words)
           mobile_only : true, //only use revmore on mobile devices (true/false)
           top_pixels : 400,  //distance from top of visible window to start revmore (integer in pixels)
           environment : 'http://trends.revcontent.com/'
        };
    </script>


Insert the proper values for your widget
