'use strict';
exports = module.exports = ['$window', '$timeout', function ($window, $timeout) {
    var supportsNotifications = false;
    if ("Notification" in $window) {
        Notification.requestPermission(function (perm) {
            supportsNotifications = perm === 'granted';
        });
    }

    return function (opts) {
        if (!supportsNotifications) {
            return;
        }

        opts = opts || {};
        opts.icon = opts.icon || '/img/notification.png';
        var n = new Notification(opts.title, opts);
        $timeout(function () { n.close(); }, 3000);
    };

}];
