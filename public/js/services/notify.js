/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
/**
 * Angular factory. Provides desktop notifications, when supported by node-webkit or the
 * browser. It will initiate the prompt for browser permission once, when the angular app
 * is loading.
 *
 *     notify({ title: 'Chatroom X', body: 'Willy Nelson is my fav...' });
 */
exports = module.exports = ['$window', '$timeout', function ($window, $timeout) {
    var supportsNotifications = true;
    if (typeof Notification !== 'undefined') {
        Notification.requestPermission(function (perm) {
            supportsNotifications = perm === 'granted';
        });
    }
    else {
        supportsNotifications = false;
    }

    return function (opts) {
        if (!supportsNotifications && !$window.nwDispatcher) {
            return;
        }

        opts = opts || {};
        opts.icon = opts.icon || '/img/notification.png';
        var n = new Notification(opts.title, opts);
        $timeout(function () { n.close(); }, 4000);
    };

}];
