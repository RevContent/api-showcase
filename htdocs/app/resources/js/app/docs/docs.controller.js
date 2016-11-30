app.controller('DocsCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, widgets) {
    this.widgets = {};
    for (var key in widgets.data) {
        if (widgets.data.hasOwnProperty(key) && widgets.data[key].docs) {
            this.widgets[key] = widgets.data[key];
        }
    }
    this.active = {
        request: 'jsonp',
        response: 'json'
    };
});