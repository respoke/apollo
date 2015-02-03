/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
/* global WIN */
/* global showWin */
'use strict';
function focusInput() {
    document.getElementById('textInput').focus();
}
exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    '$timeout',
    '$window',

    'Account',
    'Group',
    'Message',
    'File',
    'moment',
    'favicon',
    'scrollChatToBottom',
    'notify',
    'mentionRenderer',
    /**
     * The controller for logged-in user stuff. Governs the logged-in UI, pieces of
     * chat, incoming and outgoing calls, and event listeners.
     */
    function MainController(
        $log,
        $rootScope,
        $scope,
        $timeout,
        $window,

        Account,
        Group,
        Message,
        File,
        moment,
        favicon,
        scrollChatToBottom,
        notify,
        mentionRenderer

    ) {
        // make available to the view
        $scope.moment = moment;

        $scope.showFullChat = true;
        $scope.selectedChat = null;
        $scope.callIsRinging = false;

        $scope.activeCall = null;
        $scope.incomingCall = "";
        $scope.messagesDuringBlur = 0;
        $scope.windowInFocus = true;

        $scope.isAllowedToCall = function (item) {
            var isPersonAndOnline = item.display && item.presence !== 'unavailable';
            var isNotSelected = $scope.selectedChat && $scope.selectedChat._id === item._id;
            var isNotOnCall = !$scope.activeCall;
            return isPersonAndOnline && isNotSelected && isNotOnCall;
        };

        var listenOwnPresence = function () {
            // listen for own presence
            $rootScope.client.listen('presence', function (evt) {
                $log.debug('presence for self', evt);
                $rootScope.recents[$rootScope.account._id].presence = evt.presence;
                $scope.$apply();
            });
        };

        $scope.recentQuery = "";
        $scope.filterRecents = function (val) {
            if (!$scope.recentQuery) {
                return true;
            }
            var re = new RegExp($scope.recentQuery, 'i');
            if (re.test(val._id)) {
                return true;
            }
            if (val.display && re.test(val.display)) {
                return true;
            }
            return false;
        };


        function onWindowFocus() {
            $scope.windowInFocus = true;
            $scope.messagesDuringBlur = 0;
            favicon($scope.messagesDuringBlur);

            if ($scope.selectedChat) {
                if ($scope.selectedChat.unread) {
                    scrollChatToBottom();
                }
                $scope.selectedChat.unread = 0;
                $scope.$apply();
            }
            // force chat scrolling to the bottom, because it will not scroll
            // when the window is out of focus on some browsers
            focusInput();
        }
        function onWindowBlur() {
            $scope.windowInFocus = false;
        }
        $window.addEventListener('focus', onWindowFocus);
        $window.addEventListener('blur', onWindowBlur);
        // node-webkit
        if (window.nwDispatcher) {
            WIN.on('blur', onWindowBlur);
            WIN.on('focus', onWindowFocus);
        }


        function refetchAllChats() {
            $log.debug('re-fetching all chat histories after reconnect');
            Object.keys($rootScope.recents).forEach(function (id) {
                $scope.fetchChat($rootScope.recents[id]);
            });
        }
        $rootScope.client.ignore('connect', refetchAllChats);
        $rootScope.client.listen('connect', refetchAllChats);


        Account.get(function (err, accounts) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }

            var listeners = accounts.map(buildAccount);

            if ($rootScope.client.isConnected()) {
                listeners.forEach(function (listener) {
                    if (listener) {
                        listener();
                    }
                });
            }
            else {
                $rootScope.client.listen('connect', function addPresenceListeners() {
                    listeners.forEach(function (listener) {
                        if (listener) {
                            listener();
                        }
                    });
                });
            }
        });

        if ($rootScope.client.isConnected()) {
            $rootScope.client.setPresence({ presence: 'available' });
            listenOwnPresence();
        }
        else {
            $rootScope.client.listen('connect', function setOwnPresence() {
                $rootScope.client.setPresence({ presence: 'available' });
                listenOwnPresence();
            });
        }

        function buildAccount(account) {
            if (account._id === $rootScope.account._id) {
                return null;
            }
            $rootScope.recents[account._id] = account;
            $rootScope.recents[account._id].messages = [];
            $rootScope.recents[account._id].chatstate = {};
            $rootScope.recents[account._id].presence = "unavailable";
            $rootScope.recents[account._id].unread = 0;
            // seed every chat in the background
            $scope.fetchChat($rootScope.recents[account._id]);
            return setPresenceListener(account._id);
        }

        function setPresenceListener(endpt) {
            return function () {
                $rootScope.recents[endpt].endpoint = $rootScope.client.getEndpoint({ id: endpt });
                $rootScope.recents[endpt].endpoint.listen('presence', function (evt) {
                    $log.debug('presence for endpoint', evt);
                    $rootScope.recents[endpt].presence = evt.presence;
                    $scope.$apply();
                });
            };
        }

        function bindGroup(group, callback) {
            $rootScope.client.join({
                id: group._id,
                onSuccess: function (evt) {
                    $log.debug('joined ' + group._id);
                    // if this was a rejoin, use the existing messages
                    var msgs = $rootScope.recents['group-' + group._id]
                        ? $rootScope.recents['group-' + group._id].messages || []
                        : [];
                    $rootScope.recents['group-' + group._id] = group;
                    $rootScope.recents['group-' + group._id].messages = msgs;
                    $rootScope.recents['group-' + group._id].chatstate = {};
                    // seed the chat in the background
                    $scope.fetchChat($rootScope.recents['group-' + group._id]);
                    $rootScope.$apply();
                    if (typeof callback === 'function') {
                        callback();
                    }
                },
                onError: function (evt) {
                    $log.debug('FAIL joining ' + group._id, evt);
                },
                join: function (evt) {
                    setPresenceListener(evt.connection.endpoint)();
                }
            });
        }

        // All groups are retrieved. Messages are populated for them.
        Group.get(function (err, groups) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            // already connected
            if ($rootScope.client.isConnected()) {
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
        $rootScope.client.listen('message', function onMessageReceived(evt) {

            try {
                evt.message.message = JSON.parse(evt.message.message);
            } catch (ignored) {
                $log.debug('INVALID JSON message content received', evt);
            }

            var fromSystemGroup = evt.group && evt.group.id === $rootScope.systemGroupId;
            var hasMetaContent = evt.message.message.meta && evt.message.message.meta.type;
            var msgType;
            var msgValue;

            if (hasMetaContent) {
                msgType = evt.message.message.meta.type;
                msgValue = evt.message.message.meta.value;
            }
            else {
                msgValue = evt.message.message.text;
            }

            // System messages
            if (fromSystemGroup && hasMetaContent) {
                $log.debug('system message', evt);

                switch (msgType) {
                    case 'newaccount':
                        // these notifications come through twice.
                        // when the account is created, and when the account is confirmed.
                        if ($scope.selectedChat && $scope.selectedChat._id === msgValue) {
                            $scope.selectedChat = null;
                        }
                        Account.get(msgValue, function (err, account) {
                            if (err) {
                                $rootScope.notifications.push(err);
                                return;
                            }
                            buildAccount(account)();
                        });
                    break;
                    case 'removeaccount':
                        // these notifications come through twice.
                        // when the account is created, and when the account is confirmed.
                        $rootScope.recents[msgValue].endpoint.ignore('presence');
                        if ($scope.selectedChat && $scope.selectedChat._id === msgValue) {
                            $scope.selectedChat = null;
                            $rootScope.notifications.push(
                                'The person you were chatting with has been removed.'
                            );
                        }
                        delete $rootScope.recents[msgValue];
                        break;
                    case 'newgroup':
                        Group.get(msgValue, function (err, group) {
                            if (err) {
                                $rootScope.notifications.push(err);
                                return;
                            }
                            bindGroup(group);
                        });
                    break;
                    case 'removegroup':
                        if ($rootScope.recents['group-' + msgValue]) {
                            $rootScope.client.getGroup({ id: msgValue }).leave();
                            if ($scope.selectedChat && $scope.selectedChat._id === 'group-' + msgValue) {
                                $rootScope.notifications.push(
                                    "Group " + msgValue + " was just deleted by the owner."
                                );
                                $scope.selectedChat = null;
                            }
                            delete $rootScope.recents['group-' + msgValue];
                            $rootScope.$apply();
                        }
                    break;
                }
                return;
            }

            var itemId = evt.group ? 'group-' + evt.group.id : evt.message.endpointId;

            // User meta messages
            if (hasMetaContent) {
                if (msgType === 'chatstate') {
                    // clear the existing chat state first, if it is there.
                    var chatstate = $rootScope.recents[itemId].chatstate[evt.message.endpointId];
                    if (chatstate && chatstate.$timeout) {
                        $timeout.cancel(chatstate.$timeout);
                    }
                    $rootScope.recents[itemId].chatstate[evt.message.endpointId] = {
                        value: msgValue,
                        $timeout: $timeout(function () {
                            $rootScope.recents[itemId].chatstate[evt.message.endpointId] = null;
                        }, 3000)
                    };
                    $rootScope.$apply();
                }
                return;
            }

            // Normal messages

            var groupIsMuted = evt.group && $rootScope.account.settings.mutedGroups && $rootScope.account.settings.mutedGroups.indexOf(evt.group.id) !== -1;
            // Adding the message to local history
            if (evt.group) {
                $rootScope.recents[itemId].messages.push({
                    group: evt.group.id,
                    from: $rootScope.recents[evt.message.endpointId],
                    content: evt.message.message,
                    created: new Date()
                });
                // clear chatstate
                $timeout.cancel($rootScope.recents[itemId].chatstate[evt.message.endpointId]);
                $rootScope.recents[itemId].chatstate[evt.message.endpointId] = null;
            }
            else {
                $rootScope.recents[itemId].messages.push({
                    from: $rootScope.recents[itemId],
                    to: $rootScope.account,
                    content: evt.message.message,
                    created: new Date()
                });
            }

            var notifTitle;
            var from = $rootScope.recents[evt.message.endpointId]
                ? $rootScope.recents[evt.message.endpointId].display
                : evt.message.endpointId;
            if (evt.group) {
                notifTitle = from + ' > ' + evt.group.id;
            }
            else {
                notifTitle = from;
            }
            var thisMessageNotif = function () {
                var output = mentionRenderer($rootScope.recents, msgValue, function (input) {
                    return '@' + input;
                });
                notify({
                    title: notifTitle,
                    body: output.substring(0, 80) + (output.length > 80 ? '...' : '')
                });
            };
            // If you're mentioned, you get notified by sound
            var reMe = new RegExp("\\[\\~" + $rootScope.account._id + "\\]");
            var wasMentioned = msgValue && msgValue.match(reMe);
            if (wasMentioned && $rootScope.account.settings.notifyOnMention !== false) {
                $rootScope.audio.mention.play();
                thisMessageNotif();
            }
            // Notifications and Sounds
            // They do not play when you have focus on the window and are viewing the chat
            else if (
                !$scope.windowInFocus
                || !$scope.selectedChat
                || itemId !== $scope.selectedChat._id
            ) {
                // group message
                if (evt.group && !groupIsMuted) {
                    if ($rootScope.account.settings.groupMessageSounds) {
                        $rootScope.audio.message.play();
                    }
                    if (!$scope.windowInFocus && $rootScope.account.settings.groupDesktopNotifications) {
                        thisMessageNotif();
                    }
                }
                // private message
                else if (!evt.group) {
                    if ($rootScope.account.settings.privateMessageSounds) {
                        $rootScope.audio.message.play();
                    }
                    if (!$scope.windowInFocus && $rootScope.account.settings.privateDesktopNotifications) {
                        thisMessageNotif();
                    }
                }
            }

            // Tracking unread items on this chat
            $rootScope.recents[itemId].unread = $rootScope.recents[itemId].unread || 0;
            if (!groupIsMuted) {
                if (!$scope.windowInFocus || !$scope.selectedChat || ($scope.selectedChat && itemId !== $scope.selectedChat._id)) {
                    $rootScope.recents[itemId].unread++;
                }

                // Update favicon while window is out of focus
                if (!$scope.windowInFocus) {
                    $scope.messagesDuringBlur++;
                    favicon($scope.messagesDuringBlur);
                }
            }

            $rootScope.$apply();

        });

        $scope.createGroup = function createGroup(groupName) {
            Group.create({
                _id: groupName
            }, function (err, group) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                bindGroup(group, function () {
                    $scope.switchChat('group-' + group._id);
                });
            });
        };

        $scope.switchChat = function switchChat(id) {
            $log.debug('switchChat', id);
            if (id === $rootScope.account._id) {
                $log.debug('not switching to chat because it is self');
                return;
            }
            $scope.toggleSettings(false);
            // reset the current chat unread message count to zero
            if ($scope.selectedChat) {
                $scope.selectedChat.unread = 0;
            }

            // switch the chat
            $scope.selectedChat = $rootScope.recents[id];
            // reset the NEW chat unreads to zero
            $scope.selectedChat.unread = 0;

            // fetch messages if there arent any
            if ($scope.selectedChat.messages.length < 1) {
                $scope.fetchChat($scope.selectedChat);
            }
            else if ($scope.selectedChat.messages.length > 100) {
                var overLimit = $scope.selectedChat.messages.length - 100;
                $scope.selectedChat.messages.splice(0, overLimit);
            }
            // bummer, but we just have to do this, can't seem to find a way around it
            $rootScope.autoScrollDisabled = false;
            $timeout(function () {
                scrollChatToBottom(true);
                focusInput();
            }, 450);
        };

        $scope.fetchChat = function fetchChat(item) {
            var qs;
            if (item.display) {
                qs = '?account=' + item._id;
            }
            else {
                qs = '?group=' + item._id;
            }
            Message.get(qs, function (err, messages) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                // Messages are sorted descending from the server, to capture
                // the latest ones. So to get the most recent on the bottom,
                // the array gets reversed.
                messages.reverse();
                item.messages = messages;
                if ($scope.selectedChat && $scope.selectedChat._id === item._id) {
                    scrollChatToBottom(true);
                }
            });
        };

        var stopRinging = function stopRinging() {
            $rootScope.audio.callIncoming.pause();
            $rootScope.audio.callIncoming.loop = false;
            $rootScope.audio.callIncoming.currentTime = 0;

            $rootScope.audio.videoIncoming.pause();
            $rootScope.audio.videoIncoming.loop = false;
            $rootScope.audio.videoIncoming.currentTime = 0;

            $rootScope.audio.videoOutgoing.pause();
            $rootScope.audio.videoOutgoing.loop = false;
            $rootScope.audio.videoOutgoing.currentTime = 0;

            $rootScope.audio.callOutgoing.pause();
            $rootScope.audio.callOutgoing.loop = false;
            $rootScope.audio.callOutgoing.currentTime = 0;

            $scope.incomingCall = "";
            $scope.callIsRinging = false;
        };

        function cleanupCall() {
            stopRinging();
            $timeout(function () {
                $scope.activeCall = null;
            });
        }
        function onCallConnect(evt) {
            $log.debug('call connected', evt);

            if ($scope.activeCall && evt.target.incomingMedia.hasScreenShare()) {
                $log.debug('call is screenshare');
                $window.activeRemoteScreenshare = evt.target;
                return;
            }

            $window.activeCall = $scope.activeCall;
            $window.activeCall.chat = $rootScope.recents[$scope.activeCall.remoteEndpoint.id];
            stopRinging();
            $scope.$apply();
            if ($scope.activeCall.incomingMedia.hasVideo()) {
                $window.open('/private', '_blank');
            }
        }
        var audioCallConstraints = {
            constraints: {audio: true, video: false},
            onConnect: onCallConnect
        };
        var videoCallConstraints = {
            constraints: {audio: true, video: true},
            onConnect: onCallConnect
        };
        var receiveScreenshareConstraints = {
            constraints: {audio: false, video: false},
            onConnect: function (evt) {
                $log.debug('receive screenshare - onConnect', evt);
                $rootScope.client.fire('screenshare-added');
            },
            onHangup: function (evt) {
                $log.debug('receive screenshare - onHangup', evt);
                $rootScope.client.fire('screenshare-removed');
            },
            onError: function (evt) {
                $log.error('receive screenshare - onError', evt);
            }
        };

        var onCallReceived = function (evt) {
            // when we are the caller, no need to display the incoming call
            if (evt.call.caller) {
                $log.debug('ignoring call incoming from self', evt);
                return;
            }
            $log.debug('call incoming', evt);
            // in nodewebkit, open a special window inside the app
            if (window.nwDispatcher) {
                showWin();
            }

            // only allow one call at a time, unless you're already on a call and
            // adding a screenshare
            var hasScreenShare = evt.call.incomingMedia.hasScreenShare();
            if ($scope.activeCall && !hasScreenShare) {
                $rootScope.notifications.push(
                    $rootScope.recents[evt.endpoint.id].display
                    + ' tried to call you.'
                );
                $log.debug(
                    'instantly hanging up on incoming call because we are already on a call'
                );
                evt.call.hangup();
                stopRinging();
                $scope.$apply();
                return;
            }

            // For now, you can only add a screenshare during an existing video call.
            if (hasScreenShare) {
                $window.activeRemoteScreenshare = evt.call;
                // Auto-answer a screenshare
                $window.activeRemoteScreenshare.answer(receiveScreenshareConstraints);
                return;
            }

            $scope.activeCall = evt.call;
            $scope.activeCall.listen('hangup', function (evt) {
                $log.debug('got hangup');
                cleanupCall();
                $rootScope.audio.callTimeout.play();
            });
            $scope.incomingCall = evt.endpoint.id;
            if ($scope.activeCall.incomingMedia.hasVideo()) {
                $rootScope.audio.videoIncoming.play();
                $rootScope.audio.videoIncoming.loop = true;
            }
            else {
                $rootScope.audio.callIncoming.play();
                $rootScope.audio.callIncoming.loop = true;
            }
            $scope.$apply();
        };

        // receive calls
        $rootScope.client.ignore('call');
        $rootScope.client.listen('call', onCallReceived);

        $scope.hangup = function () {
            if ($scope.activeCall) {
                if ($scope.activeCall.hangup) {
                    $scope.activeCall.hangup();
                }
                $scope.activeCall = null;
                // in case we were being rung
                stopRinging();
                $rootScope.audio.callTimeout.play();
            }
        };

        $scope.answer = function () {
            if ($scope.activeCall) {
                // answer call
                if ($scope.activeCall.incomingMedia.hasVideo()) {
                    $scope.activeCall.answer(videoCallConstraints);
                }
                else {
                    $scope.activeCall.answer(audioCallConstraints);
                }
            }
            stopRinging();
        };

        $scope.audioCall = function (id) {
            $log.debug('audio call requested with ', id);
            var endpoint = $rootScope.client.getEndpoint({ id: id });
            $scope.activeCall = endpoint.startAudioCall(audioCallConstraints);
            $scope.callIsRinging = true;
            $rootScope.audio.callOutgoing.play();
            $rootScope.audio.callOutgoing.loop = true;
            $log.debug('activeCall', $scope.activeCall);
            $scope.activeCall.listen('hangup', function () {
                $log.debug('got hangup');
                stopRinging();
                $rootScope.audio.callTimeout.play();
                $scope.activeCall = null;
            });
            $scope.activeCall.listen('answer', function (e) {
                $log.debug('call answered', e);
            });
        };

        $scope.videoCall = function (id) {
            $log.debug('video call requested with ', id);
            var endpoint = $rootScope.client.getEndpoint({ id: id });
            $scope.activeCall = endpoint.startVideoCall(videoCallConstraints);
            $scope.callIsRinging = true;
            $rootScope.audio.videoOutgoing.play();
            $rootScope.audio.videoOutgoing.loop = true;
            $log.debug('activeCall', $scope.activeCall);
            $scope.activeCall.listen('hangup', function () {
                $log.debug('got hangup');
                $scope.activeCall = null;
                cleanupCall();
                $rootScope.audio.callTimeout.play();
            });
            $scope.activeCall.listen('answer', function (e) {
                $log.debug('call answered', e);
            });
        };

    }

];
