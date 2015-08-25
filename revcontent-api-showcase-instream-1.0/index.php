<?php
/**
* Example API call in PHP for the Revcontent API
*
* Got Questions? Email Us: support@revcontent.com
*
*/
    error_reporting(-1);
    ini_set('display_errors', 'on');
    ini_set('html_errors', 'on');

    $url = 'https://trends.revcontent.com/api/v1/?' . http_build_query(array(
        'api_key' => '3eeb00d786e9a77bbd630595ae0be7e9aa7aff3b',
        'pub_id' => 945,
        'widget_id' => 6181,
        'domain' => 'apiexamples.powr.com',
        'sponsored_count' => 2,
        'sponsored_offset' => 0,
        'internal_count' => 0
    ));
    // Make the API call
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $output = curl_exec($ch);
    curl_close($ch);

    // Decode and print the response
    $response = json_decode($output, true);

?>






<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>In-stream Example</title>

    <link href="css/bootstrap.css" rel="stylesheet">

    <link href="css/style.css" rel="stylesheet">

    <link href="css/example.css" rel="stylesheet">

    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
        <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->

</head>

<body>

    <!-- Navigation -->
    <nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
        <div class="container">
            <!-- Brand and toggle get grouped for better mobile display -->
            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="#">Showcase Example </a>
            </div>
            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul class="nav navbar-nav">
                    <li>
                        <a href="#">Life </a>
                    </li>
                    <li>
                        <a href="#">News </a>
                    </li>
                    <li>
                        <a href="#">Style</a>
                    </li>
                    <li>
                        <a href="#">Culture</a>
                    </li>
                </ul>
            </div>
            <!-- /.navbar-collapse -->
        </div>
        <!-- /.container -->
    </nav>

    <!-- Page Content -->
    <div class="container">

        <!-- Page Heading -->
        <div class="row">
            <div class="col-lg-12">
                <h1 class="page-header">In-stream
                    <small>Revcontent Native API</small>
                </h1>
            </div>
        </div>
        <!-- /.row -->

        <!-- Post One -->
        <div class="row">
            <div class="col-md-3 col-xs-5">
                <a href="#">
                    <img class="img-responsive" src="http://placehold.it/420x315" alt="">
                </a>
            </div>
            <div class="col-md-7">
                <h3><a href="#">Post One Headline</a></h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Laudantium veniam exercitationem expedita laborum at voluptate. Labore, voluptates totam at aut nemo deserunt rem magni pariatur quos perspiciatis atque eveniet unde.</p>
                <a class="btn btn-primary" href="#">View Post <span class="glyphicon glyphicon-chevron-right"></span></a>
            </div>
        </div>
        <!-- /.row -->

        <hr>

        <!-- Post Two Sponsored By Revcontent! -->
        <div class="row">
            <div class="col-md-3  col-xs-5">
                <a href="<?php echo $response[0]['url']; ?>" target="_blank">
                    <span class="label label-info clear-branding" >Sponsored</span>
                    <img class="img-responsive" src="http://<?php echo $response[0]['image']; ?>" alt="" />
                </a>
            </div>
            <div class="col-md-7">
                <h3><a href="<?php echo $response[0]['url']; ?>" target="_blank"><?php echo $response[0]['headline']; ?></a></h3>
                <p><a class="brand" href="<?php echo $response[0]['url']; ?>" target="_blank"><?php echo $response[0]['brand']; ?></a></p>
            </div>
        </div>
        <!-- /.row -->

        <hr>

        <!-- Post Three -->
        <div class="row">
            <div class="col-md-3 col-xs-5">
                <a href="#">
                    <img class="img-responsive" src="http://placehold.it/420x315" alt="">
                </a>
            </div>
            <div class="col-md-7">
                <h3><a href="#">Post Three Headline</a></h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Omnis, temporibus, dolores, at, praesentium ut unde repudiandae voluptatum sit ab debitis suscipit fugiat natus velit excepturi amet commodi deleniti alias possimus!</p>
                <a class="btn btn-primary" href="#">View Post <span class="glyphicon glyphicon-chevron-right"></span></a>
            </div>
        </div>
        <!-- /.row -->

        <hr>

        <!-- Post Four -->
        <div class="row">

            <div class="col-md-3 col-xs-5">
                <a href="#">
                    <img class="img-responsive" src="http://placehold.it/420x315" alt="">
                </a>
            </div>
            <div class="col-md-7">
                <h3><a href="#">Post Four Headline</a></h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Explicabo, quidem, consectetur, officia rem officiis illum aliquam perspiciatis aspernatur quod modi hic nemo qui soluta aut eius fugit quam in suscipit?</p>
                <a class="btn btn-primary" href="#">View Post <span class="glyphicon glyphicon-chevron-right"></span></a>
            </div>
        </div>
        <!-- /.row -->

        <hr>

        <!-- Post Five Sponsored By Revcontent! -->
        <div class="row">
            <div class="col-md-3  col-xs-5">
                <a href="<?php echo $response[1]['url']; ?>" target="_blank">
                    <span class="label label-info clear-branding" >Sponsored</span>
                    <img class="img-responsive" src="http://<?php echo $response[1]['image']; ?>" alt="" />
                </a>
            </div>
            <div class="col-md-7">
                <h3><a href="<?php echo $response[1]['url']; ?>" target="_blank"><?php echo $response[1]['headline']; ?></a></h3>
                <p><a class="brand" href="<?php echo $response[1]['url']; ?>" target="_blank"><?php echo $response[1]['brand']; ?></a></p>
            </div>
        </div>
        <!-- /.row -->

        <hr>

        <!-- Pagination -->
        <div class="row text-center">
            <div class="col-lg-12">
                <ul class="pagination">
                    <li>
                        <a href="#">&laquo;</a>
                    </li>
                    <li class="active">
                        <a href="#">1</a>
                    </li>
                    <li>
                        <a href="#">2</a>
                    </li>
                    <li>
                        <a href="#">3</a>
                    </li>
                    <li>
                        <a href="#">4</a>
                    </li>
                    <li>
                        <a href="#">5</a>
                    </li>
                    <li>
                        <a href="#">&raquo;</a>
                    </li>
                </ul>
            </div>
        </div>
        <!-- /.row -->

        <hr>

        <!-- Footer -->
        <footer>
            <div class="row">
                <div class="col-lg-12">
                    <p>Copyright &copy; Your Website 2015</p>
                </div>
            </div>
            <!-- /.row -->
        </footer>

    </div>
    <!-- /.container -->

</body>

</html>
