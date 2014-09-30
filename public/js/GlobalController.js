exports = module.exports = [
    '$log',
    '$location',
    '$rootScope',
    'Account',

    function ($log, $location, $rootScope, Account) {
        $rootScope.me = {};
        Account.getMe(function (err, me) {
            if (err) {
                $log.error(err);
                return;
            }
            $log.debug('me', me);
            $rootScope.me = me;
            if (!me) {
                $location.path('/welcome');
            }
        });
    }

];
