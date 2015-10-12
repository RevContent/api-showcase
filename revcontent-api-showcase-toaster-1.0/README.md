# Mobile Toaster

Pop! Content toasters are an engaging way to interact with your readers. The Mobile Toaster will appear as the user pans back to the top of the page and disapear as they scroll back down. Show your reader what's trending and get great results with the Mobile Toaster.

## How to use

Add the packaged or minified revtoaster script before the closing ```</body>``` tag

    <script src="js/revtoaster.min.js"></script>

    <script>
        var is_blocked = 'false';
        (function() {
            function ad_block_test(e,o){if("undefined"!=typeof document.body){var t="0.1.2-dev",o=o?o:"sponsorText",n=document.createElement("DIV");n.id=o,n.style.position="absolute",n.style.left="-999px",n.appendChild(document.createTextNode("&nbsp;")),document.body.appendChild(n),setTimeout(function(){if(n){var o=0==n.clientHeight;try{}catch(d){console&&console.log&&console.log("ad-block-test error",d)}e(o,t),document.body.removeChild(n)}},175)}}
            ad_block_test(function(is_var){
                is_blocked = is_var;
                RevToaster({
                    api_key: 'your api_key',
                    pub_id: pub_id,
                    widget_id: widget_id,
                    domain: 'widget domain',
                    sponsored: 2,
                    adp: true
                });
            });
        })();
    </script>

Insert the proper values for your widget and optionally set the ```sponsored``` count(accepted values are 1 or 2 sponsored ads).

## Building
Gulp is used to embed css, concat and uglify the revtoaster script. To build the scripts:
1. change directory to the revcontent-api-showcase-toaster-1.0 directory
2. run ```npm install``` to get the gulp dependencies
3. run ```gulp``` this will run the default task and populate the build directory

## Watch
During development it can be useful to build the files on the fly when modifications are made. To have gulp watch the ./js/revtoaster and ./css/example.css files run ```gulp watch```
