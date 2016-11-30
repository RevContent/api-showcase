app.config(['$stateProvider', '$locationProvider', '$urlMatcherFactoryProvider', function($stateProvider, $locationProvider, $urlMatcherFactoryProvider) {

    $urlMatcherFactoryProvider.strictMode(false);

    $locationProvider.html5Mode({
        enabled: true
    });

    // Now set up the states
    $stateProvider
        .state('home', {
            url: "/",
            sticky: true,
            views: {
                main: {
                    templateUrl: "app/resources/js/app/grid/grid.html",
                    controller: 'GridCtrl',
                    controllerAs: 'ctrl'
                },
                sidenav: false
            }
        })
        .state('docs', {
            url: "/docs",
            views: {
                main: {
                    templateUrl: "app/resources/js/app/docs/docs.html",
                    controller: 'DocsCtrl',
                    controllerAs: 'ctrl'
                }
            }
        })
        .state('docs_widget', {
            // parent: 'docs',
            url: "/docs/widget/{widget}",
            views: {
                main: {
                    controller: function($state, $stateParams, $timeout, widgets) {
                        var widget = widgets.data[$stateParams.widget];

                        if (!widget) {
                            $state.go('404', {path:  'docs/widget/' + $stateParams.widget});
                            return false;
                        }

                        this.markdown = 'showcase/' + widget.docs;

                        $timeout(function() {
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                        })
                    },
                    controllerAs: 'ctrl',
                    templateUrl: "app/resources/js/app/docs/widget.html"
                }
            }
        })
        .state('post', {
            url: "/{id}",
            dialog: true,
            onEnter: ['$stateParams', '$state', '$mdDialog', '$window', '$mdCardContent', '$stateManager', 'widgets', function($stateParams, $state, $mdDialog, $window, $mdCardContent, $stateManager, widgets) {

                var widget = widgets.data[$stateParams.id];

                if (!widget) {
                    $state.go('404', {path: $stateParams.id});
                    return false;
                }

                var previousState = function() {
                    $state.go(($stateManager.previousState && !$stateManager.previousStateDialog) ? $stateManager.previousState : 'home', $stateManager.previousStateParams);
                };

                $mdDialog.show({
                    templateUrl: 'app/resources/js/app/dialog/post.html',
                    // targetEvent: $mdCardContent.getClickEvent(), // causing bug on history navigation
                    clickOutsideToClose: true,
                    controller: function($scope) {
                        $scope.id = $stateParams.id;
                        $scope.post = widget;
                        $scope.close = function() {
                            $mdDialog.hide();
                        };
                        $scope.preview = function(id, preview) {
                            if (preview) { // go to the post preview page once the dialog is done hiding
                                $mdDialog.hide().then(function() {
                                    $state.go('post_preview', {id: id});
                                });
                            } else { //legacy open blank
                                $window.open('/showcase/' + $scope.post.link, '_blank');
                            }
                        };
                        $scope.demo = function(id) {
                            $mdDialog.hide().then(function() {
                                $state.go('post_demo_id', {id: id, demo_id: 1});
                            });
                        };
                    },
                    onComplete: function() {
                    }
                })
                .then(function(answer) { //close
                    // previousState();
                }, function() { //cancel
                    previousState();
                });
            }],
            onExit: ['$mdDialog', function($mdDialog) {
                $mdDialog.hide();
            }]
        })
        .state('post_preview', {
            url: "/{id}/preview?options",
            sticky: true,
            views: {
                main: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/preview/'+ $stateParams.id +'.html';
                    },
                    controller: 'PreviewCtrl',
                    controllerAs: 'ctrl'
                },
                sidenav: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/preview/sidenav/'+ $stateParams.id +'.html';
                    }
                }
            }
        })
        .state('post_preview.link', {
            url: "/link",
            dialog: true,
            onEnter: ['$stateParams', '$state', '$mdDialog', '$location', '$mdCardContent', '$stateManager', 'options', function($stateParams, $state, $mdDialog, $location, $mdCardContent, $stateManager, options) {

                var previousState = function() {
                    $state.go('post_preview', {id: $stateParams.id});
                };

                $mdDialog.show({
                    templateUrl: 'app/resources/js/app/dialog/demo-link.html',
                    clickOutsideToClose: true,
                    controller: function($scope) {
                        $scope.url =  $location.$$protocol + '://' +
                                        $location.$$host +
                                        ($location.$$port ? ':' + $location.$$port : '') + '/' +
                                        $stateParams.id + '/preview?options=' +
                                        encodeURIComponent(JSON.stringify(options));
                    },
                    onComplete: function() {
                    }
                })
                .then(function(answer) { //close
                    previousState();
                }, function() { //cancel
                    previousState();
                });
            }],
            onExit: ['$mdDialog', function($mdDialog) {
                $mdDialog.hide();
            }]
        })
        .state('post_demos', {
            url: "/{id}/demos",
            views: {
                main: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/demo/'+ $stateParams.id +'/index.html';
                    },
                    controller: 'DemosCtrl',
                    controllerAs: 'demo'
                },
                sidenav: false
            }
        })
        .state('post_demo', {
            sticky: true,
            url: "/{id}/demo",
            views: {
                main: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/demo/'+ $stateParams.id +'/demo.html';
                    },
                    controller: 'DemoCtrl',
                    controllerAs: 'demo'
                },
                sidenav: false,
                sidenavDemo: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/demo/navigation/'+ $stateParams.id +'.html';
                    },
                    controller: 'DemoCtrl',
                    controllerAs: 'demoSidenav'
                }
            }
        })
        .state('post_demo_id', {
            parent: 'post_demo',
            url: "/{demo_id}",
            views: {
                description: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/demo/'+ $stateParams.id +'/'+ $stateParams.demo_id +'/description.html';
                    }
                },
                demo: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/demo/'+ $stateParams.id +'/'+ $stateParams.demo_id +'/demo.html';
                    }
                }
            }
        })
        .state('404', {
            url: "*path",
            views: {
                main: {
                    templateUrl: 'app/resources/js/app/404.html'
                }
            }
        });
}]);