app.service('$mdCardContent', function() {
    this.clickEvent = null;

    this.setClickEvent = function(evt) {
        this.clickEvent = evt;
    };

    this.getClickEvent = function() {
        return this.clickEvent;
    };
});

app.service('$stateManager', function() {
    this.stickyPath;
    this.originPath;

    this.setPath = function(stickyPath) {
        this.stickyPath = stickyPath;
    }
    this.getPath = function() {
        return this.stickyPath;
    }

    this.setOriginPath = function(originPath) {
        this.originPath = originPath;
    }

    this.getOriginPath = function() {
        return this.originPath;
    }
});

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
