'use strict';
exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    'Account',

    function ($log, $rootScope, $scope, Account) {

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

    }
];    
