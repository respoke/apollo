/* global respoke */
var apollo = angular.module('apollo', ['ngRoute']);

var restFactories = require('./rest-factories.js');
restFactories(apollo);

apollo.factory('respoke', function () {
    return respoke;
});
apollo.controller('GlobalController', require('./GlobalController'));

apollo.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/welcome', {
            templateUrl: 'partials/login-register.html'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);
