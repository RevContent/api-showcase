<?php

  if (isset($_GET["id"])) {
    switch ($_GET["id"]) {
      case "homepageloop":
          $name = "Homepage Loop";
          $preview_url  = "/showcase/revcontent-api-showcase-homepageloop-1.0/index.php";
          $download_url = "";
          $git_url = "";
          break;
      case "endofgallery":
          $name = "Homepage Loop";
          $preview_url  = "/showcase/revcontent-api-showcase-endofgallery-1.0/index.html";
          $download_url = "";
          $git_url = "";
          break;
       case "toaster":
          $name = "Content Toaster";
          $preview_url  = "/showcase/revcontent-api-showcase-toaster-1.0/";
          $download_url = "";
          $git_url = "";
          break;
        case "scrolling":
          $name = "Scrolling Experience";
          $preview_url  = "/showcase/revcontent-api-showcase-scrollingexp-1.0/";
          $download_url = "";
          $git_url = "";
          break;
      case "carousel":
          $name = "Content Carousel";
          $preview_url  = "/showcase/revcontent-api-showcase-carousel-1.0/index.php";
          $download_url = "";
          $git_url = "";
          break;
      default:
          header('Location: ' . $_SERVER['HTTP_REFERER']);
    }

  } else {

    header('Location: ' . $_SERVER['HTTP_REFERER']);

  }

?>



<!DOCTYPE html>
<!--[if lte IE 6]> <html class="no-js ie  lt-ie10 lt-ie9 lt-ie8 lt-ie7 ancient oldie" lang="en-US"> <![endif]-->
<!--[if IE 7]>     <html class="no-js ie7 lt-ie10 lt-ie9 lt-ie8 oldie" lang="en-US"> <![endif]-->
<!--[if IE 8]>     <html class="no-js ie8 lt-ie10 lt-ie9 oldie" lang="en-US"> <![endif]-->
<!--[if IE 9]>     <html class="no-js ie9 lt-ie10 oldie" lang="en-US"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" dir="ltr" lang="en-US"> <!--<![endif]-->
<head>
<meta charset="utf-8" />
<!--[if IE]> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <![endif]-->
<title>rev:content - Native API Showcase</title>
<!-- Set the viewport width to device width for mobile -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link href="css/reset.css" rel="stylesheet" type="text/css" media="screen" />
<link href="css/contact.css" rel="stylesheet" type="text/css" media="screen" />
<link href="css/styles.css" rel="stylesheet" type="text/css" media="screen" />
<link href="css/jquery.fancybox.css" rel="stylesheet" type="text/css" media="screen" />
<!--[if gt IE 8]><!--><link href="css/retina-responsive.css" rel="stylesheet" type="text/css" media="screen" /><!--<![endif]-->
<!--[if !IE]> <link href="css/retina-responsive.css" rel="stylesheet" type="text/css" media="screen" /> <![endif]-->
<link href="css/print.css" rel="stylesheet" type="text/css" media="print" />
<link href="//fonts.googleapis.com/css?family=Open+Sans:400,400italic,300,300italic,700,600,800" rel="stylesheet" type="text/css" />
<link href="//fonts.googleapis.com/css?family=Merriweather:300,400,700" rel="stylesheet" type="text/css" />
<link href="http://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet" type="text/css">
<script src="js/modernizr.js" type="text/javascript"></script>
</head>
<body>
<!-- Preloader -->
<div id="preloader">
  <div id="status">
    <div class="parent">
      <div class="child">
        <p class="small">loading</p>
      </div>
    </div>
  </div>
</div>
<div id="wrap">
  <div id="background-color"></div>
  <header id="header">
    <div class="logo-wrapper">
      <h1 id="logo"><a href="index.php">rev:content</a></h1>
      <!--<div class="tagline"><span>Native API Showcase</span></div>-->
    </div>
    <div id="menu-button">
      <div class="centralizer">
        <div class="cursor">Menu
          <div id="nav-button"> <span class="nav-bar"></span> <span class="nav-bar"></span> <span class="nav-bar"></span> </div>
        </div>
      </div>
    </div>
  </header>
  <!-- end header -->
  <!-- start main nav -->
  <nav id="main-nav">
    <div id="menu-close-button">&times;</div>
    <ul id="options" class="option-set clearfix" data-option-key="filter">
    <li class="selected"> <a href="index.html">Home</a> </li>
    <li> <a href="index.html#portfolio" class="sub-nav-toggle">Portfolio</a>
      <ul class="sub-nav hidden">
        <li> <a href="index.html#illustration">Illustration</a> </li>
        <li> <a href="index.html#photography">Photography</a> </li>
        <li> <a href="index.html#webdesign">Webdesign</a> </li>
        <li> <a href="index.html#portfolio">Show All</a> </li>
      </ul>
    </li>
    <li> <a href="index.html#services">Services</a> </li>
    <li> <a href="index.html#about">About</a> </li>
    <li> <a href="index.html#pricing">Pricing</a> </li>
    <li> <a href="index.html#blog">Blog</a> </li>
    <li> <a href="index.html#contact">Contact</a> </li>
  </ul>
  <div class="additional-links">
    <ul>
        <li class="active"> <a href="project.html">Project Detail</a> </li>
        <li> <a href="icons.html">Icons</a> </li>
        <li> <a href="slider.html">Slideshow</a> </li>
        <li> <a href="video.html">Vimeo</a> </li>
        <li> <a href="youtube.html">Youtube</a> </li>
        <li> <a href="post.html">Post Page</a> </li>
      </ul>
  </div>
  <div class="social-links">
    <ul class="social-list clearfix">
      <li> <a href="#" class="pinterest"></a> </li>
      <li> <a href="#" class="twitter"></a> </li>
      <li> <a href="#" class="gplus"></a> </li>
      <li> <a href="#" class="facebook"></a> </li>
    </ul>
  </div>
