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
    };
}]);

app.directive('widgetMenu', ['widgets', '$stateParams', '$window', '$state', function (widgets, $stateParams, $window, $state) {
  return {
    restrict: "AEC",
    templateUrl: 'preview/menu.html',
    controllerAs: 'menu',
    controller: function($scope, $state, $rootScope) {

        this.id = $stateParams.id ? $stateParams.id : 'flicker';
        this.widgets = widgets.data;
        this.link = function(id) {
            var widget = this.widgets[id];
            if ($state.current.name == 'post_demo_id' && widget.demo) {
                $state.go('post_demo_id', {id: id, demo_id: 1});
                return;
            } else if ($state.current.name == 'post_preview' && widget.preview) {
                $state.go('post_preview', {id: id});
                return;
            }
            $window.open('/showcase/' + widget.link, '_blank');
        };
    }
  };
}]);

app.directive('revToaster', ['$timeout', 'options', '$rootScope', function ($timeout, options, $rootScope) {
  return {
    restrict: "AE",
    link: function(scope, element, attrs) {

        var widget;
        //close this thing when changing states, otherwise it just stays open on other pages
        $rootScope.$on("$stateChangeStart", function() {
            widget.hide();
        });

        options.rev_position = options.rev_position ? options.rev_position : 'bottom_right';
        options.sponsored = options.sponsored ? options.sponsored : 2;
        options.rev_positions = options.rev_positions ? options.rev_positions : {
            bottom_left: {
                key: 'bottom_left',
                value: 'Bottom Left',
            },
            bottom_right: {
                key: 'bottom_right',
                value: 'Bottom Right',
            }
        };

        options.set();

        widget = new RevToaster({
            api_key : options.api_key,
            pub_id : options.pub_id,
            widget_id : options.widget_id,
            domain : options.domain,
            testing: true,
            header: options.header,
            sponsored: options.sponsored,
            rev_position: options.rev_position,
            devices: options.getDevices(),
        });

        var watcher = scope.$watch(function() { return options; }, function(newOpts, oldOpts) {
            if (newOpts != oldOpts) {
                $timeout(function() {
                    widget.update(newOpts, oldOpts);
                });
            }
        }, true);

        $timeout(function() {
            widget.show();
        });


    }
  };
}]);

app.directive('revShifter', ['$timeout', 'options', '$rootScope', function ($timeout, options, $rootScope) {
  return {
    restrict: "AE",
    link: function(scope, element, attrs) {
        var widget;
        //close this thing when changing states, otherwise it just stays open on other pages
        $rootScope.$on("$stateChangeStart", function() {
            widget.hide();
        });

        options.inner_widget = options.inner_widget ? options.inner_widget : {
            name: 'slider',
            options: {
                per_row: 3,
                rows: 10
            }
        };
        options.width = options.width ? options.width : 600;

        options.set();

        widget = new RevShifter({
            width: options.width,
            devices: options.getDevices(),
            sponsored: options.sponsored,
            header: options.header,
            api_key : options.api_key,
            pub_id : options.pub_id,
            widget_id : options.widget_id,
            domain : options.domain,
            rev_position: options.rev_position,
            inner_widget: options.inner_widget
        });

        var watcher = scope.$watch(function() { return options; }, function(newOpts, oldOpts) {
            if (newOpts != oldOpts) {
                $timeout(function() {
                    widget.update(newOpts, oldOpts);
                });
            }
        }, true);

        $timeout(function() {
            widget.show();
        });


    }
  };
}]);

app.directive('revSlider', ['$timeout', 'options', function ($timeout, options) {
  return {
    restrict: "AE",
    scope: {
        revSlider: '='
    },
    link: function(scope, element, attrs) {

        var widget;

        options.text_overlay = options.text_overlay ? options.text_overlay : false;
        options.text_right = options.text_right ? options.text_right : false;

        options.set();

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
                per_row: options.per_row,
                headline_size: options.headline_size,
                max_headline: options.max_headline,
                text_overlay: options.text_overlay,
                vertical: options.vertical,
                page_increment: options.page_increment,
                text_right: options.text_right
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

app.directive('revFlicker', ['$location', '$timeout', 'options', function ($location, $timeout, options) {
  return {
    restrict: "AE",
    link: function(scope, element, attrs) {
        var widget;

        options.next_effect  = options.next_effect ? options.next_effect : true;
        options.text_overlay = options.text_overlay ? options.text_overlay : false;
        options.ad_border    = options.ad_border ? options.ad_border : true;

        options.set();

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
                next_effect: options.next_effect,
                headline_size: options.headline_size,
                max_headline: options.max_headline,
                text_overlay: options.text_overlay,
                ad_border: options.ad_border,
                image_ratio: options.image_ratio
            });
        });

        var watcher = scope.$watch(function() { return options; }, function(newOpts, oldOpts) {
            if (newOpts != oldOpts) {
                $timeout(function() {
                    widget.update(newOpts, oldOpts);
                });
            }
        }, true);
    }
  };
}]);