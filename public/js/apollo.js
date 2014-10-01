/* global respoke */
var apollo = angular.module('apollo', ['ngRoute']);

var restFactories = require('./rest-factories.js');
restFactories(apollo);

apollo.factory('respoke', function () {
    return respoke;
});

apollo.controller('GlobalController', require('./GlobalController'));
apollo.controller('MainController', require('./MainController'));
apollo.factory('marked', function () {
    var marked = require('marked');
    marked.setOptions({
        highlight: function (code) {
            return require('highlight.js').highlightAuto(code).value;
        }
    });
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
