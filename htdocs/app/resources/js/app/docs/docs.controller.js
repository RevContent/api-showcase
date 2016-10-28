app.controller('DocsCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, widgets) {
    $scope.widgets = widgets.data;
    $scope.active = {
        request: 'jsonp',
        response: 'json'
    };
});