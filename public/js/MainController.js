exports = module.exports = [
    '$log',
    '$location',
    '$rootScope',
    '$scope',
    'Account',
    'Group',
    'respoke',
    'marked',

    function ($log, $location, $rootScope, $scope, Account, Group, respoke, marked) {
        $scope.showFullChat = true;
        $scope.selectedChat = null;

        Account.get(function (err, accounts) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            var setPresenceListener = function (endpt) {
                return function () {
                    var endpoint = $rootScope.client.getEndpoint({ id: endpt });
                    endpoint.listen('presence', function (evt) {
                        $log.debug('presence for endpoint', evt);
                        $rootScope.recents[endpt].presence = evt.presence;
                        $scope.$apply();
                    });
                };
            };
            var listeners = [];

            accounts.forEach(function (account) {
                if (account._id === $rootScope.account._id) {
                    return;
                }
                $rootScope.recents[account._id] = account;
                $rootScope.recents[account._id].messages = [];
                $rootScope.recents[account._id].presence = "unavailable";
                listeners.push(setPresenceListener(account._id));
            });
            if ($rootScope.client.connectionId) {
                listeners.forEach(function (listener) {
                    listener();
                });
            }
            else {
                $rootScope.client.listen('connect', function addPresenceListeners() {
                    listeners.forEach(function (listener) {
                        listener();
                    });
                });
            }
        });

        Group.get(function (err, groups) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            groups.forEach(function (group) {
                $rootScope.recents['group-' + group._id] = group;
                $rootScope.recents['group-' + group._id].messages = [];
                $rootScope.client.join({
                    onSuccess: function (evt) {
                        $log.debug('joined ' + evt.group.id);
                    },
                    onError: function (evt) {
                        $log.debug('FAIL joining ' + evt.group.id);
                    }
                });
            });
        });

        $rootScope.client.ignore('message');
        $rootScope.client.listen('message', function (evt) {
            $log.debug('message event', evt);
            $log.debug('marked message', marked(evt.message.message));
        });

        $scope.createGroup = function (groupName) {
            Group.create({
                _id: groupName
            });
        };
    }

];
