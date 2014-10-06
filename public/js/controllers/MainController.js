var chat;
function scrollChatToBottom(force) {
    if (!chat) {
        chat = document.getElementById('chat');
    }
    var nearBottomOfChat = chat.scrollHeight - chat.scrollTop < 320;
    setTimeout(function () {
        if (nearBottomOfChat || force) {
            chat.scrollTop = chat.scrollHeight;
        }
    });
   
}
function focusInput() {
    document.getElementById('textInput').focus();
}
exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    '$sce',
    '$interval',
    '$window',

    'Account',
    'Group',
    'Message',
    'File',
    'marked',
    'emo',
    'moment',
    'favicon',

    function (
        $log,
        $rootScope,
        $scope,
        $sce,
        $interval,
        $window,

        Account,
        Group,
        Message,
        File,
        marked,
        emo,
        moment,
        favicon

    ) {
        // make available to the view
        $scope.trustAsHtml = $sce.trustAsHtml;
        $scope.marked = marked;
        $scope.emo = emo;
        $scope.moment = moment;
        $scope.account = $rootScope.account;

        $scope.showFullChat = true;
        $scope.showSettings = false;
        $scope.setSettingsVisible = function (val) {
            $scope.showSettings = val;
            if (val) {
                $scope.selectedChat = null;
                $window.pixies.resume();
            }
            else {
                $window.pixies.stop();
            }
        };
        $scope.selectedChat = null;

        $scope.activeCall = null;
        $scope.incomingCall = "";
        $scope.messagesDuringBlur = 0;
        $scope.windowInFocus = true;

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
                return true
            }
            return false;
        };

        $window.addEventListener('focus', function () {
            $scope.windowInFocus = true;
            $scope.messagesDuringBlur = 0;
            favicon($scope.messagesDuringBlur);
        });
        $window.addEventListener('blur', function () {
            $scope.windowInFocus = false;
        });

        Account.get(function (err, accounts) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            var setPresenceListener = function (endpt) {
                return function () {
                    $rootScope.recents[endpt].endpoint = $rootScope.client.getEndpoint({ id: endpt });
                    $rootScope.recents[endpt].endpoint.listen('presence', function (evt) {
                            $log.debug('presence for endpoint', evt);
                            $rootScope.recents[endpt].presence = evt.presence;
                            $scope.$apply();
                        });
                };
            };
            var listeners = [];

            accounts.forEach(function (account) {
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
            // $log.debug('message event', evt);
            var itemId = evt.group ? 'group-' + evt.group.id : evt.message.endpointId;

            // Adding the message to local history
            if (evt.group) {
                $rootScope.recents[itemId].messages.push({
                    group: evt.group.id,
                    from: $rootScope.recents[evt.message.endpointId],
                    content: evt.message.message
                });
            }
            else {
                $rootScope.recents[itemId].messages.push({
                    from: $rootScope.recents[itemId],
                    to: $rootScope.account,
                    content: evt.message.message
                });
            }

            // Playing sounds
            // they do not play when you have focus on the window and are viewing the chat
            if (
                !$scope.windowInFocus
                || !$scope.selectedChat
                || itemId !== $scope.selectedChat._id
            ) {
                $log.debug('group sound', evt.group, $rootScope.account.settings.groupMessageSounds);
                if (evt.group && $rootScope.account.settings.groupMessageSounds) {
                    $rootScope.audio.messageGroup.play();
                }
                else if (!evt.group && $rootScope.account.settings.privateMessageSounds) {
                    $rootScope.audio.messagePrivate.play();
                }
            }

            // Tracking unread items on this chat
            $rootScope.recents[itemId].unread = $rootScope.recents[itemId].unread || 0;
            if (!$scope.windowInFocus || ($scope.selectedChat && itemId !== $scope.selectedChat._id)) {
                $rootScope.recents[itemId].unread++;
            }

            // Update favicon while window is out of focus
            if (!$scope.windowInFocus) {
                $scope.messagesDuringBlur++
                favicon($scope.messagesDuringBlur);
            }

            $rootScope.$apply();

            // TODO: implement this in a directive
            // scrolling the chat window
            if ($scope.selectedChat && itemId === $scope.selectedChat._id) {
                scrollChatToBottom(true);
            }
        });
        
        // receive calls
        $rootScope.client.ignore('call');
        $rootScope.client.listen('call', function (evt) {
            if (evt.call.caller) {
                return;
            }
            if ($scope.activeCall) {
                $rootScope.notifications.push(
                    $rootScope.recents[evt.endpoint.id].display
                    + ' tried to call you.'
                );
                return;
            }
            $scope.activeCall = evt.call;
            $scope.incomingCall = $rootScope.recents[evt.endpoint.id].display;
            $rootScope.audio.callIncoming.play();
            $rootScope.audio.callIncoming.loop = true;
            $scope.$apply();
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
            $scope.setSettingsVisible(false);
            // reset the current chat unreads to zero
            if ($scope.selectedChat) {
                $scope.selectedChat.unread = 0;
            }
            
            // switch the chat
            $scope.selectedChat = $rootScope.recents[id];
            // reset the NEW chat unreads to zero
            $scope.selectedChat.unread = 0;

            if ($scope.selectedChat.messages.length < 100) {
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
                    // Messages are sorted descending from the server, to capture
                    // the latest ones. So to get the most recent on the bottom, 
                    // the array gets reversed.
                    messages.reverse();
                    $scope.selectedChat.messages = messages;
                    scrollChatToBottom(true);
                    focusInput();
                });
            }
            else {
                scrollChatToBottom(true);
            }
        };

        $scope.sendMessage = function (txt) {
            $log.debug('sendMessage', txt);
            if (!txt) {
                return;
            }
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
            scrollChatToBottom(true);
        };

        $scope.audioCall = function (id) {
            $log.debug('audio call requested with ', id);
            var endpoint = $rootScope.client.getEndpoint({ id: id });
            $scope.activeCall = endpoint.startAudioCall();
            $scope.activeCall.listen('hangup', function () {
                $scope.activeCall = null;

                // in case the hangup happened before the answer
                $rootScope.audio.callIncoming.pause();
                $rootScope.audio.callIncoming.loop = false;
                $rootScope.audio.callIncoming.currentTime = 0;
                $scope.$apply();
            });
        };
        $scope.hangup = function () {
            if ($scope.activeCall) {
                $scope.activeCall.hangup();
                $scope.activeCall = null;
                // in case we were being rung
                $scope.incomingCall = "";
                $rootScope.audio.callIncoming.pause();
                $rootScope.audio.callIncoming.loop = false;
                $rootScope.audio.callIncoming.currentTime = 0;
            }
        };
        $scope.answer = function () {
            if ($scope.activeCall) {
                $scope.activeCall.answer({
                    constraints: {
                        audio: true,
                        video: true
                    }
                });
                $scope.incomingCall = "";
                $rootScope.audio.callIncoming.pause();
                $rootScope.audio.callIncoming.loop = false;
                $rootScope.audio.callIncoming.currentTime = 0;
            }
        };

        $scope.onPasteUpload = function (data) {
            // $log.debug('paste upload', data);
            File.create({
                contentType: data.contentType,
                content: data.content
            }, onAfterUpload);
        };

        $scope.onDropUpload = function (data) {
            $log.debug('drop upload', data);
            File.create({
                contentType: data.contentType,
                content: data.content,
                name: data.name
            }, onAfterUpload);
        };

        function onAfterUpload(err, file) {
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            var fileURL = '/files/' + file._id;
            var bytes = (4 * (file.content.length / 3)) * .6;

            var displayText = file.contentType;
            if (/audio/.test(file.contentType)) {
                displayText = ':file-audio-o:';
            }
            else if (/video/.test(file.contentType)) {
                displayText = ':file-video-o:';
            }
            else if (/zip|gz|tar/.test(file.contentType)) {
                displayText = ':file-archive-o:';
            }
            else if (/html|javascript|css|json/.test(file.contentType)) {
                displayText = ':file-code-o:';
            }
            else if (/pdf/.test(file.contentType)) {
                displayText = ':file-pdf-o:';
            }
            else if (/text/.test(file.contentType)) {
                displayText = ':file-text-o';
            }

            if (file.name) {
                displayText += ' ' + file.name;
            }
            var messageText = file.contentType.indexOf('image') !== -1
                ? '![' + file._id + '](' + fileURL + ')'
                : '[' + displayText + ' - ' + (bytes/1024/1024).toFixed(3) + 'mb' + '](/files/' + file._id + ')';
            
            $scope.sendMessage(messageText);
        }
    }

];
