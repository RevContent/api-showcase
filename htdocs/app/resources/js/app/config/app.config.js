app.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('green')
        .accentPalette('blue');
});

app.run(function($rootScope, $stateParams, $location, $stateManager, $window) {

    $rootScope.$on("$stateChangeStart", function(evt, toState, toStateParams, fromState, fromStateParams) {
        $stateManager.previousStateDialog = fromState.dialog ? true : false;
        $stateManager.nextStateDialog     = toState.dialog ? true : false;
        $stateManager.previousState       = fromState.name;
        $stateManager.previousStateParams = fromStateParams;
    });
    });
});