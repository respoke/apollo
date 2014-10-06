'use strict';
exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    'Account',
    'Group',

    function ($log, $rootScope, $scope, Account, Group) {
        $scope.groups = null;

        Group.getByOwner($rootScope.account._id, function (err, groups) {
            if (err) {
                $rootScope.notification.push(err);
                return;
            }
            $scope.groups = groups;
        });

        $scope.updateSetting = function (key, val) {
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
                $scope.groups.splice(ix, 1);
                $rootScope.notifications.push('Removed group successfully.');
            });
        };

    }
];    
