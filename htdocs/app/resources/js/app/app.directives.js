app.service('$mdCardContent', function() {
    this.clickEvent = null;

    this.setClickEvent = function(evt) {
        this.clickEvent = evt;
    };

    this.getClickEvent = function() {
        return this.clickEvent;
    };
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