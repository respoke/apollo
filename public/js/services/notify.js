'use strict';
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
