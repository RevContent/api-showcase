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

        <title>RevContent API Showcase</title>

        <link rel="shortcut icon" href="/app/resources/img/favicon.ico">

        <link rel="stylesheet" href="//f.fontdeck.com/s/css/uH5+KWQnibDTJRYggGJ9XZLTAgw/api.showcase.mosterhout.dev2.dev.internal/47418.css" type="text/css" />

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

        <!-- plugin js -->
        <script src="showcase/revcontent-api-showcase-grid-1.0/js/grid.js"></script>
        <script src="showcase/revcontent-api-showcase-carousel-1.0/js/shoveler.js"></script>
        <!-- toaster no plugin js -->

        <!-- app js -->
        <script src="app/resources/js/app/app.module.js"></script>
        <script src="app/resources/js/app/config/app.config.js"></script>
        <script src="app/resources/js/app/config/app.routes.js"></script>
        <script src="app/resources/js/app/app.filters.js"></script>
        <script src="app/resources/js/app/app.directives.js"></script>
        <script src="app/resources/js/app/grid/grid.controller.js"></script>
        <script src="app/resources/js/app/docs/docs.controller.js"></script>
        <script src="app/resources/vendor/angular-highlightjs/angular-highlightjs.js"></script>

        <link href="app/resources/vendor/highlightjs/styles/railscasts.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/vendor/sanitize-css/dist/sanitize.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/vendor/angular-material/angular-material.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/css/app.css" rel="stylesheet" type="text/css" media="screen" />

    </head>
    <body>
        <div id="wrapper" layout="column" layout-fill>
            <header>
                <md-toolbar class="md-primary">
                    <div class="md-toolbar-tools container md-toolbar-tools-bottom" flex="" tabindex="0">
                        <div flex layout="row" layout-align="center center">

                            <div flex>
                                <h1>RevContent API Showcase</h1>
                                <a class="logo" href="/">
                                    <img src="/app/resources/img/revcontent-logo-dark.png">
                                </a>
                            </div>

                            <div flex=""></div>

                            <a class="md-button" ui-sref="docs" tabindex="0" style="margin-right:8px;">
                                <span>Docs</span>
                                <md-tooltip>Read Up!</md-tooltip>
                            </a>

                            <a class="md-button" target="_blank" ng-href="http://support.revcontent.com/support/solutions/folders/4000004477" tabindex="0">
                                <span>Support</span>
                                <md-tooltip>How can we help?</md-tooltip>
                            </a>

                        </div>
                    </div>
                </md-toolbar>
            </header>

            <main class="container">
                <div ui-view="main"></div>
            </main>

            <footer>
                <div class="container">
                    © 2015, rev:content All Rights Reserved.
                    <md-button href="http://support.revcontent.com/support/solutions/articles/158282-privacy-policy" target="_blank" title=""><strong>Privacy Policy</strong></md-button>
                    <md-button href="http://support.revcontent.com/support/home" target="_blank" title=""><strong>Terms and Conditions</strong></md-button>

                    <div style="float:right">
                        Don't have an account? <md-button class="md-primary" target="_blank" href="https://www.revcontent.com/signup/publisher">Join the native rev:olution</md-button>
                    </div>
                </div>
            </footer>
        </div>
    </body>
</html>
