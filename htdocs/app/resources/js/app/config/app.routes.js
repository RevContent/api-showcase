app.config(['$stateProvider', '$locationProvider', '$urlMatcherFactoryProvider', function($stateProvider, $locationProvider, $urlMatcherFactoryProvider) {

    $urlMatcherFactoryProvider.strictMode(false)

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
                    controller: 'GridCtrl'
                }
            }
        })
        .state('docs', {
            url: "/docs",
            sticky: true,
            views: {
                main: {
                    templateUrl: "app/resources/js/app/docs/docs.html",
                    controller: 'DocsCtrl'
                }
            }
        })
        .state('post', {
            url: "/{id}",
            dialog: true,
            onEnter: ['$stateParams', '$state', '$mdDialog', '$window', '$mdCardContent', '$stateManager', 'widgets', function($stateParams, $state, $mdDialog, $window, $mdCardContent, $stateManager, widgets) {

                var widget = widgets.data[$stateParams.id];

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
                    },
                    onComplete: function() {
                    }
                })
                .then(function(answer) { //close
                }, function() { //cancel
                    $state.go(($stateManager.previousState && !$stateManager.previousStateDialog) ? $stateManager.previousState : 'home', $stateManager.previousStateParams);
                });
            }],
            onExit: ['$mdDialog', function($mdDialog) {
                $mdDialog.hide();
            }]
        })
        .state('post_preview', {
            url: "/{id}/preview",
            sticky: true,
            views: {
                main: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/preview/'+ $stateParams.id +'.html'
                    },
                    controller: 'PreviewCtrl',
                    controllerAs: 'ctrl'
                },
                sidenav: {
                    templateUrl: function($stateParams) {
                        return 'app/resources/js/app/preview/sidenav/'+ $stateParams.id +'.html'
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