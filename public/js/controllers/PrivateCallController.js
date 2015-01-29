/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
exports = module.exports = [
    '$log',
    '$rootScope',
    '$scope',
    '$window',

    'respokeVideo',
    'moment',
    'scrollChatToBottom',

    function ($log, $rootScope, $scope, $window, respokeVideo, moment, scrollChatToBottom) {

        if (!$window.opener || !$window.opener.activeCall) {
            $scope.errorMessage = "The call is already over.";
            return;
        }

        $scope.hideCallPanel = true;

        $scope.isScreensharing = false;
        $scope.needsChromeExtension = $window.respoke.needsChromeExtension;
        $scope.hasChromeExtension = $window.respoke.hasChromeExtension;
        $scope.screenshareAvailable = $scope.needsChromeExtension || $scope.hasChromeExtension;
        $scope.showPromptInstall = false;

        // prevent global scope from creating a second connection to respoke
        $rootScope.doNotConnectRespoke = true;

        $scope.$window = $window;
        $rootScope.client = $window.opener.client;
        $rootScope.recents = $window.opener.recents;

        $scope.errorMessage = "";
        $scope.moment = moment;
        $scope.showFullChat = true;

        $scope.activeCall = $window.opener.activeCall;
        $scope.selectedChat = $scope.activeCall.chat;

        var cleanUpCall = function (evt) {
            $log.debug('got hangup');
            respokeVideo.cleanup();
            $scope.errorMessage = "The call has ended.";
        };

        var privateChatMessageListener = function (evt) {
            scrollChatToBottom();
        };
        $scope.activeCall.ignore(privateChatMessageListener);
        $scope.activeCall.listen('message', privateChatMessageListener);

        $scope.activeCall.listen('hangup', cleanUpCall);

        respokeVideo.setLocalVideo($scope.activeCall.outgoingMedia.stream);
        respokeVideo.setRemoteVideo($scope.activeCall.incomingMedia.stream);

        $scope.hangup = function () {
            if ($scope.activeCall.hangup) {
                $scope.activeCall.hangup();
            }
            $window.opener.activeCall = null;
            $window.close();
        };

        $scope.screenshare = function () {
            if ($scope.needsChromeExtension) {
                $scope.showPromptInstall = true;
                return;
            }
            doScreenshare();
        };

        var doScreenshare = function () {
            $scope.activeCall.remoteEndpoint.startScreenShare({
                onConnect: function (evt) {

                },
                onError: function (evt) {
                    
                }
            });
        };

        $scope.stopScreenshare = function () {

        };

    }
];
