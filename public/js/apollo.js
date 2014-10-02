/* global respoke */
/* global marked */
var apollo = angular.module('apollo', ['ngRoute']);

var restFactories = require('./rest-factories.js');
restFactories(apollo);

apollo.factory('respoke', function () {
    return respoke;
});

apollo.controller('GlobalController', require('./GlobalController'));
apollo.controller('MainController', require('./MainController'));
apollo.factory('marked', function () {
    return marked;
});
apollo.factory('emo', function () {
    return require('./emo');
});
apollo.filter('orderRecents', function() {
    return function(items) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        filtered.sort(function (a, b) {
            if (a.presence && !b.presence) {
                return 1;
            }
            if (!a.presence && b.presence) {
                return -1;
            }
            if (a.presence !== 'unavailable' && b.presence === 'unavailable') {
                return -1;
            }
            if (a.presence === 'unavailable' && b.presence !== 'unavailable') {
                return 1
            }
            return 0;
        });
        return filtered;
    };
});
apollo.directive('apEnter', function () {
    return {
        link: function (scope, element, attrs) {
            element.bind("keypress", function (event) {
                if (event.which === 13 && !event.shiftKey) {
                    scope.$apply(function () {
                        scope.$eval(attrs.apEnter);
                    });
                    event.preventDefault();
                }
            });
        }
    };
});


apollo.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'partials/main.html'
        })
        .when('/welcome', {
            templateUrl: 'partials/login-register.html'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);
