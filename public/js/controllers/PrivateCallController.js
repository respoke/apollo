'use strict';
exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    '$location',
    '$window',

    'Message',
    'Account',
    'respokeVideo',
    'moment',

    function ($log, $rootScope, $scope, $location, $window, Message, Account, respokeVideo, moment) {
        var callOptions = {
            constraints: {audio: true, video: true},

            // your video
            onPreviewLocalMedia: function (evt) {
                respokeVideo.setLocalVideo(evt.element);
            },
            // your video
            onLocalMedia: function (evt) {
                respokeVideo.setLocalVideo(evt.element);
            },

            // their video
            onConnect: function (evt) {
                respokeVideo.setRemoteVideo(evt.element);
                $window.pixies.stop();
            }

        };
        var cleanUpCall = function () {
            respokeVideo.cleanup();
            $window.pixies.resume();

            $rootScope.notifications.push(
                $scope.selectedChat.display + ' left.'
            );
            $scope.remoteConnection = null;
            $scope.selectedChat = {
                messages: [],
                _id: "",
                display: ""
            };
            $scope.$apply();

        };
        var joinGroup = function () {
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
                                    $scope.remoteConnection = otherMembers[otherMembers.length - 1];
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
                    $log.debug('failed to join', evt);
                }
            });
        };

        $scope.errorMessage = "";
        $scope.moment = moment;
        $scope.showFullChat = true;
        $scope.activeCall = null;

        $scope.groupId = $location.absUrl().split('/')[4];
        $scope.group = null;

        $scope.remoteConnection = null;

        $scope.selectedChat = {
            messages: [],
            _id: "",
            display: ""
        };


        if ($rootScope.client.connectionId) {
            $rootScope.setPresence('call');
            joinGroup();
        }
        else {
            $rootScope.client.listen('connect', function () {
                $rootScope.setPresence('call');
                joinGroup();
            });
        }

        // when a call comes in
        $rootScope.client.listen('call', function (evt) {
            // when we are the caller, no need to display the incoming call
            if (evt.call.caller) {
                return;
            }

            $scope.activeCall = evt.call;
            $scope.activeCall.answer(callOptions);
            $scope.$apply();
        });


        function bindStuff() {
            $log.debug('bindStuff', $scope.remoteConnection);
            if ($scope.remoteConnection) {
                fetchEndpointAccount($scope.remoteConnection.endpointId);
                fetchChat();
                // video will be started by the first person there
            }

            // listen for somebody joining
            $scope.group.listen('join', function (evt) {
                $log.debug('person joined', evt.connection);
                if (!$scope.remoteConnection) {
                    $scope.remoteConnection = evt.connection;
                    fetchEndpointAccount($scope.remoteConnection.endpointId);
                    fetchChat();
                    startVideo();
                }
            });
            $scope.group.listen('leave', function (evt) {
                $log.debug('person left', evt.connection);

                // the person we're chatting with is the one who left
                var remoteEndpointLeft = $scope.remoteConnection && $scope.remoteConnection.endpointId === evt.connection.endpointId;
                if (remoteEndpointLeft) {
                    cleanUpCall();
                }

                // otherwise it was someone else trying to join, so ignore them
            });

            // listen for incoming messages
            $rootScope.client.listen('message', function (evt) {
                var notMessageFromChatPartner = !$scope.remoteConnection
                    || !evt.message
                    || !evt.message.endpointId
                    || evt.message.endpointId !== $scope.remoteConnection.endpointId;

                if (notMessageFromChatPartner) {
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
            Message.get('?account=' + $scope.remoteConnection.endpointId, function (err, messages) {
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

        function startVideo() {
            $scope.activeCall = $scope.remoteConnection.startVideoCall(callOptions);
        }
    }
];
