app.directive('mdCard', ['$location', '$mdCardContent', function ($location, $mdCardContent) {
  return {
    restrict: "AEC",
    scope: {
        document: '='
    },
    link: function(scope, element, attrs) {
        element.on('click', function(e) {
            $mdCardContent.setClickEvent(e);
        });
    }
  };
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
  return {
    restrict: "AE",
    scope: {
        revSlider: '='
    },
    link: function(scope, element, attrs) {

        var widget;

        var options = {
            element: element,
            url: 'http://trends.revcontent.com/api/v1/',
            api_key : 'bf3f270aa50d127f0f8b8c92a979d76aa1391d38',
            pub_id : 7846,
            widget_id : 13523,
            domain : 'bustle.com',
            rev_position: 'top_right'
        };

        $.extend(options, scope.revSlider);

        widget = new RevSlider(options);
    }
  };
}]);
