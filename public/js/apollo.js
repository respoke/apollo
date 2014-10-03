/* global angular */
/* global respoke */
var apollo = angular.module('apollo', ['ngRoute']);

// Controllers
apollo.controller('GlobalController', require('./controllers/GlobalController'));
apollo.controller('MainController', require('./controllers/MainController'));

// Services and Factories
require('./services/rest-factories.js')(apollo);
apollo.factory('respoke', function () {
    return respoke;
});
apollo.factory('marked', function () {
    return require('./lib/marked');
});
apollo.factory('emo', function () {
    return require('./lib/emo');
});
apollo.factory('moment', function () {
    return require('moment');
});

// Filters
apollo.filter('orderRecents', require('./filters/sort-order-recents'));

// Directives
apollo.directive('apEnter', require('./directives/ap-enter'));
apollo.directive('apPaste', require('./directives/ap-paste'));
apollo.directive('apDrop', require('./directives/ap-drop'));

// Routes
apollo.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'partials/main.html'
        })
        .when('/welcome', {
            templateUrl: 'partials/welcome.html'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);
