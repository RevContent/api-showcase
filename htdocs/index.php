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

        <title>Revcontent Innovation Lab</title>

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
        <link href="app/resources/vendor/normalize.css/normalize.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/vendor/angular-material/angular-material.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/css/v2-logo.css" rel="stylesheet" type="text/css" media="screen" />
        <link href="app/resources/css/app.css" rel="stylesheet" type="text/css" media="screen" />

    </head>
    <body>
        <header>
            <md-toolbar class="md-primary">

                <div class="container" layout layout-align="center center" tabindex="0">

                    <div layout layout-align="center center" class="md-toolbar-tools" tabindex="0">

                        <div>
                            <div class="navbar-header">
                                <div class="navbar-brand">
                                    <a href="/" class="navbar-logo" title="Revcontent Innovation Lab">
                                        <img src="app/resources/img/revcontent-labs.png" alt="Revcontent Innovation Lab">
                                    </a>
                                </div>
                            </div>
                        </div>

                        <md-menu layout layout-align="center center" hide-gt-sm style="margin-left:auto;margin-right:0;padding:0;">
                            <md-button ng-click="$mdOpenMenu($event)" class="md-icon-button" aria-label="Open sample menu">
                                <md-icon>
                                    <svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" style="pointer-events: none; display: block;" viewBox="0 0 36 36"><path d="M4 27h28v-3H4v3zm0-8h28v-3H4v3zM4 8v3h28V8H4z"/></svg>
                                </md-icon>
                            </md-button>
                            <md-menu-content>
                                <md-menu-item>
                                    <md-button ui-sref="docs">Docs</md-button>
                                </md-menu-item>
                                <md-menu-item>
                                    <md-button target="_blank" ng-href="http://faq.revcontent.com/support/solutions/5000137293">Support</md-button>
                                </md-menu-item>
                                <md-menu-item>
                                    <md-button target="_blank" ng-href="http://faq.revcontent.com/support/solutions/folders/5000219605">FAQ</md-button>
                                </md-menu-item>
                            </md-menu-content>
                        </md-menu>

                        <div style="margin-left:auto;" hide-sm>
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

        <main>
            <div class="container" ui-view="main"></div>
        </main>

        <footer>
            <div class="container">
                <div layout="column" layout-gt-lg="row" layout-align="center center"  layout-align-lg="space-between center" layout-align-gt-lg="space-between center">
                    <div layout="column" layout-gt-md="row" layout-align="center center">
                        <span>© 2015, Revcontent All Rights Reserved.</span>
                        <div layout="row">
                            <md-button href="http://faq.revcontent.com/support/solutions/articles/5000615200-revcontent-s-privacy-policy" target="_blank" title=""><strong>Privacy Policy</strong></md-button>
                            <md-button href="http://faq.revcontent.com/support/home" target="_blank" title=""><strong>Terms and Conditions</strong></md-button>
                        </div>
                    </div>

                    <div id="signup" layout layout-align="center center">
                        Don't have an account? <md-button class="md-primary" target="_blank" href="https://v2.revcontent.com/signup">Join the native revolution</md-button>
                    </div>
                </div>
            </div>
        </footer>

        <script>
         (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
         (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
         m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
         })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

         ga('create', 'UA-45407218-3', 'auto');
         ga('send', 'pageview');

        </script>
    </body>
</html>
