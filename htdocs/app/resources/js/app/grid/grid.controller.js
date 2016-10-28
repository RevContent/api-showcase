app.controller('GridCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, widgets) {
    delete widgets.data['revmore-standard'];
    this.widgets = widgets.data;
});