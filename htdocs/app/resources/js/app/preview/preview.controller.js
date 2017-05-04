app.controller('PreviewCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, $mdToast, options, slider, widgets, $localStorage) {

    this.id = $stateParams.id ? $stateParams.id : 'flicker';

    this.widgets = widgets.data;
    this.options = options;
    this.slider = slider;

    this.visible = true;

    var watcher = $rootScope.$watch(function() { return options; }, function(newOpts, oldOpts) {
        if (newOpts != oldOpts) {
            $localStorage.options = newOpts;
        }
    }, true);

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

    this.toggleVisible = function() { //this does not work well with the internal widget closing
        this.options.visible = !this.options.visible;
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


app.controller('BuilderOptionsCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, options, $state) {
    this.options = options;

    this.getLink = function() {
        $state.go('post_preview.link', {id: $stateParams.id});
    };
});

app.controller('ToastCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, $mdSidenav, options, slider) {

    this.options = options;
    this.slider = slider;
});