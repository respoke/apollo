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

        // prevent global scope from creating a second connection to respoke
        $rootScope.doNotConnectRespoke = true;

        $scope.$window = $window;
        $rootScope.client = $window.opener.client;
        $rootScope.recents = $window.opener.recents;

        $scope.errorMessage = "";
        $scope.moment = moment;
        $scope.showFullChat = true;

        $scope.selectedChat = $window.opener.activeCall.chat;
        $scope.activeCall = $window.opener.activeCall;

        var cleanUpCall = function (evt) {
            $log.debug('got hangup');
            respokeVideo.cleanup();
            $scope.errorMessage = "The call has ended.";
        };

        var privateChatMessageListener = function (evt) {
            scrollChatToBottom();
        };
        $window.opener.activeCall.ignore(privateChatMessageListener);
        $window.opener.activeCall.listen('message', privateChatMessageListener);

        $window.opener.activeCall.listen('hangup', cleanUpCall);

        respokeVideo.setLocalVideo($scope.activeCall.outgoingMedia.stream);
        respokeVideo.setRemoteVideo($scope.activeCall.incomingMedia.stream);

        $scope.hangup = function () {
            if ($window.opener.activeCall.hangup) {
                $window.opener.activeCall.hangup();
            }
            $window.opener.activeCall = null;
            $window.close();
        };
    }
];
