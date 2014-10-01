exports = module.exports = [
    '$log',
    '$location',
    '$rootScope',
    '$scope',
    'Account',
    'respoke',

    function ($log, $location, $rootScope, $scope, Account, respoke) {
        $scope.showFullChat = true;
        $scope.chatTitle = "Select a person or group to join the conversation";
        $scope.recents = {};

        Account.get(function (err, accounts) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            accounts.forEach(function (account) {
                $scope.recents[account._id] = account;
            });
        });
    }

];
