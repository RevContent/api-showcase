app.controller('GridCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, widgets) {
    this.widgets = {};
    for (var key in widgets.data) {
        if (widgets.data.hasOwnProperty(key) && widgets.data[key].hide_grid !== true) {
            this.widgets[key] = widgets.data[key];
        }
    }
});