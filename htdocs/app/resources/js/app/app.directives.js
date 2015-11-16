app.directive('mdCard', ['$location', '$mdCardContent', function ($location, $mdCardContent) {
  return {
    restrict: "AEC",
    link: function(scope, element, attrs) {
        element.on('click', function(e) {
            $mdCardContent.setClickEvent(e);
        });
    }
  };
}]);

app.directive('preloadImages', ['$location', '$mdCardContent', function ($location, $mdCardContent) {
    return {
        restrict: "AE",
        link: function(scope, element, attrs) {
            imagesLoaded( element, function() { // wait for ALL images to load
                angular.element(element).find('.preloader img').addClass('loaded');
            });
        }
    }
}]);

app.directive('previewMenu', ['widgets', '$stateParams', '$window', function (widgets, $stateParams, $window) {
  return {
    restrict: "AEC",
    templateUrl: 'preview/menu.html',
    controllerAs: 'menu',
    controller: function($scope, $state, $rootScope) {
        this.id = $stateParams.id ? $stateParams.id : 'flicker';
        this.widgets = widgets.data;
        this.preview = function(id) {
            var widget = this.widgets[id];
            if (widget.preview) {
                $state.go('post_preview', {id: id});
            } else {
                $window.open('/showcase/' + widget.link, '_blank');
            }
        }
    }
  };
}]);

app.directive('revSlider', ['$timeout', function ($timeout) {
app.directive('revSlider', ['$timeout', 'options', function ($timeout, options) {
  return {
    restrict: "AE",
    scope: {
        revSlider: '='
    },
    link: function(scope, element, attrs) {

        var widget;

        $timeout(function() {
            widget = new RevSlider({
                element: element,
                is_resize_bound: false,
                devices: options.getDevices(),
                header: options.header,
                api_key : options.api_key,
                pub_id : options.pub_id,
                widget_id : options.widget_id,
                domain : options.domain,
                rev_position: options.rev_position,
                rows: options.rows,
                per_row: options.per_row
            });
        });

        var watcher = scope.$watch(function() { return options }, function(newOpts, oldOpts) {
            if (newOpts != oldOpts) {
                $timeout(function() {
                    widget.update(newOpts, oldOpts);
                });
            }
        }, true);
    }
  };
}]);


app.directive('revFlicker', ['$location', '$mdCardContent', '$timeout', 'options', function ($location, $mdCardContent, $timeout, options) {
  return {
    restrict: "AE",
    link: function(scope, element, attrs) {

        var widget;

        options.next_effect = true;

        $timeout(function() {
            widget = new RevFlicker({
                element: element,
                devices: options.getDevices(),
                sponsored: options.sponsored,
                header: options.header,
                api_key : options.api_key,
                pub_id : options.pub_id,
                widget_id : options.widget_id,
                domain : options.domain,
                rev_position: options.rev_position,
                per_row: options.per_row,
                next_effect: options.next_effect
            });
        });

        var watcher = scope.$watch(function() { return options }, function(newOpts, oldOpts) {
            if (newOpts != oldOpts) {
                $timeout(function() {
                    widget.update(newOpts, oldOpts);
                });
            }
        }, true);
    }
  };
}]);