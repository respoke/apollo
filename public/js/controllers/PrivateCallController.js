/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
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
