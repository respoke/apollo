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
