app.controller('DocsCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, widgets) {
    delete widgets.data['amp'];
    delete widgets.data['instream'];
    delete widgets.data['end-of-gallery'];
    $scope.widgets = widgets.data;
    $scope.active = {
        request: 'jsonp',
        response: 'json'
    };
});