</nav>
<!-- end main nav -->
<div class="content-wrapper">
  <div id="content">
    <div class="container">
      <div id="container" class="clearfix">
        <div class="element clearfix col3-3 home">

         <iframe src="<?php echo $preview_url; ?>" style="width:940px;height:627px;"></iframe>
        </div>
        <div class="element clearfix col1-3 home grey auto">
          <h3><strong><?php echo $name; ?></strong></h3>
          <div class="ct-part">
             <a class="button" href="<?php echo $preview_url; ?>" target="_blank"><i class="fa fa-eye"></i> Live Preview</a>
          </div>
          <div class="ft-part">
              <a class="button" href="<?php echo $download_url; ?>"><i class="fa fa-download"></i> Download Source&nbsp;</a>
              <a class="button" href="<?php echo $git_url; ?>"><i class="fa fa-github"></i> View on GitHub &nbsp;</a>
          </div>
        </div>
        <div class="element clearfix col1-3 home grey auto">
          <h4><strong>Features</strong></h4>
              <ul class="unordered-list">
                <li>Simple to style &amp; match your site flow</li>
                <li>Clear differentiation of sponsored content</li>
                <li>Easy implementation to mix into current design</li>
              </ul>
              <br />
        </div>

        <!--<div class="element clearfix col1-3 home grey auto">
          <h4><strong>Result</strong></h4>
            <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacina. </p>
        </div>
        <div class="element  clearfix col1-3 home grey auto">
          <div class="icon-holder quote"></div>
          <blockquote>
            <p>Our expectations were absolutely surpassed. We are so glad we chose Hempstead Agency for our new project.</p>
            <p class="small">Jessica Max, CEO</p>
          </blockquote>
        </div>
        <div class="element  clearfix col1-3 home"> <a href="#" title="">
          <figure class="images"> <img src="images/work07.jpg" alt="Previous<span>Invitation Greeting Card</span><i>→</i>" class="slip" /> </figure>
          </a> </div>
          <div class="element  clearfix col1-3 home"> <a href="#" title="">
          <figure class="images"> <img src="images/work04.jpg" alt="Next<span>Square Magazine</span><i>→</i>" class="slip" /> </figure>
          </a> </div>
        <div class="element clearfix col1-3 home grey back-button"><a href="index.html#portfolio" title="" class="whole-tile">
          <h5>Back to Portfolio<span class="arrow">→</span></h5>
        </a></div>-->
      </div>
        <!-- end #container -->
      </div>
      <!-- end .container -->
    </div>
    <!-- end content -->
  </div>
  <!-- end content-wrapper -->
</div>
<!-- end wrap -->
<footer id="footer" class="clearfix">
  <p class="alignleft">© 2015, rev:content All Rights Reserved. <span class="padding">&middot;</span> <a href="404.html" title=""><strong>Legal Notice</strong></a></p>
  <p class="alignright"><a href="">Sign Up</a> <span class="padding">&middot;</span> <a href="mailto:support@revcontent.com" title="Need Help?">support@revcontent.com</a> </p>

</footer>
<script src="js/jquery-1.11.1.min.js" type="text/javascript"></script>
<script src="js/jquery-easing-1.3.js" type="text/javascript"></script>
<script src="js/retina.js" type="text/javascript"></script>
<script src="js/jquery.touchSwipe.min.js" type="text/javascript"></script>
<script src="js/jquery.isotope2.min.js" type="text/javascript"></script>
<script src="js/jquery.ba-bbq.min.js" type="text/javascript"></script>
<script src="js/jquery.isotope.load.js" type="text/javascript"></script>
<script src="js/SmoothScroll.js" type="text/javascript"></script>
<script src="js/main.js" type="text/javascript"></script>
<script src="js/preloader.js" type="text/javascript"></script>
<script src="js/jquery.sliphover.min.js"></script>
<script src="js/jquery.fancybox.pack.js" type="text/javascript"></script>
</body>
</html>