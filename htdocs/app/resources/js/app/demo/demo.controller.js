app.controller('DemosCtrl', function(widgets, $stateParams, $state, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, $mdToast, options, slider, widgets) {

    this.sideNavOpen = false

    this.widget = widgets.data[$stateParams.id];

    if (!this.widget) {
        // waiting on for this to not encode the url https://github.com/angular-ui/ui-router/issues/1119
        $state.go('404', {path: window.location.pathname});
        return false;
    }

    this.widget.id = $stateParams.id;
});


app.controller('DemoCtrl', function(widgets, $stateParams, $state, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, $mdToast, options, slider, widgets) {
    var that = this;

    $timeout(function() {
        that.sideNavOpen = true;
    });

    this.widget = widgets.data[$stateParams.id];

    if (!this.widget) {
        // waiting on for this to not encode the url https://github.com/angular-ui/ui-router/issues/1119
        $state.go('404', {path: window.location.pathname});
        return false;
    }

    this.widget.id = $stateParams.id;

    this.getActive = function(id) {
        return ($state.params.demo_id == id)
    }

});