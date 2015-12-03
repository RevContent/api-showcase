app.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('green')
        .accentPalette('blue');
});

app.run(function($rootScope, $stateParams, $stateManager, $timeout) {

    $rootScope.$on("$stateChangeStart", function(evt, toState, toStateParams, fromState, fromStateParams) {

        if (toState.name == 'post_demo_id') {
            $timeout(function() {
                $rootScope.showDemoSideNav = true;
            });
        } else if (!toState.dialog) {
            $timeout(function() {
                $rootScope.showDemoSideNav = false;
            });
        }

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