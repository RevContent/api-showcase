# Mobile Toaster

Pop! Content toasters are an engaging way to interact with your readers. The Mobile Toaster will appear as the user pans back to the top of the page and disapear as they scroll back down. Show your reader what's trending and get great results with the Mobile Toaster.

## How to use

Add the css file to the document ```<head>```

    <link href="css/example.css" rel="stylesheet">

Add the following scripts before the closing ```</body>``` tag

    <script src="js/imagesloaded.pkgd.js"></script>
    <script src="js/revtoaster.js"></script>

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