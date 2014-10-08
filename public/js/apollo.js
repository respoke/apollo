/* global angular */
/* global respoke */
var apollo = angular.module('apollo', ['ngRoute']);

var clientConfig = require('./client-config');

// Controllers
apollo.controller('GlobalController', require('./controllers/GlobalController'));
apollo.controller('MainController', require('./controllers/MainController'));
apollo.controller('SettingsController', require('./controllers/SettingsController'));

// Services and Factories
require('./services/rest-factories.js')(apollo);
apollo.factory('respoke', function () {
    return respoke;
});
apollo.factory('moment', function () {
    return require('moment');
});
apollo.factory('favicon', function () {
    return require('./lib/favicon');
});
apollo.factory('messageRenderingMiddleware', function () {
    return clientConfig.messageRenderingMiddleware;
});
apollo.factory('renderFile', function () {
    return clientConfig.renderFile;
});
apollo.factory('scrollChatToBottom', ['$rootScope', function ($rootScope) {
    var chat;
    var scrollChatToBottom = function () {
        if (!chat) {
            chat = document.getElementById('chat');
        }
        if (!$rootScope.autoScrollDisabled) {
            chat.scrollTop = chat.scrollHeight;
        }
    };
    return scrollChatToBottom;
}]);
apollo.factory('paddTopScroll', function () {
    return function (items) {
        var rows = document.querySelectorAll('#chat-table tr');
        if (!rows || !rows.length) {
            return;
        }
        var totalHeight = 0;
        for (var i=0; i<items && i<rows.length; i++) {
            totalHeight += rows[i].offsetHeight
        }
        chat.scrollTop = totalHeight;
    };
});

// Filters
apollo.filter('orderRecents', require('./filters/sort-order-recents'));

// Directives
apollo.directive('apChat', require('./directives/ap-chat'));
apollo.directive('apEnter', require('./directives/ap-enter'));
apollo.directive('apPaste', require('./directives/ap-paste'));
apollo.directive('apDrop', require('./directives/ap-drop'));
apollo.directive('apToggleSetting', require('./directives/ap-toggle-setting'));
apollo.directive('apMessage', require('./directives/ap-message.js'));

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
