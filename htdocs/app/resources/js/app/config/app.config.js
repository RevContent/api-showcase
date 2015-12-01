app.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('green')
        .accentPalette('blue');
});

app.run(function($rootScope, $stateParams, $location, $stateManager, $window) {

    $rootScope.$on("$stateChangeStart", function(evt, toState, toStateParams, fromState, fromStateParams) {

        if (fromState.name == 'post_demo_id') {
            if ($stateParams.id == 'sidenav') {
                RevSidenav({});
            } else if ($stateParams.id == 'toaster') {
                RevToaster({});
            }
        }

        $stateManager.previousStateDialog = fromState.dialog ? true : false;
        $stateManager.nextStateDialog     = toState.dialog ? true : false;
        $stateManager.previousState       = fromState.name;
        $stateManager.previousStateParams = fromStateParams;
    });
});