/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
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
apollo.factory('clientConfig', function () {
    return clientConfig;
});
apollo.factory('notify', require('./services/notify.js'));
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
apollo.factory('mentionRenderer', function () {
    return require('./parsers/mention.js');
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
apollo.filter('orderRecents', require('./filters/sort-order-recents'));

// Directives
apollo.directive('apDate', require('./directives/ap-date'));
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
apollo.directive('apAudioviz', require('./directives/ap-audioviz.js'));

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
// setting Apollo API base url
apollo.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(['$q', function ($q) {
        return {
            request: function (config) {
                if (!clientConfig.apolloBaseUrl) {
                    return config;
                }
                if (config.url && config.url[0] !== '/') {
                    config.url = '/' + config.url;
                }
                config.url = clientConfig.apolloBaseUrl + config.url;
                return config || $q.when(config);
            }
        }
    }]);
}]);
