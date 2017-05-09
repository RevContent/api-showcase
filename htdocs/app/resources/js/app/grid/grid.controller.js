app.controller('GridCtrl', function($stateParams, $mdToast, $rootScope, $scope, $http, $timeout, $mdBottomSheet, widgets) {
    this.widgets = {};
    for (var key in widgets.data) {
        if (widgets.data.hasOwnProperty(key) && widgets.data[key].hide_grid !== true) {
            this.widgets[key] = widgets.data[key];
        }
    }

    var that = this;
    $scope.animate = function(key) {
        var widget = that.widgets[key];

        if (!widget.img_animated) {
            return;
        }

        widget.animating = + new Date();
    }

    $scope.static = function(key) {
        var widget = that.widgets[key];
        if (!widget.img_animated) {
            return;
        }

        var diff = (+ new Date()) - widget.animating;
        var iterations = Math.ceil(diff / widget.image_animation_duration)
        var duration = (widget.image_animation_duration * iterations) - diff;

        $timeout(function() {
            widget.animating = false;
        }, duration);
    }
});