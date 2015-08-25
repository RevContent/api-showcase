<!DOCTYPE html>
<html ng-app="app">
    <head>
        <!-- Force latest IE rendering engine or ChromeFrame if installed -->
        <!--[if IE]>
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <![endif]-->
        <base href="/">

        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Revcontent API Showcase</title>

        <link rel="shortcut icon" href="/app/resources/img/favicon.ico">

        <script src="app/resources/vendor/jquery/dist/jquery.js"></script>
        <script src="app/resources/vendor/angular/angular.js"></script>
        <script src="app/resources/vendor/angular-aria/angular-aria.js"></script>
        <script src="app/resources/vendor/angular-animate/angular-animate.js"></script>
        <script src="app/resources/vendor/angular-ui-router/release/angular-ui-router.js"></script>
        <script src="app/resources/vendor/ui-router-extras/release/modular/ct-ui-router-extras.core.js"></script>
        <script src="app/resources/vendor/ui-router-extras/release/modular/ct-ui-router-extras.sticky.js"></script>
        <script src="app/resources/vendor/angular-material/angular-material.js"></script>
        <script src="app/resources/vendor/angular-messages/angular-messages.js"></script>
        <script src="app/resources/vendor/lodash/dist/lodash.js"></script>
        <script src="app/resources/vendor/highlightjs/highlight.pack.js"></script>

        <!-- app js -->
        <script src="app/resources/js/app/app.module.js"></script>
        <script src="app/resources/js/app/config/app.config.js"></script>
        <script src="app/resources/js/app/config/app.routes.js"></script>
        <script src="app/resources/js/app/app.filters.js"></script>
        <script src="app/resources/js/app/app.directives.js"></script>
        <script src="app/resources/js/app/grid/grid.controller.js"></script>
        <script src="app/resources/js/app/docs/docs.controller.js"></script>
        <script src="app/resources/vendor/angular-highlightjs/angular-highlightjs.js"></script>

        <link href='//fonts.googleapis.com/css?family=Roboto:400,700,500,900,300' rel='stylesheet' type='text/css'>
        <link href="app/resources/vendor/highlightjs/styles/railscasts.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/vendor/sanitize-css/dist/sanitize.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/vendor/angular-material/angular-material.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/css/v2-logo.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/css/app.css" rel="stylesheet" type="text/css" media="screen" />

    </head>
    <body>
        <div id="wrapper" layout="column" layout-fill>
            <header>
                <md-toolbar class="md-primary">

                    <div class="container" layout layout-align="center center" tabindex="0">

                        <div class="md-toolbar-tools" tabindex="0">

                            <div>
                                <div class="navbar-header">
                                    <div class="navbar-brand">
                                        <a href="/" class="navbar-logo" title="Revcontent.com">
                                            <span class="icon-rc-logo-dark logo-normal">
                                                <span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span><span class="path5"></span><span class="path6"></span><span class="path7"></span><span class="path8"></span><span class="path9"></span><span class="path10"></span><span class="path11"></span><span class="path12"></span><span class="path13"></span><span class="path14"></span><span class="path15"></span><span class="path16"></span><span class="path17"></span><span class="path18"></span><span class="path19"></span><span class="path20"></span><span class="path21"></span><span class="path22"></span><span class="path23"></span><span class="path24"></span><span class="path25"></span><span class="path26"></span><span class="path27"></span><span class="path28"></span><span class="path29"></span><span class="path30"></span><span class="path31"></span><span class="path32"></span>
                                            </span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div style="margin-left:auto;">
                                <a class="md-button" ui-sref="docs" tabindex="0">
                                    <span>Docs</span>
                                    <md-tooltip>Read Up!</md-tooltip>
                                </a>

                                <a class="md-button" target="_blank" ng-href="http://faq.revcontent.com/support/solutions/5000137293" tabindex="0">
                                    <span>Support</span>
                                    <md-tooltip>How can we help?</md-tooltip>
                                </a>

                                <a class="md-button" target="_blank" ng-href="http://faq.revcontent.com/support/solutions/folders/5000219605" tabindex="0">
                                    <span>FAQ</span>
                                    <md-tooltip>Common Questions</md-tooltip>
                                </a>
                            </div>

                        </div>
                    </div>
                </md-toolbar>
            </header>

            <main class="container">
                <div ui-view="main"></div>
            </main>

            <div class="container">
                <footer layout="column" layout-gt-md="row">
                    <div layout>
                        <span>© 2015, Revcontent All Rights Reserved.</span>
                        <div id="btns">
                            <md-button href="http://faq.revcontent.com/support/solutions/articles/5000615200-revcontent-s-privacy-policy" target="_blank" title=""><strong>Privacy Policy</strong></md-button>
                            <md-button href="http://faq.revcontent.com/support/home" target="_blank" title=""><strong>Terms and Conditions</strong></md-button>
                        </div>
                    </div>

                    <div id="signup">
                        Don't have an account? <md-button class="md-primary" target="_blank" href="https://v2.revcontent.com/signup">Join the native revolution</md-button>
                    </div>
                </footer>
            </div>
        </div>
    </body>
</html>
