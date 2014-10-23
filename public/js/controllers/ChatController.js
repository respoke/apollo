'use strict';
/**
 * The controller for the ap-chat directive.
 */
exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    '$timeout',

    'Account',
    'Message',
    'File',
    'paddTopScroll',
    'scrollChatToBottom',
    'emoMacros',
    'renderFile',
    '$q',

    function ($log, $rootScope, $scope, $timeout, Account, Message, File, paddTopScroll, scrollChatToBottom, emoMacros, renderFile, $q) {
        $scope.pendingUploads = 0;
        $scope.recentlySentTyping = null;


        $rootScope.macros = [];
        $rootScope.searchMacros = function (term) {
            term = term.toLowerCase();
            return $q(function (resolve) {
                var macros = emoMacros.filter(function (mac) {
                    if (mac._id.indexOf(term) !== -1) {
                        return true;
                    }
                });
                $rootScope.macros = macros;
                resolve($rootScope.macros);
            });
        };
        $rootScope.selectedMacro = function (item) {
            return item._id;
        };


        $rootScope.allRecents = [];
        $rootScope.getMentionList = function (term) {
            var allRecents = [];
            term = term.toLowerCase();
            Object.keys($rootScope.recents).forEach(function (_id) {
                var item = $rootScope.recents[_id];
                var isPerson = item && _id.indexOf('group-') === -1 && _id !== $rootScope.account._id;
                if (isPerson && (item.display.toLowerCase().indexOf(term) !== -1 || item._id.toLowerCase().indexOf(term) !== -1)) {
                    allRecents.push({ display: item.display, _id: _id });
                }
            });
            $rootScope.allRecents = allRecents;
            return $q(function (resolve, reject) {
                resolve(allRecents);
            });
        };
        $rootScope.selectedMention = function (item) {
            return '[~' + item._id + ']';
        };


        $scope.isTyping = function () {
            if ($scope.recentlySentTyping) {
                return;
            }
            $scope.recentlySentTyping = $timeout(function () {
                $scope.recentlySentTyping = null;
            }, 3000);
            var grp = $scope.selectedChat.display ? undefined : $scope.selectedChat._id;
            var endpt = $scope.selectedChat.display ? $scope.selectedChat._id : undefined;
            Message.create({
                to: endpt,
                group: grp,
                content: {
                    meta: {
                        type: 'chatstate',
                        value: 'composing'
                    }
                },
                offRecord: true
            }, function (err, sentMessage) {
                if (err) {
                    $log.debug(err);
                    return;
                }
            });
        };

        $scope.sendMessage = function (txt, fileId) {
            $log.debug('sendMessage', txt);
            if (!txt) {
                return;
            }
            
            var msg = {
                content: {
                    text: txt
                }
            };
            // is it a private message?
            if ($scope.selectedChat.display) {
                msg.to = $scope.selectedChat._id;
                // indicate the recipient was not online and needs to be notified
                if ($scope.selectedChat.presence === 'unavailable') {
                    msg.recipientOffline = true;
                }
            }
            // or a group message
            else {
                msg.group = $scope.selectedChat._id;
            }
            if (fileId) {
                msg.file = fileId;
            }
            $scope.selectedChat.messages.push({
                content: {
                    text: txt
                },
                from: $rootScope.account,
                created: new Date()
            });
            var mentions = txt.match(/\[\~([a-z0-9]+)\]/g);
            if (mentions) {
                msg.offlineMentions = [];
                mentions.forEach(function (ment) {
                    var cleanId = ment.replace(/[\[\~\]]/g, '');
                    var person = $rootScope.recents[cleanId];
                    if (person && person.presence === 'unavailable') {
                        msg.offlineMentions.push(cleanId);
                    }
                });
            }
            Message.create(msg, function (err, sentMessage) {
                if (err) {
                    $rootScope.notifications.push(err);
                    $scope.selectedChat.messages.pop();
                    return;
                }
                scrollChatToBottom(true);
            });
        };

        $scope.loadBackMessages = function () {
            $log.debug('loadBackMessages', $scope.selectedChat);
            if (!$scope.selectedChat) {
                return;
            }
            if (!$scope.selectedChat.messages.length) {
                return;
            }
            var qs;
            if ($scope.selectedChat.display) {
                qs = '?account=' + $scope.selectedChat._id;
            }
            else {
                qs = '?group=' + $scope.selectedChat._id;
            }
            qs += '&before=' + encodeURIComponent($scope.selectedChat.messages[0].created);
            qs += '&limit=20';

            Message.get(qs, function (err, messages) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                if (!messages.length) {
                    return;
                }
                // Messages are sorted descending from the server, to capture
                // the latest ones. So to get the most recent on the bottom, 
                // the array gets reversed.
                messages.reverse();
                $scope.selectedChat.messages = messages.concat($scope.selectedChat.messages);
                $timeout(function () {
                    paddTopScroll(20);
                });
            });
        };

        $scope.onDropUpload = function (files) {
            $log.debug('drag and drop ', files.length, 'files');
            files.forEach(function (data) {
                $log.debug(data.name, data.contentType);
                $scope.pendingUploads++;
                File.create({
                    contentType: data.contentType,
                    content: data.content,
                    name: data.name
                }, onAfterUpload);
            });
        };

        $scope.onPasteUpload = function (data) {
            $log.debug('paste upload', data.contentType);
            $scope.pendingUploads++;
            File.create({
                contentType: data.contentType,
                content: data.content
            }, onAfterUpload);
        };

        function onAfterUpload(err, file) {
            $scope.pendingUploads--;
            if (err) {
                $rootScope.notifications.push(err);
                return;
            }
            
            renderFile(file, function (err, messageText) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                $scope.sendMessage(messageText, file._id);
            });
        }

    }
];
