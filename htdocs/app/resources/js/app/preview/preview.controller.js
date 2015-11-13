app.controller('PreviewCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, $mdToast, options, slider, widgets) {

    this.id = $stateParams.id ? $stateParams.id : 'flicker';

    this.widgets = widgets.data;
    this.options = options;
    this.slider = slider;

    var widgetSizeToastVisible = false;
    var widgetSizeToastTimeout = false;
    var showWidgetSizeToast = function() {
        if (widgetSizeToastVisible) {
            $timeout.cancel(widgetSizeToastTimeout);
            widgetSizeToastTimeout = $timeout(function() {
                hideToast();
            }, 3000);
            return;
        } else {
            $mdToast.show({
                controller: 'ToastCtrl',
                template: '<md-toast id="widgetSize">{{ ctrl.slider.value }}px</md-toast>',
                controllerAs: 'ctrl',
                parent: $('#widgetContainer'),
                position: 'top',
                hideDelay: 0
            });
            widgetSizeToastTimeout = $timeout(function() {
                hideToast();
            }, 3000);
            widgetSizeToastVisible = true;
        }
    };

    var hideToast = function() {
        $mdToast.hide();
        widgetSizeToastVisible = false;
    };

    this.toggleNav = function() {
        $mdToast.hide();
        $mdSidenav('left').toggle();
    };

    this.sliderChange = function() {
        showWidgetSizeToast();

        for (var i = this.options.sizes.length; i >= 0; i--) {
            if (this.slider.value >= this.options.sizes[i]) {
                this.options.size = (i + 1);
                this.options.realSize = this.slider.value;
                break;
            }
        }
        // $scope.$emit('sizeChange');
    };

    this.sliderChangeDiscrete = function() {
        showWidgetSizeToast();

        this.slider.value = this.options.sizes[(this.options.size - 1)];
        // $scope.$emit('sizeChange');
    };
});


app.controller('BuilderOptionsCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, options) {

    this.options = options;

    // this.perRowChange = function() {
    //     $rootScope.$broadcast('sizeChange');
    // };

    // var timeout;
    // this.optionChange = function() {
    //     $timeout.cancel(timeout);
    //     timeout = $timeout(function() {
    //         $rootScope.$broadcast('dataChange');
    //     }, 700);
    // };
});

app.controller('ToastCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, options, slider) {

    this.options = options;
    this.slider = slider;
});