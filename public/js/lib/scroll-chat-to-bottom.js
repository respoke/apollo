'use strict';
/**
 * A utility function to scroll the chat window to the bottom,
 * as long as it is not disabled in root scope. Things will 
 * want to scroll to the bottom of the chat when new messages
 * appear and images inside messages load.
 * 
 * Scrolling gets disabled in root scope, for example, in 
 * situations like the user scrolling up - away from the bottom.
 */
exports = module.exports = ['$rootScope', function ($rootScope) {
    var scrollChatToBottom = function (force) {
        var chat = document.getElementById('chat');
        console.log(chat.scrollHeight, scrollHeight);
        if (force || chat.scrollHeight < 1000 || !$rootScope.autoScrollDisabled) {
            chat.scrollTop = chat.scrollHeight;
        }
    };
    return scrollChatToBottom;
}];
