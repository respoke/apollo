exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    'Account',
    'Group',
    'Message',
    'marked',
    'emo',
    '$sce',

    function ($log, $rootScope, $scope, Account, Group, Message, marked, emo, $sce) {
        // make available to the view
        $scope.trustAsHtml = $sce.trustAsHtml;
        $scope.marked = marked;
        $scope.emo = emo;

        $scope.showFullChat = true;
        $scope.selectedChat = null;

        Account.get(function (err, accounts) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            var setPresenceListener = function (endpt) {
                return function () {
                    $rootScope.client
                        .getEndpoint({ id: endpt })
                        .listen('presence', function (evt) {
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
    
        function bindGroup(group) {
            $rootScope.client.join({
                id: group._id,
                onSuccess: function (evt) {
                    $log.debug('joined ' + group._id);
                    $rootScope.recents['group-' + group._id] = group;
                    $rootScope.recents['group-' + group._id].messages = [];
                    $rootScope.$apply();
                },
                onError: function (evt) {
                    $log.debug('FAIL joining ' + group._id, evt);
                }
            });
        }

        Group.get(function (err, groups) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            if ($rootScope.client.connectionId) {
                groups.forEach(bindGroup);
            }
            else {
                $rootScope.client.listen('connect', function joinGroups() {
                    groups.forEach(bindGroup);
                });
            }
        });

        // receiving messages
        $rootScope.client.ignore('message');
        $rootScope.client.listen('message', function (evt) {
            $log.debug('message event', evt);
            // group message
            if (evt.group) {
                $rootScope.recents['group-' + evt.group.id].messages.push({
                    group: evt.group.id,
                    from: $rootScope.recents[evt.message.endpointId],
                    content: evt.message.message
                });
                if (!$rootScope.recents['group-' + evt.group.id].unread) {
                    $rootScope.recents['group-' + evt.group.id].unread = 0;
                }
                $rootScope.recents['group-' + evt.group.id].unread++;
            }
            // private message
            else {
                $rootScope.recents[evt.message.endpointId].messages.push({
                    from: $rootScope.recents[evt.message.endpointId],
                    to: $rootScope.account,
                    content: evt.message.message
                });
                if (!$rootScope.recents[evt.message.endpointId].unread) {
                    $rootScope.recents[evt.message.endpointId].unread = 0;
                }
                $rootScope.recents[evt.message.endpointId].unread++;
            }
            $rootScope.$apply();
        });

        $scope.createGroup = function (groupName) {
            Group.create({
                _id: groupName
            }, function (err, group) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                bindGroup(group);
            });
        };

        $scope.switchChat = function (id) {
            $log.debug('switchChat', id);
            // reset the current chat unreads to zero
            if ($scope.selectedChat) {
                $scope.selectedChat.unread = 0;
            }
            
            // switch the chat
            $scope.selectedChat = $rootScope.recents[id];
            // reset the NEW chat unreads to zero
            $scope.selectedChat.unread = 0;

            if ($scope.selectedChat.messages.length < 200) {
                var qs;
                if ($scope.selectedChat.display) {
                    qs = '?account=' + $scope.selectedChat._id;
                }
                else {
                    qs = '?group=' + $scope.selectedChat._id;
                }
                Message.get(qs, function (err, messages) {
                    if (err) {
                        $rootScope.notifications.push(err);
                        return;
                    }
                    $scope.selectedChat.messages = messages;
                });
            }
        };

        $scope.sendMessage = function (txt) {
            $log.debug('sendMessage', txt);
            var msg = {
                content: txt
            };
            if ($scope.selectedChat.display) {
                msg.to = $scope.selectedChat._id;
            }
            else {
                msg.group = $scope.selectedChat._id;
            }
            $scope.selectedChat.messages.push({
                content: txt,
                from: $rootScope.account
            });
            Message.create(msg, function (err, sentMessage) {
                if (err) {
                    $rootScope.notifications.push(err);
                    $scope.selectedChat.messages.pop();
                    return;
                }

            });
        };
    }

];
