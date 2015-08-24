# Mobile Toaster

Pop! Content toasters are an engaging way to interact with your readers. The Mobile Toaster will appear as the user pans back to the top of the page and disapear as they scroll back down. Show your reader what's trending and get great results with the Mobile Toaster.

## How to use

Add the packaged or minified revtoaster script before the closing ```</body>``` tag

    <script src="js/revtoaster.pkgd.js"></script>

    <script>
        RevToaster({
            api_key: 'your api_key',
            pub_id: pub_id,
            widget_id: widget_id,
            domain: 'widget domain',
            sponsored: 2,
        });
    </script>

Insert the proper values for your widget and optionally set the ```sponsored``` count(accepted values are 1 or 2 sponsored ads).

## Building
Gulp is used to embed css, concat and uglify the revtoaster script. To build the scripts:
1. change directory to the revcontent-api-showcase-toaster-1.0 directory
2. run ```npm install``` to get the gulp dependencies
3. run ```gulp``` this will run the default task and populate the build directory

## Watch
During development it can be useful to build the files on the fly when modifications are made. To have gulp watch the ./js/revtoaster and ./css/example.css files run ```gulp watch```
