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
exports = module.exports = [
    '$log',
    '$window',
    '$rootScope',
    '$scope',
    'Account',
    'Group',

    function ($log, $window, $rootScope, $scope, Account, Group) {

        $scope.updateSetting = function (key, val, callback) {
            $log.debug('setting change', key, val);
            var settings = $rootScope.account.settings;
            settings[key] = val;
            Account.update({
                settings: settings
            }, function (err, acct) {
                if (err) {
                    $rootScope.notification.push(err);
                    return;
                }
                $rootScope.account = acct;
                if (callback) {
                    callback();
                }
            });
        };

        $scope.removeGroup = function (id, ix) {
            $log.debug('remove group', id);
            Group.remove(id, function (err) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                delete $rootScope.recents['group-' + id];
                $rootScope.ownedGroups.splice(ix, 1);
                $rootScope.notifications.push('Removed group successfully.');
            });
        };

        $scope.changeTheme = function (theme) {
            $scope.updateSetting('theme', theme, function () {
                $window.location.reload();
            });
        };

    }
];
