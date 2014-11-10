/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
'use strict';
/**
 * A utility function to scroll the chat window to the bottom,
 * as long as it is not disabled in root scope. Things will
 * want to scroll to the bottom of the chat when new messages
 * appear and images inside messages load.
 *
 * Scrolling gets disabled in root scope, for example, in
 * situations like the user scrolling up - away from the bottom.
 *
 * This thing is not perfect. Honestly, it sucks, and has been
 * built and rebuilt many times.
 */
exports = module.exports = ['$rootScope', function ($rootScope) {
    return function scrollChatToBottom(force) {
        // injected $document does not have 'getElementById'
        var chat = document.getElementById('chat');

        if (force === false) {
            chat.scrollTop = 0;
        }
        else if (force || !$rootScope.autoScrollDisabled) {
            chat.scrollTop = chat.scrollHeight;
        }
    };
}];
