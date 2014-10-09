'use strict';
exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    '$location',

    'Message',
    'Account',
    'moment',

    function ($log, $rootScope, $scope, $location, Message, Account, moment) {
        $scope.errorMessage = "";
        $scope.moment = moment;
        $scope.showFullChat = true;

        $scope.groupId = $location.absUrl().split('/')[4];
        $scope.group = null;

        $scope.remoteEndpoint = null;

        $scope.selectedChat = {
            messages: [],
            _id: "",
            display: ""
        };


        if ($rootScope.client.connectionId) {
            joinGroup();
        }
        else {
            $rootScope.client.listen('connect', function () {
                joinGroup();
            });
        }

        function joinGroup() {
            $log.debug('joining', $scope.groupId);
            $rootScope.client.join({
                id: $scope.groupId,
                onSuccess: function (group) {
                    $log.debug('joined', $scope.groupId, group);

                    // see if anyone else is here
                    $scope.group = group;
                    $log.debug('fetching group members');
                    group.getMembers({
                        onSuccess: function (members) {
                            var otherMembers = members.filter(function (conn) {
                                $log.debug('group member', conn);
                                if (conn.endpointId !== $rootScope.account._id) {
                                    return conn;
                                }
                                return false;
                            });
                            if (otherMembers.length) {
                                var distinctEndpoints = [];
                                otherMembers.forEach(function (conn) {
                                    if (distinctEndpoints.indexOf(conn.endpointId) === -1) {
                                        distinctEndpoints.push(conn.endpointId);
                                    }
                                });
                                $log.debug('distinctEndpoints', distinctEndpoints);
                                if (distinctEndpoints.length > 1) {
                                    $log.error('Muliple endpoints already in this call.');
                                    group.leave();
                                    $scope.errorMessage = "This call is already in progress, and is private.";
                                    $scope.$apply();
                                    return;
                                }
                                else if (distinctEndpoints.length === 1) {
                                    $log.debug('found other endpoint', otherMembers);
                                    $scope.remoteEndpoint = otherMembers[0].getEndpoint();
                                }
                            }
                            bindStuff();
                        },
                        onError: function (evt) {
                            $log.error('getMembers error', evt);
                        }
                    });
                },
                onError: function (evt) {
                    $loc.debug('failed to join', evt);
                }
            });
        }

        function bindStuff() {
            $log.debug('bindStuff', $scope.remoteEndpoint);
            if ($scope.remoteEndpoint) {
                fetchEndpointAccount($scope.remoteEndpoint.id);
                fetchChat();
            }

            // listen for somebody joining
            $scope.group.listen('join', function (evt) {
                $log.debug('person joined', evt.connection);
                if (!$scope.remoteEndpoint) {
                    $scope.remoteEndpoint = evt.connection.getEndpoint();
                    fetchEndpointAccount($scope.remoteEndpoint.id);
                    fetchChat();
                }
            });
            $scope.group.listen('leave', function (evt) {
                $log.debug('person left', evt.connection);

                // the person we're chatting with left
                if ($scope.remoteEndpoint && $scope.remoteEndpoint.id === evt.connection.endpointId) {
                    $rootScope.notifications.push($scope.remoteEndpoint.id + ' left.');
                    $scope.remoteEndpoint = null;
                    $scope.selectedChat = {
                        messages: [],
                        _id: "",
                        display: ""
                    };
                    $scope.$apply();
                }
            });

            // listen for incoming messages
            $rootScope.client.listen('message', function (evt) {
                if (
                    !$scope.remoteEndpoint
                    || !evt.message
                    || !evt.message.endpointId
                    || evt.message.endpointId !== $scope.remoteEndpoint.id
                ) {
                    // we do not care about group messages
                    // or messages from other people except
                    $log.debug('ignoring message', evt);
                    return;
                }
                var msgObject = {
                    from: $scope.selectedChat,
                    to: $rootScope.account,
                    content: evt.message.message,
                    created: new Date()
                };
                $log.debug("msgObject", msgObject);
                $scope.selectedChat.messages.push(msgObject);
                $scope.$apply();
            });
        }

        function fetchEndpointAccount(id) {
            Account.get(id, function (err, acct) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                for (var i in acct) {
                    $scope.selectedChat[i] = acct[i];
                }
            });
        }

        function fetchChat() {
            Message.get('?account=' + $scope.remoteEndpoint.id, function (err, messages) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                // Messages are sorted descending from the server, to capture
                // the latest ones. So to get the most recent on the bottom, 
                // the array gets reversed.
                messages.reverse();
                $scope.selectedChat.messages = messages;
            });
        }
    }
];
