/* global angular */
/* global respoke */
require('./lib/mentio.js')(angular);
var apollo = angular.module('apollo', ['ngRoute', 'mentio']);

var clientConfig = require('./client-config');

// Controllers
apollo.controller('GlobalController', require('./controllers/GlobalController'));
apollo.controller('MainController', require('./controllers/MainController'));
apollo.controller('SettingsController', require('./controllers/SettingsController'));
apollo.controller('PrivateCallController', require('./controllers/PrivateCallController'));
apollo.controller('ChatController', require('./controllers/ChatController'));

// Services and Factories
require('./services/rest-factories.js')(apollo);

apollo.factory('respoke', function () {
    return clientConfig.respoke || respoke;
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
    return clientConfig.renderFile || function (fileObject, callback) {
        callback();
    };
});
apollo.factory('emoMacros', function () {
    return clientConfig.emoMacros;
});
apollo.factory('crypto', function () {
    return require('crypto');
});
apollo.factory('scrollChatToBottom', require('./lib/scroll-chat-to-bottom'));
apollo.factory('paddTopScroll', require('./lib/padd-top-scroll'));
apollo.factory('respokeVideo', require('./lib/respoke-video'));
apollo.factory('multiFileProcessor', require('./lib/multi-file-processor'));

// Filters
apollo.filter('readableDate', require('./filters/readable-date'));
apollo.filter('orderRecents', require('./filters/sort-order-recents'));

// Directives
apollo.directive('apDraggable', require('./directives/ap-draggable'));
apollo.directive('apChat', require('./directives/ap-chat'));
apollo.directive('apEnter', require('./directives/ap-enter'));
apollo.directive('apPaste', require('./directives/ap-paste'));
apollo.directive('apDrop', require('./directives/ap-drop'));
apollo.directive('apUpload', require('./directives/ap-upload'));
apollo.directive('apToggleSetting', require('./directives/ap-toggle-setting'));
apollo.directive('apMessage', require('./directives/ap-message.js'));
apollo.directive('apPresence', require('./directives/ap-presence.js'));
apollo.directive('apAvatar', require('./directives/ap-avatar.js'));

// Routes for main /#/
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
