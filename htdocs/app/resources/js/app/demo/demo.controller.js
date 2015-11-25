app.controller('DemoCtrl', function(widgets, $stateParams, $state, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, $mdToast, options, slider, widgets) {

    this.sideNavOpen = $stateParams.demo_id ? true : false;

    this.widget = widgets.data[$stateParams.id];

    if (!this.widget) {
        // waiting on for this to not encode the url https://github.com/angular-ui/ui-router/issues/1119
        $state.go('404', {path: window.location.pathname});
        return false;
    }

    this.widget.id = $stateParams.id;

    this.getDescription = function() {
        return 'app/resources/js/app/demo/flicker/'+ $stateParams.demo_id +'/description.html';
    }

    this.getPage = function() {
        return 'app/resources/js/app/demo/flicker/'+ $stateParams.demo_id +'/demo.html';
    }

    this.getActive = function(id) {
        return ($stateParams.demo_id == id)
    }

});