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
    }

];
