app.config(['$stateProvider', '$locationProvider', '$urlMatcherFactoryProvider', function($stateProvider, $locationProvider, $urlMatcherFactoryProvider) {

    $urlMatcherFactoryProvider.strictMode(false)

    $locationProvider.html5Mode({
        enabled: true
    });

    // Now set up the states
    $stateProvider
        .state('home', {
            url: "/",
            sticky: true,
            views: {
                main: {
                    templateUrl: "app/resources/js/app/grid/grid.html",
                    controller: 'GridCtrl'
                }
            }
        })
        .state('post', {
            url: "^{id:.*}",
            controller: 'PostIndexCtrl',
            onEnter: ['$stateParams', '$rootScope', '$state', '$mdDialog', '$location', '$mdCardContent', function($stateParams, $rootScope, $state, $mdDialog, $location, $mdCardContent) {

                var plugins = {
                    instream: {
                        title: 'Instream',
                        img: 'instream.jpg',
                        description: 'In-stream native content can look, feel, and function seamlessly across mobile, desktop, or tablet. With the API your in full control of the integration on your property, inject target content in-stream on your homepage, mobile view, or where it fits best for your users.',
                        link: 'revcontent-api-showcase-instream-1.0',
                    },
                    'end-of-gallery': {
                        title: 'End of Gallery',
                        img: 'eog1.jpg',
                        description: 'Keep the engagement going long after the last page of your gallery. Using our API on the last page of your galleries and top 10 lists is a great way to guide your users to their next destination.',
                        link: 'revcontent-api-showcase-endofgallery-1.0',
                    },
                    grid: {
                        title: 'Grid',
                        img: 'grid.jpg',
                        description: 'None',
                        link: 'revcontent-api-showcase-grid-1.0',
                    },
                    carousel: {
                        title: 'Carousel',
                        img: 'carousel.jpg',
                        description: 'None',
                        link: 'revcontent-api-showcase-carousel-1.0',
                    },
                    toaster: {
                        title: 'Toaster',
                        img: 'toast.jpg',
                        description: 'None',
                        link: 'revcontent-api-showcase-toaster-1.0',
                    }
                };

                var plugin = plugins[$stateParams.id];

                $mdDialog.show({
                    templateUrl: 'app/resources/js/app/dialog/post.html',
                    targetEvent: $mdCardContent.getClickEvent(),
                    controller: function($scope) {
                        $scope.post = plugin;
                    },
                    onComplete: function() {
                    }
                })
                .then(function(answer) { //close
                    $location.path('/');
                }, function() { //cancel
                    $location.path('/');
                });
            }]
        });
}]);