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
        .state('post', {
            url: "^{id:.*}",
            controller: 'PostIndexCtrl',
            onEnter: ['$stateParams', '$rootScope', '$state', '$mdDialog', '$location', '$mdCardContent', function($stateParams, $rootScope, $state, $mdDialog, $location, $mdCardContent) {

                $mdDialog.show({
                    templateUrl: 'app/resources/js/app/dialog/' + $stateParams.id + '.html',
                    targetEvent: $mdCardContent.getClickEvent(),
                    onComplete: function() {
                    }
                })
                .then(function(answer) { //close
                    $location.path('/');
                }, function() { //cancel
                    $location.path('/');
                });
            }]
        });
}]);