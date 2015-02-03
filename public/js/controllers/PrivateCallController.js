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

    'respokeVideo',
    'moment',
    'scrollChatToBottom',

    function PrivateCallController($log, $rootScope, $scope, respokeVideo, moment, scrollChatToBottom) {

        if (!window.opener || !window.opener.activeCall || !window.opener.client) {
            $scope.errorMessage = "There is no active call. It may have ended.";
            return;
        }

        $scope.hideCallPanel = true;

        $scope.isScreensharing = false;
        $scope.tryingToScreenshare = false;

        $scope.needsChromeExtension = function () {
            return window.respoke.needsChromeExtension;
        };
        $scope.hasChromeExtension = function () {
            return window.respoke.hasChromeExtension;
        };
        $scope.screenshareAvailable = function () {
            return $scope.needsChromeExtension() || $scope.hasChromeExtension();
        };
        $scope.showPromptInstall = false;

        // prevent global scope from creating a second connection to respoke
        $rootScope.doNotConnectRespoke = true;

        $scope.window = window;
        $rootScope.client = window.opener.client;
        $rootScope.recents = window.opener.recents;

        $scope.errorMessage = "";
        $scope.moment = moment;
        $scope.showFullChat = true;

        $scope.activeCall = window.opener.activeCall;
        $scope.selectedChat = $scope.activeCall.chat;

        var cleanUpCall = function (evt) {
            $log.debug('got hangup');
            respokeVideo.cleanup();
            $scope.errorMessage = "The call has ended.";
            window.opener.activeCall = null;
            $scope.$apply();
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
            window.opener.activeCall = null;
            window.close();
        };

        $scope.screenshare = function () {
            if (!$scope.hasChromeExtension() && $scope.needsChromeExtension()) {
                $scope.showPromptInstall = true;
                return;
            }
            doScreenshare();
        };

        var doScreenshare = function () {
            $scope.isScreensharing = true;
            $scope.tryingToScreenshare = true;

            window.opener.activeLocalScreenshare = $scope.activeCall.remoteEndpoint.startScreenShare({
                onConnect: function (evt) {
                    $scope.tryingToScreenshare = false;
                    $log.debug('doScreenshare onConnect', evt);
                    respokeVideo.setLocalVideo(evt.target.outgoingMedia.stream);
                    $scope.$apply();
                },
                onHangup: function (evt) {
                    $scope.tryingToScreenshare = false;
                    $log.error('doScreenshare onHangup', evt);
                    $scope.isScreensharing = false;
                    $scope.$apply();
                },
                onError: function (evt) {
                    $scope.tryingToScreenshare = false;
                    $log.error('doScreenshare onError', evt);
                    $scope.isScreensharing = false;
                    $scope.errorMessage = "An error occurred during screenshare.";
                    $scope.$apply();
                }
            });
            $log.debug('starting screenshare', window.opener.activeLocalScreenshare);
        };

        $scope.stopScreenshare = function () {
            $scope.tryingToScreenshare = false;
            // end screenshare call
            $scope.isScreensharing = false;
            // reset local screen display
            window.opener.activeLocalScreenshare.hangup();
            respokeVideo.setLocalVideo($scope.activeCall.outgoingMedia.stream);
        };

        // the other party added a screenshare
        window.opener.client.listen('screenshare-added', function () {
            $log.debug('screenshare-added');
            respokeVideo.setRemoteVideo(window.opener.activeRemoteScreenshare.incomingMedia.stream);
        });
        // the other party removed their screenshare
        window.opener.client.listen('screenshare-removed', function () {
            $log.debug('screenshare-removed');
            respokeVideo.setRemoteVideo($scope.activeCall.incomingMedia.stream);
        });

    }
];
